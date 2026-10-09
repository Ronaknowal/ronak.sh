Two sensors both produce a long stream of readings. One reveals a fault; the other mostly records an irrelevant lighting change. Which stream is useful, and what should a smaller representation preserve? We will answer with distributions, then build an encoder that trades retained detail against predictive information.

 

The preceding lesson measured uncertainty with entropy. Here we ask how much that uncertainty changes when another variable is revealed. Then we turn the question around: design what to reveal. Nine complete Python programs use only the standard library and have verified output. Save a program as `example.py` and run `python example.py`. The browser models calculate finite sums or explicitly identified simulated samples; their graphs are computed from those quantities.

 

## 1. Measure the value of an observation

 

Let Y be a binary label: zero or one, equally likely. Before seeing anything else, its entropy is one bit. Now observe a binary feature X that agrees with Y on 80% of cases. After X=0, assign probabilities (.8,.2) to the two labels; after X=1, assign (.2,.8). Both conditional distributions have entropy about .722 bits. The average uncertainty removed is therefore `1 − .722 = .278 bits`.

 

That average reduction is **mutual information**, or MI. It is a property of the joint probability law of X and Y. It is not the accuracy of one particular classifier, the number of features, or a claim that X caused Y. A classifier can fail to use information that its input contains.

 

$$
I(X;Y)=H(Y)-H(Y\mid X).
$$

 

Read the vertical bar as “given.” The conditional entropy averages the uncertainty after each possible observation, weighting it by how often that observation occurs. We write h₂(p)=−p log₂p−(1−p)log₂(1−p) for the entropy of a binary probability pair (p,1−p), with zero terms omitted. If one X value is rare, its conditional entropy contributes little to the average. The colored bars below show label probabilities; entropy is calculated from their shape, not from total bar length.

 

[[JointInformationLab]]

 

Check: Set the flip probability to 1. Does a feature that is always wrong contain no information?

No. It determines the label exactly by inversion. With balanced X, the remaining uncertainty is zero and MI is one bit. A fixed predictor that copies X has zero accuracy, while a predictor that inverts X is perfect. Information concerns what could be inferred from the distribution, rather than whether a particular decision rule is sensible.

 

“Observations reduce uncertainty” is an average statement. Suppose two independent fair bits U and V determine Y=U OR V. Initially P(Y=1)=.75, with entropy about .811 bits. Seeing U=0 leaves the fair bit V, so this particular observation raises uncertainty to one bit. Seeing U=1 determines Y. Their average remaining entropy is .5 bits, which is lower than .811.

 

## 2. Compare the pairing with independence

 

The first joint table has .4 on each agreement cell and .1 on each disagreement cell. Its row totals and column totals are both (.5,.5). If these same marginals were independent, every cell would be .25. Dependence is visible in the *pairing*: some combinations happen more often than independence predicts, and others less often.

 

$$
\begin{gathered}\imath(x;y)=\log_2\frac{p(x,y)}{p(x)p(y)},\\ I(X;Y)=\sum_{x,y}p(x,y)\,\imath(x;y).\end{gathered}
$$

 

The lowercase quantity, **pointwise mutual information**, evaluates one pair with positive probability. For an agreement cell it is log₂(.4/.25)≈.678 bits; for a disagreement cell it is log₂(.1/.25)≈−1.322 bits. Negative pointwise information means this pair is less likely than under the independent reference. Weight all four contributions by their actual probabilities to get a nonnegative average .278 bits.

 

A zero-probability cell contributes zero to the expectation; do not evaluate log(0) and multiply an infinity by zero in code. Whenever the joint probability is positive, both associated marginals are positive. A conditional distribution for a row of total probability zero is not determined by the joint and should not be displayed as an observed fact.

 

### Why this equals uncertainty removed

 

Factor p(x,y)=p(x)p(y|x). The ratio becomes p(y|x)/p(y), and its logarithm becomes a difference. Averaging −log₂p(y) gives H(Y); averaging −log₂p(y|x) gives H(Y|X). Thus MI is also the improvement in expected log loss obtained by using the true conditional label distribution instead of the true marginal label distribution.

 

$$
\begin{gathered}\begin{aligned}I(X;Y)&=\mathbb E\log_2p(Y\mid X)\\&\quad-\mathbb E\log_2p(Y),\end{aligned}\\I(X;Y)=D_{\rm KL}(P_{XY}\Vert P_XP_Y).\end{gathered}
$$

 

KL from the previous lesson is nonnegative, with equality exactly when its two distributions coincide. Consequently MI is zero exactly when X and Y are independent. Swapping X and Y leaves the joint-versus-product expression unchanged, so MI is symmetric even though predicting X from Y can be a very different practical task from predicting Y from X.

 

| Fact | Reason or interpretation |
| --- | --- |
| 0 ≤ I(X;Y) ≤ min(H(X),H(Y)) | The conditional entropies are nonnegative. You cannot remove more finite label uncertainty than existed. |
| I(X;X)=H(X) | Seeing the exact discrete value removes all its uncertainty. |
| If Y=f(X), I(X;Y)=H(Y) | The output is determined; X may still contain information unrelated to Y. |
| Bits use log₂; nats use ln | Multiply bits by ln 2 to get nats. Do not compare numbers without checking the log base. |
| Renaming categories does not change MI | Invertible relabeling changes neither probabilities nor the pairing structure. |

 

Question: With balanced labels and a 20% flip probability, how much uncertainty remains after observing X?

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

Retained output:

```text
0.278 1.0 0.722
```

 

This retains the original lesson’s exact table and output. To make it your own, change the joint probabilities while preserving total mass one, then independently compute the row and column totals. Reusing the old marginals after changing the table would calculate the wrong reference distribution.

 

## 3. Find information that single features miss

 

Pearson correlation measures linear association. Consider a centered sensor reading X equally likely to be −1, 0 or 1, and a label Y=X² that identifies a nonzero magnitude. Positive and negative readings cancel in the covariance: E[XY]=E[X]=0. Yet X determines Y exactly, giving MI=H(Y)=h₂(1/3)≈.918 bits. A sensor threshold on magnitude preserves the label; a linear trend can miss it.

 

[[NonlinearInformationFigure]]

 

Question: Let X be equally likely −1, 0, 1 and Y=X². Does zero correlation make X useless?

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

Retained output:

```text
covariance: 0.000000
MI bits: 0.918296
remaining label entropy: 0.000000
sign-only MI: 0.251629
```

 

Information can also live in a *combination* of inputs. Let A and B be independent fair bits and let Y=A XOR B: one exactly when the bits differ. Either bit alone leaves the label fair, so I(A;Y)=I(B;Y)=0. The pair determines Y, giving I((A,B);Y)=1 bit. Rejecting every feature with zero individual MI would discard both useful ingredients.

 

[[ConditionalInformationLab]]

 

### Ask what is added after something is already known

 

**Conditional mutual information**, I(A;Y|B), computes dependence separately inside each B slice, then averages using p(b). Write P_b for the conditional joint p(a,y|b) and Q_b for the product p(a|b)p(y|b). In each XOR slice, knowing A determines Y. Therefore I(A;Y|B)=1 bit even though unconditional I(A;Y)=0 for fair B.

 

$$
\begin{gathered}I(A;Y\mid B)\\=\sum_b p(b)D_{\rm KL}(P_b\Vert Q_b),\\ I((A,B);Y)\\=I(B;Y)+I(A;Y\mid B).\end{gathered}
$$

 

The second line is the **chain rule**: revealing B first, then A, removes the same total uncertainty as revealing the pair. It follows by adding and subtracting H(Y|B). The incremental term is nonnegative, but it need not equal I(A;Y). Conditioning may reveal a dependence, as in XOR, or remove one: if X=Y=C for a fair common bit C, then I(X;Y)=1 but I(X;Y|C)=0. After fixing C, both values are constants.

 

Question: A is fair, B has probability 0.25 of being 1, and Y=A xor B. Calculate individual, joint and conditional information.

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

Retained output:

```text
A MI: 0.188722
B MI: 0.000000
pair MI: 1.000000
I(A;Y|B): 1.000000
chain rule: 1.000000
common-bit unconditional / conditional: 1.000000 0.000000
```

 

This program changes P(B=1) to .25. A now has about .189 bits about Y, while B alone still has zero; the pair still has one. Information overlaps and interactions cannot generally be represented as three ordinary, nonnegative overlapping circles. Conditional information is a safer calculation than assuming a Venn picture implies all interactions are positive.

 

These ideas matter when selecting sensor pairs, genetic markers or complementary image channels. Evaluate an added feature conditional on what the system already uses, and validate the resulting predictor on held-out data. A high MI can arise through confounding or leakage; an observational dependence is not an intervention effect.

 

## 4. Follow information through a processing step

 

Now produce a representation Z from X using an encoder q(z|x). The encoder can be deterministic or randomized. Its defining restriction is that once X is known, the generation of Z does not additionally consult Y. The joint law factors as p(x,y)q(z|x). This is the Markov condition Y–X–Z; the arrows in the figure identify conditional distributions, not causal evidence.

 

[[ProcessingFigure]]

 

The **data-processing inequality** says I(Y;Z)≤I(Y;X). The processing step can make a pattern easier for a limited predictor to use, but cannot create population information about Y beyond the information available in X under this factorization.

 

$$
\begin{gathered}I(Y;(X,Z))\\=I(Y;X)+I(Y;Z\mid X)\\=I(Y;X),\\I(Y;(X,Z))\\=I(Y;Z)+I(Y;X\mid Z).\end{gathered}
$$

 

The first conditional term vanishes by the Markov condition; the second is nonnegative. Subtracting yields the exact loss I(Y;X)−I(Y;Z)=I(Y;X|Z). Equality holds precisely when Z leaves no additional label information in X. Such a representation is sufficient for predicting Y under this joint law; it need not reconstruct X.

 

Question: Y flips X with probability 0.1 and Z independently flips X with probability 0.2. How much of the original label information is lost?

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

Retained output:

```text
I(X;Y): 0.531004
I(Z;Y): 0.173254
I(X;Y|Z): 0.357751
DPI gap identity: True
```

 

Here Y flips a fair X with probability .1 and Z independently flips X with probability .2. The original label information is .531004 bits; the encoded information is .173254 bits. The difference .357751 is calculated again as conditional MI. Noise is introduced in a specified channel, so the claim can be checked from the full joint law.

 

Check: A programmer appends the true label to Z during evaluation, then reports that I(Y;Z) exceeded I(Y;X). Did the inequality fail?

No. The construction now depends on Y beyond X, violating the factorization. For a learned encoder, discuss fresh evaluation pairs with fitted parameters held fixed, or explicitly include the training data and parameter randomness in the probability model. Treating a label-trained map and its training samples as if all variables were an independent fresh pair can conceal leakage.

 

## 5. Keep the signal without the nuisance

 

Let the input be X=(S,N), two independent fair bits. S is a useful signal and N is a nuisance, such as an irrelevant acquisition setting. The label Y is S flipped with probability .1. The input contains two bits in total, but only 1−h₂(.1)≈.531 bits about the noisy label. Encoding S alone retains all of that label information. Encoding N alone retains one bit of input detail and no label information.

 

The **information bottleneck** balances two quantities: the **rate** R=I(X;Z), measuring how much the representation retains about the input, and the **relevance** T=I(Y;Z), measuring what it retains about the chosen task. We minimize the following objective over allowed encoders.

 

$$
\begin{gathered}J(q)=I(X;Z)-\beta I(Y;Z),\\\beta\geq0,\\ p(x,y,z)=p(x,y)\,q(z\mid x).\end{gathered}
$$

 

β, pronounced “beta,” is the relevance weight. Larger β rewards task information more strongly relative to retained input information. This lesson uses this convention consistently; some papers place β on the compression term instead. The variables and the objective identify the convention, not the letter alone.

 

[[InformationBottleneckLab]]

 

The dotted family in the information plane contains encoders that flip S with different probabilities. It is a computed candidate family, not a claim that these points solve every possible bottleneck optimization. At β=3, storing S gives J≈−.593, storing both bits gives J≈.407, and storing no input information gives J=0. The extra nuisance bit has a measurable cost without a relevance benefit.

 

Question: X contains a fair signal S and an independent fair nuisance N. The label flips S with probability 0.1. Which representation wins at beta = 3?

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

Retained output:

```text
constant: 0.000000 0.000000 0.000000
signal: 1.000000 0.531004 -0.593013
nuisance: 1.000000 0.000000 1.000000
both: 2.000000 0.531004 0.406987
noisy signal: 0.278072 0.173254 -0.241689
```

 

### Two limits expose what the objective asks for

 

For 0≤β≤1, data processing also gives I(Y;Z)≤I(X;Z). Hence J≥(1−β)I(X;Z)≥0. An input-independent Z achieves zero, so a trivial representation is a global optimum in that regime. At β=1, informative equality cases can tie; do not infer that the optimum is always uniquely constant. With larger β, an informative encoder may beat zero, as the example demonstrates.

 

Even very large β does not require memorizing all of X. It prioritizes relevance, while the positive rate term still distinguishes equally relevant candidates. If the target changes from S to the nuisance N, the same representation preferences should change. “Useful information” is always relative to a target, distribution and permitted encoder family.

 

For a deterministic finite encoder, I(X;Z)=H(Z), because H(Z|X)=0. For a randomized encoder, I(X;Z)=H(Z)−H(Z|X). Thus a random codeword can have high entropy but no information about X. Neither mutual information nor latent dimension alone equals serialized file size, memory traffic or the length of one physical message. Operational coding questions require additional assumptions; the next lesson develops that connection.

 

## 6. Compute a finite bottleneck

 

An objective is only useful if we can compute an encoder. Start with four possible inputs and two codewords. Each row q(z|x) gives the probabilities of assigning one input to the two codewords. Two distributions are implied by those assignments: how often each codeword occurs, and which labels occur within it.

 

$$
\begin{gathered}p(z)=\sum_xp(x)q(z\mid x),\\p(x\mid z)=\frac{p(x)q(z\mid x)}{p(z)},\\p(y\mid z)=\sum_xp(x\mid z)p(y\mid x).\end{gathered}
$$

 

For p(z)>0, the last line is a weighted average of input-specific label distributions. The denominator in p(x|z) matters: it converts the assigned joint mass into the conditional weights used by that average. The browser uses strictly positive initial probabilities and bounded settings, so both codewords remain available in its finite updates.

 

Now compare an input’s label distribution p(y|x) with a codeword’s current label distribution p(y|z). Their KL divergence is the **predictive distortion**: assigning x to a codeword with the wrong label mix loses task detail. Prefer common codewords, but penalize predictive mismatch. Form unnormalized assignment weights a_z(x), then divide by their sum over codewords.

 

$$
\begin{gathered}d(x,z)\\=D_{\rm KL}(p(y\mid x)\Vert p(y\mid z)),\\a_z(x)=p(z)\exp[-\beta d(x,z)],\\q_{\rm new}(z\mid x)=\frac{a_z(x)}{\sum_j a_j(x)}.\end{gathered}
$$

 

In this exponential formula d uses natural logarithms, so it is in nats. If d is in bits, use 2 raised to −βd instead of exp(−βd). Changing the log base for both rate and relevance scales J by a common positive constant and does not change its optimizer.

 

[[BottleneckIterationLab]]

 

Each complete update uses the previous marginal and decoder to form distortions, normalizes every new encoder row, then recomputes the marginal and decoder. The “distortions used” table deliberately refers to the previous decoder. The current assignment bars and objective refer to the new state. There is no hidden animation or prewritten trajectory.

 

### Where the update comes from, and what convergence means

 

Introduce an auxiliary codeword distribution r(z) and auxiliary label decoder w(y|z). Consider the following free energy, with expectations taken under p(x)q(z|x). Keep all logarithms in one base; use nats for the differentiation below.

 

$$
\begin{gathered}D_w(x,z)\\=D_{\rm KL}(p(y\mid x)\Vert w(y\mid z)),\\F(q,r,w)\\=\mathbb E_{x,z}\log\frac{q(z\mid x)}{r(z)}\\+\beta\mathbb E_{x,z}D_w(x,z).\end{gathered}
$$

 

For fixed q, a minimizing r is its marginal p(z), and a minimizing w is its label conditional p(y|z) on positive-mass codewords. To see both claims, add and subtract the logs of these two true distributions. The extra terms are nonnegative KL divergences. At β=0 the decoder term is absent, so its minimizer is not unique.

 

$$
\begin{gathered}F(q,r,w)\\=J(q)+\beta I(X;Y)\\+D_{\rm KL}(p(z)\Vert r(z))\\+\beta\mathbb E_zD_{\rm KL}(p(y\mid z)\Vert w(y\mid z)).\end{gathered}
$$

 

For fixed r,w, each encoder row minimizes a weighted log ratio plus a linear distortion cost, subject to summing to one. Its derivative is log q(z|x)−log r(z)+1+βd(x,z)+λₓ. Set that derivative to zero and normalize: this gives the exponential row update. These are exact minimizations of separate blocks, not a heuristic rule to assign every input to its closest codeword.

 

Each exact block update cannot increase F. After updating r and w, F=J+βI(X;Y), with the last term fixed by the original joint law. Thus the displayed J cannot increase, apart from floating-point roundoff. This is not a proof of a unique or global optimum: the blocks are not jointly convex in all variables. A bounded monotone sequence of objective values can stabilize while the encoder sits at an inferior stationary point.

 

Question: At beta = 3, compare an informative initialization with an exactly symmetric one. Does a stationary objective certify the best solution?

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

Retained output:

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

 

At β=3, the informative start reaches J≈−.600835 after 40 updates, slightly better than the deterministic signal encoder’s −.593013. A little assignment noise reduces rate enough to compensate for the small relevance loss. A perfectly symmetric start keeps both codewords identical and remains at J=0. Try that start explicitly. “Nothing changed” is not evidence that no better encoder exists. Multiple starts, feasible comparison encoders and downstream checks are needed.

 

For K codewords, A input values and B label values, a direct dense update computes weighted decoder sums and predictive distortions with O(ABK) arithmetic and stores the corresponding tables. The small browser model is practical because A=4,B=2,K=2. Estimating these laws or representing a huge input alphabet introduces a different problem; we turn to the variational approach next.

 

## 7. Distinguish a training bound from information

 

For a high-dimensional input, the marginal p(z)=Eₓq(z|x) and true label conditional p(y|z) may be difficult to evaluate. A variational method replaces them with tractable approximations while tracking which direction the replacement changes the objective. The encoder itself is still q(z|x); the reference r(z) and predictive decoder s(y|z) have separate roles.

 

$$
\begin{aligned}U&=\mathbb E_xD_{\rm KL}(q(z\mid x)\Vert r(z))\\ &=I(X;Z)+D_{\rm KL}(p(z)\Vert r(z))\\ &\geq I(X;Z).\end{aligned}
$$

 

The rate replacement U is an **upper bound**. Add and subtract log p(z) to obtain the exact gap. Merely making this bound smaller could mean tightening the reference mismatch, reducing actual input information, or both. They are distinguishable in the finite lab.

 

$$
\begin{gathered}C=\mathbb E_{y,z}[-\log s(y\mid z)],\\G_s=\mathbb E_zD_{\rm KL}(p(y\mid z)\Vert s(y\mid z)),\\L=H(Y)-C\\=I(Y;Z)-G_s\leq I(Y;Z).\end{gathered}
$$

 

C is the decoder’s expected cross-entropy, and G_s names its nonnegative conditional KL gap. The relevance replacement L is a **lower bound**. A poor decoder can make L negative, even though actual MI cannot be negative. A zero decoder probability for an event with positive true mass gives infinite cross-entropy; support choices matter.

 

[[VariationalInformationLab]]

 

The encoder stays fixed in this investigation. Moving the reference and decoder therefore cannot change its true information. It changes only the two gaps. Matching r to the true marginal and s to the true conditional closes both gaps. In a real model, those exact choices may be unavailable.

 

$$
\begin{gathered}J=I(X;Z)-\beta I(Y;Z)\\ \leq U+\beta C-\beta H(Y).\end{gathered}
$$

 

For a fixed data law, H(Y) is constant. Minimize U+βC, or, when β>0, divide by β and minimize C+(1/β)U. This explains the reciprocal parameter convention in a loss that writes prediction plus a compression penalty. At β=0, that division is invalid; the objective reduces to rate minimization.

 

Question: Fix the noisy-signal encoder. Change only the reference marginal and predictive decoder. Should actual mutual information change?

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

Retained output:

```text
matched rate upper / relevance lower: 0.278072 0.173254
rate / predictive gaps: 0.000000 0.000000
true J / upper J: -0.241689 -0.241689
mismatched rate upper / relevance lower: 0.600000 0.110944
rate / predictive gaps: 0.321928 0.062309
true J / upper J: -0.241689 0.267168
```

 

### Connect the finite calculation to neural training

 

A neural encoder can output the mean μ(x) and positive standard deviation σ(x) of a diagonal Gaussian. With r(z) a standard normal, its per-input KL has a closed form. Draw independent standard-normal ε and set z=μ(x)+σ(x)⊙ε, where ⊙ is elementwise multiplication. The pathwise derivative from Variational Inference lets gradients pass through μ and σ while holding the sampled ε fixed. For one fixed input, abbreviate μ_j=μ_j(x) and v_j=σ_j(x)² in the KL formula below.

 

$$
\begin{gathered}D_{\rm KL}(q(z\mid x)\Vert\mathcal N(0,I))\\=\frac12\sum_j\left(\mu_j^2+v_j-1-\log v_j\right).\end{gathered}
$$

 

This Gaussian formula is in nats. Use a decoder cross-entropy in nats as well. Average the analytic KL and sampled label loss over training examples; optimize encoder and decoder parameters, then evaluate task performance, calibration and the same declared surrogate on fresh data. The analytic KL removes sampling noise from that term, but does not turn it into exact I(X;Z): the marginal mismatch gap remains.

 

A variational autoencoder instead reconstructs X under a generative model. A supervised bottleneck explicitly rewards information about Y. Their stochastic encoders and KL calculations can look similar while their learning objectives ask for different information. An information-plane plot does not by itself demonstrate generalization, fairness, privacy or robustness. For example, exact population I(Z;A)=0 implies marginal independence from attribute A, but does not establish conditional independence after another variable is revealed; an estimated value near zero is weaker still.

 

## 8. Handle continuous values and measurement noise

 

The joint-versus-product definition extends beyond finite tables: MI is KL between the joint probability measure and the product of its marginals. It remains nonnegative and may be infinite. Differential entropy can be negative and changes with coordinate units, so it must not be substituted into discrete entropy intuition without checking assumptions.

 

$$
I(X;Z)=D_{\rm KL}(P_{XZ}\Vert P_XP_Z).
$$

 

When joint densities exist and the needed differential entropies are finite, one may write I(X;Z)=h(X)+h(Z)−h(X,Z), or h(Z)−h(Z|X). Do not subtract two undefined or infinite differential entropies. For jointly Gaussian scalar variables with correlation ρ and |ρ|<1, the finite result is −½log(1−ρ²).

 

Take X and E to be independent standard normals and observe Z=X+σE with σ>0. The observation variance is 1+σ²; its conditional noise variance is σ². Their Gaussian entropy difference gives a particularly useful measurement example.

 

$$
I(X;Z)=\frac12\log_2\left(1+\frac{1}{\sigma^2}\right).
$$

 

[[GaussianInformationFigure]]

 

Question: Let X be standard Normal and Z=X+sigma E with independent standard-Normal E. What happens as measurement noise shrinks?

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
print('sigma=0:', 'singular deterministic joint; MI is infinite')
# The infinite case is a measure-theoretic conclusion, not a finite estimate.
```

Retained output:

```text
0.25 MI bits: 2.043731 rescaling unchanged: True
0.5 MI bits: 1.160964 rescaling unchanged: True
1.0 MI bits: 0.500000 rescaling unchanged: True
2.0 MI bits: 0.160964 rescaling unchanged: True
sigma=0: singular deterministic joint; MI is infinite
```

 

Halving a noise standard deviation is not halving its variance: the variance becomes a quarter. This is why the squared scale appears in the formula. Multiplying the entire observation Z by 10 changes its numerical units but preserves information, because it is invertible. Adding fresh noise or quantizing to bins is a processing operation and cannot increase population MI under the stated channel.

 

At σ=0, the observation is the exact real value X and the MI is infinite. The joint law is concentrated on the diagonal Z=X, while two independent continuous draws hit that diagonal with probability zero. KL is therefore infinite. More generally, a deterministic Z=f(X) with a non-atomic output law has infinite MI with X; an exact non-atomic value encodes arbitrarily fine distinctions. A deterministic finite-valued Z instead has MI=H(Z), which can be finite.

 

This distinction matters when someone plots a finite “MI of a deterministic neural layer.” They must specify quantization, injected noise, an estimator, or another modeling choice. A finite estimate does not refute the infinite exact-value result. A quantized sensor’s MI refers to the bins actually retained, not to an inaccessible infinitely precise reading.

 

## 9. Check what a sample can support

 

So far we knew the probability law and evaluated it. With observed data, a simple **plug-in estimator** replaces probabilities by cell counts divided by sample size, then computes the same MI formula. Its output is the MI of the empirical table. That is not automatically the MI of the population that generated the table.

 

[[InformationEstimationLab]]

 

Under the independent simulator, true population MI is zero. Random counts will usually not factor into exactly independent marginals, so empirical MI is often positive. Sparse tables make the problem visible: an 8×8 table has many more cells to estimate than a 2×2 table with the same number of observations. For general dependent laws, an individual estimation error can be positive or negative; do not turn this independence example into a universal sign rule.

 

The shuffled results retain the same observed X and Y values and change their pairing. They illustrate how much apparent dependence can arise with those observed marginals after association is broken. These twenty shuffles are a diagnostic display, not a confidence interval or a calibrated significance test. A formal permutation test needs an exchangeability argument and a specified statistic and decision rule; temporal, grouped or repeated measurements may not permit unrestricted row shuffling.

 

Question: Generate independent categorical pairs. Compare the empirical MI with its known population value 0, then inspect unique identifiers.

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

Retained output:

```text
2 40 plug-in MI: 0.015069 true MI: 0
8 40 plug-in MI: 0.785079 true MI: 0
8 4000 plug-in MI: 0.007202 true MI: 0
empirical ID-label MI: 1.000000
empirical label entropy: 1.000000
```

 

The last calculation assigns every training row a unique identifier. The empirical label entropy is one bit, and the identifier determines every observed label, so its empirical MI is also one bit. This does not establish usefulness for a new identifier. Fit feature selection, binning and estimator tuning inside training folds, then evaluate the complete fitted procedure on held-out data. Splitting after selecting features using all labels leaks evaluation information.

 

### A contrastive objective is another bound with assumptions

 

InfoNCE turns paired-data learning into identifying the positive item among K candidates. Under its population sampling setup, one candidate is drawn conditionally on the context, and the other K−1 are independent draws from the target marginal. For a fixed positive scoring function, its expected cross-entropy Lₖ gives the bound I≥log K−Lₖ in the same log units. Since this loss is nonnegative, the displayed bound is at most log K. This is not a statement that true MI is at most log K.

 

An observed minibatch loss is a random estimate of that expectation, and training the critic on the same data adds another selection issue. Negatives chosen from a different distribution change the argument. The dedicated contrastive-learning topic develops the objective and its sampling choices; do not label its training loss as an exact MI measurement. Distribution-free, high-confidence lower bounds from finite samples also have formal limits of order log(sample size); this does not forbid useful estimation under additional model assumptions or imply that all MI estimators obey one universal ceiling.

 

| Ask | Why the answer changes the claim |
| --- | --- |
| Which variables and population? | A target, acquisition condition or deployment distribution change can change what is relevant. |
| Exact law, fitted bound or sample estimate? | These have different gaps and different uncertainty. |
| Which units and measurement resolution? | Bits versus nats rescale the number; quantization can change the random variables themselves. |
| Which factorization and support? | Data processing needs the Markov condition; KL and cross-entropy need compatible positive mass. |
| Which validation separates fitting from evaluation? | A critic, feature selector or binning rule can overfit the same observations used to score it. |

 

### Keep counts, probabilities and units distinct in the API

 

The complete bridge computes plug-in MI from nonnegative integer counts, masking empty cells before taking logs. It compares the result with `mutual_info_score(contingency=counts)` and with `mutual_info_classif` on the expanded rows using `discrete_features=True`. Both library results are in nats; divide by log(2) to match the lesson's bits. Pass actual counts to the contingency API, not a normalized probability table. Install NumPy 2.3.5 and scikit-learn 1.9.1; run `python mutual-information-library-bridge.py`.

 

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
    print("identifier population relevance established", False)


if __name__ == "__main__":
    main()
```

```text
manual/library/feature nats [0.130812036, 0.130812036, 0.130812036]
same MI in bits 0.188721876
duplicate rows and relabel invariants True
independent table nats -0.0
unique identifier empirical MI in bits 1.0
identifier population relevance established False
```

 

The table [[30,10],[10,30]] gives .130812036 nats or .188721876 bits. Duplicating every row and relabeling categories preserve this plug-in value. A unique identifier gives one empirical bit for these balanced labels, without establishing population relevance. The dense table calculation costs O(rc) time and storage for r-by-c categories; expanding N observations is only for this small API comparison. Large sparse count tables should stay sparse.

 

The finite information-bottleneck iteration above already owns its self-consistent update, initialization sensitivity and objective trace. A feature-selection MI score is not an IB optimizer. For fitted-data selection, reuse [Feature Selection & Importance](/learn/topic/feature-selection-importance-shap-permutation-mutual-info), which owns train-only selection, held-out evaluation and leakage controls. Continuous nearest-neighbor MI uses different assumptions and tuning; changing the discrete flag does not merely change storage.

 

Implementation practice: preserve and destroy pairing

Relabel both categories, duplicate rows, then replace the table by [[2,4],[3,6]]. Add an all-zero category. State what the estimator should do before interpreting feature relevance.

Solution and checks

Relabeling and duplication preserve the first value. The replacement factors into its row and column marginals, so MI is zero up to roundoff; adding a zero-count category changes nothing. These invariances test the implementation, while held-out relevance and estimator bias remain separate statistical questions.

 

[mutual_info_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.mutual_info_score.html) and [mutual_info_classif](https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.mutual_info_classif.html) document the units and discrete-feature contract used here.

 

## 10. Practise and connect the next question

 

Practice: A joint table has rows (.45,.15) and (.10,.30). Compute both marginals, I(X;Y) and H(Y|X). Identify one negative pointwise information value.

Hint: 

Use the new row totals (.6,.4) and column totals (.55,.45). Weight log ratios by joint probabilities.

Solution: H(Y)=h₂(.45)≈.992774 bits. Each row, after normalization, has probabilities (.75,.25) or (.25,.75), so H(Y|X)=h₂(.25)≈.811278. MI≈.181496 bits. For cell (0,1), log₂(.15/(.6·.45))=log₂(5/9)≈−.847997 bits; its weighted contribution is about −.127200. Negative local contributions do not make the total negative.

 

Practice: Let A be fair and B independent with P(B=1)=.1. For Y=A XOR B, find I(A;Y), I(B;Y), I((A,B);Y) and I(A;Y|B). Would adding the first two numbers recover the pair’s information?

Hint: 

Y is fair because A is fair. Given A, the only remaining uncertainty is B; given B, A still determines Y.

Solution: The answers are 1−h₂(.1)≈.531004, zero, one and one bit. Adding individual MI gives only .531004. The correct chain decomposition is I(B;Y)+I(A;Y|B)=0+1. The extra value of A after B is known differs from its value alone.

 

Practice: In the three-valued sensor example, compare Z₁=|X| and Z₂=1[X>0]. Which is sufficient for Y=X², and what conditional information is lost by Z₂?

Hint: 

For Z₂=0, the two equally likely possibilities are X=−1 and X=0. For Z₂=1, Y is fixed.

Solution: Z₁ determines Y, so I(Y;Z₁)=H(Y)≈.918296. For Z₂, H(Y|Z₂)=(2/3)·1+(1/3)·0=2/3 bit. Hence I(Y;Z₂)≈.251629 and I(Y;X|Z₂)=2/3. Z₁ is sufficient for this label; Z₂ loses magnitude information that still remains in X.

 

Practice: For the signal/nuisance example, compare constant, signal and both at β=.5 and β=4. Then change the target to the noiseless label Y=N. What representation should be preferred at β=4?

Hint: 

Use (rate,relevance)=(0,0),(1,.531004),(2,.531004). Recompute relevance after changing the label.

Solution: At β=.5 the three objectives are 0,.734498,1.734498. At β=4 they are 0,−1.124018,−.124018. The signal beats those two alternatives at β=4, without proving it is best among all stochastic encoders. With Y=N, storing N has objective 1−4=−3, storing S has 1, and storing both has 2−4=−2. A variable’s nuisance status belongs to the task, not to its name.

 

Practice: A two-codeword update has r=(.25,.75), β=2 and predictive distortions (0,ln 2) nats for one input. Calculate the new encoder row. Why would using the displayed bit value 1 inside exp give a different answer?

Hint: 

Form unnormalized weights r(z)exp(−βd) before normalizing.

Solution: The weights are (.25,.75/4)=(.25,.1875); normalization gives (4/7,3/7). Using exp(−2·1) incorrectly treats one bit as one nat. The equivalent bit calculation is .75·2⁻². Units inside an exponent affect the actual encoder, not merely its displayed number.

 

Practice: Suppose true rate=.6 and relevance=.4 bits, reference mismatch=.2 bits and decoder mismatch=.1 bits. Find both variational bounds and the objective gap at β=3. Does minimizing the upper objective guarantee that actual MI decreased?

Hint: 

The rate gap adds to rate; the predictive gap subtracts from relevance. Combine them with the same β as J.

Solution: The rate upper bound is .8 and relevance lower bound .3. True J=.6−3·.4=−.6; its upper bound is .8−3·.3=−.1, a gap .5=.2+3·.1. Reducing a mismatch can tighten the bound while the encoder and true MI remain fixed, so a lower bound-objective value alone does not identify which information changed.

 

Practice: X is standard normal. Compare observations X+.5E and 10(X+.5E), where E is independent standard normal. Then remove the noise. What happens if the noiseless observation is instead quantized to its sign?

Hint: 

Separate an invertible change of units, an exact real-valued observation and a finite-valued observation.

Solution: The noisy observations both have ½log₂5≈1.160964 bits. Exact X has infinite MI with itself. Its sign is a deterministic fair binary variable (the zero event has probability zero), giving exactly one bit. A one-dimensional output can therefore have finite or infinite information depending on noise and precision; dimension alone does not resolve the question.

 

Practice: Run the categorical experiment with eight categories and twenty observations under independence, then increase to two thousand. What should be recorded, and what conclusion would a single positive estimate fail to justify?

Hint: 

Record the declared population, seed, empirical table, estimator and sample size. The known population reference is zero; a trajectory need not decrease at every step.

Solution: Record those settings and the two empirical MI values, along with shuffled diagnostics if used. Under this independent law the true MI remains zero for both sample sizes. Sparse empirical pairings often produce positive apparent information; a particular larger sample can fluctuate either way, so no exact monotonic numerical answer is promised. A positive estimate alone is not proof of useful population dependence, a causal effect or a calibrated rejection of independence.

 

Practice: Design a feature-selection check for a neural sensor model with repeated recordings from each participant. It chooses channels by estimated MI with an intended movement label. Name a plausible leakage route and a validation change that addresses it.

Hint: 

Repeated rows from one participant are not automatically independent evidence about deployment to a new participant. Feature selection itself uses labels.

Solution: A channel can reveal participant or session identity correlated with training labels, and global MI selection can leak validation labels. If the intended use is new participants, split by participant first; fit preprocessing, binning and channel selection only on training participants within each fold. Evaluate the fitted pipeline on held-out participants, report task performance and uncertainty, and inspect changed acquisition conditions. A low-dimensional code or low estimated MI with an identity variable does not replace this evaluation.

 

Practice: Build a complete changed-task experiment from the finite bottleneck program. Keep X=(S,N) fair and independent, but increase the label flip probability to .2 and use β=4. Compare constant, signal and both; run 40 updates from informative and symmetric starts. State what the resulting evidence establishes.

Hint: 

Change LABEL to two rows (.8,.2) followed by two rows (.2,.8), and change each optimization call’s beta to 4. Validate row sums, recompute the joint laws, and check objective descent. Compare candidate values before interpreting the optimizer.

Solution: The constant, signal and both objectives are 0, −.112288 and .887712. The informative start after 40 updates gives rate .698380, relevance .218212 and J=−.174466. Its first two encoder rows have P(Z=1|X)≈.053630 and the last two ≈.946370. The symmetric start remains at rate=relevance=J=0. These are independently checked results for the declared initialization and finite run; verify them to about 10⁻⁵, row sums within 10⁻¹², and no objective increase beyond roundoff. They demonstrate an improved feasible stochastic encoder and an inferior stationary initialization. They do not establish the global optimum of every encoder family or performance on a different deployment distribution.

 

You can now distinguish information present in a joint law, information retained by an encoder, a variational bound used to train it, and an estimate computed from observations. The next topic in this module is [Rate-Distortion Theory](/learn/path/full-curriculum/rate-distortion-theory?module=math-foundations). It asks a complementary operational question: how much communication rate is needed when a specified amount of reconstruction distortion is acceptable? Here the distortion emerged from disagreement between predictive label distributions; there we choose a distortion criterion and study coding tradeoffs.

 

[[ORIGINAL_SOURCES_COMPONENT]]
