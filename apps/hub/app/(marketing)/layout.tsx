import type { Metadata } from "next";
import Navigation from "@/components/marketing/navigation";
import Footer from "@/components/marketing/footer";
import { AuroraGlow } from "@/components/marketing/aurora-glow";
import AffiliateAttributionCapture from "@/components/marketing/affiliate-attribution-capture";
import FunnelAnalytics from "@/components/marketing/funnel-analytics";
import SocialProofToasts from "@/components/marketing/social-proof-toasts";

export const metadata: Metadata = {
  title: {
    default: "RPWallet - Phantom Wallet Simulator & Fake Crypto App",
    template: "%s | RPWallet",
  },
  description:
    "Use RPWallet to create realistic Phantom and crypto wallet simulator screens for content, demos, mock portfolios, and roleplay without real funds.",
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
    </div>
  );
}
