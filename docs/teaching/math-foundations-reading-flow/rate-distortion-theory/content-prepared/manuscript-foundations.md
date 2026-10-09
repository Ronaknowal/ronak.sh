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

{{CODE:blockCode}}

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

{{CODE:biasedChannel}}

The bound and attaining construction determine the complete binary frontier.

[[D13]]

$$R(D)=\begin{cases}H_b(p)-H_b(D),&0\le D<\min(p,1-p),\\0,&D\ge\min(p,1-p).\end{cases}$$

For fair bits, D=.1 requires approximately .531 bits per source bit; D=.25 gives approximately .189. Our finite three-bit code sits at (.25,1/3), above the asymptotic frontier. The gap concerns that particular code, not a failure of the bound. Both degenerate sources p=0 and p=1 need zero rate at any nonnegative budget.

This small original programme evaluates the fair curved branch only at budgets between 0 and .5. Keep that domain when using it: beyond .5, binary entropy decreases again and `max(0, 1-H_b(D))` would incorrectly rise. The feasible constant still exists, so the true rate stays zero. Practice 2 implements the full piecewise rule.

{{CODE:originalBinary}}

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
