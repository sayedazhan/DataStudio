"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ToolPdfReport, ToolPdfSection, printToolReport } from "../components/tool-report";

type WorkbookSheet = {
  index: number;
  name: string;
  rows: number;
  columns: number;
  analysis_ready: boolean;
  classification: string;
  recommended: boolean;
};

type WorkbookInfo = {
  filename: string;
  file_size_bytes: number;
  sheet_count: number;
  recommended_sheet?: string | null;
  sheets: WorkbookSheet[];
};

type ForecastDataset = {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  rows: number;
  columns: number;
  sheet_name?: string | null;
};

type DateCandidate = {
  field: string;
  parse_percent: number;
  unique_dates: number;
  min_date: string;
  max_date: string;
  score: number;
  detected_type: string;
};

type MetricCandidate = {
  field: string;
  non_null: number;
  unique_values: number;
  minimum: number;
  maximum: number;
  mean: number;
  score: number;
};

type ForecastPreparation = {
  rows: number;
  columns: number;
  date_candidates: DateCandidate[];
  metric_candidates: MetricCandidate[];
  recommended_date?: string | null;
  recommended_metric?: string | null;
  suggested_frequency: string;
  ready: boolean;
  minimum_history_periods: number;
  dataset: ForecastDataset;
};

type ForecastPoint = {
  date: string;
  value: number;
  lower: number;
  upper: number;
};

type HistoryPoint = {
  date: string;
  value: number;
  fitted: number;
};

type ForecastResult = {
  dataset: ForecastDataset;
  configuration: {
    date_field: string;
    metric_field: string;
    aggregation: "sum" | "mean";
    frequency: string;
    requested_frequency: string;
    horizon: number;
  };
  summary: {
    history_periods: number;
    history_start: string;
    history_end: string;
    latest_actual: number;
    next_forecast: number;
    next_forecast_change_percent?: number | null;
    horizon_end_forecast: number;
    horizon_change_percent?: number | null;
    forecast_average: number;
    forecast_total: number;
  };
  diagnostics: {
    model: string;
    trend_direction: string;
    trend_per_period: number;
    trend_percent_of_mean?: number | null;
    seasonality_detected: boolean;
    seasonal_period?: number | null;
    seasonality_strength_percent: number;
    residual_rmse: number;
    backtest_mape?: number | null;
    backtest_mae?: number | null;
    backtest_periods: number;
    confidence: string;
  };
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  highlights: Array<{ type: string; title: string; detail: string }>;
  method: string;
  caveat: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const MAX_BYTES = 20 * 1024 * 1024;

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value);
}

function formatSigned(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${formatNumber(value, digits)}`;
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${formatNumber(value, digits)}%`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function periodNoun(frequency: string) {
  return ({ daily: "day", weekly: "week", monthly: "month", quarterly: "quarter", yearly: "year" } as Record<string, string>)[frequency] ?? "period";
}

function formatDateLabel(value: string, frequency: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  if (frequency === "yearly") return String(parsed.getFullYear());
  if (frequency === "monthly" || frequency === "quarterly") {
    return new Intl.DateTimeFormat("en-AU", { month: "short", year: "2-digit" }).format(parsed);
  }
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(parsed);
}

function DataStudioMark() {
  return (
    <span className="dataStudioMark" aria-hidden="true">
      <span className="dataStudioA">A</span>
      <span className="dataStudioBars"><i /><i /><i /></span>
    </span>
  );
}

async function responseError(response: Response) {
  try {
    const body = await response.json();
    return body?.detail || body?.message || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

function ForecastChart({ result }: { result: ForecastResult }) {
  const visibleHistory = result.history.slice(-48);
  const historyCount = visibleHistory.length;
  const forecast = result.forecast;
  const totalPoints = historyCount + forecast.length;
  if (totalPoints < 2) return null;

  const width = 980;
  const height = 390;
  const left = 70;
  const right = 28;
  const top = 28;
  const bottom = 58;
  const allValues = [
    ...visibleHistory.map((point) => point.value),
    ...forecast.flatMap((point) => [point.value, point.lower, point.upper]),
  ].filter(Number.isFinite);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad;
  max += pad;
  const x = (index: number) => left + (index / Math.max(totalPoints - 1, 1)) * (width - left - right);
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom);
  const historyPath = visibleHistory.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`).join(" ");
  const fitPath = visibleHistory.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.fitted)}`).join(" ");
  const forecastStartIndex = historyCount - 1;
  const forecastPath = [
    `M ${x(forecastStartIndex)} ${y(visibleHistory[visibleHistory.length - 1].value)}`,
    ...forecast.map((point, index) => `L ${x(historyCount + index)} ${y(point.value)}`),
  ].join(" ");
  const upper = forecast.map((point, index) => `${x(historyCount + index)},${y(point.upper)}`).join(" ");
  const lower = [...forecast].reverse().map((point, reverseIndex) => {
    const originalIndex = forecast.length - 1 - reverseIndex;
    return `${x(historyCount + originalIndex)},${y(point.lower)}`;
  }).join(" ");
  const bandPoints = `${x(forecastStartIndex)},${y(visibleHistory[visibleHistory.length - 1].value)} ${upper} ${lower}`;
  const yTicks = [0, 1, 2, 3, 4].map((index) => min + ((max - min) * index) / 4);
  const labelIndexes = Array.from(new Set([0, Math.floor((historyCount - 1) / 2), historyCount - 1, totalPoints - 1])).filter((index) => index >= 0 && index < totalPoints);
  const dateForIndex = (index: number) => index < historyCount ? visibleHistory[index].date : forecast[index - historyCount].date;

  return (
    <div className="forecastChartWrap">
      <div className="forecastChartLegend"><span><i className="actual" />Actual</span><span><i className="fit" />Fitted trend</span><span><i className="projected" />Forecast</span><span><i className="interval" />95% range</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="forecastSvg" role="img" aria-label={`${result.configuration.metric_field} forecast chart`}>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="forecastGrid" />
            <text x={left - 12} y={y(tick) + 4} textAnchor="end" className="forecastAxisText">{formatNumber(tick, 1)}</text>
          </g>
        ))}
        <rect x={x(historyCount - 1)} y={top} width={Math.max(0, width - right - x(historyCount - 1))} height={height - top - bottom} className="forecastFutureZone" />
        <polygon points={bandPoints} className="forecastBand" />
        <path d={fitPath} className="forecastFitLine" />
        <path d={historyPath} className="forecastActualLine" />
        <path d={forecastPath} className="forecastProjectedLine" />
        {visibleHistory.map((point, index) => <circle key={`a-${point.date}`} cx={x(index)} cy={y(point.value)} r={index === historyCount - 1 ? 4.5 : 2.4} className="forecastActualDot" />)}
        {forecast.map((point, index) => <circle key={`f-${point.date}`} cx={x(historyCount + index)} cy={y(point.value)} r="3.2" className="forecastProjectedDot" />)}
        <line x1={x(historyCount - 1)} x2={x(historyCount - 1)} y1={top} y2={height - bottom} className="forecastDivider" />
        <text x={x(historyCount - 1) + 8} y={top + 16} className="forecastFutureLabel">FORECAST</text>
        {labelIndexes.map((index) => (
          <text key={`x-${index}`} x={x(index)} y={height - 23} textAnchor={index === 0 ? "start" : index === totalPoints - 1 ? "end" : "middle"} className="forecastAxisText">
            {formatDateLabel(dateForIndex(index), result.configuration.frequency)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function ForecastPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookInfo | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [preparation, setPreparation] = useState<ForecastPreparation | null>(null);
  const [dateField, setDateField] = useState("");
  const [metricField, setMetricField] = useState("");
  const [aggregation, setAggregation] = useState<"sum" | "mean">("sum");
  const [frequency, setFrequency] = useState("auto");
  const [horizon, setHorizon] = useState(6);
  const [loading, setLoading] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState("");

  const dateCandidate = useMemo(() => preparation?.date_candidates.find((item) => item.field === dateField) ?? null, [preparation, dateField]);
  const metricCandidate = useMemo(() => preparation?.metric_candidates.find((item) => item.field === metricField) ?? null, [preparation, metricField]);

  function resetResult() {
    setResult(null);
    setError("");
  }

  function resetAll() {
    setFile(null);
    setWorkbook(null);
    setSheetName("");
    setPreparation(null);
    setDateField("");
    setMetricField("");
    setAggregation("sum");
    setFrequency("auto");
    setHorizon(6);
    setResult(null);
    setError("");
  }

  async function inspectWorkbook(selectedFile: File) {
    const form = new FormData();
    form.append("file", selectedFile);
    const response = await fetch(`${API_URL}/api/datasets/workbook`, { method: "POST", body: form });
    if (!response.ok) throw new Error(await responseError(response));
    const body = await response.json();
    return body.workbook as WorkbookInfo;
  }

  async function prepare(selectedFile: File, selectedSheet = "") {
    setLoading(true);
    setError("");
    setPreparation(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      if (selectedSheet) form.append("sheet_name", selectedSheet);
      const response = await fetch(`${API_URL}/api/datasets/forecast/prepare`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as ForecastPreparation;
      setPreparation(body);
      setDateField(body.recommended_date ?? body.date_candidates[0]?.field ?? "");
      setMetricField(body.recommended_metric ?? body.metric_candidates[0]?.field ?? "");
      setFrequency("auto");
      if (!body.ready) {
        setError("Forecast Studio needs at least one date-like field and one numeric measure.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare this dataset for forecasting.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;
    const extension = selectedFile.name.toLowerCase().split(".").pop();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      setError("Forecast Studio supports CSV and XLSX files only.");
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      setError("Forecast Studio currently supports files up to 20 MB.");
      return;
    }
    setFile(selectedFile);
    setWorkbook(null);
    setSheetName("");
    setPreparation(null);
    setResult(null);
    setError("");

    try {
      if (extension === "xlsx") {
        setLoading(true);
        const info = await inspectWorkbook(selectedFile);
        setWorkbook(info);
        const recommended = info.recommended_sheet ?? info.sheets.find((sheet) => sheet.analysis_ready)?.name ?? "";
        setSheetName(recommended);
        setLoading(false);
        await prepare(selectedFile, recommended);
      } else {
        await prepare(selectedFile);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unable to read this file.");
    }
  }

  async function changeSheet(nextSheet: string) {
    setSheetName(nextSheet);
    if (file) await prepare(file, nextSheet);
  }

  async function runForecast() {
    if (!file || !dateField || !metricField) return;
    setForecasting(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("date_field", dateField);
      form.append("metric_field", metricField);
      form.append("aggregation", aggregation);
      form.append("frequency", frequency);
      form.append("horizon", String(horizon));
      if (sheetName) form.append("sheet_name", sheetName);
      const response = await fetch(`${API_URL}/api/datasets/forecast`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      setResult(await response.json() as ForecastResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate this forecast.");
    } finally {
      setForecasting(false);
    }
  }

  function downloadForecastCsv() {
    if (!result) return;
    const rows = [
      ["Date", "Forecast", "Lower 95%", "Upper 95%"],
      ...result.forecast.map((point) => [point.date, point.value, point.lower, point.upper]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${result.configuration.metric_field.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-forecast.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Azhan Data Studio home">
          <DataStudioMark />
          <span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span>
        </a>
        <div className="topbarActions">
          <a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer" aria-label="View Azhan Hassan portfolio">
            <span className="creatorLabel">CREATED BY</span><span className="creatorName">Azhan Hassan</span><span className="creatorRole">Data &amp; AI Automation Specialist</span><span className="portfolioCta">View Portfolio ↗</span>
          </a>
          <a className="supportTopButton" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support</a>
        </div>
      </header>

      <nav className="studioModeBar" aria-label="Choose analysis mode">
        <div className="studioModeInner">
          <a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
          <a className="studioModeTab" href="/monthly"><span className="studioModeIcon">▦</span><span><strong>Monthly Intelligence</strong><small>Append monthly files and track movement</small></span><em>NEW</em></a>
          <a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
          <a className="studioModeTab active" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span></a>
          <a className="studioModeTab" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions before you decide</small></span></a>
          <a className="studioModeTab" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Validate relationships and differences</small></span><em>NEW</em></a>
        </div>
      </nav>

      <section className="forecastHero">
        <div className="forecastHeroInner">
          <div className="forecastHeroCopy">
            <span className="panelKicker">FORECAST STUDIO · DECISION INTELLIGENCE</span>
            <h1>See what&apos;s likely next.</h1>
            <p>Turn historical CSV or Excel data into a transparent time-series forecast. Choose a date, a metric and a horizon; Data Studio measures trend, seasonality, backtest accuracy and a 95% forecast range.</p>
            <div className="forecastTrustRow"><span>Deterministic model</span><span>No AI-generated numbers</span><span>Up to 20 MB</span><span>Backtest evidence included</span></div>
          </div>
          <div className="forecastHeroPreview" aria-hidden="true"><div className="forecastMiniChart"><i /><i /><i /><i /><i /><b /><b /><b /></div><strong>History → forecast</strong><small>Trend + seasonality + uncertainty</small></div>
        </div>
      </section>

      <section className="forecastShell">
        <div className="forecastStepHeading"><span>01</span><div><small>SELECT HISTORY</small><h2>Upload your time-based dataset</h2><p>CSV or XLSX with a date/time field and at least one numeric measure.</p></div></div>

        <section className="panel forecastUploadPanel">
          <button type="button" className={`forecastDropzone ${file ? "hasFile" : ""}`} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" hidden accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event: ChangeEvent<HTMLInputElement>) => { void chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
            <span className="forecastUploadIcon">↑</span>
            <span><strong>{file ? file.name : "Choose CSV or Excel file"}</strong><small>{file ? `${formatBytes(file.size)} · click to replace` : "CSV / XLSX · maximum 20 MB"}</small></span>
          </button>
          {workbook && (
            <label className="forecastSheetField"><span>Workbook sheet</span><select value={sheetName} onChange={(event) => void changeSheet(event.target.value)}>{workbook.sheets.filter((sheet) => sheet.analysis_ready).map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name} · {formatNumber(sheet.rows)} rows</option>)}</select></label>
          )}
          {loading && <div className="forecastStatus">Reading fields and historical coverage…</div>}
          {preparation && <div className="forecastFileMeta"><span>{formatNumber(preparation.dataset.rows)} rows</span><span>{preparation.dataset.columns} fields</span><span>{preparation.date_candidates.length} date candidates</span><span>{preparation.metric_candidates.length} numeric measures</span></div>}
        </section>

        {preparation?.ready && (
          <>
            <div className="forecastStepHeading forecastStepTwo"><span>02</span><div><small>CONFIGURE SERIES</small><h2>Choose what you want to forecast</h2><p>Data Studio recommends likely fields, but you remain in control of the series definition.</p></div></div>
            <section className="panel forecastConfigPanel">
              <div className="forecastConfigGrid">
                <label><span>Date field</span><select value={dateField} onChange={(event) => { setDateField(event.target.value); resetResult(); }}>{preparation.date_candidates.map((item) => <option key={item.field} value={item.field}>{item.field}{item.field === preparation.recommended_date ? " · Recommended" : ""}</option>)}</select><small>{dateCandidate ? `${formatNumber(dateCandidate.parse_percent, 1)}% parseable · ${formatNumber(dateCandidate.unique_dates)} unique dates` : "Choose a date field"}</small></label>
                <label><span>Metric</span><select value={metricField} onChange={(event) => { setMetricField(event.target.value); resetResult(); }}>{preparation.metric_candidates.map((item) => <option key={item.field} value={item.field}>{item.field}{item.field === preparation.recommended_metric ? " · Recommended" : ""}</option>)}</select><small>{metricCandidate ? `Mean ${formatNumber(metricCandidate.mean, 2)} · ${formatNumber(metricCandidate.non_null)} values` : "Choose a numeric measure"}</small></label>
                <label><span>Aggregation</span><select value={aggregation} onChange={(event) => { setAggregation(event.target.value as "sum" | "mean"); resetResult(); }}><option value="sum">Sum per period</option><option value="mean">Average per period</option></select><small>How multiple rows in the same period combine</small></label>
                <label><span>Time grain</span><select value={frequency} onChange={(event) => { setFrequency(event.target.value); resetResult(); }}><option value="auto">Auto · suggested {preparation.suggested_frequency}</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select><small>Auto infers the natural spacing in your dates</small></label>
                <label><span>Forecast horizon</span><select value={horizon} onChange={(event) => { setHorizon(Number(event.target.value)); resetResult(); }}>{[3, 6, 12, 18, 24, 36].map((value) => <option key={value} value={value}>{value} future periods</option>)}</select><small>Maximum 36 periods in Forecast v1</small></label>
                <div className="forecastRunCell"><button className="forecastPrimary" onClick={() => void runForecast()} disabled={forecasting}>{forecasting ? "Forecasting…" : "Generate forecast"}</button><small>Trend + seasonal pattern + backtest + 95% range</small></div>
              </div>
            </section>
          </>
        )}

        {error && <div className="errorBox forecastError">{error}</div>}

        {result && (
          <>
            <div className="forecastStepHeading forecastStepThree unifiedDashboardHeading"><span>03</span><div><small>FORECAST DASHBOARD</small><h2>{result.configuration.metric_field} outlook</h2><p>{result.configuration.aggregation === "sum" ? "Total" : "Average"} by {result.configuration.frequency} period · {result.configuration.horizon}-period horizon.</p></div><div className="dashboardActionGroup"><button className="pdfReportButton" onClick={() => printToolReport(`Forecast Report - ${result.configuration.metric_field}`)}>Download PDF Report</button><button className="forecastResetButton" onClick={resetAll}>Analyse another file</button></div></div>

            <div className="forecastSummaryGrid">
              <article><span>NEXT FORECAST</span><strong>{formatNumber(result.summary.next_forecast, 2)}</strong><small className={(result.summary.next_forecast_change_percent ?? 0) > 0 ? "positive" : (result.summary.next_forecast_change_percent ?? 0) < 0 ? "negative" : ""}>{formatPercent(result.summary.next_forecast_change_percent)} vs latest actual</small></article>
              <article><span>TREND</span><strong>{result.diagnostics.trend_direction}</strong><small>{formatSigned(result.diagnostics.trend_per_period, 2)} per {periodNoun(result.configuration.frequency)}</small></article>
              <article><span>MODEL CONFIDENCE</span><strong>{result.diagnostics.confidence}</strong><small>{result.diagnostics.backtest_mape != null ? `${formatNumber(result.diagnostics.backtest_mape, 1)}% backtest MAPE` : "Limited percentage backtest"}</small></article>
              <article><span>HISTORY USED</span><strong>{formatNumber(result.summary.history_periods)}</strong><small>{formatDateLabel(result.summary.history_start, result.configuration.frequency)} → {formatDateLabel(result.summary.history_end, result.configuration.frequency)}</small></article>
            </div>

            <section className="panel unifiedMeaningPanel forecastMeaningPanel">
              <div className="unifiedMeaningMark">↗</div>
              <div className="unifiedMeaningCopy">
                <span className="panelKicker">WHAT THIS MEANS</span>
                <h3>{result.diagnostics.trend_direction} outlook with {result.diagnostics.confidence.toLowerCase()} model confidence.</h3>
                <p>The next {periodNoun(result.configuration.frequency)} is forecast at <strong>{formatNumber(result.summary.next_forecast, 2)}</strong>, which is <strong className={(result.summary.next_forecast_change_percent ?? 0) >= 0 ? "positive" : "negative"}>{formatPercent(result.summary.next_forecast_change_percent)}</strong> versus the latest actual value.</p>
                <div className="unifiedMeaningChips"><span>{result.diagnostics.seasonality_detected ? "Seasonality detected" : "No strong seasonality"}</span><span>{result.diagnostics.backtest_mape != null ? `${formatNumber(result.diagnostics.backtest_mape, 1)}% backtest error` : "Limited backtest"}</span><span>{result.configuration.horizon} future periods</span></div>
              </div>
            </section>

            <section className="panel forecastChartPanel">
              <div className="forecastPanelHeader"><div><span className="panelKicker">FORECAST CURVE</span><h3>Historical pattern and projected range</h3><p>Solid blue is observed history; the dashed path is the forecast. The shaded range represents approximately 95% model uncertainty based on residual error.</p></div><button className="forecastCsvButton" onClick={downloadForecastCsv}>Download forecast CSV</button></div>
              <ForecastChart result={result} />
            </section>

            <div className="forecastInsightGrid">
              {result.highlights.map((item) => <article className="panel forecastInsightCard" key={item.type}><span className="panelKicker">{item.type.toUpperCase()}</span><strong>{item.title}</strong><p>{item.detail}</p></article>)}
            </div>

            <div className="forecastDetailGrid">
              <section className="panel forecastDiagnosticsPanel">
                <div className="forecastPanelHeader"><div><span className="panelKicker">MODEL DIAGNOSTICS</span><h3>How much should you trust it?</h3><p>Evidence about trend, repeated seasonal structure and holdout performance.</p></div></div>
                <div className="forecastDiagnosticsList">
                  <div><span>Model</span><strong>{result.diagnostics.model}</strong></div>
                  <div><span>Trend change / period</span><strong className={result.diagnostics.trend_per_period > 0 ? "positive" : result.diagnostics.trend_per_period < 0 ? "negative" : ""}>{formatSigned(result.diagnostics.trend_per_period, 2)}</strong></div>
                  <div><span>Seasonality</span><strong>{result.diagnostics.seasonality_detected ? `Detected · ${formatNumber(result.diagnostics.seasonality_strength_percent, 1)}% strength` : "No strong repeated pattern"}</strong></div>
                  <div><span>Backtest</span><strong>{result.diagnostics.backtest_mape != null ? `${formatNumber(result.diagnostics.backtest_mape, 1)}% MAPE · ${result.diagnostics.backtest_periods} periods` : "Limited"}</strong></div>
                  <div><span>Residual RMSE</span><strong>{formatNumber(result.diagnostics.residual_rmse, 2)}</strong></div>
                  <div><span>Horizon-end change</span><strong className={(result.summary.horizon_change_percent ?? 0) > 0 ? "positive" : (result.summary.horizon_change_percent ?? 0) < 0 ? "negative" : ""}>{formatPercent(result.summary.horizon_change_percent)}</strong></div>
                </div>
              </section>

              <section className="panel forecastTablePanel">
                <div className="forecastPanelHeader"><div><span className="panelKicker">FORECAST REGISTER</span><h3>Future periods</h3><p>Point forecast with lower and upper 95% model ranges.</p></div></div>
                <div className="forecastTableWrap"><table className="forecastTable"><thead><tr><th>Period</th><th>Forecast</th><th>Lower</th><th>Upper</th></tr></thead><tbody>{result.forecast.map((point) => <tr key={point.date}><td>{formatDateLabel(point.date, result.configuration.frequency)}</td><td><strong>{formatNumber(point.value, 2)}</strong></td><td>{formatNumber(point.lower, 2)}</td><td>{formatNumber(point.upper, 2)}</td></tr>)}</tbody></table></div>
              </section>
            </div>

            <div className="forecastMethodNote"><strong>Method</strong><span>{result.method}</span><strong>Important</strong><span>{result.caveat}</span></div>

            <ToolPdfReport
              tool="Forecast"
              title={`${result.configuration.metric_field} outlook`}
              subtitle={`${result.configuration.aggregation === "sum" ? "Total" : "Average"} ${result.configuration.metric_field} projected across ${result.configuration.horizon} future ${periodNoun(result.configuration.frequency)}${result.configuration.horizon === 1 ? "" : "s"}.`}
              dataset={result.dataset.filename}
              sheet={result.dataset.sheet_name}
              metrics={[
                { label: "Latest actual", value: formatNumber(result.summary.latest_actual, 2) },
                { label: "Next forecast", value: formatNumber(result.summary.next_forecast, 2), detail: `${formatPercent(result.summary.next_forecast_change_percent)} vs latest` },
                { label: "Horizon end", value: formatNumber(result.summary.horizon_end_forecast, 2), detail: `${formatPercent(result.summary.horizon_change_percent)} vs latest` },
                { label: "Trend", value: result.diagnostics.trend_direction, detail: `${formatSigned(result.diagnostics.trend_per_period, 2)} per ${periodNoun(result.configuration.frequency)}` },
                { label: "Model confidence", value: result.diagnostics.confidence, detail: result.diagnostics.backtest_mape != null ? `${formatNumber(result.diagnostics.backtest_mape, 1)}% MAPE` : "Limited backtest" },
                { label: "Seasonality", value: result.diagnostics.seasonality_detected ? "Detected" : "Not strong", detail: `${formatNumber(result.diagnostics.seasonality_strength_percent, 1)}% strength` },
              ]}
              methodology={result.method}
              caveat={result.caveat}
            >
              <ToolPdfSection eyebrow="Executive summary" title="Forecast interpretation">
                <div className="toolPdfFindingList">{result.highlights.slice(0, 6).map((item, index) => <article key={`${item.type}-${index}`}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}</div>
              </ToolPdfSection>
              <ToolPdfSection eyebrow="Forecast register" title="Future periods and uncertainty range">
                <table className="toolPdfTable"><thead><tr><th>Period</th><th>Forecast</th><th>Lower range</th><th>Upper range</th></tr></thead><tbody>
                  {result.forecast.map((point) => <tr key={point.date}><td><strong>{formatDateLabel(point.date, result.configuration.frequency)}</strong></td><td>{formatNumber(point.value, 2)}</td><td>{formatNumber(point.lower, 2)}</td><td>{formatNumber(point.upper, 2)}</td></tr>)}
                </tbody></table>
              </ToolPdfSection>
              <ToolPdfSection eyebrow="Model diagnostics" title="How much confidence should you place in the forecast?">
                <div className="toolPdfTwoCol"><div>
                  <div className="toolPdfKeyValue"><span>Model</span><strong>{result.diagnostics.model}</strong></div>
                  <div className="toolPdfKeyValue"><span>History used</span><strong>{result.summary.history_periods} periods</strong></div>
                  <div className="toolPdfKeyValue"><span>Residual RMSE</span><strong>{formatNumber(result.diagnostics.residual_rmse, 2)}</strong></div>
                </div><div>
                  <div className="toolPdfKeyValue"><span>Backtest periods</span><strong>{result.diagnostics.backtest_periods}</strong></div>
                  <div className="toolPdfKeyValue"><span>Backtest MAE</span><strong>{result.diagnostics.backtest_mae != null ? formatNumber(result.diagnostics.backtest_mae, 2) : "—"}</strong></div>
                  <div className="toolPdfKeyValue"><span>Backtest MAPE</span><strong>{result.diagnostics.backtest_mape != null ? `${formatNumber(result.diagnostics.backtest_mape, 1)}%` : "—"}</strong></div>
                </div></div>
              </ToolPdfSection>
            </ToolPdfReport>
          </>
        )}

        <section className="supportLanding" id="support">
          <div><span className="panelKicker">INDEPENDENTLY BUILT</span><strong>Did Azhan Data Studio save you time?</strong><p>The studio stays free to use. If it helped you understand, compare or forecast your data, you can support continued development with a one-time contribution.</p></div>
          {SUPPORT_URL ? <a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support development</a> : <span className="supportPending">Stripe support link coming soon</span>}
        </section>
      </section>
    </main>
  );
}
