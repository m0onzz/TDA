import type { ProductRawDataShape } from "@/types/products";
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
  optimizedImages: Array<{ url: string }>
): string[] {
  if (optimizedImages.length > 0) {
    return optimizedImages.map((image) => image.url);
  }

  if (raw.images && raw.images.length > 0) {
    return raw.images;
  }

  if (raw.vendor_listing_images && raw.vendor_listing_images.length > 0) {
    return raw.vendor_listing_images;
  }

  return [];
}
