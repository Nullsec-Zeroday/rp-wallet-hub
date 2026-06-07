"use client";

import React from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Wallet2, WalletCards } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/track";

export default function TryFreeButton({ className, wrapperClassName }: { className?: string, wrapperClassName?: string }) {
  const demoEnabled = process.env.NEXT_PUBLIC_FREE_DEMO_ENABLED === "true";
  const href = demoEnabled ? "/dashboard" : "/#installation";
  const label = demoEnabled ? "Try Free Now" : "Get App Access";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("clicked_get_rpwallet", {
      path: window.location.pathname,
      target: href,
      demoEnabled,
    });

    if (demoEnabled) return;

    if (window.location.pathname === "/") {
      e.preventDefault();
      const installationSection = document.getElementById("installation");
      if (installationSection) {
        installationSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/#installation";
      }
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className={wrapperClassName}>
      <Link
        href={href}
        onClick={handleClick}
        className={`relative overflow-hidden w-full sm:w-[240px] h-12 md:h-14 px-4 sm:px-8 rounded-xl flex cursor-pointer items-center justify-center gap-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-gradient-to-r from-ph4ntom-purple to-ph4ntom-accent border border-white/20 transition-all group whitespace-nowrap ${className || ""}`}
      >
        <motion.div
          initial={{ x: "-150%" }}
          animate={{ x: "150%" }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: [0.19, 1, 0.22, 1],
            repeatDelay: 1,
          }}
          className="absolute inset-0 z-0 pointer-events-none skew-x-[-30deg]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent w-full" />
          <div className="absolute inset-0 flex justify-center">
            <div className="h-full w-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent blur-[4px]" />
            <div className="h-full w-px bg-white/10" />
          </div>
        </motion.div>

        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex items-center gap-2.5">
          {demoEnabled ? (
            <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          ) : (
            <ArrowDown size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          )}
          <span className="truncate tracking-tight">{label}</span>
        </div>
      </Link>
    </motion.div>
  );
}
