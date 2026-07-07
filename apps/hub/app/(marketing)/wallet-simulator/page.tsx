import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";
import { GlassCard } from "@/components/marketing/glass-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import TryFreeButton from "@/components/marketing/try-free-button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildWebApplicationSchema,
} from "@/lib/seo";

const faq = [
  {
    question: "What is a Phantom wallet simulator?",
    answer:
      "A Phantom wallet simulator is a pixel-perfect copy of the Phantom wallet interface that lets you set any balance, add any token, and simulate transactions without touching real crypto. RPWallet renders the same screens Phantom uses so your screenshots and videos look authentic, while nothing connects to a real blockchain, seed phrase, or private key.",
  },
  {
    question: "Is the Phantom wallet simulator free to try?",
    answer:
      "You can preview the RPWallet Phantom simulator and see exactly how the screens look before buying access. Full editable access to balances, tokens, and simulated transactions is unlocked with a low one-time plan.",
  },
  {
    question: "Does the Phantom simulator work on iPhone and Android?",
    answer:
      "Yes. RPWallet runs as a mobile-first web app, so the Phantom wallet simulator works on iOS and Android with no app store download or APK required. Add it to your home screen and it behaves like a native wallet app.",
  },
  {
    question: "Is using a Phantom wallet simulator safe?",
    answer:
      "It is safe by design. RPWallet never asks for a seed phrase, never connects to your real Phantom wallet, and cannot move real funds. Everything is simulated locally for content, demos, and roleplay, so no real balances or private data are ever exposed.",
  },
  {
    question: "Can I use it for content and demos without real crypto?",
    answer:
      "That is exactly what it is built for. Creators, product teams, and educators use the Phantom simulator to record walkthroughs, capture clean portfolio screenshots, and build launch visuals without risking real assets or leaking wallet data.",
  },
];

export const metadata: Metadata = {
  title: "Phantom Wallet Simulator - Fake Phantom Wallet for iOS & Android",
  description:
    "RPWallet is the #1 Phantom wallet simulator. Create pixel-perfect fake Phantom wallet screens with any balance, custom tokens, and simulated transactions on iPhone and Android. No real crypto, no seed phrase, no download.",
  keywords: [
    "phantom wallet simulator",
    "fake phantom wallet",
    "phantom simulator",
    "phantom wallet mockup",
    "fake phantom wallet app",
    "phantom wallet simulator ios",
    "phantom wallet simulator android",
    "crypto wallet simulator",
    "larp phantom wallet",
    "fake crypto wallet simulator",
  ],
  alternates: {
    canonical: "/wallet-simulator",
  },
  openGraph: {
    title: "Phantom Wallet Simulator - Fake Phantom Wallet for iOS & Android",
    description:
      "Create pixel-perfect fake Phantom wallet screens with any balance and custom tokens. No real crypto involved.",
    url: "/wallet-simulator",
    type: "website",
  },
  twitter: {
    title: "Phantom Wallet Simulator - Fake Phantom Wallet for iOS & Android",
    description:
      "Create pixel-perfect fake Phantom wallet screens with any balance and custom tokens. No real crypto involved.",
  },
};

const features = [
  {
    title: "Pixel-perfect Phantom copy",
    body: "Every screen mirrors the real Phantom wallet layout, typography, and iconography so your visuals read as authentic.",
  },
  {
    title: "Set any balance",
    body: "Edit your SOL and token balances to any number in seconds. Build the exact portfolio your content or demo needs.",
  },
  {
    title: "Import any token",
    body: "Add any SPL token with its logo, ticker, and live-style pricing to fill out a realistic wallet.",
  },
  {
    title: "Simulate transactions",
    body: "Trigger sends, receives, swaps, and push notifications to record believable transaction flows.",
  },
  {
    title: "No seed phrase, no risk",
    body: "Nothing connects to a real wallet or blockchain. There is no private key to leak and no funds to lose.",
  },
  {
    title: "Works on iOS & Android",
    body: "Runs as a mobile web app with no App Store or APK download. Add to home screen and it feels native.",
  },
];

const steps = [
  {
    title: "Open RPWallet on your phone",
    body: "Launch the Phantom wallet simulator in your mobile browser and add it to your home screen for a native feel.",
  },
  {
    title: "Set balances and add tokens",
    body: "Enter any SOL amount, import the tokens you want, and arrange the portfolio exactly how you need it.",
  },
  {
    title: "Simulate and capture",
    body: "Trigger transactions and notifications, then screenshot or screen-record the result for your content.",
  },
];

export default function PhantomWalletSimulatorPage() {
  const jsonLd = [
    buildWebApplicationSchema(),
    buildFaqSchema(faq),
    buildBreadcrumbSchema([
      { name: "Home", item: "/" },
      { name: "Phantom Wallet Simulator", item: "/wallet-simulator" },
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
              <span className="text-white/70">Phantom Wallet Simulator</span>
            </nav>
            <h1 className="font-display mx-auto max-w-4xl text-[2.5rem] font-medium leading-none tracking-tight text-white md:text-6xl [text-wrap:balance]">
              The #1{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent">
                Phantom wallet simulator
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-white/60 [text-wrap:pretty]">
              RPWallet is a pixel-perfect fake Phantom wallet for iOS and Android. Set any balance, import any token, and simulate transactions to create authentic wallet content, demos, and roleplay scenes — with no real crypto, no seed phrase, and no download.
            </p>
            <div className="mt-10 flex justify-center">
              <TryFreeButton wrapperClassName="w-full sm:w-[280px]" className="!w-full" />
            </div>
          </section>
        </FadeIn>

        {/* Features */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto w-full max-w-[1000px]">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">
                Everything a{" "}
                <span className="text-[#ab9ff2]">Phantom simulator</span> should do
              </h2>
              <p className="text-white/60 text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed mt-4">
                A full fake Phantom wallet experience, engineered for content and demos.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <GlassCard key={feature.title} className="p-6 md:p-7 h-full">
                  <h3 className="font-medium text-white/90 text-lg mb-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {feature.title}
                  </h3>
                  <p className="text-white/55 text-[14px] leading-relaxed font-medium">
                    {feature.body}
                  </p>
                </GlassCard>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* How it works */}
        <FadeIn direction="up" className="w-full">
          <section className="mx-auto mt-24 w-full max-w-3xl">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">
                How it{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent">
                  works.
                </span>
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <GlassCard key={step.title} className="p-6">
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
                Phantom simulator{" "}
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
                Start your Phantom simulation
              </h2>
              <p className="mx-auto max-w-xl text-white/60 text-base font-medium leading-relaxed mb-8">
                Join 800+ creators and larpers using RPWallet to build safe, realistic wallet content in minutes.
              </p>
              <div className="flex flex-col items-center gap-4">
                <TryFreeButton wrapperClassName="w-full sm:w-[280px]" className="!w-full" />
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-1 text-[14px] font-medium text-white/50 hover:text-white transition-colors"
                >
                  View pricing <ArrowUpRight size={15} />
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
