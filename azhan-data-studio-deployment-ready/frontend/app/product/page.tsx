import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { StudioProductVisual } from "../components/marketing-visuals";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Data Analysis Software",
  description: "Analyse Excel and CSV data online with automatic profiling, data quality checks, dashboards, dataset comparison, forecasting, statistics and professional reports.",
  path: "/product",
  keywords: ["Excel data analysis software", "CSV analysis software", "online data analysis tool", "business data analytics platform"],
});

const capabilities = [
  ["Analyse Single File", "Automatic profiling, ranked findings, dashboards and evidence from one Excel or CSV file.", "/features/csv-excel-analysis"],
  ["Data Quality", "Detect missing values, duplicates, format issues, inconsistencies and outliers before decisions are made.", "/features/data-quality-checker"],
  ["Dashboard Generator", "Create useful KPI cards, trends, category breakdowns and filters without manually building a dashboard.", "/features/excel-dashboard-generator"],
  ["Compare Datasets", "Compare two versions of a dataset and identify added, removed, changed and stable records.", "/features/compare-excel-files"],
  ["Forecast", "Project historical metrics forward with configurable forecast horizons and diagnostics.", "/features/data-forecasting"],
  ["Statistics", "Explore distributions, relationships, correlations and group differences with readable interpretations.", "/statistics"],
  ["Monthly Intelligence", "Append recurring monthly files and follow movement over time from a consistent workspace.", "/monthly"],
  ["Reporting Studio", "Turn analysis into professional PDF-ready reports with KPIs, visuals, insights and recommendations.", "/reports"],
];

export default function ProductPage(){
  return <MarketingShell>
    <section className="marketingPageHero split">
      <div><span className="marketingEyebrow">PRODUCT</span><h1>One workspace for understanding business data.</h1><p>Azhan Data Studio brings analysis, data quality, dashboards, comparisons, forecasting, statistics and reporting into a single browser-based workflow.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton large" href="/studio">Launch Studio →</a><a className="marketingSecondaryButton large" href="/features">Explore Features</a></div></div>
      <StudioProductVisual/>
    </section>
    <section className="marketingSection"><div className="marketingSectionHead"><span>CAPABILITIES</span><h2>Start with a file. Finish with something useful.</h2><p>Use only the workflow you need or move between tools as your analysis develops.</p></div><div className="marketingCapabilityGrid">{capabilities.map(([title,copy,href],i)=><a href={href} key={title}><span>{String(i+1).padStart(2,"0")}</span><strong>{title}</strong><p>{copy}</p><em>Explore →</em></a>)}</div></section>
    <section className="marketingSplitBand"><div><span>DESIGNED FOR REAL WORK</span><h2>No formulas. No manual chart building. No dashboard setup.</h2><p>Data Studio is designed to reduce the setup work between receiving a spreadsheet and understanding what it is telling you.</p></div><div className="marketingCheckList"><span>✓ Excel and CSV upload</span><span>✓ Automatic schema and quality profiling</span><span>✓ Ranked findings with evidence</span><span>✓ Adaptive visualisations</span><span>✓ Professional reports</span><span>✓ No account required today</span></div></section>
    <section className="marketingSection"><div className="marketingSectionHead row"><div><span>BUSINESS USE CASES</span><h2>Apply the platform to the data your team already uses.</h2><p>See how the same Data Studio workflow can support common sales, inventory, finance and operations questions.</p></div><a href="/solutions">View all solutions →</a></div><div className="marketingCapabilityGrid"><a href="/solutions/sales-analysis"><span>01</span><strong>Sales Analysis</strong><p>Revenue KPIs, product and region performance, trends and forecasts from sales spreadsheets.</p><em>Explore →</em></a><a href="/solutions/inventory-analysis"><span>02</span><strong>Inventory Analysis</strong><p>Stock, movement, category and period analysis from inventory extracts.</p><em>Explore →</em></a><a href="/solutions/financial-analysis"><span>03</span><strong>Financial Analysis</strong><p>Cost, revenue, variance, scenario and report workflows for finance data.</p><em>Explore →</em></a><a href="/solutions/operations-analysis"><span>04</span><strong>Operations Analysis</strong><p>Operational KPIs, statuses, outliers and recurring reporting from process data.</p><em>Explore →</em></a></div></section>
    <section className="marketingFinalCta"><span>READY TO EXPLORE YOUR DATA?</span><h2>Launch Data Studio and analyse a file.</h2><p>The core analysis workflow remains free and frictionless.</p><a className="marketingPrimaryButton large" href="/studio">Launch Data Studio →</a></section>
  </MarketingShell>;
}
