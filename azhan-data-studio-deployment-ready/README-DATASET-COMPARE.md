# Azhan Data Studio - Dataset Compare v1.1

Dataset Compare adds a second deterministic analysis workflow to Azhan Data Studio.

## What v1.1 does

1. Upload a Previous / Baseline CSV or XLSX file.
2. Upload a Current / New CSV or XLSX file.
3. For XLSX workbooks, select the sheet for each file.
4. Prepare the comparison to detect shared columns and suitable unique keys.
5. Choose a unique, non-missing comparison key.
6. Compare the two versions.

Results include:
- added, removed, modified and unchanged record counts
- row-count and key-match changes
- deterministic comparison highlights
- visual record-movement profile
- visual ranking of the largest numeric metric movements
- numeric metric movement (totals and means)
- added / removed columns and data-type changes
- record-level before / after evidence for modified rows
- previews of added and removed rows
- Explain Change: deterministic arithmetic decomposition of metric movement by a suitable shared categorical dimension

Explain Change describes arithmetic drivers, not causal relationships.

## Navigation update

The product now has a prominent analysis-mode switch immediately below the header:
- Analyse Single File
- Compare Datasets

This makes Dataset Compare a first-class Azhan Data Studio tool rather than a small secondary header button.

## Support / Stripe

Support is now visible in the header, landing page, post-analysis areas and Dataset Compare results.

Set this frontend environment variable to activate Stripe checkout:

`NEXT_PUBLIC_SUPPORT_URL=https://buy.stripe.com/your-payment-link`

If the variable is not set, the Support UI remains visible but shows that the Stripe support link is coming soon. No feature is locked behind payment.

## Limits in v1.1

- CSV and XLSX only
- 20 MB per comparison file
- one comparison key field
- the key must be unique and non-missing in both datasets
- preview tables are intentionally capped, while total counts are calculated across the full uploaded datasets
- Explain Change uses shared categorical dimensions with manageable cardinality and is an arithmetic decomposition rather than causal inference

Composite keys and downloadable comparison reports are planned follow-on features.

## Backend

Module:
- `backend/app/compare.py`

Endpoints:
- `POST /api/datasets/compare/prepare`
- `POST /api/datasets/compare`

No second Railway service is required. These endpoints run inside the existing FastAPI service.

## Frontend

Routes:
- `/` - Analyse Single File
- `/compare` - Compare Datasets

## Quick test

Two sample files are included:
- `sample-data/compare-baseline.csv`
- `sample-data/compare-current.csv`

Use `OrderID` as the comparison key.

Expected core result:
- Added: 1
- Removed: 1
- Modified: 3
- Unchanged: 2
- Added field: Channel

With v1.1 you should also see Record Movement, Metric Movement and Explain Change panels.
