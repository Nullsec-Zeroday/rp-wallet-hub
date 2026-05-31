"use client";

import React, { Suspense, useState } from "react";
import { Check, ArrowRight, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { useSellAuthEmbed } from "@/hooks/useSellAuthEmbed";
import Link from "next/link";
import { useRef } from "react";
import { useInView, motion, AnimatePresence } from "framer-motion";

const PLANS = Object.values(PRICING_PLANS);

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BuyContent />
    </Suspense>
  );
}

function BuyContent() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("error") === "expired";
  const { checkout, isLoading, modal: checkoutModal, captcha } = useSellAuthEmbed();
  const shopId = Number(process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || 234704);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>("popular");

  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonInView = useInView(buttonRef, { margin: "0px 0px -100px 0px" });
  const showSticky = !isButtonInView && selectedPlanId;

  const handleCheckout = () => {
    if (!selectedPlanId || isLoading) return;
    const plan = PLANS.find(p => p.id === selectedPlanId);
    if (!plan) return;
    
    const hasEmbedConfig = 
      plan.sellauthProductId && 
      plan.sellauthVariantId && 
      plan.sellauthProductId > 0 && 
      plan.sellauthVariantId > 0;

    if (hasEmbedConfig) {
      checkout({
        cart: [{ productId: plan.sellauthProductId!, variantId: plan.sellauthVariantId!, quantity: 1 }],
        shopId,
      });
    } else {
      window.open(plan.buyUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#9c8df6]/30 relative pb-24">
      {isExpired && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/10 border-b border-red-500/20 backdrop-blur-md py-3 px-6 flex justify-center items-center">
          <p className="text-red-400 text-sm font-medium">Your license key has expired. Please choose a new plan to continue.</p>
        </div>
      )}

      <main className="relative z-10 w-full max-w-[1000px] mx-auto px-6 pt-12 md:pt-24 flex flex-col items-center">
        {/* ── H E A D E R ── */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9c8df6]/10 border border-[#9c8df6]/20 text-[#c7bdff] text-sm font-medium mb-6 shadow-[0_0_12px_rgba(156,141,246,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#9c8df6] animate-pulse shadow-[0_0_8px_#9c8df6]"></span>
            Instant key delivery
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium text-white mb-3">
            Choose Your Plan
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-sm mx-auto leading-relaxed">
            Select your preferred tier to instantly activate your LarperWallet license.
          </p>
        </div>

        {/* ── I N T E R A C T I V E  P R I C I N G  G R I D ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-stretch mb-16 relative">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`glass-panel p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] cursor-pointer outline-none group ${
                  isSelected 
                    ? isYearly
                        ? "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#fde047,transparent)_border-box] shadow-[0_0_40px_rgba(212,175,55,0.25)] scale-[1.02] ring-1 ring-[#fde047] z-10"
                        : "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#8b5cf6,transparent)_border-box] shadow-[0_0_50px_rgba(139,92,246,0.3)] scale-[1.02] ring-1 ring-[#8b5cf6] z-10"
                    : "bg-[#121212]/80 border border-white/[0.04] hover:bg-[#151515] hover:border-white/[0.08] hover:scale-[1.01] opacity-70 hover:opacity-100"
                }`}
              >
                {isPopular && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase rounded-full whitespace-nowrap transition-all duration-300 ${isSelected ? "bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "bg-white/10 text-white/60"}`}>
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full whitespace-nowrap transition-all duration-300 ${isSelected ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black shadow-[0_5px_15px_rgba(212,175,55,0.4)]" : "bg-white/10 text-white/60"}`}>
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
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-all duration-300 ${isSelected ? (isYearly ? "bg-gradient-to-br from-[#fde047] to-[#ca8a04]" : "bg-[#9c8df6]") : "bg-white/20"}`}>
                          <Check size={13} strokeWidth={3} className={isSelected ? (isYearly ? "text-black" : "text-white") : "text-white/60"} />
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
              </div>
            );
          })}
        </div>

        {/* ── C H E C K O U T  B U T T O N ── */}
        <div ref={buttonRef} className="w-full max-w-[440px] flex flex-col items-center gap-4 mb-20">
          <button
            disabled={!selectedPlanId || isLoading}
            onClick={handleCheckout}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg ${
              selectedPlanId 
                ? selectedPlanId === "yearly"
                    ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black hover:scale-[1.02] shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
                    : "bg-gradient-to-r from-phantom-purple to-phantom-accent text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(139,92,246,0.2)]"
                : "bg-white/5 text-white/40 border border-white/10 pointer-events-none"
            }`}
          >
            {isLoading ? (
              <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : selectedPlanId ? (
              <>Checkout {selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access"} <ArrowRight size={20} /></>
            ) : (
              "Select a package to continue"
            )}
          </button>
          
          <p className="text-center text-[12px] text-white/40 max-w-[400px]">
            By completing your purchase, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white transition-colors">Terms & Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>.
          </p>
        </div>

        {/* ── S U P P O R T  &  Q U E R I E S ── */}
        <div className="w-full max-w-[500px] px-8 py-8 rounded-[2rem] border border-white/5 bg-white/[0.01] relative overflow-hidden text-center">
          <p className="text-white/40 text-[14px] leading-relaxed relative z-10">
            Need help or want to pay with another method? Message{" "}
            <a href="https://t.me/LarperWallet_Bot" target="_blank" rel="noopener noreferrer" className="text-[#9c8df6] hover:text-[#aba0f7] transition-colors">
              @LarperWallet_Bot
            </a>{" "}
            on Telegram.
          </p>
        </div>
      </main>

      {/* ── S T I C K Y  C H E C K O U T  B U T T O N ── */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0d0d0e]/80 backdrop-blur-xl border-t border-white/[0.05]"
          >
            <div className="max-w-[440px] mx-auto">
              <button
                disabled={isLoading}
                onClick={handleCheckout}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg shadow-2xl ${
                  selectedPlanId === "yearly"
                    ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black"
                    : "bg-gradient-to-r from-phantom-purple to-phantom-accent text-white"
                }`}
              >
                {isLoading ? (
                  <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : (
                  <>Checkout {selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access"} <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {captcha}
      {checkoutModal}
    </div>
  );
}
