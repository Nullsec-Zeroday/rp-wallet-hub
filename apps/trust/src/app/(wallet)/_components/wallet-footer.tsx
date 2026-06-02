import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SwapModal from "./swap-modal";

export default function WalletFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const isRouteActive = (route: string) => pathname.startsWith(route);

  return (
    <>
      <div className="absolute bottom-3 left-4 right-4 z-10" style={{ bottom: "14px", width: "calc(100% - 2rem)", left: "1rem", right: "1rem", position: "fixed", zIndex: 9998, maxWidth: "470px" }}>
        <div className="flex items-center relative justify-between rounded-full bottom-pill-main" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)", backgroundColor: "#1B1B1C", border: "1px solid #313133", padding: "3px" }}>

          {/* Home */}
          <div data-testid="navigation-item-home" className={`flex flex-col w-14 py-1 text-center items-center ${isRouteActive("/home") ? "nav-item-active" : ""}`} role="button" onClick={() => router.push("/home")}>
            <span className="flex justify-center mb-0.5">
              <svg className={isRouteActive("/home") ? "text-primary" : ""} fill="none" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.508 10.27L21.058 9.06004V5.21004C21.058 4.71004 20.638 4.30004 20.138 4.30004H19.238C18.738 4.30004 18.328 4.71004 18.328 5.21004V6.79004L13.158 2.46004C12.818 2.18004 12.408 2.04004 11.998 2.04004C11.588 2.04004 11.168 2.18004 10.838 2.46004L1.49804 10.26C1.14804 10.55 1.02803 11.05 1.25803 11.45C1.42803 11.74 1.72803 11.9 2.02803 11.9C2.23803 11.9 2.43803 11.83 2.60803 11.68L2.93803 11.41V19.7C2.93803 20.95 3.95803 21.96 5.20803 21.96H9.27804C10.028 21.96 10.638 21.35 10.638 20.6V15.84C10.638 15.72 10.738 15.62 10.868 15.62H13.128C13.258 15.62 13.358 15.72 13.358 15.84V20.6C13.358 21.35 13.958 21.96 14.708 21.96H18.788C20.038 21.96 21.058 20.95 21.058 19.7V11.41L21.378 11.68C21.538 11.83 21.748 11.9 21.958 11.9C22.268 11.9 22.588 11.74 22.748 11.42C22.968 11.03 22.838 10.55 22.508 10.27ZM18.808 11.41L18.788 19.71H15.608V15.84C15.608 14.48 14.488 13.37 13.128 13.37H10.868C9.49803 13.37 8.38803 14.48 8.38803 15.84V19.71H5.18804V10.11L11.998 4.42004L16.888 8.51004L18.808 10.12V11.41Z" fill="currentColor"></path>
              </svg>
            </span>
            <small className={`${isRouteActive("/home") ? "text-primary-default" : ""} font-medium`} data-i18n="nav.home">Home</small>
          </div>

          {/* Trending */}
          <div data-testid="navigation-item-trending-tokens" className={`flex flex-col w-14 py-1 text-center items-center ${isRouteActive("/markets") ? "nav-item-active" : ""}`} role="button" onClick={() => router.push("/markets")}>
            <span className="flex justify-center mb-0.5">
              <svg className={isRouteActive("/markets") ? "text-primary" : "text-zinc-300"} xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 640 640" style={{ transform: "rotate(-10deg)" }}>
                <path d="M416 224C398.3 224 384 209.7 384 192C384 174.3 398.3 160 416 160L576 160C593.7 160 608 174.3 608 192L608 352C608 369.7 593.7 384 576 384C558.3 384 544 369.7 544 352L544 269.3L374.6 438.7C362.1 451.2 341.8 451.2 329.3 438.7L224 333.3L86.6 470.6C74.1 483.1 53.8 483.1 41.3 470.6C28.8 458.1 28.8 437.8 41.3 425.3L201.3 265.3C213.8 252.8 234.1 252.8 246.6 265.3L352 370.7L498.7 224L416 224z"></path>
              </svg>
            </span>
            <small className={`${isRouteActive("/markets") ? "text-primary-default" : "text-zinc-300"} font-medium`} data-i18n="nav.trending">Markets</small>
          </div>

          {/* Trade */}
          <div data-testid="navigation-item-swap" className={`flex flex-col w-14 py-1 text-center items-center ${isRouteActive("/swap") || isSwapModalOpen ? "nav-item-active" : ""}`} role="button" style={{ alignSelf: "flex-end" }} onClick={() => setIsSwapModalOpen(true)}>
            <div className="trade-circle bg-button-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-backgroundPrimary" height="20" width="20" viewBox="0 0 640 640" fill="currentColor">
                <path d="M566.6 214.6L470.6 310.6C458.1 323.1 437.8 323.1 425.3 310.6C412.8 298.1 412.8 277.8 425.3 265.3L466.7 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L466.7 160L425.3 118.6C412.8 106.1 412.8 85.8 425.3 73.3C437.8 60.8 458.1 60.8 470.6 73.3L566.6 169.3C579.1 181.8 579.1 202.1 566.6 214.6zM169.3 566.6L73.3 470.6C60.8 458.1 60.8 437.8 73.3 425.3L169.3 329.3C181.8 316.8 202.1 316.8 214.6 329.3C227.1 341.8 227.1 362.1 214.6 374.6L173.3 416L544 416C561.7 416 576 430.3 576 448C576 465.7 561.7 480 544 480L173.3 480L214.7 521.4C227.2 533.9 227.2 554.2 214.7 566.7C202.2 579.2 181.9 579.2 169.4 566.7z"></path>
              </svg>
            </div>
            <small className={`${isRouteActive("/swap") || isSwapModalOpen ? "text-zinc-300" : ""} font-medium`} data-i18n="nav.trade">Swap</small>
          </div>

          {/* Perps */}
          <div data-testid="navigation-item-earn" className={`flex flex-col w-14 py-1 text-center items-center ${isRouteActive("/perps") ? "nav-item-active" : ""}`} role="button" onClick={() => router.push("/perps")}>
            <span className="flex justify-center mb-0.5">
              <svg className={isRouteActive("/perps") ? "text-primary" : "text-zinc-300"} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
              </svg>
            </span>
            <small className={`${isRouteActive("/perps") ? "text-primary-default" : "text-zinc-300"} font-medium`} data-i18n="nav.perps">Perps</small>
          </div>

          {/* Discover */}
          <div data-testid="navigation-item-discover" className={`flex flex-col w-14 py-1 text-center items-center ${isRouteActive("/discover") ? "nav-item-active" : ""}`} role="button" onClick={() => router.push("/discover")}>
            <span className="flex justify-center mb-0.5">
              <svg className={isRouteActive("/discover") ? "text-primary" : "text-zinc-300"} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 640" height="20" width="20">
                <path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM370.7 389.1L226.4 444.6C207 452.1 187.9 433 195.4 413.6L250.9 269.3C254.2 260.8 260.8 254.2 269.3 250.9L413.6 195.4C433 187.9 452.1 207 444.6 226.4L389.1 370.7C385.8 379.2 379.2 385.8 370.7 389.1zM352 320C352 302.3 337.7 288 320 288C302.3 288 288 302.3 288 320C288 337.7 302.3 352 320 352C337.7 352 352 337.7 352 320z"></path>
              </svg>
            </span>
            <small className={`${isRouteActive("/discover") ? "text-primary-default" : "text-zinc-300"} font-medium`} data-i18n="nav.discover">Discover</small>
          </div>
        </div>
      </div>

      <SwapModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} />
    </>
  );
}
