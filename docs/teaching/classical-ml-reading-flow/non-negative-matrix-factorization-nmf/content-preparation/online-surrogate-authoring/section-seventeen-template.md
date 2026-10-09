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

<!-- source:nmf_online.py -->

This is the full output of the new two-arrival demonstration. The hand figures use exact amounts; the numerical encoder stops at a tolerance and consequently produces tiny nonzero cells instead of exact symbolic zeros. Both are labelled roles, not contradictory fits. The first scratch arrival used 17 encoding iterations, and the second used 17; the two final dictionary sweeps were a configured cap, not a declaration of whole joint stationarity. The ordinary route recorded two incremental steps and no warnings. Its final query prediction is approximately `[1.000260,2.000260,2.999740]`, whereas the scratch prediction is `[1.000000,2.000000,3.000000]` to six decimals; this tiny constructed stream does not establish a general ranking of optimizers.

<!-- output:nmf_online.stdout.txt -->

The practical decision is now precise: use fresh queries against a current dictionary, and know whether training memory stores old codes, old rows or something else. [Practice U](#practice-u-old-statistics-versus-new-encoding) asks you to distinguish those objectives with the changed `h=2` row. The next section changes the **number of data axes**, which exposes a different boundary: a compact nonnegative array may still omit essential structure.
