"use client";

import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/providers/feedback-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationFeedback } from "@/components/providers/navigation-feedback";
import { AmbientBackground } from "@/components/motion/ambient-background";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <AmbientBackground />
        <NavigationFeedback />
        {children}
      </FeedbackProvider>
    </ThemeProvider>
  );
}
