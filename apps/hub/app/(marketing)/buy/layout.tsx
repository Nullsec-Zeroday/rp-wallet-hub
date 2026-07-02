import { Metadata } from "next";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { buildOfferCatalogSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing for RPWallet Phantom & Crypto Wallet Simulator",
  description:
    "Choose an RPWallet plan for realistic Phantom and crypto wallet simulator access on iOS or Android. Create wallet screenshots, demos, and roleplay content.",
  alternates: {
    canonical: "/buy",
  },
  openGraph: {
    title: "RPWallet Pricing - Phantom & Crypto Wallet Simulator",
    description:
      "Get mobile access to RPWallet for editable balances, custom tokens, wallet screenshots, demos, and roleplay content.",
    url: "/buy",
  },
  twitter: {
    title: "RPWallet Pricing - Phantom & Crypto Wallet Simulator",
    description:
      "Get mobile access to RPWallet for editable balances, custom tokens, wallet screenshots, demos, and roleplay content.",
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  const offerCatalogJsonLd = buildOfferCatalogSchema(Object.values(PRICING_PLANS));

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }}
      />
    </>
  );
}
