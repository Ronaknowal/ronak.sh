## 11. Control penalties and incomplete observations

The previous section separated a fitted dictionary from the new rows we encode with it. Two decisions now change what “fit well” means: how much complexity we permit in the factors, and which measurements actually exist. We will change those decisions explicitly while keeping the same amount-times-pattern model.

What if fitting a measurement closely requires an amount we would rather keep small?

Charge for using the amount as well as for its reconstruction error.

<!-- figure:D38 -->

The observed scalar is 2 and its fixed pattern is 1, so amount w predicts w. The unpenalized curve is `0.5×(2-w)²`, with minimum at w=2. The added cost is `λw`, where **λ**, pronounced lambda, is a nonnegative price per unit of amount. The picture keeps the data cost, added straight-line cost and their sum visible. Moving the one λ control changes the slope of the straight line, rather than secretly changing the observation.

At λ=1, reducing w slightly from 2 saves more penalty than it initially costs in squared error; the best compromise is w=1. At λ=3, the unconstrained minimum would be -1, but amounts cannot be negative. The best feasible amount is the boundary w=0. At that boundary the total curve has outward slope 1: moving into the allowed positive region would increase the objective. Reset λ to zero and the original optimum returns to 2.

A **penalty**, also called regularization, expresses this additional preference as part of the objective. It is not a probability that a component is reliable. Different preferences produce different penalties. A linear cost λ₁w charges the same extra slope per unit; a squared cost `0.5λ₂w²` makes an already large amount increasingly expensive. The static squared-penalty comparison uses λ₁=0 and λ₂=1: its optimum is w=1 as well, but its curve and response to another target differ from the linear case.

For a scalar observed value x and fixed pattern value h, the total cost, slope and curvature are

\[
f(w)=\tfrac12(x-wh)^2+\lambda_1w+\tfrac12\lambda_2w^2,
\quad f'(w)=(h^2+\lambda_2)w-xh+\lambda_1,
\quad f''(w)=h^2+\lambda_2.
\]

Here λ₁ and λ₂ are nonnegative coefficients. If `h²+λ₂>0`, setting the slope to zero and respecting w≥0 gives

\[
w_* = \max\left(0,\frac{xh-\lambda_1}{h^2+\lambda_2}\right).
\]

This derives the threshold and the shrinkage from an optimization problem; they are not arbitrary changes applied after fitting. If h=0 and λ₂=0, the data does not depend on w. Positive λ₁ chooses zero; when λ₁ is also zero, every nonnegative amount has the same cost and we choose zero by convention.

How do these extra costs fit the coordinate updates we already built?

The linear penalty adds a slope, while the squared penalty adds both slope and curvature.

In section 5, one fixed-H block used `G=HHᵀ` and `P=XHᵀ`. With nonnegative factors, the elementwise L1 size of W is simply the sum of its entries; the L2 square is the sum of their squares. For one coordinate c, add λ₁ to the old slope and λ₂W_ic to the old slope, then add λ₂ to its curvature:

\[
W_{ic}\leftarrow\max\left(0,
W_{ic}-\frac{(WG-P)_{ic}+\lambda_1+\lambda_2W_{ic}}
{G_{cc}+\lambda_2}\right).
\]

The operation still uses fresh earlier coordinates in the same cyclic sweep. Equivalently, isolate every other coordinate and divide `(P_ic - sum_other W_it G_tc - λ₁)` by `G_cc+λ₂`. Omitting λ₂ from the slope while adding it to the denominator would solve a different problem. The exact `coordinate_sweeps` kernel in `nmf_coordinate.py` already has these two coefficient arguments; here we derive their meaning, choose their dimension scaling and compose the complete penalized fitting route around that kernel.

For a table with n observation rows and d feature columns, let **αW** and **αH** set the strength of the amount and pattern penalties. A mixing fraction **r**, between zero and one, assigns r to the linear part and 1-r to the squared part. The coefficients are

\[
\lambda_{W,1}=\alpha_W d r,\quad
\lambda_{W,2}=\alpha_W d(1-r),\qquad
\lambda_{H,1}=\alpha_H n r,\quad
\lambda_{H,2}=\alpha_H n(1-r).
\]

The full objective is therefore

\[
\tfrac12\|X-WH\|_F^2
+\alpha_Wdr\sum_{i,c}W_{ic}
+\tfrac12\alpha_Wd(1-r)\sum_{i,c}W_{ic}^2
+\alpha_Hnr\sum_{c,j}H_{cj}
+\tfrac12\alpha_Hn(1-r)\sum_{c,j}H_{cj}^2.
\]

Multiplying W's penalty by d puts it on the scale of the d reconstruction cells each row contributes; H's penalty uses n for the analogous reason across observations. This is the convention used by the public NMF API. It is a convention to preserve when reproducing an objective, not a rule that determines the correct penalty for every dataset. A masked problem with fewer observed cells may need its strengths retuned under a training-only validation protocol. The code keeps n and d as the original table dimensions rather than silently substituting observation counts into that convention.

Does section 2's scale ambiguity still leave the total objective unchanged?

The reconstructed measurements can stay fixed while the charged factor sizes change.

<!-- figure:D39 -->

Return to the exact W and H0 of section 1. Scale the first pattern by s and divide its amounts by s. The blue component's contribution stays the same in every cell, and the rose component is unchanged. The total amount mass becomes `3/s+6`, while total pattern mass becomes `2s+2`. These are sizes of two different factors, not alternative reconstruction errors.

The picture uses αW=0.1, αH=0.2, r=1 and n=d=3, so the two linear coefficients are 0.3 and 0.6. At s=1, the cost is `0.3×9 + 0.6×4 = 5.1`. At s=2 it becomes `0.3×7.5 + 0.6×6 = 5.85`. At s=0.5 it is `0.3×12 + 0.6×3 = 5.4`. The residual remains zero throughout this comparison. The one s control therefore exposes a change in the penalty alone. When both alphas are zero, the static comparison has zero penalty at every scale.

**Deeper: a one-sided penalty can leave an escape route.** Suppose the scalar observation is 1, only w is charged and the pattern h is unpenalized. Choosing w=1/s and h=s keeps the reconstruction exactly 1 while shrinking a linear amount penalty toward zero as s grows. No finite exact factorization reaches zero penalty: w=0 cannot reconstruct 1 with finite h. Charging one factor alone can therefore favor an unbounded sequence of scales instead of a finite preferred scale. Penalizing both factors, fixing dictionary normalization or imposing another explicit constraint closes different versions of this ambiguity. Each changes the stated problem; normalization is not a cost-free repair of a penalized objective.

So far every cell was a real measurement, including observed zeros. What changes when a sensor never measured one bin?

Give each cell an explicit observation weight instead of pretending its absence is a measured zero.

<!-- figure:D40 -->

The row is R0=`[2,1,3]` and the dictionary remains H0. F0 and F1 have weight 1. The one m control changes F2's weight between zero and one. A hatched F2 cell at m=0 means “excluded from this fitting objective”; it does not say the real value was zero. At fractional m, the measurement is included with a smaller squared-error weight. Its observed value, mask weight and model prediction remain separately labelled.

For this row the two local caches become

\[
G_i=\begin{bmatrix}1+m&m\\m&1+m\end{bmatrix},
\qquad p_i=[2+3m,\;1+3m].
\]

At m=1, we recover section 5's shared Gram `[[2,1],[1,2]]` and cross row `[5,4]`. At m=0, the shared third-bin contribution disappears: the Gram becomes the identity and the cross row `[2,1]`. Notice that both caches change. Multiplying a final residual by a mask while still using the old unweighted Gram would not compute the coordinate steps for this objective.

Let M_ij be the nonnegative weight of observation row i, feature j. A binary mask uses only zero and one; more general nonnegative weights express a weighted fit. The changed data cost is

\[
L_M(W,H)=\tfrac12\sum_{i,j:M_{ij}>0}
M_{ij}\left(X_{ij}-\sum_cW_{ic}H_{cj}\right)^2.
\]

An observed zero has X_ij=0 with positive M_ij and still contributes a residual term. A missing cell has M_ij=0 and contributes no term. For example, a single pattern `[1,1]` and row `[2,0]` give best amount 1 if both bins were measured. If the second bin is missing, the best amount is 2: only matching the first bin remains. The observed-zero objective's minimum half-loss is 1; the masked objective's included half-loss is zero. That zero says nothing about the unknown second measurement.

For fixed H, the row-specific Gram and cross products follow by expanding the included squares:

\[
(G_i)_{ct}=\sum_{j:M_{ij}>0}M_{ij}H_{cj}H_{tj},\qquad
(p_i)_c=\sum_{j:M_{ij}>0}M_{ij}X_{ij}H_{cj}.
\]

Insert G_i and p_i into the same penalized coordinate formula. Rows with different masks generally need different caches. To update H, transpose the data and mask, treat each original feature as the row being solved, and use the **new W** from the preceding amount block. The component dimension still contracts; transposition changes which observations support each pattern entry.

How can we do this without storing one large Gram tensor for the entire dataset?

Build one row's weighted design, solve its amounts, then release that cache.

For the included features of row i, multiply each dictionary column and observed value by `sqrt(M_ij)`. The resulting design has entries `A_jc=sqrt(M_ij)H_cj`, and the target has entries `b_j=sqrt(M_ij)X_ij`. Ordinary squared error `0.5||Aw_i-b||²` is exactly the desired weighted row cost. Its products `AᵀA` and `Aᵀb` are G_i and p_i. This square-root construction also makes a public NNLS reference straightforward.

The fitting code keeps one `k×k` Gram and one length-k cross vector at a time. Its weighted design needs at most `k×d` entries for the amount orientation and `k×n` for the transposed pattern orientation. It never constructs all `n×k×k` Grams or a contribution tensor with shape `n×d×k`. For a fixed dictionary query, it keeps that row's cache for every inner sweep before moving to the next row. Unweighted queries share one Gram and one cross table for their entire solve.

What if a row or feature has no observations at all?

Zero objective weight means missing information, not a perfectly explained observation.

<!-- figure:D41 -->

The all-missing row has weights `[0,0,0]` and finite placeholder values `[0,0,0]`. Its data cost is independent of its amounts. The code chooses all-zero amounts as a minimum-norm convention, including when the penalties are zero and many choices tie. The companion all-observed row has weights `[1,1,1]` and actual measurements `[0,0,0]`; those measured zeros remain genuine constraints. With H0, its best amounts are also zero, but now they match three observations. The picture keeps an excluded cell hatched and an observed zero as an ordinary labelled zero.

An entirely unsupported feature column similarly supplies no information about its dictionary entries. This implementation stores that column as zero and records `observed_columns_` so the absence of support is inspectable. Those zeros are a convention, not an estimate that the physical feature always vanishes. Positive penalties also prefer zero unsupported entries. With no penalty, the observed objective cannot distinguish them from other nonnegative choices.

A quality average needs a denominator as well as a residual sum. For binary masks, dividing included squared error by the number of included cells gives observed-cell MSE. For fractional weights, this code explicitly defines weighted MSE as `sum(M*residual²)/sum(M)`. When `sum(M)=0`, quality is undefined and the function returns `None`; reporting zero would confuse an empty sum with evidence of accuracy. None of these averages estimates error on missing measurements without further assumptions about how measurements went missing.

Here is the complete fitting, encoding and public-reference route. Save `nmf_penalties_masks.py` beside `nmf_coordinate.py`, `nmf_arrays.py` and their supplied `centered_pca.py` dependency. It reuses the earlier constrained coordinate kernel, so the new mechanism is weighted-cache construction and objective/state composition, rather than an unexplained replacement solver.

<!-- source:nmf_penalties_masks.py -->

`PenalizedMaskedNMF.fit_transform` alternates W first and H with that new W. It records data cost, both penalty costs, their total and the joint projected-gradient diagnostic at each outer sweep. Supported zero-curvature coordinates retain the earlier exact convention; finite-arithmetic failures refuse the candidate. The fitted snapshot includes the dictionary, feature order, actual penalty coefficients, supported-column flags, stopping settings and diagnostics. Publication occurs once after the complete candidate succeeds. `transform` uses that snapshot even if the object's next-fit configuration later changes; `inverse_transform` reconstructs from the same stored dictionary. Returned dictionary arrays are copies.

All data and mask values supplied to this dense route must be finite. Put a finite placeholder, such as zero, in an unmeasured data cell and set its weight to zero; the algorithm uses the separate mask to exclude it. It does not infer missingness from a zero value or silently accept NaN. Weighted cache and residual operations compute included cells only, so a huge finite excluded value cannot contaminate a product that should never have been formed. The residual sum follows N1's included-cell arithmetic but operates on the already validated arrays, avoiding a new full-mask copy at every diagnostic. Actual included products and reductions must still fit finite float64 arithmetic. Negative weights lose the nonnegative squared-error interpretation and no longer guarantee a convex fixed block, so they are refused.

For a fixed-H weighted query, each row stops relative to its own initial projected-gradient norm; the reported iteration count is the largest row count and the reported norm combines final row norms. If every row meets its relative target, their combined norm also meets the corresponding combined relative bound. A cap in any row reports `iteration-cap`. The joint fitter instead uses its initial joint norm as the baseline. These explicitly stated diagnostics establish approximate first-order stationarity within the supported problem; the joint nonconvex fit still needs the interpretation and validation developed earlier.

**Deeper: costs and memory.** A dense weighted-cache construction costs `O(dk²+dk)` per row, hence `O(ndk²+ndk)` for an amount block; the transposed pattern block has the same leading cost. Once caches are built, q coordinate sweeps cost `O(qnk²)` and `O(qdk²)` across their respective orientations. Stationarity diagnostics form their own streamed caches and add another bounded traversal. The code retains the input and mask, factors and history; temporary weighted workspace is `O(k²+max(kd,kn))` when the two orientations run sequentially. Keeping one query row's cache across all its inner sweeps avoids rebuilding it on every iteration. For unweighted blocks the shared Gram route is cheaper and the code reuses it. These bounds describe this dense reference, not a timing result or a claim to be optimal for every sparse pattern and hardware layout.

The public comparisons deliberately cover two different contracts. For an **unmasked penalized fit**, public `NMF(solver='cd', init='custom', alpha_W=..., alpha_H=..., l1_ratio=..., shuffle=False)` accepts copies of the same starting factors. The [NMF objective documentation](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html) specifies the axis scaling used above. The code recomputes the full objective; `reconstruction_err_` alone would omit penalties. Stopping conventions can differ, so similar objective values are evidence about this configured comparison, not bitwise identity of fitted factors.

For a **fixed-H masked row with no L1 penalty**, the public [SciPy NNLS route](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html) solves the square-root-weighted A,b problem. Adding L2 cost `0.5λ₂||w||²` appends `sqrt(λ₂)I` to A and zeros to b. Expanding that augmented squared norm yields exactly the data cost plus L2 penalty. The returned NNLS residual norm includes this augmentation and is not by itself the original observed-data MSE. L1 adds a linear term and is handled by the explained coordinate route; we do not invent an L1 keyword for NNLS. The ordinary NMF estimator has no arbitrary cell-mask fitting parameter, so the full masked joint fit remains our explicit implementation.

The new main uses a changed constructed table `[[2,1,3],[1,3,4],[0.5,2,2.5]]` to demonstrate these contracts independently of the later real-data study. With αW=0.03, αH=0.04 and r=0.4, the scratch fit reached its stationarity tolerance after 385 updates: data cost about 0.00900556 and total objective about **1.01580058**. The configured ordinary fit's recomputed total is also about **1.01580058**, with its separate penalty terms printed. Keeping those terms separate shows why the small residual alone is not the complete optimized quantity.

The masked demonstration gives the third row no observations and uses a fractional 0.5 weight in the second row. With its stated squared penalties, it reaches tolerance after 270 updates, total about **0.29581822**, and third-row amounts `[0,0]`. The separate fixed-H query uses weights `[1,0,0.25]` and λ₂=0.2. Its scratch amounts are approximately `[1.779661017,0.677966102]`; public augmented NNLS gives `[1.779661017,0.677966102]` at the displayed precision. The all-missing quality prints `None`. Finally, a deliberately rejected negative-data fit leaves the earlier dictionary intact, and an empty query still returns shape `(0,2)` after next-fit rank was changed to 1. These are distinct numerical, missing-information and state contracts worth checking whenever you adapt the method.

For a changed-input exercise, keep the single pattern `[1,1]` and row `[2,0]`. First derive the amount with weights `[1,1]`, then with `[1,0]`, then add λ₂=1 to the masked problem. The three answers are 1, 2 and 1 respectively: the final cost is `0.5(2-w)²+0.5w²`. Explain why changing the omitted cell's finite placeholder cannot change the last two answers. Next rescale only C0 of the exact three-row example by s=2 and recompute the two L1 masses; the residual stays zero but the total penalty is 5.85. A correct implementation must reproduce both the information distinction and the changed objective, not just the shape of the output arrays.

We can now choose and inspect a factor-size preference, fit only actual measurements and keep unsupported quantities visibly separate from evidence. The next section returns to real digit measurements: we will inspect the stored dictionary and its contributions before deciding what its patterns mean.
