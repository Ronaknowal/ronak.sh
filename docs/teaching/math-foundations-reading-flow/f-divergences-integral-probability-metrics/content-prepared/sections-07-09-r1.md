## 7. Separate a sample score from a test

The finite-law norm is exact for the listed observations. If those observations are random samples, we must also ask how the statistic relates to the unknown populations.

[[D36]]

Four X observations at (−2,−2,2,2) assign mass one quarter to each indexed observation, yielding empirical mass one half at each distinct location. Y does the same at −1,+1. Equal coordinates may belong to different experimental units. Merging their empirical masses does not erase the indices used in a sample calculation.

Suppose X₁,…,Xₙ are iid from P and Y₁,…,Yₘ are iid from Q, independently of X. The empirical squared norm B from section 6 is a **biased estimator** of population MMD². The source of bias is visible in the pair matrix.

[[D37]]

There are n² ordered within-X pairs. The n diagonal terms use the same draw twice, φ(Xᵢ)·φ(Xᵢ), whereas independent population pairs require distinct draws. Both (i,j) and (j,i) are included. All nm cross pairs use independent groups, including pairs that happen to have equal coordinate values. Bias concerns reused random variables, not numerical equality of their values.

To remove this bias, exclude only the within-group diagonals and change their denominators to count the remaining ordered pairs.

[[D38]]

For n,m≥2,

$$U=\frac{\sum_{i\ne j}k(x_i,x_j)}{n(n-1)}
+\frac{\sum_{i\ne j}k(y_i,y_j)}{m(m-1)}
-\frac{2\sum_{i,j}k(x_i,y_j)}{nm}.$$

Each retained term now has the intended independent-pair expectation, giving E[U]=MMD² under the stated sampling assumptions. This does not constrain every realization's sign. With identical two-point lists X=Y=(−1,1) at σ=1, B=0 while U=e⁻²−1≈−.864665. The independent estimator investigation begins with exactly that contrast. It has its own editable samples, bandwidth and reset, separate from the earlier witness experiment.

Report U with its sign. Taking √U is not real-valued in this case, while replacing U by |U| changes its expectation and loses unbiasedness. The square root of B is a valid empirical-law distance and answers a different question.

### Deeper: calculate the bias from pair counts

Separate a reused draw from an independent replica before expanding its expectation.

[[D39]]

Among n² X pairs, n have expectation E‖φ(X)‖² and n(n−1) have expectation ‖μ_P‖². Their normalized difference from the population within term is

$$\frac{\mathbb E\|\phi(X)\|^2-\|\mu_P\|^2}{n}
=\frac{\mathbb E\|\phi(X)-\mu_P\|^2}{n}.$$

The cross term has the intended expectation already. Including Y gives

$$\mathbb E B=\operatorname{MMD}^2(P,Q)
+\frac{\operatorname{Var}_H\phi(X)}n+\frac{\operatorname{Var}_H\phi(Y)}m,$$

where Hilbert variance means E‖φ(X)−μ_P‖². The finite second-moment condition is stronger than merely naming a mean; bounded Gaussian kernels satisfy it. Both added terms are nonnegative. The pair counts establish this expectation algebraically.

The complete kernel programme follows with every reported quantity defined. It accumulates all Gaussian pair sums, computes B and U, evaluates the witness, and checks the identical-list contrast. For this Gaussian kernel, subtracting n and m removes exactly the diagonal ones. A general kernel requires subtracting its actual diagonals instead.

[[PROGRAMME:fdiv_kernel]]

The three bandwidth rows change the same observed lists. The witness expectation gap agrees with B because both expand the same feature-mean difference. The signed U output is preserved. Pair work is quadratic in list lengths; the loops avoid allocating a full Gram matrix but still perform every pair calculation.

### Make the null experiment explicit

A positive statistic is not yet a test. Under H₀:P=Q, assume all observations are independent draws from that common law. Conditional on the pooled observations, assigning n of their indices to X is exchangeable: every allocation has the same conditional status under the null. Compute the same statistic for each allocation and compare the observed one with that reference.

[[D40]]

The eight fixed IDs 0–7 sit at (−2,−1.5,−1,−.5,.5,1,1.5,2). The observed X group is always IDs 0–3. There are C(8,4)=70 allocations, including the observed group and its complement. Current group colour changes when inspecting another allocation, while each observation's ID and coordinate stay fixed. This deliberate colour role is different from treating colours as immutable sample identities.

Inspecting an allocation changes the highlighted reference member; it does not redefine which data were observed. Repeated coordinate values keep their distinct IDs and allocation multiplicity. The eight coordinates can be edited directly, but the observed index set stays the first four.

[[D41]]

At the initial σ=1, the observed B≈1.311848. Two of the seventy reference statistics are at least as large, so the inclusive right-tail p-value is 2/70≈.028571. The label-swap complement has the same score. Every statistic is represented with its multiplicity, and the exact numerical list determines the count, not histogram bins. The implementation includes values within 10⁻¹² below the observed score as numerical ties. If all coordinates are equal, every statistic is zero and p=70/70=1.

Exact enumeration needs no Monte Carlo add-one correction. Sampling only some allocations instead requires the appropriate randomized-test convention. Paired observations, time dependence, repeated measures or different collection procedures can invalidate unrestricted exchangeability. A paired sign-flip test, as in Hypothesis Testing, has a different null mechanism. A permutation scheme must follow the actual experimental unit.

### Repeat the whole selection rule

Choosing bandwidth after seeing labels changes the procedure. If the declared statistic selects the largest score across several bandwidths, repeat that selection for every allocation.

[[D42]]

For each split, compute B at σ=.3,1,3, then take the maximum. Apply this to both the observed allocation and every reference allocation. The interactive fixed-bandwidth and maximum-over-three modes expose this difference. Changing mode or bandwidth preserves the data and resets reference inspection. Neither mode retrospectively makes exploratory data choices prespecified.

[[PROGRAMME:fdiv_permutation]]

The first output uses fixed σ=1. The second repeats the full three-bandwidth maximum. On this fixture, both have the same observed score and tail count; a different procedure need not produce a different p-value on every dataset. Fixing a choice using prior knowledge or separate training data is another defensible design. Reporting the smallest p-value after repeated tries while ignoring selection is not that design.

A small p-value is evidence against equality under the declared null experiment, not the probability that H₀ is true or a measure of practical harm. A large value does not establish equality or power. Report the statistic, representation, kernel, sample unit, allocation rule and a task-relevant consequence.

### Keep the statistic while changing its memory footprint

The exact pair formula remains quadratic work, but it need not occupy a full quadratic array. The following complete ordinary-tool route evaluates the same sums in blocks and compares them with full Gram arrays.

[[D43]]

For x=(0,.2,.4), y=(1.2,1.4,1.6), σ=.5, divide pair matrices into tiles with at most two rows and two columns. Visit each tile, calculate squared Euclidean distances and Gaussian similarities, and accumulate its sum. Only self-block diagonal entries are excluded for U. With a general block width b, the extra kernel arrays occupy O(b²) memory in addition to the input samples; all pairs still require O((n+m)²d) arithmetic for d features.

In the code, `cdist(..., "sqeuclidean")` computes direct squared distances. `np.exp` converts them to similarities. `math.fsum` combines positive block sums. The ordinary full-Gram check calls `rbf_kernel` with **gamma=1/(2σ²)**, here gamma=2; its default 1/d is not the chosen bandwidth convention. Arrays have shape (observations, features).

The tiny six-point exact test deliberately stores its full Gram matrix so SciPy can index each three-versus-three allocation. It requests independent permutations, an exact reference via `n_resamples=np.inf`, and the greater tail. The same declared bandwidth is used for every split.

[[PROGRAMME:mmd-library-bridge]]

The blockwise and full-Gram values agree: B=1.640442909 and U=1.545416627. The exact test has twenty allocations and right-tail p=.1. The last check uses `rel_entr` for explicit KL terms and compares JS with the **square** of `jensenshannon`, since SciPy returns its metric root. Both use natural logs here. Finite moderate coordinate scales are assumed: squared differences or σ² can exceed floating-point range at extreme scales.

**Implementation practice: identical samples and changed block size.** Set both samples to [[0],[1]], σ=1, and change block size from one to seven. Compare B and U, then reorder the rows.

**Hint.** The empirical laws match, but removing within-sample diagonals changes a sample estimator.

**Solution.** B is zero up to roundoff. U=e⁻½−1≈−.39346934. Both are invariant to block size and row order. The signed value is an estimator distinction, not a negative population squared norm. Call the supplied `mmd2` with `unbiased=False` and `True`; the function-only companion later in the lesson makes these calls without executing the demonstration.

Exact enumeration grows as C(n+m,n). Larger investigations may use a declared randomized reference, linear-time estimators or random-feature approximations, each with a statistical approximation contract. Blocking changes storage rather than the exact target. Density-based KL introduces smoothing or density-model choices; fitted critics introduce fitting/generalization error; empirical transport has sampling error, and Sinkhorn adds regularization and numerical residuals. These choices are part of the measurement procedure.

## 8. Build a variational critic

The IPM used the same score linearly under both laws. An f-divergence also permits a critic formulation, but Q supplies a nonlinear penalty. Begin with a line lying below a convex curve.

[[D44]]

Use the **raw** KL generator f(u)=u ln u. At u*=1.75, its tangent slope is T*=1+ln 1.75 and its vertical intercept is −1.75. The line touches the curve there and stays below it elsewhere. Negative curve values for 0<u<1 are legitimate for this raw generator. We changed from the centered generator intentionally; conjugates depend on that choice even when divergence totals agree.

For a proposed slope t, raise a line of that slope until it would touch the curve. The largest allowed intercept is −f*(t), where the **convex conjugate** is

$$f^*(t)=\sup_{u\in\operatorname{dom}f}\{ut-f(u)\},\qquad f(u)\ge ut-f^*(t).$$

Substitute u=pᵢ/qᵢ, use an outcome-specific slope Tᵢ, multiply by qᵢ and sum:

$$D_f(P\Vert Q)\ge\mathbb E_PT-\mathbb E_Q f^*(T).$$

For finite positive laws, choosing Tᵢ=f′(pᵢ/qᵢ) makes each tangent touch at its own ratio and attains equality in the cases here. Support boundaries may require limiting slopes rather than a finite maximizer. Restricting the allowed critic can leave an approximation gap.

### Derive the KL reward and penalty

Maximize ut−u ln u over positive u. The derivative is t−ln u−1, so the maximizer is u=exp(t−1). Substitution yields f*(t)=exp(t−1), and the optimal slope is T*=1+ln(p/q). Inspect the row arithmetic for the original positive A–C laws.

[[D45]]

Each row receives P-weighted reward pᵢTᵢ and Q-weighted penalty qᵢexp(Tᵢ−1). Reward may be negative, while the penalty is positive. Subtract row by row and add to obtain a lower bound on the true KL=.208473 nats. The live critic Tᵢ=1+a ln(pᵢ/qᵢ)+c begins at a=1,c=0, where the gap is zero. Changing a or c updates every reward, penalty and total. The constant-critic control gives a=0,c=0, hence T=1 and bound zero. Reset restores the optimum.

An additive constant cancels from an IPM expectation difference because both laws have mass one. It does not cancel from the exponential penalty.

[[D46]]

At a=1, adding c changes the bound to KL+c−exp(c)+1. Its gap is exp(c)−1−c≥0, since exp(c)≥1+c. At c=.5, gap≈.148721 and bound≈.059752. The curve has its minimum at c=0. Numerically, `expm1(c)-c` avoids cancellation for a small shift. For a≠1, this shift-only curve is not the total critic gap; the scale has changed the critic as well.

### A sample objective is a different object

Separate the unrestricted population divergence, a restricted population critic value, and a critic selected and evaluated on the same finite observations.

[[D47]]

For the original known laws, T=1 gives zero while T* attains KL. Now change to a counterexample with true P=Q=(.5,.5). Suppose the observed P sample contains only A and the observed Q sample only B. Choose T(A)=t and T(B)=1. Its empirical objective is t−1, which is positive for t>1. Its population objective is instead

$$\tfrac12(t+1)-\tfrac12[e^{t-1}+1]=\tfrac12t-\tfrac12e^{t-1}\le0.$$

True KL is zero. Increasing t can make the observed objective positive without violating the population bound, because the expectations have changed. This chosen realization illustrates overfitting; it is not a claim about its frequency. Sampling fluctuation, selection and fitting require separate treatment. A low restricted population bound can conceal divergence, and a large fitted training objective is not automatically a population lower bound.

### The precise GAN connection

In the original equal-mixture GAN discrimination problem, D(x) predicts whether an observation came from P rather than Q. The population log objective is E_P ln D+E_Q ln(1−D).

[[D48]]

For each positive-mass outcome, maximizing p ln D+q ln(1−D) gives p/D−q/(1−D)=0, hence D*=p/(p+q). The P fraction within each combined-mass column is the equal-prior posterior. On A–C it is approximately (.636364,.285714,.5). A support boundary gives zero or one under the limiting convention 0 ln 0=0; a common-zero outcome has no effect.

Put M=(P+Q)/2. Each optimal log term splits into a log ratio to M and −ln 2, yielding

$$\max_D[\mathbb E_P\ln D+\mathbb E_Q\ln(1-D)]
=-\ln4+2\operatorname{JS}(P,Q).$$

For this example the result is about −1.278448. The identity assumes an unrestricted optimal population discriminator. The common non-saturating generator objective −E_Qln D differs from it. [GAN Fundamentals](/learn/path/full-curriculum/generative-adversarial-networks-gan-fundamentals) is the planned destination for actual alternating network training.

[[PROGRAMME:fdiv_variational]]

The complete programme evaluates known critics and the exact discriminator directly; it trains no network. Four scale/offset pairs expose different bound gaps while KL remains fixed. Both discriminator routes give the same objective. Wasserstein GANs instead constrain a critic to approximate a transport dual; an unconstrained network score is not W₁. Constraint enforcement and optimization remain essential, as the moving-atom illustration alone cannot certify training behavior.

## 9. Test the comparison against the real task

A comparison is useful when its meaning connects to a decision. Ratios, observer classes and sample evidence expose different failures.

### Diagnose a sampling proposal

Suppose observations come from proposal Q but the desired expectation is under P. If P≪Q, use the weight w=p/q; then E_Q[wh]=E_P[h] whenever the expectation is well-defined.

[[D49]]

For P=(.9,.1), proposal Q=(.99,.01) gives the rare outcome weight ten. Reducing its proposal probability to .001 raises the weight to one hundred. These are proposal probabilities, not invented sample counts. The mean weight remains one, while its variance rises from about .818182 to 9.810811.

Indeed E_Qw=1 and

$$\operatorname{Var}_Q(w)=\mathbb E_Q[(w-1)^2]=\chi^2(P\Vert Q),$$

possibly infinite. The proposal creates rare, large corrections. The variance of an importance estimate also depends on its integrand h. Self-normalized estimates have a different finite-sample bias/variance contract.

### Deeper: why chi-square appears near matching laws

Fix a positive reference Q=(.5,.3,.2) and move along direction δ=(1,−1,0), writing P=Q+εδ.

[[D50]]

The total mass stays one because Σδ=0. For small ε the ratio is 1+εδᵢ/qᵢ. If f is twice differentiable near one, Taylor expansion gives a constant term zero, a linear sum that cancels, and

$$D_f(P\Vert Q)=\frac{f''(1)}2\varepsilon^2\sum_i\frac{\delta_i^2}{q_i}+o(\varepsilon^2).$$

For KL, f″(1)=1, so nearby KL is approximately half χ². At ε=.02,.01,.001, the ratios to that quadratic approximation are approximately 1.009469,1.004587,1.000446. At ε=0, the ratio is a limit of one rather than a defined 0/0 computation. This local statement fixes a positive reference and does not cover nonsmooth TV or shrinking reference masses without further assumptions.

[[PROGRAMME:fdiv_weights]]

The first loop verifies mean weight, variance and χ² for three proposals. The second explicitly changes ε and compares KL with its quadratic approximation. Both are O(k) weighted reductions. The output shows how a numerical identity and a limiting approximation answer different questions.

### A small bounded score can hide an expensive miss

Return to named outcomes: P assigns .01 probability to a rare failure and Q assigns zero. Attach a cost to the event before interpreting the discrepancy.

[[D51]]

TV=.01 and JS≈.003478 nats, while forward KL is infinite. A failure cost of one hundred produces risk one under P and zero under Q. The exact range-times-TV bound is 100×.01=1. An inset may magnify the small mass for inspection, but its scale must say so; cost is not encoded by secretly enlarging a probability bar.

A sample of twenty independent observations from P misses the rare event with probability .99²⁰≈.817907. A correctly implemented test still cannot reliably reveal events often absent from its data.

[[PROGRAMME:fdiv_stress]]

The programme reports the support discrepancy, miss probability, risks and loss bound. A useful report combines those quantities with the application consequence. It does not treat a small aggregate number as a complete verdict.

| Need | Candidate and declared choices | Deliberate stress case |
| --- | --- | --- |
| Price probabilities for observed events | Forward KL/log loss with an adequate probability model | A plausible event receives zero or tiny model probability. |
| Bound event or loss gaps | TV with representation and loss range | A rare expensive event disappears. |
| Measure displacement | W₁ or a declared transport cost, with units and moments | Arbitrary codes invent geometry. |
| Compare samples without density estimation | MMD with kernel, bandwidth and sampling/test design | Features or sparse data miss the relevant change. |
| Evaluate a generator | Several held-out task checks with estimator limits | Memorization or omitted modes coexist with a good score. |

For images, a colour shift may be visible in a colour-sensitive representation and erased in an invariant one. Finding a missing class requires both class-sensitive observables and adequate sample coverage. Equal output distributions across groups do not by themselves establish fairness: decisions, conditioning variables and error costs define that question.

### Matching a marginal does not match the original sample

The rate–distortion lesson provides a particularly small pairing example. Let X be a fair sign and Y its proposed reconstruction.

[[D52]]

If Y is an independent fair sign, both marginal laws match exactly. The four joint cells each have mass .25, and their squared errors are (0,4,4,0), averaging two. If Y=X, the joint law instead has diagonal masses .5,.5 and mean squared error zero, with the same two marginals. A marginal comparison cannot select between those couplings. The task must state whether it concerns output frequencies or paired reconstruction fidelity.

### Compare observed measurements with physical units

The corrected UCI Iris dataset contains 150 flowers, fifty from each of three named species, with four measurements in centimetres. Its original classification context differs from this descriptive comparison of finite empirical laws. Use the supplied CSV and retain original row IDs.

[[D53]]

Initially P is the fifty setosa rows and Q the fifty versicolor rows. Plot sepal length and width in centimetres and use Gaussian σ=1 cm. The empirical squared MMD is .6622804839. Changing to petal length and width with the same physical bandwidth gives 1.7166120981. This is a change of measured representation, not a universal ranking of methods. Identical coordinates retain multiplicity through counts and row lists; distance-changing jitter would alter the comparison.

Select one row from each group. The connector uses their actual measured distance, and the readout converts it to Gaussian similarity. For the first sepal pair, row IDs 1 and 51, distance≈1.9235384062 cm and similarity≈.1572371663. Changing display units to millimetres multiplies coordinates and displayed bandwidth by ten together and leaves all similarities and B unchanged. The same-setosa baseline explicitly assigns both sample roles to the same fifty rows, giving B=0. Role colours identify P and Q under that declared selection; they do not independently encode species.

The application uses an importable companion containing the exact `kernel_sum` and `mmd2` functions from the earlier blockwise programme, with no main. Save it as `fdiv_blockwise.py` beside the application and data.

[[PROGRAMME:fdiv_blockwise]]

The complete application first checks the pinned CSV identity and its 150 finite four-coordinate rows. It selects row arrays of shape (50,2), keeps the original IDs, computes scalar pair sums, compares the extracted blockwise route and scikit-learn's full RBF arrays, and checks coordinated unit conversion plus the null. The scalar route supplies an independent formula, not another call to the block helper.

[[PROGRAMME:iris_mmd]]

All three routes agree within 10⁻¹² in the recorded run. This programme fits no model and returns no p-value. Its claim is the stated comparison of the retained measurements. A population test would additionally need a defensible sampling and exchangeability design. For larger data, the blockwise route reduces temporary matrix memory; the scalar and full-Gram routes here are small-fixture checks.
