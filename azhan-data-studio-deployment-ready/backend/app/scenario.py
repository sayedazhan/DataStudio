from __future__ import annotations

import math
import re
from typing import Any

import polars as pl


CALCULATIONS = {"single", "difference", "ratio", "product", "margin_percent"}
AGGREGATIONS = {"sum", "mean"}


def _normalise_name(name: str) -> str:
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name.strip())
    return re.sub(r"[^A-Za-z0-9]+", "_", snake).strip("_").lower()


def _safe_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _pct_change(current: float, baseline: float) -> float | None:
    if abs(baseline) < 1e-12:
        return None
    return ((current - baseline) / abs(baseline)) * 100.0


def _calculate(a: float, b: float | None, calculation: str) -> float:
    if calculation == "single":
        return a
    if b is None:
        raise ValueError("This calculation requires Metric B.")
    if calculation == "difference":
        return a - b
    if calculation == "ratio":
        if abs(b) < 1e-12:
            raise ValueError("Metric B is zero, so the ratio cannot be calculated.")
        return (a / b) * 100.0
    if calculation == "product":
        return a * b
    if calculation == "margin_percent":
        if abs(a) < 1e-12:
            raise ValueError("Metric A is zero, so margin percentage cannot be calculated.")
        return ((a - b) / a) * 100.0
    raise ValueError(f"Unsupported scenario calculation: {calculation}.")


def _aggregate(frame: pl.DataFrame, field: str, aggregation: str) -> float:
    if field not in frame.columns:
        raise ValueError(f"Field '{field}' was not found in the dataset.")
    series = frame[field].cast(pl.Float64, strict=False).drop_nulls()
    if len(series) == 0:
        raise ValueError(f"Field '{field}' does not contain usable numeric values.")
    if aggregation == "sum":
        value = series.sum()
    elif aggregation == "mean":
        value = series.mean()
    else:
        raise ValueError("Aggregation must be 'sum' or 'mean'.")
    number = _safe_float(value)
    if number is None:
        raise ValueError(f"Unable to aggregate '{field}'.")
    return number


def _metric_score(name: str, unique_ratio: float, non_null: int) -> int:
    normalised = _normalise_name(name)
    score = 50
    tokens = set(normalised.split("_"))
    priority_weights = {
        "revenue": 38, "sales": 38, "profit": 36, "income": 34, "amount": 32, "value": 30,
        "cost": 30, "expense": 28, "spend": 28, "margin": 26, "units": 24, "quantity": 24,
        "qty": 24, "volume": 22, "demand": 22, "price": 20,
    }
    score += max((priority_weights.get(token, 0) for token in tokens), default=0)
    if unique_ratio > 0.95 and tokens.intersection({"id", "code", "number", "no", "key"}):
        score -= 55
    if non_null >= 20:
        score += 8
    return max(0, min(score, 100))


def prepare_scenario(frame: pl.DataFrame) -> dict[str, Any]:
    numeric_candidates: list[dict[str, Any]] = []
    dimension_candidates: list[dict[str, Any]] = []
    rows = frame.height

    for name, dtype in zip(frame.columns, frame.dtypes):
        series = frame[name]
        non_null = rows - series.null_count()
        if dtype.is_numeric() and dtype != pl.Boolean:
            numeric = series.cast(pl.Float64, strict=False).drop_nulls()
            if len(numeric) == 0:
                continue
            unique = numeric.n_unique()
            unique_ratio = unique / max(len(numeric), 1)
            score = _metric_score(name, unique_ratio, len(numeric))
            if score <= 20:
                continue
            numeric_candidates.append(
                {
                    "field": name,
                    "non_null": len(numeric),
                    "unique_values": unique,
                    "sum": round(float(numeric.sum()), 6),
                    "mean": round(float(numeric.mean()), 6),
                    "minimum": round(float(numeric.min()), 6),
                    "maximum": round(float(numeric.max()), 6),
                    "score": score,
                }
            )

        unique_non_null = series.drop_nulls().n_unique() if non_null else 0
        if 2 <= unique_non_null <= 40 and unique_non_null <= max(2, int(rows * 0.5)):
            if dtype == pl.String or dtype == pl.Boolean or dtype.is_integer():
                dimension_tokens = set(_normalise_name(name).split("_"))
                dimension_bonus = 0
                for token, bonus in {"region": 28, "product": 24, "segment": 22, "channel": 18, "category": 16, "state": 16, "team": 12, "department": 12}.items():
                    if token in dimension_tokens:
                        dimension_bonus = max(dimension_bonus, bonus)
                dimension_candidates.append(
                    {
                        "field": name,
                        "unique_values": unique_non_null,
                        "missing": series.null_count(),
                        "score": min(100, max(20, 70 - unique_non_null) + dimension_bonus),
                    }
                )

    numeric_candidates.sort(key=lambda item: (-item["score"], item["field"].lower()))
    dimension_candidates.sort(key=lambda item: (-item["score"], item["field"].lower()))

    recommended_a = numeric_candidates[0]["field"] if numeric_candidates else None
    recommended_b = None
    if len(numeric_candidates) > 1:
        for item in numeric_candidates[1:]:
            if item["field"] != recommended_a:
                recommended_b = item["field"]
                break

    return {
        "rows": frame.height,
        "columns": frame.width,
        "metric_candidates": numeric_candidates,
        "dimension_candidates": dimension_candidates,
        "recommended_metric_a": recommended_a,
        "recommended_metric_b": recommended_b,
        "recommended_dimension": dimension_candidates[0]["field"] if dimension_candidates else None,
        "ready": bool(numeric_candidates),
    }


def _scenario_values(
    base_a: float,
    base_b: float | None,
    calculation: str,
    adjust_a: float,
    adjust_b: float,
) -> dict[str, float | None]:
    scenario_a = base_a * (1.0 + adjust_a / 100.0)
    scenario_b = None if base_b is None else base_b * (1.0 + adjust_b / 100.0)
    target = _calculate(scenario_a, scenario_b, calculation)
    return {"metric_a": scenario_a, "metric_b": scenario_b, "target": target}


def _driver_sensitivity(
    base_a: float,
    base_b: float | None,
    base_target: float,
    calculation: str,
    adjust_a: float,
    adjust_b: float,
) -> dict[str, float | None]:
    a_only = _scenario_values(base_a, base_b, calculation, adjust_a, 0.0)["target"]
    b_only = base_target
    if base_b is not None:
        b_only = _scenario_values(base_a, base_b, calculation, 0.0, adjust_b)["target"]
    combined = _scenario_values(base_a, base_b, calculation, adjust_a, adjust_b)["target"]
    impact_a = float(a_only) - base_target
    impact_b = float(b_only) - base_target
    total_change = float(combined) - base_target
    interaction = total_change - impact_a - impact_b
    return {
        "metric_a_impact": impact_a,
        "metric_b_impact": impact_b,
        "interaction": interaction,
        "total_change": total_change,
    }


def _segment_scenarios(
    frame: pl.DataFrame,
    dimension: str | None,
    metric_a: str,
    metric_b: str | None,
    aggregation_a: str,
    aggregation_b: str,
    calculation: str,
    upside_a: float,
    upside_b: float,
    downside_a: float,
    downside_b: float,
) -> list[dict[str, Any]]:
    if not dimension or dimension not in frame.columns:
        return []

    working = frame.with_columns(pl.col(dimension).cast(pl.String, strict=False).fill_null("(Missing)").alias("__segment"))
    expressions: list[pl.Expr] = []
    a_expr = pl.col(metric_a).cast(pl.Float64, strict=False)
    expressions.append((a_expr.sum() if aggregation_a == "sum" else a_expr.mean()).alias("__a"))
    if metric_b:
        b_expr = pl.col(metric_b).cast(pl.Float64, strict=False)
        expressions.append((b_expr.sum() if aggregation_b == "sum" else b_expr.mean()).alias("__b"))
    expressions.append(pl.len().alias("__rows"))

    grouped = working.group_by("__segment").agg(expressions)
    output: list[dict[str, Any]] = []
    for row in grouped.iter_rows(named=True):
        a = _safe_float(row.get("__a"))
        b = _safe_float(row.get("__b")) if metric_b else None
        if a is None or (metric_b and b is None):
            continue
        try:
            base = _calculate(a, b, calculation)
            up = _scenario_values(a, b, calculation, upside_a, upside_b)["target"]
            down = _scenario_values(a, b, calculation, downside_a, downside_b)["target"]
        except ValueError:
            continue
        output.append(
            {
                "group": str(row.get("__segment")),
                "rows": int(row.get("__rows") or 0),
                "base": base,
                "upside": float(up),
                "downside": float(down),
                "upside_delta": float(up) - base,
                "downside_delta": float(down) - base,
            }
        )

    output.sort(key=lambda item: abs(item["upside_delta"]) + abs(item["downside_delta"]), reverse=True)
    return output[:12]


def run_scenario(
    frame: pl.DataFrame,
    *,
    metric_a: str,
    metric_b: str | None = None,
    calculation: str = "single",
    aggregation_a: str = "sum",
    aggregation_b: str = "sum",
    upside_a: float = 10.0,
    upside_b: float = 0.0,
    downside_a: float = -10.0,
    downside_b: float = 0.0,
    dimension: str | None = None,
) -> dict[str, Any]:
    if calculation not in CALCULATIONS:
        raise ValueError("Unsupported scenario calculation.")
    if aggregation_a not in AGGREGATIONS or aggregation_b not in AGGREGATIONS:
        raise ValueError("Aggregation must be sum or mean.")
    if calculation != "single" and not metric_b:
        raise ValueError("Choose Metric B for this calculation.")
    if metric_b and metric_b == metric_a and calculation != "single":
        raise ValueError("Metric A and Metric B must be different for a two-metric calculation.")
    for value in (upside_a, upside_b, downside_a, downside_b):
        if value < -95 or value > 500:
            raise ValueError("Scenario adjustments must be between -95% and +500%.")

    base_a = _aggregate(frame, metric_a, aggregation_a)
    base_b = _aggregate(frame, metric_b, aggregation_b) if metric_b else None
    base_target = _calculate(base_a, base_b, calculation)

    upside = _scenario_values(base_a, base_b, calculation, upside_a, upside_b)
    downside = _scenario_values(base_a, base_b, calculation, downside_a, downside_b)
    upside_target = float(upside["target"])
    downside_target = float(downside["target"])

    upside_sensitivity = _driver_sensitivity(base_a, base_b, base_target, calculation, upside_a, upside_b)
    downside_sensitivity = _driver_sensitivity(base_a, base_b, base_target, calculation, downside_a, downside_b)

    segments = _segment_scenarios(
        frame,
        dimension,
        metric_a,
        metric_b,
        aggregation_a,
        aggregation_b,
        calculation,
        upside_a,
        upside_b,
        downside_a,
        downside_b,
    )

    output_unit = "percent" if calculation in {"ratio", "margin_percent"} else "number"
    calculation_label = {
        "single": metric_a,
        "difference": f"{metric_a} − {metric_b}",
        "ratio": f"{metric_a} ÷ {metric_b}",
        "product": f"{metric_a} × {metric_b}",
        "margin_percent": f"({metric_a} − {metric_b}) ÷ {metric_a}",
    }[calculation]

    highlights = [
        {
            "type": "Upside case",
            "title": f"{_pct_change(upside_target, base_target) or 0:+.1f}% vs base",
            "detail": f"The upside assumptions move the calculated outcome from {base_target:,.2f} to {upside_target:,.2f}.",
        },
        {
            "type": "Downside case",
            "title": f"{_pct_change(downside_target, base_target) or 0:+.1f}% vs base",
            "detail": f"The downside assumptions move the calculated outcome from {base_target:,.2f} to {downside_target:,.2f}.",
        },
    ]
    if metric_b:
        dominant = "Metric A" if abs(float(upside_sensitivity["metric_a_impact"])) >= abs(float(upside_sensitivity["metric_b_impact"])) else "Metric B"
        highlights.append(
            {
                "type": "Sensitivity",
                "title": f"{dominant} has the larger upside-case effect",
                "detail": "Sensitivity isolates each assumption while holding the other metric at its baseline. Non-linear calculations can also include an interaction effect.",
            }
        )
    elif segments:
        highlights.append(
            {
                "type": "Segment view",
                "title": f"{segments[0]['group']} shows the largest modelled movement",
                "detail": f"The selected {dimension} breakdown helps show where the same scenario assumptions create the largest absolute change.",
            }
        )

    return {
        "configuration": {
            "metric_a": metric_a,
            "metric_b": metric_b,
            "calculation": calculation,
            "calculation_label": calculation_label,
            "aggregation_a": aggregation_a,
            "aggregation_b": aggregation_b,
            "dimension": dimension,
            "output_unit": output_unit,
        },
        "assumptions": {
            "upside": {"metric_a_percent": upside_a, "metric_b_percent": upside_b},
            "downside": {"metric_a_percent": downside_a, "metric_b_percent": downside_b},
        },
        "baseline": {"metric_a": base_a, "metric_b": base_b, "target": base_target},
        "scenarios": [
            {"name": "Base", "metric_a": base_a, "metric_b": base_b, "target": base_target, "delta": 0.0, "delta_percent": 0.0},
            {"name": "Upside", **upside, "delta": upside_target - base_target, "delta_percent": _pct_change(upside_target, base_target)},
            {"name": "Downside", **downside, "delta": downside_target - base_target, "delta_percent": _pct_change(downside_target, base_target)},
        ],
        "sensitivity": {"upside": upside_sensitivity, "downside": downside_sensitivity},
        "segments": segments,
        "highlights": highlights,
        "method": "Scenario Studio aggregates the selected source metrics, applies the user-entered percentage assumptions, and recalculates the selected formula for Base, Upside and Downside cases. Sensitivity holds other assumptions at baseline to isolate each driver effect.",
        "caveat": "These are deterministic what-if calculations, not predictions. Results depend entirely on the assumptions and formula selected by the user; they do not establish causality or probability.",
    }
