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

  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonInView = useInView(buttonRef, { margin: "0px 0px -100px 0px" });
  const showSticky = !isButtonInView && selectedPlanId;
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId);
  const selectedPlanLabel = selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access";
  const checkoutLocked = checkoutPhase === "preparing" || checkoutPhase === "opening";

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
      price: plan.price,
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
            You&apos;re just a few steps away from owning the #1 fake crypto wallet on the market.
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
                id={`plan-${plan.id}`}
                onClick={() => {
                  if (!checkoutLocked) {
                    setSelectedPlanId(plan.id);
                    trackEvent("pricing_plan_selected", {
                      plan: plan.id,
                      price: plan.price,
                      source: "buy_page",
                    });
                  }
                }}
                className={`glass-panel p-10 flex flex-col relative transition-all duration-300 rounded-[2rem] outline-none group ${checkoutLocked ? "cursor-wait pointer-events-none" : "cursor-pointer"} ${isSelected
                  ? isYearly
                    ? "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#fde047,transparent)_border-box] shadow-[0_0_40px_rgba(212,175,55,0.25)] scale-[1.02] ring-1 ring-[#fde047] z-10"
                    : "border border-transparent [background:linear-gradient(#161618,#161618)_padding-box,linear-gradient(to_bottom,#8b5cf6,transparent)_border-box] shadow-[0_0_50px_rgba(139,92,246,0.3)] scale-[1.02] ring-1 ring-[#8b5cf6] z-10"
                  : "bg-[#121212]/80 border border-white/[0.04] hover:bg-[#151515] hover:border-white/[0.08] hover:scale-[1.01] opacity-70 hover:opacity-100"
                  }`}
              >
                {/* Mobile-friendly selection indicator */}
                <div className="absolute top-5 right-5 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 z-10">
                  {isSelected ? (
                    <div className={`h-full w-full rounded-full flex items-center justify-center shadow-lg ${isYearly ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04]" : "bg-[#8b5cf6]"}`}>
                      <Check size={14} strokeWidth={4} className={isYearly ? "text-black" : "text-white"} />
                    </div>
                  ) : (
                    <div className="h-full w-full rounded-full border-2 border-white/20 group-hover:border-white/40"></div>
                  )}
                </div>

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
                  {plan.originalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500">{plan.originalPrice}</span>}
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
          <label className="w-full">
            <span className="mb-2 block text-sm font-medium text-white/70">Email for license delivery</span>
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
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#9c8df6]/60 focus:ring-2 focus:ring-[#9c8df6]/20"
            />
          </label>
          {emailError && (
            <div className="text-amber-400 text-sm -mt-2 mb-1 w-full text-center animate-pulse font-medium">
              {emailError}
            </div>
          )}
          <button
            disabled={!selectedPlanId || checkoutLocked}
            onClick={handleCheckout}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg ${!selectedPlanId
              ? "bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
              : checkoutPhase === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : selectedPlanId === "yearly"
                  ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black hover:scale-[1.02] shadow-[0_5px_20px_rgba(212,175,55,0.3)]"
                  : "bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(139,92,246,0.2)]"
              }`}
          >
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
              <>Pay {selectedPlan?.price} with Crypto <ShoppingCart size={20} /></>
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
        <div className="w-full max-w-[500px] px-8 py-8 rounded-[2rem] border border-white/5 bg-white/[0.01] relative overflow-hidden text-center mb-10">
          <p className="text-white/40 text-[14px] leading-relaxed relative z-10">
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
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0d0d0e]/80 backdrop-blur-xl border-t border-white/[0.05]"
          >
            <div className="max-w-[440px] mx-auto">
              <label className="mb-3 block">
                <span className="sr-only">Email for license delivery</span>
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
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#9c8df6]/60 focus:ring-2 focus:ring-[#9c8df6]/20"
                />
              </label>
              {emailError && (
                <div className="text-amber-400 text-sm mb-3 w-full text-center animate-pulse font-medium">
                  {emailError}
                </div>
              )}
              <button
                disabled={!selectedPlanId || checkoutLocked}
                onClick={handleCheckout}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-lg shadow-2xl ${!selectedPlanId
                  ? "bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
                  : checkoutPhase === "error"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : selectedPlanId === "yearly"
                      ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black"
                      : "bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent text-white"
                  }`}
              >
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
                  <>Pay {selectedPlan?.price} with Crypto <ShoppingCart size={20} /></>
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
