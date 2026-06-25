import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Search,
  TrendingUp,
} from "lucide-react";
import { AdminHeader } from "@/components/layout/admin-header";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getUserProductStats } from "@/lib/services/product-service";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let stats = {
    total: 0,
    draft: 0,
    readyForReview: 0,
    published: 0,
  };

  try {
    stats = await getUserProductStats(user.id);
  } catch {
    // Non-blocking — show zeros
  }

  const statCards = [
    { label: "Catalog products", value: String(stats.total) },
    { label: "Draft (needs optimize)", value: String(stats.draft) },
    { label: "Ready to list", value: String(stats.readyForReview) },
    { label: "Listed on TikTok", value: String(stats.published) },
  ];

  const quickLinks = [
    {
      href: "/product-finder",
      label: "Product Finder",
      description: "Discover and import supplier products",
      icon: Search,
    },
    {
      href: "/ai-transformer",
      label: "Price Optimizer",
      description: "Optimize margins and fees",
      icon: TrendingUp,
    },
    {
      href: "/publish",
      label: "Listings",
      description: "List products on TikTok Shop",
      icon: Rocket,
    },
    {
      href: "/orders",
      label: "Orders",
      description: "Track fulfillment and deadlines",
      icon: Package,
    },
  ] as const;

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Catalog overview and quick access to your workflow."
      />
      <div className="page-content space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="panel-padded">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              Quick actions
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="panel-interactive flex flex-col gap-2 rounded-lg p-4"
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-bold">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </Link>
            ))}
          </div>
        </div>

        {stats.total === 0 ? (
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
