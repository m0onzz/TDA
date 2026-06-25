import { z } from "zod";
import { SIMULATED_TRENDING_PRODUCTS } from "@/data/supplier-product-catalog";
import { getProductImageUrls } from "@/lib/products/product-image-url";
import { resolveTikTokTrendTags } from "@/services/tiktokShopTrends";

// ---------------------------------------------------------------------------
// Raw supplier API types (AutoDS / Zendrop-style feed layout)
// ---------------------------------------------------------------------------

export type SupplierPlatform = "autods" | "zendrop" | "cj_dropshipping";

export interface SupplierShippingInfo {
  shipping_origin?: string;
  warehouse?: string;
  /** Upper-bound business-day delivery estimate from supplier */
  delivery_estimate_business_days?: number;
  /** Supplier-guaranteed business-day delivery (must be < 5 to qualify alone) */
  guaranteed_delivery_business_days?: number;
}

export interface SupplierProductVariant {
  sku: string;
  title: string;
  cost_usd: number;
  inventory_count: number;
}

export interface SupplierRawProduct {
  id: string;
  platform: SupplierPlatform;
  title: string;
  description: string;
  product_url: string;
  images: string[];
  cost_usd: number;
  currency: string;
  category: string;
  trending_score: number;
  shipping: SupplierShippingInfo;
  variants?: SupplierProductVariant[];
  supplier_name: string;
  last_updated: string;
  tiktok_trend_tags?: string[];
}

export interface SupplierTrendingFeedMeta {
  platform: SupplierPlatform;
  fetched_at: string;
  page: number;
  total_results: number;
}

export interface SupplierTrendingFeedResponse {
  meta: SupplierTrendingFeedMeta;
  products: SupplierRawProduct[];
}

export interface SupplierFilterRejection {
  productId: string;
  title: string;
  reason: string;
}

export interface SupplierFilterResult {
  accepted: ProductPipelineInsert[];
  rejected: SupplierFilterRejection[];
}

// ---------------------------------------------------------------------------
// Internal product structure (Supabase `products` + AI pipeline)
// ---------------------------------------------------------------------------

export interface ProductRawData {
  supplier_product_id: string;
  supplier_platform: SupplierPlatform;
  supplier_name: string;
  title: string;
  description: string;
  images: string[];
  vendor_listing_images?: string[];
  category: string;
  currency: string;
  trending_score: number;
  shipping: SupplierShippingInfo;
  variants: SupplierProductVariant[];
  scraped_at: string;
  tiktok_trend_tags?: string[];
  vendor?: {
    sku: string;
    platform: SupplierPlatform;
    name: string;
    product_url: string;
    warehouse?: string;
    shipping_origin?: string;
    delivery_days?: number;
    shipping_label?: string;
    support_email?: string;
  };
}

/** Rows ready for insert into `products` before AI optimization. */
export interface ProductPipelineInsert {
  original_supplier_url: string;
  raw_data: ProductRawData;
  cost_price: number;
  currency: "USD";
  status: "draft";
}

// ---------------------------------------------------------------------------
// Zod validation
// ---------------------------------------------------------------------------

const supplierShippingSchema = z.object({
  shipping_origin: z.string().optional(),
  warehouse: z.string().optional(),
  delivery_estimate_business_days: z.number().int().positive().optional(),
  guaranteed_delivery_business_days: z.number().int().positive().optional(),
});

const supplierVariantSchema = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  cost_usd: z.number().nonnegative(),
  inventory_count: z.number().int().nonnegative(),
});

export const supplierRawProductSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(["autods", "zendrop", "cj_dropshipping"]),
  title: z.string().min(1),
  description: z.string().min(1),
  product_url: z.string().url(),
  images: z.array(z.string().url()).min(1),
  cost_usd: z.number().nonnegative(),
  currency: z.string().min(1),
  category: z.string().min(1),
  trending_score: z.number(),
  shipping: supplierShippingSchema,
  variants: z.array(supplierVariantSchema).optional(),
  supplier_name: z.string().min(1),
  last_updated: z.string().min(1),
  tiktok_trend_tags: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// US inventory filter (48h / TikTok compliance gate)
// ---------------------------------------------------------------------------

const US_ORIGIN = "US";
const US_DOMESTIC_WAREHOUSE = "US_Domestic";
const MAX_BUSINESS_DAYS = 5;

function hasUsShippingOrigin(shipping: SupplierShippingInfo): boolean {
  return shipping.shipping_origin?.toUpperCase() === US_ORIGIN;
}

function hasUsDomesticWarehouse(shipping: SupplierShippingInfo): boolean {
  return shipping.warehouse === US_DOMESTIC_WAREHOUSE;
}

function hasFastGuaranteedDelivery(shipping: SupplierShippingInfo): boolean {
  const guaranteed = shipping.guaranteed_delivery_business_days;
  return guaranteed !== undefined && guaranteed < MAX_BUSINESS_DAYS;
}

/**
 * Strict US-inventory gate. A product passes only if at least one is true:
 * - shipping_origin === "US"
 * - warehouse === "US_Domestic"
 * - guaranteed delivery estimate < 5 business days
 */
export function passesUSInventoryFilter(shipping: SupplierShippingInfo): boolean {
  return (
    hasUsShippingOrigin(shipping) ||
    hasUsDomesticWarehouse(shipping) ||
    hasFastGuaranteedDelivery(shipping)
  );
}

export function getUSInventoryRejectionReason(
  shipping: SupplierShippingInfo
): string {
  return [
    `shipping_origin must be "${US_ORIGIN}"`,
    `warehouse must be "${US_DOMESTIC_WAREHOUSE}"`,
    `or guaranteed delivery must be under ${MAX_BUSINESS_DAYS} business days`,
    `(received: origin=${shipping.shipping_origin ?? "none"},`,
    `warehouse=${shipping.warehouse ?? "none"},`,
    `guaranteed=${shipping.guaranteed_delivery_business_days ?? "none"}d,`,
    `estimate=${shipping.delivery_estimate_business_days ?? "none"}d)`,
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function buildShippingLabel(shipping: SupplierShippingInfo): string {
  if (shipping.warehouse === "US_Domestic") {
    const days =
      shipping.guaranteed_delivery_business_days ??
      shipping.delivery_estimate_business_days;
    return days ? `US warehouse · ${days}-day ship` : "US domestic warehouse";
  }

  if (shipping.shipping_origin === "US") {
    const days = shipping.guaranteed_delivery_business_days;
    return days ? `Ships from US · ${days}-day delivery` : "Ships from US";
  }

  const guaranteed = shipping.guaranteed_delivery_business_days;
  if (guaranteed !== undefined) {
    return `US fulfillment · ${guaranteed}-day delivery`;
  }

  return "US-fast shipping";
}

function vendorSupportEmail(platform: SupplierPlatform): string {
  switch (platform) {
    case "zendrop":
      return "fulfillment@zendrop.com";
    case "autods":
      return "support@autods.com";
    case "cj_dropshipping":
      return "warehouse@cjdropshipping.com";
  }
}

export function parseSupplierProductForPipeline(
  product: SupplierRawProduct
): ProductPipelineInsert {
  const validated = supplierRawProductSchema.parse(product);
  const scrapedAt = new Date().toISOString();
  const vendorListingImages = validated.images;
  const images = getProductImageUrls(validated.id);
  const deliveryDays =
    validated.shipping.guaranteed_delivery_business_days ??
    validated.shipping.delivery_estimate_business_days ??
    null;

  const tiktokTrendTags = resolveTikTokTrendTags({
    title: validated.title,
    description: validated.description,
    category: validated.category,
    costUsd: validated.cost_usd,
  });
  const trendTagBoost = Math.min(tiktokTrendTags.length * 2, 8);
  const trendingScore = Math.min(validated.trending_score + trendTagBoost, 100);

  const raw_data: ProductRawData = {
    supplier_product_id: validated.id,
    supplier_platform: validated.platform,
    supplier_name: validated.supplier_name,
    title: validated.title,
    description: validated.description,
    images,
    vendor_listing_images: vendorListingImages,
    category: validated.category,
    currency: validated.currency,
    trending_score: trendingScore,
    shipping: validated.shipping,
    variants:
      validated.variants ??
      [
        {
          sku: validated.id,
          title: "Default",
          cost_usd: validated.cost_usd,
          inventory_count: 250,
        },
      ],
    scraped_at: scrapedAt,
    tiktok_trend_tags:
      tiktokTrendTags.length > 0 ? tiktokTrendTags : validated.tiktok_trend_tags,
    vendor: {
      sku: validated.id,
      platform: validated.platform,
      name: validated.supplier_name,
      product_url: validated.product_url,
      warehouse: validated.shipping.warehouse,
      shipping_origin: validated.shipping.shipping_origin,
      delivery_days: deliveryDays ?? undefined,
      shipping_label: buildShippingLabel(validated.shipping),
      support_email: vendorSupportEmail(validated.platform),
    },
  };

  return {
    original_supplier_url: validated.product_url,
    raw_data,
    cost_price: roundCurrency(validated.cost_usd),
    currency: "USD",
    status: "draft",
  };
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Filters a raw supplier feed for US-warehouse / fast-domestic delivery SKUs
 * and maps survivors into Supabase-ready product inserts for the AI pipeline.
 */
export function filterForUSInventory(
  products: SupplierRawProduct[]
): SupplierFilterResult {
  const accepted: ProductPipelineInsert[] = [];
  const rejected: SupplierFilterRejection[] = [];

  for (const product of products) {
    const parsed = supplierRawProductSchema.safeParse(product);

    if (!parsed.success) {
      rejected.push({
        productId: product.id ?? "unknown",
        title: product.title ?? "Unknown product",
        reason: parsed.error.issues[0]?.message ?? "Invalid supplier payload",
      });
      continue;
    }

    if (!passesUSInventoryFilter(parsed.data.shipping)) {
      rejected.push({
        productId: parsed.data.id,
        title: parsed.data.title,
        reason: getUSInventoryRejectionReason(parsed.data.shipping),
      });
      continue;
    }

    accepted.push(parseSupplierProductForPipeline(parsed.data));
  }

  return { accepted, rejected };
}

// ---------------------------------------------------------------------------
// Simulated supplier feed (dummy AutoDS / Zendrop API)
// ---------------------------------------------------------------------------

/**
 * Simulates a call to a dropshipping supplier trending-products endpoint.
 * Replace the body with a real HTTP client when integrating AutoDS/Zendrop APIs.
 */
export async function fetchTrendingProducts(
  platform: SupplierPlatform = "zendrop"
): Promise<SupplierTrendingFeedResponse> {
  await delay(120);

  const products = SIMULATED_TRENDING_PRODUCTS.filter(
    (product) => product.platform === platform
  );

  const results =
    products.length > 0 ? products : SIMULATED_TRENDING_PRODUCTS;

  return {
    meta: {
      platform,
      fetched_at: new Date().toISOString(),
      page: 1,
      total_results: results.length,
    },
    products: results,
  };
}

let cachedAllTrendingProducts: SupplierRawProduct[] | null = null;
let cachedUSCompliantPipeline: ProductPipelineInsert[] | null = null;

/** Aggregate trending SKUs across every simulated supplier platform. */
export async function fetchAllTrendingProducts(): Promise<SupplierRawProduct[]> {
  if (cachedAllTrendingProducts) {
    return cachedAllTrendingProducts;
  }

  const platforms: SupplierPlatform[] = [
    "zendrop",
    "autods",
    "cj_dropshipping",
  ];

  const feeds = await Promise.all(
    platforms.map((platform) => fetchTrendingProducts(platform))
  );

  const seen = new Set<string>();
  const merged: SupplierRawProduct[] = [];

  for (const feed of feeds) {
    for (const product of feed.products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      merged.push(product);
    }
  }

  cachedAllTrendingProducts = merged;
  return merged;
}

/** US-compliant pipeline rows from the simulated catalog (cached after first build). */
export async function fetchUSCompliantPipelineProducts(): Promise<
  ProductPipelineInsert[]
> {
  if (cachedUSCompliantPipeline) {
    return cachedUSCompliantPipeline;
  }

  const catalog = await fetchAllTrendingProducts();
  cachedUSCompliantPipeline = filterForUSInventory(catalog).accepted;
  return cachedUSCompliantPipeline;
}

/**
 * Convenience: fetch trending feed and return only US-compliant pipeline rows.
 */
export async function fetchUSCompliantTrendingProducts(
  platform: SupplierPlatform = "zendrop"
): Promise<SupplierFilterResult> {
  const feed = await fetchTrendingProducts(platform);
  return filterForUSInventory(feed.products);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
