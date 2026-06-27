"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ToastData {
  id: number;
  plan: string;
  timeAgo: string;
}

const PLANS = [
  { label: "Weekly Pass" },
  { label: "Monthly Pass" },
  { label: "Yearly Pass" },
];

const TIME_OPTIONS = [
  "just now", "1 min ago", "2 mins ago", "3 mins ago", "5 mins ago",
  "7 mins ago", "8 mins ago", "10 mins ago", "12 mins ago", "15 mins ago",
  "18 mins ago", "20 mins ago", "22 mins ago", "25 mins ago", "28 mins ago",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let _idCounter = 0;

function generateToast(): ToastData {
  return {
    id: ++_idCounter,
    plan: pickRandom(PLANS).label,
    timeAgo: pickRandom(TIME_OPTIONS),
  };
}

const FIRST_DELAY_MS = 2000;
const TOAST_VISIBLE_MS = 5000;
const MIN_GAP_MS = 10000;
const MAX_GAP_MS = 20000;

export default function SocialProofToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let destroyed = false;

    function showNext(delay: number) {
      const t = setTimeout(() => {
        if (destroyed) return;

        const toast = generateToast();
        setToasts((prev) => [...prev, toast]);

        const hide = setTimeout(() => {
          if (!destroyed)
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, TOAST_VISIBLE_MS);
        timers.current.push(hide);

        showNext(randomBetween(MIN_GAP_MS, MAX_GAP_MS));
      }, delay);
      timers.current.push(t);
    }

    showNext(FIRST_DELAY_MS);

    return () => {
      destroyed = true;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      className="fixed bottom-5 left-0 right-0 z-[9999] flex flex-col items-start gap-3 px-4 pointer-events-none sm:right-auto sm:w-auto sm:bottom-6 sm:left-5 sm:px-0"
      aria-live="polite"
      aria-label="Recent purchase notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-full sm:w-auto"
          >
            <div
              className="relative flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 shadow-2xl sm:w-[300px]"
              style={{
                background: "linear-gradient(135deg, rgba(15,10,30,0.93) 0%, rgba(25,15,50,0.93) 100%)",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* top shimmer */}
              <span
                className="absolute inset-x-0 top-0 h-px rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent 5%, rgba(134,239,172,0.5) 50%, transparent 95%)",
                }}
              />

              {/* 3D cash image */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <Image
                  src="/3d-cash.png"
                  alt="Cash"
                  width={44}
                  height={44}
                  className="object-contain drop-shadow-lg"
                />
              </div>

              {/* text */}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug text-white/90">
                  Someone just purchased
                </p>
                <p
                  className="mt-0.5 text-[13px] font-bold leading-snug"
                  style={{ color: "rgb(134,239,172)" }}
                >
                  {toast.plan}
                </p>
                <p className="mt-1 text-[11px] text-white/30">{toast.timeAgo}</p>
              </div>

              {/* close */}
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="ml-1 shrink-0 rounded-lg p-1.5 text-white/20 transition-colors hover:bg-white/5 hover:text-white/50"
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1 1l8 8M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
