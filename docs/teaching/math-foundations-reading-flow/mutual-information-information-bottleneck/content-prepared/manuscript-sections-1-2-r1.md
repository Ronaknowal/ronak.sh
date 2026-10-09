# Mutual Information & Information Bottleneck

Two sensors can produce equally long streams while answering very different questions. One may reveal a fault; another may mostly record an irrelevant lighting change. We first measure how an observation changes a probability law. Then we design a representation that preserves the distinctions useful for a chosen task.

Use joint and conditional probability, weighted averages and logarithms from Probability and Entropy. We reconstruct the necessary table operations here. The finite optimization section later uses a derivative under a normalization constraint; the neural computation reconnects the Gaussian pathwise derivative from Variational Inference. The first five sections establish the central ideas. The later sections retain the algorithms, derivations, continuous cases and estimation limits, with complete code beside the mechanism it implements.

## 1. Measure the value of an observation

In the preceding Entropy example, two bits agreed 90% of the time. Here we deliberately choose a noisier observation: a binary feature X agrees with a fair target bit Y 80% of the time. X names the observation; Y names the label we want to infer. The picture describes the complete declared probability law, not four collected samples.

[[M01]]

The pair (X=0,Y=0) has probability .4, as does (1,1). Each disagreement has probability .1. These four possibilities exhaust the experiment, since their probabilities sum to one. Adding the two cells with Y=0 gives .5; adding the Y=1 cells also gives .5. Before looking at X, either label is equally likely and H(Y)=1 bit.

An observation retains one row of this joint table. To turn its remaining masses into probabilities, divide by that row's total.

[[M02]]

For X=0, the retained masses are .4 and .1, with total .5. Dividing each by .5 gives P(Y=0|X=0)=.8 and P(Y=1|X=0)=.2. For X=1, the conditional probabilities are (.2,.8). The vertical bar means “given”; it changes the reference population to the selected row. A row with zero probability has no conditional distribution determined by this law, so the display labels it unavailable rather than inventing an all-zero probability vector.

Each conditional label distribution has entropy h₂(.2), where h₂(p)=−p log₂p−(1−p)log₂(1−p). As before, a zero-mass term contributes zero by its limit. We must weight the row entropies by the probability of encountering each observation.

[[M03]]

Here both row weights are .5 and both row entropies are .721928095 bits. The weighted contributions are .360964047 bits each, giving H(Y|X)=.721928095 bits. The bracket between the initial one bit and this conditional total is .278071905 bits. This average reduction is **mutual information**, abbreviated MI:

$$
I(X;Y)=H(Y)-H(Y\mid X),\qquad
H(Y\mid X)=\sum_x p(x)H(Y\mid X=x).
$$

MI is a property of the joint probability law. It is not the success rate of one classifier, the number of input features, or evidence that one variable caused the other. The .278 bits describes expected uncertainty removed; it does not say that 27.8% of labels are correct.

Equal row entropies can hide an incorrect implementation. The later practice table (.45,.15; .10,.30) has unequal row masses (.6,.4), but both normalized rows have entropy .811278124 bits. A wrong uniform average happens to agree there. To expose the error, use joint rows (.675,.075) and (.125,.125). Their masses are .75 and .25, and their conditional label laws are (.9,.1) and (.5,.5). The correct remaining uncertainty is .75×.468995594+.25×1=.601746695 bits. A uniform average gives .734497797 bits because it overweights the rarer, more uncertain context. The unequal-entropy preset draws both actual multipliers; it keeps its whole table fixed while you select a row.

The binary-channel preset allows source prevalence and channel error to change. Every joint cell, row weight and conditional entropy follows that new law. Reset returns to the fair 80%-agreement law. The later product-law view shares this state; scrolling to it does not create a second experiment.

“Observation reduces uncertainty” is an average statement. Consider independent fair bits U,V and let Y=U OR V: Y is one unless both inputs are zero. The following partition shows why an individual observation can do the opposite.

[[M04]]

Three of the four equally likely pairs give Y=1, so the initial entropy is h₂(.75)=.811278124 bits. If U=0, the label is exactly the still-fair V, with entropy one bit: this observation increases uncertainty. If U=1, Y is certainly one, with entropy zero. Each U case occurs half the time, so H(Y|U)=.5 bits and I(U;Y)=.311278124 bits. Averaging over the declared observation law is essential.

A feature can also be perfectly informative while a particular decision rule is always wrong. Set the binary channel's error to one and follow the two crossed paths.

[[M05]]

Now X=0 means Y=1 and X=1 means Y=0. Copying X as the predicted label has zero accuracy; inverting X is perfect. The conditional entropy is zero and MI is one bit. Information concerns the distinctions a suitable decoder could exploit, not whether a chosen decoder uses the right correspondence. At error .5 the two rows are identical, so observing X changes nothing and MI is zero. At errors zero and one, the correspondence differs but the information is equally complete.

## 2. Compare the pairing with independence

The conditional calculation starts with one row at a time. A second view asks how the whole pairing differs from a law in which X and Y are independent while keeping their marginal distributions unchanged.

[[M06]]

For the fair 80%-agreement example, both marginals are (.5,.5). Multiplying a row mass by a column mass gives .25 in every independent-reference cell. The actual joint law has .4 on the agreement cells and .1 on the disagreement cells. Its dependence lives in which values occur together, even though its row and column totals match the reference exactly.

Take one positive joint cell and compare its probability with that independent-reference probability. A logarithm measures the relative change on the same additive scale used for information prices.

[[M07]]

For an agreement cell, .4/.25=1.6 and log₂(1.6)=.678071905 bits. For a disagreement cell, .1/.25=.4 and log₂(.4)=−1.321928095 bits. The signed quantity is **pointwise mutual information**:

$$
\imath(x;y)=\log_2 p(x,y)-\log_2 p(x)-\log_2 p(y).
$$

A negative value says this particular pair occurs less often than the independent reference predicts. It does not contradict nonnegative average MI. Weight the two positive values by .4 each and the two negative values by .1 each: 2×.4×.678071905+2×.1×(−1.321928095)=.278071905 bits. In the linked investigation, selecting a cell traces exactly one of these contributions. Changing the common law updates both this product comparison and the earlier conditional calculation.

The two calculations agree because the same terms regroup. The next drawing aligns the joint, marginal and conditional contributions before cancellation.

[[M08]]

For an occupied cell, p(x,y)=p(x)p(y|x). Substituting this factorization leaves log₂p(y|x)−log₂p(y). Averaging the negative second term gives H(Y); averaging the negative conditional term gives H(Y|X). Thus

$$
\begin{aligned}
I(X;Y)
&=\sum_{x,y}p(x,y)\log_2\frac{p(x,y)}{p(x)p(y)}\\
&=H(Y)-H(Y\mid X)\\
&=D_{\rm KL}(P_{XY}\Vert P_XP_Y).
\end{aligned}
$$

This is also the improvement in expected log loss when predictions use the true conditional label distribution instead of the true marginal label distribution. The KL interpretation supplies nonnegativity and its equality condition: MI is zero exactly when the joint law equals the product law, which is independence.

Support matters when implementing the sum. A zero joint cell contributes zero; skip it before evaluating a logarithm. A positive joint cell necessarily has positive row and column marginals. Their product can nevertheless underflow in floating-point arithmetic if both are tiny. The difference of three logarithms avoids forming that product. Do not “repair” a valid tiny probability by adding an arbitrary epsilon: that changes the law being measured. A general helper should reject negative, nonfinite, nonrectangular and nonnormalized inputs before calculation; the compact preserved example below instead starts with a declared valid table.

Swapping the table's axes or consistently renaming its categories cannot change these weighted ratios. The correspondence, not the category name, carries the information.

[[M09]]

Transposition makes the symmetry I(X;Y)=I(Y;X) visible. This does not make predicting X from Y and predicting Y from X equally easy for a particular model or loss. For finite discrete laws, nonnegative conditional entropy also gives 0≤I(X;Y)≤min(H(X),H(Y)). Seeing the exact value X removes all its discrete uncertainty, so I(X;X)=H(X). If Y=f(X), then I(X;Y)=H(Y); X may still distinguish many inputs with the same Y. The continuous case requires a different treatment, developed in section8.

{{PROGRAM:original}}

The programme first sums rows and columns, then calculates each occupied cell's log contribution. Its second route normalizes each positive row, computes its entropy and multiplies by the row mass. The assertion checks the entropy-difference identity against the joint calculation. Both routes take time proportional to the number of cells; storing the two marginals needs space proportional to the number of rows plus columns. The input table itself remains the dominant stored object.

Change a cell only as part of a complete valid law, then recompute both marginals. Reusing the old marginals would compare the new joint with the wrong reference. The independent practice later supplies a validated helper and a zero-row/tiny-cell debugging case. Bits use log₂; natural logarithms give nats, and one bit equals ln2 nats. We state the units whenever a later implementation changes its log base.
