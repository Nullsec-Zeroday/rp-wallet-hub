import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import type { DemoActivationRequest, LicenseActivationRequest, WalletBootstrapExchangeRequest, WalletLaunchRequest } from "@rp-wallet/auth";
import type {
  CreateWalletTransactionResponse,
  CreateWalletAccountRequest,
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
import { getReferralBonusDays } from "@rp-wallet/config";
import type { ApiEnv } from "./env";
import { getAllowedOrigins } from "./env";
import { DemoDeviceUsedError, DemoUnavailableError, DeviceLimitError, InvalidLicenseError, getPlatformStore, isSupportTicketStatus, isSupportTicketType } from "./platform-store";
import type { AffiliateAttributionSummary, AffiliateConversionSummary, AffiliateSummary, PaymentOrderSummary, PlatformStore } from "./platform-store";
import {
  PAYBLIS_WEBHOOK_MAX_BYTES,
  buildPayblisCheckoutUrl,
  isFulfilledPayblisStatus,
  parsePayblisWebhook,
  payblisAmountMatches,
  payblisCurrencyMatches,
  verifyPayblisSignature,
} from "./payblis";
import { createReferralToken, verifyReferralToken } from "./referral-token";

const DEFAULT_SESSION_COOKIE = "rp_session";
const AFFILIATE_SESSION_COOKIE = "rp_affiliate_session";

type HonoEnv = {
  Bindings: ApiEnv;
};

type PriceEntry = {
  usd: number;
  usd_24h_change: number;
  image?: string;
};

type CoinGeckoSearchCoin = {
  id?: string;
  large?: string;
  market_cap_rank?: number | null;
  name?: string;
  symbol?: string;
  thumb?: string;
};

type DexScreenerPair = {
  baseToken?: {
    name?: string;
    symbol?: string;
  };
  chainId?: string;
  info?: {
    imageUrl?: string;
  };
  priceUsd?: string;
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

type PaymentPlan = SellAuthPlan & {
  priceAmount: string;
};

const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  starter: { ...SELLAUTH_PLANS.starter, priceAmount: "14.00" },
  popular: { ...SELLAUTH_PLANS.popular, priceAmount: "39.00" },
  yearly: { ...SELLAUTH_PLANS.yearly, priceAmount: "99.00" },
};
const EMAIL_FROM = "RPWallet <noreply@rpwallet.app>";

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

app.get("/search", async (c) => {
  const query = c.req.query("query")?.trim();
  const dsKey = c.req.query("dsKey");

  if (!query) {
    return c.json({ error: "Query parameter is required" }, 400);
  }

  const isAddress = query.length > 30 && !query.includes(" ");

  if (isAddress) {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (dsKey) headers["X-API-KEY"] = dsKey;

      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(query)}`, { headers });
      if (response.ok) {
        const data = await response.json() as { pairs?: DexScreenerPair[] };
        const pair = data.pairs?.[0];
        if (pair?.baseToken?.name && pair.baseToken.symbol) {
          const image = pair.info?.imageUrl || "";
          return c.json([{
            id: query,
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol.toUpperCase(),
            market_cap_rank: null,
            thumb: image,
            large: image,
            chainId: pair.chainId || "",
          }]);
        }
      }
    } catch (error) {
      console.error("[search] DexScreener search failed", error);
    }
  }

  try {
    const response = await fetch(`${CG_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": c.env.COINGECKO_API_KEY || "",
      },
    });

    if (!response.ok) {
      console.error(`[search] CoinGecko error: ${response.status} ${response.statusText}`);
      return c.json({ error: "Failed to fetch token search results" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = await response.json() as { coins?: CoinGeckoSearchCoin[] };
    return c.json((data.coins || []).slice(0, 20).flatMap((coin) => {
      if (!coin.id || !coin.name || !coin.symbol) return [];
      return [{
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        market_cap_rank: coin.market_cap_rank ?? null,
        thumb: coin.thumb || "",
        large: coin.large || "",
      }];
    }));
  } catch (error) {
    console.error("[search] Error fetching token search results", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/token-info", async (c) => {
  const id = c.req.query("id")?.trim();
  const dsKey = c.req.query("dsKey");

  if (!id) {
    return c.json({ error: "ID parameter is required" }, 400);
  }

  const isAddress = id.length > 30 && !id.includes(" ");

  if (isAddress) {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (dsKey) headers["X-API-KEY"] = dsKey;

      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(id)}`, { headers });
      if (response.ok) {
        const data = await response.json() as { pairs?: DexScreenerPair[] };
        const pair = data.pairs?.[0];
        if (pair?.baseToken?.name && pair.baseToken.symbol) {
          return c.json({
            symbol: pair.baseToken.symbol.toUpperCase(),
            name: pair.baseToken.name,
            price: Number.parseFloat(pair.priceUsd || "0") || 0,
            decimals: 18,
            defaultBalance: 0,
            color: "#888888",
            icon: "",
            logoUrl: pair.info?.imageUrl || "",
            coingeckoId: id,
            chainId: pair.chainId || "",
          });
        }
      }
    } catch (error) {
      console.error("[token-info] DexScreener lookup failed", error);
    }
  }

  try {
    const response = await fetch(
      `${CG_BASE_URL}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": c.env.COINGECKO_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      console.error(`[token-info] CoinGecko error: ${response.status} ${response.statusText}`);
      return c.json({ error: "Failed to fetch token information" }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    const data = await response.json() as {
      id?: string;
      image?: { large?: string; small?: string };
      market_data?: { current_price?: { usd?: number } };
      name?: string;
      symbol?: string;
    };

    if (!data.id || !data.name || !data.symbol) {
      return c.json({ error: "Invalid token information response" }, 502);
    }

    return c.json({
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price: data.market_data?.current_price?.usd || 0,
      decimals: 18,
      defaultBalance: 0,
      color: "#888888",
      icon: "",
      logoUrl: data.image?.large || data.image?.small || "",
      coingeckoId: data.id,
    });
  } catch (error) {
    console.error("[token-info] Error fetching token information", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/demo/config", (c) => c.json(getDemoConfig(c.env)));

app.get("/affiliate/redirect/:code", async (c) => {
  const affiliateCode = c.req.param("code");
  const hubUrl = new URL("/", getPublicHubOrigin(c.env));
  const userAgent = c.req.header("user-agent") || "";
  if (isLinkPreviewBot(userAgent)) return c.redirect(hubUrl.toString(), 302);
  const requestedVisitorId = normalizeBoundedString(c.req.query("v"), 64);
  const visitorId = requestedVisitorId && /^afv_[a-f0-9]{18}$/.test(requestedVisitorId)
    ? requestedVisitorId
    : createReferralVisitorId();

  const store = getPlatformStore(c.env.DATABASE_URL);
  const result = await store.recordAffiliateClick({
    affiliateCode,
    visitorId,
    landingPath: `/r/${encodeURIComponent(affiliateCode)}`,
    referrer: normalizeBoundedString(c.req.header("referer"), 2048),
    source: inferReferralSource(c.req.header("referer") || "", userAgent),
    userAgent,
    ipAddress: getClientIp(c),
  });
  const trustedAttribution = result.click ? await store.getAffiliateAttributionByClickId(result.click.id) : null;
  const referralToken = result.accepted && result.click && result.attribution && trustedAttribution
    ? await issueReferralToken(c.env, result.click.id, result.attribution.expiresAt)
    : null;
  if (referralToken) hubUrl.searchParams.set("rid", referralToken);
  return c.redirect(hubUrl.toString(), 302);
});

app.post("/affiliate/click", async (c) => {
  const body = await c.req.json<{
    affiliateCode?: string;
    visitorId?: string;
    landingPath?: string;
    referrer?: string;
    source?: string;
  }>();

  if (!body.affiliateCode?.trim() || !body.visitorId?.trim() || !/^afv_[a-f0-9]{18}$/.test(body.visitorId.trim())) {
    return c.json({ accepted: false });
  }

  const store = getPlatformStore(c.env.DATABASE_URL);
  const result = await store.recordAffiliateClick({
    affiliateCode: body.affiliateCode,
    visitorId: body.visitorId,
    landingPath: normalizeBoundedString(body.landingPath, 2048) || "/",
    referrer: normalizeBoundedString(body.referrer, 2048),
    source: normalizeBoundedString(body.source, 64),
    userAgent: c.req.header("user-agent") || undefined,
    ipAddress: getClientIp(c),
  });

  const trustedAttribution = result.click ? await store.getAffiliateAttributionByClickId(result.click.id) : null;
  const referralToken = result.accepted && result.click && result.attribution && trustedAttribution
    ? await issueReferralToken(c.env, result.click.id, result.attribution.expiresAt)
    : null;
  return c.json({
    ...result,
    attribution: result.attribution && trustedAttribution
      ? { ...result.attribution, affiliateDisplayName: trustedAttribution.affiliateDisplayName }
      : result.attribution,
    referralToken: referralToken || undefined,
    claimCode: referralToken ? result.click?.id : undefined,
  });
});

app.post("/affiliate/claim", async (c) => {
  const body = await c.req.json<{ referralToken?: string; claimCode?: string }>();
  let referralToken = normalizeBoundedString(body.referralToken, 1024);
  let attribution = referralToken
    ? await resolveReferralToken(getPlatformStore(c.env.DATABASE_URL), c.env, referralToken)
    : null;

  const claimCode = normalizeBoundedString(body.claimCode, 64);
  if (!attribution && claimCode && /^afc_[a-f0-9]{18}$/.test(claimCode)) {
    attribution = await getPlatformStore(c.env.DATABASE_URL).getAffiliateAttributionByClickId(claimCode);
    referralToken = attribution ? await issueReferralToken(c.env, attribution.clickId, attribution.expiresAt) || undefined : undefined;
  }
  if (!attribution || !referralToken) return c.json({ accepted: false });

  return c.json({
    accepted: true,
    attribution: {
      ...attribution,
      referralToken,
      claimCode: attribution.clickId,
    },
  });
});

app.post("/affiliate/recover", async (c) => {
  const body = await c.req.json<{ email?: string; visitorId?: string; landingPath?: string }>();
  const email = normalizePayloadString(body.email)?.toLowerCase();
  const visitorId = normalizePayloadString(body.visitorId);
  if (!email || !isValidEmail(email) || !visitorId || !/^afv_[a-f0-9]{18}$/.test(visitorId)) {
    return c.json({ accepted: false });
  }

  const store = getPlatformStore(c.env.DATABASE_URL);
  const recovered = await store.getAffiliateAttributionByBuyerEmail(email);
  if (!recovered) return c.json({ accepted: false });
  const result = await store.recordAffiliateClick({
    affiliateCode: recovered.affiliateCode,
    visitorId,
    landingPath: normalizeBoundedString(body.landingPath, 2048) || "/buy",
    source: "email_recovery",
    userAgent: c.req.header("user-agent") || undefined,
    ipAddress: getClientIp(c),
  });
  const trusted = result.click ? await store.getAffiliateAttributionByClickId(result.click.id) : null;
  const referralToken = result.accepted && result.click && result.attribution && trusted
    ? await issueReferralToken(c.env, result.click.id, result.attribution.expiresAt)
    : null;
  if (!referralToken || !result.click || !result.attribution || !trusted) return c.json({ accepted: false });
  return c.json({
    accepted: true,
    referralToken,
    claimCode: result.click.id,
    attribution: {
      affiliateCode: trusted.affiliateCode,
      affiliateDisplayName: trusted.affiliateDisplayName,
      clickId: trusted.clickId,
      expiresAt: trusted.expiresAt,
    },
  });
});

app.post("/affiliate/checkout-intent", async (c) => {
  const body = await c.req.json<{
    referralToken?: string;
    plan?: string;
    productId?: string | number;
    variantId?: string | number;
    buyerEmail?: string;
  }>();

  if (!body.referralToken?.trim() || !body.plan?.trim()) {
    return c.json({ accepted: false });
  }

  const store = getPlatformStore(c.env.DATABASE_URL);
  const attribution = await resolveReferralToken(store, c.env, body.referralToken);
  if (!attribution) return c.json({ accepted: false });

  const result = await store.createAffiliateCheckoutIntent({
    affiliateCode: attribution.affiliateCode,
    visitorId: attribution.visitorId,
    clickId: attribution.clickId,
    plan: body.plan,
    productId: body.productId?.toString(),
    variantId: body.variantId?.toString(),
    buyerEmail: body.buyerEmail,
  });

  return c.json(result);
});

app.post("/affiliate/auth/request", async (c) => {
  const body = await c.req.json<{ email?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email) return c.json({ ok: true });

  const result = await getPlatformStore(c.env.DATABASE_URL).createAffiliateMagicLink(email);
  if (result.accepted && result.token && result.affiliate) {
    c.executionCtx.waitUntil(
      sendAffiliateMagicLinkEmail(c.env, {
        affiliateName: result.affiliate.displayName,
        loginUrl: buildAffiliateLoginUrl(c.env, result.token),
        to: email,
      }).catch((error) => {
        console.error("[affiliate-auth] Magic link email failed", error);
      }),
    );
  }

  return c.json({ ok: true });
});

app.post("/affiliate/auth/verify", async (c) => {
  const body = await c.req.json<{ token?: string }>();
  if (!body.token?.trim()) return c.json({ error: "token is required" }, 400);

  const result = await getPlatformStore(c.env.DATABASE_URL).verifyAffiliateMagicLink(body.token);
  if (!result.accepted || !result.sessionId || !result.expiresAt || !result.affiliate) {
    return c.json({ error: "Invalid or expired login link" }, 401);
  }

  setSessionCookie(c, result.sessionId, result.expiresAt, AFFILIATE_SESSION_COOKIE);
  return c.json({ affiliate: result.affiliate });
});

app.get("/affiliate/me", async (c) => {
  const sessionId = getCookie(c, AFFILIATE_SESSION_COOKIE);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);

  const dashboard = await getPlatformStore(c.env.DATABASE_URL).getAffiliateDashboard(sessionId, getPublicHubOrigin(c.env));
  if (!dashboard) return c.json({ error: "Unauthorized" }, 401);
  return c.json(dashboard);
});

app.post("/affiliate/auth/logout", async (c) => {
  const sessionId = getCookie(c, AFFILIATE_SESSION_COOKIE);
  if (sessionId) await getPlatformStore(c.env.DATABASE_URL).revokeAffiliateSession(sessionId);
  setCookie(c, AFFILIATE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  return c.json({ ok: true });
});

app.get("/admin/affiliates", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  return c.json(await getPlatformStore(c.env.DATABASE_URL).getAffiliateAdminSnapshot());
});

app.post("/admin/affiliates", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{
    code?: string;
    displayName?: string;
    email?: string;
    commissionRate?: string;
    payoutInfoJson?: string;
  }>();

  if (!body.code?.trim()) return c.json({ error: "code is required" }, 400);

  const affiliate = await getPlatformStore(c.env.DATABASE_URL).createAffiliate({
    code: body.code,
    displayName: body.displayName || body.code,
    email: body.email,
    commissionRate: body.commissionRate,
    payoutInfoJson: body.payoutInfoJson,
  });
  return c.json(affiliate);
});

app.patch("/admin/affiliate-conversions/:id", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ status?: "pending" | "approved" | "rejected" | "paid" }>();
  if (!body.status || !["pending", "approved", "rejected", "paid"].includes(body.status)) {
    return c.json({ error: "Invalid conversion status" }, 400);
  }
  const conversion = await getPlatformStore(c.env.DATABASE_URL).updateAffiliateConversionStatus(c.req.param("id"), body.status);
  if (!conversion) return c.json({ error: "Conversion not found or status transition is not allowed" }, 409);
  return c.json({ conversion });
});

app.post("/admin/keys", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{
    email?: string;
    plan?: string;
    expiresAt?: string;
    durationDays?: number;
    allowedDevices?: number;
  }>();

  const plan = normalizePayloadString(body.plan) || "Most Popular";
  const expiresAt = resolveAdminLicenseExpiry(body);
  if (!expiresAt) return c.json({ error: "expiresAt or durationDays is required" }, 400);

  const licenseKey = generateRandomLicenseKey();
  const license = await getPlatformStore(c.env.DATABASE_URL).createPurchasedLicense({
    licenseKey,
    email: normalizePayloadString(body.email),
    plan,
    expiresAt,
    allowedDevices: getAdminAllowedDevices(plan, body.allowedDevices),
  });

  let emailSent = false;
  let emailError: string | undefined;
  const email = normalizePayloadString(body.email);
  if (email) {
    try {
      const result = await sendPurchaseEmail(c.env, {
        to: email,
        licenseKey,
        planLabel: plan,
        expirationDate: expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      });
      emailSent = Boolean(result?.id);
      if (!emailSent) emailError = "Email service is not configured.";
    } catch (error) {
      console.error("[admin-keys] License created, but delivery email failed", error);
      emailError = "The key was created, but the email could not be sent.";
    }
  }

  return c.json({
    license,
    licenseKey,
    emailSent,
    emailError,
  });
});

app.post("/admin/licenses/lookup", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ licenseKey?: string }>();
  const licenseKey = normalizePayloadString(body.licenseKey);
  if (!licenseKey) return c.json({ error: "licenseKey is required" }, 400);

  const snapshot = await getPlatformStore(c.env.DATABASE_URL).getAdminLicenseSnapshot(licenseKey);
  if (!snapshot) return c.json({ error: "License not found" }, 404);
  return c.json(snapshot);
});

app.get("/admin/licenses/unused", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const licenses = await getPlatformStore(c.env.DATABASE_URL).getAdminUnusedActiveLicenses();
  return c.json({ licenses });
});

app.post("/admin/licenses/send-reminder", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ licenseKey?: string }>();
  const licenseKey = normalizePayloadString(body.licenseKey);
  if (!licenseKey) return c.json({ error: "licenseKey is required" }, 400);

  const snapshot = await getPlatformStore(c.env.DATABASE_URL).getAdminLicenseSnapshot(licenseKey);
  if (!snapshot) return c.json({ error: "License not found" }, 404);
  if (!snapshot.license.email) return c.json({ error: "This license does not have an email address" }, 400);
  if (snapshot.license.status !== "active" || new Date(snapshot.license.expiresAt) <= new Date()) {
    return c.json({ error: "Only active, unexpired licenses can receive reminders" }, 400);
  }

  const result = await sendLicenseReminderEmail(c.env, {
    to: snapshot.license.email,
    licenseKey: snapshot.license.keyPlaintext || licenseKey,
    planLabel: snapshot.license.plan,
    expirationDate: new Date(snapshot.license.expiresAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  });

  return c.json({ ok: true, emailId: result?.id, to: snapshot.license.email });
});

app.post("/admin/licenses/clear-devices", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ licenseKey?: string }>();
  const licenseKey = normalizePayloadString(body.licenseKey);
  if (!licenseKey) return c.json({ error: "licenseKey is required" }, 400);

  const result = await getPlatformStore(c.env.DATABASE_URL).clearAdminLicenseDevices(licenseKey);
  if (!result) return c.json({ error: "License not found" }, 404);
  return c.json(result);
});

app.post("/admin/licenses/revoke-sessions", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ licenseKey?: string }>();
  const licenseKey = normalizePayloadString(body.licenseKey);
  if (!licenseKey) return c.json({ error: "licenseKey is required" }, 400);

  const result = await getPlatformStore(c.env.DATABASE_URL).revokeAdminLicenseSessions(licenseKey);
  if (!result) return c.json({ error: "License not found" }, 404);
  return c.json(result);
});

app.post("/admin/licenses/reset-access", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ licenseKey?: string }>();
  const licenseKey = normalizePayloadString(body.licenseKey);
  if (!licenseKey) return c.json({ error: "licenseKey is required" }, 400);

  const result = await getPlatformStore(c.env.DATABASE_URL).resetAdminLicenseAccess(licenseKey);
  if (!result) return c.json({ error: "License not found" }, 404);
  return c.json(result);
});

app.post("/support/tickets", async (c) => {
  const body = await c.req.json<{
    type?: string;
    email?: string;
    subject?: string;
    message?: string;
    orderId?: string;
    providerPaymentId?: string;
    transactionHash?: string;
    paymentCurrency?: string;
    amount?: string;
  }>();

  const type = normalizePayloadString(body.type);
  const email = normalizePayloadString(body.email)?.toLowerCase();
  const message = normalizePayloadString(body.message);

  if (!isSupportTicketType(type)) return c.json({ error: "type must be did_not_receive_key or bug" }, 400);
  if (!email || !isValidEmail(email)) return c.json({ error: "A valid email is required" }, 400);
  if (!message || message.length < 10) return c.json({ error: "Please describe the issue in at least 10 characters" }, 400);

  const ticket = await getPlatformStore(c.env.DATABASE_URL).createSupportTicket({
    type,
    email,
    subject: normalizePayloadString(body.subject),
    message: message.slice(0, 4000),
    orderId: normalizePayloadString(body.orderId),
    providerPaymentId: normalizePayloadString(body.providerPaymentId),
    transactionHash: normalizePayloadString(body.transactionHash),
    paymentCurrency: normalizePayloadString(body.paymentCurrency),
    amount: normalizePayloadString(body.amount),
  });

  return c.json({ ticket });
});

app.get("/admin/tickets", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const tickets = await getPlatformStore(c.env.DATABASE_URL).getAdminSupportTickets();
  return c.json({ tickets });
});

app.patch("/admin/tickets/:id", async (c) => {
  if (!isAffiliateAdminRequest(c)) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string; adminNotes?: string }>();
  const status = normalizePayloadString(body.status);

  if (status && !isSupportTicketStatus(status)) return c.json({ error: "Invalid ticket status" }, 400);

  const ticket = await getPlatformStore(c.env.DATABASE_URL).updateAdminSupportTicket(id, {
    status: status && isSupportTicketStatus(status) ? status : undefined,
    adminNotes: body.adminNotes === undefined ? undefined : normalizePayloadString(body.adminNotes) || "",
  });
  if (!ticket) return c.json({ error: "Ticket not found" }, 404);
  return c.json({ ticket });
});

app.post("/payments/nowpayments/checkout", async (c) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    if (!c.env.NOWPAYMENTS_API_KEY) {
      console.error("[nowpayments-checkout] NOWPAYMENTS_API_KEY is not set", { requestId });
      return c.json({ error: "Payment provider is not configured", requestId }, 503);
    }

    const body = await c.req.json<{
      planId?: string;
      email?: string;
      referralToken?: string;
    }>();
    const planId = normalizePayloadString(body.planId)?.toLowerCase();
    const email = normalizePayloadString(body.email)?.toLowerCase();
    const plan = planId ? PAYMENT_PLANS[planId] : undefined;

    console.log("[nowpayments-checkout] Request received", {
      requestId,
      planId: planId || null,
      hasEmail: Boolean(email),
      emailDomain: email?.split("@")[1] || null,
      hasReferralToken: Boolean(body.referralToken),
      storage: c.env.DATABASE_URL ? "neon" : "memory",
    });

    if (!plan) return c.json({ error: "Invalid plan", requestId }, 400);
    if (!email || !isValidEmail(email)) return c.json({ error: "A valid email address is required", requestId }, 400);

    const store = getPlatformStore(c.env.DATABASE_URL);
    const referralAttribution = body.referralToken
      ? await resolveReferralToken(store, c.env, body.referralToken)
      : null;
    const emailAttribution = referralAttribution
      ? null
      : await store.getAffiliateAttributionByBuyerEmail(email);
    const affiliateIntent = referralAttribution
      ? await store.createAffiliateCheckoutIntent({
          affiliateCode: referralAttribution.affiliateCode,
          visitorId: referralAttribution.visitorId,
          clickId: referralAttribution.clickId,
          plan: plan.id,
          buyerEmail: email,
        })
      : null;
    const trustedAttribution: { attribution: AffiliateAttributionSummary; intent: { id: string }; source: "current" | "email" } | null =
      affiliateIntent?.accepted && affiliateIntent.intent
        ? { attribution: referralAttribution!, intent: affiliateIntent.intent, source: "current" }
        : emailAttribution
          ? { attribution: emailAttribution, intent: { id: emailAttribution.checkoutIntentId }, source: "email" }
          : null;
    const referralBonusDays = referralAttribution || emailAttribution ? getReferralBonusDays(plan.id) : 0;
    const priceAmount = plan.priceAmount;
    console.log("[nowpayments-checkout] Creating payment order", { requestId, planId: plan.id });
    const order = await store.createPaymentOrder({
      provider: "nowpayments",
      email,
      planId: plan.id,
      planLabel: plan.label,
      priceAmount,
      priceCurrency: "USD",
      durationDays: plan.durationDays + referralBonusDays,
      allowedDevices: plan.allowedDevices,
      affiliateCode: trustedAttribution?.attribution.affiliateCode,
      affiliateCheckoutIntentId: trustedAttribution?.intent.id,
      affiliateVisitorId: trustedAttribution?.attribution.visitorId,
      affiliateClickId: trustedAttribution?.attribution.clickId,
    });
    console.log("[nowpayments-checkout] Payment order created", {
      requestId,
      orderId: order.id,
      referralBonusDays,
      referralSource: trustedAttribution?.source || null,
    });

    const apiOrigin = new URL(c.req.url).origin;
    const hubOrigin = c.env.HUB_ORIGIN || "http://localhost:3000";
    console.log("[nowpayments-checkout] Creating NOWPayments invoice", {
      requestId,
      orderId: order.id,
      amount: priceAmount,
      callbackOrigin: apiOrigin,
    });
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": c.env.NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify({
        price_amount: Number(priceAmount),
        price_currency: "usd",
        order_id: order.id,
        order_description: `RPWallet ${plan.label}`,
        ipn_callback_url: `${apiOrigin}/webhooks/nowpayments`,
        success_url: `${hubOrigin.replace(/\/+$/, "")}/payment/success`,
        cancel_url: `${hubOrigin.replace(/\/+$/, "")}/payment/cancelled`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, any>;
    const invoiceUrl = normalizePayloadString(payload.invoice_url);
    const invoiceId = normalizePayloadString(payload.id);
    console.log("[nowpayments-checkout] NOWPayments responded", {
      requestId,
      orderId: order.id,
      status: response.status,
      hasInvoiceId: Boolean(invoiceId),
      hasInvoiceUrl: Boolean(invoiceUrl),
    });
    if (!response.ok || !invoiceUrl || !invoiceId) {
      console.error("[nowpayments-checkout] Invoice creation failed", {
        requestId,
        orderId: order.id,
        status: response.status,
        error: normalizePayloadString(payload.message ?? payload.error),
      });
      await store.updatePaymentOrderStatus(order.id, "invoice_failed");
      return c.json({ error: "Unable to create payment invoice", requestId }, 502);
    }

    await store.updatePaymentOrderProvider(order.id, invoiceId, "waiting");
    console.log("[nowpayments-checkout] Checkout ready", { requestId, orderId: order.id, invoiceId });
    return c.json({ checkoutUrl: invoiceUrl, orderId: order.id });
  } catch (error) {
    console.error("[nowpayments-checkout] Unhandled checkout failure", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json({ error: "Checkout initialization failed", requestId }, 500);
  }
});

app.post("/webhooks/nowpayments", handleNowPaymentsWebhook);
app.post("/api/webhooks/nowpayments", handleNowPaymentsWebhook);

async function handleNowPaymentsWebhook(c: Context<HonoEnv>) {
  const secret = c.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("[nowpayments-webhook] NOWPAYMENTS_IPN_SECRET is not set");
    return c.text("Server misconfiguration", 500);
  }

  const rawBody = await c.req.text();
  const signature = c.req.header("x-nowpayments-sig") || "";
  if (!signature) return c.text("Missing signature", 401);

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return c.text("Invalid JSON", 400);
  }

  if (!(await verifyNowPaymentsSignature(payload, signature, secret))) {
    console.warn("[nowpayments-webhook] Signature verification failed");
    return c.text("Invalid signature", 403);
  }

  const orderId = normalizePayloadString(payload.order_id);
  const paymentStatus = normalizePayloadString(payload.payment_status)?.toLowerCase();
  // Note: an expired/failed invoice that was never paid can arrive with no
  // payment_id and no price_amount, so those are validated only on the fulfillment
  // path below — otherwise the failed/expired notification email never fires.
  if (!orderId || !paymentStatus) return c.text("Missing payment fields", 400);

  const store = getPlatformStore(c.env.DATABASE_URL);
  const order = await store.getPaymentOrder(orderId);
  if (!order || order.provider !== "nowpayments") return c.text("Unknown order", 404);
  if (order.licenseId) {
    await ensureAffiliateConversion(c, order, {
      paymentId: order.providerPaymentId || order.id,
      providerLabel: "nowpayments",
      licenseId: order.licenseId,
    });
    return c.text("OK");
  }

  if (!isFulfilledNowPaymentsStatus(paymentStatus)) {
    // `order.status` is the pre-update value; use it to fire the email only on the
    // first transition into failed/expired, so nowpayments retries don't re-send.
    const isNewStatus = order.status !== paymentStatus;
    await store.updatePaymentOrderStatus(order.id, paymentStatus);
    if (isNewStatus && order.email && (paymentStatus === "failed" || paymentStatus === "expired")) {
      c.executionCtx.waitUntil(
        sendPaymentFailedEmail(c.env, {
          to: order.email,
          planLabel: order.planLabel,
          reason: paymentStatus,
        }).catch((error) => {
          console.error("[nowpayments-webhook] Payment-failed email failed", error);
        }),
      );
    }
    return c.text("OK");
  }

  // Fulfillment path: now the payment id and amount must be present and valid.
  const paymentId = normalizePayloadString(payload.payment_id ?? payload.invoice_id);
  if (!paymentId) return c.text("Missing payment fields", 400);

  const priceAmount = Number(payload.price_amount);
  const priceCurrency = normalizePayloadString(payload.price_currency)?.toUpperCase();
  if (!Number.isFinite(priceAmount) || priceAmount !== Number(order.priceAmount) || priceCurrency !== order.priceCurrency) {
    console.warn("[nowpayments-webhook] Order amount mismatch", {
      orderId,
      expectedAmount: order.priceAmount,
      receivedAmount: payload.price_amount,
      expectedCurrency: order.priceCurrency,
      receivedCurrency: payload.price_currency,
    });
    return c.text("Order amount mismatch", 409);
  }

  await fulfillPaidOrder(c, order, { paymentId, providerLabel: "nowpayments", licenseSecret: secret });
  return c.text("OK");
}

// Provider-agnostic fulfillment: create the license, mark the order complete, and
// fire the purchase email + affiliate conversion. Shared by every payment provider
// (NOWPayments, Payblis) so fulfillment stays identical across them. Idempotent —
// `completePaymentOrder` only returns true on the first successful transition.
async function fulfillPaidOrder(
  c: Context<HonoEnv>,
  order: PaymentOrderSummary,
  options: { paymentId: string; providerLabel: string; licenseSecret: string },
) {
  const { paymentId, providerLabel, licenseSecret } = options;
  const store = getPlatformStore(c.env.DATABASE_URL);
  const licenseKey = await generateLicenseKeyForOrder(order.id, licenseSecret);
  const expiresAt = new Date(Date.now() + order.durationDays * 24 * 60 * 60 * 1000);
  const license = await store.createPurchasedLicense({
    licenseKey,
    email: order.email,
    plan: order.planLabel,
    expiresAt,
    allowedDevices: order.allowedDevices,
  });
  const newlyCompleted = await store.completePaymentOrder(order.id, paymentId, license.id);
  if (!newlyCompleted) {
    const completedOrder = await store.getPaymentOrder(order.id);
    if (completedOrder?.licenseId) {
      await ensureAffiliateConversion(c, completedOrder, {
        paymentId: completedOrder.providerPaymentId || paymentId,
        providerLabel,
        licenseId: completedOrder.licenseId,
      });
    }
    return;
  }

  const affiliateConversion = await ensureAffiliateConversion(c, order, {
    paymentId,
    providerLabel,
    licenseId: license.id,
  });

  c.executionCtx.waitUntil(
    Promise.all([
      sendPurchaseEmail(c.env, {
        expirationDate: expiresAt.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        licenseKey,
        planLabel: order.planLabel,
        referralBonusDays: Math.max(0, order.durationDays - (PAYMENT_PLANS[order.planId]?.durationDays || order.durationDays)),
        to: order.email,
      }),
      affiliateConversion ? notifyReferralConversion(c.env, affiliateConversion) : Promise.resolve(),
    ]).catch((error) => {
      console.error(`[${providerLabel}-webhook] Post-fulfillment task failed`, error);
    }),
  );

  console.log(`[${providerLabel}-webhook] Created license for order ${order.id}`);
}

async function ensureAffiliateConversion(
  c: Context<HonoEnv>,
  order: PaymentOrderSummary,
  options: { paymentId: string; providerLabel: string; licenseId: string },
) {
  if (!order.affiliateCode && !order.affiliateCheckoutIntentId) return null;

  // Await the durable conversion before acknowledging the webhook. Provider
  // retries revisit this idempotent key if the first database write fails.
  const result = await getPlatformStore(c.env.DATABASE_URL).createAffiliateConversion({
    affiliateCode: order.affiliateCode,
    checkoutIntentId: order.affiliateCheckoutIntentId,
    sellauthOrderId: `${options.providerLabel}:${options.paymentId}`,
    licenseId: options.licenseId,
    buyerEmail: order.email,
    plan: order.planLabel,
    amount: order.priceAmount,
    currency: order.priceCurrency,
  });
  if (!result.accepted) {
    console.warn(`[${options.providerLabel}-webhook] Affiliate conversion rejected`, { orderId: order.id });
  }
  return result;
}

function isFulfilledNowPaymentsStatus(status: string) {
  return status === "finished";
}

// ── P A Y B L I S  ( C A R D )  C H E C K O U T ──
// Card payments via Payblis run through the same order/fulfillment model as
// NOWPayments: create a payment order, redirect the buyer to Payblis' hosted
// checkout, then verify the IPN webhook and fulfill via `fulfillPaidOrder`.
app.post("/payments/payblis/checkout", async (c) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    // Keep webhook processing active for existing orders while preventing new
    // Payblis checkouts during provider incidents.
    if (c.env.PAYBLIS_CHECKOUT_ENABLED !== "true") {
      console.warn("[payblis-checkout] Card checkout is temporarily disabled", { requestId });
      return c.json({ error: "Card payments are temporarily unavailable. Please pay with crypto.", requestId }, 503);
    }

    if (!c.env.PAYBLIS_MERCHANT_KEY || !c.env.PAYBLIS_SECRET_KEY) {
      console.error("[payblis-checkout] PAYBLIS_MERCHANT_KEY/PAYBLIS_SECRET_KEY is not set", { requestId });
      return c.json({ error: "Payment provider is not configured", requestId }, 503);
    }

    const body = await c.req.json<{
      planId?: string;
      email?: string;
      referralToken?: string;
    }>();
    const planId = normalizePayloadString(body.planId)?.toLowerCase();
    const email = normalizePayloadString(body.email)?.toLowerCase();
    const plan = planId ? PAYMENT_PLANS[planId] : undefined;

    console.log("[payblis-checkout] Request received", {
      requestId,
      planId: planId || null,
      hasEmail: Boolean(email),
      emailDomain: email?.split("@")[1] || null,
      hasReferralToken: Boolean(body.referralToken),
      storage: c.env.DATABASE_URL ? "neon" : "memory",
    });

    if (!plan) return c.json({ error: "Invalid plan", requestId }, 400);
    if (!email || !isValidEmail(email)) return c.json({ error: "A valid email address is required", requestId }, 400);

    const store = getPlatformStore(c.env.DATABASE_URL);
    const referralAttribution = body.referralToken
      ? await resolveReferralToken(store, c.env, body.referralToken)
      : null;
    const emailAttribution = referralAttribution
      ? null
      : await store.getAffiliateAttributionByBuyerEmail(email);
    const affiliateIntent = referralAttribution
      ? await store.createAffiliateCheckoutIntent({
          affiliateCode: referralAttribution.affiliateCode,
          visitorId: referralAttribution.visitorId,
          clickId: referralAttribution.clickId,
          plan: plan.id,
          buyerEmail: email,
        })
      : null;
    const trustedAttribution: { attribution: AffiliateAttributionSummary; intent: { id: string }; source: "current" | "email" } | null =
      affiliateIntent?.accepted && affiliateIntent.intent
        ? { attribution: referralAttribution!, intent: affiliateIntent.intent, source: "current" }
        : emailAttribution
          ? { attribution: emailAttribution, intent: { id: emailAttribution.checkoutIntentId }, source: "email" }
          : null;
    const referralBonusDays = referralAttribution || emailAttribution ? getReferralBonusDays(plan.id) : 0;
    const priceAmount = plan.priceAmount;
    console.log("[payblis-checkout] Creating payment order", { requestId, planId: plan.id });
    const order = await store.createPaymentOrder({
      provider: "payblis",
      email,
      planId: plan.id,
      planLabel: plan.label,
      priceAmount,
      priceCurrency: "USD",
      durationDays: plan.durationDays + referralBonusDays,
      allowedDevices: plan.allowedDevices,
      affiliateCode: trustedAttribution?.attribution.affiliateCode,
      affiliateCheckoutIntentId: trustedAttribution?.intent.id,
      affiliateVisitorId: trustedAttribution?.attribution.visitorId,
      affiliateClickId: trustedAttribution?.attribution.clickId,
    });
    console.log("[payblis-checkout] Payment order created", {
      requestId,
      orderId: order.id,
      referralBonusDays,
      referralSource: trustedAttribution?.source || null,
    });

    const apiOrigin = new URL(c.req.url).origin;
    // Allows pointing the IPN callback at a tunnel/staging host during testing; in
    // production this is unset and the IPN uses the request origin.
    const ipnOrigin = (c.env.PAYBLIS_IPN_ORIGIN || apiOrigin).replace(/\/+$/, "");
    const hubOrigin = (c.env.HUB_ORIGIN || "http://localhost:3000").replace(/\/+$/, "");
    const emailLocalPart = email.split("@")[0] || "Customer";
    const requestCountry = (c.req.raw as unknown as { cf?: { country?: string } }).cf?.country;
    const checkoutUrl = buildPayblisCheckoutUrl({
      merchantKey: c.env.PAYBLIS_MERCHANT_KEY,
      sandbox: c.env.PAYBLIS_SANDBOX === "true",
      amount: priceAmount,
      currency: "USD",
      productName: `RPWallet ${plan.label}`,
      storeName: "RPWallet",
      refOrder: order.id,
      customerEmail: email,
      customerName: emailLocalPart,
      customerFirstName: emailLocalPart,
      country: requestCountry || "US",
      userIP: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0",
      lang: "en",
      urlOK: `${hubOrigin}/buy?payment=success`,
      urlKO: `${hubOrigin}/buy?payment=cancelled`,
      ipnURL: `${ipnOrigin}/webhooks/payblis`,
    });

    await store.updatePaymentOrderProvider(order.id, order.id, "waiting");
    console.log("[payblis-checkout] Checkout ready", { requestId, orderId: order.id });
    return c.json({ checkoutUrl, orderId: order.id });
  } catch (error) {
    console.error("[payblis-checkout] Unhandled checkout failure", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json({ error: "Checkout initialization failed", requestId }, 500);
  }
});

app.post("/webhooks/payblis", handlePayblisWebhook);
app.post("/api/webhooks/payblis", handlePayblisWebhook);

async function handlePayblisWebhook(c: Context<HonoEnv>) {
  const secret = c.env.PAYBLIS_SECRET_KEY;
  if (!secret) {
    console.error("[payblis-webhook] PAYBLIS_SECRET_KEY is not set");
    return c.text("Server misconfiguration", 500);
  }

  const rawBody = await c.req.text();
  if (new TextEncoder().encode(rawBody).length > PAYBLIS_WEBHOOK_MAX_BYTES) {
    return c.text("Payload too large", 413);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return c.text("Invalid JSON", 400);
    payload = parsed as Record<string, unknown>;
  } catch {
    return c.text("Invalid JSON", 400);
  }

  const signature = c.req.header("x-payblis-signature") || normalizePayloadString(payload.signature) || "";
  if (!signature) return c.text("Missing signature", 401);
  if (!(await verifyPayblisSignature(rawBody, payload, signature, secret))) {
    console.warn("[payblis-webhook] Signature verification failed");
    return c.text("Invalid signature", 403);
  }

  const parsedWebhook = parsePayblisWebhook(payload);
  if (!parsedWebhook.ok) {
    console.warn("[payblis-webhook] Invalid notification", { reason: parsedWebhook.error });
    return c.text(parsedWebhook.error, 400);
  }
  const { orderId, status, event, paymentId, amount, currency } = parsedWebhook.webhook;
  console.log("[payblis-webhook] Verified notification", {
    orderId,
    status,
    event: event || null,
    hasTransactionId: Boolean(paymentId),
  });

  const store = getPlatformStore(c.env.DATABASE_URL);
  const order = await store.getPaymentOrder(orderId);
  if (!order || order.provider !== "payblis") return c.text("Unknown order", 404);
  if (order.licenseId) {
    await ensureAffiliateConversion(c, order, {
      paymentId: order.providerPaymentId || paymentId || order.id,
      providerLabel: "payblis",
      licenseId: order.licenseId,
    });
    return c.text("OK");
  }

  if (!isFulfilledPayblisStatus(status)) {
    const normalizedStatus = status.toLowerCase();
    const isNewStatus = order.status !== normalizedStatus;
    await store.updatePaymentOrderStatus(order.id, normalizedStatus);
    if (isNewStatus && order.email && status === "FAILED") {
      c.executionCtx.waitUntil(
        sendPaymentFailedEmail(c.env, {
          to: order.email,
          planLabel: order.planLabel,
          reason: "failed",
        }).catch((error) => {
          console.error("[payblis-webhook] Payment-failed email failed", error);
        }),
      );
    }
    return c.text("OK");
  }

  // Fulfillment path: validate the amount before issuing a license.
  if (!paymentId) return c.text("Missing transaction ID", 400);
  if (!payblisAmountMatches(order.priceAmount, amount)) {
    console.warn("[payblis-webhook] Order amount mismatch", {
      orderId,
      expectedAmount: order.priceAmount,
      receivedAmount: amount,
    });
    return c.text("Order amount mismatch", 409);
  }
  if (!payblisCurrencyMatches(order.priceCurrency, currency)) {
    console.warn("[payblis-webhook] Order currency mismatch", {
      orderId,
      expectedCurrency: order.priceCurrency,
      receivedCurrency: currency,
    });
    return c.text("Order currency mismatch", 409);
  }

  await fulfillPaidOrder(c, order, { paymentId, providerLabel: "payblis", licenseSecret: secret });
  return c.text("OK");
}

app.post("/webhooks/sellauth", handleSellAuthWebhook);
app.post("/api/webhooks/sellauth", handleSellAuthWebhook);

async function handleSellAuthWebhook(c: Context<HonoEnv>) {
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
    console.warn("[sellauth-webhook] Signature verification failed", {
      bodyLength: rawBody.length,
      contentType: c.req.header("content-type") || null,
      hasIdempotencyKey: Boolean(c.req.header("idempotency-key")),
      hasTimestamp: Boolean(c.req.header("x-timestamp")),
      path: new URL(c.req.url).pathname,
      ...await buildSellAuthSignatureDiagnostics(rawBody, signature, secret),
    });
    return c.text("Invalid signature", 403);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody) as Record<string, any>;
  } catch {
    return c.text("Invalid JSON", 400);
  }

  const event = normalizePayloadString(payload.event)?.toUpperCase();
  if (event && event !== "INVOICE.ITEM.DELIVER-DYNAMIC") {
    return c.text("Ignored");
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
  const store = getPlatformStore(c.env.DATABASE_URL);
  const licenseKey = await generateLicenseKeyForOrder(orderId, secret);
  const buyerEmail = extractSellAuthEmail(payload);
  const emailAttribution = buyerEmail
    ? await store.getAffiliateAttributionByBuyerEmail(buyerEmail)
    : null;
  const referralBonusDays = emailAttribution ? getReferralBonusDays(plan.id) : 0;
  const now = Date.now();
  const expiresAt = new Date(now + (plan.durationDays + referralBonusDays) * 24 * 60 * 60 * 1000);

  const license = await store.createPurchasedLicense({
    licenseKey,
    email: buyerEmail,
    plan: plan.label,
    expiresAt,
    allowedDevices: plan.allowedDevices,
  });

  c.executionCtx.waitUntil(
    store
      .createAffiliateConversion({
        affiliateCode: extractSellAuthAffiliateCode(payload) || emailAttribution?.affiliateCode,
        checkoutIntentId: emailAttribution?.checkoutIntentId,
        sellauthOrderId: orderId,
        licenseId: license.id,
        buyerEmail,
        plan: plan.label,
        amount: extractSellAuthAmount(payload),
        currency: extractSellAuthCurrency(payload),
        productId: extractSellAuthProductId(payload),
        variantId: extractSellAuthVariantId(payload),
      })
      .then((result) => notifyReferralConversion(c.env, result))
      .catch((error) => {
        console.error("[sellauth-webhook] Affiliate conversion recording failed", error);
      }),
  );

  console.log(`[sellauth-webhook] Created license for order ${orderId} | plan=${plan.id} | expires=${expiresAt.toISOString()}`);
  if (buyerEmail) {
    c.executionCtx.waitUntil(
      sendPurchaseEmail(c.env, {
        expirationDate: expiresAt.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        licenseKey,
        planLabel: plan.label,
        to: buyerEmail,
      }).catch((error) => {
        console.error("[sellauth-webhook] Email send failed", error);
      }),
    );
  } else {
    console.warn("[sellauth-webhook] No buyer email found in payload; skipping email notification");
  }

  return c.text(licenseKey, 200, { "Content-Type": "text/plain" });
}

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
    else if (timeframe === "1Y") queryDays = "365";
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
      categories?: string[];
      coingecko_rank?: number;
      market_data?: {
        market_cap?: Record<string, number>;
        total_supply?: number;
        circulating_supply?: number;
        total_volume?: Record<string, number>;
      };
      description?: { en?: string };
      genesis_date?: string | null;
      links?: {
        homepage?: string[];
        repos_url?: { github?: string[] };
        subreddit_url?: string;
        twitter_screen_name?: string;
        whitepaper?: string;
      };
      sentiment_votes_down_percentage?: number;
      sentiment_votes_up_percentage?: number;
    };

    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return c.json({
      categories: data.categories || [],
      coingeckoRank: data.coingecko_rank || null,
      marketCap: data.market_data?.market_cap?.[currency] || data.market_data?.market_cap?.usd || 0,
      totalSupply: data.market_data?.total_supply || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalVolume: data.market_data?.total_volume?.[currency] || data.market_data?.total_volume?.usd || 0,
      description: data.description?.en || "",
      genesisDate: data.genesis_date || null,
      links: {
        github: data.links?.repos_url?.github?.find(Boolean) || "",
        reddit: data.links?.subreddit_url || "",
        twitter: data.links?.twitter_screen_name ? `https://x.com/${data.links.twitter_screen_name}` : "",
        website: data.links?.homepage?.find(Boolean) || "",
        whitepaper: data.links?.whitepaper || "",
      },
      sentimentVotesDownPercentage: data.sentiment_votes_down_percentage || 0,
      sentimentVotesUpPercentage: data.sentiment_votes_up_percentage || 0,
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

app.post("/demo/activate", async (c) => {
  const config = getDemoConfig(c.env);
  const body = await c.req.json<DemoActivationRequest>();

  if (!body.deviceId?.trim()) {
    return c.json({ error: "deviceId is required" }, 400);
  }

  let response;
  try {
    response = await getPlatformStore(c.env.DATABASE_URL).activateDemo({ deviceId: body.deviceId }, config);
  } catch (error) {
    if (error instanceof DemoDeviceUsedError) {
      return c.json({ code: "DEMO_DEVICE_USED", error: error.message }, 403);
    }
    if (error instanceof DemoUnavailableError) {
      return c.json({ code: "DEMO_UNAVAILABLE", error: error.message }, 403);
    }
    throw error;
  }

  setSessionCookie(c, response.session.id, response.session.expiresAt, getSessionCookieName(c));
  return c.json(applyWalletAvailabilityToHubSession(c.env, response));
});

app.post("/auth/logout", (c) => {
  const cookieName = getSessionCookieName(c);
  setCookie(c, cookieName, "", {
    httpOnly: true,
    ...getSessionCookieSecurity(c),
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  return c.json({ ok: true });
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
  const hubSession = await getPlatformStore(c.env.DATABASE_URL).getHubSession(sessionId);
  if (!hubSession) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (hubSession.access?.kind === "demo" && body.walletAppId !== "phantom") {
    return c.json({ error: "Demo mode only includes Ph4ntom." }, 403);
  }

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
    launchUrl: buildLaunchUrl(c.env, body.walletAppId, launchToken.token, body.returnTo, body.deviceId),
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

app.post("/wallet-accounts", async (c) => {
  const sessionId = getCookie(c, getSessionCookieName(c));
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<CreateWalletAccountRequest>();
  const wallet = getConfiguredWallet(c.env, body.walletAppId);
  if (!wallet) {
    return c.json({ error: "Unknown wallet app" }, 400);
  }
  if (!wallet.enabled) {
    return c.json({ error: "Wallet app is disabled" }, 400);
  }

  const response = await getPlatformStore(c.env.DATABASE_URL).createWalletAccount(sessionId, body);
  if (!response) {
    return c.json({ error: "Unable to create wallet account" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
});

app.delete("/wallet-accounts/:accountId", async (c) => {
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

  const response = await getPlatformStore(c.env.DATABASE_URL).deleteWalletAccount(sessionId, walletAppId, c.req.param("accountId"));
  if (!response) {
    return c.json({ error: "Unable to delete wallet account" }, 400);
  }

  return c.json(applyWalletAvailabilityToPayload(c.env, response));
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
  const wallets = response.access?.kind === "demo"
    ? response.wallets.filter((wallet) => wallet.id === "phantom")
    : response.wallets;

  return {
    ...response,
    wallets: wallets.map((wallet) => ({
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
    ...getSessionCookieSecurity(c),
    path: "/",
    expires: new Date(expiresAt),
  });
}

function getSessionCookieSecurity(c: Context<HonoEnv>) {
  const isHttps = new URL(c.req.url).protocol === "https:";
  return isHttps
    ? { secure: true, sameSite: "None" as const }
    : { secure: false, sameSite: "Lax" as const };
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

function buildLaunchUrl(env: ApiEnv, walletAppId: WalletAppId, token: string, returnTo?: string, deviceId?: string) {
  const defaultOrigin = walletAppId === "phantom" ? env.PHANTOM_ORIGIN || "http://localhost:5173" : env.TRUST_ORIGIN || "http://localhost:5174";
  const target = returnTo?.trim() || `${defaultOrigin}/bootstrap`;
  const url = new URL(target);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/") || "/";
  url.searchParams.set("token", token);
  if (deviceId?.trim()) url.searchParams.set("deviceId", deviceId.trim());
  return url.toString();
}

async function verifySellAuthSignature(rawBody: string, signature: string, secret: string) {
  const normalizedSignature = normalizeSignature(signature);
  if (!normalizedSignature) return false;

  const rawComputed = await hmacSha256Hex(secret, rawBody);
  if (timingSafeHexEqual(rawComputed, normalizedSignature)) return true;

  const canonicalBody = canonicalizeJsonString(rawBody);
  if (!canonicalBody || canonicalBody === rawBody) return false;

  const canonicalComputed = await hmacSha256Hex(secret, canonicalBody);
  return timingSafeHexEqual(canonicalComputed, normalizedSignature);
}

async function buildSellAuthSignatureDiagnostics(rawBody: string, signature: string, secret: string) {
  const normalizedSignature = normalizeSignature(signature);
  const rawComputed = await hmacSha256Hex(secret, rawBody);
  const canonicalBody = canonicalizeJsonString(rawBody);
  const canonicalComputed = canonicalBody && canonicalBody !== rawBody ? await hmacSha256Hex(secret, canonicalBody) : null;

  return {
    rawComputedPreview: rawComputed.slice(0, 12),
    canonicalComputedPreview: canonicalComputed?.slice(0, 12) || null,
    signatureIsHex: /^[a-f0-9]+$/i.test(normalizedSignature),
    signatureLength: normalizedSignature.length,
    signaturePreview: normalizedSignature.slice(0, 12),
    secretHasOuterWhitespace: secret.trim() !== secret,
  };
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

async function hmacSha512Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(signature));
}

async function verifyNowPaymentsSignature(payload: Record<string, any>, signature: string, secret: string) {
  const canonicalPayload = JSON.stringify(sortObjectKeys(payload));
  const computed = await hmacSha512Hex(secret, canonicalPayload);
  return timingSafeHexEqual(computed, normalizeSignature(signature));
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
      return result;
    }, {});
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

function normalizeSignature(signature: string) {
  return signature.trim().toLowerCase().replace(/^sha256=/, "");
}

function canonicalizeJsonString(rawBody: string) {
  try {
    return JSON.stringify(JSON.parse(rawBody));
  } catch {
    return null;
  }
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

function generateRandomLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]);
  return [0, 5, 10, 15].map((start) => chars.slice(start, start + 5).join("")).join("-");
}

function resolveAdminLicenseExpiry(input: { expiresAt?: string; durationDays?: number }) {
  if (input.expiresAt) {
    const expiresAt = new Date(input.expiresAt);
    if (Number.isFinite(expiresAt.getTime()) && expiresAt > new Date()) return expiresAt;
    return null;
  }

  const durationDays = Number(input.durationDays);
  if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
}

function getAdminAllowedDevices(plan: string, requested?: number) {
  if (requested && Number.isFinite(requested) && requested > 0) return Math.floor(requested);
  return plan.toLowerCase().includes("year") ? 2 : 1;
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

function extractSellAuthAffiliateCode(payload: Record<string, any>) {
  return normalizePayloadString(
    payload.affiliate ??
      payload.affiliate_code ??
      payload.affiliateCode ??
      payload.affiliate_referrer_id ??
      payload.prefill_affiliate_referrer_id ??
      payload.data?.affiliate ??
      payload.data?.affiliate_code ??
      payload.data?.affiliateCode ??
      payload.data?.affiliate_referrer_id ??
      payload.data?.prefill_affiliate_referrer_id ??
      payload.invoice?.affiliate ??
      payload.invoice?.affiliate_code,
  )?.toLowerCase();
}

function extractSellAuthProductId(payload: Record<string, any>) {
  return normalizePayloadString(
    payload.product_id ??
      payload.productId ??
      payload.item?.product_id ??
      payload.item?.productId ??
      payload.data?.product_id ??
      payload.data?.productId ??
      payload.items?.[0]?.product_id ??
      payload.items?.[0]?.productId,
  );
}

function extractSellAuthVariantId(payload: Record<string, any>) {
  return normalizePayloadString(
    payload.variant_id ??
      payload.variantId ??
      payload.item?.variant_id ??
      payload.item?.variantId ??
      payload.data?.variant_id ??
      payload.data?.variantId ??
      payload.items?.[0]?.variant_id ??
      payload.items?.[0]?.variantId,
  );
}

function extractSellAuthAmount(payload: Record<string, any>) {
  const value =
    payload.paid ??
    payload.total ??
    payload.total_usd ??
    payload.item?.total_price ??
    payload.price ??
    payload.data?.paid ??
    payload.data?.total ??
    payload.data?.total_usd ??
    payload.data?.item?.total_price ??
    payload.data?.price ??
    payload.amount ??
    payload.data?.amount;
  if (value === undefined || value === null) return undefined;
  const normalized = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) ? normalized.toFixed(2) : undefined;
}

function extractSellAuthCurrency(payload: Record<string, any>) {
  return normalizePayloadString(payload.currency ?? payload.data?.currency)?.toUpperCase() || "USD";
}

async function sendPurchaseEmail(
  env: ApiEnv,
  params: {
    to: string;
    licenseKey: string;
    planLabel: string;
    expirationDate: string;
    referralBonusDays?: number;
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[sendPurchaseEmail] RESEND_API_KEY is not set; skipping email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildPurchaseEmailHtml(params),
      subject: `Your RPWallet License Key — ${params.planLabel}`,
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  return response.json<{ id?: string }>().catch((): { id?: string } => ({}));
}

async function sendLicenseReminderEmail(
  env: ApiEnv,
  params: {
    to: string;
    licenseKey: string;
    planLabel: string;
    expirationDate: string;
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[sendLicenseReminderEmail] RESEND_API_KEY is not set; skipping email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildLicenseReminderEmailHtml(params),
      subject: "Reminder: your RPWallet key is ready",
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  return response.json<{ id?: string }>().catch(() => undefined);
}

async function sendPaymentFailedEmail(
  env: ApiEnv,
  params: {
    to: string;
    planLabel: string;
    reason: "failed" | "expired";
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[sendPaymentFailedEmail] RESEND_API_KEY is not set; skipping email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildPaymentFailedEmailHtml(params),
      subject:
        params.reason === "expired"
          ? "Your RPWallet payment expired"
          : "Your RPWallet payment didn't go through",
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  return response.json<{ id?: string }>().catch(() => undefined);
}

async function sendAbandonedCheckoutEmail(
  env: ApiEnv,
  params: {
    to: string;
    planLabel: string;
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[sendAbandonedCheckoutEmail] RESEND_API_KEY is not set; skipping email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildAbandonedCheckoutEmailHtml(params),
      subject: `Still want ${params.planLabel}? Your RPWallet checkout is waiting`,
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  return response.json<{ id?: string }>().catch(() => undefined);
}

/** Fire a "your referral converted" email — only for freshly-recorded conversions. */
async function notifyReferralConversion(
  env: ApiEnv,
  result: { created?: boolean; affiliate?: AffiliateSummary; conversion?: AffiliateConversionSummary },
) {
  if (!result.created || !result.conversion || !result.affiliate?.email) return;
  await sendReferralConversionEmail(env, {
    to: result.affiliate.email,
    affiliateName: result.affiliate.displayName,
    plan: result.conversion.plan,
    amount: result.conversion.amount,
    currency: result.conversion.currency,
    commissionAmount: result.conversion.commissionAmount,
    commissionRate: result.conversion.commissionRate,
    buyerEmail: result.conversion.buyerEmail,
    dashboardUrl: getAffiliateOrigin(env),
  }).catch((error) => {
    console.error("[referral] Conversion email failed", error);
  });
}

async function sendReferralConversionEmail(
  env: ApiEnv,
  params: {
    to: string;
    affiliateName: string;
    plan: string;
    amount: string;
    currency: string;
    commissionAmount: string;
    commissionRate: string;
    buyerEmail?: string;
    dashboardUrl: string;
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[sendReferralConversionEmail] RESEND_API_KEY is not set; skipping email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildReferralConversionEmailHtml(params),
      subject: `You earned a commission — ${params.currency} ${params.commissionAmount}`,
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  return response.json<{ id?: string }>().catch(() => undefined);
}

/* Solo Leveling "System window" email theme — deep violet panels, lavender
   glow borders, mono System tags. Mirrors the marketing site redesign. */
const EMAIL_BRAND = {
  assetBase: "https://rpwallet.app/email",
  siteUrl: "https://rpwallet.app",
  telegramUrl: "https://t.me/RPWallet_support_bot",
  purple: "#c084fc",
  accent: "#8b5cf6",
  pageBg: "#0a0714",
  cardBg: "#150e2e",
  keyBg: "#0e0822",
  border: "rgba(139,92,246,0.28)",
  purpleBorder: "rgba(167,139,250,0.5)",
  fontStack: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  monoStack: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
  glassFill: "linear-gradient(180deg,rgba(46,30,90,0.55),rgba(19,12,42,0.85))",
  glassPurpleFill: "linear-gradient(180deg,rgba(139,92,246,0.22),rgba(88,52,180,0.08) 55%,rgba(139,92,246,0.12))",
  glassBorder: "rgba(139,92,246,0.35)",
  glassHighlight: "inset 0 1px 0 rgba(196,181,253,0.18),0 10px 30px rgba(0,0,0,0.4)",
  glassPurpleGlow: "inset 0 1px 0 rgba(196,181,253,0.25),0 0 0 1px rgba(139,92,246,0.15),0 14px 40px rgba(124,58,237,0.3)",
};

/** Mono "[ SYSTEM ]"-style eyebrow tag used above email headlines. */
function renderSystemTag(label: string) {
  const b = EMAIL_BRAND;
  return `<p style="margin:0 0 10px;color:${b.purple};font-family:${b.monoStack};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-align:center;">[ ${escapeHtml(label)} ]</p>`;
}

/** Natural aspect (w/h) of each email icon so we never squish. */
const EMAIL_ICON_ASPECT: Record<string, number> = {
  "key-icon.png": 240 / 237,
  "iphone-icon.png": 123 / 240,
  "download-icon.png": 228 / 240,
  "cart-icon.png": 240 / 234,
  "dollar-icon.png": 232 / 240,
};

/** Icon sized to a target HEIGHT, width derived from aspect (both attrs set for Outlook). */
function renderIcon(file: string, height: number, extraStyle = "") {
  const aspect = EMAIL_ICON_ASPECT[file] ?? 1;
  const width = Math.round(height * aspect);
  return `<img src="${EMAIL_BRAND.assetBase}/${file}" width="${width}" height="${height}" alt="" style="display:block;border:0;${extraStyle}" />`;
}

/** Fixed square System-window tile with an aspect-correct icon centered inside. */
function renderGlassIconTile(file: string, tile: number, iconHeight: number) {
  const b = EMAIL_BRAND;
  return `<table role="presentation" width="${tile}" height="${tile}" cellpadding="0" cellspacing="0" style="width:${tile}px;height:${tile}px;border-radius:8px;background:${b.cardBg};background-image:${b.glassFill};border:1px solid ${b.glassBorder};box-shadow:${b.glassHighlight};">
  <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon(file, iconHeight, "margin:0 auto;")}</td></tr>
</table>`;
}

/**
 * Shared email chrome: preheader, branded header (ghost mark + wordmark + gradient
 * rule), card wrapper, and footer. Body-specific markup is injected via `bodyHtml`.
 * Table-based so it survives Outlook/Gmail; all styling inline.
 */
function buildBrandEmailShell(opts: { preheader: string; bodyHtml: string }) {
  const b = EMAIL_BRAND;
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
  </head>
  <body style="margin:0;padding:0;background:${b.pageBg};color:#ffffff;font-family:${b.fontStack};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${b.pageBg};font-size:1px;line-height:1px;">
      ${escapeHtml(opts.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${b.pageBg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
            <tr>
              <td align="center" style="padding:8px 0 14px;">
                <img src="${b.assetBase}/logo-ghost.png" width="36" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:800;letter-spacing:0.01em;color:#ffffff;">RP<span style="color:${b.purple};">Wallet</span></span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 0 16px;">
                <span style="display:inline-block;padding:4px 14px;border:1px solid ${b.purpleBorder};border-radius:3px;background:${b.keyBg};color:${b.purple};font-family:${b.monoStack};font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;box-shadow:0 0 14px rgba(139,92,246,0.35);">System&nbsp;Message</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;background:${b.purpleBorder};background-image:linear-gradient(180deg,rgba(192,132,252,0.6),rgba(139,92,246,0.3) 45%,rgba(192,132,252,0.5));box-shadow:0 24px 70px rgba(0,0,0,0.55),0 0 44px rgba(124,58,237,0.22);">
                  <tr><td style="padding:1px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:11px;background:${b.cardBg};background-image:${b.glassFill};box-shadow:${b.glassHighlight};overflow:hidden;">
                      <tr><td style="padding:34px 30px 30px;">
                        ${opts.bodyHtml}
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:26px 20px 8px;">
                <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.5;">
                  Need help? <a href="${b.telegramUrl}" style="color:${b.purple};text-decoration:none;">Message us on Telegram</a>
                </p>
                <p style="margin:0;color:rgba(255,255,255,0.32);font-size:11px;line-height:1.5;">
                  &copy; RPWallet &middot; <a href="${b.siteUrl}" style="color:rgba(255,255,255,0.45);text-decoration:none;">rpwallet.app</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Angular System CTA button (table-based for Outlook). */
function renderEmailCta(label: string, href: string) {
  const b = EMAIL_BRAND;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr><td align="center" style="border-radius:4px;border:1px solid rgba(196,181,253,0.6);background:${b.accent};background-image:linear-gradient(180deg,#9b7bff 0%,#7c3aed 45%,#5b21b6 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 0 24px rgba(139,92,246,0.45),0 12px 30px rgba(88,28,180,0.35);">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 34px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:4px;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

/** Highlighted license-key panel in purple glass, with the 3D key icon. */
function renderKeyPanel(licenseKey: string) {
  const b = EMAIL_BRAND;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr><td style="padding:24px 18px;border-radius:8px;background:${b.keyBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};text-align:center;">
    <p style="margin:0 0 10px;color:${b.purple};font-family:${b.monoStack};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">[ License Key ]</p>
    <div style="font-family:${b.monoStack};font-size:22px;font-weight:800;letter-spacing:0.1em;color:#ffffff;word-break:break-all;">
      ${escapeHtml(licenseKey)}
    </div>
  </td></tr>
</table>`;
}

/** Two side-by-side glass badge cells. */
function renderBadgePair(label1: string, value1: string, label2: string, value2: string) {
  const b = EMAIL_BRAND;
  const cell = (label: string, value: string) => `
    <td width="50%" style="padding:0 4px;">
      <div style="padding:13px 15px;border-radius:6px;background:${b.cardBg};background-image:${b.glassFill};border:1px solid ${b.glassBorder};box-shadow:${b.glassHighlight};">
        <p style="margin:0 0 3px;color:${b.purple};font-family:${b.monoStack};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">${label}</p>
        <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;">${escapeHtml(value)}</p>
      </div>
    </td>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
  <tr>${cell(label1, value1)}${cell(label2, value2)}</tr>
</table>`;
}

/** Plan + expiry badges for purchase/reminder emails. */
function renderMetaBadges(planLabel: string, expirationDate: string) {
  return renderBadgePair("Plan", planLabel, "Expires", expirationDate);
}

/** Three-step activation guide with 3D icons in glass tiles. */
function renderActivationSteps() {
  const b = EMAIL_BRAND;
  const step = (icon: string, iconH: number, n: string, title: string, copy: string) => `
    <tr>
      <td width="56" valign="top" style="padding:0 16px 18px 0;">
        ${renderGlassIconTile(icon, 48, iconH)}
      </td>
      <td valign="top" style="padding:2px 0 18px;">
        <p style="margin:0 0 3px;color:#ffffff;font-size:15px;font-weight:700;">${n}. ${title}</p>
        <p style="margin:0;color:rgba(255,255,255,0.58);font-size:13px;line-height:1.5;">${copy}</p>
      </td>
    </tr>`;
  return `
<p style="margin:0 0 14px;color:${b.purple};font-family:${b.monoStack};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">[ Activation quest ]</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
  ${step("iphone-icon.png", 30, "1", "Open the site", `Go to <a href="${b.siteUrl}" style="color:${b.purple};text-decoration:none;">rpwallet.app</a> in Safari (iOS) or Chrome (Android) — not an in-app browser.`)}
  ${step("download-icon.png", 30, "2", "Install the app", "Follow the on-screen prompt to add RPWallet to your device.")}
  ${step("key-icon.png", 30, "3", "Enter your key", "Paste the license key above to unlock full access.")}
</table>`;
}

function buildPurchaseEmailHtml(params: {
  licenseKey: string;
  planLabel: string;
  expirationDate: string;
  referralBonusDays?: number;
}) {
  const b = EMAIL_BRAND;
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr><td align="center">
    <table role="presentation" width="92" height="92" cellpadding="0" cellspacing="0" style="width:92px;height:92px;margin:0 auto;border-radius:10px;background:${b.cardBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};">
      <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon("key-icon.png", 52, "margin:0 auto;")}</td></tr>
    </table>
  </td></tr>
</table>
${renderSystemTag("New item acquired")}
<h1 style="margin:0 0 10px;font-size:28px;line-height:1.12;letter-spacing:-0.04em;color:#ffffff;text-align:center;">Your license key is ready</h1>
<p style="margin:0 0 26px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  Thanks for purchasing <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong>. Use the key below to activate your RPWallet access.
</p>
${params.referralBonusDays ? `<p style="margin:-12px 0 24px;color:#86efac;font-size:14px;font-weight:700;text-align:center;">Creator offer applied: +${params.referralBonusDays} bonus days included.</p>` : ""}
${renderKeyPanel(params.licenseKey)}
${renderMetaBadges(params.planLabel, params.expirationDate)}
${renderActivationSteps()}
${renderEmailCta("Activate now", b.siteUrl)}`;
  return buildBrandEmailShell({
    preheader: `Your ${params.planLabel} license key is inside — activate RPWallet now.`,
    bodyHtml: body,
  });
}

function buildLicenseReminderEmailHtml(params: {
  licenseKey: string;
  planLabel: string;
  expirationDate: string;
}) {
  const b = EMAIL_BRAND;
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr><td align="center">
    <table role="presentation" width="92" height="92" cellpadding="0" cellspacing="0" style="width:92px;height:92px;margin:0 auto;border-radius:10px;background:${b.cardBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};">
      <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon("key-icon.png", 52, "margin:0 auto;")}</td></tr>
    </table>
  </td></tr>
</table>
${renderSystemTag("Quest pending")}
<h1 style="margin:0 0 10px;font-size:26px;line-height:1.14;letter-spacing:-0.035em;color:#ffffff;text-align:center;">Your key is still waiting</h1>
<p style="margin:0 0 26px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  We noticed your <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong> key has not been activated yet. It only takes a minute — here it is again.
</p>
${renderKeyPanel(params.licenseKey)}
${renderMetaBadges(params.planLabel, params.expirationDate)}
${renderActivationSteps()}
${renderEmailCta("Activate now", b.siteUrl)}
<p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.5;text-align:center;">
  Tip: activate directly in Safari on iOS or Chrome on Android. Avoid Telegram or other in-app browsers.
</p>`;
  return buildBrandEmailShell({
    preheader: "Your RPWallet key hasn't been activated yet — here it is again.",
    bodyHtml: body,
  });
}

function buildPaymentFailedEmailHtml(params: {
  planLabel: string;
  reason: "failed" | "expired";
}) {
  const b = EMAIL_BRAND;
  const telegramUrl = b.telegramUrl;
  const expired = params.reason === "expired";
  const headline = expired ? "Your payment window expired" : "Your payment didn't go through";
  const lead = expired
    ? `Your <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong> invoice expired before a payment was confirmed. If you didn't finish paying, nothing was sent — just grab your access with a fresh checkout below.`
    : `We couldn't confirm your <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong> payment. If you didn't complete it, no crypto left your wallet — start a fresh checkout below whenever you're ready.`;
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr><td align="center">
    <table role="presentation" width="92" height="92" cellpadding="0" cellspacing="0" style="width:92px;height:92px;margin:0 auto;border-radius:10px;background:${b.cardBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};">
      <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon("cart-icon.png", 50, "margin:0 auto;")}</td></tr>
    </table>
  </td></tr>
</table>
${renderSystemTag(expired ? "Quest expired" : "Quest failed")}
<h1 style="margin:0 0 10px;font-size:26px;line-height:1.14;letter-spacing:-0.035em;color:#ffffff;text-align:center;">${headline}</h1>
<p style="margin:0 0 26px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  ${lead}
</p>
${renderEmailCta("Try checkout again", `${b.siteUrl}/buy`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr><td style="padding:16px 18px;border-radius:8px;background:${b.cardBg};background-image:${b.glassFill};border:1px solid ${b.glassBorder};box-shadow:${b.glassHighlight};text-align:center;">
    <p style="margin:0 0 4px;color:#ffffff;font-size:14px;font-weight:700;">Already paid but didn't get your license?</p>
    <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.5;">
      Crypto payments can't be reversed, so don't start another checkout — message us on Telegram with your details and we'll get your access sorted.
    </p>
    <a href="${telegramUrl}" style="display:inline-block;padding:10px 20px;border-radius:4px;background:rgba(139,92,246,0.16);border:1px solid ${b.purpleBorder};color:${b.purple};font-size:13px;font-weight:700;letter-spacing:0.04em;text-decoration:none;">Contact us on Telegram</a>
  </td></tr>
</table>`;
  return buildBrandEmailShell({
    preheader: expired
      ? "Your payment expired — nothing was charged. Grab your access, or reach us on Telegram if you already paid."
      : "We couldn't confirm your payment. Start a new checkout, or reach us on Telegram if you already paid.",
    bodyHtml: body,
  });
}

function buildAbandonedCheckoutEmailHtml(params: {
  planLabel: string;
}) {
  const b = EMAIL_BRAND;
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr><td align="center">
    <table role="presentation" width="92" height="92" cellpadding="0" cellspacing="0" style="width:92px;height:92px;margin:0 auto;border-radius:10px;background:${b.cardBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};">
      <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon("cart-icon.png", 50, "margin:0 auto;")}</td></tr>
    </table>
  </td></tr>
</table>
${renderSystemTag("Quest paused")}
<h1 style="margin:0 0 10px;font-size:27px;line-height:1.12;letter-spacing:-0.04em;color:#ffffff;text-align:center;">You left something behind</h1>
<p style="margin:0 0 26px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  Your <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong> checkout is still open but the payment wasn't finished. Pick up right where you left off — it only takes a minute.
</p>
${renderEmailCta("Finish your purchase", `${b.siteUrl}/buy`)}
<p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.5;text-align:center;">
  Ran into trouble paying? <a href="${b.telegramUrl}" style="color:${b.purple};text-decoration:none;">Message us on Telegram</a> and we'll help you finish.
</p>`;
  return buildBrandEmailShell({
    preheader: `Your ${params.planLabel} checkout is still waiting — finish in a minute.`,
    bodyHtml: body,
  });
}

function buildReferralConversionEmailHtml(params: {
  affiliateName: string;
  plan: string;
  amount: string;
  currency: string;
  commissionAmount: string;
  commissionRate: string;
  buyerEmail?: string;
  dashboardUrl: string;
}) {
  const b = EMAIL_BRAND;
  const ratePct = `${Math.round(Number(params.commissionRate) * 100)}%`;
  const buyer = params.buyerEmail ? maskEmail(params.buyerEmail) : "a new customer";
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr><td align="center">
    <table role="presentation" width="92" height="92" cellpadding="0" cellspacing="0" style="width:92px;height:92px;margin:0 auto;border-radius:10px;background:${b.cardBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};">
      <tr><td align="center" valign="middle" style="text-align:center;">${renderIcon("dollar-icon.png", 50, "margin:0 auto;")}</td></tr>
    </table>
  </td></tr>
</table>
${renderSystemTag("Reward earned")}
<h1 style="margin:0 0 10px;font-size:27px;line-height:1.12;letter-spacing:-0.04em;color:#ffffff;text-align:center;">You earned a commission</h1>
<p style="margin:0 0 24px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  Nice work, ${escapeHtml(params.affiliateName)} — ${escapeHtml(buyer)} just purchased through your link.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr><td style="padding:24px 18px;border-radius:8px;background:${b.keyBg};background-image:${b.glassPurpleFill};border:1px solid ${b.purpleBorder};box-shadow:${b.glassPurpleGlow};text-align:center;">
    <p style="margin:0 0 8px;color:${b.purple};font-family:${b.monoStack};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">[ Your commission ]</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">${escapeHtml(params.currency)} ${escapeHtml(params.commissionAmount)}</div>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">${ratePct} of ${escapeHtml(params.currency)} ${escapeHtml(params.amount)}</p>
  </td></tr>
</table>
${renderBadgePair("Plan", params.plan, "Sale", `${params.currency} ${params.amount}`)}
${renderEmailCta("View your dashboard", params.dashboardUrl)}
<p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.5;text-align:center;">
  Commission is pending until the order clears the refund window, then moves to approved for payout.
</p>`;
  return buildBrandEmailShell({
    preheader: `You earned ${params.currency} ${params.commissionAmount} — a referral just converted.`,
    bodyHtml: body,
  });
}

/** Mask a buyer email for referrer-facing display: "jo***@gmail.com". */
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "a new customer";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - head.length))}@${domain}`;
}

async function sendAffiliateMagicLinkEmail(
  env: ApiEnv,
  params: {
    to: string;
    affiliateName: string;
    loginUrl: string;
  },
) {
  if (!env.RESEND_API_KEY) {
    console.warn("[affiliate-auth] RESEND_API_KEY is not set; skipping affiliate login email");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      html: buildAffiliateMagicLinkHtml(params),
      subject: "Your RPWallet affiliate login link",
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
}

function buildAffiliateMagicLinkHtml(params: {
  affiliateName: string;
  loginUrl: string;
}) {
  const b = EMAIL_BRAND;
  const body = `
${renderSystemTag("Access granted")}
<h1 style="margin:0 0 12px;font-size:26px;line-height:1.14;letter-spacing:-0.035em;color:#ffffff;text-align:center;">Sign in to your dashboard</h1>
<p style="margin:0 0 26px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;text-align:center;">
  Hi ${escapeHtml(params.affiliateName)}, use this secure link to view your clicks, conversions, commissions, and payout status.
</p>
${renderEmailCta("Open affiliate dashboard", params.loginUrl)}
<p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.5;text-align:center;">
  This link expires in 15 minutes. If you did not request it, you can ignore this email.
</p>`;
  return buildBrandEmailShell({
    preheader: "Your affiliate dashboard login link — expires in 15 minutes.",
    bodyHtml: body,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAffiliateAdminRequest(c: Context<HonoEnv>) {
  const expected = c.env.AFFILIATE_ADMIN_TOKEN;
  if (!expected) return false;
  const header = c.req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : c.req.header("x-affiliate-admin-token");
  return token === expected;
}

function getClientIp(c: Context<HonoEnv>) {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    undefined
  );
}

function getReferralSigningSecret(env: ApiEnv) {
  return env.REFERRAL_SIGNING_SECRET || "";
}

async function issueReferralToken(env: ApiEnv, clickId: string, expiresAt: string) {
  const secret = getReferralSigningSecret(env);
  if (!secret) {
    console.error("[referral] REFERRAL_SIGNING_SECRET is not configured");
    return null;
  }
  return createReferralToken({ clickId, expiresAt }, secret);
}

async function resolveReferralToken(store: PlatformStore, env: ApiEnv, token: string) {
  const secret = getReferralSigningSecret(env);
  if (!secret) return null;
  const payload = await verifyReferralToken(token, secret);
  if (!payload) return null;
  const attribution = await store.getAffiliateAttributionByClickId(payload.clickId);
  if (!attribution || attribution.expiresAt !== payload.expiresAt) return null;
  return attribution;
}

function createReferralVisitorId() {
  return `afv_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function normalizeBoundedString(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function isLinkPreviewBot(userAgent: string) {
  return /bot|crawler|spider|preview|facebookexternalhit|twitterbot|slackbot|discordbot|whatsapp/i.test(userAgent);
}

function inferReferralSource(referrer: string, userAgent: string) {
  const value = `${referrer} ${userAgent}`.toLowerCase();
  if (value.includes("instagram")) return "instagram";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
  if (value.includes("facebook") || value.includes("fbav") || value.includes("fban")) return "facebook";
  if (value.includes("crios") || value.includes("chrome")) return "chrome";
  if (value.includes("safari")) return "safari";
  return "direct";
}

function getPublicHubOrigin(env: ApiEnv) {
  return env.HUB_ORIGIN || "https://rpwallet.app";
}

function getDemoConfig(env: ApiEnv) {
  const duration = Number.parseInt(env.DEMO_DURATION_MINUTES || "3", 10);
  return {
    enabled: env.DEMO_ENABLED === "true",
    durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 3,
  };
}

function getAffiliateOrigin(env: ApiEnv) {
  return env.AFFILIATE_ORIGIN || "http://localhost:3001";
}

function buildAffiliateLoginUrl(env: ApiEnv, token: string) {
  const url = new URL("/verify", getAffiliateOrigin(env));
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Cron sweep: email people who started checkout but dropped off before paying.
 * Targets attempts still `waiting` and 30min–72h old, excludes buyers who got an
 * active license in the last 72h, sends once per email, then marks every current
 * waiting attempt for that buyer so duplicates cannot trigger another reminder.
 */
async function runAbandonedCheckoutSweep(env: ApiEnv) {
  const store = getPlatformStore(env.DATABASE_URL);
  const orders = await store.getAbandonedPaymentOrders({
    olderThanMinutes: 30,
    maxAgeHours: 72,
    recentPurchaseHours: 72,
    limit: 100,
  });
  for (const order of orders) {
    try {
      await sendAbandonedCheckoutEmail(env, { to: order.email, planLabel: order.planLabel });
      await store.markAbandonedRemindersSent(order.email);
    } catch (error) {
      console.error(`[cron] Abandoned-checkout email failed for order ${order.id}`, error);
    }
  }
  if (orders.length > 0) {
    console.log(`[cron] Abandoned-checkout sweep processed ${orders.length} order(s)`);
  }
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: ApiEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      runAbandonedCheckoutSweep(env).catch((error) => {
        console.error("[cron] Abandoned-checkout sweep failed", error);
      }),
    );
  },
} satisfies ExportedHandler<ApiEnv>;
