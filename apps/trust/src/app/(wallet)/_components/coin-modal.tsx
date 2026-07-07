import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTrustCoinChart, type TrustChartTimeframe } from "@/hooks/useTrustCoinChart";
import { useTrustTokenDetails } from "@/hooks/useTrustTokenDetails";
import { formatTrustBalance, formatTrustCurrency, getTrustToken } from "@/lib/trust-token-data";
import { useTrustWallet } from "@/lib/trust-wallet-context";
import SendModal from "./send-modal";

export interface CoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 2 : 4,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function stripHtml(value: string) {
  if (!value) return "";
  if (typeof window === "undefined") return value.replace(/<[^>]*>/g, "");
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || element.innerText || "";
}

export default function CoinModal({ isOpen, onClose, symbol }: CoinModalProps) {
  const [show, setShow] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [activeRange, setActiveRange] = useState<TrustChartTimeframe>("1D");
  const [sendOpen, setSendOpen] = useState(false);
  const { balanceMap, baseCurrency, payload, prices } = useTrustWallet();


  const svgRef = useRef<SVGSVGElement>(null);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const normalizedSymbol = symbol.toUpperCase();
  const token = getTrustToken(normalizedSymbol);
  const priceData = prices[normalizedSymbol];
  const price = priceData?.usd ?? token.price;
  const changePercent = priceData?.usd_24h_change ?? 0;
  const priceBefore = changePercent === -100 ? price : price / (1 + changePercent / 100);
  const changeDollar = price - priceBefore;
  const isPositive = changeDollar >= 0;
  const balance = balanceMap[normalizedSymbol] || 0;
  const balanceValue = balance * price;
  const visibleTransactions = payload.recentTransactions
    .filter((transaction) => transaction.tokenSymbol.toUpperCase() === normalizedSymbol)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const changeColor = isPositive ? "rgb(35, 191, 125)" : "#FE5D5D";
  const { error: chartError, isLoading: chartLoading, points: chartPoints } = useTrustCoinChart({
    coingeckoId: token.coingeckoId,
    currency: baseCurrency,
    symbol: normalizedSymbol,
    timeframe: activeRange,
  });
  const { details: tokenDetails, isLoading: detailsLoading } = useTrustTokenDetails({
    coingeckoId: token.coingeckoId,
    currency: baseCurrency,
    symbol: normalizedSymbol,
  });

  const activePoint = scrubIndex !== null ? chartPoints[scrubIndex] : null;
  const latestChartPoint = chartPoints[chartPoints.length - 1];
  const firstChartPoint = chartPoints[0];
  const chartIsPositive = firstChartPoint && latestChartPoint ? latestChartPoint.price >= firstChartPoint.price : isPositive;
  const chartColor = chartIsPositive ? "#23BF7D" : "#FE5D5D";
  const chartPath = useMemo(
    () => chartPoints.length ? `M${chartPoints.map((point) => `${point.x},${point.y}`).join("L")}` : "",
    [chartPoints],
  );
  const activePointTime = activePoint
    ? new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
    }).format(new Date(activePoint.timestamp))
    : "";
  const circulatingSupplyPercent = tokenDetails.totalSupply > 0
    ? (tokenDetails.circulatingSupply / tokenDetails.totalSupply) * 100
    : 0;
  const aboutText = stripHtml(tokenDetails.description);
  const primaryCategory = tokenDetails.categories.find(Boolean);
  const sentimentLabel = tokenDetails.sentimentVotesDownPercentage > tokenDetails.sentimentVotesUpPercentage
    ? "Market caution"
    : "No risk found";

  useEffect(() => {
    setScrubIndex(null);
  }, [activeRange, normalizedSymbol]);

  const handlePointer = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    if (e.type === "pointerup" || e.type === "pointerleave" || e.type === "pointercancel") {
      setScrubIndex(null);
      return;
    }
    if (!chartPoints.length) return;
    if (e.pointerType === "mouse" && e.buttons === 0) {
      setScrubIndex(null);
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const viewBoxX = (x / rect.width) * 360;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < chartPoints.length; i++) {
      const diff = Math.abs(chartPoints[i].x - viewBoxX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setScrubIndex(closestIdx);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timer: number;
    if (isOpen) {
      setShow(false);
      setIsRendered(true);
      timer = window.setTimeout(() => setShow(true), 24);
    } else {
      setShow(false);
      timer = window.setTimeout(() => setIsRendered(false), 450);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isRendered || !mounted) return null;

  const modalContent = (
    <div
      id="trustCoinPopup"
      style={{
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%",
        transform: show ? "translateX(0%)" : "translateX(100%)",
        transition: "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
        background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        maxWidth: "500px",
        margin: "0 auto",
        right: 0,
      }}
    >
      {/* Nav row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(16px, env(safe-area-inset-top)) 20px 10px", flexShrink: 0 }}>
        <button
          id="trustCoinBack"
          onClick={onClose}
          style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L11 18M5 12L11 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <button
          id="trustCoinStar"
          style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div id="tCoinPopupScroll" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* Coin header row: icon | ticker+network | price+change */}
        <div style={{ display: "flex", alignItems: "center", padding: "2px 20px 18px", gap: "14px" }}>
          <div style={{ position: "relative", flexShrink: 0, width: "46px", height: "46px" }}>
            {token.logo ? (
              <img id="tCoinIcon" src={token.logo} alt={token.name} style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "contain" }} />
            ) : (
              <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#252525", color: "#fff", display: "grid", placeItems: "center", fontSize: "13px", fontWeight: 700 }}>{normalizedSymbol.slice(0, 2)}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="tCoinName" style={{ color: "#fff", fontWeight: 600, fontSize: "17px", lineHeight: 1.2 }}>{normalizedSymbol}</div>
            <div id="tCoinNetwork" style={{ color: "#888", fontSize: "13px", marginTop: "2px" }}>{token.chain}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div id="tCoinPrice" style={{ color: "#fff", fontWeight: 600, fontSize: "17px", lineHeight: 1.2 }}>{formatTrustCurrency(price, baseCurrency)}</div>
            <div id="tCoinChangeRow" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px", marginTop: "3px" }}>
              <span id="tCoinChangeDollar" style={{ fontSize: "13px", color: changeColor }}>{isPositive ? "+" : "-"}{formatTrustCurrency(Math.abs(changeDollar), baseCurrency)}</span>
              <span id="tCoinChangePct" style={{ fontSize: "13px", color: changeColor }}>({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div id="tCoinChartWrapper" style={{ position: "relative", width: "100%", padding: "0 16px", boxSizing: "border-box" }}>
          <div id="tCoinChartBox" style={{ width: "100%", height: "200px", position: "relative" }}>
            <svg
              ref={svgRef}
              data-chart-source={chartPoints.length ? "coingecko" : "empty"}
              data-chart-timeframe={activeRange}
              viewBox="0 0 360 180"
              width="100%"
              height="100%"
              style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
              onPointerDown={handlePointer}
              onPointerMove={handlePointer}
              onPointerUp={handlePointer}
              onPointerLeave={handlePointer}
              onPointerCancel={handlePointer}
            >
              <defs>
                <clipPath id="tcp-past">
                  <rect id="tcp-past-rect" x="0" y="0" width={activePoint ? activePoint.x : 360} height="180"></rect>
                </clipPath>
                <clipPath id="tcp-future">
                  <rect id="tcp-future-rect" x={activePoint ? activePoint.x : 360} y="0" width={activePoint ? 360 - activePoint.x : 0} height="180"></rect>
                </clipPath>
              </defs>
              <path d={chartPath} stroke={chartColor} strokeWidth="2" fill="none" clipPath="url(#tcp-past)" id="tcp-color-line"></path>
              <path d={chartPath} stroke="#555" strokeWidth="2" fill="none" clipPath="url(#tcp-future)" id="tcp-grey-line"></path>

              <circle cx={activePoint ? activePoint.x : (latestChartPoint ? latestChartPoint.x : 360)} cy={activePoint ? activePoint.y : (latestChartPoint ? latestChartPoint.y : 90)} r="5" fill="none" stroke={chartColor} strokeWidth="1.5" id="tcp-pulse" style={{ display: activePoint || !chartPoints.length ? "none" : "block" }}></circle>
              <circle cx={activePoint ? activePoint.x : (latestChartPoint ? latestChartPoint.x : 360)} cy={activePoint ? activePoint.y : (latestChartPoint ? latestChartPoint.y : 90)} r="5" fill={chartColor} id="tcp-dot" style={{ display: activePoint || !chartPoints.length ? "none" : "block" }}></circle>

              <g id="tcp-scrub" style={{ display: scrubIndex !== null ? "block" : "none" }}>
                <line x1={activePoint ? activePoint.x : 0} y1="0" x2={activePoint ? activePoint.x : 0} y2="180" stroke="#555" strokeWidth="1" strokeDasharray="3 4" id="tcp-sline"></line>
                <line x1="0" y1={activePoint ? activePoint.y : 0} x2="360" y2={activePoint ? activePoint.y : 0} stroke="#555" strokeWidth="1" strokeDasharray="3 4" id="tcp-hline"></line>
                <circle r="5" fill={chartColor} id="tcp-sdot" cx={activePoint ? activePoint.x : 0} cy={activePoint ? activePoint.y : 0}></circle>
              </g>
            </svg>
            {!chartPoints.length ? (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#777", fontSize: "13px", pointerEvents: "none" }}>
                {chartLoading ? "Loading chart" : chartError ? "Chart unavailable" : "No chart data"}
              </div>
            ) : null}
          </div>
          <div id="tcp-tooltip" style={{ display: scrubIndex !== null ? "block" : "none", position: "absolute", top: "8px", background: "rgb(34, 34, 36)", borderRadius: "7px", padding: "5px 8px", pointerEvents: "none", zIndex: 5, right: "0px", left: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center" }}>
              <span style={{ color: "#666", fontSize: "11px" }}>Time</span>
              <span id="tcp-tt-time" style={{ color: "#aaa", fontSize: "11px" }}>{activePointTime}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", marginTop: "3px" }}>
              <span style={{ color: "#666", fontSize: "11px" }}>Price</span>
              <span id="tcp-tt-price" style={{ color: "#aaa", fontSize: "11px" }}>{formatTrustCurrency(activePoint?.price ?? price, baseCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Time range tabs (full width) */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px 14px", gap: "0px" }}>
          {(["1H", "1D", "1W", "1M", "1Y", "ALL"] as const).map((range) => (
            <button
              className={`t-range-btn${activeRange === range ? " t-range-active" : ""}`}
              data-range={range}
              key={range}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Balance */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
          <span style={{ color: "#fff", fontSize: "15px", fontWeight: 500 }} data-i18n="trust_popup.your_balance">Your balance</span>
          <div style={{ textAlign: "right" }}>
            <div id="tCoinBalanceValue" style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>{formatTrustCurrency(balanceValue, baseCurrency)}</div>
            <div id="tCoinBalanceCrypto" style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>{formatTrustBalance(balance)} {normalizedSymbol}</div>
          </div>
        </div>

        {/* Send / Receive pill buttons */}
        <div style={{ display: "flex", gap: "10px", padding: "8px 20px 16px" }}>
          <button className="t-action-btn" id="tCoinSend" onClick={() => setSendOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19.71 5.59C19.71 5.45 19.68 5.32 19.63 5.19C19.58 5.08 19.51 4.98 19.43 4.89C19.41 4.87 19.4 4.84 19.38 4.82C19.36 4.8 19.33 4.79 19.3 4.77C19.21 4.7 19.12 4.62 19.01 4.58C18.87 4.52 18.72 4.49 18.58 4.49H8.58C7.96 4.49 7.46 4.99 7.46 5.61C7.46 6.23 7.96 6.73 8.58 6.73H15.86L4.78 17.81C4.34 18.25 4.34 18.96 4.78 19.4C5 19.62 5.29 19.73 5.58 19.73C5.87 19.73 6.16 19.62 6.38 19.4L17.46 8.32V15.6C17.46 16.22 17.96 16.72 18.58 16.72C19.2 16.72 19.7 16.22 19.7 15.6V5.6L19.71 5.59Z" fill="currentColor"></path>
            </svg>
            <span data-i18n="btn.send">Send</span>
          </button>
          <button className="t-action-btn" id="tCoinReceive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"></rect>
              <rect x="5.5" y="5.5" width="3" height="3" fill="currentColor"></rect>
              <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"></rect>
              <rect x="15.5" y="5.5" width="3" height="3" fill="currentColor"></rect>
              <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"></rect>
              <rect x="5.5" y="15.5" width="3" height="3" fill="currentColor"></rect>
              <rect x="13" y="13" width="2" height="2" fill="currentColor"></rect>
              <rect x="17" y="13" width="2" height="2" fill="currentColor"></rect>
              <rect x="13" y="17" width="2" height="2" fill="currentColor"></rect>
              <rect x="17" y="17" width="2" height="2" fill="currentColor"></rect>
              <rect x="15" y="15" width="2" height="2" fill="currentColor"></rect>
              <rect x="19" y="15" width="2" height="2" fill="currentColor"></rect>
              <rect x="15" y="19" width="2" height="2" fill="currentColor"></rect>
            </svg>
            <span data-i18n="btn.receive">Receive</span>
          </button>
        </div>

        {/* Recent history */}
        {visibleTransactions.length > 0 && (
          <div style={{ padding: "12px 20px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ color: "#fff", fontSize: "15px", fontWeight: 500 }} data-i18n="trust_popup.recent_history">Recent history</div>
              <svg width="7" height="11" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {visibleTransactions.map((transaction) => {
                const isReceive = transaction.type === "receive";
                const displayType = isReceive ? "Received" : "Sent";
                
                const dateObj = new Date(transaction.createdAt);
                const datePart = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(dateObj);
                const timePart = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(dateObj);
                const formattedDate = `${datePart} at ${timePart}`;

                return (
                  <div key={transaction.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2A2A2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isReceive ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ color: "#e5e5e5", fontSize: "15px", fontWeight: 500 }}>{displayType}</div>
                        <div style={{ color: "#888", fontSize: "13px" }}>{formattedDate}</div>
                      </div>
                    </div>
                    <div style={{ color: isReceive ? "#48FF91" : "#aaa", fontSize: "15px", fontWeight: 500 }}>
                      {isReceive ? "+" : "-"}{formatTrustBalance(Number(transaction.amount))} {normalizedSymbol}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ color: "#fff", fontSize: "15px", fontWeight: 500, marginBottom: "14px" }} data-i18n="trust_popup.stats">Stats</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px" }}>
            {/* Col 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.market_cap">Market cap</div>
                <div id="tStatMcap" className="t-stat-value">{tokenDetails.marketCap ? formatTrustCurrency(tokenDetails.marketCap, baseCurrency) : detailsLoading ? "Loading" : "-"}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.holders">Rank</div>
                <div id="tStatHolders" className="t-stat-value">{tokenDetails.coingeckoRank ? `#${tokenDetails.coingeckoRank}` : detailsLoading ? "Loading" : "-"}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.circ_supply">Circulating Supply %</div>
                <div id="tStatCirc" className="t-stat-value">{circulatingSupplyPercent ? `${circulatingSupplyPercent.toFixed(2)}%` : "-"}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.liquidity">Total Supply</div>
                <div id="tStatLiquidity" className="t-stat-value">{formatCompactNumber(tokenDetails.totalSupply)}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.top10_avg_buy">Category</div>
                <div id="tStatTop10Buy" className="t-stat-value">{primaryCategory || "-"}</div>
              </div>
            </div>
            {/* Col 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.volume_24h">24h Volume</div>
                <div id="tStatVol24h" className="t-stat-value">{tokenDetails.totalVolume ? formatTrustCurrency(tokenDetails.totalVolume, baseCurrency) : detailsLoading ? "Loading" : "-"}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.created">Created</div>
                <div id="tStatCreated" className="t-stat-value">{formatDate(tokenDetails.genesisDate)}</div>
              </div>
              <div>
                <div className="t-stat-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span data-i18n="trust_popup.security_risk">Security Risk</span>
                  <svg width="5" height="8" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1l4 4-4 4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div className="t-stat-value" data-i18n="trust_popup.no_risk">{sentimentLabel}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.top10_pct">Sentiment Up</div>
                <div id="tStatTop10Pct" className="t-stat-value">{tokenDetails.sentimentVotesUpPercentage ? `${tokenDetails.sentimentVotesUpPercentage.toFixed(1)}%` : "-"}</div>
              </div>
              <div>
                <div className="t-stat-label" data-i18n="trust_popup.top10_avg_sell">Circulating Supply</div>
                <div id="tStatTop10Sell" className="t-stat-value">{formatCompactNumber(tokenDetails.circulatingSupply)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div style={{ padding: "16px 20px 20px" }} className="mb-20">
          <div style={{ color: "#fff", fontSize: "15px", fontWeight: 500, marginBottom: "12px" }} data-i18n="trust_popup.about">About</div>
          <p style={{ color: "#aaa", fontSize: "13px", lineHeight: 1.45, margin: "0 0 12px", display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 3 }}>
            {aboutText || `${token.name} market data is provided by CoinGecko.`}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="t-about-pill" disabled={!tokenDetails.links.website} onClick={() => tokenDetails.links.website && window.open(tokenDetails.links.website, "_blank", "noopener,noreferrer")}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15,3 21,3 21,9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span data-i18n="trust_popup.website">Website</span>
            </button>
            <button className="t-about-pill" disabled={!tokenDetails.links.twitter} onClick={() => tokenDetails.links.twitter && window.open(tokenDetails.links.twitter, "_blank", "noopener,noreferrer")}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span>X</span>
            </button>
            <button className="t-about-pill" disabled={!tokenDetails.links.reddit} onClick={() => tokenDetails.links.reddit && window.open(tokenDetails.links.reddit, "_blank", "noopener,noreferrer")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"></path>
              </svg>
              <span>Reddit</span>
            </button>
            <button className="t-about-pill" disabled={!tokenDetails.links.whitepaper && !tokenDetails.links.github} onClick={() => {
              const target = tokenDetails.links.whitepaper || tokenDetails.links.github;
              if (target) window.open(target, "_blank", "noopener,noreferrer");
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
              </svg>
              <span data-i18n="trust_popup.whitepaper">Whitepaper</span>
            </button>
          </div>
        </div>

        {/* Spacer for bottom bar */}
        <div style={{ height: "80px" }}></div>
      </div>

      {/* Bottom bar: content fades out above full-width Trade button */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, #1B1B1C 0%, #1B1B1C 60%, rgba(27,27,28,0.85) 74%, rgba(27,27,28,0.45) 88%, rgba(27,27,28,0) 100%)", padding: "40px 16px calc(28px + env(safe-area-inset-bottom, 0px))" }}>
        <button id="tCoinSwap" data-i18n="btn.trade" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", background: "#48FF91", border: "none", borderRadius: "50px", padding: "15px 20px", color: "#1B1B1C", fontSize: "17px", fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.7877 5.215C22.1977 5.025 21.5677 5.355 21.3777 5.945L20.7177 8.025C20.6277 7.835 20.5377 7.655 20.4377 7.455C18.7777 4.475 15.6277 2.625 12.2277 2.625C8.82771 2.625 5.67771 4.475 4.01771 7.455C3.71771 7.995 3.90771 8.685 4.45771 8.985C4.99771 9.285 5.68771 9.095 5.98771 8.545C7.24771 6.285 9.63771 4.875 12.2277 4.875C14.8177 4.875 17.2077 6.285 18.4577 8.545C18.5677 8.745 18.6577 8.935 18.7477 9.125L16.5677 8.425C15.9777 8.235 15.3477 8.565 15.1577 9.155C14.9677 9.745 15.2977 10.375 15.8877 10.565L20.6077 12.065C20.7177 12.105 20.8377 12.115 20.9477 12.115C21.4277 12.115 21.8677 11.815 22.0177 11.335L23.5177 6.615C23.7077 6.025 23.3777 5.395 22.7877 5.205V5.215Z" fill="currentColor"></path>
            <path d="M19.9875 15.015C19.4475 14.715 18.7575 14.905 18.4575 15.455C17.1975 17.715 14.8075 19.125 12.2175 19.125C9.62752 19.125 7.23752 17.715 5.98752 15.455C5.92752 15.345 5.87752 15.235 5.82752 15.135L8.09752 15.865C8.68752 16.055 9.31752 15.725 9.50752 15.135C9.69752 14.545 9.36752 13.915 8.77752 13.725L4.05752 12.225C3.46752 12.035 2.83752 12.365 2.64752 12.955L1.14752 17.655C0.957522 18.245 1.28752 18.875 1.87752 19.065C1.98752 19.105 2.10752 19.115 2.21752 19.115C2.69752 19.115 3.13752 18.815 3.28752 18.335L3.91752 16.355C3.94752 16.415 3.97752 16.475 4.00752 16.545C5.65752 19.525 8.80752 21.375 12.2075 21.375C15.6075 21.375 18.7575 19.525 20.4075 16.545C20.7075 16.005 20.5175 15.315 19.9675 15.015H19.9875Z" fill="currentColor"></path>
          </svg>
          Trade
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {modalContent}
      <SendModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </>,
    document.body
  );
}
