import type { Metadata } from "next";
import MarketingShell from "./components/marketing-shell";
import { MarketingIcon, PremiumHeroVisual, PremiumReportVisual } from "./components/marketing-visuals";
import { buildPageMetadata } from "./lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Analytics, Dashboards and Reports",
  description: "Turn Excel and CSV files into decision-ready intelligence with automatic analysis, data quality checks, dashboards, comparisons, forecasting, statistics and professional reports.",
  path: "/",
  keywords: ["Excel data analysis", "CSV analysis", "Excel dashboard generator", "data analysis reports", "automatic data analysis"],
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
          <span className="marketingEyebrow">TURN DATA INTO INSIGHTS</span>
          <h1>Turn spreadsheets into <span>decision-ready intelligence.</span></h1>
          <p>Analyse Excel and CSV files, uncover insights, build dashboards, compare datasets, forecast trends and generate professional reports — without building everything manually.</p>
          <div className="marketingHeroActions"><a className="marketingPrimaryButton large" href="/studio">Launch Data Studio <span>→</span></a><a className="marketingSecondaryButton large premiumHeroSecondary" href="/reports#sample-report">▶ View Sample Report</a></div>
          <div className="marketingProofRow premiumProofRow">
            <div><span className="proofIcon excel">X</span><section><b>Excel & CSV</b><small>Works instantly</small></section></div>
            <div><span className="proofIcon purple">✦</span><section><b>No account required</b><small>Start analysing now</small></section></div>
            <div><span className="proofIcon pink"><MarketingIcon name="analyse" size={15}/></span><section><b>Automatic analysis</b><small>Insights without setup</small></section></div>
            <div><span className="proofIcon blue"><MarketingIcon name="report" size={15}/></span><section><b>Professional reports</b><small>Ready to share</small></section></div>
          </div>
        </div>
        <PremiumHeroVisual/>
      </div>
    </section>

    <section className="marketingSection marketingWorkflowSection premiumLightSection">
      <div className="marketingSectionHead"><div><h2>From raw data to intelligence</h2><p>A simple and powerful workflow. Upload your data and let Data Studio do the rest.</p></div></div>
      <div className="marketingWorkflow premiumWorkflow">
        <article><span className="stepIcon upload"><MarketingIcon name="upload" size={28}/></span><b>1. Upload</b><p>Upload your Excel or CSV file in seconds.</p></article><i>→</i>
        <article><span className="stepIcon analyse"><MarketingIcon name="explore" size={28}/></span><b>2. Analyse</b><p>Automatic data profiling and insights.</p></article><i>→</i>
        <article><span className="stepIcon explore"><MarketingIcon name="analyse" size={28}/></span><b>3. Explore</b><p>Interactive charts, comparisons and guided analysis.</p></article><i>→</i>
        <article><span className="stepIcon report"><MarketingIcon name="report" size={28}/></span><b>4. Report</b><p>Generate professional reports ready to share.</p></article>
      </div>
    </section>

    <section className="marketingFeatureSection premiumFeatureSection">
      <div className="premiumFeatureInner">
        <div className="marketingSectionHead row"><div><h2>Powerful analytics, all in one place</h2><p>Everything you need to understand your data and create real impact.</p></div><a href="/features">Explore all features →</a></div>
        <div className="marketingFeatureGrid premiumFeatureGrid">{features.map(([icon,title,copy,href,tone])=><a href={href} className="marketingFeatureCard premiumFeatureCard" key={title}>
          <span className={`premiumIcon ${tone}`}><MarketingIcon name={icon} size={20}/></span><strong>{title}</strong><p>{copy}</p><FeaturePreview name={title}/>
        </a>)}</div>
      </div>
    </section>

    <section className="marketingReportShowcase premiumReportShowcase" id="reports">
      <div className="marketingReportCopy"><span className="marketingEyebrow dark">PROFESSIONAL REPORTS</span><h2>Analysis that is ready to share.</h2><p>Generate professionally designed reports with insights, charts and recommendations. Perfect for business reviews, stakeholders and clients.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton" href="/reports#sample-report">View Sample Report</a><a className="marketingSecondaryButton" href="/studio">Generate Your Own Report</a></div><a className="marketingWhiteLabelCallout" href="/white-label-reports"><span><MarketingIcon name="report" size={18}/></span><div><strong>Need reports under your own company brand?</strong><small>Company-branded and white-label reports are available with your own name, logo and report identity. Contact Azhan →</small></div></a></div>
      <PremiumReportVisual/>
    </section>

    <section className="marketingSection marketingUseCases premiumUseCases" id="solutions">
      <div className="marketingSectionHead row"><div><h2>Use cases across every business</h2><p>Data Studio works with any Excel or CSV data. Here are some common use cases.</p></div><a href="/solutions">See more solutions →</a></div>
      <div className="marketingUseGrid premiumUseGrid">{useCases.map(([icon,title,copy,tone,href])=><article key={title}><span className={`premiumIcon ${tone}`}><MarketingIcon name={icon} size={19}/></span><div><strong><a href={href}>{title}</a></strong><p>{copy}</p></div></article>)}</div>
    </section>

    <section className="marketingProBand premiumProBand">
      <div><span>DATA STUDIO PRO — COMING SOON</span><h2>Go further with Data Studio Pro.</h2><p>Save your analyses, access advanced reports, get higher usage limits and unlock AI-powered intelligence.</p><a href="/pricing" className="marketingPrimaryButton">Join the Waitlist →</a></div>
      <div className="marketingProBenefits"><article><b>☁</b><span>Saved analyses<br/>and history</span></article><article><b>▣</b><span>Advanced<br/>reporting</span></article><article><b>✦</b><span>AI-powered<br/>intelligence</span></article><article><b>↗</b><span>Higher<br/>usage limits</span></article></div>
    </section>

    <section className="marketingSection marketingGuidesPreview premiumGuidesPreview">
      <div className="marketingSectionHead row"><div><h2>Learn and explore</h2><p>Practical guides to help you get the most from your data.</p></div><a href="/guides">View all guides →</a></div>
      <div className="marketingGuideGrid premiumGuideGrid"><a href="/guides/analyse-excel-data-online"><span><MarketingIcon name="analyse" size={20}/></span><strong>How to analyse Excel data online</strong><p>Step-by-step guide to get insights from your spreadsheet data.</p></a><a href="/guides/check-excel-data-quality"><span><MarketingIcon name="clean" size={20}/></span><strong>How to check Excel data quality</strong><p>Find and fix common data issues in your files.</p></a><a href="/guides/create-dashboard-from-excel"><span><MarketingIcon name="monthly" size={20}/></span><strong>How to create a dashboard from Excel</strong><p>Turn your data into interactive charts and dashboards.</p></a><a href="/guides/compare-excel-files"><span><MarketingIcon name="compare" size={20}/></span><strong>How to compare Excel files</strong><p>Quickly identify differences between two datasets.</p></a></div>
    </section>
  </MarketingShell>;
}
