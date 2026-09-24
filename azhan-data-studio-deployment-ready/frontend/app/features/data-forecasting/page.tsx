import type { Metadata } from "next";
import { SeoFeaturePage } from "../../components/seo-feature-page";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Excel & CSV Data Forecasting Tool",
  description: "Create time-series forecasts from Excel or CSV data online. Select a date and metric, review projected values, ranges and historical fit, then export the result.",
  path: "/features/data-forecasting",
  keywords: ["Excel forecasting tool", "CSV forecasting tool", "forecast data online", "time series forecast", "sales forecasting Excel"],
});

export default function DataForecastingPage() {
  return <SeoFeaturePage
    eyebrow="DATA FORECASTING"
    title="Turn historical Excel or CSV data into a practical forecast."
    lead="Choose a time field and business metric, let Azhan Data Studio prepare the series, then review projected values and forecast ranges without building a forecasting workbook from scratch."
    toolHref="/forecast"
    toolLabel="Create a forecast"
    secondaryHref="/scenario"
    secondaryLabel="Try Scenario Analysis"
    highlights={["Date-field detection", "Metric selection", "Forecast intervals", "Report-ready output"]}
    features={[
      { title: "Series preparation", description: "Detect likely date and numeric fields, aggregate the data into a suitable time series and flag preparation issues." },
      { title: "Projected values", description: "Generate future-period estimates based on the historical series and selected forecast horizon." },
      { title: "Uncertainty ranges", description: "Review forecast intervals alongside the central estimate so the projection is not presented as false precision." },
      { title: "Historical context", description: "See the observed history together with the projected path to understand how the forecast relates to previous movement." },
    ]}
    steps={[
      { title: "Upload historical data", description: "Choose a CSV or Excel file containing a meaningful date field and numeric measure." },
      { title: "Select date and metric", description: "Use the recommended candidates or choose the fields that best represent the series you want to project." },
      { title: "Set the horizon", description: "Choose how many future periods you want to estimate based on the available historical frequency." },
      { title: "Review the projection", description: "Inspect forecast values, ranges, charted history and the method notes before using the output in planning." },
    ]}
    useCases={["Sales forecasting", "Volume planning", "Demand trends", "Operational workload", "Monthly KPI projection", "Budget support"]}
    faqs={[
      { question: "What data do I need for a forecast?", answer: "You need historical observations with a usable date field and at least one numeric metric. More consistent history generally gives the forecasting workflow more information to work with." },
      { question: "Does a forecast guarantee what will happen?", answer: "No. A forecast is an estimate based on the historical series and assumptions in the method. The range and caveats should be considered when using it for planning." },
      { question: "Can I forecast data from an Excel workbook?", answer: "Yes. You can upload an .xlsx workbook, choose an analysis-ready sheet and then select the date and metric fields for forecasting." },
      { question: "What if I want to test assumptions rather than project history?", answer: "Use Scenario Analysis when you want to change assumptions such as percentage movements and compare upside, base and downside outcomes rather than extrapolating a time series." },
    ]}
    pagePath="/features/data-forecasting"
  />;
}
