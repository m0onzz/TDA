import { AdminHeader } from "@/components/layout/admin-header";
import { ProductFinder } from "@/components/product-finder/product-finder";

export default function ProductFinderPage() {
  return (
    <>
      <AdminHeader title="Product Finder" />
      <ProductFinder />
    </>
  );
}
