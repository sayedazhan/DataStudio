# Azhan Data Studio v4.0 — Auto Dashboard Builder

## Purpose
v4.0 adds an automatically generated interactive dashboard to **Analyse Single File**. The dashboard is built from the same deterministic field understanding already used by Data Studio; it does not require users to manually create charts or send the dataset to an LLM.

## Workspace flow
The single-file workspace is now:

**Overview → Data Quality → Dashboard → Insights → Explore → Reports → Fields**

The Overview screen also includes a **View Dashboard** action.

## Automatic dashboard generation
The backend now returns a `dashboard` object as part of `/api/datasets/inspect` and exposes `/api/datasets/dashboard` for dashboard refreshes.

The dashboard engine:
- identifies numeric measures and percentage-like measures
- identifies date/time fields
- identifies useful category fields
- chooses primary and secondary metrics
- chooses a time field when available
- chooses category fields for breakdown/comparison
- applies sensible `sum` vs `average` aggregation rules
- generates up to four KPI cards
- creates a trend series when a reliable time field exists
- creates category contribution and comparison views
- creates a numeric distribution
- creates a cross-section heatmap when two category fields are available
- ranks top performers
- generates deterministic dashboard observations
- returns up to 100 underlying records for the current filter state

## Interactive filters
Up to four detected category fields become dashboard filters. Selecting values and choosing **Apply filters** recalculates the dashboard on the backend using the original uploaded file still held by the browser session.

Filters update:
- KPI cards
- trends
- category breakdowns
- comparisons
- cross-section view
- dashboard observations
- top performers
- underlying records

The source file is not modified.

## Customize Dashboard
The **Customize Dashboard** modal allows users to choose:
- Primary KPI
- Secondary KPI
- Trend field
- Breakdown field
- Compare field
- Distribution metric

Changes are sent to the dashboard endpoint and the dashboard is regenerated from the uploaded dataset.

## Exports
The dashboard provides:
- **Export Filtered Data** — downloads the records behind the current filtered view as CSV
- **Export Dashboard** — opens the browser print flow so the user can save the dashboard as PDF

## GA4 events
v4.0 adds the following launch analytics events:
- `dashboard_open`
- `dashboard_customize_open`
- `dashboard_filter_apply`
- `dashboard_export`

Existing v3.7 analytics events remain unchanged.

## SEO
A new indexable feature guide is included:

`/features/excel-dashboard-generator`

The page targets search themes such as:
- Excel dashboard generator
- CSV dashboard generator
- automatic dashboard from Excel
- create dashboard from CSV
- interactive spreadsheet dashboard

The route is included in `sitemap.xml`, the Features hub and the homepage toolkit links.

## Files added/changed
### Backend
- `backend/app/dashboard.py` — automatic dashboard engine
- `backend/app/main.py` — dashboard generation in inspect response + dashboard refresh endpoint

### Frontend
- `frontend/app/page.tsx` — Dashboard workspace and interactions
- `frontend/app/globals.css` — dashboard responsive/print styling
- `frontend/app/components/google-analytics.tsx` — dashboard GA4 events
- `frontend/app/features/excel-dashboard-generator/page.tsx` — SEO feature page
- `frontend/app/features/page.tsx` — dashboard guide added to Features hub
- `frontend/app/sitemap.ts` — dashboard guide added to sitemap
- `frontend/package.json` / `package-lock.json` — version 4.0.0

## Validation performed in build environment
- all backend Python source files pass `py_compile`
- all 34 frontend TypeScript/TSX source files pass TypeScript syntax/transpile diagnostics
- full Next.js production build could not be completed in the build environment because npm package retrieval is unavailable
- runtime backend integration could not be executed in the build environment because Polars cannot be installed without package-network access

Before production deployment run locally:

```text
cd frontend
npm install
npm run build
```

Then run the frontend/backend together and test the Dashboard with at least:
- the bundled sample dataset
- one real CSV
- one XLSX with a selected sheet
- a dataset without a time field
- a dataset with only one category field
