AZHAN DATA STUDIO - FINAL CONSOLIDATED PROJECT
=============================================

This is the clean consolidated project package.
Do not merge it with older update folders. Replace the old project folder with this one.

Included product capabilities:
- Analyse Single File
- CSV and XLSX upload
- Multi-sheet Excel selection
- Dataset profiling and semantic field roles
- Ranked deterministic insights
- Visual discovery
- Data quality and field profiling
- Report / Print to PDF and Insights CSV export
- Monthly Intelligence v3.2 - browser-persistent monthly library, configurable KPI alerts, stronger period comparison, historical benchmarking, automatic insights, Data Quality Centre, Executive PDF Reporting
- Compare Datasets
- Explain Change v2
- Forecast Studio v1
- Scenario Studio v1 / What-If Analysis
- Statistics Studio v1 / Statistical Validation
- Optional Stripe Support buttons via NEXT_PUBLIC_SUPPORT_URL

Project structure:
- backend/   FastAPI + Polars
- frontend/  Next.js + React + TypeScript
- sample-data/ test datasets

Local URLs:
- Frontend: http://localhost:3000
- Backend docs: http://127.0.0.1:8000/docs
- Monthly Intelligence: http://localhost:3000/monthly
- Compare: http://localhost:3000/compare
- Forecast: http://localhost:3000/forecast
- Scenario: http://localhost:3000/scenario
- Statistics: http://localhost:3000/statistics

Production architecture:
- Frontend: Netlify
- Backend: Railway

Important:
- Do not upload frontend/node_modules
- Do not upload frontend/.next
- Do not upload frontend/.env.local
- Do not upload backend/.venv

CURRENT UI BASELINE
-------------------
Unified Dashboard Experience v2
- Analyse dashboard briefing
- Compare dashboard + What this means
- Forecast dashboard + What this means
- Scenario dashboard + What this means
- Statistics dashboard with plain-English evidence
- Shared KPI, panel, spacing and typography system across all six tools

PDF REPORTS V3.2
----------------
Branded PDF-ready reporting is available across Analyse, Monthly Intelligence, Compare, Forecast, Scenario and Statistics. Monthly Intelligence now generates a dedicated management report containing executive summary, KPI comparison, historical trend, alerts, movement drivers, data quality and a source register. Reports are rendered with the browser print engine; choose Save as PDF when prompted.
