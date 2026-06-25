import { buildDefaultTikTokMarketing, buildListingTags, normalizeListingDescription, normalizeListingTitle } from "@/lib/listing/listing-copy";
import { calculateOptimalListingPricing } from "@/lib/pricing/optimal-pricing";
import {
  getUserProductsByIds,
  markProductFailed,
  markProductProcessing,
  savePricingTransform,
} from "@/lib/services/product-service";
import type { OptimizedImage, TransformProductResult } from "@/types/products";

export async function transformProductsForListing(
  userId: string,
  productIds: string[]
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

      const pricing = calculateOptimalListingPricing(
        costPrice,
        product.pricing.currency
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
