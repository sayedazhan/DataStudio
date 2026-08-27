# Azhan Data Studio — Deep Blue Brand Update

This edition applies the selected **Concept A: Deep Blue + Electric Blue** visual identity while preserving the current analytics, workbook selection, strict CSV/XLSX upload guard, home navigation, and re-analysis behaviour.

## Brand palette

- Primary: `#155EEF`
- Deep blue: `#0B46C5`
- Logo gradient: `#2563EB` → `#0B3A99`
- Soft blue: `#EAF2FF`
- Page background: `#F5F8FC`
- Primary text: `#0F1F38`

Red remains only for analytical semantics such as critical findings, outliers, and negative signals.

## Hero direction

Headline:

> Turn your data into real intelligence.

The upload experience and all existing functionality are unchanged.

## Upgrade an existing project

Replace:

- `frontend/app/page.tsx`
- `frontend/app/globals.css`
- `frontend/app/icon.svg`

Then restart the frontend with `npm run dev`.

If the browser still shows the old red favicon, perform a hard refresh because favicons are aggressively cached.
