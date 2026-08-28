from __future__ import annotations

import calendar
import math
from collections import defaultdict
from datetime import date, datetime, timedelta
from statistics import median
from typing import Any, Iterable

import polars as pl

DATE_NAME_HINTS = {
    "date", "time", "timestamp", "month", "week", "quarter", "year", "period",
    "orderdate", "salesdate", "transactiondate", "created", "createdat", "updatedat",
}
METRIC_NAME_HINTS = {
    "sales", "revenue", "cost", "margin", "profit", "units", "quantity", "qty", "orders",
    "demand", "volume", "value", "amount", "price", "count", "stock", "inventory",
}
DATE_FORMATS = (
    "%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%m-%d-%Y",
    "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S", "%m/%d/%Y %H:%M:%S",
    "%Y-%m", "%Y/%m", "%b %Y", "%B %Y", "%b-%Y", "%B-%Y",
)


def _normalise_name(name: str) -> str:
    return "".join(ch.lower() for ch in name if ch.isalnum())


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        number = float(value)
        if number.is_integer() and 1800 <= number <= 2300:
            return date(int(number), 1, 1)
        return None

    text = str(value).strip()
    if not text:
        return None
    candidate = text.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(candidate).date()
    except ValueError:
        pass
    try:
        return date.fromisoformat(candidate)
    except ValueError:
        pass
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    if text.isdigit() and len(text) == 4:
        year = int(text)
        if 1800 <= year <= 2300:
            return date(year, 1, 1)
    return None


def _to_float(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def _date_candidate(series: pl.Series, name: str, row_count: int) -> dict[str, Any] | None:
    sample = series.head(min(row_count, 600)).to_list()
    non_null = [value for value in sample if value is not None]
    if not non_null:
        return None
    parsed = [parsed for parsed in (_parse_date(value) for value in non_null) if parsed]
    parse_percent = (len(parsed) / len(non_null)) * 100
    dtype = series.dtype
    typed_date = dtype == pl.Date or dtype.base_type() == pl.Datetime
    hinted = any(hint in _normalise_name(name) for hint in DATE_NAME_HINTS)
    if not typed_date and parse_percent < 70:
        return None
    if parse_percent < 85 and not hinted:
        return None

    unique_dates = sorted(set(parsed))
    if not unique_dates:
        return None
    score = min(100.0, parse_percent + (8 if hinted else 0) + (5 if typed_date else 0))
    return {
        "field": name,
        "parse_percent": round(parse_percent, 1),
        "unique_dates": len(unique_dates),
        "min_date": unique_dates[0].isoformat(),
        "max_date": unique_dates[-1].isoformat(),
        "score": round(score, 1),
        "detected_type": "date/time" if typed_date else "date-like text",
    }


def _metric_candidate(series: pl.Series, name: str) -> dict[str, Any] | None:
    numeric = [_to_float(value) for value in series.to_list()]
    values = [value for value in numeric if value is not None]
    if len(values) < 3:
        return None
    unique_values = len(set(values))
    if unique_values <= 2:
        return None
    norm = _normalise_name(name)
    hinted = any(hint in norm for hint in METRIC_NAME_HINTS)
    priority_hint = any(hint in norm for hint in ("revenue", "sales", "demand", "volume"))
    mean = sum(values) / len(values)
    hint_bonus = 14 if priority_hint else (10 if hinted else 0)
    score = 70 + min(18, math.log10(max(unique_values, 1)) * 7) + hint_bonus
    return {
        "field": name,
        "non_null": len(values),
        "unique_values": unique_values,
        "minimum": min(values),
        "maximum": max(values),
        "mean": mean,
        "score": round(min(100.0, score), 1),
    }


def _detect_frequency(dates: list[date]) -> str:
    unique_dates = sorted(set(dates))
    if len(unique_dates) < 2:
        return "monthly"
    gaps = [(b - a).days for a, b in zip(unique_dates, unique_dates[1:]) if (b - a).days > 0]
    if not gaps:
        return "monthly"
    med = median(gaps)
    if med <= 2:
        return "daily"
    if med <= 10:
        return "weekly"
    if med <= 50:
        return "monthly"
    if med <= 130:
        return "quarterly"
    return "yearly"


def _bucket_date(value: date, frequency: str) -> date:
    if frequency == "daily":
        return value
    if frequency == "weekly":
        return value - timedelta(days=value.weekday())
    if frequency == "monthly":
        return date(value.year, value.month, 1)
    if frequency == "quarterly":
        month = ((value.month - 1) // 3) * 3 + 1
        return date(value.year, month, 1)
    return date(value.year, 1, 1)


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _next_date(value: date, frequency: str, steps: int = 1) -> date:
    if frequency == "daily":
        return value + timedelta(days=steps)
    if frequency == "weekly":
        return value + timedelta(days=7 * steps)
    if frequency == "monthly":
        return _add_months(value, steps)
    if frequency == "quarterly":
        return _add_months(value, 3 * steps)
    return _add_months(value, 12 * steps)


def _period_label(frequency: str) -> str:
    return {
        "daily": "day",
        "weekly": "week",
        "monthly": "month",
        "quarterly": "quarter",
        "yearly": "year",
    }.get(frequency, "period")


def _seasonal_period(frequency: str, n: int) -> int | None:
    period = {
        "daily": 7,
        "weekly": 52,
        "monthly": 12,
        "quarterly": 4,
    }.get(frequency)
    if period and n >= period * 2:
        return period
    return None


def _linear_fit(values: list[float]) -> tuple[float, float]:
    n = len(values)
    if n <= 1:
        return (values[0] if values else 0.0), 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    numerator = sum((i - x_mean) * (value - y_mean) for i, value in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator else 0.0
    intercept = y_mean - slope * x_mean
    return intercept, slope


def _variance(values: Iterable[float]) -> float:
    items = list(values)
    if len(items) < 2:
        return 0.0
    mean = sum(items) / len(items)
    return sum((value - mean) ** 2 for value in items) / len(items)


def _fit_model(values: list[float], frequency: str) -> dict[str, Any]:
    intercept, slope = _linear_fit(values)
    n = len(values)
    trend = [intercept + slope * i for i in range(n)]
    detrended = [value - fitted for value, fitted in zip(values, trend)]
    period = _seasonal_period(frequency, n)
    seasonal: list[float] = []
    seasonality_strength = 0.0

    if period:
        buckets: list[list[float]] = [[] for _ in range(period)]
        for index, residual in enumerate(detrended):
            buckets[index % period].append(residual)
        seasonal = [sum(bucket) / len(bucket) if bucket else 0.0 for bucket in buckets]
        centre = sum(seasonal) / len(seasonal)
        seasonal = [value - centre for value in seasonal]
        adjusted_residuals = [detrended[index] - seasonal[index % period] for index in range(n)]
        baseline_var = _variance(detrended)
        adjusted_var = _variance(adjusted_residuals)
        seasonality_strength = max(0.0, min(1.0, 1 - (adjusted_var / baseline_var))) if baseline_var > 0 else 0.0
    else:
        adjusted_residuals = detrended

    fitted = [trend[index] + (seasonal[index % period] if period else 0.0) for index in range(n)]
    residuals = [value - prediction for value, prediction in zip(values, fitted)]
    rmse = math.sqrt(sum(residual ** 2 for residual in residuals) / max(n, 1))
    return {
        "intercept": intercept,
        "slope": slope,
        "period": period,
        "seasonal": seasonal,
        "seasonality_strength": seasonality_strength,
        "fitted": fitted,
        "rmse": rmse,
    }


def _model_value(model: dict[str, Any], index: int) -> float:
    value = model["intercept"] + model["slope"] * index
    period = model["period"]
    if period:
        value += model["seasonal"][index % period]
    return value


def _backtest(values: list[float], frequency: str) -> dict[str, Any]:
    n = len(values)
    holdout = max(2, min(6, round(n * 0.2)))
    train = values[:-holdout]
    actual = values[-holdout:]
    if len(train) < 6:
        return {"holdout_periods": 0, "mape": None, "mae": None}
    model = _fit_model(train, frequency)
    predictions = [_model_value(model, len(train) + index) for index in range(holdout)]
    errors = [abs(a - p) for a, p in zip(actual, predictions)]
    non_zero = [(a, p) for a, p in zip(actual, predictions) if abs(a) > 1e-9]
    mape = None
    if non_zero:
        mape = sum(abs((a - p) / a) for a, p in non_zero) / len(non_zero) * 100
    return {
        "holdout_periods": holdout,
        "mape": round(mape, 2) if mape is not None and math.isfinite(mape) else None,
        "mae": round(sum(errors) / len(errors), 6) if errors else None,
    }


def _confidence_label(mape: float | None, points: int) -> str:
    if points < 10:
        return "Low"
    if mape is None:
        return "Moderate" if points >= 18 else "Low"
    if mape <= 10 and points >= 18:
        return "High"
    if mape <= 25 and points >= 12:
        return "Moderate"
    return "Low"


def prepare_forecast(frame: pl.DataFrame) -> dict[str, Any]:
    date_candidates: list[dict[str, Any]] = []
    metric_candidates: list[dict[str, Any]] = []
    for name in frame.columns:
        series = frame[name]
        candidate = _date_candidate(series, name, frame.height)
        if candidate:
            date_candidates.append(candidate)
        metric = _metric_candidate(series, name)
        if metric:
            metric_candidates.append(metric)

    date_candidates.sort(key=lambda item: (-item["score"], -item["unique_dates"], item["field"]))
    metric_candidates.sort(key=lambda item: (-item["score"], -item["unique_values"], item["field"]))
    recommended_date = date_candidates[0]["field"] if date_candidates else None
    recommended_metric = metric_candidates[0]["field"] if metric_candidates else None

    suggested_frequency = None
    if recommended_date:
        dates = [_parse_date(value) for value in frame[recommended_date].to_list()]
        suggested_frequency = _detect_frequency([value for value in dates if value])

    return {
        "rows": frame.height,
        "columns": frame.width,
        "date_candidates": date_candidates,
        "metric_candidates": metric_candidates,
        "recommended_date": recommended_date,
        "recommended_metric": recommended_metric,
        "suggested_frequency": suggested_frequency or "monthly",
        "ready": bool(date_candidates and metric_candidates),
        "minimum_history_periods": 8,
    }


def forecast_series(
    frame: pl.DataFrame,
    date_field: str,
    metric_field: str,
    aggregation: str = "sum",
    frequency: str = "auto",
    horizon: int = 6,
) -> dict[str, Any]:
    if date_field not in frame.columns:
        raise ValueError(f"Date field '{date_field}' was not found.")
    if metric_field not in frame.columns:
        raise ValueError(f"Metric field '{metric_field}' was not found.")
    if aggregation not in {"sum", "mean"}:
        raise ValueError("Aggregation must be sum or mean.")
    if frequency not in {"auto", "daily", "weekly", "monthly", "quarterly", "yearly"}:
        raise ValueError("Frequency must be auto, daily, weekly, monthly, quarterly, or yearly.")
    if horizon < 1 or horizon > 36:
        raise ValueError("Forecast horizon must be between 1 and 36 periods.")

    parsed_rows: list[tuple[date, float]] = []
    for raw_date, raw_metric in zip(frame[date_field].to_list(), frame[metric_field].to_list()):
        parsed_date = _parse_date(raw_date)
        metric = _to_float(raw_metric)
        if parsed_date is not None and metric is not None:
            parsed_rows.append((parsed_date, metric))

    if len(parsed_rows) < 8:
        raise ValueError("At least 8 rows with a valid date and numeric metric are required for forecasting.")

    raw_dates = [item[0] for item in parsed_rows]
    resolved_frequency = _detect_frequency(raw_dates) if frequency == "auto" else frequency
    grouped: dict[date, list[float]] = defaultdict(list)
    for parsed_date, metric in parsed_rows:
        grouped[_bucket_date(parsed_date, resolved_frequency)].append(metric)

    series_dates = sorted(grouped)
    series_values = [sum(grouped[item]) if aggregation == "sum" else sum(grouped[item]) / len(grouped[item]) for item in series_dates]
    if len(series_dates) < 8:
        raise ValueError(
            f"Only {len(series_dates)} {resolved_frequency} periods were available after aggregation. "
            "Choose a finer time grain or provide at least 8 historical periods."
        )

    model = _fit_model(series_values, resolved_frequency)
    backtest = _backtest(series_values, resolved_frequency)
    all_non_negative = min(series_values) >= 0
    n = len(series_values)
    forecast_points: list[dict[str, Any]] = []
    for step in range(1, horizon + 1):
        index = n + step - 1
        prediction = _model_value(model, index)
        uncertainty = 1.96 * model["rmse"] * math.sqrt(1 + (step / max(n, 1)))
        lower = prediction - uncertainty
        upper = prediction + uncertainty
        if all_non_negative:
            lower = max(0.0, lower)
        forecast_points.append({
            "date": _next_date(series_dates[-1], resolved_frequency, step).isoformat(),
            "value": prediction,
            "lower": lower,
            "upper": upper,
        })

    mean_value = sum(series_values) / n
    slope = model["slope"]
    slope_percent = (slope / abs(mean_value) * 100) if abs(mean_value) > 1e-9 else None
    if abs(slope) <= max(model["rmse"] * 0.05, abs(mean_value) * 0.002):
        trend_direction = "Stable"
    else:
        trend_direction = "Upward" if slope > 0 else "Downward"

    seasonality_strength_percent = model["seasonality_strength"] * 100
    seasonality_detected = bool(model["period"] and seasonality_strength_percent >= 10)
    confidence = _confidence_label(backtest["mape"], n)
    next_value = forecast_points[0]["value"]
    last_value = series_values[-1]
    next_change_percent = ((next_value - last_value) / abs(last_value) * 100) if abs(last_value) > 1e-9 else None
    final_value = forecast_points[-1]["value"]
    horizon_change_percent = ((final_value - last_value) / abs(last_value) * 100) if abs(last_value) > 1e-9 else None

    history = [
        {
            "date": d.isoformat(),
            "value": value,
            "fitted": model["fitted"][index],
        }
        for index, (d, value) in enumerate(zip(series_dates, series_values))
    ]

    period_word = _period_label(resolved_frequency)
    model_name = "Linear trend"
    if model["period"]:
        model_name = f"Linear trend + {resolved_frequency} seasonality"

    highlights = [
        {
            "type": "trend",
            "title": f"{trend_direction} historical trend",
            "detail": f"The fitted trend changes by {slope:+.2f} per {period_word} ({slope_percent:+.1f}% of the historical mean)." if slope_percent is not None else f"The fitted trend changes by {slope:+.2f} per {period_word}.",
        },
        {
            "type": "seasonality",
            "title": "Seasonality detected" if seasonality_detected else "No strong seasonality detected",
            "detail": f"Seasonality strength is {seasonality_strength_percent:.1f}% using a {model['period']}-period cycle." if model["period"] else "There was not enough repeated seasonal history for a reliable seasonal component.",
        },
        {
            "type": "validation",
            "title": f"{confidence} model confidence",
            "detail": f"Backtest MAPE is {backtest['mape']:.1f}% across the last {backtest['holdout_periods']} periods." if backtest["mape"] is not None else "Backtest percentage accuracy could not be calculated reliably because of zero or limited values.",
        },
    ]

    return {
        "configuration": {
            "date_field": date_field,
            "metric_field": metric_field,
            "aggregation": aggregation,
            "frequency": resolved_frequency,
            "requested_frequency": frequency,
            "horizon": horizon,
        },
        "summary": {
            "history_periods": n,
            "history_start": series_dates[0].isoformat(),
            "history_end": series_dates[-1].isoformat(),
            "latest_actual": last_value,
            "next_forecast": next_value,
            "next_forecast_change_percent": next_change_percent,
            "horizon_end_forecast": final_value,
            "horizon_change_percent": horizon_change_percent,
            "forecast_average": sum(point["value"] for point in forecast_points) / len(forecast_points),
            "forecast_total": sum(point["value"] for point in forecast_points),
        },
        "diagnostics": {
            "model": model_name,
            "trend_direction": trend_direction,
            "trend_per_period": slope,
            "trend_percent_of_mean": slope_percent,
            "seasonality_detected": seasonality_detected,
            "seasonal_period": model["period"],
            "seasonality_strength_percent": seasonality_strength_percent,
            "residual_rmse": model["rmse"],
            "backtest_mape": backtest["mape"],
            "backtest_mae": backtest["mae"],
            "backtest_periods": backtest["holdout_periods"],
            "confidence": confidence,
        },
        "history": history,
        "forecast": forecast_points,
        "highlights": highlights,
        "method": "Deterministic trend-and-seasonality forecasting. The model fits a least-squares linear trend and, when sufficient repeated history exists, an additive seasonal pattern. Forecast intervals are based on historical residual error.",
        "caveat": "Forecasts are estimates, not guarantees. Structural changes, promotions, supply constraints, market shocks, policy changes and other future events are not known to this model unless they already appear in the historical pattern.",
    }
