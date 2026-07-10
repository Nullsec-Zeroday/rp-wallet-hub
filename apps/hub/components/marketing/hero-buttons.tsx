"use client";

import React from "react";
import { trackEvent } from "@/lib/track";
import TryFreeButton from "./try-free-button";

export default function HeroButtons({
  onOpenDemo: _onOpenDemo,
}: {
  onOpenDemo?: () => void;
}) {
  const handleWatchDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent("clicked_watch_demo");

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      e.preventDefault();
      const videoId = "NCzGYciHVAI";
      const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const androidAppUrl = `intent://www.youtube.com/watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
      window.location.href = androidAppUrl;
    }
  };

  return (
    <div className="flex flex-col mb-8 w-full max-w-lg px-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 w-full">
        <TryFreeButton
          wrapperClassName="w-full sm:w-[280px]"
          className="!w-full"
        />
        <a
          href="https://youtu.be/NCzGYciHVAI"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWatchDemo}
          className="sl-btn sl-btn-ghost relative w-full sm:w-[280px] h-12 md:h-14 px-4 sm:px-8 flex cursor-pointer items-center justify-center gap-2.5 text-[15px] sm:text-[17px] font-semibold text-white backdrop-blur-xl transition-all group/glass-btn hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          {/* Hover shine sweep effect */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-[#c084fc]/10 to-transparent -translate-x-full group-hover/glass-btn:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover/glass-btn:scale-110 relative z-10 shrink-0">
            <path d="M29.41,9.26a3.5,3.5,0,0,0-2.47-2.47C24.76,6.2,16,6.2,16,6.2s-8.76,0-10.94.59A3.5,3.5,0,0,0,2.59,9.26,36.13,36.13,0,0,0,2,16a36.13,36.13,0,0,0,.59,6.74,3.5,3.5,0,0,0,2.47,2.47C7.24,25.8,16,25.8,16,25.8s8.76,0,10.94-.59a3.5,3.5,0,0,0,2.47-2.47A36.13,36.13,0,0,0,30,16,36.13,36.13,0,0,0,29.41,9.26ZM13.2,20.2V11.8L20.47,16Z" fill="white" />
          </svg>
          <span className="relative z-10">Watch Demo</span>
        </a>
      </div>
    </div>
  );
}
