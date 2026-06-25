import type { SupplierPlatform } from "@/services/supplierSourcing";
import {
  CATEGORY_VENDOR_IMAGE_POOLS,
  DEFAULT_VENDOR_IMAGE_POOL,
} from "@/data/supplier-vendor-image-library";
import { getListingImagesForProduct } from "@/data/product-listing-image-profiles";
import { normalizeVendorImageUrl } from "@/lib/products/image-cdn";

/** TikTok Shop main image: 1:1 square, 800px target when proxied. */
export const VENDOR_LISTING_IMAGE_SIZE = 800;

const DEFAULT_IMAGE_COUNT = 4;

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const normalized = normalizeVendorImageUrl(url);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

/**
 * Builds a vendor listing gallery from supplier CDN URLs matched to the product title.
 * Each SKU resolves to a product archetype gallery (blender, slides, ring light, etc.).
 */
export function getVendorListingImageUrls(input: {
  productId: string;
  title: string;
  platform: SupplierPlatform;
  category: string;
  supplierImageUrls?: string[];
  imageCount?: number;
}): string[] {
  const count = input.imageCount ?? DEFAULT_IMAGE_COUNT;
  const productGallery = getListingImagesForProduct(
    input.productId,
    input.title,
    count
  );

  const result = uniqueUrls([
    ...(input.supplierImageUrls ?? []),
    ...productGallery,
  ]);

  if (result.length >= count) {
    return result.slice(0, count);
  }

  const categoryPool =
    CATEGORY_VENDOR_IMAGE_POOLS[input.category] ?? DEFAULT_VENDOR_IMAGE_POOL;

  for (const url of categoryPool) {
    if (result.length >= count) {
      break;
    }
    const normalized = normalizeVendorImageUrl(url);
    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  }

  return result.slice(0, count);
}

/** @deprecated Use getVendorListingImageUrls — kept for imports during migration. */
export const getVendorListingPhotoIds = getVendorListingImageUrls;
