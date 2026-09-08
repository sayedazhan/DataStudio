# Analytics Intelligence v3.1

Azhan Data Studio v3.1 builds on the Monthly Intelligence foundation without replacing the existing Analyse, Compare, Forecast, Scenario, or Statistics tools. v3.1 adds configurable KPI alerts and a stronger period-comparison layer while keeping all calculations deterministic.

## What was added

### Monthly file library
- Add multiple CSV/XLSX files over time.
- Files are stored in the browser with IndexedDB so the local library survives a refresh/revisit on the same browser profile.
- Exact duplicate files are detected with SHA-256 and skipped.
- Each file is limited to 20 MB; a monthly analysis request is limited to 24 files / 100 MB total.
- XLSX files automatically use the workbook's recommended data-table sheet.

### Automatic reporting-period detection
Data Studio attempts to identify a shared date/month/period field. If no suitable date field exists, it can infer a month from filenames such as:
- `sales-2026-08.csv`
- `sales_August_2026.xlsx`
- `08-2026-report.csv`

### Deterministic monthly insights
After selecting a KPI and aggregation, Data Studio calculates:
- previous vs current period KPI movement
- absolute and percentage change
- record-volume movement
- trend across all detected periods
- largest dimension drivers
- top current dimension
- new category values in the current period

No LLM or external AI API is used for these calculations or narratives.


### KPI Alerts (v3.1)
Users can configure an in-app alert rule before each Monthly Intelligence run:
- movement threshold percentage
- direction to watch: any movement, decline only, or increase only
- optional KPI target
- target type: minimum or maximum

Alert preferences are saved in the browser. The backend evaluates movement thresholds, target breaches, two-period direction streaks, driver concentration, and data-quality signals. These are in-app analytical alerts only; no email/SMS service or external API is required.

### Stronger Period Comparison (v3.1)
The selected current and previous periods now include:
- absolute KPI movement and percentage change
- KPI per record for both periods
- per-record percentage change, helping separate performance change from simple row-volume change
- current value versus historical average
- current period rank across all available periods
- best and worst historical periods
- historical volatility
- positive and negative period-movement counts

### Data Quality Centre
Monthly Intelligence checks:
- completeness and missing cells
- duplicate rows across the consolidated history
- invalid date values
- schema drift between monthly files
- new category/dimension values
- missing reporting months
- unusual row-count movement (35%+ vs recent baseline)

The existing single-file Data Quality page was also upgraded with:
- high-missingness flags (20%+)
- repeated-value checks for detected identifier fields
- IQR outlier counts
- date/time coverage summaries

## Test it locally

Use these three sample files together:
- `sample-data/monthly-sales-2026-06.csv`
- `sample-data/monthly-sales-2026-07.csv`
- `sample-data/monthly-sales-2026-08.csv`

Suggested settings:
- KPI: `Revenue`
- Aggregation: `Sum`
- Date field: `Date`
- Business dimension: `Region`
- Previous period: `July 2026`
- Current period: `August 2026`
- Alert threshold: `20%`
- Direction to watch: `Increase only`
- Optional minimum target: `75000`

Expected behaviour:
- three reporting periods are detected
- August revenue is compared with July
- QLD appears as a new Region value in August
- Region movement drivers are shown
- a KPI movement alert is triggered because August Revenue increases by more than 20% versus July
- August ranks as the highest Revenue period in the three-month sample
- per-record Revenue decreases even while total Revenue rises, demonstrating the new volume-vs-performance comparison
- the local file library remains after a browser refresh

## Data handling

The monthly library is persisted in the user's browser. When the user clicks Prepare or Build Monthly Intelligence, the selected files are sent to the existing FastAPI backend for that request. The application code does not add server-side file persistence.
