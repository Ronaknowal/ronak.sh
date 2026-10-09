## 14. Practice, explain and transfer the decision

Close the solutions for your first attempt. Before calculating, name the evidence
available to the request, the target, the denominator and the objective. A score
can be algebraically correct while answering the wrong question. The early
missing-versus-zero checkpoint remains useful: in [0, missing, 4], identify the
mask and explain why the observed mean is 2 rather than 4.

### A. Audit a past request

At time 20, a learner asks for recommendations. A candidate was released at 23,
similarities were computed from events through 30, and a validation setting was
chosen using events 21–25. Which parts may serve the time-20 request? Repair the
replay without using later information.

<details><summary>Get a hint</summary>

A valid configuration choice and a valid historical information set are separate
constraints. Put each availability time on the request's clock.

</details>
<details><summary>Show explained solution</summary>

The unreleased candidate is ineligible. Similarities through 30 include future
interactions. The setting chosen using events 21–25 was also unavailable at 20
unless a separate earlier experiment had already fixed it. Use configuration
decisions and fitted artifacts available by 20, and filter releases at or before
20. Alternatively move the request after validation, refit that allowed prefix
and assess on later untouched outcomes. That is a different experiment, so its
report must name the changed request and information boundary.

</details>

### B. Explain a signed neighbor prediction

A user's baseline is 3. Two usable neighbors have ratings 1 and 5, with signed
weights −.5 and .25. Calculate the centered prediction. What happens if both
neighbors fail the support rule?

<details><summary>Get a hint</summary>

Subtract the declared baseline before weighting; the denominator is the sum of
absolute weights, not their signed sum.

</details>
<details><summary>Show explained solution</summary>

The residuals are −2 and 2. Contributions are (−.5)(−2)=1 and .25×2=.5.
Their sum 1.5 divided by |−.5|+|.25|=.75 gives a residual prediction of 2.
Add the baseline to obtain 5. If neither neighbor is accepted, the denominator
is zero and the declared fallback is 3. A negative similarity reverses a
residual's direction; it is neither a negative purchase count nor the library's
positive-neighbor policy.

</details>

### C. Give a different rank-one completion

Only the two diagonal entries of a 2×2 matrix are observed, both equal to 1.
Construct another completion and prove its rank. Does similar validation
performance at ranks 2 and 4 prove an intrinsic population rank of 2?

<details><summary>Get a hint</summary>

Choose nonzero off-diagonal entries whose product is 1. Separate an algebraic
statement about this completed matrix from a finite experiment's evidence.

</details>
<details><summary>Show explained solution</summary>

The matrix [[1,3],[1/3,1]] has determinant 1−3×(1/3)=0 and is nonzero, so its
rank is one. Its second row is one-third of its first. It fits both observations
while choosing different missing values. Similar validation scores only say that
the particular trained settings were not distinguished on that evaluation.
Noise, sample size, optimization and regularization can obscure differences;
they do not identify the rank of an unobserved population matrix.

</details>

### D. Recompute a simultaneous gradient step

Use p=(.2,.4), q=(−.3,.5), user bias .05, item bias .1, rating 2, mean 3,
λ=.2 and η=.1 in the local gradient objective. Determine the error's sign and
all updated values. Explain which buffers a finite-difference comparison needs.

<details><summary>Get a hint</summary>

The old score is 3.29. Use its single old error for every gradient before
recomputing any score.

</details>
<details><summary>Show explained solution</summary>

The error r−s is −1.29. Loss gradients for (p₁,p₂,q₁,q₂,bᵤ,bᵢ) are
(−.347,.725,.198,.616,1.3,1.31). Subtracting η times these gradients gives
p′=(.2347,.3275), q′=(−.3198,.4384), bᵤ′=−.08 and bᵢ′=−.031.
The new score is about 2.957519; the declared local objective falls from .8873
to .504838. The complete changed loss, including its local penalty, is the
finite-difference target. Using p′ inside q's update would instead calculate
another operation and would not equal these simultaneous gradients. The
retained changed-program output demonstrates that comparison without requiring
another historical fit.

</details>

### E. Match the penalty to the equation

One user has four observed records. One objective includes λ‖p‖²/2 inside
each record; another includes it once per entity. Which normal-system diagonal
matches the first objective? What changes for a user with no records?

<details><summary>Get a hint</summary>

Collect all copies of this user's penalty before differentiating.

</details>
<details><summary>Show explained solution</summary>

Four copies contribute 4λ‖p‖²/2, so the normal system adds 4λI rather than λI.
With no records, this degree-weighted objective has no term involving p and
does not identify it uniquely. Selecting p=0 is then a convention. A positive
once-entity penalty still exists for an empty user and uniquely minimizes that
block at zero. Therefore matching a parameter named “regularization” is
insufficient; match the complete summed objective and its population.

</details>

### F. Solve a changed implicit block

Keep item vectors (1,0), (0,1), (1,1), but use counts (0,3,1), α=1 and λ=2.
Form targets, confidence, A and b; solve for p and calculate the block objective.
What happens if all counts become zero?

<details><summary>Get a hint</summary>

The first pair still contributes confidence 1 to curvature. Only positive-target
pairs enter the right-hand side.

</details>
<details><summary>Show explained solution</summary>

Targets are (0,1,1) and confidence is (1,4,2). The outer products plus 2I give
A=[[5,2],[2,8]], while b=(2,6). With determinant 36, solving yields
p=(1/9,13/18). Its scores are (1/9,13/18,5/6), approximately
(.111111,.722222,.833333). The full weighted squared residual plus penalty is
13/9, including the unobserved first pair. The augmented least-squares route
agrees with this normal system. With all counts zero, b=0 and positive λ gives
p=0; dropping every unobserved pair would describe a different objective.

</details>

### G. Diagnose a reversed pair

Use p=(1,.5), positive item qᵢ=(.5,1), sampled item qⱼ=(1.5,0), η=.1 and
λ=.1. Calculate the old gap and one updated gap. Must one update correct the
order or improve full-list NDCG?

<details><summary>Get a hint</summary>

Use g=σ(−Δ), and keep all three old vectors until every update is calculated.

</details>
<details><summary>Show explained solution</summary>

Old scores are 1 and 1.5, so Δ=−.5 and g≈.622459. The new vectors are
p′≈(.927754,.557246), qᵢ′≈(.557246,1.021123) and
qⱼ′≈(1.422754,−.031123). Their new gap is about −.216619. The local loss falls
from 1.211577 to 1.034794, yet the pair remains reversed. This is progress on
one regularized sampled comparison, not a complete order repair or a guarantee
about held-out full-list quality. The sampler and assessment populations still
matter.

</details>

### H. Keep the evaluator's denominator fixed

With relevant items {0,1}, list [4,1,2,0,3] and K=2, calculate precision, recall,
reciprocal rank, AP and NDCG. Move item 1 to the first slot. If retrieval entirely
omits item 0, can reranking reach recall 1?

<details><summary>Get a hint</summary>

Use the lesson's AP denominator min(K,R). The ideal contains both eligible
relevant items even if the candidate generator misses one.

</details>
<details><summary>Show explained solution</summary>

Initially one of two returned items is relevant: precision=recall=.5. Its first
hit is at rank 2, so RR=.5. AP=(1/2)/2=.25. DCG=1/log₂3 and
IDCG=1+1/log₂3, giving NDCG≈.386853. With item 1 first, precision and recall
remain .5, RR=1, AP=.5 and NDCG≈.613147. If item 0 is absent from candidates,
only one of the two relevant items can be returned, giving a recall ceiling of
.5. Reducing R to the retrieved relevant set conceals that candidate failure.

</details>

### I. Explain a new item's limits

A metadata map gives a new item a factor vector. A new user has no history or
declared preferences. Can a dot product establish individual personalization?
Propose a defensible first list and an assessment.

<details><summary>Get a hint</summary>

Cold-item and cold-user problems are different missing inputs. Ask what evidence
supports the user port, not only whether the arrays have matching widths.

</details>
<details><summary>Show explained solution</summary>

The map supplies the item representation, not a justified user representation.
An arbitrary p does not establish this person's taste. One possible response is
an eligible popular list with subject diversity and optional lightweight
onboarding; a contextual baseline is another defensible choice if its inputs
are declared. Assess held-out new users and items using metadata available at
request time, report fallback coverage, and measure the intended useful outcome.
Several policies can be reasonable. Their evidence, permissions and outcome
criteria determine whether the proposal is sound.

</details>

### J. Change the logging mixture

Rewards occur with probabilities .4 for action A and .8 for B. Logging chooses
each action with probability .5; the target chooses A with .25 and B with .75.
Calculate raw and IPS expectations and the one-request IPS variance. Diagnose
logging B=0 when the target still gives B positive probability.

<details><summary>Get a hint</summary>

Reward weights are .5 for A and 1.5 for B. Enumerate action and reward before
subtracting the squared expectation from the second moment.

</details>
<details><summary>Show explained solution</summary>

Raw expectation is .5×.4+.5×.8=.6. The target/IPS expectation is
.25×.4+.75×.8=.7. The weighted second moment is
.5×.4×.5²+.5×.8×1.5²=.95, so variance=.95−.7²=.46. If B has no logging
support, the logs cannot identify its reward distribution under a target that
chooses B. Knowing B's toy reward probability from the question does not make
that quantity available in an actual A-only dataset.

</details>

### K. Interpret the changed experiment report

The retained complete experiment includes a predeclared cutoff-18 comparison
with test_start=26. Read its saved output. Report split sizes, selected settings,
baseline and factor errors and cold-user count. Then propose a fresh assessment
for a newly released item.

<details><summary>Get a hint</summary>

The comparison is already declared and printed. It is not a search through test
results for a favorable cutoff. Distinguish data used to select from data used
to assess.

</details>
<details><summary>Show explained solution</summary>

The split is 18/7/6. Validation selects rank 2 and penalty .2 with RMSE≈1.180979.
Test RMSE is about 1.111143 for the shrunk-item baseline and 1.128322 for factors.
There are five warm-user events and one cold-user event; the latter factor error
is about .671405. This tiny synthetic outcome supports neither population
superiority nor robust cold-start performance nor causal benefit. It preserves
the weaker factor result instead of disguising it.

For a new-item assessment, reserve items released after fitting and use only
metadata available before each request. Keep their later interactions out of
factor fitting and feature construction until the declared boundary permits
them. Compare an explicit content/hybrid fallback with an eligible
nonpersonalized/content baseline, report new-item coverage and the intended
outcome or ranking metric, and retain a later untouched period. Future rating
means are not legal initial metadata.

</details>

### L. Calculate the user-centered alternative

Use ratings [[5,1,missing],[4,2,3],[1,5,5]]. Predict U0's missing I2 rating using
full-training user means, cosine of user-mean-centered values on common items,
minimum common support 2 and all signed eligible neighbors. Compare a
positive-neighbor-only policy.

<details><summary>Get a hint</summary>

The first two items form both overlaps. Do not include the missing target in
U0's mean. Center similarities with the declared full-row means.

</details>
<details><summary>Show explained solution</summary>

Means are 3, 3 and 11/3. U0's overlap residuals are [2,−2]; U1's are [1,−1],
so their similarity is 1. U2's overlap residuals are [−8/3,4/3], giving
similarity −3/√10. Their I2 residuals are 0 and 5−11/3=4/3.
The prediction is therefore
3+[1×0+(−3/√10)×(4/3)]/[1+3/√10]
=3−4/(√10+3)≈2.350889. Positive-only selection retains U1 and gives 3.
Centering each pair by its overlap means changes the similarity definition;
silently switching to that Pearson convention is not evidence of parity.

</details>

### M. Distinguish score invariance from penalty invariance

Let p=q=(1,0) and A=diag(2,1). Use p′=Ap and q′=A⁻ᵀq. If the dot product
stays unchanged, must a positive once-entity L2 objective stay unchanged?

<details><summary>Get a hint</summary>

Calculate the two new vectors and their squared norms separately. Compare with
an orthogonal rotation.

</details>
<details><summary>Show explained solution</summary>

p′=(2,0) and q′=(.5,0) still have dot product 1. The squared-norm sum changes
from 1+1=2 to 4+.25=17/4. Thus unchanged predictions do not preserve a
positive isotropic L2 penalty under every invertible coordinate transformation.
An orthogonal rotation preserves both dot products and norms, leaving that
objective unchanged. Anonymous factor coordinates therefore lack a unique
semantic axis even though regularization limits some rescaling freedoms.

</details>

### N. Keep the history step simultaneous

Take p=(0,0), q=(1,0), two unique history vectors y₀=(1,0), y₁=(0,1), mean 3,
rating 5, η=.1 and λ=0. Hold the biases fixed at zero for this factor-only
calculation. Compute one simultaneous factor/history update and diagnose using
the new q inside y's update. What does a duplicated rating occurrence change?

<details><summary>Get a hint</summary>

h=(1,1)/√2 and e=2−1/√2. Every derivative reads the old h and old q.

</details>
<details><summary>Show explained solution</summary>

The old score is 3+1/√2. With e=2−1/√2,
p′=(.1e,0), q′=(1+.1e/√2,.1e/√2),
y₀′=(1+.1e/√2,0) and y₁′=(.1e/√2,1).
Using q′ in the two history updates adds artificial terms of order η² and
does not implement the gradient of the original old-buffer loss. In the
canonical scratch convention a duplicate rating occurrence repeats a loss term
but does not duplicate the unique history set or its √2 denominator. Counted
HKV confidence is another rule. Surprise's occurrence-list history can instead
repeat that item and normalize by the larger list length, so the scratch
deduplication must not be generalized to the library.

</details>

### O. Solve one constrained item-weight column

For X=[[1,1,0],[0,1,1],[1,0,0]] and λ=1, predict I2 with learned item weights
whose self-weight is zero. Solve the excluded-column ridge system and score
the row [1,1,0]. Why is setting only the final predicted value to zero a different
operation?

<details><summary>Get a hint</summary>

The remaining I0/I1 design has normal system A=[[3,1],[1,3]] and b=[0,1].
The constraint belongs to the coefficient column during fitting.

</details>
<details><summary>Show explained solution</summary>

The determinant is 8, giving weights −1/8 and 3/8 on I0 and I1 and zero on I2.
The row's score is −1/8+3/8=1/4. In the full inverse-Gram route,
P₂₂=8/13 and the off-diagonal ratios −P₀₂/P₂₂, −P₁₂/P₂₂ yield the same
coefficients. P is symmetric, but division by each column's own diagonal does
not generally make B symmetric. The zero self-coefficient prevents direct
copying of an observed input item; erasing a final prediction after fitting
does not impose that fitting constraint or repair the other coefficients.

</details>

### P. Separate entry risk from observed-entry averages

Use losses [1,4;2,3] and propensities [1,.5;.25,1]. Compute the expected
observed-entry mean and the fixed-four-entry IPS risk. Diagnose replacing a
positive-target cell's propensity with zero.

<details><summary>Get a hint</summary>

Losses 1 and 3 are always observed. Optional-cell states none, only loss 4,
only loss 2 and both have probabilities 3/8,3/8,1/8,1/8.

</details>
<details><summary>Show explained solution</summary>

Those four states have observed means 2,8/3,2,5/2. Their expectation is
(3/8)2+(3/8)(8/3)+(1/8)2+(1/8)(5/2)=37/16.
Using the fixed denominator 4 and inverse propensities instead gives state
risks 1,3,3,5, whose expectation is 5/2, the complete-grid mean.
An individual IPS value 5 can exceed the range of the original four losses;
unbiased expectation does not mean each sample equals truth. Positive target
weight with zero observation propensity is unidentified. An absent Retail
purchase does not provide a known exposure propensity, and this entry-risk
unit is different from the request-action policy tree in J.

</details>

### Q. Diagnose a saved item-ID fault

A saved Q has the expected width, but I0/I1 names are swapped without moving
their factor rows. A new checksum is calculated over the resulting bytes.
Does that prove the rule retains the intended item meanings? State a valid
repair and the empty-history boundary.

<details><summary>Get a hint</summary>

Trace one named item's dot product to its fitted row. Hash integrity and the
intended schema mapping answer different questions.

</details>
<details><summary>Show explained solution</summary>

Matching dimensions prove only that the multiplication can be formed. A fresh
checksum can faithfully identify a wrongly named state. Compare the complete
bundle with its expected source, reference IDs, row order and parameters.
Restore the original map, or deliberately permute the item IDs, Q rows and all
corresponding CSR columns together. A stale name-only permutation is invalid.
In the declared positive-λ HKV rule, an empty fixed history gives b=0 and p=0.
Biased-rating baselines and SVD++'s separate explicit p describe different
empty-history contexts and should not inherit that conclusion indiscriminately.

</details>

### R. Report the real task without changing the winner

Suppose validation selects popularity. Only 48 of 200 test customers have
eligible discovery truth in the fixed catalogue, while many purchases lie
outside it. What may the report claim, and which rule must the saved consumer
serve? Propose one independent extension.

<details><summary>Get a hint</summary>

Locate both pretruth locks, the qualified-user denominator and the all-user
coverage denominator. Unknown exposure is still unknown after scoring.

</details>
<details><summary>Show explained solution</summary>

Serve the actual selected popularity rule. A best-ALS inspector remains a
comparison and must not be relabelled the winner. Report all baseline/factor
outcomes, macro metrics over the 48 qualified customers, coverage over all 200,
outside-catalogue truth and null metrics for users without qualifying truth.
Paired intervals are conditional on the declared task/cohort and do not remedy
unobserved exposure or catalogue omissions. Keep both selection locks, warnings
and fixed candidate filters; do not select a different cohort or rule after
seeing test outcomes. An extension could evaluate replenishment with a newly
declared repeat-item target and independent later period, or compare a larger
train-selected catalogue. It needs its own prospective protocol rather than
retroactive relabelling of this discovery assessment. Reproducible reports and
honest limits do not imply a required score improvement or a causal benefit.

</details>

### Readiness and the next topic

Explain how one named rating, count or history occurrence becomes a model term.
Calculate a changed update or solve without mixing old and new buffers. Diagnose
a wrong denominator, confidence encoding, saved ID map or unavailable historical
input. Then choose an assessment that can answer the actual decision question.
The solved tasks give concrete checks of these skills; they do not guarantee
every future recommendation problem is solved by the same finite method list.

The next topic is **Multi-Label & Multi-Output Learning**. It also asks for several
outputs for one input, but its reviewed targets, missingness and loss need their
own definition: a sortable item score table is not already a joint label
probability model. Follow the course's Next control in curriculum order. The
optional degree-adjusted graph branch connects to **Message Passing / Graph
Convolutions**, where the full aggregation and graph-learning machinery is
taught; the local recommendation forward remains understandable on its own.

### Further learning

These are alternate explanations and activities, rather than required links
for completing the core worked examples.

* **Leskovec, Rajaraman and Ullman — [Mining of Massive Datasets, chapter 9](http://infolab.stanford.edu/~ullman/mmds/ch9.pdf).** Freely available book chapter; begin after the evidence and neighborhood sections. Its utility matrices, co-rating/normalization, factor nonuniqueness and exercises offer a longer beginner-to-intermediate route. The historical Netflix setting explains motivations, not current universal performance.
* **Zhang et al. — Dive into Deep Learning, [overview](https://d2l.ai/chapter_recommender-systems/recsys-intro.html), [data](https://d2l.ai/chapter_recommender-systems/movielens.html), [matrix factors](https://d2l.ai/chapter_recommender-systems/mf.html) and [ranking](https://d2l.ai/chapter_recommender-systems/ranking.html).** Interactive book and code, intermediate after the local factor/gradient walkthrough. Selected version-1.0.3 sections were read. Its strictly positive rating-scale zero shortcut and data split differ from this lesson's explicit finite-zero mask and global train/choice/test replay; API and dataset-license requirements need separate attention.
* **Google Developers — [matrix-factorization lesson](https://developers.google.com/machine-learning/recommendation/collaborative/matrix).** Short introductory visual explanation of shared user/item representations. Compare its weighting discussion with the distinction between observed ratings and all-pair confidence here; it does not establish equality of every library objective.
* **Stanford CS246 — [public 2019 lecture archive](https://snap.stanford.edu/class/cs246-videos-2019/) and [recommendation slides](https://snap.stanford.edu/class/cs246-2025/WWW/slides/07-recsys1.pdf).** Recommender Systems I (January 29) and II (January 31) are a spoken companion for the intermediate neighborhood/factor material. The public listing and selected companion slides' co-rating/centering content were inspected; no full-video viewing is claimed. These are conceptual resources, not current package installation instructions.

### Technical references

The following sources support the declared equations, assumptions, implementation
conventions and data provenance.

* **Sarwar et al. — [Item-Based Collaborative Filtering Recommendation Algorithms](https://grouplens.org/site-content/uploads/Item-Based-WWW-2001.pdf), §§3.1–3.3.** Original cosine/Pearson/adjusted-cosine definitions, weighted prediction and precomputation. The selected co-rater formulas were read from rendered pages; signed residual prediction and positive-neighbor aggregation remain different policies.
* **Koren, Bell and Volinsky — [Matrix Factorization Techniques for Recommender Systems](https://gwern.net/doc/ai/tabular/2009-koren.pdf).** The original eight-page paper, hosted on a mirror, develops biased factors and implicit history. Its illustrative genre axes do not establish identifiable learned coordinates; its historical comparisons do not declare a universal winner.
* **Salakhutdinov and Mnih — [Probabilistic Matrix Factorization](https://papers.nips.cc/paper/2007/file/d7322ed717dedf1eb4e6e52a37ea7bcd-Paper.pdf), equations 1–5.** Gaussian masked likelihood and prior yield the variance-ratio once-entity MAP penalty. A MAP vector is a point estimate, not automatically a posterior uncertainty interval.
* **Hu, Koren and Volinsky — [Collaborative Filtering for Implicit Feedback Datasets](https://yifanhu.net/PUB/cf.pdf), §§3–5.** Confidence-weighted all-pair loss, cached Gram normal equations and inverse-system score contributions. Missing-pair confidence 1 supplies curvature; an exact signed score decomposition is not a causal explanation.
* **Rendle et al. — [BPR: Bayesian Personalized Ranking from Implicit Feedback](https://arxiv.org/pdf/1205.2618), §§3–4.** Preference triples, posterior objective, bootstrap sampling and factor derivatives. The original publication predates its arXiv upload; sampler populations determine the objective being approximated.
* **Steck — [Embarrassingly Shallow Autoencoders for Sparse Data](https://arxiv.org/pdf/1905.03375), §§3–3.4.** Constrained ridge, zero diagonal and inverse-Gram column normalization. The dense solve's item² storage and cubic work are material limitations.
* **Schnabel et al. — [Recommendations as Treatments](https://proceedings.mlr.press/v48/schnabel16.pdf), §§3.1–4.2.** Selection, propensity-weighted entry risk, support and variance. Entry-observation propensities and request-action logging probabilities require different units; this Retail dataset supplies neither exposure mechanism.
* **He et al. — [LightGCN](https://arxiv.org/pdf/2002.02126), §§3.1–3.3.** Bipartite degree-adjusted aggregation and layer mixtures support the bounded graph forward. The local calculations do not reproduce its complete graph-training experiments or assert present superiority.
* **implicit — [CPU ALS API](https://benfred.github.io/implicit/api/models/cpu/als.html), [CPU BPR API](https://benfred.github.io/implicit/api/models/cpu/bpr.html), [0.7.3 ALS source](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py), [BPR source](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/bpr.pyx) and [release record](https://pypi.org/project/implicit/).** The versioned source determines positive stored confidence, signed target-zero entries, filtering/recalculation and the BPR sampler/item-bias implementation. API documentation's banner version and the actual executed package version are separate facts.
* **Surprise — [matrix-factorization API](https://surprise.readthedocs.io/en/stable/matrix_factorization.html), [KNN API](https://surprise.readthedocs.io/en/stable/knn_inspired.html), [similarities](https://surprise.readthedocs.io/en/stable/similarities.html), [1.1.5 source](https://github.com/NicolasHug/Surprise/tree/v1.1.5/surprise) and [release record](https://pypi.org/project/scikit-surprise/).** Named raw/inner IDs, pair-overlap Pearson centering, full-row mean prediction, positive neighbors and occurrence-list SVD++ history are the relevant contracts. Its initialization and record penalties need not match the scratch objective.
* **Chen — [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail), DOI 10.24432/C5BW33, CC BY 4.0.** Dataset provenance, fields, time range and redistribution license. The prepared subset credits the source and states transformations; invoices do not establish exposure or stock availability.
* **Covington, Adams and Sargin — [Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/).** The official 2016 abstract supports the historical separation of candidate generation and ranking. It is not a claim about today's entire deployed service.
