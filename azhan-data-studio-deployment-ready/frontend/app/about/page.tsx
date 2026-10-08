import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { LINKEDIN_URL, PORTFOLIO_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Azhan Data Studio",
  description: "Learn why Azhan Data Studio was built and meet Azhan Hassan, the data and product professional behind the platform.",
  path: "/about",
  keywords: ["Azhan Data Studio", "Azhan Hassan", "data analytics product"],
});

export default function AboutPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">ABOUT</span><h1>Make the distance between a spreadsheet and a decision shorter.</h1><p>Azhan Data Studio is built around a simple idea: business users should be able to upload familiar Excel or CSV data and quickly understand what deserves attention.</p></section>
    <section className="marketingSection"><div className="marketingAboutGrid"><article><span>01</span><h2>Upload</h2><p>Start with the file you already have instead of rebuilding the data somewhere else first.</p></article><article><span>02</span><h2>Understand</h2><p>Use profiling, quality checks, ranked findings and visual analysis to understand the dataset.</p></article><article><span>03</span><h2>Decide</h2><p>Turn the result into dashboards, comparisons, forecasts, scenarios and reports that support action.</p></article></div></section>
    <section className="marketingCreatorSection"><div className="marketingCreatorBadgeLarge">AH</div><div><span>BUILT BY AZHAN HASSAN</span><h2>Data, analytics, AI and practical product building.</h2><p>Azhan is a data and product professional focused on analytics, automation, AI and building practical tools that make information easier to use.</p><div className="marketingHeroActions"><a className="marketingPrimaryButton" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View Portfolio ↗</a><a className="marketingSecondaryButton" href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn ↗</a><a className="marketingSecondaryButton" href="/contact">Contact Azhan</a></div></div></section>
  </MarketingShell>;
}
