import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { PORTFOLIO_URL, SUPPORT_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Data Studio Support",
  description: "Get help with Azhan Data Studio uploads, dashboards, reports, data quality, comparisons, forecasting and other product workflows.",
  path: "/support",
  keywords: ["Azhan Data Studio support", "Excel analysis tool support", "data analysis troubleshooting"],
});

const help = [
  ["Uploading Excel or CSV", "Use .csv or .xlsx files and make sure the selected sheet contains structured rows and column headings."],
  ["Dashboard generation", "Dashboards adapt to the fields detected. If no time field exists, Data Studio uses other meaningful visual fallbacks."],
  ["Reports", "Use Export & Report inside the Studio. Sections adapt to the analysis available in the dataset."],
  ["Data quality", "Review missing values, duplicates, inconsistencies, date issues and outliers before applying changes."],
  ["Compare datasets", "Use two compatible versions of a file to identify added, removed, modified and unchanged records."],
  ["Forecasting", "Forecasts require a usable time field and numeric target with enough historical observations."],
];

export default function SupportPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">SUPPORT</span><h1>Help with Data Studio.</h1><p>Start with the common topics below. If you still need help, contact Azhan through the public portfolio.</p></section>
    <section className="marketingSection"><div className="marketingSupportGrid">{help.map(([title,copy])=><article key={title}><strong>{title}</strong><p>{copy}</p></article>)}</div><div className="marketingSupportContact"><div><span>STILL NEED HELP?</span><h2>Contact Azhan</h2><p>Include what you were trying to do, the screen you were on and any error message you received. Do not send confidential datasets unless a secure method has been agreed.</p></div><a className="marketingSecondaryButton" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Contact via Portfolio ↗</a></div></section>
    <section className="marketingSupportBand"><div><span>SUPPORT THE DEVELOPER</span><h2>Enjoy using Azhan Data Studio?</h2><p>Data Studio is independently developed and maintained. If it saves you time or helps you understand your data, you can support continued development with a one-time contribution.</p></div><a className="marketingPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">Support Data Studio ↗</a></section>
  </MarketingShell>;
}
