import LandingContent from "@/components/marketing/landing-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Ultimate Phantom Wallet & Fake Crypto Simulator App",
  description:
    "The #1 fake phantom wallet simulator for crypto content creation. Create indistinguishable screenshots with our premium fake crypto app. Perfect for creators and roleplay flexes.",
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
    </div>
  );
}
