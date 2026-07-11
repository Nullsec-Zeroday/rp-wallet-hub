"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WalletTransaction } from "@rp-wallet/types";
import { formatTrustBalance, formatTrustCurrency, getTrustToken } from "@/lib/trust-token-data";
import { useTrustWallet } from "@/lib/trust-wallet-context";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CHAINS = [
  { id: "Bitcoin", logo: "https://assets-cdn.trustwallet.com/blockchains/bitcoin/info/logo.png", color: "#f8a239" },
  { id: "Ethereum", logo: "https://assets-cdn.trustwallet.com/blockchains/ethereum/info/logo.png", color: "#627eea" },
  { id: "Solana", logo: "https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png", color: "#000" },
  { id: "BNB Smart Chain", logo: "https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png", color: "#0a0e11" },
  { id: "Tron", logo: "https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png", color: "#e12727" },
  { id: "Arbitrum", logo: "https://assets-cdn.trustwallet.com/blockchains/arbitrum/info/logo.png", color: "#28a0f0" },
  { id: "Base", logo: "https://assets-cdn.trustwallet.com/blockchains/base/info/logo.png", color: "#0052ff" },
];

const AZ_CHAINS = [
  { id: "Aeternity", logo: "https://assets-cdn.trustwallet.com/blockchains/aeternity/info/logo.png", color: "#f7296e" },
  { id: "Agoric", logo: "https://assets-cdn.trustwallet.com/blockchains/agoric/info/logo.png", color: "#e30b2c" },
];

function truncateAddress(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 14) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-5)}`;
}

const getOptimisticConfirmationDelay = () => 1000 + Math.random() * 500;

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const [show, setShow] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [search, setSearch] = useState("");
  const [networkSearch, setNetworkSearch] = useState("");
  const [activeChain, setActiveChain] = useState("All");
  const [showNetworkView, setShowNetworkView] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [step, setStep] = useState<"LIST" | "FORM" | "CONFIRM" | "PROCESSING" | "DETAILS">("LIST");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [activeInput, setActiveInput] = useState<"address" | "amount" | null>(null);
  const [createdTransaction, setCreatedTransaction] = useState<WalletTransaction | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const submissionIdRef = useRef(0);
  const { account, balanceMap, baseCurrency, createTransaction, prices, tokenSymbols, transactionError, transactionPending, walletAddress } = useTrustWallet();

  const availableTokens = tokenSymbols
    .filter((symbol) => (balanceMap[symbol] || 0) > 0)
    .filter((symbol) => {
      const token = getTrustToken(symbol);
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || token.name.toLowerCase().includes(query) || symbol.toLowerCase().includes(query);
      const matchesChain = activeChain === "All" || token.chain === activeChain;
      return matchesSearch && matchesChain;
    });

  const filteredPopularChains = POPULAR_CHAINS.filter(c => !networkSearch || c.id.toLowerCase().includes(networkSearch.toLowerCase()));
  const filteredAzChains = AZ_CHAINS.filter(c => !networkSearch || c.id.toLowerCase().includes(networkSearch.toLowerCase()));

  useEffect(() => {
    let timer: number;
    let showTimer: number;
    if (isOpen) {
      setIsRendered(true);
      setShowNetworkView(false);
      setSelectedToken(null);
      setStep("LIST");
      setAddress("");
      setAmount("");
      setActiveInput(null);
      setCreatedTransaction(null);
      submissionIdRef.current += 1;
      showTimer = window.setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      submissionIdRef.current += 1;
      timer = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(showTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOpen && step !== "PROCESSING") {
        window.dispatchEvent(new CustomEvent("trust-scale-bg", { detail: true }));
      } else {
        window.dispatchEvent(new CustomEvent("trust-scale-bg", { detail: false }));
      }
    }
  }, [isOpen, step]);

  if (!isRendered || typeof document === "undefined") return null;

  const selectedTokenData = selectedToken ? getTrustToken(selectedToken) : null;
  const selectedPrice = selectedToken ? (prices[selectedToken]?.usd ?? selectedTokenData?.price ?? 0) : 0;
  const parsedAmount = parseFloat(amount) || 0;
  const fiatValue = parsedAmount * selectedPrice;
  const networkFeeTokenAmount = selectedToken ? Math.min(Math.max(parsedAmount * 0.00002, 0.000001), 0.0000072) : 0;
  const networkFeeFiat = networkFeeTokenAmount * selectedPrice;
  const totalCost = fiatValue + networkFeeFiat;

  const pasteAddress = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text?.trim()) {
        setAddress(text.trim());
        return;
      }
    } catch {
      // The native edit menu remains available when clipboard permission is denied.
    }

    addressInputRef.current?.focus();
    setActiveInput("address");
  };

  const submitTransaction = async () => {
    if (!selectedToken || transactionPending) return;
    const submissionId = submissionIdRef.current + 1;
    submissionIdRef.current = submissionId;
    const now = new Date().toISOString();

    setCreatedTransaction({
      id: `optimistic-trust-tx-${Date.now()}`,
      walletAppId: "trust",
      accountId: account?.id || "trust-account",
      type: "send",
      status: "confirmed",
      tokenSymbol: selectedToken.trim().toUpperCase(),
      amount: String(parseFloat(amount) || 0),
      fromAddress: account?.address || walletAddress,
      toAddress: address.trim(),
      createdAt: now,
    });
    setStep("PROCESSING");

    window.setTimeout(() => {
      if (submissionIdRef.current === submissionId) {
        setStep("DETAILS");
      }
    }, getOptimisticConfirmationDelay());

    const transaction = await createTransaction({
      amount,
      fromAddress: account?.address || walletAddress,
      toAddress: address.trim(),
      tokenSymbol: selectedToken,
      type: "send",
    });
    if (transaction && submissionIdRef.current === submissionId) {
      setCreatedTransaction(transaction);
    }
  };

  return createPortal(
    <>
      <div
        style={{
          position: "fixed", inset: 0, background: step === "PROCESSING" ? "rgba(0,0,0,0.6)" : "transparent", zIndex: 10000,
          opacity: show ? 1 : 0, transition: "background 0.3s ease, opacity 0.25s ease", pointerEvents: show ? "auto" : "none"
        }}
        onClick={onClose}
      />
      <div
        id="trustSendPanel"
        style={{
          position: "fixed",
          top: "auto",
          bottom: "0px",
          left: "0px",
          width: "100%",
          height: step === "PROCESSING" ? "50vh" : "94vh",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          transform: show ? "translateY(0%)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxWidth: "500px",
          margin: "0 auto",
          right: 0,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", display: "flex" }}>
          {/* MAIN VIEW */}
          <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
            transform: (showNetworkView || selectedToken) ? "translateX(-30%)" : "translateX(0%)",
            opacity: (showNetworkView || selectedToken) ? 0 : 1,
            pointerEvents: (showNetworkView || selectedToken) ? "none" : "auto",
          }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 12px",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#888",
                  display: "flex",
                  alignItems: "center",
                  WebkitTapHighlightColor: "transparent",
                  zIndex: 2,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              <span
                style={{
                  color: "#fff",
                  fontSize: "19px",
                  fontWeight: 600,
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1,
                }}
              >
                Send
              </span>
              <div style={{ width: "38px" }}></div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "10px 16px", gap: "10px" }}>
                <svg fill="none" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: "#666", flexShrink: 0 }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.6262 1.99976C15.3904 1.99976 19.2527 5.86217 19.2528 10.6263C19.2528 12.3718 18.7333 13.9969 17.8415 15.355L21.4847 18.9983L21.6059 19.1326C22.1688 19.8231 22.1282 20.8412 21.4847 21.4848C20.841 22.1285 19.8222 22.1693 19.1316 21.6059L18.9983 21.4848L15.355 17.8415C13.9969 18.7333 12.3718 19.2528 10.6262 19.2528C5.86214 19.2527 1.99973 15.3904 1.99973 10.6263C1.99981 5.86222 5.86219 1.99984 10.6262 1.99976ZM10.6262 5.51628C7.80427 5.51636 5.51633 7.8043 5.51625 10.6263C5.51625 13.4483 7.80422 15.7362 10.6262 15.7363C13.4483 15.7363 15.7362 13.4484 15.7362 10.6263C15.7362 7.80425 13.4483 5.51628 10.6262 5.51628Z" fill="currentColor"></path>
                </svg>
                <input type="text" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "15px", caretColor: "#48FF91" }} />
              </div>
            </div>

            {/* Chain Filter Row */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px 12px", flexShrink: 0, WebkitOverflowScrolling: "touch", alignItems: "center" }} className="tw-scrollbar">
              <div onClick={() => setActiveChain("All")} style={{ width: "38px", height: "38px", flexShrink: 0, border: activeChain === "All" ? "2px solid #48FF91" : "2px solid transparent", borderRadius: "10px", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                <span style={{ color: activeChain === "All" ? "#48FF91" : "#aaa", fontSize: "13px", fontWeight: 600 }}>All</span>
              </div>
              {POPULAR_CHAINS.map(chain => (
                <div key={chain.id} onClick={() => setActiveChain(chain.id)} style={{ width: "38px", height: "38px", flexShrink: 0, borderRadius: "10px", overflow: "hidden", border: activeChain === chain.id ? "2px solid #48FF91" : "2px solid transparent", boxSizing: "border-box", background: chain.color, cursor: "pointer" }}>
                  <img src={chain.logo} alt={chain.id} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scale(1.2)" }} />
                </div>
              ))}
              <div onClick={() => setShowNetworkView(true)} style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", flexShrink: 0, borderRadius: "100px", background: "#2A2A2D", padding: "0 12px", cursor: "pointer", marginLeft: "4px" }}>
                <span style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>107</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 6L0 0H10L5 6Z" fill="#888" />
                </svg>
              </div>
            </div>

            {/* Token List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
              {availableTokens.map((symbol) => {
                const token = getTrustToken(symbol);
                const balance = balanceMap[symbol] || 0;
                const price = prices[symbol]?.usd ?? token.price;

                return (
                  <button
                    key={symbol}
                    onClick={() => { setSelectedToken(symbol); setStep("FORM"); }}
                    type="button"
                    style={{
                      alignItems: "center",
                      background: "transparent",
                      border: "0",
                      color: "#fff",
                      display: "flex",
                      gap: "12px",
                      marginBottom: "8px",
                      padding: "8px 0",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {token.logo ? (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img alt={token.name} src={token.logo} style={{ borderRadius: "50%", height: "42px", width: "42px" }} />
                        {symbol === "USDT" && (
                          <div style={{ position: "absolute", bottom: "-2px", right: "-2px", borderRadius: "50%", boxShadow: "0 0 3px 1px rgba(35,191,125,0.07)" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "50%", overflow: "hidden", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img alt="BNB" style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "contain" }} src="https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ alignItems: "center", background: "#2f3136", borderRadius: "50%", display: "grid", height: "42px", justifyItems: "center", width: "42px", flexShrink: 0 }}>{symbol.slice(0, 2)}</span>
                    )}
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <strong style={{ fontSize: "16px", fontWeight: 600 }}>{symbol}</strong>
                        <span style={{ marginLeft: "8px", padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", fontSize: "10px", color: "#aaa", fontWeight: 500 }}>{token.chain}</span>
                      </span>
                      <span style={{ color: "#aaa", fontSize: "13px" }}>{token.name}</span>
                    </span>
                    <span style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <strong style={{ fontSize: "16px", fontWeight: 600 }}>{formatTrustBalance(balance)}</strong>
                      <span style={{ color: "#aaa", fontSize: "13px" }}>{formatTrustCurrency(balance * price, baseCurrency)}</span>
                    </span>
                  </button>
                );
              })}
              {availableTokens.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: "14px" }}>
                  No tokens found
                </div>
              )}
            </div>
          </div>

          {/* NETWORK SELECTION VIEW */}
          <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            transform: showNetworkView ? "translateX(0%)" : "translateX(100%)",
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
          }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 12px",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowNetworkView(false)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#ccc",
                  display: "flex",
                  alignItems: "center",
                  WebkitTapHighlightColor: "transparent",
                  zIndex: 2,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span
                style={{
                  color: "#fff",
                  fontSize: "17px",
                  fontWeight: 600,
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1,
                }}
              >
                Select network
              </span>
              <div style={{ width: "36px" }}></div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "10px 16px", gap: "10px" }}>
                <svg fill="none" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: "#666", flexShrink: 0 }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.6262 1.99976C15.3904 1.99976 19.2527 5.86217 19.2528 10.6263C19.2528 12.3718 18.7333 13.9969 17.8415 15.355L21.4847 18.9983L21.6059 19.1326C22.1688 19.8231 22.1282 20.8412 21.4847 21.4848C20.841 22.1285 19.8222 22.1693 19.1316 21.6059L18.9983 21.4848L15.355 17.8415C13.9969 18.7333 12.3718 19.2528 10.6262 19.2528C5.86214 19.2527 1.99973 15.3904 1.99973 10.6263C1.99981 5.86222 5.86219 1.99984 10.6262 1.99976ZM10.6262 5.51628C7.80427 5.51636 5.51633 7.8043 5.51625 10.6263C5.51625 13.4483 7.80422 15.7362 10.6262 15.7363C13.4483 15.7363 15.7362 13.4484 15.7362 10.6263C15.7362 7.80425 13.4483 5.51628 10.6262 5.51628Z" fill="currentColor"></path>
                </svg>
                <input type="text" placeholder="Search for network" value={networkSearch} onChange={(event) => setNetworkSearch(event.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "15px", caretColor: "#48FF91" }} />
              </div>
            </div>

            {/* Network List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>

              {/* All networks option */}
              {(!networkSearch || "All networks".toLowerCase().includes(networkSearch.toLowerCase())) && (
                <button
                  onClick={() => { setActiveChain("All"); setShowNetworkView(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                    WebkitTapHighlightColor: "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <span style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>All networks</span>
                  </div>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: activeChain === "All" ? "6px solid #48FF91" : "2px solid #555", background: "transparent", transition: "all 0.1s ease" }} />
                </button>
              )}

              {filteredPopularChains.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ color: "#888", fontSize: "13px", fontWeight: 600, paddingBottom: "8px" }}>Popular networks</div>
                  {filteredPopularChains.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => { setActiveChain(chain.id); setShowNetworkView(false); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: chain.color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={chain.logo} alt={chain.id} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
                        </div>
                        <span style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>{chain.id}</span>
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: activeChain === chain.id ? "6px solid #48FF91" : "2px solid #555", background: "transparent", transition: "all 0.1s ease" }} />
                    </button>
                  ))}
                </div>
              )}

              {filteredAzChains.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ color: "#888", fontSize: "13px", fontWeight: 600, paddingBottom: "8px" }}>A-Z networks</div>
                  {filteredAzChains.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => { setActiveChain(chain.id); setShowNetworkView(false); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: chain.color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={chain.logo} alt={chain.id} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
                        </div>
                        <span style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>{chain.id}</span>
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: activeChain === chain.id ? "6px solid #48FF91" : "2px solid #555", background: "transparent", transition: "all 0.1s ease" }} />
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* SEND FORM VIEW */}
          <div style={{
            position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
            transform: step === "FORM" ? "translateX(0%)" : (step === "LIST" ? "translateX(100%)" : "translateX(-30%)"),
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))", zIndex: 10,
            opacity: step === "FORM" ? 1 : 0, pointerEvents: step === "FORM" ? "auto" : "none",
          }}>
            {selectedToken && (() => {
              const token = getTrustToken(selectedToken);
              const tokenBalance = balanceMap[selectedToken] || 0;
              const parsedAmount = parseFloat(amount) || 0;
              const isValidAmount = amount !== "" && parsedAmount >= 0.00001 && parsedAmount <= tokenBalance;
              const isValidAddress = address.trim().length > 0;
              const canProceed = isValidAmount && isValidAddress;
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", flexShrink: 0 }}>
                    <button onClick={() => { setStep("LIST"); setSelectedToken(null); }} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ color: "#fff", fontSize: "17px", fontWeight: 600 }}>Send {selectedToken}</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Address or Domain Name</div>
                      <div style={{ display: "flex", alignItems: "center", border: activeInput === "address" ? "1.5px solid #48FF91" : "1.5px solid #333", borderRadius: "12px", padding: "14px 16px", background: "transparent", transition: "border 0.2s ease" }}>
                        <input ref={addressInputRef} type="text" placeholder="Search or Enter" value={address} onChange={e => setAddress(e.target.value)} onPaste={e => { e.preventDefault(); setAddress(e.clipboardData.getData("text").trim()); }} onFocus={() => setActiveInput("address")} onBlur={() => setActiveInput(null)} autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "16px", caretColor: "#48FF91" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                          {address.length > 0 && (
                            <button onClick={() => setAddress("")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#888", display: "flex" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg></button>
                          )}
                          <button type="button" onClick={pasteAddress} style={{ background: "none", border: "none", color: "#48FF91", fontSize: "15px", fontWeight: 600, padding: 0, cursor: "pointer" }}>Paste</button>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#48FF91" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                          <svg width="18" height="18" viewBox="0 0 10.327905 9.5664062" version="1.1" id="svg1" xmlSpace="preserve" style={{ color: "#48FF91" }}>
                            <g id="layer1" transform="translate(-177.39211,-85.718861)">
                              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5 }} d="m 178.35548,88.518958 v -2.300099 h 2.57889" />
                              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5 }} d="m 178.35548,92.485163 v 2.300099 h 2.57889" />
                              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5 }} d="m 186.76162,88.518949 v -2.30009 h -2.57889" />
                              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5 }} d="m 186.76162,92.485172 v 2.30009 h -2.57889" />
                              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5 }} d="m 177.89212,90.500714 h 9.32792" />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Destination network</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#2A2A2D", borderRadius: "100px", padding: "6px 12px 6px 6px" }}>
                        {token.logo ? <img src={token.logo} style={{ width: "22px", height: "22px", borderRadius: "50%" }} /> : <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#444" }} />}
                        <span style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>{token.name}</span>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "4px" }}><path d="M5 6L0 0H10L5 6Z" fill="#888" /></svg>
                      </div>
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Amount</div>
                      <div style={{ display: "flex", alignItems: "center", border: activeInput === "amount" ? "1.5px solid #48FF91" : "1.5px solid #333", borderRadius: "12px", padding: "14px 16px", background: "transparent", transition: "border 0.2s ease" }}>
                        <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} onFocus={() => setActiveInput("amount")} onBlur={() => setActiveInput(null)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "16px", caretColor: "#48FF91" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                          {amount.length > 0 && (
                            <button onClick={() => setAmount("")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#888", display: "flex" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg></button>
                          )}
                          <span style={{ color: "#aaa", fontSize: "15px", fontWeight: 600 }}>{selectedToken}</span>
                          <button type="button" onClick={() => setAmount(String(tokenBalance))} style={{ background: "none", border: "none", color: "#48FF91", fontSize: "15px", fontWeight: 600, padding: 0, cursor: "pointer" }}>Max</button>
                        </div>
                      </div>
                      {amount && parseFloat(amount) < 0.00001 && (
                        <div style={{ color: "#FE5D5D", fontSize: "13px", marginTop: "8px", fontWeight: 500 }}>
                          Minimum amount is 0.00001 {selectedToken}
                        </div>
                      )}
                      {amount && parseFloat(amount) > tokenBalance && (
                        <div style={{ color: "#FE5D5D", fontSize: "13px", marginTop: "8px", fontWeight: 500 }}>
                          Insufficient {selectedToken} balance
                        </div>
                      )}
                    </div>

                    <div style={{ color: "#aaa", fontSize: "13px", fontWeight: 500, marginBottom: "32px", marginTop: amount && parseFloat(amount) < 0.00001 ? "8px" : "16px" }}>
                      {formatTrustCurrency(fiatValue, baseCurrency)}
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
                      <button
                        onClick={() => { if (canProceed) setStep("CONFIRM"); }}
                        style={{
                          width: "100%", padding: "18px", borderRadius: "100px",
                          background: canProceed ? "#48FF91" : "#347A49",
                          color: canProceed ? "#111" : "#111",
                          opacity: canProceed ? 1 : 0.5,
                          fontSize: "17px", fontWeight: 700, border: "none",
                          cursor: canProceed ? "pointer" : "not-allowed",
                          WebkitTapHighlightColor: "transparent",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* CONFIRM SEND VIEW */}
          <div style={{
            position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
            transform: step === "CONFIRM" ? "translateX(0%)" : (step === "PROCESSING" ? "translateX(-30%)" : "translateX(100%)"),
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))", zIndex: 11,
            opacity: step === "CONFIRM" ? 1 : 0, pointerEvents: step === "CONFIRM" ? "auto" : "none",
          }}>
            {selectedToken && (() => {
              const token = getTrustToken(selectedToken);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 20px", flexShrink: 0 }}>
                    <button onClick={() => setStep("FORM")} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ color: "#fff", fontSize: "17px", fontWeight: 600, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>Confirm send</span>
                    <button style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#48FF91", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10.65 3L9.93163 3.53449L9.32754 5.54812L7.47651 4.55141L6.5906 4.68143L4.68141 6.59062L4.55139 7.47652L5.5481 9.32755L3.53449 9.93163L3 10.65V13.35L3.53449 14.0684L5.54811 14.6725L4.55142 16.5235L4.68144 17.4094L6.59063 19.3186L7.47653 19.4486L9.32754 18.4519L9.93163 20.4655L10.65 21H13.35L14.0684 20.4655L14.6725 18.4519L16.5235 19.4486L17.4094 19.3185L19.3186 17.4094L19.4486 16.5235L18.4519 14.6724L20.4655 14.0684L21 13.35V10.65L20.4655 9.93163L18.4519 9.32754L19.4486 7.47654L19.3186 6.59063L17.4094 4.68144L16.5235 4.55142L14.6725 5.54812L14.0684 3.53449L13.35 3H10.65ZM10.4692 6.96284L11.208 4.5H12.792L13.5308 6.96284L13.8753 7.0946C13.9654 7.12908 14.0543 7.16597 14.142 7.2052L14.4789 7.35598L16.7433 6.13668L17.8633 7.25671L16.644 9.52111L16.7948 9.85803C16.834 9.9457 16.8709 10.0346 16.9054 10.1247L17.0372 10.4692L19.5 11.208V12.792L17.0372 13.5308L16.9054 13.8753C16.8709 13.9654 16.834 14.0543 16.7948 14.1419L16.644 14.4789L17.8633 16.7433L16.7433 17.8633L14.4789 16.644L14.142 16.7948C14.0543 16.834 13.9654 16.8709 13.8753 16.9054L13.5308 17.0372L12.792 19.5H11.208L10.4692 17.0372L10.1247 16.9054C10.0346 16.8709 9.94569 16.834 9.85803 16.7948L9.52111 16.644L7.25671 17.8633L6.13668 16.7433L7.35597 14.4789L7.2052 14.142C7.16597 14.0543 7.12908 13.9654 7.0946 13.8753L6.96284 13.5308L4.5 12.792L4.5 11.208L6.96284 10.4692L7.0946 10.1247C7.12907 10.0346 7.16596 9.94571 7.20519 9.85805L7.35596 9.52113L6.13666 7.2567L7.25668 6.13667L9.5211 7.35598L9.85803 7.2052C9.9457 7.16597 10.0346 7.12908 10.1247 7.0946L10.4692 6.96284ZM14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12ZM15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" fill="currentColor"></path>
                      </svg>
                    </button>
                  </div>

                  <div style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <div style={{ background: "#2A2A2D", borderRadius: "20px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {token.logo ? <img src={token.logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", lineHeight: "1.2" }}>{formatTrustCurrency(fiatValue, baseCurrency)}</div>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>{amount || "0"} {selectedToken}</div>
                      </div>
                    </div>

                    <div style={{ background: "#2A2A2D", borderRadius: "20px", padding: "16px 20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600 }}>From</div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>Main Wallet</div>
                          <div style={{ color: "#aaa", fontSize: "13px" }}>{truncateAddress(walletAddress || account?.address || "")}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600 }}>To</div>
                        <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>{truncateAddress(address)}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600 }}>Network</div>
                        <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>{token.name}</div>
                      </div>
                    </div>

                    <div style={{ background: "#2A2A2D", borderRadius: "20px", padding: "16px 20px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        Network fee <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          {token.logo ? <img src={token.logo} style={{ width: "16px", height: "16px", borderRadius: "50%" }} /> : null}
                          {formatTrustCurrency(networkFeeFiat, baseCurrency)}
                        </div>
                        <div style={{ color: "#aaa", fontSize: "13px" }}>{formatTrustBalance(networkFeeTokenAmount)} {selectedToken}</div>
                      </div>
                    </div>
                    {transactionError ? (
                      <div style={{ marginBottom: "16px", borderRadius: "12px", background: "#3F2526", color: "#FE5D5D", padding: "12px", fontSize: "13px", fontWeight: 600 }}>
                        {transactionError}
                      </div>
                    ) : null}

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                        <div style={{ color: "#aaa", fontSize: "15px", fontWeight: 600 }}>Total cost</div>
                        <div style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}>{formatTrustCurrency(totalCost, baseCurrency)}</div>
                      </div>
                      <button onClick={submitTransaction} disabled={transactionPending} style={{ width: "100%", padding: "18px", borderRadius: "100px", background: transactionPending ? "#28573d" : "#48FF91", color: "#111", fontSize: "17px", fontWeight: 700, border: "none", cursor: transactionPending ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
                        {transactionPending ? "Processing..." : "Continue"}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* PROCESSING VIEW */}
          <div style={{
            position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
            transform: step === "PROCESSING" ? "translateX(0%)" : "translateX(100%)",
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))", zIndex: 12,
            opacity: step === "PROCESSING" ? 1 : 0, pointerEvents: step === "PROCESSING" ? "auto" : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px" }}>
              <button onClick={onClose} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px 32px" }}>
              <div style={{ position: "relative", width: "64px", height: "64px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Animated loader */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}} />
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "4px solid rgba(72, 255, 145, 0.2)", borderTopColor: "#48FF91", animation: "spin 1s linear infinite" }}></div>
              </div>
              <div style={{ color: "#fff", fontSize: "22px", fontWeight: "bold", marginBottom: "12px", textAlign: "center" }}>Processing...</div>
              <div style={{ color: "#aaa", fontSize: "15px", textAlign: "center", lineHeight: "1.5", marginBottom: "40px" }}>
                Transaction in progress! Blockchain validation is underway. This may take a few minutes.
              </div>
              <button onClick={() => createdTransaction && setStep("DETAILS")} disabled={!createdTransaction} style={{ width: "100%", padding: "18px", borderRadius: "100px", background: createdTransaction ? "#48FF91" : "#28573d", color: "#111", fontSize: "17px", fontWeight: 700, border: "none", cursor: createdTransaction ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}>
                Transaction details
              </button>
            </div>
          </div>

          {/* DETAILS VIEW */}
          {/* CODEX: When the transaction goes to 'completed', automatically transition the modal to this 'DETAILS' state. */}
          <div style={{
            position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
            transform: step === "DETAILS" ? "translateX(0%)" : "translateX(100%)",
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))", zIndex: 13,
            opacity: step === "DETAILS" ? 1 : 0, pointerEvents: step === "DETAILS" ? "auto" : "none",
          }}>
            {selectedToken && (() => {
              const parsedAmount = parseFloat(amount) || 0;
              const date = createdTransaction?.createdAt ? new Date(createdTransaction.createdAt) : new Date();
              const statusLabel = createdTransaction?.status === "confirmed" ? "Completed" : createdTransaction?.status === "failed" ? "Failed" : "Pending";
              const statusColor = createdTransaction?.status === "confirmed" ? "#48FF91" : createdTransaction?.status === "failed" ? "#FE5D5D" : "#888";
              
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 32px", flexShrink: 0 }}>
                    <button onClick={onClose} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ color: "#fff", fontSize: "17px", fontWeight: 600, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>Sent</span>
                    <button style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    </button>
                  </div>

                  <div style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px", gap: "8px" }}>
                      <div style={{ color: "#fff", fontSize: "32px", fontWeight: "bold" }}>≈ {formatTrustCurrency(fiatValue, baseCurrency)}</div>
                      <div style={{ color: "#888", fontSize: "15px", fontWeight: 500 }}>-{parsedAmount || "0"} {selectedToken}</div>
                    </div>

                    <div style={{ background: "#2A2A2D", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>Date</div>
                        <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          Status <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        {/* CODEX: The status below should be 'Pending' (in grey text) by default, and turn into this green 'Completed' state when the transaction finishes. */}
                        <div style={{ color: statusColor, fontSize: "14px", fontWeight: 500 }}>{statusLabel}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>Recipient</div>
                        <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>
                          {truncateAddress(createdTransaction?.toAddress || address)}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "#2A2A2D", borderRadius: "16px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          Network fee <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>{formatTrustBalance(networkFeeTokenAmount)} {selectedToken}</div>
                          <div style={{ color: "#888", fontSize: "13px" }}>≈ {formatTrustCurrency(networkFeeFiat, baseCurrency)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>Nonce</div>
                        <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>0</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", paddingBottom: "8px" }}>
                      <button style={{ width: "100%", padding: "16px", background: "transparent", color: "#48FF91", fontSize: "16px", fontWeight: 600, border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                        View on block explorer
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
