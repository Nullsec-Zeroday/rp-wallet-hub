import React from "react";
import { Toaster } from "sonner";
import type { WalletBootstrapPayload } from "@rp-wallet/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RouterProvider } from "./shims/router-context";
import { RiveAssetProvider } from "./app/(wallet)/_components/rive-asset-provider";
import WalletHeader from "./app/(wallet)/_components/wallet-header";
import WalletFooterNavigation from "./app/(wallet)/_components/wallet-footer-navigation";
import CustomScrollbar, { type CustomScrollbarRef } from "./app/(wallet)/_components/custom-scrollbar";
import HomePage from "./app/(wallet)/home/page";
import TokensPage from "./app/(wallet)/tokens/page";
import TokenDetailPage from "./app/(wallet)/token/[symbol]/page";
import ActivityPage from "./app/(wallet)/activity/page";
import BrowserPage from "./app/(wallet)/browser/page";
import SwapPage from "./app/(wallet)/swap/page";
import SendModal from "./app/(wallet)/_components/modals/send-modal";
import ReceiveModal from "./app/(wallet)/_components/modals/receive-modal";
import BuyModal from "./app/(wallet)/_components/modals/buy-modal";
import AccountModal from "./app/(wallet)/_components/modals/account-modal";
import RecentActivityModal from "./app/(wallet)/_components/modals/recent-activity-modal";
import SettingsPage from "./app/(wallet)/settings/page";
import EditProfilePage from "./app/(wallet)/settings/edit-profile/page";
import { DEFAULT_BALANCES } from "./lib/wallet-data";
import { fetchLivePrices, getStaticPrices } from "./lib/coingecko-service";
import { useWalletStore, type Transaction, type UserProfile } from "./lib/wallet-store";

type WalletModal = "send" | "receive" | "buy" | null;

function mapProfile(payload: WalletBootstrapPayload): UserProfile {
  const account = payload.accounts[0];
  const displayName = payload.profile.displayName || account?.name || "Account 1";

  return {
    avatarType: "emoji",
    bio: "",
    discord: "",
    email: "",
    iconIndex: 1,
    name: displayName,
    twitter: "",
    username: payload.profile.username || "",
    walletAddress: account?.address || "",
  };
}

function mapTransactions(payload: WalletBootstrapPayload): Transaction[] {
  return payload.recentTransactions
    .map((tx) => ({
      amount: Number(tx.amount),
      from: tx.fromAddress || "External Wallet",
      id: tx.id,
      status: "confirmed" as const,
      timestamp: new Date(tx.createdAt).getTime(),
      to: tx.toAddress || "Your Wallet",
      token: tx.tokenSymbol,
      type: (
        tx.type === "send"
          ? "send"
          : tx.type === "same_wallet_transfer"
            ? "swap"
            : tx.type === "manual_adjustment"
              ? "buy"
              : "receive"
      ) as Transaction["type"],
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function syncStoreFromPayload(payload: WalletBootstrapPayload) {
  const account = payload.accounts[0];
  const tokenBalances = (payload.balances.length ? payload.balances : []).map((balance) => ({
    balance: Number(balance.amount),
    symbol: balance.tokenSymbol,
  }));

  useWalletStore.setState((state) => {
    const profile = {
      ...state.profile,
      ...mapProfile(payload),
    };

    return {
      accounts: [
        {
          avatarIconIndex: profile.iconIndex,
          cashBalance: state.cashBalance,
          id: account?.id || "initial-account",
          name: account?.name || profile.name,
          profile,
          tokenBalances: tokenBalances.length ? tokenBalances : DEFAULT_BALANCES,
          transactions: mapTransactions(payload),
          walletName: account?.name || profile.name,
        },
      ],
      currentAccountIndex: 0,
      profile,
      tokenBalances: tokenBalances.length ? tokenBalances : DEFAULT_BALANCES,
      transactions: mapTransactions(payload),
      walletName: account?.name || profile.name,
    };
  });
}

function WalletRouteBody() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTokenPage = pathname.startsWith("/token/");
  const isSettingsPage = pathname.startsWith("/settings");
  const { baseCurrency, coingeckoApiKey, customTokens, handleRefreshBoost } = useWalletStore();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLElement | null>(null);
  const scrollbarRef = React.useRef<CustomScrollbarRef>(null);
  const pulling = React.useRef(false);
  const startY = React.useRef(0);
  const currentPull = React.useRef(0);
  const refreshingRef = React.useRef(false);
  const spinnerRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerWrapRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerRotationWrapRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerScaleWrapRef = React.useRef<HTMLDivElement | null>(null);
  const allBarsChargedLogged = React.useRef(false);
  const rotatingIllusionLogged = React.useRef(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [accountModalVisible, setAccountModalVisible] = React.useState(false);
  const [activityVisible, setActivityVisible] = React.useState(false);

  const THRESHOLD = 110;
  const SETTLED_Y = 140;
  const SPINNER_PULL_SENSITIVITY = 0.00001;

  React.useEffect(() => {
    if (pathname === "/" || pathname === "/bootstrap") {
      router.replace("/home");
    }
  }, [pathname, router]);

  const modal = searchParams.get("modal") as WalletModal;
  const symbol = searchParams.get("symbol") || undefined;

  const closeModal = React.useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const updateSpinner = React.useCallback((visualPx: number, animated = false) => {
    const scaleWrap = spinnerScaleWrapRef.current;
    if (scaleWrap) {
      scaleWrap.classList.remove("fade-out-exit");
    }

    const wrap = spinnerWrapRef.current;
    if (wrap) {
      const drift = visualPx * SPINNER_PULL_SENSITIVITY;
      wrap.style.transition = animated
        ? "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
        : "none";
      wrap.style.transform = `translateY(${drift}px)`;
    }

    const el = spinnerRef.current;
    if (!el) return;

    const bars = el.querySelectorAll<HTMLElement>(".bar");
    const START = 45;
    const END = SETTLED_Y;
    const step = (END - START) / bars.length;

    if (visualPx < START) {
      allBarsChargedLogged.current = false;
      rotatingIllusionLogged.current = false;
    }

    let chargedCount = 0;
    bars.forEach((bar, i) => {
      const needed = START + (i + 1) * step;
      const isCharged = visualPx >= needed;
      if (isCharged) chargedCount++;
    });

    if (chargedCount === bars.length) {
      if (!allBarsChargedLogged.current && typeof window !== "undefined" && (window as any).triggerHaptic) {
        (window as any).triggerHaptic("medium");
        allBarsChargedLogged.current = true;
      }
      spinnerRotationWrapRef.current?.classList.add("charge-spin");
      el.classList.add("animating");
      rotatingIllusionLogged.current = true;
      bars.forEach((bar) => {
        bar.style.opacity = "";
      });
    } else {
      spinnerRotationWrapRef.current?.classList.remove("charge-spin");
      if (!refreshingRef.current) {
        el.classList.remove("animating");
      }
      bars.forEach((bar, i) => {
        const needed = START + (i + 1) * step;
        bar.style.opacity = visualPx >= needed ? "0.85" : "0";
      });
    }
  }, []);

  const setTranslateY = React.useCallback((y: number, animated = false, duration = "0.4s") => {
    const el = contentRef.current;
    if (!el) return;

    el.style.transition = animated
      ? `transform ${duration} cubic-bezier(0.16, 1, 0.3, 1)`
      : "none";
    el.style.transform = `translateY(${y}px) translateZ(0)`;
    scrollbarRef.current?.update(y);
  }, []);

  React.useEffect(() => {
    if (refreshing) {
      setTranslateY(SETTLED_Y, true, "0.8s");
    } else if (!pulling.current) {
      setTranslateY(0, true, "0.8s");
    }
  }, [refreshing, setTranslateY]);

  React.useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const rubberBand = (x: number) => x * (1 / (1 + x * 0.002));

    const beginPull = (clientY: number) => {
      if (isTokenPage || pathname === "/browser" || refreshingRef.current) return;
      if (scroll.scrollTop === 0) {
        pulling.current = true;
        startY.current = clientY;
      }
    };

    const movePull = (clientY: number) => {
      if (!pulling.current || scroll.scrollTop > 0) return false;
      const diff = clientY - startY.current;
      if (diff <= 0) {
        pulling.current = false;
        currentPull.current = 0;
        return false;
      }

      currentPull.current = rubberBand(diff);
      setTranslateY(currentPull.current);
      updateSpinner(currentPull.current);
      return true;
    };

    const endPull = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (currentPull.current >= THRESHOLD && !refreshingRef.current) {
        setTranslateY(SETTLED_Y, true, "0.8s");
        refreshingRef.current = true;
        setRefreshing(true);
        rotatingIllusionLogged.current = true;

        const wrap = spinnerWrapRef.current;
        if (wrap) {
          wrap.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
          wrap.style.transform = "translateY(0px)";
        }

        const el = spinnerRef.current;
        if (el) {
          el.querySelectorAll<HTMLElement>(".bar").forEach((bar) => {
            bar.style.opacity = "";
          });
        }

        try {
          const delay = 650 + Math.floor(Math.random() * 350);
          await new Promise((resolve) => {
            window.setTimeout(resolve, delay);
          });

          const customMappings: Record<string, string> = {};
          customTokens.forEach((token) => {
            if (token.coingeckoId) {
              customMappings[token.symbol] = token.coingeckoId;
            }
          });

          const freshPrices = await fetchLivePrices(undefined, coingeckoApiKey, baseCurrency, customMappings);
          const merged = { ...getStaticPrices(), ...freshPrices };
          localStorage.setItem("phantom_live_prices", JSON.stringify(merged));
          localStorage.setItem("phantom_live_prices_ts", Date.now().toString());
          window.dispatchEvent(new CustomEvent("prices-updated", { detail: merged }));
        } catch (err) {
          console.warn("[pull-refresh] fetch failed:", err);
        } finally {
          setTranslateY(0, true, "0.8s");
          if (typeof window !== "undefined" && (window as any).triggerHaptic) {
            (window as any).triggerHaptic("success");
          }
          spinnerScaleWrapRef.current?.classList.add("fade-out-exit");
          window.setTimeout(() => {
            updateSpinner(0, true);
            refreshingRef.current = false;
            setRefreshing(false);
            currentPull.current = 0;
          }, 300);
          handleRefreshBoost();
        }
      } else {
        setTranslateY(0, true);
        updateSpinner(0, true);
        currentPull.current = 0;
      }
    };

    const onTouchStart = (event: TouchEvent) => beginPull(event.touches[0].clientY);
    const onTouchMove = (event: TouchEvent) => {
      if (movePull(event.touches[0].clientY)) {
        event.preventDefault();
      }
    };
    const onMouseDown = (event: MouseEvent) => beginPull(event.clientY);
    const onMouseMove = (event: MouseEvent) => {
      movePull(event.clientY);
    };

    scroll.addEventListener("touchstart", onTouchStart, { passive: true });
    scroll.addEventListener("touchmove", onTouchMove, { passive: false });
    scroll.addEventListener("touchend", endPull);
    scroll.addEventListener("touchcancel", endPull);
    scroll.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endPull);

    return () => {
      scroll.removeEventListener("touchstart", onTouchStart);
      scroll.removeEventListener("touchmove", onTouchMove);
      scroll.removeEventListener("touchend", endPull);
      scroll.removeEventListener("touchcancel", endPull);
      scroll.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endPull);
    };
  }, [baseCurrency, coingeckoApiKey, customTokens, handleRefreshBoost, isTokenPage, setTranslateY, updateSpinner]);

  const tokenSymbol = isTokenPage ? decodeURIComponent(pathname.split("/").pop() || "SOL") : "SOL";

  const content = isTokenPage ? (
    <TokenDetailPage params={{ symbol: tokenSymbol }} />
  ) : pathname === "/home" ? (
    <HomePage />
  ) : pathname === "/tokens" ? (
    <TokensPage />
  ) : pathname === "/activity" ? (
    <ActivityPage />
  ) : pathname === "/browser" ? (
    <BrowserPage />
  ) : pathname === "/swap" ? (
    <SwapPage />
  ) : pathname === "/settings" ? (
    <SettingsPage />
  ) : pathname === "/settings/edit-profile" ? (
    <EditProfilePage />
  ) : (
    <div className="px-4 pt-6 pb-32">
      <div className="rounded-[24px] bg-[#1c1c1e] px-5 py-6 text-[#a0a0a0]">
        This tab is still being ported from the legacy Phantom app. Home and token detail are now running on the literal component path.
      </div>
    </div>
  );

  const isScaledDown =
    accountModalVisible ||
    activityVisible ||
    modal === "send" ||
    modal === "receive" ||
    modal === "buy";

  return (
    <div
      className="flex w-full flex-col overflow-hidden relative"
      style={{ backgroundColor: "#111111" }}
    >
      <div
        className="flex h-screen w-full overflow-hidden relative"
        style={{
          backgroundColor: isScaledDown ? "#1c1c1e" : "#111111",
          transformOrigin: "bottom center",
          transform: isScaledDown ? "scale(0.93) translateY(-24px)" : "scale(1) translateY(0px)",
          borderRadius: isScaledDown ? "20px" : "0px",
          filter: isScaledDown ? "brightness(1.15)" : "brightness(1)",
          transition: isScaledDown
            ? "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s cubic-bezier(0.32, 0.72, 0, 1), filter 0.4s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.4s cubic-bezier(0.32, 0.72, 0, 1)"
            : "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.2s cubic-bezier(0.25, 1, 0.5, 1), filter 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
          willChange: "transform, filter, border-radius, background-color",
        }}
      >
        {!isTokenPage && !isSettingsPage && <WalletHeader scrolled={scrolled} onAvatarPress={() => setAccountModalVisible(true)} onActivityPress={() => setActivityVisible(true)} />}
        {!isTokenPage && !isSettingsPage && pathname !== "/browser" && (
          <div
            ref={spinnerWrapRef}
            style={{
              position: "absolute",
              top: "calc(100px + env(safe-area-inset-top))",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div ref={spinnerRotationWrapRef} className="spinner-rotation-wrap">
              <div ref={spinnerScaleWrapRef} className="spinner-scale-wrap">
                <div
                  ref={spinnerRef}
                  className={`refresh-spinner ${refreshing ? "animating" : ""}`}
                  style={{ ["--spinner-color" as string]: "#888888" }}
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="bar"
                      style={{ opacity: 0, transition: "opacity 0.08s linear" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <main
          ref={scrollRef}
          className={`min-h-0 flex-1 wallet-scroll relative ${isTokenPage
              ? "overflow-hidden pb-0 pt-0"
              : pathname === "/browser"
                ? "overflow-y-auto overscroll-y-contain pb-[75px] pt-0"
                : isSettingsPage
                  ? "overflow-y-auto overscroll-y-contain pb-0 pt-0"
                  : "overflow-y-auto overscroll-y-contain pb-[75px] pt-[calc(60px+env(safe-area-inset-top))] md:pt-[60px]"
            }`}
          onScroll={(event) => {
            const nextScrolled = event.currentTarget.scrollTop > 10;
            setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
            scrollbarRef.current?.show();
          }}
        >
          <div
            ref={contentRef}
            className={`h-full ${isTokenPage ? "" : "will-change-transform"}`}
            style={isTokenPage ? undefined : { transform: "translateZ(0)" }}
          >
            {content}
          </div>
        </main>
        <CustomScrollbar
          ref={scrollbarRef}
          scrollRef={scrollRef}
          style={{
            top: isTokenPage || isSettingsPage ? 0 : "calc(60px + env(safe-area-inset-top))",
            bottom: isTokenPage || isSettingsPage ? "calc(env(safe-area-inset-bottom, 0px))" : "calc(65px + env(safe-area-inset-bottom, 0px))",
          }}
        />
        {!isSettingsPage && <WalletFooterNavigation />}
      </div>
      <SendModal initialTokenSymbol={symbol} onClose={closeModal} visible={modal === "send"} />
      <ReceiveModal onClose={closeModal} visible={modal === "receive"} />
      <BuyModal onClose={closeModal} visible={modal === "buy"} />
      <AccountModal 
        visible={accountModalVisible} 
        onClose={() => setAccountModalVisible(false)}
        onOpenProfile={() => { setAccountModalVisible(false); router.push("/settings/edit-profile"); }}
        onOpenSettings={() => { setAccountModalVisible(false); router.push("/settings"); }}
      />
      <RecentActivityModal 
        visible={activityVisible} 
        onClose={() => setActivityVisible(false)} 
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export function StrictWalletApp({ payload }: { payload: WalletBootstrapPayload }) {
  React.useEffect(() => {
    syncStoreFromPayload(payload);
  }, [payload]);

  return (
    <RouterProvider>
      <RiveAssetProvider>
        <WalletRouteBody />
      </RiveAssetProvider>
    </RouterProvider>
  );
}
