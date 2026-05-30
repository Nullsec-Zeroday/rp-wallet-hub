"use client";

import React, { useState, useEffect, useRef } from "react";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const [show, setShow] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [swapAmount, setSwapAmount] = useState("");

  const keyboardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        isKeyboardOpen &&
        keyboardRef.current &&
        !keyboardRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsKeyboardOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isKeyboardOpen]);

  const handleKeyPress = (key: string) => {
    if (key === "del") {
      setSwapAmount(prev => prev.slice(0, -1));
    } else if (key === ".") {
      if (!swapAmount.includes(".")) {
        setSwapAmount(prev => prev + (prev === "" ? "0." : "."));
      }
    } else {
      setSwapAmount(prev => (prev === "0" ? key : prev + key));
    }
  };

  const displayVal = swapAmount || "0";

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div
      id="trustSwapPanel"
      style={{
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%",
        transform: show ? "translateY(0%)" : "translateY(100%)",
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 16px 12px",
          flexShrink: 0,
          paddingTop: "max(env(safe-area-inset-top), 12px)",
        }}
      >
        <button
          id="trustSwapBack"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            padding: "6px",
            cursor: "pointer",
            color: "#888",
            display: "flex",
            alignItems: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>
        <span
          id="swapPanelTitle"
          style={{ color: "#fff", fontSize: "19px", fontWeight: 600 }}
        >
          Swap
        </span>
        <button
          id="trustSwapFilter"
          style={{
            background: "none",
            border: "none",
            padding: "6px",
            cursor: "pointer",
            color: "#888",
            display: "flex",
            alignItems: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg
            fill="none"
            width="20"
            height="15"
            viewBox="0 0 21 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.12 5.11H9.3C9.79 6.77 11.3 7.99 13.12 7.99C14.94 7.99 16.45 6.77 16.94 5.11H19.12C19.74 5.11 20.24 4.61 20.24 3.99C20.24 3.37 19.74 2.87 19.12 2.87H16.94C16.45 1.21 14.94 0 13.12 0C11.3 0 9.79 1.22 9.3 2.87H1.12C0.5 2.87 0 3.37 0 3.99C0 4.61 0.5 5.11 1.12 5.11ZM13.12 2.24C14.08 2.24 14.87 3.03 14.87 3.99C14.87 4.95 14.08 5.74 13.12 5.74C12.16 5.74 11.37 4.95 11.37 3.99C11.37 3.03 12.16 2.24 13.12 2.24Z"
              fill="currentColor"
            ></path>
            <path
              d="M19.12 10.86H10.94C10.45 9.19999 8.94 7.98999 7.12 7.98999C5.3 7.98999 3.79 9.20999 3.3 10.86H1.12C0.5 10.86 0 11.36 0 11.98C0 12.6 0.5 13.1 1.12 13.1H3.3C3.79 14.76 5.3 15.98 7.12 15.98C8.94 15.98 10.45 14.76 10.94 13.1H19.12C19.74 13.1 20.24 12.6 20.24 11.98C20.24 11.36 19.74 10.86 19.12 10.86ZM7.12 13.74C6.16 13.74 5.37 12.95 5.37 11.99C5.37 11.03 6.16 10.24 7.12 10.24C8.08 10.24 8.87 11.03 8.87 11.99C8.87 12.95 8.08 13.74 7.12 13.74Z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="trustSwapPickerClose"
          style={{
            display: "none",
            background: "none",
            border: "none",
            padding: "6px",
            cursor: "pointer",
            color: "#888",
            alignItems: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>
      </div>

      {/* Main swap content */}
      <div
        id="swapMainContent"
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Swap cells area */}
        <div style={{ flex: 1, padding: "0 16px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* FROM cell */}
          <div className="swap-cell" style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "16px", padding: "16px", marginBottom: "8px" }}>
            <div className="swap-cell-inner" style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="swap-cell-left" style={{ flex: 1 }}>
                <div
                  id="swapFromDisplay"
                  ref={inputRef}
                  onClick={() => setIsKeyboardOpen(true)}
                  style={{
                    width: "100%",
                    minHeight: "43px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    padding: 0,
                  }}
                >
                  <span
                    id="swapFromDisplayVal"
                    className="swap-amount"
                    style={{ color: "rgb(136, 136, 136)", fontSize: "32px" }}
                  >
                    {displayVal}
                  </span>
                  <span id="swapFromCursor" style={{ background: "rgb(255, 255, 255)", display: isKeyboardOpen ? "inline-block" : "none", width: "2px", height: "32px", marginLeft: "2px" }}></span>
                </div>
                <input id="swapFromAmount" type="text" style={{ display: "none" }} readOnly />
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px" }}>
                  <span id="swapFromUSD" className="swap-usd" style={{ color: "#fff", fontSize: "13px" }}>
                    $0.00
                  </span>
                  <svg fill="none" width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, color: "#fff" }}>
                    <path d="M22.7877 5.215C22.1977 5.025 21.5677 5.355 21.3777 5.945L20.7177 8.025C20.6277 7.835 20.5377 7.655 20.4377 7.455C18.7777 4.475 15.6277 2.625 12.2277 2.625C8.82771 2.625 5.67771 4.475 4.01771 7.455C3.71771 7.995 3.90771 8.685 4.45771 8.985C4.99771 9.285 5.68771 9.095 5.98771 8.545C7.24771 6.285 9.63771 4.875 12.2277 4.875C14.8177 4.875 17.2077 6.285 18.4577 8.545C18.5677 8.745 18.6577 8.935 18.7477 9.125L16.5677 8.425C15.9777 8.235 15.3477 8.565 15.1577 9.155C14.9677 9.745 15.2977 10.375 15.8877 10.565L20.6077 12.065C20.7177 12.105 20.8377 12.115 20.9477 12.115C21.4277 12.115 21.8677 11.815 22.0177 11.335L23.5177 6.615C23.7077 6.025 23.3777 5.395 22.7877 5.205V5.215Z" fill="currentColor"></path>
                    <path d="M19.9875 15.015C19.4475 14.715 18.7575 14.905 18.4575 15.455C17.1975 17.715 14.8075 19.125 12.2175 19.125C9.62752 19.125 7.23752 17.715 5.98752 15.455C5.92752 15.345 5.87752 15.235 5.82752 15.135L8.09752 15.865C8.68752 16.055 9.31752 15.725 9.50752 15.135C9.69752 14.545 9.36752 13.915 8.77752 13.725L4.05752 12.225C3.46752 12.035 2.83752 12.365 2.64752 12.955L1.14752 17.655C0.957522 18.245 1.28752 18.875 1.87752 19.065C1.98752 19.105 2.10752 19.115 2.21752 19.115C2.69752 19.115 3.13752 18.815 3.28752 18.335L3.91752 16.355C3.94752 16.415 3.97752 16.475 4.00752 16.545C5.65752 19.525 8.80752 21.375 12.2075 21.375C15.6075 21.375 18.7575 19.525 20.4075 16.545C20.7075 16.005 20.5175 15.315 19.9675 15.015H19.9875Z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>
              <div
                className="swap-cell-right"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}
              >
                <div
                  id="swapFromPill"
                  className="swap-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "6px 12px 6px 6px",
                    borderRadius: "24px",
                  }}
                >
                  <div
                    id="swapFromIconWrap"
                    className="swap-icon-wrap"
                    style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden" }}
                  >
                    <img
                      id="swapFromIcon"
                      src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png"
                      alt=""
                      className="swap-icon"
                      style={{ width: "100%", height: "100%" }}
                    />
                    <div id="swapFromBadge"></div>
                  </div>
                  <span id="swapFromTicker" className="swap-ticker" style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>
                    SOL
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div
                  id="swapFromBalance"
                  className="swap-balance"
                  style={{ color: "#fff", display: "flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "13px" }}
                >
                  <svg className="text-iconNormal" fill="none" width="12" height="12" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ paddingLeft: "1px" }}>
                    <path d="M16.495 4.75012H4.995C4.375 4.75012 3.875 5.25012 3.875 5.87012C3.875 6.49012 4.375 6.99012 4.995 6.99012H16.495C16.985 6.99012 17.375 7.38012 17.375 7.87012V16.1101C17.375 16.6001 16.975 16.9901 16.495 16.9901H3.505C3.015 16.9901 2.625 16.5901 2.625 16.1101V3.87012C2.625 3.39012 3.015 2.99012 3.495 2.99012H16.495C17.115 2.99012 17.615 2.49012 17.615 1.87012C17.615 1.25012 17.115 0.750122 16.495 0.750122H3.495C1.775 0.750122 0.375 2.15012 0.375 3.87012V16.1101C0.375 17.8401 1.785 19.2401 3.505 19.2401H16.495C18.225 19.2401 19.625 17.8401 19.625 16.1101V7.87012C19.625 6.15012 18.215 4.75012 16.495 4.75012Z" fill="currentColor"></path>
                    <path d="M14.6249 12.5001C15.2449 12.5001 15.7449 12.0001 15.7449 11.3801C15.7449 10.7601 15.2449 10.2601 14.6249 10.2601H12.3749C11.7549 10.2601 11.2549 10.7601 11.2549 11.3801C11.2549 12.0001 11.7549 12.5001 12.3749 12.5001H14.6249Z" fill="currentColor"></path>
                  </svg>
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flip button */}
          <div style={{ display: "flex", justifyContent: "center", margin: "-16px 0", position: "relative", zIndex: 2 }}>
            <div style={{ position: "relative", display: "inline-flex" }}>
              <button
                id="trustSwapFlip"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#1B1B1C",
                  border: "4px solid hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
                  color: "#888",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              <svg id="swapFlipRing" width="42" height="42" viewBox="0 0 42 42" style={{ position: "absolute", top: "-5px", left: "-5px", pointerEvents: "none", display: "none", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}>
                <circle cx="21" cy="21" r="19" fill="none" stroke="#20372A" strokeWidth="2.5"></circle>
                <circle id="swapFlipRingProgress" cx="21" cy="21" r="19" fill="none" stroke="#48FF91" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset="0"></circle>
              </svg>
            </div>
          </div>

          {/* TO cell */}
          <div className="swap-cell" style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "16px", padding: "16px", marginBottom: "8px" }}>
            <div className="swap-cell-inner" style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="swap-cell-left" style={{ flex: 1 }}>
                <div id="swapToAmount" className="swap-amount" style={{ fontSize: "32px", color: "#fff" }}>
                  0
                </div>
                <div id="swapToUSD" className="swap-usd" style={{ color: "#888", marginTop: "10px", fontSize: "13px" }}>
                  $0.00
                </div>
              </div>
              <div
                className="swap-cell-right"
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}
              >
                <div
                  id="swapToPill"
                  className="swap-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "6px 12px 6px 6px",
                    borderRadius: "24px",
                  }}
                >
                  <div
                    id="swapToIconWrap"
                    className="swap-icon-wrap"
                    style={{ position: "relative", width: "24px", height: "24px" }}
                  >
                    <img
                      id="swapToIcon"
                      src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png"
                      alt=""
                      className="swap-icon"
                      style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                    />
                    <div
                      id="swapToBadge"
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        borderRadius: "50%",
                        border: "1px solid #1B1B1C",
                        width: "12px",
                        height: "12px",
                        background: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        alt="Tron"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png"
                      />
                    </div>
                  </div>
                  <span id="swapToTicker" className="swap-ticker" style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>
                    USDT
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div
                  id="swapToBalance"
                  className="swap-balance"
                  style={{ color: "#888", display: "flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "13px" }}
                >
                  <svg className="text-iconNormal" fill="none" width="12" height="12" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style={{ paddingLeft: "1px" }}>
                    <path d="M16.495 4.75012H4.995C4.375 4.75012 3.875 5.25012 3.875 5.87012C3.875 6.49012 4.375 6.99012 4.995 6.99012H16.495C16.985 6.99012 17.375 7.38012 17.375 7.87012V16.1101C17.375 16.6001 16.975 16.9901 16.495 16.9901H3.505C3.015 16.9901 2.625 16.5901 2.625 16.1101V3.87012C2.625 3.39012 3.015 2.99012 3.495 2.99012H16.495C17.115 2.99012 17.615 2.49012 17.615 1.87012C17.615 1.25012 17.115 0.750122 16.495 0.750122H3.495C1.775 0.750122 0.375 2.15012 0.375 3.87012V16.1101C0.375 17.8401 1.785 19.2401 3.505 19.2401H16.495C18.225 19.2401 19.625 17.8401 19.625 16.1101V7.87012C19.625 6.15012 18.215 4.75012 16.495 4.75012Z" fill="currentColor"></path>
                    <path d="M14.6249 12.5001C15.2449 12.5001 15.7449 12.0001 15.7449 11.3801C15.7449 10.7601 15.2449 10.2601 14.6249 10.2601H12.3749C11.7549 10.2601 11.2549 10.7601 11.2549 11.3801C11.2549 12.0001 11.7549 12.5001 12.3749 12.5001H14.6249Z" fill="currentColor"></path>
                  </svg>
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fetching quote pill */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "6px" }}>
            <div id="fetchQuotePill" style={{ display: "none", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.09)", borderRadius: "50px", padding: "4px 8px 4px 10px", fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>
              Fetching quote
              <svg className="fetch-spinner" width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#aaa" strokeWidth="3" strokeLinecap="round"></path>
              </svg>
            </div>
          </div>

          {/* Insufficient balance badge */}
          <div id="swapInsufficientBadge" style={{ display: "none", alignItems: "center", gap: "8px", background: "#3F2526", borderRadius: "12px", padding: "12px 16px", marginTop: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#FE5D5D" strokeWidth="1.8"></circle>
              <path d="M15 9l-6 6M9 9l6 6" stroke="#FE5D5D" strokeWidth="1.8" strokeLinecap="round"></path>
            </svg>
            <span style={{ color: "#FE5D5D", fontSize: "13px", fontWeight: 500 }}>Insufficient balance</span>
          </div>
        </div>

        {/* Custom Keyboard */}
        <div id="swapKeyboard" ref={keyboardRef} style={{ overflow: "hidden", maxHeight: isKeyboardOpen ? "340px" : "0px", transition: "max-height 0.35s cubic-bezier(0.25, 1, 0.5, 1)", flexShrink: 0 }}>
          {/* % slider row */}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 20px 4px", gap: "20px" }}>
            <span id="kbdMinBtn" className="kbd-minmax">Min</span>
            <div id="kbdTrack" style={{ flex: 1, position: "relative", height: "14px", borderRadius: "7px", background: "#333", cursor: "pointer", touchAction: "none" }}>
              <div id="kbdFill" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 0, background: "#48FF91", borderRadius: "7px", pointerEvents: "none" }}></div>
              <div id="kbdDot" style={{ position: "absolute", top: "50%", left: 0, transform: "translate(-50%,-50%)", width: "22px", height: "22px", borderRadius: "50%", background: "#fff", cursor: "grab", touchAction: "none", zIndex: 2 }}>
                <div id="kbdTip" style={{ position: "absolute", bottom: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)", background: "#444", color: "#fff", fontSize: "11px", fontWeight: 500, padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap", display: "none", pointerEvents: "none" }}>0%</div>
              </div>
            </div>
            <span id="kbdMaxBtn" className="kbd-minmax">Max</span>
          </div>

          {/* 25% / 50% / 75% shortcut buttons */}
          <div style={{ display: "flex", alignItems: "center", padding: "0px 20px", gap: "12px" }}>
            <span style={{ color: "transparent", fontSize: "12px", fontWeight: 500, pointerEvents: "none", userSelect: "none" }}>Min</span>
            <div style={{ flex: 1, position: "relative", height: "22px" }}>
              <button className="kbd-pct" data-pct="0.25" style={{ left: "26%" }}>25%</button>
              <button className="kbd-pct" data-pct="0.5" style={{ left: "50%" }}>50%</button>
              <button className="kbd-pct" data-pct="0.75" style={{ left: "74%" }}>75%</button>
            </div>
            <span style={{ color: "transparent", fontSize: "12px", fontWeight: 500, pointerEvents: "none", userSelect: "none" }}>Max</span>
          </div>

          {/* Keys: 1-2-3 / 4-5-6 / 7-8-9 / . 0 ⌫ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", padding: "0 16px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map(k => (
              <button 
                key={k} 
                className="kbd-key" 
                data-k={k}
                onClick={(e) => { e.stopPropagation(); handleKeyPress(k.toString()); }}
              >
                {k}
              </button>
            ))}
            <button 
              className="kbd-key" 
              data-k="del"
              onClick={(e) => { e.stopPropagation(); handleKeyPress("del"); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M17.23 9.78L15.01 12L17.23 14.22C17.52 14.51 17.52 14.99 17.23 15.28C17.08 15.43 16.89 15.5 16.7 15.5C16.51 15.5 16.32 15.43 16.17 15.28L13.95 13.06L11.73 15.28C11.58 15.43 11.39 15.5 11.2 15.5C11.01 15.5 10.82 15.43 10.67 15.28C10.38 14.99 10.38 14.51 10.67 14.22L12.89 12L10.67 9.78C10.38 9.49 10.38 9.01 10.67 8.72C10.96 8.43 11.44 8.43 11.73 8.72L13.95 10.94L16.17 8.72C16.46 8.43 16.94 8.43 17.23 8.72C17.52 9.01 17.52 9.49 17.23 9.78ZM21.32 7V17C21.32 17.96 20.54 18.75 19.57 18.75H7.64C7.02999 18.75 6.48 18.44 6.16 17.93L2.87 12.66C2.62 12.26 2.62 11.74 2.87 11.33L6.16 6.07C6.48 5.56 7.04 5.25 7.64 5.25H19.58C20.54 5.25 21.33 6.04 21.33 7H21.32ZM19.82 7C19.82 6.86 19.71 6.75 19.57 6.75H7.64C7.54999 6.75 7.47 6.79 7.43 6.87L4.22 12L7.43 17.13C7.48 17.2 7.56 17.25 7.64 17.25H19.58C19.72 17.25 19.83 17.14 19.83 17V7H19.82Z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Slide to swap */}
        <div style={{ padding: "14px 16px 34px", flexShrink: 0 }}>
          <div
            id="swapSliderTrack"
            style={{
              position: "relative",
              height: "56px",
              borderRadius: "28px",
              background: "#296441",
              overflow: "hidden",
              userSelect: "none",
              touchAction: "none",
            }}
          >
            <div
              id="swapSliderFill"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 0,
                background: "rgb(72, 255, 145)",
                overflow: "hidden",
                zIndex: 2,
                borderRadius: "28px",
              }}
            >
              <span
                id="swapSliderLabelFill"
                style={{
                  position: "absolute",
                  top: 0,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1B1B1C",
                  fontWeight: 600,
                  fontSize: "15px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Slide to swap
              </span>
            </div>
            <div
              id="swapSliderThumb"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "80px",
                height: "56px",
                borderRadius: "28px",
                background: "rgb(58, 185, 108)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                flexShrink: 0,
                willChange: "transform",
                zIndex: 3,
                transform: "translateX(0px)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="#7FCCA0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <span
              id="swapSliderLabel"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                textAlign: "center",
                color: "rgb(122, 156, 137)",
                fontWeight: 600,
                fontSize: "15px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                zIndex: 1,
                opacity: 1,
              }}
            >
              Slide to swap
            </span>
          </div>
        </div>
      </div>

      {/* Picker content (hidden by default) */}
      <div id="swapPickerContent" style={{ flex: 1, display: "none", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "10px 16px", gap: "10px" }}>
            <svg fill="none" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: "#666", flexShrink: 0 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.6262 1.99976C15.3904 1.99976 19.2527 5.86217 19.2528 10.6263C19.2528 12.3718 18.7333 13.9969 17.8415 15.355L21.4847 18.9983L21.6059 19.1326C22.1688 19.8231 22.1282 20.8412 21.4847 21.4848C20.841 22.1285 19.8222 22.1693 19.1316 21.6059L18.9983 21.4848L15.355 17.8415C13.9969 18.7333 12.3718 19.2528 10.6262 19.2528C5.86214 19.2527 1.99973 15.3904 1.99973 10.6263C1.99981 5.86222 5.86219 1.99984 10.6262 1.99976ZM10.6262 5.51628C7.80427 5.51636 5.51633 7.8043 5.51625 10.6263C5.51625 13.4483 7.80422 15.7362 10.6262 15.7363C13.4483 15.7363 15.7362 13.4484 15.7362 10.6263C15.7362 7.80425 13.4483 5.51628 10.6262 5.51628Z" fill="currentColor"></path>
            </svg>
            <input id="swapPickerSearch" type="text" placeholder="Search your holdings" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "15px", caretColor: "#48FF91" }} />
          </div>
        </div>
        {/* Chain filter row */}
        <div className="chain-filter-row" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", justifyContent: "space-between", padding: "0 16px 12px", flexShrink: 0, gap: "8px" }}>
          <div style={{ aspectRatio: "1/1", border: "1.5px solid #48FF91", borderRadius: "10px", background: "#1B1B1C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <span style={{ color: "#48FF91", fontSize: "13px", fontWeight: 600 }}>All</span>
          </div>
          <div style={{ aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "3px solid #f8a239", boxSizing: "border-box", background: "#f8a239" }}>
            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/bitcoin/info/logo.png" alt="BTC" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scale(1.3)" }} />
          </div>
          <div style={{ aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "3px solid #0a0e11", boxSizing: "border-box", background: "#0a0e11" }}>
            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png" alt="BNB" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scale(1.3)" }} />
          </div>
          <div style={{ aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "3px solid #f3f4f7", boxSizing: "border-box", background: "#f3f4f7" }}>
            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ethereum/info/logo.png" alt="ETH" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scale(1.3)" }} />
          </div>
          <div style={{ aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "3px solid #000", boxSizing: "border-box", background: "#000" }}>
            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png" alt="SOL" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scale(1.3)" }} />
          </div>
          <div style={{ padding: "0 10px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", cursor: "pointer", WebkitTapHighlightColor: "transparent", alignSelf: "center", height: "100%" }}>
            <span style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>26+</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>
        <div id="swapPickerList" style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}></div>
      </div>
    </div>
  );
}
