import type { Metadata } from "next";
import SolutionDetailPage from "../../components/solution-detail-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sales Data Analysis from Excel & CSV",
  description: "Analyse sales data from Excel or CSV files with revenue KPIs, product and region performance, trends, comparisons, forecasts and professional reports.",
  path: "/solutions/sales-analysis",
  keywords: ["sales data analysis Excel", "analyse sales data", "sales dashboard Excel", "sales revenue analysis", "sales report generator"],
});

export default function SalesAnalysisPage(){
  return <SolutionDetailPage
    slug="sales-analysis"
    eyebrow="SALES & REVENUE ANALYSIS"
    title="Analyse sales data from Excel without building the dashboard first."
    description="Upload a structured sales spreadsheet and turn it into revenue KPIs, product and region performance, trends, comparisons, forecasts and a professional report."
    intro="A sales file often contains enough information to answer the most important performance questions, but manually creating formulas, pivots and charts takes time. Data Studio helps surface the useful structure automatically."
    questions={[
      {title:"How is revenue performing?", copy:"Summarise totals, averages and other useful numeric measures from the fields available in the file."},
      {title:"Which products or categories lead?", copy:"Rank categories and compare their contribution to sales, units or other selected measures."},
      {title:"Where is performance strongest?", copy:"Break results down by region, branch, salesperson, channel or another categorical field."},
      {title:"What changed over time?", copy:"When a usable date field exists, inspect trend direction and use forecasting for forward-looking analysis."},
    ]}
    exampleFields={["Order date or month", "Product / category", "Region / branch", "Revenue or sales value", "Units / quantity", "Salesperson or channel"]}
    workflow={[
      {title:"Profile the sales file", copy:"Detect field types, missing data, useful measures and categorical dimensions."},
      {title:"Explore the dashboard", copy:"Review KPI cards, rankings, breakdowns and trends generated from the available fields."},
      {title:"Investigate changes", copy:"Compare periods, inspect data quality, or forecast a numeric metric when the dataset supports it."},
      {title:"Generate a report", copy:"Create a shareable analysis report with relevant KPIs, charts, findings and recommendations."},
    ]}
    outputs={["Revenue and volume KPIs", "Product and category ranking", "Regional / channel breakdown", "Time trend when available", "Forecast when supported", "Professional PDF report"]}
    related={[
      {href:"/features/excel-dashboard-generator", title:"Dashboard Generator", copy:"Create KPI cards, trends and category views from Excel or CSV data."},
      {href:"/features/data-quality-checker", title:"Data Quality Checker", copy:"Check missing values, duplicates and inconsistencies before trusting the result."},
      {href:"/features/data-forecasting", title:"Forecasting", copy:"Project a numeric sales metric forward when enough historical data is available."},
      {href:"/reports", title:"Reporting Studio", copy:"Turn the analysis into a professional report ready to share."},
    ]}
    faqs={[
      {q:"Can Data Studio analyse an Excel sales report?", a:"Yes. Upload a structured .xlsx or .csv file with column headings. The useful outputs depend on the fields and data types detected."},
      {q:"Do I need to build a pivot table first?", a:"No. The public workflow is designed to profile the uploaded data and generate analysis directly from structured rows and columns."},
      {q:"Can it forecast sales?", a:"Forecasting requires a usable time field, a numeric target and enough historical observations. If those conditions are not present, Data Studio avoids forcing a forecast."},
    ]}
  />;
}
