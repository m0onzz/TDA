import Link from "next/link";

const footerLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/login", label: "Login" },
  { href: "/login?mode=signup", label: "Sign up" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-xl font-bold tracking-tight">TDA</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              TikTok Shop automation for dropshipping teams — product
              discovery, pricing, listing, and US-warehouse fulfillment in
              one platform.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map(({ href, label }) =>
              href.startsWith("#") ? (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TDA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
