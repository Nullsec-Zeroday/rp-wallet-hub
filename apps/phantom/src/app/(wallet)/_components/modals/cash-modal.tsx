import React, { useState, useEffect, useRef } from "react";
import { X, Mail, Sparkles } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { formatCurrency } from "@/lib/wallet-data";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CashModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CashModal({ visible, onClose }: CashModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);
  const { cashBalance, baseCurrency, profile } = useWalletStore();
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const router = useRouter();

  // Waitlist state
  const [mounted, setMounted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [spotNumber, setSpotNumber] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (visible) {
      setIsClosing(false);
      setIsSwipeClosing(false);
      setTranslateY(0);
      document.body.style.overflow = "hidden";
      
      const savedJoined = localStorage.getItem("phantom_card_waitlist_joined");
      if (savedJoined === "true") {
        setIsJoined(true);
        const email = localStorage.getItem("phantom_card_waitlist_email") || profile.email || "user@example.com";
        const hash = Array.from(email).reduce((acc, char) => acc + char.charCodeAt(0), 12543);
        setSpotNumber(hash);
      } else {
        setEmailInput(profile.email || "");
      }
    } else {
      document.body.style.overflow = "";
    }
  }, [visible, profile.email]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    currentYRef.current = e.clientY;
    const delta = Math.max(0, currentYRef.current - startYRef.current);
    setTranslateY(delta);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const delta = currentYRef.current - startYRef.current;
    if (delta > 100) {
      setIsSwipeClosing(true);
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      setTranslateY(0);
    }
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("phantom_card_waitlist_joined", "true");
    localStorage.setItem("phantom_card_waitlist_email", emailInput);
    setIsJoined(true);

    const hash = Array.from(emailInput).reduce((acc, char) => acc + char.charCodeAt(0), 12543);
    setSpotNumber(hash);
    setWaitlistOpen(false);

    toast.success("Joined waitlist!", {
      description: `You've secured spot #${hash.toLocaleString()}! We'll email you soon.`,
    });
  };

  if (!visible || !mounted) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        style={{
          animation: isSwipeClosing ? "none" : (isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards"),
          opacity: isSwipeClosing ? Math.max(0, 1 - translateY / 300) : undefined
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full bg-[#000000] flex flex-col pointer-events-auto shadow-2xl relative"
        style={{
          height: "94vh",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          animation: isSwipeClosing ? "none" : (isClosing ? "slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards"),
          willChange: "transform",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-full flex justify-center pt-3 pb-3">
          <div className="w-9 h-[5px] bg-[#333333] rounded-full" />
        </div>

        {/* Scrollable Content inside sheet to prevent drag interruption */}
        <div 
          className="flex-1 overflow-y-auto no-scrollbar"
          onPointerDown={(e) => e.stopPropagation()} // Stop drag when scrolling inner content
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-[#1c1c1e] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <X size={20} className="text-[#eeeeee]" />
            </button>
            <h2 className="text-[17px] font-bold text-white">Cash</h2>
            <div className="w-10 h-10" /> {/* Spacer to keep title centered */}
          </div>

          <div className="flex flex-col pb-[110px] select-none">
            {/* ── BALANCE & CARD PREVIEW ROW ── */}
            <div className="flex flex-row items-center justify-between px-4 my-4">
              <div className="flex flex-col flex-1">
                <div className="text-[#888888] text-[15px] font-bold leading-normal">
                  Balance
                </div>
                <div className="text-white text-[38px] font-semibold tracking-tight leading-tight select-text mt-0.5">
                  {formatCurrency(cashBalance, baseCurrency)}
                </div>
              </div>

              {/* Card Showcase Button */}
              <button
                onClick={() => {
                  if (isJoined) {
                    toast.success(`You're at spot #${spotNumber.toLocaleString()} on the waitlist!`);
                  } else {
                    setWaitlistOpen(!waitlistOpen);
                  }
                }}
                className="relative rounded-[4px] overflow-hidden flex-shrink-0 active:scale-95 transition-transform duration-100 bg-[#111] cursor-pointer"
                style={{ height: "60px", aspectRatio: "1.582278 / 1" }}
              >
                <img
                  src="/icons/cash-card.webp"
                  alt="Ph4ntom Card"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>

            {/* ── WAITLIST BANNER ── */}
            <div className="px-4 my-4 flex flex-col">
              <button
                onClick={() => {
                  if (!isJoined) {
                    setWaitlistOpen(!waitlistOpen);
                  } else {
                    toast.success("Already on the waitlist! 🎉", {
                      description: `Your spot is #${spotNumber.toLocaleString()}.`
                    });
                  }
                }}
                className="w-full relative overflow-hidden rounded-lg text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer flex flex-row items-center"
              >
                {/* Gradient Background */}
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center"
                  style={{ backgroundImage: "linear-gradient(90deg, rgb(74, 135, 242) 0%, rgb(213, 209, 255) 100%)" }}
                />

                <div className="relative z-10 flex flex-row items-center gap-4 p-4 w-full">
                  {/* Skew Card Image */}
                  <div className="w-[60px] aspect-[1.582278/1] overflow-hidden flex-shrink-0 relative">
                    <img
                      src="/icons/cash-skew-card.webp"
                      alt="Ph4ntom Card Skew"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Waitlist Text content */}
                  <div className="flex-1 flex flex-col justify-center text-white pr-2">
                    <div className="font-medium text-[16px] leading-tight">
                      {isJoined ? "You're on the list! 🎉" : "Join the waitlist!"}
                    </div>
                    <div className="text-[12px] font-medium opacity-85 leading-snug line-clamp-2 mt-0.5">
                      {isJoined
                        ? `Access to Ph4ntom Card is coming soon. Spot #${spotNumber.toLocaleString()}`
                        : "Access to Ph4ntom Card & more coming soon"
                      }
                    </div>
                  </div>
                </div>
              </button>

              {/* Form expander accordion */}
              {waitlistOpen && !isJoined && (
                <div className="bg-[#1c1c1e] p-4 rounded-b-[24px] border-t border-[#2a2a2e] -mt-3 pt-6 animate-fade-in-up shadow-xl relative z-0">
                  <div className="text-[13px] text-[#AB9FF2] font-bold mb-1 flex items-center gap-1">
                    <Sparkles size={14} />
                    PH4NTOM CARD WAITLIST
                  </div>
                  <div className="text-xs text-[#a0a0a0] mb-4">
                    Enter your email address to lock in your position. Waitlist spot will be linked to <span className="text-white font-semibold">@{profile.username || "your wallet"}</span>.
                  </div>

                  <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c5d7a]" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-[#111] border border-[#2a2a36] rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#AB9FF2] placeholder-[#5c5d7a] font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-white text-black font-extrabold px-5 py-3 rounded-2xl text-sm active:scale-95 transition-transform duration-100 hover:bg-[#eee] shrink-0"
                    >
                      Join
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ── ADD CASH TITLE & QUICK SELL CRYPTO CARD ── */}
            <div className="px-4 my-4 flex flex-col">
              <div className="text-white text-[22px] font-semibold mb-[12px] leading-tight">
                Add cash
              </div>

              {/* Quick Sell Crypto Action Card */}
              <button
                onClick={() => { onClose(); setTimeout(() => router.push('?modal=buy'), 200); }}
                className="w-full bg-[#1c1c1e] rounded-[28px] p-5 text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer flex flex-col gap-4 shadow-md hover:bg-[#222225] duration-200"
              >
                {/* 3 Overlapping circular token badges */}
                <div className="flex flex-row -space-x-[20px] items-center">
                  {/* BONK Badge (Z-index 3) */}
                  <div className="w-[52px] h-[52px] rounded-full border-[3px] border-[#1c1c1e] z-30 overflow-hidden bg-[#111] shadow-md">
                    <img
                      alt="Bonk"
                      src="https://assets.coingecko.com/coins/images/28600/large/bonk.jpg"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* USDT Badge (Z-index 2) */}
                  <div className="w-[52px] h-[52px] rounded-full border-[3px] border-[#1c1c1e] z-20 overflow-hidden bg-[#111] shadow-md">
                    <img
                      alt="USDT"
                      src={"/tokens/usdt.webp"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Solana SOL Badge (Z-index 1) */}
                  <div className="w-[52px] h-[52px] rounded-full border-[3px] border-[#1c1c1e] z-10 overflow-hidden bg-[#111] shadow-md">
                    <img
                      alt="SOL"
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[19px] font-semibold mb-[4px] leading-tight truncate">
                    Quick Sell Crypto
                  </div>
                  <div className="text-[#888888] text-[15px] leading-normal truncate">
                    Instant · No fees on stablecoins
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
