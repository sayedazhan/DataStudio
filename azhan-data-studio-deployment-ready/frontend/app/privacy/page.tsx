import type { Metadata } from "next";
import { PORTFOLIO_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy & Data Handling",
  description: "How Azhan Data Studio handles uploaded CSV and Excel files, browser storage, optional support payments and technical service data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <main className="legalPage">
    <header className="legalHeader"><a href="/">← Azhan Data Studio</a><span>PRIVACY &amp; DATA HANDLING</span></header>
    <article className="legalArticle">
      <p className="legalUpdated">Last updated: 24 September 2026</p>
      <h1>Privacy &amp; Data Handling</h1>
      <p className="legalLead">Azhan Data Studio is designed for practical analysis of CSV and Excel files with a small data footprint. This page explains what happens when you use the public application.</p>
      <section><h2>Uploaded files</h2><p>When you use an analysis tool, the selected file is sent to the Azhan Data Studio analysis backend so the requested calculation can run. The application reads uploaded files in memory and does not write the uploaded source file to persistent server storage as part of the analysis workflow.</p><p>Do not upload information you are not authorised to process. Avoid highly sensitive personal, confidential, regulated or security-critical information unless you have independently confirmed that using this service is appropriate for that data.</p></section>
      <section><h2>Monthly Intelligence browser storage</h2><p>Monthly Intelligence can store the files you add in your own browser using IndexedDB, allowing the local file library to remain available between sessions on that browser. Alert preferences are stored in local browser storage. You can remove files or reset the local library from the Monthly Intelligence interface.</p></section>
      <section><h2>AI and dataset contents</h2><p>The current Azhan Data Studio analysis engine uses deterministic rules, data profiling and statistical methods. The application does not send uploaded dataset contents to a large language model for interpretation.</p></section>
      <section><h2>Technical service data</h2><p>The hosting, network and infrastructure providers used to deliver the website and analysis API may process routine technical information such as IP address, request time, browser information, service logs and security events. This information can be required to operate, secure and troubleshoot the service.</p></section>
      <section><h2>Optional Stripe support payments</h2><p>If you choose the optional support link, you leave Azhan Data Studio and continue to Stripe. Stripe processes the payment information required for that transaction under its own privacy terms. Azhan Data Studio does not receive or store your full payment-card details.</p></section>
      <section><h2>Cookies and analytics</h2><p>Azhan Data Studio does not require an account or advertising cookies to run the analysis tools. If privacy-safe product analytics are enabled in a future deployment, this page should be updated before those analytics are activated.</p></section>
      <section><h2>Retention and deletion</h2><p>Uploaded source files are not intentionally persisted by the application backend. Browser-stored Monthly Intelligence files remain on your device until you remove them, clear the local library or clear the relevant browser site data. Infrastructure logs may follow the retention practices of the hosting providers.</p></section>
      <section><h2>Contact</h2><p>For questions about this project or its data handling, use the contact options on the creator portfolio.</p><a className="legalCta" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Contact via portfolio ↗</a></section>
    </article>
    <footer className="legalFooter"><a href="/">Home</a><a href="/terms">Terms &amp; Disclaimer</a><a href="/features/csv-excel-analysis">How analysis works</a></footer>
  </main>;
}
