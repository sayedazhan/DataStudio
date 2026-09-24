"use client";

import type { ReactNode } from "react";

type PdfMetric = { label: string; value: string; detail?: string };

export function printToolReport(title: string) {
  if (typeof window === "undefined") return;
  const previousTitle = document.title;
  const cleanup = () => {
    document.body.classList.remove("toolPdfMode");
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  document.body.classList.add("toolPdfMode");
  document.title = `${title} - Azhan Data Studio`;
  window.addEventListener("afterprint", cleanup);
  window.setTimeout(() => window.print(), 60);
  window.setTimeout(() => {
    if (document.body.classList.contains("toolPdfMode")) cleanup();
  }, 30000);
}

export function ToolPdfReport({
  tool,
  title,
  subtitle,
  dataset,
  sheet,
  metrics,
  children,
  methodology,
  caveat,
}: {
  tool: string;
  title: string;
  subtitle: string;
  dataset: string;
  sheet?: string | null;
  metrics: PdfMetric[];
  children: ReactNode;
  methodology?: string;
  caveat?: string;
}) {
  const generated = new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  return (
    <section className="toolPdfReport" aria-hidden="true">
      <header className="toolPdfCover">
        <div className="toolPdfBrandRow">
          <div className="toolPdfLogo">A<span>▥</span></div>
          <div><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></div>
          <em>{tool.toUpperCase()} REPORT</em>
        </div>
        <div className="toolPdfTitleBlock">
          <span>{tool}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="toolPdfMeta">
          <span><b>Dataset</b>{dataset}</span>
          {sheet && <span><b>Sheet</b>{sheet}</span>}
          <span><b>Generated</b>{generated}</span>
        </div>
      </header>

      <section className="toolPdfMetrics">
        {metrics.map((metric) => (
          <article key={`${metric.label}-${metric.value}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            {metric.detail && <small>{metric.detail}</small>}
          </article>
        ))}
      </section>

      <div className="toolPdfBody">{children}</div>

      {(methodology || caveat) && (
        <section className="toolPdfMethod">
          <span>METHOD &amp; INTERPRETATION</span>
          {methodology && <p><strong>Method.</strong> {methodology}</p>}
          {caveat && <p><strong>Important.</strong> {caveat}</p>}
        </section>
      )}

      <footer className="toolPdfFooter">
        <span>Azhan Data Studio · Automated Data Intelligence</span>
        <span>Created by Azhan Hassan · Data &amp; AI Automation Specialist</span>
      </footer>
    </section>
  );
}

export function ToolPdfSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="toolPdfSection">
      <header><span>{eyebrow}</span><h2>{title}</h2></header>
      {children}
    </section>
  );
}
