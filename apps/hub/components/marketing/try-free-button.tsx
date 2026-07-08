"use client";

import React from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Wallet2, WalletCards } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/track";
export default function TryFreeButton({
  className,
  wrapperClassName,
  label: labelOverride,
}: {
  className?: string;
  wrapperClassName?: string;
  label?: string;
}) {
  const demoEnabled = process.env.NEXT_PUBLIC_FREE_DEMO_ENABLED === "true";
  const href = demoEnabled ? "/dashboard" : "/#pricing";
  const label = labelOverride || (demoEnabled ? "Try Free Now" : "Get Wallet Access");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("clicked_get_rpwallet", {
      path: window.location.pathname,
      target: href,
      demoEnabled,
      landing_copy_variant: "control",
    });

    if (demoEnabled) return;

    if (window.location.pathname === "/") {
      e.preventDefault();
      const pricingSection = document.getElementById("pricing");
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/#installation";
      }
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97, y: 1 }} className={wrapperClassName}>
      {/* Outer glow wrapper for the spinning border shine */}
      <div className="relative w-full rounded-[28px] p-[2px] group/btn">
        {/* Animated spinning border shine */}
        {/* <div
          className="absolute inset-[-1px] rounded-[28px] z-0 opacity-60 group-hover/btn:opacity-100 transition-opacity duration-500"
          style={{
            background: "conic-gradient(from var(--shine-angle, 0deg), transparent 0%, transparent 30%, rgba(255,255,255,0.6) 45%, rgba(171,159,242,0.9) 50%, rgba(255,255,255,0.6) 55%, transparent 70%, transparent 100%)",
            animation: "border-spin 3s linear infinite",
          }}
        /> */}
        {/* Glow behind button */}
        {/* <div className="absolute inset-0 rounded-[28px] z-0 blur-xl opacity-40 group-hover/btn:opacity-60 transition-opacity duration-500 bg-gradient-to-r from-ph4ntom-purple via-ph4ntom-accent to-ph4ntom-purple" /> */}

        <Link
          href={href}
          onClick={handleClick}
          className={`relative z-10 overflow-hidden w-full h-12 md:h-14 px-4 sm:px-8 rounded-[26px] flex cursor-pointer items-center justify-center gap-2.5 text-[15px] sm:text-[17px] font-bold text-white whitespace-nowrap transition-all duration-200 group ${className || ""}`}
          style={{
            background: "linear-gradient(180deg, #9b7bff 0%, #7c3aed 40%, #6d28d9 100%)",

          }}
        >
          {/* Top highlight edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          {/* Inner top glow */}
          <div className="absolute inset-x-4 top-0 h-6 bg-gradient-to-b from-white/[0.12] to-transparent rounded-t-[26px] pointer-events-none" />

          {/* Shimmer sweep */}
          <motion.div
            initial={{ x: "-150%" }}
            animate={{ x: "150%" }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.19, 1, 0.22, 1],
              repeatDelay: 2,
            }}
            className="absolute inset-0 z-0 pointer-events-none skew-x-[-25deg]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent w-full" />
          </motion.div>

          {/* Bottom dark edge for 3D depth */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/30" />

          <div className="relative z-10 flex items-center gap-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            {demoEnabled ? (
              <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
            ) : (
              <ArrowDown size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
            )}
            <span className="truncate tracking-tight">{label}</span>
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @property --shine-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes border-spin {
          to {
            --shine-angle: 360deg;
          }
        }
      `}</style>
    </motion.div>
  );
}
