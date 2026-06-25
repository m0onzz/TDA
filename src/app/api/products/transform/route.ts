import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { databaseErrorResponse } from "@/lib/api/database-error";
import { apiError, apiSuccess } from "@/lib/api/response";
import { transformProductsForListing } from "@/lib/services/product-transform-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const transformBodySchema = z
  .object({
    productIds: z.array(z.string().uuid()).min(1).max(10),
    mode: z.enum(["optimal", "markup"]).optional().default("optimal"),
    markupPercent: z.number().min(10).max(200).optional(),
  })
  .refine(
    (data) => data.mode !== "markup" || data.markupPercent !== undefined,
    {
      message: "markupPercent is required when mode is markup",
      path: ["markupPercent"],
    }
  );

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body: unknown = await request.json();
    const parsed = transformBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const results = await transformProductsForListing(
      user.id,
      parsed.data.productIds,
      {
        mode: parsed.data.mode,
        markupPercent: parsed.data.markupPercent,
      }
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
    console.error("[POST /api/products/transform]", error);
    return databaseErrorResponse(error, "TRANSFORM_FAILED");
  }
}
