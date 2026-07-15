"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, ChevronLeft, Search, Check, ArrowRight, Loader2, Send, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { useWalletStore, type Transaction } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP, formatCurrency, formatBalance, type TokenInfo } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import { motion, AnimatePresence } from "framer-motion";
import TokenLogo from "../token-logo";
import { toast } from "sonner";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useRiveAsset } from "../rive-asset-provider";
import { createBackendWalletTransaction, persistBackendWalletState, refreshBackendWalletState } from "@/lib/backend-wallet";
import { logWalletDebug } from "@/lib/wallet-debug";
import { getSolscanTransactionDetails } from "@/lib/solscan-transaction";

const NumberPad = ({ onNumberPress, onDelete }: { onNumberPress: (n: string) => void, onDelete: () => void }) => {
  const buttons = [
    { num: '1' }, { num: '2' }, { num: '3' },
    { num: '4' }, { num: '5' }, { num: '6' },
    { num: '7' }, { num: '8' }, { num: '9' },
    { num: '.' }, { num: '0' }, { num: 'del' }
  ];

  return (
    <div className="grid grid-cols-3 gap-y-2 gap-x-2 w-full pb-2 pt-2 px-4">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.preventDefault();
            btn.num === 'del' ? onDelete() : onNumberPress(btn.num);
          }}
          className="flex flex-col items-center justify-center active:opacity-50 h-[48px] border-none cursor-pointer bg-transparent"
        >
          {btn.num === 'del' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          ) : (
            <span className="text-[28px] font-medium text-[#ffffff]">{btn.num}</span>
          )}
        </button>
      ))}
    </div>
  );
};

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

type Step = "TOKEN_SELECT" | "ADDRESS" | "ADD_CONTACT" | "AMOUNT" | "CONFIRM" | "SENDING" | "SUCCESS" | "VIEW_TX";
const getOptimisticSuccessDelay = () => 1500 + Math.random() * 500;

function getRecipientAddressError(value: string, ownAddress: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Enter a wallet address.";
  if (trimmed === ownAddress) return "Choose a different wallet address. Sending to your own address is not supported.";
  return null;
}

function getNameInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function truncateAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 5)}...${address.slice(-5)}` : address;
}

export default function SendModal({ visible, onClose, initialTokenSymbol, onOpenActivity, onCloseStart }: SendModalProps) {
  const {
    tokenBalances,
    customTokens,
    profile,
    baseCurrency,
    addressBook,
    addRecentAddress,
    addContact,
    accounts,
    currentAccountIndex
  } = useWalletStore();
  const { prices } = useLivePrices();

  const [step, setStep] = useState<Step>("TOKEN_SELECT");
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [sentTransaction, setSentTransaction] = useState<Transaction | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [contactLabel, setContactLabel] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const hasPlayedConfetti = useRef(false);
  const optimisticSuccessTimerRef = useRef<number | null>(null);
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
      if (optimisticSuccessTimerRef.current !== null) {
        window.clearTimeout(optimisticSuccessTimerRef.current);
        optimisticSuccessTimerRef.current = null;
      }
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
      setUsdAmount("");
      setAddressQuery("");
      setShowAddMenu(false);
      setContactLabel("");
      setContactAddress("");
      setSentTransaction(null);
      hasPlayedConfetti.current = false;
    }
  }, [visible, initialTokenSymbol, customTokens]);

  const handleClose = () => {
    if (isClosing) return;
    if (optimisticSuccessTimerRef.current !== null) {
      window.clearTimeout(optimisticSuccessTimerRef.current);
      optimisticSuccessTimerRef.current = null;
    }
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      setAmount("");
      setRecipientAddress("");
      setStep("TOKEN_SELECT");
      onClose();
    }, 180);
  };

  const handleNumberPress = (num: string) => {
    setUsdAmount(prev => {
      if (num === '.' && prev.includes('.')) return prev;
      if (prev === '0' && num !== '.') return num;
      const next = prev + num;
      if (/^\d*\.?\d{0,2}$/.test(next)) return next;
      return prev;
    });
  };

  const handleDelete = () => {
    setUsdAmount(prev => prev.slice(0, -1));
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
  const solscanDetails = getSolscanTransactionDetails(sentTransaction, prices);

  const recipientAddressError = useMemo(
    () => getRecipientAddressError(recipientAddress, profile.walletAddress),
    [profile.walletAddress, recipientAddress],
  );
  const normalizedRecipientAddress = recipientAddress.trim();

  const otherAccounts = useMemo(
    () => accounts.filter((_, idx) => idx !== currentAccountIndex),
    [accounts, currentAccountIndex],
  );

  const normalizedAddressQuery = addressQuery.trim().toLowerCase();
  const filteredAccounts = useMemo(() => {
    if (!normalizedAddressQuery) return otherAccounts;
    return otherAccounts.filter(a =>
      a.name.toLowerCase().includes(normalizedAddressQuery) ||
      a.profile.walletAddress.toLowerCase().includes(normalizedAddressQuery)
    );
  }, [otherAccounts, normalizedAddressQuery]);

  const filteredContacts = useMemo(() => {
    if (!normalizedAddressQuery) return addressBook;
    return addressBook.filter(entry =>
      entry.name.toLowerCase().includes(normalizedAddressQuery) ||
      entry.address.toLowerCase().includes(normalizedAddressQuery)
    );
  }, [addressBook, normalizedAddressQuery]);

  const handleSelectRecipient = (address: string) => {
    const error = getRecipientAddressError(address, profile.walletAddress);
    if (error) {
      toast.error(error);
      return;
    }
    setRecipientAddress(address.trim());
    setShowAddMenu(false);
    setUsdAmount("");
    setStep("AMOUNT");
  };

  const canSaveContact = contactLabel.trim().length > 0 && contactAddress.trim().length > 0;

  const selectedTokenBalanceUsd = selectedTokenBalance * selectedTokenPrice;
  const usdAmountNum = parseFloat(usdAmount) || 0;
  const tokenEquivalent = selectedTokenPrice > 0
    ? Math.min(usdAmountNum / selectedTokenPrice, selectedTokenBalance)
    : 0;
  const isInsufficientUsd = usdAmountNum > selectedTokenBalanceUsd + 0.005;

  const recipientLabel = useMemo(() => {
    if (!normalizedRecipientAddress) return "";
    const account = accounts.find(a => a.profile.walletAddress === normalizedRecipientAddress);
    if (account) return account.name;
    const entry = addressBook.find(e => e.address === normalizedRecipientAddress);
    return entry?.name || truncateAddress(normalizedRecipientAddress);
  }, [accounts, addressBook, normalizedRecipientAddress]);

  const handlePercentPress = (pct: number) => {
    const usd = Math.floor(selectedTokenBalanceUsd * pct * 100) / 100;
    setUsdAmount(usd > 0 ? String(usd) : "");
  };

  const handleAmountNext = () => {
    if (usdAmountNum <= 0 || isInsufficientUsd || selectedTokenPrice <= 0) return;
    const tokenAmount = Math.min(parseFloat(tokenEquivalent.toFixed(5)), selectedTokenBalance);
    if (tokenAmount <= 0) return;
    setAmount(String(tokenAmount));
    setStep("CONFIRM");
  };

  const handleSaveContact = () => {
    if (!canSaveContact) return;
    addContact(contactAddress.trim(), contactLabel.trim());
    toast.success("Contact saved");
    setContactLabel("");
    setContactAddress("");
    setStep("ADDRESS");
  };

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
    addRecentAddress(normalizedRecipientAddress);

    const latestState = useWalletStore.getState();
    const account = latestState.accounts[latestState.currentAccountIndex];
    if (!account) {
      logWalletDebug("send:failure", {
        message: "No wallet account is available.",
        toAddress: normalizedRecipientAddress,
        tokenSymbol: selectedToken.symbol,
      });
      setStep("CONFIRM");
      return;
    }

    const latestTokenBalance = latestState.tokenBalances.find((balance) => balance.symbol === selectedToken.symbol)?.balance ?? 0;
    if (numAmount > latestTokenBalance) {
      logWalletDebug("send:failure", {
        message: "Insufficient balance for this transfer.",
        toAddress: normalizedRecipientAddress,
        tokenSymbol: selectedToken.symbol,
      });
      setStep("AMOUNT");
      return;
    }

    latestState.updateBalance(selectedToken.symbol, latestTokenBalance - numAmount);
    const optimisticTransactionId = latestState.addTransaction({
      type: "send",
      token: selectedToken.symbol,
      amount: numAmount,
      status: "confirmed",
      from: profile.walletAddress,
      to: normalizedRecipientAddress,
    });
    setSentTransaction(
      useWalletStore.getState().transactions.find((transaction) => transaction.id === optimisticTransactionId) || null,
    );
    optimisticSuccessTimerRef.current = window.setTimeout(() => {
      setStep("SUCCESS");
      optimisticSuccessTimerRef.current = null;
    }, getOptimisticSuccessDelay());

    try {
      await persistBackendWalletState({
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

      const response = await createBackendWalletTransaction({
        type: "send",
        tokenSymbol: selectedToken.symbol,
        amount: String(numAmount),
        fromAddress: profile.walletAddress,
        toAddress: normalizedRecipientAddress,
      });
      setSentTransaction(
        useWalletStore.getState().transactions.find((transaction) => transaction.id === response.transaction.id) || null,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message.replace(/^RPWallet API request failed:\s*\d+:?\s*/i, "")
        : "Transaction failed. Check your balance and try again.";
      logWalletDebug("send:failure", {
        message,
        toAddress: normalizedRecipientAddress,
        tokenSymbol: selectedToken.symbol,
      });
      if (optimisticSuccessTimerRef.current !== null) {
        window.clearTimeout(optimisticSuccessTimerRef.current);
        optimisticSuccessTimerRef.current = null;
      }
      setStep("CONFIRM");
      setSentTransaction(null);

      try {
        await refreshBackendWalletState();
      } catch {
        useWalletStore.getState().rollbackOptimisticSend(
          account.id,
          optimisticTransactionId,
          selectedToken.symbol,
          numAmount,
        );
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          animation: isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards",
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full max-w-lg bg-[#000000] rounded-t-[32px] overflow-hidden relative flex flex-col will-change-transform"
        style={{
          height: "94vh",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        }}
      >
        <div className="w-full pt-3 flex-shrink-0 bg-[#000000]"></div>

        {/* Step Header */}
        {step !== "TOKEN_SELECT" && step !== "ADDRESS" && step !== "ADD_CONTACT" && step !== "AMOUNT" && step !== "CONFIRM" && step !== "VIEW_TX" && (
          <div className="flex items-center justify-between px-4 py-4 flex-shrink-0 relative">
            <button
              onClick={() => {
                if (step === "SUCCESS") handleClose();
              }}
              className="bg-transparent border-none p-1 -ml-1 cursor-pointer active:opacity-60 transition-opacity z-10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
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
                className="h-full overflow-y-auto bg-[#000000] flex flex-col absolute inset-0"
              >
                <div className="sticky top-0 bg-[#000000] z-10 pt-2">
                  <div className="flex items-center gap-4 px-4 pt-2 pb-4">
                    <button
                      onClick={handleClose}
                      className="w-11 h-11 bg-[#1c1c1e] rounded-full flex items-center justify-center active:opacity-70 transition-opacity flex-shrink-0"
                    >
                      <X size={22} className="text-white" />
                    </button>
                    <span className="text-[18px] font-semibold text-white tracking-wide">Select Token</span>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2.5 bg-[#1c1c1e] rounded-full h-11 px-4">
                      <input
                        placeholder="Search..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => window.scrollTo(0, 0), 100)}
                        className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[15px] font-medium placeholder:text-[#666]"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-10 flex-1">
                  <div className="flex flex-col gap-3">
                    {filteredTokens.map((token) => {
                      const balance = tokenBalances.find(b => b.symbol === token.symbol)?.balance || 0;
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setUsdAmount("");
                            setStep(normalizedRecipientAddress ? "AMOUNT" : "ADDRESS");
                          }}
                          className="flex items-center gap-4 bg-[#141414] rounded-[24px] p-4 border-none cursor-pointer text-left w-full active:scale-[0.98] transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center">
                            <TokenLogo token={token} size={40} liveImage={prices[token.symbol]?.image} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[16px] font-semibold text-white">{token.name}</span>
                              {TOKENS.some(t => t.symbol === token.symbol) && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.041 1.041l-.257 3.222a1.136 1.136 0 0 1-.268.647L1.272 11.263a1.136 1.136 0 0 0 0 1.473l2.097 2.46a1.136 1.136 0 0 1 .268.647l.257 3.222a1.136 1.136 0 0 0 1.041 1.041l3.222.257a1.136 1.136 0 0 1 .647.268l2.46 2.097a1.136 1.136 0 0 0 1.473 0l2.46-2.097a1.136 1.136 0 0 1 .647-.268l3.222-.257a1.136 1.136 0 0 0 1.041-1.041l.257-3.222a1.136 1.136 0 0 1 .268-.647l2.097-2.46a1.136 1.136 0 0 0 0-1.473l-2.097-2.46a1.136 1.136 0 0 1-.268-.647l-.257-3.222a1.136 1.136 0 0 0-1.041-1.041l-3.222-.257a1.136 1.136 0 0 1-.647-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path>
                                </svg>
                              )}
                            </div>
                            <span className="text-[14px] font-medium text-[#888888] mt-0.5 block">
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
                className="h-full bg-[#000000] flex flex-col absolute inset-0"
              >
                {/* Header: X + Send title + plus */}
                <div className="bg-[#000000] flex-shrink-0 flex items-center justify-between px-4 py-3 relative z-30">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (initialTokenSymbol) handleClose();
                        else setStep("TOKEN_SELECT");
                      }}
                      className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <X size={22} className="text-white" />
                    </button>
                    <span className="text-[18px] font-semibold text-white tracking-wide">Send</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowAddMenu(v => !v)}
                      aria-label="Add"
                      className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-[52px] z-40">
                        <button
                          onClick={() => {
                            setShowAddMenu(false);
                            setContactLabel("");
                            setContactAddress("");
                            setStep("ADD_CONTACT");
                          }}
                          className="flex items-center justify-between gap-8 bg-[#1c1c1e] rounded-[18px] px-5 py-3.5 border-none cursor-pointer whitespace-nowrap shadow-lg shadow-black/50 active:opacity-80 transition-opacity w-[240px]"
                        >
                          <span className="text-[17px] font-medium text-white">Add Contact</span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                            <circle cx="12" cy="10" r="2.2"></circle>
                            <path d="M8.5 16.5c.7-1.6 2-2.4 3.5-2.4s2.8.8 3.5 2.4"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto" onClick={() => showAddMenu && setShowAddMenu(false)}>
                  {normalizedAddressQuery && (
                    <button
                      onClick={() => handleSelectRecipient(addressQuery)}
                      className="flex items-center gap-4 px-4 py-3.5 bg-transparent border-none cursor-pointer w-full text-left active:bg-white/5 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#1c1c1e] flex items-center justify-center flex-shrink-0">
                        <Send size={18} className="text-[#eeeeee]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[17px] font-semibold text-white block truncate">
                          {truncateAddress(addressQuery.trim())}
                        </span>
                        <span className="text-[14px] font-normal text-[#a0a0a0] block mt-0.5">Send to this address</span>
                      </div>
                    </button>
                  )}

                  {filteredAccounts.length > 0 && (
                    <>
                      <div className="px-4 pt-4 pb-2">
                        <span className="text-[20px] font-bold text-white">Accounts</span>
                      </div>
                      {filteredAccounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => handleSelectRecipient(account.profile.walletAddress)}
                          className="flex items-center gap-4 px-4 py-3.5 bg-transparent border-none cursor-pointer w-full text-left active:bg-white/5 transition-colors"
                        >
                          <div className="w-11 h-11 rounded-full bg-[#1c1c1e] flex items-center justify-center flex-shrink-0">
                            <span className="text-[15px] font-semibold text-[#eeeeee]">
                              {getNameInitials(account.name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[17px] font-semibold text-white block truncate">{account.name}</span>
                            <span className="text-[15px] font-normal text-[#a0a0a0] block mt-0.5">
                              {truncateAddress(account.profile.walletAddress)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {filteredContacts.length > 0 && (
                    <>
                      <div className="px-4 pt-4 pb-2">
                        <span className="text-[20px] font-bold text-white">Contacts</span>
                      </div>
                      {filteredContacts.map((entry, idx) => (
                        <button
                          key={`${entry.address}-${idx}`}
                          onClick={() => handleSelectRecipient(entry.address)}
                          className="flex items-center gap-4 px-4 py-3.5 bg-transparent border-none cursor-pointer w-full text-left active:bg-white/5 transition-colors"
                        >
                          <div className="w-11 h-11 rounded-full bg-[#1c1c1e] flex items-center justify-center flex-shrink-0">
                            <span className="text-[15px] font-semibold text-[#eeeeee]">
                              {getNameInitials(entry.name || "A")}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[17px] font-semibold text-white block truncate">{entry.name}</span>
                            <span className="text-[15px] font-normal text-[#a0a0a0] block mt-0.5">
                              {truncateAddress(entry.address)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {!normalizedAddressQuery && filteredAccounts.length === 0 && filteredContacts.length === 0 && (
                    <div className="px-4 py-6 text-[#666] text-[15px] font-medium">No accounts or contacts yet</div>
                  )}
                </div>

                {/* Bottom search bar */}
                <div className="flex-shrink-0 px-4 py-3 mt-auto" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
                  <div className="flex items-center gap-3.5 bg-[#1c1c1e] rounded-full h-[52px] pl-6 pr-[14px]">
                    <Search size={23} strokeWidth={1.8} className="text-[#8e8e93] flex-shrink-0" />
                    <input
                      placeholder="@username or wallet"
                      type="text"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && addressQuery.trim()) handleSelectRecipient(addressQuery);
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData?.getData("text");
                        if (text) {
                          e.preventDefault();
                          setAddressQuery(text.trim());
                        }
                      }}
                      onBlur={() => setTimeout(() => window.scrollTo(0, 0), 100)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[18px] placeholder:text-[18px] font-normal placeholder:text-[#8e8e93] min-w-0"
                    />
                    <button type="button" aria-label="Scan address" className="p-2 rounded-lg bg-[#29292c] flex items-center justify-center border-none cursor-pointer flex-shrink-0 active:opacity-60 transition-opacity">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v-4h4"></path>
                        <path d="M21 7v-4h-4"></path>
                        <path d="M3 17v4h4"></path>
                        <path d="M21 17v4h-4"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "ADD_CONTACT" && (
              <motion.div
                key="add-contact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-[#000000] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#000000] flex-shrink-0 flex items-center gap-4 px-4 py-3">
                  <button
                    onClick={() => setStep("ADDRESS")}
                    className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                  </button>
                  <span className="text-[18px] font-semibold text-white tracking-wide">Add Contact</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-4 pt-2">
                  <div className="text-[19px] font-normal text-white mb-3">Network</div>
                  <button className="w-full flex items-center justify-between bg-[#1c1c1e] rounded-full px-6 h-[54px] border-none cursor-pointer  active:opacity-80 transition-opacity">
                    <span className="text-[19px] font-semibold text-white">Solana</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"></path>
                    </svg>
                  </button>

                  <div className="text-[19px] font-normal text-white mb-3">Label</div>
                  <div className="w-full bg-[#1c1c1e] rounded-full px-6 h-[54px] flex items-center ">
                    <input
                      placeholder="Label"
                      type="text"
                      value={contactLabel}
                      onChange={(e) => setContactLabel(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[18px] font-normal placeholder:text-[#7d7d7d] placeholder:text-[18px] min-w-0"
                    />
                  </div>

                  <div className="text-[19px] font-normal text-white mb-3">Address</div>
                  <div className="w-full bg-[#1c1c1e] rounded-full pl-6 pr-4 h-[54px] flex items-center gap-2">
                    <input
                      placeholder="Address"
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 bg-transparent placeholder:text-[18px] border-none outline-none text-[#eeeeee] text-[18px] font-normal placeholder:text-[#7d7d7d] min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.readText?.()
                          .then((text) => { if (text) setContactAddress(text.trim()); })
                          .catch(() => toast.error("Clipboard unavailable"));
                      }}
                      className="bg-[#2c2c2e] text-white text-[17px] font-bold px-3 py-1 rounded-full border-none cursor-pointer flex-shrink-0 active:opacity-70 transition-opacity"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
                  <button
                    disabled={!canSaveContact}
                    onClick={handleSaveContact}
                    className="w-full h-[58px] rounded-full border-none text-[22px] font-bold cursor-pointer transition-colors text-black disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: canSaveContact ? "#ab9ff2" : "#6b6590",
                      // color: canSaveContact ? "#ffffff" : "#ffffff",
                    }}
                  >
                    Save Contact
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
                className="h-full bg-[#000000] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#000000] flex-shrink-0 flex items-center justify-between px-4 py-3 sticky top-0 z-20">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep("ADDRESS")} className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"></path>
                      </svg>
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[17px] font-bold text-white leading-tight">Send</span>
                      <span className="text-[15px] font-normal text-[#a0a0a0] leading-tight">{recipientLabel}</span>
                    </div>
                  </div>
                  <button className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity">
                    <SlidersHorizontal size={20} className="text-white rotate-90" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 pb-0 overflow-y-auto">
                  <div className="flex-1 min-h-[24px]" />

                  {/* USD Amount */}
                  <div className="px-5 flex-shrink-0 overflow-hidden">
                    <span
                      className={` tracking-tight whitespace-nowrap ${usdAmountNum > 0 ? "text-white" : "text-[#a0a0a0]"}`}
                      style={{ fontSize: usdAmount.length > 6 ? "64px" : "88px", lineHeight: "96px" }}
                    >
                      ${usdAmount || "0"}
                    </span>
                    <div className={`text-[18px] font-normal text-[#F80633] mt-4 transition-opacity ${isInsufficientUsd ? "opacity-100" : "opacity-0"}`}>
                      Insufficient balance
                    </div>
                  </div>

                  <div className="flex-1 min-h-[12px]" />

                  {/* Token Row */}
                  <button
                    onClick={() => setStep("TOKEN_SELECT")}
                    className="px-5 py-4 flex items-center justify-between w-full bg-transparent border-none cursor-pointer active:opacity-70 transition-opacity flex-shrink-0"
                  >
                    <span className="text-[19px] font-semibold text-white">
                      {selectedToken.symbol}
                      <span className="text-[#a0a0a0] font-normal"> · {formatCurrency(selectedTokenBalanceUsd, baseCurrency)}</span>
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </button>

                  {/* Percent chips / Review */}
                  <div className="px-4 mb-2 min-h-[56px] flex flex-col justify-center flex-shrink-0">
                    {usdAmountNum > 0 ? (
                      <button
                        disabled={isInsufficientUsd || selectedTokenPrice <= 0}
                        onClick={handleAmountNext}
                        className="w-full py-4 rounded-full font-bold text-[18px] text-[#0c0814] transition-all border-none flex items-center justify-center cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed"
                        style={{
                          background: isInsufficientUsd ? "#55496a" : "#AB9FF2",
                        }}
                      >
                        Review
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handlePercentPress(0.25)} className="flex-1 py-3.5 rounded-full bg-[#131315] active:bg-[#2c2c2e] text-[#7b7b7b] text-[16px] font-medium transition-colors border-none cursor-pointer">25%</button>
                        <button onClick={() => handlePercentPress(0.5)} className="flex-1 py-3.5 rounded-full bg-[#131315] active:bg-[#2c2c2e] text-[#7b7b7b] text-[16px] font-medium transition-colors border-none cursor-pointer">50%</button>
                        <button onClick={() => handlePercentPress(1)} className="flex-1 py-3.5 rounded-full bg-[#131315] active:bg-[#2c2c2e] text-[#7b7b7b] text-[16px] font-medium transition-colors border-none cursor-pointer">100%</button>
                      </div>
                    )}
                  </div>

                  {/* Keypad */}
                  <div
                    className="flex-shrink-0 w-full"
                    style={{
                      paddingBottom: "calc(16px + env(safe-area-inset-bottom))"
                    }}
                  >
                    <NumberPad onNumberPress={handleNumberPress} onDelete={handleDelete} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === "CONFIRM" && selectedToken && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-[#000000] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#000000] flex-shrink-0 flex items-center gap-3 px-4 py-3 sticky top-0 z-20">
                  <button onClick={() => setStep("AMOUNT")} className="bg-[#1c1c1e] w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-60 transition-opacity">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                  </button>
                  <span className="text-[18px] font-semibold text-[#eeeeee]">Summary</span>
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-4 overflow-y-auto mt-6">
                  {/* Top Icon */}
                  <div className="flex justify-center mb-4">
                    <img src="/icons/send_icon_highlighted.webp" alt="Send" width={36} height={36} className="object-contain" />
                  </div>

                  {/* Amount Text */}
                  <div className="text-center mb-8 px-4 flex flex-col items-center">
                    <div className="font-bold text-[#eeeeee] tracking-tight break-words max-w-full flex justify-center flex-wrap gap-x-3 items-baseline leading-[1.1]">
                      <span className="text-[60px]">{parseFloat(amount).toLocaleString()}</span>
                      <span className="text-[60px]">{selectedToken.symbol}</span>
                    </div>
                    <span className="text-[18px] leading-[24px] font-medium text-[#a0a0a0] block mt-3">
                      ~{formatCurrency(usdValue, baseCurrency)}
                    </span>
                  </div>

                  {/* Details Box */}
                  <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden px-4 py-2">
                    <div className="flex justify-between items-center py-4 border-b border-[#2a2a2c]">
                      <span className="text-[16px] text-[#a0a0a0]">To</span>
                      <span className="text-[16px] font-semibold text-[#eeeeee]">
                        {recipientAddress.length > 12 ? `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-[#2a2a2c]">
                      <span className="text-[16px] text-[#a0a0a0]">Network</span>
                      <span className="text-[16px] font-semibold text-[#eeeeee]">
                        {selectedToken.name === "Solana" ? "Solana" : selectedToken.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-[16px] text-[#a0a0a0]">Network fee</span>
                      <span className="text-[16px] font-semibold text-[#eeeeee]">$0.00</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[24px]" />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
                  <button
                    onClick={handleSend}
                    className="w-full h-[56px] rounded-full border-none bg-[#ab9ff2] text-black text-[17px] font-bold cursor-pointer active:scale-[0.98] transition-transform"
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
                      <p className="text-[#eeeeee] font-medium text-[16px]">
                        <span className="font-semibold">{amount} {selectedToken?.symbol}</span> to <span className="font-semibold">{recipientAddress.length > 12 ? `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress}</span>
                      </p>
                    ) : (
                      <p className="text-[#eeeeee] font-medium text-[16px]">
                        <span className="font-semibold">{amount} {selectedToken?.symbol}</span> sent to <span className="font-semibold">{recipientAddress.length > 12 ? `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress}</span>
                      </p>
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

                <div className="w-full mt-auto px-4" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
                  <button
                    onClick={() => {
                      if (step === "SUCCESS") {
                        handleClose();
                        if (onOpenActivity) onOpenActivity();
                      } else {
                        handleClose();
                      }
                    }}
                    className="w-full h-[56px] rounded-full border-none bg-[#1c1c1e] text-[#eeeeee] font-semibold text-[17px] active:scale-[0.98] transition-transform"
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
                className="h-full bg-[#000000] flex flex-col absolute inset-0 overflow-y-auto"
              >
                <div className="bg-[#000000] pt-0 pb-5">
                  {/* Header Row */}
                  <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[#000000] z-20">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStep("SUCCESS")} className="p-1 active:opacity-60 transition-opacity">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round"></path></svg>
                      </button>
                      <div className="font-bold text-[18px] flex items-center gap-0.5">
                        <span className="text-white">SOL</span>
                        <span className="text-[#4FE862]">SCAN</span>
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
                    <span className="text-[#eeeeee] font-semibold">{solscanDetails.solPrice}</span>
                    <span className={solscanDetails.solChangeIsPositive ? "text-[#4FE862]" : "text-[#F80633]"}>{solscanDetails.solChange}</span>
                    <span>|</span>
                    <span>Avg Fee:</span>
                    <span className="text-[#eeeeee]">{solscanDetails.averageFee}</span>
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
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1e24] text-[#4FE862] text-[12px] font-medium border border-[#4FE862]/30">
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
                      <span className="text-[#4FE862] font-semibold border-b-2 border-[#4FE862] pb-3 -mb-3">Overview</span>
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
                        Transfer from <span className="text-[#3B82F6]">{solscanDetails.fromShort}</span> to <span className="text-[#3B82F6]">{solscanDetails.toShort}</span> for <span className="text-white font-semibold">{solscanDetails.amount} {solscanDetails.token}</span> <span className="text-[#4FE862]">{solscanDetails.tokenUsdValue}</span>
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
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 text-[#3B82F6] truncate mt-1 text-left"
                          onClick={() => {
                            if (!sentTransaction) return;
                            navigator.clipboard.writeText(solscanDetails.signature);
                            toast.success("Transaction ID copied");
                          }}
                        >
                          <span className="truncate">{solscanDetails.signatureShort}</span>
                          <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"></path></svg>
                        </button>
                      </div>

                      {/* Detail Rows */}
                      {[
                        { label: "Block", value: "—", isLink: false },
                        { label: "Timestamp", value: solscanDetails.timestamp, isLink: false },
                        { label: "Result", value: solscanDetails.status, isStatus: true },
                        { label: "Fee", value: solscanDetails.fee, isLink: false },
                        { label: "Priority Fee", value: solscanDetails.priorityFee, isLink: false },
                        { label: "Compute Units Consumed", value: "—", isLink: false },
                        { label: "Tx Version", value: "—", isLink: false },
                        { label: "Recent Block Hash", value: "—", isLink: false },
                        { label: "Signer", value: solscanDetails.signerShort, isLink: true },
                      ].map((row, idx) => (
                        <div key={idx} className="flex items-start justify-between p-4 border-b border-[#2a2a2a] last:border-0">
                          <div className="text-[#b4b4b4] w-[45%] pr-2 flex items-center gap-2 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                            {row.label}
                          </div>
                          <div className="flex-1 flex justify-end text-right min-w-0">
                            {row.isStatus ? (
                              <div className={`${solscanDetails.statusTone === "success" ? "bg-[#4FE862]/20 text-[#4FE862]" : solscanDetails.statusTone === "pending" ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#F80633]/20 text-[#F80633]"} px-2 py-0.5 rounded text-[11px] font-bold`}>{row.value}</div>
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

                      <div className="text-[12px] text-[#b4b4b4] mb-2">Compute Units Distribution Total: —</div>
                      <div className="flex h-2 w-full rounded-full overflow-hidden mb-4">
                        <div className="bg-[#333] w-full"></div>
                      </div>

                      <div className="bg-[#1a1a1f] rounded-xl border border-[#2a2a2a] overflow-hidden">
                        {[
                          { id: 1, name: solscanDetails.instructionName, sub: solscanDetails.instructionProgram, color: "bg-[#4FE862]" },
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
                        © {new Date().getFullYear()} Solscan. All rights reserved.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
