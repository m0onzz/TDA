"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useFeedback } from "@/components/providers/feedback-provider";
import { cn } from "@/lib/utils";

interface MotionButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  sound?: "tap" | "toggle";
  haptic?: "light" | "medium";
}

export function MotionButton({
  children,
  className,
  onClick,
  disabled,
  type = "button",
  sound = "tap",
  haptic = "light",
}: MotionButtonProps) {
  const { feedback, settings } = useFeedback();

  function handleClick(): void {
    if (disabled) {
      return;
    }
    feedback(sound, haptic);
    onClick?.();
  }

  if (settings.reducedMotion) {
    return (
      <button
        type={type}
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      {children}
    </motion.button>
  );
}
