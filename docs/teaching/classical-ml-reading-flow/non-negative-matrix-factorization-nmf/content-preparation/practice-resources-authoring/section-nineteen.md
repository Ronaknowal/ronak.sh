## 19. Solve changed tasks, use files and follow useful next questions

The tensor and phase examples ended with a distinction we have used throughout: a calculation can be correct without establishing every interpretation we hope to attach to it. These tasks ask you to carry the mechanism into changed inputs, diagnose a plausible wrong answer, and choose a justified implementation. Attempt each visible prompt before opening its hint or solution. Nothing here gates the live labs.

Start with amounts and objectives (A–B, F–K), then interpretation and evaluation (C–E, L–O), then initialization, penalties and extensions (P–X). That order is suggested support, not a requirement to hide the deeper tasks. A correct scalar answer is only part of success: show the addressed arrays, state what was held fixed and explain what the result permits you to conclude.

### Practice A: preserve the observation when normalizing

**Task.** Two patterns are `H=[[2,0,1],[0,1,2]]`, with amount row `[1,3]`. Compute the observation, then make each pattern sum to one without changing any reconstructed bin. Are the original amounts probabilities?

**Hint.** A pattern's row mass is the factor by which its associated amount must grow when you divide that pattern by its mass.

**Reasoned solution.** The contributions are `[2,0,1]` and `[0,3,6]`, so the observation is `[2,3,7]`. Both pattern masses are 3. The new patterns are `[2/3,0,1/3]` and `[0,1/3,2/3]`; compensated amounts `[3,9]` reconstruct the same two contributions and the same observation. Their sum is 12, not one. Dividing these compensated amounts by 12 gives shares `[1/4,3/4]` of total reconstructed mass under this normalization; it also requires keeping that total mass to reconstruct the observation. This convention does not make the original coefficients calibrated probabilities or identify physical sources.

**Tempting wrong route.** Divide `[1,3]` by its sum while leaving `H` unchanged. You obtain `[0.5,0.75,1.75]`, a different observation.

**Success check.** Supply both contribution vectors before/after, all three equal reconstructed cells, and the difference between an amount and a sum-one share.

### Practice B: one fixed-factor multiplicative update

**Task.** Let `X=[[2,1],[4,3]]`, `W=[[1],[2]]`, and `H=[[1,1]]`. Keep `W` fixed and do one Frobenius multiplicative update of `H`. Compute the resulting half-squared loss.

**Hint.** The numerator `W.T@X` and denominator `(W.T@W)@H` each have one component row and two feature columns.

**Reasoned solution.** The numerator is `[10,7]`, `W.T@W=5`, and the denominator is `[5,5]`. Elementwise multiplication by their ratio gives `Hnew=[2,7/5]`. The predictions are `[[2,7/5],[4,14/5]]`. The only nonzero residuals are `-2/5` and `1/5`; their squared sum divided by two is `1/10`. In this special one-component fixed-W problem, the two independent feature quadratics have positive curvature 5 and nonnegative unconstrained minimizers `[10/5,7/5]`, so that step happens to be the exact block optimum. That does not make one general alternating sweep exact.

**Tempting wrong route.** Treat the ratio as matrix division or transpose the feature cells into separate observations.

**Success check.** Show the shaped intermediate products, the prediction, residuals and the reason this particular block is solved.

### Practice C: distinguish a useful pattern from a biological source

**Task.** Someone chooses six components, observes a low reconstruction error and concludes, “There are exactly six biological sources; the largest coefficient is the strongest source.” Describe a concrete evaluation and independent domain evidence that would be needed to defend a source claim.

**Hint.** Chosen rank, coefficient units, predictive usefulness and physical identity answer different questions.

**Reasoned solution.** One acceptable response is: compare candidate ranks using a declared held-out reconstruction or downstream task metric, with fitting and selection restricted to training/validation roles. This assesses usefulness of a representation, not the true source count. Compare each component's invariant weighted contribution, rather than a raw coefficient whose size can be changed by compensated scaling. Then validate a proposed biological interpretation against independent markers or controlled mixtures that distinguish alternatives with equally good products. The application must establish relevant measurement and mixture assumptions. Neither a low error nor a visually localized pattern alone verifies source identity or causation. Other experimentally justified validation designs are valid answers.

**Tempting wrong route.** Rename component rows after familiar substances and use the reconstruction error as independent confirmation.

**Success check.** Name one actual assessment procedure, one independent validation source, and a scale-invariant comparison; do not invent clinical performance or claim six causes from `k=6`.

### Practice D: remove an actual saved contribution

**Task.** Use saved reserved source row 256, not the first displayed row. Remove the component with the largest **total** contribution, holding all other amounts and the dictionary fixed. Identify the component, describe the 64-bin change, and compare MSE. Then find a zero-change removal in source row 242.

**Hint.** Rank `W_ic * sum_j H_cj`, not `W_ic` alone. The supplied `describe_saved_row` uses zero-based code component indices.

**Reasoned solution.** Source 256's largest coefficient is C7, but its largest total addend is C8. Set component index 7's gain to zero. Every reconstructed bin loses the corresponding cell of `W_256,7 * H_7`; this full 8×8 addend is printed in [Inspect an actual digit dictionary and contribution](#12-inspect-an-actual-digit-dictionary-and-contribution). MSE changes from `0.02758816154887481` to `0.0732625383196997`. This is a descriptive removal from the preserved k8/seed19 factors, not a refit and not the new k6 comparison. Some bin residuals can get closer to zero even while the total error worsens. An exact fixed-H NNLS optimum could not improve under this feasible amount change; finite solver tolerance is the qualification for the saved numerical code.

For source 242, C8 has zero amount. Removing that component changes no prediction cell. The relevant complete program calls are `describe_saved_row(saved,256,component=7,gain=0)` and `describe_saved_row(saved,242,component=7,gain=0)`. `load_saved_digits()` verifies the supplied payload/CSV identities; it never fits missing factors as a fallback.

**Tempting wrong route.** Choose C7 from its raw coefficient, silently refit the remaining components, or use current array position 256 instead of global source ID 256.

**Success check.** State source/component IDs, the all-bin subtraction rule, both MSEs, fixed-versus-refitted roles and the source242/C8 null case.

### Practice E: repair representation leakage

**Task.** A document classifier learns TF-IDF and NMF from all documents and then splits their encodings for classifier training and testing. Repair its evaluation flow.

**Hint.** The representation itself learns vocabulary, document frequencies and patterns, even before a classifier sees labels.

**Reasoned solution.** Split source documents first. Within each training fold, fit the vocabulary/count mapping, IDF weights and NMF dictionary on that fold's training rows, then transform validation rows using those fitted objects. Fit the classifier using only training encodings/labels. Select the full preparation-plus-model configuration by validation; reserve the test documents for the final selected procedure. An OOV test word cannot create a test-derived column or update an IDF. A known fixed measurement conversion such as the digit `/16` ruler is different from a learned corpus statistic. If a deployment task intentionally permits transductive access to unlabelled future data, declare and evaluate that different information setting rather than describing it as ordinary held-out testing.

**Tempting wrong route.** Split only the classifier while leaving the globally learned representation untouched.

**Success check.** Name all learned objects, their fit/transform roles and the assessment boundary, including the classifier. Explain why labels need not have been used for leakage to occur.

### Practice F: test joint convexity numerically

**Task.** For scalar observation `x=2`, both factor pairs `(w,h)=(1,2)` and `(4,0.5)` reconstruct it exactly. Average the factor pairs and test the convex midpoint inequality for `L=0.5(x-wh)²`.

**Hint.** Average the factors first, not their already multiplied predictions.

**Reasoned solution.** The factor midpoint is `(2.5,1.25)`, predicting `3.125`. Its half-loss is `(2-3.125)²/2=0.6328125`, whereas the average endpoint loss is zero. This violates the convex midpoint inequality. Each fixed-factor slice remains a convex quadratic; the counterexample concerns the joint factor coordinates, not every individual block.

**Tempting wrong route.** Average the two products (both 2) and assert that averaged factors must also produce 2.

**Success check.** Show the literal midpoint, product, loss and scope of the failed inequality.

### Practice G: change the joint gain under three losses

**Task.** For strictly positive observed/predicted arrays `x,y`, multiply both by 3. How do Frobenius half-square, generalized KL and Itakura–Saito losses change?

**Hint.** Substitute into each scalar term before summing. The logarithmic ratio is unchanged.

**Reasoned solution.** `(3x-3y)²/2=9(x-y)²/2`. Generalized KL is `x log(x/y)-x+y`, so substitution gives three times every term. Itakura–Saito is `x/y-log(x/y)-1`, whose ratio is unchanged, hence its loss multiplier is one. The respective multipliers are 9, 3 and 1. These are **joint** gain changes: changing only the prediction is not the same experiment. Strict positivity keeps the stated IS domain valid.

**Tempting wrong route.** Call all reconstruction losses scale invariant, or apply the IS conclusion to observed zeros without examining its domain.

**Success check.** Derive all three substitutions and state what was scaled and which domain was used.

### Practice H: an unchanged multiplicative coordinate can be wrong

**Task.** Keep scalar `W=1` fixed, with observation row `[3,1]` and dictionary row `[0,2]`. Compute the gradient, test nonnegative stationarity, and explain what multiplication does to the zero coordinate.

**Hint.** The gradient is `H-X`; at a zero coordinate, a negative derivative points into a feasible improving positive direction.

**Reasoned solution.** The gradient is `[-3,1]`. The zero first cell fails the boundary condition because increasing it reduces loss; the positive second cell fails the interior zero-gradient condition. The true fixed-W optimum is `[3,1]`. A multiplicative rule keeps the first cell at zero, because multiplying zero by a finite ratio cannot make it positive. The resulting lack of motion cannot certify stationarity. A coordinate method can activate that cell using its slope.

**Tempting wrong route.** Infer “converged” from an unchanged zero or from the factors merely being nonnegative.

**Success check.** Explain both coordinate conditions, the improving direction and the difference between algorithm motion and objective stationarity.

### Practice I: use the fresh coordinate

**Task.** For `x=[1,3,4]`, `H0=[[1,0,1],[0,1,1]]` and starting amounts `[1,1]`, update C0 then C1 once. Is that the exact encoding?

**Hint.** `G=[[2,1],[1,2]]`, `p=[5,7]`. C1's slope uses the newly updated C0.

**Reasoned solution.** C0's slope is `2*1+1-5=-2`; curvature 2 gives C0=2. C1's fresh slope is `2+2*1-7=-3`, so C1 becomes `1-(-3)/2=2.5`. Prediction `[2,2.5,4.5]` has residual `[-1,0.5,-0.5]` and half-loss `3/4`. Exact amounts `[1,3]` give zero error. A finite sweep is useful without being the solved block.

**Tempting wrong route.** Use stale C0=1 to obtain C1=3 and call that a cyclic sweep.

**Success check.** Supply both slopes, fresh prediction/loss and the exact reference showing remaining improvement.

### Practice J: clipping least squares is not NNLS

**Task.** With patterns `[[1,0],[1,1]]` and query `[0,1]`, unconstrained least squares gives `[-1,1]`. Compare clipping it to solving the actual nonnegative problem.

**Hint.** After imposing C0=0, reoptimize C1 instead of assuming its old value still works.

**Reasoned solution.** Clipping gives `[0,1]`, predicting `[1,1]` with half-loss `1/2`. On boundary C0=0 the objective is `0.5(t²+(t-1)²)`, minimized at C1=`1/2`; prediction `[1/2,1/2]` has half-loss `1/4`. Its gradient for C0 is `1/2` (compatible with the zero boundary), and for C1 is zero (required at the positive coordinate). The clipped point has positive C1 derivative 1 and can improve by decreasing it.

**Tempting wrong route.** Treat projection of the unconstrained coefficients onto the nonnegative orthant as projection of the observation onto the pattern cone.

**Success check.** Show both predictions/losses and the boundary/free-coordinate derivatives.

### Practice K: missing is not measured zero

**Task.** A single pattern is `[1,1]` and the row is `[2,0]`. Solve for its amount when both bins are measured, then when the second bin is omitted with mask `[1,0]`.

**Hint.** Write the two included-residual objectives explicitly.

**Reasoned solution.** With both measured, `L(w)=0.5((2-w)²+w²)` has derivative `2w-2`, so `w=1`, prediction `[1,1]`, half-loss 1. With mask `[1,0]`, `L_M(w)=0.5(2-w)²`, minimized at `w=2` with included loss zero. The prediction `[2,2]` at the omitted bin is not verified by that zero loss. The mask changes which data constrain the fit; it is not just a display setting.

**Tempting wrong route.** Fill a missing bin with zero and fit it as observed, or call masked zero loss accuracy on all bins.

**Success check.** Show both minimizers/objectives and state what remains unknown.

### Practice L: another joint midpoint

**Task.** For `x=1`, compare exact factor endpoints `(1,1)` and `(2,0.5)` with their midpoint. Why does the answer not contradict convex fixed-H encoding?

**Hint.** The midpoint is `(1.5,0.75)`; multiply those values.

**Reasoned solution.** Its product is `9/8`; half-loss is `0.5(1-9/8)²=1/128`, while endpoint losses are zero. The jointly varying `(w,h)` midpoint inequality fails. A fixed-H subproblem varies only `w`; its feasible slice never joins these two endpoints with different `h` values.

**Tempting wrong route.** Use this example to call the fixed-H NNLS problem nonconvex.

**Success check.** Give the explicit inequality and the difference between a joint path and a block slice.

### Practice M: a feasible ambiguity beyond scale

**Task.** Use the separate positive-shear dictionary `Hs=[[1,1,1],[0,1,1]]`, amounts `[2,1]` and shear value `t=0.5`. Construct the changed nonnegative factors and verify their product. Could you apply the same shear to `H0`?

**Hint.** Multiply the amount row by `[[1,t],[0,1]]` and the dictionary by its inverse `[[1,-t],[0,1]]`.

**Reasoned solution.** Amounts become `[2,2]`; the dictionary becomes `[[1,0.5,0.5],[0,1,1]]`. Its contributions `[2,1,1]` and `[0,2,2]` add to `[2,3,3]`, the same as the original contributions `[2,2,2]` and `[0,1,1]`. One ray's direction changed, so this is more than a row rescaling or permutation. Applying the inverse to `H0` makes its first row `[1,-0.5,0.5]`, which violates nonnegativity. A valid transformation depends on the actual support.

**Tempting wrong route.** Assume an invertible factor transformation always preserves nonnegative feasibility.

**Success check.** Show all arrays/products and the forbidden `H0` entry.

### Practice N: ordinary rank can be too small

**Task.** For `X=[[1,1,0,0],[0,1,1,0],[0,0,1,1],[1,0,0,1]]`, show ordinary rank 3 but nonnegative rank 4. Would the same zero-support argument apply after adding a small positive value to every zero?

**Hint.** Ordinary row dependence permits subtraction; nonnegative outer products do not cancel forbidden positives. Consider the four positive diagonal cells.

**Reasoned solution.** The first minus second plus third minus fourth row is zero, so rank is at most 3. The top-left 3×3 triangular minor has determinant 1, so rank is at least 3. For a nonnegative rank-one term, positive row positions crossed with positive column positions form a positive support rectangle. Any two diagonal positives here have a forbidden cross-zero between them, so one term cannot cover both without incorrectly making that zero positive. At least four terms are required. `I4@X` is a nonnegative four-component factorization, giving the matching upper bound. Thus ordinary rank is 3 and nonnegative rank is 4. Filling the zeros changes the support premise; it invalidates this exact lower-bound proof, without by itself proving that the new nonnegative rank is 3.

**Tempting wrong route.** Equate nonnegative rank with ordinary rank, or carry an exact zero-support proof into a noisy positive approximation.

**Success check.** Supply the ordinary lower/upper bounds, support argument and nonnegative upper bound, with the changed-premise limitation.

### Practice O: reverse a raw ranking without changing anything observed

**Task.** For `x=[2,1,3]`, `H0` and amounts `[2,1]`, multiply component 0's pattern by 3 and divide its amount by 3. Which raw coefficient is now larger? Which component contributes more total mass?

**Hint.** Compare each complete weighted pattern rather than amounts with different units.

**Reasoned solution.** The changed dictionary is `[[3,0,3],[0,1,1]]` and amounts are `[2/3,1]`. C1's raw coefficient is now larger, but C0's contribution remains `[2,0,2]`, total 4, versus C1's `[0,1,1]`, total 2. Their sum remains `[2,1,3]`. Ranking the raw coefficients reverses while the actual additive contributions stay fixed.

**Tempting wrong route.** Declare C1 the larger total source solely because its coefficient now exceeds C0's.

**Success check.** Show both all-bin contributions, both totals and the unit-change explanation.

### Practice P: retain the stronger sign pair

**Task.** A singular triplet has `sigma=5`, `u=v=[0.6,-0.8]`. Which positive/negative pair does the NNDSVD sign-pair rule retain, and what is its reconstructed rank-one term? Then change `u` to `[0.8,-0.6]` while keeping `v` fixed and apply the declared tie convention.

**Hint.** Compare the products of paired vector-part norms, not the independent largest entries. This is a triplet exercise, not a claim that the edited triplet remains the same input matrix's SVD.

**Reasoned solution.** The positive-part norm product is `0.6*0.6=0.36`; the negative-part product is `0.8*0.8=0.64`. The latter wins. Its unit directions both point to the second coordinate, and scaled product is `5*0.64=16/5`, yielding `[[0,0],[0,16/5]]`. Positive-only clipping would retain `9/5` in the top-left instead and miss the larger admissible pair. With edited `u`, both products equal `0.8*0.6=0.6*0.8=0.48`; our declared positive-pair tie rule chooses the first support. Coupled sign flips of a valid SVD pair exchange the candidate names without changing their products, except that a declared exact-tie orientation convention must still be understood.

**Tempting wrong route.** Clip each singular vector independently and assume the surviving positive-positive pair must be best.

**Success check.** Give both norm products, selected support rectangle/scale and the tie policy, without claiming a unique global NMF start.

### Practice Q: verify the auxiliary upper bound

**Task.** Let `f(z)=(z-2)²`, current `a=0.5`, and `q(z|a)=f(z)+(z-a)²/(2a)`. Find the minimizer of `q` and verify the touching, upper-bound and descent relations.

**Hint.** At `a=0.5`, `q=(z-2)²+(z-0.5)²`; its derivative is `4z-5`.

**Reasoned solution.** The minimizer is `z=5/4`. There, `f=9/16`, `q=9/8`, and the gap is `9/16`. For every real `z`, `q-f=(z-a)²/(2a)≥0` because `a>0`; at `z=a` both equal `(0.5-2)²=9/4`. Therefore `f(5/4)≤q(5/4)≤q(a)=f(a)`. This is the logical chain behind that MM step, not a statement that it jumps to the minimizer of `f`, which is 2. The local scalar upper bound does not prove every beta-divergence update.

**Tempting wrong route.** Minimize `f` directly and label the result the auxiliary-function step, or skip the touching condition.

**Success check.** Supply the derivative, minimum, gap, touching value and complete ordered descent chain.

### Practice R: a product-invariant rescaling can change the penalty

**Task.** Use exact `W=[[2,1],[1,3],[0,2]]`, `H0`, `alpha_W=0.1`, `alpha_H=0.2`, `l1_ratio=1`, and `n=d=3`. Multiply C0's dictionary row by 2 and divide its amount column by 2. Compare objective values, then set both alphas to zero.

**Hint.** The dimension-scaled L1 coefficients are `alpha_W*d=0.3` and `alpha_H*n=0.6`.

**Reasoned solution.** Original factor masses are `sum(W)=9` and `sum(H)=4`, so the penalty is `0.3*9+0.6*4=5.1`. Changed `W` has mass `1+0.5+0+1+3+2=7.5`; changed `H` has mass 6, so the penalty is `0.3*7.5+0.6*6=5.85`. Residual loss stays zero because the product is unchanged. Hence the penalized objective rises even though reconstruction is invariant. With both alphas zero, both penalties vanish and the objectives are again equal.

**Tempting wrong route.** Infer objective invariance from product invariance after adding factor penalties.

**Success check.** Supply the two masses, dimension factors, two costs and null-penalty case.

### Practice S: preserve global IDs when choosing anchors

**Task.** The ordered observations are ID42=`[1,0]`, ID7=`[0,1]`, ID99=`[0.75,0.25]`, ID10=`[0,1]`, ID6=`[0,0]`. Request two anchors using the normalized-row rule. Which IDs are selected? What happens if you request three independent anchors?

**Hint.** Exclude zero rows, retain their ID mapping, and resolve exact norm ties by original **normalized-input** norm and then global ID.

**Reasoned solution.** The nonzero rows already sum to one. Pure rows 42, 7 and 10 have squared norm 1, so ID7 wins the exact tie. Projection along `[0,1]` leaves ID42 residual `[1,0]`, ID99 `[0.75,0]` and the duplicate ID10 `[0,0]`. ID42 wins the next squared-norm comparison. Selected global IDs are `(7,42)` even though their physical input positions are 1 and 0. ID6 remains the excluded-zero mapping. Three independent directions cannot exist in two features, so the rank request is refused; the duplicate cannot supply a third direction. Signed projection residuals in less axis-aligned cases must not be clipped back into the original nonnegative data domain.

**Tempting wrong route.** Return local array indices as source identities, select the duplicate as a new direction, or treat the zero row as a pure anchor.

**Success check.** Give both IDs, intermediate residuals, excluded-zero identity and the rank refusal, with tie units stated.

### Practice T: query with fixed IDF

**Task.** Use §16's three training documents and vocabulary `[orbit,rocket,team]`. Encode the raw words `rocket planet` into counts and unnormalized TF-IDF. Then do the same for an all-`planet` query. Should either query change the IDF or dictionary?

**Hint.** `rocket` appeared in two of the three training documents; `planet` has no retained column.

**Reasoned solution.** Counts are `[0,1,0]`; weighted values are `[0,1+log(4/3),0]`, approximately `[0,1.2876820724517808,0]`. `planet` does not create a new feature, and the all-OOV query is `[0,0,0]` in both representations. Query encoding holds the learned dictionary fixed; neither vocabulary nor training IDF is refit. Its zero amounts describe a null retained representation, not an absence of meaning. The weighted row is not a literal count observation for a Poisson likelihood simply because it stays nonnegative.

**Tempting wrong route.** Recompute document frequencies from the query or append a query-derived vocabulary column.

**Success check.** Give fixed dimensions, exact weight, OOV/null behavior and the fit-versus-query boundary.

### Practice U: old statistics versus new encoding

**Task.** Keep §17's observations `[2,1,3]`, `[0,2,2]` and arrival codes `[2,1]`, `[0,2]`. Change the first dictionary cell from 1 to 2, keeping `H=[[2,0,1],[0,1,1]]`. Compare stored-code and fresh optimal first-row reconstructions. Do the stored `A/B` become freshly encoded statistics?

**Hint.** Solve the new two-coordinate normal equations; both resulting amounts are positive, so no boundary clipping is needed.

**Reasoned solution.** Old amounts `[2,1]` predict `[4,1,3]`, with half-loss 2. Fresh amounts `[10/9,13/9]` predict `[20/9,13/9,23/9]`; their residual is `[-2/9,-4/9,4/9]`, giving half-loss `(4+16+16)/(2*81)=2/9`. The second row remains exact with `[0,2]`. Stored `A=[[4,2],[2,5]]` and `B=[[4,2,6],[2,5,7]]` came from the old codes. Fresh first-row outer products differ, so those retained matrices do not become them automatically. The remembered quadratic is a historical-code surrogate, not a full freshly re-encoded refit.

**Tempting wrong route.** Change `H` and quietly reinterpret old `A/B` as products of fresh optimal amounts.

**Success check.** Supply both predictions/losses, the unchanged second row and the two distinct statistic roles.

### Practice V: a rejected next fit must preserve the old query contract

**Task.** A coherent fitted snapshot has `H0`, ordered features `[F0,F1,F2]` and rank 2. Configure a future rank-1 fit, but provide negative or nonfinite fitting input so it is rejected. What should a valid later query return? What should an empty query's shape be? How should a public-library wrapper provide the same publication boundary?

**Hint.** Future configuration is not fitted state. Publish all candidate factors and metadata together only after every check succeeds.

**Reasoned solution.** The failed fit raises and preserves the entire previous dictionary, fitted feature order, rank and associated diagnostics/solver settings. A valid nonempty query still returns two amounts; a valid empty row batch has shape `(0,2)`. Changing `n_components` for the next fit cannot resize a query against the old two-row dictionary. Supplied feature order must still match `[F0,F1,F2]`. The `CoordinateNMF` implementation in §6 uses one snapshot publication point; the ordinary `PublishedNMF` adapter in §10 fits a **fresh candidate estimator**, checks its state, then replaces its previous snapshot. Directly mutating/refitting one public estimator is not claimed to provide that rollback contract. The saved foundation/lifecycle checks actually cover rejected candidates, old-rank queries and feature-order preservation; no new fit is required to restate their meaning.

**Tempting wrong route.** Keep old `H` but publish new rank or feature metadata first, or assume the third-party estimator itself promises transactional rollback.

**Success check.** Name the complete preserved snapshot, both query shapes/feature constraints and the fresh-candidate publication strategy.

### Practice W: refuse a changed objective masquerading as the original

**Task.** Evaluate generalized KL for observed 0/predicted 2, then observed 1/predicted 0. Consider IS for observed 0/predicted 2. What should happen if finite inputs overflow a required reduction during a new fit?

**Hint.** Use each loss's stated limit/domain. Adding an arbitrary epsilon changes its input and objective.

**Reasoned solution.** The generalized-KL zero-count term is its predicted rate, so the first loss is 2. A positive observation with zero predicted rate has infinite divergence; the supported finite route refuses it. IS in this lesson requires strictly positive observations and predictions; its observed-zero case is outside that domain and is refused. Finite entries alone do not imply finite products or reductions. If a required new candidate computation overflows, raise with a rescaling explanation and preserve an already fitted snapshot instead of publishing nonfinite factors or silently replacing the requested objective. A deliberately smoothed model can be valid, but must be named, justified and evaluated as that changed model.

**Tempting wrong route.** Floor every zero, continue and report the value as the original KL/IS problem.

**Success check.** Give the finite/infinite/domain outcomes and atomic finite-arithmetic refusal, without inventing a solver output.

### Practice X: distinguish an address map from lost phase

**Task.** For §18's `a=[1,2]`, `b=[1,0]`, `c=[1,3]`, find tensor address `(1,0,1)` and its unfolded matrix address in feature-major/time-minor order. Then invert `[0,1]` and `[0,-1]` under the two-sample DFT convention and compare their magnitudes.

**Hint.** Unfolding uses column `2*j+t`; inverse DFT divides by 2 and its second-sample factor is `-1` for bin 1.

**Reasoned solution.** The tensor cell is `2*1*3=6`, mapped to matrix row 1, column 1, still 6. Knowing the map permits the rearrangement to be reversed. Both Fourier lists have magnitude `[0,1]`, but inverse samples are `[0.5,-0.5]` and `[-0.5,0.5]`. The phase of their nonzero bin is 0 versus pi. Removing that phase destroys information rather than merely reordering cells; the common magnitude cannot select a unique original waveform.

**Tempting wrong route.** Exchange feature/time addressing without declaring a map, or infer identical waveforms from identical magnitudes.

**Success check.** Supply the index map, both explicit inverse sums and the different information roles.

### Files for the worked implementations

The full code bodies appear beside their explanations, with the same Copy/Download actions as this index. Keep their supplied filenames if running the examples together: the imports are real reuse of earlier explained implementations. The numerical examples were checked with Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; inspect warning/diagnostic output in your environment rather than expecting bit-identical arbitrary factors. No file installs packages or downloads a dataset automatically.

| File | What it supplies | Teaching and execution role |
| --- | --- | --- |
| `centered_pca.py` | Unchanged `real_table` validation sibling from the PCA lesson | [PCA §4](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python); no PCA centering or PCA fit is imported into NMF initialization. |
| `nmf_arrays.py` | Finite/nonnegative shaped arrays, reconstruction, explicit metrics, weighted errors, KL and projected gradients | [Measure the disagreement](#3-measure-the-disagreement-before-choosing-a-loss); new foundation program/output. |
| `nmf_coordinate.py` | Cached cyclic coordinate blocks, held-dictionary encoding and coherent fitted CD snapshots | [Encode a new row](#4-encode-a-new-row-with-the-dictionary-held-fixed), [coordinates](#5-change-one-coordinate-then-reuse-the-arithmetic), [fitting/stopping](#6-fit-both-factors-and-decide-when-to-stop); new bounded program/output. |
| `nmf_nnls.py` | Public SciPy NNLS fixed-H route with transposed design and residual norms | [Encode a new row](#4-encode-a-new-row-with-the-dictionary-held-fixed); constrained numerical reference, not private sklearn code. |
| `nmf_multiplicative.py` | Explicit Frobenius/KL multiplicative algorithm and coherent finite state | [Explain the multiplicative route](#7-explain-the-multiplicative-route); its qualified corrected KL demonstration is separate from the retained original stream. |
| `nmf_beta_mm.py` | Supported beta-divergence/MM branches, domains and convergence diagnostics | [Why the upper bound gives a safe step](#8-why-the-upper-bound-gives-a-safe-step); complete new algorithm/output, no claim the scalar Frobenius proof proves every beta case. |
| `nmf_initialization.py` | Uncentred SVD sign-pair initialization, zero-fill/mean/random variants and public NMF route | [Initialize without PCA centering](#9-initialize-without-silently-importing-pca-centering); supplied SVD primitive, explicit sign/tie/zero conventions. |
| `ordinary_nmf_lifecycle.py` | Public CD/Frobenius candidate-estimator publication adapter | [Use the ordinary tools](#10-use-the-ordinary-tools-deliberately); new changed-input lifecycle example, not another scratch optimizer. |
| `nmf_penalties_masks.py` | Dimension-scaled penalties and streamed local masked Gram coordinate updates | [Control penalties and incomplete observations](#11-control-penalties-and-incomplete-observations); no dense `n*d*k` contribution allocation. |
| `nmf_factor_alignment.py` | Compensated normalization, invariant contribution totals, row interventions and permutation assignment | [Inspect the digit contribution](#12-inspect-an-actual-digit-dictionary-and-contribution); core assignment and separately bounded optional global ambiguity audit. |
| `nmf_saved_digits.py` | Strict verified loading and descriptive inspection of saved digit arrays | [Inspect the digit dictionary](#12-inspect-an-actual-digit-dictionary-and-contribution); no estimator import, no missing-state fallback fit. |
| `nmf_digit_comparison.py` | New explicitly labelled rank6/seed23 mean/PCA/NMF comparison | [Evaluate a representation](#13-separate-a-representation-decision-from-its-evaluation); new train-only study with the declared split, not recovery of missing historical PCA8 factors. |
| `nmf_anchors.py` | Normalized-row residual selection with stable source IDs, QR/NNLS reference routes | [When anchors help](#15-when-anchors-help-recover-the-dictionary); exact assumptions/finite tolerance qualification, not a general noisy-recovery guarantee. |
| `nmf_text_spectra.py` | Scratch counts/IDF, ordinary and scratch text fitting/queries, exact two-pattern simplex and constrained reference | [Change applications](#16-change-application-assumptions-explicitly); new tiny weighted-text and constructed-spectra examples. |
| `nmf_online.py` | Compact historical-code surrogate with atomic A/B/H state and distinct MiniBatchNMF route | [Update as rows arrive](#17-update-as-rows-arrive); new two-arrival example, finite caps and no stored historical row list. |
| `nmf_axis_phase.py` | Addressed rank-one/Tucker anatomy and direct/IFFT phase counterexample | [Keep extra axes](#18-keep-extra-axes-and-recognize-what-is-missing); finite definitions only, no tensor fitting/audio study. |
| `nmf_step.py` | Preserved original forty-sweep constructed Frobenius program | [Multiplicative route](#7-explain-the-multiplicative-route); original complete source and recorded rounded output retained. |
| `nmf_digits.py` | Preserved original eight candidate fits and fixed k8 inspection/baseline experiment | [Representation evaluation](#13-separate-a-representation-decision-from-its-evaluation); original source/output retained, no replay implied. |
| `nmf_words.py` | Preserved original five-document count/KL experiment | [Application assumptions](#16-change-application-assumptions-explicitly); original source and recorded rounded factors/output retained. |
| `nmf_saved_state.json` | Exact descriptive dictionary, 60 reserved amount/observation rows and original reports | Required by strict saved-array inspection; not a newly fitted model or a claim that historical PCA8 factors were saved. |
| `digits-300.csv` | Same 300 offline rows with source IDs, labels and 64 integer bins | Input to the preserved digit program, strict saved loader and explicitly new controlled comparison; fixed numerical conversion `/16`. |
| `digits-data-provenance.md` | Dataset source, subset construction, attribution/license and measurement caveats | Read before reusing the digit file; labels support subset/split roles rather than becoming NMF features. |

Each worked new program's complete stdout is displayed beside it. The corresponding retained text streams are `nmf_arrays.stdout.txt`, `nmf_coordinate.stdout.txt`, `nmf_nnls.stdout.txt`, `nmf_multiplicative.stdout.txt`, `nmf_beta_mm.stdout.txt`, `initialization-main.stdout.txt`, `lifecycle-main.stdout.txt`, `penalties-masks-main.stdout.txt`, `nmf_factor_alignment.stdout.txt`, `nmf_saved_digits.stdout.txt`, `nmf_digit_comparison.stdout.txt`, `nmf_anchors.stdout.txt`, `nmf_text_spectra.stdout.txt`, `nmf_online.stdout.txt` and `nmf_axis_phase.stdout.txt`. The corrected changed KL demonstration additionally has its own `positive-kl.stdout.txt`; it does not overwrite an earlier stream. Original programs' rounded outputs are the separately labelled blocks accompanying their original code. Empty stderr companions and verification receipts describe the execution evidence; they are not extra learner algorithms. Saved output lets you inspect the exact recorded run without retraining merely to see a figure.

### Another way to learn these ideas

- [Nicolas Gillis, *The Why and How of Nonnegative Matrix Factorization*](https://arxiv.org/pdf/1401.5226), a freely accessible survey. After §§1–6, use its geometry and algorithm discussion to connect additive representations, computational difficulty and optimization. After §§14–15, its nonuniqueness/nonnegative-rank/separability sections offer a specialist continuation. Matrix algebra and least squares are useful prerequisites; its application examples do not certify source identity in your data.
- [Michael Berry and colleagues, *Algorithms and Applications for Approximate Nonnegative Matrix Factorization*](https://langvillea.people.cofc.edu/CSDA.pdf), an accessible author-hosted survey/preprint. After the coordinate/NNLS and initialization sections, use its numerical-method comparisons and text/spectral examples as an alternate route through the same questions. Expect matrix algebra; older software interfaces and timing comparisons are historical, not current performance guidance.
- [Kolda and Bader, *Tensor Decompositions and Applications*](https://www.kolda.net/publication/TensorReview.pdf), an accessible specialist survey. For the extension in §18, begin with unfolding in §2.4 and the CP/Tucker definitions in §§3–4, after the linked Tensor Algebra foundations. These named sections extend the anatomy; a general nonnegative tensor optimizer requires its own deeper study rather than assuming an NMF update transfers unchanged.
- [TensorLy nonnegative CP](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html) and [nonnegative Tucker](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html), practical public API routes for that tensor extension after named axes, component/core meaning and iterative optimization are clear. Check the installed version, initialization, rank dimensions, reconstruction error and returned factor structure; this lesson does not supply an unreported TensorLy fit.
- [librosa STFT](https://librosa.org/doc/main/api/generated/librosa.stft.html) and [Griffin–Lim](https://librosa.org/doc/main/api/generated/librosa.griffinlim.html), optional audio-tool exploration after the phase counterexample and Fourier foundations. The linked development 1.0.0 interface may differ from a stable installation. A magnitude approximation and a waveform reconstruction are separate tasks; do not assess auditory source separation using only a magnitude reconstruction number.

### Technical references and provenance

These support particular statements and implementations; they do not replace the local explanations.

| Reference | Relevant question and location |
| --- | --- |
| [Lee and Seung, 1999, *Learning the parts of objects by non-negative matrix factorization*](https://www.cs.cornell.edu/courses/cs6241/2020sp/readings/Lee-Seung-1999-NMF.pdf) | Original additive pattern/amount interpretation and examples; useful historical origin, not a universal “true parts” guarantee. |
| [Lee and Seung, 2000, *Algorithms for Non-negative Matrix Factorization*](https://papers.nips.cc/paper_files/paper/2000/file/f9d1152547c0bde01830b7e8bd60024c-Paper.pdf) | Frobenius auxiliary-function/descent argument and generalized-KL multiplicative update, transposed here to row observations. Positive-interior proof conditions matter. |
| [Lin, 2007, *On the Convergence of Multiplicative Update Algorithms for Nonnegative Matrix Factorization*](https://www.csie.ntu.edu.tw/~cjlin/papers/multconv.pdf) | Boundary stationarity/zero-lock issue and why unchanged multiplicative factors need not be KKT stationary; the modified-update analysis is distinct from this lesson's CD route. |
| [Févotte and Idier, *Algorithms for nonnegative matrix factorization with the beta-divergence*](https://arxiv.org/pdf/1010.1763) | Divergence definitions, gain behavior, actual MM update exponent in Eq.38/Table2, and the difference from an unqualified exponent-one heuristic. |
| [Boutsidis and Gallopoulos, NNDSVD treatment](https://user.it.uu.se/~milga730/histo/before2011august/Boutsidis.pdf) | Sign/support argument, paired norm selection, construction table and fill variants; an initialization strategy rather than a global-quality guarantee. |
| [Gillis and Vavasis, *Fast and Robust Recursive Algorithms for Separable Nonnegative Matrix Factorization*](https://arxiv.org/pdf/1208.1237) | Algorithm1, row/column normalization after transpose, full-rank/separability assumptions and exact recovery argument. Noisy recovery has additional hypotheses/bounds beyond our finite examples. |
| [Mairal, Bach, Ponce and Sapiro, *Online Learning for Matrix Factorization and Sparse Coding*](https://jmlr.org/papers/volume11/mairal10a/mairal10a.pdf) | Algorithms1–2's stored-code statistics/dictionary surrogate and §5.3's nonnegative variant. Their stochastic/asymptotic analysis is not inherited by a bounded finite stream. |
| [scikit-learn NMF](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html) | Current public configuration, solver/loss compatibility, initialization, dimension-scaled penalties, fitted shapes and held-dictionary transform. The inspected/executed version is 1.9.1. |
| [scikit-learn MiniBatchNMF](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html) | Incremental `partial_fit`, fitted `components_/n_steps_`, query transform, retention and fresh-restart controls; a distinct optimizer from the scratch A/B recurrence. |
| [SciPy NNLS](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html), [linear assignment](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html), [SLSQP](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html) | Public fixed-H constrained least squares, pattern permutation assignment and the separately constrained simplex diagnostic. SciPy 1.18.1 execution; current manual pages may carry 1.18.0 labels. |
| [CountVectorizer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html), [TfidfTransformer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html) | Fixed vocabulary/tokenization, sparse word counts, smoothed training IDF and explicit no-row-normalization convention. |
| [NumPy reduced QR](https://numpy.org/doc/stable/reference/generated/numpy.linalg.qr.html) | Public span/projection primitive used to independently check the anchor residuals. Current online manual may be newer than the executed NumPy 2.3.5 environment. |
| [UCI Optical Recognition of Handwritten Digits](https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits), [scikit-learn load_digits](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html) | Dataset origin/attribution and the supplied integer 8×8/64-feature measurements. The local provenance file governs this fixed subset; no additional dataset download is required. |

### Readiness and the next question

The core mechanism is a nonnegative sum of complete patterns. Holding one factor fixed gives a constrained convex block; alternating both factors introduces initialization, stopping and nonuniqueness questions. The objective, observation mask and penalty determine what “better” means. A saved contribution explains the current product; it does not by itself identify a physical cause. Training-derived feature rules, held-out evaluation and coherent fitted state make those calculations usable.

Before moving on, try explaining one changed row without looking at a solution: trace its two addends; choose and compute a loss with its domain; take a coordinate step and test its boundary gradient; encode it with a frozen dictionary; and name what evidence would justify its interpretation. For a programming readiness check, implement a small changed-input route using the supplied kernels, compare independent reconstruction/objective or NNLS/KKT conditions, and deliberately reject a bad shape/order/overflow candidate while preserving a valid fitted query. Explain a counterexample—zero lock, nonnegative-rank gap, stale statistics or lost phase—in your own words. If the explanation fails at one transition, return to that named section rather than treating a checked exercise as universal mastery.

The next curriculum topic is [Feature Scaling, Encoding & Imputation](https://ronak.sh/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml#5-learn-the-preparation-rule-without-looking-ahead). It follows because our fixed `/16` ruler, trained IDF and observation masks already showed how representation and available information affect a model. It broadens those preparation decisions into train-only rules and pipelines; it is not a prerequisite we silently assumed for this lesson. For a specialist branch, choose one justified question—noisy separability, structured penalties, physically validated unmixing, general tensor fitting or phase-aware audio reconstruction—and revisit its assumptions, numerical objective and evaluation evidence before extending the algorithm.
