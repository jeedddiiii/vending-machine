import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendX — Smart Vending Machine",
  description:
    "A modern vending machine simulator with real-time inventory and intelligent change-making",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
