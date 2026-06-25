"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Package,
  Rocket,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { signOutAction } from "@/app/(auth)/login/actions";
import { useFeedback } from "@/components/providers/feedback-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/product-finder", label: "Product Finder", icon: Search },
  { href: "/ai-transformer", label: "Price Optimizer", icon: TrendingUp },
  { href: "/publish", label: "Publish", icon: Rocket },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  userEmail: string;
}

function getInitials(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { feedback, settings } = useFeedback();

  async function handleSignOut() {
    feedback("tap", "medium");
    await signOutAction();
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleNavClick(): void {
    feedback("tap", "light");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={handleNavClick}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-foreground bg-foreground text-background">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none tracking-tight">TDA</p>
          </div>
        </Link>
      </div>

      <LayoutGroup>
        <nav className="relative flex-1 space-y-0.5 p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive ? "text-foreground" : "nav-inactive"
                )}
              >
                {isActive && !settings.reducedMotion ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md border-l-2 border-foreground bg-muted"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                ) : isActive ? (
                  <span className="absolute inset-0 rounded-md border-l-2 border-foreground bg-muted" />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground bg-foreground text-xs text-background"
            aria-hidden="true"
          >
            {getInitials(userEmail)}
          </div>
          <p
            className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
            title={userEmail}
          >
            {userEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="btn-secondary mt-3 w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
