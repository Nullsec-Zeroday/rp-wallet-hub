"use client";

import { useEffect, useState } from "react";

const YEARLY_DISCOUNT_DURATION_MS = 30 * 60 * 1000;
const YEARLY_DISCOUNT_DEADLINE_KEY = "rp-wallet:yearly-discount-deadline";

type YearlyDiscountOffer = {
  isReady: boolean;
  isActive: boolean;
  remainingMs: number;
};

function getOrCreateDeadline(now: number) {
  const storedDeadline = window.localStorage.getItem(YEARLY_DISCOUNT_DEADLINE_KEY);
  const parsedDeadline = storedDeadline ? Number(storedDeadline) : NaN;

  if (Number.isFinite(parsedDeadline)) {
    return parsedDeadline;
  }

  const deadline = now + YEARLY_DISCOUNT_DURATION_MS;
  window.localStorage.setItem(YEARLY_DISCOUNT_DEADLINE_KEY, String(deadline));
  return deadline;
}

export function formatYearlyDiscountRemaining(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function useYearlyDiscountOffer(): YearlyDiscountOffer {
  const [offer, setOffer] = useState<YearlyDiscountOffer>({
    isReady: false,
    isActive: false,
    remainingMs: 0,
  });

  useEffect(() => {
    const updateOffer = () => {
      const now = Date.now();
      const deadline = getOrCreateDeadline(now);
      const remainingMs = Math.max(0, deadline - now);

      setOffer({
        isReady: true,
        isActive: remainingMs > 0,
        remainingMs,
      });
    };

    updateOffer();
    const timer = window.setInterval(updateOffer, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return offer;
}
