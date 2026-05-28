"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Loader2, Check, Trash2 } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { type TokenInfo, TOKENS } from "@/lib/wallet-data";
import { toast } from "sonner";
import { motion } from "framer-motion";
import TokenLogo from "../token-logo";
import { useLivePrices } from "@/hooks/useLivePrices";

interface ManageTokensModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
  chainId?: string;
}

export default function ManageTokensModal({ visible, onClose, onCloseStart }: ManageTokensModalProps) {
  const {
    addCustomToken,
    removeCustomToken,
    tokenBalances,
    customTokens,
    dexscreenerApiKey,
    updateAllBalances
  } = useWalletStore();
  const { prices } = useLivePrices();

  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [localBalances, setLocalBalances] = useState<Record<string, string>>({});

  const allTokens = useMemo(() => {
    return [...TOKENS, ...customTokens];
  }, [customTokens]);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setSearchQuery("");
      setSearchResults([]);
      setLocalBalances(
        Object.fromEntries(tokenBalances.map((balance) => [balance.symbol, String(balance.balance)]))
      );
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [visible, tokenBalances]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        void handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const url = `/api/search?query=${encodeURIComponent(searchQuery)}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to search tokens");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImport = async (result: SearchResult) => {
    if (isImporting) return;
    setIsImporting(result.id);

    try {
      const url = `/api/token-info?id=${result.id}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch token info");
      const tokenInfo: TokenInfo = await res.json();

      addCustomToken(tokenInfo);
      setLocalBalances((prev) => ({
        ...prev,
        [tokenInfo.symbol]: "0"
      }));

      toast.success(`${tokenInfo.name} imported successfully`);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import token");
    } finally {
      setIsImporting(null);
    }
  };

  const handleRemoveCustom = (symbol: string) => {
    removeCustomToken(symbol);
    setLocalBalances((prev) => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
    toast.success("Token removed");
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSave = () => {
    const newBalances = allTokens.map((token) => ({
      symbol: token.symbol,
      balance: parseFloat(localBalances[token.symbol] ?? "0") || 0,
    }));
    updateAllBalances(newBalances);
    toast.success("Balances updated successfully");
    handleClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/15"
        onClick={handleClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg bg-[#111111] rounded-t-[32px] overflow-hidden relative flex flex-col will-change-transform"
        style={{ height: "94vh", transform: "translateZ(0)" }}
      >
        <div className="bg-[#191919] flex-shrink-0 flex items-center justify-between px-4 py-3 sticky top-0 z-20">
          <button onClick={handleClose} className="bg-transparent border-none p-1 cursor-pointer active:opacity-60 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          <span className="text-[17px] font-semibold text-[#eeeeee]">Manage Tokens</span>
          <div className="w-[30px]" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          <div className="px-4 py-4">
            <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2">
              Token Holdings
            </p>
            <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden border border-transparent">
              {allTokens.map((token, idx) => {
                const isCustom = !TOKENS.some((entry) => entry.symbol === token.symbol);
                return (
                  <React.Fragment key={token.symbol}>
                    <div className="flex items-center gap-3 px-4 py-3 h-[58px]">
                      <TokenLogo token={token} size={30} liveImage={prices[token.symbol]?.image} />
                      <span className="text-[15px] font-semibold text-white flex-1 truncate">
                        {token.name}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustom(token.symbol)}
                          className="text-[#E84142] active:opacity-60 p-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors flex-shrink-0"
                          title="Remove custom token"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <input
                        className="text-[15px] font-bold text-right rounded-lg px-3 py-1.5 w-[110px] bg-[#2c2c2e] text-white outline-none border border-transparent focus:border-[#AB9FF2]/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        value={localBalances[token.symbol] ?? "0"}
                        onChange={(event) =>
                          setLocalBalances((prev) => ({ ...prev, [token.symbol]: event.target.value }))
                        }
                      />
                    </div>
                    {idx < allTokens.length - 1 && (
                      <div className="h-px bg-[#2c2c2e] ml-12" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="px-4 pb-4">
            <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2">
              Search & Import Tokens
            </p>
            <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden p-4">
              <div className="flex items-center gap-2 bg-[#2c2c2e] rounded-xl px-3 py-2 border border-white/5 focus-within:border-[#AB9FF2]/30 transition-all">
                <Search size={15} className="text-[#8b8ca7] flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-[14px] outline-none text-white placeholder-[#5c5d7a]"
                  placeholder="Search token name or symbol..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchLoading && <Loader2 size={14} className="animate-spin text-[#AB9FF2] flex-shrink-0" />}
              </div>

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto hidden-scrollbar pt-3 mt-3 border-t border-[#2c2c2e]">
                  {searchResults.map((result) => {
                    const isAlreadyImported = allTokens.some(
                      (token) => token.coingeckoId === result.id || token.symbol.toLowerCase() === result.symbol.toLowerCase()
                    );
                    return (
                      <div key={result.id} className="flex items-center justify-between py-2 border-b border-[#2c2c2e]/30 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {result.thumb ? (
                            <img src={result.thumb} alt={result.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[12px] font-bold flex-shrink-0 text-white">
                              {result.symbol.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 ml-1">
                            <span className="text-[14px] font-semibold text-white truncate leading-tight">{result.name}</span>
                            <span className="text-[12px] text-[#8b8ca7] uppercase font-bold mt-0.5 leading-none">{result.symbol}</span>
                          </div>
                        </div>
                        <button
                          disabled={isAlreadyImported || isImporting === result.id}
                          onClick={() => handleImport(result)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                            isAlreadyImported
                              ? "bg-[#102A1E] text-[#10B981] cursor-default"
                              : isImporting === result.id
                                ? "bg-[#2c2c2e] text-[#8b8ca7] cursor-wait"
                                : "bg-[#AB9FF2] text-[#111111] active:scale-[0.97]"
                          }`}
                        >
                          {isAlreadyImported ? (
                            <>
                              <Check size={12} />
                              Added
                            </>
                          ) : isImporting === result.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Importing
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              Import
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111111] px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/[0.04]">
          <button
            onClick={handleSave}
            className="w-full h-[54px] rounded-[18px] bg-[#AB9FF2] text-[#111111] font-bold text-[17px] active:scale-[0.98] transition-transform"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
