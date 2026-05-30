import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = "LarperWallet preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "radial-gradient(circle at 50% 30%, #2b1c5c 0%, #130b27 45%, #07050d 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.04em",
          width: "100%",
        }}
      >
        <div style={{ color: "#ab9ff2", display: "flex", fontSize: 42, fontWeight: 800, marginBottom: 28 }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 800, lineHeight: 1.02, textAlign: "center" }}>
          Fake wallet.
          <br />
          Real reactions.
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", display: "flex", fontSize: 32, fontWeight: 500, marginTop: 34 }}>
          Premium crypto wallet simulator for creators
        </div>
      </div>
    ),
    size,
  );
}
