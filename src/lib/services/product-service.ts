import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCatalogImages,
  parsePricingFromRaw,
  parseVendorFromRaw,
} from "@/lib/products/catalog-helpers";
import type { ListingPricing } from "@/lib/pricing/listing-pricing";
import type { Json } from "@/types/database";
import type {
  CatalogProduct,
  OptimizedImage,
  ProductRawDataShape,
  ProductStatus,
} from "@/types/products";

const PRODUCT_COLUMNS =
  "id, user_id, original_supplier_url, raw_data, cost_price, selling_price, currency, status, ai_title, ai_description, ai_tags, optimized_images, ai_processing_error, tiktok_product_id, tiktok_listing_url, published_at, created_at";

function parseRawData(raw: Json): ProductRawDataShape {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as ProductRawDataShape;
}

function parseOptimizedImages(raw: Json | null | undefined): OptimizedImage[] {
  if (!raw || !Array.isArray(raw)) return [];

  const images: OptimizedImage[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.url !== "string") continue;

    images.push({
      url: record.url,
      type: (record.type as OptimizedImage["type"]) ?? "gallery",
      width: typeof record.width === "number" ? record.width : 1024,
      height: typeof record.height === "number" ? record.height : 1024,
      source: (record.source as OptimizedImage["source"]) ?? "supplier",
      prompt: typeof record.prompt === "string" ? record.prompt : undefined,
    });
  }

  return images;
}

export function mapRowToCatalogProduct(row: {
  id: string;
  original_supplier_url: string;
  raw_data: Json;
  cost_price: number;
  selling_price: number;
  status: string;
  ai_title: string | null;
  ai_description: string | null;
  ai_tags: string[] | null;
  optimized_images: Json;
  ai_processing_error: string | null;
  tiktok_product_id: string | null;
  tiktok_listing_url: string | null;
  published_at: string | null;
  created_at: string;
}): CatalogProduct {
  const raw = parseRawData(row.raw_data);
  const optimizedImages = parseOptimizedImages(row.optimized_images);
  const costPrice = Number(row.cost_price);
  const sellingPrice = Number(row.selling_price);
  const images = getCatalogImages(raw, optimizedImages);

  return {
    id: row.id,
    title: row.ai_title ?? raw.title ?? "Untitled product",
    description: row.ai_description ?? raw.description ?? "",
    status: row.status as ProductStatus,
    costPrice,
    sellingPrice,
    imageUrl: images[0] ?? null,
    images,
    supplierName: raw.supplier_name ?? null,
    category: raw.category ?? null,
    aiTitle: row.ai_title,
    aiDescription: row.ai_description,
    aiTags: row.ai_tags ?? [],
    optimizedImages,
    originalSupplierUrl: row.original_supplier_url,
    createdAt: row.created_at,
    tiktokMarketing: raw.tiktok_marketing ?? null,
    processingError: row.ai_processing_error,
    vendor: parseVendorFromRaw(raw, row.original_supplier_url),
    pricing: parsePricingFromRaw(raw, costPrice, sellingPrice),
    tiktokProductId: row.tiktok_product_id,
    tiktokListingUrl: row.tiktok_listing_url,
    publishedAt: row.published_at,
  };
}

export async function listUserProducts(userId: string): Promise<CatalogProduct[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data ?? []).map(mapRowToCatalogProduct);
}

export async function getUserProductsByIds(
  userId: string,
  productIds: string[]
): Promise<CatalogProduct[]> {
  if (productIds.length === 0) return [];

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("user_id", userId)
    .in("id", productIds);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data ?? []).map(mapRowToCatalogProduct);
}

export async function markProductProcessing(productId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("products")
    .update({ status: "ai_processing", ai_processing_error: null })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }
}

export async function savePricingTransform(
  productId: string,
  input: {
    title: string;
    description: string;
    tags: [string, string, string, string, string];
    pricing: ListingPricing;
    tiktokMarketing: {
      tiktokCaption: string;
      videoHook: string;
      hashtags: string[];
      callToAction: string;
    };
    images: OptimizedImage[];
  }
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("raw_data")
    .eq("id", productId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load product: ${fetchError.message}`);
  }

  const currentRaw = parseRawData(existing.raw_data);
  const mergedRaw: ProductRawDataShape = {
    ...currentRaw,
    listing_pricing: {
      cost_price: input.pricing.costPrice,
      selling_price: input.pricing.sellingPrice,
      markup_percent: input.pricing.markupPercent,
      profit_per_unit: input.pricing.profitPerUnit,
      margin_percent: input.pricing.marginPercent,
      currency: input.pricing.currency,
    },
    tiktok_marketing: input.tiktokMarketing,
  };

  const { error } = await supabase
    .from("products")
    .update({
      cost_price: input.pricing.costPrice,
      selling_price: input.pricing.sellingPrice,
      currency: input.pricing.currency,
      ai_title: input.title,
      ai_description: input.description,
      ai_tags: input.tags,
      optimized_images: input.images as unknown as Json,
      raw_data: mergedRaw as unknown as Json,
      status: "ready_for_review",
      ai_processing_error: null,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to save listing: ${error.message}`);
  }
}

export async function markProductFailed(
  productId: string,
  message: string
): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase
    .from("products")
    .update({
      status: "failed",
      ai_processing_error: message,
    })
    .eq("id", productId);
}
