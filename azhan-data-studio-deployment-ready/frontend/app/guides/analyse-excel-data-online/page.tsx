import type { Metadata } from "next";
import { SeoGuidePage } from "../../components/seo-guide-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Analyse Excel Data Online",
  description: "Learn a practical workflow to analyse Excel data online: profile fields, check quality, identify trends, compare categories and export useful findings.",
  path: "/guides/analyse-excel-data-online",
  keywords: ["analyse Excel data online", "Excel data analysis online", "how to analyse Excel data", "online Excel analysis tool", "automatic Excel analysis"],
});

export default function GuidePage() {
  return <SeoGuidePage
    eyebrow="EXCEL ANALYSIS GUIDE"
    title="How to Analyse Excel Data Online Without Building Charts First"
    lead="A faster workflow for understanding a spreadsheet: profile the fields, check data quality, surface important patterns and only then decide which charts or reports are worth using."
    pagePath="/guides/analyse-excel-data-online"
    toolHref="/"
    toolLabel="Analyse my Excel file"
    steps={[
      { title: "Choose the right sheet", description: "Select a sheet containing one consistent data table rather than a presentation sheet with titles, merged cells or multiple separate tables." },
      { title: "Profile the structure", description: "Review row count, field names, data types, completeness and the likely role of each column before drawing conclusions." },
      { title: "Check data quality", description: "Look for missing values, duplicates, inconsistent categories and suspicious numeric values that could change the result." },
      { title: "Find the strongest signals", description: "Review totals, distributions, group differences, trends, concentrations and relationships that are supported by the data." },
      { title: "Use visuals as evidence", description: "Choose charts that explain a finding rather than creating charts for every field. Keep the underlying records available for validation." },
      { title: "Export the useful output", description: "Save the dashboard, filtered records or report-ready findings once the analysis answers the business question." },
    ]}
    sections={[
      { heading: "Start with the question, not the chart", paragraphs: ["Before analysing an Excel file, write down the decision you are trying to support. Are sales falling? Which category is growing? Where are delays occurring? Which records look unusual? A clear question helps you focus on the fields and comparisons that matter.", "Automatic analysis is most useful when it shortens the path from a raw file to evidence, rather than simply creating more charts."] },
      { heading: "Profile before interpreting", paragraphs: ["A quick profile should tell you how large the dataset is, which fields are numeric, which fields are dates, which fields behave like categories and where values are missing. This prevents common mistakes such as treating an identifier as a measure or trusting a date column that contains mixed formats."], bullets: ["Rows and columns", "Numeric measures", "Date or period fields", "Categories and identifiers", "Missing-value rates", "Minimum, maximum and typical values"] },
      { heading: "Rank findings by usefulness", paragraphs: ["Not every statistical relationship deserves equal attention. Prioritise findings that are strong enough to matter, supported by sufficient records and understandable in the business context.", "A useful analysis should make it easy to move from a finding to the supporting records. That traceability is especially important when a pattern will be used in a report or decision." ] },
    ]}
    example={{ title: "A simple regional sales analysis", description: "Suppose a workbook contains monthly sales by region.", headers: ["Month", "Region", "Sales"], rows: [["Jan", "VIC", "$82,400"],["Jan", "NSW", "$74,100"],["Feb", "VIC", "$91,200"],["Feb", "NSW", "$70,600"]], takeaway: "A useful first pass would compare total sales by month and region, then investigate why VIC increased while NSW declined instead of immediately producing many unrelated charts." }}
    relatedLinks={[
      { href: "/features/csv-excel-analysis", title: "Excel & CSV Data Analysis", description: "Use the full automatic analysis workflow in Azhan Data Studio." },
      { href: "/guides/check-excel-data-quality", title: "Check Excel Data Quality", description: "Validate missing values, duplicates, consistency and outliers first." },
      { href: "/guides/create-dashboard-from-excel", title: "Create a Dashboard From Excel", description: "Turn analysis-ready data into KPIs, trends and interactive filters." },
    ]}
    faqs={[
      { question: "Can I analyse Excel online without installing software?", answer: "Yes. Browser-based tools can process an uploaded workbook and return profiles, quality checks, insights and visualisations without requiring a desktop installation." },
      { question: "Do I need to know statistics?", answer: "Not for basic exploratory analysis. You should still review the evidence and business context, especially before treating a correlation, outlier or forecast as a decision." },
      { question: "What is the best format for analysis?", answer: "A single rectangular table with one header row and consistent records is easiest to analyse. Avoid merged cells, blank header rows and multiple unrelated tables on the same sheet." },
    ]}
  />;
}
