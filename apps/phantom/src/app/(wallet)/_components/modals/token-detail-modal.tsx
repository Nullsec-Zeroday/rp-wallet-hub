"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, Share, ArrowDown, X, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKEN_MAP, formatCurrency, CURRENCY_SYMBOLS, TOKENS } from "@/lib/wallet-data";
import { getStaticPriceData, fetchLivePrices, getStaticPrices } from "@/lib/coingecko-service";
import { useLivePrices } from "@/hooks/useLivePrices";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";
import InteractiveChart, { type ChartPoint } from "@/components/wallet/interactive-chart";
import { LongIcon, ShortIcon, ReceiveIcon, SendIcon } from "@/components/wallet/action-icons";
import CustomScrollbar, { CustomScrollbarRef } from "@/app/(wallet)/_components/custom-scrollbar";
import TokenLogo from "@/app/(wallet)/_components/token-logo";

const TIME_FRAMES = ["1H", "1D", "1W", "1M", "YTD", "ALL"];

const CHATTERS = [
  { type: 'emoji', value: '😎' },
  { type: 'image', value: '/avatars/avatar-1.webp' },
  { type: 'emoji', value: '💸' },
  { type: 'image', value: '/avatars/avatar-2.webp' },
  { type: 'emoji', value: '🦊' },
  { type: 'image', value: '/avatars/avatar-3.webp' },
  { type: 'emoji', value: '🚀' },
  { type: 'image', value: '/avatars/avatar-4.webp' },
];

const formatCompact = (num: number) => {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
};

const shortenAddress = (addr: string) => {
  if (!addr) return "—";
  if (addr === "Self" || addr === "External Wallet") return addr;
  return addr.slice(0, 4) + "..." + addr.slice(-4);
};

function getTimeFrameMs(timeFrame: string) {
  if (timeFrame === "1H") return 60 * 60 * 1000;
  if (timeFrame === "1D") return 24 * 60 * 60 * 1000;
  if (timeFrame === "1W") return 7 * 24 * 60 * 60 * 1000;
  if (timeFrame === "1M") return 30 * 24 * 60 * 60 * 1000;
  if (timeFrame === "YTD") return Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime();
  return 365 * 24 * 60 * 60 * 1000;
}

function buildFallbackChartData(timeFrame: string, currentPrice: number, change24h: number): ChartPoint[] {
  const safeCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 1;
  const pointCount = timeFrame === "1H" ? 60 : timeFrame === "1D" ? 48 : 90;
  const now = Date.now();
  const duration = getTimeFrameMs(timeFrame);
  const startPrice = change24h
    ? safeCurrentPrice / (1 + change24h / 100)
    : safeCurrentPrice * 0.985;

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const timestamp = now - duration + duration * progress;
    const trend = startPrice + (safeCurrentPrice - startPrice) * progress;

    const attenuation = Math.pow(1 - progress, 1.5);
    const wave = Math.sin(progress * Math.PI * 5) * safeCurrentPrice * 0.012 * attenuation;
    const micro = Math.sin(progress * Math.PI * 17) * safeCurrentPrice * 0.004 * attenuation;

    const price = index === pointCount - 1 ? safeCurrentPrice : Math.max(0.0000001, trend + wave + micro);
    return { timestamp, price };
  });
}

function ActionButton({ Icon, label, onClick }: {
  Icon: React.ComponentType<{ className?: string, size?: number, strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 bg-[#222222] rounded-[24px] py-[18px] active:scale-[0.93] transition-transform duration-[50ms]"
    >
      <Icon size={24} strokeWidth={2} className="text-[#ac9cf2]" />
      <span className="text-[13px] font-semibold text-[#888888]">{label}</span>
    </button>
  );
}

interface TokenDetailModalProps {
  visible: boolean;
  symbol: string | null;
  onClose: () => void;
}

export default function TokenDetailModal({ visible, symbol, onClose }: TokenDetailModalProps) {
  const router = useRouter();
  const { prices } = useLivePrices();
  const [isClosing, setIsClosing] = useState(false);

  const { tokenBalances, transactions, handleRefreshBoost, baseCurrency, customTokens, coingeckoApiKey, dexscreenerApiKey } = useWalletStore();
  const tokenTransactions = transactions
    .filter(t => symbol && t.token === symbol)
    .sort((a, b) => b.timestamp - a.timestamp);

  const userBalance = tokenBalances.find((b) => b.symbol === symbol)?.balance || 0;

  const token = useMemo(() => {
    if (!symbol) return null;
    if (TOKEN_MAP[symbol]) return TOKEN_MAP[symbol];
    return customTokens.find(t => t.symbol === symbol) || null;
  }, [symbol, customTokens]);

  const [activeTimeFrame, setActiveTimeFrame] = useState("1D");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);

  // High-Performance Pull-to-Refresh
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<CustomScrollbarRef>(null);
  const pulling = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);

  const THRESHOLD = 65;
  const SETTLED_Y = 80;

  const spinnerRef = useRef<HTMLDivElement>(null);
  const spinnerWrapRef = useRef<HTMLDivElement>(null);
  const spinnerRotationWrapRef = useRef<HTMLDivElement>(null);
  const spinnerScaleWrapRef = useRef<HTMLDivElement>(null);
  const allBarsChargedLogged = useRef(false);
  const rotatingIllusionLogged = useRef(false);

  const SPINNER_PULL_SENSITIVITY = 0.00001;

  // Swipe-to-close logic
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderDragging = useRef(false);
  const headerDragStartY = useRef(0);
  const headerCurrentDragY = useRef(0);
  const isSwipeClosing = useRef(false);

  useEffect(() => {
    const header = headerRef.current;
    const modal = modalContainerRef.current;
    if (!header || !modal) return;

    let rafId: number;

    const onTouchStart = (e: TouchEvent) => {
      isHeaderDragging.current = true;
      headerDragStartY.current = e.touches[0].clientY;
      modal.style.transition = 'none';
      modal.style.animation = 'none'; 
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isHeaderDragging.current) return;
      if (e.cancelable) {
        e.preventDefault(); // Stops native jitter/pull-to-refresh
      }
      
      const diff = e.touches[0].clientY - headerDragStartY.current;
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        if (diff > 0) {
          headerCurrentDragY.current = diff;
          modal.style.transform = `translateY(${diff}px)`;
        } else {
          const rubberBand = diff * (1 / (1 + Math.abs(diff) * 0.005));
          modal.style.transform = `translateY(${rubberBand}px)`;
          headerCurrentDragY.current = rubberBand;
        }
      });
    };

    const onTouchEnd = () => {
      if (!isHeaderDragging.current) return;
      isHeaderDragging.current = false;
      if (rafId) cancelAnimationFrame(rafId);

      if (headerCurrentDragY.current > 120) {
        isSwipeClosing.current = true;
        modal.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
        modal.style.transform = `translateY(100vh)`;
        handleClose();
      } else {
        modal.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
        modal.style.transform = 'translateY(0px)';
      }
      headerCurrentDragY.current = 0;
    };

    const onMouseDown = (e: MouseEvent) => {
      isHeaderDragging.current = true;
      headerDragStartY.current = e.clientY;
      modal.style.transition = 'none';
      modal.style.animation = 'none';
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isHeaderDragging.current) return;
      
      const diff = e.clientY - headerDragStartY.current;
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        if (diff > 0) {
          headerCurrentDragY.current = diff;
          modal.style.transform = `translateY(${diff}px)`;
        } else {
          const rubberBand = diff * (1 / (1 + Math.abs(diff) * 0.005));
          modal.style.transform = `translateY(${rubberBand}px)`;
          headerCurrentDragY.current = rubberBand;
        }
      });
    };
    const onMouseUp = () => onTouchEnd();

    header.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    header.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      header.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      header.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setActiveTimeFrame("1D");
    }
  }, [visible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const updateSpinner = (visualPx: number, animated = false) => {
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
      if (isCharged) {
        chargedCount++;
      }
    });

    if (chargedCount === bars.length) {
      if (!allBarsChargedLogged.current) {
        if (typeof window !== "undefined" && (window as any).triggerHaptic) {
          (window as any).triggerHaptic("medium");
        }
        allBarsChargedLogged.current = true;
      }
      const rotWrap = spinnerRotationWrapRef.current;
      if (rotWrap) {
        rotWrap.classList.add("charge-spin");
      }
      el.classList.add("animating");
      if (!rotatingIllusionLogged.current) {
        rotatingIllusionLogged.current = true;
      }
      bars.forEach(bar => { bar.style.opacity = ""; });
    } else {
      const rotWrap = spinnerRotationWrapRef.current;
      if (rotWrap) {
        rotWrap.classList.remove("charge-spin");
      }
      if (!refreshingRef.current) {
        el.classList.remove("animating");
      }
      bars.forEach((bar, i) => {
        const needed = START + (i + 1) * step;
        const isCharged = visualPx >= needed;
        bar.style.opacity = isCharged ? "0.85" : "0";
      });
    }
  };

  const rubberBand = (x: number): number => {
    return x * (1 / (1 + x * 0.002));
  };

  const setTranslateY = (y: number, animated = false, duration = "0.4s") => {
    const el = contentRef.current;
    if (!el) return;
    el.style.transition = animated
      ? `transform ${duration} cubic-bezier(0.16, 1, 0.3, 1)`
      : "none";
    el.style.transform = `translateY(${y}px)`;
    scrollbarRef.current?.update(y);
  };

  useEffect(() => {
    if (refreshing) {
      setTranslateY(SETTLED_Y, true, "0.8s");
    } else if (!pulling.current) {
      setTranslateY(0, true, "0.8s");
    }
  }, [refreshing]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (scroll.scrollTop === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('.interactive-chart-container')) return;

        pulling.current = true;
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || scroll.scrollTop > 0) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff <= 0) { pulling.current = false; return; }

      e.preventDefault();
      currentPull.current = rubberBand(diff);
      setTranslateY(currentPull.current);
      updateSpinner(currentPull.current);
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (currentPull.current >= THRESHOLD && !refreshingRef.current) {
        setTranslateY(SETTLED_Y, true, "0.8s");
        refreshingRef.current = true;
        setRefreshing(true);

        const wrap = spinnerWrapRef.current;
        if (wrap) {
          wrap.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
          wrap.style.transform = "translateY(0px)";
        }
        const el = spinnerRef.current;
        if (el) {
          const bars = el.querySelectorAll<HTMLElement>(".bar");
          bars.forEach(bar => { bar.style.opacity = ""; });
        }

        try {
          const delay = Math.floor(Math.random() * 800);
          await new Promise(r => setTimeout(r, delay));

          const customMappings: Record<string, string> = {};
          customTokens.forEach((t) => {
            if (t.coingeckoId) {
              customMappings[t.symbol] = t.coingeckoId;
            }
          });

          const freshPrices = await fetchLivePrices(undefined, coingeckoApiKey, baseCurrency, customMappings);
          const merged = { ...getStaticPrices(), ...freshPrices };
          localStorage.setItem("phantom_live_prices", JSON.stringify(merged));
          localStorage.setItem("phantom_live_prices_ts", Date.now().toString());
          window.dispatchEvent(new CustomEvent("prices-updated", { detail: merged }));
        } catch (err) {
          console.warn("[pull-refresh-token] fetch failed:", err);
        } finally {
          setTranslateY(0, true, "0.8s");

          if (typeof window !== "undefined" && (window as any).triggerHaptic) {
            (window as any).triggerHaptic("success");
          }

          const scaleWrap = spinnerScaleWrapRef.current;
          if (scaleWrap) {
            scaleWrap.classList.add("fade-out-exit");
          }

          setTimeout(() => {
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

    const onMouseDown = (e: MouseEvent) => {
      if (refreshingRef.current) return;
      if (scroll.scrollTop === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('.interactive-chart-container')) return;

        pulling.current = true;
        startY.current = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!pulling.current || scroll.scrollTop > 0) return;
      const diff = e.clientY - startY.current;
      if (diff <= 0) { pulling.current = false; return; }
      currentPull.current = rubberBand(diff);
      setTranslateY(currentPull.current);
      updateSpinner(currentPull.current);
    };

    const onMouseUp = () => onTouchEnd();

    scroll.addEventListener("touchstart", onTouchStart, { passive: true });
    scroll.addEventListener("touchmove", onTouchMove, { passive: false });
    scroll.addEventListener("touchend", onTouchEnd);
    scroll.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      scroll.removeEventListener("touchstart", onTouchStart);
      scroll.removeEventListener("touchmove", onTouchMove);
      scroll.removeEventListener("touchend", onTouchEnd);
      scroll.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleRefreshBoost, baseCurrency, coingeckoApiKey, customTokens]);

  const [peopleCount, setPeopleCount] = useState(45);
  const [chattingCount, setChattingCount] = useState(1);

  useEffect(() => {
    setPeopleCount(Math.floor(Math.random() * (100 - 20 + 1)) + 20);
    setChattingCount(Math.floor(Math.random() * 3) + 1);

    const interval = setInterval(() => {
      setPeopleCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        const next = prev + change;
        return Math.max(20, Math.min(100, next));
      });

      if (Math.random() > 0.7) {
        setChattingCount((prev) => {
          const next = Math.floor(Math.random() * 3) + 1;
          return next === prev && prev < 4 ? prev + 1 : next;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const activeChatters = useMemo(() => {
    const circlesToShow = Math.min(chattingCount, 3);
    const selected = [];
    const available = [...CHATTERS];

    for (let i = 0; i < circlesToShow; i++) {
      if (available.length === 0) break;
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available.splice(idx, 1)[0]);
    }

    return selected;
  }, [chattingCount]);

  const [tokenDetails, setTokenDetails] = useState({
    marketCap: 0,
    totalSupply: 0,
    circulatingSupply: 0,
    totalVolume: 0,
    description: "",
  });

  const staticData = symbol ? getStaticPriceData(symbol) : { usd: 0, usd_24h_change: 0 };
  const livePrice = prices[symbol || ""]?.usd ?? staticData.usd;
  const liveChange = prices[symbol || ""]?.usd_24h_change ?? staticData.usd_24h_change;
  const currentPrice = hoveredPoint?.price ?? (chartData.length > 0 ? chartData[chartData.length - 1].price : livePrice);

  const positionValue = userBalance * currentPrice;
  const position24hReturn = userBalance * (currentPrice - currentPrice / (1 + liveChange / 100));

  const currentDisplayChange = useMemo(() => {
    if (chartData.length < 2) return liveChange ?? 0;
    const startPrice = chartData[0].price;
    const endPrice = hoveredPoint?.price ?? chartData[chartData.length - 1].price;
    return ((endPrice - startPrice) / Math.abs(startPrice)) * 100;
  }, [liveChange, chartData, hoveredPoint]);

  const absoluteChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const startPrice = chartData[0].price;
    const endPrice = hoveredPoint?.price ?? chartData[chartData.length - 1].price;
    return endPrice - startPrice;
  }, [chartData, hoveredPoint]);

  useEffect(() => {
    async function loadChart() {
      if (!token) return;
      setIsLoading(true);
      const fallbackData = buildFallbackChartData(activeTimeFrame, livePrice, liveChange);
      try {
        const res = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/chart?symbol=${token.symbol}&id=${token.coingeckoId || ''}&timeframe=${activeTimeFrame}&currency=${baseCurrency.toLowerCase()}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ''}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data) && data.length > 1) {
          const mappedData = data
            .map(([timestamp, price]) => ({ timestamp: Number(timestamp), price: Number(price) }))
            .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0);
          setChartData(mappedData.length > 1 ? mappedData : fallbackData);
        } else {
          setChartData(fallbackData);
        }
      } catch (err) {
        setChartData(fallbackData);
      }
      setIsLoading(false);
    }
    loadChart();
  }, [token, activeTimeFrame, baseCurrency, dexscreenerApiKey, livePrice, liveChange]);

  useEffect(() => {
    async function loadDetails() {
      if (!token) return;
      try {
        const res = await fetch(`${appEnv.apiBaseUrl || apiDefaults.localBaseUrl}/token-details?symbol=${token.symbol}&id=${token.coingeckoId || ''}&currency=${baseCurrency.toLowerCase()}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setTokenDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch token details:", err);
      }
    }
    loadDetails();
  }, [token]);

  if (!visible && !isClosing) return null;

  const isPositiveChange = currentDisplayChange >= 0;
  const absoluteValueColor = isPositiveChange ? "var(--color-phantom-green)" : "var(--color-phantom-red)";

  const formatVal = (val: number, isCompact = false) => {
    if (val === 0) return formatCurrency(0, baseCurrency);
    if (isCompact && val > 1000) return `${CURRENCY_SYMBOLS[baseCurrency] || '$'}${formatCompact(val)}`;
    return formatCurrency(val, baseCurrency);
  };

  const handleScroll = () => {
    scrollbarRef.current?.show();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        pointerEvents: visible || isClosing ? "auto" : "none",
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent transition-opacity"
        style={{
          opacity: isClosing ? 0 : 1,
          transitionDuration: "0.2s",
        }}
        onClick={handleClose}
      />

      <div
        ref={modalContainerRef}
        className="w-full flex flex-col rounded-t-[28px] overflow-hidden relative"
        style={{
          background: "rgb(0, 0, 0)",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? (isSwipeClosing.current ? "none" : "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards")
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >
        {/* Draggable Header Area */}
        <div ref={headerRef} className="cursor-grab active:cursor-grabbing w-full flex flex-col flex-shrink-0 z-20">
          {/* Grab Handle */}
          <div className="w-full flex justify-center pt-3 pb-3">
            <div className="w-9 h-[5px] bg-[#333333] rounded-full" />
          </div>

          {token && (
            <div className="px-4 pt-2 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <TokenLogo
                  token={token}
                  size={42}
                  liveImage={prices[token.symbol]?.image}
                  hideChainIcon={token.symbol === "USDC"}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-[18px]">{token.name}</span>
                    <img src="/icons/verified_highlighted.webp" alt="Verified" style={{ width: 16, height: 16, flexShrink: 0, objectFit: 'contain' }} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4FE862]"></div>
                    <span className="text-[#888888] text-[13px]">{peopleCount} people here</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-1.5 rounded-full font-bold text-[14px] text-white border border-[#333333] active:opacity-70 shrink-0">Follow</button>
                <button className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center text-white active:opacity-60 shrink-0">
                  <Share size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}
        </div>

        {token && (
          <>
            <div
              ref={spinnerWrapRef}
              className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
              style={{ top: "80px" }}
            >
              <div ref={spinnerRotationWrapRef} className="spinner-rotation-wrap">
                <div ref={spinnerScaleWrapRef} className="spinner-scale-wrap">
                  <div
                    ref={spinnerRef}
                    className={`refresh-spinner ${refreshing ? "animating" : ""}`}
                    style={{ ['--spinner-color' as string]: '#888888' }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bar" style={{ opacity: 0, transition: "opacity 0.08s linear" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[100px] relative"
            >
              <div ref={contentRef} className="h-full pt-2">

                <div className="px-4 pt-1 pb-3" style={{ minHeight: "110px" }}>
                  <div className="text-white font-medium" style={{ fontSize: 42, lineHeight: "48px", letterSpacing: "-0.03em", fontWeight: 600 }}>
                    {formatVal(currentPrice)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="font-medium"
                      style={{ color: isPositiveChange ? "var(--color-phantom-green)" : "var(--color-phantom-red)", fontSize: 15, letterSpacing: "-0.01em" }}
                    >
                      {isPositiveChange ? "+" : "-"}{formatVal(Math.abs(absoluteChange))}
                    </span>
                    <span
                      className="font-bold rounded-md"
                      style={{
                        backgroundColor: isPositiveChange ? "var(--color-phantom-green)" : "var(--color-phantom-red)",
                        color: "#000000",
                        fontSize: 13,
                        padding: "2px 8px",
                      }}
                    >
                      {isPositiveChange ? "+" : ""}{currentDisplayChange.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  {isLoading ? (
                    <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none" style={{ height: "200px" }}>
                      <div className="absolute left-0 right-0 border-t border-dashed border-[#333] w-full" />
                    </div>
                  ) : (
                    <div className="w-full relative select-none interactive-chart-container" style={{ height: "200px" }}>
                      <InteractiveChart
                        data={chartData}
                        color={absoluteValueColor}
                        onPointSelected={setHoveredPoint}
                        height={200}
                        timeFrame={activeTimeFrame}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 px-6 mt-4">
                  {TIME_FRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeFrame(tf)}
                      className="px-4 py-1.5 rounded-xl transition-colors"
                      style={{
                        background: activeTimeFrame === tf ? "rgb(42, 42, 42)" : "transparent",
                        color: activeTimeFrame === tf ? "#ac9cf2" : "rgb(136, 136, 136)",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3 px-4 py-2">
                  <ActionButton Icon={LongIcon} label="Long" />
                  <ActionButton Icon={ShortIcon} label="Short" />
                  {userBalance > 0 ? (
                    <ActionButton Icon={SendIcon} label="Send" onClick={() => {
                      onClose();
                      router.push(`?modal=send&symbol=${symbol}`);
                    }} />
                  ) : (
                    <ActionButton Icon={ReceiveIcon} label="Receive" />
                  )}
                  <ActionButton Icon={MoreHorizontal} label="More" />
                </div>

                <div className="mx-4 mt-4 mb-6 p-4 rounded-[24px] flex items-center justify-between bg-[#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {activeChatters.map((chatter, idx) => (
                        <div
                          key={idx}
                          className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[15px] border-2 border-[#1a1a1a] overflow-hidden"
                        >
                          {chatter.type === 'emoji' ? (
                            chatter.value
                          ) : (
                            <img src={chatter.value} alt="Chatter" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-white text-[15px] font-medium ml-1">{chattingCount} chatting...</span>
                  </div>
                  <button className="text-white/90 font-bold text-[14px] active:opacity-70 px-4 py-2 bg-[#2a2a2a] rounded-xl">Join Chat</button>
                </div>

                <div className="px-4 mb-5">
                  <h2 className="text-white font-semibold text-[17px] mb-3">Position</h2>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 rounded-[20px] p-4 bg-[#1a1a1a]">
                      <div className="text-[#888888] text-[13px] font-medium mb-1">Value</div>
                      <div className="text-white font-semibold text-[19px]">{formatVal(positionValue)}</div>
                    </div>
                    <div className="flex-1 rounded-[20px] p-4 bg-[#1a1a1a]">
                      <div className="text-[#888888] text-[13px] font-medium mb-1">Balance</div>
                      <div className="text-white font-semibold text-[19px]">{userBalance > 0 ? userBalance.toFixed(5) : "0"}</div>
                    </div>
                  </div>
                  <div className="rounded-[20px] px-4 py-4 flex items-center justify-between bg-[#1a1a1a]">
                    <span className="text-[#888888] text-[15px] font-medium">24h Return</span>
                    <span className="font-semibold text-[15px]" style={{ color: position24hReturn >= 0 ? "var(--color-phantom-green)" : "var(--color-phantom-red)" }}>
                      {position24hReturn > 0 ? "+" : position24hReturn < 0 ? "-" : ""}{formatVal(Math.abs(position24hReturn))}
                    </span>
                  </div>
                </div>

                <div className="px-4 mb-5">
                  <h2 className="text-white font-semibold text-[17px] mb-3">Activity</h2>
                  <div className="flex flex-col gap-2">
                    {tokenTransactions.length === 0 ? (
                      <p className="text-[#888888] text-sm ml-1">No recent activity.</p>
                    ) : tokenTransactions.slice(0, 3).map(tx => {
                      const isReceive = tx.type === "receive";
                      const isSwap = tx.type === "swap";

                      const getTokenInfo = (sym: string) => {
                        const staticToken = TOKENS.find((entry) => entry.symbol === sym);
                        if (staticToken) return staticToken;
                        return customTokens.find((entry) => entry.symbol === sym) || TOKENS[0];
                      };

                      let amountStr = "";
                      if (isSwap) {
                        amountStr = tx.toAmount ? `+${tx.toAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${tx.toToken}` : "";
                      } else {
                        amountStr = `${isReceive ? "+" : "-"}${tx.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${tx.token}`;
                      }

                      return (
                        <button
                          key={tx.id}
                          className="flex items-center px-4 py-[14px] text-left active:scale-[0.98] transition-transform w-full bg-[#1a1a1a] rounded-[20px]"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {isSwap ? (
                              <div className="relative flex-shrink-0 mr-3 w-[44px] h-[44px]">
                                <div className="absolute top-0 left-0 z-0">
                                  <TokenLogo
                                    token={getTokenInfo(tx.toToken || "USDC")}
                                    size={30}
                                    liveImage={prices[tx.toToken || "USDC"]?.image}
                                    hideChainIcon
                                  />
                                </div>
                                <div className="absolute -bottom-1 -right-1 z-10 rounded-full border-[2.5px] border-[#1a1a1a] bg-[#1a1a1a]">
                                  <TokenLogo
                                    token={token}
                                    size={30}
                                    liveImage={prices[token.symbol]?.image}
                                    hideChainIcon
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="relative flex-shrink-0 mr-3">
                                <TokenLogo
                                  token={token}
                                  size={44}
                                  liveImage={prices[token.symbol]?.image}
                                  hideChainIcon
                                />
                                <div
                                  className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full flex items-center justify-center border-[2.5px] border-[#1a1a1a]"
                                  style={{ backgroundColor: isReceive ? "#ab9ff2" : "#3b82f6" }}
                                >
                                  {isReceive ? (
                                    <ArrowDown size={12} color="#000000" strokeWidth={3} />
                                  ) : (
                                    <img src="/icons/send_icon_highlighted.webp" alt="Send" style={{ width: 12, height: 12, objectFit: 'contain', marginLeft: '-1px' }} />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-[#ffffff] font-semibold text-[16px] leading-tight truncate">
                                  {isSwap ? "Swapped" : isReceive ? "Received" : "Sent"}
                                </div>
                                <div
                                  className="font-semibold text-[15px] leading-tight flex-shrink-0 text-right"
                                  style={{ color: isReceive || isSwap ? "#4FE862" : "#f3f3f3" }}
                                >
                                  {amountStr}
                                </div>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="text-[#888888] text-[14px] font-medium leading-tight truncate">
                                  {isSwap ? (
                                    "Ph4ntom"
                                  ) : isReceive ? (
                                    `From ${shortenAddress(tx.from)}`
                                  ) : (
                                    `To ${shortenAddress(tx.to)}`
                                  )}
                                </div>
                                {isSwap && (
                                  <div className="text-[#888888] text-[14px] font-medium leading-tight flex-shrink-0 text-right">
                                    {`-${tx.amount} ${tx.token}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-4 mb-5 pb-20">
                  <h2 className="text-white font-semibold text-[17px] mb-3">Info</h2>
                  <div className="bg-[#1a1a1a] rounded-[20px] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                      <span className="text-[#888888] text-[15px] font-medium">Market Cap</span>
                      <span className="text-white font-semibold text-[15px]">{tokenDetails.marketCap ? formatVal(tokenDetails.marketCap, true) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4">
                      <span className="text-[#888888] text-[15px] font-medium">Total Supply</span>
                      <span className="text-white font-semibold text-[15px]">{tokenDetails.totalSupply ? formatCompact(tokenDetails.totalSupply) : "—"}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Floating Buy Button */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
              <div className="max-w-[430px] mx-auto flex w-full pointer-events-auto">
                <button
                  onClick={() => {
                    onClose();
                    router.push('?modal=buy');
                  }}
                  className="flex-1 h-14 rounded-full font-bold text-[18px] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(171,159,242,0.15)]"
                  style={{ background: "#ac9cf2", color: "#000000" }}
                >
                  Buy
                </button>
              </div>
            </div>

            <CustomScrollbar
              ref={scrollbarRef}
              scrollRef={scrollRef}
              style={{
                top: 80,
                bottom: 80
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
