# Visualization — independent review

28 September 2026. Reviewer: root, separate from author
`frameworks_functional_tracking`. Read the complete manuscript, design, both
programs, visual models, components/styles, blueprint and author native receipt.
Exact source identities are retained in `independent-review.json`.

## Correctness

The declared half-open bins and closed final edge agree with NumPy's documented
contract. Unequal-width density uses area rather than height as sample mass.
Linear/log mappings preserve data units; the midpoint and endpoint explanations
are correct. Spread, confidence intervals and prediction intervals stay separate.
The Wine analysis is descriptive; its normalization and observational limits do
not imply inference or a causal result.

A complementary independent calculation made 187 comparisons: direct CSV parsing
recovered all 178 observations, group counts, means, sample standard deviations
and plotted densities; supported observation/bin choices conserve mass; the raw
count-area counterexample and inverse coordinate mappings agree. All passed.
The author's actual Matplotlib/seaborn/Plotly executions and 40 NumPy histogram
fixtures were reviewed from source-bound evidence rather than redundantly rerun.
NumPy's histogram reference and Wilke's uncertainty chapter were independently
consulted. No new native plotting execution is implied by this review.

## Learning experience

The lesson introduces the question, data unit, statistic and mark before APIs.
Worked bins, coordinate arithmetic and changed cases explain each new mechanism.
Scratch ownership is scoped to assignment and mapping; library rendering remains
visible and explained. Real-data panels now answer the opening question on-page.
Practice asks for changed data, a misleading-axis repair and an independently
reproducible figure; resources explain when to use them. There are no learner
prediction gates or hidden core explanations.

Actual browser inspection covered desktop/default/changed and 320px labs and
figures, with automated 768/390/320 checks, keyboard and pointer controls, blank
input recovery, Copy feedback and downloaded-byte equality. Endpoint and doubled
root-text-size cases were checked separately. Exact counts remain available when
tables scroll locally. This is heuristic review and rendered inspection, not an
observed learner study.

## Closed findings

- Added visible real Wine panels instead of making the learner execute code to
  see the opening comparison.
- Separated glued numbers in prose and expanded compressed source formatting.
- Added an explicit read-only-mark instruction to the scale diagram, directing
  interaction to its real slider.
- Clarified the pipeline's `row_id = 1`; the source CSV is zero-indexed and that
  record's alcohol value is 13.2.

No material finding remains. Final production and source-conservation evidence
belongs to the module integration record; this review alone does not complete
the implementation ledger.
