import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LarperWallet",
    short_name: "LarperWallet",
    description: "A premium crypto wallet simulator and Phantom-style wallet mockup for creators.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a18",
    theme_color: "#0c0a18",
    icons: [
      {
        src: "/logo_white.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
