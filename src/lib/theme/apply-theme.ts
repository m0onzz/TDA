import { DEFAULT_THEME, type ThemeId } from "@/types/theme";

export function applyThemeToDocument(theme: ThemeId = DEFAULT_THEME): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
}
