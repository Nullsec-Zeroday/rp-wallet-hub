import React from "react";

// Exact port of ActionIcons.tsx from the RN project

export const SendIcon = ({ className }: { className?: string }) => (
  <img src="/icons/send_icon_highlighted.webp" alt="Send" className={className} style={{ width: 22, height: 22, objectFit: 'contain' }} />
);

export const SwapIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 14-4 4m0 0 4 4m-4-4h11a4 4 0 0 0 4-4m-5-4 4-4m0 0-4-4m4 4H8a4 4 0 0 0-4 4" />
  </svg>
);

// Inline SVG (ported from /svg/receive.svg) so the icon can never break from a
// missing/stale-cached asset — the previous <img src="…webp"> could 404.
export const ReceiveIcon = ({ className }: { className?: string }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fill="#ac9cf2" d="M13 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM13 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM16 17a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z" />
    <path stroke="#ac9cf2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM14 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
    <path fill="#ac9cf2" fillRule="evenodd" clipRule="evenodd" d="M5.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM5.5 17.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM16.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6z" />
  </svg>
);

export const BuyIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1v22m5-18H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
  </svg>
);

export const LongIcon = ({ className }: { className?: string }) => (
  <img src="/icons/long_highlighted.webp" alt="Long" className={className} style={{ width: 27, height: 27, objectFit: 'contain' }} />
);

export const ShortIcon = ({ className }: { className?: string }) => (
  <img src="/icons/short_highlighted.webp" alt="Short" className={className} style={{ width: 27, height: 27, objectFit: 'contain' }} />
);

export const MoreIcon = ({ className }: { className?: string }) => (
  <svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#AB9FF2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);
