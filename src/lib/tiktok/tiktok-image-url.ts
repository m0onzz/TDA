const TIKTOK_IMAGE_HOSTS = [
  "p16-oec-va.ibyteimg.com",
  "p19-oec-va.ibyteimg.com",
  "p16-oec-sg.ibyteimg.com",
] as const;

const DEFAULT_TIKTOK_IMAGE_CDN =
  process.env.TIKTOK_SHOP_IMAGE_CDN ?? "https://p16-oec-va.ibyteimg.com";

const DEFAULT_IMAGE_TEMPLATE =
  process.env.TIKTOK_SHOP_IMAGE_TEMPLATE ??
  "~tplv-o3syd03w52-origin-jpeg.jpeg";

/**
 * TikTok Shop listing photos are often returned as internal `uri` tokens
 * (e.g. tos-maliva-i-o3syd03w52-us/abc). Convert to a browser-loadable HTTPS URL.
 */
export function resolveTikTokShopImageUrl(uriOrUrl: string): string | null {
  const trimmed = uriOrUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed.startsWith("http://")
      ? trimmed.replace("http://", "https://")
      : trimmed;
  }

  const path = trimmed.replace(/^\/+/, "");
  if (!path.includes("/")) {
    return null;
  }

  return `${DEFAULT_TIKTOK_IMAGE_CDN}/${path}${DEFAULT_IMAGE_TEMPLATE}`;
}

export function isTikTokShopImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") {
      return false;
    }
    return TIKTOK_IMAGE_HOSTS.some((host) => parsed.hostname === host);
  } catch {
    return false;
  }
}

export function normalizeTikTokShopImageUrls(
  values: string[] | undefined
): string[] {
  if (!values?.length) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const resolved = resolveTikTokShopImageUrl(value);
    if (!resolved || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    result.push(resolved);
  }

  return result;
}
