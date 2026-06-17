"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
            <span className="text-[20px] font-bold tracking-tight text-white md:text-2xl">
              RP<span className="text-[#ab9ff2]">Wallet</span>
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
              className="group relative overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-6 py-2 text-[14px] font-medium text-white backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-[#ab9ff2]/40 hover:shadow-[0_0_20px_rgba(171,159,242,0.15)] hover:-translate-y-0.5 active:scale-95"
            >
              <span className="relative z-10 tracking-wide">Log In</span>
            </Link>
          </div>

          <button
            className="relative z-50 p-2 text-white transition-colors hover:text-[#ab9ff2] md:hidden"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
          </button>
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
            className="group relative mt-4 flex w-full max-w-[280px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-10 py-4 text-xl font-medium text-white backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-[#ab9ff2]/40 hover:shadow-[0_0_20px_rgba(171,159,242,0.15)] active:scale-95"
          >
            <span className="relative z-10 tracking-wide">Log In</span>
          </Link>
        </div>
      </div>
    </>
  );
}
