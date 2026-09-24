import type { Metadata } from "next";
import { PORTFOLIO_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms & Disclaimer",
  description: "Terms, acceptable use and analytical disclaimer for Azhan Data Studio's free CSV and Excel analysis tools.",
  path: "/terms",
});

export default function TermsPage() {
  return <main className="legalPage">
    <header className="legalHeader"><a href="/">← Azhan Data Studio</a><span>TERMS &amp; DISCLAIMER</span></header>
    <article className="legalArticle">
      <p className="legalUpdated">Last updated: 24 September 2026</p>
      <h1>Terms &amp; Disclaimer</h1>
      <p className="legalLead">Azhan Data Studio is a free independent analytics project. By using the public tools, you agree to use them responsibly and to review the outputs before relying on them.</p>
      <section><h2>Analytical outputs</h2><p>Profiles, rankings, data-quality flags, statistical results, forecasts, comparisons and scenario outputs are analytical aids. They are generated from the data and settings supplied and may contain errors, limitations or assumptions that do not match your situation.</p><p>The service does not provide financial, legal, accounting, investment, safety, medical or other professional advice. You remain responsible for validating results and making decisions.</p></section>
      <section><h2>Forecasts and statistical evidence</h2><p>Forecasts are estimates rather than guarantees. Statistical relationships do not by themselves establish causation. Data-quality flags identify records for review and do not automatically mean a value is incorrect.</p></section>
      <section><h2>Your files and permissions</h2><p>You must have the right to upload and process any file you submit. Do not use the service to upload unlawful content, malware, confidential information you are not authorised to process, or data whose handling would breach an obligation that applies to you.</p></section>
      <section><h2>Availability</h2><p>The service is provided on an as-is and as-available basis. Features may change, be corrected, be suspended or be removed. No guarantee is made that the service will always be available, error-free or suitable for a particular purpose.</p></section>
      <section><h2>Reasonable use</h2><p>Automated abuse, attempts to bypass file or request limits, denial-of-service activity, security testing without permission, scraping that degrades the service, or use intended to disrupt other users is not permitted.</p></section>
      <section><h2>External services</h2><p>Links to services such as Stripe or the creator portfolio take you to third-party services governed by their own terms and privacy practices.</p></section>
      <section><h2>Project ownership</h2><p>Azhan Data Studio, its interface and original project materials remain the work of the project creator unless otherwise indicated. Your uploaded data remains yours; using the tool does not transfer ownership of your source data to the project.</p></section>
      <section><h2>Contact</h2><p>Questions about the project can be raised through the creator portfolio.</p><a className="legalCta" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View creator portfolio ↗</a></section>
    </article>
    <footer className="legalFooter"><a href="/">Home</a><a href="/privacy">Privacy &amp; Data Handling</a><a href="/features/csv-excel-analysis">How analysis works</a></footer>
  </main>;
}
