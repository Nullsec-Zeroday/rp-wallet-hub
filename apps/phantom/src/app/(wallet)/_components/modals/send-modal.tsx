"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, ChevronLeft, Search, Check, ArrowRight, Loader2, Send, ArrowUpDown } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP, formatCurrency, formatBalance, type TokenInfo } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import { motion, AnimatePresence } from "framer-motion";
import TokenLogo from "../token-logo";
import { toast } from "sonner";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useRiveAsset } from "../rive-asset-provider";
import { createBackendWalletTransaction, updateBackendWalletState } from "@/lib/backend-wallet";
import { logWalletDebug } from "@/lib/wallet-debug";

const SendingAnimation = ({ isSuccess }: { isSuccess?: boolean }) => {
  const src = "/rive/progress-send.riv";
  const assetBuffer = useRiveAsset(src);

  const riveParams = React.useMemo(() => ({
    buffer: assetBuffer || undefined,
    stateMachines: "mainMachine",
    autoplay: true,
  }), [assetBuffer]);

  const { rive, RiveComponent } = useRive(riveParams);

  const startInput = useStateMachineInput(rive, "mainMachine", "start");
  const successInput = useStateMachineInput(rive, "mainMachine", "success");

  useEffect(() => {
    if (startInput) {
      startInput.fire();
    }
  }, [startInput]);

  useEffect(() => {
    if (successInput && isSuccess) {
      successInput.fire();
    }
  }, [successInput, isSuccess]);

  return (
    <div className="w-[120px] h-[120px] -mt-8">
      {assetBuffer && <RiveComponent style={{ width: "100%", height: "100%" }} />}
    </div>
  );
};

interface SendModalProps {
  visible: boolean;
  onClose: () => void;
  initialTokenSymbol?: string;
  onOpenActivity?: () => void;
  onCloseStart?: () => void;
}

type Step = "TOKEN_SELECT" | "ADDRESS" | "AMOUNT" | "CONFIRM" | "SENDING" | "SUCCESS" | "VIEW_TX";
const DEMO_WALLET_ADDRESS_PATTERN = /^(?:Ph|Tw)[a-f0-9]{30}$/;
const GENERIC_WALLET_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

function getRecipientAddressError(value: string, ownAddress: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Enter a wallet address.";
  if (trimmed === ownAddress) return "Choose a different wallet address. Sending to your own address is not supported.";
  if (DEMO_WALLET_ADDRESS_PATTERN.test(trimmed) || GENERIC_WALLET_ADDRESS_PATTERN.test(trimmed)) return null;
  return "Enter a valid wallet address.";
}

export default function SendModal({ visible, onClose, initialTokenSymbol, onOpenActivity, onCloseStart }: SendModalProps) {
  const {
    tokenBalances,
    customTokens,
    profile,
    baseCurrency,
    addressBook,
    recentAddresses,
    addRecentAddress
  } = useWalletStore();
  const { prices } = useLivePrices();

  const [step, setStep] = useState<Step>("TOKEN_SELECT");
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const hasPlayedConfetti = useRef(false);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);

  const getSendAudio = () => {
    sendAudioRef.current ??= new Audio("/sound-effect/confetti.mp3");
    return sendAudioRef.current;
  };

  const unlockSendAudio = () => {
    const audio = getSendAudio();
    audio.preload = "auto";
    audio.load();
    audio.currentTime = 0;
  };

  const playSendAudio = () => {
    const audio = getSendAudio();
    audio.volume = 1;
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  // Handle initial token
  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      if (initialTokenSymbol) {
        const token = [...TOKENS, ...customTokens].find(t => t.symbol === initialTokenSymbol);
        if (token) {
          setSelectedToken(token);
          setStep("ADDRESS");
        } else {
          setStep("TOKEN_SELECT");
        }
      } else {
        setStep("TOKEN_SELECT");
        setSelectedToken(null);
      }
      // Reset inputs
      setRecipientAddress("");
      setAmount("");
      hasPlayedConfetti.current = false;
    }
  }, [visible, initialTokenSymbol, customTokens]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const allTokens = useMemo(() => [...TOKENS, ...customTokens], [customTokens]);


  // Play confetti audio on success
  useEffect(() => {
    if (step === "SUCCESS" && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true;
      playSendAudio();
    }
  }, [step]);

  const filteredTokens = useMemo(() => {
    return allTokens.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const aBal = tokenBalances.find(bal => bal.symbol === a.symbol)?.balance || 0;
      const bBal = tokenBalances.find(bal => bal.symbol === b.symbol)?.balance || 0;
      return bBal - aBal;
    });
  }, [allTokens, searchQuery, tokenBalances]);

  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken) return 0;
    return tokenBalances.find(b => b.symbol === selectedToken.symbol)?.balance || 0;
  }, [selectedToken, tokenBalances]);

  const selectedTokenPrice = useMemo(() => {
    if (!selectedToken) return 0;
    return prices[selectedToken.symbol]?.usd ?? selectedToken.price ?? 0;
  }, [selectedToken, prices]);

  const usdValue = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount * selectedTokenPrice;
  }, [amount, selectedTokenPrice]);

  const recipientAddressError = useMemo(
    () => getRecipientAddressError(recipientAddress, profile.walletAddress),
    [profile.walletAddress, recipientAddress],
  );
  const normalizedRecipientAddress = recipientAddress.trim();
  const canAdvanceAddress = normalizedRecipientAddress.length > 0 && !recipientAddressError;

  const handleSend = async () => {
    unlockSendAudio();
    if (!selectedToken) return;
    if (recipientAddressError) {
      toast.error(recipientAddressError);
      setStep("ADDRESS");
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount.");
      setStep("AMOUNT");
      return;
    }
    if (numAmount > selectedTokenBalance) {
      toast.error("Insufficient balance for this transfer.");
      setStep("AMOUNT");
      return;
    }

    setStep("SENDING");

    const minimumAnimation = new Promise((resolve) => window.setTimeout(resolve, 1800));

    try {
      const latestState = useWalletStore.getState();
      await updateBackendWalletState({
        accountAddress: latestState.profile.walletAddress,
        accountName: latestState.walletName,
        balances: latestState.tokenBalances.map((balance) => ({
          amount: String(balance.balance),
          tokenSymbol: balance.symbol,
        })),
        profile: {
          displayName: latestState.walletName,
          username: latestState.profile.username,
        },
      });

      const [result] = await Promise.all([
        createBackendWalletTransaction({
          type: "send",
          tokenSymbol: selectedToken.symbol,
          amount: String(numAmount),
          fromAddress: profile.walletAddress,
          toAddress: normalizedRecipientAddress,
        }),
        minimumAnimation,
      ]);

      addRecentAddress(normalizedRecipientAddress);
      logWalletDebug("send:ui-success", {
        delivery: result.delivery,
        recipientFound: result.recipientFound,
        transactionId: result.transaction.id,
      });
      setStep("SUCCESS");
    } catch (error) {
      await minimumAnimation;
      const message = error instanceof Error
        ? error.message.replace(/^LarperWallet API request failed:\s*\d+:?\s*/i, "")
        : "Transaction failed. Check your balance and try again.";
      logWalletDebug("send:ui-error", {
        message,
        toAddress: normalizedRecipientAddress,
        tokenSymbol: selectedToken.symbol,
      });
      toast.error(message);
      setStep("CONFIRM");
    }
  };

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Used recently";
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Used today";
    if (days < 30) return `Used ${days}d ago`;
    const months = Math.floor(days / 30);
    return `Used ${months}mo${months > 1 ? "s" : ""} ago`;
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/15"
        onClick={handleClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.7 }}
        className="w-full max-w-lg bg-[#111111] rounded-t-[32px] overflow-hidden relative flex flex-col will-change-transform"
        style={{ height: "94vh", transform: "translateZ(0)" }}
      >
        {/* <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div> */}

        {/* Step Header */}
        {step !== "TOKEN_SELECT" && step !== "ADDRESS" && step !== "AMOUNT" && step !== "CONFIRM" && step !== "VIEW_TX" && (
          <div className="flex items-center justify-between px-4 py-4 flex-shrink-0 relative">
            <button
              onClick={() => {
                if (step === "SUCCESS") handleClose();
              }}
              className="w-10 h-10 flex items-center justify-start rounded-full active:opacity-60 transition-opacity z-10"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>

            {/* <h2 className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white pointer-events-none">
              {step === "SENDING" && "Sending..."}
              {step === "SUCCESS" && "Sent!"}
            </h2> */}

            <div className="w-10 h-10" /> {/* Spacer */}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          <AnimatePresence mode="wait">
            {step === "TOKEN_SELECT" && (
              <motion.div
                key="token-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full overflow-y-auto bg-[#111111] flex flex-col absolute inset-0"
              >
                <div className="sticky top-0 bg-[#111111] z-10">
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
                  <div className="px-4 pt-1 pb-4">
                    <div className="flex items-center gap-2 bg-[#222222] rounded-lg h-10 px-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                      <input
                        placeholder="Search..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => window.scrollTo(0, 0), 100)}
                        className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[16px] leading-5 placeholder:text-[#b4b4b4]"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-10 flex-1">
                  <div className="flex flex-col gap-2.5">
                    {filteredTokens.map((token) => {
                      const balance = tokenBalances.find(b => b.symbol === token.symbol)?.balance || 0;
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setStep("ADDRESS");
                          }}
                          className="flex items-center gap-3 bg-[#222222] rounded-[22px] p-4 border-none cursor-pointer text-left w-full active:scale-[0.98] transition-all group"
                        >
                          <div className="w-12 h-12 rounded-[14px] flex-shrink-0  flex items-center justify-center">
                            <TokenLogo token={token} size={48} liveImage={prices[token.symbol]?.image} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[15px] font-semibold text-[#eeeeee]">{token.name}</span>
                              {TOKENS.some(t => t.symbol === token.symbol) && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.041 1.041l-.257 3.222a1.136 1.136 0 0 1-.268.647L1.272 11.263a1.136 1.136 0 0 0 0 1.473l2.097 2.46a1.136 1.136 0 0 1 .268.647l.257 3.222a1.136 1.136 0 0 0 1.041 1.041l3.222.257a1.136 1.136 0 0 1 .647.268l2.46 2.097a1.136 1.136 0 0 0 1.473 0l2.46-2.097a1.136 1.136 0 0 1 .647-.268l3.222-.257a1.136 1.136 0 0 0 1.041-1.041l.257-3.222a1.136 1.136 0 0 1 .268-.647l2.097-2.46a1.136 1.136 0 0 0 0-1.473l-2.097-2.46a1.136 1.136 0 0 1-.268-.647l-.257-3.222a1.136 1.136 0 0 0-1.041-1.041l-3.222-.257a1.136 1.136 0 0 1-.647-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path>
                                </svg>
                              )}
                            </div>
                            <span className="text-[14px] font-normal text-[#b4b4b4] mt-[2px] block">
                              {formatBalance(balance)} {token.symbol}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === "ADDRESS" && selectedToken && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-[#111111] flex flex-col absolute inset-0"
              >
                <div className="bg-[#191919] flex-shrink-0 flex items-center justify-between px-4 py-3">
                  <button onClick={() => {
                    if (initialTokenSymbol) handleClose();
                    else setStep("TOKEN_SELECT");
                  }} className="bg-transparent border-none p-1 cursor-pointer">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                  </button>
                  <span className="text-[17px] font-semibold text-[#eeeeee]">{selectedToken.symbol}</span>
                  <button
                    disabled={!canAdvanceAddress}
                    onClick={() => setStep("AMOUNT")}
                    className="bg-transparent border-none p-1 cursor-pointer text-[15px] font-semibold text-[#ab9ff2] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center px-4 py-3 border-b border-[#2a2a2a]">
                    <input
                      placeholder="To: username or address"
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      onBlur={() => setTimeout(() => window.scrollTo(0, 0), 100)}
                      className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[16px] font-normal leading-5 placeholder:text-[#666]"
                    />
                    <button className="bg-transparent border-none p-1 cursor-pointer flex-shrink-0 active:opacity-60 transition-opacity">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="1.8">
                        <path d="M7 3H5a2 2 0 0 0-2 2v2m0 10v2a2 2 0 0 0 2 2h2m10 0h2a2 2 0 0 0 2-2v-2m0-10V5a2 2 0 0 0-2-2h-2"></path>
                      </svg>
                    </button>
                  </div>
                  {normalizedRecipientAddress && recipientAddressError ? (
                    <div className="px-4 pt-2 text-[13px] leading-5">
                      <span className="text-[#F97373]">
                        {recipientAddressError}
                      </span>
                    </div>
                  ) : null}

                  <div className="px-4 pt-5 pb-2 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    <span className="text-[14px] font-semibold text-[#b4b4b4]">Recently Used</span>
                  </div>

                  {recentAddresses.length > 0 ? (
                    recentAddresses.map((entry, idx) => (
                      <button
                        key={`${entry.address}-${idx}`}
                        onClick={() => setRecipientAddress(entry.address)}
                        className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer w-full text-left active:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#313131] flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#b4b4b4"></path>
                          </svg>
                        </div>
                        <div>
                          <span className="text-[15px] font-semibold text-[#eeeeee] block">
                            {entry.name || (entry.address.length > 12 ? `${entry.address.slice(0, 4)}...${entry.address.slice(-4)}` : entry.address)}
                          </span>
                          <span className="text-[14px] font-normal text-[#b4b4b4] block mt-0.5">
                            {getTimeAgo(entry.timestamp)}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-[#666] text-sm">No recent addresses</div>
                  )}

                  <div className="px-4 pt-5 pb-2 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span className="text-[14px] font-semibold text-[#b4b4b4]">Address Book</span>
                  </div>

                  {addressBook.length > 0 ? (
                    addressBook.map((entry, idx) => (
                      <button
                        key={`${entry.address}-${idx}`}
                        onClick={() => setRecipientAddress(entry.address)}
                        className="flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer w-full text-left active:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#313131] flex items-center justify-center flex-shrink-0">
                          <span className="text-[14px] font-semibold text-[#eeeeee]">
                            {(entry.name || "A").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[15px] font-semibold text-[#eeeeee] block">{entry.name}</span>
                          <span className="text-[14px] font-normal text-[#b4b4b4] block mt-0.5">
                            {entry.address.length > 12 ? `${entry.address.slice(0, 4)}...${entry.address.slice(-4)}` : entry.address}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-[#666] text-sm">Address book is empty</div>
                  )}
                </div>

                <div className="flex-shrink-0 px-4 py-3 pb-6 mt-auto">
                  <button
                    disabled={!canAdvanceAddress}
                    onClick={() => setStep("AMOUNT")}
                    className="w-full h-[52px] rounded-2xl border-none bg-[#ab9ff2] text-black text-[17px] font-semibold cursor-pointer active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === "AMOUNT" && selectedToken && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-[#111111] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#191919] flex-shrink-0 flex items-center justify-between px-4 py-3 sticky top-0 z-20">
                  <button onClick={() => setStep("ADDRESS")} className="bg-transparent border-none p-1 cursor-pointer active:opacity-60 transition-opacity">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                  </button>
                  <span className="text-[17px] font-semibold text-[#eeeeee]">Enter Amount</span>
                  <button
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selectedTokenBalance}
                    onClick={() => setStep("CONFIRM")}
                    className="bg-transparent border-none p-1 font-semibold text-[15px] disabled:text-[#6e6e6e] text-[#ab9ff2] disabled:cursor-not-allowed cursor-pointer active:opacity-80 transition-opacity"
                  >
                    Next
                  </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 pb-0 overflow-y-auto">
                  {/* To Bar */}
                  <div className="flex items-center px-4 py-3 border-b border-[#2a2a2a] justify-between flex-shrink-0 bg-[#111111]">
                    <div className="flex items-center gap-1">
                      <span className="text-[15px] text-[#b4b4b4]">To:</span>
                      <span className="text-[15px] text-[#eeeeee] truncate max-w-[200px]">
                        {recipientAddress.length > 12 ? `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress}
                      </span>
                    </div>
                    <button onClick={() => setStep("ADDRESS")} className="bg-transparent border-none p-1 cursor-pointer active:opacity-60 transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Amount Input Area */}
                  <div className="px-5 pt-7 pb-[18px] flex items-center flex-shrink-0 justify-start min-h-0 mt-[42px] transition-all duration-150">
                    <div className="w-full flex justify-center">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center justify-center max-w-full w-full">
                        <div /> {/* Spacer */}

                        <div className="flex flex-col items-center justify-center min-h-[92px] min-w-0 justify-self-center">
                          <div className="inline-flex items-baseline justify-center gap-2 whitespace-nowrap max-w-full font-tabular-nums">
                            <div className="flex items-baseline min-w-0">
                              <input
                                inputMode="decimal"
                                enterKeyHint="next"
                                placeholder="0"
                                type="text"
                                value={amount}
                                onChange={(e) => {
                                  // only allow numbers and one decimal, max 5 decimals
                                  const val = e.target.value;
                                  if (/^\d*\.?\d{0,5}$/.test(val) || val === "") {
                                    setAmount(val);
                                  }
                                }}
                                onBlur={() => setTimeout(() => window.scrollTo(0, 0), 100)}
                                style={{ width: `${amount.length || 1}ch`, minWidth: "1ch", fontSize: "52px", lineHeight: "62px" }}
                                className="bg-transparent border-none outline-none shadow-none p-0 m-0 text-[#eeeeee] text-[52px] leading-[62px] font-semibold text-right caret-[#ab9ff2] appearance-none rounded-none font-tabular-nums flex-shrink-0 focus:ring-0"
                              />
                            </div>
                            <span className="text-[34px] leading-[41px] font-semibold text-[#eeeeee] flex-shrink-0">
                              {selectedToken.symbol}
                            </span>
                          </div>
                          <div className="text-[15px] leading-5 text-[#b4b4b4] mt-1.5 text-center self-center">
                            ~{formatCurrency(usdValue, baseCurrency)}
                          </div>
                        </div>

                        <button className="w-9 h-9 rounded-full bg-[#222222] border-none cursor-pointer flex items-center justify-center flex-shrink-0 justify-self-end active:scale-95 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 16V4m0 0L3 8m4-4l4 4"></path>
                            <path d="M17 8v12m0 0l4-4m-4 4l-4-4"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[12px]" />

                  {/* Available To Send */}
                  <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0 justify-between border-t border-[#2a2a2a]">
                    <div>
                      <span className="text-[12px] leading-4 text-[#b4b4b4] block">Available To Send</span>
                      <span className="text-[15px] leading-5 font-semibold text-[#eeeeee] block mt-0.5">
                        {formatBalance(selectedTokenBalance)} {selectedToken.symbol}
                      </span>
                    </div>
                    <button
                      onClick={() => setAmount(selectedTokenBalance.toString())}
                      className="bg-[#222222] rounded-[20px] border-none py-2 px-[18px] cursor-pointer text-[14px] leading-[18px] font-semibold text-[#eeeeee] flex-shrink-0 active:opacity-80 transition-opacity"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="flex-shrink-0 px-4 pb-6 pt-0">
                  <button
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selectedTokenBalance}
                    onClick={() => setStep("CONFIRM")}
                    className={`w-full h-[52px] rounded-2xl border-none font-semibold text-[17px] active:opacity-80 transition-opacity disabled:cursor-not-allowed
                      ${(!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selectedTokenBalance)
                        ? "bg-[#313131] text-[#6e6e6e]"
                        : "bg-[#ab9ff2] text-black"
                      }`}
                  >
                    {parseFloat(amount) > selectedTokenBalance ? "Insufficient Balance" : "Next"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "CONFIRM" && selectedToken && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-[#111111] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#191919] flex-shrink-0 flex items-center justify-between px-4 py-3 sticky top-0 z-20">
                  <button onClick={() => setStep("AMOUNT")} className="bg-transparent border-none p-1 cursor-pointer active:opacity-60 transition-opacity">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                  </button>
                  <span className="text-[17px] font-semibold text-[#eeeeee]">Summary</span>
                  <div className="w-[30px]" />
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-4 overflow-y-auto">
                  {/* Top Icon */}
                  <div className="flex justify-center mt-8 mb-5">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7.842 12-1.94 3.217c-1.594 2.641 1.359 5.68 4.045 4.161l9.973-5.637c1.354-.765 1.354-2.716 0-3.482L9.946 4.622C7.26 3.104 4.308 6.142 5.902 8.783zm0 0H11" stroke="#AB9FF2" strokeWidth="2"></path>
                    </svg>
                  </div>

                  {/* Amount Text */}
                  <div className="text-center mb-8">
                    <span className="text-[42px] leading-[50px] font-semibold text-[#eeeeee] block">
                      {parseFloat(amount).toLocaleString()} {selectedToken.symbol}
                    </span>
                    <span className="text-[20px] leading-[24px] font-semibold text-[#b4b4b4] block mt-1">
                      ~{formatCurrency(usdValue, baseCurrency)}
                    </span>
                  </div>

                  {/* Warning Banner */}
                  {/* <div className="bg-[#3d2f00] border border-[#7a5c00] rounded-xl px-3.5 py-3 mb-4 flex gap-2.5 items-start">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-[1px]">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#ffe629"></path>
                      <line x1="12" y1="9" x2="12" y2="13" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"></line>
                      <circle cx="12" cy="17" r="0.8" fill="#000000"></circle>
                    </svg>
                    <span className="flex-1 text-[12px] leading-5 text-[#ffd60a]">
                      This wallet address has no balance and doesn't appear in your recent transaction history. Please ensure the address is correct.
                    </span>
                  </div> */}

                  {/* Details Box */}
                  <div className="bg-[#222222] rounded-[26px] overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-[#111111]">
                      <span className="text-[17px] leading-[22px] text-[#b4b4b4]">To</span>
                      <span className="text-[17px] leading-[22px] font-semibold text-[#eeeeee]">
                        {recipientAddress.length > 12 ? `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-b border-[#111111]">
                      <span className="text-[17px] leading-[22px] text-[#b4b4b4]">Network</span>
                      <span className="text-[17px] leading-[22px] font-semibold text-[#eeeeee]">
                        {selectedToken.name === "Solana" ? "Solana" : selectedToken.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <span className="text-[17px] leading-[22px] text-[#b4b4b4]">Network fee</span>
                      <span className="text-[17px] leading-[22px] font-semibold text-[#eeeeee]">$0.000447</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[24px]" />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 pb-6">
                  <button
                    onClick={handleSend}
                    className="w-full h-[52px] rounded-2xl border-none bg-[#ab9ff2] text-black text-[17px] font-semibold cursor-pointer active:opacity-80 transition-opacity"
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            )}

            {(step === "SENDING" || step === "SUCCESS") && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex-1 flex flex-col items-center pt-24 gap-6"
              >
                <div className="relative mb-2">
                  <SendingAnimation isSuccess={step === "SUCCESS"} />
                </div>

                <div className="text-center space-y-4 w-full px-4">
                  <h3 className="text-[28px] font-bold text-white tracking-tight">
                    {step === "SENDING" ? "Sending..." : "Sent!"}
                  </h3>

                  <div className="flex flex-col items-center gap-0.5">
                    {step === "SENDING" ? (
                      <>
                        <p className="text-[#888] font-medium text-[15px] leading-snug">
                          {amount} {selectedToken?.symbol} to {recipientAddress.length > 12 ? recipientAddress.slice(0, 12) : recipientAddress}
                        </p>
                        {recipientAddress.length > 12 && (
                          <p className="text-[#888] font-medium text-[15px] leading-snug">
                            ({recipientAddress.slice(0, 4)}...{recipientAddress.slice(-4)})
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-[#888] font-medium text-[15px] leading-snug">
                          {amount} {selectedToken?.symbol} was successfully
                        </p>
                        <p className="text-[#888] font-medium text-[15px] leading-snug">
                          sent to {recipientAddress.length > 12 ? `${recipientAddress.slice(0, 12)} (${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)})` : recipientAddress}
                        </p>
                      </>
                    )}
                  </div>

                  {step === "SUCCESS" && (
                    <button
                      onClick={() => setStep("VIEW_TX")}
                      className="text-[#ac9cf2] font-semibold text-[15px] mt-2 active:opacity-80 transition-opacity"
                    >
                      View transaction
                    </button>
                  )}
                </div>

                <div className="w-full mt-auto pb-6">
                  <button
                    onClick={() => {
                      if (step === "SUCCESS") {
                        handleClose();
                        if (onOpenActivity) onOpenActivity();
                      } else {
                        handleClose();
                      }
                    }}
                    className="w-full py-4 rounded-md bg-[#222] hover:bg-[#2a2a2a] text-[#dfdfdf] font-bold text-[16px] active:scale-[0.98] transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}

            {step === "VIEW_TX" && (
              <motion.div
                key="view-tx"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full bg-[#111111] flex flex-col absolute inset-0 overflow-y-auto"
              >
                <div className="bg-[#111111] pt-0 pb-5">
                  {/* Header Row */}
                  <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[#111111] z-20">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStep("SUCCESS")} className="p-1 active:opacity-60 transition-opacity">
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
                        Transfer
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
                        Transfer from <span className="text-[#3B82F6]">bHGM17...5r3deG</span> to 2 accounts for <span className="text-white font-semibold">{amount || "0.0090"}</span> <span className="text-[#2EC08B]">${usdValue ? (usdValue * parseFloat(amount || "0")).toFixed(2) : "0.79"}</span> <span className="text-white font-semibold">◎ {selectedToken?.symbol || "SOL"}</span>
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
                          <span className="truncate">bHGM17duGU3S9MU9eZgfcBG4...ZKpwEd5r3deG</span>
                          <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></path></svg>
                        </div>
                      </div>

                      {/* Detail Rows */}
                      {[
                        { label: "Block", value: "40,63,55,001", isLink: true },
                        { label: "Timestamp", value: "23:20:02 May 15, 2026 (UTC)", isLink: false },
                        { label: "Result", value: "SUCCESS", isSuccess: true },
                        { label: "Fee", value: "0.000006975 SOL", isLink: false },
                        { label: "Priority Fee", value: "0.000000541 SOL", isLink: false },
                        { label: "Compute Units Consumed", value: "22,110 / 58,049", isLink: false },
                        { label: "Tx Version", value: "Legacy", isLink: false },
                        { label: "Recent Block Hash", value: "Mh3Pj5Rm7To9...m7To9VqB", isLink: false },
                        { label: "Signer", value: "7xKXtg2C...uJosgAsU", isLink: true },
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
                    <div className="mt-8 pt-6 border-t border-[#2a2a2a] pb-10">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
