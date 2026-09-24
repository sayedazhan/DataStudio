from __future__ import annotations

import math
import re
from typing import Any

import polars as pl


_AVERAGE_TOKENS = {
    "avg", "average", "mean", "rate", "ratio", "share", "pct", "percent", "percentage",
    "margin", "score", "satisfaction", "utilisation", "utilization", "conversion",
}
_SUM_PRIORITY = {
    "revenue": 100, "sales": 98, "profit": 96, "amount": 92, "value": 88,
    "units": 84, "quantity": 82, "qty": 82, "cost": 78, "expense": 76,
}
_CATEGORY_PRIORITY = {
    "state": 100, "region": 98, "product": 96, "category": 94, "department": 92,
    "segment": 90, "status": 88, "country": 86, "team": 84, "type": 82,
}


def _tokens(name: str) -> set[str]:
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name.strip())
    return {part for part in re.sub(r"[^A-Za-z0-9]+", "_", snake).lower().split("_") if part}


def _safe_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(number) or math.isinf(number):
        return None
    return number


def _field_role(schema: list[dict[str, Any]], name: str) -> str:
    for field in schema:
        if field.get("name") == name:
            return str(field.get("semantic_role") or "other")
    return "other"


def _measure_priority(field: dict[str, Any]) -> tuple[int, str]:
    name = str(field.get("name") or "")
    tokens = _tokens(name)
    score = max((_SUM_PRIORITY.get(token, 0) for token in tokens), default=0)
    if field.get("semantic_role") == "percentage":
        score = max(score, 72)
    return (-score, name.lower())


def _category_priority(field: dict[str, Any]) -> tuple[int, str]:
    name = str(field.get("name") or "")
    tokens = _tokens(name)
    score = max((_CATEGORY_PRIORITY.get(token, 0) for token in tokens), default=0)
    return (-score, name.lower())


def _aggregation_for(field: dict[str, Any]) -> str:
    role = str(field.get("semantic_role") or "")
    tokens = _tokens(str(field.get("name") or ""))
    if role == "percentage" or tokens.intersection(_AVERAGE_TOKENS):
        return "average"
    return "sum"


def _format_for(field: dict[str, Any]) -> str:
    role = str(field.get("semantic_role") or "")
    tokens = _tokens(str(field.get("name") or ""))
    if role == "percentage" or tokens.intersection({"pct", "percent", "percentage", "margin", "rate", "ratio", "share"}):
        return "percent"
    if tokens.intersection({"revenue", "sales", "profit", "amount", "cost", "expense", "price", "value"}):
        return "currency"
    return "number"


def _aggregate_expr(field: dict[str, Any]) -> pl.Expr:
    name = str(field["name"])
    expr = pl.col(name).cast(pl.Float64, strict=False)
    if _aggregation_for(field) == "average":
        return expr.mean().alias("value")
    return expr.sum().alias("value")


def _lookup_field(schema: list[dict[str, Any]], name: str | None) -> dict[str, Any] | None:
    if not name:
        return None
    return next((field for field in schema if field.get("name") == name), None)


def _default_config(schema: list[dict[str, Any]]) -> dict[str, str | None]:
    measures = sorted(
        [field for field in schema if field.get("semantic_role") in {"measure", "percentage"}],
        key=_measure_priority,
    )
    categories = sorted(
        [
            field for field in schema
            if field.get("semantic_role") in {"category", "boolean"}
            or (
                field.get("semantic_role") == "text"
                and int(field.get("unique_count") or 0) <= 30
            )
        ],
        key=_category_priority,
    )
    times = [field for field in schema if field.get("semantic_role") == "time"]

    return {
        "primary_metric": str(measures[0]["name"]) if measures else None,
        "secondary_metric": str(measures[1]["name"]) if len(measures) > 1 else (str(measures[0]["name"]) if measures else None),
        "trend_field": str(times[0]["name"]) if times else None,
        "breakdown_field": str(categories[0]["name"]) if categories else None,
        "compare_field": str(categories[1]["name"]) if len(categories) > 1 else (str(categories[0]["name"]) if categories else None),
        "distribution_metric": str(measures[0]["name"]) if measures else None,
        "top_field": str(categories[0]["name"]) if categories else None,
    }


def _sanitize_config(schema: list[dict[str, Any]], requested: dict[str, Any] | None) -> dict[str, str | None]:
    defaults = _default_config(schema)
    requested = requested or {}
    names = {str(field.get("name")) for field in schema}
    config: dict[str, str | None] = {}
    for key, default in defaults.items():
        value = requested.get(key)
        config[key] = str(value) if value in names else default
    return config


def _apply_filters(frame: pl.DataFrame, filters: dict[str, Any] | None) -> pl.DataFrame:
    filtered = frame
    for field, value in (filters or {}).items():
        if field not in filtered.columns or value in (None, "", "__all__"):
            continue
        try:
            filtered = filtered.filter(pl.col(field).cast(pl.String, strict=False) == str(value))
        except Exception:
            continue
    return filtered


def _filter_options(frame: pl.DataFrame, fields: list[str], limit: int = 30) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for field in fields[:4]:
        if field not in frame.columns:
            continue
        try:
            counts = (
                frame.select(pl.col(field).cast(pl.String, strict=False).alias(field))
                .drop_nulls()
                .group_by(field)
                .len(name="count")
                .sort("count", descending=True)
                .head(limit)
            )
            values = [
                {"value": str(row[field]), "count": int(row["count"])}
                for row in counts.to_dicts()
                if row.get(field) not in (None, "")
            ]
        except Exception:
            values = []
        output.append({"field": field, "label": field, "values": values})
    return output


def _kpi_change(frame: pl.DataFrame, metric_field: dict[str, Any], time_field: str | None) -> float | None:
    if not time_field or time_field not in frame.columns or frame.height < 2:
        return None
    metric = str(metric_field["name"])
    if metric not in frame.columns:
        return None
    try:
        grouped = (
            frame.drop_nulls([time_field])
            .group_by(time_field)
            .agg(_aggregate_expr(metric_field))
            .sort(time_field)
        )
        if grouped.height < 2:
            return None
        previous = _safe_number(grouped["value"][-2])
        current = _safe_number(grouped["value"][-1])
        if previous in (None, 0) or current is None:
            return None
        return round(((current - previous) / abs(previous)) * 100, 1)
    except Exception:
        return None


def _kpis(frame: pl.DataFrame, schema: list[dict[str, Any]], config: dict[str, str | None]) -> list[dict[str, Any]]:
    measure_fields = sorted(
        [field for field in schema if field.get("semantic_role") in {"measure", "percentage"}],
        key=_measure_priority,
    )
    ordered_names: list[str] = []
    for candidate in [config.get("primary_metric"), config.get("secondary_metric")]:
        if candidate and candidate not in ordered_names:
            ordered_names.append(candidate)
    for field in measure_fields:
        name = str(field["name"])
        if name not in ordered_names:
            ordered_names.append(name)
    output: list[dict[str, Any]] = []
    for name in ordered_names[:4]:
        field = _lookup_field(schema, name)
        if not field or name not in frame.columns:
            continue
        try:
            value = _safe_number(frame.select(_aggregate_expr(field)).item())
        except Exception:
            value = None
        output.append(
            {
                "field": name,
                "label": name,
                "value": value,
                "aggregation": _aggregation_for(field),
                "format": _format_for(field),
                "change_percent": _kpi_change(frame, field, config.get("trend_field")),
            }
        )
    if len(output) < 4:
        output.append({"field": "__rows__", "label": "Records", "value": frame.height, "aggregation": "count", "format": "number", "change_percent": None})
    return output[:4]


def _trend(frame: pl.DataFrame, schema: list[dict[str, Any]], config: dict[str, str | None]) -> dict[str, Any] | None:
    metric = _lookup_field(schema, config.get("primary_metric"))
    time_name = config.get("trend_field")
    if not metric or not time_name or time_name not in frame.columns:
        return None
    try:
        grouped = (
            frame.drop_nulls([time_name])
            .group_by(time_name)
            .agg(_aggregate_expr(metric))
            .sort(time_name)
            .tail(36)
        )
        points = [
            {"label": str(row[time_name]), "value": _safe_number(row["value"]) or 0}
            for row in grouped.to_dicts()
        ]
        return {
            "title": f"{metric['name']} trend",
            "subtitle": f"{_aggregation_for(metric).title()} by {time_name}",
            "field": str(metric["name"]),
            "time_field": time_name,
            "format": _format_for(metric),
            "points": points,
        }
    except Exception:
        return None


def _category_series(
    frame: pl.DataFrame,
    schema: list[dict[str, Any]],
    metric_name: str | None,
    category_name: str | None,
    limit: int = 8,
) -> dict[str, Any] | None:
    metric = _lookup_field(schema, metric_name)
    if not metric or not category_name or category_name not in frame.columns:
        return None
    try:
        grouped = (
            frame.drop_nulls([category_name])
            .group_by(category_name)
            .agg(_aggregate_expr(metric))
            .sort("value", descending=True)
            .head(limit)
        )
        bars = [
            {"label": str(row[category_name]), "value": _safe_number(row["value"]) or 0}
            for row in grouped.to_dicts()
        ]
        return {
            "title": f"{metric['name']} by {category_name}",
            "metric": str(metric["name"]),
            "category": category_name,
            "format": _format_for(metric),
            "bars": bars,
        }
    except Exception:
        return None


def _distribution(frame: pl.DataFrame, schema: list[dict[str, Any]], metric_name: str | None, bins: int = 8) -> dict[str, Any] | None:
    metric = _lookup_field(schema, metric_name)
    if not metric or metric_name not in frame.columns:
        return None
    try:
        numeric = frame[metric_name].cast(pl.Float64, strict=False).drop_nulls()
        if len(numeric) < 2:
            return None
        minimum = _safe_number(numeric.min())
        maximum = _safe_number(numeric.max())
        if minimum is None or maximum is None:
            return None
        if minimum == maximum:
            return {"title": f"{metric_name} distribution", "metric": metric_name, "format": _format_for(metric), "bars": [{"label": f"{minimum:g}", "value": len(numeric)}]}
        width = (maximum - minimum) / bins
        counts = [0 for _ in range(bins)]
        # Series iteration avoids creating a large Python row structure.
        for raw in numeric:
            value = _safe_number(raw)
            if value is None:
                continue
            index = min(bins - 1, max(0, int((value - minimum) / width)))
            counts[index] += 1
        bars = []
        for index, count in enumerate(counts):
            start = minimum + width * index
            end = minimum + width * (index + 1)
            bars.append({"label": f"{start:.1f}–{end:.1f}", "value": count})
        return {"title": f"{metric_name} distribution", "metric": metric_name, "format": "number", "bars": bars}
    except Exception:
        return None


def _heatmap(
    frame: pl.DataFrame,
    schema: list[dict[str, Any]],
    metric_name: str | None,
    x_field: str | None,
    y_field: str | None,
) -> dict[str, Any] | None:
    metric = _lookup_field(schema, metric_name)
    if not metric or not x_field or not y_field or x_field == y_field:
        return None
    if x_field not in frame.columns or y_field not in frame.columns:
        return None
    try:
        top_x = frame.group_by(x_field).len(name="count").sort("count", descending=True).head(6)[x_field].to_list()
        top_y = frame.group_by(y_field).len(name="count").sort("count", descending=True).head(6)[y_field].to_list()
        limited = frame.filter(pl.col(x_field).is_in(top_x) & pl.col(y_field).is_in(top_y))
        grouped = limited.group_by([x_field, y_field]).agg(_aggregate_expr(metric))
        cells = [
            {"x": str(row[x_field]), "y": str(row[y_field]), "value": _safe_number(row["value"]) or 0}
            for row in grouped.to_dicts()
        ]
        return {
            "title": f"{metric_name} by {x_field} and {y_field}",
            "metric": metric_name,
            "x_field": x_field,
            "y_field": y_field,
            "format": _format_for(metric),
            "x_labels": [str(value) for value in top_x],
            "y_labels": [str(value) for value in top_y],
            "cells": cells,
        }
    except Exception:
        return None


def _top_performers(frame: pl.DataFrame, schema: list[dict[str, Any]], config: dict[str, str | None]) -> dict[str, Any] | None:
    series = _category_series(frame, schema, config.get("primary_metric"), config.get("top_field"), limit=10)
    if not series:
        return None
    return {
        "title": f"Top {series['category']} by {series['metric']}",
        "field": series["category"],
        "metric": series["metric"],
        "format": series["format"],
        "rows": [
            {"rank": index + 1, "label": bar["label"], "value": bar["value"]}
            for index, bar in enumerate(series["bars"])
        ],
    }


def _insights(
    frame: pl.DataFrame,
    schema: list[dict[str, Any]],
    config: dict[str, str | None],
    trend: dict[str, Any] | None,
    breakdown: dict[str, Any] | None,
    quality_score: float | None,
) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    if trend and len(trend.get("points", [])) >= 2:
        previous = _safe_number(trend["points"][-2].get("value"))
        current = _safe_number(trend["points"][-1].get("value"))
        if previous not in (None, 0) and current is not None:
            change = ((current - previous) / abs(previous)) * 100
            direction = "increased" if change >= 0 else "decreased"
            output.append({"tone": "positive" if change >= 0 else "warning", "text": f"{trend['field']} {direction} by {abs(change):.1f}% in the latest {trend['time_field']} period."})
    if breakdown and breakdown.get("bars"):
        bars = breakdown["bars"]
        total = sum(float(item.get("value") or 0) for item in bars)
        leader = bars[0]
        share = (float(leader.get("value") or 0) / total * 100) if total else 0
        output.append({"tone": "info", "text": f"{leader['label']} is the leading {breakdown['category']} for {breakdown['metric']}, contributing {share:.1f}% of the displayed total."})
    primary = _lookup_field(schema, config.get("primary_metric"))
    if primary and frame.height:
        try:
            value = frame.select(_aggregate_expr(primary)).item()
            output.append({"tone": "neutral", "text": f"The current filtered view contains {frame.height:,} records and {_aggregation_for(primary)} {primary['name']} of {float(value):,.1f}."})
        except Exception:
            pass
    if quality_score is not None:
        if quality_score >= 90:
            output.append({"tone": "positive", "text": f"Data quality is strong at {quality_score:.0f}/100, so dashboard measures should require only minor validation."})
        elif quality_score >= 75:
            output.append({"tone": "warning", "text": f"Data quality is {quality_score:.0f}/100. Review the flagged quality issues before relying on dashboard totals for decisions."})
        else:
            output.append({"tone": "warning", "text": f"Data quality is {quality_score:.0f}/100. Resolve material quality issues before using this dashboard for decision-making."})
    return output[:5]


def build_dashboard(
    frame: pl.DataFrame,
    schema: list[dict[str, Any]],
    requested_config: dict[str, Any] | None = None,
    filters: dict[str, Any] | None = None,
    quality_score: float | None = None,
) -> dict[str, Any]:
    config = _sanitize_config(schema, requested_config)
    category_fields = [
        str(field["name"])
        for field in sorted(schema, key=_category_priority)
        if field.get("semantic_role") in {"category", "boolean"}
        or (field.get("semantic_role") == "text" and int(field.get("unique_count") or 0) <= 30)
    ]
    measure_fields = [
        str(field["name"])
        for field in sorted(schema, key=_measure_priority)
        if field.get("semantic_role") in {"measure", "percentage"}
    ]
    time_fields = [str(field["name"]) for field in schema if field.get("semantic_role") == "time"]

    filtered = _apply_filters(frame, filters)
    trend = _trend(filtered, schema, config)
    breakdown = _category_series(filtered, schema, config.get("primary_metric"), config.get("breakdown_field"))
    compare = _category_series(filtered, schema, config.get("secondary_metric"), config.get("compare_field"))
    distribution = _distribution(filtered, schema, config.get("distribution_metric"))
    heatmap = _heatmap(filtered, schema, config.get("primary_metric"), config.get("breakdown_field"), config.get("compare_field"))
    top_performers = _top_performers(filtered, schema, config)

    return {
        "available": bool(measure_fields),
        "message": None if measure_fields else "This dataset does not contain a numeric measure suitable for an automatic dashboard.",
        "config": config,
        "options": {
            "measures": measure_fields,
            "categories": category_fields,
            "times": time_fields,
        },
        "filters": _filter_options(frame, category_fields),
        "active_filters": {key: value for key, value in (filters or {}).items() if value not in (None, "", "__all__")},
        "total_rows": int(frame.height),
        "filtered_rows": int(filtered.height),
        "kpis": _kpis(filtered, schema, config),
        "trend": trend,
        "breakdown": breakdown,
        "compare": compare,
        "distribution": distribution,
        "heatmap": heatmap,
        "top_performers": top_performers,
        "insights": _insights(filtered, schema, config, trend, breakdown, quality_score),
        "records": filtered.head(100).to_dicts(),
        "method": "Dashboard visuals are selected deterministically from inferred numeric, time and category fields. Users can change the selected fields without altering the source data.",
    }
