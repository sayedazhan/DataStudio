# Azhan Data Studio — Workbook Selection + File Guard

This update adds two production-facing safeguards:

1. **CSV / XLSX only** — the browser file picker, drag-and-drop handler, and FastAPI backend all reject unsupported extensions. XLSX uploads also receive a server-side workbook signature check.
2. **Excel worksheet selection** — when an XLSX workbook is chosen, Azhan Data Studio detects its sheets before analysis and lets the user select the worksheet to analyse.

## User flow

### CSV
Upload CSV → Analyse immediately.

### Excel (.xlsx)
Upload workbook → sheets are detected → select a sheet → analyse that sheet.

After analysis, the current worksheet name is shown beside the dataset name. If the workbook has other analysis-ready sheets, the sheet dropdown remains available so the user can switch sheet and click **Analyse sheet** without uploading the workbook again.

Empty sheets are shown but disabled. Small/reference sheets are labelled as such. The largest populated worksheet is marked **Recommended** as a convenience only; the user remains in control of the sheet selection.

## Files changed

- `backend/app/main.py`
- `frontend/app/page.tsx`
- `frontend/app/globals.css`

No new dependencies are required.

## Test workbook

A sample workbook is included at:

`sample-data/sample-multi-sheet-workbook.xlsx`

It includes:
- Sales
- Inventory
- Employees
- Lookup (small/reference sheet)
- Empty Notes

## Run

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000` and upload the sample workbook.
