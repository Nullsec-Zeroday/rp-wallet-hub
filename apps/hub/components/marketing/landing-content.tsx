"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X, Bell, Send, Zap, ShoppingCart, Key, Smartphone, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
              className="h-full w-full object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.48)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


export default function LandingContent() {
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

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  type CheckoutPhase = "idle" | "preparing" | "opening" | "error";
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSlowCheckout, setIsSlowCheckout] = useState(false);

  const checkoutLocked = checkoutPhase === "preparing" || checkoutPhase === "opening";

  useEffect(() => {
    const resetReturnedCheckout = () => {
      setCheckoutError("");
      setCheckoutPhase("idle");
      setIsSlowCheckout(false);
      setSelectedPlanId(null);
    };
    window.addEventListener("pageshow", resetReturnedCheckout);
    return () => window.removeEventListener("pageshow", resetReturnedCheckout);
  }, []);

  const handleCheckout = async (plan: any) => {
    if (checkoutLocked) return;
    setSelectedPlanId(plan.id);

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
    setCheckoutError("");
    setIsSlowCheckout(false);
    setCheckoutPhase("opening");
    window.location.href = `/buy?plan=${encodeURIComponent(plan.id)}&checkout=1`;
  };

  return (
    <div className="w-full overflow-visible pb-12 pt-2 md:pb-0">
      <motion.section
        initial={isMobile ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="py-2 md:py-6 flex flex-col items-center px-4 relative"
      >
        {/* 3D Badge with spinning border shine */}
        <motion.div
          initial={isMobile ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 group/badge"
        >
          {/* Glow behind badge */}
          {/* <div className="absolute inset-0 rounded-full z-0 blur-lg opacity-20 group-hover/badge:opacity-40 transition-opacity duration-500 bg-ph4ntom-purple" /> */}

          <div
            className="relative z-10 flex items-center gap-1 md:gap-2 rounded-full py-1.5 px-4 pl-2 text-xs md:text-sm font-medium text-ph4ntom-light"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.05) 100%)",
              boxShadow: [
                // "inset 0 1px 0 rgba(255,255,255,0.15)",
                "inset 0 -1px 2px rgba(0,0,0,0.25)",
                "0 1px 0 0 rgba(0,0,0,0.4)",
                "0 2px 0 0 rgba(0,0,0,0.2)",
                "0 4px 12px rgba(0,0,0,0.3)",
                "0 1px 8px rgba(124,58,237,0.15)",
              ].join(", "),
            }}
          >
            {/* Top highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] rounded-full bg-black/20" />

            <div className="relative flex h-2 w-2 mx-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ph4ntom-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ph4ntom-green"></span>
            </div>
            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Used by 150+ LARPers and Creators</span>
          </div>

          {/* <style jsx global>{`
            @property --badge-shine-angle {
              syntax: "<angle>";
              initial-value: 0deg;
              inherits: false;
            }
            @keyframes badge-border-spin {
              to {
                --badge-shine-angle: 360deg;
              }
            }
          `}</style> */}
        </motion.div>

        <div className="relative z-10 flex flex-col items-center mt-4 md:mt-6">
          <motion.h1
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-[2.5rem] md:text-6xl lg:text-7xl font-medium tracking-tight text-center max-w-5xl leading-none"
          >
            <>
              Fake crypto wallets that <span className="text-transparent bg-clip-text bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent">look and feel real.</span>
            </>
          </motion.h1>
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-ph4ntom-light/80 text-base md:text-xl text-center max-w-3xl my-4 md:my-8 font-medium leading-relaxed flex flex-col gap-2"
          >
            <span className="text-white/90">
              Available on iOS & Android.
            </span>
            <p>
              Set any balance, import any token, simulate transaction & much more in a pixel-perfect clone of Phantom & Trust Wallet. Flex your balance, prank your friends and create viral crypto larp content.
            </p>
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


        <ProductImageSwiper />
      </motion.section>

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
            RPWallet gives you a realistic wallet simulator with editable balances, custom tokens, simulated sends, activity history and much more.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Live wallet simulation",
              body: "Use a full fake crypto wallet app with balances, token lists, wallet names, and activity that behave like a real mobile wallet interface.",
            },
            {
              title: "Phantom and Trust",
              body: "Show realistic Phantom or Trust-style screens for content, demos, pranks, screenshots, and short videos.",
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
            <span className="text-[#ab9ff2]">Phantom & Trust.</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed mt-4">
            Set any balance, simulate any token, and nobody will know it's not the real thing.
          </p>
        </div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto relative">
          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/11.webp")} alt="Pixel-perfect icon" width={64} height={64} className="relative z-10 w-14 h-14 md:w-16 md:h-16 object-contain saturate-[0.8] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Pixel-Perfect Copy</h3>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/live token.webp")} alt="Live token prices icon" width={64} height={64} className="relative z-10 w-15 aspect-auto md:w-20 object-contain saturate-[0.8] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Live Token Prices</h3>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/p2p.webp")} alt="P2P transaction icon" width={64} height={64} className="relative z-10 w-18 aspect-auto md:w-20 object-contain saturate-[1.5] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">P2P Transaction</h3>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/dollar.webp")} alt="Set any balance icon" width={64} height={64} className="relative z-10 w-14 h-14 md:w-16 md:h-16 object-contain saturate-[0.8] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Set Any Balance</h3>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/user.webp")} alt="No sign up icon" width={64} height={64} className="relative z-10 w-14 h-14 md:w-16 md:h-16 object-contain saturate-[0.8] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">No Data Collected</h3>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="backdrop-blur-xl p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 relative overflow-hidden group/glass-card shadow-xl hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />
            {/* Hover shine sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
            {/* Hover ambient highlight overlay */}
            <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Image src={getAssetUrl("/3d-icons/download.webp")} alt="Nothing to download icon" width={64} height={64} className="relative z-10 w-14 h-14 md:w-16 md:h-16 object-contain saturate-[0.8] transition-transform duration-300 group-hover/glass-card:scale-110" />
            <h3 className="relative z-10 font-medium text-white/90 text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">No Download</h3>
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
            className="backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.13)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.2)",
                "inset 0 -1px 2px rgba(0,0,0,0.12)",
                "0 8px 40px rgba(0,0,0,0.3)",
                "0 2px 6px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
                "0 0 60px rgba(171,159,242,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            {/* Bottom subtle dark edge for depth */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Left edge highlight */}
            <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-white/20 via-white/[0.06] to-transparent" />
            {/* Inner refraction glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-[2.5rem]" />
            {/* Subtle purple inner glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-ph4ntom-purple/8 blur-[120px] rounded-full pointer-events-none" />

            {/* Centered Column */}
            <div className="relative z-10 w-full flex flex-col items-center">
              {/* <div className="mb-6">
                <Image src={getAssetUrl("/3d-icons/access.webp")} alt="Get Access" width={80} height={80} className="size-16 drop-shadow-2xl object-contain" />
              </div> */}
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-white mb-10 leading-tight">
                How to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent">get access.</span>
              </h2>
              {/* <p className="text-white/60 text-[15px] md:text-[17px] leading-relaxed mb-10 max-w-lg mx-auto">
              Get set up in less than 2 minutes. No complicated installations.
            </p> */}

              <div className="relative flex flex-col md:flex-row gap-8 md:gap-6 mb-10 w-full max-w-sm md:max-w-3xl mx-auto text-left md:text-center">
                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="absolute left-[10px] top-[32px] h-[calc(100%-8px)] w-[4px] md:hidden z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2px)", backgroundSize: "100% 12px" }} />
                  <div className="hidden md:block absolute top-[10px] left-[calc(50%+20px)] w-[calc(100%-40px)] h-[4px] z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2px)", backgroundSize: "12px 100%" }} />
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl">
                    <Image src={getAssetUrl("/3d-icons/Shopping Cart Icon.webp")} alt="Purchase" width={48} height={48} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Purchase a License</h4>
                    <p className="text-white/50 text-[14px] leading-snug">Grab RPWallet in the Pricing section below. Choose the plan that works for you, no hidden fees.</p>
                  </div>
                </div>

                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="absolute left-[10px] top-[32px] h-[calc(100%-8px)] w-[4px] md:hidden z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2px)", backgroundSize: "100% 12px" }} />
                  <div className="hidden md:block absolute top-[10px] left-[calc(50%+20px)] w-[calc(100%-40px)] h-[4px] z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2px)", backgroundSize: "12px 100%" }} />
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl">
                    <Image src={getAssetUrl("/3d-icons/Key Icon.webp")} alt="License key" width={48} height={48} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Receive Your Key</h4>
                    <p className="text-white/50 text-[14px] leading-snug">After payment, you'll receive a unique license key in your email. Keep it safe.</p>
                  </div>
                </div>

                <div className="relative flex flex-row md:flex-col items-start md:items-center gap-5 md:flex-1">
                  <div className="relative z-10 size-6 shrink-0 drop-shadow-xl">
                    <Image src={getAssetUrl("/3d-icons/iPhone Icon.webp")} alt="Install" width={48} height={48} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col md:pt-4">
                    <h4 className="text-white font-semibold text-[16px] mb-1">Activate, Install & Flex</h4>
                    <p className="text-white/50 text-[14px] leading-snug">
                      Enter your license key,{" "}
                      <Link href="/dashboard" className="text-[#ab9ff2] hover:text-white underline underline-offset-2 transition-colors">
                        install the app
                      </Link>
                      , follow the steps. Time to flex.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-white/60 text-[13px] mt-4 font-medium text-center">
                Have any questions? We respond within a few hours, contact us on{" "}
                <a href="https://t.me/RPWallet_support_bot" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">
                  telegram
                </a>
                .
              </p>
            </div>
          </motion.div>
          <div
            className="mt-6 max-w-[26rem] mx-auto p-2 pl-6 rounded-full flex flex-row items-center justify-between gap-3 backdrop-blur-xl relative overflow-hidden group/glass"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.15)",
                "inset 0 -1px 1px rgba(0,0,0,0.1)",
                "0 4px 24px rgba(0,0,0,0.25)",
                "0 1px 3px rgba(0,0,0,0.15)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Bottom subtle dark edge for depth */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-full" />

            <span className="relative z-10 text-white/85 text-[15px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Already have a license key?</span>
            <Link
              href="/dashboard"
              className="relative z-10 text-white text-[15px] font-medium py-2 px-6 rounded-full transition-all hover:scale-105 whitespace-nowrap overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(124,58,237,0.9) 100%)",
                boxShadow: [
                  "inset 0 1px 1px rgba(255,255,255,0.25)",
                  "inset 0 -1px 1px rgba(0,0,0,0.15)",
                  "0 2px 8px rgba(139,92,246,0.4)",
                  "0 0 0 0.5px rgba(255,255,255,0.1)",
                ].join(", "),
              }}
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
                <>Try it for free.<br />Pay when you&apos;re ready.</>
              </h2>
              {/* <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                Open a timed demo session first. Upgrade only when you want unlimited wallet access.
              </p> */}
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-3">Pricing</h2>
              <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                Crypto-only payments with secure checkout powered by NOWPayments.
              </p>
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
              Real prices, every screen, any balance upto $500 for {process.env.NEXT_PUBLIC_DEMO_DURATION_MINUTES || 5} minutes. No sign-up, no card. Just open it.
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

            const bgGradient = isPopular
              ? "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(139,92,246,0.06) 100%)"
              : isYearly
                ? "linear-gradient(135deg, rgba(253,224,71,0.12) 0%, rgba(255,255,255,0.02) 50%, rgba(253,224,71,0.08) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)";

            const borderColor = isPopular
              ? "rgba(139,92,246,0.35)"
              : isYearly
                ? "rgba(253,224,71,0.45)"
                : "rgba(255,255,255,0.12)";

            const glowShadow = isPopular
              ? "0 0 40px rgba(139,92,246,0.15)"
              : isYearly
                ? "0 0 40px rgba(253,224,71,0.25)"
                : "0 4px 24px rgba(0,0,0,0.25)";

            return (
              <div
                key={plan.id}
                className={`backdrop-blur-xl p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] outline-none group/glass-card ${checkoutLocked ? "cursor-wait pointer-events-none opacity-50 saturate-50" : "cursor-pointer hover:scale-[1.02]"}`}
                onClick={() => {
                  if (!checkoutLocked) {
                    handleCheckout(plan);
                  }
                }}
                style={{
                  background: bgGradient,
                  border: `1px solid ${borderColor}`,
                  boxShadow: [
                    "inset 0 1px 1px rgba(255,255,255,0.15)",
                    "inset 0 -1px 1px rgba(0,0,0,0.1)",
                    "0 4px 24px rgba(0,0,0,0.25)",
                    "0 1px 3px rgba(0,0,0,0.15)",
                    "0 0 0 0.5px rgba(255,255,255,0.08)",
                    glowShadow,
                  ].join(", "),
                }}
              >
                {/* Top specular highlight edge */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {/* Bottom subtle dark edge */}
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                {/* Inner refraction glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-[2rem]" />
                {/* Hover shine sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-card:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                {/* Hover ambient highlight overlay */}
                <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-card:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#8b5cf6] text-white text-[11px] font-bold tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)] whitespace-nowrap z-20">
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black text-[11px] font-bold tracking-wider uppercase rounded-full shadow-[0_5px_15px_rgba(212,175,55,0.4)] whitespace-nowrap z-20">
                    Best Value
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center mb-4 mt-2">
                  <span className="text-white/80 font-medium text-lg">{isStarter ? "7 Days Access" : isPopular ? "1 Month Access" : "1 Year Access"}</span>
                </div>

                <div className="relative z-10 flex items-baseline justify-center gap-1 mb-10">
                  {plan.originalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500">{plan.originalPrice}</span>}
                  <span className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">{plan.price}</span>
                </div>

                <ul className="relative z-10 flex flex-col gap-6 mb-12 flex-grow text-[15px] text-white/70">
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

                <button
                  disabled={checkoutLocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(plan);
                  }}
                  className={`relative z-10 w-full py-4 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 overflow-hidden hover:scale-[1.02] ${selectedPlanId === plan.id && checkoutPhase === "error"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : isPopular
                      ? "text-white"
                      : isYearly
                        ? "text-black"
                        : "text-white"
                    }`}
                  style={
                    selectedPlanId === plan.id && checkoutPhase === "error"
                      ? undefined
                      : isPopular
                        ? {
                          background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(124,58,237,0.9) 100%)",
                          boxShadow: [
                            "inset 0 1px 1px rgba(255,255,255,0.25)",
                            "inset 0 -1px 1px rgba(0,0,0,0.15)",
                            "0 2px 8px rgba(139,92,246,0.4)",
                            "0 0 0 0.5px rgba(255,255,255,0.1)",
                          ].join(", "),
                        }
                        : isYearly
                          ? {
                            background: "linear-gradient(135deg, rgba(253,224,71,0.95) 0%, rgba(202,138,4,1) 100%)",
                            boxShadow: [
                              "inset 0 1px 1px rgba(255,255,255,0.4)",
                              "inset 0 -1px 1px rgba(0,0,0,0.15)",
                              "0 4px 15px rgba(253,224,71,0.35)",
                              "0 0 0 0.5px rgba(255,255,255,0.2)",
                            ].join(", "),
                          }
                          : {
                            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: [
                              "inset 0 1px 1px rgba(255,255,255,0.15)",
                              "inset 0 -1px 1px rgba(0,0,0,0.1)",
                              "0 2px 8px rgba(0,0,0,0.1)",
                              "0 0 0 0.5px rgba(255,255,255,0.08)",
                            ].join(", "),
                          }
                  }
                >
                  {!isPopular && !isYearly && <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />}
                  {isPopular && <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />}
                  {isYearly && <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 to-transparent" />}
                  {selectedPlanId === plan.id && checkoutPhase === "error" ? (
                    <>Checkout Failed - Try Again <X size={20} /></>
                  ) : selectedPlanId === plan.id && checkoutLocked ? (
                    <>
                      <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      {checkoutPhase === "preparing" ? "Preparing checkout..." : "Opening checkout..."}
                    </>
                  ) : (
                    <>Buy <ArrowRight size={18} /></>
                  )}
                </button>

                {selectedPlanId === plan.id && checkoutPhase === "error" && (
                  <div className="absolute -bottom-6 left-0 right-0 text-red-400 text-xs text-center animate-pulse">
                    {checkoutError || "Please try again."}
                  </div>
                )}
                {selectedPlanId === plan.id && isSlowCheckout && !checkoutError && (
                  <div className="absolute -bottom-6 left-0 right-0 text-amber-400/80 text-xs text-center">
                    Checkout is taking a little longer. Please wait...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-12 max-w-[760px] mx-auto px-6 relative">
        <div className="absolute inset-0 bg-ph4ntom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight font-medium text-white mb-2">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-ph4ntom-accent">Questions.</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed mt-4">
            Everything you need to know about RPWallet.
          </p>
        </div>

        <div
          className="backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] max-w-2xl mx-auto flex flex-col relative z-10 overflow-hidden shadow-xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.15)",
              "inset 0 -1px 1px rgba(0,0,0,0.1)",
              "0 8px 40px rgba(0,0,0,0.3)",
              "0 2px 6px rgba(0,0,0,0.15)",
              "0 0 0 0.5px rgba(255,255,255,0.08)",
            ].join(", "),
          }}
        >
          {/* Top specular highlight edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          {/* Bottom subtle dark edge */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          {/* Inner refraction glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-[2.5rem]" />

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
                className="py-5 border-b border-white/5 last:border-b-0 text-left cursor-pointer transition-all duration-300 relative group select-none"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`font-medium text-base md:text-[17px] transition-colors duration-300 relative z-10 ${isOpen ? "text-[#ab9ff2]" : "text-white group-hover:text-[#ab9ff2]/80"}`}>
                    {item.q}
                  </h3>
                  <div className={`size-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 group-hover:bg-white/[0.06] ${isOpen ? "rotate-180 bg-[#ab9ff2]/10 border-[#ab9ff2]/30" : ""}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${isOpen ? "text-[#ab9ff2]" : "text-white/40"}`}>
                      <path d="m1 1 4 4 4-4" />
                    </svg>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="pt-3.5 text-white/50 text-[14px] leading-relaxed font-medium pr-8 pb-1 relative z-10">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-14 px-6 max-w-[980px] mx-auto relative">
        <div
          className="rounded-[2rem] p-6 md:p-8 text-center backdrop-blur-xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.08)",
              "0 4px 20px rgba(0,0,0,0.15)",
              "0 0 0 0.5px rgba(255,255,255,0.05)",
            ].join(", "),
          }}
        >
          {/* Top specular highlight edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {/* Inner refraction glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none rounded-[2rem]" />
          <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-white/35 relative z-10">
            RPWallet is built for people searching for a fake crypto wallet app, crypto wallet simulator, fake Phantom wallet, fake Phantom wallet balance, LARP wallet app, fake crypto wallet screen, fake crypto wallet screenshot, Phantom LARP wallet, Trust simulator, fake crypto balance, crypto LARP app, and realistic wallet app for entertainment, demos, pranks, and creator content.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 relative z-10">
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
                className="relative rounded-full px-3 py-1.5 text-[12px] font-medium text-white/40 backdrop-blur-md overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
                }}
              >
                {/* Top shine reflection */}
                <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
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
