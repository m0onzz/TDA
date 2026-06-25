import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { listUserOrders } from "@/lib/services/order-service";
import { redirect } from "next/navigation";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function OrdersPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let orders: Awaited<ReturnType<typeof listUserOrders>> = [];

  try {
    orders = await listUserOrders(user.id);
  } catch {
    orders = [];
  }

  return (
    <>
      <AdminHeader
        title="Orders"
        description="Monitor fulfillment status, tracking, and TikTok shipping deadlines."
      />
      <div className="page-content">
        <div className="panel overflow-hidden">
          <div className="table-header grid-cols-5">
            <span>Order ID</span>
            <span>Product</span>
            <span>Status</span>
            <span>Tracking</span>
            <span>Deadline</span>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state border-0 rounded-none">
              <p>No orders yet.</p>
              <p className="mt-2 text-sm">
                List products from{" "}
                <Link href="/publish" className="underline underline-offset-2">
                  Listings
                </Link>
                . When TikTok sends order webhooks to your app, they will appear
                here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="grid grid-cols-1 gap-2 px-6 py-4 text-sm sm:grid-cols-5 sm:items-center sm:gap-4"
                >
                  <span className="font-mono text-xs">{order.tiktokOrderId}</span>
                  <span>{order.productTitle ?? "—"}</span>
                  <span className="capitalize">{formatStatus(order.fulfillmentStatus)}</span>
                  <span>
                    {order.trackingNumber
                      ? `${order.trackingCarrier ?? "Carrier"}: ${order.trackingNumber}`
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {order.tiktokDeadlineAt
                      ? formatDate(order.tiktokDeadlineAt)
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
