import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { TOKENS, formatCurrency, formatBalance, type TokenInfo } from "@/lib/wallet-data";
import TokenLogo from "../token-logo";

export function TokenPickerModal({
  visible,
  onClose,
  onSelect,
  tokens,
  prices,
  balances,
  excludeSymbol,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  tokens: TokenInfo[];
  prices: Record<string, { usd: number; image?: string }>;
  balances: Record<string, number>;
  excludeSymbol?: string;
}) {
  const [search, setSearch] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setIsClosing(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  if (!visible || !mounted) return null;

  const filtered = tokens.filter(t =>
    t.symbol !== excludeSymbol &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[120] flex flex-col justify-end items-center sm:px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/15"
        onClick={handleClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 38, stiffness: 420, mass: 0.75 }}
        className="w-full max-w-md bg-[#111111] overflow-hidden relative flex flex-col rounded-t-[32px] will-change-transform"
        style={{ height: "94vh", transform: "translateZ(0)" }}
      >
        {/* Sticky Header styled like SendModal select token */}
        <div className="sticky top-0 z-10 bg-[#111111]">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-xl font-medium text-[#eeeeee]">Select Token</span>
            <button
              onClick={handleClose}
              className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="px-4 pt-1 pb-1">
            <div className="flex items-center gap-2 bg-[#222222] rounded-lg h-10 px-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                ref={inputRef}
                placeholder="Search..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[16px] leading-5 placeholder:text-[#b4b4b4]"
              />
            </div>
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-12 no-scrollbar" style={{ overscrollBehavior: "contain" }}>
          <div className="flex flex-col gap-2.5">
            {filtered.map((token) => {
              const bal = balances[token.symbol] ?? 0;
              const price = prices[token.symbol]?.usd ?? token.price;
              return (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onSelect(token.symbol);
                    handleClose();
                  }}
                  className="flex items-center gap-3 bg-[#222222] rounded-[22px] p-4 border-none cursor-pointer text-left w-full active:scale-[0.98] transition-all group"
                >
                  <div className="w-12 h-12 rounded-[14px] flex-shrink-0  flex items-center justify-center">
                    <TokenLogo
                      token={token}
                      size={48}
                      liveImage={prices[token.symbol]?.image}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[15px] font-semibold text-[#eeeeee] truncate">{token.name}</span>
                        {TOKENS.some(t => t.symbol === token.symbol) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.041 1.041l-.257 3.222a1.136 1.136 0 0 1-.268.647L1.272 11.263a1.136 1.136 0 0 0 0 1.473l2.097 2.46a1.136 1.136 0 0 1 .268.647l.257 3.222a1.136 1.136 0 0 0 1.041 1.041l3.222.257a1.136 1.136 0 0 1 .647.268l2.46 2.097a1.136 1.136 0 0 0 1.473 0l2.46-2.097a1.136 1.136 0 0 1 .647-.268l3.222-.257a1.136 1.136 0 0 0 1.041-1.041l.257-3.222a1.136 1.136 0 0 1 .268-.647l2.097-2.46a1.136 1.136 0 0 0 0-1.473l-2.097-2.46a1.136 1.136 0 0 1-.268-.647l-.257-3.222a1.136 1.136 0 0 0-1.041-1.041l-3.222-.257a1.136 1.136 0 0 1-.647-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path>
                          </svg>
                        )}
                      </div>
                      <span className="text-[15px] font-semibold text-[#eeeeee] whitespace-nowrap pl-2">
                        {bal > 0 ? formatBalance(bal) : "0"} {token.symbol.split('_')[0]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-[2px]">
                      <span className="text-[14px] font-normal text-[#b4b4b4] truncate max-w-[150px]">
                        {token.symbol}
                      </span>
                      <span className="text-[14px] font-normal text-[#b4b4b4]">
                        {formatCurrency(bal * price, "USD")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[#888]">
                <p className="font-medium">No tokens found</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
