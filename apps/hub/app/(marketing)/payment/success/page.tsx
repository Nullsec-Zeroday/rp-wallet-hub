import type { Metadata } from "next";
import { PaymentResultPage } from "../result-page";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your RPWallet payment was submitted successfully.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    provider?: string | string[];
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const params = await searchParams;
  const providerParam = Array.isArray(params.provider) ? params.provider[0] : params.provider;
  const provider = providerParam?.toLowerCase() === "sellauth" ? "sellauth" : "nowpayments";
  return <PaymentResultPage kind="success" provider={provider} />;
}
