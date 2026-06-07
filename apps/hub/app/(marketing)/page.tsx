import LandingContent from "@/components/marketing/landing-content";
import type { Metadata } from "next";
import {
  buildFaqSchema,
  buildOrganizationSchema,
  buildSiteNavigationSchema,
  buildWebApplicationSchema,
  homepageFaq,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fake Crypto Wallet App & Phantom Wallet Simulator",
  description:
    "Create fake crypto wallet screenshots with a realistic Phantom and Trust Wallet simulator. Edit balances, add tokens, simulate activity, and build LARP wallet content with no real crypto involved.",
  keywords: [
    "fake crypto wallet",
    "fake crypto wallet screen",
    "fake crypto wallet screenshot",
    "fake crypto wallet app",
    "fake crypto wallet generator",
    "fake crypto wallet balance",
    "fake crypto wallet screenshot generator",
    "larp wallet",
    "larp wallet crypto",
    "larp wallet app",
    "phantom larp wallet",
    "fake phantom wallet screenshot",
    "fake phantom wallet",
    "fake phantom wallet balance",
    "fake phantom wallet app",
    "fake phantom wallet generator",
    "how to create a fake crypto wallet",
    "how to make fake phantom wallet screenshot",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fake Crypto Wallet App & Phantom Wallet Screenshot Generator",
    description:
      "Build realistic Phantom and Trust Wallet screenshots, edit balances, and create crypto LARP content safely with RPWallet.",
    url: "/",
  },
  twitter: {
    title: "Fake Crypto Wallet App & Phantom Wallet Simulator",
    description:
      "Create realistic wallet screenshots, fake Phantom balances, and crypto LARP content with no real crypto involved.",
  },
};

export default function HomePage() {
  const faqJsonLd = buildFaqSchema(homepageFaq);

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
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </div>
  );
}
