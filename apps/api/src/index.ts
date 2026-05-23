import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import type { LicenseActivationRequest, WalletBootstrapExchangeRequest, WalletLaunchRequest } from "@rp-wallet/auth";
import type {
  CreateWalletTransactionsBatchRequest,
  CreateWalletTransactionRequest,
  TriggerWalletNotificationRequest,
  UpdateWalletNotificationSettingsRequest,
  UpdateWalletStateRequest,
  WalletAppId,
} from "@rp-wallet/types";
import { walletRegistry } from "@rp-wallet/wallet-core";
import type { ApiEnv } from "./env";
import { getAllowedOrigins } from "./env";
import { getPlatformStore } from "./platform-store";

const DEFAULT_SESSION_COOKIE = "rp_session";

type HonoEnv = {
  Bindings: ApiEnv;
};

type PriceEntry = {
  usd: number;
  usd_24h_change: number;
  image?: string;
};

const CG_BASE_URL = "https://api.coingecko.com/api/v3";
const TOKENS = [
  { symbol: "SOL", price: 130, coingeckoId: "solana" },
  { symbol: "USDT", price: 1, coingeckoId: "tether" },
  { symbol: "ETH", price: 1600, coingeckoId: "ethereum" },
  { symbol: "BTC", price: 83000, coingeckoId: "bitcoin" },
  { symbol: "SUI", price: 2.5, coingeckoId: "sui" },
  { symbol: "MATIC", price: 0.35, coingeckoId: "matic-network" },
  { symbol: "HYPE", price: 14, coingeckoId: "hyperliquid" },
  { symbol: "BNB", price: 590, coingeckoId: "binancecoin" },
  { symbol: "AVAX", price: 22, coingeckoId: "avalanche-2" },
  { symbol: "LINK", price: 12, coingeckoId: "chainlink" },
  { symbol: "UNI", price: 7, coingeckoId: "uniswap" },
  { symbol: "USDC", price: 1, coingeckoId: "usd-coin" },
  { symbol: "DOGE", price: 0.16, coingeckoId: "dogecoin" },
  { symbol: "MON", price: 1.5, coingeckoId: undefined },
] as const;
const CUSTOM_IMAGE_OVERRIDES: Record<string, string> = {
  AVAX: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Favalanchex%2Finfo%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  BNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  BTC: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fbitcoin%2Finfo%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  DOGE: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
  ETH: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fethereum%2Fassets%2F0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  LINK: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
  MATIC: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fwallet-asset.matic.network%2Fimg%2Ftokens%2Fmatic.svg&anim=false&fit=cover&width=128&height=128",
  MON: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fdhc7eusqrdwa0.cloudfront.net%2Fassets%2Fmonad.png&anim=false&fit=cover&width=128&height=128",
  SOL: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fsolana-labs%2Ftoken-list%40main%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  SUI: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fdhc7eusqrdwa0.cloudfront.net%2Fassets%2Fsui.png&anim=false&fit=cover&width=128&height=128",
  UNI: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fethereum%2Fassets%2F0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  USDC: "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fsolana-labs%2Ftoken-list%40main%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png&anim=false&fit=cover&width=128&height=128",
  USDT: "/tokens/usdt.webp",
};

const app = new Hono<HonoEnv>();

app.use("*", async (c, next) => {
  const middleware = cors({
    origin: getAllowedOrigins(c.env),
    credentials: true,
  });
  return middleware(c, next);
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "rp-wallet-api",
    storage: c.env.DATABASE_URL ? "neon" : "memory",
  }),
);

app.get("/prices", async (c) => {
  try {
    const symbolsParam = c.req.query("symbols");
    const currency = (c.req.query("currency") || "usd").toLowerCase();
    const customApiKey = c.req.header("x-custom-cg-api-key");

    const idMap = buildIdMap();
    let targetSymbols: string[] = [];
    let coinIdsToFetch: string[] = [];
    const symbolToId: Record<string, string> = {};

    if (symbolsParam) {
      const parts = symbolsParam.split(",");
      for (const part of parts) {
        if (part.includes(":")) {
          const [symbol, id] = part.split(":");
          if (!symbol || !id) continue;
          targetSymbols.push(symbol);
          coinIdsToFetch.push(id);
          symbolToId[symbol] = id;
        } else if (idMap[part]) {
          targetSymbols.push(part);
          coinIdsToFetch.push(idMap[part]);
          symbolToId[part] = idMap[part];
        }
      }
    } else {
      targetSymbols = Object.keys(idMap);
      coinIdsToFetch = targetSymbols.map((symbol) => idMap[symbol]);
      targetSymbols.forEach((symbol) => {
        symbolToId[symbol] = idMap[symbol];
      });
    }

    if (coinIdsToFetch.length === 0) {
      return c.json({});
    }

    const coinIds = Array.from(new Set(coinIdsToFetch)).join(",");
    const response = await fetch(`${CG_BASE_URL}/coins/markets?vs_currency=${currency}&ids=${coinIds}`, {
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": customApiKey || c.env.COINGECKO_API_KEY || "",
      },
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch from CoinGecko" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = (await response.json()) as Array<{
      id: string;
      current_price?: number;
      image?: string;
      price_change_percentage_24h?: number;
    }>;

    const prices: Record<string, PriceEntry> = {};
    const idToSymbols: Record<string, string[]> = {};
    for (const [symbol, id] of Object.entries(symbolToId)) {
      if (!idToSymbols[id]) idToSymbols[id] = [];
      idToSymbols[id].push(symbol);
    }

    for (const coin of data) {
      const symbols = idToSymbols[coin.id];
      if (!symbols) continue;

      for (const symbol of symbols) {
        prices[symbol] = {
          image:
            CUSTOM_IMAGE_OVERRIDES[symbol] ||
            (coin.image
              ? `https://api.phantom.app/image-proxy/?image=${encodeURIComponent(coin.image)}&anim=false&fit=cover&width=128&height=128`
              : undefined),
          usd: coin.current_price ?? 0,
          usd_24h_change: coin.price_change_percentage_24h ?? 0,
        };
      }
    }

    for (const token of TOKENS) {
      if (!CUSTOM_IMAGE_OVERRIDES[token.symbol]) continue;
      if (!prices[token.symbol]) {
        prices[token.symbol] = {
          usd: token.price,
          usd_24h_change: 0,
        };
      }
      prices[token.symbol].image = CUSTOM_IMAGE_OVERRIDES[token.symbol];
    }

    return c.json(prices);
  } catch (error) {
    console.error("[prices] Error fetching prices:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/trending", async (c) => {
  try {
    const limit = c.req.query("limit") || "10";
    const currency = (c.req.query("currency") || "usd").toLowerCase();

    const response = await fetch(
      `${CG_BASE_URL}/coins/markets?vs_currency=${currency}&category=solana-meme-coins&order=volume_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
      {
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": c.env.COINGECKO_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      return c.json({ error: "Failed to fetch trending from CoinGecko" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = await response.json();
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return c.json(data);
  } catch (error) {
    console.error("[trending] Error fetching trending:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/chart", async (c) => {
  try {
    const id = c.req.query("id");
    const symbol = c.req.query("symbol");
    const timeframe = c.req.query("timeframe") || "1D";
    const currency = (c.req.query("currency") || "usd").toLowerCase();
    const dsKey = c.req.query("dsKey");

    if (!symbol && !id) {
      return c.json({ error: "Missing symbol or id parameter" }, 400);
    }

    const coingeckoId = id || (symbol ? getCoingeckoId(symbol) : null);
    if (!coingeckoId) {
      return c.json({ error: "Unknown token" }, 400);
    }

    const isAddress = coingeckoId.length > 30 && !coingeckoId.includes(" ");

    if (isAddress) {
      try {
        const dsHeaders: Record<string, string> = {};
        if (dsKey) dsHeaders["X-API-KEY"] = dsKey;

        const dsResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${coingeckoId}`, { headers: dsHeaders });
        if (dsResponse.ok) {
          const dsData = await dsResponse.json() as {
            pairs?: Array<{
              priceUsd?: string;
              priceChange?: { h24?: string | number };
            }>;
          };
          if (dsData.pairs && dsData.pairs.length > 0) {
            const currentPrice = Number.parseFloat(dsData.pairs[0].priceUsd || "") || 1;
            const priceChange24h = Number.parseFloat(String(dsData.pairs[0].priceChange?.h24 || "")) || 0;

            const now = Date.now();
            const points = timeframe === "1H" ? 60 : timeframe === "1D" ? 24 : 100;
            const timeframeMs = timeframe === "1H" ? 60 * 60 * 1000 : timeframe === "1D" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
            const step = timeframeMs / points;

            let startPrice = currentPrice;
            if (timeframe === "1D" && priceChange24h) {
              startPrice = currentPrice / (1 + priceChange24h / 100);
            } else {
              startPrice = currentPrice * (1 + (Math.random() * 0.2 - 0.1));
            }

            const syntheticChart: [number, number][] = [];
            let currentSimPrice = startPrice;

            for (let i = points; i >= 0; i--) {
              if (i === 0) {
                syntheticChart.push([now, currentPrice]);
              } else {
                syntheticChart.push([now - i * step, currentSimPrice]);
                const progress = 1 - i / points;
                const targetWeight = progress * progress;
                const randomNoise = (Math.random() - 0.5) * 0.05 * currentSimPrice;
                currentSimPrice = currentSimPrice * (1 - targetWeight) + currentPrice * targetWeight + randomNoise;
                if (currentSimPrice < 0) currentSimPrice = currentPrice * 0.1;
              }
            }

            c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
            return c.json(syntheticChart);
          }
        }
      } catch (error) {
        console.error("[chart] DexScreener fetch failed", error);
      }

      return c.json([[Date.now(), 0], [Date.now(), 0]]);
    }

    let queryDays = "1";
    if (timeframe === "1H") queryDays = "1";
    else if (timeframe === "1D") queryDays = "1";
    else if (timeframe === "1W") queryDays = "7";
    else if (timeframe === "1M") queryDays = "30";
    else if (timeframe === "YTD") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
      queryDays = String(Math.ceil((Date.now() - startOfYear) / (1000 * 60 * 60 * 24)));
    } else if (timeframe === "ALL") {
      queryDays = "365";
    }

    const response = await fetch(`${CG_BASE_URL}/coins/${coingeckoId}/market_chart?vs_currency=${currency}&days=${queryDays}`, {
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": c.env.COINGECKO_API_KEY || "",
      },
    });

    if (!response.ok) {
      console.error(`[chart] CoinGecko chart error: ${response.status} ${response.statusText}`);
      return c.json({ error: "Failed to fetch chart data" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = await response.json() as { prices?: [number, number][] };
    let prices = data.prices || [];

    if (timeframe === "1H" && prices.length > 0) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      prices = prices.filter((point) => point[0] >= oneHourAgo);
    }

    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return c.json(prices);
  } catch (error) {
    console.error("[chart] Error fetching chart data:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/token-details", async (c) => {
  try {
    const id = c.req.query("id");
    const symbol = c.req.query("symbol");
    const currency = (c.req.query("currency") || "usd").toLowerCase();
    const dsKey = c.req.query("dsKey");

    if (!symbol && !id) {
      return c.json({ error: "Missing symbol or id parameter" }, 400);
    }

    const coingeckoId = id || (symbol ? getCoingeckoId(symbol) : null);
    if (!coingeckoId) {
      return c.json({ error: "Unknown token" }, 400);
    }

    const isAddress = coingeckoId.length > 30 && !coingeckoId.includes(" ");

    if (isAddress) {
      try {
        const dsHeaders: Record<string, string> = {};
        if (dsKey) dsHeaders["X-API-KEY"] = dsKey;

        const dsResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${coingeckoId}`, { headers: dsHeaders });
        if (dsResponse.ok) {
          const dsData = await dsResponse.json() as {
            pairs?: Array<{
              fdv?: number;
              volume?: { h24?: number };
            }>;
          };
          if (dsData.pairs && dsData.pairs.length > 0) {
            const pair = dsData.pairs[0];
            c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
            return c.json({
              marketCap: pair.fdv || 0,
              totalSupply: 0,
              circulatingSupply: 0,
              totalVolume: pair.volume?.h24 || 0,
              description: `Custom token imported via contract address ${coingeckoId}`,
            });
          }
        }
      } catch (error) {
        console.error("[token-details] DexScreener fetch failed", error);
      }

      return c.json({
        marketCap: 0,
        totalSupply: 0,
        circulatingSupply: 0,
        totalVolume: 0,
        description: `Custom token (${coingeckoId})`,
      });
    }

    const response = await fetch(
      `${CG_BASE_URL}/coins/${coingeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": c.env.COINGECKO_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      return c.json({ error: "Failed to fetch token details" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = await response.json() as {
      market_data?: {
        market_cap?: Record<string, number>;
        total_supply?: number;
        circulating_supply?: number;
        total_volume?: Record<string, number>;
      };
      description?: { en?: string };
    };

    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return c.json({
      marketCap: data.market_data?.market_cap?.[currency] || data.market_data?.market_cap?.usd || 0,
      totalSupply: data.market_data?.total_supply || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalVolume: data.market_data?.total_volume?.[currency] || data.market_data?.total_volume?.usd || 0,
      description: data.description?.en || "",
    });
  } catch (error) {
    console.error("[token-details] Error fetching token details:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post("/auth/license/activate", async (c) => {
  const body = await c.req.json<LicenseActivationRequest>();

  if (!body.licenseKey?.trim() || !body.deviceId?.trim()) {
    return c.json({ error: "licenseKey and deviceId are required" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).activateLicense(body);
  setSessionCookie(c, response.session.id, response.session.expiresAt, getSessionCookieName(c));

  return c.json(response);
});

app.get("/me", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).getHubSession(sessionId);
  if (!response) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(response);
});

app.post("/wallet-launch", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<WalletLaunchRequest>();
  const wallet = walletRegistry[body.walletAppId];

  if (!wallet?.enabled) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const launchToken = await getPlatformStore(c.env.DATABASE_URL).createWalletLaunch({
    sessionId,
    walletAppId: body.walletAppId,
  });

  if (!launchToken) {
    return c.json({ error: "Unable to create wallet launch token" }, 401);
  }

  return c.json({
    walletAppId: body.walletAppId,
    launchUrl: buildLaunchUrl(c.env, body.walletAppId, launchToken.token, body.returnTo),
    expiresAt: launchToken.expiresAt,
  });
});

app.post("/wallet-bootstrap/exchange", async (c) => {
  const body = await c.req.json<WalletBootstrapExchangeRequest>();

  if (!body.token?.trim() || !body.deviceId?.trim()) {
    return c.json({ error: "token and deviceId are required" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).exchangeWalletBootstrap(body);

  if (!response) {
    return c.json({ error: "Launch token is invalid or expired" }, 401);
  }

  setSessionCookie(c, response.sessionId, response.payload.license.expiresAt, getSessionCookieName(c));

  return c.json(response.payload);
});

app.get("/wallet-state/:walletAppId", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.param("walletAppId") as WalletAppId;
  if (!walletRegistry[walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).getWalletState(sessionId, walletAppId);
  if (!response) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(response);
});

app.get("/wallet-events", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  if (!walletAppId || !walletRegistry[walletAppId]) {
    return c.json({ error: "walletAppId is required" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).getWalletEvents(sessionId, walletAppId, c.req.query("after"));
  if (!response) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(response);
});

app.get("/wallet-transactions", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  if (!walletAppId || !walletRegistry[walletAppId]) {
    return c.json({ error: "walletAppId is required" }, 400);
  }

  const transactions = await getPlatformStore(c.env.DATABASE_URL).getWalletTransactions(sessionId, walletAppId);
  if (!transactions) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(transactions);
});

app.post("/wallet-transactions", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<CreateWalletTransactionRequest>();
  if (!walletRegistry[body.walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).createWalletTransaction(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to create wallet transaction" }, 400);
  }

  return c.json(response);
});

app.post("/wallet-transactions/batch", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<CreateWalletTransactionsBatchRequest>();
  if (!walletRegistry[body.walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).createWalletTransactionsBatch(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to create wallet transactions" }, 400);
  }

  return c.json(response);
});

app.delete("/wallet-transactions/:transactionId", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  if (!walletAppId || !walletRegistry[walletAppId]) {
    return c.json({ error: "walletAppId is required" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).deleteWalletTransaction(sessionId, walletAppId, c.req.param("transactionId"));
  if (!response) {
    return c.json({ error: "Unable to delete wallet transaction" }, 400);
  }

  return c.json(response);
});

app.delete("/wallet-transactions", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  if (!walletAppId || !walletRegistry[walletAppId]) {
    return c.json({ error: "walletAppId is required" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).clearWalletTransactions(sessionId, walletAppId);
  if (!response) {
    return c.json({ error: "Unable to clear wallet transactions" }, 400);
  }

  return c.json(response);
});

app.put("/wallet-state", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<UpdateWalletStateRequest>();
  if (!walletRegistry[body.walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).updateWalletState(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to update wallet state" }, 400);
  }

  return c.json(response);
});

app.put("/wallet-notification-settings", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<UpdateWalletNotificationSettingsRequest>();
  if (!walletRegistry[body.walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).updateWalletNotificationSettings(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to update wallet notification settings" }, 400);
  }

  return c.json(response);
});

app.post("/wallet-notifications/trigger", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<TriggerWalletNotificationRequest>();
  if (!walletRegistry[body.walletAppId]) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).triggerWalletNotification(sessionId, body.walletAppId, body.accountId);
  if (!response) {
    return c.json({ error: "Unable to trigger wallet notification" }, 400);
  }

  return c.json(response);
});

function setSessionCookie(c: Context<HonoEnv>, sessionId: string, expiresAt: string, name: string) {
  setCookie(c, name, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

function buildIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of TOKENS) {
    if (token.coingeckoId) {
      map[token.symbol] = token.coingeckoId;
    }
  }
  return map;
}

function getCoingeckoId(symbol: string): string | null {
  const token = TOKENS.find((item) => item.symbol === symbol);
  return token?.coingeckoId ?? null;
}

function getSessionCookieName(c: Context<HonoEnv>) {
  return c.env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE;
}

function buildLaunchUrl(env: ApiEnv, walletAppId: WalletAppId, token: string, returnTo?: string) {
  const defaultOrigin = walletAppId === "phantom" ? env.PHANTOM_ORIGIN || "http://localhost:5173" : env.TRUST_ORIGIN || "http://localhost:5174";
  const target = returnTo?.trim() || `${defaultOrigin}/bootstrap`;
  const url = new URL(target);
  url.searchParams.set("token", token);
  return url.toString();
}

export default app;
