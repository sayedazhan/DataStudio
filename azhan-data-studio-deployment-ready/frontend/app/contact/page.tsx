import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import ContactEnquiryForm from "../components/contact-enquiry-form";
import { LINKEDIN_URL, PORTFOLIO_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Azhan Data Studio",
  description: "Contact Azhan about Data Studio, custom dashboards, white-label reporting, workflow automation, product feedback, partnerships or technical support.",
  path: "/contact",
  keywords: ["contact Azhan Data Studio", "custom Excel dashboard", "white label data reporting", "Excel automation service", "custom data analysis"],
});

const topics = [
  ["White-Label Reporting", "Use your own company name, logo, colours and report identity.", "/white-label-reports"],
  ["Custom Dashboard", "Discuss a tailored dashboard or recurring business reporting requirement.", "#business-enquiry"],
  ["Workflow Automation", "Discuss repetitive Excel, reporting or data-handling work that could be automated.", "#business-enquiry"],
  ["Technical Support", "Something not working? Start with the support page and troubleshooting guidance.", "/support"],
];

export default function ContactPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">CONTACT</span><h1>What can we help with?</h1><p>Use Data Studio free for self-service analysis, or get in touch about a custom dashboard, white-label reporting, workflow automation, business use case or product issue.</p></section>
    <section className="marketingSection"><div className="marketingContactGrid">{topics.map(([title,copy,href],i)=><a id={i===0?"white-label":undefined} href={href} key={title}><span>{String(i+1).padStart(2,"0")}</span><strong>{title}</strong><p>{copy}</p><em>Continue →</em></a>)}</div></section>

    <section className="marketingContactPanel marketingContactPanelForm" id="business-enquiry">
      <div><span>BUSINESS / CUSTOM ENQUIRY</span><h2>Tell Azhan what you are trying to achieve.</h2><p>Share the business problem, the type of data you work with and the output you need. Do not include confidential datasets in this form.</p><div className="marketingDirectLinks"><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Portfolio ↗</a><a href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div>
      <ContactEnquiryForm />
    </section>
  </MarketingShell>;
}
