import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, SlidersHorizontal, ArrowRightLeft } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, formatCurrency } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import TokenLogo from "../token-logo";
import { TokenPickerModal } from "./token-picker-modal";
import { SwapToast } from "../swap-toast";
import { createBackendWalletTransaction } from "@/lib/backend-wallet";
import { toast } from "sonner";

interface TradeModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

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

export default function TradeModal({ visible, onClose, onCloseStart }: TradeModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toastState, setToastState] = useState<"swapping" | "swapped" | null>(null);

  // Swap State
  const { tokenBalances, baseCurrency, customTokens } = useWalletStore();
  const { prices } = useLivePrices();
  const [payToken, setPayToken] = useState("SOL");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [payAmount, setPayAmount] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"pay" | "receive" | null>(null);

  const balanceMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of tokenBalances) {
      map[b.symbol] = b.balance;
    }
    return map;
  }, [tokenBalances]);

  const allTokens = React.useMemo(() => [...TOKENS, ...customTokens], [customTokens]);
  const payTokenInfo = allTokens.find(t => t.symbol === payToken) || TOKENS[0];
  const receiveTokenInfo = allTokens.find(t => t.symbol === receiveToken) || TOKENS.find(t => t.symbol === 'USDC') || TOKENS[0];
  const payPrice = prices[payToken]?.usd ?? payTokenInfo.price;
  const receivePrice = prices[receiveToken]?.usd ?? receiveTokenInfo.price;

  const payAmountNum = parseFloat(payAmount) || 0;
  const receiveAmount = receivePrice > 0 ? (payAmountNum * payPrice) / receivePrice : 0;
  const payBalance = balanceMap[payToken] ?? 0;
  const receiveBalance = balanceMap[receiveToken] ?? 0;

  const canSwap = payAmountNum > 0 && payAmountNum <= payBalance && payToken !== receiveToken;
  const isInsufficientBalance = payAmountNum > 0 && payAmountNum > payBalance;

  const handleSwap = useCallback(() => {
    if (!canSwap) return;

    setToastState("swapping");
    const sourceToken = payToken;
    const destToken = receiveToken;
    const amtPayToken = payAmountNum;
    const amtReceive = receiveAmount;

    setPayAmount("");

    // Simulate processing delay
    const delay = Math.floor(Math.random() * 2001) + 3000;
    setTimeout(() => {
      createBackendWalletTransaction({
        type: "swap",
        tokenSymbol: sourceToken,
        amount: String(amtPayToken),
        toTokenSymbol: destToken,
        toAmount: String(amtReceive),
        fromAddress: "Self",
        toAddress: "Self",
      }).then(() => {
        const audio = new Audio("/sound-effect/confetti.mp3");
        audio.play().catch(e => console.log("Audio play failed:", e));

        setToastState("swapped");

        setTimeout(() => {
          setToastState(null);
          handleClose();
        }, 2500);
      }).catch((error) => {
        console.error("Trade persist failed:", error);
        toast.error("Unable to save swap. Check your session and balance.");
        setToastState(null);
      });
    }, delay);
  }, [canSwap, payToken, receiveToken, payAmountNum, receiveAmount]);

  const buttonText = toastState === "swapping"
    ? "Swapping..."
    : isInsufficientBalance
      ? "Insufficient balance"
      : payAmountNum === 0
        ? "Enter an amount"
        : "Swap";

  const buttonDisabled = !canSwap || toastState !== null;

  useEffect(() => {
    setMounted(true);
    if (visible) {
      setIsClosing(false);
      document.body.style.overflow = "hidden";
      setPayAmount("");
    } else {
      document.body.style.overflow = "";
    }
  }, [visible]);

  const handleClose = () => {
    if (onCloseStart) onCloseStart();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleFlip = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount("");
  }, [payToken, receiveToken]);

  const handleNumberPress = (num: string) => {
    setPayAmount((prev) => {
      if (num === "." && prev.includes(".")) return prev;
      if (prev === "0" && num !== ".") return num;
      if (prev.length >= 12) return prev;
      return prev + num;
    });
  };

  const handleDelete = () => {
    setPayAmount((prev) => prev.slice(0, -1));
  };

  const handlePillPress = (pct: number) => {
    if (payBalance <= 0) return;
    let val = payBalance * pct;
    const strVal = val.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 6 });
    setPayAmount(strVal);
  };

  if (!visible || !mounted) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[110] flex flex-col justify-end items-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        style={{
          animation: isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards",
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full max-w-md bg-[#000000] flex flex-col pointer-events-auto shadow-2xl relative rounded-t-[32px]"
        style={{
          height: "94vh",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >
        <div className="w-full flex flex-col flex-shrink-0 z-20">
          <div className="w-full flex justify-center pt-3 pb-3">
            <div className="w-9 h-[5px] bg-[#444444] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-[#1c1c1e] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <X size={20} className="text-[#eeeeee]" />
            </button>
            <h2 className="text-[17px] font-bold text-white tracking-wide">Trade</h2>
            <button className="w-10 h-10 bg-[#1c1c1e] rounded-full flex items-center justify-center active:scale-95 transition-transform">
              <SlidersHorizontal size={18} className="text-[#eeeeee]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <div className="flex flex-col px-4 mt-12 mb-2">
            {/* You Pay Section */}
            <div className="flex flex-col bg-[#1c1c1e] rounded-[24px] p-5 relative z-0">
              <div className="text-[#eeeeee] text-[15px] font-semibold mb-2 opacity-50">You Pay</div>
              <div className="flex items-center justify-between">
                <div className="text-[#eeeeee] font-semibold text-[40px] leading-none tracking-tight overflow-hidden text-ellipsis whitespace-nowrap mr-2 opacity-60">
                  {payAmount || "0"}
                </div>
                <button
                  onClick={() => setPickerTarget("pay")}
                  className="flex items-center rounded-full pl-2 pr-3 py-1.5 active:opacity-70 bg-[#242424] flex-shrink-0"
                >
                  <TokenLogo token={payTokenInfo} size={28} liveImage={prices[payToken]?.image} />
                  <span className="text-[#eeeeee] font-bold text-[16px] mx-2">{payToken}</span>
                  <div className="bg-[#ab9ff2] rounded-full w-[14px] h-[14px] flex items-center justify-center mr-1">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                </button>
              </div>
              <div className="flex items-center justify-end mt-2 text-[#b4b4b4] text-[14px] font-medium h-[20px]">
                {formatCurrency(payBalance, payToken).replace('$', '')} {payToken}
              </div>
            </div>

            {/* Swap Button Divider */}
            <div className="relative h-2 z-10 flex justify-center items-center">
              <button
                onClick={handleFlip}
                className="absolute w-10 h-10 bg-[#ab9ff2] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowRightLeft size={16} className="text-black rotate-90" />
              </button>
            </div>

            {/* You Receive Section */}
            <div className="flex flex-col bg-[#1c1c1e] rounded-[24px] p-5 relative z-0">
              <div className="text-[#eeeeee] text-[15px] font-semibold mb-2 opacity-50">You Receive</div>
              <div className="flex items-center justify-between">
                <div className="text-[#eeeeee] font-semibold text-[40px] leading-none tracking-tight overflow-hidden text-ellipsis whitespace-nowrap mr-2 opacity-60">
                  {receiveAmount > 0 ? (receiveAmount >= 1 ? receiveAmount.toFixed(4) : receiveAmount.toFixed(6)) : "0"}
                </div>
                <button
                  onClick={() => setPickerTarget("receive")}
                  className="flex items-center rounded-full pl-2 pr-3 py-1.5 active:opacity-70 bg-[#242424] flex-shrink-0"
                >
                  <TokenLogo token={receiveTokenInfo} size={28} liveImage={prices[receiveToken]?.image} />
                  <span className="text-[#eeeeee] font-bold text-[16px] mx-2">{receiveToken === 'USDC' ? 'Cash' : receiveToken}</span>
                  <div className="bg-[#ab9ff2] rounded-full w-[14px] h-[14px] flex items-center justify-center mr-1">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                </button>
              </div>
              <div className="flex items-center justify-end mt-2 text-[#b4b4b4] text-[14px] font-medium h-[20px]">
                {formatCurrency(receiveAmount * receivePrice, baseCurrency)}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[12px]" />

          {/* Keypad Section */}
          <div className="flex flex-col w-full bg-transparent mb-4 px-2">
            <div className="px-2 mb-2 min-h-[56px] flex flex-col justify-center">
              {payAmountNum > 0 ? (
                <button
                  disabled={buttonDisabled}
                  onClick={handleSwap}
                  className="w-full py-4 rounded-full font-bold text-[17px] tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center justify-center animate-fade-in-up"
                  style={{
                    background: isInsufficientBalance
                      ? "rgb(220, 38, 38)"
                      : buttonDisabled
                        ? "rgba(171, 159, 242, 0.4)"
                        : "#AB9FF2",
                    color: isInsufficientBalance ? "#ffffff" : "#0c0814",
                  }}
                >
                  {buttonText}
                </button>
              ) : (
                <div className="flex items-center gap-3 animate-fade-in">
                  <button onClick={() => handlePillPress(0.25)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1e] active:bg-[#2c2c2e] text-[#eeeeee] text-[16px] font-medium transition-colors">25%</button>
                  <button onClick={() => handlePillPress(0.50)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1e] active:bg-[#2c2c2e] text-[#eeeeee] text-[16px] font-medium transition-colors">50%</button>
                  <button onClick={() => handlePillPress(1)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1e] active:bg-[#2c2c2e] text-[#eeeeee] text-[16px] font-medium transition-colors">Sell all</button>
                </div>
              )}
            </div>
            <NumberPad onNumberPress={handleNumberPress} onDelete={handleDelete} />
          </div>
        </div>
      </div>
      {toastState && <SwapToast status={toastState} fromSymbol={payToken} toSymbol={receiveToken} zIndex={999999} />}
      <TokenPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(symbol) => {
          if (pickerTarget === "pay") {
            if (symbol === receiveToken) handleFlip();
            else setPayToken(symbol);
          } else {
            if (symbol === payToken) handleFlip();
            else setReceiveToken(symbol);
          }
        }}
        tokens={allTokens}
        prices={prices as any}
        balances={balanceMap}
        excludeSymbol={pickerTarget === "pay" ? receiveToken : payToken}
      />
    </div>
  );
}
