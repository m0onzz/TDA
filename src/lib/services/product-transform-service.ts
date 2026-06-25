import { buildDefaultTikTokMarketing, buildListingTags, normalizeListingDescription, normalizeListingTitle } from "@/lib/listing/listing-copy";
import {
  calculateListingPricing,
  type ListingPricing,
} from "@/lib/pricing/listing-pricing";
import { calculateOptimalListingPricing } from "@/lib/pricing/optimal-pricing";
import {
  getUserProductsByIds,
  markProductFailed,
  markProductProcessing,
  savePricingTransform,
} from "@/lib/services/product-service";
import type { OptimizedImage, TransformProductResult } from "@/types/products";

export type TransformMode = "optimal" | "markup";

export interface TransformOptions {
  mode?: TransformMode;
  markupPercent?: number;
}

function resolvePricing(
  costPrice: number,
  currency: string,
  options: TransformOptions
): ListingPricing {
  const mode = options.mode ?? "optimal";

  if (mode === "markup") {
    if (options.markupPercent === undefined) {
      throw new Error("Markup percent is required for markup pricing");
    }

    return calculateListingPricing(costPrice, options.markupPercent, currency);
  }

  return calculateOptimalListingPricing(costPrice, currency);
}

export async function transformProductsForListing(
  userId: string,
  productIds: string[],
  options: TransformOptions = {}
): Promise<TransformProductResult[]> {
  const products = await getUserProductsByIds(userId, productIds);
  const results: TransformProductResult[] = [];

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
      await markProductProcessing(product.id);

      const costPrice = product.costPrice;
      if (costPrice <= 0) {
        throw new Error("Product is missing a valid supplier cost price");
      }

      const pricing = resolvePricing(
        costPrice,
        product.pricing.currency,
        options
      );

      const title = normalizeListingTitle(product.title);
      const description = normalizeListingDescription(product.description);
      const tags = buildListingTags(title, product.category);
      const tiktokMarketing = buildDefaultTikTokMarketing(
        title,
        product.category,
        pricing.sellingPrice
      );

      const supplierImages =
        product.images.length > 0
          ? product.images
          : product.imageUrl
            ? [product.imageUrl]
            : [];

      const images: OptimizedImage[] = supplierImages.map((url) => ({
        url,
        type: "gallery" as const,
        width: 800,
        height: 800,
        source: "supplier" as const,
      }));

      await savePricingTransform(product.id, {
        title,
        description,
        tags,
        pricing,
        tiktokMarketing,
        images,
      });

      results.push({
        productId: product.id,
        success: true,
        pricing,
        images,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transform failed";
      await markProductFailed(product.id, message);
      results.push({
        productId: product.id,
        success: false,
        error: message,
      });
    }
  }

  return results;
}
