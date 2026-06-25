"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFeedback } from "@/components/providers/feedback-provider";

export function NavigationFeedback() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const { play, haptic, prime } = useFeedback();

  useEffect(() => {
    if (previousPath.current === null) {
      previousPath.current = pathname;
      return;
    }

    if (previousPath.current !== pathname) {
      play("navigate");
      haptic("light");
      previousPath.current = pathname;
    }
  }, [haptic, pathname, play]);

  useEffect(() => {
    function handleFirstInteraction(): void {
      prime();
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    }

    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    window.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [prime]);

  return null;
}
