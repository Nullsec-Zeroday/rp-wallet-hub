import React from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_BG = "#131513";
const NAV_BORDER = "1px solid rgba(255,255,255,0.07)";
const ACTIVE_BG = "#2D312F";

function HomeIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.9 3.28c1.2-.98 3-.98 4.2 0l5.05 4.11c.86.7 1.35 1.74 1.35 2.85v6.41c0 2.02-1.68 3.6-3.66 3.6H7.16c-1.98 0-3.66-1.58-3.66-3.6v-6.41c0-1.11.5-2.15 1.35-2.85L9.9 3.28Z" fill="currentColor" />
        <rect x="9.4" y="15.1" width="5.2" height="1.9" rx="0.95" fill={ACTIVE_BG} />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.46 4.03a2.45 2.45 0 0 1 3.08 0l5.05 4.11c.65.53 1.03 1.32 1.03 2.16v6.41c0 1.51-1.26 2.76-2.83 2.76H7.16c-1.57 0-2.83-1.25-2.83-2.76v-6.41c0-.84.38-1.63 1.03-2.16l5.1-4.11Z" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M10.4 16.05h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function WalletFooter() {
  const pathname = usePathname();
  const router = useRouter();

  const isRouteActive = (route: string) => pathname.startsWith(route);

  const outerStyle: React.CSSProperties = {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    flex: "1 1 0",
    height: "52px",
    justifyContent: "center",
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    alignItems: "center",
    background: active ? ACTIVE_BG : "transparent",
    borderRadius: "9999px",
    display: "flex",
    height: "52px",
    justifyContent: "center",
    transition: "background 0.2s ease",
    width: "68px",
  });

  return (
    <div className="flex items-center gap-3" style={{ bottom: "28px", width: "calc(100% - 2rem)", left: "1rem", right: "1rem", position: "fixed", zIndex: 9998, maxWidth: "470px" }}>
      <div className="flex items-center justify-between rounded-full flex-1 bottom-pill-nav" style={{ backgroundColor: NAV_BG, border: NAV_BORDER, padding: "6px 7px" }}>

        {/* Home */}
        <div data-testid="navigation-item-home" role="button" style={outerStyle} onClick={() => router.push("/home")}>
          <span className={isRouteActive("/home") ? "text-utility-1-default" : "text-utility-1-opacity-1"} style={pillStyle(isRouteActive("/home"))}>
            <HomeIcon active={isRouteActive("/home")} />
          </span>
        </div>

        {/* Markets */}
        <div data-testid="navigation-item-trending-tokens" role="button" style={outerStyle} onClick={() => router.push("/markets")}>
          <span className={isRouteActive("/markets") ? "text-utility-1-default" : "text-utility-1-opacity-1"} style={pillStyle(isRouteActive("/markets"))}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 640 640" style={{ transform: "rotate(-10deg)" }}>
              <path d="M416 224C398.3 224 384 209.7 384 192C384 174.3 398.3 160 416 160L576 160C593.7 160 608 174.3 608 192L608 352C608 369.7 593.7 384 576 384C558.3 384 544 369.7 544 352L544 269.3L374.6 438.7C362.1 451.2 341.8 451.2 329.3 438.7L224 333.3L86.6 470.6C74.1 483.1 53.8 483.1 41.3 470.6C28.8 458.1 28.8 437.8 41.3 425.3L201.3 265.3C213.8 252.8 234.1 252.8 246.6 265.3L352 370.7L498.7 224L416 224z"></path>
            </svg>
          </span>
        </div>

        {/* Perps */}
        <div data-testid="navigation-item-earn" role="button" style={outerStyle} onClick={() => router.push("/perps")}>
          <span className={isRouteActive("/perps") ? "text-utility-1-default" : "text-utility-1-opacity-1"} style={pillStyle(isRouteActive("/perps"))}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
            </svg>
          </span>
        </div>

        {/* Discover */}
        <div data-testid="navigation-item-discover" role="button" style={outerStyle} onClick={() => router.push("/discover")}>
          <span className={isRouteActive("/discover") ? "text-utility-1-default" : "text-utility-1-opacity-1"} style={pillStyle(isRouteActive("/discover"))}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 640" height="22" width="22">
              <path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM370.7 389.1L226.4 444.6C207 452.1 187.9 433 195.4 413.6L250.9 269.3C254.2 260.8 260.8 254.2 269.3 250.9L413.6 195.4C433 187.9 452.1 207 444.6 226.4L389.1 370.7C385.8 379.2 379.2 385.8 370.7 389.1zM352 320C352 302.3 337.7 288 320 288C302.3 288 288 302.3 288 320C288 337.7 302.3 352 320 352C337.7 352 352 337.7 352 320z"></path>
            </svg>
          </span>
        </div>
      </div>

      {/* Search */}
      <div data-testid="navigation-item-search" role="button" className="flex items-center justify-center shrink-0 rounded-full" style={{ width: "64px", height: "64px", backgroundColor: NAV_BG, border: NAV_BORDER, cursor: "pointer" }}>
        <svg className="text-utility-1-opacity-1" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="m15.9 15.9 3.9 3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
