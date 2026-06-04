import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";
import { getStaticTrustPrices, TRUST_TOKENS, type TrustLivePrices } from "@/lib/trust-token-data";

const STORAGE_KEY = "trust_live_prices";
const STORAGE_TS_KEY = "trust_live_prices_ts";

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

export function useTrustLivePrices(symbols: string[], apiKey: string, currency: string, demoMode = false) {
  const [prices, setPrices] = useState<TrustLivePrices>(() => readCachedPrices() || getStaticTrustPrices());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (demoMode) {
        const staticPrices = getStaticTrustPrices();
        setPrices(staticPrices);
        setError(null);
        writeCachedPrices(staticPrices);
        return;
      }
      const params = new URLSearchParams();
      if (querySymbols.length) params.set("symbols", querySymbols.join(","));
      if (currency) params.set("currency", currency.toLowerCase());

      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers["x-custom-cg-api-key"] = apiKey.trim();

      const response = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/prices?${params.toString()}`, { headers });
      if (!response.ok) throw new Error(`Price proxy failed: ${response.status}`);

      const live = await response.json() as TrustLivePrices;
      const merged = { ...staticPrices, ...live };
      setPrices(merged);
      setError(null);
      writeCachedPrices(merged);
    } catch (fetchError) {
      const cached = readCachedPrices();
      if (cached) {
        setPrices({ ...staticPrices, ...cached });
      }
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch prices");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currency, demoMode, symbolKey]);

  useEffect(() => {
    fetchPrices();
    const interval = window.setInterval(fetchPrices, demoMode ? 120000 : apiKey.trim() ? 10000 : 30000);
    return () => window.clearInterval(interval);
  }, [apiKey, demoMode, fetchPrices]);

  return {
    error,
    isLoading,
    prices,
    refetch: fetchPrices,
  };
}
