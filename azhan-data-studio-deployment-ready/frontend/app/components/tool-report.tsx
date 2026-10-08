"use client";

import type { ReactNode } from "react";

type PdfMetric = { label: string; value: string; detail?: string };
type PdfBarItem = { label: string; value: number; display?: string; detail?: string };
type PdfSeriesPoint = { label: string; value: number; kind?: "actual" | "forecast" };
type PdfScatterPoint = { x: number; y: number };

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
        <div className="toolPdfCoverGrid">
          <div className="toolPdfTitleBlock">
            <span>{tool}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <div className="toolPdfMeta">
              <span><b>Dataset</b>{dataset}</span>
              {sheet && <span><b>Sheet</b>{sheet}</span>}
              <span><b>Generated</b>{generated}</span>
            </div>
          </div>
          <div className="toolPdfCoverVisual" aria-hidden="true">
            <div className="toolPdfCoverChartBars"><i/><i/><i/><i/><i/></div>
            <svg viewBox="0 0 180 78" role="presentation"><polyline points="5,61 34,52 62,56 91,35 121,42 151,18 175,24"/><circle cx="151" cy="18" r="4"/></svg>
            <div className="toolPdfCoverMiniKpis"><span><b>KPIs</b>Automated</span><span><b>Charts</b>Adaptive</span><span><b>Insights</b>Decision-ready</span></div>
          </div>
        </div>
      </header>

      <section className="toolPdfMetrics">
        {metrics.slice(0, 8).map((metric) => (
          <article key={`${metric.label}-${metric.value}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            {metric.detail && <small>{metric.detail}</small>}
          </article>
        ))}
      </section>

      <div className="toolPdfBody">{children}</div>

      <section className="toolPdfWhiteLabel">
        <div className="toolPdfWhiteLabelIcon">A</div>
        <div><span>WHITE-LABEL REPORTING</span><strong>Need your own branding?</strong><p>Company-branded and white-label reports are available with your own name, logo and report identity.</p></div>
        <a href="/contact#white-label">Contact Azhan</a>
      </section>

      {(methodology || caveat) && (
        <section className="toolPdfMethod">
          <span>METHOD &amp; INTERPRETATION</span>
          {methodology && <p><strong>Method.</strong> {methodology}</p>}
          {caveat && <p><strong>Important.</strong> {caveat}</p>}
        </section>
      )}

      <footer className="toolPdfFooter">
        <span><b>Azhan Data Studio</b> · Automated Data Intelligence · azhandatastudio.com</span>
        <span>White-label reports: contact Azhan · {generated}</span>
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

export function ToolPdfBars({ items, valueLabel = "Value" }: { items: PdfBarItem[]; valueLabel?: string }) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return <div className="toolPdfBars" aria-label={valueLabel}>
    {items.map((item) => <div className="toolPdfBarRow" key={`${item.label}-${item.display ?? item.value}`}>
      <span>{item.label}</span>
      <div><i style={{ width: `${Math.max(3, Math.abs(item.value) / max * 100)}%` }} /></div>
      <strong>{item.display ?? new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 }).format(item.value)}</strong>
      {item.detail && <small>{item.detail}</small>}
    </div>)}
  </div>;
}

export function ToolPdfSeriesChart({ points }: { points: PdfSeriesPoint[] }) {
  if (!points.length) return null;
  const width = 720, height = 190, padX = 28, padY = 22;
  const values = points.map((point) => point.value);
  const min = Math.min(...values), max = Math.max(...values);
  const spread = Math.max(max - min, Math.abs(max) * 0.05, 1);
  const x = (index: number) => padX + (points.length === 1 ? 0 : index / (points.length - 1) * (width - padX * 2));
  const y = (value: number) => height - padY - ((value - min) / spread) * (height - padY * 2);
  const actualIndexes = points.map((point, index) => ({ point, index })).filter(({ point }) => point.kind !== "forecast");
  const forecastIndexes = points.map((point, index) => ({ point, index })).filter(({ point }) => point.kind === "forecast");
  const actualPoints = actualIndexes.map(({ point, index }) => `${x(index)},${y(point.value)}`).join(" ");
  const bridgeStart = actualIndexes.at(-1);
  const forecastPoints = [...(bridgeStart ? [bridgeStart] : []), ...forecastIndexes].map(({ point, index }) => `${x(index)},${y(point.value)}`).join(" ");
  return <div className="toolPdfSeriesChart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend chart">
      {[0.25,0.5,0.75].map((ratio) => <line key={ratio} x1={padX} x2={width-padX} y1={padY+(height-padY*2)*ratio} y2={padY+(height-padY*2)*ratio} className="grid"/>)}
      {actualPoints && <polyline points={actualPoints} className="actual"/>}
      {forecastPoints && <polyline points={forecastPoints} className="forecast"/>}
      {points.map((point,index) => <circle key={`${point.label}-${index}`} cx={x(index)} cy={y(point.value)} r="3" className={point.kind === "forecast" ? "forecastDot" : "actualDot"}/>)}
    </svg>
    <div className="toolPdfSeriesAxis">{points.filter((_, index) => index === 0 || index === points.length-1 || index % Math.max(1, Math.ceil(points.length/6)) === 0).map((point) => <span key={point.label}>{point.label}</span>)}</div>
  </div>;
}

export function ToolPdfScatter({ points }: { points: PdfScatterPoint[] }) {
  if (!points.length) return null;
  const width = 720, height = 190, pad = 24;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(maxX-minX,1), spanY = Math.max(maxY-minY,1);
  return <div className="toolPdfScatter"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Relationship scatter plot">
    {[0.25,0.5,0.75].map((ratio) => <g key={ratio}><line x1={pad} x2={width-pad} y1={pad+(height-pad*2)*ratio} y2={pad+(height-pad*2)*ratio} className="grid"/><line y1={pad} y2={height-pad} x1={pad+(width-pad*2)*ratio} x2={pad+(width-pad*2)*ratio} className="grid"/></g>)}
    {points.slice(0,180).map((point,index) => <circle key={index} cx={pad+((point.x-minX)/spanX)*(width-pad*2)} cy={height-pad-((point.y-minY)/spanY)*(height-pad*2)} r="3.2"/>)}
  </svg></div>;
}

export function ToolPdfRangeBand({ minimum, q1, median, q3, maximum }: { minimum: number; q1: number; median: number; q3: number; maximum: number }) {
  const span = Math.max(maximum-minimum,1);
  const pct = (value:number) => Math.max(0, Math.min(100, ((value-minimum)/span)*100));
  return <div className="toolPdfRangeBand">
    <div className="toolPdfRangeTrack"><span className="box" style={{ left:`${pct(q1)}%`, width:`${Math.max(2,pct(q3)-pct(q1))}%` }}/><i className="median" style={{ left:`${pct(median)}%` }}/></div>
    <div className="toolPdfRangeLabels"><span>Min<br/><b>{minimum.toLocaleString("en-AU",{maximumFractionDigits:2})}</b></span><span>Q1<br/><b>{q1.toLocaleString("en-AU",{maximumFractionDigits:2})}</b></span><span>Median<br/><b>{median.toLocaleString("en-AU",{maximumFractionDigits:2})}</b></span><span>Q3<br/><b>{q3.toLocaleString("en-AU",{maximumFractionDigits:2})}</b></span><span>Max<br/><b>{maximum.toLocaleString("en-AU",{maximumFractionDigits:2})}</b></span></div>
  </div>;
}
