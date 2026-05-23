"use client";

import React from "react";
import { X, ScanLine, ChevronDown, Copy } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP } from "@/lib/wallet-data";
import { toast } from "sonner";

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ visible, onClose }: ReceiveModalProps) {
  const { profile, customTokens } = useWalletStore();
  const walletAddress = profile?.walletAddress || "j9iMYuecFRuwaLzGtnsftYCpwYwW48tCWdYGGjaEpGYS";

  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedToken, setSelectedToken] = React.useState(TOKENS[0]); // Default to SOL
  const [showTokenSelector, setShowTokenSelector] = React.useState(false);
  const [isSelectorClosing, setIsSelectorClosing] = React.useState(false);

  React.useEffect(() => {
    if (visible) setIsClosing(false);
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

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
    return addr.slice(0, 7) + "..." + addr.slice(-5);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 flex-1"
        style={{
          backgroundColor: "rgba(0,0,0,0.15)",
          animation: isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards",
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full flex flex-col rounded-t-[28px] overflow-hidden relative"
        style={{
          background: "rgb(17, 17, 17)",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >

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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
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
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <span className="text-xl font-medium text-[#eeeeee]">Receive {selectedToken.symbol}</span>
          <div className="flex items-center gap-2">
            <button className="bg-transparent border-none p-2 cursor-pointer rounded-full active:bg-white/5 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">

          {/* Main Receive UI */}
          <div className="flex-1 flex flex-col items-center pt-2">

            {/* Network Selector Pill */}
            <div className="flex items-center border border-[#333] p-[2px] rounded-full mb-6">
              <div className="px-3.5 py-1.5 rounded-full font-semibold text-[13px] cursor-pointer" style={{ backgroundColor: "rgb(171, 159, 242)", color: "rgb(0, 0, 0)" }}>
                Solana
              </div>
              <div className="px-3.5 py-1.5 rounded-full font-semibold text-[13px] text-[#b4b4b4] cursor-pointer bg-transparent">
                Ethereum
              </div>
              <div className="px-3.5 py-1.5 rounded-full font-semibold text-[13px] text-[#b4b4b4] cursor-pointer bg-transparent">
                Bitcoin
              </div>
            </div>

            {/* Token Dropdown */}
            <div className="w-[260px] flex justify-start mb-3">
              <button
                onClick={handleOpenSelector}
                className="flex items-center gap-2 bg-transparent active:opacity-70 transition-opacity p-2 -ml-2"
              >
                <div className="w-[22px] h-[22px] rounded-full overflow-hidden flex items-center justify-center bg-[#232323]">
                  {selectedToken.logoUrl ? (
                    <img
                      alt={selectedToken.name}
                      src={selectedToken.logoUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px]" style={{ color: selectedToken.color }}>{selectedToken.icon}</span>
                  )}
                </div>
                <span className="text-[#eeeeee] font-bold text-[16px]">{selectedToken.symbol}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </button>
            </div>

            {/* QR Code Container */}
            <div className="relative w-[260px] h-[260px] bg-white rounded-[28px] overflow-hidden mb-6 p-[16px]">
              <img
                alt="QR Code"
                className="w-full h-full object-contain"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&data=${walletAddress}`}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center p-[3px] overflow-hidden">
                  <div className="w-[46px] h-[46px] rounded-full overflow-hidden flex items-center justify-center bg-[#232323]">
                    {selectedToken.logoUrl ? (
                      <img
                        alt={selectedToken.name}
                        src={selectedToken.logoUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl" style={{ color: selectedToken.color }}>{selectedToken.icon}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Warning */}
            <div className="flex flex-col items-center gap-4 mb-4 w-full px-6">
              <button onClick={copyAddress} className="flex items-center gap-2.5 bg-[#202020] px-5 py-3 rounded-[14px] active:opacity-60 transition-opacity border border-[#2a2a2a]">
                <span className="text-[#eeeeee] font-medium text-[15px] tracking-wide">{shortenAddr(walletAddress)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <div className="text-center text-[#888888] text-[13px]">
                Use this address to receive {selectedToken.symbol === 'SOL' ? 'Solana' : selectedToken.symbol} only.
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex flex-col items-center gap-2 pb-6 flex-shrink-0 z-10 relative">
            <button onClick={copyAddress} className="w-full py-4 bg-transparent text-[#eeeeee] font-bold text-[16px] active:opacity-60 transition-opacity">
              Copy Address
            </button>
            <button onClick={() => toast.info("Share functionality is a simulation")} className="w-full py-4 bg-transparent text-[#eeeeee] font-bold text-[16px] active:opacity-60 transition-opacity">
              Share Address
            </button>
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
