import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
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
      <form name="data-studio-contact" method="POST" data-netlify="true" action="/thanks/contact" className="marketingContactForm">
        <input type="hidden" name="form-name" value="data-studio-contact" />
      <p className="marketingBotField" aria-hidden="true"><label>Leave this field empty <input name="bot-field" /></label></p>
        <label><span>Name</span><input name="name" type="text" autoComplete="name" required placeholder="Your name" /></label>
        <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
        <label><span>Company <em>optional</em></span><input name="company" type="text" autoComplete="organization" placeholder="Company name" /></label>
        <label><span>Enquiry type</span><select name="enquiry-type" defaultValue="custom-dashboard"><option value="custom-dashboard">Custom dashboard</option><option value="white-label">White-label reporting</option><option value="automation">Workflow automation</option><option value="data-analysis">Custom data analysis</option><option value="business-use">Business / team use</option><option value="product-feedback">Product feedback</option><option value="technical-support">Technical support</option><option value="other">Other</option></select></label>
        <label className="full"><span>What are you trying to achieve?</span><textarea name="message" rows={5} required placeholder="Describe the current process, the data you work with and the outcome you need." /></label>
        <button className="marketingPrimaryButton" type="submit">Send Enquiry →</button>
      </form>
    </section>
  </MarketingShell>;
}
