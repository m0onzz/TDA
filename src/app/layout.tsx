import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TDA — TikTok Dropship Automator",
    template: "%s · TDA",
  },
  description:
    "Automate TikTok Shop dropshipping — product discovery, AI pricing, listing, US-warehouse fulfillment, and Discord order alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth font-sans"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body
        className="font-sans antialiased"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
