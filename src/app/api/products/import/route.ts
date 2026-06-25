import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { databaseErrorResponse } from "@/lib/api/database-error";
import { apiError, apiSuccess } from "@/lib/api/response";
import { importDiscoveredProduct } from "@/lib/services/product-import-service";

export const dynamic = "force-dynamic";

const importBodySchema = z.object({
  originalSupplierUrl: z.string().url(),
  rawData: z.record(z.string(), z.unknown()),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
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
    const parsed = importBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const productId = await importDiscoveredProduct(user.id, parsed.data);

    return NextResponse.json(
      apiSuccess({ id: productId, message: "Product imported to catalog" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/products/import]", error);
    return databaseErrorResponse(error, "IMPORT_FAILED");
  }
}
