import { getSiteUrl } from "@/lib/supabase/env";
import { DISCORD_ORDER_WEBHOOK_LOOKUP_KEY } from "@/lib/notifications/discord-constants";
import {
  buildExampleOrderPlacedEmbed,
  buildOrderPlacedEmbed,
  isValidDiscordWebhookUrl,
  postDiscordWebhook,
} from "@/lib/notifications/discord-webhook";
import {
  getCredentialSecretByLookupKey,
  listCredentials,
} from "@/lib/services/credential-service";
import { resolveOrderLineItemDetails } from "@/lib/services/order-product-details";

export interface DiscordWebhookStatus {
  configured: boolean;
  credentialId: string | null;
  maskedKey: string | null;
}

export async function getDiscordWebhookStatus(
  userId: string
): Promise<DiscordWebhookStatus> {
  const credentials = await listCredentials(userId);
  const discordCredential = credentials.find(
    (credential) =>
      credential.lookup_key === DISCORD_ORDER_WEBHOOK_LOOKUP_KEY &&
      credential.is_active
  );

  if (!discordCredential) {
    return {
      configured: false,
      credentialId: null,
      maskedKey: null,
    };
  }

  return {
    configured: true,
    credentialId: discordCredential.id,
    maskedKey: discordCredential.key_hint,
  };
}

async function getDiscordWebhookUrl(userId: string): Promise<string | null> {
  const secret = await getCredentialSecretByLookupKey(
    userId,
    DISCORD_ORDER_WEBHOOK_LOOKUP_KEY
  );

  if (!secret || !isValidDiscordWebhookUrl(secret)) {
    return null;
  }

  return secret.trim();
}

export async function notifyDiscordOrderPlaced(input: {
  userId: string;
  productId: string | null;
  tiktokOrderId: string;
  orderTotal: number | null;
  currency: string;
  shipDeadlineIso: string;
}): Promise<void> {
  const webhookUrl = await getDiscordWebhookUrl(input.userId);
  if (!webhookUrl) {
    return;
  }

  const lineItem = await resolveOrderLineItemDetails(
    input.productId,
    input.orderTotal,
    input.currency
  );

  const ordersUrl = `${getSiteUrl()}/orders`;
  const payload = buildOrderPlacedEmbed({
    tiktokOrderId: input.tiktokOrderId,
    productName: lineItem.productName,
    orderTotal: input.orderTotal,
    grossProfit: lineItem.grossProfit,
    platformFeeAmount: lineItem.platformFeeAmount,
    platformFeePercent: lineItem.platformFeePercent,
    netProfit: lineItem.netProfit,
    grossMarginPercent: lineItem.grossMarginPercent,
    netMarginPercent: lineItem.netMarginPercent,
    currency: lineItem.currency,
    shipDeadlineIso: input.shipDeadlineIso,
    ordersUrl,
  });

  await postDiscordWebhook(webhookUrl, payload);
}

export async function sendDiscordTestNotification(
  userId: string
): Promise<void> {
  const webhookUrl = await getDiscordWebhookUrl(userId);
  if (!webhookUrl) {
    throw new Error("Discord webhook is not configured");
  }

  await postDiscordWebhook(
    webhookUrl,
    buildExampleOrderPlacedEmbed(`${getSiteUrl()}/orders`)
  );
}

export { isValidDiscordWebhookUrl };
