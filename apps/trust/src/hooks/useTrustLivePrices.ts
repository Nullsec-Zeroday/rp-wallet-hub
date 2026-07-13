import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";
import { getStaticTrustPrices, TRUST_TOKENS, type TrustLivePrices } from "@/lib/trust-token-data";

const STORAGE_KEY = "trust_live_prices";
const STORAGE_TS_KEY = "trust_live_prices_ts";

// Window event a pull-to-refresh dispatches to force a fresh fluctuation tick.
export const TRUST_REFRESH_PRICES_EVENT = "trust-refresh-prices";

// The price proxy only refreshes every 1–5 min, so consecutive polls usually
// return identical values and the portfolio total looks frozen — unlike a real
// account that ticks constantly. Between real fetches (every 5s, and on every
// pull-to-refresh) we apply a tiny synthetic jitter so the value visibly
// fluctuates. Each tick is anchored to the last REAL price (not compounded), so
// it oscillates in a tight band and never drifts. Display-only — localStorage
// always holds the real prices.
const PRICE_JITTER_MIN_PCT = 0.0002; // ±0.02% floor
const PRICE_JITTER_MAX_PCT = 0.0012; // ±0.12% ceiling
const PRICE_JITTER_INTERVAL_MS = 5000;

function applyPriceJitter(anchor: TrustLivePrices): TrustLivePrices {
  const jittered: TrustLivePrices = {};
  for (const symbol in anchor) {
    const entry = anchor[symbol];
    const magnitude = PRICE_JITTER_MIN_PCT + Math.random() * (PRICE_JITTER_MAX_PCT - PRICE_JITTER_MIN_PCT);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const noise = 1 + sign * magnitude;
    jittered[symbol] = { ...entry, usd: entry.usd * noise };
  }
  return jittered;
}

function readCachedPrices(): TrustLivePrices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as TrustLivePrices : null;
  } catch {
    return null;
  }
}

function writeCachedPrices(prices: TrustLivePrices) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
    window.localStorage.setItem(STORAGE_TS_KEY, Date.now().toString());
  } catch {
    // Storage is best-effort cache only.
  }
}

export function useTrustLivePrices(symbols: string[], apiKey: string, currency: string) {
  const [prices, setPrices] = useState<TrustLivePrices>(() => readCachedPrices() || getStaticTrustPrices());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Holds the last REAL prices so the jitter re-centers on truth (never compounds).
  const lastRealPricesRef = useRef<TrustLivePrices>(prices);

  const symbolKey = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase()))).sort().join(","),
    [symbols],
  );

  const fetchPrices = useCallback(async () => {
    const staticPrices = getStaticTrustPrices();
    const targetSymbols = symbolKey ? symbolKey.split(",") : TRUST_TOKENS.map((token) => token.symbol);
    const mappings = new Map(TRUST_TOKENS.map((token) => [token.symbol, token.coingeckoId]).filter((entry): entry is [string, string] => Boolean(entry[1])));
    const querySymbols = targetSymbols.map((symbol) => {
      const id = mappings.get(symbol);
      return id ? `${symbol}:${id}` : symbol;
    });

    try {
      const params = new URLSearchParams();
      if (querySymbols.length) params.set("symbols", querySymbols.join(","));
      if (currency) params.set("currency", currency.toLowerCase());

      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers["x-custom-cg-api-key"] = apiKey.trim();

      const response = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/prices?${params.toString()}`, { headers });
      if (!response.ok) throw new Error(`Price proxy failed: ${response.status}`);

      const live = await response.json() as TrustLivePrices;
      const merged = { ...staticPrices, ...live };
      lastRealPricesRef.current = merged;
      setPrices(merged);
      setError(null);
      writeCachedPrices(merged);
    } catch (fetchError) {
      const cached = readCachedPrices();
      if (cached) {
        const mergedCached = { ...staticPrices, ...cached };
        lastRealPricesRef.current = mergedCached;
        setPrices(mergedCached);
      }
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch prices");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currency, symbolKey]);

  useEffect(() => {
    fetchPrices();
    const interval = window.setInterval(fetchPrices, apiKey.trim() ? 10000 : 30000);
    return () => window.clearInterval(interval);
  }, [apiKey, fetchPrices]);

  // Synthetic micro-fluctuation between real fetches (every 5s), anchored to the
  // last real price so the total ticks like a live account without drifting.
  useEffect(() => {
    const handle = window.setInterval(() => {
      const anchor = lastRealPricesRef.current;
      if (anchor && Object.keys(anchor).length > 0) {
        setPrices(applyPriceJitter(anchor));
      }
    }, PRICE_JITTER_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, []);

  // Pull-to-refresh fires an immediate fluctuation tick.
  useEffect(() => {
    const onRefresh = () => {
      const anchor = lastRealPricesRef.current;
      if (anchor && Object.keys(anchor).length > 0) {
        setPrices(applyPriceJitter(anchor));
      }
    };
    window.addEventListener(TRUST_REFRESH_PRICES_EVENT, onRefresh);
    return () => window.removeEventListener(TRUST_REFRESH_PRICES_EVENT, onRefresh);
  }, []);

  return {
    error,
    isLoading,
    prices,
    refetch: fetchPrices,
  };
}
