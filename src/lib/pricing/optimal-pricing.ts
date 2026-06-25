import {
  type ListingPricing,
  pricingFromStoredPrices,
  roundCurrency,
} from "@/lib/pricing/listing-pricing";

/** Estimated TikTok Shop + payment fees as % of selling price. */
const PLATFORM_FEE_PERCENT = 10;

/** Minimum net margin we target after fees. */
const MIN_NET_MARGIN_PERCENT = 28;

export interface OptimalPricingResult extends ListingPricing {
  /** Markup % used before charm pricing adjustments. */
  baseMarkupPercent: number;
  /** Short explanation shown in the UI. */
  rationale: string;
}

function charmPrice(rawPrice: number): number {
  if (rawPrice < 5) {
    return roundCurrency(Math.max(rawPrice, Math.ceil(rawPrice * 20) / 20));
  }

  const whole = Math.floor(rawPrice);
  const candidate = whole + 0.99;

  if (candidate < rawPrice && whole > 0) {
    return roundCurrency(whole + 0.99);
  }

  if (whole === 0) {
    return roundCurrency(rawPrice);
  }

  return roundCurrency(candidate);
}

function targetMarkupForCost(costPrice: number): {
  markupPercent: number;
  minProfit: number;
  rationale: string;
} {
  if (costPrice < 5) {
    return {
      markupPercent: 95,
      minProfit: 5,
      rationale: "Low-cost item — higher markup to hit minimum profit per sale.",
    };
  }

  if (costPrice < 12) {
    return {
      markupPercent: 58,
      minProfit: 6.5,
      rationale: "Budget product — balanced markup for strong margin and conversion.",
    };
  }

  if (costPrice < 25) {
    return {
      markupPercent: 48,
      minProfit: 8,
      rationale: "Mid-range product — optimized for ~40%+ margin after fees.",
    };
  }

  if (costPrice < 50) {
    return {
      markupPercent: 40,
      minProfit: 12,
      rationale: "Higher-ticket item — competitive price with healthy profit.",
    };
  }

  return {
    markupPercent: 34,
    minProfit: 15,
    rationale: "Premium product — lean markup, higher absolute profit per unit.",
  };
}

function netMarginPercent(costPrice: number, sellingPrice: number): number {
  const fees = sellingPrice * (PLATFORM_FEE_PERCENT / 100);
  const netProfit = sellingPrice - costPrice - fees;
  return sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
}

/**
 * Picks a TikTok Shop selling price with strong margins, charm pricing (.99),
 * and a buffer for platform fees.
 */
export function calculateOptimalListingPricing(
  costPrice: number,
  currency = "USD"
): OptimalPricingResult {
  if (costPrice <= 0) {
    throw new Error("Cost price must be greater than zero");
  }

  const { markupPercent, minProfit, rationale } = targetMarkupForCost(costPrice);

  const feeMultiplier = 1 + PLATFORM_FEE_PERCENT / 100;
  const floorFromProfit = (costPrice + minProfit) * feeMultiplier;
  const floorFromMarkup = costPrice * (1 + markupPercent / 100);

  let sellingPrice = charmPrice(Math.max(floorFromProfit, floorFromMarkup));

  for (let attempt = 0; attempt < 6; attempt++) {
    const margin = netMarginPercent(costPrice, sellingPrice);
    if (margin >= MIN_NET_MARGIN_PERCENT) {
      break;
    }
    sellingPrice = charmPrice(sellingPrice * 1.06);
  }

  const pricing = pricingFromStoredPrices(costPrice, sellingPrice, currency);

  return {
    ...pricing,
    baseMarkupPercent: markupPercent,
    rationale,
  };
}
