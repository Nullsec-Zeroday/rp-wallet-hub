import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useRiveAsset } from "@/app/(wallet)/_components/rive-asset-provider";

export interface SwapToastProps {
  status: "swapping" | "swapped";
  fromSymbol: string;
  toSymbol: string;
  zIndex?: number;
}

const SwapToastIcon = ({ status }: { status: "swapping" | "swapped" }) => {
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

  React.useEffect(() => {
    if (startInput) {
      startInput.fire();
    }
  }, [startInput]);

  React.useEffect(() => {
    if (successInput && status === "swapped") {
      successInput.fire();
    }
  }, [successInput, status]);

  return (
    <div className="w-[32px] h-[32px] shrink-0 flex items-center justify-center relative bg-black/40 rounded-full select-none pointer-events-none">
      {assetBuffer ? (
        <div className="w-[72px] h-[72px] scale-[0.6] flex-shrink-0">
          <RiveComponent style={{ width: "100%", height: "100%" }} />
        </div>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-[#ab9ff2] animate-ping" />
      )}
    </div>
  );
};

export const SwapToast = ({ status, fromSymbol, toSymbol, zIndex = 999999 }: SwapToastProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`fixed left-1/2 top-[calc(10px+env(safe-area-inset-top,0px))] flex items-center bg-[#222222] border border-white/[0.06] rounded-[18px] pl-2.5 pr-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] gap-3.5 text-white pointer-events-none whitespace-nowrap select-none z-[${zIndex}]`}
      style={{ zIndex }}
    >
      <SwapToastIcon status={status} />
      <span className="text-[16px] font-medium tracking-normal text-white">
        {status === "swapping" ? `Swapping ${fromSymbol} -> ${toSymbol}` : `Swapped ${fromSymbol} -> ${toSymbol}`}
      </span>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
