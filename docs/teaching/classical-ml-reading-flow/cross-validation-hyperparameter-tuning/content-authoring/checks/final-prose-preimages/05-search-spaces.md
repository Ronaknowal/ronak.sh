<a id="5-search-the-settings-you-actually-mean-to-compare"></a>
<a id="search-spaces"></a>
## 5. What does the search give a chance to win?

The inner loop compares recipes. Before choosing a search algorithm, write down what one recipe contains. In our six-card example, a card names both the neighbour count and the scaling rule. A scaler is part of the candidate even though it does not appear in the final voting formula: it changes the distances that determine the neighbours.

<!-- Drawing D22: visual-specifications.md#d22. -->

Read the parameter tree from the complete pipeline down to its leaves. In the real program below, `classify__n_neighbors` reaches the `classify` step; `prepare__numeric__scale` reaches the numeric branch of the preparation step. The double underscore is a path through nested estimator objects, not a separate statistical operation. With k in {3,5,11} and scaling in {standard,robust}, the Cartesian product has 3×2=6 complete configurations. Every configuration receives a fresh fitted preparation and predictor in every inner fold. The sampling-only reference uses shorter card labels `k` and `scaler`; they identify recipes before being mapped to estimator paths.

A conditional space is a union of products. Suppose one branch is a linear support-vector model with two values of C, and another is an RBF model with two C values and two gamma values. There are 2+2×2=6 useful cards. Gamma controls the RBF kernel's distance scale; it has no role in the linear branch. Giving the linear branch meaningless gamma settings creates duplicate effective recipes and distorts a sampling distribution. A list of separate parameter dictionaries expresses the conditional structure directly.

### Spend trials on coordinates, not just combinations

Imagine a two-parameter recipe when only the horizontal parameter affects the loss. A three-by-three grid pays for nine fits but visits only three horizontal values. Nine independent continuous draws almost surely visit nine horizontal values. Project both point sets onto the horizontal ruler before comparing the full clouds.

<!-- Drawing D23: visual-specifications.md#d23. -->

The vertical stripes represent an **illustrative** loss that depends only on the horizontal coordinate. They are not measured performance. The grid's repeated horizontal positions coincide in the projection; the seeded random draws have nine distinct projected values. If both coordinates matter through a narrow interaction, this picture alone cannot establish which search will work better. Grid search remains useful for small meaningful discrete spaces and interpretable comparisons. Random search spends the budget across more values of potentially influential coordinates, provided its distribution assigns useful regions enough mass. Neither picture guarantees a better fitted model.

### A distribution is a scientific choice

For a parameter that acts multiplicatively, equal increments can be a poor default. A regularization parameter C might reasonably range from 0.001 to 1000: changing 0.001 to 0.01 and changing 100 to 1000 are both tenfold changes. Place equal lengths on a logarithmic ruler, then map them back to ordinary values.

<!-- Drawing D24: visual-specifications.md#d24. -->

Draw U uniformly between 0 and 1, set Z=log(a)+U[log(b)−log(a)], then set C=exp(Z), with 0<a<b. Since a short interval dC has logarithmic length dC/C, the density on the ordinary ruler is

\[
f_C(c)=\frac{1}{c\log(b/a)},\qquad a\le c\le b.
\]

For a=0.001 and b=1000, each of the six decades has probability 1/6. On a linear-uniform ruler, the last decade [100,1000] receives 900/999.999 of the mass, about 90%; the first [0.001,0.01] receives only 0.009/999.999. A log axis must carry its actual decade labels; equal drawn distances there do not mean equal differences in C. Zero, negative, equal or inverted endpoints refuse this distribution. A valid mathematical range also needs domain judgment: an enormous interval can waste nearly all trials on useless settings.

Conditional branch probabilities matter too. Choose one of two branches with probability 1/2, then uniformly choose within that branch. If they contain two and eight unique settings, an individual setting has mass 1/4 in the small branch and 1/16 in the large branch. This differs from uniform sampling over their ten-setting union. Declare whether the goal is equal branch opportunity or equal configuration opportunity; naming both “random search” hides that difference.

### What does a trial budget promise?

Call a region acceptable before computing the probability: perhaps all recipes within a specified loss tolerance under the declared selection protocol. Let p be the sampling distribution's mass in that region. With T **independent draws with replacement**, the probability of missing every time is (1−p)^T, so

\[
\Pr(\text{at least one acceptable draw})=1-(1-p)^T.
\]

<!-- Drawing D25: visual-specifications.md#d25. -->

At T=60, p=0.05 gives 0.9539302010; p=0.01 gives 0.4528433576. These are probabilities of visiting a region, not classification accuracies, and do not guarantee identifying its best member from noisy scores. For desired hit probability q, take T≥log(1−q)/log(1−p), then round up. At p=0.02 and q=0.95 this requires 149 draws. If the trials are adaptive, dependent or without replacement, this independence calculation needs replacement by their actual law. Duplicating the same evaluated recipe is not a new independent opportunity to visit the region.

Numerically, evaluate the independent formula as `-expm1(T*log1p(-p))` for interior p, with explicit p=0 and p=1 endpoints. Directly subtracting a power very close to one can lose precision. This implementation detail preserves the same probability argument.

<!-- Drawing D26: visual-specifications.md#d26. -->

On six finite cards, two acceptable, three draws **without replacement**, there are binomial(6,3)=20 equally likely unordered triples and binomial(4,3)=4 all-unacceptable triples. The hit probability is 1−4/20=4/5. Independent replacement draws instead give 1−(4/6)^3=19/27≈0.703704. The adjacent finite investigation edits acceptable card membership, budget and seed; probabilities update from the current mass, while the actual sampled cards remain a separate random realization. Three draws might miss despite either positive probability. With zero draws or no acceptable cards the probability is zero; drawing all six without replacement hits whenever at least one is acceptable. Asking for more than six without replacement is a refusal, not a reason to silently change sampling mode.

`parameter_spaces_and_sampling.py` implements these objects before invoking ordinary sampling tools. `cartesian_grid` enumerates complete cards, `conditional_grid` preserves branch structure, `finite_hit` uses exact integer combinations, and `log_uniform` implements the inverse transform with finite positive endpoint checks. The two-dimensional arrays printed at the end are the actual seeded points used in D23, with their projections counted directly.

<!-- Programme P08: insert parameter_spaces_and_sampling.py and actual full stdout here. -->

Read the sampled card IDs separately from the exact probabilities. Seed 19 produces the printed replacement and without-replacement lists, but a seed is not an extra guarantee. The ordinary comparisons use `ParameterGrid`, `ParameterSampler` and a configured `RandomizedSearchCV`; no estimator fit is needed to inspect what they propose. With only lists, `ParameterSampler` samples without replacement; introducing a distribution with `rvs` changes the route to replacement sampling. For a list of dictionaries, branch selection also affects per-setting mass. Check these documented semantics when constructing a space rather than transferring the finite-card formula to every API call. [ParameterSampler documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.ParameterSampler.html).

The code is a transparent finite reference. Its grid costs grow with the number of enumerated configurations; it cannot enumerate a continuous space. Exact Python combinations avoid integer overflow but are still unnecessary when a stable analytic form exists. Search quality also depends on metric noise and the choice rule. We now read a complete real selection record, keeping those ingredients visible instead of treating its largest number as the whole experiment.
