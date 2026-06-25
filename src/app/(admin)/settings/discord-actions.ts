"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { DISCORD_ORDER_WEBHOOK_LOOKUP_KEY } from "@/lib/notifications/discord-constants";
import {
  getDiscordWebhookStatus,
  isValidDiscordWebhookUrl,
  sendDiscordTestNotification,
  type DiscordWebhookStatus,
} from "@/lib/services/discord-notification-service";
import {
  revokeCredential,
  storeCredential,
} from "@/lib/services/credential-service";
import type { SettingsActionResult } from "@/app/(admin)/settings/actions";

const discordWebhookUrlSchema = z
  .string()
  .trim()
  .min(1, "Webhook URL is required")
  .max(512, "Webhook URL is too long")
  .refine(isValidDiscordWebhookUrl, {
    message:
      "Enter a valid Discord webhook URL (https://discord.com/api/webhooks/...)",
  });

async function requireUser(): Promise<
  SettingsActionResult<{ id: string; email: string }>
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "You must be signed in to manage notifications.",
    };
  }

  return { success: true, data: user };
}

export async function getDiscordWebhookStatusAction(): Promise<
  SettingsActionResult<{ status: DiscordWebhookStatus }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const status = await getDiscordWebhookStatus(auth.data.id);
    return { success: true, data: { status } };
  } catch (error) {
    console.error("[getDiscordWebhookStatusAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load Discord webhook settings.",
    };
  }
}

export async function saveDiscordWebhookAction(input: {
  webhookUrl: string;
}): Promise<SettingsActionResult<{ id: string }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = discordWebhookUrlSchema.safeParse(input.webhookUrl);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid webhook URL",
    };
  }

  try {
    const id = await storeCredential(auth.data.id, {
      provider: "custom",
      lookupKey: DISCORD_ORDER_WEBHOOK_LOOKUP_KEY,
      secret: parsed.data,
      name: "Discord order notifications",
      metadata: { purpose: "order_notifications" },
    });

    revalidatePath("/settings");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("[saveDiscordWebhookAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to save Discord webhook.",
    };
  }
}

export async function removeDiscordWebhookAction(): Promise<
  SettingsActionResult<{ removed: true }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const status = await getDiscordWebhookStatus(auth.data.id);
    if (!status.credentialId) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        message: "No Discord webhook is configured.",
      };
    }

    await revokeCredential(auth.data.id, status.credentialId);
    revalidatePath("/settings");
    return { success: true, data: { removed: true } };
  } catch (error) {
    console.error("[removeDiscordWebhookAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to remove Discord webhook.",
    };
  }
}

export async function testDiscordWebhookAction(): Promise<
  SettingsActionResult<{ sent: true }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    await sendDiscordTestNotification(auth.data.id);
    return { success: true, data: { sent: true } };
  } catch (error) {
    console.error("[testDiscordWebhookAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to send test notification.",
    };
  }
}
