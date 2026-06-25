"use client";

import { useEffect, useState } from "react";
import { isHapticsSupported } from "@/lib/feedback/haptics";

/** Client-only haptics probe — false during SSR and first paint to avoid hydration mismatch. */
export function useHapticsSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isHapticsSupported());
  }, []);

  return supported;
}
