import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/lib/inngest/client";
import { TIKTOK_ORDER_FULFILLMENT_EVENT } from "@/types/tiktok-webhook";

export const processOrderFulfillment = inngest.createFunction(
  {
    id: "process-order-fulfillment",
    name: "Process TikTok Order Fulfillment",
    retries: 3,
    triggers: [{ event: TIKTOK_ORDER_FULFILLMENT_EVENT }],
  },
  async ({ event, step }) => {
    const { orderId, userId, tiktokOrderId } = event.data;

    const order = await step.run("load-order", async () => {
      const admin = createAdminClient();

      const { data, error } = await admin
        .from("orders")
        .select("id, user_id, product_id, supplier_id, fulfillment_status")
        .eq("id", orderId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        throw new Error(`Order ${orderId} not found for fulfillment`);
      }

      return data;
    });

    if (order.fulfillment_status !== "pending") {
      return {
        skipped: true,
        reason: `Order already in status ${order.fulfillment_status}`,
      };
    }

    const routingContext = await step.run("resolve-routing-context", async () => {
      const admin = createAdminClient();

      let product: {
        id: string;
        supplier_id: string | null;
        cost_price: number;
      } | null = null;

      if (order.product_id) {
        const { data } = await admin
          .from("products")
          .select("id, supplier_id, cost_price")
          .eq("id", order.product_id)
          .eq("user_id", userId)
          .maybeSingle();

        product = data;
      }

      const { data: suppliers } = await admin
        .from("suppliers")
        .select("id, name, api_base_url, supports_us_warehouse")
        .eq("user_id", userId)
        .eq("is_active", true)
        .eq("supports_us_warehouse", true)
        .order("avg_fulfillment_hours", { ascending: true })
        .limit(1);

      return {
        product,
        supplier: suppliers?.[0] ?? null,
      };
    });

    if (!routingContext.supplier) {
      await step.run("mark-order-failed-no-supplier", async () => {
        const admin = createAdminClient();
        await admin
          .from("orders")
          .update({
            fulfillment_status: "failed",
            fulfillment_error:
              "No active US-warehouse supplier configured for 48h fulfillment",
          })
          .eq("id", orderId);
      });

      return {
        skipped: true,
        reason: "No eligible US-warehouse supplier",
        tiktokOrderId,
      };
    }

    const supplierOrderId = await step.run("submit-supplier-order", async () => {
      // TODO: Integrate supplier API using getCredentialSecret() for auth.
      // This scaffold simulates a successful supplier handoff.
      return `SUP-${tiktokOrderId}`;
    });

    await step.run("update-order-status", async () => {
      const admin = createAdminClient();

      const { error } = await admin
        .from("orders")
        .update({
          supplier_id: routingContext.supplier?.id ?? order.supplier_id,
          supplier_order_id: supplierOrderId,
          supplier_cost: routingContext.product?.cost_price ?? null,
          fulfillment_status: "routed_to_supplier",
          fulfillment_error: null,
        })
        .eq("id", orderId);

      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
      }

      await admin.from("fulfillment_attempts").insert({
        order_id: orderId,
        supplier_id: routingContext.supplier?.id ?? null,
        attempt_number: 1,
        request_payload: {
          tiktok_order_id: tiktokOrderId,
          supplier_id: routingContext.supplier?.id,
        },
        response_payload: { supplier_order_id: supplierOrderId },
        success: true,
      });
    });

    return {
      orderId,
      supplierOrderId,
      supplierId: routingContext.supplier.id,
      status: "routed_to_supplier",
    };
  }
);

export const inngestFunctions = [processOrderFulfillment];
