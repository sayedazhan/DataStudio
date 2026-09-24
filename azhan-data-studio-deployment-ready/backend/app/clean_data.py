from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

import polars as pl

DATE_FORMATS = (
    "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y",
    "%Y/%m/%d", "%d/%m/%y", "%d-%m-%y", "%Y-%m-%d %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
)


def _clean_column_name(name: str) -> str:
    value = name.strip()
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    value = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_").lower()
    return value or "column"


def _unique_column_names(columns: list[str]) -> tuple[list[str], dict[str, str]]:
    used: Counter[str] = Counter()
    new_names: list[str] = []
    mapping: dict[str, str] = {}
    for old in columns:
        base = _clean_column_name(old)
        used[base] += 1
        new = base if used[base] == 1 else f"{base}_{used[base]}"
        new_names.append(new)
        mapping[old] = new
    return new_names, mapping


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def _string_columns(frame: pl.DataFrame) -> list[str]:
    return [name for name, dtype in frame.schema.items() if dtype == pl.String]


def _date_parse(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def _date_profile(values: list[str]) -> tuple[int, int, set[str]]:
    parsed = 0
    non_blank = 0
    separators: set[str] = set()
    for value in values[:500]:
        raw = value.strip()
        if not raw:
            continue
        non_blank += 1
        if "/" in raw:
            separators.add("/")
        if "-" in raw:
            separators.add("-")
        if _date_parse(raw):
            parsed += 1
    return parsed, non_blank, separators


def analyse_cleaning(frame: pl.DataFrame) -> dict[str, Any]:
    rows_before = frame.height
    columns_before = frame.width
    string_cols = _string_columns(frame)

    blank_rows = 0
    for row in frame.iter_rows(named=False):
        if all(_is_blank(value) for value in row):
            blank_rows += 1

    duplicate_rows = max(frame.height - frame.unique(maintain_order=True).height, 0)
    missing_values = int(sum(frame.get_column(c).null_count() for c in frame.columns))

    whitespace_cells = 0
    empty_string_cells = 0
    case_issue_columns: list[dict[str, Any]] = []
    date_issue_columns: list[dict[str, Any]] = []

    for col in string_cols:
        raw_values = frame.get_column(col).to_list()
        values = ["" if v is None else str(v) for v in raw_values]
        whitespace_cells += sum(1 for v in raw_values if isinstance(v, str) and v and v != v.strip())
        empty_string_cells += sum(1 for v in raw_values if isinstance(v, str) and v.strip() == "")

        groups: dict[str, set[str]] = defaultdict(set)
        for v in values[:5000]:
            s = v.strip()
            if s:
                groups[s.casefold()].add(s)
        variants = {k: sorted(vals) for k, vals in groups.items() if len(vals) > 1}
        if variants:
            case_issue_columns.append({
                "column": col,
                "variant_groups": len(variants),
                "examples": list(variants.values())[:3],
            })

        parsed, non_blank, separators = _date_profile(values)
        if non_blank >= 3 and parsed / non_blank >= 0.8:
            mixed = len(separators) > 1 or any(_date_parse(v) and v.strip() != _date_parse(v) for v in values[:100] if v.strip())
            if mixed:
                date_issue_columns.append({
                    "column": col,
                    "parseable_percent": round(parsed / non_blank * 100, 1),
                    "target_format": "YYYY-MM-DD",
                })

    cleaned_names, mapping = _unique_column_names(frame.columns)
    changed_headers = [
        {"before": old, "after": new}
        for old, new in zip(frame.columns, cleaned_names)
        if old != new
    ]

    missing_by_column: list[dict[str, Any]] = []
    missing_columns: set[str] = set()
    for col, dtype in frame.schema.items():
        series = frame.get_column(col)
        count = int(series.null_count())
        if dtype == pl.String:
            count += int((series.drop_nulls().str.strip_chars() == "").sum())
        if count > 0:
            missing_columns.add(col)
            missing_by_column.append({
                "column": col,
                "count": count,
                "percent": round(count / max(rows_before, 1) * 100, 2),
            })
    missing_by_column.sort(key=lambda item: (item["count"], item["percent"]), reverse=True)

    outlier_columns: list[dict[str, Any]] = []
    outlier_row_indexes: set[int] = set()
    for col, dtype in frame.schema.items():
        if not dtype.is_numeric() or dtype == pl.Boolean:
            continue
        series = frame.get_column(col).cast(pl.Float64, strict=False)
        numeric = series.drop_nulls()
        if len(numeric) < 4:
            continue
        q1 = numeric.quantile(0.25)
        q3 = numeric.quantile(0.75)
        if q1 is None or q3 is None:
            continue
        iqr = q3 - q1
        if iqr <= 0:
            continue
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        flags = ((series < lower) | (series > upper)).fill_null(False)
        count = int(flags.sum())
        if count <= 0:
            continue
        indexes = [idx for idx, flagged in enumerate(flags.to_list()) if flagged]
        outlier_row_indexes.update(indexes)
        examples = [value for value, flagged in zip(series.to_list(), flags.to_list()) if flagged][:5]
        outlier_columns.append({
            "column": col,
            "count": count,
            "percent": round(count / max(rows_before, 1) * 100, 2),
            "lower_fence": lower,
            "upper_fence": upper,
            "examples": examples,
        })
    outlier_columns.sort(key=lambda item: item["count"], reverse=True)

    duplicate_preview: list[dict[str, Any]] = []
    duplicate_row_indexes: set[int] = set()
    if rows_before:
        try:
            duplicate_mask = frame.is_duplicated()
            duplicate_row_indexes = {idx for idx, flagged in enumerate(duplicate_mask.to_list()) if flagged}
            if duplicate_row_indexes:
                duplicate_preview = (
                    frame.with_row_index("__row_number", offset=1)
                    .filter(duplicate_mask)
                    .head(8)
                    .to_dicts()
                )
        except Exception:
            duplicate_preview = []

    missing_row_indexes: set[int] = set()
    missing_preview: list[dict[str, Any]] = []
    if rows_before and frame.columns:
        try:
            missing_checks = []
            for c, dtype in frame.schema.items():
                check = pl.col(c).is_null()
                if dtype == pl.String:
                    check = check | (pl.col(c).str.strip_chars() == "")
                missing_checks.append(check)
            missing_mask = pl.any_horizontal(missing_checks)
            indexed_missing = frame.with_row_index("__row_number", offset=1).filter(missing_mask)
            missing_row_indexes = {int(value) - 1 for value in indexed_missing.get_column("__row_number").to_list()}
            missing_preview = indexed_missing.head(8).to_dicts()
        except Exception:
            missing_row_indexes = set()
            missing_preview = []

    outlier_preview: list[dict[str, Any]] = []
    if outlier_row_indexes:
        try:
            mask = pl.Series("__outlier_flag", [idx in outlier_row_indexes for idx in range(rows_before)])
            outlier_preview = frame.with_row_index("__row_number", offset=1).filter(mask).head(8).to_dicts()
        except Exception:
            outlier_preview = []

    inconsistent_columns = [
        {
            "column": item["column"],
            "variant_groups": item["variant_groups"],
            "examples": item["examples"],
        }
        for item in case_issue_columns
    ]

    columns_with_issues = set(missing_columns)
    columns_with_issues.update(item["column"] for item in inconsistent_columns)
    columns_with_issues.update(item["column"] for item in date_issue_columns)
    columns_with_issues.update(item["column"] for item in outlier_columns)

    affected_rows = len(missing_row_indexes | duplicate_row_indexes | outlier_row_indexes)

    issue_breakdown = {
        "missing_values": missing_values + empty_string_cells,
        "duplicates": duplicate_rows,
        "inconsistent_data": sum(item["variant_groups"] for item in case_issue_columns),
        "outliers": sum(item["count"] for item in outlier_columns),
        "invalid_format": len(date_issue_columns),
    }

    issue_count = sum(issue_breakdown.values()) + blank_rows + whitespace_cells + len(changed_headers)

    total_cells = max(rows_before * max(columns_before, 1), 1)
    completeness = round((1 - (missing_values + empty_string_cells) / total_cells) * 100, 1)
    duplicate_penalty = min(18, duplicate_rows / max(rows_before, 1) * 100)
    inconsistency_penalty = min(8, issue_breakdown["inconsistent_data"] * 0.5)
    outlier_penalty = min(6, issue_breakdown["outliers"] / max(rows_before, 1) * 100 * 0.5)
    quality_score = max(0, min(100, round(completeness - duplicate_penalty - inconsistency_penalty - outlier_penalty, 1)))

    validation_checks = [
        {"label": "File loaded successfully", "status": "pass"},
        {"label": "Dataset contains rows and columns", "status": "pass" if rows_before and columns_before else "warn"},
        {"label": "Required field types profiled", "status": "pass"},
        {"label": "No exact duplicate rows", "status": "pass" if duplicate_rows == 0 else "warn"},
        {"label": "No high missingness fields (20%+)", "status": "pass" if not any(item["percent"] >= 20 for item in missing_by_column) else "warn"},
    ]

    recommended_actions_list: list[str] = []
    if missing_values or empty_string_cells:
        recommended_actions_list.append("Review missing values before interpreting affected fields.")
    if duplicate_rows:
        recommended_actions_list.append("Review exact duplicate rows and remove them if they are not intentional.")
    if inconsistent_columns:
        recommended_actions_list.append("Standardise case-only text variants where they represent the same business value.")
    if outlier_columns:
        recommended_actions_list.append("Validate statistical outliers against source records before excluding them.")
    if date_issue_columns:
        recommended_actions_list.append("Standardise mixed date formats to YYYY-MM-DD.")
    if not recommended_actions_list:
        recommended_actions_list.append("No immediate quality fixes are required; continue to analysis.")

    return {
        "rows": rows_before,
        "columns": columns_before,
        "duplicate_rows": duplicate_rows,
        "blank_rows": blank_rows,
        "missing_values": missing_values,
        "empty_string_cells": empty_string_cells,
        "whitespace_cells": whitespace_cells,
        "header_changes": changed_headers,
        "case_issue_columns": case_issue_columns,
        "date_issue_columns": date_issue_columns,
        "issue_count": issue_count,
        "completeness_percent": completeness,
        "quality_score": quality_score,
        "affected_rows": affected_rows,
        "columns_with_issues": len(columns_with_issues),
        "missing_by_column": missing_by_column,
        "missing_preview": missing_preview,
        "duplicate_preview": duplicate_preview,
        "inconsistent_columns": inconsistent_columns,
        "outlier_columns": outlier_columns,
        "outlier_preview": outlier_preview,
        "issue_breakdown": issue_breakdown,
        "validation_checks": validation_checks,
        "recommended_actions_list": recommended_actions_list,
        "recommended_actions": {
            "remove_duplicates": duplicate_rows > 0,
            "remove_blank_rows": blank_rows > 0,
            "trim_whitespace": whitespace_cells > 0 or empty_string_cells > 0,
            "clean_headers": bool(changed_headers),
            "standardise_dates": bool(date_issue_columns),
            "standardise_text_case": bool(case_issue_columns),
        },
    }


def clean_frame(
    frame: pl.DataFrame,
    *,
    remove_duplicates: bool = True,
    remove_blank_rows: bool = True,
    trim_whitespace: bool = True,
    clean_headers: bool = True,
    standardise_dates: bool = True,
    standardise_text_case: bool = False,
) -> tuple[pl.DataFrame, dict[str, Any]]:
    before = analyse_cleaning(frame)
    out = frame.clone()
    changes: dict[str, Any] = {
        "duplicates_removed": 0,
        "blank_rows_removed": 0,
        "whitespace_cells_cleaned": 0,
        "headers_renamed": 0,
        "date_columns_standardised": [],
        "text_case_columns_standardised": [],
    }

    string_cols = _string_columns(out)
    if trim_whitespace and string_cols:
        changes["whitespace_cells_cleaned"] = before["whitespace_cells"] + before["empty_string_cells"]
        out = out.with_columns([
            pl.when(pl.col(c).str.strip_chars() == "")
            .then(None)
            .otherwise(pl.col(c).str.strip_chars())
            .alias(c)
            for c in string_cols
        ])

    if remove_blank_rows and out.height:
        before_rows = out.height
        non_blank_exprs = []
        for c, dtype in out.schema.items():
            if dtype == pl.String:
                non_blank_exprs.append(pl.col(c).is_not_null() & (pl.col(c).str.strip_chars() != ""))
            else:
                non_blank_exprs.append(pl.col(c).is_not_null())
        if non_blank_exprs:
            combined = non_blank_exprs[0]
            for expr in non_blank_exprs[1:]:
                combined = combined | expr
            out = out.filter(combined)
        changes["blank_rows_removed"] = before_rows - out.height

    if remove_duplicates and out.height:
        before_rows = out.height
        out = out.unique(maintain_order=True)
        changes["duplicates_removed"] = before_rows - out.height

    if standardise_dates:
        for item in before["date_issue_columns"]:
            c = item["column"]
            if c in out.columns and out.schema[c] == pl.String:
                out = out.with_columns(
                    pl.col(c).map_elements(
                        lambda v: _date_parse(str(v)) if v is not None else None,
                        return_dtype=pl.String,
                        skip_nulls=True,
                    ).alias(c)
                )
                changes["date_columns_standardised"].append(c)

    if standardise_text_case:
        for item in before["case_issue_columns"]:
            c = item["column"]
            if c not in out.columns or out.schema[c] != pl.String:
                continue
            vals = [str(v) for v in out.get_column(c).drop_nulls().to_list() if str(v).strip()]
            groups: dict[str, Counter[str]] = defaultdict(Counter)
            for v in vals:
                groups[v.casefold()][v] += 1
            canonical = {k: counts.most_common(1)[0][0] for k, counts in groups.items() if len(counts) > 1}
            if canonical:
                out = out.with_columns(
                    pl.col(c).map_elements(
                        lambda v: canonical.get(str(v).casefold(), str(v)) if v is not None else None,
                        return_dtype=pl.String,
                        skip_nulls=True,
                    ).alias(c)
                )
                changes["text_case_columns_standardised"].append(c)

    if clean_headers:
        cleaned_names, _ = _unique_column_names(out.columns)
        rename_map = {old: new for old, new in zip(out.columns, cleaned_names) if old != new}
        if rename_map:
            out = out.rename(rename_map)
        changes["headers_renamed"] = len(rename_map)

    after = analyse_cleaning(out)
    return out, {"before": before, "after": after, "changes": changes}
