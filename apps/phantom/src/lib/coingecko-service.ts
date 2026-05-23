/**
 * CoinGecko API service — ported from RN coingeckoService.ts
 * Fetches live prices for portfolio tokens using free /simple/price endpoint.
 */

import { TOKENS, type LivePrices, type PriceData } from '@/lib/wallet-data';
import { apiDefaults } from "@rp-wallet/config";

function buildIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of TOKENS) {
    if (token.coingeckoId) {
      map[token.symbol] = token.coingeckoId;
    }
  }
  return map;
}

function buildReverseIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of TOKENS) {
    if (token.coingeckoId) {
      map[token.coingeckoId] = token.symbol;
    }
  }
  return map;
}

export async function fetchLivePrices(
  symbols?: string[],
  apiKey?: string,
  currency?: string,
  customMappings?: Record<string, string>
): Promise<LivePrices> {
  let url = `${apiDefaults.localBaseUrl}/prices`;
  const params = new URLSearchParams();

  if (symbols && symbols.length > 0) {
    const symbolsWithIds = symbols.map(s => {
      if (customMappings && customMappings[s]) {
        return `${s}:${customMappings[s]}`;
      }
      return s;
    });
    params.set('symbols', symbolsWithIds.join(','));
  }

  if (currency) {
    params.set('currency', currency.toLowerCase());
  }
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-custom-cg-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Local API proxy error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data as LivePrices;
}

export function getStaticPriceData(symbol: string): PriceData {
  const token = TOKENS.find((t) => t.symbol === symbol);
  return {
    usd: token?.price ?? 0,
    usd_24h_change: 0,
  };
}

export function getStaticPrices(): LivePrices {
  const prices: LivePrices = {};
  for (const token of TOKENS) {
    prices[token.symbol] = {
      usd: token.price,
      usd_24h_change: 0,
    };
  }
  return prices;
}

export interface TrendingToken {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  image: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
}

export async function fetchTrendingSolanaTokens(limit: number = 10, currency?: string): Promise<TrendingToken[]> {
  try {
    let url = `${apiDefaults.localBaseUrl}/trending?limit=${limit}`;
    if (currency) {
      url += `&currency=${currency.toLowerCase()}`;
    }
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[CoinGecko] Trending Proxy error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return data.map((coin: any, index: number) => ({
      id: coin.id,
      rank: index + 1,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase() ?? '',
      image: coin.image ? `https://api.phantom.app/image-proxy/?image=${encodeURIComponent(coin.image)}&anim=false&fit=cover&width=128&height=128` : '',
      marketCap: coin.market_cap ?? 0,
      price: coin.current_price ?? 0,
      priceChange24h: coin.price_change_percentage_24h ?? 0,
    }));
  } catch (error) {
    console.error('[CoinGecko] Error fetching trending Solana tokens via proxy:', error);
    return [];
  }
}
