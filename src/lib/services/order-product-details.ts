import { parsePricingFromRaw } from "@/lib/products/catalog-helpers";
import {
  calculatePlatformFeeBreakdown,
  roundCurrency,
} from "@/lib/pricing/listing-pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import type { ProductRawDataShape } from "@/types/products";

export interface OrderLineItemDetails {
  productName: string | null;
  grossProfit: number | null;
  platformFeeAmount: number | null;
  platformFeePercent: number;
  netProfit: number | null;
  grossMarginPercent: number | null;
  netMarginPercent: number | null;
  currency: string;
}

function parseRawData(raw: Json): ProductRawDataShape {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as ProductRawDataShape;
}

function resolveProductTitle(
  aiTitle: string | null,
  raw: ProductRawDataShape
): string {
  if (aiTitle?.trim()) {
    return aiTitle.trim();
  }
  if (raw.title?.trim()) {
    return raw.title.trim();
  }
  return "Unknown product";
}

function estimateOrderQuantity(
  orderTotal: number | null,
  sellingPrice: number
): number {
  if (orderTotal === null || sellingPrice <= 0) {
    return 1;
  }

  const ratio = orderTotal / sellingPrice;
  if (!Number.isFinite(ratio) || ratio < 1) {
    return 1;
  }

  return Math.max(1, Math.round(ratio));
}

export async function resolveOrderLineItemDetails(
  productId: string | null,
  orderTotal: number | null,
  currency: string
): Promise<OrderLineItemDetails> {
  if (!productId) {
    return {
      productName: null,
      grossProfit: null,
      platformFeeAmount: null,
      platformFeePercent: 10,
      netProfit: null,
      grossMarginPercent: null,
      netMarginPercent: null,
      currency,
    };
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .select("ai_title, raw_data, cost_price, selling_price, currency")
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    return {
      productName: null,
      grossProfit: null,
      platformFeeAmount: null,
      platformFeePercent: 10,
      netProfit: null,
      grossMarginPercent: null,
      netMarginPercent: null,
      currency,
    };
  }

  const raw = parseRawData(data.raw_data);
  const costPrice = Number(data.cost_price);
  const sellingPrice = Number(data.selling_price);
  const pricing = parsePricingFromRaw(raw, costPrice, sellingPrice);
  const feeBreakdown = calculatePlatformFeeBreakdown(pricing);
  const quantity = estimateOrderQuantity(orderTotal, pricing.sellingPrice);

  return {
    productName: resolveProductTitle(data.ai_title, raw),
    grossProfit: roundCurrency(feeBreakdown.grossProfitPerUnit * quantity),
    platformFeeAmount: roundCurrency(feeBreakdown.platformFeeAmount * quantity),
    platformFeePercent: feeBreakdown.platformFeePercent,
    netProfit: roundCurrency(feeBreakdown.netProfitPerUnit * quantity),
    grossMarginPercent: feeBreakdown.grossMarginPercent,
    netMarginPercent: feeBreakdown.netMarginPercent,
    currency: data.currency ?? currency,
  };
}
