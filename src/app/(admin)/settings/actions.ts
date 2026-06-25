"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  getCredentialSecretByLookupKey,
  listCredentialMetadata,
  revokeCredential,
  storeCredential,
} from "@/lib/services/credential-service";
import {
  getTikTokServerEnvStatus,
  parseTikTokShopCredentialJson,
  serializeTikTokShopCredential,
  validateTikTokShopCredentialFields,
  type TikTokShopCredentialFields,
} from "@/lib/tiktok/credential-format";
import { parseTikTokShopCredentials } from "@/lib/tiktok/shop-client";
import { testTikTokShopConnection } from "@/lib/tiktok/shop-request";
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

const saveTikTokShopCredentialInputSchema = z.object({
  accessToken: z.string().max(4096),
  appKey: z.string().max(512).optional(),
  appSecret: z.string().max(512).optional(),
  shopCipher: z.string().max(512).optional(),
});

const saveTikTokShopJsonCredentialInputSchema = z.object({
  rawJson: z.string().min(1, "Paste your credential JSON").max(8192),
});

export interface TikTokSetupStatus {
  serverEnv: ReturnType<typeof getTikTokServerEnvStatus>;
  storedCredential: {
    configured: boolean;
    credentialId: string | null;
    maskedKey: string | null;
  };
}

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

export async function getTikTokSetupStatusAction(): Promise<
  SettingsActionResult<TikTokSetupStatus>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const credentials = await listCredentialMetadata(auth.data.id);
    const tiktokCredential = credentials.find(
      (credential) => credential.provider === "tiktok_shop"
    );

    return {
      success: true,
      data: {
        serverEnv: getTikTokServerEnvStatus(),
        storedCredential: {
          configured: Boolean(tiktokCredential),
          credentialId: tiktokCredential?.id ?? null,
          maskedKey: tiktokCredential?.maskedKey ?? null,
        },
      },
    };
  } catch (error) {
    console.error("[getTikTokSetupStatusAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load TikTok Shop setup status.",
    };
  }
}

export async function saveTikTokShopCredentialAction(
  input: z.infer<typeof saveTikTokShopCredentialInputSchema>
): Promise<SettingsActionResult<{ id: string }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = saveTikTokShopCredentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const envStatus = getTikTokServerEnvStatus();
  const validated = validateTikTokShopCredentialFields(
    parsed.data as TikTokShopCredentialFields,
    envStatus
  );

  if (!validated.ok) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: validated.message,
    };
  }

  const secret = serializeTikTokShopCredential(validated.data);

  try {
    const id = await storeCredential(auth.data.id, {
      provider: "tiktok_shop",
      lookupKey: PROVIDER_LOOKUP_KEYS.tiktok_shop,
      secret,
      name: CREDENTIAL_PROVIDER_LABELS.tiktok_shop,
    });

    revalidatePath("/settings");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[saveTikTokShopCredentialAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to save TikTok Shop credentials securely.",
    };
  }
}

export async function saveTikTokShopJsonCredentialAction(
  input: z.infer<typeof saveTikTokShopJsonCredentialInputSchema>
): Promise<SettingsActionResult<{ id: string }>> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  const parsed = saveTikTokShopJsonCredentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const envStatus = getTikTokServerEnvStatus();
  const validated = parseTikTokShopCredentialJson(parsed.data.rawJson, envStatus);

  if (!validated.ok) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: validated.message,
    };
  }

  const secret = serializeTikTokShopCredential(validated.data);

  try {
    const id = await storeCredential(auth.data.id, {
      provider: "tiktok_shop",
      lookupKey: PROVIDER_LOOKUP_KEYS.tiktok_shop,
      secret,
      name: CREDENTIAL_PROVIDER_LABELS.tiktok_shop,
    });

    revalidatePath("/settings");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[saveTikTokShopJsonCredentialAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to save TikTok Shop credentials securely.",
    };
  }
}

export async function testTikTokConnectionAction(): Promise<
  SettingsActionResult<{ ok: boolean; message: string; shopName?: string }>
> {
  const auth = await requireUser();
  if (!auth.success) return auth;

  try {
    const secret = await getCredentialSecretByLookupKey(
      auth.data.id,
      "tiktok_shop:primary"
    );
    const credentials = secret ? parseTikTokShopCredentials(secret) : null;
    const result = await testTikTokShopConnection(credentials);

    return {
      success: true,
      data: {
        ok: result.ok,
        message: result.message,
        shopName: result.shopName,
      },
    };
  } catch (error) {
    console.error("[testTikTokConnectionAction]", error);
    return {
      success: false,
      code: "SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "TikTok Shop API connection test failed.",
    };
  }
}
