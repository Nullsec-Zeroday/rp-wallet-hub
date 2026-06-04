import type { WalletAppId, WalletAppSummary, WalletBootstrapPayload } from "@rp-wallet/types";

const DEMO_USERNAME = "larperwallet";
const DEMO_WALLET_NAME = "LarperWallet";
const DEMO_PAYWALL_EVENT = "rp-wallet:demo-paywall";

const DEMO_BALANCES: Record<WalletAppId, Record<string, string>> = {
  phantom: {
    SOL: "1.5",
    USDT: "180",
    SUI: "45",
  },
  trust: {
    SOL: "2.2",
    USDT: "180",
    BNB: "0.2",
  },
};

export const walletRegistry: Record<WalletAppId, Omit<WalletAppSummary, "activated">> = {
  phantom: {
    id: "phantom",
    name: "Phantom",
    host: "app1.larperwallet.com",
    enabled: true,
  },
  trust: {
    id: "trust",
    name: "Trust Wallet",
    host: "app2.larperwallet.com",
    enabled: true,
  },
};

export function listWalletApps(activatedWallets: WalletAppId[] = []): WalletAppSummary[] {
  return Object.values(walletRegistry).map((wallet) => ({
    ...wallet,
    activated: activatedWallets.includes(wallet.id),
  }));
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;

  const navigatorStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return navigatorStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function getPlatformDeviceId() {
  if (typeof window === "undefined") return "server";

  const key = "rp_platform_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

export function getWalletStorageKey(walletAppId: WalletAppId, kind: "bootstrap" | "pending-token") {
  return `rp_wallet_${walletAppId}_${kind}`;
}

function getWalletCookieName(walletAppId: WalletAppId, kind: "pending-token") {
  return `rp_wallet_${walletAppId}_${kind}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function readCachedBootstrap(walletAppId: WalletAppId): WalletBootstrapPayload | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(getWalletStorageKey(walletAppId, "bootstrap"));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WalletBootstrapPayload;
  } catch {
    return null;
  }
}

export function writeCachedBootstrap(walletAppId: WalletAppId, payload: WalletBootstrapPayload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getWalletStorageKey(walletAppId, "bootstrap"), JSON.stringify(payload));
}

export function readPendingToken(walletAppId: WalletAppId) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getWalletStorageKey(walletAppId, "pending-token")) || readCookie(getWalletCookieName(walletAppId, "pending-token"));
}

export function writePendingToken(walletAppId: WalletAppId, token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getWalletStorageKey(walletAppId, "pending-token"), token);
  writeCookie(getWalletCookieName(walletAppId, "pending-token"), token, 60 * 10);
}

export function clearPendingToken(walletAppId: WalletAppId) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getWalletStorageKey(walletAppId, "pending-token"));
  clearCookie(getWalletCookieName(walletAppId, "pending-token"));
}

export function isDemoPayload(payload?: Pick<WalletBootstrapPayload, "access"> | null) {
  return payload?.access?.kind === "demo";
}

export function isDemoExpired(payload?: Pick<WalletBootstrapPayload, "access"> | null, now = Date.now()) {
  return isDemoPayload(payload) && Date.parse(payload?.access?.expiresAt || "") <= now;
}

export function applyDemoRestrictions(walletAppId: WalletAppId, payload: WalletBootstrapPayload): WalletBootstrapPayload {
  if (!isDemoPayload(payload)) return payload;

  const account = payload.accounts[0];
  const accountId = account?.id || `${walletAppId}-demo-account`;
  const now = new Date().toISOString();
  const balances = DEMO_BALANCES[walletAppId];

  return {
    ...payload,
    profile: {
      ...payload.profile,
      displayName: DEMO_WALLET_NAME,
      username: DEMO_USERNAME,
      updatedAt: now,
    },
    accounts: [
      {
        ...(account || {
          createdAt: now,
          id: accountId,
          walletProfileId: payload.profile.id,
        }),
        id: accountId,
        name: DEMO_WALLET_NAME,
        address: account?.address || "7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j",
      },
      ...payload.accounts.slice(1),
    ],
    balances: Object.entries(balances).map(([tokenSymbol, amount]) => ({
      accountId,
      tokenSymbol,
      amount,
      updatedAt: now,
    })),
  };
}

export function requestDemoPaywall(reason = "locked-feature") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_PAYWALL_EVENT, { detail: { reason } }));
}

export function addDemoPaywallListener(listener: (reason?: string) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    listener((event as CustomEvent<{ reason?: string }>).detail?.reason);
  };
  window.addEventListener(DEMO_PAYWALL_EVENT, handler);
  return () => window.removeEventListener(DEMO_PAYWALL_EVENT, handler);
}
