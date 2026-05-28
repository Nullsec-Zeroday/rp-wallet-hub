"use client";

import { motion } from "framer-motion";
import React from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  viewportOnce?: boolean;
  useAnimate?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
  viewportOnce = true,
  useAnimate = false,
}: FadeInProps) {
  const directions = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 },
    none: { y: 0, x: 0 },
  };

  const initial = directions[direction];

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...initial 
      }}
      {...(useAnimate 
        ? { animate: { opacity: 1, y: 0, x: 0 } } 
        : { whileInView: { opacity: 1, y: 0, x: 0 } }
      )}
      viewport={{ once: viewportOnce, margin: "-50px" }}
      transition={{
        duration: 0.8,
        delay: delay / 1000,
        ease: [0.21, 0.47, 0.32, 0.98], // Custom premium ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
