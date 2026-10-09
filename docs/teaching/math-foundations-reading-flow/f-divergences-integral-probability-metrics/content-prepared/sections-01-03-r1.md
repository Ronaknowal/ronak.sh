# f-Divergences & Integral Probability Metrics

Compare two probability laws, find a concrete witness to their difference, and decide what a finite sample can support. Start with sections 1–5, continue through the finite features and pair calculations in section 6, then the sample/test and implementation route in section 7 and applications in section 9. Revisit section 8 and the visibly marked deeper proofs on a second pass. Section 10 supplies changed calculations, implementation repairs and an observed-data exercise.

Use weighted averages, logarithms, probability masses and vector inner products. [Entropy, Cross-Entropy & KL](/learn/path/full-curriculum/entropy-cross-entropy-kl-divergence?module=math-foundations) supplies the prediction-cost interpretation; [Optimal Transport](/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations) supplies movement costs; [Hypothesis Testing](/learn/path/full-curriculum/hypothesis-testing-confidence-intervals?module=math-foundations) supplies the null-experiment idea. Required ideas are refreshed here. The later RKHS treatment is a deeper continuation, not a hidden prerequisite. This lesson uses **natural logarithms and nats**, whereas the earlier entropy examples often use bits.

## 1. Ask what difference matters

A simulator emits named events A, B, C and D. The reference law P and simulator law Q assign probabilities to the same event labels. Start by locating their disagreement.

[[D01]]

The amber circles represent P=(.7,.2,.1,0); cyan squares represent Q=(.4,.5,.1,0). A is too rare under Q and B is too common. C agrees. D is impossible under both laws and remains visible at zero so that support changes can be investigated later. Each law sums to one. The colours identify laws, while the fixed letters identify outcomes.

One way to make the discrepancy consequential is to score an observation: give A a score of one and everything else zero.

[[D02]]

The average score under P is .7×1+.2×0+.1×0+0×0=.7. Under Q it is .4. Their difference is .3. An **expectation** is this probability-weighted average; the rule g=(1,0,0,0) is an event indicator. We have found one question the simulator answers differently: “Did A occur?” We have not yet searched for the most revealing question.

If probabilities price predictions, underestimating A matters through extra log loss when A occurs. If A and B are nearby physical locations, moving probability between them may be inexpensive. If they are unrelated categories, their alphabetic order supplies no meaningful movement cost. A sensor reporting only “A or B occurred” sees probability .9 under either law and cannot see which of the two is wrong.

Two families organize these choices. An **f-divergence** applies a penalty to relative probabilities of the same outcomes. An **integral probability metric**, or IPM, searches for the largest difference in average score over a permitted class of rules. Here “integral” means expectation; for finite laws, it is just the weighted sum we computed. The representation, score class and task determine which difference matters.

## 2. Build a family from probability ratios

Write pᵢ=P(X=i) and qᵢ=Q(X=i). At A, p/q=.7/.4=1.75: A occurs 1.75 times as often under P. At B the ratio is .4, and at C it is one. A ratio needs a penalty before it becomes a comparison.

For a first example, use f(t)=t ln t−t+1. It is zero at t=1 and rises as a positive ratio moves away from one. Follow both the penalty and the probability that weights it.

[[D03]]

At A, f(1.75)≈.22932763. Multiplication by q_A=.4 gives contribution .09173105 nats. The height f(t) alone is not the row's cost: Q determines how strongly that height is weighted. The total is

$$D_f(P\Vert Q)=\sum_i q_i f(p_i/q_i).$$

The function f is a **convex generator**: its graph lies below each chord joining two of its points. Convexity controls what happens when different ratios are averaged. To see why the total cannot be negative, first use the positive A–C coordinates.

[[D04]]

The Q weights (.4,.5,.1) average ratios (1.75,.4,1) to .4×1.75+.5×.4+.1×1=1. Averaging the curve heights produces at least the height at the averaged input. This is Jensen's inequality:

$$\mathbb E_Q f(p/q)\ge f(\mathbb E_Q[p/q])=f(1)=0.$$

The diagram's curve-value point and its average-of-heights point are different operations. This is a weighted average, not the unweighted mean of the three ratios. Appropriate strict convexity at one forces all ratios to be one when equality holds, hence P=Q. Convexity by itself need not separate laws: f(t)=t−1 gives zero for every pair.

### The same total can have different row contributions

The earlier entropy lesson used signed KL terms p ln(p/q). Our centered generator adds −p+q to each row.

[[D05]]

At A the raw term is positive; at B it is negative because ln(.2/.5)<0. The corrections −p+q sum to zero over probability laws. Thus the centered terms are all nonnegative, yet their total remains KL(P∥Q)≈.208473 nats. A negative raw summand is compatible with a nonnegative total. More generally, replacing f(t) by f(t)+c(t−1) changes the sum by cΣ(p−q)=0. This affine freedom will matter again when we choose a conjugate in section 8.

### Six penalties, six conventions

The following choices answer different questions. They use the same ratio operation, but not the same scale or direction.

| Comparison | Generator f(t), for t>0 | Result and convention |
| --- | --- | --- |
| Forward KL | t ln t−t+1 | KL(P∥Q), in nats; raw t ln t has the same total. |
| Reverse KL | −ln t+t−1 | KL(Q∥P), in nats. |
| Pearson χ² | (t−1)² | Σ(p−q)²/q, directional and potentially unbounded. |
| Squared Hellinger H² | ½(√t−1)² | ½Σ(√p−√q)², between zero and one. |
| Total variation TV | ½∣t−1∣ | ½Σ∣p−q∣, between zero and one. |
| Jensen–Shannon JS | ½[t ln(2t/(1+t))+ln(2/(1+t))] | ½KL(P∥M)+½KL(Q∥M), where M=(P+Q)/2; between zero and ln 2. |

Now inspect their shapes using their own labelled vertical scales.

[[D06]]

Every generator vanishes at one. TV has a corner there; Pearson's penalty is quadratic. Reverse KL grows without bound as t approaches zero. The midpoint M in JS gives both laws a reference covering their supports. Some sources omit the half in JS or H², so a familiar name does not ensure matching numbers. Comparing the vertical heights of plots with different scales would not rank their usefulness.

### Zero probability is a boundary case

A ratio calculation must decide what a zero mass means before dividing. The four support cases make this explicit.

[[D07]]

If p=q=0, that outcome contributes zero, although p/q is undefined. If p=0<q, use q f(0), a limit from positive ratios. If q=0<p, use p f∞, where f∞=limₜ→∞f(t)/t. In symbols,

$$\ell_f(p,q)=\begin{cases}qf(p/q),&q>0,\\pf_\infty,&q=0<p,\\0,&p=q=0,\end{cases}\qquad D_f=\sum_i\ell_f(p_i,q_i).$$

For centered forward KL, p=0<q contributes q, while q=0<p contributes infinity. Raw KL assigns zero to the first case; the affine correction explains the difference. Reverse KL swaps these roles. A missing side contributes half that side's mass to H² and TV, and half its mass times ln 2 to JS. Pearson χ² gives q when p=0<q and infinity when q=0<p. Common zero stays zero for all six.

The ratio investigation now exposes these six defined choices. Edit the four weights of each law; the display shows both raw weights and their normalized probabilities. A valid law needs positive total weight. Temporarily incomplete or invalid input retains the last valid result with local feedback. Swap P/Q to compare directions, remove Q's A support, or reset the original laws. Infinity is an extended result, not a large finite bar. Equal laws give zero; removing Q support makes forward KL infinite while JS remains finite.

Two separately observed continuous samples, treated as empirical point masses, can have disjoint supports and infinite empirical KL. That compares the empirical measures; estimating KL between unknown population densities needs additional modelling. Binning or smoothing changes the object being compared.

### Deeper: one definition for discrete, continuous and singular laws

The definition need not assume an ordinary density with respect to length. Choose a common dominating measure μ, such as P+Q, and express each law relative to it.

[[D08]]

For A–C, μ has masses (1.1,.7,.2). At A the two density values are .7/1.1 and .4/1.1; their sum is one. These density values do not themselves have to sum to one across atoms. The integral weights them by μ: μ_A q_A f(p_A/q_A)=.4 f(.7/.4), recovering the original row. Rescaling the common reference changes the density values and integration weights together, leaving the divergence unchanged.

In general, write p=dP/dμ and q=dQ/dμ, integrate qf(p/q) over q>0, then add f∞P(q=0). If the singular mass is zero, that additional term is zero even when f∞ is infinite. If P is **absolutely continuous with respect to Q**, every Q-null event is also P-null, and the singular term vanishes. This is a relation between laws, not a claim that their observations are continuously valued. [Measure Theory](/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations) develops these derivatives and null sets.

### Why a shared observation can hide disagreement

Imagine a sensor merging A and B. To calculate its output ratio, first average their original ratios using the conditional Q weights within that merged group.

[[D09]]

Given the merged output under Q, the weights are .4/.9=4/9 and .5/.9=5/9. Their average ratio is (4/9)×1.75+(5/9)×.4=1. Convexity makes the penalty at that average no larger than the weighted original penalties. This is the local reason information can disappear under processing.

The same sensor must be applied to both laws.

[[D10]]

Its table K has rows (1,0),(1,0),(0,1),(0,1). Each row gives output probabilities for one input label and sums to one. Both processed laws are (.9,.1). More generally,

$$p'_z=\sum_i p_iK_{iz},\quad q'_z=\sum_iq_iK_{iz},\quad
\frac{p'_z}{q'_z}=\sum_i\frac{q_iK_{iz}}{q'_z}\frac{p_i}{q_i}.$$

For positive reference masses and q′_z>0, the last weights sum to one. Apply Jensen, multiply by q′_z and sum over outputs. Every original penalty is counted with total weight Σ_zK_iz=1. Therefore

$$D_f(PK\Vert QK)\le D_f(P\Vert Q).$$

This is the **data-processing inequality**. The extended support definition carries it to zero-mass cases; a zero-probability output contributes zero without an undefined conditional average. Different transformations of P and Q are outside this shared-channel claim.

Processing need not decrease every comparison strictly.

[[D11]]

Merging A/B erases the discrepancy. Keeping A separate while merging B/C/D retains TV=.3, although KL falls to about .183787 nats. Invertible relabelling preserves both: apply data processing in each direction to get equality. Agreement after reduction concerns the reduced observation, not all original distinctions.

### Deeper: mixing both pairs with the same weights

Another form of information loss is forgetting which experiment supplied an observation.

[[D12]]

Write δ_A for a law placing all its mass on A, and similarly for B. With probability one half choose pair 0, P₀=δ_A and Q₀=δ_B; otherwise choose pair 1, P₁=δ_B and Q₁=δ_A. Each pair has JS=ln 2. If the pair index J is retained, its two branches remain distinguishable. Forget J and both mixtures become (.5,.5), giving JS=0. The same mixing weights are used on both sides.

In the joint laws (J,X), the divergence is Σ_jα_jD_f(P_j∥Q_j), since the common α_j cancels from each ratio. Dropping J is a shared channel, so

$$D_f\!\left(\sum_j\alpha_jP_j\middle\Vert\sum_j\alpha_jQ_j\right)
\le\sum_j\alpha_jD_f(P_j\Vert Q_j).$$

This **joint convexity** is about mixing corresponding pairs, not independently choosing unrelated weights for P and Q.

## 3. Turn discrepancy into a decision

Our first score selected A. We can now determine the largest event difference by inspecting signed mass changes.

[[D13]]

The vector Δ=p−q is (.3,−.3,0,0). Positive differences sum to .3; negative differences have the same magnitude because ΣΔ=0. Include every positive difference in an event and none of the negative differences to maximize P(E)−Q(E). Thus

$$\operatorname{TV}(P,Q)=\sum_{i:p_i>q_i}(p_i-q_i)
=\tfrac12\sum_i|p_i-q_i|=\sup_E|P(E)-Q(E)|.$$

The maximizing event is A, with gap .3. Its complement has signed gap −.3; the empty and full events have gap zero. For a score ℓ in [0,1], each positive difference receives at most weight one and each negative difference at least zero, so |E_Pℓ−E_Qℓ|≤TV. Rescale a loss in [a,b] to obtain the bound (b−a)TV. The loss range is part of the application statement.

### Guess the source of one observation

A fair hidden coin chooses P or Q, then draws one event. The goal is to guess the chosen law with equal error costs.

[[D14]]

At A, choosing P contributes .7/2=.35 to correct guesses, whereas choosing Q would contribute .4/2=.2. Choose the larger contribution at each event. Ties may be resolved either way. The correct leaves sum to

$$\text{best accuracy}=\tfrac12\sum_i\max(p_i,q_i)
=\tfrac12(1+\operatorname{TV}(P,Q))=.65.$$

This is an optimum over decision rules for known laws. Unequal priors or error costs change the rule. A restricted or poorly fitted classifier can perform worse; chance-level performance of that classifier does not establish equal laws.

### Small KL bounds every event gap

Collapse each observation to “A” or “not A,” then examine how binary KL curves away from equality.

[[D15]]

For fixed b=.4, binary KL d(a∥b) is zero with zero first derivative at a=b. Its second derivative in a is 1/[a(1−a)]≥4. Integrating this curvature twice gives d(a∥b)≥2(a−b)². At a=.7, the quadratic lower value is .18 nats. Processing to the maximizing event cannot increase KL, so in general

$$\operatorname{KL}(P\Vert Q)\ge2\operatorname{TV}(P,Q)^2,
\qquad\operatorname{TV}(P,Q)\le\sqrt{\operatorname{KL}(P\Vert Q)/2}.$$

This is **Pinsker's inequality**, with natural logs. Here .18≤.208473. Boundary binary probabilities follow by limits, with the appropriate infinite KL when support is excluded. Changing the logarithm base changes the coefficient.

The complete small event programme enumerates all sixteen masks, checks the optimal classifier and calculates the two merged representations. The loops deliberately enumerate a tiny alphabet: O(2^k k) event work is not the efficient general method; selecting positive differences is O(k).

[[PROGRAMME:fdiv_events]]

The mask (1,0,0,0) selects A. The preserved output `-0.0` in a direct log sum is rounded cancellation, not negative mathematical KL. Centered row arithmetic is useful near equality.

The three-number programme can now be read with all three quantities defined. It uses only positive masses and raw KL summands; its compact form is a hand-calculation example, not a general support-aware API.

[[PROGRAMME:fdiv_original]]

The values .208, .054 and .3 belong to different comparisons and scales. Their relative size does not rank detection power.

### A metric makes an additional promise

A finite metric is nonnegative, symmetric, zero only for equal objects, and obeys d(P,R)≤d(P,Q)+d(Q,R). KL is directional. Even symmetric discrepancies can fail the triangle inequality.

[[D16]]

Use three laws: δ₀, the balanced mixture, and δ₁. Direct JS is ln 2≈.693147, while the two mixture legs sum to .431523; unrooted JS fails the triangle inequality. The square-root values obey .832555≤.929003 in this example. Similarly, direct H² is one while its two legs sum to 2(1−1/√2)<1. This single example disproves metric status for the unrooted forms; it is not itself a proof of the rooted forms' general triangle inequalities.

Hellinger's root has an exact geometric interpretation.

[[D17]]

Map a binary law to its square-root coordinates (√p₁,√p₂) on the positive unit-circle quadrant. The Euclidean chord between two such points, divided by √2, is H. For general laws use square-root densities in a common L² space. The norm's triangle inequality supplies H's triangle inequality, and

$$H^2=\tfrac12\sum_i(\sqrt{p_i}-\sqrt{q_i})^2
=1-\sum_i\sqrt{p_iq_i}.$$

TV and √JS are metrics too. Keep the root convention explicit: H versus H², JS versus √JS, and later MMD versus MMD² have different contracts.

The complete support programme implements all six comparisons with their limits, then checks the JS counterexample. It validates a common alphabet and normalized finite nonnegative masses. `kl` tests for missing Q support before taking logs; common zeros contribute nothing. Hellinger is computed from root-mass differences, avoiding a ratio altogether. Each metric calculation is O(k) time and O(k) storage here.

[[PROGRAMME:fdiv_support]]

For disjoint point masses, KL directions and χ² are infinite while the three bounded comparisons reach their stated maxima. The last two lines distinguish the divergence and its metric root using the same three laws.
