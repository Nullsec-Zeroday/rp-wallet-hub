import type { ReactNode } from "react";

// Signature glass panel used across the marketing site (hero cards, pricing,
// FAQ, CTA). Mirrors the exact gradient + layered box-shadow + specular edges
// from the landing page so new pages feel identical.
export function GlassCard({
  children,
  className = "",
  radius = "rounded-3xl",
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden backdrop-blur-xl ${radius} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: [
          "inset 0 1px 1px rgba(255,255,255,0.15)",
          "inset 0 -1px 1px rgba(0,0,0,0.1)",
          "0 4px 24px rgba(0,0,0,0.25)",
          "0 1px 3px rgba(0,0,0,0.15)",
          "0 0 0 0.5px rgba(255,255,255,0.08)",
        ].join(", "),
      }}
    >
      {/* Top specular highlight edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      {/* Bottom subtle dark edge */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
      {/* Inner refraction glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none ${radius}`}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
