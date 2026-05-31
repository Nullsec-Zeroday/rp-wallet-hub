import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Crypto Wallet Simulator Guides, LARP Wallet Tips & Fake Wallet Tutorials",
  description:
    "Guides and tutorials on crypto wallet simulators, fake wallet apps, LARP wallets, Phantom wallet simulation, Trust Wallet simulators, Ledger wallet demos, and crypto content creation workflows.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
