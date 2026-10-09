## 5. Keep the signal without the nuisance

Data processing describes what an encoder loses. We now choose what it should keep. Declare a new input X=(S,N), containing two independent fair bits. The target Y is S flipped with probability .1. The picture separates the two coordinates before we decide which one matters.

[[M22]]

The four input records 00,01,10,11 each have probability .25. Their conditional label laws are (.9,.1),(.9,.1),(.1,.9),(.1,.9). S is useful for this task; N could represent an irrelevant acquisition setting. The words signal and nuisance are task-relative. If we instead ask for the label N, their roles change.

Compare five actual representation operations on these same four inputs.

[[M23]]

A constant encoder merges all inputs. A signal encoder merges 00 with01 and10 with11. A nuisance encoder groups by the second coordinate. Keeping both coordinates assigns a different codeword to each input. A noisy-signal encoder flips S with probability .2, so each input splits between two codewords rather than entering one fixed group. The small label mixtures inside each codeword show what remains predictable there.

We need two quantities to compare these operations. One asks how many input distinctions survive; the other asks how many task distinctions survive.

[[M24]]

Call R=I(X;Z) the **rate** and T=I(Y;Z) the **relevance**. The constant has (R,T)=(0,0). Keeping S gives (1,.531004406); keeping N gives (1,0); keeping both gives (2,.531004406). The noisy signal gives (.278071905,.173253628). Its codeword entropy is still one bit, but part of that entropy is encoder randomness. For a deterministic finite encoder R=H(Z); for a randomized encoder R=H(Z)−H(Z|X). A random fair codeword independent of X has one bit of entropy and zero input information.

The **information bottleneck** trades these two quantities by minimizing

$$
J(q)=I(X;Z)-\beta I(Y;Z),\qquad \beta\geq0,
\qquad p(x,y,z)=p(x,y)q(z\mid x).
$$

Beta is the relevance weight: increasing it makes task information worth more relative to retained input information. Some papers instead put a coefficient on compression. Check the actual objective rather than inferring the convention from the letter. Now place the candidates on axes for R and T, and draw one line of constant objective.

[[M25]]

With R horizontal and T vertical, J=R−βT rearranges to T=R/β−J/β when β>0. Equal-objective lines therefore have slope1/β. For β=0, J=R and equal-objective lines are vertical. At β=3, signal gives J=−.593013219, both gives .406986781 and constant gives zero. The extra nuisance bit costs one without increasing relevance. The noisy-signal family is drawn as a labelled set of feasible candidates; it is not a certified frontier over every possible encoder.

The investigation changes the selected encoder and the tradeoff weight separately. Changing beta alters the objective assigned to a fixed point; it does not move that encoder's R,T coordinates. A noise control appears only for the noisy encoder whose operation it changes. Selecting a candidate is a comparison, not a claim that a hidden solver found a global optimum.

{{PROGRAM:representations}}

The code constructs each encoder as rows of conditional probabilities, builds p(x,z) and p(y,z), and applies the same finite MI calculation to both. The number of codewords differs between candidates and is explicit in each array. To change the target to N, change its conditional label law and recompute relevance; the encoder's rate stays the same because p(x) and q(z|x) have not changed. The complete source is small enough to audit each assignment against the picture.

Two limits clarify what the objective rewards. The nonnegative region implied by data processing is an inequality constraint, not an algorithm's fitted curve.

[[M26]]

The encoder's Markov condition gives T≤R, so for0≤β≤1,

$$
J=R-\beta T\geq(1-\beta)R\geq0.
$$

An input-independent representation achieves zero and is globally optimal in this range. At β=1, informative equality cases may tie, so the optimum need not be uniquely constant. For larger beta an informative encoder can beat zero. Even a very large beta need not memorize all of X: among equally relevant candidates the positive rate term still favours the one retaining less irrelevant detail.

Neither latent dimension nor MI alone equals a file's serialized bytes, its memory traffic or the length of a single physical message. Operational compression requires additional assumptions about repeated source draws, coding and allowed error. The next lesson makes that question precise. Here the immediate goal is an encoder with useful information under a chosen law and objective.

## 6. Compute a finite bottleneck

The comparison suggests what a good representation could do; we still need to construct one. Keep the four equiprobable inputs and their label laws from section5, and allow two codewords. An encoder is a four-by-two table q(z|x), with each row summing to one. Begin with positive rows (.8,.2),(.6,.4),(.3,.7),(.2,.8). The drawing carries the actual assigned probability mass into each codeword.

[[M27]]

Multiply every encoder row by its source mass .25. Summing these assigned masses down the first column gives p(Z=0)=.475; the second column gives .525. In general p(z)=Σₓp(x)q(z|x). These are codeword frequencies implied by the encoder, not new free parameters. Their sum stays one because each source row contributes its entire probability mass.

To obtain a label predictor inside one codeword, retain the identities of the input fragments that reached it and normalize by the codeword mass.

[[M28]]

For z=0, the source fragments are (.2,.15,.075,.05). Dividing by .475 gives their conditional input weights. Multiplying them by the corresponding label laws and summing gives p(Y=0,z=0)=.3275 and p(Y=1,z=0)=.1475. Normalizing yields p(Y|z=0)=(.689473684,.310526316). For z=1 the joint label masses are (.1725,.3525), so its decoder is (.328571429,.671428571). The general operations are

$$
p(x\mid z)=\frac{p(x)q(z\mid x)}{p(z)},\qquad
p(y\mid z)=\sum_x p(x\mid z)p(y\mid x).
$$

The denominator is necessary: without it, the sum remains a joint mass rather than a probability law within that codeword. A codeword with zero mass has no determined decoder. The demonstrated algorithm uses positive starts and this positive label fixture; it is not presented as a general solver with arbitrary support deletion and revival.

Next compare the label law of one input with the label mixture currently represented by each codeword.

[[M29]]

Their KL divergence d(x,z)=D_KL(p(y|x)‖p(y|z)) is the **predictive distortion**. It measures a mismatch in label distributions, not Euclidean distance between the numeric input labels. Assigning an input to a codeword whose label mixture differs from its own can discard task detail. Common codewords also make a compact description attractive. The update combines those two considerations.

Use the small row example r=(.25,.75), beta2, and predictive distortions (0,ln2) nats to trace one update before returning to the full four-input law.

[[M30]]

The unnormalized weights are .25×exp(0)=.25 and .75×exp(−2ln2)=.1875. Dividing by their sum .4375 gives the new row (4/7,3/7). In the full update r is the current codeword marginal:

$$
a_z(x)=p(z)\exp[-\beta d(x,z)],\qquad
q_{\rm new}(z\mid x)=\frac{a_z(x)}{\sum_j a_j(x)}.
$$

The exponential requires d in nats. With bit-valued distortion, use 2^(−βd) instead. Feeding a displayed one bit directly into exp(−βd) changes the encoder, not just its units. For numerical stability form log weights log p(z)−βd, subtract their row maximum, then exponentiate. Subtracting a common constant multiplies every weight by the same factor and leaves the normalized row unchanged.

The live investigation returns to the complete four-input fixture. Its proposed row uses the current decoder. Applying the update creates a new encoder, which implies a new marginal and a new decoder. Keep those times distinct.

[[M31]]

The distortion table labelled t prices assignments for the transition from q_t to q_(t+1). After that transition, the current assignment bars and objective belong to q_(t+1), while its recomputed decoder is the one used for the next step. Previous/next and the step selector navigate one coherent sequence. Changing beta, label error or initialization regenerates the sequence from its named initial state. Both later mounts share that state; scrolling does not reset it.

### Derive the update and understand its guarantee

Introduce an auxiliary codeword law r(z) and auxiliary label decoder w(y|z). They temporarily stand apart from the distributions implied by q. In nats, define

$$
D_w(x,z)=D_{\rm KL}(p(y\mid x)\Vert w(y\mid z)),\qquad
F(q,r,w)=\mathbb E_{p(x)q(z\mid x)}\left[\log\frac{q(z\mid x)}{r(z)}+\beta D_w(x,z)\right].
$$

The next ruler decomposes this auxiliary objective into the bottleneck objective, a source-law constant and two nonnegative mismatches.

[[M32]]

Add and subtract log p(z) in the first expectation. It becomes I(X;Z)+D_KL(p(z)‖r(z)). In the distortion term, add and subtract log p(y|z). The remaining average difference between input-specific and codeword-specific label laws is I(X;Y)−I(Z;Y), using the Markov condition. Therefore

$$
\begin{aligned}
F(q,r,w)={}&J(q)+\beta I(X;Y)\\
&+D_{\rm KL}(p(z)\Vert r(z))\\
&+\beta\sum_zp(z)D_{\rm KL}(p(y\mid z)\Vert w(y\mid z)).
\end{aligned}
$$

All terms here use one common log base. For fixed q, choose r=p(z) and w=p(y|z) on positive-mass codewords to remove both mismatch terms. At beta0 the decoder term is absent and its minimizer is not unique.

For fixed r,w, each positive-source row of q minimizes Σ_z q_z[log q_z−log r_z+βD_w(x,z)] subject to Σ_zq_z=1. Its derivative is log q_z−log r_z+1+βD_w(x,z)+λₓ. Setting it to zero and normalizing produces the exponential row update. This is a separate block minimization, not a rule to deterministically pick the nearest codeword.

Each exact block minimization cannot increase F. After recomputing r and w from q, both mismatch terms vanish, so F=J+βI(X;Y). The final term is fixed by the original input/label law; consequently complete updates cannot increase J, apart from roundoff. The blocks are not jointly convex. Monotone objective values can stabilize at an inferior stationary encoder.

Compare two initializations on the same scale and inspect the encoders they reach.

[[M33]]

At beta3, the informative start reaches J=−.600834647 after40 updates, slightly better than the deterministic signal encoder's −.593013219. Its rate .948950829 is below one, and its relevance .516595159 is below the deterministic .531004406: the reduction in rate compensates for the relevance loss at this beta. A perfectly symmetric start keeps both codewords identical and stays at R=T=J=0. “Nothing changed” is not a certificate that a better encoder is impossible. These are finite iteration results, not a proof of convergence to a global optimum.

{{PROGRAM:iteration}}

The original scratch programme makes the entire sequence explicit: assigned mass, codeword label mixture, KL distances, shifted row weights and normalized new rows. The assertions check finite descent for its positive fixture. They do not certify every possible input support or every initialization. Preserve the distinction between this local optimization problem and the convex rate-distortion problem in the next lesson; its stronger certificates do not transfer automatically.

The same calculation can use ordinary array operations. Keep the axes visible before reading the broadcasting code.

[[M34]]

Let A be the input alphabet size, K the codeword count and B the label count. q has shape(A,K), the label conditional has shape(A,B), and multiplying q by p(x) gives assigned mass of shape(A,K). Transposing that mass and multiplying by the label table gives p(z,y) of shape(K,B). Its row sums give p(z), and row normalization gives the decoder. For distortions, an(A,1,B) input-label view and a(1,K,B) decoder view broadcast to(A,K,B); summing over the label axis leaves(A,K). The dense update costs O(ABK) arithmetic. The explicit broadcast temporary costs O(ABK) memory, while a looped implementation can avoid storing that temporary and retain the smaller tables.

{{PROGRAM:finite_ib_reference.py}}

This helper contains the exact complete function definitions and fixture constants from the original scratch programme before its demonstration loop. Keeping the executable example outside this helper means importing it does not repeat an unrelated programme. The array programme calls these functions only as the declared comparison route for its new matched run.

{{PROGRAM:finite_ib_numpy.py}}

At steps0,1,4,40 the code compares the entire encoder, marginal and decoder, as well as R,T,J, against the scalar route. It also calculates F with matched auxiliaries and checks F−J=βI(X;Y). Natural-log distortions drive the update; division by ln2 converts the reported information and free energy to bits. The informative and symmetric outputs preserve the earlier finite-run interpretation.

The final SciPy call solves just the two-entry row with fixed r=(.25,.75), distortions(0,ln2) and beta2. SLSQP enforces a unit sum and positive numerical bounds. Its row(.571428570,.428571430) agrees with the exact Gibbs row(4/7,3/7) within the stated tolerance. This comparison verifies an ordinary constrained-optimizer route for that fixed convex row problem. It is not a SciPy implementation or global certificate for the entire nonconvex bottleneck problem. A solver's success flag must be interpreted within the objective and constraints actually supplied.

For huge input alphabets, estimating and storing the necessary laws is itself difficult. We next replace the inaccessible marginal and decoder with tractable distributions, while keeping track of the price of those replacements.
