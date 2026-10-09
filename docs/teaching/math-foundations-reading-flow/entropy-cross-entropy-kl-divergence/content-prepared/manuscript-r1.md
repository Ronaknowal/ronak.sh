# Entropy, Cross-Entropy & KL Divergence

A device sends status symbols. Some occur often; others rarely. Can short binary messages exploit that pattern? A prediction model has a related problem: what does it cost to believe the wrong pattern? Follow the same four outcomes through their probabilities, codewords and prediction costs, then use that accounting to compare models and certify a constrained distribution.

Prerequisites: [Probability Distributions & Bayes' Theorem](/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations) supplies probabilities, conditional slices and weighted averages. [Algebra, Functions, Exponentials & Logarithms](/learn/path/full-curriculum/algebra-functions-exponentials-logarithms?module=math-foundations) explains logarithms as inverse powers. We refresh both operations. The continuous branch introduces density and integration locally; [Measure Theory](/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations) supplies further foundations.

On a first pass, read sections1–4, the basic bound and direction in5, then conditional prediction and practical scoring in6–7. Try the related practice before returning to the deeper coding proof and sections8–9. The drawings and live investigations work here; complete Python files run in your own environment. Most use the standard library. The explicitly named comparisons use NumPy/SciPy or PyTorch. Printed decimals are rounded and their tested environments are stated beside the programmes.

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

Probability1/2 corresponds to one such choice,1/4 to two and1/8 to three. A logarithm reverses the power: because2⁻³=1/8, −log₂(1/8)=3. We call −log₂P(x) the outcome's **surprisal**, measured in **bits**. At this point “bit” names an information unit; it does not yet guarantee an integer number of transmitted digits.

| Outcome | P(x) | −log₂P(x) |
| --- | --- | --- |
| A | 1/2 | 1bit |
| B | 1/4 | 2bits |
| C | 1/8 | 3bits |
| D | 1/8 | 3bits |

Why should information use a logarithm? Follow two choices along one path.

[[E03]]

An independent first event has probability1/2 and the second1/4. Their joint probability is1/8; their information adds as1+2=3bits. The product rule and logarithm rule agree:

$$I_P(x)=-\log_bP(x),\qquad -\log_b(pq)=-\log_bp-\log_bq.$$

The log identity holds for positive p and q. Using pq as a joint probability needs independence. In a dependent process, the second branch instead has its probability conditional on the first: P(x,y)=P(x)P(y|x). A second copy of an already known bit supplies no new information; its conditional probability is one.

Information has a unit because we choose the logarithm's base.

[[E04]]

Base2 gives bits. The natural logarithm, ln with base e, gives **nats**. One bit equals ln2≈.693147nats; divide nats by ln2 to express the same amount in bits. The two rulers identify the same probability with different numerical units. Keep the base consistent within a sum or comparison.

An outcome assigned probability1 has zero surprise. As a positive probability approaches zero its surprise grows without bound. Observing something the model assigned probability0 contradicts that exclusion and has infinite model surprise. “Surprising” here means improbable under a stated model. It does not measure emotional significance, usefulness, truth or how random a string looks.

**Checkpoint.** A model assigns probability1 to A and0 to B. What does observing each one reveal?

<details><summary>Compare your reasoning</summary>

Observing A supplies −log₂1=0bits under this model: it was completely predicted. Observing B exposes a support error and gives infinite model surprise. The model's exclusion does not prove B impossible in reality.

</details>

## 2. Average over what actually happens

One rare outcome can be very surprising while making only a small contribution to an average. Weight its price by how often it occurs.

[[E05]]

Each rectangle has width P(x), height −log₂P(x), and area equal to their product. A contributes.5×1=.5bit per draw; B contributes.25×2=.5; C and D each contribute.125×3=.375. The four areas sum to **1.75bits per symbol**. Giving every category equal weight would incorrectly produce(1+2+3+3)/4=2.25.

**Shannon entropy** is this expected surprisal when the same distribution supplies both frequencies and prices:

$$H_b(P)=\mathbb E_{X\sim P}[-\log_bP(X)]=-\sum_xP(x)\log_bP(x).$$

Expectation means multiply by the probability and add. Entropy concerns uncertainty before the draw, rather than the surprise of one particular outcome.

A biased coin makes the distinction particularly clear.

[[E06]]

At heads probability.9, a rare tail has about3.322bits of surprise but occurs only.1 of the time. Its weighted contribution is about.3322. Heads contributes about.1368, giving entropy.468996bits. Change the heads probability in the investigation: the picture separates each outcome's price from its contribution, then locates their total on the entropy curve. Swapping.9 and.1 changes which outcome is rare but leaves the total unchanged. A fair coin has one bit.

The following complete standard-library programme computes that average. Save it as `entropy_coin.py` and run `python entropy_coin.py`. It was executed in the retained Python3.12 verification; this lesson preserves that source and rounded result.

[[PROGRAM:coin]]

The two terms directly match the two contribution rectangles. This small fixture uses positive probabilities. At a boundary, the entropy sum uses the limit0log0=0; it does not evaluate log0 or pretend that the excluded event's surprise is zero. A distribution certain of one outcome has entropy0. For m equally likely outcomes every price is log_b m, so the weighted average is also log_b m. Section5 will prove that no finite distribution on those m labels has greater entropy.

### Deeper: why mixing laws can create uncertainty

Compare two certain but different outcomes with a random choice between their laws.

[[E07]]

Each certain law has entropy0, but an equal mixture of them is a fair bit with entropy1. The curve lies above the chord joining the component entropies. More generally entropy is **concave** in a finite probability vector. The summand g(p)=−p ln p has second derivative−1/p for p>0; summing these concave terms preserves concavity, and the continuous endpoint limit handles zero masses. Mixing laws and averaging their separate uncertainty are different operations.

## 3. Turn information into actual binary words

We now need an actual message the receiver can decode. Assign a binary string to each status symbol.

[[E08]]

The root is the start of a word. A0-edge or1-edge chooses a branch. The leaves name A=0, B=10, C=110 and D=111. A **codeword** is the complete bit string from root to its leaf. This code is **prefix-free**: no complete word is the beginning of another complete word. An internal node therefore cannot also be a symbol leaf. The receiver must know this same codebook.

Follow a full stream and see where the receiver can emit a symbol.

[[E09]]

After each leaf, decoding returns to the root. The boundaries in the displayed stream are obtained by this rule; separators are not transmitted. The constructed message `AAAABBCD` contains the source proportions exactly. Its stream `00001010110111` uses14bits for8symbols, or1.75bits per symbol. Fixed two-bit words would use16bits.

The live investigation starts with the complete decoded result visible. Edit the message, then inspect any bit's path and output. A changed message changes the realized length; it does not change the source's expected length. The complete small codec shows the same operation:

[[PROGRAM:prefix]]

Read the decoder from its codebook check to its loop. It accumulates an unfinished prefix, emits only when that prefix equals a complete word, and rejects an impossible continuation or an unfinished ending. The final `11` has reached an internal node and cannot yet identify C or D. The printed error is the actual failed operation's result.

This fixed A–D implementation scans possible prefixes for clarity. For a larger alphabet, a tree decoder consumes each received bit once, O(B) visits for B stream bits plus output storage. The actual heap construction, sibling-exchange proof and tree decoder are taught in [Greedy Algorithms, section6](/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code). A Huffman tree is built in O(KlogK) heap operations for K symbols. Reuse that implementation when constructing a codebook; our small codec explains the information accounting rather than a general file format. Framing, metadata and a deterministic single-symbol alphabet need their own conventions.

Compare code assignments using the same source probabilities.

[[E10]]

The matched leaf depths1,2,3,3 give expected length.5×1+.25×2+.125×3+.125×3=1.75. This equals entropy because each probability is exactly2 to a negative integer. Reassigning long words to common symbols raises the expectation. A specific message can still favour another assignment: a single D uses3bits under the matched code and2 under a fixed-width code. Expected cost is not a guarantee for every realized string.

Ideal information lengths are usually not integers.

[[E11]]

For probability.9 the ideal price is about.152bits. A nontrivial two-symbol binary prefix code nevertheless needs at least one digit per individual symbol. For a finite alphabet, an optimal expected prefix-code length L* obeys

$$H_2(P)\le L^*<H_2(P)+1,$$

allowing the empty word for a deterministic single-outcome source. The upper construction rounds each positive outcome's ideal length upward: ℓ_x=⌈−log₂P(x)⌉. These lengths satisfy the prefix-capacity budget Σ2⁻ˡ≤1. Rounding adds less than one bit on average. This is a feasible bound construction; it need not be the optimal Huffman code. We will prove the lower bound after developing KL in section5.

### Deeper: share the rounding overhead across a block

Group n independent source symbols and give the entire block one codeword.

[[E12]]

The ideal information of an independent block adds to nH(P). Applying the same prefix bound gives nH≤L_n<nH+1, hence H≤L_n/n<H+1/n. The less-than-one-bit overhead belongs to the entire block; dividing by n spreads it across the symbols. This can approach entropy without assigning a fraction of a physical digit to one isolated symbol.

[[PROGRAM:blocks]]

The programme enumerates each block, computes its exact rational probability, and finds the first integer length whose capacity2⁻ˡ is no greater than that probability. It checks the Kraft budget using fractions. For this.9 source, the n=1 ceiling construction costs1.3bits per symbol, worse than the optimal one-bit binary code. At n=8 its rate is.550054 against entropy.468996; the stated upper bound is.593996. The bound does not require every particular sequence of block sizes to improve monotonically.

Enumeration here takes2ⁿ block visits, deliberately limited to n≤8 to inspect the theorem. It is not a scalable compressor. Dependent sequences use their joint/conditional probabilities; nH for independent draws cannot be substituted merely to simplify a calculation. Actual compression also includes framing, metadata, finite precision and any cost of learning an unknown source.

## 4. Let one distribution supply outcomes and another supply prices

Keep the device's source P, but let a model Q believe the statuses occur in almost the opposite pattern.

[[E13]]

The category identities and order remain A,B,C,D. Source weights are P=(.5,.25,.125,.125); model probabilities are Q=(.125,.125,.25,.5). Each P width now pays the corresponding −log₂Q price. A becomes expensive because Q wrongly calls it rare. These prices3,3,2,1 produce total.5×3+.25×3+.125×2+.125×1=**2.625bits per symbol**.

This expected model price is **cross-entropy**:

$$H_b(P,Q)=\mathbb E_{X\sim P}[-\log_bQ(X)]=-\sum_xP(x)\log_bQ(x).$$

The first argument supplies the expectation. Comparing probabilities in mismatched category orders would charge the wrong events. In our dyadic example the prices are actual prefix lengths; for a general Q they are ideal logarithmic costs, approached through suitable coding with overhead.

Place that2.625-bit cost beside P's own1.75-bit entropy.

[[E14]]

The difference is.875bits. We call it **Kullback–Leibler divergence**, or KL:

$$D_{\rm KL}(P\Vert Q)=\sum_xP(x)\log_b\frac{P(x)}{Q(x)}=H_b(P,Q)-H_b(P).$$

Each row compares two prices for the same outcome. A contributes.5log₂4=1; B contributes.25; C contributes−.125; D contributes−.25. Individual contributions can be negative: Q prices some outcomes more cheaply. The sum is nonnegative, as section5 proves. The signed ruler shows those terms on opposite sides of zero; they are not another probability distribution or four mistake probabilities.

The investigation lets you change the source weights and model weights separately. Matching Q to P removes every price difference. Swapping their roles changes which law supplies the frequencies. A unit switch rescales all three totals consistently. For a second finite example, this complete Bernoulli programme uses natural logarithms:

[[PROGRAM:bernoulli]]

The printed.611,.765,.154 are entropy, cross-entropy and KL in nats for P(1)=.7,Q(1)=.9. Divide all three by ln2 to obtain bits. No model changes merely because its information unit changes.

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

[[PROGRAM:support]]

The helper skips P=0 before taking logs, handles positive-P/zero-Q explicitly, and computes weighted sums. Its four outputs cover the status mismatch, a one-supported-outcome case, missing support and a certain matching law. Reading a browser's normalized weights as though a strict probability API had accepted them would mix two different contracts. An entered positive weight too small to represent numerically must not silently become an intended mathematical zero.

### Use a library while keeping the same question

SciPy's `entropy(pk,base=2)` computes entropy; with `qk` supplied it computes KL, not cross-entropy. It also normalizes non-unit sums. The complete programme below deliberately validates distributions before calling it, then compares the same quantities with direct sums. Its later rows supply the conditional example we will use in section6.

[[PROGRAM:information_library.py]]

For the four statuses, both routes give H=1.75,CE=2.625,KL=.875bits. The code forms CE=H+KL only in this finite case; it never uses an undefined infinity-minus-infinity subtraction. Its missing-support case remains infinite. Passing weights[2,1] directly to SciPy gives entropy.918295834bits after normalization, while the strict wrapper rejects them as probabilities. Choose the intended interface rather than treating those outcomes as a contradiction. The comparison was executed with NumPy2.3.5 and SciPy1.18.1; the displayed scalar formatting preserves those computed values.

Work is linear in the number of categories for these finite sums. For huge or sparse alphabets, retain only occupied source entries and the required model lookups rather than allocating an enormous dense table. The core operation remains the same weighted price calculation.

## 5. Prove the bound and respect the direction

The negative contributions in section4 can reduce the total, but they cannot make it negative. Start with one ordinary logarithm inequality.

[[E17]]

For t>0, ln t≤t−1, with equality only at1. The difference t−1−ln t has derivative1−1/t: it decreases up to1, increases afterwards and equals zero there. The straight tangent touches the log curve at1 and stays above it.

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

At a common depth d, a word of length ℓ occupies2^(d−ℓ) descendant slots. Distinct prefix-free words cannot overlap those slots. Dividing their total by2ᵈ gives the **Kraft inequality**, K=Σ2⁻ˡ≤1. Choose d at least as large as every finite word length.

Normalize those capacities to another distribution R(x)=2⁻ˡˣ/K. Its price is −log₂R(x)=ℓ_x+log₂K. Average using the actual source P, then subtract its entropy.

[[E22]]

$$L-H_2(P)=D_{\rm KL}(P\Vert R)-\log_2K\ge0.$$

Both pieces are nonnegative: mismatching the normalized capacity distribution incurs KL, and unfilled capacity has −log₂K≥0. This proves why every such prefix code pays at least the entropy. Section3's ceiling construction supplies the other bound. No theorem about an average implies that each short realized message uses exactly its source entropy.

### Direction answers a different question

Exchange the law supplying the expectation.

[[E23]]

KL(P∥Q) averages P's prices; KL(Q∥P) averages Q's. If P=(1,0) and Q=(.5,.5), the forward direction is1bit because Q covers P's one possible outcome. The reverse is infinite because Q draws an outcome P excludes. Different supports alone do not tell us both directions; support inclusion has a direction.

**Checkpoint.** Repair the claim “these supports differ, so both divergences are infinite.”

<details><summary>Compare your reasoning</summary>

Check which law supplies the expectation. For the displayed pair, every P-positive event has positive Q, giving KL(P∥Q)=log₂2=1. Q has positive mass on the second event while P has none, giving KL(Q∥P)=∞.

</details>

In a restricted variational family, reverse-KL minimization can favour concentration in one region of a multimodal target. This depends on the target, family and optimizer; it does not invariably choose one mode. [Variational Inference](/learn/path/full-curriculum/variational-inference?module=math-foundations) contains the actual finite-family and Gaussian comparisons.

Nor is KL an ordinary metric.

[[E24]]

For Bernoulli probabilities.1,.5,.9, in nats, D(.1∥.9)≈1.757780 while D(.1∥.5)+D(.5∥.9)≈.878890. The triangle inequality fails. Labels on the connecting arrows give computed directed costs; drawn segment lengths do not encode those costs. Relabelling categories preserves KL; moving mass between numerically near or far labels has no built-in transport distance. [Optimal Transport](/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations) supplies a geometry-aware comparison.

A finite symmetric alternative is Jensen–Shannon divergence: M=(P+Q)/2, then average KL(P∥M) and KL(Q∥M). The mixture covers both supports, avoiding direct mismatch infinities. It still does not add geometric distances between labels. [f-Divergences & Integral Probability Metrics](/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations) examines how the comparison depends on the intended question.

### Deeper: when subtraction is undefined

Finite probability mass can be spread over infinitely many outcomes in a way that has infinite entropy.

[[E25]]

Normalize p_k proportional to1/[k(ln k)²], k≥2. The probability series converges by the integral test, while its entropy diverges like Σ1/(k ln k). Partial sums in a drawing only illustrate the different tails; they are not a numerical proof of convergence or divergence.

For Q=P, every supported ratioP/Q is1 and KL=0. Yet H(P,Q)−H(P) would be∞−∞, an undefined subtraction. The ratio definition is primary. On general spaces, KL uses the expected log density ratio when P is absolutely continuous with respect to Q—every Q-null measurable set is also P-null—and is infinite otherwise, with the required integrability conventions. Do not turn two divergent quantities into a claimed finite difference.

## 6. Predict with the information you have

A classifier sees features X before predicting a label Y. Its report Q(y|x) is a distribution over labels for that context. Begin with one observed label.

[[E26]]

The **one-hot target** puts probability1 on the observed correct class and0 on the others. Multiplying model log prices by those target weights selects just one price, −log Q(y|x). A soft target instead distributes its weights across classes; its loss is the weighted sum of those same prices. Neither target vector is a second set of logits.

To ask about expected prediction cost, we must also account for how frequently each context occurs.

[[E27]]

The initial joint table uses a fair context bit X. The label agrees with X with probability.9, while the model reports agreement probability.8. Select either row: divide its joint masses by its context mass. Price the resulting label probabilities using that row's model, then multiply its row cost by the context mass before adding the rows.

With label-flip probability.1, each true row has entropy h₂(.1)≈.468996bits. Each model row costs −.9log₂.8−.1log₂.2≈.521928bits, an excess.052933. The label histogram is balanced, H(Y)=1bit; knowing X improves the relevant baseline to H(Y|X). If Y always equalled X, that remaining uncertainty would be zero even though the marginal labels stayed balanced.

For each positive-probability context, cross-entropy equals entropy plus KL. Weight those identities by P_X(x):

$$
\mathbb E_{(X,Y)\sim P}[-\log Q(Y|X)]
=H_P(Y|X)+\mathbb E_{X\sim P_X}D_{\rm KL}(P(\cdot|X)\Vert Q(\cdot|X)).
$$

**Conditional entropy** is that context-weighted average remaining uncertainty. It is generally different from entropy of the overall label histogram. A context of probability zero contributes nothing to the expectation; its conditional distribution is not defined by dividing zero by zero.

[[PROGRAM:conditional]]

This complete standard-library programme visits all four joint outcomes and directly weights their losses. Its initial symmetric rows have the same cost. Changing only their frequency therefore leaves their correctly weighted average unchanged. That is a useful null result, but it can conceal an incorrect routine that averages the row costs equally.

Switch the investigation to **unequal row costs**. Context masses are now(.75,.25), with P(Y=1|X=0)=.1 and P(Y=1|X=1)=.5. Let the model report those truthful conditionals. The joint rows are(.675,.075) and(.125,.125). Their entropies are.468995594 and1bit, so the correct average is

$$.75(.468995594)+.25(1)=.601746695\text{ bits}.$$

An incorrect uniform average gives(.468995594+1)/2=.734497797. The drawing shows both row costs and both context multipliers before joining the contributions. Change the second context mass to.5: the two averages then agree. At mass0, the answer is just.468995594 and the absent context is explicitly unavailable. The conditional portion of `information_library.py` in section4 performs both the direct joint sum and SciPy row entropies with `axis=1`, followed by the actual context weights. The axis chooses what is summed; it does not supply the correct context frequencies by itself.

Conditioning helps on average, but one observed context can make the remaining uncertainty larger.

[[E28]]

Let independent fair bits A and B produce Y=A OR B. Before seeing A, Y=1 has probability.75 and H(Y)≈.811278bits. If A=0, Y=B is a fair bit with entropy1; if A=1, Y is certain with entropy0. The contexts occur equally often, giving average.5. The increase in the first slice does not contradict the average reduction. [Mutual Information & Information Bottleneck](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations) develops that reduction as a measure of dependence.

The same multiplication rule explains the entropy **chain rule**. Start from P(x,y)=P(x)P(y|x), take negative logs and average over the joint law:

$$H(X,Y)=H(X)+H(Y|X).$$

Identifying the pair costs the information in X plus the average remaining information in Y once X is known. We have not assumed X and Y independent.

For observed data, connect these prices to the probability assigned to the whole record.

[[E29]]

If observations are modeled as conditionally independent given their inputs and shared parameters θ, their conditional likelihood is ∏ᵢQ_θ(yᵢ|xᵢ). Negative log turns that product into a sum. Dividing by fixed positive n changes the scale but not the minimizing parameter:

$$\operatorname*{argmax}_{\theta}\prod_{i=1}^{n}Q_\theta(y_i|x_i)
=\operatorname*{argmin}_{\theta}\frac1n\sum_{i=1}^{n}-\log Q_\theta(y_i|x_i).$$

This is the connection to [Maximum Likelihood](/learn/path/full-curriculum/maximum-likelihood-map-estimation?module=math-foundations). An autoregressive sequence handles dependence with conditional factors Q(y_t|earlier context); tokens need not be independent. Omitting dependence without modeling it gives the objective a different statistical meaning. A lucky finite observed sample may have lower average loss than population conditional entropy; the entropy-plus-KL inequality concerns the full expected risk.

## 7. Compute and interpret log loss

A neural classifier often supplies one real-valued score per class. These **logits** must become probabilities, but computing enormous exponentials is unnecessary.

[[E30]]

For z=(1000,998,996), subtract the largest score1000 from every entry, producing(0,−2,−4). Exponentiate those shifted scores and add them. The sum is1+e⁻²+e⁻⁴; its logarithm is about.142932. Each log probability is its shifted score minus that common log sum. The last class therefore has log probability−4.142932 and loss4.142932nats.

Softmax is Q_j=e^(z_j)/Σ_ke^(z_k). A common added constant multiplies numerator and denominator by the same factor and cancels. With m=max_jz_j and s=Σ_je^(z_j−m), compute

$$\log Q_j=(z_j-m)-\ln s,\qquad \ell(z,y)=(m-z_y)+\ln s.$$

Keep these grouped subtractions. Computing a huge common log normalizer and subtracting it afterwards can lose precision. The investigation preserves the class identities through logits, exponentials, normalization and target selection. Change a score, add a common shift or change the target; the last operation chooses a price rather than changing the model.

Even a stable probability can underflow when converted out of log space.

[[E31]]

For logits(0,−1000,−2000), the last probability rounds to zero in floating arithmetic. Its log probability can still be represented as−2000, and its loss is2000nats. Taking log of the separately rounded zero would incorrectly turn this finite-logit result into infinity.

[[PROGRAM:logits]]

The first two score vectors differ by a common1000 and have the same printed log probabilities. The last vector follows the log path directly. Work is O(C) per row for C classes. Stable evaluation does not repair NaN inputs, unrepresentable differences between finite extremes, or a truly excluded class. Those are distinct from ordinary small positive probabilities whose logs remain representable.

The framework interface must describe the same arrays.

[[E32]]

For N examples and C classes, PyTorch `cross_entropy` receives raw logits of shape(N,C). Class-index targets have shape(N,) and dtype`torch.long`. Soft targets are valid probability rows of shape(N,C) with floating dtype. The library does not completely validate their normalization and nonnegativity, so the caller must supply a meaningful target. Applying softmax first feeds probabilities into an API that expects logits and changes the resulting model loss.

[[PROGRAM:torch]]

This preserved programme was executed with PyTorch2.14 CPU. It uses float64, no class weights, no ignored labels and no smoothing. Thus its mean is the ordinary mean of its two class-index losses. The first row changes from hard-target loss.142932 to soft-target loss.942932 because the target now assigns weight to other class prices. The second row keeps its2000-nat cost. `reduction='none'` exposes each example before averaging.

Weights, ignored labels and smoothing alter the scoring or reduction contract; inspect the documented denominator before transferring a hand calculation. For a binary one-logit model the stable interface is `binary_cross_entropy_with_logits`. Names that contain “cross entropy” do not guarantee interchangeable input conventions. Install PyTorch using its [official platform instructions](https://pytorch.org/get-started/locally/); the optional SciPy programme needs NumPy and SciPy. Python files include their own imports and data except the explicitly supplied CSV beside the observed-data programme.

### Confidence changes what accuracy cannot see

Give two models exactly the same ten binary test cases.

[[E33]]

Model A assigns correct-label probability.6 on cases1–8 and.4 on9–10. Model B gives.99 on1–8 and.01 on9–10. With threshold.5 and no ties, both get8/10 correct. Their log prices differ sharply: B saves a little on eight already-correct cases and pays about4.605nats on each confidently wrong one.

The mean losses are −[8ln.6+2ln.4]/10≈.591919nats for A and −[8ln.99+2ln.01]/10≈.929074 for B. The drawing uses actual heights and numeric prices, including small positive costs; it does not impose a misleading minimum visible bar height.

[[PROGRAM:evaluation]]

The programme stores all ten probabilities and uses the same denominator for both models. Its threshold-based accuracy is appropriate for this binary, no-ties fixture. In a multiclass problem compare the predicted argmax with the correct label; correct-label probability need not exceed.5 to be the largest class probability.

Turn the average log price back into a probability-like scale.

[[E34]]

**Perplexity** is b raised to the average base-b log loss. For natural logs,

$$\operatorname{PP}=\exp\left(-\frac1n\sum_i\ln Q(y_i|x_i)\right)
=\left(\prod_iQ(y_i|x_i)\right)^{-1/n}.$$

It is the reciprocal geometric mean probability assigned to the actual outcomes. A uniform m-way model has perplexity m. A general value20 is an equivalent uniform cost, not a claim that every context presents exactly20 candidates. The programme gives A about1.807453 and B about2.532164.

For language models, compare like tokenization, text, context rules and averaging. A different number of tokens changes the unit “per token.” Aggregate total negative log likelihood and total scored-token count for a token-weighted mean; averaging sentence perplexities does not perform that operation. A zero-probability observed event gives infinite perplexity.

### Score a small observed dataset

We can use actual field records to inspect context-aware prediction costs. The Palmer penguin data describe penguins observed in a study of body size, sex and foraging-related ecological differences. The collectors' scientific question was not our classification exercise; this small example asks only how island information affects species prediction on a declared year split.

[[E35]]

The supplied `penguins.csv` contains344rows. We use species, island and year, which are complete in these records. Missing body measurements do not justify dropping rows for this question. Use2007–2008 for training,224rows, and2009 for the held-out comparison,120rows. The fixed three species are Adelie, Chinstrap and Gentoo; islands are Biscoe, Dream and Torgersen.

Training species counts are(100,44,80). A global model adds one count to each species and divides by227. A context model adds one to every species within each island and divides by that island's training count plus3. Its training counts are Biscoe(28,0,80), Dream(36,44,0), Torgersen(36,0,0). Additive smoothing is an explicit model change that gives all three species positive predicted probability; its strength is fixed at1 before using the test labels.

Select the predicted probability for each held-out record, then sum its loss.

[[E36]]

The test island counts are Biscoe(16,0,44), Dream(20,24,0), Torgersen(16,0,0):60,44and16rows. The global model's mean loss is1.518341224bits, accuracy.433333333 and perplexity2.864614937. The island model's mean loss is.805893591bits, accuracy.7 and perplexity1.748228292. These are results for these records and this specified split, not universal rankings of methods or a random census of Antarctic penguins.

[[PROGRAM:penguins_log_loss.py]]

Place the supplied CSV beside the programme and run `python penguins_log_loss.py`. Python's `csv` reader and `Counter` expose the training counts; no hidden fitting API is needed for this categorical model. NumPy/SciPy calculate the same finite entropy and KL quantities per held-out island. The measured run used Python3.12.14, NumPy2.3.5 and SciPy1.18.1.

The final check forms a **descriptive empirical distribution** from the test labels. It does not use that distribution to fit either prediction model. Its context-weighted entropy is.782798115bits, the island model's cross-entropy.805893591, and their KL gap.023095476. Each island's entropy uses its test histogram, then the average uses actual test weights60/120,44/120,16/120. An unweighted average of island costs would answer a different sampling question.

The programme fits counts in O(number of training records) and scores each held-out row with one lookup. Dense storage is the small island-by-species table. For a future island absent from training, a prediction rule would need an explicit fallback; the provided split has every test island represented in training. Changing smoothing after looking at test scores turns that set into development information. Field-study selection, pairs and other dependence also limit what this one year split can establish about another population. Keep the collectors' sampling question separate from the didactic prediction task.

The offline CSV is the CC0 Palmer penguins simplified dataset maintained by [Allison Horst and colleagues](https://allisonhorst.github.io/palmerpenguins/). The underlying study is [Gorman, Williams and Fraser2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081). Its retrieved bytes and selected fields are recorded with the supplied file; no network request occurs when running the programme.

Lower held-out log loss means a higher geometric mean probability on the same observed outcomes. It does not alone guarantee better accuracy, subgroup calibration, fairness, robustness after shift or decisions under asymmetric costs. A log-loss anomaly score is not automatically a p-value or a diagnosis of a cause.

### Deeper: price differences accumulate as evidence

Follow the actual signed model-price differences along a sequence.

[[E37]]

For specified models P and Q, the log likelihood ratio is Σ_tlog[P(event_t|past)/Q(event_t|past)]. In an independent finite source P, its expectation after n draws is nKL(P∥Q). The expected price gap therefore accumulates between those models. A realized sequence can include negative increments or have a negative total; an expectation is not a guarantee of a monotone trace. Dependence must be represented in the conditional factors rather than ignored.

## 8. Change continuous units without changing the experiment

For a numerical measurement, a density describes probability per unit coordinate. It is not the probability assigned to one exact value.

[[E38]]

Take X uniform over[0,.25]metres. Its density is4per metre, and the middle-half interval has width.125metres, giving probability4×.125=.5. A density can exceed1 while every event probability remains valid. Under a continuous density law, a singleton has zero probability even where the density is positive.

For a density f relative to the chosen Lebesgue coordinate measure, **differential entropy** is h(f)=−∫f(x)log f(x)dx when that integral is defined. Lower-case h distinguishes it from discrete H. It can be negative, infinite or undefined; the finite-alphabet bounds do not transfer unchanged. A uniform interval of width w has h₂=log₂w, so the present coordinate convention gives−2. This is not “negative digits to transmit an exact real number.”

In centimetres, the same physical interval is[0,25], with density.04per centimetre. Let Y=aX,a>0. Since dy=a dx, preservation of interval probability requires f_Y(y)=f_X(y/a)/a. Substituting into the entropy integral gives h(Y)=h(X)+log a under the needed existence and finiteness conditions. At a=100, h₂ changes from−2 to4.643856 while the same physical event still has probability.5. The live investigation keeps both the coordinate unit and density unit beside their rulers.

Now change what is recorded, rather than just its numerical unit.

[[E39]]

Split the physical interval into four equal bins. Each bin label has probability.25, so its discrete entropy is2bits. For N equal aligned bins, Δ=w/N and

$$H_2(\text{bin})=\log_2N=h_2(X)+\log_2(1/\Delta).$$

This equality is exact for the displayed uniform case. Doubling the number of bins adds one bit of bin-label entropy. Merely converting metres to centimetres scales both w and Δ and does not change the bins or their probabilities. A related fine-binning approximation can hold for suitably regular densities, but not universally for atoms, irregular bins or divergent integrals.

KL behaves differently from the two density entropies taken separately.

[[E40]]

Compare P and Q using densities f and g relative to the same coordinate measure:

$$D_{\rm KL}(P\Vert Q)=\int f(x)\ln\frac{f(x)}{g(x)}\,dx.$$

Under the same invertible smooth coordinate change, both density heights acquire the same inverse Jacobian factor. Those factors cancel in the ratio, and the probability element f(x)dx is preserved. Hence KL stays invariant. Differential entropy and differential cross-entropy separately change. For a general invertible smooth map, h gains the expected log absolute Jacobian determinant when the change-of-variable and integrability hypotheses hold.

[[PROGRAM:continuous]]

The complete programme keeps four physical bins and reports H(bin)=2bits in both units. It also compares P=Normal(0,1²) with Q=Normal(1,2²). KL is.443147nats before and after multiplying both means and standard deviations by100. Scaling only one distribution would be a different comparison.

### Deeper: derive Normal KL and compare measures honestly

Expand the two nondegenerate Normal log densities. Under P, E[(X−μ_P)²]=σ_P² and E[(X−μ_Q)²]=σ_P²+(μ_P−μ_Q)². Their normalizing constants give ln(σ_Q/σ_P); the averaged quadratic terms give

$$D_{\rm KL}(P\Vert Q)=\ln\frac{\sigma_Q}{\sigma_P}-\frac12+
\frac{\sigma_P^2+(\mu_P-\mu_Q)^2}{2\sigma_Q^2}.$$

Both standard deviations must be strictly positive. A degenerate point mass is not handled by substituting zero into this formula. Nor does one isolated zero of a density establish a support mismatch: the measure question is whether a Q-null measurable set has positive P probability.

Compare a finite empirical dataset with a smooth continuous model.

[[E41]]

The empirical distribution puts positive mass on its observed points; together that finite set has empirical probability1. A continuous density model gives the same finite set probability0. Thus KL from the empirical point-mass measure to that continuous law is infinite. Empirical average negative log density can still be a useful likelihood objective, but it is not a finite KL for those two measures.

A common fixed binning or smoothing changes the model and can supply a meaningful discrete comparison. For an underlying continuous density P with suitable finite entropy and cross-entropy, its population expected log density still obeys the valid entropy-plus-KL identity. [Measure Theory](/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations) explains densities relative to a reference and mixed or singular laws.

## 9. Use KL to certify a maximum-entropy model

Suppose a count can be0,1or2. We know its mean but do not know all three probabilities.

[[E42]]

A point in the triangle represents(q0,q1,q2), three nonnegative coordinates summing to one. The vertex labelled0 is the certain count0 law; the other vertices are certain1and certain2. The interior distributes probability among all three outcomes. The triangle is a map of probability laws, not the physical location of a count.

Add the mean constraint E[X]=10/7.

[[E43]]

The admissible laws lie on a line through the triangle. Let t=q2. Solving q0+q1+q2=1 and q1+2q2=10/7 gives q=(t−3/7,10/7−2t,t). Nonnegativity restricts t to[3/7,5/7]. The constraint leaves a real choice; it does not already determine the distribution.

**Maximum entropy** chooses the feasible distribution with the largest Shannon entropy on this specified alphabet. This is a modeling rule relative to stated outcomes and constraints, not proof of the physical process. Try p*=(1,2,4)/7. Its masses sum to one and its mean is(2+8)/7=10/7.

Compare the same feasible point in probability space and on the entropy curve.

[[E44]]

The live parameter t means q2, not Euclidean distance along the line. The linked views locate one law and its entropy. At t=3/7, q=(0,4/7,3/7), entropy.985228bits. At t=5/7, q=(2/7,0,5/7), entropy.863121. The interior candidate p* has1.378783. A sampled plot suggests a maximum, but a proof must cover every feasible law.

Here p*(x)=2ˣ/7, so log₂p*(x)=x−log₂7. Every feasible q has the same expected x,10/7. Its cross-entropy against p* is therefore fixed at log₂7−10/7. Hence

$$D_{\rm KL}(q\Vert p^*)=\log_27-\frac{10}{7}-H_2(q)
=H_2(p^*)-H_2(q)\ge0.$$

This certifies the **global maximum** and identifies its gap for every feasible q. Equality occurs only at p*. We did not merely find a stationary point or inspect a dense grid.

[[PROGRAM:maximum]]

The programme visits the two endpoints and the proposed optimum and verifies the same identity numerically. A small cleanup handles floating subtraction near an exact zero in this fixed fixture. Such cleanup is not a replacement for feasibility checks in an arbitrary solver: normalization and the specified mean must both hold.

The general connection comes from [Exponential Families](/learn/path/full-curriculum/exponential-families-sufficient-statistics?module=math-foundations). With equal base weights on a finite support, p_η(x)=exp(ηT(x)−A(η)). If a positive member has the desired mean E[T]=m, then E_q log p_η=ηm−A(η) is fixed over every feasible q. The same KL identity certifies that member's entropy maximum. Our three-count example uses T(x)=x and η=ln2.

### Deeper: feasible boundaries and reference weights

Change the required mean and watch the feasible line move.

[[E45]]

For any mean m∈[0,2], q=(1−m+t,m−2t,t) with max(0,m−1)≤t≤m/2. The means0and2 leave only their corresponding vertices. Interior means have positive maximizers; endpoint point masses require η→−∞ or+∞, not finite η. On a nonempty finite simplex slice, continuity and compactness give an attained maximum, while strict concavity gives uniqueness. This does not establish existence of a finite optimizer for every unbounded continuous moment problem.

The base weights in an exponential-family model matter as well.

[[E46]]

For p_η(x)=h(x)exp(ηT(x)−A(η)) with positive nonuniform h, log p includes log h. With a fixed moment m,

$$D_{\rm KL}(q\Vert p_\eta)=A-\eta m-[H(q)+\mathbb E_q\log h].$$

Thus the certified objective is H(q)+E_qlog h. If r=h/Σh, that objective equals−KL(q∥r)+logΣh; it is entropy relative to those base weights, generally not ordinary Shannon entropy.

For count outcomes0,1,2 and h=(1,2,1), η=0 gives p=(.25,.5,.25), mean1 and entropy1.5bits. The uniform distribution has the same mean and greater ordinary entropy log₂3≈1.584963. But the base-relative objective is2for p and log₂3+1/3≈1.918296 for uniform. The programme's final two lines expose the ordinary-entropy counterexample, while the drawn base slots explain the extra weighting.

A moment constraint fixes the expected log price of the matching exponential-family candidate; nonnegative KL turns that fact into a certificate. This mathematical conclusion does not require an additional slogan about making the “fewest assumptions.”
