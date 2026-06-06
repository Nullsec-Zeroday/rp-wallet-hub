"use client";

import React from "react";
import { X, ScanLine, ChevronDown, Copy } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP } from "@/lib/wallet-data";
import { toast } from "sonner";

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

export default function ReceiveModal({ visible, onClose, onCloseStart }: ReceiveModalProps) {
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
    onCloseStart?.();
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
    return addr.slice(0, 6) + "..." + addr.slice(-6);
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
          background: "#000000",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >
        {/* Grabber */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-[4px] rounded-full bg-[#333333]"></div>
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

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-11 h-11 bg-[#1c1c1e] rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <X size={22} className="text-white" />
          </button>
          <span className="text-[17px] font-semibold text-white tracking-wide">Receive</span>
          <button className="w-11 h-11 bg-[#1c1c1e] rounded-full flex items-center justify-center active:opacity-70 transition-opacity">
            <ScanLine size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {/* Token Dropdown Pill */}
          <div className="flex justify-center mt-6 mb-6">
            <button
              onClick={handleOpenSelector}
              className="flex items-center gap-2 bg-[#1c1c1e] px-3 py-1.5 rounded-full active:opacity-70 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-[#232323]">
                {selectedToken.logoUrl ? (
                  <img src={selectedToken.logoUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px]" style={{ color: selectedToken.color }}>{selectedToken.icon}</span>
                )}
              </div>
              <span className="text-white font-medium text-[15px]">{selectedToken.name}</span>
              <ChevronDown size={16} className="text-[#a0a0a0]" />
            </button>
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center">
            <div className="relative w-[300px] h-[300px] bg-white rounded-[24px] p-4 flex items-center justify-center overflow-hidden">
              <img
                alt="QR Code"
                className="w-full h-full object-contain mix-blend-multiply"
                style={{ imageRendering: "pixelated" }}
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${walletAddress}`}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[64px] h-[64px] rounded-lg bg-white flex items-center justify-center p-[4px] overflow-hidden">
                  <div className="w-full h-full rounded-md overflow-hidden flex items-center justify-center bg-[#232323]">
                    {selectedToken.logoUrl ? (
                      <img src={selectedToken.logoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl" style={{ color: selectedToken.color }}>{selectedToken.icon}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address text */}
          <div 
            className="flex justify-center items-center gap-2 mt-8 cursor-pointer active:opacity-70 transition-opacity" 
            onClick={copyAddress}
          >
            <span className="text-white font-medium text-[16px] tracking-wide">{shortenAddr(walletAddress)}</span>
            <Copy size={16} className="text-[#eeeeee]" />
          </div>

          {/* Spacer to push bottom text and buttons down */}
          <div className="flex-1"></div>

          {/* Description */}
          <p className="text-center text-[#a0a0a0] text-[15px] px-10 mb-8 leading-relaxed">
            Use to receive tokens on the {selectedToken.name} network only.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 px-4 pb-2">
            <button onClick={copyAddress} className="flex-1 bg-[#1c1c1e] py-4 rounded-[20px] text-white font-semibold text-[16px] active:opacity-70 transition-opacity">
              Copy address
            </button>
            <button onClick={() => toast.info("Share functionality is a simulation")} className="flex-1 bg-[#1c1c1e] py-4 rounded-[20px] text-white font-semibold text-[16px] active:opacity-70 transition-opacity">
              Share
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
