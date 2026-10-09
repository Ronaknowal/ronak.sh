# Support Vector Machines (SVM)

Many lines can separate the same observations. Which leaves the widest room around its decision, and how should we respond when observations conflict? We will build the score, perpendicular distance and paid shortfall, derive a checked optimizer, change similarity through kernels and choose a complete procedure using held-out evidence.

**First pass:** follow the worked picture and calculation at the start of each section. The visible deeper branches then explain certificates, complete optimization and feature approximations; return to those derivations after tracing the local example. Read the constraint-price introduction in §4 before using its coefficients in the kernel prediction. The prerequisites are the earlier [binary affine-score and logistic-loss explanation](/learn/path/full-curriculum/linear-logistic-regression#5-model-a-binary-outcome) and [dot product/projection explanation](/learn/path/full-curriculum/vectors-matrices-tensor-operations#3-a-dot-product-and-its-geometric-meaning); we rebuild the changed geometry and loss here.

Imagine classifying a machine's operating state using vibration and temperature. A boundary close to an observation is easy to cross after a small measurement change. We first use constructed observations so every geometric step is visible, then keep the earlier generated studies and add one observed Wine classification task. Those three sources of evidence have different purposes: hand calculation, recorded controlled experiment and a small real-data comparison.

Save complete programs with their shown filenames and run `python filename.py` in the compatible environment. Keep `svm_core.py` beside its driver `svm_mechanisms.py`; the driver uses an ordinary Python import. The other new programs are standalone. The earlier programs retain their recorded Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1 outputs; the new calculations also use NumPy2.3.5/sklearn1.9.1. Install the packages with `python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1`. The browser investigations consume their declared numerical state without installation. Different solver tolerances/versions can change final digits and support counts; exact saved evidence stays identifiable.

## 1. A score, a boundary and a real distance

### How do measurements become a signed score?

Follow the two measurements into matching weight products and the one bias addition.

<!-- figure: D01; x=(2,1) and w=(1,2) enter two labelled multiply rectangles giving2 and2; sum these with b=-1 to output3 and then +1. Bind each feature/contribution identity across the row and its wire; learned coefficients are labelled amber, operations neutral. No probability mark. -->

A **feature vector** `x` lists one observation's measurements. A **weight vector** `w` says how each measurement contributes, and the **bias** `b` shifts the score. In this calculation, `x=(2,1)`, `w=(1,2)` and `b=−1`: the two products are2 and2, then the bias makes the total3. The [earlier binary affine-score explanation](/learn/path/full-curriculum/linear-logistic-regression#5-model-a-binary-outcome) used this same multiply-and-add operation. Here we encode the two labels as `y=−1` and `y=+1`.

Writing a dot for the sum of matching coordinate products gives `f(x)=w·x+b`. A positive score predicts+1 and a negative score predicts−1. Our scratch solver assigns exact zero to+1; an ordinary library's exact-tie rule is a separate contract. These labels identify sides, not probabilities.

### Where does a score change its sign?

Locate each observation, the zero-score line and its perpendicular normal in the same coordinate plane.

<!-- figure: D02; six named observations A(-2,-1),B(-1,0),C(-2,1) negative rose squares and D(1,0),E(2,-1),F(2,1) positive blue circles; f=0 solid line clipped to same-scale axes, labelled normal w, signs on both sides. Separate outline marks selection. Angle-45..45/offset-.75...75/scale.5..3 preserve exact UI steps/defaults; labelled class marks stay attached to semantic A..F under edits. -->

The six observations above keep their names and labels when we move the boundary. With the initial `w=(1,0),b=0`, A/B/C lie on the negative side and D/E/F on the positive side. The set `f(x)=0` is a line in two dimensions and a **hyperplane** in more dimensions. Displacements along that line have zero dot product with `w`, so `w` is perpendicular to it. Changing the angle rotates that normal; changing the offset shifts where the zero-score line crosses it.

### What is the shortest move to the boundary?

Trace the point, perpendicular segment, true foot and right-angle marker before reading the formula.

<!-- figure: D03; analytic w=(1,2),b=-1,x=(2,1), foot(1.4,-.2), segment(.6,1.2), score3 and length3/sqrt5. Equal physical scale on both axes, normal and real right-angle marker at the foot. Draw the true foot or explicitly pan to it rather than substituting a border intersection. -->

We temporarily return to the two-product score from the first picture so the projection can be checked by hand. The [earlier dot product and projection explanation](/learn/path/full-curriculum/vectors-matrices-tensor-operations#3-a-dot-product-and-its-geometric-meaning) projects onto a line through the origin. Our boundary has an added bias, so we solve for its actual foot locally. Moving parallel to `w` reaches `(2,1)−.6(1,2)=(1.4,−.2)`. Its score is `1.4+2(−.2)−1=0`, and the moved segment has length `sqrt(.6²+1.2²)=3/sqrt5`.

The vector w points perpendicular to the boundary. Its length is ‖w‖. To reach the boundary from x by the shortest route, move along w: write the destination as x−t w and solve w·(x−t w)+b=0. This gives t=f(x)/‖w‖². Consequently:

\[
\begin{aligned}x_{\rm projected}&=x-\frac{f(x)}{\|w\|^2}w,\\d_{\rm signed}(x)&=\frac{f(x)}{\|w\|},\\d_{\rm label}(x,y)&=\frac{y f(x)}{\|w\|}.\end{aligned}
\]

Signed distance tells which side contains `x`. **Label-signed distance** multiplies that sign by its observed label: it is positive when the side agrees and negative when it does not. These distances require `w≠0`; a constant score has no normal or geometric corridor. A raw score equals signed distance only when the weight length is one.

### Can a larger score describe the same boundary?

Compare the same point and foot with two score rulers and weight lengths.

<!-- figure: D04; positive scale1->3 maps w=(1,2)->(3,6),b=-1->-3,score3->9,normsqrt5->3sqrt5; same zero line/foot/distance. Dashed arbitrary f=+/-1 levels move toward the same boundary. Keep mathematical operands and comparison states explicitly labelled. -->

Multiplying `w` and `b` by3 changes the score3 to9 and the norm `sqrt5` to `3sqrt5`. Their ratio is unchanged, and the projected point remains `(1.4,−.2)`. Any strictly positive common multiplier preserves the boundary and predictions; a negative multiplier reverses the label sides. In the six-point scene, change scale first, then rotate the boundary: a signed distance can become negative when the observation crosses to the wrong labelled side.

The following complete earlier program retains its original inputs and output. Compute the dot product, norm, residual and foot in the order shown; no optimizer is needed for this geometry.

If every weight and the bias are multiplied by three, which printed quantities should change?

**margin-projection.py**

```python
import numpy as np

x = np.array([2.0, 1.0])
w = np.array([1.0, 2.0])
b = -1.0
for scale in [1.0, 3.0]:
    weights, bias = scale * w, scale * b
    score = weights @ x + bias
    distance = score / np.linalg.norm(weights)
    projection = x - score * weights / (weights @ weights)
    print(f'scale={scale:.0f} score={score:.1f} distance={distance:.6f}')
    print('projection:', projection.round(6).tolist())
    print(f'boundary residual={weights @ projection + bias:.6f}')
```

Recorded output from the earlier execution:

```text
scale=1 score=3.0 distance=1.341641
projection: [1.4, -0.2]
boundary residual=0.000000
scale=3 score=9.0 distance=1.341641
projection: [1.4, -0.2]
boundary residual=-0.000000
```

### Which score scale makes corridor widths comparable?

Follow the least signed observation into a canonical score of1, then read both perpendicular width brackets.

<!-- figure: D05; six-point initial separator w=(1,0),b=0 has minimum y*f=1 at B/D; draw f=-1/0/+1, one-sided bracket1/norm and full bracket2/norm. Recompute canonical rescaling only for strictly separated states, visibly state infeasible/zero-normal cases; arbitrary user score scale is not itself a canonical normalization. -->

For a finite strictly separated training set, the smallest label-signed **score** `m=min yᵢf(xᵢ)` is positive. Divide `w` and `b` by `m`. The same boundary now satisfies `yᵢf(xᵢ)≥1`, with at least one equality. This fixes the arbitrary score scale. The two parallel levels `f=−1` and `f=+1` are each `1/‖w‖` from the central boundary: the **one-sided margin** is `1/‖w‖`, and the **full corridor** is `2/‖w‖`. In the initial six-point scene, B and D attain1; both widths can therefore be compared directly with the norm.

\[
\begin{gathered}\min_{w,b}\frac12\|w\|^2\\\text{subject to}\quad y_i(w\cdot x_i+b)\ge1.\end{gathered}
\]

Minimizing the squared weight length maximizes this normalized corridor. The half simplifies its derivative. **Hard margin** means requiring all these constraints; opposite labels at the same feature vector make them impossible. A separable dataset can also contain outliers that make its widest training corridor unhelpful elsewhere. We will first see which observations constrain it, then allow paid shortfalls for conflicts.

**Practice 1.** For w=(2,0), b=−2 and x=(3,4), calculate the score, perpendicular distance and projected point. What changes if you multiply w and b by five?

<details><summary>Hint</summary>

The weight length is two. The boundary equation is 2x₁−2=0.

</details>

<details><summary>Explained solution</summary>

The score is 4, the signed distance is 2, and the projection is (1,4). After rescaling, the score is 20 and the weight length is 10, so the distance and projection are unchanged. Calling the original score a distance would overstate it by a factor of two.

</details>

## 2. Which observations hold the boundary?

### Which moved observation forces a new corridor?

Compare old and moved points on a real coordinate line, then compare the old and refitted margins.

<!-- figure: D06; four-row negatives -2/-1 and positives1/z, old z2, named locations on a real x-axis; draw old and current central boundary/corridor with nearest opposed pair. z3 unchanged,z.5 gives w4/3,b1/3,center-.25,z1 duplicates. Slider z.25..3 step.05 initial2, preserve comparison and labels. -->

To isolate the nearest-point calculation, simplify the six two-dimensional observations to four one-dimensional coordinates. The labels and signed-score rule stay the same; there is now only one weight.

Consider one-dimensional negatives at −2 and −1, and positives at 1 and 2. The nearest opposing points, −1 and 1, constrain the maximum corridor. Its central boundary is zero, w=1 and b=0. Move the positive point at 2 to 3: its constraint remains satisfied, and the old solution remains optimal. Move it to 0.5 instead: the old score is only 0.5, so its normalized constraint fails.

If the moved positive point is z>0, let r=min(1,z), the nearest positive location. The two binding equations are −(−w+b)=1 and wr+b=1. Solving them gives w=2/(1+r), b=(1−r)/(1+r), and central boundary (r−1)/2. At z=0.5, these become 4/3, 1/3 and −1/4.

The nearest opposing pair constrains how wide the corridor can be. The ring follows this constraining role while the point moves. At z1, two positive observations share the same position: they express the same geometric restriction, so a unique assignment of “which one holds it” need not exist. In §4 we will give **support vector** its precise optimization meaning and check which moves preserve an optimality certificate. For now, compare whether the old normalized constraints remain satisfied: moving the outer positive point to3 leaves them intact; moving it to.5 does not.

The motion calculation is complete by hand here. After deriving constraint prices in §4, we will check this same support-motion example with its full retained program.



### How far can a fixed input move without crossing the decision?

Compare a perturbation vector with the signed point-to-boundary distance along the current normal.

<!-- figure: D07; fixed w=(1,2),b=-1,x=(2,1),y+1, radius3/sqrt5; actual perturbation vector and its normal component, true point/foot and allowed strict-distance circle. No retraining arrow. Separate perturbation magnitude from input/class identity, label physical axes. -->

There is also an inference statement that does not involve retraining. For an input perturbation δ, Cauchy–Schwarz gives `|f(x+δ)−f(x)|≤‖w‖‖δ‖`. If `‖δ‖` is strictly smaller than `|f(x)|/‖w‖`, the sign cannot change. For a correctly classified point this radius is its positive label-signed distance; for a wrongly classified point the same bound preserves its wrong decision. At the original `(2,1)` point the radius is `3/sqrt5`. A perturbation parallel to the boundary changes the features without changing the score; a perturbation directly against the normal uses the budget most quickly. This assumes Euclidean distance in the current feature coordinates and a fixed classifier. Changing feature units changes that geometry; permissible measurements and a shifted population are separate questions.

We can measure and move the corridor. Next consider observations that prevent every normalized constraint from being satisfied at once.

## 3. Pay for margin shortfalls

### How much shortfall does each observation have?

Compare five labelled signed scores with the requested margin of1 and their nonnegative shortfall segments.

<!-- figure: D08; true signed-score ruler positions1.7/1/.6/0/-.2, requested1 line; draw shortfall brackets0/0/.4/1/1.2, label correct/boundary/wrong side. No probability or projected-distance unit. Static initial scene before cost control. -->

Introduce a nonnegative slack ξᵢ for each observation. Instead of requiring a margin of one, allow yᵢf(xᵢ)≥1−ξᵢ, and charge Cξᵢ. For fixed w,b, the cheapest permitted slack is max(0,1−yᵢf(xᵢ)). This is **hinge loss**: a correctly classified point inside the corridor still pays; a point beyond its labeled margin pays nothing.

\[
\begin{aligned}P(w,b)&=\frac12\|w\|^2+C\sum_i\ell_i,\\\ell_i&=\max(0,1-y_i f(x_i)).\end{aligned}
\]

Classification and margin shortfall are different questions

| Label-signed score y f | Hinge loss | Interpretation |
| --- | --- | --- |
| 1.7 | 0 | Correct, beyond the margin |
| 1 | 0 | Exactly on the margin |
| 0.6 | 0.4 | Correct, inside the corridor |
| 0 | 1 | On the decision boundary |
| -0.2 | 1.2 | On the wrong side |

### Why is this called a hinge, and how does it differ from a smooth loss?

Trace each loss curve at the same signed score before comparing its derivative.

<!-- figure: D09; direct-labelled hinge max(0,1-m),squared hinge max(0,1-m)^2,logistic log(1+exp(-m)), m axis and losses; currentm.6 hinge.4,squared.16; slopes -1/-.8/logistic-1/(1+exp(.6)); explicit kink at1, curve identity stable across views, signed-score selection outlined separately. -->

Plot the loss against the **signed score** `m=yf(x)`. The hinge has slope−1 below1 and is flat above1; at1 it has a corner. Its valid loss subgradients there form `[−1,0]`, representing slopes of supporting lines; an ordinary derivative is unavailable. Squaring the nonnegative shortfall gives **squared hinge**: at m.6 the loss is `.4²=.16` and slope−.8, while at1 its derivative is0. The [earlier logistic-loss and gradient explanation](/learn/path/full-curriculum/linear-logistic-regression#6-derive-and-compute-log-loss) gives `log(1+exp(−m))`, whose slope is `−1/(1+exp(m))`. Unlike the hinge it still decreases beyond1. A shared score formula does not make these training losses interchangeable.

### How does a shortfall become a training cost?

Follow weight squares and row shortfalls into their two costs and final addition.

<!-- figure: D10; w.5,b.25,C.25 two-point fixture; weight square/half .125, negative/positive scores margins.25/.75 -> hinges.75/.25 ->sum1*price.25=.25 ->objective.375. Cost quantities labelled, identity traces retained; no probability scales. -->

C>0 is the price of training shortfall relative to weight size. A larger C puts more pressure on the training margins; a smaller C tolerates more shortfall. It does not prescribe a particular test accuracy, number of support vectors or geometric width for every dataset. As C grows, a separable dataset can reach a hard-margin solution; conflicting constraints remain conflicting however large C becomes.

A two-point example makes both C and the intercept visible. Put the negative at −1 and positive at +1. Symmetry permits an optimal b=0. For 0≤w≤1, both hinges sum to 2−2w, so differentiating ½w²+C(2−2w) gives w=2C. Beyond w=1 the hinge is zero and increasing w only costs more. Thus w*=min(2C,1). When w<1, every b between w−1 and 1−w gives the same total hinge; the intercept need not be unique.

Follow how the two individual losses exchange cost while the allowed bias moves.

<!-- figure: D11; separated x-1/+1 and conflicting x0/x0 variants, signed-score/hinge strips and true bias interval bracket; Cmodel.05..4 plus originalchoices.1/.25/.5/1/2, biasFraction-1..1step.25; ≤3 controls with explained sharedstate. Preserve zero-normal conflict and interval, no false geometric corridor. -->

At C=0.25, w=0.5 and any b in [−0.5,0.5] is optimal. At b.25, the negative/positive signed scores are.25/.75, the losses are.75/.25 and the objective is `.5(.5²)+.25(1)=.375`. The individual losses change as the bias moves, but their sum and objective do not. If both opposite labels occur at x=0, the optimum is w=0 and any b in [−1,1]. There is then no normal vector defining a distance corridor. In §4 the optimization coefficients will explain why both a separated and a conflicting example can involve every observation.

The full retained two-point program appears in §4 after its coefficient variable has been derived; the present weight/bias/loss calculation already explains its objective.



Compare objective conventions before transferring hyperparameters. Dividing the sum-loss objective by Cn gives an equivalent average-loss objective (λ/2)‖w‖²+(1/n)Σℓᵢ with λ=1/(Cn). Repeating every training observation r times preserves the original sum-loss optimization only if C is divided by r. This is one reason an SGD regularization parameter is not simply 1/C without a sample-size convention. Logistic regression uses a smooth logistic loss instead of hinge loss; similarity of the score formula does not make the objectives identical.

### How does one shortfall push the weights?

Trace each row's loss slope backwards through its label and feature coordinates, then add the norm derivative.

<!-- figure: D12; three-row X=[[-1,0],[1,1],[2,-1]],y[-1,+1,+1],oldw[.2,-.1],b.1,lambda.5,eta.1. Named rows/columns -> scores[-.1,.2,.6] -> margins[.1,.2,.6] -> losses[.9,.8,.4]; loss seeds/label/feature products and mean, penalty gradient, complete old/new w/b cells. Lambda0..2step.05/eta.001..1step.001 default.5/.1 <=2 controls; simultaneous update and current readout. Gradient arrows distinct from row identity. -->

Use the equivalent average-loss objective `J=lambda*||w||²/2+mean hinge`. Rows with margin below1 have loss slope−1. Since margin is `y*(x·w+b)`, a row's weight derivative is `−y*x`, and its bias derivative is `−y`. Average over **all n rows**, counting inactive rows as zero, then add `lambda*w` to the weight derivative. The bias is unpenalized. At margin1 this implementation chooses the valid zero loss subgradient.

\[
\nabla_w J=\lambda w-\frac1n X_{active}^{\top}y_{active},\qquad
\partial_bJ=-\frac1n\sum_{i: y_i f_i<1}y_i.
\]

For the three shown rows, the scores are`[-.1,.2,.6]`, signed margins`[.1,.2,.6]`, and shortfalls`[.9,.8,.4]`. Their mean is.7. The penalty is`.5*(.2²+.1²)/2=.0125`, so J=.7125. All three rows are active. Their signed feature sum is`[4,0]`, yielding weight derivative`[-37/30,-.05]` and bias derivative`-1/3`. With step size eta.1, update both from the **old** state: `w=[97/300,-.095]` and `b=2/15`. The executed new objective is.5528368055555555. Changing eta makes the resulting step visible immediately; a very large step need not reduce a nonsmooth objective.

For squared hinge multiply each active row's loss slope by`2*(1-margin)`. The norm term is unchanged. Its derivative is0 at margin1. This is a change of loss, not a retuning of C for the identical optimization problem.

**Deeper implementation: a complete batch optimizer and the ordinary row route.** The following file uses array products and reductions to implement those derivatives. The bounded batch loop has a diminishing `eta/sqrt(step)` schedule, retains its best objective state and states whether it stopped at its cap, a small/stationary step or a numerical limit. If a large permitted step overflows finite arithmetic, it keeps the best finite snapshot and reports the failure rather than publishing nonfinite weights. These local stopping observations are distinct from the primal–dual certificate we will derive next.

**hinge-primal.py**

```python
"""Mean hinge/squared-hinge pullback, atomic steps and a controlled SGD bridge."""
import json
import numpy as np
import sklearn
from sklearn.linear_model import SGDClassifier


def data(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 2..100 rows and 1..20 features.')
    if y.shape != (len(x),) or not np.isin(y, [-1., 1.]).all():
        raise ValueError('One -1 or +1 label is required per row.')
    if not np.isfinite(x).all() or np.max(np.abs(x)) > 1000:
        raise ValueError('Features must be finite with magnitude at most 1000.')
    return x, y


def objective_pullback(x, y, w, b, regularization=.5, loss='hinge'):
    x, y = data(x, y)
    w = np.asarray(w, dtype=float)
    if w.shape != (x.shape[1],) or not np.isfinite(w).all() or not np.isfinite(b):
        raise ValueError('Use one finite weight per feature and a finite bias.')
    if not np.isfinite(regularization) or not 0 <= regularization <= 100:
        raise ValueError('Lambda must be finite in [0,100].')
    if loss not in ('hinge', 'squared_hinge'):
        raise ValueError('Choose hinge or squared_hinge.')
    scores = x @ w + b
    margins = y * scores
    shortfalls = np.maximum(0., 1 - margins)
    # At m=1 choose the valid zero loss subgradient.
    factors = (margins < 1).astype(float)
    losses = shortfalls
    if loss == 'squared_hinge':
        factors = 2 * shortfalls
        losses = shortfalls ** 2
    gradient_w = regularization * w - x.T @ (y * factors) / len(y)
    gradient_b = -float(np.sum(y * factors)) / len(y)
    objective = regularization * float(w @ w) / 2 + float(np.mean(losses))
    if not all(np.isfinite(v).all() for v in (objective, gradient_w, gradient_b,
                                               scores, margins, shortfalls)):
        raise ArithmeticError('The objective or pullback exceeded finite arithmetic.')
    return objective, gradient_w, gradient_b, scores, margins, shortfalls


def atomic_step(x, y, w, b, regularization=.5, eta=.1, loss='hinge'):
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    value, gw, gb, scores, margins, shortfalls = objective_pullback(
        x, y, w, b, regularization, loss)
    new_w = np.asarray(w, dtype=float) - eta * gw
    new_b = float(b - eta * gb)
    return new_w, new_b, {'objective': value, 'gradient_w': gw.tolist(),
                         'gradient_b': gb, 'scores': scores.tolist(),
                         'margins': margins.tolist(), 'shortfalls': shortfalls.tolist()}


def optimize(x, y, regularization=.5, eta=.1, steps=2000, loss='hinge'):
    x, y = data(x, y)
    if not isinstance(steps, int) or not 1 <= steps <= 10000:
        raise ValueError('Use 1..10000 iterations.')
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    w, b = np.zeros(x.shape[1]), 0.
    value = objective_pullback(x, y, w, b, regularization, loss)[0]
    best_w, best_b, best_value = w.copy(), b, value
    trace = [{'step': 0, 'objective': value}]
    status = 'iteration cap'
    for step in range(1, steps + 1):
        rate = eta / np.sqrt(step)
        with np.errstate(over='ignore', invalid='ignore'):
            try:
                new_w, new_b, details = atomic_step(x, y, w, b, regularization, rate, loss)
                if not np.isfinite(new_w).all() or not np.isfinite(new_b):
                    raise ArithmeticError('The atomic step exceeded finite arithmetic.')
                current = objective_pullback(x, y, new_w, new_b, regularization, loss)
            except ArithmeticError:
                status = 'numerical limit'
                trace.append({'step': step, 'status': status, 'rate': float(rate)})
                break
        w, b = new_w, new_b
        value, gw, gb = current[:3]
        if value < best_value:
            best_w, best_b, best_value = w.copy(), b, value
        if step <= 3 or step % 100 == 0 or step == steps:
            trace.append({'step': step, 'objective': value, 'rate': float(rate)})
        if np.linalg.norm(np.r_[gw, gb]) <= 1e-10:
            status = 'selected subgradient stationary'
            break
        if np.linalg.norm(rate * np.r_[details['gradient_w'], details['gradient_b']]) <= 1e-12:
            status = 'step small'
            break
    return {'w': best_w.tolist(), 'b': best_b, 'objective': best_value,
            'steps': step, 'status': status, 'trace': trace}


def library_row_bridge(x, y, w, b, regularization=.5, eta=.1, loss='hinge'):
    """Match one row update; a library row epoch is not the batch update."""
    x, y = data(x, y)
    objective_pullback(x, y, w, b, regularization, loss)
    if not 0 < eta <= 1 or eta * regularization > 1:
        raise ValueError('For exact shrink mapping use eta*lambda <= 1.')
    classifier = SGDClassifier(loss=loss, penalty='l2', alpha=regularization,
                               learning_rate='constant', eta0=eta,
                               shuffle=False, average=False, random_state=19)
    # Establish ordinary estimator classes/shapes, then map the specified state.
    classifier.partial_fit(x[:1], y[:1], classes=np.array([-1., 1.]))
    classifier.coef_[:] = np.asarray(w, dtype=float)
    classifier.intercept_[:] = b
    old_counter = float(classifier.t_)
    row, label = x[1], y[1]
    margin = float(label * (row @ w + b))
    factor = float(margin < 1) if loss == 'hinge' else 2 * max(0., 1 - margin)
    expected_w = np.asarray(w) - eta * (regularization * np.asarray(w) - label * row * factor)
    expected_b = b + eta * label * factor
    classifier.partial_fit(x[1:2], y[1:2])
    np.testing.assert_allclose(classifier.coef_[0], expected_w, atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(classifier.intercept_[0], expected_b, atol=1e-12, rtol=1e-12)
    return {'row': 1, 'margin_before': margin, 'w': classifier.coef_[0].tolist(),
            'b': float(classifier.intercept_[0]), 'counter_before': old_counter,
            'counter_after': float(classifier.t_), 'loss': loss}


def main():
    # New declared mechanism fixture; none of the historical mains is called.
    x = np.array([[-1., 0.], [1., 1.], [2., -1.]])
    y = np.array([-1., 1., 1.])
    w, b = np.array([.2, -.1]), .1
    new_w, new_b, before = atomic_step(x, y, w, b)
    after = objective_pullback(x, y, new_w, new_b)[0]
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'hand_before': before, 'hand_after': {'w': new_w.tolist(), 'b': new_b,
                                                  'objective': after},
              'row_bridges': [library_row_bridge(x, y, w, b, loss=name)
                              for name in ('hinge', 'squared_hinge')],
              'bounded_optimizations': {name: optimize(x, y, loss=name)
                                        for name in ('hinge', 'squared_hinge')}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
```

Recorded output for the complete example above:

```text
{
  "versions": {
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "hand_before": {
    "objective": 0.7125,
    "gradient_w": [
      -1.2333333333333332,
      -0.05
    ],
    "gradient_b": -0.3333333333333333,
    "scores": [
      -0.1,
      0.2,
      0.6
    ],
    "margins": [
      0.1,
      0.2,
      0.6
    ],
    "shortfalls": [
      0.9,
      0.8,
      0.4
    ]
  },
  "hand_after": {
    "w": [
      0.32333333333333336,
      -0.095
    ],
    "b": 0.13333333333333333,
    "objective": 0.5528368055555555
  },
  "row_bridges": [
    {
      "row": 1,
      "margin_before": 0.2,
      "w": [
        0.29,
        0.005000000000000002
      ],
      "b": 0.2,
      "counter_before": 2.0,
      "counter_after": 3.0,
      "loss": "hinge"
    },
    {
      "row": 1,
      "margin_before": 0.2,
      "w": [
        0.35000000000000003,
        0.06500000000000004
      ],
      "b": 0.26,
      "counter_before": 2.0,
      "counter_after": 3.0,
      "loss": "squared_hinge"
    }
  ],
  "bounded_optimizations": {
    "hinge": {
      "w": [
        0.8052331630430355,
        0.3895275303008924
      ],
      "b": -0.19476684759711396,
      "objective": 0.2000350873493798,
      "steps": 2000,
      "status": "iteration cap",
      "trace": [
        {
          "step": 0,
          "objective": 1.0
        },
        {
          "step": 1,
          "objective": 0.8155555555555557,
          "rate": 0.1
        },
        {
          "step": 2,
          "objective": 0.6962530144275523,
          "rate": 0.07071067811865475
        },
        {
          "step": 3,
          "objective": 0.6048838599962506,
          "rate": 0.05773502691896258
        },
        {
          "step": 100,
          "objective": 0.23069211428321731,
          "rate": 0.01
        },
        {
          "step": 200,
          "objective": 0.2052439948893251,
          "rate": 0.007071067811865475
        },
        {
          "step": 300,
          "objective": 0.20285643559501973,
          "rate": 0.005773502691896257
        },
        {
          "step": 400,
          "objective": 0.20204013220609268,
          "rate": 0.005
        },
        {
          "step": 500,
          "objective": 0.20142752866264202,
          "rate": 0.00447213595499958
        },
        {
          "step": 600,
          "objective": 0.20120393800583727,
          "rate": 0.004082482904638631
        },
        {
          "step": 700,
          "objective": 0.20101600449312326,
          "rate": 0.0037796447300922726
        },
        {
          "step": 800,
          "objective": 0.20069950456743155,
          "rate": 0.0035355339059327377
        },
        {
          "step": 900,
          "objective": 0.20071027440282688,
          "rate": 0.0033333333333333335
        },
        {
          "step": 1000,
          "objective": 0.20058680275738977,
          "rate": 0.0031622776601683794
        },
        {
          "step": 1100,
          "objective": 0.2003583368651907,
          "rate": 0.003015113445777636
        },
        {
          "step": 1200,
          "objective": 0.20045745674171225,
          "rate": 0.0028867513459481286
        },
        {
          "step": 1300,
          "objective": 0.20025837109455683,
          "rate": 0.002773500981126146
        },
        {
          "step": 1400,
          "objective": 0.2002482959596381,
          "rate": 0.002672612419124244
        },
        {
          "step": 1500,
          "objective": 0.20021824472568328,
          "rate": 0.0025819888974716113
        },
        {
          "step": 1600,
          "objective": 0.2003043883369363,
          "rate": 0.0025
        },
        {
          "step": 1700,
          "objective": 0.20023478453886556,
          "rate": 0.00242535625036333
        },
        {
          "step": 1800,
          "objective": 0.20010469958649862,
          "rate": 0.0023570226039551583
        },
        {
          "step": 1900,
          "objective": 0.20030947031033827,
          "rate": 0.0022941573387056176
        },
        {
          "step": 2000,
          "objective": 0.20016770313565832,
          "rate": 0.00223606797749979
        }
      ]
    },
    "squared_hinge": {
      "w": [
        0.6596662504301501,
        0.23987537466573328
      ],
      "b": -0.10643963824262079,
      "objective": 0.15592203903658156,
      "steps": 2000,
      "status": "iteration cap",
      "trace": [
        {
          "step": 0,
          "objective": 1.0
        },
        {
          "step": 1,
          "objective": 0.43259259259259275,
          "rate": 0.1
        },
        {
          "step": 2,
          "objective": 0.31636980403919507,
          "rate": 0.07071067811865475
        },
        {
          "step": 3,
          "objective": 0.2698015438074646,
          "rate": 0.05773502691896258
        },
        {
          "step": 100,
          "objective": 0.15849102732795084,
          "rate": 0.01
        },
        {
          "step": 200,
          "objective": 0.15627874598935565,
          "rate": 0.007071067811865475
        },
        {
          "step": 300,
          "objective": 0.15598858251498438,
          "rate": 0.005773502691896257
        },
        {
          "step": 400,
          "objective": 0.15593877614238755,
          "rate": 0.005
        },
        {
          "step": 500,
          "objective": 0.15592703038761693,
          "rate": 0.00447213595499958
        },
        {
          "step": 600,
          "objective": 0.1559237153846917,
          "rate": 0.004082482904638631
        },
        {
          "step": 700,
          "objective": 0.15592265452026502,
          "rate": 0.0037796447300922726
        },
        {
          "step": 800,
          "objective": 0.1559222814185949,
          "rate": 0.0035355339059327377
        },
        {
          "step": 900,
          "objective": 0.15592214007948751,
          "rate": 0.0033333333333333335
        },
        {
          "step": 1000,
          "objective": 0.15592208319877426,
          "rate": 0.0031622776601683794
        },
        {
          "step": 1100,
          "objective": 0.15592205912210613,
          "rate": 0.003015113445777636
        },
        {
          "step": 1200,
          "objective": 0.15592204848319988,
          "rate": 0.0028867513459481286
        },
        {
          "step": 1300,
          "objective": 0.15592204360405523,
          "rate": 0.002773500981126146
        },
        {
          "step": 1400,
          "objective": 0.15592204129233425,
          "rate": 0.002672612419124244
        },
        {
          "step": 1500,
          "objective": 0.1559220401649991,
          "rate": 0.0025819888974716113
        },
        {
          "step": 1600,
          "objective": 0.1559220396008884,
          "rate": 0.0025
        },
        {
          "step": 1700,
          "objective": 0.15592203931198179,
          "rate": 0.00242535625036333
        },
        {
          "step": 1800,
          "objective": 0.15592203916087188,
          "rate": 0.0023570226039551583
        },
        {
          "step": 1900,
          "objective": 0.15592203908030278,
          "rate": 0.0022941573387056176
        },
        {
          "step": 2000,
          "objective": 0.15592203903658156,
          "rate": 0.00223606797749979
        }
      ]
    }
  }
}
```

The supplied constant-rate `SGDClassifier` comparison maps `lambda` to the library's `alpha`, chooses dense inputs, disables shuffling/averaging, declares classes and copies one specified weight/bias state after estimator initialization. It then takes **one row update** and compares that row's derivatives. Its row1 hinge update gives `w=[.29,.005],b=.2`; squared hinge gives `[.35,.065],b=.26`. The ordinary counter advances2→3. `partial_fit` retains its state/counter; a fresh ordinary `fit` starts a new fitting sequence. Constant rate avoids a counter-dependent schedule in this comparison.

A library pass updates after each row, so later rows read changed weights. The batch step above averages derivatives evaluated at one common old state. They are different procedures. The exact matched row demonstration also uses `eta*lambda<=1`, because the library clips its multiplicative shrink at zero; it does not reproduce a negative shrink factor from an arbitrarily large scratch step.

The two declared2000-step scratch runs finish at their iteration caps. Best objectives are.2000350873493798 for hinge and.15592203903658156 for squared hinge on this fixture. Those values concern two different losses. To take control, change one row or the loss, recompute the derivatives, inspect a kink with one-sided slopes and compare the appropriate ordinary row update. Practice13 revisits that transfer independently.

We can now change a loss and compute a step. A falling training objective still leaves a question: how much improvement could remain?

**Practice 2.** There are 12 observations and C=3. Find the equivalent average-loss λ. If every row is repeated four times, which C preserves the original objective?

<details><summary>Hint</summary>

Compare coefficients after multiplying the whole objective by one positive constant.

</details>

<details><summary>Explained solution</summary>

λ=1/(12×3)=1/36. Set C to 3/4 for the repeated dataset, because its hinge sum is four times larger. The new n is 48 and 1/(48×0.75) remains 1/36. Repeating rows supplies no new independent evidence about generalization.

</details>

## 4. Derive a checkable optimization certificate

We have a cost for any proposed classifier. What we still lack is a way to tell whether some unseen choice of weights could do better.

<!-- figure: D13; common horizontal objective axis with a feasible dual endpoint D and a feasible primal endpoint P and the unknown optimum between them. Three exact two-point separated C=.25 states alpha=(0,0),(.1,.1),(.25,.25). Recompute matching w=2alpha,b=0: D0/P.5, D.18/P.42, D.375/P.375. Brackets label the gap .5/.24/0; no test-accuracy axis. -->

Take the two separated observations x=−1,y=−1 and x=1,y=+1 from §3, with C=.25. A proposed weight w=0,b=0 pays .5; it gives an upper bound on the best possible cost. At w=.2,b=0 the cost falls to .42. At w=.5,b=0 it is .375. A lower bound will rule out every cheaper alternative at once. The diagram pairs these weights with lower bounds0,.18,.375. When both endpoints reach .375, the unknown optimum has nowhere else to be.

The primal chooses weights, bias and slack. The **dual** assigns a nonnegative price αᵢ to each margin constraint. A feasible dual value will be a lower bound on the smallest primal objective. Comparing the two gives a checkable optimization gap, not a claim about test error.

The algebra below constructs the lower endpoint while keeping its direction explicit. A bound with the opposite inequality would not rule out a cheaper classifier.

Imagine paying a nonnegative price for violating each row's required margin. Price zero means the constraint contributes nothing to this accounting; a positive price makes the corresponding feature vector appear in the weight expansion. These are optimization coefficients, not observation probabilities.

<!-- figure: D14; three separate elimination lanes, each has its own inputs and actual operations. Weight lane a=sum(alpha_i*y_i*x_i), w−a norm-square and −||a||²/2. Bias lane −b*sum(alpha_i*y_i), unbounded unless balance0. Slack lane each xi times(C−alpha_i−beta_i), unbounded unless coefficient0. Use separated two-row alpha=.1 example a=.2,balance0,beta=.15 for both rows. Distinct row contribution colours persist across cells and sum; selected lane outlined separately. -->

For the pictured price .1 on each row, multiplying price, label and coordinate gives .1·(−1)·(−1)=.1 and .1·1·1=.1. Their sum is .2, the weight in the preceding bracket. The two signed prices −.1 and +.1 cancel. The remaining slack price .25−.1=.15 is nonnegative. Each of those three observations becomes an exact condition when we minimize the accounting expression.

Write the constraints as 1−ξᵢ−yᵢf(xᵢ)≤0 and −ξᵢ≤0. Multiply them by αᵢ≥0 and βᵢ≥0 and add them to the objective. On any feasible primal point, the added terms are nonpositive. Minimizing this expression over unrestricted w,b,ξ therefore provides a lower bound:

\[
\begin{aligned}L={}&\frac12\|w\|^2+C\sum_i\xi_i\\&+\sum_i\alpha_i(1-\xi_i-y_i f_i)\\&-\sum_i\beta_i\xi_i.\end{aligned}
\]

The weight terms can be written as ½‖w−a‖²−½‖a‖², where a=Σαᵢyᵢxᵢ. Their minimum occurs at w=a. The unrestricted bias and slack variables are different: a nonzero linear coefficient lets us send its variable toward one infinity and the expression toward −∞. Such a useless lower bound is excluded by setting those coefficients to zero.

The coefficient of b must vanish: Σαᵢyᵢ=0, otherwise the infimum over b is −∞. The coefficient of each ξᵢ must vanish: C−αᵢ−βᵢ=0, which requires 0≤αᵢ≤C. Completing the square in w gives its minimizer w=Σαᵢyᵢxᵢ. Substitution leaves:

\[
\begin{gathered}\text{Maximize}\\D(\alpha)=\sum_i\alpha_i-\tfrac12\alpha^\top Q\alpha,\\Q_{ij}=y_i y_jK_{ij},\quad K_{ij}=x_i\cdot x_j,\\0\le\alpha_i\le C,\qquad\sum_i\alpha_i y_i=0.\end{gathered}
\]

For feasible α and any w,b with slack set to its hinge, D(α)≤P(w,b). Thus P−D is an optimization certificate. In floating-point code, feasibility residuals, roundoff and the declared stopping tolerance matter. A small gap does not mean the statistical model is appropriate. For this convex finite soft-margin problem, strict feasibility is easy: w=b=0 and every ξ=2. Strong duality then makes the best primal and dual values equal. The general convex argument is developed in [Convex Duality & KKT Conditions](/learn/path/full-curriculum/convex-duality-lagrangian-methods-kkt-conditions).

<!-- figure: D15; aligned signed-margin ruler and alpha box ruler with three paired rows: outside margin1.2/alpha0, tight margin1/alpha0 OR free OR C, and short margin.6/alphaC. Draw alpha*(1−xi−m) and (C−alpha)*xi as multiplication rectangles connected to zero outputs. Label implications one-way and avoid arrows asserting tight means free. -->

Complementary slackness translates the algebra back into the picture. A constraint with spare room has no need to push on the solution, so its price is zero. A constraint at its limit may push. The word “may” matters: redundant constraints can sit at their limits without receiving a positive price. The following equations make those one-way implications precise.

Together, stationarity, primal/dual feasibility and complementary slackness are the **Karush–Kuhn–Tucker**, KKT, conditions. At an optimum, complementary slackness gives αᵢ(1−ξᵢ−yᵢfᵢ)=0 and (C−αᵢ)ξᵢ=0. Combine those equations with primal feasibility:

KKT cases for C-SVC with hinge loss

| Coefficient | Necessary optimal margin condition | What it means |
| --- | --- | --- |
| α=0 | y f ≥ 1 | May be strictly outside or exactly tight |
| 0 < α < C | y f = 1 | A free support vector lies on its labeled margin |
| α=C | y f ≤ 1 | May be tight, inside, or misclassified |

A free coefficient gives b=yᵢ−ΣⱼαⱼyⱼK(xⱼ,xᵢ). If there is no free coefficient, the other inequalities can define a whole interval of valid biases. Arbitrarily averaging only an empty set of free points is not a bias algorithm. Our complete solver later minimizes the hinge over b and checks the resulting primal value.

For the same fixed training problem, the optimal feature-space weight vector is unique: if two different weights were optimal, their midpoint would strictly reduce the squared norm while convexity could not increase the loss beyond the average. The intercept is not strictly penalized, and coefficients can represent the same weight in several ways. Hence neither b nor α is guaranteed unique. Duplicate observations supply an immediate coefficient example.

### Why the training span is enough

The expansion is more than a convenient storage formula. Decompose any linear weight into w∥ in the span of the training vectors and w⊥ perpendicular to that span. Every training dot product uses only w∥, because w⊥·xᵢ=0. Dropping w⊥ leaves every training loss unchanged while reducing the squared norm by ‖w⊥‖². A minimizer therefore needs no perpendicular component. After we construct feature vectors in §5, the same argument applies to their span. This is the squared-norm representer argument used here; broader representer theorems have conditions on the penalty and evaluation functionals.


Prediction is now f(x)=Σᵢαᵢyᵢ(xᵢ·x)+b. The letter K still refers to the ordinary training dot products in this section; §5 will replace them with a general feature similarity. Only positive coefficients contribute algebraically. With a linear kernel we can collapse the sum into one saved weight vector. A numerical threshold used to display “support count” should not silently drop small coefficients from a gap calculation or change the saved predictor.

### Revisit the two corridor examples with their constraint prices

We now have the coefficient vocabulary used by the two complete earlier programs. A **support vector** in the optimization representation has positive `alpha`; at duplicate positions several assignments can describe the same weight. A tight row can have coefficient0. Therefore being on the margin is not equivalent to having a positive coefficient.

<!-- figure: D16; actual three scalar inputs negative-1 and duplicated positive1 with coefficient(.5,t,.5-t), labelled signed contributions. Slider t0...5, display weight1 and label balance0. Distinguish duplicate semantic rows, preserve contribution identity through the sum; selection separately outlined. -->

The first program keeps the old feasible classifier and coefficient assignment when a zero-coefficient row moves while preserving its old constraint. The old primal and dual values still meet, so the old solution remains optimal. Removing that row's constraint also retains the certificate. Moving it into the corridor may destroy primal feasibility; being unused previously is not immunity to arbitrary retraining.

**support-certificates.py**

```python
import numpy as np

for moved in [3.0, 0.5]:
    x = np.array([-2.0, -1.0, 1.0, moved])
    y = np.array([-1.0, -1.0, 1.0, 1.0])
    right = min(1.0, moved)
    w, b = 2 / (1 + right), (1 - right) / (1 + right)
    alpha = np.zeros(4)
    alpha[1] = alpha[2 if moved >= 1 else 3] = 2 / (1 + right) ** 2
    margin = y * (w * x + b)
    primal = .5 * w ** 2
    dual = alpha.sum() - .5 * (alpha @ (y * x)) ** 2
    assert np.all(margin >= 1 - 1e-12)
    assert abs(alpha @ y) < 1e-12 and abs(primal - dual) < 1e-12
    print(f'moved={moved:.1f} old feasible={bool(np.all(y * x >= 1))}')
    print(f'w={w:.6f} b={b:.6f} boundary={-b / w:.6f} gap={primal-dual:.6f}')

# The two positive rows are identical. Their combined coefficient is fixed.
x = np.array([-1.0, 1.0, 1.0])
y = np.array([-1.0, 1.0, 1.0])
for split in [0.0, .2, .5]:
    alpha = np.array([.5, split, .5 - split])
    w = alpha @ (y * x)
    print('alpha:', alpha.round(3).tolist(), f'w={w:.1f} dual={alpha.sum() - .5*w*w:.1f}')
```

Recorded output from the earlier execution:

```text
moved=3.0 old feasible=True
w=1.000000 b=0.000000 boundary=-0.000000 gap=0.000000
moved=0.5 old feasible=False
w=1.333333 b=0.333333 boundary=-0.250000 gap=0.000000
alpha: [0.5, 0.0, 0.5] w=1.0 dual=0.5
alpha: [0.5, 0.2, 0.3] w=1.0 dual=0.5
alpha: [0.5, 0.5, 0.0] w=1.0 dual=0.5
```

The second program uses the derived identical pair coefficients to check both the separated and conflicting cases from §3. It keeps the entire optimal bias interval rather than infer uniqueness from one displayed bias. Both rows can have positive coefficients in either type of example.

**soft-margin-bias.py**

```python
import numpy as np

for conflicting, c in [(False, .25), (False, 1.0), (True, 1.0)]:
    x = np.array([0., 0.]) if conflicting else np.array([-1., 1.])
    y = np.array([-1., 1.])
    alpha = c if conflicting else min(c, .5)
    w = np.sum(alpha * y * x)
    limit = max(0., 1 - abs(x[0]) * w)
    b = limit / 2
    hinge = np.maximum(0., 1 - y * (w * x + b))
    primal = .5 * w*w + c * hinge.sum()
    dual = 2 * alpha - .5 * w*w
    print(f'conflicting={conflicting} C={c:.2f} w={w:.2f} b interval=[{-limit:.2f},{limit:.2f}]')
    print('hinge:', hinge.round(3).tolist(), f'primal={primal:.3f} dual={dual:.3f}')

# Dividing the sum-loss objective by C*n gives lambda/2 ||w||² + mean hinge.
n, c, copies = 8, 2.0, 3
print(f'lambda={1/(n*c):.4f}; duplicated-data C={c/copies:.6f}')
```

Recorded output from the earlier execution:

```text
conflicting=False C=0.25 w=0.50 b interval=[-0.50,0.50]
hinge: [0.75, 0.25] primal=0.375 dual=0.375
conflicting=False C=1.00 w=1.00 b interval=[-0.00,0.00]
hinge: [0.0, 0.0] primal=0.500 dual=0.500
conflicting=True C=1.00 w=0.00 b interval=[-1.00,1.00]
hinge: [1.5, 0.5] primal=2.000 dual=2.000
lambda=0.0625; duplicated-data C=0.666667
```

**Practice 3.** At an optimum, can an observation with y f=1 have α=0? What must be true if its margin is 1.2?

<details><summary>Hint</summary>

Use the full implications in the KKT table; do not reverse a one-way implication.

</details>

<details><summary>Explained solution</summary>

A tight observation can have α=0, a free coefficient or α=C, depending on the complete solution. Margin 1.2 forces α=0. Conversely, α=0 only guarantees margin at least one. These are mathematical optimality conditions; a finite solver tolerance can blur exact numerical equalities.

</details>

## 5. Change similarity with a valid kernel

The certificate used input dot products in two places: in the training quadratic and in each query score. We can keep that machinery while changing the features those dot products describe.

<!-- figure: D17; four XOR corners with class signs; selected(1,−1) goes through three actual multiply/square/scaling rectangles to feature cells(1,−sqrt2,1). Show a labelled middle-feature axis with positive and negative positions and a three-coordinate inset plane phi2=0; phi1=phi3=1 are constant ONLY for these four corners. Show weights(0,1/sqrt2,0), output−1. Input sign regions bounded by x1*x2=0 axes. -->

Sometimes the labels cannot be separated by a line in the original coordinates. For XOR, the four points (±1,±1) have positive labels when the signs agree and negative labels otherwise. Their label is the sign of x₁x₂. Add this product as a feature and a linear classifier in the new coordinates can separate them.

The original corners have two positive labels on one diagonal and two negative labels on the other. A line cannot put both diagonals on their respective sides: the midpoint of each diagonal is the same origin. In the displayed transformation, only the middle coordinate separates these four rows. The other two coordinates are constant1 here; dropping them would not describe a general input. For example (2,1) maps to (4,2√2,1), not to the corner's constant coordinates.

For this transformation, expand a square:

\[
\begin{aligned}k(x,z)&=(x\cdot z)^2,\\\phi(x)&=(x_1^2,\sqrt2 x_1x_2,x_2^2),\\\phi(x)\cdot\phi(z)&=k(x,z).\end{aligned}
\]

The √2 is essential: the cross term in the expanded square has coefficient two. For XOR, the weight (0,1/√2,0) in this feature space produces f(x)=x₁x₂. The boundary is linear in φ(x), but curved when viewed through the original input coordinates.

<!-- figure: D18; four training identities(-1,-1),(-1,1),(1,-1),(1,1) on BOTH axes of complete Gram [[4,0,0,4],[0,4,4,0],[0,4,4,0],[4,0,0,4]]. Selected opposite-corner cell traces feature products1+2+1=4 beside direct input(-2)^2=4. Same-row diagonal visible; stable identity cues in feature coordinates and matrix headers. -->

Collect the four transformed rows and take every pairwise dot product. The resulting **Gram matrix** is square because both its axes name the same training rows. Opposite corners have identical degree-two features, hence the repeated rows. In the selected corner pair, the feature products sum to1+2+1=4; directly squaring the input dot product gives (−2)²=4. A kernel is a function k that computes these feature dot products using the inputs. This identity is the **kernel trick**: the optimization and score need dot products, so an explicit long feature vector can sometimes be avoided.

### Which similarity functions are legal?

Calling two inputs “similar” is not enough to make a kernel. We need similarities that behave as dot products in some common feature space. Any weighted combination of those feature vectors must have a nonnegative squared length. The Gram-matrix condition below is exactly that requirement written using similarities, without first constructing the features.

<!-- figure: D19; weighted feature vectors a1phi1+a2phi2 head-to-tail, norm-square terminal, matched quadratic sum. Alongside duplicate W[[1,1],[1,1]] and invalid Kbad[[2,3],[3,2]], witness vminus=(1,−1), quadratic calculations0 and−2. Actual named matrix-row times vector lanes show Wvminus=(1−1,1−1)=(0,0)=0*vminus; Wvplus=(1+1,1+1)=(2,2)=2*vplus for vplus=(1,1); Kbad*vminus=(2−3,3−2)=(−1,1)=−1*vminus. Keep coefficient-row IDs on matrix columns/vector cells/products, separate selected direction outline, and label scalar eigenvalue vs squared-length result. Show component products/sums and original/output direction beside each lane, not an eigenvalue badge alone. Direct label zero length possible vs negative squared length impossible. Recompose separate operation lanes vertically at narrow/enlarged widths with readable operands and accessible numeric table; no squeezed multi-matrix thumbnail. -->

The duplicate matrix [[1,1],[1,1]] gives squared length0 for the combination (1,−1): two identical feature vectors cancel. The proposed matrix [[2,3],[3,2]] instead gives2−3−3+2=−2 for the same combination. A real squared length cannot do that. This is the concrete test underlying the general condition.

For any finite list of points, a real feature kernel forms a symmetric positive semidefinite Gram matrix K. Indeed, for any real coefficients a, aᵀKa=‖Σaᵢφ(xᵢ)‖²≥0. One negative quadratic witness disproves validity. Checking one finite matrix without finding a negative value does not prove validity on every possible input list.

Here is the matrix operation behind the next term. Multiplying K by a column v takes the dot product of each matrix row with that same column, producing one output coordinate per row. For the duplicate matrix W, v=(1,−1) gives `Wv=(1−1,1−1)=(0,0)`. With v=(1,1), it gives `Wv=(1+1,1+1)=(2,2)=2v`. These v coordinates weight the named training rows; they are not an input's original measurement coordinates.

A nonzero v satisfying **Kv=λ_K v** is an **eigenvector**: the output stays on the same line as v, multiplied by the **eigenvalue** λ_K and possibly reduced to zero. Thus the duplicate matrix has eigenvalues0 along the difference direction and2 along the common direction. λ_K here describes a matrix direction, unlike the regularization λ in §3. For such a direction, `vᵀKv=λ_K‖v‖²`. A positive semidefinite Gram cannot have a negative eigenvalue, but a zero eigenvalue is allowed: duplicate features cancel in their difference direction. The invalid matrix above sends (1,−1) to (−1,1)=−(1,−1), so its eigenvalue−1 gives the already computed squared-length contradiction−2.

Conversely, a symmetric positive semidefinite kernel on every finite list admits a Hilbert-space feature construction: take formal finite combinations of symbols k(x,·), define their inner product by the kernel sum, identify vectors of zero length and complete the space. This is the useful kernel condition here. A particular Mercer eigenfunction expansion has additional domain, measure and regularity assumptions; those belong in [Functional Analysis & RKHS](/learn/path/full-curriculum/functional-analysis-rkhs).

Nonnegative weighted sums of valid kernels remain valid by concatenating scaled feature vectors. Products remain valid by taking tensor-product features. This proves familiar polynomial constructions such as (γx·z+r)ᵈ when γ,r≥0 and d is a nonnegative integer. A sigmoid similarity is not positive semidefinite for every parameter choice. With finite C, even an indefinite dual quadratic is bounded on its compact feasible box; the lost guarantee is convex/concave optimization structure, not automatically boundedness.

### The Gaussian RBF kernel and its scale

The polynomial above measures matching coordinate products. Another valid choice starts with how far apart the inputs are.

<!-- figure: D21; actual 2D displacement components dx/dy and squared-component cells -> sum -> gamma multiply -> negative exponent -> exp similarity. Separate distance ruler marks0,1/sqrt(gamma),2/sqrt(gamma) with similarities1,e^-1,e^-4; for gamma.5 firstradius sqrt2. Gamma full.05..4 linked to fitview, query coords remain separate. -->

At γ=.5, a displacement of length √2 gives exponent−1 and similarity e⁻¹≈.367879. At twice that distance the exponent is−4, giving approximately.018316. The distance is squared before it is multiplied by γ: doubling distance does not merely double the exponent.

\[
\begin{gathered}k(x,z)=\exp(-\gamma\|x-z\|^2),\\\gamma>0.\end{gathered}
\]

The Gaussian radial basis function, RBF, depends only on distance. Similarity falls to e⁻¹ at distance 1/√γ. Expand it as e⁻ᵞ‖ˣ‖²e⁻ᵞ‖ᶻ‖²e²ᵞˣ·ᶻ. The last exponential is a convergent sum of nonnegative multiples of the valid polynomial kernels (x·z)ᵐ. Multiplying by one factor for x and one for z preserves the Gram quadratic form; finite partial sums are positive semidefinite, and their entrywise limit retains that property. This gives a local validity proof without treating a plotted heatmap as evidence.

Small γ makes similarities decay slowly; large γ makes them local. C still controls how much training shortfall is paid, so both affect the fit. We can derive this lab's exact fit using the matrix operation just worked, instead of treating its coefficients as supplied answers.

Keep XOR row order `(-1,-1),(-1,1),(1,-1),(1,1)` and labels `y=(1,−1,−1,1)`. Write `r=exp(−4γ)`: neighboring corners have squared distance4 and similarity r; opposite corners have squared distance8 and similarity r². The RBF Gram and its first row applied to y are

\[
K=\begin{pmatrix}1&r&r&r^2\\r&1&r^2&r\\r&r^2&1&r\\r^2&r&r&1\end{pmatrix},\qquad
(Ky)_1=1-r-r+r^2=(1-r)^2.
\]

The other three row dot products are `−(1−r)²,−(1−r)²,+(1−r)²`. Hence `Ky=λ_K y` with `λ_K=(1−r)²`: the label column is an eigenvector, and the alternating-label direction is rescaled by this number.

Give all four coefficients a common value a. Their box constraints require `0≤a≤C`, and label balance holds because `a(1−1−1+1)=0`. In the dual from §4, `α=a*1` and `αᵀQα=(a y)ᵀK(a y)=a²λ_K(yᵀy)=4a²λ_K`. Consequently

\[
D(a)=4a-2\lambda_K a^2,\qquad
D'(a)=4-4\lambda_K a,\qquad
a^*=\min(C,1/\lambda_K)\quad(\lambda_K>0).
\]

The downward quadratic peaks at `1/λ_K`; if C lies below that peak, the best permitted value is the upper endpoint C. This one-dimensional calculation also gives a global certificate here: with b=0 every signed training margin is `yᵢfᵢ=aλ_K`. At the unconstrained optimum it is1, satisfying the free/tight KKT case. At a=C below that optimum it is at most1, satisfying the bounded-coefficient case. The corresponding hinge slacks satisfy the other KKT conditions, so this feasible candidate solves the full XOR dual, not just its common-coefficient slice.

For the degree-two polynomial Gram already drawn, each row gives `Ky=8y`, so `a*=min(C,1/8)`. The linear Gram instead gives `Ky=0`: the signed corner sum is zero, its weight is zero, and `D(a)=4a` is maximized at a=C. There is no division by zero in that branch; b=0 gives signed margins0 and the bounded-coefficient certificate. These exact special-case formulas power this lab; they are not a general training algorithm.

For a fixed finite RBF model, as a query moves far from every support point, all its similarities approach zero and the score approaches b. The model has not learned a meaningful rule for every remote region merely because it returns a class there. Kernel-space distance to a margin uses the feature weight length √(αᵀYKYα); it is generally not Euclidean distance to a curved boundary in input space.

<!-- figure: D20; query(.5,.5) -> comparisons with all four named XOR training rows -> signed alpha products -> sum+b -> score/sign. Separate frozen fit metadata RBF C1 gamma.5 from queryx/y controls. Every support contribution retains training class/identity cue; sum never implies all kernels votepositive. Directly labelled sampled score field, support marks outlined without replacing class colour. -->

We have now defined all three similarity choices used by the shared model view. Change the kernel first, then move only the query point. The fit view changes kernel, C and γ; the separate query view changes only x₁/x₂ and names the same current fit state. γ matters only for RBF. Returning to the fit view does not discard the query. Each signed contribution is αᵢyᵢk(xᵢ,x), so a positive similarity can support either class depending on its training label. The four contributions add to the score. The color field samples the saved analytic predictor at finite cell centers; it is not a probability plot or a proof about all points between cells.

Which kernel can distinguish the XOR labels, and does a zero Gram eigenvalue mean the kernel is invalid?

**kernel-xor.py**

```python
import numpy as np
from sklearn.svm import SVC

x = np.array([[-1., -1.], [-1., 1.], [1., -1.], [1., 1.]])
y = np.prod(x, axis=1)
phi = np.column_stack([x[:, 0] ** 2, np.sqrt(2) * x[:, 0] * x[:, 1], x[:, 1] ** 2])
assert np.allclose(phi @ phi.T, (x @ x.T) ** 2)
query = np.array([[.5, .5], [.5, -.5]])
for kernel in ['linear', 'poly', 'rbf']:
    fit = SVC(kernel=kernel, degree=2, coef0=0, gamma=.5 if kernel == 'rbf' else 1,
              C=1, tol=1e-10).fit(x, y)
    print(kernel, 'train accuracy:', f'{fit.score(x,y):.2f}',
          'query scores:', fit.decision_function(query).round(6).tolist())

bad = np.array([[1., 2.], [2., 1.]])
witness = np.array([1., -1.])
print('invalid Gram witness:', float(witness @ bad @ witness))
print('duplicate Gram eigenvalues:', np.linalg.eigvalsh(np.ones((2, 2))).tolist())
```

Recorded output from the earlier execution:

```text
linear train accuracy: 0.50 query scores: [-0.0, -0.0]
poly train accuracy: 1.00 query scores: [0.25, -0.25]
rbf train accuracy: 1.00 query scores: [0.31119, -0.31119]
invalid Gram witness: -2.0
duplicate Gram eigenvalues: [0.0, 2.0]
```


**Practice 4.** A proposed two-point Gram matrix is [[2,3],[3,2]]. Find a short validity counterexample. Would adding duplicate rows to a valid dataset invalidate its kernel?

<details><summary>Hint</summary>

Try the coefficient vector (1,−1). Distinguish a negative quadratic form from a zero one.

</details>

<details><summary>Explained solution</summary>

The quadratic form is 2+2−6=−2, so this matrix cannot come from real feature dot products. Duplicating valid features can create zero eigenvalues, which are permitted. Singularity may cause nonunique coefficients; it does not by itself invalidate the kernel.

</details>

## 6. Move two coefficients without breaking the constraints

We now know how to construct the quadratic and how to check a feasible set of coefficients. We still need a move that improves them without invalidating the lower bound.

<!-- figure: D22; alpha_i/alpha_j coordinate axes, real[0,C]square intersected by label-balance line, endpoints and current/candidate arrows. Opposite-label slope+1 and same-label slope−1 separately labelled. Current oldthree-row alpha(.2,.1,.1), labels(-1,+1,+1), C1.2, pair selector preserves allthree choices; manualcommit cap16/reset. General arbitrary row editor is adjacent deeperfocusedviews, not presets only. -->

A dual optimizer cannot independently change one coefficient while preserving Σαᵢyᵢ=0. Choose two indices i,j and let αⱼ increase by δ. Then αᵢ must decrease by sδ, where s=yᵢyⱼ. Opposite labels move together; same labels move in opposite directions. Intersect the two box constraints to find the legal interval [L,H].

\[
\begin{aligned}\alpha'_j&=\alpha_j+\delta,\\\alpha'_i&=\alpha_i-s\delta,\quad s=y_i y_j,\\0\le\alpha'_i,\alpha'_j&\le C.\end{aligned}
\]

The change must also stay inside each coefficient's box. The j-coordinate requires −αⱼ≤δ≤C−αⱼ. For opposite labels, the i-coordinate requires −αᵢ≤δ≤C−αᵢ. For equal labels, it instead requires αᵢ−C≤δ≤αᵢ. Take the larger lower endpoint and smaller upper endpoint. Feasible old state guarantees that δ=0 remains in this intersection.

<!-- figure: D23; actual gain g*delta−q*delta²/2 over derived legal interval, vertex and clippedchosenpoint, actual before/after alpha cells with both changes fed from one old-state snapshot. Zero-curvature g2/C.7 comparison is a straight segment maximumat.7; flatg0 keepsdelta0. Directly label curve/interval, no isolated swatch legend. -->

Let Qᵢⱼ=yᵢyⱼKᵢⱼ and u=1−Qα be the current dual gradient. Along this feasible line, expand the quadratic exactly. Its gain is gδ−½qδ², where g=uⱼ−suᵢ and q=Kᵢᵢ+Kⱼⱼ−2Kᵢⱼ. For a valid kernel, q is the squared feature distance between the two points and cannot be negative in exact arithmetic.

When q>0, choose δ=clip(g/q,L,H). When q=0, the gain is linear: choose whichever endpoint improves it most, or leave it unchanged if tied. Opposite labels at an identical input make this case useful, not ignorable. Compute both updated coefficients before committing either one; a one-sided mutation followed by an early return can break the equality constraint.

The selected pair's improvement is exact for that pair's feasible line; it need not solve the entire training problem. The old manual investigation below lets you commit one such move at a time. Its point editor and pair choice refer to the same current coefficient state. An invalid edited state must preserve the last feasible snapshot, including label balance.


The deeper editor preserves the same mathematical state for arbitrary2–8 two-dimensional rows, not only the displayed three-row fixture. Work through one question at a time: choose the number of rows; select one row and edit its two coordinates; select one row and its label; select one row and its coefficient. Coordinates lie in [−6,6], labels are−1/+1, and coefficients must lie in [0,C]. The pair question chooses two distinct row identities and C in [.05,4]. Each view has at most three controls and shows the same current rows, labels, coefficients and balance residual.

An isolated coefficient or label edit can break Σαᵢyᵢ=0. Such drafts remain visibly invalid without changing the current predictor; prepare the matching row edits and apply the complete feasible state atomically. The optional numeric state import follows the same shape, box and balance checks. A permitted pair move then uses the saved old values of both coefficients. Reset restores the original fixture and clears invalid draft fields even when the committed state already equals that default. The duplicate-input example is a deliberate zero-curvature case, not a substitute for arbitrary editing.

Why does a same-label pair follow a different diagonal, and what should happen when pair curvature is zero?

**pair-move.py**

```python
import numpy as np


def pair_move(x, y, alpha, c, i, j):
    gram = x @ x.T
    gradient = 1 - y * (gram @ (alpha * y))
    sign = y[i] * y[j]
    lower = max(-alpha[j], alpha[i] - c if sign == 1 else -alpha[i])
    upper = min(c - alpha[j], alpha[i] if sign == 1 else c - alpha[i])
    slope = gradient[j] - sign * gradient[i]
    curvature = np.sum((x[i] - x[j]) ** 2)
    gain = lambda delta: slope * delta - .5 * curvature * delta ** 2
    if curvature > 0:
        delta = np.clip(slope / curvature, lower, upper)
    else:
        delta = 0. if slope == 0 else max([lower, upper], key=gain)
    result = alpha.copy()
    result[i], result[j] = alpha[i] - sign * delta, alpha[j] + delta
    return result, lower, upper, curvature, gain(delta)


if __name__ == '__main__':
    x = np.array([[-1., 0.], [.5, 1.], [1., -.5]])
    y, alpha = np.array([-1., 1., 1.]), np.array([.2, .1, .1])
    for i, j in [(0, 1), (1, 2)]:
        after, lower, upper, q, gain = pair_move(x, y, alpha, 1.2, i, j)
        print(f'pair=({i},{j}) delta interval=[{lower:.3f},{upper:.3f}] q={q:.3f}')
        print('after:', after.round(6).tolist(), f'balance={after @ y:.6f} gain={gain:.6f}')
    duplicate = pair_move(np.zeros((2, 1)), np.array([-1., 1.]), np.zeros(2), 1.2, 0, 1)
    print('zero-curvature after:', duplicate[0].tolist(), f'gain={duplicate[-1]:.1f}')
```

Recorded output from the earlier execution:

```text
pair=(0,1) delta interval=[-0.100,1.000] q=3.250
after: [0.638462, 0.538462, 0.1] balance=0.000000 gain=0.312404
pair=(1,2) delta interval=[-0.100,0.100] q=2.500
after: [0.2, 0.14, 0.06] balance=0.000000 gain=0.002000
zero-curvature after: [1.2, 1.2] gain=2.4
```

### A complete small solver, with a stopping certificate

The next program revisits the original lesson's Gaussian blobs and nonlinear XOR data. It implements bounded exhaustive pair-coordinate ascent for a linear or RBF kernel. It uses the same two-variable mechanism as sequential minimal optimization, SMO, but does not reproduce Platt's full working-set selection, cache, shrinking or production engineering. At each step it evaluates every pair's best feasible gain, commits the largest and recomputes a primal certificate.

For fixed w, write the margin breakpoints as tᵢ=yᵢ−w·φ(xᵢ). Each negative-label hinge begins increasing at its breakpoint; each positive-label hinge stops decreasing at its breakpoint. The total derivative increases by one at every sorted breakpoint and starts at minus the number of positive labels. Therefore, with both labels present and a common C, any b between the two breakpoints where this derivative reaches zero minimizes the hinge. The program uses their midpoint. This works even when no coefficient is strictly between zero and C.

Stopping is based on a small relative primal–dual gap after verifying box and label-balance feasibility. The step cap and a numerical stall are separate statuses. A random counter that saw no recent update would not certify convergence. The implementation clears old state on each fit, handles duplicate opposite labels, bounds its accepted numeric inputs, and sums every coefficient at prediction time. Its support count uses a reporting threshold only.

Will the solver pass its objective-gap criterion on both datasets and on opposite labels at an identical input?

**pair-coordinate-solver.py**

```python
"""Bounded educational pair-coordinate solver; not the production LIBSVM algorithm."""
import numpy as np


class PairSVM:
    def __init__(self, c=1., kernel='rbf', gamma=.5, tolerance=1e-7, max_steps=20000):
        self.c, self.kernel, self.gamma = c, kernel, gamma
        self.tolerance, self.max_steps = tolerance, max_steps

    def matrix(self, left, right):
        if self.kernel == 'linear':
            return left @ right.T
        squared = np.sum((left[:, None, :] - right[None, :, :]) ** 2, axis=2)
        return np.exp(-self.gamma * squared)

    def certificate(self, gram, alpha, y):
        raw = gram @ (alpha * y)
        # For fixed w, the hinge sum has slope -n_positive at b=-infinity.
        # Every breakpoint y_i-raw_i increases that slope by one.
        breaks = np.sort(y - raw)
        positive = int(np.sum(y == 1))
        bias = (breaks[positive - 1] + breaks[positive]) / 2
        norm_squared = float((alpha * y) @ raw)
        primal = .5 * norm_squared + self.c * np.maximum(0., 1 - y * (raw + bias)).sum()
        dual = alpha.sum() - .5 * norm_squared
        return bias, float(primal), float(dual)

    def fit(self, x, y):
        x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
        if x.ndim != 2 or not (2 <= len(x) <= 100) or not (1 <= x.shape[1] <= 20):
            raise ValueError('Use 2..100 rows and 1..20 numeric features.')
        if y.shape != (len(x),) or set(y.tolist()) != {-1., 1.}:
            raise ValueError('Supply both -1 and +1 labels, one per row.')
        if not np.isfinite(x).all() or np.max(np.abs(x)) > 1000:
            raise ValueError('Finite feature magnitudes must be at most1000.')
        if self.kernel not in ['linear', 'rbf'] or not (.001 <= self.c <= 100):
            raise ValueError('Choose linear/rbf and C in [.001,100].')
        if not (1e-4 <= self.gamma <= 10) or not (1e-10 <= self.tolerance <= .01):
            raise ValueError('Gamma or gap tolerance outside teaching range.')
        if not isinstance(self.max_steps, int) or not (1 <= self.max_steps <= 50000):
            raise ValueError('Use 1..50000 update steps.')
        self.x, self.y = x.copy(), y.copy()
        gram = self.matrix(x, x)
        alpha = np.zeros(len(y))  # Refit starts from a fresh feasible vector.
        i, j = np.triu_indices(len(y), 1)
        sign = y[i] * y[j]
        squared = np.sum((x[i] - x[j]) ** 2, axis=1)
        curvature = squared if self.kernel == 'linear' else -2 * np.expm1(-self.gamma * squared)
        self.status = 'step limit'
        for step in range(self.max_steps + 1):
            bias, primal, dual = self.certificate(gram, alpha, y)
            if primal - dual <= self.tolerance * max(1., abs(primal)):
                self.status = 'gap passed'
                break
            if step == self.max_steps:
                break
            gradient = 1 - y * (gram @ (alpha * y))
            slope = gradient[j] - sign * gradient[i]
            lower = np.maximum(-alpha[j], np.where(sign == 1, alpha[i] - self.c, -alpha[i]))
            upper = np.minimum(self.c - alpha[j], np.where(sign == 1, alpha[i], self.c - alpha[i]))
            candidate = np.divide(slope, curvature, out=np.zeros_like(slope), where=curvature > 0)
            candidate = np.clip(candidate, lower, upper)
            endpoint = np.where(slope * upper > slope * lower, upper, lower)
            candidate = np.where(curvature == 0, endpoint, candidate)
            gain = slope * candidate - .5 * curvature * candidate ** 2
            chosen = int(np.argmax(gain))
            if gain[chosen] <= 1e-15:
                self.status = 'stalled before gap criterion'
                break
            delta = candidate[chosen]
            left, right = int(i[chosen]), int(j[chosen])
            # Compute both values before committing; clipping removes endpoint roundoff only.
            new_left = np.clip(alpha[left] - sign[chosen] * delta, 0., self.c)
            new_right = np.clip(alpha[right] + delta, 0., self.c)
            alpha[left], alpha[right] = new_left, new_right
            if abs(alpha @ y) > 1e-9:
                raise ArithmeticError('The update lost label balance.')
        self.alpha, self.bias = alpha, bias
        self.primal, self.dual, self.steps = primal, dual, step
        return self

    def decision_function(self, x):
        x = np.asarray(x, dtype=float)
        if x.ndim != 2 or x.shape[1] != self.x.shape[1] or not np.isfinite(x).all() or np.max(np.abs(x), initial=0) > 1000:
            raise ValueError('Prediction rows must match training shape/range.')
        return self.matrix(x, self.x) @ (self.alpha * self.y) + self.bias

    def predict(self, x):
        # This lesson chooses +1 on an exact zero score; libraries may choose a different tie.
        return np.where(self.decision_function(x) >= 0, 1., -1.)


if __name__ == '__main__':
    np.random.seed(42)
    blobs = np.vstack([np.random.randn(20, 2) + [2., 2.], np.random.randn(20, 2) - [2., 2.]])
    blob_labels = np.r_[np.ones(20), -np.ones(20)]
    np.random.seed(7)
    xor = np.random.randn(40, 2)
    xor_labels = np.where(np.prod(xor, axis=1) > 0, 1., -1.)
    for name, x, y, gamma in [('blobs', blobs, blob_labels, .5), ('XOR', xor, xor_labels, 1.)]:
        model = PairSVM(gamma=gamma).fit(x, y)
        print(f'{name}: {model.status}; train accuracy={np.mean(model.predict(x)==y):.3f}')
        print(f'primal={model.primal:.6f} dual={model.dual:.6f} gap={model.primal-model.dual:.6f}')
        print('positive coefficients:', int(np.sum(model.alpha > 1e-8)))
    duplicate = PairSVM(kernel='linear').fit([[0.], [0.]], [-1., 1.])
    print('opposite duplicate:', duplicate.status, 'alpha=', duplicate.alpha.tolist())
```

Recorded output from the earlier execution:

```text
blobs: gap passed; train accuracy=1.000
primal=4.017906 dual=4.017906 gap=0.000000
positive coefficients: 20
XOR: gap passed; train accuracy=0.925
primal=16.684101 dual=16.684099 gap=0.000001
positive coefficients: 32
opposite duplicate: gap passed alpha= [1.0, 1.0]
```

The original Gaussian run reaches training accuracy 1.000 with 20 reported support vectors; the XOR run reaches 0.925 with 32 in this environment. These are training demonstrations, not held-out estimates. The printed primal and dual values assess the optimization of those particular objectives. A small residual gap can coexist with statistically poor predictions.

For n observations with d dense features, this teaching solver stores a full n×n Gram matrix and examines all pairs. Building the kernel costs O(n²d), each exhaustive step costs O(n²), and memory is O(n²+nd). These are its implementation costs. LIBSVM uses decomposition and a bounded kernel cache; it need not allocate an entire dense Gram matrix. A linear model can use quite different algorithms and storage.

### Keep the gradient instead of rebuilding it

The old complete solver above demonstrates the mathematics with a fresh certificate at every step. The next pair of files separates the model from its driver and keeps a reusable gradient. This is a different small implementation, with a newly declared six-row comparison; it does not rerun the old Gaussian or XOR fits.

<!-- figure: D24; newthree-row X[[-.8,.3],[.4,-.7],[.9,.2]],labels[-1,1,1], completeQ [[.73,.53,.66],[.53,.65,.22],[.66,.22,.85]], oldalpha[.3,.1,.2], G[.596,.732,.610]. Pair0/2 columns highlighted, delta.4158620689655172. Show every row's two subtractions -> Gnew[.0179517241,.4201034483,-.0179517241]. Rowidentity hues and Qcolumnidentity maintained through connectors; selectedcolumns outlined. -->

The maintained vector G=1−Qα is the same dual gradient called u in the pair derivation. In this new three-row example, G=[.596,.732,.610]. For pair0,2 the labels differ, so both coefficients increase by the same δ. Their slope is .610+.596=1.206; their curvature is2.9. The unconstrained choice1.206/2.9≈.415862 lies inside [−.2,.6]. It changes α to approximately [.715862,.1,.615862] and improves the dual by .250764827586.

Every gradient entry must then change, even the coefficient that was not edited. For row1, subtracting the two column contributions gives .732−.53δ−.22δ≈.420103448276. In matrix form:

\[
G_{\rm new}=G_{\rm old}-Q_{:,i}\Delta\alpha_i-Q_{:,j}\Delta\alpha_j.
\]

This update costs O(n), whereas computing Qα afresh costs O(n²). The code checks the final maintained vector against a fresh computation. RBF pair curvature uses −2expm1(−γ‖xᵢ−xⱼ‖²) rather than subtracting two almost equal numbers2−2k. Direct coordinate differences also avoid subtracting large squared norms of nearby inputs. The kernel constructor processes16 left rows at a time, so its largest displacement temporary has shape16×n×d rather than n×n×d.

<!-- figure: D25; actual new six-row linear/RBF trajectory from svm-mechanisms-execution.json, direct-labelled P/D values at saved steps, gap and stopstatus beside actual ownedmodel fieldsx/y/alpha/b/classes/featureorder. Linear stops10 gap1.4145e-8; RBF stops22 gap1.9707e-8; both stalled BEFORE 1e-9relativecriterion. Separate old observed trajectories, no interpolated invented run. -->

Periodic certificates reduce repeated global work; they do not replace the final global check. The exhaustive pair search is still O(n²) per iteration and stores Q and the Gram in O(n²) space. The new bounds are2–100 rows and1–20 features, with finite magnitudes≤1000. They make the example inspectable; production LIBSVM's working-set rules, bounded cache and shrinking solve a different engineering problem.

The helper below owns copied training rows, feature and row identities, coefficients and its stop state. `decision_function` accepts any number of correctly shaped query rows, including a rectangular batch, and uses every coefficient. `export_state` returns independent numeric lists. `from_state` validates the schema, dimensions, class/tie convention, box/balance constraints and reconstructed objective; it does not train or trust an arbitrary pickle. Feature identities matter: two same-shaped feature columns can still mean different measurements.

Save **both** complete files in the same directory and launch `python svm_mechanisms.py`. The import `from svm_core import PairSVM` resolves the neighboring helper. Importing the helper alone performs no fit.

**svm_core.py**

```python
"""Inspectible bounded binary dual solver with maintained gradient and state."""
import numpy as np


class PairSVM:
    def __init__(self, c=1., kernel='rbf', gamma=.5, tolerance=1e-7,
                 max_steps=20000, certificate_every=10):
        if kernel not in ('linear', 'rbf') or not np.isfinite(c) or not .001 <= c <= 100:
            raise ValueError('Choose linear/rbf and finite C in [.001,100].')
        if not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
            raise ValueError('Gamma must be finite in [1e-4,10].')
        if not np.isfinite(tolerance) or not 1e-10 <= tolerance <= .01:
            raise ValueError('Tolerance must be finite in [1e-10,.01].')
        if not isinstance(max_steps, int) or not 1 <= max_steps <= 50000:
            raise ValueError('Use 1..50000 steps.')
        if not isinstance(certificate_every, int) or not 1 <= certificate_every <= 100:
            raise ValueError('Certificate interval must be an integer in [1,100].')
        self.c, self.kernel, self.gamma = float(c), kernel, float(gamma)
        self.tolerance, self.max_steps = float(tolerance), max_steps
        self.certificate_every = certificate_every

    def matrix(self, left, right, block_rows=16):
        left, right = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
        if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:
            raise ValueError('Kernel matrices require matching feature dimensions.')
        if not np.isfinite(left).all() or not np.isfinite(right).all():
            raise ValueError('Kernel coordinates must be finite.')
        if max(np.max(np.abs(left), initial=0), np.max(np.abs(right), initial=0)) > 1000:
            raise ValueError('Feature magnitudes must be at most 1000.')
        if self.kernel == 'linear':
            return left @ right.T
        result = np.empty((len(left), len(right)))
        # Only block_rows x n_right x d differences exist at once.
        for start in range(0, len(left), block_rows):
            differences = left[start:start + block_rows, None, :] - right[None, :, :]
            squared = np.einsum('bnd,bnd->bn', differences, differences)
            result[start:start + block_rows] = np.exp(-self.gamma * squared)
        return result

    def certificate(self, gram, alpha, y):
        if np.min(alpha) < -1e-10 or np.max(alpha) > self.c + 1e-10 or abs(alpha @ y) > 1e-9:
            raise ArithmeticError('The proposed dual vector is not feasible.')
        signed = alpha * y
        raw = gram @ signed
        breaks = np.sort(y - raw)
        positives = int(np.sum(y == 1))
        # The hinge slope increases by one at every breakpoint.
        bias = float((breaks[positives - 1] + breaks[positives]) / 2)
        norm_squared = float(signed @ raw)
        scale = max(1., float(np.sum(np.abs(signed * raw))))
        if norm_squared < -1e-12 * scale:
            raise ArithmeticError('A materially negative kernel norm invalidates the certificate.')
        norm_squared = max(0., norm_squared)
        primal = .5 * norm_squared + self.c * np.maximum(0., 1 - y * (raw + bias)).sum()
        dual = float(alpha.sum()) - .5 * norm_squared
        gap = float(primal - dual)
        if not np.isfinite([bias, primal, dual, gap]).all():
            raise ArithmeticError('Certificate calculation is not finite.')
        if gap < -1e-10 * max(1., abs(primal), abs(dual)):
            raise ArithmeticError('A materially negative primal-dual gap is a numerical failure.')
        return bias, float(primal), dual, gap

    def pair_candidates(self, alpha, gradient, left, right, sign, curvature):
        slope = gradient[right] - sign * gradient[left]
        lower = np.maximum(-alpha[right], np.where(sign == 1, alpha[left] - self.c, -alpha[left]))
        upper = np.minimum(self.c - alpha[right], np.where(sign == 1, alpha[left], self.c - alpha[left]))
        delta = np.divide(slope, curvature, out=np.zeros_like(slope), where=curvature > 0)
        delta = np.clip(delta, lower, upper)
        endpoint = np.where(slope * upper > slope * lower, upper, lower)
        delta = np.where(curvature == 0, np.where(slope == 0, 0., endpoint), delta)
        gain = slope * delta - .5 * curvature * delta ** 2
        return delta, gain, slope, lower, upper

    def fit(self, x, y, feature_order=None, row_ids=None):
        x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
        if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
            raise ValueError('Use 2..100 rows and 1..20 features.')
        if y.shape != (len(x),) or set(y.tolist()) != {-1., 1.}:
            raise ValueError('Supply both -1 and +1 labels, one per row.')
        feature_order = list(feature_order) if feature_order is not None else [f'x{k}' for k in range(x.shape[1])]
        row_ids = list(row_ids) if row_ids is not None else [f'row{k}' for k in range(len(x))]
        if len(feature_order) != x.shape[1] or len(set(feature_order)) != len(feature_order):
            raise ValueError('Feature identities must be unique and match the columns.')
        if len(row_ids) != len(x) or len(set(row_ids)) != len(row_ids):
            raise ValueError('Row identities must be unique and match the observations.')
        self.x, self.y = x.copy(), y.copy()
        self.feature_order, self.row_ids = feature_order, row_ids
        gram = self.matrix(self.x, self.x)
        q = y[:, None] * gram * y[None, :]
        left, right = np.triu_indices(len(y), 1)
        sign = y[left] * y[right]
        differences = x[left] - x[right]
        squared = np.einsum('nd,nd->n', differences, differences)
        curvature = squared if self.kernel == 'linear' else -2 * np.expm1(-self.gamma * squared)
        alpha, gradient = np.zeros(len(y)), np.ones(len(y))
        self.trace = []
        self.status = 'step limit'
        for step in range(self.max_steps + 1):
            if step % self.certificate_every == 0 or step == self.max_steps:
                bias, primal, dual, gap = self.certificate(gram, alpha, y)
                self.trace.append({'step': step, 'primal': primal, 'dual': dual, 'gap': gap})
                if gap <= self.tolerance * max(1., abs(primal)):
                    self.status = 'gap passed'
                    break
            if step == self.max_steps:
                break
            delta, gain, _, _, _ = self.pair_candidates(alpha, gradient, left, right, sign, curvature)
            chosen = int(np.argmax(gain))
            if gain[chosen] <= 1e-15:
                bias, primal, dual, gap = self.certificate(gram, alpha, y)
                self.status = ('gap passed' if gap <= self.tolerance * max(1., abs(primal))
                               else 'stalled before gap criterion')
                break
            i, j = int(left[chosen]), int(right[chosen])
            old_i, old_j = alpha[i], alpha[j]
            new_i = float(np.clip(old_i - sign[chosen] * delta[chosen], 0., self.c))
            new_j = float(np.clip(old_j + delta[chosen], 0., self.c))
            # Both values use the old state. Update every gradient entry afterwards.
            alpha[i], alpha[j] = new_i, new_j
            gradient -= q[:, i] * (new_i - old_i) + q[:, j] * (new_j - old_j)
            if abs(alpha @ y) > 1e-9:
                raise ArithmeticError('The atomic pair update lost label balance.')
        bias, primal, dual, gap = self.certificate(gram, alpha, y)
        if not self.trace or self.trace[-1]['step'] != step:
            self.trace.append({'step': step, 'primal': primal, 'dual': dual, 'gap': gap})
        self.alpha, self.gradient, self.bias = alpha.copy(), gradient.copy(), bias
        self.primal, self.dual, self.gap, self.steps = primal, dual, gap, step
        np.testing.assert_allclose(self.gradient, 1 - q @ alpha, atol=1e-9, rtol=1e-10)
        return self

    def decision_function(self, x, feature_order=None):
        x = np.asarray(x, dtype=float)
        if x.ndim != 2 or x.shape[1] != self.x.shape[1]:
            raise ValueError('Queries must retain the fitted feature count.')
        if feature_order is not None and list(feature_order) != self.feature_order:
            raise ValueError('Query feature order differs from the saved model.')
        return self.matrix(x, self.x) @ (self.alpha * self.y) + self.bias

    def predict(self, x, feature_order=None):
        return np.where(self.decision_function(x, feature_order) >= 0, 1., -1.)

    def export_state(self):
        return {'schema': 1, 'kernel': self.kernel, 'c': self.c, 'gamma': self.gamma,
                'tolerance': self.tolerance, 'max_steps': self.max_steps,
                'certificate_every': self.certificate_every,
                'feature_order': list(self.feature_order), 'row_ids': list(self.row_ids),
                'n_features': self.x.shape[1], 'x': self.x.tolist(), 'y': self.y.tolist(),
                'alpha': self.alpha.tolist(), 'signed_coefficients': (self.alpha * self.y).tolist(),
                'bias': self.bias, 'status': self.status, 'steps': self.steps,
                'primal': self.primal, 'dual': self.dual, 'tie_label': 1}

    @classmethod
    def from_state(cls, state):
        if state.get('schema') != 1 or state.get('tie_label') != 1:
            raise ValueError('Unknown schema or score-zero label convention.')
        model = cls(state['c'], state['kernel'], state['gamma'], state['tolerance'],
                    state['max_steps'], state['certificate_every'])
        x, y = np.asarray(state['x'], float), np.asarray(state['y'], float)
        alpha = np.asarray(state['alpha'], float)
        features, rows = list(state['feature_order']), list(state['row_ids'])
        if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
            raise ValueError('Saved training shape is outside the model contract.')
        if y.shape != (len(x),) or set(y.tolist()) != {-1., 1.} or alpha.shape != y.shape:
            raise ValueError('Saved label/coefficient shape is invalid.')
        if not np.isfinite(alpha).all() or not np.isfinite(state['bias']):
            raise ValueError('Saved coefficients and bias must be finite.')
        if state['n_features'] != x.shape[1] or len(features) != x.shape[1] or len(set(features)) != len(features):
            raise ValueError('Saved feature identities do not match the matrix.')
        if len(rows) != len(x) or len(set(rows)) != len(rows):
            raise ValueError('Saved row identities do not match the matrix.')
        gram = model.matrix(x, x)
        bias, primal, dual, gap = model.certificate(gram, alpha, y)
        np.testing.assert_allclose(state['signed_coefficients'], alpha * y, atol=1e-12, rtol=1e-12)
        np.testing.assert_allclose([state['bias'], state['primal'], state['dual']],
                                   [bias, primal, dual], atol=1e-8, rtol=1e-10)
        if state['status'] not in ('gap passed', 'step limit', 'stalled before gap criterion'):
            raise ValueError('Unknown saved stop status.')
        if not isinstance(state['steps'], int) or not 0 <= state['steps'] <= model.max_steps:
            raise ValueError('Invalid saved step count.')
        if state['status'] == 'gap passed' and gap > model.tolerance * max(1., abs(primal)):
            raise ValueError('Saved gap-passed status fails reconstruction.')
        model.x, model.y, model.alpha = x.copy(), y.copy(), alpha.copy()
        model.feature_order, model.row_ids = features, rows
        model.bias, model.primal, model.dual, model.gap = bias, primal, dual, gap
        model.gradient = 1 - y * (gram @ (alpha * y))
        model.status, model.steps, model.trace = state['status'], state['steps'], []
        return model
```

**svm_mechanisms.py**

```python
"""New dual/state calculations; keep svm_core.py beside this complete driver."""
import json
import numpy as np
import sklearn
from sklearn.svm import SVC
from svm_core import PairSVM


def main():
    # Newly declared fixture, separate from every historical dataset and main.
    x = np.array([[-1.3, .2], [-.6, -.4], [.4, .7], [1.1, -.3], [-.2, 1.3], [.8, 1.2]])
    y = np.array([-1., -1., 1., 1., -1., 1.])
    queries = np.array([[.15, -.8], [-.7, .6], [1.4, .25]])
    names = ['coordinate_a', 'coordinate_b']
    rows = [f'new-{i}' for i in range(len(x))]
    fits = []
    for kernel in ('linear', 'rbf'):
        ours = PairSVM(c=.8, kernel=kernel, gamma=.7, tolerance=1e-9).fit(
            x, y, feature_order=names, row_ids=rows)
        ordinary = SVC(C=.8, kernel=kernel, gamma=.7, tol=1e-10,
                       shrinking=False, max_iter=100000).fit(x.copy(), y)
        scores = ours.decision_function(queries, feature_order=names)
        reference = ordinary.decision_function(queries)
        # Optimizers may use different pair schedules; compare scores and cost.
        np.testing.assert_allclose(scores, reference, atol=2e-5, rtol=2e-5)
        state = json.loads(json.dumps(ours.export_state()))
        restored = PairSVM.from_state(state)
        np.testing.assert_allclose(restored.decision_function(queries), scores,
                                   atol=1e-12, rtol=1e-12)
        x_snapshot = ours.x.copy()
        alpha_snapshot = ours.alpha.copy()
        state['x'][0][0] += .9
        state['alpha'][0] = .123
        np.testing.assert_array_equal(ours.x, x_snapshot)
        np.testing.assert_array_equal(ours.alpha, alpha_snapshot)
        fits.append({'kernel': kernel, 'status': ours.status, 'steps': ours.steps,
                     'primal': ours.primal, 'dual': ours.dual, 'gap': ours.gap,
                     'alpha': ours.alpha.tolist(), 'bias': ours.bias,
                     'queries': queries.tolist(), 'scores': scores.tolist(),
                     'ordinary_scores': reference.tolist(),
                     'ordinary_fit_status': int(ordinary.fit_status_),
                     'ordinary_iterations': ordinary.n_iter_.tolist(),
                     'max_score_difference': float(np.max(np.abs(scores - reference))),
                     'trace': ours.trace})

    # A three-row feasible state exposes both changed Q columns in every G cell.
    small_x = np.array([[-.8, .3], [.4, -.7], [.9, .2]])
    small_y = np.array([-1., 1., 1.])
    solver = PairSVM(c=.9, kernel='linear')
    gram = solver.matrix(small_x, small_x)
    q = small_y[:, None] * gram * small_y[None, :]
    alpha = np.array([.3, .1, .2])
    gradient = 1 - q @ alpha
    i, j = np.array([0]), np.array([2])
    sign = small_y[i] * small_y[j]
    curvature = np.sum((small_x[i] - small_x[j]) ** 2, axis=1)
    delta, gain, slope, lower, upper = solver.pair_candidates(
        alpha, gradient, i, j, sign, curvature)
    changed = alpha.copy()
    changed[0], changed[2] = alpha[0] - sign[0] * delta[0], alpha[2] + delta[0]
    new_gradient = gradient - q[:, 0] * (changed[0] - alpha[0]) - q[:, 2] * (changed[2] - alpha[2])
    np.testing.assert_allclose(new_gradient, 1 - q @ changed, atol=1e-12, rtol=1e-12)
    assert abs(changed @ small_y) <= 1e-12
    pair = {'Q': q.tolist(), 'alpha_before': alpha.tolist(), 'G_before': gradient.tolist(),
            'pair': [0, 2], 'slope': float(slope[0]), 'curvature': float(curvature[0]),
            'interval': [float(lower[0]), float(upper[0])], 'delta': float(delta[0]),
            'gain': float(gain[0]), 'alpha_after': changed.tolist(), 'G_after': new_gradient.tolist()}
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'fit_inputs': {'x': x_snapshot.tolist(), 'y': y.tolist(), 'C': .8, 'gamma': .7},
              'fits': fits, 'changed_pair': pair}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
```

Recorded output for the complete example above:

```text
{
  "versions": {
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "fit_inputs": {
    "x": [
      [
        -1.3,
        0.2
      ],
      [
        -0.6,
        -0.4
      ],
      [
        0.4,
        0.7
      ],
      [
        1.1,
        -0.3
      ],
      [
        -0.2,
        1.3
      ],
      [
        0.8,
        1.2
      ]
    ],
    "y": [
      -1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0
    ],
    "C": 0.8,
    "gamma": 0.7
  },
  "fits": [
    {
      "kernel": "linear",
      "status": "stalled before gap criterion",
      "steps": 10,
      "primal": 1.8565711336692083,
      "dual": 1.8565711195240668,
      "gap": 1.414514150255286e-08,
      "alpha": [
        0.0,
        0.4798269313343522,
        0.8,
        0.036776651140958905,
        0.8,
        0.4430502801933933
      ],
      "bias": -0.20930231529044818,
      "queries": [
        [
          0.15,
          -0.8
        ],
        [
          -0.7,
          0.6
        ],
        [
          1.4,
          0.25
        ]
      ],
      "scores": [
        -0.22093020114771117,
        -0.8837209366835996,
        1.4767441919599662
      ],
      "ordinary_scores": [
        -0.22093028118690702,
        -0.8837209221944172,
        1.4767442002793796
      ],
      "ordinary_fit_status": 0,
      "ordinary_iterations": [
        20
      ],
      "max_score_difference": 8.003919585441999e-08,
      "trace": [
        {
          "step": 0,
          "primal": 4.800000000000001,
          "dual": 0.0,
          "gap": 4.800000000000001
        },
        {
          "step": 10,
          "primal": 1.8565711336692083,
          "dual": 1.8565711195240668,
          "gap": 1.414514150255286e-08
        }
      ]
    },
    {
      "kernel": "rbf",
      "status": "stalled before gap criterion",
      "steps": 22,
      "primal": 2.6235557320008183,
      "dual": 2.623555712293491,
      "gap": 1.9707327325590995e-08,
      "alpha": [
        0.5665488286349352,
        0.8,
        0.8,
        0.7029442820545673,
        0.8,
        0.6636045465803679
      ],
      "bias": 0.040498072919396666,
      "queries": [
        [
          0.15,
          -0.8
        ],
        [
          -0.7,
          0.6
        ],
        [
          1.4,
          0.25
        ]
      ],
      "scores": [
        -0.037761551784420394,
        -0.7356436108327726,
        1.0923116677309306
      ],
      "ordinary_scores": [
        -0.03776153364150414,
        -0.7356435880179112,
        1.092311685763549
      ],
      "ordinary_fit_status": 0,
      "ordinary_iterations": [
        30
      ],
      "max_score_difference": 2.281486144450895e-08,
      "trace": [
        {
          "step": 0,
          "primal": 4.800000000000001,
          "dual": 0.0,
          "gap": 4.800000000000001
        },
        {
          "step": 10,
          "primal": 2.623844835113486,
          "dual": 2.6235556288488793,
          "gap": 0.0002892062646067117
        },
        {
          "step": 20,
          "primal": 2.623555809796043,
          "dual": 2.6235557122934807,
          "gap": 9.750256246832123e-08
        },
        {
          "step": 22,
          "primal": 2.6235557320008183,
          "dual": 2.623555712293491,
          "gap": 1.9707327325590995e-08
        }
      ]
    }
  ],
  "changed_pair": {
    "Q": [
      [
        0.7300000000000001,
        0.53,
        0.66
      ],
      [
        0.53,
        0.65,
        0.22000000000000006
      ],
      [
        0.66,
        0.22000000000000006,
        0.8500000000000001
      ]
    ],
    "alpha_before": [
      0.3,
      0.1,
      0.2
    ],
    "G_before": [
      0.596,
      0.732,
      0.61
    ],
    "pair": [
      0,
      2
    ],
    "slope": 1.206,
    "curvature": 2.9000000000000004,
    "interval": [
      -0.2,
      0.6000000000000001
    ],
    "delta": 0.4158620689655172,
    "gain": 0.25076482758620694,
    "alpha_after": [
      0.7158620689655172,
      0.1,
      0.6158620689655172
    ],
    "G_after": [
      0.017951724137931002,
      0.4201034482758621,
      -0.017951724137931058
    ]
  }
}
```

The driver compares the same newly declared data, C=.8 and γ=.7 with ordinary `SVC`, using linear and RBF kernels. Different working-set schedules can yield different coefficient distributions; query scores and the objective certificate are the meaningful comparisons. JSON roundtrip preserves scores, and changing the exported lists cannot mutate the fitted arrays.

| Newly executed model | Steps | Primal | Dual | Gap | Largest query-score difference from ordinary SVC |
| --- | --- | --- | --- | --- | --- |
| Linear | 10 | 1.8565711336692083 | 1.8565711195240668 | 1.414514150255286e−8 | 8.003919585441999e−8 |
| RBF | 22 | 2.6235557320008183 | 2.623555712293491 | 1.9707327325590995e−8 | 2.281486144450895e−8 |

Both runs stop **stalled before gap criterion**: their best pair gain falls below the implementation's1e−15 threshold while the remaining gap exceeds the requested1e−9 relative criterion. Ordinary SVC reports fit status0 in both comparisons. Small score differences do not upgrade the scratch stop status. The complete saved traces include the initial objective4.8 and every recorded checkpoint.

To make a changed case, set a smaller `max_steps` on a fresh model and inspect its status and gap; changing the cap must not reuse a prior fitted state. For duplicated opposite-label rows, verify the linear pair solution rather than skip zero curvature. To change class/sample penalties, use the weighted library route in §8: this core's bias breakpoint rule assumes one common C and is not a weighted implementation.

**Practice 5.** Two observations have opposite labels at the identical zero vector, C=0.7 and both coefficients initially zero. What does the best pair step do, and why is skipping q=0 wrong?

<details><summary>Hint</summary>

The legal increment interval is [0,0.7]. The gain has no quadratic term.

</details>

<details><summary>Explained solution</summary>

Here q=0 and g=2, so the best increment is 0.7. Both coefficients become 0.7 and the dual increases to 1.4. At w=b=0, the two hinges are one each, giving primal 1.4 as well. The gap is zero despite inseparable data. Skipping the zero-curvature pair would leave an objective gap of 1.4.

</details>

## 7. Select the model using held-out evidence

Optimization answers “how well did we minimize this training objective?” Model selection asks a different question: “which complete prediction procedure works on observations excluded from its fit?” We now create 200 noisy moon-shaped observations and split their identities before fitting anything: 120 training, 40 validation and 40 final test cases. The scaler learns its means and standard deviations only from the training set.

<!-- figure: D26; actual row identities in separate train120/validation40/test40 groups. Training feature values feed mean/SD rectangles and storedmean/scale cells; a named validation/query row uses ONLY those cells. Fold timeline keepsheldoutrows outside both scaler and classifier. Distinct rowrole labels/marks, no backward test arrow. -->

A transformed query coordinate is (xⱼ−μⱼ)/sⱼ, using the training mean μⱼ and population standard deviation sⱼ. Constant training coordinates use the scaler's unit-scale convention rather than division by zero. These saved numbers are part of the predictor. Recomputing them from a query batch changes the model.

<!-- figure: D27; actual nine moonsC/gamma cells from retained study, allobservedvalidationcounts labelled, defaultindex4(C1,gamma1), savedscorefield/supportmark beneathselection. Show trainvisibilitytoggle alongside ownquestion, allnine selectable; colourskeep classidentity and row-role separate by outline. -->

Each cell is an actual fitted RBF SVC, not a hand-painted accuracy surface. Select a cell to see its saved support-point predictor and switch between training and validation observations. The grid deliberately includes a model with better training accuracy but worse validation accuracy. A finite background grid approximates its decision display; the reported accuracies are evaluated at the actual observation coordinates.

Will the model with the highest training accuracy also be the first winner on validation data?

**moons-validation.py**

```python
import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

x, y = make_moons(n_samples=200, noise=.2, random_state=42)
train_valid, test = train_test_split(np.arange(200), test_size=.2, stratify=y, random_state=17)
train, valid = train_test_split(train_valid, test_size=.25, stratify=y[train_valid], random_state=19)
scaler = StandardScaler().fit(x[train])
xt, xv = scaler.transform(x[train]), scaler.transform(x[valid])
fitted = []
print(f'rows: train={len(train)}, validation={len(valid)}, test={len(test)}')
for c in [.1, 1., 10.]:
    for gamma in [.1, 1., 10.]:
        model = SVC(C=c, gamma=gamma, tol=1e-8).fit(xt, y[train])
        training, validation = model.score(xt, y[train]), model.score(xv, y[valid])
        fitted.append((c, gamma, model, training, validation))
        print(f'C={c:4.1f} gamma={gamma:4.1f} train={training:.3f} valid={validation:.3f} SV={len(model.support_)}')
# First grid entry wins an exact validation tie: selection never uses the test labels.
best = max(range(len(fitted)), key=lambda index: fitted[index][4])
c, gamma, selected, _, validation = fitted[best]
print(f'selected C={c:g}, gamma={gamma:g}; one test score={selected.score(scaler.transform(x[test]),y[test]):.3f}')
```

Recorded output from the earlier execution:

```text
rows: train=120, validation=40, test=40
C= 0.1 gamma= 0.1 train=0.833 valid=0.900 SV=93
C= 0.1 gamma= 1.0 train=0.925 valid=0.950 SV=93
C= 0.1 gamma=10.0 train=0.975 valid=0.950 SV=120
C= 1.0 gamma= 0.1 train=0.825 valid=0.900 SV=53
C= 1.0 gamma= 1.0 train=0.975 valid=0.975 SV=40
C= 1.0 gamma=10.0 train=0.975 valid=0.950 SV=80
C=10.0 gamma= 0.1 train=0.900 valid=0.925 SV=45
C=10.0 gamma= 1.0 train=0.983 valid=0.950 SV=21
C=10.0 gamma=10.0 train=0.992 valid=0.925 SV=76
selected C=1, gamma=1; one test score=1.000
```

The first validation winner in the declared ordering is C=1, γ=1: 39/40 validation cases and 40/40 test cases in this generated split. The test result is not a zero population error guarantee. Repeatedly trying new grids after inspecting that test set would turn it into selection data. A larger study would report uncertainty and stability across an appropriate resampling design; grouped or time-ordered observations need a split respecting those dependencies.

Scaling matters because feature distances enter both the norm penalty and RBF similarities. A measurement in milliseconds can numerically dominate another in seconds without being more useful. During cross-validation, imputation, scaling, feature selection and target-dependent transforms must be fitted inside each training fold. A pipeline enforces that boundary. Dense examples here use standard scaling; for sparse matrices, centering can destroy sparsity, so choose a sparse-compatible transformation such as `StandardScaler(with_mean=False)` when appropriate. Categories need a deliberate numerical representation; arbitrary integer codes impose arbitrary distances.

Where is each scaler fitted during cross-validation, and how does the selected model compare with a majority baseline?

**heldout-classification.py**

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC, LinearSVC

x, y = make_classification(n_samples=500, n_features=20, n_informative=10,
                           n_redundant=5, random_state=42)
xt, xe, yt, ye = train_test_split(x, y, test_size=.3, stratify=y, random_state=11)
folds = StratifiedKFold(n_splits=3, shuffle=True, random_state=3)
baseline = DummyClassifier(strategy='most_frequent').fit(xt, yt)
print(f'train={len(yt)}, test={len(ye)}; majority test accuracy={baseline.score(xe,ye):.3f}')
rbf = GridSearchCV(make_pipeline(StandardScaler(), SVC()),
                  {'svc__C': [.1, 1., 10.], 'svc__gamma': [.01, .1, 1.]}, cv=folds)
rbf.fit(xt, yt)  # Each fold fits its own scaler.
linear = GridSearchCV(make_pipeline(StandardScaler(), LinearSVC(dual=False, max_iter=10000)),
                     {'linearsvc__C': [.1, 1., 10.]}, cv=folds).fit(xt, yt)
for name, search in [('RBF', rbf), ('linear squared hinge', linear)]:
    print(name, search.best_params_)
    print(f'CV={search.best_score_:.3f} held-out accuracy={search.score(xe,ye):.3f}')
print('RBF support counts by class:', rbf.best_estimator_.named_steps['svc'].n_support_.tolist())
print('RBF decision shape:', rbf.decision_function(xe[:3]).shape)
print('Selection/CV and these held-out comparisons do not establish a universal winner.')
```

Recorded output from the earlier execution:

```text
train=350, test=150; majority test accuracy=0.507
RBF {'svc__C': 10.0, 'svc__gamma': 0.1}
CV=0.926 held-out accuracy=0.920
linear squared hinge {'linearsvc__C': 1.0}
CV=0.843 held-out accuracy=0.807
RBF support counts by class: [117, 123]
RBF decision shape: (3,)
Selection/CV and these held-out comparisons do not establish a universal winner.
```

This complete 500-row example uses 350 training and 150 held-out test observations. Its cross-validated RBF pipeline obtains test accuracy 0.920; the linear pipeline obtains 0.807 and the majority baseline 0.507 in this run. The generator, split, search grids and versions are all in the program. These values do not establish that RBF always wins, or that one raw C value gives equivalent regularization in both implementations.

### A declared comparison on measured wine chemistry

The moons example controlled a synthetic geometry. To test the workflow on measured inputs, the next study uses178 wines described by13 chemical measurements and three cultivar classes. This is the bundled `load_wine` dataset from UCI, with original row identities and source attribution retained. A cultivar label is a categorical outcome; it is not a wine quality score.

The question is whether added kernel flexibility earns better held-out classification under one fixed protocol. Original data attribution is Aeberhard and Forina, UCI DOI10.24432/C5PC7J under CC BY4.0; the dataset source describes wines from one Italian region, and does not supply producer/vintage grouping identities for this comparison. Before fitting, original row IDs are split into106 training,36 validation and36 test cases. The first stratified split holds out36 test IDs using seed61; the second takes36 validation IDs from the remaining142 using seed67. The class counts are [35,43,28] in training and [12,14,10] in each holdout.

Each candidate fits its own `StandardScaler` on those106 training rows. The linear candidates are ordinary `SVC(kernel='linear')`, so their hinge and unpenalized-intercept contract matches C-SVC. They are followed by RBF candidates. Selection uses **balanced accuracy**, the arithmetic mean of the three class recalls. A recall is the correctly predicted count in one true class divided by that class's observed count. Ordinary accuracy instead divides all correct predictions by all rows. The first listed candidate wins an exact balanced-accuracy tie; accuracy is reported but does not break ties.

<!-- figure: D28; actual12row candidate report from wine-svm-study-results.json, alltrain/validation metrics/supportcount/fitstatus. Train106->allcandidatefit; validation36->choiceindex6; lockedstate arrow->test36 confusion. Trueclassrows/predictedclasscolumns explicitly0/1/2, classidentity coloursstable acrosscounts/confusion, selectionoutline separate. No editable test labels, no browsernewfit. -->

| Index | Kernel | C | γ | Training balanced accuracy | Validation balanced accuracy | Validation accuracy | Support count |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Linear | .1 | — | 1.000000 | .952381 | .944444 | 34 |
| 1 | Linear | 1 | — | 1.000000 | .952381 | .944444 | 24 |
| 2 | Linear | 10 | — | 1.000000 | .952381 | .944444 | 24 |
| 3 | RBF | .1 | .01 | .352381 | .333333 | .388889 | 104 |
| 4 | RBF | .1 | .1 | .954762 | .966667 | .972222 | 100 |
| 5 | RBF | .1 | 1 | .333333 | .333333 | .388889 | 106 |
| 6 | RBF | 1 | .01 | 1.000000 | .976190 | .972222 | 60 |
| 7 | RBF | 1 | .1 | 1.000000 | .976190 | .972222 | 54 |
| 8 | RBF | 1 | 1 | 1.000000 | .561111 | .611111 | 106 |
| 9 | RBF | 10 | .01 | 1.000000 | .952381 | .944444 | 30 |
| 10 | RBF | 10 | .1 | 1.000000 | .976190 | .972222 | 52 |
| 11 | RBF | 10 | 1 | 1.000000 | .650000 | .694444 | 106 |

The table is rounded for reading; the complete output retains full precision, predictions, confusion matrices and each class's recall. All twelve fits report convergence under the declared100,000-iteration cap. Index6 is the first exact winner, with validation balanced accuracy .9761904761904763. It misclassifies one validation observation: validation accuracy is35/36. Several more flexible fits classify every training row while performing much worse on validation. High training accuracy therefore cannot substitute for the held-out comparison.

The selected **training-only** pipeline is frozen before test evaluation; it is not refitted on training plus validation. It correctly classifies all36 test rows. Its confusion matrix has true-class rows and predicted-class columns:

| True / predicted | 0 | 1 | 2 |
| --- | --- | --- | --- |
| 0 | 12 | 0 | 0 |
| 1 | 0 | 14 | 0 |
| 2 | 0 | 0 | 10 |

The training-most-frequent baseline always chooses class1. It gets14/36 correct, accuracy .388889 and balanced accuracy1/3, with all12 class0 and all10 class2 rows missed. Both models were evaluated once on this test set. The perfect selected-model count describes these36 observations, not all future wines. Unknown producer, vintage or measurement-batch dependencies would require group-aware splitting; a convenient small historical dataset is not evidence for operational deployment.

The complete program below records every candidate outcome before comparing it with the provisional best, refuses to overwrite its output, records the source description and actual data/target hashes, and keeps the numeric selected state. A failed candidate cap is retained as protocol failure and stops the test stage; it does not silently increase the cap or omit a weak result. `--output wine-svm-study-results.json` selects a new output path. To modify the comparison, declare a fresh split/grid and untouched evaluation set before running it; do not tune this stored test result.

**wine-svm-study.py**

```python
"""One predeclared train/validation/test Wine study; all outcomes are retained."""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import warnings

import numpy as np
import sklearn
from sklearn.datasets import load_wine
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


def metrics(target, prediction):
    return {'balanced_accuracy': float(balanced_accuracy_score(target, prediction)),
            'accuracy': float(accuracy_score(target, prediction)),
            'recall_by_class': recall_score(target, prediction, labels=[0, 1, 2],
                                           average=None, zero_division=0).tolist(),
            'confusion_true_rows_predicted_columns': confusion_matrix(
                target, prediction, labels=[0, 1, 2]).tolist()}


def frozen_state(pipeline, train_ids, feature_names):
    scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
    return {'feature_names': list(feature_names), 'classes': model.classes_.tolist(),
            'train_ids': train_ids.tolist(), 'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(), 'scaler_variance': scaler.var_.tolist(),
            'kernel': model.kernel, 'C': float(model.C), 'gamma_parameter': model.gamma,
            'effective_gamma': float(model._gamma),
            'support_train_addresses': model.support_.tolist(),
            'support_original_row_ids': train_ids[model.support_].tolist(),
            'support_vectors_standardized': model.support_vectors_.tolist(),
            'n_support_by_class': model.n_support_.tolist(),
            'packed_signed_dual_coefficients': model.dual_coef_.tolist(),
            'pair_intercepts': model.intercept_.tolist(),
            'class_pairs': [[0, 1], [0, 2], [1, 2]],
            'coefficient_layout': 'SVC packed multiclass OVO; not one binary coefficient vector',
            'browser_route': 'observed outcomes only; no edited packed-multiclass forward claimed'}


def study():
    dataset = load_wine()
    x, y = dataset.data.copy(), dataset.target.copy()
    assert x.shape == (178, 13) and y.shape == (178,) and set(y.tolist()) == {0, 1, 2}
    assert np.isfinite(x).all()
    ids = np.arange(len(y))
    remaining, test_ids = train_test_split(ids, test_size=36, stratify=y, random_state=61)
    train_ids, validation_ids = train_test_split(
        remaining, test_size=36, stratify=y[remaining], random_state=67)
    assert (len(train_ids), len(validation_ids), len(test_ids)) == (106, 36, 36)
    assert len(set(train_ids) | set(validation_ids) | set(test_ids)) == 178
    assert not (set(train_ids) & set(validation_ids) or set(train_ids) & set(test_ids)
                or set(validation_ids) & set(test_ids))
    configurations = [('linear', c, 'scale') for c in (.1, 1., 10.)]
    configurations += [('rbf', c, gamma) for c in (.1, 1., 10.) for gamma in (.01, .1, 1.)]
    report = {
        'protocol': {'dataset': 'UCI Wine bundled in sklearn', 'rows': 178, 'features': 13,
                     'test_split_seed': 61, 'validation_split_seed': 67,
                     'train': 106, 'validation': 36, 'test': 36,
                     'selection': 'validation balanced accuracy, first listed candidate wins exact tie',
                     'scaler_fit': '106 training rows only', 'tol': 1e-7,
                     'cache_size_mb': 200, 'max_iter': 100000,
                     'refit': 'none; selected pipeline retains its training-only fit',
                     'failure': 'retain all candidates; any cap failure aborts test assessment'},
        'versions': {'python': platform.python_version(), 'numpy': np.__version__,
                     'sklearn': sklearn.__version__},
        'provenance': {'source': 'https://archive.ics.uci.edu/dataset/109/wine',
                       'doi': '10.24432/C5PC7J', 'attribution': 'Aeberhard and Forina, UCI Wine',
                       'license': 'CC BY 4.0', 'inspection_date': '2026-10-06',
                       'loader_description': dataset.DESCR,
                       'data_float64_little_endian_sha256': hashlib.sha256(x.astype('<f8').tobytes()).hexdigest(),
                       'target_int64_little_endian_sha256': hashlib.sha256(y.astype('<i8').tobytes()).hexdigest()},
        'dataset': {'feature_names': dataset.feature_names, 'class_names': dataset.target_names.tolist(),
                    'data': x.tolist(), 'targets': y.tolist()},
        'split': {'train_ids': train_ids.tolist(), 'validation_ids': validation_ids.tolist(),
                  'test_ids': test_ids.tolist(),
                  'class_counts': {name: np.bincount(y[rows], minlength=3).tolist()
                                   for name, rows in [('train', train_ids), ('validation', validation_ids), ('test', test_ids)]}},
        'candidates': []}
    pipelines = []
    selected, best = None, -np.inf
    for index, (kernel, c, gamma) in enumerate(configurations):
        pipeline = make_pipeline(StandardScaler(), SVC(
            kernel=kernel, C=c, gamma=gamma, tol=1e-7, cache_size=200, max_iter=100000))
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter('always')
            pipeline.fit(x[train_ids], y[train_ids])
        scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
        np.testing.assert_allclose(scaler.mean_, x[train_ids].mean(0), atol=1e-12, rtol=1e-12)
        assert int(scaler.n_samples_seen_) == 106
        train_prediction = pipeline.predict(x[train_ids])
        validation_prediction = pipeline.predict(x[validation_ids])
        train_metrics = metrics(y[train_ids], train_prediction)
        validation_metrics = metrics(y[validation_ids], validation_prediction)
        eligible = int(model.fit_status_) == 0
        row = {'index': index, 'kernel': kernel, 'C': c, 'gamma_parameter': gamma,
               'effective_gamma': float(model._gamma), 'eligible': eligible,
               'fit_status': int(model.fit_status_), 'iterations_by_pair': model.n_iter_.tolist(),
               'warnings': [str(item.message) for item in caught],
               'support_total': len(model.support_), 'support_by_class': model.n_support_.tolist(),
               'train': train_metrics, 'validation': validation_metrics,
               'train_predictions': train_prediction.tolist(),
               'validation_predictions': validation_prediction.tolist()}
        report['candidates'].append(row)
        pipelines.append(pipeline)
        if eligible and validation_metrics['balanced_accuracy'] > best:
            selected, best = index, validation_metrics['balanced_accuracy']
    report['provisional_selection_index'] = selected
    if selected is None or any(not row['eligible'] for row in report['candidates']):
        report['status'] = 'protocol failure; no test assessment'
        return report

    # Freeze the training-only choice and numeric state before test assessment.
    selected_pipeline = pipelines[selected]
    state = frozen_state(selected_pipeline, train_ids, dataset.feature_names)
    state_bytes = json.dumps(state, sort_keys=True, separators=(',', ':')).encode()
    report['selected_index'] = selected
    report['selected_state'] = state
    report['selected_state_sha256'] = hashlib.sha256(state_bytes).hexdigest()
    baseline = DummyClassifier(strategy='most_frequent').fit(x[train_ids], y[train_ids])
    test_prediction = selected_pipeline.predict(x[test_ids])
    baseline_prediction = baseline.predict(x[test_ids])
    report['test'] = {'selected': metrics(y[test_ids], test_prediction),
                      'baseline': metrics(y[test_ids], baseline_prediction),
                      'row_ids': test_ids.tolist(), 'targets': y[test_ids].tolist(),
                      'selected_predictions': test_prediction.tolist(),
                      'baseline_predictions': baseline_prediction.tolist()}
    report['status'] = 'completed predeclared protocol'
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, help='Write a new result file; existing files are refused.')
    args = parser.parse_args()
    if args.output is not None and args.output.exists():
        parser.error('Output already exists; preserve it instead of silently repeating this study.')
    result = study()
    text = json.dumps(result, indent=2) + '\n'
    if args.output is None:
        print(text, end='')
    else:
        args.output.write_text(text, encoding='utf-8')
        print(json.dumps({'status': result['status'], 'output': str(args.output),
                          'selected_index': result.get('selected_index'),
                          'sha256': hashlib.sha256(text.encode()).hexdigest()}))


if __name__ == '__main__':
    main()
```



The selected multiclass support coefficients use SVC's packed pairwise layout. They are stored for reproducibility; the live report displays observed outcomes and does not treat this layout as a single binary coefficient vector. The next section explains why those prediction contracts differ.

## 8. Scores, probabilities, classes and data contracts

### A margin score is not a probability

A score has a sign and an arbitrary optimization scale. To see why its magnitude cannot simply mean confidence, consider many possible labels at the same input. Let p be the true probability of label+1 there and let t be the score we choose. The expected hinge cost is

\[
R_p(t)=p\max(0,1-t)+(1-p)\max(0,1+t).
\]

For −1≤t≤1 this becomes1+(1−2p)t. If .5<p<1 its minimum is at t=1; if0<p<.5 it is at t=−1. Thus p=.6 and p=.99 have the same minimizing score1. At p=.5 every t in [−1,1] minimizes the risk. At the endpoints p=1 all t≥1 minimize; at p=0 all t≤−1 minimize. The unregularized conditional calculation is an explanation of what hinge asks for, not a formula for the fitted regularized model's conditional probabilities.

A large signed score describes a position relative to the fitted margin scale. It is not a calibrated probability. A separate sigmoid calibration fits a map such as 1/(1+exp(Af+B)) using labeled scores not produced by a model trained on those same observations. The sign of A is learned; the class ordering must be checked rather than inferred from a column number.

**Version contract:** in scikit-learn 1.9.1, `SVC(probability=...)` is deprecated and scheduled for removal in 1.11. The current API recommends an explicit `CalibratedClassifierCV` wrapper. The older lesson's implicit probability program is preserved in its source archive; the executed workflow below calibrates the complete scaling-and-SVC pipeline.

<!-- figure: D29; threeOOF lanes each has heldoutclasslabelled rows separate, otherrows->whole scaler+SVCfit->heldoutscore. Concatenate OOFscores/labels->sigmoidfit(A,B). Separate finalwholetraining scaler+SVCfit->newqueryscore->sigmoid->probabilityvector with classesnames. Training-row identities remain consistent when excluded/included; score and probability axes distinctly labelled. ensemble=False written on scene, nestedselectionboundary described. -->

Each pictured fold fits a whole pipeline on the other folds and produces scores for its excluded rows. Concatenating these **out-of-fold**, OOF, scores gives one score per supplied training observation from a base model that excluded it. Their labels fit the probability map. Then a fresh base pipeline fits all supplied training data for future queries. This is the explicit `ensemble=False` route.

Each fold's scaler must remain inside that pipeline. An ensemble configuration instead retains fold-specific calibrated models and averages their probabilities. A frozen previously fitted estimator requires separate calibration observations. If hyperparameters were selected using all the same training labels before this out-of-fold step, those scores are not a clean account of the entire selection procedure; nested selection or an independent calibration split addresses that additional dependence.

To assess probabilities, temporarily encode the positive-class event by an indicator z=1, with z=0 for the other class; these are not the signed margin labels−1/+1. For positive-class probability p, binary **Brier loss** is (p−z)² and log loss is −[z log p+(1−z)log(1−p)]. Average each over the held-out rows. Lower is better on the same target population. For example z=1,p=.8 gives Brier .04 and log loss −log(.8)≈.223144. Binary Brier is this one-event convention; summing both class-coordinate squares would give twice that value.

Which observations fit each scaler and classifier, and what does a held-out Brier score establish?

**calibrated-pipeline.py**

```python
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.datasets import make_classification
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

x, y = make_classification(n_samples=500, n_features=20, n_informative=10,
                           n_redundant=5, random_state=42)
xt, xe, yt, ye = train_test_split(x, y, test_size=.3, stratify=y, random_state=11)
pipeline = make_pipeline(StandardScaler(), SVC(C=1, gamma='scale'))
calibrated = CalibratedClassifierCV(pipeline, method='sigmoid', ensemble=False,
                                  cv=StratifiedKFold(3, shuffle=True, random_state=7))
calibrated.fit(xt, yt)
probabilities = calibrated.predict_proba(xe)
positive = int(np.flatnonzero(calibrated.classes_ == 1)[0])
p = probabilities[:, positive]
prior = np.full(len(ye), np.mean(yt))
print('classes:', calibrated.classes_.tolist(), 'probability shape:', probabilities.shape)
print('first three positive probabilities:', p[:3].round(4).tolist())
print(f'prior Brier={brier_score_loss(ye,prior):.4f}; calibrated Brier={brier_score_loss(ye,p):.4f}')
print(f'held-out log loss={log_loss(ye,probabilities):.4f}')
print('rows sum to one:', bool(np.allclose(probabilities.sum(axis=1), 1)))
print('A finite held-out proper score is an assessment, not proof of perfect calibration.')
```

Recorded output from the earlier execution:

```text
classes: [0, 1] probability shape: (150, 2)
first three positive probabilities: [0.0944, 0.0914, 0.1411]
prior Brier=0.2500; calibrated Brier=0.0742
held-out log loss=0.2328
rows sum to one: True
A finite held-out proper score is an assessment, not proof of perfect calibration.
```

The program prints both scores, verifies probability normalization and looks up the positive class through `classes_`. An aggregate Brier improvement does not prove calibration within every subgroup or after distribution shift. Probability argmax and the original uncalibrated class rule can disagree. [Calibration & Conformal Prediction](/learn/path/full-curriculum/calibration-conformal-prediction) develops reliability, uncertainty and separate guarantees.

### Weights, multiclass scores and interchangeable-looking APIs

<!-- figure: D30; separate weightedprice view rowC/classweight/sampleweight->multiply->C_i/boxendpoint; alongside separate multiclassview labelled fourclassnodes/sixpair edges and a selectedquery's pairvotes -> classcounts -> distinctOVR-shape presentation. No simultaneousfourcontrolwall; classidentity persists acrossgraph/scorecolumns; do not equate outputshape with fitstrategy. -->

Class and sample weights replace the uniform hinge price by Cᵢ=C×class_weight[yᵢ]×sample_weight[i], and the dual upper bound becomes αᵢ≤Cᵢ. They change the objective, not the number of independent minority examples. For balanced class weighting, scikit-learn uses n/(K nₖ); a 95-to-5 binary split gives the minority class 19 times the majority's per-example weight. Whether that tradeoff is useful depends on errors, costs and held-out metrics. In the full binary library example below, a deliberate modification is to construct `SVC(C=.65, kernel='linear', class_weight={'left': 1., 'right': 2.})` and call `.fit(x.copy(), y, sample_weight=np.ones(len(y)))` on its defined six-row data. This assigns price .65 to a left row and1.3 to a right row. Changing a single sample weight to .5 halves that row's price only. Keep weights finite and nonnegative, and select any cost policy using the permitted training/validation evidence. The displayed unweighted result remains the original execution; this modification defines a new fit, not a reinterpretation of its saved coefficients.

SVC trains one binary model for each class pair: K(K−1)/2 models. Its default one-versus-rest-shaped decision output transforms that pairwise information; it does not mean the training procedure became one-versus-rest. Four classes produce six pairwise scores, or four presented class scores. LinearSVC normally fits one-versus-rest models instead.

How many binary models are trained for four classes, and does switching output presentation retrain them?

**multiclass-and-gram.py**

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

x, y = make_classification(n_samples=160, n_features=10, n_informative=6,
                           n_redundant=2, n_classes=4, n_clusters_per_class=1, random_state=5)
xt, xe, yt, ye = train_test_split(x, y, test_size=.25, stratify=y, random_state=9)
scaler = StandardScaler().fit(xt)
xt, xe = scaler.transform(xt), scaler.transform(xe)
model = SVC(kernel='linear', decision_function_shape='ovo', tol=1e-8).fit(xt, yt)
predictions = model.predict(xe)
print('classes:', model.classes_.tolist(), 'binary pairs:', 4 * 3 // 2)
print('OVO score shape:', model.decision_function(xe[:3]).shape)
model.set_params(decision_function_shape='ovr')  # Presentation changes; no refitting.
print('OVR score shape:', model.decision_function(xe[:3]).shape)
print('labels unchanged:', bool(np.array_equal(predictions, model.predict(xe))))
train_gram, query_gram = xt @ xt.T, xe @ xt.T
precomputed = SVC(kernel='precomputed', tol=1e-8).fit(train_gram, yt)
print('train/query Gram shapes:', train_gram.shape, query_gram.shape)
print('precomputed labels agree:', bool(np.array_equal(predictions, precomputed.predict(query_gram))))
```

Recorded output from the earlier execution:

```text
classes: [0, 1, 2, 3] binary pairs: 6
OVO score shape: (3, 6)
OVR score shape: (3, 4)
labels unchanged: True
train/query Gram shapes: (120, 120) (40, 120)
precomputed labels agree: True
```

A precomputed kernel passed to fit has shape training-by-training. At prediction it has query-by-training shape, with columns in the exact original training order. A square query-by-query matrix answers a different question and cannot replace it. The complete program verifies agreement between the ordinary linear kernel and this explicitly constructed matrix.

<!-- figure: D31; actual3query×2training-column numericalGram with columnidentitiesA/B, signedcoeff[-.5,.5],bias0 and rowproducts. LineartrainA=(-1,0),B=(1,0);queries(.4,.2),(-.7,1),(1.2,-.3),Gram[[-.4,.4],[.7,-.7],[-1.2,1.2]], scores[.4,-.7,1.2]. Wrongcolumnswapwithoutcoeff flipsallthree scores; jointpermutation preserves. Labelsnot justshape, localpan/texttable. -->

Take training rows A=(−1,0) and B=(1,0), signed coefficients [−.5,.5] and bias0. Three query rows (.4,.2),(−.7,1),(1.2,−.3) produce rows [−.4,.4],[.7,−.7],[−1.2,1.2] in a3×2 Gram. Multiplying by the matching coefficients returns [.4,−.7,1.2]. Swapping only A/B columns negates every score. Swapping their coefficients and identities together preserves every score. Equal dimensions do not establish equal meaning.

### Reconstruct an ordinary library model without fitting again

The next complete binary program fits six new observations with string labels. It saves numeric copies of the rows, feature identities, signed coefficients, bias and `classes_`. SVC's binary `dual_coef_` is already signed; multiplying it by labels a second time changes the score. A nonnegative score here maps to the second class, with an explicit score-zero tie convention. This local convention is not a promise about every multiclass or exact library tie.

**library-state-and-gram.py**

```python
"""Binary signed-coefficient reconstruction and named rectangular Gram state."""
import json
import warnings
import numpy as np
import sklearn
from sklearn.svm import SVC


def linear_kernel(left, right):
    return np.asarray(left, dtype=float) @ np.asarray(right, dtype=float).T


def binary_state(estimator, training, row_ids, feature_order):
    training = np.asarray(training, dtype=float)
    if len(estimator.classes_) != 2 or training.ndim != 2:
        raise ValueError('This explicit state supports binary classification only.')
    if len(row_ids) != len(training) or len(set(row_ids)) != len(row_ids):
        raise ValueError('Unique training IDs must match all rows.')
    if len(feature_order) != training.shape[1] or len(set(feature_order)) != len(feature_order):
        raise ValueError('Unique feature names must match the training columns.')
    signed = np.zeros(len(training))
    signed[estimator.support_] = estimator.dual_coef_[0]
    return {'schema': 1, 'kernel': 'linear', 'classes': estimator.classes_.tolist(),
            'training': training.copy().tolist(), 'train_ids': list(row_ids),
            'feature_order': list(feature_order), 'signed_coefficients': signed.tolist(),
            'bias': float(estimator.intercept_[0]), 'tie_column': 1}


def scores_from_named_gram(gram, column_ids, state):
    gram = np.asarray(gram, dtype=float)
    if state.get('schema') != 1 or state.get('kernel') != 'linear':
        raise ValueError('Unknown state schema or kernel.')
    if list(column_ids) != state['train_ids']:
        raise ValueError('Gram columns must match the saved training row identities/order.')
    signed = np.asarray(state['signed_coefficients'], dtype=float)
    if gram.ndim != 2 or gram.shape[1] != len(signed) or not np.isfinite(gram).all():
        raise ValueError('Use finite query x training similarities.')
    if signed.shape != (len(state['train_ids']),) or not np.isfinite(signed).all() or not np.isfinite(state['bias']):
        raise ValueError('Saved coefficients/bias do not satisfy the state contract.')
    return gram @ signed + state['bias']


def decision_function(queries, feature_order, state):
    if list(feature_order) != state['feature_order']:
        raise ValueError('Query feature identity/order differs from the saved model.')
    queries, training = np.asarray(queries, float), np.asarray(state['training'], float)
    if queries.ndim != 2 or training.ndim != 2 or queries.shape[1] != training.shape[1]:
        raise ValueError('Queries must retain the fitted feature count.')
    if not np.isfinite(queries).all() or not np.isfinite(training).all():
        raise ValueError('Query/training coordinates must be finite.')
    return scores_from_named_gram(linear_kernel(queries, training), state['train_ids'], state)


def main():
    x = np.array([[-1.4, -.2], [-.7, .9], [-.3, -.8], [.45, .4], [1.2, -.6], [.8, 1.1]])
    y = np.array(['left', 'left', 'left', 'right', 'right', 'right'])
    q = np.array([[-.25, .7], [.35, -.9], [1.7, .2]])
    features, ids = ['first', 'second'], [f'train-{k}' for k in range(len(x))]
    ordinary = SVC(C=.65, kernel='linear', tol=1e-9, max_iter=100000).fit(x.copy(), y)
    state = binary_state(ordinary, x, ids, features)
    restored = json.loads(json.dumps(state))
    scores = decision_function(q, features, restored)
    np.testing.assert_allclose(scores, ordinary.decision_function(q), atol=1e-12, rtol=1e-12)
    gram = linear_kernel(q, x)
    permutation = np.array([3, 0, 5, 1, 4, 2])
    together = json.loads(json.dumps(state))
    together['train_ids'] = [ids[k] for k in permutation]
    together['signed_coefficients'] = np.asarray(state['signed_coefficients'])[permutation].tolist()
    together['training'] = x[permutation].tolist()
    np.testing.assert_allclose(scores_from_named_gram(gram[:, permutation], together['train_ids'], together),
                               scores, atol=1e-12, rtol=1e-12)
    wrong_scores = gram[:, permutation] @ np.asarray(state['signed_coefficients']) + state['bias']
    assert np.max(np.abs(wrong_scores - scores)) > .01
    rejected = False
    try:
        scores_from_named_gram(gram[:, permutation], together['train_ids'], state)
    except ValueError:
        rejected = True
    assert rejected

    # A callable may retain a training reference. Our owned copy is isolated.
    supplied = x.copy()
    owned_training = supplied.copy()
    callable_fit = SVC(C=.65, kernel=linear_kernel, tol=1e-9).fit(owned_training, y)
    callable_before = callable_fit.decision_function(q).copy()
    supplied[0] += 20
    np.testing.assert_allclose(callable_fit.decision_function(q), callable_before, atol=1e-12, rtol=1e-12)
    np.testing.assert_array_equal(owned_training, x)
    precomputed = SVC(C=.65, kernel='precomputed', tol=1e-9).fit(linear_kernel(x, x), y)
    np.testing.assert_allclose(precomputed.decision_function(gram), scores, atol=1e-7, rtol=1e-7)
    with warnings.catch_warnings(record=True) as recorded:
        warnings.simplefilter('always')
        capped = SVC(C=.65, kernel='linear', max_iter=1).fit(x, y)
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'inputs': {'training': x.tolist(), 'labels': y.tolist(), 'queries': q.tolist(), 'C': .65},
              'state': state, 'query_gram_shape': list(gram.shape), 'scores': scores.tolist(),
              'ordinary_fit_status': int(ordinary.fit_status_), 'ordinary_iterations': ordinary.n_iter_.tolist(),
              'support_count': ordinary.n_support_.tolist(), 'wrong_column_scores': wrong_scores.tolist(),
              'wrong_named_columns_rejected': rejected,
              'callable_copy_scores': callable_before.tolist(),
              'precomputed_scores': precomputed.decision_function(gram).tolist(),
              'capped': {'fit_status': int(capped.fit_status_), 'iterations': capped.n_iter_.tolist(),
                         'warnings': [str(item.message) for item in recorded]}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
```

Recorded output for the complete example above:

```text
{
  "versions": {
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "inputs": {
    "training": [
      [
        -1.4,
        -0.2
      ],
      [
        -0.7,
        0.9
      ],
      [
        -0.3,
        -0.8
      ],
      [
        0.45,
        0.4
      ],
      [
        1.2,
        -0.6
      ],
      [
        0.8,
        1.1
      ]
    ],
    "labels": [
      "left",
      "left",
      "left",
      "right",
      "right",
      "right"
    ],
    "queries": [
      [
        -0.25,
        0.7
      ],
      [
        0.35,
        -0.9
      ],
      [
        1.7,
        0.2
      ]
    ],
    "C": 0.65
  },
  "state": {
    "schema": 1,
    "kernel": "linear",
    "classes": [
      "left",
      "right"
    ],
    "training": [
      [
        -1.4,
        -0.2
      ],
      [
        -0.7,
        0.9
      ],
      [
        -0.3,
        -0.8
      ],
      [
        0.45,
        0.4
      ],
      [
        1.2,
        -0.6
      ],
      [
        0.8,
        1.1
      ]
    ],
    "train_ids": [
      "train-0",
      "train-1",
      "train-2",
      "train-3",
      "train-4",
      "train-5"
    ],
    "feature_order": [
      "first",
      "second"
    ],
    "signed_coefficients": [
      0.0,
      -0.4485446937339855,
      -0.6496080151363256,
      0.65,
      0.3322245125671377,
      0.11592819630307906
    ],
    "bias": -0.36882128983777335,
    "tie_column": 1
  },
  "query_gram_shape": [
    3,
    6
  ],
  "scores": [
    -0.47908745810809783,
    -0.190114054567993,
    1.8897338352626591
  ],
  "ordinary_fit_status": 1,
  "ordinary_iterations": [
    100000
  ],
  "support_count": [
    2,
    3
  ],
  "wrong_column_scores": [
    -0.6054690684049484,
    -0.0640693712426007,
    -0.4060246223110818
  ],
  "wrong_named_columns_rejected": true,
  "callable_copy_scores": [
    -0.47908744417652055,
    -0.19011405373995985,
    1.8897338197984375
  ],
  "precomputed_scores": [
    -0.47908744417652055,
    -0.19011405373995985,
    1.8897338197984375
  ],
  "capped": {
    "fit_status": 1,
    "iterations": [
      1
    ],
    "warnings": [
      "Solver terminated early (max_iter=1).  Consider pre-processing your data with StandardScaler or MinMaxScaler."
    ]
  }
}
```



The program checks three-query predictions against ordinary `decision_function`, including a new precomputed-kernel fit. It then permutes rows, coefficients and identities together and checks invariance. Moving columns alone deliberately fails the agreement. The callable-kernel estimator receives its own copied training array because an estimator may keep a reference for later kernel evaluation; mutating someone else's original array must not redefine the saved predictor.

The primary ordinary fit also reaches its100,000-iteration cap: status1 is retained, and its score reconstruction is an inference agreement check rather than a convergence certificate. Its `max_iter=1` example records an additional explicit cap warning and status1. A capped fit may still return scores; that does not mean its optimization converged. The returned numeric state is for this binary linear route. The complete earlier four-class example retains the documented multiclass behavior; extending a binary formula to its packed coefficients requires a separate derivation.


Similar interfaces, different training contracts

| Estimator | Loss / intercept convention | Practical consequence |
| --- | --- | --- |
| SVC(kernel="linear") | C-SVC hinge; unpenalized intercept | Kernel/decomposition implementation, pairwise multiclass |
| LinearSVC (default loss) | Squared hinge; synthetic intercept feature is regularized | Different objective and solver; default one-versus-rest |
| SGDClassifier(loss="hinge") | Averaged hinge with declared regularization α | Iterative optimization; relate α to C using sample count and the exact objective |

**Practice 6.** A team scales all rows before cross-validation, then calibrates an SVC. Deployment has a different class mixture. Identify two separate problems and their remedies.

<details><summary>Hint</summary>

Separate leakage during fitting from a change in the population where probabilities are used.

</details>

<details><summary>Explained solution</summary>

First, validation folds influenced the shared scaler: put scaling inside every fitted pipeline, including calibration folds. Second, changed deployment populations can invalidate calibration and decision thresholds even after leakage is repaired. Evaluate and, where justified, recalibrate on representative data; do not claim that a leakage-free wrapper guarantees robustness to arbitrary shift.

</details>

## 9. Regression replaces the margin with a tolerance

The preceding sections predicted a class. We now change the target itself: each observed y is a number, so a sign decision no longer describes the task.

<!-- figure: D32; genuine x/y scatter at x−1/0/1,y−a/0/a and predictionlinew*x, verticalepsilon boundaries. Actualvertical residualarrows and excesssegments, no perpendicularfoot. Existinga1..3,epsilon0..2,C.05..4 fulldomains/currentstate and computedoptimum; axisextent includesalltube/points. -->

For a numerical target, being “on the correct side” makes no sense. Support vector regression, SVR, instead ignores vertical residuals within a chosen tolerance ε≥0. Outside the tube, it pays only for the excess. If a prediction is 10 and ε=2, targets from 8 through 12 have zero ε-insensitive loss. A target of 15 pays 3, not 5. The tube is not a confidence interval or a coverage guarantee.

\[
\begin{aligned}\ell_\epsilon(y,f)&=\max(0,|y-f|-\epsilon),\\P(w,b)&=\tfrac12\|w\|^2\\&\quad+C\sum_i\ell_\epsilon(y_i,f_i).\end{aligned}
\]

Consider x=−1,0,+1 and targets −a,0,+a with a≥0. Reflecting any fitted line and averaging it with its reflection preserves its slope, sets b=0 and cannot increase the convex objective, so an optimum with b=0 exists. Negative slopes are worse than zero, and slopes above a cost more than slope a without reducing loss. On 0≤w≤a, the objective is ½w²+2C max(0,a−w−ε), giving w*=min(2C,max(a−ε,0)). This special fixture makes the entire tube calculation visible.



Increase ε first: the region where error is free grows. Then change C: the optimizer may accept more excess in exchange for a smaller slope. The display expands its target axis from the actual permitted tube and observations, so a large tolerance does not silently clip the geometry.

A point above the tube asks the predictor to rise; a point below it asks the predictor to fall. We therefore need two nonnegative constraint prices per row, one for each direction. Their difference becomes the signed contribution to the predictor. Inside the tube neither direction requires a correction. This is the classification dual's price interpretation applied to two inequalities instead of one.

To derive the dual, introduce separate nonnegative slacks for yᵢ−fᵢ−ε and fᵢ−yᵢ−ε. Their multipliers are αᵢ and αᵢ*. Write the first margin expression as yᵢ−w·φᵢ−b−ε−ξᵢ and the second as w·φᵢ+b−yᵢ−ε−ξᵢ*. In the Lagrangian their weight coefficient is −Σ(αᵢ−αᵢ*)φᵢ. Completing its square gives w=Σ(αᵢ−αᵢ*)φᵢ. The unrestricted bias requires Σ(αᵢ−αᵢ*)=0. Each slack has coefficient C−its price−its nonnegativity multiplier, hence both prices lie in [0,C]. Substituting leaves the target-weighted linear term, two epsilon charges and the negative half squared feature norm:

\[
\begin{aligned}d_i&=\alpha_i-\alpha_i^*,\\D&=\sum_i y_i d_i\\&\quad-\epsilon\sum_i(\alpha_i+\alpha_i^*)\\&\quad-\frac12\sum_{i,j}d_i d_j K_{ij},\\0\le\alpha_i,\alpha_i^*&\le C,\\\sum_i d_i&=0,\\f(x)&=\sum_i d_i k(x_i,x)+b.\end{aligned}
\]

A point strictly inside the tube has both multipliers zero. On the tube, a multiplier can be zero, free or bounded; outside it, the relevant multiplier reaches C. For a free αᵢ, b=yᵢ−ε−ΣdⱼKⱼᵢ; for a free αᵢ*, b=yᵢ+ε−ΣdⱼKⱼᵢ. When ε=0 or data are duplicated, coefficient representations may be degenerate. An exact edge of the tube does not force a nonzero coefficient.

If targets are divided by ten, how must C and epsilon change for the predictions to agree after converting back?

**regression-tube-units.py**

```python
import numpy as np
from sklearn.svm import SVR

x = np.array([[-1.], [0.], [1.]])
y = np.array([-2., 0., 2.])
epsilon, c = .5, .5
slope = min(2*c, max(2-epsilon, 0))
excess = np.maximum(0, np.abs(y - slope*x[:,0])-epsilon)
print(f'slope={slope:.1f}; excess={excess.tolist()}; objective={.5*slope*slope+c*excess.sum():.2f}')
raw = SVR(kernel='linear', C=c, epsilon=epsilon, tol=1e-10).fit(x, y)
scale = 10.
converted = SVR(kernel='linear', C=c/scale, epsilon=epsilon/scale, tol=1e-10).fit(x, y/scale)
print('original predictions:', raw.predict(x).round(6).tolist())
print('converted back:', (scale*converted.predict(x)).round(6).tolist())
print('signed dual coefficients:', raw.dual_coef_.round(6).tolist())
```

Recorded output from the earlier execution:

```text
slope=1.0; excess=[0.5, 0.0, 0.5]; objective=1.00
original predictions: [-1.0, 0.0, 1.0]
converted back: [-1.0, 0.0, 1.0]
signed dual coefficients: [[-0.5, 0.5]]
```

### The unit of the target changes the objective

<!-- figure: D34; originalnumeric y/f/eps/w/b/C cells -> shiftbyoffset then dividepositive s -> transformedcells and inversetargetqueryoutput. Offset onlyy/f/b, noteps/C/w. Pairtubecanvas verticaloriginal/transformedunits labelled. s10 concrete C/10,eps/10; dynamicpositive scale retained, reportnonfiniteoverflowinsteadzero/silentcoercion. -->

Suppose y'=(y−μ)/s with s>0. To preserve the same predictor after converting back, set w'=w/s, b'=(b−μ)/s, ε'=ε/s and C'=C/s. The transformed loss is the old loss divided by s and the transformed squared norm is divided by s²; these parameter changes therefore multiply the whole objective by 1/s². Keeping C numerically unchanged instead selects a different tradeoff.

What is the epsilon tolerance in original target units, and how does held-out error compare with predicting the training mean?

**heldout-regression.py**

```python
from sklearn.compose import TransformedTargetRegressor
from sklearn.datasets import make_regression
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

x, y = make_regression(n_samples=200, n_features=5, noise=5, random_state=42)
xt, xe, yt, ye = train_test_split(x, y, test_size=.3, random_state=13)
model = TransformedTargetRegressor(
    regressor=make_pipeline(StandardScaler(), SVR(C=10, epsilon=.1, gamma='scale')),
    transformer=StandardScaler()).fit(xt, yt)
baseline = DummyRegressor(strategy='mean').fit(xt, yt)
for name, predictor in [('mean baseline', baseline), ('SVR', model)]:
    prediction = predictor.predict(xe)
    print(f'{name}: MAE={mean_absolute_error(ye,prediction):.3f} RMSE={root_mean_squared_error(ye,prediction):.3f}')
target_scale = model.transformer_.scale_[0]
print(f'training target SD={target_scale:.3f}; epsilon in original units={.1*target_scale:.3f}')
print('support rows:', len(model.regressor_.named_steps['svr'].support_))
```

Recorded output from the earlier execution:

```text
mean baseline: MAE=68.852 RMSE=96.146
SVR: MAE=18.859 RMSE=33.531
training target SD=95.917; epsilon in original units=9.592
support rows: 59
```

The regression pipeline estimates both feature scaling and target scaling on its training set. Its chosen ε=0.1 in standardized target units is about 9.592 original units in this run, because the training target standard deviation is about 95.917. The held-out MAE is 18.859 versus a training-mean baseline of 68.852. The standardized C=10 describes its declared new objective; it is not an equivalent re-expression of the older raw-target C=10 fit. The example demonstrates a complete unit-aware workflow, not a causal claim that scaling alone explains all performance differences.

### Pull the epsilon loss back through the prediction

The tube's two directions also determine a scratch gradient. Define rᵢ=yᵢ−fᵢ. Outside the tube, increasing f reduces the loss by sign(rᵢ); inside it the loss is locally zero. At a boundary a whole interval of subgradients is allowed; this program selects zero. <!-- figure: D33; direct-labelled residual-axis epsilonlossdeadzone with branchesmax(0,|r|−eps), r=y−f. Targetabove/belowtube uses separatepricearrows and signedfeaturemultiplications; pricealpha/alpha* schema only afterparagraphintroduces. Underlyingordinaryderivatives f−1 or+1, atboundaries validset includingzero. -->

For the objective λ‖w‖²/2+CΣℓε, the selected pullback is

\[
\begin{aligned}g_w&=\lambda w-C\sum_{|r_i|>\epsilon}\operatorname{sign}(r_i)x_i,\\
g_b&=-C\sum_{|r_i|>\epsilon}\operatorname{sign}(r_i).
\end{aligned}
\]

Compute both from the same old weights and bias before taking the atomic step. This is an approximate primal optimizer with a diminishing rate, finite cap and best-objective snapshot. It does not claim to reproduce LIBSVM's dual trajectory. Its ordinary linear SVR comparison instead reconstructs the library's query scores from signed dual coefficients and support rows.

For this new four-row fixture, the old predictions are approximately [−.270,.135,.665,.281] and residuals [−.130,.465,.635,−.081]. Only the two middle rows exceed ε=.2. Their signed feature sum is [2,.5], so g_w=[.35,−.12]−.7[2,.5]=[−1.05,−.47] and g_b=−.7·2=−1.4. At η=.02, the atomic result is w'=[.371,−.1106], b'=.108, reducing the objective .55845 to .49304668.

**epsilon-primal.py**

```python
"""Vertical epsilon loss, atomic primal steps and consistent target units."""
import json
import numpy as np
import sklearn
from sklearn.svm import SVR


def objective_pullback(x, y, w, b, c=.7, epsilon=.2, regularization=1.):
    x, y, w = np.asarray(x, float), np.asarray(y, float), np.asarray(w, float)
    if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 2..100 observations and 1..20 features.')
    if y.shape != (len(x),) or w.shape != (x.shape[1],):
        raise ValueError('Target and weight dimensions must match the data.')
    if not all(np.isfinite(v).all() for v in (x, y, w)) or not np.isfinite(b):
        raise ValueError('Inputs and state must be finite.')
    if max(np.max(np.abs(x)), np.max(np.abs(y))) > 1000:
        raise ValueError('Feature/target magnitudes must be at most 1000.')
    if not np.isfinite([c, epsilon, regularization]).all() or not (.001 <= c <= 100 and 0 <= epsilon <= 100 and 0 <= regularization <= 100):
        raise ValueError('Use C in [.001,100], epsilon/lambda in [0,100].')
    prediction = x @ w + b
    residual = y - prediction
    excess = np.maximum(0., np.abs(residual) - epsilon)
    # Choose zero at either loss boundary, including residual zero when eps=0.
    signed = np.sign(residual) * (np.abs(residual) > epsilon)
    gw = regularization * w - c * (x.T @ signed)
    gb = -c * float(signed.sum())
    value = regularization * float(w @ w) / 2 + c * float(excess.sum())
    return value, gw, gb, prediction, residual, excess


def atomic_step(x, y, w, b, c=.7, epsilon=.2, regularization=1., eta=.02):
    if not np.isfinite(eta) or not 0 < eta <= 1:
        raise ValueError('Eta must be finite in (0,1].')
    value, gw, gb, prediction, residual, excess = objective_pullback(
        x, y, w, b, c, epsilon, regularization)
    return np.asarray(w) - eta * gw, b - eta * gb, {
        'objective': value, 'gradient_w': gw.tolist(), 'gradient_b': gb,
        'prediction': prediction.tolist(), 'residual': residual.tolist(), 'excess': excess.tolist()}


def optimize(x, y, c=.7, epsilon=.2, eta=.02, steps=4000, regularization=1.):
    if not isinstance(steps, int) or not 1 <= steps <= 10000:
        raise ValueError('Use 1..10000 iterations.')
    x = np.asarray(x, float)
    w, b = np.zeros(x.shape[1]), 0.
    best_value = objective_pullback(x, y, w, b, c, epsilon, regularization)[0]
    best_w, best_b = w.copy(), b
    status = 'iteration cap'
    for step in range(1, steps + 1):
        with np.errstate(over='ignore', invalid='ignore'):
            new_w, new_b, details = atomic_step(x, y, w, b, c, epsilon, regularization,
                                               eta / np.sqrt(step))
            if not np.isfinite(new_w).all() or not np.isfinite(new_b):
                status = 'numerical limit'
                break
            value = objective_pullback(x, y, new_w, new_b, c, epsilon, regularization)[0]
            if not np.isfinite(value):
                status = 'numerical limit'
                break
        w, b = new_w, float(new_b)
        if value < best_value:
            best_value, best_w, best_b = value, w.copy(), b
        if np.linalg.norm(np.r_[details['gradient_w'], details['gradient_b']]) <= 1e-10:
            status = 'selected subgradient stationary'
            break
    return {'w': best_w.tolist(), 'b': best_b, 'objective': best_value,
            'steps': step, 'status': status}


def convert_units(y, w, b, c, epsilon, offset, scale):
    if not np.isfinite([offset, scale]).all() or scale <= 0:
        raise ValueError('Target offset must be finite and scale strictly positive.')
    y, w = np.asarray(y, float), np.asarray(w, float)
    if not all(np.isfinite(v).all() for v in (y, w, b, c, epsilon)) or c <= 0 or epsilon < 0:
        raise ValueError('Use finite state, a positive C and nonnegative epsilon.')
    with np.errstate(over='ignore', invalid='ignore', divide='ignore'):
        converted = ((y - offset) / scale, w / scale, (b - offset) / scale,
                     c / scale, epsilon / scale)
    underflow = (converted[3] <= 0 or (epsilon > 0 and converted[4] == 0)
                 or np.any((w != 0) & (converted[1] == 0)))
    if underflow or not all(np.isfinite(v).all() for v in converted):
        raise ArithmeticError('Unit conversion exceeded finite arithmetic; keep the old state.')
    return converted


def main():
    x = np.array([[-1., 0.], [.5, 1.], [1.5, -.5], [.3, -.8]])
    y = np.array([-.4, .6, 1.3, .2])
    w, b = np.array([.35, -.12]), .08
    c, epsilon = .7, .2
    new_w, new_b, details = atomic_step(x, y, w, b, c, epsilon)
    fitted = SVR(kernel='linear', C=c, epsilon=epsilon, tol=1e-9).fit(x, y)
    q = np.array([[-.3, .9], [1.1, -.7], [.6, .2]])
    reconstructed = q @ fitted.support_vectors_.T @ fitted.dual_coef_[0] + fitted.intercept_[0]
    np.testing.assert_allclose(reconstructed, fitted.predict(q), atol=1e-12, rtol=1e-12)
    offset, scale = -.3, 10.
    scaled_y, scaled_w, scaled_b, scaled_c, scaled_epsilon = convert_units(y, w, b, c, epsilon, offset, scale)
    original_objective = objective_pullback(x, y, w, b, c, epsilon)[0]
    scaled_objective = objective_pullback(x, scaled_y, scaled_w, scaled_b, scaled_c, scaled_epsilon)[0]
    np.testing.assert_allclose(scaled_objective, original_objective / scale ** 2, atol=1e-12, rtol=1e-12)
    scaled_fit = SVR(kernel='linear', C=scaled_c, epsilon=scaled_epsilon, tol=1e-10).fit(x, scaled_y)
    restored_predictions = offset + scale * scaled_fit.predict(q)
    np.testing.assert_allclose(restored_predictions, fitted.predict(q), atol=1e-6, rtol=1e-6)
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'inputs': {'x': x.tolist(), 'y': y.tolist(), 'C': c, 'epsilon': epsilon},
              'before': details, 'after': {'w': new_w.tolist(), 'b': new_b,
                                          'objective': objective_pullback(x, y, new_w, new_b, c, epsilon)[0]},
              'scratch': optimize(x, y, c, epsilon),
              'library': {'queries': q.tolist(), 'predictions': fitted.predict(q).tolist(),
                          'signed_coefficients': fitted.dual_coef_[0].tolist(),
                          'intercept': float(fitted.intercept_[0]), 'fit_status': int(fitted.fit_status_),
                          'iterations': int(fitted.n_iter_)},
              'unit_conversion': {'offset': offset, 'scale': scale, 'C_new': scaled_c,
                                  'epsilon_new': scaled_epsilon, 'objective_before': original_objective,
                                  'objective_scaled': scaled_objective,
                                  'restored_predictions': restored_predictions.tolist()}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
```

Recorded output for the complete example above:

```text
{
  "versions": {
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "inputs": {
    "x": [
      [
        -1.0,
        0.0
      ],
      [
        0.5,
        1.0
      ],
      [
        1.5,
        -0.5
      ],
      [
        0.3,
        -0.8
      ]
    ],
    "y": [
      -0.4,
      0.6,
      1.3,
      0.2
    ],
    "C": 0.7,
    "epsilon": 0.2
  },
  "before": {
    "objective": 0.55845,
    "gradient_w": [
      -1.0499999999999998,
      -0.47
    ],
    "gradient_b": -1.4,
    "prediction": [
      -0.26999999999999996,
      0.135,
      0.6649999999999999,
      0.28099999999999997
    ],
    "residual": [
      -0.13000000000000006,
      0.46499999999999997,
      0.6350000000000001,
      -0.08099999999999996
    ],
    "excess": [
      0.0,
      0.26499999999999996,
      0.4350000000000001,
      0.0
    ]
  },
  "after": {
    "w": [
      0.371,
      -0.11059999999999999
    ],
    "b": 0.108,
    "objective": 0.4930466799999999
  },
  "scratch": {
    "w": [
      0.5561928276016418,
      0.10853395709835734
    ],
    "b": 0.31997685102367635,
    "objective": 0.16057093448343482,
    "steps": 4000,
    "status": "iteration cap"
  },
  "library": {
    "queries": [
      [
        -0.3,
        0.9
      ],
      [
        1.1,
        -0.7
      ],
      [
        0.6,
        0.2
      ]
    ],
    "predictions": [
      0.30392156464922493,
      0.8529411827587524,
      0.7019607877786322
    ],
    "signed_coefficients": [
      0.4575163484246063,
      -0.4575163484246063
    ],
    "intercept": 0.3450980360074394,
    "fit_status": 0,
    "iterations": 2
  },
  "unit_conversion": {
    "offset": -0.3,
    "scale": 10.0,
    "C_new": 0.06999999999999999,
    "epsilon_new": 0.02,
    "objective_before": 0.55845,
    "objective_scaled": 0.005584499999999999,
    "restored_predictions": [
      0.3039215646492251,
      0.8529411827587527,
      0.7019607877786325
    ]
  }
}
```



The scratch4000-step run stops at its **iteration cap**, retaining objective .16057093448343482; the ordinary linear SVR reports status0 after2 iterations. The scratch best state and library's dual state are not asserted identical.

The newly executed program also divides targets and the matching parameters by10 and restores the ordinary predictions to their original units. The algebraic unit identity applies to any positive finite scale while finite arithmetic permits it. The scratch optimizer has a separately declared tuning/data box; a transformed C outside [.001,100] or a transformed target outside magnitude1000 is not silently clipped into that box. The conversion still defines the mathematical corresponding problem, which a different numerical configuration may be needed to solve.

A constant target can be represented by zero weights and its constant bias with zero loss. At ε=0 the loss becomes absolute residual; a zero residual selects zero from its valid subgradient set. Neither case justifies dividing by a zero target standard deviation. For a changed example, move one target outside its old tube, inspect the sign of its contribution, and compare the scratch status rather than insist on identical final weights.

### Choose which residual behavior the task needs

Epsilon loss deliberately treats every residual inside its tube equally. If small errors should still influence fitting, a **Huber** loss changes the near-zero behavior: it uses r²/2 for |r|≤δ and δ(|r|−δ/2) outside. At r=.1 with ε=.2, tube loss is0; Huber with δ=.2 pays.005. The large-error slope is bounded, while the small-error branch stays smooth. This changes the objective rather than smooths an optimizer for the identical tube problem.

If underprediction and overprediction have different costs, **quantile**, or pinball, loss uses τr for r≥0 and (τ−1)r for r<0, with0<τ<1. At τ=.8, residual+1 pays.8 and residual−1 pays.2. Its asymmetric prices seek a conditional quantile under suitable population assumptions; they do not give an epsilon-tube coverage guarantee.

The current [LinearSVR API](https://scikit-learn.org/stable/modules/generated/sklearn.svm.LinearSVR.html) offers epsilon-insensitive or squared epsilon-insensitive loss using LIBLINEAR. Its fitted intercept is a regularized synthetic feature, unlike the unpenalized intercept in our SVR derivation. Its default epsilon is0. For a deliberate alternative to the full regression program, choose the loss, epsilon, intercept scaling and cap explicitly, then compare original-unit held-out metrics. Identical C numbers alone do not establish identical objectives or fits.

**Practice 7.** Targets are divided by four. The original SVR uses ε=2 and C=6. Which transformed parameters preserve the same objective up to a positive factor?

<details><summary>Hint</summary>

Both the error tolerance and the tradeoff coefficient carry the target rescaling.

</details>

<details><summary>Explained solution</summary>

Use ε'=0.5 and C'=1.5. Scale weights and bias by one quarter, then multiply predictions by four to return to the original units. Changing ε alone does not compensate for the different scaling of squared weight size and absolute excess loss.

</details>

## 10. Structured features and the cost of a kernel

### A sequence kernel with an inspectable meaning

A kernel need not start with a fixed-length numeric measurement vector. Count the overlapping pieces of length k in a sequence, assigning one coordinate to each possible piece. The dot product between two count vectors is a valid kernel: sequences are similar when they share many of the same local pieces. This is the spectrum-kernel idea, used in the original research for protein-sequence classification.

<!-- figure: D35; actualACACA overlappingtwo-characterwindowsAC/CA/AC/CA connectedtonamedAA/AC/CA/CC bins and counts[0,2,2,0]; CACAC[0,2,2,0],AACCA[1,1,1,1]. Querystringwindows and countcoordinateidentity colours persist evenwhenwindowpositionsmove. Selectedwindow outline separately; two arbitraryA/C<=12 strings in adjacent2controlquestion, k1..3 in separate1controlquestion. -->

For ACACA at k=2, the overlapping windows start at positions0,1,2,3: AC,CA,AC,CA. In coordinate order [AA,AC,CA,CC], the vector is [0,2,2,0]. The count coordinates describe the pieces themselves, not their original positions; the same AC coordinate collects both AC windows. AACCA instead gives [1,1,1,1]. Their dot product is0·1+2·1+2·1+0·1=4.

Can two different sequences become indistinguishable after counting their two-character pieces?

**sequence-kernel.py**

```python
from collections import Counter
import numpy as np


def counts(sequence, size=2):
    return Counter(sequence[index:index+size] for index in range(len(sequence)-size+1))


def kernel(left, right):
    a, b = counts(left), counts(right)
    return sum(value * b[word] for word, value in a.items())


if __name__ == '__main__':
    strings = ['ACACA', 'CACAC', 'AACCA']
    vocabulary = sorted(set().union(*(counts(word) for word in strings)))
    features = np.array([[counts(word)[piece] for piece in vocabulary] for word in strings])
    gram = np.array([[kernel(a,b) for b in strings] for a in strings])
    print('coordinates:', vocabulary)
    print('features:', features.tolist())
    print('Gram:', gram.tolist())
    print('dot products agree:', bool(np.array_equal(gram, features @ features.T)))
    print('Different positions can have the same two-mer counts:', bool(np.array_equal(features[0],features[1])))
```

Recorded output from the earlier execution:

```text
coordinates: ['AA', 'AC', 'CA', 'CC']
features: [[0, 2, 2, 0], [0, 2, 2, 0], [1, 1, 1, 1]]
Gram: [[8, 8, 4], [8, 8, 4], [4, 4, 4]]
dot products agree: True
Different positions can have the same two-mer counts: True
```

With two-character pieces, ACACA and CACAC both contain two AC pieces and two CA pieces. Their representations are identical despite different order and endpoints. No classifier using only this representation can distinguish them. Raising C or choosing a more accurate optimizer cannot recover information discarded by the features. Increasing k, adding position information or changing the representation is a different modeling decision that needs validation.

Normalized similarity k(x,z)/√(k(x,x)k(z,z)) is another valid feature inner product for nonzero feature vectors. A sequence shorter than k has a zero count vector and needs an explicit policy; division by zero is not a normalization convention. Our small program uses raw counts and a declared alphabet. It demonstrates the mechanism without claiming biological performance.

### When explicit finite features are useful

<!-- figure: D36; labelledn×nfloat64Gram storage, boundedcache separatedfromfullmatrix; selectedsupportrow subset and actualquerykerneldots, scalarcountnSV and featuredimensiond. Separatecollapsedlinearweight route aftertraining. Markbytes8n²=800000000 atn10000; operationworklabelsno inventedtiming. -->

A dense float64 Gram matrix has 8n² bytes before overhead: n=10,000 already means 800 million bytes. That describes a full matrix, not an unavoidable allocation by every SVM library. LIBSVM's cache trades recomputation against memory. At inference, a general kernel predictor evaluates the kernel against its saved support points; a linear predictor can collapse them into one weight vector. Neither an arbitrary sample-count cutoff nor a fixed speedup is universal.

Costs depend on the representation and implementation

| Method | Typical relevant work | What the bound leaves visible |
| --- | --- | --- |
| This exhaustive pair solver | O(n²d + Tn²); O(n²+nd) memory | Full dense Gram and T all-pair steps |
| Saved kernel prediction | O(nSV × cost of one kernel) | Support count and feature dimension matter |
| Collapsed linear prediction | O(d) | A kernel expansion is unnecessary |
| SGD over D explicit features | O(nD) per dense epoch | Constructing those D features has its own cost |

Until now the model has compared a query with saved training observations. A finite feature approximation changes where that work happens: transform every observation into a fixed list of coordinates, then use a linear learner on those coordinates. One route chooses random oscillating measurements; another uses similarities to selected training landmarks. Both approximate a desired kernel, but they obtain their coordinates differently.

<!-- figure: D37; manuallychosenomega columns(1,0)/(0,1),phases0/pi/2, selectedx(.5,−.25), dotproducts.5/−.25 -> phaseadd -> cos -> sqrt(2/2)=1 -> featurecells[cos.5,sin.25]. Mark handfrequenciesillustrative, not seededGaussian draw. Separateactualseed17/gamma.45/m12 storedstate arithmeticfromkernel-feature-mechanisms-execution; featureidentityj acrossprojection/phase/output, query vs training row identity persists. DirectexpectedRBF label vs finiteapproximationdifference. -->

With two illustrative frequencies (1,0),(0,1) and phases0,π/2, the input (.5,−.25) produces cos(.5) and cos(−.25+π/2)=sin(.25), approximately [.877583,.247404]. Those hand-picked frequencies make the operations visible; they are not a random RBF sample. The distribution below determines which kernel the average construction approximates.

**Random Fourier features** approximate the RBF kernel explicitly. Draw ω from a zero-mean Gaussian with covariance 2γI and a phase b uniformly from [0,2π]. Use D coordinates √(2/D) cos(ωⱼ·x+bⱼ). The identity2cos(a+b)cos(c+b)=cos(a−c)+cos(a+c+2b) explains the phase step: a uniform full-period phase makes the second term's average zero. The remaining term is cos(ω·(x−z)). A Gaussian frequency with covariance2γI has characteristic function exp(−½(x−z)ᵀ2γI(x−z))=e⁻ᵞ‖ˣ⁻ᶻ‖². Summing D independent coordinates with scale√(2/D) therefore gives that kernel in expectation. The finite sum still fluctuates around it.

Every realized finite feature map gives a positive semidefinite Gram matrix, but a finite draw is only an approximation to the desired kernel. The expectation identity is not a guarantee that one seed improves accuracy. Constructing D dense features costs O(ndD) straightforwardly; a subsequent dense linear training epoch costs O(nD). Storage can be batched, but the construction cost does not disappear.

For the landmark route, imagine describing a location by its distances to a few known stations. Here the coordinates are similarities to selected training rows. Those reference rows can be redundant, so their own similarity matrix tells us how to rescale and combine the raw coordinates without counting the same direction repeatedly. First work the redundant case by hand using the matrix operation from §5.

<!-- figure: D38; hand duplicate-landmark circuit first, then actualtraininglandmark IDs from newexecutedindices[4,1,0] and full W3×3 route. Duplicateidentityrows0/1 at(.6,−.4) name BOTH W axes and B columns, W[[1,1],[1,1]]. Actual matrix-row products give Wuplus=2uplus for uplus=(1,1)/sqrt2 and Wuminus=0 for uminus=(1,−1)/sqrt2; show lengths1 and orthogonal dot0 beside direction arrows in coefficient space. Selected similarityrow B=(k,k) has matching two products -> sum sqrt2*k in common lane and0 in difference lane. Retain eigenvalue2 above cutoff2e−12, multiply common projection by1/sqrt2 -> coordinate k; discarded zero lane explicitly has no1/sqrt0 operation. Concrete rows k1 and k=exp(−.45*2.05)=.39752398781664455 trace the saved duplicate featurecells1/1/.39752398781664455; their dot example1*k returns k. Separate full training/query B rectangularrows -> stored retained basisU_r -> projectedcells -> inversepositive-root factors -> rfeaturecells, with shapes and persistent row/landmark/direction identity. Selected direction distinctoutline; arbitrary data/query/landmark/gamma/rank-cutoff domains remain from contracts. Stack hand matrix/direction/projection/scaling panels at phone/enlarged widths with readable labels and accessible numeric tables; pan full W/B locally without shrinking operands into a thumbnail. -->

Choose the two distinct training identities0 and1 at the same landmark position `(.6,−.4)`, as in the saved duplicate example below. Each RBF self-similarity is1 and the cross-similarity is also1, so their landmark Gram is `W=[[1,1],[1,1]]`. Two unit-length directions make its action explicit:

\[
u_+=\frac1{\sqrt2}\begin{pmatrix}1\\1\end{pmatrix},\quad
u_-=\frac1{\sqrt2}\begin{pmatrix}1\\-1\end{pmatrix},\qquad
Wu_+=2u_+,\quad Wu_-=0.
\]

Each vector has squared length `(1²+1²)/2=1`, and their dot product is `(1−1)/2=0`: they provide perpendicular coefficient directions. The common direction represents the repeated reference; the difference direction cancels. Only one independent direction has a positive eigenvalue, so the retained **rank** is1. With the program's relative cutoff1e−12, the threshold is `1e−12*max(1,2)=2e−12`: eigenvalue2 is retained and0 is discarded.

Any new row has the same similarity k to both copies, giving raw row `B=(k,k)`. Projecting it onto the unit directions gives `B u+=(k+k)/sqrt2=sqrt2*k` and `B u−=(k−k)/sqrt2=0`. Divide the retained common coordinate by the square root of its eigenvalue2: `(sqrt2*k)/sqrt2=k`. This inverse-root step prevents the two copies from counting as two independent references. We discard the zero direction rather than divide by its square root; `1/sqrt0` is undefined.

At either landmark, k=1, so the feature is1. For the saved third row `(-.7,.2)`, squared distance to the landmark is `(-1.3)²+.6²=2.05`. At γ=.45 its feature is `k=exp(−.45*2.05)≈.397523987817`, agreeing with the saved output. Its feature dot product with the landmark is `k*1=k`. If a changed query has similarity k=.3 to both copies, the same projection/scaling gives the feature.3; two such query coordinates have dot product.09. These are actual hand operations before the general notation, not new fitted experiments.

**Nyström features** generalize that construction to m selected training landmarks Z. For n input rows with d measurements, `B=K(X,Z)` is n×m and `W=K(Z,Z)` is m×m. An **orthonormal eigenbasis** of the symmetric W means unit-length, mutually perpendicular eigenvectors; the duplicate vectors above are its two-column example. Retain r directions with positive eigenvalues above the chosen cutoff. `Uᵣ` is the m×r matrix whose columns are those retained directions, and `Λᵣ` is the r×r diagonal matrix of their eigenvalues. Its inverse square root has diagonal entries `1/sqrt(λ_j)`. First `B Uᵣ` projects each similarity row onto the r directions; then multiplication by `Λᵣ⁻¹ᐟ²` rescales each projected coordinate. The n×r feature matrix and its n×n Gram are

\[
F=B U_r\Lambda_r^{-1/2},\qquad
FF^\top=B U_r\Lambda_r^{-1}U_r^\top B^\top.
\]

The **pseudoinverse convention** here inverts only retained positive eigenvalues and gives discarded directions zero weight; zero eigenvalues are not inverted. Very small positive eigenvalues require numerical care or truncation. Fit landmark selection inside the training boundary. Dense construction involves kernel work O(nmd), projection O(nmr), and an O(m³) landmark eigendecomposition, followed by training on r features.

Does a smaller Gram approximation error necessarily imply a better held-out classification result in this one run?

**kernel-approximations.py**

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.kernel_approximation import Nystroem, RBFSampler
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

x, y = make_classification(n_samples=300, n_features=10, n_informative=6,
                           n_redundant=2, random_state=8)
xt, xe, yt, ye = train_test_split(x, y, test_size=.3, stratify=y, random_state=9)
scaler = StandardScaler().fit(xt)
xt, xe = scaler.transform(xt), scaler.transform(xe)
exact_gram = rbf_kernel(xe, xt, gamma=.1)
exact = SVC(C=1, gamma=.1, tol=1e-8).fit(xt, yt)
print(f'exact RBF held-out accuracy={exact.score(xe,ye):.3f}')
for name, features in [('random features', RBFSampler(gamma=.1, n_components=60, random_state=7)),
                       ('Nystrom', Nystroem(gamma=.1, n_components=60, random_state=7))]:
    zt = features.fit_transform(xt)  # Landmark selection sees training observations only.
    ze = features.transform(xe)
    # A linear-kernel SVC keeps the same hinge/intercept convention for this small comparison.
    model = SVC(kernel='linear', C=1, tol=1e-8).fit(zt, yt)
    error = np.sqrt(np.mean((ze @ zt.T - exact_gram) ** 2))
    print(f'{name}: shape={zt.shape}, Gram RMSE={error:.4f}, held-out accuracy={model.score(ze,ye):.3f}')
print('This is a finite approximation comparison, not a training-speed benchmark.')
```

Recorded output from the earlier execution:

```text
exact RBF held-out accuracy=0.967
random features: shape=(210, 60), Gram RMSE=0.1271, held-out accuracy=0.889
Nystrom: shape=(210, 60), Gram RMSE=0.0235, held-out accuracy=0.956
This is a finite approximation comparison, not a training-speed benchmark.
```

The program uses 60 explicit features or landmarks and compares their Gram errors and held-out classifications with a fixed exact RBF model. It deliberately uses linear-kernel SVC on these small transformed datasets so the loss and intercept conventions remain comparable. It is not a speed benchmark. Using LinearSVC or SGD for a large problem is useful, but then declare their objective and stopping differences instead of attributing every change solely to the approximation. [Randomized Linear Algebra](/learn/path/full-curriculum/randomized-linear-algebra) develops approximation error and low-rank structure further.

### Build and inspect both approximations

The next complete program constructs spectrum counts, RFF and rank-aware Nyström features. Its RFF random-number generator and draw order deliberately match the inspected `RBFSampler` implementation: draw the full normal frequency matrix, then uniform phases. Without those details, comparing coordinates elementwise would test different random states. The program checks both training and a new rectangular query batch against the ordinary transform.

Nyström eigenvectors may differ by signs or rotations inside a repeated eigenspace, so the meaningful comparisons are realized training Gram and query-to-training cross-Gram, not raw coordinates. The scratch code retains eigenvalues above `relative_cutoff * max(1,largest_eigenvalue)` and rejects materially negative ones. The ordinary library's SVD floor is a separate convention; the nonsingular comparison agrees, while the deliberate duplicate case teaches the scratch rank convention.

**kernel-feature-mechanisms.py**

```python
"""Spectrum counts, random Fourier coordinates and rank-aware landmarks."""
from itertools import product
import json
import numpy as np
import sklearn
from sklearn.kernel_approximation import RBFSampler, Nystroem


def spectrum(sequence, k=2):
    if not isinstance(sequence, str) or len(sequence) > 12 or set(sequence) - set('AC'):
        raise ValueError('Use an A/C string of length 0..12.')
    if not isinstance(k, int) or not 1 <= k <= 3:
        raise ValueError('Use k in {1,2,3}.')
    words = [''.join(row) for row in product('AC', repeat=k)]
    addresses = {word: j for j, word in enumerate(words)}
    counts = np.zeros(len(words), dtype=float)
    for start in range(max(0, len(sequence) - k + 1)):
        counts[addresses[sequence[start:start + k]]] += 1
    return words, counts


def matrix(x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or not (1 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 1..100 finite rows and 1..20 features.')
    if not np.isfinite(x).all() or np.max(np.abs(x)) > 1000:
        raise ValueError('Feature magnitudes must be finite and at most 1000.')
    return x


def rbf(left, right, gamma):
    left, right = matrix(left), matrix(right)
    if left.shape[1] != right.shape[1] or not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
        raise ValueError('Match features and use gamma in [1e-4,10].')
    output = np.empty((len(left), len(right)))
    for start in range(0, len(left), 16):
        differences = left[start:start + 16, None, :] - right[None, :, :]
        output[start:start + 16] = np.exp(-gamma * np.einsum('bnd,bnd->bn', differences, differences))
    return output


def rff_state(n_features, components=12, gamma=.45, seed=17):
    if not isinstance(n_features, int) or not 1 <= n_features <= 20:
        raise ValueError('Use 1..20 features.')
    if not isinstance(components, int) or not 1 <= components <= 100:
        raise ValueError('Use 1..100 components.')
    if not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
        raise ValueError('Gamma must be in [1e-4,10].')
    # RandomState/order deliberately match the inspected sklearn implementation.
    rng = np.random.RandomState(seed)
    omega = np.sqrt(2 * gamma) * rng.normal(size=(n_features, components))
    phase = rng.uniform(0., 2 * np.pi, size=components)
    return {'omega': omega, 'phase': phase, 'gamma': gamma, 'seed': seed}


def rff_transform(x, state):
    x = matrix(x)
    omega, phase = state['omega'], state['phase']
    if x.shape[1] != omega.shape[0] or phase.shape != (omega.shape[1],):
        raise ValueError('Projection state must match the input channels/components.')
    return np.sqrt(2 / omega.shape[1]) * np.cos(x @ omega + phase)


def nystrom_state(training, landmark_indices, gamma=.45, relative_cutoff=1e-12):
    training = matrix(training)
    indices = np.asarray(landmark_indices)
    if indices.ndim != 1 or not 1 <= len(indices) <= len(training) or indices.dtype.kind not in 'iu':
        raise ValueError('Supply 1..n valid integer training landmark indices.')
    if len(set(indices.tolist())) != len(indices) or np.min(indices) < 0 or np.max(indices) >= len(training):
        raise ValueError('Landmark indices must be unique training addresses.')
    if not np.isfinite(relative_cutoff) or not 0 < relative_cutoff < 1:
        raise ValueError('Use a finite relative cutoff in (0,1).')
    landmarks = training[indices].copy()
    w = rbf(landmarks, landmarks, gamma)
    eigenvalues, eigenvectors = np.linalg.eigh(w)
    cutoff = relative_cutoff * max(1., float(np.max(eigenvalues)))
    if np.min(eigenvalues) < -cutoff:
        raise ArithmeticError('Materially negative landmark eigenvalue.')
    keep = eigenvalues > cutoff
    return {'landmarks': landmarks, 'indices': indices.copy(), 'gamma': gamma,
            'basis': eigenvectors[:, keep].copy(), 'eigenvalues': eigenvalues[keep].copy(),
            'cutoff': cutoff, 'all_eigenvalues': eigenvalues.copy()}


def nystrom_transform(x, state):
    b = rbf(x, state['landmarks'], state['gamma'])
    return (b @ state['basis']) / np.sqrt(state['eigenvalues'])


def main():
    strings = ['CAACAC', 'ACCAAA', '']
    coordinates = [spectrum(text, 2)[1] for text in strings]
    x = np.array([[-.9, .4], [.2, -.6], [.8, .5], [-.3, 1.1], [1.2, -.2]])
    queries = np.array([[.15, .35], [-.6, -.1], [1.4, .8]])
    state = rff_state(2)
    z = rff_transform(x, state)
    ordinary_rff = RBFSampler(gamma=.45, n_components=12, random_state=17).fit(x)
    np.testing.assert_allclose(z, ordinary_rff.transform(x), atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(rff_transform(queries, state), ordinary_rff.transform(queries), atol=1e-12, rtol=1e-12)
    ordinary_landmarks = Nystroem(kernel='rbf', gamma=.45, n_components=3, random_state=23).fit(x)
    landmarks = nystrom_state(x, ordinary_landmarks.component_indices_)
    features = nystrom_transform(x, landmarks)
    library_features = ordinary_landmarks.transform(x)
    # Eigenvector signs/rotations can differ; compare the realized dot matrix.
    np.testing.assert_allclose(features @ features.T, library_features @ library_features.T,
                               atol=1e-10, rtol=1e-10)
    query_features = nystrom_transform(queries, landmarks)
    np.testing.assert_allclose(query_features @ features.T,
                               ordinary_landmarks.transform(queries) @ library_features.T,
                               atol=1e-10, rtol=1e-10)
    duplicate_training = np.array([[.6, -.4], [.6, -.4], [-.7, .2]])
    singular = nystrom_state(duplicate_training, [0, 1])
    singular_features = nystrom_transform(duplicate_training, singular)
    assert len(singular['eigenvalues']) == 1
    finite_eigenvalues = np.linalg.eigvalsh(z @ z.T)
    assert np.min(finite_eigenvalues) > -1e-10
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'spectrum': {'strings': strings, 'words': spectrum('', 2)[0],
                           'counts': [row.tolist() for row in coordinates],
                           'gram': (np.stack(coordinates) @ np.stack(coordinates).T).tolist()},
              'inputs': {'x': x.tolist(), 'queries': queries.tolist(), 'gamma': .45},
              'rff': {'seed': 17, 'omega': state['omega'].tolist(), 'phase': state['phase'].tolist(),
                      'features': z.tolist(), 'queries': rff_transform(queries, state).tolist(),
                      'finite_gram_eigenvalues': finite_eigenvalues.tolist(),
                      'max_exact_kernel_difference': float(np.max(np.abs(z @ z.T - rbf(x, x, .45))))},
              'nystrom': {'indices': landmarks['indices'].tolist(), 'rank': len(landmarks['eigenvalues']),
                           'cutoff': landmarks['cutoff'], 'features': features.tolist()},
              'duplicate_landmarks': {'rank': len(singular['eigenvalues']),
                                      'all_eigenvalues': singular['all_eigenvalues'].tolist(),
                                      'cutoff': singular['cutoff'], 'features': singular_features.tolist()}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
```

Recorded output for the complete example above:

```text
{
  "versions": {
    "numpy": "2.3.5",
    "sklearn": "1.9.1"
  },
  "spectrum": {
    "strings": [
      "CAACAC",
      "ACCAAA",
      ""
    ],
    "words": [
      "AA",
      "AC",
      "CA",
      "CC"
    ],
    "counts": [
      [
        1.0,
        2.0,
        2.0,
        0.0
      ],
      [
        2.0,
        1.0,
        1.0,
        1.0
      ],
      [
        0.0,
        0.0,
        0.0,
        0.0
      ]
    ],
    "gram": [
      [
        9.0,
        6.0,
        0.0
      ],
      [
        6.0,
        7.0,
        0.0
      ],
      [
        0.0,
        0.0,
        0.0
      ]
    ]
  },
  "inputs": {
    "x": [
      [
        -0.9,
        0.4
      ],
      [
        0.2,
        -0.6
      ],
      [
        0.8,
        0.5
      ],
      [
        -0.3,
        1.1
      ],
      [
        1.2,
        -0.2
      ]
    ],
    "queries": [
      [
        0.15,
        0.35
      ],
      [
        -0.6,
        -0.1
      ],
      [
        1.4,
        0.8
      ]
    ],
    "gamma": 0.45
  },
  "rff": {
    "seed": 17,
    "omega": [
      [
        0.2620888356842852,
        -1.7594546824592434,
        0.5918845639504684,
        1.0865376914857376,
        0.9839652741049845,
        1.7898228421357072,
        -0.10596630226596103,
        -0.3435194919409144,
        0.1410455320713307,
        -0.41531756495853245,
        2.0598352493098577,
        1.0931774889390624
      ],
      [
        -1.725476888584778,
        -0.13096510397093755,
        0.5121368252928148,
        -1.68418065510456,
        1.2474014085882235,
        -0.44915225475378795,
        -1.0361802644512514,
        -0.23719685803090246,
        -0.9318861995787435,
        0.9783477638306263,
        0.4661201465984335,
        -0.4237261735382245
      ]
    ],
    "phase": [
      3.5687934580622827,
      0.5173559024487111,
      3.42432703215533,
      0.9987672483128179,
      4.252223478300645,
      0.7443831939965014,
      2.795992744398332,
      5.579358183330077,
      5.009380886994954,
      0.42712294662677097,
      6.036807514750099,
      4.141909635790574
    ],
    "features": [
      [
        -0.358492539639911,
        -0.18768094392999887,
        -0.4078330414520544,
        0.3243095346083981,
        -0.3058380577707396,
        0.2045056112719365,
        -0.3213324018180807,
        0.3602995455276877,
        -0.08218783652590521,
        0.15087717435332862,
        -0.13729383829018257,
        -0.4034771948530207
      ],
      [
        -0.022805781089212582,
        0.39615138682391554,
        -0.4064525162835856,
        -0.24894289454749616,
        -0.3461108067082715,
        0.08068914001673871,
        -0.39505563910641395,
        0.3298246335138557,
        0.3157768852957751,
        0.3962591457954558,
        0.40559451680277353,
        -0.03978511264966942
      ],
      [
        -0.397878948622545,
        0.23557765147361012,
        -0.21633189072392048,
        0.21160463559346693,
        0.33224339833962835,
        -0.15175705572399845,
        -0.23798121858606938,
        0.18618289953948358,
        -0.022896737030937277,
        0.34057716897678475,
        -0.026009895890432972,
        0.03758700679036718
      ],
      [
        -0.008713766687046199,
        0.25340945836713213,
        -0.32036883107057434,
        0.15559012418845303,
        0.23613764451455846,
        0.39159248255442863,
        -0.04773238075143495,
        0.2658339107022406,
        -0.28431222853433563,
        -0.0233001176282978,
        0.3832733668794901,
        -0.3995945290224509
      ],
      [
        -0.18996516987851692,
        0.001224592426729904,
        -0.25677599550414176,
        -0.3578511151122512,
        0.18529488281476256,
        -0.4030603801519425,
        -0.3939413435945435,
        0.19650707802681164,
        0.24791819387767017,
        0.39379051599702436,
        -0.21734132557233252,
        0.3001765719445497
      ]
    ],
    "queries": [
      [
        -0.4044005830012493,
        0.39948255425372803,
        -0.3478783467186876,
        0.34320041503689125,
        0.05050117234999914,
        0.2676987674549158,
        -0.30580146492708327,
        0.27298451579464605,
        -0.0032706190159597745,
        0.3103313584117429,
        0.3978905590050749,
        -0.21505669123536977
      ],
      [
        -0.36892828385618803,
        -0.006257750317469177,
        -0.4051333565468926,
        0.35524268123791003,
        -0.37673136190460993,
        0.3918266509582756,
        -0.40176878088959167,
        0.36323955269385017,
        0.12280957911313724,
        0.3418244097163936,
        0.017102789099467768,
        -0.3780898860966146
      ],
      [
        -0.34007804374827555,
        -0.18846856084502836,
        -0.020287336636237135,
        0.1583101166357244,
        0.38425995802644425,
        -0.3954780101995366,
        -0.10017110771647046,
        0.07961921876184715,
        -0.10141883055799225,
        0.3302706774563744,
        -0.4047340400004981,
        0.23753483924406116
      ]
    ],
    "finite_gram_eigenvalues": [
      0.09884166916234251,
      0.49840349438736475,
      0.6851705880999419,
      1.341999355724955,
      2.0734322141507584
    ],
    "max_exact_kernel_difference": 0.4672221055524906
  },
  "nystrom": {
    "indices": [
      4,
      1,
      0
    ],
    "rank": 3,
    "cutoff": 1.755297545170794e-12,
    "features": [
      [
        -0.18041451473681278,
        0.8064052588423815,
        -0.5631706325649728
      ],
      [
        0.43154163330260564,
        -0.07268759893098739,
        -0.899159792077119
      ],
      [
        -0.30203682936674514,
        -0.2042031594906833,
        -0.6771503815662357
      ],
      [
        -0.227253402861251,
        0.5015357251646483,
        -0.42032204560940173
      ],
      [
        -0.36095703745775487,
        -0.48996118724928145,
        -0.7935036560085877
      ]
    ]
  },
  "duplicate_landmarks": {
    "rank": 1,
    "all_eigenvalues": [
      0.0,
      2.0
    ],
    "cutoff": 2e-12,
    "features": [
      [
        0.9999999999999999
      ],
      [
        0.9999999999999999
      ],
      [
        0.39752398781664455
      ]
    ]
  }
}
```



In this newly executed example, twelve RFF coordinates have maximum absolute training-kernel difference .4672221055524906 from the exact RBF. Their realized Gram eigenvalues are all positive in this fixture; that does not make the approximation exact. Three chosen landmark rows have rank3. Duplicating the landmark position produces eigenvalues [0,2] and retained rank1 with cutoff2e−12. The feature rows at the duplicate location are1; the remaining row has coordinate approximately .397523987817.

When all landmarks are distinct and W is invertible, multiplying the feature matrix by its transpose gives BW⁻¹Bᵀ. With rank truncation it instead gives BWᵣ†Bᵀ, where † means invert only retained positive eigenvalues. This notation describes exactly which directions the implementation discards. Store the selected training rows, their order, basis, eigenvalues and cutoff; selecting new landmarks from each query batch would change the predictor.

To modify the example, choose a different declared seed or number of features and inspect both kernel error and the eventual held-out task. Do not choose a seed by repeatedly reading final test accuracy. For sequences, a length shorter than k has no windows and returns a zero vector. Changing k changes the coordinate schema, so both training and query representations must use the same k and word order.

### What wider feature spaces do and do not buy

In a kernel feature space, minimizing the squared weight norm still favors a large normalized training margin. Generalization arguments also depend on the feature radius, the sample and the assumptions under which future observations are drawn. Adding irrelevant dimensions can increase distances or hide useful structure; an infinite-dimensional kernel is not an escape from sample limitations. The held-out protocol remains necessary.

The two-point optimum already gives a small **regularization path**: w(C)=2C until C=.5, then w(C)=1. Below that breakpoint both coefficients are at their upper bounds; above it they are free and the margin reaches1. More general paths follow changing active constraints and can have many segments. This program solves one specified C at a time; it does not implement a general path-following algorithm.

A deeper alternative, ν-SVC, makes a different tradeoff parameter explicit. One common formulation minimizes ½‖w‖²−νρ+(1/n)Σξᵢ subject to yᵢfᵢ≥ρ−ξᵢ, ξᵢ≥0 and ρ≥0. Here ρ is a learned margin level. For a valid feature kernel and an optimal KKT solution with positiveρ, ν bounds the margin-error fraction from above and the positive-coefficient support-vector fraction from below. To see why, stationarity in ρ gives Σαᵢ=ν and each slack price limits αᵢ≤1/n. A positive slack, hence a margin error, forces αᵢ=1/n, so the error count divided by n cannot exceedν. Conversely, collecting total massν with at most1/n per positive coefficient requires at leastνn such coefficients. Numerical display thresholds are separate from these exact mathematical counts. A **margin error** means yᵢfᵢ<ρ; it need not be a wrong sign classification. These bounds are not an accuracy guarantee.

Both signs must supply enough coefficient mass to satisfy balance. For n₊ positive and n₋ negative labels, feasibility requires ν≤2min(n₊,n₋)/n in the usual ν-SVC dual. Thus a95:5 split cannot use ν=.5; its class-count limit is .1. Boundary equalities, duplicate features and a zeroρ need care in applying support/error-fraction statements. The original [New Support Vector Algorithms](https://www.stat.purdue.edu/~yuzhu/stat598m3/Papers/NewSVM.pdf) and current library documentation give these conditions; do not interpret ν as the fraction of wrong labels.

One-class SVM solves a related but different support-estimation problem using mostly unlabeled observations. Its ν parameter and anomaly decision do not follow by relabeling the C-SVC examples above. That mechanism is owned by [Anomaly & Outlier Detection](/learn/path/full-curriculum/anomaly-outlier-detection-isolation-forest-one-class-svm-lof).

## 11. Diagnose, transfer and continue

A symptom should trigger a specific investigation

| Observed issue | Inspect first | Avoid concluding |
| --- | --- | --- |
| Training excellent, validation weak | Split integrity, C/γ, representation, data shift | That optimization failed merely because test error is high |
| Many support vectors | Margin distribution, C, overlap and actual prediction cost | That all support vectors automatically means underfitting |
| LinearSVC differs from SVC linear | Loss, intercept penalty, multiclass and tolerance | That one library is wrong from predictions alone |
| Unexpected probabilities | Class columns, calibration folds and deployment population | That a score magnitude is a probability |
| SVR tube seems meaningless | Target units, ε, C and baseline error | That a default tolerance has universal significance |
| Optimization stalls | Feasibility, gap, zero curvature and step status | That an inactivity counter proves optimality |

**Practice 8.** All training observations have positive support coefficients. Give two incompatible explanations consistent with that fact, and say what additional evidence you need.

<details><summary>Hint</summary>

Revisit the separated two-point example and the conflicting-label example.

</details>

<details><summary>Explained solution</summary>

A perfectly separated tiny dataset can have every observation on the binding margins. An overlapping or low-C fit can also give every observation a positive coefficient. Inspect training margins, losses and objective conditions, then use held-out performance and the application baseline to assess usefulness. Support count alone diagnoses neither fit quality nor generalization.

</details>

**Practice 9.** Every input coordinate is multiplied by ten, with no standardization. Which RBF γ preserves all pairwise similarities? Would the same adjustment work if only one coordinate changed?

<details><summary>Hint</summary>

Square the Euclidean distance scaling before comparing exponents.

</details>

<details><summary>Explained solution</summary>

All squared distances grow by 100, so γ must be divided by 100. Scaling only one coordinate changes relative directional geometry; a single scalar γ cannot generally undo it. Use a feature transformation or an explicitly chosen anisotropic metric, fitted within the data-role boundary.

</details>

**Practice 10.** A precomputed-kernel model trained on 40 observations receives five new queries. What shape must its prediction matrix have, and why is a 5×5 matrix insufficient?

<details><summary>Hint</summary>

Each column supplies similarity to one original training observation.

</details>

<details><summary>Explained solution</summary>

Use 5×40, with the 40 columns in training order. Query-to-query similarities omit the support contributions that the trained model needs. Even a 5×40 matrix with permuted columns changes the mathematical predictor unless the coefficients are permuted consistently.

</details>

**Practice 11.** Two sequences have the same spectrum-count vector but opposite labels. Can changing C, a polynomial degree on those vectors, or the optimizer make both classifications correct?

<details><summary>Hint</summary>

A deterministic classifier receives identical feature inputs.

</details>

<details><summary>Explained solution</summary>

No. Every deterministic function of those identical vectors returns the same score for both. A different kernel applied only to the same count vectors cannot restore the missing information. Change the representation or acknowledge irreducible ambiguity under that feature contract; validate any proposed replacement.

</details>

**Practice 12.** Complete an independent report using a changed noise level or a new generated seed. Declare your classification or regression target, split, baseline, preprocessing, search and final evaluation before reading test results. If reporting probabilities or target tolerances, document their units and data roles.

<details><summary>Hint</summary>

Reuse the structure of a complete program, but do not reuse its selected score as an acceptance threshold. Keep test observations outside every selection and calibration decision.

</details>

<details><summary>Explained solution</summary>

A successful report reproduces its dataset and identities; fits all learned transforms on permitted rows; compares with a meaningful baseline; states the exact objective, library version and stopping status; chooses hyperparameters using training/validation evidence; and evaluates the locked procedure on untouched test data. It explains support counts and errors without treating them as universal diagnostics. Calibration requires a separate data-role account, and SVR requires an original-unit interpretation of ε and C. There is no predetermined correct accuracy: the changed experiment is supposed to supply new evidence.

</details>

**Practice 13.** In the three-row hinge update from §3, change only λ from .5 to1 and keep η=.1. Compute both new weights and bias from the old snapshot. Then put a separate row exactly at signed margin1: can an ordinary central finite difference establish differentiability there? What changes for squared hinge?

<details><summary>Hint</summary>

The data pullback stays [4/3,0]; only λw changes. At the hinge kink, inspect one-sided slopes rather than their average.

</details>

<details><summary>Explained solution</summary>

The old w=[.2,−.1] and b=.1 give all three rows active. The gradient becomes [.2−4/3,−.1]=[−17/15,−.1] and the bias gradient remains−1/3. The simultaneous step gives w'=[47/150,−.09] and b'=2/15. Using a changed weight to calculate the bias update would no longer be this specified atomic step.

Hinge's left loss slope at m=1 is−1 and its right slope is0. There is no ordinary derivative; any value in [−1,0] is a valid subgradient. This implementation selects0 for that row's loss contribution. A symmetric difference can average the two one-sided slopes, which does not prove differentiability. Squared hinge has slope−2(1−m) below1 and0 above, so both one-sided slopes reach0 at1. Its active-row data pullback must include the factor2(1−m), rather than reuse the hinge's indicator.

</details>

**Practice 14.** A saved binary state names training columns [A,B,C] and signed coefficients [−.4,.1,.3]. A new query arrives with Gram row [2,1,−1] whose columns are named [C,A,B]. Bias is .2. Repair the mismatch and give the score. Would permuting only the coefficients of the saved training state repair arbitrary future matrices?

<details><summary>Hint</summary>

Use the names to reorder one representation consistently; matching matrix dimensions is insufficient.

</details>

<details><summary>Explained solution</summary>

Reorder this query row to [A,B,C]=[1,−1,2]. Its score is (−.4)·1+.1·(−1)+.3·2+.2=.3. Equivalently, keep the incoming [C,A,B] row and use coefficients [.3,−.4,.1], explicitly declaring that same order. Blindly applying the saved [A,B,C] coefficients gives−.4·2+.1·1+.3·(−1)+.2=−.8, a different prediction. A permanent state permutation must move training rows, identities and coefficients together; it cannot repair future matrices whose column schemas have not been checked.

</details>

**Practice 15.** A colleague wants to report the Wine study but sees its perfect36-row test count and proposes trying γ=.03 next “just to improve confidence.” Explain a valid report and a valid changed study. What if one candidate reaches its iteration cap? May you omit it and keep the rest of this protocol?

<details><summary>Hint</summary>

Separate the frozen evidence, the first exact validation tie rule and the previously declared failure policy from a new question.

</details>

<details><summary>Explained solution</summary>

The current report names the106/36/36 row split, training-only scaler, all twelve ordered candidates, primary mean-class-recall metric, first exact tie rule, baseline and declared cap. It retains weak models such as C=.1,γ=1, whose validation balanced accuracy is1/3. Index6 wins before the test stage; its selected training-only state is frozen without refitting. The test result is36/36 versus baseline14/36 and does not imply universal performance or precise uncertainty.

Trying another γ after inspecting that test set makes it part of selection. A new comparison needs a question, grid and fresh independent evaluation plan declared before reading its final results. It may report an unfavorable outcome. Under this program's declared policy, any capped candidate is saved as protocol failure, all observed outcomes remain, and the test stage stops; silently dropping it or increasing the cap changes the experiment. A revised protocol may choose a different eligibility/failure policy in advance, but cannot relabel this saved study as if that policy had been used.

</details>

### Complete files and reproducible starting points

<!-- implementation disposition: This complete-file table is the authored label/description/dependency mapping for the common TopicContent LessonCodeDownloads index, not a second custom learner table or toolbar. Preserve all filenames, learning-question labels, the adjacent svm_core.py + svm_mechanisms.py dependency annotation, saved-result context and existing setup paragraphs. Register each actual downloadable program through shared Code/RemoteCodeBlock with matching filename and source; register the saved Wine result only at its actual deployed asset path, with its reproducibility context. Keep exact-source Copy/Download and visible success/error feedback on those shared controls. The table below supplies author metadata to that index; render the surrounding explanatory paragraphs once, not this inventory as another download list. No runtime/assets are created by this content correction. -->

The fourteen earlier standalone programs remain available with their recorded outputs. The six new program groups add seven files. Every program group below includes its required imports and numeric examples; `svm_mechanisms.py` alone requires its neighboring `svm_core.py`. The Wine program loads the bundled dataset through the declared scikit-learn version and writes to a new path; the saved result contains the dataset description, numeric inputs, row split, every outcome and selected state.

| Learning question | Complete files |
| --- | --- |
| Geometry and stable constraints | margin-projection.py; support-certificates.py; soft-margin-bias.py |
| Kernel and pair optimization | kernel-xor.py; pair-move.py; pair-coordinate-solver.py |
| Held-out, calibration and class/kernel API | moons-validation.py; heldout-classification.py; calibrated-pipeline.py; multiclass-and-gram.py |
| Regression and target units | regression-tube-units.py; heldout-regression.py |
| Sequence and approximation | sequence-kernel.py; kernel-approximations.py |
| Hinge pullback and ordinary row update | hinge-primal.py |
| Maintained-gradient model and state | svm_core.py **and** svm_mechanisms.py, together |
| Ordinary binary state and rectangular Gram | library-state-and-gram.py |
| Epsilon pullback and unit conversion | epsilon-primal.py |
| Explicit features and rank convention | kernel-feature-mechanisms.py |
| Declared measured-data comparison | wine-svm-study.py; saved wine-svm-study-results.json |

The new executions use NumPy2.3.5 and scikit-learn1.9.1. Original outputs retain their original executed environments as shown. Floating tolerances and different solver schedules can change the last digits; interpret the objective, status and data-role contract before comparing numbers.

Wine data attribution: [Aeberhard and Forina, UCI Wine, DOI10.24432/C5PC7J](https://archive.ics.uci.edu/dataset/109/wine), licensed [CC BY4.0](https://creativecommons.org/licenses/by/4.0/). The saved bundled source description and feature names are retained; undocumented feature units are not invented here.

The next topic in this module is [Naive Bayes & Probabilistic Classifiers](/learn/path/full-curriculum/naive-bayes-probabilistic-classifiers?module=classical-ml). It approaches classification by modeling class-conditional evidence under explicit probabilistic assumptions. Compare that route with the margin objective you can now derive, optimize, validate and question.

<!-- authored ending roles: Preserve the visible Practice8–15 prompts and their separate native Hint/Explained solution disclosures within §11 as practice. Preserve the exact Naive Bayes paragraph above as next-topic content (data-lesson-ending=next), separate from files and resources. The following two H3 boundaries are deliberate content decisions: Further learning uses data-lesson-ending=further-learning; Technical references uses data-lesson-ending=references; both use the common lesson-ending--resources and lesson-resource-list presentation. Keep all eleven numbered main-section anchors unchanged and use these authored H3 titles without runtime text/URL classification. -->

### Further learning

- [An Introduction to Statistical Learning, second edition](https://www.statlearning.com/) — chapter9 gives another geometry-to-classifier route, including its R laboratory. Its slack-budget parameter called C differs from this lesson's hinge penalty C; compare the objectives rather than reuse the numeral.

- [The Elements of Statistical Learning, second edition](https://hastie.su.domains/ElemStatLearn/download.html) — chapter12 connects margins, penalization and kernel feature spaces, with regression and regularization paths. Read after the local dual derivation; its broader LDA extensions are a separate method family.

[Cornell CS4780: Support Vector Machines](https://www.cs.cornell.edu/courses/cs4780/2018fa/lectures/lecturenote09.html) gives a compact written geometry-to-margin derivation. Use it after the first investigation; its algebra is easier once score scale and distance are separate.

[MIT OpenCourseWare: Patrick Winston, Learning—Support Vector Machines](https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/resources/lecture-16-learning-support-vector-machines/) is an alternate video explanation of the normal vector and margin “street.” The official transcript's geometry and normalization discussion was reviewed for this lesson; the full video was not watched. It is a conceptual lecture from 2010, not current library API guidance.

### Technical references

- [Cortes and Vapnik, Support-Vector Networks](https://homepages.math.uic.edu/~lreyzin/papers/cortes95.pdf) — the original classifier formulation and support-weighted feature-space mechanism. Historical experimental results are not current deployment comparisons.

- [Smola and Schölkopf, A Tutorial on Support Vector Regression](https://alex.smola.org/papers/2004/SmoSch04.pdf) — the two-slack tube derivation and the interpretation of signed coefficients. Match its residual/intercept conventions before transferring formulas.

- [Rahimi and Recht, Random Features for Large-Scale Kernel Machines](https://papers.nips.cc/paper/3182-random-features-for-large-scale-kernel-machines.pdf) — frequency sampling and the expectation behind RFF. One finite feature draw has approximation error; the paper does not validate this lesson's particular seed as optimal.

- [Platt, Sequential Minimal Optimization](https://www.microsoft.com/en-us/research/wp-content/uploads/1998/04/sequential-minimal-optimization.pdf)—the original two-variable update, feasible bounds and endpoint handling. Our exhaustive working-set policy is intentionally different from its complete heuristic implementation.
 
- [Chang and Lin, LIBSVM](https://www.csie.ntu.edu.tw/~cjlin/papers/libsvm.pdf)—C-SVC, SVR, decomposition, multiclass and implementation contracts. Read the formulation and solver sections when comparing the teaching solver with a mature implementation.
 
- [Hsu, Chang and Lin, A Practical Guide to Support Vector Classification](https://www.csie.ntu.edu.tw/~cjlin/papers/guide/guide.pdf)—scaling and parameter selection with useful modeling context. Our pipelines make fold-local fitting explicit.
 
- [scikit-learn SVC API](https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html) and [SVM user guide](https://scikit-learn.org/stable/modules/svm.html)—current parameter, precomputed-kernel, class-weight, score-shape and cache contracts. The executed version here is 1.9.1; check the API's deprecation notice before copying an older probability example.
 
- [CalibratedClassifierCV API](https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV.html)—out-of-fold versus ensemble behavior, whole-estimator fitting and prefit/frozen data separation. This supplements the explicit calibration pipeline above.
 
- [Leslie, Eskin and Noble, The Spectrum Kernel](https://cseweb.ucsd.edu/~eeskin/papers/spectrum-psb02.pdf)—the count-feature construction and original protein-sequence application. The tiny alphabet example exposes the representation's information loss without reproducing the paper's experimental claims.
 
- [scikit-learn kernel approximation guide](https://scikit-learn.org/stable/modules/kernel_approximation.html)—RBF sampling and Nyström feature APIs. Read with the feature-construction and training-cost distinctions above; the measured comparison is one reproducible finite run.
