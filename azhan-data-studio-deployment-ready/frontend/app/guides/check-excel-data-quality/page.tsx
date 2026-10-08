import type { Metadata } from "next";
import { SeoGuidePage } from "../../components/seo-guide-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Check Excel Data Quality Before Analysis",
  description: "Learn how to check Excel data quality for missing values, duplicates, inconsistent fields and outliers before analysis or reporting.",
  path: "/guides/check-excel-data-quality",
  keywords: ["how to check Excel data quality", "Excel data quality checks", "check Excel for duplicates", "find missing values in Excel", "Excel data validation before analysis"],
});

export default function GuidePage() {
  return <SeoGuidePage
    eyebrow="EXCEL DATA QUALITY GUIDE"
    title="How to Check Excel Data Quality Before Analysis"
    lead="A practical data-quality checklist for Excel files: check structure, missing values, duplicate rows, inconsistent categories and unusual numeric values before you rely on the results."
    pagePath="/guides/check-excel-data-quality"
    toolHref="/"
    toolLabel="Check my Excel file"
    steps={[
      { title: "Check the table structure", description: "Confirm that the first row contains clear field names, each column represents one type of information and the dataset does not mix titles, notes or subtotals into the data area." },
      { title: "Measure missing values", description: "Identify fields with blanks or null values and decide whether the gaps are acceptable, need correction or should be excluded from a specific calculation." },
      { title: "Review duplicate rows", description: "Find exact duplicates and repeated business keys. Do not delete them automatically until you know whether the repetition is an error or a legitimate repeated transaction." },
      { title: "Check consistency", description: "Look for variations such as VIC versus Victoria, inconsistent date formats, mixed uppercase/lowercase labels and numbers stored as text." },
      { title: "Inspect outliers", description: "Review unusual numeric values that sit far outside the normal range. Outliers can be errors, but they can also be important real events." },
      { title: "Document and clean deliberately", description: "Keep the original file unchanged, record what you found and create a cleaned copy only after the issues have been reviewed." },
    ]}
    sections={[
      { heading: "Why Excel data quality matters", paragraphs: ["A spreadsheet can look tidy and still contain issues that change the answer. Missing values can understate totals, duplicate rows can inflate counts, inconsistent categories can split one group into several labels, and numeric errors can distort averages or forecasts.", "The goal of a data-quality check is not to make every dataset perfect. It is to understand the limitations before analysis so that the final result can be interpreted with the right level of confidence."] },
      { heading: "What to check first", paragraphs: ["Start with the fields that matter most to the business question. If you are analysing sales, that might be date, product, region, quantity and revenue. If you are reviewing survey responses, focus on respondent identifiers, question fields and missing answers."], bullets: ["Are important identifiers blank?", "Are dates recognised as dates?", "Are numeric fields actually numeric?", "Do category labels use one consistent spelling?", "Are duplicate records explainable?", "Do extreme values make business sense?"] },
      { heading: "Use evidence instead of automatic deletion", paragraphs: ["A quality flag is a reason to review a record, not proof that the record is wrong. A very large order may be a genuine customer transaction. Two identical rows may represent two separate purchases. A blank value may mean not applicable rather than missing data.", "That is why Azhan Data Studio separates diagnosis from cleaning: you can inspect the affected records first and create a cleaned copy only when a change is justified."] },
    ]}
    example={{ title: "A small sales file before analysis", description: "Suppose a monthly sales workbook contains the following records.", headers: ["Order", "Region", "Sales", "Issue"], rows: [["1001", "VIC", "$1,250", "—"],["1002", "Victoria", "$980", "Inconsistent category"],["1003", "NSW", "", "Missing sales value"],["1003", "NSW", "$1,100", "Possible duplicate key"],["1004", "VIC", "$48,000", "Potential outlier"]], takeaway: "The file should not be cleaned blindly. Each issue needs context: Victoria may be standardised to VIC, the blank sale needs investigation, Order 1003 may or may not be duplicated, and the $48,000 transaction could be a valid large order." }}
    relatedLinks={[
      { href: "/features/data-quality-checker", title: "Excel Data Quality Checker", description: "Automatically review missing values, duplicates, inconsistencies and outliers." },
      { href: "/clean", title: "Clean My Data", description: "Create a cleaned copy after reviewing the source issues." },
      { href: "/guides/analyse-excel-data-online", title: "Analyse Excel Data Online", description: "Continue from validation into profiling, insights and visuals." },
    ]}
    faqs={[
      { question: "What are the most common Excel data quality problems?", answer: "Common problems include missing values, duplicate records, inconsistent category names, mixed date formats, numeric values stored as text, unexpected outliers and unclear field names." },
      { question: "Should I remove every outlier?", answer: "No. An outlier is simply unusual relative to the rest of the data. Review the underlying record and business context before deciding whether it is an error." },
      { question: "Should I clean the original Excel file?", answer: "It is safer to preserve the original and create a cleaned copy. That keeps the source evidence available and makes your changes easier to trace." },
    ]}
  />;
}
