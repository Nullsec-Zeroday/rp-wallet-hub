"use client";

import React, { Suspense, useState } from "react";
import { Check, ShoppingCart, X, Lock, Loader2, CreditCard, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PRICING_PLANS } from "@/lib/pricing-config";
import {
  AFFILIATE_ATTRIBUTION_UPDATED_EVENT,
  type AffiliateAttribution,
  clearStoredAttribution,
  getOrCreateVisitorId,
  getStoredAttribution,
  storeAttribution,
} from "@/lib/affiliate-attribution";
import { getReferralBonusDays } from "@rp-wallet/config";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import Link from "next/link";
import { useRef } from "react";
import { useInView, motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/track";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";
import { SupportTicketForm } from "@/components/marketing/support-ticket-form";

const PLANS = Object.values(PRICING_PLANS);
type CheckoutPhase = "idle" | "preparing" | "opening" | "error";
type PaymentMethod = "card" | "crypto";
const STICKY_CHECKOUT_HIDE_DISTANCE = 160;

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

const PLAN_RANKS: Record<string, { label: string; color: string }> = {
  starter: { label: "C-Rank Hunter", color: "#a8b6d8" },
  popular: { label: "A-Rank Hunter", color: "#c084fc" },
  yearly: { label: "S-Rank Monarch", color: "#fde047" },
};

function BitcoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0.004 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z" fill="#f7931a" />
      <path d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c.957.26 1.887.5 2.797.726L27.504 50.8l3.511.875 1.453-5.823c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z" fill="#ffffff" />
    </svg>
  );
}

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [showCodes, setShowCodes] = useState(false);
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSlowCheckout, setIsSlowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const [referralOffer, setReferralOffer] = useState<AffiliateAttribution | null>(null);
  const [creatorCode, setCreatorCode] = useState("");
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState("");
  const [isCheckoutAreaFarBelow, setIsCheckoutAreaFarBelow] = useState(false);
  const autoCheckoutStartedRef = useRef(false);
  const creatorFieldTouchedRef = useRef(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonInView = useInView(buttonRef, { margin: "0px 0px -100px 0px" });
  const showSticky = isCheckoutAreaFarBelow && !isButtonInView && selectedPlanId;
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId);
  const selectedPlanLabel = selectedPlanId === "starter" ? "7 Days Access" : selectedPlanId === "popular" ? "1 Month Access" : "1 Year Access";
  const checkoutLocked = checkoutPhase === "preparing" || checkoutPhase === "opening";
  const getPlanDisplayPrice = (plan: (typeof PLANS)[number]) => plan.price;
  const selectedPlanDisplayPrice = selectedPlan ? getPlanDisplayPrice(selectedPlan) : undefined;
  const selectedReferralBonusDays = referralOffer && selectedPlanId ? getReferralBonusDays(selectedPlanId) : 0;

  const normalizedEmail = email.trim().toLowerCase();

  React.useEffect(() => {
    const stored = getStoredAttribution();
    setReferralOffer(stored);
    setCreatorCode(stored?.affiliateCode || "");
    const handleAttributionUpdated = (event: Event) => {
      const attribution = (event as CustomEvent<AffiliateAttribution>).detail;
      setReferralOffer(attribution);
      setCreatorCode(attribution.affiliateCode);
      setCreatorError("");
    };
    window.addEventListener(AFFILIATE_ATTRIBUTION_UPDATED_EVENT, handleAttributionUpdated);
    return () => window.removeEventListener(AFFILIATE_ATTRIBUTION_UPDATED_EVENT, handleAttributionUpdated);
  }, []);

  // Keep the referral disclosure open once a code is in play so an applied referral
  // stays visible instead of being hidden behind the collapsed control.
  React.useEffect(() => {
    if (referralOffer || creatorCode.trim()) {
      setShowCodes(true);
    }
  }, [referralOffer, creatorCode]);

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
    const updateStickyVisibility = () => {
      const checkoutArea = buttonRef.current;
      if (!checkoutArea) return;
      const { top } = checkoutArea.getBoundingClientRect();
      setIsCheckoutAreaFarBelow(top > window.innerHeight + STICKY_CHECKOUT_HIDE_DISTANCE);
    };

    updateStickyVisibility();
    window.addEventListener("scroll", updateStickyVisibility, { passive: true });
    window.addEventListener("resize", updateStickyVisibility);
    return () => {
      window.removeEventListener("scroll", updateStickyVisibility);
      window.removeEventListener("resize", updateStickyVisibility);
    };
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

  React.useEffect(() => {
    const normalizedCode = creatorCode.trim().toLowerCase();
    if (!normalizedCode || referralOffer?.affiliateCode === normalizedCode) {
      setCreatorLoading(false);
      return;
    }

    let cancelled = false;
    setCreatorError("");
    const timer = window.setTimeout(async () => {
      setCreatorLoading(true);
      try {
        const visitorId = getOrCreateVisitorId();
        const result = await api.applyCreatorCode({
          creatorCode: normalizedCode,
          visitorId,
          landingPath: window.location.pathname,
        });
        if (cancelled) return;
        if (!result.accepted || !result.referralToken || !result.claimCode || !result.attribution) {
          setReferralOffer(null);
          clearStoredAttribution();
          setCreatorError("That referral code is not active.");
          return;
        }
        storeAttribution({
          affiliateCode: result.attribution.affiliateCode,
          affiliateDisplayName: result.attribution.affiliateDisplayName,
          visitorId,
          clickId: result.attribution.clickId,
          referralToken: result.referralToken,
          claimCode: result.claimCode,
          expiresAt: result.attribution.expiresAt,
        });
      } catch {
        if (!cancelled) setCreatorError("Unable to check this referral code right now.");
      } finally {
        if (!cancelled) setCreatorLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, creatorCode, referralOffer?.affiliateCode]);

  React.useEffect(() => {
    if (
      creatorFieldTouchedRef.current
      || creatorCode.trim()
      || referralOffer
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        const result = await api.recoverCreatorOffer({
          email: normalizedEmail,
          visitorId,
          landingPath: window.location.pathname,
        });
        if (cancelled || !result.accepted || !result.referralToken || !result.claimCode || !result.attribution) return;
        storeAttribution({
          affiliateCode: result.attribution.affiliateCode,
          affiliateDisplayName: result.attribution.affiliateDisplayName,
          visitorId,
          clickId: result.attribution.clickId,
          referralToken: result.referralToken,
          claimCode: result.claimCode,
          expiresAt: result.attribution.expiresAt,
        });
      } catch {
        // A missing prior creator association is a normal direct checkout.
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, creatorCode, normalizedEmail, referralOffer]);

  const handleCheckout = async () => {
    if (!selectedPlanId || checkoutLocked) return;
    const plan = selectedPlan;
    if (!plan) return;
    window.dispatchEvent(new Event("rp-wallet:checkout-started"));
    const provider = paymentMethod === "card" ? "payblis" : "nowpayments";
    trackEvent("checkout_started", {
      plan: plan.id,
      price: getPlanDisplayPrice(plan),
      provider,
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
      let attribution = getStoredAttribution();
      const normalizedCreatorCode = creatorCode.trim().toLowerCase();
      if (normalizedCreatorCode && attribution?.affiliateCode !== normalizedCreatorCode) {
        const visitorId = getOrCreateVisitorId();
        const creatorResult = await api.applyCreatorCode({
          creatorCode: normalizedCreatorCode,
          visitorId,
          landingPath: window.location.pathname,
        });
        if (!creatorResult.accepted || !creatorResult.referralToken || !creatorResult.claimCode || !creatorResult.attribution) {
          clearSlowTimer();
          setCreatorError("That referral code is not active.");
          setCheckoutPhase("idle");
          return;
        }
        attribution = {
          affiliateCode: creatorResult.attribution.affiliateCode,
          affiliateDisplayName: creatorResult.attribution.affiliateDisplayName,
          visitorId,
          clickId: creatorResult.attribution.clickId,
          referralToken: creatorResult.referralToken,
          claimCode: creatorResult.claimCode,
          expiresAt: creatorResult.attribution.expiresAt,
        };
        storeAttribution(attribution);
      }

      const checkoutPayload = {
        planId: plan.id,
        email: normalizedEmail,
        referralToken: attribution?.referralToken,
      };
      const result = paymentMethod === "card"
        ? await api.createPayblisCheckout(checkoutPayload)
        : await api.createNowPaymentsCheckout(checkoutPayload);
      setCheckoutPhase("opening");
      trackEvent("checkout_url_ready", { plan: plan.id, provider });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      clearSlowTimer();
      const message = error instanceof Error ? error.message : "Please try again.";
      setCheckoutError(message);
      setCheckoutPhase("error");
      trackEvent("checkout_failed", { plan: plan.id, provider, error: message });
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

  const payMethodLabel = paymentMethod === "card" ? "Card" : "crypto";
  const providerLabel = paymentMethod === "card" ? "Payblis" : "NOWPayments";

  // Card | Crypto segmented control with a method-aware caption. Rendered above the pay
  // button in both the main block and the sticky bar; `compact` shrinks it for the sticky.
  const renderMethodToggle = (compact: boolean) => (
    <div className={compact ? "w-full" : "w-full"}>
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#8b5cf6]/25 bg-white/[0.04] p-1" role="tablist" aria-label="Payment method">
        {([
          { id: "card" as const, label: "Card", Icon: CreditCard },
          { id: "crypto" as const, label: "Crypto", Icon: null },
        ]).map(({ id, label, Icon }) => {
          const active = paymentMethod === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={checkoutLocked}
              onClick={() => {
                setPaymentMethod(id);
                trackEvent("payment_method_selected", { method: id, plan: selectedPlanId });
              }}
              className={`flex items-center justify-center gap-2 rounded-lg font-semibold transition-all ${compact ? "py-2 text-sm" : "py-2.5 text-[15px]"} ${active
                ? "bg-[#8b5cf6]/20 text-white ring-1 ring-[#a78bfa]/50 shadow-[0_0_16px_rgba(139,92,246,0.25)]"
                : "text-white/50 hover:text-white/80"
                }`}
            >
              {Icon ? (
                <Icon size={compact ? 15 : 17} className={active ? "text-[#c7bdff]" : "text-white/40"} />
              ) : (
                <BitcoinIcon className={compact ? "w-[15px] h-[15px]" : "w-[17px] h-[17px]"} />
              )}
              {label}
            </button>
          );
        })}
      </div>
      <p className={`text-center text-white/45 font-medium ${compact ? "mt-1.5 text-[11px]" : "mt-2 text-[12px]"}`}>
        {paymentMethod === "card" ? "Card, Apple Pay & Google Pay accepted" : "Pay with BTC, ETH, USDT & more"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen text-white selection:bg-[#9c8df6]/30 relative pb-24">
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
          <p className="mb-3 sl-font text-[11px] font-bold uppercase tracking-[0.35em] text-[#c084fc] drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
            [ Select your rank ]
          </p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold text-white mb-3">
            Choose Your <span className="bg-gradient-to-r from-[#d8b4fe] to-[#8b5cf6] bg-clip-text text-transparent">Plan</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-[400px] mx-auto leading-relaxed">
            Complete checkout, receive unique key and unlock instant access - no subscriptions.
          </p>
          {referralOffer && (
            <div className="mx-auto mt-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Referral code applied
            </div>
          )}
        </div>

        {/* ── I N T E R A C T I V E  P R I C I N G  G R I D ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-stretch mb-16 relative">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isStarter = plan.id === "starter";
            const isPopular = plan.id === "popular";
            const isYearly = plan.id === "yearly";
            const displayPrice = getPlanDisplayPrice(plan);
            const showOriginalPrice = Boolean(isYearly && plan.originalPrice);
            const referralBonus = referralOffer ? getReferralBonusDays(plan.id) : 0;

            const bgGradient = isSelected
              ? isYearly
                ? "linear-gradient(180deg, rgba(253,224,71,0.12) 0%, rgba(8,10,26,0.92) 55%)"
                : "linear-gradient(180deg, rgba(139,92,246,0.16) 0%, rgba(8,10,26,0.92) 55%)"
              : "linear-gradient(180deg, rgba(28,17,58,0.6) 0%, rgba(13,8,30,0.9) 100%)";

            const borderColor = isSelected
              ? isYearly
                ? "rgba(253,224,71,0.5)"
                : "rgba(167,139,250,0.55)"
              : "rgba(139,92,246,0.2)";

            const glowShadow = isSelected
              ? isYearly
                ? "0 0 50px rgba(253,224,71,0.25)"
                : "0 0 50px rgba(139,92,246,0.3)"
              : "0 4px 24px rgba(0,0,0,0.25)";

            const rank = PLAN_RANKS[plan.id];

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
                className={`backdrop-blur-xl p-10 flex flex-col relative transition-all duration-300 rounded-[8px] outline-none group/glass-card ${checkoutLocked ? "cursor-wait pointer-events-none opacity-50 saturate-50" : "cursor-pointer"} ${!isSelected && "opacity-70"}`}
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
                {isSelected && <Corners className={isYearly ? "!border-[#fde047]/60" : "!border-[#c4b5fd]/60"} />}

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
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 sl-font text-[10px] font-bold tracking-[0.25em] uppercase rounded-[4px] whitespace-nowrap transition-all duration-300 z-20 ${isSelected ? "border border-[#c4b5fd]/50 bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "border border-white/10 bg-white/10 text-white/60"}`}>
                    Most Popular
                  </div>
                )}
                {isYearly && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 sl-font text-[10px] font-bold tracking-[0.25em] uppercase rounded-[4px] whitespace-nowrap transition-all duration-300 z-20 ${isSelected ? "bg-gradient-to-r from-[#fde047] via-[#d4af37] to-[#ca8a04] text-black shadow-[0_5px_15px_rgba(212,175,55,0.4)]" : "border border-white/10 bg-white/10 text-white/60"}`}>
                    Best Value
                  </div>
                )}

                <div className="relative z-10 mb-4 flex flex-col items-center gap-1.5 text-center">
                  <span
                    className="sl-font text-[11px] font-bold uppercase tracking-[0.3em]"
                    style={isSelected ? { color: rank.color, textShadow: `0 0 12px ${rank.color}66` } : { color: "rgba(255,255,255,0.4)" }}
                  >
                    {rank.label}
                  </span>
                  <span className="text-white/80 font-medium text-lg">{isStarter ? "7 Days Access" : isPopular ? "1 Month Access" : "1 Year Access"}</span>
                </div>

                {referralBonus > 0 && (
                  <div className="relative z-10 mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center text-sm font-bold text-emerald-300">
                    +{referralBonus} bonus days included
                  </div>
                )}

                <div className="relative z-10 flex min-h-[60px] flex-col items-center justify-start mb-6 transition-all duration-300">
                  <div className="flex items-baseline justify-center gap-1">
                    {showOriginalPrice && <span className="relative text-2xl md:text-3xl font-display font-medium text-white/40 mr-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:-rotate-[20deg] after:bg-red-500">{plan.originalPrice}</span>}
                    <span className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">{displayPrice}</span>
                  </div>
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
            <span className="mb-2 block text-sm font-medium text-white/70">Email for license delivery <span className="text-rose-400">*</span></span>
            <div className="relative w-full rounded-xl overflow-hidden backdrop-blur-md">
              <input
                id="email-input"
                type="email"
                required
                aria-required="true"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="you@example.com"
                className="relative z-10 w-full rounded-xl px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:ring-2 focus:ring-[#c084fc]/30"
                style={{
                  background: "rgba(21, 14, 46, 0.6)",
                  border: "1px solid rgba(139, 92, 246, 0.35)",
                  boxShadow: [
                    "inset 0 1px 0 rgba(196,181,253,0.1)",
                    "inset 0 0 24px rgba(139,92,246,0.06)",
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
            type="button"
            onClick={() => setShowCodes((value) => !value)}
            aria-expanded={showCodes}
            className="flex w-full items-center justify-between rounded-xl border border-[#8b5cf6]/20 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white/90"
          >
            <span>Have a referral code?</span>
            <ChevronDown size={18} className={`text-white/50 transition-transform ${showCodes ? "rotate-180" : ""}`} />
          </button>
          {showCodes && (
          <label className="w-full">
            <span className="mb-2 block text-sm font-medium text-white/70">Referral code</span>
            <div className="relative">
              <input
                value={creatorCode}
                onChange={(event) => {
                  const value = event.target.value;
                  creatorFieldTouchedRef.current = true;
                  setCreatorCode(value);
                  setCreatorError("");
                  if (value.trim().toLowerCase() !== referralOffer?.affiliateCode) {
                    setReferralOffer(null);
                    clearStoredAttribution();
                  }
                }}
                placeholder="Referral code"
                className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/[0.04] px-4 py-3.5 pr-10 font-semibold lowercase tracking-wide text-white outline-none transition placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-white/30 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
              />
              {creatorLoading ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/50" /> : referralOffer ? <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-400" /> : null}
            </div>
          </label>
          )}
          {creatorError && (
            <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
              {creatorError}
            </div>
          )}
          {selectedReferralBonusDays > 0 && (
            <div className="w-full rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
              Referral offer applied: +{selectedReferralBonusDays} bonus days
            </div>
          )}
          {renderMethodToggle(false)}
          <button
            disabled={!selectedPlanId || checkoutLocked}
            onClick={handleCheckout}
            className={`relative z-10 w-full py-4 px-6 font-semibold transition-all flex justify-center items-center gap-2 text-lg cursor-pointer hover:scale-[1.02] ${!selectedPlanId
              ? "rounded-[6px] bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
              : checkoutPhase === "error"
                ? "rounded-[6px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : selectedPlanId === "yearly"
                  ? "sl-btn sl-btn-gold text-black animate-pulse"
                  : "sl-btn text-white"
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
            ) : paymentMethod === "card" ? (
              <>Pay {selectedPlanDisplayPrice} with Card <CreditCard className="w-5 h-5" /></>
            ) : (
              <>Pay {selectedPlanDisplayPrice} with crypto <BitcoinIcon className="w-5 h-5" /></>
            )}
          </button>

          {checkoutPhase === "error" && (
            <div className="text-red-400 text-sm -mt-2 text-center animate-pulse">
              {checkoutError || "Please try again."}
            </div>
          )}
          {isSlowCheckout && !checkoutError && (
            <div className="text-amber-400/80 text-sm -mt-2 text-center">
              {providerLabel} is taking a little longer. Please wait...
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-1 mb-2 text-white/70 text-[13px] font-medium">
            <Lock size={14} className="text-[#c084fc]" />
            <span>Secure checkout secured by {providerLabel}</span>
          </div>

          <p className="text-center text-[12px] text-white/40 max-w-[400px]">
            By completing your purchase, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white transition-colors">Terms & Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>.
          </p>
        </div>

        {/* <SupportTicketForm defaultEmail={normalizedEmail} /> */}

        {/* ── S U P P O R T  &  Q U E R I E S ── */}
        <div className="sl-window w-full max-w-[500px] mt-4 px-8 py-8 rounded-[8px] relative text-center mb-10">
          <Corners className="!border-[#a78bfa]/40" />
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
              background: "linear-gradient(to bottom, rgba(46, 30, 90, 0.35) 0%, rgba(10, 7, 20, 0.97) 100%)",
              borderTop: "1px solid rgba(139, 92, 246, 0.35)",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.12)",
            }}
          >
            {/* Top glow edge for the sticky bar */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#c084fc]/50 to-transparent pointer-events-none" />
            <div className="max-w-[440px] mx-auto">
              <label className="mb-3 block">
                <span className="sr-only">Email for license delivery (required)</span>
                <div className="relative w-full rounded-xl overflow-hidden backdrop-blur-md">
                  <input
                    id="sticky-email-input"
                    type="email"
                    required
                    aria-required="true"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="Email for license delivery *"
                    className="relative z-10 w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:ring-2 focus:ring-[#c084fc]/30"
                    style={{
                      background: "rgba(21, 14, 46, 0.6)",
                      border: "1px solid rgba(139, 92, 246, 0.35)",
                      boxShadow: [
                        "inset 0 1px 0 rgba(196,181,253,0.1)",
                        "inset 0 0 24px rgba(139,92,246,0.06)",
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
              {showCodes && (
              <div className="mb-3">
                <div className="relative">
                  <input
                    value={creatorCode}
                    onChange={(event) => {
                      const value = event.target.value;
                      creatorFieldTouchedRef.current = true;
                      setCreatorCode(value);
                      setCreatorError("");
                      if (value.trim().toLowerCase() !== referralOffer?.affiliateCode) {
                        setReferralOffer(null);
                        clearStoredAttribution();
                      }
                    }}
                    placeholder="Referral code"
                    className="w-full rounded-xl border border-emerald-400/25 bg-black/40 px-3 py-3 pr-9 text-sm font-semibold lowercase tracking-wide text-white outline-none transition placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-white/40 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
                  />
                  {creatorLoading ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/50" /> : referralOffer ? <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-400" /> : null}
                </div>
                {creatorError && <div className="mt-2 text-xs font-medium text-amber-300">{creatorError}</div>}
              </div>
              )}
              <div className="mb-3">{renderMethodToggle(true)}</div>
              <button
                disabled={!selectedPlanId || checkoutLocked}
                onClick={handleCheckout}
                className={`relative z-10 w-full py-4 px-6 font-semibold transition-all flex justify-center items-center gap-2 text-lg cursor-pointer hover:scale-[1.02] ${!selectedPlanId
                  ? "rounded-[6px] bg-white/5 text-white/40 border border-white/10 pointer-events-none cursor-not-allowed"
                  : checkoutPhase === "error"
                    ? "rounded-[6px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : selectedPlanId === "yearly"
                      ? "sl-btn sl-btn-gold text-black"
                      : "sl-btn text-white"
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
                  <>Pay {selectedPlanDisplayPrice} with crypto <BitcoinIcon className="w-5 h-5" /></>
                )}
              </button>

              {selectedReferralBonusDays > 0 && (
                <div className="mt-2 text-center text-xs font-semibold text-emerald-300">
                  +{selectedReferralBonusDays} referral bonus days included
                </div>
              )}

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
                <Lock size={12} className="text-[#c084fc]" />
                <span>Secure checkout via {providerLabel}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
