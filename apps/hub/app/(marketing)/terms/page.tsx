"use client";

import React from "react";
import { ArrowLeft, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/marketing/fade-in";
import { PRICING_PLANS } from "@/lib/pricing-config";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0C0814] text-white font-sans overflow-x-hidden selection:bg-[#8B5CF6] selection:text-white relative flex flex-col items-center">

      {/* ── FIXED BACKGROUND: BLOBS & GRAIN ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] opacity-40 blur-[120px] rounded-full" style={{ backgroundImage: "radial-gradient(circle at center, #4C1D95 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] opacity-30 blur-[100px] rounded-full" style={{ backgroundImage: "radial-gradient(circle at center, #8B5CF6 0%, transparent 70%)" }} />
      </div>

      {/* ── M A I N   C O N T E N T ── */}
      <main className="relative z-10 w-full max-w-[800px] px-6 pt-32 pb-32">

        <FadeIn direction="up">
          <div className="flex flex-col items-center text-center mb-16">
            <h1 className="text-[40px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-4">
              Terms & Conditions
            </h1>
          </div>
        </FadeIn>

        <div className="space-y-12">
          <FadeIn delay={100} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">1. Acceptance of Terms</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                By accessing, purchasing, or using RPWallet (the "Service"), including the website at rpwallet.app and the RPWallet progressive web application (PWA), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree with any part of these Terms, you must not use the Service.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={200} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">2. Nature of the Service</h2>
              <div className="space-y-6 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>RPWallet is a <strong>novelty entertainment application</strong> designed for fun and social purposes only. It allows users to set custom, fictional cryptocurrency balances for display purposes.</p>

                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-5 flex gap-4">
                  <AlertTriangle className="text-[#F59E0B] shrink-0 mt-1" size={20} />
                  <p className="text-[14px] text-[#FCD34D]/90">
                    <strong className="text-[#F59E0B]">Important:</strong> RPWallet is NOT a real cryptocurrency wallet. It does not hold, send, receive, store, or interact with any real cryptocurrency, token, coin, blockchain, or digital asset. Any balances displayed in the app are entirely fictional and have no monetary value.
                  </p>
                </div>

                <p>
                  We are <strong>not affiliated with, endorsed by, or connected to Ph4ntom, Solana Labs, Solana Foundation, Ledger SAS, Tru5t, Binance, or any other wallet provider, blockchain project, cryptocurrency exchange, or financial institution</strong>. Any visual similarities to existing wallet interfaces are for entertainment and parody purposes only.
                </p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={300} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">3. Eligibility</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                You must be at least 18 years of age to purchase or use RPWallet. By using the Service, you represent and warrant that you meet this age requirement.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={400} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">4. License & Access</h2>
              <div className="space-y-6 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>Upon completing a valid purchase, you are granted a limited, non-exclusive, non-transferable, revocable license to use the RPWallet app for personal entertainment purposes, subject to the plan you purchased:</p>

                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span><strong className="text-white text-[15px]">{PRICING_PLANS.starter.name} Plan ({PRICING_PLANS.starter.price}):</strong> 7 days of access from the date of activation.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span><strong className="text-white text-[15px]">{PRICING_PLANS.popular.name} Plan ({PRICING_PLANS.popular.price}):</strong> 1 month of access from the date of activation.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span><strong className="text-white text-[15px]">{PRICING_PLANS.yearly.name} Plan ({PRICING_PLANS.yearly.price}):</strong> 1 year of access from the date of activation.</span>
                  </li>
                </ul>

                <p>The app is delivered as a Progressive Web App (PWA), which you install through your mobile device's web browser. Access is controlled by a unique license key provided after purchase.</p>
                <p>You may not share, redistribute, resell, sublicense, reverse-engineer, decompile, or modify the application or your license key. We reserve the right to revoke access at any time if these Terms are violated.</p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={500} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">5. Payments & Pricing</h2>
              <div className="space-y-4 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>All payments for RPWallet are processed securely through <strong>SellAuth</strong> and are payable exclusively in cryptocurrency. We do not accept credit cards, debit cards, bank transfers, PayPal, or any other traditional payment method at this time.</p>
                <p>
                  Purchases are facilitated through our official website (rpwallet.app) via SellAuth, or through authorized retailers listed on our website. Prices are displayed in USD but are payable in the cryptocurrency equivalent at the time of purchase.
                </p>
                <p>You are solely responsible for ensuring that you send the correct amount to the correct wallet address provided during the SellAuth checkout process. We are not responsible for funds sent to incorrect addresses or for blockchain network fees.</p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={600} direction="up">
            <section className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">6. Refund Policy</h2>
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-5 flex gap-4 mb-6">
                <AlertTriangle className="text-[#EF4444] shrink-0 mt-1" size={20} />
                <p className="text-[14px] text-[#FCA5A5]/90 font-bold uppercase tracking-tight">
                  All sales are final. We do not offer refunds, exchanges, chargebacks, or credits under any circumstances.
                </p>
              </div>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                Due to the digital nature of the product and the use of cryptocurrency payments, all purchases are considered final and non-refundable. By completing a purchase, you acknowledge and accept this no-refund policy.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={700} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">8. Acceptable Use</h2>
              <div className="space-y-4 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>You agree to use RPWallet only for lawful entertainment purposes. You may <strong>not</strong> use the Service to:</p>
                <ul className="space-y-3">
                  {["Commit fraud, scam, or deceive any entity", "Impersonate a real wallet for financial gain", "Violate any local or international laws", "Engage in any harmful or damaging activity"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <X size={16} className="text-red-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="pt-4 border-t border-white/[0.05]">
                  You are solely responsible for how you use the app. RPWallet is intended as a novelty product — using it to deceive or defraud others is strictly prohibited and may result in immediate license revocation without refund.
                </p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={800} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl text-center">
              <h2 className="text-[20px] font-bold text-white mb-4 tracking-tight">Contact</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed mb-8">
                For any questions regarding these Terms, please contact us via Telegram for instant support.
              </p>
              <a
                href="https://t.me/RPWallet_support_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-3 px-8 bg-[#8B5CF6] hover:bg-[#7e53de] rounded-xl text-[15px] font-bold text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Message @RPWallet_support_bot
              </a>
            </section>
          </FadeIn>
        </div>

        {/* ── BACK BUTTON ── */}
        <div className="mt-20 flex justify-center">
          <Link
            href="/"
            className="group flex items-center gap-2.5 py-3 px-6 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[15px] font-medium text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-all duration-300"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Back to Overview
          </Link>
        </div>
      </main>
    </div>
  );
}
