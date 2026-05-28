"use client";

import React, { Suspense } from "react";
import { Check, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PRICING_PLANS } from "@/lib/pricing-config";
import { useSellAuthEmbed } from "@/hooks/useSellAuthEmbed";

const PLANS = Object.values(PRICING_PLANS);

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0c0c]" />}>
      <BuyContent />
    </Suspense>
  );
}

function BuyContent() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("error") === "expired";
  const { checkout, isLoading, modal: checkoutModal, captcha } = useSellAuthEmbed();
  const shopId = Number(process.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID || 234704);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-phantom-purple/30 relative pb-24">
      {isExpired && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/10 border-b border-red-500/20 backdrop-blur-md py-3 px-6 flex justify-center items-center">
          <p className="text-red-400 text-sm font-medium">Your license key has expired. Please choose a new plan to continue.</p>
        </div>
      )}

      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-12 flex flex-col items-center">
        {/* ── H E A D E R ── */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-phantom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <h1 className="font-display text-5xl md:text-7xl font-medium text-white tracking-tight leading-[1.1] mb-6">
            Choose your plan.
          </h1>
          <p className="text-phantom-purple/60 text-lg md:text-xl font-light max-w-xl mx-auto mb-10">
            Select a package and get your license key delivered instantly after payment.
          </p>

        </div>

        {/* ── I N T E R A C T I V E  P R I C I N G  G R I D ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-phantom-purple/5 blur-[120px] rounded-full pointer-events-none -z-10" />

          {PLANS.map((plan) => {
            const hasEmbedConfig = 
              plan.sellauthProductId && 
              plan.sellauthVariantId && 
              plan.sellauthProductId > 0 && 
              plan.sellauthVariantId > 0;

            const handlePlanClick = (e: React.MouseEvent) => {
              if (isLoading) {
                e.preventDefault();
                return;
              }
              if (hasEmbedConfig) {
                e.preventDefault();
                checkout({
                  cart: [{ productId: plan.sellauthProductId!, variantId: plan.sellauthVariantId!, quantity: 1 }],
                  shopId,
                });
              }
            };

            return (
              <a
                key={plan.id}
                href={isLoading ? undefined : plan.buyUrl}
                target={hasEmbedConfig ? undefined : "_blank"}
                rel={hasEmbedConfig ? undefined : "noopener noreferrer"}
                onClick={handlePlanClick}
                tabIndex={isLoading ? -1 : undefined}
                className={`text-left rounded-[2rem] p-12 md:p-14 flex flex-col relative z-10 transition-all duration-500 outline-none glass-panel border-white/10 group cursor-pointer hover:bg-white/[0.04] hover:border-phantom-purple/50 hover:ring-1 hover:ring-phantom-purple/20 hover:shadow-[0_30px_60px_rgba(171,159,242,0.15)] hover:scale-[1.02] ${
                  isLoading ? "pointer-events-none opacity-80" : ""
                }`}
              >
                <div className="flex flex-col items-center mb-10 w-full text-center">
                  <span
                    className={`px-5 py-2 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full mb-10 transition-all duration-300 ${plan.popular
                      ? "bg-phantom-purple text-white shadow-[0_0_20px_rgba(171,159,242,0.4)]"
                      : "bg-white/5 text-white/40 border border-white/10 group-hover:bg-phantom-purple group-hover:text-white group-hover:shadow-[0_0_20px_rgba(171,159,242,0.4)] group-hover:border-transparent"
                      }`}
                  >
                    {plan.badgeText}
                  </span>
                  <div className="flex items-baseline justify-center gap-3 mb-3">
                    {plan.originalPrice && (
                      <span className="text-4xl font-display text-white/30 line-through">{plan.originalPrice}</span>
                    )}
                    <div className="text-6xl font-display text-white tracking-tighter leading-none">{plan.price}</div>
                  </div>
                  <div className="text-[15px] text-white/40 font-medium">{plan.duration}</div>
                </div>

                <ul className="w-full flex-1 flex flex-col gap-5 mb-14 text-[15px]">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-4 text-white/60">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-phantom-purple shrink-0 opacity-80" />
                      ) : (
                        <div className="w-5 h-5 shrink-0 flex items-center justify-center text-xl mt-[-2px] text-white/20">&times;</div>
                      )}
                      <span className={`${feature.included ? "text-white/80" : "text-white/30 italic"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Buy CTA at bottom of each card */}
                <div className="mt-auto w-full">
                  <div className="w-full py-5 bg-phantom-purple/10 border border-phantom-purple/20 group-hover:bg-phantom-purple group-hover:border-phantom-purple text-white rounded-2xl flex items-center justify-center text-base font-bold gap-3 transition-all duration-300">
                    {isLoading ? (
                      <>
                        <span>Preparing checkout...</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 animate-spin text-white"
                          fill="currentColor"
                          viewBox="0 0 256 256"
                        >
                          <path d="M232,128a104,104,0,0,1-208,0c0-41,23.81-78.36,60.66-95.27a8,8,0,0,1,6.68,14.54C60.15,61.59,40,93.27,40,128a88,88,0,0,0,176,0c0-34.73-20.15-66.41-51.34-80.73a8,8,0,0,1,6.68-14.54C208.19,49.64,232,87,232,128Z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Get Access <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* ── H O W  I T  W O R K S ── */}
        <div className="w-full max-w-[800px] mb-20">
          <div className="text-[11px] font-bold tracking-[0.3em] text-white/30 uppercase mb-10 text-center">
            HOW IT WORKS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose a Plan", desc: "Select the package that fits your needs above." },
              { step: "02", title: "Complete Payment", desc: "Pay securely via crypto on SellAuth's checkout page." },
              { step: "03", title: "Get Your Key", desc: "Your license key is generated and delivered instantly." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4 p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <span className="text-phantom-purple text-3xl font-display font-medium tracking-tighter">{item.step}</span>
                <h3 className="text-white text-lg font-semibold">{item.title}</h3>
                <p className="text-white/40 text-[14px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── S U P P O R T  &  Q U E R I E S ── */}
        <div className="w-full max-w-[800px] mt-12 px-8 py-16 rounded-[2.5rem] border border-white/5 bg-white/[0.01] relative overflow-hidden group text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-phantom-purple/5 blur-[80px] rounded-full pointer-events-none" />
          <h3 className="text-3xl font-display font-medium text-white mb-4 relative z-10">Still have questions?</h3>
          <p className="text-white/40 text-[16px] leading-relaxed max-w-lg mx-auto mb-10 relative z-10">
            Whether you need help with payment, have a feature request, or just want to say hi—we're here to help. Reach out to our team directly on Telegram for instant support.
          </p>
          <a
            href="https://t.me/RPWallet_support_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 text-[#AB9FF2] font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 relative z-10 shadow-2xl"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="currentColor" className="opacity-10" />
              <path d="M5.44005 11.51L17.26 6.95001C17.81 6.75001 18.29 7.08001 18.11 7.85001L16.09 17.36C15.94 18.02 15.55 18.18 15 17.87L11.98 15.65L10.52 17.06C10.36 17.22 10.22 17.36 9.90005 17.36L10.12 14.28L15.73 9.21001C15.97 8.99001 15.68 8.87001 15.36 9.08001L8.43005 13.44L5.43005 12.5C4.78005 12.3 4.79005 11.85 5.57005 11.54L5.44005 11.51Z" fill="currentColor" />
            </svg>
            Chat with Support
          </a>
        </div>
      </main>

      {captcha}
      {checkoutModal}
    </div>
  );
}
