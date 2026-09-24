import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Statistical Analysis for CSV & Excel",
  description: "Explore distributions, relationships and statistical evidence from CSV or Excel data with an accessible browser-based statistics workspace.",
  path: "/statistics",
  keywords: ["statistical analysis tool", "CSV statistics", "Excel statistical analysis", "data relationship analysis"],
});

export default function StatisticsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
