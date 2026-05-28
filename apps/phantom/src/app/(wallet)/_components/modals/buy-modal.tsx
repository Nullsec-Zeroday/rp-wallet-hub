"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Search, HelpCircle, ChevronLeft, Check } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP, type TokenInfo } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import TokenLogo from "../token-logo";
import { motion, AnimatePresence } from "framer-motion";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useRiveAsset } from "../rive-asset-provider";

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
    <div className="w-[120px] h-[120px]">
      {assetBuffer && <RiveComponent style={{ width: "100%", height: "100%" }} />}
    </div>
  );
};

interface BuyModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

type Step = 'SELECT_TOKEN' | 'ENTER_AMOUNT' | 'SENDING' | 'SUCCESS';
type PaymentMethod = 'debit' | 'bank' | 'crypto';

export default function BuyModal({ visible, onClose, onCloseStart }: BuyModalProps) {
  const {
    customTokens,
    updateBalance,
    addTransaction,
    tokenBalances,
    profile
  } = useWalletStore();
  const { prices } = useLivePrices();
  const [step, setStep] = useState<Step>('SELECT_TOKEN');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit');
  const [searchQuery, setSearchQuery] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setSearchQuery("");
      setStep('SELECT_TOKEN');
      setSelectedToken(null);
      setAmount("100");
      setPaymentMethod('debit');
    }
  }, [visible]);

  // Play confetti audio on success
  useEffect(() => {
    if (step === "SUCCESS") {
      const audio = new Audio("/sound-effect/confetti.mp3");
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [step]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleBack = () => {
    if (step === 'ENTER_AMOUNT') {
      setStep('SELECT_TOKEN');
      setSelectedToken(null);
    }
  };

  const handleSelectToken = (token: TokenInfo) => {
    setSelectedToken(token);
    setStep('ENTER_AMOUNT');
  };

  const handleContinue = () => {
    setStep('SENDING');

    // Simulate purchase
    setTimeout(() => {
      if (selectedToken) {
        const usdAmount = parseFloat(amount) || 0;
        const price = prices[selectedToken.symbol]?.usd || selectedToken.price || 1;
        const tokenAmount = usdAmount / price;

        const currentBal = tokenBalances.find(b => b.symbol === selectedToken.symbol)?.balance || 0;
        updateBalance(selectedToken.symbol, currentBal + tokenAmount);
      }
      setStep('SUCCESS');
    }, 2500);
  };

  const allTokens = useMemo(() => [...TOKENS, ...customTokens], [customTokens]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return allTokens;
    return allTokens.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTokens, searchQuery]);

  const getStartedToken = allTokens.find((t) => t.symbol === "SOL");
  const popularTokens = allTokens.filter((t) => t.symbol === "ETH" || t.symbol === "BTC");
  const availableTokens = allTokens.filter(
    (t) => t.symbol !== "SOL" && t.symbol !== "ETH" && t.symbol !== "BTC"
  );

  const tokenAmountString = useMemo(() => {
    if (!selectedToken) return "0";
    const price = prices[selectedToken.symbol]?.usd || selectedToken.price || 1;
    const usd = parseFloat(amount) || 0;
    const val = usd / price;
    if (val === 0) return `0 ${selectedToken.symbol}`;
    return `${val.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selectedToken.symbol}`;
  }, [selectedToken, amount, prices]);

  const TokenRow = ({ token, isLast }: { token: TokenInfo; isLast?: boolean }) => (
    <div
      key={token.symbol}
      onClick={() => handleSelectToken(token)}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors cursor-pointer group relative"
    >
      <div className="flex-shrink-0">
        <TokenLogo
          token={token}
          size={40}
          liveImage={prices[token.symbol]?.image}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[17px] font-bold text-white leading-tight">{token.name}</div>
        <div className="text-[13px] font-medium text-[#888] mt-0.5">{token.symbol}</div>
      </div>
      {!isLast && (
        <div className="absolute bottom-0 left-[68px] right-0 h-px bg-white/[0.04]" />
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center sm:px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        className="absolute inset-0 bg-black/15"
        onClick={handleClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.7 }}
        className="w-full max-w-md bg-[#111111] overflow-hidden relative flex flex-col will-change-transform"
        style={{ height: "94vh", transform: "translateZ(0)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'ENTER_AMOUNT' && (
              <button onClick={handleBack} className="text-white active:opacity-60 transition-opacity -ml-1">
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            )}
            <span className="text-xl font-medium text-[#eeeeee]">
              {step === 'SELECT_TOKEN' ? 'Buy' :
                step === 'ENTER_AMOUNT' ? `Buy ${selectedToken?.symbol}` : ''}
            </span>
          </div>
          {step !== 'SENDING' && step !== 'SUCCESS' && (
            <button
              onClick={handleClose}
              className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence initial={false}>
            {step === 'SELECT_TOKEN' && (
              <motion.div
                key="select-token"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="px-4 mb-5">
                  <div className="bg-[#1c1c1e] rounded-2xl flex items-center px-4 h-[44px] gap-3 focus-within:ring-1 focus-within:ring-[#ac9cf2]/30 transition-all">
                    <Search size={18} className="text-[#b4b4b4]" strokeWidth={2.5} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search"
                      className="bg-transparent flex-1 text-white text-[16px] outline-none placeholder:text-[#888]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-12">
                  {!searchQuery ? (
                    <>
                      <div className="mb-6">
                        <div className="text-[13px] font-bold text-[#20a36e] uppercase tracking-wider mb-2.5 px-1">
                          Get started
                        </div>
                        <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden">
                          {getStartedToken && <TokenRow token={getStartedToken} isLast={true} />}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-[13px] font-bold text-[#20a36e] uppercase tracking-wider mb-2.5 px-1">
                          Popular tokens
                        </div>
                        <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden">
                          {popularTokens.map((token, idx) => (
                            <div key={token.symbol} className="relative">
                              <TokenRow token={token} isLast={idx === popularTokens.length - 1} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-[13px] font-bold text-[#20a36e] uppercase tracking-wider mb-2.5 px-1">
                          Available tokens
                        </div>
                        <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden">
                          {availableTokens.map((token, idx) => (
                            <div key={token.symbol} className="relative">
                              <TokenRow token={token} isLast={idx === availableTokens.length - 1} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden">
                      {filteredTokens.length > 0 ? (
                        filteredTokens.map((token, idx) => (
                          <div key={token.symbol} className="relative">
                            <TokenRow token={token} isLast={idx === filteredTokens.length - 1} />
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-[#888]">
                          <p className="font-medium">No tokens found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'ENTER_AMOUNT' && (
              <motion.div
                key="enter-amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex flex-col px-4"
              >
                <div className="flex flex-col items-center justify-center pt-10 pb-8">
                  <div className="flex items-center text-white">
                    <span className="text-[40px] font-bold mr-0.5 opacity-90 leading-none">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="bg-transparent text-[68px] font-bold outline-none text-center max-w-[280px] placeholder:text-white/20 leading-none"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val.length < 10) setAmount(val);
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="text-[#888] text-[17px] font-medium mt-3">
                    ≈ {tokenAmountString}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-10">
                  {["50", "100", "250", "500"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`flex-1 h-[42px] rounded-full text-[16px] font-bold transition-all active:scale-95 ${amount === preset
                        ? "bg-[#ac9cf2] text-[#111111]"
                        : "text-white bg-[#1c1c1e] hover:bg-white/[0.05]"
                        }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="text-[14px] font-bold text-[#888] uppercase tracking-wider mb-4 px-1">
                    Payment Method
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { id: 'debit', label: 'Debit Card', sub: 'Instant' },
                      { id: 'bank', label: 'Bank Transfer', sub: '1-3 days' },
                      { id: 'crypto', label: 'Crypto', sub: 'Instant' }
                    ].map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                          className={`flex items-center justify-between px-4 py-4 rounded-[22px] transition-all border-2 ${isSelected
                            ? "bg-[#1c1c1e] border-[#ac9cf2]"
                            : "bg-[#1c1c1e] border-transparent"
                            } active:scale-[0.98]`}
                        >
                          <div className="text-left">
                            <div className="text-[17px] font-bold text-white leading-tight">
                              {method.label}
                            </div>
                            <div className="text-[14px] font-medium text-[#888] mt-1.5">
                              {method.sub}
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? "bg-[#ac9cf2]" : "bg-[#2a2a2a]"
                            }`}>
                            {isSelected && (
                              <Check size={14} strokeWidth={4} className="text-[#111111]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto pb-10">
                  <button
                    onClick={handleContinue}
                    className="w-full h-[58px] rounded-[20px] bg-[#ac9cf2] text-[#111111] font-bold text-[18px] active:scale-[0.97] transition-all shadow-[0_10px_30px_rgba(172,156,242,0.15)]"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {(step === 'SENDING' || step === 'SUCCESS') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center pt-24 px-6"
              >
                <div className="mb-8">
                  <SendingAnimation isSuccess={step === 'SUCCESS'} />
                </div>

                <div className="text-center w-full">
                  <h3 className="text-[28px] font-bold text-white mb-4">
                    {step === 'SENDING' ? 'Processing...' : 'Purchase Successful!'}
                  </h3>

                  {step === 'SUCCESS' && (
                    <div className="space-y-1">
                      <p className="text-[#eeeeee] text-[17px] font-medium">
                        You bought {tokenAmountString}
                      </p>
                      <p className="text-[#888] text-[15px] font-medium">
                        for ${parseFloat(amount).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-auto w-full pb-10">
                  <button
                    onClick={handleClose}
                    disabled={step === 'SENDING'}
                    className={`w-full h-[56px] rounded-[20px] font-bold text-[17px] transition-all active:scale-[0.97] ${step === 'SUCCESS'
                      ? "bg-[#ac9cf2] text-[#111111]"
                      : "bg-[#222] text-[#666] opacity-50"
                      }`}
                  >
                    {step === 'SUCCESS' ? 'Done' : 'Processing...'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
