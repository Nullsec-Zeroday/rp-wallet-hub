import type { Metadata } from "next";
import { PaymentResultPage } from "../result-page";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Your RPWallet checkout was cancelled before payment completed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentCancelledPage() {
  return <PaymentResultPage kind="cancelled" />;
}
