import {
  normalizeTikTokShopImageUrls,
  resolveTikTokShopImageUrl,
} from "@/lib/tiktok/tiktok-image-url";
import type { TikTokShopCredentials } from "@/lib/tiktok/shop-client";

interface TikTokApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

interface TikTokMainImage {
  uri?: string;
  urls?: string[];
  url_list?: string[];
  thumb_urls?: string[];
}

interface TikTokProductSku {
  id?: string;
  seller_sku?: string;
}

export interface TikTokShopProductRecord {
  id: string;
  title: string;
  sellerSkus: string[];
  imageUrls: string[];
}

function getApiBaseUrl(): string {
  return (
    process.env.TIKTOK_SHOP_API_BASE_URL ??
    "https://open-api.tiktokglobalshop.com"
  );
}

function buildShopQuery(credentials: TikTokShopCredentials): string {
  if (!credentials.shopCipher) {
    return "";
  }
  return `?shop_cipher=${encodeURIComponent(credentials.shopCipher)}`;
}

async function tikTokShopRequest<T>(
  credentials: TikTokShopCredentials,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": credentials.accessToken,
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as TikTokApiEnvelope<T>;

  if (!response.ok || json.code !== 0) {
    throw new Error(json.message ?? `TikTok Shop API error (${response.status})`);
  }

  if (!json.data) {
    throw new Error("TikTok Shop API returned an empty payload");
  }

  return json.data;
}

function extractImageValuesFromMainImages(
  mainImages: TikTokMainImage[] | undefined
): string[] {
  if (!mainImages?.length) {
    return [];
  }

  const values: string[] = [];

  for (const image of mainImages) {
    if (image.uri) {
      values.push(image.uri);
    }
    if (image.urls?.length) {
      values.push(...image.urls);
    }
    if (image.url_list?.length) {
      values.push(...image.url_list);
    }
    if (image.thumb_urls?.length) {
      values.push(...image.thumb_urls);
    }
  }

  return values;
}

function mapProductRecord(input: {
  id?: string;
  title?: string;
  product_name?: string;
  main_images?: TikTokMainImage[];
  skus?: TikTokProductSku[];
}): TikTokShopProductRecord | null {
  if (!input.id) {
    return null;
  }

  const imageUrls = normalizeTikTokShopImageUrls(
    extractImageValuesFromMainImages(input.main_images)
  );

  const sellerSkus = (input.skus ?? [])
    .map((sku) => sku.seller_sku?.trim())
    .filter((sku): sku is string => Boolean(sku));

  return {
    id: String(input.id),
    title: input.title ?? input.product_name ?? "TikTok Shop product",
    sellerSkus,
    imageUrls,
  };
}

/**
 * Fetches a single TikTok Shop listing by TikTok product ID.
 */
export async function getTikTokShopProductById(
  credentials: TikTokShopCredentials,
  tiktokProductId: string
): Promise<TikTokShopProductRecord | null> {
  const data = await tikTokShopRequest<{
    product?: {
      id?: string;
      title?: string;
      main_images?: TikTokMainImage[];
      skus?: TikTokProductSku[];
    };
  }>(
    credentials,
    `/product/202309/products/${encodeURIComponent(tiktokProductId)}${buildShopQuery(credentials)}`
  );

  return mapProductRecord(data.product ?? {});
}

interface SearchProductsResponse {
  products?: Array<{
    id?: string;
    title?: string;
    product_name?: string;
    main_images?: TikTokMainImage[];
    skus?: TikTokProductSku[];
  }>;
  next_page_token?: string;
  total_count?: number;
}

/**
 * Lists live TikTok Shop products for SKU / ID matching during image sync.
 */
export async function listTikTokShopProducts(
  credentials: TikTokShopCredentials,
  options?: { pageSize?: number; pageToken?: string }
): Promise<{
  products: TikTokShopProductRecord[];
  nextPageToken: string | null;
}> {
  const query = buildShopQuery(credentials);
  const data = await tikTokShopRequest<SearchProductsResponse>(
    credentials,
    `/product/202309/products/search${query}`,
    {
      method: "POST",
      body: JSON.stringify({
        page_size: options?.pageSize ?? 50,
        page_token: options?.pageToken ?? undefined,
        search_status: "ACTIVATE",
      }),
    }
  );

  const products = (data.products ?? [])
    .map((product) => mapProductRecord(product))
    .filter((product): product is TikTokShopProductRecord => product !== null);

  return {
    products,
    nextPageToken: data.next_page_token ?? null,
  };
}

/**
 * Builds a lookup table keyed by seller SKU and TikTok product ID.
 */
export async function buildTikTokShopProductIndex(
  credentials: TikTokShopCredentials
): Promise<{
  byProductId: Map<string, TikTokShopProductRecord>;
  bySellerSku: Map<string, TikTokShopProductRecord>;
}> {
  const byProductId = new Map<string, TikTokShopProductRecord>();
  const bySellerSku = new Map<string, TikTokShopProductRecord>();

  let pageToken: string | null = null;

  do {
    const page = await listTikTokShopProducts(credentials, {
      pageSize: 50,
      pageToken: pageToken ?? undefined,
    });

    for (const product of page.products) {
      byProductId.set(product.id, product);

      for (const sellerSku of product.sellerSkus) {
        bySellerSku.set(sellerSku.toLowerCase(), product);
      }
    }

    pageToken = page.nextPageToken;
  } while (pageToken);

  return { byProductId, bySellerSku };
}

export function extractTikTokShopImageUrlsFromPayload(
  values: string[] | undefined
): string[] {
  return normalizeTikTokShopImageUrls(values);
}

export function resolveTikTokShopListingImage(uriOrUrl: string): string | null {
  return resolveTikTokShopImageUrl(uriOrUrl);
}
