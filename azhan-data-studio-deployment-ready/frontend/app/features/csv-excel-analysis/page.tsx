import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Free CSV & Excel Data Analysis Tool",
  description: "Analyse CSV and Excel files online with automatic profiling, ranked insights, data-quality checks, visual discovery and report-ready outputs.",
  path: "/features/csv-excel-analysis",
  keywords: ["CSV data analysis", "Excel data analysis", "analyse CSV online", "analyse Excel online", "data analysis tool"],
});

export default function CsvExcelAnalysisPage() {
  return <SeoFeaturePage
    eyebrow="CSV & EXCEL DATA ANALYSIS"
    title="Analyse CSV and Excel data without building a dashboard."
    lead="Upload a business dataset and Azhan Data Studio automatically profiles the fields, checks data quality, surfaces ranked findings and recommends useful visuals so you can understand what matters faster."
    toolHref="/"
    toolLabel="Analyse my data"
    secondaryHref="/features/data-quality-checker"
    secondaryLabel="Explore data quality"
    highlights={["CSV and XLSX support", "Automatic ranked insights", "Data-quality evidence", "PDF and CSV outputs"]}
    features={[
      { title: "Automatic profiling", description: "Understand rows, fields, types, completeness, ranges and semantic roles before exploring the data." },
      { title: "Ranked findings", description: "Surface patterns, anomalies, group differences, relationships and concentrations with an evidence-based score." },
      { title: "Visual discovery", description: "See presentation-ready visuals selected to match each finding instead of manually building charts from scratch." },
      { title: "Decision-ready reporting", description: "Move from exploration into downloadable reports and structured outputs that are easier to share." },
    ]}
    steps={[
      { title: "Upload your file", description: "Choose a CSV or Excel workbook and, for workbooks, select the sheet you want to analyse." },
      { title: "Let the studio profile it", description: "The engine checks structure, field behaviour, quality and candidate analytical signals." },
      { title: "Review the strongest evidence", description: "Use Overview, Data Quality, Insights and Explore to move from summary to supporting records and visuals." },
      { title: "Export what you need", description: "Download findings, charts or a report when you are ready to use the analysis elsewhere." },
    ]}
    useCases={["Sales and operational reporting", "Survey and feedback analysis", "Inventory and product data", "Monthly management files", "Ad-hoc Excel analysis", "Pre-dashboard exploration"]}
    faqs={[
      { question: "What file types can I analyse?", answer: "Azhan Data Studio supports CSV files and Excel .xlsx workbooks. For Excel workbooks, you can choose an analysis-ready sheet before running the analysis." },
      { question: "Do I need to build charts or formulas first?", answer: "No. The analysis workflow is designed to profile the file, identify useful findings and generate supporting visuals without requiring dashboard setup." },
      { question: "Is Azhan Data Studio free to use?", answer: "Yes. The studio is free to use, with an optional one-time support link for users who want to contribute to continued development." },
      { question: "Does it replace a full BI platform?", answer: "It is best suited to fast analysis, validation and exploration of individual datasets. BI platforms remain useful for governed, recurring enterprise dashboards and broader data models." },
    ]}
    pagePath="/features/csv-excel-analysis"
  />;
}
