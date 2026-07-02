import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet Simulator Guides, Mockups & Creator Workflows",
  description:
    "Read RPWallet guides about Phantom wallet simulators, crypto wallet mockups, roleplay screenshots, product demos, creator workflows, and safe simulated wallet content.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "RPWallet Blog - Wallet Simulator Guides",
    description:
      "Guides for Phantom wallet simulators, crypto wallet mockups, creator screenshots, roleplay content, and product demo workflows.",
    url: "/blog",
  },
  twitter: {
    title: "RPWallet Blog - Wallet Simulator Guides",
    description:
      "Guides for Phantom wallet simulators, crypto wallet mockups, creator screenshots, roleplay content, and product demo workflows.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
