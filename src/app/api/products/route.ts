import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { databaseErrorResponse } from "@/lib/api/database-error";
import { apiError, apiSuccess } from "@/lib/api/response";
import { listUserProducts } from "@/lib/services/product-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const products = await listUserProducts(user.id);

    return NextResponse.json(apiSuccess({ products }));
  } catch (error) {
    console.error("[GET /api/products]", error);
    return databaseErrorResponse(error, "LOAD_FAILED");
  }
}
