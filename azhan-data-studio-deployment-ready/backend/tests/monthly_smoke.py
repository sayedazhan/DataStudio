"""Run after backend dependencies are installed: python tests/monthly_smoke.py"""
from pathlib import Path
import sys

import polars as pl

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.monthly import SourceFrame, analyse_monthly, prepare_monthly  # noqa: E402

files = [
    ROOT / "sample-data" / "monthly-sales-2026-06.csv",
    ROOT / "sample-data" / "monthly-sales-2026-07.csv",
    ROOT / "sample-data" / "monthly-sales-2026-08.csv",
]
sources = [SourceFrame(path.name, pl.read_csv(path, try_parse_dates=True)) for path in files]
prepared = prepare_monthly(sources)
assert prepared["ready"] is True
assert prepared["period_count"] == 3
assert prepared["recommended_date"] == "Date"
assert any(item["field"] == "Revenue" for item in prepared["metric_candidates"])

result = analyse_monthly(
    sources,
    metric="Revenue",
    aggregation="sum",
    date_field="Date",
    dimension="Region",
    previous_period="2026-07",
    current_period="2026-08",
    alert_threshold_percent=20,
    alert_direction="increase",
    target_value=75_000,
    target_condition="minimum",
)
assert round(result["comparison"]["previous_value"], 2) == 64900.00
assert round(result["comparison"]["current_value"], 2) == 81300.00
assert any(item["field"] == "Region" and item["value"] == "QLD" for item in result["quality"]["new_values"])
assert result["alerts"]["status"] == "Alert"
assert any(item["type"] == "kpi_movement" for item in result["alerts"]["items"])
assert result["benchmark"]["current_rank"] == 1
assert result["comparison"]["per_record_change_percent"] < 0
print("Monthly Intelligence v3.1 smoke test passed.")
