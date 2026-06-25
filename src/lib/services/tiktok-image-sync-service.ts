import { getCatalogImages, getCatalogFallbackImages } from "@/lib/products/catalog-helpers";
import { getTikTokShopCredentialsForUser } from "@/lib/services/tiktok-publish-service";
import { getUserProductsByIds, listUserProducts } from "@/lib/services/product-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildTikTokShopProductIndex,
  getTikTokShopProductById,
  type TikTokShopProductRecord,
} from "@/lib/tiktok/shop-product-api";
import type { Json } from "@/types/database";
import type {
  CatalogProduct,
  OptimizedImage,
  ProductRawDataShape,
} from "@/types/products";

export interface TikTokImageSyncResult {
  productId: string;
  success: boolean;
  matchedBy?: "tiktok_product_id" | "seller_sku";
  tiktokProductId?: string;
  imageCount?: number;
  error?: string;
}

export interface TikTokImageSyncSummary {
  results: TikTokImageSyncResult[];
  total: number;
  succeeded: number;
  failed: number;
  mode: "live" | "simulation";
  message?: string;
}

function parseRawData(raw: Json): ProductRawDataShape {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as ProductRawDataShape;
}

function buildTikTokOptimizedImages(urls: string[]): OptimizedImage[] {
  return urls.map((url, index) => ({
    url,
    type: index === 0 ? "main" : "gallery",
    width: 800,
    height: 800,
    source: "tiktok",
  }));
}

function resolveTikTokListing(
  product: CatalogProduct,
  index: {
    byProductId: Map<string, TikTokShopProductRecord>;
    bySellerSku: Map<string, TikTokShopProductRecord>;
  }
): {
  listing: TikTokShopProductRecord | null;
  matchedBy?: "tiktok_product_id" | "seller_sku";
} {
  if (product.tiktokProductId) {
    const byId = index.byProductId.get(product.tiktokProductId);
    if (byId) {
      return { listing: byId, matchedBy: "tiktok_product_id" };
    }
  }

  const sellerSku = product.vendor?.sku?.trim().toLowerCase();
  if (sellerSku) {
    const bySku = index.bySellerSku.get(sellerSku);
    if (bySku) {
      return { listing: bySku, matchedBy: "seller_sku" };
    }
  }

  return { listing: null };
}

async function persistTikTokImages(
  product: CatalogProduct,
  imageUrls: string[],
  tiktokProductId: string
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("raw_data, tiktok_product_id")
    .eq("id", product.id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load product ${product.id}: ${fetchError.message}`);
  }

  const raw = parseRawData(existing.raw_data);
  const currentDisplay = getCatalogImages(raw, product.optimizedImages);
  const fallbackImages =
    raw.fallback_images && raw.fallback_images.length > 0
      ? raw.fallback_images
      : getCatalogFallbackImages(raw, product.optimizedImages, currentDisplay);

  const mergedRaw: ProductRawDataShape = {
    ...raw,
    fallback_images: fallbackImages,
    tiktok_shop_images: imageUrls,
    tiktok_image_synced_at: new Date().toISOString(),
  };

  const updatePayload: {
    raw_data: Json;
    optimized_images: Json;
    tiktok_product_id?: string;
  } = {
    raw_data: mergedRaw as unknown as Json,
    optimized_images: buildTikTokOptimizedImages(imageUrls) as unknown as Json,
  };

  if (!existing.tiktok_product_id) {
    updatePayload.tiktok_product_id = tiktokProductId;
  }

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", product.id);

  if (error) {
    throw new Error(`Failed to save TikTok images: ${error.message}`);
  }
}

export async function syncTikTokShopImagesForUser(
  userId: string,
  productIds?: string[]
): Promise<TikTokImageSyncSummary> {
  const credentials = await getTikTokShopCredentialsForUser(userId);
  const forceSimulate = process.env.TIKTOK_SHOP_SIMULATE_PUBLISH === "true";

  if (!credentials?.accessToken || forceSimulate) {
    return {
      results: [],
      total: 0,
      succeeded: 0,
      failed: 0,
      mode: "simulation",
      message: forceSimulate
        ? "TikTok Shop image sync is disabled while listing simulation is enabled"
        : "Add TikTok Shop API credentials in Settings to sync listing images",
    };
  }

  const products = productIds?.length
    ? await getUserProductsByIds(userId, productIds)
    : (await listUserProducts(userId)).filter(
        (product) =>
          product.status === "published" || Boolean(product.tiktokProductId)
      );

  if (products.length === 0) {
    return {
      results: [],
      total: 0,
      succeeded: 0,
      failed: 0,
      mode: "live",
      message: "No listed catalog products found to sync",
    };
  }

  const index = await buildTikTokShopProductIndex(credentials);
  const results: TikTokImageSyncResult[] = [];

  for (const product of products) {
    try {
      let listing: TikTokShopProductRecord | null = null;
      let matchedBy: "tiktok_product_id" | "seller_sku" | undefined;

      const resolved = resolveTikTokListing(product, index);
      listing = resolved.listing;
      matchedBy = resolved.matchedBy;

      if (!listing && product.tiktokProductId) {
        listing = await getTikTokShopProductById(
          credentials,
          product.tiktokProductId
        );
        if (listing) {
          matchedBy = "tiktok_product_id";
        }
      }

      if (!listing) {
        results.push({
          productId: product.id,
          success: false,
          error:
            "No matching TikTok Shop listing found (check TikTok product ID or seller SKU)",
        });
        continue;
      }

      if (listing.imageUrls.length === 0) {
        results.push({
          productId: product.id,
          success: false,
          tiktokProductId: listing.id,
          matchedBy,
          error: "TikTok Shop listing has no main images",
        });
        continue;
      }

      await persistTikTokImages(product, listing.imageUrls, listing.id);

      results.push({
        productId: product.id,
        success: true,
        matchedBy,
        tiktokProductId: listing.id,
        imageCount: listing.imageUrls.length,
      });
    } catch (error) {
      results.push({
        productId: product.id,
        success: false,
        error: error instanceof Error ? error.message : "Image sync failed",
      });
    }
  }

  const succeeded = results.filter((result) => result.success).length;

  return {
    results,
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    mode: "live",
  };
}

export async function syncTikTokShopImagesForProduct(
  userId: string,
  productId: string
): Promise<TikTokImageSyncResult> {
  const summary = await syncTikTokShopImagesForUser(userId, [productId]);
  return (
    summary.results[0] ?? {
      productId,
      success: false,
      error: summary.message ?? "Product not eligible for TikTok image sync",
    }
  );
}
