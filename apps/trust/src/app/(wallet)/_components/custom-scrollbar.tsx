"use client";

import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

export interface CustomScrollbarRef {
  show: () => void;
  update: (pullDownY?: number) => void;
}

interface CustomScrollbarProps {
  scrollRef: React.RefObject<HTMLElement | null>;
  className?: string;
  style?: React.CSSProperties;
}

const CustomScrollbar = forwardRef<CustomScrollbarRef, CustomScrollbarProps>(
  ({ scrollRef, className, style }, ref) => {
    const [visible, setVisible] = useState(false);
    const [hasHeight, setHasHeight] = useState(false);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use MotionValues for high-performance updates without React renders
    const heightValue = useMotionValue(0);
    const yValue = useMotionValue(0);

    // Apply spring for smooth iOS-like overscroll behavior
    const heightSpring = useSpring(heightValue, { stiffness: 450, damping: 40, mass: 0.8 });
    const ySpring = useSpring(yValue, { stiffness: 450, damping: 40, mass: 0.8 });

    const updateScrollbar = (pullDownY = 0) => {
      const scroll = scrollRef.current;
      if (!scroll) return;

      const { scrollTop, scrollHeight, clientHeight } = scroll;
      const contentHeight = scrollHeight;
      const viewportHeight = clientHeight;

      const trackHeight = trackRef.current?.clientHeight || viewportHeight;

      if (contentHeight <= viewportHeight) {
        setHasHeight(false);
        return;
      }

      const trueHeightRatio = viewportHeight / contentHeight;
      const heightRatio = trueHeightRatio * 0.65; // Slightly smaller than standard iOS physics
      let thumbHeightPx = Math.max(heightRatio * trackHeight, 35);

      const maxScrollTop = contentHeight - viewportHeight;
      const scrollRatio = Math.max(0, Math.min(1, scrollTop / maxScrollTop));

      const availableHeight = trackHeight - thumbHeightPx - 8; // 4px margin top/bottom
      let thumbTopPx = scrollRatio * availableHeight;

      // iOS Squeeze Effect during overscroll/pull
      if (pullDownY > 0) {
        const squeezeFactor = 0.9;
        const shrink = Math.min(pullDownY * squeezeFactor, thumbHeightPx - 10);
        thumbHeightPx -= shrink;
        thumbTopPx = 4;
      } else if (scrollTop < 0) {
        const overscroll = Math.abs(scrollTop);
        const shrink = Math.min(overscroll * 0.7, thumbHeightPx - 10);
        thumbHeightPx -= shrink;
        thumbTopPx = 4;
      } else if (scrollTop > maxScrollTop) {
        const overscroll = scrollTop - maxScrollTop;
        const shrink = Math.min(overscroll * 0.7, thumbHeightPx - 10);
        thumbHeightPx -= shrink;
        thumbTopPx = trackHeight - thumbHeightPx - 4;
      }

      setHasHeight(true);
      heightValue.set(thumbHeightPx);
      yValue.set(thumbTopPx);

      show();
    };

    const show = () => {
      setVisible(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        setVisible(false);
      }, 2000);
    };

    useImperativeHandle(ref, () => ({
      show,
      update: (pullDownY?: number) => updateScrollbar(pullDownY ?? 0),
    }));

    useEffect(() => {
      const scroll = scrollRef.current;
      if (!scroll) return;

      const handleScroll = () => updateScrollbar();
      scroll.addEventListener("scroll", handleScroll, { passive: true });

      // Initial update
      updateScrollbar();

      // Observer for content changes
      const observer = new ResizeObserver(() => updateScrollbar());
      observer.observe(scroll);
      if (scroll.firstElementChild) {
        observer.observe(scroll.firstElementChild);
      }

      return () => {
        scroll.removeEventListener("scroll", handleScroll);
        observer.disconnect();
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
      };
    }, [scrollRef]);

    return (
      <div
        ref={trackRef}
        className={className}
        style={{
          position: "absolute",
          right: "3px",
          top: 0,
          bottom: 0,
          width: "3px",
          zIndex: 40,
          pointerEvents: "none",
          visibility: hasHeight ? "visible" : "hidden",
          ...style,
        }}
      >
        <AnimatePresence>
          {visible && hasHeight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
              style={{
                position: "absolute",
                top: 0,
                height: heightSpring,
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.35)",
                borderRadius: "100px",
                y: ySpring,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

CustomScrollbar.displayName = "CustomScrollbar";

export default CustomScrollbar;
