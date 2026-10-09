## 7. Deeper branch: change the shape, not only the ruler

### Equal ratios, power families and fitted parameters

An affine map `(x−a)/b` changes every gap by the same factor. Sometimes equal ratios should have equal influence instead. On the constructed values 1,10,100, follow equal tenfold steps into equal log differences.

[[D24]]

Natural logs give 0, ln10 and ln100=2ln10. Each tenfold change adds ln10≈2.302585. This is useful when a multiplicative concentration change is the meaningful comparison. It does not justify logging an arbitrary signed measurement. log x requires x>0; log1p x means log(1+x), with a different domain x>−1 and a different offset.

Box–Cox supplies a family: for x>0, `gλ(x)=(x^λ−1)/λ` when λ≠0 and log x when λ=0. Why this log limit? Write x^λ=exp(λlog x); `(exp(t)−1)/t→1` as t→0. Multiplying by log x gives the result. At λ=1, Box–Cox gives x−1, an identity **up to an offset**, whereas the signed Yeo–Johnson family gives exactly x. The book's geometric-mean-normalized Box–Cox convention is another stated scaling; our ordinary sklearn route uses the unnormalized formula here.

For Yeo–Johnson, see the positive and negative pieces and the active branch before doing arithmetic.

[[D25]]

For x≥0, let v=1+x. Use `(v^λ−1)/λ`, or log v at λ=0. For x<0, let u=1−x>1. Use `−(u^(2−λ)−1)/(2−λ)`, or −log u at λ=2. The reflected negative branch joins at zero and uses exponent 2−λ. Thus x=−3 gives −7.5 at λ=0, −3 at λ=1, and −ln4≈−1.386294 at λ=2. Positive 3 at λ=1 gives 3 as well. “Negative inputs use a square root” misses the parameter dependence entirely.

[[L8]]

Begin at Yeo–Johnson x=−3, λ=2 with the logarithmic negative branch visible. Change x and λ to see the expression and coordinate move together. Box–Cox nonpositive x is a domain refusal, not a point to clamp into the plot. Near λ=0 or 2, `expm1` computes exp(t)−1 accurately without subtracting nearly equal floating-point numbers. `log1p` similarly computes log(1+t). Manually selecting λ is an exploration; it must not be labeled a learned parameter.

Fitting λ is a separate operation. Suppose a transformed scalar feature is approximated by a normal distribution with its mean and variance estimated at each λ. The normal log density, maximized over mean/variance, contributes `−n log(vλ)/2` up to constants, where vλ is the transformed **population** variance. But transformed densities must be measured in the original x units. The derivative g′ supplies a change-of-variables Jacobian; summing log|g′(xᵢ)| adds another term. Without it, shrinking all transformed numbers can falsely look like a better fit just by changing units.

Inspect both terms over a finite constructed training column and mark the selected λ on the computed curve.

[[D26]]

For positive Box–Cox data,

\[
\ell(\lambda)=-\frac n2\log v_\lambda+(\lambda-1)\sum_i\log x_i.
\]

For Yeo–Johnson, replace the sum of logs by `Σ sign(xᵢ) log(1+|xᵢ|)` in the Jacobian term. Positive branch derivative is (1+x)^(λ−1); negative branch derivative is (1−x)^(1−λ), giving that sign. Zero variance is degenerate: it is not an infinitely successful normalizing fit. Fit only on training observations, save λ, then optionally fit a separate affine standardization on those transformed training values.

The complete program implements forward/inverse families, objective terms and a bounded scalar search. SciPy's optimizer is a declared numerical primitive; it does not implement the owned transform or likelihood for us. Candidate endpoints are explicitly compared. State records name, bounds, selected λ, objective, evaluation count and whether the selection is interior, boundary or capped. A bounded local search is not a universal global optimum theorem. A boundary result is information that the specified search range mattered.

[[PROGRAM:fitted_power_maps.py]]

Read the inverse algebra alongside the code. For a nonzero exponent p, y=(v^p−1)/p implies `log v=log1p(py)/p`, requiring 1+py>0. This holds for either sign of p. In the zero-power limit log v=y. Undo the Yeo–Johnson sign/shift after recovering v or u. Box–Cox uses exp rather than expm1 because its original variable is v itself; Yeo–Johnson removes the added 1. The saved center/scale are undone before the family inverse.

The bounded Box–Cox fixture [1,2,4,10,30] selects about −.146859; the signed fixture [−3,−1,0,2,8] selects about .596210. These are small constructed fits, not ecology experiments. Same-λ comparison against the ordinary family and PowerTransformer verifies formulas, while attained likelihood and actual learned λ expose differences between bounded and library search. Do not assume every dataset's optima match. PowerTransformer standardizes by default; this code requests standardize=False for a clear family comparison. Work is O(n) per scalar objective evaluation, plus the search's evaluations. Domains, overflows and unsupported constant fits are refused. Better marginal shape does not guarantee jointly Gaussian features, correct regression residuals or better prediction.

### A fitted quantile map is not a new-batch rank

An illustrative rank map for sorted [1,2,3,4,100] uses `(rank−1)/4`, giving 0,.25,.5,.75,1. It forgets the large final numerical gap. That old illustration explains rank; it is not the exact fitted QuantileTransformer algorithm, particularly with ties and unseen values.

Switch to fitted value landmarks [1,2,2,4,100] and probabilities [0,.25,.5,.75,1]. Follow interpolation from a later value to its probability and, optionally, to a normal quantile.

[[D27]]

At a repeated landmark 2, ascending interpolation picks one edge of the tie interval and descending interpolation the other. Averaging gives (.25+.5)/2=.375. At 3, the interval from the last 2 at .5 to 4 at .75 gives .625. Below the fitted extent maps to 0, above to 1. Changing a later batch cannot recompute these landmarks; 3 alone and 3 beside 10000 must get the same coordinate.

Uniform output uses u directly. Normal output uses Φ⁻¹(u), the number below which a standard normal distribution places probability u. At u=.375 and .625, coordinates are about −.318639 and .318639. Since Φ⁻¹(0/1) is infinite, our explicitly declared finite clipping epsilon is 10⁻⁷; endpoints are about ±5.199338. This is a coordinate convention, not evidence for a normal scientific data-generating process.

[[L9]]

Change only the query, keeping landmarks visible. A query 1000 saturates at the upper endpoint. Many large values therefore merge. A duplicate 2 always receives the same tie result. Query edits never refit. Normal output changes numerical spacing again but preserves the declared ordering away from merged points.

The complete program saves column names, reference probabilities and fitted landmarks, skips NaNs during fit and preserves them in transformation. It implements both interpolation directions and the inverse's limited return to fitted value space. Exact inversion is impossible after saturation or merged ties. Its custom constant-column convention is 0 below c, .5 at c, 1 above c. Actual sklearn 1.9.1 maps the constant c itself to 0 in the checked uniform case, so the two policies are printed separately. Its normal endpoint source also uses 10⁻⁷ minus spacing(1) and a boundary tolerance; we compare supported interior values, not claim bit-level endpoint identity.

[[PROGRAM:fitted_quantile_maps.py]]

QuantileTransformer(n_quantiles=5, subsample=None, random_state=20) makes the ordinary landmark choice explicit. Subsampling can change fitted landmarks, so it must be part of a reproducibility statement. Sorting costs O(dn log n), and interpolation about O(qd log k) for q queries and k landmarks. This nonlinear marginal map can alter correlations and remove useful magnitude. A pleasant histogram is not a sufficient selection criterion.

### Add boundaries and interactions deliberately

Bins replace a measurement by an interval. Look at actual training points and the fitted edges before inspecting the one-hot interval coordinate.

[[D28]]

Uniform four-bin edges for [1,2,2,4,100] are [1,25.75,50.5,75.25,100]. Linear-quantile requested edges are [1,2,2,4,100]; merging duplicate edges leaves [1,2,4,100], only three effective bins. Equal requested counts do not guarantee equal populations when ties cannot be split by a value boundary. Our membership uses right insertion at an interior edge: x=2 enters the interval beginning at 2. Outside the fitted range stays in the first/last bin. A coordinate for a bin is not a continuous value within it; distinctions are intentionally lost.

K-means bins add a fitted-center mechanism. Assign each value to its nearest supplied center, update each nonempty cluster to its mean, repeat to a cap/tolerance, sort distinct final centers and form midpoint boundaries. The full local one-dimensional Lloyd loop declares earlier-center ties and retains an empty center. Invalid outer partitions from exceptional retained empty centers are refused. With [0,1,2,8,9,10] and initial centers [0,10], the first update gives [1,9], the next is unchanged, and the midpoint edge is 5. KMeans with an explicit (k,1) center array, n_init=1 and algorithm='lloyd' is the controlled comparator. KBinsDiscretizer(strategy='kmeans') is a separate route; it accepts neither init nor n_init and owns its own initialization. Stopping and empty-cluster rules can differ, so this supported match is not universal parity.

Polynomial features retain numbers and add products. Trace each exponent column from the constructed row (a,b)=(2,3).

[[D29]]

Degree two with bias gives [1,a,b,a²,ab,b²]=[1,2,3,4,6,9]. The exponent rows are (0,0),(1,0),(0,1),(2,0),(1,1),(0,2). A coefficient multiplying ab makes one variable's influence depend on the other. A model is still linear **in its coefficients**, though nonlinear in original measurements. Interaction-only omits a²/b² and keeps [1,2,3,6]. Adding a bias feature beside a model intercept duplicates a constant column. With d variables, total-degree-p features including bias number C(d+p,p); width and conditioning can grow quickly. The complete implementation bounds degree/width before allocation and refuses overflowing products.

The following program separately owns fitted bins, Lloyd updates, monomial generation and the stateless cycle function used shortly. Keeping functions separate makes their different state contracts visible. Ordinary KBinsDiscretizer specifies quantile_method='linear' and subsample=None, avoiding the version 1.9 default percentile change. PolynomialFeatures exposes powers_ so output order is checked directly.

[[PROGRAM:bins_polynomials_cycles.py]]

Inspect the retained warning about quantile bins too narrow to keep; it is the ordinary route documenting the merged-edge condition, not a failed calculation. Bin fitting uses O(n) reductions or sorting for quantiles; membership searches edges. Each Lloyd iteration compares n×k distances then reduces clusters, bounded by the recorded cap. Monomial evaluation costs proportional to output cells and exponent work; its combinatorial width is a modeling and storage choice. Capacity settings need training-only selection, not after-the-fact tuning on assessment outcomes.

### Draw the local basis before fitting a curve

A spline basis supplies local overlapping functions. Coefficients combine them into a curve; choosing the basis does not itself estimate those coefficients. Start with degree-zero interval indicators, then watch adjacent pieces combine at degree one.

[[D30]]

For full nondecreasing knots t₀,…,tₖ, define Bᵢ,0(x)=1 on [tᵢ,tᵢ₊₁), 0 otherwise. A higher-degree basis is

\[
B_{i,p}(x)=\frac{x-t_i}{t_{i+p}-t_i}B_{i,p-1}(x)
 +\frac{t_{i+p+1}-x}{t_{i+p+1}-t_{i+1}}B_{i+1,p-1}(x).
\]

A zero-width denominator contributes zero. This recurrence blends neighboring supported pieces; outside a piece's knot support its contribution is zero. Degree one makes triangles, degree two smoother pieces. For degree one and extended knots [−1,0,1,2,3], the supported base interval is [0,2]. At x=.5, the row is [.5,.5,0]; at x=2, [0,0,1]. Given coefficients [2,4,1], the first prediction is .5×2+.5×4=3 and the endpoint prediction 1. Nonnegative basis rows sum to one inside the supported interval, so a constant coefficient vector produces a constant function. Only nearby bases are active: this gives the design matrix its banded pattern and lets a coefficient change affect a local part of the curve.

The base knots [0,1,2] differ from the extended full knot vector. Our saved state extends each end by degree times the adjacent spacing, matching the inspected ordinary nonperiodic convention. A right endpoint uses its interior limiting value; the linear extrapolation derivative there is the **left** derivative. For degree one, using the outside derivative would choose the wrong piece at a knot. Constant extrapolation uses the nearest boundary basis row; error policy refuses outside values; linear policy continues with that interior derivative. Beyond the fitted interval, linearly extrapolated basis entries can be negative, so interior nonnegativity should not be advertised there.

[[PROGRAM:local_spline_basis.py]]

The program implements the complete recurrence, knot fitting/extension, basis design, derivative and saved extrapolation policy. NumPy provides arrays; SciPy BSpline independently compares supported rows; SplineTransformer supplies the ordinary preprocessing route with explicit knots, include_bias=True and handle_missing='error'. sklearn 1.9.1 raised a shape error for degree-zero constant extrapolation outside its interval in the first author check. The final comparison therefore checks degree-zero **interior** values, custom constant outside values separately, and degree-one/two outside policies. The failed source/streams remain in author evidence. A later repair fixed the custom right-boundary derivative before the final checked source. These are scoped findings, not a reason to assert all library splines are unreliable.

Natural cubic splines impose a different boundary constraint; they are not the same as this B-spline feature API. Full basis rows already sum to one, so another intercept can create rank dependence. Dropping a basis column is a parameterization choice. The transparent recurrence uses O(qpK) work and O(qK) workspace for q values, degree p and K intermediate bases; optimized routines exploit local support. It intentionally delegates no owned recurrence to the ordinary estimator. Missing input is refused rather than equated with the all-zero feature vector.

### Close a genuine cycle's seam

A direction wraps after a full turn; elapsed duration does not. Draw both coordinates of the unit circle so the seam has a geometric meaning.

[[D31]]

For period P, encode t as [cos(2πt/P),sin(2πt/P)]. NumPy expects radians; P=360 converts degrees. Angles 350° and 10° become approximately [.984808,−.173648] and [.984808,.173648], chord distance 2sin10°≈.347296. The raw 340-degree difference was a coordinate seam. Zero and 360 coincide by design. Sine alone merges 30° and 150° at .5; cosine distinguishes +.866025 from −.866025. P10 provides the full function and FunctionTransformer comparison.

[[L10]]

Move either angle and inspect both projections and chord. Try 1/359, opposite points, and the sine-only collision. Equal physical axis scales keep a circle circular. The map deliberately forgets completed cycles: that suits time of day or direction if the task is periodic, but it is wrong for elapsed hours when days of duration matter. Preserve a noncyclic magnitude coordinate when it carries required information.

## 8. Deeper branch: high-cardinality categories and target information

### Shrink noisy category estimates

One-hot width may grow large for many products or devices. A target encoding replaces a category by an estimate of its target behavior. For category c with n_c permitted donor targets and sum s_c, prior mean μ and smoothing α≥0, use `t_c=(s_c+αμ)/(n_c+α)` when n_c>0. For no donors use μ, including α=0; this explicit fallback avoids 0/0.

Draw the actual target cells contributing to the category average, then their weights on a scalar segment toward the prior.

[[D32]]

For one positive target, μ=.5 and α=2, t=(1+1)/3=2/3. Write it as `(n/(n+α)) category_mean + (α/(n+α)) μ`. The singleton receives weight 1/3; a category with 100 positives receives 100/102 and a result 101/102≈.990196. More support reduces the pull to the prior. At α=0 a supported category uses its own donor mean; large α approaches μ.

[[L11a]]

Change α while inspecting a singleton or the 100-row support fixture. Start at 2/3. The target counts and both weights remain visible. An absent category uses the prior. Shrinkage addresses unstable estimates, but it does **not** prevent a training row's answer from entering its own feature. These are different problems.

### Remove the row's fold from every target path

Without separation, an unsmoothed singleton encodes its own target exactly. Even with smoothing, its answer enters the numerator and often the prior. A downstream model can then learn an answer-containing input it will not have for a genuinely new row.

Switch to the retained constructed six rows. Follow all target-to-prior edges, not only the matching-category edge.

[[D33]]

| Row | Category | Target | Fold | OOF value, α=2 |
| --- | --- | ---: | ---: | ---: |
| 0 | A | 1 | 0 | 5/9 |
| 1 | A | 1 | 1 | 7/9 |
| 2 | B | 0 | 0 | 2/9 |
| 3 | B | 0 | 1 | 4/9 |
| 4 | C | 1 | 0 | 2/9 |
| 5 | C | 0 | 1 | 7/9 |

For held fold 0, donors are rows 1,3,5 with targets [1,0,0], giving μ=1/3. Row 0's A numerator uses target 1 from row 1 and 2μ=2/3; divide by 1+2 to get 5/9. For fold 1, donors 0,2,4 give μ=2/3, hence row 1 gets 7/9. All donor targets enter the prior, even categories that do not match. Computing a global μ before splitting would leave a leakage path around the category exclusion.

Change row 0's own target 1→0. Fold-0 encodings stay unchanged. Fold-1 values become [2/9,2/9,5/9]; B changed even though no B target changed, through μ. The exact retained historical program below computes this default α=2 example and its recorded stdout. It remains unchanged and was not replayed here. Its minimal callable is not a robust arbitrary-input API: α=0 with no matching-category donors can divide by zero, and empty donor sets are not validated. The new P9 below is the separately named supported successor.

[[PROGRAM:cross_fit.py]]

`donors = folds != held_fold` creates the permitted set. The prior is recomputed inside that loop; the inner category mask narrows those same donors. Reusing a target mean from all rows would change the dependency, even if many values looked similar on a small example. The printed null for row 0 tests exclusion, not absence of all statistical dependence between training features and other rows' targets.

[[L11b]]

Edit one category/target/fold cell and choose an inspected row with α fixed at 2. Begin at row 0=5/9. Flip row 3's target: row 0 becomes 7/9 via the prior while row 3's own encoding remains 4/9. Flip the inspected row's own target and inspect its null. The dependency arrows, donor IDs, numerator, prior and full output array must stay synchronized. Emptying a donor fold is an error, not a displayed NaN mislabeled as a valid encoding.

### Training and inference are intentionally different

OOF means out-of-fold: each training row's feature uses a permitted other-row fit. For a later external row, use a map fitted on the **whole outer training set**, because those targets are then available. Draw the two states and their row coverage side by side.

[[D34]]

With α=2 and the whole six-row training prior .5, full-fit A codes are .75, B .25, C .5; without smoothing (α=0), A=1, B=0, C=.5. These are different from the OOF values by design. The downstream model trains on OOF features, then sees full-fit encodings for later inference. The outer assessment targets enter neither state. TargetEncoder.fit_transform implements internal cross-fitting; fit(...).transform(...) does not produce those training OOF values. Explicit target_type='continuous' prevents integer-valued regression targets being inferred as multiclass; actual multiclass encoding expands columns for classes and is a separate shape contract.

The robust successor accepts explicit index pairs, validates nonempty disjoint donors, forbids repeated validation coverage and reports row coverage. It rebuilds sums **and priors** within every split. Group validation checks no group ID appears on both sides. Past-only validation requires max donor time < min held time. This is a local information contract; it does not select a scientifically appropriate outer split automatically.

[[PROGRAM:fitted_target_encoding.py]]

The ordinary same-fold comparison uses TargetEncoder(smooth=2, target_type='continuous', cv=splits). sklearn 1.9.1 requires every training row in validation exactly once for that internal cv API. Ordinary expanding TimeSeriesSplit leaves the earliest warm-up observations unvalidated; passing it as though it were a full-coverage drop-in is invalid. The chronological path here instead fits an ordinary encoder manually in each past-only window, transforms that window's future rows, and returns only the aligned retained row indices, features **and targets**. For this six-row example, rows [2,3,4,5] remain, targets [0,0,1,0], codes [1,1,.5,.5]; coverage [0,0,1,1,1,1] exposes the warm-up gap. There is no encoded placeholder trained on future targets.

Groups and time answer different dependence questions. Group-disjoint random folds can use later times; past-only windows can include repeated subjects. If the application needs both restrictions, each permitted donor pair must satisfy both, possibly reducing support substantially. A time/group rule cannot be inferred from a category string alone. This transparent reference scans a donor column for each distinct category: aggregation takes O(nv) for n donor rows and v categories, plus category sorting, repeated across K splits. A dictionary accumulation can reduce aggregation to O(n) per split; an optimized subtraction implementation must still preserve every donor restriction, including priors. Full-fit inference state is immutable. Reserved string markers remain validated, missing is one category, and unseen values use the fitted prior even at α=0.

### A fixed-width sparse map trades state for collisions

Hashing avoids fitting a vocabulary: a deterministic map assigns a token to a bucket and optionally a sign, then sums signed counts. Inspect every contribution for a deliberately constructed map, separate from the ordinary library's mapping.

[[D35]]

Let apple→(bucket0,+1), pear→(bucket0,−1), banana→(bucket1,+1). Counts apple3,pear1,banana2 give bucket0=3−1=2 and bucket1=2. This is sparse linear accumulation, not merely setting a binary membership flag. Opposite signs can cancel.

Now pass two different bags through that same map.

[[D36]]

Bag {apple:3,pear:1,banana:2} and bag {apple:2,banana:2} both give [2,2]. The original vocabulary/counts cannot be recovered from this representation alone. Increasing width changes collision pressure and model size; it does not remove the need to inspect what information the task can tolerate losing. Random signed maps have inner-product expectation results under their stated assumptions. A single small map does not prove that theorem, and signs do not eliminate every collision.

[[L12]]

Edit one token count or its constructed bucket/sign, keeping signed contributions and sparse bucket sums visible. Begin with the [2,2] collision; give apple and pear equal counts to see cancellation. Editing a zero-count token's map has no effect. A supplied-map unknown token is an explicit missing mapping error. The ordinary FeatureHasher panel uses separately observed mappings; it must not pretend this hand-designed apple/pear map is MurmurHash3.

[[PROGRAM:signed_feature_hashing.py]]

The scratch accumulator stores only touched nonzero buckets and refuses nonfinite counts, invalid signs or out-of-range buckets. Its arbitrary-string adapter explicitly uses SHA-256 bytes; the ordinary FeatureHasher uses its own mapping, whose actual single-token sparse vectors are printed. There is no fitted target information or learned vocabulary in either hashing operation. Work is O(number of input nonzeros), with sorting of touched buckets for deterministic output ordering in this reference. Output width still determines the downstream parameter/storage requirement. No speed benchmark is inferred from sparse code.

## 9. Deeper branch: completing data versus representing uncertainty

### Fit conditional relationships one column at a time

The earlier length-to-mass example described one turn. Now build the complete cycle on a constructed incomplete two-column table. Keep the original mask beside its initialized copy.

[[D37]]

Use rows [1,2], [2,4], [3,NA], [NA,8], [5,10]. Column medians initialize missing entries to 3 and 6, giving [3,6] for row 2 and [3,8] for row 3. Observed cells remain measurements; initialized cells retain their missing marker. Select column a as the first conditional target. Only rows 0,1,2,4 observed a; their b predictors include the current estimated 6 in row 2. A row may fit this conditional regression only if its target a was originally observed; its predictors may contain current estimates.

Draw the actual design, target, coefficients and product for this turn before advancing to b.

[[D38]]

For a from b, the first predictor column is [2,4,6,10], targets [1,2,3,5]. Fit `Σ(y−intercept−Aβ)²+α||β||²` with α=1 and an unpenalized intercept. Center A and y, append √α times the identity below centered A and zeros below centered y, then solve least squares. This augmented system minimizes the same ridge objective without explicitly forming an inverse. Restore intercept=ymean−Amean·β. The coefficient is about .4861111111 and intercept .0763888889, so missing row-3 a at b=8 becomes 3.9652777778.

Now fit b using its observed-target rows 0,1,3,4. Their a predictor values are [1,2,3.9652777778,5], including the **newly updated** a. The coefficient is about 1.8232290981 and intercept .5461393472, so missing row-2 b at a=3 becomes 6.0158266415. Feeding stale initialized a=3 into this second regression would fit a different model. Conditional cycling deliberately reuses current estimates, unlike P5's original-query distance rule.

After a sweep, repeat the ordered column loop. Stop at a declared tolerance or cap. Our tolerance compares the maximum row sum of absolute changes with tol times the largest absolute observed input, matching the configured ordinary criterion. A cap is not convergence. The three-sweep fixture ends at a cap with last change about .00013875; the ordinary warning is printed rather than suppressed as success.

Draw the ordered fitted models that a new row will actually use.

[[D39]]

Save each conditional model's target index, other-feature indices, coefficient and intercept **in order for every turn**. A later row starts from the training medians, keeps its own original missing mask, then applies that saved sequence only to its missing cells. It does not fit regressions on the query. Observed values are preserved even if a conditional predictor would suggest another number. Repeated deterministic transformation gives the same result. A row with all inputs missing is numerically transformable under the saved model but supported only by its assumptions and initial training summaries; do not call it rich new evidence.

[[L13]]

Inspect the initialized state and the first turn immediately. Change one missing input cell and step through the recomputed bounded trace. Keep observed-target row sets, current predictors and updated cells visible. The sweep inspector changes the viewed algorithm state, not permission to reveal an answer. A new-row panel applies the saved sequence without a backwards fitting edge. Unsupported all-missing training columns refuse a conditional fit.

[[PROGRAM:conditional_iterative_completion.py]]

This program uses NumPy's least-squares primitive for the linear solve, while owning mask, observed-target selection, ridge design, ordered updates, saved sequence and inference. The ordinary route explicitly enables experimental IterativeImputer, selects Ridge(alpha=1, solver='svd'), roman column order, median initialization, skip_complete=False and no posterior sampling. Supported fixture values and later rows match within stated tolerance. Full source/stream retains every turn's matrices and coefficients. General estimator heuristics or order choices can produce different sequences; there is no claim to clone every IterativeImputer configuration.

For S sweeps, d targets and n rows, work is S times the sum of conditional regression costs; with dense least squares on d−1 predictors this can be substantial. State stores every fitted model used at inference. Shared numerical primitives avoid teaching an unneeded matrix inversion engine. Misspecified relationships, poor conditioning, unconverged cycles or collection shifts can give poor fills. Deterministic iteration gives a single completed table, not proper multiple imputation.

### Several completions must become several analyses

Prediction preparation asks for usable inputs. Scientific inference asks how unknown values affect an estimate and its uncertainty. Treating a single completed table as observed can hide uncertainty from missing data. Multiple imputation creates several plausible completions under an explicit model, analyzes each, then pools **analysis estimates**, not raw table cells.

Look at actual completed matrices sharing observed cells and carrying different hatched missing entries. Follow each table into its own estimate Qₗ and estimated variance Uₗ.

[[D40]]

The order matters even without probability theory. If one unseen value could be completed as 0 or 2 and analysis squares it, analyzing first gives 0 and 4, average 2. Averaging the input first gives 1, whose square is 1. Pooling tables erased a nonlinear effect and all disagreement. The completion matrices in this drawing are the first three actual simulated tables from the bounded normal model developed below, paired with their own computed Q/U. They introduce the analysis sequence; their validity depends on that model's assumptions. The separate supplied Q=[9,10,11], U=[4,4,4] example next is arithmetic practice and is not attributed to these matrices. Arbitrary plausible-looking tables are not thereby proper stochastic imputations.

For m≥2 scalar analyses, define Qbar=mean(Qₗ), Ubar=mean(Uₗ), B=Σ(Qₗ−Qbar)²/(m−1). The total variance rule is

\[
T=\bar U+(1+1/m)B=\bar U+B+B/m,
\qquad SE=\sqrt T.
\]

Uₗ is a **variance**, in squared estimate units, not a standard error. B uses sample denominator m−1 because the finite set of completions estimates between-completion variability. The B/m term reflects finite-m simulation variation. Show these contributions on a squared-unit scale, keeping the standard-error length separate.

[[D41]]

For Q=[9,10,11] and U=[4,4,4], Qbar=10, Ubar=4, B=(1+0+1)/2=1, simulation=1/3 and T=16/3. SE≈2.309401, larger than √4=2. Identical Q gives B=0 while within-analysis uncertainty can remain. More completions reduce the finite-m term but cannot fix an inappropriate model.

[[L14a]]

Edit one estimate or variance and see all components immediately. Changing a Q affects the mean and between component; changing a U affects within variance. Negative variance and m=1 are refusals. The given tables/analyses are instructional objects, not evidence that an arbitrary completion sampler satisfies inferential assumptions. A standard error alone does not specify a universally valid confidence interval: degrees of freedom and the complete-data/imputation model matter.

[[PROGRAM:pool_scalar_analyses.py]]

The full O(m) scalar routine checks paired finite vectors and nonnegative U, computes every labeled term, and refuses invalid inputs. It does not silently use 1.96 for all intervals. Proper imputations and valid compatible complete-data analysis are conditions for using pooling inferentially, not consequences of applying this arithmetic. A predictive accuracy improvement supplies no evidence for those conditions.

### A bounded stochastic model with declared assumptions

To see what “stochastic completion” actually samples, use one scalar column [8,10,NA,12,NA]. This is constructed data under a marginal normal model with an ignorability/MCAR teaching assumption. There are no unimplemented MAR covariates. Let unknown mean μ and variance σ² have a proper normal–inverse-gamma prior: σ²∼inverse-gamma(α₀, scale β₀), and μ|σ²∼Normal(μ₀,σ²/κ₀), with positive κ₀,α₀,β₀.

Conditioning on n observed values updates

\[
\kappa_n=\kappa_0+n,\quad
\mu_n=(\kappa_0\mu_0+n\bar x)/\kappa_n,\quad
\alpha_n=\alpha_0+n/2,
\]
\[
\beta_n=\beta_0+\tfrac12\sum(x_i-\bar x)^2
 +\frac{\kappa_0n(\bar x-\mu_0)^2}{2\kappa_n}.
\]

These terms follow by completing the square in the normal likelihood times prior. Observed variation contributes the squared-deviation term; disagreement between the prior mean and observed mean adds the last term. Mean precision combines κ₀ with n. Given μ₀=0,κ₀=1,α₀=2,β₀=2 and observed [8,10,12], n=3, xbar=10, squared deviations sum 8. Thus κn=4, μn=7.5, αn=3.5, βn=2+4+37.5=43.5. The visibly influential prior is intentional and should be examined, not hidden behind “proper.”

For each completion, draw σ² from the posterior inverse gamma, draw μ conditionally using σ²/κn, then draw each missing value conditionally using σ². Draws of μ/σ² represent parameter uncertainty; conditional missing draws represent remaining value uncertainty. Keep all observed cells exactly fixed. Analyze each completed mean Q and complete-data variance-of-mean U=s²/N before pooling. The normal sample variance uses N−1; N is total completed row count, distinct from the n observed values used for the posterior.

[[PROGRAM:normal_completion_and_sensitivity.py]]

The program publishes posterior parameters, all five seed-20 completed tables, per-completion Q/U and pooled components. Different seed/m values show a changed realization without a large simulation campaign. The ordinary SciPy normal_inverse_gamma route receives (μn,κn,αn,βn); identical posterior parameters and conditional identities are the relevant bridge. Its actual draws happen to agree for this environment/seed, but cross-generator random sample equality is not the contract. A no-observation case needs explicit prior-only opt-in, and at least two total rows are needed for the stated complete-data variance calculation.

A proper prior makes this model a defined posterior; it does not prove frequentist coverage of every pooled interval or justify the model for real penguin gaps. Unbounded normal draws can be unsuitable for physical nonnegative quantities. Choose a scientific model respecting the estimand and support, inspect diagnostics and assess sensitivity rather than patching negative draws into false observations.

[[L14b]]

Now assume the missing values differ by an additive δ from this baseline completion model. Change δ while all random baseline draws and observed cells stay fixed. With two of five values missing, each completed mean moves by (2/5)δ. Seed-20 pooled means are about 7.886461,8.686461,9.486461 for δ=−2,0,2. If no values are missing, δ has no effect. This sensitivity parameter is **assumed**, not identified from observed data; the curve shows which conclusion depends on that assumption. It does not diagnose actual MNAR.

The ordinary R route below demonstrates a complete mice→with→pool workflow and scalar pooling call. It is a separately optional tool example, with source authored but R execution **not claimed** in this Python environment. The tiny constructed regression is instructional, not a coverage experiment; actual analysis must inspect logged events, trace behavior, model compatibility, degrees of freedom and support. Including an outcome in a scientific imputation model differs from giving unavailable deployment targets to a predictive pipeline.

[[PROGRAM:multiple_imputation_mice.R]]

The Python completion work is O(mN), plus each analysis, for m completions and N total rows. Saving all tables costs O(mN); streaming analyses can reduce storage if preserving complete tables is unnecessary for the teaching or audit. More sophisticated conditional/multilevel models, survey weights and a full causal identification theory belong to later specialist work. The local lesson remains: unknown values require explicit assumptions, analysis comes before pooling, and uncertainty/sensitivity are different from deterministic input preparation.
