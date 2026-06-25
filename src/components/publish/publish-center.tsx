"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Rocket,
  XCircle,
} from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useFeedback } from "@/components/providers/feedback-provider";
import type { CatalogProduct } from "@/types/products";
import { cn } from "@/lib/utils";

export function PublishCenter() {
  const { feedback } = useFeedback();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);
  const [unlistingId, setUnlistingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const readyProducts = useMemo(
    () => products.filter((product) => product.status === "ready_for_review"),
    [products]
  );

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status === "published"),
    [products]
  );

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePublish() {
    if (selectedIds.size === 0) return;

    setPublishing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Listing failed");
      }

      const failed = (json.data?.results ?? []).filter(
        (result: { success: boolean }) => !result.success
      );

      if (failed.length > 0) {
        const messages = failed
          .map((result: { error?: string }) => result.error)
          .filter(Boolean)
          .join(" · ");
        setError(messages || "Some products failed to list");
        feedback("error", "error");
      } else {
        const simulated = (json.data?.results ?? []).some(
          (result: { mode?: string }) => result.mode === "simulation"
        );
        setSuccessMessage(
          simulated
            ? `Simulated listing for ${json.data.summary.succeeded} product(s). Add TikTok credentials in Settings for live listings.`
            : `Listed ${json.data.summary.succeeded} product(s) on TikTok Shop.`
        );
        feedback("success", "success");
      }

      setSelectedIds(new Set());
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing failed");
      feedback("error", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnlist(productId: string) {
    setUnlistingId(productId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/unlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId] }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Unlist failed");
      }

      const failed = (json.data?.results ?? []).filter(
        (result: { success: boolean }) => !result.success
      );

      if (failed.length > 0) {
        setError(failed[0]?.error ?? "Failed to unlist product");
        feedback("error", "error");
      } else {
        const simulated = (json.data?.results ?? []).some(
          (result: { mode?: string }) => result.mode === "simulation"
        );
        setSuccessMessage(
          simulated
            ? "Product unlisted locally. Add TikTok credentials in Settings for live unlisting."
            : "Product unlisted from TikTok Shop."
        );
        feedback("success", "success");
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlist failed");
      feedback("error", "error");
    } finally {
      setUnlistingId(null);
    }
  }

  async function handleSyncImages() {
    setSyncingImages(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/products/sync-tiktok-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Image sync failed");
      }

      const summary = json.data as {
        succeeded: number;
        failed: number;
        total: number;
        message?: string;
        mode?: string;
      };

      if (summary.message && summary.total === 0) {
        setError(summary.message);
        feedback("error", "error");
      } else if (summary.failed > 0) {
        setError(
          `Synced ${summary.succeeded} of ${summary.total} listing image(s). ${summary.failed} failed — check TikTok product IDs or seller SKUs.`
        );
        feedback("error", "error");
      } else {
        setSuccessMessage(
          summary.mode === "simulation"
            ? summary.message ??
                "Image sync requires live TikTok Shop credentials."
            : `Synced TikTok Shop images for ${summary.succeeded} product(s).`
        );
        feedback("success", "success");
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image sync failed");
      feedback("error", "error");
    } finally {
      setSyncingImages(false);
    }
  }

  return (
    <div className="page-content space-y-6">
      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      <div className="panel-padded">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {readyProducts.length} ready to list
          </p>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={publishing || selectedIds.size === 0}
            className="btn-primary"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            List {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading catalog…
          </div>
        ) : readyProducts.length === 0 ? (
          <div className="empty-state mt-6">
            No products ready yet.{" "}
            <Link href="/product-finder" className="underline underline-offset-2">
              Import products
            </Link>
            , then{" "}
            <Link href="/ai-transformer" className="underline underline-offset-2">
              optimize prices
            </Link>
            .
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {readyProducts.map((product) => (
              <label
                key={product.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                  selectedIds.has(product.id)
                    ? "border-foreground bg-muted/50"
                    : "border-border hover:bg-muted/20"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  disabled={publishing}
                  className="mt-1 h-4 w-4 accent-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p>{product.aiTitle ?? product.title}</p>
                  <p className="text-sm text-muted-foreground">
                    ${product.pricing.sellingPrice.toFixed(2)} ·{" "}
                    {product.pricing.marginPercent.toFixed(0)}% margin
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {publishedProducts.length > 0 ? (
        <div className="panel-padded space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Listed
            </p>
            <button
              type="button"
              onClick={() => void handleSyncImages()}
              disabled={syncingImages || publishing}
              className="btn-secondary"
            >
              {syncingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync TikTok images
            </button>
          </div>
          <ul className="divide-y divide-border">
            {publishedProducts.map((product) => (
              <li
                key={product.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p>{product.aiTitle ?? product.title}</p>
                  <p className="text-sm text-muted-foreground">
                    ${product.pricing.sellingPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {product.tiktokListingUrl ? (
                    <a
                      href={product.tiktokListingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm underline underline-offset-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View listing
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleUnlist(product.id)}
                    disabled={unlistingId === product.id || publishing}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                  >
                    {unlistingId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Unlist
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
