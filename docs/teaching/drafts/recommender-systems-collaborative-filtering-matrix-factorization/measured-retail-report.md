### The recorded comparison

Here are the complete declared alternatives' recorded values. Recall, RR, AP
and NDCG average over the 68 January customers with qualifying discovery truth;
precision and fill average over all 200 requests. K is 10. These are fractions,
not percentages. Displayed values are rounded to six decimal places; the full
report keeps per-customer values, undefined masks and score/order arrays.

| Validation rule | NDCG | Recall | AP | RR | Precision | Fill |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Popularity | 0.172752 | 0.212643 | 0.093969 | 0.290412 | 0.029000 | 1.000000 |
| Binary item cosine | 0.148276 | 0.167517 | 0.089229 | 0.228402 | 0.026500 | 1.000000 |
| ALS rank 4, λ=0.1 | 0.187875 | 0.256901 | 0.105688 | 0.250444 | 0.033000 | 1.000000 |
| ALS rank 4, λ=1 | 0.185113 | 0.244646 | 0.104452 | 0.251062 | 0.033000 | 1.000000 |
| ALS rank 8, λ=0.1 | 0.162610 | 0.207506 | 0.091386 | 0.245577 | 0.028500 | 1.000000 |
| ALS rank 8, λ=1 | 0.162746 | 0.208119 | 0.091817 | 0.242291 | 0.028500 | 1.000000 |

Rank 4 with λ=.1 has the highest validation NDCG and is both the selected
overall rule and the best factor setting. Rank 8 did not improve this declared
criterion. The selected rank-4 model alone was refitted on the prefix; none of
the other three factor settings acquired test numbers through an extra fit.
The actual prefix contains 2,463 occurrences on 2,042 distinct user–item pairs,
so adding the two monthly nonzero counts would have overstated its pair count.

For February, relevance metrics use the 48 qualified customers, while precision
and fill still use all 200 requests. All three prefix rules are retained:

| Test rule | NDCG | Recall | AP | RR | Precision | Fill |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Popularity | 0.133250 | 0.151885 | 0.084224 | 0.197330 | 0.013500 | 1.000000 |
| Binary item cosine | 0.190692 | 0.265749 | 0.113978 | 0.267361 | 0.018000 | 1.000000 |
| ALS rank 4, λ=0.1 | 0.206214 | 0.289096 | 0.124745 | 0.261500 | 0.022000 | 1.000000 |

The selected rule's NDCG exceeds popularity here by 0.072964.
The paired-user 95% percentile interval is
[-0.005122, 0.155089], which includes zero.
The recall difference is 0.137211, with interval
[0.043980, 0.235890]. These intervals
condition on this workflow, selected warm cohort and month; they do not cover
every source of uncertainty or establish causal conversion lift. Item cosine
also overtakes popularity on this test criterion despite lower validation NDCG;
that observation does not retroactively change the locked winner.

Only 171 qualifying test discovery pairs fall in the fixed catalogue, while
1,185 discovered pairs lie outside it. A fill value of 1 means ten slots were
issued; it does not mean ten useful items, complete market coverage, or known
stock availability. The 152 requests without catalogue discovery truth remain
undefined for relevance metrics rather than being assigned false zero labels.

The easier sampled-candidate diagnostic increases the selected rule's NDCG to
0.446449.
It uses the same scores but retains all known positives and at most 20 other
eligible items. That different candidate distribution is why it must not be
substituted for full-catalogue performance or used to choose a setting.

The ordinary direct-solve implementation agrees within the predeclared
absolute 1e−8/relative 1e−7 tolerances. Maximum differences are about 5.77e−15
for training P, 1.61e−15 for Q, 1.50e−15 for direct query scores and 1.28e−15
for package recalculation on its own final Q. Stored training users remain
different from fresh request users. The last item block is stationary to about
1.31e−13, but the user block after that last item update has residual about .606:
ten sweeps are the declared budget, not a joint-convergence claim. The recorded
OpenBLAS warning reports 12 internal threads even though the model's explicit
thread setting is 1; this performance configuration warning was retained.

