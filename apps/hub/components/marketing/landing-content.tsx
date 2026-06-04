"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X, Bell, Send, Zap, ShoppingCart, Key, Smartphone, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useRef, useEffect } from "react";
import { getAssetUrl } from "@/lib/utils";
import { homepageFaq } from "@/lib/seo";
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

  const [activeProductIdx, setActiveProductIdx] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveProductIdx((prev) => (prev === 1 ? 2 : 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const VIDEOS = ["/video/phantom_send.mp4", "/video/trust_receive.mp4"];
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

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
  const shopId = Number(process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || 241810);
  const demoEnabled = isDemoFeatureEnabled();


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
            <span className="text-white/90 font-medium">The Best Crypto Wallet Replica App</span>
            LarperWallet is a fake crypto wallet app for entertainment. Edit balance, import any token, simulate swap or send in a realistic Phantom or Trust Wallet interface - No real crypto involved.
            {/* LarperWallet is a crypto wallet simulator made for entertainment. */}
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


        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:hidden relative z-0 w-full flex flex-col items-center justify-center px-2 pointer-events-none mt-4"
        >
          <div className="relative w-full overflow-hidden flex flex-col items-center justify-center px-2">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeVideoIdx}
                initial={{ opacity: 0, x: 150 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -150 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative z-10 w-full max-w-[240px]"
              >
                <div className="relative mx-auto w-full max-w-[240px] aspect-[715/1496] bg-[#e5e5ea] rounded-[44px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
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
                          src={getAssetUrl(VIDEOS[activeVideoIdx])}
                          autoPlay
                          muted
                          playsInline
                          onEnded={() => {
                            setActiveVideoIdx((prev) => (prev + 1) % VIDEOS.length);
                          }}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* <motion.div
          initial={isMobile ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:hidden relative z-0 w-full overflow-hidden mt-8 mb-4 pointer-events-none flex flex-col items-center h-[500px]"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeProductIdx}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-[240px] shrink-0 drop-shadow-2xl"
            >
              <Image
                src={getAssetUrl(`/product/new-product-${activeProductIdx}.webp`)}
                alt={`LarperWallet Screenshot ${activeProductIdx}`}
                width={240}
                height={500}
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div> */}

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

      <section className="py-12 px-6 max-w-[1000px] mx-auto relative">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center text-center shadow-xl relative"
        >
          {/* subtle background glow inside the panel */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-phantom-purple/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Centered Column */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 px-4 text-[11px] font-semibold text-white/80 uppercase tracking-widest mb-6">
              Highlight Feature
            </div> */}

            <h2 className="font-display text-2xl md:text-4xl font-medium tracking-tight text-white mb-4 leading-tight">
              Peer-to-peer <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-phantom-accent">simulated transactions.</span>
            </h2>
            <p className="text-white/60 text-[15px] md:text-[17px] leading-relaxed mb-10 max-w-lg mx-auto">
              Send simulated crypto to another LarperWallet user, their wallet updates.
            </p>

            <div className="relative flex flex-col md:flex-row gap-8 md:gap-6 mb-10 w-full max-w-sm md:max-w-3xl mx-auto text-left md:text-center">
              {/* Vertical line for mobile */}
              <div className="absolute left-[19px] top-[32px] bottom-[-16px] w-[2px] bg-gradient-to-b from-[#ab9ff2]/40 to-transparent md:hidden" />
              {/* Horizontal line for desktop */}
              <div className="hidden md:block absolute top-[19px] left-[50px] right-[50px] h-[2px] bg-gradient-to-r from-[#ab9ff2]/40 via-[#ab9ff2]/20 to-transparent" />

              <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                  <Send size={16} className="text-white/80" />
                </div>
                <div className="flex flex-col pt-2 md:pt-0">
                  <h4 className="text-white font-semibold text-[16px] mb-1">Send</h4>
                  <p className="text-white/50 text-[14px] leading-snug">Enter another LarperWallet user's address, select token and amount.</p>
                </div>
              </div>

              <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                  <Bell size={16} className="text-white/80" />
                </div>
                <div className="flex flex-col pt-2 md:pt-0">
                  <h4 className="text-white font-semibold text-[16px] mb-1">They get notified</h4>
                  <p className="text-white/50 text-[14px] leading-snug">A push notification appears on their device.</p>
                </div>
              </div>

              <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                  <Zap size={16} className="text-white/80" />
                </div>
                <div className="flex flex-col pt-2 md:pt-0">
                  <h4 className="text-white font-semibold text-[16px] mb-1">Wallet updates</h4>
                  <p className="text-white/50 text-[14px] leading-snug">Balance and transaction history update instantly.</p>
                </div>
              </div>
            </div>

            {/* <a
              href="https://t.me/LarperWallet_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3.5 rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-2"
            >
              Join Telegram <ArrowRight size={16} />
            </a> */}
          </div>
        </motion.div>
      </section>

      {/* <section id="features" className="py-12 px-6 max-w-[1040px] mx-auto relative">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-3">
            A full fake crypto wallet app,
            <br />
            <span className="text-[#ab9ff2]">not a screenshot editor.</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            LarperWallet gives you a realistic wallet simulator with editable balances, custom tokens, simulated sends, activity history and much more.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Live wallet simulation",
              body: "Use a full fake crypto wallet app with balances, token lists, wallet names, and activity that behave like a real mobile wallet interface.",
            },
            {
              title: "Phantom and Trust Wallet",
              body: "Show realistic Phantom or Trust Wallet-style screens for content, demos, pranks, screenshots, and short videos.",
            },
            {
              title: "LARP wallet app",
              body: "Run the simulator on iPhone or Android with a PWA that never connects to real wallets, seed phrases, or funds.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeInUp}
              className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 md:p-7 shadow-xl backdrop-blur-md"
            >
              <h3 className="font-medium text-white/90 text-lg mb-3">{item.title}</h3>
              <p className="text-white/55 text-[14px] leading-relaxed font-medium">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section> */}

      <section className="py-12 px-6 max-w-[1000px] mx-auto relative overflow-hidden">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-white mb-2">
            Looks exactly like
            <br />
            <span className="text-[#ab9ff2]">the real thing.</span>
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h3 className="font-medium text-white/90 text-sm md:text-base">100% Private</h3>
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

      {!demoEnabled && (
        <section id="installation" className="pb-12 scroll-mt-6 px-6 max-w-[1000px] mx-auto relative">
          <motion.div

            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center text-center shadow-xl relative"
          >
            {/* subtle background glow inside the panel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-phantom-purple/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Centered Column */}
            <div className="relative z-10 w-full flex flex-col items-center">
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-white mb-4 leading-tight">
                How to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-phantom-accent">get access.</span>
              </h2>
              {/* <p className="text-white/60 text-[15px] md:text-[17px] leading-relaxed mb-10 max-w-lg mx-auto">
              Get set up in less than 2 minutes. No complicated installations.
            </p> */}

              <div className="relative flex flex-col md:flex-row gap-8 md:gap-6 mb-10 w-full max-w-sm md:max-w-3xl mx-auto text-left md:text-center">
                {/* Vertical line for mobile */}
                <div className="absolute left-[19px] top-[32px] bottom-[-16px] w-[2px] bg-gradient-to-b from-[#ab9ff2]/40 to-transparent md:hidden" />
                {/* Horizontal line for desktop */}
                <div className="hidden md:block absolute top-[19px] left-[50px] right-[50px] h-[2px] bg-gradient-to-r from-[#ab9ff2]/40 via-[#ab9ff2]/20 to-transparent" />

                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                    <ShoppingCart size={16} className="text-white/80" />
                  </div>
                  <div className="flex flex-col pt-2 md:pt-0">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Purchase a License</h4>
                    <p className="text-white/50 text-[14px] leading-snug">Grab LarperWallet in the Pricing section below. Choose the plan that works for you, no hidden fees.</p>
                  </div>
                </div>

                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                    <Key size={16} className="text-white/80" />
                  </div>
                  <div className="flex flex-col pt-2 md:pt-0">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Receive Your Key</h4>
                    <p className="text-white/50 text-[14px] leading-snug">After payment, you'll receive a unique license key in your email. Keep it safe.</p>
                  </div>
                </div>

                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="relative z-10 size-10 rounded-full border border-white/10 bg-[#161618] flex items-center justify-center shrink-0 shadow-lg">
                    <Smartphone size={16} className="text-white/80" />
                  </div>
                  <div className="flex flex-col pt-2 md:pt-0">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Activate, Install & Flex</h4>
                    <p className="text-white/50 text-[14px] leading-snug">
                      Enter your license key,{" "}
                      <Link href="/dashboard" className="text-[#ab9ff2] hover:text-white underline underline-offset-2 transition-colors">
                        install the app
                      </Link>
                      , follow the steps and your wallet is ready in seconds.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-white/60 text-[13px] mt-4 font-medium text-center">
                Have any questions? We respond within a few hours, contact us on{" "}
                <a href="https://t.me/LarperWallet_bot" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">
                  telegram
                </a>
                {" "}or reach out to us at{" "}
                <a href="mailto:support@larperwallet.com" className="underline underline-offset-2 hover:text-white transition-colors">
                  support@larperwallet.com
                </a>
                .
              </p>
            </div>
          </motion.div>
          <div
            className="mt-6 max-w-[26rem] mx-auto bg-white/[0.03] border border-white/[0.05] p-2 pl-6 rounded-full flex flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-sm"
          >
            <span className="text-white/80 text-[15px] font-medium">Already have a license key?</span>
            <Link href="/dashboard" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[15px] font-medium py-2 px-6 rounded-full transition-all hover:scale-105 whitespace-nowrap">
              Log In
            </Link>
          </div>
        </section>
      )}

      <section id="pricing" className="pb-12 md:pb-24 max-w-[1200px] mx-auto px-6 relative">
        <div className="text-center mb-10">
          {demoEnabled ? (
            <>
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.28em] text-[#ab9ff2]">Pricing</p>
              <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-3 leading-tight">
                Try it for free.<br />Pay when you&apos;re ready.
              </h2>
              {/* <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                Open a timed demo session first. Upgrade only when you want unlimited wallet access.
              </p> */}
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-3">Pricing</h2>
              <p className="text-white/60 text-base md:text-lg font-medium max-w-xs mx-auto leading-relaxed">Pay securely with crypto, credit or debit cards.</p>
            </>
          )}
        </div>

        {demoEnabled && (
          <div className="mx-auto mb-12 max-w-[860px] rounded-[2rem] border border-[#ab9ff2]/30 bg-[#161618]/90 p-8 text-center shadow-[0_0_50px_rgba(171,159,242,0.12)] md:p-10">
            <div className="mx-auto mb-6 inline-flex rounded-full bg-[#ab9ff2]/10 px-4 py-1.5 text-[12px] font-bold uppercase text-[#c9c1ff]">
              Free Trial
            </div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Try the wallet before buying.
            </h3>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] font-medium leading-relaxed text-white/55 md:text-[17px]">
              Real prices, every screen, any balance upto $500 for {process.env.NEXT_PUBLIC_DEMO_DURATION_MINUTES || 3} minutes. No sign-up, no card. Just open it.
            </p>
            <Link
              href="/dashboard"
              className="mx-auto mt-8 inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-2xl bg-[#ab9ff2] px-7 text-[16px] font-medium text-[#0f0f10] transition-all hover:scale-[1.02] hover:bg-[#b9aff6] active:scale-[0.98]"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch relative">
          {Object.values(PRICING_PLANS).map((plan) => {
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";

            const hasEmbedConfig = plan.sellauthProductId && plan.sellauthVariantId && plan.sellauthProductId > 0 && plan.sellauthVariantId > 0;

            return (
              <div
                key={plan.id}
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
                  {plan.originalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500">{plan.originalPrice}</span>}
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
                  href={`/buy?plan=${plan.id}`}
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
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-12 max-w-[760px] mx-auto px-6 relative">
        <div className="absolute inset-0 bg-phantom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-2">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-phantom-accent">Questions.</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed mt-4">
            Everything you need to know about LarperWallet.
          </p>
        </div>

        <div className="glass-panel backdrop-blur-md bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-[2.5rem] max-w-2xl mx-auto flex flex-col relative z-10 shadow-xl">
          {[
            ...homepageFaq.map((item) => ({ q: item.question, a: item.answer })),
            {
              q: "How fast can I set it up?",
              a: "After purchase, install the app, enter your license key, and follow the setup steps. Most users can start building a wallet scene in seconds.",
            },
            {
              q: "How do P2P simulated transactions work?",
              a: "Send simulated crypto to another LarperWallet user. Their app can show a push notification, updated balance, and new transaction record, without moving any real crypto.",
            },
            {
              q: "Can I customize tokens and balances?",
              a: "Yes. You can set balances, add tokens or memecoins, edit wallet details, and create transaction activity that fits the scene you want to capture.",
            },
            {
              q: "Does it work on iPhone and Android?",
              a: "Yes. LarperWallet installs as a Progressive Web App from your browser, so you can add it to your home screen without using the App Store or Play Store.",
            },
            {
              q: "What wallets can I simulate?",
              a: "LarperWallet includes realistic Phantom-style and Trust Wallet-style mobile experiences, with live-looking balances, token pages, activity, and wallet flows.",
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

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="pt-3.5 text-white/50 text-[14px] leading-relaxed font-medium pr-8 pb-1">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-14 px-6 max-w-[980px] mx-auto relative">
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.015] p-6 md:p-8 text-center">
          <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-white/35">
            LarperWallet is built for people searching for a fake crypto wallet app, crypto wallet simulator, fake Phantom wallet, fake Phantom wallet balance, LARP wallet app, fake crypto wallet screen, fake crypto wallet screenshot, Phantom LARP wallet, Trust Wallet simulator, fake crypto balance, crypto LARP app, and realistic wallet app for entertainment, demos, pranks, and creator content.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              "fake crypto wallet app",
              "crypto wallet simulator",
              "fake Phantom wallet",
              "fake Phantom wallet balance",
              "LARP wallet app",
              "fake crypto wallet screen",
              "Trust Wallet simulator",
              "crypto LARP app",
            ].map((term) => (
              <span
                key={term}
                className="rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-white/35"
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
