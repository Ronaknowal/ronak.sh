## 10. Practise and connect the next question

Try each prompt before opening its hint or solution. The tasks ask for operations and changed cases, not only remembered definitions. The code files remain complete and runnable; the small repair file collects reusable exercise functions.

### 1. Weight the contexts

Repair a helper that takes the uniform mean of row entropies. Use joint rows (.675,.075),(.125,.125), then change only context masses to (.5,.5) and finally(1,0), preserving the two conditional rows. Explain why the original practice table cannot expose the bug.

A joint table has rows (.45,.15) and (.10,.30). Compute both marginals, I(X;Y) and H(Y|X). Identify one negative pointwise information value.

<details>
<summary>Hint</summary>

Normalize each positive row, but weight its entropy by the original row mass.



Use the new row totals (.6,.4) and column totals (.55,.45). Weight log ratios by joint probabilities.



</details>

<details>
<summary>Explained solution</summary>

The original rows normalize to(.75,.25) and(.25,.75), so both have entropy .811278124; uniform averaging accidentally agrees. The new rows normalize to(.9,.1) and(.5,.5), with entropies .468995594 and1. Their true weights(.75,.25) give .601746695, while a uniform mean gives .734497797. Equal context masses produce joint(.45,.05;.25,.25) and the latter value correctly. A zero second context produces(.9,.1;0,0), so the conditional total is .468995594 and the empty conditional is skipped. `checked_information` below returns the weighted total as its second result.

H(Y)=h₂(.45)≈.992774 bits. Each row, after normalization, has probabilities (.75,.25) or (.25,.75), so H(Y|X)=h₂(.25)≈.811278. MI≈.181496 bits. For cell (0,1), log₂(.15/(.6·.45))=log₂(5/9)≈−.847997 bits; its weighted contribution is about −.127200. Negative local contributions do not make the total negative.

</details>

### 2. Separate average information from a decision

For independent fair U,V and Y=U OR V, identify which U observation increases uncertainty, compute the weighted average, and design the correct decoder when a fair observed bit always disagrees with its label.

<details>
<summary>Hint</summary>

List the four equally likely pairs first; keep the observation-specific and average entropies separate.

</details>

<details>
<summary>Explained solution</summary>

Y has entropy h₂(.75)=.811278124. U=0 leaves a fair label and entropy1, while U=1 fixes the label and entropy0. The average is .5, so MI is .311278124 bits. An always-wrong feature should be inverted: it has one bit of information even when the copying decoder has zero accuracy. The two crossed paths, not the accuracy of that mistaken rule, determine the information.

</details>

### 3. Repair a finite-law implementation

Write a validated rectangular-joint helper. Diagnose `p*log2(p/(px*py))` on [[1-2e-200,1e-200],[1e-200,1e-200],[0,0]], and diagnose a uniform row-entropy mean. Reject negative, nonfinite and nonnormalized inputs. Check transposition, relabelling and splitting one row into two proportional subrows.

<details>
<summary>Hint</summary>

Skip zero cells and zero rows before logarithms. Use a difference of logs to avoid an underflowed product. A proportional row split adds an independent refinement inside that row.

</details>

<details>
<summary>Explained solution</summary>

The tiny positive bottom-right occupied cell can have a positive joint mass while its product marginal underflows. Log differences stay finite. The displayed `1-2e-200` rounds to1 in ordinary float64; this fixture specifically tests arithmetic representation and the helper accepts the normalized total within its declared tolerance. It does not pretend to retain a decimal subtraction smaller than machine precision. Transposition and relabelling preserve MI. Splitting a row into proportional copies preserves its conditional law and leaves MI unchanged. The complete repair file below supplies the validated calculation and the later small exercise helpers; it defines functions without running a demonstration.

```python
"""Small independent repair solutions; definitions only, no main campaign."""
import math


def entropy(values):
    return -math.fsum(p*math.log2(p) for p in values if p > 0)


def checked_information(joint):
    if not joint or not joint[0]:
        raise ValueError('nonempty joint required')
    width = len(joint[0])
    if any(len(row) != width for row in joint):
        raise ValueError('rectangular joint required')
    if any(not math.isfinite(p) or p < 0 for row in joint for p in row):
        raise ValueError('finite nonnegative masses required')
    total = math.fsum(p for row in joint for p in row)
    if not math.isclose(total,1.,abs_tol=1e-12,rel_tol=0):
        raise ValueError('probability joint must sum to one')
    px = [math.fsum(row) for row in joint]
    py = [math.fsum(row[j] for row in joint) for j in range(width)]
    terms = [p*(math.log2(p)-math.log2(px[i])-math.log2(py[j]))
             for i,row in enumerate(joint) for j,p in enumerate(row) if p > 0]
    conditional = math.fsum(mass*entropy([p/mass for p in row])
                            for mass,row in zip(px,joint) if mass > 0)
    return math.fsum(terms), conditional, px, py


def conditional_information(context_layers):
    # Layers are unnormalized joint masses p(context, X, Y), not p(X,Y|context).
    if not context_layers:
        raise ValueError('at least one context required')
    if any(not math.isfinite(p) or p < 0 for layer in context_layers for row in layer for p in row):
        raise ValueError('finite nonnegative masses required')
    total = math.fsum(p for layer in context_layers for row in layer for p in row)
    if not math.isclose(total,1,abs_tol=1e-12,rel_tol=0):
        raise ValueError('all joint layers together must sum to one')
    result = 0.
    for layer in context_layers:
        mass = math.fsum(p for row in layer for p in row)
        if mass == 0:
            continue
        conditional = [[p/mass for p in row] for row in layer]
        result += mass*checked_information(conditional)[0]
    return result


def gibbs_row(reference, distortion, beta, offset=0.):
    if len(reference) != len(distortion) or not reference:
        raise ValueError('matching nonempty vectors required')
    if beta < 0 or not math.isfinite(beta):
        raise ValueError('finite nonnegative beta required')
    if any(not math.isfinite(r) or r <= 0 for r in reference):
        raise ValueError('this helper requires positive reference support')
    if not math.isclose(math.fsum(reference),1,rel_tol=0,abs_tol=1e-12):
        raise ValueError('normalized reference required')
    if any(not math.isfinite(d) or d < 0 for d in distortion):
        raise ValueError('finite nonnegative distortions required')
    logits = [math.log(r)-beta*d+offset for r,d in zip(reference,distortion)]
    largest = max(logits)
    weights = [math.exp(v-largest) for v in logits]
    total = math.fsum(weights)
    return [w/total for w in weights]


def bayes_error(joint):
    checked_information(joint)
    selected = [max(range(len(row)),key=lambda y:row[y]) if sum(row)>0 else None
                for row in joint]
    wrong = [[p if y!=selected[z] else 0. for y,p in enumerate(row)]
             for z,row in enumerate(joint)]
    return selected, wrong, math.fsum(p for row in wrong for p in row)


def paired_counts(rows, x_values, y_values):
    xi, yi = {v:i for i,v in enumerate(x_values)}, {v:j for j,v in enumerate(y_values)}
    counts = [[0]*len(y_values) for _ in x_values]
    for x,y in rows:
        counts[xi[x]][yi[y]] += 1
    return counts
```

</details>

### 4. Build the preimage groups

For the same three-point X law, draw every source-to-group edge for |X| and 1[X>0]. Compute the label mix inside each group rather than only citing the data-processing inequality.

In the three-valued sensor example, compare Z₁=|X| and Z₂=1[X>0]. Which is sufficient for Y=X², and what conditional information is lost by Z₂?

<details>
<summary>Hint</summary>

Write the source members beside each output label.



For Z₂=0, the two equally likely possibilities are X=−1 and X=0. For Z₂=1, Y is fixed.



</details>

<details>
<summary>Explained solution</summary>

The magnitude groups are{−1,1} and{0}; both are label-pure. The threshold groups are{−1,0} and{1}; the first has mass2/3 and conditional entropy1. Thus the lost conditional information is2/3 bit. Equal positive and negative covariance contributions cancel, whereas the grouping still exposes exact dependence.

Z₁ determines Y, so I(Y;Z₁)=H(Y)≈.918296. For Z₂, H(Y|Z₂)=(2/3)·1+(1/3)·0=2/3 bit. Hence I(Y;Z₂)≈.251629 and I(Y;X|Z₂)=2/3. Z₁ is sufficient for this label; Z₂ loses magnitude information that still remains in X.

</details>

### 5. Compute conditional information

Implement conditional MI from joint context layers. Use context0 table(.375,0;0,.375), context1 table(.0625,.0625;.0625,.0625), and an optional all-zero layer. Compare the correct value with an unweighted mean of the two active conditional MIs; then contrast the copied common-bit example.

Let A be fair and B independent with P(B=1)=.1. For Y=A XOR B, find I(A;Y), I(B;Y), I((A,B);Y) and I(A;Y|B). Would adding the first two numbers recover the pair’s information?

<details>
<summary>Hint</summary>

Each layer contains joint mass. Normalize within the layer, calculate its MI, then multiply by its original mass.



Y is fair because A is fair. Given A, the only remaining uncertainty is B; given B, A still determines Y.



</details>

<details>
<summary>Explained solution</summary>

The context masses are .75 and .25; their normalized laws have MI1 and0, so the answer is .75 bit. A uniform mean incorrectly gives .5. A zero layer contributes nothing. `conditional_information` in the repair file implements these operations. For X=Y=C, unconditional MI is1 but each C slice contains constants and conditional MI is0. Chain-rule calculations must use the same declared triple law.

The answers are 1−h₂(.1)≈.531004, zero, one and one bit. Adding individual MI gives only .531004. The correct chain decomposition is I(B;Y)+I(A;Y|B)=0+1. The extra value of A after B is known differs from its value alone.

</details>

### 6. Audit a processing claim

Compose the label-error .1 and encoder-error .2 channels from their conditional factors. Compute the remaining information and the exact loss, then explain what changes if the encoder is allowed to append the true label.

<details>
<summary>Hint</summary>

Disagreement requires exactly one flip. The proof uses the same triple law in two chain-rule orders.

</details>

<details>
<summary>Explained solution</summary>

The effective disagreement is .1×.8+.9×.2=.26. Original MI is .531004406, remaining MI .173253628, and loss .357750778 bits, equal to I(Y;X|Z). Appending Y violates the assumed factorization p(x,y)q(z|x). The apparent contradiction concerns a changed premise, not an invalid inequality. A fitted encoder must be evaluated on fresh observations with its fitting randomness handled explicitly.

</details>

### 7. Implement the error partition

For Z rows(.30,.10,.10),(.05,.25,.20), implement a Bayes decoder with lowest-index ties and construct the wrong-label mass table. Compute Pe,H(Y|Z), and the Fano upper bound. Replace the second row by(.05,.20,.25) and state what changes.

<details>
<summary>Hint</summary>

The two rows have equal mass .5. Exclude the guessed label when counting the remaining error alternatives.

</details>

<details>
<summary>Explained solution</summary>

`bayes_error` returns decisions[0,1], wrong-mass rows(0,.10,.10),(.05,0,.20), and Pe=.45. H(Y|Z)=1.365957321 and the bound h₂(.45)+.45log₂2=1.442774454 bits. Replacing the second row swaps its final two label identities: the decision becomes2, but its maximum, entropy, total error and bound are unchanged. Using log₂3 would give a weaker expression, not the stated Fano term. For a binary Bayes decoder Pe≤.5, which matters before inverting binary entropy on its increasing branch.

</details>

### 8. Change the task before choosing the encoder

Write encoder rows for a signal corrupted by an independent fair coin. Does its one-bit output entropy imply one bit of input information? Compare with preserving N after changing the noiseless target to N.

For the signal/nuisance example, compare constant, signal and both at β=.5 and β=4. Then change the target to the noiseless label Y=N. What representation should be preferred at β=4?

<details>
<summary>Hint</summary>

Rate subtracts encoder randomness; relevance is recomputed under the new target law.



Use (rate,relevance)=(0,0),(1,.531004),(2,.531004). Recompute relevance after changing the label.



</details>

<details>
<summary>Explained solution</summary>

Each corrupted-signal row is(.5,.5), so H(Z)=H(Z|X)=1 and rate is0; relevance is also0. For noiseless target N, retaining N has(R,T)=(1,1), giving J=−3 at beta4. Keeping both has(2,1), giving−2. Earlier task-relative names cannot substitute for recomputing the joint law.

At β=.5 the three objectives are 0,.734498,1.734498. At β=4 they are 0,−1.124018,−.124018. The signal beats those two alternatives at β=4, without proving it is best among all stochastic encoders. With Y=N, storing N has objective 1−4=−3, storing S has 1, and storing both has 2−4=−2. A variable’s nuisance status belongs to the task, not to its name.

</details>

### 9. Repair an update

Implement the two-codeword Gibbs update using natural-log distortions. Compare a common offset0 with−1000 added to every log weight, and explain why zero reference support needs a policy rather than an arbitrary epsilon.

A two-codeword update has r=(.25,.75), β=2 and predictive distortions (0,ln 2) nats for one input. Calculate the new encoder row. Why would using the displayed bit value 1 inside exp give a different answer?

<details>
<summary>Hint</summary>

Subtract the row maximum before exponentiating; the normalized ratios are invariant to a common additive offset.



Form unnormalized weights r(z)exp(−βd) before normalizing.



</details>

<details>
<summary>Explained solution</summary>

`gibbs_row([.25,.75],[0,log(2)],2)` gives(4/7,3/7); offset−1000 gives the same row within roundoff. Unshifted exponentials can both underflow, producing0/0. A zero reference probability excludes a codeword from this positive-support formula. The helper explicitly rejects it; silently adding epsilon changes the optimization problem and is not an exact support policy.

The weights are (.25,.75/4)=(.25,.1875); normalization gives (4/7,3/7). Using exp(−2·1) incorrectly treats one bit as one nat. The equivalent bit calculation is .75·2⁻². Units inside an exponent affect the actual encoder, not merely its displayed number.

</details>

### 10. Diagnose an optimization result

For a fixed nonuniform source and encoder, explain how you would verify the free-energy identity with a mismatched r and w. Identify which update minimizes which block and why a constant encoder can remain unchanged despite a better feasible candidate.

Build a complete changed-task experiment from the finite bottleneck program. Keep X=(S,N) fair and independent, but increase the label flip probability to .2 and use β=4. Compare constant, signal and both; run 40 updates from informative and symmetric starts. State what the resulting evidence establishes.

<details>
<summary>Hint</summary>

Compute all terms from the same joint law and one log base. A descent argument is not joint convexity.



Change LABEL to two rows (.8,.2) followed by two rows (.2,.8), and change each optimization call’s beta to 4. Validate row sums, recompute the joint laws, and check objective descent. Compare candidate values before interpreting the optimizer.



</details>

<details>
<summary>Explained solution</summary>

Form p(z),p(y|z),R,T and I(X;Y) from p(x,y)q(z|x). Evaluate F directly with the selected positive r,w, then compare it with J+beta I(X;Y)+KL(pz||r)+beta Σzpz KL(py|z||w). Choosing matched r,w removes the two KL terms; fixing r,w gives the row Gibbs minimization. Identical codeword predictors can keep symmetric rows identical, while an informative initialization reaches a lower objective. The original changed-task output below remains the preserved finite40-step evidence, not a new global certificate.

The constant, signal and both objectives are 0, −.112288 and .887712. The informative start after 40 updates gives rate .698380, relevance .218212 and J=−.174466. Its first two encoder rows have P(Z=1|X)≈.053630 and the last two ≈.946370. The symmetric start remains at rate=relevance=J=0. These are independently checked results for the declared initialization and finite run; verify them to about 10⁻⁵, row sums within 10⁻¹², and no objective increase beyond roundoff. They demonstrate an improved feasible stochastic encoder and an inferior stationary initialization. They do not establish the global optimum of every encoder family or performance on a different deployment distribution.

</details>

### 11. Interpret a variational improvement

Hold the noisy encoder fixed while moving only the reference law toward its true marginal. Name every quantity that can change. Rewrite U+beta C as the prediction-plus-penalty convention and handle beta0.

Suppose true rate=.6 and relevance=.4 bits, reference mismatch=.2 bits and decoder mismatch=.1 bits. Find both variational bounds and the objective gap at β=3. Does minimizing the upper objective guarantee that actual MI decreased?

<details>
<summary>Hint</summary>

The true joint law is unchanged when only an auxiliary distribution changes.



The rate gap adds to rate; the predictive gap subtracts from relevance. Combine them with the same β as J.



</details>

<details>
<summary>Explained solution</summary>

R and T stay fixed. The rate gap and U can change; the relevance gap is unchanged if its decoder is unchanged. At beta>0, multiplying the complete objective by1/beta gives C+(1/beta)U, up to the same fixed H(Y) term. At beta0 that division is invalid and the original objective is rate-only.

The rate upper bound is .8 and relevance lower bound .3. True J=.6−3·.4=−.6; its upper bound is .8−3·.3=−.1, a gap .5=.2+3·.1. Reducing a mismatch can tighten the bound while the encoder and true MI remain fixed, so a lower bound-objective value alone does not identify which information changed.

</details>

### 12. Differentiate one VIB row

Implement the row0 contribution to the six-parameter gradient using the declared batch, then average all four rows. Diagnose using sigma where sigma² belongs in Gaussian KL, a negative KL penalty, and a sum instead of mean. Recompute row0 at lambda0 and at lambda.4; then change its signal input from0 to1 while keeping its label/noise fixed.

<details>
<summary>Hint</summary>

Use g=sigmoid(logit)−y, g_mu=u*g+lambda*mu, and the separate noise path through log_sd. Recompute mu,z,logit after changing an input.

</details>

<details>
<summary>Explained solution</summary>

The complete `hand` function in gaussian_vib_step.py is the executable solution: call it with a single-row list to obtain that row’s contribution, or with all ROWS for the mean. For row0, mu=−.4,z=−1.1,logit=−1.41 and g=sigmoid(−1.41). At lambda0 the mu derivative is1.1g; at lambda.4 it is1.1g−.16, while the log_sd KL contribution changes from0 to.4(.49−1)=−.204. Signal/nuisance gradients are zero for this original row because both inputs are0. With signal1, recompute mu=.4,z=−.3,logit=−.53, and the a derivative now equals the mu derivative. A negative penalty rewards departure from the reference; replacing variance by standard deviation is a different incorrect formula. Summing instead of averaging multiplies all row contributions by4 and changes the effective step unless other factors are adjusted. A finite objective decrease on these fixed noises is not a change in exact MI.

</details>

### 13. State the random variables and resolution

Draw the event Z in[0,1] after changing units to Zprime=10Z. Then use fair independent A,B and Z=A XOR B to compare marginal and conditional information about A.

X is standard normal. Compare observations X+.5E and 10(X+.5E), where E is independent standard normal. Then remove the noise. What happens if the noiseless observation is instead quantized to its sign?

<details>
<summary>Hint</summary>

The physical event becomes Zprime in[0,10]. In XOR, knowing B changes what Z reveals.



Separate an invertible change of units, an exact real-valued observation and a finite-valued observation.



</details>

<details>
<summary>Explained solution</summary>

Density rescales by1/10 and the event probability stays unchanged; finite differential entropies both shift by log₂10. Fresh noise and quantization are different operations. For XOR, I(Z;A)=0 but I(Z;A|B)=1. Marginal independence does not establish conditional privacy, and an estimated near-zero value is weaker than exact independence.

The noisy observations both have ½log₂5≈1.160964 bits. Exact X has infinite MI with itself. Its sign is a deterministic fair binary variable (the zero event has probability zero), giving exactly one bit. A one-dimensional output can therefore have finite or infinite information depending on noise and precision; dimension alone does not resolve the question.

</details>

### 14. Keep counting and validation distinct

Write a paired-row count helper, shuffle Y with an explicit permutation, and check the two marginals. On categorical integer features choose the estimator flag and convert units. Repeat the maintained bridge’s relabelling, duplicate-count and zero-category checks; explain the independent replacement [[2,4],[3,6]].

Run the categorical experiment with eight categories and twenty observations under independence, then increase to two thousand. What should be recorded, and what conclusion would a single positive estimate fail to justify?

Design a feature-selection check for a neural sensor model with repeated recordings from each participant. It chooses channels by estimated MI with an intended movement label. Name a plausible leakage route and a validation change that addresses it.

<details>
<summary>Hint</summary>

A permutation reuses each donor exactly once. Category meaning, rather than integer storage, determines the discrete flag.



Record the declared population, seed, empirical table, estimator and sample size. The known population reference is zero; a trajectory need not decrease at every step.





Repeated rows from one participant are not automatically independent evidence about deployment to a new participant. Feature selection itself uses labels.



</details>

<details>
<summary>Explained solution</summary>

`paired_counts` in the repair file constructs the table. Compare row sums and column sums before and after the donor permutation; they agree, but the joint and MI need not. Use discrete_features=True for these categorical inputs; divide sklearn’s nat result by ln2 for bits. Relabelling, duplicating all counts and appending an empty category preserve the empirical law up to those transformations. The replacement table factors into row and column marginals, so MI is zero up to roundoff. These checks do not fix sample bias or substitute for participant-held-out model evaluation.

Record those settings and the two empirical MI values, along with shuffled diagnostics if used. Under this independent law the true MI remains zero for both sample sizes. Sparse empirical pairings often produce positive apparent information; a particular larger sample can fluctuate either way, so no exact monotonic numerical answer is promised. A positive estimate alone is not proof of useful population dependence, a causal effect or a calibrated rejection of independence.

A channel can reveal participant or session identity correlated with training labels, and global MI selection can leak validation labels. If the intended use is new participants, split by participant first; fit preprocessing, binning and channel selection only on training participants within each fold. Evaluate the fitted pipeline on held-out participants, report task performance and uncertainty, and inspect changed acquisition conditions. A low-dimensional code or low estimated MI with an identity variable does not replace this evaluation.

</details>

### 15. Coarsen the observed table

From the offline records construct species/island counts, then merge Dream and Torgersen. Compute discarded information using the same denominator. Merge all islands next; then select2009 and explain why the comparison with all years has a different interpretation. Compute the year-weighted conditional MI.

<details>
<summary>Hint</summary>

Grouping merges table columns. Year filtering selects a different set of rows before any grouping.

</details>

<details>
<summary>Explained solution</summary>

For all344 records, full MI .750428171 becomes .616057102 after Biscoe/other grouping, losing .134371069 bits. Merging all islands yields one column and exactly zero MI up to roundoff. Selecting2009 leaves120 rows with full MI .735117842; this is another empirical law, not data processing of the all-year law. Actual year weights110/344,114/344,120/344 give conditional MI .744684498; the uniform-year average .745617934 answers a different weighted question. The complete `count_table` and `information` functions supply the implementation, with labels and provenance retained.

</details>

### 16. Audit a critic-based claim

Draw an InfoNCE candidate set with K=4. Identify the positive and three negative sampling laws. Explain what can be concluded from a population loss L4 and from one trained minibatch score. Diagnose replacing marginal negatives with deliberately easy alternatives.

<details>
<summary>Hint</summary>

The inequality concerns an expectation under one specified candidate-generation experiment.

</details>

<details>
<summary>Explained solution</summary>

The positive is conditional on the context; the other three are independent marginal draws. With base2 units, the population lower bound is2−L4 and cannot exceed2bits. True MI can exceed2. A minibatch score is a random estimate, and fitting a critic on those same samples introduces selection. Easy negatives change the population experiment, so the old bound interpretation does not follow automatically. Distribution-free high-confidence limitations do not prohibit exact calculations or estimation under additional assumptions.

</details>

Before moving on, explain one joint-to-conditional calculation, draw a task-preserving grouping, implement a stable finite update, and distinguish a true information value from an auxiliary bound and an empirical estimate. Then change the question from preserving a label to reconstructing the observation itself.

[[M52]]

In the squared-sensor example, inputs−1 and1 have the same label Y=X² and can be merged without losing label information. A decoder asked to reconstruct the signed input cannot recover both from that one group. The next topic, [Rate-Distortion Theory](/learn/path/full-curriculum/rate-distortion-theory), fixes a reconstruction cost d(x,xhat) and asks what rate supports an acceptable expected distortion. Here the predictive distortion emerged from conditional label distributions. The new criterion and coding assumptions make a different question; an information penalty alone is not a serialized bitstream.
