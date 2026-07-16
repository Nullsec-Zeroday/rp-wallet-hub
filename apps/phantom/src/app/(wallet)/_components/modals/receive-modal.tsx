"use client";

import React from "react";
import { X, ChevronDown, Copy } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP } from "@/lib/wallet-data";
import { toast } from "sonner";
import StyledQR from "../styled-qr";

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

export default function ReceiveModal({ visible, onClose, onCloseStart }: ReceiveModalProps) {
  const { profile, customTokens } = useWalletStore();
  const walletAddress = profile?.walletAddress || "j9iMYuecFRuwaLzGtnsftYCpwYwW48tCWdYGGjaEpGYS";

  const [isClosing, setIsClosing] = React.useState(false);
  const [receiveMode, setReceiveMode] = React.useState<"tokens" | "cash">("tokens");
  const [selectedToken, setSelectedToken] = React.useState(TOKENS[0]); // Default to SOL
  const [showTokenSelector, setShowTokenSelector] = React.useState(false);
  const [isSelectorClosing, setIsSelectorClosing] = React.useState(false);
  const modalContainerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const isHeaderDragging = React.useRef(false);
  const headerDragStartY = React.useRef(0);
  const headerCurrentDragY = React.useRef(0);
  const isSwipeClosing = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      setIsClosing(false);
      isSwipeClosing.current = false;
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  React.useEffect(() => {
    const header = headerRef.current;
    const modal = modalContainerRef.current;
    if (!visible || !header || !modal) return;

    let rafId: number;

    const onTouchStart = (event: TouchEvent) => {
      isHeaderDragging.current = true;
      headerDragStartY.current = event.touches[0].clientY;
      modal.style.transition = "none";
      modal.style.animation = "none";
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isHeaderDragging.current) return;
      if (event.cancelable) event.preventDefault();

      const diff = event.touches[0].clientY - headerDragStartY.current;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (diff > 0) {
          headerCurrentDragY.current = diff;
          modal.style.transform = `translateY(${diff}px)`;
        } else {
          const rubberBand = diff * (1 / (1 + Math.abs(diff) * 0.005));
          headerCurrentDragY.current = rubberBand;
          modal.style.transform = `translateY(${rubberBand}px)`;
        }
      });
    };

    const onTouchEnd = () => {
      if (!isHeaderDragging.current) return;
      isHeaderDragging.current = false;
      if (rafId) cancelAnimationFrame(rafId);

      if (headerCurrentDragY.current > 120) {
        isSwipeClosing.current = true;
        modal.style.transition = "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)";
        modal.style.transform = "translateY(100vh)";
        handleClose();
      } else {
        modal.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
        modal.style.transform = "translateY(0px)";
      }
      headerCurrentDragY.current = 0;
    };

    const onMouseDown = (event: MouseEvent) => {
      isHeaderDragging.current = true;
      headerDragStartY.current = event.clientY;
      modal.style.transition = "none";
      modal.style.animation = "none";
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isHeaderDragging.current) return;

      const diff = event.clientY - headerDragStartY.current;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (diff > 0) {
          headerCurrentDragY.current = diff;
          modal.style.transform = `translateY(${diff}px)`;
        } else {
          const rubberBand = diff * (1 / (1 + Math.abs(diff) * 0.005));
          headerCurrentDragY.current = rubberBand;
          modal.style.transform = `translateY(${rubberBand}px)`;
        }
      });
    };

    const onMouseUp = () => onTouchEnd();

    header.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    header.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      header.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      header.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [visible]);

  const handleOpenSelector = () => {
    setShowTokenSelector(true);
    setIsSelectorClosing(false);
  };

  const handleCloseSelector = () => {
    setIsSelectorClosing(true);
    setTimeout(() => {
      setShowTokenSelector(false);
      setIsSelectorClosing(false);
    }, 200);
  };

  const selectToken = (token: typeof TOKENS[0]) => {
    setSelectedToken(token);
    handleCloseSelector();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied to clipboard");
  };

  if (!visible) return null;

  const shortenAddr = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-6);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 flex-1"
        style={{
          backgroundColor: "rgba(0,0,0,0.15)",
          animation: isSwipeClosing.current ? "none" : (isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards"),
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={modalContainerRef}
        className="w-full flex flex-col rounded-t-[28px] overflow-hidden relative"
        style={{
          background: "#000000",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? (isSwipeClosing.current ? "none" : "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards")
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >
        {/* Grabber + Header (drag-to-close zone) */}
        <div ref={headerRef} className="w-full flex flex-col flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-10 h-[4px] rounded-full bg-[#333333]"></div>
          </div>
          <div className="px-4 pt-3 pb-4">
            <h2 className="text-[28px] font-bold text-white tracking-tight">Receive</h2>
          </div>
        </div>

        {/* Tokens / Cash segmented toggle */}
        <div className="px-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#1c1c1e] rounded-full">
            {(["tokens", "cash"] as const).map((mode) => {
              const active = receiveMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setReceiveMode(mode)}
                  className={`py-2 rounded-full text-[15px] font-semibold transition-colors ${
                    active ? "bg-[#e6e6e6] text-black" : "text-[#8a8a8a]"
                  }`}
                >
                  {mode === "tokens" ? "Tokens" : "Cash"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Token Selector Overlay */}
        {showTokenSelector && (
          <div
            className="absolute inset-0 z-20 flex flex-col pt-4"
            style={{
              backgroundColor: "rgb(17, 17, 17)",
              animation: isSelectorClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.2s ease forwards"
            }}
          >
            <div className="flex justify-center pb-1 flex-shrink-0 pointer-events-none">
              <div className="w-9 h-[3px] rounded-full bg-[#333]"></div>
            </div>
            <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
              <span className="text-xl font-medium text-[#eeeeee]">Select Network</span>
              <button
                onClick={handleCloseSelector}
                className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2 pb-4" style={{ overscrollBehavior: "contain" }}>
              {[...TOKENS, ...customTokens].map((token) => {
                const isSelected = selectedToken.symbol === token.symbol;
                return (
                  <button
                    key={token.symbol}
                    onClick={() => selectToken(token)}
                    className="flex items-center gap-3 px-4 py-4 bg-[#232323] rounded-2xl active:opacity-70 transition-opacity"
                    style={{ border: isSelected ? "1.5px solid rgb(172, 156, 242)" : "1.5px solid transparent" }}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2A2640] flex-shrink-0">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg" style={{ color: token.color }}>{token.icon}</div>
                      )}
                    </div>
                    <span className="text-white font-semibold text-base flex-1 text-left">{token.name}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#ac9cf2] flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {receiveMode === "tokens" ? (
            <>
              {/* QR Code Container */}
              <div className="flex-1 flex flex-col justify-center min-h-0">
                <div className="flex justify-center">
                  <div className="relative w-[300px] h-[300px] bg-[#1c1c1e] rounded-[28px] p-4 flex items-center justify-center overflow-hidden">
                    <StyledQR data={walletAddress} size={250} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[60px] h-[60px] rounded-[14px] bg-[#2A2A2C] flex items-center justify-center">
                        {selectedToken.symbol === "SOL" ? (
                          /* Official Solana mark, monochrome white — matches Phantom's QR badge */
                          <svg width="28" height="22" viewBox="0 0 397.7 311.7" fill="#ffffff">
                            <path d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
                            <path d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
                            <path d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
                          </svg>
                        ) : selectedToken.logoUrl ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden">
                            <img src={selectedToken.logoUrl} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-xl" style={{ color: selectedToken.color }}>{selectedToken.icon}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network + Address row (opens network selector) */}
                <button
                  onClick={handleOpenSelector}
                  className="mx-4 mt-8 flex items-center justify-between active:opacity-70 transition-opacity"
                >
                  <span className="text-[18px] tracking-tight">
                    <span className="text-white font-semibold">{selectedToken.name}</span>
                    <span className="text-[#8a8a8a] font-medium"> &middot; {shortenAddr(walletAddress)}</span>
                  </span>
                  <ChevronDown size={22} className="text-[#8a8a8a]" strokeWidth={2.5} />
                </button>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col gap-3 px-4 pb-2 flex-shrink-0">
                <button onClick={copyAddress} className="w-full bg-[#B4A6F9] py-4 rounded-full text-black font-semibold text-[17px] active:opacity-80 transition-opacity">
                  Copy Address
                </button>
                <button onClick={() => toast.info("Share functionality is a simulation")} className="w-full bg-[#1c1c1e] py-4 rounded-full text-white font-semibold text-[17px] active:opacity-70 transition-opacity">
                  Share
                </button>
              </div>
            </>
          ) : (
            /* Cash receive — not yet available */
            <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1c1c1e] flex items-center justify-center mb-5">
                <Copy size={26} className="text-[#8a8a8a]" />
              </div>
              <p className="text-white font-semibold text-[18px] mb-2">Cash deposits coming soon</p>
              <p className="text-[#8a8a8a] text-[15px] leading-relaxed">
                Add cash to your balance directly from your bank. Join the waitlist from the Cash card.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
