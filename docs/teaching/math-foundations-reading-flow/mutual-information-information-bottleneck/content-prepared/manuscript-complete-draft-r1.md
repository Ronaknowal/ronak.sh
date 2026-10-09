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

File: `mi_original.py`

```python
import math

joint = [[0.4, 0.1], [0.1, 0.4]]  # rows: X, columns: Y
p_x = [sum(row) for row in joint]
p_y = [sum(joint[i][j] for i in range(2)) for j in range(2)]

mi = sum(
    joint[i][j] * math.log2(joint[i][j] / (p_x[i] * p_y[j]))
    for i in range(2) for j in range(2) if joint[i][j] > 0
)
entropy_y = -sum(p * math.log2(p) for p in p_y if p > 0)

print(round(mi, 3), round(entropy_y, 3), round(entropy_y - mi, 3))
```

Output:

```text
0.278 1.0 0.722
```

The programme first sums rows and columns, then calculates each occupied cell's log contribution. Its second route normalizes each positive row, computes its entropy and multiplies by the row mass. The assertion checks the entropy-difference identity against the joint calculation. Both routes take time proportional to the number of cells; storing the two marginals needs space proportional to the number of rows plus columns. The input table itself remains the dominant stored object.

Change a cell only as part of a complete valid law, then recompute both marginals. Reusing the old marginals would compare the new joint with the wrong reference. The independent practice later supplies a validated helper and a zero-row/tiny-cell debugging case. Bits use log₂; natural logarithms give nats, and one bit equals ln2 nats. We state the units whenever a later implementation changes its log base.

## 3. Find information that single features miss

Mutual information compares complete probability laws. It can therefore detect dependence that a summary of linear association misses. Take X equally likely to be −1,0,1 and Y=X². The picture puts each possible observation at its actual coordinates.

[[M10]]

The points are (−1,1),(0,0),(1,1), each with mass1/3. Their symmetry makes E[X]=0 and E[XY]=0, hence covariance zero. Yet X determines Y exactly. The label is zero with probability1/3 and one with probability2/3, so I(X;Y)=H(Y)=h₂(1/3)=.918295834 bits. Zero covariance has not made the variables independent.

Now compress X in two different ways. Follow the actual inputs merged into each output group.

[[M11]]

The magnitude map Z₁=|X| merges −1 and1; both have Y=1. Its other group contains only0, with Y=0. Each group has a single label, so it preserves all the label information. The sign-threshold map Z₂=1[X>0] instead merges −1 with0. This group has probability2/3 and a fair conditional label, while Z₂=1 determines Y=1. Its remaining label entropy is2/3 bit, and its MI is .918295834−2/3=.251629167 bits. A grouping preserves the task when it merges inputs with the same conditional label law, not merely when it has few output values.

File: `mi_nonlinear.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


values = [-1, 0, 1]
joint = [[0, 1 / 3], [1 / 3, 0], [0, 1 / 3]]
mi, remaining = information(joint)
mean_x = sum(values) / 3
mean_y = sum(x * x for x in values) / 3
covariance = sum((x - mean_x) * (x * x - mean_y) for x in values) / 3
print('covariance:', f'{covariance:.6f}')
print('MI bits:', f'{mi:.6f}')
print('remaining label entropy:', f'{remaining:.6f}')
print('sign-only MI:', f'{information([[1 / 3, 1 / 3], [0, 1 / 3]])[0]:.6f}')
# This sign code is 0 for X<=0 and 1 for X>0. It confuses -1 with 0.
```

Output:

```text
covariance: 0.000000
MI bits: 0.918296
remaining label entropy: 0.000000
sign-only MI: 0.251629
```

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

File: `mi_conditional.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


rows = [(a, b, a ^ b, .5 * (.25 if b else .75)) for a in range(2) for b in range(2)]
tables = {'A': [[0., 0.] for _ in range(2)], 'B': [[0., 0.] for _ in range(2)], 'pair': [[0., 0.] for _ in range(4)]}
for a, b, y, p in rows:
    tables['A'][a][y] += p
    tables['B'][b][y] += p
    tables['pair'][2 * a + b][y] += p
for name, table in tables.items():
    print(name, 'MI:', f'{information(table)[0]:.6f}')
conditional = 0.
for b in range(2):
    table = [[0., 0.], [0., 0.]]
    for a in range(2):
        table[a][a ^ b] = .5
    conditional += (.25 if b else .75) * information(table)[0]
print('I(A;Y|B):', f'{conditional:.6f}')
print('chain rule:', f'{information(tables["B"])[0] + conditional:.6f}')
# Contrast: when X=Y=C for a fair common bit C, unconditional MI is 1,
# but within each C slice X and Y are constants, so conditional MI is 0.
common_joint = [[0.5, 0.0], [0.0, 0.5]]
constant_slices = [[[1.0, 0.0], [0.0, 0.0]], [[0.0, 0.0], [0.0, 1.0]]]
common_conditional = sum(0.5 * information(table)[0] for table in constant_slices)
print('common-bit unconditional / conditional:',
      f'{information(common_joint)[0]:.6f} {common_conditional:.6f}')
```

Output:

```text
A MI: 0.188722
B MI: 0.000000
pair MI: 1.000000
I(A;Y|B): 1.000000
chain rule: 1.000000
common-bit unconditional / conditional: 1.000000 0.000000
```

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

File: `mi_processing.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


rows = [(x, y, z, .5 * (.9 if y == x else .1) * (.8 if z == x else .2))
        for x in range(2) for y in range(2) for z in range(2)]


def pair_table(first, second):
    table = [[0., 0.], [0., 0.]]
    for row in rows:
        table[row[first]][row[second]] += row[3]
    return table


ixy = information(pair_table(0, 1))[0]
izy = information(pair_table(2, 1))[0]
conditional = 0.
for z in range(2):
    mass = sum(p for x, y, zz, p in rows if zz == z)
    table = [[0., 0.], [0., 0.]]
    for x, y, zz, p in rows:
        if zz == z:
            table[x][y] += p / mass
    conditional += mass * information(table)[0]
print('I(X;Y):', f'{ixy:.6f}')
print('I(Z;Y):', f'{izy:.6f}')
print('I(X;Y|Z):', f'{conditional:.6f}')
print('DPI gap identity:', abs(ixy - izy - conditional) < 1e-12)
```

Output:

```text
I(X;Y): 0.531004
I(Z;Y): 0.173254
I(X;Y|Z): 0.357751
DPI gap identity: True
```

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

File: `finite_fano.py`

```python
"""Finite-law Bayes error and Fano, with the same law in both implementations."""
import math
import numpy as np


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def fano(joint):
    # Rows are observed Z; columns are labels Y. Ties choose the first label.
    if not joint or len(joint[0]) < 2:
        raise ValueError('at least one Z and two possible Y labels required')
    k = len(joint[0])
    if any(len(row) != k for row in joint):
        raise ValueError('rectangular joint required')
    if any(not math.isfinite(p) or p < 0 for row in joint for p in row):
        raise ValueError('finite nonnegative masses required')
    if not math.isclose(sum(map(sum, joint)), 1, abs_tol=1e-12, rel_tol=0):
        raise ValueError('joint must sum to one')
    decisions, error, conditional = [], 0., 0.
    for row in joint:
        mass = sum(row)
        if mass == 0:
            decisions.append(None)  # No conditional law at this zero-mass observation.
            continue
        selected = max(range(k), key=lambda y: row[y])
        decisions.append(selected)
        error += mass - row[selected]
        conditional += mass * entropy([p / mass for p in row])
    upper = entropy([error, 1-error]) + error * math.log2(k-1)
    return decisions, error, conditional, upper


def numpy_fano(joint):
    joint = np.asarray(joint, dtype=np.float64)
    masses = joint.sum(axis=1)
    active = joint[masses > 0]
    conditional = active / masses[masses > 0, None]
    log_conditional = np.zeros_like(conditional)
    np.log2(conditional, out=log_conditional, where=conditional > 0)
    h = -float((active * log_conditional).sum())
    error = float((active.sum(axis=1)-active.max(axis=1)).sum())
    return error, h, entropy([error, 1-error])+error*math.log2(joint.shape[1]-1)


def main():
    for name, joint in [
        ('binary', [[.4, .1], [.1, .4]]),
        ('three-class', [[.30, .10, .10], [.05, .25, .20]]),
        ('perfect-with-empty-row', [[.5, 0], [0, .5], [0, 0]]),
        ('tie', [[.25, .25], [.25, .25]]),
    ]:
        decisions, error, h, upper = fano(joint)
        actual = numpy_fano(joint)
        assert np.allclose([error, h, upper], actual, atol=1e-12, rtol=0)
        assert h <= upper + 1e-12
        print(name, 'decisions', decisions)
        print('Pe / H(Y|Z) / Fano upper bits', *[f'{v:.9f}' for v in [error, h, upper]])


if __name__ == '__main__':
    main()
```

Output:

```text
binary decisions [0, 1]
Pe / H(Y|Z) / Fano upper bits 0.200000000 0.721928095 0.721928095
three-class decisions [0, 1]
Pe / H(Y|Z) / Fano upper bits 0.450000000 1.365957321 1.442774454
perfect-with-empty-row decisions [0, 1, None]
Pe / H(Y|Z) / Fano upper bits 0.000000000 0.000000000 0.000000000
tie decisions [0, 0]
Pe / H(Y|Z) / Fano upper bits 0.500000000 1.000000000 1.000000000
```

The scalar implementation validates a finite normalized joint, chooses a row maximum, sums error mass, and computes conditional entropy with the actual row weights. Its NumPy counterpart applies the same operations to active rows and writes logarithms only where probabilities are positive. Both take O(|Z|K) work. The extra perfect and tied cases expose zero-error and tie conventions. This is an exact known-law calculation; learning those conditional probabilities from data is a separate statistical problem.

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

File: `mi_representations.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


PX = [.25, .25, .25, .25]
LABEL = [[.9, .1], [.9, .1], [.1, .9], [.1, .9]]


def state(encoder, beta):
    pxz = [[PX[x] * value for value in row] for x, row in enumerate(encoder)]
    pzy = [[sum(PX[x] * encoder[x][z] * LABEL[x][y] for x in range(4))
            for y in range(2)] for z in range(len(encoder[0]))]
    pz = [sum(row) for row in pzy]
    decoder = [[p / pz[z] for p in row] for z, row in enumerate(pzy)]
    rate, relevance = information(pxz)[0], information(pzy)[0]
    return rate, relevance, rate - beta * relevance, pz, decoder, pzy


encoders = {
    'constant': [[1.] for _ in range(4)],
    'signal': [[1., 0.], [1., 0.], [0., 1.], [0., 1.]],
    'nuisance': [[1., 0.], [0., 1.], [1., 0.], [0., 1.]],
    'both': [[float(x == z) for z in range(4)] for x in range(4)],
    'noisy signal': [[.8, .2], [.8, .2], [.2, .8], [.2, .8]],
}
for name, encoder in encoders.items():
    rate, relevance, objective, *_ = state(encoder, 3)
    print(name + ':', ' '.join(f'{value:.6f}' for value in [rate, relevance, objective]))
# Columns are input information, label information, J=rate-3*relevance.
# This finite list is a comparison of choices, not all possible encoders.
```

Output:

```text
constant: 0.000000 0.000000 0.000000
signal: 1.000000 0.531004 -0.593013
nuisance: 1.000000 0.000000 1.000000
both: 2.000000 0.531004 0.406987
noisy signal: 0.278072 0.173254 -0.241689
```

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

File: `mi_iteration.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


PX = [.25, .25, .25, .25]
LABEL = [[.9, .1], [.9, .1], [.1, .9], [.1, .9]]


def state(encoder, beta):
    pxz = [[PX[x] * value for value in row] for x, row in enumerate(encoder)]
    pzy = [[sum(PX[x] * encoder[x][z] * LABEL[x][y] for x in range(4))
            for y in range(2)] for z in range(len(encoder[0]))]
    pz = [sum(row) for row in pzy]
    decoder = [[p / pz[z] for p in row] for z, row in enumerate(pzy)]
    rate, relevance = information(pxz)[0], information(pzy)[0]
    return rate, relevance, rate - beta * relevance, pz, decoder, pzy


def update(encoder, beta):
    _, _, _, pz, decoder, _ = state(encoder, beta)
    result = []
    for label in LABEL:
        distances = [sum(p * (math.log(p) - math.log(q)) for p, q in zip(label, representative))
                     for representative in decoder]
        log_weights = [math.log(mass) - beta * distance for mass, distance in zip(pz, distances)]
        maximum = max(log_weights)
        weights = [math.exp(value - maximum) for value in log_weights]
        result.append([value / sum(weights) for value in weights])
    return result


for name, encoder in [
    ('informative', [[.8, .2], [.6, .4], [.3, .7], [.2, .8]]),
    ('symmetric', [[.5, .5] for _ in range(4)]),
]:
    previous = state(encoder, 3)[2]
    for step in range(1, 41):
        encoder = update(encoder, 3)
        current = state(encoder, 3)
        assert current[2] <= previous + 1e-12
        previous = current[2]
        if step in [1, 4, 40]:
            print(name, step, ' '.join(f'{value:.6f}' for value in current[:3]))
    print('P(Z=1|X):', [round(row[1], 6) for row in encoder])
# Natural-log KL in the exponential; reported information is in bits.
# We checked finite descent, not the global optimum of every IB problem.
```

Output:

```text
informative 1 0.414161 0.253675 -0.346865
informative 4 0.944131 0.514972 -0.600785
informative 40 0.948951 0.516595 -0.600835
P(Z=1|X): [0.005748, 0.005748, 0.994252, 0.994252]
symmetric 1 0.000000 0.000000 0.000000
symmetric 4 0.000000 0.000000 0.000000
symmetric 40 0.000000 0.000000 0.000000
P(Z=1|X): [0.5, 0.5, 0.5, 0.5]
```

The original scratch programme makes the entire sequence explicit: assigned mass, codeword label mixture, KL distances, shifted row weights and normalized new rows. The assertions check finite descent for its positive fixture. They do not certify every possible input support or every initialization. Preserve the distinction between this local optimization problem and the convex rate-distortion problem in the next lesson; its stronger certificates do not transfer automatically.

The same calculation can use ordinary array operations. Keep the axes visible before reading the broadcasting code.

[[M34]]

Let A be the input alphabet size, K the codeword count and B the label count. q has shape(A,K), the label conditional has shape(A,B), and multiplying q by p(x) gives assigned mass of shape(A,K). Transposing that mass and multiplying by the label table gives p(z,y) of shape(K,B). Its row sums give p(z), and row normalization gives the decoder. For distortions, an(A,1,B) input-label view and a(1,K,B) decoder view broadcast to(A,K,B); summing over the label axis leaves(A,K). The dense update costs O(ABK) arithmetic. The explicit broadcast temporary costs O(ABK) memory, while a looped implementation can avoid storing that temporary and retain the smaller tables.

File: `finite_ib_reference.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


PX = [.25, .25, .25, .25]
LABEL = [[.9, .1], [.9, .1], [.1, .9], [.1, .9]]


def state(encoder, beta):
    pxz = [[PX[x] * value for value in row] for x, row in enumerate(encoder)]
    pzy = [[sum(PX[x] * encoder[x][z] * LABEL[x][y] for x in range(4))
            for y in range(2)] for z in range(len(encoder[0]))]
    pz = [sum(row) for row in pzy]
    decoder = [[p / pz[z] for p in row] for z, row in enumerate(pzy)]
    rate, relevance = information(pxz)[0], information(pzy)[0]
    return rate, relevance, rate - beta * relevance, pz, decoder, pzy


def update(encoder, beta):
    _, _, _, pz, decoder, _ = state(encoder, beta)
    result = []
    for label in LABEL:
        distances = [sum(p * (math.log(p) - math.log(q)) for p, q in zip(label, representative))
                     for representative in decoder]
        log_weights = [math.log(mass) - beta * distance for mass, distance in zip(pz, distances)]
        maximum = max(log_weights)
        weights = [math.exp(value - maximum) for value in log_weights]
        result.append([value / sum(weights) for value in weights])
    return result


```

This helper contains the exact complete function definitions and fixture constants from the original scratch programme before its demonstration loop. Keeping the executable example outside this helper means importing it does not repeat an unrelated programme. The array programme calls these functions only as the declared comparison route for its new matched run.

File: `finite_ib_numpy.py`

```python
"""Array IB updates, exact scratch comparison, and one fixed-auxiliary row solve."""
import math
import numpy as np
from scipy.optimize import minimize
import finite_ib_reference as scratch

PX = np.array(scratch.PX, dtype=np.float64)
LABEL = np.array(scratch.LABEL, dtype=np.float64)
LN2 = math.log(2)


def information(joint):
    px, py = joint.sum(axis=1), joint.sum(axis=0)
    i, j = np.nonzero(joint > 0)
    return float(np.sum(joint[i, j]*(np.log(joint[i, j])-np.log(px[i])-np.log(py[j])))/LN2)


def state(q, beta):
    pxz = PX[:, None]*q
    pzy = pxz.T @ LABEL
    pz = pzy.sum(axis=1)
    if np.any(pz <= 0):
        raise ValueError('this positive-support demonstration requires occupied codewords')
    decoder = pzy/pz[:, None]
    rate, relevance = information(pxz), information(pzy)
    return rate, relevance, rate-beta*relevance, pz, decoder


def distortions(decoder):
    # Axes are input A, codeword K, label B. This fixture has positive label laws.
    return np.sum(LABEL[:, None, :]*(np.log(LABEL[:, None, :])-np.log(decoder[None, :, :])), axis=2)


def update(q, beta):
    _, _, _, pz, decoder = state(q, beta)
    logits = np.log(pz)[None, :]-beta*distortions(decoder)
    weights = np.exp(logits-logits.max(axis=1, keepdims=True))
    return weights/weights.sum(axis=1, keepdims=True)


def free_energy(q, r, w, beta):
    return float(np.sum(PX[:, None]*q*(np.log(q)-np.log(r)[None, :]+beta*distortions(w)))/LN2)


def main():
    beta = 3.
    ix_y = information(PX[:, None]*LABEL)
    for name, initial in [
        ('informative', [[.8, .2], [.6, .4], [.3, .7], [.2, .8]]),
        ('symmetric', [[.5, .5]]*4),
    ]:
        q, reference = np.array(initial), [row[:] for row in initial]
        previous = math.inf
        for step in range(41):
            rate, relevance, objective, pz, decoder = state(q, beta)
            scalar = scratch.state(reference, beta)
            np.testing.assert_allclose(q, reference, atol=2e-12, rtol=0)
            np.testing.assert_allclose([rate,relevance,objective], scalar[:3], atol=2e-12, rtol=0)
            np.testing.assert_allclose(pz, scalar[3], atol=2e-12, rtol=0)
            np.testing.assert_allclose(decoder, scalar[4], atol=2e-12, rtol=0)
            energy = free_energy(q, pz, decoder, beta)
            assert abs(energy-objective-beta*ix_y) < 2e-12
            assert objective <= previous + 2e-12
            previous = objective
            if step in (0,1,4,40):
                print(name, step, 'R T J F bits', *[f'{v:.9f}' for v in [rate,relevance,objective,energy]])
            if step < 40:
                q = update(q, beta)
                reference = scratch.update(reference, beta)
        print(name, 'P(Z=1|X)', *[f'{v:.9f}' for v in q[:, 1]])
    # The optimizer below solves only one row with fixed auxiliary r and D.
    r, d, row_beta = np.array([.25, .75]), np.array([0., LN2]), 2.
    def row_objective(row):
        return float(np.sum(row*(np.log(row)-np.log(r)+row_beta*d)))
    def row_gradient(row):
        return np.log(row)-np.log(r)+1+row_beta*d
    result = minimize(row_objective, np.array([.5,.5]), jac=row_gradient,
                      bounds=[(1e-12,1)]*2,
                      constraints={'type':'eq','fun':lambda v:v.sum()-1,
                                   'jac':lambda v:np.ones(2)},
                      method='SLSQP', options={'ftol':1e-12,'maxiter':100})
    exact = r*np.exp(-row_beta*d)
    exact /= exact.sum()
    assert result.success
    np.testing.assert_allclose(result.x, exact, atol=2e-7, rtol=0)
    print('fixed-row Gibbs', *[f'{v:.9f}' for v in exact])
    print('fixed-row SLSQP', *[f'{v:.9f}' for v in result.x])
    print('fixed-row objective nats', f'{row_objective(result.x):.9f}')


if __name__ == '__main__':
    main()
```

Output:

```text
informative 0 R T J F bits 0.174171458 0.095887893 -0.113492220 1.479521000
informative 1 R T J F bits 0.414161329 0.253675286 -0.346864527 1.246148692
informative 4 R T J F bits 0.944130949 0.514971942 -0.600784877 0.992228342
informative 40 R T J F bits 0.948950829 0.516595159 -0.600834647 0.992178572
informative P(Z=1|X) 0.005747954 0.005747954 0.994252046 0.994252046
symmetric 0 R T J F bits 0.000000000 0.000000000 0.000000000 1.593013219
symmetric 1 R T J F bits 0.000000000 0.000000000 0.000000000 1.593013219
symmetric 4 R T J F bits 0.000000000 0.000000000 0.000000000 1.593013219
symmetric 40 R T J F bits 0.000000000 0.000000000 0.000000000 1.593013219
symmetric P(Z=1|X) 0.500000000 0.500000000 0.500000000 0.500000000
fixed-row Gibbs 0.571428571 0.428571429
fixed-row SLSQP 0.571428570 0.428571430
fixed-row objective nats 0.826678573
```

At steps0,1,4,40 the code compares the entire encoder, marginal and decoder, as well as R,T,J, against the scalar route. It also calculates F with matched auxiliaries and checks F−J=βI(X;Y). Natural-log distortions drive the update; division by ln2 converts the reported information and free energy to bits. The informative and symmetric outputs preserve the earlier finite-run interpretation.

The final SciPy call solves just the two-entry row with fixed r=(.25,.75), distortions(0,ln2) and beta2. SLSQP enforces a unit sum and positive numerical bounds. Its row(.571428570,.428571430) agrees with the exact Gibbs row(4/7,3/7) within the stated tolerance. This comparison verifies an ordinary constrained-optimizer route for that fixed convex row problem. It is not a SciPy implementation or global certificate for the entire nonconvex bottleneck problem. A solver's success flag must be interpreted within the objective and constraints actually supplied.

For huge input alphabets, estimating and storing the necessary laws is itself difficult. We next replace the inaccessible marginal and decoder with tractable distributions, while keeping track of the price of those replacements.

## 7. Distinguish a training bound from information

A high-dimensional encoder may be easy to sample but hard to average over all inputs. Its marginal p(z)=Eₓq(z|x) and its true label conditional p(y|z) can then be inaccessible. A variational method substitutes tractable distributions and tracks how those substitutions change the objective. Keep the encoder q(z|x), codeword reference r(z), and predictive decoder s(y|z) as three distinct objects.

First consider the cost U=EₓD_KL(q(z|x)‖r(z)). Adding and subtracting log p(z) separates it into true input information and marginal mismatch:

$$
U=I(X;Z)+D_{\rm KL}(p(z)\Vert r(z))\geq I(X;Z).
$$

For prediction let C=E_(Y,Z)[−log s(Y|Z)] be the decoder cross-entropy. Subtracting conditional entropy leaves G_s=E_zD_KL(p(y|z)‖s(y|z)). Therefore the relevance surrogate is

$$
L=H(Y)-C=I(Y;Z)-G_s\leq I(Y;Z).
$$

The first substitution gives an upper bound on rate; the second gives a lower bound on relevance. The following picture fixes the true information coordinates and changes only the two auxiliary choices.

[[M35]]

The fixed noisy encoder has R=.278071905 and T=.173253628 bits. Matching the reference to the true marginal closes the rate gap. Matching the decoder to the true conditional closes the relevance gap. A poor decoder can make L negative even though true MI cannot be negative. A zero decoder probability on a positive-mass event gives infinite cross-entropy; compatible support is a mathematical requirement, not an optional plotting adjustment. The live controls alter these auxiliaries while the encoder and its true dots remain fixed on the same axes.

Combining the two bounds gives an upper objective. The next ruler labels each piece of its gap and shows the coefficient conversion used by many training losses.

[[M36]]

Writing G_r=D_KL(p(z)‖r(z)), we have

$$
\begin{aligned}
J&=R-\beta T,\\
\widetilde J&=U-\beta L=U+\beta C-\beta H(Y),\\
\widetilde J-J&=G_r+\beta G_s\geq0.
\end{aligned}
$$

For a fixed data law H(Y) is constant, so minimizing U+βC minimizes the same upper objective. For β>0, dividing the entire expression by beta gives C+λU with λ=1/β. A larger compression weight lambda thus corresponds to a smaller relevance weight beta in the earlier convention. At beta0 this division is invalid; the original objective simply minimizes rate. Tightening an auxiliary mismatch can lower the upper objective while both true information values remain unchanged.

File: `mi_bounds.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


PX = [.25, .25, .25, .25]
LABEL = [[.9, .1], [.9, .1], [.1, .9], [.1, .9]]


def state(encoder, beta):
    pxz = [[PX[x] * value for value in row] for x, row in enumerate(encoder)]
    pzy = [[sum(PX[x] * encoder[x][z] * LABEL[x][y] for x in range(4))
            for y in range(2)] for z in range(len(encoder[0]))]
    pz = [sum(row) for row in pzy]
    decoder = [[p / pz[z] for p in row] for z, row in enumerate(pzy)]
    rate, relevance = information(pxz)[0], information(pzy)[0]
    return rate, relevance, rate - beta * relevance, pz, decoder, pzy


encoder = [[.8, .2], [.8, .2], [.2, .8], [.2, .8]]
rate, relevance, objective, pz, truth, pzy = state(encoder, 3)


def kl(p, q):
    return sum(a * (math.log2(a) - math.log2(b)) for a, b in zip(p, q) if a > 0)


for name, reference, decoder in [
    ('matched', [.5, .5], [[.74, .26], [.26, .74]]),
    ('mismatched', [.8, .2], [[.6, .4], [.4, .6]]),
]:
    upper = sum(PX[x] * kl(row, reference) for x, row in enumerate(encoder))
    ce = -sum(pzy[z][y] * math.log2(decoder[z][y]) for z in range(2) for y in range(2))
    lower = 1 - ce
    rate_gap = kl(pz, reference)
    prediction_gap = sum(pz[z] * kl(truth[z], decoder[z]) for z in range(2))
    assert abs(upper - rate - rate_gap) < 1e-12
    assert abs(relevance - lower - prediction_gap) < 1e-12
    upper_j = upper + 3 * ce - 3
    assert abs(upper_j - objective - rate_gap - 3 * prediction_gap) < 1e-12
    print(name, 'rate upper / relevance lower:', f'{upper:.6f}', f'{lower:.6f}')
    print('rate / predictive gaps:', f'{rate_gap:.6f}', f'{prediction_gap:.6f}')
    print('true J / upper J:', f'{objective:.6f}', f'{upper_j:.6f}')
```

Output:

```text
matched rate upper / relevance lower: 0.278072 0.173254
rate / predictive gaps: 0.000000 0.000000
true J / upper J: -0.241689 -0.241689
mismatched rate upper / relevance lower: 0.600000 0.110944
rate / predictive gaps: 0.321928 0.062309
true J / upper J: -0.241689 0.267168
```

The finite programme computes the true encoder laws first, then separately evaluates the reference and decoder replacements. It checks the two exact gap identities rather than calling either bound an MI estimate. With matched auxiliaries the reported upper objective equals the true objective; with mismatched auxiliaries their difference is the sum of the declared nonnegative gaps. This finite example makes quantities visible that a large neural model may not permit us to evaluate exactly.

### Compute a small Gaussian bottleneck step

A neural encoder can output a mean μ(x) and a positive standard deviation σ(x), defining a diagonal Gaussian q(z|x). Draw independent standard-normal noise epsilon and use z=μ(x)+σ(x)⊙epsilon. The actual mechanism is an affine transformation of independent noise, followed by a label decoder.

[[M37]]

The mean sets the centre of the conditional distribution; the standard deviation scales the random displacement. This is the pathwise derivative mechanism from [Variational Inference](/learn/path/full-curriculum/variational-inference#6-differentiate-an-expectation): hold the sampled epsilon fixed while differentiating through the transformation. Valid differentiation of the expected objective additionally requires the usual integrability and interchange conditions. The earlier programme applies this technique to an ELBO; here the task is supervised label prediction.

For a standard-normal reference, write v_j=σ_j². The per-input Gaussian KL is

$$
D_{\rm KL}(q(z\mid x)\Vert\mathcal N(0,I))
=\tfrac12\sum_j(\mu_j^2+v_j-1-\log v_j).
$$

This formula uses natural logarithms and gives nats. Use decoder cross-entropy in nats too. Averaging its analytic KL removes sampling noise from that term, but does not make it exact I(X;Z): the marginal mismatch gap remains.

To see every computational step, use a scalar encoder μ=aS+bN+c, shared standard deviation exp(d), and binary-decoder logit ℓ=uz+v. Declare four input rows(S,N)=00,01,10,11, targets(0,0,1,0), and fixed comparison noises(−1,.5,.5,−1). These are constructed batch and noise values for checking arithmetic, not a claim that this four-row batch exactly realizes the earlier population's .1 label-noise law. Initialize(a,b,c)=(.8,.3,−.4), d=ln(.7), and(u,v)=(1.1,−.2). Use compression weight λ=.2 and a single gradient step of size .01.

[[M38]]

In the first row μ=−.4, z=−.4+.7×(−1)=−1.1, and ℓ=1.1×(−1.1)−.2=−1.41. For target0 its stable logistic cross-entropy is .218447167 nats. The Gaussian KL is .5[(−.4)²+.7²−1−2ln(.7)]=.181674944 nats. Each row contributes to the mean objective C+λU; no batch-size-dependent sum is silently substituted.

For one row, the derivative of logistic cross-entropy with respect to its logit is g= sigmoid(ℓ)−y. The label path gives ∂CE/∂μ=ug and ∂CE/∂d=ug·σ·epsilon. The KL derivatives are μ and σ²−1, respectively. Thus the combined mean-gradient contributions before averaging are

$$
\begin{aligned}
g_\mu&=ug+\lambda\mu,\\
(g_a,g_b,g_c)&=(Sg_\mu,Ng_\mu,g_\mu),\\
g_d&=ug\sigma\epsilon+\lambda(\sigma^2-1),\\
(g_u,g_v)&=(gz,g).
\end{aligned}
$$

File: `gaussian_vib_step.py`

```python
"""One fixed-noise scalar VIB objective: hand gradients and CPU float64 autograd."""
import math
import torch
from torch.nn.functional import binary_cross_entropy_with_logits

# (signal input, nuisance input, observed label, fixed comparison noise).
ROWS = [(0., 0., 0., -1.), (0., 1., 0., .5),
        (1., 0., 1., .5), (1., 1., 0., -1.)]
NAMES = ('a', 'b', 'c', 'log_sd', 'u', 'v')


def sigmoid(x):
    if x >= 0:
        return 1 / (1 + math.exp(-x))
    e = math.exp(x)
    return e / (1 + e)


def hand(parameters, rows=ROWS, weight=.2):
    a, b, c, log_sd, u, v = parameters
    sd = math.exp(log_sd)
    gradient = [0.] * 6
    ce_sum, kl_sum, trace = 0., 0., []
    for signal, nuisance, y, epsilon in rows:
        mu = a*signal + b*nuisance + c
        z = mu + sd*epsilon
        logit = u*z + v
        ce = max(logit, 0) - y*logit + math.log1p(math.exp(-abs(logit)))
        kl = .5*(mu*mu + sd*sd - 1 - 2*log_sd)
        d_logit = sigmoid(logit) - y
        d_mu = u*d_logit + weight*mu
        components = (d_mu*signal, d_mu*nuisance, d_mu,
                      u*d_logit*sd*epsilon + weight*(sd*sd-1),
                      d_logit*z, d_logit)
        gradient = [g+d/len(rows) for g, d in zip(gradient, components)]
        ce_sum += ce
        kl_sum += kl
        trace.append((mu, z, logit, ce, kl))
    ce, kl = ce_sum/len(rows), kl_sum/len(rows)
    return ce+weight*kl, gradient, ce, kl, trace


def autograd(parameters, rows=ROWS, weight=.2):
    p = torch.tensor(parameters, dtype=torch.float64, device='cpu', requires_grad=True)
    data = torch.tensor(rows, dtype=torch.float64, device='cpu')
    a, b, c, log_sd, u, v = p.unbind()
    signal, nuisance, y, epsilon = data.unbind(dim=1)
    mu = a*signal + b*nuisance + c
    sd = log_sd.exp()
    z = mu + sd*epsilon
    ce = binary_cross_entropy_with_logits(u*z+v, y, reduction='mean')
    kl = .5*(mu.square()+sd.square()-1-2*log_sd).mean()
    loss = ce + weight*kl
    gradient, = torch.autograd.grad(loss, p)
    return float(loss.detach()), gradient.detach().tolist()


def main():
    parameters = [.8, .3, -.4, math.log(.7), 1.1, -.2]
    loss, gradient, ce, kl, trace = hand(parameters)
    torch_loss, torch_gradient = autograd(parameters)
    assert abs(loss-torch_loss) < 1e-12
    assert max(abs(a-b) for a,b in zip(gradient, torch_gradient)) < 1e-12
    for i, row in enumerate(trace):
        print('row', i, 'mu z logit CE KL', *[f'{x:.9f}' for x in row])
    print('mean CE / KL / objective nats', *[f'{x:.9f}' for x in [ce, kl, loss]])
    print('parameters', *NAMES)
    print('hand gradients', *[f'{x:.9f}' for x in gradient])
    print('Torch gradients', *[f'{x:.9f}' for x in torch_gradient])
    updated = [p-.01*g for p,g in zip(parameters, gradient)]
    after = hand(updated)[0]
    assert abs(after-autograd(updated)[0]) < 1e-12
    print('updated parameters', *[f'{x:.9f}' for x in updated])
    print('updated fixed-noise objective nats', f'{after:.9f}')


if __name__ == '__main__':
    main()
```

Output:

```text
row 0 mu z logit CE KL -0.400000000 -1.100000000 -1.410000000 0.218447167 0.181674944
row 1 mu z logit CE KL -0.100000000 0.250000000 0.075000000 0.731350141 0.106674944
row 2 mu z logit CE KL 0.400000000 0.750000000 0.625000000 0.428700678 0.181674944
row 3 mu z logit CE KL 0.700000000 0.000000000 -0.200000000 0.598138869 0.346674944
mean CE / KL / objective nats 0.494159214 0.204174944 0.534994203
parameters a b c log_sd u v
hand gradients 0.082918239 0.296449485 0.254536438 -0.210060264 -0.086914002 0.204124035
Torch gradients 0.082918239 0.296449485 0.254536438 -0.210060264 -0.086914002 0.204124035
updated parameters 0.799170818 0.297035505 -0.402545364 -0.354574341 1.100869140 -0.202041240
updated fixed-noise objective nats 0.532473082
```

The standard-library route evaluates stable softplus as max(ℓ,0)+log1p(exp(−|ℓ|)) and differentiates the same expression analytically. The Torch route uses CPU float64 tensors, `binary_cross_entropy_with_logits` with mean reduction, the analytic Gaussian KL, and `autograd.grad`. It does not apply sigmoid before the logits loss. All six gradients agree within the asserted tolerance on identical inputs and fixed noise.

The initial mean cross-entropy is .494159214, the mean KL .204174944, and their weighted objective .534994203 nats. The declared step produces .532473082 on that same fixed-noise batch. This is one bounded optimization calculation, not true MI, a converged learner or a generalization result. Intended stochastic training would draw fresh independent noise, average over data, and evaluate task performance, calibration and the declared surrogate on fresh held-out examples. The scalar-width calculation takes O(N) work for N rows; larger tensor widths introduce their own matrix costs.

A variational autoencoder reconstructs X under a generative model; this supervised bottleneck predicts Y. Similar Gaussian and KL operations can serve different objectives. A further distinction matters when the representation contains a sensitive attribute as well as task information.

[[M39]]

Exact population I(Z;A)=0 implies marginal independence from attribute A. It does not imply independence after another variable is known. Reuse XOR: if fair independent A,B produce Z=A XOR B, then Z is marginally independent of A, but knowing B and Z recovers A exactly. An estimated MI near zero is weaker still. An information-plane plot alone therefore does not establish fairness, privacy, causality, robustness or performance on a changed deployment law. Those questions require their own variables, threat or decision model, and evaluation.

## 8. Handle continuous values and measurement noise

The joint-versus-product definition extends beyond tables: I(X;Z)=D_KL(P_XZ‖P_XP_Z), with probability measures in place of finite masses. It remains nonnegative and can be infinite. To see what changes, draw a continuous joint distribution before trying to subtract entropy formulas.

[[M40]]

Let X and E be independent standard normals and let Z=X+σE for σ>0. The joint cloud has mean zero and covariance matrix [[1,1],[1,1+σ²]]. At a fixed X=x, its conditional slice in Z is normal with mean x and standard deviation sigma. The width is a standard deviation on the coordinate axis, not a probability mass or a variance drawn as a length. Narrower conditional slices make the observation more precise about X.

When joint densities exist and the required differential entropies are finite, one may write I(X;Z)=h(X)+h(Z)−h(X,Z), or h(Z)−h(Z|X). Differential entropy can be negative and depends on the coordinate units. Do not subtract undefined or infinite differential entropies. For jointly Gaussian scalars with correlation rho and |rho|<1, the finite result is−.5log(1−rho²) in the chosen log base.

For the additive-noise law, the observation variance is1+σ² and the conditional variance isσ². The noise enters a specific addition node; connect that operation to the information curve.

[[M41]]

Using h(N(0,v))=.5log₂(2πev), the shared constants cancel and give

$$
I(X;Z)=\tfrac12\log_2\left(1+\frac1{\sigma^2}\right).
$$

At sigma.5 this is .5log₂5=1.160964047 bits; at sigma1 it is .5 bit. Halving a standard deviation quarters its variance, which explains the squared scale. The investigation changes noise and coordinate scale separately. Small positive sigma still denotes a noisy, finite-information law; it must not be rounded into the exact zero-noise branch.

Now multiply the entire observation by10. Trace corresponding physical outcomes under the two coordinate rulers.

[[M42]]

The transformation Z′=10Z is invertible. Its density is stretched horizontally and scaled vertically by1/10 to preserve total probability. Both h(Z) and h(Z|X) increase by log₂10, so their finite difference stays unchanged. The covariance with X scales by10, and the observation variance by100. This is a change of units. Adding fresh noise or quantizing into bins instead changes the information-preserving relationship and cannot increase population MI under the processing assumption.

File: `mi_continuous.py`

```python
import math

for sigma in [.25, .5, 1., 2.]:
    variance_z = 1 + sigma * sigma
    covariance = 1.
    determinant = variance_z - covariance * covariance
    nats = .5 * (math.log(variance_z) - math.log(determinant))
    bits = nats / math.log(2)
    # Z'=10Z scales its variance by100 and its covariance with X by10.
    scaled_determinant = 100 * variance_z - (10 * covariance) ** 2
    scaled = .5 * (math.log(100 * variance_z) - math.log(scaled_determinant))
    assert abs(scaled - nats) < 1e-12
    print(sigma, 'MI bits:', f'{bits:.6f}', 'rescaling unchanged:', True)
# The infinite case is a measure-theoretic conclusion, not a finite estimate.
```

Output:

```text
0.25 MI bits: 2.043731 rescaling unchanged: True
0.5 MI bits: 1.160964 rescaling unchanged: True
1.0 MI bits: 0.500000 rescaling unchanged: True
2.0 MI bits: 0.160964 rescaling unchanged: True
```

The preserved numerical loop calculates the Gaussian determinant and repeats it after the coordinate transformation. Its equal results verify the declared positive-noise cases. The explanatory zero-noise sentence appears here in prose rather than being printed as if it were another measured numerical output. The loop is a closed-form Gaussian calculation, not a general continuous-data estimator.

At sigma0 the joint cloud collapses to an exact line. Compare that line with what the product of two continuous marginals assigns to it.

[[M43]]

The joint law places probability one on Z=X. Independent continuous draws put probability zero on that diagonal. The joint is therefore not absolutely continuous with respect to the product law, and its KL—and MI—is infinite. No finite-height bar represents this value. More generally, a deterministic output Z=f(X) with a nonatomic output law has infinite MI with X: exact real values preserve arbitrarily fine distinctions.

A deterministic finite-valued output is different. For the sign of standard-normal X, the zero event has probability zero and the two signs are equally likely. Its MI with X is the one-bit entropy of that sign. Thus a one-dimensional output can carry finite or infinite information depending on noise and precision. Any finite reported “MI of a deterministic neural layer” needs its quantization, injected noise, estimator or other measurement convention stated. A finite estimate does not refute the infinite exact-value conclusion.

## 9. Check what a sample can support

Until now we knew a complete probability law. With observed data, a simple **plug-in estimator** counts paired values, divides by the sample size, and computes MI of that empirical table. The drawing distinguishes a declared population law from the particular rows it generated.

[[M44]]

An independent population has MI zero. Its finite sample need not contain exactly the proportions that factor into independent row and column marginals. The empirical MI can therefore be positive. An8×8 table has many more cells to estimate than a2×2 table at the same sample size, making sparse counts consequential. This independence example does not prove a universal sign for estimation error under every dependent law. An individual estimate can also move in either direction when more observations are added.

The simulation exposes its sample count, alphabet, law and seed. Within one setting, increasing the count uses a coherent prefix of the same seeded stream. The browser's xorshift generator and Python's `random.Random` are different declared generators; a matching seed number would not make their streams identical. The plotted quantity is always the MI of the current empirical table, with the known population value as a separate reference.

Now keep the actual observed X and Y values, but permute the donor rows supplying Y. Follow one permutation before inspecting a collection of shuffled scores.

[[M45]]

Every original Y appears exactly once in the new paired rows, so its marginal count is unchanged; X's marginal is unchanged because its rows stayed in place. The joint pairing changes. A particular shuffled table is not guaranteed to factor exactly or have MI zero. Twenty shuffled values illustrate the variability of this diagnostic under the observed marginals; they are not a confidence interval or a calibrated significance test. A formal permutation test needs an exchangeability argument, a statistic and a stated decision rule. Temporal, grouped or repeated observations may not permit unrestricted shuffling.

File: `mi_estimation.py`

```python
import math


def entropy(probabilities):
    return -sum(p * math.log2(p) for p in probabilities if p > 0)


def information(joint):
    px = [sum(row) for row in joint]
    py = [sum(row[j] for row in joint) for j in range(len(joint[0]))]
    mi = sum(
        p * (math.log2(p) - math.log2(px[i]) - math.log2(py[j]))
        for i, row in enumerate(joint)
        for j, p in enumerate(row)
        if p > 0
    )
    remaining = sum(
        px[i] * entropy([p / px[i] for p in row])
        for i, row in enumerate(joint) if px[i] > 0
    )
    assert abs(mi - (entropy(py) - remaining)) < 1e-10
    return mi, remaining


import random

for categories, count in [(2, 40), (8, 40), (8, 4000)]:
    randomizer = random.Random(204)
    counts = [[0 for _ in range(categories)] for _ in range(categories)]
    for _ in range(count):
        counts[randomizer.randrange(categories)][randomizer.randrange(categories)] += 1
    joint = [[value / count for value in row] for row in counts]
    print(categories, count, 'plug-in MI:', f'{information(joint)[0]:.6f}', 'true MI:', 0)

# Each observed ID is unique; empirical labels are then deterministic given ID.
labels = [0, 1, 1, 0, 1, 0, 0, 1]
id_joint = [[1 / len(labels) if y == label else 0 for y in range(2)] for label in labels]
print('empirical ID-label MI:', f'{information(id_joint)[0]:.6f}')
print('empirical label entropy:', f'{entropy([.5, .5]):.6f}')
# This describes the empirical table, not predictive information for a new ID.
# These seeded runs illustrate sampling effects; they are not a confidence bound.
```

Output:

```text
2 40 plug-in MI: 0.015069 true MI: 0
8 40 plug-in MI: 0.785079 true MI: 0
8 4000 plug-in MI: 0.007202 true MI: 0
empirical ID-label MI: 1.000000
empirical label entropy: 1.000000
```

The programme constructs a count table from a specified independent generator and evaluates its empirical law. Its seeded examples expose how a small alphabet and a larger sample can change the apparent dependence; they do not assert monotonicity for every realized sequence. Direct counting costs O(N+AB) for N records and an A-by-B table; making twenty complete permutations adds O(20N) work. Exact table probabilities, sample estimates and shuffled diagnostics remain separate objects.

The final programme example assigns every observed row a unique ID. Draw its singleton groups next to an ID that was never observed.

[[M46]]

Each training ID determines its one recorded label, so the empirical conditional entropy is zero and the empirical MI equals the one-bit label entropy. No rule for a new ID follows. Finer measurement bins can create a similar sparse-table effect. Storage as an integer does not make a continuous measurement a categorical variable. Choose an estimator according to the variable's meaning and sampling assumptions, not its array dtype.

Fit feature selection, binning and estimator tuning inside the training portion of each evaluation fold. For deployment to new participants, keep whole participants out of training. Splitting only after choosing features using all labels leaks evaluation information. [Feature Selection & Importance](/learn/topic/feature-selection-importance-shap-permutation-mutual-info) owns the full train-only selection and held-out workflow; the information statistic by itself is not that validation procedure.

### Use the same counts in the ordinary API

The next comparison carries one integer contingency table into both a manual sum and library calls. The row/column labels and units remain explicit.

[[M47]]

The table [[30,10],[10,30]] has80 observations. Its agreement fraction is .75, deliberately different from section1's .8 law. Its MI is .130812036 nats, or .188721876 bits. `mutual_info_score(contingency=counts)` takes actual counts rather than a normalized probability table. `mutual_info_classif` on the expanded80 rows uses `discrete_features=True` because these values are categories. Both return nats, so divide by ln2 for bits.

File: `mutual-information-library-bridge.py`

```python
"""Finite count MI, its units, and scikit-learn's discrete feature estimator.

Run: python mutual-information-library-bridge.py
Dependencies: numpy==2.3.5, scikit-learn==1.9.1.
This owns the finite discrete/count convention. Continuous nearest-neighbor MI
is a different estimator; the Feature Selection lesson owns fitted-data workflow.
"""
import numpy as np
from sklearn.metrics import mutual_info_score
from sklearn.feature_selection import mutual_info_classif


def count_mi(counts):
    """Plug-in MI in nats, with empty cells and margins handled without log(0)."""
    counts = np.asarray(counts)
    if (counts.ndim != 2 or not counts.size or not np.issubdtype(counts.dtype, np.integer)
            or np.any(counts < 0)):
        raise ValueError("Pass a nonnegative integer count table, not normalized probabilities")
    total = float(counts.astype(float).sum())
    if total <= 0:
        raise ValueError("At least one observation is required")
    p = counts.astype(float) / total
    rows, cols = p.sum(axis=1), p.sum(axis=0)
    i, j = np.nonzero(counts)
    # Subtracted logs avoid forming a tiny marginal product or its reciprocal.
    return float(np.sum(p[i, j] * (np.log(p[i, j]) - np.log(rows[i]) - np.log(cols[j]))))


def expand_counts(counts):
    i, j = np.indices(counts.shape)
    return np.repeat(i.ravel(), counts.ravel()), np.repeat(j.ravel(), counts.ravel())


def main():
    counts = np.array([[30, 10], [10, 30]])
    x, y = expand_counts(counts)
    manual = count_mi(counts)
    library = mutual_info_score(None, None, contingency=counts)
    feature = mutual_info_classif(x[:, None], y, discrete_features=True, random_state=0)[0]
    np.testing.assert_allclose([library, feature], manual, atol=1e-14)
    print("manual/library/feature nats", np.round([manual, library, feature], 9).tolist())
    print("same MI in bits", round(manual / np.log(2), 9))
    duplicated = count_mi(2 * counts)
    relabeled = count_mi(counts[::-1, ::-1])
    np.testing.assert_allclose([duplicated, relabeled], manual, atol=1e-14)
    print("duplicate rows and relabel invariants", True)
    print("independent table nats", round(count_mi(np.array([[2, 4], [3, 6]])), 9))
    # Unique identifiers memorize the realized sample and produce the entropy of Y.
    identifier_mi = mutual_info_classif(np.arange(len(y))[:, None], y, discrete_features=True)[0]
    print("unique identifier empirical MI in bits", round(identifier_mi / np.log(2), 6))


if __name__ == "__main__":
    main()
```

Output:

```text
manual/library/feature nats [0.130812036, 0.130812036, 0.130812036]
same MI in bits 0.188721876
duplicate rows and relabel invariants True
independent table nats -0.0
unique identifier empirical MI in bits 1.0
```

The bridge validates nonnegative integer counts and masks empty cells before taking logs. Duplicating all counts or consistently relabelling categories preserves the plug-in MI. The replacement table [[2,4],[3,6]] factors into its marginals and gives zero up to roundoff. Adding an all-zero category changes no occupied contribution. The unique-ID example again gives empirical one-bit information without establishing population usefulness; that interpretation belongs to the text rather than a printed pseudo-measurement.

The dense table route needs O(rc) time and storage for r-by-c categories. Expanding N rows here makes the feature-estimator API visible; a large sparse contingency table should remain sparse. Continuous nearest-neighbour estimators use different assumptions and tuning. The discrete-feature flag changes the statistical treatment, not just storage. Some estimated MI outputs are clipped at zero by the API; a returned zero does not certify population independence. An MI feature score is also not an information-bottleneck optimizer: the latter requires the encoder, relevance objective and iterative construction from section6.

### Inspect an observed law and a deliberate coarsening

Use the offline Palmer penguins records from the preceding Entropy example. This time the question is descriptive association, not held-out prediction cost. Species, island and year are present in all344 records; missing body measurements do not remove rows from this calculation. The actual table and a specified grouping make the change visible.

[[M48]]

With species rows Adelie,Chinstrap,Gentoo and island columns Biscoe,Dream,Torgersen, the observed counts are [[44,56,52],[0,68,0],[124,0,0]]. Computing MI of this empirical law gives .750428171 bits. Merge Dream and Torgersen into “other,” retaining Biscoe separately. The new table is [[44,108],[0,68],[124,0]], with MI .616057102 bits. The .134371069-bit loss is a deterministic coarsening under the same empirical law, so it obeys data processing exactly. This does not establish that island causes species or that the study is a random census of all Antarctic penguins.

Year selection asks a different question: it changes which observations define the law. There are110 records from2007,114 from2008 and120 from2009. Conditional information I(species;island|year) weights the within-year MI values by these actual frequencies. It is .744684498 bits; the unweighted average .745617934 is different. Switching years is not an encoder operation on one fixed source law. The live view labels the year and denominator beside every table; grouping within that selected table then compares like with like.

File: `penguins_information.py`

```python
"""Descriptive count information; offline CC0 Palmer penguins, all selected fields."""
import csv
import hashlib
import math
from pathlib import Path
import numpy as np
from sklearn.metrics import mutual_info_score

SPECIES = ('Adelie', 'Chinstrap', 'Gentoo')
ISLANDS = ('Biscoe', 'Dream', 'Torgersen')
DATA_SHA256 = 'f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93'


def count_table(records, grouped=False):
    table = [[0]*(2 if grouped else 3) for _ in SPECIES]
    for row in records:
        i = SPECIES.index(row['species'])
        j = (0 if row['island']=='Biscoe' else 1) if grouped else ISLANDS.index(row['island'])
        table[i][j] += 1
    return table


def information(counts):
    total = sum(map(sum, counts))
    if total == 0:
        raise ValueError('no empirical law for empty records')
    rows = list(map(sum, counts))
    cols = [sum(row[j] for row in counts) for j in range(len(counts[0]))]
    return sum(n/total*(math.log2(n)+math.log2(total)-math.log2(rows[i])-math.log2(cols[j]))
               for i,row in enumerate(counts) for j,n in enumerate(row) if n > 0)


def main():
    dataset = Path(__file__).with_name('penguins.csv')
    assert hashlib.sha256(dataset.read_bytes()).hexdigest() == DATA_SHA256
    with dataset.open(newline='', encoding='utf-8') as file:
        records = list(csv.DictReader(file))
    if any(row['species'] not in SPECIES or row['island'] not in ISLANDS
           or row['year'] not in ('2007','2008','2009') for row in records):
        raise ValueError('unexpected selected-field value')
    results=[]
    for year in ('all','2007','2008','2009'):
        selected = records if year=='all' else [r for r in records if r['year']==year]
        table, grouped = count_table(selected), count_table(selected, True)
        mi, reduced = information(table), information(grouped)
        library = float(mutual_info_score(None,None,contingency=np.array(table)))/math.log(2)
        assert abs(mi-library) < 1e-12
        assert reduced <= mi+1e-12
        assert abs(information([[sum(row)] for row in table])) < 1e-12
        print(year, 'N', len(selected), 'species-by-island counts', table)
        print('MI / coarsened MI / discarded bits', *[f'{v:.9f}' for v in [mi,reduced,mi-reduced]])
        if year!='all':
            results.append((len(selected),mi))
    conditional = sum(n*mi for n,mi in results)/len(records)
    uniform = sum(mi for _,mi in results)/len(results)
    print('year counts', [n for n,_ in results])
    print('I(species;island|year) / uniform-year mean bits', f'{conditional:.9f}', f'{uniform:.9f}')


if __name__ == '__main__':
    main()
```

Output:

```text
all N 344 species-by-island counts [[44, 56, 52], [0, 68, 0], [124, 0, 0]]
MI / coarsened MI / discarded bits 0.750428171 0.616057102 0.134371069
2007 N 110 species-by-island counts [[10, 20, 20], [0, 26, 0], [34, 0, 0]]
MI / coarsened MI / discarded bits 0.810143279 0.642801460 0.167341818
2008 N 114 species-by-island counts [[18, 16, 16], [0, 18, 0], [46, 0, 0]]
MI / coarsened MI / discarded bits 0.691592680 0.575635901 0.115956780
2009 N 120 species-by-island counts [[16, 20, 16], [0, 24, 0], [44, 0, 0]]
MI / coarsened MI / discarded bits 0.735117842 0.614120289 0.120997553
year counts [110, 114, 120]
I(species;island|year) / uniform-year mean bits 0.744684498 0.745617934
```

The CSV reader validates the selected categorical fields and checks the declared file hash. The scalar sum uses integer counts and log differences; scikit-learn receives the same contingency. Assertions compare their units, verify coarsening does not increase empirical MI, and check that merging every island into one group gives zero. Counting costs O(N); the tiny fixed tables cost O(rc). There is no fitted predictive model or train/test estimate in this descriptive experiment. Keep the file's CC0 provenance with it: [Palmer penguins documentation](https://allisonhorst.github.io/palmerpenguins/) describes the dataset, and [Gorman, Williams and Fraser](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) describes the field study.

### Distinguish a critic objective from exact information

An information-based training objective can avoid an explicit density estimate while still depending on a precise sampling law. InfoNCE asks which candidate belongs with a context. Draw how the candidate set is made before interpreting a score.

[[M49]]

For context X, one candidate Y⁺ comes from the conditional law p(y|X). The other K−1 candidates come independently from the target marginal p(y). A fixed positive critic f(x,y) scores all candidates, and the selected positive receives normalized score f(X,Y⁺)/Σ_jf(X,Y_j). Its negative log is a classification loss. Averaging over this population sampling experiment gives L_K. Negatives drawn from a different law, dependent selection rules or an adaptive critic require rechecking the argument.

The population bound and one finite observed score are distinct quantities. The next scale shows the bound's own ceiling without turning that ceiling into a claim about true MI.

[[M50]]

Under the stated sampling setup, I(X;Y)≥log K−L_K in the same log units. Since L_K≥0, this displayed lower bound cannot exceed log K. True MI can be larger. An observed minibatch loss is a random estimate of the population expectation; optimizing a critic on those same observations creates an additional selection issue. A good classification loss is therefore not automatically a trustworthy measurement of true MI.

Another variational route uses a real-valued critic T and the population functional E_joint[T]−log E_product[exp(T)], under conditions making these expectations meaningful. Its value is at most joint-versus-product KL. The exponential term is sensitive to events that a finite sample can miss.

[[M51]]

The product-law picture contains a rare region with large critic score. If a sample misses it, its empirical mean of exp(T) can underestimate the population denominator, making the empirical functional look too large. This explains a risk; it is not by itself a proof of every estimator's finite-sample error. MINE parameterizes a critic and optimizes such variational objectives, with its own gradient and estimation choices. Distribution-free high-confidence lower bounds from finite data have formal limitations of order log(sample size). That statement has a particular distribution-free confidence setting; it does not impose one universal ceiling on exact known-law calculations or every estimator using additional structural assumptions.

The contrastive-learning destination develops augmentation, negative sampling and full training. Here the owned outcome is to identify the population sampling law, distinguish the bound from a batch score, and state what a reported number measures. Original papers provide deeper derivations: [Poole and colleagues](https://proceedings.mlr.press/v97/poole19a/poole19a.pdf) compare variational bounds, [MINE](https://proceedings.mlr.press/v80/belghazi18a/belghazi18a.pdf) develops the neural critic route, and [McAllester and Stratos](https://proceedings.mlr.press/v108/mcallester20a/mcallester20a.pdf) state the distribution-free limitation precisely.

Before trusting an information claim, identify the variables and population, whether the number is exact information or a bound or an empirical estimate, its log units and measurement resolution, the assumed factorization and support, and how fitting was separated from evaluation. These are different parts of the experiment, not interchangeable caveats.

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

## Further learning

- [Cover and Thomas, chapter2](https://sites.stat.columbia.edu/liam/teaching/neurostat-spr11/papers/EM/Cover%26Thomas-Ch2.pdf): the finite identities, data-processing proof, sufficiency and Fano error-flag argument. Work through the conditional tables here before reading its compact proofs.
- [MIT6.441, Mutual Information](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf): a second treatment organized around channels and probability measures, useful for connecting the finite diagrams to Gaussian and singular examples.
- [The Information Bottleneck Method](https://arxiv.org/html/physics/0004057), section3: the predictive distortion and alternating equations. Read its annealing and solution discussion with the distinction between block minimization and joint global optimization in mind.
- [Deep Variational Information Bottleneck](https://arxiv.org/html/1612.00410v7), section3: the two surrogate bounds and Gaussian training objective. Translate its compression coefficient to this lesson’s reciprocal relevance convention before comparing formulas.
- [On Variational Bounds of Mutual Information](https://proceedings.mlr.press/v97/poole19a/poole19a.pdf), sections2.1–2.3: population variational and multisample bounds, with their sampling assumptions. [CPC](https://arxiv.org/html/1807.03748) explains the candidate-classification motivation; the rigorous bound treatment above avoids relying on the approximation in its original appendix.
- [Scikit-learn mutual_info_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.mutual_info_score.html) and [mutual_info_classif](https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.mutual_info_classif.html): count inputs, nat outputs, categorical/continuous distinctions and estimator controls. Use the full local bridge to compare the same fixture before choosing an estimator for new data.
- [Torch BCEWithLogitsLoss](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BCEWithLogitsLoss.html), [autograd.grad](https://docs.pytorch.org/docs/2.14/generated/torch.autograd.grad.html) and [SciPy SLSQP](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html): the ordinary operations used by the bounded comparisons, including reduction, gradient and termination contracts.

The original small programmes use Python’s standard library. The array and observed-data routes additionally use NumPy2.3.5, SciPy1.18.1 and scikit-learn1.9.1; the Gaussian comparison uses Torch2.14.0 on CPU. Save each complete source under its shown filename. Keep `finite_ib_reference.py` beside `finite_ib_numpy.py`, and the attributed `penguins.csv` beside `penguins_information.py`. Each executable file has its own stated example; the helper and exercise files define reusable functions.
