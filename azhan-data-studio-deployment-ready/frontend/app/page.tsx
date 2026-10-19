import type { Metadata } from "next";
import MarketingShell from "./components/marketing-shell";
import { MarketingIcon, PremiumHeroVisual, PremiumReportVisual } from "./components/marketing-visuals";
import { buildPageMetadata } from "./lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel Dashboard, Insights & Reports — Automatically",
  description: "Upload Excel or CSV data and automatically get data-quality checks, KPIs, dashboards, insights and professional reports without building everything manually.",
  path: "/",
  keywords: ["Excel dashboard generator", "Excel data analysis", "CSV analysis", "automatic dashboard", "data quality checker", "professional data reports"],
});

const features = [
  ["analyse", "Analyse a Dataset", "Instant insights and automatic dashboards.", "/studio", "blue"],
  ["clean", "Clean My Data", "Find and fix common data-quality issues.", "/clean", "purple"],
  ["compare", "Compare Datasets", "Find differences between two datasets.", "/compare", "green"],
  ["monthly", "Monthly Intelligence", "Track trends and monthly performance.", "/monthly", "orange"],
  ["forecast", "Forecast", "Project future trends using your data.", "/forecast", "pink"],
  ["scenario", "Scenario Analysis", "Test different scenarios and assumptions.", "/scenario", "violet"],
  ["statistics", "Statistics", "Explore metrics, distributions and relationships.", "/statistics", "cyan"],
  ["report", "Reporting Studio", "Create professional reports ready to share.", "/reports", "blue"],
] as const;

const useCases = [
  ["sales", "Sales & Revenue", "Track performance, find trends and forecast growth.", "green", "/solutions/sales-analysis"],
  ["operations", "Operations", "Identify bottlenecks, patterns and improvement opportunities.", "purple", "/solutions/operations-analysis"],
  ["inventory", "Inventory", "Monitor stock levels, compare periods and plan ahead.", "orange", "/solutions/inventory-analysis"],
  ["finance", "Finance", "Analyse financial data, track costs and evaluate scenarios.", "blue", "/solutions/financial-analysis"],
  ["customer", "Customer Data", "Understand customers, segmentation and behaviour.", "pink", "/features/csv-excel-analysis"],
  ["business", "Business Performance", "Combine metrics to get the bigger picture.", "cyan", "/product"],
] as const;

function FeaturePreview({name}:{name:string}){
  if(name === "Clean My Data") return <div className="featurePreview quality"><i/><i/><i/><i/></div>;
  if(name === "Compare Datasets") return <div className="featurePreview compare"><span/><span/><span/></div>;
  if(name === "Statistics") return <div className="featurePreview scatter">{Array.from({length:18}).map((_,i)=><i key={i} style={{left:`${8+(i*17)%80}%`,top:`${72-(i*11)%58}%`}}/>)}</div>;
  if(name === "Scenario Analysis") return <div className="featurePreview lines"><svg viewBox="0 0 100 55"><polyline points="2,47 18,39 34,42 50,25 66,32 82,15 98,20"/><polyline points="2,50 18,45 34,44 50,37 66,38 82,29 98,32"/><polyline points="2,44 18,32 34,35 50,18 66,26 82,8 98,12"/></svg></div>;
  if(name === "Forecast") return <div className="featurePreview lines"><svg viewBox="0 0 100 55"><polyline points="2,47 18,39 34,42 50,25 66,31 82,17 98,12"/></svg><span/></div>;
  if(name === "Reporting Studio") return <div className="featurePreview report"><b/><b/><b/></div>;
  return <div className="featurePreview bars"><i/><i/><i/><i/><i/></div>;
}

export default function HomePage(){
  return <MarketingShell>
    <section className="marketingHero premiumLandingHero">
      <div className="marketingHeroGlow"/><div className="premiumHeroMesh"/>
      <div className="marketingHeroInner">
        <div className="marketingHeroCopy">
          <span className="marketingEyebrow">EXCEL & CSV → DASHBOARD + REPORT</span>
          <h1>Turn Excel and CSV data into <span>dashboards, insights and professional reports — automatically.</span></h1>
          <p>Upload your business data and Data Studio checks its quality, finds important patterns, builds KPIs and visualisations, and creates a shareable analysis — without formulas, dashboard setup or BI development.</p>
          <div className="marketingHeroActions"><a className="marketingPrimaryButton large" href="/studio">Analyse My Data Free <span>→</span></a><a className="marketingSecondaryButton large premiumHeroSecondary" href="/reports#sample-report">▶ View Sample Report</a></div>
          <div className="marketingProofRow premiumProofRow">
            <div><span className="proofIcon excel">X</span><section><b>Excel & CSV</b><small>Upload existing business data</small></section></div>
            <div><span className="proofIcon purple">✓</span><section><b>Quality checks</b><small>Spot issues before analysis</small></section></div>
            <div><span className="proofIcon pink"><MarketingIcon name="analyse" size={15}/></span><section><b>No dashboard building</b><small>KPIs and visuals generated for you</small></section></div>
            <div><span className="proofIcon blue">▣</span><section><b>Privacy-first</b><small>Source files are not intentionally persisted</small></section></div>
          </div>
        </div>
        <PremiumHeroVisual/>
      </div>
    </section>

    <section className="marketingSection marketingWorkflowSection premiumLightSection">
      <div className="marketingSectionHead"><div><h2>From spreadsheet to decision-ready analysis</h2><p>A simple workflow for people who need answers from Excel or CSV data without building an analytics solution first.</p></div></div>
      <div className="marketingWorkflow premiumWorkflow">
        <article><span className="stepIcon upload"><MarketingIcon name="upload" size={28}/></span><b>1. Upload</b><p>Use the Excel or CSV file you already have.</p></article><i>→</i>
        <article><span className="stepIcon analyse"><MarketingIcon name="explore" size={28}/></span><b>2. Check</b><p>Profile structure, quality and analysis readiness.</p></article><i>→</i>
        <article><span className="stepIcon explore"><MarketingIcon name="analyse" size={28}/></span><b>3. Analyse</b><p>Generate KPIs, charts, patterns and insights.</p></article><i>→</i>
        <article><span className="stepIcon report"><MarketingIcon name="report" size={28}/></span><b>4. Report</b><p>Create a professional output ready to share.</p></article>
      </div>
    </section>

    <section className="marketingValueSection">
      <div className="marketingValueInner">
        <div className="marketingSectionHead"><span>WHY DATA STUDIO?</span><h2>Built for people who work in Excel but do not want to build analytics from scratch.</h2><p>Small businesses, managers, finance and operations teams, and analysts often already have the data. The time-consuming part is cleaning it, choosing the right metrics, building visuals and turning the result into something decision-ready.</p></div>
        <div className="marketingValueGrid">
          <article><span>01</span><strong>No formulas to design</strong><p>Data Studio profiles the file and calculates useful KPIs from the fields it finds.</p></article>
          <article><span>02</span><strong>No dashboard build project</strong><p>Get an immediate analytical view before deciding whether a custom BI solution is even needed.</p></article>
          <article><span>03</span><strong>No prompt engineering</strong><p>The workflow is structured around data quality, analysis, comparison, forecasting and reporting.</p></article>
          <article><span>04</span><strong>Ready-to-share output</strong><p>Move from raw spreadsheet to dashboard and professional report in one workflow.</p></article>
        </div>
        <div className="marketingAudienceRow"><span>Designed for Excel-first teams:</span><b>Small businesses</b><b>Managers</b><b>Finance</b><b>Operations</b><b>Sales</b><b>Analysts</b></div>
      </div>
    </section>

    <section className="marketingFeatureSection premiumFeatureSection">
      <div className="premiumFeatureInner">
        <div className="marketingSectionHead row"><div><h2>Powerful analytics, all in one place</h2><p>Start with a quick analysis, then move into quality, comparison, forecasting, statistics and reporting when the question requires it.</p></div><a href="/features">Explore all features →</a></div>
        <div className="marketingFeatureGrid premiumFeatureGrid">{features.map(([icon,title,copy,href,tone])=><a href={href} className="marketingFeatureCard premiumFeatureCard" key={title}>
          <span className={`premiumIcon ${tone}`}><MarketingIcon name={icon} size={20}/></span><strong>{title}</strong><p>{copy}</p><FeaturePreview name={title}/>
        </a>)}</div>
      </div>
    </section>

    <section className="marketingReportShowcase premiumReportShowcase" id="reports">
      <div className="marketingReportCopy"><span className="marketingEyebrow dark">PROFESSIONAL REPORTS</span><h2>Analysis that is ready to share.</h2><p>Generate professionally designed reports with KPIs, insights, charts and recommendations. Use them for business reviews, stakeholders and clients without rebuilding the analysis in another tool.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton" href="/reports#sample-report">View Sample Report</a><a className="marketingSecondaryButton" href="/studio">Generate Your Own Report</a></div><a className="marketingWhiteLabelCallout" href="/white-label-reports"><span><MarketingIcon name="report" size={18}/></span><div><strong>Need reports under your own company brand?</strong><small>Company-branded and white-label reports are available with your own name, logo and report identity. Contact Azhan →</small></div></a></div>
      <PremiumReportVisual/>
    </section>

    <section className="marketingTrustBand">
      <div><span>DATA PRIVACY & TRUST</span><h2>Your spreadsheet should not become the product.</h2><p>The current analysis API reads uploaded source files in memory and does not intentionally write them to persistent server storage. Uploaded dataset contents are not sent to an LLM by the current analysis engine.</p></div>
      <div className="marketingTrustPoints"><span>✓ In-memory source-file processing</span><span>✓ No LLM receives uploaded dataset contents</span><span>✓ GA4 excludes dataset contents by design</span><a href="/privacy">Read the full data-handling policy →</a></div>
    </section>

    <section className="marketingSection marketingUseCases premiumUseCases" id="solutions">
      <div className="marketingSectionHead row"><div><h2>Use cases across every business</h2><p>If your team works in Excel or CSV, Data Studio can help turn that data into a structured analytical view.</p></div><a href="/solutions">See more solutions →</a></div>
      <div className="marketingUseGrid premiumUseGrid">{useCases.map(([icon,title,copy,tone,href])=><article key={title}><span className={`premiumIcon ${tone}`}><MarketingIcon name={icon} size={19}/></span><div><strong><a href={href}>{title}</a></strong><p>{copy}</p></div></article>)}</div>
    </section>

    <section className="marketingCommercialSection">
      <div className="marketingCommercialHead"><span>FREE TODAY · PRO NEXT · CUSTOM NOW</span><h2>A clear path from self-service to premium support.</h2><p>Use the core product free. Join the Pro waitlist if you want saved workspaces and premium capabilities, or contact Azhan for custom dashboards, white-label reporting and workflow automation.</p></div>
      <div className="marketingCommercialGrid">
        <article className="active"><small>AVAILABLE NOW</small><strong>Free</strong><b>$0</b><p>Analyse Excel/CSV files, check quality, explore dashboards and generate standard reports.</p><a href="/studio">Analyse My Data Free →</a></article>
        <article><small>COMING SOON</small><strong>Data Studio Pro</strong><b>Pricing TBC</b><p>Saved analyses, premium reports, higher limits and future AI / automation features.</p><a href="/pricing#pro-waitlist">Join the Waitlist →</a></article>
        <article><small>FOR ORGANISATIONS</small><strong>Business / Custom</strong><b>Contact Azhan</b><p>Custom dashboards, white-label reports, tailored analysis and workflow automation.</p><a href="/contact#business-enquiry">Discuss Your Requirement →</a></article>
      </div>
    </section>

    <section className="marketingProBand premiumProBand">
      <div><span>DATA STUDIO PRO — COMING SOON</span><h2>Go further when Data Studio becomes part of your regular workflow.</h2><p>Pro will be shaped by real usage and waitlist demand rather than locking users into accounts before the value is clear.</p><a href="/pricing#pro-waitlist" className="marketingPrimaryButton">Join the Pro Waitlist →</a></div>
      <div className="marketingProBenefits"><article><b>☁</b><span>Saved analyses<br/>and history</span></article><article><b>▣</b><span>Advanced<br/>reporting</span></article><article><b>✦</b><span>Future AI &<br/>automation</span></article><article><b>↗</b><span>Higher<br/>usage limits</span></article></div>
    </section>

    <section className="marketingSection marketingGuidesPreview premiumGuidesPreview">
      <div className="marketingSectionHead row"><div><h2>Learn and explore</h2><p>Practical guides to help you get more value from spreadsheet data.</p></div><a href="/guides">View all guides →</a></div>
      <div className="marketingGuideGrid premiumGuideGrid"><a href="/guides/analyse-excel-data-online"><span><MarketingIcon name="analyse" size={20}/></span><strong>How to analyse Excel data online</strong><p>Step-by-step guide to get insights from your spreadsheet data.</p></a><a href="/guides/check-excel-data-quality"><span><MarketingIcon name="clean" size={20}/></span><strong>How to check Excel data quality</strong><p>Find and fix common data issues in your files.</p></a><a href="/guides/create-dashboard-from-excel"><span><MarketingIcon name="monthly" size={20}/></span><strong>How to create a dashboard from Excel</strong><p>Turn your data into interactive charts and dashboards.</p></a><a href="/guides/compare-excel-files"><span><MarketingIcon name="compare" size={20}/></span><strong>How to compare Excel files</strong><p>Quickly identify differences between two datasets.</p></a></div>
    </section>
  </MarketingShell>;
}
