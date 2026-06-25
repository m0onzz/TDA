"use client";

import { Check } from "lucide-react";
import { useFeedback } from "@/components/providers/feedback-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { THEME_DEFINITIONS, type ThemeId } from "@/types/theme";
import { cn } from "@/lib/utils";

export function ThemeSettings() {
  const { theme, setTheme, isLoading } = useTheme();
  const { feedback } = useFeedback();

  async function handleSelect(next: ThemeId): Promise<void> {
    if (next === theme || isLoading) {
      return;
    }

    feedback("toggle", "light");
    await setTheme(next);
  }

  return (
    <div className="panel-padded space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Experience
        </p>
        <h2 className="mt-1 text-lg font-bold">Theme</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose how TDA looks across marketing pages, sign-in, and your
          dashboard. Your choice is saved to your account and this device.
        </p>
      </div>

      <div
        className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Color theme"
      >
        {THEME_DEFINITIONS.map((definition) => {
          const selected = theme === definition.id;

          return (
            <button
              key={definition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isLoading}
              onClick={() => void handleSelect(definition.id)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-lg border p-4 text-left transition-all duration-200",
                selected
                  ? "border-foreground bg-muted"
                  : "border-border bg-card hover:border-foreground/30",
                isLoading && "cursor-wait opacity-70"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-8 w-8 rounded-md border border-border"
                    style={{ background: definition.swatch.background }}
                    aria-hidden
                  />
                  <span
                    className="h-8 w-8 rounded-md border border-border"
                    style={{ background: definition.swatch.foreground }}
                    aria-hidden
                  />
                  <span
                    className="h-8 w-8 rounded-md border border-border"
                    style={{ background: definition.swatch.accent }}
                    aria-hidden
                  />
                </div>
                {selected ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground bg-foreground text-background">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-bold">{definition.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {definition.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
