import type { ReactNode } from "react";
import {
  Building2,
  ExternalLink,
  Package,
  Truck,
} from "lucide-react";
import type { CatalogProduct } from "@/types/products";
import type { DiscoveredProduct } from "@/types/product-discovery";
import { PricingSummary } from "@/components/products/pricing-summary";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ListingBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type SellableProduct = CatalogProduct | DiscoveredProduct;

function isCatalogProduct(product: SellableProduct): product is CatalogProduct {
  return "status" in product;
}

function getImages(product: SellableProduct): string[] {
  if ("imageUrls" in product && product.imageUrls.length > 0) {
    return product.imageUrls;
  }

  if ("images" in product && product.images.length > 0) {
    return product.images;
  }

  if (product.imageUrl) {
    return [product.imageUrl];
  }

  return [];
}

function getFallbackImages(product: SellableProduct): string[] {
  if ("fallbackImages" in product && product.fallbackImages.length > 0) {
    return product.fallbackImages;
  }

  return [];
}

function getVendor(product: SellableProduct) {
  if ("vendor" in product && product.vendor) {
    return product.vendor;
  }
  return null;
}

function getPricing(product: SellableProduct) {
  return product.pricing;
}

interface SellableListingPanelProps {
  product: SellableProduct;
  className?: string;
  showListingCopy?: boolean;
}

export function SellableListingPanel({
  product,
  className,
  showListingCopy = false,
}: SellableListingPanelProps) {
  const vendor = getVendor(product);
  const pricing = getPricing(product);
  const images = getImages(product);
  const fallbackImages = getFallbackImages(product);
  const title = isCatalogProduct(product)
    ? product.aiTitle ?? product.title
    : product.title;
  const description = isCatalogProduct(product)
    ? product.aiDescription ?? product.description
    : product.description;
  const isReady =
    isCatalogProduct(product) && product.status === "ready_for_review";
  const isPublished =
    isCatalogProduct(product) && product.status === "published";

  const listingVariant = isPublished
    ? "live"
    : isReady
      ? "ready"
      : "pending";

  return (
    <article className={cn("panel overflow-hidden", className)}>
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="p-4">
          <ProductImageGallery
            images={images}
            fallbackImages={fallbackImages}
            alt={title}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-border p-4 lg:border-l lg:border-t-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isCatalogProduct(product) ? (
                <ListingBadge variant={listingVariant} />
              ) : null}
              <span className="chip">{product.category}</span>
            </div>
            <h3 className="mt-2 text-lg leading-snug">{title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <PricingSummary pricing={pricing} />

          {vendor ? (
            <div className="space-y-2 rounded-md border border-border p-3 text-sm">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide">
                <Building2 className="h-4 w-4" strokeWidth={2} />
                Vendor & fulfillment
              </p>
              <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
                <VendorRow label="Supplier" value={vendor.name} />
                <VendorRow label="SKU" value={vendor.sku} mono />
                <VendorRow
                  label="Platform"
                  value={formatPlatform(vendor.platform)}
                />
                {vendor.warehouse ? (
                  <VendorRow label="Warehouse" value={vendor.warehouse} />
                ) : null}
                {vendor.shippingLabel ? (
                  <VendorRow
                    label="Shipping"
                    value={vendor.shippingLabel}
                    icon={<Truck className="h-3 w-3" />}
                  />
                ) : null}
                {"supportEmail" in vendor && vendor.supportEmail ? (
                  <VendorRow label="Support" value={vendor.supportEmail} />
                ) : null}
              </dl>
              <a
                href={vendor.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:opacity-70"
              >
                <ExternalLink className="h-3 w-3" />
                View supplier listing
              </a>
            </div>
          ) : null}

          {showListingCopy && isCatalogProduct(product) && product.aiTags.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                TikTok tags
              </p>
              <div className="flex flex-wrap gap-1">
                {product.aiTags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" strokeWidth={2} />
        List at{" "}
        <span className="text-foreground">
          ${pricing.sellingPrice.toFixed(2)}
        </span>{" "}
        · profit{" "}
        <span className="text-foreground">
          ${pricing.profitPerUnit.toFixed(2)}
        </span>{" "}
        per sale
      </div>
    </article>
  );
}

function VendorRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "flex items-center gap-1",
          mono && "text-[11px] tracking-tight"
        )}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}

function formatPlatform(platform: string): string {
  switch (platform) {
    case "zendrop":
      return "Zendrop";
    case "autods":
      return "AutoDS";
    case "cj_dropshipping":
      return "CJ Dropshipping";
    default:
      return platform;
  }
}
