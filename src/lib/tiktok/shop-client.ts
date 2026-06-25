import { describeMissingTikTokCredentials } from "@/lib/tiktok/credential-format";
import {
  ensureShopCipher,
  resolveTikTokShopCredentials,
  tikTokShopRequest,
  TikTokShopApiError,
} from "@/lib/tiktok/shop-request";

export interface TikTokShopCredentials {
  accessToken: string;
  appKey?: string;
  appSecret?: string;
  shopCipher?: string;
  shopId?: string;
}

export interface TikTokListingInput {
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  imageUrls: string[];
  sellerSku: string;
  stock?: number;
}

export interface TikTokPublishResult {
  tiktokProductId: string;
  tiktokListingUrl: string;
  mode: "simulation" | "live";
}

export interface TikTokUnlistResult {
  mode: "simulation" | "live";
}

export function parseTikTokShopCredentials(
  secret: string
): TikTokShopCredentials | null {
  const trimmed = secret.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, string>;
    const accessToken =
      parsed.access_token ?? parsed.accessToken ?? parsed.token;

    if (!accessToken) return null;

    return {
      accessToken,
      appKey: parsed.app_key ?? parsed.appKey,
      appSecret: parsed.app_secret ?? parsed.appSecret,
      shopCipher: parsed.shop_cipher ?? parsed.shopCipher,
      shopId: parsed.shop_id ?? parsed.shopId,
    };
  } catch {
    return { accessToken: trimmed };
  }
}

function buildSimulationResult(input: TikTokListingInput): TikTokPublishResult {
  const slug = input.sellerSku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const tiktokProductId = `tts_sim_${slug}_${Date.now()}`;

  return {
    tiktokProductId,
    tiktokListingUrl: `https://www.tiktok.com/shop/pdp/${tiktokProductId}`,
    mode: "simulation",
  };
}

function shouldSimulate(credentials: TikTokShopCredentials | null): boolean {
  if (!credentials?.accessToken) {
    return true;
  }

  if (process.env.TIKTOK_SHOP_SIMULATE_PUBLISH === "true") {
    return true;
  }

  return !resolveTikTokShopCredentials(credentials);
}

/**
 * Publishes a product listing to TikTok Shop.
 * Simulates only when credentials are missing or TIKTOK_SHOP_SIMULATE_PUBLISH=true.
 */
export async function publishProductToTikTokShop(
  input: TikTokListingInput,
  credentials: TikTokShopCredentials | null
): Promise<TikTokPublishResult> {
  if (shouldSimulate(credentials)) {
    return buildSimulationResult(input);
  }

  const resolved = resolveTikTokShopCredentials(credentials);
  if (!resolved) {
    throw new TikTokShopApiError(
      `${describeMissingTikTokCredentials()} Live listing requires a complete setup.`
    );
  }

  const active = await ensureShopCipher(resolved);

  const body = JSON.stringify({
    title: input.title.slice(0, 255),
    description: input.description,
    category_id: process.env.TIKTOK_SHOP_DEFAULT_CATEGORY_ID ?? "601450",
    main_images: input.imageUrls.slice(0, 9).map((uri) => ({ uri })),
    skus: [
      {
        seller_sku: input.sellerSku,
        original_price: String(input.price),
        stock_infos: [
          {
            available_stock: input.stock ?? 99,
          },
        ],
      },
    ],
  });

  const data = await tikTokShopRequest<{
    product_id?: string;
    product_url?: string;
  }>(active, "/product/202309/products", {
    method: "POST",
    body,
  });

  if (!data.product_id) {
    throw new TikTokShopApiError("TikTok did not return a product_id");
  }

  const tiktokProductId = String(data.product_id);

  return {
    tiktokProductId,
    tiktokListingUrl:
      data.product_url ??
      `https://www.tiktok.com/shop/pdp/${tiktokProductId}`,
    mode: "live",
  };
}

/**
 * Deactivates a product listing on TikTok Shop.
 */
export async function unlistProductFromTikTokShop(
  tiktokProductId: string,
  credentials: TikTokShopCredentials | null
): Promise<TikTokUnlistResult> {
  if (shouldSimulate(credentials) || !tiktokProductId) {
    return { mode: "simulation" };
  }

  const resolved = resolveTikTokShopCredentials(credentials);
  if (!resolved) {
    throw new TikTokShopApiError(
      "TikTok app_key and app_secret are required for live unlisting."
    );
  }

  const active = await ensureShopCipher(resolved);

  await tikTokShopRequest(active, "/product/202309/products/deactivate", {
    method: "POST",
    body: JSON.stringify({ product_ids: [tiktokProductId] }),
  });

  return { mode: "live" };
}
