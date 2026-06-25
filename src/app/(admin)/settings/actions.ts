"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  listCredentialMetadata,
  revokeCredential,
  storeCredential,
} from "@/lib/services/credential-service";
import type { CredentialMetadata } from "@/lib/credentials/metadata";
import type { CredentialProvider } from "@/types/credentials";
import { CREDENTIAL_PROVIDER_LABELS } from "@/types/credentials";

export type SettingsActionErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

export type SettingsActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: SettingsActionErrorCode; message: string };

const PROVIDER_LOOKUP_KEYS: Record<CredentialProvider, string> = {
  tiktok_shop: "tiktok_shop:primary",
  openai: "openai:primary",
  anthropic: "anthropic:primary",
  supplier: "supplier:primary",
  custom: "custom:primary",
};

const saveCredentialInputSchema = z.object({
  provider: z.enum([
    "tiktok_shop",
    "openai",
    "anthropic",
    "supplier",
    "custom",
  ]),
  secret: z.string().min(1, "API key is required").max(8192),
});

const revokeCredentialInputSchema = z.object({
  id: z.string().uuid("Invalid credential id"),
});

async function requireUser(): Promise<
  SettingsActionResult<{ id: string; email: string }>
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "You must be signed in to manage credentials.",
    };
  }

  return { success: true, data: user };
}

export async function getCredentialsAction(): Promise<
  SettingsActionResult<{ credentials: CredentialMetadata[] }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const credentials = await listCredentialMetadata(auth.data.id);
    return { success: true, data: { credentials } };
  } catch (error) {
    console.error("[getCredentialsAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load stored credentials.",
    };
  }
}

export async function saveCredentialAction(
  input: z.infer<typeof saveCredentialInputSchema>
): Promise<SettingsActionResult<{ id: string }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = saveCredentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { provider, secret } = parsed.data;
  const lookupKey = PROVIDER_LOOKUP_KEYS[provider];

  try {
    const id = await storeCredential(auth.data.id, {
      provider,
      lookupKey,
      secret,
      name: CREDENTIAL_PROVIDER_LABELS[provider],
    });

    revalidatePath("/settings");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[saveCredentialAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to save credential securely.",
    };
  }
}

export async function revokeCredentialAction(
  input: z.infer<typeof revokeCredentialInputSchema>
): Promise<SettingsActionResult<{ revoked: true }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = revokeCredentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await revokeCredential(auth.data.id, parsed.data.id);
    revalidatePath("/settings");
    return { success: true, data: { revoked: true } };
  } catch (error) {
    console.error("[revokeCredentialAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to revoke credential.",
    };
  }
}
