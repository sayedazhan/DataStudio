# Azhan Data Studio

**Automated Data Intelligence**

Azhan Data Studio is a deterministic data-intelligence web product created by **Azhan Hassan — Data & AI Automation Specialist**.

Portfolio: https://syedazhan.netlify.app/

## What it does

Upload a CSV or XLSX dataset and the application will:

- inspect and profile the dataset
- infer analytical roles for fields
- discover statistical patterns and anomalies
- rank findings by importance
- generate a varied visual-discovery gallery
- assess data quality
- produce a branded analytical report
- export ranked insights to CSV

The analytical calculations do **not** use an AI assistant or LLM interpretation.

## Local architecture

- Frontend: Next.js / React / TypeScript
- Backend: Python / FastAPI / Polars

## First-time setup on Windows

Run:

```text
setup-windows.bat
```

Then open two terminals and run:

```text
run-backend.bat
```

and:

```text
run-frontend.bat
```

Open http://localhost:3000.

## Reports

The Reports workspace provides:

- Print / Save PDF
- Download insights CSV

The report carries the Azhan Data Studio product identity, creator attribution, and portfolio reference. Print-specific styling removes internal scrollbars and constrains charts/tables to report-safe dimensions.

## Production deployment
See `DEPLOYMENT.md` for the Netlify + Render deployment steps.
