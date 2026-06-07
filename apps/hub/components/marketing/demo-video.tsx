"use client";

import { motion } from "framer-motion";

export default function DemoVideo() {
  return (
    <div className="w-full mt-2 md:mt-6 relative px-0 md:px-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative group w-[calc(80vh*9/16)] max-w-full aspect-[9/16] mx-auto"
      >
        <div className="absolute -inset-4 bg-phantom-purple/10 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="absolute inset-0 bg-phantom-purple/5 blur-xl rounded-[2.5rem]" />

        <div className="relative glass-panel overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] w-full h-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border-white/10 transition-all duration-700 bg-black">
          <iframe
            src="https://www.youtube.com/embed/q8zbEgjO2hM?autoplay=1&mute=0&modestbranding=1&rel=0&showinfo=0"
            title="RPWallet Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </motion.div>
    </div>
  );
}
