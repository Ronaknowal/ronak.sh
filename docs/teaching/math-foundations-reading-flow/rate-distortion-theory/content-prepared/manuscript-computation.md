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

{{CODE:finiteOptimizer}}

Now express the same operations as array reductions. The axis is part of the mathematics.

[[D28]]

In the library programme, p has shape (A,), costs and q have shape (A,B), and r has shape (B,). `p[:, None] * q` forms the joint table; summing axis 0 produces the output marginal. `logsumexp(..., axis=1)` normalizes each source row over reconstructions. The independent constrained-solver objective uses H(r)−ΣᵢpᵢH(qᵢ), with `xlogy` preserving the limit 0 log 0=0.

The new fixture has source values and reconstruction values 0,1,3, source probabilities (.7,.2,.1), squared cost, λ=1 and a uniform initial marginal. The scalar reference and array route use the same inputs and update timing. A separate SLSQP call minimizes the same convex objective over nine channel entries with three row-sum constraints. Its success flag is checked together with row feasibility and the objective bracket. We compare objective values, not a claim that every minimizing table must be identical.

Save `finite_rd_library.py` beside the supplied `rd_scalar_helpers.py`. That helper contains exactly the three function definitions taught in the scratch programmes, plus `import math`; it has no demonstration loop. Install NumPy and SciPy in your chosen environment, then run `python finite_rd_library.py`. The recorded execution used Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1.

{{CODE:finite_rd_library}}

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

{{CODE:gaussianAllocation}}

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

{{CODE:gaussian_rd_library}}

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

{{CODE:fidelity}}

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

{{CODE:bitstream}}

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

{{CODE:penguins_quantization}}

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
