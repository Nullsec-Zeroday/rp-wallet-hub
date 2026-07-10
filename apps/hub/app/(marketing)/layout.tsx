import type { Metadata } from "next";
import { Rajdhani, Chakra_Petch, Exo_2 } from "next/font/google";
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

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-exo",
});

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${rajdhani.variable} ${chakraPetch.variable} ${exo2.variable} sl-body relative min-h-screen overflow-hidden bg-[#0a0714]`}
      style={{ "--font-satoshi": "var(--font-rajdhani)" } as React.CSSProperties}
    >
      <AffiliateAttributionCapture />
      <FunnelAnalytics />
      <AuroraGlow />
      <Navigation />
      {children}
      <Footer />
    </div>
  );
}
