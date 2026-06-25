"use client";

import { useFeedback } from "@/components/providers/feedback-provider";

export function AmbientBackground() {
  const { settings } = useFeedback();

  if (settings.reducedMotion) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-grain" />
    </div>
  );
}
