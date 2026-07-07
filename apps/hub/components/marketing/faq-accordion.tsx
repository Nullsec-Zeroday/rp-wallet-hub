"use client";

import { useState } from "react";

// Click-to-expand FAQ, styled identically to the landing page accordion
// (single glass panel, #ab9ff2 active accent, rotating chevron).
export function FaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div
      className="backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] max-w-2xl mx-auto flex flex-col relative z-10 overflow-hidden shadow-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: [
          "inset 0 1px 1px rgba(255,255,255,0.15)",
          "inset 0 -1px 1px rgba(0,0,0,0.1)",
          "0 8px 40px rgba(0,0,0,0.3)",
          "0 2px 6px rgba(0,0,0,0.15)",
          "0 0 0 0.5px rgba(255,255,255,0.08)",
        ].join(", "),
      }}
    >
      {/* Top specular highlight edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      {/* Bottom subtle dark edge */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
      {/* Inner refraction glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-[2.5rem]" />

      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            className="py-5 border-b border-white/5 last:border-b-0 text-left cursor-pointer transition-all duration-300 relative group select-none"
          >
            <div className="flex items-center justify-between gap-4">
              <h3
                className={`font-medium text-base md:text-[17px] transition-colors duration-300 relative z-10 ${
                  isOpen ? "text-[#ab9ff2]" : "text-white group-hover:text-[#ab9ff2]/80"
                }`}
              >
                {item.question}
              </h3>
              <div
                className={`size-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 group-hover:bg-white/[0.06] ${
                  isOpen ? "rotate-180 bg-[#ab9ff2]/10 border-[#ab9ff2]/30" : ""
                }`}
              >
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-colors duration-300 ${
                    isOpen ? "text-[#ab9ff2]" : "text-white/40"
                  }`}
                >
                  <path d="m1 1 4 4 4-4" />
                </svg>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="pt-3.5 text-white/50 text-[14px] leading-relaxed font-medium pr-8 pb-1 relative z-10">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
