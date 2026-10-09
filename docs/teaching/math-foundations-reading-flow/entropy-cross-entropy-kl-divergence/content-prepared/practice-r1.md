

## 10. Practise with new distributions and decisions

Try the prompts before opening a hint or solution. Name the alphabet, weighting distribution, units and required support or sampling assumptions. For implementation repairs, first write a small function and a changed input that would expose the wrong operation.

### 1. Information and code length are different quantities

A source has five labels with probabilities (1/2,1/8,1/8,1/8,1/8). Calculate its entropy and construct a prefix code attaining it. Compare fixed-width coding and the actual message AEEE. Explain why a 2.5-bit message average would not contradict the 2-bit source entropy.

Also express the source entropy in nats and compare the surprise of E with its contribution to entropy.

<details><summary>Optional hint</summary>

Use the five masses 1/2,1/8,1/8,1/8,1/8. A code may finish at one leaf while the other branch contains a complete two-level subtree.

</details>

<details><summary>Worked solution and reasoning</summary>

The entropy is (1/2)×1+4×(1/8)×3=2 bits per symbol. One optimal prefix code is A=0, B=100, C=101, D=110, E=111, with average 2. Fixed-width coding needs three bits for five labels. Message AEEE uses 1+3+3+3=10 bits, or 2.5 per symbol, exceeding the source entropy on that message. Entropy predicts a source-weighted average, not a per-message guarantee.

Two bits equal2 ln2 nats. E has3bits of surprise but contributes only(1/8)×3=3/8bit to the source average. A category's price and the weighted contribution are different.

</details>

### 2. Compute a changed mismatch and diagnose the signed terms

For P=(3/4,1/4) and Q=(1/2,1/2), compute entropy, cross-entropy, both signed KL contributions and the reverse KL. Explain why taking the absolute value of each contribution would define a different quantity.



<details><summary>Optional hint</summary>

The uniform model charges one bit per outcome. Keep P=(3/4,1/4) as the weighting distribution.

</details>

<details><summary>Worked solution and reasoning</summary>

Compute H₂(P) as −(3/4)log₂(3/4) − (1/4)log₂(1/4), obtaining about 0.811278 bits. H₂(P,Q)=1, so KL≈0.188722 bits. The terms are (3/4)log₂(3/2)≈0.438722 and (1/4)log₂(1/2)=−0.25. The negative term says the rarer outcome is priced more cheaply by Q; it is not a negative divergence on its own. Reversing gives about 0.207519 bits, so the direction matters.



</details>

### 3. Decode a changed stream and reject an ambiguous code

Decode 110010111 using the lesson's matched code. Then inspect A=0, B=00, C=1. Give a concrete ambiguous bitstream and explain why “always choose the shortest matching word” is not a repair.

Independently implement a prefix-tree decoder. It must reject a word that prefixes another in either insertion order, reject an unfinished stream, and decode101100. Use a tree so each received bit is visited once.

<details><summary>Optional hint</summary>

Start again at the root each time 0,10,110 or 111 is complete. For the proposed code, ask whether 00 could mean more than one message.

</details>

<details><summary>Worked solution and reasoning</summary>

Using A=0, B=10, C=110, D=111, the stream 110010111 decodes C A B D: 110|0|10|111. The alternative A=0, B=00, C=1 is not prefix-free and is not uniquely decodable: 00 could mean B or AA. A decoder that simply chooses the shortest match loses B. A correct changed implementation must reject that code and also reject a final unfinished 11 under the original code.

One valid solution keeps symbol leaves distinct from internal nodes. Codebook validation is performed once; the bit loop then traverses existing edges.

```python
def make_tree(code):
    root = {}
    for symbol, word in code.items():
        if not word or set(word) - {"0", "1"}:
            raise ValueError("Expected a nonempty binary word.")
        node = root
        for bit in word:
            if "symbol" in node:
                raise ValueError("An earlier word prefixes this word.")
            node = node.setdefault(bit, {})
        if node:
            raise ValueError("Duplicate word or prefix collision.")
        node["symbol"] = symbol
    return root


def decode_tree(bits, root):
    node, output = root, []
    for bit in bits:
        if bit not in {"0", "1"} or bit not in node:
            raise ValueError("Invalid bit or impossible continuation.")
        node = node[bit]
        if "symbol" in node:
            output.append(node["symbol"])
            node = root
    if node is not root:
        raise ValueError("Unfinished codeword.")
    return "".join(output)
```

For A=0,B=10,C=110,D=111,101100 becomes BCA. An empty stream becomes empty text;11 is unfinished. Both insertion orders of A=0,B=01 must fail. The changed message DAB encodes111010 and decodes back. Construction uses one visit per codebook bit; decoding is O(B) for B stream bits, plus the emitted output. The early codebook check and end-of-stream check solve different failures.

</details>

### 4. Repair a support and clipping claim

For P=(0.8,0.2,0) and Q=(1,0,0), classify both KL directions. A colleague replaces log 0 with log 10⁻⁶ and reports “the exact original KL.” Explain the error and give one valid explicitly smoothed model.

Write a finite H/CE/KL helper for already normalized vectors. Repair code that takes every log before checking P=0. Check P=(.5,.5,0),Q=(.25,.75,0), then Q=(1,0,0); reject P=(.5,.5,.1).

<details><summary>Optional hint</summary>

Check the support inclusion separately in each direction. A probability floor must come with a defined normalized model.

</details>

<details><summary>Worked solution and reasoning</summary>

For P=(0.8,0.2,0) and Q=(1,0,0), KL(P∥Q)=∞ because the second outcome occurs under P but is excluded by Q. KL(Q∥P)=−log₂0.8≈0.321928 bits. Reporting a finite clipped loss does not establish finite KL for the original Q. One explicit replacement is Q_ε=(1−2ε,ε,ε), 0<ε<1/2; it is a new normalized distribution, and its score should be identified as such. No contribution is charged for P's zero third coordinate.

Here normalization is a requirement, not a request to rescale input.

```python
import math


def probability_vector(values):
    values = tuple(values)
    if (not values or any(not math.isfinite(x) or x < 0 for x in values)
            or not math.isclose(math.fsum(values), 1, rel_tol=0, abs_tol=1e-12)):
        raise ValueError("Expected normalized finite probabilities.")
    return values


def information_costs(p, q):
    p, q = probability_vector(p), probability_vector(q)
    if len(p) != len(q):
        raise ValueError("Outcome alphabets must agree.")
    active = [(a, b) for a, b in zip(p, q) if a > 0]
    h = -math.fsum(a * math.log2(a) for a, _ in active)
    if any(b == 0 for _, b in active):
        return h, math.inf, math.inf
    ce = -math.fsum(a * math.log2(b) for a, b in active)
    kl = math.fsum(a * (math.log2(a) - math.log2(b)) for a, b in active)
    return h, ce, kl
```

The first pair gives(1,1.207518749639422,.207518749639422)bits. The zero-zero third row never reaches a logarithm. The missing-support pair returns(1,infinity,infinity). The malformed P sums to1.1 and is rejected. Matching certain laws(1,0,0) give all zeros, not NaN. Separate logarithms avoid overflow/underflow in a direct P/Q ratio. Adding epsilon would change Q and needs a separately named, normalized model.

</details>

### 5. Use unequal context frequencies

P(X=0)=0.75, P(Y=1|X=0)=0.2 and P(Y=1|X=1)=0.8. Calculate H(Y), H(Y|X), and the ideal expected losses with and without X. Explain which probabilities would need changing if the context frequencies shifted.

Now use joint rows(.675,.075),(.125,.125). Implement conditional entropy from the joint table, and repair an equal-row-average bug. Repeat after changing only context masses to(.5,.5) and(1,0), preserving conditional Y1 probabilities(.1,.5).

<details><summary>Optional hint</summary>

Average the two conditional entropies with 0.75 and 0.25. First calculate the marginal probability of Y=1.

</details>

<details><summary>Worked solution and reasoning</summary>

P(Y=1)=0.75×0.2+0.25×0.8=0.35, so H(Y)=h₂(0.35)≈0.934068 bits. Both contexts have entropy h₂(0.2)=h₂(0.8)≈0.721928, hence H(Y|X)=0.721928. A model that uses the true conditional achieves that expected loss. A model using the true marginal in both contexts has expected loss 0.934068. The context's average reduction is about 0.212140 bits. Weighting the contexts equally would generally be wrong, even though this symmetric pair happens to have equal conditional entropies.

The old .2/.8 row pair has identical entropies, so its equal average accidentally agrees. The new rows have costs .4689955935892812 and1.

```python
import math


def conditional_entropy(joint):
    if not joint or not joint[0] or any(len(row) != len(joint[0]) for row in joint):
        raise ValueError("Expected a nonempty rectangular table.")
    cells = [x for row in joint for x in row]
    if (any(not math.isfinite(x) or x < 0 for x in cells)
            or not math.isclose(math.fsum(cells), 1, rel_tol=0, abs_tol=1e-12)):
        raise ValueError("Expected a normalized joint law.")
    result = 0.0
    for row in joint:
        mass = math.fsum(row)
        if mass == 0:
            continue
        row_entropy = -math.fsum((x / mass) * math.log2(x / mass)
                                 for x in row if x > 0)
        result += mass * row_entropy
    return result
```

The correct result is .75×.4689955935892812+.25×1=.6017466951919609bits. Uniform averaging incorrectly gives .7344977967946407. At context masses(.5,.5), the joint becomes(.45,.05),(.25,.25), so the correct answer really is .7344977967946407. At(1,0), use(.9,.1),(0,0), giving .4689955935892812. A zero row has no conditional distribution; skipping its zero contribution avoids dividing by zero. Reconstructing each original cell as context mass times its conditional value checks the normalization step.

</details>

### 6. Evaluate confidence with a consistent denominator

On six shared binary test cases, C's correct-label probabilities are (0.9,0.9,0.9,0.9,0.4,0.4). D's are (0.6,0.6,0.6,0.6,0.6,0.01). Calculate accuracy and mean log loss. Which wins each measure, and what additional claim would this small test not justify?

A separate language example has one scored token with total loss0nats and nine scored tokens with total loss9nats. Find the token-weighted mean and perplexity; explain why averaging the two sentence perplexities differs.

<details><summary>Optional hint</summary>

Use all six correct-label probabilities. Model C has four probabilities above 0.5, while D has five.

</details>

<details><summary>Worked solution and reasoning</summary>

C has accuracy 4/6 and mean loss −[4ln0.9+2ln0.4]/6≈0.375671 nats. D has accuracy 5/6 and mean loss −[5ln0.6+ln0.01]/6≈1.193216 nats. D wins accuracy but loses log loss because its lone error is extremely confident. The difference does not certify fairness, calibration or performance after distribution shift. A defensible comparison states the same six cases, binary threshold/no ties, arithmetic mean over cases and the decision objective.

The total loss is9 over10 tokens, so the mean is.9nats and perplexity exp(.9). Sentence perplexities are1 and e. Their mean(1+e)/2 weights sentences equally and applies a nonlinear transformation before aggregation. The intended token-weighted score must pool total loss and count first. Different tokenization would change the unit and require a new comparison.

</details>

### 7. Compute an extreme but finite log loss

Scores are (800,0,−800), and the last class occurs. Calculate the stable loss and explain why adding −700 to every score changes nothing. Give both an ordinary-score acceptance case and an underflow case for an implementation test.

Write stable_loss(logits,target) without taking log of a separately computed softmax. Check(0,−1000,−2000), target2 and a common+1000 shift. Repair wrong class-axis and unnormalized-soft-target use separately.

<details><summary>Optional hint</summary>

Subtract the maximum first. The normalizer's log is approximately zero when the remaining exponentials underflow.

</details>

<details><summary>Worked solution and reasoning</summary>

For scores (800,0,−800), shifted scores are (0,−800,−1600). The observed last-class loss is 1600+ln(1+e⁻⁸⁰⁰+e⁻¹⁶⁰⁰), numerically 1600 nats in the displayed precision. Adding −700 to every score leaves it unchanged. Taking log of a separately underflowed zero probability gives ∞ and destroys a finite-logit result. At ordinary scores (1,0,−1), direct and stable calculations should agree within tolerance; that is a useful independent implementation check.

Compute the loss from shifted logits directly.

```python
import math


def stable_loss(logits, target):
    if not logits or any(not math.isfinite(x) for x in logits):
        raise ValueError("Expected finite logits.")
    if not isinstance(target, int) or not 0 <= target < len(logits):
        raise ValueError("Invalid class index.")
    maximum = max(logits)
    shifted = [x - maximum for x in logits]
    log_sum = math.log(math.fsum(math.exp(x) for x in shifted))
    return log_sum - shifted[target]
```

Both extreme cases give2000nats. The ordinary vector(1000,998,996),target2 gives4.142931628499899. The result avoids log of a rounded zero. This compact helper assumes the shifted differences are representable; arbitrary opposing floating extremes need a separately defined numerical range. For a batch(N,C), normalize across classes, not examples. A soft-target row must be finite, nonnegative and sum to one; passing(2,1,0) as though already normalized changes the score. A library that silently accepts it does not validate the intended statistical meaning.

</details>

### 8. Preserve the physical experiment when changing units

X is uniform on [0,2] metres. Express its differential entropy in metres and millimetres; quantize it into four equal bins and compare bin-label entropy. Then explain why finite negative log density on observed samples does not establish finite KL from their empirical point-mass distribution.



<details><summary>Optional hint</summary>

Uniform width w has differential entropy log₂w. An aligned bin label has entropy log₂N.

</details>

<details><summary>Worked solution and reasoning</summary>

For a uniform interval of width 2 metres, h₂=1. In millimetres the numerical width is 2000, so h₂=log₂2000≈10.965784; the change is log₂1000. Four equal bins have H=2 bits in both units. Their widths are 0.5 m and 500 mm, so h−log₂Δ=2 either way. The probability of the first physical metre is 1/2 in both coordinates. For a continuous Q, the empirical finite set remains Q-null despite positive density at observed points; empirical-to-Q measure KL is ∞, while average negative log density can be finite.



</details>

### 9. Certify a new constrained maximum

On outcomes 0,1,2, replace the required mean with 1/2. Derive the feasible slice, find the positive exponential-family candidate and prove it maximizes entropy. State what changes if the base weights become (1,2,1).

Independently implement the feasible three-count slice for a general mean. Use mean6/5 and both exact endpoints; reject t=.1 and mean2.1. Explain why normalizing an arbitrary vector is insufficient.

<details><summary>Optional hint</summary>

For mean 1/2, q=(1/2+t,1/2−2t,t), 0≤t≤1/4. Put candidate probabilities proportional to 1,r,r² and solve their mean equation.

</details>

<details><summary>Worked solution and reasoning</summary>

The equation (r+2r²)/(1+r+r²)=1/2 gives 3r²+r−1=0, with positive root r=(√13−1)/6. Normalize (1,r,r²) to get approximately (0.616204,0.267592,0.116204). Its mean is 1/2. The candidate's log probability is x ln r−ln(1+r+r²); every feasible q has the same expected log price. Thus KL(q∥p*)=H(p*)−H(q)≥0 and equality requires q=p*. Checking only the derivative or only a sampled plot would not by itself supply this global certificate. A base h=(1,2,1) would add E_q log h to the certified objective.

Solve both linear equalities before choosing t. Exact fractions make boundary checks transparent.

```python
from fractions import Fraction


def feasible_three_count(mean, t):
    mean, t = Fraction(str(mean)), Fraction(str(t))
    if not 0 <= mean <= 2:
        raise ValueError("Mean outside the count alphabet.")
    lower, upper = max(Fraction(0), mean - 1), mean / 2
    if not lower <= t <= upper:
        raise ValueError("Infeasible probability parameter.")
    return 1 - mean + t, mean - 2 * t, t
```

For mean6/5, the interval is[1/5,3/5]. Its endpoints are(0,4/5,1/5)and(2/5,0,3/5); both sum to one and have mean6/5. Use strings or Fraction values for intended rational/decimal input. At mean0 or2 the interval collapses to one vertex. At10/7 it reproduces[3/7,5/7]. Normalization alone enforces only the sum; it can change the mean. Feasibility is still not optimality: the earlier KL certificate establishes the entropy comparison.

</details>

### 10. Distinguish independent choices from a copied bit

Let X be a fair bit. In one experiment Y is an independent fair bit; in another Y=X. Find the probability and surprise of the pair(1,1), using the correct conditional factor in each experiment. Is adding the two marginal surprises always correct?

<details><summary>Optional hint</summary>

The first factor P(X=1) is.5 in both experiments; the second factor is P(Y=1|X=1).

</details>

<details><summary>Worked solution and reasoning</summary>

Independence gives .5×.5=.25 and2bits. Copying gives .5×1=.5 and1bit. Marginal Y is fair in both cases, but its conditional surprise after observing X changes from1to0. Adding marginal surprises implicitly assumes the independent factorization. The logarithm product identity is unchanged; the probability supplied to it must match the process.

</details>

### 11. Repair a block-length construction

A routine floors the ideal information of each block and divides lengths by n before checking prefix feasibility. For Bernoulli P(1)=1/4 and n=2, repair the construction, find the expected per-symbol length, and expose the floor bug. Use an exact dyadic probability as an additional boundary check.

<details><summary>Optional hint</summary>

The four block probabilities are(9/16,3/16,3/16,1/16). Integer lengths belong to whole codewords. The capacity sum isΣ2⁻ˡ.

</details>

<details><summary>Worked solution and reasoning</summary>

Ceiling lengths are(1,3,3,4), with Kraft sum13/16. Their source-weighted expected block length is31/16bits, so the per-symbol rate is31/32. Floored lengths(0,2,2,4) have Kraft sum25/16>1 and cannot form a prefix code. Divide the expected block cost by2after constructing integer lengths.

```python
from fractions import Fraction


def ceiling_information_length(probability):
    probability = Fraction(probability)
    if not 0 < probability <= 1:
        raise ValueError("Expected a positive probability at most one.")
    length = 0
    while Fraction(1, 2**length) > probability:
        length += 1
    return length
```

The strict comparison means probability1/8returns exactly3, not4. A fair one-bit source gives one-bit lengths. This simple exact loop makes the rounding boundary inspectable; it is not a claim of scalable block compression. The original programme's enumeration cost grows exponentially with block length.

</details>

### 12. Decide which KL argument is valid

Prove the equality condition in the finite KL bound when P has zero entries. Then assess three claims: “uniform entropy is largest even when the alphabet changes”; “a symmetric divergence must use distance between labels”; and “if P=Q has infinite entropy, KL is infinity minus infinity.” Give a correction for each.

<details><summary>Optional hint</summary>

Track both the rowwise log inequality and any Q mass outside P's support. The ratio definition is more fundamental than subtracting separately divergent quantities.

</details>

<details><summary>Worked solution and reasoning</summary>

Equality in every positive-P row requires Q=P there, and equality in1−Q(S)≥0requires no Q mass outside S. Hence the entire distributions agree. Uniform maximizes entropy on a fixed finite alphabet; log m changes when m changes. Symmetry concerns exchanging arguments, not geometric distances between category labels: Jensen–Shannon is a counterexample to that inference. For P=Q, the supported log ratio is zero and KL=0even if both separate entropies diverge. The tail law proportional to1/[k(ln k)²]shows that finite total mass can coexist with infinite entropy. Neither an undefined subtraction nor a finite truncation proves the general ratio result.

</details>

### 13. Repair the library boundary

An array has shape(2,3), with rows(1000,998,996)and(0,−1000,−2000). The observed classes are0and2. A routine applies softmax across the two examples, passes those results into cross_entropy, and uses target array(2,1,0)as a soft row. Identify each change needed. Explain which mean formula would have to be reconsidered if class weights or ignored labels were added.

<details><summary>Optional hint</summary>

Classes occupy the second axis. The loss expects raw logits. A valid probability target is different from an arbitrary weight vector.

</details>

<details><summary>Worked solution and reasoning</summary>

Supply the original logits directly with class indices of shape(2,)and integer dtype. The correct class-index losses are approximately(.142932,2000), giving arithmetic mean1000.071466for this unweighted, unignored fixture. To inspect log probabilities separately use log_softmax with class dimension1. The malformed soft row sums3; if it was meant as explicit weights, deliberately normalize to(2/3,1/3,0)and state that target, otherwise reject it. Do not normalize examples against one another. Class weights and ignored labels change the loss/reduction contract; derive the denominator from the chosen API rather than retaining the ordinary two-row mean blindly.

</details>

### 14. Trace an observed prediction without refitting on test labels

Using the supplied penguin counts, find the island model's probability for an Adelie record on Biscoe, trained on2007–2008 with additive count1. Explain why its test-island loss uses60records and the final mean uses120. Reconstruct the conditional entropy-plus-KL total. Then consider changing the smoothing strength to.5after choosing it by the2009score: what role does that score now play?

<details><summary>Optional hint</summary>

Biscoe training counts are(28,0,80). Its held-out counts are(16,0,44). The other held-out island sizes are44and16.

</details>

<details><summary>Worked solution and reasoning</summary>

The Biscoe model is(29,1,81)/111, so Adelie probability is29/111and its bit loss is−log₂(29/111). The mean within Biscoe averages its16Adelie and44Gentoo rows over60. That mean then receives weight60/120, while Dream and Torgersen receive44/120and16/120. With the declared fitted model, the final descriptive empirical H,CE,KL are(.782798115,.805893591,.023095476)bits. These quantities use the same120records and sum correctly. A model fitted to the test histograms would answer a different question.

After selecting alpha using2009scores, that year is development information; it is no longer an untouched comparison for that selection procedure. Refitting with alpha.5would change the Biscoe probabilities to(28.5,.5,80.5)/109.5. Its new score should be computed and identified as a new selected model, not called the previous held-out result. The sampling design still does not establish a random Antarctic population or a causal effect of island.

</details>
