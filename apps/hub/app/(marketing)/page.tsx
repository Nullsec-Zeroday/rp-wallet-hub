import LandingContent from "@/components/marketing/landing-content";
import type { Metadata } from "next";
import { buildWebApplicationSchema, buildOrganizationSchema, buildSiteNavigationSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "LarperWallet — Fake Crypto Wallet App & Phantom Wallet Simulator",
  description:
    "The #1 fake crypto wallet and crypto wallet simulator. A pixel-perfect Phantom wallet simulator with customizable balances, live prices, and real-time P2P transaction simulation. Perfect for content creators, demos, and crypto roleplay.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-vh relative text-white font-sans selection:bg-phantom-purple/30">
      <main className="relative z-10 flex w-full flex-col items-center">
        <LandingContent />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebApplicationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSiteNavigationSchema()) }}
      />
    </div>
  );
}
