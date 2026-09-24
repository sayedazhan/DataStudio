# Auto Dashboard v4.0.1 Hotfix

## Fixes
- Fixed a recursion error in the backend `_analyse_schema` helper that prevented CSV/XLSX uploads from completing in v4.0.
- Restored the full semantic schema analysis loop used by the stable v3.7 analysis pipeline.
- Added localhost/127.0.0.1 to Next.js development origins to make local testing less fragile.
- No dashboard calculations, SEO, GA4, Stripe, production domain, or existing analysis features were otherwise changed.
