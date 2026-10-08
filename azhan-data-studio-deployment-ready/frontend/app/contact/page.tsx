import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import { LINKEDIN_URL, PORTFOLIO_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Azhan Data Studio",
  description: "Contact Azhan about Data Studio, white-label reporting, custom analysis, product feedback, partnerships or technical support.",
  path: "/contact",
  keywords: ["contact Azhan Data Studio", "white label data reporting contact", "custom data analysis"],
});

const topics = [
  ["White-Label Reporting", "Use your own company name, logo, colours and report identity.", "/white-label-reports"],
  ["Custom Data Analysis", "Discuss a complex dataset, analysis requirement or business reporting need.", PORTFOLIO_URL],
  ["Product / Business Enquiry", "Discuss using Data Studio within your organisation or a potential collaboration.", PORTFOLIO_URL],
  ["Technical Support", "Something not working? Start with the support page and troubleshooting guidance.", "/support"],
];

export default function ContactPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">CONTACT</span><h1>What can we help with?</h1><p>Choose the area that best matches your enquiry. For white-label reporting and business enquiries, include your use case, dataset type and desired output when you contact Azhan.</p></section>
    <section className="marketingSection"><div className="marketingContactGrid">{topics.map(([title,copy,href],i)=><a id={i===0?"white-label":undefined} href={href} key={title} target={href.startsWith("http")?"_blank":undefined} rel={href.startsWith("http")?"noreferrer":undefined}><span>{String(i+1).padStart(2,"0")}</span><strong>{title}</strong><p>{copy}</p><em>Continue →</em></a>)}</div></section>
    <section className="marketingContactPanel" id="pro"><div><span>DIRECT CHANNELS</span><h2>Contact Azhan</h2><p>Use the public portfolio or LinkedIn profile to get in touch about commercial enquiries, partnerships, product feedback or Data Studio Pro interest.</p></div><div className="marketingHeroActions"><a className="marketingPrimaryButton" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Portfolio / Contact ↗</a><a className="marketingSecondaryButton" href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn ↗</a></div></section>
  </MarketingShell>;
}
