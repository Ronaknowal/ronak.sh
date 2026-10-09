# Entropy, Cross-Entropy & KL Divergence

A device sends status symbols. Some occur often; others rarely. Can short binary messages exploit that pattern? A prediction model has a related problem: what does it cost to believe the wrong pattern? Follow the same four outcomes through their probabilities, codewords and prediction costs, then use that accounting to compare models and certify a constrained distribution.

Prerequisites: [Probability Distributions & Bayes' Theorem](/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations) supplies probabilities, conditional slices and weighted averages. [Algebra, Functions, Exponentials & Logarithms](/learn/path/full-curriculum/algebra-functions-exponentials-logarithms?module=math-foundations) explains logarithms as inverse powers. We refresh both operations. The continuous branch introduces density and integration locally; [Measure Theory](/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations) supplies further foundations.

On a first pass, read sections 1–4, the basic bound and direction in 5, then conditional prediction and practical scoring in 6–7. Try the related practice before returning to the deeper coding proof and sections 8–9. The drawings and live investigations work here; complete Python files run in your own environment. Most use the standard library. The explicitly named comparisons use NumPy/SciPy or PyTorch. Printed decimals are rounded and their tested environments are stated beside the programmes.

- [Surprise and units](#1-start-with-a-message-and-its-surprise)
- [Entropy as a weighted average](#2-average-over-what-actually-happens)
- [Actual coding and decoding](#3-turn-information-into-actual-binary-words)
- [Cross-entropy and KL](#4-let-one-distribution-supply-outcomes-and-another-supply-prices)
- [Proof, direction and support](#5-prove-the-bound-and-respect-the-direction)
- [Conditional prediction](#6-predict-with-the-information-you-have)
- [Stable computation and evaluation](#7-compute-and-interpret-log-loss)
- [Densities and coordinates](#8-change-continuous-units-without-changing-the-experiment)
- [Maximum entropy](#9-use-kl-to-certify-a-maximum-entropy-model)
- [Independent practice](#10-practise-with-new-distributions-and-decisions)

## 1. Start with a message and its surprise

Our device can send A, B, C or D. The source describes how frequently each would occur over repeated draws.

[[E01]]

A occupies half the probability strip, B a quarter, and C and D an eighth each. Together the masses sum to one. A **distribution** assigns such probabilities to the possible outcomes. We write P(x) for the mass of outcome x under source P. The letters name categories; A is not numerically closer to B than to D. The strip describes the law, not a promise that every eight-symbol message will contain exactly four As.

Each time we halve a probability, we need one more equally weighted binary choice to identify that outcome.

[[E02]]

Probability 1/2 corresponds to one such choice,1/4 to two and 1/8 to three. A logarithm reverses the power: because 2⁻³=1/8, −log₂(1/8)=3. We call −log₂P(x) the outcome's **surprisal**, measured in **bits**. At this point “bit” names an information unit; it does not yet guarantee an integer number of transmitted digits.

| Outcome | P(x) | −log₂P(x) |
| --- | --- | --- |
| A | 1/2 | 1 bit |
| B | 1/4 | 2 bits |
| C | 1/8 | 3 bits |
| D | 1/8 | 3 bits |

Why should information use a logarithm? Follow two choices along one path.

[[E03]]

An independent first event has probability 1/2 and the second 1/4. Their joint probability is 1/8; their information adds as 1+2=3 bits. The product rule and logarithm rule agree:

$$I_P(x)=-\log_bP(x),\qquad -\log_b(pq)=-\log_bp-\log_bq.$$

The log identity holds for positive p and q. Using pq as a joint probability needs independence. In a dependent process, the second branch instead has its probability conditional on the first: P(x,y)=P(x)P(y|x). A second copy of an already known bit supplies no new information; its conditional probability is one.

Information has a unit because we choose the logarithm's base.

[[E04]]

Base 2 gives bits. The natural logarithm, ln with base e, gives **nats**. One bit equals ln 2≈.693147 nats; divide nats by ln 2 to express the same amount in bits. The two rulers identify the same probability with different numerical units. Keep the base consistent within a sum or comparison.

An outcome assigned probability 1 has zero surprise. As a positive probability approaches zero its surprise grows without bound. Observing something the model assigned probability 0 contradicts that exclusion and has infinite model surprise. “Surprising” here means improbable under a stated model. It does not measure emotional significance, usefulness, truth or how random a string looks.

**Checkpoint.** A model assigns probability 1 to A and 0 to B. What does observing each one reveal?

<details><summary>Compare your reasoning</summary>

Observing A supplies −log₂1=0 bits under this model: it was completely predicted. Observing B exposes a support error and gives infinite model surprise. The model's exclusion does not prove B impossible in reality.

</details>

## 2. Average over what actually happens

One rare outcome can be very surprising while making only a small contribution to an average. Weight its price by how often it occurs.

[[E05]]

Each rectangle has width P(x), height −log₂P(x), and area equal to their product. A contributes .5×1=.5 bit per draw; B contributes .25×2=.5; C and D each contribute .125×3=.375. The four areas sum to **1.75 bits per symbol**. Giving every category equal weight would incorrectly produce(1+2+3+3)/4=2.25.

**Shannon entropy** is this expected surprisal when the same distribution supplies both frequencies and prices:

$$H_b(P)=\mathbb E_{X\sim P}[-\log_bP(X)]=-\sum_xP(x)\log_bP(x).$$

Expectation means multiply by the probability and add. Entropy concerns uncertainty before the draw, rather than the surprise of one particular outcome.

A biased coin makes the distinction particularly clear.

[[E06]]

At heads probability .9, a rare tail has about 3.322 bits of surprise but occurs only .1 of the time. Its weighted contribution is about .3322. Heads contributes about .1368, giving entropy .468996 bits. Change the heads probability in the investigation: the picture separates each outcome's price from its contribution, then locates their total on the entropy curve. Swapping .9 and .1 changes which outcome is rare but leaves the total unchanged. A fair coin has one bit.

The following complete standard-library programme computes that average. Save it as `entropy_coin.py` and run `python entropy_coin.py`. It was executed in the retained Python 3.12 verification; this lesson preserves that source and rounded result.

**entropy_coin.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

p_heads = 0.9
entropy_bits = -(
    p_heads * math.log2(p_heads)
    + (1 - p_heads) * math.log2(1 - p_heads)
)
print(round(entropy_bits, 3))
```

Output:

```text
0.469
```

The two terms directly match the two contribution rectangles. This small fixture uses positive probabilities. At a boundary, the entropy sum uses the limit 0log0=0; it does not evaluate log0 or pretend that the excluded event's surprise is zero. A distribution certain of one outcome has entropy 0. For m equally likely outcomes every price is log_b m, so the weighted average is also log_b m. Section 5 will prove that no finite distribution on those m labels has greater entropy.

### Deeper: why mixing laws can create uncertainty

Compare two certain but different outcomes with a random choice between their laws.

[[E07]]

Each certain law has entropy 0, but an equal mixture of them is a fair bit with entropy 1. The curve lies above the chord joining the component entropies. More generally entropy is **concave** in a finite probability vector. The summand g(p)=−p ln p has second derivative−1/p for p>0; summing these concave terms preserves concavity, and the continuous endpoint limit handles zero masses. Mixing laws and averaging their separate uncertainty are different operations.

## 3. Turn information into actual binary words

We now need an actual message the receiver can decode. Assign a binary string to each status symbol.

[[E08]]

The root is the start of a word. A0-edge or 1-edge chooses a branch. The leaves name A=0, B=10, C=110 and D=111. A **codeword** is the complete bit string from root to its leaf. This code is **prefix-free**: no complete word is the beginning of another complete word. An internal node therefore cannot also be a symbol leaf. The receiver must know this same codebook.

Follow a full stream and see where the receiver can emit a symbol.

[[E09]]

After each leaf, decoding returns to the root. The boundaries in the displayed stream are obtained by this rule; separators are not transmitted. The constructed message `AAAABBCD` contains the source proportions exactly. Its stream `00001010110111` uses 14 bits for 8 symbols, or 1.75 bits per symbol. Fixed two-bit words would use 16 bits.

The live investigation starts with the complete decoded result visible. Edit the message, then inspect any bit's path and output. A changed message changes the realized length; it does not change the source's expected length. The complete small codec shows the same operation:

**entropy_prefix.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
CODE = {"A": "0", "B": "10", "C": "110", "D": "111"}


def decode(bits, code):
    words = list(code.values())
    if len(set(words)) != len(words) or any(
        not word or set(word) - {"0", "1"} for word in words
    ):
        raise ValueError("Codewords must be distinct nonempty binary strings.")
    if any(a != b and b.startswith(a) for a in words for b in words):
        raise ValueError("Codebook is not prefix-free.")
    if set(bits) - {"0", "1"}:
        raise ValueError("The stream must contain only bits.")
    reverse = {word: symbol for symbol, word in code.items()}
    output, prefix = [], ""
    for bit in bits:
        prefix += bit
        if prefix in reverse:
            output.append(reverse[prefix])
            prefix = ""
        elif not any(word.startswith(prefix) for word in words):
            raise ValueError("This bit sequence has no matching word.")
    if prefix:
        raise ValueError("The stream ends inside a codeword.")
    return "".join(output)


message = "AAAABBCD"
bits = "".join(CODE[symbol] for symbol in message)
print(bits)
print(decode(bits, CODE))
print(f"{len(bits)} bits; {len(bits) / len(message):.2f} bits/symbol")
try:
    decode("11", CODE)
except ValueError as error:
    print(error)
```

Output:

```text
00001010110111
AAAABBCD
14 bits; 1.75 bits/symbol
The stream ends inside a codeword.
```

Read the decoder from its codebook check to its loop. It accumulates an unfinished prefix, emits only when that prefix equals a complete word, and rejects an impossible continuation or an unfinished ending. The final `11` has reached an internal node and cannot yet identify C or D. The printed error is the actual failed operation's result.

This fixed A–D implementation scans possible prefixes for clarity. For a larger alphabet, a tree decoder consumes each received bit once, O(B) visits for B stream bits plus output storage. The actual heap construction, sibling-exchange proof and tree decoder are taught in [Greedy Algorithms, section6](/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code). A Huffman tree is built in O(KlogK) heap operations for K symbols. Reuse that implementation when constructing a codebook; our small codec explains the information accounting rather than a general file format. Framing, metadata and a deterministic single-symbol alphabet need their own conventions.

Compare code assignments using the same source probabilities.

[[E10]]

The matched leaf depths 1,2,3,3 give expected length .5×1+.25×2+.125×3+.125×3=1.75. This equals entropy because each probability is exactly 2 to a negative integer. Reassigning long words to common symbols raises the expectation. A specific message can still favour another assignment: a single D uses 3 bits under the matched code and 2 under a fixed-width code. Expected cost is not a guarantee for every realized string.

Ideal information lengths are usually not integers.

[[E11]]

For probability .9 the ideal price is about .152 bits. A nontrivial two-symbol binary prefix code nevertheless needs at least one digit per individual symbol. For a finite alphabet, an optimal expected prefix-code length L* obeys

$$H_2(P)\le L^*<H_2(P)+1,$$

allowing the empty word for a deterministic single-outcome source. The upper construction rounds each positive outcome's ideal length upward: ℓ_x=⌈−log₂P(x)⌉. These lengths satisfy the prefix-capacity budget Σ2⁻ˡ≤1. Rounding adds less than one bit on average. This is a feasible bound construction; it need not be the optimal Huffman code. We will prove the lower bound after developing KL in section 5.

### Deeper: share the rounding overhead across a block

Group n independent source symbols and give the entire block one codeword.

[[E12]]

The ideal information of an independent block adds to nH(P). Applying the same prefix bound gives nH≤L_n<nH+1, hence H≤L_n/n<H+1/n. The less-than-one-bit overhead belongs to the entire block; dividing by n spreads it across the symbols. This can approach entropy without assigning a fraction of a physical digit to one isolated symbol.

**entropy_blocks.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
from fractions import Fraction
from itertools import product
from math import log2

p = Fraction(9, 10)
h = -float(p) * log2(float(p)) - float(1 - p) * log2(float(1 - p))
for n in (1, 2, 4, 8):
    expected_length, kraft = Fraction(0), Fraction(0)
    for sequence in product((0, 1), repeat=n):
        probability = p ** sum(sequence) * (1 - p) ** (n - sum(sequence))
        length = 0
        while Fraction(1, 2**length) > probability:
            length += 1
        expected_length += probability * length
        kraft += Fraction(1, 2**length)
    rate = float(expected_length) / n
    assert kraft <= 1
    assert h <= rate < h + 1 / n
    print(f"n={n}: rate={rate:.6f}, H={h:.6f}, upper={h+1/n:.6f}")
```

Output:

```text
n=1: rate=1.300000, H=0.468996, upper=1.468996
n=2: rate=0.800000, H=0.468996, upper=0.968996
n=4: rate=0.550925, H=0.468996, upper=0.718996
n=8: rate=0.550054, H=0.468996, upper=0.593996
```

The programme enumerates each block, computes its exact rational probability, and finds the first integer length whose capacity 2⁻ˡ is no greater than that probability. It checks the Kraft budget using fractions. For this .9 source, the n=1 ceiling construction costs 1.3 bits per symbol, worse than the optimal one-bit binary code. At n=8 its rate is .550054 against entropy .468996; the stated upper bound is .593996. The bound does not require every particular sequence of block sizes to improve monotonically.

Enumeration here takes 2ⁿ block visits, deliberately limited to n≤8 to inspect the theorem. It is not a scalable compressor. Dependent sequences use their joint/conditional probabilities; nH for independent draws cannot be substituted merely to simplify a calculation. Actual compression also includes framing, metadata, finite precision and any cost of learning an unknown source.

## 4. Let one distribution supply outcomes and another supply prices

Keep the device's source P, but let a model Q believe the statuses occur in almost the opposite pattern.

[[E13]]

The category identities and order remain A,B,C,D. Source weights are P=(.5,.25,.125,.125); model probabilities are Q=(.125,.125,.25,.5). Each P width now pays the corresponding −log₂Q price. A becomes expensive because Q wrongly calls it rare. These prices 3,3,2,1 produce total .5×3+.25×3+.125×2+.125×1=**2.625 bits per symbol**.

This expected model price is **cross-entropy**:

$$H_b(P,Q)=\mathbb E_{X\sim P}[-\log_bQ(X)]=-\sum_xP(x)\log_bQ(x).$$

The first argument supplies the expectation. Comparing probabilities in mismatched category orders would charge the wrong events. In our dyadic example the prices are actual prefix lengths; for a general Q they are ideal logarithmic costs, approached through suitable coding with overhead.

Place that 2.625-bit cost beside P's own 1.75-bit entropy.

[[E14]]

The difference is .875 bits. We call it **Kullback–Leibler divergence**, or KL:

$$D_{\rm KL}(P\Vert Q)=\sum_xP(x)\log_b\frac{P(x)}{Q(x)}=H_b(P,Q)-H_b(P).$$

Each row compares two prices for the same outcome. A contributes .5log₂4=1; B contributes .25; C contributes−.125; D contributes−.25. Individual contributions can be negative: Q prices some outcomes more cheaply. The sum is nonnegative, as section 5 proves. The signed ruler shows those terms on opposite sides of zero; they are not another probability distribution or four mistake probabilities.

The investigation lets you change the source weights and model weights separately. Matching Q to P removes every price difference. Swapping their roles changes which law supplies the frequencies. A unit switch rescales all three totals consistently. For a second finite example, this complete Bernoulli programme uses natural logarithms:

**entropy_bernoulli.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

# True Bernoulli probability P(x=1)=0.7; model believes Q(x=1)=0.9.
p, q = 0.7, 0.9
entropy = -(p * math.log(p) + (1 - p) * math.log(1 - p))
cross_entropy = -(p * math.log(q) + (1 - p) * math.log(1 - q))
kl = cross_entropy - entropy

print(round(entropy, 3), round(cross_entropy, 3), round(kl, 3))
```

Output:

```text
0.611 0.765 0.154
```

The printed .611,.765,.154 are entropy, cross-entropy and KL in nats for P(1)=.7,Q(1)=.9. Divide all three by ln 2 to obtain bits. No model changes merely because its information unit changes.

Now consider an outcome that the model excludes.

[[E15]]

At P=(.5,.5,0,0),Q=(1,0,0,0), positive source mass on B has no model probability. Cross-entropy and KL are infinite. The picture leaves an unbounded cost rather than drawing a finite-height bar labelled infinity. If the source mass on B becomes zero, that requirement disappears. A small positive Q(B) gives a large finite price instead; zero and very small positive probability are different mathematical cases.

| One outcome | Entropy term | Cross-entropy and KL terms |
| --- | --- | --- |
| P=0,Q≥0 | 0 by its limit | 0; no draw under P charges this row |
| P>0,Q=0 | Finite for this fixed P | +∞ |
| P>0,Q>0 | Ordinary formula | Ordinary formula; KL term may have either sign |

The **support** is the set of positive-probability outcomes. Finite KL on a finite alphabet requires P's support to lie inside Q's. A probability floor or smoothing distribution changes Q. That may be a sensible modeling choice, but it is not a finite report of the original infinite score. Normalize the new model and name the change.

Inputs have their own contract.

[[E16]]

The browser accepts explicit weights, normalizes them and shows the active probabilities. A malformed draft leaves its last valid experiment in place. The Python helper below instead requires normalized distributions. It rejects malformed input rather than silently changing its meaning.

**entropy_support.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math


def information(p, q, base=2):
    if len(p) != len(q) or not p:
        raise ValueError("Use the same nonempty labeled alphabet.")
    if not math.isfinite(base) or base <= 1:
        raise ValueError("Log base must be finite and greater than one.")
    for distribution in (p, q):
        if any(not math.isfinite(x) or x < 0 for x in distribution):
            raise ValueError("Probabilities must be finite and nonnegative.")
        if not math.isclose(sum(distribution), 1, rel_tol=0, abs_tol=1e-12):
            raise ValueError("Each distribution must sum to one.")
    entropy = cross_entropy = kl = 0.0
    for mass, model in zip(p, q):
        if mass == 0:
            continue
        entropy -= mass * math.log(mass, base)
        if model == 0:
            cross_entropy = kl = math.inf
        else:
            cross_entropy -= mass * math.log(model, base)
            kl += mass * (math.log(mass, base) - math.log(model, base))
    return entropy, cross_entropy, kl


for p, q in [
    ([0.5, 0.25, 0.125, 0.125], [0.125, 0.125, 0.25, 0.5]),
    ([1, 0], [0.5, 0.5]),
    ([0.5, 0.5], [1, 0]),
    ([1, 0], [1, 0]),
]:
    print(tuple(round(value, 6) for value in information(p, q)))
```

Output:

```text
(1.75, 2.625, 0.875)
(0.0, 1.0, 1.0)
(1.0, inf, inf)
(0.0, 0.0, 0.0)
```

The helper skips P=0 before taking logs, handles positive-P/zero-Q explicitly, and computes weighted sums. Its four outputs cover the status mismatch, a one-supported-outcome case, missing support and a certain matching law. Reading a browser's normalized weights as though a strict probability API had accepted them would mix two different contracts. An entered positive weight too small to represent numerically must not silently become an intended mathematical zero.

### Use a library while keeping the same question

SciPy's `entropy(pk,base=2)` computes entropy; with `qk` supplied it computes KL, not cross-entropy. It also normalizes non-unit sums. For the four-outcome vectors already defined, the calls are `h = entropy(p, base=2)` and `d = entropy(p, q, base=2)` after importing `entropy` from `scipy.stats`. The direct helper above supplies a strict validation contract. The [complete library programme in section6](#information-library-py) validates inputs, compares the finite sums and then applies the same API to conditional rows once we have learned that operation.

For the four statuses, these two routes give H=1.75,CE=2.625,KL=.875 bits. The code forms CE=H+KL only in this finite case; it never uses an undefined infinity-minus-infinity subtraction. Its missing-support case remains infinite. Passing weights[2,1] directly to SciPy gives entropy .918295834 bits after normalization, while the strict wrapper rejects them as probabilities. Choose the intended interface rather than treating those outcomes as a contradiction. The comparison was executed with NumPy 2.3.5 and SciPy 1.18.1; the displayed scalar formatting preserves those computed values.

Work is linear in the number of categories for these finite sums. For huge or sparse alphabets, retain only occupied source entries and the required model lookups rather than allocating an enormous dense table. The core operation remains the same weighted price calculation.

## 5. Prove the bound and respect the direction

The negative contributions in section 4 can reduce the total, but they cannot make it negative. Start with one ordinary logarithm inequality.

[[E17]]

For t>0, ln t≤t−1, with equality only at 1. The difference t−1−ln t has derivative 1−1/t: it decreases up to 1, increases afterwards and equals zero there. The straight tangent touches the log curve at 1 and stays above it.

Apply that inequality to each supported source outcome.

[[E18]]

Let S be P's support and assume Q>0 on S; otherwise KL is already infinite. Substitute t=Q(x)/P(x), multiply by P(x), and sum over S. In nats,

$$
\begin{aligned}
D_{\rm KL}(P\Vert Q)
&=-\sum_{x\in S}P(x)\ln\frac{Q(x)}{P(x)}\\
&\ge\sum_{x\in S}(P(x)-Q(x))\\
&=1-Q(S)\ge0.
\end{aligned}
$$

Equality requires equality in every supported row, Q(x)=P(x), and no Q mass left outside S. Thus the whole finite distributions must agree. A positive log-base conversion preserves the inequality.

Hold the source fixed and let the reporting model move.

[[E19]]

The expected logarithmic loss reaches its unique minimum at Q=P. This is the **strictly proper scoring** property: truthful probabilities minimize the population expectation over all possible reports. It does not promise that the truthful model wins on every finite sample, or that a restricted fitted family can represent P.

The same gap proves the entropy maximum on a fixed alphabet.

[[E20]]

For uniform U on m labels, every event costs log_b m. Hence H(P,U)=log_b m and

$$H_b(P)=\log_bm-D_{\rm KL}(P\Vert U)\le\log_bm.$$

Only uniform P removes the gap. The alphabet is fixed: changing the number or resolution of outcomes changes the question.

### Deeper: return to the prefix-code lower bound

A prefix code uses disjoint portions of a binary tree's capacity.

[[E21]]

At a common depth d, a word of length ℓ occupies 2^(d−ℓ) descendant slots. Distinct prefix-free words cannot overlap those slots. Dividing their total by 2ᵈ gives the **Kraft inequality**, K=Σ2⁻ˡ≤1. Choose d at least as large as every finite word length.

The matched code A=0, B=10, C=110, D=111 fills the entire capacity: K=1. To see unused capacity as well as mismatch, keep the same source P but choose A=0110, B=0111, C=010, D=00. No word prefixes another. Their lengths are (4,4,3,2), with capacities (1/16,1/16,1/8,1/4), summing to K=1/2. The four prefix intervals occupy the left half of the unit interval; the right half is unused. The source-weighted expected length is .5×4+.25×4+.125×3+.125×2=3.625 bits per symbol.

Normalize those capacities to another distribution R(x)=2⁻ˡˣ/K. Its price is −log₂R(x)=ℓ_x+log₂K. Average using the actual source P, then subtract its entropy.

[[E22]]

$$L-H_2(P)=D_{\rm KL}(P\Vert R)-\log_2K\ge0.$$

For the incomplete code, normalization gives R=(1/8,1/8,1/4,1/2), exactly the mismatched law already calculated in section4. Its KL cost is .875 bits. The unused-capacity cost is −log₂(1/2)=1 bit. Together they explain the full excess: L−H=3.625−1.75=1.875=.875+1 bits per symbol. For the matched complete code, R=P and K=1, so both pieces are zero.

Both pieces are nonnegative: mismatching the normalized capacity distribution incurs KL, and unfilled capacity has −log₂K≥0. This proves why every such prefix code pays at least the entropy. Section 3's ceiling construction supplies the other bound. No theorem about an average implies that each short realized message uses exactly its source entropy.

### Direction answers a different question

Exchange the law supplying the expectation.

[[E23]]

KL(P∥Q) weights the log ratio by P; KL(Q∥P) weights the reversed log ratio by Q. If P=(1,0) and Q=(.5,.5), the forward direction is 1 bit because Q covers P's one possible outcome. The reverse is infinite because Q draws an outcome P excludes. Different supports alone do not tell us both directions; support inclusion has a direction.

**Checkpoint.** Repair the claim “these supports differ, so both divergences are infinite.”

<details><summary>Compare your reasoning</summary>

Check which law supplies the expectation. For the displayed pair, every P-positive event has positive Q, giving KL(P∥Q)=log₂2=1. Q has positive mass on the second event while P has none, giving KL(Q∥P)=∞.

</details>

In a restricted variational family, reverse-KL minimization can favour concentration in one region of a multimodal target. This depends on the target, family and optimizer; it does not invariably choose one mode. [Variational Inference](/learn/path/full-curriculum/variational-inference?module=math-foundations) contains the actual finite-family and Gaussian comparisons.

Nor is KL an ordinary metric.

[[E24]]

For Bernoulli probabilities .1,.5,.9, in nats, D(.1∥.9)≈1.757780 while D(.1∥.5)+D(.5∥.9)≈.878890. The triangle inequality fails. Labels on the connecting arrows give computed directed costs; drawn segment lengths do not encode those costs. Relabelling categories preserves KL; moving mass between numerically near or far labels has no built-in transport distance. [Optimal Transport](/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations) supplies a geometry-aware comparison.

A finite symmetric alternative is Jensen–Shannon divergence: M=(P+Q)/2, then average KL(P∥M) and KL(Q∥M). The mixture covers both supports, avoiding direct mismatch infinities. It still does not add geometric distances between labels. [f-Divergences & Integral Probability Metrics](/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations) examines how the comparison depends on the intended question.

### Deeper: when subtraction is undefined

Finite probability mass can be spread over infinitely many outcomes in a way that has infinite entropy.

[[E25]]

Normalize p_k proportional to 1/[k(ln k)²], k≥2. The probability series converges by the integral test, while its entropy diverges like Σ1/(k ln k). Partial sums in a drawing only illustrate the different tails; they are not a numerical proof of convergence or divergence.

For Q=P, every supported ratioP/Q is 1 and KL=0. Yet H(P,Q)−H(P) would be∞−∞, an undefined subtraction. The ratio definition is primary. On general spaces, KL uses the expected log density ratio when P is absolutely continuous with respect to Q—every Q-null measurable set is also P-null—and is infinite otherwise, with the required integrability conventions. Do not turn two divergent quantities into a claimed finite difference.

## 6. Predict with the information you have

A classifier sees features X before predicting a label Y. Its report Q(y|x) is a distribution over labels for that context. Begin with one observed label.

[[E26]]

The **one-hot target** puts probability 1 on the observed correct class and 0 on the others. Multiplying model log prices by those target weights selects just one price, −log Q(y|x). A soft target instead distributes its weights across classes; its loss is the weighted sum of those same prices. Neither target vector is a second set of logits.

To ask about expected prediction cost, we must also account for how frequently each context occurs.

[[E27]]

The initial joint table uses a fair context bit X. The label agrees with X with probability .9, while the model reports agreement probability .8. Select either row: divide its joint masses by its context mass. Price the resulting label probabilities using that row's model, then multiply its row cost by the context mass before adding the rows.

With label-flip probability .1, each true row has entropy h₂(.1)≈.468996 bits. Each model row costs −.9log₂.8−.1log₂.2≈.521928 bits, an excess .052933. The label histogram is balanced, H(Y)=1 bit; knowing X improves the relevant baseline to H(Y|X). If Y always equalled X, that remaining uncertainty would be zero even though the marginal labels stayed balanced.

For each positive-probability context, cross-entropy equals entropy plus KL. Weight those identities by P_X(x):

$$
\mathbb E_{(X,Y)\sim P}[-\log Q(Y|X)]
=H_P(Y|X)+\mathbb E_{X\sim P_X}D_{\rm KL}(P(\cdot|X)\Vert Q(\cdot|X)).
$$

**Conditional entropy** is that context-weighted average remaining uncertainty. It is generally different from entropy of the overall label histogram. A context of probability zero contributes nothing to the expectation; its conditional distribution is not defined by dividing zero by zero.

**entropy_conditional.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

noise, trust = 0.1, 0.8
joint = {(x, y): 0.5 * (1 - noise if x == y else noise) for x in (0, 1) for y in (0, 1)}
conditional_entropy = conditional_loss = 0.0
for (x, y), mass in joint.items():
    true_conditional = 1 - noise if x == y else noise
    model_conditional = trust if x == y else 1 - trust
    if mass:
        conditional_entropy -= mass * math.log2(true_conditional)
        conditional_loss -= mass * math.log2(model_conditional)
print("P(Y=1):", sum(mass for (x, y), mass in joint.items() if y == 1))
print(f"H(Y|X)={conditional_entropy:.6f} bits")
print(f"Model loss={conditional_loss:.6f} bits")
print(f"Excess={conditional_loss-conditional_entropy:.6f} bits")
```

Output:

```text
P(Y=1): 0.5
H(Y|X)=0.468996 bits
Model loss=0.521928 bits
Excess=0.052933 bits
```

This complete standard-library programme visits all four joint outcomes and directly weights their losses. Its initial symmetric rows have the same cost. Changing only their frequency therefore leaves their correctly weighted average unchanged. That is a useful null result, but it can conceal an incorrect routine that averages the row costs equally.

Switch the investigation to **unequal row costs**. Context masses are now(.75,.25), with P(Y=1|X=0)=.1 and P(Y=1|X=1)=.5. Let the model report those truthful conditionals. The joint rows are(.675,.075) and(.125,.125). Their entropies are .468995594 and 1 bit, so the correct average is

$$.75(.468995594)+.25(1)=.601746695\text{ bits}.$$

An incorrect uniform average gives(.468995594+1)/2=.734497797. The drawing shows both row costs and both context multipliers before joining the contributions. Change the second context mass to .5: the two averages then agree. At mass 0, the answer is just .468995594 and the absent context is explicitly unavailable. The complete `information_library.py` below performs both the direct joint sum and SciPy row entropies with `axis=1`, followed by the actual context weights. The axis chooses what is summed; it does not supply the correct context frequencies by itself.

Conditioning helps on average, but one observed context can make the remaining uncertainty larger.

[[E28]]

Let independent fair bits A and B produce Y=A OR B. Before seeing A, Y=1 has probability .75 and H(Y)≈.811278 bits. If A=0, Y=B is a fair bit with entropy 1; if A=1, Y is certain with entropy 0. The contexts occur equally often, giving average .5. The increase in the first slice does not contradict the average reduction. [Mutual Information & Information Bottleneck](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations) develops that reduction as a measure of dependence.

The same multiplication rule explains the entropy **chain rule**. Start from P(x,y)=P(x)P(y|x), take negative logs and average over the joint law:

$$H(X,Y)=H(X)+H(Y|X).$$

Identifying the pair costs the information in X plus the average remaining information in Y once X is known. We have not assumed X and Y independent.

For observed data, connect these prices to the probability assigned to the whole record. The first trace below uses two labelled rows, with inputs x₁,x₂ held fixed and observed labels y₁=0,y₂=1. A model with fixed shared parameters θ supplies one correct-label probability for each row.

The second trace is a different experiment: an ordered sequence A,B,A. Its next-token distribution uses the prefix already observed, so its conditioning inputs are start, A and A,B. Keep those past-context factors distinct from the separate fixed-input rows.

[[E29]]

In the first trace, Qθ(0|x₁)=.8 and Qθ(1|x₂)=.25. Under the conditionally independent row model, their joint conditional likelihood is .8×.25=.2. Their negative log prices add to −ln(.2)=1.609437912 nats, with mean .804718956 nats per observed row.

If observations are modeled as conditionally independent given their inputs and shared parameters θ, their conditional likelihood is ∏ᵢQ_θ(yᵢ|xᵢ). Negative log turns that product into a sum. Dividing by fixed positive n changes the scale but not the minimizing parameter:

$$\operatorname*{argmax}_{\theta}\prod_{i=1}^{n}Q_\theta(y_i|x_i)
=\operatorname*{argmin}_{\theta}\frac1n\sum_{i=1}^{n}-\log Q_\theta(y_i|x_i).$$

This is the connection to [Maximum Likelihood](/learn/path/full-curriculum/maximum-likelihood-map-estimation?module=math-foundations). In the separately labelled sequence trace, use Q(A|start)=.5, Q(B|A)=.25 and Q(A|A,B)=.8. The probability of that ordered sequence is .5×.25×.8=.1, and its negative log likelihood is −ln(.1)=2.302585093 nats. These are past-context factors, not three independent marginal token probabilities. An autoregressive sequence handles dependence with conditional factors Q(y_t|earlier context); tokens need not be independent. Omitting dependence without modeling it gives the objective a different statistical meaning. A lucky finite observed sample may have lower average loss than population conditional entropy; the entropy-plus-KL inequality concerns the full expected risk.

The full library comparison below now joins the two calculations. Its first part compares the four-status H, CE and KL from section 4. Its `conditional` array has two rows, each summing to one; `axis=1` computes one entropy for each row. The context vector then weights those two values. Multiplying `context[:, None]` by the row matrix reconstructs the joint table, so a direct joint-weighted sum checks the same operation through a different arrangement. The three context settings expose the unequal-cost case, the equal-context null and the zero-context limit.

<a id="information-library-py"></a>

**information_library.py**

Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The numerical calculation was executed once; scalar display formatting was subsequently simplified without changing the computed values.

```python
import math

import numpy as np
from scipy.stats import entropy


def probability_vector(values):
    values = np.asarray(values, dtype=np.float64)
    if (values.ndim != 1 or len(values) == 0
            or not np.isfinite(values).all() or (values < 0).any()
            or not math.isclose(float(values.sum()), 1.0, abs_tol=1e-12, rel_tol=0)):
        raise ValueError("Expected a finite, normalized probability vector.")
    return values


def direct_costs(p, q):
    p, q = probability_vector(p), probability_vector(q)
    if p.shape != q.shape:
        raise ValueError("Both distributions must use the same outcomes.")
    active = p > 0
    h = -math.fsum(float(a) * math.log2(float(a)) for a in p[active])
    if (q[active] == 0).any():
        return h, math.inf, math.inf
    ce = -math.fsum(float(a) * math.log2(float(b))
                   for a, b in zip(p[active], q[active]))
    kl = math.fsum(float(a) * (math.log2(float(a)) - math.log2(float(b)))
                   for a, b in zip(p[active], q[active]))
    return h, ce, kl


def main():
    p = probability_vector([0.5, 0.25, 0.125, 0.125])
    q = probability_vector([0.125, 0.125, 0.25, 0.5])
    manual = direct_costs(p, q)
    h, kl = entropy(p, base=2), entropy(p, q, base=2)
    library = (h, h + kl, kl)
    assert np.allclose(manual, library, atol=1e-12, rtol=0)
    print("manual H CE KL bits", [round(float(x), 9) for x in manual])
    print("SciPy H CE KL bits", [round(float(x), 9) for x in library])

    conditional = np.array([[0.9, 0.1], [0.5, 0.5]])
    for row in conditional:
        probability_vector(row)
    row_costs = entropy(conditional, base=2, axis=1)
    print("truthful conditional row costs", [round(float(x), 9) for x in row_costs])
    for context in ([0.75, 0.25], [0.5, 0.5], [1.0, 0.0]):
        context = probability_vector(context)
        joint = context[:, None] * conditional
        direct = -math.fsum(float(joint[i, j]) * math.log2(conditional[i, j])
                            for i in range(2) for j in range(2)
                            if joint[i, j] > 0)
        weighted = float(context @ row_costs)
        assert math.isclose(direct, weighted, abs_tol=1e-12)
        print("context / weighted / uniform", context.tolist(),
              round(weighted, 9), round(float(row_costs.mean()), 9))

    support = direct_costs([0.5, 0.5, 0], [1, 0, 0])
    assert math.isinf(entropy([0.5, 0.5, 0], [1, 0, 0], base=2))
    print("missing-support H CE KL", support)
    print("SciPy entropy of weights [2, 1] bits",
          round(float(entropy([2, 1], base=2)), 9))
    try:
        probability_vector([2, 1])
    except ValueError:
        rejected = True
    else:
        rejected = False
    assert rejected
    print("strict probability input rejected", rejected)


if __name__ == "__main__":
    main()
```

Output:

```text
manual H CE KL bits [1.75, 2.625, 0.875]
SciPy H CE KL bits [1.75, 2.625, 0.875]
truthful conditional row costs [0.468995594, 1.0]
context / weighted / uniform [0.75, 0.25] 0.601746695 0.734497797
context / weighted / uniform [0.5, 0.5] 0.734497797 0.734497797
context / weighted / uniform [1.0, 0.0] 0.468995594 0.734497797
missing-support H CE KL (1.0, inf, inf)
SciPy entropy of weights [2, 1] bits 0.918295834
strict probability input rejected True
```

The validator rejects weights before an automatic API normalization can change their meaning. Boolean selection keeps zero source probabilities out of logarithms. The direct KL uses separate logs; it does not first divide two tiny probabilities. This finite calculation takes linear work in the number of joint cells; array broadcasting changes the arrangement of the arithmetic, not the probability law.

## 7. Compute and interpret log loss

A neural classifier often supplies one real-valued score per class. These **logits** must become probabilities, but computing enormous exponentials is unnecessary.

[[E30]]

For z=(1000,998,996), subtract the largest score 1000 from every entry, producing(0,−2,−4). Exponentiate those shifted scores and add them. The sum is 1+e⁻²+e⁻⁴; its logarithm is about .142932. Each log probability is its shifted score minus that common log sum. The last class therefore has log probability−4.142932 and loss 4.142932 nats.

Softmax is Q_j=e^(z_j)/Σ_ke^(z_k). A common added constant multiplies numerator and denominator by the same factor and cancels. With m=max_jz_j and s=Σ_je^(z_j−m), compute

$$\log Q_j=(z_j-m)-\ln s,\qquad \ell(z,y)=(m-z_y)+\ln s.$$

Keep these grouped subtractions. Computing a huge common log normalizer and subtracting it afterwards can lose precision. The investigation preserves the class identities through logits, exponentials, normalization and target selection. Change a score, add a common shift or change the target; the last operation chooses a price rather than changing the model.

Even a stable probability can underflow when converted out of log space.

[[E31]]

For logits(0,−1000,−2000), the last probability rounds to zero in floating arithmetic. Its log probability can still be represented as−2000, and its loss is 2000 nats. Taking log of the separately rounded zero would incorrectly turn this finite-logit result into infinity.

**entropy_logits.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math


def log_probabilities(logits):
    if not logits or any(not math.isfinite(x) for x in logits):
        raise ValueError("Use a nonempty list of finite logits.")
    maximum = max(logits)
    shifted = [x - maximum for x in logits]
    log_normalizer = math.log(sum(math.exp(x) for x in shifted))
    return [x - log_normalizer for x in shifted]


for scores in ([2, 0, -2], [1002, 1000, 998], [1000, 0, -1000]):
    logp = log_probabilities(scores)
    print("log probabilities:", [round(x, 6) for x in logp])
    print("last-class loss:", round(-logp[-1], 6))
```

Output:

```text
log probabilities: [-0.142932, -2.142932, -4.142932]
last-class loss: 4.142932
log probabilities: [-0.142932, -2.142932, -4.142932]
last-class loss: 4.142932
log probabilities: [0.0, -1000.0, -2000.0]
last-class loss: 2000.0
```

The first two score vectors differ by a common 1000 and have the same printed log probabilities. The last vector follows the log path directly. Work is O(C) per row for C classes. Stable evaluation does not repair NaN inputs, unrepresentable differences between finite extremes, or a truly excluded class. Those are distinct from ordinary small positive probabilities whose logs remain representable.

The framework interface must describe the same arrays.

[[E32]]

For N examples and C classes, PyTorch `cross_entropy` receives raw logits of shape(N,C). Class-index targets have shape(N,) and dtype`torch.long`. Soft targets are valid probability rows of shape(N,C) with floating dtype. The library does not completely validate their normalization and nonnegativity, so the caller must supply a meaningful target. Applying softmax first feeds probabilities into an API that expects logits and changes the resulting model loss.

**entropy_torch.py**

Retained tested PyTorch 2.14 CPU example with float64 logits. Install PyTorch using its official platform instructions.

```python
import torch
import torch.nn.functional as F

scores = torch.tensor([[2.0, 0.0, -2.0], [1000.0, 0.0, -1000.0]], dtype=torch.float64)
labels = torch.tensor([0, 2], dtype=torch.long)
losses = F.cross_entropy(scores, labels, reduction="none")
assert torch.allclose(losses, F.cross_entropy(scores + 1000, labels, reduction="none"))
soft_targets = torch.tensor([[0.7, 0.2, 0.1], [0.0, 0.0, 1.0]], dtype=torch.float64)
assert bool(torch.all(soft_targets >= 0))
assert torch.allclose(soft_targets.sum(dim=1), torch.ones(2, dtype=torch.float64))
soft_losses = F.cross_entropy(scores, soft_targets, reduction="none")
print("Class-index losses:", [round(x, 6) for x in losses.tolist()])
print("Soft-target losses:", [round(x, 6) for x in soft_losses.tolist()])
print("Mean class-index loss:", round(losses.mean().item(), 6))
```

Output:

```text
Class-index losses: [0.142932, 2000.0]
Soft-target losses: [0.942932, 2000.0]
Mean class-index loss: 1000.071466
```

This preserved programme was executed with PyTorch 2.14 CPU. It uses float64, no class weights, no ignored labels and no smoothing. Thus its mean is the ordinary mean of its two class-index losses. The first row changes from hard-target loss .142932 to soft-target loss .942932 because the target now assigns weight to other class prices. The second row keeps its 2000-nat cost. `reduction='none'` exposes each example before averaging.

Weights, ignored labels and smoothing alter the scoring or reduction contract; inspect the documented denominator before transferring a hand calculation. For a binary one-logit model the stable interface is `binary_cross_entropy_with_logits`. Names that contain “cross entropy” do not guarantee interchangeable input conventions. Install PyTorch using its [official platform instructions](https://pytorch.org/get-started/locally/); the optional SciPy programme needs NumPy and SciPy. Python files include their own imports and data except the explicitly supplied CSV beside the observed-data programme.

### Confidence changes what accuracy cannot see

Give two models exactly the same ten binary test cases.

[[E33]]

Model A assigns correct-label probability .6 on cases 1–8 and .4 on 9–10. Model B gives .99 on 1–8 and .01 on 9–10. With threshold .5 and no ties, both get 8/10 correct. Their log prices differ sharply: B saves a little on eight already-correct cases and pays about 4.605 nats on each confidently wrong one.

The mean losses are −[8ln.6+2ln.4]/10≈.591919 nats for A and −[8ln.99+2ln.01]/10≈.929074 for B. The drawing uses actual heights and numeric prices, including small positive costs; it does not impose a misleading minimum visible bar height.

**entropy_evaluation.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

correct_label_probabilities = {
    "A": [0.6] * 8 + [0.4] * 2,
    "B": [0.99] * 8 + [0.01] * 2,
}
for name, probabilities in correct_label_probabilities.items():
    losses = [-math.log(p) for p in probabilities]
    accuracy = sum(p > 0.5 for p in probabilities) / len(probabilities)
    mean_loss = sum(losses) / len(losses)
    geometric_probability = math.exp(-mean_loss)
    print(f"{name}: accuracy={accuracy:.0%}, loss={mean_loss:.6f} nats")
    print(f"geometric correct-label probability={geometric_probability:.6f}")
    print(f"perplexity={math.exp(mean_loss):.6f}")
```

Output:

```text
A: accuracy=80%, loss=0.591919 nats
geometric correct-label probability=0.553265
perplexity=1.807453
B: accuracy=80%, loss=0.929074 nats
geometric correct-label probability=0.394919
perplexity=2.532164
```

The programme stores all ten probabilities and uses the same denominator for both models. Its threshold-based accuracy is appropriate for this binary, no-ties fixture. In a multiclass problem compare the predicted argmax with the correct label; correct-label probability need not exceed .5 to be the largest class probability.

Turn the average log price back into a probability-like scale.

[[E34]]

**Perplexity** is b raised to the average base-b log loss. For natural logs,

$$\operatorname{PP}=\exp\left(-\frac1n\sum_i\ln Q(y_i|x_i)\right)
=\left(\prod_iQ(y_i|x_i)\right)^{-1/n}.$$

It is the reciprocal geometric mean probability assigned to the actual outcomes. A uniform m-way model has perplexity m. A general value 20 is an equivalent uniform cost, not a claim that every context presents exactly 20 candidates. The programme gives A about 1.807453 and B about 2.532164.

For language models, compare like tokenization, text, context rules and averaging. A different number of tokens changes the unit “per token.” Aggregate total negative log likelihood and total scored-token count for a token-weighted mean; averaging sentence perplexities does not perform that operation. A zero-probability observed event gives infinite perplexity.

### Score a small observed dataset

We can use actual field records to inspect context-aware prediction costs. The Palmer penguin data describe penguins observed in a study of body size, sex and foraging-related ecological differences. The collectors' scientific question was not our classification exercise; this small example asks only how island information affects species prediction on a declared year split.

[[E35]]

The supplied `penguins.csv` contains 344 rows. We use species, island and year, which are complete in these records. Missing body measurements do not justify dropping rows for this question. Use 2007–2008 for training,224 rows, and 2009 for the held-out comparison,120 rows. The fixed three species are Adelie, Chinstrap and Gentoo; islands are Biscoe, Dream and Torgersen.

Training species counts are(100,44,80). A global model adds one count to each species and divides by 227. A context model adds one to every species within each island and divides by that island's training count plus 3. Its training counts are Biscoe(28,0,80), Dream(36,44,0), Torgersen(36,0,0). Additive smoothing is an explicit model change that gives all three species positive predicted probability; its strength is fixed at 1 before using the test labels.

Select the predicted probability for each held-out record, then sum its loss.

[[E36]]

The test island counts are Biscoe(16,0,44), Dream(20,24,0), Torgersen(16,0,0):60,44and16 rows. The global model's mean loss is 1.518341224 bits, accuracy .433333333 and perplexity 2.864614937. The island model's mean loss is .805893591 bits, accuracy .7 and perplexity 1.748228292. These are results for these records and this specified split, not universal rankings of methods or a random census of Antarctic penguins.

**penguins_log_loss.py**

Executed with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. Save the supplied penguins.csv beside this file before running it.

```python
import csv
import math
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from scipy.stats import entropy


def fitted_distribution(counts, labels, alpha):
    denominator = sum(counts.values()) + alpha * len(labels)
    return {label: (counts[label] + alpha) / denominator for label in labels}


def main():
    with Path(__file__).with_name("penguins.csv").open(newline="", encoding="utf-8") as file:
        records = list(csv.DictReader(file))
    labels = ("Adelie", "Chinstrap", "Gentoo")
    islands = ("Biscoe", "Dream", "Torgersen")
    if any(row["species"] not in labels or row["island"] not in islands
           or row["year"] not in {"2007", "2008", "2009"} for row in records):
        raise ValueError("Unexpected or missing selected fields.")
    train = [row for row in records if row["year"] in {"2007", "2008"}]
    test = [row for row in records if row["year"] == "2009"]
    global_counts = Counter(row["species"] for row in train)
    island_counts = defaultdict(Counter)
    for row in train:
        island_counts[row["island"]][row["species"]] += 1
    alpha = 1.0
    global_q = fitted_distribution(global_counts, labels, alpha)
    conditional_q = {island: fitted_distribution(island_counts[island], labels, alpha)
                     for island in islands}
    print("train/test rows", len(train), len(test))
    print("training species counts", [global_counts[label] for label in labels])
    for island in islands:
        print("training island counts", island,
              [island_counts[island][label] for label in labels])

    models = {"global": lambda row: global_q,
              "island": lambda row: conditional_q[row["island"]]}
    for name, prediction in models.items():
        losses = [-math.log2(prediction(row)[row["species"]]) for row in test]
        correct = sum(max(labels, key=lambda label: prediction(row)[label]) == row["species"]
                      for row in test)
        mean_loss = math.fsum(losses) / len(test)
        print("test model / CE bits / accuracy / perplexity", name,
              round(mean_loss, 9), round(correct / len(test), 9), round(2**mean_loss, 9))

    weighted_h = weighted_kl = weighted_ce = 0.0
    for island in islands:
        rows = [row for row in test if row["island"] == island]
        counts = Counter(row["species"] for row in rows)
        p = np.array([counts[label] / len(rows) for label in labels])
        q = np.array([conditional_q[island][label] for label in labels])
        h = float(entropy(p, base=2))
        kl = float(entropy(p, q, base=2))
        ce = -math.fsum(float(a) * math.log2(float(b)) for a, b in zip(p, q) if a > 0)
        assert math.isclose(h + kl, ce, abs_tol=1e-12)
        weight = len(rows) / len(test)
        weighted_h += weight * h
        weighted_kl += weight * kl
        weighted_ce += weight * ce
        print("test island / counts / H CE KL bits", island,
              [counts[label] for label in labels], [round(x, 9) for x in (h, ce, kl)])
    row_loss = math.fsum(-math.log2(conditional_q[row["island"]][row["species"]])
                         for row in test) / len(test)
    assert math.isclose(weighted_ce, row_loss, abs_tol=1e-12)
    print("test weighted H CE KL bits", [round(x, 9) for x in
                                          (weighted_h, weighted_ce, weighted_kl)])


if __name__ == "__main__":
    main()
```

Output:

```text
train/test rows 224 120
training species counts [100, 44, 80]
training island counts Biscoe [28, 0, 80]
training island counts Dream [36, 44, 0]
training island counts Torgersen [36, 0, 0]
test model / CE bits / accuracy / perplexity global 1.518341224 0.433333333 2.864614937
test model / CE bits / accuracy / perplexity island 0.805893591 0.7 1.748228292
test island / counts / H CE KL bits Biscoe [16, 0, 44] [0.836640742, 0.849730932, 0.01309019]
test island / counts / H CE KL bits Dream [20, 24, 0] [0.994030211, 1.011549849, 0.017519637]
test island / counts / H CE KL bits Torgersen [16, 0, 0] [0.0, 0.075948853, 0.075948853]
test weighted H CE KL bits [0.782798115, 0.805893591, 0.023095476]
```

Place the supplied CSV beside the programme and run `python penguins_log_loss.py`. Python's `csv` reader and `Counter` expose the training counts; no hidden fitting API is needed for this categorical model. NumPy/SciPy calculate the same finite entropy and KL quantities per held-out island. The measured run used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1.

The final check forms a **descriptive empirical distribution** from the test labels. It does not use that distribution to fit either prediction model. Its context-weighted entropy is .782798115 bits, the island model's cross-entropy .805893591, and their KL gap .023095476. Each island's entropy uses its test histogram, then the average uses actual test weights 60/120,44/120,16/120. An unweighted average of island costs would answer a different sampling question.

The programme fits counts in O(number of training records) and scores each held-out row with one lookup. Dense storage is the small island-by-species table. For a future island absent from training, a prediction rule would need an explicit fallback; the provided split has every test island represented in training. Changing smoothing after looking at test scores turns that set into development information. Field-study selection, pairs and other dependence also limit what this one year split can establish about another population. Keep the collectors' sampling question separate from the didactic prediction task.

The offline CSV is the CC 0 Palmer penguins simplified dataset maintained by [Allison Horst and colleagues](https://allisonhorst.github.io/palmerpenguins/). The underlying study is [Gorman, Williams and Fraser2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081). Its retrieved bytes and selected fields are recorded with the supplied file; no network request occurs when running the programme.

Lower held-out log loss means a higher geometric mean probability on the same observed outcomes. It does not alone guarantee better accuracy, subgroup calibration, fairness, robustness after shift or decisions under asymmetric costs. A log-loss anomaly score is not automatically a p-value or a diagnosis of a cause.

### Deeper: price differences accumulate as evidence

Follow the actual signed model-price differences along a sequence.

[[E37]]

For specified models P and Q, the log likelihood ratio is Σ_tlog[P(event_t|past)/Q(event_t|past)]. In an independent finite source P, its expectation after n draws is nKL(P∥Q). The expected price gap therefore accumulates between those models. A realized sequence can include negative increments or have a negative total; an expectation is not a guarantee of a monotone trace. Dependence must be represented in the conditional factors rather than ignored.

## 8. Change continuous units without changing the experiment

For a numerical measurement, a density describes probability per unit coordinate. It is not the probability assigned to one exact value.

[[E38]]

Take X uniform over[0,.25]metres. Its density is 4per metre, and the middle-half interval has width .125metres, giving probability 4×.125=.5. A density can exceed 1 while every event probability remains valid. Under a continuous density law, a singleton has zero probability even where the density is positive.

For a density f relative to the chosen Lebesgue coordinate measure, **differential entropy** is h(f)=−∫f(x)log f(x)dx when that integral is defined. Lower-case h distinguishes it from discrete H. It can be negative, infinite or undefined; the finite-alphabet bounds do not transfer unchanged. A uniform interval of width w has h₂=log₂w, so the present coordinate convention gives−2. This is not “negative digits to transmit an exact real number.”

In centimetres, the same physical interval is[0,25], with density .04per centimetre. Let Y=aX,a>0. Since dy=a dx, preservation of interval probability requires f_Y(y)=f_X(y/a)/a. Substituting into the entropy integral gives h(Y)=h(X)+log a under the needed existence and finiteness conditions. At a=100, h₂ changes from−2 to 4.643856 while the same physical event still has probability .5. The live investigation keeps both the coordinate unit and density unit beside their rulers.

Now change what is recorded, rather than just its numerical unit.

[[E39]]

Split the physical interval into four equal bins. Each bin label has probability .25, so its discrete entropy is 2 bits. For N equal aligned bins, Δ=w/N and

$$H_2(\text{bin})=\log_2N=h_2(X)+\log_2(1/\Delta).$$

This equality is exact for the displayed uniform case. Doubling the number of bins adds one bit of bin-label entropy. Merely converting metres to centimetres scales both w and Δ and does not change the bins or their probabilities. A related fine-binning approximation can hold for suitably regular densities, but not universally for atoms, irregular bins or divergent integrals.

KL behaves differently from the two density entropies taken separately.

[[E40]]

Compare P and Q using densities f and g relative to the same coordinate measure:

$$D_{\rm KL}(P\Vert Q)=\int f(x)\ln\frac{f(x)}{g(x)}\,dx.$$

Under the same invertible smooth coordinate change, both density heights acquire the same inverse Jacobian factor. Those factors cancel in the ratio, and the probability element f(x)dx is preserved. Hence KL stays invariant. Differential entropy and differential cross-entropy separately change. For a general invertible smooth map, h gains the expected log absolute Jacobian determinant when the change-of-variable and integrability hypotheses hold.

**entropy_continuous.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

width, bins = 0.25, 4
for scale in (1, 100):
    coordinate_width = scale * width
    h = math.log2(coordinate_width)
    delta = coordinate_width / bins
    print(
        f"scale={scale}: h={h:.6f}, bin width={delta:g}, H(bin)={h-math.log2(delta):.6f}"
    )


def normal_kl(mean_p, sd_p, mean_q, sd_q):
    if (
        not all(math.isfinite(x) for x in (mean_p, sd_p, mean_q, sd_q))
        or min(sd_p, sd_q) <= 0
    ):
        raise ValueError(
            "Use finite means and strictly positive finite standard deviations."
        )
    return (
        math.log(sd_q / sd_p) + (sd_p**2 + (mean_p - mean_q) ** 2) / (2 * sd_q**2) - 0.5
    )


for scale in (1, 100):
    print(
        f"Normal KL after scaling by {scale}: {normal_kl(0,scale,scale,2*scale):.6f} nats"
    )
```

Output:

```text
scale=1: h=-2.000000, bin width=0.0625, H(bin)=2.000000
scale=100: h=4.643856, bin width=6.25, H(bin)=2.000000
Normal KL after scaling by 1: 0.443147 nats
Normal KL after scaling by 100: 0.443147 nats
```

The complete programme keeps four physical bins and reports H(bin)=2 bits in both units. It also compares P=Normal(0,1²) with Q=Normal(1,2²). KL is .443147 nats before and after multiplying both means and standard deviations by 100. Scaling only one distribution would be a different comparison.

### Deeper: derive Normal KL and compare measures honestly

Expand the two nondegenerate Normal log densities. Under P, E[(X−μ_P)²]=σ_P² and E[(X−μ_Q)²]=σ_P²+(μ_P−μ_Q)². Their normalizing constants give ln(σ_Q/σ_P); the averaged quadratic terms give

$$D_{\rm KL}(P\Vert Q)=\ln\frac{\sigma_Q}{\sigma_P}-\frac12+
\frac{\sigma_P^2+(\mu_P-\mu_Q)^2}{2\sigma_Q^2}.$$

Both standard deviations must be strictly positive. A degenerate point mass is not handled by substituting zero into this formula. Nor does one isolated zero of a density establish a support mismatch: the measure question is whether a Q-null measurable set has positive P probability.

Compare a finite empirical dataset with a smooth continuous model.

[[E41]]

The empirical distribution puts positive mass on its observed points; together that finite set has empirical probability 1. A continuous density model gives the same finite set probability 0. Thus KL from the empirical point-mass measure to that continuous law is infinite. Empirical average negative log density can still be a useful likelihood objective, but it is not a finite KL for those two measures.

A common fixed binning or smoothing changes the model and can supply a meaningful discrete comparison. For an underlying continuous density P with suitable finite entropy and cross-entropy, its population expected log density still obeys the valid entropy-plus-KL identity. [Measure Theory](/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations) explains densities relative to a reference and mixed or singular laws.

## 9. Use KL to certify a maximum-entropy model

Suppose a count can be 0,1or2. We know its mean but do not know all three probabilities.

[[E42]]

A point in the triangle represents(q0,q1,q2), three nonnegative coordinates summing to one. The vertex labelled 0 is the certain count 0 law; the other vertices are certain 1 and certain 2. The interior distributes probability among all three outcomes. The triangle is a map of probability laws, not the physical location of a count.

First hold the mean constraint fixed at E[X]=10/7. This first view lets you move among feasible probability laws; it does not yet introduce an optimizer or an entropy-gap display.

[[E43]]

The admissible laws lie on a line through the triangle. Let t=q2. Solving q0+q1+q2=1 and q1+2q2=10/7 gives q=(t−3/7,10/7−2t,t). Nonnegativity restricts t to[3/7,5/7]. The constraint leaves a real choice; it does not already determine the distribution.

**Maximum entropy** chooses the feasible distribution with the largest Shannon entropy on this specified alphabet. This is a modeling rule relative to stated outcomes and constraints, not proof of the physical process. Try p*=(1,2,4)/7. Its masses sum to one and its mean is(2+8)/7=10/7.

We can now compare a feasible q with the candidate p*. The entropy difference H(p*)−H(q) is their vertical separation on an entropy plot; a plot alone does not establish its sign for every feasible law. The linked view below adds the candidate, both entropies and their difference. Selecting p* moves q onto that candidate.

Compare the same feasible point in probability space and on the entropy curve.

[[E44]]

The live parameter t means q2, not Euclidean distance along the line. The linked views locate one law and its entropy. At t=3/7, q=(0,4/7,3/7), entropy .985228 bits. At t=5/7, q=(2/7,0,5/7), entropy .863121. The interior candidate p* has 1.378783. A sampled plot suggests a maximum, but a proof must cover every feasible law.

Here p*(x)=2ˣ/7, so log₂p*(x)=x−log₂7. Every feasible q has the same expected x,10/7. Its cross-entropy against p* is therefore fixed at log₂7−10/7. Hence

$$D_{\rm KL}(q\Vert p^*)=\log_27-\frac{10}{7}-H_2(q)
=H_2(p^*)-H_2(q)\ge0.$$

This certifies the **global maximum** and identifies its gap for every feasible q. Equality occurs only at p*. We did not merely find a stationary point or inspect a dense grid.

The general connection comes from [Exponential Families](/learn/path/full-curriculum/exponential-families-sufficient-statistics?module=math-foundations). With equal base weights on a finite support, p_η(x)=exp(ηT(x)−A(η)). If a positive member has the desired mean E[T]=m, then E_q log p_η=ηm−A(η) is fixed over every feasible q. The same KL identity certifies that member's entropy maximum. Our three-count example uses T(x)=x and η=ln 2.

### Deeper: feasible boundaries and reference weights

The earlier two views share the current feasible law. We now add a mean editor, after explaining how a changed constraint changes the feasible set and candidate. Change the required mean and watch that same line move in every linked view.

[[E45]]

For any mean m∈[0,2], q=(1−m+t,m−2t,t) with max(0,m−1)≤t≤m/2. The investigation preserves your relative position along this feasible t interval when m changes: if a=max(0,m−1), b=m/2 and τ∈[0,1], set t=a+τ(b−a). This is a coordinate fraction, not distance along the drawn line. All linked displays update to the same m and q. The numeric interface supports exact endpoint means0,2 and interior means from10⁻⁶ to2−10⁻⁶; unsupported or invalid drafts leave the last valid experiment visible with an explanation. A mathematical feasible mean outside that numerical interior is not thereby impossible. Reset in any view restores m=10/7 and the first endpoint τ=0. The means 0and2 leave only their corresponding vertices. Interior means have positive maximizers; endpoint point masses require η→−∞ or+∞, not finite η. On a nonempty finite simplex slice, continuity and compactness give an attained maximum, while strict concavity gives uniqueness. This does not establish existence of a finite optimizer for every unbounded continuous moment problem.

The base weights in an exponential-family model matter as well.

[[E46]]

For p_η(x)=h(x)exp(ηT(x)−A(η)) with positive nonuniform h, log p includes log h. With a fixed moment m,

$$D_{\rm KL}(q\Vert p_\eta)=A-\eta m-[H(q)+\mathbb E_q\log h].$$

Thus the certified objective is H(q)+E_qlog h. If r=h/Σh, that objective equals−KL(q∥r)+logΣh; it is entropy relative to those base weights, generally not ordinary Shannon entropy.

For count outcomes 0,1,2 and h=(1,2,1), η=0 gives p=(.25,.5,.25), mean 1 and entropy 1.5 bits. The uniform distribution has the same mean and greater ordinary entropy log₂3≈1.584963. But the base-relative objective is 2 for p and log₂3+1/3≈1.918296 for uniform. The programme's final two lines expose the ordinary-entropy counterexample, while the drawn base slots explain the extra weighting.

**entropy_maximum.py**

Standard-library Python example; the output is retained from its earlier verified execution.

```python
import math

p_star = [1 / 7, 2 / 7, 4 / 7]
mean = 10 / 7


def entropy(p):
    return -sum(x * math.log2(x) for x in p if x)


for t in (3 / 7, 4 / 7, 5 / 7):
    q = [1 - mean + t, mean - 2 * t, t]
    # Exact boundaries may accumulate tiny floating subtraction noise.
    q = [0.0 if abs(x) < 1e-14 else x for x in q]
    assert min(q) >= 0 and math.isclose(sum(q), 1)
    assert math.isclose(q[1] + 2 * q[2], mean)
    kl = sum(x * math.log2(x / y) for x, y in zip(q, p_star) if x)
    gap = entropy(p_star) - entropy(q)
    assert math.isclose(kl, gap, abs_tol=1e-12)
    print(f"q={[round(x,6) for x in q]}, H={entropy(q):.6f}, KL gap={kl:.6f}")
base_tilt = [0.25, 0.5, 0.25]
uniform = [1 / 3] * 3
print(f"Nonuniform base at eta=0: H={entropy(base_tilt):.6f}")
print(f"Same mean, uniform: H={entropy(uniform):.6f}")
```

Output:

```text
q=[0.0, 0.571429, 0.428571], H=0.985228, KL gap=0.393555
q=[0.142857, 0.285714, 0.571429], H=1.378783, KL gap=0.000000
q=[0.285714, 0.0, 0.714286], H=0.863121, KL gap=0.515663
Nonuniform base at eta=0: H=1.500000
Same mean, uniform: H=1.584963
```

The programme visits the two endpoints and the proposed optimum and verifies the same identity numerically. A small cleanup handles floating subtraction near an exact zero in this fixed fixture. Such cleanup is not a replacement for feasibility checks in an arbitrary solver: normalization and the specified mean must both hold.

A moment constraint fixes the expected log price of the matching exponential-family candidate; nonnegative KL turns that fact into a certificate. This mathematical conclusion does not require an additional slogan about making the “fewest assumptions.”



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

Two bits equal 2 ln 2 nats. E has 3 bits of surprise but contributes only(1/8)×3=3/8 bit to the source average. A category's price and the weighted contribution are different.

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

Independently implement a prefix-tree decoder. It must reject a word that prefixes another in either insertion order, reject an unfinished stream, and decode 101100. Use a tree so each received bit is visited once.

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

For A=0,B=10,C=110,D=111,101100 becomes BCA. An empty stream becomes empty text;11 is unfinished. Both insertion orders of A=0,B=01 must fail. The changed message DAB encodes 111010 and decodes back. Construction uses one visit per codebook bit; decoding is O(B) for B stream bits, plus the emitted output. The early codebook check and end-of-stream check solve different failures.

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

The first pair gives(1,1.207518749639422,.207518749639422) bits. The zero-zero third row never reaches a logarithm. The missing-support pair returns(1,infinity,infinity). The malformed P sums to 1.1 and is rejected. Matching certain laws(1,0,0) give all zeros, not NaN. Separate logarithms avoid overflow/underflow in a direct P/Q ratio. Adding epsilon would change Q and needs a separately named, normalized model.

</details>

### 5. Use unequal context frequencies

P(X=0)=0.75, P(Y=1|X=0)=0.2 and P(Y=1|X=1)=0.8. Calculate H(Y), H(Y|X), and the ideal expected losses with and without X. Explain which probabilities would need changing if the context frequencies shifted.

Now use joint rows(.675,.075),(.125,.125). Implement conditional entropy from the joint table, and repair an equal-row-average bug. Repeat after changing only context masses to(.5,.5) and(1,0), preserving conditional Y1 probabilities(.1,.5).

<details><summary>Optional hint</summary>

Average the two conditional entropies with 0.75 and 0.25. First calculate the marginal probability of Y=1.

</details>

<details><summary>Worked solution and reasoning</summary>

P(Y=1)=0.75×0.2+0.25×0.8=0.35, so H(Y)=h₂(0.35)≈0.934068 bits. Both contexts have entropy h₂(0.2)=h₂(0.8)≈0.721928, hence H(Y|X)=0.721928. A model that uses the true conditional achieves that expected loss. A model using the true marginal in both contexts has expected loss 0.934068. The context's average reduction is about 0.212140 bits. Weighting the contexts equally would generally be wrong, even though this symmetric pair happens to have equal conditional entropies.

The old .2/.8 row pair has identical entropies, so its equal average accidentally agrees. The new rows have costs .4689955935892812 and 1.

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

The correct result is .75×.4689955935892812+.25×1=.6017466951919609 bits. Uniform averaging incorrectly gives .7344977967946407. At context masses(.5,.5), the joint becomes(.45,.05),(.25,.25), so the correct answer really is .7344977967946407. At(1,0), use(.9,.1),(0,0), giving .4689955935892812. A zero row has no conditional distribution; skipping its zero contribution avoids dividing by zero. Reconstructing each original cell as context mass times its conditional value checks the normalization step.

</details>

### 6. Evaluate confidence with a consistent denominator

On six shared binary test cases, C's correct-label probabilities are (0.9,0.9,0.9,0.9,0.4,0.4). D's are (0.6,0.6,0.6,0.6,0.6,0.01). Calculate accuracy and mean log loss. Which wins each measure, and what additional claim would this small test not justify?

A separate language example has one scored token with total loss 0 nats and nine scored tokens with total loss 9 nats. Find the token-weighted mean and perplexity; explain why averaging the two sentence perplexities differs.

<details><summary>Optional hint</summary>

Use all six correct-label probabilities. Model C has four probabilities above 0.5, while D has five.

</details>

<details><summary>Worked solution and reasoning</summary>

C has accuracy 4/6 and mean loss −[4ln0.9+2ln0.4]/6≈0.375671 nats. D has accuracy 5/6 and mean loss −[5ln0.6+ln0.01]/6≈1.193216 nats. D wins accuracy but loses log loss because its lone error is extremely confident. The difference does not certify fairness, calibration or performance after distribution shift. A defensible comparison states the same six cases, binary threshold/no ties, arithmetic mean over cases and the decision objective.

The total loss is 9 over 10 tokens, so the mean is .9 nats and perplexity exp(.9). Sentence perplexities are 1 and e. Their mean(1+e)/2 weights sentences equally and applies a nonlinear transformation before aggregation. The intended token-weighted score must pool total loss and count first. Different tokenization would change the unit and require a new comparison.

</details>

### 7. Compute an extreme but finite log loss

Scores are (800,0,−800), and the last class occurs. Calculate the stable loss and explain why adding −700 to every score changes nothing. Give both an ordinary-score acceptance case and an underflow case for an implementation test.

Write stable_loss(logits,target) without taking log of a separately computed softmax. Check(0,−1000,−2000), target 2 and a common+1000 shift. Repair wrong class-axis and unnormalized-soft-target use separately.

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

Both extreme cases give 2000 nats. The ordinary vector(1000,998,996),target 2 gives 4.142931628499899. The result avoids log of a rounded zero. This compact helper assumes the shifted differences are representable; arbitrary opposing floating extremes need a separately defined numerical range. For a batch(N,C), normalize across classes, not examples. A soft-target row must be finite, nonnegative and sum to one; passing(2,1,0) as though already normalized changes the score. A library that silently accepts it does not validate the intended statistical meaning.

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

Independently implement the feasible three-count slice for a general mean. Use mean 6/5 and both exact endpoints; reject t=.1 and mean 2.1. Explain why normalizing an arbitrary vector is insufficient.

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

For mean 6/5, the interval is[1/5,3/5]. Its endpoints are(0,4/5,1/5) and(2/5,0,3/5); both sum to one and have mean 6/5. Use strings or Fraction values for intended rational/decimal input. At mean 0 or 2 the interval collapses to one vertex. At 10/7 it reproduces[3/7,5/7]. Normalization alone enforces only the sum; it can change the mean. Feasibility is still not optimality: the earlier KL certificate establishes the entropy comparison.

</details>

### 10. Distinguish independent choices from a copied bit

Let X be a fair bit. In one experiment Y is an independent fair bit; in another Y=X. Find the probability and surprise of the pair(1,1), using the correct conditional factor in each experiment. Is adding the two marginal surprises always correct?

<details><summary>Optional hint</summary>

The first factor P(X=1) is .5 in both experiments; the second factor is P(Y=1|X=1).

</details>

<details><summary>Worked solution and reasoning</summary>

Independence gives .5×.5=.25 and 2 bits. Copying gives .5×1=.5 and 1 bit. Marginal Y is fair in both cases, but its conditional surprise after observing X changes from 1 to 0. Adding marginal surprises implicitly assumes the independent factorization. The logarithm product identity is unchanged; the probability supplied to it must match the process.

</details>

### 11. Repair a block-length construction

A routine floors the ideal information of each block and divides lengths by n before checking prefix feasibility. For Bernoulli P(1)=1/4 and n=2, repair the construction, find the expected per-symbol length, and expose the floor bug. Use an exact dyadic probability as an additional boundary check.

<details><summary>Optional hint</summary>

The four block probabilities are(9/16,3/16,3/16,1/16). Integer lengths belong to whole codewords. The capacity sum isΣ2⁻ˡ.

</details>

<details><summary>Worked solution and reasoning</summary>

Ceiling lengths are(1,3,3,4), with Kraft sum 13/16. Their source-weighted expected block length is 31/16 bits, so the per-symbol rate is 31/32. Floored lengths(0,2,2,4) have Kraft sum 25/16>1 and cannot form a prefix code. Divide the expected block cost by 2 after constructing integer lengths.

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

The strict comparison means probability 1/8 returns exactly 3, not 4. A fair one-bit source gives one-bit lengths. This simple exact loop makes the rounding boundary inspectable; it is not a claim of scalable block compression. The original programme's enumeration cost grows exponentially with block length.

</details>

### 12. Decide which KL argument is valid

Prove the equality condition in the finite KL bound when P has zero entries. Then assess three claims: “uniform entropy is largest even when the alphabet changes”; “a symmetric divergence must use distance between labels”; and “if P=Q has infinite entropy, KL is infinity minus infinity.” Give a correction for each.

<details><summary>Optional hint</summary>

Track both the rowwise log inequality and any Q mass outside P's support. The ratio definition is more fundamental than subtracting separately divergent quantities.

</details>

<details><summary>Worked solution and reasoning</summary>

Equality in every positive-P row requires Q=P there, and equality in 1−Q(S)≥0 requires no Q mass outside S. Hence the entire distributions agree. Uniform maximizes entropy on a fixed finite alphabet; log m changes when m changes. Symmetry concerns exchanging arguments, not geometric distances between category labels: Jensen–Shannon is a counterexample to that inference. For P=Q, the supported log ratio is zero and KL=0 even if both separate entropies diverge. The tail law proportional to 1/[k(ln k)²] shows that finite total mass can coexist with infinite entropy. Neither an undefined subtraction nor a finite truncation proves the general ratio result.

</details>

### 13. Repair the library boundary

An array has shape(2,3), with rows(1000,998,996) and(0,−1000,−2000). The observed classes are 0and2. A routine applies softmax across the two examples, passes those results into cross_entropy, and uses target array(2,1,0) as a soft row. Identify each change needed. Explain which mean formula would have to be reconsidered if class weights or ignored labels were added.

<details><summary>Optional hint</summary>

Classes occupy the second axis. The loss expects raw logits. A valid probability target is different from an arbitrary weight vector.

</details>

<details><summary>Worked solution and reasoning</summary>

Supply the original logits directly with class indices of shape(2,) and integer dtype. The correct class-index losses are approximately(.142932,2000), giving arithmetic mean 1000.071466 for this unweighted, unignored fixture. To inspect log probabilities separately use log_softmax with class dimension 1. The malformed soft row sums 3; if it was meant as explicit weights, deliberately normalize to(2/3,1/3,0) and state that target, otherwise reject it. Do not normalize examples against one another. Class weights and ignored labels change the loss/reduction contract; derive the denominator from the chosen API rather than retaining the ordinary two-row mean blindly.

</details>

### 14. Trace an observed prediction without refitting on test labels

Using the supplied penguin counts, find the island model's probability for an Adelie record on Biscoe, trained on 2007–2008 with additive count 1. Explain why its test-island loss uses 60 records and the final mean uses 120. Reconstruct the conditional entropy-plus-KL total. Then consider changing the smoothing strength to .5 after choosing it by the 2009score: what role does that score now play?

<details><summary>Optional hint</summary>

Biscoe training counts are(28,0,80). Its held-out counts are(16,0,44). The other held-out island sizes are 44and16.

</details>

<details><summary>Worked solution and reasoning</summary>

The Biscoe model is(29,1,81)/111, so Adelie probability is 29/111 and its bit loss is−log₂(29/111). The mean within Biscoe averages its 16 Adelie and 44 Gentoo rows over 60. That mean then receives weight 60/120, while Dream and Torgersen receive 44/120and16/120. With the declared fitted model, the final descriptive empirical H,CE,KL are(.782798115,.805893591,.023095476) bits. These quantities use the same 120 records and sum correctly. A model fitted to the test histograms would answer a different question.

After selecting alpha using 2009scores, that year is development information; it is no longer an untouched comparison for that selection procedure. Refitting with alpha .5would change the Biscoe probabilities to(28.5,.5,80.5)/109.5. Its new score should be computed and identified as a new selected model, not called the previous held-out result. The sampling design still does not establish a random Antarctic population or a causal effect of island.

</details>


## What you should now be able to do

Choose a fresh four-outcome law and explain each weighted entropy contribution, then trace a new message through a prefix tree. Compare the cost under a different prediction law, diagnose a missing-support state and prove why the total KL cannot be negative. These are the core checks behind practice 1–4 and 10–12.

For conditional predictions, reconstruct joint probabilities from context masses and normalized rows, and show why unequal row costs need the actual context weights. Compute a stable log loss from raw logits and explain the library's class axis and reduction. Use the same observations and denominator when comparing log scores or perplexity. Practice 5–7 and 13–14 ask you to repair those operations independently.

For the deeper branch, keep a physical event fixed while changing measurement units, distinguish an atomic empirical law from a density model, and use a feasible moment slice plus a KL certificate to establish a global entropy maximum. Practice 8–9 test those distinctions. If a step is unclear, return to its drawing and trace one row, branch or probability point before repeating the equation.

## Further learning

- [Cover and Thomas, chapter2](https://sites.stat.columbia.edu/liam/teaching/neurostat-spr11/papers/EM/Cover%26Thomas-Ch2.pdf) offers another sustained written explanation. Start with §§2.1–2.3 for entropy, conditioning and divergence, then §2.6 for inequalities. Its binary-question example connects directly to the four symbols here.
- [MIT6.02: Overview, information and entropy](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/resources/lecture-1-overview-information-and-entropy/) supplies George Verghese's lecture and companion material. Use it for a slower spoken route through surprise and coding. The companion slides were assessed for fit; the entire recording has not been reviewed for this lesson.
- [MIT6.441, chapter1](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/2243edffb30f57181ed97dcb77691580_MIT6_441S16_chapter_1.pdf) is a more compressed graduate treatment. Read §§1.1–1.3 after the examples to connect finite sums, general measures and differential entropy.
- [The earlier Greedy Algorithms lesson](/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code) develops the actual efficient Huffman heap/tree construction and exchange argument. It complements the fixed codebook here; a ceiling-length bound is not a Huffman implementation.

## Technical references

- [MIT6.441, chapter6](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/67d8e68cd8fda55366e3f9f0a9465c17_MIT6_441S16_chapter_6.pdf): prefix versus uniquely decodable codes, Kraft capacity and the entropy coding bound.
- [Shannon, A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf): the original source/communication formulation; §6 develops weighted grouping of choices. It measures probabilistic alternatives rather than the semantic importance of a message.
- [Stanford CS229, Maximum Entropy and Exponential Families](https://cs229.stanford.edu/notes-spring2019/MaxEnt.pdf): the finite interior exponential form. Keep nonnegative probabilities and boundary means explicit; an affine constraint alone does not make every parameter feasible.
- [SciPy entropy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.entropy.html): base, axis and automatic normalization, including the distinction between entropy and KL. The new programmes above identify their actual SciPy 1.18.1 execution environment.
- [PyTorch CrossEntropyLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html): raw logits, class indices and probability targets, shapes and reduction. [BCEWithLogitsLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BCEWithLogitsLoss.html) is the corresponding stable single-logit binary interface, with a different input contract.
- [Palmerpenguins documentation](https://allisonhorst.github.io/palmerpenguins/) identifies the CC 0 dataset maintained by Allison Horst, Alison Hill and Kristen Gorman, with original collection by Gorman and PalmerStationLTER. [Gorman, Williams and Fraser's ecological study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) explains the sampling and scientific question. The local CSV is pinned to the supplied 344 records; our year-split prediction exercise answers a different question from that study.

## Next: what does an observation tell us about another variable?

Conditional entropy already compares uncertainty before and after a context is known. [Mutual Information & Information Bottleneck](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations) turns that reduction into a measure of dependence, then asks which details a representation can discard while retaining information relevant to a task. Keep the joint table, its normalized conditional rows and their actual weights in view: they are the objects behind the next formulas.
