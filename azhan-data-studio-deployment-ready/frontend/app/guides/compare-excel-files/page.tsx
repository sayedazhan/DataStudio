import type { Metadata } from "next";
import { SeoGuidePage } from "../../components/seo-guide-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Compare Two Excel Files and Find Changes",
  description: "Learn how to compare two Excel files for added, removed and changed records, then trace the differences back to fields and business categories.",
  path: "/guides/compare-excel-files",
  keywords: ["compare two Excel files", "compare Excel files online", "find changes between Excel files", "compare monthly Excel reports", "Excel file comparison"],
});

export default function GuidePage() {
  return <SeoGuidePage
    eyebrow="EXCEL COMPARISON GUIDE"
    title="How to Compare Two Excel Files and Find What Changed"
    lead="A practical way to compare monthly, versioned or before-and-after Excel files so you can identify added records, removed records and changed values without checking rows manually."
    pagePath="/guides/compare-excel-files"
    toolHref="/compare"
    toolLabel="Compare my files"
    steps={[
      { title: "Choose comparable datasets", description: "Use two files that represent the same type of data, such as August versus September sales or a source file before and after an update." },
      { title: "Identify a stable key", description: "Use a field such as Order ID, VIN, Customer ID or Product Code to match the same record across both files whenever possible." },
      { title: "Align field names and formats", description: "Make sure equivalent columns use compatible names and data formats so differences represent real changes rather than formatting noise." },
      { title: "Separate added, removed and changed records", description: "Do not collapse every difference into one count. Distinguish new records, records that disappeared and matched records whose field values changed." },
      { title: "Summarise change by category", description: "Group differences by region, product, status or another business dimension to understand where the movement is concentrated." },
      { title: "Review the underlying records", description: "Export or inspect the exact records behind each change before acting on the summary." },
    ]}
    sections={[
      { heading: "Why row-by-row comparison is risky", paragraphs: ["Manual comparison becomes unreliable as files grow. Sorting differences, inserted rows and small field changes can make two spreadsheets look different even when most records are unchanged.", "A key-based comparison is more robust because it matches the same business entity across both files first, then evaluates what changed." ] },
      { heading: "Choose the right comparison key", paragraphs: ["The strongest key uniquely identifies a record and remains stable between versions. Order numbers, serial numbers, account IDs and product codes are common examples. Names and descriptions are weaker keys because spelling and formatting can change."], bullets: ["Unique in each file", "Stable over time", "Present in both versions", "Not generated from row position"] },
      { heading: "Summaries are useful, but evidence matters", paragraphs: ["A result such as 42 changed records is only the starting point. You still need to know which fields changed and whether the changes are concentrated in one category or process.", "Keep the record-level output available so the summary can be validated and shared with the people responsible for the source data." ] },
    ]}
    example={{ title: "Comparing two monthly product files", description: "A simple key-based comparison can classify the movement clearly.", headers: ["Product ID", "August", "September", "Result"], rows: [["P-101", "$120", "$120", "Unchanged"],["P-102", "$95", "$99", "Changed"],["P-103", "$80", "—", "Removed"],["P-104", "—", "$110", "Added"]], takeaway: "Instead of saying the files are different, the comparison tells you exactly what happened: one price changed, one product disappeared and one product was added." }}
    relatedLinks={[
      { href: "/features/compare-excel-files", title: "Compare Excel & CSV Files", description: "Use the focused comparison workflow in Azhan Data Studio." },
      { href: "/features/data-quality-checker", title: "Check Data Quality", description: "Reduce false differences caused by inconsistent categories or data types." },
      { href: "/guides/analyse-excel-data-online", title: "Analyse Excel Data Online", description: "Explore the resulting dataset after you understand what changed." },
    ]}
    faqs={[
      { question: "What is the best way to compare two Excel files?", answer: "Use a stable record key to match rows first, then classify records as added, removed, unchanged or changed. This is more reliable than comparing row positions." },
      { question: "Can I compare monthly Excel reports?", answer: "Yes. Monthly files are a strong use case when both reports contain comparable fields and a stable identifier for matching records or categories." },
      { question: "What if the files have different column names?", answer: "Align or map equivalent fields before interpreting differences. Otherwise a naming change can be mistaken for a data change." },
    ]}
  />;
}
