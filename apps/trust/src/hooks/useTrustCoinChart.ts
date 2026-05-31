import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";

export type TrustChartTimeframe = "1H" | "1D" | "1W" | "1M" | "1Y" | "ALL";

export interface TrustChartPoint {
  price: number;
  timestamp: number;
  x: number;
  y: number;
}

type RawChartPoint = [number, number];

const CHART_CACHE_PREFIX = "trust_coin_chart";

function isRawChartPoint(value: unknown): value is RawChartPoint {
  return Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}

function readCachedChart(cacheKey: string): RawChartPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isRawChartPoint) : [];
  } catch {
    return [];
  }
}

function writeCachedChart(cacheKey: string, points: RawChartPoint[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(points));
    window.localStorage.setItem(`${cacheKey}:ts`, Date.now().toString());
  } catch {
    // Chart cache is best-effort only.
  }
}

function normalizeChartPoints(rawPoints: RawChartPoint[]): TrustChartPoint[] {
  const cleaned = rawPoints
    .filter(([timestamp, price]) => Number.isFinite(timestamp) && Number.isFinite(price) && price >= 0)
    .sort((a, b) => a[0] - b[0]);

  if (!cleaned.length) return [];

  const minPrice = Math.min(...cleaned.map(([, pointPrice]) => pointPrice));
  const maxPrice = Math.max(...cleaned.map(([, pointPrice]) => pointPrice));
  const span = maxPrice - minPrice;
  const maxIndex = Math.max(cleaned.length - 1, 1);

  return cleaned.map(([timestamp, pointPrice], index) => ({
    price: pointPrice,
    timestamp,
    x: (index / maxIndex) * 360,
    y: span === 0 ? 90 : 24 + ((maxPrice - pointPrice) / span) * 132,
  }));
}

export function useTrustCoinChart({
  coingeckoId,
  currency,
  symbol,
  timeframe,
}: {
  coingeckoId?: string;
  currency: string;
  symbol: string;
  timeframe: TrustChartTimeframe;
}) {
  const cacheKey = useMemo(
    () => `${CHART_CACHE_PREFIX}:${symbol.toUpperCase()}:${coingeckoId || "symbol"}:${currency.toLowerCase()}:${timeframe}`,
    [coingeckoId, currency, symbol, timeframe],
  );
  const [rawPoints, setRawPoints] = useState<RawChartPoint[]>(() => readCachedChart(cacheKey));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol && !coingeckoId) {
      setRawPoints([]);
      setIsLoading(false);
      setError("Missing token symbol");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("symbol", trimmedSymbol);
      params.set("timeframe", timeframe);
      params.set("currency", currency.toLowerCase());
      if (coingeckoId) params.set("id", coingeckoId);

      const response = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/chart?${params.toString()}`);
      if (!response.ok) throw new Error(`Chart proxy failed: ${response.status}`);

      const payload = await response.json() as unknown;
      const nextPoints = Array.isArray(payload) ? payload.filter(isRawChartPoint) : [];
      setRawPoints(nextPoints);
      setError(null);
      writeCachedChart(cacheKey, nextPoints);
    } catch (fetchError) {
      const cached = readCachedChart(cacheKey);
      if (cached.length) setRawPoints(cached);
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch chart");
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, coingeckoId, currency, symbol, timeframe]);

  useEffect(() => {
    setRawPoints(readCachedChart(cacheKey));
    setError(null);
  }, [cacheKey]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return {
    error,
    isLoading,
    points: normalizeChartPoints(rawPoints),
    refetch: fetchChart,
  };
}
