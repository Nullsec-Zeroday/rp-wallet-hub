"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

export default function SplashScreen() {
  // useEffect(() => {
  //   const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  //   if (metaThemeColor) metaThemeColor.setAttribute("content", "#AB9FF2");

  //   document.documentElement.style.backgroundColor = "#AB9FF2";
  //   document.body.style.backgroundColor = "#AB9FF2";

  //   return () => {
  //     if (metaThemeColor) metaThemeColor.setAttribute("content", "#111111");
  //     document.documentElement.style.backgroundColor = "";
  //     document.body.style.backgroundColor = "";
  //   };
  // }, []);

  return (
    <motion.main
      className="absolute inset-0 z-[9999] h-screen flex w-full flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#AB9FF2" }}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, delay: 0.8, ease: "easeInOut" }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 1 }}
        animate={{ scale: [0.9, 0.93, 0.9] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        exit={{
          scale: [0.9, 1, 1, 40],
          opacity: [1, 1, 1, 0],
          transition: {
            duration: 1.2,
            times: [0, 0.3, 0.7, 1],
            ease: ["easeOut", "linear", "easeIn"],
          }
        }}
      >
        <svg width="180" height="180" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M517.219 779.814C470.102 852.012 391.148 943.378 286.09 943.378C236.426 943.378 188.672 922.933 188.672 834.122C188.672 607.943 497.48 257.813 784.004 257.813C947.004 257.813 1011.95 370.902 1011.95 499.326C1011.95 664.168 904.98 852.651 798.648 852.651C764.902 852.651 748.347 834.122 748.347 804.732C748.347 797.065 749.621 788.759 752.168 779.814C715.875 841.789 645.836 899.292 580.254 899.292C532.5 899.292 508.305 869.263 508.305 827.094C508.305 811.76 511.488 795.787 517.219 779.814ZM904.363 494.869C904.363 532.291 882.284 551.002 857.586 551.002C832.514 551.002 810.809 532.291 810.809 494.869C810.809 457.448 832.514 438.737 857.586 438.737C882.284 438.737 904.363 457.448 904.363 494.869ZM764.031 494.871C764.031 532.293 741.952 551.004 717.254 551.004C692.182 551.004 670.477 532.293 670.477 494.871C670.477 457.449 692.182 438.739 717.254 438.739C741.952 438.739 764.031 457.449 764.031 494.871Z" fill="#FFFDF8" />
        </svg>
      </motion.div>
    </motion.main >
  );
}
