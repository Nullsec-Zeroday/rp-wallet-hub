"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MadeInUsaBadge from "./made-in-usa-badge";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/buy") return null;

  return (
    <footer className="w-full relative z-10 px-6 pb-12 overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-16 relative z-10">
        <div className="w-full max-w-4xl mx-auto border border-[#d4af37]/20 bg-[#d4af37]/[0.03] rounded-3xl p-6 md:p-8 text-center shadow-lg">
          <p className="text-[#d4af37]/80 text-[14px] md:text-[15px] leading-relaxed font-medium">
            <span className="text-[#d4af37] font-bold">⚠️ Disclaimer:</span> RPWallet is a novelty app for entertainment purposes only. It is not a real cryptocurrency wallet and does not hold, send, or receive any real crypto assets. Not affiliated with Phantom, Ledger, Trust, Binance, or Solana Labs.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-16 md:gap-12 text-center md:text-left">
          <div className="max-w-xs flex flex-col items-center md:items-start">
            <h4 className="font-display text-2xl font-medium leading-tight text-white mb-4">
              Built for the flex.<br />
            </h4>
            <p className="text-[13px] text-white/30 leading-relaxed max-w-[280px] md:max-w-none">
              The world&apos;s most realistic crypto wallet simulator, engineered for creators and roleplay.
              <br />
              <span className="text-white/20">No personal data collected on-site.</span>
            </p>
            {/* <MadeInUsaBadge className="mt-8 mb-4 opacity-80 hover:opacity-100 transition-opacity" /> */}
            <div className="text-[12px] text-white/10 font-medium tracking-wide">
              © {new Date().getFullYear()} RPWallet.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-10 md:gap-16 text-[13px] w-full md:w-auto">
            <div className="flex flex-col gap-4">
              <span className="text-white/80 font-bold uppercase tracking-widest text-[11px]">Product</span>
              <Link href="/buy" className="text-white/40 hover:text-white transition-colors">Pricing</Link>
              <Link href="/blog" className="text-white/40 hover:text-white transition-colors">Blog</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white/80 font-bold uppercase tracking-widest text-[11px]">Simulators</span>
              <Link href="/wallet-simulator" className="text-white/40 hover:text-white transition-colors">Phantom Wallet Simulator</Link>
              <Link href="/wallet-mockup" className="text-white/40 hover:text-white transition-colors">Fake Phantom Wallet</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white/80 font-bold uppercase tracking-widest text-[11px]">Socials</span>
              <Link href="https://t.me/rpwalletTG" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">Telegram</Link>
            </div>
            <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <span className="text-white/80 font-bold uppercase tracking-widest text-[11px]">Legal</span>
              <div className="flex flex-row sm:flex-col gap-4 justify-center sm:justify-start mt-1 sm:mt-0">
                <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
