import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — RP Wallet",
  description: "Learn how RP Wallet protects your privacy and handles your data. We collect the absolute minimum to provide a secure entertainment experience.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
