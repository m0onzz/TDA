import { createHmac } from "node:crypto";

export interface TikTokSignInput {
  path: string;
  queryParams: Record<string, string>;
  body?: string;
  appSecret: string;
}

/**
 * TikTok Shop Open API signature (HMAC-SHA256).
 * @see https://partner.tiktokshop.com/docv2/page/sign-your-api-request
 */
export function signTikTokShopRequest(input: TikTokSignInput): string {
  const params: Record<string, string> = { ...input.queryParams };

  delete params.sign;
  delete params.access_token;

  const sortedKeys = Object.keys(params).sort();
  let paramString = "";

  for (const key of sortedKeys) {
    paramString += key + params[key];
  }

  let signInput = input.path + paramString;

  if (input.body) {
    signInput += input.body;
  }

  signInput = input.appSecret + signInput + input.appSecret;

  return createHmac("sha256", input.appSecret)
    .update(signInput, "utf8")
    .digest("hex");
}

export function buildTikTokShopTimestamp(): string {
  return String(Math.floor(Date.now() / 1000));
}
