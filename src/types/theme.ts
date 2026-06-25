import { z } from "zod";

export const THEME_IDS = [
  "dark",
  "light",
  "midnight",
  "high-contrast",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "dark";

export const themeIdSchema = z.enum(THEME_IDS);

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  swatch: {
    background: string;
    foreground: string;
    accent: string;
  };
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: "dark",
    label: "Monochrome",
    description: "Pure black and white — the default TDA look.",
    swatch: {
      background: "hsl(0 0% 0%)",
      foreground: "hsl(0 0% 100%)",
      accent: "hsl(0 0% 25%)",
    },
  },
  {
    id: "light",
    label: "Light",
    description: "Clean paper-white surfaces for bright environments.",
    swatch: {
      background: "hsl(0 0% 98%)",
      foreground: "hsl(0 0% 8%)",
      accent: "hsl(0 0% 85%)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep blue-tinted dark mode for late-night sessions.",
    swatch: {
      background: "hsl(222 47% 6%)",
      foreground: "hsl(210 40% 96%)",
      accent: "hsl(222 35% 18%)",
    },
  },
  {
    id: "high-contrast",
    label: "High contrast",
    description: "Maximum legibility with bold borders and type.",
    swatch: {
      background: "hsl(0 0% 0%)",
      foreground: "hsl(0 0% 100%)",
      accent: "hsl(0 0% 100%)",
    },
  },
];

export function isThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}
