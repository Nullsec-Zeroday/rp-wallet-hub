import LandingContent from "@/components/marketing/landing-content";
import type { Metadata } from "next";
import {
  buildFaqSchema,
  homepageFaq,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Ultimate Ph4ntom Wallet & Fake Crypto Simulator App",
  description:
    "The #1 fake ph4ntom wallet simulator for crypto content creation. Create indistinguishable screenshots with our premium fake crypto app. Perfect for creators and roleplay flexes.",
  keywords: [
    "larp",
    "larping",
    "content creation",
    "simulation",
    "fake crypto app",
    "fake ph4ntom app",
    "fake ph4ntom wallet",
    "ph4ntom simulator",
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
    title: "The Ultimate Ph4ntom Wallet & Fake Crypto Simulator App",
    description:
      "The #1 fake ph4ntom wallet simulator for crypto content creation. Create indistinguishable screenshots with our premium fake crypto app.",
    url: "/",
  },
  twitter: {
    title: "The Ultimate Ph4ntom Wallet & Fake Crypto Simulator App",
    description:
      "The #1 fake ph4ntom wallet simulator for crypto content creation. Create indistinguishable screenshots with our premium fake crypto app.",
  },
};

export default function HomePage() {
  const faqJsonLd = buildFaqSchema(homepageFaq);

  return (
    <div className="min-h-vh relative text-white font-sans selection:bg-ph4ntom-purple/30">
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
