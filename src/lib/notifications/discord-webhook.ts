import { DISCORD_WEBHOOK_URL_PATTERN } from "@/lib/notifications/discord-constants";
import {
  formatPricingCurrency,
  pricingFromStoredPrices,
  calculatePlatformFeeBreakdown,
} from "@/lib/pricing/listing-pricing";

export function isValidDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK_URL_PATTERN.test(url.trim());
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  url?: string;
  timestamp?: string;
  footer?: { text: string };
  author?: { name: string };
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

/** TikTok cyan — subtle brand accent on order alerts. */
const ORDER_EMBED_COLOR = 0x00f2ea;

export async function postDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<void> {
  const response = await fetch(webhookUrl.trim(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Discord webhook failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }
}

function formatMoney(amount: number, currency: string): string {
  return formatPricingCurrency(amount, currency || "USD");
}

function formatOptionalMoney(
  amount: number | null,
  currency: string
): string {
  return amount !== null ? formatMoney(amount, currency) : "—";
}

function formatOptionalPercent(value: number | null): string {
  return value !== null ? `${value.toFixed(1)}%` : "—";
}

function formatShipDeadline(iso: string): string {
  const deadline = new Date(iso);
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deadline);

  const hoursRemaining = Math.max(
    0,
    Math.round((deadline.getTime() - Date.now()) / (60 * 60 * 1000))
  );

  if (hoursRemaining > 0 && hoursRemaining <= 48) {
    return `${formatted}\n*${hoursRemaining}h remaining*`;
  }

  return formatted;
}

export function buildOrderPlacedEmbed(input: {
  tiktokOrderId: string;
  productName: string | null;
  orderTotal: number | null;
  grossProfit: number | null;
  platformFeeAmount: number | null;
  platformFeePercent: number;
  netProfit: number | null;
  grossMarginPercent: number | null;
  netMarginPercent: number | null;
  currency: string;
  shipDeadlineIso: string;
  ordersUrl: string;
}): DiscordWebhookPayload {
  const currency = input.currency || "USD";
  const productName = input.productName?.trim() || "Unknown product";
  const orderTotal = formatOptionalMoney(input.orderTotal, currency);
  const grossProfit = formatOptionalMoney(input.grossProfit, currency);
  const platformFees = formatOptionalMoney(input.platformFeeAmount, currency);
  const netProfit = formatOptionalMoney(input.netProfit, currency);
  const netMargin = formatOptionalPercent(input.netMarginPercent);

  return {
    embeds: [
      {
        author: { name: "TikTok Dropship Automator" },
        title: "New order received",
        description: `**${productName.slice(0, 256)}**`,
        color: ORDER_EMBED_COLOR,
        url: input.ordersUrl,
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "Order total",
            value: orderTotal,
            inline: true,
          },
          {
            name: "Net profit",
            value: netProfit,
            inline: true,
          },
          {
            name: "Net margin",
            value: netMargin,
            inline: true,
          },
          {
            name: `TikTok fees (~${input.platformFeePercent}%)`,
            value: platformFees,
            inline: true,
          },
          {
            name: "Gross profit",
            value: grossProfit,
            inline: true,
          },
          {
            name: "Gross margin",
            value: formatOptionalPercent(input.grossMarginPercent),
            inline: true,
          },
          {
            name: "Order ID",
            value: `\`${input.tiktokOrderId}\``,
            inline: false,
          },
          {
            name: "Ship-by deadline",
            value: formatShipDeadline(input.shipDeadlineIso),
            inline: false,
          },
        ],
        footer: { text: "Open dashboard to review and fulfill" },
      },
    ],
  };
}

export function buildExampleOrderPlacedEmbed(ordersUrl: string): DiscordWebhookPayload {
  const shipDeadlineIso = new Date(
    Date.now() + 48 * 60 * 60 * 1000
  ).toISOString();

  const sellingPrice = 34.99;
  const costPrice = 22.54;
  const pricing = pricingFromStoredPrices(costPrice, sellingPrice);
  const fees = calculatePlatformFeeBreakdown(pricing);

  const orderPayload = buildOrderPlacedEmbed({
    tiktokOrderId: "5768901234567890123",
    productName: "Wireless Earbuds Pro — Noise Cancelling",
    orderTotal: sellingPrice,
    grossProfit: fees.grossProfitPerUnit,
    platformFeeAmount: fees.platformFeeAmount,
    platformFeePercent: fees.platformFeePercent,
    netProfit: fees.netProfitPerUnit,
    grossMarginPercent: fees.grossMarginPercent,
    netMarginPercent: fees.netMarginPercent,
    currency: "USD",
    shipDeadlineIso,
    ordersUrl,
  });

  return {
    content:
      "**Test notification** — Sample order alert. Live orders use this same format.",
    ...orderPayload,
  };
}