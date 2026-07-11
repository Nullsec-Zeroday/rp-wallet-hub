"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

export default function PredictPage() {
  return (
    <div className="flex flex-col pb-32 px-4">
      <div className="pt-2 pb-4">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Predict</h1>
      </div>

      <div className="rounded-[24px] bg-[#191919] px-6 py-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[#2A2A2B] flex items-center justify-center mb-4">
          <TrendingUp size={26} className="text-[#B4A6F9]" />
        </div>
        <div className="text-white text-[18px] font-semibold mb-1">Prediction markets</div>
        <p className="text-[#A0A0A5] text-[15px] leading-snug max-w-[260px]">
          Trade on outcomes across sports, crypto, and culture. Coming soon.
        </p>
      </div>
    </div>
  );
}
