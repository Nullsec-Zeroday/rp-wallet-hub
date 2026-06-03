"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/track";

export default function FunnelAnalytics() {
  const pathname = usePathname();
  const checkoutStartedRef = useRef(false);

  useEffect(() => {
    checkoutStartedRef.current = false;
    trackEvent("marketing_page_viewed", { path: pathname });

    if (pathname === "/") {
      trackEvent("landing_page_viewed");
    }
  }, [pathname]);

  useEffect(() => {
    const handleCheckoutStarted = () => {
      checkoutStartedRef.current = true;
    };

    const handlePageHide = () => {
      if (checkoutStartedRef.current) return;
      trackEvent("marketing_exit_without_checkout", {
        path: window.location.pathname,
        search: window.location.search,
      });
    };

    window.addEventListener("rp-wallet:checkout-started", handleCheckoutStarted);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("rp-wallet:checkout-started", handleCheckoutStarted);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const pricingSection = document.getElementById("pricing");
    if (!pricingSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        trackEvent("pricing_section_viewed");
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(pricingSection);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
