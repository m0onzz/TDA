import { CURATED_PRODUCT_IMAGES as CATALOG_IMAGES } from "@/data/supplier-product-catalog";

/**
 * Remote source URLs fetched server-side via /api/product-images.
 * Unsplash CDN URLs are stable, crop to 800×800 (TikTok Shop 1:1), and work from server fetch.
 */
export const CURATED_PRODUCT_IMAGES: Record<string, string[]> = CATALOG_IMAGES;

export function getCuratedProductImages(productId: string): string[] {
  return CURATED_PRODUCT_IMAGES[productId] ?? [];
}
