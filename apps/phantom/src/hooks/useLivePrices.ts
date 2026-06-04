/**
 * useLivePrices — React hook for polling CoinGecko every N milliseconds.
 * Prices are persisted to localStorage so navigating between pages
 * instantly shows the last-known live prices (no flicker/hiccup).
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { type LivePrices } from '@/lib/wallet-data';
import { fetchLivePrices, getStaticPrices } from '@/lib/coingecko-service';
import { useWalletStore } from '@/lib/wallet-store';
import { isDemoPayload, readCachedBootstrap } from "@rp-wallet/wallet-core";

const STORAGE_KEY = 'phantom_live_prices';
const STORAGE_TS_KEY = 'phantom_live_prices_ts';

interface UseLivePricesReturn {
  prices: LivePrices;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Read cached prices from localStorage, returns null if missing/corrupt */
function getCachedPrices(): LivePrices | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LivePrices;
  } catch {
    return null;
  }
}

/** Write prices to localStorage */
function setCachedPrices(prices: LivePrices): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
    localStorage.setItem(STORAGE_TS_KEY, Date.now().toString());
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

/** Initialize prices: prefer localStorage cache, fall back to static */
function getInitialPrices(): LivePrices {
  const cached = getCachedPrices();
  if (cached && Object.keys(cached).length > 0) return cached;
  return getStaticPrices();
}

export function useLivePrices(overrideIntervalMs?: number): UseLivePricesReturn {
  const { isKeyVerified, coingeckoApiKey, baseCurrency, customTokens } = useWalletStore();
  const demoMode = isDemoPayload(readCachedBootstrap("phantom"));
  
  // Logic: 10s if custom key, 30s default
  const intervalMs = overrideIntervalMs ?? (
    demoMode ? 120000 : coingeckoApiKey ? 10000 : 30000
  );

  const [prices, setPrices] = useState<LivePrices>(() => getInitialPrices());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastPricesRef = useRef<LivePrices>(prices);

  const doFetch = useCallback(async () => {
    try {
      if (demoMode) {
        const staticPrices = getStaticPrices();
        lastPricesRef.current = staticPrices;
        setPrices(staticPrices);
        setLastUpdated(Date.now());
        setError(null);
        setCachedPrices(staticPrices);
        return;
      }
      const customMappings: Record<string, string> = {};
      customTokens.forEach(t => {
        if (t.coingeckoId) customMappings[t.symbol] = t.coingeckoId;
      });

      const freshPrices = await fetchLivePrices(undefined, coingeckoApiKey, baseCurrency, customMappings);
      const staticPrices = getStaticPrices();
      
      // Also add custom tokens to merged if they aren't in freshPrices (though they should be)
      const customStaticPrices: LivePrices = {};
      customTokens.forEach(t => {
        customStaticPrices[t.symbol] = { usd: t.price, usd_24h_change: 0 };
      });

      const merged: LivePrices = { ...staticPrices, ...customStaticPrices, ...freshPrices };

      lastPricesRef.current = merged;
      setPrices(merged);
      setLastUpdated(Date.now());
      setError(null);

      // Persist to localStorage for instant access on next mount
      setCachedPrices(merged);
    } catch (err: any) {
      console.warn('[useLivePrices] fetch failed, using cached prices:', err.message);
      setError(err.message ?? 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  }, [coingeckoApiKey, baseCurrency, customTokens, demoMode]);

  useEffect(() => {
    doFetch();
    const handle = setInterval(doFetch, intervalMs);
    return () => clearInterval(handle);
  }, [doFetch, intervalMs]);

  // Listen for pull-to-refresh events from the layout
  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail as LivePrices;
      if (detail && Object.keys(detail).length > 0) {
        lastPricesRef.current = detail;
        setPrices(detail);
        setLastUpdated(Date.now());
        setError(null);
        setIsLoading(false);
      }
    };
    window.addEventListener('prices-updated', handleRefresh);
    return () => window.removeEventListener('prices-updated', handleRefresh);
  }, []);

  return { prices, isLoading, lastUpdated, error, refetch: doFetch };
}
