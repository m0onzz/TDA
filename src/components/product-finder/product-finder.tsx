"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  PackagePlus,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { getProductImageUrl } from "@/lib/products/product-image-url";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useFeedback } from "@/components/providers/feedback-provider";
import type {
  DiscoveredProduct,
  DiscoverSort,
  ProductDiscoveryResult,
} from "@/types/product-discovery";
import { cn } from "@/lib/utils";

const MAX_COST_OPTIONS = [10, 15, 25, 40] as const;
const CATALOG_REFRESH_MS = 5 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 350;

const SORT_LABELS: Record<DiscoverSort, string> = {
  trending: "trending",
  cheapest: "cheapest",
};

export function ProductFinder() {
  const { feedback } = useFeedback();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [maxCost, setMaxCost] = useState<number>(25);
  const [sort, setSort] = useState<DiscoverSort>("trending");
  const [result, setResult] = useState<ProductDiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());
  const hasScannedRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  const loadImportedProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products?summary=imported-urls");
      const json = await response.json();

      if (response.ok && json.data?.urls) {
        setImportedUrls(new Set<string>(json.data.urls));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const scanProducts = useCallback(
    async (options?: { background?: boolean }) => {
      const isBackground = options?.background ?? hasScannedRef.current;
      const currentRequestId = ++requestIdRef.current;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        maxCost: String(maxCost),
        sort,
      });

      if (debouncedQuery) {
        params.set("query", debouncedQuery);
      }

      try {
        const response = await fetch(
          `/api/products/discover?${params.toString()}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const json = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          throw new Error(json.error?.message ?? "Scan failed");
        }

        setResult(json.data);
        hasScannedRef.current = true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to scan products");
        if (!isBackground) {
          setResult(null);
        }
      } finally {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (isBackground) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [debouncedQuery, maxCost, sort]
  );

  useEffect(() => {
    void scanProducts();
  }, [scanProducts]);

  useEffect(() => {
    void loadImportedProducts();
  }, [loadImportedProducts]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void scanProducts({ background: true });
    }, CATALOG_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [scanProducts]);

  const isSearchPending = query.trim() !== debouncedQuery;

  const handleImport = useCallback(
    async (product: DiscoveredProduct) => {
      setImportingId(product.id);
      setError(null);

      try {
        const response = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product.importPayload),
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error?.message ?? "Import failed");
        }

        setImportedUrls((prev) => new Set(prev).add(product.originalSupplierUrl));
        feedback("success", "success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import product");
        feedback("error", "error");
      } finally {
        setImportingId(null);
      }
    },
    [feedback]
  );

  return (
    <div className="page-content">
      <div className="panel-padded">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
            <label className="space-y-1.5 text-sm sm:col-span-2 lg:col-span-1">
              <span className="filter-label">Search</span>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="blender, slides, pet..."
                  className="input-field pl-9 pr-9"
                />
                {isSearchPending ? (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="filter-label">Max cost</span>
              <select
                value={maxCost}
                onChange={(e) => setMaxCost(Number(e.target.value))}
                className="input-field"
              >
                {MAX_COST_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    ${value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="filter-label">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as DiscoverSort)}
                className="input-field"
              >
                <option value="trending">Trending</option>
                <option value="cheapest">Cheapest</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => void scanProducts()}
            disabled={loading || refreshing}
            className="btn-secondary shrink-0"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (loading || refreshing) && "animate-spin"
              )}
            />
            Rescan
          </button>
        </div>

        {result ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {result.meta.afterFilters} products
            {debouncedQuery ? (
              <>
                {" "}
                matching &ldquo;{debouncedQuery}&rdquo;
              </>
            ) : null}
            {" · "}
            max ${maxCost}
            {" · "}
            sorted by {SORT_LABELS[sort]}
            {refreshing || isSearchPending ? " · updating…" : null}
          </p>
        ) : null}
      </div>

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Scanning products…
        </div>
      ) : result && result.products.length === 0 ? (
        <div className="empty-state">
          {debouncedQuery ? (
            <>
              No products matched &ldquo;{debouncedQuery}&rdquo;. Try different
              keywords, raise max cost, or clear the search.
            </>
          ) : (
            <>
              No US-shippable products matched your filters. Try raising max
              cost or choosing a different sort.
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
            refreshing && "opacity-80 transition-opacity"
          )}
        >
          {result?.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isImporting={importingId === product.id}
              isImported={importedUrls.has(product.originalSupplierUrl)}
              onImport={handleImport}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: DiscoveredProduct;
  isImporting: boolean;
  isImported: boolean;
  onImport: (product: DiscoveredProduct) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  isImporting,
  isImported,
  onImport,
}: ProductCardProps) {
  const imageUrls = useMemo(
    () =>
      product.imageUrls.length > 0
        ? product.imageUrls
        : [getProductImageUrl(product.id, 0)],
    [product.id, product.imageUrls]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = imageUrls[activeIndex] ?? imageUrls[0];
  const hasGallery = imageUrls.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [product.id]);

  const handleImportClick = useCallback(() => {
    onImport(product);
  }, [onImport, product]);

  function showPreviousImage() {
    setActiveIndex((index) =>
      index === 0 ? imageUrls.length - 1 : index - 1
    );
  }

  function showNextImage() {
    setActiveIndex((index) =>
      index === imageUrls.length - 1 ? 0 : index + 1
    );
  }

  return (
    <article className="panel flex flex-col overflow-hidden">
      <div className="relative aspect-square bg-muted group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={`${product.title} — vendor image ${activeIndex + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = `/api/product-images/${product.id}?index=${activeIndex}`;
          }}
        />

        {product.isNewPick ? (
          <span className="absolute left-2 top-2 chip-solid flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            New pick
          </span>
        ) : null}
        {product.isTikTokHot ? (
          <span
            className={cn(
              "absolute chip flex items-center gap-1 text-[10px] uppercase tracking-wide",
              product.isNewPick ? "left-2 top-10" : "left-2 top-2"
            )}
          >
            <Flame className="h-3 w-3" />
            TikTok hot
          </span>
        ) : null}

        {hasGallery ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              aria-label="Previous product image"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 opacity-90 shadow-sm transition-opacity hover:bg-background group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label="Next product image"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 opacity-90 shadow-sm transition-opacity hover:bg-background group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 right-2 z-10 chip text-[10px] tabular-nums">
              {activeIndex + 1} / {imageUrls.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="leading-snug line-clamp-2">{product.title}</h3>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <p className="mt-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Supplier cost
          </span>
          <span className="mt-1 block text-lg font-semibold tabular-nums">
            ${product.costPrice.toFixed(2)}
          </span>
        </p>

        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="text-foreground">{product.vendor.name}</span> · SKU{" "}
            {product.vendorSku}
          </p>
          <p className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            {product.shippingLabel}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="min-w-0 flex-1 text-left text-xs leading-relaxed text-muted-foreground">
            Set markup and profit in Price Optimizer after import.
          </span>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className={cn(
              isImported ? "btn-secondary text-sm" : "btn-primary text-sm"
            )}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PackagePlus className="h-4 w-4" />
            )}
            {isImported ? "Refresh" : "Import"}
          </button>
        </div>
      </div>
    </article>
  );
});
