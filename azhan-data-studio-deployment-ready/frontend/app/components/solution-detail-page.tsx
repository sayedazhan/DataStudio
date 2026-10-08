import MarketingShell from "./marketing-shell";
import { SITE_NAME, SITE_URL } from "../lib/seo";

type LinkItem = { href: string; title: string; copy: string };
type QuestionItem = { title: string; copy: string };

type SolutionDetailProps = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  questions: QuestionItem[];
  exampleFields: string[];
  outputs: string[];
  workflow: { title: string; copy: string }[];
  related: LinkItem[];
  faqs: { q: string; a: string }[];
};

export default function SolutionDetailPage({
  slug,
  eyebrow,
  title,
  description,
  intro,
  questions,
  exampleFields,
  outputs,
  workflow,
  related,
  faqs,
}: SolutionDetailProps) {
  const url = `${SITE_URL}/solutions/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        inLanguage: "en-AU",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE_URL}/solutions` },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  };

  return <MarketingShell>
    <section className="marketingPageHero centered">
      <span className="marketingEyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="marketingHeroActions">
        <a className="marketingPrimaryButton large" href="/studio">Analyse Your Data →</a>
        <a className="marketingSecondaryButton large" href="/reports">See Reporting Studio</a>
      </div>
    </section>

    <section className="marketingSection">
      <div className="marketingSectionHead">
        <span>WHAT YOU CAN ANSWER</span>
        <h2>Move from spreadsheet rows to useful business questions.</h2>
        <p>{intro}</p>
      </div>
      <div className="marketingBrandingGrid">
        {questions.map((item, index) => <article key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
          <p>{item.copy}</p>
        </article>)}
      </div>
    </section>

    <section className="marketingSplitBand">
      <div>
        <span>EXAMPLE DATA</span>
        <h2>Use the Excel or CSV files you already have.</h2>
        <p>Data Studio works from structured tabular data. A typical file for this workflow might contain fields such as:</p>
      </div>
      <div className="marketingCheckList">
        {exampleFields.map(field => <span key={field}>✓ {field}</span>)}
      </div>
    </section>

    <section className="marketingSection">
      <div className="marketingSectionHead">
        <span>WORKFLOW</span>
        <h2>From upload to decision-ready output.</h2>
        <p>Use the same underlying data across profiling, visual analysis and reporting rather than rebuilding the analysis in separate tools.</p>
      </div>
      <div className="marketingReportTypeGrid">
        {workflow.map((item, index) => <article key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
          <p>{item.copy}</p>
        </article>)}
      </div>
    </section>

    <section className="marketingSplitBand">
      <div>
        <span>OUTPUTS</span>
        <h2>What Data Studio can produce.</h2>
        <p>The exact output adapts to the fields available in your dataset, so the workspace prioritises useful analysis instead of forcing empty charts.</p>
      </div>
      <div className="marketingCheckList">
        {outputs.map(output => <span key={output}>✓ {output}</span>)}
      </div>
    </section>

    <section className="marketingSection">
      <div className="marketingSectionHead row">
        <div><span>RELATED TOOLS</span><h2>Go deeper when the question changes.</h2><p>Use the focused Data Studio tools for quality, dashboards, comparison, forecasting and reporting.</p></div>
        <a href="/features">Explore all features →</a>
      </div>
      <div className="marketingCapabilityGrid">
        {related.map((item, index) => <a href={item.href} key={item.href}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
          <p>{item.copy}</p>
          <em>Explore →</em>
        </a>)}
      </div>
    </section>

    <section className="marketingSection">
      <div className="marketingSectionHead"><span>FAQ</span><h2>Common questions</h2></div>
      <div className="seoFaqList">
        {faqs.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
      </div>
    </section>

    <section className="marketingFinalCta">
      <span>TRY IT WITH YOUR OWN DATA</span>
      <h2>Upload an Excel or CSV file and start exploring.</h2>
      <p>No account is required for the current public Data Studio workflow.</p>
      <a className="marketingPrimaryButton large" href="/studio">Launch Data Studio →</a>
    </section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </MarketingShell>;
}
