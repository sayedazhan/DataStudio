# Azhan Data Studio v3.6 - Launch Readiness + SEO

Release date: 24 September 2026

## Launch-readiness changes

- Added `/privacy` with clear file-processing, browser-storage, Stripe and infrastructure data-handling information.
- Added `/terms` with analytical, forecast/statistical and acceptable-use disclaimers.
- Added a local `/sample-data.csv` and a **Try sample data instead** action on the main Analyse Data landing page.
- Added a friendly API connection error instead of exposing the browser's raw `Failed to fetch` message.
- Added a client-side 50 MB limit check to Analyse Data before upload.
- Added lightweight per-client POST request limiting to the FastAPI analysis endpoints. Defaults are configurable with `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW_SECONDS`.
- Local development CORS now accepts localhost / 127.0.0.1 on any local port, reducing port-3001 development failures.
- Added security response headers in Next.js: nosniff, SAMEORIGIN, strict-origin referrer policy, and restrictive camera/microphone/geolocation/payment permissions.
- Added custom error and 404 experiences.

## SEO changes

- Added a crawlable `/features` hub with internal links to the four launch feature guides and the specialised tools.
- Preserved unique titles, meta descriptions, canonicals, Open Graph and Twitter metadata through the shared Metadata API.
- Updated `/sitemap.xml` to include the feature hub, feature guides, public tools, privacy and terms pages.
- Preserved `/robots.txt` with a sitemap reference and canonical host.
- Kept visible FAQ content on the homepage and feature pages.
- Replaced FAQPage JSON-LD on feature pages with `WebPage` + `BreadcrumbList` structured data. Google stopped showing FAQ rich results in 2026, so the FAQs remain useful human-readable content without relying on a discontinued Google rich-result feature.
- Preserved root `WebSite`, `SoftwareApplication` and creator structured data and updated the software version/features.
- Added stronger internal linking between the homepage, Features hub, feature guides, tools and legal pages.
- Search Console verification remains configurable through `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

## Confirmed Stripe support link

Azhan Data Studio support URL:

`https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00`

It remains centralised in `frontend/app/lib/config.ts` and can be overridden with `NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL`.

## Before public deployment

1. Set the production Railway backend URL in Netlify as `NEXT_PUBLIC_API_URL`.
2. Set `NEXT_PUBLIC_SITE_URL=https://azhandatastudio.com` (or the final custom domain if it changes).
3. Set Railway `CORS_ORIGINS` to the exact production frontend origin.
4. Deploy and check `/`, `/features`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, and `/opengraph-image`.
5. Verify Analyse Data using both the bundled sample dataset and a real CSV/XLSX file.
6. Verify Stripe Support opens the confirmed Data Studio checkout.
7. Add the deployed property to Google Search Console, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, redeploy, and submit `/sitemap.xml`.
8. Use Search Console URL Inspection on the homepage and the four feature-guide URLs after deployment.
9. Run Lighthouse/PageSpeed on the homepage and feature pages and address material Core Web Vitals/accessibility issues before promotion.

## Validation completed in this package

- Python backend source compilation: passed.
- TypeScript/TSX syntax transpilation check: passed for all application source files.
- Stripe audit: Pay Calculator checkout absent; Data Studio checkout present only through Data Studio configuration/environment examples.
- Full `next build` could not be completed in the packaging environment because npm dependency retrieval was unavailable. Run `npm install` and `npm run build` on the normal development machine before production deployment.
