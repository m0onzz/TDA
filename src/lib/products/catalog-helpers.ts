import type { ProductRawDataShape, OptimizedImage } from "@/types/products";
import type { VendorInfo } from "@/types/products";
import {
  pricingFromStoredPrices,
  type ListingPricing,
} from "@/lib/pricing/listing-pricing";

export function parseVendorFromRaw(
  raw: ProductRawDataShape,
  originalSupplierUrl: string
): VendorInfo | null {
  if (raw.vendor) {
    return {
      sku: raw.vendor.sku,
      platform: raw.vendor.platform,
      name: raw.vendor.name,
      productUrl: raw.vendor.product_url,
      warehouse: raw.vendor.warehouse ?? null,
      shippingOrigin: raw.vendor.shipping_origin ?? null,
      deliveryDays: raw.vendor.delivery_days ?? null,
      shippingLabel: raw.vendor.shipping_label ?? null,
      supportEmail: raw.vendor.support_email ?? null,
    };
  }

  if (!raw.supplier_name && !raw.supplier_product_id) {
    return null;
  }

  const deliveryDays =
    raw.shipping?.guaranteed_delivery_business_days ??
    raw.shipping?.delivery_estimate_business_days ??
    null;

  return {
    sku: raw.supplier_product_id ?? "unknown",
    platform: raw.supplier_platform ?? "supplier",
    name: raw.supplier_name ?? "Unknown vendor",
    productUrl: originalSupplierUrl,
    warehouse: raw.shipping?.warehouse ?? null,
    shippingOrigin: raw.shipping?.shipping_origin ?? null,
    deliveryDays,
    shippingLabel: null,
  };
}

export function parsePricingFromRaw(
  raw: ProductRawDataShape,
  costPrice: number,
  sellingPrice: number
): ListingPricing {
  if (raw.listing_pricing) {
    return {
      costPrice: raw.listing_pricing.cost_price,
      sellingPrice: raw.listing_pricing.selling_price,
      markupPercent: raw.listing_pricing.markup_percent,
      profitPerUnit: raw.listing_pricing.profit_per_unit,
      marginPercent: raw.listing_pricing.margin_percent,
      currency: raw.listing_pricing.currency,
    };
  }

  return pricingFromStoredPrices(costPrice, sellingPrice);
}

export function getCatalogImages(
  raw: ProductRawDataShape,
  optimizedImages: Array<{ url: string; source?: OptimizedImage["source"] }>
): string[] {
  if (raw.tiktok_shop_images && raw.tiktok_shop_images.length > 0) {
    return raw.tiktok_shop_images;
  }

  const tiktokOptimized: string[] = [];
  const allOptimized: string[] = [];

  for (const image of optimizedImages) {
    allOptimized.push(image.url);
    if (image.source === "tiktok") {
      tiktokOptimized.push(image.url);
    }
  }

  if (tiktokOptimized.length > 0) {
    return tiktokOptimized;
  }

  if (allOptimized.length > 0) {
    return allOptimized;
  }

  if (raw.images && raw.images.length > 0) {
    return raw.images;
  }

  if (raw.vendor_listing_images && raw.vendor_listing_images.length > 0) {
    return raw.vendor_listing_images;
  }

  return [];
}

export function getCatalogFallbackImages(
  raw: ProductRawDataShape,
  optimizedImages: Array<{ url: string; source?: OptimizedImage["source"] }>,
  currentDisplay: string[] = getCatalogImages(raw, optimizedImages)
): string[] {
  if (raw.fallback_images && raw.fallback_images.length > 0) {
    return raw.fallback_images;
  }

  const supplierOptimized = optimizedImages
    .filter((image) => image.source !== "tiktok")
    .map((image) => image.url);
  if (supplierOptimized.length > 0) {
    return supplierOptimized;
  }

  if (raw.images && raw.images.length > 0) {
    return raw.images;
  }

  if (raw.vendor_listing_images && raw.vendor_listing_images.length > 0) {
    return raw.vendor_listing_images;
  }

  if (currentDisplay.length > 0) {
    return currentDisplay;
  }

  return [];
}
