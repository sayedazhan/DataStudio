import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Dashboard Generator",
  description: "Upload an Excel or CSV file and automatically generate an interactive dashboard with KPIs, trends, category breakdowns, filters, insights and filtered record exports.",
  path: "/features/excel-dashboard-generator",
  keywords: [
    "Excel dashboard generator",
    "CSV dashboard generator",
    "automatic dashboard from Excel",
    "create dashboard from CSV",
    "interactive spreadsheet dashboard",
    "online data dashboard generator",
  ],
});

export default function DashboardGeneratorPage() {
  return <SeoFeaturePage
    eyebrow="AUTOMATIC DASHBOARD BUILDER"
    title="Turn Excel and CSV files into interactive dashboards automatically."
    lead="Upload a dataset and Azhan Data Studio detects measures, dates and categories, then builds a dashboard with KPIs, trends, breakdowns, filters, insights and underlying records. No manual chart setup required."
    toolHref="/"
    toolLabel="Generate a dashboard"
    secondaryHref="/features/csv-excel-analysis"
    secondaryLabel="Explore data analysis"
    highlights={["No login required", "Automatic field detection", "Interactive filters", "Customisable dashboard", "CSV & Excel support"]}
    features={[
      { title: "Automatic KPI selection", description: "Numeric measures are identified and promoted into headline KPI cards with sensible sum or average aggregation." },
      { title: "Trend detection", description: "When a reliable date or period field is available, the dashboard creates a time trend for the primary measure." },
      { title: "Category breakdowns", description: "Repeated category fields are converted into contribution and comparison views so you can see where results come from." },
      { title: "Interactive filtering", description: "Filter the dashboard by detected business dimensions and refresh every KPI, chart, insight and record preview together." },
      { title: "Customise the view", description: "Choose the primary KPI, secondary KPI, time field and category fields without changing the underlying source data." },
      { title: "Export the evidence", description: "Print the dashboard for PDF output or download the records behind the current filtered view." },
    ]}
    steps={[
      { title: "Upload a CSV or Excel file", description: "Use the Analyse Single File workspace and select the relevant sheet when working with Excel." },
      { title: "Let Data Studio understand the fields", description: "The analysis engine identifies measures, percentages, dates, categories and identifiers." },
      { title: "Open Dashboard", description: "A dashboard is generated from the detected analytical roles using the strongest available measures and dimensions." },
      { title: "Filter or customise", description: "Change category filters or select different fields for KPIs, trends, comparisons and distributions." },
      { title: "Export or continue exploring", description: "Save filtered records, print the dashboard, or continue into detailed insights, data quality and field evidence." },
    ]}
    useCases={["Sales dashboards", "Operational reporting", "Marketing extracts", "Inventory analysis", "HR datasets", "Customer data", "Monthly KPI files", "Management reporting"]}
    faqs={[
      { question: "Does the dashboard work with any spreadsheet?", answer: "The generator works best when the dataset contains at least one numeric measure. Date and category fields allow richer trends, filters and comparison charts." },
      { question: "Do I have to choose the charts myself?", answer: "No. Data Studio selects a dashboard automatically from the inferred analytical roles. You can then customise the selected fields if you want a different view." },
      { question: "Does customising the dashboard edit my uploaded file?", answer: "No. Dashboard configuration only changes how the current analysis is displayed. It does not alter the source dataset." },
      { question: "Can I filter the dashboard?", answer: "Yes. Detected category fields become interactive filters and the dashboard recalculates the displayed measures and records for the filtered view." },
      { question: "Can I export the dashboard?", answer: "You can use the dashboard export action for print/PDF output and download the filtered records as CSV." },
    ]}
    pagePath="/features/excel-dashboard-generator"
  />;
}
