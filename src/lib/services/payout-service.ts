import type Stripe from "stripe";
import { getSiteUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";
import type {
  PayoutAccountStatus,
  PayoutConnectionStatus,
  PayoutDestinationSummary,
  StoredPayoutSettings,
} from "@/types/payout";
import type { Json } from "@/types/database";

const DEFAULT_PAYOUT_SETTINGS: StoredPayoutSettings = {
  status: "not_connected",
  payoutsEnabled: false,
  detailsSubmitted: false,
  destination: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredPayoutSettings(storeSettings: Json | null): StoredPayoutSettings {
  if (!isRecord(storeSettings) || !isRecord(storeSettings.payout)) {
    return { ...DEFAULT_PAYOUT_SETTINGS };
  }

  const payout = storeSettings.payout;
  const status = payout.status;

  return {
    stripeAccountId:
      typeof payout.stripeAccountId === "string"
        ? payout.stripeAccountId
        : undefined,
    status:
      status === "pending" ||
      status === "active" ||
      status === "restricted" ||
      status === "not_connected"
        ? status
        : "not_connected",
    payoutsEnabled: payout.payoutsEnabled === true,
    detailsSubmitted: payout.detailsSubmitted === true,
    destination: parseDestination(payout.destination),
    updatedAt:
      typeof payout.updatedAt === "string" ? payout.updatedAt : undefined,
  };
}

function parseDestination(value: unknown): PayoutDestinationSummary | null {
  if (!isRecord(value)) return null;

  const type = value.type;
  const last4 = value.last4;

  if (
    (type !== "card" && type !== "bank_account") ||
    typeof last4 !== "string"
  ) {
    return null;
  }

  return {
    type,
    last4,
    brand: typeof value.brand === "string" ? value.brand : undefined,
    bankName: typeof value.bankName === "string" ? value.bankName : undefined,
  };
}

async function readStoreSettings(userId: string): Promise<Json | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("store_settings")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load payout settings: ${error.message}`);
  }

  return data?.store_settings ?? null;
}

async function writePayoutSettings(
  userId: string,
  payout: StoredPayoutSettings
): Promise<void> {
  const admin = createAdminClient();
  const current = await readStoreSettings(userId);
  const base = isRecord(current) ? { ...current } : {};

  const nextSettings = {
    ...base,
    payout: {
      ...payout,
      updatedAt: new Date().toISOString(),
    },
  };

  const { error } = await admin
    .from("users")
    .update({ store_settings: nextSettings as Json })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to save payout settings: ${error.message}`);
  }
}

function mapStripeStatus(account: Stripe.Account): PayoutConnectionStatus {
  if (!account.details_submitted) {
    return "pending";
  }

  if (account.payouts_enabled) {
    return "active";
  }

  if (account.requirements?.disabled_reason) {
    return "restricted";
  }

  return "pending";
}

function extractDestination(
  account: Stripe.Account
): PayoutDestinationSummary | null {
  const external = account.external_accounts?.data?.[0];

  if (!external) {
    return null;
  }

  if (external.object === "card") {
    return {
      type: "card",
      last4: external.last4 ?? "****",
      brand: external.brand ?? undefined,
    };
  }

  if (external.object === "bank_account") {
    return {
      type: "bank_account",
      last4: external.last4 ?? "****",
      bankName: external.bank_name ?? undefined,
    };
  }

  return null;
}

function toAccountStatus(
  stored: StoredPayoutSettings,
  stripeConfigured: boolean
): PayoutAccountStatus {
  return {
    stripeConfigured,
    connected: Boolean(stored.stripeAccountId),
    status: stored.status,
    payoutsEnabled: stored.payoutsEnabled,
    detailsSubmitted: stored.detailsSubmitted,
    destination: stored.destination ?? null,
    stripeAccountId: stored.stripeAccountId ?? null,
  };
}

export async function getPayoutAccountStatus(
  userId: string
): Promise<PayoutAccountStatus> {
  const stripeConfigured = isStripeConfigured();
  const stored = parseStoredPayoutSettings(await readStoreSettings(userId));
  return toAccountStatus(stored, stripeConfigured);
}

export async function refreshPayoutAccountFromStripe(
  userId: string
): Promise<PayoutAccountStatus> {
  const stripe = getStripeClient();
  const stored = parseStoredPayoutSettings(await readStoreSettings(userId));

  if (!stripe || !stored.stripeAccountId) {
    return toAccountStatus(stored, isStripeConfigured());
  }

  const account = await stripe.accounts.retrieve(stored.stripeAccountId);
  const next: StoredPayoutSettings = {
    stripeAccountId: account.id,
    status: mapStripeStatus(account),
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    destination: extractDestination(account),
  };

  await writePayoutSettings(userId, next);
  return toAccountStatus(next, true);
}

async function ensureStripeConnectAccount(
  userId: string,
  email: string
): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to enable profit payouts."
    );
  }

  const stored = parseStoredPayoutSettings(await readStoreSettings(userId));
  if (stored.stripeAccountId) {
    return stored.stripeAccountId;
  }

  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      tda_user_id: userId,
    },
  });

  const next: StoredPayoutSettings = {
    stripeAccountId: account.id,
    status: "pending",
    payoutsEnabled: false,
    detailsSubmitted: false,
    destination: null,
  };

  await writePayoutSettings(userId, next);
  return account.id;
}

export async function createPayoutOnboardingLink(
  userId: string,
  email: string
): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to enable profit payouts."
    );
  }

  const accountId = await ensureStripeConnectAccount(userId, email);
  const returnUrl = `${getSiteUrl()}/settings?payout=return`;
  const refreshUrl = `${getSiteUrl()}/settings?payout=refresh`;

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  if (!link.url) {
    throw new Error("Stripe did not return an onboarding URL");
  }

  return link.url;
}

export async function createPayoutDashboardLink(
  userId: string
): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const stored = parseStoredPayoutSettings(await readStoreSettings(userId));
  if (!stored.stripeAccountId) {
    throw new Error("Connect a payout account first.");
  }

  const link = await stripe.accounts.createLoginLink(stored.stripeAccountId);
  if (!link.url) {
    throw new Error("Stripe did not return a dashboard URL");
  }

  return link.url;
}

export async function disconnectPayoutAccount(userId: string): Promise<void> {
  await writePayoutSettings(userId, { ...DEFAULT_PAYOUT_SETTINGS });
}
