import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { ingestTikTokOrderWebhook } from "@/lib/services/order-webhook-service";
import {
  TikTokSignatureError,
  verifyTikTokWebhookSignature,
} from "@/lib/tiktok/verify-signature";
import { getTikTokWebhookClientSecret } from "@/lib/tiktok/env";
import { TIKTOK_ORDER_FULFILLMENT_EVENT } from "@/types/tiktok-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    verifyTikTokWebhookSignature({
      headers: request.headers,
      rawBody,
      clientSecret: getTikTokWebhookClientSecret(),
    });
  } catch (error) {
    if (error instanceof TikTokSignatureError) {
      console.warn("[POST /api/webhooks/tiktok] signature rejected:", error.message);
      return NextResponse.json(
        { error: { message: "Invalid signature", code: "INVALID_SIGNATURE" } },
        { status: 401 }
      );
    }

    console.error("[POST /api/webhooks/tiktok] signature verification failed", error);
    return NextResponse.json(
      { error: { message: "Signature verification failed", code: "SIGNATURE_ERROR" } },
      { status: 500 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", code: "INVALID_JSON" } },
      { status: 400 }
    );
  }

  try {
    const result = await ingestTikTokOrderWebhook(payload);

    if (
      result.queued &&
      result.orderId &&
      result.userId &&
      result.tiktokOrderId &&
      result.shopId
    ) {
      await inngest.send({
        name: TIKTOK_ORDER_FULFILLMENT_EVENT,
        data: {
          orderId: result.orderId,
          userId: result.userId,
          tiktokOrderId: result.tiktokOrderId,
          shopId: result.shopId,
          webhookEventId: result.webhookEventId,
        },
      });
    }

    return NextResponse.json(
      {
        data: {
          received: true,
          duplicate: result.duplicate,
          queued: result.queued,
          order_id: result.orderId,
          message: result.message,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/webhooks/tiktok] ingestion failed", error);

    return NextResponse.json(
      {
        data: {
          received: true,
          queued: false,
          message: "Webhook accepted; internal processing deferred",
        },
      },
      { status: 200 }
    );
  }
}
