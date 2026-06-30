"use client";

import React from "react";
import { trackEvent } from "@/lib/track";
import TryFreeButton from "./try-free-button";
export default function HeroButtons({
  onOpenDemo: _onOpenDemo,
}: {
  onOpenDemo?: () => void;
}) {
  return (
    <div className="flex flex-col mb-8 w-full max-w-lg px-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 w-full">
        <TryFreeButton
          wrapperClassName="w-full sm:w-[280px]"
          className="!w-full"
        />
        <a
          href="https://t.me/rpwalletTG"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("clicked_join_telegram")}
          className="relative overflow-hidden w-full sm:w-[280px] h-12 md:h-14 px-4 sm:px-8 rounded-full flex cursor-pointer items-center justify-center gap-2.5 text-[15px] sm:text-[17px] font-medium text-white backdrop-blur-xl transition-all group/glass-btn hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.15)",
              "inset 0 -1px 1px rgba(0,0,0,0.1)",
              "0 4px 20px rgba(0,0,0,0.25)",
              "0 1px 2px rgba(0,0,0,0.15)",
              "0 0 0 0.5px rgba(255,255,255,0.08)",
            ].join(", "),
          }}
        >
          {/* Top specular highlight edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {/* Bottom subtle dark edge */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          {/* Inner refraction glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-full" />
          {/* Hover shine sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/glass-btn:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
          {/* Hover ambient highlight overlay */}
          <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/glass-btn:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover/glass-btn:scale-110 relative z-10 shrink-0"><circle cx="12" cy="12" r="12" fill="white"></circle><path d="M5.44005 11.51L17.26 6.95001C17.81 6.75001 18.29 7.08001 18.11 7.85001L16.09 17.36C15.94 18.02 15.55 18.18 15 17.87L11.98 15.65L10.52 17.06C10.36 17.22 10.22 17.36 9.90005 17.36L10.12 14.28L15.73 9.21001C15.97 8.99001 15.68 8.87001 15.36 9.08001L8.43005 13.44L5.43005 12.5C4.78005 12.3 4.79005 11.85 5.57005 11.54L5.44005 11.51Z" fill="#181824"></path></svg>
          <span className="relative z-10">Join Telegram</span>
        </a>
      </div>
    </div>
  );
}
