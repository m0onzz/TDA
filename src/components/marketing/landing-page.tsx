import Link from "next/link";
import {
  ArrowRight,
  Rocket,
  Search,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

const features = [
  {
    icon: Search,
    title: "Product Finder",
    description:
      "Discover trending dropship products with margin analysis and US-warehouse suppliers that meet TikTok's shipping SLA.",
  },
  {
    icon: TrendingUp,
    title: "Price Optimizer",
    description:
      "Calculate optimal sell prices with tiered markup, charm pricing, and margin targets for TikTok Shop.",
  },
  {
    icon: Rocket,
    title: "One-Click Publish",
    description:
      "Push optimized listings straight to TikTok Shop — images, variants, and pricing synced in one workflow.",
  },
  {
    icon: Truck,
    title: "48-Hour Fulfillment",
    description:
      "Route orders only to US-warehouse suppliers and track at-risk orders before TikTok deadlines hit.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Find winning products",
    description:
      "Import supplier catalogs, filter by margin and warehouse location, and build a sellable catalog in minutes.",
  },
  {
    step: "02",
    title: "Optimize pricing",
    description:
      "Apply margin-aware pricing with platform fee buffers and psychological price points for each product.",
  },
  {
    step: "03",
    title: "Publish and fulfill",
    description:
      "Publish to TikTok Shop, receive orders via webhook, and auto-route fulfillment to trusted US suppliers.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                TDA
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Automate your TikTok Shop dropshipping pipeline
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                TDA handles product discovery, price optimization, and
                TikTok Shop publishing — so you can focus on scaling sales
                instead of manual busywork.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-border px-6 py-3 text-sm transition-colors hover:bg-accent sm:w-auto"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to run TikTok dropshipping
              </h2>
              <p className="mt-4 text-muted-foreground">
                From sourcing to fulfillment, TDA connects your supplier catalog
                to TikTok Shop with automation at every step.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-b border-border scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                A three-step pipeline from supplier link to live TikTok listing.
              </p>
            </div>

            <ol className="mt-16 grid gap-8 lg:grid-cols-3">
              {steps.map(({ step, title, description }) => (
                <li key={step} className="relative">
                  <div className="flex flex-col rounded-xl border border-border bg-card p-8 h-full">
                    <span className="text-4xl font-bold text-muted-foreground/40">
                      {step}
                    </span>
                    <h3 className="mt-4 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to launch on TikTok Shop?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-background/70">
              Create your account and connect your supplier credentials. Your
              first optimized listing is minutes away.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-background px-6 py-3 text-sm text-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-background/30 px-6 py-3 text-sm transition-colors hover:bg-background/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
