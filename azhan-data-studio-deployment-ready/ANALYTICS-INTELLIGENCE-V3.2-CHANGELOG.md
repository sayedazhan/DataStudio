# Azhan Data Studio v3.2 - Executive PDF Reporting

## Added
- One-click **Generate Executive PDF** action inside Monthly Intelligence.
- Dedicated Monthly Executive report built on the existing browser print/PDF framework.
- Executive summary with current-period movement and historical context.
- Previous/current KPI, per-record performance, record-volume and movement table.
- Historical benchmark block with average, rank context, best/worst period and volatility.
- Printable KPI trend visual across the full reporting history.
- Configured KPI alert status plus active management signals.
- Deterministic insight register for executive review.
- Movement-driver table for the selected business dimension.
- Data Quality summary including completeness, duplicates, invalid dates, schema warnings, missingness and newly detected values.
- Source register listing the files, reporting periods, row counts and column counts used in the report.
- Executive-report methodology and decision caveat.

## Reporting workflow
1. Build or refresh Monthly Intelligence.
2. Select **Generate Executive PDF**.
3. The browser opens the branded print view.
4. Choose **Save as PDF** to create the management-ready file.

## Deployment impact
- No new frontend dependency.
- No new backend endpoint.
- No external PDF service.
- No LLM or AI API.
- Existing Netlify + Railway architecture is unchanged.

## Preserved
- v3.1 KPI alerts and period comparison.
- Browser-persistent monthly library and duplicate-file protection.
- Deterministic insights and movement drivers.
- Data Quality Centre.
- Analyse Single File, Compare, Forecast, Scenario, and Statistics modes.
