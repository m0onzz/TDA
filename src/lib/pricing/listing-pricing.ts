export interface ListingPricing {
  costPrice: number;
  sellingPrice: number;
  markupPercent: number;
  profitPerUnit: number;
  marginPercent: number;
  currency: string;
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
