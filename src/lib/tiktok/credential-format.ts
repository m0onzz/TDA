import { z } from "zod";

export const TIKTOK_PARTNER_CENTER_URL = "https://partner.tiktokshop.com/";
export const TIKTOK_APP_CREDENTIALS_DOC_URL =
  "https://partner.tiktokshop.com/docv2/page/774732973365514241";

export interface TikTokShopCredentialFields {
  accessToken: string;
  appKey?: string;
  appSecret?: string;
  shopCipher?: string;
}

export interface TikTokServerEnvStatus {
  hasAppKey: boolean;
  hasAppSecret: boolean;
  hasAppCredentials: boolean;
  simulatePublish: boolean;
}

export function getTikTokServerEnvStatus(): TikTokServerEnvStatus {
  const hasAppKey = Boolean(process.env.TIKTOK_APP_KEY?.trim());
  const hasAppSecret = Boolean(process.env.TIKTOK_APP_SECRET?.trim());

  return {
    hasAppKey,
    hasAppSecret,
    hasAppCredentials: hasAppKey && hasAppSecret,
    simulatePublish: process.env.TIKTOK_SHOP_SIMULATE_PUBLISH === "true",
  };
}

const tikTokShopFieldsSchema = z.object({
  accessToken: z
    .string()
    .trim()
    .min(1, "Access token is required. Copy it from TikTok Shop Partner Center after authorizing your shop."),
  appKey: z.string().trim().optional(),
  appSecret: z.string().trim().optional(),
  shopCipher: z.string().trim().optional(),
});

export function serializeTikTokShopCredential(
  fields: TikTokShopCredentialFields
): string {
  const payload: Record<string, string> = {
    access_token: fields.accessToken.trim(),
  };

  if (fields.appKey?.trim()) {
    payload.app_key = fields.appKey.trim();
  }

  if (fields.appSecret?.trim()) {
    payload.app_secret = fields.appSecret.trim();
  }

  if (fields.shopCipher?.trim()) {
    payload.shop_cipher = fields.shopCipher.trim();
  }

  return JSON.stringify(payload);
}

export function validateTikTokShopCredentialFields(
  fields: TikTokShopCredentialFields,
  envStatus: TikTokServerEnvStatus = getTikTokServerEnvStatus()
): { ok: true; data: TikTokShopCredentialFields } | { ok: false; message: string } {
  const parsed = tikTokShopFieldsSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid TikTok Shop credentials.",
    };
  }

  const data = parsed.data;
  const needsAppKey = !envStatus.hasAppKey && !data.appKey;
  const needsAppSecret = !envStatus.hasAppSecret && !data.appSecret;

  if (needsAppKey && needsAppSecret) {
    return {
      ok: false,
      message:
        "App Key and App Secret are required. Paste them below, or ask whoever hosts this app to set TIKTOK_APP_KEY and TIKTOK_APP_SECRET on the server.",
    };
  }

  if (needsAppKey) {
    return {
      ok: false,
      message:
        "App Key is required. Paste it below, or set TIKTOK_APP_KEY on the server (App Secret is already configured there).",
    };
  }

  if (needsAppSecret) {
    return {
      ok: false,
      message:
        "App Secret is required. Paste it below, or set TIKTOK_APP_SECRET on the server (App Key is already configured there).",
    };
  }

  return { ok: true, data };
}

const tikTokShopJsonSchema = z
  .object({
    access_token: z.string().trim().min(1).optional(),
    accessToken: z.string().trim().min(1).optional(),
    token: z.string().trim().min(1).optional(),
    app_key: z.string().trim().optional(),
    appKey: z.string().trim().optional(),
    app_secret: z.string().trim().optional(),
    appSecret: z.string().trim().optional(),
    shop_cipher: z.string().trim().optional(),
    shopCipher: z.string().trim().optional(),
  })
  .refine(
    (value) =>
      Boolean(value.access_token ?? value.accessToken ?? value.token),
  );

export function parseTikTokShopCredentialJson(
  rawJson: string,
  envStatus: TikTokServerEnvStatus = getTikTokServerEnvStatus()
): { ok: true; data: TikTokShopCredentialFields } | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson.trim());
  } catch {
    return {
      ok: false,
      message:
        "Invalid JSON. Use the Quick setup fields above, or paste valid JSON in Advanced setup.",
    };
  }

  const result = tikTokShopJsonSchema.safeParse(parsed);

  if (!result.success) {
    return {
      ok: false,
      message:
        "JSON must include access_token (or accessToken). See the example in Advanced setup.",
    };
  }

  const value = result.data;

  return validateTikTokShopCredentialFields(
    {
      accessToken:
        value.access_token ?? value.accessToken ?? value.token ?? "",
      appKey: value.app_key ?? value.appKey,
      appSecret: value.app_secret ?? value.appSecret,
      shopCipher: value.shop_cipher ?? value.shopCipher,
    },
    envStatus
  );
}

export function describeMissingTikTokCredentials(
  envStatus: TikTokServerEnvStatus = getTikTokServerEnvStatus()
): string {
  if (envStatus.simulatePublish) {
    return "TikTok publishing is in simulation mode (TIKTOK_SHOP_SIMULATE_PUBLISH=true). Live API calls are disabled on this server.";
  }

  if (envStatus.hasAppCredentials) {
    return "Save your TikTok Shop access token in Settings. App Key and App Secret are already configured on the server.";
  }

  if (envStatus.hasAppKey || envStatus.hasAppSecret) {
    const missing = envStatus.hasAppKey ? "App Secret" : "App Key";
    return `Save your access token and ${missing} in Settings, or set TIKTOK_APP_${envStatus.hasAppKey ? "SECRET" : "KEY"} on the server.`;
  }

  return "Save your TikTok Shop access token, App Key, and App Secret in Settings (or set TIKTOK_APP_KEY and TIKTOK_APP_SECRET on the server).";
}
