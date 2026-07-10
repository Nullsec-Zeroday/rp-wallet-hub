"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);


  return (
    <>
      <nav className="relative z-50 w-full animate-nav-entrance">
        <div className="mx-auto flex max-w-[1260px] items-center justify-between px-6 pb-6 pt-3 md:px-8">
          <Link href="/" className="group relative z-50 flex items-center gap-2">
            <div className="size-6 md:size-12">
              <Image
                src="/logo_white.webp"
                alt="RP Wallet Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-display text-[22px] font-bold tracking-tight text-white md:text-[26px]">
              RP<span className="text-[#c084fc]">Wallet</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            <Link href="https://t.me/rpwalletTG" target="_blank" rel="noopener noreferrer" className="font-medium text-[15px] text-white/80 transition-colors hover:text-[#ab9ff2]">
              Telegram
            </Link>
            <Link href="/#features" className="font-medium text-[15px] text-white/80 transition-colors hover:text-[#ab9ff2]">
              Features
            </Link>
            <Link href="/#pricing" className="font-medium text-[15px] text-white/80 transition-colors hover:text-[#ab9ff2]">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="sl-btn sl-btn-ghost group relative px-6 py-2 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <span className="relative z-10 tracking-wide">Log In</span>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            {/* Telegram mobile liquid glass button */}
            <a
              href="https://t.me/rpwalletTG"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "sl-chip relative h-7 px-3 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer mr-2 duration-200",
                isMobileMenuOpen ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <span className="relative z-10 font-semibold tracking-wide">Join Telegram</span>
              <ArrowUpRight size={13} className="text-white/60 relative z-10" />
            </a>

            <button
              className="relative z-50 p-2 text-white transition-colors hover:text-[#ab9ff2]"
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
              {isMobileMenuOpen ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center bg-[#0c0a18]/98 pt-40 backdrop-blur-md transition-all duration-300 md:hidden",
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex w-full flex-col items-center gap-8 p-6">
          <Link href="https://t.me/rpwalletTG" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-xl font-medium text-white/90 transition-colors hover:text-[#ab9ff2]">
            Telegram
          </Link>
          <Link href="/#features" className="cursor-pointer text-xl font-medium text-white/90 transition-colors hover:text-[#ab9ff2]">
            Features
          </Link>
          <Link href="/#pricing" className="cursor-pointer text-xl font-medium text-white/90 transition-colors hover:text-[#ab9ff2]">
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="group relative mt-6 flex h-12 w-full max-w-[280px] items-center justify-center overflow-hidden rounded-full backdrop-blur-xl transition-all active:scale-[0.97] hover:scale-[1.01] duration-200"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.2)",
                "inset 0 -1px 1px rgba(0,0,0,0.15)",
                "0 8px 20px rgba(0,0,0,0.3)",
                "0 0 0 0.5px rgba(255,255,255,0.08)",
                "0 0 25px rgba(171,159,242,0.12)",
              ].join(", "),
            }}
          >
            {/* Top specular highlight edge */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
            {/* Bottom subtle dark edge */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
            {/* Inner refraction glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03] pointer-events-none rounded-full" />
            {/* Hover glow highlight */}
            <div className="absolute inset-0 bg-[#ab9ff2]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

            <span className="relative z-10 text-[15px] font-semibold tracking-wide text-white">
              Activate Wallet
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
