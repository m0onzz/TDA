import {
  calculatePlatformFeeBreakdown,
  formatPricingCurrency,
  type ListingPricing,
} from "@/lib/pricing/listing-pricing";
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
  const fees = calculatePlatformFeeBreakdown(pricing);
  const formatMoney = (amount: number) =>
    formatPricingCurrency(amount, pricing.currency);

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/30",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-2" : "sm:grid-cols-3 lg:grid-cols-6"
        )}
      >
        <PricingCell label="Your cost" value={formatMoney(pricing.costPrice)} />
        <PricingCell
          label="TikTok price"
          value={formatMoney(pricing.sellingPrice)}
          highlight
        />
        <PricingCell
          label="Gross profit"
          value={formatMoney(fees.grossProfitPerUnit)}
        />
        <PricingCell
          label={`TikTok fees (~${fees.platformFeePercent}%)`}
          value={`-${formatMoney(fees.platformFeeAmount)}`}
          muted
        />
        <PricingCell
          label="Net profit"
          value={formatMoney(fees.netProfitPerUnit)}
          highlight={!compact}
        />
        <PricingCell
          label="Net margin"
          value={`${fees.netMarginPercent.toFixed(1)}%`}
          badge
        />
      </div>

      <p
        className={cn(
          "text-muted-foreground",
          compact ? "mt-2 text-[11px] leading-relaxed" : "mt-3 text-xs"
        )}
      >
        {compact ? (
          <>
            Gross {fees.grossMarginPercent.toFixed(0)}% margin before fees ·
            net {fees.netMarginPercent.toFixed(1)}% after TikTok platform fees
          </>
        ) : (
          <>
            Markup {pricing.markupPercent.toFixed(0)}% over supplier cost ·
            gross margin {fees.grossMarginPercent.toFixed(1)}% · estimated TikTok
            Shop + payment fees at ~{fees.platformFeePercent}% of sell price ·{" "}
            {pricing.currency}
          </>
        )}
      </p>
    </div>
  );
}

function PricingCell({
  label,
  value,
  highlight,
  badge,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: boolean;
  muted?: boolean;
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
          muted && "text-muted-foreground",
          badge &&
            "mt-1 inline-block rounded-full border border-foreground px-2 py-0.5 text-sm"
        )}
      >
        {value}
      </p>
    </div>
  );
}
