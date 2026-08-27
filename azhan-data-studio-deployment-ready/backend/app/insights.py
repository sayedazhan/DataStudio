from __future__ import annotations

import math
from collections import Counter, defaultdict
from datetime import date, datetime
from typing import Any

import polars as pl

from .ranking import rank_findings
from .visualization import attach_visualizations


NUMERIC_ROLES = {"measure", "percentage", "boolean"}


def _finite_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _mean(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def _std(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    avg = sum(values) / len(values)
    variance = sum((value - avg) ** 2 for value in values) / (len(values) - 1)
    return math.sqrt(variance)


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 3:
        return None
    x_mean = _mean(xs)
    y_mean = _mean(ys)
    if x_mean is None or y_mean is None:
        return None
    x_delta = [value - x_mean for value in xs]
    y_delta = [value - y_mean for value in ys]
    denominator = math.sqrt(
        sum(value * value for value in x_delta)
        * sum(value * value for value in y_delta)
    )
    if denominator == 0:
        return None
    return sum(x * y for x, y in zip(x_delta, y_delta)) / denominator


def _percent_change(new: float, old: float) -> float | None:
    if abs(old) < 1e-12:
        return None
    return ((new - old) / abs(old)) * 100


def _fmt_number(value: float | int | None, digits: int = 2) -> str:
    if value is None:
        return "—"
    if isinstance(value, int):
        return f"{value:,}"
    return f"{value:,.{digits}f}"


def _fmt_percent(value: float | None, digits: int = 1) -> str:
    return "—" if value is None else f"{value:.{digits}f}%"


def _time_number(value: Any) -> float | None:
    if isinstance(value, datetime):
        return value.timestamp() / 86400
    if isinstance(value, date):
        return float(value.toordinal())
    if value is None:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    if not text:
        return None
    try:
        return datetime.fromisoformat(text).timestamp() / 86400
    except ValueError:
        pass
    try:
        return float(date.fromisoformat(text).toordinal())
    except ValueError:
        return None


def _strength_label(score: float) -> str:
    if score >= 85:
        return "very strong"
    if score >= 70:
        return "strong"
    if score >= 55:
        return "notable"
    return "moderate"


def _finding(
    *,
    finding_id: str,
    finding_type: str,
    title: str,
    summary: str,
    signal_strength: float,
    confidence: float,
    fields: list[str],
    evidence: list[dict[str, str]],
    recommended_visual: str,
    direction: str | None = None,
) -> dict[str, Any]:
    score = round(max(0.0, min(100.0, signal_strength)), 1)
    return {
        "id": finding_id,
        "type": finding_type,
        "title": title,
        "summary": summary,
        "signal_strength": score,
        "strength_label": _strength_label(score),
        "confidence": round(max(0.0, min(100.0, confidence)), 1),
        "fields": fields,
        "evidence": evidence,
        "recommended_visual": recommended_visual,
        "direction": direction,
    }


def _role_map(schema: list[dict[str, Any]]) -> dict[str, str]:
    return {field["name"]: field["semantic_role"] for field in schema}


def _discover_trends(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    time_fields = [name for name, role in roles.items() if role == "time"]
    numeric_fields = [name for name, role in roles.items() if role in NUMERIC_ROLES]
    findings: list[dict[str, Any]] = []

    for time_field in time_fields:
        for numeric_field in numeric_fields:
            try:
                pairs = dataframe.select(
                    [time_field, pl.col(numeric_field).cast(pl.Float64, strict=False).alias(numeric_field)]
                ).drop_nulls().rows()
            except Exception:
                continue

            grouped: dict[float, list[float]] = defaultdict(list)
            labels: dict[float, str] = {}
            for raw_time, raw_value in pairs:
                time_value = _time_number(raw_time)
                number = _finite_number(raw_value)
                if time_value is None or number is None:
                    continue
                grouped[time_value].append(number)
                labels[time_value] = str(raw_time)

            points = sorted((x, _mean(values)) for x, values in grouped.items())
            points = [(x, y) for x, y in points if y is not None]
            if len(points) < 6:
                continue

            xs = [point[0] for point in points]
            ys = [float(point[1]) for point in points]
            correlation = _pearson(xs, ys)
            if correlation is None:
                continue

            window = max(3, min(20, len(ys) // 5))
            early = _mean(ys[:window])
            late = _mean(ys[-window:])
            if early is None or late is None:
                continue
            change = _percent_change(late, early)
            if change is None:
                std = _std(ys) or 0
                if std == 0:
                    continue
                change_signal = abs(late - early) / std * 10
            else:
                change_signal = abs(change)

            if abs(correlation) < 0.40 or change_signal < 5:
                continue

            direction = "increase" if late > early else "decrease"
            verb = "increased" if direction == "increase" else "decreased"
            signal = min(100, abs(correlation) * 65 + min(change_signal, 50) * 0.7)
            confidence = min(99, 68 + min(len(points), 300) / 10)
            change_text = _fmt_percent(abs(change), 1) if change is not None else "materially"

            findings.append(
                _finding(
                    finding_id=f"trend:{time_field}:{numeric_field}",
                    finding_type="trend",
                    title=f"{numeric_field} shows a {direction} over time",
                    summary=(
                        f"{numeric_field} {verb} by about {change_text} between the early and recent "
                        f"parts of the observed period, with a time relationship of r={correlation:.2f}."
                    ),
                    signal_strength=signal,
                    confidence=confidence,
                    fields=[time_field, numeric_field],
                    evidence=[
                        {"label": "Early-period average", "value": _fmt_number(early)},
                        {"label": "Recent-period average", "value": _fmt_number(late)},
                        {"label": "Change", "value": _fmt_percent(change, 1) if change is not None else "Material"},
                        {"label": "Time correlation", "value": f"{correlation:.2f}"},
                        {"label": "Time points analysed", "value": f"{len(points):,}"},
                        {"label": "Observed range", "value": f"{labels.get(xs[0], xs[0])} → {labels.get(xs[-1], xs[-1])}"},
                    ],
                    recommended_visual="Line chart",
                    direction=direction,
                )
            )

    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_correlations(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    numeric_fields = [name for name, role in roles.items() if role in NUMERIC_ROLES]
    findings: list[dict[str, Any]] = []

    for index, field_a in enumerate(numeric_fields):
        for field_b in numeric_fields[index + 1 :]:
            try:
                pairs = dataframe.select(
                    [
                        pl.col(field_a).cast(pl.Float64, strict=False).alias(field_a),
                        pl.col(field_b).cast(pl.Float64, strict=False).alias(field_b),
                    ]
                ).drop_nulls().rows()
            except Exception:
                continue

            xs: list[float] = []
            ys: list[float] = []
            for raw_x, raw_y in pairs:
                x = _finite_number(raw_x)
                y = _finite_number(raw_y)
                if x is None or y is None:
                    continue
                xs.append(x)
                ys.append(y)

            if len(xs) < 20:
                continue
            correlation = _pearson(xs, ys)
            if correlation is None or abs(correlation) < 0.60:
                continue

            direction = "positive" if correlation > 0 else "negative"
            signal = abs(correlation) * 100
            confidence = min(99, 75 + min(len(xs), 480) / 20)
            relation_text = "move together" if correlation > 0 else "move in opposite directions"

            findings.append(
                _finding(
                    finding_id=f"correlation:{field_a}:{field_b}",
                    finding_type="correlation",
                    title=f"{field_a} and {field_b} have a strong relationship",
                    summary=(
                        f"The two fields {relation_text}; their Pearson correlation is r={correlation:.2f} "
                        f"across {len(xs):,} paired observations."
                    ),
                    signal_strength=signal,
                    confidence=confidence,
                    fields=[field_a, field_b],
                    evidence=[
                        {"label": "Correlation", "value": f"{correlation:.3f}"},
                        {"label": "Direction", "value": direction.title()},
                        {"label": "Paired observations", "value": f"{len(xs):,}"},
                        {"label": "Relationship strength", "value": _strength_label(signal).title()},
                    ],
                    recommended_visual="Scatter plot",
                    direction=direction,
                )
            )

    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_group_differences(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    category_fields = [name for name, role in roles.items() if role == "category"]
    numeric_fields = [name for name, role in roles.items() if role in NUMERIC_ROLES]
    findings: list[dict[str, Any]] = []

    for category_field in category_fields:
        try:
            unique_count = dataframe[category_field].drop_nulls().n_unique()
        except Exception:
            continue
        if unique_count < 2 or unique_count > 30:
            continue

        for numeric_field in numeric_fields:
            try:
                rows = dataframe.select(
                    [category_field, pl.col(numeric_field).cast(pl.Float64, strict=False).alias(numeric_field)]
                ).drop_nulls().rows()
            except Exception:
                continue

            groups: dict[str, list[float]] = defaultdict(list)
            all_values: list[float] = []
            for category, raw_value in rows:
                number = _finite_number(raw_value)
                if number is None:
                    continue
                groups[str(category)].append(number)
                all_values.append(number)

            if len(all_values) < 30:
                continue
            overall_std = _std(all_values) or 0
            minimum_group = max(8, int(len(all_values) * 0.02))
            best: dict[str, Any] | None = None

            for group_name, group_values in groups.items():
                if len(group_values) < minimum_group:
                    continue
                other_values = [
                    value
                    for other_name, values in groups.items()
                    if other_name != group_name
                    for value in values
                ]
                if not other_values:
                    continue
                group_mean = _mean(group_values)
                other_mean = _mean(other_values)
                if group_mean is None or other_mean is None:
                    continue
                relative = _percent_change(group_mean, other_mean)
                effect = abs(group_mean - other_mean) / overall_std if overall_std > 0 else 0
                relative_abs = abs(relative) if relative is not None else 0
                signal = min(100, effect * 52 + min(relative_abs, 40) * 1.2)

                if relative_abs < 8 and effect < 0.45:
                    continue
                candidate = {
                    "group": group_name,
                    "group_mean": group_mean,
                    "other_mean": other_mean,
                    "relative": relative,
                    "effect": effect,
                    "count": len(group_values),
                    "signal": signal,
                }
                if best is None or candidate["signal"] > best["signal"]:
                    best = candidate

            if best is None:
                continue

            direction = "above" if best["group_mean"] > best["other_mean"] else "below"
            difference = abs(best["relative"]) if best["relative"] is not None else None
            confidence = min(98, 68 + min(best["count"], 300) / 12 + min(best["effect"], 1.5) * 8)

            findings.append(
                _finding(
                    finding_id=f"group:{category_field}:{numeric_field}:{best['group']}",
                    finding_type="group_difference",
                    title=f"{best['group']} stands out for {numeric_field}",
                    summary=(
                        f"Within {category_field}, {best['group']} averages {_fmt_number(best['group_mean'])}, "
                        f"about {_fmt_percent(difference, 1)} {direction} the average for all other groups."
                    ),
                    signal_strength=best["signal"],
                    confidence=confidence,
                    fields=[category_field, numeric_field],
                    evidence=[
                        {"label": f"{best['group']} average", "value": _fmt_number(best["group_mean"])},
                        {"label": "Other groups average", "value": _fmt_number(best["other_mean"])},
                        {"label": "Relative difference", "value": _fmt_percent(best["relative"], 1)},
                        {"label": "Group records", "value": f"{best['count']:,}"},
                        {"label": "Standardised effect", "value": f"{best['effect']:.2f}σ"},
                    ],
                    recommended_visual="Bar chart",
                    direction="higher" if best["group_mean"] > best["other_mean"] else "lower",
                )
            )

    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:10]


def _quantile(sorted_values: list[float], q: float) -> float | None:
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    position = (len(sorted_values) - 1) * q
    lower_index = int(math.floor(position))
    upper_index = int(math.ceil(position))
    if lower_index == upper_index:
        return sorted_values[lower_index]
    fraction = position - lower_index
    return sorted_values[lower_index] * (1 - fraction) + sorted_values[upper_index] * fraction


def _discover_anomalies(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    for field, role in roles.items():
        if role not in NUMERIC_ROLES:
            continue
        try:
            raw_values = dataframe[field].cast(pl.Float64, strict=False).drop_nulls().to_list()
        except Exception:
            continue
        values = sorted(number for value in raw_values if (number := _finite_number(value)) is not None)
        if len(values) < 20:
            continue
        q1 = _quantile(values, 0.25)
        q3 = _quantile(values, 0.75)
        if q1 is None or q3 is None:
            continue
        iqr = q3 - q1
        if iqr <= 0:
            continue
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = [value for value in values if value < lower or value > upper]
        if not outliers:
            continue

        extreme = max(outliers, key=lambda value: max(lower - value, value - upper, 0))
        distance = max(lower - extreme, extreme - upper, 0) / iqr
        share = len(outliers) / len(values) * 100
        if share < 0.15 and distance < 1.5:
            continue
        signal = min(100, 52 + min(distance, 6) * 7 + min(share, 8) * 2)
        confidence = min(98, 78 + min(len(values), 400) / 25)

        findings.append(
            _finding(
                finding_id=f"anomaly:{field}",
                finding_type="anomaly",
                title=f"Unusual values detected in {field}",
                summary=(
                    f"{len(outliers):,} values ({share:.1f}% of non-missing observations) fall outside the "
                    f"IQR-based expected range of {_fmt_number(lower)} to {_fmt_number(upper)}."
                ),
                signal_strength=signal,
                confidence=confidence,
                fields=[field],
                evidence=[
                    {"label": "Potential anomalies", "value": f"{len(outliers):,}"},
                    {"label": "Share of observations", "value": _fmt_percent(share, 1)},
                    {"label": "IQR expected range", "value": f"{_fmt_number(lower)} → {_fmt_number(upper)}"},
                    {"label": "Most extreme value", "value": _fmt_number(extreme)},
                    {"label": "Extreme distance", "value": f"{distance:.1f} IQR beyond fence"},
                ],
                recommended_visual="Box plot",
            )
        )

    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_data_quality(
    schema: list[dict[str, Any]],
    duplicate_rows: int,
    row_count: int,
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    if duplicate_rows > 0:
        share = duplicate_rows / max(row_count, 1) * 100
        signal = min(100, 48 + min(share, 20) * 2.2)
        findings.append(
            _finding(
                finding_id="quality:duplicates",
                finding_type="data_quality",
                title="Duplicate rows may affect the analysis",
                summary=(
                    f"The dataset contains {duplicate_rows:,} duplicate rows ({share:.1f}% of records). "
                    "They may inflate counts, averages, or category shares if they are accidental."
                ),
                signal_strength=signal,
                confidence=99,
                fields=[],
                evidence=[
                    {"label": "Duplicate rows", "value": f"{duplicate_rows:,}"},
                    {"label": "Share of records", "value": _fmt_percent(share, 1)},
                ],
                recommended_visual="Data quality table",
            )
        )

    for field in schema:
        missing = float(field.get("missing_percent") or 0)
        if missing < 2:
            continue
        count = int(field.get("missing_count") or 0)
        signal = min(100, 45 + missing * 2.4)
        findings.append(
            _finding(
                finding_id=f"quality:missing:{field['name']}",
                finding_type="data_quality",
                title=f"{field['name']} has missing data",
                summary=(
                    f"{count:,} values are missing from {field['name']}, equal to {missing:.1f}% of rows. "
                    "This should be considered when interpreting analyses that use this field."
                ),
                signal_strength=signal,
                confidence=99,
                fields=[field["name"]],
                evidence=[
                    {"label": "Missing values", "value": f"{count:,}"},
                    {"label": "Missing share", "value": _fmt_percent(missing, 1)},
                    {"label": "Semantic role", "value": str(field.get("semantic_role", "other")).replace("_", " ").title()},
                ],
                recommended_visual="Missingness bar",
            )
        )

    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_concentration(
    schema: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for field in schema:
        if field.get("semantic_role") != "category":
            continue
        profile = field.get("profile") or {}
        top_values = profile.get("top_values") or []
        unique = int(profile.get("unique_non_null") or 0)
        if not top_values or unique < 2:
            continue
        top = top_values[0]
        share = float(top.get("percent") or 0)
        if share < 40:
            continue
        signal = min(100, 48 + (share - 35) * 1.2)
        findings.append(
            _finding(
                finding_id=f"concentration:{field['name']}:{top['value']}",
                finding_type="concentration",
                title=f"{top['value']} dominates {field['name']}",
                summary=(
                    f"{top['value']} represents {share:.1f}% of non-missing {field['name']} values, "
                    f"making it the largest of {unique:,} observed categories."
                ),
                signal_strength=signal,
                confidence=98,
                fields=[field["name"]],
                evidence=[
                    {"label": "Dominant value", "value": str(top["value"])},
                    {"label": "Share", "value": _fmt_percent(share, 1)},
                    {"label": "Records", "value": f"{int(top.get('count') or 0):,}"},
                    {"label": "Distinct categories", "value": f"{unique:,}"},
                ],
                recommended_visual="Category bar chart",
            )
        )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:6]


def _featured_findings(findings: list[dict[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    preferred_types = [
        "trend",
        "correlation",
        "group_difference",
        "anomaly",
        "data_quality",
        "concentration",
    ]
    featured: list[dict[str, Any]] = []
    used: set[str] = set()

    for finding_type in preferred_types:
        candidates = [item for item in findings if item["type"] == finding_type]
        if candidates:
            best = max(candidates, key=lambda item: item["signal_strength"])
            featured.append(best)
            used.add(best["id"])
        if len(featured) >= limit:
            return featured

    for item in sorted(findings, key=lambda entry: entry["signal_strength"], reverse=True):
        if item["id"] not in used:
            featured.append(item)
            used.add(item["id"])
        if len(featured) >= limit:
            break
    return featured



def _discover_distribution_shapes(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    """Find strongly skewed numeric distributions."""
    findings: list[dict[str, Any]] = []
    for field, role in roles.items():
        if role not in {"measure", "percentage"}:
            continue
        try:
            raw_values = dataframe[field].cast(pl.Float64, strict=False).drop_nulls().to_list()
        except Exception:
            continue
        values = [number for value in raw_values if (number := _finite_number(value)) is not None]
        if len(values) < 30:
            continue
        mean = _mean(values)
        std = _std(values)
        if mean is None or std is None or std <= 1e-12:
            continue
        n = len(values)
        skew = (sum(((value - mean) / std) ** 3 for value in values) / n)
        if abs(skew) < 0.8:
            continue
        ordered = sorted(values)
        median = _quantile(ordered, 0.5)
        direction = "right" if skew > 0 else "left"
        signal = min(100, 48 + min(abs(skew), 3.5) * 14)
        confidence = min(99, 74 + min(n, 500) / 25)
        findings.append(
            _finding(
                finding_id=f"distribution:{field}",
                finding_type="distribution",
                title=f"{field} has a {direction}-skewed distribution",
                summary=(
                    f"{field} is not evenly distributed: its skewness is {skew:.2f}, with the mean "
                    f"({_fmt_number(mean)}) separated from the median ({_fmt_number(median)})."
                ),
                signal_strength=signal,
                confidence=confidence,
                fields=[field],
                evidence=[
                    {"label": "Skewness", "value": f"{skew:.2f}"},
                    {"label": "Mean", "value": _fmt_number(mean)},
                    {"label": "Median", "value": _fmt_number(median)},
                    {"label": "Observations", "value": f"{n:,}"},
                    {"label": "Direction", "value": f"{direction.title()} skew"},
                ],
                recommended_visual="Histogram",
                direction=direction,
            )
        )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_volatility(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    """Find numeric fields whose spread is high relative to their centre."""
    findings: list[dict[str, Any]] = []
    for field, role in roles.items():
        if role not in {"measure", "percentage"}:
            continue
        try:
            raw_values = dataframe[field].cast(pl.Float64, strict=False).drop_nulls().to_list()
        except Exception:
            continue
        values = [number for value in raw_values if (number := _finite_number(value)) is not None]
        if len(values) < 30:
            continue
        mean = _mean(values)
        std = _std(values)
        if mean is None or std is None or std <= 0:
            continue
        scale = abs(mean)
        if scale < 1e-9:
            continue
        cv = std / scale
        if cv < 0.55:
            continue
        signal = min(100, 45 + min(cv, 2.0) * 28)
        confidence = min(98, 72 + min(len(values), 500) / 25)
        findings.append(
            _finding(
                finding_id=f"volatility:{field}",
                finding_type="volatility",
                title=f"{field} varies substantially across records",
                summary=(
                    f"The standard deviation of {field} is {_fmt_number(std)}, equal to about "
                    f"{cv * 100:.1f}% of its mean. Values are relatively dispersed rather than tightly clustered."
                ),
                signal_strength=signal,
                confidence=confidence,
                fields=[field],
                evidence=[
                    {"label": "Mean", "value": _fmt_number(mean)},
                    {"label": "Std deviation", "value": _fmt_number(std)},
                    {"label": "Coefficient of variation", "value": _fmt_percent(cv * 100, 1)},
                    {"label": "Observations", "value": f"{len(values):,}"},
                ],
                recommended_visual="Distribution chart",
            )
        )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:6]


def _discover_rare_categories(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for field, role in roles.items():
        if role != "category":
            continue
        try:
            series = dataframe[field].drop_nulls()
            total = len(series)
            unique = series.n_unique()
            if total < 50 or unique < 3 or unique > 60:
                continue
            counts = series.value_counts(sort=False, name="count").rows()
        except Exception:
            continue
        rare = sorted(
            [(str(value), int(count), int(count) / total * 100) for value, count in counts if (int(count) / total * 100) < 2.0],
            key=lambda item: item[2],
        )
        if not rare:
            continue
        combined = sum(item[2] for item in rare)
        examples = ", ".join(item[0] for item in rare[:4])
        signal = min(100, 45 + min(len(rare), 8) * 4 + min(2.0 - rare[0][2], 2.0) * 8)
        findings.append(
            _finding(
                finding_id=f"rare:{field}",
                finding_type="rare_category",
                title=f"{field} contains rare categories",
                summary=(
                    f"{len(rare)} categories each represent less than 2% of non-missing records. "
                    f"Together they account for {combined:.1f}% of {field}."
                ),
                signal_strength=signal,
                confidence=97,
                fields=[field],
                evidence=[
                    {"label": "Rare categories", "value": f"{len(rare):,}"},
                    {"label": "Combined share", "value": _fmt_percent(combined, 1)},
                    {"label": "Smallest share", "value": _fmt_percent(rare[0][2], 2)},
                    {"label": "Examples", "value": examples or "—"},
                    {"label": "Distinct categories", "value": f"{unique:,}"},
                ],
                recommended_visual="Category distribution",
            )
        )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:6]


def _discover_outcome_differences(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    """Compare binary outcome rates across categorical groups."""
    category_fields = [name for name, role in roles.items() if role == "category"]
    outcome_fields = [name for name, role in roles.items() if role == "boolean"]
    findings: list[dict[str, Any]] = []
    for category_field in category_fields:
        try:
            unique_count = dataframe[category_field].drop_nulls().n_unique()
        except Exception:
            continue
        if unique_count < 2 or unique_count > 24:
            continue
        for outcome_field in outcome_fields:
            try:
                rows = dataframe.select(
                    [category_field, pl.col(outcome_field).cast(pl.Float64, strict=False).alias(outcome_field)]
                ).drop_nulls().rows()
            except Exception:
                continue
            groups: dict[str, list[float]] = defaultdict(list)
            for category, raw_value in rows:
                value = _finite_number(raw_value)
                if value is not None and value in {0.0, 1.0}:
                    groups[str(category)].append(value)
            eligible = {name: values for name, values in groups.items() if len(values) >= 8}
            if len(eligible) < 2:
                continue
            rates = [(name, _mean(values), len(values)) for name, values in eligible.items()]
            rates = [(name, float(rate), count) for name, rate, count in rates if rate is not None]
            if len(rates) < 2:
                continue
            high = max(rates, key=lambda item: item[1])
            low = min(rates, key=lambda item: item[1])
            gap = (high[1] - low[1]) * 100
            if gap < 15:
                continue
            observations = sum(item[2] for item in rates)
            signal = min(100, 48 + gap * 0.9)
            confidence = min(99, 74 + min(observations, 500) / 22)
            findings.append(
                _finding(
                    finding_id=f"outcome:{category_field}:{outcome_field}",
                    finding_type="outcome_difference",
                    title=f"{outcome_field} rate differs sharply by {category_field}",
                    summary=(
                        f"The highest observed {outcome_field} rate is {high[1] * 100:.1f}% for {high[0]}, "
                        f"versus {low[1] * 100:.1f}% for {low[0]} — a {gap:.1f} percentage-point gap."
                    ),
                    signal_strength=signal,
                    confidence=confidence,
                    fields=[category_field, outcome_field],
                    evidence=[
                        {"label": "Highest group", "value": high[0]},
                        {"label": "Highest rate", "value": _fmt_percent(high[1] * 100, 1)},
                        {"label": "Lowest group", "value": low[0]},
                        {"label": "Lowest rate", "value": _fmt_percent(low[1] * 100, 1)},
                        {"label": "Rate gap", "value": f"{gap:.1f} pts"},
                        {"label": "Observations", "value": f"{observations:,}"},
                    ],
                    recommended_visual="Outcome rate bar chart",
                )
            )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_top_performers(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    category_fields = [name for name, role in roles.items() if role == "category"]
    numeric_fields = [name for name, role in roles.items() if role in {"measure", "percentage"}]
    findings: list[dict[str, Any]] = []
    for category_field in category_fields:
        try:
            unique_count = dataframe[category_field].drop_nulls().n_unique()
        except Exception:
            continue
        if unique_count < 2 or unique_count > 20:
            continue
        for numeric_field in numeric_fields:
            try:
                rows = dataframe.select(
                    [category_field, pl.col(numeric_field).cast(pl.Float64, strict=False).alias(numeric_field)]
                ).drop_nulls().rows()
            except Exception:
                continue
            groups: dict[str, list[float]] = defaultdict(list)
            for group, raw_value in rows:
                value = _finite_number(raw_value)
                if value is not None:
                    groups[str(group)].append(value)
            minimum_group = max(8, int(len(rows) * 0.02))
            averages = [(name, _mean(values), len(values)) for name, values in groups.items() if len(values) >= minimum_group]
            averages = [(name, float(avg), count) for name, avg, count in averages if avg is not None]
            if len(averages) < 2:
                continue
            averages.sort(key=lambda item: item[1], reverse=True)
            best, runner_up = averages[0], averages[1]
            uplift = _percent_change(best[1], runner_up[1])
            if uplift is None or uplift < 8:
                continue
            signal = min(100, 48 + min(uplift, 50) * 1.15)
            findings.append(
                _finding(
                    finding_id=f"top:{category_field}:{numeric_field}:{best[0]}",
                    finding_type="top_performer",
                    title=f"{best[0]} leads {category_field} on {numeric_field}",
                    summary=(
                        f"{best[0]} has the highest average {numeric_field} at {_fmt_number(best[1])}, "
                        f"about {uplift:.1f}% above the next-highest group ({runner_up[0]})."
                    ),
                    signal_strength=signal,
                    confidence=min(98, 72 + min(best[2], 300) / 14),
                    fields=[category_field, numeric_field],
                    evidence=[
                        {"label": "Top group", "value": best[0]},
                        {"label": "Top average", "value": _fmt_number(best[1])},
                        {"label": "Next group", "value": runner_up[0]},
                        {"label": "Next average", "value": _fmt_number(runner_up[1])},
                        {"label": "Lead", "value": _fmt_percent(uplift, 1)},
                        {"label": "Top group records", "value": f"{best[2]:,}"},
                    ],
                    recommended_visual="Ranked bar chart",
                )
            )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]


def _discover_contributions(
    dataframe: pl.DataFrame,
    roles: dict[str, str],
) -> list[dict[str, Any]]:
    category_fields = [name for name, role in roles.items() if role == "category"]
    # Contribution analysis requires an additive measure. Percentages are not
    # generally additive, so Stage 5.2 deliberately excludes them here.
    numeric_fields = [name for name, role in roles.items() if role == "measure"]
    findings: list[dict[str, Any]] = []
    for category_field in category_fields:
        try:
            unique_count = dataframe[category_field].drop_nulls().n_unique()
        except Exception:
            continue
        if unique_count < 3 or unique_count > 30:
            continue
        for numeric_field in numeric_fields:
            try:
                rows = dataframe.select(
                    [category_field, pl.col(numeric_field).cast(pl.Float64, strict=False).alias(numeric_field)]
                ).drop_nulls().rows()
            except Exception:
                continue
            sums: dict[str, float] = defaultdict(float)
            for group, raw_value in rows:
                value = _finite_number(raw_value)
                if value is not None and value >= 0:
                    sums[str(group)] += value
            total = sum(sums.values())
            if total <= 0 or len(sums) < 3:
                continue
            ranked = sorted(sums.items(), key=lambda item: item[1], reverse=True)
            top_share = ranked[0][1] / total * 100
            top3_share = sum(value for _, value in ranked[:3]) / total * 100
            if top_share < 30 and top3_share < 65:
                continue
            signal = min(100, 45 + max(top_share - 20, 0) * 0.8 + max(top3_share - 50, 0) * 0.7)
            findings.append(
                _finding(
                    finding_id=f"contribution:{category_field}:{numeric_field}",
                    finding_type="contribution",
                    title=f"A small number of {category_field} groups drive {numeric_field}",
                    summary=(
                        f"The top three {category_field} groups contribute {top3_share:.1f}% of total {numeric_field}; "
                        f"{ranked[0][0]} alone contributes {top_share:.1f}%."
                    ),
                    signal_strength=signal,
                    confidence=97,
                    fields=[category_field, numeric_field],
                    evidence=[
                        {"label": "Top contributor", "value": ranked[0][0]},
                        {"label": "Top share", "value": _fmt_percent(top_share, 1)},
                        {"label": "Top 3 share", "value": _fmt_percent(top3_share, 1)},
                        {"label": "Groups analysed", "value": f"{len(ranked):,}"},
                        {"label": "Total", "value": _fmt_number(total)},
                    ],
                    recommended_visual="Contribution bar chart",
                )
            )
    return sorted(findings, key=lambda item: item["signal_strength"], reverse=True)[:8]

def discover_insights(
    dataframe: pl.DataFrame,
    schema: list[dict[str, Any]],
    duplicate_rows: int,
) -> dict[str, Any]:
    roles = _role_map(schema)
    modules = {
        "trend": _discover_trends(dataframe, roles),
        "correlation": _discover_correlations(dataframe, roles),
        "group_difference": _discover_group_differences(dataframe, roles),
        "outcome_difference": _discover_outcome_differences(dataframe, roles),
        "top_performer": _discover_top_performers(dataframe, roles),
        "contribution": _discover_contributions(dataframe, roles),
        "distribution": _discover_distribution_shapes(dataframe, roles),
        "volatility": _discover_volatility(dataframe, roles),
        "rare_category": _discover_rare_categories(dataframe, roles),
        "anomaly": _discover_anomalies(dataframe, roles),
        "data_quality": _discover_data_quality(schema, duplicate_rows, dataframe.height),
        "concentration": _discover_concentration(schema),
    }

    findings = [finding for group in modules.values() for finding in group]
    findings.sort(key=lambda item: item["signal_strength"], reverse=True)
    ranking = rank_findings(findings, schema, dataframe.height)
    ranked_findings = attach_visualizations(
        dataframe,
        ranking["ranked_findings"],
        schema,
        duplicate_rows,
    )
    ranking["ranked_findings"] = ranked_findings
    ranking["top_findings"] = ranked_findings[:5]
    from .visualization import build_visual_gallery
    visual_gallery = build_visual_gallery(
        dataframe,
        schema,
        ranked_findings,
        duplicate_rows,
        limit=12,
    )
    ranking["note"] = (
        "Azhan Data Studio uses deterministic discovery and visual exploration. "
        "Charts explain calculated evidence; they do not prove causation or business importance without context."
    )
    type_counts = Counter(item["type"] for item in ranked_findings)

    return {
        "total_findings": len(ranked_findings),
        "type_counts": dict(type_counts),
        "featured_findings": ranking["top_findings"],
        "findings": ranked_findings,
        "modules_run": list(modules.keys()),
        "visual_gallery": visual_gallery,
        "ranking": ranking,
        "note": ranking["note"],
    }
