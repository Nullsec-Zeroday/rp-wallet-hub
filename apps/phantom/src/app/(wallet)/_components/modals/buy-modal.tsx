"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
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

const ApplePayMark = () => (
  <svg width="34" height="16" viewBox="0 0 34 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.06 2.08c.38-.47.64-1.1.57-1.75-.55.03-1.23.37-1.62.83-.35.4-.66 1.07-.58 1.69.62.05 1.24-.31 1.63-.77zm.57.9c-.9-.05-1.66.51-2.09.51-.43 0-1.08-.48-1.79-.47-.92.01-1.77.53-2.24 1.36-.96 1.65-.25 4.1.68 5.44.45.66.99 1.39 1.7 1.36.68-.03.94-.44 1.76-.44.82 0 1.05.44 1.78.43.73-.01 1.19-.66 1.64-1.33.51-.76.72-1.49.74-1.53-.02-.01-1.42-.55-1.43-2.17-.01-1.36 1.11-2.01 1.16-2.04-.63-.94-1.62-1.04-1.91-1.12z"/>
    <text x="10" y="12.5" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="-apple-system, system-ui, sans-serif">Pay</text>
  </svg>
);

interface BuyModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
}

type Step = 'AMOUNT' | 'SENDING' | 'SUCCESS';
type PaymentMethod = 'applePay' | 'card';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub?: string }[] = [
  { id: 'applePay', label: 'Apple Pay', sub: 'Debit card required' },
  { id: 'card', label: 'Card' },
];

export default function BuyModal({ visible, onClose, onCloseStart }: BuyModalProps) {
  const { cashBalance, updateCashBalance } = useWalletStore();
  const [step, setStep] = useState<Step>('AMOUNT');
  const [usdAmount, setUsdAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('applePay');
  const [methodDrawerOpen, setMethodDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setStep('AMOUNT');
      setUsdAmount("");
      setPaymentMethod('applePay');
      setMethodDrawerOpen(false);
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

  const usdAmountNum = parseFloat(usdAmount) || 0;
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod) || PAYMENT_METHODS[0];

  const handleAddCash = () => {
    if (usdAmountNum <= 0) return;
    setStep('SENDING');
    setTimeout(() => {
      updateCashBalance(cashBalance + usdAmountNum);
      setStep('SUCCESS');
    }, 2500);
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

        <div className="flex-1 overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            {step === 'AMOUNT' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full bg-[#000000] flex flex-col absolute inset-0"
              >
                {/* Header */}
                <div className="bg-[#000000] flex-shrink-0 flex items-center gap-4 px-4 py-3">
                  <button
                    onClick={handleClose}
                    className="bg-[#1c1c1e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <X size={22} className="text-white" />
                  </button>
                  <span className="text-[18px] font-semibold text-white tracking-wide">Add Cash</span>
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
                  </div>

                  <div className="flex-1 min-h-[12px]" />

                  {/* Payment Method Row */}
                  <button
                    onClick={() => setMethodDrawerOpen(true)}
                    className="px-5 py-4 flex items-center justify-between w-full bg-transparent border-none cursor-pointer active:opacity-70 transition-opacity flex-shrink-0"
                  >
                    <span className="text-[19px] font-semibold text-white">{selectedMethod.label}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </button>

                  {/* Preset chips / Add Cash */}
                  <div className="px-4 mb-2 min-h-[56px] flex flex-col justify-center flex-shrink-0">
                    {usdAmountNum > 0 ? (
                      <button
                        onClick={handleAddCash}
                        className="w-full py-4 rounded-full font-bold text-[17px] tracking-tight transition-all border-none flex items-center justify-center cursor-pointer"
                        style={{ background: "#AB9FF2", color: "#0c0814" }}
                      >
                        Add Cash
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {["50", "100", "500"].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setUsdAmount(preset)}
                            className="flex-1 py-3.5 rounded-full bg-[#1c1c1e] active:bg-[#2c2c2e] text-[#eeeeee] text-[16px] font-medium transition-colors border-none cursor-pointer"
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Keypad */}
                  <div
                    className="flex-shrink-0 w-full"
                    style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
                  >
                    <NumberPad onNumberPress={handleNumberPress} onDelete={handleDelete} />
                  </div>
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
                  <h3 className="text-[28px] font-bold text-white mb-4 tracking-tight">
                    {step === 'SENDING' ? 'Processing...' : 'Cash Added!'}
                  </h3>

                  {step === 'SUCCESS' && (
                    <p className="text-[#eeeeee] text-[16px] font-medium">
                      <span className="font-semibold">${usdAmountNum.toLocaleString()}</span> added to Cash with {selectedMethod.label}
                    </p>
                  )}
                </div>

                <div className="mt-auto w-full pb-10" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
                  <button
                    onClick={handleClose}
                    disabled={step === 'SENDING'}
                    className={`w-full h-[56px] rounded-full border-none font-semibold text-[17px] transition-all active:scale-[0.98] ${step === 'SUCCESS'
                      ? "bg-[#1c1c1e] text-[#eeeeee] cursor-pointer"
                      : "bg-[#1c1c1e] text-[#666] opacity-50 cursor-not-allowed"
                      }`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Methods Drawer */}
          <AnimatePresence>
            {methodDrawerOpen && (
              <>
                <motion.div
                  key="drawer-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 z-40"
                  onClick={() => setMethodDrawerOpen(false)}
                />
                <motion.div
                  key="drawer"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.7 }}
                  className="absolute bottom-0 left-0 right-0 bg-[#161618] rounded-t-[32px] z-50 flex flex-col"
                  style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}
                >
                  {/* Drawer header */}
                  <div className="relative flex items-center justify-center px-4 pt-6 pb-5">
                    <button
                      onClick={() => setMethodDrawerOpen(false)}
                      className="absolute left-4 bg-[#2c2c2e] w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <X size={20} className="text-white" />
                    </button>
                    <span className="text-[20px] font-semibold text-white">Payment Methods</span>
                  </div>

                  {/* Methods */}
                  <div className="px-4 pb-4">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setMethodDrawerOpen(false);
                        }}
                        className="flex items-center gap-4 w-full px-2 py-3.5 bg-transparent border-none cursor-pointer text-left active:opacity-70 transition-opacity"
                      >
                        <div className="w-[52px] h-[40px] rounded-[10px] bg-[#2c2c2e] flex items-center justify-center flex-shrink-0">
                          {method.id === 'applePay' ? (
                            <ApplePayMark />
                          ) : (
                            <CreditCard size={22} className="text-white" fill="#ffffff" stroke="#2c2c2e" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[18px] font-semibold text-white block leading-tight">{method.label}</span>
                          {method.sub && (
                            <span className="text-[15px] font-normal text-[#a0a0a0] block mt-0.5">{method.sub}</span>
                          )}
                        </div>
                        {paymentMethod === method.id && (
                          <div className="w-[11px] h-[11px] rounded-full bg-[#ab9ff2] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
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
      `}</style>
    </div>
  );
}
