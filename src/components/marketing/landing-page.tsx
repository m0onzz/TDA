"use client";

import {
  ArrowRight,
  Bell,
  Clock,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { AmbientBackground } from "@/components/motion/ambient-background";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/fade-in";
import { MotionLink } from "@/components/motion/motion-link";

const stats = [
  { value: "48h", label: "Fulfillment SLA target" },
  { value: "US", label: "Warehouse-only routing" },
  { value: "1 click", label: "TikTok Shop listing" },
  { value: "Live", label: "Discord order alerts" },
] as const;

const features = [
  {
    icon: Search,
    title: "Product discovery",
    description:
      "Scan supplier catalogs with US-warehouse filters and trending sort — import winners in one click.",
  },
  {
    icon: Sparkles,
    title: "AI price optimization",
    description:
      "Apply tiered markup, platform fee buffers, and margin targets so every listing stays profitable on TikTok Shop.",
  },
  {
    icon: Rocket,
    title: "Listing management",
    description:
      "List optimized titles, images, variants, and pricing on TikTok Shop from a single listings center.",
  },
  {
    icon: Truck,
    title: "US fulfillment automation",
    description:
      "Route orders to approved US-warehouse suppliers and track shipments against TikTok's 48-hour shipping deadline.",
  },
  {
    icon: Bell,
    title: "Discord order alerts",
    description:
      "Get instant channel notifications when orders arrive — including product sold and estimated profit per sale.",
  },
  {
    icon: Clock,
    title: "SLA monitoring",
    description:
      "Surface at-risk orders on your dashboard before deadlines slip, with full fulfillment attempt audit logs.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Discover & import",
    description:
      "Filter by cost and US shipping in Product Finder, then apply markup and margin targets in Price Optimizer.",
  },
  {
    step: "02",
    title: "Optimize & review",
    description:
      "Run price optimization across your catalog, preview net profit after TikTok fees, and mark listings ready.",
  },
  {
    step: "03",
    title: "List & fulfill",
    description:
      "List on TikTok Shop, receive orders via webhook, route to suppliers, and get Discord alerts in real time.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="hero-glow absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
              <FadeIn delay={0.05} className="text-center">
                <p className="flex w-fit items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  TikTok Shop automation
                </p>
              </FadeIn>
              <FadeIn delay={0.12} className="w-full text-center">
                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Scale your{" "}
                  <span className="text-shimmer">dropshipping pipeline</span>{" "}
                  on autopilot
                </h1>
              </FadeIn>
              <FadeIn delay={0.2} className="w-full text-center">
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  TDA handles product discovery, AI pricing, TikTok Shop
                  listing, and US-warehouse fulfillment — so you can focus on
                  growing revenue, not manual ops.
                </p>
              </FadeIn>
              <FadeIn delay={0.28} className="text-center">
                <div className="mt-10 flex justify-center">
                  <MotionLink href="/login" className="btn-secondary px-6 py-3">
                    Sign in to dashboard
                  </MotionLink>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.36} className="mx-auto mt-16 w-full max-w-4xl">
              <div id="platform" className="scroll-mt-20">
                <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map(({ value, label }) => (
                    <StaggerItem key={label} className="h-full min-w-0">
                      <div className="panel-padded flex h-full min-h-[7.25rem] min-w-0 flex-col items-center justify-center text-center">
                        <p className="flex min-h-[2.25rem] w-full items-center justify-center px-1 text-xl font-bold leading-none tracking-normal sm:min-h-[2.75rem] sm:text-2xl lg:text-[1.65rem] xl:text-3xl">
                          {value}
                        </p>
                        <p className="mt-1.5 flex min-h-[2.5rem] w-full items-center justify-center px-1 text-xs uppercase leading-snug tracking-wide text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Platform
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to run TikTok dropshipping
              </h2>
              <p className="mt-4 text-muted-foreground">
                From supplier sourcing to order fulfillment, TDA connects your
                catalog to TikTok Shop with automation at every stage.
              </p>
            </FadeIn>

            <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <StaggerItem key={title}>
                  <article className="panel-interactive panel-padded h-full">
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
          className="scroll-mt-16 border-b border-border bg-muted/20"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Workflow
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps to live listings
              </h2>
              <p className="mt-4 text-muted-foreground">
                A streamlined path from supplier catalog to fulfilled TikTok
                Shop orders.
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

            <FadeIn className="mt-12 text-center">
              <MotionLink
                href="/login?mode=signup"
                className="btn-secondary inline-flex gap-2"
              >
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                Start optimizing your catalog
              </MotionLink>
            </FadeIn>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to automate your TikTok Shop?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-background/70">
                Create an account to connect suppliers, configure Discord
                alerts, and list your first product in minutes.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <MotionLink
                  href="/login?mode=signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-background bg-background px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </MotionLink>
                <MotionLink
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-md border border-background/30 px-6 py-3 text-sm transition-colors hover:bg-background/10 sm:w-auto"
                >
                  Sign in
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
