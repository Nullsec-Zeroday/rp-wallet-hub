"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/marketing/fade-in";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
          </div>
        </FadeIn>

        <div className="space-y-12">
          <FadeIn delay={100} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">1. Introduction</h2>
              <div className="space-y-4 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>
                  RPWallet ("we," "us," or "our") operates the RPWallet progressive web application (PWA) and the website located at rpwallet.app (collectively, the "Service"). This Privacy Policy explains how we collect, use, and protect information when you use our Service.
                </p>
                <p>
                  RPWallet is a novelty entertainment application. It is <strong>not</strong> a real cryptocurrency wallet. It does not hold, send, receive, or interact with any real cryptocurrency, blockchain, or digital asset. We are <strong>not affiliated with Phantom, Solana Labs, Ledger SAS, Trust, Binance, or any other wallet provider or blockchain project</strong>.
                </p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={200} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">2. Information We Collect</h2>
              <div className="space-y-6 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>RPWallet is designed with privacy in mind. We collect the absolute minimum information needed to operate the Service:</p>
                <ul className="space-y-4 list-none">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">License Key Data:</strong> When you activate a license, we store the license key and its activation status. This is required to verify your access to the app.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">Payment Information:</strong> Payments are processed exclusively via cryptocurrency through our third-party provider, <strong>NOWPayments</strong>. We do not collect credit card numbers, bank details, or traditional payment information. NOWPayments may retain transaction and wallet information associated with your purchase for payment processing and verification.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">Telegram Contact Information:</strong> If you contact us or purchase through Telegram, we may retain your Telegram username and conversation history for customer support purposes.
                    </span>
                  </li>
                </ul>
                <div className="pt-4 mt-4 border-t border-white/[0.05]">
                  <p className="mb-4 text-white font-semibold">We do NOT collect:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
                    {["Seed phrases or private keys", "Real wallet tracking data", "Identification documents", "Biometric or location data", "Contact lists or phone data"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-red-400/80">
                        <X size={14} className="shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={300} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">3. How the App Works</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                RPWallet is delivered as a Progressive Web App (PWA). This means it is installed through your device's web browser and runs locally on your device. Custom balances, token selections, and other configurations you set within the app are stored locally on your device and are not transmitted to our servers.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={400} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">4. How We Use Information</h2>
              <div className="space-y-4 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>Any information we collect is used solely to:</p>
                <ul className="space-y-3">
                  {["Validate and manage license keys", "Provide customer support via Telegram", "Verify cryptocurrency payments", "Improve and maintain the Service"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="pt-4 border-t border-white/[0.05] text-white font-medium">
                  We do <strong className="text-white">not</strong> sell, rent, or share your information with third-party advertisers or data brokers.
                </p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={500} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">5. Data Storage & Security</h2>
              <div className="space-y-4 text-[16px] text-[#A1A1AA] leading-relaxed">
                <p>
                  We take reasonable measures to protect the information we hold. License key data is stored securely and access is restricted. Because the app is a PWA, the majority of your usage data stays on your device and never reaches us.
                </p>
                <p>
                  No method of electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={600} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">6. Cookies & Tracking</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                The rpwallet.app website may use minimal cookies or local storage for functional purposes such as session management. We do not use third-party advertising trackers. We may use basic, anonymized analytics to understand overall site traffic.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={700} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">7. Third-Party Services</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                The Service uses <strong>NOWPayments</strong> to process cryptocurrency payments. License keys are generated by RPWallet and delivered through our email provider after payment confirmation. These third-party services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of any third-party platform.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={800} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">8. Children's Privacy</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                RPWallet is not intended for use by anyone under the age of 18. We do not knowingly collect information from minors. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={900} direction="up">
            <section className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-8 md:p-10 backdrop-blur-xl">
              <h2 className="text-[20px] font-bold text-white mb-6 tracking-tight">9. Changes to This Policy</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={1000} direction="up">
            <section className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-[24px] p-8 md:p-10 backdrop-blur-xl text-center">
              <h2 className="text-[20px] font-bold text-white mb-4 tracking-tight">10. Contact Us</h2>
              <p className="text-[16px] text-[#A1A1AA] leading-relaxed mb-8">
                If you have any questions about this Privacy Policy, you can reach us on Telegram for instant support.
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

function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
