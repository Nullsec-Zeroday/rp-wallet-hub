"use client";

const ATTRIBUTION_KEY = "rp_affiliate_attribution";
const VISITOR_KEY = "rp_affiliate_visitor_id";
const COOKIE_MAX_AGE_SECONDS = 45 * 24 * 60 * 60;
export const AFFILIATE_ATTRIBUTION_UPDATED_EVENT = "rp-wallet:affiliate-attribution-updated";

export interface AffiliateAttribution {
  affiliateCode: string;
  affiliateDisplayName?: string;
  visitorId: string;
  clickId: string;
  referralToken: string;
  claimCode: string;
  expiresAt: string;
}

export type LegacyAffiliateAttribution = Pick<AffiliateAttribution, "affiliateCode" | "visitorId" | "clickId" | "expiresAt">;

export function normalizeAffiliateCode(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 16);
}

export function getAffiliateCodeFromSearch(search: URLSearchParams) {
  return normalizeAffiliateCode(search.get("ref") || search.get("aff") || search.get("affiliate"));
}

export function getOrCreateVisitorId() {
  const existing = readCookie(VISITOR_KEY) || safeLocalStorageGet(VISITOR_KEY);
  if (/^afv_[a-f0-9]{18}$/.test(existing)) return existing;

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
    if (!parsed.affiliateCode || !parsed.visitorId || !parsed.clickId || new Date(parsed.expiresAt) <= new Date()) {
      clearStoredAttribution();
      return null;
    }
    if (!parsed.referralToken) return null;
    return parsed;
  } catch {
    clearStoredAttribution();
    return null;
  }
}

export function getLegacyStoredAttribution(): LegacyAffiliateAttribution | null {
  const raw = readCookie(ATTRIBUTION_KEY) || safeLocalStorageGet(ATTRIBUTION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AffiliateAttribution>;
    if (
      parsed.referralToken
      || !parsed.affiliateCode
      || !parsed.visitorId
      || !parsed.clickId
      || !parsed.expiresAt
      || new Date(parsed.expiresAt) <= new Date()
    ) return null;
    return {
      affiliateCode: parsed.affiliateCode,
      visitorId: parsed.visitorId,
      clickId: parsed.clickId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function storeAttribution(attribution: AffiliateAttribution) {
  const raw = JSON.stringify(attribution);
  writeCookie(VISITOR_KEY, attribution.visitorId, COOKIE_MAX_AGE_SECONDS);
  safeLocalStorageSet(VISITOR_KEY, attribution.visitorId);
  writeCookie(ATTRIBUTION_KEY, raw, COOKIE_MAX_AGE_SECONDS);
  safeLocalStorageSet(ATTRIBUTION_KEY, raw);
  window.dispatchEvent(new CustomEvent(AFFILIATE_ATTRIBUTION_UPDATED_EVENT, { detail: attribution }));
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
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
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
