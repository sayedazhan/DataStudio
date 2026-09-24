# Azhan Data Studio v3.7 - GA4 Launch Analytics

Release date: 24 September 2026

## Measurement

Google Analytics 4 measurement ID:

`G-H5VZKVXKMY`

The frontend loads the Google tag once from the root Next.js layout through `frontend/app/components/google-analytics.tsx`.

The ID can be overridden at deployment with:

`NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Tracked interactions

In addition to GA4 Enhanced Measurement, the site emits a small set of product events that do not include uploaded dataset contents or file names:

- `analysis_start` - user starts/restarts single-file analysis
- `sample_data_click` - user chooses the built-in sample dataset
- `data_quality_open` - user opens the Data Quality Centre from the single-file analysis workspace
- `support_click` - user opens the optional Stripe support checkout
- `feature_cta_click` - user follows a primary CTA from the SEO feature content
- `tool_navigation` - user moves between main Data Studio tools using the workspace navigation

## Privacy

`/privacy` now explains the GA4 deployment and explicitly states that uploaded dataset contents, file names and analysis values are not intentionally sent to Google Analytics.

## Netlify

Recommended environment variable:

`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-H5VZKVXKMY`

The confirmed ID is also a safe public fallback in `frontend/app/lib/config.ts`, because GA measurement IDs are public website identifiers rather than secrets.

## Verification after deployment

1. Deploy v3.7 to Netlify.
2. Visit `https://azhandatastudio.com` in a new browser tab.
3. In Google Analytics, use **Test installation** for the Web data stream.
4. Open **Reports > Realtime** and confirm your visit appears.
5. Click **Try sample data instead** and confirm `sample_data_click` appears in Realtime events.
6. Start an analysis and confirm `analysis_start` appears.
7. Open the Data Quality Centre and confirm `data_quality_open` appears.
8. Click a Support button and confirm `support_click` appears before leaving for Stripe.

GA4 standard reports can take longer to populate than Realtime.
