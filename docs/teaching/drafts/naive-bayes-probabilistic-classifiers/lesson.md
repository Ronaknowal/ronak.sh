# Naive Bayes & Probabilistic Classifiers

An incoming message says “free meeting.” Does “free” make it junk, or does
“meeting” make it ordinary work? We will compare how each kind of mail would
produce these words, combine that evidence with the prevalence of each class,
and turn the comparison into a probability and then an action. Along the way,
we will find cases where a confident number is the wrong number.

**First pass.** Read sections 1–7 for the observation, the calculation and its
failure cases; follow the sparse workflow and real email experiment in section
8; use section 9 to check probabilities and choose actions. The explicitly
marked deeper branches derive estimators and gradients, merge streaming state,
and integrate parameter uncertainty. Return to those branches and section 10
after one successful prediction. Section 11 supplies independent tasks with
separate hints and explained solutions. Code is optional for the first reading.

**Prerequisites.** Recall the actual [Bayes reversal](/learn/path/full-curriculum/probability-distributions-bayes-theorem#2-reverse-the-question-with-bayes),
[new versus repeated evidence](/learn/path/full-curriculum/probability-distributions-bayes-theorem#3-check-whether-evidence-is-new),
[mean and variance](/learn/path/full-curriculum/probability-distributions-bayes-theorem#5-summarize-without-losing-the-distribution)
and [probability area versus density](/learn/path/full-curriculum/probability-distributions-bayes-theorem#6-read-area-and-cumulative-probability).
We refresh their local use here. The published [SVM score and boundary](/learn/path/full-curriculum/support-vector-machines-svm#1-a-score-a-boundary-and-a-real-distance)
is a useful comparison, but the first calculation needs no SVM knowledge.

**Using the programs.** Reading and live investigations require no Python.
For execution, use a virtual environment with NumPy, SciPy and scikit-learn.
The saved executions use Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and
scikit-learn 1.9.1. Install with `python -m pip install numpy scipy scikit-learn`.
Each displayed complete file has Copy and Download controls. Save required
companions together; the file index below names the exact sets. The browser's
drawings compute their declared models; they do not execute arbitrary Python.

## 1. One message, one prediction

What must a classifier know at the moment mail arrives? A **row** is one
message; a **feature** is a property we can measure then; a **label** says
whether the message is ham (ordinary mail, class 0) or spam (junk, class 1).
Training rows include labels. An incoming row has measurable features and an
unknown label. A feature saying “the user deleted this tomorrow” belongs to a
later time and cannot be used for this arrival-time prediction.

Look at how repeated words become indexed columns before they enter a model.

<!-- DRAWING D01 -->

“Free free money” contains three token positions, but its five-word count
vector is `[2,1,0,0,0]` in the fixed order `[free,money,win,meeting,agenda]`.
Both free tokens point to the same free column. A presence representation
instead stores `[1,1,0,0,0]`: it answers “did it occur?” rather than “how many?”
An ordered token sequence keeps an additional fact—where each word appeared.
Counts discard order; a learner cannot recover “money free free” versus
“free money free” from the same count vector.

We will keep a word's identity cue attached to that word when columns move.
Free uses violet, money cyan, win coral, meeting blue and agenda gold; literal
word labels remain authoritative. A white outline marks the current operation
without changing a word's identity. Class marks are a labelled blue circle for
ham and a labelled amber triangle for spam. Counts and probabilities have
numeric labels; a brighter word is never a larger probability.

How does a rule turn those features into a class? One route directly learns
a score separating classes. Another learns what each class tends to generate.

<!-- DRAWING D02 -->

The feature plane places each message at its two shown count coordinates.
A discriminative boundary compares a score with zero. The other side of the
drawing starts with ham or spam, follows each class's fitted word distribution,
and asks which route better explains this query. We call that a **generative
classifier** because it models `P(x | class)` together with class frequencies.
Bayes' rule reverses these quantities to `P(class | x)`. Logistic regression
learns a conditional probability directly; SVM learns a margin score under a
different objective. Similar-looking straight boundaries can come from
different fitting problems.

Keep the records that teach the distributions separate from the message being
classified.

<!-- DRAWING D03 -->

Labeled training rows enter count accumulators; the resulting parameter table
then receives a new unlabeled query. The query does not enter a fitting arrow.
A **prior baseline** skips word evidence and always reports the training class
fractions. Under equal error costs its class decision chooses the commoner
label. Later we compare whole fitted workflows with that baseline using held-out
rows. The four roles have different jobs:

| Role | What it may teach | What it must keep separate |
| --- | --- | --- |
| Training | Vocabulary, model parameters and fitted preprocessing | Future validation/test features and labels |
| Validation or internal folds | Representation, smoothing and model choice | Final test decisions |
| Calibration, if used | A probability mapping from unseen base predictions | Base fitting on that row's target |
| Final test | The chosen workflow's evaluation | Any further tuning presented as untouched evaluation |

Choose the split unit for the intended task. Copies of an email should stay
together; sender/campaign groups or chronological splits can be needed when
those dependencies matter. Our tiny corpora first teach arithmetic. Section 8
then supplies an openly licensed historical email dataset with a declared group
split and its limitations.

What makes this classifier “naive”? Draw its actual conditional variables.

<!-- DRAWING D04 -->

For binary presence features, the class node fans out to the free-present,
money-present and win-present variables. Given a class, the fitted model multiplies their
separate likelihoods. The graph declares a factorization of a probability law;
its arrows are not a discovery that spam causally produces a word. In the token
model introduced later, the children will be token positions, rather than
independent count columns. Naming the random variables correctly matters.

The assumption is **joint conditional independence**:

\[
P(x_1,\ldots,x_d\mid c)=\prod_{j=1}^{d}P(x_j\mid c).
\]

The conditioning says “within this class.” It does not say the features are
independent in the pooled mailbox. Pairwise independence alone also cannot
justify a product over every feature. Here is a concrete class mixture.

<!-- DRAWING D05 -->

Let two equally common classes have feature-presence rates `.2,.2` and `.8,.8`.
Within each class the two features are independent. The joint pooled probability
of both present is `.5×.2² + .5×.8² = .34`. Each pooled marginal is `.5`, whose
product is `.25`. Learning the class already explains part of their association;
pooling the classes hides that information and creates dependence.

The saving is a smaller table. An unrestricted law over `d` binary features
needs `2^d−1` free probabilities per class, because it describes every binary
pattern and their total must be one. A factored Bernoulli law needs `d`
presence probabilities per class. This binary-event comparison explains the
tradeoff: simpler estimation buys a restriction on which laws the model can
express. It does not establish that a real corpus satisfies that restriction.

## 2. Turn likelihoods into class evidence

We can now ask how much each class explains one observation. Before learning
the tables in section 3, suppose two of three training messages are spam, and a
fitted token table gives free probability `4/11` in spam and `1/7` in ham.
The table's exact corpus is previewed in D10; here we trace its use once.

Watch the two class weights share one normalizing denominator.

<!-- DRAWING D06 -->

The spam prior is `2/3`. Restrict that class partition by its free likelihood
`4/11`, leaving weight `8/33`. Ham starts at `1/3` and leaves `(1/3)(1/7)=1/21`.
These are joint weights, not yet probabilities conditioned on free. Their sum
is the mass assigned to the observed word. Dividing both weights by that same
sum leaves posterior fractions `56/67` for spam and `11/67` for ham.

Write `Y` for class, `x` for the observed vector, `π_c` for its prior and
`L_c(x)` for its class likelihood. For a discrete event, `L` is mass; for a
continuous measurement it is density in common coordinates. The rule is

\[
w_c(x)=\pi_cL_c(x),\qquad
P(Y=c\mid x)=\frac{w_c(x)}{\sum_r w_r(x)},\qquad
\widehat y=\arg\max_c w_c(x).
\]

The denominator must be positive. It is common to every class, so it cancels
when comparing classes; it remains essential when naming an output a
probability. Here the fitted model reports spam probability `56/67≈.835821`.
Section 9 will ask whether held-out outcomes support interpreting numbers of
that size as long-run frequencies. The equal-cost argmax rule chooses spam;
different costs lead to a separate action rule.

Long messages multiply many small numbers. A computer can round their products
to zero even though their relative magnitudes remain meaningful. Natural logs
replace multiplication with addition and preserve comparisons of positive
weights. Follow the numerical scale change before its equation.

<!-- DRAWING D07 -->

Scores `−1001,−1000` both exponentiate directly to zero in ordinary floating
point. Subtract the maximum `−1000`: the new scores are `−1,0`, whose
exponentials are `.367879,1`. Their sum is `1.367879`; normalized values are
`.268941,.731059`. The common shift cancels from the ratio. It changes the
arithmetic scale while leaving the model comparison intact.

For factored likelihoods, define the unnormalized **log joint score** `s_c`.
The following equation names every operation just traced:

\[
s_c=\log\pi_c+\sum_j\log P(x_j\mid c),\quad m=\max_rs_r,
\quad \ell=m+\log\sum_r e^{s_r-m},\quad
\log P(c\mid x)=s_c-\ell.
\]

This is log-sum-exp normalization. Retain log probabilities when an extremely
small final probability underflows on exponentiation. A partially unsupported
class has score `−∞` and posterior zero. When every score is `−∞`, the model has
assigned the observation no support and conditioning is undefined. A uniform
fallback would silently invent a different model. Invalid positive infinity or
overflow in finite score differences is an arithmetic error, rather than a
license to clip the model's scores.

The complete first program implements this scale change and exact fractions.

**normalized-scores.py — complete program.** If both exponentiated scores round to zero, does the evidence say that the classes are equally likely?

```python
import math
from fractions import Fraction as F


def log_probabilities(scores):
    if not scores or any(math.isnan(s) or s == math.inf for s in scores):
        raise ValueError("Use finite scores or negative infinity")
    maximum = max(scores)
    if maximum == -math.inf:
        raise ValueError("Every class assigns zero likelihood: posterior undefined")
    shifted = [s - maximum for s in scores]
    if any(s != -math.inf and not math.isfinite(s - maximum) for s in scores):
        raise ValueError("Score difference exceeds arithmetic range")
    correction = math.log(math.fsum(math.exp(s) for s in shifted))
    return [s - correction for s in shifted]


joint = [F(1, 3) * F(1, 7), F(2, 3) * F(4, 11)]
print("free-token posterior [ham, spam]:", [str(p / sum(joint)) for p in joint])
scores = [-1001.0, -1000.0]
print("direct exponentials:", [math.exp(s) for s in scores])
print("normalized:", [round(math.exp(p), 6) for p in log_probabilities(scores)])
print(
    "one possible class:", [math.exp(p) for p in log_probabilities([-math.inf, -3.0])]
)
try:
    log_probabilities([-math.inf, -math.inf])
except ValueError as error:
    print("zero-evidence response:", error)
```

Recorded original output (retained, not rerun):

```text
free-token posterior [ham, spam]: ['11/67', '56/67']
direct exponentials: [0.0, 0.0]
normalized: [0.268941, 0.731059]
one possible class: [0.0, 1.0]
zero-evidence response: Every class assigns zero likelihood: posterior undefined
```

Its output distinguishes numerical product underflow from the unsupported-event
case. `log(8/33)` and `log(1/21)` are unnormalized log weights: a method returning
only those values should be named `log_joint` or `class_log_scores`.
`predict_log_proba` must subtract the shared normalizer.

For two classes, subtraction is an even simpler view. **Odds** are
`P(spam|x)/P(ham|x)`; **log odds** are `s_spam−s_ham`. Zero is a tie, positive
favors spam and negative favors ham. Track individual signed contributions.

<!-- DRAWING D08 -->

The prior contributes `log 2≈.693147`. Free contributes
`log((4/11)/(1/7))=log(28/11)≈.934309`. Together they give `1.627456` log odds.
Adding meeting instead contributes `log(7/22)<0`, because meeting is more
likely under ham. Bars point to opposite sides of zero; hue follows each
named word, while signed length encodes its log likelihood ratio.

One final distinction prevents an important diagnostic mistake.

<!-- DRAWING D09 -->

With no smoothing, a **known** free column can have zero ham probability:
observing that word rules ham out under the fitted table. An **unknown** word
has no column in this chosen vectorizer and is ignored. An all-OOV message
therefore becomes an empty count row and returns the prior, whereas a row
impossible under both classes has no posterior. Smoothing repairs support
inside a declared vocabulary; it does not create new columns at inference.

## 3. Learn a token model

We have used a probability table. Where do its entries come from? Keep the
same five-word schema and count the actual training messages.

Watch document counts and pooled token counts take different routes.

<!-- DRAWING D10 -->

The three messages are spam “free free money,” spam “free money win” and ham
“meeting agenda.” Their vectors are `[2,1,0,0,0]`, `[1,1,1,0,0]` and
`[0,0,0,1,1]`. Two **documents** are spam, one is ham: priors are `2/3,1/3`.
Pooling **tokens** instead gives spam counts `[3,2,1,0,0]` with total 6 and ham
`[0,0,0,1,1]` with total 2. Prior estimation counts rows; token estimation counts
occurrences within their class. Exchanging those denominators changes the model.

Let `C_cj` be class `c`'s pooled count for word `j`, `T_c=Σ_j C_cj`, and `V` the
number of declared words. The relative-frequency estimate is
`θ_cj=C_cj/T_c`, when `T_c>0`. Each class's word probabilities sum to one.

What exactly is the event described by this word table? It first describes
independent token positions, conditional on class and the observed
in-vocabulary length `N`. Counting those positions then combines equivalent
orders.

<!-- DRAWING D11 -->

For `θ(A)=4/5,θ(B)=1/5`, AB has probability `4/25` and BA also has `4/25`.
Both arrows reach count vector `[1,1]`, whose event has probability `8/25`.
The count event forgets order, so its mass adds every order giving that vector.
With counts `x`, the number of such orders is the multinomial coefficient.

\[
N=\sum_jx_j,\qquad
P(x\mid c,N)=\frac{N!}{\prod_jx_j!}\prod_j\theta_{cj}^{x_j},\qquad
s_c(x)=\log\pi_c+\sum_{j:x_j>0}x_j\log\theta_{cj}.
\]

The coefficient depends on the fixed observation, not class, so it cancels in
class normalization. It belongs in an actual count-event probability. The
count columns themselves are dependent: with fixed length, all tokens being A
forces every other count to zero. The independence concerns positions before
aggregation. A separate class-dependent length distribution would add
`log P(N|c)`; the usual score leaves that factor class independent. More tokens
still add evidence without implying that a length model was learned.

Tiny corpora give zero counts for words that may merely be unobserved so far.
We can reserve probability throughout the declared vocabulary.

<!-- DRAWING D12 -->

Attach the same `α` addition to every column, then add all `Vα` additions in the
denominator. At `α=1`, spam becomes `[4,3,2,1,1]/11`; ham becomes
`[1,1,1,2,2]/7`. Each row still sums to one. The two denominators `6+5=11` and
`2+5=7` now explain the free likelihoods used in D06.

\[
\widehat\theta_{cj}=\frac{C_{cj}+\alpha}{T_c+V\alpha}.
\]

| Word | Spam θ | Ham θ | One-token spam/ham ratio |
| --- | --- | --- | --- |
| free | 4/11 | 1/7 | 28/11 |
| money | 3/11 | 1/7 | 21/11 |
| win | 2/11 | 1/7 | 14/11 |
| meeting | 1/11 | 2/7 | 7/22 |
| agenda | 1/11 | 2/7 | 7/22 |

The same fixed corpus now supports the token evidence investigation.

<!-- DRAWING D08: live token view after smoothing -->

Edit the
message and smoothing, then inspect the active words, log contributions and
current posterior. The complete result is shown immediately. Prefix stepping
traces the additions without concealing that result. A separate prior control
changes prevalence while holding the word tables fixed. Empty and OOV messages
are valid; at `α=0`, “free meeting” makes both class weights zero. Compare that
support failure with a message containing only zephyronic.

The calculation can be reproduced without a fitting API:

```python
import numpy as np
from scipy.special import logsumexp

counts = np.array([[0, 0, 0, 1, 1], [3, 2, 1, 0, 0]], dtype=float)  # ham, spam
prior = np.array([1/3, 2/3])
theta = (counts + 1) / (counts.sum(axis=1, keepdims=True) + 5)
x = np.array([1, 0, 0, 0, 0])
scores = np.log(prior) + np.log(theta) @ x
print(np.exp(scores - logsumexp(scores)))  # [11/67, 56/67]
```

Adding one to the matrix computes the smoothing law; summing on axis 1 gives
one token denominator per class. The final matrix product adds query word
contributions to each class. Section 8 develops the sparse version and persists
its raw counts. The older complete integer-count implementation below uses an
eight-word/eight-message fixture to show the same mechanism at a larger scale.

**count-classifier.py — complete program.** Why does the money column receive a nonzero ham count before any smoothing?

```python
import numpy as np
from scipy.special import logsumexp


class CountNaiveBayes:
    """Integer-count plug-in MNB; bounded educational input, not a full sklearn estimator."""

    def __init__(self, alpha=1.0):
        if not np.isfinite(alpha) or not 0 <= alpha <= 100:
            raise ValueError("Use finite alpha from 0 to 100")
        self.alpha = float(alpha)

    @staticmethod
    def _counts(X):
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or not X.shape[0] or not X.shape[1]:
            raise ValueError("Use a nonempty sample-by-feature matrix")
        if not np.isfinite(X).all() or (X < 0).any() or (X > 1e6).any():
            raise ValueError("Counts must be finite and between 0 and 1e6")
        if not np.equal(X, np.floor(X)).all():
            raise ValueError("This event-model implementation uses integer counts")
        return X

    def fit(self, X, y):
        X = self._counts(X)
        y = np.asarray(y)
        if y.ndim != 1 or len(y) != len(X):
            raise ValueError("One label is required per row")
        self.classes_, inverse = np.unique(y, return_inverse=True)
        self.class_count_ = np.bincount(inverse).astype(float)
        self.feature_count_ = np.zeros((len(self.classes_), X.shape[1]))
        np.add.at(self.feature_count_, inverse, X)
        smoothed = self.feature_count_ + self.alpha
        total = smoothed.sum(axis=1, keepdims=True)
        if (total == 0).any() or not np.isfinite(total).all():
            raise ValueError("A class has no token mass; use positive smoothing")
        self.theta_ = smoothed / total
        with np.errstate(divide="ignore"):
            self.feature_log_prob_ = np.log(self.theta_)
        self.class_log_prior_ = np.log(self.class_count_ / len(X))
        return self

    def log_joint(self, X):
        X = self._counts(X)
        if X.shape[1] != self.feature_count_.shape[1]:
            raise ValueError("Use the fitted vocabulary in the same column order")
        scores = []
        for row in X:
            active = row > 0  # Prevent the undefined floating-point operation 0 * -inf.
            scores.append(
                self.class_log_prior_
                + (self.feature_log_prob_[:, active] * row[active]).sum(axis=1)
            )
        return np.asarray(scores)

    def predict_log_proba(self, X):
        scores = self.log_joint(X)
        normalizer = logsumexp(scores, axis=1, keepdims=True)
        if not np.isfinite(normalizer).all():
            raise ValueError("Every class has zero likelihood for at least one row")
        return scores - normalizer

    def predict_proba(self, X):
        return np.exp(self.predict_log_proba(X))

    def predict(self, X):
        return self.classes_[self.predict_log_proba(X).argmax(axis=1)]


vocabulary = ["free", "money", "win", "prize", "meeting", "agenda", "report", "quarter"]
X = np.array(
    [
        [3, 2, 1, 1, 0, 0, 0, 0],
        [2, 3, 2, 0, 0, 0, 0, 0],
        [1, 1, 3, 2, 0, 0, 0, 0],
        [4, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 3, 1, 1],
        [0, 0, 0, 0, 1, 1, 3, 2],
        [0, 1, 0, 0, 3, 2, 1, 0],
        [0, 0, 0, 0, 2, 1, 2, 3],
    ]
)
y = np.array([1, 1, 1, 1, 0, 0, 0, 0])

model = CountNaiveBayes(alpha=1).fit(X, y)
query = np.array([[2, 1, 0, 0, 0, 0, 0, 0], [0] * 8])
print("class order:", model.classes_.tolist())
print("token totals:", model.feature_count_.sum(axis=1).astype(int).tolist())
print("class word counts:", model.feature_count_.astype(int).tolist())
print("log word probabilities:", model.feature_log_prob_.round(4).tolist())
print("query joint scores:", model.log_joint(query).round(6).tolist())
print("query probabilities:", model.predict_proba(query).round(6).tolist())
print("training accuracy:", float(np.mean(model.predict(X) == y)))
from sklearn.naive_bayes import MultinomialNB

reference = MultinomialNB(alpha=1).fit(X, y)
print(
    "matches sklearn:",
    np.allclose(model.predict_proba(query), reference.predict_proba(query)),
)
```

Recorded original output (retained, not rerun):

```text
class order: [0, 1]
token totals: [29, 28]
class word counts: [[0, 1, 0, 0, 8, 7, 7, 6], [10, 8, 6, 4, 0, 0, 0, 0]]
log word probabilities: [[-3.6109, -2.9178, -3.6109, -3.6109, -1.4137, -1.5315, -1.5315, -1.665], [-1.1856, -1.3863, -1.6376, -1.9741, -3.5835, -3.5835, -3.5835, -3.5835]]
query joint scores: [[-10.832754, -4.450689], [-0.693147, -0.693147]]
query probabilities: [[0.001689, 0.998311], [0.5, 0.5]]
training accuracy: 1.0
matches sklearn: True
```

Its ham and spam token totals are 29 and 28. Adding one over eight columns gives
denominators 37 and 36. Ham also contains money once, so this corpus has overlap.
`classes_` is `[0,1]`; each probability column follows that order. Its perfect
training accuracy describes these eight invented fitting rows. The positive
count mask is important at `α=0`: multiplying a stored zero count by `−∞`
would produce NaN. The later sparse reference keeps this exact support logic,
and extends state handling without replaying this experiment.

### Deeper: constrained estimation and what smoothing means

Why is relative frequency the likelihood estimate? Hold one class fixed and
ask which probability table best explains its accumulated tokens. The table
must stay on a simplex: nonnegative entries whose total is one.

<!-- DRAWING D13 -->

With counts `[2,1,1]`, the triangle's three coordinates are probabilities.
Moving a point changes those probabilities while preserving the total. The
objective contours are `Σ C_j log θ_j`; their maximum is `[.5,.25,.25]`.
A zero-probability edge with a positive observed count has log likelihood
`−∞`. For a zero count, use the limiting contribution `0 log 0=0`.

To derive the maximum, form
`F(θ,λ)=Σ_j C_j log θ_j + λ(1−Σ_j θ_j)`.
At an interior optimum, `∂F/∂θ_j=C_j/θ_j−λ=0`, giving `C_j=λθ_j`.
Sum over `j`: `T=λΣ_jθ_j=λ`. Hence `θ_j=C_j/T`. Positive-count entries
have positive fitted mass; zero-count entries can maximize at the boundary.
The log likelihood is concave on the simplex, so an admissible stationary
maximum is global. At total count zero it supplies no preferred composition.

Now place a Dirichlet prior on the same simplex, with density proportional to
`∏ θ_j^(α−1)` for positive `α`. Multiplication by token likelihood
`∏ θ_j^C_j` gives posterior shapes `A_j=C_j+α`. Their posterior mean is
`A_j/Σ A_j`, exactly the additive formula. It is also the predictive
probability of one future token. The interior posterior **mode** instead uses
`(A_j−1)/(Σ A_j−V)` when every `A_j>1`. Calling the mean MAP would confuse
two different summaries. Using the mean in a whole-document product is a
plug-in choice; section 10 integrates the entire product.

The same five pseudo-counts affect a class with two observed tokens more than
a class with two thousand. As `α` grows, composition moves toward `1/V`; as it
approaches zero with positive `T`, it approaches relative frequency. Smoothing
acts on a declared table. A vocabulary OOV policy or a fitted unknown-token
column remains a separate representation choice.

### Deeper: inspect the likelihood in unconstrained coordinates

A gradient calculation helps connect the closed form to numerical fitting.
Let unrestricted logits `z_j` produce probabilities
`θ_j=e^{z_j}/Σ_k e^{z_k}`. Substituting into negative log likelihood gives

\[
J(z)=T\log\sum_j e^{z_j}-\sum_j C_jz_j,\qquad
\frac{\partial J}{\partial z_j}=T\theta_j-C_j.
\]

Differentiate the first term: the log derivative divides its exponential
derivative by the exponential sum, giving `Tθ_j`. The second differentiates
to `−C_j`. A zero gradient therefore gives the same `C/T` table. Adding a
constant to every logit leaves probabilities and the objective unchanged;
fix the last logit at zero to remove that redundant direction. A zero-count
MLE can need an infinite negative logit, so a finite optimizer and an exact
boundary solution have different numerical domains.

The complete objective program, shown after its Gaussian counterpart in
section 5, checks central differences and supplies `jac=True` to SciPy.
Optimizing counts `C+α` would optimize a pseudo-count likelihood; label that
objective explicitly instead of claiming it is automatically the MAP
interpretation. Ordinary NB fitting uses the closed-form statistics; the
optimizer here is a way to inspect the objective and its derivatives.

## 4. Decide what an observation means

The token table counts repetition. What if we want to know whether a word
occurred at all, including the words missing from a completely observed
message? Change the observation, then change its likelihood.

Look at the same message as counts and as measured presence slots.

<!-- DRAWING D14 -->

“Free free” has count two in the free column, but presence one. Each other
presence slot is an observed zero. A Bernoulli class table gives a probability
`φ_cj` of presence for each slot, with absence probability `1−φ_cj`. Unlike
the multinomial composition, these `φ` values need not sum to one: each feature
has its own two-outcome distribution. Repeating free adds count evidence but
does not change any presence slot.

\[
P(b\mid c)=\prod_j\phi_{cj}^{b_j}(1-\phi_{cj})^{1-b_j},\qquad
s_c=\log\pi_c+\sum_j\begin{cases}\log\phi_{cj}&b_j=1\\
\log(1-\phi_{cj})&b_j=0.\end{cases}
\]

To fit `φ`, count class documents containing the feature. Let `D_c` be the
class document count and `D_cj^+` its present count. A symmetric Beta prior
adds `α` to presence and `α` to absence:

\[
\widehat\phi_{cj}=\frac{D_{cj}^{+}+\alpha}{D_c+2\alpha}.
\]

Both spam messages contain free, giving `(2+1)/(2+2)=3/4`; no ham message
does, giving `(0+1)/(1+2)=1/3`. For “free,” the spam absence factors for
money, win, meeting and agenda are `1/4,1/2,3/4,3/4`. Multiplying all five
factors with the prior and normalizing yields spam probability `6561/7585≈.864997`.
The token model's `.835821` answers a different event question. In the
presence investigation, edit one count or the full vector and compare repeated
free with one free. The presence result stays fixed when no slot changes.

But a sensor or parser can fail to measure a slot. A missing observation is
different from an observed off event.

<!-- DRAWING D15 -->

Consider prior fault `.2`, alarm-presence probabilities `.8` in fault and
`.4` in normal. An observed off alarm contributes absence factors `.2,.6`.
Weights `.2×.2=.04` and `.8×.6=.48` give fault posterior `1/13`. If the alarm
was genuinely unmeasured, summing over its possible values instead contributes
`.8+.2=1` and `.4+.6=1`, leaving the prior `.2`.

Omitting the factor assumes the observation process adds no additional class
evidence under the stated conditioning. If missingness itself signals a fault,
we must model that process. A Boolean mask in section 10 expresses “measured,”
not a claim that every missing-data mechanism is harmless.

What if a feature chooses a status instead of counting events? Give each
feature its own category universe.

<!-- DRAWING D16 -->

Status has labels idle, busy, offline and a reserved other; link has wired and
radio. The status code 2 indexes offline's table entry. It is not twice as much
status as code 1. Each feature `j` has `M_j` possibilities and per-class counts
`D_cjt`. Its estimate is

\[
P(X_j=t\mid c)=\frac{D_{cjt}+\alpha}{D_c+\alpha M_j}.
\]

Each row/feature table sums to one. A reserved other label works only if the
input mapping was declared during fitting. Positive smoothing does not validate
a code outside its support. The complete library example holds the three-mail
fixture fixed, then switches explicitly to six device records.

**event-models.py — complete program.** Does repeating free change the Bernoulli observation? What does a reserved category buy you?

```python
import numpy as np
from sklearn.naive_bayes import BernoulliNB, CategoricalNB, MultinomialNB

X = np.array([[2, 1, 0, 0, 0], [1, 1, 1, 0, 0], [0, 0, 0, 1, 1]])
y = np.array([1, 1, 0])
queries = np.array([[1, 0, 0, 0, 0], [2, 0, 0, 0, 0], [0, 0, 0, 0, 0]])
for model in [MultinomialNB(alpha=1), BernoulliNB(alpha=1, binarize=0.0)]:
    model.fit(X, y)
    print(
        type(model).__name__,
        "P(spam):",
        model.predict_proba(queries)[:, 1].round(6).tolist(),
    )

# Status: idle=0, busy=1, offline=2, other=3 (reserved by a fixed input schema).
# Link: wired=0, radio=1. Each column has its own category universe.
status_link = np.array([[0, 0], [0, 1], [1, 0], [2, 1], [2, 0], [1, 1]])
fault = np.array([0, 0, 0, 1, 1, 1])
categorical = CategoricalNB(alpha=1, min_categories=[4, 2]).fit(status_link, fault)
print("category counts:", [row.tolist() for row in categorical.category_count_])
print(
    "offline/radio and other/wired:",
    categorical.predict_proba([[2, 1], [3, 0]]).round(6).tolist(),
)
try:
    categorical.predict_proba([[4, 0]])
except IndexError:
    print(
        "category 4: outside the declared/fitted support; reject or map by the fixed schema"
    )
```

Recorded original output (retained, not rerun):

```text
MultinomialNB P(spam): [0.835821, 0.92836, 0.666667]
BernoulliNB P(spam): [0.864997, 0.864997, 0.516411]
category counts: [[[2.0, 1.0, 0.0, 0.0], [0.0, 1.0, 2.0, 0.0]], [[2.0, 1.0], [1.0, 2.0]]]
offline/radio and other/wired: [[0.181818, 0.818182], [0.6, 0.4]]
category 4: outside the declared/fitted support; reject or map by the fixed schema
```

Its repeated free queries agree under Bernoulli and differ under Multinomial.
The empty count query returns its prior; the all-absent Bernoulli query gives
about `51.64%` spam because zeros supply factors. The categorical support
reserves status code 3 using `min_categories=[4,2]`; code 4 is rejected.
The scratch categorical route in section 8 stores category labels alongside
counts, so restoring numeric arrays cannot silently change the code meanings.

For the ordinary Bernoulli API, `binarize=None` means the caller has already
supplied binary input. Passing arbitrary counts under that setting would change
the scoring arithmetic away from this event model. The new reference validates
binary inputs and requires positive `α` for its sparse absence formula. Exact
zero smoothing can be implemented by event branches; it cannot safely reuse a
formula containing infinite present/absent log ratios.

## 5. Measure continuous evidence

Counts and categories have discrete mass. How can the same class comparison
use a continuous sensor reading? Switch examples explicitly: one feature is a
voltage in millivolts, and each class proposes a normal density for that voltage.
The density's height and its probability area play different roles.

Look at two directly labelled curves and the same-width interval under each.

<!-- DRAWING D17 -->

Both curves have mean zero. The narrow class has standard deviation 1 mV and
the wide class 2 mV, hence variances 1 and 4 mV². At the mean, the narrow
density is twice as high, giving posterior `2/3` under equal priors. The
interval area depends on its width, whereas the point-density comparison uses
the height at the current reading. Moving the reading into either tail makes
the wider distribution more plausible. Equal heights occur at both
`±sqrt(8 log 2/3)≈±1.359556 mV`.

For mean `μ_cj` and positive variance `v_cj=σ_cj²`, write

\[
z_{cj}=\frac{x_j-\mu_{cj}}{\sigma_{cj}},\qquad
f(x_j\mid c)=\frac{e^{-z_{cj}^{2}/2}}{\sqrt{2\pi}\sigma_{cj}}.
\]

The standardized residual `z` measures distance in standard deviations.
The exponential lowers density far from the mean; division by `σ` keeps the
total area one. Density has units `mV^−1` and can exceed one. A continuous
exact point has probability zero; an interval probability integrates density
over its width. In the investigation, change reading and interval width
independently: width changes area without changing the point posterior.

Consistently changing coordinates changes density units and multiplies every
class density by the same Jacobian. Converting mV to V multiplies a
one-dimensional density by 1000, so class posterior ratios stay the same.
Transform observations, means, variances and floors together. Keeping a numeric
variance floor while changing its physical unit changes the fitted model.

How are the mean and spread learned? Trace actual deviations first.

<!-- DRAWING D18 -->

Readings 1, 2 and 3 mV balance at their mean 2 mV. Their deviations are
`−1,0,1` mV. Squared-area tiles have areas `1,0,1` mV²; dividing total area
2 by three readings yields variance `2/3` mV². The Gaussian likelihood estimate
uses denominator `D`, called `ddof=0` in NumPy. The unbiased sample estimator
uses `D−1` for a different estimation question.

\[
\widehat\mu=\frac1D\sum_i x_i,\qquad
\widehat v=\frac1D\sum_i(x_i-\widehat\mu)^2.
\]

### Deeper: derive these estimates and inspect their gradients

For one class and feature, negative Gaussian log likelihood is

\[
J(\mu,v)=\frac D2\log(2\pi v)+\frac{\sum_i(x_i-\mu)^2}{2v},\qquad v>0.
\]

Write `x̄` for the sample mean. Expanding
`x_i−μ=(x_i−x̄)+(x̄−μ)` makes the cross term vanish because
`Σ(x_i−x̄)=0`. Therefore
`Σ(x_i−μ)²=Σ(x_i−x̄)²+D(μ−x̄)²`, minimized at `μ=x̄` for any positive
`v`. After substitution, differentiation gives
`∂J/∂v=D/(2v)−S/(2v²)`, where `S=Σ(x_i−x̄)²`. Setting it to zero gives
`v=S/D` when `S>0`.

For an unconstrained positive variance, use `η=log v`, so `v=e^η`.
Differentiating with respect to mean and log variance gives

\[
\frac{\partial J}{\partial\mu}=\frac{\sum_i(\mu-x_i)}{v},\qquad
\frac{\partial J}{\partial\eta}=\frac D2-\frac{\sum_i(x_i-\mu)^2}{2v}.
\]

The complete new program now combines these derivatives with section 3's
token-logit objective. Each function returns `(objective, gradient)`; SciPy's
`jac=True` consumes that pair. Central differences perturb one parameter at a
time to check the derivation independently.

**nb-likelihood-gradients.py — complete file.**

```python
"""Inspect likelihood coordinates on new tiny fixtures, not classifier tuning."""
import json
import numpy as np
from scipy.special import logsumexp, softmax
from scipy.optimize import minimize


def token_objective(z_free, counts):
    counts = np.asarray(counts, dtype=float)
    z_free = np.asarray(z_free, dtype=float)
    if (counts.ndim != 1 or len(counts) < 2 or z_free.shape != (len(counts) - 1,)
            or not np.isfinite(counts).all() or (counts < 0).any() or counts.sum() <= 0
            or not np.isfinite(z_free).all()):
        raise ValueError("Use nonnegative counts and K-1 finite logits; last logit is fixed at zero")
    z = np.r_[z_free, 0.]
    theta = softmax(z)
    value = counts.sum() * logsumexp(z) - counts @ z
    gradient = (counts.sum() * theta - counts)[:-1]
    return float(value), gradient


def gaussian_objective(parameters, readings):
    readings = np.asarray(readings, dtype=float)
    parameters = np.asarray(parameters, dtype=float)
    if (readings.ndim != 1 or not len(readings) or not np.isfinite(readings).all()
            or (np.abs(readings) > 1e6).any() or parameters.shape != (2,)
            or not np.isfinite(parameters).all() or not -50 <= parameters[1] <= 50):
        raise ValueError("Use finite bounded readings and (mean, log-variance) with eta in [-50,50]")
    mu, eta = parameters
    variance = np.exp(eta)
    residual = readings - mu
    squares = residual @ residual
    value = .5 * (len(readings) * (np.log(2 * np.pi) + eta) + squares / variance)
    gradient = np.array([-residual.sum() / variance, len(readings) / 2 - squares / (2 * variance)])
    if not np.isfinite(value) or not np.isfinite(gradient).all():
        raise ValueError("Likelihood exceeds arithmetic range")
    return float(value), gradient


def central_difference(function, point, h=1e-5):
    point = np.asarray(point, dtype=float)
    basis = np.eye(len(point)) * h
    return np.array([(function(point + step)[0] - function(point - step)[0]) / (2 * h)
                     for step in basis])


def summary(result):
    return {"success": bool(result.success), "status": int(result.status),
            "iterations": int(result.nit), "parameters": result.x.tolist(),
            "objective": float(result.fun), "gradient_norm": float(np.linalg.norm(result.jac)),
            "message": str(result.message)}


def main():
    counts = np.array([2., 1., 1.])
    token = lambda z: token_objective(z, counts)
    start = np.array([.2, -.1])
    analytic = token(start)[1]
    numeric = central_difference(token, start)
    assert np.allclose(analytic, numeric, atol=1e-9)
    fit = minimize(token, start, jac=True, method="BFGS", options={"gtol": 1e-10, "maxiter": 200})
    readings = np.array([1., 2., 3.])
    gaussian = lambda p: gaussian_objective(p, readings)
    point = np.array([1.5, .2])
    g_numeric = central_difference(gaussian, point)
    assert np.allclose(gaussian(point)[1], g_numeric, atol=1e-9)
    gfit = minimize(gaussian, point, jac=True, method="L-BFGS-B", bounds=[(None, None), (-50, 50)],
                    options={"gtol": 1e-10, "ftol": 1e-15, "maxiter": 200})
    capped = minimize(token, start, jac=True, method="BFGS", options={"maxiter": 1})
    z = np.r_[start, 0.]
    gauge_value = lambda v: counts.sum() * logsumexp(v) - counts @ v
    print(json.dumps({"counts": counts.tolist(), "token_start": start.tolist(),
                     "token_gradient": analytic.tolist(), "token_finite_difference": numeric.tolist(),
                     "common_shift_objective_difference": float(gauge_value(z + 7) - gauge_value(z)),
                     "token_fit": summary(fit), "token_theta": softmax(np.r_[fit.x, 0.]).tolist(),
                     "closed_form_theta": (counts / counts.sum()).tolist(),
                     "smoothed_mean_alpha_1": ((counts + 1) / (counts.sum() + 3)).tolist(),
                     "gaussian_gradient": gaussian(point)[1].tolist(),
                     "gaussian_finite_difference": g_numeric.tolist(), "gaussian_fit": summary(gfit),
                     "closed_form_mean_variance": [float(readings.mean()), float(readings.var())],
                     "capped_token_fit": summary(capped)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "counts": [
    2.0,
    1.0,
    1.0
  ],
  "token_start": [
    0.2,
    -0.1
  ],
  "token_gradient": [
    -0.43722466692073714,
    0.15773244157705868
  ],
  "token_finite_difference": [
    -0.43722466687157174,
    0.15773244155248278
  ],
  "common_shift_objective_difference": 3.552713678800501e-15,
  "token_fit": {
    "success": false,
    "status": 2,
    "iterations": 9,
    "parameters": [
      0.6931471824056854,
      5.248795953129256e-10
    ],
    "objective": 4.1588830833596715,
    "gradient_norm": 1.669402402588808e-09,
    "message": "Desired error not necessarily achieved due to precision loss."
  },
  "token_theta": [
    0.5000000003958252,
    0.24999999986769741,
    0.24999999973647752
  ],
  "closed_form_theta": [
    0.5,
    0.25,
    0.25
  ],
  "smoothed_mean_alpha_1": [
    0.42857142857142855,
    0.2857142857142857,
    0.2857142857142857
  ],
  "gaussian_gradient": [
    -1.2280961296169728,
    0.37424521451777504
  ],
  "gaussian_finite_difference": [
    -1.2280961296351478,
    0.3742452144628316
  ],
  "gaussian_fit": {
    "success": true,
    "status": 0,
    "iterations": 9,
    "parameters": [
      2.000000000003881,
      -0.40546510808162955
    ],
    "objective": 3.648617937451771,
    "gradient_norm": 4.346518253398844e-11,
    "message": "CONVERGENCE: NORM OF PROJECTED GRADIENT <= PGTOL"
  },
  "closed_form_mean_variance": [
    2.0,
    0.6666666666666666
  ],
  "capped_token_fit": {
    "success": false,
    "status": 1,
    "iterations": 1,
    "parameters": [
      0.6372246669207371,
      -0.25773244157705866
    ],
    "objective": 4.177534135440316,
    "gradient_norm": 0.1691725309831286,
    "message": "Maximum number of iterations has been exceeded."
  }
}
```

The token fixture `[2,1,1]` approaches `[.5,.25,.25]`, matching its closed form.
In this recorded BFGS run, the nine-iteration table is close to that optimum but
the optimizer reports precision loss (`success=False`, status 2) with gradient
norm about `1.67×10^−9`; keep that status beside the accurate-looking parameters.
The Gaussian fixture approaches mean 2 and variance `2/3`. The program reports
status, iterations, objective and gradient norm; its deliberately one-iteration
capped optimizer retains failure status rather than treating an output vector as
success. The printed smoothing mean `[3/7,2/7,2/7]` belongs to its declared
Dirichlet summary, not the unsmoothed objective optimum. Use closed-form class
statistics for ordinary NB fitting and the optimization route to investigate
objectives or changed assumptions.

If all readings are identical, `S=0`; decreasing `v` toward zero improves the
likelihood without attaining a positive-variance optimum. A singleton has the
same problem. An explicit positive additive floor keeps a supported density.

<!-- DRAWING D19 -->

The coincident readings sit at one mean. The unfloored density collapses while
the regularized density has a labelled positive width. Our scratch convention
uses `variance = raw M2 / class mass + absolute floor`. The floor is added to
a derived variance, not accumulated into raw squares. A value `10^−9 mV²` is
different from the library setting `var_smoothing=10^−9`.

GaussianNB computes `epsilon_` as its setting times the largest feature
variance, then adds that common epsilon. Inspect its units and scale. Constant
data can make a relative epsilon zero; different feature units can make its
global maximum inappropriate without representation/scaling choices. The
incremental library can refresh epsilon from each current batch. Section 8
will demonstrate that raw merge identities and epsilon bookkeeping are
different statements.

The original complete Gaussian fit below keeps its RandomState(42) 200-row
fixture and outputs unchanged.

**gaussian-fit.py — complete program.** Does the 99.5% training result measure performance on unseen data?

```python
import numpy as np
from scipy.special import logsumexp


class DiagonalGaussianNB:
    """Absolute variance floor in the declared squared feature units."""

    def __init__(self, variance_floor=1e-9):
        if not np.isfinite(variance_floor) or variance_floor <= 0:
            raise ValueError("Use a positive finite variance floor")
        self.variance_floor = variance_floor

    def fit(self, X, y):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y)
        if X.ndim != 2 or y.ndim != 1 or len(y) != len(X) or not len(X):
            raise ValueError("Use a nonempty matrix and one label per row")
        if not np.isfinite(X).all() or np.max(np.abs(X)) > 1e100:
            raise ValueError("Input exceeds the supported arithmetic range")
        self.classes_, counts = np.unique(y, return_counts=True)
        self.prior_ = counts / len(y)
        self.mean_ = np.array([X[y == c].mean(axis=0) for c in self.classes_])
        self.variance_ = (
            np.array([X[y == c].var(axis=0, ddof=0) for c in self.classes_])
            + self.variance_floor
        )
        return self

    def log_joint(self, X):
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[1] != self.mean_.shape[1] or not np.isfinite(X).all():
            raise ValueError("Use finite rows in the fitted feature schema")
        with np.errstate(over="ignore", invalid="ignore"):
            scores = np.log(self.prior_) - 0.5 * (
                np.log(2 * np.pi)
                + np.log(self.variance_)
                + (X[:, None, :] - self.mean_) ** 2 / self.variance_
            ).sum(axis=2)
        if not np.isfinite(scores).all():
            raise ValueError("Gaussian scores exceed the supported arithmetic range")
        return scores

    def predict_log_proba(self, X):
        scores = self.log_joint(X)
        return scores - logsumexp(scores, axis=1, keepdims=True)

    def predict(self, X):
        return self.classes_[self.predict_log_proba(X).argmax(axis=1)]


# Preserve the original lesson's RandomState draw sequence.
rng = np.random.RandomState(42)
X = np.vstack([rng.randn(100, 2) + [-2, -2], rng.randn(100, 2) + [2, 2]])
y = np.repeat([0, 1], 100)
model = DiagonalGaussianNB().fit(X, y)
print("priors:", model.prior_.tolist())
print("means:", model.mean_.round(4).tolist())
print("variances:", model.variance_.round(4).tolist())
print("training accuracy:", format(np.mean(model.predict(X) == y), ".4f"))
print("P(class | origin):", np.exp(model.predict_log_proba([[0, 0]])).round(6).tolist())
print(
    "normalization:",
    np.exp(model.predict_log_proba([[0, 0]])).sum(axis=1).round(12).tolist(),
)
```

Recorded original output (retained, not rerun):

```text
priors: [0.5, 0.5]
means: [[-2.1156, -1.966], [2.1282, 2.0435]]
variances: [[0.7259, 0.9877], [1.0699, 0.8651]]
training accuracy: 0.9950
P(class | origin): [[0.405819, 0.594181]]
normalization: [1.0]
```

It normalizes class scores at the origin, giving roughly `.5942` for class 1,
and has `.9950` training accuracy. These are recorded outcomes of that synthetic
fit. The explicit absolute floor and `ddof=0` estimates are its state contract;
its training result is separate from held-out usefulness.

What does independence remove for several continuous features?

<!-- DRAWING D20 -->

A covariance matrix stores marginal variances on its diagonal and paired
movement in its off-diagonal entries. Gaussian NB fixes off-diagonal entries
to zero and draws axis-aligned contours. A full covariance with nonzero
correlation rotates those contours. Both model pictures use equal feature
scales and declared positive-definite matrices; they are calculated shapes,
not samples from the old fit. Zero correlation makes the Gaussian comparison's
contours align, while leaving their parameter-estimation objectives distinct.

For diagonal Gaussians, subtract class scores feature by feature. Each
standardized squared distance is `Q_cj=(x_j−μ_cj)²/v_cj`. The log-odds equation is

\[
s_1-s_0=\log\frac{\pi_1}{\pi_0}
-\frac12\sum_j\left[\log\frac{v_{1j}}{v_{0j}}+Q_{1j}-Q_{0j}\right].
\]

The log variance ratio penalizes spread, while `Q` measures distance from the
mean relative to that spread. If the corresponding class variances are equal,
each quadratic `x_j²` term cancels and leaves a linear comparison. Unequal
variances generally give a quadratic boundary.

<!-- DRAWING D21 -->

With means `(−2,−2),(2,2)`, equal priors and common per-class variances `.5,2`
on both axes, expansion gives
`.75(x²+y²)+5(x+y)+6−log 4`. Completing the squares gives a circle centered
at `(−10/3,−10/3)` with radius approximately `4.008817`. The equal-variance
comparison instead gives line `x+y=0`. The live query shows its exact score
difference and the two distance/spread contributions, so the shaded region
and class label have a common cause. Neither a coarse pixel region nor a
colour legend replaces the analytic boundary.

**gaussian-boundaries.py — complete program.** Will fitting a logistic model force its coefficients to equal the known Gaussian model's boundary?

```python
import numpy as np
from scipy.stats import multivariate_normal
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss

center = np.array([-10 / 3, -10 / 3])
radius = np.sqrt(200 / 9 - (6 - np.log(4)) / 0.75)
angles = np.linspace(0, 2 * np.pi, 101)
boundary = center + radius * np.column_stack([np.cos(angles), np.sin(angles)])
difference = multivariate_normal.logpdf(
    boundary, [2, 2], 2 * np.eye(2)
) - multivariate_normal.logpdf(boundary, [-2, -2], 0.5 * np.eye(2))
print("analytic circle center/radius:", center.round(6).tolist(), round(radius, 6))
print("equal-score residual below 1e-12:", bool(np.max(np.abs(difference)) < 1e-12))

# Retained original 500-row fixture; one held-out split, not a benchmark.
X, y = make_classification(
    n_samples=500, n_features=10, n_informative=5, n_redundant=2, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(
    "test rows:",
    len(y_test),
    "majority baseline:",
    round(np.mean(y_test == np.bincount(y_train).argmax()), 4),
)
for model in [
    GaussianNB(),
    GaussianNB(var_smoothing=1e-8),
    LogisticRegression(C=1.0, max_iter=2000),
]:
    model.fit(X_train, y_train)
    prediction = model.predict(X_test)
    print(
        type(model).__name__,
        "accuracy",
        format(accuracy_score(y_test, prediction), ".4f"),
        "log loss",
        format(log_loss(y_test, model.predict_proba(X_test)), ".6f"),
    )
```

Recorded original output (retained, not rerun):

```text
analytic circle center/radius: [-3.333333, -3.333333] 4.008817
equal-score residual below 1e-12: True
test rows: 100 majority baseline: 0.5
GaussianNB accuracy 0.8500 log loss 0.449564
GaussianNB accuracy 0.8500 log loss 0.449564
LogisticRegression accuracy 0.8200 log loss 0.372676
```

The first part evaluates independent multivariate log densities on the
calculated circle; its residual is below `10^−12`. The second is the retained
separate 500-row synthetic comparison: Gaussian NB has higher held-out accuracy,
while logistic regression has lower log loss. They win different metrics on
that split. Shared full-covariance Gaussian discriminant analysis can also
induce a linear boundary; Gaussian NB restricts it to diagonal covariance.
An identical functional form does not make separately fitted coefficients equal.

Assess the conditional shape within each class. Two genuine class normals
can have a bimodal pooled histogram; a class itself can be skewed, multimodal
or heavy-tailed. A training-fitted transformation or richer likelihood addresses
that question. A familiar-looking pooled plot cannot decide it by itself.

## 6. Test the independence assumption

We can compute a posterior under any of these fitted likelihoods. What happens
if separate columns repeat the same evidence? Specify an exact population so
we can distinguish structural error from an unlucky small sample.

Look at one measured alarm copied into several columns beside genuinely
independent alarm measurements.

<!-- DRAWING D22 -->

Fault prevalence is `.2`. A positive alarm occurs with probability `.8` in
fault and `.4` in normal. The actual positive population masses are
`.2×.8=.16` and `.8×.4=.32`, so fault posterior is `.16/.48=1/3`.
Copying the measured alarm three times creates three equal columns but one
observation. The correct joint likelihood stays `.8` or `.4`; multiplying the
copies as independent makes them `.8³` and `.4³`.

\[
P(\mathrm{fault}\mid +,+,+)=\frac{.2\times.8}{.2\times.8+.8\times.4}=\frac13,
\qquad
\widehat P_{\rm ind}=\frac{.2\times.8^3}{.2\times.8^3+.8\times.4^3}=\frac23.
\]

The incorrect product now favors fault under equal costs. The actual optimal
rule always chooses normal, even on a positive alarm, with accuracy `.8`.
The copied rule chooses fault on positives and normal on negatives: its actual
accuracy is `.2×.8+.8×.6=.64`. Evaluate both rules under the actual joint law,
not the independent fiction used to produce the wrong score. At two positive
copies the product posterior is exactly `.5`; the stated tie policy chooses
normal. More observations estimating the same wrong factorization do not
remove this structural error.

The lab lets you change copy count and alarm sign, then inspect actual and
product likelihoods, posterior and population risk. A separate prior edit asks
how prevalence interacts with the duplicated ratio. Copies are deterministic
data-flow outputs. Independent sensors would instead be separate probabilistic
children with an explicitly appropriate conditional law.

We also want to penalize confidence errors, not only the final class. For one
binary outcome `y` and predicted fault probability `p`, take their displacement
`p−y` and square it.

<!-- DRAWING D35: single-outcome view -->

If a normal case has `y=0` and the model reports `p=2/3`, its squared error is
`4/9`; if a fault has `y=1`, the same probability gives `1/9`. Averaging these
errors over the actual case masses is **Brier loss**. Section 9 derives why
truthful probabilities minimize its expectation; here the one square makes
the name in the complete dependence program interpretable.

Can useful signal disappear from every individual feature? Change from copied
alarms to two fair switches whose relationship determines the label.

<!-- DRAWING D23 -->

The four equally likely records are `(0,0)→0`, `(0,1)→1`, `(1,0)→1`,
`(1,1)→0`. In either class, each switch has marginal presence probability
one half. A Bernoulli model built from those marginals assigns every point
the same class likelihood, although the pair determines the label exactly.
The corner picture exposes the missing interaction: “same” versus “different.”

Add a feature `A≠B` if both switches are available at prediction, or use a
tree/dependence model able to inspect the pair. Plain linear logistic regression
on A and B also cannot separate XOR, so “replace it with a discriminative
model” is an incomplete repair. State which relationship the alternative can
express, then preserve its fitting/evaluation boundary.

**dependence.py — complete program.** At two copies the model ties; at three it changes class. What actually changed in the observation?

```python
from fractions import Fraction as F
from itertools import product

prior = F(1, 5)
positive_rates = [F(2, 5), F(4, 5)]  # normal, fault
for copies in [1, 2, 3, 5]:
    correct = F(0)
    brier = F(0)
    probabilities = []
    for positive in [True, False]:
        likelihoods = positive_rates if positive else [1 - p for p in positive_rates]
        joint = [(1 - prior) * likelihoods[0], prior * likelihoods[1]]
        fake_joint = [
            (1 - prior) * likelihoods[0] ** copies,
            prior * likelihoods[1] ** copies,
        ]
        p = fake_joint[1] / sum(fake_joint)
        predicted = int(p > F(1, 2))  # Ties choose normal.
        correct += joint[predicted]
        brier += joint[0] * p**2 + joint[1] * (1 - p) ** 2
        probabilities.append(str(p))
    print(
        "copies",
        copies,
        "P(fault | +/-)",
        probabilities,
        "actual accuracy",
        str(correct),
        "Brier",
        format(float(brier), ".6f"),
    )
print(
    "true P(fault | +):",
    prior
    * positive_rates[1]
    / ((1 - prior) * positive_rates[0] + prior * positive_rates[1]),
)

rows = [(a, b, int(a != b)) for a, b in product([0, 1], repeat=2)]
for label in [0, 1]:
    selected = [(a, b) for a, b, y in rows if y == label]
    print(
        "XOR class",
        label,
        "feature-positive rates:",
        [str(F(sum(row[j] for row in selected), len(selected))) for j in [0, 1]],
    )
print("XOR NB has identical marginal models; the pair still determines the class.")
```

Recorded original output (retained, not rerun):

```text
copies 1 P(fault | +/-) ['1/3', '1/13'] actual accuracy 4/5 Brier 0.143590
copies 2 P(fault | +/-) ['1/2', '1/37'] actual accuracy 4/5 Brier 0.158218
copies 3 P(fault | +/-) ['2/3', '1/109'] actual accuracy 16/25 Brier 0.199310
copies 5 P(fault | +/-) ['8/9', '1/973'] actual accuracy 16/25 Brier 0.294733
true P(fault | +): 1/3
XOR class 0 feature-positive rates: ['1/2', '1/2']
XOR class 1 feature-positive rates: ['1/2', '1/2']
XOR NB has identical marginal models; the pair still determines the class.
```

The program enumerates the actual law with fractions, reports positive and
negative posteriors for 1, 2, 3 and 5 copies, and averages squared errors under
the actual population. The XOR calculation inspects within-class marginals
directly. These exact counterexamples show that ignored dependence can affect
class decisions, probability quality or both; dependence does not promise the
same failure on every dataset.

## 7. Understand what Complement NB changes

The copied and XOR examples tell us to match the representation to informative
structure. Another question arises in text when one class has few observations:
can a class be recognized through what the other classes fail to explain?
Complement NB changes the pool used to learn its weights.

Watch only other-class rows reach the selected class's accumulator.

<!-- DRAWING D24 -->

Three classes have aggregate counts `[8,2,0]`, `[1,7,2]`, `[0,2,8]`.
For class 0, exclude its own row and add rows 1 and 2: the complement is
`[1,9,10]`. With `α=1`, its composition is `[2,10,11]/23`. The three word
columns retain their identity while crossing the pooling routes; choosing a
different target excludes a different row. This is an accumulation diagram,
not a graph claiming the classes are random causes of one another.

\[
\bar C_{cj}=\sum_{r\ne c}C_{rj},\qquad
\bar\theta_{cj}=\frac{\bar C_{cj}+\alpha}{\sum_k\bar C_{ck}+V\alpha},
\qquad a_{cj}=-\log\bar\theta_{cj},\qquad s_c(x)=\sum_jx_ja_{cj}.
\]

The minus sign makes poor complement fit a large class score. Inspect the
query's actual multiplications and the optional row normalization.

<!-- DRAWING D25 -->

For query `[2,0,1]`, class 0 receives
`−2 log(2/23)−log(11/23)≈5.622293`. Classes 1 and 2 get about `2.814809`
and `3.702700`, so class 0 wins. A second normalization divides each weight
row by its absolute sum. Positive smoothing makes these weights nonnegative,
so this denominator is their ordinary sum. It rescales the whole row and can
change comparisons; it does not alter the query's counts.

**complement.py — complete program.** Does a larger negative log-complement score mean the document matches or contradicts that complement?

```python
import numpy as np
from scipy.special import logsumexp
from sklearn.naive_bayes import ComplementNB

# Three routing classes, one aggregate training document per class.
X = np.array([[8, 2, 0], [1, 7, 2], [0, 2, 8]])
y = np.array([0, 1, 2])
query = np.array([[2, 0, 1]])
complement_counts = X.sum(axis=0) - X
theta = (complement_counts + 1) / (complement_counts.sum(axis=1, keepdims=True) + 3)
print("complement counts:", complement_counts.tolist())
print("complement probabilities:", theta.round(6).tolist())
for normalize in [False, True]:
    weights = -np.log(theta)
    if normalize:
        weights /= weights.sum(axis=1, keepdims=True)
    scores = query @ weights.T
    model = ComplementNB(alpha=1, norm=normalize).fit(X, y)
    print(
        "norm",
        normalize,
        "scores:",
        scores.round(6).tolist(),
        "class:",
        model.predict(query).tolist(),
    )
    print("weights match:", bool(np.allclose(weights, model.feature_log_prob_)))
    print(
        "softmax matches:",
        bool(
            np.allclose(
                np.exp(scores - logsumexp(scores, axis=1, keepdims=True)),
                model.predict_proba(query),
            )
        ),
    )
print("These normalized scores are not a fitted generative P(class | document).")
```

Recorded original output (retained, not rerun):

```text
complement counts: [[1, 9, 10], [8, 4, 8], [9, 9, 2]]
complement probabilities: [[0.086957, 0.434783, 0.478261], [0.391304, 0.217391, 0.391304], [0.434783, 0.434783, 0.130435]]
norm False scores: [[5.622293, 2.814809, 3.7027]] class: [0]
weights match: True
softmax matches: True
norm True scores: [[1.401071, 0.827253, 1.0]] class: [0]
weights match: True
softmax matches: True
These normalized scores are not a fitted generative P(class | document).
```

The original complete program compares both variants with ordinary
`ComplementNB(norm=...)`. In the tested 1.9.1 implementation, the default is
`norm=False`. Its ordinary multiclass score omits the class prior; the
single-class branch is an exception. Its attribute `feature_log_prob_` stores
complement-derived weights, despite that familiar name. Softmax makes those
scores sum to one, but that alone does not make them a literal posterior of
the original class-generative multinomial fit. The new scratch reference uses
the same explicit score convention and stores `norm` in its exported state.
For one-word support, every negative log weight is zero; our normalized
reference leaves the row zero rather than dividing zero by zero.

Rare-class concerns are several different problems. Which one are we fixing?

<!-- DRAWING D26 -->

A deployment prior `.02` and likelihood ratio 9 yield posterior odds `9/49`
and probability `9/58≈.155172`. Changing only the prior to `.5` gives odds
9 and probability `.9`. More genuinely independent fault observations change
estimation evidence; copying four fault rows does not create it. A different
likelihood representation changes fitted feature evidence. A cost table changes
the action threshold: false-positive cost 1 and missed-fault cost 20 give
`1/21`, so `.155172` can justify a positive action while remaining a low
probability. Prior, evidence volume, likelihood and action are separate levers.

Multiplying all token counts in one class scales both its unsmoothed numerator
and denominator, leaving composition unchanged. With smoothing, the relative
pseudo-count influence changes; physical information still depends on independent
observations. Complement estimation, weight normalization and text transformations
are distinct empirical candidates introduced by Rennie and colleagues. None
learns every word relationship or settles every imbalance issue.

| Model | What its observation means | Parameter and diagnostic |
| --- | --- | --- |
| Multinomial | Repeated token counts at a given in-vocabulary length | One composition table per class; token denominator and OOV policy |
| Bernoulli | Completely observed binary slots | One presence rate per class/slot; absence and repetition policy |
| Categorical | One named choice per column | One category table per class/column; declared support |
| Gaussian | Continuous independent class normals | Means, variances and priors; units, tails and dependence |
| Complement | Linear text score from other-class composition | Pool exclusion, minus sign, optional row norm and probability interpretation |

A restrictive law has fewer parameters to estimate. Its value depends on which
information those restrictions preserve; no universal sample-count threshold
guarantees an NB advantage over a regularized discriminative model.

## 8. Fit and update the whole workflow

We can now choose a likelihood for an observation and diagnose several failures.
How do we preserve that meaning when vocabulary grows, fitting uses folds, or
messages arrive in batches? Start with the actual sparse object.

Follow the two stored entries of one message through CSR indexing and scoring.

<!-- DRAWING D27 -->

A compressed sparse row (CSR) matrix stores `data` values, their feature
`indices`, and `indptr` boundaries for each row. In the six-row new fixture,
the first row `[2,0,1]` stores values `[2,1]` at columns `[0,2]`; `indptr[0:2]`
is `[0,2]`. Those two entries select just two parameter columns. An empty row
has identical start and stop pointers and contributes only its prior in a token
model. Repeated sparse indices must be summed and sorted before interpreting
the row; storing the same token column twice does not create two different
feature identities.

### Construct and control the reusable discrete estimators

The complete `nb_discrete_core.py` below contains the shared sufficient-count
state and the four discrete scoring variants already taught. It uses NumPy
arrays for the dense class parameter table and SciPy CSR for input rows. It
delegates sparse storage and multiplication, while explicitly implementing
class pooling, smoothing, likelihoods, normalization and serialization.

`partial_fit` maps labels to sorted classes, builds a class-by-row sparse
membership matrix containing sample weights, and multiplies it by the input
counts. This gives the class-by-feature increment without allocating a dense
row-by-vocabulary matrix. Raw `class_count_` and `feature_count_` are accumulated;
`_refresh` derives smoothed parameters afterward. Finite nonnegative sample
weights change training mass, not the physical number of tokens in a new query.
Fractional query inputs are allowed as an explicitly declared scoring extension;
the integer multinomial event interpretation remains the one derived in section 3.

Multinomial scoring uses sparse matrix multiplication when log probabilities are
finite. At zero smoothing, it instead visits stored positive query entries to
avoid `0×−∞`, preserving the support distinction in D09. Bernoulli uses the
all-absent bias described just below. Categorical accumulation uses `np.add.at`
on each feature's differently sized category table. Complement subtracts each
target class from global pooled counts and explicitly stores the norm policy.

The shared schema is not a shape alone. It names words or fields in exact order;
categorical state additionally names every category in code order. Export stores
the convention version, sorted classes, raw counts, priors, smoothing and schema.
Reload validates counts and recomputes derived arrays. It does not serialize
unsafe pickle or turn `−∞` into silent JSON null. `predict_log_proba` normalizes
each class row; `predict` chooses the first sorted class on an exact tie.

**nb_discrete_core.py — complete file.**

```python
"""Sparse sufficient-count NB references. Importing this module runs no fits.

Counts may be fractional for a declared scoring extension; integer inputs have
the event interpretation. Weights change training mass, not physical events.
"""
import numpy as np
from scipy import sparse


def normalize(scores):
    scores = np.asarray(scores, dtype=float)
    if scores.ndim != 2 or np.isnan(scores).any() or np.isposinf(scores).any():
        raise ValueError("Use a row-by-class matrix of finite scores or -inf")
    maximum = scores.max(axis=1, keepdims=True)
    if np.isneginf(maximum).any():
        raise ValueError("Every class has zero support for a query row")
    with np.errstate(over="ignore", invalid="ignore"):
        shifted = scores - maximum
    if np.isneginf(shifted[np.isfinite(scores)]).any():
        raise ValueError("Finite score difference exceeds arithmetic range")
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))


def count_matrix(X, binary=False):
    X = sparse.csr_matrix(X, dtype=float, copy=True)
    X.sum_duplicates()
    X.sort_indices()
    X.eliminate_zeros()
    if not X.shape[0] or not X.shape[1] or not np.isfinite(X.data).all():
        raise ValueError("Use a nonempty finite sample-by-feature matrix")
    if (X.data < 0).any() or (X.data > 1e6).any():
        raise ValueError("Count/scoring entries must lie in [0, 1e6]")
    if binary and not np.isin(X.data, [0, 1]).all():
        raise ValueError("Bernoulli input must already be binary")
    return X


def weights_and_labels(y, n, sample_weight):
    y = np.asarray(y)
    w = np.ones(n) if sample_weight is None else np.asarray(sample_weight, dtype=float)
    if y.ndim != 1 or len(y) != n or w.shape != (n,):
        raise ValueError("One label and weight are required per row")
    if not np.isfinite(w).all() or (w < 0).any() or (w > 1e6).any() or w.sum() <= 0:
        raise ValueError("Use finite nonnegative weights with positive total")
    if y.dtype.kind not in "biuUS" or (y.dtype.kind in "US" and (y == "").any()):
        raise ValueError("Class labels must be integers or nonempty strings")
    return y, w


class DiscreteModel:
    family = "abstract"

    def __init__(self, alpha=1., schema=None, priors=None):
        if not np.isfinite(alpha) or not 0 <= alpha <= 100:
            raise ValueError("Use alpha in [0, 100]")
        self.alpha = float(alpha)
        self.schema = None if schema is None else list(schema)
        self.priors = None if priors is None else np.asarray(priors, dtype=float)

    def _matrix(self, X):
        return count_matrix(X, binary=self.family == "bernoulli")

    def _allocate(self, k, d):
        self.feature_count_ = np.zeros((k, d))

    def _start(self, X, classes):
        self.classes_ = np.unique(np.asarray(classes))
        if len(self.classes_) == 0:
            raise ValueError("Supply the full nonempty class list on first partial_fit")
        weights_and_labels(self.classes_, len(self.classes_), None)
        self.schema_ = list(self.schema if self.schema is not None else
                            ["feature_" + str(j) for j in range(X.shape[1])])
        if (len(self.schema_) != X.shape[1] or len(set(self.schema_)) != X.shape[1]
                or any(not isinstance(s, str) or not s for s in self.schema_)):
            raise ValueError("Supply one distinct nonempty name per feature")
        self.class_count_ = np.zeros(len(self.classes_))
        self._allocate(len(self.classes_), X.shape[1])

    def _check_schema(self, X, schema=None):
        if X.shape[1] != len(self.schema_) or (schema is not None and list(schema) != self.schema_):
            raise ValueError("Feature identity/order differs from the fitted schema")

    def _refresh_prior(self):
        if self.priors is None:
            self.prior_ = self.class_count_ / self.class_count_.sum()
        else:
            p = self.priors
            if (p.shape != self.class_count_.shape or not np.isfinite(p).all()
                    or (p < 0).any() or not np.isclose(p.sum(), 1., atol=1e-12, rtol=0)):
                raise ValueError("One normalized nonnegative prior per sorted class")
            self.prior_ = p.copy()
        with np.errstate(divide="ignore"):
            self.class_log_prior_ = np.log(self.prior_)

    def fit(self, X, y, sample_weight=None):
        if hasattr(self, "classes_"):
            del self.classes_
        return self.partial_fit(X, y, classes=np.unique(y), sample_weight=sample_weight)

    def partial_fit(self, X, y, classes=None, sample_weight=None):
        X = self._matrix(X)
        y, w = weights_and_labels(y, X.shape[0], sample_weight)
        if not hasattr(self, "classes_"):
            if classes is None:
                raise ValueError("First partial_fit requires the complete class list")
            self._start(X, classes)
        self._check_schema(X)
        if classes is not None and not np.array_equal(np.unique(classes), self.classes_):
            raise ValueError("The class schema is fixed after initialization")
        mapping = {c: i for i, c in enumerate(self.classes_)}
        if not all(c in mapping for c in y):
            raise ValueError("A training label is outside the declared classes")
        inverse = np.array([mapping[c] for c in y])
        increment = np.bincount(inverse, weights=w, minlength=len(self.classes_))
        membership = sparse.csr_matrix((w, (inverse, np.arange(len(y)))),
                                       shape=(len(self.classes_), len(y)))
        self._accumulate(X, membership, inverse, w)
        self.class_count_ += increment
        self._refresh_prior()
        self._refresh()
        return self

    def _accumulate(self, X, membership, inverse, w):
        self.feature_count_ += (membership @ X).toarray()
        if not np.isfinite(self.feature_count_).all():
            raise ValueError("Sufficient counts exceed floating-point range")

    def predict_log_proba(self, X, schema=None):
        return normalize(self.log_joint(X, schema=schema))

    def predict_proba(self, X, schema=None):
        return np.exp(self.predict_log_proba(X, schema=schema))

    def predict(self, X, schema=None):
        # Sorted-class argmax chooses the first class on an exact tie.
        return self.classes_[self.predict_log_proba(X, schema=schema).argmax(axis=1)]

    def export_state(self):
        state = {"format": "nb-discrete-v1", "family": self.family,
                 "alpha": self.alpha, "schema": self.schema_, "classes": self.classes_.tolist(),
                 "class_count": self.class_count_.tolist(),
                 "priors": None if self.priors is None else self.priors.tolist()}
        if self.family == "categorical":
            state.update(categories=self.categories,
                         category_count=[a.tolist() for a in self.category_count_])
        else:
            state["feature_count"] = self.feature_count_.tolist()
        if self.family == "complement":
            state["norm"] = self.norm
        return state

    @classmethod
    def from_state(cls, state, expected_schema=None):
        if state.get("format") != "nb-discrete-v1" or state.get("family") != cls.family:
            raise ValueError("State format/family does not match the estimator")
        names = state["schema"]
        if expected_schema is not None and list(expected_schema) != names:
            raise ValueError("State has stale feature identity/order")
        extras = {"categories": state["categories"]} if cls.family == "categorical" else {}
        if cls.family == "complement":
            extras["norm"] = state["norm"]
        obj = cls(alpha=state["alpha"], schema=names, priors=state["priors"], **extras)
        d = len(names)
        obj._start(obj._matrix(np.zeros((1, d))), state["classes"])
        if obj.classes_.tolist() != state["classes"]:
            raise ValueError("Saved classes must retain sorted unique order")
        count = np.asarray(state["class_count"], dtype=float)
        if (count.shape != obj.class_count_.shape or not np.isfinite(count).all()
                or (count < 0).any() or count.sum() <= 0):
            raise ValueError("Invalid raw class counts")
        obj.class_count_ = count.copy()
        if cls.family == "categorical":
            arrays = [np.asarray(a, dtype=float) for a in state["category_count"]]
            if len(arrays) != d or any(a.shape != b.shape for a, b in zip(arrays, obj.category_count_)):
                raise ValueError("Invalid category shapes")
            if any(not np.isfinite(a).all() or (a < 0).any() or
                   not np.allclose(a.sum(axis=1), count, atol=1e-9, rtol=1e-12) for a in arrays):
                raise ValueError("Category counts must sum to class mass")
            obj.category_count_ = [a.copy() for a in arrays]
        else:
            a = np.asarray(state["feature_count"], dtype=float)
            if a.shape != obj.feature_count_.shape or not np.isfinite(a).all() or (a < 0).any():
                raise ValueError("Invalid feature counts")
            if cls.family == "bernoulli" and (a > count[:, None] + 1e-9).any():
                raise ValueError("Presence counts exceed document mass")
            obj.feature_count_ = a.copy()
        obj._refresh_prior()
        obj._refresh()
        return obj


class MultinomialModel(DiscreteModel):
    family = "multinomial"

    def _refresh(self):
        smoothed = self.feature_count_ + self.alpha
        totals = smoothed.sum(axis=1, keepdims=True)
        if (totals <= 0).any() or not np.isfinite(totals).all():
            raise ValueError("No token mass in a class: positive smoothing is required")
        self.theta_ = smoothed / totals
        with np.errstate(divide="ignore"):
            self.feature_log_prob_ = np.log(self.theta_)

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        if np.isfinite(self.feature_log_prob_).all():
            return np.asarray(X @ self.feature_log_prob_.T) + self.class_log_prior_
        # At alpha=0, only positive stored entries multiply log(theta).
        scores = np.empty((X.shape[0], len(self.classes_)))
        for row in range(X.shape[0]):
            start, stop = X.indptr[row:row + 2]
            scores[row] = self.class_log_prior_ + (
                self.feature_log_prob_[:, X.indices[start:stop]] * X.data[start:stop]).sum(axis=1)
        return scores


class BernoulliModel(DiscreteModel):
    family = "bernoulli"

    def __init__(self, alpha=1., schema=None, priors=None):
        super().__init__(alpha, schema, priors)
        if alpha <= 0:
            raise ValueError("This sparse absence implementation requires positive alpha")

    def _refresh(self):
        self.theta_ = (self.feature_count_ + self.alpha) / (self.class_count_[:, None] + 2 * self.alpha)
        if not ((self.theta_ > 0) & (self.theta_ < 1)).all():
            raise ValueError("Presence probabilities rounded to an unsupported endpoint")
        self.feature_log_prob_ = np.log(self.theta_)
        self.absent_log_ = np.log1p(-self.theta_)
        self.bias_ = self.class_log_prior_ + self.absent_log_.sum(axis=1)
        self.log_ratio_ = self.feature_log_prob_ - self.absent_log_

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        return np.asarray(X @ self.log_ratio_.T) + self.bias_


class CategoricalModel(DiscreteModel):
    family = "categorical"

    def __init__(self, categories, alpha=1., schema=None, priors=None):
        super().__init__(alpha, schema, priors)
        self.categories = [list(c) for c in categories]
        if not self.categories or any(not c or len(set(c)) != len(c) or
                                     any(not isinstance(t, str) or not t for t in c) for c in self.categories):
            raise ValueError("Name each feature's distinct category labels in code order")

    def _matrix(self, X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not X.shape[0] or X.shape[1] != len(self.categories)
                or not np.isfinite(X).all() or not np.equal(X, np.floor(X)).all()):
            raise ValueError("Use finite integer category codes in a rectangular matrix")
        if any((X[:, j] < 0).any() or (X[:, j] >= len(c)).any() for j, c in enumerate(self.categories)):
            raise ValueError("Category outside declared support; map to reserved other explicitly")
        return X.astype(int)

    def _allocate(self, k, d):
        self.category_count_ = [np.zeros((k, len(c))) for c in self.categories]

    def _accumulate(self, X, membership, inverse, w):
        for j, counts in enumerate(self.category_count_):
            np.add.at(counts, (inverse, X[:, j]), w)

    def _refresh(self):
        self.feature_log_prob_ = []
        for counts in self.category_count_:
            denominator = self.class_count_[:, None] + self.alpha * counts.shape[1]
            if (denominator <= 0).any():
                raise ValueError("No categorical observations: use positive smoothing")
            with np.errstate(divide="ignore"):
                self.feature_log_prob_.append(np.log((counts + self.alpha) / denominator))

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        scores = np.tile(self.class_log_prior_, (len(X), 1))
        for j, table in enumerate(self.feature_log_prob_):
            scores += table[:, X[:, j]].T
        return scores


class ComplementModel(MultinomialModel):
    family = "complement"

    def __init__(self, alpha=1., schema=None, priors=None, norm=False):
        super().__init__(alpha, schema, priors)
        if alpha <= 0 or not isinstance(norm, bool):
            raise ValueError("Use positive smoothing and a Boolean norm policy")
        self.norm = norm

    def _refresh(self):
        complement = self.feature_count_.sum(axis=0) - self.feature_count_
        smoothed = complement + self.alpha
        self.theta_ = smoothed / smoothed.sum(axis=1, keepdims=True)
        self.feature_log_prob_ = -np.log(self.theta_)
        if self.norm:
            total = self.feature_log_prob_.sum(axis=1, keepdims=True)
            # One-word support: all-zero weights stay zero, not 0/0.
            self.feature_log_prob_ = np.divide(self.feature_log_prob_, total,
                out=np.zeros_like(self.feature_log_prob_), where=total > 0)

    def log_joint(self, X, schema=None):
        X = self._matrix(X)
        self._check_schema(X, schema)
        scores = np.asarray(X @ self.feature_log_prob_.T)
        if len(self.classes_) == 1:
            scores += self.class_log_prior_
        return scores  # Complement scores; normalized output is not a generative posterior.
```

This reusable file imports silently; run its adjacent comparison driver for the recorded outputs.

The lower-level validation helpers keep rectangular finite inputs, feature
identity, declared support and weights separate from the algorithm. Counts and
weights are bounded at `10^6` per entry and smoothing at 100 in this reference.
The sparse Bernoulli implementation requires positive smoothing so every
presence probability remains strictly between zero and one. It is an
inspectable implementation with declared ranges, rather than a clone of every
sklearn estimator feature.

Why does sparse Bernoulli prediction still include all absent words? Begin
with the score of the all-absent row, then replace its terms only where a word
is present:

\[
\beta_c=\log\pi_c+\sum_j\log(1-\phi_{cj}),\qquad
u_{cj}=\log\phi_{cj}-\log(1-\phi_{cj}),\qquad
s_c(b)=\beta_c+\sum_{j:b_j=1}u_{cj}.
\]

Each added ratio removes that slot's absence contribution and adds its presence
contribution. `log1p(-φ)` computes small absence probabilities accurately.
Precomputing `bias_` and `log_ratio_` costs `O(KV)`; a query visits its present
entries in `O(Kq+K)`. Sparsity skips zero storage, not zero evidence.

The adjacent ordinary-library driver now maps exactly the same rows, weights,
class order and query to each corresponding estimator. Save both files together
and launch `python nb_discrete_library.py`.

**nb_discrete_library.py — complete file.**

```python
"""Run beside nb_discrete_core.py. New fixtures; no historical lesson replay."""
import json
import warnings
import numpy as np
import scipy
import sklearn
from scipy import sparse
from sklearn.naive_bayes import MultinomialNB, BernoulliNB, CategoricalNB, ComplementNB
from nb_discrete_core import (
    MultinomialModel, BernoulliModel, CategoricalModel, ComplementModel,
)


def compare(name, scratch, ordinary, X, y, query, weights=None):
    scratch.fit(X, y, sample_weight=weights)
    ordinary.fit(X, y, sample_weight=weights)
    p = scratch.predict_log_proba(query)
    reference = ordinary.predict_log_proba(query)
    restored = type(scratch).from_state(json.loads(json.dumps(scratch.export_state())),
                                       expected_schema=scratch.schema_)
    assert np.array_equal(scratch.classes_, ordinary.classes_)
    assert np.allclose(p, reference, atol=2e-12, rtol=1e-12)
    assert np.allclose(p, restored.predict_log_proba(query), atol=1e-13, rtol=1e-13)
    return {"family": name, "classes": scratch.classes_.tolist(),
            "probabilities": np.exp(p).tolist(),
            "max_library_log_difference": float(np.max(np.abs(p - reference))),
            "state_reload_equal": True,
            "class_mass": scratch.class_count_.tolist()}


def main():
    X = sparse.csr_matrix([[2, 0, 1], [0, 1, 0], [1, 0, 0],
                          [0, 2, 1], [1, 1, 0], [0, 0, 2]])
    y = np.array([0, 1, 0, 1, 0, 1])
    query = sparse.csr_matrix([[1, 0, 1], [0, 0, 0], [0, 2, 0]])
    schema = ["A", "B", "C"]
    batch = MultinomialModel(alpha=.5, schema=schema).fit(X, y)
    online = MultinomialModel(alpha=.5, schema=schema)
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1])
    assert np.array_equal(batch.feature_count_, online.feature_count_)
    assert np.allclose(batch.predict_proba(query), online.predict_proba(query))
    results = {"versions": {"numpy": np.__version__, "scipy": scipy.__version__,
                             "sklearn": sklearn.__version__},
               "sparse_arrays": {"data": X.data.tolist(), "indices": X.indices.tolist(),
                                 "indptr": X.indptr.tolist()},
               "chunks": [2, 3, 1], "raw_counts": batch.feature_count_.tolist(),
               "theta": batch.theta_.tolist(),
               "query_probabilities": batch.predict_proba(query).tolist(),
               "batch_online_equal": True, "comparisons": []}
    w = np.array([.5, 2., 1., .75, 1.25, 1.5])
    for weights in (None, w):
        label = "unweighted" if weights is None else "weighted"
        results["comparisons"].append(compare("multinomial_" + label,
            MultinomialModel(alpha=.5, schema=schema),
            MultinomialNB(alpha=.5, force_alpha=True), X, y, query, weights))
        B = X.copy()
        B.data[:] = 1
        Q = query.copy()
        Q.data[:] = 1
        results["comparisons"].append(compare("bernoulli_" + label,
            BernoulliModel(alpha=.5, schema=schema),
            BernoulliNB(alpha=.5, force_alpha=True, binarize=None), B, y, Q, weights))
        for norm in (False, True):
            results["comparisons"].append(compare("complement_" + label + "_norm_" + str(norm),
                ComplementModel(alpha=.5, schema=schema, norm=norm),
                ComplementNB(alpha=.5, force_alpha=True, norm=norm), X, y, query, weights))
    categories = [["idle", "busy", "other"], ["wired", "radio"]]
    C = np.array([[0, 0], [1, 1], [0, 1], [1, 0], [2, 0], [1, 1]])
    for weights in (None, w):
        results["comparisons"].append(compare("categorical_" + ("unweighted" if weights is None else "weighted"),
            CategoricalModel(categories, alpha=.5, schema=["status", "link"]),
            CategoricalNB(alpha=.5, force_alpha=True, min_categories=[3, 2]),
            C, y, [[2, 1], [0, 0]], weights))
    unsupported = MultinomialModel(alpha=0, schema=["left", "right"]).fit([[1, 0], [0, 1]], [0, 1])
    results["alpha_zero_empty"] = unsupported.predict_proba([[0, 0]]).tolist()
    results["alpha_zero_supported"] = unsupported.predict_log_proba([[1, 0]]).tolist()
    # JSON encodes zero-probability log output with an explicit string, not null.
    results["alpha_zero_supported"] = [["-inf" if np.isneginf(v) else v
                                         for v in row] for row in results["alpha_zero_supported"]]
    try:
        unsupported.predict_proba([[1, 1]])
    except ValueError:
        results["alpha_zero_unsupported"] = "undefined"
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        native = MultinomialNB(alpha=0, force_alpha=True).fit([[1, 0], [0, 1]], [0, 1])
        raw = native.predict_proba([[1, 0], [0, 0]])
    results["alpha_zero_library"] = {"finite": np.isfinite(raw).tolist(),
                                      "warnings": [str(c.message) for c in caught]}
    one = ComplementModel(alpha=1, norm=True, schema=["only"]).fit([[1], [2]], [0, 1])
    results["one_word_norm_policy"] = {"weights": one.feature_log_prob_.tolist(),
                                        "probabilities": one.predict_proba([[1]]).tolist()}
    results["changed_alpha_2"] = MultinomialModel(alpha=2, schema=schema).fit(X, y).predict_proba(query).tolist()
    print(json.dumps(results, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "versions": {
    "numpy": "2.3.5",
    "scipy": "1.18.1",
    "sklearn": "1.9.1"
  },
  "sparse_arrays": {
    "data": [
      2,
      1,
      1,
      1,
      2,
      1,
      1,
      1,
      2
    ],
    "indices": [
      0,
      2,
      1,
      0,
      1,
      2,
      0,
      1,
      2
    ],
    "indptr": [
      0,
      2,
      3,
      4,
      6,
      8,
      9
    ]
  },
  "chunks": [
    2,
    3,
    1
  ],
  "raw_counts": [
    [
      4.0,
      1.0,
      1.0
    ],
    [
      0.0,
      3.0,
      3.0
    ]
  ],
  "theta": [
    [
      0.6,
      0.2,
      0.2
    ],
    [
      0.06666666666666667,
      0.4666666666666667,
      0.4666666666666667
    ]
  ],
  "query_probabilities": [
    [
      0.7941176470588235,
      0.20588235294117646
    ],
    [
      0.5,
      0.5
    ],
    [
      0.15517241379310345,
      0.8448275862068966
    ]
  ],
  "batch_online_equal": true,
  "comparisons": [
    {
      "family": "multinomial_unweighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.7941176470588235,
          0.20588235294117646
        ],
        [
          0.5,
          0.5
        ],
        [
          0.15517241379310345,
          0.8448275862068966
        ]
      ],
      "max_library_log_difference": 4.440892098500626e-16,
      "state_reload_equal": true,
      "class_mass": [
        3.0,
        3.0
      ]
    },
    {
      "family": "bernoulli_unweighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.875,
          0.12499999999999997
        ],
        [
          0.28409090909090906,
          0.7159090909090909
        ],
        [
          0.12499999999999997,
          0.875
        ]
      ],
      "max_library_log_difference": 4.440892098500626e-16,
      "state_reload_equal": true,
      "class_mass": [
        3.0,
        3.0
      ]
    },
    {
      "family": "complement_unweighted_norm_False",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.7941176470588235,
          0.20588235294117646
        ],
        [
          0.5,
          0.5
        ],
        [
          0.15517241379310348,
          0.8448275862068966
        ]
      ],
      "max_library_log_difference": 8.326672684688674e-17,
      "state_reload_equal": true,
      "class_mass": [
        3.0,
        3.0
      ]
    },
    {
      "family": "complement_unweighted_norm_True",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.5625317596785206,
          0.4374682403214793
        ],
        [
          0.5,
          0.5
        ],
        [
          0.37686246059728284,
          0.6231375394027172
        ]
      ],
      "max_library_log_difference": 1.1102230246251565e-16,
      "state_reload_equal": true,
      "class_mass": [
        3.0,
        3.0
      ]
    },
    {
      "family": "multinomial_weighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.6741837248629954,
          0.3258162751370046
        ],
        [
          0.3928571428571429,
          0.6071428571428572
        ],
        [
          0.18329633307395674,
          0.8167036669260432
        ]
      ],
      "max_library_log_difference": 2.220446049250313e-16,
      "state_reload_equal": true,
      "class_mass": [
        2.75,
        4.25
      ]
    },
    {
      "family": "bernoulli_weighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.8075704065924115,
          0.1924295934075886
        ],
        [
          0.17052897139429196,
          0.829471028605708
        ],
        [
          0.09966770684099872,
          0.9003322931590013
        ]
      ],
      "max_library_log_difference": 4.440892098500626e-16,
      "state_reload_equal": true,
      "class_mass": [
        2.75,
        4.25
      ]
    },
    {
      "family": "complement_weighted_norm_False",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.7617843372994487,
          0.23821566270055133
        ],
        [
          0.5,
          0.5
        ],
        [
          0.2575284986764258,
          0.7424715013235742
        ]
      ],
      "max_library_log_difference": 2.220446049250313e-16,
      "state_reload_equal": true,
      "class_mass": [
        2.75,
        4.25
      ]
    },
    {
      "family": "complement_weighted_norm_True",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.5429370299781497,
          0.45706297002185037
        ],
        [
          0.5,
          0.5
        ],
        [
          0.41475457003591765,
          0.5852454299640822
        ]
      ],
      "max_library_log_difference": 2.220446049250313e-16,
      "state_reload_equal": true,
      "class_mass": [
        2.75,
        4.25
      ]
    },
    {
      "family": "categorical_unweighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.6428571428571429,
          0.35714285714285704
        ],
        [
          0.8928571428571429,
          0.1071428571428571
        ]
      ],
      "max_library_log_difference": 6.661338147750939e-16,
      "state_reload_equal": true,
      "class_mass": [
        3.0,
        3.0
      ]
    },
    {
      "family": "categorical_weighted",
      "classes": [
        0,
        1
      ],
      "probabilities": [
        [
          0.6166536784334533,
          0.38334632156654674
        ],
        [
          0.8982121976303519,
          0.10178780236964816
        ]
      ],
      "max_library_log_difference": 1.1102230246251565e-16,
      "state_reload_equal": true,
      "class_mass": [
        2.75,
        4.25
      ]
    }
  ],
  "alpha_zero_empty": [
    [
      0.5,
      0.5
    ]
  ],
  "alpha_zero_supported": [
    [
      0.0,
      "-inf"
    ]
  ],
  "alpha_zero_unsupported": "undefined",
  "alpha_zero_library": {
    "finite": [
      [
        false,
        false
      ],
      [
        false,
        false
      ]
    ],
    "warnings": [
      "divide by zero encountered in log",
      "invalid value encountered in matmul",
      "divide by zero encountered in log"
    ]
  },
  "one_word_norm_policy": {
    "weights": [
      [
        0.0
      ],
      [
        0.0
      ]
    ],
    "probabilities": [
      [
        0.5,
        0.5
      ]
    ]
  },
  "changed_alpha_2": [
    [
      0.6428571428571429,
      0.3571428571428571
    ],
    [
      0.5,
      0.5
    ],
    [
      0.2647058823529412,
      0.7352941176470589
    ]
  ]
}
```

Its six rows have labels `[0,1,0,1,0,1]` and raw class counts `[3,3]`.
The class token rows are `[4,1,1]` and `[0,3,3]`. At `α=.5`, compositions are
`[.6,.2,.2]` and `[1/15,7/15,7/15]`. For query `[1,0,1]`, class probabilities
are `[27/34,7/34]≈[.794118,.205882]`. The empty count row gives `[.5,.5]`.
Chunks of 2, 3 and 1 yield the same raw integer counts and probabilities as a
single batch. JSON roundtrip keeps schema and scores.

The ten matched comparisons cover weighted and unweighted Multinomial,
Bernoulli, Categorical, and both Complement norms. The maximum differences in
normalized log values are at floating-point rounding scale, with class arrays
aligned. The weighted class masses `[2.75,4.25]` are not document counts; their
interpretation is weighted evidence. `force_alpha=True`, `binarize=None`,
`min_categories` and `norm` make the semantics explicit. Changing the driver's
α to 2 changes the first query posterior to `[9/14,5/14]≈[.642857,.357143]`.

At `α=0` the scratch route handles empty, supported and wholly unsupported
events deliberately. The tested ordinary Multinomial implementation can instead
produce nonfinite arithmetic from dense zero multiplication; the receipt retains
its divide-by-zero/invalid-matmul warnings. This boundary comparison is a
documented implementation difference, not approximate equivalence at every α.

### Keep fitted transforms inside their allowed rows

What if held-out words influence the vocabulary before fitting? Then the
representation has already learned from its evaluation rows.

<!-- DRAWING D28 -->

The retained twenty-message program first splits raw text into fourteen training
and six test messages. Three internal training folds each fit their own
CountVectorizer and class table inside a Pipeline, then score only that fold's
held-out rows. Those folds choose α; the chosen pipeline finally fits all
fourteen training messages and sees the six test messages only for evaluation.
The diagram's blocked fit edges are the protocol, not extra runtime gates.

**text-pipeline.py — complete program.** An unseen test word is ignored by this fitted vectorizer. How does that differ from a zero word likelihood inside its vocabulary?

```python
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.naive_bayes import MultinomialNB, BernoulliNB, ComplementNB
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, log_loss, confusion_matrix

spam = [
    "free money win prize cash",
    "win cash prize free money",
    "claim your free prize now",
    "money back guarantee free offer",
    "free credit score win now",
    "earn money fast free win",
    "click here free offer cash",
    "big cash prize free today",
    "free gift claim now win",
    "lottery winner claim free prize",
]
ham = [
    "team meeting agenda tomorrow",
    "quarterly report please review",
    "project update attached report",
    "schedule review meeting please",
    "budget review report quarterly",
    "agenda for team standup",
    "report due next quarter",
    "project deadline meeting review",
    "please review attached agenda",
    "team offsite agenda tomorrow",
]
texts = spam + ham
labels = np.array([1] * 10 + [0] * 10)

train_text, test_text, y_train, y_test = train_test_split(
    texts, labels, test_size=0.3, random_state=7, stratify=labels
)
inner = StratifiedKFold(n_splits=3, shuffle=True, random_state=19)
search = GridSearchCV(
    Pipeline([("words", CountVectorizer()), ("nb", MultinomialNB())]),
    {"nb__alpha": [0.5, 1.0, 2.0]},
    scoring="neg_log_loss",
    cv=inner,
    refit=True,
)
search.fit(train_text, y_train)
best = search.best_estimator_
print("training/test rows:", len(y_train), len(y_test))
print("selected alpha using training folds:", search.best_params_["nb__alpha"])
print("final training-only vocabulary:", len(best.named_steps["words"].vocabulary_))
baseline = DummyClassifier(strategy="prior").fit(np.zeros((len(y_train), 1)), y_train)
for name, model in [
    ("prior baseline", baseline),
    ("selected MNB", best),
    (
        "fixed Bernoulli",
        Pipeline([("words", CountVectorizer()), ("nb", BernoulliNB())]).fit(
            train_text, y_train
        ),
    ),
    (
        "fixed Complement",
        Pipeline([("words", CountVectorizer()), ("nb", ComplementNB())]).fit(
            train_text, y_train
        ),
    ),
]:
    inputs = np.zeros((len(y_test), 1)) if name == "prior baseline" else test_text
    print(
        name,
        "accuracy",
        format(accuracy_score(y_test, model.predict(inputs)), ".4f"),
        "log loss",
        format(log_loss(y_test, model.predict_proba(inputs)), ".6f"),
    )
print(
    "selected MNB confusion [true rows/predicted columns, ham/spam]:",
    confusion_matrix(y_test, best.predict(test_text), labels=[0, 1]).tolist(),
)
probe = ["free money win prize", "zephyronic qxz", ""]
print(
    "probe nonzero feature counts:",
    best.named_steps["words"].transform(probe).getnnz(axis=1).tolist(),
)
print("probe probabilities [ham, spam]:", best.predict_proba(probe).round(6).tolist())
print("A six-message test is a workflow check, not evidence for deployment.")
```

Recorded original output (retained, not rerun):

```text
training/test rows: 14 6
selected alpha using training folds: 0.5
final training-only vocabulary: 32
prior baseline accuracy 0.5000 log loss 0.693147
selected MNB accuracy 1.0000 log loss 0.029779
fixed Bernoulli accuracy 1.0000 log loss 0.008339
fixed Complement accuracy 1.0000 log loss 0.059149
selected MNB confusion [true rows/predicted columns, ham/spam]: [[3, 0], [0, 3]]
probe nonzero feature counts: [4, 0, 0]
probe probabilities [ham, spam]: [[0.000165, 0.999835], [0.5, 0.5], [0.5, 0.5]]
A six-message test is a workflow check, not evidence for deployment.
```

The original output selects `α=.5`, has 32 training-vocabulary words and
classifies all six test messages correctly for the three specified text
candidates. Their log losses differ. MNB was selected by internal training
folds; choosing a new winner from this test would use the test as validation.
The unknown query “zephyronic qxz” and empty query both have zero nonzero
features and return the MNB prior. Six invented test messages are a small
workflow check, rather than a reliable model ranking.

For any real report, show the confusion matrix: true classes index rows and
predicted classes columns. Precision is correct positives divided by predicted
positives; recall is detected positives divided by actual positives. Class
support gives the denominator population. Balanced accuracy averages each
class's recall, while total accuracy weights by prevalence. Explain the
question a metric answers before choosing on it.

### Deeper: rank features without borrowing test information

The vocabulary may contain many weak or redundant columns. A ranking can select
a smaller representation, but its fitted statistics must stay inside the same
training lane. Open one document-presence contingency table first.

<!-- DRAWING D29 -->

The two rows are classes; the two columns are absent and present. Cell counts
sum to the training document count `n`. The independent-reference expected
count is `E_cb=(row total_c)(column total_b)/n`. Comparing observed and expected
cells supplies two useful but different statistics:

\[
I(C;B)=\sum_{c,b:N_{cb}>0}\frac{N_{cb}}n\log\frac{N_{cb}}{E_{cb}},
\qquad \chi^2_{\rm Pearson}=\sum_{c,b:E_{cb}>0}\frac{(N_{cb}-E_{cb})^2}{E_{cb}}.
\]

Mutual information measures dependence in nats; a zero observed cell contributes
zero. Pearson sums squared deviations relative to expected counts. A feature
absent everywhere has no presence marginal: the corresponding zero-expected
cells contribute no information/statistic. Neither statistic proves a feature
will improve future predictions. Highly ranked duplicates can repeat evidence,
as section 6 already showed.

**nb-feature-selection.py — complete file.**

```python
"""Document-presence MI/Pearson versus sklearn count chi2, in a legal pipeline."""
import json
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


def presence_scores(X, y):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y)
    if (X.ndim != 2 or y.shape != (len(X),) or not len(X) or not np.isfinite(X).all()
            or (X < 0).any() or not np.isin(y, [0, 1]).all() or len(np.unique(y)) != 2):
        raise ValueError("Use nonnegative count rows and both binary classes")
    present = X > 0
    tables, mi, pearson = [], [], []
    for j in range(X.shape[1]):
        table = np.array([[np.sum((y == c) & (present[:, j] == b)) for b in (0, 1)] for c in (0, 1)], dtype=float)
        expected = table.sum(axis=1, keepdims=True) @ table.sum(axis=0, keepdims=True) / len(X)
        active = table > 0
        # A zero observed cell contributes zero to MI; zero expected cells add no Pearson term.
        information = np.sum(table[active] / len(X) * np.log(table[active] / expected[active]))
        valid = expected > 0
        statistic = np.sum((table[valid] - expected[valid]) ** 2 / expected[valid])
        tables.append(table.astype(int).tolist())
        mi.append(float(information))
        pearson.append(float(statistic))
    return {"tables_class_by_absent_present": tables, "MI_nats": mi, "Pearson_chi2": pearson}


def select_fixed(scores, k):
    if type(k) is not int or not 1 <= k <= len(scores) or not np.isfinite(scores).all():
        raise ValueError("Use finite feature scores and a legal integer k")
    # Highest score; original feature index breaks exact ties.
    return sorted(sorted(range(len(scores)), key=lambda j: (-scores[j], j))[:k])


def main():
    train = ["alarm alarm urgent", "urgent repair", "alarm inspection", "urgent urgent repair",
             "routine meeting", "routine routine review", "meeting review", "routine inspection"]
    labels = np.array([1, 1, 1, 1, 0, 0, 0, 0])
    query = ["urgent alarm", "newword meeting", ""]
    vectorizer = CountVectorizer().fit(train)
    X = vectorizer.transform(train)
    names = vectorizer.get_feature_names_out().tolist()
    own = presence_scores(X.toarray(), labels)
    ordinary_chi2, pvalues = chi2(X, labels)
    indices = select_fixed(own["MI_nats"], 3)
    scratch_selected = MultinomialNB(alpha=1).fit(X[:, indices], labels)
    pipeline = Pipeline([("words", CountVectorizer()), ("select", SelectKBest(chi2, k=3)),
                         ("nb", MultinomialNB(alpha=1))]).fit(train, labels)
    selected = pipeline.named_steps["select"].get_support(indices=True)
    selected_names = pipeline.named_steps["words"].get_feature_names_out()[selected].tolist()
    assert "newword" not in pipeline.named_steps["words"].vocabulary_
    print(json.dumps({"training_rows": len(train), "feature_names": names,
                     "presence_definition": own, "sklearn_count_chi2": ordinary_chi2.tolist(),
                     "sklearn_count_chi2_pvalues": pvalues.tolist(),
                     "MI_selected_names": [names[i] for i in indices],
                     "count_chi2_selected_names": selected_names,
                     "query": query,
                     "MI_selected_probabilities": scratch_selected.predict_proba(vectorizer.transform(query)[:, indices]).tolist(),
                     "pipeline_probabilities": pipeline.predict_proba(query).tolist(),
                     "stored_transform": {"vocabulary": names, "MI_selected_indices": indices,
                                          "count_chi2_selected_indices": selected.tolist()},
                     "query_shape": list(pipeline[:-1].transform(query).shape)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "training_rows": 8,
  "feature_names": [
    "alarm",
    "inspection",
    "meeting",
    "repair",
    "review",
    "routine",
    "urgent"
  ],
  "presence_definition": {
    "tables_class_by_absent_present": [
      [
        [
          4,
          0
        ],
        [
          2,
          2
        ]
      ],
      [
        [
          3,
          1
        ],
        [
          3,
          1
        ]
      ],
      [
        [
          2,
          2
        ],
        [
          4,
          0
        ]
      ],
      [
        [
          4,
          0
        ],
        [
          2,
          2
        ]
      ],
      [
        [
          2,
          2
        ],
        [
          4,
          0
        ]
      ],
      [
        [
          1,
          3
        ],
        [
          4,
          0
        ]
      ],
      [
        [
          4,
          0
        ],
        [
          1,
          3
        ]
      ]
    ],
    "MI_nats": [
      0.21576155433883565,
      0.0,
      0.21576155433883565,
      0.21576155433883565,
      0.21576155433883565,
      0.38039566584857787,
      0.3803956658485779
    ],
    "Pearson_chi2": [
      2.6666666666666665,
      0.0,
      2.6666666666666665,
      2.6666666666666665,
      2.6666666666666665,
      4.8,
      4.8
    ]
  },
  "sklearn_count_chi2": [
    3.0,
    0.0,
    2.0,
    2.0,
    2.0,
    4.0,
    4.0
  ],
  "sklearn_count_chi2_pvalues": [
    0.08326451666355042,
    1.0,
    0.15729920705028105,
    0.15729920705028105,
    0.15729920705028105,
    0.04550026389635857,
    0.04550026389635857
  ],
  "MI_selected_names": [
    "alarm",
    "routine",
    "urgent"
  ],
  "count_chi2_selected_names": [
    "alarm",
    "routine",
    "urgent"
  ],
  "query": [
    "urgent alarm",
    "newword meeting",
    ""
  ],
  "MI_selected_probabilities": [
    [
      0.09259259259259267,
      0.9074074074074076
    ],
    [
      0.5,
      0.5
    ],
    [
      0.5,
      0.5
    ]
  ],
  "pipeline_probabilities": [
    [
      0.09259259259259267,
      0.9074074074074076
    ],
    [
      0.5,
      0.5
    ],
    [
      0.5,
      0.5
    ]
  ],
  "stored_transform": {
    "vocabulary": [
      "alarm",
      "inspection",
      "meeting",
      "repair",
      "review",
      "routine",
      "urgent"
    ],
    "MI_selected_indices": [
      0,
      5,
      6
    ],
    "count_chi2_selected_indices": [
      0,
      5,
      6
    ]
  },
  "query_shape": [
    3,
    3
  ]
}
```

The new eight-document device-text fixture supplies a presence MI/Pearson
implementation and a fixed-k stable selection rule. It separately runs ordinary
`SelectKBest(chi2)` inside a CountVectorizer→selector→MNB pipeline. sklearn's
`chi2` here compares **feature count totals by class**, not the full
document-present/absent 2×2 Pearson table. Their printed scores and chosen
columns are therefore deliberately separate. `newword` in a query does not
enter the fitted vocabulary. The selected indices are stored with feature names;
a query must transform through that same fitted selection. Choose k inside
development folds, never by inspecting test vocabulary or outcomes.

The shown reference computes per-feature presence tables in `O(nd)` and stores
four cells per feature; a sparse large-scale route would count class presence
totals without densifying all rows. The dense conversion is bounded here to
eight short messages to expose the table, and is not the recommended corpus
storage strategy of D27. More complete feature selection and inferential
testing belong to [Feature Selection & Importance](/learn/path/full-curriculum/feature-selection-importance-shap-permutation-mutual-info).

### Streaming preserves sufficient statistics

Now suppose labeled messages arrive in batches. Which state must survive?

<!-- DRAWING D30 -->

For counts, raw class and class-word accumulators receive batches of 4, 4, 4
and 2 rows. Smoothing is a later parameter refresh; the raw store never gains
a new α on each call. A loop using `len(rows)//4` discards the two-row
remainder. The first `partial_fit` supplies the full intended class list,
because an early batch can omit a class that appears later. Feature meanings
and order remain fixed across every batch.

**streaming.py — complete program.** Does updating in batches need to revisit earlier rows, and does accumulating old counts forget them?

```python
import numpy as np
from sklearn.naive_bayes import MultinomialNB

vocabulary = ["free", "money", "win", "prize", "meeting", "agenda", "report", "quarter"]
X = np.array(
    [
        [3, 2, 1, 1, 0, 0, 0, 0],
        [2, 3, 2, 0, 0, 0, 0, 0],
        [1, 1, 3, 2, 0, 0, 0, 0],
        [4, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 3, 1, 1],
        [0, 0, 0, 0, 1, 1, 3, 2],
        [0, 1, 0, 0, 3, 2, 1, 0],
        [0, 0, 0, 0, 2, 1, 2, 3],
    ]
)
y = np.array([1, 1, 1, 1, 0, 0, 0, 0])

# Fourteen labeled rows; every batch uses the same fixed eight-column vocabulary.
X = np.concatenate([X, X[:6]], axis=0)
y = np.concatenate([y, y[:6]])
online = MultinomialNB(alpha=1)
batch_sizes = []
for start in range(0, len(y), 4):
    stop = min(start + 4, len(y))
    batch_sizes.append(stop - start)
    online.partial_fit(X[start:stop], y[start:stop], classes=np.array([0, 1]))
batch = MultinomialNB(alpha=1).fit(X, y)
print("batch sizes:", batch_sizes)
print("class counts:", online.class_count_.astype(int).tolist())
print(
    "same sufficient counts:",
    bool(np.array_equal(online.feature_count_, batch.feature_count_)),
)
print(
    "same probabilities:",
    bool(np.allclose(online.predict_proba(X), batch.predict_proba(X))),
)
print("floor-based loop would consume:", (len(y) // 4) * 4, "of", len(y), "rows")
print("This model accumulates all fourteen rows; it does not apply a moving window.")
```

Recorded original output (retained, not rerun):

```text
batch sizes: [4, 4, 4, 2]
class counts: [6, 8]
same sufficient counts: True
same probabilities: True
floor-based loop would consume: 12 of 14 rows
This model accumulates all fourteen rows; it does not apply a moving window.
```

Its retained fourteen-row output ends with six ham/eight spam, identical integer
feature counts to a batch fit and matching probabilities. The floor-based loop
would consume twelve rows. The new six-row companion demonstrates the same
partition invariance on a different fixture and roundtrip state. Exact integer
count equality and weighted floating-point close agreement are different
numeric contracts.

Gaussian state also has a compact merge, but storing uncentered `Σx²−(Σx)²/n`
can subtract nearly equal large values. Store centered squared deviations `M2`
with class mass and mean instead.

<!-- DRAWING D31 -->

Group A contains `[1,2]`: mass 2, mean 1.5, `M2=.5`. Group B contains `[3]`:
mass 1, mean 3, `M2=0`. Their mean separation is `δ=1.5`; merged mass is 3,
mean 2, and between-group correction `δ² n_A n_B/(n_A+n_B)=1.5`.
Thus merged `M2=.5+0+1.5=2`, giving raw variance `2/3`.

\[
n=n_A+n_B,\quad \delta=\mu_B-\mu_A,\quad
\mu=\mu_A+\delta\frac{n_B}{n},\quad
M2=M2_A+M2_B+\delta^2\frac{n_An_B}{n}.
\]

To derive the correction, write each group's deviation from the merged mean
as its centered deviation plus its group-mean offset. Centered deviations sum
to zero, removing cross terms. The two offset sums combine into the displayed
`δ² n_A n_B/n`. Empty groups contribute no mass; a singleton has zero centered
squares. The same algebra works with finite nonnegative weights and mass
`Σ weights`, using weighted centered sums.

**nb_gaussian_online.py — complete file.**

```python
"""Weighted centered-M2 Gaussian NB; an absolute additive squared-unit floor.

Run directly for a new small comparison; ordinary imports remain quiet.
"""
import json
import numpy as np


def normalize(scores):
    maximum = scores.max(axis=1, keepdims=True)
    if np.isnan(scores).any() or np.isposinf(scores).any() or np.isneginf(maximum).any():
        raise ValueError("Invalid or wholly unsupported Gaussian score row")
    shifted = scores - maximum
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))


def weights_and_labels(y, n, sample_weight):
    y = np.asarray(y)
    w = np.ones(n) if sample_weight is None else np.asarray(sample_weight, dtype=float)
    if (y.ndim != 1 or len(y) != n or w.shape != (n,) or y.dtype.kind not in "biuUS"
            or not np.isfinite(w).all() or (w < 0).any() or (w > 1e6).any() or w.sum() <= 0):
        raise ValueError("One integer/string label and finite nonnegative weight per row")
    return y, w


class GaussianOnline:
    def __init__(self, variance_floor=1e-9, schema=None, units=None, priors=None):
        floor = np.asarray(variance_floor, dtype=float)
        if floor.ndim > 1 or not np.isfinite(floor).all() or (floor <= 0).any() or (floor > 1e12).any():
            raise ValueError("Use positive finite squared-unit floor(s), at most 1e12")
        self.floor = floor.copy()
        self.schema = None if schema is None else list(schema)
        self.units = None if units is None else list(units)
        self.priors = None if priors is None else np.asarray(priors, dtype=float)

    @staticmethod
    def _matrix(X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not X.shape[0] or not X.shape[1]
                or not np.isfinite(X).all() or (np.abs(X) > 1e6).any()):
            raise ValueError("Use finite nonempty rows with readings within +/-1e6")
        return X

    def _start(self, d, classes):
        self.classes_ = np.unique(np.asarray(classes))
        weights_and_labels(self.classes_, len(self.classes_), None)
        self.schema_ = list(self.schema if self.schema is not None else ["feature_" + str(j) for j in range(d)])
        self.units_ = list(self.units if self.units is not None else ["declared units"] * d)
        if (len(self.schema_) != d or len(set(self.schema_)) != d or len(self.units_) != d
                or any(not isinstance(s, str) or not s for s in self.schema_ + self.units_)):
            raise ValueError("Name each feature and its measurement unit")
        self.floor_ = np.broadcast_to(self.floor, (d,)).copy()
        self.class_count_ = np.zeros(len(self.classes_))
        self.mean_ = np.zeros((len(self.classes_), d))
        self.M2_ = np.zeros_like(self.mean_)

    @staticmethod
    def merge(n_a, mean_a, M2_a, n_b, mean_b, M2_b):
        if n_b == 0:
            return n_a, mean_a.copy(), M2_a.copy()
        if n_a == 0:
            return n_b, mean_b.copy(), M2_b.copy()
        total = n_a + n_b
        delta = mean_b - mean_a
        mean = mean_a + delta * (n_b / total)
        M2 = M2_a + M2_b + delta ** 2 * (n_a * n_b / total)
        return total, mean, M2

    def fit(self, X, y, sample_weight=None):
        if hasattr(self, "classes_"):
            del self.classes_
        return self.partial_fit(X, y, classes=np.unique(y), sample_weight=sample_weight)

    def partial_fit(self, X, y, classes=None, sample_weight=None):
        X = self._matrix(X)
        y, w = weights_and_labels(y, len(X), sample_weight)
        if not hasattr(self, "classes_"):
            if classes is None:
                raise ValueError("First partial_fit requires the complete class list")
            self._start(X.shape[1], classes)
        if X.shape[1] != len(self.schema_):
            raise ValueError("The feature schema is fixed")
        if classes is not None and not np.array_equal(np.unique(classes), self.classes_):
            raise ValueError("The class schema is fixed")
        if not np.isin(y, self.classes_).all():
            raise ValueError("Training label outside the declared classes")
        for c, label in enumerate(self.classes_):
            selected = y == label
            xb, wb = X[selected], w[selected]
            mass = wb.sum()
            if mass == 0:
                continue
            mean = np.sum(xb * wb[:, None], axis=0) / mass
            M2 = np.sum(wb[:, None] * (xb - mean) ** 2, axis=0)
            self.class_count_[c], self.mean_[c], self.M2_[c] = self.merge(
                self.class_count_[c], self.mean_[c], self.M2_[c], mass, mean, M2)
        self._refresh()
        return self

    def _refresh(self):
        if not np.isfinite(self.M2_).all() or not np.isfinite(self.mean_).all():
            raise ValueError("Raw Gaussian statistics exceed arithmetic range")
        self.raw_variance_ = np.divide(self.M2_, self.class_count_[:, None],
                                      out=np.zeros_like(self.M2_), where=self.class_count_[:, None] > 0)
        self.variance_ = self.raw_variance_ + self.floor_[None, :]
        p = self.class_count_ / self.class_count_.sum() if self.priors is None else self.priors
        if (p.shape != self.class_count_.shape or not np.isfinite(p).all() or (p < 0).any()
                or not np.isclose(p.sum(), 1, atol=1e-12, rtol=0)):
            raise ValueError("Supply normalized priors in sorted class order")
        if ((p > 0) & (self.class_count_ <= 0)).any():
            raise ValueError("A positive-prior Gaussian class needs fitted observations")
        self.prior_ = p.copy()
        with np.errstate(divide="ignore"):
            self.class_log_prior_ = np.log(p)

    def log_likelihood(self, X, mask=None, schema=None, units=None):
        X = self._matrix(X)
        if X.shape[1] != len(self.schema_) or (schema is not None and list(schema) != self.schema_):
            raise ValueError("Feature identity/order differs from the fitted schema")
        if units is not None and list(units) != self.units_:
            raise ValueError("Convert model parameters and floor with the measurement units")
        mask = np.ones(X.shape, dtype=bool) if mask is None else np.asarray(mask)
        if mask.shape != X.shape or mask.dtype.kind != "b":
            raise ValueError("Use one Boolean observed mask per feature and row")
        scores = np.zeros((len(X), len(self.classes_)))
        for j in range(X.shape[1]):
            term = -.5 * (np.log(2 * np.pi) + np.log(self.variance_[:, j])[None, :]
                          + (X[:, j, None] - self.mean_[:, j]) ** 2 / self.variance_[:, j][None, :])
            scores += np.where(mask[:, j, None], term, 0.)
        if not np.isfinite(scores).all():
            raise ValueError("Gaussian likelihood exceeds arithmetic range")
        return scores

    def log_joint(self, X, mask=None, schema=None, units=None):
        return self.log_likelihood(X, mask, schema, units) + self.class_log_prior_

    def predict_log_proba(self, X, mask=None, schema=None, units=None):
        return normalize(self.log_joint(X, mask, schema, units))

    def predict_proba(self, X, mask=None, schema=None, units=None):
        return np.exp(self.predict_log_proba(X, mask, schema, units))

    def predict(self, X, mask=None, schema=None, units=None):
        return self.classes_[self.predict_log_proba(X, mask, schema, units).argmax(axis=1)]

    def export_state(self):
        return {"format": "nb-gaussian-M2-v1", "classes": self.classes_.tolist(),
                "schema": self.schema_, "units": self.units_, "variance_floor": self.floor_.tolist(),
                "class_count": self.class_count_.tolist(), "mean": self.mean_.tolist(),
                "M2": self.M2_.tolist(), "priors": None if self.priors is None else self.priors.tolist()}

    @classmethod
    def from_state(cls, state, expected_schema=None, expected_units=None):
        if state.get("format") != "nb-gaussian-M2-v1":
            raise ValueError("Unknown Gaussian state convention")
        if expected_schema is not None and list(expected_schema) != state["schema"]:
            raise ValueError("State has stale feature identity/order")
        if expected_units is not None and list(expected_units) != state["units"]:
            raise ValueError("State has different measurement units")
        obj = cls(state["variance_floor"], state["schema"], state["units"], state["priors"])
        obj._start(len(state["schema"]), state["classes"])
        if obj.classes_.tolist() != state["classes"]:
            raise ValueError("Saved classes must retain sorted unique order")
        count, mean, M2 = [np.asarray(state[key], dtype=float) for key in ("class_count", "mean", "M2")]
        if (count.shape != obj.class_count_.shape or mean.shape != obj.mean_.shape or M2.shape != obj.M2_.shape
                or not all(np.isfinite(a).all() for a in (count, mean, M2))
                or (count < 0).any() or count.sum() <= 0 or (M2 < 0).any()
                or (np.abs(mean) > 1e6).any() or (M2[count == 0] != 0).any()):
            raise ValueError("Invalid raw Gaussian statistics")
        obj.class_count_, obj.mean_, obj.M2_ = count.copy(), mean.copy(), M2.copy()
        obj._refresh()
        return obj


def main():
    from sklearn.naive_bayes import GaussianNB
    X = np.array([[1., -2.], [2., -1.], [3., 0.], [0., 2.], [1., 3.], [2., 4.]])
    y = np.array([0, 0, 0, 1, 1, 1])
    weights = np.array([.5, 1.5, 1., 1., 2., .5])
    query = [[1.5, .5], [0., 0.]]
    batch = GaussianOnline(schema=["reading", "offset"], units=["mV", "mV"]).fit(X, y, weights)
    online = GaussianOnline(schema=["reading", "offset"], units=["mV", "mV"])
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1], sample_weight=weights[start:stop])
    assert np.allclose(batch.mean_, online.mean_) and np.allclose(batch.M2_, online.M2_)
    restored = GaussianOnline.from_state(json.loads(json.dumps(online.export_state())),
                                        expected_schema=["reading", "offset"], expected_units=["mV", "mV"])
    assert np.allclose(restored.predict_proba(query), batch.predict_proba(query))
    ordinary = GaussianNB(var_smoothing=1e-9).fit(X, y, sample_weight=weights)
    ordinary_online = GaussianNB(var_smoothing=1e-9)
    epsilons = []
    for start, stop in [(0, 2), (2, 5), (5, 6)]:
        ordinary_online.partial_fit(X[start:stop], y[start:stop], classes=[0, 1], sample_weight=weights[start:stop])
        epsilons.append(float(ordinary_online.epsilon_))
    assert np.allclose(batch.mean_, ordinary.theta_, atol=1e-12)
    assert np.allclose(batch.raw_variance_, ordinary.var_ - ordinary.epsilon_, atol=1e-12)
    merged = GaussianOnline.merge(2., np.array([1.5]), np.array([.5]), 1., np.array([3.]), np.array([0.]))
    print(json.dumps({"merged_n_mean_M2": [merged[0], merged[1].tolist(), merged[2].tolist()],
                     "weighted_state": batch.export_state(), "chunks": [2, 3, 1],
                     "probabilities": batch.predict_proba(query).tolist(), "roundtrip_equal": True,
                     "library_epsilon_batch": float(ordinary.epsilon_), "library_epsilon_chunks": epsilons,
                     "library_variance_batch": ordinary.var_.tolist(),
                     "library_variance_chunks": ordinary_online.var_.tolist(),
                     "library_probability_batch": ordinary.predict_proba(query).tolist(),
                     "library_probability_chunks": ordinary_online.predict_proba(query).tolist()},
                     indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "merged_n_mean_M2": [
    3.0,
    [
      2.0
    ],
    [
      2.0
    ]
  ],
  "weighted_state": {
    "format": "nb-gaussian-M2-v1",
    "classes": [
      0,
      1
    ],
    "schema": [
      "reading",
      "offset"
    ],
    "units": [
      "mV",
      "mV"
    ],
    "variance_floor": [
      1e-09,
      1e-09
    ],
    "class_count": [
      3.0,
      3.5
    ],
    "mean": [
      [
        2.1666666666666665,
        -0.8333333333333334
      ],
      [
        0.8571428571428571,
        2.857142857142857
      ]
    ],
    "M2": [
      [
        1.4166666666666665,
        1.4166666666666665
      ],
      [
        1.4285714285714284,
        1.4285714285714286
      ]
    ],
    "priors": null
  },
  "chunks": [
    2,
    3,
    1
  ],
  "probabilities": [
    [
      0.9906188333548761,
      0.00938116664512395
    ],
    [
      0.9925656685809573,
      0.007434331419042602
    ]
  ],
  "roundtrip_equal": true,
  "library_epsilon_batch": 4.666666666666667e-09,
  "library_epsilon_chunks": [
    2.5e-10,
    1.5555555555555557e-09,
    0.0
  ],
  "library_variance_batch": [
    [
      0.4722222268888888,
      0.4722222268888888
    ],
    [
      0.40816326997278907,
      0.4081632699727891
    ]
  ],
  "library_variance_chunks": [
    [
      0.4722222229074074,
      0.4722222229074074
    ],
    [
      0.40816326663945585,
      0.40816326663945585
    ]
  ],
  "library_probability_batch": [
    [
      0.9906188329255129,
      0.00938116707448748
    ],
    [
      0.99256566819433,
      0.00743433180567009
    ]
  ],
  "library_probability_chunks": [
    [
      0.9906188332985862,
      0.009381166701414189
    ],
    [
      0.9925656684981474,
      0.007434331501852305
    ]
  ]
}
```

The complete file implements merge, class accumulation, diagonal likelihoods,
per-feature observed masks, normalized probabilities and finite JSON state.
Raw `M2_` remains unfloored. `_refresh` divides by class mass and adds the
declared absolute squared-unit floor; missing likelihood factors contribute
zero in log space under the stated ignorable-observation assumption. Schema
and measurement units survive reload. An unobserved class has zero empirical
prior until evidence arrives; externally supplied positive priors need fitted
class statistics to represent a supported Gaussian class. The common `_refresh`
check rejects any positive-prior class with zero fitted mass, including state
restoration. A floor can stabilize a fitted singleton or constant class; it
cannot supply an unobserved class's missing mean and distribution.

The new six-row weighted comparison processes chunks 2,3,1 and checks mean/M2
against a batch's centered statistics, plus a JSON roundtrip. GaussianNB's
`theta_` agrees with the weighted mean; `var_−epsilon_` matches the raw batch
variance. Its displayed epsilon values refresh across chunks, so smoothed batch
and chunked variances/probabilities can differ. This is an API diagnostic beside
the same mathematical raw merge, not a claim that every smoothing policy has
partition invariance.

| Operation | Work excluding tokenization | Stored model state |
| --- | --- | --- |
| Sparse class-count fit | `O(n+nnz+KV)` | `O(KV+K)` |
| One sparse count/presence query | `O(Kq+K)` after parameter refresh | Parameters and current query |
| Categorical fit/query | `O(nd+Σ_j KM_j)` / `O(Kd)` | Per-feature category tables |
| Gaussian fit/query | `O(nd+Kd)` / `O(Kd)` | Means, centered squares, mass and floor |
| Gaussian state merge | `O(Kd)` after new batch statistics | Same fixed parameter dimensions |

These are operation counts, not measured timings or universal optimality claims.
Libraries include allocation and parameter-refresh work. The useful streaming
property is that previous rows need not be revisited. A cumulative model keeps
all old evidence; it does not automatically forget stale language. A validated
recent-data window or explicit decay/weighting changes that policy. Fixed
hashing can bound dimensions, but collisions mix feature meanings; signed
hashing also conflicts with nonnegative count inputs unless configured otherwise.

### A changed prior is different from a changed likelihood

What if spam becomes more prevalent while its language stays the same?

<!-- DRAWING D32 -->

Hold the fitted class likelihoods fixed and move only the prior log-odds
contribution. For nonzero priors, deployment odds obey

\[
\log O_{\rm new}(x)=\log O_{\rm old}(x)+
\log\frac{\pi_{{\rm new},1}/\pi_{{\rm new},0}}{\pi_{{\rm old},1}/\pi_{{\rm old},0}}.
\]

The same likelihood ratio now starts from a different baseline odds. This is
justified when `P(x|c)` remains stable in the same representation and we have
appropriate prior information. The changed-conditional fixture moves a class
likelihood instead: new spam vocabulary or a changed feature schema cannot
be repaired by an intercept adjustment alone. Identify which relationship
changed before deciding to retrain, revise representation or adjust prevalence.

### Apply the workflow to official email features

The tiny text corpora were designed for hand calculation. Does a declared model
workflow find useful signal in collected mail? The UCI **Spambase** dataset
by Hopkins, Reeber, Forman and Suermondt contains 4,601 historical email records,
with 57 features and ham/spam labels. Its openly licensed official payload is
included offline with names, original documentation, attribution and license.

Look at the feature units before the split and comparison.

<!-- DRAWING D33 -->

The first 48 features are word percentages; the next six are character
percentages; the last three give average, longest and total uninterrupted
capital-letter-run measurements. A percentage is not an integer token count.
Without the original denominator, multiplying a percentage as though it were
a count changes the event interpretation. We compare different legitimate
representations: Gaussian on 57 raw or log1p features, Bernoulli on 54
positive-frequency indicators, and logistic regression on 57 scaled raw features.
MNB and Complement remain the text-count experiments, rather than being given
an invented physical count interpretation here.

Group exact identical 57-feature vectors **without labels**. There are 4,207
groups and three groups with conflicting labels; retain every row and conflict.
Use GroupShuffleSplit seed 71 for development/test and seed 73 for
train/validation inside development. The accepted role identities are:

| Role | Rows | Ham | Spam | Fitting allowed |
| --- | --- | --- | --- | --- |
| Training | 2811 | 1682 | 1129 | Representation/scaler and estimator |
| Validation | 890 | 547 | 343 | Candidate selection only |
| Test | 900 | 559 | 341 | Prefrozen reports only |

These are group splits, not stratified splits. Both classes happen to be
present in each. Group conservation prevents exact-vector overlap while
retaining conflicting labels; it cannot guarantee independence of campaigns
or near duplicates. The dataset includes personalized ham indicators such as
george and 650 and lacks the sender/campaign/time information needed to
establish modern deployment validity. The actual numeric file has no missing
entries; UCI's webpage marks missingness “Yes” while the bundled documentation
says “None.” The delivered payload and its identity determine this loader's
contract; no undocumented cleanup is applied.

We predeclared twelve candidates, with validation mean negative log probability
as the primary selection metric and first-declared tie handling at tolerance
`10^−12`. StandardScaler fits training only. Gaussian settings are
`10^−11,10^−9,10^−7` for raw57, then the same settings for log1p57.
Bernoulli settings are α `.1,1,10`, with fixed positive-frequency indicators
and `binarize=None`. Logistic settings are C `.1,1,10`, L2/l1_ratio=0,
lbfgs, max_iter 2000 and tolerance `10^−6`. No calibration fit is added.

**nb-spambase-study.py — complete file.**

```python
"""One predeclared offline Spambase study. Run beside the two quiet helpers.

Selection uses validation log loss, then a saved lock precedes all test reports.
No train+validation refit occurs. Existing output files prevent accidental replay.
"""
import hashlib
import json
from pathlib import Path
import warnings
import numpy as np
import scipy
import sklearn
from sklearn.exceptions import ConvergenceWarning
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import GroupShuffleSplit
from sklearn.naive_bayes import BernoulliNB, GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from nb_discrete_core import BernoulliModel
from nb_gaussian_online import GaussianOnline


FILES = {
    "spambase.data": "b1ef93de71f97714d3d7d4f58fc9f718da7bbc8ac8a150eff2778616a8097b12",
    "spambase.names": "df418fab7923f929237b81efa0987ddfaf2d68cf61291243625aadc684d5ab6a",
    "spambase.DOCUMENTATION": "462e4ffba1241a5962d528364708d188dc75931d56a25a8e9b6c8bb25e094cfd",
}
ROLE_HASHES = {
    "train": "38f7b8e9e582114f5432c48df04a7f70731172b692f008fd4c0f069c69808d05",
    "validation": "9a3f6e12d3f71e9edb46f7785a6d51b28c86f163806b63938ddb2abc64862c3d",
    "test": "e057b4cdd8d3f97990c4031925635179b22142f44789f14fb4205d100cfe242a",
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    # Exclusive creation preserves a completed or interrupted scientific run.
    with path.open("x", encoding="utf-8") as output:
        json.dump(value, output, indent=2, allow_nan=False)
        output.write("\n")


def load_offline(directory):
    for name, expected in FILES.items():
        if digest((directory / name).read_bytes()) != expected:
            raise ValueError("Official input identity differs: " + name)
    for name in ("spambase-provenance.md", "SPAMBASE-LICENSE.txt"):
        if not (directory / name).is_file():
            raise FileNotFoundError(name)
    rows = np.loadtxt(directory / "spambase.data", delimiter=",")
    if rows.shape != (4601, 58) or not np.isfinite(rows).all() or (rows < 0).any():
        raise ValueError("Expected the finite, nonnegative official payload")
    X, y = rows[:, :57], rows[:, 57].astype(int)
    if not np.array_equal(rows[:, 57], y) or set(y) != {0, 1}:
        raise ValueError("Labels must be ham=0 and spam=1")
    names = [line.split(":")[0].strip() for line in (directory / "spambase.names").read_text().splitlines()
             if not line.lstrip().startswith("|") and ":" in line and line.split(":", 1)[1].strip() == "continuous."]
    if len(names) != 57 or len(set(names)) != 57:
        raise ValueError("Expected 57 named numeric columns in official order")
    return X, y, names


def grouped_roles(X, y):
    _, groups = np.unique(X, axis=0, return_inverse=True)
    development, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=71).split(X, y, groups))
    ti, vi = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=73).split(
        X[development], y[development], groups[development]))
    roles = {"train": development[ti], "validation": development[vi], "test": test}
    for name, indices in roles.items():
        if digest(np.asarray(indices, dtype="<i8").tobytes()) != ROLE_HASHES[name]:
            raise ValueError("Predeclared split identity differs: " + name)
        if set(y[indices]) != {0, 1}:
            raise ValueError("Both classes are required in every role")
    sets = [set(groups[i]) for i in roles.values()]
    if any(sets[a] & sets[b] for a, b in ((0, 1), (0, 2), (1, 2))):
        raise ValueError("An exact feature group crosses roles")
    if sorted(np.concatenate(list(roles.values()))) != list(range(len(X))):
        raise ValueError("Rows must be retained exactly once")
    conflicts = sum(len(set(y[groups == g])) > 1 for g in range(groups.max() + 1))
    return roles, {"unique_feature_groups": int(groups.max() + 1), "conflicting_label_groups": conflicts,
                   "roles": {name: {"rows": len(i), "class_counts": np.bincount(y[i]).tolist(),
                                    "indices_sha256": ROLE_HASHES[name]} for name, i in roles.items()}}


def representation(X, name):
    if name == "presence54":
        return (X[:, :54] > 0).astype(float)
    return np.log1p(X) if name == "log1p57" else X


def metrics(y, logp):
    if logp.shape != (len(y), 2) or not np.isfinite(logp).all():
        raise ValueError("Use finite normalized log probabilities in [ham, spam] order")
    p = np.exp(logp)
    if not np.allclose(p.sum(axis=1), 1, atol=1e-10):
        raise ValueError("Probabilities are not normalized")
    prediction = logp.argmax(axis=1)  # Exact ties choose ham.
    precision, recall, f1, support = precision_recall_fscore_support(y, prediction, labels=[0, 1], zero_division=0)
    action = p[:, 1] > .8  # Equal costs at the threshold choose the negative action.
    return {"log_loss": float(-logp[np.arange(len(y)), y].mean()),
            "accuracy": float(accuracy_score(y, prediction)),
            "balanced_accuracy": float(balanced_accuracy_score(y, prediction)),
            "Brier": float(np.mean((p[:, 1] - y) ** 2)),
            "confusion_ham_spam": confusion_matrix(y, prediction, labels=[0, 1]).tolist(),
            "precision": precision.tolist(), "recall": recall.tolist(), "f1": f1.tolist(),
            "support": support.tolist(), "positive_actions_at_08": int(action.sum()),
            "cost_4_to_1_at_08": float(np.mean(4 * (action & (y == 0)) + (~action & (y == 1))))}


def candidates():
    configurations = []
    for rep in ("raw57", "log1p57"):
        for smoothing in (1e-11, 1e-9, 1e-7):
            configurations.append({"family": "Gaussian", "representation": rep, "var_smoothing": smoothing})
    for alpha in (.1, 1., 10.):
        configurations.append({"family": "Bernoulli", "representation": "presence54", "alpha": alpha})
    for C in (.1, 1., 10.):
        configurations.append({"family": "logistic", "representation": "raw57", "C": C})
    return [{"id": "candidate_" + str(j + 1).zfill(2), **c} for j, c in enumerate(configurations)]


def estimator(configuration):
    if configuration["family"] == "Gaussian":
        return Pipeline([("scale", StandardScaler()), ("model", GaussianNB(var_smoothing=configuration["var_smoothing"]))])
    if configuration["family"] == "Bernoulli":
        return BernoulliNB(alpha=configuration["alpha"], force_alpha=True, binarize=None)
    # sklearn 1.9: l1_ratio=0 selects L2; the old penalty parameter is deprecated.
    return Pipeline([("scale", StandardScaler()), ("model", LogisticRegression(
        C=configuration["C"], l1_ratio=0., solver="lbfgs", max_iter=2000, tol=1e-6))])


def choose(outcomes, family=None):
    eligible = [r for r in outcomes if r["eligible"] and (family is None or r["configuration"]["family"] == family)]
    if not eligible:
        raise ValueError("No eligible candidate for " + str(family))
    winner = eligible[0]
    for row in eligible[1:]:
        if row["validation"]["log_loss"] < winner["validation"]["log_loss"] - 1e-12:
            winner = row
    return winner["configuration"]["id"]


def export_model(configuration, fitted, names):
    rep = configuration["representation"]
    state = {"format": "spambase-frozen-v1", "configuration": configuration,
             "raw_schema": names, "classes": [0, 1], "representation": rep}
    model = fitted.named_steps["model"] if isinstance(fitted, Pipeline) else fitted
    if isinstance(fitted, Pipeline):
        scaler = fitted.named_steps["scale"]
        state["scaler"] = {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
                           "variance": scaler.var_.tolist(), "training_rows": int(scaler.n_samples_seen_)}
    if configuration["family"] == "Gaussian":
        raw_var = model.var_ - model.epsilon_
        scratch = {"format": "nb-gaussian-M2-v1", "classes": model.classes_.tolist(), "schema": names,
                   "units": ["standardized " + rep] * 57, "variance_floor": [float(model.epsilon_)] * 57,
                   "class_count": model.class_count_.tolist(), "mean": model.theta_.tolist(),
                   "M2": (raw_var * model.class_count_[:, None]).tolist(), "priors": model.class_prior_.tolist()}
        state["scratch"] = scratch
        state["library"] = {"theta": model.theta_.tolist(), "variance": model.var_.tolist(),
                            "epsilon": float(model.epsilon_), "class_prior": model.class_prior_.tolist()}
    elif configuration["family"] == "Bernoulli":
        state["scratch"] = {"format": "nb-discrete-v1", "family": "bernoulli", "alpha": model.alpha,
                            "schema": names[:54], "classes": model.classes_.tolist(),
                            "class_count": model.class_count_.tolist(), "priors": None,
                            "feature_count": model.feature_count_.tolist()}
        state["library"] = {"feature_log_prob": model.feature_log_prob_.tolist(), "class_log_prior": model.class_log_prior_.tolist()}
    else:
        state["coefficients"] = model.coef_.tolist()
        state["intercept"] = model.intercept_.tolist()
        state["iterations"] = model.n_iter_.tolist()
    return state


def saved_log_proba(state, raw, names):
    raw = np.asarray(raw, dtype=float)
    if names != state["raw_schema"] or raw.ndim != 2 or raw.shape[1] != 57 or not np.isfinite(raw).all() or (raw < 0).any():
        raise ValueError("Use finite nonnegative raw features in the exact saved schema")
    X = representation(raw, state["representation"])
    if "scaler" in state:
        X = (X - np.array(state["scaler"]["mean"])) / np.array(state["scaler"]["scale"])
    family = state["configuration"]["family"]
    if family == "Gaussian":
        return GaussianOnline.from_state(state["scratch"], names).predict_log_proba(X)
    if family == "Bernoulli":
        return BernoulliModel.from_state(state["scratch"], names[:54]).predict_log_proba(X)
    odds = X @ np.array(state["coefficients"])[0] + state["intercept"][0]
    return np.column_stack((-np.logaddexp(0, odds), -np.logaddexp(0, -odds)))


def report_log_proba(model, X, family):
    # Some logistic probability implementations round a saturated probability
    # to zero before logging. Its decision score still defines finite log odds.
    if family == "logistic":
        odds = model.decision_function(X)
        return np.column_stack((-np.logaddexp(0, odds), -np.logaddexp(0, -odds)))
    return model.predict_log_proba(X)


def main():
    directory = Path(__file__).resolve().parent
    outputs = [directory / n for n in ("spambase-study-start.json", "spambase-validation-lock.json",
                                       "spambase-study-results.json", "spambase-frozen-state.json")]
    if any(p.exists() for p in outputs):
        raise FileExistsError("Study output already exists; inspect it instead of repeating this run")
    X, y, names = load_offline(directory)
    roles, grouping = grouped_roles(X, y)
    train, validation = roles["train"], roles["validation"]
    configurations = candidates()
    source_hashes = {n: digest((directory / n).read_bytes()) for n in
                     ("nb-spambase-study.py", "nb_discrete_core.py", "nb_gaussian_online.py")}
    protocol = {"candidate_order": configurations, "selection": "validation mean negative log probability; tie tolerance 1e-12, first",
                "refit": False, "class_order": [0, 1], "loss": "unclipped finite native log probabilities",
                "versions": {"numpy": np.__version__, "scipy": scipy.__version__, "sklearn": sklearn.__version__},
                "data_hashes": FILES, "sources": source_hashes, "grouping": grouping}
    save_new(outputs[0], protocol)
    outcomes, fitted = [], {}
    for c in configurations:
        record = {"configuration": c, "warnings": [], "eligible": False}
        caught = []
        try:
            model = estimator(c)
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                model.fit(representation(X[train], c["representation"]), y[train])
                logp = model.predict_log_proba(representation(X[validation], c["representation"]))
            record["warnings"] = [{"type": w.category.__name__, "message": str(w.message)} for w in caught]
            record["validation"] = metrics(y[validation], logp)
            terminal = model.named_steps["model"] if isinstance(model, Pipeline) else model
            record["iterations"] = terminal.n_iter_.tolist() if hasattr(terminal, "n_iter_") else None
            record["eligible"] = not any(issubclass(w.category, ConvergenceWarning) for w in caught)
            if record["iterations"] is not None and max(record["iterations"]) >= 2000:
                record["eligible"] = False
            fitted[c["id"]] = model
        except Exception as error:
            record["failure"] = {"type": type(error).__name__, "message": str(error)}
        record["warnings"] = [{"type": w.category.__name__, "message": str(w.message)} for w in caught]
        outcomes.append(record)
    lock = {"protocol": protocol, "all_validation_outcomes": outcomes,
            "overall_winner": choose(outcomes),
            "family_winners": {family: choose(outcomes, family) for family in ("Gaussian", "Bernoulli", "logistic")}}
    save_new(outputs[1], lock)  # This file exists before any test predictions or metrics.
    lock_hash = digest(outputs[1].read_bytes())
    states = {identifier: export_model(next(c for c in configurations if c["id"] == identifier), fitted[identifier], names)
              for identifier in lock["family_winners"].values()}
    save_new(outputs[3], {"validation_lock_sha256": lock_hash, "models": states})
    reloaded = json.loads(outputs[3].read_text())["models"]
    test = roles["test"]
    prior = np.bincount(y[train], minlength=2) / len(train)
    reports = {"prior": metrics(y[test], np.tile(np.log(prior), (len(test), 1)))}
    predictions, parity = {}, {}
    # Legal edited raw vector: supplied feature statistics, no observed outcome.
    edited = np.zeros((1, 57)); edited[0, 0] = 1.; edited[0, 54:] = [2., 4., 8.]
    for family, identifier in lock["family_winners"].items():
        model = fitted[identifier]
        c = states[identifier]["configuration"]
        native = report_log_proba(model, representation(X[test], c["representation"]), family)
        restored = saved_log_proba(reloaded[identifier], X[test], names)
        delta = float(np.max(np.abs(native - restored)))
        if not np.allclose(native, restored, atol=2e-9, rtol=2e-12):
            raise AssertionError("Saved inference mismatch: " + identifier)
        edited_native = report_log_proba(model, representation(edited, c["representation"]), family)
        edited_saved = saved_log_proba(reloaded[identifier], edited, names)
        if not np.allclose(edited_native, edited_saved, atol=2e-9, rtol=2e-12):
            raise AssertionError("Edited saved inference mismatch")
        reports[family] = {"candidate": identifier, **metrics(y[test], native)}
        predictions[family] = {"row_indices": test.tolist(), "labels": y[test].tolist(), "log_probabilities": native.tolist()}
        parity[family] = {"max_test_log_difference": delta,
                          "edited_raw_case": edited[0].tolist(), "edited_probabilities": np.exp(edited_saved).tolist()}
    results = {**lock, "validation_lock_sha256": lock_hash, "test_reports": reports,
               "test_predictions": predictions, "reload_parity": parity,
               "state_sha256": digest(outputs[3].read_bytes()), "train_only_models_retained": True}
    save_new(outputs[2], results)
    print(json.dumps({"all_validation_outcomes": outcomes, "overall_winner": lock["overall_winner"],
                      "family_winners": lock["family_winners"], "test_reports": reports,
                      "reload_parity": parity, "validation_lock_sha256": lock_hash,
                      "results_sha256": digest(outputs[2].read_bytes()),
                      "state_sha256": results["state_sha256"]}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded fit outcomes and completed state-only report (the initial report failure and arithmetic correction are explained below):

```json
{
  "all_validation_outcomes": [
    {
      "configuration": {
        "id": "candidate_01",
        "family": "Gaussian",
        "representation": "raw57",
        "var_smoothing": 1e-11
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 13.903475750371634,
        "accuracy": 0.8235955056179776,
        "balanced_accuracy": 0.8434423651936617,
        "Brier": 0.1749022939307167,
        "confusion_ham_spam": [
          [
            414,
            133
          ],
          [
            24,
            319
          ]
        ],
        "precision": [
          0.9452054794520548,
          0.7057522123893806
        ],
        "recall": [
          0.7568555758683729,
          0.9300291545189504
        ],
        "f1": [
          0.8406091370558376,
          0.8025157232704403
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 451,
        "cost_4_to_1_at_08": 0.6202247191011236
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_02",
        "family": "Gaussian",
        "representation": "raw57",
        "var_smoothing": 1e-09
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 13.903417262231805,
        "accuracy": 0.8235955056179776,
        "balanced_accuracy": 0.8434423651936617,
        "Brier": 0.1749021130801951,
        "confusion_ham_spam": [
          [
            414,
            133
          ],
          [
            24,
            319
          ]
        ],
        "precision": [
          0.9452054794520548,
          0.7057522123893806
        ],
        "recall": [
          0.7568555758683729,
          0.9300291545189504
        ],
        "f1": [
          0.8406091370558376,
          0.8025157232704403
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 451,
        "cost_4_to_1_at_08": 0.6202247191011236
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_03",
        "family": "Gaussian",
        "representation": "raw57",
        "var_smoothing": 1e-07
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 13.897576384637478,
        "accuracy": 0.8235955056179776,
        "balanced_accuracy": 0.8434423651936617,
        "Brier": 0.1748837294978431,
        "confusion_ham_spam": [
          [
            414,
            133
          ],
          [
            24,
            319
          ]
        ],
        "precision": [
          0.9452054794520548,
          0.7057522123893806
        ],
        "recall": [
          0.7568555758683729,
          0.9300291545189504
        ],
        "f1": [
          0.8406091370558376,
          0.8025157232704403
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 451,
        "cost_4_to_1_at_08": 0.6202247191011236
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_04",
        "family": "Gaussian",
        "representation": "log1p57",
        "var_smoothing": 1e-11
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 10.041647954190767,
        "accuracy": 0.8314606741573034,
        "balanced_accuracy": 0.8487536043406655,
        "Brier": 0.16709769313876374,
        "confusion_ham_spam": [
          [
            423,
            124
          ],
          [
            26,
            317
          ]
        ],
        "precision": [
          0.9420935412026726,
          0.7188208616780045
        ],
        "recall": [
          0.773308957952468,
          0.924198250728863
        ],
        "f1": [
          0.8493975903614458,
          0.8086734693877551
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 440,
        "cost_4_to_1_at_08": 0.5820224719101124
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_05",
        "family": "Gaussian",
        "representation": "log1p57",
        "var_smoothing": 1e-09
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 10.041641521860113,
        "accuracy": 0.8314606741573034,
        "balanced_accuracy": 0.8487536043406655,
        "Brier": 0.1670976905004269,
        "confusion_ham_spam": [
          [
            423,
            124
          ],
          [
            26,
            317
          ]
        ],
        "precision": [
          0.9420935412026726,
          0.7188208616780045
        ],
        "recall": [
          0.773308957952468,
          0.924198250728863
        ],
        "f1": [
          0.8493975903614458,
          0.8086734693877551
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 440,
        "cost_4_to_1_at_08": 0.5820224719101124
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_06",
        "family": "Gaussian",
        "representation": "log1p57",
        "var_smoothing": 1e-07
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 10.040998402758792,
        "accuracy": 0.8314606741573034,
        "balanced_accuracy": 0.8487536043406655,
        "Brier": 0.16709742669089414,
        "confusion_ham_spam": [
          [
            423,
            124
          ],
          [
            26,
            317
          ]
        ],
        "precision": [
          0.9420935412026726,
          0.7188208616780045
        ],
        "recall": [
          0.773308957952468,
          0.924198250728863
        ],
        "f1": [
          0.8493975903614458,
          0.8086734693877551
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 440,
        "cost_4_to_1_at_08": 0.5820224719101124
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_07",
        "family": "Bernoulli",
        "representation": "presence54",
        "alpha": 0.1
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 0.6360730474193523,
        "accuracy": 0.8853932584269663,
        "balanced_accuracy": 0.8708833232953668,
        "Brier": 0.10257857485987074,
        "confusion_ham_spam": [
          [
            511,
            36
          ],
          [
            66,
            277
          ]
        ],
        "precision": [
          0.8856152512998267,
          0.8849840255591054
        ],
        "recall": [
          0.9341864716636198,
          0.8075801749271136
        ],
        "f1": [
          0.9092526690391459,
          0.8445121951219512
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 294,
        "cost_4_to_1_at_08": 0.21797752808988763
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_08",
        "family": "Bernoulli",
        "representation": "presence54",
        "alpha": 1.0
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 0.6383263068837718,
        "accuracy": 0.8820224719101124,
        "balanced_accuracy": 0.8675974437829455,
        "Brier": 0.10332902369976638,
        "confusion_ham_spam": [
          [
            509,
            38
          ],
          [
            67,
            276
          ]
        ],
        "precision": [
          0.8836805555555556,
          0.8789808917197452
        ],
        "recall": [
          0.9305301645338209,
          0.8046647230320699
        ],
        "f1": [
          0.9065004452359751,
          0.8401826484018264
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 296,
        "cost_4_to_1_at_08": 0.22134831460674156
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_09",
        "family": "Bernoulli",
        "representation": "presence54",
        "alpha": 10.0
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 0.6497543634282107,
        "accuracy": 0.8752808988764045,
        "balanced_accuracy": 0.8610256847581028,
        "Brier": 0.10773799076631817,
        "confusion_ham_spam": [
          [
            505,
            42
          ],
          [
            69,
            274
          ]
        ],
        "precision": [
          0.8797909407665505,
          0.8670886075949367
        ],
        "recall": [
          0.923217550274223,
          0.7988338192419825
        ],
        "f1": [
          0.9009812667261374,
          0.8315629742033384
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 296,
        "cost_4_to_1_at_08": 0.23258426966292134
      },
      "iterations": null
    },
    {
      "configuration": {
        "id": "candidate_10",
        "family": "logistic",
        "representation": "raw57",
        "C": 0.1
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 0.2359308883486588,
        "accuracy": 0.9157303370786517,
        "balanced_accuracy": 0.9031744847325193,
        "Brier": 0.06564768410447097,
        "confusion_ham_spam": [
          [
            524,
            23
          ],
          [
            52,
            291
          ]
        ],
        "precision": [
          0.9097222222222222,
          0.9267515923566879
        ],
        "recall": [
          0.9579524680073126,
          0.8483965014577259
        ],
        "f1": [
          0.9332146037399822,
          0.8858447488584474
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 247,
        "cost_4_to_1_at_08": 0.16404494382022472
      },
      "iterations": [
        32
      ]
    },
    {
      "configuration": {
        "id": "candidate_11",
        "family": "logistic",
        "representation": "raw57",
        "C": 1.0
      },
      "warnings": [],
      "eligible": true,
      "validation": {
        "log_loss": 0.2344121299605018,
        "accuracy": 0.9168539325842696,
        "balanced_accuracy": 0.9073504565054018,
        "Brier": 0.06175780013342721,
        "confusion_ham_spam": [
          [
            519,
            28
          ],
          [
            46,
            297
          ]
        ],
        "precision": [
          0.9185840707964602,
          0.9138461538461539
        ],
        "recall": [
          0.9488117001828154,
          0.8658892128279884
        ],
        "f1": [
          0.9334532374100719,
          0.8892215568862275
        ],
        "support": [
          547,
          343
        ],
        "positive_actions_at_08": 258,
        "cost_4_to_1_at_08": 0.15730337078651685
      },
      "iterations": [
        71
      ]
    },
    {
      "configuration": {
        "id": "candidate_12",
        "family": "logistic",
        "representation": "raw57",
        "C": 10.0
      },
      "warnings": [
        {
          "type": "RuntimeWarning",
          "message": "divide by zero encountered in log"
        }
      ],
      "eligible": false,
      "failure": {
        "type": "ValueError",
        "message": "Use finite normalized log probabilities in [ham, spam] order"
      }
    }
  ],
  "overall_winner": "candidate_11",
  "family_winners": {
    "Gaussian": "candidate_06",
    "Bernoulli": "candidate_07",
    "logistic": "candidate_11"
  },
  "test_reports": {
    "prior": {
      "log_loss": 0.6646012695366184,
      "accuracy": 0.6211111111111111,
      "balanced_accuracy": 0.5,
      "Brier": 0.23584954931548038,
      "confusion_ham_spam": [
        [
          559,
          0
        ],
        [
          341,
          0
        ]
      ],
      "precision": [
        0.6211111111111111,
        0.0
      ],
      "recall": [
        1.0,
        0.0
      ],
      "f1": [
        0.7662782727895819,
        0.0
      ],
      "support": [
        559,
        341
      ],
      "positive_actions_at_08": 0,
      "cost_4_to_1_at_08": 0.3788888888888889
    },
    "Gaussian": {
      "candidate": "candidate_06",
      "log_loss": 10.677199312028879,
      "accuracy": 0.8377777777777777,
      "balanced_accuracy": 0.8591168771213783,
      "Brier": 0.15920021736295575,
      "confusion_ham_spam": [
        [
          431,
          128
        ],
        [
          18,
          323
        ]
      ],
      "precision": [
        0.9599109131403119,
        0.7161862527716186
      ],
      "recall": [
        0.7710196779964222,
        0.9472140762463344
      ],
      "f1": [
        0.8551587301587301,
        0.8156565656565656
      ],
      "support": [
        559,
        341
      ],
      "positive_actions_at_08": 446,
      "cost_4_to_1_at_08": 0.5666666666666667
    },
    "Bernoulli": {
      "candidate": "candidate_07",
      "log_loss": 0.49429887447815796,
      "accuracy": 0.8911111111111111,
      "balanced_accuracy": 0.8780341938631511,
      "Brier": 0.09421040277750808,
      "confusion_ham_spam": [
        [
          521,
          38
        ],
        [
          60,
          281
        ]
      ],
      "precision": [
        0.8967297762478486,
        0.8808777429467085
      ],
      "recall": [
        0.9320214669051878,
        0.8240469208211144
      ],
      "f1": [
        0.9140350877192982,
        0.8515151515151516
      ],
      "support": [
        559,
        341
      ],
      "positive_actions_at_08": 299,
      "cost_4_to_1_at_08": 0.21888888888888888
    },
    "logistic": {
      "candidate": "candidate_11",
      "log_loss": 0.22066538208005895,
      "accuracy": 0.9277777777777778,
      "balanced_accuracy": 0.9218467204213641,
      "Brier": 0.05909118643146604,
      "confusion_ham_spam": [
        [
          529,
          30
        ],
        [
          35,
          306
        ]
      ],
      "precision": [
        0.9379432624113475,
        0.9107142857142857
      ],
      "recall": [
        0.9463327370304114,
        0.8973607038123167
      ],
      "f1": [
        0.9421193232413179,
        0.9039881831610044
      ],
      "support": [
        559,
        341
      ],
      "positive_actions_at_08": 267,
      "cost_4_to_1_at_08": 0.17666666666666667
    }
  },
  "reload_parity": {
    "Gaussian": {
      "max_test_log_difference": 8.731149137020111e-11,
      "edited_raw_case": [
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        2.0,
        4.0,
        8.0
      ],
      "edited_probabilities": [
        [
          1.0927845306514725e-09,
          0.9999999989072155
        ]
      ]
    },
    "Bernoulli": {
      "max_test_log_difference": 2.842170943040401e-14,
      "edited_raw_case": [
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        2.0,
        4.0,
        8.0
      ],
      "edited_probabilities": [
        [
          0.9999233867762818,
          7.661322371817038e-05
        ]
      ]
    },
    "logistic": {
      "max_test_log_difference": 0.0,
      "edited_raw_case": [
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        2.0,
        4.0,
        8.0
      ],
      "edited_probabilities": [
        [
          0.7943067968579873,
          0.2056932031420126
        ]
      ]
    }
  }
}
```

Save this file with `nb_discrete_core.py`, `nb_gaussian_online.py`,
`spambase.data`, `spambase.names`, `spambase.DOCUMENTATION`,
`spambase-provenance.md` and `SPAMBASE-LICENSE.txt` in one directory and run
`python nb-spambase-study.py`. The loader validates official file hashes and
exact role-index hashes before fitting. An exclusive output guard preserves an
existing or interrupted run; use the retained results for inspection instead of
overwriting them. The installed 1.9.1 logistic API uses `l1_ratio=0` for L2;
its old penalty argument is deprecated. This is the executed API snapshot.

All actual validation outcomes remain visible, including the failure:

| Candidate | Family and representation | Setting | Validation log loss | Eligibility |
| --- | --- | --- | --- | --- |
| 01 | Gaussian raw57 | 1e−11 | 13.903476 | yes |
| 02 | Gaussian raw57 | 1e−9 | 13.903417 | yes |
| 03 | Gaussian raw57 | 1e−7 | 13.897576 | yes |
| 04 | Gaussian log1p57 | 1e−11 | 10.041648 | yes |
| 05 | Gaussian log1p57 | 1e−9 | 10.041642 | yes |
| 06 | Gaussian log1p57 | 1e−7 | 10.040998 | family selected |
| 07 | Bernoulli presence54 | α=.1 | .636073 | family selected |
| 08 | Bernoulli presence54 | α=1 | .638326 | yes |
| 09 | Bernoulli presence54 | α=10 | .649754 | yes |
| 10 | Logistic raw57 | C=.1 | .235931 | yes |
| 11 | Logistic raw57 | C=1 | .234412 | overall/family selected |
| 12 | Logistic raw57 | C=10 | undefined under this API route | no: nonfinite log output |

Candidate 12's probability-before-log route emitted a divide-by-zero warning
and failed the finite-log criterion. Its outcome remains failed; it was not
retried with a new setting or rescued into the search. The overall winner 11
and family winners 06/07/11 were written to a validation lock before any test
reporting, with every fitted model retained from the 2,811 training rows.
No train-plus-validation refit occurs.

The selected logistic model also exposed probability rounding during test
reporting: its library `predict_log_proba` logs `predict_proba`, which can round
a saturated probability to zero. The finite decision score still defines valid
log odds. Reporting from the already saved state uses
`log p_0=−logaddexp(0,s)` and `log p_1=−logaddexp(0,−s)` without clipping or
changing coefficients. The original failed invocation and its source are
retained; a bounded state-only continuation completed the report with zero
refits and zero candidate retries. Validation outcomes and selection remain
exactly as locked. The displayed file incorporates this test-report arithmetic
repair; its corrected report route is checked against reloaded state.

| Prefrozen test route | Accuracy | Balanced accuracy | Log loss | Brier | Confusion `[ham row, spam row]` |
| --- | --- | --- | --- | --- | --- |
| Training prior | .621111 | .500000 | .664601 | .235850 | `[[559,0],[341,0]]` |
| Gaussian 06 | .837778 | .859117 | 10.677199 | .159200 | `[[431,128],[18,323]]` |
| Bernoulli 07 | .891111 | .878034 | .494299 | .094210 | `[[521,38],[60,281]]` |
| Logistic 11 | .927778 | .921847 | .220665 | .059091 | `[[529,30],[35,306]]` |

The Gaussian model detects many spam cases—recall `.947214`—but assigns
extreme incorrect probabilities, producing far worse log loss than the prior
baseline. Brier and classification accuracy expose different aspects of the
same prediction records. Bernoulli discards frequencies/capital features, yet
has a better probability score in this comparison. We therefore describe a
family **and representation**, rather than attributing all differences to one
algorithm alone. Logistic is the prefrozen overall choice on validation;
test observations report its generalization on this historical group split.

At the separately declared `4:1` cost threshold `.8`, positive action counts
are 0/446/299/267 for prior/Gaussian/Bernoulli/logistic and realized per-case
costs `.378889/.566667/.218889/.176667`. The Gaussian threshold cost is also
worse than the prior baseline. No model name certifies useful probabilities
at an operational threshold.

Frozen state stores scaler mean/scale, feature order, estimator parameters,
class order and representation. Bernoulli and Gaussian state reconstruct
scratch likelihoods without new fitting; logistic reconstructs its linear
decision score. Their maximum test log-probability differences from the
corresponding library report routes are approximately `8.73×10^−11`,
`2.84×10^−14` and zero. The supplied edited raw vector has make percentage 1,
other percentages zero and capital fields `[2,4,8]`: computed spam probabilities
are `.999999998907`, `.0000766132` and `.205693203142`. It has no observed
label, does not change the test records and is not asserted to reconstruct an
actual message. The huge disagreement is useful model inspection, not an
extra evaluated test outcome.

## 9. Check probabilities before choosing actions

The real-data comparison shows why class accuracy and probability quality need
separate assessment. A number computed by Bayes' rule is a model posterior.
**Calibration** asks whether cases assigned positive probability p have long-run
positive frequency p. A classifier can rank cases well while reporting
probabilities that are too extreme or moderate.

Look at actual case IDs joining bins before any reliability point appears.

<!-- DRAWING D34 -->

For each nonempty bin, calculate mean predicted probability and observed
positive fraction, then plot that pair against the diagonal equality line.
The case count matters: one case gives observed fraction zero or one regardless
of whether its probability estimate was reasonable. An empty bin has no point.
Changing two to six bins changes the grouping and curve, but not any individual
prediction, Brier loss or log loss. The twelve-case investigation keeps every
case's current prediction/outcome visible. The optional compression
`.15+.7p` changes predictions and therefore proper losses; it is a different
operation from changing bins. Select a bin to trace its exact memberships.

Finite bin points estimate reliability over ranges rather than proving exact
conditional calibration. A curve can hide subgroup differences, and changing
bin edges can make a small dataset appear more or less diagonal without
improving its predictions. Use case counts and proper scores alongside it.

### Proper losses reward truthful probabilities

Section 6 introduced a single probability-error square. Why should the average
square be smallest at the true probability? Hold a feature situation x fixed,
with true positive frequency `q=P(Y=1|x)`, and let the model choose p.

<!-- DRAWING D35: expected-loss view -->

The expected Brier curve is a parabola whose minimum lies at q. With q `.3`,
moving p away from `.3` adds the squared distance `(p−q)²` to the fixed
irreducible term `q(1−q)=.21`. A separate outcome square still shows the
realized `(p−y)²`, so population expectation and one observation stay distinct.

Expand the conditional expectation directly. Since binary `Y²=Y` and
`E[Y|x]=q`,

\[
E[(p-Y)^2\mid x]=p^2-2pq+q=(p-q)^2+q(1-q).
\]

The second term is fixed for this population. The first is nonnegative and
vanishes exactly at `p=q`, making Brier a **proper probability score**.
Binary log loss is `−y log p−(1−y)log(1−p)`. Its conditional expectation is

\[
-q\log p-(1-q)\log(1-p)
=H(q)+D_{\rm KL}(\operatorname{Bern}(q)\Vert\operatorname{Bern}(p)),
\]

where `H(q)=−q log q−(1−q)log(1−q)` is Bernoulli entropy and the remaining
term is the sum of `q log(q/p)` and `(1−q)log((1−q)/(1−p))`.
KL is nonnegative, with equality when the Bernoulli laws agree; equivalently,
differentiating expected log loss gives `(p−q)/(p(1−p))`, negative below q
and positive above it. The endpoints use limiting conventions: reporting zero
for an event that occurs gives infinite mathematical loss. Clipping a reported
probability is an explicit finite-report convention. The Spambase report instead
uses stable log probabilities from score arithmetic, retaining finite extreme
logs even when exponentiating them rounds a probability to zero.

Proper loss includes information/resolution as well as reliability. A constant
prior can be calibrated for the whole population but cannot distinguish cases.
A useful ranking with imperfect probabilities can still have lower proper loss.
Aggregate calibration does not imply subgroup calibration or equality with the
posterior given every available feature. [Calibration & Conformal Prediction](/learn/path/full-curriculum/calibration-conformal-prediction)
develops these distinct reliability and coverage questions.

### Fit a mapping from predictions made on new rows

Can we repair the relation between model scores and frequencies? A calibrator
fits that mapping, and therefore needs its own honest input/target boundary.

<!-- DRAWING D36 -->

The retained experiment has 800 base-fit rows, 800 separate calibration rows
and 1,200 test rows. Fit the base on the first stack; freeze it; make predictions
on the second stack to fit the mapping; compare both routes on the third.
Targets enter only the corresponding fitting ports. For text, freeze the whole
pipeline or keep preprocessing inside each calibration fold; freezing only the
classifier while refitting vocabulary would change the base being calibrated.

What kinds of mapping can those new predictions teach?

<!-- DRAWING D37 -->

A sigmoid fits a compact two-parameter curve of the **supplied score**.
An isotonic mapping sorts cases by score and pools adjacent groups when their
estimated positive rates decrease. Two equally sized groups with rates `.4`
then `.2` violate nondecreasing order; pooling produces `.3` for both. A flexible
step map can fit small calibration samples too closely. The curve picture is
an illustrative mapping shape; the original reported sigmoid range comes from
its saved experiment, rather than being asserted by the toy curve.

Inspect the actual score interface. In the tested scikit-learn version,
CalibratedClassifierCV uses `decision_function` when available, otherwise
predicted probabilities. GaussianNB lacks a decision function, so the fitted
sigmoid receives its probabilities. It is not automatically a sigmoid of the
original log-odds difference. Saturated probabilities can discard distinctions
still present in scores. The [published SVM interface](/learn/path/full-curriculum/support-vector-machines-svm#8-scores-probabilities-classes-and-data-contracts)
is a contrasting margin route, whose numerical value is also not a probability.

**calibrated-report.py — complete program.** Can calibration change an argmax, and does one lower Brier score establish calibration for every subgroup?

```python
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import brier_score_loss, log_loss, accuracy_score


def draw_cases(rng, count):
    y = rng.binomial(1, 0.3, size=count)
    reading = 1.5 * y + rng.normal(size=count)
    return np.column_stack([reading, reading]), y  # Exact copies, not two measurements.


def report(name, y, p):
    print(
        name,
        "accuracy",
        format(accuracy_score(y, p > 0.5), ".4f"),
        "Brier",
        format(brier_score_loss(y, p), ".6f"),
        "log loss",
        format(log_loss(y, p), ".6f"),
    )


rng = np.random.default_rng(2026)
X_fit, y_fit = draw_cases(rng, 800)
X_cal, y_cal = draw_cases(rng, 800)
X_test, y_test = draw_cases(rng, 1200)
base = GaussianNB().fit(X_fit, y_fit)
calibrated = CalibratedClassifierCV(FrozenEstimator(base), method="sigmoid")
calibrated.fit(X_cal, y_cal)  # No refit of frozen base; these rows fit the calibrator.
raw = base.predict_proba(X_test)[:, 1]
adjusted = calibrated.predict_proba(X_test)[:, 1]
report("prior-only", y_test, np.full(len(y_test), y_fit.mean()))
report("raw duplicate GNB", y_test, raw)
report("sigmoid calibrated", y_test, adjusted)
print("changed .5 decisions:", int(np.sum((raw > 0.5) != (adjusted > 0.5))))
observed, predicted = calibration_curve(y_test, adjusted, n_bins=5, strategy="uniform")
print("mean prediction by nonempty bin:", predicted.round(4).tolist())
print("observed positive fractions:", observed.round(4).tolist())
counts, _ = np.histogram(adjusted, bins=np.linspace(0, 1, 6))
print("bin sizes:", counts.tolist())
false_positive_cost, false_negative_cost = 4, 1
threshold = false_positive_cost / (false_positive_cost + false_negative_cost)
actions = adjusted > threshold  # Ties choose class0.
realized = np.where(
    actions & (y_test == 0),
    false_positive_cost,
    np.where(~actions & (y_test == 1), false_negative_cost, 0),
)
print(
    "declared-cost threshold:",
    threshold,
    "realized test cost per case:",
    format(realized.mean(), ".6f"),
)
print(
    "Fixed synthetic law and seed; finite test metrics do not guarantee future calibration."
)
```

Recorded original output (retained, not rerun):

```text
prior-only accuracy 0.7067 Brier 0.208372 log loss 0.607620
raw duplicate GNB accuracy 0.8000 Brier 0.147984 log loss 0.506139
sigmoid calibrated accuracy 0.8158 Brier 0.131472 log loss 0.416519
changed .5 decisions: 63
mean prediction by nonempty bin: [0.1067, 0.2888, 0.5091, 0.7329]
observed positive fractions: [0.0861, 0.2727, 0.4356, 0.7138]
bin sizes: [674, 121, 101, 304, 0]
declared-cost threshold: 0.8 realized test cost per case: 0.293333
Fixed synthetic law and seed; finite test metrics do not guarantee future calibration.
```

This retained synthetic law draws one reading, shifted by 1.5 for class 1,
then copies it into two identical columns. Rows are independent; columns in
a row are copied evidence. `FrozenEstimator(base)` freezes the fitted Gaussian
model, and the separate calibration targets fit only its sigmoid mapping.
At seed 2026, the mapping changes 63 decisions at `.5`, raises accuracy
`.8000→.8158`, and lowers Brier `.147984→.131472`. The full recorded output
includes its losses, bin predictions/fractions/counts and operating threshold.

Its sigmoid places no test predictions in `[.8,1]`. At the separately declared
`.8` action threshold it therefore takes no positive actions, incurring the
observed positive fraction as its per-case cost. Keep that operating limitation
beside the improved global scores. Choosing a mapping using this final test
would require a new untouched evaluation; calibration itself does not promise
an improvement for every metric, group or distribution.

Cross-validation calibration uses fresh complete base estimators in folds and
their held-out predictions. An ensemble configuration averages calibrated
fold-pair predictions; another configuration fits a mapping on out-of-fold
predictions and refits a base on all development rows. Their outputs need not
equal this simple three-way split. Class coverage and fitted preprocessing
remain part of each route's contract.

### Choose the action after identifying its costs

We have a positive probability; what decision should it support? Suppose
flagging ordinary mail costs `C_FP`, allowing junk costs `C_FN`, and correct
decisions have zero cost. Draw the two expected costs before solving the
threshold.

<!-- DRAWING D38 -->

At probability p, flagging costs `C_FP(1−p)` and allowing costs `C_FN p`.
The lines cross when those quantities agree. With costs `4:1`, their equality
is at `.8`. At p `.75`, the preferred class is spam, but flagging's cost is
`4×.25=1`, larger than allowing's cost `.75`. The action is allow under this
specified cost model. Identity marks for classes are separate from the action
and from cost line labels.

\[
C_{\rm FP}(1-p)<C_{\rm FN}p
\ \Longleftrightarrow\ p>\frac{C_{\rm FP}}{C_{\rm FP}+C_{\rm FN}}.
\]

At equality our policy chooses the negative action. Change p and either
positive cost in the lab; line heights, current costs and action update
together. The rule minimizes expected cost relative to the probability/cost
information actually supplied. If p is badly estimated, or costs depend on
case details absent from the model, that information needs repair. A threshold
does not calibrate a probability, and a monotone calibrator can move a case
across a fixed threshold while preserving ranking.

## 10. Connect the model to deeper ideas

We can now fit, preserve, diagnose and act on class evidence. Three connections
help explain the structure beneath these variants: linear log odds, uncertainty
shared across future tokens, and likelihoods of different measurement types.

### The training objective is not determined by the boundary shape

Return to the token counts of free and meeting. Where do their odds tie?

<!-- DRAWING D39 -->

The two axes are nonnegative token counts. With the five-word smoothed tables,
each free adds `log(28/11)` and each meeting adds `log(7/22)` to prior log odds
`log 2`. The zero-odds line is the set of count pairs whose positive and negative
contributions cancel. A probe's bar decomposition and coordinate position
therefore use the same counts. Reordering columns moves their identity labels,
not their assigned weights or the score.

\[
\log\frac{P(1\mid x)}{P(0\mid x)}
=\log\frac{\pi_1}{\pi_0}+\sum_jx_j\log\frac{\theta_{1j}}{\theta_{0j}}
=b+w^Tx.
\]

MNB's fixed-table log odds are linear in count coordinates. Fitting still
maximizes a joint likelihood through class statistics; logistic fits conditional
log loss, and SVM fits a regularized margin objective. The same functional
family does not identify the objective or force the coefficients to agree.
Section 5's unequal Gaussian variances contrast this with quadratic score ratios.

Using nonnegative fractional TF–IDF values in the same sum can be a useful
validated scoring extension. A noninteger vector is not a literal multinomial
count event: its factorial multiplicity and physical draw interpretation have
changed. N-gram features restore some local order while overlapping n-grams
also introduce dependencies. State the representation, compare it inside
development folds and assess probability behavior after the change.

### Deeper: integrate one shared uncertain composition

Section 3's Dirichlet posterior mean predicts one token. Does multiplying that
mean predict a whole future document? The future tokens share the same unknown
composition, so average their complete likelihood together.

<!-- DRAWING D40 -->

For posterior shapes `(4,1)`, the composition axis describes uncertainty about
the probability of A. The plug-in branch fixes it at mean `4/5`, giving AA
probability `(4/5)²=16/25=.64`. The integrated branch shares the uncertain
composition between both future positions and gives `(4/5)(5/6)=2/3`.
The second factor is a predictive factoring of the joint law, not a fit on an
observed test label. At any fixed θ the two draws remain independent;
averaging over that shared θ induces dependence.

Let `A_j>0` be posterior Dirichlet shapes and `A_0=Σ A_j`. Define the rising
product `a^(overline m)=a(a+1)…(a+m−1)`, with the zero-length product one.
Integrating the count event gives

\[
P(x\mid\mathrm{training})=
\frac{N!}{\prod_jx_j!}\frac{\prod_jA_j^{\overline{x_j}}}{A_0^{\overline N}}.
\]

Here is why: the Dirichlet density has power exponents `A_j−1` and normalizer
`B(A)=∏Γ(A_j)/Γ(A_0)`. Multiplying by `∏θ_j^x_j` changes its exponents to
`A_j+x_j−1`; integration over the simplex gives `B(A+x)/B(A)`. The gamma
identity `Γ(a+m)/Γ(a)=a^(overline m)` yields the rising products. Restore the
multinomial coefficient to count all equivalent token orders. For one token,
the ratio reduces to `A_j/A_0`, exactly the posterior mean used earlier.

**count-law.py — complete program.** Why can the multinomial coefficient be dropped for classification but not from an actual count probability?

```python
from fractions import Fraction as F
from math import factorial
from itertools import product


def multinomial_mass(counts, probabilities):
    if any(type(k) is not int or k < 0 for k in counts):
        raise ValueError("Use nonnegative integer counts")
    if len(counts) != len(probabilities) or sum(probabilities) != 1:
        raise ValueError("Use a probability for every category")
    coefficient = factorial(sum(counts))
    for k in counts:
        coefficient //= factorial(k)
    result = F(coefficient)
    for k, probability in zip(counts, probabilities):
        result *= probability**k
    return result


def integrated_mass(counts, shapes):
    if len(counts) != len(shapes) or any(type(a) is not int or a <= 0 for a in shapes):
        raise ValueError("Use matching positive integer Dirichlet shapes")
    if any(type(k) is not int or k < 0 for k in counts):
        raise ValueError("Use nonnegative integer counts")
    numerator = factorial(sum(counts))
    denominator = 1
    for k, a in zip(counts, shapes):
        denominator *= factorial(k)
        for j in range(k):
            numerator *= a + j
    for j in range(sum(counts)):
        denominator *= sum(shapes) + j
    return F(numerator, denominator)


theta = [F(4, 5), F(1, 5)]
print("ordered AB:", theta[0] * theta[1])
print("one A and one B:", multinomial_mass([1, 1], theta))
print(
    "three-token masses:", [str(multinomial_mass([k, 3 - k], theta)) for k in range(4)]
)
print("sum:", sum(multinomial_mass([k, 3 - k], theta) for k in range(4)))
for counts in ([2, 0], [1, 1]):
    print(
        "counts",
        counts,
        "plug-in:",
        multinomial_mass(counts, theta),
        "integrated:",
        integrated_mass(counts, [4, 1]),
    )
plugin = [multinomial_mass([2, 0], p) for p in (theta, theta[::-1])]
integrated = [integrated_mass([2, 0], a) for a in ([4, 1], [1, 4])]
print("equal-prior class0 posterior, plug-in:", plugin[0] / sum(plugin))
print("equal-prior class0 posterior, integrated:", integrated[0] / sum(integrated))
```

Recorded original output (retained, not rerun):

```text
ordered AB: 4/25
one A and one B: 8/25
three-token masses: ['1/125', '12/125', '48/125', '64/125']
sum: 1
counts [2, 0] plug-in: 16/25 integrated: 2/3
counts [1, 1] plug-in: 8/25 integrated: 4/15
equal-prior class0 posterior, plug-in: 16/17
equal-prior class0 posterior, integrated: 10/11
```

The original exact integer-shape program distinguishes AB from its count event,
checks all three-token count masses sum to one, and compares plug-in and
integrated class normalization. Equal-prior class shapes `(4,1),(1,4)` give
AA posterior `16/17` under plug-in tables and `10/11` under integration.
Integration increases both classes' repeated-token mass differently; it does
not simply increase every final class posterior.

Larger counts and fractional positive shapes make gamma **logs** preferable to
factorials. The complete new route implements

\[
\log P(x)=\log N!-\sum_j\log x_j!+\log\Gamma(A_0)-\log\Gamma(A_0+N)
+\sum_j[\log\Gamma(A_j+x_j)-\log\Gamma(A_j)].
\]

**nb-integrated-predictive.py — complete file.**

```python
"""Dirichlet-multinomial count events with positive real shapes."""
import json
import math
from fractions import Fraction
import numpy as np
from scipy.special import gammaln, logsumexp
from scipy.stats import dirichlet_multinomial


def log_mass(counts, shapes):
    x, a = np.asarray(counts, dtype=float), np.asarray(shapes, dtype=float)
    if (x.ndim != 1 or len(x) < 2 or a.shape != x.shape or not np.isfinite(x).all()
            or not np.isfinite(a).all() or (x < 0).any() or not np.equal(x, np.floor(x)).all()
            or (a <= 0).any() or (a > 1e6).any() or (x > 1e6).any()):
        raise ValueError("Use matching integer counts in [0,1e6] and positive shapes at most 1e6")
    n, total = x.sum(), a.sum()
    return float(gammaln(n + 1) - gammaln(x + 1).sum() + gammaln(total) - gammaln(total + n)
                 + (gammaln(a + x) - gammaln(a)).sum())


def exact_mass(counts, shapes):
    if any(type(k) is not int or not 0 <= k <= 100 for k in counts):
        raise ValueError("Exact reference supports small nonnegative integer counts")
    if len(shapes) != len(counts) or any(Fraction(a) <= 0 for a in shapes):
        raise ValueError("Use positive rational shapes for the exact reference")
    result = Fraction(math.factorial(sum(counts)))
    for count, shape in zip(counts, shapes):
        result /= math.factorial(count)
        for j in range(count):
            result *= Fraction(shape) + j
    for j in range(sum(counts)):
        result /= sum(map(Fraction, shapes)) + j
    return result


class IntegratedPredictive:
    def __init__(self, classes, schema, shapes, priors):
        self.classes = list(classes)
        self.schema = list(schema)
        self.shapes = np.asarray(shapes, dtype=float)
        self.priors = np.asarray(priors, dtype=float)
        if (len(set(self.classes)) != len(self.classes) or len(set(self.schema)) != len(self.schema)
                or self.shapes.shape != (len(self.classes), len(self.schema))
                or self.priors.shape != (len(self.classes),) or not np.isfinite(self.priors).all()
                or (self.priors <= 0).any() or not np.isclose(self.priors.sum(), 1, atol=1e-12, rtol=0)):
            raise ValueError("Name every class/category and normalized positive priors")
        for shape in self.shapes:
            log_mass(np.zeros(len(self.schema)), shape)

    def predict_log_proba(self, counts, schema=None):
        if schema is not None and list(schema) != self.schema:
            raise ValueError("Category identity/order differs from the saved shapes")
        scores = np.array([np.log(p) + log_mass(counts, a) for p, a in zip(self.priors, self.shapes)])
        if not np.isfinite(scores).all():
            raise ValueError("Predictive scores exceed arithmetic range")
        return scores - logsumexp(scores)

    def export_state(self):
        return {"format": "nb-integrated-v1", "classes": self.classes, "schema": self.schema,
                "shapes": self.shapes.tolist(), "priors": self.priors.tolist()}

    @classmethod
    def from_state(cls, state, expected_schema=None):
        if state.get("format") != "nb-integrated-v1":
            raise ValueError("Unknown integrated event convention")
        if expected_schema is not None and list(expected_schema) != state["schema"]:
            raise ValueError("Stale category schema")
        return cls(state["classes"], state["schema"], state["shapes"], state["priors"])


def main():
    cases = [([2, 0], [4, 1]), ([1, 1], [4, 1]), ([3, 2], [.5, 1.25]),
             ([100, 80, 20], [.5, 1.25, 2.75]), ([1000, 2000, 3000], [.1, .2, .3])]
    outcomes = []
    for x, a in cases:
        own = log_mass(x, a)
        ordinary = float(dirichlet_multinomial.logpmf(x, a, sum(x)))
        assert np.isclose(own, ordinary, atol=2e-10, rtol=1e-12)
        row = {"counts": x, "shapes": a, "log_mass": own,
               "library_log_mass": ordinary, "probability": float(np.exp(own))}
        if max(x) <= 100:
            exact = exact_mass(x, [Fraction(str(v)) for v in a])
            row["exact_mass"] = str(exact)
            assert np.isclose(float(exact), np.exp(own), atol=1e-12, rtol=1e-10)
        outcomes.append(row)
    model = IntegratedPredictive([0, 1], ["A", "B"], [[4, 1], [1, 4]], [.5, .5])
    restored = IntegratedPredictive.from_state(json.loads(json.dumps(model.export_state())), ["A", "B"])
    p = np.exp(model.predict_log_proba([2, 0]))
    assert np.allclose(p, np.exp(restored.predict_log_proba([2, 0])))
    print(json.dumps({"cases": outcomes, "class_posterior_AA": p.tolist(),
                     "plugin_class0_posterior": 16 / 17,
                     "one_token_mean": 4 / 5, "one_token_integrated": np.exp(log_mass([1, 0], [4, 1])),
                     "state": model.export_state(), "roundtrip_equal": True}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "cases": [
    {
      "counts": [
        2,
        0
      ],
      "shapes": [
        4,
        1
      ],
      "log_mass": -0.4054651081081646,
      "library_log_mass": -0.4054651081081646,
      "probability": 0.6666666666666665,
      "exact_mass": "2/3"
    },
    {
      "counts": [
        1,
        1
      ],
      "shapes": [
        4,
        1
      ],
      "log_mass": -1.3217558399823193,
      "library_log_mass": -1.3217558399823193,
      "probability": 0.2666666666666667,
      "exact_mass": "4/15"
    },
    {
      "counts": [
        3,
        2
      ],
      "shapes": [
        0.5,
        1.25
      ],
      "log_mass": -2.235049492505072,
      "library_log_mass": -2.2350494925050723,
      "probability": 0.10698683467562194,
      "exact_mass": "3600/33649"
    },
    {
      "counts": [
        100,
        80,
        20
      ],
      "shapes": [
        0.5,
        1.25,
        2.75
      ],
      "log_mass": -12.926619105835016,
      "library_log_mass": -12.926619105835094,
      "probability": 2.4324316891863183e-06,
      "exact_mass": "13201541548135606298057344212329493589302475186689141942456799577534355815581732400025/5427302072581462425222917110461132092044507690213516114133834981354039371441196681513664512"
    },
    {
      "counts": [
        1000,
        2000,
        3000
      ],
      "shapes": [
        0.1,
        0.2,
        0.3
      ],
      "log_mass": -18.89679373659601,
      "library_log_mass": -18.896793736590553,
      "probability": 6.211932880099938e-09
    }
  ],
  "class_posterior_AA": [
    0.9090909090909092,
    0.09090909090909094
  ],
  "plugin_class0_posterior": 0.9411764705882353,
  "one_token_mean": 0.8,
  "one_token_integrated": 0.8000000000000004,
  "state": {
    "format": "nb-integrated-v1",
    "classes": [
      0,
      1
    ],
    "schema": [
      "A",
      "B"
    ],
    "shapes": [
      [
        4.0,
        1.0
      ],
      [
        1.0,
        4.0
      ]
    ],
    "priors": [
      0.5,
      0.5
    ]
  },
  "roundtrip_equal": true
}
```

`gammaln` keeps huge multiplicative terms in log space; its count validator
still requires integers and its shapes remain positive real values. An exact
small Fraction recurrence supplies a separate oracle. Ordinary
`scipy.stats.dirichlet_multinomial.logpmf(x,a,n)` receives the same count event,
shapes and length. For shapes `(.5,1.25)` and counts `[3,2]`, the exact
probability is `3600/33649≈.106986835`; the log-gamma and library routes agree.
Long counts `[1000,2000,3000]` avoid factorial overflow and retain their small
log mass. The class wrapper stores shapes, priors and ordered names, validates
reload and normalizes across class scores. Work is `O(V)` for one count vector;
the exact Fraction route is intentionally only for small inspectable fixtures.

In the lab, edit a shape vector and a matching integer count vector, keeping
their full active values visible. One-token equality, repeated-token difference
and supported log output are useful changed cases. [Bayesian Inference &
Conjugate Priors](/learn/path/full-curriculum/bayesian-inference-conjugate-priors) develops the posterior
normalizers more broadly. A library name containing Bayes does not by itself
mean parameters are integrated during prediction.

### Combine different feature families with one class prior

Mail and machine records often mix categories, binary events and continuous
readings. We do not need to force all of them into one numeric event model.
Each can contribute an appropriate class likelihood to one shared comparison.

<!-- DRAWING D41 -->

The device fixture has four class-0 records
`[(0,1,−1),(0,1,0),(1,0,1),(0,1,2)]` and four class-1 records
`[(1,0,0),(1,0,1),(0,1,2),(1,0,3)]`, with fields
`(status code, alarm present, reading in mV)`. Fit a categorical status table,
a Bernoulli alarm table and a Gaussian reading table on the same labels and
rows. Equal priors are shared. The default query is `(0,1,.5)`.

The drawing keeps category, binary and continuous branches labelled with
different stable family cues. Each sends a likelihood log term to an addition
port; the class prior joins once, then normalization produces a class
probability. A mask changes “measured” state separately from branch identity.
Missing status, alarm or reading contributes factor one only under the same
ignorable-observation assumption introduced in D15.

\[
s_c(x,m)=\log\pi_c+\sum_{j:m_j=\mathrm{observed}}\log L_{cj}(x_j).
\]

Every component must agree on class order. A useful trap is to add three
component **joint scores**: each already contains a prior, giving `π_c³`
instead of `π_c`. The safer construction extracts prior-free per-feature
likelihoods, adds them and then inserts the common prior once. With all
features missing, the result is that prior.

**nb-mixed-record.py — complete file.**

```python
"""Run beside both quiet helpers: per-feature masks and one shared prior."""
import json
import numpy as np
from sklearn.naive_bayes import CategoricalNB, BernoulliNB, GaussianNB
from nb_discrete_core import CategoricalModel, BernoulliModel, normalize
from nb_gaussian_online import GaussianOnline


class MixedModel:
    def __init__(self, alpha=1., variance_floor=1e-9, priors=None):
        self.alpha, self.variance_floor, self.priors = alpha, variance_floor, priors

    @staticmethod
    def record(X):
        X = np.asarray(X, dtype=float)
        if (X.ndim != 2 or not len(X) or X.shape[1] != 3 or not np.isfinite(X).all()
                or not np.isin(X[:, 0], [0, 1]).all() or not np.isin(X[:, 1], [0, 1]).all()
                or (np.abs(X[:, 2]) > 1e6).any()):
            raise ValueError("Use (status code 0/1, alarm 0/1, finite reading within +/-1e6)")
        return X

    def fit(self, X, y, sample_weight=None):
        X = self.record(X)
        self.category = CategoricalModel([["idle", "busy"]], self.alpha, ["status"], self.priors)
        self.binary = BernoulliModel(self.alpha, ["alarm"], self.priors)
        self.gaussian = GaussianOnline(self.variance_floor, ["reading"], ["mV"], self.priors)
        self.category.fit(X[:, :1], y, sample_weight)
        self.binary.fit(X[:, 1:2], y, sample_weight)
        self.gaussian.fit(X[:, 2:3], y, sample_weight)
        self.classes_ = self.category.classes_.copy()
        if not (np.array_equal(self.classes_, self.binary.classes_) and
                np.array_equal(self.classes_, self.gaussian.classes_) and
                np.allclose(self.category.prior_, self.gaussian.prior_)):
            raise ValueError("Every family must use the same labels, rows, weights and class prior")
        self.prior_ = self.category.prior_.copy()
        return self

    def components(self, X):
        X = self.record(X)
        category = self.category.feature_log_prob_[0][:, X[:, 0].astype(int)].T
        phi = self.binary.theta_[:, 0]
        binary = np.where(X[:, 1, None] == 1, np.log(phi), np.log1p(-phi))
        gaussian = self.gaussian.log_likelihood(X[:, 2:3])
        return [category, binary, gaussian]  # Likelihoods without three duplicated priors.

    def log_joint(self, X, mask=None):
        pieces = self.components(X)
        n = pieces[0].shape[0]
        mask = np.ones((n, 3), dtype=bool) if mask is None else np.asarray(mask)
        if mask.shape != (n, 3) or mask.dtype.kind != "b":
            raise ValueError("Use one Boolean observed flag per feature and row")
        scores = np.tile(self.category.class_log_prior_, (n, 1))
        for j, term in enumerate(pieces):
            scores += np.where(mask[:, j, None], term, 0.)
        return scores

    def predict_proba(self, X, mask=None):
        return np.exp(normalize(self.log_joint(X, mask)))

    def export_state(self):
        return {"format": "nb-mixed-v1", "feature_order": ["status", "alarm", "reading"],
                "mask_meaning": "observed Boolean; missing process assumed ignorable",
                "category": self.category.export_state(), "binary": self.binary.export_state(),
                "gaussian": self.gaussian.export_state()}

    @classmethod
    def from_state(cls, state):
        if state.get("format") != "nb-mixed-v1" or state["feature_order"] != ["status", "alarm", "reading"]:
            raise ValueError("Stale mixed feature order or convention")
        obj = cls()
        obj.category = CategoricalModel.from_state(state["category"], ["status"])
        obj.binary = BernoulliModel.from_state(state["binary"], ["alarm"])
        obj.gaussian = GaussianOnline.from_state(state["gaussian"], ["reading"], ["mV"])
        obj.classes_ = obj.category.classes_.copy()
        if not (np.array_equal(obj.classes_, obj.binary.classes_) and np.array_equal(obj.classes_, obj.gaussian.classes_)
                and np.array_equal(obj.category.prior_, obj.binary.prior_)
                and np.array_equal(obj.category.prior_, obj.gaussian.prior_)):
            raise ValueError("Families do not share class order/prior")
        obj.prior_ = obj.category.prior_.copy()
        return obj


def library_components(X, category, binary, gaussian, classes):
    """Use actual fitted per-feature parameters and explicit semantic class order."""
    def align(term, model):
        positions = [list(model.classes_).index(c) for c in classes]
        return term[:, positions]
    status = align(category.feature_log_prob_[0][:, X[:, 0].astype(int)].T, category)
    phi = np.exp(binary.feature_log_prob_[:, 0])
    alarm = align(np.where(X[:, 1, None] == 1, np.log(phi), np.log1p(-phi)), binary)
    reading = -.5 * (np.log(2 * np.pi * gaussian.var_[:, 0])
                       + (X[:, 2, None] - gaussian.theta_[:, 0]) ** 2 / gaussian.var_[:, 0])
    return [status, alarm, align(reading, gaussian)]


def main():
    X = np.array([[0, 1, -1], [0, 1, 0], [1, 0, 1], [0, 1, 2],
                  [1, 0, 0], [1, 0, 1], [0, 1, 2], [1, 0, 3]], dtype=float)
    y = np.repeat([0, 1], 4)
    query = np.array([[0, 1, .5], [1, 0, 2.], [0, 0, -1.]])
    model = MixedModel().fit(X, y)
    c = CategoricalNB(alpha=1, force_alpha=True, min_categories=[2]).fit(X[:, :1], y)
    b = BernoulliNB(alpha=1, force_alpha=True, binarize=None).fit(X[:, 1:2], y)
    # Match the scratch absolute floor for this batch instead of claiming default parity.
    smoothing = 1e-9 / X[:, 2].var()
    g = GaussianNB(var_smoothing=smoothing).fit(X[:, 2:3], y)
    likelihoods = library_components(query, c, b, g, model.classes_)
    rows = []
    for mask in ([True, True, True], [True, False, True], [False, False, False]):
        observed = np.tile(mask, (len(query), 1))
        scores = np.tile(c.class_log_prior_, (len(query), 1))
        for j, term in enumerate(likelihoods):
            scores += np.where(observed[:, j, None], term, 0.)
        p = model.predict_proba(query, observed)
        assert np.allclose(p, np.exp(normalize(scores)), atol=1e-12)
        rows.append({"mask": mask, "probabilities": p.tolist(),
                     "max_library_difference": float(np.max(np.abs(p - np.exp(normalize(scores)))))})
    restored = MixedModel.from_state(json.loads(json.dumps(model.export_state())))
    assert np.allclose(restored.predict_proba(query), model.predict_proba(query))
    changed = MixedModel(priors=[.25, .75]).fit(X, y)
    honest = changed.predict_proba(query)
    wrong = np.exp(normalize(changed.log_joint(query) + changed.category.class_log_prior_))
    print(json.dumps({"fixture": X.tolist(), "classes": model.classes_.tolist(), "query": query.tolist(),
                     "likelihood_terms": [term.tolist() for term in model.components(query)],
                     "mask_results": rows, "roundtrip_equal": True, "state": model.export_state(),
                     "library_matched_var_smoothing": smoothing, "library_epsilon": float(g.epsilon_),
                     "changed_prior_probabilities": honest.tolist(), "duplicated_prior_bug": wrong.tolist()},
                     indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
```

Recorded new-program output:

```json
{
  "fixture": [
    [
      0.0,
      1.0,
      -1.0
    ],
    [
      0.0,
      1.0,
      0.0
    ],
    [
      1.0,
      0.0,
      1.0
    ],
    [
      0.0,
      1.0,
      2.0
    ],
    [
      1.0,
      0.0,
      0.0
    ],
    [
      1.0,
      0.0,
      1.0
    ],
    [
      0.0,
      1.0,
      2.0
    ],
    [
      1.0,
      0.0,
      3.0
    ]
  ],
  "classes": [
    0,
    1
  ],
  "query": [
    [
      0.0,
      1.0,
      0.5
    ],
    [
      1.0,
      0.0,
      2.0
    ],
    [
      0.0,
      0.0,
      -1.0
    ]
  ],
  "likelihood_terms": [
    [
      [
        -0.40546510810816444,
        -1.0986122886681098
      ],
      [
        -1.0986122886681098,
        -0.40546510810816444
      ],
      [
        -0.40546510810816444,
        -1.0986122886681098
      ]
    ],
    [
      [
        -0.40546510810816444,
        -1.0986122886681098
      ],
      [
        -1.0986122886681096,
        -0.40546510810816433
      ],
      [
        -1.0986122886681096,
        -0.40546510810816433
      ]
    ],
    [
      [
        -1.0305103092617776,
        -1.4305103089417774
      ],
      [
        -1.9305103085417774,
        -1.1305103091817776
      ],
      [
        -1.9305103085417774,
        -3.5305103072617774
      ]
    ]
  ],
  "mask_results": [
    {
      "mask": [
        true,
        true,
        true
      ],
      "probabilities": [
        [
          0.856472353155251,
          0.1435276468447489
        ],
        [
          0.10098802943083822,
          0.8990119705691618
        ],
        [
          0.8320183849550268,
          0.16798161504497325
        ]
      ],
      "max_library_difference": 5.551115123125783e-17
    },
    {
      "mask": [
        true,
        false,
        true
      ],
      "probabilities": [
        [
          0.7489738927768399,
          0.25102610722316016
        ],
        [
          0.18344982276155095,
          0.8165501772384491
        ],
        [
          0.9083078988592701,
          0.09169210114072997
        ]
      ],
      "max_library_difference": 2.220446049250313e-16
    },
    {
      "mask": [
        false,
        false,
        false
      ],
      "probabilities": [
        [
          0.5,
          0.5
        ],
        [
          0.5,
          0.5
        ],
        [
          0.5,
          0.5
        ]
      ],
      "max_library_difference": 0.0
    }
  ],
  "roundtrip_equal": true,
  "state": {
    "format": "nb-mixed-v1",
    "feature_order": [
      "status",
      "alarm",
      "reading"
    ],
    "mask_meaning": "observed Boolean; missing process assumed ignorable",
    "category": {
      "format": "nb-discrete-v1",
      "family": "categorical",
      "alpha": 1.0,
      "schema": [
        "status"
      ],
      "classes": [
        0,
        1
      ],
      "class_count": [
        4.0,
        4.0
      ],
      "priors": null,
      "categories": [
        [
          "idle",
          "busy"
        ]
      ],
      "category_count": [
        [
          [
            3.0,
            1.0
          ],
          [
            1.0,
            3.0
          ]
        ]
      ]
    },
    "binary": {
      "format": "nb-discrete-v1",
      "family": "bernoulli",
      "alpha": 1.0,
      "schema": [
        "alarm"
      ],
      "classes": [
        0,
        1
      ],
      "class_count": [
        4.0,
        4.0
      ],
      "priors": null,
      "feature_count": [
        [
          3.0
        ],
        [
          1.0
        ]
      ]
    },
    "gaussian": {
      "format": "nb-gaussian-M2-v1",
      "classes": [
        0,
        1
      ],
      "schema": [
        "reading"
      ],
      "units": [
        "mV"
      ],
      "variance_floor": [
        1e-09
      ],
      "class_count": [
        4.0,
        4.0
      ],
      "mean": [
        [
          0.5
        ],
        [
          1.5
        ]
      ],
      "M2": [
        [
          5.0
        ],
        [
          5.0
        ]
      ],
      "priors": null
    }
  },
  "library_matched_var_smoothing": 6.666666666666667e-10,
  "library_epsilon": 1e-09,
  "changed_prior_probabilities": [
    [
      0.6654510939464541,
      0.3345489060535458
    ],
    [
      0.03609262520811495,
      0.9639073747918852
    ],
    [
      0.62278539275292,
      0.37721460724708
    ]
  ],
  "duplicated_prior_bug": [
    [
      0.39868909366454675,
      0.6013109063354531
    ],
    [
      0.012327496202840712,
      0.9876725037971594
    ],
    [
      0.3549789228358708,
      0.6450210771641292
    ]
  ]
}
```

Save it beside the two quiet helpers and run `python nb-mixed-record.py`.
`MixedModel.components` reads categorical log tables, selects present/absent
binary logs and uses Gaussian `log_likelihood`; these pieces contain no prior.
`log_joint` applies a Boolean mask per row and feature, then adds the common
prior once. The ordinary route extracts the same class-aligned likelihoods
from separate CategoricalNB/BernoulliNB/GaussianNB fits. For this batch it
sets Gaussian `var_smoothing` to match the scratch absolute floor, rather
than comparing unmatched defaults. The state stores family types, field order,
units, tables and mask meaning; reload checks shared class order and priors.

The output compares complete, alarm-missing and all-missing queries, with
scratch/library agreement and JSON roundtrip. A second explicitly changed
prior `[.25,.75]` compares proper scoring with the duplicated-prior bug. A
mask does not permit NaN input into numerical arithmetic: placeholders remain
finite and validated, while the mask says whether a likelihood is used.
Status code relabeling must permute both mapping and table; changing units
requires the Gaussian mean/variance/floor conversion. Families are not ordered
by their numeric codes or by the position returned by an unrelated estimator.

This additive log-likelihood view connects to richer graphical models.
[Bayesian Networks & Causal Graphical Models](/learn/path/full-curriculum/bayesian-networks-causal-graphical-models)
teaches factorization, including its tree-augmented NB branch; graph arrows
require their own probabilistic assumptions. [Gaussian Mixtures & EM](/learn/path/full-curriculum/gaussian-mixture-models-gmm-em-algorithm)
models latent components inside a class. Kernel-density/additive discriminant
likelihoods and averaged one-dependence classifiers are specialist extensions
to read in their sources, rather than new implementation promises here.

We have now separated word likelihood, margin, probability, class and action.
The next [Ensemble Methods & Stacking](/learn/path/full-curriculum/ensemble-methods-stacking) lesson
combines model outputs and adds a new fitting boundary: a combiner should learn
from predictions that respect each row's base-training boundary. Agreement
among models is not independent evidence merely because their names differ.

## 11. Practise with new observations

Try each task before opening its hint and solution. Keep the observation event,
prior, units and fitted schema stated in the question. A correct computation
under a silently substituted model answers a different question.

### 1. New priors and opposing words

Keep the five-word alpha=1 model, but set the spam prior to 1/3. Find the spam posterior for free meeting. Which term changes relative to the original prior?

<details><summary>Hint</summary>

Multiply the new prior odds by 28/11 for free and 7/22 for meeting, then convert odds to probability.

</details>
<details><summary>Explained solution</summary>

The likelihood ratio is (28/11)(7/22)=98/121. New prior odds are (1/3)/(2/3)=1/2, so posterior odds are 49/121 and P(spam)=49/170≈0.288235. Only the prior log-odds term changes; the fixed class token tables do not. With the original prior 2/3, the probability would be 196/317≈0.618297. Changing prevalence can change the decision without changing token likelihoods, under the stated stable-likelihood assumption.

</details>

### 2. Unseen in a class is not unknown to the vocabulary

With alpha=0, submit free meeting to the three-document model. Then submit only zephyronic. Explain the different failures or fallbacks, and what positive alpha changes.

<details><summary>Hint</summary>

One known word is impossible under each class; an unknown word contributes no column in this particular fitted representation.

</details>
<details><summary>Explained solution</summary>

Ham assigns zero probability to free, and spam assigns zero probability to meeting. Both complete-message weights are zero, so Bayes normalization is undefined. Positive smoothing gives both classes support on the known words and repairs that specific issue. Zephyronic is absent from the entire vocabulary and is ignored by this stated tokenizer/vectorizer policy; its zero-feature row returns the class prior. Raising alpha does not create a zephyronic feature. Handling unknown words requires a representation policy, not just a probability-floor setting.

</details>

### 3. Use the absent feature

Two classes have equal priors. In class 1, two binary features have presence probabilities (.8,.2); in class 0 they are (.4,.6). For the complete observation (1, 0), calculate P(class 1). What if the second feature was genuinely unobserved rather than zero?

<details><summary>Hint</summary>

The observed zero contributes 1 minus its presence probability. An omitted factor requires an appropriate missingness assumption.

</details>
<details><summary>Explained solution</summary>

Class 1 weight is .5×.8×.8=.32; class 0 weight is .5×.4×.4=.08. The posterior is .32/.40=.8. If feature 2 is unobserved and the observation process adds no class evidence, marginalizing it contributes one; the posterior becomes .8/(.8+.4)=2/3. Treating a missing measurement as an absent event would report a different answer without the corresponding observation.

</details>

### 4. Find both Gaussian crossings

Two equally common classes have mean 0 and standard deviations 1 and 3 in the same unit. Find their density crossings and the posterior of the wider class at x=0.

<details><summary>Hint</summary>

The wide-to-narrow log-density ratio is −log 3 + (4/9)x².

</details>
<details><summary>Explained solution</summary>

The crossings satisfy x²=(9/4)log 3, so x=±(3/2)√log 3≈±1.572221. Both signs matter: the wide class wins in both far tails. At the common mean its density is one third of the narrow density, so equal priors give the wide class posterior 1/4. This is a model calculation, not a statement that the point itself has probability 1/4 under a continuous distribution.

</details>

### 5. Convert coordinates without changing the observation

Convert every input, mean and standard deviation in a Gaussian classifier from millivolts to volts. What happens to each one-dimensional density and to the normalized class probabilities? What must happen to an absolute variance floor?

<details><summary>Hint</summary>

One volt is 1000 millivolts. Density has reciprocal measurement units; variance has squared units.

</details>
<details><summary>Explained solution</summary>

The numeric coordinate and standard deviation divide by 1000, while variance divides by 10⁶. Each one-dimensional density expressed per volt is 1000 times its value expressed per millivolt. The same factor applies to every class and cancels from the posterior. For d consistently converted dimensions the common factor is 1000ᵈ. An absolute variance floor must also divide by 10⁶; keeping its numeric value would change the model. A relative library smoothing rule based on a global largest variance should be reassessed when features have different scales or only some coordinates are converted.

</details>

### 6. A changed copied-alarm population

Fault prevalence is now .1, and a positive alarm has probabilities .9 in fault and .3 in normal. Find the true positive posterior, the posterior reported from three independent copies, and their actual equal-cost accuracies.

<details><summary>Hint</summary>

One likelihood ratio is 3. The true positive mass is .09 + .27. For the copied decision, add actual correct joint masses.

</details>
<details><summary>Explained solution</summary>

The true positive posterior is .09/.36=1/4. The mistaken three-copy odds are (1/9)×3³=3, giving posterior 3/4. The true equal-cost rule chooses normal for either alarm state, with accuracy .9. The copied rule chooses fault on positive and normal on negative, so its actual accuracy is .1×.9+.9×.7=.72. Those calculations use the actual joint law to evaluate the decision, not the fictional independent-copy law.

</details>

### 7. Read a complement score in the correct direction

Use the three-class complement example with query counts (0, 2, 1) and norm=False. Which class wins, and would adding a large class prior reproduce sklearn's ordinary multiclass ComplementNB behavior?

<details><summary>Hint</summary>

Negate two copies of the second column's log complement probability and one of the third.

</details>
<details><summary>Explained solution</summary>

The score expressions are −2log(10/23)−log(11/23) for class 0, −2log(5/23)−log(9/23) for class 1, and −2log(10/23)−log(3/23) for class 2. Class 1 wins. A high score means poor fit to that class's complement. Adding class priors would be a different scoring rule from the tested ordinary multiclass sklearn implementation. This single query is not evidence that either normalization variant will outperform another model.

</details>

### 8. Repair a streaming and drift claim

A loop runs range(len(rows)//4) and takes four rows per iteration from fourteen rows. Its author says partial_fit both uses all observations and automatically adapts to new language. Diagnose both claims and propose distinct repairs.

<details><summary>Hint</summary>

Check the final index, then ask whether any accumulated count was removed or downweighted.

</details>
<details><summary>Explained solution</summary>

The loop consumes three full batches, twelve rows. Iterate start indices from 0 to len(rows) in steps of 4, letting the final slice contain two rows; verify final class and feature counts. Cumulative partial_fit keeps all old evidence, so it has no automatic forgetting policy. If language changes, validate a recent-data retraining window or explicit weighting/forgetting strategy. Keep the feature schema consistent and monitor OOV and class-conditional changes. Fixing the loop repairs data loss; it does not solve distribution drift.

</details>

### 9. Distinguish calibration from an action threshold

A probability mapping changes a message from .6 to .45 while preserving the ordering of all scores. Can its predicted class change? If false-positive cost is 9 and false-negative cost is 1, which threshold follows from the stated loss model?

<details><summary>Hint</summary>

Monotonicity preserves order, not where a fixed threshold is crossed. Compare the two conditional expected costs.

</details>
<details><summary>Explained solution</summary>

At threshold .5, the class changes from positive to negative even though the ranking is preserved. The declared cost threshold is 9/(9+1)=.9, so neither .6 nor .45 triggers a positive action under that rule. Calibration quality, ranking, class accuracy and performance under this cost are different questions. Evaluate the complete chosen probability/action pipeline on independent data; no one metric establishes all four.

</details>

### 10. Predict a whole future count, not one token at a time

A Dirichlet posterior has shapes(2, 2). Compare the plug-in and integrated probabilities of two A tokens. Why does integrating not mean that two fixed-parameter token draws stopped being conditionally independent?

<details><summary>Hint</summary>

The posterior mean is 1/2; the integrated rising-product probability is(2×3)/(4×5).

</details>
<details><summary>Explained solution</summary>

The plug-in probability is 1/4; the integrated probability is 3/10. At any fixed θ, the token draws remain independent. Their joint prediction averages over the same uncertain θ, creating dependence after θ is integrated out. A single-token prediction agrees with the mean table, but a whole-document likelihood need not. The result also distinguishes a model posterior from a claim about repeated real language use.

</details>

### 11. Diagnose a rare-class remedy

A training sample has 4 fault cases and 196 normal cases. Suppose the deployment fault prior is also .02 and the correct positive likelihood ratio for a new observation is 9. A team balances the training labels and uses .5 as its model prior. Compare the resulting posterior with the deployment posterior. Does balancing establish better fault likelihoods?

<details><summary>Hint</summary>

Use prior odds 1/49 for deployment and 1 for the balanced sample. Separate frequency correction from the amount of independent fault information.

</details>
<details><summary>Explained solution</summary>

Deployment posterior odds are 9/49, so the probability is 9/58≈0.155172. The balanced prior gives odds 9 and probability .9. If the class-conditional likelihoods truly stay fixed, restoring the deployment prior corrects this difference. Duplicating four fault examples does not create new independent observations of fault behavior. Smoothing, more representative labels, a different likelihood or Complement NB are separate candidates to validate; none follows automatically from balancing. Report class-specific recall and precision alongside a suitable baseline. If missing a fault costs 20 and a false alarm costs 1, the separately derived action threshold is 1/21, so even .155172 justifies a positive action under those probabilities and costs. A rare class, a probability and an action cannot be diagnosed from accuracy alone.

</details>

### 12. Complete a changed probability report

In the calibrated-report program, change the random seed to 2027, the class 1 reading shift from 1.5 to 1.0 and the calibration sample size from 800 to 400. Keep 800 base-fit rows, 1200 test rows and costs 4:1. Run it and report the data unit, split ownership, baseline, raw/calibrated losses, changed decisions, reliability evidence and action limitation.

<details><summary>Hint</summary>

Change only the seed, the coefficient in draw_cases and the calibration draw count. Keep the final test outside all fitting. Report the actual output even if an expected improvement fails.

</details>
<details><summary>Explained solution</summary>

An acceptable report begins: “One row is one synthetic machine case; its two columns are exact copies of one reading. I fit the Gaussian base on 800 cases, the sigmoid on 400 separate cases and evaluated 1200 untouched cases under the same declared law. I compared both probability models with the prior-only baseline, retained bin counts and did not use test results to retune the mapping.” The fixed changed run gives baseline accuracy 0.7225, Brier 0.201183 and log loss 0.592234; raw GNB gives 0.7258, 0.181789 and 0.552812; sigmoid calibration gives 0.7492, 0.167991 and 0.510724. It changes 134 decisions at 0.5. These are measured finite-sample results under the stated seed, not promised improvements.

The four nonempty bins have sizes 506, 364, 231 and 99, mean predictions 0.1538, 0.2859, 0.5042 and 0.6420, and observed positive fractions 0.1166, 0.2830, 0.4502 and 0.6768. The highest bin [0.8, 1] is empty. The declared threshold 0.8 again takes no positive actions, giving realized cost 0.277500 per test case. Report that operating limitation alongside the improved global losses. A different seed, distribution or sample size needs its own report; changing the mapping after reading this test requires another untouched evaluation.

</details>

### 13. Relabel categories without inventing distance

Two equally frequent classes each have four records. Class 0 status counts
are `[3,1]` and link counts `[1,3]`; class 1 reverses both. Use α=1 and query
status 0/link 1. Calculate class-0 posterior, then swap both status codes and
their corresponding table columns. Score the renamed query. Explain what
must happen to an unsupported code.

<details><summary>Hint</summary>

Each feature has two possible categories, so its denominator is `4+2α`.
The simultaneous relabeling changes lookup names, not likelihood values.

</details>
<details><summary>Explained solution</summary>

Class-0 likelihood is `(4/6)(4/6)=4/9`; class-1 likelihood is
`(2/6)(2/6)=1/9`. Equal priors cancel, giving `4/(4+1)=4/5` for class 0.
After swapping status 0 and 1 everywhere, the query's new status code is 1
and its selected probability is still 4/6 or 2/6. The posterior remains 4/5.
A model that changed the answer used an inconsistent map/table or treated
codes as numeric distance. An unsupported label must be rejected or mapped
to a reserved other category declared in the fitted schema; smoothing alone
cannot expand that support. Store the category labels with the table, and
verify the restored schema before inference.

</details>

### 14. Save, merge and reload sparse evidence

Use count rows `[[2,0,1],[0,1,0],[1,0,0],[0,2,1],[1,1,0],[0,0,2]]`,
labels `[0,1,0,1,0,1]`, α=.5 and query `[1,0,1]`. Process chunks 2/3/1,
calculate raw counters and smoothed tables, then export/reload. Explain the
bug in a loop that adds α into the raw count state on every chunk.

<details><summary>Hint</summary>

Keep raw class-feature counts separate from the derived smoothed table. The
complete new discrete file pair uses this fixture; inspect its actual state.

</details>
<details><summary>Explained solution</summary>

Both classes have three rows and six total tokens. Their raw feature counts
are `[4,1,1]` and `[0,3,3]`. Add .5 once to each feature when deriving
probabilities, giving `[4.5,1.5,1.5]/7.5=[3/5,1/5,1/5]` and
`[.5,3.5,3.5]/7.5=[1/15,7/15,7/15]`. The query weights are
`.5(3/5)(1/5)=3/50` and `.5(1/15)(7/15)=7/450`. Their ratio is `27:7`,
so posterior is `[27/34,7/34]`. The recorded companion checks chunk/batch
counter equality, library logs and reloaded probabilities.

Adding .5 to each raw feature after each of three chunks would add 1.5
instead of .5 and falsely record pseudo-evidence as observed token mass.
Its effective composition becomes `[5.5,2.5,2.5]/10.5` and
`[1.5,4.5,4.5]/10.5`; query posterior becomes `55/82≈.670732` rather
than `27/34≈.794118`. If a later refresh also adds .5, the total artificial
addition becomes 2 per column. Tables become `[6,3,3]/12` and `[2,5,5]/12`,
and the query posterior becomes `18/(18+10)=9/14≈.642857`. Both bugs change
the model, rather than merely its processing order. Export the actual raw counters, schema, class order
and α separately, and recompute parameters after reload.

</details>

### 15. A mixed missing record and a duplicated prior

Given priors `1/4,3/4`, categorical likelihoods `.8,.4`, binary presence
rates `.6,.2` and equal Gaussian likelihood for the chosen reading, calculate
class-0 posterior when the binary feature is unobserved under an ignorable
observation process. Then calculate it when the binary feature is observed
positive. What would adding a second class prior do?

<details><summary>Hint</summary>

Strip prior-free likelihoods from each component. An unobserved factor sums
to one; an observed positive uses its presence rate.

</details>
<details><summary>Explained solution</summary>

Missing binary and equal Gaussian factors cancel, leaving weights
`(1/4).8=.2` and `(3/4).4=.3`: class-0 posterior is `.2/.5=2/5`.
Observed positive gives weights `.2×.6=.12` and `.3×.2=.06`, hence `2/3`.
A second prior multiplies odds by `(1/4)/(3/4)=1/3`. It would wrongly
give `2/11` for the missing case and `2/5` for the observed-positive case.
The priors describe one class draw, not one draw per feature family. This is
an explicitly supplied likelihood fixture; it is distinct from D41's
eight-row equal-prior fit. If the missingness process carries class evidence,
the omitted-factor assumption itself needs replacement.

</details>

### 16. Report an honest legal-data comparison

Use the delivered Spambase files and locked results. Write a reproducible
report naming feature units, split group, fitted preprocessing, all validation
outcomes including failures, prefrozen winner, test metrics and collection
limitations. Inspect one edited raw vector with saved state, and say whether
its model probability is an observed outcome. Do not run a new search to make
the report's numbers more appealing.

<details><summary>Hint</summary>

Use the candidate and test tables in section 8 and inspect the complete result
JSON. Selection is by validation log loss, not a test metric or a family name.

</details>
<details><summary>Explained solution</summary>

An acceptable report is: “One row is a historical email's 57 supplied
statistics. The first 54 are percentages; capital-run features have different
units. I grouped exact feature tuples before the seed71/73 split and retained
all 4,601 rows, including three conflicting-label groups. Training has 2,811,
validation 890 and test 900 rows. Scaling is fitted on training only; models
remain trained on those 2,811 rows. I preserved all 12 validation outcomes,
including logistic C=10's nonfinite probability-log failure. Candidate 11,
raw-feature L2 logistic C=1, is the locked overall winner before test. Gaussian
log1p/1e-7 and Bernoulli presence/.1 are the other locked family winners.”

“On test, prior/Gaussian/Bernoulli/logistic accuracy is
`.621111/.837778/.891111/.927778`, log loss is
`.664601/10.677199/.494299/.220665`, and Brier is
`.235850/.159200/.094210/.059091`. Logistic confusion is
`[[529,30],[35,306]]`, with ham/spam supports 559/341. Gaussian's good spam
recall and extreme mistakes make its log loss worse than the prior. At the
fixed 4:1/.8 action rule, costs are `.378889/.566667/.218889/.176667`.
The original selected-logistic test-report API underflow is retained, with
the final logs computed stably from the same saved coefficients; no refit,
candidate retry or selection change occurred.”

“For raw make percentage 1, other percentage features 0 and capital fields
`[2,4,8]`, saved-state spam probabilities are approximately
`.999999998907/.0000766132/.205693203142` for the three model families.
This edited feature vector is unlabeled, changes no test metric and is not
asserted to reconstruct an email. Grouping guards exact vectors, not every
campaign or near duplicate. Personalized ham features and unavailable timing
limit deployment interpretation.”

A complete answer includes the actual twelve-row outcome table and source/
data/split/state identity. Changing representations, seeds, convergence caps or
eligibility policy would define a new study with a new untouched evaluation.
An apparent best test score never retroactively chooses the locked winner.

</details>

### Further learning

- [Manning, Raghavan & Schütze — Introduction to Information Retrieval,
  chapter 13](https://nlp.stanford.edu/IR-book/pdf/13bayes.pdf): freely readable
  book chapter with another token-count worked example, Bernoulli comparison,
  feature selection and computational costs. Use after sections 3–4; basic
  conditional probability is enough for its first route.
- [Stanford CS229 — Generative Learning Algorithms](https://cs229.stanford.edu/summer2023/cs229-notes2.pdf):
  official course notes connecting Gaussian discriminant learning and Naive
  Bayes. Useful after section 5; probability and linear algebra help with full
  covariance; compare its contour picture with section 5's diagonal restriction.
- [Stanford Online / Andrew Ng — CS229 Lecture 5: GDA & Naive Bayes](https://www.youtube.com/watch?v=nt63k3bfXS0):
  oral derivation alternative once the local Bayes calculation is familiar.
  Pair the recording with the official course notes above. Its older software context is not the
  executed API reference.
- [scikit-learn — Naive Bayes user guide](https://scikit-learn.org/stable/modules/naive_bayes.html):
  concise family/API orientation after sections 4–8. Read its compact formulas
  with the event distinctions and explicit state settings taught here.
- [Hastie, Tibshirani & Friedman — The Elements of Statistical Learning](https://hastie.su.domains/ElemStatLearn/):
  author-hosted book, §§6.6.2–6.6.3, for the additive likelihood-ratio connection
  after section 10. Full KDE/GAM fitting
  needs later statistical background.

### Technical references

- [McCallum & Nigam — A Comparison of Event Models for Naive Bayes Text
  Classification](https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-007.pdf):
  original 1998 token/presence distinction, estimation and feature-selection
  experiments. Its experiments are historical findings, not our measured results.
- [Rennie, Shih, Teevan & Karger — Tackling the Poor Assumptions of Naive Bayes
  Text Classifiers](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf):
  complement pooling, weight normalization and transformed text scores used
  to verify section 7's distinction from a literal generative posterior.
- [Sahami and colleagues — A Bayesian Approach to Filtering Junk
  E-Mail](https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-009.pdf):
  historical application connecting feature design, dependence assumptions and
  asymmetric legitimate-mail errors; its chosen threshold is not a recommendation
  for a new system.
- [MultinomialNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.MultinomialNB.html),
  [BernoulliNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.BernoulliNB.html),
  [CategoricalNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.CategoricalNB.html),
  [ComplementNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.ComplementNB.html)
  and [GaussianNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.GaussianNB.html):
  exact setting/state/support/smoothing contracts for the executed 1.9.1 snapshot.
  Check the relevant attribute and explicit parameter when using another version.
- [scikit-learn — Probability calibration](https://scikit-learn.org/stable/modules/calibration.html):
  score interface, independent fitting roles, reliability and proper losses;
  verify current defaults when reproducing with another version.
- [SciPy — Dirichlet-multinomial](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.dirichlet_multinomial.html):
  positive shape/count-event API used by the same-input integrated prediction
  bridge. The executable comparison supplements the mathematical derivation.
- [UCI — Spambase](https://archive.ics.uci.edu/dataset/94/spambase),
  [dataset DOI](https://doi.org/10.24432/C53G6X): original schema, creators,
  official archive and CC BY 4.0 provenance for the offline historical experiment.

### Ready to continue?

You should be able to identify the observation event; estimate its class table;
trace and normalize one score; distinguish absent, missing and unsupported
features; preserve schema/state; diagnose a dependence or probability failure;
and justify an action under declared costs with a separate evaluation protocol.
Implement a changed-input case and explain which scratch variables correspond
to the ordinary library's parameters. Use the solved tasks to check that
ability instead of treating a completion button as mastery evidence.

Continue to [Ensemble Methods & Stacking](/learn/path/full-curriculum/ensemble-methods-stacking):
combining models introduces a new learning boundary as well as a scoring rule.

### Downloadable file index

The eleven earlier standalone programs remain complete with their original
recorded results: `normalized-scores.py`, `count-classifier.py`,
`event-models.py`, `gaussian-fit.py`, `gaussian-boundaries.py`, `dependence.py`,
`complement.py`, `text-pipeline.py`, `streaming.py`, `calibrated-report.py`
and `count-law.py`. They are examples, rather than importable dependencies.

| New route | Files to save together | Launch and purpose |
| --- | --- | --- |
| Discrete scratch/library | `nb_discrete_core.py`, `nb_discrete_library.py` | `python nb_discrete_library.py`: sparse weighted/state comparisons |
| Gaussian scratch/state | `nb_gaussian_online.py` | `python nb_gaussian_online.py`: centered M2 merges and epsilon diagnostics |
| Objective inspection | `nb-likelihood-gradients.py` | `python nb-likelihood-gradients.py`: manual derivatives and optimizer status |
| Integrated count prediction | `nb-integrated-predictive.py` | `python nb-integrated-predictive.py`: exact/gamma/library count masses |
| Mixed measurement families | `nb-mixed-record.py`, `nb_discrete_core.py`, `nb_gaussian_online.py` | `python nb-mixed-record.py`: one prior, per-feature masks and aligned likelihoods |
| Feature ranking | `nb-feature-selection.py` | `python nb-feature-selection.py`: presence statistics versus count chi2 |
| Offline real-data study | `nb-spambase-study.py`, `nb_discrete_core.py`, `nb_gaussian_online.py`, `spambase.data`, `spambase.names`, `spambase.DOCUMENTATION`, `spambase-provenance.md`, `SPAMBASE-LICENSE.txt` | `python nb-spambase-study.py`: guarded declared study; inspect supplied locked results instead of overwriting |

`spambase-validation-lock.json`, `spambase-frozen-state.json` and
`spambase-study-results.json` contain this study's preserved selection,
train-only models and complete observed outcomes. They are optional inspection
outputs, not missing inputs required for a new clean-directory run. Individual
downloads retain the actual filenames and complete content; the common index
and contextual Copy/Download controls use the same source bytes.
