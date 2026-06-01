import Navigation from "@/components/marketing/navigation";
import Footer from "@/components/marketing/footer";
import { AuroraGlow } from "@/components/marketing/aurora-glow";
import AffiliateAttributionCapture from "@/components/marketing/affiliate-attribution-capture";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--phantom-darker)]">
      <AffiliateAttributionCapture />
      <AuroraGlow />
      <Navigation />
      {children}
      <Footer />
    </div>
  );
}
