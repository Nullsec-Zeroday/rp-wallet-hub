import React from "react";

// Exact port of ActionIcons.tsx from the RN project

export const SendIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m10 14 1.086 3.802c.831 2.909 4.958 2.898 5.774-.015L20.04 6.424c.42-1.502-.963-2.886-2.465-2.465L6.213 7.14c-2.913.816-2.924 4.943-.015 5.774zm0 0 3-3" />
  </svg>
);

export const SwapIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 14-4 4m0 0 4 4m-4-4h11a4 4 0 0 0 4-4m-5-4 4-4m0 0-4-4m4 4H8a4 4 0 0 0-4 4" />
  </svg>
);

export const ReceiveIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" className={className}>
    <path fill="#AB9FF2" d="M13 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM13 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM16 17a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z" />
    <path stroke="#AB9FF2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM14 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
    <path fill="#AB9FF2" fillRule="evenodd" d="M5.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM5.5 17.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM16.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6z" clipRule="evenodd" />
  </svg>
);

export const BuyIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1v22m5-18H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
  </svg>
);

export const LongIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

export const ShortIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m22 17-8.5-8.5-5 5L2 7" />
    <path d="M16 17h6v-6" />
  </svg>
);

export const MoreIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);
