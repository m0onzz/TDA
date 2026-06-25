import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER_NAMES = [
  "x-tiktok-signature",
  "tiktok-signature",
  "webhook-signature",
] as const;

const DEFAULT_TOLERANCE_SECONDS = 300;

export class TikTokSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TikTokSignatureError";
  }
}

interface ParsedTimestampSignature {
  timestamp: string;
  signature: string;
}

function parseTimestampSignatureHeader(
  headerValue: string
): ParsedTimestampSignature | null {
  const parts = headerValue.split(",").map((part) => part.trim());
  let timestamp: string | undefined;
  let signature: string | undefined;

  for (const part of parts) {
    const [prefix, value] = part.split("=");
    if (!value) continue;

    if (prefix === "t") timestamp = value;
    if (prefix === "s") signature = value;
  }

  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

function safeCompare(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function verifyTimestampTolerance(
  timestampSeconds: string,
  toleranceSeconds: number
): void {
  const receivedAt = Number.parseInt(timestampSeconds, 10);

  if (!Number.isFinite(receivedAt)) {
    throw new TikTokSignatureError("Invalid signature timestamp");
  }

  const now = Math.floor(Date.now() / 1000);
  const delta = Math.abs(now - receivedAt);

  if (delta > toleranceSeconds) {
    throw new TikTokSignatureError("Signature timestamp outside tolerance window");
  }
}

function verifyTimestampSignature(
  rawBody: string,
  clientSecret: string,
  headerValue: string,
  toleranceSeconds: number
): boolean {
  const parsed = parseTimestampSignatureHeader(headerValue);

  if (!parsed) {
    return false;
  }

  verifyTimestampTolerance(parsed.timestamp, toleranceSeconds);

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", clientSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return safeCompare(expected, parsed.signature);
}

function verifyRawBodySignature(
  rawBody: string,
  clientSecret: string,
  headerValue: string
): boolean {
  const expected = createHmac("sha256", clientSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return safeCompare(expected, headerValue.trim());
}

export interface VerifyTikTokSignatureOptions {
  headers: Headers;
  rawBody: string;
  clientSecret: string;
  toleranceSeconds?: number;
}

/**
 * Verifies TikTok / TikTok Shop webhook authenticity.
 *
 * Supports:
 * - Standard TikTok header: `TikTok-Signature: t=<unix>,s=<hmac-sha256-hex>`
 *   signed payload = `${timestamp}.${rawBody}`
 * - TikTok Shop variant: `Webhook-Signature: <hmac-sha256-hex(rawBody)>`
 *
 * Also accepts `X-TikTok-Signature` as an alias for the timestamp format.
 */
export function verifyTikTokWebhookSignature({
  headers,
  rawBody,
  clientSecret,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
}: VerifyTikTokSignatureOptions): void {
  if (!clientSecret) {
    throw new TikTokSignatureError("Missing TikTok webhook client secret");
  }

  for (const headerName of SIGNATURE_HEADER_NAMES) {
    const headerValue = headers.get(headerName);
    if (!headerValue) continue;

    if (headerName === "webhook-signature") {
      if (verifyRawBodySignature(rawBody, clientSecret, headerValue)) {
        return;
      }
      continue;
    }

    if (
      verifyTimestampSignature(
        rawBody,
        clientSecret,
        headerValue,
        toleranceSeconds
      )
    ) {
      return;
    }
  }

  throw new TikTokSignatureError("Invalid or missing TikTok webhook signature");
}

export function getTikTokSignatureHeader(headers: Headers): string | null {
  for (const headerName of SIGNATURE_HEADER_NAMES) {
    const value = headers.get(headerName);
    if (value) return value;
  }
  return null;
}
