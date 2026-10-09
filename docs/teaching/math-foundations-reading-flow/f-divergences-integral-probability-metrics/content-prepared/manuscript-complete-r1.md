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

File: `fdiv_events.py`

```python
import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



from itertools import product

p, q = [0.7, 0.2, 0.1, 0], [0.4, 0.5, 0.1, 0]
events = list(product([0, 1], repeat=4))
gap = lambda mask: math.fsum((a - b) * take for a, b, take in zip(p, q, mask))
best = max(events, key=gap)
tv = comparisons(p, q)["TV"]
accuracy = 0.5 * math.fsum(a if a >= b else b for a, b in zip(p, q))
print("Best event mask:", best)
print("Event gap / TV:", round(gap(best), 6), round(tv, 6))
print("Best equal-prior accuracy:", round(accuracy, 6))
for mapping in ([0, 0, 1, 1], [0, 1, 1, 1]):
    pushed_p = [sum(p[i] for i in range(4) if mapping[i] == group) for group in [0, 1]]
    pushed_q = [sum(q[i] for i in range(4) if mapping[i] == group) for group in [0, 1]]
    values = comparisons(pushed_p, pushed_q)
    print("Map:", mapping, "KL / TV:", round(values["KL"], 6), round(values["TV"], 6))
print("Pinsker lower bound / KL:", round(2 * tv**2, 6), round(kl(p, q), 6))
```

Recorded output:

```text
Best event mask: (1, 0, 0, 0)
Event gap / TV: 0.3 0.3
Best equal-prior accuracy: 0.65
Map: [0, 0, 1, 1] KL / TV: -0.0 0.0
Map: [0, 1, 1, 1] KL / TV: 0.183787 0.3
Pinsker lower bound / KL: 0.18 0.208473
```

The mask (1,0,0,0) selects A. The preserved output `-0.0` in a direct log sum is rounded cancellation, not negative mathematical KL. Centered row arithmetic is useful near equality.

The three-number programme can now be read with all three quantities defined. It uses only positive masses and raw KL summands; its compact form is a hand-calculation example, not a general support-aware API.

File: `fdiv_original.py`

```python
import math

p = [0.7, 0.2, 0.1]
q = [0.4, 0.5, 0.1]
m = [(a + b) / 2 for a, b in zip(p, q)]

forward_kl = sum(a * math.log(a / b) for a, b in zip(p, q))
js = 0.5 * sum(a * math.log(a / b) for a, b in zip(p, m))
js += 0.5 * sum(a * math.log(a / b) for a, b in zip(q, m))
tv = 0.5 * sum(abs(a - b) for a, b in zip(p, q))

print(round(forward_kl, 3), round(js, 3), round(tv, 3))
```

Recorded output:

```text
0.208 0.054 0.3
```

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

File: `fdiv_support.py`

```python
import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



for p, q in [([0.7, 0.2, 0.1], [0.4, 0.5, 0.1]), ([1, 0], [0, 1])]:
    print("P, Q:", p, q)
    print({name: round(value, 6) for name, value in comparisons(p, q).items()})
left, middle, right = [1, 0], [0.5, 0.5], [0, 1]
direct = comparisons(left, right)["JS"]
leg = comparisons(left, middle)["JS"]
print("JS direct / two legs:", round(direct, 6), round(2 * leg, 6))
print("sqrt(JS) direct / two legs:", round(math.sqrt(direct), 6), round(2 * math.sqrt(leg), 6))
```

Recorded output:

```text
P, Q: [0.7, 0.2, 0.1] [0.4, 0.5, 0.1]
{'KL': 0.208473, 'reverse KL': 0.234299, 'JS': 0.053923, 'H squared': 0.054622, 'chi squared': 0.405, 'TV': 0.3}
P, Q: [1, 0] [0, 1]
{'KL': inf, 'reverse KL': inf, 'JS': 0.693147, 'H squared': 1.0, 'chi squared': inf, 'TV': 1.0}
JS direct / two legs: 0.693147 0.431523
sqrt(JS) direct / two legs: 0.832555 0.929003
```

For disjoint point masses, KL directions and χ² are infinite while the three bounded comparisons reach their stated maxima. The last two lines distinguish the divergence and its metric root using the same three laws.

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

File: `fdiv_observers.py`

```python
import math

positions = [-3, -1, 1, 3]
p, q = [0.4, 0.1, 0.1, 0.4], [0.1, 0.4, 0.4, 0.1]
difference = [a - b for a, b in zip(p, q)]
prefix, running = [], 0
scores = [0]
for i in range(len(positions) - 1):
    running += difference[i]
    prefix.append(running)
    sign = (running > 0) - (running < 0)
    scores.append(scores[-1] - sign * (positions[i + 1] - positions[i]))
w1 = math.fsum(abs(amount) * (positions[i + 1] - positions[i]) for i, amount in enumerate(prefix))
critic_gap = math.fsum(score * mass for score, mass in zip(scores, difference))
linear = abs(math.fsum(position * mass for position, mass in zip(positions, difference)))
tv = math.fsum(abs(mass) for mass in difference) / 2
assert math.isclose(w1, critic_gap)
assert all(abs(scores[j] - scores[i]) <= abs(positions[j] - positions[i]) + 1e-12
           for i in range(4) for j in range(4))
print("Cumulative imbalances:", [round(value, 6) for value in prefix])
print("Optimal critic scores:", scores)
print("Linear / TV / W1:", round(linear, 6), round(tv, 6), round(w1, 6))
```

Recorded output:

```text
Cumulative imbalances: [0.3, 0.0, -0.3]
Optimal critic scores: [0, -2, -2, 0]
Linear / TV / W1: 0.0 0.6 1.2
```

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

File: `kernel_means.py`

```python
"""Exact equal-weight finite laws: pair means and a witness, with no sample estimator."""
import math


def compare(x, y, sigma=1.0, query=0.0):
    if not x or not y or not math.isfinite(sigma) or sigma <= 0:
        raise ValueError("Nonempty laws and positive finite bandwidth required.")
    if any(not math.isfinite(value) for value in [*x, *y, query]):
        raise ValueError("Finite coordinates and query required.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a-b)/sigma)**2)
    def pair_mean(left, right):
        return math.fsum(kernel(a, b) for a in left for b in right)/(len(left)*len(right))
    xx, yy, xy = pair_mean(x, x), pair_mean(y, y), pair_mean(x, y)
    squared = xx+yy-2*xy
    def witness(t):
        return (math.fsum(kernel(a, t) for a in x)/len(x)
                - math.fsum(kernel(b, t) for b in y)/len(y))
    gap = math.fsum(witness(a) for a in x)/len(x)-math.fsum(witness(b) for b in y)/len(y)
    return xx, yy, xy, squared, witness(query), gap


def main():
    x, y = [-1., 1.], [0.]
    values = compare(x, y)
    assert math.isclose(values[3], values[5], abs_tol=1e-14)
    assert math.isclose(values[3], 1.5+math.exp(-2)/2-2*math.exp(-.5), abs_tol=1e-14)
    print("XX / YY / XY means", [round(v, 9) for v in values[:3]])
    print("squared norm / witness at 0 / witness gap", [round(v, 9) for v in values[3:]])
    feature_mean = lambda sample: [math.fsum(a for a in sample)/len(sample),
                                  math.fsum(a*a for a in sample)/len(sample)]
    mx, my = feature_mean(x), feature_mean(y)
    print("finite feature means", mx, my)
    print("finite feature norm", math.sqrt(math.fsum((a-b)**2 for a,b in zip(mx,my))))


if __name__ == "__main__":
    main()
```

Recorded output:

```text
XX / YY / XY means [0.567667642, 1.0, 0.60653066]
squared norm / witness at 0 / witness gap [0.354606322, -0.39346934, 0.354606322]
finite feature means [0.0, 1.0] [0.0, 0.0]
finite feature norm 1.0
```

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

File: `fdiv_kernel.py`

```python
import math


def mmd_squared(x, y, bandwidth=1):
    if min(len(x), len(y)) < 2:
        raise ValueError("Both groups need at least two observations.")
    if not math.isfinite(bandwidth) or bandwidth <= 0:
        raise ValueError("Bandwidth must be positive and finite.")
    if any(not math.isfinite(value) for value in list(x) + list(y)):
        raise ValueError("Observations must be finite.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a - b) / bandwidth) ** 2)
    xx = math.fsum(kernel(a, b) for a in x for b in x)
    yy = math.fsum(kernel(a, b) for a in y for b in y)
    xy = math.fsum(kernel(a, b) for a in x for b in y)
    n, m = len(x), len(y)
    biased = xx / n**2 + yy / m**2 - 2 * xy / (n * m)
    # Every diagonal RBF similarity is exactly one. All cross pairs stay.
    unbiased = (xx - n) / (n * (n - 1)) + (yy - m) / (m * (m - 1)) - 2 * xy / (n * m)
    return biased, unbiased



x, y = [-2, -2, 2, 2], [-1, -1, 1, 1]
print("Raw means:", sum(x) / len(x), sum(y) / len(y))
for bandwidth in [0.5, 1, 3]:
    biased, unbiased = mmd_squared(x, y, bandwidth)
    print("Bandwidth:", bandwidth, "biased / unbiased squared:", round(biased, 6), round(unbiased, 6))
def witness(t):
    return sum(math.exp(-0.5 * (a - t)**2) for a in x) / len(x) - sum(math.exp(-0.5 * (b - t)**2) for b in y) / len(y)
gap = sum(witness(t) for t in x) / len(x) - sum(witness(t) for t in y) / len(y)
print("Witness expectation gap:", round(gap, 6))
print("Identical empirical laws:", [round(v, 6) for v in mmd_squared([-1, 1], [-1, 1])])
```

Recorded output:

```text
Raw means: 0.0 0.0
Bandwidth: 0.5 biased / unbiased squared: 0.864832 0.531555
Bandwidth: 1 biased / unbiased squared: 0.450196 0.139474
Bandwidth: 3 biased / unbiased squared: 0.053435 -0.077924
Witness expectation gap: 0.450196
Identical empirical laws: [0.0, -0.864665]
```

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

File: `fdiv_permutation.py`

```python
import math


def mmd_squared(x, y, bandwidth=1):
    if min(len(x), len(y)) < 2:
        raise ValueError("Both groups need at least two observations.")
    if not math.isfinite(bandwidth) or bandwidth <= 0:
        raise ValueError("Bandwidth must be positive and finite.")
    if any(not math.isfinite(value) for value in list(x) + list(y)):
        raise ValueError("Observations must be finite.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a - b) / bandwidth) ** 2)
    xx = math.fsum(kernel(a, b) for a in x for b in x)
    yy = math.fsum(kernel(a, b) for a in y for b in y)
    xy = math.fsum(kernel(a, b) for a in x for b in y)
    n, m = len(x), len(y)
    biased = xx / n**2 + yy / m**2 - 2 * xy / (n * m)
    # Every diagonal RBF similarity is exactly one. All cross pairs stay.
    unbiased = (xx - n) / (n * (n - 1)) + (yy - m) / (m * (m - 1)) - 2 * xy / (n * m)
    return biased, unbiased



from itertools import combinations

pool = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]
allocations = list(combinations(range(8), 4))
for bandwidths in [(1,), (0.3, 1, 3)]:
    statistics = []
    for allocation in allocations:
        x = [pool[i] for i in allocation]
        y = [pool[i] for i in range(8) if i not in allocation]
        # The complete rule, including maximization, is repeated for every split.
        statistic = max(mmd_squared(x, y, bandwidth)[0] for bandwidth in bandwidths)
        statistics.append(statistic)
    observed = statistics[0]
    tail = sum(value >= observed - 1e-12 for value in statistics)
    print("Bandwidth candidates:", bandwidths)
    print("Observed statistic:", round(observed, 6))
    print("Tail / allocations:", tail, len(statistics))
    print("Exact permutation p-value:", round(tail / len(statistics), 6))
```

Recorded output:

```text
Bandwidth candidates: (1,)
Observed statistic: 1.311848
Tail / allocations: 2 70
Exact permutation p-value: 0.028571
Bandwidth candidates: (0.3, 1, 3)
Observed statistic: 1.311848
Tail / allocations: 2 70
Exact permutation p-value: 0.028571
```

The first output uses fixed σ=1. The second repeats the full three-bandwidth maximum. On this fixture, both have the same observed score and tail count; a different procedure need not produce a different p-value on every dataset. Fixing a choice using prior knowledge or separate training data is another defensible design. Reporting the smallest p-value after repeated tries while ignoring selection is not that design.

A small p-value is evidence against equality under the declared null experiment, not the probability that H₀ is true or a measure of practical harm. A large value does not establish equality or power. Report the statistic, representation, kernel, sample unit, allocation rule and a task-relevant consequence.

### Keep the statistic while changing its memory footprint

The exact pair formula remains quadratic work, but it need not occupy a full quadratic array. The following complete ordinary-tool route evaluates the same sums in blocks and compares them with full Gram arrays.

[[D43]]

For x=(0,.2,.4), y=(1.2,1.4,1.6), σ=.5, divide pair matrices into tiles with at most two rows and two columns. Visit each tile, calculate squared Euclidean distances and Gaussian similarities, and accumulate its sum. Only self-block diagonal entries are excluded for U. With a general block width b, the extra kernel arrays occupy O(b²) memory in addition to the input samples; all pairs still require O((n+m)²d) arithmetic for d features.

In the code, `cdist(..., "sqeuclidean")` computes direct squared distances. `np.exp` converts them to similarities. `math.fsum` combines positive block sums. The ordinary full-Gram check calls `rbf_kernel` with **gamma=1/(2σ²)**, here gamma=2; its default 1/d is not the chosen bandwidth convention. Arrays have shape (observations, features).

The tiny six-point exact test deliberately stores its full Gram matrix so SciPy can index each three-versus-three allocation. It requests independent permutations, an exact reference via `n_resamples=np.inf`, and the greater tail. The same declared bandwidth is used for every split.

File: `mmd-library-bridge.py`

```python
"""Blockwise RBF MMD, Gram-matrix oracle, and an exact SciPy permutation test.

Run: python mmd-library-bridge.py
Dependencies: numpy==2.3.5, scipy==1.18.1, scikit-learn==1.9.1.
The production-style sum uses O(B^2) kernel scratch memory, not an N^2 Gram
matrix; time remains quadratic in observations times feature dimension.
The tiny exact permutation example intentionally caches its six-point Gram.
"""
import math
import numpy as np
from scipy.spatial.distance import cdist, jensenshannon
from scipy.special import rel_entr
from scipy.stats import permutation_test
from sklearn.metrics.pairwise import rbf_kernel


def kernel_sum(x, y, sigma, block_size=256, exclude_diagonal=False):
    """Accumulate positive block sums; diagonal exclusion is for the same sample."""
    def blocks():
        for i in range(0, len(x), block_size):
            for j in range(0, len(y), block_size):
                # Direct differences avoid cancellation in ||x||²+||y||²-2x.y.
                kernel = np.exp(-cdist(x[i:i+block_size], y[j:j+block_size], "sqeuclidean") / (2*sigma*sigma))
                if exclude_diagonal and i == j:
                    np.fill_diagonal(kernel, 0.)
                yield float(kernel.sum())
    return math.fsum(blocks())


def mmd2(x, y, sigma=1., block_size=256, unbiased=False):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if (x.ndim != 2 or y.ndim != 2 or x.shape[1] != y.shape[1]
            or min(len(x), len(y)) < (2 if unbiased else 1)
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not np.isfinite(sigma) or sigma <= 0
            or not isinstance(block_size, int) or block_size < 1):
        raise ValueError("Finite row samples with matching features, positive bandwidth and block size required")
    n, m = len(x), len(y)
    xx = kernel_sum(x, x, sigma, block_size, unbiased)
    yy = kernel_sum(y, y, sigma, block_size, unbiased)
    xy = kernel_sum(x, y, sigma, block_size)
    return xx / (n*(n-1) if unbiased else n*n) + yy / (m*(m-1) if unbiased else m*m) - 2*xy/(n*m)


def gram_statistic(gram, left, right, unbiased=False):
    left, right = np.asarray(left, int), np.asarray(right, int)
    xx, yy = gram[np.ix_(left, left)], gram[np.ix_(right, right)]
    n, m = len(left), len(right)
    if unbiased:
        xx_sum, yy_sum = xx.sum()-np.trace(xx), yy.sum()-np.trace(yy)
    else:
        xx_sum, yy_sum = xx.sum(), yy.sum()
    return xx_sum/(n*(n-1) if unbiased else n*n) + yy_sum/(m*(m-1) if unbiased else m*m) - 2*gram[np.ix_(left, right)].mean()


def main():
    x, y = np.array([[0.], [.2], [.4]]), np.array([[1.2], [1.4], [1.6]])
    pooled = np.vstack((x, y))
    gram = rbf_kernel(pooled, gamma=1/(2*.5**2))
    left, right = np.arange(3), np.arange(3, 6)
    for unbiased in (False, True):
        value = mmd2(x, y, .5, block_size=2, unbiased=unbiased)
        oracle = gram_statistic(gram, left, right, unbiased)
        np.testing.assert_allclose(value, oracle, atol=1e-14)
        print("unbiased", unbiased, "MMD squared", round(value, 9))
    statistic = lambda a, b: gram_statistic(gram, a, b)
    test = permutation_test((left, right), statistic, permutation_type="independent",
                            vectorized=False, n_resamples=np.inf, alternative="greater")
    print("exact allocation count", len(test.null_distribution), "right-tail p", round(float(test.pvalue), 6))
    p, q = np.array([.75, .25]), np.array([.5, .5])
    midpoint = (p+q)/2
    js = (rel_entr(p, midpoint).sum() + rel_entr(q, midpoint).sum()) / 2
    np.testing.assert_allclose(jensenshannon(p, q)**2, js, atol=1e-15)
    print("JS nats / SciPy distance squared", np.round([js, jensenshannon(p, q)**2], 9).tolist())


if __name__ == "__main__":
    main()
```

Recorded output:

```text
unbiased False MMD squared 1.640442909
unbiased True MMD squared 1.545416627
exact allocation count 20 right-tail p 0.1
JS nats / SciPy distance squared [0.033822076, 0.033822076]
```

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

File: `fdiv_variational.py`

```python
import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



p, q = [0.7, 0.2, 0.1], [0.4, 0.5, 0.1]
truth = kl(p, q)
for scale, offset in [(0, 0), (1, 0), (1, 0.5), (0.5, -1)]:
    scores = [1 + scale * math.log(a / b) + offset for a, b in zip(p, q)]
    bound = math.fsum(a * t - b * math.exp(t - 1) for a, b, t in zip(p, q, scores))
    print("Scale / offset:", scale, offset, "bound / gap:", round(bound, 6), round(truth - bound, 6))
    assert bound <= truth + 1e-12
discriminator = [a / (a + b) for a, b in zip(p, q)]
objective = math.fsum(a * math.log(d) + b * math.log(1 - d) for a, b, d in zip(p, q, discriminator))
reference = -math.log(4) + 2 * comparisons(p, q)["JS"]
print("Optimal discriminator:", [round(d, 6) for d in discriminator])
print("GAN log objective / -ln4+2JS:", round(objective, 6), round(reference, 6))
assert math.isclose(objective, reference, abs_tol=1e-12)
```

Recorded output:

```text
Scale / offset: 0 0 bound / gap: -0.0 0.208473
Scale / offset: 1 0 bound / gap: 0.208473 0.0
Scale / offset: 1 0.5 bound / gap: 0.059752 0.148721
Scale / offset: 0.5 -1 bound / gap: -0.243549 0.452022
Optimal discriminator: [0.636364, 0.285714, 0.5]
GAN log objective / -ln4+2JS: -1.278448 -1.278448
```

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

File: `fdiv_weights.py`

```python
import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



p = [0.9, 0.1]
for q in ([0.9, 0.1], [0.99, 0.01], [0.999, 0.001]):
    weights = [a / b for a, b in zip(p, q)]
    mean = math.fsum(b * w for b, w in zip(q, weights))
    variance = math.fsum(b * (w - mean)**2 for b, w in zip(q, weights))
    print("Proposal:", q, "weights:", [round(w, 6) for w in weights])
    print("Mean / variance / chi-squared:", round(mean, 6), round(variance, 6), round(comparisons(p, q)["chi squared"], 6))
    assert math.isclose(variance, comparisons(p, q)["chi squared"], abs_tol=1e-12)
q = [0.5, 0.3, 0.2]
direction = [1, -1, 0]
quadratic = sum(v*v / mass for v, mass in zip(direction, q))
for epsilon in [0.02, 0.01, 0.001]:
    nearby = [mass + epsilon * v for mass, v in zip(q, direction)]
    ratio = kl(nearby, q) / (epsilon**2 * quadratic / 2)
    print("Local KL / half chi-square at epsilon:", epsilon, round(ratio, 6))
```

Recorded output:

```text
Proposal: [0.9, 0.1] weights: [1.0, 1.0]
Mean / variance / chi-squared: 1.0 0.0 0.0
Proposal: [0.99, 0.01] weights: [0.909091, 10.0]
Mean / variance / chi-squared: 1.0 0.818182 0.818182
Proposal: [0.999, 0.001] weights: [0.900901, 100.0]
Mean / variance / chi-squared: 1.0 9.810811 9.810811
Local KL / half chi-square at epsilon: 0.02 1.009469
Local KL / half chi-square at epsilon: 0.01 1.004587
Local KL / half chi-square at epsilon: 0.001 1.000446
```

The first loop verifies mean weight, variance and χ² for three proposals. The second explicitly changes ε and compares KL with its quadratic approximation. Both are O(k) weighted reductions. The output shows how a numerical identity and a limiting approximation answer different questions.

### A small bounded score can hide an expensive miss

Return to named outcomes: P assigns .01 probability to a rare failure and Q assigns zero. Attach a cost to the event before interpreting the discrepancy.

[[D51]]

TV=.01 and JS≈.003478 nats, while forward KL is infinite. A failure cost of one hundred produces risk one under P and zero under Q. The exact range-times-TV bound is 100×.01=1. An inset may magnify the small mass for inspection, but its scale must say so; cost is not encoded by secretly enlarging a probability bar.

A sample of twenty independent observations from P misses the rare event with probability .99²⁰≈.817907. A correctly implemented test still cannot reliably reveal events often absent from its data.

File: `fdiv_stress.py`

```python
import math


def validate(p, q):
    if len(p) != len(q) or not p:
        raise ValueError("Use matching nonempty alphabets.")
    for law in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in law):
            raise ValueError("Masses must be finite and nonnegative.")
        if not math.isclose(math.fsum(law), 1, abs_tol=1e-12):
            raise ValueError("Masses must sum to one.")


def kl(p, q):
    validate(p, q)
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return math.fsum(a * (math.log(a) - math.log(b)) for a, b in zip(p, q) if a)


def comparisons(p, q):
    validate(p, q)
    middle = [(a + b) / 2 for a, b in zip(p, q)]
    chi = math.inf if any(a > 0 and b == 0 for a, b in zip(p, q)) else math.fsum(
        (a - b) ** 2 / b for a, b in zip(p, q) if b
    )
    return {
        "KL": kl(p, q),
        "reverse KL": kl(q, p),
        "JS": (kl(p, middle) + kl(q, middle)) / 2,
        "H squared": math.fsum((math.sqrt(a) - math.sqrt(b)) ** 2 for a, b in zip(p, q)) / 2,
        "chi squared": chi,
        "TV": math.fsum(abs(a - b) for a, b in zip(p, q)) / 2,
    }



p, q = [0.99, 0.01], [1, 0]
values = comparisons(p, q)
print("Missing rare event:", {name: round(value, 6) for name, value in values.items()})
print("Chance 20 true-law observations contain no rare event:", round(0.99**20, 6))
loss = [0, 100]
risk_p = sum(mass * cost for mass, cost in zip(p, loss))
risk_q = sum(mass * cost for mass, cost in zip(q, loss))
print("Expected cost P / Q:", risk_p, risk_q)
print("Bound from loss range times TV:", round(100 * values["TV"], 6))
```

Recorded output:

```text
Missing rare event: {'KL': inf, 'reverse KL': 0.01005, 'JS': 0.003478, 'H squared': 0.005013, 'chi squared': inf, 'TV': 0.01}
Chance 20 true-law observations contain no rare event: 0.817907
Expected cost P / Q: 1.0 0
Bound from loss range times TV: 1.0
```

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

File: `fdiv_blockwise.py`

```python
import math

import numpy as np
from scipy.spatial.distance import cdist


def kernel_sum(x, y, sigma, block_size=256, exclude_diagonal=False):
    """Accumulate positive block sums; diagonal exclusion is for the same sample."""
    def blocks():
        for i in range(0, len(x), block_size):
            for j in range(0, len(y), block_size):
                # Direct differences avoid cancellation in ||x||²+||y||²-2x.y.
                kernel = np.exp(-cdist(x[i:i+block_size], y[j:j+block_size], "sqeuclidean") / (2*sigma*sigma))
                if exclude_diagonal and i == j:
                    np.fill_diagonal(kernel, 0.)
                yield float(kernel.sum())
    return math.fsum(blocks())


def mmd2(x, y, sigma=1., block_size=256, unbiased=False):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if (x.ndim != 2 or y.ndim != 2 or x.shape[1] != y.shape[1]
            or min(len(x), len(y)) < (2 if unbiased else 1)
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not np.isfinite(sigma) or sigma <= 0
            or not isinstance(block_size, int) or block_size < 1):
        raise ValueError("Finite row samples with matching features, positive bandwidth and block size required")
    n, m = len(x), len(y)
    xx = kernel_sum(x, x, sigma, block_size, unbiased)
    yy = kernel_sum(y, y, sigma, block_size, unbiased)
    xy = kernel_sum(x, y, sigma, block_size)
    return xx / (n*(n-1) if unbiased else n*n) + yy / (m*(m-1) if unbiased else m*m) - 2*xy/(n*m)
```

The complete application first checks the pinned CSV identity and its 150 finite four-coordinate rows. It selects row arrays of shape (50,2), keeps the original IDs, computes scalar pair sums, compares the extracted blockwise route and scikit-learn's full RBF arrays, and checks coordinated unit conversion plus the null. The scalar route supplies an independent formula, not another call to the block helper.

File: `iris_mmd.py`

```python
"""Offline descriptive comparison of the corrected UCI Iris measurements."""
import csv
import hashlib
import math
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics.pairwise import rbf_kernel

from fdiv_blockwise import mmd2

CSV_SHA256 = "5a8853b2e82f9d021e5843af7d647339e359b25e037ec6e87e23ca9e91507821"
FEATURES = ("sepal length", "sepal width", "petal length", "petal width")


def load_rows():
    path = Path(__file__).with_name("iris-corrected.csv")
    if hashlib.sha256(path.read_bytes()).hexdigest() != CSV_SHA256:
        raise ValueError("Use the supplied corrected Iris CSV.")
    with path.open(encoding="utf-8", newline="") as stream:
        records = list(csv.DictReader(stream))
    rows = [(index, record["species"], [float(record[name]) for name in FEATURES])
            for index, record in enumerate(records, start=1)]
    counts = Counter(species for _, species, _ in rows)
    if len(rows) != 150 or counts != {"Iris-setosa":50,"Iris-versicolor":50,"Iris-virginica":50}:
        raise ValueError("Expected 150 measurements, 50 from each named species.")
    if any(not math.isfinite(v) for _, _, values in rows for v in values):
        raise ValueError("All four measurements must be finite.")
    return rows


def select(rows, species, columns):
    chosen = [(row_id, [values[j] for j in columns]) for row_id, label, values in rows if label == species]
    if not chosen:
        raise ValueError("Species selection is empty.")
    return [row_id for row_id, _ in chosen], np.asarray([values for _, values in chosen], dtype=float)


def scalar_mmd2(x, y, sigma):
    # x and y are small finite row arrays with the same physical coordinate units.
    def pair(a, b):
        squared = math.fsum(((float(u)-float(v))/sigma)**2 for u,v in zip(a,b))
        return math.exp(-squared/2)
    def mean(left, right):
        return math.fsum(pair(a,b) for a in left for b in right)/(len(left)*len(right))
    return mean(x,x)+mean(y,y)-2*mean(x,y)


def ordinary_mmd2(x, y, sigma):
    gamma = 1/(2*sigma**2)
    return float(rbf_kernel(x,gamma=gamma).mean()+rbf_kernel(y,gamma=gamma).mean()
                 -2*rbf_kernel(x,y,gamma=gamma).mean())


def main():
    rows = load_rows()
    print("rows / species counts", len(rows), dict(Counter(label for _,label,_ in rows)))
    sigma_cm = 1.
    for name, columns in (("sepal",(0,1)),("petal",(2,3))):
        x_ids, x = select(rows,"Iris-setosa",columns)
        y_ids, y = select(rows,"Iris-versicolor",columns)
        scalar = scalar_mmd2(x,y,sigma_cm)
        blocked = mmd2(x,y,sigma_cm,block_size=16)
        ordinary = ordinary_mmd2(x,y,sigma_cm)
        scaled = ordinary_mmd2(10*x,10*y,10*sigma_cm)
        same = ordinary_mmd2(x,x,sigma_cm)
        assert max(abs(v-scalar) for v in (blocked,ordinary,scaled)) < 1e-12
        assert abs(same) < 1e-12
        distance = float(np.linalg.norm(x[0]-y[0]))
        similarity = math.exp(-distance**2/(2*sigma_cm**2))
        print(name,"shapes / first row IDs",x.shape,y.shape,x_ids[0],y_ids[0])
        print("scalar / blocked / ordinary / coordinated mm",[round(v,10) for v in (scalar,blocked,ordinary,scaled)])
        print("same-setosa / first-pair distance cm / similarity",[round(v,10) for v in (same,distance,similarity)])


if __name__ == "__main__":
    main()
```

Recorded output:

```text
rows / species counts 150 {'Iris-setosa': 50, 'Iris-versicolor': 50, 'Iris-virginica': 50}
sepal shapes / first row IDs (50, 2) (50, 2) 1 51
scalar / blocked / ordinary / coordinated mm [0.6622804839, 0.6622804839, 0.6622804839, 0.6622804839]
same-setosa / first-pair distance cm / similarity [0.0, 1.9235384062, 0.1572371663]
petal shapes / first row IDs (50, 2) (50, 2) 1 51
scalar / blocked / ordinary / coordinated mm [1.7166120981, 1.7166120981, 1.7166120981, 1.7166120981]
same-setosa / first-pair distance cm / similarity [0.0, 3.5114099732, 0.0021017184]
```

All three routes agree within 10⁻¹² in the recorded run. This programme fits no model and returns no p-value. Its claim is the stated comparison of the retained measurements. A population test would additionally need a defensible sampling and exchangeability design. For larger data, the blockwise route reduces temporary matrix memory; the scalar and full-Gram routes here are small-fixture checks.

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

File: `fdiv_project.py`

```python
import math


def mmd_squared(x, y, bandwidth=1):
    if min(len(x), len(y)) < 2:
        raise ValueError("Both groups need at least two observations.")
    if not math.isfinite(bandwidth) or bandwidth <= 0:
        raise ValueError("Bandwidth must be positive and finite.")
    if any(not math.isfinite(value) for value in list(x) + list(y)):
        raise ValueError("Observations must be finite.")
    def kernel(a, b):
        return math.exp(-0.5 * ((a - b) / bandwidth) ** 2)
    xx = math.fsum(kernel(a, b) for a in x for b in x)
    yy = math.fsum(kernel(a, b) for a in y for b in y)
    xy = math.fsum(kernel(a, b) for a in x for b in y)
    n, m = len(x), len(y)
    biased = xx / n**2 + yy / m**2 - 2 * xy / (n * m)
    # Every diagonal RBF similarity is exactly one. All cross pairs stay.
    unbiased = (xx - n) / (n * (n - 1)) + (yy - m) / (m * (m - 1)) - 2 * xy / (n * m)
    return biased, unbiased



from itertools import combinations


def exact_test(x, y, bandwidths=(1,)):
    if min(len(x), len(y)) < 2 or len(x) + len(y) > 10:
        raise ValueError("Use at least two per group and at most ten total for enumeration.")
    if not bandwidths:
        raise ValueError("Specify the complete bandwidth selection rule.")
    pool, n = list(x) + list(y), len(x)
    statistics = []
    for allocation in combinations(range(len(pool)), n):
        group_x = [pool[i] for i in allocation]
        group_y = [pool[i] for i in range(len(pool)) if i not in allocation]
        statistics.append(max(mmd_squared(group_x, group_y, sigma)[0] for sigma in bandwidths))
    observed = statistics[0]
    tail = sum(value >= observed - 1e-12 for value in statistics)
    return observed, tail, len(statistics), tail / len(statistics)


x, y = [-1, -0.5, 0], [0.5, 1, 1.5]
score, tail, count, p_value = exact_test(x, y, (0.75,))
print("Statistic:", round(score, 6))
print("Tail / allocations / p-value:", tail, count, round(p_value, 6))
print("Reject at level 0.05:", p_value <= 0.05)
assert count == 20 and tail == 2
assert exact_test(y, x, (0.75,))[-1] == p_value
assert exact_test(x, y, (0.75,)) == exact_test(x, y, (0.75,))
print("Swap invariance and deterministic rerun: passed")
```

Recorded output:

```text
Statistic: 1.096713
Tail / allocations / p-value: 2 20 0.1
Reject at level 0.05: False
Swap invariance and deterministic rerun: passed
```

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

File: `fdiv_practice.py`

```python
"""Changed implementations and fixtures for the four transfer tasks; no old main runs."""
import math

import numpy as np
from sklearn.metrics.pairwise import rbf_kernel

from fdiv_blockwise import mmd2
from iris_mmd import load_rows, select, scalar_mmd2, ordinary_mmd2


def kl_contribution(p, q, centered=False):
    if any(not math.isfinite(v) or not 0 <= v <= 1 for v in (p,q)):
        raise ValueError("Two finite probabilities in [0,1] required.")
    if p == 0:
        return q if centered else 0.
    if q == 0:
        return math.inf
    delta = (p-q)/q
    if centered and abs(delta) < .01:
        # (1+d)log(1+d)-d = d^2/2-d^3/6+d^4/12-...
        return q*math.fsum((-1)**order*delta**order/(order*(order-1))
                           for order in range(2,15))
    raw = p*(math.log1p(delta) if abs(delta) < .01 else math.log(p)-math.log(q))
    return raw-p+q if centered else raw


def corrected_pair_estimators(x, y, sigma):
    if min(len(x),len(y)) < 2 or not math.isfinite(sigma) or sigma <= 0:
        raise ValueError("Two or more observations per group and positive finite sigma required.")
    if any(not math.isfinite(v) for v in [*x,*y]):
        raise ValueError("Finite coordinates required.")
    kernel = lambda a,b:math.exp(-.5*((a-b)/sigma)**2)
    n,m=len(x),len(y)
    xx=math.fsum(kernel(a,b) for a in x for b in x)
    yy=math.fsum(kernel(a,b) for a in y for b in y)
    xy=math.fsum(kernel(a,b) for a in x for b in y)
    off_x=math.fsum(kernel(a,b) for i,a in enumerate(x) for j,b in enumerate(x) if i!=j)
    off_y=math.fsum(kernel(a,b) for i,a in enumerate(y) for j,b in enumerate(y) if i!=j)
    biased=xx/n**2+yy/m**2-2*xy/(n*m)
    unbiased=off_x/(n*(n-1))+off_y/(m*(m-1))-2*xy/(n*m)
    return biased,unbiased


def mmd_in_cm(x, y, sigma_cm, coordinate_unit="cm"):
    if coordinate_unit not in ("cm","mm"):
        raise ValueError("Declare cm or mm coordinates.")
    x,y=np.asarray(x,float),np.asarray(y,float)
    if (x.ndim!=2 or y.ndim!=2 or x.shape[1]!=y.shape[1] or min(len(x),len(y))<1
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not math.isfinite(sigma_cm) or sigma_cm<=0):
        raise ValueError("Finite matching row arrays and positive physical bandwidth required.")
    divisor=10 if coordinate_unit=="mm" else 1
    x,y=x/divisor,y/divisor
    gamma=1/(2*sigma_cm**2)
    return float(rbf_kernel(x,gamma=gamma).mean()+rbf_kernel(y,gamma=gamma).mean()
                 -2*rbf_kernel(x,y,gamma=gamma).mean())


def main():
    p,q=[.6,.4,0],[.3,.5,.2]
    raw=[kl_contribution(a,b) for a,b in zip(p,q)]
    centered=[kl_contribution(a,b,True) for a,b in zip(p,q)]
    assert math.isclose(math.fsum(raw),math.fsum(centered),abs_tol=1e-14)
    assert kl_contribution(0,0,True)==0 and kl_contribution(.2,0)==math.inf
    assert kl_contribution(.3,.3,True)==0
    near=kl_contribution(.5+1e-10,.5,True)
    assert 0 < near < 2e-20
    print("T11 raw / centered rows",[round(v,9) for v in raw],[round(v,9) for v in centered])
    print("T11 totals / near-equality centered",round(math.fsum(raw),9),format(near,".9g"))
    for x,y in (([-1.,1.],[-1.,1.]),([-1.,1.],[-1.,0.,1.])):
        values=corrected_pair_estimators(x,y,1.)
        oracle=[mmd2(np.array(x)[:,None],np.array(y)[:,None],1.,block_size=2,unbiased=u)
                for u in (False,True)]
        assert all(abs(a-b)<1e-14 for a,b in zip(values,oracle))
        print("T12 sizes / B / U",len(x),len(y),[round(v,9) for v in values])
    x,y=np.array([[0.,0.],[1.,0.]]),np.array([[0.,2.],[1.,2.]])
    value=mmd_in_cm(x,y,2.,"cm")
    converted=mmd_in_cm(10*x,10*y,2.,"mm")
    assert abs(value-converted)<1e-14
    wrong_unit=ordinary_mmd2(10*x,10*y,2.)
    wrong_gamma=float(rbf_kernel(x,gamma=2.).mean()+rbf_kernel(y,gamma=2.).mean()
                      -2*rbf_kernel(x,y,gamma=2.).mean())
    print("T13 correct cm / declared mm / wrong unit / gamma=sigma",[round(v,9) for v in (value,converted,wrong_unit,wrong_gamma)])
    rows=load_rows()
    x_ids,x=select(rows,"Iris-versicolor",(2,3))
    y_ids,y=select(rows,"Iris-virginica",(2,3))
    sigma=.75
    values=[scalar_mmd2(x,y,sigma),mmd2(x,y,sigma,block_size=17),ordinary_mmd2(x,y,sigma)]
    assert max(values)-min(values)<1e-12
    print("T14 petal / sigma cm / row spans",sigma,[x_ids[0],x_ids[-1]],[y_ids[0],y_ids[-1]])
    print("T14 scalar / blocked / ordinary",[round(v,10) for v in values])


if __name__ == "__main__":
    main()
```

Recorded output:

```text
T11 raw / centered rows [0.415888308, -0.089257421, 0.0] [0.115888308, 0.010742579, 0.2]
T11 totals / near-equality centered 0.326630888 1.00000017e-20
T12 sizes / B / U 2 2 [0.0, -0.864664717]
T12 sizes / B / U 2 3 [0.039400702, -0.576443145]
T13 correct cm / declared mm / wrong unit / gamma=sigma [0.740704814, 0.740704814, 1.000003727, 1.134954421]
T14 petal / sigma cm / row spans 0.75 [51, 100] [101, 150]
T14 scalar / blocked / ordinary [0.82208552, 0.82208552, 0.82208552]
```

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
