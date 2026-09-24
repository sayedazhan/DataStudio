# Azhan Data Studio v3.6.1 - Domain Ready

Primary production domain:

`https://azhandatastudio.com`

## What changed from v3.6

- SEO canonical fallback changed from the Netlify hostname to `https://azhandatastudio.com`.
- Sitemap, robots host, Open Graph URLs and structured-data URLs now inherit the custom domain.
- The generated Open Graph image now displays `azhandatastudio.com`.
- Production frontend environment example uses the custom domain.
- Backend production CORS example includes:
  - `https://azhandatastudio.com`
  - `https://www.azhandatastudio.com`
  - `https://azhandatastudio.netlify.app` during migration/testing.
- Frontend package version bumped to 3.6.1.
- Package root is named `azhan-data-studio-deployment-ready` to match the existing GitHub repository directory.

## GitHub update

The existing repository structure should remain:

```text
DataStudio/
  azhan-data-studio-deployment-ready/
    frontend/
    backend/
    ...
```

Replace the **contents** of the existing `azhan-data-studio-deployment-ready` directory with this package. Do not create an extra versioned folder inside it.

Then commit and push the changes to `main`.

## Netlify environment

Set:

```text
NEXT_PUBLIC_SITE_URL=https://azhandatastudio.com
NEXT_PUBLIC_API_URL=<your Railway public API URL>
NEXT_PUBLIC_DATA_STUDIO_SUPPORT_URL=https://buy.stripe.com/3cIcN514E65u8MnaKAdjO00
```

Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` after Google Search Console provides the verification token.

## Railway environment

During the custom-domain cutover, use:

```text
CORS_ORIGINS=https://azhandatastudio.com,https://www.azhandatastudio.com,https://azhandatastudio.netlify.app
```

## After DNS is live

Verify:

- `https://azhandatastudio.com`
- `https://azhandatastudio.com/robots.txt`
- `https://azhandatastudio.com/sitemap.xml`
- canonical URL on the homepage and feature pages
- Open Graph image and URLs
- all analysis tools against the Railway backend
- Stripe support buttons
- redirect behaviour for `www` and the Netlify hostname
