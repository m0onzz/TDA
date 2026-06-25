/** Homepage section anchors — use `/#…` so links work from /terms, /privacy, etc. */
export const PUBLIC_HOME_NAV_LINKS = [
  { href: "/#platform", label: "Platform" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  ...PUBLIC_HOME_NAV_LINKS,
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Login" },
  { href: "/login?mode=signup", label: "Sign up" },
] as const;
