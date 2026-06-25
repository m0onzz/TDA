import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface OrderSummary {
  id: string;
  tiktokOrderId: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  tiktokDeadlineAt: string | null;
  orderTotal: number | null;
  currency: string;
  createdAt: string;
  productTitle: string | null;
}

function titleFromProductRow(
  product: { ai_title: string | null; raw_data: Json } | null
): string | null {
  if (!product) return null;
  if (product.ai_title?.trim()) return product.ai_title.trim();

  if (
    product.raw_data &&
    typeof product.raw_data === "object" &&
    !Array.isArray(product.raw_data)
  ) {
    const title = (product.raw_data as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim()) {
      return title.trim();
    }
  }

  return null;
}

export async function listUserOrders(userId: string): Promise<OrderSummary[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      tiktok_order_id,
      fulfillment_status,
      tracking_number,
      tracking_carrier,
      tiktok_deadline_at,
      order_total,
      currency,
      created_at,
      products ( ai_title, raw_data )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products)
      ? row.products[0] ?? null
      : row.products;

    return {
      id: row.id,
      tiktokOrderId: row.tiktok_order_id,
      fulfillmentStatus: row.fulfillment_status,
      trackingNumber: row.tracking_number,
      trackingCarrier: row.tracking_carrier,
      tiktokDeadlineAt: row.tiktok_deadline_at,
      orderTotal: row.order_total !== null ? Number(row.order_total) : null,
      currency: row.currency,
      createdAt: row.created_at,
      productTitle: titleFromProductRow(product),
    };
  });
}
