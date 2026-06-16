import type { Metadata } from "next";
import { PaymentResultPage } from "../result-page";

export const metadata: Metadata = {
  title: "Payment Submitted",
  description: "Your RPWallet crypto payment has been submitted and is waiting for blockchain confirmation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentSuccessPage() {
  return <PaymentResultPage kind="success" />;
}
