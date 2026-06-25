import { AdminHeader } from "@/components/layout/admin-header";
import { ProductFinder } from "@/components/product-finder/product-finder";

export default function ProductFinderPage() {
  return (
    <>
      <AdminHeader
        title="Product Finder"
        description="Scan supplier catalogs, filter by cost and US shipping, and import products to your catalog."
      />
      <ProductFinder />
    </>
  );
}
