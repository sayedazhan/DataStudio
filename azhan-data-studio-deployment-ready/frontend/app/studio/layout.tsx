import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Launch Data Studio — Analyse Excel & CSV Online",
  description: "Launch Azhan Data Studio to analyse Excel and CSV files, generate dashboards, check data quality, compare datasets, forecast trends and create professional reports.",
  path: "/studio",
  keywords: ["analyse Excel online", "CSV analysis tool", "data analysis workspace", "Excel dashboard generator"],
});

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
