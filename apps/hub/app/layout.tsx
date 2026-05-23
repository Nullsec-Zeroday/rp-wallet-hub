import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "RP Wallet Hub",
  description: "Central dashboard for RP Wallet apps.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
