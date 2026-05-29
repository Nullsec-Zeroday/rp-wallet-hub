"use client";

import Image from "next/image";
import { getAssetUrl } from "@/lib/utils";

export function HeroMockups() {
  return (
    <div className="relative hidden w-full justify-center md:flex">
      <div
        className="relative flex h-[280px] w-full max-w-[1240px] justify-center md:scale-90 sm:h-[350px] md:h-[420px] lg:h-[480px]"
        style={{ clipPath: "inset(-300px -300px 0 -300px)" }}
      >
        <div className="animate-float-8 absolute left-[0%] top-[40px] z-10 -rotate-[10deg] opacity-90 sm:left-[5%] sm:top-[60px] md:left-[8%] md:top-[70px] lg:left-[15%]" style={{ willChange: "transform" }}>
          <Image src={getAssetUrl("/product/product-ss-2.webp")} alt="LarperWallet Transaction History Simulation" width={280} height={560} className="h-auto w-[160px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:w-[220px] md:w-[280px]" />
        </div>

        <div className="animate-float-6 absolute right-[0%] top-[40px] z-10 rotate-[10deg] opacity-90 sm:right-[5%] sm:top-[60px] md:right-[8%] md:top-[70px] lg:right-[15%]" style={{ willChange: "transform" }}>
          <Image src={getAssetUrl("/product/product-ss-3.webp")} alt="LarperWallet Token Details and Profit Charts" width={280} height={560} className="h-auto w-[160px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:w-[220px] md:w-[280px]" />
        </div>

        <div className="animate-fade-in-up absolute left-1/2 top-0 z-20 -translate-x-1/2" style={{ willChange: "transform, opacity" }}>
          <div className="animate-float-10">
            <Image src={getAssetUrl("/product/product-ss-1.webp")} alt="LarperWallet Main Dashboard" width={340} height={680} priority className="h-auto w-[200px] drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] sm:w-[260px] md:w-[340px]" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 z-[1] h-[2px] w-full bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent" />
      </div>
    </div>
  );
}
