import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Compare Excel & CSV Files Online",
  description: "Compare two Excel or CSV datasets online to identify added and removed fields, changed records, metric movement and the categories driving the difference.",
  path: "/features/compare-excel-files",
  keywords: ["compare Excel files", "compare CSV files", "compare datasets online", "Excel difference checker", "dataset comparison tool"],
});

export default function CompareExcelFilesPage() {
  return <SeoFeaturePage
    eyebrow="COMPARE EXCEL & CSV FILES"
    title="Compare two datasets and understand what actually changed."
    lead="Use Azhan Data Studio to compare previous and current CSV or Excel datasets, review structural changes, quantify movement and identify the records or categories behind the difference."
    toolHref="/compare"
    toolLabel="Compare datasets"
    secondaryHref="/features/csv-excel-analysis"
    secondaryLabel="Analyse one file"
    highlights={["Previous vs current", "Schema change detection", "Record-level evidence", "Movement summaries"]}
    features={[
      { title: "Structure changes", description: "Identify added or removed columns and type changes before comparing the business values themselves." },
      { title: "Key-based matching", description: "Use suitable identifier fields to align records across versions and understand what was added, removed or changed." },
      { title: "Movement analysis", description: "Quantify changes in numeric measures and categorical distributions rather than relying on manual spreadsheet scanning." },
      { title: "Explain the difference", description: "Trace important movement back to the fields, categories and records contributing to the change." },
    ]}
    steps={[
      { title: "Upload the previous file", description: "Choose the earlier dataset or workbook sheet that represents your baseline." },
      { title: "Upload the current file", description: "Add the newer dataset using the same or a compatible structure." },
      { title: "Confirm comparison fields", description: "Review detected keys and candidate measures so the comparison uses appropriate columns." },
      { title: "Review what changed", description: "Use the summary, field evidence and record-level output to understand the movement." },
    ]}
    useCases={["Month-on-month reporting", "System extract validation", "Price-list changes", "Inventory movement", "Customer or dealer file changes", "Before/after data checks"]}
    faqs={[
      { question: "Can I compare Excel files as well as CSV files?", answer: "Yes. The comparison workflow supports CSV and Excel .xlsx files, including sheet selection for Excel workbooks." },
      { question: "Do the two files need identical columns?", answer: "No. The tool first identifies schema differences such as added, removed or changed fields, then uses the common structure for compatible comparisons." },
      { question: "Can it show which individual records changed?", answer: "Where a suitable key field is available, the comparison can align records and surface added, removed and changed records as supporting evidence." },
      { question: "Is this the same as comparing spreadsheet formatting?", answer: "No. The tool focuses on dataset structure and values rather than workbook formatting, cell colours or formulas." },
    ]}
    pagePath="/features/compare-excel-files"
  />;
}
