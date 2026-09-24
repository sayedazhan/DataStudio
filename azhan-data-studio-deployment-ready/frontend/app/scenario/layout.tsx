import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Scenario Analysis & What-If Tool",
  description: "Test what-if assumptions against your data, compare scenarios and understand how changes in key drivers could affect the result.",
  path: "/scenario",
  keywords: ["scenario analysis tool", "what if analysis", "Excel scenario analysis", "business scenario modelling"],
});

export default function ScenarioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
