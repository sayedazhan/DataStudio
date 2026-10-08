import { PORTFOLIO_URL, SUPPORT_URL } from "../lib/config";
import { CREATOR_NAME, CREATOR_URL, SITE_NAME, SITE_URL } from "../lib/seo";

type GuideStep = { title: string; description: string };
type GuideSection = { heading: string; paragraphs: string[]; bullets?: string[] };
type GuideFaq = { question: string; answer: string };
type RelatedLink = { href: string; title: string; description: string };
type ExampleTable = { title: string; description: string; headers: string[]; rows: string[][]; takeaway?: string };

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  pagePath: string;
  toolHref: string;
  toolLabel: string;
  steps: GuideStep[];
  sections: GuideSection[];
  example?: ExampleTable;
  faqs: GuideFaq[];
  relatedLinks: RelatedLink[];
};

function DataStudioMark() {
  return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span>;
}

export function SeoGuidePage({ eyebrow, title, lead, pagePath, toolHref, toolLabel, steps, sections, example, faqs, relatedLinks }: Props) {
  const pageUrl = `${SITE_URL}${pagePath}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: title,
        description: lead,
        mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
        author: { "@type": "Person", name: CREATOR_NAME, url: CREATOR_URL },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        datePublished: "2026-10-08",
        dateModified: "2026-10-08",
        inLanguage: "en-AU",
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-AU",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Tools & Guides", item: `${SITE_URL}/features` },
          { "@type": "ListItem", position: 3, name: title, item: pageUrl },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${pageUrl}#howto`,
        name: title,
        description: lead,
        step: steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.description,
        })),
      },
    ],
  };

  return <main className="seoFeaturePage seoGuidePage">
    <header className="topbar seoTopbar">
      <a className="brand" href="/" aria-label={`${SITE_NAME} home`}><DataStudioMark /><span className="brandText"><strong>{SITE_NAME}</strong><small>Automated Data Intelligence</small></span></a>
      <div className="seoHeaderActions"><a className="seoHeaderLink" href="/features">Tools & Guides</a><a className="seoHeaderLink" href="/">Open Studio</a>{SUPPORT_URL ? <a className="supportTopButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support</a> : null}</div>
    </header>

    <article>
      <section className="seoGuideHero">
        <div><span className="panelKicker">{eyebrow}</span><h1>{title}</h1><p>{lead}</p><div className="seoFeatureActions"><a className="seoPrimaryCta" href={toolHref}>{toolLabel}</a><a className="seoSecondaryCta" href="/features">Explore all tools</a></div></div>
        <aside className="seoGuideSummary"><span>QUICK ANSWER</span><strong>{steps.length} practical steps</strong><p>Use the checklist below, then try the workflow with your own CSV or Excel file in Azhan Data Studio.</p></aside>
      </section>

      <section className="seoContentSection seoGuideStepsSection">
        <div className="seoSectionHeading"><span className="panelKicker">STEP BY STEP</span><h2>How to do it</h2></div>
        <div className="seoSteps">{steps.map((step, index) => <article key={step.title}><b>{index + 1}</b><div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>
      </section>

      {sections.map((section) => <section className="seoGuideBodySection" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}

      {example ? <section className="seoGuideBodySection seoGuideExample"><span className="panelKicker">WORKED EXAMPLE</span><h2>{example.title}</h2><p>{example.description}</p><div className="seoTableWrap"><table><thead><tr>{example.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{example.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>{example.takeaway ? <p className="seoGuideTakeaway"><strong>What this tells you:</strong> {example.takeaway}</p> : null}</section> : null}

      <section className="seoContentSection seoRelatedSection">
        <div className="seoSectionHeading"><span className="panelKicker">RELATED</span><h2>Keep exploring</h2></div>
        <div className="seoDiscoveryGrid seoRelatedGrid">{relatedLinks.map((link) => <a className="seoDiscoveryCard" href={link.href} key={link.href}><span>EXPLORE</span><strong>{link.title}</strong><small>{link.description}</small></a>)}</div>
      </section>

      <section className="seoContentSection seoFaqSection"><div className="seoSectionHeading"><span className="panelKicker">FAQ</span><h2>Common questions</h2></div><div className="seoFaqList">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>

      <section className="seoFinalCta"><div><span className="panelKicker">TRY IT FREE</span><h2>Use the guide with your own data.</h2><p>Upload a CSV or Excel file to Azhan Data Studio and move from raw spreadsheet to evidence faster.</p></div><a className="seoPrimaryCta" href={toolHref}>{toolLabel}</a></section>
    </article>

    <footer className="seoFooter"><div><strong>{SITE_NAME}</strong><span>Independently built by <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Azhan Hassan</a>.</span></div><div><a href="/">Home</a><a href="/features">Tools & Guides</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </main>;
}
