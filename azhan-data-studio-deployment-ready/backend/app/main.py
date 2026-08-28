from __future__ import annotations

import math
import re
from collections import Counter
from datetime import date, datetime
from io import BytesIO
import os
from pathlib import Path
from typing import Any

import polars as pl
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.insights import discover_insights
from app.compare import compare_datasets, prepare_comparison

APP_NAME = "Azhan Data Studio API"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
COMPARE_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB per file
SUPPORTED_EXTENSIONS = {".csv", ".xlsx"}

app = FastAPI(
    title=APP_NAME,
    description="Deterministic data-intelligence API for profiling, discovery, ranking, visualisation, dataset comparison, and report-ready analysis.",
    version="1.1.0",
)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

production_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[*DEFAULT_CORS_ORIGINS, *production_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": APP_NAME, "status": "running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


def _serialise(value: Any) -> Any:
    """Recursively convert values into JSON-safe Python objects."""
    if isinstance(value, dict):
        return {key: _serialise(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialise(item) for item in value]
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            return _serialise(value.item())
        except Exception:
            pass
    return value


def _normalise_name(name: str) -> tuple[str, set[str]]:
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name.strip())
    snake = re.sub(r"[^A-Za-z0-9]+", "_", snake).strip("_").lower()
    tokens = {token for token in snake.split("_") if token}
    return snake, tokens


def _classify_type(dtype: pl.DataType) -> str:
    if dtype == pl.Boolean:
        return "boolean"
    if dtype == pl.Date:
        return "date"
    if dtype.base_type() == pl.Datetime:
        return "datetime"
    if dtype == pl.String:
        return "text"
    if dtype.is_integer():
        return "integer"
    if dtype.is_float():
        return "decimal"
    return str(dtype).lower()


def _sample_non_null(series: pl.Series, limit: int = 250) -> list[Any]:
    try:
        return series.drop_nulls().head(limit).to_list()
    except Exception:
        return []


def _string_characteristics(series: pl.Series) -> dict[str, float]:
    values = [str(value).strip() for value in _sample_non_null(series) if str(value).strip()]
    if not values:
        return {"average_length": 0.0, "whitespace_ratio": 0.0}

    average_length = sum(len(value) for value in values) / len(values)
    whitespace_ratio = sum(any(char.isspace() for char in value) for value in values) / len(values)
    return {
        "average_length": round(average_length, 2),
        "whitespace_ratio": round(whitespace_ratio, 3),
    }


def _looks_like_iso_dates(series: pl.Series) -> bool:
    values = [str(value).strip() for value in _sample_non_null(series, 80) if str(value).strip()]
    if len(values) < 3:
        return False

    parsed = 0
    for value in values:
        candidate = value.replace("Z", "+00:00")
        try:
            datetime.fromisoformat(candidate)
            parsed += 1
            continue
        except ValueError:
            pass
        try:
            date.fromisoformat(candidate)
            parsed += 1
        except ValueError:
            pass
    return (parsed / len(values)) >= 0.85


def _numeric_bounds(series: pl.Series) -> tuple[float | None, float | None]:
    try:
        numeric = series.cast(pl.Float64, strict=False).drop_nulls()
        if len(numeric) == 0:
            return None, None
        return float(numeric.min()), float(numeric.max())
    except Exception:
        return None, None


def _infer_role(
    name: str,
    series: pl.Series,
    dtype: pl.DataType,
    unique_non_null: int,
    row_count: int,
) -> tuple[str, int, str]:
    """Infer the analytical role of a column and explain the decision."""
    normalised, tokens = _normalise_name(name)
    non_null_count = row_count - series.null_count()
    uniqueness_ratio = unique_non_null / max(non_null_count, 1)

    strong_id_tokens = {"id", "uuid", "guid", "identifier", "key"}
    soft_id_tokens = {"code", "number", "no"}
    text_tokens = {
        "comment", "comments", "description", "descriptions", "note", "notes",
        "message", "messages", "remark", "remarks", "feedback", "reason",
        "reasons", "narrative", "details", "detail", "memo",
    }
    time_tokens = {"date", "datetime", "timestamp", "time"}
    category_tokens = {
        "category", "type", "status", "group", "segment", "class", "region",
        "department", "team", "country", "state", "city", "grade", "level", "pclass",
    }
    boolean_tokens = {"is", "has", "flag", "active", "enabled", "valid"}
    percent_strong_tokens = {"percent", "percentage", "pct"}
    proportion_tokens = {"ratio", "share", "proportion"}

    if dtype == pl.Boolean:
        return "boolean", 100, "The source data type is Boolean."

    if dtype == pl.Date or dtype.base_type() == pl.Datetime:
        return "time", 100, "The source values were parsed as dates/times."

    if dtype == pl.String and _looks_like_iso_dates(series):
        if tokens.intersection(time_tokens) or any(token.endswith("date") for token in tokens):
            return "time", 94, "The field name suggests time and sampled values parse as dates."
        return "time", 86, "Most sampled text values parse as ISO-style dates/times."

    has_strong_id_name = bool(tokens.intersection(strong_id_tokens)) or normalised.endswith("_id")
    has_soft_id_name = bool(tokens.intersection(soft_id_tokens)) or normalised.endswith(("_code", "_number", "_no"))

    if has_strong_id_name and uniqueness_ratio >= 0.70:
        return "identifier", 99, "The name is identifier-like and most non-missing values are unique."
    if has_soft_id_name and uniqueness_ratio >= 0.90:
        return "identifier", 91, "The name is code/number-like and values are highly unique."

    if dtype == pl.String:
        values = [str(value).strip().lower() for value in _sample_non_null(series) if str(value).strip()]
        boolean_values = {"true", "false", "yes", "no", "y", "n", "0", "1"}
        if values and set(values).issubset(boolean_values) and len(set(values)) <= 2:
            return "boolean", 92, "The text values form a two-state Boolean-like set."

        if tokens.intersection(text_tokens):
            return "text", 99, "The field name indicates comments, notes, descriptions, or other free text."

        characteristics = _string_characteristics(series)
        avg_length = characteristics["average_length"]
        whitespace_ratio = characteristics["whitespace_ratio"]

        if unique_non_null <= 50 and uniqueness_ratio <= 0.35:
            confidence = 96 if unique_non_null <= 20 else 90
            return "category", confidence, "The field has a small repeated set of text values."

        if avg_length >= 28 or whitespace_ratio >= 0.55:
            return "text", 91, "Sampled values are sentence/phrase-like rather than compact labels."

        if uniqueness_ratio >= 0.98 and avg_length <= 24 and whitespace_ratio <= 0.10:
            return "identifier", 75, "Values are almost entirely unique compact strings; this may be an identifier."

        return "text", 78, "The field contains varied text with relatively high cardinality."

    if dtype.is_numeric():
        minimum, maximum = _numeric_bounds(series)

        if name.strip().lower() in {"year", "yyyy"} and minimum is not None and maximum is not None:
            if 1800 <= minimum <= 2300 and 1800 <= maximum <= 2300:
                return "time", 95, "The field is named Year and values look like calendar years."

        if has_strong_id_name and uniqueness_ratio >= 0.70:
            return "identifier", 98, "The numeric field has an identifier-like name and high uniqueness."
        if has_soft_id_name and uniqueness_ratio >= 0.90:
            return "identifier", 90, "The numeric field looks like a unique code or number."

        numeric_values = set()
        try:
            numeric_values = set(series.drop_nulls().unique().head(5).to_list())
        except Exception:
            pass
        if numeric_values and numeric_values.issubset({0, 1}) and unique_non_null <= 2:
            if tokens.intersection(boolean_tokens) or normalised.startswith(("is_", "has_")):
                return "boolean", 96, "The field name is flag-like and values are binary 0/1."
            return "boolean", 88, "The numeric field contains only two states, 0 and 1, so it is treated as a binary analytical variable."

        if minimum is not None and maximum is not None:
            if tokens.intersection(percent_strong_tokens) and -100 <= minimum <= 100 and -100 <= maximum <= 100:
                return "percentage", 99, "The field name explicitly indicates a percentage."
            if tokens.intersection(proportion_tokens) and -1.5 <= minimum <= 1.5 and -1.5 <= maximum <= 1.5:
                return "percentage", 97, "The name indicates a ratio/share and values are proportion-scaled."
            if "rate" in tokens and 0 <= minimum <= 1.5 and 0 <= maximum <= 1.5:
                return "percentage", 96, "The field is a rate and values are stored as proportions between 0 and 1."

        if tokens.intersection(category_tokens) and unique_non_null <= 30:
            return "category", 84, "The name is category-like and the numeric field has few distinct values."

        return "measure", 96, "The field is numeric and is suitable for aggregation/statistical analysis."

    return "other", 60, "No strong semantic pattern was detected."


def _top_values(series: pl.Series, row_count: int, limit: int = 5) -> list[dict[str, Any]]:
    non_null = series.drop_nulls()
    if len(non_null) == 0:
        return []

    try:
        counts = non_null.value_counts(sort=True, name="count").head(limit)
        rows = counts.rows()
    except Exception:
        # Conservative fallback for unusual dtypes.
        counter = Counter(str(value) for value in non_null.head(5000).to_list())
        rows = counter.most_common(limit)

    top = []
    for value, count in rows:
        top.append(
            {
                "value": str(_serialise(value)),
                "count": int(count),
                "percent": round((int(count) / max(len(non_null), 1)) * 100, 2),
            }
        )
    return top


def _numeric_profile(series: pl.Series) -> dict[str, Any]:
    numeric = series.cast(pl.Float64, strict=False).drop_nulls()
    if len(numeric) == 0:
        return {}

    q1 = numeric.quantile(0.25)
    q3 = numeric.quantile(0.75)
    iqr = (q3 - q1) if q1 is not None and q3 is not None else None
    outlier_count = 0
    if iqr is not None and iqr > 0:
        lower = q1 - (1.5 * iqr)
        upper = q3 + (1.5 * iqr)
        outlier_count = int(((numeric < lower) | (numeric > upper)).sum())

    return {
        "minimum": numeric.min(),
        "maximum": numeric.max(),
        "mean": numeric.mean(),
        "median": numeric.median(),
        "std_dev": numeric.std(),
        "q1": q1,
        "q3": q3,
        "iqr": iqr,
        "outlier_count_iqr": outlier_count,
        "zero_count": int((numeric == 0).sum()),
        "negative_count": int((numeric < 0).sum()),
    }


def _profile_column(
    series: pl.Series,
    role: str,
    row_count: int,
    missing_count: int,
    unique_non_null: int,
) -> tuple[dict[str, Any], str]:
    non_null_count = row_count - missing_count
    base: dict[str, Any] = {
        "row_count": row_count,
        "non_null_count": non_null_count,
        "missing_count": missing_count,
        "missing_percent": round((missing_count / max(row_count, 1)) * 100, 2),
        "unique_non_null": unique_non_null,
        "uniqueness_percent": round((unique_non_null / max(non_null_count, 1)) * 100, 2),
    }

    if role in {"measure", "percentage"}:
        stats = _numeric_profile(series)
        base.update(stats)
        if role == "percentage" and stats:
            maximum = stats.get("maximum")
            scale = "fraction" if maximum is not None and maximum <= 1.5 else "percent"
            base["percentage_scale"] = scale
            mean = stats.get("mean")
            if mean is not None:
                display_mean = mean * 100 if scale == "fraction" else mean
                return base, f"Average {display_mean:.1f}% · {stats.get('outlier_count_iqr', 0)} IQR outliers"
        mean = stats.get("mean")
        median = stats.get("median")
        if mean is not None and median is not None:
            return base, f"Mean {mean:.2f} · median {median:.2f}"
        return base, "Numeric profile available"

    if role == "category":
        top = _top_values(series, row_count)
        base["top_values"] = top
        if top:
            return base, f"Top: {top[0]['value']} ({top[0]['percent']:.1f}%)"
        return base, "No non-missing categories"

    if role == "text":
        string_series = series.cast(pl.String, strict=False).drop_nulls()
        lengths = string_series.str.len_chars() if len(string_series) else None
        top = _top_values(series, row_count)
        base["top_values"] = top
        if lengths is not None and len(lengths):
            base.update(
                {
                    "average_length": lengths.mean(),
                    "min_length": lengths.min(),
                    "max_length": lengths.max(),
                }
            )
            return base, f"Average text length {float(lengths.mean()):.1f} characters"
        return base, "Text field"

    if role == "time":
        non_null = series.drop_nulls()
        if len(non_null):
            earliest = non_null.min()
            latest = non_null.max()
            base["earliest"] = earliest
            base["latest"] = latest
            try:
                delta = latest - earliest
                base["range_days"] = delta.days if hasattr(delta, "days") else None
            except Exception:
                base["range_days"] = None
            return base, f"{_serialise(earliest)} → {_serialise(latest)}"
        return base, "No non-missing dates"

    if role == "boolean":
        true_count = 0
        false_count = 0
        if series.dtype == pl.Boolean:
            true_count = int((series == True).sum())  # noqa: E712
            false_count = int((series == False).sum())  # noqa: E712
        else:
            normalised = series.cast(pl.String, strict=False).str.strip_chars().str.to_lowercase()
            true_values = ["true", "yes", "y", "1"]
            false_values = ["false", "no", "n", "0"]
            true_count = int(normalised.is_in(true_values).sum())
            false_count = int(normalised.is_in(false_values).sum())
        base.update(
            {
                "true_count": true_count,
                "false_count": false_count,
                "true_percent": round((true_count / max(non_null_count, 1)) * 100, 2),
            }
        )
        return base, f"True {base['true_percent']:.1f}% · False {100 - base['true_percent']:.1f}%"

    if role == "identifier":
        repeated = max(non_null_count - unique_non_null, 0)
        base["repeated_value_count"] = repeated
        return base, f"{base['uniqueness_percent']:.1f}% unique · {repeated} repeated values"

    return base, f"{unique_non_null} distinct non-missing values"


async def _read_uploaded_bytes(file: UploadFile, max_size: int = MAX_FILE_SIZE) -> bytes:
    content = await file.read(max_size + 1)
    if len(content) > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File exceeds the current {limit_mb} MB limit.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return content


def _validate_uploaded_format(content: bytes, extension: str) -> None:
    """Apply a second server-side format guard after extension validation."""
    if extension == ".xlsx" and not content.startswith(b"PK"):
        raise HTTPException(
            status_code=400,
            detail="This file is not a valid XLSX workbook. Please upload a genuine .xlsx file.",
        )


def _read_dataset(content: bytes, extension: str, sheet_name: str | None = None) -> pl.DataFrame:
    try:
        if extension == ".csv":
            return pl.read_csv(
                BytesIO(content),
                try_parse_dates=True,
                infer_schema_length=1000,
            )
        if extension == ".xlsx":
            kwargs: dict[str, Any] = {"engine": "calamine"}
            if sheet_name:
                kwargs["sheet_name"] = sheet_name
            return pl.read_excel(BytesIO(content), **kwargs)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read dataset: {exc}") from exc
    raise HTTPException(status_code=400, detail="Unsupported file format.")


def _workbook_sheet_metadata(content: bytes) -> dict[str, Any]:
    try:
        sheets = pl.read_excel(
            BytesIO(content),
            sheet_id=0,
            engine="calamine",
            raise_if_empty=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to inspect Excel workbook: {exc}") from exc

    if isinstance(sheets, pl.DataFrame):
        sheets = {"Sheet1": sheets}

    metadata: list[dict[str, Any]] = []
    for index, (name, frame) in enumerate(sheets.items(), start=1):
        rows = int(frame.height)
        columns = int(frame.width)
        populated = rows > 0 and columns > 0
        analysis_ready = populated
        if not populated:
            classification = "Empty sheet"
        elif rows < 20 or columns < 2:
            classification = "Small / reference sheet"
        else:
            classification = "Data table"
        metadata.append(
            {
                "index": index,
                "name": name,
                "rows": rows,
                "columns": columns,
                "analysis_ready": analysis_ready,
                "classification": classification,
                "score": rows * max(columns, 1),
            }
        )

    candidates = [sheet for sheet in metadata if sheet["analysis_ready"]]
    recommended = max(candidates, key=lambda sheet: sheet["score"], default=None)
    for sheet in metadata:
        sheet["recommended"] = bool(recommended and sheet["name"] == recommended["name"])
        sheet.pop("score", None)

    return {
        "sheet_count": len(metadata),
        "recommended_sheet": recommended["name"] if recommended else None,
        "sheets": metadata,
    }


@app.post("/api/datasets/workbook")
async def inspect_workbook(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename supplied.")

    extension = Path(file.filename).suffix.lower()
    if extension != ".xlsx":
        raise HTTPException(status_code=400, detail="Workbook sheet detection is available for XLSX files only.")

    content = await _read_uploaded_bytes(file)
    _validate_uploaded_format(content, extension)
    workbook = _workbook_sheet_metadata(content)
    workbook.update({"filename": file.filename, "file_size_bytes": len(content)})
    return _serialise({"workbook": workbook})


@app.post("/api/datasets/inspect")
async def inspect_dataset(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename supplied.")

    extension = Path(file.filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported.")

    content = await _read_uploaded_bytes(file)
    _validate_uploaded_format(content, extension)
    dataframe = _read_dataset(content, extension, sheet_name if extension == ".xlsx" else None)

    if dataframe.height == 0:
        raise HTTPException(status_code=400, detail="Dataset contains no rows.")
    if dataframe.width == 0:
        raise HTTPException(status_code=400, detail="Dataset contains no columns.")

    schema: list[dict[str, Any]] = []
    total_missing = 0
    role_counts: Counter[str] = Counter()

    for column_name, dtype in zip(dataframe.columns, dataframe.dtypes):
        series = dataframe[column_name]
        missing_count = series.null_count()
        non_null = series.drop_nulls()
        unique_non_null = non_null.n_unique() if len(non_null) else 0
        total_missing += missing_count

        role, confidence, reason = _infer_role(
            column_name,
            series,
            dtype,
            unique_non_null,
            dataframe.height,
        )
        role_counts[role] += 1
        profile, key_signal = _profile_column(
            series,
            role,
            dataframe.height,
            missing_count,
            unique_non_null,
        )

        schema.append(
            {
                "name": column_name,
                "data_type": _classify_type(dtype),
                "semantic_role": role,
                "semantic_confidence": confidence,
                "semantic_reason": reason,
                "polars_type": str(dtype),
                "missing_count": missing_count,
                "missing_percent": round((missing_count / dataframe.height) * 100, 2),
                "unique_count": unique_non_null,
                "key_signal": key_signal,
                "profile": profile,
            }
        )

    try:
        duplicate_rows = dataframe.height - dataframe.unique().height
    except Exception:
        duplicate_rows = 0

    total_cells = dataframe.height * dataframe.width
    completeness = round((1 - (total_missing / total_cells)) * 100, 1) if total_cells else 100.0
    preview = dataframe.head(10).to_dicts()
    discovery = discover_insights(dataframe, schema, duplicate_rows)

    result = {
        "dataset": {
            "filename": file.filename,
            "file_type": extension.removeprefix("."),
            "file_size_bytes": len(content),
            "rows": dataframe.height,
            "columns": dataframe.width,
            "sheet_name": sheet_name if extension == ".xlsx" else None,
        },
        "quality": {
            "missing_values": total_missing,
            "duplicate_rows": duplicate_rows,
            "completeness_percent": completeness,
        },
        "understanding": {
            "role_counts": dict(role_counts),
            "average_semantic_confidence": round(
                sum(field["semantic_confidence"] for field in schema) / max(len(schema), 1),
                1,
            ),
        },
        "discovery": discovery,
        "schema": schema,
        "preview": preview,
    }
    return _serialise(result)


def _validate_compare_upload(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Both comparison files need filenames.")
    extension = Path(file.filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Dataset Compare supports CSV and XLSX files only.")
    return extension


@app.post("/api/datasets/compare/prepare")
async def prepare_dataset_comparison(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    sheet_name_a: str | None = Form(default=None),
    sheet_name_b: str | None = Form(default=None),
) -> dict[str, Any]:
    extension_a = _validate_compare_upload(file_a)
    extension_b = _validate_compare_upload(file_b)
    content_a = await _read_uploaded_bytes(file_a, COMPARE_MAX_FILE_SIZE)
    content_b = await _read_uploaded_bytes(file_b, COMPARE_MAX_FILE_SIZE)
    _validate_uploaded_format(content_a, extension_a)
    _validate_uploaded_format(content_b, extension_b)

    frame_a = _read_dataset(content_a, extension_a, sheet_name_a if extension_a == ".xlsx" else None)
    frame_b = _read_dataset(content_b, extension_b, sheet_name_b if extension_b == ".xlsx" else None)
    if frame_a.height == 0 or frame_b.height == 0:
        raise HTTPException(status_code=400, detail="Both comparison datasets must contain at least one row.")

    prepared = prepare_comparison(frame_a, frame_b)
    prepared["dataset_a"].update({
        "filename": file_a.filename,
        "file_type": extension_a.removeprefix("."),
        "file_size_bytes": len(content_a),
        "sheet_name": sheet_name_a if extension_a == ".xlsx" else None,
    })
    prepared["dataset_b"].update({
        "filename": file_b.filename,
        "file_type": extension_b.removeprefix("."),
        "file_size_bytes": len(content_b),
        "sheet_name": sheet_name_b if extension_b == ".xlsx" else None,
    })
    return _serialise(prepared)


@app.post("/api/datasets/compare")
async def compare_dataset_versions(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    key: str = Form(...),
    sheet_name_a: str | None = Form(default=None),
    sheet_name_b: str | None = Form(default=None),
) -> dict[str, Any]:
    extension_a = _validate_compare_upload(file_a)
    extension_b = _validate_compare_upload(file_b)
    content_a = await _read_uploaded_bytes(file_a, COMPARE_MAX_FILE_SIZE)
    content_b = await _read_uploaded_bytes(file_b, COMPARE_MAX_FILE_SIZE)
    _validate_uploaded_format(content_a, extension_a)
    _validate_uploaded_format(content_b, extension_b)

    frame_a = _read_dataset(content_a, extension_a, sheet_name_a if extension_a == ".xlsx" else None)
    frame_b = _read_dataset(content_b, extension_b, sheet_name_b if extension_b == ".xlsx" else None)
    try:
        comparison = compare_datasets(frame_a, frame_b, key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    comparison["dataset_a"] = {
        "filename": file_a.filename,
        "file_type": extension_a.removeprefix("."),
        "file_size_bytes": len(content_a),
        "rows": frame_a.height,
        "columns": frame_a.width,
        "sheet_name": sheet_name_a if extension_a == ".xlsx" else None,
    }
    comparison["dataset_b"] = {
        "filename": file_b.filename,
        "file_type": extension_b.removeprefix("."),
        "file_size_bytes": len(content_b),
        "rows": frame_b.height,
        "columns": frame_b.width,
        "sheet_name": sheet_name_b if extension_b == ".xlsx" else None,
    }
    return _serialise(comparison)
