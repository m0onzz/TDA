import type { ListingPricing } from "@/lib/pricing/listing-pricing";
import type { OptimalPricingResult } from "@/lib/pricing/optimal-pricing";

export interface VendorInfo {
  sku: string;
  platform: string;
  name: string;
  productUrl: string;
  warehouse: string | null;
  shippingOrigin: string | null;
  deliveryDays: number | null;
  shippingLabel: string | null;
  supportEmail?: string | null;
}

export interface ProductRawDataShape {
  title?: string;
  description?: string;
  images?: string[];
  /** Direct vendor CDN URLs (pre-proxy) for the full listing gallery. */
  vendor_listing_images?: string[];
  supplier_name?: string;
  supplier_platform?: string;
  supplier_product_id?: string;
  category?: string;
  shipping?: {
    shipping_origin?: string;
    warehouse?: string;
    delivery_estimate_business_days?: number;
    guaranteed_delivery_business_days?: number;
  };
  variants?: Array<{
    sku: string;
    title: string;
    cost_usd: number;
    inventory_count: number;
  }>;
  vendor?: {
    sku: string;
    platform: string;
    name: string;
    product_url: string;
    warehouse?: string;
    shipping_origin?: string;
    delivery_days?: number;
    shipping_label?: string;
    support_email?: string;
  };
  listing_pricing?: {
    cost_price: number;
    selling_price: number;
    markup_percent: number;
    profit_per_unit: number;
    margin_percent: number;
    currency: string;
  };
  tiktok_marketing?: {
    tiktokCaption: string;
    videoHook: string;
    hashtags: string[];
    callToAction: string;
  };
}

export interface OptimizedImage {
  url: string;
  type: "main" | "lifestyle" | "detail" | "gallery";
  width: number;
  height: number;
  source: "supplier";
  prompt?: string;
}

export type ProductStatus =
  | "draft"
  | "scraping"
  | "ai_processing"
  | "ready_for_review"
  | "published"
  | "failed"
  | "archived";

export interface CatalogProduct {
  id: string;
  title: string;
  description: string;
  status: ProductStatus;
  costPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
  images: string[];
  supplierName: string | null;
  category: string | null;
  aiTitle: string | null;
  aiDescription: string | null;
  aiTags: string[];
  optimizedImages: OptimizedImage[];
  originalSupplierUrl: string;
  createdAt: string;
  tiktokMarketing: {
    tiktokCaption: string;
    videoHook: string;
    hashtags: string[];
    callToAction: string;
  } | null;
  processingError: string | null;
  vendor: VendorInfo | null;
  pricing: ListingPricing;
  tiktokProductId: string | null;
  tiktokListingUrl: string | null;
  publishedAt: string | null;
}

export interface TransformProductResult {
  productId: string;
  success: boolean;
  pricing?: ListingPricing | OptimalPricingResult;
  images?: OptimizedImage[];
  error?: string;
}

export interface PublishProductResult {
  productId: string;
  success: boolean;
  tiktokProductId?: string;
  tiktokListingUrl?: string;
  mode?: "simulation" | "live";
  error?: string;
}

export interface UnlistProductResult {
  productId: string;
  success: boolean;
  mode?: "simulation" | "live";
  error?: string;
}
