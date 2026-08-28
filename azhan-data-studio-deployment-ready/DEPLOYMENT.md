# Azhan Data Studio - Production Deployment

Current architecture:
- Frontend: Netlify (Next.js)
- Backend: Railway (FastAPI + Polars)

Dataset Compare v1.1 uses the same frontend and the same Railway backend. No second backend service or additional engine is required.

## Railway backend

Use the existing DataStudio Railway service.

If the GitHub repository contains the project inside `azhan-data-studio-deployment-ready`, use:
- Root Directory: `/azhan-data-studio-deployment-ready/backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

The included `.python-version` pins Python 3.13.

Keep this environment variable:
- `CORS_ORIGINS=https://azhandatastudio.netlify.app`

If you later use a custom domain, add it as a comma-separated origin.

After deployment, verify:
- `/health`
- `/docs`
- `/api/datasets/compare/prepare` appears in the API docs
- `/api/datasets/compare` appears in the API docs

## Netlify frontend

Keep:
- `NEXT_PUBLIC_API_URL` = the Railway public backend URL, with no trailing slash
- `NEXT_PUBLIC_SUPPORT_URL` = the Stripe Payment Link, if/when support is enabled

The new Dataset Compare page is available at:
- `/compare`

If Netlify is connected to GitHub, push the updated project and let Netlify rebuild. If using a manual deploy, deploy the updated frontend build/project using your existing workflow.

## Production test checklist

Single-dataset workflow:
- CSV upload
- XLSX upload
- multi-sheet workbook selection
- Overview / Insights / Explore / Reports / Data Quality / Fields
- Print / Save PDF
- Download Insights CSV

Dataset Compare:
- open `/compare`
- upload `sample-data/compare-baseline.csv`
- upload `sample-data/compare-current.csv`
- Prepare comparison
- confirm `OrderID` is recommended
- Compare datasets
- verify added = 1, removed = 1 and modified records are shown
- verify `Channel` is reported as an added field

## Data handling

Uploaded datasets are sent from the browser to the FastAPI backend for processing. The application code does not save the uploaded files after the request finishes.
