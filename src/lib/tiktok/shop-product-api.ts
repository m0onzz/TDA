import {
  ensureShopCipher,
  resolveTikTokShopCredentials,
  tikTokShopRequest,
} from "@/lib/tiktok/shop-request";
import {
  normalizeTikTokShopImageUrls,
  resolveTikTokShopImageUrl,
} from "@/lib/tiktok/tiktok-image-url";
import type { TikTokShopCredentials } from "@/lib/tiktok/shop-client";

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

async function withResolvedCredentials(
  credentials: TikTokShopCredentials
) {
  const resolved = resolveTikTokShopCredentials(credentials);
  if (!resolved) {
    throw new Error(
      "TikTok app_key and app_secret are required for live API calls."
    );
  }

  return ensureShopCipher(resolved);
}

/**
 * Fetches a single TikTok Shop listing by TikTok product ID.
 */
export async function getTikTokShopProductById(
  credentials: TikTokShopCredentials,
  tiktokProductId: string
): Promise<TikTokShopProductRecord | null> {
  const active = await withResolvedCredentials(credentials);

  const data = await tikTokShopRequest<{
    product?: {
      id?: string;
      title?: string;
      main_images?: TikTokMainImage[];
      skus?: TikTokProductSku[];
    };
  }>(
    active,
    `/product/202309/products/${encodeURIComponent(tiktokProductId)}`
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
  const active = await withResolvedCredentials(credentials);

  const data = await tikTokShopRequest<SearchProductsResponse>(
    active,
    "/product/202309/products/search",
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
