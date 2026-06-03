import posthog from "posthog-js";

type PostHogPersonProfiles = "always" | "identified_only";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (posthog.__loaded) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    person_profiles: (process.env.NEXT_PUBLIC_POSTHOG_PERSON_PROFILES || "always") as PostHogPersonProfiles,
  });
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  initPostHog();
  if (!posthog.__loaded) return;

  posthog.capture(event, props);
}
