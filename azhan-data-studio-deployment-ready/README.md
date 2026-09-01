# Azhan Data Studio

**Automated Data Intelligence**

Azhan Data Studio is a deterministic data-analysis and decision-intelligence web product created by **Azhan Hassan - Data & AI Automation Specialist**.

Portfolio: https://syedazhan.netlify.app/

## Current product modes

### 1. Analyse Single File
Upload CSV/XLSX data to profile the dataset, infer field roles, discover and rank statistical findings, explore visualisations, inspect data quality, and generate report-ready output.

### 2. Compare Datasets
Upload a Previous/Baseline dataset and a Current/New dataset, select a comparison key, and identify:
- added, removed, modified, and unchanged records
- schema changes
- metric movement
- record-level before/after evidence
- Explain Change v2 ranked drivers and offsets

### 3. Forecast
Upload a time-based CSV/XLSX dataset, choose a date field and numeric metric, select aggregation/time grain/horizon, and generate:
- historical trend
- seasonal diagnostics
- deterministic forecast
- approximately 95% model range
- backtest MAPE and MAE
- forecast CSV export


### 4. Scenario / What-If
Upload CSV/XLSX business data, choose one or two numeric measures, define a calculation, and model user-controlled Base, Upside, and Downside cases. Scenario v1 includes:
- single-metric, difference, ratio, product, and margin-percentage formulas
- independent aggregation choice for Metric A and Metric B
- percentage assumptions for Upside and Downside cases
- driver sensitivity and interaction effect
- optional category/region/product breakdown
- scenario CSV export
- deterministic calculations with no AI-generated scenario values


### 5. Statistics
Upload CSV/XLSX data and validate analytical patterns with transparent statistical evidence:
- descriptive statistics and confidence intervals
- Pearson and Spearman correlation
- Welch two-sample t-test for two-group comparisons
- one-way ANOVA for three or more groups
- effect sizes (Cohen's d / eta squared)
- chi-square test of independence and Cramer's V
- plain-English interpretation with methodology and caveats

## Additional capabilities
- CSV and XLSX support
- multi-sheet Excel support
- deterministic analytics (no LLM used for calculations)
- report Print / Save PDF
- ranked insights CSV export
- optional Stripe support link via `NEXT_PUBLIC_SUPPORT_URL`

## Architecture
- Frontend: Next.js / React / TypeScript
- Backend: Python / FastAPI / Polars
- Production frontend: Netlify
- Production backend: Railway

## Local setup on Windows

### Backend
From `backend`:

```text
py -3.13 -m pip install --user -r requirements.txt
py -3.13 -m uvicorn app.main:app --reload
```

Backend docs: http://127.0.0.1:8000/docs

### Frontend
From `frontend`:

```text
npm install
npm run dev
```

Before starting the frontend, create `.env.local` from `.env.local.example`.

Frontend: http://localhost:3000
Compare: http://localhost:3000/compare
Forecast: http://localhost:3000/forecast
Scenario: http://localhost:3000/scenario
Statistics: http://localhost:3000/statistics

You can also use `setup-windows.bat`, `run-backend.bat`, and `run-frontend.bat`.

## Production deployment
See `DEPLOYMENT.md`.
