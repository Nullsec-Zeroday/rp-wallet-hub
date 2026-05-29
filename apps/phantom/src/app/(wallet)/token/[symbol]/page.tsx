"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, Share } from "lucide-react";
import { ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKEN_MAP, formatCurrency, CURRENCY_SYMBOLS, TOKENS } from "@/lib/wallet-data";
import { getStaticPriceData, fetchLivePrices, getStaticPrices } from "@/lib/coingecko-service";
import { useLivePrices } from "@/hooks/useLivePrices";
import WalletFooterNavigation from "@/app/(wallet)/_components/wallet-footer-navigation";
import { apiDefaults } from "@rp-wallet/config";
import { appEnv } from "@/app-env";

import InteractiveChart, { type ChartPoint } from "@/components/wallet/interactive-chart";
import { LongIcon, ShortIcon, ReceiveIcon, MoreIcon, SendIcon } from "@/components/wallet/action-icons";
import CustomScrollbar, { CustomScrollbarRef } from "@/app/(wallet)/_components/custom-scrollbar";
import TokenLogo from "@/app/(wallet)/_components/token-logo";


const TIME_FRAMES = ["1H", "1D", "1W", "1M", "YTD", "ALL"];

const CHATTERS = [
  { type: 'emoji', value: '😎' },
  { type: 'image', value: '/avatars/avatar-1.webp' },
  { type: 'emoji', value: '💸' },
  { type: 'emoji', value: '🎩' },
  { type: 'image', value: '/avatars/avatar-2.webp' },
  { type: 'emoji', value: '💰' },
  { type: 'emoji', value: '🦊' },
  { type: 'image', value: '/avatars/avatar-3.webp' },
  { type: 'emoji', value: '💎' },
  { type: 'emoji', value: '🐶' },
  { type: 'image', value: '/avatars/avatar-4.webp' },
  { type: 'emoji', value: '🚀' },
  { type: 'emoji', value: '🐱' },
  { type: 'image', value: '/avatars/avatar-5.webp' },
  { type: 'emoji', value: '🤑' },
  { type: 'emoji', value: '🤖' },
  { type: 'image', value: '/avatars/avatar-6.webp' },
  { type: 'emoji', value: '💹' },
  { type: 'emoji', value: '🔥' },
  { type: 'emoji', value: '🌔' },
  { type: 'emoji', value: '👑' },
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
    
    // Smoothly fade out the wave as progress approaches 1 to prevent a sharp drop at the end
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
      className="flex flex-col items-center justify-center gap-1.5 bg-[#232323] rounded-2xl py-4 active:scale-[0.93] transition-transform duration-[50ms]"
    >
      <Icon size={24} strokeWidth={2} className="text-[#ac9cf2]" />
      <span className="text-xs font-bold" style={{ color: "rgb(180, 180, 180)" }}>{label}</span>
    </button>
  );
}



// ── Main Page ──
export default function TokenDetailPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  const router = useRouter();
  const { prices } = useLivePrices();

  // State
  const { tokenBalances, transactions, handleRefreshBoost, baseCurrency, customTokens, coingeckoApiKey, dexscreenerApiKey } = useWalletStore();
  const tokenTransactions = transactions
    .filter(t => t.token === symbol)
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

  // High-Performance Pull-to-Refresh (Direct DOM)
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<CustomScrollbarRef>(null);
  const pulling = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);

  const THRESHOLD = 110;   // visual px to trigger
  const SETTLED_Y = 140;   // visual ceiling

  const spinnerRef = useRef<HTMLDivElement>(null);
  const spinnerWrapRef = useRef<HTMLDivElement>(null);
  const spinnerRotationWrapRef = useRef<HTMLDivElement>(null);
  const spinnerScaleWrapRef = useRef<HTMLDivElement>(null);
  const allBarsChargedLogged = useRef(false);
  const rotatingIllusionLogged = useRef(false);

  const SPINNER_PULL_SENSITIVITY = 0.00001;

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

  // Social Stats State
  const [peopleCount, setPeopleCount] = useState(45);
  const [chattingCount, setChattingCount] = useState(1);

  useEffect(() => {
    // Start with random initial values
    setPeopleCount(Math.floor(Math.random() * (100 - 20 + 1)) + 20);
    setChattingCount(Math.floor(Math.random() * 3) + 1);

    // Fluctuate counts randomly every 3 seconds
    const interval = setInterval(() => {
      setPeopleCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + change;
        return Math.max(20, Math.min(100, next));
      });

      // 30% chance to change chatting count
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
    // Determine how many circles to show based on chattingCount
    const circlesToShow = Math.min(chattingCount, 3);

    // Pick unique random chatters
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
  const livePrice = prices[symbol]?.usd ?? staticData.usd;
  const liveChange = prices[symbol]?.usd_24h_change ?? staticData.usd_24h_change;
  const currentPrice = hoveredPoint?.price ?? (chartData.length > 0 ? chartData[chartData.length - 1].price : livePrice);

  // Position calcs
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

  // Fetch chart data
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
          console.error("Invalid chart data format:", data);
          setChartData(fallbackData);
        }
      } catch (err) {
        console.error("Failed to fetch chart:", err);
        setChartData(fallbackData);
      }
      setIsLoading(false);
    }
    loadChart();
  }, [token, activeTimeFrame, baseCurrency, dexscreenerApiKey, livePrice, liveChange]);

  // Fetch token details
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

  if (!token) return null;

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
    <div className="flex flex-col h-full overflow-hidden bg-pt-bg relative">
      <div className="flex-1 flex flex-col min-h-0 relative z-10">

        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 pb-3 pt-[calc(16px+env(safe-area-inset-top))] md:pt-4"
          style={{
            backgroundColor: "#111111",
          }}
        >
          <button className="text-white active:opacity-60 shrink-0" onClick={() => router.back()}>
            <ChevronLeft size={26} strokeWidth={2} />
          </button>
          <TokenLogo
            token={token}
            size={40}
            liveImage={prices[token.symbol]?.image}
            hideChainIcon={token.symbol === "USDC"}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-lg">{token.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}><path fill="#ac9cf2" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.042 1.041l-.257 3.223a1.136 1.136 0 0 1-.268.646l-2.097 2.46a1.136 1.136 0 0 0 0 1.474l2.097 2.46c.155.182.249.408.268.646l.257 3.223c.044.556.486.997 1.042 1.041l3.222.257c.238.02.464.113.646.268l2.46 2.097a1.136 1.136 0 0 0 1.474 0l2.46-2.097c.182-.155.408-.249.646-.268l3.223-.257a1.136 1.136 0 0 0 1.041-1.041l.258-3.223c.019-.238.112-.464.267-.646l2.097-2.46a1.136 1.136 0 0 0 0-1.474l-2.097-2.46a1.136 1.136 0 0 1-.267-.646l-.258-3.223a1.136 1.136 0 0 0-1.041-1.041l-3.223-.257a1.136 1.136 0 0 1-.646-.268z"></path><path fill="#0c0c0c" d="M16.814 9.581a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path></svg>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0ba56a]"></div>
              <span className="text-[#888888] text-xs">{peopleCount} people here</span>
            </div>
          </div>
          <button className="px-4 py-1.5 rounded-xl font-bold text-sm text-white border border-[#444] active:opacity-70 shrink-0">Follow</button>
          <button className="text-white active:opacity-60 shrink-0">
            <Share size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Local Pull-to-Refresh Spinner - Fixed below header */}
        <div
          ref={spinnerWrapRef}
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
          style={{
            top: "calc(100px + env(safe-area-inset-top))", // Match home page exactly
          }}
        >
          <div
            ref={spinnerRotationWrapRef}
            className="spinner-rotation-wrap"
          >
            <div
              ref={spinnerScaleWrapRef}
              className="spinner-scale-wrap"
            >
              <div
                ref={spinnerRef}
                className={`refresh-spinner ${refreshing ? "animating" : ""}`}
                style={{ ['--spinner-color' as string]: '#888888' }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{ opacity: 0, transition: "opacity 0.08s linear" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-48 relative pt-[calc(68px+env(safe-area-inset-top))]`}
        >
          <div
            ref={contentRef}
            className="h-full"
          >

            <div className="px-4 pt-2 pb-3" style={{ minHeight: "110px" }}>
              <div className="text-white font-medium" style={{ fontSize: 38, lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: 600 }}>
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
                  className="font-bold rounded-sm"
                  style={{
                    backgroundColor: isPositiveChange ? "var(--color-phantom-green)" : "var(--color-phantom-red)",
                    color: "#000000",
                    fontSize: 13,
                    padding: "1px 7px",
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

            <div className="flex items-center justify-between p-4">
              {TIME_FRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeFrame(tf)}
                  className="flex-1 py-1 rounded-sm font-semibold text-sm"
                  style={{
                    background: activeTimeFrame === tf ? "rgb(42, 42, 42)" : "transparent",
                    color: activeTimeFrame === tf ? "#ac9cf2" : "rgb(136, 136, 136)"
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 p-4">
              {userBalance > 0 ? (
                <ActionButton Icon={SendIcon} label="Send" onClick={() => router.push(`/home?modal=send&symbol=${symbol}`)} />
              ) : (
                <ActionButton Icon={ReceiveIcon} label="Receive" />
              )}
              <ActionButton Icon={LongIcon} label="Long" />
              <ActionButton Icon={ShortIcon} label="Short" />
              <ActionButton Icon={MoreIcon} label="More" />
            </div>

            <div className="mx-4 mt-2 mb-8 p-4 rounded-2xl flex items-center justify-between" style={{ background: "rgb(30, 30, 30)" }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {activeChatters.map((chatter, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm border-2 border-[#232323] overflow-hidden"
                    >
                      {chatter.type === 'emoji' ? (
                        chatter.value
                      ) : (
                        <img src={chatter.value} alt="Chatter" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[#d3d3d3] text-sm">{chattingCount} chatting...</span>
              </div>
              <button className="text-white/90 font-semibold text-sm active:opacity-70 px-4 py-2.5 bg-[#1a1a1a] rounded-lg">Join Chat</button>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg mb-2">Position</h2>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 rounded-2xl p-4" style={{ background: "rgb(26, 26, 26)" }}>
                  <div className="text-[#888888] text-sm mb-1">Value</div>
                  <div className="text-white font-medium text-lg">{formatVal(positionValue)}</div>
                </div>
                <div className="flex-1 rounded-2xl p-4" style={{ background: "rgb(26, 26, 26)" }}>
                  <div className="text-[#888888] text-sm mb-1">Balance</div>
                  <div className="text-white font-medium text-lg">{userBalance > 0 ? userBalance.toFixed(5) : "0"}</div>
                </div>
              </div>
              <div className="rounded-xl px-4 py-4 flex items-center justify-between" style={{ background: "rgb(26, 26, 26)" }}>
                <span className="text-[#888888] text-base">24h Return</span>
                <span className="font-medium text-base" style={{ color: position24hReturn >= 0 ? "var(--color-phantom-green)" : "var(--color-phantom-red)" }}>
                  {position24hReturn > 0 ? "+" : position24hReturn < 0 ? "-" : ""}{formatVal(Math.abs(position24hReturn))}
                </span>
              </div>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg">Activity</h2>
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
                      className="flex items-center px-4 py-[14px] text-left active:scale-[0.98] transition-transform w-full bg-[#222222] rounded-[20px]"
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
                            <div className="absolute -bottom-1 -right-1 z-10 rounded-full border-[2.5px] border-[#222222] bg-[#222222]">
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
                              className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full flex items-center justify-center border-[2.5px] border-[#222222]"
                              style={{ backgroundColor: isReceive ? "#ab9ff2" : "#3b82f6" }}
                            >
                              {isReceive ? (
                                <ArrowDown size={12} color="#000000" strokeWidth={3} />
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="-ml-[1px]">
                                  <path d="m10 14 1.086 3.802c.831 2.909 4.958 2.898 5.774-.015L20.04 6.424c.42-1.502-.963-2.886-2.465-2.465L6.213 7.14c-2.913.816-2.924 4.943-.015 5.774zm0 0 3-3" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-[#eeeeee] font-semibold text-[16px] leading-tight truncate">
                              {isSwap ? "Swapped" : isReceive ? "Received" : "Sent"}
                            </div>
                            <div
                              className="font-semibold text-[15px] leading-tight flex-shrink-0 text-right"
                              style={{ color: isReceive || isSwap ? "rgb(48, 164, 108)" : "#f3f3f3" }}
                            >
                              {amountStr}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-[#b4b4b4] text-[14px] font-medium leading-tight truncate">
                              {isSwap ? (
                                "Phantom"
                              ) : isReceive ? (
                                `From ${shortenAddress(tx.from)}`
                              ) : (
                                `To ${shortenAddress(tx.to)}`
                              )}
                            </div>
                            {isSwap && (
                              <div className="text-[#cdcdcd] text-[14px] font-medium leading-tight flex-shrink-0 text-right">
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

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg mb-3">24h Performance</h2>
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Volume</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 font-medium text-base">{tokenDetails.totalVolume ? formatVal(tokenDetails.totalVolume, true) : "—"}</span>
                    <span className="font-medium text-base" style={{ color: (liveChange * 1.5) > 0 ? "var(--color-phantom-green)" : "var(--color-phantom-red)" }}>
                      {(liveChange * 1.5) > 0 ? "+" : ""}{(liveChange * 1.5).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottomWidth: "medium", borderBottomStyle: "none" }}>
                  <span className="text-[#888888] text-base">Traders</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 font-semibold text-base">{tokenDetails.totalVolume ? formatCompact(tokenDetails.totalVolume * 0.000042) : "—"}</span>
                    <span className="font-medium text-smbase" style={{ color: (liveChange * 0.8) > 0 ? "var(--color-phantom-green)" : "var(--color-phantom-red)" }}>
                      {(liveChange * 0.8) > 0 ? "+" : ""}{(liveChange * 0.8).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg mb-3">Perps Position</h2>
              <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:opacity-70" style={{ background: "rgb(26, 26, 26)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgb(46, 16, 101)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-base">Trade {token.symbol} perp</div>
                  <div className="text-[#888888] text-sm">Multiply your P&L up to 20×</div>
                </div>
              </button>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg mb-3">Your Stake</h2>
              <div className="rounded-2xl p-4 overflow-hidden relative" style={{ background: "rgb(13, 31, 23)" }}>
                <div className="text-[#888888] text-sm font-semibold mb-1">Stake with Phantom</div>
                <div className="text-white font-bold text-xl mb-4">Earn <span style={{ color: "rgb(11, 165, 106)" }}>3.22%</span> per year</div>
                <svg viewBox="0 0 300 80" className="w-full" style={{ height: "80px" }}>
                  <defs>
                    <linearGradient id="stakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ba56a" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#0ba56a" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M 0 75 Q 75 70 150 50 Q 225 30 300 5" fill="none" stroke="#0ba56a" strokeWidth="2" strokeDasharray="6 4"></path>
                  <path d="M 0 75 Q 75 70 150 50 Q 225 30 300 5 L 300 80 L 0 80 Z" fill="url(#stakeGrad)"></path>
                </svg>
              </div>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/60 font-medium text-lg mb-3">Info</h2>
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Name</span>
                  <span className="text-white font-medium text-base">{token.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Symbol</span>
                  <span className="text-white font-medium text-base">{token.symbol}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Network</span>
                  <span className="text-white font-medium text-base">{token.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Market Cap</span>
                  <span className="text-white font-medium text-base">{tokenDetails.marketCap ? formatVal(tokenDetails.marketCap, true) : "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgb(42, 42, 42)" }}>
                  <span className="text-[#888888] text-base">Total Supply</span>
                  <span className="text-white font-medium text-base">{tokenDetails.totalSupply ? formatCompact(tokenDetails.totalSupply) : "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4" style={{ borderBottomWidth: "medium", borderBottomStyle: "none" }}>
                  <span className="text-[#888888] text-base">Circulating Supply</span>
                  <span className="text-white font-medium text-base">{tokenDetails.circulatingSupply ? formatCompact(tokenDetails.circulatingSupply) : "—"}</span>
                </div>
              </div>
            </div>

            <div className="px-4 mb-5">
              <h2 className="text-white/80 font-semibold text-xl mb-2">About</h2>
              <p className="text-[#cccccc] text-base leading-relaxed" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: showFullAbout ? 999 : 3, WebkitBoxOrient: "vertical" }} dangerouslySetInnerHTML={{ __html: tokenDetails.description || `${token.name} is a cryptocurrency token.` }} />
              <button onClick={() => setShowFullAbout(!showFullAbout)} className="text-[#ac9cf2] text-sm font-semibold mt-1">
                {showFullAbout ? "Show Less" : "Show More"}
              </button>
            </div>

            <div className="px-4 mb-5">
              <button className="flex items-center gap-2 px-4 py-3 rounded-2xl active:opacity-70" style={{ background: "rgb(26, 26, 26)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span className="text-[#888888] text-sm font-semibold">Website</span>
              </button>
            </div>

            <div className="px-4 mb-4 pb-[80px]">
              <p className="text-[#555555] text-xs leading-relaxed">
                Past performance is not an indicator of future performance. Estimated APY is based in part on network inflation rates outside of Phantom's control and may decrease over time. Trading perpetual contracts involves significant risk.
              </p>
            </div>
          </div>

          {/* Fixed Buy/Sell buttons above Navigation */}
          <div
            className="fixed left-0 right-0 px-4 z-40 pointer-events-auto"
            style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="max-w-[430px] mx-auto flex gap-2 w-full">
              <button
                onClick={() => router.push('/home?modal=buy')}
                className="flex-1 h-12 rounded-xl font-bold text-[17px] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                style={{ background: "rgb(172, 156, 242)", color: "rgb(17, 17, 17)" }}
              >
                Buy
              </button>
              {userBalance > 0 && (
                <button className="flex-1 h-12 rounded-xl font-bold text-[17px] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]" style={{ background: "rgb(172, 156, 242)", color: "rgb(17, 17, 17)" }}>Sell</button>
              )}
            </div>
          </div>
        </div>
      </div>
      <CustomScrollbar
        ref={scrollbarRef}
        scrollRef={scrollRef}
        style={{
          top: "calc(60px + env(safe-area-inset-top))",
          bottom: 0
        }}
      />
      <WalletFooterNavigation activeTabOverride="/home" blurred={false} />
    </div>

  );
}
