## 3. Find information that single features miss

Mutual information compares complete probability laws. It can therefore detect dependence that a summary of linear association misses. Take X equally likely to be −1,0,1 and Y=X². The picture puts each possible observation at its actual coordinates.

[[M10]]

The points are (−1,1),(0,0),(1,1), each with mass1/3. Their symmetry makes E[X]=0 and E[XY]=0, hence covariance zero. Yet X determines Y exactly. The label is zero with probability1/3 and one with probability2/3, so I(X;Y)=H(Y)=h₂(1/3)=.918295834 bits. Zero covariance has not made the variables independent.

Now compress X in two different ways. Follow the actual inputs merged into each output group.

[[M11]]

The magnitude map Z₁=|X| merges −1 and1; both have Y=1. Its other group contains only0, with Y=0. Each group has a single label, so it preserves all the label information. The sign-threshold map Z₂=1[X>0] instead merges −1 with0. This group has probability2/3 and a fair conditional label, while Z₂=1 determines Y=1. Its remaining label entropy is2/3 bit, and its MI is .918295834−2/3=.251629167 bits. A grouping preserves the task when it merges inputs with the same conditional label law, not merely when it has few output values.

{{PROGRAM:nonlinear}}

The code enumerates the three equally likely states rather than estimating a curve from a sample. Its first two moments check the covariance cancellation. Its count-like joint tables then compare the full observation, magnitude and sign grouping through exactly the same MI function. This is linear work in the listed states, followed by the finite table sums. Changing the map means moving each state's probability to its new group; keeping an old marginal would mix two experiments.

A useful combination can also have individually uninformative parts. Let independent fair bits A,B determine Y=A XOR B, which is one when the bits differ. Draw all four pairs and then group them by what has been revealed.

[[M12]]

Every row at fixed A contains one Y=0 and one Y=1, each with equal conditional probability. Every column at fixed B does too. Thus I(A;Y)=I(B;Y)=0, although the pair identifies a single cell and determines Y, giving I((A,B);Y)=1 bit. Rejecting every feature with zero individual MI would discard both ingredients. The investigation's A/B/both selection changes the grouping of this same law; it does not fabricate additional data.

To measure what A adds after B is already known, work inside each B slice and then weight those calculations by the slice probability.

[[M13]]

When B=0, Y=A; when B=1, Y is the inverted A. Each slice has one bit of MI. With slice masses .5 and .5, their average is one bit. This **conditional mutual information** is

$$
I(A;Y\mid B)=\sum_b p(b)D_{\rm KL}\bigl(P_{AY\mid b}\Vert P_{A\mid b}P_{Y\mid b}\bigr).
$$

The joint table inside each KL is normalized within its B slice. A zero-mass slice contributes nothing and has no determined conditional law. Adding and subtracting H(Y|B) gives the chain rule

$$
I((A,B);Y)=I(B;Y)+I(A;Y\mid B).
$$

Revealing B first and A second removes the same total uncertainty as revealing the pair. The incremental term need not equal the unconditional I(A;Y). In XOR it is larger. To see the opposite direction, use a different declared law: X=Y=C, all the same fair bit.

[[M14]]

Before C is revealed, X and Y share one bit. Inside C=0, both are fixed zero; inside C=1, both are fixed one. Consequently I(X;Y|C)=0. Conditioning can reveal or remove dependence. An ordinary three-circle diagram with only nonnegative overlap regions cannot express all these interaction patterns; the actual conditional tables can.

{{PROGRAM:conditional}}

The programme changes the XOR fixture to P(B=1)=.25 while keeping A fair and independent. Y remains fair, but A now has 1−h₂(.25)=.188721876 bits about it; B still has zero and the pair still has one. The code constructs each marginal joint from the same enumerated law. For the conditional calculation it gathers a context's probability, normalizes that context's table, computes its MI, and multiplies by the context probability. This final weighting is the same operation that mattered for conditional entropy in section1.

For sensor pairs, genetic markers or image channels, the practical question is often what another feature adds to the current set. Conditional information asks that question about a specified probability law. Selecting or estimating it from data adds validation requirements, developed in section9. Observational dependence by itself still does not identify the effect of an intervention.

## 4. Follow information through a processing step

We have compared a full observation with deterministic groupings. A representation can also randomize. Let an encoder q(z|x) assign probabilities to output states Z for each observed X. The next picture shows the branching operation itself.

[[M15]]

For each X, the outgoing probabilities q(z|x) sum to one. The label Y follows its own conditional law p(y|x). Our restriction is that the encoder's random draw does not additionally consult Y after X is known. Thus

$$
p(x,y,z)=p(x,y)q(z\mid x)=p(x)p(y\mid x)q(z\mid x).
$$

This is the Markov condition Y–X–Z. The drawn branches describe conditional probability structure; they do not establish causal directions from observational data. In a deterministic encoder one branch per row has probability one. In a randomized encoder several branches may remain possible, even for exactly the same input.

Take fair X, with Y flipping X with probability .1 and Z independently flipping X with probability .2. Trace the paths that make Y and Z disagree.

[[M16]]

Exactly one flip produces disagreement: label flip without encoder flip has probability .1×.8=.08, and encoder flip without label flip has probability .9×.2=.18. Adding gives .26. No flip or two flips gives agreement. The original label information is1−h₂(.1)=.531004406 bits; after encoding it is1−h₂(.26)=.173253628 bits. Their difference is .357750778 bits. The processing investigation changes the two named noise channels while preserving conditional independence. Encoder error zero preserves the original information; error .5 makes Z independent of the task. Label error .5 leaves no original task information to preserve.

The general statement is the **data-processing inequality** I(Y;Z)≤I(Y;X). We can locate its exact gap by decomposing the same joint information in two orders.

[[M17]]

First reveal X, then Z. The Markov condition makes the second revelation uninformative about Y: I(Y;Z|X)=0. Instead reveal Z, then X; the extra information is I(Y;X|Z). The two totals agree:

$$
\begin{aligned}
I(Y;X,Z)&=I(Y;X)+I(Y;Z\mid X)=I(Y;X),\\
I(Y;X,Z)&=I(Y;Z)+I(Y;X\mid Z),\\
I(Y;X)-I(Y;Z)&=I(Y;X\mid Z)\geq0.
\end{aligned}
$$

The lost .357750778 bits in the example is therefore an actual conditional dependence, not just a visual distance between bars. Processing can make an existing pattern easier for a limited classifier to exploit, but under this factorization it cannot increase the population information about Y.

Equality asks whether X can still help after Z is known. Compare the conditional label mixtures of the inputs within one representation group.

[[M18]]

If every input merged into a group has the same label distribution, retaining the original input adds no label information within that group. More generally, equality holds exactly when I(Y;X|Z)=0. Such a representation is sufficient for predicting Y under the specified law. It need not reconstruct X. The earlier magnitude map was sufficient for Y=X², although it discarded the sign of X.

Now change the construction by appending the true label to the representation. The new input edge changes the probability model.

[[M19]]

Z can now depend on Y beyond X, violating p(x,y)q(z|x). Observing information above the earlier bound would not refute data processing; its premise no longer applies. With a learned encoder, evaluate fresh pairs with fitted parameters fixed, or explicitly include training-data and parameter randomness in the joint model. Treating a map trained on labels and those same training observations as an independent fresh experiment can conceal leakage.

{{PROGRAM:processing}}

The programme enumerates all eight (X,Y,Z) combinations using the two independent conditional noise factors. Summing over X yields the Y,Z table. It then calculates the original information, processed information and lost conditional information independently from that full law. The cost is proportional to |X||Y||Z| for this direct enumeration. Its result verifies this declared finite experiment; it does not infer the factorization from an observed correlation.

### Connect remaining information to a decision error

Information measures distributions; classification asks for a label decision. A useful bridge is to choose, for every observed Z, the most probable label. This is the Bayes decoder for zero-one error under a known law. The next picture divides each Z row into correct and incorrect mass for that chosen label.

[[M20]]

For the fair binary table (.4,.1; .1,.4), choose label0 in row0 and label1 in row1. The two discarded cells sum to error probability Pₑ=.2. For the three-label joint with Z rows (.30,.10,.10) and (.05,.25,.20), choose labels0 and1. Correct mass is .30+.25=.55 and Pₑ=.45. Ties use the lowest label index consistently. No decision at a zero-probability observation affects the expected error.

Introduce the error flag E, equal to one when the chosen decision is wrong. Knowing Z and E=0 identifies Y. Knowing Z and E=1 leaves at most K−1 labels, where K≥2 is the number of possible labels. The drawing separates the uncertainty of the flag from the remaining wrong-label choice.

[[M21]]

Because E is determined by (Y,Z), the chain rule gives H(Y|Z)=H(E|Z)+H(Y|E,Z). The first term is at most H(E)=h₂(Pₑ); the second is at most Pₑ log₂(K−1). This yields **Fano's inequality**:

$$
H(Y\mid Z)\leq h_2(P_e)+P_e\log_2(K-1).
$$

This form holds for any deterministic decoder; the Bayes choice makes its error minimal. The fair binary symmetric example reaches equality: both sides are .721928095 bits. In the three-label example, remaining entropy1.365957321 is below the bound1.442774454 bits. The term is log₂(K−1), not log₂K, because an error already excludes the guessed label. Using h₂(Pₑ)≤1 and log₂(K−1)≤log₂K gives the weaker Pₑ≥(H(Y|Z)−1)/log₂K, which may be negative and therefore uninformative. High remaining uncertainty can force errors; this is a distribution-specific relation, not an identity between MI and accuracy.

{{PROGRAM:finite_fano.py}}

The scalar implementation validates a finite normalized joint, chooses a row maximum, sums error mass, and computes conditional entropy with the actual row weights. Its NumPy counterpart applies the same operations to active rows and writes logarithms only where probabilities are positive. Both take O(|Z|K) work. The extra perfect and tied cases expose zero-error and tie conventions. This is an exact known-law calculation; learning those conditional probabilities from data is a separate statistical problem.
