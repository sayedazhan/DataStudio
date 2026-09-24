# Azhan Data Studio - Production Deployment

Current production architecture:
- Frontend: Netlify (Next.js)
- Backend: Railway (FastAPI + Polars)

All product modes use the same frontend and Railway backend.

## Railway backend

Use the `backend` folder as the service root.

Build command:
`pip install -r requirements.txt`

Start command:
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Environment variables:
- `CORS_ORIGINS=https://azhandatastudio.com,https://www.azhandatastudio.com,https://azhandatastudio.netlify.app`
- `RATE_LIMIT_REQUESTS=120`
- `RATE_LIMIT_WINDOW_SECONDS=600`

The included `.python-version` pins the production runtime expected by the project.

After deployment verify:
- `/health`
- `/docs`
- Analyse Data, Compare, Monthly, Forecast, Scenario and Statistics POST flows
- a deliberate burst should eventually return HTTP 429 rather than overloading the app

## Netlify frontend

Environment variables:
- `NEXT_PUBLIC_API_URL` = Railway public backend URL, no trailing slash
- `NEXT_PUBLIC_SITE_URL` = `https://azhandatastudio.com` (canonical public frontend URL)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = Search Console verification token when issued
- `NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL` = `https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-H5VZKVXKMY`

The confirmed Data Studio checkout is also the safe fallback in `frontend/app/lib/config.ts`.

Production pages include:
- `/` Analyse Single File
- `/clean`
- `/monthly`
- `/compare`
- `/forecast`
- `/scenario`
- `/statistics`
- `/features`
- `/features/csv-excel-analysis`
- `/features/data-quality-checker`
- `/features/compare-excel-files`
- `/features/data-forecasting`
- `/privacy`
- `/terms`
- `/sitemap.xml`
- `/robots.txt`
- `/opengraph-image`

## Custom domain cutover

Primary public domain: `https://azhandatastudio.com`

Recommended Netlify setup:
- add `azhandatastudio.com` as the primary custom domain
- add `www.azhandatastudio.com` as a domain alias and redirect it to the apex domain
- keep the existing `azhandatastudio.netlify.app` hostname available as a Netlify fallback, but do not use it as a canonical URL
- set `NEXT_PUBLIC_SITE_URL=https://azhandatastudio.com` in Netlify before the production deploy
- after DNS/HTTPS is active, verify that the Netlify hostname and `www` resolve or redirect to the primary custom domain

The backend CORS example includes the apex, `www`, and legacy Netlify hostname so the analysis API continues to work during the cutover. After the custom domain is stable, the legacy Netlify origin can be removed from Railway if desired.

## Production regression test

1. Load `/` and choose **Try sample data instead**, then run the analysis.
2. Analyse one real CSV and one real XLSX file and verify sheet selection.
3. Verify Overview, Data Quality, Insights, Explore, Reports and Fields.
4. Stop the backend temporarily and confirm the frontend shows the friendly analysis-service connection message rather than raw `Failed to fetch`.
5. Verify a file over 50 MB is blocked by the main Analyse Data UI before upload.
6. Check Clean, Monthly, Compare, Forecast, Scenario and Statistics still run.
7. Verify every Support button opens `https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00`.
8. Check `/features` and all four feature-guide pages on desktop and mobile widths.
9. Check `/privacy` and `/terms` and confirm legal links are reachable from the public content.
10. Open `/sitemap.xml` and confirm every intended public page appears.
11. Open `/robots.txt` and confirm it references the production sitemap.
12. View source/DevTools and verify canonical, description and Open Graph metadata on the homepage and a feature page.
13. Check the social preview image at `/opengraph-image`.
14. After Search Console verification, submit `/sitemap.xml` and inspect the homepage plus four feature pages.
15. Verify GA4 installation and Realtime events for `analysis_start`, `sample_data_click`, `data_quality_open`, `support_click` and `feature_cta_click`.
16. Run Lighthouse/PageSpeed and address material performance, SEO or accessibility warnings before promotion.

## Data handling

Uploaded source files are read by the FastAPI backend for the requested analysis and are not intentionally written to persistent application storage. Monthly Intelligence can persist selected files in the user's own browser IndexedDB and stores alert preferences in localStorage. See `/privacy` for the public explanation.
