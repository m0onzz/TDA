import type { HapticPattern } from "@/lib/feedback/types";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 16,
  success: [12, 40, 20],
  error: [30, 50, 30, 50, 30],
};

export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function triggerHaptic(pattern: HapticPattern): void {
  if (!isHapticsSupported()) {
    return;
  }

  navigator.vibrate(HAPTIC_PATTERNS[pattern]);
}
