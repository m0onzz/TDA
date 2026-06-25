"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useFeedback } from "@/components/providers/feedback-provider";

const EASE = [0.22, 1, 0.36, 1] as const;

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide" | "scale";
}

export function PageTransition({
  children,
  variant = "slide",
}: PageTransitionProps) {
  const { settings } = useFeedback();

  if (settings.reducedMotion) {
    return <>{children}</>;
  }

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slide: {
      initial: { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
    },
  }[variant];

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
