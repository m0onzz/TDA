import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { syncTikTokShopImagesForUser } from "@/lib/services/tiktok-image-sync-service";

const syncBodySchema = z.object({
  productIds: z.array(z.string().uuid()).max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    let productIds: string[] | undefined;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body: unknown = await request.json();
      const parsed = syncBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          apiError(parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR"),
          { status: 400 }
        );
      }
      productIds = parsed.data.productIds;
    }

    const summary = await syncTikTokShopImagesForUser(user.id, productIds);

    return NextResponse.json(apiSuccess(summary));
  } catch (error) {
    console.error("[POST /api/products/sync-tiktok-images]", error);
    const message =
      error instanceof Error ? error.message : "TikTok image sync failed";
    return NextResponse.json(apiError(message, "TIKTOK_IMAGE_SYNC_FAILED"), {
      status: 500,
    });
  }
}
