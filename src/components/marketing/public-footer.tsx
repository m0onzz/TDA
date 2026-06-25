import Link from "next/link";
import { PUBLIC_FOOTER_LINKS } from "@/components/marketing/public-nav-links";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight transition-colors hover:opacity-80"
            >
              TDA
            </Link>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              TikTok Shop automation for dropshipping teams — product
              discovery, pricing, listing, and US-warehouse fulfillment in
              one platform.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {PUBLIC_FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TDA. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
