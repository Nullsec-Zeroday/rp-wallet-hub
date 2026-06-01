"use client";

const ATTRIBUTION_KEY = "rp_affiliate_attribution";
const VISITOR_KEY = "rp_affiliate_visitor_id";
const COOKIE_MAX_AGE_SECONDS = 45 * 24 * 60 * 60;

export interface AffiliateAttribution {
  affiliateCode: string;
  visitorId: string;
  clickId?: string;
  expiresAt: string;
}

export function normalizeAffiliateCode(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 16);
}

export function getAffiliateCodeFromSearch(search: URLSearchParams) {
  return normalizeAffiliateCode(search.get("ref") || search.get("aff") || search.get("affiliate"));
}

export function getOrCreateVisitorId() {
  const existing = readCookie(VISITOR_KEY) || safeLocalStorageGet(VISITOR_KEY);
  if (existing) return existing;

  const visitorId = `afv_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  writeCookie(VISITOR_KEY, visitorId, COOKIE_MAX_AGE_SECONDS);
  safeLocalStorageSet(VISITOR_KEY, visitorId);
  return visitorId;
}

export function getStoredAttribution(): AffiliateAttribution | null {
  const raw = readCookie(ATTRIBUTION_KEY) || safeLocalStorageGet(ATTRIBUTION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AffiliateAttribution;
    if (!parsed.affiliateCode || !parsed.visitorId || new Date(parsed.expiresAt) <= new Date()) {
      clearStoredAttribution();
      return null;
    }
    return parsed;
  } catch {
    clearStoredAttribution();
    return null;
  }
}

export function storeAttribution(attribution: AffiliateAttribution) {
  const raw = JSON.stringify(attribution);
  writeCookie(ATTRIBUTION_KEY, raw, COOKIE_MAX_AGE_SECONDS);
  safeLocalStorageSet(ATTRIBUTION_KEY, raw);
}

export function clearStoredAttribution() {
  writeCookie(ATTRIBUTION_KEY, "", 0);
  try {
    window.localStorage.removeItem(ATTRIBUTION_KEY);
  } catch {
    // Ignore restricted storage in social in-app browsers.
  }
}

function readCookie(name: string) {
  const encodedName = encodeURIComponent(name);
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${encodedName}=`));
  return entry ? decodeURIComponent(entry.slice(encodedName.length + 1)) : "";
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function safeLocalStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Some in-app browsers can restrict storage; cookie remains the fallback.
  }
}
