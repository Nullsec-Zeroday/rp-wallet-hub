import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose an LarperWallet plan and get access to the novelty wallet simulator for demos, mockups, and roleplay screenshots.",
  alternates: {
    canonical: "/buy",
  },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
