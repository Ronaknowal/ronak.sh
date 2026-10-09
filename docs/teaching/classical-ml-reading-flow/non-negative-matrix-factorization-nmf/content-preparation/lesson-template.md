# Non-Negative Matrix Factorization (NMF)

A bright pixel, a word count and a measured spectral band can all be built by adding contributions. NMF asks whether a table of such measurements can be explained by a small collection of nonnegative patterns and a different amount of each pattern for every observation. We will first build that explanation ourselves, then learn the patterns, inspect a recorded digit example and test what the factors can—and cannot—tell us.

You need addition, multiplication, array indexing and Python functions. Matrix multiplication, the constrained fitting problem and the stopping diagnostic are introduced here. The first pass follows sections 1–10, 12–13 and 19. Sections 11 and 14–18 extend the same ideas to penalties, incomplete observations, identifiability, anchors, new applications and streams. The complete section index belongs directly below this opening.

## 1. Build one observation from positive amounts

How could two reusable patterns explain three measured values?

Start with one observation: three measured bins, each with its own address.

<!-- figure:D01 -->

The bars belong to row **R0**. Its first feature, **F0**, measures 2 intensity units; **F1** measures 1; **F2** measures 3. A *feature* is one measured quantity, and a *row* is one observation containing all three quantities. The bin labels are addresses, not numerical values. We will keep those addresses through every transformation.

Suppose we have two possible patterns. A pattern tells us how one unit of a component contributes to all three features together.

<!-- figure:D02 -->

The blue pattern, **C0**, is `[1, 0, 1]`: one unit contributes 1 to F0, nothing to F1 and 1 to F2. The rose pattern, **C1**, is `[0, 1, 1]`. Two units of C0 produce the blue addend `[2, 0, 2]`; one unit of C1 produces the rose addend `[0, 1, 1]`. Add corresponding bins to obtain `[2, 1, 3]`, exactly R0.

The amounts are `[2, 1]`. An amount can exceed 1. It is an intensity multiplier, not a probability. The picture uses blue and rose to preserve component identity; the neutral bars show the sum. The sliders directly beneath the picture change the two amounts. Setting both to 1 gives `[1, 1, 2]`. Setting both to zero removes both addends. Notice that changing C0's amount always changes F0 and F2 together: that coupling is what makes a reusable pattern different from three unrelated adjustable bins.

Here is the same operation written compactly, with the pattern names still attached:

\[
\underbrace{[2,1,3]}_{\text{R0}}
=\underbrace{2}_{\text{amount C0}}\underbrace{[1,0,1]}_{\text{pattern C0}}
+\underbrace{1}_{\text{amount C1}}\underbrace{[0,1,1]}_{\text{pattern C1}}.
\]

All amounts and pattern entries are **nonnegative**: zero or larger. A component can add intensity or add nothing; it cannot subtract intensity to cancel another component. That constraint can be appropriate for measured counts or additive intensities. It does not establish that our invented patterns are physical sources.

Now keep the same two patterns and explain several observations.

<!-- figure:D03 -->

The middle address, C0 or C1, connects an amount to its pattern. The observation table **X** has three rows R0–R2 and three features F0–F2. The amount table **W** has three observation rows and two component columns. The pattern table **H**, also called the *dictionary*, has two component rows and three feature columns:

\[
W_{\rm exact}=\begin{bmatrix}2&1\\1&3\\0&2\end{bmatrix},\qquad
H_0=\begin{bmatrix}1&0&1\\0&1&1\end{bmatrix},\qquad
X_0=\begin{bmatrix}2&1&3\\1&3&4\\0&2&2\end{bmatrix}.
\]

Follow the marked output cell R1,F2. R1 uses amount 1 of C0 and amount 3 of C1. Both patterns contribute 1 per unit to F2, so this cell is `1×1 + 3×1 = 4`. Every output cell follows that same multiply-and-add rule. Matrix multiplication is the name for doing all those contractions together: `W @ H` in NumPy.

For a general table, let **n** be the number of observations, **d** the number of features and **k** the number of components. W has shape `n×k`, H has shape `k×d`, and the reconstruction W H has shape `n×d`. The repeated component dimension k is summed over. In mathematical notation, i runs from 1 to n, c from 1 to k and j from 1 to d; Python addresses begin at zero, so R1,F2 is mathematical row 2, feature 3.

\[
\widehat X_{ij}=\sum_{c=1}^{k}W_{ic}H_{cj},\qquad X\approx\widehat X=WH,\qquad W,H\ge0.
\]

The hat means *reconstructed*, rather than measured. An exact equality happens in our constructed example. For real data, fewer patterns usually leave some disagreement, which the approximation sign allows.

There is a second way to read the very same multiplication: follow one component through every observation.

<!-- figure:D04 -->

The blue column of W is `[2,1,0]`. Multiply each amount by the entire blue pattern `[1,0,1]`; the resulting blue contribution table is `[[2,0,2],[1,0,1],[0,0,0]]`. The rose contribution table is `[[0,1,1],[0,3,3],[0,2,2]]`. Their cellwise sum is X0. A zero amount removes a whole contribution row; a zero pattern entry removes a whole contribution column. The rectangular cells have equal layout area; their labels and bar heights carry magnitude.

This column-times-row construction is an **outer product**. NMF represents a table as a sum of k nonnegative outer products. *Factorization* means finding W and H whose product approximates X. So far we chose both factors ourselves. Learning them is the next problem, after we settle what their values mean and how to measure a mismatch.

## 2. Amount is not probability or identity

Section 1 built a measurement from amounts. Would dividing those amounts by their total make the interpretation clearer?

Compare the actual reconstruction with the reconstruction after that division.

<!-- figure:D05 -->

R0's amounts `[2,1]` sum to 3. Their fractions `[2/3,1/3]` sum to 1, but with H0 unchanged they reconstruct `[2/3,1/3,1]`, one third of R0. We have changed the measured intensity, not simply improved the labels. NMF amounts are sometimes called *activations*, *loadings* or *coefficients*. Those names still refer to W's multipliers; none makes them probabilities.

There is, however, a way to change an amount without changing its contribution: change the pattern's unit at the same time.

<!-- figure:D06 -->

At scale s=2, C0's pattern becomes `[2,0,2]` and its R0 amount becomes 1 instead of 2. The blue addend remains `[2,0,2]`. The same compensation applies to every amount in that component's W column. The slider changes s in both places, leaving the contribution table and reconstructed observations visible. Zero is excluded because division by zero cannot define the compensation.

For any positive scale s,

\[
(W_{:c}/s)(sH_{c:})=W_{:c}H_{c:}.
\]

The colon means all rows or all features at that address. Scaling changes the separate factors' units while leaving their product invariant. Reordering W's component columns and H's matching component rows also preserves the product: names can change without changing the explanation's numerical content.

These are not the only ambiguities. To see a genuinely different dictionary, we will switch explicitly to a second constructed example: patterns `[1,1,1]` and `[0,1,1]`, with amounts `[2,1]`. We need this example because H0's zeros would make the following subtraction invalid.

<!-- figure:D07 -->

The first pattern starts as the ray `[1,1,1]`; the second stays `[0,1,1]`. Moving t from 0 to 1 changes the first pattern to `[1,1−t,1−t]` and the amounts to `[2,1+2t]`. At t=1/2, the first pattern is `[1,1/2,1/2]` and the amounts are `[2,2]`. The prediction remains `[2,3,3]`: the blue contribution loses `[0,1,1]`, and the rose contribution gains exactly that vector.

\[
2[1,1-t,1-t]+(1+2t)[0,1,1]=[2,3,3],\quad 0\le t\le1.
\]

All entries remain nonnegative, yet the first pattern changes direction, not just length. Thus even a perfect reconstruction need not identify one unique dictionary. Section 14 will ask what additional conditions can identify patterns; here the important distinction is already visible: *fits the data* and *recovers the real parts* are different claims.

Return to R0 and H0. Which component contributes more to this row?

<!-- figure:D08 -->

The amount bars show `[2,1]`. The contribution totals show `[4,2]`, because C0 contributes `2×(1+0+1)=4` intensity units and C1 contributes `1×(0+1+1)=2`. At s=3, C0's amount shrinks to 2/3, below C1's amount 1, while its pattern becomes three times stronger. Its contribution remains 4. Ranking raw amounts can therefore reverse under an equally valid change of units.

When comparing components, first say what you are comparing. The vector `W[i,c] * H[c,:]` gives its per-feature contribution. Summing that vector gives one scale-invariant total. That total is useful for this intensity question; it is not a universal importance score or a causal attribution. We will use the same distinction when inspecting real digit pixels in section 12.

## 3. Measure the disagreement before choosing a loss

We can now build and interpret a reconstruction. How do we judge one that misses the measurements?

Keep R0 and H0, fix C1's amount at 1 and move only C0's amount.

<!-- figure:D09 -->

At C0 amount 1, the prediction is `[1,1,2]`, below R0 `[2,1,3]` by `[1,0,1]`. At amount 3, the prediction is `[3,1,4]`, above R0 by one unit in F0 and F2. The signed residual is measured minus reconstructed: positive means the reconstruction is too low; negative means it is too high. Amount 2 gives zero residual in all bins. Residuals can be negative even though amounts and patterns cannot.

\[
R=X-WH.
\]

A signed sum would let an overestimate cancel an underestimate. Squaring each residual instead makes both kinds of mistake cost something.

<!-- figure:D10 -->

For R1, the measured row is `[1,3,4]`; the initial reconstruction `[1,1,2]` leaves `[0,2,2]`. Each residual of length 2 produces a squared area 4. The sum is 8; half that sum is 4. The square's side has intensity units, while its area has squared intensity units. That geometric distinction matters when reading an error report.

Our fitting objective is **half the total squared disagreement**, also called the half-squared Frobenius objective:

\[
L(W,H)=\tfrac12\sum_{i=1}^{n}\sum_{j=1}^{d}(X_{ij}-(WH)_{ij})^2
=\tfrac12\lVert X-WH\rVert_F^2.
\]

The F subscript says to collect the squares of *all* matrix cells. The factor 1/2 makes derivatives simpler; it does not move the minimum. Starting with every amount equal to 1 and H0 fixed, the row losses are 1, 4 and 1, so L=6 for all nine observed cells.

These commonly reported quantities describe the same unweighted residuals on different scales:

| Quantity | Definition from L and N observed cells | Initial X0 value |
|---|---|---|
| Squared Frobenius norm | 2L | 12 |
| Frobenius norm | √(2L) | √12 ≈ 3.464102 |
| Mean squared error, MSE | 2L/N | 4/3 ≈ 1.333333 |
| Root mean squared error, RMSE | √(2L/N) | √(4/3) ≈ 1.154701 |

Norm and RMSE return to intensity units; squared norm, L and MSE use squared units. MSE averages over cells, not rows or components. With Frobenius loss, scikit-learn's `reconstruction_err_` is the residual norm √(2L), so comparing that number directly with our half-loss would compare different quantities.

Before choosing a loss, distinguish a measured zero from an absent measurement.

<!-- figure:D11 -->

Here we temporarily use one pattern `[1,1]` and a measured row `[x,0]`. If both bins were measured, the best amount is x/2: it compromises between the first bin asking for x and the second asking for zero. At x=2, the prediction `[1,1]` has half-loss 1. If the second bin was not measured, its hatched cell supplies no constraint. Amount x then fits the first bin exactly; at x=2, the included-cell loss is zero, but we have learned nothing about whether the unobserved second prediction is accurate.

Let **M** be a table of nonnegative weights. A binary weight 1 includes a measurement and 0 omits it. A fractional weight changes that cell's relative contribution to a weighted objective:

\[
L_M=\tfrac12\sum_{ij}M_{ij}(X_{ij}-(WH)_{ij})^2.
\]

Do not replace missing cells by observed zeros. An all-missing row has zero included objective for every reconstruction, so zero loss there is not evidence of quality. If reporting a weighted mean, explicitly state its denominator; division by the number of table cells and division by the sum of weights answer different questions. Section 11 derives the corresponding masked fitting updates.

Squared error is not the only way to express disagreement. To compare alternatives, we now isolate one strictly positive observation x and one strictly positive reconstructed value y.

<!-- figure:D12 -->

Each curve reaches zero at y=x. With x=2, predicting 1 or 3 costs 1/2 under half-squared error. The count-oriented generalized KL costs approximately 0.386294 at y=1 and 0.189070 at y=3. The relative-scale Itakura–Saito cost is approximately 0.306853 and 0.072132 respectively. These are different objectives, not three interchangeable units of one error score.

\[
\begin{aligned}
d_2(x,y)&=\tfrac12(x-y)^2,\\
d_1(x,y)&=x\log(x/y)-x+y,\\
d_0(x,y)&=x/y-\log(x/y)-1.
\end{aligned}
\]

Here log is the natural logarithm. Summing one chosen cell cost over the table gives its fitting objective. Generalized KL has a count interpretation: if independent counts have modelled mean y, the Poisson negative log-likelihood contains `y−x log y`; terms depending only on observed x do not change the optimizer. It is not the KL between normalized probability distributions unless that additional normalization and interpretation are supplied. Itakura–Saito depends on the ratio x/y, so rescaling both by the same positive factor leaves this cell cost unchanged. Squared error instead changes by the square of that scale. A choice of loss therefore encodes what kinds of discrepancy matter.

Their boundaries also differ. For KL, an observed zero contributes y; `(x,y)=(0,0)` contributes zero by continuity. A positive observation with y=0 has infinite KL. Itakura–Saito here requires both values to be positive. Adding a tiny constant to every zero changes the problem; it is not an invisible numerical repair. Section 7 will use these conventions in the KL update, and section 8 will connect the three losses to the beta family.

For now, we will fit the half-squared objective. Keeping that choice fixed lets us understand the optimizer rather than changing the question halfway through a calculation.

## 4. Encode a new row with the dictionary held fixed

Section 3 told us how to score a mismatch. Before learning a whole dictionary, can we find the best amounts for one new observation under a dictionary we already have?

Use two features instead of three so we can draw every attainable prediction in a plane. This is a separate geometry example: C0=`[1,0]`, C1=`[1,1]`.

<!-- figure:D13 -->

The horizontal ray is C0; the diagonal ray is C1. A nonnegative amount can move outward along either ray. Adding the two moves reaches the shaded **cone**, the wedge where the second coordinate is between zero and the first. A *cone* allows arbitrary nonnegative amounts; it does not restrict their sum to 1.

For query `[1,1/2]`, amount 1/2 of each pattern predicts the query exactly. For `[0,1]`, an exact prediction would need a negative horizontal amount, which NMF forbids. The closest feasible prediction is `[1/2,1/2]`, made from amounts `[0,1/2]`. The residual arrow reaches from that prediction to the observed query. The two query controls change the diamond; they leave both pattern rays fixed.

If the query is `[u,v]` with nonnegative u and v, prediction from amounts `[a,b]` is `[a+b,b]`. Inside the cone, `u≥v`, choose `[a,b]=[u−v,v]`. Outside, `v>u`, the optimum sits on the boundary a=0. Minimizing `1/2((u−b)²+(v−b)²)` gives b=(u+v)/2. At the zero query, both amounts can be zero. This tiny geometry gives us a complete answer before a solver appears.

The general fixed-dictionary problem is **nonnegative least squares**, abbreviated NNLS:

\[
\min_{w\ge0}\tfrac12\lVert x-wH\rVert_2^2,
\]

where x is one observed row and w is its k amounts. The subscript 2 denotes the ordinary Euclidean vector norm. With H fixed, this is a convex quadratic problem: there are no separated lower valleys. An optimizer can find a global fixed-H minimum, although dependent pattern rows can make the minimizing amounts nonunique.

Why not solve unconstrained least squares and clip negative amounts to zero?

<!-- figure:D14 -->

For query `[0,1]`, unconstrained amounts `[-1,1]` reconstruct it exactly. Clipping to `[0,1]` moves the prediction to `[1,1]`, half-loss 1/2. But `[0,1/2]` predicts `[1/2,1/2]`, half-loss 1/4. Clipping removed the negative horizontal cancellation without readjusting the diagonal amount. Because the two rays overlap in their first coordinate, that remaining amount must be optimized again.

The ordinary SciPy route solves this constrained problem directly:

```python
import numpy as np
from scipy.optimize import nnls

h = np.array([[1., 0.], [1., 1.]])
query = np.array([0., 1.])
amounts, residual_norm = nnls(h.T, query, maxiter=1000)
prediction = amounts @ h
half_loss = 0.5 * residual_norm**2
```

SciPy accepts a column-oriented design matrix, so `h.T` has shape `d×k`; the amount vector has length k. Its returned diagnostic is the **residual norm**, approximately 0.707107 here. Squaring it and dividing by two gives 1/4. The output amounts are `[0,0.5]` up to floating-point rounding. SciPy's maintained constrained solver is useful as an independent reference for our coordinate implementation in the next section.

Encoding changes the amounts, not the dictionary.

<!-- figure:D15 -->

The stored pattern rows and feature order stay on the fixed side of the boundary. A new row crosses the boundary, acquires new amounts and then reconstructs through those same patterns. A query with F0 and F1 swapped represents a different observation unless its columns are reordered deliberately. An empty query has zero rows and still returns two amount columns; it does not trigger a new fit.

This fit-versus-encode distinction will remain the same for real digits and text. We will first learn H from training rows, then hold it fixed for later rows. A query must not silently change the patterns against which earlier queries were interpreted.

## 5. Change one coordinate, then reuse the arithmetic

NNLS gave us the best amounts with fixed H. How can we implement the actual constrained optimization instead of delegating it?

Return to our original three-feature R1=`[1,3,4]` and H0. Start both amounts at 1; hold the rose amount at 1 while moving the blue amount a.

<!-- figure:D16 -->

The predicted row is `[a,1,a+1]`. Its residuals are `[1−a,2,3−a]`. The curve sums half their squared lengths. At a=1, loss is 4; at a=2, loss is 3; at a=3, loss is back to 4. The lowest point along this one-coordinate slice is a=2. It is not the lowest possible loss after changing both amounts, because the rose amount is still fixed.

\[
L(a)=\tfrac12\big[(1-a)^2+2^2+(3-a)^2\big]
=a^2-4a+7.
\]

The slope is `2a−4` and the curvature—the rate at which that slope changes—is 2. Setting the slope to zero gives a=2. If the unconstrained minimum fell below zero, the best allowed value would be the boundary a=0. That is a **coordinate update**: minimize over one amount while holding the others fixed.

We can reuse the same calculation across every row without rebuilding every residual for every amount.

<!-- figure:D17 -->

The **Gram matrix G** stores how much each pattern overlaps every pattern: `G=H @ H.T`, shape `k×k`. For H0, `G=[[2,1],[1,2]]`. Diagonal value 2 is a pattern's squared length; off-diagonal value 1 comes from the shared F2 bin. The **cross-product table P** stores each observation's overlap with every pattern: `P=X @ H.T`, shape `n×k`, here `[[5,4],[5,7],[2,4]]`. For R1 and C1, `P=3×1+4×1=7`.

Expand one row's half-loss, treating H as fixed:

\[
L(w)=\tfrac12\lVert x\rVert_2^2-wP_i^T+\tfrac12wGw^T.
\]

The first term does not depend on w. The slope of coordinate c is `(wG−P_i)_c`, and its curvature is `G_cc`. Therefore, for positive curvature, the constrained minimizing update is

\[
w_c\leftarrow\max\left(0,\ w_c-\frac{(wG-P_i)_c}{G_{cc}}\right).
\]

The division is by one positive scalar, not a matrix inverse. We compute G and P once while H stays fixed. Updating the entire component column `W[:,c]` handles every observation in a vectorized operation; no `n×d×k` contribution tensor is needed. If pattern c is all zero, its Gram diagonal and cross-products are zero. The reconstruction is independent of its amount; our implementation chooses amount zero for that flat coordinate instead of dividing by zero.

The order of the coordinate changes matters within a sweep.

<!-- figure:D18 -->

R1 starts at `[1,1]`. For C0, the slope is `1×2+1×1−5=−2`; subtracting slope/curvature changes the amount to 2. Next C1 must use that **new** 2: its slope is `2×1+1×2−7=−3`, so its amount becomes `1−(−3)/2=2.5`. One cyclic sweep returns `[2,2.5]`, prediction `[2,2.5,4.5]`, half-loss 3/4.

The other lane uses stale C0=1 while updating C1, yielding C1=3. It describes a simultaneous update, not the cyclic algorithm. Neither lane's one sweep is automatically the fixed-dictionary optimum `[1,3]`. A sweep means that each coordinate had one turn; it does not mean all coordinates are jointly solved. Repeating cyclic sweeps lets the next C0 adjustment account for the changed C1.

The core operation is short:

```python
gram = h @ h.T
cross = x @ h.T
for c in range(h.shape[0]):
    curvature = gram[c, c]
    if curvature == 0:
        w[:, c] = 0.0
    else:
        slope = w @ gram[:, c] - cross[:, c]
        w[:, c] = np.maximum(0.0, w[:, c] - slope / curvature)
```

Here x, w and h are validated float64 arrays. Assigning one column before visiting the next makes the freshness visible. The complete implementation separates that kernel from validation and retains its Gram/cross caches across fixed-dictionary encoding sweeps. A changed H requires new caches.

How do we know when further feasible coordinate movement offers no first-order improvement?

<!-- figure:D19 -->

Use the two-feature cone example again. At optimal amounts `[0,1/2]`, the gradient is `[1/2,0]`. C0's positive slope does not mean the optimizer failed: reducing its amount would lower the loss, but that would leave the allowed nonnegative quadrant. Increasing it is feasible and would raise the loss. At amounts `[0,0]`, by contrast, the C1 slope is −1: increasing that zero amount is feasible and lowers the loss.

The **Karush–Kuhn–Tucker conditions**, or KKT conditions, express this boundary logic for this smooth constrained problem. For each coordinate, a positive amount requires zero slope; an amount at zero requires a nonnegative slope. Equivalently, `w≥0`, `g≥0`, and `w_c g_c=0`, where `g=wG−P_i`. The *projected gradient* keeps slopes on positive coordinates, keeps negative slopes at zero, and suppresses positive slopes at zero:

\[
g_c^{\rm proj}=\begin{cases}
g_c,&w_c>0,\\
\min(g_c,0),&w_c=0.
\end{cases}
\]

Its norm is zero exactly at these first-order conditions in exact arithmetic. Our code uses its norm relative to the initial norm as a declared stopping test. A small value is a numerical tolerance statement, not exact zero. For the convex fixed-H problem these conditions characterize a global minimum; section 6 explains why fitting both factors requires a weaker conclusion.

**Deeper: where the later penalty arguments enter this same kernel.** A penalty is an extra cost attached to amounts. Adding `λ₁ Σ_c w_c + (λ₂/2) Σ_c w_c²`, with nonnegative λ values, adds slope `λ₁+λ₂ w_c` and curvature λ₂. Thus the update becomes

\[
w_c\leftarrow\max\left(0,\ w_c-
\frac{(wG-P_i)_c+\lambda_1+\lambda_2w_c}{G_{cc}+\lambda_2}\right).
\]

Both λ₂ terms are necessary: adding it to curvature alone would solve a different coordinate problem. In `coordinate_block`, `l1` and `l2` name these two coefficients; both default to zero for the current unpenalized lesson. With a flat zero pattern, λ₂>0 makes zero the unique penalized optimum; λ₂=0 with λ₁>0 also chooses zero. Section 11 will connect these local coefficients to dimension-scaled library settings and explain why penalties change the scale ambiguity.

## 6. Fit both factors and decide when to stop

Section 5 changed amounts with fixed patterns. To learn the dictionary too, what changes when we give the pattern entries their own turn?

Transpose the same problem rather than inventing a different optimizer.

<!-- figure:D20 -->

The first lane holds H0 fixed and updates W. Starting with W filled with ones, one cyclic sweep gives

\[
W_1=\begin{bmatrix}2&1\\2&5/2\\1/2&7/4\end{bmatrix}.
\]

The half-loss falls from 6 to 15/16. The next lane holds **that new W1** fixed and updates H. In the transposed problem, the observation table is `X.T`, the changing amount table is `H.T`, and the fixed dictionary is `W1.T`. The identical coordinate kernel gives

\[
H_1=\begin{bmatrix}
8/11&3/22&19/22\\
0&641/605&569/605
\end{bmatrix}.
\]

The half-loss then becomes `11733/26620≈0.440759`. The repeated component ports show which factor is fixed at each stage. Back and Reset restore entire earlier factor pairs, not just their displayed loss. This **W-first, then new-W H** order defines the coordinate route taught here. Section 7's multiplicative route will deliberately use the opposite block order.

Why can each block be convex while the combined fit is not?

<!-- figure:D21 -->

Shrink the entire example to one observed scalar x=1 and two nonnegative factors w and h. Factor pairs `(1,1)` and `(2,1/2)` both reconstruct 1 and have zero loss. Their midpoint `(3/2,3/4)` reconstructs 9/8, with half-loss 1/128. For a convex joint objective, the midpoint's loss could not exceed the average of the endpoint losses, which is zero. It does, so the joint objective is nonconvex—even in this smallest case.

Holding h fixed still leaves a convex parabola in w. Alternating useful block steps can lower the joint loss, but it does not turn the joint landscape into a convex one. Different initial factors can lead to different stationary solutions. The scale ambiguity from section 2 also remains unless extra constraints or penalties change it.

Loss improvement and stationarity answer different stopping questions.

<!-- figure:D22 -->

For this diagnostic picture only, take a fixed scalar pattern 1 and target 1. At amount w=0, half-loss is 1/2 and projected-gradient norm is 1. A procedure that refuses to move a zero amount would report no loss change while leaving an obvious improving direction. At w=1/2, loss is 1/8 and projected-gradient norm is 1/2. At w=1, both are zero. Section 7 will show an actual update rule that can become locked at zero; here the picture establishes why “unchanged” is insufficient evidence of convergence.

For both factors together, the gradients are

\[
\nabla_W L=(WH-X)H^T\quad(n\times k),\qquad
\nabla_H L=W^T(WH-X)\quad(k\times d).
\]

The coordinate derivation already gave the first expression as `WG−P`. Transposing gives the second. Apply the same boundary rule to both factors, then combine their projected-gradient norms by the square root of the sum of their squares. Call the initial combined norm b. Our stopping rule is `current_norm ≤ tol × b`. If b=0, the supplied factors are already stationary under this test. Otherwise a cap ends the computation after the requested maximum number of outer iterations, even if the tolerance has not been reached. The returned status says which happened.

This is a **stationarity diagnostic**, not a certificate of the best joint factorization, uniqueness or true source recovery. Its numerical value also depends on factor scale: the invariant reconstruction from section 2 does not make gradients in differently scaled parameter coordinates identical. Compare diagnostics under declared coordinates, tolerances and initialization rather than treating one threshold as universal.

What does an efficient implementation keep in memory?

<!-- figure:D23 -->

For our `n=3,d=3,k=2` example, the input contains 9 cells, returned W contains 6, and fitted H contains 6. A fixed-H block uses a 4-cell Gram and 6-cell cross-product table. Once H changes, those caches are obsolete. The diagnostic's row block stores only its current residual rows. The brackets distinguish **returned training amounts**, **retained fitted dictionary and feature order**, and **temporary workspace**.

For general dimensions, forming each outer iteration's caches costs `O(ndk+(n+d)k²)` arithmetic; q cyclic sweeps add `O(q(n+d)k²)`. Reconstructing to measure the objective adds `O(ndk)`. Sequential cache workspace is `O(k²+max(nk,kd))`, alongside the input/factors and a row-block residual buffer. This is an efficient dense reference, not a hardware timing result or a claim that sparse or specialized solvers cannot be better for a different problem.

The implementation below stores only H, immutable ordered feature IDs, fitted stopping settings and diagnostics after fitting. `transform` uses that snapshot to solve new fixed-H amounts; `inverse_transform` multiplies amounts by its H. Changing `n_components` prepares a future fit but does not resize an already fitted model. A new candidate is built in local arrays; only a fully valid candidate replaces the old snapshot. If a fit fails, the earlier dictionary and query behavior remain usable.

The shared array helpers reuse exactly `real_table` from [PCA's supplied `centered_pca.py`](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python). That helper copies a finite real two-dimensional table and checks its feature count. We add nonnegativity checks here. We do **not** call PCA fitting or subtract feature means: doing so would change the data and can introduce negatives.

Place the supplied Python files in one directory. In a local environment with Python, NumPy, SciPy and scikit-learn, run the program from that directory. The recorded new examples below were executed with Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; these are tested versions, not a promise about every installation.

```sh
python -m venv .venv
# Activate .venv using the command for your shell, then:
python -m pip install numpy scipy scikit-learn
python nmf_coordinate.py
```

`nmf_arrays.py` supplies the shared table contracts and objective reductions. `frobenius_metrics` streams row blocks; `weighted_half_square` evaluates included cells only. Its generalized KL helper uses a short local series when x and y nearly agree, avoiding subtraction of nearly equal first-order terms. That numerical rearrangement preserves the stated cost to floating-point accuracy; it does not introduce a hidden floor. The stable norm scales entries before squaring them. Products outside finite float64 arithmetic are refused with a rescaling message, rather than published as fitted state.

<!-- source:nmf_arrays.py -->

The complete recorded output of `python nmf_arrays.py` follows. The reconstruction has three equal rows because this demonstration uses unit amounts; its whole-table squared residual norm is 12, so the half-square is 6 and the MSE is 12/9. The final two lines separately check an observed zero under KL and included-cell weighting.

```text
reconstruction [[1.0, 1.0, 2.0], [1.0, 1.0, 2.0], [1.0, 1.0, 2.0]]
half_square 6.0 squared_norm 12.0
norm 3.4641016151377544 mse 1.3333333333333333 rmse 1.1547005383792515
kl_zero_count 2.0
masked_half_square 6.0
```



The coordinate program separates `block_cache` from `coordinate_sweeps`. During a fixed-H query, both G and P remain fixed across all sweeps and are formed once. During fitting, changing the opposite factor rebuilds the appropriate cache. `coordinate_block` deliberately changes a writable float64 factor in place; the public fit/encode methods validate and copy caller inputs before using that kernel.

<!-- source:nmf_coordinate.py -->

The guarded example first prints the hand-traced sweep, then fits the same tiny table by our scratch route and an explicitly configured ordinary `NMF` estimator. Both receive copies of the same W0 and H0. `init='custom'` means those arrays supply the initialization; `solver='cd'` selects coordinate descent, `beta_loss='frobenius'` selects our squared objective, both alphas are zero, and `shuffle=False` makes coordinate order explicit.

The complete recorded stdout starts with that first sweep, then shows the fitted reconstruction, stopping diagnostic, ordinary comparison and empty-query shape:

```text
one_sweep_w [[2.   1.  ]
 [2.   2.5 ]
 [0.5  1.75]]
one_sweep_h [[0.72727273 0.13636364 0.86363636]
 [0.         1.05950413 0.94049587]]
one_sweep_half_loss 0.4407588279489105
scratch_status stationary-tolerance last_diagnostic (32, 2.0802680502249785e-13, 6.978495630105192e-07)
scratch_reconstruction [[1.9999998  0.99999985 3.00000015]
 [1.0000004  3.         4.        ]
 [0.0000004  2.00000006 1.99999994]]
ordinary_half_loss 1.4220050528421603e-14 ordinary_residual_norm 1.6864193149049023e-07
empty_query_shape (0, 2)
```

The scratch fit stopped at its declared tolerance after 32 outer sweeps, with half-loss approximately `2.080268×10⁻¹³` and combined projected-gradient norm `6.978496×10⁻⁷`. The ordinary route's half-loss was approximately `1.422005×10⁻¹⁴`, with residual norm `1.686419×10⁻⁷`. These are outputs from the tiny constructed example, not a real-data performance study. Different stopping implementations can stop at different iterates even from matching inputs. Compare the actual objective, reconstruction, constraints and diagnostics; do not require identical arbitrary factors or infer universal superiority from the smaller final number.

For an independent constrained-block reference, the following complete program calls public SciPy NNLS for each observation row, then for each feature in the transposed problem. Those exact convex block solves differ from taking just one cyclic sweep. Its `encode_nnls` returns both amounts and the ordinary residual norm; `alternating_nnls` records the joint half-loss after each W-then-H pair.

<!-- source:nmf_nnls.py -->

Here is its complete recorded stdout. The signed unconstrained answer, clipped answer and reoptimized NNLS answer remain separate; the last line compares their constrained predictions with the scratch route.

```text
unconstrained [-1.0000000000000002, 1.0]
clipped [[0.0, 1.0]] half_loss 0.5
nnls [[0.0, 0.49999999999999994]] residual_norm [0.7071067811865472]
scratch [[0.0, 0.5]] diagnostic {'status': 'stationary-tolerance', 'iterations': 1, 'projected_gradient': 0.0}
same_prediction True
```



Its cone example prints clipped amounts `[0,1]` with half-loss 1/2, NNLS amounts `[0,0.5]` with norm approximately 0.707107, and scratch amounts `[0,0.5]` with zero projected gradient. Their predictions agree. Duplicate or zero patterns need not give unique amounts; compare reconstructed rows, objective and KKT conditions in that case. NNLS's internal active-set work depends on the problem, so these per-row calls are not automatically faster than the batched coordinate route.

Try a changed case before proceeding: keep H0 fixed, start R1 at `[1,1]` and take only the C0 update. You should obtain `[2,1]` and half-loss 3. Now take C1's update using the new 2; you should obtain `[2,2.5]` and half-loss 3/4. Explain why neither step can modify another observation's measurements or the fixed dictionary. The larger practice set in section 19 will ask you to diagnose stale operands, boundary gradients and rejected fitted states without replaying these exact numbers.

## 7. Explain the multiplicative route

The coordinate route subtracts a slope-based correction and enforces the nonnegative boundary. Can we instead preserve nonnegativity by multiplying each current entry by a nonnegative corrective ratio?

Return to X0, W filled with ones and H0. This time give H the first turn.

<!-- figure:D24 -->

Follow the marked pattern entry H[C0,F2]. Its current value is 1. The numerator is 9, the amount-weighted overlap with the observed F2 column. The denominator is 6, the corresponding overlap with the current reconstruction. The ratio is 9/6, so the entry becomes `1×9/6=1.5`. The blue and rose component addresses stay attached to both products; the neutral reconstructed bins supply the denominator.

Across the full pattern matrix, the numerator is `[[3,6,9],[3,6,9]]`, the denominator is `[[3,3,6],[3,3,6]]`, and the new H is `[[1,0,1.5],[0,2,1.5]]`. A zero entry remains zero when multiplied by a finite ratio. Nonzero entries can grow or shrink. Every entry in this H block uses the same old W and H: it is a simultaneous block update, unlike section 5's fresh-within-sweep cyclic coordinates.

The Frobenius multiplicative updates are

\[
H\leftarrow H\odot\frac{W^TX}{W^TWH},\qquad
W\leftarrow W\odot\frac{XH^T}{WHH^T}.
\]

The symbol ⊙ means elementwise multiplication, and the fraction means elementwise division of equally shaped tables. The H numerator and denominator both have shape `k×d`; the W pair both have shape `n×k`. In the second formula, H is the **new H from the first formula**. The amount update then gives

\[
W_1=\begin{bmatrix}13/11&13/17\\14/11&24/17\\6/11&14/17\end{bmatrix}.
\]

The resulting half-loss is approximately 0.743659. Section 6's one coordinate sweep ended at approximately 0.440759, but it used a different block order and different block updates. Those two numbers illustrate the specified operations; one comparison on a constructed table cannot rank optimizers in general.

To trace H-first order without initial zeros, switch explicitly to this second constructed table and its supplied positive factors:

<!-- figure:D25 -->

The three observations are now `[[2,1,3],[1,2,3],[3,3,6]]`. Initial amounts are `[[1,1/2],[1/2,1],[1,1]]`; initial patterns are `[[1,1/5,4/5],[1/5,1,4/5]]`. The first stage produces pattern rows `[110/53,20/49,42/17]` and `[20/49,110/53,42/17]`. The next stage's amount denominator uses those updated patterns, not their starting values. The displayed W entries become approximately `[0.826888,0.393655]`, `[0.393655,0.826888]` and `[1.212145,1.212145]`.

Following the literal arrays through the two ports reduces half-loss from 17.06 to approximately 0.03944744 in this one outer update. The stepper exposes both factor states so you can check the changed operands. The complete `nmf_step.py` example supplies a longer recorded run of this same fixture; the single-step picture describes this calculation, not a fabricated intermediate training history.

What happens if we repeat that same H-first sweep forty times?

The following complete original `nmf_step.py` keeps D25's three observations and positive starting factors. Save it in the same local Python environment as the other supplied files and run `python nmf_step.py` deliberately. It needs NumPy only; it does not fetch data or call a library NMF estimator.

```python title="nmf_step.py"
import numpy as np

X = np.array([[2., 1., 3.], [1., 2., 3.], [3., 3., 6.]])
W = np.array([[1., .5], [.5, 1.], [1., 1.]])
H = np.array([[1., .2, .8], [.2, 1., .8]])

def objective(X, W, H):
    return np.sum((X - W @ H) ** 2) / 2

print(0, round(objective(X, W, H), 8))
for iteration in range(1, 41):
    H *= (W.T @ X) / ((W.T @ W) @ H)
    W *= (X @ H.T) / (W @ (H @ H.T))
    if iteration in (1, 2, 10, 40):
        print(iteration, round(objective(X, W, H), 8))
```

Read the two assignments in order. The first computes every H multiplier from the old W/H and then changes H in place. The next computes W's multipliers using that **new H**. The loop prints the initial half-loss, then only sweeps 1, 2, 10 and 40; the unprinted sweeps still occur. Here is the original recorded output, preserved rather than rerun:

```text
0 17.06
1 0.03944744
2 0.02823377
10 0.00180608
40 5e-08
```

At printed sweep 1 the loss is 0.03944744, the rounded result of D25's literal one-step calculation. By sweep 40 the printed loss is 5×10⁻⁸, small but not an exact zero or a convergence certificate. The program runs a fixed number of sweeps and prints no projected-gradient diagnostic; it neither proves the best joint factorization nor establishes that its factors equal the ones from section 1. Its observations and initial factors are the separately announced D25 fixture, and scale/nonuniqueness remain possible.

This short historical positive-input demonstration intentionally exposes the two array updates without general shape, domain, overflow or stopping checks. The complete validated `nmf_multiplicative.py` route later in this section supplies those contracts. Do not add a hidden epsilon or reinterpret this retained rounded output as a newly executed benchmark. Its code and output are the original preserved example; the newly authored robust route and its independently labelled streams have their own evidence.

Does multiplication automatically solve the boundary problem?

<!-- figure:D26 -->

Keep a fixed other contribution of 1 and a measured target of 2. The editable amount w adds directly, so the prediction is w+1. At w=0, the multiplicative ratio is `2/(w+1)=2`, yet the new amount is still `0×2=0`. The half-loss stays 1/2 and the slope is −1. Increasing w is feasible and lowers the loss: this state fails the KKT test from section 5. Coordinate minimization instead chooses w=1 and loss zero.

At w=1/4, the multiplicative step gives `(1/4)×2/(5/4)=2/5`, while the exact coordinate step still gives 1. At w=1, both stay at the optimum. The persistent comparison shows **zero locking**: multiplicative updates cannot revive an exact zero through a finite multiplier. No-loss-change alone therefore cannot certify stationarity. A positive initialization avoids this particular initial lock but does not guarantee the best joint solution.

The denominators in that example are positive. A different boundary deserves an explicit convention: if numerator and denominator are both zero, our code retains that entry as a flat update. A positive numerator over zero denominator is refused. We do not add an epsilon and pretend the original objective was unchanged. Supported finite positive multiplication can also underflow after many steps toward zero; the reference reports that numerical refusal rather than silently certifying a minimum. The loss trace and projected gradient remain separate diagnostics.

Section 3 introduced a count-oriented loss. What does its corrective ratio mean?

<!-- figure:D27 -->

Two components each contribute rate 1, giving total predicted rate 2 in one bin. For observed count 4, their equal shares allocate 2 counts to each component. For count 2, each receives 1. For observed count zero, both receive zero, while the KL cost is still the predicted rate 2. The count control changes the observation; the two modelled contributions remain fixed, so there is no hidden refit during the allocation picture.

In general, component c's fraction of a positive predicted rate Y_ij is `W_ic H_cj / Y_ij`. Multiplying by X_ij allocates the observed count proportionally. These nonnegative allocations sum to the observed count for that cell. They are a useful explanation of a KL update; they are not probabilities that an observation belongs to a class.

Let Y=WH and let Q be the elementwise count/rate ratio X/Y, with Q=0 where both observed count and predicted rate are zero. Generalized-KL multiplicative updates use

\[
H_{cj}\leftarrow H_{cj}\frac{(W^TQ)_{cj}}{\sum_iW_{ic}},\qquad
W_{ic}\leftarrow W_{ic}\frac{(QH^T)_{ic}}{\sum_jH_{cj}}.
\]

Recompute Y and Q after H changes, before updating W. For positive X_ij and zero Y_ij, the loss is infinite, so our supported finite route refuses the calculation. For X_ij=0 and Y_ij>0, the ratio is zero, but the cell still contributes Y_ij to KL. The gradient of a supported cell with respect to its predicted rate is `1−X_ij/Y_ij`; multiplying this rate-gradient table by the appropriate factor gives the W and H gradients and their projected-gradient diagnostic.

Here is the complete Frobenius/KL route. `multiplicative_sweep` returns new factors, H first. `fit_multiplicative` returns one complete read-only fitted snapshot; it does not gradually publish partly updated state. The snapshot retains ordered features and loss/stopping settings. Its `transform` changes only new amounts; its `inverse_transform` reconstructs them. Fixed-H Frobenius queries retain their Gram/cross products across repeated updates, whereas KL queries recompute their changing rate ratios.

<!-- source:nmf_multiplicative.py -->

For Frobenius, Gram/cross contractions give dense outer-update cost `O(ndk+(n+d)k²)`. The KL route constructs its `n×d` prediction and ratio tables and multiplies them with the factors, costing `O(ndk)` per dense block and requiring that `n×d` workspace. These choices expose the actual mechanism and its memory cost. Very sparse counts or larger-than-memory tables call for a sparse or blocked implementation with the same support semantics, not an unannounced switch in the objective.

The ordinary route uses `NMF(solver='mu', init='custom', ...)`. The spelling `beta_loss='frobenius'` selects squared error; `'kullback-leibler'` selects generalized KL. Both alphas are zero here. We give scratch and ordinary fits copies of the same inputs and initial factors, then recompute the chosen objective from their returned factors. Their internal block order and stopping rules need not match, so neither identical iterates nor one-step parity is promised.

The recorded Frobenius example reached the 2,000-iteration cap with scratch half-loss approximately `4.152819×10⁻⁷` and projected-gradient norm `0.001245492`; the ordinary half-loss was approximately `4.135019×10⁻⁷`, with its cap warning retained. Those small losses are not declarations that the tolerance was reached.

This complete retained stdout belongs to the original Frobenius portion of this demonstration. Its subsequent zero-containing KL run refused numerical underflow; that failure and its diagnostic stream remain retained. The current positive shifted KL comparison is shown separately below, so this block does not claim that the changed current full main was rerun.

```text
H_first [[1.0, 0.0, 1.5], [0.0, 2.0, 1.5]]
W_using_new_H [[1.1818181818181819, 0.7647058823529411], [1.2727272727272727, 1.411764705882353], [0.5454545454545454, 0.8235294117647058]]
one_sweep_half_loss 0.7436586691069231
locked_zero [0.0]
frobenius scratch iteration-cap (2000, 4.152819365831646e-07, 0.0012454915810381569)
frobenius ordinary_objective 4.135018819456024e-07
frobenius empty_shape (0, 2)
```



For the runnable KL comparison, explicitly add `[0.5,0.25,0.75]` to each X0 row. This is an additional 1/2 unit of C0 and 1/4 unit of C1, so it keeps the additive mechanism while making all three measured bins positive. The table becomes `[[2.5,1.25,3.75],[1.5,3.25,4.75],[0.5,2.25,2.75]]`. This comparison isolates the optimizer from the long-run zero-boundary underflow illustrated by the original zero-containing run. KL itself still supports observed zeros with the conventions just taught.

Run this comparison alone with `python nmf_multiplicative.py --loss kl`. In the recorded execution, scratch reached its stationarity tolerance after 98 outer updates with KL approximately `8.699385×10⁻¹³`; the ordinary objective was approximately `7.585221×10⁻¹⁶`. Both empty-query encodings had shape `(0,2)`. These results belong to the positive shifted table, not X0 or the recorded digit study.

The complete stdout of that separately executed `--loss kl` comparison is:

```text
kl_observations [[2.5, 1.25, 3.75], [1.5, 3.25, 4.75], [0.5, 2.25, 2.75]]
kl scratch stationary-tolerance (98, 8.699385011792663e-13, 8.424620688497679e-07)
kl ordinary_objective 7.58522071895324e-16
kl empty_shape (0, 2)
```



We now have the update formulas, their literal operands and a concrete failure at a boundary. The next question is why a supported multiplicative step can lower its objective—and exactly what that descent argument does not prove.

## 8. Why the upper bound gives a safe step

Section 7 showed what a multiplicative update does. What makes a supported step a descent step rather than merely a plausible correction?

Keep H0 fixed and the second amount equal to 1; only the first amount can move.

<!-- figure:D28 -->

The horizontal position is a candidate first amount z. The measured row remains `[2,1,3]`; the reconstructed row is `[z,1,z+1]`. Its half-squared loss is therefore `(z−2)²`, the lower curve. The current amount a marks where the upper curve touches it. Both curves have the same height and slope there, but the upper curve rises more rapidly away from that point.

At a=1, the loss is 1. The upper curve's minimum is at z=5/3. Moving there lowers the upper curve to 1/3 and the actual loss further to 1/9. The three marked heights tell us why this is safe: the new actual loss cannot exceed the new upper bound, and minimizing that bound cannot exceed its old touching height. The amount control moves the touching point and rebuilds the bound; it does not change the measurements or H0. At a=2, both curves are minimized at the current amount, so there is no move.

Here is the exact upper curve shown in the picture:

\[
\begin{aligned}
f(z)&=(z-2)^2,\\
Q(z\mid a)&=f(a)+2(a-2)(z-a)
+\tfrac12\left(2+\frac1a\right)(z-a)^2,\qquad a>0,\\
Q(z\mid a)-f(z)&=\frac{(z-a)^2}{2a}\ge0.
\end{aligned}
\]

The vertical bar in `Q(z|a)` means “evaluate candidate z while keeping the bound's current touching point a fixed.” It is not a conditional probability. The last line proves that the upper curve really stays above the loss for every candidate z, rather than merely looking that way in a plot. Its derivative vanishes at `z=a×5/(2a+1)`, exactly the fixed-H multiplicative amount update. Our supported figure uses a between 1/4 and 2, so it never divides by a zero current amount.

This method is called **majorization–minimization**, or MM. *Majorize* means construct an upper function that touches the original at the current state; *minimize* means lower that upper function while holding its construction fixed. The upper function is also called an **auxiliary function**. If a new state is chosen this way,

\[
f(z_{\rm new})\le Q(z_{\rm new}\mid a)
\le Q(a\mid a)=f(a).
\]

The logic even permits a step that lowers, rather than fully minimizes, the upper function. It proves a loss inequality. It does not say that the new state is a global minimum, or that an unchanged state passes the boundary KKT test.

The scalar picture fixed the other amount. Why can a *diagonal* upper bound safely update all amounts at once, although the patterns overlap?

<!-- figure:D29 -->

Blue and rose amounts share F2, so changing one can affect the usefulness of changing the other. Their overlap matrix is G=`[[2,1],[1,2]]`. At current amounts v=`[1,1]`, the diagonal bound uses K=`[[3,0],[0,3]]`: each coordinate gets extra curvature. The difference K−G is `[[1,−1],[−1,1]]`. For proposed increments Δ0 and Δ1, its quadratic form is `(Δ0−Δ1)²`. Increments `[1,0]` give 1; equal increments `[1,1]` give zero. The shaded square is the extra curvature, not a residual-error square from section 3.

We can now prove the general fixed-H result. Treat one amount row as a column vector w for this derivation, and write its current positive values as v. Define

\[
G=HH^T,\qquad p=Hx^T,\qquad
K_{cc}=\frac{(Gv)_c}{v_c},\quad K_{cd}=0\;(c\ne d).
\]

These are the same Gram and cross products from section 5, with the cross row transposed to match our temporary column notation. The fixed-H loss has gradient `Gv−p` and Hessian G. A Hessian is the matrix of second derivatives: here it describes how the slope of one amount changes when another amount changes. Because the loss is quadratic, its expansion around v is exact. Replacing G by K gives

\[
Q(w\mid v)=f(v)+(w-v)^T(Gv-p)
+\tfrac12(w-v)^TK(w-v).
\]

Every entry of G is nonnegative because H is nonnegative. For an arbitrary increment vector Δ,

\[
\Delta^T(K-G)\Delta
=\tfrac12\sum_{c,d}G_{cd}v_cv_d
\left(\frac{\Delta_c}{v_c}-\frac{\Delta_d}{v_d}\right)^2\ge0.
\]

Each summand is a nonnegative weight times a square. Expanding the square gives the diagonal terms from K and the cross terms from −G. This is what **positive semidefinite**, abbreviated PSD, means for K−G: its quadratic form is never negative. Consequently `Q−f` is nonnegative for every increment. At w=v the gap and first derivative of the gap are zero, establishing touching as well as upper-bounding.

Since K is diagonal, its bound separates into one quadratic per amount. Assuming a positive current v and positive `(Gv)c`, minimize each one:

\[
w_c^{\rm new}=v_c-\frac{(Gv-p)_c}{K_{cc}}
=v_c\frac{p_c}{(Gv)_c}.
\]

The nonnegative numerator makes this a feasible nonnegative update. This establishes the Frobenius rule from section 7 without treating overlapping coordinates as independent in the original loss. A zero numerator can take the new amount to zero; this positive-current derivation does not justify dividing by that new zero on a subsequent step. Refer back to **zero locking** and the flat/support conventions for that boundary. Transpose the same argument for the H block, then compose the two blockwise inequalities for a full supported outer sweep.

Does the Frobenius proof establish every multiplicative rule for every loss?

We can join section 3's losses with a shape parameter called beta (β); its value also changes the safe update power.

<!-- figure:D30 -->

The first comparison deliberately fixes one positive corrective ratio at 4 and the old coordinate at 1. It isolates the exponent: at beta=0, MM multiplies by `4^(1/2)=2`, whereas an exponent-one heuristic multiplies by 4. Throughout beta from 1 to 2, both use power 1. At beta=3, MM again uses power 1/2. The two output bars remain visible together; beta changes the power in this illustration, not a hidden NMF dataset or a freshly estimated ratio.

The deeper panel explains where that power comes from. A reconstructed bin is a sum of component contributions. At the current positive state, divide each contribution by the bin's total to obtain nonnegative shares that sum to 1. A curve bending upward, called convex, lies below the share-weighted chord joining its component arguments. A curve bending downward, called concave, lies below its tangent: the straight line with the same height and slope at the current argument. These two labelled upper bounds let us separate the components while still touching at the current state. Their arrows refer to a bound construction, not to a new data-generation process.

The beta family has the following cell cost:

\[
d_\beta(x,y)=
\begin{cases}
\dfrac{x^\beta+(\beta-1)y^\beta-\beta xy^{\beta-1}}
{\beta(\beta-1)},&\beta\notin\{0,1\},\\
x\log(x/y)-x+y,&\beta=1,\\
x/y-\log(x/y)-1,&\beta=0.
\end{cases}
\]

At β=2, the first branch is exactly half-squared error. The separate branches at 1 and 0 are the continuous limits; substituting 1 or 0 into the general fraction would divide by zero. Summing this cell loss over observations and features defines `D_beta(X,WH)`. For this derivation and the new general-beta implementation, all observations, factors and reconstructions are strictly positive. That deliberately narrower implementation contract does not erase Frobenius or KL's wider mathematical zero support.

For a fixed-H amount block, let Y=WH and define two nonnegative tables with shape `n×k`:

\[
B=(X\odot Y^{\beta-2})H^T,\qquad
A=Y^{\beta-1}H^T.
\]

Powers act cell by cell. A is the positive contribution to the gradient, B the subtracted contribution, so the amount gradient is A−B. At β=2, B is XHᵀ and A is WHHᵀ. At β=1, B is `(X/Y)Hᵀ` and A is the sum of each pattern across features. The new family therefore connects to the exact products already taught, rather than introducing unrelated operators.

For one coordinate, hold its current amount v fixed and write a candidate amount as `v×r`, where r is its positive multiplier. Decomposing the beta loss into convex and concave parts, then applying the chord and tangent bounds from the panel, gives the following auxiliary-function derivatives with respect to the candidate amount:

| Beta range | Bound derivative | Positive root r |
|---|---|---|
| β<1 | A−B r^(β−2) | (B/A)^(1/(2−β)) |
| 1≤β≤2 | A r^(β−1)−B r^(β−2) | B/A |
| β>2 | A r^(β−1)−B | (B/A)^(1/(β−1)) |

Here A and B mean the selected entries of the tables computed at the old state; they are not recomputed while solving this scalar bound. Every derivative agrees with A−B at r=1, as touching requires. Setting it to zero gives the root in the last column. This is the source of the piecewise power, not a numerical damping constant chosen by trial and error:

\[
W\leftarrow W\odot(B/A)^{\gamma(\beta)},\qquad
\gamma(\beta)=
\begin{cases}
1/(2-\beta),&\beta<1,\\
1,&1\le\beta\le2,\\
1/(\beta-1),&\beta>2.
\end{cases}
\]

For β<1, the observation-dependent part of the loss is convex and its other y-dependent part is concave; for β>2 their roles switch. In the middle range, the whole cell loss is convex in y. At β=0 or 1, use the corresponding limiting loss and derivative. The actual shares are `v_c H_cj / Y_ij`; weighting the convex bounds by those shares yields component-separated terms, while a tangent handles the concave term. This explains both the derivative table and why the Frobenius diagonal-quadratic proof should not simply be asserted for another loss.

[Févotte and Idier's MM construction](https://arxiv.org/pdf/1010.1763) supplies this beta-dependent update. A different exponent does not imply that the exponent-one heuristic always increases loss: that paper also establishes its monotonicity across β∈[0,2] by a separate argument. The implementation here chooses the auxiliary function's minimizing rule. Minimizing a bound is still distinct from certifying a stationary point or the best joint factorization. Outside the middle range, even a fixed-factor beta objective need not be convex.

Here is the complete general-beta route. It supports real beta between 0 and 3, including fractional values; wider values need a separately reviewed numerical-domain extension. `beta_sweep` performs a simultaneous H block, then a W block using the new H. `fit_beta` returns a complete read-only snapshot, feature order and explicit stopping status. `transform` holds H fixed and reuses section 7's explained KL or Gram-cached Frobenius encoder for the exact β=1 or 2 cases. Other supported beta values use the newly derived block. There is no opaque library NMF call inside the scratch algorithm.

<!-- source:nmf_beta_mm.py -->

Read the complete recorded stdout by beta value. Each branch begins from the same displayed positive observations. The `scratch` tuple reports update count, objective and projected-gradient norm; `ordinary_loss` is recomputed from the ordinary factors, and `empty_query` checks the fixed-dictionary query shape. The cap and tolerance labels are part of the result.

```text
positive_observations [[2.2, 1.4, 3.0], [1.6, 3.2, 4.0], [0.9, 2.1, 2.5]]
beta 0 gamma 0.5 scratch iteration-cap (100, 4.0940543179253895e-10, 1.43486400093095e-05)
ordinary_loss 2.1957538223522826e-10
empty_query (0, 2)
beta 1 gamma 1 scratch stationary-tolerance (82, 4.625565310410854e-13, 6.079313524112777e-07)
ordinary_loss 5.242448001534579e-16
empty_query (0, 2)
beta 2 gamma 1 scratch iteration-cap (100, 2.797262337480064e-12, 2.1731613719550694e-06)
ordinary_loss 6.424896389551792e-13
empty_query (0, 2)
```



The code keeps beta=2, 1 and 0 loss branches explicit. Near x=y, it evaluates the small relative-difference series rather than subtracting almost equal powers. Near the removable beta=0/1 singularities, non-near-equal cells use a high-precision decimal fallback; this rare branch costs more than vectorized float arithmetic. Nonfinite or lost positive arithmetic is refused without publishing partial fitted state. No artificial positive floor is concealed in the original objective.

For non-Frobenius beta, each dense block forms an `n×d` reconstruction and weighted cell tables, then contracts them with a factor: `O(ndk)` arithmetic and `O(nd)` temporary cell workspace. The exact Frobenius update uses Gram products, as in section 7. Loss and gradient diagnostics have their own contractions; retaining history adds storage proportional to the number of recorded outer sweeps. These are implementation costs, not benchmark evidence or a universal fastest-solver claim.

The new example explicitly uses positive observations `[[2.2,1.4,3],[1.6,3.2,4],[0.9,2.1,2.5]]`, constructed from positive two-component factors. Its ordinary route is public `NMF(solver='mu', beta_loss=beta, init='custom', ...)`, with both alphas zero and copies of the same starting W and H. It recomputes the actual chosen loss from both returned reconstructions. The library's generic reported reconstruction error is not substituted for this loss.

In the recorded execution, beta=0 reached the 100-update cap with scratch IS loss approximately `4.094054×10⁻¹⁰`; beta=1 reached scratch stationarity tolerance at update 82 with KL approximately `4.625565×10⁻¹³`; beta=2 reached the cap with half-squared loss approximately `2.797262×10⁻¹²`. The corresponding ordinary losses were approximately `2.195754×10⁻¹⁰`, `5.242448×10⁻¹⁶` and `6.424896×10⁻¹³`. All three ordinary cap warnings are retained with the actual output. Those outcomes belong to this constructed positive table, not the saved digit study. An iteration cap and a tolerance stop have different meanings even when both produce small losses.

For a changed case, take β=0, old amount 1 and corrective ratio 9. The MM multiplier is 3; the exponent-one heuristic multiplier is 9. Explain why this calculation isolates the exponent and cannot predict the next step after the full factor matrices and their ratios change. Then return to the Frobenius bound: if a=2, why must the marked minimizer remain at 2?

We now know how the current positive state controls a safe bound. The next question is how to choose the *first* state without introducing negative entries or silently changing NMF into centered PCA.

## 9. Initialize without silently importing PCA centering

Section 8 explained how to improve a current factorization. Where should its first amounts and patterns come from? We want a starting point that uses the observations' structure, stays nonnegative and leaves the chosen solver able to move.

Can we simply use the PCA program we already learned?

PCA's subtraction changes the object being factorized.

<!-- figure:D31 -->

The left table is our original X0: rows `[2,1,3]`, `[1,3,4]` and `[0,2,2]`. The feature means are `[1,2,3]`. Subtract those means, as [PCA's fit-and-reconstruct route](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python) does, and the right table becomes `[[1,-1,0],[0,1,1],[-1,0,-1]]`. Follow R0,F1: the measured value 1 becomes a deviation of -1 from its mean 2. The signed arrow points below zero; the original intensity bar does not.

PCA learns directions for deviations and stores the mean so it can add it back on reconstruction. This lesson's NMF learns additive contributions to the original nonnegative measurements. A centered negative cell cannot be reconstructed by adding nonnegative amounts of nonnegative patterns. Adding a different offset or scaling all values into a nonnegative interval creates another representation; its physical interpretation must be explained separately. It is not the same operation as PCA centering.

We can reuse a lower-level operation from PCA: **singular value decomposition**, or SVD. It expresses a matrix as a sum of simple column-times-row terms. Here we apply it to X itself, without subtracting its means. The public NumPy operation `np.linalg.svd(X, full_matrices=False)` is the maintained numerical primitive; the construction of nonnegative factors around that operation is our implementation.

How can signed SVD directions help us build nonnegative parts?

Keep the positive rectangles of a signed outer product, then retain one of those rectangles as a component.

<!-- figure:D32 -->

We temporarily switch from X0 to a constructed two-feature table, **X_t = [[8.2,2.4],[2.4,6.8]]**, so every step is visible. Call its two observation rows T0 and T1; their features are F0 and F1. These are different observations from the old three-feature rows. Its first SVD term has strength 10 and left and right directions `[0.8,0.6]`. Multiplying the direction column by its direction row and then by 10 gives `[[6.4,4.8],[4.8,3.6]]`. The second term has strength 5 and directions `[0.6,-0.8]`; it gives `[[1.8,-2.4],[-2.4,3.2]]`. Add the two tables cell by cell to recover X_t. These are known singular pairs of this constructed table; the later program also computes its SVD.

The signed bars are entries of a direction, not NMF amounts. The second term adds 1.8 in the top-left corner and 3.2 in the bottom-right corner, but subtracts 2.4 in both off-diagonal cells. Those subtractions are legal for SVD and forbidden for an NMF component. In the positive-part view, the two negative off-diagonal cells become zero. Two separate positive rectangles remain. Rose identifies this second term consistently with C1 in its factors; solid and hatched outlines distinguish the positive-pair and negative-pair candidates. Plus and minus labels explain their origin, so colour is not the only distinction.

Let u be a unit-length left direction, v a unit-length right direction, and σ its nonnegative strength, called a **singular value**. The term is `σ u vᵀ`. The superscript T turns a column into a row. For a table with n observations and d features, economy SVD returns U with shape `n×m`, singular values s with length m and Vh with shape `m×d`, where `m=min(n,d)`. Column c of U and row c of Vh supply one pair. The cth singular value supplies its strength:

\[
X=\sum_{c=1}^{m}\sigma_c u_c v_c^T,
\qquad \sigma_1\ge\sigma_2\ge\cdots\ge0.
\]

The **rank** counts independent row or column directions: directions that cannot be built by combining the others. A nonzero column-times-row term has rank one; a sum of k such terms has rank at most k. Keeping the largest k SVD terms is a best rank-at-most-k approximation under squared error when signs are allowed. Replacing those signed terms with nonnegative pieces changes that problem. Its output will be a useful candidate start for constrained optimization, rather than the already-solved NMF problem.

To identify the two rectangles, split each direction into two nonnegative pieces. The **positive piece** keeps entries above zero. The **negative piece** keeps the magnitudes of entries below zero; it does not contain negative numbers. Thus `u = u_plus - u_minus`. For `[0.6,-0.8]`, those pieces are `[0.6,0]` and `[0,0.8]`. Do the same for v. Multiplying the two differences gives four terms:

\[
uv^T=u_+v_+^T+u_-v_-^T-u_+v_-^T-u_-v_+^T.
\]

The first two terms have matching signs and are positive; the cross-sign terms subtract. Because the positive and negative pieces occupy disjoint entries, their outer products occupy disjoint rectangles. Consequently the positive part of the original outer product is exactly

\[
(uv^T)_+=u_+v_+^T+u_-v_-^T.
\]

This explains a useful surprise in the picture: the original signed table has rank one, but its positive part can have rank two. Here both diagonal rectangles are nonzero, so neither one alone reconstructs the positive-part table. Clipping negative cells and retaining one component are two different operations.

Which of those two positive rectangles should one component retain?

Compare the sizes of the paired pieces, keeping both candidates visible.

<!-- figure:D33 -->

At the default setting, u and v are both `[0.6,-0.8]`. The positive pieces have lengths 0.6 and 0.6, giving paired size `0.6×0.6=0.36`. The negative pieces have lengths 0.8 and 0.8, giving paired size `0.8×0.8=0.64`. Multiplying by σ=5 gives candidate strengths 1.8 and 3.2. Retain the negative-pair rectangle, which contains the larger contribution. Its NMF factors are the nonnegative column `[0,4/√5]` and row `[0,4/√5]`; their outer product is `[[0,0],[0,16/5]]`.

The single control changes u's positive entry a; its other entry is `-sqrt(1-a²)`, so u keeps length 1. v and σ stay fixed. At a=1, only the positive-pair rectangle remains. At a=0, only the negative-pair rectangle remains. No normalization divides by the missing piece's zero length. At a=0.8, the two paired sizes are both 0.48 in exact arithmetic. The displayed tie policy chooses the positive pair. The tied candidates occupy different cells, but have equal local approximation quality. After an edit, this is a supplied singular-triplet illustration; we are not claiming the edited u remains a singular direction of the unchanged X_t.

For an arbitrary pair, write the two sizes as

\[
p=\|u_+\|_2\|v_+\|_2,\qquad
q=\|u_-\|_2\|v_-\|_2.
\]

The subscript 2 means Euclidean length: square the entries, sum them and take the square root. If p≥q and p>0, normalize the positive pieces to unit length and share the retained strength across W and H:

\[
w_c=\sqrt{\sigma p}\;\frac{u_+}{\|u_+\|_2},\qquad
h_c=\sqrt{\sigma p}\;\frac{v_+^T}{\|v_+\|_2}.
\]

For q>p, use the negative pieces and q in the same construction. Multiplying w_c and h_c cancels the two normalization lengths against p or q, leaving exactly the chosen `σ u_plus v_plusᵀ` or `σ u_minus v_minusᵀ`. The square-root split gives the two factors equal Euclidean norm; section 2's compensating scale change could redistribute that scale without changing their outer product. If the singular value or both candidate sizes are zero, the whole new component is zero and normalization is skipped.

**Deeper: why compare norm products?** Positive and negative pieces have zero inner product because their supports do not overlap. Normalizing the two left pieces therefore produces perpendicular left directions; normalizing the right pieces does the same on the right. The positive-part table already has an SVD with singular strengths p and q. Its best rank-one approximation keeps the larger strength and discards the smaller one. With strength σ restored, the discarded positive rectangle has Frobenius norm `σ min(p,q)`. That local result follows from the actual geometry of two orthogonal rectangles. Summing these separately approximated SVD terms does not establish a globally best joint NMF, because the complete residual also includes the removed negative terms and interactions across components.

Simply clipping u and v separately would always retain `u_plus v_plusᵀ`. In our example that would keep strength 1.8 and throw away the stronger 3.2 rectangle. Jointly flipping both singular vectors preserves their original signed outer product but swaps which rectangle is called positive-pair or negative-pair. Away from a tie, comparing both pairs still selects the same retained product. At an exact tie, our positive-pair convention can select the other equal-quality rectangle after a sign flip. Equal singular values also permit rotations within a singular subspace. Thus a fixed SVD backend and explicit tie rules make this a controlled implementation; they do not make the initializer unique across every backend and degenerate matrix.

We can now assemble **Nonnegative Double SVD**, abbreviated NNDSVD. The first step finds the SVD of the observation table. The second finds a leading singular term of each positive-part outer product; the sign-pair calculation obtains that second result without performing another large decomposition. For a nonnegative X, a leading left/right singular pair can be chosen nonnegative. We use the absolute leading vectors, as the ordinary implementation does, and scale each by `sqrt(σ1)`. For the remaining k-1 terms, apply the paired-sign construction.

For X_t, this gives

\[
W_{\rm start}=\begin{bmatrix}0.8\sqrt{10}&0\\0.6\sqrt{10}&4/\sqrt5\end{bmatrix},
\qquad H_{\rm start}=W_{\rm start}^T,
\qquad X_t-W_{\rm start}H_{\rm start}
=\begin{bmatrix}1.8&-2.4\\-2.4&0\end{bmatrix}.
\]

Read the residual in the same direction as section 3: **observed minus reconstructed**. The positive 1.8 says the reconstruction is too low in the top-left cell. The negative -2.4 says it is too high off the diagonal. We preserved a good nonnegative start, not an exact explanation of X_t. The half-squared loss is `(1.8²+2.4²+2.4²)/2=7.38`.

Why are zeros in this good-looking start worth inspecting?

A zero can be either a useful absent contribution or a coordinate the chosen solver can never revive.

<!-- figure:D34 -->

The unfilled factors have two exact zero entries: W[T0,C1] and H[C1,F0]. The second component initially contributes only to the bottom-right cell. The filled view changes only those original zeros, leaving every nonzero entry unchanged. The control's fill amount δ runs from 0 to 2, directly under these factor cells. A fill is an explicit change to the initial factors, not a change to the observations or a hidden floor inside the loss.

At δ=0, section 7's H-first multiplicative sweep keeps both zero entries at zero. Its other values move, reducing the half-squared loss from 7.38 to approximately 3.287531. At δ=0.1, H[C1,F0] becomes approximately 0.0535559 after the H block and W[T0,C1] becomes approximately 0.0672734 after the W block uses that new H. The component can now contribute off the diagonal. Yet this one-sweep loss, approximately 3.652713, is higher than the unfilled case's 3.287531. Allowing a coordinate to move and producing a better answer after exactly one sweep are different questions.

At δ=2, the initial loss is approximately 38.153002 and the one-sweep loss is approximately 12.279289. Larger fill is not automatically a better start. Setting δ back to zero restores the exact unfilled start and its update. The comparison shows both initial and updated factors and losses; it does not fit an entire model or claim one initializer universally wins.

There are three useful variants:

| Variant | What happens to exact zeros | Consequence to inspect |
|---|---|---|
| Plain NNDSVD | Leave them at zero | Sparse initial factors; exact MU zero locks remain. Coordinate descent can revive a zero when its derivative points into the feasible region. |
| Mean-filled NNDSVD, often named NNDSVDa | Replace them with mean(X) | Dense start when mean(X)>0; it can substantially increase initial loss and changes factor scale. |
| Small-random-filled NNDSVD, often named NNDSVDar | Replace them with small nonnegative random values scaled by mean(X) | Gives formerly zero coordinates room to move; record the distribution, generator and seed. |

For X_t the mean is **4.95**, outside the live δ range. The δ=2 endpoint therefore is not NNDSVDa for this table. Our small-random variant uses uniform draws between 0 and `mean(X)/100`, following the original variant. The inspected scikit-learn 1.9.1 implementation instead uses the absolute value of normal draws times `mean(X)/100`. That distribution is not bounded by `mean(X)/100`. Even with the same integer seed these routes do not promise the same arrays. The original treatment and its dense variants are described in [Boutsidis and Gallopoulos](https://doi.org/10.1016/j.patcog.2007.09.010).

Zero handling has two other boundaries. First, floating-point SVD can return tiny nonzero values for mathematically zero terms; an absolute cutoff is a deliberate numerical convention. Our default leaves them unchanged. The explicit `zero_threshold` option sets factor entries below that cutoff to zero before any fill. It is not a singular-value rank test and changes which coordinates are subsequently filled or locked. The inspected library initializer applies an internal absolute cutoff of 10⁻⁶. Second, an all-zero data table gives zero singular values and zero mean. All three data-scaled NNDSVD variants therefore return zero factors; mean or random fill cannot create positive entries from zero mean. Section 8's strictly positive beta route needs a different, explicitly positive starting contract and strictly positive observations.

Here is the complete implementation and its ordinary-tool example. Save it as `nmf_initialization.py` beside the earlier NMF files and the supplied unchanged `centered_pca.py`. N1's `nonnegative_table` reuses only PCA's finite-array helper; no PCA fitting or centering runs. The new code owns the sign split, pair comparison, component assembly, zero-fill policies and a separate positive random initializer. NumPy owns the maintained SVD kernel.

<!-- source:nmf_initialization.py -->

The complete recorded stdout makes the starting factors, signed residual, three explicit fills and both ordinary-tool comparisons available together. `changed_entries` prints the two formerly zero coordinates after an H-first sweep. The separate `same_W_first_factor_max_differences` comparison deliberately matches the ordinary tool's W-first order rather than comparing different update orders.

```text
initial_w [[2.5298221281347026, 0.0], [1.897366596101028, 1.7888543819998317]]
initial_h [[2.529822128134704, 1.8973665961010275], [0.0, 1.7888543819998317]]
residual_x_minus_wh [[1.7999999999999998, -2.399999999999998], [-2.4000000000000017, -8.881784197001252e-16]]
fill 0.0 initial_half_loss 7.379999999999999 one_sweep_half_loss 3.2875310469355865 changed_entries 0.0 0.0
fill 0.1 initial_half_loss 8.252700103359919 one_sweep_half_loss 3.6527134241460826 changed_entries 0.05355590430213354 0.0672734430149865
fill 2.0 initial_half_loss 38.153002067198386 one_sweep_half_loss 12.2792891053915 changed_entries 1.1564835856610367 1.981034877808371
ordinary_custom_one_sweep_half_loss 3.2875310469355843
same_W_first_factor_max_differences 0.0 4.440892098500626e-16
ordinary_nndsvda_iterations 10 half_loss 4.630824246410104e-16
overcomplete_shapes (2, 3) (3, 2)
```



`initialize_nndsvd` returns fresh W and H arrays with shapes `n×k` and `k×d`, without mutating X. It requires `1≤k≤min(n,d)` because it constructs at most one component per economy-SVD triplet. Requesting more components, called an **overcomplete** representation here, is a different starting policy: `initialize_positive_random` supports it and uses bounded positive uniform entries scaled by `sqrt(mean(X)/k)`. Its factors are deliberately different from the library's absolute-normal random initialization. It refuses an all-zero table rather than inventing a data scale. No factorization is fitted by either initializer.

The code normalizes sign pieces before multiplying by their shared scale. `stable_norm`, taught in N1, avoids losing a small piece merely by squaring its entries unscaled. `table_mean` scales the input before averaging, so summing large finite positive measurements need not overflow. Nonfinite singular strengths or factors are refused. Exact zero terms skip division; no epsilon is slipped into their denominator. This is a dense float64 reference route, with finite-arithmetic limits, not a guarantee of bitwise equality across LAPACK implementations.

**Deeper: why is the leading absolute pair legitimate?** For a nonnegative X, replacing real unit vectors u,v by their entrywise absolute values can only increase `uᵀXv`. Its value still cannot exceed the largest singular value. If u,v attain that largest value, their absolute pair must attain it too. Thus we may choose a nonnegative leading pair even when the backend's signs or a repeated singular value make its supplied pair ambiguous. This argument concerns the largest singular pair of nonnegative X; it does not justify taking absolute values of every later SVD direction. Later directions need the paired-sign construction we just derived.

The dense economy SVD costs on the order of `nd×min(n,d)` arithmetic, with thin U/Vh storage on the order of `(n+d)×min(n,d)`, plus the input copy and the numerical kernel's workspace. Pair assembly and filling cost `O((n+d)k)` and retain `O((n+d)k)` factors. Computing only k leading triplets with a suitable iterative or randomized backend can change the cost and approximation error. This program computes the whole thin decomposition even when k is small, so its SVD must not be advertised as `O(ndk)` or as a streaming sparse method. For large sparse text, avoid densifying the entire table solely to use this teaching implementation; use a maintained sparse-aware route and understand its approximation settings.

The main program first prints the actual initialized arrays and signed residual, then the three D34 fill cases. It reuses section 7's H-first/new-H W operation on the constructed two-feature table. In the recorded run, the plain factors agree with the displayed exact square-root expressions to floating-point precision, and the three loss pairs are:

| Fill δ | Initial half-squared loss | After one H-first/new-H W sweep |
|---|---:|---:|
| 0 | 7.380000 | 3.287531 |
| 0.1 | 8.252700 | 3.652713 |
| 2 | 38.153002 | 12.279289 |

How do these choices map to the usual tool?

The complete example uses public `sklearn.decomposition.NMF`, whose [documented initialization choices](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html) include `nndsvd`, `nndsvda`, `nndsvdar`, `random` and `custom`. Set `n_components` and `init` explicitly when studying a choice. In the inspected 1.9.1 version, `init=None` selects `nndsvda` when k fits within the smaller matrix dimension and random otherwise; `random_state` also affects its randomized SVD backend. Its sign-pair comparison selects the negative pair on an exact computed tie; our convention selects the positive pair. The scratch program's exact dense SVD, default cutoff and uniform random-fill distribution are other intentional differences. The library's internal initializer was inspected to resolve these differences; the learner calls the public estimator, not its private helper.

For a controlled solver comparison, the first ordinary call supplies copies of our exact W and H using `init='custom'`, sets both penalties to zero and performs one Frobenius MU sweep. The library updates **W first, then H using the new W**, whereas D34 deliberately follows the earlier H-first scratch route. The program therefore also constructs a W-first scratch reference using the already-taught `update_amounts` primitive. In the recorded run, its W agrees exactly with the public route and the largest H difference is approximately `4.44×10⁻¹⁶`. The two sweep orders happen to give the same rounded loss on this symmetric example; that coincidence is not evidence that their factor updates are identical. Read the block-order labels before comparing either factors or losses.

The second ordinary call demonstrates normal use: `NMF(init='nndsvda', solver='cd', ...)` initializes internally and then fits. Here it took 10 iterations and obtained half-squared loss approximately `4.630824×10⁻¹⁶`. Those numbers describe this constructed two-by-two example under the recorded Python/NumPy/SciPy/scikit-learn versions. This is a complete independently initialized fit; an initializer-isolation benchmark would hold the subsequent solver and its stopping rules fixed. The next section will examine the fitted estimator's state and query operations in detail.

Try a changed case before leaving initialization. With σ=5, u=`[0.8,-0.6]` and v=`[0.6,-0.8]`, compute both sign-pair norm products and construct the component our tie rule retains. Each product is 0.48, so the positive pair gives the nonnegative outer product `[[2.4,0],[0,0]]`; the alternative has the same size but lies in the bottom-right cell. Now add a third component to a two-by-two table: explain why the NNDSVD route refuses it and why the separate random route can still provide the requested factor shapes. Finally, change only `zero_threshold` on the supplied initializer and inspect exactly which nonzero cells become zero before filling. These checks separate geometry, numerical convention and solver behavior rather than treating an initialization name as a quality guarantee.

We now have both a structurally informed first state and explicit alternatives when its zeros, dimensional limit or numerical cost are unsuitable. The next step is to use those choices through a fitted model whose stored dictionary, feature order and new-row behavior remain clear.

<!-- section:ordinary-state-authoring/section-ten.md -->

<!-- section:stdout-presentation-correction/section-eleven.md -->

<!-- section:precision-corrections/section-twelve.md -->

<!-- section:representation-evaluation-authoring/section-thirteen.md -->

<!-- section:identifiability-authoring/section-fourteen.md -->

<!-- section:anchors-authoring/section-fifteen.md -->

<!-- section:precision-corrections/section-sixteen.md -->

<!-- section:online-surrogate-authoring/section-seventeen.md -->

<!-- section:axis-phase-authoring/section-eighteen.md -->

<!-- section:practice-resources-authoring/section-nineteen.md -->
