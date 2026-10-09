## 10. Practice: explain the representation before choosing the function

Attempt each question before opening its hint or solution. The activity IDs T1–T26 identify tasks across the core and deeper branches. Use the fitted rules, source rows and saved state from the worked examples to reason through changed inputs. Each solution explains the tempting wrong route as well as the calculation.

### T1. Follow a missing measurement without erasing another fact

Take an independent copy of source row 309, set mass to missing and sex to female. List features, target, numeric mask and the information allowed to fill the gap. Does absence in one cell make sex unknown?

<details><summary>Hint</summary>Keep one mask bit per numeric input, separate from the target and categorical policy.</details>
<details><summary>Solution</summary>The features are [51,18.8,203,NA,female], the target remains Chinstrap in the held-out record, and numeric M=[0,0,0,1]. Sex is observed, giving the fitted female coordinate; it is neither missing nor an unseen string. The frozen training median 4000 fills mass before its saved center/scale apply. Held-out species and later input distribution may not refit those statistics. The filled coordinate is an estimate with mask 1. Treating the whole row as “missing” would discard observed information; treating species as an input would reveal the answer.</details>

[[RETAINED_PRACTICE:1:T2]]

[[RETAINED_PRACTICE:2:T3]]

[[RETAINED_PRACTICE:3:T4]]

[[RETAINED_PRACTICE:4:T5]]

[[RETAINED_PRACTICE:5:T6]]

### T7. Keep every original coordinate before adding recording history

Extend the retained P1 mechanism with one indicator for every numeric input column. Transform [15,500,NaN] with category b, checking the first six coordinates, three indicators and unchanged fitted state. Then implement a **distinct** robust-ruler successor keeping the same fill/vocabulary. The full callable implementations are in masked_simple_imputation.py, with the complete changed-input answer function in practice_solutions.py.

<details><summary>Hint</summary>Save np.isnan(input) before filling. Fit the robust ruler on the already-filled training matrix, not on the query.</details>
<details><summary>Solution</summary>The filled row is [15,500,7]. Standard numeric coordinates are [(15−20)/√50,(500−300)/√20000,0]=[−1/√2,√2,0]. The retained category order a,b,not_recorded gives [0,1,0]; original missing indicators [0,0,1] are appended. The result has width 9 and approximately [−.707107,1.414214,0,0,1,0,0,0,1]. The filled training first column [10,20,30,20] has median 20 and linear IQR 5; second [100,300,300,500] median 300 and IQR 100; constant third uses divisor 1. Robust query coordinates are [−1,2,0], giving [−1,2,0,0,1,0,0,0,1]. Snapshot fills, centers, scales and vocabulary before transform; exact comparison afterward verifies no mutation. Recovering the mask from completed values is wrong because an observed 7 and filled 7 coincide. Fitting only missing-at-training indicators misses the new third-column absence; all-feature indicators retain its bit.</details>

[[RETAINED_PRACTICE:6:T8]]

[[RETAINED_PRACTICE:8:T9]]

For an additional changed branch in T9, evaluate x=−3 at λ=2 and λ=0.

<details><summary>Hint</summary>The negative exponent is 2−λ; identify its zero-power limit before calculating.</details>
<details><summary>Solution</summary>At λ=2 the branch is −log(1−x)=−ln4. At λ=0 its exponent is 2, so −(4²−1)/2=−7.5. The λ=1 identity preserved above and these two changed cases show why a generic square-root explanation fails.</details>

[[RETAINED_PRACTICE:7:T10]]

### T11. Distinguish a byte identity from an experiment

The current CSV is a 15586-byte CRLF file, while the historical receipt binds a 15241-byte LF input. What checks justify saying they contain the same observations? May we call the old experiment a fresh run against the current download?

<details><summary>Hint</summary>Check an exact normalization relation and parsed row order; an equal data table is not a new process execution.</details>
<details><summary>Solution</summary>Replacing CRLF by LF yields the historical exact SHA-256 and size; parsing both gives all 344 identical rows, columns and NA cells in order. The newline count explains the 345-byte size difference. This establishes a source relation. It does not execute the program, refit models or refresh versions. Bind both raw identities, label the current download separately from the historical executed input, and reuse the retained output with its original date/environment. The setup metadata supplies full hashes rather than relying on abbreviated names.</details>

### T12. Equal predictions, different penalties and storage

Compare x=[1,100], w=[1,.01] with x′=[1,1], w′=[1,1]. Compute predictions and squared coefficient norms. Center `[[0,0,3],[1,0,0],[0,2,0]]` and count nonzeros.

<details><summary>Hint</summary>Multiply coefficients by the same divisor used on each coordinate; sparse zero support is about actual entries.</details>
<details><summary>Solution</summary>Both dot products are 2. The coefficient norms squared are 1+.0001=1.0001 and 1+1=2. A fixed ridge penalty therefore changes even with equal predictions. Matrix column means are [1/3,2/3,1]; centered rows [−1/3,−2/3,2], [2/3,−2/3,−1], [−1/3,4/3,−1] all contain three nonzeros, so support grows 3→9. Scale-only sparse transformation can preserve original zeros; representing nonzero centered values as zeros would alter the data, not optimize storage.</details>

### T13. Let training counts own the rare policy

Fit a×4,b×1,missing×1 with rare threshold 2, keeping missing separate. Transform b,new,missing,a under infrequent-if-present. What happens with only a×4 during fit? Try a real label `@missing`.

<details><summary>Hint</summary>Inspect the vocabulary, not just the vector width.</details>
<details><summary>Solution</summary>Counts are a×4,b×1,@missing×1. Fitted rare set={b}; columns sorted as @missing,@rare,a. Rows are b=[0,1,0],new=[0,1,0],missing=[1,0,0],a=[0,0,1]. With only a×4 no rare bucket exists; new becomes [0] under the declared fallback. The literal @missing as a measured category is refused by the reserved-prefix rule, preventing a collision with absence. sklearn's native min_frequency may group the missing marker because it is infrequent; use explicitly pregrouped categories for our same-policy comparison. Query labels never change the fitted counts or width.</details>

### T14. Expose forbidden query feedback

For k=1, donors are [0,0,NA], [2,100,100], [3,0,200], query [1,NA,NA]. Fill both missing targets using original-query distances. Then deliberately feed the first fill back into the distance for the second target. Explain the difference and the tie convention.

<details><summary>Hint</summary>For the first target all donors have b, while for c the first donor is ineligible. Original overlap uses only a.</details>
<details><summary>Solution</summary>Original squared distances are3,3,12. Custom source-order tie picks donor 0 for b, giving 0. For c, donor 0 lacks c and is excluded; donor 1 is nearest, giving 100. Correct output is [1,0,100]. If completed b=0 is illegally treated as observed before choosing c, donor 1 adjusted squared distance is (3/2)(1+10000)=15001.5, donor 2 is (3/2)(4+0)=6; it gives 200. The wrong algorithm outputs [1,0,200]. P5 and the answer file compute both and assert the contrast. This does not say conditional iteration is wrong: section 9 deliberately specifies current-estimate predictors under another model. It says two algorithms cannot be silently mixed. With an all-target-missing training column our default rejects; no tie convention can invent evidence.</details>

### T15. Feature-only leakage is still a fitting dependency

A held-out row changes the fitted quantile landmarks or determines whether a category passes the rare threshold. No targets were used. Is this safe assessment? Contrast an externally specified schema.

<details><summary>Hint</summary>Ask whether the map uses information available before the assessment row arrives.</details>
<details><summary>Solution</summary>The assessment feature distribution influenced a fitted rule. That can make the representation adapted to the examples judging it. Split first and refit landmarks/count thresholds inside each permitted training set. A category schema declared independently beforehand is different from vocabulary estimated from all assessment-inclusive rows. Pipeline helps only when it receives training-only input at fit. It cannot repair subject/time leakage, post-outcome features or manual pre-fitting outside it.</details>

### T16. Report the real result without a winner claim

Write a deployment-facing paragraph interpreting 38,67,84,85,85 correct out of 86 under the retained controls. Name one next decision and one limitation; do not run a new campaign.

<details><summary>Hint</summary>Identify the shared split, k and category policy before differences.</details>
<details><summary>Solution</summary>An acceptable report says: “On the preserved seed 20 stratified split of 344 Palmer Penguins rows, five-neighbor models shared 258 training/86 assessment indices and category fill/one-hot policy. Raw numeric inputs got 67 correct, standard 84, min–max 85 and robust 85, against training-majority 38. Scaling changed this model's useful geometry on this collection; one extra correct case does not establish a generally best scaler. We would compare proposed preprocessing inside training-only development splits and reserve separate assessment, matching future population/group/time availability. Deployment also needs schema, unknown-category and new-missingness monitoring.” Omitting the baseline, changing the objective after seeing scores or calling 85 versus 84 proof of superiority fails the report's purpose.</details>

### T17. Invert a stable power map, then refuse an invalid input

Evaluate Box–Cox(4,λ=10⁻⁹), invert log4 at λ=0, and try Box–Cox(0,λ=0). What may a selected bound in a fitted λ search mean?

<details><summary>Hint</summary>Use expm1(λlog4)/λ and the exact logarithmic branch.</details>
<details><summary>Solution</summary>The first value approaches ln4≈1.3862943611, with tiny finite-λ correction, rather than zero from cancellation. Inverting y=ln4 at λ=0 gives exp(y)=4. Zero violates Box–Cox's strictly positive domain, so the program raises ValueError; patching it to epsilon changes the map and dataset. A best tested boundary can indicate the search range restricted the fit; it is reported with bounds/status, not described as a global optimum. The full answer function calls the stable implementation and its inverse; same-λ ordinary comparison tests formulas separately from optimizer choices.</details>

### T18. Query landmarks and bin edges without refitting

For fitted [1,2,2,4,100] landmarks/probabilities, transform later 3 and 1000 uniformly. Fit four requested linear-quantile bins and assign x=2. Can an inverse recover 1000?

<details><summary>Hint</summary>Distinguish averaging tie endpoints from interpolating after the last duplicate; exact bin edges use right insertion.</details>
<details><summary>Solution</summary>The tie 2 maps(.25+.5)/2=.375. Later 3 is halfway from last 2 at.5 to 4 at.75, giving.625. Later 1000 saturates at 1. The inverse of 1 returns fitted endpoint 100, losing the original 1000. Quantile edges [1,2,2,4,100] merge to [1,2,4,100], three effective bins;2 enters bin index 1, beginning at 2. A later batch containing 1000 cannot refit those edges or references. Ties can prevent equal bin populations; preserving the requested count in a label would misdescribe the actual representation.</details>

### T19. Inspect a product, a local basis and a cyclic ambiguity

Construct degree-two features for (2,3), calculate degree-one B-splines at.5 for full knots[−1,0,1,2,3], and compare angle30°/150° using one versus two trigonometric coordinates.

<details><summary>Hint</summary>List exponent pairs; at.5 only two neighboring triangles are active.</details>
<details><summary>Solution</summary>Exponent pairs (0,0),(1,0),(0,1),(2,0),(1,1),(0,2) give [1,2,3,4,6,9]. At.5, recurrence weights produce B0=.5,B1=.5,B2=0, row sum 1. Coefficients [2,4,1] give 3. Both angles have sine.5, but cosine is±√3/2, so [cos,sin] distinguishes them. Neither product width nor a period should be chosen from held-out outcomes. A supplied bias plus model intercept needs a parameterization decision; a duration without periodic meaning should not wrap.</details>

### T20. Separate unsmoothed full-fit and OOF codes

Use the six-row A/A/B/B/C/C table, α=0 and the same alternating folds. Compute full-fit/OOF arrays, then encode an absent category from a nonempty donor set. Why did the retained short example need a successor?

<details><summary>Hint</summary>Each held fold has exactly one donor from each category in this particular fixture; the general no-match case is separate.</details>
<details><summary>Solution</summary>Full-fit codes are[1,1,0,0,.5,.5]. OOF codes are[1,1,0,0,0,1]: each C row sees the other C target. An absent category uses the donor prior even with α=0; for fitting only a→1 it returns 1, avoiding0/0. The retained α=2 short calculation is valid for its demonstrated fixture but lacks empty/no-match validation. P9 validates those boundaries and keeps the original source/output unchanged. Smoothing and exclusion are separate: α=0 does not itself decide which targets are permitted.</details>

### T21. Keep groups and time constraints explicit

There are two rows per person and monthly arrivals. An expanding two-window split validates rows 2–3 from donors 0–1, then 4–5 from donors 0–3. Which rows have training features, and can that splitter directly satisfy TargetEncoder 1.9's full OOF cv contract?

<details><summary>Hint</summary>Write the coverage vector before choosing an API. Then inspect person overlap separately.</details>
<details><summary>Solution</summary>Coverage is [0,0,1,1,1,1]; only rows [2,3,4,5] have chronological OOF features, and targets must be selected by exactly those indices. Warm-up rows 0–1 are not filled using future targets. TargetEncoder's internal cv requires each validation index once, so this expanding splitter violates its full-row coverage contract. Fit/transform manually per window and return the aligned subset, as P9 does. Also require max donor time&lt;min held time; if the two rows per person straddle a boundary, exclude that person's donor row too or choose a group/time design matching the question. Random group folds alone need not be chronological. Repeated validation or shared group IDs are refused by the supported checks.</details>

### T22. Break one constructed collision without claiming a theorem

The apple+/pear− bucket0 and banana+ bucket1 map sends bags(3,1,2) and (2,0,2) to [2,2]. Change the second bag's apple count to 3. What changes? Does this show signed hashing is unbiased?

<details><summary>Hint</summary>Recompute bucket sums; expectation is over a specified random-map family.</details>
<details><summary>Solution</summary>The first remains[3−1,2]=[2,2]; the second becomes[3−0,2]=[3,2], separating them. Changing bucket assignment could also separate particular bags but can create another collision elsewhere. This one deterministic map does not establish an expectation theorem or remove irreversibility. The program's actual FeatureHasher token map differs from our constructed map and is printed separately. A sign changes a contribution, not its declared bucket.</details>

### T23. Complete one conditional sweep and save its route

Use the two-column table from section 9, α=1, a-then-b order and one-sweep cap. Work the fitting row sets, coefficients and missing updates. Transform later [3,NA] with the saved sequence. Does the cap certify convergence?

<details><summary>Hint</summary>Initialize medians [2.5,6]; after fitting a use its updated value in the b design.</details>
<details><summary>Solution</summary>For a, observed rows 0,1,2,4 give b=[2,4,6,10],y=[1,2,3,5], β≈.4861111111, intercept≈.0763888889. Missing row 3 a becomes 3.9652777778. For b, observed rows 0,1,3,4 now use a=[1,2,3.9652777778,5],y=[2,4,8,10]; β≈1.8232290981, intercept≈.5461393472. Row 2 b becomes 6.0158266415. Save both ordered models. Later [3,NA] preserves observed 3 and applies the b model to give 6.0158266415; it does not refit. One sweep ends at a cap, not a convergence guarantee. All observed cells must compare exactly unchanged. The answer program prints this complete table and query, with the full mechanism source already visible.</details>

[[RETAINED_PRACTICE:9:T24]]

For T24, also compare “analyze 0/2 by squaring then average” with “average0/2 then square.”

<details><summary>Hint</summary>Nonlinear analysis and averaging need not commute.</details>
<details><summary>Solution</summary>The analysis-first mean is (0²+2²)/2=2, while the square of mean input is 1²=1. This is why the completed-data analyses, and their variance estimates, enter pooling. B=8/3 and T=13/3 from the retained task are variances in squared-estimate units; standard error is √(13/3). Validity still depends on the imputation/analysis models.</details>

### T25. Separate stochastic variation from an assumed sensitivity shift

Use P16's [8,10,NA,12,NA], seed 20,m=5. Compare seed 21,m=3, then δ=−2,0,2 with baseline draws fixed. State exactly which cells may change and what conclusion the sensitivity curve supports.

<details><summary>Hint</summary>Two of five values are missing; posterior parameter draws and δ have different roles.</details>
<details><summary>Solution</summary>Observed 8,10,12 stay exact in every table. Changing seed/m changes simulated μ,σ² and missing draws, hence realized Q/U; it is not new sampling evidence about model accuracy. With the same seed/m, δ changes only the two missing entries, moving every completed mean by 2δ/5. The seed 20 pooled mean is about 8.686461; δ=−2 gives 7.886461, δ=2 gives 9.486461. δ=0 recovers baseline exactly, and no missing cells makes every δ a null. This is an explicit assumed departure from the marginal normal/MCAR teaching model, not an identified MNAR estimate. A proper prior or more completions does not prove universal pooled interval coverage. The full answer code prints the actual realizations and the setup records their environment.</details>

### T26. Build a representation for a new sensor task

The input has amount in declared physical units, direction in degrees, ordered grade low/medium/high, nominal device IDs and deployment gaps. All are available before the target. Use training amounts [10,20,NA,40], angles [350,10,30,150], grades [low,high,medium,low], IDs [a,a,b,missing]. Transform later amounts [30,NA], angles [359,1], grades [medium,new], IDs [c,missing]. Implement and compare one justified pipeline without turning this into a tuning campaign.

<details><summary>Hint</summary>Choose a fit-owned amount fill/ruler, period-owned circle, supplied grade order and fitted rare policy. Keep the target outside the preparation function.</details>
<details><summary>Solution</summary>An acceptable complete implementation is sensor_solution() in the answer file. Median amount 20 fills training to [10,20,20,40]; its saved mean/scale standardize later 30 and filled 20. A stateless period 360 circle supplies cosine/sine, preserving the 359/1 seam. Domain-supplied grade order maps medium 1 and unknown −1; monitor that unknown policy rather than pretending it is a valid lower grade. Device threshold 2 yields @missing,@rare,a columns; c maps to the existing rare bucket, missing stays separate. Append one original amount-missing indicator. The output is 2×8 with ordered names amount,cos_direction,sin_direction,grade,@missing,@rare,a,amount_missing. The ordinary ColumnTransformer uses the same explicitly pregrouped device policy, numeric Pipeline, FunctionTransformer and OrdinalEncoder, then appends the mask; a numerical assertion compares rows. Amount magnitude is preserved by an invertible affine map rather than row-normalized away. Direction wraps because its domain is cyclic; elapsed duration would need a separate coordinate. A rubric checks feature availability, units/period, fit/transform state, target separation, schema, unknown/missing distinctions, output comparison and deployment monitoring. Another pipeline can be acceptable if its different information choices are justified and tested.</details>

The entire answer asset below contains the indicator successor check, changed donor counterexample, nonlinear/basis/encoding/pooling examples and complete sensor implementation. It imports the new supported teaching modules in this same downloaded directory; it never imports the three old top-level mains. It is listed separately as a **solution** file so an exercise download does not reveal answers inadvertently.

[[PROGRAM:practice_solutions.py]]
