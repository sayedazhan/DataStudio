import type { Metadata } from "next";
import SolutionDetailPage from "../../components/solution-detail-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Inventory Data Analysis from Excel & CSV",
  description: "Analyse inventory spreadsheets with stock KPIs, category breakdowns, movement trends, monthly comparisons, data quality checks and shareable reports.",
  path: "/solutions/inventory-analysis",
  keywords: ["inventory analysis Excel", "inventory data analysis", "stock analysis spreadsheet", "inventory dashboard Excel", "stock movement analysis"],
});

export default function InventoryAnalysisPage(){
  return <SolutionDetailPage
    slug="inventory-analysis"
    eyebrow="INVENTORY ANALYSIS"
    title="Turn inventory spreadsheets into a clearer view of stock and movement."
    description="Analyse Excel or CSV inventory data to understand stock levels, categories, locations, movement, unusual values and period-to-period change without manually building every chart."
    intro="Inventory files can become difficult to review when they contain thousands of SKUs, locations and movement records. Data Studio helps profile the structure, surface concentration and compare relevant measures."
    questions={[
      {title:"Where is stock concentrated?", copy:"Compare stock levels across product groups, locations, warehouses or other categorical fields."},
      {title:"Which items stand out?", copy:"Use rankings and distributions to identify unusually high, low or concentrated numeric values."},
      {title:"How is movement changing?", copy:"When time fields are available, inspect movement over time and compare recurring monthly files."},
      {title:"Can the file be trusted?", copy:"Check missing values, duplicates, inconsistent categories and outliers before using the dataset for decisions."},
    ]}
    exampleFields={["SKU / item code", "Product category", "Warehouse / location", "Quantity on hand", "Movement / usage", "Date / month"]}
    workflow={[
      {title:"Profile the inventory file", copy:"Detect numeric measures, category fields, dates and quality issues across the uploaded data."},
      {title:"Review stock patterns", copy:"Use rankings, distributions and category breakdowns to understand where values are concentrated."},
      {title:"Compare or track periods", copy:"Use Compare Datasets or Monthly Intelligence when you have recurring inventory snapshots."},
      {title:"Create a management report", copy:"Generate a concise report with KPIs, visuals, findings and quality context."},
    ]}
    outputs={["Stock and quantity KPIs", "Top / bottom categories", "Location or warehouse breakdown", "Movement trend when available", "Monthly comparison", "Inventory analysis report"]}
    related={[
      {href:"/monthly", title:"Monthly Intelligence", copy:"Track recurring monthly files and review how inventory measures move over time."},
      {href:"/compare", title:"Compare Datasets", copy:"Compare two inventory snapshots and identify changes between file versions."},
      {href:"/features/data-quality-checker", title:"Data Quality Checker", copy:"Find missing fields, duplicates and unusual values before analysis."},
      {href:"/reports", title:"Reporting Studio", copy:"Create a professional summary for management or stakeholders."},
    ]}
    faqs={[
      {q:"Can I analyse an inventory Excel file online?", a:"Yes. Upload a structured Excel or CSV inventory file. Data Studio uses the available fields to build an appropriate analysis rather than requiring a fixed template."},
      {q:"Can I compare this month with last month?", a:"Yes. Compare Datasets can compare two compatible file versions, while Monthly Intelligence is designed for recurring period-based analysis."},
      {q:"Does it change my inventory data automatically?", a:"The analysis workflow does not require automatic changes. Use Clean My Data when you specifically want to review and apply cleaning actions."},
    ]}
  />;
}
