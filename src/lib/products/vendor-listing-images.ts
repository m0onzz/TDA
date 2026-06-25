import { unsplashSquare } from "@/lib/products/image-cdn";
import {
  CATEGORY_VENDOR_PHOTO_POOLS,
  DEFAULT_VENDOR_PHOTO_POOL,
} from "@/data/vendor-photo-pools";

/** TikTok Shop main image: 1:1 square, 800px. */
export const VENDOR_LISTING_IMAGE_SIZE = 800;

const DEFAULT_IMAGE_COUNT = 4;

function hashProductId(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function uniquePhotoIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

/**
 * Builds vendor listing gallery IDs: primary supplier photos first, then
 * category-matched shots (deterministic per SKU).
 */
export function getVendorListingPhotoIds(input: {
  productId: string;
  category: string;
  supplierPhotoIds: string[];
  imageCount?: number;
}): string[] {
  const count = input.imageCount ?? DEFAULT_IMAGE_COUNT;
  const pool =
    CATEGORY_VENDOR_PHOTO_POOLS[input.category] ?? DEFAULT_VENDOR_PHOTO_POOL;
  const start = hashProductId(input.productId) % Math.max(pool.length, 1);

  const result = uniquePhotoIds([...input.supplierPhotoIds]);

  for (let offset = 0; result.length < count && offset < pool.length; offset++) {
    const photoId = pool[(start + offset) % pool.length];
    if (!result.includes(photoId)) {
      result.push(photoId);
    }
  }

  return result.slice(0, count);
}

export function getVendorListingImageUrls(input: {
  productId: string;
  category: string;
  supplierPhotoIds: string[];
  imageCount?: number;
}): string[] {
  return getVendorListingPhotoIds(input).map((photoId) =>
    unsplashSquare(photoId)
  );
}
