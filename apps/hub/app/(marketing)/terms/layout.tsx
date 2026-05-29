import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — LarperWallet",
  description: "Read the Terms & Conditions for using LarperWallet. Understanding the novelty nature and rules of our entertainment service.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
