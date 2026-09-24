import type { Metadata } from "next";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Forecast CSV & Excel Data Online",
  description: "Create time-series forecasts from CSV or Excel data, choose date and metric fields, review projected values and understand the forecast range.",
  path: "/forecast",
  keywords: ["Excel forecasting tool", "CSV forecasting", "time series forecast", "forecast data online"],
});

export default function ForecastLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
