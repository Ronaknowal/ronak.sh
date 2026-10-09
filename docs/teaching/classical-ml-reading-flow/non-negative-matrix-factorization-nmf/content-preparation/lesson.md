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


```python title="nmf_arrays.py"
"""Array contracts and reductions used by the NMF lesson's dense algorithms."""

from dataclasses import dataclass
from numbers import Real
import numpy as np

from centered_pca import real_table


def nonnegative_table(values, features=None, *, require_rows=False):
    table = real_table(values, features)
    if (table < 0).any() or (require_rows and table.shape[0] == 0):
        raise ValueError("Expected nonnegative values and a nonempty fitting table")
    return table


def positive_integer(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def nonnegative_scalar(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite nonnegative real number")
    try:
        result = float(value)
    except (ValueError, TypeError, OverflowError) as error:
        raise ValueError(f"{name} must be a finite nonnegative real number") from error
    if not np.isfinite(result) or result < 0:
        raise ValueError(f"{name} must be a finite nonnegative real number")
    return result


def feature_ids(names, count):
    result = tuple(f"F{j}" for j in range(count)) if names is None else tuple(names)
    if len(result) != count or any(not isinstance(name, str) or not name for name in result):
        raise ValueError("Supply one nonempty string ID per feature")
    if len(set(result)) != count:
        raise ValueError("Feature IDs must be unique and ordered")
    return result


def require_finite(values, operation):
    if not np.isfinite(values).all():
        raise ValueError(f"{operation} exceeded finite arithmetic; rescale the data")
    return values


def read_only(values):
    result = np.array(values, dtype=np.float64, copy=True)
    result.setflags(write=False)
    return result


def stable_norm(values):
    """Euclidean norm without squaring the largest unscaled entry."""
    values = np.asarray(values, dtype=np.float64)
    require_finite(values, "Norm input")
    scale = float(np.max(np.abs(values), initial=0.0))
    if scale == 0:
        return 0.0
    scaled = values / scale
    with np.errstate(over="ignore", invalid="ignore"):
        result = scale * np.sqrt(np.sum(scaled * scaled))
    require_finite(result, "Norm reduction")
    return float(result)


def factor_shapes(x, w, h):
    if w.ndim != 2 or h.ndim != 2 or w.shape[1] == 0:
        raise ValueError("Factors must be row-by-component and component-by-feature")
    if w.shape[0] != x.shape[0] or h.shape != (w.shape[1], x.shape[1]):
        raise ValueError("Factor dimensions do not contract to the observation table")
    for factor in (w, h):
        require_finite(factor, "Factor")
        if (factor < 0).any():
            raise ValueError("Factors must be nonnegative")


def reconstruction(w, h):
    with np.errstate(over="ignore", invalid="ignore"):
        result = w @ h
    return require_finite(result, "Reconstruction")


@dataclass(frozen=True)
class FrobeniusMetrics:
    half_square: float
    squared_norm: float
    norm: float
    mse: float
    rmse: float
    cells: int


def frobenius_metrics(x, w, h, block_rows=256):
    """Unweighted observed cells; a mask needs its own stated denominator."""
    factor_shapes(x, w, h)
    block_rows = positive_integer(block_rows, "block_rows")
    cells = int(x.size)
    if cells == 0:
        raise ValueError("An empty observation table has no reconstruction-quality mean")
    squared = 0.0
    for start in range(0, x.shape[0], block_rows):
        stop = start + block_rows
        residual = x[start:stop] - reconstruction(w[start:stop], h)
        with np.errstate(over="ignore", invalid="ignore"):
            squared += float(np.sum(residual * residual))
        require_finite(squared, "Squared residual reduction")
    mean = squared / cells
    return FrobeniusMetrics(squared / 2, squared, float(np.sqrt(squared)), mean, float(np.sqrt(mean)), cells)


def weighted_half_square(x, w, h, mask, block_rows=256):
    """Sum of weighted squared residuals / 2, without a quality-mean claim."""
    factor_shapes(x, w, h)
    weights = nonnegative_table(mask, x.shape[1])
    if weights.shape != x.shape:
        raise ValueError("Mask weights need exactly the observation-table shape")
    block_rows = positive_integer(block_rows, "block_rows")
    total = 0.0
    for start in range(0, x.shape[0], block_rows):
        stop = start + block_rows
        for i in range(start, min(stop, x.shape[0])):
            included = weights[i] > 0
            if not included.any():
                continue
            # Omitted cells are not computed: even their products may overflow.
            residual = x[i, included] - reconstruction(w[i:i + 1], h[:, included])[0]
            with np.errstate(over="ignore", invalid="ignore"):
                selected = residual * np.sqrt(weights[i, included])
                total += float(np.sum(selected * selected)) / 2
            require_finite(total, "Weighted residual reduction")
    return total


def generalized_kl(x, prediction):
    """Generalized KL with its exact zero-count/support conventions."""
    x = nonnegative_table(x)
    prediction = nonnegative_table(prediction, x.shape[1])
    if x.shape != prediction.shape:
        raise ValueError("Observation and prediction shapes must agree")
    positive = x > 0
    if (prediction[positive] == 0).any():
        raise ValueError("Positive observations require positive predicted rates")
    terms = prediction.copy()  # x=0 contributes y, including 0 when y=0.
    a, b = x[positive], prediction[positive]
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        delta = (a - b) / b
        close = np.abs(delta) < 1e-3
        part = np.empty_like(a)
        # (1+d)log(1+d)-d = d²/2-d³/6+d⁴/12-... avoids cancellation.
        d = delta[close]
        phi = d * d * (0.5 + d * (-1 / 6 + d * (1 / 12 + d * (-1 / 20 + d / 30))))
        part[close] = b[close] * phi
        part[~close] = a[~close] * (np.log(a[~close]) - np.log(b[~close])) - (a[~close] - b[~close])
        terms[positive] = part
        result = float(np.sum(terms))
    require_finite(result, "KL reduction")
    return result


def projected_gradient(values, gradient):
    require_finite(gradient, "Gradient")
    if values.shape != gradient.shape:
        raise ValueError("A gradient needs the same shape as its factor")
    return np.where(values > 0, gradient, np.minimum(gradient, 0.0))


def main():
    x = nonnegative_table([[2, 1, 3], [1, 3, 4], [0, 2, 2]], require_rows=True)
    w, h = np.ones((3, 2)), np.array([[1, 0, 1], [0, 1, 1]], dtype=float)
    result = frobenius_metrics(x, w, h, block_rows=2)
    print("reconstruction", reconstruction(w, h).tolist())
    print("half_square", result.half_square, "squared_norm", result.squared_norm)
    print("norm", result.norm, "mse", result.mse, "rmse", result.rmse)
    print("kl_zero_count", generalized_kl([[0, 0]], [[2, 0]]))
    print("masked_half_square", weighted_half_square(x, w, h, np.ones_like(x)))


if __name__ == "__main__":
    main()
```


The complete recorded output of `python nmf_arrays.py` follows. The reconstruction has three equal rows because this demonstration uses unit amounts; its whole-table squared residual norm is 12, so the half-square is 6 and the MSE is 12/9. The final two lines separately check an observed zero under KL and included-cell weighting.

```text
reconstruction [[1.0, 1.0, 2.0], [1.0, 1.0, 2.0], [1.0, 1.0, 2.0]]
half_square 6.0 squared_norm 12.0
norm 3.4641016151377544 mse 1.3333333333333333 rmse 1.1547005383792515
kl_zero_count 2.0
masked_half_square 6.0
```



The coordinate program separates `block_cache` from `coordinate_sweeps`. During a fixed-H query, both G and P remain fixed across all sweeps and are formed once. During fitting, changing the opposite factor rebuilds the appropriate cache. `coordinate_block` deliberately changes a writable float64 factor in place; the public fit/encode methods validate and copy caller inputs before using that kernel.


```python title="nmf_coordinate.py"
"""Cached cyclic coordinate descent and immutable fitted NMF snapshots."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, nonnegative_scalar, nonnegative_table,
    positive_integer, projected_gradient, read_only, reconstruction,
    require_finite, stable_norm,
)


def coordinate_block(x, w, h, sweeps=1, *, l1=0.0, l2=0.0):
    """Validated float64 arrays; change writable w in place, holding h fixed."""
    sweeps = positive_integer(sweeps, "sweeps")
    l1, l2 = nonnegative_scalar(l1, "l1"), nonnegative_scalar(l2, "l2")
    if any(not isinstance(a, np.ndarray) or a.dtype != np.float64 for a in (x, w, h)):
        raise ValueError("The in-place block requires float64 NumPy arrays")
    if not w.flags.writeable:
        raise ValueError("The updated factor must be writable")
    require_finite(x, "Observation")
    if (x < 0).any():
        raise ValueError("Observations must be nonnegative")
    factor_shapes(x, w, h)
    gram, cross = block_cache(x, h)
    return coordinate_sweeps(w, gram, cross, sweeps, l1, l2)


def block_cache(x, h):
    with np.errstate(over="ignore", invalid="ignore"):
        gram, cross = h @ h.T, x @ h.T
    require_finite(gram, "Gram product")
    require_finite(cross, "Cross product")
    return gram, cross


def coordinate_sweeps(w, gram, cross, sweeps, l1=0.0, l2=0.0):
    """Internal validated-cache kernel; each component sees fresh earlier columns."""
    for _ in range(sweeps):
        for c in range(gram.shape[0]):
            curvature = float(gram[c, c] + l2)
            require_finite(curvature, "Coordinate curvature")
            if curvature == 0:
                if np.any(cross[:, c] != 0) or np.any(gram[:, c] != 0):
                    raise ValueError("A flat coordinate has inconsistent cross products")
                w[:, c] = 0.0
                continue
            with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
                slope = w @ gram[:, c] - cross[:, c] + l1 + l2 * w[:, c]
                proposal = w[:, c] - slope / curvature
            require_finite(slope, "Coordinate slope")
            require_finite(proposal, "Coordinate update")
            w[:, c] = np.maximum(0.0, proposal)
    return w


def block_stationarity(x, w, h):
    gram, cross = block_cache(x, h)
    return cached_stationarity(w, gram, cross)


def cached_stationarity(w, gram, cross):
    with np.errstate(over="ignore", invalid="ignore"):
        gradient = w @ gram - cross
    return stable_norm(projected_gradient(w, gradient))


def joint_stationarity(x, w, h):
    with np.errstate(over="ignore"):
        result = np.hypot(block_stationarity(x, w, h), block_stationarity(x.T, h.T, w.T))
    return float(require_finite(result, "Joint stationarity"))


def stopping_threshold(tol, baseline):
    with np.errstate(over="ignore"):
        result = tol * np.float64(baseline)
    return float(require_finite(result, "Stopping threshold"))


def encode_coordinates(x, h, *, max_iter=1000, tol=1e-7, sweeps=1, initial=None):
    """Fixed-dictionary NNLS by the same cyclic operation used during fitting."""
    h = nonnegative_table(h, require_rows=True)
    x = nonnegative_table(x, h.shape[1])
    max_iter, sweeps = positive_integer(max_iter, "max_iter"), positive_integer(sweeps, "sweeps")
    tol = nonnegative_scalar(tol, "tol")
    shape = (x.shape[0], h.shape[0])
    w = np.zeros(shape) if initial is None else nonnegative_table(initial, h.shape[0])
    if w.shape != shape:
        raise ValueError("Initial amounts must have one row per query")
    if x.shape[0] == 0:
        return w, {"status": "empty-query", "iterations": 0, "projected_gradient": 0.0}
    gram, cross = block_cache(x, h)  # Fixed dictionary: retain this cache for every sweep.
    baseline = cached_stationarity(w, gram, cross)
    threshold = stopping_threshold(tol, baseline)
    current, iterations = baseline, 0
    for iterations in range(1, max_iter + 1):
        if current <= threshold:
            iterations -= 1
            break
        coordinate_sweeps(w, gram, cross, sweeps)
        current = cached_stationarity(w, gram, cross)
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    return w, {"status": status, "iterations": iterations, "projected_gradient": current}


@dataclass(frozen=True)
class CoordinateState:
    h: np.ndarray
    features: tuple
    max_iter: int
    tol: float
    sweeps: int
    diagnostics: tuple
    status: str


class CoordinateNMF:
    def __init__(self, n_components, *, max_iter=1000, tol=1e-7, sweeps=1, random_state=0, block_rows=256):
        self.n_components = n_components
        self.max_iter, self.tol, self.sweeps = max_iter, tol, sweeps
        self.random_state, self.block_rows = random_state, block_rows
        self._state = None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit the dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().h.copy()

    @property
    def diagnostics_(self):
        return self._fitted().diagnostics

    @property
    def status_(self):
        return self._fitted().status

    def fit_transform(self, values, *, features=None, initial_w=None, initial_h=None):
        x = nonnegative_table(values, require_rows=True)
        k = positive_integer(self.n_components, "n_components")
        cap = positive_integer(self.max_iter, "max_iter")
        sweeps = positive_integer(self.sweeps, "sweeps")
        block_rows = positive_integer(self.block_rows, "block_rows")
        tol, names = nonnegative_scalar(self.tol, "tol"), feature_ids(features, x.shape[1])
        rng = np.random.default_rng(self.random_state)
        w = rng.uniform(0.1, 1.0, (x.shape[0], k)) if initial_w is None else nonnegative_table(initial_w, k)
        h = rng.uniform(0.1, 1.0, (k, x.shape[1])) if initial_h is None else nonnegative_table(initial_h, x.shape[1])
        if w.shape != (x.shape[0], k) or h.shape != (k, x.shape[1]):
            raise ValueError("Initial factors must match the fitting rows, rank and features")
        baseline = joint_stationarity(x, w, h)
        threshold = stopping_threshold(tol, baseline)
        loss = frobenius_metrics(x, w, h, block_rows).half_square
        history = [(0, loss, baseline)]
        current = baseline
        for iteration in range(1, cap + 1):
            if current <= threshold:
                break
            coordinate_block(x, w, h, sweeps)
            coordinate_block(x.T, h.T, w.T, sweeps)  # h uses the NEW w.
            current = joint_stationarity(x, w, h)
            loss = frobenius_metrics(x, w, h, block_rows).half_square
            history.append((iteration, loss, current))
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        candidate = CoordinateState(read_only(h), names, cap, tol, sweeps, tuple(history), status)
        self._state = candidate  # The only publication point; failures above preserve old state.
        return w.copy()

    def transform(self, values, *, features=None, return_diagnostics=False):
        state = self._fitted()
        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:
            raise ValueError("Query feature IDs/order differ from the fitted dictionary")
        w, diagnostic = encode_coordinates(values, state.h, max_iter=state.max_iter, tol=state.tol, sweeps=state.sweeps)
        return (w, diagnostic) if return_diagnostics else w

    def inverse_transform(self, values):
        state = self._fitted()
        w = nonnegative_table(values, state.h.shape[0])
        return reconstruction(w, state.h)


def main():
    from sklearn.decomposition import NMF

    np.set_printoptions(precision=8, suppress=True)
    x = np.array([[2, 1, 3], [1, 3, 4], [0, 2, 2]], dtype=float)
    h0, w0 = np.array([[1, 0, 1], [0, 1, 1]], dtype=float), np.ones((3, 2))
    w1, h1 = w0.copy(), h0.copy()
    coordinate_block(x, w1, h1)
    coordinate_block(x.T, h1.T, w1.T)
    print("one_sweep_w", w1)
    print("one_sweep_h", h1)
    print("one_sweep_half_loss", frobenius_metrics(x, w1, h1).half_square)
    scratch = CoordinateNMF(2, max_iter=2000, tol=1e-7)
    w = scratch.fit_transform(x, initial_w=w0, initial_h=h0)
    print("scratch_status", scratch.status_, "last_diagnostic", scratch.diagnostics_[-1])
    print("scratch_reconstruction", scratch.inverse_transform(w))
    ordinary = NMF(n_components=2, init="custom", solver="cd", beta_loss="frobenius",
                   alpha_W=0, alpha_H=0, shuffle=False, tol=1e-7, max_iter=2000, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
    ordinary_loss = frobenius_metrics(x, ordinary_w, ordinary.components_).half_square
    print("ordinary_half_loss", ordinary_loss, "ordinary_residual_norm", ordinary.reconstruction_err_)
    print("empty_query_shape", scratch.transform(np.empty((0, 3))).shape)


if __name__ == "__main__":
    main()
```


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


```python title="nmf_nnls.py"
"""Fixed-dictionary and alternating NNLS using the maintained convex primitive."""

import numpy as np
from scipy.optimize import nnls

from nmf_arrays import frobenius_metrics, nonnegative_table, positive_integer, require_finite
from nmf_coordinate import encode_coordinates


def encode_nnls(values, dictionary, *, max_iter=1000):
    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    max_iter = positive_integer(max_iter, "max_iter")
    amounts = np.empty((x.shape[0], h.shape[0]))
    norms = np.empty(x.shape[0])
    for i, row in enumerate(x):
        amounts[i], norms[i] = nnls(h.T, row, maxiter=max_iter)
    require_finite(amounts, "NNLS amounts")
    require_finite(norms, "NNLS residual norms")
    return amounts, norms


def alternating_nnls(values, initial_w, initial_h, *, sweeps=10, max_iter=1000):
    x = nonnegative_table(values, require_rows=True)
    w = nonnegative_table(initial_w, require_rows=True)
    h = nonnegative_table(initial_h, x.shape[1], require_rows=True)
    sweeps = positive_integer(sweeps, "sweeps")
    if w.shape != (x.shape[0], h.shape[0]):
        raise ValueError("Initial factors do not match the observations")
    history = [frobenius_metrics(x, w, h).half_square]
    for _ in range(sweeps):
        w, _ = encode_nnls(x, h, max_iter=max_iter)
        transposed_h, _ = encode_nnls(x.T, w.T, max_iter=max_iter)
        h = transposed_h.T
        history.append(frobenius_metrics(x, w, h).half_square)
    return w, h, tuple(history)


def main():
    h, query = np.array([[1, 0], [1, 1]], dtype=float), np.array([[0, 1]], dtype=float)
    unconstrained = np.linalg.lstsq(h.T, query[0], rcond=None)[0]
    clipped = np.maximum(unconstrained, 0)[None, :]
    ordinary, norms = encode_nnls(query, h)
    scratch, status = encode_coordinates(query, h, tol=1e-10)
    print("unconstrained", unconstrained.tolist())
    print("clipped", clipped.tolist(), "half_loss", frobenius_metrics(query, clipped, h).half_square)
    print("nnls", ordinary.tolist(), "residual_norm", norms.tolist())
    print("scratch", scratch.tolist(), "diagnostic", status)
    print("same_prediction", np.allclose(scratch @ h, ordinary @ h))


if __name__ == "__main__":
    main()
```


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


```python title="nmf_multiplicative.py"
"""H-first multiplicative NMF for Frobenius and generalized KL objectives."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, generalized_kl,
    nonnegative_scalar, nonnegative_table, positive_integer, projected_gradient,
    read_only, reconstruction, require_finite, stable_norm,
)
from nmf_coordinate import joint_stationarity, stopping_threshold


def multiply_ratio(values, numerator, denominator):
    """Elementwise update; 0/0 is flat and retains the old value, not an epsilon."""
    if values.shape != numerator.shape or values.shape != denominator.shape:
        raise ValueError("Value, numerator and denominator shapes must agree")
    for array in (values, numerator, denominator):
        require_finite(array, "Multiplicative operand")
        if (array < 0).any():
            raise ValueError("Multiplicative operands must be nonnegative")
    if np.any((denominator == 0) & (numerator > 0)):
        raise ValueError("A positive numerator needs a positive denominator")
    ratio = np.ones_like(values)
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        np.divide(numerator, denominator, out=ratio, where=denominator > 0)
        result = values * ratio
    require_finite(ratio, "Multiplicative ratio")
    require_finite(result, "Multiplicative update")
    if np.any((numerator > 0) & (ratio == 0)) or np.any((values > 0) & (ratio > 0) & (result == 0)):
        raise ValueError("Multiplicative arithmetic underflowed; rescale the data")
    return result


def count_ratio(x, prediction):
    if np.any((x > 0) & (prediction == 0)):
        raise ValueError("Positive counts need positive predicted rates")
    ratio = np.zeros_like(x)  # Includes the observed0/predicted0 convention.
    with np.errstate(over="ignore", invalid="ignore"):
        np.divide(x, prediction, out=ratio, where=prediction > 0)
    require_finite(ratio, "Count/rate ratio")
    if np.any((x > 0) & (ratio == 0)):
        raise ValueError("Count/rate ratio underflowed; rescale the data")
    return ratio


def update_amounts(x, w, h, loss):
    """One simultaneous W block with the dictionary held fixed."""
    with np.errstate(over="ignore", invalid="ignore"):
        if loss == "frobenius":
            numerator, denominator = x @ h.T, w @ (h @ h.T)
        elif loss == "kl":
            ratio = count_ratio(x, reconstruction(w, h))
            numerator = ratio @ h.T
            denominator = np.broadcast_to(h.sum(axis=1), w.shape)
        else:
            raise ValueError("Choose frobenius or kl")
    return multiply_ratio(w, numerator, denominator)


def multiplicative_sweep(x, w, h, loss="frobenius"):
    """Return new factors: H first, then W using that new H."""
    factor_shapes(x, w, h)
    new_h = update_amounts(x.T, h.T, w.T, loss).T
    new_w = update_amounts(x, w, new_h, loss)
    return new_w, new_h


def objective(x, w, h, loss):
    if loss == "frobenius":
        return frobenius_metrics(x, w, h).half_square
    if loss == "kl":
        return generalized_kl(x, reconstruction(w, h))
    raise ValueError("Choose frobenius or kl")


def stationarity(x, w, h, loss):
    if loss == "frobenius":
        return joint_stationarity(x, w, h)
    if loss != "kl":
        raise ValueError("Choose frobenius or kl")
    ratio = count_ratio(x, reconstruction(w, h))
    with np.errstate(over="ignore", invalid="ignore"):
        grad_w = h.sum(axis=1)[None, :] - ratio @ h.T
        grad_h = w.sum(axis=0)[:, None] - w.T @ ratio
        norm = np.hypot(stable_norm(projected_gradient(w, grad_w)), stable_norm(projected_gradient(h, grad_h)))
    return float(require_finite(norm, "KL stationarity"))


@dataclass(frozen=True)
class MultiplicativeFit:
    amounts: np.ndarray
    patterns: np.ndarray
    features: tuple
    loss: str
    max_iter: int
    tol: float
    diagnostics: tuple
    status: str

    def transform(self, values, *, features=None):
        x = nonnegative_table(values, self.patterns.shape[1])
        if features is not None and feature_ids(features, x.shape[1]) != self.features:
            raise ValueError("Query feature IDs/order differ from the dictionary")
        w = np.ones((x.shape[0], self.patterns.shape[0]))
        if len(x) == 0:
            return w, {"status": "empty-query", "iterations": 0}
        # The dictionary and all snapshot fields remain unchanged.
        def gradient_norm(amounts):
            if self.loss == "frobenius":
                gradient = amounts @ gram - cross
            else:
                ratio = count_ratio(x, reconstruction(amounts, self.patterns))
                gradient = self.patterns.sum(axis=1)[None, :] - ratio @ self.patterns.T
            return stable_norm(projected_gradient(amounts, gradient))
        if self.loss == "frobenius":
            with np.errstate(over="ignore", invalid="ignore"):
                gram, cross = self.patterns @ self.patterns.T, x @ self.patterns.T
            require_finite(gram, "Encoding Gram product")
            require_finite(cross, "Encoding cross product")
        baseline = gradient_norm(w)
        threshold = stopping_threshold(self.tol, baseline)
        current, iterations = baseline, 0
        for _ in range(self.max_iter):
            if current <= threshold:
                break
            if self.loss == "frobenius":
                with np.errstate(over="ignore", invalid="ignore"):
                    denominator = w @ gram
                w = multiply_ratio(w, cross, denominator)
            else:
                w = update_amounts(x, w, self.patterns, self.loss)
            iterations += 1
            current = gradient_norm(w)
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        return w, {"status": status, "iterations": iterations, "projected_gradient": current}

    def inverse_transform(self, values):
        w = nonnegative_table(values, self.patterns.shape[0])
        return reconstruction(w, self.patterns)


def fit_multiplicative(values, initial_w, initial_h, *, loss="frobenius", max_iter=1000, tol=1e-7, features=None):
    x = nonnegative_table(values, require_rows=True)
    w = nonnegative_table(initial_w, require_rows=True)
    h = nonnegative_table(initial_h, x.shape[1], require_rows=True)
    factor_shapes(x, w, h)
    cap, tolerance = positive_integer(max_iter, "max_iter"), nonnegative_scalar(tol, "tol")
    names = feature_ids(features, x.shape[1])
    baseline = stationarity(x, w, h, loss)
    threshold = stopping_threshold(tolerance, baseline)
    current = baseline
    history = [(0, objective(x, w, h, loss), current)]
    for iteration in range(1, cap + 1):
        if current <= threshold:
            break
        w, h = multiplicative_sweep(x, w, h, loss)
        current = stationarity(x, w, h, loss)
        history.append((iteration, objective(x, w, h, loss), current))
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    # This pure function returns one complete read-only snapshot; failure returns none.
    return MultiplicativeFit(read_only(w), read_only(h), names, loss, cap, tolerance, tuple(history), status)


def main():
    import argparse
    from sklearn.decomposition import NMF

    parser = argparse.ArgumentParser()
    parser.add_argument("--loss", choices=("all", "frobenius", "kl"), default="all")
    selected = parser.parse_args().loss
    x = np.array([[2, 1, 3], [1, 3, 4], [0, 2, 2]], dtype=float)
    w0, h0 = np.ones((3, 2)), np.array([[1, 0, 1], [0, 1, 1]], dtype=float)
    if selected != "kl":
        w1, h1 = multiplicative_sweep(x, w0, h0)
        print("H_first", h1.tolist())
        print("W_using_new_H", w1.tolist())
        print("one_sweep_half_loss", objective(x, w1, h1, "frobenius"))
        print("locked_zero", multiply_ratio(np.array([0.]), np.array([2.]), np.array([1.])).tolist())
    for loss, ordinary_loss in (("frobenius", "frobenius"), ("kl", "kullback-leibler")):
        if selected not in ("all", loss):
            continue
        # KL comparison adds .5*C0+.25*C1 to every row: all measurements are positive.
        comparison_x = x if loss == "frobenius" else x + np.array([.5, .25, .75])
        if loss == "kl":
            print("kl_observations", comparison_x.tolist())
        fit = fit_multiplicative(comparison_x, w0, h0, loss=loss, max_iter=2000, tol=1e-7)
        ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss=ordinary_loss,
                       alpha_W=0, alpha_H=0, max_iter=2000, tol=1e-7, random_state=0)
        ordinary_w = ordinary.fit_transform(comparison_x, W=w0.copy(), H=h0.copy())
        print(loss, "scratch", fit.status, fit.diagnostics[-1])
        print(loss, "ordinary_objective", objective(comparison_x, ordinary_w, ordinary.components_, loss))
        print(loss, "empty_shape", fit.transform(np.empty((0, 3)))[0].shape)


if __name__ == "__main__":
    main()
```


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


```python title="nmf_beta_mm.py"
"""Strictly positive dense beta-MM NMF, with beta restricted to [0, 3]."""

from dataclasses import dataclass
from decimal import Decimal, localcontext
from numbers import Real
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, generalized_kl, nonnegative_scalar,
    nonnegative_table, positive_integer, read_only, reconstruction,
    require_finite, stable_norm,
)
from nmf_coordinate import stopping_threshold
from nmf_multiplicative import MultiplicativeFit


def beta_parameter(value):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, Real):
        raise ValueError("beta must be a finite real number in [0, 3]")
    try:
        result = float(value)
    except (ValueError, TypeError, OverflowError) as error:
        raise ValueError("beta must be a finite real number in [0, 3]") from error
    if not np.isfinite(result) or not 0 <= result <= 3:
        raise ValueError("beta must be a finite real number in [0, 3]")
    return result


def positive_table(values, features=None, *, require_rows=False):
    table = nonnegative_table(values, features, require_rows=require_rows)
    if np.any(table <= 0):
        raise ValueError("This beta-MM route requires strictly positive cells")
    return table


def mm_exponent(beta):
    beta = beta_parameter(beta)
    return 1 / (2 - beta) if beta < 1 else (1 if beta <= 2 else 1 / (beta - 1))


def decimal_cell(x, y, beta):
    """Rare high-precision fallback near removable beta=0/1 singularities."""
    distance = min(abs(beta), abs(beta - 1))
    precision = max(70, int(-np.log10(distance)) + 40)
    with localcontext() as context:
        context.prec = precision
        a, b, p = (Decimal.from_float(float(v)) for v in (x, y, beta))
        value = ((p * a.ln()).exp() + (p - 1) * (p * b.ln()).exp()
                 - p * a * ((p - 1) * b.ln()).exp()) / (p * (p - 1))
        return float(value)


def beta_loss(values, predicted, beta):
    """Sum, not a norm; exact beta=2/1/0 branches and close-ratio series."""
    beta = beta_parameter(beta)
    x, y = positive_table(values), positive_table(predicted)
    if x.shape != y.shape:
        raise ValueError("Observation and prediction shapes must agree")
    if beta == 2:
        with np.errstate(over="ignore", invalid="ignore"):
            return float(require_finite(np.sum((x - y) ** 2) / 2, "Squared beta loss"))
    if beta == 1:
        return generalized_kl(x, y)
    with np.errstate(over="ignore", under="ignore", invalid="ignore", divide="ignore"):
        delta = (x - y) / y
        require_finite(delta, "Relative cell difference")
        close = np.abs(delta) < 1e-3
        terms = np.empty_like(x)
        # d_beta = y**beta * [delta²/2 + (beta-2)delta³/6 + ...].
        d = delta[close]
        term = d * d / 2
        series = term.copy()
        for degree in range(3, 11):
            term = term * d * (beta - degree + 1) / degree
            series += term
        terms[close] = np.power(y[close], beta) * series
        if beta == 0:
            ratio = x[~close] / y[~close]
            terms[~close] = ratio - 1 - np.log(ratio)
        elif min(abs(beta), abs(beta - 1)) < 1e-5:
            terms[~close] = [decimal_cell(a, b, beta) for a, b in zip(x[~close], y[~close])]
        else:
            a, b = x[~close], y[~close]
            terms[~close] = (np.power(a, beta) + (beta - 1) * np.power(b, beta)
                            - beta * a * np.power(b, beta - 1)) / (beta * (beta - 1))
        require_finite(terms, "Beta loss cells")
        if np.any(terms < 0) or np.any((x != y) & (terms == 0)):
            raise ValueError("Beta loss lost nonnegative finite resolution; rescale the data")
        return float(require_finite(np.sum(terms), "Beta loss reduction"))


def positive_power(values, power):
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        result = np.power(values, power)
    require_finite(result, "Positive power")
    if np.any(result <= 0):
        raise ValueError("Positive power underflowed; rescale the data")
    return result


def amount_products(x, w, h, beta):
    """Return numerator then denominator, both row-by-component."""
    if beta == 2:
        with np.errstate(over="ignore", invalid="ignore"):
            numerator, denominator = x @ h.T, w @ (h @ h.T)
    else:
        prediction = reconstruction(w, h)
        if np.any(prediction <= 0):
            raise ValueError("Positive reconstruction was lost")
        with np.errstate(over="ignore", under="ignore", invalid="ignore"):
            weighted = x * positive_power(prediction, beta - 2)
            if np.any(weighted <= 0):
                raise ValueError("Positive weighted observations underflowed")
            numerator = weighted @ h.T
            denominator = positive_power(prediction, beta - 1) @ h.T
    for product in (numerator, denominator):
        require_finite(product, "Beta update contraction")
        if np.any(product <= 0):
            raise ValueError("Beta update needs positive contractions")
    return numerator, denominator


def update_amounts(x, w, h, beta):
    numerator, denominator = amount_products(x, w, h, beta)
    with np.errstate(over="ignore", under="ignore", invalid="ignore"):
        ratio = numerator / denominator
        result = w * positive_power(ratio, mm_exponent(beta))
    require_finite(result, "Beta-MM update")
    if np.any(result <= 0):
        raise ValueError("Beta-MM update left the finite positive domain")
    return result


def beta_sweep(x, w, h, beta):
    """New H first, then W using new H; caller-owned arrays are not changed."""
    beta = beta_parameter(beta)
    x, w, h = positive_table(x), positive_table(w), positive_table(h)
    factor_shapes(x, w, h)
    new_h = update_amounts(x.T, h.T, w.T, beta).T
    return update_amounts(x, w, new_h, beta), new_h


def gradient_norm(x, w, h, beta):
    numerator_w, denominator_w = amount_products(x, w, h, beta)
    numerator_h, denominator_h = amount_products(x.T, h.T, w.T, beta)
    # All factor entries are positive: the interior gradient is the diagnostic.
    value = np.hypot(stable_norm(denominator_w - numerator_w),
                     stable_norm(denominator_h - numerator_h))
    return float(require_finite(value, "Beta gradient norm"))


@dataclass(frozen=True)
class BetaFit:
    amounts: np.ndarray
    patterns: np.ndarray
    features: tuple
    beta: float
    max_iter: int
    tol: float
    diagnostics: tuple
    status: str

    def transform(self, values, *, features=None):
        x = positive_table(values, self.patterns.shape[1])
        if features is not None and feature_ids(features, x.shape[1]) != self.features:
            raise ValueError("Query feature IDs/order differ from the fitted dictionary")
        if self.beta in (1, 2):
            # Reuse the already explained KL/Gram-cached fixed-H encoder.
            loss = "kl" if self.beta == 1 else "frobenius"
            return MultiplicativeFit(self.amounts, self.patterns, self.features, loss,
                                     self.max_iter, self.tol, (), self.status).transform(x)
        w = np.ones((x.shape[0], self.patterns.shape[0]))
        if len(x) == 0:
            return w, {"status": "empty-query", "iterations": 0}
        def norm(amounts):
            numerator, denominator = amount_products(x, amounts, self.patterns, self.beta)
            return stable_norm(denominator - numerator)
        baseline = norm(w)
        threshold = stopping_threshold(self.tol, baseline)
        current, iterations = baseline, 0
        for _ in range(self.max_iter):
            if current <= threshold:
                break
            w = update_amounts(x, w, self.patterns, self.beta)
            iterations += 1
            current = norm(w)
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        return w, {"status": status, "iterations": iterations, "gradient": current}

    def inverse_transform(self, values):
        return reconstruction(nonnegative_table(values, self.patterns.shape[0]), self.patterns)


def fit_beta(values, initial_w, initial_h, *, beta=2, max_iter=100, tol=1e-7, features=None):
    beta = beta_parameter(beta)
    x = positive_table(values, require_rows=True)
    w, h = positive_table(initial_w), positive_table(initial_h)
    factor_shapes(x, w, h)
    cap, tolerance = positive_integer(max_iter, "max_iter"), nonnegative_scalar(tol, "tol")
    names = feature_ids(features, x.shape[1])
    current = gradient_norm(x, w, h, beta)
    threshold = stopping_threshold(tolerance, current)
    history = [(0, beta_loss(x, reconstruction(w, h), beta), current)]
    for iteration in range(1, cap + 1):
        if current <= threshold:
            break
        w, h = beta_sweep(x, w, h, beta)
        current = gradient_norm(x, w, h, beta)
        history.append((iteration, beta_loss(x, reconstruction(w, h), beta), current))
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    return BetaFit(read_only(w), read_only(h), names, beta, cap, tolerance, tuple(history), status)


def main():
    from sklearn.decomposition import NMF
    truth_w = np.array([[2, 1], [1, 3], [.5, 2.]])
    truth_h = np.array([[1, .2, 1], [.2, 1, 1.]])
    x = truth_w @ truth_h
    w0 = np.array([[1, .7], [.8, 1.2], [.5, 1.]])
    h0 = np.array([[1, .25, 1], [.25, 1, 1.]])
    print("positive_observations", x.tolist())
    for beta in (0, 1, 2):
        fitted = fit_beta(x, w0, h0, beta=beta, max_iter=100)
        ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss=beta,
                       alpha_W=0, alpha_H=0, tol=1e-7, max_iter=100, random_state=0)
        ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
        print("beta", beta, "gamma", mm_exponent(beta), "scratch", fitted.status, fitted.diagnostics[-1])
        print("ordinary_loss", beta_loss(x, ordinary_w @ ordinary.components_, beta))
        print("empty_query", fitted.transform(np.empty((0, 3)))[0].shape)


if __name__ == "__main__":
    main()
```


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


```python title="nmf_initialization.py"
"""Uncentred NNDSVD assembly, explicit zero fills, and positive random starts."""

import numpy as np

from nmf_arrays import (
    frobenius_metrics, nonnegative_scalar, nonnegative_table, positive_integer,
    reconstruction, require_finite, stable_norm,
)


def paired_component(singular_value, left, right):
    """One nonnegative component of a supplied signed outer product.

    Return W column, H row, selected sign, and the two paired norm products.
    An exact floating-point tie chooses positive. Zero terms skip division.
    """
    sigma = nonnegative_scalar(singular_value, "singular_value")
    u, v = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
    if u.ndim != 1 or v.ndim != 1 or not u.size or not v.size:
        raise ValueError("A singular pair needs two nonempty vectors")
    require_finite(u, "Left vector")
    require_finite(v, "Right vector")
    up, un = np.maximum(u, 0), np.maximum(-u, 0)
    vp, vn = np.maximum(v, 0), np.maximum(-v, 0)
    nu, nv = (stable_norm(up), stable_norm(un)), (stable_norm(vp), stable_norm(vn))
    with np.errstate(over="ignore", under="ignore"):
        scores = np.array([nu[0] * nv[0], nu[1] * nv[1]])
    require_finite(scores, "Sign-pair norm products")
    if any(nu[j] > 0 and nv[j] > 0 and scores[j] == 0 for j in (0, 1)):
        raise ValueError("Sign-pair arithmetic underflowed; rescale the vectors")
    choice = 0 if scores[0] >= scores[1] else 1
    if sigma == 0 or scores[choice] == 0:
        return np.zeros_like(u), np.zeros_like(v), "zero", tuple(scores)
    scale = np.sqrt(sigma) * np.sqrt(scores[choice])
    w = scale * ((up if choice == 0 else un) / nu[choice])
    h = scale * ((vp if choice == 0 else vn) / nv[choice])
    require_finite(w, "Component amounts")
    require_finite(h, "Component pattern")
    return w, h, ("positive" if choice == 0 else "negative"), tuple(scores)


def fill_zeros(w, h, value):
    """Copy both factors and replace only their exact zeros by one amount."""
    value = nonnegative_scalar(value, "fill value")
    return np.where(w == 0, value, w), np.where(h == 0, value, h)


def table_mean(x):
    """Mean without overflowing a sum of large finite nonnegative entries."""
    scale = float(np.max(x))
    return 0.0 if scale == 0 else float(scale * np.mean(x / scale))


def initialize_nndsvd(values, n_components, *, variant="plain", seed=0, zero_threshold=0.0):
    """Return fresh W(n,k), H(k,d), using dense economy SVD of UNCENTRED X.

    variant: plain, mean, or small-random (uniform on [0, mean(X)/100)).
    zero_threshold is an explicit absolute factor-entry cutoff, not rank selection.
    """
    x = nonnegative_table(values, require_rows=True)
    k = positive_integer(n_components, "n_components")
    threshold = nonnegative_scalar(zero_threshold, "zero_threshold")
    if k > min(x.shape):
        raise ValueError("NNDSVD needs k <= min(n_rows, n_features)")
    if variant not in ("plain", "mean", "small-random"):
        raise ValueError("Choose plain, mean or small-random")
    u, s, vh = np.linalg.svd(x, full_matrices=False)
    require_finite(s, "Singular values")
    w, h = np.zeros((x.shape[0], k)), np.zeros((k, x.shape[1]))
    w[:, 0], h[0] = np.sqrt(s[0]) * np.abs(u[:, 0]), np.sqrt(s[0]) * np.abs(vh[0])
    for component in range(1, k):
        w[:, component], h[component], _, _ = paired_component(s[component], u[:, component], vh[component])
    w[w < threshold], h[h < threshold] = 0.0, 0.0
    if variant == "mean":
        w, h = fill_zeros(w, h, table_mean(x))
    elif variant == "small-random":
        rng, scale = np.random.default_rng(seed), table_mean(x) / 100
        for factor in (w, h):
            zeros = factor == 0
            factor[zeros] = scale * rng.random(np.count_nonzero(zeros))
    return require_finite(w, "Initial amounts"), require_finite(h, "Initial patterns")


def initialize_positive_random(values, n_components, *, seed=0):
    """A separate overcomplete-capable start; bounded uniform factors are positive.

    Each entry is sqrt(mean(X)/k) * Uniform[0.5,1.5). This is not NNDSVD,
    nor the library's absolute-normal distribution. An all-zero table is refused.
    """
    x = nonnegative_table(values, require_rows=True)
    k = positive_integer(n_components, "n_components")
    mean = table_mean(x)
    if mean == 0:
        raise ValueError("A data-scaled positive random start needs some positive data")
    scale, rng = np.sqrt(mean) / np.sqrt(k), np.random.default_rng(seed)
    w = scale * rng.uniform(0.5, 1.5, size=(x.shape[0], k))
    h = scale * rng.uniform(0.5, 1.5, size=(k, x.shape[1]))
    require_finite(w, "Random amounts")
    require_finite(h, "Random patterns")
    if np.any(w == 0) or np.any(h == 0):
        raise ValueError("Positive random arithmetic underflowed; rescale the data")
    return w, h


def main():
    from sklearn.decomposition import NMF
    from nmf_multiplicative import multiplicative_sweep, update_amounts

    x = np.array([[8.2, 2.4], [2.4, 6.8]])
    w, h = initialize_nndsvd(x, 2)
    print("initial_w", w.tolist())
    print("initial_h", h.tolist())
    print("residual_x_minus_wh", (x - reconstruction(w, h)).tolist())
    for delta in (0.0, 0.1, 2.0):
        start_w, start_h = fill_zeros(w, h, delta)
        new_w, new_h = multiplicative_sweep(x, start_w, start_h)
        print("fill", delta, "initial_half_loss", frobenius_metrics(x, start_w, start_h).half_square,
              "one_sweep_half_loss", frobenius_metrics(x, new_w, new_h).half_square,
              "changed_entries", new_h[1, 0], new_w[0, 1])
    # Same CUSTOM start isolates solver conventions; sklearn uses W-first order.
    ordinary = NMF(n_components=2, init="custom", solver="mu", beta_loss="frobenius",
                   max_iter=1, tol=0, alpha_W=0, alpha_H=0, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w.copy(), H=h.copy())
    print("ordinary_custom_one_sweep_half_loss", frobenius_metrics(x, ordinary_w, ordinary.components_).half_square)
    reference_w = update_amounts(x, w, h, "frobenius")
    reference_h = update_amounts(x.T, h.T, reference_w.T, "frobenius").T
    print("same_W_first_factor_max_differences", np.max(np.abs(ordinary_w - reference_w)),
          np.max(np.abs(ordinary.components_ - reference_h)))
    # Usual public initialization route: independently initialized, not a parity test.
    usual = NMF(n_components=2, init="nndsvda", solver="cd", beta_loss="frobenius",
                max_iter=100, tol=1e-7, alpha_W=0, alpha_H=0, random_state=0)
    usual_w = usual.fit_transform(x)
    print("ordinary_nndsvda_iterations", usual.n_iter_, "half_loss", frobenius_metrics(x, usual_w, usual.components_).half_square)
    random_w, random_h = initialize_positive_random(x, 3, seed=19)
    print("overcomplete_shapes", random_w.shape, random_h.shape)


if __name__ == "__main__":
    main()
```


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

## 10. Use the ordinary tools deliberately

We now know how an initializer proposes factors and how a solver changes them. To use either one outside a hand calculation, we need to separate two moments: learning patterns from training rows, then expressing a new row with those patterns held fixed. Otherwise a call that looks like “encode this measurement” can quietly become a different fitting problem.

Which arrays should a fitted model keep, and which arrays should it return for a new observation?

Keep the learned patterns; solve new amounts in the same feature order.

<!-- figure:D35 -->

Read the feature labels F0, F1 and F2 across every observation and pattern row. Our original X0 has three observation rows and three features. With two components, training returns an amount table of shape `(3,2)` and a dictionary of shape `(2,3)`. The blue and rose columns of amounts correspond to the blue and rose rows of the dictionary. Multiplying them contracts the two-component axis and returns a `(3,3)` reconstruction.

The picture's numerical W_exact and H0 are the hand-constructed factors from section 1, used to make those dimensions concrete. They are not a claim that a library fit learned those exact factors. The separate fitting lane labels its output as learned arrays, whose actual entries depend on initialization, solver and stopping. We will inspect a computed tiny example below.

Below the fitted boundary, a new row with three features receives two new amounts. Only that amount row changes; the stored dictionary stays fixed. For the supplied H0, the row `[1.5,0.5,2]` has exact amounts `[1.5,0.5]`, because its component contributions are `[1.5,0,1.5]` and `[0,0.5,0.5]`. Their sum restores the row. This is a supplied-dictionary calculation, not a fresh fit or a prediction of a future measurement.

For a fitted dictionary \(\widehat H\), the unpenalized squared-error query is

\[
\widehat w(x)=\arg\min_{w\geq0}\tfrac12\|x-w\widehat H\|_2^2,
\qquad \widehat x=\widehat w(x)\widehat H.
\]

If several amount vectors minimize the query cost, the argmin is a set and the solver returns one allowed choice. Our earlier dependent-pattern examples explain why comparing reconstructions can be more meaningful than comparing coefficients. An inverse reconstruction is also not an exact inverse for arbitrary x: the available patterns may not represent it, and the query solve may stop at a finite tolerance.

The [public NMF interface](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html) uses `fit_transform(X)` to learn the dictionary and return training amounts, `components_` for the dictionary, `transform(Q)` for new amounts and `inverse_transform(amounts)` for reconstruction. Here Q is a new observation table with the same features. `fit_transform(Q)` would instead learn a new dictionary from Q. It is the wrong operation when the question is how the training dictionary represents new observations.

[Section 5 derived the coordinate kernel](#5-change-one-coordinate-then-reuse-the-arithmetic); section 6 supplies its complete [`nmf_coordinate.py` fitter and `nmf_nnls.py` public NNLS comparison](#6-fit-both-factors-and-decide-when-to-stop). Fixed-H encoding was introduced in [section 4](#4-encode-a-new-row-with-the-dictionary-held-fixed) and implemented by those programs. We reuse those files rather than introduce a second coordinate solver. In particular, `CoordinateNMF.transform` reads the fitted dictionary and its stopping settings, checks any supplied feature identities and calls the already-explained fixed-H encoder:


```python
    def transform(self, values, *, features=None, return_diagnostics=False):
        state = self._fitted()
        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:
            raise ValueError("Query feature IDs/order differ from the fitted dictionary")
        w, diagnostic = encode_coordinates(values, state.h, max_iter=state.max_iter, tol=state.tol, sweeps=state.sweeps)
        return (w, diagnostic) if return_diagnostics else w
```


`state` is the previously published snapshot, not a new initializer. Its dictionary's row count determines the number of returned amounts. With explicit feature identities, a query ordered `[F1,F0,F2]` is refused rather than silently treated as `[F0,F1,F2]`. A plain numerical array cannot carry those meanings by itself: if you omit the optional feature IDs in this scratch API, preserving their order is your responsibility. The ordinary adapter below requires them explicitly. It does not assume that an ndarray's shape proves its columns mean the right thing.

How should we compare two solver choices without confusing their different update schedules?

Give both the same row, fixed dictionary and starting amounts, then inspect one precisely named block.

<!-- figure:D36 -->

This is R1=`[1,3,4]` from our running example, with H0 held fixed. The only control changes the first starting amount a between 0.5 and 2; the second starting amount remains 1. The two lanes begin from exactly `[a,1]`. One lane makes a cyclic coordinate-descent sweep, changing the blue amount before the rose amount. The other changes both amounts simultaneously with a Frobenius multiplicative W update. Neither lane updates the dictionary or runs a whole alternating fit.

With H0, the shared Gram is `[[2,1],[1,2]]` and R1's cross row is `[5,7]`. In the coordinate lane, the first amount becomes `(5-1)/2=2`. The second uses that **new** first amount and becomes `(7-2)/2=2.5`. Thus this one cyclic sweep ends at `[2,2.5]` for every a in the control's interval. It reconstructs `[2,2.5,4.5]`; half the sum of its three squared residuals is `3/4`.

The multiplicative lane uses the original amounts in both denominators:

\[
w_0^{\mathrm{new}}=a\frac{5}{2a+1},\qquad
w_1^{\mathrm{new}}=1\frac{7}{a+2}.
\]

At a=1 it gives `[5/3,7/3]`, reconstructing `[5/3,7/3,4]`, with half-loss `4/9`. At a=0.5 it gives `[5/4,14/5]`, with half-loss `21/400`; at a=2 it gives `[2,7/4]`, with half-loss `21/16`. The same coordinate sweep therefore has a higher loss than the multiplicative block at the default and lower-end states, but a lower loss at the upper endpoint. The direction of that comparison changes with the starting state. It cannot establish that either full solver is always preferable.

The picture also draws the slope for each updated amount. The fixed-block gradient is `g=wG-[5,7]`. At the default, the coordinate result has gradient `[1.5,0]`, while the multiplicative result has `[2/3,-2/3]`. Since all these amounts are positive, their projected-gradient squared norms are `9/4` and `8/9` respectively. Neither result solves this coupled block to stationarity. The coordinate sweep minimized one coordinate at a time; its later rose update changed the slope of the earlier blue coordinate. This makes the need for further sweeps visible instead of confusing a single coordinate minimization with a fully solved NNLS problem.

The two local operations are the exact primitives already derived in sections 5 and 7. The live picture uses those displayed single-block equations; it is not a browser call to sklearn and does not imply that the library's private schedules match every scratch loop. The public full-fit comparison in `nmf_coordinate.py` supplies the same initial W/H, disables additional penalties, uses Frobenius CD and sets the coordinate order explicitly. Its already recorded X0 fit has scratch half-loss about `2.080268×10⁻¹³` and ordinary half-loss about `1.422005×10⁻¹⁴`. Those retained outputs describe that configured full fit, not D36's single block or a new timing study. The ordinary residual norm `1.686419×10⁻⁷` equals the square root of twice its half-loss, as section 3 established.

**Deeper: choose a compatible objective and solver.** A name like NMF does not fix the discrepancy we minimize. Section 7's KL construction and section 8's beta divergences deliberately changed that discrepancy. Keep the following combinations explicit rather than changing only a solver keyword and assuming the mathematics stays the same.

| Public solver | Discrepancy | Important input/support distinction |
|---|---|---|
| `cd` | Frobenius, beta=2 | Nonnegative observations may include zero; coordinate curvature and gradients are the squared-error ones. |
| `mu` | Frobenius or generalized KL | The previously taught zero-support and zero-lock issues still matter. |
| `mu` | Other supported beta values | For beta≤0 the public estimator refuses zero-valued observations; our section 8 general-beta scratch route deliberately requires strictly positive data and factors. |

These are the [documented solver/loss settings](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html), not permission to transfer a Frobenius derivation to every beta. Recompute the chosen objective when comparing implementations. An iteration cap, a small residual and first-order stationarity answer different questions; none is a certificate that the joint nonconvex factorization recovered a unique physical source. The next section will explain what additional factor penalties change.

What should happen if an attempted refit fails while a useful dictionary already exists?

Build a complete candidate separately, then replace the fitted state in one step.

<!-- figure:D37 -->

The left lane contains the old dictionary, ordered features `[F0,F1,F2]`, fitted component count 2 and its diagnostics. Together they describe one model. The upper candidate lane receives new training rows and initialization. Invalid values or incompatible shapes stop that lane before publication, so every old slot remains available for a query. The valid-candidate lane shows all the new slots crossing the publication boundary together. Moving only the dictionary while leaving the old feature order or shape settings behind would create a model that never existed during fitting.

In our scratch estimator, the final lines of `fit_transform` construct the whole state and then publish it. This exact excerpt comes from the complete earlier program:


```python
        candidate = CoordinateState(read_only(h), names, cap, tol, sweeps, tuple(history), status)
        self._state = candidate  # The only publication point; failures above preserve old state.
        return w.copy()
```


The snapshot owns a read-only dictionary; `components_` returns a copy. The returned training amounts are also copied. Query dimensions come from that dictionary rather than a mutable next-fit `n_components`. Changing the next-fit rank to 1 must therefore leave the old model's two-component queries intact until a new candidate successfully replaces it.

Public estimators do not promise that calling a failing `fit` on the same object preserves every previous fitted field. We can provide that application-level behavior without changing the library solver: construct a fresh candidate estimator, fit and inspect it, then publish it. The following complete adapter fixes one deliberately narrow configuration, unpenalized CD/Frobenius, so its state logic is easy to see. The earlier source supplies the actual scratch algorithm. Save `ordinary_nmf_lifecycle.py` beside `nmf_arrays.py`, `nmf_coordinate.py`, `nmf_nnls.py` and their `centered_pca.py` helper, then run `python ordinary_nmf_lifecycle.py` in the same NumPy/SciPy/scikit-learn environment as the earlier examples.


```python
"""Public NMF lifecycle with candidate publication; the solver remains sklearn's."""
from dataclasses import dataclass
import numpy as np
from sklearn.decomposition import NMF

from nmf_arrays import (
    feature_ids, frobenius_metrics, nonnegative_scalar, nonnegative_table,
    positive_integer, reconstruction, require_finite,
)


@dataclass(frozen=True)
class OrdinaryState:
    model: NMF
    features: tuple
    k: int
    fit_half_loss: float


class PublishedNMF:
    """A deliberately CD/Frobenius, unpenalized adapter; no new NMF solver."""
    def __init__(self, n_components, *, max_iter=2000, tol=1e-7):
        self.n_components, self.max_iter, self.tol = n_components, max_iter, tol
        self._state = None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit the dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().model.components_.copy()

    @property
    def fit_half_loss_(self):
        return self._fitted().fit_half_loss

    def fit_transform(self, values, *, features, initial_w, initial_h):
        x = nonnegative_table(values, require_rows=True)
        k = positive_integer(self.n_components, "n_components")
        cap = positive_integer(self.max_iter, "max_iter")
        tol = nonnegative_scalar(self.tol, "tol")
        names = feature_ids(features, x.shape[1])
        w0, h0 = nonnegative_table(initial_w, k), nonnegative_table(initial_h, x.shape[1])
        if w0.shape != (x.shape[0], k) or h0.shape != (k, x.shape[1]):
            raise ValueError("Initial factors must match fitting rows, rank and features")
        candidate = NMF(n_components=k, init='custom', solver='cd', beta_loss='frobenius',
                        alpha_W=0, alpha_H=0, shuffle=False, max_iter=cap, tol=tol,
                        random_state=0)
        w = candidate.fit_transform(x, W=w0, H=h0)
        require_finite(candidate.components_, "Candidate dictionary")
        loss = frobenius_metrics(x, w, candidate.components_).half_square
        result = w.copy()
        self._state = OrdinaryState(candidate, names, k, loss)
        return result

    def transform(self, values, *, features):
        state = self._fitted()
        x = nonnegative_table(values, state.model.components_.shape[1])
        if feature_ids(features, x.shape[1]) != state.features:
            raise ValueError("Query feature order differs from the fitted dictionary")
        if x.shape[0] == 0:
            return np.empty((0, state.k))
        return require_finite(state.model.transform(x), "Ordinary query amounts")

    def inverse_transform(self, values):
        state = self._fitted()
        w = nonnegative_table(values, state.k)
        if w.shape[0] == 0:
            return np.empty((0, state.model.components_.shape[1]))
        return require_finite(state.model.inverse_transform(w), "Ordinary reconstruction")


def main():
    from nmf_coordinate import CoordinateNMF

    np.set_printoptions(precision=9, suppress=True)
    # New constructed inputs, distinct from the earlier coordinate main.
    x = np.array([[3., 1., 4.], [1., 2., 3.], [2., 1., 3.]])
    query = np.array([[1.5, .5, 2.]])
    h0, w0 = np.array([[1., 0., 1.], [0., 1., 1.]]), np.ones((3, 2))
    features = ('F0', 'F1', 'F2')
    scratch, ordinary = CoordinateNMF(2, max_iter=2000), PublishedNMF(2)
    checks = []
    def check(name, condition):
        checks.append(name)
        if not condition:
            raise AssertionError(name)
    for name, model in [('scratch', scratch), ('ordinary', ordinary)]:
        w = model.fit_transform(x, features=features, initial_w=w0, initial_h=h0)
        h = model.components_
        amounts = model.transform(query, features=features)
        rebuilt = model.inverse_transform(amounts)
        print(name, 'shapes', w.shape, h.shape, amounts.shape, rebuilt.shape)
        print(name, 'dictionary', h, 'query_amounts', amounts, 'query_reconstruction', rebuilt)
        print(name, 'fit_half_loss', frobenius_metrics(x, w, h).half_square)
        check(name+' shapes', (w.shape,h.shape,amounts.shape,rebuilt.shape)==((3,2),(2,3),(1,2),(1,3)))
        check(name+' reconstruct by stored H', np.allclose(rebuilt, amounts @ h, rtol=1e-14,atol=1e-14))
        check(name+' small constructed fit residual', frobenius_metrics(x,w,h).half_square < 1e-10)
        check(name+' copied inputs', np.array_equal(w0,np.ones((3,2))) and np.array_equal(h0,[[1,0,1],[0,1,1]]))
        h[:] = -99
        check(name+' dictionary return is isolated', (model.components_ >= 0).all())
        before_h, before_q = model.components_, model.transform(query, features=features)
        model.n_components = 1  # Next fit only; old query must still have two amounts.
        for invalid, ids in [([[-1.,0.,1.]],features), ([[np.nan,0.,1.]],features), ([[1.,2.]],features)]:
            try:
                model.fit_transform(invalid,features=ids,initial_w=np.ones((1,1)),initial_h=np.ones((1,3)))
            except ValueError:
                check(name+' rejected fit conserves snapshot', np.array_equal(before_h,model.components_) and np.array_equal(before_q,model.transform(query,features=features)))
            else:
                raise AssertionError('Invalid fit unexpectedly accepted')
        for invalid, ids in [(query,('F1','F0','F2')), ([[-1.,0.,1.]],features), ([[1.,2.]],features)]:
            try:
                model.transform(invalid,features=ids)
            except ValueError:
                check(name+' refused incompatible query', True)
            else:
                raise AssertionError('Invalid query unexpectedly accepted')
        check(name+' empty shapes use fitted rank', model.transform(np.empty((0,3)),features=features).shape==(0,2) and model.inverse_transform(np.empty((0,2))).shape==(0,3))
        check(name+' next-fit rank did not change query', model.transform(query,features=features).shape==(1,2))
        print(name,'rejected_candidates_preserved',True,'empty_amounts',(0,2),'next_fit_rank',model.n_components)
    print('new_lifecycle_checks',len(checks))


if __name__ == '__main__':
    main()
```


Follow the adapter's publication point. It validates the fitting table, identities and supplied factor shapes, then creates a local public estimator with `init='custom'`. The validated initial factors are copies, so library updates cannot overwrite the caller's starting arrays. Only after fitting and recomputing a finite data cost does the adapter replace `_state`. The resulting snapshot contains the fitted estimator, its feature tuple, fitted component count and measured half-loss. It is an encapsulated model state, not a claim that a Python dataclass recursively freezes the library object it contains. Callers use the adapter's copied dictionary and query methods.

For a query, the adapter validates feature order before calling the saved estimator's `transform`. Its own empty-table branch returns `(0,fitted_k)`; `inverse_transform` analogously returns `(0,d)` for empty amounts. Those branches are stated adapter behavior, not a claim that a bare sklearn estimator accepts zero-row inputs. Nonempty inverse calls use the ordinary public operation. Finite but capped library fitting may still return a candidate and emit its convergence warning; this adapter does not turn a finite fit into a claim of stationarity. Use the scratch diagnostic or an explicitly computed fixed-block gradient when that is the quantity you need.

The main deliberately switches to a **new constructed training table** `[[3,1,4],[1,2,3],[2,1,3]]`, while keeping the same features and initial H0. This changes the data so we can test the lifecycle without treating an old demonstration as a new experiment. Both routes return shapes `(3,2)`, `(2,3)`, `(1,2)` and `(1,3)` for training amounts, dictionary, query amounts and query reconstruction. In the recorded run, their dictionaries are close but not identical:


```text
scratch shapes (3, 2) (2, 3) (1, 2) (1, 3)
scratch dictionary [[0.953999132 0.023546243 0.977545623]
 [0.          1.001392157 1.001391757]] query_amounts [[1.572328533 0.462333798]] query_reconstruction [[1.500000055 0.49999987  2.00000013 ]]
scratch fit_half_loss 9.521514375206836e-14
scratch rejected_candidates_preserved True empty_amounts (0, 2) next_fit_rank 1
ordinary shapes (3, 2) (2, 3) (1, 2) (1, 3)
ordinary dictionary [[0.953999175 0.023546311 0.977545556]
 [0.          1.001392013 1.001391901]] query_amounts [[1.572328418 0.462333856]] query_reconstruction [[1.500000014 0.499999964 2.000000036]]
ordinary fit_half_loss 7.5908004109663e-15
ordinary rejected_candidates_preserved True empty_amounts (0, 2) next_fit_rank 1
new_lifecycle_checks 26
```


The query `[1.5,0.5,2]` is reconstructed with small nonzero numerical residuals visible in the output. Its learned amount values are around `[1.57233,0.46233]`, rather than the `[1.5,0.5]` amounts of the supplied H0 calculation above, because the fitted dictionary is different. That comparison connects factor-scale/representation ambiguity to normal API use: the same measured row need not have the same coefficients under different dictionaries. The training half-losses, approximately `9.521514×10⁻¹⁴` and `7.590800×10⁻¹⁵`, describe this tiny changed table only.

The program next modifies returned dictionary copies and verifies that the fitted dictionaries survive. It changes next-fit rank to 1, attempts negative, nonfinite and wrong-shape refits, and verifies exact preservation of each old dictionary and old query result. It also rejects reordered, negative and wrong-width queries. Both empty-query and empty-reconstruction shapes still use the fitted two-component state. The 26 internal conditions test those contracts; they do not prove that arbitrary software cannot fail or that a close reconstruction validates an interpretation of its patterns.

**Deeper: fitting amounts and querying the training rows are different computations.** At finite stopping, alternating fitting may end immediately after an H update. Its returned W was solved against the preceding H. Calling `transform(X_train)` holds the final dictionary fixed and solves amounts again. Consequently, do not require bitwise equality between returned training amounts and a later encoding of the same table, even when the shapes and objective agree. Test the intended reconstruction and stopping contract. When dictionary rows are dependent, an additional reason for different coefficients is genuine nonuniqueness, already illustrated by our NNLS examples.

The added state wrapper does not change the asymptotic cost of the maintained fit or transform. It copies the validated input and initial factors and temporarily holds the old and candidate models together; that overlap is the price of keeping an old model available through a rejected candidate. Stored dictionary size is `k×d`, with feature metadata of length d and the library's fitted attributes. The full scratch solver's Gram, sweep and blocked-diagnostic costs remain those derived in section 6. Avoid keeping all per-row component contribution tensors merely to support these state operations.

Try a changed state problem. A dictionary was trained in order `[F0,F1,F2]`, but a new array arrives in order `[F2,F0,F1]`. Supplying the old names without moving its data is incorrect. Reorder both the data columns and their actual identities consistently, or refuse the query. For the supplied H0, the correctly ordered row `[1,1,2]` has amounts `[1,1]` and zero reconstruction residual. Explain why merely seeing three columns, or obtaining nonnegative output from a mismatched query, would not establish that the representation was meaningful. Then cap a fit early and compare its returned training amounts with a fresh `transform` under the final dictionary; inspect both residual and fixed-block slope instead of assuming exact equality.

We can now initialize, fit, compare a precisely named update and query one coherent model without quietly refitting the question. Next we will make two modeling choices explicit: charging for factor size and excluding measurements that were never observed.

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


```python
"""Dimension-scaled elastic penalties and streamed weighted NMF coordinates."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, nonnegative_scalar,
    nonnegative_table, positive_integer, projected_gradient, read_only,
    reconstruction, require_finite, stable_norm,
)
from nmf_coordinate import block_cache, coordinate_block, coordinate_sweeps, stopping_threshold


@dataclass(frozen=True)
class Penalties:
    w_l1: float
    w_l2: float
    h_l1: float
    h_l2: float


def penalty_coefficients(alpha_w, alpha_h, l1_ratio, n, d):
    aw, ah = nonnegative_scalar(alpha_w, "alpha_w"), nonnegative_scalar(alpha_h, "alpha_h")
    r = nonnegative_scalar(l1_ratio, "l1_ratio")
    if r > 1:
        raise ValueError("l1_ratio must lie between zero and one")
    n, d = positive_integer(n, "n"), positive_integer(d, "d")
    with np.errstate(over="ignore", invalid="ignore"):
        values = np.array([aw * d * r, aw * d * (1-r), ah * n * r, ah * n * (1-r)])
    require_finite(values, "Dimension-scaled penalties")
    return Penalties(*map(float, values))


def observation_weights(values, shape):
    if values is None:
        return None
    weights = nonnegative_table(values, shape[1])
    if weights.shape != shape:
        raise ValueError("Observation weights must match every data cell")
    return weights


def local_weighted_cache(row, h, weights):
    """One row only: no cache array with shape n*k*k is constructed."""
    included = weights > 0
    roots = np.sqrt(weights[included])
    with np.errstate(over="ignore", invalid="ignore"):
        design = h[:, included] * roots
        target = row[included] * roots
        gram, cross = design @ design.T, design @ target
    require_finite(gram, "Weighted local Gram")
    require_finite(cross, "Weighted local cross product")
    return gram, cross


def weighted_coordinate_block(x, w, h, weights, sweeps, l1=0.0, l2=0.0):
    """Validated arrays: update rows in place with a fresh local cache per row."""
    if weights is None:
        return coordinate_block(x, w, h, sweeps, l1=l1, l2=l2)
    for i in range(x.shape[0]):
        if not np.any(weights[i] > 0):
            w[i] = 0.0  # Explicit minimum-norm convention for an unsupported row.
            continue
        gram, cross = local_weighted_cache(x[i], h, weights[i])
        coordinate_sweeps(w[i:i+1], gram, cross[None, :], sweeps, l1, l2)
    return w


def penalized_block_gradient(w, gram, cross, l1, l2):
    with np.errstate(over="ignore", invalid="ignore"):
        gradient = w @ gram - cross + l1 + l2 * w
    return require_finite(gradient, "Penalized block gradient")


def block_stationarity(x, w, h, weights, l1=0.0, l2=0.0):
    if weights is None:
        gram, cross = block_cache(x, h)
        return stable_norm(projected_gradient(w, penalized_block_gradient(w, gram, cross, l1, l2)))
    total = 0.0
    for i in range(x.shape[0]):
        gram, cross = local_weighted_cache(x[i], h, weights[i])
        gradient = penalized_block_gradient(w[i:i+1], gram, cross[None, :], l1, l2)
        total = np.hypot(total, stable_norm(projected_gradient(w[i:i+1], gradient)))
    return float(require_finite(total, "Weighted block stationarity"))


def joint_stationarity(x, w, h, weights, penalties):
    left = block_stationarity(x, w, h, weights, penalties.w_l1, penalties.w_l2)
    transposed = None if weights is None else weights.T
    right = block_stationarity(x.T, h.T, w.T, transposed, penalties.h_l1, penalties.h_l2)
    return float(require_finite(np.hypot(left, right), "Joint penalized stationarity"))


def factor_penalty(factor, l1, l2):
    with np.errstate(over="ignore", invalid="ignore"):
        linear = l1 * np.sum(factor) if l1 > 0 else 0.0
        square = .5 * l2 * np.sum(factor * factor) if l2 > 0 else 0.0
        total = linear + square
    return float(require_finite(total, "Factor penalty"))


def objective_terms(x, w, h, penalties, weights=None, block_rows=256):
    data = (frobenius_metrics(x, w, h, block_rows).half_square if weights is None
            else masked_data_cost(x, w, h, weights))
    wp = factor_penalty(w, penalties.w_l1, penalties.w_l2)
    hp = factor_penalty(h, penalties.h_l1, penalties.h_l2)
    total = float(require_finite(data + wp + hp, "Total objective"))
    return {"data": data, "w_penalty": wp, "h_penalty": hp, "total": total}


def masked_data_cost(x, w, h, weights):
    """Already validated arrays: accumulate only included cells, without mask copies."""
    total = 0.0
    for i in range(x.shape[0]):
        included = weights[i] > 0
        if not np.any(included):
            continue
        residual = x[i, included] - reconstruction(w[i:i+1], h[:, included])[0]
        with np.errstate(over="ignore", invalid="ignore"):
            scaled = residual * np.sqrt(weights[i, included])
            total += float(np.sum(scaled * scaled)) / 2
        require_finite(total, "Included weighted squared error")
    return total


def weighted_quality(x, w, h, weights):
    """Weighted MSE has denominator sum(weights); all-missing quality is undefined."""
    weights = observation_weights(weights, x.shape)
    if weights is None:
        raise ValueError("Supply explicit weights for weighted quality")
    with np.errstate(over="ignore"):
        denominator = float(np.sum(weights))
    require_finite(denominator, "Total observation weight")
    if denominator == 0:
        return None
    return float(require_finite(2 * masked_data_cost(x, w, h, weights) / denominator, "Weighted MSE"))


def encode_weighted(values, dictionary, *, weights=None, l1=0.0, l2=0.0,
                    max_iter=1000, tol=1e-7, sweeps=1, initial=None):
    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    mask = observation_weights(weights, x.shape)
    l1, l2 = nonnegative_scalar(l1, "l1"), nonnegative_scalar(l2, "l2")
    cap, sweeps = positive_integer(max_iter, "max_iter"), positive_integer(sweeps, "sweeps")
    tol = nonnegative_scalar(tol, "tol")
    shape = (x.shape[0], h.shape[0])
    w = np.zeros(shape) if initial is None else nonnegative_table(initial, h.shape[0])
    if w.shape != shape:
        raise ValueError("Initial amounts must match query rows and dictionary components")
    if x.shape[0] == 0:
        return w, {"status": "empty-query", "iterations": 0, "projected_gradient": 0.0}
    if mask is not None:
        w[~np.any(mask > 0, axis=1)] = 0.0
    iterations, current, complete = 0, 0.0, True
    # Unweighted rows share one Gram/cross cache; weighted rows retain one cache
    # for all their inner sweeps, then release it before moving to the next row.
    groups = [(w, *block_cache(x, h))] if mask is None else (
        (w[i:i+1], *local_weighted_cache(x[i], h, mask[i])) for i in range(x.shape[0])
    )
    for amounts, gram, cross in groups:
        cross = cross[None, :] if cross.ndim == 1 else cross
        gradient = penalized_block_gradient(amounts, gram, cross, l1, l2)
        row_norm = stable_norm(projected_gradient(amounts, gradient))
        threshold, count = stopping_threshold(tol, row_norm), 0
        for _ in range(cap):
            if row_norm <= threshold:
                break
            coordinate_sweeps(amounts, gram, cross, sweeps, l1, l2)
            count += 1
            gradient = penalized_block_gradient(amounts, gram, cross, l1, l2)
            row_norm = stable_norm(projected_gradient(amounts, gradient))
        complete = complete and row_norm <= threshold
        iterations, current = max(iterations, count), float(np.hypot(current, row_norm))
    require_finite(current, "Query stationarity")
    status = "stationary-tolerance" if complete else "iteration-cap"
    return w, {"status": status, "iterations": iterations, "projected_gradient": current}


def weighted_nnls_reference(values, dictionary, weights, *, l2=0.0, max_iter=1000):
    """Public NNLS reference for fixed H and optional L2; no fictitious L1 API."""
    from scipy.optimize import nnls

    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    mask = observation_weights(weights, x.shape)
    if mask is None:
        raise ValueError("Supply explicit observation weights")
    l2, cap = nonnegative_scalar(l2, "l2"), positive_integer(max_iter, "max_iter")
    w = np.zeros((x.shape[0], h.shape[0]))
    for i in range(x.shape[0]):
        included = mask[i] > 0
        if not np.any(included):
            continue
        roots = np.sqrt(mask[i, included])
        with np.errstate(over="ignore", invalid="ignore"):
            design, target = h[:, included].T * roots[:, None], x[i, included] * roots
        require_finite(design, "NNLS weighted design")
        require_finite(target, "NNLS weighted target")
        if l2 > 0:
            design = np.vstack((design, np.sqrt(l2) * np.eye(h.shape[0])))
            target = np.concatenate((target, np.zeros(h.shape[0])))
        w[i], _ = nnls(design, target, maxiter=cap)
    return require_finite(w, "NNLS amounts")


@dataclass(frozen=True)
class WeightedState:
    h: np.ndarray
    features: tuple
    penalties: Penalties
    observed_columns: tuple
    max_iter: int
    tol: float
    sweeps: int
    diagnostics: tuple
    status: str


class PenalizedMaskedNMF:
    def __init__(self, n_components, *, alpha_w=0.0, alpha_h=0.0, l1_ratio=0.0,
                 max_iter=1000, tol=1e-7, sweeps=1, random_state=0, block_rows=256):
        self.n_components, self.alpha_w, self.alpha_h = n_components, alpha_w, alpha_h
        self.l1_ratio, self.max_iter, self.tol, self.sweeps = l1_ratio, max_iter, tol, sweeps
        self.random_state, self.block_rows, self._state = random_state, block_rows, None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit a dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().h.copy()

    @property
    def diagnostics_(self):
        return self._fitted().diagnostics

    @property
    def observed_columns_(self):
        return self._fitted().observed_columns

    @property
    def status_(self):
        return self._fitted().status

    def fit_transform(self, values, *, weights=None, features=None, initial_w=None, initial_h=None):
        x = nonnegative_table(values, require_rows=True)
        mask = observation_weights(weights, x.shape)
        k = positive_integer(self.n_components, "n_components")
        cap, sweeps = positive_integer(self.max_iter, "max_iter"), positive_integer(self.sweeps, "sweeps")
        block_rows, tol = positive_integer(self.block_rows, "block_rows"), nonnegative_scalar(self.tol, "tol")
        names = feature_ids(features, x.shape[1])
        penalties = penalty_coefficients(self.alpha_w, self.alpha_h, self.l1_ratio, *x.shape)
        rng = np.random.default_rng(self.random_state)
        w = rng.uniform(.1, 1., (x.shape[0], k)) if initial_w is None else nonnegative_table(initial_w, k)
        h = rng.uniform(.1, 1., (k, x.shape[1])) if initial_h is None else nonnegative_table(initial_h, x.shape[1])
        factor_shapes(x, w, h)
        if w.shape[1] != k:
            raise ValueError("Initial factors must match n_components")
        observed = np.ones(x.shape[1], dtype=bool) if mask is None else np.any(mask > 0, axis=0)
        if mask is not None:
            w[~np.any(mask > 0, axis=1)] = 0.0
            h[:, ~observed] = 0.0
        current = joint_stationarity(x, w, h, mask, penalties)
        threshold = stopping_threshold(tol, current)
        terms = objective_terms(x, w, h, penalties, mask, block_rows)
        history = [(0, terms['data'], terms['w_penalty'], terms['h_penalty'], terms['total'], current)]
        for iteration in range(1, cap + 1):
            if current <= threshold:
                break
            weighted_coordinate_block(x, w, h, mask, sweeps, penalties.w_l1, penalties.w_l2)
            weighted_coordinate_block(x.T, h.T, w.T, None if mask is None else mask.T,
                                      sweeps, penalties.h_l1, penalties.h_l2)
            current = joint_stationarity(x, w, h, mask, penalties)
            terms = objective_terms(x, w, h, penalties, mask, block_rows)
            history.append((iteration, terms['data'], terms['w_penalty'], terms['h_penalty'], terms['total'], current))
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        candidate = WeightedState(read_only(h), names, penalties, tuple(map(bool, observed)),
                                  cap, tol, sweeps, tuple(history), status)
        self._state = candidate  # Only publication point: failed candidate preserves old state.
        return w.copy()

    def transform(self, values, *, weights=None, features=None, initial=None, return_diagnostics=False):
        state = self._fitted()
        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:
            raise ValueError("Query feature order differs from the fitted dictionary")
        result = encode_weighted(values, state.h, weights=weights, l1=state.penalties.w_l1,
                                 l2=state.penalties.w_l2, max_iter=state.max_iter,
                                 tol=state.tol, sweeps=state.sweeps, initial=initial)
        return result if return_diagnostics else result[0]

    def inverse_transform(self, values):
        state = self._fitted()
        return reconstruction(nonnegative_table(values, state.h.shape[0]), state.h)


def main():
    from sklearn.decomposition import NMF

    x = np.array([[2., 1., 3.], [1., 3., 4.], [.5, 2., 2.5]])
    w0, h0 = np.ones((3, 2)), np.array([[1., 0., 1.], [0., 1., 1.]])
    scratch = PenalizedMaskedNMF(2, alpha_w=.03, alpha_h=.04, l1_ratio=.4, max_iter=500, tol=1e-8)
    w = scratch.fit_transform(x, initial_w=w0, initial_h=h0)
    penalties = penalty_coefficients(.03, .04, .4, *x.shape)
    print("penalized_scratch", scratch.status_, scratch.diagnostics_[-1])
    ordinary = NMF(n_components=2, init='custom', solver='cd', beta_loss='frobenius',
                   alpha_W=.03, alpha_H=.04, l1_ratio=.4, max_iter=500, tol=1e-8,
                   shuffle=False, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
    print("penalized_ordinary_terms", objective_terms(x, ordinary_w, ordinary.components_, penalties))
    weights = np.array([[1., 1., 0.], [1., .5, 1.], [0., 0., 0.]])
    masked = PenalizedMaskedNMF(2, alpha_w=.01, alpha_h=.02, l1_ratio=0, max_iter=500, tol=1e-8)
    masked_w = masked.fit_transform(x, weights=weights, initial_w=w0, initial_h=h0)
    print("masked_fit", masked.status_, masked.diagnostics_[-1], "unsupported_row", masked_w[2].tolist())
    query, query_weights = x[:1], np.array([[1., 0., .25]])
    amounts, diagnostic = encode_weighted(query, h0, weights=query_weights, l2=.2, tol=1e-10)
    reference = weighted_nnls_reference(query, h0, query_weights, l2=.2)
    print("weighted_l2_amounts", amounts.tolist(), "nnls", reference.tolist(), diagnostic)
    print("missing_quality", weighted_quality(x[2:3], masked_w[2:3], masked.components_, weights[2:3]))
    old_h = masked.components_
    masked.n_components = 1
    try:
        masked.fit_transform([[-1., 0., 1.]])
    except ValueError as error:
        print("rejected_fit", type(error).__name__, "old_dictionary_equal", np.array_equal(old_h, masked.components_))
    print("empty_query_shape", masked.transform(np.empty((0, 3))).shape)


if __name__ == '__main__':
    main()
```


`PenalizedMaskedNMF.fit_transform` alternates W first and H with that new W. It records data cost, both penalty costs, their total and the joint projected-gradient diagnostic at each outer sweep. Supported zero-curvature coordinates retain the earlier exact convention; finite-arithmetic failures refuse the candidate. The fitted snapshot includes the dictionary, feature order, actual penalty coefficients, supported-column flags, stopping settings and diagnostics. Publication occurs once after the complete candidate succeeds. `transform` uses that snapshot even if the object's next-fit configuration later changes; `inverse_transform` reconstructs from the same stored dictionary. Returned dictionary arrays are copies.

All data and mask values supplied to this dense route must be finite. Put a finite placeholder, such as zero, in an unmeasured data cell and set its weight to zero; the algorithm uses the separate mask to exclude it. It does not infer missingness from a zero value or silently accept NaN. Weighted cache and residual operations compute included cells only, so a huge finite excluded value cannot contaminate a product that should never have been formed. The residual sum follows N1's included-cell arithmetic but operates on the already validated arrays, avoiding a new full-mask copy at every diagnostic. Actual included products and reductions must still fit finite float64 arithmetic. Negative weights lose the nonnegative squared-error interpretation and no longer guarantee a convex fixed block, so they are refused.

For a fixed-H weighted query, each row stops relative to its own initial projected-gradient norm; the reported iteration count is the largest row count and the reported norm combines final row norms. If every row meets its relative target, their combined norm also meets the corresponding combined relative bound. A cap in any row reports `iteration-cap`. The joint fitter instead uses its initial joint norm as the baseline. These explicitly stated diagnostics establish approximate first-order stationarity within the supported problem; the joint nonconvex fit still needs the interpretation and validation developed earlier.

**Deeper: costs and memory.** A dense weighted-cache construction costs `O(dk²+dk)` per row, hence `O(ndk²+ndk)` for an amount block; the transposed pattern block has the same leading cost. Once caches are built, q coordinate sweeps cost `O(qnk²)` and `O(qdk²)` across their respective orientations. Stationarity diagnostics form their own streamed caches and add another bounded traversal. The code retains the input and mask, factors and history; temporary weighted workspace is `O(k²+max(kd,kn))` when the two orientations run sequentially. Keeping one query row's cache across all its inner sweeps avoids rebuilding it on every iteration. For unweighted blocks the shared Gram route is cheaper and the code reuses it. These bounds describe this dense reference, not a timing result or a claim to be optimal for every sparse pattern and hardware layout.

The public comparisons deliberately cover two different contracts. For an **unmasked penalized fit**, public `NMF(solver='cd', init='custom', alpha_W=..., alpha_H=..., l1_ratio=..., shuffle=False)` accepts copies of the same starting factors. The [NMF objective documentation](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html) specifies the axis scaling used above. The code recomputes the full objective; `reconstruction_err_` alone would omit penalties. Stopping conventions can differ, so similar objective values are evidence about this configured comparison, not bitwise identity of fitted factors.

For a **fixed-H masked row with no L1 penalty**, the public [SciPy NNLS route](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html) solves the square-root-weighted A,b problem. Adding L2 cost `0.5λ₂||w||²` appends `sqrt(λ₂)I` to A and zeros to b. Expanding that augmented squared norm yields exactly the data cost plus L2 penalty. The returned NNLS residual norm includes this augmentation and is not by itself the original observed-data MSE. L1 adds a linear term and is handled by the explained coordinate route; we do not invent an L1 keyword for NNLS. The ordinary NMF estimator has no arbitrary cell-mask fitting parameter, so the full masked joint fit remains our explicit implementation.

The new main uses a changed constructed table `[[2,1,3],[1,3,4],[0.5,2,2.5]]` to demonstrate these contracts independently of the later real-data study. With αW=0.03, αH=0.04 and r=0.4, the scratch fit reached its stationarity tolerance after 385 updates: data cost about 0.00900556 and total objective about **1.01580058**. The configured ordinary fit's recomputed total is also about **1.01580058**, with its separate penalty terms printed. Keeping those terms separate shows why the small residual alone is not the complete optimized quantity.

The masked demonstration gives the third row no observations and uses a fractional 0.5 weight in the second row. With its stated squared penalties, it reaches tolerance after 270 updates, total about **0.29581822**, and third-row amounts `[0,0]`. The separate fixed-H query uses weights `[1,0,0.25]` and λ₂=0.2. Its scratch amounts are approximately `[1.779661017,0.677966102]`; public augmented NNLS gives `[1.779661017,0.677966102]` at the displayed precision. The all-missing quality prints `None`. Finally, a deliberately rejected negative-data fit leaves the earlier dictionary intact, and an empty query still returns shape `(0,2)` after next-fit rank was changed to 1. These are distinct numerical, missing-information and state contracts worth checking whenever you adapt the method.

The complete retained stdout of the penalized/masked demonstration is shown below. This execution preceded the later loss-only correction that streams the same included-cell residual calculation without copying the full mask at each diagnostic. The current source above includes that correction; its affected arithmetic/invariance checks are separate evidence, and this historical stream is not a claimed new execution of the changed full main. The two penalized totals, unsupported row, weighted query, undefined missing quality and preserved fitted state retain their original roles.

```text
penalized_scratch stationary-tolerance (385, 0.00900556233913971, 0.494261430283635, 0.5125335893635355, 1.0158005819863103, 7.801299787459352e-08)
penalized_ordinary_terms {'data': 0.009005563166919542, 'w_penalty': 0.49426140215089437, 'h_penalty': 0.5125336166684864, 'total': 1.0158005819863003}
masked_fit stationary-tolerance (270, 0.002098482690384905, 0.1468598629035188, 0.14685987368315342, 0.2958182192770571, 4.7228974924398485e-08) unsupported_row [0.0, 0.0]
weighted_l2_amounts [[1.7796610170284894, 0.6779661016508391]] nnls [[1.7796610169491525, 0.677966101694915]] {'status': 'stationary-tolerance', 'iterations': 10, 'projected_gradient': 1.0401918215663756e-10}
missing_quality None
rejected_fit ValueError old_dictionary_equal True
empty_query_shape (0, 2)
```

For a changed-input exercise, keep the single pattern `[1,1]` and row `[2,0]`. First derive the amount with weights `[1,1]`, then with `[1,0]`, then add λ₂=1 to the masked problem. The three answers are 1, 2 and 1 respectively: the final cost is `0.5(2-w)²+0.5w²`. Explain why changing the omitted cell's finite placeholder cannot change the last two answers. Next rescale only C0 of the exact three-row example by s=2 and recompute the two L1 masses; the residual stays zero but the total penalty is 5.85. A correct implementation must reproduce both the information distinction and the changed objective, not just the shape of the output arrays.

We can now choose and inspect a factor-size preference, fit only actual measurements and keep unsupported quantities visibly separate from evidence. The next section returns to real digit measurements: we will inspect the stored dictionary and its contributions before deciding what its patterns mean.

## 12. Inspect an actual digit dictionary and contribution

How do the three-bin calculations look when each observation is a small image? The arithmetic is unchanged; the bins now have positions on a page.

<!-- figure:D42 -->

Read one small square as one measured feature. These handwritten-digit observations have eight rows and eight columns, hence 64 features. Code stores them in row order: feature `j = 8*row + column`, with both coordinates starting at zero. Feature F35 is therefore row 4, column 3. The original measurement is a count from 0 to 16, formed by counting marked pixels in a corresponding block of the original larger binary image. Dividing by the fixed number 16 gives the intensity units used here. This is a known measurement ruler, not a maximum learned from all the images.

The eight maps above are the eight rows of one **recorded dictionary**, H. C1 is the first dictionary row, C8 the eighth; these display names correspond to code indices 0 and 7. The colours preserve component identity. Each cell of a map says how much that feature receives from **one unit of that component's amount**. A bright patch is a numerical pattern, not a verified pen stroke, a class label or a probability. Some patterns look stroke-like, but resemblance alone does not identify a physical cause.

All eight maps use the same 0–4 ruler. They are not independently stretched to look equally bright. The largest dictionary entry is about 1.389324, so a pattern can exceed the measured image's 0–1 range: its units are intensity **per unit amount**, and its amount need not be one. Keeping the shared ruler makes comparisons honest, even when a component looks faint.

This dictionary was fitted earlier with eight components, seed 19, random initialization and coordinate descent. The 180 fitting images determined H. The 60 reserved images shown here were subsequently encoded with that dictionary fixed. We are now reading the recorded arrays, not training a new model. Section 13 explains why this inspection model is different from the model preferred by the recorded validation comparison. For now, ask the local question: what does one saved amount contribute to one image?

### Follow one amount all the way to the image

Which pixels move when one amount changes? Follow a single component through the sum, with every other amount held still.

<!-- figure:D43 -->

Start at **source row 242**, whose observed digit label is 8. The label helps us describe the observation; it is not an input column used to fit the dictionary. Its C1 amount is approximately 0.176453. The first image is the raw C1 pattern H[C1]. Multiplying each of its 64 cells by 0.176453 makes the second image, the **C1 contribution**. The full reconstruction adds that image to seven other component contributions. The final image is the signed residual, observed minus reconstructed, on a separate ruler: a positive residual means the reconstruction is too faint at that cell; a negative residual means it is too bright.

The gain control multiplies only the selected saved amount. At gain 1, it shows the recorded reconstruction. At gain 0, it subtracts precisely the selected contribution. At gain 2, it adds one more copy. It does not refit H, optimize the other amounts or redraw a different observation. Use the source selector to compare row 242 with row 256, while C1 continues to mean the same dictionary pattern.

For source row i, selected component c and gain g, the local change is

\[
 p_{ic}=W_{ic}H_{c,:},\qquad
 \widehat x_i(g)=\widehat x_i(1)+(g-1)p_{ic},\qquad
 r_i(g)=x_i-\widehat x_i(g).
\]

Here p is an entire 64-feature image, not a scalar importance score. Its entries are nonnegative. Increasing g can therefore only increase or preserve each predicted pixel. A residual may move toward zero at one pixel and away from zero at another; inspect both the residual picture and the total error.

There is a useful null case. Select row 242 and C8. Its saved C8 amount is exactly zero, so its contribution is a completely zero image. Moving gain changes nothing. That is an honest absence of this component from this saved encoding, not a broken control. It does not prove the raw C8 pattern is useless for every observation; row 256 uses it substantially.

The 0–4 ruler covers every reconstruction reachable by these two source rows, eight selected components and gains from 0 to 2. Their largest reachable value is about 2.021612. Signed residuals use −4 to 4. Predictions are never clipped to the observed 0–1 range. Clipping would change the model's output and hide overshoots.

### Distinguish a large amount from a large contribution

Which component contributes most to row 256? Compare two different questions with two different units.

<!-- figure:D44 -->

The first row of bars shows the eight raw amounts W[256,c]. C7 is largest, at about 0.688493, followed by C8 at 0.628002. But one unit of C8 spreads more total intensity across its pattern. The second row multiplies each amount by its pattern's sum. C8 now contributes about 6.894594 intensity units, ahead of C7's 6.383307. The first chart answers “how many of this pattern's chosen units?”; the second answers “how much predicted intensity over the whole image?” They are not interchangeable.

| Component | Saved amount | Total contribution over 64 pixels |
|---|---:|---:|
| C1 | 0.2321911099210713 | 2.1512220831262505 |
| C2 | 0.011934602685408047 | 0.09375622389611028 |
| C3 | 0.3424206826975729 | 3.8695912467273876 |
| C4 | 0 | 0 |
| C5 | 0.12081544616148039 | 1.2914123266438298 |
| C6 | 0 | 0 |
| C7 | 0.6884925427238711 | 6.383307297328288 |
| C8 | 0.628002130601251 | 6.8945940980317655 |

Formally, let s_c = sum_j H_cj be a pattern's total mass. Its total contribution to row i is W_ic s_c. This total is unchanged by the compensating rescaling in **Amount is not probability or identity**, section 2: multiplying H_c by a positive number and dividing W_ic by the same number leaves both the contribution image and its sum unchanged. A raw amount has no such invariance. In these 60 saved encodings, largest amount and largest total contribution disagree on 16 rows. That describes this saved inspection, not a universal frequency or a claim about which digit is recognized.

Total contribution still is not an all-purpose definition of importance. It sums intensity, so a broad diffuse pattern can contribute a large total without uniquely explaining a distinctive feature. Error increase under a specific edit, downstream task performance and external meaning answer different questions. Name the question before choosing the score.

### Remove one contribution without pretending to refit

What happens when we remove C8 from row 256? This time keep the source and component fixed so the only moving idea is the removal fraction.

<!-- figure:D45 -->

At fraction 0, the current reconstruction is the saved sum. At fraction 1, the full C8 contribution has been removed; every other component retains its saved amount. The observed image never changes. The removed-addend image shows exactly what has been subtracted, and the residual shows where that subtraction helps or hurts. Mean squared error rises from about 0.02758816 to 0.07326254. This is a controlled numerical edit of a representation. It is not evidence that a real-world intervention could remove a biological or physical source in the same way.

Why can some pixels improve while the total gets worse? Let p be the C8 contribution, e = x − x̂ the original residual, and r the removal fraction. The edited prediction is x̂ − rp; its residual is e + rp. Expanding the square gives

\[
 \operatorname{MSE}(r)-\operatorname{MSE}(0)
 =\frac{2r\langle e,p\rangle+r^2\|p\|^2}{64}.
\]

Individual terms can have either sign because e is signed. Their sum is the relevant quantity for squared-error fitting. If the original amounts were an **exact fixed-dictionary NNLS optimum**, removal is another feasible nonnegative amount vector and cannot lower total loss. For a positive coordinate at an exact optimum, its gradient is zero, giving ⟨e,p⟩ = 0; removing that nonzero contribution then adds r²||p||²/64. A zero amount has p = 0 and changes nothing. A finite-tolerance saved fit need not satisfy these equalities exactly; the reported numerical change is what this recorded example actually does. Do not turn a solver tolerance into an exact theorem about every saved row.

### Implement contributions, normalization and correspondence

How can we inspect factors without manufacturing a huge array of every row–component–pixel contribution? Calculate only the output needed for the question.

The complete source below imports the validation and matrix multiplication helpers already explained in **Fit both factors and decide when to stop**, section 6. `row_contribution` makes only one feature vector. `contribution_totals` uses the dictionary row sums and makes an n×k table, not an n×k×d tensor. `change_component_gain` copies one amount row, edits one entry and reconstructs it.

`normalize_patterns` makes each positive pattern sum to one and multiplies the corresponding amount column by its old sum. The product is preserved. An all-zero pattern has no direction or positive mass to normalize; the function labels it unusable and returns zero normalized pattern and zero compensated amount. This changes an arbitrary coefficient of an unused pattern without changing a single reconstructed pixel.

When comparing two fits, normalize positive pattern rows before matching their shapes. `align_patterns` computes pairwise squared distances, then asks the public SciPy `linear_sum_assignment` routine for a minimum-total-cost one-to-one assignment. Rectangular dictionaries leave some usable patterns unmatched. Unused zero patterns are reported separately. This is a display correspondence, not a proof that the fits are identical or that either recovered a true source.

There can be multiple best matchings even without duplicate patterns. To detect that global ambiguity in a small display, the optional audit forbids each chosen edge in turn and solves again. Any distinct matching must omit at least one chosen edge, so this covers alternatives within the declared numerical tolerance. The report says **no alternative within tolerance**, not “mathematically unique.” Above the explicit size limit it says **not audited** rather than pretending the ambiguity check ran.

For similarly sized k-component dictionaries, cost construction takes O(k²d) arithmetic and O(k²) retained costs, plus the normalized factors. One dense assignment has a conventional O(k³) bound. The optional global audit can make k further assignments, raising the conservative bound to O(k⁴); it is deliberately capped for small displays. The implementation builds one row of costs at a time, avoiding a k×k×d difference tensor. For already validated factors, reconstructing one row takes O(kd), while multiplying one selected amount by its length-d pattern takes O(d) arithmetic and O(d) output. The delivered row_contribution wrapper first validates the whole k×d dictionary and the k-entry amount row through nonnegative_table and real_table: that copies/scans O(kd+k) input cells. Its end-to-end time is therefore O(kd+k), with O(kd+k+d) temporary/output storage, rather than O(d). This safety cost avoids trusting caller state; an internal validated kernel can reuse validated factors without those copies. Requested all-row reconstruction takes O(nkd) arithmetic, and its n×d output is itself a storage cost. These are operation bounds for this route, not a claim of universal fastest execution.

Save the source as `nmf_factor_alignment.py` beside the earlier `nmf_arrays.py` helper.


```python
"""Invariant contributions, unit-mass patterns and explicit alignment ambiguity."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import linear_sum_assignment

from nmf_arrays import nonnegative_scalar, nonnegative_table, reconstruction, require_finite


def matching_factors(amounts, dictionary):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table(amounts, h.shape[0])
    return w, h


def component_index(value, count):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)):
        raise ValueError("Component index must be an integer")
    value = int(value)
    if value < 0 or value >= count:
        raise ValueError("Component index is outside this dictionary")
    return value


def normalize_patterns(amounts, dictionary):
    """Compensate W columns while normalizing positive H row sums; zero is unused."""
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        masses = h.sum(axis=1)
    require_finite(masses, "Pattern masses")
    usable = masses > 0
    normalized = np.zeros_like(h)
    normalized[usable] = h[usable] / masses[usable, None]
    with np.errstate(over='ignore', invalid='ignore'):
        compensated = w * masses
    require_finite(compensated, "Compensated amounts")
    return compensated, normalized, masses, usable


def contribution_totals(amounts, dictionary):
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        result = w * h.sum(axis=1)
    return require_finite(result, "Component contribution totals")


def row_contribution(amount_row, dictionary, component):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    with np.errstate(over='ignore', invalid='ignore'):
        result = w[0, c] * h[c]
    return require_finite(result, "Selected contribution")


def change_component_gain(amount_row, dictionary, component, gain):
    """Change only one saved amount; no fit or re-encoding occurs."""
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    gain = nonnegative_scalar(gain, "gain")
    with np.errstate(over='ignore', invalid='ignore'):
        w[0, c] *= gain
    require_finite(w, "Edited amounts")
    return reconstruction(w, h)[0]


@dataclass(frozen=True)
class Alignment:
    pairs: tuple
    cost: float
    unmatched_left: tuple
    unmatched_right: tuple
    unused_left: tuple
    unused_right: tuple
    ambiguity: str
    alternative_pairs: tuple


def align_patterns(left, right, *, audit_ambiguity=True, tolerance=1e-12, audit_limit=64):
    """Display correspondence of positive unit-mass rows, not source recovery.

    Core matching is one assignment. Optional bounded global-tie audit adds at
    most min(k_left,k_right) assignments by forbidding each selected edge.
    """
    a = nonnegative_table(left, require_rows=True)
    b = nonnegative_table(right, a.shape[1], require_rows=True)
    tolerance = nonnegative_scalar(tolerance, "tolerance")
    if not isinstance(audit_ambiguity, (bool, np.bool_)):
        raise ValueError("audit_ambiguity must be boolean")
    if isinstance(audit_limit, (bool, np.bool_)) or not isinstance(audit_limit, (int, np.integer)) or audit_limit < 1:
        raise ValueError("audit_limit must be a positive integer")
    with np.errstate(over='ignore', invalid='ignore'):
        ma, mb = a.sum(axis=1), b.sum(axis=1)
    require_finite(ma, "Left pattern masses")
    require_finite(mb, "Right pattern masses")
    ia, ib = np.flatnonzero(ma > 0), np.flatnonzero(mb > 0)
    unused_a, unused_b = tuple(np.flatnonzero(ma == 0).tolist()), tuple(np.flatnonzero(mb == 0).tolist())
    if len(ia) == 0 or len(ib) == 0:
        return Alignment((), 0.0, tuple(ia.tolist()), tuple(ib.tolist()), unused_a, unused_b,
                         'no-usable-pair', ())
    aa, bb = a[ia] / ma[ia, None], b[ib] / mb[ib, None]
    costs = np.empty((len(ia), len(ib)))
    for i, row in enumerate(aa):
        # Avoid a k_left*k_right*d difference tensor.
        costs[i] = np.sum((bb - row) ** 2, axis=1)
    require_finite(costs, "Alignment costs")
    rows, columns = linear_sum_assignment(costs)
    total = float(costs[rows, columns].sum())
    threshold = tolerance * max(1.0, abs(total))
    require_finite(threshold, "Alignment tolerance")
    pairs = tuple((int(ia[r]), int(ib[c])) for r, c in zip(rows, columns))
    status, alternative = 'not-audited', ()
    if audit_ambiguity and max(costs.shape) <= audit_limit:
        status = 'no-alternative-within-tolerance'
        for row, column in zip(rows, columns):
            forbidden = costs.copy()
            forbidden[row, column] = np.inf
            try:
                other_rows, other_columns = linear_sum_assignment(forbidden)
            except ValueError:  # This forbidden edge made a full-size matching infeasible.
                continue
            other_total = float(costs[other_rows, other_columns].sum())
            if other_total <= total + threshold:
                status = 'alternative-within-tolerance'
                alternative = tuple((int(ia[r]), int(ib[c])) for r, c in zip(other_rows, other_columns))
                break
    elif audit_ambiguity:
        status = 'not-audited-over-limit'
    return Alignment(pairs, total, tuple(sorted(set(ia.tolist()) - set(ia[rows].tolist()))),
                     tuple(sorted(set(ib.tolist()) - set(ib[columns].tolist()))),
                     unused_a, unused_b, status, alternative)


def main():
    h = np.array([[1.,0.,1.], [0.,1.,1.], [0.,0.,0.]])
    w = np.array([[2.,1.,7.], [1.,3.,2.]])
    compensated, normalized, masses, usable = normalize_patterns(w,h)
    print('masses',masses.tolist(),'usable',usable.tolist())
    print('normalized',normalized.tolist(),'compensated',compensated.tolist())
    print('reconstruction_preserved',np.allclose(reconstruction(w,h),reconstruction(compensated,normalized)))
    right = np.array([[0.,3.,3.], [2.,0.,2.], [0.,0.,0.]])
    print('permuted_rescaled_alignment',align_patterns(h,right))
    duplicate = np.array([[1.,0.], [1.,0.]])
    print('duplicate_ambiguity',align_patterns(duplicate,duplicate))
    print('contributions',contribution_totals(w,h).tolist())
    print('C0_removed',change_component_gain(w[0],h,0,0).tolist())


if __name__ == '__main__':
    main()
```


The following output comes from this program's small constructed example. Its zero third pattern is deliberately included to show the unused-pattern rule; it is separate from the eight-component digit inspection.


```text
masses [2.0, 2.0, 0.0] usable [True, True, False]
normalized [[0.5, 0.0, 0.5], [0.0, 0.5, 0.5], [0.0, 0.0, 0.0]] compensated [[4.0, 2.0, 0.0], [2.0, 6.0, 0.0]]
reconstruction_preserved True
permuted_rescaled_alignment Alignment(pairs=((0, 1), (1, 0)), cost=0.0, unmatched_left=(), unmatched_right=(), unused_left=(2,), unused_right=(2,), ambiguity='no-alternative-within-tolerance', alternative_pairs=())
duplicate_ambiguity Alignment(pairs=((0, 0), (1, 1)), cost=0.0, unmatched_left=(), unmatched_right=(), unused_left=(), unused_right=(), ambiguity='alternative-within-tolerance', alternative_pairs=((0, 1), (1, 0)))
contributions [[4.0, 2.0, 0.0], [2.0, 6.0, 0.0]]
C0_removed [0.0, 1.0, 1.0]
```


Read `pairs=((0,1),(1,0))` as original pattern 0 matching the other dictionary's pattern 1 and vice versa. The cost is zero because only scale and order changed. The duplicated two-pattern example has a genuine alternative correspondence. Neither matching changes the reconstruction or supplies a physical identity.

### Read the recorded images reproducibly

How do we preserve the exact dictionary behind the pictures? Read a complete saved state and its attributed measurement file, and refuse a mismatched or missing input.

The next program needs four local siblings: `nmf_arrays.py`, `nmf_factor_alignment.py`, the complete `nmf_saved_state.json`, and `digits-300.csv`. Keep `digits-data-provenance.md` with them for source, license, selection and units. The shared file index contains each of these. With NumPy and SciPy available, run `python nmf_saved_digits.py`. This reader needs no scikit-learn import, network request or new fit. The saved model was produced using the separately recorded environment and fitting program; reading it in a new environment does not create a new training result.

`verified_bytes` binds the two inputs to the exact example. `load_saved_digits` checks the fixed scale, model, feature order and shapes, then matches every reserved observation by its source ID, label and 64 raw measurements. Source ID is an address, not an array position. The saved H, W and observed arrays are read-only and the source-ID lookup cannot be edited through its mapping interface. The metadata dictionary is descriptive ordinary Python data; it is not advertised as recursively immutable.

`describe_saved_row` uses the same contribution functions as the pictures. It returns the observation, selected addend, reconstruction, signed residual, controlled changed reconstruction and both MSEs. The original saved amounts are not overwritten. Missing files raise a clear file error, and a changed hash raises an identity error. There is deliberately no fallback that silently trains a different model while displaying these recorded claims.

Save the source as `nmf_saved_digits.py` beside those inputs.


```python
"""Offline inspection of the recorded digit factors; never fits a missing model."""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
from types import MappingProxyType
import numpy as np

from nmf_arrays import nonnegative_table, read_only, reconstruction, require_finite
from nmf_factor_alignment import change_component_gain, contribution_totals, row_contribution

SAVED_SHA256 = '46f3dc0931e3ccddc30cc3e30bbb4d3f330bc35a4dccccef33f74a63472eddd0'
CSV_SHA256 = 'd93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e'


def verified_bytes(path, expected):
    value = Path(path).read_bytes()  # Missing payload is an error, never a fallback fit.
    if hashlib.sha256(value).hexdigest() != expected:
        raise ValueError(f"Recorded input identity differs: {Path(path).name}")
    return value


@dataclass(frozen=True)
class SavedDigits:
    dictionary: np.ndarray
    amounts: np.ndarray
    observations: np.ndarray
    source_rows: tuple
    labels: tuple
    row_lookup: object
    metadata: dict


def load_saved_digits(directory=None):
    directory = Path(__file__).resolve().parent if directory is None else Path(directory)
    saved_bytes = verified_bytes(directory/'nmf_saved_state.json', SAVED_SHA256)
    csv_bytes = verified_bytes(directory/'digits-300.csv', CSV_SHA256)
    saved = json.loads(saved_bytes)
    if saved['scale'] != 16 or saved['side'] != 8 or saved['fit']['k'] != 8 or saved['fit']['seed'] != 19:
        raise ValueError("Expected the recorded eight-component inspection model")
    if saved['datasetSha256'] != CSV_SHA256 or saved['splitSizes'] != {'train':180,'validation':60,'test':60}:
        raise ValueError("Recorded measurement/split identity differs")
    expected_header = ['source_row','digit'] + [f'pixel_{j}' for j in range(64)]
    if csv_bytes.decode('utf-8').splitlines()[0].split(',') != expected_header:
        raise ValueError("Unexpected CSV feature order")
    from io import BytesIO
    raw = np.loadtxt(BytesIO(csv_bytes), delimiter=',', skiprows=1)
    require_finite(raw, "Recorded CSV")
    if raw.shape != (300,66) or np.any(raw != np.floor(raw)):
        raise ValueError("Expected 300 integer-valued source/label/pixel rows")
    source_ids, labels, pixels = raw[:,0].astype(int), raw[:,1].astype(int), raw[:,2:]
    if len(set(source_ids.tolist())) != 300 or np.any(source_ids < 0):
        raise ValueError("Source IDs must be unique nonnegative indices")
    if np.any((labels < 0) | (labels > 9)) or np.any((pixels < 0) | (pixels > 16)):
        raise ValueError("Recorded label or block-count range differs")
    h = nonnegative_table(saved['dictionary'],64,require_rows=True)
    w = nonnegative_table(saved['activations'],8,require_rows=True)
    if h.shape != (8,64) or w.shape != (60,8) or len(saved['test']) != 60:
        raise ValueError("Recorded dictionary/amount/test shapes differ")
    csv_lookup = {int(source):i for i,source in enumerate(source_ids)}
    selected, selected_labels, selected_ids = [], [], []
    for row in saved['test']:
        source, label = row['sourceRow'], row['digit']
        if source not in csv_lookup:
            raise ValueError("Saved observation is absent from the supplied CSV")
        at = csv_lookup[source]
        if label != int(labels[at]) or not np.array_equal(row['pixels'],pixels[at]):
            raise ValueError("Saved source/label/pixel correspondence differs")
        selected.append(pixels[at]/16.0)
        selected_labels.append(label)
        selected_ids.append(source)
    if len(set(selected_ids)) != 60:
        raise ValueError("Saved observations must have distinct source IDs")
    return SavedDigits(read_only(h),read_only(w),read_only(np.array(selected)),
                       tuple(selected_ids),tuple(selected_labels),
                       MappingProxyType({source:i for i,source in enumerate(selected_ids)}),saved)


def describe_saved_row(saved, source_row, *, component=None, gain=1.0):
    if isinstance(source_row,(bool,np.bool_)) or not isinstance(source_row,(int,np.integer)):
        raise ValueError("Source row must be an integer ID")
    if int(source_row) not in saved.row_lookup:
        raise ValueError("Source row is not among the saved reserved observations")
    at = saved.row_lookup[int(source_row)]
    w, h, x = saved.amounts[at], saved.dictionary, saved.observations[at]
    totals = contribution_totals(w[None,:],h)[0]
    c = int(np.argmax(totals)) if component is None else component
    addend = row_contribution(w,h,c)
    base = reconstruction(w[None,:],h)[0]
    changed = change_component_gain(w,h,c,gain)
    residual, changed_residual = x-base,x-changed
    with np.errstate(over='ignore',invalid='ignore'):
        mse, changed_mse = float(np.mean(residual**2)),float(np.mean(changed_residual**2))
    require_finite([mse,changed_mse],"Saved descriptive MSE")
    return {'source_row':int(source_row),'digit':saved.labels[at],'component_index':int(c),
            'amounts':w.copy(),'contribution_totals':totals,'selected_contribution':addend,
            'observed':x.copy(),'reconstruction':base,'residual':residual,
            'changed_reconstruction':changed,'changed_residual':changed_residual,
            'mse':mse,'changed_mse':changed_mse,
            'largest_coefficient_index':int(np.argmax(w)),
            'largest_contribution_index':int(np.argmax(totals))}


def main():
    np.set_printoptions(precision=10,suppress=True,linewidth=120)
    saved = load_saved_digits()
    totals = contribution_totals(saved.amounts,saved.dictionary)
    disagreements = np.count_nonzero(np.argmax(saved.amounts,axis=1)!=np.argmax(totals,axis=1))
    print('recorded_model',saved.metadata['fit'],'rows',len(saved.source_rows))
    print('dictionary_range',float(saved.dictionary.min()),float(saved.dictionary.max()))
    print('coefficient_contribution_disagreements',int(disagreements),'of',len(saved.source_rows))
    for source,component in [(242,0),(256,7)]:
        report = describe_saved_row(saved,source,component=component,gain=0)
        print('source',source,'digit',report['digit'],'selected_component',component+1)
        print('amounts',report['amounts'])
        print('contribution_totals',report['contribution_totals'])
        print('largest_coefficient',report['largest_coefficient_index']+1,
              'largest_total_contribution',report['largest_contribution_index']+1)
        for name in ['observed','selected_contribution','reconstruction','residual','changed_reconstruction']:
            print(name,report[name].reshape(8,8))
        print('mse_before',report['mse'],'mse_after_removal',report['changed_mse'])
        print('prediction_range',float(report['reconstruction'].min()),float(report['reconstruction'].max()))
    null = describe_saved_row(saved,242,component=7,gain=0)
    print('row242_C8_zero_change',np.array_equal(null['reconstruction'],null['changed_reconstruction']))


if __name__ == '__main__':
    main()
```


The full output is included so the image panels can be checked cell by cell. Each bracketed row is one image row; corresponding addresses line up across observed, addend, reconstruction and residual. Printed decimals are rounded for display, while the saved arrays and computations retain their floating precision.


```text
recorded_model {'k': 8, 'seed': 19, 'init': 'random', 'solver': 'cd', 'maxIter': 2000, 'tol': 1e-05} rows 60
dictionary_range 0.0 1.389323550924926
coefficient_contribution_disagreements 16 of 60
source 242 digit 8 selected_component 1
amounts [0.1764530626 0.7401606839 0.3550796829 0.0989837029 0.2751947643 0.6129899959 0.1857680493 0.          ]
contribution_totals [1.634815928  5.8145773787 4.0126467304 0.9372984975 2.9415933319 4.7593884933 1.7223346236 0.          ]
largest_coefficient 2 largest_total_contribution 2
observed [[0.     0.     0.125  0.75   0.75   0.     0.     0.    ]
 [0.     0.     0.4375 1.     0.9375 0.5625 0.0625 0.    ]
 [0.     0.     0.375  0.875  0.8125 0.9375 0.1875 0.    ]
 [0.     0.     0.0625 1.     1.     0.25   0.     0.    ]
 [0.     0.     0.4375 1.     0.875  0.     0.     0.    ]
 [0.     0.0625 0.9375 0.5625 1.     0.3125 0.     0.    ]
 [0.     0.125  0.8125 0.8125 1.     0.625  0.     0.    ]
 [0.     0.     0.0625 0.6875 0.75   0.3125 0.     0.    ]]
selected_contribution [[0.           0.           0.           0.0962058733 0.0722623497 0.0005776848 0.0029668758 0.001994617 ]
 [0.           0.           0.1023181683 0.0720161323 0.095477632  0.1317774072 0.0059882351 0.0009973085]
 [0.           0.0009643146 0.0201567046 0.           0.0345205974 0.2107821377 0.0435515093 0.0002630444]
 [0.           0.           0.           0.           0.0464046579 0.2356312938 0.0739440517 0.          ]
 [0.           0.0114531851 0.0101329707 0.           0.           0.1290025701 0.096991284  0.          ]
 [0.           0.0023411596 0.           0.           0.           0.           0.0109735616 0.          ]
 [0.           0.           0.           0.0328981905 0.           0.           0.           0.          ]
 [0.           0.           0.           0.092222411  0.           0.           0.           0.          ]]
reconstruction [[0.           0.022585453  0.1870876302 0.6760734135 0.7601806097 0.3701642678 0.0752956598 0.0083537086]
 [0.           0.0588452909 0.4961978641 0.7815983195 0.8670538405 0.5280479012 0.1445697176 0.0041768543]
 [0.           0.0958645454 0.3826829085 0.743377177  0.9408868169 0.5833206111 0.1163577965 0.0009045056]
 [0.           0.034748176  0.198114788  0.9231404716 0.9704310716 0.4656974688 0.0739440517 0.          ]
 [0.           0.0847283537 0.5269402451 1.0176746162 0.9783068564 0.2974194627 0.096991284  0.          ]
 [0.           0.1204754622 0.7191417693 0.8934560454 0.8058712648 0.2559012637 0.1830766214 0.0006406838]
 [0.           0.04904412   0.544364025  0.8053865493 0.6010478812 0.5122066075 0.289971746  0.0082552983]
 [0.           0.0216594995 0.2005259828 0.6118480305 0.8017602484 0.6996038536 0.1831558448 0.0035004488]]
residual [[ 0.           -0.022585453  -0.0620876302  0.0739265865 -0.0101806097 -0.3701642678 -0.0752956598 -0.0083537086]
 [ 0.           -0.0588452909 -0.0586978641  0.2184016805  0.0704461595  0.0344520988 -0.0820697176 -0.0041768543]
 [ 0.           -0.0958645454 -0.0076829085  0.131622823  -0.1283868169  0.3541793889  0.0711422035 -0.0009045056]
 [ 0.           -0.034748176  -0.135614788   0.0768595284  0.0295689284 -0.2156974688 -0.0739440517  0.          ]
 [ 0.           -0.0847283537 -0.0894402451 -0.0176746162 -0.1033068564 -0.2974194627 -0.096991284   0.          ]
 [ 0.           -0.0579754622  0.2183582307 -0.3309560454  0.1941287352  0.0565987363 -0.1830766214 -0.0006406838]
 [ 0.            0.07595588    0.268135975   0.0071134507  0.3989521188  0.1127933925 -0.289971746  -0.0082552983]
 [ 0.           -0.0216594995 -0.1380259828  0.0756519695 -0.0517602484 -0.3871038536 -0.1831558448 -0.0035004488]]
changed_reconstruction [[0.           0.022585453  0.1870876302 0.5798675402 0.68791826   0.369586583  0.072328784  0.0063590916]
 [0.           0.0588452909 0.3938796958 0.7095821872 0.7715762085 0.396270494  0.1385814825 0.0031795458]
 [0.           0.0949002307 0.3625262039 0.743377177  0.9063662194 0.3725384734 0.0728062872 0.0006414612]
 [0.           0.034748176  0.198114788  0.9231404716 0.9240264137 0.230066175  0.           0.          ]
 [0.           0.0732751685 0.5168072744 1.0176746162 0.9783068564 0.1684168926 0.           0.          ]
 [0.           0.1181343026 0.7191417693 0.8934560454 0.8058712648 0.2559012637 0.1721030598 0.0006406838]
 [0.           0.04904412   0.544364025  0.7724883587 0.6010478812 0.5122066075 0.289971746  0.0082552983]
 [0.           0.0216594995 0.2005259828 0.5196256195 0.8017602484 0.6996038536 0.1831558448 0.0035004488]]
mse_before 0.021503642602943913 mse_after_removal 0.024686350767946813
prediction_range 0.0 1.0176746162346788
source 256 digit 0 selected_component 8
amounts [0.2321911099 0.0119346027 0.3424206827 0.           0.1208154462 0.           0.6884925427 0.6280021306]
contribution_totals [2.1512220831 0.0937562239 3.8695912467 0.           1.2914123266 0.           6.3833072973 6.894594098 ]
largest_coefficient 7 largest_total_contribution 8
observed [[0.     0.     0.25   0.6875 0.9375 0.5    0.     0.    ]
 [0.     0.     0.8125 1.     0.6875 0.8125 0.4375 0.    ]
 [0.     0.1875 1.     0.75   0.     0.25   0.5    0.    ]
 [0.     0.375  1.     0.3125 0.     0.25   0.5    0.    ]
 [0.     0.4375 0.5625 0.     0.     0.5625 0.4375 0.    ]
 [0.     0.25   0.625  0.     0.125  0.9375 0.125  0.    ]
 [0.     0.0625 1.     0.75   0.875  0.625  0.     0.    ]
 [0.     0.     0.25   0.875  0.875  0.0625 0.     0.    ]]
selected_contribution [[0.           0.           0.           0.           0.1777509121 0.           0.           0.          ]
 [0.           0.           0.           0.2428343994 0.2671887916 0.           0.           0.          ]
 [0.           0.00304608   0.4036201918 0.392507132  0.           0.           0.           0.          ]
 [0.           0.2002405751 0.7939019174 0.1584499925 0.           0.1207764965 0.1257413818 0.          ]
 [0.           0.2456569539 0.5797584251 0.           0.0263542947 0.5211370489 0.1599000852 0.          ]
 [0.           0.071171417  0.1681912529 0.           0.1181309355 0.6882943943 0.1984023659 0.0003959304]
 [0.           0.           0.           0.           0.430946372  0.3338516655 0.0126308545 0.          ]
 [0.           0.           0.           0.0488815581 0.404832674  0.           0.           0.          ]]
reconstruction [[0.           0.0632094672 0.4004008288 0.7211268938 0.633156511  0.3971504474 0.0832506895 0.0033096755]
 [0.           0.1775870282 0.8427424949 0.7848613841 0.5268212701 0.5455821363 0.1160034882 0.0016548378]
 [0.           0.2504980524 1.1482597628 0.4483869856 0.0454249743 0.4831078699 0.1021253658 0.0003461349]
 [0.           0.3290240778 1.227710461  0.4058839944 0.1327996739 0.5273718869 0.2230429031 0.          ]
 [0.           0.2619094884 0.6876903267 0.1682255105 0.1226660202 0.7495299599 0.2875290056 0.          ]
 [0.           0.1068000638 0.462880859  0.0986256254 0.3370795841 0.818832078  0.3671252025 0.0008188475]
 [0.           0.0577963967 0.644125368  0.4880684399 0.7861688258 0.7088372402 0.2842154784 0.005888849 ]
 [0.           0.0557406433 0.420215874  0.8033410402 0.8074767377 0.3954786525 0.1334531266 0.0025247366]]
residual [[ 0.           -0.0632094672 -0.1504008288 -0.0336268938  0.304343489   0.1028495526 -0.0832506895 -0.0033096755]
 [ 0.           -0.1775870282 -0.0302424949  0.2151386159  0.1606787299  0.2669178637  0.3214965118 -0.0016548378]
 [ 0.           -0.0629980524 -0.1482597628  0.3016130144 -0.0454249743 -0.2331078699  0.3978746342 -0.0003461349]
 [ 0.            0.0459759222 -0.227710461  -0.0933839944 -0.1327996739 -0.2773718869  0.2769570969  0.          ]
 [ 0.            0.1755905116 -0.1251903267 -0.1682255105 -0.1226660202 -0.1870299599  0.1499709944  0.          ]
 [ 0.            0.1431999362  0.162119141  -0.0986256254 -0.2120795841  0.118667922  -0.2421252025 -0.0008188475]
 [ 0.            0.0047036033  0.355874632   0.2619315601  0.0888311742 -0.0838372402 -0.2842154784 -0.005888849 ]
 [ 0.           -0.0557406433 -0.170215874   0.0716589598  0.0675232623 -0.3329786525 -0.1334531266 -0.0025247366]]
changed_reconstruction [[0.           0.0632094672 0.4004008288 0.7211268938 0.4554055989 0.3971504474 0.0832506895 0.0033096755]
 [0.           0.1775870282 0.8427424949 0.5420269847 0.2596324785 0.5455821363 0.1160034882 0.0016548378]
 [0.           0.2474519724 0.7446395709 0.0558798536 0.0454249743 0.4831078699 0.1021253658 0.0003461349]
 [0.           0.1287835027 0.4338085436 0.2474340019 0.1327996739 0.4065953904 0.0973015213 0.          ]
 [0.           0.0162525345 0.1079319016 0.1682255105 0.0963117255 0.228392911  0.1276289204 0.          ]
 [0.           0.0356286469 0.294689606  0.0986256254 0.2189486486 0.1305376837 0.1687228366 0.0004229171]
 [0.           0.0577963967 0.644125368  0.4880684399 0.3552224538 0.3749855747 0.2715846239 0.005888849 ]
 [0.           0.0557406433 0.420215874  0.7544594822 0.4026440637 0.3954786525 0.1334531266 0.0025247366]]
mse_before 0.02758816154887481 mse_after_removal 0.0732625383196997
prediction_range 0.0 1.227710460954826
row242_C8_zero_change True
```


For row 242, the C1 removal increases MSE from about 0.02150364 to 0.02468635. For row 256, C8 removal gives the larger change studied above. The final `True` is the separate row-242/C8 null case. An MSE is an average over 64 squared feature residuals, not a percentage of wrongly classified digits.

The source-ID and file checks protect correspondence; they do not validate the model statistically. We have learned to read **what this saved representation does**. The next section asks a different question: **how was a representation chosen, and what does its independent comparison actually support?**

## 13. Separate a representation decision from its evaluation

The saved pictures showed what one dictionary does. How do we decide which representation to use without letting the examples used for judging it also choose it? Follow the rows before comparing the errors.

<!-- figure:D46 -->

The CSV has 300 observations, each with a source ID, a descriptive digit label and 64 measured pixel features. Only the 64 features enter a dictionary fit. The fixed divisor 16 converts counts to intensity units before fitting; it is not estimated from the dataset. The original split uses seed 19 twice, preserving label proportions: 180 rows for training, 60 for validation and 60 reserved for the test comparison. Labels influence this stratification and the balanced subset selection; they do not become factorization features.

The arrows show a direction of information. **Training rows** determine the dictionary. **Validation rows** are encoded against that fixed dictionary and help compare candidate settings. **Reserved test rows** assess a declared representation after its intended choice. Encoding a reserved row optimizes that row's amounts with H fixed; it does not send the row back into dictionary fitting. In a later supervised system, learned vocabulary, IDF, dictionary and classifier must all be fitted within the training fold, then frozen for its validation/test rows.

The diagram shows actual source IDs, not just hypothetical buckets. In this protocol source row 242 is the first reserved observation, row 256 the second; row 31 is a training observation and row 286 a validation observation. These are addresses in the original source collection, not local array indices or writer IDs. The full ordered partition is retained with the new controlled study below so a comparison can be traced back to the exact rows.

### Inspect all the candidates before naming a choice

Which of the recorded rank and seed choices reconstructed validation rows best? Look at every recorded point, with a zero-origin error axis.

<!-- figure:D47 -->

Each training/validation pair belongs to one actual fit, not an average with invented uncertainty bars. The lower validation error among these eight recorded candidates is k=16, seed 7, at approximately 0.01354792. The k=8, seed-19 dictionary used in section 12 was chosen as a fixed, inspectable eight-pattern example; its validation error is approximately 0.02631530. It is not the winner of this candidate comparison, and the plot does not justify calling eight an automatically selected elbow.

| Components k | Seed | Training MSE | Validation MSE | Fitting iterations |
|---:|---:|---:|---:|---:|
| 1 | 7 | 0.07214412726956479 | 0.07280297762810437 | 6 |
| 1 | 19 | 0.07214412726956489 | 0.07280297804796376 | 6 |
| 4 | 7 | 0.04040871277824657 | 0.041899149163385656 | 192 |
| 4 | 19 | 0.040408712822337434 | 0.041899935779433586 | 207 |
| 8 | 7 | 0.02475004181007092 | 0.025548017870485402 | 261 |
| 8 | 19 | 0.025147105358696256 | 0.026315303314664616 | 448 |
| 16 | 7 | 0.012295160150866928 | 0.013547922081604519 | 575 |
| 16 | 19 | 0.012729497371186178 | 0.015288655568708278 | 560 |

Different seeds can reach different factors and errors because joint fitting is nonconvex. A larger k expands the set of possible exact products: an earlier solution can be embedded by adding unused components. Thus the globally best training objective cannot worsen merely because k grows. A particular finite optimizer run need not reach that global best, however. The observed downward trend is an outcome of these runs, not a theorem about every call to `fit` or about reserved performance.

Choosing settings from validation is legitimate, but repeated adaptation to the same small validation set can overfit that comparison too. Use a declared search and an appropriate resampling strategy when uncertainty or task stakes demand it. These two seeds are individual runs, not enough by themselves to estimate broad algorithm variability. This lesson retains their individual outcomes and avoids a fabricated confidence interval.

### Compare the declared representations on reserved rows

What does the recorded test comparison actually measure? Compare reconstruction under three different model classes, then look at matched images in a separately declared study.

<!-- figure:D48 -->

The first three bars retain the **original fixed-eight-component comparison**. The mean baseline predicts the same training-mean image for every reserved row. PCA8 stores a training mean and eight signed orthogonal directions; a query is centered, projected and reconstructed with the mean added back. NMF8 uses the previously inspected eight nonnegative patterns and nonnegative query amounts. Their recorded mean squared errors over the same 60×64 measured cells are:

| Original reserved comparison | MSE |
|---|---:|
| Training-mean image | 0.06999462363160687 |
| PCA8 | 0.019678463136677867 |
| NMF8, fixed k=8/seed19 inspection | 0.02538089143047506 |

PCA8 has the lower recorded error. Nonnegative addition may be useful for a desired representation, but it does not automatically minimize reconstruction error across these different model classes. PCA is an affine model that stores a mean in addition to its directions; NMF is a cone model with nonnegative amounts. Equal coordinate counts do not make their constraints or parameter counts identical. Neither reconstruction metric measures digit-recognition accuracy.

The matched images below the bars belong to a **new, separately declared six-coordinate comparison**, not to missing historical PCA8 factors. Both dictionaries/bases were fitted only on the same 180 training rows. The declared settings were PCA6 with full SVD and no whitening, and NMF6 with NNDSVD-average initialization, coordinate descent, seed 23, Frobenius loss, zero penalties, tolerance 10⁻⁶ and a 3,000-iteration cap. Source rows 242 and 256 were specified for inspection before these new reconstructions were produced. We did not choose six or these examples by minimizing their reserved errors.

For the new comparison, read the observation, training-mean prediction, PCA6 prediction and NMF6 prediction at the **same pixel addresses and intensity ruler**. This ruler extends from −0.25 to 1.25 because signed PCA can predict negative cells and both methods can overshoot 1. A zero tick separates negative intensity predictions from positive ones; values are not clipped or independently autoscaled. The earlier dictionary maps used 0–4 per unit amount, a different displayed object. Here we compare actual reconstructed intensity.

| New predeclared six-coordinate comparison | MSE over all 60 reserved rows | Row 242 MSE | Row 256 MSE |
|---|---:|---:|---:|
| Training mean | 0.06999462363160687 | 0.04595146273389275 | 0.06796480908805942 |
| PCA6 | 0.02416372023704315 | 0.021948620787064027 | 0.024197862895577522 |
| NMF6 | 0.030231907695106697 | 0.026957889373735507 | 0.03327840298161405 |

The new NMF fit took 229 fitting iterations, below its cap, and emitted no captured convergence warnings. That is useful solver information, not a proof of a global optimum or of negligible statistical uncertainty. The mean baseline agrees with the original comparison because its training rows and rule are unchanged. The PCA/NMF numbers differ because the new study has different coordinate counts and NMF initialization/settings. Keep these roles separate rather than silently using new images as evidence for the old eight-coordinate numbers.

The full reserved prediction ranges in this new study are mean `[0,0.7381944444]`, PCA6 `[-0.2351021065,1.2007030976]` and NMF6 `[0,1.1729489320]`. A negative PCA cell is an allowed affine-model prediction, not a negative observed count. If an application requires output clipping, that defines another prediction rule and its metrics must be evaluated explicitly. It cannot be introduced just to make pictures look plausible.

### Preserve the measurement ruler and address

Which number does a plotted cell actually represent? Trace one measured bin into the earlier saved eight-component reconstruction.

<!-- figure:D49 -->

For source row 242, pixel row 4, column 3 is flattened feature F35 because `8*4+3=35`. Its raw count is 16; division by the fixed measurement ruler gives 1. The original saved NMF8 reconstruction at that same address is approximately 1.0176746162. The original row-256 reconstruction reaches approximately 1.227710461 at F26. These are the eight-component results from section 12, not the new six-component images just compared.

The difference between raw counts, scaled measurements, per-unit dictionary patterns, amount-weighted contributions and reconstructed intensities is part of the model. State which one an axis or colour legend shows. Hashes and source addresses maintain correspondence, while a model's validation comes from a properly designed comparison; neither replaces the other.

### Keep the original program and evidence

How were the recorded candidate and fixed-eight comparisons produced? The complete original program below preserves that question and its recorded output.

It first fits eight candidate NMF models on training rows and encodes validation rows. It then separately fits the predeclared eight-component inspection model and PCA8 on training rows, and compares their reserved reconstructions to the training mean. That last block does **not** fit the validation winner k=16. A future study of that selected model would need its own declared evaluation; these old test numbers cannot be relabelled as its result.

Save `nmf_digits.py` beside the attributed `digits-300.csv`. NumPy and scikit-learn supply the ordinary numerical tools. This is the original executable route, with its earlier recorded environment/output; the outputs shown are retained evidence, not a claim that every future library environment will reproduce identical final digits. We have already explained the scratch fitting and public NNLS mechanics in sections 4–6; PCA's from-scratch centered projection is taught in [PCA §4](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python). Those owners explain the computational mechanisms rather than hiding the work behind these imports.


```python
import numpy as np
from sklearn.decomposition import NMF, PCA
from sklearn.model_selection import train_test_split

data = np.loadtxt('digits-300.csv', delimiter=',', skiprows=1)
source_rows, labels = data[:, 0].astype(int), data[:, 1].astype(int)
X = data[:, 2:] / 16
train, rest = train_test_split(np.arange(len(X)), test_size=.4,
                               random_state=19, stratify=labels)
validation, test = train_test_split(rest, test_size=.5,
                                    random_state=19, stratify=labels[rest])

for k in (1, 4, 8, 16):
    for seed in (7, 19):
        model = NMF(n_components=k, init='random', solver='cd',
                    random_state=seed, max_iter=2000, tol=1e-5)
        W_train = model.fit_transform(X[train])
        W_validation = model.transform(X[validation])
        H = model.components_
        train_mse = np.mean((X[train] - W_train @ H) ** 2)
        validation_mse = np.mean((X[validation] - W_validation @ H) ** 2)
        print(k, seed, round(train_mse, 6), round(validation_mse, 6))

# A fixed eight-component comparison chosen for inspectable image panels.
nmf = NMF(n_components=8, init='random', solver='cd', random_state=19,
          max_iter=2000, tol=1e-5).fit(X[train])
W_test = nmf.transform(X[test])
nmf_reconstruction = W_test @ nmf.components_
pca = PCA(n_components=8, svd_solver='full').fit(X[train])
pca_reconstruction = pca.inverse_transform(pca.transform(X[test]))
mean_reconstruction = np.repeat(X[train].mean(axis=0)[None, :], len(test), axis=0)
for name, reconstruction in [('mean', mean_reconstruction),
                             ('PCA8', pca_reconstruction),
                             ('NMF8', nmf_reconstruction)]:
    print(name, round(np.mean((X[test] - reconstruction) ** 2), 6))
print('first held-out source row', source_rows[test[0]])
print('first reconstructed image')
print(nmf_reconstruction[0].reshape(8, 8).round(2))
```



```text
1 7 0.072144 0.072803
1 19 0.072144 0.072803
4 7 0.040409 0.041899
4 19 0.040409 0.0419
8 7 0.02475 0.025548
8 19 0.025147 0.026315
16 7 0.012295 0.013548
16 19 0.012729 0.015289
mean 0.069995
PCA8 0.019678
NMF8 0.025381
first held-out source row 242
first reconstructed image
[[0.   0.02 0.19 0.68 0.76 0.37 0.08 0.01]
 [0.   0.06 0.5  0.78 0.87 0.53 0.14 0.  ]
 [0.   0.1  0.38 0.74 0.94 0.58 0.12 0.  ]
 [0.   0.03 0.2  0.92 0.97 0.47 0.07 0.  ]
 [0.   0.08 0.53 1.02 0.98 0.3  0.1  0.  ]
 [0.   0.12 0.72 0.89 0.81 0.26 0.18 0.  ]
 [0.   0.05 0.54 0.81 0.6  0.51 0.29 0.01]
 [0.   0.02 0.2  0.61 0.8  0.7  0.18 0.  ]]
```


The program prints rounded errors, while the table retains the original full-precision recorded report. Its first reconstructed image is source 242; it is not an average digit and not a PCA reconstruction.

### Run the separate controlled image study deliberately

How can we produce matched comparison images without confusing them with the original experiment? Use a differently named program, explicit settings and saved row identities.

`nmf_digit_comparison.py` reads the verified CSV and saved-state identities supplied in section 12. It reconstructs the exact split and checks every reserved source ID in order **before fitting**. It then runs only the new NMF6/PCA6 study, with training-only mean/dictionaries, frozen query transforms and separate train/validation/test metrics. Warnings and cap status travel with the output. There is no rank search or tuning based on reserved outcomes.

The printed JSON includes the settings, all partition IDs, trained PCA mean/basis, NMF dictionary, complete selected images and row encodings. For PCA, `z=(x−mean)@components.T` and `x_hat=z@components+mean`; for NMF, `x_hat=w@H` with w obtained by fixed-H encoding. The same source IDs let you independently multiply those arrays back into every shown pixel. The reader in section 12 still refuses absent saved files; running this explicitly named new study is never an automatic fallback.

The dense input is deliberately only 300×64. A full PCA SVD has conventional O(nd min(n,d)) arithmetic on the training matrix and O(nd) matrix workspace/output storage; query projection/reconstruction costs O(qkd). NMF's per-sweep and encoding costs are the cached-coordinate costs already derived in sections 5–6, multiplied by their actual iteration work; the cap is not an observed runtime estimate. Keeping only the two requested comparison rows avoids an unnecessary all-row/component/feature contribution tensor. The full dictionaries, split and selected pixels in the JSON are reproducibility outputs, not things a browser must recompute while a learner drags a control.

Save this program beside `nmf_saved_digits.py` and its verified siblings, then run `python nmf_digit_comparison.py`. The shown new result used Python 3.12.14, NumPy 2.3.5 and scikit-learn 1.9.1. Its full JSON is a companion output file; the figure/table above extracts its literal selected arrays and metrics without fitting again.


```python
"""A NEW predeclared rank-six study, separate from recorded rank-eight results."""
from pathlib import Path
from io import BytesIO
import json, platform, warnings
import numpy as np
import sklearn
from sklearn.decomposition import NMF, PCA
from sklearn.model_selection import train_test_split
from nmf_saved_digits import verified_bytes, CSV_SHA256, SAVED_SHA256


def study(directory=None):
    directory=Path(__file__).resolve().parent if directory is None else Path(directory)
    raw=np.loadtxt(BytesIO(verified_bytes(directory/'digits-300.csv',CSV_SHA256)),delimiter=',',skiprows=1)
    saved=json.loads(verified_bytes(directory/'nmf_saved_state.json',SAVED_SHA256))
    source_ids,labels=raw[:,0].astype(int),raw[:,1].astype(int)
    x=raw[:,2:]/16.0
    train,rest=train_test_split(np.arange(len(x)),test_size=.4,random_state=19,stratify=labels)
    validation,test=train_test_split(rest,test_size=.5,random_state=19,stratify=labels[rest])
    if raw.shape!=(300,66) or not np.isfinite(raw).all() or (raw!=np.floor(raw)).any():
        raise ValueError('Unexpected attributed measurement table')
    if not np.array_equal(source_ids[test],[row['sourceRow'] for row in saved['test']]):
        raise ValueError('The exact historical reserved source-ID order must be retained')
    # This configuration is declared before examining any reserved reconstruction.
    nmf=NMF(n_components=6,init='nndsvda',solver='cd',beta_loss='frobenius',
            random_state=23,max_iter=3000,tol=1e-6,alpha_W=0,alpha_H=0,l1_ratio=0)
    pca=PCA(n_components=6,svd_solver='full',whiten=False)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        train_w=nmf.fit_transform(x[train])
        validation_w=nmf.transform(x[validation])
        test_w=nmf.transform(x[test])
        pca.fit(x[train])
        test_z=pca.transform(x[test])
    mean=x[train].mean(axis=0)
    nmf_images=test_w@nmf.components_
    pca_images=pca.inverse_transform(test_z)
    mean_images=np.broadcast_to(mean,nmf_images.shape)
    mse=lambda observed,predicted:float(np.mean((observed-predicted)**2))
    selected=[]
    for source in (242,256):
        at=int(np.flatnonzero(source_ids[test]==source)[0])
        selected.append({'source_row':source,'label':int(labels[test[at]]),'reserved_position':at,
                         'observed':x[test[at]].tolist(),'mean':mean.tolist(),
                         'PCA6':pca_images[at].tolist(),'NMF6':nmf_images[at].tolist(),
                         'PCA6_coordinates':test_z[at].tolist(),'NMF6_amounts':test_w[at].tolist(),
                         'rowMSE':{name:mse(x[test[at]],image) for name,image in
                                   [('mean',mean),('PCA6',pca_images[at]),('NMF6',nmf_images[at])]}})
    return {'role':'new predeclared rank6/seed23 controlled study; not recovered historical PCA8 factors',
            'versions':{'python':platform.python_version(),'numpy':np.__version__,'sklearn':sklearn.__version__},
            'datasetSha256':CSV_SHA256,'fixedScale':16,'rank':6,'seed':23,
            'settings':{'NMF':nmf.get_params(),'PCA':pca.get_params()},
            'sourceIDs':{name:source_ids[indices].tolist() for name,indices in [('train',train),('validation',validation),('test',test)]},
            'dictionaryFitRows':180,'reservedRows':60,'selectionOnReservedRows':False,
            'nmfFitIterations':int(nmf.n_iter_),'nmfCapReached':bool(nmf.n_iter_>=nmf.max_iter),
            'warnings':[{'category':item.category.__name__,'message':str(item.message)} for item in caught],
            'NMFTrainMSE':mse(x[train],train_w@nmf.components_),
            'NMFValidationMSE':mse(x[validation],validation_w@nmf.components_),
            'testMSE':{name:mse(x[test],image) for name,image in [('mean',mean_images),('PCA6',pca_images),('NMF6',nmf_images)]},
            'predictionRanges':{name:[float(image.min()),float(image.max())] for name,image in [('mean',mean_images),('PCA6',pca_images),('NMF6',nmf_images)]},
            'PCAMean':pca.mean_.tolist(),'PCAComponents':pca.components_.tolist(),
            'NMFDictionary':nmf.components_.tolist(),'selected':selected}


def main():
    print(json.dumps(study(),indent=2,allow_nan=False))


if __name__=='__main__':
    main()
```



```json
{
  "role": "new predeclared rank6/seed23 controlled study; not recovered historical PCA8 factors",
  "versions": {
    "python": "3.12.14",
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "datasetSha256": "d93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e",
  "fixedScale": 16,
  "rank": 6,
  "seed": 23,
  "settings": {
    "NMF": {
      "alpha_H": 0,
      "alpha_W": 0,
      "beta_loss": "frobenius",
      "init": "nndsvda",
      "l1_ratio": 0,
      "max_iter": 3000,
      "n_components": 6,
      "random_state": 23,
      "shuffle": false,
      "solver": "cd",
      "tol": 1e-06,
      "verbose": 0
    },
    "PCA": {
      "copy": true,
      "iterated_power": "auto",
      "n_components": 6,
      "n_oversamples": 10,
      "power_iteration_normalizer": "auto",
      "random_state": null,
      "svd_solver": "full",
      "tol": 0.0,
      "whiten": false
    }
  },
  "sourceIDs": {
    "train": [
      31,
      228,
      16,
      2,
      163,
      176,
      205,
      100,
      23,
      37,
      78,
      83,
      35,
      276,
      211,
      196,
      15,
      24,
      91,
      294,
      161,
      33,
      98,
      252,
      71,
      70,
      170,
      281,
      278,
      96,
      93,
      240,
      283,
      267,
      237,
      165,
      258,
      52,
      198,
      57,
      99,
      189,
      231,
      126,
      39,
      125,
      264,
      133,
      274,
      249,
      184,
      199,
      162,
      44,
      219,
      243,
      88,
      247,
      269,
      104,
      11,
      110,
      141,
      293,
      45,
      300,
      225,
      178,
      172,
      181,
      6,
      287,
      51,
      101,
      229,
      77,
      217,
      134,
      28,
      142,
      131,
      155,
      299,
      298,
      208,
      285,
      206,
      69,
      280,
      279,
      54,
      250,
      153,
      94,
      174,
      173,
      139,
      282,
      61,
      66,
      124,
      209,
      188,
      204,
      17,
      18,
      157,
      216,
      284,
      160,
      154,
      34,
      224,
      200,
      255,
      90,
      227,
      4,
      53,
      262,
      214,
      215,
      0,
      238,
      36,
      158,
      137,
      111,
      80,
      65,
      186,
      117,
      191,
      82,
      21,
      128,
      152,
      30,
      257,
      230,
      253,
      12,
      49,
      234,
      64,
      164,
      130,
      288,
      251,
      320,
      226,
      268,
      169,
      138,
      270,
      3,
      22,
      190,
      105,
      135,
      136,
      9,
      168,
      55,
      175,
      25,
      187,
      275,
      108,
      109,
      273,
      166,
      150,
      151,
      149,
      314,
      76,
      212,
      63,
      156
    ],
    "validation": [
      286,
      106,
      245,
      218,
      297,
      210,
      277,
      223,
      72,
      233,
      73,
      143,
      167,
      46,
      183,
      86,
      129,
      241,
      27,
      301,
      122,
      114,
      5,
      48,
      89,
      14,
      192,
      195,
      56,
      254,
      87,
      271,
      62,
      116,
      266,
      235,
      75,
      79,
      148,
      115,
      123,
      171,
      68,
      201,
      19,
      50,
      236,
      112,
      193,
      263,
      67,
      92,
      144,
      146,
      207,
      42,
      10,
      81,
      197,
      32
    ],
    "test": [
      242,
      256,
      40,
      220,
      132,
      97,
      1,
      13,
      43,
      180,
      120,
      272,
      244,
      202,
      95,
      265,
      102,
      221,
      248,
      213,
      145,
      74,
      58,
      232,
      222,
      7,
      179,
      29,
      261,
      60,
      246,
      47,
      194,
      107,
      119,
      159,
      38,
      259,
      177,
      147,
      306,
      59,
      84,
      41,
      140,
      8,
      203,
      20,
      182,
      26,
      85,
      113,
      118,
      127,
      121,
      103,
      290,
      185,
      260,
      239
    ]
  },
  "dictionaryFitRows": 180,
  "reservedRows": 60,
  "selectionOnReservedRows": false,
  "nmfFitIterations": 229,
  "nmfCapReached": false,
  "warnings": [],
  "NMFTrainMSE": 0.03105257759330203,
  "NMFValidationMSE": 0.03196800008378407,
  "testMSE": {
    "mean": 0.06999462363160687,
    "PCA6": 0.02416372023704315,
    "NMF6": 0.030231907695106697
  },
  "predictionRanges": {
    "mean": [
      0.0,
      0.7381944444444445
    ],
    "PCA6": [
      -0.2351021064761421,
      1.2007030976024105
    ],
    "NMF6": [
      0.0,
      1.1729489319699486
    ]
  },
  "PCAMean": [
    0.0,
    0.029513888888888888,
    0.33958333333333335,
    0.6989583333333333,
    0.7090277777777778,
    0.3420138888888889,
    0.06145833333333333,
    0.003472222222222222,
    0.0,
    0.09583333333333334,
    0.6069444444444444,
    0.7381944444444445,
    0.7114583333333333,
    0.528125,
    0.1125,
    0.001736111111111111,
    0.0,
    0.12083333333333333,
    0.5524305555555555,
    0.4840277777777778,
    0.5013888888888889,
    0.515625,
    0.1,
    0.00034722222222222224,
    0.0,
    0.12881944444444443,
    0.54375,
    0.5625,
    0.6079861111111111,
    0.49756944444444445,
    0.121875,
    0.0,
    0.0,
    0.1375,
    0.5493055555555556,
    0.6076388888888888,
    0.6684027777777778,
    0.5256944444444445,
    0.16180555555555556,
    0.0,
    0.0,
    0.09409722222222222,
    0.4722222222222222,
    0.5114583333333333,
    0.5715277777777777,
    0.5069444444444444,
    0.1954861111111111,
    0.00034722222222222224,
    0.0,
    0.03611111111111111,
    0.44375,
    0.6194444444444445,
    0.675,
    0.5128472222222222,
    0.18611111111111112,
    0.004166666666666667,
    0.0,
    0.028819444444444446,
    0.36666666666666664,
    0.7041666666666667,
    0.6895833333333333,
    0.3871527777777778,
    0.09895833333333333,
    0.0024305555555555556
  ],
  "PCAComponents": [
    [
      -3.3132898708546138e-18,
      0.005277654789790365,
      0.04053901574965385,
      0.1498489908026328,
      -0.0834865121888535,
      -0.1768454928480726,
      -0.041549751446625,
      -0.0017742387068939054,
      1.734723475976807e-18,
      0.04099177980797918,
      0.17872989180997959,
      0.1880935797949868,
      -0.1383597824319974,
      -0.25559482401020567,
      -0.09151691383658123,
      -0.0008871193534469528,
      -0.0,
      0.07742842567369854,
      0.3220429091775396,
      0.007635687280096971,
      -0.2549571561944226,
      -0.2616965260791956,
      -0.04864200011356242,
      -0.00017719182322192218,
      -7.346839692639297e-40,
      0.062410234392432484,
      0.20811379620454554,
      -0.07053822991137354,
      -0.32156877185560123,
      -0.22791095563134517,
      0.010994079757923006,
      -0.0,
      -0.0,
      0.0404696605681111,
      0.18128635053865705,
      0.07744353308369913,
      -0.17287329894338724,
      -0.1695363781740072,
      0.0006493377892784474,
      -0.0,
      -0.0,
      0.020137380726389983,
      0.22827939143826692,
      0.15893849284675812,
      -0.09308590197637462,
      -0.0688059797549237,
      0.07261233458014531,
      0.000591328395463989,
      -0.0,
      0.009730175874001564,
      0.223484064373511,
      0.18418782755492083,
      -0.05917483667704724,
      -0.035220131659719864,
      0.11372654427418787,
      0.0037250224636949485,
      -0.0,
      0.0032681503572003752,
      0.03539410484158261,
      0.13398870967217713,
      0.053220154308792136,
      -0.0018924390456532003,
      0.03859717345436672,
      0.00046531671023456594
    ],
    [
      1.3646861665046388e-18,
      0.04124407698171508,
      0.31435064493311815,
      0.25745626929220555,
      0.0025547203665827606,
      0.07645938788691076,
      0.0287310436292621,
      0.0009416624573330701,
      1.1102230246251565e-16,
      0.09940670453069331,
      0.33687838669309134,
      -0.0032141712575380122,
      -0.047496169722083835,
      0.15353679068234283,
      0.05481103112461387,
      0.00047083122866657803,
      -0.0,
      0.08592437348576733,
      0.060423824387256526,
      -0.2941958235832895,
      -0.0706476532173159,
      0.09554568566978289,
      0.026154050966085432,
      5.110168413541348e-05,
      -7.52316384526264e-37,
      -0.004684983964151663,
      -0.13242430483273382,
      -0.1230346499523098,
      0.0684421305532749,
      -0.0020138076314868,
      -0.027037249857373335,
      -0.0,
      -0.0,
      -0.1000763126770575,
      -0.28400576218181794,
      -0.17226719038360705,
      -0.11769878684375779,
      -0.07772071206360208,
      -0.04066595001400981,
      -0.0,
      -0.0,
      -0.06919326833347403,
      -0.24395463426984249,
      -0.21013786200072535,
      -0.1716053360298983,
      -0.07332359527225067,
      -0.03590153307875326,
      -0.0005336747673856243,
      -0.0,
      0.010255123592868965,
      0.0930263007106945,
      0.04287563248681283,
      -0.06163083938881593,
      -0.003575753187303799,
      -0.03404905814252626,
      -0.004221282120070291,
      -0.0,
      0.040851872799346496,
      0.32871636096883855,
      0.2786227739649501,
      -0.12624935785680846,
      -0.13313858933919642,
      -0.026929567628148573,
      0.0013191431056742559
    ],
    [
      9.160490825731862e-18,
      -0.030790780580410737,
      -0.09872543136720258,
      0.0016975293208899983,
      -0.12128057786201812,
      -0.1604075529313514,
      -0.05167326840633876,
      -0.005061144222835573,
      -5.551115123125783e-17,
      -0.053338768190196464,
      -0.009123257477003639,
      -0.003772478308803578,
      0.017665069531409006,
      0.003928799272166904,
      -0.044712924786677544,
      -0.0025305721114178125,
      0.0,
      -0.02205199914727499,
      0.08067681488189694,
      0.06630888974985344,
      0.0033349653608607884,
      0.18359912015216542,
      0.01577744668277753,
      -0.000573546009371511,
      0.0,
      0.006148910127796265,
      0.026290554611379,
      -0.07320242745136991,
      -0.09214606638431802,
      0.1582464259603992,
      0.046678479886482216,
      0.0,
      0.0,
      0.007181107885439454,
      -0.06690264993090625,
      -0.33172238786060176,
      -0.23462549600180177,
      0.186490099053585,
      0.0745658651468825,
      0.0,
      0.0,
      0.0134964857068984,
      0.05618689709950184,
      -0.27532494213348335,
      -0.30184669598971364,
      0.2944843551669039,
      0.22152642311398354,
      0.00015048538708082034,
      0.0,
      0.00511263207071271,
      0.10867655098224402,
      -0.13612784679513013,
      -0.07608404446506162,
      0.3872558811605339,
      0.1928836467485924,
      0.002214000721372999,
      0.0,
      -0.030895436464479197,
      -0.10586621629383346,
      0.005205179576541135,
      0.22621429849981634,
      0.22174224079030877,
      0.04314593792241845,
      0.0009772109133482747
    ],
    [
      8.305772267981417e-18,
      -0.009257597095400194,
      0.058337176497891524,
      0.0569556606718678,
      -0.12084160470540654,
      -0.17758172633904146,
      -0.08591755289861847,
      -0.009429592100805365,
      -2.7755575615628914e-17,
      0.025844233952217174,
      -0.017310416264078244,
      0.012740459947993645,
      0.08104337599452947,
      -0.15978487301026462,
      -0.11412131029719616,
      -0.004714796050402701,
      -5.293955920339377e-23,
      -0.030169857187460777,
      -0.12782240912799467,
      0.1351350447154908,
      0.31894151942007437,
      -0.11583664589313454,
      -0.10507148075478127,
      0.0003169466302828733,
      -3.0814879110195774e-33,
      -0.1294431502537366,
      -0.28859299637858776,
      0.18074914941882006,
      0.2966785996782144,
      -0.2324816479636147,
      -0.14318807618946774,
      -0.0,
      -0.0,
      -0.13139060293249513,
      -0.24785059364950188,
      0.11485916105423627,
      0.08799128527656708,
      -0.24285962888761595,
      -0.14632047008752538,
      -0.0,
      -0.0,
      -0.01857597227882391,
      0.03363357782526428,
      0.08312322432825396,
      -0.15507711957648493,
      -0.136409427279193,
      0.024614825851467452,
      0.00014412059622460354,
      -0.0,
      0.012853211587176066,
      0.1660092331812648,
      0.05426392112975374,
      -0.12926732922295545,
      0.06994761763171081,
      0.15554768311894762,
      0.005105992747101789,
      -0.0,
      -0.012245195672674595,
      0.04726625278500722,
      0.010057786968972337,
      0.14931795763831518,
      0.28530682448191286,
      0.14847775908058825,
      0.004925659210179605
    ],
    [
      -7.617406505547474e-19,
      0.04431397300552223,
      0.12046761748964697,
      -0.08628417481764347,
      -0.01600502564139024,
      0.05401835122293207,
      -0.024550513041515967,
      -0.016038180342020113,
      1.3877787807814457e-17,
      0.06826330631889352,
      -0.009419471980057215,
      -0.07393301165332788,
      -0.026451313032751417,
      -0.10259598745178061,
      -0.05475942042953021,
      -0.00801909017101013,
      5.421010862427522e-20,
      0.0728444308058822,
      0.23432327527729022,
      0.20640165909663422,
      0.03444389769505422,
      -0.2851940698429717,
      -0.09842614793722745,
      -0.0002691860166769189,
      -1.0097419586828951e-28,
      0.08341304635628331,
      0.38510996328597413,
      0.3780026296129908,
      0.06049433847150633,
      -0.21422113918659344,
      -0.08469805409344602,
      -0.0,
      -0.0,
      -0.027625417612456158,
      -0.0846047604225456,
      -0.0943103040054451,
      -0.02002377034119922,
      -0.02338384332742409,
      -0.11345599683898464,
      -0.0,
      -0.0,
      -0.0971537599525964,
      -0.36922857764263756,
      -0.24827153512258412,
      0.13859206658985826,
      0.18613856820056018,
      -0.002074247204833894,
      0.00037463516853442844,
      -0.0,
      -0.011147088586383806,
      -0.1577189348335685,
      -0.1944590450231104,
      0.12666735641921387,
      0.056465252849374176,
      0.003336253205064047,
      0.002405591227820999,
      -0.0,
      0.036528330929487186,
      0.11056543290468901,
      -0.03605547699823606,
      0.06871625993425977,
      -0.026502375697591656,
      -0.058213363645763724,
      0.0006592386540907602
    ],
    [
      1.726505716539243e-17,
      -0.021674363742884728,
      0.027683918614822833,
      0.13249823379165254,
      -0.1731019207945083,
      -0.32461455689278834,
      -0.0431423220016387,
      0.0014831535038091481,
      -5.551115123125783e-17,
      -0.050412929062106676,
      0.038218871494198774,
      0.14027828386429375,
      0.01946695766789404,
      -0.34575068740483184,
      -0.1299914336987734,
      0.0007415767519045411,
      -4.336808689942018e-19,
      -0.06827203856564439,
      -0.08031946085049486,
      -0.0211020995869796,
      0.09035005949247663,
      -0.2082875817977635,
      -0.08240210145930814,
      0.001019713625141719,
      6.462348535570529e-27,
      -0.017042868407973664,
      -0.0911261290304148,
      -0.06410056619970637,
      0.10874816958088293,
      0.14221230283035516,
      0.09869146668057573,
      -4.092601131822876e-34,
      1.4293785611083658e-31,
      0.08393882102183031,
      0.032146652987579814,
      -0.006411430224422678,
      0.08649943847033424,
      0.4083292216788741,
      0.19206843909445054,
      1.7230333765254961e-31,
      9.147852573233073e-32,
      -0.04203411678065793,
      -0.22185392344091723,
      0.011336169404147747,
      -0.05443871702740398,
      0.006182435511651109,
      0.1336613678103854,
      -0.00022548865257162101,
      -2.2430681693697178e-32,
      -0.06352853717268955,
      -0.30179423438382535,
      -0.0036729061434291987,
      -0.23799865590542627,
      -0.21074459485056732,
      0.08691062046857452,
      0.002021276506717245,
      -0.0,
      -0.014109829320091534,
      0.02588541801253373,
      0.06750079983576242,
      -0.12187711899857338,
      -0.2062465334628256,
      -0.03644610048446779,
      0.004399214191171452
    ]
  ],
  "NMFDictionary": [
    [
      0.0,
      0.0,
      0.0,
      1.5441604239500797,
      1.9012605676654932,
      0.0,
      0.0,
      0.05080972355086669,
      0.0,
      0.0,
      0.3029069175921904,
      3.112461166043084,
      1.0702946398886408,
      0.0,
      0.0,
      0.025404861775433343,
      0.0,
      0.0,
      0.0,
      0.7160712143784093,
      0.0,
      0.0,
      0.0,
      0.002698306125369652,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.05409496348256024,
      0.0,
      0.0,
      0.4939804774344226,
      3.4722482526873244,
      5.41768520707558,
      3.074780665828962,
      0.0,
      0.2761969893919824,
      0.0,
      0.0,
      1.0386473916560512,
      5.05980945742773,
      6.227970343843308,
      2.347029476271315,
      0.0,
      0.0,
      0.002143229400795195,
      0.0,
      0.0800235387575903,
      1.5722156228392756,
      4.109973481173683,
      0.9861873934277893,
      0.0,
      0.0,
      0.01933768294641416,
      0.0,
      0.0,
      0.0,
      1.1057980783692247,
      0.6395226166829707,
      0.19220520903908203,
      0.5127078613087577,
      0.0
    ],
    [
      0.0,
      0.0,
      0.0,
      0.38762067145632323,
      2.3474879186173485,
      2.123718672561504,
      0.5525655189020865,
      0.0362210128546993,
      0.0,
      0.0,
      0.05139936781392952,
      0.16506025469835134,
      1.6674889350843043,
      3.952650096955814,
      1.21286935462243,
      0.01811050642734965,
      0.0,
      0.0,
      0.0,
      0.0,
      0.7931637514350768,
      4.342132110293485,
      1.0661456514389451,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.5229700728131597,
      4.050651215299685,
      0.5509012592651022,
      0.0,
      0.0,
      0.04163190315854878,
      0.032592750275335196,
      0.0,
      1.8699627803404546,
      3.0975537131110236,
      0.7779345635558496,
      0.0,
      0.0,
      0.09420826910556371,
      0.0,
      0.0,
      1.602340397888248,
      1.967534670742872,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.9154784606157262,
      1.431687063134114,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.6899947532113914,
      0.44335172528884287,
      0.0,
      0.0,
      0.0
    ],
    [
      0.0,
      0.2389733324319533,
      2.2911992545194093,
      2.5321424244835393,
      0.8525930064946209,
      0.41703188061996177,
      0.06010393795753839,
      0.0,
      0.0,
      0.7321228974256263,
      2.8081336837491992,
      1.332052343644085,
      0.6368404072418592,
      0.7653289078404563,
      0.08782730081042157,
      0.0,
      0.0,
      0.5790882312296229,
      1.0581956130953414,
      0.0,
      0.20407040067179366,
      0.08171871643314522,
      0.0,
      0.0010341218391138093,
      0.0,
      0.005412453824751077,
      0.005458287799448128,
      0.32441203468496044,
      0.970043996522572,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.5876574106546391,
      0.3486422987010374,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.1780113322262794,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.10496122160812589,
      1.1185694188987667,
      1.5011755956978223,
      0.5031169659031816,
      0.0,
      0.0,
      0.0,
      0.0,
      0.23747008026311148,
      2.4193188142072475,
      2.618801190537946,
      0.1781200599939386,
      0.0,
      0.0,
      0.004533816520297242
    ],
    [
      0.0,
      0.0,
      0.1389811298558834,
      1.0840240762016207,
      0.3243112854620603,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0686817172983392,
      1.172354652797822,
      0.47112581166894024,
      0.0566514594961498,
      0.0,
      0.0,
      0.0,
      0.2147591263869748,
      1.5937409067195525,
      0.6559077344707882,
      0.0,
      0.42340857952005717,
      0.04872994768288849,
      0.0,
      0.0,
      0.3592310085428092,
      1.4021949463678176,
      0.31981325253744397,
      0.0,
      0.4743016355455848,
      0.33587044098936625,
      0.0,
      0.0,
      0.3249509579876858,
      0.9253566618642607,
      0.0,
      0.0,
      0.7228225806980438,
      0.39913571045002705,
      0.0,
      0.0,
      0.13999172565033086,
      0.9174489780411313,
      0.0,
      0.0,
      1.1028325148993243,
      0.8859182703523643,
      0.0017372490440941142,
      0.0,
      0.05806114617331466,
      1.084885129867727,
      0.6552697369031286,
      0.4845527562122459,
      1.2886516165760233,
      0.8279673826124611,
      0.013516568368700072,
      0.0,
      0.0,
      0.1757108263965794,
      1.0741117264318603,
      1.3601840401581817,
      0.8110364858805509,
      0.16872752994870158,
      0.001896673476734329
    ],
    [
      0.0,
      0.039127172404162185,
      0.0,
      0.0,
      0.7975514901085256,
      0.5553996526083441,
      0.07547893395322529,
      0.0,
      0.0,
      0.01436103234736893,
      0.0,
      0.40093720844021674,
      0.3469729449296081,
      0.18987505100954583,
      0.032868825443909705,
      0.0,
      0.0,
      0.10018028994812345,
      0.8016789205320481,
      0.6075213983966253,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.3985868617092363,
      1.591349066334724,
      0.8846906402577438,
      0.0,
      0.16596821283609015,
      0.09797355553833445,
      0.0,
      0.0,
      0.2958527952336611,
      0.8999185915595669,
      0.6823842117558109,
      0.6155742041557309,
      0.3726728594008783,
      0.06525278111249773,
      0.0,
      0.0,
      0.0,
      0.0,
      0.3792344138423594,
      1.3596693644905413,
      0.343982893467243,
      0.0,
      0.0004669160363354797,
      0.0,
      0.0,
      0.0,
      0.09005467010486258,
      1.042368491457036,
      0.0,
      0.0,
      0.0017399116841953258,
      0.0,
      0.027593079077030024,
      0.0,
      0.0,
      0.3752472143603953,
      0.0,
      0.0,
      0.0
    ],
    [
      0.0,
      0.0,
      0.0,
      0.03790695948707647,
      0.07380037594508963,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.17068066962683606,
      1.0879941589969233,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0771356976561621,
      1.8475654965166224,
      0.15730005620658963,
      0.0,
      0.00046816094700962384,
      0.0,
      0.0,
      0.0,
      1.3234344308517165,
      1.5578498099075073,
      0.01263741848283129,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.1255178754170663,
      0.5295254920388891,
      0.19300423547812778,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.39418510479433255,
      0.2660899874914557,
      0.0,
      0.0,
      0.03613889636105242,
      0.08294423206394859,
      0.0,
      0.2822447866897281,
      0.8259927157535538,
      0.30931462848306984,
      0.0049537497438792025,
      0.0,
      0.0,
      0.0,
      0.0,
      1.2304607053116068,
      1.1665913067645528,
      0.22849634963551235,
      0.008087822781391562
    ]
  ],
  "selected": [
    {
      "source_row": 242,
      "label": 8,
      "reserved_position": 0,
      "observed": [
        0.0,
        0.0,
        0.125,
        0.75,
        0.75,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.4375,
        1.0,
        0.9375,
        0.5625,
        0.0625,
        0.0,
        0.0,
        0.0,
        0.375,
        0.875,
        0.8125,
        0.9375,
        0.1875,
        0.0,
        0.0,
        0.0,
        0.0625,
        1.0,
        1.0,
        0.25,
        0.0,
        0.0,
        0.0,
        0.0,
        0.4375,
        1.0,
        0.875,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0625,
        0.9375,
        0.5625,
        1.0,
        0.3125,
        0.0,
        0.0,
        0.0,
        0.125,
        0.8125,
        0.8125,
        1.0,
        0.625,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0625,
        0.6875,
        0.75,
        0.3125,
        0.0,
        0.0
      ],
      "mean": [
        0.0,
        0.029513888888888888,
        0.33958333333333335,
        0.6989583333333333,
        0.7090277777777778,
        0.3420138888888889,
        0.06145833333333333,
        0.003472222222222222,
        0.0,
        0.09583333333333334,
        0.6069444444444444,
        0.7381944444444445,
        0.7114583333333333,
        0.528125,
        0.1125,
        0.001736111111111111,
        0.0,
        0.12083333333333333,
        0.5524305555555555,
        0.4840277777777778,
        0.5013888888888889,
        0.515625,
        0.1,
        0.00034722222222222224,
        0.0,
        0.12881944444444443,
        0.54375,
        0.5625,
        0.6079861111111111,
        0.49756944444444445,
        0.121875,
        0.0,
        0.0,
        0.1375,
        0.5493055555555556,
        0.6076388888888888,
        0.6684027777777778,
        0.5256944444444445,
        0.16180555555555556,
        0.0,
        0.0,
        0.09409722222222222,
        0.4722222222222222,
        0.5114583333333333,
        0.5715277777777777,
        0.5069444444444444,
        0.1954861111111111,
        0.00034722222222222224,
        0.0,
        0.03611111111111111,
        0.44375,
        0.6194444444444445,
        0.675,
        0.5128472222222222,
        0.18611111111111112,
        0.004166666666666667,
        0.0,
        0.028819444444444446,
        0.36666666666666664,
        0.7041666666666667,
        0.6895833333333333,
        0.3871527777777778,
        0.09895833333333333,
        0.0024305555555555556
      ],
      "PCA6": [
        -5.714505026379849e-18,
        0.010315371400982046,
        0.21413378004056632,
        0.5459953039622931,
        0.7757685750471742,
        0.42139256983693824,
        0.03958781704428483,
        0.0024556314062898557,
        -2.8403522472947597e-17,
        0.08584143731513907,
        0.37604450474155454,
        0.6583034629206216,
        0.825173135120209,
        0.598801194322239,
        0.11979011402474665,
        0.0012278157031449443,
        2.0990364634985422e-19,
        0.05703924027588912,
        0.2703230323554729,
        0.6475045216668123,
        0.7982735237368772,
        0.5652945001441947,
        0.08243653872075479,
        0.0004231426484940594,
        -3.3679024686044546e-27,
        -0.012455254225620022,
        0.22588145398802667,
        0.7238360276950319,
        0.8576913934851429,
        0.29176114435757494,
        -0.028933714106123345,
        2.154551388582862e-34,
        -7.52496875324592e-32,
        0.029454652634336012,
        0.4774967523308831,
        0.9418380994968882,
        0.898764912773996,
        0.11695376374262073,
        -0.033813459804789475,
        -9.070915621611308e-32,
        -4.8158903908214123e-32,
        0.15639807658030283,
        0.7804371578413638,
        0.8371796194755361,
        0.6570270215145126,
        0.25506510840558055,
        0.05241111963297748,
        0.0005088293653162718,
        1.1808640723433936e-32,
        0.07455899129268306,
        0.6494750636806359,
        0.7252499660719293,
        0.726425889339318,
        0.5088076633772279,
        0.17527596406271514,
        0.006696627654389681,
        0.0,
        0.006520843749694024,
        0.23375850232076434,
        0.5218862982366157,
        0.8057561989490194,
        0.7104773265433686,
        0.24582159582164026,
        0.0028006985869169186
      ],
      "NMF6": [
        0.0,
        0.038542358145215866,
        0.31888104022359753,
        0.6439370091785646,
        0.759566601469079,
        0.3373920390951047,
        0.07118291561156047,
        0.01050989532050747,
        0.0,
        0.10289116278652169,
        0.4596378009822253,
        0.7957004494881501,
        0.9394107729178276,
        0.5063555880633323,
        0.1310547120655265,
        0.005254947660253735,
        0.0,
        0.09934569607388584,
        0.29954115351009797,
        0.6823061403983399,
        0.9244194847656744,
        0.5003531615218783,
        0.10158425535130881,
        0.000727584237004824,
        0.0,
        0.06677926660212292,
        0.26361860696684214,
        0.7682673521334213,
        0.9698013192167234,
        0.4224332387396139,
        0.08163977576165267,
        0.0,
        0.0,
        0.1233539349822272,
        0.6400194819114509,
        0.9918760680700417,
        0.9777936606709756,
        0.44862435470893347,
        0.13086628094736047,
        0.0,
        0.0,
        0.15735541024999558,
        0.7290151890902906,
        0.9492105284782633,
        0.6745320881494521,
        0.4366936361937262,
        0.1396831291841614,
        0.00040851199157336434,
        0.0,
        0.04310514297913753,
        0.4367298471892713,
        0.8096919357237693,
        0.6747062924757767,
        0.5332160968907882,
        0.15750847208471191,
        0.005480830259395355,
        0.0,
        0.03667503130969009,
        0.33741021886361044,
        0.6060092840982038,
        0.7896192720490767,
        0.5651857762948261,
        0.17730951334748107,
        0.004266755413830303
      ],
      "PCA6_coordinates": [
        -0.23779873919888678,
        -0.4780452673327731,
        -0.42258691260270836,
        0.8249965888782711,
        -0.3387584714756587,
        -0.526450372070148
      ],
      "NMF6_amounts": [
        0.139709373461349,
        0.09418015700322843,
        0.1377144797289649,
        0.024102026912130786,
        0.14394779009518485,
        0.44470182552051124
      ],
      "rowMSE": {
        "mean": 0.04595146273389275,
        "PCA6": 0.021948620787064027,
        "NMF6": 0.026957889373735507
      }
    },
    {
      "source_row": 256,
      "label": 0,
      "reserved_position": 1,
      "observed": [
        0.0,
        0.0,
        0.25,
        0.6875,
        0.9375,
        0.5,
        0.0,
        0.0,
        0.0,
        0.0,
        0.8125,
        1.0,
        0.6875,
        0.8125,
        0.4375,
        0.0,
        0.0,
        0.1875,
        1.0,
        0.75,
        0.0,
        0.25,
        0.5,
        0.0,
        0.0,
        0.375,
        1.0,
        0.3125,
        0.0,
        0.25,
        0.5,
        0.0,
        0.0,
        0.4375,
        0.5625,
        0.0,
        0.0,
        0.5625,
        0.4375,
        0.0,
        0.0,
        0.25,
        0.625,
        0.0,
        0.125,
        0.9375,
        0.125,
        0.0,
        0.0,
        0.0625,
        1.0,
        0.75,
        0.875,
        0.625,
        0.0,
        0.0,
        0.0,
        0.0,
        0.25,
        0.875,
        0.875,
        0.0625,
        0.0,
        0.0
      ],
      "mean": [
        0.0,
        0.029513888888888888,
        0.33958333333333335,
        0.6989583333333333,
        0.7090277777777778,
        0.3420138888888889,
        0.06145833333333333,
        0.003472222222222222,
        0.0,
        0.09583333333333334,
        0.6069444444444444,
        0.7381944444444445,
        0.7114583333333333,
        0.528125,
        0.1125,
        0.001736111111111111,
        0.0,
        0.12083333333333333,
        0.5524305555555555,
        0.4840277777777778,
        0.5013888888888889,
        0.515625,
        0.1,
        0.00034722222222222224,
        0.0,
        0.12881944444444443,
        0.54375,
        0.5625,
        0.6079861111111111,
        0.49756944444444445,
        0.121875,
        0.0,
        0.0,
        0.1375,
        0.5493055555555556,
        0.6076388888888888,
        0.6684027777777778,
        0.5256944444444445,
        0.16180555555555556,
        0.0,
        0.0,
        0.09409722222222222,
        0.4722222222222222,
        0.5114583333333333,
        0.5715277777777777,
        0.5069444444444444,
        0.1954861111111111,
        0.00034722222222222224,
        0.0,
        0.03611111111111111,
        0.44375,
        0.6194444444444445,
        0.675,
        0.5128472222222222,
        0.18611111111111112,
        0.004166666666666667,
        0.0,
        0.028819444444444446,
        0.36666666666666664,
        0.7041666666666667,
        0.6895833333333333,
        0.3871527777777778,
        0.09895833333333333,
        0.0024305555555555556
      ],
      "PCA6": [
        -1.2529979169509638e-17,
        0.05222771050074658,
        0.34435208840096554,
        0.7583742726132155,
        0.752081055456771,
        0.4529422227440437,
        0.09800278471741292,
        0.0033323865427158615,
        5.1680403120737696e-17,
        0.133202508637625,
        0.8484193452039361,
        0.7849176217501572,
        0.49923994456680615,
        0.6929653904644921,
        0.19015812451208247,
        0.0016661932713579442,
        2.4416580259850917e-19,
        0.27655921117787313,
        1.1259632743458496,
        0.37200941577389046,
        -0.08989691665547972,
        0.6470620213093581,
        0.20949298180534995,
        -0.0011777840822953579,
        -3.483135736839424e-27,
        0.3413208120822841,
        1.1179448271544774,
        0.3403242561255946,
        -0.05432693318644477,
        0.5501291207171329,
        0.233366525478396,
        2.191898811947016e-34,
        -7.655408062012817e-32,
        0.226131353993576,
        0.7670745994653816,
        0.2113553779705088,
        0.1565596508861502,
        0.5351485543442018,
        0.23023872565697873,
        -9.22815268163969e-32,
        -4.8993699950928475e-32,
        0.1197989651870157,
        0.6334008094532402,
        0.20543518974402336,
        0.40760782157938463,
        0.8436709103424374,
        0.329263007843305,
        0.0008464350102360457,
        1.2013334056250361e-32,
        0.0702467321033996,
        0.7069427871443277,
        0.5777533752829943,
        0.8292799945763665,
        0.8559784206805165,
        0.2253433992676203,
        0.0020246692569409184,
        0.0,
        0.046919552608222365,
        0.37581639538445816,
        0.8530631706912167,
        0.8095009779494581,
        0.34343960195109724,
        0.01517368406677018,
        -0.0031296238480530434
      ],
      "NMF6": [
        0.0,
        0.03677660461826036,
        0.33722075288026054,
        0.858617879622351,
        0.6167183032532997,
        0.3330993931831034,
        0.06567837986680121,
        0.0028435469284298614,
        0.0,
        0.08928781291359199,
        0.8557170346481712,
        0.8355436670902588,
        0.5099164774214954,
        0.4593048576632334,
        0.10954541053800067,
        0.0014217734642149307,
        0.0,
        0.19500012355677265,
        1.0790431049476172,
        0.45576095018168017,
        0.08412037366348452,
        0.5451392050795008,
        0.10456611663898442,
        0.0001268330996887128,
        0.0,
        0.2640871477959411,
        1.036849795106559,
        0.39011293444765854,
        0.2295241291920242,
        0.5750242550750617,
        0.22730586377919484,
        0.0,
        0.0,
        0.228082191871189,
        0.659703161660993,
        0.23079530381281424,
        0.32509356668152783,
        0.6697404716441742,
        0.26853312159457704,
        0.0,
        0.0,
        0.07739041063268667,
        0.45701496632966926,
        0.1170010347272782,
        0.4272959280356322,
        0.7629809466935046,
        0.431875253160913,
        0.0009544990499071533,
        0.0,
        0.040803197008705015,
        0.6634602772605407,
        0.523882360931654,
        0.6734734588841605,
        0.7367210698544289,
        0.4036248432177747,
        0.007012086693308598,
        0.0,
        0.03404377503910752,
        0.3701942701116121,
        0.8860504589649743,
        0.8020200738715988,
        0.3957423060476064,
        0.08324265670356072,
        0.0014578313783657434
      ],
      "PCA6_coordinates": [
        0.8237331046796642,
        0.31723563303664704,
        0.8222278385763834,
        -1.0056235064948278,
        0.21847427557562557,
        -0.5355759677881747
      ],
      "NMF6_amounts": [
        0.001930674609957873,
        0.07579715940701616,
        0.11761046325720487,
        0.48748882105020747,
        0.22160661637532345,
        0.0
      ],
      "rowMSE": {
        "mean": 0.06796480908805942,
        "PCA6": 0.024197862895577522,
        "NMF6": 0.03327840298161405
      }
    }
  ]
}
```


These two studies support reconstruction comparisons within this small, balanced early-index subset. The 300 rows are the first 30 examples per digit from the scikit-learn copy of the UCI collection's test portion, selected before the local split. Writer IDs are not available here, so this is not a held-out-writer study or a claim about handwriting outside this collection. It is not MNIST, the whole UCI corpus or a recognition benchmark.

We can now distinguish an inspected representation, a validation-based setting choice and a reserved comparison. A final question remains even when all three are done carefully: can the observed matrix uniquely determine the patterns? The next section uses exact small examples to examine that issue without mixing it up with testing error.

## 14. Decide what a factorization can identify

The reserved comparison tells us how accurately a representation reconstructs new rows. Does a good reconstruction also tell us which patterns produced the observations? Return to a small exact example so we can separate this question from solver error.

### See two different dictionaries explain the same row

Can two genuinely different nonnegative explanations give exactly the same measurements? Watch the directions change while their sum stays fixed.

<!-- figure:D50 -->

The observed row is `[2,3,3]`. The first dictionary has C0=`[1,1,1]`, C1=`[0,1,1]`, with amounts `[2,1]`. This is the **separate shear example from Amount is not probability or identity**, section 2; it is not the earlier H0=`[[1,0,1],[0,1,1]]`. We changed the example because H0 contains a zero that would forbid the particular shear below.

Keep C1 fixed. As t rises from 0 to 1, replace C0 by `[1,1−t,1−t]` and increase C1's amount to `1+2t`. Two units of C0 lose `2t` from the second and third bins, while the added `2t` units of C1 return precisely that intensity. Every component and amount remains nonnegative. At t=0.5 the alternative factors are amounts `[2,2]`, patterns `[[1,0.5,0.5],[0,1,1]]`; both still produce `[2,3,3]`. At t=1 the first pattern has become `[1,0,0]`, and the amounts are `[2,3]`.

The first ray changes its direction, so this is more than rescaling or reordering component labels. In matrix form, write

\[
 T=\begin{bmatrix}1&t\\0&1\end{bmatrix},\qquad
 T^{-1}=\begin{bmatrix}1&-t\\0&1\end{bmatrix}.
\]

Then `(wT)(T⁻¹H) = wH`, with `wT=[2,1+2t]` and `T⁻¹H=[[1,1−t,1−t],[0,1,1]]`. T⁻¹ contains a negative entry, but its product with **this particular H** is nonnegative throughout the declared range. A transformation need not be nonnegative entrywise for its transformed factors to be feasible. Conversely, an arbitrary invertible transformation is not automatically allowed: it can create negative amounts or pattern cells. Substituting H0 would give a negative second cell in the first transformed pattern for any positive t, explaining the earlier warning concretely.

**Identifiability** asks whether the observations and stated assumptions determine the desired factors, allowing the unavoidable naming and unit conventions. This witness shows that nonnegativity and exact reconstruction alone do not always identify them. It does not prove all datasets are ambiguous. Additional structure can make recovery possible; the next section studies the particularly tangible assumption that some observed rows are pure patterns.

### Understand what one nonnegative rank-one term can cover

How many additive components can an exact matrix require? Start with the cells that one component is allowed to make positive.

<!-- figure:D51 -->

In the outer-product picture, a nonnegative column u selects some observation rows and a nonnegative row v selects some feature columns. Their term is `uv`: cell `(i,j)` receives `u_i v_j`. Wherever both selected entries are positive, that cell is positive. Its positive cells therefore form a row-set × column-set **rectangle**. Rectangle means this Cartesian product, not necessarily adjacent cells in the displayed matrix.

For example, u=`[1,0,2,0]ᵀ` and v=`[0,3,0,4]` make positive cells at rows0/2 and columns1/3, with values3/4 in row0 and6/8 in row2. The holes between these positions do not change the rectangle argument. This is the same component outer product introduced in **Build one observation from positive amounts**, now used to reason about support—the locations of nonzero entries.

Consider the exact binary matrix

\[
 X_\square=\begin{bmatrix}
 1&1&0&0\\
 0&1&1&0\\
 0&0&1&1\\
 1&0&0&1
 \end{bmatrix}.
\]

The four outlined diagonal cells are positive. Could a single nonnegative rank-one term contribute positively to two of them, `(i,i)` and `(j,j)`? That would require `u_i,v_i,u_j,v_j` all positive. Its cross cells `(i,j)` and `(j,i)` would then also be positive. But for every pair of distinct outlined diagonal cells in this matrix, at least one cross cell is an observed zero. For example, to cover `(0,0)` and `(1,1)`, the rectangle would make `(1,0)` positive even though X there is zero.

There is no negative component to cancel that forbidden positive entry. In an exact sum of nonnegative terms, every term must be zero at every zero of X. Thus no one term can cover two of the four chosen diagonal positives. Each chosen positive must be covered by at least one term, so at least four terms are needed. The diagonal selector only highlights one witness and its forbidden cross cells; it never changes X or performs a numerical factorization.

This is a **support lower bound**. A chosen set of positive entries with these pairwise forbidden cross cells is often called a fooling set in rectangle-cover arguments. We have proved the four-component lower bound directly; learning that name is not required to follow the proof. Different matrices require different lower-bound arguments, and a rectangle cover alone need not solve the numerical factorization problem because positive values also have to agree.

### Separate ordinary rank from nonnegative rank

Why not read the number of required components from ordinary matrix rank? The same four-by-four example makes the difference exact.

<!-- figure:D52 -->

The ordinary rank is 3. Its top-left 3×3 submatrix is upper triangular with all diagonal entries 1, so its determinant is 1 and the rank is at least 3. The four full rows satisfy `row0 − row1 + row2 − row3 = 0`, so the rank is at most 3. Together these facts give rank exactly 3, without a numerical tolerance or a fitted model.

The **nonnegative rank**, written rank₊(X), is the smallest k for which an exact product X=WH exists with both factors nonnegative and inner dimension k. The support proof requires at least 4 here. The product `I₄ X_square` is a valid nonnegative factorization with four components, so the lower and upper bounds meet: rank₊(X_square)=4.

In general,

\[
 \operatorname{rank}(X)\leq\operatorname{rank}_+(X)
 \leq\min(n,d),\qquad X\geq0.
\]

The first inequality follows because any n×k times k×d product has ordinary rank at most k, regardless of signs. For the second, `I_n X` uses n nonnegative terms and `X I_d` uses d; choose the smaller. These bounds concern exact algebraic representation. A requested rank in an approximate fitting routine is a model choice, not a computed certificate of nonnegative rank.

The positive-epsilon inset changes a premise: adding a small positive quantity to every cell removes all exact zeros. A component is no longer forbidden from covering a cross cell just because that cell used to be zero. The four-rectangle proof therefore no longer establishes the new matrix's nonnegative rank. This does not, by itself, prove that its nonnegative rank has dropped; the argument simply stopped applying. Similarly, allowing a nonzero approximation error weakens an exact support obstruction. A tiny cross-cell value or a small Frobenius error is not an exact zero.

The practical consequence is to keep three questions separate. **Representation:** how many nonnegative terms suffice to the required accuracy? **Optimization:** did this algorithm find a good solution for the chosen k? **Identification:** do the observations and external assumptions determine the scientifically intended patterns? A small error, a stationarity diagnostic and a rank claim answer different parts of that list.

A quick changed case checks the logic. If two observed features are exact copies, ordinary rank can decrease; that fact alone still does not specify which physical sources exist. If a known pure-pattern observation is added, it may constrain the feasible cone substantially. That is why the next section changes the information available, rather than merely asking the same optimizer to run longer.

## 15. When anchors help recover the dictionary

The previous section showed that exact reconstruction need not identify the patterns. What extra observation would help? If we have actually measured a pure pattern, its direction is no longer hidden inside an arbitrary mixture.

### Turn a cone into a slice we can see

How can we compare mixture directions without confusing them with overall brightness? Divide a positive observation by its total intensity.

<!-- figure:D53 -->

Here we temporarily use two features so the entire geometry fits on the page. The two patterns are P0=`[1,0]` and P1=`[0,1]`. Amounts `[2,1]` produce the row `[2,1]`. Dividing that row by its mass, 3, gives `[2/3,1/3]`. Both normalized coordinates add to one, so the point lies on the line joining the two normalized patterns. When the first amount becomes zero and the second stays one, the point reaches P1. Brightness changed, but we can now inspect direction on a common slice.

For general patterns, their masses also matter. Let `t_c = sum_j H_cj > 0`, let `p_c = H_c/t_c` be a unit-mass pattern, and let `s_i = sum_j x_ij > 0`. If the exact mixture is x_i = sum_c W_ic H_c, then

\[
 z_i=\frac{x_i}{s_i}=\sum_c a_{ic}p_c,
 \qquad a_{ic}=\frac{W_{ic}t_c}{s_i},
 \qquad \sum_c a_{ic}=1.
\]

The a coefficients are fractions of this row's total modeled intensity. They are not automatically class probabilities or physical material fractions. Dividing W by its own row sum instead would generally be wrong when the pattern masses differ. The all-zero observation has s_i=0 and no direction on this slice: keep its original ID, exclude it from geometric selection, and do not divide by zero. An unused zero pattern likewise has no direction to recover.

### Locate a pattern that is actually observed

What makes an observed point an **anchor**? It is a pure-pattern direction already present among the measurements, rather than an imagined vertex inferred outside them.

<!-- figure:D54 -->

The observed rows here are A0=`[1,0]`, A1=`[0,1]`, M0=`[0.75,0.25]` and M1=`[0.25,0.75]`. The two A rows are anchors, and the M rows are mixtures between them. The new-mixture control draws `[t,1−t]`; at an endpoint it coincides with an anchor and adds no new direction. The line segment and all points enclosed by it form the **convex hull** of the anchors: all sums of these points with nonnegative weights adding to one.

For this lesson, **row separability** means that each dictionary direction has at least one pure observed row, perhaps with a different positive intensity before normalization, and that all other rows are its nonnegative mixtures. The original anchor paper writes observations as columns; our observations are rows, so its data matrix is the transpose of ours. This orientation matters: “pure documents” and “words unique to a topic” are different assumptions, depending on which axis holds observations.

We also require the k normalized pattern rows to be linearly independent, so k cannot exceed the feature count. This is stronger than merely having k different-looking rows. With exact separability and independent patterns, the anchors are visible extremal directions. Without pure observations, a greedy selection still returns observed rows, but calling them recovered true patterns would be unsupported. A good reconstruction after selection cannot verify separability by itself.

### Select a direction, then remove only its span

How can we find the anchors without testing every subset? Select a far-reaching row, project its direction out, then look for a genuinely new direction.

<!-- figure:D55 -->

At the initial step the squared lengths of A0, A1, M0 and M1 are `1,1,0.625,0.625`. A0 and A1 tie; the stable source-ID rule chooses A0 first in this fixture. Its unit direction is `[1,0]`. Removing each row's projection onto that direction leaves residual rows `[0,0]`, `[0,1]`, `[0,0.25]`, `[0,0.75]`. Their **lengths** are `0,1,0.25,0.75`; their squared lengths are `0,1,0.0625,0.5625`. Selection uses squared length throughout, so A1 wins next. Two independent directions now span all four observations, leaving zero residual.

The projection is not an NMF reconstruction. It is a temporary geometric calculation used to choose row IDs. In general its residuals have negative entries, even though the original observations are nonnegative. For example, projecting `[0.2,0.8]` away from the direction `[0.8,0.2]` leaves approximately `[-0.176471,0.705882]`. Clipping that negative cell would change the geometry and the algorithm. The selected dictionary itself always comes from the original normalized nonnegative observations, not from these signed residuals.

Write R for the current normalized residual table and u for the selected residual row. Its unit vector is q=u/||u||. Every row changes by

\[
 R_{i,:}\leftarrow R_{i,:}-(R_{i,:}q^\top)q.
\]

The scalar in parentheses measures how far row i lies along q; subtracting that copy leaves the part perpendicular to q. This is the same projection idea used by ordinary QR, applied successively after each choice. The routine stops with an explicit refusal if a requested next direction is zero or too small relative to the declared tolerance. Duplicate observations can have different global IDs, but they do not create another independent direction.

Why does selecting the largest squared length work in the ideal case? A mixture of distinct residual anchors cannot have a larger squared length than every anchor that enters it. The exact identity behind that statement, for nonnegative weights α adding to one, is

\[
 \left\|\sum_c\alpha_cv_c\right\|^2
 =\sum_c\alpha_c\|v_c\|^2
 -\frac12\sum_{c,e}\alpha_c\alpha_e\|v_c-v_e\|^2.
\]

The subtracted term is nonnegative and is strictly positive when different positively weighted vectors occur. Thus a genuine mixture is strictly below at least one participating extreme in squared length. After projecting out a selected anchor, the other independent anchor directions remain independent and nonzero; the residual observations are still the same mixtures of those projected anchors and the selected zero directions. Repeating the argument selects a new pure direction. This is the noiseless mechanism behind the separable selection result, not a guarantee for arbitrary noisy data. The [Gillis–Vavasis primary treatment](https://arxiv.org/pdf/1208.1237) states the precise assumptions and recovery theorem; its broader noisy theorem has additional conditions not established by these examples.

If squared selection values are exactly equal, the code compares their **original normalized row** squared norms, before any projection, then the smallest global ID. “Original” here means the normalized input to the selection algorithm, not the raw pre-normalization brightness. Multiplying an observation by 100 should not give it priority merely because we changed its intensity units. Rank tolerance does not merge near-equal selection scores into a tie; it decides whether another independent direction is numerically supported.

### See why nearly parallel patterns are fragile

How much information separates two almost identical directions? Make that separation visible before trusting a noisy recovery result.

<!-- figure:D56 -->

P0 is `[1,0]`; P1 is `[1−ε,ε]`. Their Euclidean separation is √2ε, and their angle is `atan2(ε,1−ε)` radians. At ε=0.1 their distance is about 0.141421; at ε=0.01 it is about 0.014142. The second projection now has much less signal to work with. At ε=0 the directions coincide, rank drops and a request for two independent anchors must fail.

An error in a measured row can move a nearby mixture past a supposed pure row or blur the distinction between these two directions. The small static perturbation illustrates this possibility; it is not an experimentally measured recovery-error curve. Our tolerance records a numerical decision at a chosen scale, not a universal noise threshold or proof that the physical data satisfy the theorem. Reorthogonalization, preconditioning and robust/noisy separable methods can be appropriate for harder instances, but their assumptions and costs require separate assessment. A positive numerical residual alone does not establish reliable source recovery.

### Implement the bounded route and check the ordinary primitives

How do we keep the geometry, source IDs and query units consistent in code? Normalize for selection, preserve the mapping, then encode original observations against the selected unit-mass patterns.

`normalized_rows` validates finite nonnegative input, returns positive-row flags and leaves zero rows at zero. `global_ids` requires one unique nonnegative integer ID per original row; an array position is a separate address. `select_anchors` stores signed residuals, chooses each squared-norm maximum and applies the projection above. `chosen` excludes already selected rows. Returned dictionary, normalized observations, directions and residual arrays are read-only copies. Failed selection returns no partially published result.

The rank refusal uses `tolerance * largest initial normalized-row length`. A relative tolerance below one is required, and rank must fit both the feature count and positive-row count. Very small independent directions can still be refused under this numerical rule. Roundoff in successive projections can accumulate, especially for nearly dependent data; do not interpret the requested integer k as a certified algebraic rank. The explicitly bounded adapter favors transparent, checked small-to-moderate dense problems, not an unqualified claim of optimal numerical behavior for every scale.

`qr_residual` uses the public [NumPy reduced QR](https://numpy.org/doc/stable/reference/generated/numpy.linalg.qr.html) on the transpose of the **selected original dictionary**. Its columns are an orthonormal basis for that selected span. Subtracting `(Z@Q)@Q.T` checks the final residual by a different primitive. QR is a reference for the span after selection, not a public API that certifies separability or promises the same pivot choices. `encode_selected` reuses the complete public NNLS adapter from **Fit both factors and decide when to stop**, section 6. It solves each original-unit observation against the selected normalized dictionary. For the exact fixture it reconstructs every row, including the zero row. It does not pretend the signed projection residuals are observation amounts.

Normalization takes O(nd) arithmetic. Each selection/projection takes O(nd), so k steps take O(nkd); selecting maxima adds O(nk). Retained normalized observations and residuals require O(nd), directions and selected patterns O(kd), with IDs/flags O(n). One projection creates an O(nd) temporary; it never allocates an n×k×d tensor or n×n projector. The reference QR costs O(dk²), and applying its basis costs O(nkd); it is an explicit independent check rather than mandatory repeated work in a streaming browser. Re-encoding uses the earlier NNLS route and its solver-dependent active-set work, so it has a separate cost. These bounds do not include storing every intermediate residual for an unbounded animation; the small lesson trace stores only its finite fixture states.

Save `nmf_anchors.py` beside `nmf_arrays.py`, `nmf_nnls.py`, `nmf_coordinate.py` and the supplied `centered_pca.py` validation helper. NumPy and SciPy provide QR and convex encoding primitives. Run `python nmf_anchors.py` for this constructed demonstration.


```python
"""Bounded normalized separable-row selection, with IDs and signed residuals."""
from dataclasses import dataclass
import numpy as np

from nmf_arrays import nonnegative_table, nonnegative_scalar, positive_integer, read_only, require_finite
from nmf_nnls import encode_nnls


def normalized_rows(values):
    x = nonnegative_table(values, require_rows=True)
    with np.errstate(over='ignore', invalid='ignore'):
        mass = x.sum(axis=1)
    require_finite(mass, 'Observation row masses')
    positive = mass > 0
    z = np.zeros_like(x)
    z[positive] = x[positive] / mass[positive, None]
    return x, z, mass, positive


def global_ids(values, count):
    ids = tuple(values)
    if len(ids) != count or any(isinstance(x, (bool, np.bool_)) or not isinstance(x, (int, np.integer)) or x < 0 for x in ids):
        raise ValueError('Supply one nonnegative integer global ID per observation')
    ids = tuple(int(x) for x in ids)
    if len(set(ids)) != count:
        raise ValueError('Global observation IDs must be unique')
    return ids


@dataclass(frozen=True)
class AnchorSelection:
    selected_ids: tuple
    selected_positions: tuple
    excluded_zero_ids: tuple
    dictionary: np.ndarray
    normalized_observations: np.ndarray
    residual: np.ndarray
    directions: np.ndarray
    selected_squared_norms: tuple
    relative_tolerance: float


def select_anchors(values, ids, components, *, tolerance=1e-12):
    """Normalize positive rows, select residual norm maxima, project, retain IDs.

    Recovery needs exact separability/full row rank; this routine does not
    certify those assumptions. Ties compare ORIGINAL NORMALIZED row norms,
    then global ID. Near ties are not merged by the rank tolerance.
    """
    x, z, masses, positive = normalized_rows(values)
    ids = global_ids(ids, len(x))
    components = positive_integer(components, 'components')
    tolerance = nonnegative_scalar(tolerance, 'tolerance')
    if tolerance >= 1:
        raise ValueError('Use a relative tolerance smaller than one')
    if components > x.shape[1] or components > int(positive.sum()):
        raise ValueError('Requested rank exceeds feature or positive-row support')
    residual = z.copy()
    original_squared = np.sum(z*z, axis=1)
    threshold = tolerance * np.sqrt(float(original_squared.max()))
    selected, squared_at_selection, directions = [], [], []
    chosen = np.zeros(len(x), dtype=bool)
    for _ in range(components):
        squared = np.sum(residual*residual, axis=1)
        require_finite(squared, 'Residual squared norms')
        candidates = np.flatnonzero(positive & ~chosen).tolist()
        at = min(candidates, key=lambda i: (-float(squared[i]), -float(original_squared[i]), ids[i]))
        norm = np.sqrt(float(squared[at]))
        if norm <= threshold:
            raise ValueError('Fewer independent positive directions than requested at this tolerance')
        direction = residual[at].copy()/norm
        # Modified Gram-Schmidt projection of every row; residuals may be signed.
        coefficients = residual @ direction
        residual -= coefficients[:, None] * direction
        residual[at] = 0.0  # The selected row's exact mathematical residual is zero.
        require_finite(residual, 'Projected residuals')
        selected.append(at)
        chosen[at] = True
        squared_at_selection.append(float(squared[at]))
        directions.append(direction)
    return AnchorSelection(tuple(ids[i] for i in selected), tuple(selected),
                           tuple(ids[i] for i in range(len(x)) if not positive[i]),
                           read_only(z[selected]), read_only(z), read_only(residual),
                           read_only(directions), tuple(squared_at_selection), tolerance)


def qr_residual(selection):
    """Ordinary reduced QR independently checks the selected original span."""
    q, r = np.linalg.qr(selection.dictionary.T, mode='reduced')
    require_finite(q, 'QR basis')
    require_finite(r, 'QR triangular factor')
    z = selection.normalized_observations
    result = z - (z @ q) @ q.T
    return require_finite(result, 'QR residual')


def encode_selected(values, selection, *, max_iter=1000):
    # Dictionary rows have unit mass; amounts retain the original observation units.
    return encode_nnls(values, selection.dictionary, max_iter=max_iter)


def main():
    x = np.array([[1.,0.], [0.,1.], [.75,.25], [.25,.75], [0.,0.]])
    result = select_anchors(x, [0,1,2,3,4], 2)
    amounts, norms = encode_selected(x, result)
    first = select_anchors(x, [0,1,2,3,4], 1)
    print('selected_ids',result.selected_ids,'excluded_zero_ids',result.excluded_zero_ids)
    print('selection_squared_norms',result.selected_squared_norms)
    print('first_projection_residuals',first.residual.tolist())
    print('dictionary',result.dictionary.tolist(),'amounts',amounts.tolist(),'residual_norms',norms.tolist())
    print('QR_residual_agrees',np.allclose(result.residual,qr_residual(result),atol=1e-14))
    duplicate = np.array([[1.,0.],[0.,1.],[.75,.25],[0.,1.],[0.,0.]])
    print('duplicate_source_IDs',select_anchors(duplicate,[42,7,99,10,6],2).selected_ids)
    signed = select_anchors([[.8,.2],[.2,.8],[.5,.5]],[0,1,2],1)
    print('signed_projection',signed.residual.tolist())


if __name__ == '__main__':
    main()
```


This program's actual output shows the initial two-feature fixture, the separate source-ID duplicate case and the signed-residual example. No digit model is retrained.


```text
selected_ids (0, 1) excluded_zero_ids (4,)
selection_squared_norms (1.0, 1.0)
first_projection_residuals [[0.0, 0.0], [0.0, 1.0], [0.0, 0.25], [0.0, 0.75], [0.0, 0.0]]
dictionary [[1.0, 0.0], [0.0, 1.0]] amounts [[1.0, 0.0], [0.0, 1.0], [0.75, 0.25], [0.25, 0.75], [0.0, 0.0]] residual_norms [0.0, 0.0, 0.0, 0.0, 0.0]
QR_residual_agrees True
duplicate_source_IDs (7, 42)
signed_projection [[0.0, 0.0], [-0.176470588235294, 0.7058823529411765], [-0.08823529411764697, 0.35294117647058826]]
```


The duplicate case chooses global IDs `(7,42)`, even though their physical positions in its array are 1 and 0. ID 10 duplicates the first selected direction and is not a third anchor. The excluded zero observation retains its ID for later queries. The final signed numbers agree with the hand projection above.

We have gained recoverability by adding explicit information about the observations, not by declaring every NMF pattern meaningful. The next section takes the same additive mechanism to words and spectra, where the feature units and physical assumptions must be stated again.

## 16. Change application assumptions explicitly

**Can the same additive machinery explain words or light?** The shape of the calculation survives; the meaning of its inputs needs a new argument. [When anchors help recover the dictionary](#15-when-anchors-help-recover-the-dictionary) gave conditions under which observed pure rows can identify patterns. A short document or a measured spectrum does not automatically satisfy those conditions. We will first replace pixel bins with word bins, then deliberately switch to a constructed spectrum to see how a physical constraint changes the answer.

**How does a sentence become one nonnegative row?** Count each retained word in its own named column.

<!-- figure:D57 -->

The five documents in the picture are `orbit rocket orbit`, `rocket orbit rocket`, `goal team goal`, `team goal team`, and `orbit rocket goal team`. The ordered vocabulary is `[goal, orbit, rocket, team]`. Follow both copies of `orbit` in the first sentence into its `orbit` cell: that cell is 2, not two new columns. Its complete row is `[0,2,1,0]`. The next three rows are `[0,1,2,0]`, `[2,0,0,1]`, and `[1,0,0,2]`; the last is `[1,1,1,1]`. A zero says the retained word did not occur in that document. It is an observed count, not a missing measurement.

With documents as rows and vocabulary entries as features, `X ≈ WH` has exactly the orientation we have used throughout. A dictionary row now distributes a component over words. A document's amount multiplies that whole word pattern. In the preserved count experiment, the printed, rounded, unit-row-sum patterns are `[0.5,0,0,0.5]` and `[0,0.5,0.5,0]`. Their component order is the order of that saved run. The mixed document uses amounts `[2,2]`: its two contributions are `[1,0,0,1]` and `[0,1,1,0]`, adding to `[1,1,1,1]`. These are rounded recorded values, not a newly inferred full-precision dictionary.

Normalizing a dictionary row to sum to one is the compensated convention from [Amount is not probability or identity](#2-amount-is-not-probability-or-identity). Its document amounts need not sum to one. Those two amounts sum to four because this representation has four token occurrences. The product is an approximation to counts; it is not a posterior distribution over topics. A label such as “space” can be a useful human interpretation of the `orbit/rocket` pattern, but it is not a theorem that the program discovered a semantic theme or an independent source. Two documents with the same retained counts but different word order are indistinguishable here.

The count program below uses the generalized-KL route taught in [Explain the multiplicative route](#7-explain-the-multiplicative-route). Count nonnegativity makes this loss admissible, including observed zero counts, but a Poisson likelihood interpretation additionally assumes a suitable count-generating model. Word occurrences can be correlated and document length can matter; a useful approximation is not a proof of that generative assumption. A new `rocket team` query is counted in the same four columns and encoded against the existing dictionary. The saved rounded reconstruction `[0.5,0.5,0.5,0.5]` shows that encoding may predict nonzero `goal/orbit` counts even when the query did not contain them: a least-divergence combination of whole patterns cannot independently edit every word.

This is the original complete `nmf_words.py` and its preserved output. The lowercase default tokenizer, vectorizer fit, public KL/MU configuration, dictionary normalization and compensated amounts are all visible. This code was executed for the earlier lesson; its recorded output is reused here, not regenerated for the new example.


```python
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import NMF

documents = ['orbit rocket orbit', 'rocket orbit rocket',
             'goal team goal', 'team goal team',
             'orbit rocket goal team']
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(documents)
model = NMF(n_components=2, init='nndsvda', solver='mu',
            beta_loss='kullback-leibler', max_iter=1000,
            tol=1e-5, random_state=19)
W = model.fit_transform(X)
H = model.components_
mass = H.sum(axis=1)
normalized_patterns = H / mass[:, None]
amounts = W * mass
print(vectorizer.get_feature_names_out())
print(normalized_patterns.round(3))
print(amounts.round(3))
new = vectorizer.transform(['rocket team'])
print((model.transform(new) @ H).round(3))
```



```text
['goal' 'orbit' 'rocket' 'team']
[[0.5 0.  0.  0.5]
 [0.  0.5 0.5 0. ]]
[[0. 3.]
 [0. 3.]
 [3. 0.]
 [3. 0.]
 [2. 2.]]
[[0.5 0.5 0.5 0.5]]
```


**Should every occurrence count equally?** We can learn a fixed word-weighting rule from training documents before encoding a query.

<!-- figure:D58 -->

Here we change to three explicitly named training documents so the weighting arithmetic fits on the page: `orbit orbit rocket`, `rocket team`, and `team team`. The new ordered vocabulary is `[orbit, rocket, team]`; do not carry the previous four-column dictionary into this three-column problem. The count rows are `[2,1,0]`, `[0,1,1]`, and `[0,0,2]`. Document frequency counts **documents containing the word**, rather than occurrences: `orbit` appears in one document, `rocket` in two and `team` in two, even though the last document says `team` twice.

The picture gives each column a fixed multiplier. A rarer training word receives a larger multiplier. With three training documents and the smoothed convention used here, the three multipliers are `1 + log(2)`, `1 + log(4/3)`, and `1 + log(4/3)`, approximately `1.693147`, `1.287682`, and `1.287682`. These are called **inverse document frequency**, or IDF, weights. “Inverse” describes their decreasing dependence on document frequency; it does not mean we simply divide by frequency.

Let `n` be the number of training documents, `df_j` the number containing vocabulary word `j`, and `count_ij` its occurrences in document `i`. Our representation is

\[
\operatorname{idf}_j=1+\log\frac{1+n}{1+\operatorname{df}_j},
\qquad X_{ij}=\operatorname{count}_{ij}\operatorname{idf}_j.
\]

The logarithm is natural. The added ones keep the rule defined for an absent column and avoid erasing a word present in every training document. This is one precise TF-IDF convention: **term frequency** is the raw occurrence count here, and **inverse document frequency** is the learned column multiplier. Other conventions use logarithmic term frequency or normalize rows. We use `norm=None`, so the first training row is `[3.386294361119891,1.2876820724517808,0]`. Its entries are word weights, no longer literal token counts. [TfidfTransformer's weighting contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html) specifies the smoothing and normalization choices.

Move the orbit-count control from 2 to 0. The query's count row changes from `[2,1,0]` to `[0,1,0]`; the weighted row changes from `[2*idf_orbit,idf_rocket,0]` to `[0,idf_rocket,0]`. The IDF weights do not move. The query is not a new training corpus. Likewise, `rocket planet` becomes `[0,1,0]`: the unseen word `planet` is ignored under this fixed vocabulary. An all-`planet` document becomes a zero row and receives zero amounts. That null says “nothing retained by this representation,” not “a document with no meaning.” OOV means **out of vocabulary**, and is a practical reason to monitor coverage or deliberately retrain a representation on a new training corpus.

The small separate unit-length example in the picture illustrates an additional decision. Dividing a nonzero weighted row by its Euclidean length makes its direction carry the information and removes its overall magnitude. That can be useful when document length is a nuisance, but it changes the matrix and therefore the squared-error fitting problem. Our live row remains unnormalized; the inset is not an extra hidden transformation. A zero row must remain zero instead of being divided by zero.

**What does the whole training-and-query program do?** It fixes the vocabulary and IDF, fits a dictionary on the weighted training rows, and only then solves for new amounts. `count_rows` implements the lowercase, word-character tokens of length at least two used in this bounded comparison. This is not a language-aware tokenizer: punctuation separates words, one-character tokens are omitted, and no stemming, subword segmentation or phrase model is inferred. [CountVectorizer's token contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html) is the ordinary interface being matched.

The new `nmf_text_spectra.py` below supplies that scratch adapter, IDF calculation, and calls to the already explained `CoordinateNMF` and `encode_nnls`. Both the scratch and ordinary NMF routes use **Frobenius** loss on exactly the same weighted matrix, the same two-component custom start, zero penalties, a cap of 4,000 and tolerance `1e-8`. We use the [ordinary lifecycle from §10](#10-use-the-ordinary-tools-deliberately), rather than reimplementing the optimizer. The ordinary text route calls `fit_transform` on training rows, reads `components_`, calls `transform` on query rows, and reconstructs with `inverse_transform`. Only the vectorizer and IDF transformer are fit on raw training text; their query calls are `transform`. Labels play no role.

The vectorizer's sparse arrays store only nonzero counts or weights. The scratch optimizer in this lesson is deliberately dense; the program checks the new demonstration is 3×3 before converting it. More generally, its explicit dense adapter bounds the result to 10,000 cells. If a real vocabulary produces a large sparse document matrix, retain the sparse format and use an appropriate public solver; do not convert a corpus to dense merely to reuse these teaching loops. Tokenization itself takes work proportional to the inspected text; vocabulary sorting costs `O(v log v)` for `v` retained distinct tokens, counting takes `O(tokens + nv)` with the dense allocation, and multiplying IDF takes `O(nv)` dense work or `O(nnz)` when a sparse implementation touches only stored entries. After that, the NMF dimensions/costs are the ones already derived for `n` documents, `v` features and `k` components.

The executed new study reached scratch projected-stationarity tolerance after 12 alternating updates, with half-loss `0.5710663094424072`; the ordinary route used 13 iterations and half-loss `0.5710663094424069`, with no recorded warnings. Their stopping measurements differ, as §10 explained; this is not evidence that one extra library iteration is extra useful learning. For `rocket planet`, the scratch reconstruction is approximately `[0.437238,0.223229,0.215498]`: some error is inevitable because no combination of its two nonnegative patterns isolates the `rocket` column. Its all-OOV query has exact zero amounts and zero reconstruction. Independent fixed-dictionary NNLS objectives support these finite query results. We compare losses and reconstructions, not an obligation for arbitrary factor entries to match.

**Why not attach the count likelihood automatically?** TF-IDF entries are real-valued weights determined by the corpus. A count model for word occurrences does not automatically become a count model for weighted entries. Here Frobenius loss states exactly the numerical disagreement we fit. Generalized KL can also be defined for admissible nonnegative weighted values, but its probability-model interpretation would need a separate argument. Model selection must assess the intended task—retrieval, compression, exploration or a downstream prediction—under a train-only preprocessing rule, not merely the pleasant names given to components.

**Do nonnegative spectral amounts represent physical fractions?** Only an additional sum-to-one constraint makes them fractions of a fixed total.

<!-- figure:D59 -->

We now deliberately leave documents and return to the familiar two patterns `[1,0,1]` and `[0,1,1]`. In this **constructed** application, the three features are spectral bands and a pattern is called an **endmember**: a candidate pure-material response. They are numerical examples, not instrument measurements or certified substances. The query is `x = g[2,1,3]`, with the gain control initially `g=1`. Gain multiplies every band together.

The nonnegative cone contains every nonnegative combination of both patterns, including its zero and boundary cases. At gain 1, NNLS amounts `[2,1]` reconstruct `[2,1,3]` exactly. At gain 2, `[4,2]` reconstruct `[4,2,6]`. The sum of amounts changes with signal strength. The line segment joins the two endmembers and contains only their sum-one combinations: `[t,1-t]` for `0 ≤ t ≤ 1`. In geometry, those amounts belong to a **simplex**; for two components the simplex is just an interval. Both constraints are nonnegative, but the feasible sets are different. Every point on this segment has third band 1, so it cannot exactly represent our third band 3 at gain 1.

To compute the segment optimum, name the first and second pattern rows `h0` and `h1`. A sum-one reconstruction is `h1 + t(h0-h1)`. Define the direction `v=h0-h1`. Minimizing the half-square error along its whole line gives slope `v·(h1+tv-x)` and zero-slope coordinate `(x-h1)·v/(v·v)`. Constraining the coordinate to `[0,1]` clips that scalar optimum to the segment, because the scalar quadratic is convex:

\[
t^*=\operatorname{clip}\!\left(\frac{(x-h_1)\cdot(h_0-h_1)}{\|h_0-h_1\|_2^2},0,1\right),
\qquad w^*=[t^*,1-t^*].
\]

For our `h0-h1=[1,-1,0]` the denominator is 2 and numerator is `g+1`. Thus `t*=clip((g+1)/2,0,1)`. At `g=0.5`, the optimum is `[0.75,0.25]`, predicts `[0.75,0.25,1]` and has half-loss `3/16=0.1875`. At gain 1 it reaches the first endpoint `[1,0]`, predicts `[1,0,1]` and has half-loss 3. At gain 2 the same endpoint has half-loss 19. The cone-constrained NNLS answer remains exact throughout this control's domain, apart from floating-point NNLS residuals near `1e-16` in the executed reference.

If instead we normalize the exact unconstrained amounts `[2,1]` to `[2/3,1/3]`, the gain-1 prediction is `[2/3,1/3,1]` and half-loss is `28/9 ≈ 3.111111`, worse than the true segment optimum 3. Normalizing **after** optimizing changes the prediction without solving the newly constrained objective. This is different from the compensated dictionary-row normalization in §2, which preserves the product.

`simplex_two` implements the closed-form two-pattern projection in `O(d)` time and workspace for `d` bands. Its arrays are read-only results. If both patterns are identical, every sum-one amount has the same prediction: it returns `[0,1]` by a declared convention and marks amounts nonunique. If distinct patterns lose their squared separation to underflow, or the products/loss exceed finite arithmetic, it refuses and requests a better numerical scale rather than pretending it found a unique answer. With more than two patterns, the simplex has several coordinates and this clipping formula is no longer a general solution. Use a suitable constrained least-squares/quadratic optimizer and check feasibility and stationarity.

The public diagnostic route here independently minimizes the same one-coordinate objective with SciPy SLSQP, an analytic gradient and `[0,1]` bounds. It checks solver success and finite feasible output. All three constructed gains converged to the same amounts and losses in this new execution; a numerical success flag is not a proof that every future call will work. See the [SLSQP objective and stopping interface](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html).

Here is the complete new file. Its first application uses the fixed training representation described above; its second uses the fixed constructed spectral dictionary. They are separated functions because their features, fitted state and assumptions are different. Place it beside the supplied `nmf_arrays.py`, `nmf_coordinate.py`, `nmf_nnls.py` and unchanged `centered_pca.py` siblings.


```python
"""Separate small offline text and constructed three-band transfer routes."""
from dataclasses import dataclass
import json,re,warnings
import numpy as np
from scipy.optimize import minimize
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import CountVectorizer,TfidfTransformer
from nmf_arrays import nonnegative_table,positive_integer,require_finite,frobenius_metrics,read_only
from nmf_coordinate import CoordinateNMF
from nmf_nnls import encode_nnls


TOKEN=re.compile(r'(?u)\b\w\w+\b')


def count_rows(documents, vocabulary=None, *, max_cells=10000):
    """Dense teaching adapter with the default lowercase/two-character word rule."""
    documents=tuple(documents)
    if any(not isinstance(document,str) for document in documents):
        raise ValueError('Documents must be strings')
    tokens=[TOKEN.findall(document.lower()) for document in documents]
    vocabulary=tuple(sorted({word for row in tokens for word in row})) if vocabulary is None else tuple(vocabulary)
    if not vocabulary or len(set(vocabulary))!=len(vocabulary) or any(not isinstance(word,str) or not word for word in vocabulary):
        raise ValueError('Supply a nonempty unique ordered vocabulary')
    max_cells=positive_integer(max_cells,'max_cells')
    if len(documents)*len(vocabulary)>max_cells:
        raise ValueError('This dense teaching route exceeds its declared cell bound')
    positions={word:j for j,word in enumerate(vocabulary)}
    counts=np.zeros((len(documents),len(vocabulary)))
    for i,row in enumerate(tokens):
        for word in row:
            if word in positions:counts[i,positions[word]]+=1
    require_finite(counts,'Token counts')
    return counts,vocabulary


def training_idf(counts):
    x=nonnegative_table(counts,require_rows=True)
    if np.any(x!=np.floor(x)):
        raise ValueError('Document frequency starts from nonnegative integer counts')
    frequency=np.count_nonzero(x>0,axis=0)
    return 1+np.log((1+len(x))/(1+frequency))


def apply_idf(counts, idf):
    x=nonnegative_table(counts)
    weights=np.asarray(idf,dtype=float)
    if weights.shape!=(x.shape[1],) or np.any(weights<0):
        raise ValueError('IDF must match the fixed feature order')
    require_finite(weights,'IDF weights')
    with np.errstate(over='ignore',invalid='ignore'):
        weighted=x*weights
    return require_finite(weighted,'Weighted text')


def text_demo():
    train=('orbit orbit rocket','rocket team','team team')
    queries=('orbit orbit rocket','rocket planet','planet')
    counts,vocabulary=count_rows(train)
    idf=training_idf(counts)
    query_counts,_=count_rows(queries,vocabulary)
    x,query=apply_idf(counts,idf),apply_idf(query_counts,idf)
    vectorizer=CountVectorizer()
    ordinary_counts=vectorizer.fit_transform(train)
    transformer=TfidfTransformer(norm=None,smooth_idf=True,use_idf=True,sublinear_tf=False)
    ordinary_sparse=transformer.fit_transform(ordinary_counts)
    # This tiny comparison is deliberately 3x3, not a recommendation to densify a corpus.
    if ordinary_sparse.shape!=(3,3):raise ValueError('Unexpected tiny demonstration shape')
    ordinary_x=ordinary_sparse.toarray()
    ordinary_query=transformer.transform(vectorizer.transform(queries)).toarray()
    if tuple(vectorizer.get_feature_names_out())!=vocabulary or not np.array_equal(ordinary_x,x):
        raise ValueError('Scratch/public vocabulary or weighting conventions differ')
    initial_w=np.array([[1,.3],[.4,.8],[.2,1.]])
    initial_h=np.array([[1,.3,.2],[.2,.5,1.]])
    scratch=CoordinateNMF(2,max_iter=4000,tol=1e-8,sweeps=1,random_state=0)
    w=scratch.fit_transform(x,features=vocabulary,initial_w=initial_w,initial_h=initial_h)
    public=NMF(n_components=2,init='custom',solver='cd',beta_loss='frobenius',
               alpha_W=0,alpha_H=0,l1_ratio=0,shuffle=False,max_iter=4000,tol=1e-8,random_state=0)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        public_w=public.fit_transform(ordinary_x,W=initial_w.copy(),H=initial_h.copy())
        public_query_w=public.transform(ordinary_query)
    scratch_query_w,status=scratch.transform(query,features=vocabulary,return_diagnostics=True)
    return {'training_documents':train,'query_documents':queries,'vocabulary':vocabulary,
            'counts':counts.tolist(),'document_frequency':np.count_nonzero(counts>0,axis=0).tolist(),
            'idf':idf.tolist(),'tfidf_norm_none':x.tolist(),'query_counts':query_counts.tolist(),'query_tfidf':query.tolist(),
            'scratch':{'dictionary':scratch.components_.tolist(),'training_amounts':w.tolist(),
                       'training_half_loss':frobenius_metrics(x,w,scratch.components_).half_square,
                       'status':scratch.status_,'last_diagnostic':scratch.diagnostics_[-1],
                       'query_amounts':scratch_query_w.tolist(),'query_diagnostic':status,
                       'query_reconstruction':scratch.inverse_transform(scratch_query_w).tolist()},
            'ordinary':{'dictionary':public.components_.tolist(),'training_amounts':public_w.tolist(),
                        'training_half_loss':frobenius_metrics(x,public_w,public.components_).half_square,
                        'iterations':int(public.n_iter_),'warnings':[str(item.message) for item in caught],
                        'query_amounts':public_query_w.tolist(),'query_reconstruction':public.inverse_transform(public_query_w).tolist()},
            'scope':'New tiny TF-IDF/Frobenius study, separate from original five-document count/KL run'}


@dataclass(frozen=True)
class SimplexProjection:
    amounts: np.ndarray
    prediction: np.ndarray
    half_loss: float
    nonunique_amounts: bool


def simplex_two(query, dictionary):
    h=nonnegative_table(dictionary,require_rows=True)
    x=nonnegative_table([query],h.shape[1])[0]
    if h.shape[0]!=2:raise ValueError('This exact line-segment adapter requires two patterns')
    direction=h[0]-h[1]
    with np.errstate(over='ignore',invalid='ignore'):
        denominator=float(direction@direction)
        numerator=float((x-h[1])@direction)
    require_finite([denominator,numerator],'Simplex projection products')
    nonunique=denominator==0
    if nonunique and np.any(direction!=0):
        raise ValueError('Distinct patterns lost their squared distance; rescale the data')
    unbounded=0.0 if nonunique else numerator/denominator
    require_finite(unbounded,'Unconstrained segment coordinate')
    t=float(np.clip(unbounded,0,1))
    amounts=np.array([t,1-t]);prediction=amounts@h
    with np.errstate(over='ignore',invalid='ignore'):
        loss=float(np.sum((x-prediction)**2)/2)
    require_finite([*prediction,loss],'Simplex prediction and loss')
    return SimplexProjection(read_only(amounts),read_only(prediction),loss,nonunique)


def public_simplex_two(query,dictionary):
    h=nonnegative_table(dictionary,require_rows=True)
    x=nonnegative_table([query],h.shape[1])[0]
    if h.shape[0]!=2:raise ValueError('Two patterns required')
    direction=h[0]-h[1]
    def objective(t):
        residual=h[1]+t[0]*direction-x
        with np.errstate(over='ignore',invalid='ignore'):
            value=float(residual@residual/2)
        return float(require_finite(value,'Constrained reference objective'))
    def gradient(t):
        with np.errstate(over='ignore',invalid='ignore'):
            value=np.array([(h[1]+t[0]*direction-x)@direction])
        return require_finite(value,'Constrained reference gradient')
    result=minimize(objective,[.5],jac=gradient,bounds=[(0.,1.)],method='SLSQP',
                    options={'ftol':1e-12,'maxiter':100})
    if not result.success:raise RuntimeError(f'Constrained reference failed: {result.message}')
    require_finite(result.x,'Constrained reference amount')
    if not 0<=result.x[0]<=1:raise RuntimeError('Constrained reference left feasible segment')
    return {'amounts':[float(result.x[0]),float(1-result.x[0])],
            'half_loss':objective(result.x),'iterations':int(result.nit),'success':bool(result.success)}


def spectra_demo():
    h=np.array([[1.,0.,1.],[0.,1.,1.]])
    rows=[]
    for gain in (.5,1.,2.):
        x=gain*np.array([2.,1.,3.])
        cone,norms=encode_nnls(x[None,:],h)
        simplex=simplex_two(x,h)
        normalized=cone[0]/cone[0].sum()
        rows.append({'gain':gain,'query':x.tolist(),'cone_amounts':cone[0].tolist(),'cone_residual_norm':float(norms[0]),
                     'simplex_amounts':simplex.amounts.tolist(),'simplex_prediction':simplex.prediction.tolist(),
                     'simplex_half_loss':simplex.half_loss,'ordinary_constrained':public_simplex_two(x,h),
                     'normalized_NNLS':normalized.tolist(),
                     'normalized_NNLS_half_loss':float(np.sum((x-normalized@h)**2)/2)})
    return {'scope':'Constructed three-band geometry, not measured/calibrated physical endmembers',
            'dictionary':h.tolist(),'rows':rows}


def main():
    print(json.dumps({'text':text_demo(),'spectra':spectra_demo()},indent=2,allow_nan=False))


if __name__=='__main__':
    main()
```


The full output of the new bounded demonstration follows. It includes actual dictionaries and amounts, the null query, convergence diagnostics and all three constrained comparisons. These data belong to this new three-document/Frobenius example, not the preceding historical five-document/KL run.


```json
{
  "text": {
    "training_documents": [
      "orbit orbit rocket",
      "rocket team",
      "team team"
    ],
    "query_documents": [
      "orbit orbit rocket",
      "rocket planet",
      "planet"
    ],
    "vocabulary": [
      "orbit",
      "rocket",
      "team"
    ],
    "counts": [
      [
        2.0,
        1.0,
        0.0
      ],
      [
        0.0,
        1.0,
        1.0
      ],
      [
        0.0,
        0.0,
        2.0
      ]
    ],
    "document_frequency": [
      1,
      2,
      2
    ],
    "idf": [
      1.6931471805599454,
      1.2876820724517808,
      1.2876820724517808
    ],
    "tfidf_norm_none": [
      [
        3.386294361119891,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        1.2876820724517808,
        1.2876820724517808
      ],
      [
        0.0,
        0.0,
        2.5753641449035616
      ]
    ],
    "query_counts": [
      [
        2.0,
        1.0,
        0.0
      ],
      [
        0.0,
        1.0,
        0.0
      ],
      [
        0.0,
        0.0,
        0.0
      ]
    ],
    "query_tfidf": [
      [
        3.386294361119891,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        0.0,
        0.0
      ]
    ],
    "scratch": {
      "dictionary": [
        [
          1.0459433267438019,
          0.4296350876826676,
          0.0
        ],
        [
          0.0,
          0.23742168468324357,
          1.1727448727556171
        ]
      ],
      "training_amounts": [
        [
          3.202844856182045,
          0.0
        ],
        [
          0.33340194362485476,
          1.2445611217207246
        ],
        [
          0.0,
          2.1095522422367297
        ]
      ],
      "training_half_loss": 0.5710663094424072,
      "status": "stationary-tolerance",
      "last_diagnostic": [
        12,
        0.5710663094424072,
        3.306971207123834e-08
      ],
      "query_amounts": [
        [
          3.2028448549071626,
          0.0
        ],
        [
          0.41803245347565,
          0.18375529265332882
        ],
        [
          0.0,
          0.0
        ]
      ],
      "query_diagnostic": {
        "status": "stationary-tolerance",
        "iterations": 4,
        "projected_gradient": 3.4226452783059358e-09
      },
      "query_reconstruction": [
        [
          3.349994202585867,
          1.3760545300720197,
          0.0
        ],
        [
          0.4372382550751949,
          0.22322890095442732,
          0.2154980773008993
        ],
        [
          0.0,
          0.0,
          0.0
        ]
      ]
    },
    "ordinary": {
      "dictionary": [
        [
          1.04594332580967,
          0.4296350900574366,
          0.0
        ],
        [
          0.0,
          0.23742168036641245,
          1.1727448735963044
        ]
      ],
      "training_amounts": [
        [
          3.2028448549071618,
          0.0
        ],
        [
          0.3334019635705866,
          1.2445611085382222
        ],
        [
          0.0,
          2.109552249175553
        ]
      ],
      "training_half_loss": 0.5710663094424069,
      "iterations": 13,
      "warnings": [],
      "query_amounts": [
        [
          3.2028448546082,
          0.0
        ],
        [
          0.41803245364270813,
          0.18375528914574835
        ],
        [
          0.0,
          0.0
        ]
      ],
      "query_reconstruction": [
        [
          3.34999419928129,
          1.3760545375495914,
          0.0
        ],
        [
          0.43723825485943085,
          0.22322890039291568,
          0.215498073341883
        ],
        [
          0.0,
          0.0,
          0.0
        ]
      ]
    },
    "scope": "New tiny TF-IDF/Frobenius study, separate from original five-document count/KL run"
  },
  "spectra": {
    "scope": "Constructed three-band geometry, not measured/calibrated physical endmembers",
    "dictionary": [
      [
        1.0,
        0.0,
        1.0
      ],
      [
        0.0,
        1.0,
        1.0
      ]
    ],
    "rows": [
      {
        "gain": 0.5,
        "query": [
          1.0,
          0.5,
          1.5
        ],
        "cone_amounts": [
          1.0,
          0.4999999999999999
        ],
        "cone_residual_norm": 1.6653345369377348e-16,
        "simplex_amounts": [
          0.75,
          0.25
        ],
        "simplex_prediction": [
          0.75,
          0.25,
          1.0
        ],
        "simplex_half_loss": 0.1875,
        "ordinary_constrained": {
          "amounts": [
            0.75,
            0.25
          ],
          "half_loss": 0.1875,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 0.19444444444444453
      },
      {
        "gain": 1.0,
        "query": [
          2.0,
          1.0,
          3.0
        ],
        "cone_amounts": [
          2.0,
          0.9999999999999998
        ],
        "cone_residual_norm": 3.3306690738754696e-16,
        "simplex_amounts": [
          1.0,
          0.0
        ],
        "simplex_prediction": [
          1.0,
          0.0,
          1.0
        ],
        "simplex_half_loss": 3.0,
        "ordinary_constrained": {
          "amounts": [
            1.0,
            0.0
          ],
          "half_loss": 3.0,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 3.1111111111111116
      },
      {
        "gain": 2.0,
        "query": [
          4.0,
          2.0,
          6.0
        ],
        "cone_amounts": [
          4.0,
          1.9999999999999996
        ],
        "cone_residual_norm": 6.661338147750939e-16,
        "simplex_amounts": [
          1.0,
          0.0
        ],
        "simplex_prediction": [
          1.0,
          0.0,
          1.0
        ],
        "simplex_half_loss": 19.0,
        "ordinary_constrained": {
          "amounts": [
            1.0,
            0.0
          ],
          "half_loss": 19.0,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 19.444444444444446
      }
    ]
  }
}
```


**What would justify a material interpretation?** Calibration and independent evidence must connect a numerical component to the world.

<!-- figure:D60 -->

The measured/modelled/residual lanes now reuse our separate positive-shear example, explicitly switching from `H0` to patterns `[1,1,1]` and `[0,1,1]`, with amounts `[2,1]`. Their modelled response is `[2,3,3]`. A different dictionary `[1,0.5,0.5]`, `[0,1,1]` with amounts `[2,2]` gives the same response. The numerical residual in either lane is zero. Equal fit cannot choose which explanation names the physical materials.

An instrument's band response, units, baseline, noise, saturation and calibration establish what the observed vector means. Independent endmember measurements or credible mixing laws establish whether the candidate dictionary represents pure responses. An abundance sum-one constraint might describe fractions under a particular linear mixture model; brightness, illumination, path length, nonlinear scattering or additional materials can violate that simple model. These are questions for the experiment and the application, not facts inferred from `WH` alone. Even an identifiable algebraic dictionary under §15's assumptions is not automatically a calibrated substance catalogue.

That distinction explains both the promise and the restraint of additive models: a nonnegative table lets us reuse the computation, while each domain must defend its representation, noise/loss and interpretation. A useful changed task is to hold the vocabulary fixed for a new text query, or hold the endmembers fixed while changing gain, and explain which inference remains justified. [Practice T](#practice-t-query-with-fixed-idf) and the physical-interpretation task revisit those decisions. Next, we keep the data representation fixed but change **when** rows arrive, so the model must decide what to remember.

## 17. Update as rows arrive

**What if we cannot keep every training row?** Remember the products needed for a dictionary update, rather than pretending an old encoding is a fresh one. [Change application assumptions explicitly](#16-change-application-assumptions-explicitly) kept vocabulary or endmembers fixed while queries arrived. Here new **training** rows may change the dictionary. We return to `H0=[[1,0,1],[0,1,1]]` and three named numerical bands so the memory update can be followed by hand; this is a constructed stream, not an additional digit or physical experiment.

**What information from one row helps update the dictionary?** Its amounts tell us how much of the observed signal to credit to each component.

<!-- figure:D61 -->

The first arriving row is `[2,1,3]`. Holding `H0` fixed gives its exact amount row `[2,1]`. Take the outer product of these amounts with themselves: multiply each amount by each amount to obtain `A=[[4,2],[2,1]]`. Its axes are component by component. Take the outer product of the amount column with the observation row: the first row is twice `[2,1,3]`, the second once, giving `B=[[4,2,6],[2,1,3]]`. Its axes are component by feature. In particular `A01=2*1=2` and `B02=2*3=6`; the columns of `B` remain the same named bands as the dictionary.

The next row `[0,2,2]` has exact amounts `[0,2]` under `H0`. Its added Gram product is `deltaA=[[0,0],[0,4]]` and its added amount-observation product is `deltaB=[[0,0,0],[0,4,4]]`. The first component receives no credit for this row; the second receives twice its measured bands. These are products of **amounts computed at arrival**, not labels of physical sources.

For a batch of `b` arriving rows, write its observation table as `Xb` of shape `b×d` and amounts as `Wb` of shape `b×k`. The two compact products are

\[
\Delta A=W_b^TW_b\quad(k\times k),\qquad
\Delta B=W_b^TX_b\quad(k\times d).
\]

Why are those enough? Expand the sum of half-squared residuals while the historical amounts are held fixed. The term containing the dictionary twice is `0.5 sum_c,l A_cl (h_c·h_l)`; the term containing it once is `-sum_c,j B_cj H_cj`. The remaining `0.5 sum_i ||x_i||²` does not depend on `H` and cannot change its optimum. In matrix notation the retained part is

\[
Q(H)=\tfrac12\operatorname{tr}(H^TAH)-\operatorname{tr}(H^TB),
\qquad \nabla_H Q=AH-B.
\]

The **trace** adds the diagonal cells of a square matrix; here it is compact notation for those ordinary scalar sums, not a new measurement. `A` records component co-activity, `B` records component-observation association, and the original rows are no longer necessary **for this fixed-code quadratic**. A displayed `Q=-7` is possible because we omitted the positive, dictionary-independent constant. It is not a negative squared reconstruction error.

**How much should the past count?** Multiply old statistics before adding this batch's products.

<!-- figure:D62 -->

The old cells remain visible as one contribution and the incoming cells as another. At `rho=1`, every old product is retained. At `rho=0.5`, the first row's influence is halved while the incoming row is fully added, producing `A=[[2,1],[1,4.5]]` and `B=[[2,1,3],[1,4.5,5.5]]`. At `rho=0`, only the incoming products remain: `A=[[0,0],[0,4]]`, `B=[[0,0,0],[0,4,4]]`. The dictionary is not reset by that multiplication; an unused row has no evidence to move it.

The recurrence is

\[
A\leftarrow\rho A+W_b^TW_b,\qquad
B\leftarrow\rho B+W_b^TX_b,\qquad 0\le\rho\le1.
\]

In this implementation `rho` acts **per nonempty batch**, not per observation. An older batch's weight is the product of the later retention factors. With constant `rho<1`, batches several updates ago decay exponentially in the number of nonempty updates. A batch of 100 rows contributes 100 outer products, while a batch of one contributes one; changing batch sizes changes weighting unless you deliberately choose another normalized convention. An empty batch is an actual no-op, even when `rho=0`, so an accidental empty chunk cannot erase accumulated evidence.

Smaller retention can adapt to a changing distribution but loses information about earlier regimes. Keeping all past products gives stable historical weighting but may adapt slowly. Those are decisions about the task and time scale, not automatic improvements. The live figure changes only `rho` for the two named outer products, so its meaning stays visible.

**How does the compact quadratic move one dictionary row?** Reuse the cyclic coordinate reasoning from [Change one coordinate, then reuse the arithmetic](#5-change-one-coordinate-then-reuse-the-arithmetic), now with `A/B` as caches. Hold all other dictionary rows fixed. For feature `j`, the slope is `(AH-B)_cj`, and the curvature for that coordinate is `A_cc`. When this curvature is positive, the nonnegative scalar minimum is

\[
H_{cj}\leftarrow\max\left(0,H_{cj}-\frac{(AH-B)_{cj}}{A_{cc}}\right).
\]

All features in row `c` can move together because the fixed-code squared objective separates over features. Row `c+1` must use the **new** earlier dictionary rows: this is the same fresh-versus-stale distinction we traced for amounts. `A` is positive semidefinite because it is a nonnegative weighted sum of Gram products. Thus the dictionary block is a convex quadratic over nonnegative entries; the joint changing-code problem remains nonconvex. Finite sweeps improve this surrogate but need not finish its optimization.

If `A_cc=0`, generated nonnegative statistics also have that row/column of `A` and row of `B` zero: the component has never received retained amount. The objective is flat in its dictionary row. We explicitly keep that unused row, instead of dividing by zero or erasing its starting pattern. If a supplied/generated cache nevertheless combines zero curvature with a nonzero cross term, the kernel refuses that inconsistent state. The public class only constructs these caches from validated batches; the underscored kernel is not an arbitrary-matrix quadratic-programming interface.

**Is this the same as refitting every previous row?** No: old amounts are useful memory, but they become stale when the dictionary moves.

<!-- figure:D63 -->

The two observations remain `[2,1,3]` and `[0,2,2]`, and their stored amounts remain `[2,1]` and `[0,2]`. Initially the dictionary is `H0`. Move just its first-band entry in component 0 from `h=1` to `h=2`, keeping `H=[[h,0,1],[0,1,1]]`. The stored first amount row now predicts `[2h,1,3]`; at `h=2`, this is `[4,1,3]` and its half-loss is 2. The second row remains exact with `[0,2]`.

Fresh fixed-dictionary encoding is a different calculation. For the first row, the two normal equations are `(h²+1)w0+w1=2h+3` and `w0+2w1=4`. Solving them gives

\[
w_0=\frac{4h+2}{2h^2+1},\qquad
w_1=\frac{4h^2-2h+1}{2h^2+1}.
\]

Both amounts are positive throughout this figure's `h∈[1,2]`, so this unconstrained stationary solution is also the NNLS optimum there. At `h=2`, it is `[10/9,13/9]`, predicts `[20/9,13/9,23/9]` and has half-loss `2/9`, smaller than the stored-code loss 2. Its new outer products would change `A/B`. The displayed old statistics do not magically become those new products when the control moves.

That is the meaning of a **surrogate** here: an easier remembered objective formed with previously computed codes. For each old row, minimizing over a new code cannot be worse than evaluating its old code, so the fixed-code reconstruction objective is an upper bound on the freshly minimized one for the same weighted observations. A stream algorithm uses that structure without retaining every row to re-encode it. Its finite iterations, retention choice and numerical stopping do not prove an asymptotic theorem. [Mairal and colleagues' original online formulation](https://jmlr.org/papers/volume11/mairal10a/mairal10a.pdf) develops accumulated statistics, dictionary updates and nonnegative variants under stated assumptions; our bounded code is not their full sparse-coding algorithm or a transfer of its convergence guarantee.

**What does a reliable streaming interface retain?** One coherent dictionary/statistic snapshot and enough diagnostics to know what happened. `OnlineNMF` starts from an explicitly supplied dictionary and zero statistics. A nonempty `partial_fit` first encodes the incoming batch with that held dictionary, computes local candidate `A/B`, makes a writable candidate dictionary, performs the configured sweeps, checks finite objectives/gradients, and only then publishes all of them together. Invalid features, retention, shapes or arithmetic preserve the old snapshot. It returns the amounts **used at arrival**; these are not promised to be optimal under the updated dictionary. `transform` solves new amounts with the current dictionary without changing state; `inverse_transform` uses the fitted rank and feature dimension. Returned public arrays are copies.

The snapshot contains only `H` (`k×d`), `A` (`k×k`), `B` (`k×d`), feature order, fixed encoding/sweep settings and the latest scalar diagnostic. Its `rows_seen` is a count, not a retained observation table or an effective sample-weight sum. History is not hidden in a diagnostics list. The latest report separates incoming-encoding status/iterations/projected gradient from dictionary sweeps, before/after surrogate and dictionary projected gradient. An encoding cap is reported rather than called exact; its returned finite approximate amounts define the products that were actually accumulated. An application requiring tighter encoding can increase the cap or reject cap-status arrivals before using this interface.

**What does this save, and what work remains?** Fixed-H batch encoding constructs `HH.T` in `O(dk²)`, `XbH.T` in `O(bdk)`, then uses `q` coordinate sweeps in `O(qbk²)`. Building `Wb.TWb` and `Wb.TXb` costs `O(bk²+bdk)`. Each dictionary sweep and its gradient diagnostic cost `O(dk²)`. These products operate on contracted axes; no `b×d×k` contribution tensor is allocated. Retained memory is `O(k²+kd)` regardless of the number of past rows. Batch input/amounts/cross work require `O(bd+bk)` plus the `k²/kd` caches and deliberate snapshot copies. Increasing rank raises both Gram memory and quadratic-coordinate work; streaming is not free merely because historical rows are discarded.

**How is ordinary MiniBatchNMF used?** The complete new program below includes both routes on the same two newly declared arrivals. The public estimator is configured explicitly with two components, custom initial factors, Frobenius loss, no penalties, batch size 1, retention parameter `forget_factor=1`, fresh code solves capped at 1,000, transform cap 1,000 and tolerance `1e-8`. The first `partial_fit` receives the initial `W/H`; the second updates from its fitted `components_`. `n_steps_` counts the two calls, and `n_components_` records fitted rank. A final `transform` and `inverse_transform` encode/reconstruct a new query without changing the dictionary. The [public MiniBatchNMF API](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html) documents that incremental lifecycle.

The library uses its own multiplicative accumulators and update rules. Its `forget_factor` is **not algebraically equated** with this class's `rho` per batch, and its batch-size scaling/fresh-restart work differ. Its whole-data `fit` can stop using parameter change and smoothed-cost controls; two explicit `partial_fit` calls are not a claim that those whole-fit criteria were satisfied. We set parameters rather than inheriting defaults, retain warnings, and compare coherent state/use of the interface rather than arbitrary identical trajectories.

Here is the complete `nmf_online.py`, using the already taught N1 validation/reductions and N2 fixed-H encoder. Its underscored cache kernels are used only behind that validating class. Put it beside those supplied siblings and `centered_pca.py`.


```python
"""Bounded dense online nonnegative surrogate; never stores historical rows."""
from dataclasses import dataclass,asdict
import json,warnings
import numpy as np
from sklearn.decomposition import MiniBatchNMF
from nmf_arrays import (nonnegative_table,feature_ids,nonnegative_scalar,positive_integer,
                        require_finite,read_only,projected_gradient,stable_norm,reconstruction)
from nmf_coordinate import encode_coordinates


def _surrogate(h,a,b):
    """Historical-code quadratic, omitting its dictionary-independent constant."""
    with np.errstate(over='ignore',invalid='ignore'):
        value=float(np.sum(h*(a@h))/2-np.sum(b*h))
    return float(require_finite(value,'Online surrogate reduction'))


def _dictionary_coordinates(h,a,b,sweeps):
    """Internal generated-cache kernel: a=W.T@W, b=W.T@X, accumulated alike."""
    for _ in range(sweeps):
        for c in range(h.shape[0]):
            curvature=float(a[c,c])
            if curvature==0:
                if np.any(a[c]!=0) or np.any(a[:,c]!=0) or np.any(b[c]!=0):
                    raise ValueError('Flat dictionary coordinate has inconsistent statistics')
                continue  # Keep the unused dictionary row; every value is equally good.
            with np.errstate(over='ignore',invalid='ignore',divide='ignore'):
                slope=a[c]@h-b[c]
                proposal=h[c]-slope/curvature
            require_finite(slope,'Online dictionary slope')
            require_finite(proposal,'Online dictionary update')
            h[c]=np.maximum(0.,proposal)
    return h


@dataclass(frozen=True)
class OnlineDiagnostic:
    batches: int
    rows_seen: int
    batch_rows: int
    rho: float
    encoding_status: str
    encoding_iterations: int
    encoding_projected_gradient: float
    dictionary_sweeps: int
    surrogate_before_without_constant: float
    surrogate_after_without_constant: float
    dictionary_projected_gradient: float


@dataclass(frozen=True)
class OnlineState:
    h: np.ndarray
    a: np.ndarray
    b: np.ndarray
    features: tuple
    encoding_max_iter: int
    encoding_tol: float
    dictionary_sweeps: int
    diagnostic: OnlineDiagnostic | None


class OnlineNMF:
    def __init__(self,initial_h,*,features=None,encoding_max_iter=1000,
                 encoding_tol=1e-8,dictionary_sweeps=1):
        h=nonnegative_table(initial_h,require_rows=True)
        k,d=h.shape
        cap=positive_integer(encoding_max_iter,'encoding_max_iter')
        tol=nonnegative_scalar(encoding_tol,'encoding_tol')
        sweeps=positive_integer(dictionary_sweeps,'dictionary_sweeps')
        names=feature_ids(features,d)
        self._state=OnlineState(read_only(h),read_only(np.zeros((k,k))),read_only(np.zeros((k,d))),
                                names,cap,tol,sweeps,None)

    @property
    def components_(self):return self._state.h.copy()

    @property
    def statistics_(self):return self._state.a.copy(),self._state.b.copy()

    @property
    def diagnostic_(self):return self._state.diagnostic

    @property
    def feature_names_(self):return self._state.features

    def _query(self,values,features,state):
        if features is not None and feature_ids(features,state.h.shape[1])!=state.features:
            raise ValueError('Feature IDs/order differ from the online dictionary')
        return nonnegative_table(values,state.h.shape[1])

    def partial_fit(self,values,*,rho=1.0,features=None):
        state=self._state
        rho=nonnegative_scalar(rho,'rho')
        if rho>1:raise ValueError('rho must lie in [0,1]')
        x=self._query(values,features,state)
        if len(x)==0:
            return np.zeros((0,state.h.shape[0])),{'status':'empty-batch-no-op'}
        w,encoded=encode_coordinates(x,state.h,max_iter=state.encoding_max_iter,tol=state.encoding_tol)
        with np.errstate(over='ignore',invalid='ignore'):
            delta_a=w.T@w
            delta_b=w.T@x
            a=rho*state.a+delta_a
            b=rho*state.b+delta_b
        for matrix,name in [(delta_a,'Batch Gram'),(delta_b,'Batch cross'),(a,'Accumulated Gram'),(b,'Accumulated cross')]:
            require_finite(matrix,name)
        if np.any((np.diag(delta_a)==0)&np.any(w!=0,axis=0)):
            raise ValueError('Nonzero amounts lost their squared mass; rescale')
        h=state.h.copy()
        before=_surrogate(h,a,b)
        _dictionary_coordinates(h,a,b,state.dictionary_sweeps)
        after=_surrogate(h,a,b)
        with np.errstate(over='ignore',invalid='ignore'):
            gradient=a@h-b
        stationary=stable_norm(projected_gradient(h,gradient))
        old=state.diagnostic
        diagnostic=OnlineDiagnostic(1 if old is None else old.batches+1,
            len(x) if old is None else old.rows_seen+len(x),len(x),rho,
            encoded['status'],encoded['iterations'],encoded['projected_gradient'],
            state.dictionary_sweeps,before,after,stationary)
        candidate=OnlineState(read_only(h),read_only(a),read_only(b),state.features,
            state.encoding_max_iter,state.encoding_tol,state.dictionary_sweeps,diagnostic)
        self._state=candidate  # Sole publication point: every failure above conserves the old state.
        return w.copy(),asdict(diagnostic)

    def transform(self,values,*,features=None):
        state=self._state
        x=self._query(values,features,state)
        return encode_coordinates(x,state.h,max_iter=state.encoding_max_iter,tol=state.encoding_tol)

    def inverse_transform(self,amounts):
        state=self._state
        return reconstruction(nonnegative_table(amounts,state.h.shape[0]),state.h)


def ordinary_stream(batches,initial_h):
    """Public MiniBatchNMF is a distinct optimizer, not the same A/B recurrence."""
    model=MiniBatchNMF(n_components=2,init='custom',batch_size=1,beta_loss='frobenius',
        alpha_W=0,alpha_H=0,l1_ratio=0,forget_factor=1.,fresh_restarts=True,
        fresh_restarts_max_iter=1000,transform_max_iter=1000,tol=1e-8,
        max_no_improvement=None,max_iter=1000,random_state=23)
    records=[]
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        for index,batch in enumerate(batches):
            if index==0:model.partial_fit(batch,W=np.ones((len(batch),2)),H=initial_h.copy())
            else:model.partial_fit(batch)
            records.append({'steps':int(model.n_steps_),'dictionary':model.components_.tolist()})
        before=model.components_.copy()
        amounts=model.transform([[1.,2.,3.]])
        prediction=model.inverse_transform(amounts)
        if not np.array_equal(before,model.components_):raise RuntimeError('Query changed the ordinary dictionary')
    return {'steps':records,'n_components':int(model.n_components_),'query_amounts':amounts.tolist(),
            'query_prediction':prediction.tolist(),'warnings':[str(item.message) for item in caught]}


def main():
    initial_h=np.array([[1.,0.,1.],[0.,1.,1.]])
    batches=[np.array([[2.,1.,3.]]),np.array([[0.,2.,2.]])]
    scratch=OnlineNMF(initial_h,features=('band0','band1','band2'),encoding_max_iter=3000,encoding_tol=1e-10,dictionary_sweeps=2)
    records=[]
    for batch in batches:
        amounts,diagnostic=scratch.partial_fit(batch,features=('band0','band1','band2'))
        a,b=scratch.statistics_
        records.append({'arrival_amounts':amounts.tolist(),'dictionary':scratch.components_.tolist(),
                        'A':a.tolist(),'B':b.tolist(),'diagnostic':diagnostic})
    query,status=scratch.transform([[1.,2.,3.]],features=('band0','band1','band2'))
    print(json.dumps({'scope':'New two-arrival streaming demonstration, no historical campaign replay',
        'scratch':{'steps':records,'query_amounts':query.tolist(),'query_diagnostic':status,
                   'query_prediction':scratch.inverse_transform(query).tolist()},
        'ordinary_distinct_route':ordinary_stream(batches,initial_h)},indent=2,allow_nan=False))


if __name__=='__main__':main()
```


This is the full output of the new two-arrival demonstration. The hand figures use exact amounts; the numerical encoder stops at a tolerance and consequently produces tiny nonzero cells instead of exact symbolic zeros. Both are labelled roles, not contradictory fits. The first scratch arrival used 17 encoding iterations, and the second used 17; the two final dictionary sweeps were a configured cap, not a declaration of whole joint stationarity. The ordinary route recorded two incremental steps and no warnings. Its final query prediction is approximately `[1.000260,2.000260,2.999740]`, whereas the scratch prediction is `[1.000000,2.000000,3.000000]` to six decimals; this tiny constructed stream does not establish a general ranking of optimizers.


```json
{
  "scope": "New two-arrival streaming demonstration, no historical campaign replay",
  "scratch": {
    "steps": [
      {
        "arrival_amounts": [
          [
            2.0000000001164153,
            0.9999999999417923
          ]
        ],
        "dictionary": [
          [
            0.9999999999417923,
            2.9103830453345572e-11,
            0.9999999999708962
          ],
          [
            0.0,
            1.0,
            1.0
          ]
        ],
        "A": [
          [
            4.000000000465661,
            2.0
          ],
          [
            2.0,
            0.9999999998835847
          ]
        ],
        "B": [
          [
            4.000000000232831,
            2.0000000001164153,
            6.000000000349246
          ],
          [
            1.9999999998835847,
            0.9999999999417923,
            2.999999999825377
          ]
        ],
        "diagnostic": {
          "batches": 1,
          "rows_seen": 1,
          "batch_rows": 1,
          "rho": 1.0,
          "encoding_status": "stationary-tolerance",
          "encoding_iterations": 17,
          "encoding_projected_gradient": 1.7462298274040222e-10,
          "dictionary_sweeps": 2,
          "surrogate_before_without_constant": -7.0,
          "surrogate_after_without_constant": -7.0,
          "dictionary_projected_gradient": 0.0
        }
      },
      {
        "arrival_amounts": [
          [
            2.3283086571880334e-10,
            1.9999999998835845
          ]
        ],
        "dictionary": [
          [
            0.9999999999417923,
            5.820677272827155e-12,
            0.9999999999941793
          ],
          [
            0.0,
            1.0000000000558795,
            0.9999999999441208
          ]
        ],
        "A": [
          [
            4.000000000465661,
            2.0000000004656617
          ],
          [
            2.0000000004656617,
            4.9999999994179225
          ]
        ],
        "B": [
          [
            4.000000000232831,
            2.000000000582077,
            6.000000000814908
          ],
          [
            1.9999999998835847,
            4.999999999708962,
            6.999999999592546
          ]
        ],
        "diagnostic": {
          "batches": 2,
          "rows_seen": 2,
          "batch_rows": 1,
          "rho": 1.0,
          "encoding_status": "stationary-tolerance",
          "encoding_iterations": 17,
          "encoding_projected_gradient": 3.4924596548080444e-10,
          "dictionary_sweeps": 2,
          "surrogate_before_without_constant": -11.0,
          "surrogate_after_without_constant": -11.0,
          "dictionary_projected_gradient": 2.6341441196183177e-11
        }
      }
    ],
    "query_amounts": [
      [
        1.0000000003500222,
        1.9999999998249884
      ]
    ],
    "query_diagnostic": {
      "status": "stationary-tolerance",
      "iterations": 17,
      "projected_gradient": 3.492464095700143e-10
    },
    "query_prediction": [
      [
        1.0000000002918146,
        1.9999999999425682,
        3.0000000000574314
      ]
    ]
  },
  "ordinary_distinct_route": {
    "steps": [
      {
        "steps": 1,
        "dictionary": [
          [
            1.0000000105350535,
            0.0,
            0.9999999981187406
          ],
          [
            0.0,
            0.9999999835389796,
            0.9999999983538981
          ]
        ]
      },
      {
        "steps": 2,
        "dictionary": [
          [
            0.9999996537996108,
            0.0,
            0.9999998708866715
          ],
          [
            0.0,
            1.0002228271420335,
            0.9998332747200691
          ]
        ]
      }
    ],
    "n_components": 2,
    "query_amounts": [
      [
        1.0002600177849574,
        1.9998138986743619
      ]
    ],
    "query_prediction": [
      [
        1.00025967149455,
        2.000259511490002,
        2.999740367780353
      ]
    ],
    "warnings": []
  }
}
```


The practical decision is now precise: use fresh queries against a current dictionary, and know whether training memory stores old codes, old rows or something else. [Practice U](#practice-u-old-statistics-versus-new-encoding) asks you to distinguish those objectives with the changed `h=2` row. The next section changes the **number of data axes**, which exposes a different boundary: a compact nonnegative array may still omit essential structure.

## 18. Keep extra axes and recognize what is missing

**What if one row has more structure than a list of bins?** Preserve the named axes before deciding how to compress them. [Update as rows arrive](#17-update-as-rows-arrive) changed training order while retaining a row-by-feature table. A subject measured at several times has a third axis; treating time and feature as interchangeable can hide the question we meant to answer. We now switch to one exact three-axis array, then a separate two-sample Fourier example to distinguish information we reorganize from information we discard.

**What is one nonnegative component with three axes?** One amount from each axis multiplies into each addressed cell.

<!-- figure:D64 -->

The picture's axes are observation `i`, feature `j`, and time `t`, each with positions 0 and 1. The observation vector is `a=[1,2]`, the feature vector is `b=[1,0]`, and the time vector is `c=[1,3]`. Choose address `(i,j,t)=(1,0,1)`: the marked entries are `a1=2`, `b0=1`, and `c1=3`, so the cell is 6. No sum over components is needed because this is one component.

At time 0 the observation-by-feature slice is `[[1,0],[2,0]]`; at time 1 it is `[[3,0],[6,0]]`. The second feature is zero at both times for both observations because its factor entry `b1=0`. A zero entry erases the slice associated with that axis position; an entire zero factor would erase the whole tensor. A **tensor** here simply means a multidimensional array with named axes. Its order is three, meaning three indices, not matrix rank three.

This three-vector outer product is written

\[
T=a\otimes b\otimes c,\qquad T_{ijt}=a_i b_j c_t.
\]

The outer-product symbol is used here for this entrywise three-axis construction; it is not a flattened matrix product whose axes are implicit. We call a nonzero outer product **rank one** in the CP sense because it needs one such separable component. “Separable” means the dependence on `i`, `j` and `t` factors into independent multipliers, not statistical independence of random variables. A general array may need several terms.

**Does flattening destroy the measurements?** Not when the column address map is retained—but an unconstrained matrix factorization can forget separable structure.

<!-- figure:D65 -->

The same eight cells now form the matrix `[[1,3,0,0],[2,6,0,0]]`. Its rows are observations; its columns are the ordered pairs `(feature,time)=(0,0),(0,1),(1,0),(1,1)`. Time changes fastest within each feature, so column address is `2*j+t`. Our marked tensor cell `(1,0,1)` maps to matrix row 1, column 1 and still equals 6. This is **unfolding**. It reorders cells without deleting them. Without that pair-to-column map, a “feature 1” in the matrix could ambiguously mean a time or an original feature.

For this one-term example the flattened pattern is `[b0*c0,b0*c1,b1*c0,b1*c1]=[1,3,0,0]` and observation amounts are `[1,2]`. It can be represented by rank-one NMF. But a general four-entry matrix pattern need not equal the outer product of a two-entry feature vector and a two-entry time vector. Flattening followed by ordinary NMF allows a broader pattern class than enforcing a shared feature/time factorization. It is the **model constraint**, not the mere rearrangement of cells, that changes the assumption.

The first branch of the picture extends the outer product by adding several components. In a **CP decomposition**—CANDECOMP/PARAFAC—the same component index `r` chooses one observation vector, one feature vector and one time vector, whose outer product is added to the others:

\[
\widehat T_{ijt}=\sum_{r=1}^{R} A_{ir}B_{jr}C_{tr}.
\]

`A` is observation-by-component, `B` feature-by-component and `C` time-by-component. Requiring every entry nonnegative makes each term additive. For `I` observations, `J` features and `T` times, the factors use `R(I+J+T)` numbers, instead of the dense array's `IJT`, before optional scaling weights or metadata. That is a potential saving when rank is small, not a guarantee for every array or rank. Positive factor rescaling and component permutation remain possible, and CP identifiability has its own conditions; the matrix support proof in §14 cannot simply be renamed a tensor proof.

The other branch permits different component counts on each axis and an intervening **core** array. In a **Tucker decomposition**, a core cell `G_pqr` weights the interaction of observation component `p`, feature component `q`, and time component `r`:

\[
\widehat T_{ijt}=\sum_{p=1}^{P}\sum_{q=1}^{Q}\sum_{r=1}^{R}
G_{pqr}A_{ip}B_{jq}C_{tr}.
\]

Our same rank-one array uses `P=Q=R=1`, core `[1]`, and the original vectors as the single factor columns. Its factor/core multiplication therefore reproduces exactly `a_i*b_j*c_t`. The separate inset deliberately changes examples: its three factor matrices are `I2`, the 2×2 identity, and its core has the sole nonzero `G[0,1,0]=2`. Its reconstructed tensor has the sole nonzero cell `T[0,1,0]=2`. It is **not** another fitted explanation of our original `T`. It shows that a core can connect different latent positions on different axes, rather than always tying position `r` to position `r` to position `r`.

Tucker storage is `IP+JQ+TR+PQR`; an oversized core can erase a compression advantage. A superdiagonal core with equal axis ranks recovers CP as a special structural case. Neither shape choice supplies missing observations, physical identities or a global optimum. The [Kolda–Bader survey's CP/Tucker definitions](https://www.kolda.net/publication/TensorReview.pdf) distinguish those forms and their axis ranks. [Tensor Algebra §4](https://ronak.sh/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight) provides the local unfolding, mode-product and outer-product foundations.

The small complete program later in this section constructs every cell with loops and checks the ordinary `np.einsum` route for the same contractions. It does **not** fit CP or Tucker factors. General nonnegative tensor fitting needs dedicated initialization, masked/sparse objectives, convergence/degeneracy analysis and model selection beyond this matrix lesson. For that next investigation, [TensorLy's nonnegative CP](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html) and [nonnegative Tucker](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html) document actual public optimizer interfaces and returned factor/core shapes. Those are specialist extension resources, not a promise that a general optimizer has already been derived here or in the prerequisite.

**Does sparse storage tell us which values were observed?** No: storage and missingness are separate contracts. A word-count zero can be an observed absence stored implicitly in a sparse matrix. A missing spectral measurement can be absent from the objective using the mask from [Control penalties and incomplete observations](#11-control-penalties-and-incomplete-observations). Discarding unstored zeros would change the first objective; inserting measured zeros would change the second. More axes make the same distinction important at a larger scale. Describe the observation set and error denominator explicitly before selecting sparse or tensor software.

**Can a nonnegative time-frequency picture reconstruct sound by itself?** Magnitude omits the direction of a complex coefficient.

<!-- figure:D66 -->

We switch from the constructed tensor to a separate, exact two-sample Fourier calculation. Each Fourier coefficient is an arrow in the complex plane: its length is **magnitude**, and its angle is **phase**. The coefficient lists are `[0,1]` and `[0,-1]`. Both have magnitudes `[0,1]`, but the second arrow points right in the first list (phase 0) and left in the second (phase `pi`). A magnitude bar keeps the length and throws away that direction. The zero-frequency coefficient is zero; its angle has no signal-bearing meaning here.

For two samples, the inverse DFT with the convention used here divides by 2. The first sample adds the coefficients; the second subtracts the second coefficient because its rotating factor is `exp(i*pi)=-1`. Thus `[0,1]` gives `[0.5,-0.5]`, whereas `[0,-1]` gives `[-0.5,0.5]`:

\[
x_n=\frac12\sum_{k=0}^{1}X_k e^{2\pi i kn/2}.
\]

`i` in this equation is the imaginary unit, not our earlier observation index; we have changed to the standard finite-Fourier notation for this separate example. The two real waveforms differ even though their magnitude arrays agree exactly. Their equal magnitudes therefore cannot specify a unique waveform. [Fourier §2](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#2-describe-an-oscillation-with-a-rotating-arrow) explains the rotating arrow; [Fourier §6](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#6-transform-a-finite-list-exactly) derives the finite transform and normalization.

The **short-time Fourier transform**, or STFT, applies a windowed Fourier transform to overlapping short signal segments. Its columns index time frames and its rows index frequency bins. A magnitude spectrogram is the nonnegative array of coefficient lengths. If `S` is that complex array, `|S|` is magnitude and `|S|²` is power; they are different numerical representations and lead to different losses/rulers. To match this lesson's rows-as-observations convention, transpose a frequency-by-time magnitude array before using row-oriented NMF, or deliberately state an alternative factor orientation. A factor called a “spectral template” should then have named frequency bins, while its time amounts name frames.

A learned additive approximation to magnitude does not restore the missing phase. Reusing mixture phase is an extra approximation; reconstructing a waveform also requires the matching window, overlap, transform size and inverse convention. An iterative magnitude-to-waveform method searches for a signal compatible with a target magnitude but does not establish a unique original phase or auditory source identity. [librosa STFT](https://librosa.org/doc/main/api/generated/librosa.stft.html) documents the complex array, magnitude and phase interface; [Griffin–Lim](https://librosa.org/doc/main/api/generated/librosa.griffinlim.html) is an optional reconstruction route. These inspected links are the development 1.0.0 documentation, so check your installed stable version before using its parameters. No audio experiment or quality comparison is being inferred from our two-sample proof.

**How can we verify the anatomy without an unexplained optimizer?** The complete `nmf_axis_phase.py` below uses explicit addressed multiplication, explicit unfolding and direct inverse sums, then compares them with `np.einsum` and `np.fft.ifft`. Every tensor cell is supplied by the three vectors; no training data, random start or fitting step is hidden. Direct complex exponentials leave a tiny imaginary roundoff term for `sin(pi)`; the output preserves it rather than presenting it as measured signal.


```python
"""Exact constructed tensor addresses and finite Fourier phase counterexample."""
import json
import numpy as np


def main():
    a=np.array([1.,2.]);b=np.array([1.,0.]);c=np.array([1.,3.])
    tensor=np.empty((2,2,2))
    for i in range(2):
        for j in range(2):
            for t in range(2):tensor[i,j,t]=a[i]*b[j]*c[t]
    ordinary=np.einsum('i,j,t->ijt',a,b,c)
    unfolded=np.empty((2,4))
    for i in range(2):
        for j in range(2):
            for t in range(2):unfolded[i,2*j+t]=tensor[i,j,t]
    # Tucker(1,1,1) has one core entry; this equals the same rank-one tensor.
    core=np.ones((1,1,1))
    tucker=np.einsum('pqr,ip,jq,tr->ijt',core,a[:,None],b[:,None],c[:,None])
    other_core=np.zeros((2,2,2));other_core[0,1,0]=2
    identity=np.eye(2)
    other=np.einsum('pqr,ip,jq,tr->ijt',other_core,identity,identity,identity)
    waves=[]
    for coefficients in [[0.,1.],[0.,-1.]]:
        coefficients=np.array(coefficients,dtype=complex)
        samples=[]
        for n in range(2):
            samples.append(sum(coefficients[k]*np.exp(2j*np.pi*k*n/2) for k in range(2))/2)
        ordinary_inverse=np.fft.ifft(coefficients)
        waves.append({'coefficients':coefficients.real.tolist(),'magnitude':np.abs(coefficients).tolist(),
                      'second_bin_phase':float(np.angle(coefficients[1])),
                      'direct_inverse_real':np.array(samples).real.tolist(),
                      'direct_roundoff_imaginary':np.array(samples).imag.tolist(),
                      'ordinary_ifft_real':ordinary_inverse.real.tolist()})
    print(json.dumps({'scope':'New exact anatomy only, no tensor optimizer/audio experiment',
        'factors':{'observation':a.tolist(),'feature':b.tolist(),'time':c.tolist()},
        'tensor_ijt':tensor.tolist(),'time_slices':[tensor[:,:,t].tolist() for t in range(2)],
        'address_1_0_1':float(tensor[1,0,1]),'unfolded_j_major_t_minor':unfolded.tolist(),
        'einsum_equal':bool(np.array_equal(tensor,ordinary)),'tucker111_equal':bool(np.array_equal(tensor,tucker)),
        'different_tucker_core':other_core.tolist(),'different_tucker_tensor':other.tolist(),
        'waves':waves},indent=2,allow_nan=False))


if __name__=='__main__':main()
```


Here is its full new finite output. The loops, contractions, exact address and unfolding agree; both inverses share magnitude and differ in sign. The work is deliberately only the promised anatomy. Materializing a dense outer product needs `O(IJT)` cells; retaining its three factors needs `O(I+J+T)` values. Production contractions should avoid materializing an array when only selected cells or a contracted result are required. This two-sample inverse is a direct definition check, not a performance recommendation to replace an FFT by nested loops.


```json
{
  "scope": "New exact anatomy only, no tensor optimizer/audio experiment",
  "factors": {
    "observation": [
      1.0,
      2.0
    ],
    "feature": [
      1.0,
      0.0
    ],
    "time": [
      1.0,
      3.0
    ]
  },
  "tensor_ijt": [
    [
      [
        1.0,
        3.0
      ],
      [
        0.0,
        0.0
      ]
    ],
    [
      [
        2.0,
        6.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "time_slices": [
    [
      [
        1.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        3.0,
        0.0
      ],
      [
        6.0,
        0.0
      ]
    ]
  ],
  "address_1_0_1": 6.0,
  "unfolded_j_major_t_minor": [
    [
      1.0,
      3.0,
      0.0,
      0.0
    ],
    [
      2.0,
      6.0,
      0.0,
      0.0
    ]
  ],
  "einsum_equal": true,
  "tucker111_equal": true,
  "different_tucker_core": [
    [
      [
        0.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        0.0,
        0.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "different_tucker_tensor": [
    [
      [
        0.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        0.0,
        0.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "waves": [
    {
      "coefficients": [
        0.0,
        1.0
      ],
      "magnitude": [
        0.0,
        1.0
      ],
      "second_bin_phase": 0.0,
      "direct_inverse_real": [
        0.5,
        -0.5
      ],
      "direct_roundoff_imaginary": [
        0.0,
        6.123233995736766e-17
      ],
      "ordinary_ifft_real": [
        0.5,
        -0.5
      ]
    },
    {
      "coefficients": [
        0.0,
        -1.0
      ],
      "magnitude": [
        0.0,
        1.0
      ],
      "second_bin_phase": 3.141592653589793,
      "direct_inverse_real": [
        -0.5,
        0.5
      ],
      "direct_roundoff_imaginary": [
        0.0,
        -6.123233995736766e-17
      ],
      "ordinary_ifft_real": [
        -0.5,
        0.5
      ]
    }
  ]
}
```


We can now name three different boundaries accurately: flattening with an address map **reorganizes** information, imposing CP/Tucker **restricts** a model class, and keeping magnitude alone **discards** phase. The final changed tasks ask you to make those distinctions yourself, alongside the optimization, state and interpretation decisions from the rest of the lesson.

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
