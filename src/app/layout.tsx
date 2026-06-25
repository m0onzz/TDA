import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "TDA",
  description:
    "TDA — TikTok dropshipping automation. Product discovery, price optimization, TikTok Shop publishing, and 48-hour fulfillment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
