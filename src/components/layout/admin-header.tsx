"use client";

import { motion } from "framer-motion";
import { useFeedback } from "@/components/providers/feedback-provider";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { settings } = useFeedback();

  if (settings.reducedMotion) {
    return (
      <header className="border-b border-border bg-card/50 px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
    );
  }

  return (
    <motion.header
      className="border-b border-border bg-card/50 px-6 py-5 md:px-8"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="text-2xl font-bold uppercase tracking-wide">{title}</h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </motion.header>
  );
}
