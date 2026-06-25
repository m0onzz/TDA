import { Inngest } from "inngest";
import { TIKTOK_ORDER_FULFILLMENT_EVENT } from "@/types/tiktok-webhook";

export const inngest = new Inngest({
  id: "tiktok-dropship-automator",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type TikTokOrderFulfillmentEvent = {
  name: typeof TIKTOK_ORDER_FULFILLMENT_EVENT;
  data: {
    orderId: string;
    userId: string;
    tiktokOrderId: string;
    shopId: string;
    webhookEventId: string;
  };
};
