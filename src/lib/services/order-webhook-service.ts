import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscordOrderPlaced } from "@/lib/services/discord-notification-service";
import type { Json } from "@/types/database";
import {
  computeTikTokShippingDeadline,
  parseTikTokOrderWebhook,
  shouldQueueFulfillment,
  tiktokWebhookPayloadSchema,
  type TikTokWebhookPayload,
} from "@/types/tiktok-webhook";

function asString(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

export interface IngestTikTokWebhookResult {
  acknowledged: true;
  duplicate: boolean;
  queued: boolean;
  orderId: string | null;
  userId: string | null;
  tiktokOrderId: string | null;
  shopId: string | null;
  webhookEventId: string;
  message: string;
}

async function resolveUserIdByShopId(shopId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("tiktok_shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve shop owner: ${error.message}`);
  }

  return data?.id ?? null;
}

async function resolveProductId(
  userId: string,
  tiktokProductId: string | null
): Promise<string | null> {
  if (!tiktokProductId) return null;

  const admin = createAdminClient();

  const { data } = await admin
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .eq("tiktok_product_id", tiktokProductId)
    .maybeSingle();

  return data?.id ?? null;
}

async function recordWebhookEvent(input: {
  userId: string | null;
  eventType: string;
  externalEventId: string;
  payload: TikTokWebhookPayload;
  status: "received" | "processed" | "failed" | "ignored";
  orderId?: string | null;
  errorMessage?: string | null;
}): Promise<string> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("webhook_events")
    .select("id")
    .eq("source", "tiktok")
    .eq("external_event_id", input.externalEventId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check webhook idempotency: ${existingError.message}`);
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      user_id: input.userId,
      source: "tiktok",
      event_type: input.eventType,
      external_event_id: input.externalEventId,
      payload: input.payload as Json,
      status: input.status,
      order_id: input.orderId ?? null,
      error_message: input.errorMessage ?? null,
      processed_at:
        input.status === "processed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate } = await admin
        .from("webhook_events")
        .select("id")
        .eq("source", "tiktok")
        .eq("external_event_id", input.externalEventId)
        .single();

      if (duplicate?.id) return duplicate.id;
    }

    throw new Error(`Failed to record webhook event: ${error.message}`);
  }

  return data.id;
}

async function upsertPendingOrder(input: {
  userId: string;
  tiktokOrderId: string;
  tiktokLineItemId: string | null;
  productId: string | null;
  shippingAddress: Record<string, unknown>;
  orderTotal: number | null;
  currency: string;
  webhookPayload: TikTokWebhookPayload;
  shipDeadlineIso: string;
}): Promise<{ orderId: string; duplicate: boolean }> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", input.userId)
    .eq("tiktok_order_id", input.tiktokOrderId)
    .maybeSingle();

  if (existing?.id) {
    return { orderId: existing.id, duplicate: true };
  }

  const { data, error } = await admin
    .from("orders")
    .insert({
      user_id: input.userId,
      product_id: input.productId,
      tiktok_order_id: input.tiktokOrderId,
      tiktok_line_item_id: input.tiktokLineItemId,
      customer_shipping_address: input.shippingAddress as Json,
      fulfillment_status: "pending",
      order_total: input.orderTotal,
      currency: input.currency,
      tiktok_deadline_at: input.shipDeadlineIso,
      webhook_payload: input.webhookPayload as Json,
      metadata: {
        ingested_via: "tiktok_webhook",
      },
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate } = await admin
        .from("orders")
        .select("id")
        .eq("user_id", input.userId)
        .eq("tiktok_order_id", input.tiktokOrderId)
        .single();

      if (duplicate?.id) {
        return { orderId: duplicate.id, duplicate: true };
      }
    }

    throw new Error(`Failed to insert order: ${error.message}`);
  }

  return { orderId: data.id, duplicate: false };
}

export async function ingestTikTokOrderWebhook(
  rawPayload: unknown
): Promise<IngestTikTokWebhookResult> {
  const parsedPayload = tiktokWebhookPayloadSchema.safeParse(rawPayload);

  if (!parsedPayload.success) {
    throw new Error("Invalid TikTok webhook payload");
  }

  const payload = parsedPayload.data;
  const orderWebhook = parseTikTokOrderWebhook(payload);

  if (!orderWebhook) {
    const shopId = asString(payload.shop_id);
    const webhookEventId = await recordWebhookEvent({
      userId: null,
      eventType: payload.event ?? payload.event_type ?? "unknown",
      externalEventId:
        asString(payload.notification_id) ??
        `unparsed:${Date.now()}:${JSON.stringify(payload).slice(0, 64)}`,
      payload,
      status: "ignored",
      errorMessage: "Payload missing shop_id or order_id",
    });

    return {
      acknowledged: true,
      duplicate: false,
      queued: false,
      orderId: null,
      userId: null,
      tiktokOrderId: null,
      shopId,
      webhookEventId,
      message: "Webhook acknowledged; order fields not present",
    };
  }

  const userId = await resolveUserIdByShopId(orderWebhook.shopId);

  if (!userId) {
    const webhookEventId = await recordWebhookEvent({
      userId: null,
      eventType: orderWebhook.eventType,
      externalEventId: orderWebhook.externalEventId,
      payload,
      status: "failed",
      errorMessage: `No user mapped to tiktok_shop_id ${orderWebhook.shopId}`,
    });

    return {
      acknowledged: true,
      duplicate: false,
      queued: false,
      orderId: null,
      userId: null,
      tiktokOrderId: orderWebhook.tiktokOrderId,
      shopId: orderWebhook.shopId,
      webhookEventId,
      message: "Webhook acknowledged; shop owner not configured",
    };
  }

  const existingWebhook = await createAdminClient()
    .from("webhook_events")
    .select("id, order_id")
    .eq("source", "tiktok")
    .eq("external_event_id", orderWebhook.externalEventId)
    .maybeSingle();

  if (existingWebhook.data?.id) {
    return {
      acknowledged: true,
      duplicate: true,
      queued: false,
      orderId: existingWebhook.data.order_id,
      userId,
      tiktokOrderId: orderWebhook.tiktokOrderId,
      shopId: orderWebhook.shopId,
      webhookEventId: existingWebhook.data.id,
      message: "Duplicate webhook ignored",
    };
  }

  const productId = await resolveProductId(
    userId,
    orderWebhook.tiktokProductId
  );

  const shipDeadlineIso = computeTikTokShippingDeadline();

  const { orderId, duplicate } = await upsertPendingOrder({
    userId,
    tiktokOrderId: orderWebhook.tiktokOrderId,
    tiktokLineItemId: orderWebhook.tiktokLineItemId,
    productId,
    shippingAddress: orderWebhook.shippingAddress,
    orderTotal: orderWebhook.orderTotal,
    currency: orderWebhook.currency,
    webhookPayload: payload,
    shipDeadlineIso,
  });

  if (!duplicate) {
    void notifyDiscordOrderPlaced({
      userId,
      productId,
      tiktokOrderId: orderWebhook.tiktokOrderId,
      orderTotal: orderWebhook.orderTotal,
      currency: orderWebhook.currency,
      shipDeadlineIso,
    }).catch((error: unknown) => {
      console.error("[order-webhook] Discord notification failed", error);
    });
  }

  const webhookEventId = await recordWebhookEvent({
    userId,
    eventType: orderWebhook.eventType,
    externalEventId: orderWebhook.externalEventId,
    payload,
    status: "received",
    orderId,
  });

  const queueFulfillment =
    !duplicate && shouldQueueFulfillment(orderWebhook.orderStatus);

  return {
    acknowledged: true,
    duplicate,
    queued: queueFulfillment,
    orderId,
    userId,
    tiktokOrderId: orderWebhook.tiktokOrderId,
    shopId: orderWebhook.shopId,
    webhookEventId,
    message: duplicate
      ? "Existing order acknowledged"
      : "Order ingested with pending fulfillment",
  };
}
