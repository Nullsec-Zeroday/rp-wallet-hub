"use client";

import React from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/track";
import TryFreeButton from "./try-free-button";

export default function HeroButtons({ onOpenDemo }: { onOpenDemo?: () => void }) {
  const trackTelegramClick = () => {
    trackEvent("clicked_join_telegram");
  };

  return (
    <div className="flex flex-col mb-8 max-w-lg ">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 w-full ">
        <TryFreeButton />
        <Link
          href="https://t.me/rpwalletchannel"
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackTelegramClick}
          className="relative overflow-hidden w-full sm:w-[280px] h-12 md:h-14 px-6 sm:px-8 rounded-xl flex cursor-pointer items-center justify-center gap-2.5 text-[16px] sm:text-[17px] font-medium text-white bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-xl transition-all group hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-110 relative z-10"><circle cx="12" cy="12" r="12" fill="white"></circle><path d="M5.44005 11.51L17.26 6.95001C17.81 6.75001 18.29 7.08001 18.11 7.85001L16.09 17.36C15.94 18.02 15.55 18.18 15 17.87L11.98 15.65L10.52 17.06C10.36 17.22 10.22 17.36 9.90005 17.36L10.12 14.28L15.73 9.21001C15.97 8.99001 15.68 8.87001 15.36 9.08001L8.43005 13.44L5.43005 12.5C4.78005 12.3 4.79005 11.85 5.57005 11.54L5.44005 11.51Z" fill="#181824"></path></svg>
          <span className="relative z-10">Join Telegram</span>
        </Link>
      </div>
    </div >
  );
}
