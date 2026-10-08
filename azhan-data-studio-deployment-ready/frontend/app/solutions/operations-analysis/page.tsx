import type { Metadata } from "next";
import SolutionDetailPage from "../../components/solution-detail-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Operations Data Analysis from Excel & CSV",
  description: "Analyse operational Excel and CSV data to find performance patterns, bottlenecks, status concentration, outliers, period changes and report-ready insights.",
  path: "/solutions/operations-analysis",
  keywords: ["operations data analysis", "operational analysis Excel", "operations dashboard Excel", "process data analysis", "business operations analytics"],
});

export default function OperationsAnalysisPage(){
  return <SolutionDetailPage
    slug="operations-analysis"
    eyebrow="OPERATIONS ANALYSIS"
    title="Find operational patterns hidden inside everyday spreadsheets."
    description="Analyse process, service, workflow or operational Excel and CSV data to identify performance patterns, bottlenecks, concentration, outliers and changes over time."
    intro="Operational spreadsheets are often rich in useful signals but difficult to review consistently. Data Studio helps organise the first-pass analysis around measurable fields, statuses, categories and dates."
    questions={[
      {title:"Where are the bottlenecks?", copy:"Compare status, category, team, location or process fields to identify concentration and unusual patterns."},
      {title:"Which metrics are changing?", copy:"Review trends or recurring monthly data when the dataset contains a usable date or period field."},
      {title:"What looks unusual?", copy:"Use distributions, outlier detection and ranked findings to identify values worth investigating."},
      {title:"Can the result be shared?", copy:"Turn the analysis into a structured report for a review meeting, stakeholder update or follow-up investigation."},
    ]}
    exampleFields={["Date / period", "Status", "Team / owner", "Location / site", "Duration / cycle time", "Volume / count / value"]}
    workflow={[
      {title:"Understand the structure", copy:"Profile fields, data types, missing values and categories before deciding what to analyse."},
      {title:"Explore operational signals", copy:"Use KPIs, breakdowns, distributions and ranked findings to surface areas that deserve attention."},
      {title:"Compare and investigate", copy:"Use comparison, statistics or scenario analysis when you need to test a specific operational question."},
      {title:"Share the outcome", copy:"Generate a report with the strongest findings, charts and recommended next steps."},
    ]}
    outputs={["Operational KPI summaries", "Status / category breakdowns", "Outlier and distribution views", "Period trends when available", "Comparison between extracts", "Operations analysis report"]}
    related={[
      {href:"/features/csv-excel-analysis", title:"Excel & CSV Analysis", copy:"Start with broad profiling, findings and dashboard views from one file."},
      {href:"/features/data-quality-checker", title:"Data Quality Checker", copy:"Validate missing values, duplicates and inconsistencies before decisions are made."},
      {href:"/compare", title:"Compare Datasets", copy:"Identify what changed between operational file versions."},
      {href:"/reports", title:"Reporting Studio", copy:"Create a decision-ready report from the analysis."},
    ]}
    faqs={[
      {q:"What type of operations data can I analyse?", a:"Any structured Excel or CSV dataset can be tested. Common examples include status logs, service data, process records, operational KPIs and recurring extracts."},
      {q:"Can Data Studio identify bottlenecks automatically?", a:"It can surface concentration, unusual values, distributions and category patterns. Business interpretation is still important when deciding whether a pattern represents a genuine bottleneck."},
      {q:"Can I use it for recurring operational reporting?", a:"Yes. Monthly Intelligence and Reporting Studio are designed to support recurring analysis when your files follow a consistent structure."},
    ]}
  />;
}
