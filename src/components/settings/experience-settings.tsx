"use client";

import type { ReactNode } from "react";
import { Volume2, VolumeX, Vibrate, Smartphone } from "lucide-react";
import { useFeedback } from "@/components/providers/feedback-provider";
import { isHapticsSupported } from "@/lib/feedback/haptics";
import { cn } from "@/lib/utils";

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  icon: ReactNode;
  disabled?: boolean;
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  icon,
  disabled = false,
}: ToggleRowProps) {
  const { feedback } = useFeedback();

  function handleToggle(): void {
    if (disabled) {
      return;
    }
    const next = !enabled;
    feedback("toggle", "light");
    onToggle(next);
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
          enabled
            ? "border-foreground bg-foreground"
            : "border-border bg-muted",
          disabled && "cursor-not-allowed opacity-40"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
            enabled ? "left-[1.35rem]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function ExperienceSettings() {
  const { settings, setSoundEnabled, setHapticsEnabled } = useFeedback();
  const hapticsAvailable = isHapticsSupported();

  return (
    <div className="panel-padded space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Experience
        </p>
        <h2 className="mt-1 text-lg font-bold">Sound &amp; haptics</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Subtle audio and vibration feedback for navigation and completed
          actions. Respects your system reduced-motion preference.
        </p>
      </div>

      <div className="space-y-5 border-t border-border pt-5">
        <ToggleRow
          label="UI sounds"
          description="Soft tones when you navigate, tap buttons, or complete workflows."
          enabled={settings.soundEnabled}
          onToggle={setSoundEnabled}
          icon={
            settings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )
          }
        />
        <ToggleRow
          label="Haptic feedback"
          description={
            hapticsAvailable
              ? "Light vibration on mobile when you interact with the app."
              : "Not available on this device."
          }
          enabled={settings.hapticsEnabled}
          onToggle={setHapticsEnabled}
          disabled={!hapticsAvailable}
          icon={
            hapticsAvailable ? (
              <Vibrate className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )
          }
        />
      </div>
    </div>
  );
}
