import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { listUserProducts } from "@/lib/services/product-service";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let products: Awaited<ReturnType<typeof listUserProducts>> = [];

  try {
    products = await listUserProducts(user.id);
  } catch {
    products = [];
  }

  const draftCount = products.filter((p) => p.status === "draft").length;
  const readyCount = products.filter((p) => p.status === "ready_for_review").length;
  const publishedCount = products.filter((p) => p.status === "published").length;

  const stats = [
    { label: "Catalog products", value: String(products.length) },
    { label: "Draft (needs optimize)", value: String(draftCount) },
    { label: "Ready to publish", value: String(readyCount) },
    { label: "Listed on TikTok", value: String(publishedCount) },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="page-content space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet.</p>
            <p className="mt-2 text-sm">
              Start in{" "}
              <Link href="/product-finder" className="underline underline-offset-2">
                Product Finder
              </Link>{" "}
              to import your first listing.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
