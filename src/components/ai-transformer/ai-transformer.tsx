"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  ImageIcon,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { PricingSummary } from "@/components/products/pricing-summary";
import {
  calculateListingPricing,
  calculatePlatformFeeBreakdown,
} from "@/lib/pricing/listing-pricing";
import { AlertBanner } from "@/components/ui/alert-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFeedback } from "@/components/providers/feedback-provider";
import type { CatalogProduct, ProductStatus } from "@/types/products";
import { cn } from "@/lib/utils";

const MARKUP_OPTIONS = [30, 40, 50, 60, 75] as const;

type CatalogSort = "margin" | "cost" | "name";

const SORT_LABELS: Record<CatalogSort, string> = {
  margin: "best margin",
  cost: "lowest cost",
  name: "name",
};

function sortCatalogProducts(
  products: CatalogProduct[],
  sort: CatalogSort,
  markupPercent: number
): CatalogProduct[] {
  const copy = [...products];

  switch (sort) {
    case "cost":
      return copy.sort((a, b) => a.pricing.costPrice - b.pricing.costPrice);
    case "name":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "margin":
    default:
      return copy.sort((a, b) => {
        const aMargin = calculatePlatformFeeBreakdown(
          calculateListingPricing(
            a.pricing.costPrice,
            markupPercent,
            a.pricing.currency
          )
        ).netMarginPercent;
        const bMargin = calculatePlatformFeeBreakdown(
          calculateListingPricing(
            b.pricing.costPrice,
            markupPercent,
            b.pricing.currency
          )
        ).netMarginPercent;
        return bMargin - aMargin;
      });
  }
}

export function AiTransformer() {
  const { feedback } = useFeedback();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingMarkup, setApplyingMarkup] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [unlisting, setUnlisting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all"
  );
  const [markupPercent, setMarkupPercent] = useState<number>(40);
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("margin");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Failed to load catalog");
      }

      setProducts(json.data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? products
        : products.filter((product) => product.status === statusFilter);

    return sortCatalogProducts(byStatus, catalogSort, markupPercent);
  }, [products, statusFilter, catalogSort, markupPercent]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.has(product.id)),
    [products, selectedIds]
  );

  const selectedListedCount = useMemo(
    () =>
      selectedProducts.filter((product) => product.status === "published")
        .length,
    [selectedProducts]
  );

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function runTransform(
    mode: "markup" | "optimal",
    options: { applyingMarkup?: boolean; optimizing?: boolean }
  ) {
    if (selectedIds.size === 0) return;

    const { applyingMarkup: isMarkup = false, optimizing: isOptimize = false } =
      options;

    if (isMarkup) setApplyingMarkup(true);
    if (isOptimize) setOptimizing(true);

    setProgress(
      mode === "markup"
        ? `Applying ${markupPercent}% markup to ${selectedIds.size} product(s)…`
        : `Calculating optimal prices for ${selectedIds.size} product(s)…`
    );
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          mode,
          ...(mode === "markup" ? { markupPercent } : {}),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Pricing update failed");
      }

      const failedResults = (json.data?.results ?? []).filter(
        (result: { success: boolean }) => !result.success
      );

      if (failedResults.length > 0) {
        const messages = failedResults
          .map((result: { error?: string }) => result.error)
          .filter(Boolean)
          .join(" · ");

        setError(
          messages ||
            `${failedResults.length} product(s) failed. Check that each has a valid cost price.`
        );
        feedback("error", "error");
      } else {
        setSuccessMessage(
          mode === "markup"
            ? `Applied ${markupPercent}% markup to ${json.data.summary.succeeded} product(s).`
            : `Auto-optimized pricing for ${json.data.summary.succeeded} product(s).`
        );
        feedback("success", "success");
      }

      await loadProducts();
      setSelectedIds(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Pricing update failed"
      );
      feedback("error", "error");
    } finally {
      setProgress(null);
      if (isMarkup) setApplyingMarkup(false);
      if (isOptimize) setOptimizing(false);
    }
  }

  async function handleUnlist() {
    const listedIds = selectedProducts
      .filter((product) => product.status === "published")
      .map((product) => product.id);

    if (listedIds.length === 0) return;

    setUnlisting(true);
    setProgress(`Unlisting ${listedIds.length} product(s) from TikTok Shop…`);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/unlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: listedIds }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Unlist failed");
      }

      const failedResults = (json.data?.results ?? []).filter(
        (result: { success: boolean }) => !result.success
      );

      if (failedResults.length > 0) {
        const messages = failedResults
          .map((result: { error?: string }) => result.error)
          .filter(Boolean)
          .join(" · ");

        setError(
          messages ||
            `${failedResults.length} product(s) failed to unlist.`
        );
        feedback("error", "error");
      } else {
        const simulated = (json.data?.results ?? []).some(
          (result: { mode?: string }) => result.mode === "simulation"
        );
        setSuccessMessage(
          simulated
            ? `Unlisted ${json.data.summary.succeeded} product(s) locally. Add TikTok credentials in Settings for live unlisting.`
            : `Unlisted ${json.data.summary.succeeded} product(s) from TikTok Shop.`
        );
        feedback("success", "success");
      }

      await loadProducts();
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlist failed");
      feedback("error", "error");
    } finally {
      setProgress(null);
      setUnlisting(false);
    }
  }

  const busy = applyingMarkup || optimizing || unlisting;

  return (
    <div className="page-content">
      <div className="panel-padded">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
            <label className="space-y-1.5 text-sm">
              <span className="filter-label">Status</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProductStatus | "all")
                }
                className="input-field"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="ready_for_review">Ready</option>
                <option value="published">Listed</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="filter-label">Markup %</span>
              <select
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                className="input-field"
              >
                {MARKUP_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="filter-label">Sort by</span>
              <select
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as CatalogSort)}
                className="input-field"
              >
                <option value="margin">Best margin</option>
                <option value="cost">Lowest cost</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() => void runTransform("markup", { applyingMarkup: true })}
              disabled={busy || selectedIds.size === 0}
              className="btn-secondary"
            >
              {applyingMarkup ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              Apply {markupPercent}% markup
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>

            <button
              type="button"
              onClick={() => void runTransform("optimal", { optimizing: true })}
              disabled={busy || selectedIds.size === 0}
              className="btn-primary"
            >
              {optimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Auto-optimize
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>

            {selectedListedCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleUnlist()}
                disabled={busy}
                className="btn-secondary"
              >
                {unlisting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Unlist ({selectedListedCount})
              </button>
            ) : null}
          </div>
        </div>

        {products.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Previewing {markupPercent}% markup · sorted by {SORT_LABELS[catalogSort]}
            {" · "}select products to apply markup or auto-optimize for max profit
          </p>
        ) : null}
      </div>

      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      {progress ? (
        <AlertBanner
          variant="info"
          icon={<Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
        >
          {progress}
        </AlertBanner>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your catalog…
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products yet.</p>
          <p className="mt-2 text-sm">
            <Link href="/product-finder" className="underline underline-offset-2">
              Import products
            </Link>{" "}
            from Product Finder first, then set markup and profit here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                Your products
              </h3>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {filteredProducts.every((p) => selectedIds.has(p.id))
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state py-10">
                No products match this status filter. Try selecting &ldquo;All
                statuses&rdquo; or import from Product Finder.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <CatalogProductRow
                    key={product.id}
                    product={product}
                    markupPercent={markupPercent}
                    selected={selectedIds.has(product.id)}
                    onToggle={() => toggleProduct(product.id)}
                    disabled={busy || product.status === "ai_processing"}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
              {selectedProducts.length > 0
                ? `Profit preview @ ${markupPercent}% markup`
                : "Select products to preview profit"}
            </h3>

            {selectedProducts.length === 0 ? (
              <div className="empty-state py-10">
                Pick catalog products to preview markup, net profit, and TikTok
                fees before applying pricing.
              </div>
            ) : (
              selectedProducts.map((product) => (
                <ListingPreview
                  key={product.id}
                  product={product}
                  markupPercent={markupPercent}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogProductRow({
  product,
  markupPercent,
  selected,
  onToggle,
  disabled,
}: {
  product: CatalogProduct;
  markupPercent: number;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const previewPricing = useMemo(
    () =>
      calculateListingPricing(
        product.pricing.costPrice,
        markupPercent,
        product.pricing.currency
      ),
    [product.pricing.costPrice, product.pricing.currency, markupPercent]
  );
  const previewFees = calculatePlatformFeeBreakdown(previewPricing);
  const hasSavedPricing =
    product.pricing.sellingPrice > product.pricing.costPrice + 0.01;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors",
        selected
          ? "border-foreground bg-muted/50"
          : "border-border bg-card hover:bg-muted/30",
        disabled && "opacity-50"
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        disabled={disabled}
        className="h-4 w-4 rounded border-foreground accent-foreground"
      />

      <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
            onError={(event) => {
              const fallback = product.fallbackImages[0];
              if (fallback && event.currentTarget.src !== fallback) {
                event.currentTarget.src = fallback;
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{product.title}</p>
        <p className="text-xs text-muted-foreground">
          ${previewPricing.costPrice.toFixed(2)} → $
          {previewPricing.sellingPrice.toFixed(2)} @ {markupPercent}% · $
          {previewFees.netProfitPerUnit.toFixed(2)} net ·{" "}
          {previewFees.netMarginPercent.toFixed(0)}% margin
        </p>
        {hasSavedPricing ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Saved: ${product.pricing.sellingPrice.toFixed(2)} (
            {product.pricing.markupPercent.toFixed(0)}% markup)
          </p>
        ) : null}
        {product.status === "failed" && product.processingError ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.processingError}
          </p>
        ) : null}
      </div>

      <StatusBadge status={product.status} />
    </label>
  );
}

function ListingPreview({
  product,
  markupPercent,
}: {
  product: CatalogProduct;
  markupPercent: number;
}) {
  const previewPricing = useMemo(
    () =>
      calculateListingPricing(
        product.pricing.costPrice,
        markupPercent,
        product.pricing.currency
      ),
    [product.pricing.costPrice, product.pricing.currency, markupPercent]
  );
  const hasSavedPricing =
    product.pricing.sellingPrice > product.pricing.costPrice + 0.01;
  const savedDiffersFromPreview =
    hasSavedPricing &&
    Math.abs(product.pricing.sellingPrice - previewPricing.sellingPrice) >
      0.01;

  return (
    <div className="panel-padded space-y-3">
      <p className="line-clamp-2">{product.aiTitle ?? product.title}</p>
      <PricingSummary pricing={previewPricing} />
      {savedDiffersFromPreview ? (
        <p className="text-xs text-muted-foreground">
          Current saved listing: ${product.pricing.sellingPrice.toFixed(2)} (
          {product.pricing.markupPercent.toFixed(0)}% markup, $
          {calculatePlatformFeeBreakdown(product.pricing).netProfitPerUnit.toFixed(
            2
          )}{" "}
          net)
        </p>
      ) : null}
    </div>
  );
}
