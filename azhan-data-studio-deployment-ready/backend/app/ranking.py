from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any


WEIGHTS = {
    "impact": 0.30,
    "confidence": 0.25,
    "unusualness": 0.20,
    "coverage": 0.15,
    "relevance": 0.10,
}

ROLE_RELEVANCE = {
    "measure": 95.0,
    "percentage": 95.0,
    "time": 90.0,
    "category": 82.0,
    "boolean": 72.0,
    "identifier": 68.0,
    "text": 65.0,
    "other": 60.0,
}

TYPE_RELEVANCE = {
    "trend": 92.0,
    "correlation": 80.0,
    "group_difference": 90.0,
    "anomaly": 88.0,
    "data_quality": 91.0,
    "concentration": 74.0,
    "distribution": 76.0,
    "volatility": 82.0,
    "rare_category": 68.0,
    "outcome_difference": 94.0,
    "top_performer": 88.0,
    "contribution": 88.0,
}


# Stage 4 intentionally keeps ranking transparent and deterministic.
# AI interpretation can consume these ranked findings later, but it does not
# calculate the scores.


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _number_from_text(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        number = float(value)
        return number if math.isfinite(number) else None

    text = str(value).strip().replace(",", "")
    if not text or text == "—":
        return None
    match = re.search(r"[-+]?\d*\.?\d+", text)
    if not match:
        return None
    try:
        number = float(match.group(0))
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def _evidence_text(finding: dict[str, Any], label: str) -> str | None:
    target = label.casefold()
    for item in finding.get("evidence") or []:
        if str(item.get("label", "")).casefold() == target:
            return str(item.get("value", ""))
    return None


def _evidence_number(finding: dict[str, Any], label: str) -> float | None:
    return _number_from_text(_evidence_text(finding, label))


def _schema_map(schema: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(field.get("name")): field for field in schema}


def _field_completeness(
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> float:
    fields = finding.get("fields") or []
    if not fields:
        return 100.0
    completeness: list[float] = []
    for field_name in fields:
        field = schema_by_name.get(str(field_name))
        if not field:
            continue
        missing = float(field.get("missing_percent") or 0.0)
        completeness.append(_clamp(100.0 - missing))
    return min(completeness) if completeness else 100.0


def _affected_share(finding: dict[str, Any]) -> float | None:
    finding_type = finding.get("type")
    if finding_type == "anomaly":
        return _evidence_number(finding, "Share of observations")
    if finding_type == "data_quality":
        return (
            _evidence_number(finding, "Missing share")
            or _evidence_number(finding, "Share of records")
        )
    if finding_type == "concentration":
        return _evidence_number(finding, "Share")
    if finding_type == "rare_category":
        return _evidence_number(finding, "Combined share")
    if finding_type == "contribution":
        return _evidence_number(finding, "Top 3 share")
    return None


def _impact_score(finding: dict[str, Any]) -> float:
    finding_type = finding.get("type")
    signal = float(finding.get("signal_strength") or 0.0)

    if finding_type == "trend":
        change = abs(_evidence_number(finding, "Change") or 0.0)
        correlation = abs(_evidence_number(finding, "Time correlation") or 0.0)
        return _clamp(change * 2.2 + correlation * 45.0)

    if finding_type == "correlation":
        correlation = abs(_evidence_number(finding, "Correlation") or 0.0)
        return _clamp(correlation * 100.0)

    if finding_type == "group_difference":
        relative = abs(_evidence_number(finding, "Relative difference") or 0.0)
        effect = abs(_evidence_number(finding, "Standardised effect") or 0.0)
        return _clamp(relative * 1.55 + effect * 34.0)

    if finding_type == "anomaly":
        share = _evidence_number(finding, "Share of observations") or 0.0
        distance = _evidence_number(finding, "Extreme distance") or 0.0
        return _clamp(34.0 + distance * 10.0 + min(share, 12.0) * 2.4)

    if finding_type == "data_quality":
        share = _affected_share(finding) or 0.0
        return _clamp(24.0 + share * 3.4)

    if finding_type == "concentration":
        share = _evidence_number(finding, "Share") or 0.0
        return _clamp(share * 1.18)

    if finding_type == "distribution":
        skew = abs(_evidence_number(finding, "Skewness") or 0.0)
        return _clamp(40.0 + skew * 22.0)

    if finding_type == "volatility":
        cv = abs(_evidence_number(finding, "Coefficient of variation") or 0.0)
        return _clamp(35.0 + cv * 0.8)

    if finding_type == "rare_category":
        rare_count = _evidence_number(finding, "Rare categories") or 0.0
        return _clamp(35.0 + rare_count * 7.0)

    if finding_type == "outcome_difference":
        gap = abs(_evidence_number(finding, "Rate gap") or 0.0)
        return _clamp(gap * 1.55)

    if finding_type == "top_performer":
        lead = abs(_evidence_number(finding, "Lead") or 0.0)
        return _clamp(lead * 2.0)

    if finding_type == "contribution":
        top3 = _evidence_number(finding, "Top 3 share") or 0.0
        return _clamp(top3 * 1.12)

    return _clamp(signal)


def _unusualness_score(finding: dict[str, Any]) -> float:
    finding_type = finding.get("type")
    signal = float(finding.get("signal_strength") or 0.0)

    if finding_type == "trend":
        change = abs(_evidence_number(finding, "Change") or 0.0)
        correlation = abs(_evidence_number(finding, "Time correlation") or 0.0)
        return _clamp(change * 2.0 + max(0.0, correlation - 0.40) * 70.0)

    if finding_type == "correlation":
        correlation = abs(_evidence_number(finding, "Correlation") or 0.0)
        return _clamp(max(0.0, correlation - 0.50) * 180.0)

    if finding_type == "group_difference":
        relative = abs(_evidence_number(finding, "Relative difference") or 0.0)
        effect = abs(_evidence_number(finding, "Standardised effect") or 0.0)
        return _clamp(effect * 62.0 + relative * 0.55)

    if finding_type == "anomaly":
        share = _evidence_number(finding, "Share of observations") or 0.0
        distance = _evidence_number(finding, "Extreme distance") or 0.0
        return _clamp(50.0 + distance * 8.5 + min(share, 10.0) * 1.7)

    if finding_type == "data_quality":
        share = _affected_share(finding) or 0.0
        return _clamp(22.0 + share * 3.8)

    if finding_type == "concentration":
        share = _evidence_number(finding, "Share") or 0.0
        categories = max(2.0, _evidence_number(finding, "Distinct categories") or 2.0)
        expected = 100.0 / categories
        return _clamp(34.0 + max(0.0, share - expected) * 2.1)

    if finding_type == "distribution":
        skew = abs(_evidence_number(finding, "Skewness") or 0.0)
        return _clamp(38.0 + skew * 25.0)

    if finding_type == "volatility":
        cv = abs(_evidence_number(finding, "Coefficient of variation") or 0.0)
        return _clamp(35.0 + cv * 0.72)

    if finding_type == "rare_category":
        rare_count = _evidence_number(finding, "Rare categories") or 0.0
        smallest = _evidence_number(finding, "Smallest share") or 2.0
        return _clamp(45.0 + rare_count * 5.0 + max(0.0, 2.0 - smallest) * 10.0)

    if finding_type == "outcome_difference":
        gap = abs(_evidence_number(finding, "Rate gap") or 0.0)
        return _clamp(30.0 + gap * 1.15)

    if finding_type == "top_performer":
        lead = abs(_evidence_number(finding, "Lead") or 0.0)
        return _clamp(35.0 + lead * 1.5)

    if finding_type == "contribution":
        top = _evidence_number(finding, "Top share") or 0.0
        top3 = _evidence_number(finding, "Top 3 share") or 0.0
        return _clamp(25.0 + top * 0.7 + max(0.0, top3 - 50.0) * 0.8)

    return _clamp(signal * 0.85)


def _coverage_score(
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
    row_count: int,
) -> float:
    finding_type = finding.get("type")
    completeness = _field_completeness(finding, schema_by_name)

    if finding_type == "correlation":
        paired = _evidence_number(finding, "Paired observations")
        if paired is not None and row_count > 0:
            return _clamp(paired / row_count * 100.0)

    if finding_type == "group_difference":
        group_records = _evidence_number(finding, "Group records")
        if group_records is not None and row_count > 0:
            share = group_records / row_count * 100.0
            # A subgroup can be meaningful without covering the whole dataset,
            # so coverage is softened rather than equated directly to share.
            return _clamp(20.0 + share * 1.55)

    if finding_type == "anomaly":
        share = _evidence_number(finding, "Share of observations") or 0.0
        return _clamp(10.0 + share * 4.0)

    if finding_type == "data_quality":
        share = _affected_share(finding) or 0.0
        return _clamp(max(5.0, share))

    if finding_type == "concentration":
        share = _evidence_number(finding, "Share") or 0.0
        return _clamp(share)

    if finding_type == "trend":
        return completeness

    if finding_type == "outcome_difference":
        observations = _evidence_number(finding, "Observations")
        if observations is not None and row_count > 0:
            return _clamp(observations / row_count * 100.0)

    if finding_type == "top_performer":
        records = _evidence_number(finding, "Top group records")
        if records is not None and row_count > 0:
            return _clamp(25.0 + (records / row_count * 100.0) * 1.4)

    if finding_type == "rare_category":
        share = _evidence_number(finding, "Combined share") or 0.0
        return _clamp(12.0 + share * 4.0)

    if finding_type == "contribution":
        share = _evidence_number(finding, "Top 3 share") or 0.0
        return _clamp(share)

    return completeness


def _relevance_score(
    finding: dict[str, Any],
    schema_by_name: dict[str, dict[str, Any]],
) -> float:
    finding_type = str(finding.get("type") or "")
    type_score = TYPE_RELEVANCE.get(finding_type, 70.0)
    roles: list[float] = []
    for field_name in finding.get("fields") or []:
        field = schema_by_name.get(str(field_name))
        if not field:
            continue
        role = str(field.get("semantic_role") or "other")
        roles.append(ROLE_RELEVANCE.get(role, 60.0))

    role_score = sum(roles) / len(roles) if roles else 76.0
    return _clamp(type_score * 0.70 + role_score * 0.30)


def _priority(score: float) -> str:
    if score >= 85:
        return "critical"
    if score >= 70:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _priority_rank(priority: str) -> int:
    return {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(priority, 0)


def _ranking_reason(components: dict[str, float]) -> str:
    labels = {
        "impact": "impact",
        "confidence": "confidence",
        "unusualness": "unusualness",
        "coverage": "coverage",
        "relevance": "relevance",
    }
    ordered = sorted(components.items(), key=lambda item: item[1] * WEIGHTS[item[0]], reverse=True)
    first = labels[ordered[0][0]]
    second = labels[ordered[1][0]]
    return f"Ranks strongly on {first} and {second}."


def _apply_rule_override(
    finding: dict[str, Any],
    score: float,
    priority: str,
) -> tuple[str, str | None]:
    if finding.get("type") != "data_quality":
        return priority, None

    share = _affected_share(finding) or 0.0
    if share >= 50 and _priority_rank(priority) < _priority_rank("critical"):
        return "critical", "Rule override: at least half of the affected data is impacted."
    if share >= 25 and _priority_rank(priority) < _priority_rank("high"):
        return "high", "Rule override: at least one quarter of the affected data is impacted."
    return priority, None


def rank_findings(
    findings: list[dict[str, Any]],
    schema: list[dict[str, Any]],
    row_count: int,
) -> dict[str, Any]:
    schema_by_name = _schema_map(schema)
    ranked: list[dict[str, Any]] = []

    for finding in findings:
        impact = _impact_score(finding)
        confidence = _clamp(float(finding.get("confidence") or 0.0))
        unusualness = _unusualness_score(finding)
        coverage = _coverage_score(finding, schema_by_name, row_count)
        relevance = _relevance_score(finding, schema_by_name)

        components = {
            "impact": round(impact, 1),
            "confidence": round(confidence, 1),
            "unusualness": round(unusualness, 1),
            "coverage": round(coverage, 1),
            "relevance": round(relevance, 1),
        }

        score = round(
            sum(components[key] * WEIGHTS[key] for key in WEIGHTS),
            1,
        )
        priority = _priority(score)
        priority, override_reason = _apply_rule_override(finding, score, priority)

        ranked_finding = dict(finding)
        ranked_finding["insight_score"] = score
        ranked_finding["priority"] = priority
        ranked_finding["ranking"] = {
            "impact": components["impact"],
            "confidence": components["confidence"],
            "unusualness": components["unusualness"],
            "coverage": components["coverage"],
            "relevance": components["relevance"],
            "reason": _ranking_reason(components),
            "override_reason": override_reason,
        }
        ranked.append(ranked_finding)

    ranked.sort(
        key=lambda item: (
            _priority_rank(str(item.get("priority"))),
            float(item.get("insight_score") or 0.0),
            float(item.get("confidence") or 0.0),
        ),
        reverse=True,
    )

    priority_counts = Counter(str(item.get("priority")) for item in ranked)
    top_findings = ranked[:5]

    return {
        "weights": {key: int(value * 100) for key, value in WEIGHTS.items()},
        "priority_counts": dict(priority_counts),
        "top_findings": top_findings,
        "ranked_findings": ranked,
        "method": "Insight Score = Impact 30% + Confidence 25% + Unusualness 20% + Coverage 15% + Relevance 10%",
        "note": (
            "Stage 4 ranking is deterministic and evidence-based. Scores prioritise findings; "
            "they do not prove causation or business importance without context."
        ),
    }
