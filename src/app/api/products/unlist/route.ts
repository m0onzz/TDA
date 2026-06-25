import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { databaseErrorResponse } from "@/lib/api/database-error";
import { apiError, apiSuccess } from "@/lib/api/response";
import { unlistProductsFromTikTokShop } from "@/lib/services/tiktok-publish-service";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const unlistBodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body: unknown = await request.json();
    const parsed = unlistBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const results = await unlistProductsFromTikTokShop(
      user.id,
      parsed.data.productIds
    );

    const succeeded = results.filter((result) => result.success).length;

    return NextResponse.json(
      apiSuccess({
        results,
        summary: {
          total: results.length,
          succeeded,
          failed: results.length - succeeded,
        },
      })
    );
  } catch (error) {
    console.error("[POST /api/products/unlist]", error);
    return databaseErrorResponse(error, "UNLIST_FAILED");
  }
}
