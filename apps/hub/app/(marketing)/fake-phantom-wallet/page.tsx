import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";
import { GlassCard } from "@/components/marketing/glass-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import TryFreeButton from "@/components/marketing/try-free-button";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildWebApplicationSchema,
} from "@/lib/seo";

const installSteps = [
  {
    title: "Open RPWallet in your mobile browser",
    body: "There is no APK or IPA file to sideload and nothing to install from an app store. Just open the fake Phantom wallet in Safari on iPhone or Chrome on Android.",
  },
  {
    title: "Add it to your home screen",
    body: "Tap the browser share or menu button and choose \"Add to Home Screen\". RPWallet installs as a PWA and launches full-screen like a native wallet app.",
  },
  {
    title: "Set your balance and tokens",
    body: "Open the wallet, set any SOL balance, and import any token you want to display in your fake Phantom wallet.",
  },
  {
    title: "Capture your content",
    body: "Simulate sends, receives, and notifications, then screenshot or screen-record clean, realistic wallet visuals.",
  },
];

const faq = [
  {
    question: "Is there a fake Phantom wallet APK or download?",
    answer:
      "There is no APK, IPA, or app store download. A sideloaded APK is a common malware risk, so RPWallet runs as a safe web app instead. Open it in your browser and add it to your home screen — you get a native-feeling fake Phantom wallet with nothing to install.",
  },
  {
    question: "How do I get the fake Phantom wallet on iPhone?",
    answer:
      "Open RPWallet in Safari, tap the share icon, and choose \"Add to Home Screen\". The fake Phantom wallet then launches full-screen from your home screen just like an installed app, with no App Store download required.",
  },
  {
    question: "How do I get the fake Phantom wallet on Android?",
    answer:
      "Open RPWallet in Chrome, tap the menu, and choose \"Add to Home Screen\" or \"Install app\". You get the fake Phantom wallet as a home-screen app without downloading any APK.",
  },
  {
    question: "Is the fake Phantom wallet safe?",
    answer:
      "Yes. It never asks for a seed phrase, never connects to a real wallet, and cannot move real funds. Because there is no APK to sideload, there is no malware risk — everything is simulated for content, demos, and roleplay.",
  },
  {
    question: "What can I do with a fake Phantom wallet?",
    answer:
      "Set any balance, import any token, and simulate transactions to create realistic screenshots and videos, product demos, mock portfolios, or roleplay and prank content — all without touching real crypto.",
  },
];

export const metadata: Metadata = {
  title: "Fake Phantom Wallet - Download-Free Phantom Simulator (iOS & Android)",
  description:
    "Get a fake Phantom wallet on iPhone and Android with no APK or download. RPWallet is a safe Phantom wallet simulator: set any balance, import any token, and simulate transactions with no real crypto or seed phrase.",
  keywords: [
    "fake phantom wallet",
    "fake phantom wallet download",
    "fake phantom wallet apk",
    "fake phantom wallet app",
    "fake phantom wallet ios",
    "fake phantom wallet ipa",
    "phantom wallet simulator",
    "fake phantom balance",
    "phantom fake wallet",
    "larp phantom wallet",
  ],
  alternates: {
    canonical: "/fake-phantom-wallet",
  },
  openGraph: {
    title: "Fake Phantom Wallet - Download-Free Phantom Simulator",
    description:
      "A safe fake Phantom wallet for iOS and Android. No APK, no download, no real crypto.",
    url: "/fake-phantom-wallet",
    type: "website",
  },
  twitter: {
    title: "Fake Phantom Wallet - Download-Free Phantom Simulator",
    description:
      "A safe fake Phantom wallet for iOS and Android. No APK, no download, no real crypto.",
  },
};

function buildHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to get a fake Phantom wallet without a download",
    description:
      "Install RPWallet as a fake Phantom wallet on iPhone or Android without any APK, IPA, or app store download.",
    totalTime: "PT2M",
    step: installSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
      url: absoluteUrl(`/fake-phantom-wallet#step-${index + 1}`),
    })),
  };
}

export default function FakePhantomWalletPage() {
  const jsonLd = [
    buildWebApplicationSchema(),
    buildHowToSchema(),
    buildFaqSchema(faq),
    buildBreadcrumbSchema([
      { name: "Home", item: "/" },
      { name: "Fake Phantom Wallet", item: "/fake-phantom-wallet" },
    ]),
  ].filter(Boolean);

  return (
    <div className="w-full overflow-x-hidden pb-20 text-white font-sans selection:bg-ph4ntom-purple/30">
      <main className="relative z-10 w-full flex flex-col items-center px-4 pt-28 md:px-6 md:pt-36">
        {/* Hero */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto mb-20 w-full max-w-4xl text-center px-2 relative">
            <div className="absolute inset-0 bg-ph4ntom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-white/40">
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white/70">Fake Phantom Wallet</span>
            </nav>
            <h1 className="font-display mx-auto max-w-4xl text-[2.5rem] font-medium leading-none tracking-tight text-white md:text-6xl [text-wrap:balance]">
              A safe{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent">
                fake Phantom wallet
              </span>{" "}
              — no download
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-white/60 [text-wrap:pretty]">
              Skip the sketchy APK. RPWallet is a pixel-perfect fake Phantom wallet that runs on iPhone and Android straight from your browser. Set any balance, import any token, and simulate transactions — with no real crypto, no seed phrase, and no app to install.
            </p>
            <div className="mt-10 flex justify-center">
              <TryFreeButton wrapperClassName="w-full sm:w-[280px]" className="!w-full" />
            </div>
          </section>
        </FadeIn>

        {/* Install steps */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto w-full max-w-3xl">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">
                Get it in{" "}
                <span className="text-[#ab9ff2]">under 2 minutes</span>
              </h2>
              <p className="text-white/60 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed mt-4">
                No APK or IPA to sideload — that keeps you safe from the malware fake wallet downloads often carry.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {installSteps.map((step, index) => (
                <div key={step.title} id={`step-${index + 1}`} className="scroll-mt-28">
                  <GlassCard className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ab9ff2]/10 border border-[#ab9ff2]/30 text-[#ab9ff2] font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-white/90 text-lg mb-1">{step.title}</h3>
                        <p className="text-white/55 text-[14px] leading-relaxed font-medium">{step.body}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* FAQ */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto mt-24 w-full max-w-[760px] px-2 relative">
            <div className="absolute inset-0 bg-ph4ntom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-2">
                Fake Phantom wallet{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent">
                  FAQ.
                </span>
              </h2>
            </div>
            <FaqAccordion items={faq} />
          </section>
        </FadeIn>

        {/* CTA */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto mt-24 w-full max-w-2xl text-center">
            <GlassCard radius="rounded-[2.5rem]" className="p-8 md:p-12">
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">
                Get your fake Phantom wallet now
              </h2>
              <p className="mx-auto max-w-xl text-white/60 text-base font-medium leading-relaxed mb-8">
                No download, no risk. Set it up in minutes and start creating realistic wallet content.
              </p>
              <div className="flex flex-col items-center gap-4">
                <TryFreeButton wrapperClassName="w-full sm:w-[280px]" className="!w-full" />
                <Link
                  href="/phantom-wallet-simulator"
                  className="inline-flex items-center gap-1 text-[14px] font-medium text-white/50 hover:text-white transition-colors"
                >
                  Explore the Phantom wallet simulator <ArrowUpRight size={15} />
                </Link>
              </div>
            </GlassCard>
          </section>
        </FadeIn>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
