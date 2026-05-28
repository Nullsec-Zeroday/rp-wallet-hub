"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKEN_MAP, TOKENS, formatCurrency, formatBalance } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import { SendIcon, SwapIcon, ReceiveIcon, BuyIcon } from "../_components/action-icons";
import TokenLogo from "../_components/token-logo";

// ── Action Button Sub-Component ────────────────────────────────
function ActionButton({ Icon, label, onClick }: {
  Icon: React.ComponentType<{ className?: string, size?: number, strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 bg-[#232323] rounded-2xl py-4 active:scale-[0.93] transition-transform duration-[50ms]"
    >
      <Icon size={24} strokeWidth={2} className="text-[#ac9cf2]" />
      <span className="text-xs font-bold" style={{ color: "rgb(180, 180, 180)" }}>{label}</span>
    </button>
  );
}

// ── Home Skeleton ────────────────────────────────────────────────
function HomeSkeleton() {
  return (
    <div className="flex flex-col pb-32 animate-pulse">
      <div className="px-4">
        {/* Balance Section */}
        <div className="pt-4 pb-6">
          <div className="h-[44px] w-[200px] bg-[#2A2A2A] rounded-lg mb-2"></div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[20px] w-[80px] bg-[#2A2A2A] rounded-md"></div>
            <div className="h-[20px] w-[50px] bg-[#2A2A2A] rounded-md"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#232323] rounded-[20px] aspect-square"></div>
          ))}
        </div>

        {/* Cash Balance Card */}
        <div className="bg-[#1c1c1c] rounded-[24px] px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <div className="h-[14px] w-[80px] bg-[#2A2A2A] rounded mb-1.5"></div>
            <div className="h-[24px] w-[100px] bg-[#2A2A2A] rounded"></div>
          </div>
          <div className="h-[40px] w-[100px] bg-[#2A2A2A] rounded-xl"></div>
        </div>

        {/* Tokens Section */}
        <div className="flex items-center gap-1 mb-3">
          <div className="h-[20px] w-[80px] bg-[#2A2A2A] rounded"></div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full flex items-center gap-4 px-4 py-4 bg-[#232323] rounded-[20px]">
              <div className="w-[52px] h-[52px] rounded-full bg-[#2A2A2A] flex-shrink-0"></div>
              <div className="flex-1 text-left min-w-0">
                <div className="h-[20px] w-[100px] bg-[#2A2A2A] rounded mb-1"></div>
                <div className="h-[14px] w-[60px] bg-[#2A2A2A] rounded"></div>
              </div>
              <div className="text-right flex-col items-end flex-shrink-0">
                <div className="h-[20px] w-[80px] bg-[#2A2A2A] rounded mb-1 ml-auto"></div>
                <div className="h-[14px] w-[60px] bg-[#2A2A2A] rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Home Page ─────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const {
    tokenBalances,
    getTotalBalance,
    getTotalPnL,
    cashBalance,
    baseCurrency,
    customTokens,
    setManageTokensVisible
  } = useWalletStore();
  const { prices } = useLivePrices();

  // Combine static and custom tokens for lookup
  const tokenLookup = useMemo(() => {
    const map: Record<string, any> = { ...TOKEN_MAP };
    if (customTokens && Array.isArray(customTokens)) {
      customTokens.forEach(t => {
        if (t && t.symbol) {
          map[t.symbol] = t;
        }
      });
    }
    return map;
  }, [customTokens]);

  const totalBalance = useMemo(() => getTotalBalance(prices), [prices, tokenBalances, cashBalance]);
  const pnl = useMemo(() => getTotalPnL(prices), [prices, tokenBalances]);
  const isPnlPositive = pnl.dollarChange >= 0;

  // Combined list of all tokens for display
  const allTokens = useMemo(() => {
    return [...TOKENS, ...customTokens];
  }, [customTokens]);

  const sortedTokenRows = useMemo(() => {
    return [...allTokens].sort((a, b) => {
      const aBal = tokenBalances.find(bal => bal.symbol === a.symbol)?.balance || 0;
      const bBal = tokenBalances.find(bal => bal.symbol === b.symbol)?.balance || 0;

      const aPrice = prices[a.symbol]?.usd ?? a.price ?? 0;
      const bPrice = prices[b.symbol]?.usd ?? b.price ?? 0;

      const aVal = aBal * aPrice;
      const bVal = bBal * bPrice;

      if (aBal > 0 && bBal === 0) return -1;
      if (aBal === 0 && bBal > 0) return 1;
      return bVal - aVal;
    });
  }, [allTokens, tokenBalances, prices]);

  const prefetchedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    setMounted(true);
    // Prefetch top 5 tokens immediately to make common navigation instant
    sortedTokenRows.slice(0, 5).forEach(bal => {
      if (!prefetchedRef.current.has(bal.symbol)) {
        router.prefetch(`/token/${bal.symbol}`);
        prefetchedRef.current.add(bal.symbol);
      }
    });
  }, [router, sortedTokenRows]);

  if (!mounted) return <HomeSkeleton />;

  return (
    <div className="flex flex-col pb-32">
      <div className="px-4">
        {/* ── Balance Section ── */}
        <div className="pt-4 pb-4 walkthrough-balance">
          <div
            className="text-white"
            style={{ fontSize: 38, lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: 600 }}
          >
            {formatCurrency(totalBalance, baseCurrency, 2)}
          </div>

          {totalBalance > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className="font-medium"
                style={{ color: isPnlPositive ? "var(--color-phantom-green)" : "var(--color-phantom-red)", fontSize: 15, letterSpacing: "-0.01em" }}
              >
                {isPnlPositive ? "+" : "-"}
                {Math.abs(pnl.dollarChange) > 0 && Math.abs(pnl.dollarChange) < 0.01
                  ? `<${formatCurrency(0.01, baseCurrency)}`
                  : formatCurrency(Math.abs(pnl.dollarChange), baseCurrency)}
              </span>
              <span
                className="font-bold rounded-sm"
                style={{
                  backgroundColor: isPnlPositive ? "var(--color-phantom-green)" : "var(--color-phantom-red)",
                  color: "#000000",
                  fontSize: 13,
                  padding: "1px 7px",
                }}
              >
                {isPnlPositive ? "+" : ""}{pnl.percentChange.toFixed(2)}%
              </span>
            </div>
          )}

          {totalBalance === 0 && (
            <p className="text-sm mt-2" style={{ color: "#A0A0A0" }}>
              Add funds to get started. Withdraw anytime.
            </p>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-4 gap-2.5 mb-5 walkthrough-actions">
          <ActionButton Icon={SendIcon} label="Send" onClick={() => router.push('/home?modal=send')} />
          <ActionButton Icon={SwapIcon} label="Swap" onClick={() => router.push('/swap')} />
          <ActionButton Icon={ReceiveIcon} label="Receive" onClick={() => router.push('/home?modal=receive')} />
          <ActionButton Icon={BuyIcon} label="Buy" onClick={() => router.push('/home?modal=buy')} />
        </div>

        {/* ── Cash Balance Card ── */}
        <div className="bg-[#232323] rounded-xl px-4.5 py-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[#a9a9a9] font-medium text-[14px] mb-0.5">Cash Balance</div>
            <div className="text-[#f3f3f3] font-semibold text-[22px] leading-tight">{formatCurrency(cashBalance, baseCurrency)}</div>
          </div>
          <button
            onClick={() => router.push('/home?modal=buy')}
            className="bg-[#ac9cf2] text-[#111111] font-semibold px-5 py-2 rounded-lg text-sm active:scale-95 transition-transform"
          >
            Add Cash
          </button>
        </div>

        {/* ── Tokens Section ── */}
        <div className="flex items-center justify-between mb-2 walkthrough-tokens">
          <button
            onClick={() => setManageTokensVisible(true)}
            className="flex items-center gap-0.5 hover:opacity-80 active:opacity-60 transition-opacity"
          >
            <span className="text-[#f3f3f3] text-xl font-semibold">Tokens</span>
            <ChevronRight size={20} strokeWidth={2.5} className="text-[#bcbcbc]" />
          </button>
        </div>

        <div className="flex flex-col gap-2 pb-4">
          {sortedTokenRows.map((tokenInfo, idx) => {
            const balanceEntry = tokenBalances.find(b => b.symbol === tokenInfo.symbol);
            const balance = balanceEntry?.balance || 0;

            const price = prices[tokenInfo.symbol]?.usd ?? tokenInfo.price;
            const change24h = prices[tokenInfo.symbol]?.usd_24h_change ?? 0;
            const usdValue = balance * price;

            const price24hAgo = price / (1 + change24h / 100);
            const value24hAgo = balance * price24hAgo;
            const tokenPnl = usdValue - value24hAgo;
            const isTokenPnlPositive = tokenPnl >= 0;

            return (
              <Link
                key={tokenInfo.symbol}
                href={`/token/${tokenInfo.symbol}`}
                prefetch={true}
                className="w-full flex items-center gap-2.5 py-4 px-4 pr-5 bg-[#232323] rounded-xl active:scale-[0.97] transition-transform duration-[50ms]"
              >
                <div className="flex-shrink-0">
                  <TokenLogo
                    token={tokenInfo}
                    size={48}
                    liveImage={prices[tokenInfo.symbol]?.image}
                    priority={idx < 5}
                  />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-medium text-[#f3f3f3]">
                      {tokenInfo.name}
                    </span>
                    {TOKENS.some(t => t.symbol === tokenInfo.symbol) && (
                      <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <path fill="#ac9cf2" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.042 1.041l-.257 3.223a1.136 1.136 0 0 1-.268.646l-2.097 2.46a1.136 1.136 0 0 0 0 1.474l2.097 2.46c.155.182.249.408.268.646l.257 3.223c.044.556.486.997 1.042 1.041l3.222.257c.238.02.464.113.646.268l2.46 2.097a1.136 1.136 0 0 0 1.474 0l2.46-2.097c.182-.155.408-.249.646-.268l3.223-.257a1.136 1.136 0 0 0 1.041-1.041l.258-3.223c.019-.238.112-.464.267-.646l2.097-2.46a1.136 1.136 0 0 0 0-1.474l-2.097-2.46a1.136 1.136 0 0 1-.267-.646l-.258-3.223a1.136 1.136 0 0 0-1.041-1.041l-3.223-.257a1.136 1.136 0 0 1-.646-.268z" />
                        <path fill="#111111" d="M16.814 9.581a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: "rgb(136, 136, 136)" }}>
                    {formatBalance(balance)} {tokenInfo.symbol}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-medium text-[#f3f3f3]">
                    {formatCurrency(usdValue, baseCurrency)}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{
                      color: balance === 0 ? "rgb(136, 136, 136)" : isTokenPnlPositive ? "var(--color-phantom-green)" : "var(--color-phantom-red)",
                    }}
                  >
                    {balance === 0
                      ? formatCurrency(0, baseCurrency)
                      : `${isTokenPnlPositive ? "+" : "-"}${Math.abs(tokenPnl) > 0 && Math.abs(tokenPnl) < 0.01
                        ? `<${formatCurrency(0.01, baseCurrency)}`
                        : formatCurrency(Math.abs(tokenPnl), baseCurrency)
                      }`}
                  </div>
                </div>
              </Link>
            );
          })}


          {/* <div className="mt-8 mb-6 px-1">
            <button className="w-full flex items-center gap-4 text-left active:opacity-60 transition-opacity">
              <div className="w-14 h-14 bg-[#1c1c1e] rounded-2xl flex items-center justify-center shrink-0">
                <div className="relative w-8 h-8 opacity-40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-semibold text-white leading-tight">No verified collections to show</div>
                <div className="text-[14px] text-[#888] mt-0.5">Tap to see all collectibles</div>
              </div>
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between px-1 mb-4">
              <div className="text-[17px] font-bold text-white">Perps</div>
              <ChevronRight size={18} className="text-[#888]" />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1 -mx-1">
              {[
                { symbol: "CBRS", change: "-14.14%", logo: "https://app.hyperliquid.xyz/coins/xyz:CBRS.svg" },
                { symbol: "COIN", change: "-7.60%", logo: "https://app.hyperliquid.xyz/coins/xyz:COIN.svg" },
                { symbol: "BIRD", change: "-8.86%", logo: "https://app.trade.xyz/markets/bird.svg" },
                { symbol: "SOL", change: "+2.45%", logo: "/tokens/sol.webp" }
              ].map((perp) => (
                <div key={perp.symbol} className="flex flex-col items-center min-w-[70px] shrink-0 active:scale-95 transition-transform cursor-pointer">
                  <div className="relative mb-2">
                    <div className="w-[52px] h-[52px] rounded-[16px] bg-[#1c1c1e] overflow-hidden flex items-center justify-center p-2.5">
                      <img src={perp.logo} alt={perp.symbol} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1c1c1e] border-2 border-[#111] flex items-center justify-center text-[10px] text-[#888] font-bold">
                      ∞
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[13px] font-bold text-white">{perp.symbol}</span>
                    <div className="px-1 py-0.5 rounded-sm bg-[#2c2c2e] text-[10px] font-bold text-[#888]">10x</div>
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: perp.change.startsWith('-') ? "rgb(238, 66, 32)" : "var(--color-phantom-green)" }}>
                    {perp.change}
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* ── Support Section ── */}
          <div className="my-8">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-wider mb-2 px-1">Support</div>
            <div className="flex flex-col">
              {[
                "How your funds are stored",
                "How wallets are secured",
                "Tips for avoiding scams",
                "Learn",
                "View FAQ"
              ].map((text) => (
                <button
                  key={text}
                  className="flex items-center justify-between py-3.5 px-1 border-b border-white/[0.03] last:border-0 active:opacity-60 transition-opacity"
                >
                  <span className="text-[17px] font-medium text-[#efefef]">{text}</span>
                  <ChevronRight size={18} className="text-[#888]" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Disclosures ── */}
          <button className="flex items-center gap-2 px-1 py-4 mb-8 active:opacity-60 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="12" cy="12" r="10" stroke="#6e6e6e" strokeWidth="2"></circle>
              <line x1="12" y1="16" x2="12" y2="12" stroke="#6e6e6e" strokeWidth="2" strokeLinecap="round"></line>
              <circle cx="12" cy="8" r="1.5" fill="#6e6e6e"></circle>
            </svg>
            <span className="text-[14px] font-medium text-[#888]">View disclosures</span>
          </button>
        </div>
      </div>
    </div>
  );
}
