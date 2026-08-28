# Scenario Studio v1

Scenario Studio adds deterministic what-if modelling to Azhan Data Studio.

## Workflow

1. Upload a CSV or XLSX file.
2. Choose a calculation:
   - Single metric
   - Metric A - Metric B
   - Metric A / Metric B (%)
   - Metric A x Metric B
   - Margin % = (A - B) / A
3. Choose Sum or Average independently for each metric.
4. Optionally choose a breakdown such as Region, Product, Segment, or Channel.
5. Enter Upside and Downside percentage assumptions.
6. Run the what-if analysis.

## Outputs

- Base, Upside, and Downside outcomes
- Change vs baseline
- Scenario range
- Driver sensitivity
- Interaction effect for non-linear calculations
- Optional segment breakdown
- Downloadable scenario CSV
- Transparent methodology and caveat

## Local test

Use `sample-data/scenario-business-sample.csv`.

Recommended test:

- Calculation: `Revenue - Cost`
- Metric A: `Revenue`, Sum
- Metric B: `Cost`, Sum
- Breakdown: `Region`
- Upside: Revenue `+10%`, Cost `+5%`
- Downside: Revenue `-10%`, Cost `0%`

Expected approximate results:

- Base: `754,400`
- Upside: `908,720` (`+20.5%`)
- Downside: `521,200` (`-30.9%`)

These are what-if calculations, not forecasts or probability estimates.

## API

- `POST /api/datasets/scenario/prepare`
- `POST /api/datasets/scenario`

Scenario Studio uses the same FastAPI/Railway backend as the rest of Azhan Data Studio.
