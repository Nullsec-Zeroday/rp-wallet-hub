'use client';

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://api-internal-3.sellauth.com/v1';

export interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
}

export interface CheckoutOptions {
  cart: CartItem[];
  shopId: number;
  modal?: boolean;
  scrollTop?: boolean;
  onPreparing?: () => void;
  onCheckoutUrlReady?: () => void;
  onError?: (error: Error) => void;
  onSettled?: (result: { status: 'success' | 'error'; redirected: boolean }) => void;
}

export interface SellAuthEmbedHook {
  checkout: (options: CheckoutOptions) => Promise<void>;
  isLoading: boolean;
  closeModal: () => void;
  captcha: React.ReactElement | null;
  modal: React.ReactElement | null;
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

function CheckoutModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [redirectedAway, setRedirectedAway] = React.useState(false);

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Page went to background — likely a popup/new tab opened from the iframe
        setRedirectedAway(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100000010] flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-[#0c0a18]/80 backdrop-blur-md cursor-pointer pointer-events-auto"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
        className="relative bg-[#121212]/95 text-white border border-white/10 rounded-3xl max-w-[98vw] md:max-w-[32rem] w-full max-h-[90vh] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] z-10 pointer-events-auto backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-xl border border-white/10 active:scale-95 pointer-events-auto shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
          </svg>
        </button>
        <div className="w-full h-full relative">
          {!redirectedAway && (
            <iframe
              src={url}
              title="SellAuth Embed"
              referrerPolicy="no-referrer"
              allow="payment; clipboard-write"
              className="w-full h-[46rem] md:h-[52rem] border-0"
            />
          )}
          {redirectedAway && (
            <div className="w-full h-[46rem] md:h-[52rem] flex flex-col items-center justify-center gap-6 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#ab9ff2]/10 border border-[#ab9ff2]/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ab9ff2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Complete your payment</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-[280px] mx-auto">
                  A new window was opened for payment. Complete your purchase there, then return here.
                </p>
              </div>
              <button
                onClick={() => setRedirectedAway(false)}
                className="mt-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-[14px] font-medium transition-all backdrop-blur-md shadow-lg"
              >
                ← Back to checkout
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}


export function useSellAuthEmbed(): SellAuthEmbedHook {
  const [isLoading, setIsLoading] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const checkout = useCallback(
    async (options: CheckoutOptions) => {
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      let widget: HTMLElement | null = null;
      let handleStateChange: ((ev: Event) => void) | null = null;
      let settledStatus: 'success' | 'error' = 'success';
      let redirected = false;

      try {
        options.onPreparing?.();

        if (typeof window !== 'undefined' && !window.customElements?.get('altcha-widget')) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://cdn.jsdelivr.net/npm/altcha@1.2.0/dist/altcha.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load verification script. Please check your internet connection.'));
            document.body.appendChild(script);
          });
        }

        document.querySelectorAll('altcha-widget').forEach((el) => el.remove());

        let resolvedToken: string | null = null;
        let verificationError: string | null = null;

        widget = document.createElement('altcha-widget');
        widget.setAttribute('challengeurl', `${API_BASE_URL}/altcha`);
        widget.setAttribute('auto', 'onload');
        widget.setAttribute('hidefooter', 'true');
        widget.setAttribute('hidelogo', 'true');
        widget.setAttribute('debug', 'true');

        widget.style.display = 'none';
        widget.style.position = 'absolute';
        widget.style.top = '-9999px';
        widget.style.left = '-9999px';

        handleStateChange = (ev: Event) => {
          const detail = (ev as CustomEvent<AltchaStateDetail>).detail || {};
          const { state, error } = detail;
          if (state === 'verified') {
            resolvedToken = detail.payload || null;
          } else if (state === 'error') {
            verificationError = error || 'Verification failed';
          }
        };

        widget.addEventListener('statechange', handleStateChange);
        document.body.appendChild(widget);

        await new Promise<void>((resolve, reject) => {
          const start = Date.now();
          const interval = setInterval(() => {
            if (resolvedToken) {
              clearInterval(interval);
              resolve();
            } else if (verificationError) {
              clearInterval(interval);
              reject(new Error(verificationError));
            } else if (Date.now() - start > 15000) {
              clearInterval(interval);
              reject(new Error('Verification timed out. Please try again.'));
            }
          }, 100);
        });

        const response = await fetch(`${API_BASE_URL}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart: options.cart,
            shopId: options.shopId,
            altcha: resolvedToken,
          }),
        });

        const responseData = (await response.json()) as CheckoutResponse;
        if (responseData.error) {
          throw new Error(responseData.error);
        }

        if (!responseData.url) {
          throw new Error('No checkout URL returned. Please try again.');
        }

        options.onCheckoutUrlReady?.();

        // On mobile, skip the iframe modal and redirect directly.
        // Mobile browsers block popups from iframes (e.g. Whop payment opening a new window).
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobileDevice) {
          redirected = true;
          window.location.href = responseData.url;
        } else if (options.modal !== false) {
          setModalUrl(responseData.url);
          if (options.scrollTop) {
            window.scrollTo(0, 0);
          }
        } else {
          window.open(responseData.url, '_blank');
        }
      } catch (error: unknown) {
        settledStatus = 'error';
        const checkoutError = error instanceof Error ? error : new Error('An error occurred during verification');
        console.error('SellAuth Checkout Error:', error);
        if (options.onError) {
          options.onError(checkoutError);
        } else {
          alert(checkoutError.message);
        }
      } finally {
        if (widget) {
          if (handleStateChange) {
            widget.removeEventListener('statechange', handleStateChange);
          }
          widget.remove();
        }
        setIsLoading(false);
        options.onSettled?.({ status: settledStatus, redirected });
      }
    },
    [isLoading],
  );

  const closeModal = useCallback(() => {
    setModalUrl(null);
  }, []);

  return {
    checkout,
    isLoading,
    closeModal,
    captcha: null,
    modal: (
      <AnimatePresence>{modalUrl && <CheckoutModal url={modalUrl} onClose={closeModal} />}</AnimatePresence>
    ),
  };
}

export interface SellAuthButtonProps {
  cart: CartItem[];
  shopId: number;
  modal?: boolean;
  scrollTop?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function SellAuthButton({
  cart,
  shopId,
  modal = true,
  scrollTop = false,
  className = '',
  children,
  disabled = false,
}: SellAuthButtonProps) {
  const { checkout, isLoading, modal: checkoutModal } = useSellAuthEmbed();
  const handleClick = () => {
    checkout({ cart, shopId, modal, scrollTop });
  };
  const defaultClassName =
    'inline-flex items-center justify-center rounded-md bg-gray-800/50 px-4 py-2 text-sm font-medium duration-100 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-700 hover:text-white transition-colors backdrop-blur-md cursor-pointer';
  return (
    <>
      <button
        type="button"
        className={className || defaultClassName}
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {children || (
          <>
            <span>Buy Now</span>
            {!isLoading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5 ml-2" fill="currentColor" viewBox="0 0 256 256">
                <path d="M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z" />
              </svg>
            )}
            {isLoading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5 ml-2 animate-spin" fill="currentColor" viewBox="0 0 256 256">
                <path d="M232,128a104,104,0,0,1-208,0c0-41,23.81-78.36,60.66-95.27a8,8,0,0,1,6.68,14.54C60.15,61.59,40,93.27,40,128a88,88,0,0,0,176,0c0-34.73-20.15-66.41-51.34-80.73a8,8,0,0,1,6.68-14.54C208.19,49.64,232,87,232,128Z" />
              </svg>
            )}
          </>
        )}
      </button>
      {checkoutModal}
    </>
  );
}
