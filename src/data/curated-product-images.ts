import { CURATED_PRODUCT_IMAGES as CATALOG_IMAGES } from "@/data/supplier-product-catalog";

/**
 * Vendor CDN URLs proxied server-side via /api/product-images.
 * Images are sourced from dropship supplier catalogs (CJ / Zendrop / AutoDS), not stock libraries.
 */
export const CURATED_PRODUCT_IMAGES: Record<string, string[]> = CATALOG_IMAGES;

export function getCuratedProductImages(productId: string): string[] {
  return CURATED_PRODUCT_IMAGES[productId] ?? [];
}
