"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ToolPdfReport, ToolPdfSection, printToolReport } from "../components/tool-report";

type WorkbookSheet = { index: number; name: string; rows: number; columns: number; analysis_ready: boolean; classification: string; recommended: boolean; };
type WorkbookInfo = { filename: string; file_size_bytes: number; sheet_count: number; recommended_sheet?: string | null; sheets: WorkbookSheet[]; };
type DatasetMeta = { filename: string; file_type: string; file_size_bytes: number; rows: number; columns: number; sheet_name?: string | null; };
type NumericCandidate = { field: string; non_null: number; missing: number; unique_values: number; mean: number; median: number; std_dev: number; minimum: number; maximum: number; score: number; };
type CategoryCandidate = { field: string; unique_values: number; missing: number; score: number; top_values: Array<{ value: string; count: number }>; };
type StatisticsPreparation = {
  rows: number; columns: number; numeric_candidates: NumericCandidate[]; categorical_candidates: CategoryCandidate[];
  recommended_numeric?: string | null; recommended_numeric_b?: string | null; recommended_group?: string | null; recommended_category_b?: string | null;
  available_modes: string[]; ready: boolean; dataset: DatasetMeta;
};
type SummaryResult = {
  mode: "summary"; field: string; dataset: DatasetMeta; interpretation: string; method: string; caveat: string;
  summary: { n: number; mean: number; median: number; std_dev: number; variance: number; minimum: number; q1: number; q3: number; maximum: number; sum: number; standard_error: number; confidence_level: number; confidence_interval: { lower: number; upper: number }; skewness: number; kurtosis: number; iqr: number; outlier_count: number; outlier_percent: number; coefficient_of_variation_percent?: number | null; shape: string; };
};
type CorrelationResult = {
  mode: "correlation"; field_a: string; field_b: string; n: number; dataset: DatasetMeta; interpretation: string; method: string; caveat: string;
  pearson: { r: number; p_value: number; r_squared: number; label: string; significance: string };
  spearman: { rho: number; p_value: number; label: string; significance: string };
  scatter: Array<{ x: number; y: number }>;
};
type GroupResult = {
  mode: "group_comparison"; numeric_field: string; group_field: string; dataset: DatasetMeta; interpretation: string; method: string; caveat: string;
  groups: Array<{ group: string; n: number; mean: number; median: number; std_dev: number; ci_lower: number; ci_upper: number }>;
  result: { test: string; test_name: string; statistic: number; p_value: number; effect_size: number; effect_metric: string; effect_label: string; difference: number; significance: string };
};
type CategoryResult = {
  mode: "categorical_association"; field_a: string; field_b: string; n: number; dataset: DatasetMeta; interpretation: string; method: string; caveat: string;
  rows: string[]; columns: string[]; table: Array<{ row: string; counts: Array<{ column: string; count: number }>; total: number }>;
  result: { chi_square: number; p_value: number; degrees_of_freedom: number; cramers_v: number; effect_label: string; significance: string; low_expected_cells: number; expected_cells: number };
};
type StatisticsResult = SummaryResult | CorrelationResult | GroupResult | CategoryResult;

type Evidence = { label: string; short: string; tone: "good" | "mid" | "weak"; explanation: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const MAX_BYTES = 20 * 1024 * 1024;

function DataStudioMark() { return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span>; }
function formatNumber(value: number, digits = 1) { return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value); }
function formatP(value: number) { if (value < 0.001) return "<0.001"; if (value < 0.01) return value.toFixed(4); return value.toFixed(3); }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
async function responseError(response: Response) { try { const body = await response.json(); return body?.detail || body?.message || `Request failed (${response.status}).`; } catch { return `Request failed (${response.status}).`; } }

function evidenceFromP(p: number): Evidence {
  if (p < 0.001) return { label: "Very strong evidence", short: "Very strong", tone: "good", explanation: "The pattern is very unlikely to be explained by random variation alone in this sample." };
  if (p < 0.01) return { label: "Strong evidence", short: "Strong", tone: "good", explanation: "The pattern has strong statistical support in this sample." };
  if (p < 0.05) return { label: "Good evidence", short: "Good", tone: "good", explanation: "There is enough statistical evidence to treat the pattern as meaningful in this sample." };
  if (p < 0.10) return { label: "Some evidence", short: "Some", tone: "mid", explanation: "There is a signal, but the evidence is not strong enough to be confident yet." };
  return { label: "Weak evidence", short: "Weak", tone: "weak", explanation: "The observed pattern could reasonably be due to normal random variation in this sample." };
}
function relationshipStrength(value: number) {
  const a = Math.abs(value);
  if (a < 0.10) return "Almost none";
  if (a < 0.30) return "Weak";
  if (a < 0.50) return "Moderate";
  if (a < 0.70) return "Strong";
  return "Very strong";
}
function relationshipDirection(value: number) { return value > 0.08 ? "Moves together" : value < -0.08 ? "Moves opposite" : "No clear direction"; }
function practicalSize(label: string) { return label === "Negligible" ? "Very small" : label; }
function shapePlain(shape: string) {
  if (shape.includes("right-skewed")) return "A few high values pull the average upward";
  if (shape.includes("left-skewed")) return "A few low values pull the average downward";
  return "Values are fairly balanced around the middle";
}

function TechnicalDetails({ result }: { result: StatisticsResult }) {
  return <details className="statisticsTechnical"><summary>View technical statistical details</summary><div>
    {result.mode === "summary" && <div className="statisticsTechnicalGrid">
      <span><b>Confidence interval</b>{formatNumber(result.summary.confidence_interval.lower,2)} to {formatNumber(result.summary.confidence_interval.upper,2)}</span>
      <span><b>Standard deviation</b>{formatNumber(result.summary.std_dev,2)}</span>
      <span><b>Standard error</b>{formatNumber(result.summary.standard_error,2)}</span>
      <span><b>Skewness</b>{formatNumber(result.summary.skewness,2)}</span>
      <span><b>Kurtosis</b>{formatNumber(result.summary.kurtosis,2)}</span>
      <span><b>IQR</b>{formatNumber(result.summary.iqr,2)}</span>
    </div>}
    {result.mode === "correlation" && <div className="statisticsTechnicalGrid">
      <span><b>Pearson r</b>{result.pearson.r.toFixed(3)}</span><span><b>Pearson p-value</b>{formatP(result.pearson.p_value)}</span><span><b>R²</b>{formatNumber(result.pearson.r_squared,3)}</span><span><b>Spearman ρ</b>{result.spearman.rho.toFixed(3)}</span><span><b>Spearman p-value</b>{formatP(result.spearman.p_value)}</span><span><b>Paired rows</b>{formatNumber(result.n,0)}</span>
    </div>}
    {result.mode === "group_comparison" && <div className="statisticsTechnicalGrid">
      <span><b>Test used</b>{result.result.test_name}</span><span><b>Test statistic</b>{formatNumber(result.result.statistic,3)}</span><span><b>p-value</b>{formatP(result.result.p_value)}</span><span><b>Effect measure</b>{result.result.effect_metric}</span><span><b>Effect value</b>{formatNumber(result.result.effect_size,3)}</span><span><b>Groups</b>{result.groups.length}</span>
    </div>}
    {result.mode === "categorical_association" && <div className="statisticsTechnicalGrid">
      <span><b>Chi-square</b>{formatNumber(result.result.chi_square,3)}</span><span><b>p-value</b>{formatP(result.result.p_value)}</span><span><b>Degrees of freedom</b>{result.result.degrees_of_freedom}</span><span><b>Cramér&apos;s V</b>{formatNumber(result.result.cramers_v,3)}</span><span><b>Low expected cells</b>{result.result.low_expected_cells}/{result.result.expected_cells}</span><span><b>Rows used</b>{formatNumber(result.n,0)}</span>
    </div>}
    <div className="statisticsMethodRows"><p><strong>How Data Studio calculated it</strong>{result.method}</p><p><strong>Keep in mind</strong>{result.caveat}</p></div>
  </div></details>;
}

function ScatterPlot({ points, xLabel, yLabel }: { points: Array<{ x: number; y: number }>; xLabel: string; yLabel: string }) {
  if (!points.length) return null;
  const width = 760, height = 300, left = 58, right = 28, top = 24, bottom = 48;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minX === maxX) { minX -= 1; maxX += 1; } if (minY === maxY) { minY -= 1; maxY += 1; }
  const px = (x: number) => left + ((x - minX) / (maxX - minX)) * (width - left - right);
  const py = (y: number) => top + (1 - (y - minY) / (maxY - minY)) * (height - top - bottom);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length; const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const numerator = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
  const denominator = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  const slope = denominator ? numerator / denominator : 0; const intercept = meanY - slope * meanX;
  return <div className="statisticsScatter"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${xLabel} versus ${yLabel} scatter plot`}>
    {[0, .25, .5, .75, 1].map((tick) => <line key={tick} x1={left} x2={width-right} y1={top + tick*(height-top-bottom)} y2={top + tick*(height-top-bottom)} className="statisticsGridLine" />)}
    <line x1={px(minX)} y1={py(intercept+slope*minX)} x2={px(maxX)} y2={py(intercept+slope*maxX)} className="statisticsFitLine" />
    {points.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r="3.2" className="statisticsPoint" />)}
    <text x={width/2} y={height-10} textAnchor="middle" className="statisticsAxisLabel">{xLabel}</text>
    <text x="14" y={height/2} transform={`rotate(-90 14 ${height/2})`} textAnchor="middle" className="statisticsAxisLabel">{yLabel}</text>
  </svg></div>;
}

function SummaryView({ result }: { result: SummaryResult }) {
  const s = result.summary;
  const spread = s.coefficient_of_variation_percent == null ? "—" : `${formatNumber(s.coefficient_of_variation_percent,1)}%`;
  const q1Pos = s.maximum === s.minimum ? 25 : ((s.q1-s.minimum)/(s.maximum-s.minimum))*100;
  const q3Pos = s.maximum === s.minimum ? 75 : ((s.q3-s.minimum)/(s.maximum-s.minimum))*100;
  const medPos = s.maximum === s.minimum ? 50 : ((s.median-s.minimum)/(s.maximum-s.minimum))*100;
  return <section className="statisticsDashboard unifiedDashboardSurface">
    <div className="statisticsDashboardTop"><div><span className="panelKicker">STATISTICS DASHBOARD</span><h2>Understand {result.field}</h2><p>A simple view of the typical value, spread and unusual observations.</p></div><span className="statisticsDashboardBadge">{formatNumber(s.n,0)} usable rows</span></div>
    <div className="statisticsKpiGrid friendly">
      <article><span>AVERAGE</span><strong>{formatNumber(s.mean,2)}</strong><small>The arithmetic average</small></article>
      <article><span>TYPICAL VALUE</span><strong>{formatNumber(s.median,2)}</strong><small>The middle observation</small></article>
      <article><span>TYPICAL SPREAD</span><strong>{spread}</strong><small>Variation relative to the average</small></article>
      <article><span>UNUSUAL VALUES</span><strong>{formatNumber(s.outlier_count,0)}</strong><small>{formatNumber(s.outlier_percent,1)}% of usable rows</small></article>
    </div>
    <div className="statisticsDashboardGrid">
      <article className="panel statisticsVisualCard"><div className="statisticsCardHeader"><div><span className="panelKicker">WHERE VALUES SIT</span><h3>Range and middle 50%</h3></div><span>{formatNumber(s.minimum,1)} → {formatNumber(s.maximum,1)}</span></div><div className="statisticsRangeVisual"><div className="statisticsRangeLabels"><span>{formatNumber(s.minimum,1)}</span><span>{formatNumber(s.maximum,1)}</span></div><div className="statisticsRangeTrack"><i className="statisticsRangeBox" style={{left:`${Math.max(0,q1Pos)}%`,width:`${Math.max(2,q3Pos-q1Pos)}%`}}/><b className="statisticsMedianMark" style={{left:`${Math.min(100,Math.max(0,medPos))}%`}}/></div><div className="statisticsRangeLegend"><span>Q1 {formatNumber(s.q1,1)}</span><strong>Middle {formatNumber(s.median,1)}</strong><span>Q3 {formatNumber(s.q3,1)}</span></div></div><div className="statisticsMiniFacts"><span><b>{formatNumber(s.confidence_level*100,0)}% likely average range</b>{formatNumber(s.confidence_interval.lower,2)} to {formatNumber(s.confidence_interval.upper,2)}</span><span><b>Distribution shape</b>{shapePlain(s.shape)}</span></div></article>
      <article className="panel statisticsMeaningCard"><span className="panelKicker">WHAT THIS MEANS</span><h3>{shapePlain(s.shape)}.</h3><p>The average is <strong>{formatNumber(s.mean,2)}</strong> and the middle value is <strong>{formatNumber(s.median,2)}</strong>. Based on this sample, the underlying average is likely to sit between <strong>{formatNumber(s.confidence_interval.lower,2)}</strong> and <strong>{formatNumber(s.confidence_interval.upper,2)}</strong> at the selected confidence level.</p><div className="statisticsMeaningList"><span><i>1</i>{formatNumber(s.outlier_count,0)} unusual values deserve a quick check.</span><span><i>2</i>The middle 50% runs from {formatNumber(s.q1,2)} to {formatNumber(s.q3,2)}.</span></div></article>
    </div>
    <TechnicalDetails result={result}/>
  </section>;
}

function CorrelationView({ result }: { result: CorrelationResult }) {
  const evidence = evidenceFromP(result.pearson.p_value);
  const strength = relationshipStrength(result.pearson.r);
  const direction = relationshipDirection(result.pearson.r);
  return <section className="statisticsDashboard unifiedDashboardSurface">
    <div className="statisticsDashboardTop"><div><span className="panelKicker">STATISTICS DASHBOARD</span><h2>Do {result.field_a} and {result.field_b} move together?</h2><p>See the direction, strength and evidence behind the relationship.</p></div><span className={`statisticsDashboardBadge ${evidence.tone}`}>{evidence.label}</span></div>
    <div className="statisticsKpiGrid friendly"><article><span>RELATIONSHIP</span><strong className="statisticsTextKpi">{strength}</strong><small>{direction}</small></article><article><span>SHARED MOVEMENT</span><strong>{formatNumber(result.pearson.r_squared*100,1)}%</strong><small>How much straight-line movement overlaps</small></article><article><span>EVIDENCE</span><strong className="statisticsTextKpi">{evidence.short}</strong><small>{evidence.explanation}</small></article><article><span>ROWS COMPARED</span><strong>{formatNumber(result.n,0)}</strong><small>Paired usable observations</small></article></div>
    <div className="statisticsDashboardGrid"><article className="panel statisticsVisualCard"><div className="statisticsCardHeader"><div><span className="panelKicker">RELATIONSHIP VIEW</span><h3>{result.field_a} vs {result.field_b}</h3></div><span>{direction}</span></div><ScatterPlot points={result.scatter} xLabel={result.field_a} yLabel={result.field_b}/></article><article className="panel statisticsMeaningCard"><span className="panelKicker">WHAT THIS MEANS</span><h3>{strength} relationship · {direction.toLowerCase()}.</h3><p>When <strong>{result.field_a}</strong> changes, <strong>{result.field_b}</strong> tends to {result.pearson.r >= 0 ? "move in the same direction" : "move in the opposite direction"}. About <strong>{formatNumber(result.pearson.r_squared*100,1)}%</strong> of the straight-line movement is shared in this sample.</p><div className="statisticsEvidenceStrip"><span>Evidence level</span><strong>{evidence.label}</strong><i className={evidence.tone}/></div><p className="statisticsPlainCaveat">This shows association, not cause. Another factor may be influencing both measures.</p></article></div>
    <TechnicalDetails result={result}/>
  </section>;
}

function GroupView({ result }: { result: GroupResult }) {
  const evidence = evidenceFromP(result.result.p_value);
  const sorted = [...result.groups].sort((a,b)=>b.mean-a.mean);
  const high = sorted[0], low = sorted[sorted.length-1];
  const values = result.groups.map((g) => g.mean); let min = Math.min(...values), max = Math.max(...values); if (min === max) { min -= 1; max += 1; }
  return <section className="statisticsDashboard unifiedDashboardSurface"><div className="statisticsDashboardTop"><div><span className="panelKicker">STATISTICS DASHBOARD</span><h2>Are {result.group_field} groups really different?</h2><p>Compare {result.numeric_field} across groups and see whether the gap is meaningful.</p></div><span className={`statisticsDashboardBadge ${evidence.tone}`}>{evidence.label}</span></div>
    <div className="statisticsKpiGrid friendly"><article><span>HIGHEST AVERAGE</span><strong className="statisticsTextKpi">{high?.group ?? "—"}</strong><small>{high ? formatNumber(high.mean,2) : "—"}</small></article><article><span>LOWEST AVERAGE</span><strong className="statisticsTextKpi">{low?.group ?? "—"}</strong><small>{low ? formatNumber(low.mean,2) : "—"}</small></article><article><span>GAP</span><strong>{formatNumber(Math.abs(result.result.difference),2)}</strong><small>Highest vs lowest / reported difference</small></article><article><span>PRACTICAL SIZE</span><strong className="statisticsTextKpi">{practicalSize(result.result.effect_label)}</strong><small>How large the difference is in practice</small></article></div>
    <div className="statisticsDashboardGrid"><article className="panel statisticsVisualCard"><div className="statisticsCardHeader"><div><span className="panelKicker">GROUP AVERAGES</span><h3>{result.numeric_field} by {result.group_field}</h3></div><span>{result.groups.length} groups</span></div><div className="statisticsGroupList">{result.groups.map((group)=><div key={group.group}><div className="statisticsGroupLabel"><strong>{group.group}</strong><span>{formatNumber(group.n,0)} rows · likely average {formatNumber(group.ci_lower,1)}–{formatNumber(group.ci_upper,1)}</span></div><div className="statisticsGroupTrack"><i style={{width:`${Math.max(5,((group.mean-min)/(max-min))*92+5)}%`}}/></div><strong>{formatNumber(group.mean,2)}</strong></div>)}</div></article><article className="panel statisticsMeaningCard"><span className="panelKicker">WHAT THIS MEANS</span><h3>{evidence.label} that the group averages differ.</h3><p><strong>{high?.group}</strong> has the highest average at <strong>{high ? formatNumber(high.mean,2) : "—"}</strong>, while <strong>{low?.group}</strong> is lowest at <strong>{low ? formatNumber(low.mean,2) : "—"}</strong>. The practical size of the difference is <strong>{practicalSize(result.result.effect_label).toLowerCase()}</strong>.</p><div className="statisticsEvidenceStrip"><span>Evidence level</span><strong>{evidence.label}</strong><i className={evidence.tone}/></div><p className="statisticsPlainCaveat">A difference can be statistically supported but still too small to matter operationally, so Data Studio shows both evidence and practical size.</p></article></div>
    <TechnicalDetails result={result}/>
  </section>;
}

function CategoryView({ result }: { result: CategoryResult }) {
  const evidence = evidenceFromP(result.result.p_value);
  const lowPct = result.result.expected_cells ? (result.result.low_expected_cells/result.result.expected_cells)*100 : 0;
  const reliability = lowPct <= 20 ? "Good" : lowPct <= 40 ? "Use caution" : "Low";
  return <section className="statisticsDashboard unifiedDashboardSurface"><div className="statisticsDashboardTop"><div><span className="panelKicker">STATISTICS DASHBOARD</span><h2>Are {result.field_a} and {result.field_b} connected?</h2><p>See whether the mix of one category changes meaningfully with the other.</p></div><span className={`statisticsDashboardBadge ${evidence.tone}`}>{evidence.label}</span></div>
    <div className="statisticsKpiGrid friendly"><article><span>CONNECTION STRENGTH</span><strong className="statisticsTextKpi">{practicalSize(result.result.effect_label)}</strong><small>How strongly the category mix differs</small></article><article><span>EVIDENCE</span><strong className="statisticsTextKpi">{evidence.short}</strong><small>{evidence.explanation}</small></article><article><span>ROWS USED</span><strong>{formatNumber(result.n,0)}</strong><small>Observations included in the test</small></article><article><span>TEST RELIABILITY</span><strong className="statisticsTextKpi">{reliability}</strong><small>{result.result.low_expected_cells}/{result.result.expected_cells} sparse cells</small></article></div>
    <div className="statisticsDashboardGrid"><article className="panel statisticsVisualCard"><div className="statisticsCardHeader"><div><span className="panelKicker">CATEGORY MIX</span><h3>{result.field_a} × {result.field_b}</h3></div><span>{result.rows.length} × {result.columns.length}</span></div><div className="statisticsTableWrap"><table className="statisticsTable"><thead><tr><th>{result.field_a}</th>{result.columns.map((column)=><th key={column}>{column}</th>)}<th>Total</th></tr></thead><tbody>{result.table.map((row)=><tr key={row.row}><td><strong>{row.row}</strong></td>{row.counts.map((cell)=><td key={cell.column}>{formatNumber(cell.count,0)}</td>)}<td><strong>{formatNumber(row.total,0)}</strong></td></tr>)}</tbody></table></div></article><article className="panel statisticsMeaningCard"><span className="panelKicker">WHAT THIS MEANS</span><h3>{practicalSize(result.result.effect_label)} connection with {evidence.short.toLowerCase()} evidence.</h3><p>The distribution of <strong>{result.field_b}</strong> changes across <strong>{result.field_a}</strong> categories enough to show a <strong>{practicalSize(result.result.effect_label).toLowerCase()}</strong> connection in this sample.</p><div className="statisticsEvidenceStrip"><span>Evidence level</span><strong>{evidence.label}</strong><i className={evidence.tone}/></div><p className="statisticsPlainCaveat">This tells you the categories are associated. It does not tell you that one category causes the other.</p></article></div>
    <TechnicalDetails result={result}/>
  </section>;
}


function StatisticsPdfReport({ result }: { result: StatisticsResult }) {
  if (result.mode === "summary") {
    const s = result.summary;
    return <ToolPdfReport tool="Statistics" title={`Understand ${result.field}`} subtitle={result.interpretation} dataset={result.dataset.filename} sheet={result.dataset.sheet_name} metrics={[
      { label: "Average", value: formatNumber(s.mean, 2) }, { label: "Typical value", value: formatNumber(s.median, 2) },
      { label: "Likely average range", value: `${formatNumber(s.confidence_interval.lower, 2)}–${formatNumber(s.confidence_interval.upper, 2)}`, detail: `${formatNumber(s.confidence_level * 100, 0)}% confidence` },
      { label: "Unusual values", value: formatNumber(s.outlier_count, 0), detail: `${formatNumber(s.outlier_percent, 1)}% of usable rows` },
      { label: "Usable rows", value: formatNumber(s.n, 0) }, { label: "Shape", value: shapePlain(s.shape) },
    ]} methodology={result.method} caveat={result.caveat}>
      <ToolPdfSection eyebrow="Plain-English conclusion" title="What the distribution tells you"><p>{result.interpretation}</p></ToolPdfSection>
      <ToolPdfSection eyebrow="Distribution summary" title="Range, middle and variation"><div className="toolPdfTwoCol"><div><div className="toolPdfKeyValue"><span>Minimum</span><strong>{formatNumber(s.minimum,2)}</strong></div><div className="toolPdfKeyValue"><span>Q1</span><strong>{formatNumber(s.q1,2)}</strong></div><div className="toolPdfKeyValue"><span>Median</span><strong>{formatNumber(s.median,2)}</strong></div></div><div><div className="toolPdfKeyValue"><span>Q3</span><strong>{formatNumber(s.q3,2)}</strong></div><div className="toolPdfKeyValue"><span>Maximum</span><strong>{formatNumber(s.maximum,2)}</strong></div><div className="toolPdfKeyValue"><span>Std. deviation</span><strong>{formatNumber(s.std_dev,2)}</strong></div></div></div></ToolPdfSection>
    </ToolPdfReport>;
  }
  if (result.mode === "correlation") {
    const evidence = evidenceFromP(result.pearson.p_value);
    return <ToolPdfReport tool="Statistics" title={`${result.field_a} vs ${result.field_b}`} subtitle={result.interpretation} dataset={result.dataset.filename} sheet={result.dataset.sheet_name} metrics={[
      { label: "Relationship", value: relationshipStrength(result.pearson.r), detail: relationshipDirection(result.pearson.r) },
      { label: "Shared movement", value: `${formatNumber(result.pearson.r_squared*100,1)}%` }, { label: "Evidence", value: evidence.short },
      { label: "Rows compared", value: formatNumber(result.n,0) }, { label: "Pearson r", value: result.pearson.r.toFixed(3) }, { label: "p-value", value: formatP(result.pearson.p_value) },
    ]} methodology={result.method} caveat={result.caveat}>
      <ToolPdfSection eyebrow="Plain-English conclusion" title="Do the measures move together?"><p>{result.interpretation}</p></ToolPdfSection>
      <ToolPdfSection eyebrow="Evidence" title="Relationship details"><div className="toolPdfTwoCol"><div><div className="toolPdfKeyValue"><span>Pearson relationship</span><strong>{result.pearson.label}</strong></div><div className="toolPdfKeyValue"><span>Evidence</span><strong>{evidence.label}</strong></div></div><div><div className="toolPdfKeyValue"><span>Spearman relationship</span><strong>{result.spearman.label}</strong></div><div className="toolPdfKeyValue"><span>Spearman ρ</span><strong>{result.spearman.rho.toFixed(3)}</strong></div></div></div></ToolPdfSection>
    </ToolPdfReport>;
  }
  if (result.mode === "group_comparison") {
    const evidence = evidenceFromP(result.result.p_value); const sorted=[...result.groups].sort((a,b)=>b.mean-a.mean); const high=sorted[0], low=sorted[sorted.length-1];
    return <ToolPdfReport tool="Statistics" title={`${result.numeric_field} by ${result.group_field}`} subtitle={result.interpretation} dataset={result.dataset.filename} sheet={result.dataset.sheet_name} metrics={[
      { label:"Highest average", value:high?.group??"—", detail:high?formatNumber(high.mean,2):"—" }, { label:"Lowest average", value:low?.group??"—", detail:low?formatNumber(low.mean,2):"—" },
      { label:"Gap", value:formatNumber(Math.abs(result.result.difference),2) }, { label:"Practical size", value:practicalSize(result.result.effect_label) }, { label:"Evidence", value:evidence.short }, { label:"Groups", value:String(result.groups.length) },
    ]} methodology={result.method} caveat={result.caveat}>
      <ToolPdfSection eyebrow="Plain-English conclusion" title="Are the groups really different?"><p>{result.interpretation}</p></ToolPdfSection>
      <ToolPdfSection eyebrow="Group evidence" title="Average by group"><table className="toolPdfTable"><thead><tr><th>Group</th><th>Rows</th><th>Average</th><th>Likely average range</th></tr></thead><tbody>{result.groups.map((g)=><tr key={g.group}><td><strong>{g.group}</strong></td><td>{formatNumber(g.n,0)}</td><td>{formatNumber(g.mean,2)}</td><td>{formatNumber(g.ci_lower,2)}–{formatNumber(g.ci_upper,2)}</td></tr>)}</tbody></table></ToolPdfSection>
    </ToolPdfReport>;
  }
  const evidence = evidenceFromP(result.result.p_value);
  return <ToolPdfReport tool="Statistics" title={`${result.field_a} and ${result.field_b}`} subtitle={result.interpretation} dataset={result.dataset.filename} sheet={result.dataset.sheet_name} metrics={[
    { label:"Connection size", value:practicalSize(result.result.effect_label) }, { label:"Evidence", value:evidence.short }, { label:"Rows used", value:formatNumber(result.n,0) }, { label:"Cramér's V", value:formatNumber(result.result.cramers_v,3) }, { label:"p-value", value:formatP(result.result.p_value) }, { label:"Category combinations", value:String(result.result.expected_cells) },
  ]} methodology={result.method} caveat={result.caveat}>
    <ToolPdfSection eyebrow="Plain-English conclusion" title="Are the categories connected?"><p>{result.interpretation}</p></ToolPdfSection>
    <ToolPdfSection eyebrow="Category evidence" title="Observed counts"><table className="toolPdfTable"><thead><tr><th>{result.field_a}</th>{result.columns.map((c)=><th key={c}>{c}</th>)}<th>Total</th></tr></thead><tbody>{result.table.map((row)=><tr key={row.row}><td><strong>{row.row}</strong></td>{row.counts.map((cell)=><td key={cell.column}>{formatNumber(cell.count,0)}</td>)}<td>{formatNumber(row.total,0)}</td></tr>)}</tbody></table></ToolPdfSection>
  </ToolPdfReport>;
}

export default function StatisticsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null); const [workbook, setWorkbook] = useState<WorkbookInfo | null>(null); const [sheetName, setSheetName] = useState("");
  const [preparation, setPreparation] = useState<StatisticsPreparation | null>(null); const [mode, setMode] = useState("summary");
  const [numericField, setNumericField] = useState(""); const [numericFieldB, setNumericFieldB] = useState(""); const [groupField, setGroupField] = useState("");
  const [categoryFieldA, setCategoryFieldA] = useState(""); const [categoryFieldB, setCategoryFieldB] = useState(""); const [confidence, setConfidence] = useState(0.95);
  const [loading, setLoading] = useState(false); const [running, setRunning] = useState(false); const [result, setResult] = useState<StatisticsResult | null>(null); const [error, setError] = useState("");
  const selectedNumeric = useMemo(() => preparation?.numeric_candidates.find((item) => item.field === numericField), [preparation,numericField]);

  function resetResult() { setResult(null); setError(""); }
  async function inspectWorkbook(selectedFile: File) { const form = new FormData(); form.append("file", selectedFile); const response = await fetch(`${API_URL}/api/datasets/workbook`, { method: "POST", body: form }); if (!response.ok) throw new Error(await responseError(response)); const body = await response.json(); return body.workbook as WorkbookInfo; }
  async function prepare(selectedFile: File, selectedSheet = "") { setLoading(true); setError(""); setPreparation(null); setResult(null); try { const form = new FormData(); form.append("file",selectedFile); if (selectedSheet) form.append("sheet_name",selectedSheet); const response = await fetch(`${API_URL}/api/datasets/statistics/prepare`, { method:"POST",body:form }); if (!response.ok) throw new Error(await responseError(response)); const body = await response.json() as StatisticsPreparation; setPreparation(body); const a=body.recommended_numeric ?? body.numeric_candidates[0]?.field ?? ""; const b=body.recommended_numeric_b ?? body.numeric_candidates.find((item)=>item.field!==a)?.field ?? ""; const g=body.recommended_group ?? body.categorical_candidates[0]?.field ?? ""; const c2=body.recommended_category_b ?? body.categorical_candidates.find((item)=>item.field!==g)?.field ?? ""; setNumericField(a); setNumericFieldB(b); setGroupField(g); setCategoryFieldA(g); setCategoryFieldB(c2); const nextMode=body.available_modes.includes("summary")?"summary":body.available_modes[0]??"summary"; setMode(nextMode); if (!body.ready) setError("This dataset needs at least one usable number field, or two category fields, before Statistics can analyse it."); } catch(err){ setError(err instanceof Error?err.message:"Unable to prepare this dataset for statistical analysis."); } finally { setLoading(false); } }
  async function chooseFile(selectedFile: File | undefined) { if(!selectedFile)return; const extension=selectedFile.name.toLowerCase().split(".").pop(); if(!extension||!["csv","xlsx"].includes(extension)){setError("Statistics supports CSV and XLSX files only.");return;} if(selectedFile.size>MAX_BYTES){setError("Statistics currently supports files up to 20 MB.");return;} setFile(selectedFile); setWorkbook(null); setSheetName(""); setPreparation(null); setResult(null); setError(""); try { if(extension==="xlsx"){setLoading(true); const info=await inspectWorkbook(selectedFile); setWorkbook(info); const recommended=info.recommended_sheet ?? info.sheets.find((s)=>s.analysis_ready)?.name ?? ""; setSheetName(recommended); setLoading(false); await prepare(selectedFile,recommended);} else await prepare(selectedFile); } catch(err){setLoading(false);setError(err instanceof Error?err.message:"Unable to read this file.");} }
  async function changeSheet(next: string){setSheetName(next); if(file) await prepare(file,next);}
  async function runAnalysis(){ if(!file)return; setRunning(true); setError(""); setResult(null); try{ const form=new FormData(); form.append("file",file); form.append("mode",mode); form.append("confidence",String(confidence)); if(sheetName) form.append("sheet_name",sheetName); if(mode==="summary"){form.append("numeric_field",numericField);} if(mode==="correlation"){form.append("numeric_field",numericField); form.append("numeric_field_b",numericFieldB);} if(mode==="group_comparison"){form.append("numeric_field",numericField); form.append("group_field",groupField);} if(mode==="categorical_association"){form.append("category_field_a",categoryFieldA); form.append("category_field_b",categoryFieldB);} const response=await fetch(`${API_URL}/api/datasets/statistics`,{method:"POST",body:form}); if(!response.ok) throw new Error(await responseError(response)); setResult(await response.json() as StatisticsResult);} catch(err){setError(err instanceof Error?err.message:"Unable to run the statistical analysis.");} finally{setRunning(false);} }
  function resetAll(){setFile(null);setWorkbook(null);setSheetName("");setPreparation(null);setResult(null);setError("");}

  const modes=[
    {id:"summary",icon:"1",title:"Understand one measure",desc:"See the average, typical range and unusual values.",technical:"Descriptive statistics"},
    {id:"correlation",icon:"2",title:"Do two measures move together?",desc:"Check whether one tends to rise or fall with the other.",technical:"Correlation"},
    {id:"group_comparison",icon:"3",title:"Are groups really different?",desc:"Compare group averages and see whether the gap is meaningful.",technical:"t-test / ANOVA"},
    {id:"categorical_association",icon:"4",title:"Are two categories connected?",desc:"See whether the category mix changes together.",technical:"Chi-square"},
  ];
  const currentMode = modes.find((item)=>item.id===mode);

  return <main>
    <header className="topbar"><a className="brand" href="/" aria-label="Azhan Data Studio home"><DataStudioMark/><span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a><div className="topbarActions"><a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer"><span className="creatorLabel">CREATED BY</span><span className="creatorName">Azhan Hassan</span><span className="creatorRole">Data &amp; AI Automation Specialist</span><span className="portfolioCta">View Portfolio ↗</span></a><a className="supportTopButton" href={SUPPORT_URL||"#support"} target={SUPPORT_URL?"_blank":undefined} rel={SUPPORT_URL?"noreferrer":undefined}>☕ Support</a></div></header>
    <nav className="studioModeBar" aria-label="Choose analysis mode"><div className="studioModeInner">
      <a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
      <a className="studioModeTab" href="/monthly"><span className="studioModeIcon">▦</span><span><strong>Monthly Intelligence</strong><small>Append monthly files and track movement</small></span><em>NEW</em></a>
          <a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
      <a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span></a>
      <a className="studioModeTab" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions before you decide</small></span></a>
      <a className="studioModeTab active" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Check whether a pattern has real evidence</small></span><em>NEW</em></a>
    </div></nav>
    <section className="statisticsHero"><div className="statisticsHeroInner"><div><span className="panelKicker">STATISTICS DASHBOARD · EVIDENCE MADE SIMPLE</span><h1>Is the pattern real — or just noise?</h1><p>Choose a simple question. Data Studio runs the correct statistical test behind the scenes and gives you the answer in everyday language first. Technical details are still available when you need them.</p><div className="statisticsTrustRow"><span>Plain-English results</span><span>Visual evidence</span><span>Technical details on demand</span><span>No AI-generated numbers</span></div></div><div className="statisticsHeroPreview" aria-hidden="true"><b>95%</b><strong>Clear evidence, explained simply</strong><small>Answer first · statistics underneath</small><div><i/><i/><i/><i/></div></div></div></section>
    <section className="statisticsShell">
      <div className="statisticsStepHeading"><span>01</span><div><small>CHOOSE YOUR DATA</small><h2>What dataset do you want to investigate?</h2><p>Upload a CSV or Excel file. Data Studio will work out which number and category fields can be tested.</p></div></div>
      <section className="panel statisticsUploadPanel"><button type="button" className={`statisticsDropzone ${file?"hasFile":""}`} onClick={()=>inputRef.current?.click()}><input ref={inputRef} type="file" hidden accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event:ChangeEvent<HTMLInputElement>)=>{void chooseFile(event.target.files?.[0]);event.target.value="";}}/><span className="scenarioUploadIcon">↑</span><span><strong>{file?file.name:"Choose CSV or Excel file"}</strong><small>{file?`${formatBytes(file.size)} · click to replace`:"CSV / XLSX · maximum 20 MB"}</small></span></button>{workbook&&<label className="statisticsSheetField"><span>Which Excel sheet?</span><select value={sheetName} onChange={(e)=>void changeSheet(e.target.value)}>{workbook.sheets.filter((s)=>s.analysis_ready).map((s)=><option key={s.name} value={s.name}>{s.name} · {formatNumber(s.rows,0)} rows</option>)}</select></label>}{loading&&<div className="statisticsStatus">Understanding the fields in your dataset…</div>}{preparation&&<div className="statisticsFileMeta"><span>{formatNumber(preparation.dataset.rows,0)} rows</span><span>{preparation.dataset.columns} fields</span><span>{preparation.numeric_candidates.length} number fields</span><span>{preparation.categorical_candidates.length} category fields</span></div>}</section>
      {preparation?.ready&&<section className="statisticsWorkspace">
        <aside className="statisticsQuestionRail"><div className="statisticsRailTitle"><span className="panelKicker">02 · YOUR QUESTION</span><h2>What do you want to find out?</h2><p>Pick the question that sounds closest to what you are trying to understand.</p></div><div className="statisticsModeGrid">{modes.map((item)=>{const enabled=preparation.available_modes.includes(item.id); return <button key={item.id} disabled={!enabled} className={mode===item.id?"active":""} onClick={()=>{setMode(item.id);resetResult();}}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.desc}</small><em>{enabled?item.technical:"Not enough usable fields"}</em></button>;})}</div></aside>
        <div className="statisticsWorkspaceMain">
          <section className="panel statisticsConfigPanel"><div className="statisticsConfigIntro"><div><span className="panelKicker">SET UP THE QUESTION</span><h3>{currentMode?.title}</h3><p>{currentMode?.desc}</p></div>{file&&<button className="statisticsReset compact" onClick={resetAll}>Change dataset</button>}</div><div className="statisticsConfigGrid">
            {(mode==="summary"||mode==="correlation"||mode==="group_comparison")&&<label><span>{mode==="summary"?"Measure to understand":mode==="group_comparison"?"Measure to compare":"First measure"}</span><select value={numericField} onChange={(e)=>{setNumericField(e.target.value);resetResult();}}>{preparation.numeric_candidates.map((item)=><option key={item.field} value={item.field}>{item.field}{item.field===preparation.recommended_numeric?" · Recommended":""}</option>)}</select><small>{selectedNumeric?`Average ${formatNumber(selectedNumeric.mean,1)} across ${formatNumber(selectedNumeric.non_null,0)} usable rows`:"Choose a number field"}</small></label>}
            {mode==="summary"&&<label><span>How sure should we be?</span><select value={String(confidence)} onChange={(e)=>{setConfidence(Number(e.target.value));resetResult();}}><option value="0.90">90% · More flexible</option><option value="0.95">95% · Recommended</option><option value="0.99">99% · More conservative</option></select><small>95% is a common default for business analysis.</small></label>}
            {mode==="correlation"&&<label><span>Second measure</span><select value={numericFieldB} onChange={(e)=>{setNumericFieldB(e.target.value);resetResult();}}>{preparation.numeric_candidates.filter((item)=>item.field!==numericField).map((item)=><option key={item.field} value={item.field}>{item.field}</option>)}</select><small>We will check whether the two measures tend to move together.</small></label>}
            {mode==="group_comparison"&&<label><span>Compare across</span><select value={groupField} onChange={(e)=>{setGroupField(e.target.value);resetResult();}}>{preparation.categorical_candidates.map((item)=><option key={item.field} value={item.field}>{item.field} · {item.unique_values} groups</option>)}</select><small>Example: compare Revenue across Region or Segment.</small></label>}
            {mode==="categorical_association"&&<><label><span>First category</span><select value={categoryFieldA} onChange={(e)=>{setCategoryFieldA(e.target.value);if(categoryFieldB===e.target.value)setCategoryFieldB(preparation.categorical_candidates.find((i)=>i.field!==e.target.value)?.field??"");resetResult();}}>{preparation.categorical_candidates.map((item)=><option key={item.field} value={item.field}>{item.field} · {item.unique_values} values</option>)}</select><small>Example: Segment, Region or Channel.</small></label><label><span>Second category</span><select value={categoryFieldB} onChange={(e)=>{setCategoryFieldB(e.target.value);resetResult();}}>{preparation.categorical_candidates.filter((item)=>item.field!==categoryFieldA).map((item)=><option key={item.field} value={item.field}>{item.field} · {item.unique_values} values</option>)}</select><small>We will check whether the category mixes are connected.</small></label></>}
            <div className="statisticsRunCell"><span>READY</span><strong>Let Data Studio check the evidence</strong><small>The statistical method is chosen automatically. You get a simple answer first and the technical numbers only if you want them.</small><button className="statisticsPrimary" disabled={running} onClick={()=>void runAnalysis()}>{running?"Checking the evidence…":"Show me the evidence"}</button></div>
          </div></section>
          {error&&<div className="errorBox statisticsError">{error}</div>}
          {result&&<><div className="statisticsReportActions"><button className="pdfReportButton" onClick={() => printToolReport("Statistics Report")}>Download PDF Report</button></div>{result.mode==="summary"&&<SummaryView result={result}/>} {result.mode==="correlation"&&<CorrelationView result={result}/>} {result.mode==="group_comparison"&&<GroupView result={result}/>} {result.mode==="categorical_association"&&<CategoryView result={result}/>}<StatisticsPdfReport result={result}/></>}
          {!result&&!error&&<section className="statisticsEmptyDashboard"><span className="statisticsEmptyIcon">▥</span><div><strong>Your statistics dashboard will appear here.</strong><p>Choose the fields above and select <b>Show me the evidence</b>. Data Studio will create KPI cards, a visual explanation and an everyday-language conclusion.</p></div></section>}
        </div>
      </section>}
      {error&&!preparation?.ready&&<div className="errorBox statisticsError">{error}</div>}
      <section className="supportLanding" id="support"><div><span className="panelKicker">INDEPENDENTLY BUILT</span><strong>Did Azhan Data Studio save you time?</strong><p>The studio stays free to use. If it helped you analyse, compare, forecast, simulate or validate a decision, you can support continued development with a one-time contribution.</p></div>{SUPPORT_URL?<a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support development</a>:<span className="supportPending">Stripe support link coming soon</span>}</section>
    </section>
  </main>;
}
