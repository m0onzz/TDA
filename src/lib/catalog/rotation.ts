export const CATALOG_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface CatalogRefreshState {
  windowId: number;
  refreshedAt: Date;
  nextRefreshAt: Date;
}

export function getCatalogRefreshState(
  now = Date.now()
): CatalogRefreshState {
  const windowId = Math.floor(now / CATALOG_REFRESH_INTERVAL_MS);
  return {
    windowId,
    refreshedAt: new Date(windowId * CATALOG_REFRESH_INTERVAL_MS),
    nextRefreshAt: new Date((windowId + 1) * CATALOG_REFRESH_INTERVAL_MS),
  };
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/** Deterministic trending boost (-6 … +12) that changes each refresh window. */
export function getRotationTrendingBoost(
  productId: string,
  windowId: number
): number {
  const mixed = hashString(`${windowId}:${productId}`);
  return (mixed % 19) - 6;
}

/** Stable pseudo-random score (0–1) for ordering within a refresh window. */
export function getRotationOrderScore(
  productId: string,
  windowId: number
): number {
  return hashString(`${productId}@${windowId}`) / 0xffffffff;
}

/** Top featured picks for the current window (fresh highlights in the UI). */
export function getFeaturedProductIds(
  productIds: string[],
  windowId: number,
  count = 12
): Set<string> {
  const ranked = [...productIds].sort(
    (left, right) =>
      getRotationOrderScore(right, windowId) -
      getRotationOrderScore(left, windowId)
  );

  return new Set(ranked.slice(0, Math.min(count, ranked.length)));
}
