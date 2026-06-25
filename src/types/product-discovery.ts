import type { ListingPricing } from "@/lib/pricing/listing-pricing";

export type DiscoverSort = "trending" | "cheapest";

export interface DiscoverProductsFilters {
  query?: string;
  maxCost?: number;
  category?: string;
  sort?: DiscoverSort;
}

export interface DiscoveredVendorInfo {
  sku: string;
  platform: string;
  name: string;
  productUrl: string;
  warehouse: string | null;
  shippingOrigin: string | null;
  deliveryDays: number | null;
  shippingLabel: string;
  supportEmail: string | null;
}

export interface DiscoveredProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  category: string;
  costPrice: number;
  suggestedSellPrice: number;
  estimatedMarginPercent: number;
  markupPercent: number;
  profitPerUnit: number;
  pricing: ListingPricing;
  trendingScore: number;
  webTrendBoost: number;
  combinedScore: number;
  supplierName: string;
  supplierPlatform: string;
  vendorSku: string;
  vendor: DiscoveredVendorInfo;
  shippingLabel: string;
  originalSupplierUrl: string;
  webTrendMatch: string | null;
  tiktokTrendBoost: number;
  tiktokTrendKeywords: string[];
  tiktokTrendMatches: string[];
  tiktokTrendMatch: string | null;
  isTikTokHot: boolean;
  isNewPick: boolean;
  importPayload: ImportProductPayload;
}

export interface ProductDiscoveryResult {
  products: DiscoveredProduct[];
  meta: {
    scannedAt: string;
    catalogRefreshedAt: string;
    nextRefreshAt: string;
    refreshWindowId: number;
    catalogSize: number;
    webTrendKeywords: string[];
    tiktokTrendKeywords: string[];
    tiktokHotCategories: string[];
    tiktokTrendSource: string;
    supplierCandidates: number;
    usCompliant: number;
    afterFilters: number;
    sources: string[];
  };
}

export interface ImportProductPayload {
  originalSupplierUrl: string;
  rawData: Record<string, unknown>;
  costPrice: number;
  sellingPrice: number;
}
