import type { Metadata } from "next";
import SolutionDetailPage from "../../components/solution-detail-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Financial Data Analysis from Excel & CSV",
  description: "Analyse financial spreadsheet data with cost and revenue KPIs, category breakdowns, period comparisons, scenario analysis, statistics and professional reports.",
  path: "/solutions/financial-analysis",
  keywords: ["financial data analysis Excel", "finance spreadsheet analysis", "financial dashboard Excel", "cost analysis Excel", "financial report generator"],
});

export default function FinancialAnalysisPage(){
  return <SolutionDetailPage
    slug="financial-analysis"
    eyebrow="FINANCIAL DATA ANALYSIS"
    title="Explore financial spreadsheet data without rebuilding the analysis every time."
    description="Use Excel or CSV finance data to review totals, distributions, categories, period movement, scenario assumptions and report-ready findings in one workflow."
    intro="Financial datasets often arrive as recurring extracts or operational spreadsheets. Data Studio can help structure the first-pass analysis so you can identify where deeper investigation is needed."
    questions={[
      {title:"What are the headline values?", copy:"Summarise relevant numeric fields such as revenue, cost, margin, spend or another financial measure present in the file."},
      {title:"Where are costs or revenues concentrated?", copy:"Compare departments, categories, accounts, suppliers or other categorical dimensions."},
      {title:"How did the period change?", copy:"Use time trends or dataset comparison to understand movement between periods or file versions."},
      {title:"What happens under different assumptions?", copy:"Use Scenario Analysis to test how changes in a selected input can affect a target metric."},
    ]}
    exampleFields={["Date / period", "Account / category", "Department / cost centre", "Revenue", "Cost / spend", "Budget / actual measure"]}
    workflow={[
      {title:"Profile the dataset", copy:"Detect numeric measures, categories, dates and data quality conditions in the uploaded file."},
      {title:"Review the main drivers", copy:"Use KPI cards, rankings, distributions and category breakdowns to identify concentration and movement."},
      {title:"Compare or model", copy:"Compare two files, run statistics or use scenario analysis when the business question requires it."},
      {title:"Generate the report", copy:"Create a professional analysis report with context, visuals and recommendations."},
    ]}
    outputs={["Revenue / cost KPI summaries", "Category and department breakdowns", "Period trend when available", "Dataset comparison", "Scenario analysis", "Professional finance report"]}
    related={[
      {href:"/compare", title:"Compare Datasets", copy:"Measure changes between two compatible financial extracts."},
      {href:"/scenario", title:"Scenario Analysis", copy:"Test assumptions against a selected numeric target."},
      {href:"/statistics", title:"Statistics", copy:"Explore distributions, correlations and group differences in financial data."},
      {href:"/reports", title:"Reporting Studio", copy:"Package the analysis into a polished report."},
    ]}
    faqs={[
      {q:"Is Data Studio accounting software?", a:"No. Data Studio is an analysis and reporting tool for structured Excel and CSV data; it does not replace accounting, bookkeeping or financial control systems."},
      {q:"Can it compare budget and actual data?", a:"If budget and actual values are present as usable fields, you can analyse and compare those measures. The exact output depends on the structure of the uploaded dataset."},
      {q:"Can it create a financial report?", a:"Yes. Reporting Studio can include relevant KPIs, visuals, findings, quality context and recommendations from the analysis available."},
    ]}
  />;
}
