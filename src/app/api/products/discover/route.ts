import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { discoverProducts } from "@/services/productDiscovery";

export const dynamic = "force-dynamic";

const discoverQuerySchema = z.object({
  query: z.string().optional(),
  maxCost: z.coerce.number().positive().max(500).optional(),
  category: z.string().optional(),
  sort: z.enum(["trending", "cheapest"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const parsed = discoverQuerySchema.safeParse({
      query: searchParams.get("query") ?? undefined,
      maxCost: searchParams.get("maxCost") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const result = await discoverProducts(parsed.data);

    return NextResponse.json(apiSuccess(result), {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Catalog-Refresh-Window": String(result.meta.refreshWindowId),
      },
    });
  } catch (error) {
    console.error("[GET /api/products/discover]", error);
    return NextResponse.json(
      apiError("Failed to discover products", "DISCOVER_FAILED"),
      { status: 500 }
    );
  }
}
