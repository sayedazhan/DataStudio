from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

import polars as pl
from scipy import stats


def _normalise_name(name: str) -> set[str]:
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name.strip())
    snake = re.sub(r"[^A-Za-z0-9]+", "_", snake).strip("_").lower()
    return {token for token in snake.split("_") if token}


def _safe_float(value: Any) -> float | None:
    try:
        number = float(value)
        if math.isnan(number) or math.isinf(number):
            return None
        return number
    except (TypeError, ValueError):
        return None


def _numeric_values(frame: pl.DataFrame, field: str) -> list[float]:
    if field not in frame.columns:
        raise ValueError(f"Field '{field}' was not found in the dataset.")
    series = frame[field].cast(pl.Float64, strict=False).drop_nulls()
    values = [_safe_float(value) for value in series.to_list()]
    return [value for value in values if value is not None]


def _field_score(name: str, unique_ratio: float, non_null: int) -> int:
    tokens = _normalise_name(name)
    score = 55
    useful = {
        "revenue": 30, "sales": 30, "profit": 28, "cost": 26, "margin": 25,
        "amount": 22, "value": 20, "price": 18, "quantity": 18, "qty": 18,
        "units": 18, "age": 14, "score": 14, "rating": 14, "duration": 12,
        "time": 10, "income": 22, "spend": 20, "volume": 18,
    }
    score += max((useful.get(token, 0) for token in tokens), default=0)
    if tokens.intersection({"id", "code", "number", "no", "key"}) and unique_ratio > 0.85:
        score -= 55
    if non_null >= 30:
        score += 8
    return max(0, min(score, 100))


def _dimension_score(name: str, unique_values: int) -> int:
    tokens = _normalise_name(name)
    score = max(25, 72 - unique_values)
    bonuses = {
        "region": 25, "segment": 24, "category": 22, "product": 20,
        "channel": 18, "state": 18, "department": 16, "team": 14,
        "status": 12, "gender": 14, "class": 12, "group": 12,
    }
    score += max((bonuses.get(token, 0) for token in tokens), default=0)
    return min(100, score)


def _summary(values: list[float], confidence: float = 0.95) -> dict[str, Any]:
    if len(values) < 2:
        raise ValueError("At least two non-missing numeric observations are required.")

    n = len(values)
    mean = float(sum(values) / n)
    median = float(stats.mstats.mquantiles(values, prob=[0.5], alphap=1, betap=1)[0])
    std = float(stats.tstd(values)) if n > 1 else 0.0
    variance = std * std
    q1, q3 = [float(v) for v in stats.mstats.mquantiles(values, prob=[0.25, 0.75], alphap=1, betap=1)]
    minimum = float(min(values))
    maximum = float(max(values))
    total = float(sum(values))
    sem = float(stats.sem(values)) if n > 1 else 0.0
    alpha = 1.0 - confidence
    if n > 1 and sem > 0:
        ci_low, ci_high = stats.t.interval(1 - alpha, df=n - 1, loc=mean, scale=sem)
        ci_low, ci_high = float(ci_low), float(ci_high)
    else:
        ci_low = ci_high = mean
    skewness = float(stats.skew(values, bias=False)) if n >= 3 and std > 0 else 0.0
    kurtosis = float(stats.kurtosis(values, fisher=True, bias=False)) if n >= 4 and std > 0 else 0.0
    iqr = q3 - q1
    low_fence = q1 - 1.5 * iqr
    high_fence = q3 + 1.5 * iqr
    outlier_count = sum(value < low_fence or value > high_fence for value in values)
    cv = abs(std / mean) * 100 if mean != 0 else None

    if skewness >= 1:
        shape = "strongly right-skewed"
    elif skewness >= 0.5:
        shape = "moderately right-skewed"
    elif skewness <= -1:
        shape = "strongly left-skewed"
    elif skewness <= -0.5:
        shape = "moderately left-skewed"
    else:
        shape = "approximately symmetric"

    return {
        "n": n,
        "mean": mean,
        "median": median,
        "std_dev": std,
        "variance": variance,
        "minimum": minimum,
        "q1": q1,
        "q3": q3,
        "maximum": maximum,
        "sum": total,
        "standard_error": sem,
        "confidence_level": confidence,
        "confidence_interval": {"lower": ci_low, "upper": ci_high},
        "skewness": skewness,
        "kurtosis": kurtosis,
        "iqr": iqr,
        "outlier_count": outlier_count,
        "outlier_percent": outlier_count / n * 100,
        "coefficient_of_variation_percent": cv,
        "shape": shape,
    }


def _significance_label(p_value: float) -> str:
    if p_value < 0.001:
        return "Very strong evidence"
    if p_value < 0.01:
        return "Strong evidence"
    if p_value < 0.05:
        return "Statistically significant"
    if p_value < 0.10:
        return "Weak evidence"
    return "Not statistically significant"


def _relationship_label(value: float) -> str:
    absolute = abs(value)
    if absolute < 0.10:
        strength = "negligible"
    elif absolute < 0.30:
        strength = "weak"
    elif absolute < 0.50:
        strength = "moderate"
    elif absolute < 0.70:
        strength = "strong"
    else:
        strength = "very strong"
    direction = "positive" if value > 0 else "negative" if value < 0 else ""
    return f"{strength} {direction} relationship".strip()


def prepare_statistics(frame: pl.DataFrame) -> dict[str, Any]:
    rows = frame.height
    numeric_candidates: list[dict[str, Any]] = []
    categorical_candidates: list[dict[str, Any]] = []

    for name, dtype in zip(frame.columns, frame.dtypes):
        series = frame[name]
        non_null = rows - series.null_count()
        if non_null == 0:
            continue

        if dtype.is_numeric() and dtype != pl.Boolean:
            numeric = series.cast(pl.Float64, strict=False).drop_nulls()
            values = [_safe_float(value) for value in numeric.to_list()]
            values = [value for value in values if value is not None]
            if len(values) >= 3:
                unique = len(set(values))
                ratio = unique / max(len(values), 1)
                score = _field_score(name, ratio, len(values))
                if score > 20:
                    quick = _summary(values)
                    numeric_candidates.append({
                        "field": name,
                        "non_null": len(values),
                        "missing": rows - len(values),
                        "unique_values": unique,
                        "mean": quick["mean"],
                        "median": quick["median"],
                        "std_dev": quick["std_dev"],
                        "minimum": quick["minimum"],
                        "maximum": quick["maximum"],
                        "score": score,
                    })

        unique_non_null = series.drop_nulls().n_unique() if non_null else 0
        if 2 <= unique_non_null <= 30 and unique_non_null <= max(2, int(rows * 0.55)):
            if dtype == pl.String or dtype == pl.Boolean or dtype.is_integer():
                counts = (
                    frame.select(pl.col(name).cast(pl.String, strict=False).fill_null("(Missing)").alias("value"))
                    .group_by("value").len().sort("len", descending=True).head(6)
                )
                categorical_candidates.append({
                    "field": name,
                    "unique_values": unique_non_null,
                    "missing": series.null_count(),
                    "score": _dimension_score(name, unique_non_null),
                    "top_values": [{"value": str(row["value"]), "count": int(row["len"])} for row in counts.iter_rows(named=True)],
                })

    numeric_candidates.sort(key=lambda item: (-item["score"], item["field"].lower()))
    categorical_candidates.sort(key=lambda item: (-item["score"], item["field"].lower()))

    recommended_numeric = numeric_candidates[0]["field"] if numeric_candidates else None
    recommended_numeric_b = numeric_candidates[1]["field"] if len(numeric_candidates) > 1 else None
    recommended_group = categorical_candidates[0]["field"] if categorical_candidates else None
    recommended_category_b = categorical_candidates[1]["field"] if len(categorical_candidates) > 1 else None

    available_modes = ["summary"] if numeric_candidates else []
    if len(numeric_candidates) >= 2:
        available_modes.append("correlation")
    if numeric_candidates and categorical_candidates:
        available_modes.append("group_comparison")
    if len(categorical_candidates) >= 2:
        available_modes.append("categorical_association")

    return {
        "rows": rows,
        "columns": frame.width,
        "numeric_candidates": numeric_candidates,
        "categorical_candidates": categorical_candidates,
        "recommended_numeric": recommended_numeric,
        "recommended_numeric_b": recommended_numeric_b,
        "recommended_group": recommended_group,
        "recommended_category_b": recommended_category_b,
        "available_modes": available_modes,
        "ready": bool(numeric_candidates or len(categorical_candidates) >= 2),
    }


def run_summary(frame: pl.DataFrame, field: str, confidence: float = 0.95) -> dict[str, Any]:
    values = _numeric_values(frame, field)
    summary = _summary(values, confidence)
    ci = summary["confidence_interval"]
    cv = summary["coefficient_of_variation_percent"]
    variability = "high" if cv is not None and cv >= 50 else "moderate" if cv is not None and cv >= 20 else "relatively low"
    interpretation = (
        f"{field} averages {summary['mean']:,.2f} with a median of {summary['median']:,.2f}. "
        f"The distribution is {summary['shape']}, variability is {variability}, and the {confidence*100:.0f}% confidence interval "
        f"for the population mean is approximately {ci['lower']:,.2f} to {ci['upper']:,.2f}."
    )
    return {
        "mode": "summary",
        "field": field,
        "summary": summary,
        "interpretation": interpretation,
        "method": "Descriptive statistics with a Student-t confidence interval for the mean and IQR-based outlier screening.",
        "caveat": "Confidence intervals quantify sampling uncertainty under standard assumptions; they do not guarantee where future observations will fall.",
    }


def run_correlation(frame: pl.DataFrame, field_a: str, field_b: str) -> dict[str, Any]:
    if field_a == field_b:
        raise ValueError("Choose two different numeric fields for correlation analysis.")
    if field_a not in frame.columns or field_b not in frame.columns:
        raise ValueError("One or both selected fields were not found.")

    pairs = (
        frame.select([
            pl.col(field_a).cast(pl.Float64, strict=False).alias("a"),
            pl.col(field_b).cast(pl.Float64, strict=False).alias("b"),
        ])
        .drop_nulls()
        .filter(pl.col("a").is_finite() & pl.col("b").is_finite())
    )
    if pairs.height < 4:
        raise ValueError("At least four paired non-missing observations are required.")
    a = [float(v) for v in pairs["a"].to_list()]
    b = [float(v) for v in pairs["b"].to_list()]
    if len(set(a)) < 2 or len(set(b)) < 2:
        raise ValueError("Both fields need variation; one selected field is constant.")

    pearson = stats.pearsonr(a, b)
    spearman = stats.spearmanr(a, b)
    r = float(pearson.statistic)
    pearson_p = float(pearson.pvalue)
    rho = float(spearman.statistic)
    spearman_p = float(spearman.pvalue)
    r_squared = r * r
    relationship = _relationship_label(r)
    significance = _significance_label(pearson_p)

    step = max(1, pairs.height // 180)
    sample = pairs[::step].head(180)
    scatter = [{"x": float(row["a"]), "y": float(row["b"])} for row in sample.iter_rows(named=True)]

    interpretation = (
        f"{field_a} and {field_b} show a {relationship} (Pearson r={r:.2f}). "
        f"The linear relationship explains about {r_squared*100:.1f}% of their shared variance in this sample. "
        f"{significance} at the 5% threshold (p={pearson_p:.4g})."
    )
    return {
        "mode": "correlation",
        "field_a": field_a,
        "field_b": field_b,
        "n": len(a),
        "pearson": {"r": r, "p_value": pearson_p, "r_squared": r_squared, "label": relationship, "significance": significance},
        "spearman": {"rho": rho, "p_value": spearman_p, "label": _relationship_label(rho), "significance": _significance_label(spearman_p)},
        "scatter": scatter,
        "interpretation": interpretation,
        "method": "Pearson correlation measures linear association; Spearman correlation measures monotonic rank association.",
        "caveat": "Correlation is association, not causation. Outliers, confounding variables and non-linear relationships can materially change interpretation.",
    }


def _group_rows(frame: pl.DataFrame, numeric_field: str, group_field: str) -> list[dict[str, Any]]:
    working = frame.select([
        pl.col(group_field).cast(pl.String, strict=False).fill_null("(Missing)").alias("group"),
        pl.col(numeric_field).cast(pl.Float64, strict=False).alias("value"),
    ]).drop_nulls().filter(pl.col("value").is_finite())
    if working.height < 6:
        raise ValueError("Not enough usable observations for a group comparison.")

    group_sizes = working.group_by("group").len().sort("len", descending=True)
    eligible = [str(row["group"]) for row in group_sizes.iter_rows(named=True) if int(row["len"]) >= 2][:10]
    if len(eligible) < 2:
        raise ValueError("The grouping field needs at least two groups with two or more observations each.")
    working = working.filter(pl.col("group").is_in(eligible))

    output: list[dict[str, Any]] = []
    for group in eligible:
        values = [float(v) for v in working.filter(pl.col("group") == group)["value"].to_list()]
        summary = _summary(values) if len(values) >= 2 else None
        if summary:
            output.append({
                "group": group,
                "n": summary["n"],
                "mean": summary["mean"],
                "median": summary["median"],
                "std_dev": summary["std_dev"],
                "ci_lower": summary["confidence_interval"]["lower"],
                "ci_upper": summary["confidence_interval"]["upper"],
                "values": values,
            })
    return output


def _cohens_d(a: list[float], b: list[float]) -> float:
    n1, n2 = len(a), len(b)
    if n1 < 2 or n2 < 2:
        return 0.0
    s1 = stats.tstd(a)
    s2 = stats.tstd(b)
    pooled_var = (((n1 - 1) * s1 * s1) + ((n2 - 1) * s2 * s2)) / max(n1 + n2 - 2, 1)
    pooled = math.sqrt(max(float(pooled_var), 0.0))
    return 0.0 if pooled == 0 else (float(sum(a) / n1) - float(sum(b) / n2)) / pooled


def _effect_label(value: float, kind: str) -> str:
    absolute = abs(value)
    if kind == "d":
        if absolute < 0.2: return "Negligible"
        if absolute < 0.5: return "Small"
        if absolute < 0.8: return "Moderate"
        return "Large"
    if kind in {"eta2", "cramers_v"}:
        if absolute < 0.01: return "Negligible"
        if absolute < 0.06: return "Small"
        if absolute < 0.14: return "Moderate"
        return "Large"
    return ""


def run_group_comparison(frame: pl.DataFrame, numeric_field: str, group_field: str) -> dict[str, Any]:
    groups = _group_rows(frame, numeric_field, group_field)
    if len(groups) == 2:
        a, b = groups[0]["values"], groups[1]["values"]
        test = stats.ttest_ind(a, b, equal_var=False, nan_policy="omit")
        t_stat = float(test.statistic)
        p_value = float(test.pvalue)
        effect = float(_cohens_d(a, b))
        delta = groups[0]["mean"] - groups[1]["mean"]
        test_name = "Welch two-sample t-test"
        result = {
            "test": "welch_t_test",
            "test_name": test_name,
            "statistic": t_stat,
            "p_value": p_value,
            "effect_size": effect,
            "effect_metric": "Cohen's d",
            "effect_label": _effect_label(effect, "d"),
            "difference": delta,
            "significance": _significance_label(p_value),
        }
        interpretation = (
            f"{groups[0]['group']} averages {groups[0]['mean']:,.2f} versus {groups[1]['mean']:,.2f} for {groups[1]['group']} "
            f"({delta:+,.2f} difference). {_significance_label(p_value)} (p={p_value:.4g}); "
            f"the estimated effect size is {_effect_label(effect, 'd').lower()} (Cohen's d={effect:.2f})."
        )
    else:
        arrays = [group["values"] for group in groups]
        test = stats.f_oneway(*arrays)
        f_stat = float(test.statistic)
        p_value = float(test.pvalue)
        all_values = [value for array in arrays for value in array]
        grand_mean = sum(all_values) / len(all_values)
        ss_between = sum(len(group["values"]) * (group["mean"] - grand_mean) ** 2 for group in groups)
        ss_total = sum((value - grand_mean) ** 2 for value in all_values)
        eta2 = float(ss_between / ss_total) if ss_total > 0 else 0.0
        result = {
            "test": "one_way_anova",
            "test_name": "One-way ANOVA",
            "statistic": f_stat,
            "p_value": p_value,
            "effect_size": eta2,
            "effect_metric": "Eta squared",
            "effect_label": _effect_label(eta2, "eta2"),
            "difference": max(group["mean"] for group in groups) - min(group["mean"] for group in groups),
            "significance": _significance_label(p_value),
        }
        top = max(groups, key=lambda group: group["mean"])
        bottom = min(groups, key=lambda group: group["mean"])
        interpretation = (
            f"Average {numeric_field} differs across {len(groups)} {group_field} groups. {_significance_label(p_value)} "
            f"(ANOVA p={p_value:.4g}); effect size is {_effect_label(eta2, 'eta2').lower()} (η²={eta2:.2f}). "
            f"{top['group']} has the highest mean ({top['mean']:,.2f}) and {bottom['group']} the lowest ({bottom['mean']:,.2f})."
        )

    clean_groups = [{key: value for key, value in group.items() if key != "values"} for group in groups]
    return {
        "mode": "group_comparison",
        "numeric_field": numeric_field,
        "group_field": group_field,
        "groups": clean_groups,
        "result": result,
        "interpretation": interpretation,
        "method": "Welch's t-test is used for two groups; one-way ANOVA is used for three or more groups. Effect size is reported alongside significance.",
        "caveat": "A statistically significant difference does not automatically mean the difference is practically important. Check effect size, group sizes and data quality.",
    }


def run_categorical_association(frame: pl.DataFrame, field_a: str, field_b: str) -> dict[str, Any]:
    if field_a == field_b:
        raise ValueError("Choose two different categorical fields.")
    if field_a not in frame.columns or field_b not in frame.columns:
        raise ValueError("One or both selected fields were not found.")

    working = frame.select([
        pl.col(field_a).cast(pl.String, strict=False).fill_null("(Missing)").alias("a"),
        pl.col(field_b).cast(pl.String, strict=False).fill_null("(Missing)").alias("b"),
    ])
    if working.height < 10:
        raise ValueError("At least ten observations are required for a categorical association test.")

    top_a = [str(row["a"]) for row in working.group_by("a").len().sort("len", descending=True).head(8).iter_rows(named=True)]
    top_b = [str(row["b"]) for row in working.group_by("b").len().sort("len", descending=True).head(8).iter_rows(named=True)]
    filtered = working.filter(pl.col("a").is_in(top_a) & pl.col("b").is_in(top_b))
    if filtered.height < 10 or len(top_a) < 2 or len(top_b) < 2:
        raise ValueError("The selected fields need at least two sufficiently populated categories each.")

    counts = Counter((str(row["a"]), str(row["b"])) for row in filtered.iter_rows(named=True))
    matrix = [[counts.get((a, b), 0) for b in top_b] for a in top_a]
    try:
        chi2, p_value, dof, expected = stats.chi2_contingency(matrix)
    except ValueError as exc:
        raise ValueError("The selected categories do not provide enough variation for a chi-square test.") from exc
    n = sum(sum(row) for row in matrix)
    denominator = n * max(1, min(len(top_a) - 1, len(top_b) - 1))
    cramers_v = math.sqrt(float(chi2) / denominator) if denominator > 0 else 0.0
    low_expected = sum(float(value) < 5 for row in expected for value in row)
    total_expected = expected.size

    table = [
        {"row": a, "counts": [{"column": b, "count": matrix[i][j]} for j, b in enumerate(top_b)], "total": sum(matrix[i])}
        for i, a in enumerate(top_a)
    ]
    significance = _significance_label(float(p_value))
    interpretation = (
        f"{field_a} and {field_b} show {_effect_label(cramers_v, 'cramers_v').lower()} categorical association "
        f"(Cramér's V={cramers_v:.2f}). {significance} (χ²={float(chi2):.2f}, p={float(p_value):.4g})."
    )
    return {
        "mode": "categorical_association",
        "field_a": field_a,
        "field_b": field_b,
        "n": n,
        "rows": top_a,
        "columns": top_b,
        "table": table,
        "result": {
            "chi_square": float(chi2),
            "p_value": float(p_value),
            "degrees_of_freedom": int(dof),
            "cramers_v": cramers_v,
            "effect_label": _effect_label(cramers_v, "cramers_v"),
            "significance": significance,
            "low_expected_cells": int(low_expected),
            "expected_cells": int(total_expected),
        },
        "interpretation": interpretation,
        "method": "Pearson chi-square test of independence with Cramér's V as an association effect-size measure.",
        "caveat": "Chi-square results can be unreliable when expected cell counts are very small. Data Studio reports how many expected cells fall below 5.",
    }


def run_statistics(
    frame: pl.DataFrame,
    *,
    mode: str,
    numeric_field: str | None = None,
    numeric_field_b: str | None = None,
    group_field: str | None = None,
    category_field_a: str | None = None,
    category_field_b: str | None = None,
    confidence: float = 0.95,
) -> dict[str, Any]:
    if confidence < 0.80 or confidence > 0.999:
        raise ValueError("Confidence level must be between 80% and 99.9%.")
    if mode == "summary":
        if not numeric_field:
            raise ValueError("Choose a numeric field for descriptive statistics.")
        return run_summary(frame, numeric_field, confidence)
    if mode == "correlation":
        if not numeric_field or not numeric_field_b:
            raise ValueError("Choose two numeric fields for correlation analysis.")
        return run_correlation(frame, numeric_field, numeric_field_b)
    if mode == "group_comparison":
        if not numeric_field or not group_field:
            raise ValueError("Choose a numeric outcome and a grouping field.")
        return run_group_comparison(frame, numeric_field, group_field)
    if mode == "categorical_association":
        if not category_field_a or not category_field_b:
            raise ValueError("Choose two categorical fields for association testing.")
        return run_categorical_association(frame, category_field_a, category_field_b)
    raise ValueError("Unsupported statistics mode.")
