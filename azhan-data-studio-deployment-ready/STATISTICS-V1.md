# Statistics Studio v1

Statistics Studio adds a fifth top-level decision-intelligence mode to Azhan Data Studio.

## Included analyses
- Summary & Confidence: mean, median, standard deviation, quartiles, IQR outliers, skewness, kurtosis, and Student-t confidence interval for the mean.
- Relationships: Pearson correlation, Spearman correlation, p-values, r-squared, and scatter evidence.
- Group Comparison: Welch t-test for two groups; one-way ANOVA for 3+ groups; Cohen's d or eta-squared effect size.
- Category Association: chi-square test of independence, Cramer's V effect size, contingency table, and expected-cell reliability warning.

## Design principle
Statistical results are presented in plain English first, with the underlying statistic, p-value, sample size and effect size visible underneath. Data Studio does not use an LLM to calculate or invent statistical results.

## Backend
New endpoints:
- POST /api/datasets/statistics/prepare
- POST /api/datasets/statistics

The statistics engine uses SciPy for standard statistical tests and Polars for dataset handling.

## Test dataset
Use `sample-data/statistics-business-sample.csv`. Suggested tests:
1. Summary: Revenue
2. Relationship: Revenue vs Cost or Satisfaction vs ResponseTime
3. Group comparison: Revenue by Region or Segment
4. Category association: Segment vs Channel
