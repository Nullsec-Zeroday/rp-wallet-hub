import React from "react";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { CreateWalletTransactionRequest, WalletBootstrapPayload, WalletEvent } from "@rp-wallet/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RouterProvider } from "./shims/router-context";
import { RiveAssetProvider } from "./app/(wallet)/_components/rive-asset-provider";
import WalletHeader from "./app/(wallet)/_components/wallet-header";
import WalletFooterNavigation from "./app/(wallet)/_components/wallet-footer-navigation";
import CustomScrollbar, { type CustomScrollbarRef } from "./app/(wallet)/_components/custom-scrollbar";
import SideDrawer from "./app/(wallet)/_components/side-drawer";
import HomePage from "./app/(wallet)/home/page";
import TokensPage from "./app/(wallet)/tokens/page";
import BrowserPage from "./app/(wallet)/browser/page";
import SwapPage from "./app/(wallet)/swap/page";
import { appEnv } from "./app-env";
import SendModal from "./app/(wallet)/_components/modals/send-modal";
import ReceiveModal from "./app/(wallet)/_components/modals/receive-modal";
import BuyModal from "./app/(wallet)/_components/modals/buy-modal";
import AccountModal from "./app/(wallet)/_components/modals/account-modal";
import RecentActivityModal from "./app/(wallet)/_components/modals/recent-activity-modal";
import ManageTokensModal from "./app/(wallet)/_components/modals/manage-tokens-modal";
import ChatsModal from "./app/(wallet)/_components/modals/chats-modal";
import TokenDetailModal from "./app/(wallet)/_components/modals/token-detail-modal";
import CashModal from "./app/(wallet)/_components/modals/cash-modal";
import SettingsPage from "./app/(wallet)/settings/page";
import EditProfilePage from "./app/(wallet)/settings/edit-profile/page";
import { fetchLivePrices, getStaticPrices } from "./lib/coingecko-service";
import { syncStoreFromPayload } from "./lib/backend-sync";
import { createBackendWalletTransactionsBatch, updateBackendNotificationSettings } from "./lib/backend-wallet";
import { logWalletDebug } from "./lib/wallet-debug";
import { requestNotificationPermission, showSystemNotification } from "./lib/notifications";
import { useWalletStore, type NotificationSettings } from "./lib/wallet-store";
import { isDemoPayload, readCachedBootstrap, requestDemoPaywall } from "@rp-wallet/wallet-core";

type WalletModal = "send" | "receive" | "buy" | "cash" | null;
const api = new RpWalletApiClient(appEnv.apiBaseUrl);
const NOTIFICATION_PERMISSION_PROMPT_KEY = "rp-wallet:phantom:notification-permission-prompted";

function maxIsoDate(left: string, right: string) {
  return Date.parse(right) > Date.parse(left) ? right : left;
}

async function showWalletEventNotification(event: WalletEvent) {
  await showSystemNotification(event.title || "Received", event.body || "Received funds");
}

function buildSimulatedReceive(settings: NotificationSettings) {
  const enabledCoins = settings.coins.filter((coin) => coin.enabled);
  if (enabledCoins.length === 0) return null;

  const coin = enabledCoins[Math.floor(Math.random() * enabledCoins.length)];
  const rawAmount = settings.mode === "Fixed" ? coin.min : Math.random() * (coin.max - coin.min) + coin.min;
  const decimals = coin.symbol === "SOL" || coin.symbol === "ETH" ? 5 : 2;
  const amount = Number(rawAmount.toFixed(decimals));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return {
    amount,
    symbol: coin.symbol.toUpperCase(),
  };
}

function WalletRouteBody() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSettingsPage = pathname.startsWith("/settings");
  const isDemoMode = isDemoPayload(readCachedBootstrap("phantom"));
  const {
    addAccount,
    addTransaction,
    baseCurrency,
    coingeckoApiKey,
    customTokens,
    handleRefreshBoost,
    manageTokensVisible,
    notificationSettings,
    profile,
    setManageTokensVisible,
    updateBalance,
    updateNotificationSettings,
  } = useWalletStore();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLElement | null>(null);
  const scrollbarRef = React.useRef<CustomScrollbarRef>(null);
  const pulling = React.useRef(false);
  const startY = React.useRef(0);
  const currentPull = React.useRef(0);
  const refreshingRef = React.useRef(false);
  const notificationSettingsRef = React.useRef(notificationSettings);
  const walletEventCursorRef = React.useRef(new Date().toISOString());
  const seenWalletEventIdsRef = React.useRef(new Set<string>());
  const spinnerRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerWrapRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerRotationWrapRef = React.useRef<HTMLDivElement | null>(null);
  const spinnerScaleWrapRef = React.useRef<HTMLDivElement | null>(null);
  const allBarsChargedLogged = React.useRef(false);
  const rotatingIllusionLogged = React.useRef(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [accountModalVisible, setAccountModalVisible] = React.useState(false);
  const [activityVisible, setActivityVisible] = React.useState(false);
  const [chatsVisible, setChatsVisible] = React.useState(false);
  const [activityNestedModalOpen, setActivityNestedModalOpen] = React.useState(false);
  const [modalClosing, setModalClosing] = React.useState(false);

  const getRouteIndex = React.useCallback((path: string) => {
    if (path === "/home" || path === "/") return 0;
    if (path === "/swap") return 1;
    if (path === "/browser") return 2;
    return -1;
  }, []);

  const prevPathnameRef = React.useRef(pathname);
  const routeDirectionRef = React.useRef(0);

  if (pathname !== prevPathnameRef.current) {
    const oldIndex = getRouteIndex(prevPathnameRef.current);
    const newIndex = getRouteIndex(pathname);
    if (oldIndex !== -1 && newIndex !== -1) {
      routeDirectionRef.current = newIndex > oldIndex ? 1 : -1;
    } else {
      routeDirectionRef.current = 0;
    }
    prevPathnameRef.current = pathname;
  }
  const routeDirection = routeDirectionRef.current;

  const routeVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : direction > 0 ? -100 : 0,
      opacity: 0
    })
  };

  const activityNestedModalOpenRef = React.useRef(activityNestedModalOpen);
  const [notificationPromptVisible, setNotificationPromptVisible] = React.useState(false);
  const lastOpenedModalRef = React.useRef<string | null>(null);

  const THRESHOLD = 65;
  const SETTLED_Y = 80;
  const SPINNER_PULL_SENSITIVITY = 0.00001;

  React.useEffect(() => {
    notificationSettingsRef.current = notificationSettings;
  }, [notificationSettings]);

  React.useEffect(() => {
    const handleOpenProfileModal = () => setIsDrawerOpen(true);
    const handleOpenAccountModal = () => setAccountModalVisible(true);
    window.addEventListener('open-profile-modal', handleOpenProfileModal);
    window.addEventListener('open-account-modal', handleOpenAccountModal);
    return () => {
      window.removeEventListener('open-profile-modal', handleOpenProfileModal);
      window.removeEventListener('open-account-modal', handleOpenAccountModal);
    };
  }, []);

  React.useEffect(() => {
    if (!notificationSettings.isActive || notificationSettings.remainingTimes > 0) return;

    const stoppedSettings = { ...notificationSettings, isActive: false, remainingTimes: 0 };
    updateNotificationSettings(stoppedSettings);
    updateBackendNotificationSettings(stoppedSettings).catch((error) => {
      console.warn("Unable to persist stopped notification simulator", error);
    });
  }, [notificationSettings, updateNotificationSettings]);

  React.useEffect(() => {
    if (pathname === "/" || pathname === "/bootstrap") {
      router.replace("/home");
    }
    if (isDemoMode && pathname.startsWith("/settings")) {
      requestDemoPaywall("settings");
      router.replace("/home");
    }
  }, [pathname, router]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (window.Notification.permission === "granted" && !notificationSettings.pushEnabled) {
        const nextSettings = { ...notificationSettings, pushEnabled: true };
        updateNotificationSettings(nextSettings);
        updateBackendNotificationSettings(nextSettings).catch((error) => {
          console.warn("Unable to persist notification permission preference", error);
        });
      return;
    }

    if (window.Notification.permission !== "default") return;
    if (window.localStorage.getItem(NOTIFICATION_PERMISSION_PROMPT_KEY)) return;

    setNotificationPromptVisible(true);
  }, [notificationSettings, updateNotificationSettings]);

  const enableNotifications = async () => {
    window.localStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, "1");
    setNotificationPromptVisible(false);

    try {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const nextSettings = { ...notificationSettingsRef.current, pushEnabled: true };
      updateNotificationSettings(nextSettings);
      await updateBackendNotificationSettings(nextSettings);
    } catch (error) {
      console.warn("Unable to request notification permission", error);
    }
  };

  const dismissNotificationPrompt = () => {
    window.localStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, "1");
    setNotificationPromptVisible(false);
  };

  React.useEffect(() => {
    let cancelled = false;

    const pollWalletEvents = async () => {
      try {
        const events = await api.getWalletEvents("phantom", walletEventCursorRef.current);
        if (cancelled || events.length === 0) return;

        let shouldRefresh = false;
        for (const event of events) {
          walletEventCursorRef.current = maxIsoDate(walletEventCursorRef.current, event.createdAt);
          if (seenWalletEventIdsRef.current.has(event.id)) continue;
          seenWalletEventIdsRef.current.add(event.id);
          logWalletDebug("wallet-event:received", {
            accountId: event.accountId,
            eventId: event.id,
            title: event.title,
            transactionId: event.transactionId,
            type: event.type,
          });
          if (event.type === "wallet_received") {
            shouldRefresh = true;
            if (notificationSettings.pushEnabled) {
              await showWalletEventNotification(event);
              logWalletDebug("wallet-event:notified", {
                eventId: event.id,
                transactionId: event.transactionId,
              });
            }
          }
        }

        if (shouldRefresh) {
          const response = await api.getWalletState("phantom");
          if (!cancelled) {
            syncStoreFromPayload(response);
            logWalletDebug("wallet-event:refresh", {
              transactionCount: response.recentTransactions.length,
            });
          }
        }
      } catch (error) {
        console.warn("Unable to poll wallet events", error);
        logWalletDebug("wallet-event:error", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    pollWalletEvents();
    const intervalId = window.setInterval(pollWalletEvents, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [notificationSettings.pushEnabled]);

  React.useEffect(() => {
    if (!notificationSettings.isActive || notificationSettings.remainingTimes <= 0) return;

    const startSettings = notificationSettingsRef.current;
    const intervalMs = getNotificationIntervalMs(startSettings.frequency, startSettings.unit);
    const initialDelay = getNotificationDelayMs(startSettings.initialDelay);
    const pendingTransactions: Array<Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">> = [];
    let timeoutId: number | undefined;
    let cancelled = false;
    let flushed = false;

    const flushPendingTransactions = async () => {
      if (flushed) return;
      flushed = true;

      const finalSettings = notificationSettingsRef.current;
      try {
        if (pendingTransactions.length > 0) {
          await createBackendWalletTransactionsBatch(pendingTransactions);
        }
        await updateBackendNotificationSettings(finalSettings);
      } catch (error) {
        console.warn("Simulated notification batch persist failed", error);
      }
    };

    const stopSimulation = async (settings: NotificationSettings) => {
      const stoppedSettings = { ...settings, isActive: false, remainingTimes: 0 };
      updateNotificationSettings(stoppedSettings);
      notificationSettingsRef.current = stoppedSettings;
      await flushPendingTransactions();
    };

    const run = async () => {
      try {
        const settings = notificationSettingsRef.current;
        if (!settings.isActive || settings.remainingTimes <= 0) {
          await stopSimulation(settings);
          return false;
        }

        const simulated = buildSimulatedReceive(settings);
        if (!simulated) {
          await stopSimulation(settings);
          return false;
        }

        const fromAddress = settings.senderAddress || "7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j";
        const toAddress = profile.walletAddress || "Your Wallet";
        pendingTransactions.push({
          type: "receive",
          tokenSymbol: simulated.symbol,
          amount: String(simulated.amount),
          fromAddress,
          toAddress,
          source: "notification_simulation",
        });

        const currentBalance = useWalletStore.getState().tokenBalances.find((balance) => balance.symbol === simulated.symbol)?.balance ?? 0;
        updateBalance(simulated.symbol, currentBalance + simulated.amount);
        addTransaction({
          type: "receive",
          token: simulated.symbol,
          amount: simulated.amount,
          status: "confirmed",
          from: fromAddress,
          to: toAddress,
        });

        const nextRemaining = settings.remainingTimes - 1;
        const nextSettings = {
          ...settings,
          remainingTimes: nextRemaining,
          isActive: nextRemaining > 0,
        };
        updateNotificationSettings(nextSettings);
        notificationSettingsRef.current = nextSettings;

        if (!cancelled && settings.pushEnabled) {
          await showSystemNotification("Notification", `Received ${simulated.amount} ${simulated.symbol}`);
        }

        if (nextRemaining <= 0) {
          await flushPendingTransactions();
          return false;
        }

        return true;
      } catch (error) {
        console.warn("Simulated notification failed", error);
        return false;
      }
    };

    const scheduleRun = (delayMs: number) => {
      timeoutId = window.setTimeout(async () => {
        const shouldContinue = await run();
        if (!cancelled && shouldContinue) {
          scheduleRun(intervalMs);
        }
      }, delayMs);
    };

    scheduleRun(initialDelay);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      void flushPendingTransactions();
    };
  }, [addTransaction, notificationSettings.isActive, profile.walletAddress, updateBalance, updateNotificationSettings]);

  const modal = searchParams.get("modal") as WalletModal;
  const symbol = searchParams.get("symbol") || undefined;

  React.useEffect(() => {
    if (isDrawerOpen) lastOpenedModalRef.current = "drawer";
    else if (accountModalVisible) lastOpenedModalRef.current = "account";
    else if (activityVisible) lastOpenedModalRef.current = "activity";
    else if (chatsVisible) lastOpenedModalRef.current = "chats";
    else if (modal === "send") lastOpenedModalRef.current = "send";
    else if (modal === "receive") lastOpenedModalRef.current = "receive";
    else if (modal === "buy") lastOpenedModalRef.current = "buy";
    else if (modal === "cash") lastOpenedModalRef.current = "cash";
    else if (manageTokensVisible) lastOpenedModalRef.current = "manageTokens";
  }, [isDrawerOpen, activityVisible, chatsVisible, manageTokensVisible, modal]);

  const closeModal = React.useCallback(() => {
    router.replace(pathname);
    setModalClosing(false);
  }, [pathname, router]);

  React.useEffect(() => {
    if (!isDemoMode || modal !== "buy") return;
    requestDemoPaywall("buy");
    closeModal();
  }, [closeModal, isDemoMode, modal]);

  React.useEffect(() => {
    if (!isDemoMode || !manageTokensVisible) return;
    requestDemoPaywall("manage-tokens");
    setManageTokensVisible(false);
  }, [isDemoMode, manageTokensVisible, setManageTokensVisible]);

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
    const START = 15;
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
      if (refreshingRef.current) return;
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
  }, [baseCurrency, coingeckoApiKey, customTokens, handleRefreshBoost, setTranslateY, updateSpinner]);

  const content = pathname === "/home" ? (
    <HomePage />
  ) : pathname === "/tokens" ? (
    <TokensPage />
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

  const drawerActive = !modalClosing && isDrawerOpen;

  return (
    <div
      className="absolute inset-0 h-screen flex w-full flex-col overflow-hidden"
      style={{
        backgroundColor: "#000000",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <SideDrawer 
        onNavigate={(path) => {
          setIsDrawerOpen(false);
          if (path === "/chats") {
            setTimeout(() => setChatsVisible(true), 300);
            return;
          }
          if (path === "/activity") {
            setTimeout(() => setActivityVisible(true), 300);
            return;
          }
          isDemoMode ? requestDemoPaywall("side-drawer-nav") : router.push(path);
        }} 
      />
      <div
        className="flex h-full w-full overflow-hidden relative z-[10] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
        style={{
          opacity: activityNestedModalOpen ? 0 : 1,
          backgroundColor: drawerActive ? "#1c1c1e" : "#000000",
          transformOrigin: "center left",
          transform: drawerActive 
            ? "translateX(75vw)" 
            : "scale(1) translateY(0px) translateX(0px)",
          borderRadius: drawerActive ? "28px" : "0px",
          filter: drawerActive ? "brightness(0.65)" : "brightness(1)",
          transition: drawerActive || lastOpenedModalRef.current === "drawer"
            ? "opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1), transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.5s cubic-bezier(0.32, 0.72, 0, 1), filter 0.5s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
            : "opacity 0.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.2s cubic-bezier(0.25, 1, 0.5, 1), filter 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
          willChange: "opacity, transform, filter, border-radius, background-color",
        }}
      >
        {/* Overlay to close drawer when tapping on main layout */}
        {drawerActive && (
          <div 
            className="absolute inset-0 z-[99999]" 
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
        {!isSettingsPage && <WalletHeader scrolled={scrolled} onAvatarPress={() => setIsDrawerOpen(true)} onActivityPress={() => setActivityVisible(true)} isDrawerOpen={isDrawerOpen} />}
        {!isSettingsPage && (
          <div
            ref={spinnerWrapRef}
            style={{
              position: "absolute",
              top: "calc(70px + env(safe-area-inset-top))",
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
          className={`min-h-0 flex-1 wallet-scroll relative ${isSettingsPage
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
            className={`h-full will-change-transform`}
            style={{ transform: "translateZ(0)" }}
          >
            <AnimatePresence initial={false} mode="popLayout" custom={routeDirection}>
              <motion.div
                key={pathname}
                custom={routeDirection}
                variants={routeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 350, damping: 30 },
                  opacity: { duration: 0.15 }
                }}
                className="h-full w-full flex-1 min-h-0"
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        { (
          <CustomScrollbar
            ref={scrollbarRef}
            scrollRef={scrollRef}
            style={{
              top: isSettingsPage ? 0 : "calc(60px + env(safe-area-inset-top))",
              bottom: isSettingsPage ? "calc(env(safe-area-inset-bottom, 0px))" : "calc(65px + env(safe-area-inset-bottom, 0px))",
            }}
          />
        )}
        {!isSettingsPage && <WalletFooterNavigation isDrawerOpen={isDrawerOpen} />}
      </div>
      <SendModal initialTokenSymbol={symbol} onClose={closeModal} onCloseStart={() => setModalClosing(true)} visible={modal === "send"} />
      <ReceiveModal onClose={closeModal} onCloseStart={() => setModalClosing(true)} visible={modal === "receive"} />
      <BuyModal onClose={closeModal} onCloseStart={() => setModalClosing(true)} visible={modal === "buy"} />
      <CashModal onClose={closeModal} visible={modal === "cash"} />
      <AccountModal
        visible={accountModalVisible}
        onAddAccount={() => {
          if (isDemoMode) {
            requestDemoPaywall("add-account");
            return false;
          }
          addAccount();
          return true;
        }}
        onCloseStart={() => setModalClosing(true)}
        onClose={() => {
          setAccountModalVisible(false);
          setModalClosing(false);
        }}
        onOpenProfile={() => { setAccountModalVisible(false); setModalClosing(false); isDemoMode ? requestDemoPaywall("edit-profile") : router.push("/settings/edit-profile"); }}
        onOpenSettings={() => { setAccountModalVisible(false); setModalClosing(false); isDemoMode ? requestDemoPaywall("settings") : router.push("/settings"); }}
      />
      <RecentActivityModal
        visible={activityVisible}
        onCloseStart={() => setModalClosing(true)}
        onClose={() => {
          setActivityVisible(false);
          setModalClosing(false);
        }}
        onNestedModalChange={setActivityNestedModalOpen}
      />
      <ManageTokensModal
        visible={manageTokensVisible}
        onCloseStart={() => setModalClosing(true)}
        onClose={() => {
          setManageTokensVisible(false);
          setModalClosing(false);
        }}
      />
      <TokenDetailModal visible={searchParams.get("modal") === "token"} symbol={searchParams.get("symbol")} onClose={() => router.back()} />
      <ChatsModal
        visible={chatsVisible}
        onCloseStart={() => setModalClosing(true)}
        onClose={() => {
          setChatsVisible(false);
          setModalClosing(false);
        }}
      />
      <AnimatePresence>
        {notificationPromptVisible && (
          <motion.div
            key="notification-permission-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/45 px-4 pb-[calc(18px+env(safe-area-inset-bottom))] backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 380, mass: 0.8 }}
              className="w-full max-w-[360px] rounded-[28px] border border-white/10 bg-[#1c1c1e]/95 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45)]"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ab9ff2]/15 text-[#ab9ff2]">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h2 className="text-center text-[20px] font-semibold tracking-[-0.01em] text-white">
                Enable notifications
              </h2>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-[14px] leading-5 text-[#a7a7aa]">
                Get notified when wallet activity arrives, including simulated receives and live incoming transfers.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  className="h-12 w-full rounded-2xl bg-[#ab9ff2] text-[16px] font-semibold text-black active:opacity-80"
                  onClick={enableNotifications}
                  type="button"
                >
                  Enable Notifications
                </button>
                <button
                  className="h-11 w-full rounded-2xl bg-white/[0.06] text-[15px] font-semibold text-white/75 active:bg-white/[0.1]"
                  onClick={dismissNotificationPrompt}
                  type="button"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#2c2c2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
          },
          className: 'flex items-center gap-2',
          duration: 2600,
        }}
      />
    </div>
  );
}

function getNotificationIntervalMs(value: number, unit: "ms" | "sec" | "min" | "hr") {
  const safeValue = Math.max(0, Number(value) || 0);
  if (unit === "hr") return Math.max(250, safeValue * 60 * 60 * 1000);
  if (unit === "min") return Math.max(250, safeValue * 60 * 1000);
  if (unit === "sec") return Math.max(250, safeValue * 1000);
  return Math.max(250, safeValue);
}

function getNotificationDelayMs(value: number) {
  return Math.max(0, Number(value) || 0) * 1000;
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
