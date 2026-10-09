## 13. Complete a small experiment with an honest report

We have opened scores, updates, solves and lists. None of those local calculations
answers how a complete chosen method performs on later outcomes. An experiment
also needs a target, a permitted information set, a setting-choice rule, a baseline
and an assessment that did not choose the settings.

<!-- diagram:D51 -->

The original synthetic comparison turns the twenty observed ratings into events
at ticks 1–20, adds five validation ratings at 21–25 and six test ratings at 26–31.
All seven items are declared released at tick 0. The final test event belongs to
user 5, who has no earlier observations. This construction tests the implemented
workflow and its fallbacks; the integer ticks are invented information boundaries,
not a real-world collection history.

The complete `evaluation` program compares ranks1,2,3 and penalties .05,.2 using
validation RMSE. It refits the chosen setting on the twenty-five permitted events,
computes the shrunk-item baseline from the same prefix and assesses both on the
six test events. It chooses rank 2, penalty .05, validation RMSE 1.337272. Test
RMSE is1.111143 for the item baseline and 1.229386 for MF: the factor method loses.

| Test cohort | Events | Item baseline RMSE | MF RMSE |
| --- | ---: | ---: | ---: |
| All | 6 | 1.111143 | 1.229386 |
| Warm users | 5 | 1.176590 | 1.321735 |
| Cold users | 1 | .697143 | .577423 |

The isolated cold-user number has one event; it is not robust cold-start evidence.
After refitting, user 0's eligible unseen items are4 and 6. Popularity orders[4,6],
while MF orders[6,4]. A rating-error comparison does not by itself grade this
unobserved list's relevance. The predeclared changed cutoff18 keeps the same test
period but changes the initial split to 18/7/6. It selects rank 2, penalty .2,
validation RMSE 1.180979; MF test RMSE 1.128322 still exceeds baseline1.111143.
Choosing a cutoff because its test result looks better would be another selection
using those outcomes, requiring a fresh final assessment.

### Ask a narrower question of actual invoice history

Can known customers' recorded purchases help rank previously unpurchased products
for the next month, within a catalogue chosen from December? This is discovery.
Replenishment would retain previously purchased products and need a different
target. Invoice quantity, price, an explicit rating and a recorded exposure are
different observations; we use unique invoice-time occurrences as counts.

<!-- diagram:D52 -->

[UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail) records
invoices from a UK non-store retailer between 1December2010 and 9December2011.
The dataset is attributed to Daqing Chen, DOI10.24432/C5BW33, under CC BY4.0.
The input is the original workbook, not an untraceable third-party resample.
Its541,909 rows pass these sequential, disjoint filters:135,080 lack a customer
ID;8,905 have cancellation invoice strings;0 remaining rows have nonpositive
quantity;40 have nonpositive price;1,838 have a nonproduct stock code. The
396,046 retained rows have five-digit stock codes with an optional letter suffix.
Removing cancellation invoices does not prove that a retained purchase was never
returned later.

An occurrence is one distinct(CustomerID, StockCode, InvoiceNo, InvoiceDate).
Repeated copies of that same four-field key collapse. A later invoice or timestamp
remains a new event and increases confidence. The three months contain65,248
such filtered occurrences across all customers/products. We preserve the workbook's
source-naive calendar times; no time zone was supplied that would justify shifting
their boundaries.

December [2010-12-01,2011-01-01) chooses the100 products with the largest occurrence
counts, ties by original stock-code lexical order. Among the615 customers with at
least three distinct selected products, choose 200 by the SHA256 of their canonical
customer-ID strings, ties by ID. This deterministic train-only choice defines the
warm cohort. January and February do not choose the products or customers.
Local U/I IDs keep the matrices readable; they do not guarantee anonymity.

| Role | Catalogue occurrences | Catalogue pairs | Any catalogue purchaser | Requests with eligible discovery truth | Inside / outside discovery pairs |
| --- | ---: | ---: | ---: | ---: | ---: |
| December training | 1930 | 1725 | 200 | 200 | 1725 / 5181 |
| January validation | 533 | 497 | 72 | 68 | 317 / 1757 |
| February test | 410 | 384 | 60 | 48 | 171 / 1185 |

The first row is training coverage, not evaluation performance. Each of the200
customers issues one hypothetical request at the month's start. Candidates are
the fixed catalogue minus that customer's previously purchased catalogue products.
Truth is a future positive product not present in that customer's entire earlier
filtered product history. Outside-catalogue discoveries are counted separately.
An item omitted by this chosen catalogue cannot be returned by these rules; that
observed purchase coverage is different from ANN recall or causal relevance.
No actual stock-availability log is present, so call the candidates *declared
fixed-catalogue eligibility*.

Sixty-eight January and forty-eight February requests have nonempty eligible
truth. The other requests do not establish that all their candidate items are
irrelevant. Their recall, RR, AP and NDCG are undefined and excluded with those
counts. Precision and fixed-slot fill retain all 200 requests. This avoids changing
the population silently when different denominators happen to favor a model.

### Choose on validation; hold one scorer fixed

<!-- diagram:D53 -->

The four factor settings are, in order,(rank 4,λ.1),(rank 4,λ1),(rank 8,λ.1),(rank 8,λ1).
All use target1[count>0], confidence1+2count and the same once-entity penalty.
Initialize training P at zero and Q from `default_rng(19).normal(0,.01,(100,rank))`.
Each setting receives ten complete user-then-item exact-solve sweeps on December.
Every full training objective uses the actual stored P/Q after its recorded sweep.
The final user array was solved before the tenth item update; it is retained as
training state, separately from the request vectors described in section10.

Every validation score instead solves the customer's December history against
that setting's own final Q. A=QᵀQ+Σ positive(c−1)qqᵀ+λI, b=Σ positive cq;
solve Ap_query=b and score every item qᵀp_query. The absent-pair curvature remains
in QᵀQ. This is the same `retail-final-q-fixed-history-v1` request calculation
later used for test and saved queries, not an extra training sweep. Eligibility
is applied after all 100 scores have been computed; it does not change A.

The two baselines use exactly the same history and eligible catalogue. Popularity
adds occurrence counts over customers. Item cosine uses binary purchased-item
columns, their common full column norms and a sum of similarities over this
customer's unique purchased products; an empty history falls back to popularity.
These are binary implicit conventions, distinct from signed centered explicit
rating neighbors. Stable descending score then original stock-code lexical order
settles every list tie.

Select on January macro NDCG@10 over its 68 qualified requests. Lock both the best
ALS setting and the overall rule among all four settings and both baselines.
An exact metric tie prefers popularity, then item cosine, then lower factor rank
and stronger λ. This choice rule is declared before the numbers exist. Save all
six validation score arrays, masks, complete eligible orders, per-user metrics,
null masks, configurations and their final Q identities with that selection.

Only the chosen ALS configuration is refitted on December+January, once, with the
same initialization and ten sweeps. January adds533 occurrences; the prefix has
2463 occurrences. Its distinct nonzero count is the actual matrix union, not
1725+497: the same pair can appear in both months. Recompute both baseline states
on this prefix without choosing any new settings. Before parsing February events,
lock the complete three score arrays/orders/masks, final Q, p_query array, counts,
confidences, IDs, selected setting and first lock. These two prospective locks
separate model choice and the final fixed predictions from their later truth.

The ordinary CPU `implicit 0.7.3` comparison is the sixth model fit. Its user×item
CSR stores1+2n only for positive count cells; package alpha=1 avoids multiplying
confidence twice. It uses rank/λ from validation, ten iterations, float64 factors,
one thread, `use_cg=False`, `use_native=False`, and supplied exact initial P/Q.
The package converts confidence storage to float32; these small integer weights
are exactly representable. Its own final Q is scored by the same direct query
equations. Compare `recalculate_user` on that Q separately without replacing the
library's stored training users. The declared tolerances are absolute1e−8 and
relative1e−7; any differences or warnings are reported rather than erased by
another fit. This is a tool correspondence, not a fourth selected test method.

The complete `recommender-retail-study.py` makes the boundary visible in code.
`fit_scratch` saves each full objective and old/current buffer arrays;
`fixed_history_query` returns separate A,b,p_query and all scores;
`ranked_orders` retains full eligible ID lists;
`metrics` reports each named denominator and null cohort.
The main sequence writes the selection lock before its single prefix refit and
the prediction lock before its only February event import. It records every
matrix in typed NPZ and portable JSON. A new output directory is mandatory, even
after failure; another run is a new declared campaign rather than an invisible
retry. The companion data program provides the full filtering/cohort/ID recipe
and separate month files. Neither imports the original unguarded demonstrations.

### Read performance and uncertainty on their declared population

The test report includes the three prefix rules' precision@10, fill, recall, RR,
AP with denominator min(10,R), NDCG, complete per-customer results and all 48
qualified IDs. It preserves the overall validation winner even if the test
ordering reverses. It also retains all validation settings, including weak ones;
the three unchosen factor settings have no invented/refitted test outcomes.

For the winner minus popularity and best ALS minus popularity, resample the same
qualified customer rows 1000 times with replacement, seed 71. Compute NDCG/recall
differences without refitting. The2.5/97.5 percentiles are conditional intervals
for this workflow, warm cohort and month. Shared products, temporal dependence
and customer selection limit a broader interpretation. Identical predictions
give an exact zero difference distribution; no qualified cohort gives undefined
comparison rather than a made-up zero interval.

A separate diagnostic keeps every known eligible positive plus up to 20 other
eligible items per customer, seed 83. It uses the unchanged score arrays. Its
easier candidate distribution can change metrics and never chooses a method.
Those other items are not known dislikes merely because they were sampled.
Exact full-catalogue and diagnostic candidate IDs remain distinct records.

### Follow a saved request without retraining

<!-- diagram:D54 -->

Select a saved customer and inspect its prefix occurrences. Each selected item
contributes a target, a confidence and its fixed final item vector. The picture
adds the shared Gram, that history's outer-product corrections and λI, forms b,
solves p_query and exposes a selected candidate's coordinate products and sum.
The same all-item scores feed its stable eligible top-ten list. With no edits,
this route must reproduce the saved prefix prediction array; it is the calculation
that was assessed. If a baseline won validation, show that actual baseline forward
as the selected rule; the ALS inspector remains a measured comparison method.

Editing a count produces a hypothetical fixed-factor request, not a newly fitted
or measured Retail outcome. Its domain is every finite decimal from 0 to
max(20,maximum saved count), preserving every actual occurrence count. Copy the
row before editing; Q, λ, item identities and saved data stay fixed. An empty row
has b=0 and positive λ makes p_query=0, so all factors tie and original stock-code
lexical order becomes visible. Changing the eligible mask changes the list, not
the already formed full-catalogue score vector.

<!-- diagram:D55 -->

A complete saved bundle connects ordered user/item IDs, source/prefix identity,
count conversion, final Q, λ/rank, scorer version, both locks and the arrays' roles.
It keeps stored training P separate from request P_query. Swapping I0/I1 labels
without their factor rows or count columns can produce a numerically plausible
but incorrectly named score. A checksum can bind that wrong bundle too; it does
not establish the intended row mapping. Reject a mismatch against the declared
reference schema, or intentionally permute every corresponding object together.
Invalid factor width, stale prefix or changed scorer cannot leave an earlier
result displayed as a valid current forecast.

One chronological warm-customer comparison cannot establish universal superiority,
causal conversion lift, cold-item performance or repeat replenishment. The value
of this report is the observable question, actual stronger and weaker outcomes,
complete information lineage and visible limits. A larger or different task
needs its own labels, workflow and fresh assessment.
