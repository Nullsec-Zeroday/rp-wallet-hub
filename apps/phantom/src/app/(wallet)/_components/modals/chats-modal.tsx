"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/lib/wallet-store";

interface ChatsModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

const TRENDING_CHATS = [
  {
    id: "stupid",
    name: "$tupid",
    subtitle: "$763K MC",
    image: "https://cdn.simplehash.com/assets/00be704d9e8603b445a535e1d74d3ac144033ade8ef9ff8643b8069c5c0f4657.gif",
    users: "15",
    isVerified: false
  },
  {
    id: "three",
    name: "three",
    subtitle: "$4.9M MC",
    image: "https://cdn.simplehash.com/assets/10bf104e51787947d1f95497a51aabe8a7df457c9bfd8f3f7f7ea5ddc9a38db0.png",
    users: "13",
    isVerified: true
  },
  {
    id: "sol",
    name: "SOL",
    subtitle: "$36B MC",
    image: "https://cdn.simplehash.com/assets/e0fae40c70adb576ac3f1432a815266ad00af9104ae16988cc1b27ea079a49ff.jpg",
    users: "10",
    isVerified: false
  }
];

export default function ChatsModal({ visible, onClose, onCloseStart }: ChatsModalProps) {
  const { profile } = useWalletStore();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
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

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[120] flex flex-col justify-end items-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full max-w-lg bg-[#000000] rounded-t-[32px] overflow-hidden relative flex flex-col will-change-transform"
        style={{
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        }}
      >
        {/* Grabber */}
        <div className="w-full flex justify-center pt-3 pb-3 flex-shrink-0 relative z-10">
          <div className="w-9 h-[5px] bg-[#333333] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 px-4 pt-2 pb-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-11 h-11 bg-[#1c1c1e] rounded-full flex items-center justify-center active:opacity-70 transition-opacity flex-shrink-0"
          >
            <X size={22} className="text-white" />
          </button>
          <div className="flex flex-col">
            <span className="text-[18px] font-bold text-white leading-tight">Chats</span>
            <span className="text-[14px] font-medium text-[#888888] leading-tight">@{profile?.username || "StableTowel4545"}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-10 flex flex-col custom-scrollbar">
          
          {/* Trending Section */}
          <div className="mb-8">
            <h2 className="text-white font-medium text-[22px] tracking-tight mb-4">Trending</h2>
            
            <div className="bg-[#141414] rounded-[24px] p-4 flex flex-col gap-5">
              {TRENDING_CHATS.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between cursor-pointer active:opacity-75 transition-all outline-none w-full border-none bg-transparent"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-[#222222]">
                      {item.id === "sol" ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <img src="/solana.svg" alt="SOL" className="w-[60%] h-[60%] object-contain" />
                        </div>
                      ) : (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left pl-3 flex flex-col justify-center">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-bold text-[16px] leading-snug tracking-tight truncate">
                          {item.name}
                        </span>
                        {item.isVerified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.041 1.041l-.257 3.222a1.136 1.136 0 0 1-.268.647L1.272 11.263a1.136 1.136 0 0 0 0 1.473l2.097 2.46a1.136 1.136 0 0 1 .268.647l.257 3.222a1.136 1.136 0 0 0 1.041 1.041l3.222.257a1.136 1.136 0 0 1 .647.268l2.46 2.097a1.136 1.136 0 0 0 1.473 0l2.46-2.097a1.136 1.136 0 0 1 .647-.268l3.222-.257a1.136 1.136 0 0 0 1.041-1.041l.257-3.222a1.136 1.136 0 0 1 .268-.647l2.097-2.46a1.136 1.136 0 0 0 0-1.473l-2.097-2.46a1.136 1.136 0 0 1-.268-.647l-.257-3.222a1.136 1.136 0 0 0-1.041-1.041l-3.222-.257a1.136 1.136 0 0 1-.647-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path>
                          </svg>
                        )}
                      </div>
                      <span className="text-[#b4b4b4] text-[14px] font-medium leading-normal tracking-tight truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#eeeeee] shrink-0 text-[14px] font-bold pl-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#888888]">
                      <path
                        d="M17 3.535c1.196.692 2 1.984 2 3.465 0 1.48-.804 2.773-2 3.465"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M4 7a5 5 0 1 1 10 0A5 5 0 0 1 4 7M8.526 14h.948c1.935 0 3.197-.001 4.286.442a6 6 0 0 1 2.444 1.833c.73.922 1.083 2.133 1.624 3.991l.062.215.07.24A1 1 0 0 1 17 22H1a1 1 0 0 1-.96-1.28l.07-.24.062-.214c.541-1.858.894-3.07 1.624-3.991a6 6 0 0 1 2.444-1.833c1.09-.443 2.351-.443 4.286-.442"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                      <path
                        d="m23 21-.07-.24c-.602-2.065-.904-3.098-1.51-3.864a5 5 0 0 0-2.037-1.528"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <span>{item.users}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Section */}
          <div>
            <h2 className="text-white font-medium text-[22px] tracking-tight mb-8">Recent</h2>

            {/* Empty state activity graphics */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="size-[100px] mb-4 select-none pointer-events-none">
                <img
                  src="/icons/no-activity.webp"
                  alt="No chats"
                  className="w-full h-full object-contain grayscale opacity-60"
                />
              </div>
              <span className="text-[#a0a0a0] text-[15px] font-medium leading-normal tracking-tight">
                No chats to show yet.
              </span>
            </div>
          </div>

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
