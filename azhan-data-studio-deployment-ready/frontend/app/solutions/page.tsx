import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { buildPageMetadata, SITE_URL } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Business Data Analysis Solutions for Excel & CSV",
  description: "Explore practical Excel and CSV analysis workflows for sales, inventory, finance, operations, customer data and business performance using Azhan Data Studio.",
  path: "/solutions",
  keywords: ["business data analysis", "sales analysis Excel", "inventory analysis Excel", "operations analytics", "financial data analysis Excel"],
});

const solutions = [
  {id:"sales", href:"/solutions/sales-analysis", icon:"↗", title:"Sales & Revenue", desc:"Turn sales spreadsheets into revenue KPIs, trends, product comparisons, regional breakdowns and shareable reports.", bullets:["Revenue and volume KPIs","Product and region performance","Trend and growth analysis","Forecasting and reporting"]},
  {id:"operations", href:"/solutions/operations-analysis", icon:"⚙", title:"Operations", desc:"Analyse operational data to surface bottlenecks, concentration, unusual patterns and process performance.", bullets:["Performance metrics","Status and category analysis","Outlier detection","Recurring reporting"]},
  {id:"inventory", href:"/solutions/inventory-analysis", icon:"◇", title:"Inventory", desc:"Explore stock, movement and category data across periods without building a custom dashboard first.", bullets:["Stock and movement trends","Top / bottom categories","Monthly comparison","Data quality checks"]},
  {id:"finance", href:"/solutions/financial-analysis", icon:"$", title:"Finance", desc:"Explore financial datasets, compare periods, understand distributions and model scenarios from spreadsheet data.", bullets:["Cost and revenue summaries","Variance comparisons","Scenario modelling","Professional reports"]},
  {id:"customer-data", href:"/features/csv-excel-analysis", icon:"◎", title:"Customer Data", desc:"Profile and analyse customer datasets for segments, concentration, missing information and behavioural patterns.", bullets:["Segment profiling","Concentration analysis","Data quality review","Statistical relationships"]},
  {id:"business-performance", href:"/product", icon:"▥", title:"Business Performance", desc:"Bring together KPIs, trends, categories and findings to create a decision-ready performance view.", bullets:["KPI overview","Automatic dashboards","Ranked findings","Executive reporting"]},
];

const schema = {
  "@context":"https://schema.org",
  "@graph":[
    {"@type":"CollectionPage","@id":`${SITE_URL}/solutions#webpage`,url:`${SITE_URL}/solutions`,name:"Business Data Analysis Solutions for Excel & CSV",isPartOf:{"@id":`${SITE_URL}/#website`},about:{"@id":`${SITE_URL}/#software`},inLanguage:"en-AU"},
    {"@type":"ItemList","@id":`${SITE_URL}/solutions#solutions`,itemListElement:solutions.slice(0,4).map((item,index)=>({"@type":"ListItem",position:index+1,name:item.title,url:`${SITE_URL}${item.href}`}))}
  ]
};

export default function SolutionsPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">SOLUTIONS</span><h1>Use your existing data to answer better business questions.</h1><p>Data Studio is general-purpose by design. If your business works in Excel or CSV, the same analysis engine can help you profile, compare, visualise, forecast and report on the data.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton large" href="/studio">Analyse Your Data →</a><a className="marketingSecondaryButton large" href="/contact">Discuss a Use Case</a></div></section>
    <section className="marketingSection"><div className="marketingSectionHead"><span>BUSINESS WORKFLOWS</span><h2>Start with the question your team is trying to answer.</h2><p>Each solution page shows the fields, analysis workflow and outputs that commonly apply to that business use case.</p></div><div className="marketingSolutionGrid">{solutions.map(s=><article id={s.id} key={s.id}><span className="marketingSolutionIcon">{s.icon}</span><div><strong>{s.title}</strong><p>{s.desc}</p><ul>{s.bullets.map(b=><li key={b}>✓ {b}</li>)}</ul><a href={s.href}>{s.href.startsWith("/solutions/")?"Explore the solution":"Explore the workflow"} →</a></div></article>)}</div></section>
    <section className="marketingSplitBand"><div><span>ONE PLATFORM, DIFFERENT QUESTIONS</span><h2>Use the same file across analysis, quality, forecasting and reporting.</h2><p>Instead of rebuilding the workflow every time the business question changes, move between Data Studio tools while keeping the dataset at the centre of the analysis.</p></div><div className="marketingCheckList"><span>✓ Excel & CSV analysis</span><span>✓ Data quality checks</span><span>✓ Automatic dashboards</span><span>✓ Dataset comparison</span><span>✓ Forecast & scenarios</span><span>✓ Professional reporting</span></div></section>
    <section className="marketingWhiteLabelBand"><div><span>NEED SOMETHING MORE SPECIFIC?</span><h2>Custom and white-label reporting is available.</h2><p>If your organisation needs its own name, logo and report identity, contact Azhan to discuss a branded reporting setup.</p></div><a className="marketingPrimaryButton" href="/white-label-reports">Explore White-Label Reports →</a></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}} />
  </MarketingShell>;
}
