"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import {
  loadThemeFromStorage,
  saveThemeToStorage,
} from "@/lib/theme/storage";
import { DEFAULT_THEME, type ThemeId } from "@/types/theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function fetchServerTheme(): Promise<ThemeId | null> {
  try {
    const response = await fetch("/api/settings/preferences", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: { theme?: ThemeId };
    };

    return payload.data?.theme ?? null;
  } catch {
    return null;
  }
}

async function persistServerTheme(theme: ThemeId): Promise<void> {
  try {
    await fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch {
    // Logged-out users and transient failures fall back to localStorage only.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = useCallback((next: ThemeId) => {
    applyThemeToDocument(next);
    setThemeState(next);
    saveThemeToStorage(next);
  }, []);

  const syncFromServer = useCallback(async () => {
    const serverTheme = await fetchServerTheme();
    if (serverTheme) {
      applyTheme(serverTheme);
    }
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(loadThemeFromStorage());
    setIsLoading(false);

    void syncFromServer();

    function handleVisibilityChange(): void {
      if (document.visibilityState === "visible") {
        void syncFromServer();
      }
    }

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyTheme, syncFromServer]);

  const setTheme = useCallback(
    async (next: ThemeId) => {
      applyTheme(next);
      await persistServerTheme(next);
    },
    [applyTheme]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isLoading,
    }),
    [isLoading, setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
