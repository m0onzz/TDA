"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import { PUBLIC_HOME_NAV_LINKS } from "@/components/marketing/public-nav-links";
import { useFeedback } from "@/components/providers/feedback-provider";
import { MotionLink } from "@/components/motion/motion-link";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { feedback, settings } = useFeedback();

  function handleAnchorClick(): void {
    feedback("tap", "light");
    setMobileOpen(false);
  }

  function toggleMobileMenu(): void {
    feedback("toggle", "light");
    setMobileOpen((open) => !open);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 justify-start">
          <MotionLink
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-foreground bg-foreground text-background">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            TDA
          </MotionLink>
        </div>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          {PUBLIC_HOME_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => feedback("tap", "light")}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <MotionLink
              href="/login"
              className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              Login
            </MotionLink>
            <MotionLink
              href="/login?mode=signup"
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90"
            >
              Sign up
            </MotionLink>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={toggleMobileMenu}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={settings.reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
              {PUBLIC_HOME_NAV_LINKS.map(({ href, label }, index) => (
                <motion.div
                  key={href}
                  initial={
                    settings.reducedMotion
                      ? false
                      : { opacity: 0, x: -8 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={href}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={handleAnchorClick}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-center text-sm transition-colors hover:bg-accent"
                  onClick={() => {
                    feedback("tap", "light");
                    setMobileOpen(false);
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg bg-foreground px-3 py-2 text-center text-sm text-background transition-opacity hover:opacity-90"
                  onClick={() => {
                    feedback("tap", "light");
                    setMobileOpen(false);
                  }}
                >
                  Sign up
                </Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
