import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { SUPPORT_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Data Analysis Tool Pricing & Data Studio Pro",
  description: "Azhan Data Studio is free to use today for Excel and CSV analysis. Explore future Data Studio Pro features, premium reporting and white-label options.",
  path: "/pricing",
  keywords: ["data analysis software pricing", "Excel analytics pricing", "Data Studio Pro", "white label reporting pricing"],
});

export default function PricingPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">PRICING</span><h1>Start free. Pay only when premium value makes sense.</h1><p>The current core Data Studio workflow remains free and frictionless. Premium reports, saved workspaces and advanced intelligence are being explored for a future Pro offering.</p></section>
    <section className="marketingSection"><div className="marketingPricingGrid"><article className="featured"><span>AVAILABLE NOW</span><h2>Data Studio Free</h2><strong>$0</strong><small>No account required</small><ul><li>✓ Excel & CSV analysis</li><li>✓ Data quality checks</li><li>✓ Automatic dashboards</li><li>✓ Compare, forecast & statistics tools</li><li>✓ Professional reporting workflow</li></ul><a className="marketingPrimaryButton" href="/studio">Launch Studio →</a></article><article><span>COMING SOON</span><h2>Data Studio Pro</h2><strong>Pricing TBC</strong><small>Designed for repeat users</small><ul><li>✓ Saved analyses and history</li><li>✓ Advanced report options</li><li>✓ Higher usage limits</li><li>✓ Premium intelligence features</li><li>✓ Future AI-powered workflows</li></ul><a className="marketingSecondaryButton" href="/contact#pro">Register Interest</a></article><article><span>FOR ORGANISATIONS</span><h2>White-Label</h2><strong>Contact Azhan</strong><small>Custom scope</small><ul><li>✓ Your logo and company name</li><li>✓ Branded report identity</li><li>✓ Custom report requirements</li><li>✓ Recurring reporting discussion</li><li>✓ Business use-case support</li></ul><a className="marketingSecondaryButton" href="/white-label-reports">Explore White-Label →</a></article></div></section>
    <section className="marketingSupportBand"><div><span>SUPPORT THE PROJECT</span><h2>Using Data Studio and want to support development?</h2><p>A one-time contribution helps support hosting, continued development and future product improvements.</p></div><a className="marketingPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">Support Data Studio ↗</a></section>
  </MarketingShell>;
}
