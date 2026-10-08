import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel Dashboard Generator Online",
  description: "Create an interactive dashboard from Excel or CSV automatically. Generate KPIs, trends, category breakdowns, filters and exportable records online.",
  path: "/features/excel-dashboard-generator",
  keywords: [
    "Excel dashboard generator online",
    "create dashboard from Excel automatically",
    "CSV dashboard generator",
    "automatic Excel dashboard",
    "create dashboard from CSV",
    "interactive spreadsheet dashboard",
  ],
});

export default function DashboardGeneratorPage() {
  return <SeoFeaturePage
    eyebrow="EXCEL & CSV DASHBOARD GENERATOR"
    title="Create an interactive dashboard from Excel or CSV automatically."
    lead="Upload a dataset and Azhan Data Studio detects measures, dates and categories, then builds an interactive dashboard with KPIs, trends, breakdowns, filters, insights and underlying records. No manual chart setup required."
    toolHref="/studio"
    toolLabel="Generate a dashboard"
    secondaryHref="/guides/create-dashboard-from-excel"
    secondaryLabel="Read the Excel dashboard guide"
    highlights={["Free to use", "No login required", "Automatic field detection", "Interactive filters", "CSV & Excel support"]}
    features={[
      { title: "Automatic KPI selection", description: "Numeric measures are identified and promoted into headline KPI cards with sensible sum or average aggregation." },
      { title: "Trend detection", description: "When a reliable date or period field is available, the dashboard creates a time trend for the primary measure." },
      { title: "Category breakdowns", description: "Repeated category fields are converted into contribution and comparison views so you can see where results come from." },
      { title: "Interactive filtering", description: "Filter the dashboard by detected business dimensions and refresh every KPI, chart, insight and record preview together." },
      { title: "Customise the view", description: "Choose the primary KPI, secondary KPI, time field and category fields without changing the underlying source data." },
      { title: "Export the evidence", description: "Print the dashboard for PDF output or download the records behind the current filtered view." },
    ]}
    example={{
      eyebrow: "EXAMPLE: SALES DASHBOARD FROM EXCEL",
      title: "Turn a simple spreadsheet into decision-ready views.",
      intro: "Imagine an Excel file containing Month, Region and Sales. Data Studio can identify the measure, time field and category automatically, then build a dashboard around the strongest analytical roles.",
      metrics: [
        { label: "January sales", value: "$82.4K" },
        { label: "February sales", value: "$91.2K" },
        { label: "March sales", value: "$104.5K" },
        { label: "Jan → Mar growth", value: "+26.8%" },
      ],
      notes: [
        "A time trend shows whether the primary measure is rising, falling or stable.",
        "Category breakdowns can compare regions, products, teams or other repeated dimensions.",
        "Filters update KPIs, charts and the underlying record preview together.",
      ],
    }}
    steps={[
      { title: "Upload a CSV or Excel file", description: "Use the Analyse Single File workspace and select the relevant sheet when working with Excel." },
      { title: "Let Data Studio understand the fields", description: "The analysis engine identifies measures, percentages, dates, categories and identifiers." },
      { title: "Open Dashboard", description: "A dashboard is generated from the detected analytical roles using the strongest available measures and dimensions." },
      { title: "Filter or customise", description: "Change category filters or select different fields for KPIs, trends, comparisons and distributions." },
      { title: "Export or continue exploring", description: "Save filtered records, print the dashboard, or continue into detailed insights, data quality and field evidence." },
    ]}
    useCases={["Sales dashboards", "Operational reporting", "Marketing extracts", "Inventory analysis", "HR datasets", "Customer data", "Monthly KPI files", "Management reporting"]}
    relatedLinks={[
      { href: "/guides/create-dashboard-from-excel", title: "How to Automatically Create a Dashboard From Excel", description: "Learn how to structure a spreadsheet and generate a useful dashboard without building charts manually." },
      { href: "/guides/analyse-excel-data-online", title: "How to Analyse Excel Data Online", description: "A broader workflow for profiling, quality checks, insights, charts and reports." },
      { href: "/features/csv-excel-analysis", title: "CSV & Excel Data Analysis", description: "Explore the full analysis workflow beyond the generated dashboard." },
    ]}
    faqs={[
      { question: "How do I create a dashboard from Excel automatically?", answer: "Upload the Excel workbook, select the analysis-ready sheet and run Analyse Data. If the file contains usable numeric measures, Data Studio can automatically build KPIs, trends, category breakdowns and filters from the detected fields." },
      { question: "Does the dashboard work with any spreadsheet?", answer: "The generator works best when the dataset contains at least one numeric measure. Date and category fields allow richer trends, filters and comparison charts." },
      { question: "Do I have to choose the charts myself?", answer: "No. Data Studio selects a dashboard automatically from the inferred analytical roles. You can then customise the selected fields if you want a different view." },
      { question: "Does customising the dashboard edit my uploaded file?", answer: "No. Dashboard configuration only changes how the current analysis is displayed. It does not alter the source dataset." },
      { question: "Can I export the dashboard?", answer: "You can use the dashboard export action for print/PDF output and download the filtered records as CSV." },
    ]}
    pagePath="/features/excel-dashboard-generator"
  />;
}
