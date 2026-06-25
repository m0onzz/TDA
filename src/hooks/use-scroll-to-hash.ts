"use client";

import { useEffect } from "react";

/** Scroll to URL hash after client navigation (e.g. /terms → /#features). */
export function useScrollToHash(): void {
  useEffect(() => {
    function scrollToHash(): void {
      const hash = window.location.hash;
      if (!hash) {
        return;
      }

      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);
}
