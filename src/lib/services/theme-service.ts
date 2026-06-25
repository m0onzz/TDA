import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_THEME,
  isThemeId,
  themeIdSchema,
  type ThemeId,
} from "@/types/theme";

function isThemeColumnMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    (message.includes("theme") &&
      (message.includes("does not exist") ||
        message.includes("could not find")))
  );
}

export async function getUserTheme(userId: string): Promise<ThemeId> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("theme")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isThemeColumnMissing(error)) {
      console.warn(
        "[theme-service] users.theme column missing — run supabase/migrations/20250625000000_add_user_theme.sql"
      );
      return DEFAULT_THEME;
    }
    throw new Error(`Failed to load theme preference: ${error.message}`);
  }

  const theme = data?.theme;
  if (typeof theme === "string" && isThemeId(theme)) {
    return theme;
  }

  return DEFAULT_THEME;
}

export async function setUserTheme(
  userId: string,
  theme: ThemeId
): Promise<ThemeId> {
  const parsed = themeIdSchema.parse(theme);
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .update({ theme: parsed })
    .eq("id", userId)
    .select("theme")
    .single();

  if (error) {
    if (isThemeColumnMissing(error)) {
      console.warn(
        "[theme-service] users.theme column missing — theme saved locally only until migration runs"
      );
      return parsed;
    }
    throw new Error(`Failed to save theme preference: ${error.message}`);
  }

  const saved = data?.theme;
  if (typeof saved === "string" && isThemeId(saved)) {
    return saved;
  }

  return parsed;
}
