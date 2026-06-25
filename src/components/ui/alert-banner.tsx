"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useFeedback } from "@/components/providers/feedback-provider";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: "alert-error",
  success: "alert-success",
  info: "alert-info",
};

interface AlertBannerProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  icon?: ReactNode;
}

export function AlertBanner({
  variant,
  children,
  className,
  role,
  icon,
}: AlertBannerProps) {
  const { settings } = useFeedback();

  const content = (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(
        VARIANT_CLASSES[variant],
        icon && "flex items-center gap-2",
        className
      )}
    >
      {icon}
      {children}
    </div>
  );

  if (settings.reducedMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}
