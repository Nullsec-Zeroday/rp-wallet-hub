"use client";

export default function MadeInUsaBadge({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/5 bg px-3 py-1.5 backdrop-blur-md ${className || ""}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
        <circle cx="6" cy="6" r="6" fill="white" fillOpacity="0.1" />
        <path d="M2 4H10M2 6H10M2 8H10" stroke="white" strokeOpacity="0.4" strokeWidth="0.5" />
        <rect x="2" y="3" width="3.5" height="3" fill="white" fillOpacity="0.2" />
      </svg>
      <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Engineered in USA</span>
    </div>
  );
}
