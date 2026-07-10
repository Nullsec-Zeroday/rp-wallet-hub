import LandingContent from "@/components/marketing/landing-content";
import type { Metadata } from "next";
import {
  buildFaqSchema,
  homepageFaq,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "RPWallet - Phantom Wallet Simulator & Fake Crypto Wallet App",
  description:
    "RPWallet is the #1 Phantom wallet simulator and fake crypto wallet app for iOS & Android. Set any balance, import any token, and simulate transactions for creator screenshots, roleplay, product demos, and mock portfolios — no download, no real crypto.",
  keywords: [
    "larp",
    "larping",
    "content creation",
    "simulation",
    "fake crypto app",
    "fake phantom app",
    "fake phantom wallet",
    "fake phantom wallet download",
    "fake phantom wallet apk",
    "phantom wallet simulator",
    "phantom simulator",
    "simulator wallet",
    "larp wallet",
    "crypto wallet simulator",
    "wealth simulator",
    "fake crypto balance",
    "content creator tools",
    "wallet mockup app",
    "portfolio screenshot app",
    "crypto demo wallet",
    "wallet roleplay app",
    "novelty crypto wallet",
    "crypto screenshot tool",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RPWallet - Phantom Wallet Simulator & Fake Crypto Wallet App",
    description:
      "Create realistic Phantom-style and crypto wallet simulator screens for content, demos, roleplay, and mock portfolios.",
    url: "/",
  },
  twitter: {
    title: "RPWallet - Phantom Wallet Simulator & Fake Crypto Wallet App",
    description:
      "Create realistic Phantom-style and crypto wallet simulator screens for content, demos, roleplay, and mock portfolios.",
  },
};

export default function HomePage() {
  const faqJsonLd = buildFaqSchema(homepageFaq);

  return (
    <div className="min-h-vh relative text-white selection:bg-ph4ntom-purple/30">
      <main className="relative z-10 flex w-full flex-col items-center">
        <LandingContent />
      </main>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </div>
  );
}
