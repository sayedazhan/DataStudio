# Azhan Data Studio

**Automated Data Intelligence**

Azhan Data Studio is a deterministic data-analysis and decision-intelligence web product created by **Azhan Hassan - Data & AI Automation Specialist**.

Portfolio: https://syedazhan.netlify.app/

## Current product modes

### 1. Analyse Single File
Upload CSV/XLSX data to profile the dataset, infer field roles, discover and rank statistical findings, explore visualisations, inspect data quality, and generate report-ready output.

### 2. Monthly Intelligence (v3.2)
Build a persistent browser-side library of monthly CSV/XLSX files, automatically detect reporting periods, validate schema consistency, track KPI movement, configure in-app KPI alert rules, compare per-record performance, benchmark the current period against history, surface deterministic insights, inspect the Data Quality Centre, and generate a management-ready Executive PDF report.

### 3. Compare Datasets
Upload a Previous/Baseline dataset and a Current/New dataset, select a comparison key, and identify:
- added, removed, modified, and unchanged records
- schema changes
- metric movement
- record-level before/after evidence
- Explain Change v2 ranked drivers and offsets

### 4. Forecast
Upload a time-based CSV/XLSX dataset, choose a date field and numeric metric, select aggregation/time grain/horizon, and generate:
- historical trend
- seasonal diagnostics
- deterministic forecast
- approximately 95% model range
- backtest MAPE and MAE
- forecast CSV export


### 5. Scenario / What-If
Upload CSV/XLSX business data, choose one or two numeric measures, define a calculation, and model user-controlled Base, Upside, and Downside cases. Scenario v1 includes:
- single-metric, difference, ratio, product, and margin-percentage formulas
- independent aggregation choice for Metric A and Metric B
- percentage assumptions for Upside and Downside cases
- driver sensitivity and interaction effect
- optional category/region/product breakdown
- scenario CSV export
- deterministic calculations with no AI-generated scenario values


### 6. Statistics
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
- browser-persistent monthly file library with exact duplicate-file protection
- reporting-period detection, stronger period comparison, historical benchmarking, and configurable in-app KPI alerts
- advanced Data Quality Centre checks
- deterministic analytics (no LLM used for calculations)
- branded Print / Save PDF reports across all six tools, including the Monthly Executive report
- ranked insights CSV export
- consistent one-time Stripe support checkout, centralised in `frontend/app/lib/config.ts`

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
Monthly Intelligence: http://localhost:3000/monthly
Compare: http://localhost:3000/compare
Forecast: http://localhost:3000/forecast
Scenario: http://localhost:3000/scenario
Statistics: http://localhost:3000/statistics

You can also use `setup-windows.bat`, `run-backend.bat`, and `run-frontend.bat`.

## Production deployment
See `DEPLOYMENT.md`.

## Clean My Data (v1)
A new `/clean` utility scans CSV/XLSX datasets for common data-quality issues and can export a cleaned copy. It supports exact duplicate removal, blank-row removal, whitespace trimming, empty-string normalization, snake_case header cleanup, conservative date normalization, optional case-only text standardisation, and CSV/XLSX output.

### Clean My Data v1.0.2
- Fixed XLSX workbook metadata parsing for `/api/datasets/workbook` response shape (`{ workbook: ... }`).
- Added defensive sheet-array validation to avoid runtime crashes if workbook metadata is malformed.

## SEO foundation (v3.4)

The frontend now includes canonical metadata, Open Graph/Twitter sharing metadata, JSON-LD structured data, a generated sitemap, robots rules and route-specific metadata for the public analysis tools. See `SEO-FOUNDATION-V3.4.md` for production configuration and Search Console steps.
## SEO content & support checkout (v3.5)

The SEO foundation now includes four indexable, internally linked feature pages:
- `/features/csv-excel-analysis`
- `/features/data-quality-checker`
- `/features/compare-excel-files`
- `/features/data-forecasting`

All Support buttons now use one canonical Stripe Payment Link defined in `frontend/app/lib/config.ts`, avoiding different or stale checkout links across pages. See `SEO-CONTENT-STRIPE-V3.5.md`.


## Stripe support link (v3.5.2)
The confirmed Azhan Data Studio Stripe support link is now configured centrally in `frontend/app/lib/config.ts` and in the environment examples:
`https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00`

## Launch readiness + SEO (v3.6)

v3.6 prepares the public product for deployment with:
- Privacy & Data Handling and Terms & Disclaimer pages
- Try Sample Data on the main analysis landing page
- friendlier analysis-service connection errors
- basic public API request limiting
- a crawlable `/features` hub and stronger internal linking
- updated sitemap/robots/canonical/social metadata coverage
- visible homepage and feature FAQs
- current structured data (`WebSite`, `SoftwareApplication`, `WebPage`, `BreadcrumbList`) rather than discontinued Google FAQ rich-result markup
- custom 404/error experiences and baseline security headers

See `LAUNCH-READINESS-SEO-V3.6.md` for the production checklist.

## Domain-ready release (v3.6.1)

v3.6.1 sets `https://azhandatastudio.com` as the production SEO/canonical domain and prepares the existing GitHub/Netlify deployment for custom-domain cutover. See `DOMAIN-READY-V3.6.1.md`.
