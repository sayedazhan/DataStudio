import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azhan Data Studio | Automated Data Intelligence",
  description: "Azhan Data Studio by Azhan Hassan turns structured data into ranked insights, visual discovery, data-quality evidence, and presentation-ready analytical reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
