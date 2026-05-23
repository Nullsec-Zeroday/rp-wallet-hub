"use client";

import React, { useMemo } from "react";
import { Eye, EyeOff, X, ArrowDown, Send, ArrowRightLeft, Copy, ChevronLeft } from "lucide-react";
import { useWalletStore, Transaction } from "@/lib/wallet-store";
import { TOKENS, formatCurrency } from "@/lib/wallet-data";
import { toast } from "sonner";
import { SendIcon } from "../action-icons";
import TokenLogo from "../token-logo";
import { useLivePrices } from "@/hooks/useLivePrices";

interface RecentActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatGroupDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatFullDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${displayHours}:${minutes} ${ampm}`;
};

const shortenAddress = (addr: string) => {
  if (!addr) return "—";
  if (addr === "Self" || addr === "External Wallet") return addr;
  return addr.slice(0, 4) + "..." + addr.slice(-4);
};

export default function RecentActivityModal({ visible, onClose }: RecentActivityModalProps) {
  const { transactions, showBalances, toggleShowBalances, customTokens } = useWalletStore();
  const { prices } = useLivePrices();

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
    sorted.forEach((tx) => {
      const groupKey = formatGroupDate(tx.timestamp);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });
    return Object.entries(groups).map(([date, txs]) => ({ date, txs }));
  }, [transactions]);

  const getTokenInfo = (symbol: string) => {
    const staticToken = TOKENS.find(t => t.symbol === symbol);
    if (staticToken) return staticToken;
    return customTokens.find(t => t.symbol === symbol) || TOKENS[0];
  };

  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
  const [isDetailClosing, setIsDetailClosing] = React.useState(false);
  const [showSolscan, setShowSolscan] = React.useState(false);
  const [isSolscanClosing, setIsSolscanClosing] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setSelectedTx(null);
      setIsDetailClosing(false);
      setShowSolscan(false);
      setIsSolscanClosing(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[120] flex flex-col justify-end items-center sm:px-4">
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
        className="w-full max-w-lg flex flex-col rounded-t-[32px] overflow-hidden relative"
        style={{
          background: "rgb(17, 17, 17)",
          height: "94vh",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
          transform: "translateZ(0)"
        }}
      >

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">

          {/* Transaction Detail View Overlay */}
          {selectedTx && (
            <div
              className="absolute inset-0 z-[40] flex flex-col bg-[#111111]"
              style={{
                animation: isDetailClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.2s ease forwards"
              }}
            >
              {/* Detail Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                <span className="text-xl font-medium text-[#eeeeee]">
                  {selectedTx.type === 'receive' ? 'Received' : selectedTx.type === 'send' ? 'Sent' : selectedTx.type === 'swap' ? 'Swapped' : ''}
                </span>
                <button
                  onClick={() => {
                    setIsDetailClosing(true);
                    setTimeout(() => {
                      setSelectedTx(null);
                      setIsDetailClosing(false);
                    }, 200);
                  }}
                  className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
                {/* Token Icon with Badge */}
                <div className="flex justify-center pb-3">
                  {selectedTx.type === 'swap' ? (
                    <div className="relative w-[90px] h-[72px] flex items-center justify-center">
                      <div className="absolute left-0 z-0">
                        <div className="bg-black rounded-full p-0 border-[3px] border-[#111111]">
                          <TokenLogo
                            token={getTokenInfo(selectedTx.token)}
                            size={52}
                            liveImage={prices[selectedTx.token]?.image}
                            hideChainIcon
                          />
                        </div>
                      </div>
                      <div className="absolute right-0 z-10">
                        <div className="bg-black rounded-full p-0 border-[3px] border-[#111111]">
                          <TokenLogo
                            token={getTokenInfo(selectedTx.toToken || "USDC")}
                            size={52}
                            liveImage={prices[selectedTx.toToken || "USDC"]?.image}
                            hideChainIcon
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="bg-black rounded-full p-0">
                        <TokenLogo
                          token={getTokenInfo(selectedTx.token)}
                          size={72}
                          liveImage={prices[selectedTx.token]?.image}
                          hideChainIcon
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-[28px] h-[28px] rounded-full border-[2.5px] border-[#111111] flex items-center justify-center ${selectedTx.type === 'receive' ? 'bg-[#30a46c]' : 'bg-blue-400'}`}>
                        {selectedTx.type === 'receive' ? (
                          <ArrowDown size={14} className="text-white" strokeWidth={3} />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m10 14 1.086 3.802c.831 2.909 4.958 2.898 5.774-.015L20.04 6.424c.42-1.502-.963-2.886-2.465-2.465L6.213 7.14c-2.913.816-2.924 4.943-.015 5.774zm0 0 3-3" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Large Amount */}
                <div className="text-center mb-6">
                  <h1
                    className="text-4xl font-medium tracking-tight text-white"
                  >
                    {showBalances ? (
                      selectedTx.type === 'receive'
                        ? `+${selectedTx.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${selectedTx.token}`
                        : `-${selectedTx.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${selectedTx.token}`
                    ) : "••••••"}
                  </h1>
                </div>

                {/* Details Table */}
                <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden mb-6">
                  {[
                    { label: "Date", value: formatFullDate(selectedTx.timestamp), className: "text-[#eeeeee] font-medium" },
                    { label: "Status", value: "Succeeded", color: "rgb(48, 164, 108)", className: "font-semibold" },
                    { label: selectedTx.type === 'receive' ? "From" : "To", value: selectedTx.type === 'receive' ? selectedTx.from : selectedTx.to, isAddress: true, className: "text-[#888888] font-semibold" },
                    { label: "Network", value: "Solana", className: "text-[#eeeeee] font-semibold" },
                    { label: "Network Fee", value: "-0.00008 SOL", className: "text-[#eeeeee] font-semibold" }
                  ].map((row, i) => (
                    <div key={row.label} className={`flex items-center justify-between p-4 px-5 ${i !== 0 ? "border-t border-white/[0.03]" : ""}`}>
                      <span className="text-[15px] font-medium text-[#888]">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[15px] ${row.className || ""}`}
                          style={row.color ? { color: row.color } : undefined}
                        >
                          {row.isAddress
                            ? (row.value?.length > 12 ? `${row.value.slice(0, 4)}...${row.value.slice(-4)}` : row.value)
                            : row.value
                          }
                        </span>
                        {row.isAddress && row.value && row.value !== "External Wallet" && row.value !== "Self" && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(row.value);
                              toast.success("Address copied");
                            }}
                            className="text-[#888] active:opacity-60"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Button */}
              <div className="px-4 pb-[calc(env(safe-area-inset-bottom))] pt-2 flex-shrink-0">
                <button
                  onClick={() => setShowSolscan(true)}
                  className="w-full h-[54px] rounded-[18px] font-medium text-[17px] active:scale-[0.98] transition-transform bg-[#ab9ff2] text-[#111111]"
                >
                  View on Solscan
                </button>
              </div>
            </div>
          )}

          {/* Solscan Overlay */}
          {showSolscan && (
            <div
              className="absolute inset-0 z-[50] flex flex-col bg-[#111111] overflow-y-auto"
              style={{
                animation: isSolscanClosing ? "slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards"
              }}
            >
              <div className="bg-[#111111] pt-0 pb-5">
                {/* Header Row */}
                <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[#111111] z-20">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setIsSolscanClosing(true);
                        setTimeout(() => {
                          setShowSolscan(false);
                          setIsSolscanClosing(false);
                        }, 300);
                      }}
                      className="p-1 active:opacity-60 transition-opacity"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></path></svg>
                    </button>
                    <div className="font-bold text-[18px] flex items-center gap-0.5">
                      <span className="text-white">SOL</span>
                      <span className="text-[#2EC08B]">SCAN</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#8B5CF6] p-1.5 rounded-full">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"></line><line x1="3" y1="6" x2="21" y2="6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"></line><line x1="3" y1="18" x2="21" y2="18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"></line></svg>
                    </div>
                    <div className="bg-[#1f1f1f] p-1.5 rounded-full">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></circle><line x1="12" y1="1" x2="12" y2="3" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="12" y1="21" x2="12" y2="23" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="1" y1="12" x2="3" y2="12" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="21" y1="12" x2="23" y2="12" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></line></svg>
                    </div>
                  </div>
                </div>

                {/* Price Row */}
                <div className="flex items-center gap-2 px-4 py-1 text-[13px] text-[#b4b4b4]">
                  <span className="text-[#eeeeee] font-semibold">$87.92</span>
                  <span className="text-[#2EC08B]">+1.49%</span>
                  <span>|</span>
                  <span>Avg Fee:</span>
                  <span className="text-[#eeeeee]">0.00001571</span>
                </div>

                {/* Search Bar */}
                <div className="px-4 mt-3 relative">
                  <input
                    placeholder="Search transactions, blocks, programs..."
                    className="w-full bg-[#1e1e24] text-white text-[13px] rounded-full py-2.5 pl-4 pr-10 outline-none border border-transparent focus:border-[#333]"
                    readOnly
                  />
                  <div className="absolute right-7 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"></circle><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"></line></svg>
                  </div>
                </div>

                <div className="px-4 mt-6">
                  {/* Transaction Details Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-[18px] font-bold text-[#eeeeee]">Transaction Details</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1e24] text-[#2EC08B] text-[12px] font-medium border border-[#2EC08B]/30">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="7" y1="17" x2="17" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></line><polyline points="7 7 17 7 17 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></polyline></svg>
                      {selectedTx?.type === 'swap' ? 'Swap' : selectedTx?.type === 'receive' ? 'Receive' : 'Transfer'}
                    </div>
                  </div>

                  {/* Sponsored Banner */}
                  <div className="flex items-center gap-2 text-[12px] bg-[#1e1e24] rounded-lg p-2.5 mb-3 text-[#b4b4b4]">
                    <span className="font-semibold text-gray-500">Sponsored:</span>
                    <span className="font-bold text-white">Vega</span>
                    <span className="truncate flex-1">– 100FS 750% Bonus...</span>
                    <span className="font-bold text-[#3B82F6] ml-auto shrink-0">PLAY NOW</span>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide text-[13px]">
                    <div className="px-3 py-1.5 bg-[#1e1e24] rounded-md whitespace-nowrap text-[#eeeeee]">Buy ∨</div>
                    <div className="px-3 py-1.5 bg-[#1e1e24] rounded-md whitespace-nowrap text-[#eeeeee]">Presale ∨</div>
                    <div className="px-3 py-1.5 bg-[#1e1e24] rounded-md whitespace-nowrap text-[#eeeeee]">Play ∨</div>
                    <div className="px-3 py-1.5 bg-[#1e1e24] rounded-md whitespace-nowrap text-[#eeeeee]">Gaming ∨</div>
                  </div>

                  <div className="flex items-center gap-5 text-[14px] border-b border-[#2a2a2a] pb-3 mb-4">
                    <span className="text-[#2EC08B] font-semibold border-b-2 border-[#2EC08B] pb-3 -mb-3">Overview</span>
                    <span className="text-[#b4b4b4] font-medium">Changes</span>
                    <span className="text-[#b4b4b4] font-medium">Raw</span>
                    <div className="flex-1"></div>
                    <span className="text-[#3B82F6] font-medium">&lt;/&gt; API</span>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#1a1a1f] rounded-xl p-4 mb-4 border border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-2 text-[#eeeeee] font-semibold text-[15px]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></path></svg>
                      Summary
                    </div>
                    <div className="text-[14px] text-[#b4b4b4] leading-relaxed">
                      {selectedTx?.type === 'swap' ? (
                        <>
                          Swapped <span className="text-white font-semibold">{selectedTx.amount} {selectedTx.token}</span> for <span className="text-white font-semibold">{selectedTx.toAmount} {selectedTx.toToken}</span>
                        </>
                      ) : (
                        <>
                          {selectedTx?.type === 'receive' ? 'Received' : 'Sent'} <span className="text-white font-semibold">{selectedTx?.amount}</span> <span className="text-[#2EC08B]">${Math.floor(Number(selectedTx?.amount || 0) * 1).toLocaleString()}</span> <span className="text-white font-semibold">◎ {selectedTx?.token || "SOL"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Details Table */}
                  <div className="bg-[#1a1a1f] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col text-[14px]">

                    {/* Signature Row */}
                    <div className="p-4 border-b border-[#2a2a2a]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></path></svg>
                          Signature
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#3B82F6] text-white px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></circle></svg>
                          Inspect Tx
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[#3B82F6] truncate mt-1">
                        <span className="truncate">2kPxNbQ7mT9eZgfcBG4...ZKpwEd5r3deG</span>
                        <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></path></svg>
                      </div>
                    </div>

                    {/* Detail Rows */}
                    {[
                      { label: "Block", value: "40,63,55,001", isLink: true },
                      { label: "Timestamp", value: "May 16, 2026 at 01:13 AM (UTC)", isLink: false },
                      { label: "Result", value: "SUCCESS", isSuccess: true },
                      { label: "Fee", value: "0.000006975 SOL", isLink: false },
                      { label: "Priority Fee", value: "0.000000541 SOL", isLink: false },
                      { label: "Compute Units Consumed", value: "22,110 / 58,049", isLink: false },
                      { label: "Tx Version", value: "Legacy", isLink: false },
                      { label: "Recent Block Hash", value: "Mh3Pj5Rm7To9...m7To9VqB", isLink: false },
                      { label: "Signer", value: "4Fk2rY9s...3v8nLM", isLink: true },
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 border-b border-[#2a2a2a] last:border-0">
                        <div className="text-[#b4b4b4] w-[45%] pr-2 flex items-center gap-2 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                          {row.label}
                        </div>
                        <div className="flex-1 flex justify-end text-right min-w-0">
                          {row.isSuccess ? (
                            <div className="bg-[#2EC08B]/20 text-[#2EC08B] px-2 py-0.5 rounded text-[11px] font-bold">SUCCESS</div>
                          ) : (
                            <div className={`${row.isLink ? "text-[#3B82F6]" : "text-[#eeeeee]"} break-all text-[13px]`}>
                              {row.value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Instruction Details */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[16px] font-bold text-[#eeeeee]">Instruction Details</h2>
                      <div className="flex items-center gap-2 bg-[#1a1a1f] p-1 rounded-md border border-[#2a2a2a]">
                        <span className="bg-[#333] px-3 py-1 rounded text-[12px] text-white">List</span>
                        <span className="px-3 py-1 rounded text-[12px] text-[#b4b4b4]">Tree</span>
                      </div>
                    </div>

                    <div className="text-[12px] text-[#b4b4b4] mb-2">Compute Units Distribution Total: 29,991</div>
                    <div className="flex h-2 w-full rounded-full overflow-hidden mb-4">
                      <div className="bg-[#2EC08B] w-[40%]"></div>
                      <div className="bg-[#3B82F6] w-[25%]"></div>
                      <div className="bg-[#F59E0B] w-[15%]"></div>
                      <div className="bg-[#8B5CF6] w-[12%]"></div>
                      <div className="bg-[#EC4899] w-[8%]"></div>
                    </div>

                    <div className="bg-[#1a1a1f] rounded-xl border border-[#2a2a2a] overflow-hidden">
                      {[
                        { id: 1, name: "Transfer", sub: "System Program", color: "bg-[#2EC08B]" },
                        { id: 2, name: "Transfer", sub: "Token Program", color: "bg-[#3B82F6]" },
                        { id: 3, name: "TransferChecked", sub: "Token Program", color: "bg-[#3B82F6]" },
                        { id: 4, name: "Create", sub: "Associated Token Account", color: "bg-[#F59E0B]" },
                        { id: 5, name: "SetComputeUnitLimit", sub: "Compute Budget", color: "bg-[#8B5CF6]" },
                        { id: 6, name: "SetComputeUnitPrice", sub: "Compute Budget", color: "bg-[#EC4899]" },
                      ].map((inst) => (
                        <div key={inst.id} className="flex items-center p-3 border-b border-[#2a2a2a] last:border-0">
                          <div className={`${inst.color} text-white text-[11px] font-bold px-2 py-1 rounded mr-3 shrink-0`}>#{inst.id}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#eeeeee] truncate">{inst.name}</div>
                            <div className="text-[12px] text-[#b4b4b4] truncate">{inst.sub}</div>
                          </div>
                          <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="9 18 15 12 9 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></polyline></svg>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#1a1a1f] border border-[#2a2a2a] rounded-xl mt-4 cursor-pointer">
                    <div className="text-[14px] font-semibold text-[#eeeeee]">Program Logs</div>
                    <div className="text-[13px] text-[#3B82F6]">Show details ▾</div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-[#2a2a2a] pb-[calc(24px+env(safe-area-inset-bottom))]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="font-bold text-[13px] text-[#eeeeee]">Powered by Solana Blockchain</div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[12px] text-[#b4b4b4] mb-4">
                      <span className="cursor-pointer hover:text-white">Home</span>
                      <span className="cursor-pointer hover:text-white">Blocks</span>
                      <span className="cursor-pointer hover:text-white">Transactions</span>
                      <span className="cursor-pointer hover:text-white">Tokens</span>
                      <span className="cursor-pointer hover:text-white">Analytics</span>
                    </div>
                    <div className="flex items-center justify-between mt-8">
                      <div className="flex gap-4">
                        <span className="text-[#b4b4b4] cursor-pointer hover:text-white text-[16px]">𝕏</span>
                        <span className="text-[#b4b4b4] cursor-pointer hover:text-white text-[16px]">f</span>
                        <span className="text-[#b4b4b4] cursor-pointer hover:text-white text-[16px]">in</span>
                      </div>
                      <div className="text-[12px] text-[#b4b4b4] cursor-pointer hover:text-white">
                        ↑ Back to Top
                      </div>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] mt-4">
                      © 2026 Solscan. All rights reserved.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <span className="text-xl font-medium text-[#eeeeee]">Recent Activity</span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleShowBalances}
                className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
              >
                {showBalances ? (
                  <EyeOff size={24} className="text-[#eeeeee]" strokeWidth={1.8} />
                ) : (
                  <Eye size={24} className="text-[#eeeeee]" strokeWidth={1.8} />
                )}
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

          {/* Scroll Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4" style={{ overscrollBehavior: "contain" }}>
            {groupedTransactions.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                <p className="text-base text-[#888888]">No recent activity</p>
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <div key={group.date} className="mb-6">
                  <div className="px-1 pb-3 text-[#eeeeee] font-semibold text-[15px]">
                    {group.date}
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.txs.map((tx, idx) => {
                      const tokenInfo = getTokenInfo(tx.token);
                      const isReceive = tx.type === "receive";
                      const isSend = tx.type === "send";
                      const isSwap = tx.type === "swap";

                      let amountStr = "";
                      if (isSwap) {
                        amountStr = tx.toAmount ? `+${tx.toAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${tx.toToken}` : "";
                      } else {
                        amountStr = `${isReceive ? "+" : "-"}${tx.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${tx.token}`;
                      }

                      return (
                        <button
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="flex items-center px-4 py-[14px] text-left active:scale-[0.98] transition-transform w-full bg-[#1c1c1e] rounded-[20px]"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {isSwap ? (
                              <div className="relative flex-shrink-0 mr-3 w-[44px] h-[44px]">
                                <div className="absolute top-0 left-0 z-0">
                                  <TokenLogo
                                    token={getTokenInfo(tx.toToken || "USDC")}
                                    size={30}
                                    liveImage={prices[tx.toToken || "USDC"]?.image}
                                    hideChainIcon
                                  />
                                </div>
                                <div className="absolute bottom-0 right-0 z-10 rounded-full border-[2.5px] border-[#1c1c1e] bg-[#1c1c1e]">
                                  <TokenLogo
                                    token={tokenInfo}
                                    size={30}
                                    liveImage={prices[tokenInfo.symbol]?.image}
                                    hideChainIcon
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="relative flex-shrink-0 mr-3">
                                <TokenLogo
                                  token={tokenInfo}
                                  size={44}
                                  liveImage={prices[tokenInfo.symbol]?.image}
                                  hideChainIcon
                                />
                                <div
                                  className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: isReceive ? "#8B5CF6" : "#ab9ff2" }}
                                >
                                  {isReceive ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><path d="M11.0737 19.4932L4.89026 13.7049L6.76695 11.9256L10.6888 15.6193V3.75H13.3354V15.6193L17.2572 11.9256L19.1339 13.7049L12.9504 19.4932L12.0121 20.3265L11.0737 19.4932Z"></path></svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000"><path d="M5.70147 4.0003C5.58476 4.00441 5.47074 4.03658 5.36909 4.0941C5.26743 4.15162 5.18113 4.23278 5.11747 4.33074C5.05382 4.42869 5.01469 4.54054 5.0034 4.65682C4.99212 4.7731 5.009 4.89039 5.05262 4.99876L7.56284 11.2736H13.0007C13.1937 11.2736 13.3788 11.3503 13.5152 11.4868C13.6517 11.6233 13.7283 11.8084 13.7283 12.0015C13.7283 12.1945 13.6517 12.3797 13.5152 12.5162C13.3788 12.6527 13.1937 12.7294 13.0007 12.7294H7.56142L5.05262 19.0042C4.99813 19.1414 4.98666 19.2919 5.01974 19.4358C5.05283 19.5797 5.1289 19.71 5.23785 19.8096C5.3468 19.9092 5.48346 19.9733 5.62968 19.9933C5.77589 20.0133 5.92474 19.9883 6.05642 19.9217L20.5938 12.6541C20.7157 12.5941 20.8184 12.5012 20.8902 12.3859C20.9619 12.2705 21 12.1374 21 12.0015C21 11.8656 20.9619 11.7324 20.8902 11.6171C20.8184 11.5017 20.7157 11.4088 20.5938 11.3489L6.05642 4.08126C5.94689 4.0246 5.82474 3.99674 5.70147 4.0003Z"></path></svg>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-[#eeeeee] font-semibold text-[16px] leading-tight truncate">
                                  {isSwap ? "Token Swap" : isReceive ? "Received" : "Sent"}
                                </div>
                                <div
                                  className="font-semibold text-[15px] leading-tight flex-shrink-0 text-right"
                                  style={{ color: isReceive || isSwap ? "rgb(48, 164, 108)" : "rgb(238, 66, 32)" }}
                                >
                                  {showBalances ? amountStr : "••••"}
                                </div>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="text-[#b4b4b4] text-[14px] font-medium leading-tight truncate">
                                  {isSwap ? (
                                    `${tx.token} -> ${tx.toToken}`
                                  ) : isReceive ? (
                                    `From: ${shortenAddress(tx.from)}`
                                  ) : (
                                    `To: ${shortenAddress(tx.to)}`
                                  )}
                                </div>
                                {isSwap && (
                                  <div className="text-[#b4b4b4] text-[14px] font-medium leading-tight flex-shrink-0 text-right">
                                    {showBalances ? `-${tx.amount} ${tx.token}` : "••••"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
