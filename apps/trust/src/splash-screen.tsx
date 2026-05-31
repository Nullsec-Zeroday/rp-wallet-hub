"use client";

import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <motion.main
      className="absolute inset-0 z-[9999] h-screen flex w-full flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#1b1b1c" }}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, delay: 0.5, ease: "easeInOut" }
      }}
    >
      <img 
        src="/logos/trust-wallet-icon.webp" 
        alt="Trust Logo" 
        style={{ width: 140, height: 140 }} 
      />
    </motion.main>
  );
}
