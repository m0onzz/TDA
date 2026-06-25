import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { fetchTikTokShopTrends } from "@/services/tiktokShopTrends";

export const dynamic = "force-dynamic";

/**
 * Returns the current TikTok Shop trend snapshot used by Product Finder.
 * Live browse requires TikTok Shop API credentials; otherwise curated bestseller data.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const snapshot = await fetchTikTokShopTrends();

    return NextResponse.json(apiSuccess(snapshot), {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[GET /api/trends/tiktok-shop]", error);
    return NextResponse.json(
      apiError("Failed to load TikTok Shop trends", "TIKTOK_TRENDS_FAILED"),
      { status: 500 }
    );
  }
}
