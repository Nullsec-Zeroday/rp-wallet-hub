import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Navigation from "@/components/marketing/navigation";
import Footer from "@/components/marketing/footer";
import { AuroraGlow } from "@/components/marketing/aurora-glow";
import "./styles.css";

const satoshi = localFont({
  src: "../public/font/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: {
    default: "Premium Phantom Simulator & Fake Crypto App",
    template: "%s | RP Wallet",
  },
  description:
    "The world's most realistic phantom simulator and fake crypto app for content creation. Create perfect screenshots and roleplay portfolios with our premium fake wallet.",
};

export const viewport: Viewport = {
  themeColor: "#0c0a18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark antialiased font-sans ${satoshi.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-[#0c0a18]">
        <div className="relative min-h-screen overflow-hidden bg-[var(--phantom-darker)]">
          <AuroraGlow />
          <Navigation />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
