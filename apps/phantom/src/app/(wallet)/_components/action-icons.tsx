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

export const ReceiveIcon = ({ className }: { className?: string }) => (
  <img src="/icons/receive_icon_highlighted.webp" alt="Receive" className={className} style={{ width: 22, height: 22, objectFit: 'contain' }} />
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
