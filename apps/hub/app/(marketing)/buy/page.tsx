"use client";

import React, { Suspense, useState } from "react";
import { Check, ShoppingCart, X, Lock, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { getStoredAttribution } from "@/lib/affiliate-attribution";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import Link from "next/link";
import { useRef } from "react";
import { useInView, motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/track";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";
import { formatYearlyDiscountRemaining, useYearlyDiscountOffer } from "@/lib/use-yearly-discount-offer";

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
  const api = React.useMemo(() => new RpWalletApiClient(HUB_API_BASE_URL), []);

  const initialPlan = searchParams.get("plan");
  const validPlanId = initialPlan && PLANS.some((p) => p.id === initialPlan) ? initialPlan : "starter";
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(validPlanId);
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSlowCheckout, setIsSlowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const autoCheckoutStartedRef = useRef(false);
  const yearlyDiscountOffer = useYearlyDiscountOffer();

  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonInView = useInView(buttonRef, { margin: "0px 0px -100px 0px" });
  const showSticky = !isButtonInView && selectedPlanId;
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId);
  const selectedPlanLabel = selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access";
  const checkoutLocked = checkoutPhase === "preparing" || checkoutPhase === "opening";
  const getPlanDisplayPrice = (plan: (typeof PLANS)[number]) => {
    const isExpiredYearly = plan.id === "yearly" && yearlyDiscountOffer.isReady && !yearlyDiscountOffer.isActive;
    return isExpiredYearly && plan.originalPrice ? plan.originalPrice : plan.price;
  };
  const selectedPlanDisplayPrice = selectedPlan ? getPlanDisplayPrice(selectedPlan) : undefined;

  const normalizedEmail = email.trim().toLowerCase();

  React.useEffect(() => {
    trackEvent("buy_page_viewed", {
      initial_plan: initialPlan,
      selected_plan: validPlanId,
      expired_license: isExpired,
    });
  }, [initialPlan, isExpired, validPlanId]);

  React.useEffect(() => {
    const resetReturnedCheckout = () => {
      setCheckoutError("");
      setCheckoutPhase("idle");
      setIsSlowCheckout(false);
    };

    window.addEventListener("pageshow", resetReturnedCheckout);
    return () => window.removeEventListener("pageshow", resetReturnedCheckout);
  }, []);

  React.useEffect(() => {
    if (initialPlan) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`plan-${validPlanId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialPlan, validPlanId]);

  const handleCheckout = async () => {
    if (!selectedPlanId || checkoutLocked) return;
    const plan = selectedPlan;
    if (!plan) return;
    window.dispatchEvent(new Event("rp-wallet:checkout-started"));
    trackEvent("checkout_started", {
      plan: plan.id,
      price: getPlanDisplayPrice(plan),
      provider: "nowpayments",
    });
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Please enter a valid email for license delivery.");
      const emailInput = document.getElementById("email-input");
      if (emailInput) {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const slowTimer = window.setTimeout(() => setIsSlowCheckout(true), 4000);
    const clearSlowTimer = () => window.clearTimeout(slowTimer);
    setCheckoutError("");
    setIsSlowCheckout(false);
    setCheckoutPhase("preparing");

    try {
      const attribution = getStoredAttribution();
      let affiliateCode: string | undefined;
      if (attribution) {
        const intentResult = await api
          .createAffiliateCheckoutIntent({
            affiliateCode: attribution.affiliateCode,
            visitorId: attribution.visitorId,
            clickId: attribution.clickId,
            plan: plan.id,
            buyerEmail: normalizedEmail,
          })
          .catch(() => null);
        affiliateCode = intentResult?.accepted ? attribution.affiliateCode : undefined;
      }

      const result = await api.createNowPaymentsCheckout({
        planId: plan.id,
        email: normalizedEmail,
        affiliateCode,
        yearlyOfferActive: plan.id === "yearly" && yearlyDiscountOffer.isReady ? yearlyDiscountOffer.isActive : undefined,
      });
      setCheckoutPhase("opening");
      trackEvent("checkout_url_ready", { plan: plan.id, provider: "nowpayments" });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      clearSlowTimer();
      const message = error instanceof Error ? error.message : "Please try again.";
      setCheckoutError(message);
      setCheckoutPhase("error");
      trackEvent("checkout_failed", { plan: plan.id, provider: "nowpayments", error: message });
    }
  };

  React.useEffect(() => {
    if (searchParams.get("checkout") === "1" && !autoCheckoutStartedRef.current) {
      autoCheckoutStartedRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("source");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#9c8df6]/30 relative pb-24">
      {isExpired && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/10 border-b border-red-500/20 backdrop-blur-md py-3 px-6 flex justify-center items-center">
          <p className="text-red-400 text-sm font-medium">Your license key has expired. Please choose a new plan to continue.</p>
        </div>
      )}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-6 flex flex-col items-center">
        {/* ── H E A D E R ── */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9c8df6]/10 border border-[#9c8df6]/20 text-[#c7bdff] text-sm font-medium mb-6 shadow-[0_0_12px_rgba(156,141,246,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#9c8df6] animate-pulse shadow-[0_0_8px_#9c8df6]"></span>
            Instant key delivery
          </div> */}
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium text-white mb-3">
            Choose Your Plan
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-[400px] mx-auto leading-relaxed">
            Complete checkout, receive unique key and unlock instant access - no subscriptions.
          </p>
        </div>

        {/* ── I N T E R A C T I V E  P R I C I N G  G R I D ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-stretch mb-16 relative">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";
            const showYearlyDiscount = isYearly && yearlyDiscountOffer.isReady && yearlyDiscountOffer.isActive;
            const displayPrice = getPlanDisplayPrice(plan);
            const showOriginalPrice = Boolean(isYearly && plan.originalPrice && showYearlyDiscount);

            const bgGradient = isSelected
              ? isYearly
                ? "linear-gradient(135deg, rgba(253,224,71,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(253,224,71,0.08) 100%)"
                : "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(139,92,246,0.08) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)";

            const borderColor = isSelected
              ? isYearly
                ? "rgba(253,224,71,0.45)"
                : "rgba(139,92,246,0.45)"
              : "rgba(255,255,255,0.12)";

            const glowShadow = isSelected
              ? isYearly
                ? "0 0 50px rgba(253,224,71,0.25)"
                : "0 0 50px rgba(139,92,246,0.3)"
              : "0 4px 24px rgba(0,0,0,0.25)";

            return (
              <div
                key={plan.id}
                id={`plan-${plan.id}`}
                onClick={() => {
                  if (!checkoutLocked) {
                    setSelectedPlanId(plan.id);
                    trackEvent("pricing_plan_selected", {
                      plan: plan.id,
                      price: displayPrice,
                      source: "buy_page",
                    });
                  }
                }}
                className={`backdrop-blur-xl p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] outline-none group/glass-card ${checkoutLocked ? "cursor-wait pointer-events-none opacity-50 saturate-50" : "cursor-pointer"} ${!isSelected && "opacity-70"}`}
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

                {/* Mobile-friendly selection indicator */}
                <div className="absolute top-5 right-5 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 z-10">
                  {isSelected ? (
                    <div className={`h-full w-full rounded-full flex items-center justify-center shadow-lg ${isYearly ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04]" : "bg-[#8b5cf6]"}`}>
                      <Check size={14} strokeWidth={4} className={isYearly ? "text-black" : "text-white"} />
                    </div>
                  ) : (
                    <div className="h-full w-full rounded-full border-2 border-white/20"></div>
                  )}
                </div>

                {isPopular && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase rounded-full whitespace-nowrap transition-all duration-300 z-20 ${isSelected ? "bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "bg-white/10 text-white/60"}`}>
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full whitespace-nowrap transition-all duration-300 z-20 ${isSelected ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black shadow-[0_5px_15px_rgba(212,175,55,0.4)]" : "bg-white/10 text-white/60"}`}>
                    Best Value
                  </div>
                )}

                <div className="relative z-10 text-white/80 font-medium text-lg mb-4 text-center">{isStarter ? "7 Days Access" : isPopular ? "1 Month Access" : "1 Year Access"}</div>

                <div className="relative z-10 mb-10 flex min-h-[94px] flex-col items-center justify-start">
                  <div className="flex items-baseline justify-center gap-1">
                    {showOriginalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500">{plan.originalPrice}</span>}
                    <span className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">{displayPrice}</span>
                  </div>
                  {showYearlyDiscount && (
                    <div className="mt-3 rounded-full border border-[#fde047]/25 bg-[#fde047]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#fde68a]">
                      30-min sliced price ends in {formatYearlyDiscountRemaining(yearlyDiscountOffer.remainingMs)}
                    </div>
                  )}
                </div>

                <ul className="relative z-10 flex flex-col gap-6 mb-12 flex-grow text-[15px] text-white/70">
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
          <label className="w-full">
            <span className="mb-2 block text-sm font-medium text-white/70">Email for license delivery</span>
            <div className="relative w-full rounded-xl overflow-hidden backdrop-blur-md">
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="you@example.com"
                className="relative z-10 w-full rounded-xl px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:ring-2 focus:ring-[#9c8df6]/20"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: [
                    "inset 0 1px 1px rgba(255,255,255,0.05)",
                    "inset 0 -1px 1px rgba(0,0,0,0.1)",
                    "0 1px 2px rgba(0,0,0,0.1)",
                  ].join(", "),
                }}
              />
              {/* Inner subtle specular highlights */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
          </label>
          {emailError && (
            <div className="text-amber-400 text-sm -mt-2 mb-1 w-full text-center animate-pulse font-medium">
              {emailError}
            </div>
          )}
          <button
            disabled={!selectedPlanId || checkoutLocked}
            onClick={handleCheckout}
            className={`relative z-10 w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg overflow-hidden cursor-pointer hover:scale-[1.02] ${!selectedPlanId
              ? "bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
              : checkoutPhase === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : selectedPlanId === "yearly"
                  ? "text-black animate-pulse"
                  : "text-white"
              }`}
            style={
              !selectedPlanId || checkoutPhase === "error"
                ? undefined
                : selectedPlanId === "yearly"
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
                    background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(124,58,237,0.9) 100%)",
                    boxShadow: [
                      "inset 0 1px 1px rgba(255,255,255,0.25)",
                      "inset 0 -1px 1px rgba(0,0,0,0.15)",
                      "0 4px 15px rgba(139,92,246,0.4)",
                      "0 0 0 0.5px rgba(255,255,255,0.1)",
                    ].join(", "),
                  }
            }
          >
            {selectedPlanId && checkoutPhase !== "error" && (
              <>
                {selectedPlanId === "yearly" ? (
                  <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                ) : (
                  <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                )}
              </>
            )}
            {checkoutPhase === "error" ? (
              <>Checkout Failed - Try Again <X size={20} /></>
            ) : checkoutLocked ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {checkoutPhase === "preparing" ? "Preparing checkout..." : "Opening checkout..."}
              </>
            ) : !selectedPlanId ? (
              "Select a package to continue"
            ) : (
              <>Pay {selectedPlanDisplayPrice} with Crypto <ShoppingCart size={20} /></>
            )}
          </button>

          {checkoutPhase === "error" && (
            <div className="text-red-400 text-sm -mt-2 text-center animate-pulse">
              {checkoutError || "Please try again."}
            </div>
          )}
          {isSlowCheckout && !checkoutError && (
            <div className="text-amber-400/80 text-sm -mt-2 text-center">
              NOWPayments is taking a little longer. Please wait...
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-1 mb-2 text-white/70 text-[13px] font-medium">
            <Lock size={14} className="text-[#ab9ff2]" />
            <span>Secure checkout secured by NOWPayments</span>
          </div>

          <p className="text-center text-[12px] text-white/40 max-w-[400px]">
            By completing your purchase, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white transition-colors">Terms & Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>.
          </p>
        </div>

        {/* ── S U P P O R T  &  Q U E R I E S ── */}
        <div
          className="w-full max-w-[500px] px-8 py-8 rounded-[2rem] backdrop-blur-xl relative overflow-hidden text-center mb-10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.1)",
              "0 4px 20px rgba(0,0,0,0.15)",
            ].join(", "),
          }}
        >
          {/* Top specular highlight edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {/* Inner refraction glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none rounded-[2rem]" />
          <p className="text-white/45 text-[14px] leading-relaxed relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
            Need help or want to use a different cryptocurrency or network? Message{" "}
            <a href="https://t.me/RPWallet_support_bot" target="_blank" rel="noopener noreferrer" className="text-[#9c8df6] hover:text-[#aba0f7] transition-colors">
              @RPWallet_support_bot
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
            className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-2xl"
            style={{
              background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 0%, rgba(13, 13, 14, 0.96) 100%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.4)",
            }}
          >
            {/* Top specular highlight edge for the sticky bar */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            <div className="max-w-[440px] mx-auto">
              <label className="mb-3 block">
                <span className="sr-only">Email for license delivery</span>
                <div className="relative w-full rounded-xl overflow-hidden backdrop-blur-md">
                  <input
                    id="sticky-email-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="Email for license delivery"
                    className="relative z-10 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:ring-2 focus:ring-[#9c8df6]/20"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: [
                        "inset 0 1px 1px rgba(255,255,255,0.05)",
                        "inset 0 -1px 1px rgba(0,0,0,0.1)",
                        "0 1px 2px rgba(0,0,0,0.1)",
                      ].join(", "),
                    }}
                  />
                  {/* Specular edge overlays */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                </div>
              </label>
              {emailError && (
                <div className="text-amber-400 text-sm mb-3 w-full text-center animate-pulse font-medium">
                  {emailError}
                </div>
              )}
              <button
                disabled={!selectedPlanId || checkoutLocked}
                onClick={handleCheckout}
                className={`relative z-10 w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg overflow-hidden cursor-pointer hover:scale-[1.02] ${!selectedPlanId
                  ? "bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
                  : checkoutPhase === "error"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : selectedPlanId === "yearly"
                      ? "text-black"
                      : "text-white"
                  }`}
                style={
                  !selectedPlanId || checkoutPhase === "error"
                    ? undefined
                    : selectedPlanId === "yearly"
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
                        background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(124,58,237,0.9) 100%)",
                        boxShadow: [
                          "inset 0 1px 1px rgba(255,255,255,0.25)",
                          "inset 0 -1px 1px rgba(0,0,0,0.15)",
                          "0 4px 15px rgba(139,92,246,0.4)",
                          "0 0 0 0.5px rgba(255,255,255,0.1)",
                        ].join(", "),
                      }
                }
              >
                {selectedPlanId && checkoutPhase !== "error" && (
                  <>
                    {selectedPlanId === "yearly" ? (
                      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                    ) : (
                      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    )}
                  </>
                )}
                {checkoutPhase === "error" ? (
                  <>Checkout Failed - Try Again <X size={20} /></>
                ) : checkoutLocked ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {checkoutPhase === "preparing" ? "Preparing checkout..." : "Opening checkout..."}
                  </>
                ) : !selectedPlanId ? (
                  "Select a package to continue"
                ) : (
                  <>Pay {selectedPlanDisplayPrice} with Crypto <ShoppingCart size={20} /></>
                )}
              </button>

              {checkoutPhase === "error" && (
                <div className="text-red-400 text-xs mt-2 text-center animate-pulse">
                  {checkoutError || "Please try again."}
                </div>
              )}
              {isSlowCheckout && !checkoutError && (
                <div className="text-amber-400/80 text-xs mt-2 text-center">
                  Taking a little longer...
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-white/70 text-[12px] font-medium">
                <Lock size={12} className="text-[#ab9ff2]" />
                <span>Secure checkout via NOWPayments</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
