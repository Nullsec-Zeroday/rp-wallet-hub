"use client";

import Image from "next/image";
import { getAssetUrl } from "@/lib/utils";

export function HeroMockups() {
  return (
    <div className="relative hidden w-full justify-center md:flex mt-8 mb-4">
      <div className="relative flex w-full max-w-[800px] justify-center gap-8 lg:gap-16">
        <div className="animate-float-8 z-10 transition-transform hover:scale-105 duration-500" style={{ willChange: "transform" }}>
          <Image 
            src={getAssetUrl("/product/new-product-1.webp")} 
            alt="RPWallet Main Dashboard"
            width={280} 
            height={583} 
            priority 
            className="h-auto w-[220px] lg:w-[280px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]" 
          />
        </div>

        <div className="animate-float-6 z-10 transition-transform hover:scale-105 duration-500" style={{ willChange: "transform" }}>
          <Image 
            src={getAssetUrl("/product/new-product-2.webp")} 
            alt="RPWallet Wallet Selector"
            width={280} 
            height={583} 
            priority 
            className="h-auto w-[220px] lg:w-[280px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]" 
          />
        </div>
      </div>
    </div>
  );
}
