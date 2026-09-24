import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Compare CSV & Excel Datasets",
  description: "Compare two CSV or Excel datasets, identify what changed, quantify movement and review the fields and categories driving the difference.",
  path: "/compare",
  keywords: ["compare CSV files", "compare Excel datasets", "data comparison tool", "dataset change analysis"],
});

export default function CompareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
