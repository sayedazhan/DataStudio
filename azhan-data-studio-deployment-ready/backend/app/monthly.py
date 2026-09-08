from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime
from statistics import mean, median, pstdev
from typing import Any

import polars as pl

MONTH_NAMES = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

DATE_NAME_TOKENS = ("date", "month", "period", "time", "timestamp")
DIMENSION_NAME_TOKENS = (
    "region", "state", "product", "category", "segment", "type", "status",
    "channel", "group", "team", "department", "branch", "dealer", "customer",
    "supplier", "market", "country", "class", "brand", "model", "owner",
)
AVERAGE_METRIC_TOKENS = ("percent", "percentage", "pct", "rate", "ratio", "share", "margin", "score", "average", "avg")


@dataclass
class SourceFrame:
    filename: str
    frame: pl.DataFrame
    sheet_name: str | None = None


def _dtype_family(dtype: pl.DataType) -> str:
    if dtype == pl.Date or dtype.base_type() == pl.Datetime:
        return "date"
    if dtype.is_integer() or dtype.is_float():
        return "numeric"
    if dtype == pl.Boolean:
        return "boolean"
    if dtype == pl.String:
        return "text"
    return "other"


def _period_label(period: str) -> str:
    match = re.fullmatch(r"(\d{4})-(\d{2})", period or "")
    if not match:
        return period
    year, month = int(match.group(1)), int(match.group(2))
    return datetime(year, month, 1).strftime("%B %Y")


def _period_from_filename(filename: str) -> str | None:
    stem = filename.rsplit(".", 1)[0].lower()
    iso = re.search(r"(?<!\d)(20\d{2})[-_. ](0?[1-9]|1[0-2])(?!\d)", stem)
    if iso:
        return f"{int(iso.group(1)):04d}-{int(iso.group(2)):02d}"

    compact = re.search(r"(?<!\d)(20\d{2})(0[1-9]|1[0-2])(?!\d)", stem)
    if compact:
        return f"{int(compact.group(1)):04d}-{int(compact.group(2)):02d}"

    reverse = re.search(r"(?<!\d)(0?[1-9]|1[0-2])[-_. ](20\d{2})(?!\d)", stem)
    if reverse:
        return f"{int(reverse.group(2)):04d}-{int(reverse.group(1)):02d}"

    year_match = re.search(r"(?<!\d)(20\d{2})(?!\d)", stem)
    if year_match:
        year = int(year_match.group(1))
        for token, month in MONTH_NAMES.items():
            if re.search(rf"(?<![a-z]){re.escape(token)}(?![a-z])", stem) or f"{token}{year}" in stem:
                return f"{year:04d}-{month:02d}"
    return None


def _parse_date_value(value: Any) -> date | datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return value
    raw = str(value).strip()
    if not raw:
        return None
    candidate = raw.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(candidate)
    except ValueError:
        pass
    for fmt in (
        "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d",
        "%d/%m/%y", "%d-%m-%y", "%b %Y", "%B %Y", "%Y-%m",
        "%d %b %Y", "%d %B %Y",
    ):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _period_for_value(value: Any) -> str | None:
    parsed = _parse_date_value(value)
    if parsed is None:
        return None
    return f"{parsed.year:04d}-{parsed.month:02d}"


def _sample_parse_ratio(series: pl.Series, limit: int = 250) -> float:
    values = series.drop_nulls().head(limit).to_list()
    if not values:
        return 0.0
    nonblank = [value for value in values if str(value).strip()]
    if not nonblank:
        return 0.0
    return sum(_period_for_value(value) is not None for value in nonblank) / len(nonblank)


def _shared_columns(sources: list[SourceFrame]) -> list[str]:
    if not sources:
        return []
    common = set(sources[0].frame.columns)
    for source in sources[1:]:
        common &= set(source.frame.columns)
    return [column for column in sources[0].frame.columns if column in common]


def _date_candidates(sources: list[SourceFrame], common: list[str]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for column in common:
        ratios: list[float] = []
        typed = 0
        for source in sources:
            dtype = source.frame.schema[column]
            if _dtype_family(dtype) == "date":
                typed += 1
                ratios.append(1.0)
            elif dtype == pl.String:
                ratios.append(_sample_parse_ratio(source.frame[column]))
            else:
                ratios.append(0.0)
        parse_ratio = sum(ratios) / max(len(ratios), 1)
        named = any(token in column.lower() for token in DATE_NAME_TOKENS)
        if typed == len(sources) or parse_ratio >= 0.72 or (named and parse_ratio >= 0.50):
            score = (35 if named else 0) + (45 if typed == len(sources) else 0) + (parse_ratio * 40)
            candidates.append({
                "field": column,
                "score": round(min(score, 100), 1),
                "parse_percent": round(parse_ratio * 100, 1),
                "typed_as_date": typed == len(sources),
            })
    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates


def _metric_candidates(sources: list[SourceFrame], common: list[str]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for column in common:
        families = [_dtype_family(source.frame.schema[column]) for source in sources]
        if all(family == "numeric" for family in families):
            lowered = column.lower()
            non_null = sum(len(source.frame[column].drop_nulls()) for source in sources)
            unique_total = sum(int(source.frame[column].drop_nulls().n_unique()) for source in sources)
            identifier_named = bool(re.search(r"(^|[_\s])(id|code|number|no)($|[_\s])", lowered)) or lowered.endswith(("_id", "id", "_code", "code"))
            if identifier_named and non_null and (unique_total / non_null) >= 0.80:
                continue
            aggregation = "average" if any(token in lowered for token in AVERAGE_METRIC_TOKENS) else "sum"
            candidates.append({"field": column, "recommended_aggregation": aggregation, "non_null_values": non_null})
    return candidates


def _dimension_candidates(sources: list[SourceFrame], common: list[str]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for column in common:
        families = [_dtype_family(source.frame.schema[column]) for source in sources]
        if not all(family in {"text", "boolean", "numeric"} for family in families):
            continue
        named = any(token in column.lower() for token in DIMENSION_NAME_TOKENS)
        unique_values: set[str] = set()
        for source in sources:
            try:
                values = source.frame[column].drop_nulls().unique().head(80).to_list()
                unique_values.update(str(value) for value in values)
            except Exception:
                pass
            if len(unique_values) > 60:
                break
        unique_count = len(unique_values)
        text_like = all(family in {"text", "boolean"} for family in families)
        total_rows = sum(source.frame.height for source in sources)
        uniqueness_ratio = unique_count / max(total_rows, 1)
        lowered = column.lower()
        identifier_named = bool(re.search(r"(^|[_\s])(id|uuid|guid|code|number|no)($|[_\s])", lowered)) or lowered.endswith(("_id", "id", "_code", "code"))
        if identifier_named and not named:
            continue
        if 2 <= unique_count <= 50 and (named or (text_like and uniqueness_ratio <= 0.70)):
            score = (35 if named else 0) + max(0, 40 - unique_count * 0.5) + max(0, 15 - uniqueness_ratio * 15)
            candidates.append({"field": column, "unique_values": unique_count, "score": round(score, 1)})
    candidates.sort(key=lambda item: (-item["score"], item["unique_values"]))
    return candidates


def _schema_warnings(sources: list[SourceFrame]) -> list[dict[str, Any]]:
    if not sources:
        return []
    reference = sources[0]
    ref_columns = set(reference.frame.columns)
    warnings: list[dict[str, Any]] = []
    for source in sources[1:]:
        columns = set(source.frame.columns)
        missing = sorted(ref_columns - columns)
        extra = sorted(columns - ref_columns)
        if missing:
            warnings.append({"type": "missing_columns", "filename": source.filename, "columns": missing, "detail": f"{len(missing)} baseline column(s) are missing."})
        if extra:
            warnings.append({"type": "new_columns", "filename": source.filename, "columns": extra, "detail": f"{len(extra)} additional column(s) were detected."})
        for column in sorted(ref_columns & columns):
            before = _dtype_family(reference.frame.schema[column])
            after = _dtype_family(source.frame.schema[column])
            if before != after:
                warnings.append({
                    "type": "type_change", "filename": source.filename, "field": column,
                    "previous_type": before, "current_type": after,
                    "detail": f"{column} changed from {before} to {after} compared with the first file.",
                })
    return warnings


def _source_period(source: SourceFrame, date_field: str | None) -> tuple[str | None, float]:
    if date_field and date_field in source.frame.columns:
        periods = [_period_for_value(value) for value in source.frame[date_field].to_list()]
        valid = [value for value in periods if value]
        if valid:
            counts = Counter(valid)
            period, count = counts.most_common(1)[0]
            concentration = count / len(valid)
            if concentration >= 0.55:
                return period, concentration
    filename_period = _period_from_filename(source.filename)
    return filename_period, 1.0 if filename_period else 0.0


def _with_periods(source: SourceFrame, date_field: str | None) -> tuple[pl.DataFrame, int]:
    fallback, _ = _source_period(source, date_field)
    invalid_dates = 0
    if date_field and date_field in source.frame.columns:
        values = source.frame[date_field].to_list()
        periods: list[str | None] = []
        for value in values:
            period = _period_for_value(value)
            if value is not None and str(value).strip() and period is None:
                invalid_dates += 1
            periods.append(period or fallback)
    else:
        periods = [fallback] * source.frame.height

    frame = source.frame.with_columns(
        pl.Series("__period", periods, dtype=pl.String),
        pl.lit(source.filename).alias("__source_file"),
    )
    return frame, invalid_dates


def _consolidate(sources: list[SourceFrame], date_field: str | None) -> tuple[pl.DataFrame, int]:
    frames: list[pl.DataFrame] = []
    invalid_dates = 0
    for source in sources:
        frame, invalid = _with_periods(source, date_field)
        frames.append(frame)
        invalid_dates += invalid
    if not frames:
        return pl.DataFrame(), 0
    return pl.concat(frames, how="diagonal_relaxed"), invalid_dates


def _period_counts(frame: pl.DataFrame) -> list[dict[str, Any]]:
    if "__period" not in frame.columns:
        return []
    rows = (
        frame.filter(pl.col("__period").is_not_null())
        .group_by("__period")
        .agg(pl.len().alias("rows"))
        .sort("__period")
        .to_dicts()
    )
    return [{"period": str(row["__period"]), "label": _period_label(str(row["__period"])), "rows": int(row["rows"])} for row in rows]


def prepare_monthly(sources: list[SourceFrame]) -> dict[str, Any]:
    common = _shared_columns(sources)
    dates = _date_candidates(sources, common)
    metrics = _metric_candidates(sources, common)
    dimensions = _dimension_candidates(sources, common)
    recommended_date = dates[0]["field"] if dates else None
    consolidated, invalid_dates = _consolidate(sources, recommended_date)
    periods = _period_counts(consolidated)
    source_meta = []
    for source in sources:
        period, concentration = _source_period(source, recommended_date)
        source_meta.append({
            "filename": source.filename,
            "sheet_name": source.sheet_name,
            "rows": source.frame.height,
            "columns": source.frame.width,
            "inferred_period": period,
            "period_label": _period_label(period) if period else None,
            "period_concentration_percent": round(concentration * 100, 1),
        })

    warnings = _schema_warnings(sources)
    unresolved = [source["filename"] for source in source_meta if not source["inferred_period"] and not recommended_date]
    if unresolved:
        warnings.append({
            "type": "period_not_detected",
            "files": unresolved,
            "detail": "A reporting period could not be detected from a date field or filename for one or more files.",
        })

    ready = len(periods) >= 2 and bool(metrics)
    return {
        "ready": ready,
        "files": source_meta,
        "file_count": len(sources),
        "total_rows": sum(source.frame.height for source in sources),
        "common_columns": common,
        "common_column_count": len(common),
        "date_candidates": dates,
        "metric_candidates": metrics,
        "dimension_candidates": dimensions,
        "recommended_date": recommended_date,
        "recommended_metric": metrics[0]["field"] if metrics else None,
        "recommended_dimension": dimensions[0]["field"] if dimensions else None,
        "recommended_aggregation": metrics[0]["recommended_aggregation"] if metrics else "sum",
        "periods": periods,
        "period_count": len(periods),
        "schema_warnings": warnings,
        "invalid_date_values": invalid_dates,
        "note": "Files are consolidated only for this analysis request. Browser persistence is handled by the Data Studio frontend.",
    }


def _metric_value(frame: pl.DataFrame, metric: str, aggregation: str) -> float:
    series = frame[metric].cast(pl.Float64, strict=False).drop_nulls()
    if len(series) == 0:
        return 0.0
    if aggregation == "average":
        value = series.mean()
    else:
        value = series.sum()
    return float(value or 0.0)


def _change_percent(before: float, after: float) -> float | None:
    if abs(before) < 1e-12:
        return None
    return ((after - before) / abs(before)) * 100


def _metric_trend(frame: pl.DataFrame, periods: list[str], metric: str, aggregation: str) -> list[dict[str, Any]]:
    trend: list[dict[str, Any]] = []
    previous: float | None = None
    for period in periods:
        subset = frame.filter(pl.col("__period") == period)
        value = _metric_value(subset, metric, aggregation)
        delta = None if previous is None else value - previous
        delta_percent = None if previous is None else _change_percent(previous, value)
        trend.append({
            "period": period,
            "label": _period_label(period),
            "rows": subset.height,
            "value": value,
            "change": delta,
            "change_percent": delta_percent,
        })
        previous = value
    return trend


def _historical_benchmark(trend: list[dict[str, Any]], current_period: str) -> dict[str, Any]:
    usable = [item for item in trend if isinstance(item.get("value"), (int, float))]
    if not usable:
        return {
            "average_value": 0.0, "median_value": 0.0, "current_vs_average": 0.0,
            "current_vs_average_percent": None, "current_rank": 0, "period_count": 0,
            "best_period": None, "best_label": None, "best_value": 0.0,
            "worst_period": None, "worst_label": None, "worst_value": 0.0,
            "volatility_percent": None, "positive_moves": 0, "negative_moves": 0,
        }

    values = [float(item["value"]) for item in usable]
    average_value = float(mean(values))
    median_value = float(median(values))
    current_item = next((item for item in usable if item.get("period") == current_period), usable[-1])
    current_value = float(current_item["value"])
    ranked = sorted(usable, key=lambda item: float(item["value"]), reverse=True)
    current_rank = next((index + 1 for index, item in enumerate(ranked) if item.get("period") == current_item.get("period")), len(ranked))
    best = ranked[0]
    worst = ranked[-1]
    volatility = None
    if len(values) >= 2 and abs(average_value) > 1e-12:
        volatility = (float(pstdev(values)) / abs(average_value)) * 100

    positive_moves = sum(1 for item in usable if (item.get("change") or 0) > 0)
    negative_moves = sum(1 for item in usable if (item.get("change") or 0) < 0)
    return {
        "average_value": average_value,
        "median_value": median_value,
        "current_vs_average": current_value - average_value,
        "current_vs_average_percent": _change_percent(average_value, current_value),
        "current_rank": current_rank,
        "period_count": len(usable),
        "best_period": best.get("period"),
        "best_label": best.get("label"),
        "best_value": float(best["value"]),
        "worst_period": worst.get("period"),
        "worst_label": worst.get("label"),
        "worst_value": float(worst["value"]),
        "volatility_percent": volatility,
        "positive_moves": positive_moves,
        "negative_moves": negative_moves,
    }


def _alert_report(
    metric: str,
    current_period: str,
    previous_value: float,
    current_value: float,
    trend: list[dict[str, Any]],
    drivers: list[dict[str, Any]],
    quality: dict[str, Any],
    threshold_percent: float,
    direction: str,
    target_value: float | None,
    target_condition: str,
) -> dict[str, Any]:
    threshold = max(0.0, min(float(threshold_percent), 1000.0))
    direction = direction if direction in {"any", "decrease", "increase"} else "any"
    target_condition = target_condition if target_condition in {"minimum", "maximum"} else "minimum"
    items: list[dict[str, Any]] = []
    pct = _change_percent(previous_value, current_value)

    movement_triggered = False
    if pct is not None:
        movement_triggered = (
            (direction == "any" and abs(pct) >= threshold)
            or (direction == "decrease" and pct <= -threshold)
            or (direction == "increase" and pct >= threshold)
        )
    if movement_triggered:
        severity = "critical" if threshold > 0 and abs(pct or 0.0) >= threshold * 2 else "warning"
        watched = "movement" if direction == "any" else direction
        items.append({
            "type": "kpi_movement",
            "severity": severity,
            "title": f"{metric} {pct:+.1f}%",
            "detail": f"The selected KPI {watched} crossed the {threshold:g}% alert threshold in {_period_label(current_period)}.",
            "value": pct,
            "threshold": threshold,
        })

    if target_value is not None:
        breached = current_value < target_value if target_condition == "minimum" else current_value > target_value
        if breached:
            relation = "below" if target_condition == "minimum" else "above"
            items.append({
                "type": "target",
                "severity": "critical",
                "title": f"{metric} target breached",
                "detail": f"Current {metric} is {_fmt_number(current_value)}, {relation} the configured {target_condition} target of {_fmt_number(target_value)}.",
                "value": current_value,
                "target": target_value,
                "target_condition": target_condition,
            })

    recent_moves = [float(item["change"]) for item in trend if item.get("change") is not None][-2:]
    if len(recent_moves) == 2:
        streak_direction = "decrease" if all(value < 0 for value in recent_moves) else "increase" if all(value > 0 for value in recent_moves) else None
        if streak_direction and direction in {"any", streak_direction}:
            items.append({
                "type": "trend_streak",
                "severity": "warning" if streak_direction == "decrease" else "info",
                "title": f"Two-period {streak_direction} streak",
                "detail": f"{metric} has moved {streak_direction} for two consecutive period-to-period changes.",
                "streak_length": 2,
            })

    if drivers:
        biggest = drivers[0]
        if biggest.get("movement_share_percent", 0.0) >= 50:
            items.append({
                "type": "driver_concentration",
                "severity": "info",
                "title": "Movement is concentrated",
                "detail": f"{biggest['value']} accounts for {biggest['movement_share_percent']:.1f}% of absolute movement across the selected dimension.",
                "value": biggest.get("movement_share_percent"),
            })

    if quality.get("status") != "Good":
        items.append({
            "type": "data_quality",
            "severity": "warning" if quality.get("status") == "Review" else "critical",
            "title": f"Data quality: {quality.get('status')}",
            "detail": f"Quality checks found {quality.get('issue_count', 0):,} flag(s) that may affect interpretation.",
            "value": quality.get("issue_count", 0),
        })

    triggered = sum(1 for item in items if item["type"] in {"kpi_movement", "target"})
    return {
        "status": "Alert" if triggered else "On track",
        "triggered_count": triggered,
        "total_signal_count": len(items),
        "threshold_percent": threshold,
        "direction": direction,
        "target_value": target_value,
        "target_condition": target_condition,
        "items": items,
    }


def _group_values(frame: pl.DataFrame, dimension: str, metric: str, aggregation: str) -> dict[str, float]:
    selected = frame.select(
        pl.col(dimension).cast(pl.String, strict=False).fill_null("(Missing)").alias("__dimension"),
        pl.col(metric).cast(pl.Float64, strict=False).alias("__metric"),
    )
    if aggregation == "average":
        rows = selected.group_by("__dimension").agg(pl.col("__metric").mean().alias("__value")).to_dicts()
    else:
        rows = selected.group_by("__dimension").agg(pl.col("__metric").sum().alias("__value")).to_dicts()
    return {str(row["__dimension"]): float(row["__value"] or 0.0) for row in rows}


def _drivers(previous: pl.DataFrame, current: pl.DataFrame, dimension: str | None, metric: str, aggregation: str) -> list[dict[str, Any]]:
    if not dimension or dimension not in previous.columns or dimension not in current.columns:
        return []
    before = _group_values(previous, dimension, metric, aggregation)
    after = _group_values(current, dimension, metric, aggregation)
    values = set(before) | set(after)
    drivers: list[dict[str, Any]] = []
    for value in values:
        previous_value = before.get(value, 0.0)
        current_value = after.get(value, 0.0)
        change = current_value - previous_value
        status = "new" if value not in before else "removed" if value not in after else "increase" if change > 0 else "decrease" if change < 0 else "unchanged"
        drivers.append({
            "value": value,
            "previous": previous_value,
            "current": current_value,
            "change": change,
            "change_percent": _change_percent(previous_value, current_value),
            "status": status,
        })
    drivers.sort(key=lambda item: abs(item["change"]), reverse=True)
    total_movement = sum(abs(item["change"]) for item in drivers) or 1.0
    for item in drivers:
        item["movement_share_percent"] = (abs(item["change"]) / total_movement) * 100
    return drivers[:12]


def _missing_by_field(frame: pl.DataFrame) -> list[dict[str, Any]]:
    fields: list[dict[str, Any]] = []
    business_columns = [column for column in frame.columns if not column.startswith("__")]
    for column in business_columns:
        series = frame[column]
        missing = series.null_count()
        if series.dtype == pl.String:
            try:
                missing = int(series.fill_null("").str.strip_chars().eq("").sum())
            except Exception:
                pass
        if missing:
            fields.append({"field": column, "missing": int(missing), "missing_percent": (missing / max(frame.height, 1)) * 100})
    fields.sort(key=lambda item: item["missing_percent"], reverse=True)
    return fields


def _duplicate_rows(frame: pl.DataFrame) -> int:
    columns = [column for column in frame.columns if not column.startswith("__")]
    if not columns or frame.height == 0:
        return 0
    try:
        return int(frame.select(columns).is_duplicated().sum())
    except Exception:
        return 0


def _new_values(previous: pl.DataFrame, current: pl.DataFrame, dimensions: list[str]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for dimension in dimensions[:5]:
        if dimension not in previous.columns or dimension not in current.columns:
            continue
        before = {str(value) for value in previous[dimension].drop_nulls().unique().to_list()}
        counts = Counter(str(value) for value in current[dimension].drop_nulls().to_list())
        for value, count in counts.items():
            if value not in before:
                output.append({"field": dimension, "value": value, "count": count})
    output.sort(key=lambda item: item["count"], reverse=True)
    return output[:30]


def _row_count_anomalies(period_counts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(period_counts) < 3:
        return []
    anomalies: list[dict[str, Any]] = []
    for index in range(2, len(period_counts)):
        current = period_counts[index]
        previous_counts = [item["rows"] for item in period_counts[max(0, index - 3):index]]
        baseline = float(median(previous_counts)) if previous_counts else 0.0
        if baseline <= 0:
            continue
        change_percent = ((current["rows"] - baseline) / baseline) * 100
        if abs(change_percent) >= 35:
            anomalies.append({**current, "baseline_rows": baseline, "change_percent": change_percent})
    return anomalies


def _period_gaps(periods: list[str]) -> list[str]:
    if len(periods) < 2:
        return []
    parsed = [datetime.strptime(period, "%Y-%m") for period in periods if re.fullmatch(r"\d{4}-\d{2}", period)]
    if len(parsed) != len(periods):
        return []
    gaps: list[str] = []
    current = parsed[0]
    final = parsed[-1]
    existing = {period.strftime("%Y-%m") for period in parsed}
    while current <= final:
        key = current.strftime("%Y-%m")
        if key not in existing:
            gaps.append(key)
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return gaps


def _quality_report(
    frame: pl.DataFrame,
    previous: pl.DataFrame,
    current: pl.DataFrame,
    date_field: str | None,
    invalid_dates: int,
    dimensions: list[str],
    schema_warnings: list[dict[str, Any]],
    period_counts: list[dict[str, Any]],
) -> dict[str, Any]:
    business_columns = [column for column in frame.columns if not column.startswith("__")]
    missing_fields = _missing_by_field(frame)
    missing_cells = sum(item["missing"] for item in missing_fields)
    total_cells = frame.height * len(business_columns)
    completeness = 100.0 if total_cells == 0 else max(0.0, 100 - (missing_cells / total_cells) * 100)
    duplicates = _duplicate_rows(frame)
    new_values = _new_values(previous, current, dimensions)
    anomalies = _row_count_anomalies(period_counts)
    gaps = _period_gaps([item["period"] for item in period_counts])

    issue_weight = (
        missing_cells
        + duplicates * 2
        + invalid_dates * 2
        + len(schema_warnings) * 5
        + len(anomalies) * 5
        + len(gaps) * 3
    )
    if issue_weight == 0:
        status = "Good"
    elif completeness >= 97 and duplicates <= max(2, frame.height * 0.005) and invalid_dates == 0 and not schema_warnings:
        status = "Review"
    else:
        status = "Attention"

    return {
        "status": status,
        "records": frame.height,
        "fields": len(business_columns),
        "completeness_percent": round(completeness, 2),
        "missing_cells": int(missing_cells),
        "duplicate_rows": duplicates,
        "invalid_dates": int(invalid_dates),
        "date_field": date_field,
        "missing_by_field": missing_fields[:20],
        "schema_warnings": schema_warnings,
        "new_values": new_values,
        "row_count_anomalies": anomalies,
        "period_gaps": [{"period": period, "label": _period_label(period)} for period in gaps],
        "issue_count": int(len(missing_fields) + duplicates + invalid_dates + len(schema_warnings) + len(anomalies) + len(gaps)),
    }


def _fmt_number(value: float) -> str:
    if abs(value) >= 1_000_000:
        return f"{value / 1_000_000:.2f}M"
    if abs(value) >= 1_000:
        return f"{value / 1_000:.1f}K"
    if abs(value) >= 100:
        return f"{value:,.0f}"
    return f"{value:,.2f}".rstrip("0").rstrip(".")


def _insights(
    metric: str,
    aggregation: str,
    previous_period: str,
    current_period: str,
    previous_value: float,
    current_value: float,
    previous_rows: int,
    current_rows: int,
    dimension: str | None,
    drivers: list[dict[str, Any]],
    quality: dict[str, Any],
) -> list[dict[str, Any]]:
    change = current_value - previous_value
    pct = _change_percent(previous_value, current_value)
    direction = "increased" if change > 0 else "decreased" if change < 0 else "was unchanged"
    pct_text = "n/a" if pct is None else f"{pct:+.1f}%"
    insights: list[dict[str, Any]] = [{
        "tone": "positive" if change > 0 else "negative" if change < 0 else "neutral",
        "title": f"{metric} {pct_text}",
        "detail": f"{metric} {direction} from {_fmt_number(previous_value)} in {_period_label(previous_period)} to {_fmt_number(current_value)} in {_period_label(current_period)} using {aggregation} aggregation.",
    }]

    row_change = current_rows - previous_rows
    row_pct = _change_percent(float(previous_rows), float(current_rows))
    insights.append({
        "tone": "info",
        "title": f"Record volume {('+' if (row_pct or 0) > 0 else '')}{(row_pct or 0):.1f}%" if row_pct is not None else "Record volume changed",
        "detail": f"The compared periods contain {previous_rows:,} and {current_rows:,} records respectively ({row_change:+,} records).",
    })

    if drivers and dimension:
        biggest = drivers[0]
        insights.append({
            "tone": "positive" if biggest["change"] > 0 else "negative" if biggest["change"] < 0 else "neutral",
            "title": f"Largest {dimension} movement: {biggest['value']}",
            "detail": f"{biggest['value']} moved by {_fmt_number(biggest['change'])} {metric} and accounts for {biggest['movement_share_percent']:.1f}% of absolute movement across {dimension} groups.",
        })
        current_top = max(drivers, key=lambda item: item["current"], default=None)
        if current_top:
            insights.append({
                "tone": "info",
                "title": f"Top {dimension}: {current_top['value']}",
                "detail": f"{current_top['value']} has the highest {aggregation} {metric} in {_period_label(current_period)} at {_fmt_number(current_top['current'])}.",
            })

    if quality["new_values"]:
        item = quality["new_values"][0]
        insights.append({
            "tone": "info",
            "title": f"New {item['field']} value detected",
            "detail": f"{item['value']} appears in {_period_label(current_period)} but not in {_period_label(previous_period)} ({item['count']:,} current record(s)).",
        })

    if quality["status"] != "Good":
        insights.append({
            "tone": "warning",
            "title": f"Data quality status: {quality['status']}",
            "detail": f"Quality checks found {quality['missing_cells']:,} missing cells, {quality['duplicate_rows']:,} duplicate rows, {quality['invalid_dates']:,} invalid date values and {len(quality['schema_warnings'])} schema warning(s).",
        })

    return insights[:7]


def analyse_monthly(
    sources: list[SourceFrame],
    metric: str,
    aggregation: str = "sum",
    date_field: str | None = None,
    dimension: str | None = None,
    previous_period: str | None = None,
    current_period: str | None = None,
    alert_threshold_percent: float = 10.0,
    alert_direction: str = "any",
    target_value: float | None = None,
    target_condition: str = "minimum",
) -> dict[str, Any]:
    prepared = prepare_monthly(sources)
    common = prepared["common_columns"]
    if metric not in common:
        raise ValueError(f"Metric '{metric}' is not shared by all uploaded files.")
    metric_fields = {item["field"] for item in prepared["metric_candidates"]}
    if metric not in metric_fields:
        raise ValueError(f"Metric '{metric}' is not numeric in every uploaded file.")
    if aggregation not in {"sum", "average"}:
        aggregation = "sum"
    if date_field and date_field not in common:
        raise ValueError(f"Date field '{date_field}' is not shared by all uploaded files.")
    if not date_field:
        date_field = prepared["recommended_date"]
    dimension_fields = {item["field"] for item in prepared["dimension_candidates"]}
    if dimension not in dimension_fields:
        dimension = prepared["recommended_dimension"]

    frame, invalid_dates = _consolidate(sources, date_field)
    counts = _period_counts(frame)
    periods = [item["period"] for item in counts]
    if len(periods) < 2:
        raise ValueError("At least two reporting periods are required. Add monthly files with a date/month field or a month and year in the filename.")

    if current_period not in periods:
        current_period = periods[-1]
    current_index = periods.index(current_period)
    if previous_period not in periods or previous_period == current_period:
        previous_period = periods[current_index - 1] if current_index > 0 else periods[1]
    if periods.index(previous_period) > current_index:
        previous_period, current_period = current_period, previous_period

    previous = frame.filter(pl.col("__period") == previous_period)
    current = frame.filter(pl.col("__period") == current_period)
    previous_value = _metric_value(previous, metric, aggregation)
    current_value = _metric_value(current, metric, aggregation)
    change = current_value - previous_value
    change_percent = _change_percent(previous_value, current_value)
    trend = _metric_trend(frame, periods, metric, aggregation)
    drivers = _drivers(previous, current, dimension, metric, aggregation)
    quality = _quality_report(
        frame,
        previous,
        current,
        date_field,
        invalid_dates,
        [item["field"] for item in prepared["dimension_candidates"]],
        prepared["schema_warnings"],
        counts,
    )
    insights = _insights(
        metric, aggregation, previous_period, current_period,
        previous_value, current_value, previous.height, current.height,
        dimension, drivers, quality,
    )
    benchmark = _historical_benchmark(trend, current_period)
    alerts = _alert_report(
        metric=metric,
        current_period=current_period,
        previous_value=previous_value,
        current_value=current_value,
        trend=trend,
        drivers=drivers,
        quality=quality,
        threshold_percent=alert_threshold_percent,
        direction=alert_direction,
        target_value=target_value,
        target_condition=target_condition,
    )

    source_periods = []
    for source in sources:
        period, concentration = _source_period(source, date_field)
        source_periods.append({
            "filename": source.filename,
            "sheet_name": source.sheet_name,
            "rows": source.frame.height,
            "columns": source.frame.width,
            "inferred_period": period,
            "period_label": _period_label(period) if period else None,
            "period_concentration_percent": round(concentration * 100, 1),
        })

    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "dataset": {
            "file_count": len(sources),
            "total_rows": frame.height,
            "fields": len([column for column in frame.columns if not column.startswith("__")]),
            "period_count": len(periods),
            "first_period": periods[0],
            "last_period": periods[-1],
            "date_field": date_field,
            "metric": metric,
            "aggregation": aggregation,
            "dimension": dimension,
        },
        "sources": source_periods,
        "periods": counts,
        "trend": trend,
        "comparison": {
            "previous_period": previous_period,
            "previous_label": _period_label(previous_period),
            "current_period": current_period,
            "current_label": _period_label(current_period),
            "previous_value": previous_value,
            "current_value": current_value,
            "change": change,
            "change_percent": change_percent,
            "previous_rows": previous.height,
            "current_rows": current.height,
            "row_change": current.height - previous.height,
            "row_change_percent": _change_percent(float(previous.height), float(current.height)),
            "previous_per_record": previous_value / previous.height if previous.height else 0.0,
            "current_per_record": current_value / current.height if current.height else 0.0,
            "per_record_change": (current_value / current.height if current.height else 0.0) - (previous_value / previous.height if previous.height else 0.0),
            "per_record_change_percent": _change_percent(
                previous_value / previous.height if previous.height else 0.0,
                current_value / current.height if current.height else 0.0,
            ),
        },
        "benchmark": benchmark,
        "alerts": alerts,
        "drivers": drivers,
        "insights": insights,
        "quality": quality,
        "options": {
            "date_candidates": prepared["date_candidates"],
            "metric_candidates": prepared["metric_candidates"],
            "dimension_candidates": prepared["dimension_candidates"],
        },
        "method": "Deterministic period aggregation, historical benchmarking, configurable KPI alert rules, arithmetic movement analysis and rule-based data-quality checks. No LLM or external AI API is used.",
    }
