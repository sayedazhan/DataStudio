# Azhan Data Studio v4.1 - Branded Reporting & Dashboard Export

## Purpose
v4.1 refines the reporting layer introduced in earlier releases and the Auto Dashboard Builder from v4.0/v4.0.1. The goal is to make exported output suitable for sharing with managers, clients and stakeholders while keeping the existing deterministic analysis engine unchanged.

## Dashboard PDF
The Dashboard tab now exports a dedicated A4 report rather than printing the visible web page. The export includes:

- Azhan Data Studio branding and `azhandatastudio.com`
- dataset and worksheet context
- generated timestamp
- filtered record count and field count
- active dashboard filters
- up to four KPI cards
- trend and category contribution visuals
- comparison and distribution visuals
- heatmap when available
- deterministic dashboard observations
- top performers
- compact evidence sample
- methodology note and branded footer

The browser print dialog is still used as the final PDF writer. Choose **Save as PDF** when prompted.

## Analysis PDF options
The Reports tab now offers two report variants:

### Executive Summary PDF
A shorter management-oriented report containing:

- branded cover
- headline metrics
- executive summary
- dashboard snapshot
- top findings (limited to the leading findings)
- data quality summary

### Full Analysis PDF
A deeper report containing the executive material plus:

- larger visual summary
- more detailed data-quality content
- insight register
- methodology and analytical notes

## Branding
Both report types use the Azhan Data Studio identity:

- Azhan Data Studio
- Automated Data Intelligence
- `azhandatastudio.com`
- Created by Azhan Hassan
- consistent navy/blue report styling
- A4 print styling and page-safe sections

## Export filenames
The browser document title is temporarily changed before printing so Save as PDF receives a useful suggested filename, for example:

- `sales-data-dashboard-2026-09-24.pdf`
- `sales-data-executive-summary-2026-09-24.pdf`
- `sales-data-full-analysis-2026-09-24.pdf`

The exact final filename can still be changed by the user in the browser Save as PDF dialog.

## Analytics
GA4 tracking now distinguishes:

- `dashboard_export` with `format=branded_pdf`
- `report_export` with `report_type=executive_summary`
- `report_export` with `report_type=full_analysis`

No dataset values or filenames are intentionally sent in these events.

## Scope / unchanged behaviour
This release does not change:

- analysis calculations
- data-quality calculations
- dashboard generation logic
- backend APIs
- Stripe support configuration
- Search Console / SEO domain configuration

## Local QA checklist
Before production deployment:

1. Analyse a CSV dataset and an XLSX dataset.
2. Open Dashboard and apply at least one filter.
3. Export Dashboard PDF and verify cover, KPIs, charts, filters, observations, evidence and footer.
4. In Reports, export Executive Summary PDF.
5. Export Full Analysis PDF.
6. Check that charts are not split awkwardly across pages and tables remain inside A4 width.
7. Repeat once with a dataset that has no date field and once with a dataset that has missing values.
8. Run `npm run build` from `frontend` before pushing to GitHub.
