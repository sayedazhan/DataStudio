import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Data Analysis Guides",
  description: "Practical guides for analysing Excel and CSV data, checking data quality, creating dashboards and comparing spreadsheet files.",
  path: "/guides",
  keywords: ["Excel data analysis guide", "CSV analysis guide", "Excel dashboard tutorial", "data quality guide"],
});

const guides = [
  {href:"/guides/analyse-excel-data-online", tag:"ANALYSIS", title:"How to Analyse Excel Data Online", copy:"A practical workflow for moving from a spreadsheet to useful insights without manually building every chart."},
  {href:"/guides/check-excel-data-quality", tag:"DATA QUALITY", title:"How to Check Excel Data Quality", copy:"Find missing values, duplicates, inconsistent data, outliers and other common quality issues before analysis."},
  {href:"/guides/create-dashboard-from-excel", tag:"DASHBOARDS", title:"How to Create a Dashboard From Excel", copy:"Turn spreadsheet data into KPIs, trends and category views using an automatic dashboard workflow."},
  {href:"/guides/compare-excel-files", tag:"COMPARISON", title:"How to Compare Two Excel Files", copy:"Identify added, removed and changed records and understand how important metrics moved between versions."},
];

export default function GuidesPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">LEARN & EXPLORE</span><h1>Practical guides for getting more from your spreadsheets.</h1><p>Learn how to analyse, check, compare and visualise Excel and CSV data — then try the same workflow directly in Data Studio.</p></section>
    <section className="marketingSection"><div className="marketingGuideHub">{guides.map(g=><a href={g.href} key={g.href}><span>{g.tag}</span><strong>{g.title}</strong><p>{g.copy}</p><em>Read guide →</em></a>)}</div></section>
    <section className="marketingSection"><div className="marketingSectionHead row"><div><span>APPLY THE WORKFLOW</span><h2>Use the techniques on common business datasets.</h2><p>Once you understand the analysis workflow, see how it applies to sales, inventory, finance and operations data.</p></div><a href="/solutions">Explore solutions →</a></div><div className="marketingCapabilityGrid"><a href="/solutions/sales-analysis"><span>01</span><strong>Sales Analysis</strong><p>Analyse revenue, products, regions, trends and forecasts.</p><em>Explore →</em></a><a href="/solutions/inventory-analysis"><span>02</span><strong>Inventory Analysis</strong><p>Review stock, movement, categories and recurring periods.</p><em>Explore →</em></a><a href="/solutions/financial-analysis"><span>03</span><strong>Financial Analysis</strong><p>Explore costs, revenue, comparisons and scenarios.</p><em>Explore →</em></a><a href="/solutions/operations-analysis"><span>04</span><strong>Operations Analysis</strong><p>Find operational patterns, outliers and performance signals.</p><em>Explore →</em></a></div></section>
    <section className="marketingSplitBand"><div><span>FROM GUIDE TO WORKSPACE</span><h2>Try the workflow with your own file.</h2><p>The guides explain the approach. Data Studio lets you apply it immediately to your own Excel or CSV dataset.</p></div><a className="marketingPrimaryButton" href="/studio">Launch Data Studio →</a></section>
  </MarketingShell>;
}
