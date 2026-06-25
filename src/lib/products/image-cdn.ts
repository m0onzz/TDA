const VENDOR_IMAGE_HOSTS = [
  "cf.cjdropshipping.com",
  "oss-cf.cjdropshipping.com",
  "video-cf.cjdropshipping.com",
  "cc-west-usa.oss-us-west-1.aliyuncs.com",
] as const;

export function isVendorImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") {
      return false;
    }
    return VENDOR_IMAGE_HOSTS.some((host) => parsed.hostname === host);
  } catch {
    return false;
  }
}

export function normalizeVendorImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || !isVendorImageUrl(trimmed)) {
    return null;
  }
  return trimmed;
}
