import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import type { LicenseActivationRequest, WalletBootstrapExchangeRequest, WalletLaunchRequest } from "@rp-wallet/auth";
import type {
  CreateWalletTransactionResponse,
  CreateWalletTransactionsBatchRequest,
  CreateWalletTransactionRequest,
  HubSessionResponse,
  TriggerWalletNotificationRequest,
  UpdateWalletNotificationSettingsRequest,
  UpdateWalletStateRequest,
  WalletAppId,
  WalletBootstrapPayload,
} from "@rp-wallet/types";
import { walletRegistry } from "@rp-wallet/wallet-core";
import type { ApiEnv } from "./env";
import { getAllowedOrigins } from "./env";
import { DeviceLimitError, InvalidLicenseError, getPlatformStore } from "./platform-store";

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

type SellAuthPlan = {
  id: "starter" | "popular" | "yearly";
  label: string;
  durationDays: number;
  allowedDevices: number;
};

const SELLAUTH_PLANS: Record<string, SellAuthPlan> = {
  starter: { id: "starter", label: "Starter", durationDays: 7, allowedDevices: 1 },
  popular: { id: "popular", label: "Most Popular", durationDays: 30, allowedDevices: 1 },
  monthly: { id: "popular", label: "Most Popular", durationDays: 30, allowedDevices: 1 },
  yearly: { id: "yearly", label: "Yearly Access", durationDays: 365, allowedDevices: 2 },
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

app.post("/webhooks/sellauth", async (c) => {
  const secret = c.env.SELLAUTH_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[sellauth-webhook] SELLAUTH_WEBHOOK_SECRET is not set");
    return c.text("Server misconfiguration", 500);
  }

  const rawBody = await c.req.text();
  const signature =
    c.req.header("x-signature") ||
    c.req.header("x-sellauth-signature") ||
    c.req.header("signature") ||
    "";

  if (!signature) {
    return c.text("Missing signature", 401);
  }

  if (!(await verifySellAuthSignature(rawBody, signature, secret))) {
    return c.text("Invalid signature", 403);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return c.text("Invalid JSON", 400);
  }

  const expectedShopId = c.env.SELLAUTH_SHOP_ID || c.env.NEXT_PUBLIC_SELLAUTH_SHOP_ID;
  const payloadShopId = payload.shop_id ?? payload.shopId ?? payload.data?.shop_id ?? payload.data?.shopId;
  if (expectedShopId && payloadShopId?.toString() !== expectedShopId.toString()) {
    console.warn(`[sellauth-webhook] Shop ID mismatch. Expected ${expectedShopId}, received ${payloadShopId}`);
    return c.text("Invalid shop ID", 403);
  }

  const orderId = extractSellAuthOrderId(payload);
  if (!orderId) {
    console.error("[sellauth-webhook] Missing order id in payload");
    return c.text("Missing order id", 400);
  }

  const plan = resolveSellAuthPlan(c.env, payload);
  const licenseKey = await generateLicenseKeyForOrder(orderId, secret);
  const now = Date.now();
  const expiresAt = new Date(now + plan.durationDays * 24 * 60 * 60 * 1000);
  const buyerEmail = extractSellAuthEmail(payload);

  await getPlatformStore(c.env.DATABASE_URL).createPurchasedLicense({
    licenseKey,
    email: buyerEmail,
    plan: plan.label,
    expiresAt,
    allowedDevices: plan.allowedDevices,
  });

  console.log(`[sellauth-webhook] Created license for order ${orderId} | plan=${plan.id} | expires=${expiresAt.toISOString()}`);
  return c.text(licenseKey, 200, { "Content-Type": "text/plain" });
});

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
    const limit = Math.max(1, Math.min(50, Number.parseInt(c.req.query("limit") || "10", 10) || 10));
    const boostsResponse = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
      headers: { Accept: "application/json" },
    });

    if (!boostsResponse.ok) {
      return c.json({ error: "Failed to fetch trending" }, boostsResponse.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const boosts = (await boostsResponse.json()) as Array<{ chainId?: string; tokenAddress?: string }>;
    const solanaAddresses = Array.from(
      new Set(boosts.filter((boost) => boost.chainId === "solana" && boost.tokenAddress).map((boost) => boost.tokenAddress as string)),
    ).slice(0, limit);

    if (solanaAddresses.length === 0) {
      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return c.json([]);
    }

    const tokensResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${solanaAddresses.join(",")}`, {
      headers: { Accept: "application/json" },
    });

    if (!tokensResponse.ok) {
      return c.json({ error: "Failed to fetch token details" }, tokensResponse.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const tokensData = (await tokensResponse.json()) as {
      pairs?: Array<{
        baseToken?: { address?: string; name?: string; symbol?: string };
        fdv?: number;
        info?: { imageUrl?: string };
        marketCap?: number;
        priceChange?: { h24?: number };
        priceUsd?: string;
      }>;
    };
    const seen = new Set<string>();
    const data = [];

    for (const pair of tokensData.pairs || []) {
      const address = pair.baseToken?.address;
      if (!address || seen.has(address)) continue;
      seen.add(address);
      data.push({
        current_price: Number.parseFloat(pair.priceUsd || "0") || 0,
        id: address,
        image: pair.info?.imageUrl || "",
        market_cap: pair.marketCap || pair.fdv || 0,
        name: pair.baseToken?.name || pair.baseToken?.symbol || "Unknown",
        price_change_percentage_24h: pair.priceChange?.h24 || 0,
        symbol: pair.baseToken?.symbol || "",
      });
      if (data.length >= limit) break;
    }

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

  let response;
  try {
    response = await getPlatformStore(c.env.DATABASE_URL).activateLicense(body);
  } catch (error) {
    if (error instanceof DeviceLimitError) {
      return c.json({ code: "DEVICE_LIMIT_REACHED", error: error.message }, 403);
    }
    if (error instanceof InvalidLicenseError) {
      return c.json({ code: "INVALID_LICENSE", error: error.message }, 401);
    }
    throw error;
  }

  setSessionCookie(c, response.session.id, response.session.expiresAt, getSessionCookieName(c));

  return c.json(applyWalletAvailabilityToHubSession(c.env, response));
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

  return c.json(applyWalletAvailabilityToHubSession(c.env, response));
});

app.post("/wallet-launch", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<WalletLaunchRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);

  if (!wallet?.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
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

  let response;
  try {
    response = await getPlatformStore(c.env.DATABASE_URL).exchangeWalletBootstrap(body);
  } catch (error) {
    if (error instanceof DeviceLimitError) {
      return c.json({ code: "DEVICE_LIMIT_REACHED", error: error.message }, 403);
    }
    throw error;
  }

  if (!response) {
    return c.json({ error: "Launch token is invalid or expired" }, 401);
  }

  setSessionCookie(c, response.sessionId, response.payload.license.expiresAt, getSessionCookieName(c));

  return c.json(applyWalletAvailabilityToPayload(c.env, response.payload));
});

app.get("/wallet-state/:walletAppId", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.param("walletAppId") as WalletAppId;
  const wallet = getConfiguredWallet(c.env, walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).getWalletState(sessionId, walletAppId);
  if (!response) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.get("/wallet-events", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  const wallet = walletAppId ? getConfiguredWallet(c.env, walletAppId) : null;
  if (!walletAppId || !wallet) {
    return c.json({ error: "walletAppId is required" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
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
  const wallet = walletAppId ? getConfiguredWallet(c.env, walletAppId) : null;
  if (!walletAppId || !wallet) {
    return c.json({ error: "walletAppId is required" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
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
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  try {
    const response = await getPlatformStore(c.env.DATABASE_URL).createWalletTransaction(sessionId, body);
    if (!response) {
      return c.json({ error: "Unable to create wallet transaction" }, 400);
    }

    return c.json(applyWalletAvailabilityToCreateTransactionResponse(c.env, response));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create wallet transaction";
    return c.json({ error: message }, 400);
  }
});

app.post("/wallet-transactions/batch", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<CreateWalletTransactionsBatchRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).createWalletTransactionsBatch(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to create wallet transactions" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.delete("/wallet-transactions/:transactionId", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  const wallet = walletAppId ? getConfiguredWallet(c.env, walletAppId) : null;
  if (!walletAppId || !wallet) {
    return c.json({ error: "walletAppId is required" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).deleteWalletTransaction(sessionId, walletAppId, c.req.param("transactionId"));
  if (!response) {
    return c.json({ error: "Unable to delete wallet transaction" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.delete("/wallet-transactions", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const walletAppId = c.req.query("walletAppId") as WalletAppId | undefined;
  const wallet = walletAppId ? getConfiguredWallet(c.env, walletAppId) : null;
  if (!walletAppId || !wallet) {
    return c.json({ error: "walletAppId is required" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).clearWalletTransactions(sessionId, walletAppId);
  if (!response) {
    return c.json({ error: "Unable to clear wallet transactions" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.put("/wallet-state", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<UpdateWalletStateRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).updateWalletState(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to update wallet state" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.put("/wallet-notification-settings", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<UpdateWalletNotificationSettingsRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).updateWalletNotificationSettings(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to update wallet notification settings" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.post("/wallet-notifications/trigger", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<TriggerWalletNotificationRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).triggerWalletNotification(sessionId, body.walletAppId, body.accountId);
  if (!response) {
    return c.json({ error: "Unable to trigger wallet notification" }, 400);
  }

  return c.json(response);
});

function getConfiguredWallet(env: ApiEnv, walletAppId: WalletAppId) {
  const wallet = walletRegistry[walletAppId];
  if (!wallet) return null;

  return {
    ...wallet,
    enabled: isWalletEnabled(env, walletAppId),
  };
}

function isWalletEnabled(env: ApiEnv, walletAppId: WalletAppId) {
  const raw = walletAppId === "phantom" ? env.PHANTOM_ENABLED : env.TRUST_ENABLED;
  return raw?.toLowerCase() !== "false";
}

function applyWalletAvailabilityToHubSession(env: ApiEnv, response: HubSessionResponse): HubSessionResponse {
  return {
    ...response,
    wallets: response.wallets.map((wallet) => ({
      ...wallet,
      enabled: isWalletEnabled(env, wallet.id),
    })),
  };
}

function applyWalletAvailabilityToPayload(env: ApiEnv, payload: WalletBootstrapPayload): WalletBootstrapPayload {
  return {
    ...payload,
    wallet: {
      ...payload.wallet,
      enabled: isWalletEnabled(env, payload.wallet.id),
    },
  };
}

function applyWalletAvailabilityToCreateTransactionResponse(env: ApiEnv, response: CreateWalletTransactionResponse): CreateWalletTransactionResponse {
  return {
    ...response,
    payload: applyWalletAvailabilityToPayload(env, response.payload),
  };
}

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

async function verifySellAuthSignature(rawBody: string, signature: string, secret: string) {
  const computed = await hmacSha256Hex(secret, rawBody);
  return timingSafeHexEqual(computed, signature);
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(signature));
}

function timingSafeHexEqual(leftHex: string, rightHex: string) {
  const left = hexToBytes(leftHex);
  const right = hexToBytes(rightHex);
  if (!left || !right || left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const normalized = hex.trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(normalized) || normalized.length % 2 !== 0) return null;

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

async function generateLicenseKeyForOrder(orderId: string, secret: string) {
  const digest = await hmacSha256Hex(secret, `license:${orderId}`);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letters = Array.from(hexToBytes(digest)!.slice(0, 20), (byte) => alphabet[byte % alphabet.length]);
  return [0, 5, 10, 15].map((start) => letters.slice(start, start + 5).join("")).join("-");
}

function extractSellAuthOrderId(payload: Record<string, any>) {
  return normalizePayloadString(
    payload.id ??
      payload.order_id ??
      payload.orderId ??
      payload.invoice_id ??
      payload.invoiceId ??
      payload.data?.id ??
      payload.data?.order_id ??
      payload.data?.orderId ??
      payload.data?.invoice_id ??
      payload.data?.invoiceId,
  );
}

function extractSellAuthEmail(payload: Record<string, any>) {
  return normalizePayloadString(
    payload.email ??
      payload.customer_email ??
      payload.buyer_email ??
      payload.data?.email ??
      payload.data?.customer_email ??
      payload.data?.buyer_email ??
      payload.customer?.email ??
      payload.buyer?.email,
  );
}

function resolveSellAuthPlan(env: ApiEnv, payload: Record<string, any>): SellAuthPlan {
  const planId = normalizePayloadString(
    payload.item?.custom_fields?.plan_id ??
      payload.custom_fields?.plan_id ??
      payload.metadata?.plan_id ??
      payload.data?.metadata?.plan_id,
  )?.toLowerCase();
  if (planId && SELLAUTH_PLANS[planId]) return SELLAUTH_PLANS[planId];

  const productId = normalizePayloadString(
    payload.product_id ??
      payload.productId ??
      payload.item?.product_id ??
      payload.item?.productId ??
      payload.data?.product_id ??
      payload.data?.productId ??
      payload.items?.[0]?.product_id ??
      payload.items?.[0]?.productId,
  );

  const productPlan = getSellAuthProductPlanMap(env)[productId || ""];
  if (productPlan) return productPlan;

  console.warn(`[sellauth-webhook] Unknown plan/product id: ${planId || productId || "missing"}. Falling back to starter.`);
  return SELLAUTH_PLANS.starter;
}

function getSellAuthProductPlanMap(env: ApiEnv) {
  const starter = env.SELLAUTH_STARTER_PRODUCT_ID || env.NEXT_PUBLIC_SELLAUTH_STARTER_PRODUCT_ID;
  const monthly = env.SELLAUTH_MONTHLY_PRODUCT_ID || env.NEXT_PUBLIC_SELLAUTH_MONTHLY_PRODUCT_ID;
  const yearly = env.SELLAUTH_YEARLY_PRODUCT_ID || env.NEXT_PUBLIC_SELLAUTH_YEARLY_PRODUCT_ID;

  return {
    ...(starter ? { [starter]: SELLAUTH_PLANS.starter } : {}),
    ...(monthly ? { [monthly]: SELLAUTH_PLANS.popular } : {}),
    ...(yearly ? { [yearly]: SELLAUTH_PLANS.yearly } : {}),
  };
}

function normalizePayloadString(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

export default app;
