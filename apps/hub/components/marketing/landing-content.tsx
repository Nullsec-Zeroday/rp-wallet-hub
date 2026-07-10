"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X, Send, ArrowUpRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAssetUrl } from "@/lib/utils";
import { homepageFaq } from "@/lib/seo";
import HeroButtons from "./hero-buttons";
import dynamic from "next/dynamic";
const DemoModal = dynamic(() => import("./demo-modal"), { ssr: false });

import { trackEvent } from "@/lib/track";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { isDemoFeatureEnabled } from "@/lib/demo-config";

const PRODUCT_IMAGES = [
  { src: "/product/new-product-1.webp", alt: "RPWallet product screenshot 1" },
  { src: "/product/new-product-2.webp", alt: "RPWallet product screenshot 2" },
] as const;

const VOUCHES = [
  { src: "/vouches/alex-m.webp", name: "Telegram User" },
  { src: "/vouches/ben-t.webp", name: "Telegram User" },
  { src: "/vouches/chloe-s.webp", name: "Telegram User" },
  { src: "/vouches/dara-k.webp", name: "Telegram User" },
  { src: "/vouches/david-p.webp", name: "Telegram User" },
  { src: "/vouches/emily-r.webp", name: "Telegram User" },
  { src: "/vouches/frank-w.webp", name: "Telegram User" },
  { src: "/vouches/mia-g.webp", name: "Telegram User" },
] as const;

// Static values — random values would mismatch between server and client render.
const PARTICLES = [
  { left: "6%", size: 3, duration: 9, delay: 0 },
  { left: "16%", size: 2, duration: 12, delay: 2.5 },
  { left: "28%", size: 4, duration: 10, delay: 1 },
  { left: "41%", size: 2, duration: 14, delay: 4 },
  { left: "55%", size: 3, duration: 11, delay: 0.5 },
  { left: "67%", size: 2, duration: 13, delay: 3 },
  { left: "78%", size: 4, duration: 9.5, delay: 5 },
  { left: "88%", size: 2, duration: 12.5, delay: 1.5 },
  { left: "95%", size: 3, duration: 10.5, delay: 6 },
] as const;

const SKILLS = [
  { icon: "/3d-icons/11.webp", alt: "Pixel-perfect icon", title: "Pixel-Perfect Copy", rank: "S", imgClass: "w-14 h-14 md:w-16 md:h-16 saturate-[0.8]" },
  { icon: "/3d-icons/live token.webp", alt: "Live token prices icon", title: "Live Token Prices", rank: "A", imgClass: "w-15 aspect-auto md:w-20 saturate-[0.8]" },
  { icon: "/3d-icons/p2p.webp", alt: "P2P transaction icon", title: "P2P Transaction", rank: "S", imgClass: "w-18 aspect-auto md:w-20 saturate-[1.5]" },
  { icon: "/3d-icons/dollar.webp", alt: "Set any balance icon", title: "Set Any Balance", rank: "A", imgClass: "w-14 h-14 md:w-16 md:h-16 saturate-[0.8]" },
  { icon: "/3d-icons/user.webp", alt: "No sign up icon", title: "Private by Default", rank: "B", imgClass: "w-14 h-14 md:w-16 md:h-16 saturate-[0.8]" },
  { icon: "/3d-icons/download.webp", alt: "Nothing to download icon", title: "Instant Web App", rank: "B", imgClass: "w-14 h-14 md:w-16 md:h-16 saturate-[0.8]" },
] as const;

const RANK_STYLES: Record<string, { color: string; border: string; glow: string }> = {
  S: { color: "#fde047", border: "rgba(253,224,71,0.5)", glow: "rgba(253,224,71,0.3)" },
  A: { color: "#c084fc", border: "rgba(192,132,252,0.5)", glow: "rgba(139,92,246,0.35)" },
  B: { color: "#a8b6d8", border: "rgba(148,163,184,0.45)", glow: "rgba(148,163,184,0.25)" },
};

function Corners({ className = "" }: { className?: string }) {
  return (
    <>
      <span className={`sl-corner left-0 top-0 border-l-2 border-t-2 ${className}`} />
      <span className={`sl-corner right-0 top-0 border-r-2 border-t-2 ${className}`} />
      <span className={`sl-corner bottom-0 left-0 border-b-2 border-l-2 ${className}`} />
      <span className={`sl-corner bottom-0 right-0 border-b-2 border-r-2 ${className}`} />
    </>
  );
}

function RankChip({ rank }: { rank: string }) {
  const style = RANK_STYLES[rank] ?? RANK_STYLES.B;
  return (
    <span
      className="absolute right-3 top-3 z-20 flex size-7 items-center justify-center rounded-[4px] sl-font text-[13px] font-bold"
      style={{
        color: style.color,
        border: `1px solid ${style.border}`,
        background: "rgba(8,10,26,0.8)",
        boxShadow: `0 0 12px ${style.glow}`,
        textShadow: `0 0 8px ${style.glow}`,
      }}
    >
      {rank}
    </span>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 sl-font text-[11px] font-bold uppercase tracking-[0.35em] text-[#c084fc] drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
      {children}
    </p>
  );
}

function ProductImageSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % PRODUCT_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative z-0 mt-6 flex w-full flex-col items-center px-2 md:mt-8"
    >
      <div className="relative h-[480px] w-full max-w-[310px] md:h-[640px] md:max-w-[410px]">
        {/* Summoning gate glow + rotating rune rings behind the phone */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6]/15 blur-[80px] md:size-[460px]" />
        <div aria-hidden className="animate-sl-spin pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[340px] rounded-full border border-dashed border-[#a78bfa]/30 md:size-[540px]" style={{ transform: "translate(-50%, -50%)" }} />
        <div aria-hidden className="animate-sl-spin-rev pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[400px] rounded-full border border-dotted border-[#8b5cf6]/30 md:size-[630px]" style={{ transform: "translate(-50%, -50%)" }} />

        {/* Floating system chips */}
        <div className="sl-window animate-float-8 absolute -left-4 top-16 z-20 hidden rounded-[4px] px-3 py-2 md:-left-36 md:block">
          <Corners />
          <p className="sl-font text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]">
            <span className="animate-sl-flicker mr-1.5 inline-block text-[#fde047]">!</span>Level up!
          </p>
          <p className="mt-0.5 sl-font text-[12px] font-bold text-white drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">+$2,828,041.75</p>
        </div>
        <div className="sl-window animate-float-10 absolute -right-4 bottom-28 z-20 hidden rounded-[4px] px-3 py-2 md:-right-40 md:block">
          <Corners />
          <p className="sl-font text-[10px] font-bold uppercase tracking-[0.2em] text-[#c4b5fd]">Skill activated</p>
          <p className="mt-0.5 sl-font text-[12px] font-bold text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">Stealth Mode</p>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 flex h-full w-full"
          >
            <Image
              src={getAssetUrl(PRODUCT_IMAGES[currentIndex].src)}
              alt={PRODUCT_IMAGES[currentIndex].alt}
              width={410}
              height={852}
              priority={currentIndex === 0}
              sizes="(min-width: 768px) 410px, 310px"
              className="h-full w-full object-contain drop-shadow-[0_24px_60px_rgba(124,58,237,0.3)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LandingContent() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return true;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fadeInUp: any = {
    initial: isMobile ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  };

  const staggerContainer: any = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: isMobile ? 0 : 0.02,
      },
    },
    viewport: { once: true },
  };

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const demoEnabled = isDemoFeatureEnabled();

  const handleCheckout = async (plan: any) => {
    trackEvent("pricing_buy_clicked", {
      plan: plan.id,
      price: plan.price,
      source: "landing_pricing",
      landing_copy_variant: "control",
    });
    window.dispatchEvent(new Event("rp-wallet:checkout-started"));
    trackEvent("checkout_started", {
      plan: plan.id,
      price: plan.price,
      source: "landing_pricing",
      landing_copy_variant: "control",
      provider: "nowpayments",
    });

    router.push(`/buy?plan=${encodeURIComponent(plan.id)}&checkout=1`);
  };

  return (
    <div className="relative w-full overflow-visible pb-12 pt-2 md:pb-0">
      {/* Holographic grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,139,250,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, black 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 95%)",
        }}
      />

      <motion.section
        initial={isMobile ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center px-4 py-2 md:py-6"
      >
        {/* Mana particles */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-24 overflow-hidden">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="sl-particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* System notification badge */}
        <motion.div
          initial={isMobile ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="sl-window relative z-10 rounded-[4px]"
        >
          <Corners />
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4px]">
            <div className="sl-scanline" />
          </div>
          <div className="relative z-10 flex items-center gap-2 whitespace-nowrap px-3 py-2 sl-font text-[9px] font-bold uppercase tracking-[0.12em] text-[#cbb8ff] md:px-4 md:text-[11px] md:tracking-[0.22em]">
            {/* <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c084fc] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c084fc]"></span>
            </span> */}
            <span className="text-[#c084fc] drop-shadow-[0_0_8px_rgba(192,132,252,0.7)]">[ System ]</span>
            <span>Used by 800+ creators &amp; larpers</span>
          </div>
        </motion.div>

        <div className="relative z-10 mt-5 flex flex-col items-center md:mt-7">
          <motion.p
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 whitespace-nowrap sl-font text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/80 md:text-[12px] md:tracking-[0.4em]"
          >
            ✦ New quest available: daily flex ✦
          </motion.p>
          <motion.h1
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display max-w-5xl text-center text-[2.5rem] font-bold leading-none tracking-tight md:text-6xl lg:text-7xl"
          >
            <>
              The #1{" "}
              <span className="bg-gradient-to-r from-[#e9d5ff] via-[#c084fc] to-[#8b5cf6] bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(139,92,246,0.45)]">
                LARP crypto wallet app.
              </span>
            </>
          </motion.h1>
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="my-4 flex max-w-3xl flex-col gap-2 text-center text-base font-medium leading-relaxed text-ph4ntom-light/80 md:my-8 md:text-xl"
          >
            <p>
              Set any balance, import any token, simulate transactions, push notifications in pixel-perfect copies of Phantom &amp; Trust Wallet. Create content online or prank your friends - no real crypto involved.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 mt-2 flex w-full flex-col items-center justify-center md:mt-0"
        >
          <HeroButtons onOpenDemo={() => setIsDemoModalOpen(true)} />
        </motion.div>

        <ProductImageSwiper />
      </motion.section>

      <section className="relative mx-auto max-w-[1000px] overflow-hidden px-6 py-12">
        <div className="mb-10 text-center md:mb-14">
          <SectionEyebrow>[ Skill tree unlocked ]</SectionEyebrow>
          <h2 className="font-display mb-2 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Built to be
            <br />
            <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">indistinguishable.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base font-medium leading-relaxed text-white/60 md:text-lg">
            Set any balance, add any token, get the perfect LARP experience you can get.
          </p>
        </div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="relative mx-auto grid max-w-3xl grid-cols-2 gap-4 md:gap-6">
          {SKILLS.map((skill) => (
            <motion.div
              key={skill.title}
              variants={fadeInUp}
              className="sl-window group/skill relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[6px] p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(167,139,250,0.25)] md:p-8"
            >
              <Corners />
              <div className="sl-scanline" />
              <RankChip rank={skill.rank} />
              {/* Hover shine sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#c084fc]/10 to-transparent transition-transform duration-1000 ease-out group-hover/skill:translate-x-full" />

              <Image
                src={getAssetUrl(skill.icon)}
                alt={skill.alt}
                width={64}
                height={64}
                className={`relative z-10 object-contain transition-transform duration-300 group-hover/skill:scale-110 ${skill.imgClass}`}
              />
              <h3 className="relative z-10 text-sm font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] md:text-base">{skill.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {!demoEnabled && (
        <section id="installation" className="relative mx-auto max-w-[1000px] scroll-mt-6 px-6 pb-12">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="sl-window relative flex flex-col items-center rounded-[8px] p-8 pt-10 text-center md:p-12"
          >
            <span className="sl-label">Quest info</span>
            <Corners />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8px]">
              <div className="sl-scanline" />
            </div>
            {/* Inner mana glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6]/10 blur-[120px] md:h-[600px] md:w-[600px]" />

            <div className="relative z-10 flex w-full flex-col items-center">
              <p className="mb-3 sl-font text-[11px] font-bold uppercase tracking-[0.35em] text-[#fde047]">
                <span className="animate-sl-flicker mr-2 inline-block">!</span>New quest arrived
              </p>
              <h2 className="font-display mb-10 text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
                How to <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">get access.</span>
              </h2>

              <div className="relative mx-auto mb-8 flex w-full max-w-sm flex-col gap-8 text-left md:max-w-3xl md:flex-row md:gap-6 md:text-center">
                <div className="relative flex flex-row items-start gap-5 md:flex-1 md:flex-col md:items-center">
                  <div className="absolute left-[10px] top-[32px] z-0 h-[calc(100%-8px)] w-[4px] md:hidden" style={{ backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.4) 2px, transparent 2px)", backgroundSize: "100% 12px" }} />
                  <div className="absolute left-[calc(50%+20px)] top-[10px] z-0 hidden h-[4px] w-[calc(100%-40px)] md:block" style={{ backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.4) 2px, transparent 2px)", backgroundSize: "12px 100%" }} />
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl">
                    <Image src={getAssetUrl("/3d-icons/Shopping Cart Icon.webp")} alt="Purchase" width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <p className="mb-1 sl-font text-[10px] font-bold uppercase tracking-[0.3em] text-[#c084fc]/70">Objective 01</p>
                    <h4 className="mb-1 text-[16px] font-semibold text-white">Purchase a License</h4>
                    <p className="text-[14px] leading-snug text-white/50">Grab RPWallet in the Pricing section below. Choose the plan that works for you, no hidden fees.</p>
                  </div>
                </div>

                <div className="relative flex flex-row items-start gap-5 md:flex-1 md:flex-col md:items-center">
                  <div className="absolute left-[10px] top-[32px] z-0 h-[calc(100%-8px)] w-[4px] md:hidden" style={{ backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.4) 2px, transparent 2px)", backgroundSize: "100% 12px" }} />
                  <div className="absolute left-[calc(50%+20px)] top-[10px] z-0 hidden h-[4px] w-[calc(100%-40px)] md:block" style={{ backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.4) 2px, transparent 2px)", backgroundSize: "12px 100%" }} />
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl brightness-[0.7] saturate-[2]">
                    <Image src={getAssetUrl("/3d-icons/Key Icon.webp")} alt="License key" width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <p className="mb-1 sl-font text-[10px] font-bold uppercase tracking-[0.3em] text-[#c084fc]/70">Objective 02</p>
                    <h4 className="mb-1 text-[16px] font-semibold text-white">Receive Your Key</h4>
                    <p className="text-[14px] leading-snug text-white/50">After payment, you&apos;ll receive a unique license key in your email. Keep it safe.</p>
                  </div>
                </div>

                <div className="relative flex flex-row items-start gap-5 md:flex-1 md:flex-col md:items-center">
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl">
                    <Image src={getAssetUrl("/3d-icons/iPhone Icon.webp")} alt="Install" width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <p className="mb-1 sl-font text-[10px] font-bold uppercase tracking-[0.3em] text-[#c084fc]/70">Objective 03</p>
                    <h4 className="mb-1 text-[16px] font-semibold text-white">Activate, Install &amp; Flex</h4>
                    <p className="text-[14px] leading-snug text-white/50">
                      Enter your license key,{" "}
                      <Link href="/dashboard" className="text-[#c084fc] underline underline-offset-2 transition-colors hover:text-white">
                        install the app
                      </Link>
                      , follow the steps. Time to larp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-2 flex items-center gap-2 rounded-[4px] border border-[#fde047]/30 bg-[#fde047]/5 px-4 py-2 sl-font text-[11px] font-bold uppercase tracking-[0.2em] text-[#fde047]">
                <Zap size={12} className="shrink-0" />
                Reward: Unlimited LARP power
              </div>

              <p className="mt-4 text-center text-[13px] font-medium text-white/60">
                Have any questions? We respond within a few hours, contact us on{" "}
                <a href="https://t.me/RPWallet_support_bot" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-white">
                  telegram
                </a>
                .
              </p>
            </div>
          </motion.div>

          <div className="sl-window relative mx-auto mt-6 flex max-w-[26rem] flex-row items-center justify-between gap-3 overflow-hidden rounded-[6px] p-2 pl-6">
            <Corners />
            <span className="relative z-10 text-[15px] font-medium text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Already have a license key?</span>
            <Link
              href="/dashboard"
              className="sl-btn sl-clip relative z-10 whitespace-nowrap px-7 py-2 text-[15px] font-semibold text-white transition-all hover:scale-105"
            >
              Log In
            </Link>
          </div>
        </section>
      )}

      <section id="vouches" className="relative pb-12 md:pb-20">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="mb-8 px-6 text-center md:mb-12"
        >
          <SectionEyebrow>[ Hunter records ]</SectionEyebrow>
          <h2 className="font-display mb-2 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Don&apos;t take our word.
            <br />
            <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">Take theirs.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-white/60 md:text-lg">
            Vouches straight from our Telegram support chats.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="relative"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
            maskImage: "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
          }}
        >
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:gap-5 md:px-[max(1.5rem,calc((100vw-1200px)/2))]">
            {VOUCHES.map((vouch) => (
              <motion.div
                key={vouch.src}
                variants={fadeInUp}
                className="sl-window relative w-[240px] shrink-0 snap-center overflow-hidden rounded-[8px] p-2.5 md:w-[280px]"
              >
                <Corners className="!border-[#a78bfa]/40" />

                <div className="relative z-10 overflow-hidden rounded-[5px] border border-[#a78bfa]/20">
                  <Image
                    src={getAssetUrl(vouch.src)}
                    alt={`Telegram vouch from ${vouch.name}`}
                    width={480}
                    height={1044}
                    loading="lazy"
                    sizes="(min-width: 768px) 280px, 240px"
                    className="h-auto w-full object-cover"
                  />
                </div>

                <div className="relative z-10 flex items-center gap-2.5 px-2 pb-1 pt-2.5">
                  <span className="text-[13px] font-medium text-white/90">{vouch.name}</span>
                  <span className="ml-auto flex items-center gap-1.5 sl-font text-[10px] font-medium uppercase tracking-[0.15em] text-[#c084fc]/70">
                    <span className="flex size-3.5 items-center justify-center rounded-full bg-ph4ntom-green">
                      <Check size={9} strokeWidth={3.5} className="text-white" />
                    </span>
                    Verified
                  </span>
                </div>
              </motion.div>
            ))}

            {/* View More CTA Card */}
            <motion.a
              href="https://t.me/rpwalletTG"
              target="_blank"
              rel="noopener noreferrer"
              variants={fadeInUp}
              className="sl-window group relative flex w-[240px] shrink-0 cursor-pointer snap-center flex-col items-center justify-center gap-4 overflow-hidden rounded-[8px] p-2.5 transition-all hover:scale-[1.02] md:w-[280px]"
              style={{ minHeight: "320px" }}
            >
              <Corners />
              <div className="sl-scanline" />

              <div
                className="flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, rgba(0,136,204,0.9) 0%, rgba(0,172,238,0.95) 100%)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 12px rgba(0,136,204,0.4)",
                }}
              >
                <Send size={22} strokeWidth={2} className="text-white" />
              </div>
              <div className="px-4 text-center">
                <p className="mb-1 text-[15px] font-semibold text-white/90">View More Vouches</p>
                <p className="text-[12px] leading-relaxed text-white/50">Join our Telegram to see hundreds more reviews from real users</p>
              </div>
              <div
                className="sl-clip flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white transition-all group-hover:gap-3"
                style={{
                  background: "linear-gradient(135deg, rgba(0,136,204,0.8) 0%, rgba(0,172,238,0.85) 100%)",
                  boxShadow: "0 2px 8px rgba(0,136,204,0.3)",
                }}
              >
                Join Telegram
                <ArrowRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </motion.a>
          </div>
        </motion.div>
      </section>

      <section id="pricing" className="relative mx-auto max-w-[1200px] px-6 pb-12 md:pb-24">
        <div className="mb-10 text-center">
          {demoEnabled ? (
            <>
              <SectionEyebrow>[ Select your rank ]</SectionEyebrow>
              <h2 className="font-display mb-3 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                <>Try it for free.<br />Pay when you&apos;re ready.</>
              </h2>
            </>
          ) : (
            <>
              <SectionEyebrow>[ Select your rank ]</SectionEyebrow>
              <h2 className="font-display mb-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Choose your <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">power.</span>
              </h2>
              <p className="mx-auto max-w-md text-base font-medium leading-relaxed text-white/60 md:text-lg">
                Crypto-only payments with secure checkout powered by NOWPayments.
              </p>
            </>
          )}
        </div>

        {demoEnabled && (
          <div className="sl-window relative mx-auto mb-12 max-w-[860px] rounded-[8px] p-8 pt-10 text-center md:p-10">
            <span className="sl-label">Free trial</span>
            <Corners />
            <h3 className="font-display text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Try the wallet before buying.
            </h3>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] font-medium leading-relaxed text-white/55 md:text-[17px]">
              Real prices, every screen, any balance upto $500 for {process.env.NEXT_PUBLIC_DEMO_DURATION_MINUTES || 5} minutes. No sign-up, no card. Just open it.
            </p>
            <Link
              href="/dashboard"
              className="sl-btn mx-auto mt-8 inline-flex h-12 min-w-[210px] items-center justify-center gap-2 px-7 text-[16px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Open App <ArrowUpRight size={20} />
            </Link>
          </div>
        )}

        {demoEnabled && (
          <p className="mb-6 text-center text-[16px] font-semibold text-white/35">
            Want unlimited access?
          </p>
        )}

        <div className="relative grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {Object.values(PRICING_PLANS).map((plan) => {
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";
            const displayPrice = plan.price;
            const showOriginalPrice = Boolean(isYearly && plan.originalPrice);

            const rankLabel = isStarter ? "C-Rank Hunter" : isPopular ? "A-Rank Hunter" : "S-Rank Monarch";
            const rankColor = isStarter ? "#a8b6d8" : isPopular ? "#c084fc" : "#fde047";

            const bgGradient = isPopular
              ? "linear-gradient(180deg, rgba(139,92,246,0.16) 0%, rgba(8,10,26,0.92) 55%)"
              : isYearly
                ? "linear-gradient(180deg, rgba(253,224,71,0.12) 0%, rgba(8,10,26,0.92) 55%)"
                : "linear-gradient(180deg, rgba(59,130,246,0.12) 0%, rgba(8,10,26,0.92) 55%)";

            const borderColor = isPopular
              ? "rgba(139,92,246,0.45)"
              : isYearly
                ? "rgba(253,224,71,0.45)"
                : "rgba(167,139,250,0.3)";

            const glowShadow = isPopular
              ? "0 0 40px rgba(139,92,246,0.2)"
              : isYearly
                ? "0 0 40px rgba(253,224,71,0.22)"
                : "0 0 32px rgba(59,130,246,0.12)";

            return (
              <div
                key={plan.id}
                className="group/plan relative flex cursor-pointer flex-col rounded-[8px] p-10 outline-none backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]"
                onClick={() => handleCheckout(plan)}
                style={{
                  background: bgGradient,
                  border: `1px solid ${borderColor}`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(148,197,253,0.15)",
                    "inset 0 0 48px rgba(59,130,246,0.04)",
                    "0 4px 24px rgba(0,0,0,0.25)",
                    glowShadow,
                  ].join(", "),
                }}
              >
                <Corners className={isYearly ? "!border-[#fde047]/60" : isPopular ? "!border-[#c4b5fd]/60" : ""} />

                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[4px] border border-[#c4b5fd]/50 bg-[#8b5cf6] px-4 py-1.5 sl-font text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] px-3 py-1 sl-font text-[10px] font-bold uppercase tracking-[0.25em] text-black shadow-[0_5px_15px_rgba(212,175,55,0.4)]">
                    Best Value
                  </div>
                )}

                <div className="relative z-10 mb-4 mt-2 flex flex-col items-center gap-1.5 text-center">
                  <span
                    className="sl-font text-[11px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: rankColor, textShadow: `0 0 12px ${rankColor}66` }}
                  >
                    {rankLabel}
                  </span>
                  <span className="text-lg font-medium text-white/80">{isStarter ? "7 Days Access" : isPopular ? "1 Month Access" : "1 Year Access"}</span>
                </div>

                <div className="relative z-10 mb-6 flex min-h-[60px] flex-col items-center justify-start transition-all duration-300">
                  <div className="flex items-baseline justify-center gap-1">
                    {showOriginalPrice && <span className="font-display relative mr-1.5 text-2xl font-medium text-white/40 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500 md:text-3xl">{plan.originalPrice}</span>}
                    <span className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl">{displayPrice}</span>
                  </div>
                </div>

                <ul className="relative z-10 mb-12 flex flex-grow flex-col gap-6 text-[15px] text-white/70">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className={`flex items-start gap-3 ${!feat.included ? "opacity-35" : ""}`}>
                      {feat.included ? (
                        <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${isYearly ? "bg-gradient-to-br from-[#fde047] to-[#ca8a04]" : isPopular ? "bg-[#9c8df6]" : "bg-[#8b5cf6]"}`}>
                          <Check size={13} strokeWidth={3} className={isYearly ? "text-black" : "text-white"} />
                        </div>
                      ) : (
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <X size={12} strokeWidth={2.5} className="text-white/60" />
                        </div>
                      )}
                      <span className={feat.included ? "text-white/90" : "text-white/50 line-through decoration-white/20"}>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(plan);
                  }}
                  className={`sl-btn relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 py-4 font-semibold transition-all hover:scale-[1.02] ${isYearly ? "sl-btn-gold text-black" : isPopular ? "text-white" : "sl-btn-ghost text-white"}`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Access <ArrowRight size={18} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-[760px] px-6 pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#8b5cf6]/5 blur-[120px]" />

        <div className="mb-10 text-center md:mb-14">
          <SectionEyebrow>[ System archive ]</SectionEyebrow>
          <h2 className="font-display mb-2 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Frequently Asked <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">Questions.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-white/60 md:text-lg">
            Everything you need to know about RPWallet.
          </p>
        </div>

        <div className="sl-window relative z-10 mx-auto flex max-w-2xl flex-col rounded-[8px] p-6 pt-8 md:p-10">
          <span className="sl-label">Info</span>
          <Corners />

          {[
            ...homepageFaq.map((item) => ({ q: item.question, a: item.answer })),
            {
              q: "How fast can I set it up?",
              a: "After purchase, install the app, enter your license key, and follow the setup steps. Most users can start building a wallet scene in seconds.",
            },
            {
              q: "How do P2P simulated transactions work?",
              a: "Send simulated crypto to another RPWallet user. Their app can show a push notification, updated balance, and new transaction record, without moving any real crypto.",
            },
            {
              q: "Can I customize tokens and balances?",
              a: "Yes. You can set balances, add tokens or memecoins, edit wallet details, and create transaction activity that fits the scene you want to capture.",
            },
            {
              q: "Does it work on iPhone and Android?",
              a: "Yes. RPWallet installs as a Progressive Web App from your browser, so you can add it to your home screen without using the App Store or Play Store.",
            },
            {
              q: "What wallets can I simulate?",
              a: "RPWallet includes realistic Phantom-style and Trust-style mobile experiences, with live-looking balances, token pages, activity, and wallet flows.",
            },
            {
              q: "How do I get my license key?",
              a: "Your license key is delivered after checkout. Use it in the dashboard to activate your access and launch the wallet apps included with your plan.",
            },
            {
              q: "What if I need help?",
              a: "You can contact support on Telegram any time. Monthly and yearly plans include priority Telegram support.",
            },
          ].map((item, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                className="group relative cursor-pointer select-none border-b border-[#a78bfa]/10 py-5 text-left transition-all duration-300 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`relative z-10 text-base font-medium transition-colors duration-300 md:text-[17px] ${isOpen ? "text-[#c084fc]" : "text-white group-hover:text-[#c084fc]/80"}`}>
                    {item.q}
                  </h3>
                  <div className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-[#a78bfa]/15 bg-white/[0.02] transition-all duration-300 group-hover:bg-white/[0.06] ${isOpen ? "rotate-180 border-[#c084fc]/40 bg-[#c084fc]/10" : ""}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${isOpen ? "text-[#c084fc]" : "text-white/40"}`}>
                      <path d="m1 1 4 4 4-4" />
                    </svg>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="relative z-10 pb-1 pr-8 pt-3.5 text-[14px] font-medium leading-relaxed text-white/50">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-[980px] px-6 pb-14">
        <div className="sl-window relative overflow-hidden rounded-[8px] p-6 text-center md:p-8">
          <Corners className="!border-[#a78bfa]/30" />
          <p className="relative z-10 mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-white/35">
            RPWallet is built for people searching for a fake crypto wallet app, crypto wallet simulator, fake Phantom wallet, fake Phantom wallet balance, LARP wallet app, fake crypto wallet screen, fake crypto wallet screenshot, Phantom LARP wallet, Trust simulator, fake crypto balance, crypto LARP app, and realistic wallet app for entertainment, demos, pranks, and creator content.
          </p>
          <div className="relative z-10 mt-5 flex flex-wrap justify-center gap-2">
            {[
              "fake crypto wallet app",
              "crypto wallet simulator",
              "fake Phantom wallet",
              "fake Phantom wallet balance",
              "LARP wallet app",
              "fake crypto wallet screen",
              "Trust simulator",
              "crypto LARP app",
            ].map((term) => (
              <span
                key={term}
                className="relative overflow-hidden rounded-[4px] border border-[#a78bfa]/15 bg-[#a78bfa]/[0.04] px-3 py-1.5 sl-font text-[11px] font-medium text-white/40"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      </section>
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}
