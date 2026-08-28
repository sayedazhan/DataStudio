from __future__ import annotations

from typing import Any

import polars as pl

NULL_SENTINEL = "__AZHAN_DATA_STUDIO_NULL__"
MAX_PREVIEW_ROWS = 100
MAX_CHANGED_PREVIEW = 200
MAX_CHANGED_FIELDS_PER_ROW = 12


def _dtype_family(dtype: pl.DataType) -> str:
    if dtype.is_integer() or dtype.is_float():
        return "numeric"
    if dtype == pl.Boolean:
        return "boolean"
    if dtype == pl.Date or dtype.base_type() == pl.Datetime:
        return "time"
    if dtype == pl.String:
        return "text"
    return str(dtype).lower()


def _column_stats(frame: pl.DataFrame, column: str) -> dict[str, Any]:
    series = frame[column]
    missing = int(series.null_count())
    non_null = max(frame.height - missing, 0)
    unique_non_null = int(series.drop_nulls().n_unique()) if non_null else 0
    uniqueness = (unique_non_null / max(non_null, 1)) * 100
    return {
        "missing": missing,
        "non_null": non_null,
        "unique_non_null": unique_non_null,
        "uniqueness_percent": round(uniqueness, 2),
        "duplicate_non_null": max(non_null - unique_non_null, 0),
    }


def _key_score(column: str, left: dict[str, Any], right: dict[str, Any]) -> float:
    score = min(left["uniqueness_percent"], right["uniqueness_percent"])
    lowered = column.lower()
    if lowered in {"id", "key", "identifier"} or lowered.endswith(("_id", " id", "_key", " key")):
        score += 12
    elif any(token in lowered for token in ("code", "number", "no")):
        score += 5
    if left["missing"] or right["missing"]:
        score -= 20
    return score


def prepare_comparison(frame_a: pl.DataFrame, frame_b: pl.DataFrame) -> dict[str, Any]:
    columns_a = list(frame_a.columns)
    columns_b = list(frame_b.columns)
    set_a = set(columns_a)
    set_b = set(columns_b)
    common = [column for column in columns_a if column in set_b]

    dtype_map_a = dict(zip(columns_a, frame_a.dtypes))
    dtype_map_b = dict(zip(columns_b, frame_b.dtypes))
    type_changes = [
        {
            "field": column,
            "previous_type": str(dtype_map_a[column]),
            "current_type": str(dtype_map_b[column]),
            "previous_family": _dtype_family(dtype_map_a[column]),
            "current_family": _dtype_family(dtype_map_b[column]),
        }
        for column in common
        if str(dtype_map_a[column]) != str(dtype_map_b[column])
    ]

    key_candidates: list[dict[str, Any]] = []
    for column in common:
        left_stats = _column_stats(frame_a, column)
        right_stats = _column_stats(frame_b, column)
        score = _key_score(column, left_stats, right_stats)
        suitable = (
            left_stats["missing"] == 0
            and right_stats["missing"] == 0
            and left_stats["duplicate_non_null"] == 0
            and right_stats["duplicate_non_null"] == 0
        )
        key_candidates.append(
            {
                "field": column,
                "score": round(score, 1),
                "suitable": suitable,
                "previous": left_stats,
                "current": right_stats,
            }
        )

    key_candidates.sort(key=lambda item: (item["suitable"], item["score"]), reverse=True)
    recommended = next((item["field"] for item in key_candidates if item["suitable"]), None)

    return {
        "dataset_a": {"rows": frame_a.height, "columns": frame_a.width},
        "dataset_b": {"rows": frame_b.height, "columns": frame_b.width},
        "common_columns": common,
        "key_candidates": key_candidates,
        "recommended_key": recommended,
        "schema_changes": {
            "added_columns": [column for column in columns_b if column not in set_a],
            "removed_columns": [column for column in columns_a if column not in set_b],
            "type_changes": type_changes,
            "common_column_count": len(common),
        },
    }


def _normalised_key_expr(frame: pl.DataFrame, key: str) -> pl.Expr:
    dtype = frame.schema[key]
    if dtype.is_integer() or dtype.is_float():
        return pl.col(key).cast(pl.Float64, strict=False).cast(pl.String).alias("__compare_key")
    return pl.col(key).cast(pl.String, strict=False).alias("__compare_key")


def _comparison_view(frame: pl.DataFrame, key: str, common_columns: list[str]) -> pl.DataFrame:
    expressions: list[pl.Expr] = [_normalised_key_expr(frame, key)]
    for column in common_columns:
        if column == key:
            continue
        expressions.append(
            pl.col(column)
            .cast(pl.String, strict=False)
            .fill_null(NULL_SENTINEL)
            .alias(column)
        )
    return frame.select(expressions)


def _preview_records(frame: pl.DataFrame, key: str, keys: pl.Series, limit: int = MAX_PREVIEW_ROWS) -> list[dict[str, Any]]:
    if len(keys) == 0:
        return []
    key_values = keys.head(limit).to_list()
    keyed = frame.with_columns(_normalised_key_expr(frame, key))
    preferred = [key] + [column for column in frame.columns if column != key][:7]
    return keyed.filter(pl.col("__compare_key").is_in(key_values)).select(preferred).head(limit).to_dicts()


def _metric_changes(frame_a: pl.DataFrame, frame_b: pl.DataFrame, common_columns: list[str], key: str) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    for column in common_columns:
        if column == key:
            continue
        dtype_a = frame_a.schema[column]
        dtype_b = frame_b.schema[column]
        if not ((dtype_a.is_integer() or dtype_a.is_float()) and (dtype_b.is_integer() or dtype_b.is_float())):
            continue

        series_a = frame_a[column].cast(pl.Float64, strict=False).drop_nulls()
        series_b = frame_b[column].cast(pl.Float64, strict=False).drop_nulls()
        if len(series_a) == 0 or len(series_b) == 0:
            continue

        sum_a = float(series_a.sum())
        sum_b = float(series_b.sum())
        mean_a = float(series_a.mean())
        mean_b = float(series_b.mean())
        delta_sum = sum_b - sum_a
        delta_mean = mean_b - mean_a
        pct_sum = None if abs(sum_a) < 1e-12 else (delta_sum / abs(sum_a)) * 100
        pct_mean = None if abs(mean_a) < 1e-12 else (delta_mean / abs(mean_a)) * 100
        changes.append(
            {
                "field": column,
                "previous_sum": sum_a,
                "current_sum": sum_b,
                "sum_change": delta_sum,
                "sum_change_percent": pct_sum,
                "previous_mean": mean_a,
                "current_mean": mean_b,
                "mean_change": delta_mean,
                "mean_change_percent": pct_mean,
                "previous_non_null": len(series_a),
                "current_non_null": len(series_b),
            }
        )

    def magnitude(item: dict[str, Any]) -> float:
        value = item["sum_change_percent"]
        if value is None:
            return abs(item["sum_change"])
        return abs(value)

    changes.sort(key=magnitude, reverse=True)
    return changes[:30]


def _candidate_dimensions(frame_a: pl.DataFrame, frame_b: pl.DataFrame, common_columns: list[str], key: str) -> list[str]:
    dimensions: list[tuple[str, int]] = []
    dimension_name_tokens = (
        "region", "state", "product", "category", "segment", "type", "status",
        "channel", "group", "team", "department", "branch", "dealer", "customer",
        "supplier", "market", "country", "class", "brand", "model", "owner",
    )
    for column in common_columns:
        if column == key:
            continue
        dtype_a = frame_a.schema[column]
        dtype_b = frame_b.schema[column]
        family_a = _dtype_family(dtype_a)
        family_b = _dtype_family(dtype_b)
        unique_a = int(frame_a[column].drop_nulls().n_unique()) if frame_a.height else 0
        unique_b = int(frame_b[column].drop_nulls().n_unique()) if frame_b.height else 0
        unique_max = max(unique_a, unique_b)
        lowered = column.lower()

        categorical = family_a in {"text", "boolean"} and family_b in {"text", "boolean"}
        named_category = any(token in lowered for token in dimension_name_tokens)
        compact_numeric_category = (
            family_a == "numeric" and family_b == "numeric" and named_category and unique_max <= 30
        )
        if not (categorical or compact_numeric_category):
            continue
        if unique_max < 2 or unique_max > 40:
            continue
        dimensions.append((column, unique_max))

    dimensions.sort(key=lambda item: item[1])
    return [name for name, _ in dimensions[:12]]


def _group_metric_totals(frame: pl.DataFrame, dimension: str, metric: str) -> dict[str, float]:
    grouped = (
        frame.select(
            pl.col(dimension).cast(pl.String, strict=False).fill_null("(Missing)").alias("__dimension"),
            pl.col(metric).cast(pl.Float64, strict=False).fill_null(0.0).alias("__metric"),
        )
        .group_by("__dimension")
        .agg(pl.col("__metric").sum().alias("__total"))
    )
    return {str(row["__dimension"]): float(row["__total"] or 0.0) for row in grouped.to_dicts()}


def _driver_status(previous: dict[str, float], current: dict[str, float], group: str, before: float, after: float) -> str:
    if group not in previous:
        return "new_group"
    if group not in current:
        return "removed_group"
    if after > before:
        return "increase"
    if after < before:
        return "decrease"
    return "unchanged"


def _dimension_explanation(
    frame_a: pl.DataFrame,
    frame_b: pl.DataFrame,
    dimension: str,
    metric: str,
    total_change: float,
) -> dict[str, Any] | None:
    previous = _group_metric_totals(frame_a, dimension, metric)
    current = _group_metric_totals(frame_b, dimension, metric)
    groups = sorted(set(previous) | set(current))
    drivers: list[dict[str, Any]] = []

    for group in groups:
        before = float(previous.get(group, 0.0))
        after = float(current.get(group, 0.0))
        change = after - before
        if abs(change) < 1e-12:
            continue
        change_percent = None if abs(before) < 1e-12 else (change / abs(before)) * 100
        drivers.append(
            {
                "group": group,
                "previous": before,
                "current": after,
                "change": change,
                "change_percent": change_percent,
                "status": _driver_status(previous, current, group, before, after),
            }
        )

    if not drivers:
        return None

    drivers.sort(key=lambda item: abs(item["change"]), reverse=True)
    absolute_movement = sum(abs(item["change"]) for item in drivers)
    if absolute_movement <= 1e-12:
        return None

    net_sign = 1 if total_change > 1e-12 else -1 if total_change < -1e-12 else 0
    aligned_items = [item for item in drivers if net_sign == 0 or item["change"] * net_sign > 0]
    offset_items = [item for item in drivers if net_sign != 0 and item["change"] * net_sign < 0]
    aligned_movement = sum(abs(item["change"]) for item in aligned_items)
    offsetting_movement = sum(abs(item["change"]) for item in offset_items)
    direction_alignment = (aligned_movement / absolute_movement) * 100 if absolute_movement else 0.0
    top3_share = (sum(abs(item["change"]) for item in drivers[:3]) / absolute_movement) * 100
    top1_share = (abs(drivers[0]["change"]) / absolute_movement) * 100
    compactness = 100 / (1 + 0.08 * max(len(drivers) - 1, 0))
    score = min(100.0, max(0.0, 0.35 * direction_alignment + 0.30 * top3_share + 0.20 * top1_share + 0.15 * compactness))

    sum_of_group_changes = sum(item["change"] for item in drivers)
    reconciliation_error = sum_of_group_changes - total_change
    reconciliation_base = max(abs(total_change), absolute_movement, 1e-12)
    reconciliation_percent = max(0.0, 100.0 - (abs(reconciliation_error) / reconciliation_base) * 100)

    enriched: list[dict[str, Any]] = []
    for item in drivers[:8]:
        contribution = None if abs(total_change) < 1e-12 else (item["change"] / total_change) * 100
        direction_role = "neutral"
        if net_sign != 0:
            direction_role = "supports_change" if item["change"] * net_sign > 0 else "offsets_change"
        enriched.append(
            {
                **item,
                "net_change_contribution_percent": contribution,
                "absolute_movement_share_percent": (abs(item["change"]) / absolute_movement) * 100,
                "direction_role": direction_role,
            }
        )

    primary = next((item for item in drivers if net_sign == 0 or item["change"] * net_sign > 0), drivers[0])
    biggest_offset = offset_items[0] if offset_items else None
    overall_direction = "increase" if total_change > 0 else "decrease" if total_change < 0 else "movement"
    dimension_summary = (
        f"{dimension} is a strong decomposition lens for the {overall_direction}, with {direction_alignment:.1f}% direction alignment. "
        f"Its top three groups account for {top3_share:.1f}% of absolute movement."
    )

    return {
        "dimension": dimension,
        "explanatory_score": round(score, 1),
        "driver_concentration_percent": round(top3_share, 2),
        "top_driver_share_percent": round(top1_share, 2),
        "direction_alignment_percent": round(direction_alignment, 2),
        "aligned_movement": aligned_movement,
        "offsetting_movement": offsetting_movement,
        "absolute_movement": absolute_movement,
        "changed_group_count": len(drivers),
        "new_group_count": sum(1 for item in drivers if item["status"] == "new_group"),
        "removed_group_count": sum(1 for item in drivers if item["status"] == "removed_group"),
        "reconciliation_percent": round(reconciliation_percent, 2),
        "primary_driver": {
            "group": primary["group"],
            "change": primary["change"],
            "previous": primary["previous"],
            "current": primary["current"],
        },
        "biggest_offset": None if biggest_offset is None else {
            "group": biggest_offset["group"],
            "change": biggest_offset["change"],
            "previous": biggest_offset["previous"],
            "current": biggest_offset["current"],
        },
        "contributors": enriched,
        "summary": dimension_summary,
    }


def _explain_metric_change(
    frame_a: pl.DataFrame,
    frame_b: pl.DataFrame,
    metric_change: dict[str, Any],
    dimensions: list[str],
) -> dict[str, Any] | None:
    metric = metric_change["field"]
    total_change = float(metric_change["sum_change"])
    dimension_results: list[dict[str, Any]] = []

    for dimension in dimensions:
        explanation = _dimension_explanation(frame_a, frame_b, dimension, metric, total_change)
        if explanation is not None:
            dimension_results.append(explanation)

    if not dimension_results:
        return None

    dimension_results.sort(key=lambda item: item["explanatory_score"], reverse=True)
    dimension_results = dimension_results[:5]
    for index, item in enumerate(dimension_results, start=1):
        item["rank"] = index

    best = dimension_results[0]
    primary = best["primary_driver"]
    primary_direction = "increased" if primary["change"] > 0 else "decreased"
    direction = "increase" if total_change > 0 else "decrease" if total_change < 0 else "movement"
    summary = (
        f"{metric} recorded a {direction} of {total_change:+,.2f}. "
        f"{best['dimension']} is the highest-ranked decomposition dimension (score {best['explanatory_score']:.0f}/100). "
        f"Its primary driver, {primary['group']}, {primary_direction} by {primary['change']:+,.2f}."
    )

    story_points = [
        {
            "label": "Primary driver",
            "value": str(primary["group"]),
            "detail": f"{primary['change']:+,.2f} movement",
            "tone": "positive" if primary["change"] > 0 else "negative",
        },
        {
            "label": "Driver concentration",
            "value": f"{best['driver_concentration_percent']:.1f}%",
            "detail": "share of absolute movement from top 3 groups",
            "tone": "neutral",
        },
        {
            "label": "Direction alignment",
            "value": f"{best['direction_alignment_percent']:.1f}%",
            "detail": "movement aligned with the overall direction",
            "tone": "neutral",
        },
    ]
    if best["biggest_offset"] is not None:
        offset = best["biggest_offset"]
        story_points.append(
            {
                "label": "Biggest offset",
                "value": str(offset["group"]),
                "detail": f"{offset['change']:+,.2f} offsetting movement",
                "tone": "negative" if total_change > 0 else "positive",
            }
        )

    return {
        "metric": metric,
        "previous_total": float(metric_change["previous_sum"]),
        "current_total": float(metric_change["current_sum"]),
        "total_change": total_change,
        "total_change_percent": metric_change.get("sum_change_percent"),
        "dimension": best["dimension"],
        "driver_concentration_percent": best["driver_concentration_percent"],
        "direction_alignment_percent": best["direction_alignment_percent"],
        "aligned_movement": best["aligned_movement"],
        "offsetting_movement": best["offsetting_movement"],
        "dimensions_scanned": len(dimensions),
        "contributors": best["contributors"],
        "dimensions": dimension_results,
        "story_points": story_points,
        "summary": summary,
        "caveat": "Driver analysis is a deterministic arithmetic decomposition by category. Rankings indicate explanatory concentration, not statistical or causal proof.",
    }


def _explain_changes(
    frame_a: pl.DataFrame,
    frame_b: pl.DataFrame,
    common_columns: list[str],
    key: str,
    metric_changes: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    dimensions = _candidate_dimensions(frame_a, frame_b, common_columns, key)
    explanations: list[dict[str, Any]] = []
    for metric_change in metric_changes[:10]:
        explanation = _explain_metric_change(frame_a, frame_b, metric_change, dimensions)
        if explanation is not None:
            explanations.append(explanation)
    return explanations

def compare_datasets(frame_a: pl.DataFrame, frame_b: pl.DataFrame, key: str) -> dict[str, Any]:
    preparation = prepare_comparison(frame_a, frame_b)
    common_columns = preparation["common_columns"]
    if key not in common_columns:
        raise ValueError(f"'{key}' must exist in both datasets.")

    candidate = next((item for item in preparation["key_candidates"] if item["field"] == key), None)
    if candidate is None:
        raise ValueError("The selected comparison key is unavailable.")
    if candidate["previous"]["missing"] or candidate["current"]["missing"]:
        raise ValueError("The comparison key contains missing values. Choose a field with no missing keys.")
    if candidate["previous"]["duplicate_non_null"] or candidate["current"]["duplicate_non_null"]:
        raise ValueError("The comparison key is not unique in both datasets. Dataset Compare requires one unique key per row.")

    view_a = _comparison_view(frame_a, key, common_columns)
    view_b = _comparison_view(frame_b, key, common_columns)

    keys_a = view_a["__compare_key"]
    keys_b = view_b["__compare_key"]
    added_keys = view_b.join(view_a.select("__compare_key"), on="__compare_key", how="anti")["__compare_key"]
    removed_keys = view_a.join(view_b.select("__compare_key"), on="__compare_key", how="anti")["__compare_key"]

    comparable_columns = [column for column in common_columns if column != key]
    right = view_b.rename({column: f"{column}__current" for column in comparable_columns})
    joined = view_a.join(right, on="__compare_key", how="inner")

    if comparable_columns:
        change_expressions = [pl.col(column) != pl.col(f"{column}__current") for column in comparable_columns]
        changed_mask = pl.any_horizontal(change_expressions)
        modified = joined.filter(changed_mask)
    else:
        modified = joined.head(0)

    common_count = joined.height
    modified_count = modified.height
    unchanged_count = max(common_count - modified_count, 0)

    changed_preview: list[dict[str, Any]] = []
    for row in modified.head(MAX_CHANGED_PREVIEW).iter_rows(named=True):
        changed_fields: list[dict[str, Any]] = []
        for column in comparable_columns:
            before = row.get(column)
            after = row.get(f"{column}__current")
            if before == after:
                continue
            changed_fields.append(
                {
                    "field": column,
                    "before": None if before == NULL_SENTINEL else before,
                    "after": None if after == NULL_SENTINEL else after,
                }
            )
        changed_preview.append(
            {
                "key": row["__compare_key"],
                "changed_field_count": len(changed_fields),
                "changes": changed_fields[:MAX_CHANGED_FIELDS_PER_ROW],
            }
        )

    union_key_count = len(set(keys_a.to_list()) | set(keys_b.to_list()))
    match_percent = (common_count / max(union_key_count, 1)) * 100
    modified_percent = (modified_count / max(common_count, 1)) * 100
    row_delta = frame_b.height - frame_a.height
    row_delta_percent = None if frame_a.height == 0 else (row_delta / frame_a.height) * 100

    metric_changes = _metric_changes(frame_a, frame_b, common_columns, key)
    explain_changes = _explain_changes(frame_a, frame_b, common_columns, key, metric_changes)
    highlights: list[dict[str, str]] = []
    if row_delta == 0:
        highlights.append({"type": "rows", "title": "Row count is unchanged", "detail": f"Both datasets contain {frame_a.height:,} rows."})
    else:
        direction = "increased" if row_delta > 0 else "decreased"
        pct_text = "" if row_delta_percent is None else f" ({row_delta_percent:+.1f}%)"
        highlights.append({"type": "rows", "title": f"Row count {direction}", "detail": f"{frame_a.height:,} → {frame_b.height:,} rows{pct_text}."})

    highlights.append(
        {
            "type": "records",
            "title": f"{modified_count:,} matching records changed",
            "detail": f"{modified_percent:.1f}% of records present in both datasets have at least one changed field.",
        }
    )
    if metric_changes:
        top_metric = metric_changes[0]
        pct = top_metric["sum_change_percent"]
        detail = f"Total changed by {top_metric['sum_change']:+,.2f}." if pct is None else f"Total changed by {pct:+.1f}% ({top_metric['sum_change']:+,.2f})."
        highlights.append({"type": "metric", "title": f"Largest metric movement: {top_metric['field']}", "detail": detail})

    return {
        "summary": {
            "previous_rows": frame_a.height,
            "current_rows": frame_b.height,
            "row_change": row_delta,
            "row_change_percent": row_delta_percent,
            "added_records": len(added_keys),
            "removed_records": len(removed_keys),
            "modified_records": modified_count,
            "unchanged_records": unchanged_count,
            "matching_records": common_count,
            "match_percent": round(match_percent, 2),
            "modified_percent": round(modified_percent, 2),
        },
        "key": {
            "field": key,
            "previous": candidate["previous"],
            "current": candidate["current"],
        },
        "schema_changes": preparation["schema_changes"],
        "metric_changes": metric_changes,
        "explain_changes": explain_changes,
        "highlights": highlights,
        "changed_records": changed_preview,
        "added_preview": _preview_records(frame_b, key, added_keys),
        "removed_preview": _preview_records(frame_a, key, removed_keys),
        "preview_limits": {
            "changed_records": MAX_CHANGED_PREVIEW,
            "added_records": MAX_PREVIEW_ROWS,
            "removed_records": MAX_PREVIEW_ROWS,
        },
        "method": "Deterministic key-based comparison using exact field-value changes across shared columns.",
        "note": "Dataset Compare requires a unique, non-missing comparison key in both datasets.",
    }
