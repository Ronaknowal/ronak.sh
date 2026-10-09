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

<!-- source:nmf_anchors.py -->

This program's actual output shows the initial two-feature fixture, the separate source-ID duplicate case and the signed-residual example. No digit model is retrained.

<!-- output:nmf_anchors.stdout.txt -->

The duplicate case chooses global IDs `(7,42)`, even though their physical positions in its array are 1 and 0. ID 10 duplicates the first selected direction and is not a third anchor. The excluded zero observation retains its ID for later queries. The final signed numbers agree with the hand projection above.

We have gained recoverability by adding explicit information about the observations, not by declaring every NMF pattern meaningful. The next section takes the same additive mechanism to words and spectra, where the feature units and physical assumptions must be stated again.
