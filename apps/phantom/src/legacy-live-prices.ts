import { useCallback, useEffect, useRef, useState } from "react";
import { TOKENS, type LivePrices } from "./legacy-wallet-data";

const STORAGE_KEY = "phantom_live_prices";
const STORAGE_TS_KEY = "phantom_live_prices_ts";
const CG_BASE_URL = "https://api.coingecko.com/api/v3";

function getCachedPrices(): LivePrices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LivePrices;
  } catch {
    return null;
  }
}

function setCachedPrices(prices: LivePrices) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
    localStorage.setItem(STORAGE_TS_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

export function getStaticPrices(): LivePrices {
  const prices: LivePrices = {};
  TOKENS.forEach((token) => {
    prices[token.symbol] = {
      usd: token.price,
      usd_24h_change: 0,
    };
  });
  return prices;
}

function getInitialPrices(): LivePrices {
  const cached = getCachedPrices();
  if (cached && Object.keys(cached).length > 0) return cached;
  return getStaticPrices();
}

export async function fetchLivePrices(symbols?: string[]): Promise<LivePrices> {
  const tokenSet = symbols?.length ? TOKENS.filter((token) => symbols.includes(token.symbol)) : TOKENS;
  const ids = tokenSet.map((token) => token.coingeckoId).filter(Boolean).join(",");
  if (!ids) return {};

  const url = new URL(`${CG_BASE_URL}/simple/price`);
  url.searchParams.set("ids", ids);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_last_updated_at", "true");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`CoinGecko error: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  const prices: LivePrices = {};

  tokenSet.forEach((token) => {
    if (!token.coingeckoId) {
      prices[token.symbol] = { usd: token.price, usd_24h_change: 0 };
      return;
    }

    const entry = data[token.coingeckoId];
    prices[token.symbol] = {
      usd: entry?.usd ?? token.price,
      usd_24h_change: entry?.usd_24h_change ?? 0,
      image: token.logoUrl,
    };
  });

  return prices;
}

export function useLivePrices(overrideIntervalMs?: number) {
  const intervalMs = overrideIntervalMs ?? 30000;
  const [prices, setPrices] = useState<LivePrices>(() => getInitialPrices());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastPricesRef = useRef(prices);

  const doFetch = useCallback(async () => {
    try {
      const freshPrices = await fetchLivePrices();
      const merged = { ...getStaticPrices(), ...freshPrices };
      lastPricesRef.current = merged;
      setPrices(merged);
      setLastUpdated(Date.now());
      setError(null);
      setCachedPrices(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch prices";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void doFetch();
    const handle = window.setInterval(() => {
      void doFetch();
    }, intervalMs);
    return () => window.clearInterval(handle);
  }, [doFetch, intervalMs]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail as LivePrices;
      if (detail && Object.keys(detail).length > 0) {
        lastPricesRef.current = detail;
        setPrices(detail);
        setLastUpdated(Date.now());
        setError(null);
        setIsLoading(false);
      }
    };

    window.addEventListener("prices-updated", handleRefresh);
    return () => window.removeEventListener("prices-updated", handleRefresh);
  }, []);

  return { prices, isLoading, lastUpdated, error, refetch: doFetch };
}
