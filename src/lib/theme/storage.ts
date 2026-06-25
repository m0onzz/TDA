import {
  DEFAULT_THEME,
  isThemeId,
  type ThemeId,
} from "@/types/theme";

export const THEME_STORAGE_KEY = "tda-theme";

export function loadThemeFromStorage(): ThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isThemeId(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in private mode
  }

  return DEFAULT_THEME;
}

export function saveThemeToStorage(theme: ThemeId): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore write failures
  }
}
