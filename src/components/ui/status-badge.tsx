import type { ProductStatus } from "@/types/products";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  scraping: "Scraping",
  ai_processing: "Processing",
  ready_for_review: "Ready",
  published: "Listed",
  failed: "Failed",
  archived: "Archived",
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft:
    "border border-dashed border-muted-foreground/40 bg-muted text-muted-foreground",
  scraping: "border border-foreground/30 bg-background text-foreground",
  ai_processing:
    "border-2 border-foreground bg-muted text-foreground [background-image:repeating-linear-gradient(-45deg,transparent,transparent_3px,hsl(0_0%_25%)_3px,hsl(0_0%_25%)_6px)]",
  ready_for_review: "border border-foreground bg-foreground text-background",
  published:
    "border-2 border-foreground bg-background text-foreground uppercase tracking-wide",
  failed: "border-2 border-double border-foreground bg-muted text-foreground",
  archived: "border border-border bg-muted/50 text-muted-foreground opacity-60",
};

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-center text-xs leading-none",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export type ListingBadgeVariant = "live" | "ready" | "pending";

const LISTING_BADGE_STYLES: Record<ListingBadgeVariant, string> = {
  live: "border-2 border-foreground bg-background uppercase tracking-wide",
  ready: "border border-foreground bg-foreground text-background",
  pending: "border border-dashed border-muted-foreground/50 bg-muted text-muted-foreground",
};

const LISTING_BADGE_LABELS: Record<ListingBadgeVariant, string> = {
  live: "Live on TikTok Shop",
  ready: "Ready to list",
  pending: "Import & optimize",
};

interface ListingBadgeProps {
  variant: ListingBadgeVariant;
  className?: string;
}

export function ListingBadge({ variant, className }: ListingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-center text-xs leading-none",
        LISTING_BADGE_STYLES[variant],
        className
      )}
    >
      {LISTING_BADGE_LABELS[variant]}
    </span>
  );
}
