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

/**
 * Publishes a product listing to TikTok Shop.
 * Uses live API when credentials are provided; otherwise simulates a successful listing.
 */
export async function publishProductToTikTokShop(
  input: TikTokListingInput,
  credentials: TikTokShopCredentials | null
): Promise<TikTokPublishResult> {
  if (!credentials?.accessToken) {
    return buildSimulationResult(input);
  }

  const forceSimulate = process.env.TIKTOK_SHOP_SIMULATE_PUBLISH === "true";
  if (forceSimulate) {
    return buildSimulationResult(input);
  }

  try {
    const baseUrl =
      process.env.TIKTOK_SHOP_API_BASE_URL ??
      "https://open-api.tiktokglobalshop.com";

    const query = credentials.shopCipher
      ? `?shop_cipher=${encodeURIComponent(credentials.shopCipher)}`
      : "";

    const body = {
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
    };

    const response = await fetch(
      `${baseUrl}/product/202309/products${query}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tts-access-token": credentials.accessToken,
        },
        body: JSON.stringify(body),
      }
    );

    const json = (await response.json()) as {
      code?: number;
      message?: string;
      data?: {
        product_id?: string;
        product_url?: string;
      };
    };

    if (!response.ok || json.code !== 0 || !json.data?.product_id) {
      throw new Error(json.message ?? `TikTok API error (${response.status})`);
    }

    const tiktokProductId = String(json.data.product_id);

    return {
      tiktokProductId,
      tiktokListingUrl:
        json.data.product_url ??
        `https://www.tiktok.com/shop/pdp/${tiktokProductId}`,
      mode: "live",
    };
  } catch (error) {
    console.warn("[publishProductToTikTokShop] live publish failed, simulating", error);
    return buildSimulationResult(input);
  }
}

/**
 * Deactivates a product listing on TikTok Shop.
 * Uses live API when credentials are provided; otherwise simulates a successful unlist.
 */
export async function unlistProductFromTikTokShop(
  tiktokProductId: string,
  credentials: TikTokShopCredentials | null
): Promise<TikTokUnlistResult> {
  if (!credentials?.accessToken || !tiktokProductId) {
    return { mode: "simulation" };
  }

  const forceSimulate = process.env.TIKTOK_SHOP_SIMULATE_PUBLISH === "true";
  if (forceSimulate) {
    return { mode: "simulation" };
  }

  try {
    const baseUrl =
      process.env.TIKTOK_SHOP_API_BASE_URL ??
      "https://open-api.tiktokglobalshop.com";

    const query = credentials.shopCipher
      ? `?shop_cipher=${encodeURIComponent(credentials.shopCipher)}`
      : "";

    const response = await fetch(
      `${baseUrl}/product/202309/products/deactivate${query}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tts-access-token": credentials.accessToken,
        },
        body: JSON.stringify({ product_ids: [tiktokProductId] }),
      }
    );

    const json = (await response.json()) as {
      code?: number;
      message?: string;
    };

    if (!response.ok || json.code !== 0) {
      throw new Error(json.message ?? `TikTok API error (${response.status})`);
    }

    return { mode: "live" };
  } catch (error) {
    console.warn(
      "[unlistProductFromTikTokShop] live unlist failed, simulating",
      error
    );
    return { mode: "simulation" };
  }
}
