"use client";

import { useCallback, useState } from "react";

const API_BASE_URL = "https://api-internal-3.sellauth.com/v1";

export interface SellAuthCartItem {
  productId: number;
  variantId: number;
  quantity: number;
}

export interface SellAuthCheckoutOptions {
  cart: SellAuthCartItem[];
  shopId: number;
}

interface AltchaStateDetail {
  state?: string;
  error?: string;
  payload?: string;
}

interface CheckoutResponse {
  error?: string;
  url?: string;
}

export function useSellAuthEmbed() {
  const [isLoading, setIsLoading] = useState(false);

  const checkout = useCallback(async (options: SellAuthCheckoutOptions) => {
    if (isLoading) return;

    setIsLoading(true);
    let widget: HTMLElement | null = null;
    let handleStateChange: ((event: Event) => void) | null = null;

    try {
      if (!window.customElements?.get("altcha-widget")) {
        await new Promise<void>((resolve, reject) => {
          const existingScript = document.querySelector<HTMLScriptElement>('script[data-rp-sellauth-altcha="true"]');
          if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Failed to load payment verification.")), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.type = "module";
          script.src = "https://cdn.jsdelivr.net/npm/altcha@1.2.0/dist/altcha.min.js";
          script.async = true;
          script.dataset.rpSellauthAltcha = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load payment verification."));
          document.body.appendChild(script);
        });
      }

      document.querySelectorAll("altcha-widget").forEach((element) => element.remove());
      let resolvedToken: string | null = null;
      let verificationError: string | null = null;

      widget = document.createElement("altcha-widget");
      widget.setAttribute("challengeurl", `${API_BASE_URL}/altcha`);
      widget.setAttribute("auto", "onload");
      widget.setAttribute("hidefooter", "true");
      widget.setAttribute("hidelogo", "true");
      widget.style.display = "none";
      widget.style.position = "absolute";
      widget.style.top = "-9999px";
      widget.style.left = "-9999px";

      handleStateChange = (event: Event) => {
        const detail = (event as CustomEvent<AltchaStateDetail>).detail || {};
        if (detail.state === "verified") resolvedToken = detail.payload || null;
        if (detail.state === "error") verificationError = detail.error || "Verification failed";
      };
      widget.addEventListener("statechange", handleStateChange);
      document.body.appendChild(widget);

      await new Promise<void>((resolve, reject) => {
        const startedAt = Date.now();
        const interval = window.setInterval(() => {
          if (resolvedToken) {
            window.clearInterval(interval);
            resolve();
          } else if (verificationError) {
            window.clearInterval(interval);
            reject(new Error(verificationError));
          } else if (Date.now() - startedAt > 15_000) {
            window.clearInterval(interval);
            reject(new Error("Payment verification timed out. Please try again."));
          }
        }, 100);
      });

      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: options.cart,
          shopId: options.shopId,
          altcha: resolvedToken,
        }),
      });
      const responseData = (await response.json()) as CheckoutResponse;
      if (!response.ok || responseData.error) throw new Error(responseData.error || "Unable to create SellAuth checkout.");
      if (!responseData.url) throw new Error("SellAuth did not return a checkout URL.");

      window.location.href = responseData.url;
    } finally {
      if (widget) {
        if (handleStateChange) widget.removeEventListener("statechange", handleStateChange);
        widget.remove();
      }
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    checkout,
    isLoading,
  };
}
