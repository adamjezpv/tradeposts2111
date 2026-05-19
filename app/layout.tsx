import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradePosts.io — AI Google Business Posts for Tradespeople",
  description:
    "Automatically generate and publish 4 Google Business Profile posts per month for plumbers, electricians, HVAC, and roofers. Set it and forget it.",
  keywords: "google business profile, auto post, plumber marketing, electrician seo, hvac local seo",
  openGraph: {
    title: "TradePosts.io",
    description: "AI-powered Google Business posts on autopilot for tradespeople.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
