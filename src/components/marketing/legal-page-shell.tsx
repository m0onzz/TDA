import type { ReactNode } from "react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

interface LegalPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-10 border-b border-border pb-8">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-3 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </header>
          <div className="legal-prose">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
