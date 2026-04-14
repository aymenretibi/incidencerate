import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IR Validator",
  description: "Three-layer incidence rate feasibility check",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
