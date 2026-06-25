import type { TikTokShopCredentials } from "@/lib/tiktok/shop-client";
import {
  buildTikTokShopTimestamp,
  signTikTokShopRequest,
} from "@/lib/tiktok/request-sign";

const API_VERSION = "202309";

export class TikTokShopApiError extends Error {
  readonly code?: number;
  readonly requestId?: string;

  constructor(message: string, options?: { code?: number; requestId?: string }) {
    super(message);
    this.name = "TikTokShopApiError";
    this.code = options?.code;
    this.requestId = options?.requestId;
  }
}

export interface ResolvedTikTokShopCredentials extends TikTokShopCredentials {
  appKey: string;
  appSecret: string;
}

export function getTikTokShopApiBaseUrl(): string {
  return (
    process.env.TIKTOK_SHOP_API_BASE_URL ??
    "https://open-api.tiktokglobalshop.com"
  );
}

/**
 * Merges user-stored credentials with server env fallbacks.
 */
export function resolveTikTokShopCredentials(
  credentials: TikTokShopCredentials | null
): ResolvedTikTokShopCredentials | null {
  if (!credentials?.accessToken) {
    return null;
  }

  const appKey =
    credentials.appKey?.trim() || process.env.TIKTOK_APP_KEY?.trim() || "";
  const appSecret =
    credentials.appSecret?.trim() ||
    process.env.TIKTOK_APP_SECRET?.trim() ||
    "";

  if (!appKey || !appSecret) {
    return null;
  }

  return {
    ...credentials,
    appKey,
    appSecret,
  };
}

export function isLiveTikTokShopConfigured(
  credentials: TikTokShopCredentials | null
): boolean {
  return resolveTikTokShopCredentials(credentials) !== null;
}

function buildSignedUrl(
  credentials: ResolvedTikTokShopCredentials,
  path: string,
  extraQuery: Record<string, string> = {},
  body?: string
): string {
  const timestamp = buildTikTokShopTimestamp();
  const queryParams: Record<string, string> = {
    app_key: credentials.appKey,
    timestamp,
    shop_cipher: credentials.shopCipher ?? "",
    shop_id: credentials.shopId ?? "",
    ...extraQuery,
  };

  const sign = signTikTokShopRequest({
    path,
    queryParams,
    body,
    appSecret: credentials.appSecret,
  });

  const search = new URLSearchParams({
    ...queryParams,
    sign,
    access_token: credentials.accessToken,
  });

  return `${getTikTokShopApiBaseUrl()}${path}?${search.toString()}`;
}

interface TikTokApiEnvelope<T> {
  code?: number;
  message?: string;
  request_id?: string;
  data?: T;
}

export async function tikTokShopRequest<T>(
  credentials: ResolvedTikTokShopCredentials,
  path: string,
  init?: RequestInit & { extraQuery?: Record<string, string> }
): Promise<T> {
  const method = init?.method ?? "GET";
  const body =
    init?.body && typeof init.body === "string" ? init.body : undefined;

  const url = buildSignedUrl(
    credentials,
    path,
    init?.extraQuery ?? {},
    method === "GET" ? undefined : body
  );

  const response = await fetch(url, {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": credentials.accessToken,
      ...(init?.headers ?? {}),
    },
    body,
  });

  const json = (await response.json()) as TikTokApiEnvelope<T>;

  if (!response.ok || json.code !== 0) {
    throw new TikTokShopApiError(
      json.message ?? `TikTok Shop API error (${response.status})`,
      { code: json.code, requestId: json.request_id }
    );
  }

  if (json.data === undefined) {
    throw new TikTokShopApiError("TikTok Shop API returned an empty payload", {
      code: json.code,
      requestId: json.request_id,
    });
  }

  return json.data;
}

export interface TikTokAuthorizedShop {
  shopId: string;
  shopCipher: string;
  shopName: string;
}

export async function listAuthorizedTikTokShops(
  credentials: ResolvedTikTokShopCredentials
): Promise<TikTokAuthorizedShop[]> {
  const data = await tikTokShopRequest<{
    shops?: Array<{
      id?: string;
      cipher?: string;
      name?: string;
      shop_id?: string;
      shop_cipher?: string;
      shop_name?: string;
    }>;
  }>(credentials, `/authorization/${API_VERSION}/shops`);

  return (data.shops ?? [])
    .map((shop) => ({
      shopId: String(shop.shop_id ?? shop.id ?? ""),
      shopCipher: String(shop.shop_cipher ?? shop.cipher ?? ""),
      shopName: String(shop.shop_name ?? shop.name ?? "TikTok Shop"),
    }))
    .filter((shop) => shop.shopId && shop.shopCipher);
}

export async function ensureShopCipher(
  credentials: ResolvedTikTokShopCredentials
): Promise<ResolvedTikTokShopCredentials> {
  if (credentials.shopCipher) {
    return credentials;
  }

  const shops = await listAuthorizedTikTokShops(credentials);
  const first = shops[0];

  if (!first) {
    throw new TikTokShopApiError(
      "No authorized TikTok Shop found for this access token. Re-authorize your app in TikTok Shop Partner Center."
    );
  }

  return {
    ...credentials,
    shopId: credentials.shopId ?? first.shopId,
    shopCipher: first.shopCipher,
  };
}

export async function testTikTokShopConnection(
  credentials: TikTokShopCredentials | null
): Promise<{
  ok: boolean;
  mode: "live" | "not_configured";
  shopName?: string;
  shopCipher?: string;
  message: string;
}> {
  const resolved = resolveTikTokShopCredentials(credentials);

  if (!resolved) {
    return {
      ok: false,
      mode: "not_configured",
      message:
        "Missing TikTok credentials. Save access_token plus app_key and app_secret (JSON), or set TIKTOK_APP_KEY and TIKTOK_APP_SECRET on the server.",
    };
  }

  const withShop = await ensureShopCipher(resolved);
  const shops = await listAuthorizedTikTokShops(withShop);
  const shop =
    shops.find((item) => item.shopCipher === withShop.shopCipher) ?? shops[0];

  return {
    ok: true,
    mode: "live",
    shopName: shop?.shopName,
    shopCipher: withShop.shopCipher,
    message: shop
      ? `Connected to ${shop.shopName}. TikTok Shop API is responding.`
      : "TikTok Shop API is responding.",
  };
}
