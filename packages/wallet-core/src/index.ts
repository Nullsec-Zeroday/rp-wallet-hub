import type { WalletAppId, WalletAppSummary, WalletBootstrapPayload } from "@rp-wallet/types";

export const walletRegistry: Record<WalletAppId, Omit<WalletAppSummary, "activated">> = {
  phantom: {
    id: "phantom",
    name: "Phantom",
    host: "phantom.rpwallet.app",
    enabled: true,
  },
  trust: {
    id: "trust",
    name: "Trust Wallet",
    host: "trust.rpwallet.app",
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
