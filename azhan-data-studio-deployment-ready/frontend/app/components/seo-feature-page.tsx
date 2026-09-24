import { PORTFOLIO_URL, SUPPORT_URL } from "../lib/config";
import { SITE_NAME, SITE_URL } from "../lib/seo";

type FeaturePoint = { title: string; description: string };
type Step = { title: string; description: string };
type Faq = { question: string; answer: string };

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  toolHref: string;
  toolLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  highlights: string[];
  features: FeaturePoint[];
  steps: Step[];
  useCases: string[];
  faqs: Faq[];
  pagePath: string;
};

function DataStudioMark() {
  return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span>;
}

export function SeoFeaturePage({ eyebrow, title, lead, toolHref, toolLabel, secondaryHref, secondaryLabel, highlights, features, steps, useCases, faqs, pagePath }: Props) {
  const pageUrl = `${SITE_URL}${pagePath}`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-AU",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Azhan Data Studio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/features` },
          { "@type": "ListItem", position: 3, name: title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="seoFeaturePage">
      <header className="topbar seoTopbar">
        <a className="brand" href="/" aria-label={`${SITE_NAME} home`}><DataStudioMark /><span className="brandText"><strong>{SITE_NAME}</strong><small>Automated Data Intelligence</small></span></a>
        <div className="seoHeaderActions">
          <a className="seoHeaderLink" href="/">Open Studio</a>
          {SUPPORT_URL ? <a className="supportTopButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support</a> : null}
        </div>
      </header>

      <section className="seoFeatureHero">
        <div className="seoFeatureHeroCopy">
          <span className="panelKicker">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
          <div className="seoFeatureActions">
            <a className="seoPrimaryCta" href={toolHref}>{toolLabel}</a>
            {secondaryHref && secondaryLabel ? <a className="seoSecondaryCta" href={secondaryHref}>{secondaryLabel}</a> : null}
          </div>
          <div className="seoHighlightRow">{highlights.map((item) => <span key={item}>✓ {item}</span>)}</div>
        </div>
        <aside className="seoFeaturePreview" aria-label="Azhan Data Studio workflow">
          <span>HOW IT WORKS</span>
          <strong>Upload → Analyse → Understand → Act</strong>
          <div className="seoPreviewGrid">
            <article><b>01</b><small>Upload CSV or Excel</small></article>
            <article><b>02</b><small>Automatic checks</small></article>
            <article><b>03</b><small>Evidence & visuals</small></article>
            <article><b>04</b><small>Export or continue</small></article>
          </div>
        </aside>
      </section>

      <section className="seoContentSection">
        <div className="seoSectionHeading"><span className="panelKicker">WHAT YOU CAN DO</span><h2>Built for practical data work, not dashboard setup.</h2></div>
        <div className="seoFeatureGrid">{features.map((feature, index) => <article key={feature.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div>
      </section>

      <section className="seoContentSection seoStepsSection">
        <div className="seoSectionHeading"><span className="panelKicker">WORKFLOW</span><h2>A straightforward path from raw file to useful output.</h2></div>
        <div className="seoSteps">{steps.map((step, index) => <article key={step.title}><b>{index + 1}</b><div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>
      </section>

      <section className="seoContentSection seoUseCasesSection">
        <div className="seoSectionHeading"><span className="panelKicker">USE CASES</span><h2>Useful when you need a fast answer from everyday business data.</h2></div>
        <div className="seoUseCases">{useCases.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="seoContentSection seoFaqSection">
        <div className="seoSectionHeading"><span className="panelKicker">FAQ</span><h2>Common questions</h2></div>
        <div className="seoFaqList">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="seoFinalCta">
        <div><span className="panelKicker">TRY IT FREE</span><h2>Ready to work with your own data?</h2><p>Open Azhan Data Studio, upload a CSV or Excel file and use the tool directly in your browser.</p></div>
        <a className="seoPrimaryCta" href={toolHref}>{toolLabel}</a>
      </section>

      <footer className="seoFooter">
        <div><strong>{SITE_NAME}</strong><span>Independently built by <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Azhan Hassan</a>.</span></div>
        <div><a href="/">Home</a><a href="/clean">Clean Data</a><a href="/compare">Compare</a><a href="/forecast">Forecast</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a>{SUPPORT_URL ? <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Support</a> : null}</div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }} />
    </main>
  );
}
