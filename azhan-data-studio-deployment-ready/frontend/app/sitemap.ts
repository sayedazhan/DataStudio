import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

const LAST_UPDATED = new Date("2026-10-08T16:30:00+11:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/product", priority: 0.96, changeFrequency: "monthly" as const },
    { path: "/solutions", priority: 0.95, changeFrequency: "monthly" as const },
    { path: "/solutions/sales-analysis", priority: 0.94, changeFrequency: "monthly" as const },
    { path: "/solutions/inventory-analysis", priority: 0.94, changeFrequency: "monthly" as const },
    { path: "/solutions/financial-analysis", priority: 0.94, changeFrequency: "monthly" as const },
    { path: "/solutions/operations-analysis", priority: 0.94, changeFrequency: "monthly" as const },
    { path: "/reports", priority: 0.96, changeFrequency: "monthly" as const },
    { path: "/white-label-reports", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.82, changeFrequency: "monthly" as const },
    { path: "/guides", priority: 0.94, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.65, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/support", priority: 0.72, changeFrequency: "monthly" as const },
    { path: "/studio", priority: 0.98, changeFrequency: "weekly" as const },
    { path: "/features", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/features/excel-dashboard-generator", priority: 0.98, changeFrequency: "monthly" as const },
    { path: "/features/csv-excel-analysis", priority: 0.98, changeFrequency: "monthly" as const },
    { path: "/features/data-quality-checker", priority: 0.98, changeFrequency: "monthly" as const },
    { path: "/features/compare-excel-files", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/features/data-forecasting", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/guides/check-excel-data-quality", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/guides/create-dashboard-from-excel", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/guides/analyse-excel-data-online", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/guides/compare-excel-files", priority: 0.88, changeFrequency: "monthly" as const },
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
