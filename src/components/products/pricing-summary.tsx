import type { ListingPricing } from "@/lib/pricing/listing-pricing";
import { cn } from "@/lib/utils";

interface PricingSummaryProps {
  pricing: ListingPricing;
  compact?: boolean;
  className?: string;
}

export function PricingSummary({
  pricing,
  compact = false,
  className,
}: PricingSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/30",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-4")}>
        <PricingCell
          label="Your cost"
          value={`$${pricing.costPrice.toFixed(2)}`}
        />
        <PricingCell
          label="TikTok price"
          value={`$${pricing.sellingPrice.toFixed(2)}`}
          highlight
        />
        <PricingCell
          label="Profit / unit"
          value={`$${pricing.profitPerUnit.toFixed(2)}`}
        />
        <PricingCell
          label="Margin"
          value={`${pricing.marginPercent.toFixed(1)}%`}
          badge
        />
      </div>
      {!compact ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Markup: {pricing.markupPercent.toFixed(0)}% over supplier cost ·{" "}
          {pricing.currency}
        </p>
      ) : null}
    </div>
  );
}

function PricingCell({
  label,
  value,
  highlight,
  badge,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5",
          highlight && "text-lg",
          badge &&
            "mt-1 inline-block rounded-full border border-foreground px-2 py-0.5 text-sm"
        )}
      >
        {value}
      </p>
    </div>
  );
}
