"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useRef, useEffect } from "react";
import { getAssetUrl } from "@/lib/utils";
import HeroButtons from "./hero-buttons";
import dynamic from "next/dynamic";
const DemoModal = dynamic(() => import("./demo-modal"), { ssr: false });

import { trackEvent } from "@/lib/track";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { isDemoFeatureEnabled } from "@/lib/demo-config";

const HeroMockups = dynamic(() => import("./hero-mockups").then((mod) => mod.HeroMockups), {
  ssr: false,
});


export default function LandingContent() {
  const USE_NEW_MOBILE_LOOP = false;
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


  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [phase, setPhase] = useState<"text" | "video">("text");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const oldVideoRef = useRef<HTMLVideoElement>(null);
  const [oldVideoSrc] = useState<string>(() => getAssetUrl("/video/product_loop.mp4"));

  type Slide = {
    text: string;
    video?: string;
    image?: string;
  };

  const MOCKUP_SLIDES: Slide[] = [
    { video: "/video/edit-balance.mp4", text: "Set any balance. Real-time prices." },
    { video: "/video/send-token.mp4", text: "Fake sends that look 100% real." },
    { video: "/video/swap-token.mp4", text: "Flawless 1:1 swap animations." },
    { image: "/logo_white.webp", text: "LARP, Prank & Create Content" },
  ];

  useEffect(() => {
    if (!USE_NEW_MOBILE_LOOP) return;
    if (phase === "text") {
      const timer = setTimeout(() => {
        setPhase("video");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, activeSlide, USE_NEW_MOBILE_LOOP]);

  useEffect(() => {
    if (!USE_NEW_MOBILE_LOOP) return;
    const currentSlide = MOCKUP_SLIDES[activeSlide];

    if (phase === "video") {
      if (currentSlide.video) {
        videoRefs.current.forEach((vid, idx) => {
          if (vid) {
            if (idx === activeSlide) {
              vid.currentTime = 0;
              const playPromise = vid.play();
              if (playPromise !== undefined) {
                playPromise.catch((e) => console.log("Play interrupted:", e));
              }
            } else {
              vid.pause();
            }
          }
        });
      } else {
        videoRefs.current.forEach((vid) => vid?.pause());
        const timer = setTimeout(() => {
          setActiveSlide((prev) => (prev + 1) % MOCKUP_SLIDES.length);
          setPhase("text");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSlide, phase, USE_NEW_MOBILE_LOOP]);

  const handleVideoEnded = (index: number) => {
    if (!USE_NEW_MOBILE_LOOP) return;
    if (index === activeSlide && phase === "video") {
      setActiveSlide((prev) => (prev + 1) % MOCKUP_SLIDES.length);
      setPhase("text");
    }
  };
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  // SellAuth logic moved to /buy page
  const shopId = Number(process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || 234704);
  const demoEnabled = isDemoFeatureEnabled();

  const compactSteps = [
    {
      title: "Purchase a License",
      desc: "Grab LarperWallet in the Pricing section below. Choose the plan that works for you, no hidden fees.",
    },
    {
      title: "Receive Your Key",
      desc: "After payment, you'll receive a unique license key in your email. Keep it safe.",
    },
    {
      title: "Activate & Flex",
      desc: (
        <>
          <Link href="/dashboard" className="text-[#ab9ff2] hover:text-white underline underline-offset-2 transition-colors">
            Install the app
          </Link>
          , enter your license key, and start customizing your dream portfolio. Time to larp.
        </>
      ),
    },
  ];

  return (
    <div className="w-full overflow-visible pb-12 pt-2 md:pb-0">
      <motion.section
        initial={isMobile ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="py-2 md:py-6 flex flex-col items-center px-4 relative"
      >
        <motion.div
          initial={isMobile ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1 md:gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 px-4 pl-2 text-xs md:text-sm font-medium text-phantom-light relative z-10"
        >
          <div className="relative flex h-2 w-2 mx-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-phantom-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-phantom-green"></span>
          </div>
          Now available on iOS & Android
        </motion.div>

        <div className="relative z-10 flex flex-col items-center mt-4 md:mt-6">
          <motion.h1
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-[2.6rem] md:text-6xl lg:text-7xl font-medium tracking-tight text-center max-w-5xl leading-none"
          >
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-phantom-purple to-phantom-accent">the flex.</span>
          </motion.h1>
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-phantom-light/80 text-base md:text-xl text-center max-w-3xl my-4 md:my-8 font-base leading-relaxed flex flex-col gap-2"
          >
            <span className="text-white/90 font-semibold">The #1 Fake Crypto Wallet App 🥇</span>
            <p>LarperWallet is a fake crypto wallet for entertainment. Display any balance, any token on a pixel-perfect Phantom, Trust (coming soon) wallet interface - no real crypto involved.</p>
          </motion.div>
        </div>

        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full flex flex-col items-center justify-center mt-2 md:mt-0"
        >
          <HeroButtons onOpenDemo={() => setIsDemoModalOpen(true)} />
        </motion.div>

        {/*
        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:hidden relative z-0 w-full flex flex-col items-center justify-center px-2 pointer-events-none mt-4"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[400px] h-64 bg-phantom-purple/20 blur-3xl rounded-full pointer-events-none" />
          <motion.div className="relative z-10 w-full max-w-[280px]">
            <div className="relative mx-auto w-full max-w-[280px] aspect-[715/1496] bg-[#e5e5ea] rounded-[44px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
              <div className="absolute top-[100px] -left-[2px] w-[2px] h-[22px] bg-[#c7c7cc] rounded-l-[1px]"></div>
              <div className="absolute top-[140px] -left-[2px] w-[2px] h-[46px] bg-[#c7c7cc] rounded-l-[1px]"></div>
              <div className="absolute top-[195px] -left-[2px] w-[2px] h-[46px] bg-[#c7c7cc] rounded-l-[1px]"></div>
              <div className="absolute top-[150px] -right-[2px] w-[2px] h-[65px] bg-[#c7c7cc] rounded-r-[1px]"></div>

              <div className="absolute inset-[2px] bg-black rounded-[42px]">
                <div className={`absolute inset-[5px] ${USE_NEW_MOBILE_LOOP ? "bg-[#111111] flex items-center justify-center" : "bg-[#0a0a0c]"} rounded-[38px] overflow-hidden`}>
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[85px] h-[22px] bg-black rounded-full z-20 flex items-center justify-end px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#050505] border border-[#1a1a1a] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute top-0 right-0.5 w-1 h-1 bg-blue-500/20 rounded-full blur-[0.5px]"></div>
                    </div>
                  </div>

                  {USE_NEW_MOBILE_LOOP ? (
                    <>
                      <AnimatePresence mode="wait">
                        {phase === "text" && (
                          <motion.div
                            key={`text-${activeSlide}`}
                            initial={isMobile ? false : { opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 flex items-center justify-center z-10 px-6 text-center"
                          >
                            <h3 className="text-white font-semibold text-xl tracking-tight leading-snug">{MOCKUP_SLIDES[activeSlide].text}</h3>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {MOCKUP_SLIDES.map((slide, index) =>
                        slide.video ? (
                          <video
                            key={slide.video}
                            ref={(el) => {
                              if (el) videoRefs.current[index] = el;
                            }}
                            src={getAssetUrl(slide.video)}
                            muted
                            playsInline
                            onEnded={() => handleVideoEnded(index)}
                            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${index === activeSlide && phase === "video" ? "opacity-100" : "opacity-0"}`}
                          />
                        ) : slide.image ? (
                          <div
                            key={slide.image}
                            className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-1000 ${index === activeSlide && phase === "video" ? "opacity-100" : "opacity-0"}`}
                          >
                            <Image src={getAssetUrl(slide.image)} alt="Logo" width={140} height={140} className="opacity-90 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                          </div>
                        ) : null,
                      )}
                    </>
                  ) : (
                    <video
                      ref={oldVideoRef}
                      src={oldVideoSrc}
                      autoPlay
                      muted
                      playsInline
                      onEnded={() => {
                        setTimeout(() => {
                          if (oldVideoRef.current) {
                            oldVideoRef.current.play().catch((e) => console.log("Play interrupted:", e));
                          }
                        }, 500);
                      }}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={isMobile ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 text-center max-w-[280px] z-10 relative pointer-events-auto"
          >
            <div className="text-white/50 text-[13px] md:text-sm italic font-medium leading-relaxed">
              <span className="translate-y-4">*</span> This video demonstrates the swap action in Phantom interface. If you wish to see the full fake Phantom Wallet demo then{" "}
              <button onClick={() => setIsDemoModalOpen(true)} className="text-[#ab9ff2] hover:text-white underline underline-offset-2 transition-colors inline-block">
                click here
              </button>
              .
            </div>
          </motion.div>
        </motion.div>
        */}

        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:hidden relative z-0 w-full overflow-hidden mt-8 mb-4 pointer-events-none flex flex-col items-center"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <style>{`
            @keyframes marquee-drift {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-drift {
              animation: marquee-drift 75s linear infinite;
            }
          `}</style>
          <div className="flex animate-marquee-drift items-center w-[max-content]">
            {[...Array(2)].map((_, loopIdx) => (
              <div key={loopIdx} className="flex gap-16 items-center shrink-0 pr-16">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <div key={num} className="w-[200px] shrink-0 drop-shadow-2xl">
                    <Image
                      src={getAssetUrl(`/product/ph-${num}.webp`)}
                      alt={`LarperWallet Screenshot ${num}`}
                      width={240}
                      height={500}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        <Suspense fallback={null}>
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <HeroMockups />
          </motion.div>
        </Suspense>
      </motion.section>

      <section className="py-12 px-6 max-w-[1000px] mx-auto relative overflow-hidden">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">
            The real wallet,
            <br />
            <span className="text-[#ab9ff2]">but yours.</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed mt-4">
            Looks real. Feels real. Set any balance on any token and nobody will know.
          </p>
        </div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto relative">
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">Pixel-Perfect 1:1 Copy</h3>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">Live Token Prices</h3>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">Every Screen Works</h3>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">Set Any Balance</h3>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">No Sign Up</h3>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ab9ff2]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">Nothing to Download</h3>
          </motion.div>
        </motion.div>
      </section>

      <section className="pb-12 px-6 max-w-[1000px] mx-auto relative">
        <div className="text-center mb-4 md:mb-14">
          <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">How LarperWallet Works</h2>
        </div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[2.5rem] max-w-2xl mx-auto flex flex-col items-center shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="w-full flex flex-col items-start text-left max-w-md mx-auto gap-8 relative mt-2 mb-10">
            {compactSteps.map((step, index) => (
              <div key={index} className="w-full flex gap-6 relative">
                {index !== compactSteps.length - 1 && <div className="absolute left-[19px] top-[40px] bottom-[-44px] w-[2px] bg-gradient-to-b from-[#ab9ff2] to-transparent opacity-40" />}
                <div className="shrink-0 flex items-start justify-center">
                  <div className="w-10 h-10 rounded-full border-[1.5px] border-[#ab9ff2] bg-transparent flex items-center justify-center text-white font-semibold text-[15px] relative z-10 shadow-[0_0_15px_rgba(171,159,242,0.15)]">
                    {index + 1}
                  </div>
                </div>
                <div className="flex flex-col pt-1">
                  <h3 className="text-white text-[17px] font-semibold mb-2">{step.title}</h3>
                  <div className="text-white/60 text-[14px] leading-relaxed pr-4">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/60 text-[13px] mt-6 font-medium text-center">
            Have any questions? We have 24/7 support,{" "}
            <a href="https://t.me/LarperWallet_support_bot" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">
              click here to contact us
            </a>
            .
          </p>
        </motion.div>
      </section>

      <section id="pricing" className="pb-12 md:pb-24 max-w-[1000px] mx-auto px-6 relative">
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-3">Pricing</h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-xs mx-auto leading-relaxed">Pay securely with crypto, credit card, or debit card.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch relative">
          {Object.values(PRICING_PLANS).map((plan) => {
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";

            const hasEmbedConfig = plan.sellauthProductId && plan.sellauthVariantId && plan.sellauthProductId > 0 && plan.sellauthVariantId > 0;

            return (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                className={`glass-panel p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] ${isPopular
                  ? "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#8b5cf6,transparent)_border-box] shadow-[0_0_40px_rgba(139,92,246,0.15)] z-10"
                  : isYearly
                    ? "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#fde047,transparent)_border-box] shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                    : "bg-[#121212]/80 border border-white/[0.04] hover:bg-[#151515] hover:border-white/[0.08]"
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#8b5cf6] text-white text-[11px] font-bold tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)] whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black text-[11px] font-bold tracking-wider uppercase rounded-full shadow-[0_5px_15px_rgba(212,175,55,0.4)] whitespace-nowrap">
                    Best Value
                  </div>
                )}

                <div className="text-white/80 font-medium text-lg mb-4 text-center">{isStarter ? "7 Days Access" : isPopular ? "1 Month Access" : "1 Year Access"}</div>

                <div className="flex items-baseline justify-center gap-1 mb-10">
                  {plan.originalPrice && <span className="text-2xl md:text-3xl font-display font-medium text-white/40 line-through mr-1">{plan.originalPrice}</span>}
                  <span className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">{plan.price}</span>
                </div>

                <ul className="flex flex-col gap-6 mb-12 flex-grow text-[15px] text-white/70">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className={`flex gap-3 items-start ${!feat.included ? "opacity-35" : ""}`}>
                      {feat.included ? (
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${isYearly ? "bg-gradient-to-br from-[#fde047] to-[#ca8a04]" : "bg-[#9c8df6]"}`}>
                          <Check size={13} strokeWidth={3} className={isYearly ? "text-black" : "text-white"} />
                        </div>
                      ) : (
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 mt-0.5">
                          <X size={12} strokeWidth={2.5} className="text-white/60" />
                        </div>
                      )}
                      <span className={feat.included ? "text-white/90" : "text-white/50 line-through decoration-white/20"}>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/buy"
                  className={`w-full py-4 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 ${isPopular
                    ? "bg-gradient-to-r from-phantom-purple to-phantom-accent text-white hover:scale-[1.02]"
                    : isYearly
                      ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black hover:scale-[1.02] shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                    }`}
                >
                    <>
                      Buy <ArrowRight size={18} />
                    </>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-[26rem] mx-auto bg-white/[0.03] border border-white/[0.05] p-2 pl-6 rounded-full flex flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-sm"
        >
          <span className="text-white/80 text-[15px] font-medium">Already have a license key?</span>
          <Link href="/dashboard" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[15px] font-medium py-2 px-6 rounded-full transition-all hover:scale-105 whitespace-nowrap">
            Log In
          </Link>
        </motion.div>
      </section>

      <section className="pb-12 max-w-[760px] mx-auto px-6 relative">
        <div className="absolute inset-0 bg-phantom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <motion.div {...fadeInUp} className="mb-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-[2.5rem] max-w-2xl mx-auto flex flex-col relative z-10 shadow-xl">
          {[
            {
              q: "Is LarperWallet a real crypto wallet?",
              a: "No. LarperWallet is an entertainment app only — it does not hold, send, receive, or interact with any real crypto assets. No seed phrases or private keys are ever asked for or stored. It is a display app that shows custom balances on a realistic wallet interface.",
            },
            {
              q: "Will it look exactly like the real crypto apps?",
              a: "Yes. Each wallet is designed to be pixel-perfect — identical to the real app on mobile. Prices are pulled live from CoinGecko, the 24-hour chart is interactive, and the send flow screens look and behave like the real thing.",
            },
            {
              q: "Does it work on iPhone and Android?",
              a: "Yes. LarperWallet is a PWA (Progressive Web App) that installs directly to your home screen. Use Safari on iOS or Chrome on Android — no App Store download required.",
            },
            {
              q: "Can I add custom tokens or memecoins?",
              a: "Yes. On the apps, you can add any Solana or Ethereum token by contract address. The app fetches the live price and token image from DexScreener automatically.",
            },
            {
              q: "How do I receive my license key after purchase?",
              a: "Delivery is fully automated. Once your crypto payment is detected on-chain, your unique license key is generated and displayed on the order status page — usually within a few minutes. No manual steps needed.",
            },
            {
              q: "What's the difference between the wallets?",
              a: "All plans include all three wallets: Phantom (Solana-style, supports memecoins), Trust Wallet (multi-chain look), and Ledger (hardware wallet style with BTC/SOL/ETH/TRX/BNB). You can switch between them from your dashboard.",
            },
            {
              q: "Is my payment anonymous?",
              a: "Yes. LarperWallet accepts crypto only — SOL, ETH, BTC, TRX, and USDT. No account, no email, no personal information required. Your license key is all you need.",
            },
          ].map((item, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
                onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                className="py-5 border-b border-white/5 last:border-b-0 text-left cursor-pointer transition-all duration-300 relative group select-none"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`font-medium text-base md:text-[17px] transition-colors duration-300 ${isOpen ? "text-[#ab9ff2]" : "text-white group-hover:text-[#ab9ff2]/80"}`}>
                    {item.q}
                  </h3>
                  <div className={`size-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-white/[0.06] ${isOpen ? "rotate-180 bg-[#ab9ff2]/10 border-[#ab9ff2]/30" : ""}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${isOpen ? "text-[#ab9ff2]" : "text-white/40"}`}>
                      <path d="m1 1 4 4 4-4" />
                    </svg>
                  </div>
                </div>

                <motion.div initial={false} animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <div className="pt-3.5 text-white/50 text-[14px] leading-relaxed font-medium pr-8">{item.a}</div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}
