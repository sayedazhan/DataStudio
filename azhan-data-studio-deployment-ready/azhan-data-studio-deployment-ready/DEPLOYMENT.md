# Azhan Data Studio - Production Deployment

Architecture:
- Frontend: Netlify (Next.js)
- Backend: Render (FastAPI + Polars)

## 1. Put this project on GitHub
Create a repository and upload the project root. Do not upload `.venv`, `node_modules`, `.next`, or `.env.local`.

## 2. Deploy backend on Render
Create a new Web Service from the GitHub repository.

Settings:
- Root Directory: `backend`
- Runtime: Python 3
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

The included `backend/.python-version` pins Python 3.13.

After deployment, copy the public backend URL, for example:
`https://azhan-data-studio-api.onrender.com`

Test:
- `/health`
- `/docs`

## 3. Deploy frontend on Netlify
Import the same GitHub repository into Netlify.
The included root `netlify.toml` points Netlify at the `frontend` directory.

Add this Netlify environment variable before the production build:
- `NEXT_PUBLIC_API_URL` = your Render backend URL, without a trailing slash

Deploy the site and copy the Netlify production URL.

## 4. Allow the Netlify site in backend CORS
On Render, add environment variable:
- `CORS_ORIGINS` = your Netlify production origin, e.g. `https://azhan-data-studio.netlify.app`

If you later add a custom domain, use comma-separated origins, e.g.:
`https://azhandatastudio.com,https://azhan-data-studio.netlify.app`

Redeploy/restart the Render service after changing the environment variable.

## 5. Final test
On the public Netlify URL test:
- CSV upload
- XLSX upload
- Multi-sheet workbook selection
- Re-analyse
- Overview / Insights / Explore / Reports / Data Quality / Fields
- Print / Save PDF
- Download insights CSV
- Home logo navigation

## Notes
Uploaded datasets are sent directly from the browser to the FastAPI backend for analysis. They are not stored by the application code after the request finishes.
