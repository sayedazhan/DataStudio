# Azhan Data Studio v3.3 - Data Quality Centre

## What changed

The Analyse Single File workspace now includes a redesigned Data Quality Centre that uses real diagnostics from the uploaded CSV/XLSX dataset.

### Overview
- Overall Data Quality score
- Total issue count
- Unique rows affected by missing/blank data, exact duplicates, or IQR outliers
- Columns with detected quality issues
- Issues by type
- Issues by column
- Prioritised review table
- Validation checklist
- Recommended next actions

### Drill-down views
- Missing Values - field-level missingness plus example affected rows
- Duplicates - exact duplicate count plus example duplicate records
- Inconsistent Data - case-only text variants and mixed date formats
- Value Outliers - 1.5 x IQR fences, examples, and affected-row preview
- Data Preview - source-record preview with a handoff to field inspection

### Workflow integration
- Continue to Explore takes the user directly to the existing visual exploration workspace.
- Open Clean My Data hands off to the existing conservative cleaning utility for optional fixes.
- The source upload is never silently changed from the Data Quality Centre.

## Detection rules

The feature is intentionally conservative:

- Missing values: nulls plus blank text cells.
- Duplicates: exact repeated rows.
- Inconsistent text: case-only variants such as `Melbourne` / `MELBOURNE`.
- Mixed dates: highly date-like text fields using inconsistent representations.
- Outliers: values outside Q1 - 1.5 x IQR or Q3 + 1.5 x IQR.

The engine does not infer semantic synonyms such as `VIC` and `Victoria` as equivalent without a business mapping rule.

## Files changed

- `backend/app/clean_data.py`
- `backend/app/main.py`
- `frontend/app/page.tsx`
- `frontend/app/globals.css`

## Validation completed

- Python backend source compiled successfully with `compileall`.
- Updated TSX parsed successfully with the TypeScript compiler.
- TypeScript semantic check completed with lightweight React declarations; only Node `process` globals require the project's normal `@types/node` dependency.
- A full Next.js build could not be run in the isolated build environment because npm package downloads were unavailable. The project package files were not changed.
