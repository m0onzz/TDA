"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import { useFeedback } from "@/components/providers/feedback-provider";
import { cn } from "@/lib/utils";

type MotionLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  className?: string;
};

export function MotionLink({
  children,
  className,
  onClick,
  ...props
}: MotionLinkProps) {
  const { feedback, settings } = useFeedback();

  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>
  ): void {
    feedback("tap", "light");
    onClick?.(event);
  }

  if (settings.reducedMotion) {
    return (
      <Link className={className} onClick={handleClick} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <motion.div
      className="inline-flex"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Link className={cn(className)} onClick={handleClick} {...props}>
        {children}
      </Link>
    </motion.div>
  );
}
