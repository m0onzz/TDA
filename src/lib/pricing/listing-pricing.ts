/** Estimated TikTok Shop + payment fees as % of selling price. */
export const TIKTOK_PLATFORM_FEE_PERCENT = 10;

export interface ListingPricing {
  costPrice: number;
  sellingPrice: number;
  markupPercent: number;
  profitPerUnit: number;
  marginPercent: number;
  currency: string;
}

export interface PlatformFeeBreakdown {
  platformFeePercent: number;
  platformFeeAmount: number;
  grossProfitPerUnit: number;
  netProfitPerUnit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
}

export function calculatePlatformFeeBreakdown(
  pricing: ListingPricing
): PlatformFeeBreakdown {
  const platformFeeAmount = roundCurrency(
    pricing.sellingPrice * (TIKTOK_PLATFORM_FEE_PERCENT / 100)
  );
  const netProfitPerUnit = roundCurrency(
    pricing.sellingPrice - pricing.costPrice - platformFeeAmount
  );
  const netMarginPercent =
    pricing.sellingPrice > 0
      ? roundCurrency((netProfitPerUnit / pricing.sellingPrice) * 100)
      : 0;

  return {
    platformFeePercent: TIKTOK_PLATFORM_FEE_PERCENT,
    platformFeeAmount,
    grossProfitPerUnit: pricing.profitPerUnit,
    netProfitPerUnit,
    grossMarginPercent: pricing.marginPercent,
    netMarginPercent,
  };
}

export function formatPricingCurrency(
  amount: number,
  currency = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateListingPricing(
  costPrice: number,
  markupPercent: number,
  currency = "USD"
): ListingPricing {
  const sellingPrice = roundCurrency(costPrice * (1 + markupPercent / 100));
  const profitPerUnit = roundCurrency(sellingPrice - costPrice);
  const marginPercent =
    sellingPrice > 0
      ? roundCurrency((profitPerUnit / sellingPrice) * 100)
      : 0;

  return {
    costPrice: roundCurrency(costPrice),
    sellingPrice,
    markupPercent,
    profitPerUnit,
    marginPercent,
    currency,
  };
}

export function pricingFromStoredPrices(
  costPrice: number,
  sellingPrice: number,
  currency = "USD"
): ListingPricing {
  const profitPerUnit = roundCurrency(sellingPrice - costPrice);
  const markupPercent =
    costPrice > 0 ? roundCurrency((profitPerUnit / costPrice) * 100) : 0;
  const marginPercent =
    sellingPrice > 0
      ? roundCurrency((profitPerUnit / sellingPrice) * 100)
      : 0;

  return {
    costPrice: roundCurrency(costPrice),
    sellingPrice: roundCurrency(sellingPrice),
    markupPercent,
    profitPerUnit,
    marginPercent,
    currency,
  };
}
