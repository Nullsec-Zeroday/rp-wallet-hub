import type { Metadata } from "next";
import Navigation from "@/components/marketing/navigation";
import Footer from "@/components/marketing/footer";
import { AuroraGlow } from "@/components/marketing/aurora-glow";
import AffiliateAttributionCapture from "@/components/marketing/affiliate-attribution-capture";
import FunnelAnalytics from "@/components/marketing/funnel-analytics";
import SocialProofToasts from "@/components/marketing/social-proof-toasts";

export const metadata: Metadata = {
  title: {
    default: "Premium Phantom Simulator & Fake Crypto App",
    template: "%s | RPWallet",
  },
  description:
    "The world's most realistic phantom simulator and fake crypto app for content creation. Create perfect screenshots and roleplay portfolios with our premium fake wallet.",
  alternates: {
    canonical: "/",
  },
};

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ph4ntom-darker)]">
      <AffiliateAttributionCapture />
      <FunnelAnalytics />
      <AuroraGlow />
      <Navigation />
      {children}
      <Footer />
      <SocialProofToasts />
    </div>
  );
}
