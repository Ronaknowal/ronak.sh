# Rate-Distortion Theory

A remote sensor has more readings than it can transmit. Discarding readings saves bits, but a useful compressor must preserve the distinctions its receiver needs. We will first send an actual message, then ask how close its error and rate are to a mathematical limit. The last step is to count complete bytes and compare reconstructed measurements with their originals.

The prerequisites are weighted averages, logarithms, probability tables, [entropy](/learn/path/full-curriculum/entropy-cross-entropy-kl-divergence?module=math-foundations) and [mutual information](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations). We refresh conditional tables and teach the optimization steps here. The Gaussian extension also uses the orthogonal eigenvectors from [Eigenvalues and Eigenvectors](/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations). No compression library or prior codec implementation is assumed.

The reading route follows nine questions: send an index; define the error budget; derive a binary limit; interpret long-block coding; compute a finite reconstruction rule; allocate Gaussian error; choose what must survive; create a bitstream; and practise the decision. Sections marked Deeper remain visible and supply proofs or extensions after the basic mechanism.

## 1. Send an index and reconstruct a block

A sensor reports three bits, `011`. Suppose the receiver has agreed to reconstruct only `000` or `111`. Follow the source positions through the choice and the transmitted message.

[[D01]]

These two allowed outputs form a **codebook**. The encoder compares the input with each output: `000` changes two positions, whereas `111` changes one. It sends index `1`, meaning the second entry. The decoder looks up that entry and produces three bits, `111`. The one-bit index and the three reconstructed bits are different objects, even though both contain the character `1`.

The receiver cannot recover the first source bit. That distinction was deliberately lost. Which other inputs become indistinguishable at the receiver?

[[D02]]

Inputs `000`, `001`, `010` and `100` choose index 0. Inputs `011`, `101`, `110` and `111` choose index 1. Each group is a **preimage** of the selected reconstruction: several originals share the same transmitted description. The grouping diagram is a list of assignments, not a distance-preserving map of binary strings. Bit 0 stays amber and bit 1 stays blue; outlined destination markers identify codebook entries independently of bit values. A white outline selects a row. Error ticks identify changed positions without recolouring every 1 as an error.

Now count mistakes using the probability of each source word.

[[D03]]

For independent fair source bits, all eight words have probability 1/8. Two words have no mistakes and six have one. The expected fraction of wrong source positions is

$$D_{\rm code}=\frac{2\cdot0+6\cdot1}{8\cdot3}=\frac14.$$

An individual block has error 0 or 1/3, so the worst block error is 1/3. The average .25 is not a promise about each block. If each bit is 1 with probability p, a word containing k ones instead has probability pᵏ(1−p)³⁻ᵏ. The investigation uses those weights after you edit p. At p=0 or p=1, only one source word has positive probability; impossible words do not determine the worst error under that source.

You can change the allowed codebook and inspect the resulting assignments immediately. Emptying the codebook is invalid: a decoder needs an allowed reconstruction. The last valid experiment remains visible with an explanation. Reset restores `000`/`111`, fair bits and selected word `011`.

Codebook size determines the width of a fixed binary index.

[[D04]]

With M allowed reconstructions, a fixed binary index needs ⌈log₂M⌉ bits. Two entries need one bit; three entries need two bits, leaving one of the four binary addresses unused. For a block of n source symbols, the transmitted fixed-width rate is ⌈log₂M⌉/n bits per source symbol. Information-theoretic block-code statements often use log₂M/n as their cardinality rate. These coincide for powers of two; the rounding difference is less than one bit per block.

Our two-entry, three-bit code has rate 1/3 bit per source bit. This count assumes that the codebook and block boundaries are shared. Section 8 adds an explicit file header and shows how it changes the count.

The following complete programme enumerates the eight inputs. `min` compares mismatch counts and resolves a tie by the first index in the fixed order. `decode` is a lookup: it does not have access to the original word. The printed rows are the entire fair-source experiment, not a random sample.

File: `rd_blockCode.py`

```python
from itertools import product
from math import ceil, log2

codebook = ("000", "111")


def encode(word):
    return min(
        range(len(codebook)),
        key=lambda index: sum(a != b for a, b in zip(word, codebook[index])),
    )


def decode(index):
    return codebook[index]


total_errors = 0
for bits in product("01", repeat=3):
    word = "".join(bits)
    index = encode(word)
    restored = decode(index)
    errors = sum(a != b for a, b in zip(word, restored))
    total_errors += errors
    print(word, "->", index, "->", restored, "errors", errors)

print("bits per source bit:", round(ceil(log2(len(codebook))) / 3, 6))
print("expected error fraction:", total_errors / (8 * 3))
print("worst block error fraction:", round(1 / 3, 6))
```

Output:

```text
000 -> 0 -> 000 errors 0
001 -> 0 -> 000 errors 1
010 -> 0 -> 000 errors 1
011 -> 1 -> 111 errors 1
100 -> 0 -> 000 errors 1
101 -> 1 -> 111 errors 1
110 -> 1 -> 111 errors 1
111 -> 1 -> 111 errors 0
bits per source bit: 0.333333
expected error fraction: 0.25
worst block error fraction: 0.333333
```

For a known length-n binary source, enumerating all words and M reconstructions costs O(2ⁿMn) comparisons. This tiny exact calculation is easy to inspect, but its exponential source enumeration cannot be the implementation strategy for large blocks. Python's iteration, strings and integers are sufficient tools here; a numerical library would not remove that growth.

## 2. Define the budget before the bound

The same pair of values can count as a small error under one criterion and a serious error under another. First specify what the reconstruction is supposed to preserve.

[[D05]]

A **source** X is the random object being represented; X̂, pronounced “X hat,” is its reconstruction. A **distortion function** d(x,x̂) assigns a nonnegative cost to that pair. Binary Hamming distortion gives 0 for a match and 1 for a mismatch. Squared error gives (x−x̂)², so an error of 2 costs four times an error of 1. An alarm criterion can give a missed alarm a much larger cost than a false alarm. Such a cost need not be symmetric or satisfy the triangle inequality. Calling it distortion does not make it a mathematical distance.

The probability of a pair determines how much its cost contributes to an average.

[[D06]]

Write pᵢ for source probability, qⱼ|ᵢ for the probability of reconstruction j conditional on source i, and dᵢⱼ for their cost. The pair has probability pᵢqⱼ|ᵢ and contributes pᵢqⱼ|ᵢdᵢⱼ to expected distortion. Summing all cells gives D(q). The cost table is not a probability table: its rows need not sum to one.

If alarms occur with probability .01 and the decoder always emits 0, ordinary Hamming distortion is .01. Conditional on an alarm, however, it misses with probability 1. Assigning each missed alarm cost 100 changes expected cost to 1 without changing any reconstruction. The original average criterion did not preserve rare alarms; changing a cost explicitly changes the question.

**Check your interpretation.** Does overall Hamming error below 2% certify that those alarms survive? No. The zero-message rule meets the average budget and misses every alarm. An essential conditional or worst-case guarantee needs its own constraint and evaluation.

To search for a limit, allow every possible reconstruction distribution for each source value.

[[D07]]

This row-normalized table q is a **test channel**. It describes which source distinctions survive; it need not be a physical noisy link. It is also not yet an encoder emitting bytes. For p(X=1)=.2, the symmetric forward-flip rule has rows (.9,.1) and (.1,.9). Multiplying them by source probabilities .8/.2 gives joint rows (.72,.08) and (.02,.18). Column sums are .74/.26 and the off-diagonal distortion is .1. We have constructed one feasible rule, without asserting it is best.

In general,

$$P_{ij}=p_iq_{j|i},\qquad r_j=\sum_i p_iq_{j|i},\qquad D(q)=\sum_{i,j}p_iq_{j|i}d_{ij}.$$

The previous lesson expressed **mutual information** as the KL divergence between a joint law and the product of its marginals. Cancelling pᵢ inside that ratio gives

$$I(q)=\sum_{i,j}p_iq_{j|i}\log_2\frac{q_{j|i}}{r_j}.$$

A zero-probability pair contributes zero. Whenever pᵢqⱼ|ᵢ is positive, its column marginal rⱼ is positive too, so that cell does not divide by zero. Source rows with pᵢ=0 have no effect on the objective.

Hold the source and cost fixed, then admit only channels inside the error budget.

[[D08]]

The **information rate-distortion function** is

$$R(D)=\min_{q:\,D(q)\le D} I(q).$$

For finite alphabets it chooses the least retained information among the feasible reconstruction rules. Raising D moves the budget boundary right and admits more channels. A minimum over that larger set cannot rise. R(D) is also nonnegative. Unlike the fixed-marginal problem in [Optimal Transport](/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations), the output marginal r is generally chosen here along with the pairing.

The information minimum becomes an operational coding limit under the assumptions in section 4. First identify the easy endpoints: impossible distortion and reconstruction without a message.

[[D09]]

Even with complete source knowledge, the least expected cost on the declared reconstruction alphabet is

$$D_{\min}=\sum_i p_i\min_j d_{ij}.$$

Below that floor there is no feasible channel. At the other end, no message means that the output law is independent of X: every positive-probability source row uses the same law. An independent mixture of constant outputs has a cost equal to the corresponding mixture of their costs, so it cannot improve on the cheapest constant. Thus

$$D_{\rm zero}=\min_j\sum_i p_i d_{ij}.$$

For D≥D_zero, R(D)=0. Fair binary Hamming error has threshold .5; if ones occur with probability .1, always outputting 0 reaches zero rate at distortion .1. This is a result about expected cost, not a promise to retain every event. These two endpoints also show why the source law, reconstruction alphabet and distortion criterion must be stated together.

## 3. Derive the binary frontier

For a binary source with P(X=1)=p, let H_b(p)=−p log₂p−(1−p)log₂(1−p), using the limit 0 log 0=0. Let E=X xor X̂ identify a mismatch. Knowing the reconstruction and the error bit recovers the source bit.

[[D10]]

Given X̂, describing X is equivalent to describing E. If the actual mismatch probability is d, then

$$H(X\mid\hat X)=H(E\mid\hat X)\le H(E)=H_b(d).$$

Consequently I(X;X̂)≥H_b(p)−H_b(d). For a budget 0≤D≤min(p,1−p), every feasible d≤D lies in [0,.5], where H_b is increasing. Replacing H_b(d) by H_b(D) gives a bound valid for all feasible channels. A bound alone does not establish the minimum; we need a channel attaining it.

Construct the variables in the reverse direction: choose a reconstruction first, add independent binary error, and check that the resulting source has the right probability.

[[D11]]

Draw X̂∼Bernoulli(r), independently draw E∼Bernoulli(D), and set X=X̂ xor E. Now H(E|X̂)=H(E), making the uncertainty bound tight. To get P(X=1)=p, solve

$$p=r(1-D)+(1-r)D,\qquad r=\frac{p-D}{1-2D}.$$

For 0≤D<min(p,1−p), the denominator is positive and r lies in [0,1]. At or beyond the zero-rate threshold, use the most-probable constant directly. This avoids the undefined expression at p=D=.5; deterministic p=0 or 1 sources are also handled by their constant. A budget beyond the threshold permits that constant's smaller actual error; the budget need not be spent exactly.

Turn the backward branches into a joint table before reading forward errors.

[[D12]]

With p=.2 and D=.1, r=.125. The joint table, with source rows 0/1 and reconstruction columns 0/1, is

$$P=\begin{pmatrix}.7875&.0125\\.0875&.1125\end{pmatrix}.$$

Its row sums are .8/.2; its column sums are .875/.125. The mismatch cells add to .1. To condition forward, divide each cell by its source row sum. The false-positive probability is .0125/.8=.015625, while the false-negative probability is .0875/.2=.4375. They are not equal. Section 2's symmetric forward-flip table had the same source and total distortion but a different retained-information cost. “Independent error” must say independent of which variable. These arrows describe probability constructions, not causes.

The live table highlights one branch, joint cell and conditional normalization together. Edit p and the budget to compare the fair-source symmetry with a biased source. A zero-mass source row has no defined conditional error under the observed law and is labelled unavailable, rather than displaying 0/0.

The complete programme below deliberately computes the interior fixture p=.2, D=.1. Its divisions are valid for that fixture. It is not a general endpoint-handling API; the preceding construction and investigation supply those cases.

File: `rd_biasedChannel.py`

```python
from math import log2

p, distortion = 0.2, 0.1
output_one = (p - distortion) / (1 - 2 * distortion)
joint = [
    [(1 - output_one) * (1 - distortion), output_one * distortion],
    [(1 - output_one) * distortion, output_one * (1 - distortion)],
]
source = [sum(row) for row in joint]
output = [sum(row[j] for row in joint) for j in range(2)]
information = sum(
    joint[i][j] * log2(joint[i][j] / (source[i] * output[j]))
    for i in range(2)
    for j in range(2)
    if joint[i][j]
)
print("joint:", [[round(v, 4) for v in row] for row in joint])
print("source:", [round(v, 4) for v in source])
print("output:", [round(v, 4) for v in output])
print("false positive:", round(joint[0][1] / source[0], 6))
print("false negative:", round(joint[1][0] / source[1], 6))
print("distortion:", round(joint[0][1] + joint[1][0], 6))
print("information bits:", round(information, 6))
```

Output:

```text
joint: [[0.7875, 0.0125], [0.0875, 0.1125]]
source: [0.8, 0.2]
output: [0.875, 0.125]
false positive: 0.015625
false negative: 0.4375
distortion: 0.1
information bits: 0.252933
```

The bound and attaining construction determine the complete binary frontier.

[[D13]]

$$R(D)=\begin{cases}H_b(p)-H_b(D),&0\le D<\min(p,1-p),\\0,&D\ge\min(p,1-p).\end{cases}$$

For fair bits, D=.1 requires approximately .531 bits per source bit; D=.25 gives approximately .189. Our finite three-bit code sits at (.25,1/3), above the asymptotic frontier. The gap concerns that particular code, not a failure of the bound. Both degenerate sources p=0 and p=1 need zero rate at any nonnegative budget.

This small original programme evaluates the fair curved branch only at budgets between 0 and .5. Keep that domain when using it: beyond .5, binary entropy decreases again and `max(0, 1-H_b(D))` would incorrectly rise. The feasible constant still exists, so the true rate stays zero. Practice 2 implements the full piecewise rule.

File: `rd_originalBinary.py`

```python
import math

def binary_entropy(d):
    if d in (0, 1):
        return 0.0
    return -(d * math.log2(d) + (1 - d) * math.log2(1 - d))

for distortion in (0.0, 0.10, 0.25, 0.50):
    rate = max(0.0, 1 - binary_entropy(distortion))
    print(distortion, round(rate, 3))
```

Output:

```text
0.0 1.0
0.1 0.531
0.25 0.189
0.5 0.0
```

An engineer can choose a price λ for distortion instead of choosing a hard budget first. λ has units bits per distortion unit; larger λ makes mistakes more expensive. Geometrically, the objective I+λD fixes a line in the distortion–information plane.

[[D14]]

A line I+λD=c has slope −λ. Slide it down until it supports the convex frontier. For an interior binary point,

$$H_b'(D)=\log_2\frac{1-D}{D},\qquad D_\lambda=\min\left\{\min(p,1-p),\frac1{1+2^\lambda}\right\}.$$

Fair bits at λ=2 give D=.2. The selected budget and the optimizing distortion have separate labelled markers: editing a budget does not make that choice automatically optimal for the current λ. At λ=0, every feasible zero-rate point minimizes the objective; the display chooses the smallest distortion reaching zero rate. Corners can have an interval of supporting slopes, and a straight frontier segment can have several minimizing operating points. A derivative alone does not identify one unique channel in those cases.

Changing the distortion unit to D_new=100D requires λ_new=λ/100 to preserve the same objective. This rescaling is separate from converting natural logarithms to bits.

## 4. Explain what long blocks can achieve

The information minimum describes a limit. To see why its endpoint needs care, consider biased bits with p=.1 and an exact, fixed-width code for ten source bits.

[[D15]]

All 2¹⁰=1024 strings have positive probability, even though most ones are rare. Exact zero Hamming error requires a distinct reconstruction for each string, so a finite fixed-width description still needs at least ten bits. Yet H_b(.1)<1. There is no contradiction: the limiting boundary R(0)=H_b(.1) can be approached by fixed-rate codes whose permitted error tends to zero as block length grows. It is not the finite exact-zero-error requirement. Variable-length lossless coding instead approaches entropy in expected length by using longer descriptions for rare strings. Rate convention, error criterion and order of limits all matter.

For a general finite block code, trace every route by which source information can reach the receiver.

[[D16]]

An encoder maps Xⁿ to an index J among M possibilities; a deterministic decoder maps J to X̂ⁿ. Data processing and index entropy give

$$\log_2M\ge H(J)\ge I(X^n;J)\ge I(X^n;\hat X^n).$$

For independent source symbols, H(Xⁿ)=ΣH(Xᵢ). Conditional entropy satisfies H(Xⁿ|X̂ⁿ)≤ΣH(Xᵢ|X̂ᵢ), because each term can discard some conditioning information to increase entropy. Subtracting yields

$$I(X^n;\hat X^n)\ge\sum_i I(X_i;\hat X_i)\ge\sum_iR(D_i).$$

Here Dᵢ is the expected distortion at coordinate i. Its actual joint distribution is one feasible candidate in the corresponding minimum. To combine the coordinates' different budgets, we also need convexity.

Mixing channels and time-sharing block codes are related operations with different equalities.

[[D17]]

With a fixed source, mutual information is convex in the conditional table. One proof writes it as KL(P_Xq || P_Xr_q); joint convexity of KL applies because both the joint and product-reference arrays mix linearly when q mixes. A rowwise mixture q=αq₁+(1−α)q₂ therefore has exactly the weighted average distortion and at most the weighted average information. Minimizing gives convexity of R(D).

Operationally, a known schedule can use code 1 on one fraction of blocks and code 2 on the rest. Their total message lengths and total distortions add; their rates and errors approach the corresponding weighted averages. This is **time-sharing**. It does not say the mutual information of a randomly mixed single-letter channel equals the average of the two channel informations.

Jensen's inequality for convex R now gives ΣR(Dᵢ)≥nR(D̄), where D̄=ΣDᵢ/n. If D̄≤D, monotonicity gives R(D̄)≥R(D). Combining the steps proves

$$\frac{\log_2 M}{n}\ge R(D).$$

This is the **converse**: under the stated iid, additive-cost and block-code assumptions, no code beats the bound. A fixed binary index's ceiling width is at least log₂M. Expected-length coding needs its corresponding entropy argument rather than silently using the same physical-length convention.

### Deeper: why a sufficiently large codebook can approach the limit

A converse rules out impossible compression. **Achievability** must also show that codes can approach the remaining boundary. Draw many candidate reconstruction blocks from the marginal law of a good test channel, then let the encoder find one compatible with the source block.

[[D18]]

For finite iid alphabets, a typical source block and an independently generated reconstruction are jointly typical with a probability whose exponential scale is 2⁻ⁿᴵ. Joint typicality means their empirical pair frequencies are close to the chosen joint law; it controls average distortion as well as frequency. The drawn covering regions are conceptual sets, not Euclidean balls with measured volumes.

If one candidate succeeds with probability aₙ, M independent candidates all fail with probability

$$ (1-a_n)^M\le \exp(-Ma_n). $$

Take M about 2ⁿᴿ with R>I and allow small typicality slack. Then Maₙ grows, and the failure probability tends to zero. The encoder sends the index of a compatible candidate. This probability argument shows that some fixed codebooks work, because their average performance is good. It does not provide a computationally cheap search through an exponentially large book.

Rare source blocks and failed searches still contribute to expected error.

[[D19]]

For finite alphabets with bounded distortion d_max, exceptional probability ε contributes at most εd_max. On typical covered blocks, empirical pair frequencies make the mean cost close to the chosen test-channel cost. In **strong typicality**, zero-probability joint cells must remain empty; allowing arbitrary rare counts in those cells would contradict the specified support. These two controls complete the intuition behind the finite-alphabet achievability proof.

Unbounded distortion needs additional integrability or tail control. Tiny failure probability alone cannot bound the expectation if failures can have arbitrarily large cost. Standard memoryless source-coding statements assume an appropriate finite expected cost for some reconstruction and treat attainable interior budgets before taking limits. With those qualifications, the operational asymptotic rate equals the information minimum: sufficiently long blocks approach the frontier with arbitrarily small slack. Neither the theorem nor the drawings promise that every finite block attains the exact limiting pair.

## 5. Compute a finite reconstruction rule

The binary answer had a closed form. Most source and distortion choices do not. Start instead with a finite list of source values, a finite reconstruction list, their pair costs and a nonnegative distortion price λ.

[[D20]]

The source vector p and cost array d are fixed. We choose each probability row of q; its induced output vector is r_q=pq. The objective is J(q)=I_bits(q)+λD(q). With the source, costs and alphabets fixed, this is convex in the full conditional table q. A neural parameterization need not preserve that convex optimization structure. The general information-bottleneck problem also differs: its predictive distortion depends on other changing distributions, rather than this one fixed cost matrix.

A useful iteration begins from an output guess r. A reconstruction should receive more probability when it is already common and when its distortion for the current source value is low. Trace those two factors before normalizing.

[[D21]]

For fair bits, Hamming costs and λ=2, start with r=(.5,.5). On source row 0, the unnormalized weights are (.5×2⁰,.5×2⁻²)=(.5,.125). Their sum is .625, giving row (.8,.2). Source row 1 gives (.2,.8). In general,

$$q_{j|i}^{t+1}=\frac{r_j^t2^{-\lambda d_{ij}}}{\sum_k r_k^t2^{-\lambda d_{ik}}}.$$

Each row is a distribution over reconstructions, not a distribution over source values. The source weights enter the second operation: rebuild the output marginal from all rows.

[[D22]]

Multiply row i by pᵢ and sum each column. For the fair example, r¹=(.5,.5) again. Label the timing explicitly: old rᵗ generated qᵗ⁺¹, while new rᵗ⁺¹ is the marginal induced by that q. The current mutual information must use the new induced marginal. Using the old guess in its denominator adds an extra KL term and changes the reported objective.

Repeating row normalization and marginal rebuilding is the rate-distortion form of the **Blahut–Arimoto algorithm**. The investigation lets you inspect successive cached states, go back, and change the declared initialization or problem. Its starting panel distinguishes the initial marginal from the first resulting channel; an iteration number is not a convergence proof.

### Deeper: derive the updates and the objective decrease

An auxiliary distribution r separates the coupled channel problem into operations that each have an exact minimizer.

[[D23]]

Use natural logarithms inside the calculation, with s=λ ln 2. Define

$$\mathcal J(q,r)=\sum_{i,j}p_iq_{j|i}\left(\ln\frac{q_{j|i}}{r_j}+s d_{ij}\right).$$

Insert and subtract ln r_q,j inside the ratio. Summing over source rows gives

$$\mathcal J(q,r)=I_{\rm nats}(q)+sD(q)+D_{\rm KL}(r_q\Vert r).$$

For fixed q, the best r is its induced marginal, making the last term zero. For fixed positive r, minimize one row with a multiplier enforcing Σⱼqⱼ|ᵢ=1. Differentiating gives ln(qⱼ|ᵢ/rⱼ)+1+sdᵢⱼ+constant=0. Exponentiating and normalizing yields qⱼ|ᵢ=rⱼexp(−sdᵢⱼ)/Zᵢ, with Zᵢ=Σⱼrⱼexp(−sdᵢⱼ). This is the earlier base-2 formula. Each operation minimizes the same auxiliary objective over one argument, explaining descent. At zero source weight a row is irrelevant; the examples use strictly positive source probabilities.

An exact zero in the output guess removes an entire reconstruction from every row.

[[D24]]

If rⱼ=0, the numerator stays zero and marginal rebuilding cannot revive that column. For fair bits and λ=2, a start r=(1,0) gives a constant output: D=.5, I=0 and J=1. The positive start gives D=.2, I≈.278072 and J≈.678072. The zero-supported state is perfectly still and still worse. Use a positive start when all reconstructions are meant to participate. An explicit restart can change support; silently inserting an epsilon changes the experiment.

Finite positive weights can also become numerically tiny. Compute normalization through logarithms so that small scale does not turn all weights into zero.

[[D25]]

The row logits are ℓⱼ=ln rⱼ−sdᵢⱼ. If m=maxⱼℓⱼ, then log Σexp ℓ = m+log Σexp(ℓ−m). Subtracting m keeps at least one exponent equal to 1 while preserving ratios. Subtract the log normalizer to get log q, and rebuild marginals using another log-sum-exp. Keep exact absent columns at −∞. A stored log probability and an underflowed display probability can represent different numerical information; calculations should not unnecessarily turn the latter back into a log.

To assess optimality on the whole declared alphabet, examine every reconstruction column, including absent ones.

[[D26]]

Substituting the minimizing q rows into the auxiliary objective gives f(r)=−Σᵢpᵢln Zᵢ. Its derivative with respect to rⱼ is −gⱼ, where

$$g_j=\sum_i\frac{p_i e^{-s d_{ij}}}{Z_i}.$$

Since Σⱼrⱼgⱼ=1, simplex optimality implies gⱼ=1 on active columns and gⱼ≤1 on inactive columns. An absent column with gⱼ>1 offers a direction that can reduce f. Omitting that column from the diagnostic would hide the initialization trap. These conditions refer to this finite convex problem, not to an arbitrary neural model.

The same scores produce a bound on how far the current objective can lie above the best possible objective.

[[D27]]

For any other output law u, Jensen's inequality for the convex function −ln gives

$$\begin{aligned}
f(u)-f(r)&=-\sum_i p_i\ln\frac{Z_i(u)}{Z_i(r)}\\
&\ge-\ln\left(\sum_j u_jg_j\right)\\
&\ge-\ln\max_jg_j.
\end{aligned}$$

The first average uses source probabilities pᵢ. The sum inside the logarithm becomes Σⱼuⱼgⱼ by swapping the finite sums. Since u is a probability law, that sum cannot exceed max g. Therefore the global optimum J* in bits lies between

$$\frac{f(r)-\ln\max_jg_j}{\ln2}\ \le\ J^*\ \le\ I_{\rm bits}(q)+\lambda D(q).$$

The upper endpoint comes from a feasible achieved channel; the lower endpoint covers every output law, even ones using columns absent in r. A negative lower endpoint is allowed and merely loose. The gap brackets the combined objective, not separate uncertainties in I and D. The implementation evaluates this algebra in floating point, so its numerical certificate is not a rigorous interval-arithmetic proof. Positive-support BA converges in the ordinary finite-cost setup, but a finite iteration cap still needs a recorded achieved gap.

The complete scratch implementation keeps log marginals and calculates the all-column bound. Each iteration costs O(AB) for A source values and B reconstructions; working arrays use O(AB) space. Saving T full states adds O(TAB), so the live investigation uses a bounded history. Its two printed experiments expose the positive-start solution and missing-column failure directly.

File: `rd_finiteOptimizer.py`

```python
import math


def logsumexp(values):
    maximum = max(values)
    if maximum == -math.inf:
        return maximum
    return maximum + math.log(sum(math.exp(v - maximum) for v in values))


def solve(source, costs, weight, initial, maximum_steps=5000, tolerance=1e-9):
    # Natural logs inside; weight and returned objectives use bits.
    log_source = [math.log(p) if p else -math.inf for p in source]
    log_output = [math.log(p) if p else -math.inf for p in initial]
    scaled = [[weight * math.log(2) * cost for cost in row] for row in costs]
    columns = len(initial)
    for step in range(maximum_steps + 1):
        normalizers = [
            logsumexp([log_output[j] - cost for j, cost in enumerate(row)])
            for row in scaled
        ]
        log_channel = [
            [log_output[j] - cost - normalizers[i] for j, cost in enumerate(row)]
            for i, row in enumerate(scaled)
        ]
        channel = [[math.exp(v) for v in row] for row in log_channel]
        log_marginal = [
            logsumexp([log_source[i] + log_channel[i][j] for i in range(len(source))])
            for j in range(columns)
        ]
        distortion = information = 0.0
        for i, p in enumerate(source):
            for j, conditional in enumerate(channel[i]):
                mass = p * conditional
                if mass:
                    distortion += mass * costs[i][j]
                    information += (
                        mass * (log_channel[i][j] - log_marginal[j]) / math.log(2)
                    )
        f = -sum(p * z for p, z in zip(source, normalizers))
        log_g = [
            logsumexp(
                [
                    log_source[i] - scaled[i][j] - normalizers[i]
                    for i in range(len(source))
                ]
            )
            for j in range(columns)
        ]
        lower = (f - max(log_g)) / math.log(2)
        upper = information + weight * distortion
        gap = max(0.0, upper - lower)
        if gap <= tolerance or step == maximum_steps:
            return distortion, information, lower, upper, gap
        log_output = log_marginal


for label, initial in (("positive", [0.5, 0.5]), ("missing output", [1.0, 0.0])):
    result = solve([0.5, 0.5], [[0, 1], [1, 0]], 2.0, initial)
    print(label, "D, I, lower, upper, gap:", tuple(round(x, 6) for x in result))
```

Output:

```text
positive D, I, lower, upper, gap: (0.2, 0.278072, 0.678072, 0.678072, 0.0)
missing output D, I, lower, upper, gap: (0.5, 0.0, -0.087463, 1.0, 1.087463)
```

Now express the same operations as array reductions. The axis is part of the mathematics.

[[D28]]

In the library programme, p has shape (A,), costs and q have shape (A,B), and r has shape (B,). `p[:, None] * q` forms the joint table; summing axis 0 produces the output marginal. `logsumexp(..., axis=1)` normalizes each source row over reconstructions. The independent constrained-solver objective uses H(r)−ΣᵢpᵢH(qᵢ), with `xlogy` preserving the limit 0 log 0=0.

The new fixture has source values and reconstruction values 0,1,3, source probabilities (.7,.2,.1), squared cost, λ=1 and a uniform initial marginal. The scalar reference and array route use the same inputs and update timing. A separate SLSQP call minimizes the same convex objective over nine channel entries with three row-sum constraints. Its success flag is checked together with row feasibility and the objective bracket. We compare objective values, not a claim that every minimizing table must be identical.

Save `finite_rd_library.py` beside the supplied `rd_scalar_helpers.py`. That helper contains exactly the three function definitions taught in the scratch programmes, plus `import math`; it has no demonstration loop. Install NumPy and SciPy in your chosen environment, then run `python finite_rd_library.py`. The recorded execution used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1.

The complete imported helper is shown first. It defines the same scalar operations without running their original demonstration loops.

File: `rd_scalar_helpers.py`

```python
import math


def logsumexp(values):
    maximum = max(values)
    if maximum == -math.inf:
        return maximum
    return maximum + math.log(sum(math.exp(v - maximum) for v in values))


def solve(source, costs, weight, initial, maximum_steps=5000, tolerance=1e-9):
    # Natural logs inside; weight and returned objectives use bits.
    log_source = [math.log(p) if p else -math.inf for p in source]
    log_output = [math.log(p) if p else -math.inf for p in initial]
    scaled = [[weight * math.log(2) * cost for cost in row] for row in costs]
    columns = len(initial)
    for step in range(maximum_steps + 1):
        normalizers = [
            logsumexp([log_output[j] - cost for j, cost in enumerate(row)])
            for row in scaled
        ]
        log_channel = [
            [log_output[j] - cost - normalizers[i] for j, cost in enumerate(row)]
            for i, row in enumerate(scaled)
        ]
        channel = [[math.exp(v) for v in row] for row in log_channel]
        log_marginal = [
            logsumexp([log_source[i] + log_channel[i][j] for i in range(len(source))])
            for j in range(columns)
        ]
        distortion = information = 0.0
        for i, p in enumerate(source):
            for j, conditional in enumerate(channel[i]):
                mass = p * conditional
                if mass:
                    distortion += mass * costs[i][j]
                    information += (
                        mass * (log_channel[i][j] - log_marginal[j]) / math.log(2)
                    )
        f = -sum(p * z for p, z in zip(source, normalizers))
        log_g = [
            logsumexp(
                [
                    log_source[i] - scaled[i][j] - normalizers[i]
                    for i in range(len(source))
                ]
            )
            for j in range(columns)
        ]
        lower = (f - max(log_g)) / math.log(2)
        upper = information + weight * distortion
        gap = max(0.0, upper - lower)
        if gap <= tolerance or step == maximum_steps:
            return distortion, information, lower, upper, gap
        log_output = log_marginal


def allocate(variances, budget):
    if not variances or any(not math.isfinite(v) or v < 0 for v in variances):
        raise ValueError("Variances must be finite and nonnegative.")
    if not math.isfinite(budget) or budget < 0:
        raise ValueError("Budget must be finite and nonnegative.")
    total = math.fsum(variances)
    if not math.isfinite(total):
        raise ValueError("Rescale the variances and budget to a finite total.")
    target = min(budget, total)
    if target == 0:
        errors = [0.0] * len(variances)
    elif target == total:
        errors = list(variances)
    else:
        sorted_variances = sorted(variances)
        exhausted = 0.0
        for index, variance in enumerate(sorted_variances):
            if variance == 0:
                continue
            level = (target - exhausted) / (len(variances) - index)
            if level <= variance:
                break
            exhausted += variance
        errors = [min(v, level) for v in variances]
        if level == 0 or abs(math.fsum(errors) / target - 1) > 1e-12:
            raise ValueError(
                "Rescale variances and budget: positive errors are not representable accurately."
            )
    rates = [
        (
            0.5 * (math.log2(v) - math.log2(d))
            if 0 < d < v
            else (math.inf if d == 0 < v else 0.0)
        )
        for v, d in zip(variances, errors)
    ]
    return errors, rates

```

File: `finite_rd_library.py`

```python
import math

import numpy as np
from scipy.optimize import minimize
from scipy.special import logsumexp, xlogy

from rd_scalar_helpers import solve as scalar_solve


def update(p, costs, weight, log_r):
    """One channel update; return its induced marginal and objective bounds."""
    scaled = weight * math.log(2) * costs
    log_z = logsumexp(log_r[None, :] - scaled, axis=1)
    log_q = log_r[None, :] - scaled - log_z[:, None]
    q = np.exp(log_q)
    log_marginal = logsumexp(np.log(p)[:, None] + log_q, axis=0)
    joint = p[:, None] * q
    present = joint > 0
    log_ratio = log_q - log_marginal[None, :]
    information = float(np.sum(joint[present] * log_ratio[present]) / math.log(2))
    distortion = float(np.sum(joint * costs))
    f = -float(p @ log_z)
    log_g = logsumexp(np.log(p)[:, None] - scaled - log_z[:, None], axis=0)
    lower = (f - float(np.max(log_g))) / math.log(2)
    upper = information + weight * distortion
    return q, log_marginal, np.array([distortion, information, lower, upper,
                                     max(0.0, upper - lower)])


def objective(flat_q, p, costs, weight):
    q = flat_q.reshape(costs.shape)
    r = p @ q
    # H(output) minus source-weighted H(output | source); xlogy(0,0)=0.
    information = float(np.sum(p[:, None] * xlogy(q, q)) - np.sum(xlogy(r, r)))
    return information / math.log(2) + weight * float(np.sum(p[:, None] * q * costs))


def main():
    values = np.array([0.0, 1.0, 3.0])
    p = np.array([0.7, 0.2, 0.1])
    costs = (values[:, None] - values[None, :]) ** 2
    initial = np.full(3, 1 / 3)
    weight = 1.0
    log_r = np.log(initial)
    q, marginal, first = update(p, costs, weight, log_r)
    scalar_first = scalar_solve(p.tolist(), costs.tolist(), weight, initial.tolist(),
                                maximum_steps=0)
    np.testing.assert_allclose(first, scalar_first, rtol=1e-12, atol=1e-12)
    print("shape p / costs / q", p.shape, costs.shape, q.shape)
    print("first channel", np.round(q, 9).tolist())
    print("first induced marginal", np.round(np.exp(marginal), 9).tolist())
    history = []
    for step in range(5001):
        q, next_log_r, result = update(p, costs, weight, log_r)
        history.append(float(result[3]))
        if result[4] <= 1e-10 or step == 5000:
            break
        log_r = next_log_r
    scalar = scalar_solve(p.tolist(), costs.tolist(), weight, initial.tolist(),
                          maximum_steps=5000, tolerance=1e-10)
    np.testing.assert_allclose(result, scalar, rtol=1e-8, atol=1e-10)
    np.testing.assert_allclose(q.sum(axis=1), 1, atol=1e-12)
    np.testing.assert_allclose(np.exp(next_log_r), p @ q, atol=1e-12)
    assert np.max(np.diff(history)) <= 1e-12
    print("completed marginal updates", step)
    print("D / I / lower / upper / gap", np.round(result, 12).tolist())

    # An independent general constrained solver on the same convex channel problem.
    constraint = {"type": "eq", "fun": lambda flat: flat.reshape(3, 3).sum(axis=1) - 1}
    solution = minimize(objective, np.full(9, 1 / 3), args=(p, costs, weight),
                        method="SLSQP", bounds=[(0.0, 1.0)] * 9,
                        constraints=[constraint], options={"ftol": 1e-12, "maxiter": 1000})
    residual = float(np.max(np.abs(constraint["fun"](solution.x))))
    assert solution.success and residual < 1e-9
    assert result[2] - 1e-8 <= solution.fun <= result[3] + 1e-8
    print("SLSQP success / iterations / row residual", bool(solution.success),
          int(solution.nit), round(residual, 12))
    print("SLSQP objective / BA objective", round(float(solution.fun), 12),
          round(float(result[3]), 12))
    print("SLSQP status", solution.message)


if __name__ == "__main__":
    main()
```

Output:

```text
shape p / costs / q (3,) (3, 3) (3, 3)
first channel [[0.66579974, 0.33289987, 0.00130039], [0.32, 0.64, 0.04], [0.001834862, 0.058715596, 0.939449541]]
first induced marginal [0.530243304, 0.366901469, 0.102855227]
completed marginal updates 168
D / I / lower / upper / gap [0.225056645858, 0.437214546306, 0.662271192075, 0.662271192164, 8.9e-11]
SLSQP success / iterations / row residual True 53 0.0
SLSQP objective / BA objective 0.662271192078 0.662271192164
SLSQP status Optimization terminated successfully
```

The first source row is approximately (.665799740,.332899870,.001300390). The source-weighted new marginal is (.530243304,.366901469,.102855227), not the unweighted average of the three rows. After 168 marginal updates, the achieved D is .225056645858 and I is .437214546306 bits. The objective bracket is [.662271192075,.662271192164], with computed gap about 8.9×10⁻¹¹. SLSQP reports success after 53 iterations, row residual 0 at the displayed precision, and objective .662271192078 inside that bracket. These are results for the stated fixture, rather than universal agreement between solvers.

Varying λ explores supported frontier points. Enlarging the reconstruction alphabet can improve the optimum, but a chosen finite grid does not establish optimality over all possible continuous reconstructions. The quality of the cost function remains an application question after numerical convergence.

## 6. Allocate error for Gaussian data

Now change the source: X is a Gaussian numerical measurement with mean μ and variance v. Variance is an average squared deviation; the visible width of a normal density scales with its standard deviation √v. Begin with v=9, squared-error budget D=2.25 and mean 0.

[[D29]]

The backward construction has independent X̂∼N(0,6.75) and E∼N(0,2.25), then X=X̂+E. Their variances add to 9; their horizontal density widths do not add. The plotted source, reproduction and error have standard deviations 3, √6.75 and 1.5 respectively, and each density has total area one. This is a new numerical source, not the preceding three-level example.

Why does this construction give the best information rate? First bound the uncertainty that remains after reconstruction.

[[D30]]

Let E=X−X̂. Given X̂, translating X by that known amount preserves conditional differential entropy, so h(X|X̂)=h(E|X̂)≤h(E). Among densities with fixed mean and positive variance, the Gaussian maximizes entropy. To check that step, compare an error density with the Gaussian sharing its mean and variance. The Gaussian's negative log density is a constant plus a squared deviation, so its cross-entropy depends only on those moments and equals the Gaussian's entropy. Nonnegative KL then bounds the error density's entropy by that value. Finally Var(E)≤E[E²]≤D.

For 0<D<v, these facts give

$$I(X;\hat X)\ge h(X)-h(E)\ge\frac12\log_2\frac{v}{D}.$$

The entropy derivation applies when its densities and quantities are well-defined; the KL information formulation supplies the corresponding limit interpretation. The backward construction makes both inequalities tight: independent Gaussian error has variance D, and independent reproduction variance v−D gives the required source law. Thus

$$R(D)=\begin{cases}\frac12\log_2(v/D),&0<D<v,\\0,&D\ge v.\end{cases}$$

The ratio uses matching squared units. If v>0, D=0 has infinite ideal information rate for the non-atomic Gaussian source. A computer file already holding finite-precision measurements is a discrete representation and does not have infinite file size. If v=0, the source is constant and its rate is zero even at zero error.

A decoder acts forward from source information, so convert the attaining backward joint law into a forward conditional law.

[[D31]]

The covariance of X̂ and X is v−D. Gaussian conditioning therefore gives

$$\mathbb E[\hat X\mid X=x]=\mu+\left(1-\frac Dv\right)(x-\mu),\qquad
\operatorname{Var}(\hat X\mid X)=D\left(1-\frac Dv\right).$$

At v=9,D=2.25, the rate is 1 bit per measurement and the conditional-mean slope is .75. Selecting x=3 gives mean 2.25 and conditional variance 1.6875; its standard deviation is √1.6875. The complete live investigation appears here, after these quantities have been taught. Edit v, D or x to connect the selected source value with its reconstruction distribution. The earlier three-density picture remains the fixed worked example.

At D=0 the forward reconstruction equals the source; at D=v it is the constant μ. Variance-zero cases use their constant branch. For budgets beyond v the optimal zero-rate channel uses actual error v rather than manufacturing extra noise to spend the entire budget. Adding arbitrary independent noise to X is not this attaining channel: independent error was defined backward with respect to X̂.

A simple scalar compressor need not attain the Gaussian limit. Try sending only the sign of a centred measurement.

[[D32]]

For X∼N(0,v), the best two reconstruction levels for sign groups are their conditional means ±√v√(2/π). The positive conditional mean follows by integrating x times the positive half of the Gaussian density and dividing by probability 1/2. With those levels the remaining MSE is v(1−2/π). At v=9 it is approximately 3.2704, whereas the one-bit Gaussian limit is D=v/4=2.25. The former is an actual scalar rule; the latter is a long-block information limit.

For a finite sample, a related scalar quantizer alternates assignments and means.

[[D33]]

For points 0,1,4,5 and centres 0,4, the initial midpoint is 2. Nearest-centre groups are {0,1} and {4,5}; their means are .5 and 4.5. Updating those representatives moves the boundary to 2.5. This is the one-dimensional Lloyd operation already implemented in [K-Means and Hierarchical Clustering](/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml), including its complete `clustering_lloyd.py` and palette/index example `clustering_quantization.py`. The method decreases its sample squared-error objective but can stop at a local optimum. Its centroids and payload indices do not establish the Shannon frontier.

### Spend a total error budget across components

Suppose one source sample is a vector of independent Gaussian components with variances 9 and 1. We can spend total squared error 3 across both. Visualize the variance of each component as its maximum useful error allowance.

[[D34]]

Once a component's allowed error reaches its variance, reconstructing its mean already uses zero rate. Further error buys no reduction. An unconstrained equal split 1.5/1.5 would waste .5 on the second component. Instead use D₁=2,D₂=1, leaving rate .5 log₂(9/2)≈1.084963 bits per vector.

The hatch represents allocated error, the outlined cap is the component variance, and the unfilled remainder is retained variance. These labels matter: “water” here represents tolerated error, not allocated signal power. A common level capped at each variance gives **reverse water-filling**,

$$D_i=\min(v_i,\theta),\qquad \sum_iD_i=D_{\rm total}.$$

If D_total is at least Σvᵢ, every component is capped and the rate is zero; extra budget remains unused. Total distortion here is the sum over a vector, not its average per coordinate. Total rate is in bits per vector.

The common level follows from equal marginal rate savings among uncapped components.

[[D35]]

Minimize Σᵢ(.5 log₂(vᵢ/Dᵢ)) over positive-rate components, subject to the sum constraint. The derivative is −1/(2 ln 2 Dᵢ). A multiplier for total error therefore makes all uncapped Dᵢ equal. Low-variance components hit their caps first. Zero-variance components are already known and require no bits. At zero total error, any positive-variance continuous component has infinite rate.

The scratch programme sorts variance caps and solves for the active common level algebraically. Computing log₂v−log₂D avoids an unnecessary overflow in v/D. It also checks that a tiny positive budget is represented accurately; silently returning all-zero errors would change a finite rate into infinity. For variances 9/1, the recorded budgets .5,2,3,10 give allocations .25/.25,1/1,2/1,9/1 respectively.

File: `rd_gaussianAllocation.py`

```python
import math


def allocate(variances, budget):
    if not variances or any(not math.isfinite(v) or v < 0 for v in variances):
        raise ValueError("Variances must be finite and nonnegative.")
    if not math.isfinite(budget) or budget < 0:
        raise ValueError("Budget must be finite and nonnegative.")
    total = math.fsum(variances)
    if not math.isfinite(total):
        raise ValueError("Rescale the variances and budget to a finite total.")
    target = min(budget, total)
    if target == 0:
        errors = [0.0] * len(variances)
    elif target == total:
        errors = list(variances)
    else:
        sorted_variances = sorted(variances)
        exhausted = 0.0
        for index, variance in enumerate(sorted_variances):
            if variance == 0:
                continue
            level = (target - exhausted) / (len(variances) - index)
            if level <= variance:
                break
            exhausted += variance
        errors = [min(v, level) for v in variances]
        if level == 0 or abs(math.fsum(errors) / target - 1) > 1e-12:
            raise ValueError(
                "Rescale variances and budget: positive errors are not representable accurately."
            )
    rates = [
        (
            0.5 * (math.log2(v) - math.log2(d))
            if 0 < d < v
            else (math.inf if d == 0 < v else 0.0)
        )
        for v, d in zip(variances, errors)
    ]
    return errors, rates


for budget in (0.5, 2.0, 3.0, 10.0):
    errors, rates = allocate([9.0, 1.0], budget)
    print(
        "budget",
        budget,
        "errors",
        [round(x, 6) for x in errors],
        "total bits",
        round(sum(rates), 6),
    )
```

Output:

```text
budget 0.5 errors [0.25, 0.25] total bits 3.584963
budget 2.0 errors [1.0, 1.0] total bits 1.584963
budget 3.0 errors [2.0, 1.0] total bits 1.084963
budget 10.0 errors [9.0, 1.0] total bits 0.0
```

### Deeper: rotate correlated Gaussian coordinates

Independence was useful for adding component rates. A jointly Gaussian vector can have correlated original coordinates; an orthogonal covariance eigenbasis gives independent transformed Gaussian coordinates.

[[D36]]

For covariance Σ=[[5,4],[4,5]], the directions (1,1)/√2 and (1,−1)/√2 have variances 9 and 1. Write Σ=Q diag(v)Qᵀ and transform a centred sample to Qᵀx. Orthogonal Q preserves summed squared error, so the total budget is unchanged. Apply scalar allocation in those coordinates, then rotate the reconstruction back. A sign reversal of an eigenvector changes coordinate orientation but not the covariance or rate.

Track the error covariance through the same rotation.

[[D37]]

In the high-variance/low-variance ordering, error variances 2/1 give

$$\Sigma_E=Q\operatorname{diag}(2,1)Q^T=\begin{pmatrix}1.5&.5\\.5&1.5\end{pmatrix},\qquad\operatorname{tr}(\Sigma_E)=3.$$

`numpy.linalg.eigh` returns eigenvalues in ascending order and matching eigenvectors as columns. Its arrays therefore pair values 1/9 with errors 1/2. Keeping those pairs together produces the same matrix. The programme checks orthogonality, the eigenpair equation, back-rotated covariance and trace instead of depending on arbitrary eigenvector signs.

For ordinary scales, `brentq` solves Σmin(vᵢ,θ)−D_total=0 on a bracket where the signs differ. The library helper first rescales by the largest variance and declares absolute and relative tolerances. Very small relative budgets use the scratch active-set algebra: an ordinary absolute root tolerance can be larger than the whole budget. Both routes are compared on explicitly declared inputs, including a zero component and a tiny positive budget.

Run this complete programme beside `rd_scalar_helpers.py`, using the same Python/NumPy/SciPy environment as above.

File: `gaussian_rd_library.py`

```python
import math

import numpy as np
from scipy.optimize import brentq

from rd_scalar_helpers import allocate


def root_allocation(variances, budget):
    """Capped root on a unit-scaled variance axis for ordinary positive budgets."""
    v = np.asarray(variances, dtype=float)
    if v.ndim != 1 or v.size == 0 or not np.all(np.isfinite(v)) or np.any(v < 0):
        raise ValueError("Expected a nonempty vector of finite nonnegative variances.")
    if not math.isfinite(budget) or budget < 0:
        raise ValueError("Expected a finite nonnegative total budget.")
    total = math.fsum(v.tolist())
    if not math.isfinite(total):
        raise ValueError("Rescale to a finite total variance.")
    if budget == 0 or budget >= total:
        errors, rates = allocate(v.tolist(), budget)
        return np.array(errors), np.array(rates)
    scale = float(np.max(v))
    target = budget / scale
    if target < 1e-8:
        # An absolute root tolerance can consume a tiny budget; keep the exact
        # active-set algebra used by the scratch route instead.
        errors, rates = allocate(v.tolist(), budget)
        return np.array(errors), np.array(rates)
    scaled = v / scale
    theta = brentq(lambda t: float(np.minimum(scaled, t).sum()) - target,
                   0.0, 1.0, xtol=1e-14, rtol=1e-14)
    errors = scale * np.minimum(scaled, theta)
    rates = np.zeros_like(v)
    active = (errors > 0) & (errors < v)
    rates[active] = 0.5 * (np.log2(v[active]) - np.log2(errors[active]))
    rates[(errors == 0) & (v > 0)] = math.inf
    return errors, rates


def main():
    for variances, budget in [([9.0, 1.0], 3.0), ([4.0, 1.0], 1.5),
                              ([9.0, 0.0, 1.0], 3.0), ([9.0, 1.0], 1e-300)]:
        errors, rates = root_allocation(variances, budget)
        scratch_errors, scratch_rates = allocate(variances, budget)
        np.testing.assert_allclose(errors, scratch_errors, rtol=1e-12, atol=0)
        np.testing.assert_allclose(rates, scratch_rates, rtol=1e-12, atol=1e-12)
        print("variances / budget", variances, budget)
        print("errors / total bits", errors.tolist(), round(float(rates.sum()), 9))

    covariance = np.array([[5.0, 4.0], [4.0, 5.0]])
    eigenvalues, basis = np.linalg.eigh(covariance)  # Ascending values; columns are vectors.
    errors, rates = root_allocation(eigenvalues, 3.0)
    error_covariance = basis @ np.diag(errors) @ basis.T
    np.testing.assert_allclose(basis.T @ basis, np.eye(2), atol=1e-12)
    np.testing.assert_allclose(covariance @ basis, basis * eigenvalues, atol=1e-12)
    np.testing.assert_allclose(error_covariance, [[1.5, 0.5], [0.5, 1.5]], atol=1e-12)
    np.testing.assert_allclose(np.trace(error_covariance), 3, atol=1e-12)
    print("ascending eigenvalues / errors", eigenvalues.tolist(), errors.tolist())
    print("error covariance", np.round(error_covariance, 9).tolist())
    print("trace / total bits", round(float(np.trace(error_covariance)), 9),
          round(float(rates.sum()), 9))


if __name__ == "__main__":
    main()
```

Output:

```text
variances / budget [9.0, 1.0] 3.0
errors / total bits [2.0, 1.0] 1.084962501
variances / budget [4.0, 1.0] 1.5
errors / total bits [0.75, 0.75] 1.415037499
variances / budget [9.0, 0.0, 1.0] 3.0
errors / total bits [2.0, 0.0, 1.0] 1.084962501
variances / budget [9.0, 1.0] 1e-300
errors / total bits [5e-301, 5e-301] 999.163390967
ascending eigenvalues / errors [1.0, 9.0] [1.0, 2.0]
error covariance [[1.5, 0.5], [0.5, 1.5]]
trace / total bits 3.0 1.084962501
```

The covariance example has error trace 3 and total rate 1.084962501 bits per vector. The changed variances 4/1 at total budget 1.5 allocate .75/.75 and need 1.415037499 bits per vector. A budget 10⁻³⁰⁰ remains positive and produces the finite rate shown in the output. These computations describe Gaussian model assumptions. For non-Gaussian data, uncorrelated coordinates need not be independent; covariance alone does not determine its exact rate-distortion function. A weighted, non-Euclidean distortion also need not survive this rotation unchanged.

## 7. Choose what must survive

An accurate optimizer cannot repair an inappropriate distortion criterion. To understand why MSE can average away a detail, suppose a message Z leaves the receiver uncertain between source values −1 and +1.

[[D38]]

Given Z, let m=E[X|Z]. Expand X−a=(X−m)+(m−a). The cross-term has conditional expectation zero because E[X−m|Z]=0. Therefore

$$\mathbb E[(X-a)^2\mid Z]=\operatorname{Var}(X\mid Z)+(m-a)^2.$$

Only the second term depends on the decoder's choice, so the conditional mean minimizes MSE. For equally likely −1/+1, it returns 0 with MSE 1, although 0 was never an original value. The same argument applies coordinate by coordinate to summed vector squared error; averaging possible images can remove texture.

A decoder can instead produce plausible-looking values with the correct marginal distribution, while pairing them badly with the actual inputs.

[[D39]]

An independent fair-sign reconstruction has four input/output pairs, each with probability 1/4. Two matching pairs cost 0 and two mismatches cost 4, giving MSE 2. Its output histogram exactly matches the source, but its paired error is worse than constant 0. Both schemes have I(X;X̂)=0 because neither uses a source-dependent message. Copying the source gives zero distortion and one bit of information; that is a different communication rule.

The live investigation highlights the joint pair and its marginal contribution together. Changing the prevalence of independently generated output signs does not lower this fair source's MSE below 2. Matching histograms alone cannot tell whether a particular reconstruction preserves its own source.

The next exact calculation enumerates these possibilities rather than estimating them by Monte Carlo. Its independent output law is multiplied by each source probability to form pair weights. Knowing an input-dependent sign would require additional information.

File: `rd_fidelity.py`

```python
source = {-1: 0.5, 1: 0.5}
reconstructions = {"constant zero": {0: 1.0}, "independent signs": {-1: 0.5, 1: 0.5}}
for name, output in reconstructions.items():
    mse = sum(
        p * q * (x - y) ** 2 for x, p in source.items() for y, q in output.items()
    )
    print(name, "MSE", mse, "same marginal", output == source)
```

Output:

```text
constant zero MSE 1.0 same marginal False
independent signs MSE 2.0 same marginal True
```

The rate-distortion-perception literature adds a distribution discrepancy as another criterion. That sharpens one aspect of realism, but distribution equality is not a universal model of human judgment. Operational guarantees depend on the precise formulation and available randomness; the elementary independent-sign example does not establish a general coding theorem for arbitrary perception constraints.

Now hold event frequencies fixed and change the consequence assigned to a rare error.

[[D40]]

Use source values 0,1,3 with probabilities .7,.2,.1. The default cost is squared error. Multiplying the entire high-source row by 10 changes its miss consequences while leaving the source law fixed. Inspect both the conditional cost on that row and its probability-weighted contribution to the overall mean: they answer different questions.

The investigation starts at λ=.1, uniform output initialization and a fixed budget of 500 BA updates. It reports that count and its actual objective gap. Editing the high-row multiplier or λ recomputes from the same initialization and budget; a small-looking change is not labelled convergence. The all-zero-cost case is explicitly a different null experiment. Reset restores the ordinary squared cost, λ=.1 and selected high row.

The chosen weight is an illustration, not a measured recommendation for a sensor. If a rare-event guarantee is essential, impose the actual conditional or worst-case constraint and evaluate it separately. A weighted mean can encourage preservation without proving the guarantee.

**Check your evaluation.** Overall error falls after deployment, but every rare high-category reading is missed. What separates within-category improvement from a changed input mix? Report category frequencies and conditional error for each category with the same definitions and held-out protocol. Reweight those conditional errors to one fixed reference mixture, and evaluate the application's actual miss constraint. The aggregate alone cannot identify either change.

## 8. Turn a representation into a bitstream

So far a codebook index had a declared ideal width. A file also needs enough information for the receiver to parse and reconstruct it. Return to the original `000`/`111` codebook and send all eight three-bit inputs in order.

[[D41]]

The 24 source bits become eight one-bit indices: `00010111`, hexadecimal `17`. Our protocol stores the original source-bit count in a four-byte unsigned big-endian header: `00 00 00 18`, since hexadecimal 18 means decimal 24. The complete message is `00 00 00 18 17`, five bytes. Raw packed source bits would occupy three bytes. The payload rate is 8/24=1/3 bit per source bit, while the complete-message rate is 40/24=5/3. This tiny file grows once its declared header is counted.

Follow the receiver's parsing steps, including an incomplete last source block.

[[D42]]

Read the count n, infer ⌈n/3⌉ code indices, check the corresponding payload byte count, then expand each index to its three-bit codeword. Remove reconstruction positions beyond n. The encoder zero-pads a partial source block before choosing its nearest codeword and zero-pads the final payload byte. Those are two different padding operations. The decoder checks unused payload bits and rejects malformed lengths. Empty input has a valid four-byte header but no meaningful per-source-symbol rate.

Python's `struct`, integers and bytes provide the actual file operations. Save and run this complete programme; the decoder needs only the message and the fixed shared codebook, not the original input. Encoding and decoding are O(n) for the fixed block size and codebook.

File: `rd_bitstream.py`

```python
import struct

CODEBOOK = ("000", "111")  # Shared, fixed protocol; not transmitted per file.


def compress(source):
    if any(bit not in "01" for bit in source):
        raise ValueError("Only binary text is accepted.")
    if len(source) >= 2**32:
        raise ValueError("Length exceeds the four-byte header.")
    padded = source + "0" * ((-len(source)) % 3)
    indices = []
    for start in range(0, len(padded), 3):
        word = padded[start : start + 3]
        indices.append("1" if word.count("1") >= 2 else "0")
    payload_bits = "".join(indices)
    padded_payload = payload_bits + "0" * ((-len(payload_bits)) % 8)
    payload = bytes(
        int(padded_payload[i : i + 8], 2) for i in range(0, len(padded_payload), 8)
    )
    return struct.pack(">I", len(source)) + payload


def decompress(encoded):
    if len(encoded) < 4:
        raise ValueError("Missing length header.")
    length = struct.unpack(">I", encoded[:4])[0]
    blocks = (length + 2) // 3
    if len(encoded) != 4 + (blocks + 7) // 8:
        raise ValueError("Payload length does not match header.")
    payload = "".join(f"{byte:08b}" for byte in encoded[4:])
    if "1" in payload[blocks:]:
        raise ValueError("Nonzero padding.")
    return "".join(CODEBOOK[int(bit)] for bit in payload[:blocks])[:length]


source = "".join(f"{value:03b}" for value in range(8))
encoded = compress(source)
restored = decompress(encoded)
print("source:", source)
print("decoded:", restored)
print("wire bytes, hex:", len(encoded), encoded.hex())
print("raw packed bytes:", (len(source) + 7) // 8)
print("payload bits/source bit:", (len(source) // 3) / len(source))
print("wire bits/source bit:", len(encoded) * 8 / len(source))
print("error fraction:", sum(a != b for a, b in zip(source, restored)) / len(source))
assert len(restored) == len(source)
assert decompress(compress("")) == ""
for bad in (b"", encoded[:-1], encoded + b"\x00"):
    try:
        decompress(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("Malformed payload was accepted.")
```

Output:

```text
source: 000001010011100101110111
decoded: 000000000111000111111111
wire bytes, hex: 5 0000001817
raw packed bytes: 3
payload bits/source bit: 0.3333333333333333
wire bits/source bit: 1.6666666666666667
error fraction: 0.25
```

This format has no corruption checksum or high-performance entropy coder. A long stream amortizes its fixed header; changing a codebook would need prior agreement or additional transmitted description. The point is to specify those costs rather than infer a file size from a tensor shape.

### Compress an observed measurement sequence

The Palmer penguins dataset contains measured bill lengths in millimetres. We will store the retained numeric sequence, then compare each decoded value with its recorded value. This is a storage experiment, separate from the study's ecological questions. Missing bill lengths are omitted; species, original row numbers and omitted-row positions are not transmitted.

First isolate the only lossy step: choosing a reconstruction grid.

[[D43]]

Parse each decimal measurement into an exact integer u in units of 0.1 mm. For a positive integer step s in those same units, choose index k=⌊(2u+s)/(2s)⌋ and reconstruct ks. For nonnegative values this rounds to the nearest grid point, with exact halfway cases going upward. For example u=5 at step 10 becomes index 1 and reconstruction 10, meaning .5 mm becomes 1.0 mm. Integer arithmetic makes that tie rule explicit; a binary floating-point `round` with a different convention is not interchangeable.

Losslessly compress the indices after quantization. The format's 11-byte header stores four magic bytes `PQL1`, version 1, a four-byte retained count and a two-byte step. Version 1 fixes the unit at 0.1 mm, big-endian unsigned 16-bit indices and a zlib stream. The decoder reads the header, decompresses exactly twice the count in bytes, unpacks the indices and multiplies by the stored step. It has no need for the original CSV or a fitted model. zlib's own header/trailer is included inside the counted payload.

Compare only measured errors and complete message lengths from that declared implementation.

[[D44]]

There are 344 CSV records; bill length is missing at original data rows 4 and 272, leaving 342 measurements. Each observation has equal weight in this empirical storage calculation. The raw unsigned-16-bit baseline for that sequence is 684 bytes before any extra metadata. Using zlib level 6, `wbits=15`, and zlib build/runtime 1.3.2, the recorded results are:

| Step in 0.1 mm | MSE in mm² | Maximum absolute error in mm | zlib payload bytes | Complete bytes | Bits per retained value |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 0 | 502 | 513 | 12 |
| 5 | .019269006 | .2 | 357 | 368 | 8.608187135 |
| 10 | .092660819 | .5 | 285 | 296 | 6.923976608 |
| 20 | .335350877 | 1 | 220 | 231 | 5.403508772 |

At step 1 the stored tenth-millimetre values are unchanged. At step 20, the first observation 39.1 mm reconstructs as 40.0 mm. Across these four tested settings, larger steps save bytes while increasing measured error. This is an empirical result for the sequence and codec version, not a theorem that every coarser step compresses better or that the observed source is iid Gaussian. Recorded measurement resolution and quantization error do not establish error relative to true anatomy.

Save the supplied `penguins.csv` beside the programme. `Decimal` checks the tenth-millimetre representation before conversion. NumPy independently checks the integer quantization, while the actual codec uses standard-library struct and zlib. The decoder rejects truncated, extra and oversized data against its declared count. Header count is bounded to avoid allocating an unrestricted output from an untrusted header; this remains a small teaching format rather than a general archival format.

File: `penguins_quantization.py`

```python
import csv
import struct
import zlib
from decimal import Decimal
from pathlib import Path

import numpy as np

HEADER = struct.Struct(">4sBIH")  # Magic, version, retained count, step in 0.1 mm.
MAGIC = b"PQL1"
MAX_COUNT = 1_000_000


def encode(units, step):
    if not isinstance(step, int) or not 1 <= step <= 65535:
        raise ValueError("Step must be a positive uint16 integer in tenths of mm.")
    if len(units) > MAX_COUNT or any(not isinstance(u, int) or not 0 <= u <= 65535
                                    for u in units):
        raise ValueError("Expected at most one million uint16 measurements.")
    indices = [(2 * u + step) // (2 * step) for u in units]
    raw = struct.pack(">" + "H" * len(indices), *indices)
    payload = zlib.compress(raw, level=6, wbits=15)
    return HEADER.pack(MAGIC, 1, len(units), step) + payload


def decode(message):
    if len(message) < HEADER.size:
        raise ValueError("Missing quantization header.")
    magic, version, count, step = HEADER.unpack(message[:HEADER.size])
    if magic != MAGIC or version != 1 or count > MAX_COUNT or step == 0:
        raise ValueError("Unsupported or invalid quantization header.")
    decoder = zlib.decompressobj(wbits=15)
    try:
        raw = decoder.decompress(message[HEADER.size:], 2 * count + 1)
    except zlib.error as error:
        raise ValueError("Invalid compressed index stream.") from error
    if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail or len(raw) != 2 * count:
        raise ValueError("Truncated, oversized or trailing index stream.")
    indices = struct.unpack(">" + "H" * count, raw)
    return [index * step for index in indices], step


def load_measurements():
    rows, units, omitted = [], [], []
    with Path(__file__).with_name("penguins.csv").open(encoding="utf-8", newline="") as file:
        records = list(csv.DictReader(file))
    for row_number, record in enumerate(records, start=1):
        value = record["bill_length_mm"]
        if value in ("", "NA"):
            omitted.append(row_number)
            continue
        scaled = Decimal(value) * 10
        if not scaled.is_finite() or scaled != scaled.to_integral_value() or scaled < 0:
            raise ValueError("Measurement is not a finite nonnegative tenth of mm.")
        rows.append(row_number)
        units.append(int(scaled))
    return len(records), rows, units, omitted


def main():
    count, rows, units, omitted = load_measurements()
    print("total / retained / omitted rows", count, len(units), omitted)
    print("zlib build / runtime", zlib.ZLIB_VERSION, zlib.ZLIB_RUNTIME_VERSION)
    print("header bytes / raw uint16 baseline", HEADER.size, 2 * len(units))
    for step in (1, 5, 10, 20):
        message = encode(units, step)
        reconstructed, decoded_step = decode(message)
        indices = (2 * np.array(units, dtype=np.int64) + step) // (2 * step)
        assert reconstructed == (indices * step).tolist() and decoded_step == step
        residuals = [u - v for u, v in zip(units, reconstructed)]
        mse = sum(d * d for d in residuals) / (100 * len(units))
        maximum = max(abs(d) for d in residuals) / 10
        print("step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value",
              step, round(mse, 9), maximum, len(message) - HEADER.size,
              len(message), round(8 * len(message) / len(units), 9))
        print("first row / original mm / decoded mm", rows[0], units[0] / 10,
              reconstructed[0] / 10)
    assert decode(encode([], 5)) == ([], 5)
    assert decode(encode([5, 15, 25], 10))[0] == [10, 20, 30]
    for malformed in (b"", message[:-1], message + b"\x00"):
        try:
            decode(malformed)
        except ValueError:
            pass
        else:
            raise AssertionError("Malformed stream accepted.")


if __name__ == "__main__":
    main()
```

Output:

```text
total / retained / omitted rows 344 342 [4, 272]
zlib build / runtime 1.3.2 1.3.2
header bytes / raw uint16 baseline 11 684
step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value 1 0.0 0.0 502 513 12.0
first row / original mm / decoded mm 1 39.1 39.1
step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value 5 0.019269006 0.2 357 368 8.608187135
first row / original mm / decoded mm 1 39.1 39.0
step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value 10 0.092660819 0.5 285 296 6.923976608
first row / original mm / decoded mm 1 39.1 39.0
step / MSE mm^2 / max error mm / payload bytes / total bytes / bits per value 20 0.335350877 1.0 220 231 5.403508772
first row / original mm / decoded mm 1 39.1 40.0
```

Only the retained numeric sequence can be decoded. To reconstruct the original CSV's ordering with missing entries, row identities, species and other fields, a different format would have to transmit or otherwise provide them. The table therefore does not claim to compress the entire dataset. The supplied provenance identifies the original collectors and CC0 dataset release, and the file index includes the exact data used.

### Deeper: connect learned representations to coding operations

An autoencoder with eight latent numbers has eight coordinates, not a declared eight-bit message. Trace the operations that turn one latent coefficient into transmitted bits and a reconstruction.

[[D45]]

An analysis transform maps the source to real-valued latents y. Quantization maps y to discrete indices q. A probability model supplies masses for those indices; a lossless entropy coder converts them to bits. The receiver uses the agreed model and syntax to recover indices, then a synthesis transform produces X̂. Each arrow performs a different job. An entropy model does not itself reconstruct the image, and a synthesis transform does not specify how its inputs were transmitted.

Rounding is locally constant almost everywhere, so its ordinary derivative does not train the transform usefully. Ballé, Laparra and Simoncelli's 2017 formulation used additive uniform noise as a differentiable training relaxation, then evaluated quantized and entropy-coded bitstreams. The separate training branch draws noisy continuous latents; it does not label those samples as the deployed message. That paper is a mechanism example, not a current codec ranking.

Several commonly reported “rates” describe different random objects or costs.

[[D46]]

For discrete indices with actual law P and coding law Q, expected ideal log price is H(P)+KL(P||Q). Model mismatch adds cost even if the representation itself is unchanged. A complete finite file also includes integer coding overhead, framing, metadata and any model description that is not already shared. For deterministic discrete indices q=f(X), I(X;q)=H(q); a continuous noisy training latent is a different variable.

The preceding Information Bottleneck lesson derived, under the relevant finite-information assumptions,

$$\mathbb E_X D_{\rm KL}(q(z\mid X)\Vert r(z))=I(X;Z)+D_{\rm KL}(q(z)\Vert r(z)).$$

This is an upper bound on information, not an actual file format. Interpreting it as coding requires a construction and its overheads. A target-preserving bottleneck can also deliberately discard detail that reconstruction distortion would retain. Practice 15 compares two actual prefix-coded payloads with their complete headers before discussing that separate variational objective.

The planned [Sampling, Aliasing and Quantization in Neural Recordings](/learn/path/full-curriculum/sampling-aliasing-and-quantization-in-neural-recordings?module=computational-neuroscience) lesson owns instrument sample timing, value resolution, clipping and noise assumptions. Here a practical comparison starts with the source and receiver's task, states the error criterion, counts the complete encoded message, and evaluates paired reconstruction error on held-out representative and rare inputs. Latency must be measured on stated hardware rather than inferred from the rate-distortion curve. A theoretical frontier is a model-dependent comparison for that evaluation.

## 9. Practise the compression decision

Attempt each prompt before opening its hint or solution. A satisfactory answer identifies the source law, transmitted representation, distortion units and applicable limit. The final repair file collects all new small implementations and their focused changed examples; it imports only the already supplied guarded helpers.

### 1. A different four-word code

For fair three-bit inputs, use the codebook 000,001,110,111. Choose a nearest reconstruction, breaking ties by codebook order. Find the fixed rate, average distortion and worst distortion.

Implement the nearest-index calculation for all eight words, preserving the declared tie order. Report each assignment, not only the final average.

<details>
<summary>Hint</summary>

Four inputs are codewords. For each of the other four, determine whether one changed bit suffices.

</details>

<details>
<summary>Explained solution</summary>

Each index uses 2 bits, so the fixed rate is 2/3 bit per source bit. The four codewords have no error; each other word has a nearest codeword one bit away. Expected error is 4/(8×3)=1/6, and worst block error is 1/3. This is a finite operating point, not proof that its rate equals R(1/6).

`nearest_index` in the complete repair file below selects the first minimizing codebook index. In ascending source-word order the indices are[0,1,0,1,0,1,2,3] and changed-position counts[0,0,1,1,1,1,0,0]. Their weighted average is 1/6 per source bit. A geometric grouping picture must show these same assignments.

</details>

### 2. Repair a curve that rises again

Someone evaluates 1-Hb(D) for a fair source all the way to D=.9 and reports a positive required rate there. Identify the violated principle and supply the correct value.

Implement a validated general binary-rate helper. Include p=0 or 1, a budget beyond the zero-rate threshold and rejection of a negative or nonfinite budget.

<details>
<summary>Hint</summary>

Which reconstruction was already feasible at D=.5?

</details>

<details>
<summary>Explained solution</summary>

The feasible set only expands when D increases. A constant reconstruction with actual error .5 remains feasible at D=.9, so the minimum is 0. The entropy formula's curved branch ends at .5; applying it beyond that point violates monotonicity and ignores the constant-output feasible choice.

Test the branch before subtracting entropies. A deterministic source has threshold zero and therefore always returns zero at valid nonnegative budgets. Do not use a positive part of the curved branch beyond its domain.

```python
import math

def binary_entropy(p):
    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)


def binary_rate(p, budget):
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('source probability must be in [0,1]')
    if not math.isfinite(budget) or budget < 0:
        raise ValueError('budget must be finite and nonnegative')
    if budget >= min(p,1-p):
        return 0.
    return binary_entropy(p)-binary_entropy(budget)
```



</details>

### 3. Change the biased source

Use p=.3 and budget D=.1. Construct the attaining joint table, find both forward conditional error probabilities and calculate the information rate.

Verify the entire joint table before calculating its forward errors: both source marginals, both reconstruction marginals and total mismatch probability.

<details>
<summary>Hint</summary>

First obtain output probability r=(p-D)/(1-2D), then generate X backward by an independent error bit.

</details>

<details>
<summary>Explained solution</summary>

r=.25. The joint table, with input rows and output columns, is [[.675,.025],[.075,.225]]. Its rows sum to .7/.3 and its off-diagonal mass is .1. False-positive probability is .025/.7≈.035714; false-negative probability is .075/.3=.25. The rate is Hᵦ(.3)−Hᵦ(.1)≈.412295 bits. A forward channel that flips each source bit with probability .1 would be a different joint law.

The output marginal is(.75,.25). Multiplying the backward output probabilities by independent error probabilities produces the four joint entries. Dividing by(.7,.3) is a separate conditioning operation. Substituting symmetric forward errors .1/.1 would preserve total error but construct a different information cost.

</details>

### 4. Diagnose the exact-zero-error claim

For p=.1 and a fixed block length n=10, a designer says source entropy below 1 bit proves that a fixed-width exact zero-error code can use fewer than 10 bits per block. What went wrong?

State whether the error requirement is exact at this finite block length or only tends to zero over a sequence of increasing lengths.

<details>
<summary>Hint</summary>

How many length-ten strings have positive probability?

</details>

<details>
<summary>Explained solution</summary>

All 1024 strings have positive probability. Exact zero error requires 1024 distinct reconstructions, so a fixed-width index needs 10 bits. Source entropy constrains expected-length lossless coding and the asymptotic vanishing-error boundary, not this finite exact fixed-width requirement. Rare strings can be long in a variable-length code; a fixed-width code cannot hide their length in an average.

The finite requirement counts every positive-mass source string, including rare ones. An expected length can be lower because rare strings may receive longer descriptions; that is a different rate convention. A limiting vanishing-error statement also does not remove the finite exact requirement.

</details>

### 5. Convert the distortion units

A solver minimizes I+2D, with D in squared metres. You change the reported error to Dnew=100D but want exactly the same objective and optimizer. What weight should the new solver use?

Check the objective numerically on any one declared feasible channel, after changing the whole cost matrix to 100 times its old values.

<details>
<summary>Hint</summary>

Set the new weighted distortion term equal to2D.

</details>

<details>
<summary>Explained solution</summary>

Use λnew=.02, because .02×100D=2D. The multiplier has inverse distortion units. Keeping it at 2 would make the same physical error 100 times as expensive and generally select a different operating point.

The information term and channel remain unchanged. The changed distortion is 100D and the inverse weight preserves lambdaD. In the new weighted exercise below, .1 becomes .001 when costs are multiplied by 100. Bit-to-nat conversion is another rescaling: lambda in bits becomes s=lambda ln 2 inside natural-log Gibbs calculations.

</details>

### 6. A stationary but bad optimizer

The fair-binary solver at λ=2 starts with r=(1,0). After 100 iterations its conditional table is unchanged. Is it optimal? Give a feasible rule that improves its objective.

Name the diagnostic that must include absent reconstruction columns. Explain why its bound gap need not equal the difference from one chosen comparison encoder.

<details>
<summary>Hint</summary>

The zero column cannot reappear. Compare the actual zero-rate error with the binary operating point D=.2.

</details>

<details>
<summary>Explained solution</summary>

The constant output has I=0, D=.5 and objective 1. The valid binary channel with D=.2 has I=1−Hᵦ(.2)≈.278072 and objective≈.678072. Its improvement is about .321928. Positive initialization admits that channel; an unchanged support-limited table is insufficient evidence. The reported gap need not equal the actual improvement, because a lower bound can be loose.

The scores g_j include every column, even one with r_j=0. An inactive g_j>1 exposes a profitable direction. The all-column lower bound can be loose, so upper minus lower is a certificate gap for the combined objective, not the exact improvement from one candidate. A larger iteration count cannot revive an exactly excluded column.

</details>

### 7. Allocate a new Gaussian budget

Two independent Gaussian components have variances4 and1. Allocate total squared error1.5 and calculate the total rate. Then describe what happens when the budget reaches3.

Return component errors and component rates separately, and label the total as bits per vector.

<details>
<summary>Hint</summary>

Try a common error level and check whether either component would exceed its variance.

</details>

<details>
<summary>Explained solution</summary>

At total 1.5, θ=.75 lies below both variances, so the errors are (.75,.75). The component rates are about 1.207519 and .207519 bits, adding to 1.415037 bits per vector before rounding. At budget 3, the smaller component caps at 1 and the other gets 2; rate becomes .5 bit per vector. Dividing the total by 2 gives average rate per component, not either component's individual rate.

The complete `allocate` helper is already supplied above and can be reused safely without executing a demonstration. The unchanged numerical result is retained; no new optimizer run is needed to restate it. Zero variance requires no bits, whereas zero error on a positive-variance Gaussian requires infinite ideal rate.

</details>

### 8. A plausible output that is not faithful

With an unknown fair sign X∈{−1,+1}, compare reconstructing0 with sampling an independent fair sign. Can the second scheme prove that the original sign was preserved because its output histogram matches?

Add a source-copying decoder to the joint comparison and explain where its information comes from.

<details>
<summary>Hint</summary>

Enumerate the four equally likely input/output pairs of the random scheme.

</details>

<details>
<summary>Explained solution</summary>

No. Constant 0 has MSE 1. Independent signs agree on two pairs and differ by 2 on two pairs, giving MSE 2. The output marginal matches, but independence means I=0. Preserving the actual sign would require an input-dependent message or other informative side information. Marginal similarity and paired fidelity measure different properties.

Copying X has only the two matching pairs, each probability .5, so its MSE is 0 and I(X;Xhat)=1 bit. Unlike the other two schemes, it uses the source-dependent sign. Matching an output histogram alone neither produces that pairing nor supplies the missing message.

</details>

### 9. Build and validate a changed byte format

Adapt the complete serializer to the four-word codebook from task1, using two index bits per block and the same four-byte source-length header. Encode 001011101111. Define tests for partial blocks and malformed data.

Implement the whole revised encoder and decoder, including count header, two-bit indices, source padding, payload padding and truncation. Add focused empty, partial and malformed cases before any larger campaign.

<details>
<summary>Hint</summary>

Select the nearest codeword, emit its index as exactly two bits, concatenate indices, and pad only the final byte. The decoder derives the index count from the original length.

</details>

<details>
<summary>Explained solution</summary>

The indices are 1,1,1,3, so the payload bits are 01010111, hex 57. The complete five-byte message is hex 0000000c 57. Decoding reconstructs 001001001111, with two wrong positions out of 12. The padding and length protocol must state that a partial source block is zero-padded before encoding and truncated after reconstruction. Acceptance tests: exhaust all binary strings of lengths 0 through 10; preserve the original decoded length; emit only the declared index width; check the expected payload byte count; reject a truncated header, missing/extra payload bytes and nonzero unused bits. For full fair three-bit blocks, verify average error 1/6 and at most one changed bit per block. Report both payload and full-message bits per original bit; an empty input has a valid header but no meaningful per-symbol rate. These tests verify the declared toy protocol, not resilience to arbitrary bit corruption.

The functions below are the complete changed format. Nearest reconstruction uses ascending codebook order to break ties. The decoder derives the exact number of used index bits from the source length; all remaining payload bits must be zero. It requires neither the original source nor its errors.

```python
import struct

CODEBOOK = ('000', '001', '110', '111')

def nearest_index(word, codebook=CODEBOOK):
    if len(word) != 3 or any(bit not in '01' for bit in word):
        raise ValueError('one complete three-bit word required')
    return min(range(len(codebook)),
               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))


def compress_four(source):
    if any(bit not in '01' for bit in source) or len(source) >= 2**32:
        raise ValueError('binary source fitting the four-byte length required')
    padded = source+'0'*((-len(source))%3)
    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]
    bits = ''.join(f'{j:02b}' for j in indices)
    packed = bits+'0'*((-len(bits))%8)
    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))
    return struct.pack('>I',len(source))+payload


def decompress_four(message):
    if len(message)<4:
        raise ValueError('missing source-length header')
    count, = struct.unpack('>I',message[:4])
    blocks = (count+2)//3
    used = 2*blocks
    if len(message)!=4+(used+7)//8:
        raise ValueError('payload length disagrees with header')
    bits = ''.join(f'{byte:08b}' for byte in message[4:])
    if '1' in bits[used:]:
        raise ValueError('nonzero unused payload bits')
    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]
    return ''.join(CODEBOOK[j] for j in indices)[:count]
```

For 001011101111 the complete bytes are `0000000c57`, the reconstruction is 001001001111 and two of 12 positions differ. The new focused tests cover this changed protocol and several partial/error cases. The former 2,047-case campaign belongs to the original one-bit protocol; it is not claimed as fresh exhaustive evidence for these changed functions.

</details>

### 10. Choose a useful audio operating point

You must compress 30-second call recordings. Propose a cheap distortion check, a more task-relevant check and an evaluation process that does not let a good average conceal lost critical words.

Give one acceptable evaluation plan, including a decision threshold for critical content before selecting an operating point. Do not invent recordings, measured latency or a winning codec.

<details>
<summary>Hint</summary>

Distinguish paired waveform fidelity, intelligibility of words and the actual encoded bytes. State what would make a candidate fail.

</details>

<details>
<summary>Explained solution</summary>

One defensible starting answer uses aligned waveform MSE as a cheap paired signal check, while acknowledging its sensitivity to small timing changes and its incomplete relationship to intelligibility. A task-relevant evaluation uses blinded listening/transcription of held-out calls, checking important words or numbers separately. Include realistic noise and speaker conditions with category-level results. A specific intelligibility metric could supplement these checks if its validity for the conditions is established. Encode and decode every candidate setting through the real format; count complete bytes, measure latency on stated hardware and evaluate the same held-out recordings. Specify an acceptable error criterion before comparing settings, including a separate critical-word requirement. A candidate fails when it violates that requirement even if aggregate MSE improves. Document the chosen bitrate range and what source changes would trigger reevaluation. The theory organizes the tradeoff; it cannot decide which lost words are acceptable.

This is an open design task. An answer succeeds when its stated byte convention, held-out conditions, paired or task-specific loss, critical-event requirement and hardware timing procedure could be independently applied. A lower aggregate MSE cannot excuse a failed critical-word requirement.

</details>

### 11. Distinguish channel mixing from time-sharing

Mix two fair-binary channels with flip probabilities .1 and .3, choosing either with probability 1/2 independently for each source symbol. Calculate the mixed distortion and MI, and compare with the average of the two original MIs. Explain how a known schedule of finite block codes differs. Finish the converse’s Jensen step and bound exceptional error mass epsilon for bounded distortion dmax.

<details>
<summary>Hint</summary>

The mixed channel has flip probability .2. Conditional entropy is nonlinear in the error probability. A known block schedule adds lengths and errors.

</details>

<details>
<summary>Explained solution</summary>

The mixed channel has D=.2 and I=1−Hb(.2)=.278071905 bits. The mean of the two channel informations is .324856754 bits, strictly larger. Distortion mixes linearly, while MI is convex in the channel. Time-sharing actual block codes adds their actual transmitted lengths and distortions, giving their weighted rates rather than assigning that rate to the mixed channel’s MI. In the converse, convexity gives (1/n)sum R(Di)≥R((1/n)sum Di); monotonicity then gives R(Dbar)≥R(D) if Dbar≤D. Exceptional source mass epsilon contributes at most epsilon dmax. Without bounded cost or suitable tail control, small failure probability alone does not control expected distortion.

</details>

### 12. Repair one weighted BA step

Use source values and reconstructions 0,1,3, probabilities (.7,.2,.1), initial output law (.2,.3,.5), lambda .1 and squared cost with the source 3 row multiplied by 10. Implement one Gibbs row update, rebuild the induced marginal and calculate the all-column bound. Repair code that sums the wrong array axis or uses the old output law in the reported MI. Check a cost-unit change multiplying all costs by 100.

<details>
<summary>Hint</summary>

Costs are fixed for this step. Row normalization sums over reconstruction columns; the new output law averages rows using source probabilities. Distortion changes under a unit conversion, while lambdaD should not.

</details>

<details>
<summary>Explained solution</summary>

The first channel is [[.267432142,.374284517,.358283341],[.215596641,.346606138,.437797221],[.000752445,.036117381,.963130173]]. Its induced marginal is(.230397072,.334932128,.434670800), not the unweighted mean of rows or the old(.2,.3,.5). The scores g are(1.151985361,1.116440426,.869341600). The achieved distortion is 3.063782850 cost units, MI .110843557 bits and objective .417221842 bits; the lower bound .225545836 gives gap .191676005. The scalar and array solutions below expose different implementation routes to those same operations. Multiplying cost by 100 and changing lambda to .001 preserves q,r,I and both objective bounds; D itself multiplies by 100.

```python
import math
import numpy as np
from scipy.special import logsumexp

def one_ba_scalar(p, costs, weight, initial):
    # This task uses positive finite p and r and finite nonnegative costs.
    s = weight*math.log(2)
    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]
    normalizers=[]
    q=[]
    for row in logits:
        largest=max(row)
        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))
        normalizers.append(log_z)
        q.append([math.exp(v-log_z) for v in row])
    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]
    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)
                    for i in range(len(p)) for j in range(len(initial)))
    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))
    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))
       for j in range(len(initial))]
    f=-sum(pi*z for pi,z in zip(p,normalizers))
    lower=(f-math.log(max(g)))/math.log(2)
    upper=information+weight*distortion
    return q,marginal,[distortion,information,lower,upper,upper-lower],g


def one_ba_array(p, costs, weight, initial):
    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))
    scaled=weight*math.log(2)*d
    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)
    log_q=np.log(r)[None,:]-scaled-log_z[:,None]
    q=np.exp(log_q)
    induced=p@q
    joint=p[:,None]*q
    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))
    distortion=float((joint*d).sum())
    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)
    lower=float((-p@log_z-log_g.max())/math.log(2))
    upper=information+weight*distortion
    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)
```



</details>

### 13. Rotate, allocate and rotate back

For a jointly Gaussian source with covariance[[2.5,1.5],[1.5,2.5]], allocate total squared error 1.5. Implement the eigendecomposition, match eigenvalues and error variances, reconstruct the original-coordinate error covariance and check its trace. Separately compare a scalar sign quantizer at variance 4 with the one-bit Gaussian limit.

<details>
<summary>Hint</summary>

The covariance has eigenvalues 1 and 4. Orthogonal rotation preserves summed squared error; Gaussianity is what turns uncorrelated transformed coordinates into independent ones.

</details>

<details>
<summary>Explained solution</summary>

Both components receive error .75, so the rotated-back error covariance is .75 times the identity and its trace is 1.5. Total rate is 1.415037499 bits per vector. The scalar sign quantizer at variance 4 has MSE 4(1−2/pi)=1.453520911, above the one-bit long-block limit 4/4=1. The covariance calculation assumes a jointly Gaussian vector and ordinary summed squared error. The finite sign rule is a specified scalar codec, not the asymptotic optimizer. The complete implementation reuses the supplied active-set helper and validates the covariance before eigh.

```python
import math
import numpy as np
from rd_scalar_helpers import allocate

def rotated_error(covariance,budget):
    covariance=np.asarray(covariance,dtype=np.float64)
    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:
        raise ValueError('square covariance required')
    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):
        raise ValueError('finite symmetric covariance required')
    values,basis=np.linalg.eigh(covariance)
    if np.any(values<0):
        raise ValueError('nonnegative eigenvalues required')
    errors,rates=allocate(values.tolist(),budget)
    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)
```



</details>

### 14. Extend the measured-byte experiment

Use the same offline retained bill-length sequence and version 1 format at steps 7 and 15 tenths of a millimetre. Report paired MSE inmm², maximum error inmm, complete bytes and bits per retained value. Verify a new halfway case using step 14, reject a truncated payload, and state what information cannot be reconstructed from this message.

<details>
<summary>Hint</summary>

The quantizer’s step and input integers have the same tenth-millimetre unit. Reuse the actual guarded encoder/decoder; no model or original CSV is available to the decoder.

</details>

<details>
<summary>Explained solution</summary>

The new bounded run retains 342 values and omits original data rows 4 and 272. Step 7 gives MSE .041929825 mm², maximum .3 mm,339 complete bytes and 7.929824561 bits/value. Step 15 gives .178187135 mm², maximum .7 mm,265 complete bytes and 6.198830409 bits/value. At step 14, values 7 and 21 reconstruct to 14 and 28: exact ties go upward. Truncating the final stream is rejected. These bytes use the same zlib environment as the main example; they are observed results, not guaranteed monotone sizes for arbitrary steps. Original missing-row positions, species and other CSV fields are not transmitted. The complete repair file below contains the exact additional calls and assertions.

</details>

### 15. Audit ideal prices and complete bytes

For exact text AAAABBCD, use truthful Q1=(.5,.25,.125,.125) with codes A0/B10/C110/D111, and Q2=(.125,.125,.25,.5) with codes A110/B111/C10/D0. Calculate empirical entropy, the second model’s cross-entropy and mismatch excess. Encode both payloads with a four-byte original-symbol-count header and zero padding to a full byte. Explain why neither byte count is a noisy-latent variational MI upper bound.

<details>
<summary>Hint</summary>

These are dyadic probabilities, so each given prefix length equals its model’s negative base 2 log probability. The decoder is assumed to know which fixed book was chosen.

</details>

<details>
<summary>Explained solution</summary>

Counts(4,2,1,1) give H=1.75 bits/symbol. Under Q2 the average price is 2.625, so mismatch costs .875 bits/symbol. The first actual payload has 14 bits and complete hex `000000080adc`,6 bytes. The second has 21 bits and complete hex `00000008db6fe0`,7 bytes. The original count lets the decoder ignore final byte padding; the fixed codebook is shared by prior agreement, with no claim that a transmitted model is free. A variational encoder/reference KL concerns separately defined random variables and a surrogate objective. Converting it into a file requires a coding construction and its overheads.

The complete new exercise file follows. It includes the small functions shown above, the direct changed cases, and imports the already supplied `rd_scalar_helpers.py` and `penguins_quantization.py` without running their mains. Keep the pinned CSV beside those files.

```python
"""Complete small implementations for the independent rate-distortion tasks."""
import itertools
import math
import struct

import numpy as np
from scipy.special import logsumexp

from rd_scalar_helpers import allocate
from penguins_quantization import encode as encode_measurements
from penguins_quantization import decode as decode_measurements
from penguins_quantization import load_measurements

CODEBOOK = ('000', '001', '110', '111')


def binary_entropy(p):
    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)


def binary_rate(p, budget):
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('source probability must be in [0,1]')
    if not math.isfinite(budget) or budget < 0:
        raise ValueError('budget must be finite and nonnegative')
    if budget >= min(p,1-p):
        return 0.
    return binary_entropy(p)-binary_entropy(budget)


def nearest_index(word, codebook=CODEBOOK):
    if len(word) != 3 or any(bit not in '01' for bit in word):
        raise ValueError('one complete three-bit word required')
    return min(range(len(codebook)),
               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))


def compress_four(source):
    if any(bit not in '01' for bit in source) or len(source) >= 2**32:
        raise ValueError('binary source fitting the four-byte length required')
    padded = source+'0'*((-len(source))%3)
    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]
    bits = ''.join(f'{j:02b}' for j in indices)
    packed = bits+'0'*((-len(bits))%8)
    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))
    return struct.pack('>I',len(source))+payload


def decompress_four(message):
    if len(message)<4:
        raise ValueError('missing source-length header')
    count, = struct.unpack('>I',message[:4])
    blocks = (count+2)//3
    used = 2*blocks
    if len(message)!=4+(used+7)//8:
        raise ValueError('payload length disagrees with header')
    bits = ''.join(f'{byte:08b}' for byte in message[4:])
    if '1' in bits[used:]:
        raise ValueError('nonzero unused payload bits')
    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]
    return ''.join(CODEBOOK[j] for j in indices)[:count]


def one_ba_scalar(p, costs, weight, initial):
    # This task uses positive finite p and r and finite nonnegative costs.
    s = weight*math.log(2)
    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]
    normalizers=[]
    q=[]
    for row in logits:
        largest=max(row)
        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))
        normalizers.append(log_z)
        q.append([math.exp(v-log_z) for v in row])
    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]
    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)
                    for i in range(len(p)) for j in range(len(initial)))
    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))
    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))
       for j in range(len(initial))]
    f=-sum(pi*z for pi,z in zip(p,normalizers))
    lower=(f-math.log(max(g)))/math.log(2)
    upper=information+weight*distortion
    return q,marginal,[distortion,information,lower,upper,upper-lower],g


def one_ba_array(p, costs, weight, initial):
    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))
    scaled=weight*math.log(2)*d
    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)
    log_q=np.log(r)[None,:]-scaled-log_z[:,None]
    q=np.exp(log_q)
    induced=p@q
    joint=p[:,None]*q
    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))
    distortion=float((joint*d).sum())
    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)
    lower=float((-p@log_z-log_g.max())/math.log(2))
    upper=information+weight*distortion
    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)


def rotated_error(covariance,budget):
    covariance=np.asarray(covariance,dtype=np.float64)
    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:
        raise ValueError('square covariance required')
    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):
        raise ValueError('finite symmetric covariance required')
    values,basis=np.linalg.eigh(covariance)
    if np.any(values<0):
        raise ValueError('nonnegative eigenvalues required')
    errors,rates=allocate(values.tolist(),budget)
    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)


def prefix_message(text,codebook):
    # These tasks supply a fixed known prefix-free book, so no model is transmitted.
    if len(text)>=2**32:
        raise ValueError('source count exceeds header')
    bits=''.join(codebook[c] for c in text)
    padded=bits+'0'*((-len(bits))%8)
    payload=bytes(int(padded[i:i+8],2) for i in range(0,len(padded),8))
    return len(bits),struct.pack('>I',len(text))+payload


def main():
    words=[''.join(bits) for bits in itertools.product('01',repeat=3)]
    indices=[nearest_index(w) for w in words]
    errors=[sum(a!=b for a,b in zip(w,CODEBOOK[j])) for w,j in zip(words,indices)]
    assert sum(errors)==4 and max(errors)==1
    print('four-word indices / errors',indices,errors)
    print('binary rate p=.5,D=.9 / p=0,D=0',binary_rate(.5,.9),binary_rate(0,0))
    try:binary_rate(.5,-.1)
    except ValueError:pass
    else:raise AssertionError('negative budget accepted')
    source='001011101111'
    message=compress_four(source)
    assert message.hex()=='0000000c57'
    restored=decompress_four(message)
    assert restored=='001001001111'
    print('changed codec bytes / decoded / wrong positions',message.hex(),restored,
          sum(a!=b for a,b in zip(source,restored)))
    for sample in ('','0','1','01','0111','10101'):
        assert len(decompress_four(compress_four(sample)))==len(sample)
    partial=bytearray(compress_four('1'));partial[-1]|=1
    for malformed in (b'',message[:-1],message+b'\0',bytes(partial)):
        try:decompress_four(malformed)
        except ValueError:pass
        else:raise AssertionError('malformed changed codec accepted')
    mi_mixture=1-binary_entropy(.2)
    average=.5*(1-binary_entropy(.1))+.5*(1-binary_entropy(.3))
    assert mi_mixture<average
    print('channel-mixture MI / time-share mean MI',round(mi_mixture,9),round(average,9))
    p=[.7,.2,.1];values=[0,1,3];initial=[.2,.3,.5]
    costs=[[(x-y)**2*(10 if x==3 else 1) for y in values] for x in values]
    scalar=one_ba_scalar(p,costs,.1,initial)
    array=one_ba_array(p,costs,.1,initial)
    for a,b in zip(scalar,array):np.testing.assert_allclose(a,b,atol=1e-12,rtol=1e-12)
    scaled=one_ba_scalar(p,[[100*d for d in row] for row in costs],.001,initial)
    for i in (0,1,3):np.testing.assert_allclose(scalar[i],scaled[i],atol=1e-12,rtol=1e-12)
    np.testing.assert_allclose(scaled[2][0],100*scalar[2][0],rtol=1e-12)
    np.testing.assert_allclose(scalar[2][1:],scaled[2][1:],atol=1e-12,rtol=1e-12)
    print('weighted one-step channel',np.round(scalar[0],9).tolist())
    print('induced marginal / all-column g',np.round(scalar[1],9).tolist(),np.round(scalar[3],9).tolist())
    print('D / I / lower / upper / gap',np.round(scalar[2],9).tolist())
    values,errors,error_covariance,rate=rotated_error([[2.5,1.5],[1.5,2.5]],1.5)
    np.testing.assert_allclose(error_covariance,.75*np.eye(2),atol=1e-12)
    print('rotated eigenvalues / errors / trace / bits',values.tolist(),errors,
          round(float(np.trace(error_covariance)),9),round(rate,9))
    print('variance4 sign MSE / one-bit limit',round(4*(1-2/math.pi),9),1.)
    total,rows,units,omitted=load_measurements()
    print('changed observed steps retained / omitted',len(units),omitted)
    for step in (7,15):
        message=encode_measurements(units,step)
        recovered,recovered_step=decode_measurements(message)
        assert recovered_step==step
        expected=[((2*u+step)//(2*step))*step for u in units]
        assert recovered==expected
        residual=[a-b for a,b in zip(units,recovered)]
        print('step / MSE mm2 / max mm / complete bytes / bits per value',step,
              round(sum(d*d for d in residual)/(100*len(units)),9),max(map(abs,residual))/10,
              len(message),round(8*len(message)/len(units),9))
    assert decode_measurements(encode_measurements([7,21],14))[0]==[14,28]
    try:decode_measurements(message[:-1])
    except ValueError:pass
    else:raise AssertionError('truncated quantization stream accepted')
    for book in ({'A':'0','B':'10','C':'110','D':'111'},
                 {'A':'110','B':'111','C':'10','D':'0'}):
        count,message=prefix_message('AAAABBCD',book)
        print('prefix payload bits / complete bytes / hex',count,len(message),message.hex())


if __name__=='__main__':
    main()

```

Recorded output of this one bounded exercise run:

```text
four-word indices / errors [0, 1, 0, 1, 0, 1, 2, 3] [0, 0, 1, 1, 1, 1, 0, 0]
binary rate p=.5,D=.9 / p=0,D=0 0.0 0.0
changed codec bytes / decoded / wrong positions 0000000c57 001001001111 2
channel-mixture MI / time-share mean MI 0.278071905 0.324856754
weighted one-step channel [[0.267432142, 0.374284517, 0.358283341], [0.215596641, 0.346606138, 0.437797221], [0.000752445, 0.036117381, 0.963130173]]
induced marginal / all-column g [0.230397072, 0.334932128, 0.4346708] [1.151985361, 1.116440426, 0.8693416]
D / I / lower / upper / gap [3.06378285, 0.110843557, 0.225545836, 0.417221842, 0.191676005]
rotated eigenvalues / errors / trace / bits [1.0, 4.0] [0.75, 0.75] 1.5 1.415037499
variance4 sign MSE / one-bit limit 1.453520911 1.0
changed observed steps retained / omitted 342 [4, 272]
step / MSE mm2 / max mm / complete bytes / bits per value 7 0.041929825 0.3 339 7.929824561
step / MSE mm2 / max mm / complete bytes / bits per value 15 0.178187135 0.7 265 6.198830409
prefix payload bits / complete bytes / hex 14 6 000000080adc
prefix payload bits / complete bytes / hex 21 7 00000008db6fe0

```



</details>

You are ready to move on when you can construct a decodable code, state its full message cost, distinguish its finite result from a model-dependent information frontier, trace a stable Gibbs update, diagnose missing support, allocate Gaussian error and explain what the chosen distortion can miss. The next topic, [f-Divergences & Integral Probability Metrics](/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations), compares probability laws in other ways. The independent-sign example shows why a distributional comparison and paired reconstruction fidelity answer different questions.

## Further learning

- [Cover and Thomas, chapter 13](https://static.ias.edu/pitp/archive/2012files/Cover_and_Thomas_Chptr13.pdf) develops the binary and Gaussian constructions, converse, achievability and finite computation in one canonical treatment. The chapter numbering here is from the 1991 edition. Start with its backward-channel example after tracing the joint table in section 3.
- [MIT 6.441, chapter 23](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/resources/mit6_441s16_chapter_23/) connects scalar and vector quantization with rate-distortion theory. It is useful for seeing why a finite quantizer and an asymptotic information bound are different objects. [Chapter 24](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/aaa8d18ddecde45f97134d3f3dcee4a3_MIT6_441S16_chapter_24.pdf), especially theorem 24.2, supplies a formal continuation of the random-codebook argument and its assumptions.
- [CMU 10-704, lecture 16, sections 16.3–16.4](https://www.cs.cmu.edu/~aarti/Class/10704_Spring15/lecs/lec16.pdf) is a compact supplementary route through the Gaussian result and finite BA calculation. These are course scribe notes; use the explicit source, multiplier and logarithm conventions when comparing equations.
- For a lecture-based second pass, [S. N. Merchant's NPTEL lecture 31: Introduction to Rate-Distortion Theory](https://www.youtube.com/watch?v=qmCTnAoMSc8), from [IIT Bombay's Information Theory and Coding course](https://nptel.ac.in/courses/117101053), is an older foundational alternative after entropy and mutual information. The creator and title were verified, but this revision did not review full playback or a transcript.

## Technical references

- [Shannon, Coding Theorems for a Discrete Source With a Fidelity Criterion](https://gwern.net/doc/cs/algorithm/information/1959-shannon.pdf) introduces the fidelity-criterion formulation. Its distinction between error frequency and application consequences is relevant to the alarm example; the local numerical weights are illustrative, not measurements from that paper.
- [Blahut's original algorithm paper](https://doi.org/10.1109/TIT.1972.1054855) is the historical computational reference. [Pearlman's lecture notes](https://sites.ecse.rpi.edu/~pearlman/lec_notes/blahut_2.pdf) provide an accessible auxiliary-optimization derivation. Multiplier signs and log bases vary between treatments; the complete derivation and all-column bound in section 5 state the conventions used here. The original Blahut full text was not retrieved for this revision.
- [Ballé, Laparra and Simoncelli, End-to-End Optimized Image Compression](https://www.cns.nyu.edu/pub/lcv/balle17a-final.pdf), sections 2–3 and the entropy-code appendix, connects transform learning, the continuous training relaxation and actual encoded rates. It is a mechanism reference, not a current performance recommendation.
- [Blau and Michaeli, Rethinking Lossy Compression](https://proceedings.mlr.press/v97/blau19a.html) formulates paired distortion and output-distribution discrepancy as different constraints. Read its operational qualifications: an information formulation alone does not establish general coding achievability. [Qian and colleagues, Gaussian Vector Rate-Distortion-Perception](https://www.comm.utoronto.ca/~weiyu/2024_ISITW_Sadaf.pdf), section III, reviews classical reverse water-filling before a more advanced extension with additional assumptions.
- The ordinary numerical contracts are documented by [SciPy logsumexp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.logsumexp.html), [SLSQP](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html), [brentq](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html) and [NumPy eigh](https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html). The local programmes expose array axes, tolerances, constraints and eigenvector ordering so those tools can be used deliberately.
- [Python zlib](https://docs.python.org/3.12/library/zlib.html) documents the stream format controls and decompression checks. [Palmer penguins](https://allisonhorst.github.io/palmerpenguins/) documents the CC0 dataset, and [Gorman, Williams and Fraser](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) describes the field study. The storage exercise compares recorded measurements with their reconstructions; it does not reproduce the ecological analysis.

## Files and setup

The original small examples use Python's standard library. The array and root-finding comparisons use NumPy 2.3.5 and SciPy 1.18.1; their recorded environment used Python 3.12.14. The measurement codec uses standard-library `Decimal`, `struct` and zlib, with NumPy as a separate quantization check. Exact compressed sizes refer to the stated zlib build/runtime 1.3.2.

| File | Purpose and required companion |
| --- | --- |
| `rd_blockCode.py` | Enumerate the complete three-bit code and its errors. |
| `rd_biasedChannel.py` | Construct the fixed interior binary joint law and forward errors. |
| `rd_originalBinary.py` | Evaluate the original fair curved branch within its declared domain. |
| `rd_finiteOptimizer.py` | Stable scalar BA calculation and all-column objective bounds. |
| `rd_scalar_helpers.py` | Importable exact scalar function definitions, with no demonstration loop. |
| `finite_rd_library.py` | Same-fixture array comparison and constrained solver; keep the scalar helper beside it. |
| `rd_gaussianAllocation.py` | Scalar Gaussian rate and capped active-set allocation. |
| `gaussian_rd_library.py` | Root finding and covariance rotation; keep the scalar helper beside it. |
| `rd_fidelity.py` | Enumerate paired errors for constant and independent reconstructions. |
| `rd_bitstream.py` | The original complete one-bit-index protocol. |
| `penguins_quantization.py` | Quantize and store the retained numeric sequence; requires `penguins.csv`. |
| `rd_practice.py` | Complete new exercise functions and changed cases; requires both guarded numerical/codec helpers and the data. |
| `penguins.csv` and `DATA-PROVENANCE.md` | Exact offline measurements and their attribution/selection rule. |

Save the complete sources under their shown filenames and keep companions together. Each main example runs with `python filename.py`; importing the helper files does not execute the original demonstrations. The common file controls provide the whole source, including imports and checks.
