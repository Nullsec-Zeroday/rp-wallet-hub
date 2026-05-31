import React from "react";
import { usePathname, useRouter } from "next/navigation";
import WalletHeader from "./app/(wallet)/_components/wallet-header";
import WalletFooter from "./app/(wallet)/_components/wallet-footer";
import CustomScrollbar, { type CustomScrollbarRef } from "./app/(wallet)/_components/custom-scrollbar";
import HomePage from "./app/(wallet)/home/page";
import MarketsPage from "./app/(wallet)/markets/page";
import PerpsPage from "./app/(wallet)/perps/page";
import DiscoverPage from "./app/(wallet)/discover/page";
import SwapPage from "./app/(wallet)/swap/page";

export default function WalletShell() {
  const pathname = usePathname();
  const router = useRouter();

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

  const THRESHOLD = 75;
  const SETTLED_Y = 90;
  const SPINNER_PULL_SENSITIVITY = 0.00001;

  React.useEffect(() => {
    if (pathname === "/" || pathname === "/bootstrap") {
      router.replace("/home");
    }
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

        // Simulate fetch delay
        setTimeout(() => {
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
        }, 1000);

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
  }, [setTranslateY, updateSpinner]);

  return (
    <div className="absolute inset-0 flex h-screen w-full flex-col overflow-hidden bg-[#1B1B1C]">
      <div id="_rht_toaster" className="p-0" style={{ position: "fixed", zIndex: 9999, inset: "16px", pointerEvents: "none" }}></div>
      <div className="relative flex flex-col flex-1 w-full h-full self-center md:max-w-[438px] overflow-hidden">

        <WalletHeader scrolled={scrolled} />

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
                style={{ "--spinner-color": "#888888" } as React.CSSProperties}
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

        <main
          ref={scrollRef}
          className="min-h-0 flex-1 wallet-scroll relative overflow-y-auto overscroll-y-contain pb-[75px] pt-0"
          onScroll={(event) => {
            const nextScrolled = event.currentTarget.scrollTop > 130;
            setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
            scrollbarRef.current?.show();
          }}
        >
          <div
            ref={contentRef}
            className="min-h-full will-change-transform"
            style={{ transform: "translateZ(0)" }}
          >
            {pathname.startsWith("/home") && <HomePage />}
            {pathname.startsWith("/markets") && <MarketsPage />}
            {pathname.startsWith("/swap") && <SwapPage />}
            {pathname.startsWith("/perps") && <PerpsPage />}
            {pathname.startsWith("/discover") && <DiscoverPage />}
          </div>
        </main>

        <CustomScrollbar
          ref={scrollbarRef}
          scrollRef={scrollRef}
          style={{
            top: "calc(60px + env(safe-area-inset-top))",
            bottom: "calc(65px + env(safe-area-inset-bottom, 0px))",
          }}
        />

        <WalletFooter />
      </div>
    </div>
  );
}
