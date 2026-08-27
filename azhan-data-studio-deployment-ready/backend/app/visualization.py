from __future__ import annotations

import math
from collections import defaultdict
from datetime import date, datetime
from typing import Any

import polars as pl


MAX_LINE_POINTS = 90
MAX_SCATTER_POINTS = 160
MAX_BAR_ITEMS = 10
MAX_OUTLIER_POINTS = 36


def _finite(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _mean(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def _median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def _quantile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * q
    lower = int(math.floor(position))
    upper = int(math.ceil(position))
    if lower == upper:
        return ordered[lower]
    fraction = position - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def _time_key(value: Any) -> tuple[int, float | str]:
    if isinstance(value, datetime):
        return (0, value.timestamp())
    if isinstance(value, date):
        return (0, float(value.toordinal()))
    text = str(value).strip()
    if not text:
        return (2, "")
    candidate = text.replace("Z", "+00:00")
    try:
        return (0, datetime.fromisoformat(candidate).timestamp())
    except ValueError:
        pass
    try:
        return (0, float(date.fromisoformat(candidate).toordinal()))
    except ValueError:
        return (1, text)


def _label(value: Any) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return str(value)


def _even_sample(items: list[Any], limit: int) -> list[Any]:
    if len(items) <= limit:
        return items
    if limit <= 1:
        return [items[0]]
    step = (len(items) - 1) / (limit - 1)
    indices = [round(index * step) for index in range(limit)]
    seen: set[int] = set()
    sampled: list[Any] = []
    for index in indices:
        if index not in seen:
            sampled.append(items[index])
            seen.add(index)
    return sampled


def _schema_map(schema: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(field.get("name")): field for field in schema}


def _value_format(field_name: str, schema_by_name: dict[str, dict[str, Any]]) -> str:
    field = schema_by_name.get(field_name) or {}
    role = str(field.get("semantic_role") or "")
    if role == "percentage":
        scale = str((field.get("profile") or {}).get("percentage_scale") or "percent")
        return "percent_fraction" if scale == "fraction" else "percent"
    if role == "boolean":
        return "percent_fraction"
    return "number"


def _line_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if len(finding.get("fields") or []) < 2:
        return None
    time_field, value_field = finding["fields"][:2]
    try:
        rows = dataframe.select(
            [time_field, pl.col(value_field).cast(pl.Float64, strict=False).alias(value_field)]
        ).drop_nulls().rows()
    except Exception:
        return None

    grouped: dict[str, list[float]] = defaultdict(list)
    sort_values: dict[str, tuple[int, float | str]] = {}
    for raw_time, raw_value in rows:
        value = _finite(raw_value)
        if value is None:
            continue
        label = _label(raw_time)
        grouped[label].append(value)
        sort_values[label] = _time_key(raw_time)

    points = [
        {"label": label, "value": _mean(values)}
        for label, values in grouped.items()
        if values
    ]
    points.sort(key=lambda item: sort_values.get(str(item["label"]), (2, str(item["label"]))))
    points = [point for point in points if point["value"] is not None]
    if len(points) < 2:
        return None
    points = _even_sample(points, MAX_LINE_POINTS)

    return {
        "kind": "line",
        "title": f"{value_field} over {time_field}",
        "subtitle": "Average value at each observed time point",
        "x_label": time_field,
        "y_label": value_field,
        "value_format": _value_format(value_field, schema_by_name),
        "points": points,
        "selection_reason": "A time field and a numeric signal are best explained with a trend line.",
    }


def _scatter_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if len(finding.get("fields") or []) < 2:
        return None
    field_x, field_y = finding["fields"][:2]
    try:
        rows = dataframe.select(
            [
                pl.col(field_x).cast(pl.Float64, strict=False).alias(field_x),
                pl.col(field_y).cast(pl.Float64, strict=False).alias(field_y),
            ]
        ).drop_nulls().rows()
    except Exception:
        return None

    points: list[dict[str, float]] = []
    for raw_x, raw_y in rows:
        x = _finite(raw_x)
        y = _finite(raw_y)
        if x is not None and y is not None:
            points.append({"x": x, "y": y})
    if len(points) < 3:
        return None
    points = _even_sample(points, MAX_SCATTER_POINTS)

    xs = [point["x"] for point in points]
    ys = [point["y"] for point in points]
    x_mean = _mean(xs)
    y_mean = _mean(ys)
    regression = None
    if x_mean is not None and y_mean is not None:
        denominator = sum((x - x_mean) ** 2 for x in xs)
        if denominator > 0:
            slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / denominator
            intercept = y_mean - slope * x_mean
            regression = {
                "x1": min(xs),
                "y1": slope * min(xs) + intercept,
                "x2": max(xs),
                "y2": slope * max(xs) + intercept,
            }

    return {
        "kind": "scatter",
        "title": f"{field_x} vs {field_y}",
        "subtitle": f"{len(points):,} representative paired observations",
        "x_label": field_x,
        "y_label": field_y,
        "x_format": _value_format(field_x, schema_by_name),
        "y_format": _value_format(field_y, schema_by_name),
        "points": points,
        "regression": regression,
        "selection_reason": "Two numeric fields are best inspected with a scatter plot and fitted trend line.",
    }


def _bar_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if len(finding.get("fields") or []) < 2:
        return None
    category_field, value_field = finding["fields"][:2]
    try:
        rows = dataframe.select(
            [category_field, pl.col(value_field).cast(pl.Float64, strict=False).alias(value_field)]
        ).drop_nulls().rows()
    except Exception:
        return None

    groups: dict[str, list[float]] = defaultdict(list)
    for category, raw_value in rows:
        value = _finite(raw_value)
        if value is not None:
            groups[str(category)].append(value)
    if len(groups) < 2:
        return None

    highlighted = str(finding.get("id") or "").split(":")[-1]
    bars = [
        {
            "label": group,
            "value": _mean(values),
            "count": len(values),
            "highlight": group == highlighted,
        }
        for group, values in groups.items()
        if values
    ]
    bars = [bar for bar in bars if bar["value"] is not None]
    bars.sort(key=lambda item: float(item["value"]), reverse=True)
    bars = bars[:MAX_BAR_ITEMS]

    return {
        "kind": "bar",
        "title": f"Average {value_field} by {category_field}",
        "subtitle": "Group averages; bar length represents the calculated mean",
        "x_label": value_field,
        "y_label": category_field,
        "value_format": _value_format(value_field, schema_by_name),
        "bars": bars,
        "selection_reason": "A categorical split against a numeric measure is clearest as a ranked bar chart.",
    }


def _box_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    fields = finding.get("fields") or []
    if not fields:
        return None
    field = fields[0]
    try:
        raw_values = dataframe[field].cast(pl.Float64, strict=False).drop_nulls().to_list()
    except Exception:
        return None
    values = [number for value in raw_values if (number := _finite(value)) is not None]
    if len(values) < 5:
        return None

    q1 = _quantile(values, 0.25)
    median = _median(values)
    q3 = _quantile(values, 0.75)
    if q1 is None or q3 is None or median is None:
        return None
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr
    inliers = [value for value in values if lower_fence <= value <= upper_fence]
    outliers = [value for value in values if value < lower_fence or value > upper_fence]
    whisker_min = min(inliers) if inliers else min(values)
    whisker_max = max(inliers) if inliers else max(values)

    return {
        "kind": "box",
        "title": f"Distribution of {field}",
        "subtitle": f"IQR box plot with {len(outliers):,} potential outlier values",
        "x_label": field,
        "value_format": _value_format(field, schema_by_name),
        "box": {
            "minimum": min(values),
            "maximum": max(values),
            "q1": q1,
            "median": median,
            "q3": q3,
            "whisker_min": whisker_min,
            "whisker_max": whisker_max,
            "lower_fence": lower_fence,
            "upper_fence": upper_fence,
            "outliers": _even_sample(sorted(outliers), MAX_OUTLIER_POINTS),
        },
        "selection_reason": "A box plot exposes the centre, spread, fences and extreme values in one view.",
    }


def _quality_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    duplicate_rows: int,
) -> dict[str, Any] | None:
    fields = finding.get("fields") or []
    if fields:
        field = fields[0]
        if field not in dataframe.columns:
            return None
        missing = int(dataframe[field].null_count())
        total = dataframe.height
        complete = max(total - missing, 0)
        return {
            "kind": "quality",
            "title": f"Completeness of {field}",
            "subtitle": "Share of rows with and without a value",
            "value_format": "percent",
            "bars": [
                {"label": "Complete", "value": (complete / max(total, 1)) * 100, "count": complete},
                {"label": "Missing", "value": (missing / max(total, 1)) * 100, "count": missing, "highlight": True},
            ],
            "selection_reason": "Missingness is easiest to assess as complete versus missing share.",
        }

    total = dataframe.height
    duplicates = max(duplicate_rows, 0)
    non_duplicates = max(total - duplicates, 0)
    return {
        "kind": "quality",
        "title": "Duplicate row check",
        "subtitle": "Unique-looking rows versus exact duplicate rows",
        "value_format": "percent",
        "bars": [
            {"label": "Non-duplicate", "value": (non_duplicates / max(total, 1)) * 100, "count": non_duplicates},
            {"label": "Duplicate", "value": (duplicates / max(total, 1)) * 100, "count": duplicates, "highlight": True},
        ],
        "selection_reason": "A share comparison shows how much of the dataset may be duplicated.",
    }


def _concentration_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
) -> dict[str, Any] | None:
    fields = finding.get("fields") or []
    if not fields:
        return None
    field = fields[0]
    if field not in dataframe.columns:
        return None
    series = dataframe[field].drop_nulls()
    if len(series) == 0:
        return None
    try:
        counts = series.value_counts(sort=True, name="count").head(MAX_BAR_ITEMS)
        rows = counts.rows()
    except Exception:
        return None
    total = len(series)
    bars = [
        {
            "label": str(value),
            "value": (int(count) / max(total, 1)) * 100,
            "count": int(count),
            "highlight": index == 0,
        }
        for index, (value, count) in enumerate(rows)
    ]
    return {
        "kind": "bar",
        "title": f"Distribution of {field}",
        "subtitle": f"Top {len(bars)} categories by share of non-missing records",
        "x_label": "Share",
        "y_label": field,
        "value_format": "percent",
        "bars": bars,
        "selection_reason": "Category concentration is clearest when the largest shares are ranked visually.",
    }



def _histogram_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    fields = finding.get("fields") or []
    if not fields:
        return None
    field = fields[0]
    try:
        raw_values = dataframe[field].cast(pl.Float64, strict=False).drop_nulls().to_list()
    except Exception:
        return None
    values = [number for value in raw_values if (number := _finite(value)) is not None]
    if len(values) < 5:
        return None
    minimum = min(values)
    maximum = max(values)
    if minimum == maximum:
        return None
    bins = min(14, max(7, round(math.sqrt(len(values)) / 2)))
    width = (maximum - minimum) / bins
    counts = [0 for _ in range(bins)]
    for value in values:
        index = min(bins - 1, int((value - minimum) / width))
        counts[index] += 1
    bars = []
    for index, count in enumerate(counts):
        start = minimum + index * width
        end = start + width
        bars.append({
            "label": f"{start:.2g}–{end:.2g}",
            "value": count,
            "count": count,
        })
    return {
        "kind": "histogram",
        "title": f"Distribution of {field}",
        "subtitle": f"{len(values):,} non-missing observations across {bins} bins",
        "x_label": field,
        "y_label": "Frequency",
        "value_format": "number",
        "bars": bars,
        "selection_reason": "A histogram shows the shape, concentration and skew of a numeric distribution.",
    }


def _contribution_visual(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
) -> dict[str, Any] | None:
    fields = finding.get("fields") or []
    if len(fields) < 2:
        return None
    category_field, value_field = fields[:2]
    try:
        rows = dataframe.select(
            [category_field, pl.col(value_field).cast(pl.Float64, strict=False).alias(value_field)]
        ).drop_nulls().rows()
    except Exception:
        return None
    sums: dict[str, float] = defaultdict(float)
    for category, raw_value in rows:
        value = _finite(raw_value)
        if value is not None and value >= 0:
            sums[str(category)] += value
    total = sum(sums.values())
    if total <= 0:
        return None
    ranked = sorted(sums.items(), key=lambda item: item[1], reverse=True)[:MAX_BAR_ITEMS]
    bars = [
        {
            "label": label,
            "value": value / total * 100,
            "count": None,
            "highlight": index == 0,
        }
        for index, (label, value) in enumerate(ranked)
    ]
    return {
        "kind": "bar",
        "title": f"Contribution to {value_field} by {category_field}",
        "subtitle": "Share of the total contributed by each leading group",
        "x_label": "Share of total",
        "y_label": category_field,
        "value_format": "percent",
        "bars": bars,
        "selection_reason": "Contribution shares are easiest to compare with ranked bars.",
    }


def _category_distribution_visual(
    dataframe: pl.DataFrame,
    field: str,
) -> dict[str, Any] | None:
    if field not in dataframe.columns:
        return None
    series = dataframe[field].drop_nulls()
    if len(series) == 0:
        return None
    try:
        rows = series.value_counts(sort=True, name="count").head(MAX_BAR_ITEMS).rows()
    except Exception:
        return None
    total = len(series)
    bars = [
        {
            "label": str(value),
            "value": int(count) / max(total, 1) * 100,
            "count": int(count),
            "highlight": index == 0,
        }
        for index, (value, count) in enumerate(rows)
    ]
    return {
        "kind": "bar",
        "title": f"Distribution of {field}",
        "subtitle": f"Top {len(bars)} categories by share of non-missing rows",
        "x_label": "Share",
        "y_label": field,
        "value_format": "percent",
        "bars": bars,
        "selection_reason": "A ranked category chart quickly shows dominant and underrepresented groups.",
    }


def _missingness_overview_visual(
    dataframe: pl.DataFrame,
) -> dict[str, Any] | None:
    if dataframe.height <= 0:
        return None
    bars = []
    for field in dataframe.columns:
        missing = int(dataframe[field].null_count())
        if missing <= 0:
            continue
        share = missing / dataframe.height * 100
        bars.append({"label": field, "value": share, "count": missing, "highlight": share >= 20})
    if not bars:
        return None
    bars.sort(key=lambda item: float(item["value"]), reverse=True)
    return {
        "kind": "quality",
        "title": "Missing data by field",
        "subtitle": "Fields with the highest missing-value share appear first",
        "x_label": "Missing share",
        "value_format": "percent",
        "bars": bars[:MAX_BAR_ITEMS],
        "selection_reason": "A field-level missingness chart makes data quality gaps immediately comparable.",
    }


def _pearson_pairs(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 3:
        return None
    x_mean = _mean(xs)
    y_mean = _mean(ys)
    if x_mean is None or y_mean is None:
        return None
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    denominator = math.sqrt(
        sum((x - x_mean) ** 2 for x in xs) * sum((y - y_mean) ** 2 for y in ys)
    )
    if denominator == 0:
        return None
    return numerator / denominator


def _correlation_heatmap_visual(
    dataframe: pl.DataFrame,
    schema: list[dict[str, Any]],
) -> dict[str, Any] | None:
    numeric = [
        field["name"]
        for field in schema
        if field.get("semantic_role") in {"measure", "percentage", "boolean"}
    ][:8]
    if len(numeric) < 3:
        return None
    cells: list[dict[str, Any]] = []
    labels: list[str] = []
    usable: list[str] = []
    for field in numeric:
        try:
            if dataframe[field].cast(pl.Float64, strict=False).drop_nulls().n_unique() > 1:
                usable.append(field)
        except Exception:
            continue
    if len(usable) < 3:
        return None
    labels = usable
    for y_field in labels:
        for x_field in labels:
            try:
                rows = dataframe.select(
                    [
                        pl.col(x_field).cast(pl.Float64, strict=False).alias("x"),
                        pl.col(y_field).cast(pl.Float64, strict=False).alias("y"),
                    ]
                ).drop_nulls().rows()
            except Exception:
                continue
            xs = [float(row[0]) for row in rows if _finite(row[0]) is not None and _finite(row[1]) is not None]
            ys = [float(row[1]) for row in rows if _finite(row[0]) is not None and _finite(row[1]) is not None]
            value = 1.0 if x_field == y_field else _pearson_pairs(xs, ys)
            if value is not None:
                cells.append({"x": x_field, "y": y_field, "value": value})
    if not cells:
        return None
    return {
        "kind": "heatmap",
        "title": "Numeric relationship map",
        "subtitle": f"Pearson correlations across {len(labels)} numeric fields",
        "x_labels": labels,
        "y_labels": labels,
        "cells": cells,
        "value_format": "number",
        "selection_reason": "A correlation matrix reveals several numeric relationships in one view.",
    }


def _generic_histogram_for_field(
    dataframe: pl.DataFrame,
    field: str,
    schema_by_name: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    return _histogram_visual(dataframe, {"fields": [field]}, schema_by_name)


def build_visual_gallery(
    dataframe: pl.DataFrame,
    schema: list[dict[str, Any]],
    ranked_findings: list[dict[str, Any]],
    duplicate_rows: int,
    limit: int = 12,
) -> list[dict[str, Any]]:
    """Build a ranked set of useful visuals, not merely one chart per finding."""
    schema_by_name = _schema_map(schema)
    candidates: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    def add(*, visual_id: str, category: str, score: float, visual: dict[str, Any] | None, insight_id: str | None = None) -> None:
        if not visual:
            return
        key = (str(visual.get("kind")), str(visual.get("title")))
        if key in seen:
            return
        seen.add(key)
        candidates.append({
            "id": visual_id,
            "category": category,
            "score": round(max(0.0, min(100.0, score)), 1),
            "linked_insight_id": insight_id,
            "visualization": visual,
        })

    category_map = {
        "trend": "trends",
        "correlation": "relationships",
        "group_difference": "categories",
        "outcome_difference": "categories",
        "top_performer": "categories",
        "contribution": "categories",
        "concentration": "categories",
        "rare_category": "categories",
        "distribution": "distributions",
        "volatility": "distributions",
        "anomaly": "distributions",
        "data_quality": "quality",
    }

    # Start with highly ranked evidence-backed visuals.
    for finding in ranked_findings[:18]:
        visual = finding.get("visualization")
        if visual:
            add(
                visual_id=f"insight:{finding['id']}",
                category=category_map.get(str(finding.get("type")), "other"),
                score=float(finding.get("insight_score") or finding.get("signal_strength") or 60),
                visual=visual,
                insight_id=str(finding.get("id")),
            )

    # A matrix gives a true multi-variable view that individual findings cannot.
    heatmap = _correlation_heatmap_visual(dataframe, schema)
    add(visual_id="gallery:correlation-matrix", category="relationships", score=92, visual=heatmap)

    # Ensure useful distributions are visible even when they are not top-ranked insights.
    numeric_fields = [
        field for field in schema
        if field.get("semantic_role") in {"measure", "percentage"}
        and int((field.get("profile") or {}).get("unique_non_null") or 0) >= 8
    ]
    numeric_fields.sort(
        key=lambda field: (
            int((field.get("profile") or {}).get("outlier_count_iqr") or 0),
            float((field.get("profile") or {}).get("std_dev") or 0.0),
        ),
        reverse=True,
    )
    for index, field in enumerate(numeric_fields[:4]):
        name = str(field["name"])
        visual = _generic_histogram_for_field(dataframe, name, schema_by_name)
        add(
            visual_id=f"gallery:histogram:{name}",
            category="distributions",
            score=82 - index * 3,
            visual=visual,
        )

    # Category views broaden the dashboard beyond whichever categories generated findings.
    category_fields = [field for field in schema if field.get("semantic_role") == "category"]
    category_fields.sort(
        key=lambda field: float(((field.get("profile") or {}).get("top_values") or [{}])[0].get("percent") or 0.0),
        reverse=True,
    )
    for index, field in enumerate(category_fields[:4]):
        name = str(field["name"])
        add(
            visual_id=f"gallery:category:{name}",
            category="categories",
            score=78 - index * 3,
            visual=_category_distribution_visual(dataframe, name),
        )

    add(
        visual_id="gallery:missingness",
        category="quality",
        score=86,
        visual=_missingness_overview_visual(dataframe),
    )

    candidates.sort(key=lambda item: float(item["score"]), reverse=True)

    # Preserve variety: pick from several categories before filling by score.
    selected: list[dict[str, Any]] = []
    selected_ids: set[str] = set()
    for category in ["relationships", "trends", "categories", "distributions", "quality"]:
        candidate = next((item for item in candidates if item["category"] == category), None)
        if candidate and candidate["id"] not in selected_ids:
            selected.append(candidate)
            selected_ids.add(candidate["id"])
    for candidate in candidates:
        if candidate["id"] in selected_ids:
            continue
        selected.append(candidate)
        selected_ids.add(candidate["id"])
        if len(selected) >= limit:
            break
    return selected[:limit]

def build_visualization(
    dataframe: pl.DataFrame,
    finding: dict[str, Any],
    schema: list[dict[str, Any]],
    duplicate_rows: int,
) -> dict[str, Any] | None:
    schema_by_name = _schema_map(schema)
    finding_type = str(finding.get("type") or "")

    if finding_type == "trend":
        return _line_visual(dataframe, finding, schema_by_name)
    if finding_type == "correlation":
        return _scatter_visual(dataframe, finding, schema_by_name)
    if finding_type in {"group_difference", "outcome_difference", "top_performer"}:
        return _bar_visual(dataframe, finding, schema_by_name)
    if finding_type == "contribution":
        return _contribution_visual(dataframe, finding)
    if finding_type == "distribution":
        return _histogram_visual(dataframe, finding, schema_by_name)
    if finding_type == "volatility":
        return _box_visual(dataframe, finding, schema_by_name)
    if finding_type == "rare_category":
        return _concentration_visual(dataframe, finding)
    if finding_type == "anomaly":
        return _box_visual(dataframe, finding, schema_by_name)
    if finding_type == "data_quality":
        return _quality_visual(dataframe, finding, duplicate_rows)
    if finding_type == "concentration":
        return _concentration_visual(dataframe, finding)
    return None


def attach_visualizations(
    dataframe: pl.DataFrame,
    findings: list[dict[str, Any]],
    schema: list[dict[str, Any]],
    duplicate_rows: int,
) -> list[dict[str, Any]]:
    enriched: list[dict[str, Any]] = []
    for finding in findings:
        item = dict(finding)
        item["visualization"] = build_visualization(dataframe, item, schema, duplicate_rows)
        enriched.append(item)
    return enriched
