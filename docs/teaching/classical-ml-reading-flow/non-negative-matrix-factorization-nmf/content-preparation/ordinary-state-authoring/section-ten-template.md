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

<!-- fragment:CoordinateNMF.transform -->

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

<!-- fragment:CoordinateNMF.publication -->

The snapshot owns a read-only dictionary; `components_` returns a copy. The returned training amounts are also copied. Query dimensions come from that dictionary rather than a mutable next-fit `n_components`. Changing the next-fit rank to 1 must therefore leave the old model's two-component queries intact until a new candidate successfully replaces it.

Public estimators do not promise that calling a failing `fit` on the same object preserves every previous fitted field. We can provide that application-level behavior without changing the library solver: construct a fresh candidate estimator, fit and inspect it, then publish it. The following complete adapter fixes one deliberately narrow configuration, unpenalized CD/Frobenius, so its state logic is easy to see. The earlier source supplies the actual scratch algorithm. Save `ordinary_nmf_lifecycle.py` beside `nmf_arrays.py`, `nmf_coordinate.py`, `nmf_nnls.py` and their `centered_pca.py` helper, then run `python ordinary_nmf_lifecycle.py` in the same NumPy/SciPy/scikit-learn environment as the earlier examples.

<!-- source:ordinary_nmf_lifecycle.py -->

Follow the adapter's publication point. It validates the fitting table, identities and supplied factor shapes, then creates a local public estimator with `init='custom'`. The validated initial factors are copies, so library updates cannot overwrite the caller's starting arrays. Only after fitting and recomputing a finite data cost does the adapter replace `_state`. The resulting snapshot contains the fitted estimator, its feature tuple, fitted component count and measured half-loss. It is an encapsulated model state, not a claim that a Python dataclass recursively freezes the library object it contains. Callers use the adapter's copied dictionary and query methods.

For a query, the adapter validates feature order before calling the saved estimator's `transform`. Its own empty-table branch returns `(0,fitted_k)`; `inverse_transform` analogously returns `(0,d)` for empty amounts. Those branches are stated adapter behavior, not a claim that a bare sklearn estimator accepts zero-row inputs. Nonempty inverse calls use the ordinary public operation. Finite but capped library fitting may still return a candidate and emit its convergence warning; this adapter does not turn a finite fit into a claim of stationarity. Use the scratch diagnostic or an explicitly computed fixed-block gradient when that is the quantity you need.

The main deliberately switches to a **new constructed training table** `[[3,1,4],[1,2,3],[2,1,3]]`, while keeping the same features and initial H0. This changes the data so we can test the lifecycle without treating an old demonstration as a new experiment. Both routes return shapes `(3,2)`, `(2,3)`, `(1,2)` and `(1,3)` for training amounts, dictionary, query amounts and query reconstruction. In the recorded run, their dictionaries are close but not identical:

<!-- output:lifecycle-main.stdout.txt -->

The query `[1.5,0.5,2]` is reconstructed with small nonzero numerical residuals visible in the output. Its learned amount values are around `[1.57233,0.46233]`, rather than the `[1.5,0.5]` amounts of the supplied H0 calculation above, because the fitted dictionary is different. That comparison connects factor-scale/representation ambiguity to normal API use: the same measured row need not have the same coefficients under different dictionaries. The training half-losses, approximately `9.521514×10⁻¹⁴` and `7.590800×10⁻¹⁵`, describe this tiny changed table only.

The program next modifies returned dictionary copies and verifies that the fitted dictionaries survive. It changes next-fit rank to 1, attempts negative, nonfinite and wrong-shape refits, and verifies exact preservation of each old dictionary and old query result. It also rejects reordered, negative and wrong-width queries. Both empty-query and empty-reconstruction shapes still use the fitted two-component state. The 26 internal conditions test those contracts; they do not prove that arbitrary software cannot fail or that a close reconstruction validates an interpretation of its patterns.

**Deeper: fitting amounts and querying the training rows are different computations.** At finite stopping, alternating fitting may end immediately after an H update. Its returned W was solved against the preceding H. Calling `transform(X_train)` holds the final dictionary fixed and solves amounts again. Consequently, do not require bitwise equality between returned training amounts and a later encoding of the same table, even when the shapes and objective agree. Test the intended reconstruction and stopping contract. When dictionary rows are dependent, an additional reason for different coefficients is genuine nonuniqueness, already illustrated by our NNLS examples.

The added state wrapper does not change the asymptotic cost of the maintained fit or transform. It copies the validated input and initial factors and temporarily holds the old and candidate models together; that overlap is the price of keeping an old model available through a rejected candidate. Stored dictionary size is `k×d`, with feature metadata of length d and the library's fitted attributes. The full scratch solver's Gram, sweep and blocked-diagnostic costs remain those derived in section 6. Avoid keeping all per-row component contribution tensors merely to support these state operations.

Try a changed state problem. A dictionary was trained in order `[F0,F1,F2]`, but a new array arrives in order `[F2,F0,F1]`. Supplying the old names without moving its data is incorrect. Reorder both the data columns and their actual identities consistently, or refuse the query. For the supplied H0, the correctly ordered row `[1,1,2]` has amounts `[1,1]` and zero reconstruction residual. Explain why merely seeing three columns, or obtaining nonnegative output from a mismatched query, would not establish that the representation was meaningful. Then cap a fit early and compare its returned training amounts with a fresh `transform` under the final dictionary; inspect both residual and fixed-block slope instead of assuming exact equality.

We can now initialize, fit, compare a precisely named update and query one coherent model without quietly refitting the question. Next we will make two modeling choices explicit: charging for factor size and excluding measurements that were never observed.
