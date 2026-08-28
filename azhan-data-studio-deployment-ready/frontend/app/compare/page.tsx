"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

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

type KeyStats = {
  missing: number;
  non_null: number;
  unique_non_null: number;
  uniqueness_percent: number;
  duplicate_non_null: number;
};

type KeyCandidate = {
  field: string;
  score: number;
  suitable: boolean;
  previous: KeyStats;
  current: KeyStats;
};

type TypeChange = {
  field: string;
  previous_type: string;
  current_type: string;
  previous_family: string;
  current_family: string;
};

type SchemaChanges = {
  added_columns: string[];
  removed_columns: string[];
  type_changes: TypeChange[];
  common_column_count: number;
};

type CompareDatasetMeta = {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  rows: number;
  columns: number;
  sheet_name?: string | null;
};

type ComparePreparation = {
  dataset_a: CompareDatasetMeta;
  dataset_b: CompareDatasetMeta;
  common_columns: string[];
  key_candidates: KeyCandidate[];
  recommended_key?: string | null;
  schema_changes: SchemaChanges;
};

type MetricChange = {
  field: string;
  previous_sum: number;
  current_sum: number;
  sum_change: number;
  sum_change_percent?: number | null;
  previous_mean: number;
  current_mean: number;
  mean_change: number;
  mean_change_percent?: number | null;
  previous_non_null: number;
  current_non_null: number;
};

type ChangeContributor = {
  group: string;
  previous: number;
  current: number;
  change: number;
  change_percent?: number | null;
  status?: "new_group" | "removed_group" | "increase" | "decrease" | "unchanged";
  direction_role?: "supports_change" | "offsets_change" | "neutral";
  net_change_contribution_percent?: number | null;
  absolute_movement_share_percent: number;
};

type DimensionExplanation = {
  rank: number;
  dimension: string;
  explanatory_score: number;
  driver_concentration_percent: number;
  top_driver_share_percent: number;
  direction_alignment_percent: number;
  aligned_movement: number;
  offsetting_movement: number;
  absolute_movement: number;
  changed_group_count: number;
  new_group_count: number;
  removed_group_count: number;
  reconciliation_percent: number;
  primary_driver: { group: string; change: number; previous: number; current: number };
  biggest_offset?: { group: string; change: number; previous: number; current: number } | null;
  contributors: ChangeContributor[];
  summary: string;
};

type ExplainChange = {
  metric: string;
  previous_total: number;
  current_total: number;
  total_change: number;
  total_change_percent?: number | null;
  dimension: string;
  driver_concentration_percent: number;
  direction_alignment_percent: number;
  aligned_movement: number;
  offsetting_movement: number;
  dimensions_scanned: number;
  contributors: ChangeContributor[];
  dimensions: DimensionExplanation[];
  story_points: Array<{ label: string; value: string; detail: string; tone: string }>;
  summary: string;
  caveat: string;
};

type ChangedRecord = {
  key: string;
  changed_field_count: number;
  changes: Array<{ field: string; before: unknown; after: unknown }>;
};

type CompareResult = {
  dataset_a: CompareDatasetMeta;
  dataset_b: CompareDatasetMeta;
  summary: {
    previous_rows: number;
    current_rows: number;
    row_change: number;
    row_change_percent?: number | null;
    added_records: number;
    removed_records: number;
    modified_records: number;
    unchanged_records: number;
    matching_records: number;
    match_percent: number;
    modified_percent: number;
  };
  key: { field: string; previous: KeyStats; current: KeyStats };
  schema_changes: SchemaChanges;
  metric_changes: MetricChange[];
  explain_changes: ExplainChange[];
  highlights: Array<{ type: string; title: string; detail: string }>;
  changed_records: ChangedRecord[];
  added_preview: Record<string, unknown>[];
  removed_preview: Record<string, unknown>[];
  preview_limits: { changed_records: number; added_records: number; removed_records: number };
  method: string;
  note: string;
};

type RecordTab = "modified" | "added" | "removed";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const COMPARE_MAX_BYTES = 20 * 1024 * 1024;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-AU").format(value);
}

function formatDecimal(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: digits }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatDecimal(value, digits)}%`;
}

function formatSigned(value: number, digits = 1) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatDecimal(value, digits)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") return formatDecimal(value, 2);
  return String(value);
}

function DataStudioMark() {
  return (
    <span className="dataStudioMark" aria-hidden="true">
      <span className="dataStudioA">A</span>
      <span className="dataStudioBars"><i /><i /><i /></span>
    </span>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "warn" | "info" }) {
  return <div className={`compareMetric compareMetric-${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function FilePicker({
  label,
  eyebrow,
  file,
  workbook,
  selectedSheet,
  loadingWorkbook,
  onFile,
  onSheet,
}: {
  label: string;
  eyebrow: string;
  file: File | null;
  workbook: WorkbookInfo | null;
  selectedSheet: string;
  loadingWorkbook: boolean;
  onFile: (file: File | undefined) => void;
  onSheet: (sheet: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <section className="compareFileCard">
      <div className="compareFileHeading"><span>{eyebrow}</span><h3>{label}</h3></div>
      <button type="button" className={`compareDropzone ${file ? "hasFile" : ""}`} onClick={() => ref.current?.click()}>
        <input
          ref={ref}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <span className="compareUploadIcon">↑</span>
        <span className="compareDropCopy">
          <strong>{file ? file.name : "Choose CSV or Excel file"}</strong>
          <small>{file ? `${formatBytes(file.size)} · click to replace` : "CSV / XLSX · max 20 MB for Compare"}</small>
        </span>
      </button>
      {loadingWorkbook && <div className="compareMiniStatus">Reading workbook sheets…</div>}
      {workbook && (
        <label className="compareSheetField">
          <span>Sheet</span>
          <select value={selectedSheet} onChange={(event) => onSheet(event.target.value)}>
            {workbook.sheets.filter((sheet) => sheet.analysis_ready).map((sheet) => (
              <option key={sheet.name} value={sheet.name}>{sheet.name} · {formatNumber(sheet.rows)} rows</option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

export default function ComparePage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [workbookA, setWorkbookA] = useState<WorkbookInfo | null>(null);
  const [workbookB, setWorkbookB] = useState<WorkbookInfo | null>(null);
  const [sheetA, setSheetA] = useState("");
  const [sheetB, setSheetB] = useState("");
  const [loadingWorkbookA, setLoadingWorkbookA] = useState(false);
  const [loadingWorkbookB, setLoadingWorkbookB] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [preparation, setPreparation] = useState<ComparePreparation | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState("");
  const [recordTab, setRecordTab] = useState<RecordTab>("modified");
  const [selectedExplainMetric, setSelectedExplainMetric] = useState("");
  const [selectedExplainDimension, setSelectedExplainDimension] = useState("");

  const selectedCandidate = useMemo(
    () => preparation?.key_candidates.find((item) => item.field === selectedKey) ?? null,
    [preparation, selectedKey],
  );
  const selectedExplanation = useMemo(
    () => result?.explain_changes?.find((item) => item.metric === selectedExplainMetric) ?? result?.explain_changes?.[0] ?? null,
    [result, selectedExplainMetric],
  );
  const selectedDimensionExplanation = useMemo(
    () => selectedExplanation?.dimensions?.find((item) => item.dimension === selectedExplainDimension) ?? selectedExplanation?.dimensions?.[0] ?? null,
    [selectedExplanation, selectedExplainDimension],
  );

  function resetComparison() {
    setPreparation(null);
    setResult(null);
    setSelectedKey("");
    setRecordTab("modified");
    setSelectedExplainMetric("");
    setSelectedExplainDimension("");
    setError("");
  }

  async function loadWorkbook(file: File, side: "a" | "b") {
    const setLoading = side === "a" ? setLoadingWorkbookA : setLoadingWorkbookB;
    const setWorkbook = side === "a" ? setWorkbookA : setWorkbookB;
    const setSheet = side === "a" ? setSheetA : setSheetB;
    setLoading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_URL}/api/datasets/workbook`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Unable to inspect workbook.");
      const workbook = payload.workbook as WorkbookInfo;
      setWorkbook(workbook);
      setSheet(workbook.recommended_sheet ?? workbook.sheets.find((sheet) => sheet.analysis_ready)?.name ?? "");
    } catch (err) {
      setWorkbook(null);
      setSheet("");
      setError(err instanceof Error ? err.message : "Unable to inspect workbook.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseCompareFile(selected: File | undefined, side: "a" | "b") {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      setError("Dataset Compare accepts CSV and Excel (.xlsx) files only.");
      return;
    }
    if (selected.size > COMPARE_MAX_BYTES) {
      setError("Dataset Compare currently limits each file to 20 MB.");
      return;
    }

    resetComparison();
    if (side === "a") {
      setFileA(selected);
      setWorkbookA(null);
      setSheetA("");
    } else {
      setFileB(selected);
      setWorkbookB(null);
      setSheetB("");
    }
    if (extension === "xlsx") await loadWorkbook(selected, side);
  }

  function appendFiles(body: FormData) {
    if (!fileA || !fileB) throw new Error("Choose both datasets first.");
    body.append("file_a", fileA);
    body.append("file_b", fileB);
    if (fileA.name.toLowerCase().endsWith(".xlsx") && sheetA) body.append("sheet_name_a", sheetA);
    if (fileB.name.toLowerCase().endsWith(".xlsx") && sheetB) body.append("sheet_name_b", sheetB);
  }

  async function prepare() {
    if (!fileA || !fileB) {
      setError("Choose a Previous / Baseline file and a Current / New file.");
      return;
    }
    setPreparing(true);
    setError("");
    setResult(null);
    try {
      const body = new FormData();
      appendFiles(body);
      const response = await fetch(`${API_URL}/api/datasets/compare/prepare`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Unable to prepare this comparison.");
      const typed = payload as ComparePreparation;
      setPreparation(typed);
      setSelectedKey(typed.recommended_key ?? typed.key_candidates[0]?.field ?? "");
    } catch (err) {
      setPreparation(null);
      setSelectedKey("");
      setError(err instanceof Error ? err.message : "Unable to prepare this comparison.");
    } finally {
      setPreparing(false);
    }
  }

  async function compare() {
    if (!preparation || !selectedKey) return;
    setComparing(true);
    setError("");
    try {
      const body = new FormData();
      appendFiles(body);
      body.append("key", selectedKey);
      const response = await fetch(`${API_URL}/api/datasets/compare`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Unable to compare these datasets.");
      const typed = payload as CompareResult;
      setResult(typed);
      setSelectedExplainMetric(typed.explain_changes?.[0]?.metric ?? "");
      setSelectedExplainDimension(typed.explain_changes?.[0]?.dimensions?.[0]?.dimension ?? "");
      window.setTimeout(() => document.getElementById("comparison-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to compare these datasets.");
    } finally {
      setComparing(false);
    }
  }

  const addedColumns = result?.schema_changes.added_columns ?? preparation?.schema_changes.added_columns ?? [];
  const removedColumns = result?.schema_changes.removed_columns ?? preparation?.schema_changes.removed_columns ?? [];
  const typeChanges = result?.schema_changes.type_changes ?? preparation?.schema_changes.type_changes ?? [];

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Azhan Data Studio home">
          <DataStudioMark />
          <span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span>
        </a>
        <div className="topbarActions">
          <a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer" aria-label="View Azhan Hassan portfolio">
            <span className="creatorLabel">CREATED BY</span>
            <span className="creatorName">Azhan Hassan</span>
            <span className="creatorRole">Data &amp; AI Automation Specialist</span>
            <span className="portfolioCta">View Portfolio ↗</span>
          </a>
          <a className="supportTopButton" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support</a>
        </div>
      </header>

      <nav className="studioModeBar" aria-label="Choose analysis mode">
        <div className="studioModeInner">
          <a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
          <a className="studioModeTab active" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
          <a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span><em>NEW</em></a>
        </div>
      </nav>

      <section className="compareHero">
        <div className="compareHeroInner">
          <div className="compareHeroCopy">
            <span className="panelKicker">DATASET COMPARE · NEW ANALYSIS TOOL</span>
            <h1>See exactly what changed.</h1>
            <p>Compare two CSV or Excel datasets by a unique business key. Azhan Data Studio identifies added, removed, modified and unchanged records, then measures schema and metric movement.</p>
            <div className="compareTrustRow"><span>Deterministic comparison</span><span>Up to 20 MB per file</span><span>Files are processed for the request</span></div>
          </div>
          <a className="compareBackLink" href="/">← Analyse a single dataset</a>
        </div>
      </section>

      <section className="compareShell">
        <div className="compareStepHeading"><span>01</span><div><small>SELECT VERSIONS</small><h2>Choose the two datasets</h2><p>Use Previous / Baseline for the older version and Current / New for the version you want to compare against it.</p></div></div>

        <div className="compareFileGrid">
          <FilePicker
            label="Previous / Baseline"
            eyebrow="DATASET A"
            file={fileA}
            workbook={workbookA}
            selectedSheet={sheetA}
            loadingWorkbook={loadingWorkbookA}
            onFile={(file) => void chooseCompareFile(file, "a")}
            onSheet={(sheet) => { setSheetA(sheet); resetComparison(); }}
          />
          <div className="compareVs">VS</div>
          <FilePicker
            label="Current / New"
            eyebrow="DATASET B"
            file={fileB}
            workbook={workbookB}
            selectedSheet={sheetB}
            loadingWorkbook={loadingWorkbookB}
            onFile={(file) => void chooseCompareFile(file, "b")}
            onSheet={(sheet) => { setSheetB(sheet); resetComparison(); }}
          />
        </div>

        <div className="comparePrepareBar">
          <div><strong>Ready to map the files?</strong><span>We’ll detect shared columns and recommend a reliable matching key.</span></div>
          <button className="primaryButton comparePrimary" disabled={!fileA || !fileB || preparing || loadingWorkbookA || loadingWorkbookB || (fileA?.name.toLowerCase().endsWith(".xlsx") && !sheetA) || (fileB?.name.toLowerCase().endsWith(".xlsx") && !sheetB)} onClick={() => void prepare()}>
            {preparing ? "Preparing comparison…" : preparation ? "Refresh preparation" : "Prepare comparison"}
          </button>
        </div>

        {error && <div className="errorBox compareError">{error}</div>}

        {preparation && (
          <section className="compareSetupPanel">
            <div className="compareStepHeading compact"><span>02</span><div><small>MATCH RECORDS</small><h2>Choose the comparison key</h2><p>The key must identify one row uniquely in both datasets. Dataset Compare uses one key field; composite keys come later.</p></div></div>

            <div className="comparePrepMetrics">
              <MetricCard label="Previous rows" value={formatNumber(preparation.dataset_a.rows)} />
              <MetricCard label="Current rows" value={formatNumber(preparation.dataset_b.rows)} />
              <MetricCard label="Shared fields" value={formatNumber(preparation.common_columns.length)} />
              <MetricCard label="Schema changes" value={formatNumber(addedColumns.length + removedColumns.length + typeChanges.length)} />
            </div>

            {preparation.common_columns.length === 0 ? (
              <div className="compareNoCommon">These files do not share any column names, so Dataset Compare cannot match records yet. Align at least one key field between the two files and prepare again.</div>
            ) : (
            <div className="compareKeyArea">
              <label className="compareKeySelect">
                <span>Comparison key</span>
                <select value={selectedKey} onChange={(event) => { setSelectedKey(event.target.value); setResult(null); }}>
                  {preparation.key_candidates.map((candidate) => (
                    <option key={candidate.field} value={candidate.field}>{candidate.field}{candidate.field === preparation.recommended_key ? " · Recommended" : ""}</option>
                  ))}
                </select>
              </label>

              {selectedCandidate && (
                <div className={`keyHealth ${selectedCandidate.suitable ? "good" : "warn"}`}>
                  <strong>{selectedCandidate.suitable ? "✓ Suitable unique key" : "⚠ Check this key"}</strong>
                  <span>Previous: {formatDecimal(selectedCandidate.previous.uniqueness_percent, 1)}% unique · {selectedCandidate.previous.missing} missing</span>
                  <span>Current: {formatDecimal(selectedCandidate.current.uniqueness_percent, 1)}% unique · {selectedCandidate.current.missing} missing</span>
                  {!selectedCandidate.suitable && <small>Comparison will only run when the key has no missing values and no duplicate records in either dataset.</small>}
                </div>
              )}

              <button className="primaryButton compareRunButton" disabled={!selectedKey || comparing || !selectedCandidate?.suitable} onClick={() => void compare()}>
                {comparing ? "Comparing datasets…" : "Compare datasets"}
              </button>
            </div>
            )}

            {(addedColumns.length > 0 || removedColumns.length > 0 || typeChanges.length > 0) && (
              <div className="schemaPreview">
                <div><span>Added fields</span><strong>{addedColumns.length}</strong><small>{addedColumns.slice(0, 5).join(", ") || "None"}</small></div>
                <div><span>Removed fields</span><strong>{removedColumns.length}</strong><small>{removedColumns.slice(0, 5).join(", ") || "None"}</small></div>
                <div><span>Type changes</span><strong>{typeChanges.length}</strong><small>{typeChanges.slice(0, 4).map((item) => item.field).join(", ") || "None"}</small></div>
              </div>
            )}
          </section>
        )}

        {result && (
          <section className="compareResults" id="comparison-results">
            <div className="compareStepHeading"><span>03</span><div><small>COMPARISON RESULTS</small><h2>{result.dataset_a.filename} → {result.dataset_b.filename}</h2><p>Matched using <strong>{result.key.field}</strong>. The results below are calculated directly from the two uploaded versions.</p></div></div>

            <div className="compareSummaryGrid">
              <MetricCard label="Added" value={`+${formatNumber(result.summary.added_records)}`} tone="good" />
              <MetricCard label="Removed" value={`−${formatNumber(result.summary.removed_records)}`} tone="warn" />
              <MetricCard label="Modified" value={formatNumber(result.summary.modified_records)} tone="info" />
              <MetricCard label="Unchanged" value={formatNumber(result.summary.unchanged_records)} />
              <MetricCard label="Row change" value={`${formatSigned(result.summary.row_change, 0)} (${formatPercent(result.summary.row_change_percent)})`} />
              <MetricCard label="Key match" value={`${formatDecimal(result.summary.match_percent, 1)}%`} />
            </div>

            <div className="compareHighlights">
              {result.highlights.map((item, index) => (
                <article key={`${item.type}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>
              ))}
            </div>

            <div className="compareVisualGrid">
              <section className="panel compareVisualPanel">
                <div className="panelHeader"><div><span className="panelKicker">CHANGE PROFILE</span><h3>Record movement</h3><p>A quick visual split of the union of both dataset keys.</p></div></div>
                {(() => {
                  const total = Math.max(result.summary.added_records + result.summary.removed_records + result.summary.modified_records + result.summary.unchanged_records, 1);
                  const segments = [
                    { label: "Added", value: result.summary.added_records, className: "added" },
                    { label: "Removed", value: result.summary.removed_records, className: "removed" },
                    { label: "Modified", value: result.summary.modified_records, className: "modified" },
                    { label: "Unchanged", value: result.summary.unchanged_records, className: "unchanged" },
                  ];
                  return <><div className="recordMovementBar">{segments.map((segment) => <span key={segment.label} className={segment.className} style={{ width: `${(segment.value / total) * 100}%` }} title={`${segment.label}: ${segment.value}`} />)}</div><div className="recordMovementLegend">{segments.map((segment) => <div key={segment.label}><i className={segment.className} /><span>{segment.label}</span><strong>{formatNumber(segment.value)}</strong><small>{formatDecimal((segment.value / total) * 100, 1)}%</small></div>)}</div></>;
                })()}
              </section>

              <section className="panel compareVisualPanel">
                <div className="panelHeader"><div><span className="panelKicker">METRIC MOVEMENT</span><h3>Largest percentage changes</h3><p>Top shared numeric measures ranked by absolute percentage movement.</p></div></div>
                {result.metric_changes.length ? <div className="metricMovementList">{result.metric_changes.slice(0, 6).map((metric) => {
                  const maxPct = Math.max(...result.metric_changes.slice(0, 6).map((item) => Math.abs(item.sum_change_percent ?? 0)), 1);
                  const pct = metric.sum_change_percent ?? 0;
                  return <div className="metricMovementRow" key={metric.field}><div className="metricMovementLabel"><strong>{metric.field}</strong><span className={pct > 0 ? "positive" : pct < 0 ? "negative" : ""}>{formatPercent(metric.sum_change_percent)}</span></div><div className="metricMovementTrack"><span className={pct < 0 ? "negative" : "positive"} style={{ width: `${Math.max(2, Math.abs(pct) / maxPct * 100)}%` }} /></div><small>{formatDecimal(metric.previous_sum, 1)} → {formatDecimal(metric.current_sum, 1)}</small></div>;
                })}</div> : <div className="emptyState">No shared numeric measures were available.</div>}
              </section>
            </div>

            {result.explain_changes?.length > 0 && selectedExplanation && selectedDimensionExplanation && (
              <section className="panel explainChangePanel explainV2Panel">
                <div className="explainChangeHeader">
                  <div><span className="panelKicker">EXPLAIN CHANGE V2</span><h3>What really drove the movement?</h3><p>Ranked arithmetic driver analysis across multiple shared business dimensions.</p></div>
                  <label><span>Metric</span><select value={selectedExplanation.metric} onChange={(event) => {
                    const metric = event.target.value;
                    setSelectedExplainMetric(metric);
                    const next = result.explain_changes.find((item) => item.metric === metric);
                    setSelectedExplainDimension(next?.dimensions?.[0]?.dimension ?? "");
                  }}>{result.explain_changes.map((item) => <option key={item.metric} value={item.metric}>{item.metric}</option>)}</select></label>
                </div>

                <div className="explainHeroRow">
                  <div className="explainMetricMove"><span>{selectedExplanation.metric}</span><strong className={selectedExplanation.total_change > 0 ? "positive" : selectedExplanation.total_change < 0 ? "negative" : ""}>{formatSigned(selectedExplanation.total_change, 2)}</strong><small>{formatDecimal(selectedExplanation.previous_total, 2)} → {formatDecimal(selectedExplanation.current_total, 2)} · {formatPercent(selectedExplanation.total_change_percent)}</small></div>
                  <div className="explainNarrative"><span>CHANGE STORY</span><strong>{selectedDimensionExplanation.dimension} ranks #{selectedDimensionExplanation.rank}</strong><p>{selectedDimensionExplanation.summary}</p><small>{selectedExplanation.dimensions_scanned} candidate dimensions scanned · reconciliation {formatDecimal(selectedDimensionExplanation.reconciliation_percent, 1)}%</small></div>
                </div>

                <div className="explainStoryGrid">
                  <article><span>PRIMARY DRIVER</span><strong>{selectedDimensionExplanation.primary_driver.group}</strong><em className={selectedDimensionExplanation.primary_driver.change > 0 ? "positive" : "negative"}>{formatSigned(selectedDimensionExplanation.primary_driver.change, 2)}</em><small>largest movement aligned with the overall change</small></article>
                  <article><span>DRIVER CONCENTRATION</span><strong>{formatDecimal(selectedDimensionExplanation.driver_concentration_percent, 1)}%</strong><small>of absolute movement sits in the top 3 groups</small></article>
                  <article><span>DIRECTION ALIGNMENT</span><strong>{formatDecimal(selectedDimensionExplanation.direction_alignment_percent, 1)}%</strong><small>of movement supports the overall direction</small></article>
                  <article><span>BIGGEST OFFSET</span><strong>{selectedDimensionExplanation.biggest_offset?.group ?? "No material offset"}</strong>{selectedDimensionExplanation.biggest_offset ? <em className={selectedDimensionExplanation.biggest_offset.change > 0 ? "positive" : "negative"}>{formatSigned(selectedDimensionExplanation.biggest_offset.change, 2)}</em> : null}<small>largest group moving against the overall direction</small></article>
                </div>

                <div className="dimensionRankSection">
                  <div className="dimensionRankHeading"><div><span className="panelKicker">DIMENSION RANKING</span><h4>Which lens best explains the change?</h4></div><small>Score blends direction alignment, driver concentration and signal compactness.</small></div>
                  <div className="dimensionRankTabs">{selectedExplanation.dimensions.map((item) => (
                    <button key={item.dimension} className={selectedDimensionExplanation.dimension === item.dimension ? "active" : ""} onClick={() => setSelectedExplainDimension(item.dimension)}>
                      <span>#{item.rank}</span><strong>{item.dimension}</strong><em>{formatDecimal(item.explanatory_score, 0)}/100</em>
                    </button>
                  ))}</div>
                </div>

                <div className="driverBalanceWrap">
                  <div className="driverBalanceHeader"><div><span className="panelKicker">DRIVER BALANCE</span><h4>{selectedDimensionExplanation.dimension} contribution profile</h4></div><p>{selectedDimensionExplanation.summary}</p></div>
                  {(() => {
                    const totalMovement = Math.max(selectedDimensionExplanation.aligned_movement + selectedDimensionExplanation.offsetting_movement, 0.000001);
                    const alignedPct = (selectedDimensionExplanation.aligned_movement / totalMovement) * 100;
                    const offsetPct = (selectedDimensionExplanation.offsetting_movement / totalMovement) * 100;
                    return <div className="driverBalance"><div className="driverBalanceBar"><span className="aligned" style={{ width: `${alignedPct}%` }} /><span className="offset" style={{ width: `${offsetPct}%` }} /></div><div className="driverBalanceLegend"><span><i className="aligned" />Aligned movement <strong>{formatDecimal(alignedPct, 1)}%</strong></span><span><i className="offset" />Offsetting movement <strong>{formatDecimal(offsetPct, 1)}%</strong></span><span>Changed groups <strong>{selectedDimensionExplanation.changed_group_count}</strong></span>{selectedDimensionExplanation.new_group_count > 0 ? <span>New groups <strong>{selectedDimensionExplanation.new_group_count}</strong></span> : null}{selectedDimensionExplanation.removed_group_count > 0 ? <span>Removed groups <strong>{selectedDimensionExplanation.removed_group_count}</strong></span> : null}</div></div>;
                  })()}
                </div>

                <div className="driverList driverListV2">{selectedDimensionExplanation.contributors.map((driver) => {
                  const maxAbs = Math.max(...selectedDimensionExplanation.contributors.map((item) => Math.abs(item.change)), 1);
                  const statusLabel = driver.status === "new_group" ? "New group" : driver.status === "removed_group" ? "Removed group" : driver.direction_role === "offsets_change" ? "Offsets change" : "Supports change";
                  return <div className="driverRow" key={driver.group}><div className="driverLabel"><div><strong>{driver.group}</strong><em className={driver.direction_role === "offsets_change" ? "offset" : "support"}>{statusLabel}</em></div><span>{formatDecimal(driver.previous, 1)} → {formatDecimal(driver.current, 1)}{driver.change_percent != null ? ` · ${formatPercent(driver.change_percent)}` : ""}</span></div><div className="driverTrack"><span className={driver.change < 0 ? "negative" : "positive"} style={{ width: `${Math.max(3, Math.abs(driver.change) / maxAbs * 100)}%` }} /></div><div className={`driverValue ${driver.change > 0 ? "positive" : driver.change < 0 ? "negative" : ""}`}><strong>{formatSigned(driver.change, 2)}</strong><small>{formatDecimal(driver.absolute_movement_share_percent, 1)}% of absolute movement</small></div></div>;
                })}</div>
                <div className="explainCaveat"><strong>How to read this:</strong> {selectedExplanation.caveat}</div>
              </section>
            )}

            <div className="compareResultGrid">
              <section className="panel compareMetricPanel">
                <div className="panelHeader"><div><span className="panelKicker">NUMERIC MOVEMENT</span><h3>Metric changes</h3><p>Totals and averages for numeric fields shared by both datasets.</p></div></div>
                {result.metric_changes.length ? (
                  <div className="tableWrap compareTableWrap">
                    <table className="compareTable">
                      <thead><tr><th>Metric</th><th>Previous total</th><th>Current total</th><th>Change</th><th>Change %</th><th>Mean change</th></tr></thead>
                      <tbody>{result.metric_changes.map((metric) => (
                        <tr key={metric.field}>
                          <td><strong>{metric.field}</strong></td>
                          <td>{formatDecimal(metric.previous_sum, 2)}</td>
                          <td>{formatDecimal(metric.current_sum, 2)}</td>
                          <td className={metric.sum_change > 0 ? "positive" : metric.sum_change < 0 ? "negative" : ""}>{formatSigned(metric.sum_change, 2)}</td>
                          <td className={(metric.sum_change_percent ?? 0) > 0 ? "positive" : (metric.sum_change_percent ?? 0) < 0 ? "negative" : ""}>{formatPercent(metric.sum_change_percent)}</td>
                          <td>{formatSigned(metric.mean_change, 2)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <div className="emptyState">No shared numeric measures were available for metric comparison.</div>}
              </section>

              <section className="panel compareSchemaPanel">
                <div className="panelHeader"><div><span className="panelKicker">STRUCTURE</span><h3>Schema changes</h3><p>Fields that appeared, disappeared or changed data type.</p></div></div>
                <div className="schemaChangeList">
                  <div><span className="schemaDot added" /><strong>Added fields</strong><em>{addedColumns.length}</em><p>{addedColumns.join(", ") || "No fields added."}</p></div>
                  <div><span className="schemaDot removed" /><strong>Removed fields</strong><em>{removedColumns.length}</em><p>{removedColumns.join(", ") || "No fields removed."}</p></div>
                  <div><span className="schemaDot changed" /><strong>Type changes</strong><em>{typeChanges.length}</em><p>{typeChanges.length ? typeChanges.map((item) => `${item.field}: ${item.previous_type} → ${item.current_type}`).join(" · ") : "No type changes."}</p></div>
                </div>
              </section>
            </div>

            <section className="panel compareRecordsPanel">
              <div className="panelHeader"><div><span className="panelKicker">RECORD-LEVEL EVIDENCE</span><h3>What changed row by row</h3><p>Inspect modified records or preview rows that were added and removed.</p></div></div>
              <div className="compareRecordTabs">
                <button className={recordTab === "modified" ? "active" : ""} onClick={() => setRecordTab("modified")}>Modified <span>{formatNumber(result.summary.modified_records)}</span></button>
                <button className={recordTab === "added" ? "active" : ""} onClick={() => setRecordTab("added")}>Added <span>{formatNumber(result.summary.added_records)}</span></button>
                <button className={recordTab === "removed" ? "active" : ""} onClick={() => setRecordTab("removed")}>Removed <span>{formatNumber(result.summary.removed_records)}</span></button>
              </div>

              {recordTab === "modified" && (
                result.changed_records.length ? <div className="changedRecordList">{result.changed_records.map((record, index) => (
                  <details key={`${record.key}-${index}`} className="changedRecord">
                    <summary><span className="changedKey">{result.key.field}: <strong>{record.key}</strong></span><span>{record.changed_field_count} field{record.changed_field_count === 1 ? "" : "s"} changed</span></summary>
                    <div className="fieldChangeTable"><div className="fieldChangeHead"><span>Field</span><span>Previous</span><span>Current</span></div>{record.changes.map((change) => (
                      <div className="fieldChangeRow" key={`${record.key}-${change.field}`}><strong>{change.field}</strong><span>{displayValue(change.before)}</span><span>{displayValue(change.after)}</span></div>
                    ))}</div>
                  </details>
                ))}</div> : <div className="emptyState">No modified matching records were detected.</div>
              )}

              {recordTab !== "modified" && (() => {
                const rows = recordTab === "added" ? result.added_preview : result.removed_preview;
                const columns = rows.length ? Object.keys(rows[0]) : [];
                return rows.length ? (
                  <div className="tableWrap compareTableWrap"><table className="compareTable"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{displayValue(row[column])}</td>)}</tr>)}</tbody></table></div>
                ) : <div className="emptyState">No {recordTab} records were detected.</div>;
              })()}
            </section>

            <section className="panel supportPanel" id="support">
              <div className="supportPanelCopy"><span className="panelKicker">INDEPENDENTLY BUILT</span><h3>Did Dataset Compare save you time?</h3><p>Azhan Data Studio stays free to use. If this comparison helped you, you can support continued development with a one-time contribution.</p></div>
              <div className="supportPanelAction">
                {SUPPORT_URL ? <a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support development</a> : <span className="supportPending">Stripe support link coming soon</span>}
                <small>{SUPPORT_URL ? "Optional · secure checkout handled by Stripe" : "Add NEXT_PUBLIC_SUPPORT_URL to activate checkout"}</small>
              </div>
            </section>

            <div className="compareMethodNote"><strong>How this comparison works</strong><span>{result.method} {result.note}</span></div>
          </section>
        )}
      </section>

      <footer className="siteFooter"><strong>Azhan Data Studio</strong><span>Created by Azhan Hassan · Data &amp; AI Automation Specialist</span><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View Portfolio ↗</a><a className="footerSupport" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support the project</a></footer>
    </main>
  );
}
