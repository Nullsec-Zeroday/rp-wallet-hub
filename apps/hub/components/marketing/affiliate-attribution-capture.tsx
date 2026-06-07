"use client";

import { useEffect } from "react";
import {
  getAffiliateCodeFromSearch,
  getOrCreateVisitorId,
  getStoredAttribution,
  storeAttribution,
} from "@/lib/affiliate-attribution";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

export default function AffiliateAttributionCapture() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const affiliateCode = getAffiliateCodeFromSearch(url.searchParams);
    if (!affiliateCode) return;

    const visitorId = getOrCreateVisitorId();
    const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();

    storeAttribution({
      affiliateCode,
      visitorId,
      expiresAt,
    });

    fetch(`${HUB_API_BASE_URL}/affiliate/click`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        affiliateCode,
        visitorId,
        landingPath: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
        source: inferSource(document.referrer, navigator.userAgent),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { accepted?: boolean; attribution?: { clickId?: string; expiresAt?: string } } | null) => {
        if (!result?.accepted) return;
        const current = getStoredAttribution();
        if (!current || current.affiliateCode !== affiliateCode) return;
        storeAttribution({
          ...current,
          clickId: result.attribution?.clickId || current.clickId,
          expiresAt: result.attribution?.expiresAt || current.expiresAt,
        });
      })
      .catch(() => {
        // Attribution should never interrupt the buying flow.
      });
  }, []);

  return null;
}

function inferSource(referrer: string, userAgent: string) {
  const value = `${referrer} ${userAgent}`.toLowerCase();
  if (value.includes("instagram")) return "instagram";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
  if (value.includes("safari") && !value.includes("chrome")) return "safari";
  if (value.includes("chrome")) return "chrome";
  return "direct";
}
