import { z } from "zod";

export const TIKTOK_ORDER_FULFILLMENT_EVENT = "tiktok/order.fulfillment.requested" as const;

const shippingAddressSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

const webhookDataSchema = z
  .object({
    order_id: z.union([z.string(), z.number()]).optional(),
    order_status: z.string().optional(),
    line_item_id: z.union([z.string(), z.number()]).optional(),
    product_id: z.union([z.string(), z.number()]).optional(),
    tiktok_product_id: z.union([z.string(), z.number()]).optional(),
    total_amount: z.union([z.string(), z.number()]).optional(),
    currency: z.string().optional(),
    shipping_address: shippingAddressSchema.optional(),
    recipient_address: shippingAddressSchema.optional(),
  })
  .passthrough();

export const tiktokWebhookPayloadSchema = z
  .object({
    type: z.union([z.string(), z.number()]).optional(),
    event: z.string().optional(),
    event_type: z.string().optional(),
    shop_id: z.union([z.string(), z.number()]).optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    create_time: z.union([z.string(), z.number()]).optional(),
    notification_id: z.union([z.string(), z.number()]).optional(),
    data: webhookDataSchema.optional(),
    content: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough();

export type TikTokWebhookPayload = z.infer<typeof tiktokWebhookPayloadSchema>;

export interface ParsedTikTokOrderWebhook {
  eventType: string;
  shopId: string;
  tiktokOrderId: string;
  tiktokLineItemId: string | null;
  tiktokProductId: string | null;
  orderStatus: string | null;
  orderTotal: number | null;
  currency: string;
  shippingAddress: Record<string, unknown>;
  externalEventId: string;
  rawPayload: TikTokWebhookPayload;
}

const FULFILLMENT_TRIGGER_STATUSES = new Set([
  "AWAITING_SHIPMENT",
  "AWAITING_COLLECTION",
  "AWAITING_SHIPPING",
  "UNPAID",
  "ON_HOLD",
]);

function asString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

function parseEmbeddedContent(
  content: TikTokWebhookPayload["content"]
): Record<string, unknown> | null {
  if (!content) return null;
  if (typeof content === "object") return content;

  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function resolveData(payload: TikTokWebhookPayload): Record<string, unknown> {
  if (payload.data) return payload.data;
  const embedded = parseEmbeddedContent(payload.content);
  return embedded ?? {};
}

export function parseTikTokOrderWebhook(
  payload: TikTokWebhookPayload
): ParsedTikTokOrderWebhook | null {
  const data = resolveData(payload);

  const eventType =
    payload.event ??
    payload.event_type ??
    (payload.type !== undefined ? String(payload.type) : "ORDER_STATUS_CHANGE");

  const shopId = asString(payload.shop_id);
  const tiktokOrderId = asString(data.order_id);

  if (!shopId || !tiktokOrderId) {
    return null;
  }

  const timestamp =
    asString(payload.timestamp) ??
    asString(payload.create_time) ??
    String(Math.floor(Date.now() / 1000));

  const externalEventId =
    asString(payload.notification_id) ??
    `${shopId}:${tiktokOrderId}:${timestamp}:${eventType}`;

  const shippingAddress =
    (typeof data.shipping_address === "object" && data.shipping_address !== null
      ? (data.shipping_address as Record<string, unknown>)
      : undefined) ??
    (typeof data.recipient_address === "object" && data.recipient_address !== null
      ? (data.recipient_address as Record<string, unknown>)
      : undefined) ??
    {};

  const orderTotalRaw = data.total_amount;
  const orderTotal =
    orderTotalRaw === undefined || orderTotalRaw === null
      ? null
      : Number(orderTotalRaw);

  return {
    eventType,
    shopId,
    tiktokOrderId,
    tiktokLineItemId: asString(data.line_item_id),
    tiktokProductId:
      asString(data.tiktok_product_id) ?? asString(data.product_id),
    orderStatus: asString(data.order_status),
    orderTotal: Number.isFinite(orderTotal) ? orderTotal : null,
    currency: asString(data.currency) ?? "USD",
    shippingAddress,
    externalEventId,
    rawPayload: payload,
  };
}

export function shouldQueueFulfillment(orderStatus: string | null): boolean {
  if (!orderStatus) return true;
  return FULFILLMENT_TRIGGER_STATUSES.has(orderStatus.toUpperCase());
}

export function computeTikTokShippingDeadline(
  receivedAt: Date = new Date()
): string {
  const deadline = new Date(receivedAt.getTime() + 48 * 60 * 60 * 1000);
  return deadline.toISOString();
}
