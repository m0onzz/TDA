"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, TrendingUp, XCircle } from "lucide-react";
import { PricingSummary } from "@/components/products/pricing-summary";
import { AlertBanner } from "@/components/ui/alert-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CatalogProduct, ProductStatus } from "@/types/products";
import { cn } from "@/lib/utils";

export function AiTransformer() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [unlisting, setUnlisting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all"
  );

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
    if (statusFilter === "all") return products;
    return products.filter((product) => product.status === statusFilter);
  }, [products, statusFilter]);

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

  async function handleOptimize() {
    if (selectedIds.size === 0) return;

    setOptimizing(true);
    setProgress(`Calculating optimal prices for ${selectedIds.size} product(s)…`);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Optimization failed");
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
            `${failedResults.length} product(s) failed to optimize. Check that each has a valid cost price.`
        );
      }

      await loadProducts();
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setProgress(null);
      setOptimizing(false);
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
      } else {
        const simulated = (json.data?.results ?? []).some(
          (result: { mode?: string }) => result.mode === "simulation"
        );
        setSuccessMessage(
          simulated
            ? `Unlisted ${json.data.summary.succeeded} product(s) locally. Add TikTok credentials in Settings for live unlisting.`
            : `Unlisted ${json.data.summary.succeeded} product(s) from TikTok Shop.`
        );
      }

      await loadProducts();
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlist failed");
    } finally {
      setProgress(null);
      setUnlisting(false);
    }
  }

  const busy = optimizing || unlisting;

  return (
    <div className="page-content">
      <div className="panel-padded flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProductStatus | "all")
          }
          className="input-field w-auto"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="ready_for_review">Ready</option>
          <option value="published">Listed</option>
          <option value="failed">Failed</option>
        </select>

        <button
          type="button"
          onClick={() => void handleOptimize()}
          disabled={busy || selectedIds.size === 0}
          className="btn-primary"
        >
          {optimizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          Optimize {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
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
            from Product Finder first.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
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

            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <CatalogProductRow
                  key={product.id}
                  product={product}
                  selected={selectedIds.has(product.id)}
                  onToggle={() => toggleProduct(product.id)}
                  disabled={busy || product.status === "ai_processing"}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
              {selectedProducts.length > 0
                ? "Listing preview"
                : "Select products to preview"}
            </h3>

            {selectedProducts.length === 0 ? (
              <div className="empty-state py-10">
                Pick catalog products to preview pricing or run optimize.
              </div>
            ) : (
              selectedProducts.map((product) => (
                <ListingPreview key={product.id} product={product} />
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
  selected,
  onToggle,
  disabled,
}: {
  product: CatalogProduct;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
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
          ${product.pricing.costPrice.toFixed(2)} → $
          {product.pricing.sellingPrice.toFixed(2)} ·{" "}
          {product.pricing.marginPercent.toFixed(0)}% margin
        </p>
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

function ListingPreview({ product }: { product: CatalogProduct }) {
  return (
    <div className="panel-padded space-y-3">
      <p className="line-clamp-2">{product.aiTitle ?? product.title}</p>
      <PricingSummary pricing={product.pricing} />
    </div>
  );
}
