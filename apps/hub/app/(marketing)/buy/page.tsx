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
type CheckoutPhase = "idle" | "preparing" | "opening" | "error";

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
  const shopId = Number(process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || 241810);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>("popular");
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSlowCheckout, setIsSlowCheckout] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonInView = useInView(buttonRef, { margin: "0px 0px -100px 0px" });
  const showSticky = !isButtonInView && selectedPlanId;
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId);
  const selectedPlanLabel = selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access";
  const checkoutLocked = isLoading || checkoutPhase !== "idle";

  React.useEffect(() => {
    const resetReturnedCheckout = () => {
      setCheckoutError("");
      setCheckoutPhase("idle");
      setIsSlowCheckout(false);
    };

    window.addEventListener("pageshow", resetReturnedCheckout);
    return () => window.removeEventListener("pageshow", resetReturnedCheckout);
  }, []);

  const handleCheckout = () => {
    if (!selectedPlanId || checkoutLocked) return;
    const plan = selectedPlan;
    if (!plan) return;
    const slowTimer = window.setTimeout(() => setIsSlowCheckout(true), 4000);
    const clearSlowTimer = () => window.clearTimeout(slowTimer);

    const hasEmbedConfig =
      plan.sellauthProductId &&
      plan.sellauthVariantId &&
      plan.sellauthProductId > 0 &&
      plan.sellauthVariantId > 0;

    if (hasEmbedConfig) {
      setCheckoutError("");
      setIsSlowCheckout(false);
      setCheckoutPhase("preparing");
      checkout({
        cart: [{ productId: plan.sellauthProductId!, variantId: plan.sellauthVariantId!, quantity: 1 }],
        shopId,
        onPreparing: () => {
          setCheckoutPhase("preparing");
        },
        onCheckoutUrlReady: () => {
          setCheckoutPhase("opening");
        },
        onError: (error) => {
          clearSlowTimer();
          setCheckoutError(error.message || "Please try again.");
          setCheckoutPhase("error");
        },
        onSettled: ({ status, redirected }) => {
          clearSlowTimer();
          setIsSlowCheckout(false);
          if (status === "success" && !redirected) {
            setCheckoutPhase("idle");
          }
        },
      });
    } else {
      setCheckoutError("");
      setIsSlowCheckout(false);
      setCheckoutPhase("opening");
      window.open(plan.buyUrl, "_blank");
      window.setTimeout(() => {
        clearSlowTimer();
        setCheckoutPhase("idle");
      }, 800);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#9c8df6]/30 relative pb-24">
      {isExpired && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/10 border-b border-red-500/20 backdrop-blur-md py-3 px-6 flex justify-center items-center">
          <p className="text-red-400 text-sm font-medium">Your license key has expired. Please choose a new plan to continue.</p>
        </div>
      )}

      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-12 flex flex-col items-center">
        {/* ── H E A D E R ── */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9c8df6]/10 border border-[#9c8df6]/20 text-[#c7bdff] text-sm font-medium mb-6 shadow-[0_0_12px_rgba(156,141,246,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#9c8df6] animate-pulse shadow-[0_0_8px_#9c8df6]"></span>
            Instant key delivery
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium text-white mb-3">
            Choose Your Plan
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-[400px] mx-auto leading-relaxed">
            Select your preferred tier. You'll receive a unique license key instantly after purchase.
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
                onClick={() => {
                  if (!checkoutLocked) setSelectedPlanId(plan.id);
                }}
                className={`glass-panel p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] outline-none group ${checkoutLocked ? "cursor-wait pointer-events-none" : "cursor-pointer"} ${isSelected
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
                  {plan.originalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-current">{plan.originalPrice}</span>}
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
            disabled={!selectedPlanId || checkoutLocked}
            onClick={handleCheckout}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg ${selectedPlanId
                ? selectedPlanId === "yearly"
                  ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black hover:scale-[1.02] shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
                  : "bg-gradient-to-r from-phantom-purple to-phantom-accent text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(139,92,246,0.2)]"
                : "bg-white/5 text-white/40 border border-white/10 pointer-events-none"
              }`}
          >
            {checkoutLocked ? (
              <>
                <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Opening checkout...
              </>
            ) : selectedPlanId ? (
              <>Checkout {selectedPlanLabel} <ArrowRight size={20} /></>
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
        <div className="w-full max-w-[500px] px-8 py-8 rounded-[2rem] border border-white/5 bg-white/[0.01] relative overflow-hidden text-center mb-10">
          <p className="text-white/40 text-[14px] leading-relaxed relative z-10">
            Need help or want to pay with another crypto currency? Message{" "}
            <a href="https://t.me/LarperWallet_bot" target="_blank" rel="noopener noreferrer" className="text-[#9c8df6] hover:text-[#aba0f7] transition-colors">
              @LarperWallet_bot
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
                disabled={!selectedPlanId || checkoutLocked}
                onClick={handleCheckout}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg shadow-2xl ${selectedPlanId === "yearly"
                    ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black"
                    : "bg-gradient-to-r from-phantom-purple to-phantom-accent text-white"
                  }`}
              >
                {checkoutLocked ? (
                  <>
                    <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Opening checkout...
                  </>
                ) : (
                  <>Checkout {selectedPlanLabel} <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutStatusOverlay
        errorMessage={checkoutError}
        isSlowCheckout={isSlowCheckout}
        onRetry={() => {
          setCheckoutError("");
          setCheckoutPhase("idle");
          setIsSlowCheckout(false);
        }}
        phase={checkoutPhase}
        planLabel={selectedPlanLabel}
      />

      {captcha}
      {checkoutModal}
    </div>
  );
}

function CheckoutStatusOverlay({
  errorMessage,
  isSlowCheckout,
  onRetry,
  phase,
  planLabel,
}: {
  errorMessage: string;
  isSlowCheckout: boolean;
  onRetry: () => void;
  phase: CheckoutPhase;
  planLabel: string;
}) {
  if (phase === "idle") return null;

  const isError = phase === "error";
  const title = isError
    ? "Checkout could not open"
    : phase === "opening"
      ? "Opening SellAuth checkout..."
      : "Preparing secure checkout...";
  const description = isError
    ? errorMessage || "Please try again."
    : isSlowCheckout
      ? "SellAuth is taking a little longer. Please wait, do not refresh or tap again."
      : "This can take a few seconds. Please do not tap checkout again.";

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100000020] flex items-center justify-center bg-[#0c0a18]/80 px-4 backdrop-blur-md"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-[#121212]/95 p-7 text-center shadow-[0_0_80px_rgba(139,92,246,0.15)] backdrop-blur-2xl"
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
        >
          <div className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-full border ${isError ? "border-red-400/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-[#ab9ff2]/25 bg-[#ab9ff2]/10 shadow-[0_0_20px_rgba(171,159,242,0.2)]"}`}>
            {isError ? (
              <X size={24} className="text-red-400" />
            ) : (
              <svg className="size-7 animate-spin text-[#ab9ff2]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            )}
          </div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-[#ab9ff2]">{planLabel}</div>
          <h2 className="mb-3 text-[21px] font-semibold tracking-tight text-white">{title}</h2>
          <p className="mx-auto max-w-[280px] text-[14px] leading-relaxed text-white/60">{description}</p>
          {isError && (
            <button
              className="mt-6 w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[15px] font-semibold text-white transition-all hover:bg-white/10 backdrop-blur-md shadow-lg"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
