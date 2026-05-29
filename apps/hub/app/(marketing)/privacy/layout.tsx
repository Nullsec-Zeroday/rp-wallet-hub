import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LarperWallet",
  description: "Learn how LarperWallet protects your privacy and handles your data. We collect the absolute minimum to provide a secure entertainment experience.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
