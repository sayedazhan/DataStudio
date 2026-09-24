import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Monthly Data Analysis & Trend Tracking",
  description: "Combine recurring CSV or Excel files, track month-to-month movement, surface changes and review trends without rebuilding a dashboard each month.",
  path: "/monthly",
  keywords: ["monthly data analysis", "month over month analysis", "Excel trend tracking", "CSV trend analysis"],
});

export default function MonthlyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
