"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";

export type ChartPoint = {
  timestamp: number;
  price: number;
};

interface InteractiveChartProps {
  data: ChartPoint[];
  color: string;
  onPointSelected?: (point: ChartPoint | null) => void;
  height?: number;
  timeFrame?: string;
}

export default function InteractiveChart({
  data,
  color,
  onPointSelected,
  height = 220,
}: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const animFrameRef = useRef<number>(0);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContainerWidth(e.contentRect.width);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pulse animation for the idle dot
  useEffect(() => {
    let start: number | null = null;
    const duration = 1600;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = (ts - start) % duration;
      setPulsePhase(elapsed / duration);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const PADDING_LEFT = 0;
  const PADDING_RIGHT = 28;
  const drawWidth = containerWidth - PADDING_LEFT - PADDING_RIGHT;

  const points = useMemo(() => {
    if (!data || data.length === 0 || drawWidth <= 0) return [];
    const minPrice = Math.min(...data.map((d) => d.price));
    const maxPrice = Math.max(...data.map((d) => d.price));
    const topPadding = 20;
    const bottomPadding = 20;
    const drawHeight = height - topPadding - bottomPadding;

    return data.map((d, i) => {
      const x = PADDING_LEFT + drawWidth * (i / (data.length - 1));
      const y =
        maxPrice === minPrice
          ? height / 2
          : topPadding + drawHeight - drawHeight * ((d.price - minPrice) / (maxPrice - minPrice));
      return { ...d, x, y };
    });
  }, [data, drawWidth, height]);

  const timeStrings = useMemo(() => {
    if (!data) return [];
    return data.map((d) => {
      const date = new Date(d.timestamp);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const mins = minutes < 10 ? "0" + minutes : minutes;
      return `${hours}:${mins} ${ampm}`;
    });
  }, [data]);

  const pathData = useMemo(() => {
    if (!points.length) return "";
    return points.reduce((acc, pt, i) => {
      return acc + `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y} `;
    }, "");
  }, [points]);

  const baseY = points.length > 0 ? points[0].y : 0;

  // Convert pointer x position to index
  const getIndexFromX = useCallback(
    (clientX: number) => {
      if (!containerRef.current || points.length === 0) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const step = drawWidth / (points.length - 1);
      let index = Math.round((x - PADDING_LEFT) / step);
      index = Math.max(0, Math.min(index, points.length - 1));
      return index;
    },
    [points, drawWidth]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsActive(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const idx = getIndexFromX(e.clientX);
      if (idx !== null) {
        setActiveIndex(idx);
        onPointSelected?.(data[idx]);
      }
    },
    [getIndexFromX, data, onPointSelected]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      const idx = getIndexFromX(e.clientX);
      if (idx !== null) {
        setActiveIndex(idx);
        onPointSelected?.(data[idx]);
      }
    },
    [isActive, getIndexFromX, data, onPointSelected]
  );

  const handlePointerUp = useCallback(() => {
    setIsActive(false);
    setActiveIndex(null);
    onPointSelected?.(null);
  }, [onPointSelected]);

  if (!data || data.length === 0) return null;

  const activePt = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;
  const lastPt = points.length > 0 ? points[points.length - 1] : null;

  // Pulse ring
  const pulseR = 4 + pulsePhase * 12;
  const pulseOpacity = 0.6 - pulsePhase * 0.6;

  // Time label
  const activeTimeStr = activeIndex !== null ? timeStrings[activeIndex] : "";
  const LABEL_WIDTH = 80;
  let labelX = activePt ? activePt.x - LABEL_WIDTH / 2 : 0;
  if (labelX < PADDING_LEFT) labelX = PADDING_LEFT;
  if (labelX > containerWidth - PADDING_RIGHT - LABEL_WIDTH) labelX = containerWidth - PADDING_RIGHT - LABEL_WIDTH;

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ marginTop: 20, touchAction: "none" }}>
      {/* Time label overlay */}
      <div
        className="absolute flex items-center justify-center pointer-events-none transition-opacity duration-150"
        style={{
          top: -24,
          left: labelX,
          width: LABEL_WIDTH,
          opacity: isActive ? 1 : 0,
          zIndex: 10,
        }}
      >
        <span className="text-xs font-semibold text-center" style={{ color: "#A0A0A0" }}>
          {activeTimeStr}
        </span>
      </div>

      <svg
        width={containerWidth}
        height={height}
        className="block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {activePt && (
            <>
              <clipPath id="leftClip">
                <rect x="0" y="0" width={activePt.x} height="100%" />
              </clipPath>
              <clipPath id="rightClip">
                <rect x={activePt.x} y="0" width={containerWidth - activePt.x} height="100%" />
              </clipPath>
            </>
          )}
        </defs>

        {/* Horizontal baseline (equator) - only shows on active */}
        <line
          x1={PADDING_LEFT}
          x2={containerWidth - PADDING_RIGHT}
          y1={baseY}
          y2={baseY}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={isActive ? 1 : 0}
          className="transition-opacity duration-150"
        />

        {/* Vertical scrub line - only shows on active */}
        {activePt && (
          <line
            x1={activePt.x}
            x2={activePt.x}
            y1={0}
            y2={height}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            opacity={isActive ? 1 : 0}
            className="transition-opacity duration-150"
          />
        )}

        {/* When active: gray path for the right side */}
        {isActive && activePt ? (
          <>
            <path
              d={pathData}
              stroke="#555555"
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              clipPath="url(#rightClip)"
            />
            <path
              d={pathData}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              clipPath="url(#leftClip)"
            />
          </>
        ) : (
          /* When idle: full color path */
          <path d={pathData} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        )}

        {/* Active dot */}
        {activePt && isActive && (
          <circle cx={activePt.x} cy={activePt.y} r={6} fill={color} stroke="#0c0c0c" strokeWidth={2.5} />
        )}

        {/* Idle pulsing dot at last point */}
        {!isActive && lastPt && (
          <>
            <circle cx={lastPt.x} cy={lastPt.y} r={pulseR} fill={color} opacity={pulseOpacity} />
            <circle cx={lastPt.x} cy={lastPt.y} r={5} fill={color} />
          </>
        )}
      </svg>
    </div>
  );
}
