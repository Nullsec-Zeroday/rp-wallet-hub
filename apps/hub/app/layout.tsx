import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { buildDefaultMetadata } from "@/lib/seo";
import "./styles.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import PostHogProvider from "@/components/marketing/posthog-provider";

const satoshi = localFont({
  src: "../public/font/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
});

export const metadata: Metadata = buildDefaultMetadata();

export const viewport: Viewport = {
  themeColor: "#0c0a18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark antialiased font-sans ${satoshi.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-[#0c0a18]">
        <PostHogProvider>{children}</PostHogProvider>
        {/* <SpeedInsights /> */}
        <Analytics />
      </body>
    </html>
  );
}
