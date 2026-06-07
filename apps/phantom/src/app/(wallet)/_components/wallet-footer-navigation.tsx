"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Search, Plus, Sparkles, BarChart2, TrendingUp, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTrendingSolanaTokens, TrendingToken } from "@/lib/coingecko-service";

/* ── Action menu items ── */
const ACTION_ITEMS = [
  {
    label: "Send",
    icon: <img src="/icons/send_icon.webp" alt="Send" width={22} height={22} className="object-contain" />,
    action: "/home?modal=send",
    initialY: 220,
  },
  {
    label: "Receive",
    icon: <img src="/icons/receive_icon.webp" alt="Receive" width={22} height={22} className="object-contain" />,
    action: "/home?modal=receive",
    initialY: 160,
  },
  {
    label: "Buy",
    icon: <img src="/icons/buy_icon.webp" alt="Buy" width={22} height={22} className="object-contain" />,
    action: "/home?modal=buy",
    initialY: 110,
  },
  {
    label: "Trade",
    icon: <img src="/icons/trade_icon.webp" alt="Trade" width={22} height={22} className="object-contain" />,
    action: "/swap",
    initialY: 70,
  },
];


const SPRING_CONFIG = { type: "spring" as const, stiffness: 420, damping: 20, mass: 1 };

const WalletFooterNavigation = ({ hidden = false, isDrawerOpen = false }: { activeTabOverride?: string; blurred?: boolean; hidden?: boolean, isDrawerOpen?: boolean }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  useEffect(() => {
    if (searchOpen && trendingTokens.length === 0) {
      setIsLoadingTrending(true);
      fetchTrendingSolanaTokens(15, "usd").then(tokens => {
        setTrendingTokens(tokens);
        setIsLoadingTrending(false);
      }).catch(err => {
        console.error("Failed to load trending tokens", err);
        setIsLoadingTrending(false);
      });
    }
  }, [searchOpen, trendingTokens.length]);

  const handleNavClick = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const openMenu = useCallback(() => {
    handleNavClick();
    setMenuOpen(true);
  }, [handleNavClick]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleAction = useCallback((action: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      router.push(action);
    }, 250);
  }, [router]);

  return (
    <>
      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 h-[100dvh] z-[110] bg-black overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-20 pb-[70px] max-w-[430px] mx-auto w-full">
              {/* Categories */}
              <div className="flex items-center gap-2 mt-4 px-4">
                <span className="text-white text-[19px] font-semibold">Categories</span>
                <ChevronRight size={18} className="text-[#666]" />
              </div>
              <div className="flex items-center gap-3 px-4 mt-4 overflow-x-auto no-scrollbar">
                <button className="bg-[#1c1c1e] text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#2b2b2b] shrink-0">
                  <Sparkles size={16} className="text-[#ab9ff2]" />
                  <span className="font-medium text-[15px]">Featured</span>
                </button>
                <button className="bg-[#1c1c1e] text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#2b2b2b] shrink-0">
                  <BarChart2 size={16} className="text-[#ab9ff2]" />
                  <span className="font-medium text-[15px]">Top Volume</span>
                </button>
                <button className="bg-[#1c1c1e] text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#2b2b2b] shrink-0">
                  <TrendingUp size={16} className="text-[#ab9ff2]" />
                  <span className="font-medium text-[15px]">Top Gainers</span>
                </button>
              </div>

              {/* Trending Tokens */}
              <div className="mt-8 px-4">
                <span className="text-white text-[19px] font-semibold">Trending Tokens</span>
              </div>
              <div className="flex flex-col mt-4 px-4 gap-5">
                {isLoadingTrending ? (
                  <div className="py-8 text-center text-[#888]">Loading trending tokens...</div>
                ) : (
                  trendingTokens.slice(0, 11).map((token) => (
                    <div key={token.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={token.image || "/avatars/avatar-1.webp"} className="w-[42px] h-[42px] rounded-full object-cover" alt={token.name} />
                          <div
                            className="absolute flex items-center justify-center rounded-[6px] bg-white border-[#111] border-2 shadow-sm"
                            style={{
                              width: "18px",
                              height: "18px",
                              bottom: "-2px",
                              right: "-2px",
                              padding: "3px"
                            }}
                          >
                            <img
                              src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=024"
                              className="w-full h-full object-contain grayscale brightness-0"
                              alt="solana"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium text-[16px] truncate max-w-[140px]">{token.name}</span>
                          </div>
                          <div className="text-[#888] text-[14px] flex items-center gap-1">
                            <span className="truncate max-w-[80px] uppercase">{token.symbol}</span>
                            <span>•</span>
                            <span>${token.price < 0.01 ? token.price.toLocaleString("en-US", { maximumSignificantDigits: 4 }) : token.price.toFixed(2)}</span>
                            <span className={token.priceChange24h > 0 ? "text-[#00e5b4]" : "text-[#ff3b30]"}>
                              {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="w-[32px] h-[32px] bg-[#1c1c1e] rounded-full flex items-center justify-center border border-[#2b2b2b] shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21 16-4 4-4-4m4 4V4M3 8l4-4 4 4M7 4v16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Plus Menu Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="plus-menu"
            className="fixed inset-0 z-[999]"
          >
            {/* Blurred backdrop */}
            <motion.div
              className="absolute inset-0"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                WebkitBackdropFilter: "blur(20px)",
                backdropFilter: "blur(20px)",
              }}
            />

            {/* Menu items - all animate at same time, different distances */}
            <div
              className="absolute right-0 flex flex-col items-end gap-[24px]"
              style={{
                bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
                right: "20px",
              }}
            >
              {ACTION_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleAction(item.action)}
                  className="flex items-center gap-5 active:scale-[0.95]"
                  initial={{ y: item.initialY, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: item.initialY * 0.5, opacity: 0, scale: 0.85 }}
                  transition={{
                    y: SPRING_CONFIG,
                    scale: SPRING_CONFIG,
                    opacity: { duration: 0.15 },
                  }}
                >
                  <span className="text-[#dedede] text-[22px] font-semibold tracking-tight">
                    {item.label}
                  </span>
                  <div className="w-[48px] h-[48px] rounded-full bg-[#AB9FF2] flex items-center justify-center">
                    {item.icon}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Plus Button (Z-Index 1000) ── */}
      <div
        className={`fixed -bottom-3 left-0 right-0 z-[1000] pointer-events-none transition-transform duration-300 ease-in-out ${hidden ? "translate-y-full" : "translate-y-0"}`}
      >
        <div
          className="px-4 max-w-[430px] mx-auto flex items-center justify-end pt-2"
          style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
        >
          <motion.button
            onClick={searchOpen ? () => setSearchOpen(false) : (menuOpen ? closeMenu : openMenu)}
            className="size-[50px] flex-shrink-0 rounded-full flex items-center justify-center pointer-events-auto active:scale-[0.95]"
            animate={{
              backgroundColor: (menuOpen || searchOpen) ? "#222222" : "#AB9FF2",
              rotate: (menuOpen || searchOpen) ? 45 : 0,
            }}
            transition={{
              rotate: SPRING_CONFIG,
              backgroundColor: { duration: 0.2, ease: "linear" }
            }}
            style={{
              boxShadow: (menuOpen || searchOpen) ? "none" : "0 0 15px rgba(171,159,242,0.15)"
            }}
          >
            <motion.div
              animate={{ color: (menuOpen || searchOpen) ? "#999999" : "#000000" }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={32} strokeWidth={1.5} color="currentColor" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* ── Footer Bar ── */}
      <div
        className={`fixed -bottom-3 left-0 right-0 transition-transform duration-300 ease-in-out ${hidden ? "translate-y-full pointer-events-none" : "translate-y-0"} ${searchOpen ? "z-[120]" : "z-50"}`}
      >
        {/* Stacked graduated blur layers (bottom-to-top) */}
        <div className="absolute top-[2px] left-0 right-0 bottom-0 pointer-events-none z-0">
          {/* Layer 1: Strong blur — covers the very bottom solid */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(6px)",
              backdropFilter: "blur(6px)",
              WebkitMaskImage: "linear-gradient(to top, black 65%, transparent 100%)",
              maskImage: "linear-gradient(to top, black 65%, transparent 100%)",
              backgroundColor: isDrawerOpen ? "transparent" : "rgba(0,0,0, 0.8)",
              transition: "background-color 0.3s ease-in-out"
            }}
          />

          {/* Layer 2: Medium blur */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(2px)",
              backdropFilter: "blur(2px)",
              WebkitMaskImage: "linear-gradient(to top, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
              maskImage: "linear-gradient(to top, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
            }}
          />

          {/* Layer 3: Light blur — feathers furthest up */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(0px)",
              backdropFilter: "blur(0px)",
              WebkitMaskImage: "linear-gradient(to top, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
              maskImage: "linear-gradient(to top, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
            }}
          />
        </div>

        <nav
          className="relative z-10 pointer-events-auto px-4 max-w-[430px] mx-auto flex items-center justify-between gap-3 pt-2"
          style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
        >
          {searchOpen ? (
            <div className="flex-1 h-[50px] px-4 flex items-center gap-2.5 bg-[#232323]/80 backdrop-blur-md border border-[#2b2b2b]/80 rounded-full active:scale-[0.98] transition-transform">
              <Search size={20} className="text-[#888]" />
              <input
                autoFocus
                type="text"
                placeholder="Search Ph4ntom"
                className="bg-transparent flex-1 text-white outline-none text-[16px]"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                handleNavClick();
                setSearchOpen(true);
              }}
              className="flex-1 h-[50px] px-4 flex items-center gap-2.5 bg-[#343434]/80 backdrop-blur-md border-[0.5px] border-[#3a3a3a]/80 rounded-full active:scale-[0.98] transition-transform"
            >
              <Search size={20} className="text-white" />
              <span className="text-[#929292] text-[16px]">Search Ph4ntom</span>
            </button>
          )}

          {/* Invisible placeholder to keep the flex layout correct since the real button is floating at z-[1000] */}
          <div className="size-[50px] flex-shrink-0" />
        </nav>
      </div>
    </>
  );
};

export default WalletFooterNavigation;
