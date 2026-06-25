import {
  fetchWebTrendKeywords,
  scoreWebTrendMatch,
} from "@/services/webTrendScanner";
import {
  fetchTikTokShopTrends,
  scoreTikTokTrendMatch,
} from "@/services/tiktokShopTrends";
import {
  filterForUSInventory,
  fetchAllTrendingProducts,
  type ProductPipelineInsert,
  type SupplierShippingInfo,
} from "@/services/supplierSourcing";
import {
  calculateListingPricing,
} from "@/lib/pricing/listing-pricing";
import {
  getCatalogRefreshState,
  getFeaturedProductIds,
  getRotationTrendingBoost,
} from "@/lib/catalog/rotation";
import { CATALOG_SIZE } from "@/data/supplier-product-catalog";
import {
  getProductImageUrl,
  getProductImageUrls,
} from "@/lib/products/product-image-url";
import type {
  DiscoveredProduct,
  DiscoveredVendorInfo,
  DiscoverProductsFilters,
  DiscoverSort,
  ProductDiscoveryResult,
} from "@/types/product-discovery";

const DEFAULT_MAX_COST = 25;
const DEFAULT_MARKUP_PERCENT = 40;

function buildShippingLabel(shipping: SupplierShippingInfo): string {
  if (shipping.warehouse === "US_Domestic") {
    const days =
      shipping.guaranteed_delivery_business_days ??
      shipping.delivery_estimate_business_days;
    return days ? `US warehouse · ${days}-day ship` : "US domestic warehouse";
  }

  if (shipping.shipping_origin === "US") {
    return "Ships from US";
  }

  const guaranteed = shipping.guaranteed_delivery_business_days;
  if (guaranteed !== undefined) {
    return `US fulfillment · ${guaranteed}-day delivery`;
  }

  return "US-fast shipping";
}

function matchesQuery(product: ProductPipelineInsert, query?: string): boolean {
  if (!query?.trim()) return true;

  const haystack = [
    product.raw_data.title,
    product.raw_data.description,
    product.raw_data.category,
    product.raw_data.supplier_name,
    product.raw_data.vendor?.name,
    product.raw_data.vendor?.sku,
    ...(product.raw_data.tiktok_trend_tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const terms = query.trim().toLowerCase().split(/\s+/);
  return terms.every((term) => haystack.includes(term));
}

function matchesCategory(
  product: ProductPipelineInsert,
  category?: string
): boolean {
  if (!category || category === "all") return true;
  return product.raw_data.category.toLowerCase() === category.toLowerCase();
}

function sortProducts(
  products: DiscoveredProduct[],
  sort: DiscoverSort
): DiscoveredProduct[] {
  const copy = [...products];

  switch (sort) {
    case "cheapest":
      return copy.sort((a, b) => a.costPrice - b.costPrice);
    case "margin":
      return copy.sort(
        (a, b) => b.estimatedMarginPercent - a.estimatedMarginPercent
      );
    case "trending":
    default:
      return copy.sort((a, b) => b.combinedScore - a.combinedScore);
  }
}

function toDiscoveredProduct(
  pipeline: ProductPipelineInsert,
  markupPercent: number,
  webTrendBoost: number,
  webTrendMatch: string | null,
  tiktokTrend: {
    boost: number;
    primaryMatch: string | null;
    matches: string[];
    isHot: boolean;
    matchReason: string | null;
  },
  rotationTrendingBoost: number,
  isNewPick: boolean
): DiscoveredProduct {
  const pricing = calculateListingPricing(pipeline.cost_price, markupPercent);
  const vendor = pipeline.raw_data.vendor;

  const vendorInfo: DiscoveredVendorInfo = {
    sku: vendor?.sku ?? pipeline.raw_data.supplier_product_id,
    platform: vendor?.platform ?? pipeline.raw_data.supplier_platform,
    name: vendor?.name ?? pipeline.raw_data.supplier_name,
    productUrl: vendor?.product_url ?? pipeline.original_supplier_url,
    warehouse: vendor?.warehouse ?? pipeline.raw_data.shipping.warehouse ?? null,
    shippingOrigin:
      vendor?.shipping_origin ?? pipeline.raw_data.shipping.shipping_origin ?? null,
    deliveryDays:
      vendor?.delivery_days ??
      pipeline.raw_data.shipping.guaranteed_delivery_business_days ??
      pipeline.raw_data.shipping.delivery_estimate_business_days ??
      null,
    shippingLabel:
      vendor?.shipping_label ?? buildShippingLabel(pipeline.raw_data.shipping),
    supportEmail: vendor?.support_email ?? null,
  };

  const adjustedTrendingScore =
    pipeline.raw_data.trending_score + rotationTrendingBoost;

  const combinedScore =
    adjustedTrendingScore +
    webTrendBoost +
    tiktokTrend.boost +
    (25 - pipeline.cost_price);

  const enrichedRawData = {
    ...pipeline.raw_data,
    vendor: {
      sku: vendorInfo.sku,
      platform: vendorInfo.platform,
      name: vendorInfo.name,
      product_url: vendorInfo.productUrl,
      warehouse: vendorInfo.warehouse ?? undefined,
      shipping_origin: vendorInfo.shippingOrigin ?? undefined,
      delivery_days: vendorInfo.deliveryDays ?? undefined,
      shipping_label: vendorInfo.shippingLabel,
      support_email: vendorInfo.supportEmail ?? undefined,
    },
    listing_pricing: {
      cost_price: pricing.costPrice,
      selling_price: pricing.sellingPrice,
      markup_percent: pricing.markupPercent,
      profit_per_unit: pricing.profitPerUnit,
      margin_percent: pricing.marginPercent,
      currency: pricing.currency,
    },
  };

  const productId = pipeline.raw_data.supplier_product_id;

  return {
    id: productId,
    title: pipeline.raw_data.title,
    description: pipeline.raw_data.description,
    imageUrl: getProductImageUrl(productId, 0),
    imageUrls: getProductImageUrls(productId),
    category: pipeline.raw_data.category,
    costPrice: pricing.costPrice,
    suggestedSellPrice: pricing.sellingPrice,
    estimatedMarginPercent: pricing.marginPercent,
    markupPercent: pricing.markupPercent,
    profitPerUnit: pricing.profitPerUnit,
    pricing,
    trendingScore: adjustedTrendingScore,
    webTrendBoost,
    combinedScore,
    supplierName: pipeline.raw_data.supplier_name,
    supplierPlatform: pipeline.raw_data.supplier_platform,
    vendorSku: vendorInfo.sku,
    vendor: vendorInfo,
    shippingLabel: vendorInfo.shippingLabel,
    originalSupplierUrl: pipeline.original_supplier_url,
    webTrendMatch,
    tiktokTrendBoost: tiktokTrend.boost,
    tiktokTrendKeywords: tiktokTrend.matches,
    tiktokTrendMatches: tiktokTrend.matches,
    tiktokTrendMatch: tiktokTrend.matchReason,
    isTikTokHot: tiktokTrend.isHot,
    isNewPick,
    importPayload: {
      originalSupplierUrl: pipeline.original_supplier_url,
      rawData: enrichedRawData as unknown as Record<string, unknown>,
      costPrice: pricing.costPrice,
      sellingPrice: pricing.sellingPrice,
    },
  };
}

/**
 * Discovers cheap, trending, US-shippable products by combining:
 * 1. Live web trend keywords (Reddit hot posts)
 * 2. TikTok Shop bestseller patterns (curated or live API when credentialed)
 * 3. Multi-platform supplier feeds (Zendrop / AutoDS / CJ)
 * 4. Strict US-inventory filtering for 48h TikTok compliance
 */
export async function discoverProducts(
  filters: DiscoverProductsFilters = {}
): Promise<ProductDiscoveryResult> {
  const maxCost = filters.maxCost ?? DEFAULT_MAX_COST;
  const markupPercent = filters.markupPercent ?? DEFAULT_MARKUP_PERCENT;
  const sort = filters.sort ?? "trending";

  const refreshState = getCatalogRefreshState();

  const [
    { keywords, sources: webSources },
    tiktokTrends,
    supplierCatalog,
  ] = await Promise.all([
    fetchWebTrendKeywords(),
    fetchTikTokShopTrends(),
    fetchAllTrendingProducts(),
  ]);

  const mergedWebKeywords = Array.from(
    new Set([...keywords, ...tiktokTrends.trendingKeywords.slice(0, 12)])
  );

  const { accepted } = filterForUSInventory(supplierCatalog);

  const affordable = accepted.filter(
    (product) => product.cost_price <= maxCost
  );

  const featuredIds = getFeaturedProductIds(
    affordable.map((product) => product.raw_data.supplier_product_id),
    refreshState.windowId
  );

  const discovered = affordable
    .filter(
      (product) =>
        matchesQuery(product, filters.query) &&
        matchesCategory(product, filters.category)
    )
    .map((product) => {
      const productId = product.raw_data.supplier_product_id;
      const rotationBoost = getRotationTrendingBoost(
        productId,
        refreshState.windowId
      );
      const { boost, match } = scoreWebTrendMatch(
        product.raw_data.title,
        mergedWebKeywords
      );
      const tiktokTrend = scoreTikTokTrendMatch(
        {
          title: product.raw_data.title,
          description: product.raw_data.description,
          category: product.raw_data.category,
          costPrice: product.cost_price,
          catalogTags: product.raw_data.tiktok_trend_tags,
        },
        tiktokTrends
      );
      return toDiscoveredProduct(
        product,
        markupPercent,
        boost,
        match,
        tiktokTrend,
        rotationBoost,
        featuredIds.has(productId)
      );
    });

  const products = sortProducts(discovered, sort);

  return {
    products,
    meta: {
      scannedAt: new Date().toISOString(),
      catalogRefreshedAt: refreshState.refreshedAt.toISOString(),
      nextRefreshAt: refreshState.nextRefreshAt.toISOString(),
      refreshWindowId: refreshState.windowId,
      catalogSize: CATALOG_SIZE,
      webTrendKeywords: mergedWebKeywords.slice(0, 12),
      tiktokTrendKeywords: tiktokTrends.trendingKeywords.slice(0, 12),
      tiktokHotCategories: tiktokTrends.hotCategories.map((cat) => cat.name),
      tiktokTrendSource:
        tiktokTrends.source === "curated"
          ? "curated/tiktok-shop-bestsellers"
          : "tiktok_shop_api",
      supplierCandidates: supplierCatalog.length,
      usCompliant: accepted.length,
      afterFilters: products.length,
      sources: [
        ...webSources,
        tiktokTrends.source === "curated"
          ? "curated/tiktok-shop-bestsellers"
          : "tiktok_shop_api",
        "suppliers/zendrop",
        "suppliers/autods",
        "suppliers/cj_dropshipping",
      ],
      defaultMarkupPercent: markupPercent,
    },
  };
}
