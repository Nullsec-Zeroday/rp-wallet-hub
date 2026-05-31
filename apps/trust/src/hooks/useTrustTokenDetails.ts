import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";

export interface TrustTokenDetails {
  categories: string[];
  circulatingSupply: number;
  coingeckoRank: number | null;
  description: string;
  genesisDate: string | null;
  links: {
    github: string;
    reddit: string;
    twitter: string;
    website: string;
    whitepaper: string;
  };
  marketCap: number;
  sentimentVotesDownPercentage: number;
  sentimentVotesUpPercentage: number;
  totalSupply: number;
  totalVolume: number;
}

const EMPTY_DETAILS: TrustTokenDetails = {
  categories: [],
  circulatingSupply: 0,
  coingeckoRank: null,
  description: "",
  genesisDate: null,
  links: {
    github: "",
    reddit: "",
    twitter: "",
    website: "",
    whitepaper: "",
  },
  marketCap: 0,
  sentimentVotesDownPercentage: 0,
  sentimentVotesUpPercentage: 0,
  totalSupply: 0,
  totalVolume: 0,
};

const DETAILS_CACHE_PREFIX = "trust_token_details";

function readCachedDetails(cacheKey: string): TrustTokenDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey);
    return raw ? { ...EMPTY_DETAILS, ...JSON.parse(raw) as Partial<TrustTokenDetails> } : null;
  } catch {
    return null;
  }
}

function writeCachedDetails(cacheKey: string, details: TrustTokenDetails) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(details));
    window.localStorage.setItem(`${cacheKey}:ts`, Date.now().toString());
  } catch {
    // Token details cache is best-effort only.
  }
}

function normalizeDetails(value: unknown): TrustTokenDetails {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<TrustTokenDetails>;
  return {
    ...EMPTY_DETAILS,
    ...raw,
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    links: {
      ...EMPTY_DETAILS.links,
      ...(raw.links || {}),
    },
  };
}

export function useTrustTokenDetails({
  coingeckoId,
  currency,
  symbol,
}: {
  coingeckoId?: string;
  currency: string;
  symbol: string;
}) {
  const cacheKey = useMemo(
    () => `${DETAILS_CACHE_PREFIX}:${symbol.toUpperCase()}:${coingeckoId || "symbol"}:${currency.toLowerCase()}`,
    [coingeckoId, currency, symbol],
  );
  const [details, setDetails] = useState<TrustTokenDetails>(() => readCachedDetails(cacheKey) || EMPTY_DETAILS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol && !coingeckoId) {
      setDetails(EMPTY_DETAILS);
      setIsLoading(false);
      setError("Missing token symbol");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("symbol", trimmedSymbol);
      params.set("currency", currency.toLowerCase());
      if (coingeckoId) params.set("id", coingeckoId);

      const response = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/token-details?${params.toString()}`);
      if (!response.ok) throw new Error(`Token details failed: ${response.status}`);

      const nextDetails = normalizeDetails(await response.json());
      setDetails(nextDetails);
      setError(null);
      writeCachedDetails(cacheKey, nextDetails);
    } catch (fetchError) {
      const cached = readCachedDetails(cacheKey);
      if (cached) setDetails(cached);
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch token details");
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, coingeckoId, currency, symbol]);

  useEffect(() => {
    setDetails(readCachedDetails(cacheKey) || EMPTY_DETAILS);
    setError(null);
  }, [cacheKey]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    details,
    error,
    isLoading,
    refetch: fetchDetails,
  };
}
