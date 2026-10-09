## 4. Choose what an observer can see

TV searched over events. We can search over other observation rules, provided their size is constrained. Change to physical positions (−3,−1,1,3): P puts masses (.4,.1,.1,.4) on those positions and Q puts (.1,.4,.4,.1). The first law places more mass in the tails; the second places more in the middle.

[[D18]]

A score g=(1,0,0,1) selects both tails. Multiply each difference pᵢ−qᵢ by its score and add: .3×1−.3×0−.3×0+.3×1=.6. This is a **witness** to unequal laws: a rule whose expectation differs. Its signed attained gap belongs to this particular rule. An IPM searches for the largest absolute gap over a class of permitted rules:

$$d_{\mathcal F}(P,Q)=\sup_{g\in\mathcal F}|\mathbb E_Pg-\mathbb E_Qg|.$$

Without a size constraint, multiplying a useful score by a large constant makes its gap unbounded. If the class contains only constants, every gap is zero. The choice of class therefore specifies the question.

[[D19]]

The bounded class permits each score to lie in [0,1]. The linear class allows g(x)=ax with |a|≤1. The 1-Lipschitz class permits scores to bend, but no pair's score difference may exceed its physical distance: |g(x)−g(y)|≤|x−y|. These are different constraints, not a chain of nested classes with the same score range.

| Allowed rules | Supremum | What is constrained |
| --- | --- | --- |
| All measurable g in [0,1] | TV | Bounded event/loss scores. |
| All measurable g in [−1,1] | 2TV | A doubled score range. |
| g(x)=ax, ∣a∣≤1 | ∣E_PX−E_QX∣ | A single slope. |
| All 1-Lipschitz g | W₁ on the stated spaces with finite first moments | Change in score per unit ground distance. |
| Unit ball of a chosen RKHS | MMD, developed in section 6 | Feature-space norm. |

In the first observer stage, edit the event mask and the two law weights. The weights normalize as in section 2. The current event gap is signed; the displayed TV optimum is nonnegative. Selecting the middle outcomes reverses the sign, while selecting no outcomes gives zero. The plot keeps the chosen rule after a law edit so that its consequence is visible.

### Why a linear rule misses spread

Next allow a single slope a and ask whether changing it can reveal the same difference.

[[D20]]

Both laws have mean zero: the negative and positive lever arms cancel separately. Therefore E_P[aX]−E_Q[aX]=a×0 for every permitted a. The event score still gives .6. A linear rule can distinguish other laws: point masses at −1 and +1 have absolute mean gap two, attained with slope −1 for the P-minus-Q sign convention. A zero result can mean that the observer is blind to the particular change.

For a fixed function class with finite expectations and supremum, symmetry and the triangle inequality follow from absolute values and the supremum. But distinct laws may give the same expectations for all permitted rules. Then the result is a **pseudometric**. A metric requires that the class separate every pair of laws under consideration. If the class is closed under negation, the absolute value can be omitted in the supremum because −g reverses the sign.

### Construct an optimal one-dimensional Lipschitz rule

Flexible slopes can score both tails above the middle. Accumulate the mass imbalance from left to right.

[[D21]]

At the three intervals, the cumulative differences are S=(.3,0,−.3). Each interval has length two. Anchor g at zero on the first position and choose adjacent slopes −1,0,+1, giving scores (0,−2,−2,0). They change by at most the distance between positions. Their attained gap is .6+0+.6=1.2 location units. A zero slope vector gives zero and is legal; it simply is not optimal.

The sum of interval imbalance times interval width is also the exact one-dimensional W₁ distance. Here is why the constructed score attains it.

[[D22]]

For ordered x₁<⋯<xₙ, define Δᵢ=pᵢ−qᵢ and Sᵢ=Σ_{j≤i}Δⱼ. Since Sₙ=0, writing Δᵢ=Sᵢ−Sᵢ₋₁ makes adjacent terms cancel:

$$\sum_{i=1}^n\Delta_i g_i=\sum_{i=1}^{n-1}S_i(g_i-g_{i+1}),
\qquad\left|\sum_i\Delta_i g_i\right|\le\sum_{i=1}^{n-1}|S_i|(x_{i+1}-x_i).$$

Choose gᵢ−gᵢ₊₁=sign(Sᵢ)(xᵢ₊₁−xᵢ). Every interval then contributes its nonnegative upper value. Adjacent slope bounds imply all nonadjacent bounds by summing distances, so the constructed function is legal. This proves the finite sorted formula. The general Kantorovich–Rubinstein dual on spaces such as ℝᵈ, with finite first moments, is developed in Optimal Transport.

The later observer view adds three editable adjacent slopes in [−1,1]. It shares the current laws with the preceding event and linear views. The graph and attained contributions update together; the class optimum remains a reference, and the current rule is not silently optimized. Reset the rule locally, or reset the whole observer experiment to restore laws, event mask and all scores.

[[PROGRAMME:fdiv_observers]]

The scratch programme computes prefixes once, integrates the helpful slope signs, and checks every pairwise Lipschitz constraint for this four-point example. Prefix construction is O(k) after positions are ordered; the explicit all-pairs check shown is O(k²). Its TV=.6 is dimensionless, whereas W₁=1.2 has location units. Multiplying positions by ten multiplies W₁ by ten and leaves TV unchanged. Arbitrary integer encodings of categories would invent that geometry.

We can see the observer's blind spot by plotting the information it retains.

[[D23]]

Plot a law at (mean, second moment). The broad and narrow laws have equal first coordinate but different second coordinates; projection onto the mean axis merges them. Even two moments can collide: P puts equal mass at ±1, while Q puts (.25,.5,.25) at (−√2,0,√2). Both map to (0,1). A collision marker means distinct laws have the same retained features, not that their source outcomes moved to new coordinates.

## 5. Separate overlap from geometric closeness

The score class can change even the meaning of “approaches.” Let δₓ mean that all probability sits at x. Compare P=δ₀ and Q=δₕ.

[[D24]]

Both stems have unit mass. At h=.5 they occupy different locations, so an exact-location event identifies their source perfectly. For every h>0, TV=1, JS=ln 2, H²=1 and both KL directions are infinite. At h=0 the laws are equal and all these discrepancies are zero. W₁=h decreases continuously to zero as the displacement shrinks.

Move h alone in this early investigation, or use the exact-zero control. Separate aligned lanes preserve the true location at coincidence; a display offset must not masquerade as displacement. The finite metrics use their own labelled units, while infinity is a separate extended-value result. For h=1/n, geometric distance tends to zero although exact-location events still distinguish the laws for every finite n.

A real sensor may observe less than an exact coordinate. Model that observation with an explicit common map.

[[D25]]

Use b(x)=⌊x⌋ with bins [0,1),[1,2),[2,3), and so on. When h=.4, both laws produce observed bin zero and their observed TV is zero. When h=1.2, the bins differ and TV is one. The boundary h=1 belongs to the next bin. This compares equality of measured laws with closeness of the original locations; finite precision is an observation model, not a permission to replace distinct mathematical points by identical ones without explanation.

Generators supported on lower-dimensional sets encounter related singular-support issues. This motivates transport and kernel comparisons. Whether a trained critic supplies useful gradients also depends on its function constraints and optimization; the population comparison and the network approximating it are different objects. After constructing kernels below, we will revisit the atoms with a separate bandwidth experiment.

## 6. Compare means in a feature space

Linear scores missed changes that leave the raw mean fixed. Change what is averaged. A **feature map** φ sends each observation to a vector of properties. Begin with φ(x)=(x,x²), P equally supported at −1,+1 and Q concentrated at zero.

[[D26]]

The two P points map to (−1,1) and (1,1); their mean is (0,1). Q maps to (0,0). A point feature and a distribution's feature mean are distinct objects. The line segment between P's mapped points shows their averaging operation in this two-dimensional feature space. Write these feature averages as μ_P=E_Pφ(X) and μ_Q=E_Qφ(X).

Now score each feature vector using a coefficient vector v, with norm at most one.

[[D27]]

The function g_v(x)=v·φ(x) has expectation gap v·Δ, where Δ=μ_P−μ_Q=(0,1). Cauchy–Schwarz bounds that gap by ‖v‖‖Δ‖≤‖Δ‖. Choosing v along Δ attains it. A horizontal coefficient is blind to this vertical difference; v=(0,1) attains one. Generally,

$$\sup_{\|v\|\le1}v^\top(\mu_P-\mu_Q)=\|\mu_P-\mu_Q\|.$$

At Δ=0 every allowed coefficient gives zero. The norm bound controls scale; adding unbounded coefficients would remove a finite comparison.

### Compute inner products without listing every feature

A **kernel** k(x,y)=φ(x)·φ(y) returns feature similarity. For φ(x)=x it is xy; for φ(x)=(x,x²) it is xy+x²y². The Gaussian kernel uses a distance and bandwidth:

$$k_\sigma(x,y)=\exp\!\left(-\frac{\|x-y\|^2}{2\sigma^2}\right),\qquad\sigma>0.$$

Bandwidth has the same physical units as the coordinates. Similarity is dimensionless. A valid positive-semidefinite kernel makes every finite Gram matrix Kᵢⱼ=k(xᵢ,xⱼ) satisfy cᵀKc≥0; an arbitrary similarity need not do so. Linear and finite-feature kernels may have negative individual entries even though their Gram matrices are positive semidefinite.

For the interactive pair calculation, change to indexed equal-weight lists X=(−2,−2,2,2), Y=(−1,−1,1,1). Repeated values remain separate observations. Start with X₀=−2 and Y₀=−1.

[[D28]]

Their distance is one. With σ=1, scaled squared distance is one and similarity is exp(−½)≈.606531. A Gaussian point has self-similarity one, while far pairs have similarity close to zero. Select a different pair or change σ to see the same operation. Kernel choices appear after their formulas; bandwidth is relevant only for Gaussian similarity.

Compute every pair with fixed row and column identities.

[[D29]]

The eight-by-eight Gram matrix consists of XX, XY, YX and YY blocks. A selected cell connects to its two actual indexed points. Repeated values create repeated rows but do not delete observations or diagonal entries. The Gaussian matrix is symmetric with diagonal ones. Its shading means similarity on [0,1]; later minus signs in an accumulation are separate from this nonnegative similarity scale. The exact-cell table remains accessible when a narrow screen cannot display every label at once.

This stage adds editable sample lists with two to six positions each. It shares its data with the preceding pair view and the following norm/witness views. Valid completed changes update immediately; unfinished invalid text retains the last valid result and explains the input problem. All sample identifiers and selected-pair readouts must refer to that same current state.

### Deeper: why a kernel can stand in for features

First use the finite feature model, where all vectors can be drawn exactly.

[[D30]]

The function g_v has coefficient vector v. The function k(x,·) has coefficient vector φ(x). Their coefficient inner product is v·φ(x)=g_v(x): taking an inner product with the feature of x evaluates the function at x. With v=(0,1) and x=−1 this gives one.

A **reproducing-kernel Hilbert space**, or RKHS, preserves this operation: g(x)=⟨g,k(x,·)⟩_H. Its vectors are functions with an inner product and norm. The exact finite picture motivates the identity; an infinite-dimensional Gaussian feature space is not literally a plane. [Functional Analysis & RKHS](/learn/path/full-curriculum/functional-analysis-rkhs?module=math-foundations) develops construction and completeness.

**Maximum mean discrepancy**, MMD, uses the unit ball of the chosen RKHS as its observer class. The same norm argument gives MMD(P,Q)=‖μ_P−μ_Q‖_H when the means exist. For the measurable finite-feature and Gaussian settings here, E_P√k(X,X)<∞ and the corresponding condition under Q suffice. A bounded Gaussian kernel satisfies them for every probability law. Existence of a mean is separate from whether the mean uniquely identifies the law.

### Expand the norm into pairs

Treat each current list as a finite law assigning equal mass to every listed entry. We can calculate its feature-mean difference without explicitly constructing Gaussian features.

[[D31]]

Expanding the square produces within-X, within-Y and cross terms:

$$B=\left\|\frac1n\sum_i\phi(x_i)-\frac1m\sum_j\phi(y_j)\right\|^2
=\frac{\sum_{i,j}k(x_i,x_j)}{n^2}
+\frac{\sum_{i,j}k(y_i,y_j)}{m^2}
-\frac{2\sum_{i,j}k(x_i,y_j)}{nm}.$$

Both self pairs and repeated-coordinate pairs belong to these **empirical laws**. The two cross blocks can be summed once each, or one can be summed and multiplied by two; doing both would double-count. For the default lists at σ=1, B≈.450196 and its square root is the norm. At this point B is an exact finite-law quantity. What happens when the lists are random samples from unknown populations belongs to section 7.

For population laws, independent X,X′∼P and Y,Y′∼Q give the corresponding identity

$$\operatorname{MMD}^2(P,Q)=\mathbb E k(X,X')+\mathbb E k(Y,Y')-2\mathbb E k(X,Y).$$

The independence in these expectations will explain the sampling correction later. The signs arise from a norm expansion, not a heuristic preference for clustering.

### A witness locates the difference

The feature-mean difference is also a function that can be evaluated at a query t. Trace its separate similarity contributions.

[[D32]]

For the empirical laws,

$$w(t)=\frac1n\sum_i k(x_i,t)-\frac1m\sum_j k(y_j,t).$$

At t=0 the inner points in Y have greater average Gaussian similarity than the outer points in X, so w(0) is negative. Each change of the query updates all pair contributions, both averages and their signed difference. The curve plots this function on the declared query interval; it is a witness, not a probability density. Multiplicity markers retain each point's actual horizontal coordinate.

The reproducing identity gives w(t)=⟨μ_P−μ_Q,k(t,·)⟩. Its RKHS norm is MMD, and E_Pw−E_Qw=MMD². Therefore w/MMD is a unit-norm maximizing critic when MMD>0. At equality the witness is zero and normalization is undefined; display zero without dividing. The finite empirical expectation gap likewise equals B. This is the same calculation through two connected representations.

Here is a complete early implementation for the smaller finite laws X=(−1,1), Y=(0). It computes all pair means and one query with explicit loops. There is no sampling correction: Y may have a single atom because the target is a finite-law norm.

[[PROGRAMME:kernel_means]]

The XX average is (1+e⁻²)/2≈.567667642; YY is one and XY is e⁻½≈.606530660. Their combination is B≈.354606322. The witness at zero is e⁻½−1≈−.393469340, while its expectation gap is again B. The final lines calculate the finite feature map's mean vectors (0,1) and (0,0), with norm one. The Gaussian and two-feature norms use different observers, so their different numerical values are expected. For n and m finite entries, these direct loops take O(n²+m²+nm) time and constant extra pair storage; each witness query is O(n+m).

### When do equal means establish equal laws?

Return to the matched-moment pair from section 4.

[[D33]]

P places equal mass at ±1; Q places (.25,.5,.25) at (−√2,0,√2). Both have feature mean (0,1), so the two-feature norm is zero. Their Gaussian feature means differ. The duplicate lists (−1,−1,1,1) and (−√2,0,0,√2) encode the exact intended weights; entering decimal approximations to √2 introduces only the stated coordinate approximation.

A **characteristic kernel** distinguishes all probability laws in its stated class through their means. Gaussian kernels with fixed positive bandwidth are characteristic on ℝᵈ, so population MMD is a metric on Borel probability laws. Kernel validity, mean existence and characteristic separation are three different properties. Characteristic separation at the population level does not guarantee power for every small-sample alternative.

Bandwidth selects the locality of the same kind of observer.

[[D34]]

All three Gaussian profiles have height one at distance zero. Their widths change with σ. On the default outer-versus-inner lists, σ=.5,1,3 gives B≈.864832,.450196,.053435. Those values describe this particular pair under those kernels. A broad kernel may make a change small, and a very narrow kernel may treat almost every distinct pair as unrelated. Multiplying a kernel by c>0 multiplies MMD by √c, so raw magnitude is not a universal effect-size scale. Coordinate units and bandwidth must be reported together.

Now return to moving atoms with kernels fully defined. This later experiment has its own h and σ state and reset, independently of section 5.

[[D35]]

Each self pair contributes one, and both cross terms use exp(−h²/(2σ²)). Thus

$$\operatorname{MMD}^2(\delta_0,\delta_h)=2\left[1-e^{-h^2/(2\sigma^2)}\right].$$

Its square root is MMD. At fixed positive σ, both tend to zero as h tends to zero. The stable calculation uses `-2*expm1(-h*h/(2*sigma*sigma))` near coincidence to avoid subtracting almost equal numbers. Scaling h and σ together preserves the value; changing σ alone changes the comparison. The equal-height mass stems continue to encode unit probability, not kernel amplitude.
