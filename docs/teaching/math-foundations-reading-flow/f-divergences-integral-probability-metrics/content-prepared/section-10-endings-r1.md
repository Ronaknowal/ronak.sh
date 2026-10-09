## 10. Practise changed laws and assumptions

State the alphabet or geometry, units, root convention, and whether the target is a law quantity, empirical score, estimator, bound or test. Try each prompt independently before opening its hint or solution. All answers below use natural logs unless stated otherwise.

### T1. Find the decision gap

**Prompt.** For P=(.5,.3,.2), Q=(.25,.5,.25), find an event attaining TV, the optimal equal-prior source-classification accuracy and Pinsker's lower bound on KL. Compute KL to check it.

**Hint.** Select positive p−q differences and retain the half factor in TV.

**Solution.** The first label has the only positive difference, .25. TV=.25 and optimal accuracy=(1+.25)/2=.625. Pinsker gives KL≥2(.25)²=.125 nats. Direct KL is .5ln 2+.3ln .6+.2ln .8≈.148697 nats. This optimum concerns known-law classification; a trained classifier may achieve less.

### T2. Repair two normalization claims

**Prompt.** Repair the claim that every convex f with f(1)=0 separates unequal laws. Use f(t)=t−1. Then explain why TV's score supremum doubles when scores range over [−1,1] instead of [0,1].

**Hint.** Sum the affine generator. Write a signed bounded score as 2h−1.

**Solution.** With its correct support extension, Σq(p/q−1)=Σ(p−q)=0 for every pair. Convexity gives nonnegativity, not separation for every generator; appropriate strict convexity at one is sufficient. For g=2h−1, constants cancel from the expectation gap and the factor two remains. Thus the signed bounded class gives 2TV, not TV.

### T3. Trace a directional support failure

**Prompt.** Compare P=(1,0), Q=(.5,.5). Which KL direction is infinite? Calculate TV and H². Apply a shared constant observation map.

**Hint.** Identify the event that one source can emit and the other excludes. H² uses root masses.

**Solution.** KL(P∥Q)=ln 2 is finite. KL(Q∥P)=∞ because Q can produce the second event. TV=.5 and H²=1−1/√2≈.292893. The constant map produces equal point masses, so every divergence is zero after that map. It has removed the differing event's identity.

### T4. Construct a changed geometric witness

**Prompt.** On locations (−2,0,4), compare P=(.5,0,.5) with Q=(0,1,0). Find the best linear gap, TV and W₁. Construct an attaining 1-Lipschitz rule. Then multiply all location units by ten.

**Hint.** Cumulative imbalances are .5 and −.5 over intervals of lengths two and four.

**Solution.** P's mean is one and Q's is zero, so the best linear gap is one. Disjoint supports give TV=1. W₁=.5×2+.5×4=3. Scores (0,−2,2) satisfy every pairwise Lipschitz bound and attain gap three. Scaling coordinates scales these scores, the linear optimum and W₁ by ten. TV remains one. An arbitrary current legal rule may attain less than the class optimum.

### T5. Find a feature collision

**Prompt.** P assigns equal mass to ±1. Q assigns (.25,.5,.25) to (−√2,0,√2). Does φ(x)=(x,x²) separate them? What does a fixed positive-bandwidth Gaussian kernel imply?

**Hint.** Calculate both mean features; then separate kernel validity from characteristic separation.

**Solution.** Both mean vectors are (0,1), so this finite-feature MMD is zero despite the differing probability at zero. A Gaussian kernel is characteristic on the real line, so population MMD is positive. This is a statement about those laws, not guaranteed finite-sample test power. The duplicated lists (−1,−1,1,1) and (−√2,0,0,√2) encode the required weights for an empirical investigation; state any decimal approximation used for √2.

### T6. Interpret a negative estimate

**Prompt.** Why does replacing a negative unbiased squared MMD estimate by its absolute value lose unbiasedness? Interpret X=Y=(−1,1) at σ=1.

**Hint.** Unbiasedness is an expectation over repeated sampling, not a sign restriction on every realization.

**Solution.** Absolute value pushes negative realizations upward without compensating elsewhere, changing the expectation. Here the empirical laws match, so B=0, but U=e⁻²−1≈−.864665. Report U with its sign and definition; do not take a real square root. The empirical-law distance √B=0 is valid for a different target.

### T7. Repair selection before testing

**Prompt.** A researcher tries ten bandwidths on the same labelled test samples and reports the smallest permutation p-value as if it were prespecified. Give two defensible redesigns.

**Hint.** Locate where labels influenced the complete procedure.

**Solution.** One design fixes the bandwidth using prior knowledge or separate training data, then evaluates one untouched held-out test. Another declares a combined statistic or selection rule and repeats the entire rule in every permutation with suitable calibration. A prespecified family with multiplicity adjustment is another possibility. Freezing the choice only after seeing test labels ignores selection. These redesigns still require a valid sampling/exchangeability model.

### T8. Shift a critic in the opposite direction

**Prompt.** Add c=−.5 to the optimal KL critic with the original P/Q fixed. Calculate the loss of tightness. Compare an IPM shift.

**Hint.** The shifted-optimum gap is exp(c)−1−c.

**Solution.** The gap is e⁻·⁵−1+.5≈.106531 nats. The bound falls from .208473 to about .101942 while true KL is unchanged. IPM shifts cancel because both expectations are linear and both laws have total mass one. The KL Fenchel penalty is exponential under Q, so that cancellation does not apply.

### T9. Report a costly rare omission

**Prompt.** A failure has true probability .02 and cost fifty; a simulator omits it. Calculate the expected-cost error, TV and the probability thirty iid true-law observations never contain the failure. What belongs in the report?

**Hint.** Multiply probability by cost, and use .98³⁰ for repeated nonoccurrence.

**Solution.** Expected-cost error is one and TV=.02. Miss probability is .98³⁰≈.545484. Forward KL is infinite because the simulator excludes a possible event. Report support failure, coverage of the rare event and its application cost alongside bounded discrepancies and any valid test. The sampling design and cost explain why a small bounded score may still matter.

### T10. Build the complete changed exact test

**Prompt.** Build an exact Gaussian-kernel permutation test for X=(−1,−.5,0), Y=(.5,1,1.5), bandwidth .75. Include every three-versus-three allocation and ties; check swap invariance and repeatability. Can this symmetric exact test reject at level .05?

**Hint.** There are twenty allocations, and each has a label-swap complement with the same MMD.

**Solution.** The observed statistic is about 1.096713. Two allocations are at least as extreme, giving p=.1. It cannot reject at .05. With equal group sizes and a symmetric statistic, the inclusive tail contains at least the observed allocation and its complement, so the reference resolution is at least 2/20. More visibly separated points do not eliminate that limit.

[[PROGRAMME:fdiv_project]]

The complete function validates at least two per group, a bounded total for exact enumeration and a nonempty bandwidth rule. It uses actual group/pool sizes, recalculates the whole statistic for each index subset, counts ties and includes the observed allocation. Changing data or bandwidth changes the reference, not just the observed numerator. The deterministic checks in the retained output belong to this exact source; p=.1 is not a posterior probability of equal laws.

### T11. Implement one support-aware KL contribution

**Prompt.** Write a function returning one raw or centered KL contribution from probabilities p and q. Handle common zero, either one-sided zero, equality and near equality. Compare totals for P=(.6,.4,0), Q=(.3,.5,.2). Explain why their raw and centered row values differ.

**Hint.** Process support branches before logarithms. For a small δ=(p−q)/q, the centered penalty is q[(1+δ)ln(1+δ)−δ], whose series starts q(δ²/2−δ³/6+δ⁴/12).

**Solution.** `kl_contribution` in the complete exercise file below returns zero for common zero, q for centered p=0<q, zero for raw p=0<q and infinity for q=0<p. With positive masses it uses `log1p` near equality; centered mode uses the short convergent series rather than subtracting nearly equal first-order quantities. The declared near-equality branch |δ|<.01 and terms through order fourteen make the omitted terms much smaller than double-precision roundoff for these inputs.

Raw rows are approximately (.415888308,−.089257421,0); centered rows are (.115888308,.010742579,.2). Both totals are .326630888 nats. The per-row difference is −p+q, which cancels only after summing normalized laws. At p=q the centered result is zero. At p=.5+10⁻¹⁰, q=.5, the computed centered value is approximately 1.00000017×10⁻²⁰; the last digits reflect floating-point input representation. This is why arbitrary epsilon replacement at missing support is not the same repair as stable arithmetic near equality.

### T12. Repair diagonal exclusion and unequal denominators

**Prompt.** A proposed U implementation deletes every pair with equal coordinate values and divides both within terms by n². Repair it for X=Y=(−1,1), σ=1. Then use X=(−1,1), Y=(−1,0,1), and compare against the blockwise route.

**Hint.** A diagonal is a repeated index, not a repeated value. The two groups may have different lengths.

**Solution.** `corrected_pair_estimators` removes only i=j within X and within Y. It divides the remaining sums by n(n−1) and m(m−1), and leaves every one of the nm cross pairs intact. Equal coordinate values in different observations remain valid terms. The matched two-point case gives B=0, U≈−.864664717. The two-versus-three case gives B≈.039400702, U≈−.576443145. The independent blockwise comparison in the exercise agrees within 10⁻¹⁴. Deleting equal cross values would change the target as well as its normalization.

### T13. Diagnose units and gamma

**Prompt.** A library call sets `gamma=sigma`, then converts coordinates from centimetres to millimetres without changing any other argument. Repair the calculation for X=((0,0),(1,0)) cm, Y=((0,2),(1,2)) cm and physical σ=2 cm. Show both incorrect results as diagnoses, then supply a unit-aware function.

**Hint.** Match the full exponent. Gamma is inverse squared distance; sigma has distance units.

**Solution.** Correct gamma is 1/(2×2²)=.125 cm⁻². The correct empirical squared norm is .740704814. `mmd_in_cm` explicitly converts declared millimetre coordinates to centimetres while retaining the physical bandwidth argument in centimetres; both coordinate representations give the same value. Treating the millimetre numbers as centimetres instead gives about 1.000003727. Using gamma=2 with the original centimetre arrays gives about 1.134954421. Those are altered kernels, not harmless display changes. The complete function validates row-array shapes, finite data, units and positive physical bandwidth before calling the ordinary API.

### T14. Change the observed comparison

**Prompt.** Use the retained virginica rows in a new empirical comparison. Compare versicolor with virginica using the two petal measurements and physical σ=.75 cm. Keep original row IDs, report scalar/blockwise/library agreement and state the descriptive limit.

**Hint.** Reuse guarded loading/selection functions, not the application's demonstration main. Coordinates, bandwidth and role labels must describe the same experiment.

**Solution.** Select rows 51–100 for versicolor and 101–150 for virginica. Both arrays have fifty rows and two petal coordinates in centimetres. The complete exercise's scalar, blockwise and ordinary Gaussian calculations all give B=.8220855200 to the shown precision, agreeing within 10⁻¹². This is a new finite empirical-law comparison. The species labels identify these selected groups; they do not supply a randomized sampling design or a population p-value.

The complete file below supplies all four changed implementations and their focused checks. Keep `fdiv_blockwise.py`, `iris_mmd.py` and the pinned CSV beside it. Importing those guarded modules does not run their demonstration mains. Run `python fdiv_practice.py` after attempting the tasks.

[[PROGRAMME:fdiv_practice]]

## Further learning

- [Polyanskiy and Wu, chapter 7: f-divergences](https://people.lids.mit.edu/yp/homepage/data/LN_fdiv.pdf) is a written canonical continuation of sections 2–3. Follow the definitions, processing and testing interpretations first; its conventions can differ by a factor of two from the half-normalized JS and H² used here. The chapter also offers deeper joint-range, Gaussian and Rényi directions beyond this lesson's computational scope.
- [Muandet and colleagues, Kernel Mean Embedding of Distributions: A Review and Beyond](https://arxiv.org/pdf/1605.09522), especially sections 2.2, 3.1 and 3.5, develops the point-to-law embedding picture and MMD after the finite-feature example. Later chapters continue into conditional means, operators and learning with distributions; those are further-study routes rather than extra prerequisites for this page.
- [Gretton and colleagues, A Kernel Two-Sample Test](https://jmlr.org/papers/volume13/gretton12a/gretton12a.pdf), sections 2–3, provides a research-level second pass through means, witnesses, estimators and testing. Keep the paper's population/sample notation and its estimator convention beside this lesson's all-cross-pairs formula.
- For a spoken route after section 6, [Arthur Gretton's MLSS 2020 lecture on MMD, two-sample testing and generative models](https://www.youtube.com/watch?v=eANiXrWO1dM) is linked with materials from his [official teaching page](https://www.gatsby.ucl.ac.uk/~gretton/teaching.html). The finite examples here provide the prerequisites for following its kernel discussion.

## Technical references

- [Nowozin, Cseke and Tomioka, f-GAN](https://arxiv.org/pdf/1606.00709), section 2, supports the conjugate bound and critic-domain restrictions. [Goodfellow and colleagues, Generative Adversarial Nets](https://arxiv.org/pdf/1406.2661), section 4.1, derives the optimal population discriminator and JS identity. [Arjovsky, Chintala and Bottou, Wasserstein GAN](https://proceedings.mlr.press/v70/arjovsky17a/arjovsky17a.pdf), section 2, motivates geometric convergence with singular supports.
- [SciPy permutation_test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html) specifies independent allocations, exact versus randomized references and tails. [SciPy Jensen–Shannon distance](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.jensenshannon.html) specifies the root and input normalization. [scikit-learn rbf_kernel](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.rbf_kernel.html) specifies row-array shapes and gamma; set it explicitly for a chosen physical bandwidth.
- [UCI Iris](https://archive.ics.uci.edu/dataset/53/iris), DOI 10.24432/C56C76, supplies the corrected observed measurements under CC BY 4.0. The accompanying provenance file identifies the exact retained data and units. The descriptive calculations here use its corrected observations, not a regenerated or synthetic flower dataset.
- [Schrab and colleagues, MMD Aggregated Two-Sample Test](https://www.jmlr.org/papers/v24/21-1289.html) is an optional research route for calibrated kernel aggregation. [Schrab, A Unified View of Optimal Kernel Hypothesis Testing](https://arxiv.org/abs/2503.07084), a 2025 research overview, is a further direction on testing choices. These pointers do not replace the declared finite calibration procedure implemented here.

## Files and setup

The ten finite scratch programmes and `kernel_means.py` use Python's standard library. The ordinary numerical route uses NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; the new recorded executions use Python 3.12.14. Save complete sources under the names shown. The file controls provide whole sources; instructional code stays visible in the reading flow.

| File | Purpose and companions |
| --- | --- |
| `fdiv_original.py` | Positive-mass categorical calculation. |
| `fdiv_support.py` | Extended support and six comparisons, with the triangle example. |
| `fdiv_events.py` | Event enumeration, classification and common maps. |
| `fdiv_observers.py` | Sorted-prefix Lipschitz witness. |
| `kernel_means.py` | Early finite-law pair means and witness without an unbiased estimator. |
| `fdiv_kernel.py` | Full empirical and unbiased pair calculations. |
| `fdiv_permutation.py` | Exact fixed and complete-selection reference. |
| `mmd-library-bridge.py` | Full ordinary blockwise, Gram and exact-test route. |
| `fdiv_blockwise.py` | Importable exact pair-sum and MMD functions, without a main. |
| `fdiv_variational.py` | Exact known-law critic and discriminator arithmetic. |
| `fdiv_weights.py` | Importance variance and local curvature. |
| `fdiv_stress.py` | Missing support, rare-event coverage and task cost. |
| `fdiv_project.py` | Complete changed exact-test task. |
| `iris_mmd.py` | Observed application; requires the blockwise helper and data. |
| `fdiv_practice.py` | Four new implementation/diagnosis tasks; imports both guarded helpers and data. |
| `iris-corrected.csv`, `iris-provenance.json`, `DATA-PROVENANCE.md` | Exact offline measurements, attribution and this comparison's selection. |

## Readiness and next steps

You are ready to continue when you can choose and name the allowed observables, calculate a changed comparison with its units and support conventions, construct a witness, diagnose a feature blind spot, and distinguish an empirical norm from an estimate, bound or test. Explain the role of diagonal pairs and why a permutation reference must repeat the whole procedure. Use a changed implementation and a task-specific stress case to check those skills.

[Graph Fundamentals (Adjacency, Laplacian, Connectivity)](/learn/path/full-curriculum/graph-fundamentals-adjacency-laplacian-connectivity?module=math-foundations) begins the next module branch: representing entities and relations as a graph. Checking what a representation preserves remains a useful habit.
