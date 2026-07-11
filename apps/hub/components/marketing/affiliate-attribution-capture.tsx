"use client";

import { useEffect } from "react";
import {
  type AffiliateAttribution,
  getAffiliateCodeFromSearch,
  getLegacyStoredAttribution,
  getOrCreateVisitorId,
  getStoredAttribution,
  storeAttribution,
} from "@/lib/affiliate-attribution";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

export default function AffiliateAttributionCapture() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const referralToken = url.searchParams.get("rid");
    const claimCode = url.searchParams.get("claim");
    if (referralToken || claimCode) {
      claimAttribution({ referralToken, claimCode }).then((attribution) => {
        if (!attribution) return;
        storeAttribution(attribution);
      });
      return;
    }

    const affiliateCode = getAffiliateCodeFromSearch(url.searchParams);
    if (!affiliateCode) {
      const stored = getStoredAttribution();
      if (stored) return;
      const legacy = getLegacyStoredAttribution();
      if (legacy) {
        claimAttribution({ referralToken: null, claimCode: legacy.clickId }).then((attribution) => {
          if (!attribution) return;
          storeAttribution(attribution);
        });
      }
      return;
    }

    const visitorId = getOrCreateVisitorId();

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
      .then((result: {
        accepted?: boolean;
        referralToken?: string;
        claimCode?: string;
        attribution?: { clickId?: string; expiresAt?: string; affiliateDisplayName?: string };
      } | null) => {
        if (!result?.accepted || !result.referralToken || !result.claimCode || !result.attribution?.clickId || !result.attribution.expiresAt) return;
        const attribution: AffiliateAttribution = {
          affiliateCode,
          affiliateDisplayName: result.attribution.affiliateDisplayName,
          visitorId,
          clickId: result.attribution.clickId,
          referralToken: result.referralToken,
          claimCode: result.claimCode,
          expiresAt: result.attribution.expiresAt,
        };
        storeAttribution(attribution);
        url.searchParams.set("rid", result.referralToken);
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      })
      .catch(() => {
        // Attribution should never interrupt the buying flow.
      });
  }, []);

  return null;
}

async function claimAttribution(input: { referralToken: string | null; claimCode: string | null }) {
  try {
    const response = await fetch(`${HUB_API_BASE_URL}/affiliate/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        referralToken: input.referralToken || undefined,
        claimCode: input.claimCode || undefined,
      }),
    });
    if (!response.ok) return null;
    const result = await response.json() as { accepted?: boolean; attribution?: AffiliateAttribution };
    return result.accepted && result.attribution ? result.attribution : null;
  } catch {
    return null;
  }
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
