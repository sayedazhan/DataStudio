"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ToolPdfReport, ToolPdfSection, printToolReport } from "../components/tool-report";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const DB_NAME = "azhan-data-studio-v3";
const DB_VERSION = 1;
const STORE_NAME = "monthly-files";

type StoredMonthlyFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  addedAt: string;
  blob: Blob;
};

type SourceMeta = {
  filename: string;
  sheet_name?: string | null;
  rows: number;
  columns: number;
  inferred_period?: string | null;
  period_label?: string | null;
  period_concentration_percent: number;
};

type FieldCandidate = {
  field: string;
  score?: number;
  parse_percent?: number;
  typed_as_date?: boolean;
  recommended_aggregation?: "sum" | "average";
  non_null_values?: number;
  unique_values?: number;
};

type SchemaWarning = {
  type: string;
  filename?: string;
  field?: string;
  columns?: string[];
  detail: string;
};

type PeriodMeta = { period: string; label: string; rows: number };

type MonthlyPreparation = {
  ready: boolean;
  files: SourceMeta[];
  file_count: number;
  total_rows: number;
  common_columns: string[];
  common_column_count: number;
  date_candidates: FieldCandidate[];
  metric_candidates: FieldCandidate[];
  dimension_candidates: FieldCandidate[];
  recommended_date?: string | null;
  recommended_metric?: string | null;
  recommended_dimension?: string | null;
  recommended_aggregation: "sum" | "average";
  periods: PeriodMeta[];
  period_count: number;
  schema_warnings: SchemaWarning[];
  invalid_date_values: number;
  note: string;
};

type TrendPoint = PeriodMeta & {
  value: number;
  change?: number | null;
  change_percent?: number | null;
};

type Driver = {
  value: string;
  previous: number;
  current: number;
  change: number;
  change_percent?: number | null;
  status: string;
  movement_share_percent: number;
};

type MonthlyInsight = { tone: "positive" | "negative" | "neutral" | "info" | "warning"; title: string; detail: string };

type AlertItem = {
  type: "kpi_movement" | "target" | "trend_streak" | "driver_concentration" | "data_quality" | string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  value?: number | null;
  threshold?: number | null;
  target?: number | null;
  target_condition?: "minimum" | "maximum";
  streak_length?: number;
};

type AlertReport = {
  status: "Alert" | "On track";
  triggered_count: number;
  total_signal_count: number;
  threshold_percent: number;
  direction: "any" | "decrease" | "increase";
  target_value?: number | null;
  target_condition: "minimum" | "maximum";
  items: AlertItem[];
};

type HistoricalBenchmark = {
  average_value: number;
  median_value: number;
  current_vs_average: number;
  current_vs_average_percent?: number | null;
  current_rank: number;
  period_count: number;
  best_period?: string | null;
  best_label?: string | null;
  best_value: number;
  worst_period?: string | null;
  worst_label?: string | null;
  worst_value: number;
  volatility_percent?: number | null;
  positive_moves: number;
  negative_moves: number;
};

type QualityReport = {
  status: "Good" | "Review" | "Attention";
  records: number;
  fields: number;
  completeness_percent: number;
  missing_cells: number;
  duplicate_rows: number;
  invalid_dates: number;
  date_field?: string | null;
  missing_by_field: Array<{ field: string; missing: number; missing_percent: number }>;
  schema_warnings: SchemaWarning[];
  new_values: Array<{ field: string; value: string; count: number }>;
  row_count_anomalies: Array<PeriodMeta & { baseline_rows: number; change_percent: number }>;
  period_gaps: PeriodMeta[];
  issue_count: number;
};

type MonthlyResult = {
  generated_at: string;
  dataset: {
    file_count: number;
    total_rows: number;
    fields: number;
    period_count: number;
    first_period: string;
    last_period: string;
    date_field?: string | null;
    metric: string;
    aggregation: "sum" | "average";
    dimension?: string | null;
  };
  sources: SourceMeta[];
  periods: PeriodMeta[];
  trend: TrendPoint[];
  comparison: {
    previous_period: string;
    previous_label: string;
    current_period: string;
    current_label: string;
    previous_value: number;
    current_value: number;
    change: number;
    change_percent?: number | null;
    previous_rows: number;
    current_rows: number;
    row_change: number;
    row_change_percent?: number | null;
    previous_per_record: number;
    current_per_record: number;
    per_record_change: number;
    per_record_change_percent?: number | null;
  };
  benchmark: HistoricalBenchmark;
  alerts: AlertReport;
  drivers: Driver[];
  insights: MonthlyInsight[];
  quality: QualityReport;
  method: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open the local monthly file store."));
  });
}

async function readStoredFiles(): Promise<StoredMonthlyFile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as StoredMonthlyFile[]).sort((a, b) => a.addedAt.localeCompare(b.addedAt)));
    request.onerror = () => reject(request.error ?? new Error("Unable to read the local monthly file store."));
    transaction.oncomplete = () => db.close();
  });
}

async function saveStoredFile(record: StoredMonthlyFile) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Unable to save this file locally.")); };
  });
}

async function deleteStoredFile(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Unable to remove this file.")); };
  });
}

async function clearStoredFiles() {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Unable to reset the local file library.")); };
  });
}

async function fingerprint(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function asFile(record: StoredMonthlyFile) {
  return new File([record.blob], record.name, { type: record.type, lastModified: record.lastModified });
}

function appendFiles(form: FormData, files: StoredMonthlyFile[]) {
  files.forEach((record) => form.append("files", asFile(record), record.name));
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value);
}

function formatMetric(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)}B`;
  if (absolute >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)}M`;
  if (absolute >= 1_000) return `${formatNumber(value / 1_000, 1)}K`;
  return formatNumber(value, 2);
}

function formatPercent(value: number | null | undefined, signed = false) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 1)}%`;
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${formatNumber(value / 1024, 1)} KB`;
  return `${formatNumber(value / 1024 / 1024, 1)} MB`;
}

function responseError(response: Response) {
  return response.json().then((body) => body?.detail ?? `Request failed (${response.status}).`).catch(() => `Request failed (${response.status}).`);
}

function DataStudioMark() {
  return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i /><i /><i /></span></span>;
}

function KpiCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail?: string; tone?: "default" | "positive" | "negative" | "warn" }) {
  return <div className={`monthlyKpi ${tone}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

function MonthlyExecutivePdfReport({ result }: { result: MonthlyResult }) {
  const comparisonRows = [
    ["KPI", formatMetric(result.comparison.previous_value), formatMetric(result.comparison.current_value), formatPercent(result.comparison.change_percent, true)],
    ["Per-record KPI", formatMetric(result.comparison.previous_per_record), formatMetric(result.comparison.current_per_record), formatPercent(result.comparison.per_record_change_percent, true)],
    ["Record volume", formatNumber(result.comparison.previous_rows), formatNumber(result.comparison.current_rows), formatPercent(result.comparison.row_change_percent, true)],
  ];
  const executiveSubtitle = `${result.dataset.aggregation === "average" ? "Average" : "Total"} ${result.dataset.metric} · ${result.comparison.previous_label} to ${result.comparison.current_label}`;
  const sourceLabel = `${result.dataset.file_count} monthly files · ${formatNumber(result.dataset.total_rows)} records · ${result.dataset.period_count} periods`;
  const currentTone = (result.comparison.change_percent ?? 0) > 0 ? "up" : (result.comparison.change_percent ?? 0) < 0 ? "down" : "flat";

  return (
    <ToolPdfReport
      tool="Monthly Executive"
      title={`${result.dataset.metric} Executive Performance Report`}
      subtitle={executiveSubtitle}
      dataset={sourceLabel}
      metrics={[
        { label: `Current · ${result.comparison.current_label}`, value: formatMetric(result.comparison.current_value), detail: `${result.dataset.aggregation} of ${result.dataset.metric}` },
        { label: "Period movement", value: formatPercent(result.comparison.change_percent, true), detail: `${result.comparison.change >= 0 ? "+" : ""}${formatMetric(result.comparison.change)} absolute` },
        { label: "KPI alert", value: result.alerts.status, detail: result.alerts.triggered_count ? `${result.alerts.triggered_count} configured rule(s) triggered` : `${formatNumber(result.alerts.threshold_percent, 0)}% movement threshold` },
        { label: "Historical rank", value: `#${result.benchmark.current_rank} of ${result.benchmark.period_count}`, detail: `Average ${formatMetric(result.benchmark.average_value)}` },
        { label: "Data quality", value: result.quality.status, detail: `${formatNumber(result.quality.completeness_percent, 1)}% complete · ${result.quality.issue_count} flag(s)` },
        { label: "Per-record performance", value: formatMetric(result.comparison.current_per_record), detail: `${formatPercent(result.comparison.per_record_change_percent, true)} vs previous period` },
      ]}
      methodology={result.method}
      caveat="This report is generated from the monthly files currently stored in this browser and the selected KPI, aggregation, dimension and comparison periods. Review source data and business context before making material decisions."
    >
      <ToolPdfSection eyebrow="Executive summary" title={result.insights[0]?.title ?? "Current performance summary"}>
        <p>{result.insights[0]?.detail ?? "The selected KPI has been compared across the available reporting history."}</p>
        <div className={`monthlyPdfExecutiveSignal ${currentTone}`}>
          <strong>{formatPercent(result.comparison.change_percent, true)}</strong>
          <span>{result.comparison.current_label} vs {result.comparison.previous_label}</span>
          <small>{formatPercent(result.benchmark.current_vs_average_percent, true)} versus historical average</small>
        </div>
      </ToolPdfSection>

      <ToolPdfSection eyebrow="Period comparison" title="Performance, volume and historical context">
        <table className="toolPdfTable">
          <thead><tr><th>Measure</th><th>{result.comparison.previous_label}</th><th>{result.comparison.current_label}</th><th>Movement</th></tr></thead>
          <tbody>{comparisonRows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody>
        </table>
        <div className="monthlyPdfBenchmarkGrid">
          <div><span>Historical average</span><strong>{formatMetric(result.benchmark.average_value)}</strong></div>
          <div><span>Best period</span><strong>{result.benchmark.best_label ?? "—"}</strong><small>{formatMetric(result.benchmark.best_value)}</small></div>
          <div><span>Worst period</span><strong>{result.benchmark.worst_label ?? "—"}</strong><small>{formatMetric(result.benchmark.worst_value)}</small></div>
          <div><span>Volatility</span><strong>{formatPercent(result.benchmark.volatility_percent)}</strong></div>
        </div>
      </ToolPdfSection>

      <ToolPdfSection eyebrow="KPI trend" title={`${result.dataset.metric} across reporting history`}>
        <div className="monthlyPdfTrend">
          {result.trend.map((item) => {
            const maxValue = Math.max(...result.trend.map((point) => Math.abs(point.value)), 1);
            return <div key={item.period} className="monthlyPdfTrendRow"><span>{item.label}</span><div><i style={{ width: `${Math.max(2, Math.abs(item.value) / maxValue * 100)}%` }} /></div><strong>{formatMetric(item.value)}</strong><small>{item.change_percent == null ? "Baseline" : formatPercent(item.change_percent, true)}</small></div>;
          })}
        </div>
      </ToolPdfSection>

      <div className="toolPdfPageBreak" />

      <ToolPdfSection eyebrow="Management signals" title="Alerts and deterministic findings">
        <div className="monthlyPdfStatusLine"><span>Configured alert status</span><strong>{result.alerts.status}</strong><small>{result.alerts.direction === "any" ? "Any movement" : result.alerts.direction} · {formatNumber(result.alerts.threshold_percent, 0)}% threshold{result.alerts.target_value != null ? ` · ${result.alerts.target_condition} target ${formatMetric(result.alerts.target_value)}` : ""}</small></div>
        {result.alerts.items.length > 0 && <div className="toolPdfFindingList monthlyPdfAlertList">{result.alerts.items.slice(0, 6).map((item, index) => <article key={`${item.type}-${index}`}><span>{item.severity === "critical" ? "!" : item.severity === "warning" ? "W" : "i"}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}</div>}
        <div className="toolPdfFindingList">{result.insights.slice(0, 6).map((insight, index) => <article key={`${insight.title}-${index}`}><span>{index + 1}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div></article>)}</div>
      </ToolPdfSection>

      {result.drivers.length > 0 && <ToolPdfSection eyebrow="Movement drivers" title={`Largest changes by ${result.dataset.dimension}`}>
        <table className="toolPdfTable">
          <thead><tr><th>{result.dataset.dimension}</th><th>Previous</th><th>Current</th><th>Change</th><th>Movement share</th></tr></thead>
          <tbody>{result.drivers.slice(0, 8).map((driver) => <tr key={driver.value}><td><strong>{driver.value}</strong></td><td>{formatMetric(driver.previous)}</td><td>{formatMetric(driver.current)}</td><td>{driver.change >= 0 ? "+" : ""}{formatMetric(driver.change)} ({formatPercent(driver.change_percent, true)})</td><td>{formatPercent(driver.movement_share_percent)}</td></tr>)}</tbody>
        </table>
      </ToolPdfSection>}

      <ToolPdfSection eyebrow="Data quality" title={`${result.quality.status} · ${result.quality.issue_count} quality flag${result.quality.issue_count === 1 ? "" : "s"}`}>
        <div className="monthlyPdfQualityGrid">
          <div><span>Completeness</span><strong>{formatNumber(result.quality.completeness_percent, 1)}%</strong><small>{formatNumber(result.quality.missing_cells)} missing cells</small></div>
          <div><span>Duplicate rows</span><strong>{formatNumber(result.quality.duplicate_rows)}</strong><small>Across consolidated history</small></div>
          <div><span>Invalid dates</span><strong>{formatNumber(result.quality.invalid_dates)}</strong><small>{result.quality.date_field || "Filename period detection"}</small></div>
          <div><span>Schema warnings</span><strong>{formatNumber(result.quality.schema_warnings.length)}</strong><small>{result.quality.period_gaps.length} period gap(s)</small></div>
        </div>
        {(result.quality.missing_by_field.length > 0 || result.quality.new_values.length > 0) && <div className="toolPdfTwoCol monthlyPdfQualityDetails">
          <div><h3>Largest missingness</h3>{result.quality.missing_by_field.slice(0, 5).map((item) => <div className="toolPdfKeyValue" key={item.field}><span>{item.field}</span><strong>{formatPercent(item.missing_percent)}</strong></div>)}</div>
          <div><h3>New values in current period</h3>{result.quality.new_values.slice(0, 5).map((item, index) => <div className="toolPdfKeyValue" key={`${item.field}-${item.value}-${index}`}><span>{item.field}: {item.value}</span><strong>{formatNumber(item.count)}</strong></div>)}</div>
        </div>}
      </ToolPdfSection>

      <ToolPdfSection eyebrow="Source register" title="Files included in this executive report">
        <table className="toolPdfTable">
          <thead><tr><th>Source file</th><th>Period</th><th>Rows</th><th>Columns</th></tr></thead>
          <tbody>{result.sources.map((source) => <tr key={`${source.filename}-${source.sheet_name ?? ""}`}><td><strong>{source.filename}</strong>{source.sheet_name ? <small className="monthlyPdfSourceSheet"> · {source.sheet_name}</small> : null}</td><td>{source.period_label ?? source.inferred_period ?? "—"}</td><td>{formatNumber(source.rows)}</td><td>{formatNumber(source.columns)}</td></tr>)}</tbody>
        </table>
      </ToolPdfSection>
    </ToolPdfReport>
  );
}

export default function MonthlyPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<StoredMonthlyFile[]>([]);
  const [preparation, setPreparation] = useState<MonthlyPreparation | null>(null);
  const [result, setResult] = useState<MonthlyResult | null>(null);
  const [metric, setMetric] = useState("");
  const [aggregation, setAggregation] = useState<"sum" | "average">("sum");
  const [dateField, setDateField] = useState("");
  const [dimension, setDimension] = useState("");
  const [previousPeriod, setPreviousPeriod] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [alertDirection, setAlertDirection] = useState<"any" | "decrease" | "increase">("any");
  const [targetValue, setTargetValue] = useState("");
  const [targetCondition, setTargetCondition] = useState<"minimum" | "maximum">("minimum");
  const [loadingStore, setLoadingStore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");

  useEffect(() => {
    void readStoredFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to read the local monthly library."))
      .finally(() => setLoadingStore(false));

    try {
      const saved = window.localStorage.getItem("azhan-data-studio-v31-alert-settings");
      if (saved) {
        const parsed = JSON.parse(saved) as { threshold?: number; direction?: "any" | "decrease" | "increase"; target?: string; condition?: "minimum" | "maximum" };
        if (typeof parsed.threshold === "number") setAlertThreshold(parsed.threshold);
        if (parsed.direction) setAlertDirection(parsed.direction);
        if (typeof parsed.target === "string") setTargetValue(parsed.target);
        if (parsed.condition) setTargetCondition(parsed.condition);
      }
    } catch {
      // Alert preferences are optional; ignore unavailable or invalid local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("azhan-data-studio-v31-alert-settings", JSON.stringify({ threshold: alertThreshold, direction: alertDirection, target: targetValue, condition: targetCondition }));
    } catch {
      // The analysis still works when local storage is unavailable.
    }
  }, [alertThreshold, alertDirection, targetValue, targetCondition]);

  const preparedSources = preparation?.files ?? result?.sources ?? [];
  const maxTrend = useMemo(() => Math.max(...(result?.trend.map((item) => Math.abs(item.value)) ?? [1]), 1), [result]);
  const maxDriver = useMemo(() => Math.max(...(result?.drivers.map((item) => Math.abs(item.change)) ?? [1]), 1), [result]);

  async function addFiles(selected: File[]) {
    if (!selected.length) return;
    setError("");
    setNotice("");
    setPreparation(null);
    setResult(null);
    setBusy(true);
    try {
      const existing = new Set(files.map((item) => item.id));
      const additions: StoredMonthlyFile[] = [];
      let skipped = 0;
      for (const file of selected) {
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!extension || !["csv", "xlsx"].includes(extension)) {
          throw new Error(`${file.name}: only CSV and XLSX files are supported.`);
        }
        if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: each monthly file must be 20 MB or smaller.`);
        const id = await fingerprint(file);
        if (existing.has(id)) { skipped += 1; continue; }
        existing.add(id);
        const record: StoredMonthlyFile = {
          id,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          lastModified: file.lastModified,
          addedAt: new Date().toISOString(),
          blob: file,
        };
        await saveStoredFile(record);
        additions.push(record);
      }
      const next = [...files, ...additions];
      setFiles(next);
      setNotice(`${additions.length} file${additions.length === 1 ? "" : "s"} added to this browser${skipped ? ` · ${skipped} exact duplicate${skipped === 1 ? "" : "s"} skipped` : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add the selected files.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeFile(id: string) {
    setError("");
    try {
      await deleteStoredFile(id);
      setFiles((current) => current.filter((item) => item.id !== id));
      setPreparation(null);
      setResult(null);
      setNotice("File removed from this browser library.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove this file.");
    }
  }

  async function resetLibrary() {
    setError("");
    try {
      await clearStoredFiles();
      setFiles([]);
      setPreparation(null);
      setResult(null);
      setMetric("");
      setDateField("");
      setDimension("");
      setPreviousPeriod("");
      setCurrentPeriod("");
      setLastRefreshedAt("");
      setNotice("Monthly file library cleared from this browser.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset the local library.");
    }
  }

  async function prepare() {
    if (files.length < 2) {
      setError("Add at least two monthly files before preparing Monthly Intelligence.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);
    try {
      const form = new FormData();
      appendFiles(form, files);
      const response = await fetch(`${API_URL}/api/datasets/monthly/prepare`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as MonthlyPreparation;
      setPreparation(body);
      setMetric(body.recommended_metric ?? body.metric_candidates[0]?.field ?? "");
      setAggregation(body.recommended_aggregation ?? "sum");
      setDateField(body.recommended_date ?? "");
      setDimension(body.recommended_dimension ?? "");
      const periods = body.periods.map((item) => item.period);
      setCurrentPeriod(periods.at(-1) ?? "");
      setPreviousPeriod(periods.at(-2) ?? periods[0] ?? "");
      if (!body.ready) setError("Data Studio prepared the files but needs at least two detected reporting periods and one shared numeric metric before it can build Monthly Intelligence.");
      else setNotice(`Prepared ${body.file_count} files across ${body.period_count} reporting periods.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare the monthly file library.");
    } finally {
      setBusy(false);
    }
  }

  function metricChanged(next: string) {
    setMetric(next);
    const candidate = preparation?.metric_candidates.find((item) => item.field === next);
    if (candidate?.recommended_aggregation) setAggregation(candidate.recommended_aggregation);
  }

  async function analyse() {
    if (!preparation?.ready || !metric) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      appendFiles(form, files);
      form.append("metric", metric);
      form.append("aggregation", aggregation);
      if (dateField) form.append("date_field", dateField);
      if (dimension) form.append("dimension", dimension);
      if (previousPeriod) form.append("previous_period", previousPeriod);
      if (currentPeriod) form.append("current_period", currentPeriod);
      form.append("alert_threshold_percent", String(alertThreshold));
      form.append("alert_direction", alertDirection);
      if (targetValue.trim() !== "" && Number.isFinite(Number(targetValue))) form.append("target_value", targetValue.trim());
      form.append("target_condition", targetCondition);
      const response = await fetch(`${API_URL}/api/datasets/monthly/analyse`, { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as MonthlyResult;
      setResult(body);
      setPreviousPeriod(body.comparison.previous_period);
      setCurrentPeriod(body.comparison.current_period);
      const refreshedAt = new Date().toISOString();
      setLastRefreshedAt(refreshedAt);
      setNotice(`Monthly Intelligence refreshed ${new Date(refreshedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}.`);
      window.scrollTo({ top: 540, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to build Monthly Intelligence.");
    } finally {
      setBusy(false);
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    void addFiles(Array.from(event.target.files ?? []));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Azhan Data Studio home"><DataStudioMark /><span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a>
        <div className="topbarActions">
          <a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer"><span className="creatorLabel">CREATED BY</span><span className="creatorName">Azhan Hassan</span><span className="creatorRole">Data &amp; AI Automation Specialist</span><span className="portfolioCta">View Portfolio ↗</span></a>
          <a className="supportTopButton" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support</a>
        </div>
      </header>

      <nav className="studioModeBar" aria-label="Choose analysis mode">
        <div className="studioModeInner">
          <a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
          <a className="studioModeTab active" href="/monthly"><span className="studioModeIcon">▦</span><span><strong>Monthly Intelligence</strong><small>Append monthly files and track movement</small></span><em>NEW</em></a>
          <a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
          <a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span></a>
          <a className="studioModeTab" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions before you decide</small></span></a>
          <a className="studioModeTab" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Validate relationships and differences</small></span></a>
        </div>
      </nav>

      <section className="monthlyHero">
        <div className="monthlyHeroInner">
          <div><span className="panelKicker">ANALYTICS INTELLIGENCE · V3.2</span><h1>Turn monthly files into a living analytics history.</h1><p>Add each new CSV or Excel file to a browser-based monthly library. Data Studio detects reporting periods, validates structure, tracks KPI movement, surfaces deterministic business insights, adds configurable KPI alerts, benchmarks performance against history, and packages the findings into an executive-ready PDF report.</p><div className="monthlyTrust"><span>Persistent in this browser</span><span>Exact duplicate protection</span><span>No LLM / AI API</span><span>Up to 20 MB per file</span></div></div>
          <div className="monthlyHeroBadge"><strong>v3.2</strong><span>Executive<br />Reporting</span></div>
        </div>
      </section>

      <section className="monthlyShell">
        <div className="monthlyStepHeading"><span>01</span><div><small>MONTHLY INGESTION</small><h2>Build your monthly file library</h2><p>Add files as they arrive. Exact duplicate files are skipped automatically, while the originals stay stored locally in this browser for future sessions.</p></div></div>

        <div className="monthlyIngestGrid">
          <div className={`monthlyDropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple onChange={onInput} hidden />
            <div className="monthlyUploadIcon">＋</div><div><strong>Add monthly CSV / Excel files</strong><span>Choose one or several files · Data Studio keeps the library in this browser</span></div>
          </div>
          <div className="monthlyLibrarySummary"><span>LOCAL LIBRARY</span><strong>{loadingStore ? "…" : files.length}</strong><small>monthly file{files.length === 1 ? "" : "s"}</small><button type="button" onClick={() => void resetLibrary()} disabled={!files.length || busy}>Clear library</button></div>
        </div>

        {files.length > 0 && <div className="monthlyFileList">
          {files.map((file, index) => {
            const source = preparedSources[index];
            return <div className="monthlyFileRow" key={file.id}><div className="monthlyFileIcon">{file.name.toLowerCase().endsWith(".xlsx") ? "X" : "C"}</div><div className="monthlyFileName"><strong>{file.name}</strong><span>{formatBytes(file.size)} · added {new Date(file.addedAt).toLocaleDateString("en-AU")}{source?.sheet_name ? ` · sheet: ${source.sheet_name}` : ""}</span></div><div className="monthlyPeriodTag">{source?.period_label ?? "Period not checked"}<small>{source?.inferred_period ? `${formatNumber(source.period_concentration_percent, 0)}% period concentration` : "Prepare to detect"}</small></div><button className="monthlyRemove" onClick={() => void removeFile(file.id)} disabled={busy} aria-label={`Remove ${file.name}`}>Remove</button></div>;
          })}
        </div>}

        <div className="monthlyPrepareBar"><div><strong>{files.length < 2 ? "Add at least two files to continue" : "Ready to validate the monthly library"}</strong><span>Preparation checks shared fields, reporting periods, numeric KPIs and schema drift.</span></div><button className="primaryButton" disabled={files.length < 2 || busy} onClick={() => void prepare()}>{busy ? "Preparing files…" : preparation ? "Re-prepare library" : "Prepare Monthly Intelligence"}</button></div>

        {error && <div className="errorBox monthlyMessage">{error}</div>}
        {notice && <div className="monthlyNotice">✓ {notice}</div>}

        {preparation && <>
          <div className="monthlyStepHeading monthlyStepTwo"><span>02</span><div><small>VALIDATE &amp; CONFIGURE</small><h2>Choose what you want to track</h2><p>Data Studio has detected {preparation.period_count} reporting period{preparation.period_count === 1 ? "" : "s"}, {preparation.metric_candidates.length} shared numeric metric{preparation.metric_candidates.length === 1 ? "" : "s"}, and {preparation.dimension_candidates.length} useful business dimension{preparation.dimension_candidates.length === 1 ? "" : "s"}.</p></div></div>

          <div className="monthlyPrepMetrics"><KpiCard label="Files" value={formatNumber(preparation.file_count)} detail={`${formatNumber(preparation.total_rows)} rows`} /><KpiCard label="Reporting periods" value={formatNumber(preparation.period_count)} detail={preparation.periods.length ? `${preparation.periods[0].label} → ${preparation.periods.at(-1)?.label}` : "Not detected"} /><KpiCard label="Shared fields" value={formatNumber(preparation.common_column_count)} detail={`${preparation.metric_candidates.length} numeric metrics`} /><KpiCard label="Schema warnings" value={formatNumber(preparation.schema_warnings.length)} detail={preparation.schema_warnings.length ? "Review before analysis" : "Structure aligned"} tone={preparation.schema_warnings.length ? "warn" : "positive"} /></div>

          <section className="panel monthlyConfigPanel">
            <div className="panelHeader"><div><span className="panelKicker">ANALYSIS CONTROLS</span><h3>Monthly intelligence settings</h3><p>Defaults are selected automatically. Choose the KPI and comparison lens, then optionally configure an alert threshold or target.</p></div></div>
            <div className="monthlyControls">
              <label><span>Numeric KPI</span><select value={metric} onChange={(event) => metricChanged(event.target.value)}>{preparation.metric_candidates.map((item) => <option key={item.field} value={item.field}>{item.field}</option>)}</select></label>
              <label><span>Aggregation</span><select value={aggregation} onChange={(event) => setAggregation(event.target.value as "sum" | "average")}><option value="sum">Sum</option><option value="average">Average</option></select></label>
              <label><span>Date / period field</span><select value={dateField} onChange={(event) => setDateField(event.target.value)}><option value="">Auto-detect / filename fallback</option>{preparation.date_candidates.map((item) => <option key={item.field} value={item.field}>{item.field} · {formatPercent(item.parse_percent)}</option>)}</select></label>
              <label><span>Business dimension</span><select value={dimension} onChange={(event) => setDimension(event.target.value)}><option value="">No dimension</option>{preparation.dimension_candidates.map((item) => <option key={item.field} value={item.field}>{item.field}</option>)}</select></label>
              <label><span>Previous period</span><select value={previousPeriod} onChange={(event) => setPreviousPeriod(event.target.value)}>{preparation.periods.map((item) => <option key={item.period} value={item.period}>{item.label} · {formatNumber(item.rows)} rows</option>)}</select></label>
              <label><span>Current period</span><select value={currentPeriod} onChange={(event) => setCurrentPeriod(event.target.value)}>{preparation.periods.map((item) => <option key={item.period} value={item.period}>{item.label} · {formatNumber(item.rows)} rows</option>)}</select></label>
            </div>
            <div className="monthlyAlertConfig">
              <div className="monthlyAlertConfigIntro"><span className="panelKicker">KPI ALERT RULE</span><strong>Flag material movement automatically</strong><p>These rules run inside each analysis. Preferences stay saved in this browser and do not send external notifications.</p></div>
              <label><span>Movement threshold</span><div className="monthlyNumberInput"><input type="number" min="0" max="1000" step="1" value={alertThreshold} onChange={(event) => setAlertThreshold(Math.max(0, Number(event.target.value) || 0))} /><em>%</em></div></label>
              <label><span>Direction to watch</span><select value={alertDirection} onChange={(event) => setAlertDirection(event.target.value as "any" | "decrease" | "increase")}><option value="any">Any movement</option><option value="decrease">Decline only</option><option value="increase">Increase only</option></select></label>
              <label><span>Optional KPI target</span><input className="monthlyPlainInput" type="number" step="any" placeholder="No target" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} /></label>
              <label><span>Target rule</span><select value={targetCondition} onChange={(event) => setTargetCondition(event.target.value as "minimum" | "maximum")} disabled={!targetValue.trim()}><option value="minimum">Minimum · alert below target</option><option value="maximum">Maximum · alert above target</option></select></label>
            </div>
            <div className="monthlyConfigAction"><div><strong>{preparation.ready ? "Ready to build Monthly Intelligence" : "More usable period data is required"}</strong><span>Files are uploaded to the Data Studio API only when preparation or analysis runs; your monthly library itself remains in this browser.</span></div><button className="primaryButton" disabled={!preparation.ready || !metric || busy} onClick={() => void analyse()}>{busy ? "Building intelligence…" : result ? "Refresh Monthly Intelligence" : "Build Monthly Intelligence"}</button></div>
          </section>

          {preparation.schema_warnings.length > 0 && <section className="panel monthlyWarningPanel"><div className="panelHeader compactHeader"><div><span className="panelKicker">VALIDATION FLAGS</span><h3>Schema changes detected</h3></div></div><div className="monthlyWarningList">{preparation.schema_warnings.slice(0, 8).map((warning, index) => <div key={`${warning.type}-${index}`}><span>!</span><p><strong>{warning.filename ?? warning.field ?? "Monthly library"}</strong>{warning.detail}</p></div>)}</div></section>}
        </>}

        {result && <>
          <div className="monthlyStepHeading monthlyStepThree"><span>03</span><div><small>MONTHLY INTELLIGENCE DASHBOARD</small><h2>{result.comparison.previous_label} → {result.comparison.current_label}</h2><p>Data updated through <strong>{result.periods.at(-1)?.label}</strong>. The findings below are calculated directly from {result.dataset.file_count} monthly files and {formatNumber(result.dataset.total_rows)} records.</p></div><div className="monthlyResultActions"><div className="monthlyUpdated">LAST REFRESH<strong>{new Date(lastRefreshedAt || result.generated_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</strong></div><button className="pdfReportButton monthlyExecutivePdfButton" onClick={() => printToolReport(`Executive Monthly Report - ${result.dataset.metric} - ${result.comparison.current_label}`)}>Generate Executive PDF</button></div></div>

          <div className="monthlyDashboardKpis"><KpiCard label={`${result.dataset.metric} · previous`} value={formatMetric(result.comparison.previous_value)} detail={result.comparison.previous_label} /><KpiCard label={`${result.dataset.metric} · current`} value={formatMetric(result.comparison.current_value)} detail={result.comparison.current_label} /><KpiCard label="Period movement" value={formatPercent(result.comparison.change_percent, true)} detail={`${result.comparison.change >= 0 ? "+" : ""}${formatMetric(result.comparison.change)} absolute`} tone={result.comparison.change > 0 ? "positive" : result.comparison.change < 0 ? "negative" : "default"} /><KpiCard label="KPI alert" value={result.alerts.status} detail={result.alerts.triggered_count ? `${result.alerts.triggered_count} rule${result.alerts.triggered_count === 1 ? "" : "s"} triggered` : `${formatNumber(result.alerts.threshold_percent, 0)}% threshold`} tone={result.alerts.status === "Alert" ? "warn" : "positive"} /></div>

          <section className={`panel monthlyAlertPanel ${result.alerts.status === "Alert" ? "active" : "clear"}`}>
            <div className="monthlyAlertHeadline"><div className="monthlyAlertIcon">{result.alerts.status === "Alert" ? "!" : "✓"}</div><div><span className="panelKicker">KPI ALERTS</span><h3>{result.alerts.status === "Alert" ? "A configured KPI rule has been triggered" : "KPI is within the configured alert rules"}</h3><p>Watching {result.alerts.direction === "any" ? "movement in either direction" : result.alerts.direction} at {formatNumber(result.alerts.threshold_percent, 0)}%{result.alerts.target_value != null ? ` with a ${result.alerts.target_condition} target of ${formatMetric(result.alerts.target_value)}` : ""}.</p></div></div>
            {result.alerts.items.length > 0 ? <div className="monthlyAlertItems">{result.alerts.items.map((alert, index) => <article className={alert.severity} key={`${alert.type}-${index}`}><span>{alert.severity === "critical" ? "HIGH" : alert.severity === "warning" ? "WATCH" : "INFO"}</span><div><strong>{alert.title}</strong><p>{alert.detail}</p></div></article>)}</div> : <div className="monthlyAlertEmpty">No movement, target, trend-streak, concentration or data-quality signal is currently active.</div>}
          </section>

          <section className="panel monthlyComparisonPanel">
            <div className="panelHeader"><div><span className="panelKicker">PERIOD COMPARISON · V3.2</span><h3>Separate KPI performance from volume effects</h3><p>Compare the selected periods against each other and against the full reporting history.</p></div></div>
            <div className="monthlyComparisonGrid">
              <div><span>Absolute movement</span><strong className={result.comparison.change > 0 ? "positive" : result.comparison.change < 0 ? "negative" : ""}>{result.comparison.change >= 0 ? "+" : ""}{formatMetric(result.comparison.change)}</strong><small>{formatPercent(result.comparison.change_percent, true)} vs {result.comparison.previous_label}</small></div>
              <div><span>Per-record performance</span><strong className={(result.comparison.per_record_change_percent ?? 0) > 0 ? "positive" : (result.comparison.per_record_change_percent ?? 0) < 0 ? "negative" : ""}>{formatMetric(result.comparison.current_per_record)}</strong><small>{formatPercent(result.comparison.per_record_change_percent, true)} · previous {formatMetric(result.comparison.previous_per_record)}</small></div>
              <div><span>Record volume</span><strong>{formatNumber(result.comparison.current_rows)}</strong><small>{formatPercent(result.comparison.row_change_percent, true)} · previous {formatNumber(result.comparison.previous_rows)}</small></div>
              <div><span>Historical average</span><strong>{formatMetric(result.benchmark.average_value)}</strong><small>{formatPercent(result.benchmark.current_vs_average_percent, true)} current vs history</small></div>
              <div><span>Current period rank</span><strong>#{result.benchmark.current_rank}</strong><small>of {result.benchmark.period_count} periods · #1 is highest</small></div>
              <div><span>Best period</span><strong>{result.benchmark.best_label ?? "—"}</strong><small>{formatMetric(result.benchmark.best_value)}</small></div>
              <div><span>Worst period</span><strong>{result.benchmark.worst_label ?? "—"}</strong><small>{formatMetric(result.benchmark.worst_value)}</small></div>
              <div><span>Historical volatility</span><strong>{formatPercent(result.benchmark.volatility_percent)}</strong><small>{result.benchmark.positive_moves} positive · {result.benchmark.negative_moves} negative moves</small></div>
            </div>
          </section>

          <section className="panel monthlyMeaning"><div className="monthlyMeaningIcon">◎</div><div><span className="panelKicker">AUTOMATIC BUSINESS INSIGHT</span><h3>{result.insights[0]?.title}</h3><p>{result.insights[0]?.detail}</p><div className="monthlyMeaningChips"><span>{result.dataset.period_count} periods</span><span>{result.dataset.aggregation} of {result.dataset.metric}</span><span>{result.dataset.dimension || "No dimension selected"}</span></div></div></section>

          <div className="monthlyDashboardGrid">
            <section className="panel monthlyTrendPanel"><div className="panelHeader"><div><span className="panelKicker">PERIOD TREND</span><h3>{result.dataset.metric} over time</h3><p>{result.dataset.aggregation === "average" ? "Average" : "Total"} metric movement across every detected reporting period.</p></div></div><div className="monthlyTrendChart">{result.trend.map((item) => <div className="monthlyTrendColumn" key={item.period}><div className="monthlyTrendValue">{formatMetric(item.value)}</div><div className="monthlyTrendTrack"><span style={{ height: `${Math.max(4, Math.abs(item.value) / maxTrend * 100)}%` }} /></div><strong>{item.label.replace(/ (\d{4})$/, " '$1").replace("'20", "'")}</strong><small className={(item.change_percent ?? 0) > 0 ? "positive" : (item.change_percent ?? 0) < 0 ? "negative" : ""}>{item.change_percent == null ? "Baseline" : formatPercent(item.change_percent, true)}</small></div>)}</div></section>

            <section className="panel monthlyInsightPanel"><div className="panelHeader"><div><span className="panelKicker">DETERMINISTIC INSIGHTS</span><h3>What changed and why</h3><p>No generated narrative or external AI API — each statement is backed by arithmetic rules.</p></div></div><div className="monthlyInsightList">{result.insights.map((insight, index) => <article className={insight.tone} key={`${insight.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div></article>)}</div></section>
          </div>

          {result.drivers.length > 0 && <section className="panel monthlyDriverPanel"><div className="panelHeader"><div><span className="panelKicker">MOVEMENT DRIVERS</span><h3>{result.dataset.dimension} contribution profile</h3><p>Largest absolute movements between the selected periods.</p></div></div><div className="monthlyDriverList">{result.drivers.slice(0, 10).map((driver) => <div className="monthlyDriverRow" key={driver.value}><div><strong>{driver.value}</strong><span>{formatMetric(driver.previous)} → {formatMetric(driver.current)} · {formatPercent(driver.change_percent, true)}</span></div><div className="monthlyDriverTrack"><span className={driver.change < 0 ? "negative" : "positive"} style={{ width: `${Math.max(3, Math.abs(driver.change) / maxDriver * 100)}%` }} /></div><div className={driver.change > 0 ? "positive" : driver.change < 0 ? "negative" : ""}><strong>{driver.change >= 0 ? "+" : ""}{formatMetric(driver.change)}</strong><small>{formatNumber(driver.movement_share_percent, 1)}% of movement</small></div></div>)}</div></section>}

          <div className="monthlyQualityHeading"><div><span className="panelKicker">DATA QUALITY CENTRE</span><h2>Trust the data before you trust the chart.</h2><p>Monthly Intelligence checks completeness, duplicates, dates, schema drift, new category values, reporting gaps and unusual record volumes.</p></div><span className={`monthlyQualityStatus ${result.quality.status.toLowerCase()}`}>{result.quality.status}</span></div>

          <div className="monthlyQualityKpis"><KpiCard label="Completeness" value={`${formatNumber(result.quality.completeness_percent, 1)}%`} detail={`${formatNumber(result.quality.missing_cells)} missing cells`} tone={result.quality.completeness_percent >= 99 ? "positive" : "warn"} /><KpiCard label="Duplicate rows" value={formatNumber(result.quality.duplicate_rows)} detail="Across consolidated history" tone={result.quality.duplicate_rows ? "warn" : "positive"} /><KpiCard label="Invalid dates" value={formatNumber(result.quality.invalid_dates)} detail={result.quality.date_field || "Filename periods"} tone={result.quality.invalid_dates ? "warn" : "positive"} /><KpiCard label="Quality flags" value={formatNumber(result.quality.issue_count)} detail={`${result.quality.schema_warnings.length} schema warning(s)`} tone={result.quality.issue_count ? "warn" : "positive"} /></div>

          <div className="monthlyQualityGrid">
            <section className="panel"><div className="panelHeader compactHeader"><div><span className="panelKicker">MISSINGNESS</span><h3>Fields needing attention</h3></div></div>{result.quality.missing_by_field.length ? <div className="monthlyMissingList">{result.quality.missing_by_field.slice(0, 10).map((item) => <div key={item.field}><div><strong>{item.field}</strong><span>{formatNumber(item.missing)} missing · {formatPercent(item.missing_percent)}</span></div><div><span style={{ width: `${Math.max(1.5, item.missing_percent)}%` }} /></div></div>)}</div> : <div className="monthlyEmptyGood">✓ No missing cells detected.</div>}</section>
            <section className="panel"><div className="panelHeader compactHeader"><div><span className="panelKicker">STRUCTURAL CHECKS</span><h3>Period and schema integrity</h3></div></div><div className="monthlyCheckList"><div className={result.quality.schema_warnings.length ? "warn" : "good"}><strong>{result.quality.schema_warnings.length ? `${result.quality.schema_warnings.length} schema warning(s)` : "Schema aligned"}</strong><span>{result.quality.schema_warnings[0]?.detail ?? "Shared fields are structurally consistent across the monthly files."}</span></div><div className={result.quality.period_gaps.length ? "warn" : "good"}><strong>{result.quality.period_gaps.length ? `${result.quality.period_gaps.length} reporting gap(s)` : "No reporting gaps"}</strong><span>{result.quality.period_gaps.length ? result.quality.period_gaps.map((item) => item.label).join(", ") : "Detected monthly periods are continuous."}</span></div><div className={result.quality.row_count_anomalies.length ? "warn" : "good"}><strong>{result.quality.row_count_anomalies.length ? `${result.quality.row_count_anomalies.length} row-count anomaly(s)` : "Record volumes look stable"}</strong><span>{result.quality.row_count_anomalies[0] ? `${result.quality.row_count_anomalies[0].label} is ${formatPercent(result.quality.row_count_anomalies[0].change_percent, true)} versus its recent baseline.` : "No period differs by 35% or more from its recent baseline."}</span></div></div></section>
          </div>

          {result.quality.new_values.length > 0 && <section className="panel monthlyNewValues"><div className="panelHeader"><div><span className="panelKicker">NEW VALUES DETECTED</span><h3>Categories appearing in the current period</h3><p>Useful for spotting new products, regions, customers, status values or coding changes.</p></div></div><div className="monthlyNewValueGrid">{result.quality.new_values.slice(0, 12).map((item, index) => <div key={`${item.field}-${item.value}-${index}`}><span>{item.field}</span><strong>{item.value}</strong><small>{formatNumber(item.count)} current record{item.count === 1 ? "" : "s"}</small></div>)}</div></section>}

          <MonthlyExecutivePdfReport result={result} />

          <section className="monthlyMethod"><span className="panelKicker">HOW V3.2 WORKS</span><p>{result.method}</p></section>
        </>}
      </section>

      <footer className="siteFooter"><strong>Azhan Data Studio</strong><span>Created by Azhan Hassan · Data &amp; AI Automation Specialist</span><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View Portfolio ↗</a><a className="footerSupport" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support the project</a></footer>
    </main>
  );
}
