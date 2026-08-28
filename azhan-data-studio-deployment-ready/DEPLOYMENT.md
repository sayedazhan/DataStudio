# Azhan Data Studio - Production Deployment

Current production architecture:
- Frontend: Netlify (Next.js)
- Backend: Railway (FastAPI + Polars)

All product modes use the same frontend and the same Railway backend. No second backend service is required for Compare, Explain Change, Forecast, or Scenario.

## Railway backend

If the GitHub repository contains this project at `azhan-data-studio-deployment-ready`, use:

- Root Directory: `/azhan-data-studio-deployment-ready/backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Environment variable:

`CORS_ORIGINS=https://azhandatastudio.netlify.app`

The included `.python-version` pins Python 3.13.

After deployment verify:
- `/health`
- `/docs`
- `/api/datasets/compare/prepare`
- `/api/datasets/compare`
- `/api/datasets/forecast/prepare`
- `/api/datasets/forecast`
- `/api/datasets/scenario/prepare`
- `/api/datasets/scenario`

## Netlify frontend

Keep:
- `NEXT_PUBLIC_API_URL` = Railway public backend URL, no trailing slash
- `NEXT_PUBLIC_SUPPORT_URL` = Stripe Payment Link when support is enabled

The included `netlify.toml` builds the Next.js app from `frontend`.

Production pages:
- `/` Analyse Single File
- `/compare` Compare Datasets + Explain Change v2
- `/forecast` Forecast Studio v1
- `/scenario` Scenario Studio v1

## Production regression test

1. Analyse one CSV and one XLSX file.
2. Verify multi-sheet workbook selection.
3. Verify Overview, Insights, Explore, Reports, Data Quality, and Fields.
4. Verify Print / Save PDF and Download Insights CSV.
5. Compare `sample-data/compare-baseline.csv` vs `sample-data/compare-current.csv` using `OrderID`.
6. Verify Explain Change v2 renders ranked driver evidence.
7. Forecast `sample-data/forecast-monthly-sample.csv` using `Month` + `Revenue` with a 6-period horizon.
8. Run `sample-data/scenario-business-sample.csv` with Revenue − Cost, Upside Revenue +10% / Cost +5%, Downside Revenue -10% / Cost 0%, and Region breakdown.
9. Verify Stripe Support opens the configured Payment Link if `NEXT_PUBLIC_SUPPORT_URL` is set.

## Data handling
Uploaded datasets are processed by the FastAPI backend for the request. The application code does not persist uploaded files after request processing.
