"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ToolPdfReport, ToolPdfSection, printToolReport } from "../components/tool-report";

type WorkbookSheet = { index: number; name: string; rows: number; columns: number; analysis_ready: boolean; classification: string; recommended: boolean; };
type WorkbookInfo = { filename: string; file_size_bytes: number; sheet_count: number; recommended_sheet?: string | null; sheets: WorkbookSheet[]; };
type ScenarioDataset = { filename: string; file_type: string; file_size_bytes: number; rows: number; columns: number; sheet_name?: string | null; };
type MetricCandidate = { field: string; non_null: number; unique_values: number; sum: number; mean: number; minimum: number; maximum: number; score: number; };
type DimensionCandidate = { field: string; unique_values: number; missing: number; score: number; };
type ScenarioPreparation = {
  rows: number; columns: number; metric_candidates: MetricCandidate[]; dimension_candidates: DimensionCandidate[];
  recommended_metric_a?: string | null; recommended_metric_b?: string | null; recommended_dimension?: string | null; ready: boolean; dataset: ScenarioDataset;
};
type ScenarioCase = { name: string; metric_a: number; metric_b?: number | null; target: number; delta: number; delta_percent?: number | null; };
type SensitivityCase = { metric_a_impact: number; metric_b_impact?: number | null; interaction: number; total_change: number; };
type ScenarioSegment = { group: string; rows: number; base: number; upside: number; downside: number; upside_delta: number; downside_delta: number; };
type ScenarioResult = {
  dataset: ScenarioDataset;
  configuration: {
    metric_a: string; metric_b?: string | null; calculation: string; calculation_label: string; aggregation_a: string; aggregation_b: string;
    dimension?: string | null; output_unit: "number" | "percent";
  };
  assumptions: { upside: { metric_a_percent: number; metric_b_percent: number }; downside: { metric_a_percent: number; metric_b_percent: number } };
  baseline: { metric_a: number; metric_b?: number | null; target: number };
  scenarios: ScenarioCase[];
  sensitivity: { upside: SensitivityCase; downside: SensitivityCase };
  segments: ScenarioSegment[];
  highlights: Array<{ type: string; title: string; detail: string }>;
  method: string; caveat: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const MAX_BYTES = 20 * 1024 * 1024;

function formatNumber(value: number, digits = 0) { return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value); }
function formatSigned(value: number, digits = 1) { return `${value > 0 ? "+" : ""}${formatNumber(value, digits)}`; }
function formatPercent(value: number | null | undefined, digits = 1) { if (value == null || Number.isNaN(value)) return "—"; return `${value > 0 ? "+" : ""}${formatNumber(value, digits)}%`; }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function outputValue(value: number, unit: "number" | "percent") { return unit === "percent" ? `${formatNumber(value, 2)}%` : formatNumber(value, 2); }
function DataStudioMark() { return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span>; }
async function responseError(response: Response) { try { const body = await response.json(); return body?.detail || body?.message || `Request failed (${response.status}).`; } catch { return `Request failed (${response.status}).`; } }

function ScenarioBars({ result }: { result: ScenarioResult }) {
  const maximum = Math.max(...result.scenarios.map((item) => Math.abs(item.target)), 1);
  return (
    <div className="scenarioBars">
      {result.scenarios.map((item) => {
        const width = Math.max(3, (Math.abs(item.target) / maximum) * 100);
        const tone = item.name.toLowerCase();
        return <div className="scenarioBarRow" key={item.name}><div className="scenarioBarLabel"><strong>{item.name}</strong><span>{outputValue(item.target, result.configuration.output_unit)}</span></div><div className="scenarioBarTrack"><span className={tone} style={{ width: `${width}%` }} /></div><small className={item.delta > 0 ? "positive" : item.delta < 0 ? "negative" : ""}>{item.name === "Base" ? "Baseline" : `${formatPercent(item.delta_percent)} vs base`}</small></div>;
      })}
    </div>
  );
}

function SensitivityPanel({ title, data, result }: { title: string; data: SensitivityCase; result: ScenarioResult }) {
  const rows = [
    { label: result.configuration.metric_a, value: data.metric_a_impact },
    ...(result.configuration.metric_b ? [{ label: result.configuration.metric_b, value: data.metric_b_impact ?? 0 }] : []),
    ...(Math.abs(data.interaction) > 1e-9 ? [{ label: "Interaction", value: data.interaction }] : []),
  ];
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return <section className="panel scenarioSensitivityPanel"><div className="scenarioPanelHeader"><div><span className="panelKicker">DRIVER SENSITIVITY</span><h3>{title}</h3><p>Each driver is changed on its own while the other assumptions remain at baseline.</p></div><strong className={data.total_change > 0 ? "positive" : data.total_change < 0 ? "negative" : ""}>{formatSigned(data.total_change, 2)}</strong></div><div className="scenarioSensitivityList">{rows.map((row) => <div key={row.label}><span>{row.label}</span><div className="scenarioSensitivityTrack"><i className={row.value >= 0 ? "positiveBar" : "negativeBar"} style={{ width: `${Math.max(2, Math.abs(row.value) / max * 100)}%` }} /></div><strong className={row.value > 0 ? "positive" : row.value < 0 ? "negative" : ""}>{formatSigned(row.value, 2)}</strong></div>)}</div></section>;
}

export default function ScenarioPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookInfo | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [preparation, setPreparation] = useState<ScenarioPreparation | null>(null);
  const [metricA, setMetricA] = useState("");
  const [metricB, setMetricB] = useState("");
  const [calculation, setCalculation] = useState("difference");
  const [aggregationA, setAggregationA] = useState("sum");
  const [aggregationB, setAggregationB] = useState("sum");
  const [dimension, setDimension] = useState("");
  const [upsideA, setUpsideA] = useState(10);
  const [upsideB, setUpsideB] = useState(5);
  const [downsideA, setDownsideA] = useState(-10);
  const [downsideB, setDownsideB] = useState(0);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState("");

  const needsMetricB = calculation !== "single";
  const metricACandidate = useMemo(() => preparation?.metric_candidates.find((item) => item.field === metricA) ?? null, [preparation, metricA]);
  const metricBCandidate = useMemo(() => preparation?.metric_candidates.find((item) => item.field === metricB) ?? null, [preparation, metricB]);

  function resetResult() { setResult(null); setError(""); }
  function resetAll() { setFile(null); setWorkbook(null); setSheetName(""); setPreparation(null); setMetricA(""); setMetricB(""); setCalculation("difference"); setAggregationA("sum"); setAggregationB("sum"); setDimension(""); setUpsideA(10); setUpsideB(5); setDownsideA(-10); setDownsideB(0); setResult(null); setError(""); }

  async function inspectWorkbook(selectedFile: File) {
    const form = new FormData(); form.append("file", selectedFile);
    const response = await fetch(`${API_URL}/api/datasets/workbook`, { method: "POST", body: form });
    if (!response.ok) throw new Error(await responseError(response));
    const body = await response.json(); return body.workbook as WorkbookInfo;
  }

  async function prepare(selectedFile: File, selectedSheet = "") {
    setLoading(true); setError(""); setPreparation(null); setResult(null);
    try {
      const form = new FormData(); form.append("file", selectedFile); if (selectedSheet) form.append("sheet_name", selectedSheet);
      const response = await fetch(`${API_URL}/api/datasets/scenario/prepare`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as ScenarioPreparation;
      setPreparation(body);
      const a = body.recommended_metric_a ?? body.metric_candidates[0]?.field ?? "";
      const b = body.recommended_metric_b ?? body.metric_candidates.find((item) => item.field !== a)?.field ?? "";
      setMetricA(a); setMetricB(b); setDimension(body.recommended_dimension ?? "");
      setCalculation(body.metric_candidates.length >= 2 ? "difference" : "single");
      if (!body.ready) setError("Scenario Studio needs at least one usable numeric measure.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to prepare this dataset for scenario analysis."); }
    finally { setLoading(false); }
  }

  async function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;
    const extension = selectedFile.name.toLowerCase().split(".").pop();
    if (!extension || !["csv", "xlsx"].includes(extension)) { setError("Scenario Studio supports CSV and XLSX files only."); return; }
    if (selectedFile.size > MAX_BYTES) { setError("Scenario Studio currently supports files up to 20 MB."); return; }
    setFile(selectedFile); setWorkbook(null); setSheetName(""); setPreparation(null); setResult(null); setError("");
    try {
      if (extension === "xlsx") {
        setLoading(true); const info = await inspectWorkbook(selectedFile); setWorkbook(info);
        const recommended = info.recommended_sheet ?? info.sheets.find((sheet) => sheet.analysis_ready)?.name ?? "";
        setSheetName(recommended); setLoading(false); await prepare(selectedFile, recommended);
      } else await prepare(selectedFile);
    } catch (err) { setLoading(false); setError(err instanceof Error ? err.message : "Unable to read this file."); }
  }

  async function changeSheet(nextSheet: string) { setSheetName(nextSheet); if (file) await prepare(file, nextSheet); }

  async function runScenario() {
    if (!file || !metricA || (needsMetricB && !metricB)) return;
    setRunning(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file); form.append("metric_a", metricA); form.append("calculation", calculation); form.append("aggregation_a", aggregationA);
      if (needsMetricB) { form.append("metric_b", metricB); form.append("aggregation_b", aggregationB); }
      form.append("upside_a", String(upsideA)); form.append("upside_b", String(needsMetricB ? upsideB : 0));
      form.append("downside_a", String(downsideA)); form.append("downside_b", String(needsMetricB ? downsideB : 0));
      if (dimension) form.append("dimension", dimension); if (sheetName) form.append("sheet_name", sheetName);
      const response = await fetch(`${API_URL}/api/datasets/scenario`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      setResult(await response.json() as ScenarioResult);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to run this scenario."); }
    finally { setRunning(false); }
  }

  function downloadScenarioCsv() {
    if (!result) return;
    const rows = [["Scenario", "Metric A", "Metric B", "Outcome", "Delta", "Delta Percent"], ...result.scenarios.map((item) => [item.name, item.metric_a, item.metric_b ?? "", item.target, item.delta, item.delta_percent ?? ""])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const href = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = href; anchor.download = "azhan-data-studio-scenario.csv"; anchor.click(); URL.revokeObjectURL(href);
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Azhan Data Studio home"><DataStudioMark /><span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a>
      <div className="topbarActions"><a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer"><span className="creatorLabel">CREATED BY</span><span className="creatorName">Azhan Hassan</span><span className="creatorRole">Data &amp; AI Automation Specialist</span><span className="portfolioCta">View Portfolio ↗</span></a><a className="supportTopButton" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support</a></div>
    </header>

    <nav className="studioModeBar" aria-label="Choose analysis mode"><div className="studioModeInner">
      <a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
      <a className="studioModeTab" href="/monthly"><span className="studioModeIcon">▦</span><span><strong>Monthly Intelligence</strong><small>Append monthly files and track movement</small></span><em>NEW</em></a>
          <a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
      <a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span></a>
      <a className="studioModeTab active" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions before you decide</small></span></a>
      <a className="studioModeTab" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Validate relationships and differences</small></span><em>NEW</em></a>
    </div></nav>

    <section className="scenarioHero"><div className="scenarioHeroInner"><div><span className="panelKicker">SCENARIO STUDIO · WHAT-IF ANALYSIS</span><h1>Model the decision before you make it.</h1><p>Turn business assumptions into transparent Base, Upside and Downside cases. Choose the measures that matter, define how they combine, then see the modelled impact instantly.</p><div className="scenarioTrustRow"><span>Deterministic calculations</span><span>User-controlled assumptions</span><span>No AI-generated numbers</span><span>Up to 20 MB</span></div></div><div className="scenarioHeroPreview" aria-hidden="true"><i className="down">−</i><i className="base">•</i><i className="up">+</i><strong>Downside · Base · Upside</strong><small>Change assumptions → recalculate outcome</small></div></div></section>

    <section className="scenarioShell">
      <div className="scenarioStepHeading"><span>01</span><div><small>SELECT DATA</small><h2>Upload the dataset behind the decision</h2><p>Choose a CSV or XLSX file with at least one numeric business measure.</p></div></div>
      <section className="panel scenarioUploadPanel"><button type="button" className={`scenarioDropzone ${file ? "hasFile" : ""}`} onClick={() => inputRef.current?.click()}><input ref={inputRef} type="file" hidden accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event: ChangeEvent<HTMLInputElement>) => { void chooseFile(event.target.files?.[0]); event.target.value = ""; }} /><span className="scenarioUploadIcon">↑</span><span><strong>{file ? file.name : "Choose CSV or Excel file"}</strong><small>{file ? `${formatBytes(file.size)} · click to replace` : "CSV / XLSX · maximum 20 MB"}</small></span></button>{workbook && <label className="scenarioSheetField"><span>Workbook sheet</span><select value={sheetName} onChange={(event) => void changeSheet(event.target.value)}>{workbook.sheets.filter((sheet) => sheet.analysis_ready).map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name} · {formatNumber(sheet.rows)} rows</option>)}</select></label>}{loading && <div className="scenarioStatus">Reading measures and possible scenario dimensions…</div>}{preparation && <div className="scenarioFileMeta"><span>{formatNumber(preparation.dataset.rows)} rows</span><span>{preparation.dataset.columns} fields</span><span>{preparation.metric_candidates.length} numeric measures</span><span>{preparation.dimension_candidates.length} segment fields</span></div>}</section>

      {preparation?.ready && <>
        <div className="scenarioStepHeading"><span>02</span><div><small>DEFINE MODEL</small><h2>Tell Data Studio how the outcome is calculated</h2><p>Use one measure directly, or combine two measures into a difference, ratio, product or margin percentage.</p></div></div>
        <section className="panel scenarioConfigPanel"><div className="scenarioConfigGrid">
          <label><span>Calculation</span><select value={calculation} onChange={(event) => { const next = event.target.value; setCalculation(next); resetResult(); }}><option value="single">Single metric</option><option value="difference">Metric A − Metric B</option><option value="ratio">Metric A ÷ Metric B (%)</option><option value="product">Metric A × Metric B</option><option value="margin_percent">Margin % = (A − B) ÷ A</option></select><small>Defines the outcome you want to stress-test</small></label>
          <label><span>Metric A</span><select value={metricA} onChange={(event) => { const next = event.target.value; setMetricA(next); if (metricB === next) setMetricB(preparation.metric_candidates.find((item) => item.field !== next)?.field ?? ""); resetResult(); }}>{preparation.metric_candidates.map((item) => <option key={item.field} value={item.field}>{item.field}{item.field === preparation.recommended_metric_a ? " · Recommended" : ""}</option>)}</select><small>{metricACandidate ? `Sum ${formatNumber(metricACandidate.sum, 1)} · Mean ${formatNumber(metricACandidate.mean, 1)}` : "Choose a measure"}</small></label>
          <label><span>Metric A aggregation</span><select value={aggregationA} onChange={(event) => { setAggregationA(event.target.value); resetResult(); }}><option value="sum">Sum</option><option value="mean">Average</option></select><small>How Metric A is reduced to the baseline</small></label>
          {needsMetricB && <label><span>Metric B</span><select value={metricB} onChange={(event) => { setMetricB(event.target.value); resetResult(); }}>{preparation.metric_candidates.filter((item) => item.field !== metricA).map((item) => <option key={item.field} value={item.field}>{item.field}{item.field === preparation.recommended_metric_b ? " · Recommended" : ""}</option>)}</select><small>{metricBCandidate ? `Sum ${formatNumber(metricBCandidate.sum, 1)} · Mean ${formatNumber(metricBCandidate.mean, 1)}` : "Choose the second measure"}</small></label>}
          {needsMetricB && <label><span>Metric B aggregation</span><select value={aggregationB} onChange={(event) => { setAggregationB(event.target.value); resetResult(); }}><option value="sum">Sum</option><option value="mean">Average</option></select><small>How Metric B is reduced to the baseline</small></label>}
          <label><span>Breakdown dimension</span><select value={dimension} onChange={(event) => { setDimension(event.target.value); resetResult(); }}><option value="">No segment breakdown</option>{preparation.dimension_candidates.map((item) => <option key={item.field} value={item.field}>{item.field} · {item.unique_values} groups</option>)}</select><small>Optional view of where scenario movement is largest</small></label>
        </div></section>

        <div className="scenarioStepHeading"><span>03</span><div><small>SET ASSUMPTIONS</small><h2>Define your Upside and Downside cases</h2><p>Enter percentage adjustments to each selected metric. Nothing is predicted or inferred — these are your assumptions.</p></div></div>
        <div className="scenarioAssumptionGrid">
          <section className="panel scenarioAssumptionCard upside"><div><span>UPSIDE CASE</span><strong>What if conditions improve?</strong></div><label><span>{metricA} change</span><div><input type="number" min="-95" max="500" step="1" value={upsideA} onChange={(event) => { setUpsideA(Number(event.target.value)); resetResult(); }} /><b>%</b></div></label>{needsMetricB && <label><span>{metricB} change</span><div><input type="number" min="-95" max="500" step="1" value={upsideB} onChange={(event) => { setUpsideB(Number(event.target.value)); resetResult(); }} /><b>%</b></div></label>}</section>
          <section className="panel scenarioAssumptionCard downside"><div><span>DOWNSIDE CASE</span><strong>What if conditions weaken?</strong></div><label><span>{metricA} change</span><div><input type="number" min="-95" max="500" step="1" value={downsideA} onChange={(event) => { setDownsideA(Number(event.target.value)); resetResult(); }} /><b>%</b></div></label>{needsMetricB && <label><span>{metricB} change</span><div><input type="number" min="-95" max="500" step="1" value={downsideB} onChange={(event) => { setDownsideB(Number(event.target.value)); resetResult(); }} /><b>%</b></div></label>}</section>
          <section className="scenarioRunCard"><span>READY TO MODEL</span><strong>Base → Upside → Downside</strong><p>Data Studio recalculates the outcome and isolates each driver&apos;s effect.</p><button className="scenarioPrimary" onClick={() => void runScenario()} disabled={running}>{running ? "Running scenario…" : "Run what-if analysis"}</button></section>
        </div>
      </>}

      {error && <div className="errorBox scenarioError">{error}</div>}

      {result && <>
        <div className="scenarioStepHeading scenarioResultHeading unifiedDashboardHeading"><span>04</span><div><small>SCENARIO DASHBOARD</small><h2>{result.configuration.calculation_label}</h2><p>Modelled from the selected dataset and your assumptions.</p></div><div className="scenarioResultActions"><button className="pdfReportButton" onClick={() => printToolReport(`Scenario Report - ${result.configuration.calculation_label}`)}>Download PDF Report</button><button onClick={downloadScenarioCsv}>Download scenario CSV</button><button onClick={resetAll}>Analyse another file</button></div></div>
        <div className="scenarioSummaryGrid">{result.scenarios.map((item) => <article className={`scenarioSummaryCard ${item.name.toLowerCase()}`} key={item.name}><span>{item.name.toUpperCase()}</span><strong>{outputValue(item.target, result.configuration.output_unit)}</strong><small className={item.delta > 0 ? "positive" : item.delta < 0 ? "negative" : ""}>{item.name === "Base" ? "Current calculated baseline" : `${formatPercent(item.delta_percent)} · ${formatSigned(item.delta, 2)} vs base`}</small></article>)}<article className="scenarioSummaryCard spread"><span>SCENARIO RANGE</span><strong>{outputValue(Math.abs(result.scenarios[1].target - result.scenarios[2].target), result.configuration.output_unit)}</strong><small>Upside-to-downside spread</small></article></div>

        <section className="panel unifiedMeaningPanel scenarioMeaningPanel">
          <div className="unifiedMeaningMark">◇</div>
          <div className="unifiedMeaningCopy">
            <span className="panelKicker">WHAT THIS MEANS</span>
            <h3>{result.highlights[0]?.title ?? "Your assumptions create a measurable range of outcomes."}</h3>
            <p>{result.highlights[0]?.detail ?? "Compare the Base, Upside and Downside cases to understand how sensitive the selected outcome is to your assumptions."}</p>
            <div className="unifiedMeaningChips">{result.scenarios.map((item) => <span key={item.name}>{item.name}: {outputValue(item.target, result.configuration.output_unit)}</span>)}</div>
          </div>
        </section>

        <section className="panel scenarioOutcomePanel"><div className="scenarioPanelHeader"><div><span className="panelKicker">OUTCOME COMPARISON</span><h3>How far can the outcome move?</h3><p>The same formula is recalculated using your Base, Upside and Downside assumptions.</p></div></div><ScenarioBars result={result} /></section>

        <div className="scenarioHighlightGrid">{result.highlights.map((item) => <article className="panel scenarioHighlightCard" key={item.type}><span className="panelKicker">{item.type.toUpperCase()}</span><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>

        <div className="scenarioSensitivityGrid"><SensitivityPanel title="Upside case" data={result.sensitivity.upside} result={result} /><SensitivityPanel title="Downside case" data={result.sensitivity.downside} result={result} /></div>

        {result.segments.length > 0 && <section className="panel scenarioSegmentPanel"><div className="scenarioPanelHeader"><div><span className="panelKicker">SEGMENT VIEW</span><h3>Where the assumptions create the largest movement</h3><p>Top {result.configuration.dimension} groups ranked by absolute modelled change.</p></div></div><div className="scenarioTableWrap"><table className="scenarioTable"><thead><tr><th>{result.configuration.dimension}</th><th>Rows</th><th>Base</th><th>Upside</th><th>Δ Upside</th><th>Downside</th><th>Δ Downside</th></tr></thead><tbody>{result.segments.map((item) => <tr key={item.group}><td><strong>{item.group}</strong></td><td>{formatNumber(item.rows)}</td><td>{outputValue(item.base, result.configuration.output_unit)}</td><td>{outputValue(item.upside, result.configuration.output_unit)}</td><td className={item.upside_delta > 0 ? "positive" : item.upside_delta < 0 ? "negative" : ""}>{formatSigned(item.upside_delta, 2)}</td><td>{outputValue(item.downside, result.configuration.output_unit)}</td><td className={item.downside_delta > 0 ? "positive" : item.downside_delta < 0 ? "negative" : ""}>{formatSigned(item.downside_delta, 2)}</td></tr>)}</tbody></table></div></section>}

        <div className="scenarioMethodNote"><strong>Method</strong><span>{result.method}</span><strong>Important</strong><span>{result.caveat}</span></div>

        <ToolPdfReport
          tool="Scenario / What-If"
          title={result.configuration.calculation_label}
          subtitle="Base, Upside and Downside outcomes calculated directly from your selected measures and assumptions."
          dataset={result.dataset.filename}
          sheet={result.dataset.sheet_name}
          metrics={[
            ...result.scenarios.map((item) => ({ label: item.name, value: outputValue(item.target, result.configuration.output_unit), detail: item.name === "Base" ? "Current calculated baseline" : `${formatPercent(item.delta_percent)} vs base` })),
            { label: "Scenario range", value: outputValue(Math.abs(result.scenarios[1].target - result.scenarios[2].target), result.configuration.output_unit), detail: "Upside-to-downside spread" },
            { label: "Primary metric", value: result.configuration.metric_a, detail: `${result.configuration.aggregation_a} aggregation` },
            { label: "Breakdown", value: result.configuration.dimension || "None", detail: result.configuration.dimension ? `${result.segments.length} groups modelled` : "Overall scenario only" },
          ].slice(0, 6)}
          methodology={result.method}
          caveat={result.caveat}
        >
          <ToolPdfSection eyebrow="Executive summary" title="Decision range">
            <div className="toolPdfFindingList">{result.highlights.slice(0, 6).map((item, index) => <article key={`${item.type}-${index}`}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}</div>
          </ToolPdfSection>
          <ToolPdfSection eyebrow="Assumptions" title="What changed in each case">
            <table className="toolPdfTable"><thead><tr><th>Driver</th><th>Upside</th><th>Downside</th></tr></thead><tbody>
              <tr><td><strong>{result.configuration.metric_a}</strong></td><td>{formatPercent(result.assumptions.upside.metric_a_percent)}</td><td>{formatPercent(result.assumptions.downside.metric_a_percent)}</td></tr>
              {result.configuration.metric_b && <tr><td><strong>{result.configuration.metric_b}</strong></td><td>{formatPercent(result.assumptions.upside.metric_b_percent)}</td><td>{formatPercent(result.assumptions.downside.metric_b_percent)}</td></tr>}
            </tbody></table>
          </ToolPdfSection>
          <ToolPdfSection eyebrow="Scenario outcomes" title="Base, Upside and Downside">
            <table className="toolPdfTable"><thead><tr><th>Scenario</th><th>Outcome</th><th>Change</th><th>Change %</th></tr></thead><tbody>
              {result.scenarios.map((item) => <tr key={item.name}><td><strong>{item.name}</strong></td><td>{outputValue(item.target, result.configuration.output_unit)}</td><td>{formatSigned(item.delta, 2)}</td><td>{item.name === "Base" ? "—" : formatPercent(item.delta_percent)}</td></tr>)}
            </tbody></table>
          </ToolPdfSection>
          {result.segments.length > 0 && <ToolPdfSection eyebrow="Segment view" title={`Largest modelled movements by ${result.configuration.dimension}`}>
            <table className="toolPdfTable"><thead><tr><th>{result.configuration.dimension}</th><th>Base</th><th>Upside</th><th>Δ Upside</th><th>Downside</th><th>Δ Downside</th></tr></thead><tbody>
              {result.segments.slice(0, 12).map((item) => <tr key={item.group}><td><strong>{item.group}</strong></td><td>{outputValue(item.base, result.configuration.output_unit)}</td><td>{outputValue(item.upside, result.configuration.output_unit)}</td><td>{formatSigned(item.upside_delta, 2)}</td><td>{outputValue(item.downside, result.configuration.output_unit)}</td><td>{formatSigned(item.downside_delta, 2)}</td></tr>)}
            </tbody></table>
          </ToolPdfSection>}
        </ToolPdfReport>
      </>}

      <section className="supportLanding" id="support"><div><span className="panelKicker">INDEPENDENTLY BUILT</span><strong>Did Azhan Data Studio save you time?</strong><p>The studio stays free to use. If it helped you analyse, compare, forecast or model a decision, you can support continued development with a one-time contribution.</p></div>{SUPPORT_URL ? <a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support development</a> : <span className="supportPending">Stripe support link coming soon</span>}</section>
    </section>
  </main>;
}
