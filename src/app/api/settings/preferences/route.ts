import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getUserTheme, setUserTheme } from "@/lib/services/theme-service";
import { themeIdSchema } from "@/types/theme";

const updatePreferencesSchema = z.object({
  theme: themeIdSchema,
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const theme = await getUserTheme(user.id);
    return NextResponse.json(apiSuccess({ theme }));
  } catch (error) {
    console.error("[GET /api/settings/preferences]", error);
    return NextResponse.json(
      apiError("Failed to load preferences", "PREFERENCES_LOAD_FAILED"),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body: unknown = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(
          parsed.error.issues[0]?.message ?? "Invalid request body",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    const theme = await setUserTheme(user.id, parsed.data.theme);

    return NextResponse.json(apiSuccess({ theme }));
  } catch (error) {
    console.error("[PATCH /api/settings/preferences]", error);
    return NextResponse.json(
      apiError("Failed to save preferences", "PREFERENCES_SAVE_FAILED"),
      { status: 500 }
    );
  }
}
