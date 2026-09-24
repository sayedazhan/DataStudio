import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Data Quality Checker",
  description: "Check Excel and CSV data for missing values, duplicate rows, inconsistent values and outliers, then review affected records before analysis.",
  path: "/features/data-quality-checker",
  keywords: ["Excel data quality checker", "CSV data quality checker", "missing values checker", "duplicate row checker", "data quality tool"],
});

export default function DataQualityCheckerPage() {
  return <SeoFeaturePage
    eyebrow="DATA QUALITY CHECKER"
    title="Check Excel and CSV data quality before you trust the results."
    lead="Azhan Data Studio turns data-quality checks into a reviewable workflow: see an overall score, understand what is wrong, inspect affected rows and decide what should be cleaned before deeper analysis."
    toolHref="/"
    toolLabel="Check my dataset"
    secondaryHref="/clean"
    secondaryLabel="Open Clean My Data"
    highlights={["Overall quality score", "Missing-value checks", "Duplicate detection", "Outlier evidence"]}
    features={[
      { title: "Quality score", description: "Get a simple overall indicator that combines completeness and detected quality issues without hiding the underlying evidence." },
      { title: "Missing values", description: "See which fields contain gaps, how many values are missing and example records affected by those gaps." },
      { title: "Duplicates and inconsistencies", description: "Review exact duplicate records and common consistency issues such as case differences or mixed date formats." },
      { title: "Outlier review", description: "Use IQR-based outlier checks to identify unusual numeric values and inspect the records behind them before deciding whether they are errors." },
    ]}
    steps={[
      { title: "Upload and analyse", description: "Start with the normal Analyse Data workflow using your CSV or Excel file." },
      { title: "Open Data Quality", description: "Review the live quality score directly from Overview or open the dedicated Data Quality tab." },
      { title: "Inspect the evidence", description: "Drill into missing values, duplicates, inconsistencies, outliers and the raw data preview." },
      { title: "Clean only when needed", description: "Use the separate Clean My Data tool when you want to create a corrected copy instead of silently changing source values." },
    ]}
    useCases={["Pre-analysis validation", "Excel handover checks", "Imported system extracts", "Survey response cleanup", "Monthly file QA", "Data migration review"]}
    faqs={[
      { question: "Does the checker automatically change my data?", answer: "No. The Data Quality Centre is diagnostic first. It shows issues and affected records so you can review them before choosing whether to clean a copy." },
      { question: "How are outliers detected?", answer: "Numeric outlier checks use an interquartile-range approach to flag values outside the expected range. A flagged value is not automatically treated as wrong; it is evidence for review." },
      { question: "Can I remove duplicates and clean common issues?", answer: "Yes. The separate Clean My Data workflow can remove duplicate rows, blank rows and whitespace, clean headers and standardise selected formats before downloading a cleaned copy." },
      { question: "Why review quality before insights?", answer: "Missing, duplicated or inconsistent data can distort summaries and comparisons. Reviewing quality first helps you understand how much confidence to place in downstream analysis." },
    ]}
    pagePath="/features/data-quality-checker"
  />;
}
