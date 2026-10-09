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
