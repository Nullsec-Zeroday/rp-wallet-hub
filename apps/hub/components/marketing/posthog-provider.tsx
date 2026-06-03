"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import React, { Suspense, useEffect } from "react";
import { initPostHog } from "@/lib/track";

function PostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return;

    const query = searchParams.toString();
    const url = query ? `${window.location.origin}${pathname}?${query}` : `${window.location.origin}${pathname}`;

    posthog.capture("$pageview", {
      $current_url: url,
      path: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViews />
      </Suspense>
      {children}
    </Provider>
  );
}
