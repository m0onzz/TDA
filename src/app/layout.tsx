import type { Metadata } from "next";
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
