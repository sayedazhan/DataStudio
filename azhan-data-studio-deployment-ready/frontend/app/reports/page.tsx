import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { MiniReportStack } from "../components/marketing-visuals";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Automated Excel & CSV Data Analysis Reports",
  description: "Generate professional Excel and CSV data analysis reports with KPIs, charts, insights, data quality findings, comparisons, forecasts, statistics and recommendations.",
  path: "/reports",
  keywords: ["automated Excel report", "data analysis report generator", "CSV analysis report", "business analytics report", "professional data report"],
});

const reportTypes = [
  ["Executive Summary", "Decision-ready overview with headline KPIs and the strongest findings."],
  ["Performance Report", "Charts, category breakdowns, trends and supporting metrics."],
  ["Data Quality Report", "Completeness, duplicates, outliers, format issues and recommended actions."],
  ["Comparison Report", "Added, removed and changed records plus metric movements between two files."],
  ["Forecast Report", "Historical performance, forecast trajectory, expected direction and diagnostics."],
  ["Statistical Report", "Distributions, descriptive statistics, relationships and readable interpretation."],
];

export default function ReportsPage(){
  return <MarketingShell>
    <section className="marketingPageHero reportHero"><div><span className="marketingEyebrow">REPORTING STUDIO</span><h1>Turn analysis into a report that is ready to share.</h1><p>Data Studio converts analysis into professional, branded report layouts with KPIs, charts, findings and recommendations — without manually assembling slides or pages.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton large" href="/studio">Generate a Report →</a><a className="marketingSecondaryButton large" href="#sample-report">View Sample Report</a></div></div><MiniReportStack/></section>
    <section className="marketingSection" id="sample-report"><div className="marketingSectionHead"><span>REPORT TYPES</span><h2>Different analysis. One consistent reporting system.</h2><p>Report sections adapt to the data available, so empty analysis blocks are not forced into the document.</p></div><div className="marketingReportTypeGrid">{reportTypes.map(([title,copy],i)=><article key={title}><span>{String(i+1).padStart(2,"0")}</span><strong>{title}</strong><p>{copy}</p></article>)}</div></section>
    <section className="marketingReportDetail"><div><span>WHAT A FULL REPORT CAN INCLUDE</span><h2>More than a chart export.</h2><ul><li>Executive summary and dataset context</li><li>4–8 relevant KPIs where supported</li><li>Performance and category visualisations</li><li>Ranked insights and evidence</li><li>Data quality assessment</li><li>Statistics, forecast or comparison sections when available</li><li>Recommendations and what to investigate next</li><li>Branded footer, date and page numbering</li></ul></div><div className="marketingReportSheet"><span>FULL ANALYSIS</span><h3>Decision-ready output</h3><div className="marketingReportSheetKpis"><b>$128K<small>Revenue</small></b><b>96%<small>Quality</small></b><b>39<small>Insights</small></b></div><div className="marketingReportSheetChart"><i/><i/><i/><i/><i/><i/><i/></div><div className="marketingReportSheetList"><span/><span/><span/></div></div></section>
    <section className="marketingSection"><div className="marketingSectionHead row"><div><span>REPORTS FOR REAL WORKFLOWS</span><h2>Turn business analysis into a consistent deliverable.</h2><p>Reporting Studio can package the analysis generated from common business datasets without forcing irrelevant sections into the report.</p></div><a href="/solutions">Explore solutions →</a></div><div className="marketingCapabilityGrid"><a href="/solutions/sales-analysis"><span>01</span><strong>Sales & Revenue Reports</strong><p>Summarise revenue KPIs, product performance, regional breakdowns and trends.</p><em>Explore →</em></a><a href="/solutions/inventory-analysis"><span>02</span><strong>Inventory Reports</strong><p>Report stock levels, movement, category concentration and period changes.</p><em>Explore →</em></a><a href="/solutions/financial-analysis"><span>03</span><strong>Financial Analysis Reports</strong><p>Package cost, revenue, category, comparison and scenario findings.</p><em>Explore →</em></a><a href="/solutions/operations-analysis"><span>04</span><strong>Operations Reports</strong><p>Share operational KPIs, status patterns, outliers and recommended follow-up.</p><em>Explore →</em></a></div></section>
    <section className="marketingWhiteLabelBand"><div><span>YOUR BRAND, YOUR REPORT</span><h2>Need the report under your own company name?</h2><p>White-label reporting can replace Azhan Data Studio branding with your company name, logo, colours and report identity.</p></div><a className="marketingPrimaryButton" href="/white-label-reports">Explore White-Label Reporting →</a></section>
  </MarketingShell>;
}
