import { getCredentialSecretByLookupKey } from "@/lib/services/credential-service";
import { syncTikTokShopImagesForProduct } from "@/lib/services/tiktok-image-sync-service";
import { getUserProductsByIds } from "@/lib/services/product-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductImageUrl } from "@/lib/products/product-image-url";
import {
  parseTikTokShopCredentials,
  publishProductToTikTokShop,
  unlistProductFromTikTokShop,
  type TikTokShopCredentials,
} from "@/lib/tiktok/shop-client";
import type {
  CatalogProduct,
  PublishProductResult,
  UnlistProductResult,
} from "@/types/products";

export class PublishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishValidationError";
  }
}

export async function getTikTokShopCredentialsForUser(
  userId: string
): Promise<TikTokShopCredentials | null> {
  const secret = await getCredentialSecretByLookupKey(userId, "tiktok_shop:primary");
  if (!secret) return null;
  return parseTikTokShopCredentials(secret);
}

function toAbsoluteImageUrl(url: string, productKey: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:")) return url;

  const match = url.match(/^\/api\/product-images\/([^?]+)(?:\?index=(\d+))?/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const index = Number(match[2] ?? 0);
    return getProductImageUrl(id, index, { absolute: true });
  }

  return getProductImageUrl(productKey, 0, { absolute: true });
}

function validateProductForPublish(product: CatalogProduct): void {
  if (product.status !== "ready_for_review" && product.status !== "published") {
    throw new PublishValidationError(
      `"${product.title}" must be optimized before listing (status: ${product.status})`
    );
  }

  const title = product.aiTitle?.trim() || product.title?.trim();
  if (!title) {
    throw new PublishValidationError(`"${product.title}" is missing a listing title`);
  }

  const description =
    product.aiDescription?.trim() || product.description?.trim();
  if (!description) {
    throw new PublishValidationError(
      `"${product.title}" is missing a listing description`
    );
  }

  const images =
    product.optimizedImages.length > 0
      ? product.optimizedImages
      : product.images.length > 0
        ? product.images.map((url) => ({
            url,
            type: "gallery" as const,
            width: 800,
            height: 800,
            source: "supplier" as const,
          }))
        : [];

  if (images.length === 0) {
    throw new PublishValidationError(`"${product.title}" needs at least one image`);
  }
}

function buildListingImages(product: CatalogProduct): string[] {
  const productKey = product.vendor?.sku ?? product.id;
  const urls =
    product.optimizedImages.length > 0
      ? product.optimizedImages.map((image) => image.url)
      : product.images;

  return urls.map((url) => toAbsoluteImageUrl(url, productKey));
}

async function markProductPublished(
  productId: string,
  result: { tiktokProductId: string; tiktokListingUrl: string }
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("products")
    .update({
      status: "published",
      tiktok_product_id: result.tiktokProductId,
      tiktok_listing_url: result.tiktokListingUrl,
      published_at: new Date().toISOString(),
      ai_processing_error: null,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to save publish result: ${error.message}`);
  }
}

export async function publishProductsToTikTokShop(
  userId: string,
  productIds: string[]
): Promise<PublishProductResult[]> {
  const products = await getUserProductsByIds(userId, productIds);
  const credentials = await getTikTokShopCredentialsForUser(userId);
  const results: PublishProductResult[] = [];

  const foundIds = new Set(products.map((product) => product.id));
  for (const productId of productIds) {
    if (!foundIds.has(productId)) {
      results.push({
        productId,
        success: false,
        error: "Product not found in your catalog",
      });
    }
  }

  for (const product of products) {
    try {
      if (product.status === "published" && product.tiktokListingUrl) {
        results.push({
          productId: product.id,
          success: true,
          tiktokProductId: product.tiktokProductId ?? undefined,
          tiktokListingUrl: product.tiktokListingUrl,
          mode: "simulation",
        });
        continue;
      }

      validateProductForPublish(product);

      const publishResult = await publishProductToTikTokShop(
        {
          title: product.aiTitle?.trim() || product.title,
          description: product.aiDescription?.trim() || product.description,
          category: product.category ?? "General",
          tags: product.aiTags,
          price: product.sellingPrice,
          currency: product.pricing.currency,
          imageUrls: buildListingImages(product),
          sellerSku: product.vendor?.sku ?? product.id,
        },
        credentials
      );

      await markProductPublished(product.id, publishResult);

      if (publishResult.mode === "live") {
        try {
          await syncTikTokShopImagesForProduct(userId, product.id);
        } catch (syncError) {
          console.warn(
            "[publishProductsToTikTokShop] image sync after publish failed",
            syncError
          );
        }
      }

      results.push({
        productId: product.id,
        success: true,
        tiktokProductId: publishResult.tiktokProductId,
        tiktokListingUrl: publishResult.tiktokListingUrl,
        mode: publishResult.mode,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Listing failed";
      results.push({
        productId: product.id,
        success: false,
        error: message,
      });
    }
  }

  return results;
}

export class UnlistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnlistValidationError";
  }
}

async function markProductUnlisted(productId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("products")
    .update({
      status: "ready_for_review",
      tiktok_listing_url: null,
      ai_processing_error: null,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to save unlist result: ${error.message}`);
  }
}

export async function unlistProductsFromTikTokShop(
  userId: string,
  productIds: string[]
): Promise<UnlistProductResult[]> {
  const products = await getUserProductsByIds(userId, productIds);
  const credentials = await getTikTokShopCredentialsForUser(userId);
  const results: UnlistProductResult[] = [];

  const foundIds = new Set(products.map((product) => product.id));
  for (const productId of productIds) {
    if (!foundIds.has(productId)) {
      results.push({
        productId,
        success: false,
        error: "Product not found in your catalog",
      });
    }
  }

  for (const product of products) {
    try {
      if (product.status !== "published") {
        throw new UnlistValidationError(
          `"${product.title}" is not listed on TikTok Shop (status: ${product.status})`
        );
      }

      const unlistResult = await unlistProductFromTikTokShop(
        product.tiktokProductId ?? "",
        credentials
      );

      await markProductUnlisted(product.id);

      results.push({
        productId: product.id,
        success: true,
        mode: unlistResult.mode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unlist failed";
      results.push({
        productId: product.id,
        success: false,
        error: message,
      });
    }
  }

  return results;
}
