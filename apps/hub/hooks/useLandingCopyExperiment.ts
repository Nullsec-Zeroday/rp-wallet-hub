"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { initPostHog, trackEvent } from "@/lib/track";

export const LANDING_COPY_EXPERIMENT_FLAG = "landing-page-copy";

export type LandingCopyVariant = "control" | "make-money";

function normalizeVariant(value: boolean | string | undefined): LandingCopyVariant {
  return value === "make-money" ? "make-money" : "control";
}

export function useLandingCopyExperiment() {
  const [variant, setVariant] = useState<LandingCopyVariant>("control");

  useEffect(() => {
    initPostHog();
    if (!posthog.__loaded) return;

    let lastTrackedVariant: LandingCopyVariant | null = null;

    const updateVariant = () => {
      const nextVariant = normalizeVariant(posthog.getFeatureFlag(LANDING_COPY_EXPERIMENT_FLAG));
      setVariant(nextVariant);

      if (nextVariant === lastTrackedVariant) return;
      lastTrackedVariant = nextVariant;
      trackEvent("landing_copy_experiment_viewed", {
        experiment: LANDING_COPY_EXPERIMENT_FLAG,
        variant: nextVariant,
      });
    };

    return posthog.onFeatureFlags(updateVariant);
  }, []);

  return variant;
}
