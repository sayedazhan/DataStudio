import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel Data Quality Checker Online",
  description: "Check Excel and CSV files online for missing values, duplicate rows, inconsistent data and outliers before analysis. Free, no login required.",
  path: "/features/data-quality-checker",
  keywords: ["Excel data quality checks", "Excel data quality checker", "CSV data quality checker", "check Excel data quality online", "missing values checker", "duplicate row checker", "data quality tool"],
});

export default function DataQualityCheckerPage() {
  return <SeoFeaturePage
    eyebrow="EXCEL & CSV DATA QUALITY CHECKER"
    title="Check Excel and CSV data quality online."
    lead="Upload an Excel or CSV file and automatically check for missing values, duplicate rows, inconsistent data and unusual numeric values. Review the evidence before you clean, analyse or report on the dataset."
    toolHref="/studio"
    toolLabel="Check my dataset"
    secondaryHref="/guides/check-excel-data-quality"
    secondaryLabel="Read the data quality guide"
    highlights={["Free to use", "No login required", "Missing-value checks", "Duplicate detection", "Outlier evidence"]}
    features={[
      { title: "Quality score", description: "Get a simple overall indicator that combines completeness and detected quality issues without hiding the underlying evidence." },
      { title: "Missing values", description: "See which fields contain gaps, how many values are missing and example records affected by those gaps." },
      { title: "Duplicates and inconsistencies", description: "Review exact duplicate records and common consistency issues such as case differences or mixed date formats." },
      { title: "Outlier review", description: "Use IQR-based outlier checks to identify unusual numeric values and inspect the records behind them before deciding whether they are errors." },
    ]}
    example={{
      eyebrow: "EXAMPLE: EXCEL DATA QUALITY CHECK",
      title: "See the issues before they distort your analysis.",
      intro: "For an illustrative 1,250-row sales file, a quality review might surface the checks below. Data Studio keeps the underlying records available so each issue can be reviewed rather than silently corrected.",
      metrics: [
        { label: "Rows reviewed", value: "1,250" },
        { label: "Missing values", value: "37" },
        { label: "Duplicate rows", value: "14" },
        { label: "Potential outliers", value: "6" },
      ],
      notes: [
        "Use missing-value counts to identify fields that could weaken summaries or comparisons.",
        "Inspect duplicate records before removing them; repeated rows can sometimes be legitimate transactions.",
        "Treat outliers as evidence for review, not automatic errors.",
      ],
    }}
    steps={[
      { title: "Upload and analyse", description: "Start with the normal Analyse Data workflow using your CSV or Excel file." },
      { title: "Open Data Quality", description: "Review the live quality score directly from Overview or open the dedicated Data Quality tab." },
      { title: "Inspect the evidence", description: "Drill into missing values, duplicates, inconsistencies, outliers and the raw data preview." },
      { title: "Clean only when needed", description: "Use the separate Clean My Data tool when you want to create a corrected copy instead of silently changing source values." },
    ]}
    useCases={["Pre-analysis validation", "Excel handover checks", "Imported system extracts", "Survey response cleanup", "Monthly file QA", "Data migration review"]}
    relatedLinks={[
      { href: "/guides/check-excel-data-quality", title: "How to Check Excel Data Quality Before Analysis", description: "A practical checklist for missing values, duplicates, inconsistent fields and outliers." },
      { href: "/features/csv-excel-analysis", title: "CSV & Excel Data Analysis", description: "Move from quality checks into automatic profiling, ranked findings and visual analysis." },
      { href: "/clean", title: "Clean My Data", description: "Create a cleaned copy after you have reviewed the issues in your source file." },
    ]}
    faqs={[
      { question: "How do I check Excel data quality online?", answer: "Upload the Excel workbook to Azhan Data Studio, choose the sheet you want to analyse and open Data Quality. The tool checks completeness, duplicates, inconsistencies and numeric outliers while keeping affected records available for review." },
      { question: "Does the checker automatically change my data?", answer: "No. The Data Quality Centre is diagnostic first. It shows issues and affected records so you can review them before choosing whether to clean a copy." },
      { question: "How are outliers detected?", answer: "Numeric outlier checks use an interquartile-range approach to flag values outside the expected range. A flagged value is not automatically treated as wrong; it is evidence for review." },
      { question: "Can I remove duplicates and clean common issues?", answer: "Yes. The separate Clean My Data workflow can remove duplicate rows, blank rows and whitespace, clean headers and standardise selected formats before downloading a cleaned copy." },
      { question: "Why review quality before insights?", answer: "Missing, duplicated or inconsistent data can distort summaries and comparisons. Reviewing quality first helps you understand how much confidence to place in downstream analysis." },
    ]}
    pagePath="/features/data-quality-checker"
  />;
}
