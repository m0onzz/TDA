import { getCuratedProductImages } from "@/data/curated-product-images";

function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/**
 * App-served image URL — proxied server-side so external CDNs
 * cannot block browser hotlinking on localhost.
 */
export function getProductImageUrl(
  productId: string,
  index = 0,
  options?: { absolute?: boolean }
): string {
  const query = index > 0 ? `?index=${index}` : "";
  const path = `/api/product-images/${encodeURIComponent(productId)}${query}`;

  if (options?.absolute) {
    return `${getSiteOrigin()}${path}`;
  }

  return path;
}

/** Local proxy URLs for every gallery slot of a product. */
export function getProductImageUrls(
  productId: string,
  options?: { absolute?: boolean }
): string[] {
  const curated = getCuratedProductImages(productId);
  const slots = Math.max(curated.length, 1);

  return Array.from({ length: slots }, (_, index) =>
    getProductImageUrl(productId, index, options)
  );
}
