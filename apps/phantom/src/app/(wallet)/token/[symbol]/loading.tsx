"use client";

import React from "react";
import WalletFooterNavigation from "@/app/(wallet)/_components/wallet-footer-navigation";
import { ChevronLeft, Share } from "lucide-react";

/**
 * Token detail loading skeleton — perfectly 1:1 with page.tsx
 */
export default function TokenDetailLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pt-bg relative">
      <div className="flex-1 flex flex-col min-h-0 relative z-10">

        {/* Header - Sticky and non-pullable */}
        <div className="shrink-0 z-30 flex items-center gap-3 px-4 pb-3 pt-[calc(16px+env(safe-area-inset-top))] md:pt-4">
          <button className="text-white opacity-50 shrink-0 pointer-events-none">
            <ChevronLeft size={26} strokeWidth={2} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#232323] shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0 flex flex-col justify-center animate-pulse">
            <div className="h-5 w-24 bg-[#2A2A2A] rounded mb-1.5" />
            <div className="h-3 w-16 bg-[#232323] rounded" />
          </div>
          <button className="px-4 py-1.5 rounded-xl border border-[#444] shrink-0 opacity-50 pointer-events-none">
            <div className="h-5 w-10" />
          </button>
          <button className="text-white opacity-50 shrink-0 pointer-events-none">
            <Share size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-48 relative">
          <div className="h-full animate-pulse">

            {/* Price */}
            <div className="px-4 pt-4 pb-3" style={{ minHeight: "110px" }}>
              <div className="h-[48px] w-[200px] bg-[#2A2A2A] rounded-lg" />
              <div className="flex items-center gap-2 mt-2">
                <div className="h-[20px] w-[70px] bg-[#2A2A2A] rounded" />
                <div className="h-[17px] w-[50px] bg-[#2A2A2A] rounded-sm" />
              </div>
            </div>

            {/* Chart Area */}
            <div className="w-full relative flex items-center justify-center" style={{ height: "200px" }}>
              <div className="absolute left-0 right-0 border-t border-dashed border-[#333] w-full" />
            </div>

            {/* Timeframes */}
            <div className="flex items-center justify-between px-4 py-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 h-[36px] mx-0.5 rounded-xl bg-[#232323]" />
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-4 gap-3 px-4 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#232323] rounded-[20px] aspect-square" />
              ))}
            </div>

            {/* Chat */}
            <div className="mx-4 mb-5 px-4 py-4 rounded-2xl flex items-center justify-between" style={{ background: "rgb(30, 30, 30)" }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#2A2A2A] border-2 border-[#232323]" />
                  ))}
                </div>
                <div className="h-4 w-24 bg-[#2A2A2A] rounded" />
              </div>
              <div className="h-4 w-16 bg-[#2A2A2A] rounded" />
            </div>

            {/* 24h Performance */}
            <div className="px-4 mb-5">
              <div className="h-7 w-[160px] bg-[#2A2A2A] rounded mb-3" />
              <div className="bg-[#1a1a1a] rounded-2xl h-[116px]" />
            </div>

            {/* Activity */}
            <div className="px-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-7 w-[80px] bg-[#2A2A2A] rounded" />
                <div className="h-5 w-[60px] bg-[#2A2A2A] rounded" />
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl h-[80px]" />
            </div>

          </div>
        </div>
      </div>

      <WalletFooterNavigation activeTabOverride="/home" />
    </div>
  );
}
