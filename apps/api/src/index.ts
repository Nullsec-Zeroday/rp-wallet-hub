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
import type { ApiEnv } from "./env";
import { getAllowedOrigins } from "./env";
import { DemoDeviceUsedError, DemoUnavailableError, DeviceLimitError, InvalidLicenseError, getPlatformStore } from "./platform-store";

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

app.post("/affiliate/click", async (c) => {
  const body = await c.req.json<{
    affiliateCode?: string;
    visitorId?: string;
    landingPath?: string;
    referrer?: string;
    source?: string;
  }>();

  if (!body.affiliateCode?.trim() || !body.visitorId?.trim()) {
    return c.json({ accepted: false });
  }

  const result = await getPlatformStore(c.env.DATABASE_URL).recordAffiliateClick({
    affiliateCode: body.affiliateCode,
    visitorId: body.visitorId,
    landingPath: body.landingPath || "/",
    referrer: body.referrer,
    source: body.source,
    userAgent: c.req.header("user-agent") || undefined,
    ipAddress: getClientIp(c),
  });

  return c.json(result);
});

app.post("/affiliate/checkout-intent", async (c) => {
  const body = await c.req.json<{
    affiliateCode?: string;
    visitorId?: string;
    clickId?: string;
    plan?: string;
    productId?: string | number;
    variantId?: string | number;
    buyerEmail?: string;
  }>();

  if (!body.affiliateCode?.trim() || !body.visitorId?.trim() || !body.plan?.trim()) {
    return c.json({ accepted: false });
  }

  const result = await getPlatformStore(c.env.DATABASE_URL).createAffiliateCheckoutIntent({
    affiliateCode: body.affiliateCode,
    visitorId: body.visitorId,
    clickId: body.clickId,
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

  return c.json({
    license,
    licenseKey,
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

  const store = getPlatformStore(c.env.DATABASE_URL);
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
        affiliateCode: extractSellAuthAffiliateCode(payload),
        sellauthOrderId: orderId,
        licenseId: license.id,
        buyerEmail,
        plan: plan.label,
        amount: extractSellAuthAmount(payload),
        currency: extractSellAuthCurrency(payload),
        productId: extractSellAuthProductId(payload),
        variantId: extractSellAuthVariantId(payload),
      })
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
    payload.total ??
    payload.total_usd ??
    payload.amount ??
    payload.price ??
    payload.data?.total ??
    payload.data?.total_usd ??
    payload.data?.amount ??
    payload.data?.price;
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
      from: "RPWallet <noreply@rpwallet.us>",
      html: buildPurchaseEmailHtml(params),
      subject: `Your RPWallet License Key — ${params.planLabel}`,
      to: params.to,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
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
      from: "RPWallet <noreply@rpwallet.us>",
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

function buildPurchaseEmailHtml(params: {
  licenseKey: string;
  planLabel: string;
  expirationDate: string;
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#0d0d0e;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 22px;">
      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:28px;background:#15121f;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:30px;line-height:1.08;letter-spacing:-0.04em;">Your license key is ready</h1>
        <p style="margin:0 0 22px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;">
          Thanks for purchasing ${escapeHtml(params.planLabel)}. Use the license key below to activate your RPWallet access.
        </p>
        <div style="margin:22px 0;padding:18px;border-radius:18px;background:#0d0d0e;border:1px solid rgba(171,159,242,0.35);text-align:center;">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:20px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">
            ${escapeHtml(params.licenseKey)}
          </div>
        </div>
        <p style="margin:0;color:rgba(255,255,255,0.62);font-size:14px;line-height:1.55;">
          Plan: <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong><br />
          Expires: <strong style="color:#fff;">${escapeHtml(params.expirationDate)}</strong>
        </p>
        <p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.45;">
          If you need help, contact support through the official RPWallet site.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function buildLicenseReminderEmailHtml(params: {
  licenseKey: string;
  planLabel: string;
  expirationDate: string;
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#0d0d0e;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 22px;">
      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:28px;background:#15121f;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;letter-spacing:-0.035em;">Your RPWallet key is ready</h1>
        <p style="margin:0 0 22px;color:rgba(255,255,255,0.66);font-size:15px;line-height:1.55;">
          We noticed your key has not been activated yet. Open <a href="https://rpwallet.app" style="color:#ab9ff2;text-decoration:none;">rpwallet.app</a>, install the app, then enter this key.
        </p>
        <div style="margin:22px 0;padding:18px;border-radius:18px;background:#0d0d0e;border:1px solid rgba(171,159,242,0.35);text-align:center;">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:20px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">
            ${escapeHtml(params.licenseKey)}
          </div>
        </div>
        <p style="margin:0;color:rgba(255,255,255,0.62);font-size:14px;line-height:1.55;">
          Plan: <strong style="color:#fff;">${escapeHtml(params.planLabel)}</strong><br />
          Expires: <strong style="color:#fff;">${escapeHtml(params.expirationDate)}</strong>
        </p>
        <p style="margin:22px 0 0;color:rgba(255,255,255,0.42);font-size:12px;line-height:1.45;">
          Tip: activate directly in Safari on iOS or Chrome on Android. Avoid Telegram or other in-app browsers.
        </p>
      </div>
    </div>
  </body>
</html>`;
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
      from: "RPWallet <noreply@rpwallet.us>",
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
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 22px;">
      <div style="border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;padding:28px;box-shadow:0 18px 60px rgba(15,23,42,0.08);">
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">RPWallet Affiliate</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;letter-spacing:-0.04em;">Sign in to your dashboard</h1>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.55;">
          Hi ${escapeHtml(params.affiliateName)}, use this secure link to view your clicks, conversions, commissions, and payout status.
        </p>
        <a href="${escapeHtml(params.loginUrl)}" style="display:inline-block;border-radius:14px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 18px;">
          Open affiliate dashboard
        </a>
        <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.45;">
          This link expires in 15 minutes. If you did not request it, you can ignore this email.
        </p>
      </div>
    </div>
  </body>
</html>`;
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

export default app;
