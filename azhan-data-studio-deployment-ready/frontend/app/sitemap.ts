import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

const LAST_UPDATED = new Date("2026-09-24T00:00:00+10:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/features", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/features/excel-dashboard-generator", priority: 0.98, changeFrequency: "monthly" as const },
    { path: "/features/csv-excel-analysis", priority: 0.95, changeFrequency: "monthly" as const },
    { path: "/features/data-quality-checker", priority: 0.95, changeFrequency: "monthly" as const },
    { path: "/features/compare-excel-files", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/features/data-forecasting", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/clean", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/monthly", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/compare", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/forecast", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/scenario", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/statistics", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: LAST_UPDATED,
    changeFrequency,
    priority,
  }));
}
