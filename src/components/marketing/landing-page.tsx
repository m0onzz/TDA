"use client";

import {
  ArrowRight,
  Rocket,
  Search,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/fade-in";
import { MotionLink } from "@/components/motion/motion-link";

const features = [
  {
    icon: Search,
    title: "Product discovery",
    description:
      "Identify viable dropship products with margin analysis and US-warehouse suppliers that meet TikTok shipping requirements.",
  },
  {
    icon: TrendingUp,
    title: "Pricing optimization",
    description:
      "Set sell prices with tiered markup, platform fee buffers, and margin targets aligned to TikTok Shop economics.",
  },
  {
    icon: Rocket,
    title: "Listing management",
    description:
      "Publish optimized listings to TikTok Shop with images, variants, and pricing synchronized from a single workflow.",
  },
  {
    icon: Truck,
    title: "Fulfillment automation",
    description:
      "Route orders to US-warehouse suppliers and monitor shipments against TikTok's 48-hour fulfillment SLA.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Source and qualify products",
    description:
      "Import supplier catalogs, filter by margin and warehouse location, and assemble a sellable product catalog.",
  },
  {
    step: "02",
    title: "Configure pricing rules",
    description:
      "Apply margin-aware pricing with platform fee buffers and consistent price points across your catalog.",
  },
  {
    step: "03",
    title: "Publish and fulfill orders",
    description:
      "Publish to TikTok Shop, receive orders via webhook, and route fulfillment to approved US suppliers.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <FadeIn delay={0.05}>
                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                  TDA
                </p>
              </FadeIn>
              <FadeIn delay={0.12}>
                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Automate your TikTok Shop dropshipping pipeline
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                  TDA automates product discovery, pricing, and TikTok Shop
                  publishing — so your team can scale revenue without manual
                  fulfillment workflows.
                </p>
              </FadeIn>
              <FadeIn delay={0.28}>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <MotionLink
                    href="/login?mode=signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-90 sm:w-auto"
                  >
                    Sign up
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </MotionLink>
                  <MotionLink
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border px-6 py-3 text-sm transition-colors hover:bg-accent sm:w-auto"
                  >
                    Login
                  </MotionLink>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                End-to-end TikTok Shop operations
              </h2>
              <p className="mt-4 text-muted-foreground">
                From supplier sourcing to order fulfillment, TDA connects your
                catalog to TikTok Shop with automation at each stage.
              </p>
            </FadeIn>

            <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <StaggerItem key={title}>
                  <article className="h-full rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-16 border-b border-border"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                A three-step workflow from supplier catalog to live TikTok
                listing.
              </p>
            </FadeIn>

            <StaggerContainer className="mt-16 grid gap-8 lg:grid-cols-3">
              {steps.map(({ step, title, description }) => (
                <StaggerItem key={step}>
                  <div className="flex h-full flex-col rounded-xl border border-border bg-card p-8">
                    <span className="text-4xl font-bold text-muted-foreground/40">
                      {step}
                    </span>
                    <h3 className="mt-4 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get started with TDA
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-background/70">
                Create an account to connect suppliers, configure pricing rules,
                and publish listings to TikTok Shop.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <MotionLink
                  href="/login?mode=signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-background px-6 py-3 text-sm text-foreground transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Sign up
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </MotionLink>
                <MotionLink
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-background/30 px-6 py-3 text-sm transition-colors hover:bg-background/10 sm:w-auto"
                >
                  Login
                </MotionLink>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
