import type { Metadata } from "next";
import { SUPPORT_URL } from "../lib/config";
import { buildPageMetadata, SITE_NAME, SITE_URL } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "CSV & Excel Data Tools",
  description: "Explore Azhan Data Studio tools for CSV and Excel analysis, data quality checking, dataset comparison, forecasting, cleaning, scenarios and statistics.",
  path: "/features",
  keywords: ["CSV tools", "Excel data tools", "online data analysis tools", "data quality tool", "data forecasting tool"],
});

const guides = [
  { href: "/features/csv-excel-analysis", label: "ANALYSE", title: "CSV & Excel Data Analysis", copy: "Profile a dataset, surface ranked findings, inspect evidence and export report-ready outputs." },
  { href: "/features/data-quality-checker", label: "CHECK", title: "Data Quality Checker", copy: "Review missing values, duplicate rows, inconsistencies, outliers and affected records before trusting results." },
  { href: "/features/compare-excel-files", label: "COMPARE", title: "Compare Excel & CSV Files", copy: "Measure what changed between two datasets and trace movement back to fields, categories and records." },
  { href: "/features/data-forecasting", label: "FORECAST", title: "Data Forecasting", copy: "Turn historical time-series data into future-period estimates with uncertainty ranges and context." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/features#webpage`,
      url: `${SITE_URL}/features`,
      name: "CSV & Excel Data Tools",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#software` },
      inLanguage: "en-AU",
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/features#tools`,
      itemListElement: guides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: `${SITE_URL}${guide.href}`,
      })),
    },
  ],
};

export default function FeaturesPage() {
  return <main className="seoFeaturePage">
    <header className="topbar seoTopbar">
      <a className="brand" href="/" aria-label={`${SITE_NAME} home`}><span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span><span className="brandText"><strong>{SITE_NAME}</strong><small>Automated Data Intelligence</small></span></a>
      <div className="seoHeaderActions"><a className="seoHeaderLink" href="/">Open Studio</a>{SUPPORT_URL ? <a className="supportTopButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support</a> : null}</div>
    </header>

    <section className="seoFeatureHero seoFeatureHubHero">
      <div className="seoFeatureHeroCopy">
        <span className="panelKicker">DATA STUDIO TOOLKIT</span>
        <h1>Practical CSV and Excel tools for everyday data work.</h1>
        <p>Use the main studio for fast single-file analysis, or choose a focused workflow for data quality, comparison, forecasting, cleaning, monthly trends, scenarios and statistics.</p>
        <div className="seoFeatureActions"><a className="seoPrimaryCta" href="/">Analyse a dataset</a><a className="seoSecondaryCta" href="/privacy">How files are handled</a></div>
      </div>
      <aside className="seoFeaturePreview"><span>BUILT FOR</span><strong>Upload → Understand → Validate → Act</strong><div className="seoPreviewGrid"><article><b>CSV</b><small>Everyday extracts and exports</small></article><article><b>XLSX</b><small>Excel workbooks with sheet selection</small></article><article><b>QA</b><small>Quality checks before decisions</small></article><article><b>FREE</b><small>No account required</small></article></div></aside>
    </section>

    <section className="seoContentSection">
      <div className="seoSectionHeading"><span className="panelKicker">FEATURE GUIDES</span><h2>Start with the job you need to do.</h2></div>
      <div className="seoDiscoveryGrid seoFeatureHubGrid">{guides.map((guide) => <a className="seoDiscoveryCard" href={guide.href} key={guide.href}><span>{guide.label}</span><strong>{guide.title}</strong><small>{guide.copy}</small></a>)}</div>
    </section>

    <section className="seoContentSection seoUseCasesSection">
      <div className="seoSectionHeading"><span className="panelKicker">MORE WORKFLOWS</span><h2>Move into specialised analysis when you need it.</h2></div>
      <div className="seoUseCases"><a href="/clean">Clean My Data</a><a href="/monthly">Monthly Intelligence</a><a href="/scenario">Scenario Analysis</a><a href="/statistics">Statistics</a></div>
    </section>

    <section className="seoContentSection seoFaqSection">
      <div className="seoSectionHeading"><span className="panelKicker">FAQ</span><h2>Choosing a workflow</h2></div>
      <div className="seoFaqList">
        <details><summary>Which tool should I start with?</summary><p>Start with Analyse Data when you have one CSV or Excel file and want a broad understanding. Use the focused tools when your job is specifically cleaning, comparing, forecasting, modelling scenarios or statistical testing.</p></details>
        <details><summary>Do I need an account?</summary><p>No. The public Data Studio tools do not require an account or login.</p></details>
        <details><summary>Can I see how uploaded files are handled?</summary><p>Yes. The Privacy & Data Handling page explains server processing, browser storage used by Monthly Intelligence and the optional Stripe support flow.</p></details>
      </div>
    </section>

    <footer className="seoFooter"><div><strong>{SITE_NAME}</strong><span>Free browser-based data tools.</span></div><div><a href="/">Home</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </main>;
}
