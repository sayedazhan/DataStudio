import type { Metadata } from "next";
import { SeoGuidePage } from "../../components/seo-guide-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Create a Dashboard From Excel Automatically",
  description: "Learn how to turn an Excel spreadsheet into an interactive dashboard with KPIs, trends, category breakdowns and filters without building charts manually.",
  path: "/guides/create-dashboard-from-excel",
  keywords: ["create dashboard from Excel automatically", "how to create dashboard from Excel", "Excel dashboard generator", "automatic Excel dashboard", "Excel dashboard online"],
});

export default function GuidePage() {
  return <SeoGuidePage
    eyebrow="EXCEL DASHBOARD GUIDE"
    title="How to Automatically Create a Dashboard From Excel"
    lead="Turn a structured Excel table into KPIs, trends, category breakdowns and filters without manually building every chart."
    pagePath="/guides/create-dashboard-from-excel"
    toolHref="/studio"
    toolLabel="Create my dashboard"
    steps={[
      { title: "Use a clean table", description: "Keep one header row, one record per row and one field per column. Avoid merged cells, decorative titles and subtotal rows inside the dataset." },
      { title: "Include useful analytical fields", description: "A good dashboard usually needs at least one numeric measure such as Sales or Quantity. Date and category fields make trends and comparisons richer." },
      { title: "Upload the workbook", description: "Upload the .xlsx file and choose the sheet containing the analysis-ready table." },
      { title: "Let the fields be detected", description: "The analysis engine identifies numeric measures, dates, categories, percentages and identifiers." },
      { title: "Review the generated dashboard", description: "Check the selected KPIs, time trend, category breakdowns and filters. Customise the field choices if another view better answers your question." },
      { title: "Filter and export", description: "Use category filters to focus the dashboard and export the filtered records or print the dashboard to PDF." },
    ]}
    sections={[
      { heading: "What makes an Excel file dashboard-ready?", paragraphs: ["Dashboards work best when the spreadsheet is a table rather than a presentation. Each row should represent a consistent business record and each column should describe one attribute of that record.", "A file does not need dozens of fields. Even a simple table with Date, Region, Product and Sales can support a useful management dashboard."], bullets: ["Clear column names", "At least one numeric measure", "Dates stored consistently", "Repeated categories such as Region or Product", "No totals or notes mixed into the data rows"] },
      { heading: "Choose KPIs that answer a business question", paragraphs: ["A dashboard is useful when the headline numbers connect to a decision. Sales data might need Total Sales, Average Order Value and Order Count. Inventory data might need Stock on Hand, Units Sold and Slow-Moving Items.", "Automatic generation gives you a starting point, but you should still ask whether the selected KPI reflects the question you are trying to answer."] },
      { heading: "Use filters to move from overview to explanation", paragraphs: ["A total can tell you what happened; filters help explain where it happened. Filtering by Region, Product, Team or Customer can reveal which groups are driving the overall result.", "The strongest dashboard experience keeps KPIs, charts and underlying records synchronised so you can move from summary to evidence without rebuilding the analysis."] },
    ]}
    example={{ title: "From three columns to a sales dashboard", description: "A small Excel table can already support a useful time trend and KPI summary.", headers: ["Month", "Region", "Sales"], rows: [["January", "VIC", "$82,400"],["February", "VIC", "$91,200"],["March", "VIC", "$104,500"]], takeaway: "Sales increased by about 26.8% from January to March. With multiple regions, the same file can also support region filters and contribution views." }}
    relatedLinks={[
      { href: "/features/excel-dashboard-generator", title: "Excel Dashboard Generator", description: "Generate KPIs, trends, category views and filters from an uploaded workbook." },
      { href: "/guides/analyse-excel-data-online", title: "Analyse Excel Data Online", description: "Explore the broader analysis workflow before or after dashboard creation." },
      { href: "/features/data-quality-checker", title: "Check Data Quality First", description: "Review missing values, duplicates and inconsistent fields before reporting." },
    ]}
    faqs={[
      { question: "Can I create an Excel dashboard without formulas?", answer: "Yes. A tool such as Azhan Data Studio can analyse a structured workbook and generate dashboard views automatically without requiring you to write formulas or manually build charts." },
      { question: "What columns do I need for an Excel dashboard?", answer: "At minimum, include a numeric measure. A date field enables trends, while categories such as Region, Product or Team enable filters and comparisons." },
      { question: "Can I use a CSV instead of Excel?", answer: "Yes. The same dashboard workflow also supports CSV files when the data is arranged in a consistent table." },
    ]}
  />;
}
