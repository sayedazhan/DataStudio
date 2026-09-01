"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type TopValue = {
  value: string;
  count: number;
  percent: number;
};

type FieldProfile = {
  row_count: number;
  non_null_count: number;
  missing_count: number;
  missing_percent: number;
  unique_non_null: number;
  uniqueness_percent: number;
  minimum?: number | null;
  maximum?: number | null;
  mean?: number | null;
  median?: number | null;
  std_dev?: number | null;
  q1?: number | null;
  q3?: number | null;
  iqr?: number | null;
  outlier_count_iqr?: number;
  zero_count?: number;
  negative_count?: number;
  percentage_scale?: "fraction" | "percent";
  top_values?: TopValue[];
  average_length?: number | null;
  min_length?: number | null;
  max_length?: number | null;
  earliest?: string | null;
  latest?: string | null;
  range_days?: number | null;
  true_count?: number;
  false_count?: number;
  true_percent?: number;
  repeated_value_count?: number;
};

type SchemaField = {
  name: string;
  data_type: string;
  semantic_role: string;
  semantic_confidence: number;
  semantic_reason: string;
  polars_type: string;
  missing_count: number;
  missing_percent: number;
  unique_count: number;
  key_signal: string;
  profile: FieldProfile;
};

type InsightEvidence = {
  label: string;
  value: string;
};

type RankingComponents = {
  impact: number;
  confidence: number;
  unusualness: number;
  coverage: number;
  relevance: number;
  reason: string;
  override_reason?: string | null;
};

type VisualizationBar = {
  label: string;
  value: number;
  count?: number;
  highlight?: boolean;
};

type VisualizationPoint = {
  label?: string;
  value?: number;
  x?: number;
  y?: number;
};

type VisualizationCell = {
  x: string;
  y: string;
  value: number;
};

type VisualizationBox = {
  minimum: number;
  maximum: number;
  q1: number;
  median: number;
  q3: number;
  whisker_min: number;
  whisker_max: number;
  lower_fence: number;
  upper_fence: number;
  outliers: number[];
};

type VisualizationSpec = {
  kind: "line" | "scatter" | "bar" | "box" | "quality" | "histogram" | "heatmap";
  title: string;
  subtitle: string;
  x_label?: string;
  y_label?: string;
  value_format?: "number" | "percent" | "percent_fraction";
  x_format?: "number" | "percent" | "percent_fraction";
  y_format?: "number" | "percent" | "percent_fraction";
  points?: VisualizationPoint[];
  bars?: VisualizationBar[];
  box?: VisualizationBox;
  regression?: { x1: number; y1: number; x2: number; y2: number } | null;
  x_labels?: string[];
  y_labels?: string[];
  cells?: VisualizationCell[];
  selection_reason: string;
};

type InsightFinding = {
  id: string;
  type: "trend" | "correlation" | "group_difference" | "outcome_difference" | "top_performer" | "contribution" | "distribution" | "volatility" | "rare_category" | "anomaly" | "data_quality" | "concentration";
  title: string;
  summary: string;
  signal_strength: number;
  strength_label: string;
  confidence: number;
  fields: string[];
  evidence: InsightEvidence[];
  recommended_visual: string;
  direction?: string | null;
  insight_score: number;
  priority: "critical" | "high" | "medium" | "low";
  ranking: RankingComponents;
  visualization?: VisualizationSpec | null;
};

type RankingResult = {
  weights: Record<"impact" | "confidence" | "unusualness" | "coverage" | "relevance", number>;
  priority_counts: Record<string, number>;
  top_findings: InsightFinding[];
  ranked_findings: InsightFinding[];
  method: string;
  note: string;
};

type VisualGalleryItem = {
  id: string;
  category: "trends" | "relationships" | "categories" | "distributions" | "quality" | "other";
  score: number;
  linked_insight_id?: string | null;
  visualization: VisualizationSpec;
};

type DiscoveryResult = {
  total_findings: number;
  type_counts: Record<string, number>;
  featured_findings: InsightFinding[];
  findings: InsightFinding[];
  modules_run: string[];
  visual_gallery: VisualGalleryItem[];
  ranking: RankingResult;
  note: string;
};

type InspectionResult = {
  dataset: {
    filename: string;
    file_type: string;
    file_size_bytes: number;
    rows: number;
    columns: number;
    sheet_name?: string | null;
  };
  quality: {
    missing_values: number;
    duplicate_rows: number;
    completeness_percent: number;
  };
  understanding: {
    role_counts: Record<string, number>;
    average_semantic_confidence: number;
  };
  discovery: DiscoveryResult;
  schema: SchemaField[];
  preview: Record<string, unknown>[];
};

type ProfileMetric = {
  label: string;
  value: string;
};

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const PORTFOLIO_URL = "https://syedazhan.netlify.app/";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-AU").format(value);
}

function formatDecimal(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${formatDecimal(value, digits)}%`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function safeFileStem(filename: string) {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  return withoutExtension.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "dataset";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function canvasLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 4 && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
  return `${clipped}…`;
}

function downloadVisualizationPng(spec: VisualizationSpec, filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const ink = "#17202a";
  const muted = "#667085";
  const grid = "#e4e9ef";
  const blue = "#2f6fed";
  const red = "#d71920";
  const soft = "#f5f7fa";
  const left = 150;
  const top = 240;
  const width = 1300;
  const height = 520;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, canvas.width, 12);
  ctx.fillStyle = ink;
  ctx.font = "700 46px Arial";
  ctx.fillText(canvasLabel(ctx, spec.title, 1370), 100, 92);
  ctx.fillStyle = muted;
  ctx.font = "24px Arial";
  ctx.fillText(canvasLabel(ctx, spec.subtitle || "Automatically generated analytical view", 1370), 100, 136);
  ctx.fillStyle = soft;
  ctx.fillRect(100, 180, 1400, 620);

  const drawNoData = () => {
    ctx.fillStyle = muted;
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No chart data available", 800, 500);
    ctx.textAlign = "left";
  };

  if (spec.kind === "bar" || spec.kind === "quality") {
    const bars = (spec.bars ?? []).slice(0, 12);
    if (!bars.length) drawNoData();
    else {
      const values = bars.map((bar) => bar.value);
      const min = Math.min(0, ...values);
      const max = Math.max(0, ...values);
      const span = Math.max(max - min, 1e-9);
      const labelW = 260;
      const valueW = 170;
      const chartW = width - labelW - valueW;
      const rowH = height / bars.length;
      const zeroX = left + labelW + ((0 - min) / span) * chartW;
      bars.forEach((bar, index) => {
        const cy = top + index * rowH + rowH * 0.5;
        const endX = left + labelW + ((bar.value - min) / span) * chartW;
        ctx.fillStyle = muted;
        ctx.font = "20px Arial";
        ctx.textAlign = "right";
        ctx.fillText(canvasLabel(ctx, bar.label, labelW - 20), left + labelW - 18, cy + 7);
        ctx.fillStyle = bar.highlight ? red : blue;
        const x = Math.min(zeroX, endX);
        const w = Math.max(3, Math.abs(endX - zeroX));
        ctx.fillRect(x, cy - Math.min(15, rowH * 0.28), w, Math.min(30, rowH * 0.56));
        ctx.fillStyle = ink;
        ctx.textAlign = "left";
        ctx.font = "700 19px Arial";
        ctx.fillText(formatVizValue(bar.value, spec.value_format), left + labelW + chartW + 20, cy + 7);
      });
      ctx.textAlign = "left";
    }
  } else if (spec.kind === "histogram") {
    const bars = spec.bars ?? [];
    if (!bars.length) drawNoData();
    else {
      const max = Math.max(...bars.map((bar) => bar.value), 1);
      const gap = 4;
      const barW = width / bars.length;
      ctx.strokeStyle = grid;
      ctx.beginPath(); ctx.moveTo(left, top + height); ctx.lineTo(left + width, top + height); ctx.stroke();
      bars.forEach((bar, index) => {
        const h = (bar.value / max) * (height - 30);
        ctx.fillStyle = blue;
        ctx.fillRect(left + index * barW + gap / 2, top + height - h, Math.max(2, barW - gap), h);
      });
    }
  } else if (spec.kind === "line") {
    const points = (spec.points ?? []).filter((point) => point.value != null) as Array<VisualizationPoint & { value: number }>;
    if (points.length < 2) drawNoData();
    else {
      const ext = niceExtent(points.map((point) => point.value));
      const px = (i: number) => left + (i / Math.max(points.length - 1, 1)) * width;
      const py = (v: number) => top + ((ext.max - v) / Math.max(ext.max - ext.min, 1e-9)) * height;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = top + (height * i) / 4;
        ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + width, y); ctx.stroke();
      }
      ctx.strokeStyle = blue;
      ctx.lineWidth = 5;
      ctx.beginPath();
      points.forEach((point, index) => index ? ctx.lineTo(px(index), py(point.value)) : ctx.moveTo(px(index), py(point.value)));
      ctx.stroke();
      ctx.fillStyle = blue;
      points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 25)) === 0).forEach((point, i) => {
        const originalIndex = Math.min(i * Math.max(1, Math.floor(points.length / 25)), points.length - 1);
        ctx.beginPath(); ctx.arc(px(originalIndex), py(point.value), 5, 0, Math.PI * 2); ctx.fill();
      });
    }
  } else if (spec.kind === "scatter") {
    const points = (spec.points ?? []).filter((point) => point.x != null && point.y != null) as Array<VisualizationPoint & { x: number; y: number }>;
    if (points.length < 3) drawNoData();
    else {
      const xExt = niceExtent(points.map((point) => point.x));
      const yExt = niceExtent(points.map((point) => point.y));
      const px = (v: number) => left + ((v - xExt.min) / Math.max(xExt.max - xExt.min, 1e-9)) * width;
      const py = (v: number) => top + ((yExt.max - v) / Math.max(yExt.max - yExt.min, 1e-9)) * height;
      ctx.fillStyle = "rgba(47,111,237,.42)";
      points.slice(0, 900).forEach((point) => { ctx.beginPath(); ctx.arc(px(point.x), py(point.y), 5, 0, Math.PI * 2); ctx.fill(); });
      if (spec.regression) {
        ctx.strokeStyle = red; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.moveTo(px(spec.regression.x1), py(spec.regression.y1)); ctx.lineTo(px(spec.regression.x2), py(spec.regression.y2)); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  } else if (spec.kind === "box") {
    const box = spec.box;
    if (!box) drawNoData();
    else {
      const ext = niceExtent([box.minimum, box.maximum, ...box.outliers]);
      const px = (v: number) => left + ((v - ext.min) / Math.max(ext.max - ext.min, 1e-9)) * width;
      const cy = top + height / 2;
      ctx.strokeStyle = muted; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px(box.whisker_min), cy); ctx.lineTo(px(box.whisker_max), cy); ctx.stroke();
      ctx.fillStyle = "#eef4ff"; ctx.strokeStyle = blue; ctx.lineWidth = 4;
      ctx.fillRect(px(box.q1), cy - 70, Math.max(3, px(box.q3) - px(box.q1)), 140);
      ctx.strokeRect(px(box.q1), cy - 70, Math.max(3, px(box.q3) - px(box.q1)), 140);
      ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px(box.median), cy - 70); ctx.lineTo(px(box.median), cy + 70); ctx.stroke();
      ctx.fillStyle = red;
      box.outliers.slice(0, 80).forEach((value, index) => { const offset = ((index % 5) - 2) * 8; ctx.beginPath(); ctx.arc(px(value), cy + offset, 6, 0, Math.PI * 2); ctx.fill(); });
    }
  } else if (spec.kind === "heatmap") {
    const xs = spec.x_labels ?? [];
    const ys = spec.y_labels ?? [];
    const cells = spec.cells ?? [];
    if (!xs.length || !ys.length || !cells.length) drawNoData();
    else {
      const labelW = 170;
      const cellW = (width - labelW) / xs.length;
      const cellH = height / ys.length;
      ctx.font = "17px Arial";
      ys.forEach((label, yi) => { ctx.fillStyle = muted; ctx.textAlign = "right"; ctx.fillText(canvasLabel(ctx, label, labelW - 20), left + labelW - 15, top + yi * cellH + cellH * .6); });
      xs.forEach((label, xi) => { ctx.fillStyle = muted; ctx.textAlign = "center"; ctx.fillText(canvasLabel(ctx, label, cellW - 8), left + labelW + xi * cellW + cellW / 2, top - 18); });
      cells.forEach((cell) => {
        const xi = xs.indexOf(cell.x); const yi = ys.indexOf(cell.y); if (xi < 0 || yi < 0) return;
        const strength = Math.min(1, Math.abs(cell.value));
        ctx.fillStyle = cell.value >= 0 ? `rgba(47,111,237,${0.16 + strength * .78})` : `rgba(215,25,32,${0.16 + strength * .78})`;
        ctx.fillRect(left + labelW + xi * cellW + 2, top + yi * cellH + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = strength > .55 ? "#ffffff" : ink; ctx.textAlign = "center"; ctx.font = "700 15px Arial";
        ctx.fillText(formatDecimal(cell.value, 2), left + labelW + xi * cellW + cellW / 2, top + yi * cellH + cellH * .6);
      });
      ctx.textAlign = "left";
    }
  } else drawNoData();

  ctx.fillStyle = muted;
  ctx.font = "18px Arial";
  ctx.fillText("Azhan Data Studio · deterministic analytics · Azhan Hassan", 100, 885);
  ctx.fillStyle = ink;
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(spec.selection_reason ? `Chart choice: ${canvasLabel(ctx, spec.selection_reason, 820)}` : "", 1500, 885);
  ctx.textAlign = "left";

  canvas.toBlob((blob) => { if (blob) downloadBlob(blob, filename); }, "image/png", 1);
  return true;
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

function insightLabel(type: InsightFinding["type"]) {
  const labels: Record<InsightFinding["type"], string> = {
    trend: "Trend",
    correlation: "Relationship",
    group_difference: "Group difference",
    anomaly: "Anomaly",
    data_quality: "Data quality",
    concentration: "Concentration",
    distribution: "Distribution",
    volatility: "Variability",
    rare_category: "Rare category",
    outcome_difference: "Outcome difference",
    top_performer: "Top performer",
    contribution: "Contribution",
  };
  return labels[type];
}

function insightIcon(type: InsightFinding["type"]) {
  const icons: Record<InsightFinding["type"], string> = {
    trend: "↗",
    correlation: "◎",
    group_difference: "≠",
    anomaly: "!",
    data_quality: "✓",
    concentration: "▦",
    distribution: "▥",
    volatility: "≈",
    rare_category: "·",
    outcome_difference: "%",
    top_performer: "★",
    contribution: "Σ",
  };
  return icons[type];
}

function priorityLabel(priority: InsightFinding["priority"]) {
  const labels: Record<InsightFinding["priority"], string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority];
}

const RANKING_LABELS: Record<keyof Pick<RankingComponents, "impact" | "confidence" | "unusualness" | "coverage" | "relevance">, string> = {
  impact: "Impact",
  confidence: "Confidence",
  unusualness: "Unusualness",
  coverage: "Coverage",
  relevance: "Relevance",
};

function percentValue(value: number | null | undefined, scale?: "fraction" | "percent") {
  if (value == null) return "—";
  return formatPercent(scale === "fraction" ? value * 100 : value);
}

function formatVizValue(value: number, format: VisualizationSpec["value_format"] | VisualizationSpec["x_format"] | VisualizationSpec["y_format"] = "number") {
  if (format === "percent_fraction") return formatPercent(value * 100, 1);
  if (format === "percent") return formatPercent(value, 1);
  return formatDecimal(value, Math.abs(value) >= 100 ? 1 : 2);
}

function niceExtent(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return { min: 0, max: 1 };
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min || 1) * 0.08;
    min -= pad;
    max += pad;
  }
  const padding = (max - min) * 0.08;
  return { min: min - padding, max: max + padding };
}

function LineVisual({ spec }: { spec: VisualizationSpec }) {
  const points = (spec.points ?? []).filter((point) => point.value != null) as Array<VisualizationPoint & { value: number }>;
  if (points.length < 2) return <div className="chartEmpty">Not enough points to draw this trend.</div>;

  const width = 760;
  const height = 286;
  const left = 58;
  const right = 22;
  const top = 20;
  const bottom = 48;
  const extent = niceExtent(points.map((point) => point.value));
  const x = (index: number) => left + (index / Math.max(points.length - 1, 1)) * (width - left - right);
  const y = (value: number) => top + ((extent.max - value) / (extent.max - extent.min)) * (height - top - bottom);
  const path = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const yTicks = [0, 1, 2, 3, 4].map((index) => extent.min + ((extent.max - extent.min) * index) / 4);
  const labelIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  return (
    <div className="svgChartWrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="autoSvg" role="img" aria-label={spec.title}>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chartGridLine" />
            <text x={left - 10} y={y(tick) + 4} textAnchor="end" className="chartAxisText">{formatVizValue(tick, spec.value_format)}</text>
          </g>
        ))}
        <polyline points={path} fill="none" className="trendLine" />
        {points.map((point, index) => (
          <circle key={`${point.label ?? index}-${index}`} cx={x(index)} cy={y(point.value)} r={index === points.length - 1 ? 4 : 2.5} className="trendDot" />
        ))}
        {labelIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 17} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="chartAxisText chartXAxisText">
            {String(points[index].label ?? index)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ScatterVisual({ spec }: { spec: VisualizationSpec }) {
  const points = (spec.points ?? []).filter((point) => point.x != null && point.y != null) as Array<VisualizationPoint & { x: number; y: number }>;
  if (points.length < 3) return <div className="chartEmpty">Not enough paired values to draw this relationship.</div>;

  const width = 760;
  const height = 300;
  const left = 62;
  const right = 24;
  const top = 20;
  const bottom = 50;
  const xExtent = niceExtent(points.map((point) => point.x));
  const yExtent = niceExtent(points.map((point) => point.y));
  const px = (value: number) => left + ((value - xExtent.min) / (xExtent.max - xExtent.min)) * (width - left - right);
  const py = (value: number) => top + ((yExtent.max - value) / (yExtent.max - yExtent.min)) * (height - top - bottom);
  const ticks = [0, 1, 2, 3, 4];

  return (
    <div className="svgChartWrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="autoSvg" role="img" aria-label={spec.title}>
        {ticks.map((index) => {
          const yValue = yExtent.min + ((yExtent.max - yExtent.min) * index) / 4;
          const xValue = xExtent.min + ((xExtent.max - xExtent.min) * index) / 4;
          return (
            <g key={index}>
              <line x1={left} x2={width - right} y1={py(yValue)} y2={py(yValue)} className="chartGridLine" />
              <line y1={top} y2={height - bottom} x1={px(xValue)} x2={px(xValue)} className="chartGridLine vertical" />
              <text x={left - 10} y={py(yValue) + 4} textAnchor="end" className="chartAxisText">{formatVizValue(yValue, spec.y_format)}</text>
              <text x={px(xValue)} y={height - 18} textAnchor="middle" className="chartAxisText">{formatVizValue(xValue, spec.x_format)}</text>
            </g>
          );
        })}
        {points.map((point, index) => (
          <circle key={index} cx={px(point.x)} cy={py(point.y)} r="3.2" className="scatterDot" />
        ))}
        {spec.regression && (
          <line
            x1={px(spec.regression.x1)}
            y1={py(spec.regression.y1)}
            x2={px(spec.regression.x2)}
            y2={py(spec.regression.y2)}
            className="regressionLine"
          />
        )}
      </svg>
      <div className="chartAxisLabels"><span>{spec.x_label}</span><span>{spec.y_label}</span></div>
    </div>
  );
}

function BarVisual({ spec }: { spec: VisualizationSpec }) {
  const bars = spec.bars ?? [];
  if (!bars.length) return <div className="chartEmpty">No grouped values are available for this visual.</div>;
  const maximum = Math.max(...bars.map((bar) => Math.abs(bar.value)), 0.000001);

  return (
    <div className="autoBarChart">
      {bars.map((bar) => (
        <div className={`autoBarRow ${bar.highlight ? "highlight" : ""}`} key={bar.label}>
          <div className="autoBarLabel" title={bar.label}>{bar.label}</div>
          <div className="autoBarTrack">
            <span className={bar.value < 0 ? "negative" : ""} style={{ width: `${Math.max(2, (Math.abs(bar.value) / maximum) * 100)}%` }} />
          </div>
          <div className="autoBarValue">
            <strong>{formatVizValue(bar.value, spec.value_format)}</strong>
            {bar.count != null && <small>{formatNumber(bar.count)} rows</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BoxVisual({ spec }: { spec: VisualizationSpec }) {
  const box = spec.box;
  if (!box) return <div className="chartEmpty">No distribution summary is available.</div>;
  const width = 760;
  const height = 215;
  const left = 52;
  const right = 28;
  const top = 42;
  const extent = niceExtent([box.minimum, box.maximum, ...box.outliers]);
  const x = (value: number) => left + ((value - extent.min) / (extent.max - extent.min)) * (width - left - right);
  const center = 98;
  const boxTop = 64;
  const boxHeight = 68;
  const ticks = [0, 1, 2, 3, 4].map((index) => extent.min + ((extent.max - extent.min) * index) / 4);

  return (
    <div className="svgChartWrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="autoSvg" role="img" aria-label={spec.title}>
        <line x1={x(box.whisker_min)} x2={x(box.whisker_max)} y1={center} y2={center} className="boxWhisker" />
        <line x1={x(box.whisker_min)} x2={x(box.whisker_min)} y1={center - 24} y2={center + 24} className="boxWhisker" />
        <line x1={x(box.whisker_max)} x2={x(box.whisker_max)} y1={center - 24} y2={center + 24} className="boxWhisker" />
        <rect x={x(box.q1)} y={boxTop} width={Math.max(2, x(box.q3) - x(box.q1))} height={boxHeight} rx="6" className="boxBody" />
        <line x1={x(box.median)} x2={x(box.median)} y1={boxTop} y2={boxTop + boxHeight} className="boxMedian" />
        {box.outliers.map((value, index) => <circle key={`${value}-${index}`} cx={x(value)} cy={center + ((index % 3) - 1) * 10} r="4" className="outlierDot" />)}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={150} y2={158} className="boxTick" />
            <text x={x(tick)} y={181} textAnchor="middle" className="chartAxisText">{formatVizValue(tick, spec.value_format)}</text>
          </g>
        ))}
        <text x={left} y={top - 14} className="boxLabel">Q1 {formatVizValue(box.q1, spec.value_format)}</text>
        <text x={width / 2} y={top - 14} textAnchor="middle" className="boxLabel">Median {formatVizValue(box.median, spec.value_format)}</text>
        <text x={width - right} y={top - 14} textAnchor="end" className="boxLabel">Q3 {formatVizValue(box.q3, spec.value_format)}</text>
      </svg>
    </div>
  );
}


function HistogramVisual({ spec }: { spec: VisualizationSpec }) {
  const bars = spec.bars ?? [];
  if (!bars.length) return <div className="chartEmpty">No distribution bins are available.</div>;
  const maximum = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <div className="histogramChart" role="img" aria-label={spec.title}>
      {bars.map((bar, index) => (
        <div className="histogramColumn" key={`${bar.label}-${index}`} title={`${bar.label}: ${formatNumber(bar.count ?? bar.value)}`}>
          <div className="histogramBar" style={{ height: `${Math.max(3, (bar.value / maximum) * 100)}%` }} />
          {(index === 0 || index === bars.length - 1 || index === Math.floor(bars.length / 2)) && <span>{bar.label}</span>}
        </div>
      ))}
    </div>
  );
}

function HeatmapVisual({ spec }: { spec: VisualizationSpec }) {
  const xLabels = spec.x_labels ?? [];
  const yLabels = spec.y_labels ?? [];
  const cells = spec.cells ?? [];
  if (!xLabels.length || !yLabels.length || !cells.length) return <div className="chartEmpty">Not enough numeric fields for a relationship map.</div>;
  const lookup = new Map(cells.map((cell) => [`${cell.y}|||${cell.x}`, cell.value]));
  return (
    <div className="heatmapWrap">
      <div className="heatmapGrid" style={{ gridTemplateColumns: `minmax(58px, 1.05fr) repeat(${xLabels.length}, minmax(36px, 1fr))` }}>
        <div className="heatmapCorner" />
        {xLabels.map((label) => <div className="heatmapXLabel" key={`x-${label}`} title={label}>{label}</div>)}
        {yLabels.map((yLabel) => (
          <div className="heatmapRow" key={`row-${yLabel}`} style={{ display: "contents" }}>
            <div className="heatmapYLabel" title={yLabel}>{yLabel}</div>
            {xLabels.map((xLabel) => {
              const value = lookup.get(`${yLabel}|||${xLabel}`) ?? 0;
              const strength = Math.min(1, Math.abs(value));
              const background = value >= 0
                ? `rgba(47, 111, 237, ${0.08 + strength * 0.68})`
                : `rgba(215, 25, 32, ${0.08 + strength * 0.68})`;
              return <div key={`${yLabel}-${xLabel}`} className="heatmapCell" style={{ background }} title={`${yLabel} vs ${xLabel}: ${value.toFixed(2)}`}>{value.toFixed(2)}</div>;
            })}
          </div>
        ))}
      </div>
      <div className="heatmapLegend"><span>−1 strong negative</span><span>0 weak</span><span>+1 strong positive</span></div>
    </div>
  );
}

function VisualizationBody({ spec }: { spec: VisualizationSpec }) {
  return (
    <>
      {spec.kind === "line" && <LineVisual spec={spec} />}
      {spec.kind === "scatter" && <ScatterVisual spec={spec} />}
      {(spec.kind === "bar" || spec.kind === "quality") && <BarVisual spec={spec} />}
      {spec.kind === "box" && <BoxVisual spec={spec} />}
      {spec.kind === "histogram" && <HistogramVisual spec={spec} />}
      {spec.kind === "heatmap" && <HeatmapVisual spec={spec} />}
    </>
  );
}

function AutomaticVisualization({ spec }: { spec: VisualizationSpec }) {
  return (
    <section className="visualizationPanel">
      <div className="visualizationHeader">
        <div>
          <span className="panelKicker">AUTO VISUALISATION</span>
          <h4>{spec.title}</h4>
          <p>{spec.subtitle}</p>
        </div>
        <span className="chartTypeBadge">{spec.kind === "quality" ? "Quality bar" : spec.kind}</span>
      </div>
      <div className="chartCanvas">
        <VisualizationBody spec={spec} />
      </div>
      <div className="visualizationReason"><strong>Why this chart?</strong> {spec.selection_reason}</div>
    </section>
  );
}

function profileMetrics(field: SchemaField): ProfileMetric[] {
  const p = field.profile;

  switch (field.semantic_role) {
    case "measure":
      return [
        { label: "Mean", value: formatDecimal(p.mean) },
        { label: "Median", value: formatDecimal(p.median) },
        { label: "Minimum", value: formatDecimal(p.minimum) },
        { label: "Maximum", value: formatDecimal(p.maximum) },
        { label: "Std deviation", value: formatDecimal(p.std_dev) },
        { label: "IQR outliers", value: formatNumber(p.outlier_count_iqr ?? 0) },
      ];
    case "percentage":
      return [
        { label: "Average", value: percentValue(p.mean, p.percentage_scale) },
        { label: "Median", value: percentValue(p.median, p.percentage_scale) },
        { label: "Minimum", value: percentValue(p.minimum, p.percentage_scale) },
        { label: "Maximum", value: percentValue(p.maximum, p.percentage_scale) },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "IQR outliers", value: formatNumber(p.outlier_count_iqr ?? 0) },
      ];
    case "category": {
      const top = p.top_values?.[0];
      return [
        { label: "Distinct values", value: formatNumber(p.unique_non_null) },
        { label: "Non-missing", value: formatNumber(p.non_null_count) },
        { label: "Top value", value: top?.value ?? "—" },
        { label: "Top share", value: top ? formatPercent(top.percent) : "—" },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "Uniqueness", value: formatPercent(p.uniqueness_percent) },
      ];
    }
    case "text":
      return [
        { label: "Non-empty", value: formatNumber(p.non_null_count) },
        { label: "Distinct phrases", value: formatNumber(p.unique_non_null) },
        { label: "Avg length", value: p.average_length == null ? "—" : `${formatDecimal(p.average_length, 1)} chars` },
        { label: "Max length", value: p.max_length == null ? "—" : `${formatNumber(p.max_length)} chars` },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "Uniqueness", value: formatPercent(p.uniqueness_percent) },
      ];
    case "time":
      return [
        { label: "Earliest", value: p.earliest ?? "—" },
        { label: "Latest", value: p.latest ?? "—" },
        { label: "Span", value: p.range_days == null ? "—" : `${formatNumber(p.range_days)} days` },
        { label: "Distinct", value: formatNumber(p.unique_non_null) },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "Non-missing", value: formatNumber(p.non_null_count) },
      ];
    case "boolean":
      return [
        { label: "True", value: formatNumber(p.true_count ?? 0) },
        { label: "False", value: formatNumber(p.false_count ?? 0) },
        { label: "True share", value: formatPercent(p.true_percent) },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "Non-missing", value: formatNumber(p.non_null_count) },
        { label: "Distinct", value: formatNumber(p.unique_non_null) },
      ];
    case "identifier":
      return [
        { label: "Non-missing", value: formatNumber(p.non_null_count) },
        { label: "Unique values", value: formatNumber(p.unique_non_null) },
        { label: "Uniqueness", value: formatPercent(p.uniqueness_percent) },
        { label: "Repeated values", value: formatNumber(p.repeated_value_count ?? 0) },
        { label: "Missing", value: formatPercent(p.missing_percent) },
        { label: "Rows", value: formatNumber(p.row_count) },
      ];
    default:
      return [
        { label: "Rows", value: formatNumber(p.row_count) },
        { label: "Non-missing", value: formatNumber(p.non_null_count) },
        { label: "Distinct", value: formatNumber(p.unique_non_null) },
        { label: "Missing", value: formatPercent(p.missing_percent) },
      ];
  }
}


type WorkspaceTab = "overview" | "insights" | "explore" | "reports" | "quality" | "fields";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState("");
  const [selectedInsightId, setSelectedInsightId] = useState("");
  const [insightFilter, setInsightFilter] = useState("all");
  const [visualFilter, setVisualFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingWorkbook, setLoadingWorkbook] = useState(false);
  const [workbookInfo, setWorkbookInfo] = useState<WorkbookInfo | null>(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [dragging, setDragging] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [analysisNotice, setAnalysisNotice] = useState("");

  const roleCounts = useMemo(() => result?.understanding.role_counts ?? {}, [result]);
  const selectedField = useMemo(() => {
    if (!result) return null;
    return result.schema.find((field) => field.name === selectedFieldName) ?? result.schema[0] ?? null;
  }, [result, selectedFieldName]);
  const featuredFindings = useMemo(() => result?.discovery.ranking.top_findings ?? [], [result]);
  const rankedFindings = useMemo(() => result?.discovery.ranking.ranked_findings ?? result?.discovery.findings ?? [], [result]);
  const selectedInsight = useMemo(() => {
    if (!result) return null;
    return rankedFindings.find((finding) => finding.id === selectedInsightId)
      ?? featuredFindings[0]
      ?? rankedFindings[0]
      ?? null;
  }, [result, selectedInsightId, rankedFindings, featuredFindings]);
  const filteredFindings = useMemo(() => {
    if (insightFilter === "all") return rankedFindings;
    return rankedFindings.filter((finding) => finding.type === insightFilter);
  }, [rankedFindings, insightFilter]);
  const visualGallery = useMemo(() => result?.discovery.visual_gallery ?? [], [result]);
  const filteredVisuals = useMemo(() => {
    if (visualFilter === "all") return visualGallery;
    return visualGallery.filter((item) => item.category === visualFilter);
  }, [visualGallery, visualFilter]);
  const missingFields = useMemo(() => {
    if (!result) return [];
    return [...result.schema].filter((field) => field.missing_count > 0).sort((a, b) => b.missing_percent - a.missing_percent);
  }, [result]);

  function resetForNewFile() {
    setResult(null);
    setSelectedFieldName("");
    setSelectedInsightId("");
    setInsightFilter("all");
    setVisualFilter("all");
    setActiveTab("overview");
    setReportGeneratedAt("");
    setExportNotice("");
    setAnalysisNotice("");
    setWorkbookInfo(null);
    setSelectedSheet("");
  }

  function goHome() {
    setFile(null);
    resetForNewFile();
    setError("");
    setLoading(false);
    setLoadingWorkbook(false);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadWorkbookInfo(selected: File) {
    setLoadingWorkbook(true);
    setError("");
    const body = new FormData();
    body.append("file", selected);
    try {
      const response = await fetch(`${API_URL}/api/datasets/workbook`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Unable to inspect this workbook.");
      const workbook = payload.workbook as WorkbookInfo;
      setWorkbookInfo(workbook);
      setSelectedSheet(workbook.recommended_sheet ?? workbook.sheets.find((sheet) => sheet.analysis_ready)?.name ?? "");
    } catch (err) {
      setWorkbookInfo(null);
      setSelectedSheet("");
      setError(err instanceof Error ? err.message : "Unable to inspect this workbook.");
    } finally {
      setLoadingWorkbook(false);
    }
  }

  async function chooseFile(selected?: File) {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      setFile(null);
      resetForNewFile();
      setError("Unsupported file type. Azhan Data Studio accepts CSV and Excel (.xlsx) files only.");
      return;
    }

    setFile(selected);
    resetForNewFile();
    setError("");

    if (extension === "xlsx") {
      await loadWorkbookInfo(selected);
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    void chooseFile(event.dataTransfer.files?.[0]);
  }

  useEffect(() => {
    function preventBrowserOpen(event: globalThis.DragEvent) {
      event.preventDefault();
    }

    function acceptDropAnywhere(event: globalThis.DragEvent) {
      event.preventDefault();
      setDragging(false);
      const selected = event.dataTransfer?.files?.[0];
      if (selected) void chooseFile(selected);
    }

    window.addEventListener("dragover", preventBrowserOpen);
    window.addEventListener("drop", acceptDropAnywhere);
    return () => {
      window.removeEventListener("dragover", preventBrowserOpen);
      window.removeEventListener("drop", acceptDropAnywhere);
    };
  }, []);

  async function inspect(options: { preserveResult?: boolean } = {}) {
    if (!file) {
      setError("Choose a CSV or Excel (.xlsx) file before analysing.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysisNotice("");
    if (!options.preserveResult) setResult(null);

    const body = new FormData();
    body.append("file", file);
    if (file.name.toLowerCase().endsWith(".xlsx") && selectedSheet) {
      body.append("sheet_name", selectedSheet);
    }

    try {
      const response = await fetch(`${API_URL}/api/datasets/inspect`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Unable to inspect this dataset.");

      const typed = payload as InspectionResult;
      setResult(typed);
      setSelectedFieldName(typed.schema[0]?.name ?? "");
      setSelectedInsightId(typed.discovery.ranking.top_findings[0]?.id ?? typed.discovery.ranking.ranked_findings[0]?.id ?? "");
      setReportGeneratedAt(new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }));
      setActiveTab("overview");
      if (options.preserveResult) {
        setAnalysisNotice(`Analysis refreshed ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function openInsight(finding: InsightFinding) {
    setSelectedInsightId(finding.id);
    setActiveTab("insights");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function exportInsightsCsv() {
    if (!result) return;
    const headers = [
      "Rank", "Priority", "Insight Score", "Type", "Title", "Summary", "Fields",
      "Confidence", "Signal Strength", "Recommended Visual", "Evidence",
    ];
    const rows = rankedFindings.map((finding, index) => [
      index + 1,
      priorityLabel(finding.priority),
      formatDecimal(finding.insight_score, 0),
      insightLabel(finding.type),
      finding.title,
      finding.summary,
      finding.fields.join(" | "),
      finding.confidence,
      finding.signal_strength,
      finding.recommended_visual,
      finding.evidence.map((item) => `${item.label}: ${item.value}`).join(" | "),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadBlob(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }), `${safeFileStem(result.dataset.filename)}-insights.csv`);
    setExportNotice("Insights CSV downloaded.");
  }

  function exportAnalysisJson() {
    if (!result) return;
    const payload = {
      report: {
        product: "Azhan Data Studio",
        generated_at: reportGeneratedAt || new Date().toISOString(),
        methodology: "Deterministic statistical analytics. No AI assistant or LLM interpretation is used.",
      },
      analysis: result,
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${safeFileStem(result.dataset.filename)}-analysis.json`);
    setExportNotice("Full analysis JSON downloaded.");
  }

  function printReport() {
    if (!result) return;
    setExportNotice("Print dialog opened. Choose ‘Save as PDF’ to create the PDF report.");
    const previousTitle = document.title;
    const previousTab = activeTab;
    if (activeTab !== "reports") setActiveTab("reports");
    document.title = `${safeFileStem(result.dataset.filename)} - Azhan Data Studio Report`;
    const restoreTitle = () => {
      document.title = previousTitle;
      if (previousTab !== "reports") setActiveTab(previousTab);
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.setTimeout(() => window.print(), activeTab === "reports" ? 80 : 220);
  }

  function downloadSelectedChart() {
    if (!result || !selectedInsight?.visualization) return;
    const ok = downloadVisualizationPng(selectedInsight.visualization, `${safeFileStem(result.dataset.filename)}-${safeFileStem(selectedInsight.title)}.png`);
    setExportNotice(ok ? "Selected chart downloaded as PNG." : "This chart could not be exported.");
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Azhan Data Studio home" onClick={(event) => { event.preventDefault(); goHome(); }}>
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
          <a className="supportTopButton" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined} aria-label="Support Azhan Data Studio development with Stripe">☕ Support</a>
        </div>
      </header>

      <nav className="studioModeBar" aria-label="Choose analysis mode">
        <div className="studioModeInner">
          <a className="studioModeTab active" href="/" onClick={(event) => { event.preventDefault(); goHome(); }}><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a>
          <a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a>
          <a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project a metric into future periods</small></span></a>
          <a className="studioModeTab" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions before you decide</small></span></a>
          <a className="studioModeTab" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Validate relationships and differences</small></span><em>NEW</em></a>
        </div>
      </nav>

      {!result ? (
        <section className="hero" id="top">
          <div className="heroGlow heroGlowOne" aria-hidden="true" />
          <div className="heroGlow heroGlowTwo" aria-hidden="true" />

          <div className="heroLayout">
            <div className="heroMessage">
              <div className="eyebrow">AUTOMATED DATA INTELLIGENCE · CLEARER DECISIONS FROM YOUR DATA</div>
              <h1>Turn your data<br /><span>into real intelligence.</span></h1>
              <p className="heroCopy">
                Upload CSV or Excel files and let Azhan Data Studio automatically uncover patterns, anomalies, relationships, ranked insights, and presentation-ready visuals — without building a dashboard.
              </p>

              <div className="heroFeaturePills" aria-label="Azhan Data Studio capabilities">
                <span>Automatic insights</span>
                <span>Smart visual discovery</span>
                <span>Data-quality evidence</span>
                <span>Report-ready output</span>
              </div>

              <div className="heroExampleCard" aria-label="Example Azhan Data Studio output">
                <div className="heroExampleTop">
                  <span>WHAT YOU GET</span>
                  <strong>From file → findings</strong>
                </div>
                <div className="heroExampleInsight">
                  <div className="heroExampleScore"><b>94</b><small>/100</small></div>
                  <div>
                    <b>Important pattern detected</b>
                    <p>See the evidence, the right visual, and why the finding deserves attention — all in one place.</p>
                  </div>
                </div>
                <div className="heroExampleTrack"><span /></div>
              </div>

              <a className="creatorLine" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
                <span>Created by</span><strong>Azhan Hassan</strong><em>Data &amp; AI Automation Specialist</em><b>Portfolio ↗</b>
              </a>
            </div>

            <div className="heroActionCard">
              <div className="heroActionAccent" aria-hidden="true" />
              <div className="heroActionHeading">
                <span>START YOUR ANALYSIS</span>
                <h2>Upload your CSV or Excel file</h2>
                <p>No chart building, formulas, or dashboard setup. Upload one file and Azhan Data Studio will profile, discover, rank, and visualise what matters.</p>
              </div>

              <div
                className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
              >
                <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onInputChange} hidden />
                <div className="uploadIcon">↑</div>
                <div>
                  <strong>{file ? file.name : "Drop your dataset here"}</strong>
                  <span>{file ? `${formatBytes(file.size)} · ${file.name.toLowerCase().endsWith(".xlsx") ? "Excel workbook" : "CSV dataset"}` : "or click to browse · CSV / Excel (.xlsx) only · max 50 MB"}</span>
                </div>
              </div>

              {loadingWorkbook && (
                <div className="workbookLoading">Reading workbook sheets…</div>
              )}

              {workbookInfo && (
                <div className="workbookSelector">
                  <div className="workbookSelectorHead">
                    <div><span>EXCEL WORKBOOK DETECTED</span><strong>{workbookInfo.sheet_count} sheet{workbookInfo.sheet_count === 1 ? "" : "s"}</strong></div>
                    <small>Select the sheet you want Azhan Data Studio to analyse.</small>
                  </div>
                  <div className="sheetList">
                    {workbookInfo.sheets.map((sheet) => (
                      <button
                        type="button"
                        key={sheet.name}
                        disabled={!sheet.analysis_ready}
                        className={`sheetChoice ${selectedSheet === sheet.name ? "selected" : ""}`}
                        onClick={() => setSelectedSheet(sheet.name)}
                      >
                        <span className="sheetChoiceMain"><b>{sheet.name}</b><small>{formatNumber(sheet.rows)} rows · {formatNumber(sheet.columns)} columns</small></span>
                        <span className="sheetChoiceMeta">
                          {sheet.recommended && <em>Recommended</em>}
                          <small>{sheet.classification}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="primaryButton heroPrimaryButton" disabled={!file || loading || loadingWorkbook || (file?.name.toLowerCase().endsWith(".xlsx") && !selectedSheet)} onClick={() => void inspect()}>
                {loading ? "Analysing dataset…" : loadingWorkbook ? "Reading workbook…" : file?.name.toLowerCase().endsWith(".xlsx") && selectedSheet ? `Analyse ${selectedSheet}` : "Analyse my data"}
              </button>
              <div className="heroTrustLine"><span>CSV / XLSX only</span><span>Deterministic analytics</span><span>No dashboard setup</span><span>No AI assistant required</span></div>
              <div className="heroOutputRow" aria-label="Analysis workflow">
                <span><b>01</b><small>Profile</small></span>
                <i>→</i>
                <span><b>02</b><small>Discover</small></span>
                <i>→</i>
                <span><b>03</b><small>Rank</small></span>
                <i>→</i>
                <span><b>04</b><small>Report</small></span>
              </div>
              {error && <div className="errorBox">{error}</div>}
            </div>
          </div>

          <div className="heroCapabilityStrip">
            <div><strong>01</strong><span><b>Understand every field</b><small>Semantic roles, types, completeness and data quality</small></span></div>
            <div><strong>02</strong><span><b>Surface the signal</b><small>Patterns, relationships, distributions and anomalies</small></span></div>
            <div><strong>03</strong><span><b>Know what matters first</b><small>Ranked insights with evidence behind every score</small></span></div>
            <div><strong>04</strong><span><b>Take the analysis with you</b><small>Visual discovery, CSV exports and branded PDF reports</small></span></div>
          </div>

          <section className="supportLanding" id="support">
            <div><span className="panelKicker">SUPPORT THE PROJECT</span><strong>Azhan Data Studio is independently built and free to use.</strong><p>If it saves you time, you can support continued development with a one-time contribution.</p></div>
            {SUPPORT_URL ? <a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support Azhan Data Studio</a> : <span className="supportPending">Stripe support link coming soon</span>}
          </section>
        </section>
      ) : (
        <>
          <section className="datasetBar" id="top">
            <div className="datasetIdentity">
              <div>
                <span className="panelKicker">CURRENT DATASET</span>
                <h1>{result.dataset.filename}</h1>
                {result.dataset.sheet_name && <span className="currentSheetLabel">Sheet: {result.dataset.sheet_name}</span>}
              </div>
              <div className="datasetBadges">
                <span>{formatNumber(result.dataset.rows)} rows</span>
                <span>{formatNumber(result.dataset.columns)} fields</span>
                <span>{result.discovery.total_findings} insights</span>
              </div>
            </div>
            <div className="compactUpload">
              <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onInputChange} hidden />
              {workbookInfo && (
                <select className="compactSheetSelect" value={selectedSheet} onChange={(event) => setSelectedSheet(event.target.value)} aria-label="Excel sheet">
                  {workbookInfo.sheets.filter((sheet) => sheet.analysis_ready).map((sheet) => (
                    <option value={sheet.name} key={sheet.name}>{sheet.name} · {sheet.rows} rows</option>
                  ))}
                </select>
              )}
              <button className="secondaryButton" onClick={() => inputRef.current?.click()}>Choose another file</button>
              <button className="primaryButton compactPrimary" disabled={!file || loading || loadingWorkbook || (file?.name.toLowerCase().endsWith(".xlsx") && !selectedSheet)} onClick={() => void inspect({ preserveResult: true })}>{loading ? "Analysing…" : workbookInfo ? "Analyse sheet" : "Re-analyse"}</button>
              {analysisNotice && <div className="analysisNotice" role="status">✓ {analysisNotice}</div>}
            </div>
          </section>

          <nav className="workspaceNav" aria-label="Azhan Data Studio workspace">
            {([
              ["overview", "Overview"],
              ["insights", "Insights"],
              ["explore", "Explore"],
              ["reports", "Reports"],
              ["quality", "Data Quality"],
              ["fields", "Fields"],
            ] as Array<[WorkspaceTab, string]>).map(([tab, label]) => (
              <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{label}</button>
            ))}
          </nav>

          <section className="workspaceShell">
            {activeTab === "overview" && (
              <div className="tabPage">
                <div className="pageHeading unifiedDashboardHeading">
                  <div><span className="panelKicker">ANALYST BRIEFING · DASHBOARD VIEW</span><h2>Overview</h2><p>Your key measures, strongest finding and data health in one decision-ready view.</p></div>
                  <div className="dashboardActionGroup analyseDashboardActions">
                    <div className="headingPills">
                      <span>{result.quality.completeness_percent}% complete</span>
                      <span>{result.understanding.average_semantic_confidence}% semantic confidence</span>
                    </div>
                    <button className="pdfReportButton" onClick={printReport}>Download PDF Report</button>
                  </div>
                </div>

                <div className="metricsGrid">
                  <Metric label="Rows" value={formatNumber(result.dataset.rows)} />
                  <Metric label="Fields" value={formatNumber(result.dataset.columns)} />
                  <Metric label="Insights" value={formatNumber(result.discovery.total_findings)} />
                  <Metric label="Top score" value={featuredFindings[0] ? `${formatDecimal(featuredFindings[0].insight_score, 0)}/100` : "—"} />
                </div>

                <section className="panel unifiedMeaningPanel analyseMeaningPanel">
                  <div className="unifiedMeaningMark">◎</div>
                  <div className="unifiedMeaningCopy">
                    <span className="panelKicker">WHAT THIS MEANS</span>
                    <h3>{featuredFindings[0]?.title ?? "Your dataset is ready to explore."}</h3>
                    <p>{featuredFindings[0]?.summary ?? "Data Studio has profiled the dataset and prepared the available insights, visuals and quality evidence."}</p>
                    <div className="unifiedMeaningChips"><span>{result.discovery.total_findings} insights found</span><span>{result.quality.completeness_percent}% complete</span><span>{result.understanding.average_semantic_confidence}% field confidence</span></div>
                  </div>
                  {featuredFindings[0] && <button className="unifiedMeaningAction" onClick={() => openInsight(featuredFindings[0])}>Open top insight →</button>}
                </section>

                <div className="overviewGrid">
                  <section className="panel overviewInsights">
                    <div className="panelHeader compactHeader">
                      <div><span className="panelKicker">TOP 5</span><h3>Things worth knowing</h3></div>
                      <button className="textButton" onClick={() => setActiveTab("insights")}>Open workspace →</button>
                    </div>
                    <div className="overviewInsightList">
                      {featuredFindings.map((finding, index) => (
                        <button key={finding.id} className="overviewInsightRow" onClick={() => openInsight(finding)}>
                          <span className="rankNumber">{index + 1}</span>
                          <span className={`findingIcon finding-${finding.type}`}>{insightIcon(finding.type)}</span>
                          <span className="overviewInsightBody"><strong>{finding.title}</strong><small>{insightLabel(finding.type)} · {priorityLabel(finding.priority)}</small></span>
                          <span className="overviewScore">{formatDecimal(finding.insight_score, 0)}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="panel overviewVisual">
                    <div className="panelHeader compactHeader">
                      <div><span className="panelKicker">TOP INSIGHT</span><h3>{selectedInsight?.title ?? "No insight available"}</h3></div>
                      {selectedInsight && <span className={`priorityBadge priority-${selectedInsight.priority}`}>{priorityLabel(selectedInsight.priority)}</span>}
                    </div>
                    {selectedInsight?.visualization ? <AutomaticVisualization spec={selectedInsight.visualization} /> : <div className="emptyState">No chart is available for this finding.</div>}
                  </section>
                </div>

                <section className="panel qualityStripPanel">
                  <div className="panelHeader compactHeader"><div><span className="panelKicker">DATA HEALTH</span><h3>Quality snapshot</h3></div><button className="textButton" onClick={() => setActiveTab("quality")}>View details →</button></div>
                  <div className="qualityStrip">
                    <Metric label="Completeness" value={`${result.quality.completeness_percent}%`} />
                    <Metric label="Missing values" value={formatNumber(result.quality.missing_values)} />
                    <Metric label="Duplicate rows" value={formatNumber(result.quality.duplicate_rows)} />
                    <Metric label="Fields with gaps" value={formatNumber(missingFields.length)} />
                  </div>
                </section>

                <section className="panel supportPanel" id="support">
                  <div className="supportPanelCopy">
                    <span className="panelKicker">INDEPENDENTLY BUILT</span>
                    <h3>Did Azhan Data Studio save you time?</h3>
                    <p>The studio stays free to use. If it helped you find something useful in your data, you can support continued development with a one-time contribution.</p>
                  </div>
                  <div className="supportPanelAction">
                    {SUPPORT_URL ? <a className="supportPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support development</a> : <span className="supportPending">Stripe support link coming soon</span>}
                    <small>{SUPPORT_URL ? "Optional · secure checkout handled by Stripe" : "Add NEXT_PUBLIC_SUPPORT_URL to activate checkout"}</small>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "insights" && (
              <div className="tabPage">
                <div className="pageHeading">
                  <div><span className="panelKicker">RANKED ANALYSIS</span><h2>Insights</h2><p>Select any finding on the left. The evidence and chart stay beside it.</p></div>
                  <div className="prioritySummary">
                    {(["critical", "high", "medium", "low"] as const).map((priority) => (
                      <span className={`priorityPill priority-${priority}`} key={priority}>{result.discovery.ranking.priority_counts[priority] ?? 0} {priorityLabel(priority)}</span>
                    ))}
                  </div>
                </div>

                <div className="insightsWorkspace">
                  <aside className="panel insightListPanel">
                    <div className="panelHeader compactHeader"><div><span className="panelKicker">RANKED FINDINGS</span><h3>{rankedFindings.length} discoveries</h3></div></div>
                    <div className="insightWorkspaceList">
                      {rankedFindings.slice(0, 30).map((finding, index) => (
                        <button key={finding.id} className={`workspaceInsightRow ${selectedInsight?.id === finding.id ? "active" : ""}`} onClick={() => setSelectedInsightId(finding.id)}>
                          <div className="workspaceInsightTop">
                            <span className="workspaceRank">#{index + 1}</span>
                            <span className={`priorityBadge priority-${finding.priority}`}>{priorityLabel(finding.priority)}</span>
                            <strong className="workspaceScore">{formatDecimal(finding.insight_score, 0)}</strong>
                          </div>
                          <h4>{finding.title}</h4>
                          <p>{finding.summary}</p>
                          <span className="workspaceMeta">{insightIcon(finding.type)} {insightLabel(finding.type)} · {finding.fields.length ? finding.fields.join(" + ") : "Dataset"}</span>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <section className="panel insightDetail stickyPanel">
                    {selectedInsight ? (
                      <>
                        <div className="detailHeader">
                          <div><span className="panelKicker">SELECTED INSIGHT · {insightLabel(selectedInsight.type).toUpperCase()}</span><h3>{selectedInsight.title}</h3><p>{selectedInsight.summary}</p></div>
                          <div className="scoreHero"><span>Insight Score</span><strong>{formatDecimal(selectedInsight.insight_score, 0)}</strong><em className={`priorityText priority-${selectedInsight.priority}`}>{priorityLabel(selectedInsight.priority)}</em></div>
                        </div>
                        {selectedInsight.visualization ? <AutomaticVisualization spec={selectedInsight.visualization} /> : <div className="emptyState">No automatic chart is available for this finding.</div>}
                        <div className="evidenceGrid">
                          {selectedInsight.evidence.slice(0, 6).map((item) => <div className="evidenceMetric" key={`${selectedInsight.id}-${item.label}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}
                        </div>
                        <details className="scoreDetails">
                          <summary>Why this insight scored {formatDecimal(selectedInsight.insight_score, 0)}/100</summary>
                          <div className="rankingBreakdown">
                            {(Object.keys(RANKING_LABELS) as Array<keyof typeof RANKING_LABELS>).map((key) => (
                              <div className="rankingFactor" key={key}><div><span>{RANKING_LABELS[key]}</span><strong>{formatDecimal(selectedInsight.ranking[key], 0)}</strong></div><div className="factorTrack"><span style={{ width: `${selectedInsight.ranking[key]}%` }} /></div></div>
                            ))}
                          </div>
                          <div className="rankingReason">{selectedInsight.ranking.reason}</div>
                        </details>
                        {selectedInsight.type === "correlation" && <div className="analysisCaution">Relationship does not imply causation; the engine reports statistical association only.</div>}
                      </>
                    ) : <div className="emptyState">No insight is selected.</div>}
                  </section>
                </div>
              </div>
            )}

            {activeTab === "explore" && (
              <div className="tabPage">
                <div className="pageHeading">
                  <div><span className="panelKicker">VISUAL DISCOVERY</span><h2>Explore</h2><p>Scan a broader set of automatically selected charts, then browse the full insight library underneath.</p></div>
                  <div className="headingPills"><span>{visualGallery.length} recommended charts</span><span>{rankedFindings.length} ranked insights</span></div>
                </div>

                <section className="panel visualDiscoveryPanel">
                  <div className="panelHeader compactHeader">
                    <div><span className="panelKicker">AUTO-GENERATED VIEWS</span><h3>Visual discovery</h3><p>The engine scores candidate charts and keeps a varied set rather than showing every possible combination.</p></div>
                  </div>
                  <div className="filterBar visualFilterBar">
                    {["all", "trends", "relationships", "categories", "distributions", "quality"].map((category) => (
                      <button key={category} className={visualFilter === category ? "active" : ""} onClick={() => setVisualFilter(category)}>
                        {category === "all" ? "All charts" : category.replaceAll("_", " ")}
                        {category !== "all" && <span>{visualGallery.filter((item) => item.category === category).length}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="visualGalleryGrid">
                    {filteredVisuals.map((item) => {
                      const linked = item.linked_insight_id ? rankedFindings.find((finding) => finding.id === item.linked_insight_id) : undefined;
                      return (
                        <article className="visualGalleryCard" key={item.id}>
                          <div className="visualGalleryHeader">
                            <div><span>{item.category.replaceAll("_", " ")}</span><h3>{item.visualization.title}</h3><p>{item.visualization.subtitle}</p></div>
                            <strong>{formatDecimal(item.score, 0)}</strong>
                          </div>
                          <div className="visualGalleryCanvas"><VisualizationBody spec={item.visualization} /></div>
                          <div className="visualGalleryFooter">
                            <span>{item.visualization.kind === "quality" ? "quality bar" : item.visualization.kind}</span>
                            {linked ? <button onClick={() => openInsight(linked)}>Open related insight →</button> : <em>Generated analytical view</em>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="panel insightLibraryPanel">
                  <div className="panelHeader compactHeader">
                    <div><span className="panelKicker">EXPANDED ANALYTICS</span><h3>Insight library</h3><p>Expanded analytics include distributions, variability, rare categories, outcome gaps, leading groups and contribution patterns.</p></div>
                  </div>
                  <div className="filterBar">
                    <button className={insightFilter === "all" ? "active" : ""} onClick={() => setInsightFilter("all")}>All <span>{rankedFindings.length}</span></button>
                    {Object.keys(result.discovery.type_counts).map((type) => <button key={type} className={insightFilter === type ? "active" : ""} onClick={() => setInsightFilter(type)}>{insightLabel(type as InsightFinding["type"])} <span>{result.discovery.type_counts[type]}</span></button>)}
                  </div>
                  <div className="exploreGrid">
                    {filteredFindings.map((finding) => (
                      <button key={finding.id} className="exploreCard" onClick={() => openInsight(finding)}>
                        <div className="exploreTop"><span className={`findingIcon finding-${finding.type}`}>{insightIcon(finding.type)}</span><span className={`priorityBadge priority-${finding.priority}`}>{priorityLabel(finding.priority)}</span><strong>{formatDecimal(finding.insight_score, 0)}</strong></div>
                        <h3>{finding.title}</h3><p>{finding.summary}</p><span className="openLink">Open evidence →</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}



            {activeTab === "reports" && (
              <div className="tabPage reportPage">
                <div className="pageHeading">
                  <div><span className="panelKicker">REPORTING & EXPORT</span><h2>Reports</h2><p>Turn the analysis into a presentation-ready report or export the evidence for reuse elsewhere.</p></div>
                  <div className="headingPills"><span>No AI assistant</span><span>Deterministic evidence</span></div>
                </div>

                <section className="panel reportActions">
                  <div className="reportActionIntro">
                    <span className="panelKicker">EXPORT CENTRE</span>
                    <h3>Take the analysis with you</h3>
                    <p>Download a branded PDF-ready report using your browser print dialog. Choose <strong>Save as PDF</strong> when prompted.</p>
                    <div className="reportActionBrand">Reports carry the Azhan Data Studio identity and link back to the Azhan Hassan portfolio.</div>
                  </div>
                  <div className="reportActionButtons">
                    <button className="primaryButton compactPrimary" onClick={printReport}>Download PDF Report</button>
                    <button className="secondaryButton" onClick={exportInsightsCsv}>Download insights CSV</button>
                    {SUPPORT_URL ? <a className="supportSecondaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">☕ Support the project</a> : <a className="supportSecondaryButton" href="#support">☕ Support the project</a>}
                  </div>
                  {exportNotice && <div className="exportNotice">{exportNotice}</div>}
                </section>

                <section className="printReport panel" id="insight-report">
                  <div className="reportCover">
                    <div className="reportBrandRow">
                      <div className="reportBrand"><DataStudioMark /><span className="reportBrandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></div>
                      <div className="reportPowered"><span>CREATED BY</span><strong>Azhan Hassan</strong><em>Data &amp; AI Automation Specialist</em><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">syedazhan.netlify.app ↗</a></div>
                    </div>
                    <span className="reportVersion">ANALYTICAL REPORT</span>
                    <h1>Data Analysis Report</h1>
                    <p className="reportDatasetName">{result.dataset.filename}</p>
                    {result.dataset.sheet_name && <p className="reportSheetName">Worksheet: {result.dataset.sheet_name}</p>}
                    <div className="reportMeta"><span>Generated {reportGeneratedAt || "—"}</span><span>{formatNumber(result.dataset.rows)} rows</span><span>{formatNumber(result.dataset.columns)} fields</span></div>
                  </div>

                  <div className="reportMetricGrid">
                    <div><span>Insights discovered</span><strong>{formatNumber(result.discovery.total_findings)}</strong></div>
                    <div><span>Top insight score</span><strong>{featuredFindings[0] ? `${formatDecimal(featuredFindings[0].insight_score, 0)}/100` : "—"}</strong></div>
                    <div><span>Completeness</span><strong>{result.quality.completeness_percent}%</strong></div>
                    <div><span>Duplicate rows</span><strong>{formatNumber(result.quality.duplicate_rows)}</strong></div>
                  </div>

                  <section className="reportSection">
                    <div className="reportSectionHeading"><span>01</span><div><h2>Top findings</h2><p>The five highest-ranked findings based on impact, confidence, unusualness, coverage and relevance.</p></div></div>
                    <div className="reportTopFindings">
                      {featuredFindings.map((finding, index) => (
                        <article className="reportInsight" key={`report-${finding.id}`}>
                          <div className="reportInsightRank">{String(index + 1).padStart(2, "0")}</div>
                          <div className="reportInsightBody">
                            <div className="reportInsightMeta"><span className={`priorityBadge priority-${finding.priority}`}>{priorityLabel(finding.priority)}</span><span>{insightLabel(finding.type)}</span><strong>{formatDecimal(finding.insight_score, 0)}/100</strong></div>
                            <h3>{finding.title}</h3>
                            <p>{finding.summary}</p>
                            <div className="reportEvidenceLine">{finding.evidence.slice(0, 3).map((item) => <span key={`${finding.id}-report-${item.label}`}><em>{item.label}</em><strong>{item.value}</strong></span>)}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="reportSection reportVisualSection">
                    <div className="reportSectionHeading"><span>02</span><div><h2>Visual summary</h2><p>A varied set of automatically selected analytical views from the dataset.</p></div></div>
                    <div className="reportVisualGrid">
                      {visualGallery.slice(0, 6).map((item) => (
                        <article className="reportChartCard" key={`report-chart-${item.id}`}>
                          <div className="reportChartHeader"><span>{item.category.replaceAll("_", " ")}</span><h3>{item.visualization.title}</h3><p>{item.visualization.subtitle}</p></div>
                          <div className="reportChartCanvas"><VisualizationBody spec={item.visualization} /></div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="reportSection">
                    <div className="reportSectionHeading"><span>03</span><div><h2>Data quality</h2><p>Quality conditions that should be considered when interpreting the analysis.</p></div></div>
                    <div className="reportQualityGrid">
                      <div><span>Completeness</span><strong>{result.quality.completeness_percent}%</strong></div>
                      <div><span>Missing values</span><strong>{formatNumber(result.quality.missing_values)}</strong></div>
                      <div><span>Duplicate rows</span><strong>{formatNumber(result.quality.duplicate_rows)}</strong></div>
                      <div><span>Fields with gaps</span><strong>{formatNumber(missingFields.length)}</strong></div>
                    </div>
                    {missingFields.length > 0 && (
                      <div className="reportMissingList">
                        {missingFields.slice(0, 8).map((field) => <div key={`report-missing-${field.name}`}><strong>{field.name}</strong><span>{formatNumber(field.missing_count)} missing</span><em>{formatPercent(field.missing_percent)}</em></div>)}
                      </div>
                    )}
                  </section>

                  <section className="reportSection">
                    <div className="reportSectionHeading"><span>04</span><div><h2>Insight register</h2><p>The highest-ranked findings in a compact evidence register.</p></div></div>
                    <div className="reportTableWrap">
                      <table className="reportTable"><thead><tr><th>Rank</th><th>Priority</th><th>Score</th><th>Type</th><th>Finding</th><th>Fields</th></tr></thead><tbody>
                        {rankedFindings.slice(0, 15).map((finding, index) => <tr key={`report-register-${finding.id}`}><td>{index + 1}</td><td>{priorityLabel(finding.priority)}</td><td>{formatDecimal(finding.insight_score, 0)}</td><td>{insightLabel(finding.type)}</td><td><strong>{finding.title}</strong><small>{finding.summary}</small></td><td>{finding.fields.join(", ") || "Dataset"}</td></tr>)}
                      </tbody></table>
                    </div>
                  </section>

                  <section className="reportMethodology">
                    <span className="panelKicker">METHODOLOGY</span>
                    <h2>How this report was produced</h2>
                    <p>Azhan Data Studio profiles the dataset, detects semantic field roles, runs deterministic statistical discovery modules, ranks findings, and selects suitable visualisations. The calculations and report content use deterministic analytics and do <strong>not</strong> use an AI assistant or LLM-generated interpretation.</p>
                    <p className="reportCreatorNote">Azhan Data Studio is created by <strong>Azhan Hassan</strong>, Data &amp; AI Automation Specialist. <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View portfolio ↗</a></p>
                    <div className="methodChips">{result.discovery.modules_run.map((module) => <span key={`method-${module}`}>{module.replaceAll("_", " ")}</span>)}</div>
                  </section>

                  <div className="reportFooter"><span>Azhan Data Studio</span><span className="reportFooterCreator">Azhan Hassan · Data &amp; AI Automation Specialist · syedazhan.netlify.app</span><span>{reportGeneratedAt || "Generated report"}</span></div>
                </section>
              </div>
            )}

            {activeTab === "quality" && (
              <div className="tabPage">
                <div className="pageHeading"><div><span className="panelKicker">DATA HEALTH</span><h2>Data Quality</h2><p>See completeness, duplicates, and which fields may weaken the analysis.</p></div></div>
                <div className="metricsGrid">
                  <Metric label="Completeness" value={`${result.quality.completeness_percent}%`} />
                  <Metric label="Missing values" value={formatNumber(result.quality.missing_values)} />
                  <Metric label="Duplicate rows" value={formatNumber(result.quality.duplicate_rows)} />
                  <Metric label="Fields with gaps" value={formatNumber(missingFields.length)} />
                </div>
                <section className="panel qualityPanel">
                  <div className="panelHeader compactHeader"><div><span className="panelKicker">MISSINGNESS BY FIELD</span><h3>Where the gaps are</h3></div></div>
                  {missingFields.length ? (
                    <div className="qualityFieldList">
                      {missingFields.map((field) => (
                        <div className="qualityFieldRow" key={field.name}>
                          <div className="qualityFieldMeta"><strong>{field.name}</strong><span>{formatNumber(field.missing_count)} missing · {formatPercent(field.missing_percent)}</span></div>
                          <div className="qualityTrack"><span style={{ width: `${Math.min(100, field.missing_percent)}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="emptyState">No missing values were detected.</div>}
                </section>
              </div>
            )}

            {activeTab === "fields" && selectedField && (
              <div className="tabPage">
                <div className="pageHeading"><div><span className="panelKicker">SEMANTIC UNDERSTANDING</span><h2>Fields</h2><p>Inspect how the engine understands each column and the profile behind that decision.</p></div><div className="roleSummary">{Object.entries(roleCounts).map(([role, count]) => <span key={role}>{count} {roleLabel(role)}</span>)}</div></div>
                <div className="fieldsWorkspace">
                  <section className="panel fieldListPanel">
                    <div className="fieldListHeader"><span>Field</span><span>Role</span><span>Missing</span></div>
                    <div className="fieldRows">
                      {result.schema.map((field) => (
                        <button key={field.name} className={`fieldCompactRow ${selectedField.name === field.name ? "active" : ""}`} onClick={() => setSelectedFieldName(field.name)}>
                          <strong>{field.name}</strong><span className={`roleTag role-${field.semantic_role}`}>{roleLabel(field.semantic_role)}</span><span>{field.missing_percent}%</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="panel fieldDetail stickyPanel">
                    <div className="detailHeader"><div><span className="panelKicker">FIELD PROFILE</span><h3>{selectedField.name}</h3><div className="inlineTags"><span className={`roleTag role-${selectedField.semantic_role}`}>{roleLabel(selectedField.semantic_role)}</span><span className="tag">{selectedField.data_type}</span></div></div><strong className="confidenceNumber">{selectedField.semantic_confidence}%<small>confidence</small></strong></div>
                    <div className="reasonBox"><strong>Why this role?</strong><p>{selectedField.semantic_reason}</p></div>
                    <div className="profileMetricGrid">{profileMetrics(selectedField).map((metric) => <div className="profileMetric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
                    {(selectedField.profile.top_values?.length ?? 0) > 0 && (
                      <div className="distributionSection"><div className="distributionHeading"><span className="panelKicker">MOST COMMON VALUES</span><strong>Distribution snapshot</strong></div><div className="distributionList">{selectedField.profile.top_values!.map((item) => <div className="distributionRow" key={`${selectedField.name}-${item.value}`}><div className="distributionLabel"><span title={item.value}>{item.value}</span><strong>{formatNumber(item.count)} · {formatPercent(item.percent)}</strong></div><div className="distributionTrack"><span style={{ width: `${Math.max(item.percent, 1.5)}%` }} /></div></div>)}</div></div>
                    )}
                  </section>
                </div>
                <section className="panel previewPanel"><div className="panelHeader compactHeader"><div><span className="panelKicker">DATA PREVIEW</span><h3>First {result.preview.length} rows</h3></div></div><div className="tableWrap"><table><thead><tr>{result.schema.map((field) => <th key={field.name}>{field.name}</th>)}</tr></thead><tbody>{result.preview.map((row, index) => <tr key={index}>{result.schema.map((field) => <td key={field.name}>{row[field.name] == null ? "—" : String(row[field.name])}</td>)}</tr>)}</tbody></table></div></section>
              </div>
            )}
          </section>
        </>
      )}

      <footer className="siteFooter"><strong>Azhan Data Studio</strong><span>Created by Azhan Hassan · Data &amp; AI Automation Specialist</span><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View Portfolio ↗</a><a className="footerSupport" href={SUPPORT_URL || "#support"} target={SUPPORT_URL ? "_blank" : undefined} rel={SUPPORT_URL ? "noreferrer" : undefined}>☕ Support the project</a></footer>
    </main>
  );
}

function DataStudioMark() {
  return (
    <span className="dataStudioMark" aria-hidden="true">
      <span className="dataStudioA">A</span>
      <span className="dataStudioBars"><i /><i /><i /></span>
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metricCard"><span>{label}</span><strong>{value}</strong></div>;
}
