"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  createPayoutDashboardLink,
  createPayoutOnboardingLink,
  disconnectPayoutAccount,
  getPayoutAccountStatus,
  refreshPayoutAccountFromStripe,
} from "@/lib/services/payout-service";
import type { PayoutAccountStatus } from "@/types/payout";

export type PayoutActionErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

export type PayoutActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: PayoutActionErrorCode; message: string };

async function requireUser(): Promise<
  PayoutActionResult<{ id: string; email: string }>
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "You must be signed in to manage payout settings.",
    };
  }

  return { success: true, data: user };
}

export async function getPayoutStatusAction(): Promise<
  PayoutActionResult<{ status: PayoutAccountStatus }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const status = await getPayoutAccountStatus(auth.data.id);
    return { success: true, data: { status } };
  } catch (error) {
    console.error("[getPayoutStatusAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load payout settings.",
    };
  }
}

export async function refreshPayoutStatusAction(): Promise<
  PayoutActionResult<{ status: PayoutAccountStatus }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const status = await refreshPayoutAccountFromStripe(auth.data.id);
    return { success: true, data: { status } };
  } catch (error) {
    console.error("[refreshPayoutStatusAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to refresh payout account.",
    };
  }
}

export async function startPayoutConnectAction(): Promise<
  PayoutActionResult<{ url: string }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const url = await createPayoutOnboardingLink(auth.data.id, auth.data.email);
    return { success: true, data: { url } };
  } catch (error) {
    console.error("[startPayoutConnectAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to start payout account setup.",
    };
  }
}

export async function openPayoutDashboardAction(): Promise<
  PayoutActionResult<{ url: string }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const url = await createPayoutDashboardLink(auth.data.id);
    return { success: true, data: { url } };
  } catch (error) {
    console.error("[openPayoutDashboardAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to open payout dashboard.",
    };
  }
}

const disconnectSchema = z.object({
  confirm: z.literal(true),
});

export async function disconnectPayoutAction(
  input: z.infer<typeof disconnectSchema>
): Promise<PayoutActionResult<{ disconnected: true }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = disconnectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Confirmation required to disconnect payout account.",
    };
  }

  try {
    await disconnectPayoutAccount(auth.data.id);
    return { success: true, data: { disconnected: true } };
  } catch (error) {
    console.error("[disconnectPayoutAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to disconnect payout account.",
    };
  }
}
