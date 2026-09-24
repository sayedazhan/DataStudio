# Azhan Data Studio v3.4 — SEO Foundation

## What changed

The v3.3.1 Data Quality baseline is preserved. v3.4 adds search-engine and social-sharing foundations without changing the analysis calculations or backend API.

### Technical SEO
- Canonical URLs via Next.js Metadata API
- Global title template and upgraded meta description
- Open Graph and Twitter/social-card metadata
- Generated 1200 × 630 Open Graph image
- `robots.txt` generated from `app/robots.ts`
- `sitemap.xml` generated from `app/sitemap.ts`
- Web app manifest
- Googlebot indexing directives
- Optional Google Search Console verification through environment variable

### Structured data
The root layout now emits JSON-LD for:
- `WebSite`
- `SoftwareApplication`
- `Person` creator attribution

No ratings, reviews, awards or other unsupported claims are included.

### Route-specific search intent
Each existing public tool has its own canonical title, description and social metadata:
- `/` — CSV & Excel data analysis
- `/clean` — data cleaning / data quality
- `/monthly` — monthly trend analysis
- `/compare` — dataset comparison
- `/forecast` — forecasting
- `/scenario` — scenario / what-if analysis
- `/statistics` — statistical analysis

## Production configuration

Add these values to the frontend production environment:

```env
NEXT_PUBLIC_SITE_URL=https://azhandatastudio.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Only fill `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` after creating the property in Google Search Console and receiving the verification token.

## After deployment

Check these public URLs:
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`
- `/opengraph-image`

Then add `https://azhandatastudio.com/sitemap.xml` to Google Search Console.

## Next SEO phase

Technical SEO is the foundation. The next SEO phase should add useful, indexable feature/use-case content rather than creating thin keyword pages. Good candidates are dedicated pages for Data Quality, automated Excel analysis, CSV analysis, forecasting and dataset comparison, each with genuine explanatory content and internal links into the relevant tool.
