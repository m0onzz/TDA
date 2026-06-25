function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * TikTok Shop app client secret used to verify webhook signatures.
 * Falls back to TIKTOK_CLIENT_SECRET for convenience.
 */
export function getTikTokWebhookClientSecret(): string {
  return (
    process.env.TIKTOK_WEBHOOK_CLIENT_SECRET ??
    process.env.TIKTOK_CLIENT_SECRET ??
    requireEnv("TIKTOK_WEBHOOK_CLIENT_SECRET")
  );
}
