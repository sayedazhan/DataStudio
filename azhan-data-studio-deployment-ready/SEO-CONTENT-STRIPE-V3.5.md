# Azhan Data Studio v3.5 — SEO Content & Stripe Link Consolidation

## What changed

v3.5 builds on the v3.4 technical SEO foundation and the v3.3.1 Data Quality baseline. It adds useful, indexable feature content and makes the Support checkout consistent across the entire frontend.

## New indexable feature pages

The following public pages were added and linked from the home page:

- `/features/csv-excel-analysis`
- `/features/data-quality-checker`
- `/features/compare-excel-files`
- `/features/data-forecasting`

Each page includes:
- a unique title, description, canonical URL and keyword focus
- useful explanatory copy rather than a thin keyword-only page
- internal links into the relevant working tool
- workflow steps and practical use cases
- visible FAQs with matching `FAQPage` JSON-LD
- consistent Azhan Data Studio branding and responsive layout
- a Support link using the same central Stripe checkout as the rest of the site

## Homepage internal linking

A new “Explore the toolkit” section appears on the public home state. It links to the four feature pages so visitors and search crawlers can discover them naturally.

## Sitemap

`app/sitemap.ts` now includes all four feature pages in addition to the existing tool routes.

## Stripe support checkout

The Support link is now defined once in:

`frontend/app/lib/config.ts`

Current canonical checkout:

`[removed: Pay Calculator payment link]`

All frontend Support buttons import that constant. Old per-page environment fallbacks and placeholder deployment guidance were removed so the site cannot accidentally show different checkout destinations across pages.

To change the checkout in future, update the `SUPPORT_URL` constant in `frontend/app/lib/config.ts` once.

## Deployment checks

After deploying:

1. Open the home page and check the new “Explore the toolkit” cards.
2. Open all four `/features/...` routes directly.
3. Check `/sitemap.xml` and confirm the four new routes appear.
4. Open Support from the home header, home support section, a tool page, footer and a feature page. All should reach the same Stripe checkout.
5. Re-submit the sitemap in Google Search Console after production deployment.
6. Use URL Inspection for the four new feature pages and request indexing after they are live.

## Validation performed

- Backend Python modules compile successfully.
- All frontend TypeScript/TSX source files pass TypeScript syntax transpilation with zero syntax diagnostics.
- A full Next.js production build could not be completed in the current environment because dependency installation timed out before npm finished creating the executable links. Run `npm install` followed by `npm run build` locally or in Netlify as the final production build check.
