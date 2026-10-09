# Recommender Systems (Collaborative Filtering, Matrix Factorization)

A recommendation starts with a request: choose a few useful items for someone,
using information available now. Several methods can produce a sortable number,
but they do not all predict the same outcome. We will follow evidence through
neighbors, shared factors and list decisions, then ask which later observations
can assess the resulting rule.

The continuous route follows all fourteen sections. Begin with the evidence
matrix, one neighborhood calculation, one factor update and the list metrics.
Return to the visible deeper passages for counted regularization, exact solves,
implicit history, constrained item weights and exposure assumptions. Complete
scratch and ordinary programs accompany their mechanisms; the experiments keep
the distinction between a computed score and a measured outcome explicit.

Before starting, review the dot product, transpose and matrix axes in [Vectors, Matrices & Tensor Operations](https://ronak.sh/learn/topic/vectors-matrices-tensor-operations), and residuals, gradients and train/validation/test roles in [Linear & Logistic Regression](https://ronak.sh/learn/topic/linear-logistic-regression). The worked calculations here refresh those operations as they are used. Gaussian priors and graph propagation are visible deeper branches; the local examples introduce their required objects.

## 1. Start with a request and the evidence you actually have

Imagine a catalogue of workshop recordings. A learner visits at time 20, and
three suggestions fit on the screen. The site knows some recordings they rated
or played. Most learner–recording pairs have no recorded rating. A globally
popular list is already a recommender; personalization must earn its extra
complexity by helping on a declared assessment, rather than by producing more
complicated-looking scores.

A **user** is the entity receiving a suggestion. An **item** is something that
can be suggested. A **request** is one decision at a particular time, and an
**interaction** is an event such as a rating, play or purchase. An **impression**
records that an item was actually shown. No play could mean no interest, no
opportunity to see the item, or an unavailable item. It does not by itself name
a low rating or a dislike.

<!-- diagram:D01 -->

Trace request U0 at time 20. Its known history enters the scoring route; the
candidate item I2 enters a separate item port. A later observed outcome sits on
the other side of the request boundary. It can assess the issued suggestion,
but cannot enter the earlier score. The request is more specific than “predict
the matrix”: it also determines which evidence and items were available.

Our first constructed catalogue has five users U0–U4 and seven items I0–I6.
These IDs are stable labels, not coordinates: I6 is not six units away from I0.
The recorded numbers are explicit ratings. A dash below means no rating exists.

<!-- diagram:D02 -->

| User / item | I0 | I1 | I2 | I3 | I4 | I5 | I6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U0 | 5 | 3 | — | 1 | — | 4 | — |
| U1 | 4 | — | 4 | 1 | 2 | — | 3 |
| U2 | — | 3 | — | — | 4 | 3 | — |
| U3 | 1 | — | — | 5 | 4 | — | 2 |
| U4 | — | 1 | 5 | 4 | — | — | 3 |

There are 20 observed ratings and 15 missing cells. The observed ratings sum to
62, so their mean is 62/20=3.1. U0 has four ratings, summing to 13; their mean is
3.25. U0 has no rating for I2, I4 or I6. A recommendation may target one of these
items, but the missing cells do not tell us what U0 would have rated them.

An **observation mask** stores whether a rating exists separately from the
rating's value. Let Ω denote the set of observed user–item pairs. A pair belongs
to Ω when its rating is finite and present; it does not belong merely because
someone filled a blank with a number. Our original catalogue uses ratings 1–5,
but the more general editor permits a legitimate observed zero. For the row
[0, missing, 4], the mask is [true, false, true] and the observed mean is 2. A
test such as `rating != 0` would discard the observed zero and change that mean
to 4.

<!-- diagram:D03 -->

For an observed pair, subtract the proposed score from its rating, square the
residual and add that term. With score 3 and observed rating 0, the residual is
−3 and the squared term is 9. A missing rating has no such residual; its mask
excludes the term. Avoid computing an undefined missing-value subtraction and
hoping that multiplying it by zero will repair it.

\[
\operatorname{SSE}_{\Omega}=\sum_{(u,i)\in\Omega}(r_{ui}-s_{ui})^2,
\qquad
\operatorname{RMSE}_{\Omega}=\sqrt{\operatorname{SSE}_{\Omega}/|\Omega|}.
\]

Here r is an observed rating and s is a model score. SSE is a sum of squared
errors; RMSE is their root mean square and has the rating's units. Proposing
score 3 for every observed cell gives SSE 36 in this catalogue. No missing-cell
contribution hides in that total. If no ratings are observed, the empty SSE sum
is zero, while RMSE and the observed mean are undefined: there is no denominator
or observed outcome to summarize.

The complete `evidence` program uses NumPy's finite mask, counts observations
along each axis, and divides sums only where an observed count exists. Its
recorded output gives the same 20/15 counts, mean 3.1 and SSE 36. Read the mask
construction before the mean. Numerical zero and lack of evidence have
different roles even when a compact sparse storage format ordinarily omits
zero-valued entries.

**Checkpoint.** A learner was never shown I6. Someone fills its missing rating
with zero before calculating RMSE. What question changed?

**Hint.** Compare the error terms before and after filling.

**Explained solution.** The calculation now evaluates against an invented zero
rating for that pair. The original explicit-rating question concerns observed
ratings. An implicit-feedback method can deliberately assign weak zero targets
to unobserved pairs, but must declare that different objective and its weights.
Filling a blank does not discover a true dislike.

The mask identifies recorded ratings. It does not establish that those ratings
are a representative sample of all preferences. People choose what to inspect
and rate, and the previous service chose what to show. The optional policy and
observation-risk section later distinguishes these sampling mechanisms. First
we will keep the more immediate request-time permissions explicit.

### Complete program: Audit the matrix before fitting

`np.isfinite` produces the independent observation mask. Axis counts retain user/item populations, while `R[seen]` forms the observed-only denominator. The zero-inclusive example shows why value zero cannot encode absence. NumPy supplies array operations; no model is fitted.

<!-- program:evidence filename:evidence.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)

print("users, items:", ratings.shape)
print("observed, missing:", int(observed.sum()), int((~observed).sum()))
print("observed mean:", round(ratings[observed].mean(), 3))
print("user means:", np.round(np.nanmean(ratings, axis=1), 3).tolist())
print("user 0 unseen:", np.flatnonzero(~observed[0]).tolist())
changed = np.array([0.0, np.nan, 4.0])
print("zero is observed:", np.isfinite(changed).tolist())
print("zero-inclusive mean:", changed[np.isfinite(changed)].mean())
# Missing values never enter an explicit squared-error objective.
predictions = np.full(ratings.shape, 3.0)
print(
    "constant-3 observed SSE:",
    float(((ratings[observed] - predictions[observed]) ** 2).sum()),
)
```

Recorded output for this exact original program and its original execution context:

```text
users, items: (5, 7)
observed, missing: 20 15
observed mean: 3.1
user means: [3.25, 2.8, 3.333, 3.0, 3.25]
user 0 unseen: [2, 4, 6]
zero is observed: [True, False, True]
zero-inclusive mean: 2.0
constant-3 observed SSE: 36.0
```

## 2. Put time, eligibility and baselines before the model

Before choosing an algorithm, state the task: for this miniature discovery
example, suggest an available item the user has not previously rated. Repeat
listening or grocery replenishment can require a different repeat-item policy.
Removing previously used items by habit would change those tasks.

Our final synthetic example supplies 31 events in an explicit order: ticks
1–20 fit parameters, ticks 21–25 compare choices, and ticks 26–31 assess the
chosen rule. These invented ticks express permissions; they are not timestamps
collected from a real service or an estimate of how a deployment behaves.

<!-- diagram:D04 -->

At request time 20, the first twenty events lie in the permitted prefix. A
recording released at tick 23 lies on the future side of the same axis. Knowing
its title does not make it eligible at tick 20. By time 23 its release gate can
open, but that does not retroactively put it in a previously issued list.

**Training** fits parameters. **Validation** compares choices such as rank,
neighbor support or regularization. **Test** assesses the frozen choice under a
declared new-data boundary. Choosing a setting because it looked best on test
converts those observations into more validation. The original test can no
longer assess that updated choice as untouched evidence.

Every learned quantity follows the boundary: means, popularity counts,
co-rating similarities, factor vectors, metadata transforms and calibration.
Calculating popularity from the full event stream before splitting already
uses future behavior. Splitting each user's events independently can also
introduce other users' future interactions into an earlier model unless the
allowed information policy explicitly permits them.

A baseline is a simple complete rule against which the proposed method can be
compared. It also supplies a defined fallback when a personalized method lacks
evidence. These baseline outputs answer different questions:

| Rule | Training-only calculation | Meaning and limit |
| --- | --- | --- |
| Global rating mean | Sum observed ratings / observed count | A rating fallback without personalization; unavailable without observations or a declared prior |
| Shrunk item mean | (Item rating sum + s × prior mean) / (item count + s) | A rating score balancing an item's observations and a chosen pseudo-count |
| Occurrence popularity | Count permitted interactions for each item; order by count and then item ID | A list baseline whose counts mix exposure, opportunity and preference |

<!-- diagram:D05 -->

Work a separate two-rating shrinkage illustration: ratings 5 and 1 have sum 6
and count 2; the prior mean is 3.1 and its pseudo-count s is 3. The prior
contribution is 3×3.1=9.3. Add 6+9.3=15.3 and divide by 2+3=5, giving 3.06.
Those three prior tokens are a modeling weight, not three observed ratings.
The two-rating illustration resets this operand list; it does not claim that
one column of the earlier matrix contains exactly those two observations.

For n>0 and s≥0, the same expression is the weighted mean of the observed item
mean and the prior, with weights n/(n+s) and s/(n+s). It reduces an unsupported
one-rating extreme toward the prior. In the original matrix I2 instead has
ratings 4 and 5, so its sum is 9 and the same prior/shrinkage gives
(9+9.3)/5=3.66. Changing the selected item must change those actual operands.
With n=0 and s>0, the answer is the declared prior 3.1; with n=s=0 the quotient
is undefined. A separately named global-mean fallback may still apply if
training observations exist. A fully empty dataset needs an explicit external
prior rather than an invented observed mean. If s is tuned, that choice also
needs the permitted validation boundary.

<!-- diagram:D06 -->

A fitted artifact is the saved rule available for serving: its parameters,
history boundary and any selected settings travel together. Suppose validation
ticks 21–25 choose a regularization setting and its corresponding artifact is
ready at tick 30. That may be a valid choice for a later request, but neither
the choice nor the artifact was available at tick 20. The permission gate must
inspect both data/configuration availability and artifact time, rather than
showing the later score as if it had been issued earlier.

A **warm** user or item has training history; a **cold** one does not. A random
interaction split often assesses another event for familiar entities. Holding
out whole users or items asks a different question and may require a content
or popularity fallback. Report what happens to unknown identities instead of
discarding them and describing the remaining users as everyone.

Explain the proposed baseline's units and permissions before adding a model.
A count is not a rating; an eligible item is not necessarily preferred; a
future fitted rule cannot answer a past request. Neighborhood methods next
reuse permitted patterns across users and items.

### Complete files and a local environment

The common file index below groups complete source by its main teaching home.
Keep the named dependency files in the same directory. A code block shows the
whole file, with imports, data/configuration and its entry point; it is not a
fragment to splice into an unrelated interpreter state. The local arrays and
NumPy/SciPy solves open the model algorithm; the array libraries supply the
numerical linear algebra kernels.

Python 3.12.14 with NumPy 2.3.5, SciPy 1.18.1, pandas 3.0.1, scikit-surprise
1.1.5 and implicit 0.7.3 is the declared new-program environment. openpyxl reads
the official workbook during the offline data derivation. Historical outputs
remain attached to their original execution context; sharing a filename does
not imply a new execution with these versions. On a Windows machine with
Python 3.12 available, a separate environment can be created as follows:

```powershell
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install numpy==2.3.5 scipy==1.18.1 pandas==3.0.1 scikit-surprise==1.1.5 implicit==0.7.3 openpyxl
```

The fourteen original `.py` downloads retain their physical Windows CRLF line endings; displayed and copied code uses the corresponding LF characters. The ten additional files use UTF-8 with LF. The common index supplies complete output files as well as source: short recorded selections on the page do not replace the full JSON state and trace. The Retail bundle includes attributed calendar-role data, the full report, ordered local IDs, typed arrays and both decision locks. It excludes the private original customer-ID map.

Standard-library-only Fraction calculations need none of the scientific
packages. Native packages may require a compatible wheel or compiler for the
platform. The data and study files accept explicit paths rather than searching
the network or the working directory for an unspecified dataset.

| Complete source | Main home | Computational role |
| --- | --- | --- |
| `evidence.py` | §1 | retained complete program |
| `neighbors.py` | §3 | retained complete program |
| `recommender-neighborhood-contracts.py` | §3 | new complete program |
| `gradient.py` | §5 | retained complete program |
| `explicitFit.py` | §5 | retained complete program |
| `recommender-factor-structure.py` | §6 | new complete program |
| `observedAls.py` | §6 | retained complete program |
| `implicitBlock.py` | §7 | retained complete program |
| `implicitFit.py` | §7 | retained complete program |
| `recommender-history-core.py` | §7 | new complete program |
| `recommender-ease-contracts.py` | §7 | new complete program |
| `bpr.py` | §8 | retained complete program |
| `recommender-bpr-training.py` | §8 | new complete program |
| `ranking.py` | §9 | retained complete program |
| `surpriseLibrary.py` | §10 | retained complete program |
| `recommender-history-library.py` | §10 | new complete program |
| `implicitLibrary.py` | §10 | retained complete program |
| `coldItem.py` | §11 | retained complete program |
| `recommender-forward-boundaries.py` | §11 | new complete program |
| `policy.py` | §12 | retained complete program |
| `recommender-propensity-risk.py` | §12 | new complete program |
| `evaluation.py` | §13 | retained complete program |
| `recommender-retail-data.py` | §13 | new complete program |
| `recommender-retail-study.py` | §13 | new complete program |

`recommender-history-library.py` loads `recommender-history-core.py` from its
own directory. `recommender-retail-study.py` loads `recommender-retail-data.py`
there too; its readiness manifest binds all ten new filenames and data inputs.
Use the supplied derived-data route to run the complete study locally.
Create a directory named `retail-data` beside the ten `recommender-*.py`
source files and download these four files from the common file index into it:

| Required file in `retail-data` | Role |
| --- | --- |
| `retail-manifest.json` | Attribution, ordered user/item IDs, calendar roles and exact CSV hashes |
| `retail-train.csv` | December training occurrences, including outside-catalogue items |
| `retail-validation.csv` | January selection occurrences |
| `retail-test.csv` | February assessment occurrences |

Keep this manifest and these three complete CSVs together; do not rename,
truncate or convert their line endings. Their bytes and ID/calendar schema
are checked when each role is opened. This route needs no source archive,
extracted workbook or private original-ID map. **Skip the data-derivation
command**: the supplied files already contain its complete result.
The saved `study-results.json`, locks and array files are outputs for inspecting
the recorded campaign, not replacements for the four inputs above.

From the directory containing the ten source files, a learner who intentionally
starts a new local campaign can prepare a new readiness file and choose a fresh
output directory:

```powershell
python recommender-retail-study.py --data retail-data --prepare-readiness retail-ready-local.json
python recommender-retail-study.py --data retail-data --readiness retail-ready-local.json --output retail-study-local
```

Neither `retail-ready-local.json` nor `retail-study-local` may already exist.
Readiness preparation performs no fit and binds the current local sources and
installed packages. The second command intentionally performs the declared six
fits; reading the saved report requires neither command. The recorded campaign
remains its own fixed outcome. The study writes its campaign-start guard before fitting. Its later
two immutable locks separate validation selection and prefix predictions from
test truth. The complete recipe, confidence/scorer convention and input/output
meaning are explained in §13 before the study source.


## 3. Borrow evidence from people or items with shared history

**Collaborative filtering** uses interaction patterns across users and items.
It does not require item descriptions. User-based filtering asks which people
have behaved similarly on shared items and what they rated the target item.
Item-based filtering asks which items have similar co-rater patterns and what
the target user rated those items. Neither is a synonym for content similarity.

<!-- diagram:D07 -->

For two items i and j, first intersect their observed user IDs. Call this set
Sᵢⱼ. Each retained user supplies an aligned pair of observations; a private
observation of only one item does not enter the other's missing position. The
dot product adds matching-coordinate products. Each vector length is the square
root of the corresponding squared values, using that same intersection.

\[
C_{ij}=\sum_{v\in S_{ij}}a_{vi}a_{vj},\quad
N_i=\sqrt{\sum_{v\in S_{ij}}a_{vi}^2},\quad
N_j=\sqrt{\sum_{v\in S_{ij}}a_{vj}^2},\quad
\operatorname{cos}(i,j)=C_{ij}/(N_iN_j).
\]

Raw cosine uses aᵥᵢ=rᵥᵢ. Dividing by lengths removes an overall positive scale:
it compares directions on common evidence. These pair-specific lengths can
change when the paired item changes. Empty overlap or zero length makes the
normalized similarity unavailable, so it cannot become an accepted neighbor.
A program may encode an unusable weight as zero, but that encoding does not
prove an orthogonal preference pattern.

<!-- diagram:D08 -->

Take a separately stated two-co-rater example. Item columns (5,3) and (3,1)
give products 15 and 3, sum 18, squared-length sums 34 and 10, and raw cosine
18/√340≈.976. The two users' full-training rating means are stated as 4 and 2.
Subtract each user's own mean: the first item's residual column is (1,1), the
second is (−1,−1). Their dot is −2 and each length is √2, so adjusted cosine is
−1. Both users put the first item above their usual rating and the second below.

**Adjusted cosine** centers each co-rater using their full observed training
row, then computes the pair products and lengths on Sᵢⱼ. **Pair-centered
Pearson** instead centers each compared column using its mean over this pair's
overlap. These are different populations and estimators, even if a special
example makes their answers coincide. Equal centered values can have length
zero; a centering operation does not guarantee a usable direction.

<!-- diagram:D09 -->

With one co-rater and two positive raw ratings, cosine is exactly 1:
ab/(|a||b|)=1. That algebra does not establish item interchangeability. Require
at least a declared number of co-raters, then multiply the surviving similarity
by n/(n+s), where n is overlap and s≥0 a shrinkage setting. For n=1 and s=2,
that factor is 1/3. Support and angle answer different questions; neither this
multiplier nor a minimum count supplies a statistical confidence interval.

After support and sign filtering, choose the k largest absolute weights,
breaking exact ties by item ID. A positive-only rule discards negative
similarities. A signed rule can keep them and must retain their signs through
the numerator. Changing support, s, k or sign policy changes the named rule,
rather than merely the way the same answer is displayed.

<!-- diagram:D10 -->

For a centered item-based prediction, start at the target user's mean b=3.
Suppose they rated two accepted neighbors 1 and 5, with weights −.5 and .25.
Subtract the baseline: residuals −2 and +2. Multiply: (−.5)(−2)=1 and
.25×2=.5. Add 1.5, divide by |−.5|+|.25|=.75 to get correction 2, then add the
baseline: the predicted rating is 5. The negative weight reverses a negative
residual's contribution; it does not cancel the denominator.

\[
\hat r_{ui}=\bar r_u+
\frac{\sum_{j\in N_{ui}} w_{ij}(r_{uj}-\bar r_u)}
{\sum_{j\in N_{ui}}|w_{ij}|}.
\]

Nᵤᵢ contains only accepted neighbors the target user actually rated. Without an
accepted nonzero weight, fall back to their training mean, then the training
global mean, then a declared prior if all training data are empty. Do not divide
by an empty denominator or call that fallback a personalized estimate. The raw
variant averages ratings without the residual baseline. Positive normalized
weights keep that raw average within its contributing rating range; signed
residual combinations can leave the declared rating scale. Clipping is an
additional prediction rule and must be stated separately.

In our original 5×7 matrix, U0/I2 has raw neighbors I0, I1 and I3 under minimum
support 1, no shrinkage and positive weights. The first two weights are 1 from
one co-rater each; I3's two-co-rater raw weight is approximately .909065. Their
ratings 5,3,1 produce about 3.062518. The adjusted-cosine default instead needs
two co-raters, shrinkage 2 and positive weights; it accepts no neighbor for this
target, so returns U0's mean 3.25. A more conservative rule need not produce a
more elaborate-looking answer.

The complete retained `neighbors` program constructs shared masks, computes
full-row means for adjusted centering, gates support/sign, sorts by absolute
weight and ID, then adds the weighted residual or returns its named fallback.
Its three printed configurations expose both successful aggregation and empty
accepted sets. The algorithm's inputs are the permitted training matrix and
settings, not the unknown target rating.

<!-- diagram:D11 -->

User-based filtering has a distinct route. Intersect the target user's observed
items with each potential neighbor's observed items, calculate their declared
similarity, then inspect the neighbor's rating of the target item. Its prediction
subtracts the neighbor's full-training mean and adds the target user's mean.
Transposing a display alone does not make this output equal to the item-based
one: the centering means, evidence intersection and target-rating source differ.

Work the separate matrix [[5,1,missing],[4,2,3],[1,5,5]] at U0/I2. Full row means
are 3,3,11/3. The U0/U1 shared residual vectors are (2,−2) and (1,−1), giving
similarity 1. The U0/U2 vectors are (2,−2) and (−8/3,4/3), giving −3/√10.
U1's target residual is 3−3=0; U2's is 5−11/3=4/3. Keeping both signed
neighbors gives 3−4/(√10+3)≈2.350889. The positive-only route retains U1 and
returns 3. Missing U0/I2 never enters either similarity or residual.

<!-- diagram:D12 -->

The ordinary Surprise 1.1.5 Pearson similarity centers over each pair's overlap.
Its KNNWithMeans prediction uses each full training row's mean and keeps positive
neighbors. In item mode those rows/means represent items. Insufficient actual
neighbor count returns the target row's mean. These semantics cannot be inferred
from the label “centered CF”; they differ from our signed user-mean-adjusted
item route. The new complete neighborhood program shows both populations and
each actual ordinary output under its own rule rather than asserting false
numerical parity. [Surprise's similarity definitions](https://surprise.readthedocs.io/en/stable/similarities.html)
and [KNN contracts](https://surprise.readthedocs.io/en/stable/knn_inspired.html)
make those roles explicit.

Grouping users is another way to change the evidence. A cluster aggregate must
retain its member IDs and each item's observed sum/count. For members U0/U1
in the separate matrix, item sums are [9,3,3] and observed counts [2,2,1], giving
cluster means [4.5,1.5,3]. The missing U0/I2 is not counted as zero. An item with
no observed cluster member remains missing. Similarity between these aggregate
rows asks a group-level question and can discard individual variation; it is
not the same estimator made faster by a different name. Full clustering engines
belong to their own model lessons.

Computing one item pair directly scans its user evidence. Computing all item
pairs can cost O(U I²) before selected-neighbor storage and must be refreshed
when its permitted history changes. Precomputed neighborhoods trade storage
and refresh work for serving work; no universal speed advantage follows from
the formula. The next method shares learned coordinates across many sparse
user–item cells instead of caching a complete pair-similarity table.

### Complete program: Trace shared evidence into a neighbor score

The pair mask intersects two item columns before products and norms are formed. Full user means supply adjusted-cosine residuals; support/shrinkage are applied before the stable neighbor selection. The selected signals and absolute-weight denominator expose the signed rule. No accepted neighbor invokes the declared target-user baseline; zero is not fabricated as a rating.

<!-- program:neighbors filename:neighbors.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)


def predict(
    user, item, centered=True, minimum_overlap=2, shrinkage=2.0, k=3, signed=False
):
    if observed[user, item]:
        raise ValueError("This example predicts an unobserved pair.")
    prior = 3.0  # Declared rating prior when the entire training matrix is empty.
    global_mean = float(ratings[observed].mean()) if observed.any() else prior
    counts = observed.sum(axis=1)
    user_means = np.divide(
        np.where(observed, ratings, 0.0).sum(axis=1),
        counts,
        out=np.full(len(ratings), global_mean),
        where=counts > 0,
    )
    fallback = float(user_means[user])
    evidence = []
    for other in np.flatnonzero(observed[user]):
        shared = observed[:, item] & observed[:, other]
        count = int(shared.sum())
        center = user_means[shared] if centered else 0.0
        left, right = ratings[shared, item] - center, ratings[shared, other] - center
        norm_product = np.linalg.norm(left) * np.linalg.norm(right)
        cosine = float(left @ right / norm_product) if norm_product else 0.0
        weight = (
            cosine * count / (count + shrinkage)
            if count >= minimum_overlap and norm_product
            else 0.0
        )
        signal = ratings[user, other] - (fallback if centered else 0.0)
        if weight > 0 or (signed and weight != 0):
            evidence.append((int(other), count, weight, float(signal)))
    evidence.sort(key=lambda row: (-abs(row[2]), row[0]))
    selected = evidence[:k]
    denominator = sum(abs(row[2]) for row in selected)
    value = (
        (fallback if centered else 0.0)
        + sum(row[2] * row[3] for row in selected) / denominator
        if denominator
        else fallback
    )
    return value, selected


for centered, support, shrinkage in [(False, 1, 0.0), (True, 2, 2.0), (True, 4, 2.0)]:
    value, selected = predict(0, 2, centered, support, shrinkage)
    print(f"centered={centered}, minimum={support}, score={value:.6f}")
    print(
        "  selected (item, overlap, weight, signal):",
        [
            tuple(round(x, 6) if isinstance(x, float) else x for x in row)
            for row in selected
        ],
    )
```

Recorded output for this exact original program and its original execution context:

```text
centered=False, minimum=1, score=3.062518
  selected (item, overlap, weight, signal): [(0, 1, 1.0, 5.0), (1, 1, 1.0, 3.0), (3, 2, 0.909065, 1.0)]
centered=True, minimum=2, score=3.250000
  selected (item, overlap, weight, signal): []
centered=True, minimum=4, score=3.250000
  selected (item, overlap, weight, signal): []
```

### Complete program: Compare declared neighborhood populations

`ratings_matrix` retains a finite-zero/null distinction. `means` forms full-training means; `similarity` first isolates common entities, then applies the named raw, full-mean or pair-mean convention. `predict` keeps signed and positive-only policies separate for user/item orientations. `cluster_aggregate` exposes sums/counts/null columns. Four ordinary KNN fits use the same triplets and print their actual ID/similarity/mean populations; pair-overlap Pearson and full-row prediction means are not silently equated.

<!-- program:recommender-neighborhood-contracts filename:recommender-neighborhood-contracts.py -->

```python
"""Complete signed neighborhood contracts and ordinary Surprise comparisons.

Run: python recommender-neighborhood-contracts.py
Requires NumPy, pandas and scikit-surprise 1.1.5. NaN denotes missing, never 0.
The guarded main fits only the four declared new small KNN constructions.
"""
import json
import math

import numpy as np


def ratings_matrix(value):
    ratings = np.asarray(value, dtype=np.float64)
    if ratings.ndim != 2 or min(ratings.shape) < 1 or np.isinf(ratings).any():
        raise ValueError('finite-or-NaN rectangular ratings are required')
    return ratings


def means(value):
    ratings = ratings_matrix(value)
    mask = np.isfinite(ratings)
    counts = mask.sum(axis=1)
    sums = np.where(mask, ratings, 0.).sum(axis=1)
    result = np.full(ratings.shape[0], np.nan)
    np.divide(sums, counts, out=result, where=counts > 0)
    return result, counts


def similarity(value, first, second, orientation='user', centering='full-row',
               minimum=2, shrinkage=0.):
    ratings = ratings_matrix(value)
    if orientation not in ('user', 'item') or centering not in ('raw', 'full-row', 'pair'):
        raise ValueError('declare user/item orientation and raw/full-row/pair centering')
    if not isinstance(minimum, int) or minimum < 1 or not math.isfinite(shrinkage) or shrinkage < 0:
        raise ValueError('positive integer support and nonnegative finite shrinkage required')
    vectors = ratings if orientation == 'user' else ratings.T
    if not 0 <= first < len(vectors) or not 0 <= second < len(vectors):
        raise ValueError('selected entity ID is outside its actual table')
    overlap = np.isfinite(vectors[first]) & np.isfinite(vectors[second])
    positions = np.flatnonzero(overlap)
    left, right = vectors[first, overlap].copy(), vectors[second, overlap].copy()
    center_left, center_right = np.zeros(len(left)), np.zeros(len(right))
    if centering == 'pair' and len(left):
        center_left[:] = left.mean()
        center_right[:] = right.mean()
    elif centering == 'full-row':
        # User CF centers each selected user's full row. Adjusted item cosine
        # instead centers both item entries by the shared counterpart user's row.
        row_means, _ = means(ratings)
        if orientation == 'user':
            center_left[:] = row_means[first]
            center_right[:] = row_means[second]
        else:
            center_left = row_means[overlap]
            center_right = row_means[overlap]
    left_residual, right_residual = left-center_left, right-center_right
    product = left_residual*right_residual
    denominator = float(np.linalg.norm(left_residual)*np.linalg.norm(right_residual))
    available = len(positions) >= minimum and denominator > 0
    raw_weight = float(product.sum()/denominator) if available else None
    weight = raw_weight * len(positions)/(len(positions)+shrinkage) if available else None
    return {'first': first, 'second': second, 'orientation': orientation,
            'centering': centering, 'sharedPositions': positions,
            'left': left, 'right': right, 'leftCenter': center_left,
            'rightCenter': center_right, 'leftResidual': left_residual,
            'rightResidual': right_residual, 'coordinateProducts': product,
            'numerator': float(product.sum()), 'denominator': denominator,
            'support': len(positions), 'available': available,
            'rawWeight': raw_weight, 'weight': weight}


def predict(value, user, item, orientation='user', centering='full-row',
            minimum=2, shrinkage=0., neighbors=30, positive_only=False, prior=None):
    ratings = ratings_matrix(value)
    if not 0 <= user < ratings.shape[0] or not 0 <= item < ratings.shape[1]:
        raise ValueError('query user/item ID is outside the actual table')
    if not isinstance(neighbors, int) or neighbors < 1:
        raise ValueError('positive integer k required')
    row_means, _ = means(ratings)
    observed = ratings[np.isfinite(ratings)]
    baseline = row_means[user] if np.isfinite(row_means[user]) else (float(observed.mean()) if observed.size else prior)
    if baseline is not None and not math.isfinite(baseline):
        raise ValueError('fallback prior must be finite or explicitly absent')
    target, size = (user, ratings.shape[0]) if orientation == 'user' else (item, ratings.shape[1])
    candidates, all_pairs = [], []
    for other in range(size):
        if other == target:
            continue
        rating = ratings[other, item] if orientation == 'user' else ratings[user, other]
        if not np.isfinite(rating):
            continue
        pair = similarity(ratings, target, other, orientation, centering, minimum, shrinkage)
        all_pairs.append(pair)
        weight = pair['weight']
        if weight is None or weight == 0 or (positive_only and weight <= 0):
            continue
        signal = float(rating)
        if centering != 'raw':
            signal -= row_means[other] if orientation == 'user' else row_means[user]
        candidates.append({'id': other, 'rating': float(rating), 'weight': weight,
                           'signal': signal, 'product': weight*signal})
    accepted = sorted(candidates, key=lambda row: (-abs(row['weight']), row['id']))[:neighbors]
    denominator = sum(abs(row['weight']) for row in accepted)
    if denominator and (centering == 'raw' or baseline is not None):
        correction = sum(row['product'] for row in accepted)/denominator
        result = correction if centering == 'raw' else baseline+correction
        fallback = False
    else:
        result, correction, fallback = baseline, None, True
    return {'score': result, 'baseline': baseline, 'pairs': all_pairs,
            'accepted': accepted, 'absoluteDenominator': denominator,
            'correction': correction, 'fallback': fallback,
            'rule': f'{orientation}/{centering}/' + ('positive' if positive_only else 'signed')}


def cluster_aggregate(value, members):
    ratings = ratings_matrix(value)
    if len(set(members)) != len(members) or any(not 0 <= member < len(ratings) for member in members):
        raise ValueError('cluster members must be unique valid user IDs')
    block = ratings[members]
    observed = np.isfinite(block)
    counts = observed.sum(axis=0)
    sums = np.where(observed, block, 0.).sum(axis=0)
    average = [float(total/count) if count else None for total, count in zip(sums, counts)]
    return {'memberIDs': members, 'sums': sums, 'counts': counts, 'means': average}


def ordinary_comparisons(value):
    import pandas as pd
    import surprise
    from surprise import Dataset, Reader, KNNBasic, KNNWithMeans

    if surprise.__version__ != '1.1.5':
        raise RuntimeError('this constructed comparison locks scikit-surprise 1.1.5')
    ratings = ratings_matrix(value)
    events = [(f'U{user}', f'I{item}', float(ratings[user, item]))
              for user, item in zip(*np.nonzero(np.isfinite(ratings)))]
    dataset = Dataset.load_from_df(pd.DataFrame(events, columns=['user', 'item', 'rating']),
                                  Reader(rating_scale=(-10, 10)))
    train = dataset.build_full_trainset()
    results = []
    for user_based in [True, False]:
        for algorithm in [KNNBasic, KNNWithMeans]:
            model = algorithm(k=30, min_k=1,
                              sim_options={'name': 'pearson', 'user_based': user_based, 'min_support': 2},
                              verbose=False)
            model.fit(train)
            prediction = model.predict('U0', 'I2', clip=False)
            results.append({'algorithm': algorithm.__name__, 'userBased': user_based,
                            'estimate': prediction.est, 'details': prediction.details,
                            'similarity': model.sim,
                            'fullTrainingMeans': model.means if hasattr(model, 'means') else None})
    return {'version': surprise.__version__, 'globalMean': float(train.global_mean),
            'userMapping': {f'U{u}': train.to_inner_uid(f'U{u}') for u in range(ratings.shape[0])},
            'itemMapping': {f'I{i}': train.to_inner_iid(f'I{i}') for i in range(ratings.shape[1])},
            'constructedKNNFits': 4, 'results': results,
            'difference': 'Native Pearson uses each pair-overlap mean and positive neighbors. WithMeans uses full-training row means of its selected entity orientation.'}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    ratings = [[5., 1., np.nan], [4., 2., 3.], [1., 5., 5.]]
    signed = predict(ratings, 0, 2)
    positive = predict(ratings, 0, 2, positive_only=True)
    expected = 3-4/(math.sqrt(10)+3)
    if abs(signed['score']-expected) > 1e-13 or positive['score'] != 3.:
        raise AssertionError('changed user-CF fixture differs from the declared signed/positive rules')
    report = {'ratings': [[None if np.isnan(v) else v for v in row] for row in ratings],
              'rowMeans': means(ratings)[0], 'signedUserCF': signed, 'positiveUserCF': positive,
              'itemCF': predict(ratings, 0, 2, orientation='item'),
              'rawPair': similarity(ratings, 0, 1, centering='raw'),
              'pairCentered': similarity(ratings, 0, 2, centering='pair'),
              'cluster': cluster_aggregate(ratings, [0, 1]),
              'emptyFallback': predict([[np.nan, np.nan]], 0, 1, minimum=1, prior=3.),
              'zeroNormPair': similarity([[0., 0.], [1., 2.]], 0, 1, centering='raw'),
              'ordinary': ordinary_comparisons(ratings),
              'cost': 'Selected pair O(counterpart entities); all item pairs O(U*I^2); accepted neighbor storage O(k) plus the actual matrix.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "rowMeans": [
    3.0,
    3.0,
    3.6666666666666665
  ],
  "signedUserCF": 2.350889359326483,
  "positiveUserCF": 3.0,
  "signedItemCF": 1.0,
  "cluster": {
    "memberIDs": [
      0,
      1
    ],
    "sums": [
      9.0,
      3.0,
      3.0
    ],
    "counts": [
      2,
      2,
      1
    ],
    "means": [
      4.5,
      1.5,
      3.0
    ]
  },
  "ordinaryPredictions": [
    {
      "algorithm": "KNNBasic",
      "userBased": true,
      "estimate": 3.0,
      "details": {
        "actual_k": 1,
        "was_impossible": false
      }
    },
    {
      "algorithm": "KNNWithMeans",
      "userBased": true,
      "estimate": 3.0,
      "details": {
        "actual_k": 1,
        "was_impossible": false
      }
    },
    {
      "algorithm": "KNNBasic",
      "userBased": false,
      "estimate": 1.0,
      "details": {
        "actual_k": 1,
        "was_impossible": false
      }
    },
    {
      "algorithm": "KNNWithMeans",
      "userBased": false,
      "estimate": 2.3333333333333335,
      "details": {
        "actual_k": 1,
        "was_impossible": false
      }
    }
  ],
  "zeroNormAvailable": false,
  "emptyFallback": 3.0
}
```

The signed user rule gives about 2.350889; keeping only positive neighbors gives 3. The ordinary item-oriented KNNWithMeans result is 7/3, whereas its user-oriented result is 3. This difference follows the named entity means and accepted positive Pearson neighbors. It is not an approximation error between identical rules. The empty row uses its stated prior, and a zero-length pair remains unavailable.


## 4. Replace a huge score table with shared factors

A separate score for every user–item pair requires U×I numbers and cannot by
itself share evidence across missing cells. **Matrix factorization** gives each
user a short vector pᵤ and each item a vector qᵢ of the same dimension d. A
coordinate of these vectors is a **factor**: a learned numerical direction used
by many scores, rather than a separately fitted parameter for one pair.

<!-- diagram:D13 -->

Return to a declared two-coordinate score fixture. The global rating mean μ is
3, the user bias bᵤ is .1 and the item bias bᵢ is −.1. A bias is an additive
offset shared across that entity's scores. The vectors p=(.4,−.2) and q=(.5,.3)
give matching products .4×.5=.20 and (−.2)×.3=−.06. Their sum is .14. Add
3+.1−.1+.14 to obtain score 3.14. This is a rating score, not a probability.

\[
s_{ui}=\mu+b_u+b_i+p_u^Tq_i.
\]

The superscript T means transpose: regard the same-coordinate vectors as a row
and column for the product. A lookup of pᵤ or qᵢ selects an entity's saved row;
it is not a calculation from the numerical distance between IDs. Each qᵢ affects
all users' scores for item i, and each pᵤ affects that user's scores for every
item. This shared use lets observed pairs teach parameters used by unobserved
pairs, but does not make an unobserved target known.

<!-- diagram:D14 -->

Stack user rows in P, shape U×d, and item rows in Q, shape I×d. Transpose Q to
shape d×I. The product P Qᵀ has shape U×I, and cell (u,i) uses exactly the two
selected rows' matching products. The factor part has rank at most d: every
column is a combination of the d columns of P. Add μ, user biases across rows
and item biases down columns separately. A rank bound on the factor product
does not say that the full table including these broadcasts has rank d.

### Deeper: a completion and its coordinates need not be unique

<!-- diagram:D15 -->

Suppose a 2×2 matrix reveals only its two diagonal entries, both 1. The rank-one
completions [[1,.5],[2,1]] and [[1,2],[.5,1]] both fit those observations exactly
and disagree on the missing entries. Their second rows are respectively twice
and half their first rows, and their determinants are zero. More generally,
[[1,a],[1/a,1]] works for every nonzero a. If a=0, the reciprocal construction
is unavailable; it is not a valid limiting completion with a silently filled
missing cell. Low rank plus observed fit alone does not identify all missing
ratings. Validation adds evidence for model choices but cannot prove an
intrinsic universal rank from a finite sample.

<!-- diagram:D16 -->

The coordinate axes also need not identify genres. Rotate p and every q by the
same orthogonal matrix R: the dot remains (Rp)ᵀ(Rq)=pᵀq because RᵀR=I. A 90°
rotation sends (x,y) to (−y,x). For p=(.4,−.2), q=(.5,.3), the rotated vectors
(.2,.4) and (−.3,.5) still give −.06+.20=.14. Each vector's squared length also
stays the same. Anonymous factor axes describe the algebra without inventing
an identified genre interpretation. A zero vector has no direction to rotate.

<!-- diagram:D17 -->

An invertible change of coordinates can preserve the dot without preserving
its penalty. Treat vectors as columns and set p′=A p, q′=A⁻ᵀq. Then
p′ᵀq′=pᵀq. With A=diag(2,1) and p=q=(1,0), the new vectors are (2,0) and
(.5,0). The dot stays 1, while their squared-norm sum changes from 2 to
4+.25=17/4. Orthogonal rotations preserve an isotropic L2 penalty; arbitrary
invertible scalings generally do not. A singular A cannot supply the inverse
action and must be reported as unavailable, not repaired with a hidden epsilon.

The new factor-structure program checks actual score/matrix dimensions,
ambiguous completions, rotations and changed penalties on small states. NumPy
owns array operations; the loops and transformations define the mechanism.
Fitting these vectors from sparse observations requires an objective and an
update rule, which we now open one observed record at a time.

## 5. Learn factors one observed rating at a time

For the selected observed pair, rating r=5 and score s=3.14 give error
e=r−s=1.86. Increasing the score slightly reduces this positive residual.
**Gradient descent** changes each parameter in the direction opposite the
objective's partial derivative. The learning rate η controls how far it moves;
knowing a derivative's sign does not guarantee that any chosen finite step
reduces the objective.

<!-- diagram:D18 -->

Start with the local objective

\[
\ell=\tfrac12 e^2+
\tfrac\lambda2(\|p\|^2+\|q\|^2+b_u^2+b_i^2),
\qquad e=r-\mu-b_u-b_i-p^Tq.
\]

The factor 1/2 makes the square's derivative simpler. The **L2 penalty** adds a
cost for large squared parameter values; λ≥0 controls its strength. This local
example holds μ fixed and penalizes the two entity biases. Chain rule gives
∂ℓ/∂p=−e q+λp and ∂ℓ/∂q=−e p+λq: changing p's coordinate changes the score by
the matching q coordinate. The bias derivatives are −e+λbᵤ and −e+λbᵢ.

Using λ=.1, the two p derivatives are −.89 and −.578; the q derivatives are
−.694 and .402; the bias derivatives are −1.85 and −1.87. With η=.05, subtract
η times each derivative to obtain p′=(.4445,−.1711), q′=(.5347,.2799),
bᵤ′=.1925 and bᵢ′=−.0065. Every derivative reads the same **old buffer**: q's
update reads old p, and p's update reads old q. Updating p first and using that
new value in q's derivative performs a different step. Copies in the code are
part of the algorithm, not decorative bookkeeping.

<!-- diagram:D19 -->

The local objective is initially 1.7578 and becomes about 1.350450 after that
step. The retained gradient program independently checks derivatives with
central differences, then prints changed-step outcomes. η=.5 gives .330686 in
this state, while η=1 gives 5.698610: the larger step increases the loss. A
finite-difference calculation is a local derivative check, not a proof that
training converges or generalizes. Repeated local steps need their actual
current objective plotted on named step/loss axes. If a requested step leaves
the supported finite range, report the first unavailable stage and last valid
state instead of clipping it and claiming convergence.

**Stochastic gradient descent**, or SGD, visits records and performs these
local updates, often in shuffled order. Seeded nonzero initial factors break a
special dead point: with p=q=0, the product's derivatives in both vectors are
zero. Biases can still move, and a nonzero history branch later changes this
case, but an all-zero pure dot model cannot invent a factor direction through
that same first-order product gradient.

The complete retained `explicitFit` program visits only observed records, uses
old buffers for each local step, and recomputes a fixed-state training objective
after every epoch. An **epoch** is one pass over the record list. Its rolling
error uses parameters at different moments during that pass; it is not the
error of the single final saved rule. At epoch 160 its recorded rolling RMSE is
.191520, fixed-state training RMSE .186150 and objective 2.839368. No held-out
score is computed by this mechanism demonstration. We retain that result and
its complete program without treating training fit as new-data performance.

### Deeper: how often was the penalty counted?

<!-- diagram:D20 -->

Summing the displayed local objective once for each rating record charges pᵤ
and bᵤ once for every record involving user u. If that user has nᵤ records,
the global sum contains nᵤ λ‖pᵤ‖²/2. Likewise item i's factor and bias penalties
are counted nᵢ times. The original complete SGD loop uses this per-record
convention. Changing to a once-per-entity penalty changes the objective even if
the variable is still called λ.

To distribute one entity penalty over its nᵤ positive-incidence updates, use
λ/nᵤ in each corresponding local update; the summed coefficients then equal λ.
The same accounting applies to item parameters with nᵢ. For an entity with no
records, there is no local event through which to distribute a prior: a positive
once-entity quadratic penalty minimizes its otherwise unused vector at zero,
whereas an unpenalized no-record vector is unconstrained. Sum versus mean loss
also rescales the relative penalty. Match the complete objective before
comparing solvers or a library's setting name.

<!-- diagram:D21 -->

A probabilistic model supplies another reason for that once-entity penalty.
Suppose observed ratings are independent Gaussian outcomes around pᵤᵀqᵢ with
noise variance σ², and each factor has an independent zero-mean isotropic
Gaussian prior of variance τ². Ignoring constants independent of the factors,
negative log posterior is

\[
\frac{1}{2\sigma^2}\sum_{(u,i)\in\Omega}(r_{ui}-p_u^Tq_i)^2+
\frac{1}{2\tau^2}(\|P\|_F^2+\|Q\|_F^2).
\]

Multiplying by the positive σ² gives λ=σ²/τ² for the once-entity objective.
The Frobenius norm ‖P‖²_F adds every squared factor entry once. More observation
noise relative to the prior increases this ratio. σ² and τ² must be positive
for these densities; zero is a degenerate limiting assumption, not an ordinary
finite division. Bias/mean priors, when added, need their own declared terms.
[Probabilistic Matrix Factorization, §§1–2](https://papers.nips.cc/paper/2007/file/d7322ed717dedf1eb4e6e52a37ea7bcd-Paper.pdf)
derives this likelihood/prior route. Its **maximum a posteriori (MAP)** fit is a point
estimate; it does not itself provide a posterior uncertainty interval around
every missing score. Joint factor fitting remains nonconvex even though each
fixed-side subproblem is much simpler.

### Complete program: Check one simultaneous update

The local loss and its finite difference use the same mean, biases, old factors and record penalty. Copying the old parameter vector makes every coordinate derivative describe one common state. Comparing several step sizes illustrates that a gradient direction does not make an arbitrary finite step safe.

<!-- program:gradient filename:gradient.py -->

```python
import numpy as np

mean, rating, penalty, rate = 3.0, 5.0, 0.1, 0.05
state = np.array([0.4, -0.2, 0.5, 0.3, 0.1, -0.1])


def objective(values):
    p, q, bu, bi = values[:2], values[2:4], values[4], values[5]
    error = rating - mean - bu - bi - p @ q
    return 0.5 * (error**2 + penalty * (values @ values))


def gradient(values):
    p, q, bu, bi = values[:2], values[2:4], values[4], values[5]
    error = rating - mean - bu - bi - p @ q
    return np.r_[
        -error * q + penalty * p,
        -error * p + penalty * q,
        -error + penalty * bu,
        -error + penalty * bi,
    ]


analytic = gradient(state)
step = 1e-6
numeric = np.array(
    [
        (objective(state + step * row) - objective(state - step * row)) / (2 * step)
        for row in np.eye(6)
    ]
)
assert np.allclose(analytic, numeric, atol=1e-8)
updated = state - rate * analytic
print("gradient:", np.round(analytic, 6).tolist())
print("new state:", np.round(updated, 6).tolist())
print(f"local objective: {objective(state):.6f} -> {objective(updated):.6f}")
for changed_rate in (0.05, 0.5, 1.0):
    print(
        f"rate={changed_rate}: objective={objective(state-changed_rate*analytic):.6f}"
    )
```

Recorded output for this exact original program and its original execution context:

```text
gradient: [-0.89, -0.578, -0.694, 0.402, -1.85, -1.87]
new state: [0.4445, -0.1711, 0.5347, 0.2799, 0.1925, -0.0065]
local objective: 1.757800 -> 1.350450
rate=0.05: objective=1.350450
rate=0.5: objective=0.330686
rate=1.0: objective=5.698610
```

### Complete program: Train observed records and then measure one fixed state

The observed coordinate list excludes missing pairs before the loop. Each record reads old vectors, updates both biases and factors, and contributes its degree-counted regularization. The rolling loss mixes states visited during the epoch; the later fixed training RMSE and complete objective recompute one saved state. Stable unseen-item ordering is a forward result, not held-out performance.

<!-- program:explicitFit filename:explicitFit.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)


def fit_mf(records, users, items, rank=2, penalty=0.1, rate=0.02, epochs=160, seed=7):
    # This objective sums a regularized local term for every observed record.
    # A user/item with d records therefore has its penalty counted d times.
    rng = np.random.default_rng(seed)
    mean = float(np.mean([row[2] for row in records]))
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))
    bu, bi = np.zeros(users), np.zeros(items)
    seen_users, seen_items = {row[0] for row in records}, {row[1] for row in records}
    for user in set(range(users)) - seen_users:
        p[user] = 0.0
    for item in set(range(items)) - seen_items:
        q[item] = 0.0
    history = []
    for epoch in range(epochs):
        rolling_sse = 0.0
        for position in rng.permutation(len(records)):
            user, item, rating = records[position][:3]
            old_p, old_q = p[user].copy(), q[item].copy()
            old_bu, old_bi = bu[user], bi[item]
            error = rating - mean - old_bu - old_bi - old_p @ old_q
            rolling_sse += error**2
            p[user] += rate * (error * old_q - penalty * old_p)
            q[item] += rate * (error * old_p - penalty * old_q)
            bu[user] += rate * (error - penalty * old_bu)
            bi[item] += rate * (error - penalty * old_bi)
        fixed_errors, objective = [], 0.0
        for user, item, rating, *rest in records:
            error = rating - mean - bu[user] - bi[item] - p[user] @ q[item]
            fixed_errors.append(error**2)
            objective += 0.5 * (
                error**2
                + penalty
                * (
                    p[user] @ p[user]
                    + q[item] @ q[item]
                    + bu[user] ** 2
                    + bi[item] ** 2
                )
            )
        if not np.isfinite(objective):
            raise ArithmeticError("Training left the finite numerical range.")
        history.append(
            (
                np.sqrt(rolling_sse / len(records)),
                np.sqrt(np.mean(fixed_errors)),
                objective,
            )
        )
    return dict(
        mean=mean,
        p=p,
        q=q,
        bu=bu,
        bi=bi,
        seen_users=seen_users,
        seen_items=seen_items,
        history=history,
    )


def score(model, user, item):
    known_user = user in model["seen_users"]
    known_item = item in model["seen_items"]
    value = model["mean"]
    if known_user:
        value += model["bu"][user]
    if known_item:
        value += model["bi"][item]
    if known_user and known_item:
        value += model["p"][user] @ model["q"][item]
    return float(value)


records = [
    (int(user), int(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
model = fit_mf(records, 5, 7)
for epoch in (0, 39, 79, 159):
    rolling, fixed, objective = model["history"][epoch]
    print(
        f"epoch={epoch+1}: rolling={rolling:.6f}, fixed training={fixed:.6f}, objective={objective:.6f}"
    )
ranking = sorted(
    (score(model, 0, item), item) for item in range(7) if not observed[0, item]
)
print(
    "user 0 unseen, descending:",
    [
        (item, round(value, 6))
        for value, item in sorted(ranking, key=lambda row: (-row[0], row[1]))
    ],
)
print("No held-out score was computed in this mechanism demonstration.")
```

Recorded output for this exact original program and its original execution context:

```text
epoch=1: rolling=1.359578, fixed training=1.323825, objective=17.554161
epoch=40: rolling=0.752409, fixed training=0.710386, objective=6.294669
epoch=80: rolling=0.283893, fixed training=0.275043, objective=3.093511
epoch=160: rolling=0.191520, fixed training=0.186150, objective=2.839368
user 0 unseen, descending: [(2, 4.356817), (6, 3.69603), (4, 2.488535)]
No held-out score was computed in this mechanism demonstration.
```

## 6. Hold one side fixed and solve the other

**Alternating least squares**, or ALS, holds the item factors fixed while
solving user factors, then holds those users fixed while solving items. The
two sides together are nonconvex, but a fixed-side squared-error problem is a
quadratic. Its exact block minimum can replace a sequence of small SGD steps.
This section first uses a separate biasless fixed-factor fixture; it does not
silently reuse the biased local objective from section 5.

<!-- diagram:D22 -->

Take a single user coordinate p, fixed item factors 1 and 2, observed ratings
4 and 2, and once-entity penalty 1. The objective is
(4−p)²+(2−2p)²+p²=20−16p+6p². Each residual square and the penalty contributes
to the pictured bowl. Its derivative is −16+12p, so p=4/3 minimizes it. The
three terms then total 64/9+4/9+16/9=28/3. At p=0 the same objective is 20.
The numerical axis represents these actual p/loss coordinates.

<!-- diagram:D23 -->

For several user coordinates, hold every coordinate except k fixed. Write
the residual without coordinate k as rᵢ−Σ_{l≠k}p_l qᵢl. Expand the squared terms
as a quadratic in p_k and set its derivative to zero:

\[
p_k=\frac{\sum_{i\in\Omega_u}q_{ik}
\left(r_{ui}-\sum_{l\ne k}p_lq_{il}\right)}
{\sum_{i\in\Omega_u}q_{ik}^2+\lambda}.
\]

The numerator aligns the selected coordinate's item values with residuals left
by the others. The denominator supplies that coordinate's curvature plus its
penalty. With λ=0 and every selected qᵢk zero, the denominator and numerator
are zero: the objective is flat in that coordinate and does not select a unique
value. Report nonuniqueness rather than dividing by zero or inserting a hidden
regularizer. For a per-record objective, this block's penalty coefficient is
λnᵤ instead of λ.

<!-- diagram:D24 -->

Solve all coordinates together by assembling the outer products. Each observed
item vector qᵢ adds qᵢqᵢᵀ to a d×d matrix and rᵤᵢqᵢ to a d-vector. Add λI to
the matrix, then solve the simultaneous linear equations:

\[
A=Q_{\Omega_u}^TQ_{\Omega_u}+\lambda I,\qquad
b=Q_{\Omega_u}^Tr_u,\qquad Ap_u=b.
\]

I is the identity matrix: λ enters the diagonal. For a small independent
example, q0=(1,0), q1=(1,1), ratings 4 and 2, λ=1 give A=[[3,1],[1,2]] and
b=[6,2]. The equations 3p0+p1=6 and p0+2p1=2 yield p=(2,0); substitution gives
residual Ap−b=(0,0). This example's objective is (4−2)²+(2−2)²+2²=8.

For every nonzero vector z and λ>0,
zᵀAz=Σᵢ(qᵢᵀz)²+λ‖z‖²>0. This is **positive definiteness**: the quadratic has
positive curvature in every direction and a unique block minimum. With no
observations, A=λI and b=0, so p=0. At λ=0, insufficient independent observed
directions can make A singular; a direct unique solve is unavailable. A
declared pseudoinverse would choose among solutions by another convention.

Use `solve(A,b)` rather than constructing an inverse to multiply by b. NumPy
owns the numerical linear algebra kernel; the scratch implementation writes
the observation selection, outer-product assembly, block order and objective
accounting. A Cholesky factor expresses positive-definite A as L Lᵀ and solves
two triangular systems. Poor conditioning can amplify rounding, so inspect
the residual and use a tolerance with a stated scale rather than treating an
unqualified approximate equality as exact arithmetic.

For symmetric A, an **eigenvector** is a direction z with Az=κz; κ is its
**eigenvalue**. Along a unit-length such direction, the quadratic increase
zᵀAz equals κ. Positive definiteness therefore requires every eigenvalue
positive. A very small positive curvature relative to the largest one makes
a solve sensitive to rounding. The block helper reports these eigenvalues
and compares the smallest with a scale-dependent floating-point tolerance
before calling the direct solver. A numerically unavailable result describes
that finite-precision solve; it does not add a hidden penalty or assert that
every exact positive-λ quadratic is mathematically singular.

The complete retained `observedAls` program solves every user and then every
item under its biasless once-entity objective, saving the full objective after
each half-sweep. Its recorded first values are 227.378139, 206.009527,
50.961019 and 38.733608; the final value is 15.752924. Exact block minimization
cannot increase that same full objective in exact arithmetic, but monotone
training loss proves neither a global joint optimum nor better held-out
performance. Initial factors and alternative local minima still matter.

One observed user block costs roughly O(nᵤd²+d³) for assembly and a dense solve;
its temporary matrix has d² entries. Sparse indexing, reusable Gram matrices
and iterative solvers can change the workload and accuracy tradeoff. Next we
change the objective itself: purchase counts teach a weak all-pair target and
confidence, rather than an observed numerical rating.

### Complete program: Check factor geometry, a coordinate solve and an exact block

`score` separates broadcast biases from latent products. `local_gradient`, `central_difference` and `simultaneous_step` operate on one old state, while `degree_penalties` counts the record population. `quadratic_coordinate` opens the residual-with-one-coordinate-removed quotient. `observed_block` assembles the complete ridge system and reports its condition/residual before interpreting a solution. The construction compares score invariance under rotation/rescaling with norm-penalty invariance, and reports singular or flat cases explicitly rather than hiding them with epsilon.

<!-- program:recommender-factor-structure filename:recommender-factor-structure.py -->

```python
"""Analytic factor, gradient, penalty and solve examples; no training fit.

Run: python recommender-factor-structure.py
Requires NumPy and SciPy. Matrices are float64; ratings are finite or NaN.
"""
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def finite_array(value, name, ndim=None):
    result = np.asarray(value, dtype=np.float64)
    if ndim is not None and result.ndim != ndim:
        raise ValueError(f'{name} must have {ndim} dimensions')
    if not np.isfinite(result).all():
        raise ValueError(f'{name} must be finite')
    return result


def score(mean, user_bias, item_bias, p, q):
    p, q = finite_array(p, 'p', 1), finite_array(q, 'q', 1)
    if p.shape != q.shape or not p.size:
        raise ValueError('p and q need the same positive factor width')
    scalar = finite_array([mean, user_bias, item_bias], 'intercepts')
    return float(scalar.sum() + p @ q)


def local_loss(theta, rating, mean, penalty):
    """theta=[p coordinates,q coordinates,user bias,item bias]."""
    theta = finite_array(theta, 'theta', 1)
    if len(theta) < 4 or (len(theta) - 2) % 2:
        raise ValueError('theta needs two equal factor vectors and two biases')
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be finite and nonnegative')
    finite_array([rating, mean], 'rating/mean')
    d = (len(theta) - 2) // 2
    error = rating - score(mean, theta[-2], theta[-1], theta[:d], theta[d:2*d])
    return float(.5 * error ** 2 + .5 * penalty * (theta @ theta))


def local_gradient(theta, rating, mean, penalty):
    theta = finite_array(theta, 'theta', 1)
    local_loss(theta, rating, mean, penalty)  # Same validation/objective.
    d = (len(theta) - 2) // 2
    p, q = theta[:d].copy(), theta[d:2*d].copy()
    error = rating - score(mean, theta[-2], theta[-1], p, q)
    return np.concatenate((-error*q + penalty*p,
                           -error*p + penalty*q,
                           -error + penalty*theta[-2:]))


def simultaneous_step(theta, rating, mean, penalty, rate):
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('rate must be finite and nonnegative')
    old = finite_array(theta, 'old theta', 1).copy()
    derivative = local_gradient(old, rating, mean, penalty)
    after = old - rate * derivative
    if not np.isfinite(after).all():
        raise FloatingPointError('step produced an unavailable nonfinite state')
    return after, derivative


def central_difference(function, theta, epsilon=1e-6):
    theta = finite_array(theta, 'theta', 1)
    if not math.isfinite(epsilon) or epsilon <= 0:
        raise ValueError('epsilon must be positive and finite')
    result = np.empty_like(theta)
    for coordinate in range(len(theta)):
        delta = np.zeros_like(theta)
        delta[coordinate] = epsilon
        result[coordinate] = (function(theta+delta)-function(theta-delta))/(2*epsilon)
    return result


def quadratic_coordinate(a, b, coordinate, current):
    """Minimize p.T A p - 2 b.T p while other coordinates stay fixed."""
    a, b = finite_array(a, 'A', 2), finite_array(b, 'b', 1)
    current = finite_array(current, 'current', 1)
    if a.shape != (b.size, b.size) or current.shape != b.shape:
        raise ValueError('A/b/current shapes disagree')
    if not 0 <= coordinate < b.size:
        raise ValueError('coordinate is outside the actual vector')
    curvature = float(a[coordinate, coordinate])
    numerator = float(b[coordinate] - a[coordinate] @ current + curvature*current[coordinate])
    if curvature < 0:
        return {'available': False, 'reason': 'negative curvature is not a bounded minimum'}
    if curvature == 0:
        return {'available': False, 'reason': 'flat nonunique coordinate' if numerator == 0 else 'unbounded linear coordinate'}
    return {'available': True, 'numerator': numerator, 'curvature': curvature,
            'value': numerator / curvature}


def observed_block(q, ratings, penalty):
    """Biasless once-entity ridge block, including empty observed rows."""
    q, ratings = finite_array(q, 'Q', 2), finite_array(ratings, 'ratings', 1)
    if q.shape[0] != len(ratings) or not q.shape[1]:
        raise ValueError('one finite rating per provided Q row is required')
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be nonnegative and finite')
    a = q.T @ q + penalty*np.eye(q.shape[1])
    b = q.T @ ratings
    eigenvalues = np.linalg.eigvalsh(a)
    scale = max(1.0, float(np.linalg.norm(a, ord=2)))
    tolerance = np.finfo(np.float64).eps * scale * max(1, len(b)) * 16
    if eigenvalues[0] <= tolerance:
        return {'available': False, 'reason': 'singular or numerically non-SPD block',
                'A': a, 'b': b, 'eigenvalues': eigenvalues, 'tolerance': tolerance}
    by_numpy = np.linalg.solve(a, b)
    by_scipy = scipy_solve(a, b, assume_a='pos')
    residual = float(np.linalg.norm(a @ by_numpy - b, ord=np.inf))
    return {'available': True, 'A': a, 'b': b, 'p': by_numpy,
            'scipyP': by_scipy, 'residualInfinity': residual,
            'eigenvalues': eigenvalues, 'tolerance': tolerance}


def degree_penalties(events, users, items, penalty):
    """Each event charges its participating entity in the local objective."""
    if users < 1 or items < 1 or penalty < 0:
        raise ValueError('positive dimensions/nonnegative penalty required')
    user_degrees, item_degrees = np.zeros(users, dtype=int), np.zeros(items, dtype=int)
    for user, item, _ in events:
        if not 0 <= user < users or not 0 <= item < items:
            raise ValueError('event ID is outside its entity table')
        user_degrees[user] += 1
        item_degrees[item] += 1
    return {'userDegree': user_degrees, 'itemDegree': item_degrees,
            'perRecordUserCoefficients': penalty*user_degrees,
            'onceEntityUserCoefficients': np.full(users, penalty)}


def serial(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    # New analytic witness; this never invokes the retained factor trainers.
    completion = np.array([[1., 3.], [1/3, 1.]])
    p, q = np.array([1., 0.]), np.array([1., 0.])
    angle = math.radians(37)
    rotation = np.array([[math.cos(angle), -math.sin(angle)],
                         [math.sin(angle), math.cos(angle)]])
    change = np.diag([2., 1.])
    p_changed, q_changed = change @ p, np.linalg.solve(change.T, q)
    theta = np.array([.2, .4, -.3, .5, .05, .1])
    gradient = local_gradient(theta, 2., 3., .2)
    numerical = central_difference(lambda x: local_loss(x, 2., 3., .2), theta)
    after, _ = simultaneous_step(theta, 2., 3., .2, .1)
    gradient_error = float(np.max(np.abs(gradient-numerical)))
    if gradient_error > 2e-8:
        raise AssertionError('changed analytic gradient exceeds declared finite-difference tolerance')
    block = observed_block([[1., 0.], [1., 1.]], [4., 2.], 1.)
    if not block['available'] or not np.allclose(block['p'], [2., 0.], rtol=0, atol=1e-13):
        raise AssertionError('direct worked block failed')
    # X.T X + I = [[3,1],[1,2]], X.T r = [6,2].
    report = {
        'scope': 'Analytic arrays and one changed local step; no factor training fit',
        'rankOneCompletion': completion, 'determinant': float(np.linalg.det(completion)),
        'orthogonalDot': float((rotation@p) @ (rotation@q)),
        'orthogonalNormSum': float(np.sum((rotation@p)**2)+np.sum((rotation@q)**2)),
        'rescaledP': p_changed, 'rescaledQ': q_changed,
        'rescaledDot': float(p_changed@q_changed),
        'oldNormSum': float(p@p+q@q), 'newNormSum': float(p_changed@p_changed+q_changed@q_changed),
        'changedGradient': gradient, 'centralDifference': numerical,
        'differenceInfinity': gradient_error, 'differenceStep': 1e-6,
        'after': after, 'beforeLoss': local_loss(theta, 2., 3., .2),
        'afterLoss': local_loss(after, 2., 3., .2),
        'degreeCounts': degree_penalties([(0, 0, 1), (0, 1, 2), (0, 0, 3), (0, 1, 4)], 2, 2, .2),
        'MAPLambda': .5**2 / 2.**2,
        'coordinate': quadratic_coordinate([[3., 1.], [1., 2.]], [6., 2.], 0, [0., 1.]),
        'directBlock': block,
        'positivePenaltyEmpty': observed_block(np.empty((0, 2)), [], 1.),
        'unpenalizedEmpty': observed_block(np.empty((0, 2)), [], 0.),
        'flatCoordinate': quadratic_coordinate([[0.]], [0.], 0, [2.]),
        'unboundedCoordinate': quadratic_coordinate([[0.]], [1.], 0, [2.]),
        'cost': 'score O(d); block assembly O(n*d^2), direct solve O(d^3); no inverse needed to solve one b',
    }
    print(json.dumps(report, indent=2, default=serial, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "rankOneCompletion": [
    [
      1.0,
      3.0
    ],
    [
      0.3333333333333333,
      1.0
    ]
  ],
  "determinant": 0.0,
  "orthogonalDot": 1.0,
  "orthogonalNormSum": 2.0,
  "rescaledDot": 1.0,
  "oldNormSum": 2.0,
  "newNormSum": 4.25,
  "changedGradient": [
    -0.347,
    0.7250000000000001,
    0.198,
    0.616,
    1.3,
    1.31
  ],
  "differenceInfinity": 1.597296184208119e-10,
  "beforeLoss": 0.8873000000000001,
  "afterLoss": 0.5048380542293618,
  "degreeCounts": {
    "userDegree": [
      4,
      0
    ],
    "itemDegree": [
      2,
      2
    ],
    "perRecordUserCoefficients": [
      0.8,
      0.0
    ],
    "onceEntityUserCoefficients": [
      0.2,
      0.2
    ]
  },
  "MAPLambda": 0.0625,
  "coordinate": {
    "available": true,
    "numerator": 5.0,
    "curvature": 3.0,
    "value": 1.6666666666666667
  },
  "directBlock": {
    "available": true,
    "A": [
      [
        3.0,
        1.0
      ],
      [
        1.0,
        2.0
      ]
    ],
    "b": [
      6.0,
      2.0
    ],
    "p": [
      2.0,
      0.0
    ],
    "scipyP": [
      2.0000000000000004,
      -2.664535259100376e-16
    ],
    "residualInfinity": 0.0,
    "eigenvalues": [
      1.381966011250105,
      3.618033988749895
    ],
    "tolerance": 2.5707677684393782e-14
  },
  "unpenalizedEmpty": {
    "available": false,
    "reason": "singular or numerically non-SPD block",
    "A": [
      [
        0.0,
        0.0
      ],
      [
        0.0,
        0.0
      ]
    ],
    "b": [
      0.0,
      0.0
    ],
    "eigenvalues": [
      0.0,
      0.0
    ],
    "tolerance": 7.105427357601002e-15
  },
  "flatCoordinate": {
    "available": false,
    "reason": "flat nonunique coordinate"
  }
}
```

The changed rescaling keeps dot 1 while changing the norm sum from 2 to 4.25. The local derivative agrees with a central difference to about 1.6e−10, and its declared step reduces this local loss from .8873 to about .504838. The direct block produces p=(2,0); the coordinate quotient and unavailable flat block retain their separate conditions. These are geometry and local-solve checks, not new held-out accuracy measurements.


### Complete program: Alternate complete exact factor blocks

For a user, select only observed item rows before assembling the normal system and right-hand side. Solve users with Q fixed, then items with the resulting P fixed. The once-entity positive ridge identifies an empty block at zero. The printed objective is evaluated after complete updates. `np.linalg.solve` owns the linear algebra kernel; the loop writes the masked factor algorithm.

<!-- program:observedAls filename:observedAls.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)


def als(ratings, rank=2, penalty=0.3, sweeps=12, seed=4):
    observed = np.isfinite(ratings)
    users, items = ratings.shape
    rng = np.random.default_rng(seed)
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))

    # Once-per-entity regularization; this example has no bias terms.
    def objective():
        return float(
            ((ratings[observed] - (p @ q.T)[observed]) ** 2).sum()
            + penalty * ((p * p).sum() + (q * q).sum())
        )

    values = [objective()]
    for _ in range(sweeps):
        for user in range(users):
            selected = observed[user]
            design = q[selected]
            p[user] = np.linalg.solve(
                design.T @ design + penalty * np.eye(rank),
                design.T @ ratings[user, selected],
            )
        values.append(objective())
        for item in range(items):
            selected = observed[:, item]
            design = p[selected]
            q[item] = np.linalg.solve(
                design.T @ design + penalty * np.eye(rank),
                design.T @ ratings[selected, item],
            )
        values.append(objective())
    assert np.all(np.diff(values) <= 1e-8)
    return p, q, values


p, q, objectives = als(ratings)
print("first four objective values:", [round(x, 6) for x in objectives[:4]])
print("final objective:", round(objectives[-1], 6))
print("user 0 unseen scores:", np.round((p @ q.T)[0, [2, 4, 6]], 6).tolist())
# Both rank-one matrices agree on the two observed diagonal entries.
first = np.array([[1.0, 0.5], [2.0, 1.0]])
second = np.array([[1.0, 2.0], [0.5, 1.0]])
print("same observations, different completions:", first.tolist(), second.tolist())
assert np.linalg.matrix_rank(first) == np.linalg.matrix_rank(second) == 1
```

Recorded output for this exact original program and its original execution context:

```text
first four objective values: [227.378139, 206.009527, 50.961019, 38.733608]
final objective: 15.752924
user 0 unseen scores: [4.688194, 2.421797, 3.592824]
same observations, different completions: [[1.0, 0.5], [2.0, 1.0]] [[1.0, 2.0], [0.5, 1.0]]
```

## 7. Turn implicit events into targets and confidence

A purchase count describes repeated recorded events, not a numerical rating.
One purchase and ten purchases can both indicate positive engagement while
providing different amounts of evidence. **Implicit feedback** must declare how
such records become targets and weights. The objective below deliberately uses
weak zero targets for unobserved pairs; it does not claim those absences are
known dislikes or impressions of an available item.

<!-- diagram:D25 -->

Use a separate three-item fixture with counts n=[2,0,1], α=2 and item factors
q0=(1,0), q1=(0,1), q2=(1,1). The positive indicator gives targets t=[1,0,1].
Multiply each count by α and add baseline 1 to get confidence c=[5,1,3].
Count zero still has confidence 1. Increasing α strengthens the observed
events relative to the baseline; setting α=0 gives all confidences 1 while
leaving the targets tied to whether a positive event exists.

\[
t_{ui}=\mathbf1[n_{ui}>0],\qquad c_{ui}=1+\alpha n_{ui},\qquad
L=\sum_{u,i}c_{ui}(t_{ui}-p_u^Tq_i)^2+
\lambda(\|P\|_F^2+\|Q\|_F^2).
\]

Unlike explicit-rating SSE, this sum runs over every user–item pair. The
confidence-weighted residual is a modeling construction. It is not a frequency
estimate of an event probability, and the fitted dot score is unconstrained:
negative values and values greater than 1 are possible.

<!-- diagram:D26 -->

Hold Q fixed and set λ=1. The user normal matrix receives each cᵢqᵢqᵢᵀ and λI;
the right side receives cᵢtᵢqᵢ. In our fixture this gives
A=[[9,3],[3,5]], b=[8,3]. Its determinant is 36. Solve the two equations to
obtain p=(31/36,1/12); the three scores are 31/36,1/12,17/18.

The same A can be built sparsely. Its **Gram matrix** QᵀQ is [[2,1],[1,2]],
which already contributes baseline confidence 1 for all three items. Only the
positive-count corrections remain: (5−1)q0q0ᵀ and (3−1)q2q2ᵀ. Add λI and
recover [[9,3],[3,5]]. The right side is 5q0+3q2=[8,3]. Omitting the unobserved
item's baseline curvature instead solves a different objective and gives
p=(23/27,1/9). A sparse implementation must preserve that missing-pair term,
rather than interpreting “not stored” as “not in the loss.”

<!-- diagram:D27 -->

The fixed-Q objective is a quadratic in p. Its contours show how A couples the
coordinates: an off-diagonal entry means changing one coordinate influences
the other coordinate's derivative. A point p*+z increases this same objective
by zᵀAz relative to the exact minimizer. Label contour levels, coordinates and
current minimum on their actual numerical scale; a tilted ellipse is useful
only when it belongs to the displayed A and objective. Positive λ ensures a
unique fixed-side solution even with no positive history. For an empty history
b=0 while QᵀQ+λI remains, so p=0 and every dot score is zero.

<!-- diagram:D28 -->

Compute QᵀQ once for a fixed item state. Each user's sparse positive history
adds weighted outer products, then solves a d×d system. The dense Gram costs
O(Id²); a user with nᵤ positive item cells needs O(nᵤd²+d³) for corrections and
the direct solve. Store Q's Id values, the d² Gram/work matrix and sparse
history. This reuses baseline curvature without constructing every confidence
matrix as a dense I×I array. A repeated invoice occurrence changes its cell's
count; it is not another item row or another independent user.

The retained `implicitBlock` program compares dense all-pair assembly with
these Gram corrections and prints both p and the omitted-missing-pair answer.
The complete `implicitFit` program alternates all user and item solves under
its once-entity objective. Its recorded full objective moves from 1365.048941
initially to 69.937084 after its first sweep and 25.213882 finally. Its unseen
scores include negative values. That is consistent with unconstrained factors,
not a failed probability normalizer or a held-out ranking result.

### Deeper: an exact score decomposition

<!-- diagram:D29 -->

For a selected item factor q*, solve A v=q* with the same current user's A.
Since A is symmetric, q*ᵀp=q*ᵀA⁻¹b=vᵀb. Substitute the positive-history
right side: the score is Σ_{i:nᵢ>0} cᵢ(qᵢᵀv). This is an inverse **action**
obtained by a solve, not a reason to materialize a full inverse for each query.

Select I2 in the three-item fixture. Its q*=(1,1) gives v=(1/18,1/6).
The I0 history contribution is 5×1/18=5/18; I2 contributes
3×(1/18+1/6)=2/3. Their sum is 17/18, matching the direct dot. Selecting I1
instead gives contributions −5/12 and 1/2, totaling 1/12. Individual
contributions can be negative even though all recorded events are positive.
They explain this fitted computation under its fixed history and curvature;
they do not identify why someone purchased or the causal effect of altering
one event. [Hu, Koren and Volinsky, §§4–5](https://yifanhu.net/PUB/cf.pdf)
develop the sparse solve and this decomposition.

### The ordinary sparse package has its own signed encoding

<!-- diagram:D30 -->

In implicit 0.7.3, positive stored CSR values represent confidence for target 1.
A negative stored value represents target 0 with its absolute magnitude as
confidence. Its `alpha` multiplies supplied data; it does not add the baseline
1. For our count-derived values 1+2n, use package alpha 1 to avoid multiplying
confidence a second time. This signed package context is different from
negative purchase counts, which the count model does not permit.

An exact numeric zero in the editor means **omit the CSR coordinate**. The
baseline Gram then retains that pair's qᵢqᵢᵀ term. The normal-equation routine
iterates physically stored entries and adds (|cᵢ|−1)qᵢqᵢᵀ. A physically stored
zero would subtract that baseline term and change curvature. For q=1, λ=1,
an absent entry gives A=2,b=0; a stored zero gives A=1,b=0. Both score zero in
this particular state, but their storage and objectives are not equivalent.
Stored −4 gives A=5,b=0; stored +4 gives A=5,b=4.

The complete `signed_confidence_csr` function in the study file in §13 accepts
one value per user–item coordinate. It omits zeros when constructing CSR, calls
`sum_duplicates` on that representation, eliminates any stored zeros and checks
that no zero remains before calling the package. This dense-coordinate input
cannot express repeated coordinate records; a record-list encoder would need
to reject duplicates unless a target-preserving aggregation were explicitly declared. Adding +4 and −4 without specifying
what that cancellation means would silently change targets, so the ordinary
one-value-per-item editor does not accept that ambiguity. Retail's later CSR
uses only positive-count cells with confidence 1+2n; absent counts remain
unstored baseline pairs. [The versioned ALS source](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py)
defines the package's actual conversion and solve.

### Use rated-item history as part of a user representation

Confidence weighting changes loss terms. **SVD++** instead adds learned history
vectors to a user's scoring representation. Let N(u) be the unique set of items
the user rated in the permitted prefix. Each item has a history vector yⱼ in
addition to its output vector qⱼ; the same ID does not make these parameter
arrays interchangeable.

<!-- diagram:D31 -->

Take p=0, two history items with y0=(1,0), y1=(0,1), output q=(1,0) and μ=3,
with zero biases. Add the histories to (1,1), divide by √2 and add p. The dot
with q is 1/√2, so the score is 3+1/√2≈3.707107. The general rule is

\[
h_u=p_u+|N(u)|^{-1/2}\sum_{j\in N(u)}y_j,
\qquad s_{ui}=\mu+b_u+b_i+q_i^Th_u.
\]

For N(u) empty, define the history contribution as zero; do not divide by √0.
Repeated rating records can repeat losses while a canonical unique history set
includes their item only once. Confidence-weighted repeat counts are another
rule. Surprise 1.1.5's SVD++ implementation instead iterates its occurrence
list `trainset.ur[u]` and divides by the square root of that list's length.
Duplicate triplets therefore repeat the history vectors and updates. Its
forward agrees with the canonical set interpretation when those pairs are
unique. A separate duplicate-only forward comparison makes the distinction
visible without pretending that an ordinary duplicate fit was performed.

<!-- diagram:D32 -->

For one observed event, snapshot old h, p, q and every history y. Write e=r−s.
The loss derivatives contribute −e q to p, −e h to q and −e q/√|N(u)| to each
participating y; the two bias derivatives contribute −e. With target 5 in the
worked state, e=2−1/√2. At η=.1 and λ=0, p′=(.1e,0),
q′=(1+.1e/√2,.1e/√2), y0′=(1+.1e/√2,0), and
y1′=(.1e/√2,1). All four updates use the same old q and h. Using the new q
in a history update adds terms that belong to a different, sequential algorithm.

The new scratch trainer declares a once-entity global penalty. Divide its user
penalty by that user's event count nᵤ, its item penalty by nᵢ, and each history
yⱼ penalty by tⱼ: the number of event updates whose user's history contains j.
These incidence counts are different objects. The sum of distributed penalties
then charges each active entity once. A zero-incidence parameter with a positive
prior is set to its minimizing zero state; no division by zero is invented.
Evaluate the full objective at each saved epoch's complete parameter state,
separately from rolling event errors.

The complete core program exposes history construction, counts, old-buffer
gradients, training and query operations. Its library companion uses the
declared eight unique rating pairs and reads Surprise's fitted p/q/y/bias arrays
to recompute an ordinary forward. Local penalties and initialization differ,
so different trained scores are not automatically a parity failure. A direct
event update costs O(d|N(u)|); a straightforward epoch costs
O(d Σ_events |N(user)|). Faster caching needs correct dependency/update
accounting, not an unexplained claim that the history sum is free.

### Learn item-to-item weights with a zero self route

**EASE** learns a full item-weight matrix B rather than a short factor vector.
For binary user–item input X, row x produces score row xB. A zero diagonal
prevents the model from reconstructing an observed item merely by copying that
same input coordinate to itself.

<!-- diagram:D33 -->

Take X=[[1,1,0],[0,1,1],[1,0,0]], λ=1, and first reconstruct
the I2 target column y=[0,1,0]ᵀ. Prohibit its own input coefficient B₂₂=0
before solving. The remaining input columns form
Z=[[1,1],[0,1],[1,0]], in order [I0,I1]. Let θ=(a,b)ᵀ be their two
coefficients. Minimize J(θ)=‖y−Zθ‖²+λ‖θ‖². Here the first term sums the
three users' squared reconstruction errors; the second penalizes the two
allowed weights. Differentiating gives
∇J=2(ZᵀZ+λI)θ−2Zᵀy, so setting the gradient to zero yields
[[3,1],[1,3]]θ=[0,1]ᵀ. The first row says 3a+b=0; the second says
a+3b=1. Substitute a=−b/3 to get b=3/8 and a=−1/8.

Insert the missing self coordinate as zero: B[:,2]=[−1/8,3/8,0]ᵀ.
For user row [1,1,0], I0 contributes −1/8 and I1 contributes 3/8,
so the I2 score is 1/4. The negative coefficient subtracts evidence; it is
allowed. Crossing out an output score after an unconstrained fit would not
solve this problem: the prohibited self input never entered Z.
Repeating this excluded-column ridge solve for every target constructs B.

We can compute the same constrained columns using one full Gram matrix.
Write X_j for target column j of X, B_j for column j of B, and e_j for the
item-length vector with a single 1 at position j and zeros elsewhere.
Thus X_j=Xe_j and e_jᵀB_j selects the prohibited self coefficient.
Set G=XᵀX+λI and solve GP=I; column P_j is the solution to GP_j=e_j.
For this example,
G=[[3,1,0],[1,3,1],[0,1,2]] and
P=(1/13)[[5,−2,1],[−2,6,−3],[1,−3,8]].

To see why the shortcut imposes the same constraint, introduce an auxiliary
number γ_j that balances the self-coordinate gradient. It is a constraint
multiplier, not another parameter to tune. The augmented objective is
L(B_j,γ_j)=‖X_j−XB_j‖²+λ‖B_j‖²+2γ_j(e_jᵀB_j).
Differentiating with respect to γ_j enforces e_jᵀB_j=0; differentiating
with respect to B_j gives
2GB_j−2XᵀX_j+2γ_j e_j=0. The factor 2 in the added term keeps γ_j's
convention consistent with the unhalved squared loss. Hence
GB_j=XᵀX_j−γ_j e_j=Ge_j−(λ+γ_j)e_j, and
B_j=e_j−(λ+γ_j)P_j. Its self coordinate is
0=1−(λ+γ_j)P_jj, so λ+γ_j=1/P_jj. Therefore
B_ij=−P_ij/P_jj for i≠j, with B_jj=0.

Here B=[[0,1/3,−1/8],[2/5,0,3/8],[−1/5,1/2,0]], and
[1,1,0]B=[2/5,1/3,1/4]. In the I2 column, P₂₂=8/13 gives
−(1/13)/(8/13)=−1/8 and −(−3/13)/(8/13)=3/8, exactly the excluded solve.
As a changed two-item case, X=[[1,1],[1,0]], λ=2 gives
G=[[4,1],[1,3]], P=(1/11)[[3,−1],[−1,4]] and
B=[[0,1/4],[1/3,0]]. Predicting I0 uses the remaining I1 column,
whose squared norm is 1, hence coefficient 1/(1+2)=1/3.
Predicting I1 uses I0's squared norm 2, hence 1/(2+2)=1/4.
The asymmetry already follows from these different ridge denominators.

P is symmetric, while its column-normalized B need not be. Signed item weights
are allowed. With λ>0 and all-zero X, B is zero. At λ=0 a singular Gram cannot
provide this unique solve; report that state instead of introducing a hidden
ridge epsilon or pseudoinverse. Full B requires dense I² storage and roughly
O(UI²+I³) work, so a closed-form solution is not a universal scalability or
accuracy advantage. [Steck's EASE paper, §§2–3](https://arxiv.org/pdf/1905.03375)
derives the constrained model. The complete new program checks it against an
independent excluded-column ridge solve. Short factors, confidence-weighted
targets, unique histories and full item weights share some linear algebra but
define different representations and objectives. A pairwise ranking objective
next asks a different question again: which of two items should come first?

### Complete program: Compare dense and Gram forms of the same user solve

The dense route includes every item with its target and confidence. The sparse route starts from QᵀQ, adds only confidence-minus-one outer products and the ridge, and forms b only from positive targets. Augmented least squares is a separate representation of that quadratic. The deliberately omitted-missing route supplies a counterexample, not a second valid implementation of the same objective.

<!-- program:implicitBlock filename:implicitBlock.py -->

```python
import numpy as np

items = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
counts = np.array([2.0, 0.0, 1.0])
alpha, penalty = 2.0, 1.0
target = (counts > 0).astype(float)
confidence = 1.0 + alpha * counts
normal = items.T @ (confidence[:, None] * items) + penalty * np.eye(2)
right = items.T @ (confidence * target)
dense = np.linalg.solve(normal, right)
selected = counts > 0
q = items[selected]
sparse_normal = (
    items.T @ items
    + q.T @ ((confidence[selected] - 1)[:, None] * q)
    + penalty * np.eye(2)
)
sparse_right = q.T @ confidence[selected]
cached = np.linalg.solve(sparse_normal, sparse_right)
augmented = np.vstack(
    (np.sqrt(confidence)[:, None] * items, np.sqrt(penalty) * np.eye(2))
)
augmented_target = np.r_[np.sqrt(confidence) * target, [0.0, 0.0]]
independent = np.linalg.lstsq(augmented, augmented_target, rcond=None)[0]
assert np.allclose(dense, cached) and np.allclose(dense, independent)
print("normal:", normal.tolist(), "right:", right.tolist())
print("user factors:", np.round(dense, 6).tolist())
print("all item scores:", np.round(items @ dense, 6).tolist())
observed_only = np.linalg.solve(
    q.T @ (confidence[selected, None] * q) + penalty * np.eye(2),
    q.T @ confidence[selected],
)
print("if missing terms are removed:", np.round(observed_only, 6).tolist())
empty = np.linalg.solve(items.T @ items + penalty * np.eye(2), np.zeros(2))
print("empty-user factors:", empty.tolist())
```

Recorded output for this exact original program and its original execution context:

```text
normal: [[9.0, 3.0], [3.0, 5.0]] right: [8.0, 3.0]
user factors: [0.861111, 0.083333]
all item scores: [0.861111, 0.083333, 0.944444]
if missing terms are removed: [0.851852, 0.111111]
empty-user factors: [0.0, 0.0]
```

### Complete program: Alternate all-pair count-factor solves

Each fixed-side Gram matrix is computed once and reused across that side’s entity blocks. Nonzero counts add sparse confidence corrections; the baseline includes all unstored pairs. Full objective values include both all-pair residuals and once-entity norms. The final unseen scores can be negative and do not acquire probability units from being sortable.

<!-- program:implicitFit filename:implicitFit.py -->

```python
import numpy as np

counts = np.array(
    [
        [10, 3, 0, 1, 0, 15, 0],
        [8, 0, 5, 1, 2, 0, 4],
        [0, 6, 0, 0, 9, 12, 0],
        [1, 0, 0, 20, 7, 0, 3],
        [0, 1, 14, 8, 0, 0, 6],
    ],
    dtype=float,
)


def fit_implicit(counts, rank=3, alpha=10.0, penalty=0.1, sweeps=10, seed=5):
    users, items = counts.shape
    target, confidence = (counts > 0).astype(float), 1.0 + alpha * counts
    rng = np.random.default_rng(seed)
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))

    def objective():
        return float(
            (confidence * (target - p @ q.T) ** 2).sum()
            + penalty * ((p * p).sum() + (q * q).sum())
        )

    history = [objective()]
    for _ in range(sweeps):
        for factors, other, data in ((p, q, counts), (q, p, counts.T)):
            gram = other.T @ other
            for row in range(len(factors)):
                selected = data[row] > 0
                design = other[selected]
                conf = 1.0 + alpha * data[row, selected]
                normal = (
                    gram
                    + design.T @ ((conf - 1)[:, None] * design)
                    + penalty * np.eye(rank)
                )
                factors[row] = np.linalg.solve(normal, design.T @ conf)
            history.append(objective())
    assert np.all(np.diff(history) <= 1e-7)
    return p, q, history


p, q, history = fit_implicit(counts)
print(
    "objective initially / after first sweep / finally:",
    [round(history[j], 6) for j in (0, 2, -1)],
)
unseen = np.flatnonzero(counts[0] == 0)
print(
    "unseen scores:", [(int(item), round(float(p[0] @ q[item]), 6)) for item in unseen]
)
print("Scores are unconstrained factor products, not calibrated probabilities.")
```

Recorded output for this exact original program and its original execution context:

```text
objective initially / after first sweep / finally: [1365.048941, 69.937084, 25.213882]
unseen scores: [(2, -0.024653), (4, -0.113959), (6, 0.061573)]
Scores are unconstrained factor products, not calibrated probabilities.
```

### Complete program: Build and train a canonical unique-history factor rule

`event_structure` preserves rating occurrences and separately constructs unique history sets. `representation` sums their y rows with inverse-square-root normalization. The gradient differentiates through that actual sum, reading old p/q/y and biases. `event_step` distributes the once-entity penalty using derived participation counts, then `train` measures the full global objective at complete epoch states. The guarded local main checks changed arithmetic; the companion library program owns the declared ten-epoch fit comparison.

<!-- program:recommender-history-core filename:recommender-history-core.py -->

```python
"""Complete canonical unique-history SVD++ scratch model and trainer.

Run this file for changed local arithmetic only. The companion library file
runs the one declared ten-epoch scratch fit and one ordinary SVD++ fit.
"""
import copy
import json
import math

import numpy as np


def event_structure(events, users, items):
    if users < 1 or items < 1:
        raise ValueError('positive user/item table sizes are required')
    histories = [set() for _ in range(users)]
    user_count, item_count = np.zeros(users, dtype=int), np.zeros(items, dtype=int)
    for user, item, rating in events:
        if not 0 <= user < users or not 0 <= item < items or not math.isfinite(rating):
            raise ValueError('event needs valid user/item IDs and finite rating')
        histories[user].add(item)
        user_count[user] += 1
        item_count[item] += 1
    histories = [sorted(row) for row in histories]
    history_incidence = np.zeros(items, dtype=int)
    for user, row in enumerate(histories):
        history_incidence[row] += user_count[user]
    return histories, user_count, item_count, history_incidence


def initialize(events, users, items, dimensions=2, seed=23, mean=3.):
    if not isinstance(dimensions, int) or dimensions < 1 or not math.isfinite(mean):
        raise ValueError('positive factor width and finite fixed mean required')
    histories, nu, ni, tj = event_structure(events, users, items)
    rng = np.random.default_rng(seed)
    p = rng.normal(0, .1, (users, dimensions))
    q = rng.normal(0, .1, (items, dimensions))
    y = rng.normal(0, .1, (items, dimensions))
    # Unused entity coordinates have only a global positive penalty. They start
    # at its zero minimizer rather than retaining random unvisited parameters.
    p[nu == 0], q[ni == 0], y[tj == 0] = 0., 0., 0.
    return {'P': p, 'Q': q, 'Y': y, 'bu': np.zeros(users), 'bi': np.zeros(items),
            'mean': float(mean), 'histories': histories, 'nu': nu, 'ni': ni, 'tj': tj,
            'initialization': {'seed': seed, 'normalMean': 0., 'normalSD': .1,
                               'drawOrder': ['P', 'Q', 'Y'], 'biases': 'zero'}}


def representation(state, user, occurrence_history=None):
    if not 0 <= user < len(state['P']):
        raise ValueError('known user ID required for a representation')
    history = state['histories'][user] if occurrence_history is None else list(occurrence_history)
    if any(not 0 <= item < len(state['Y']) for item in history):
        raise ValueError('history item ID is outside Y')
    contribution = (state['Y'][history].sum(axis=0)/math.sqrt(len(history))
                    if history else np.zeros(state['P'].shape[1]))
    return state['P'][user] + contribution, contribution


def predict(state, user=None, item=None):
    """Unknown entities follow the named biased fallback, never borrowed rows."""
    known_user = user is not None and 0 <= user < len(state['P'])
    known_item = item is not None and 0 <= item < len(state['Q'])
    result = state['mean']
    if known_user:
        result += state['bu'][user]
    if known_item:
        result += state['bi'][item]
    if known_user and known_item:
        result += state['Q'][item] @ representation(state, user)[0]
    return float(result)


def global_objective(state, events, penalty):
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('nonnegative finite penalty required')
    error = sum((rating-predict(state, user, item))**2 for user, item, rating in events)
    norms = sum(float(np.sum(state[name]**2)) for name in ['P', 'Q', 'Y', 'bu', 'bi'])
    return .5*error + .5*penalty*norms


def event_gradient(state, user, item, rating, penalty):
    if not math.isfinite(penalty) or penalty < 0 or not math.isfinite(rating):
        raise ValueError('finite rating/nonnegative penalty required')
    if not 0 <= user < len(state['P']) or not 0 <= item < len(state['Q']):
        raise ValueError('known participating user/item IDs required')
    history = state['histories'][user]
    if state['nu'][user] == 0 or state['ni'][item] == 0 or item not in history:
        raise ValueError('updates require a record in the declared training population')
    old_p, old_q = state['P'][user].copy(), state['Q'][item].copy()
    old_y = state['Y'][history].copy()
    h, contribution = representation(state, user)
    error = rating-predict(state, user, item)
    gp = -error*old_q + penalty/state['nu'][user]*old_p
    gq = -error*h + penalty/state['ni'][item]*old_q
    gy = np.array([-error*old_q/math.sqrt(len(history)) + penalty/state['tj'][j]*old
                   for j, old in zip(history, old_y)])
    return {'history': history, 'error': float(error), 'oldP': old_p, 'oldQ': old_q,
            'oldY': old_y, 'oldH': h, 'oldHistoryContribution': contribution,
            'P': gp, 'Q': gq, 'Y': gy,
            'bu': -error+penalty/state['nu'][user]*state['bu'][user],
            'bi': -error+penalty/state['ni'][item]*state['bi'][item]}


def event_step(state, event, penalty, rate):
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('finite nonnegative learning rate required')
    user, item, rating = event
    gradient = event_gradient(state, user, item, rating, penalty)
    # Compute every new buffer before changing any visible state.
    after_p = state['P'][user]-rate*gradient['P']
    after_q = state['Q'][item]-rate*gradient['Q']
    after_y = state['Y'][gradient['history']]-rate*gradient['Y']
    after_bu = state['bu'][user]-rate*gradient['bu']
    after_bi = state['bi'][item]-rate*gradient['bi']
    if not all(np.isfinite(value).all() for value in [after_p, after_q, after_y, after_bu, after_bi]):
        raise FloatingPointError('local step produced an unavailable nonfinite state')
    state['P'][user], state['Q'][item], state['Y'][gradient['history']] = after_p, after_q, after_y
    state['bu'][user], state['bi'][item] = after_bu, after_bi
    return gradient


def train(events, users, items, dimensions=2, seed=23, mean=3., rate=.03, penalty=.1, epochs=10):
    """One full fit; duplicates repeat loss records but not canonical history IDs."""
    if not isinstance(epochs, int) or epochs < 0:
        raise ValueError('nonnegative integer epoch count required')
    state = initialize(events, users, items, dimensions, seed, mean)
    initial = copy.deepcopy(state)
    objectives = [global_objective(state, events, penalty)]
    orders = []
    rng = np.random.default_rng(seed)
    for _ in range(epochs):
        order = rng.permutation(len(events)).tolist()
        orders.append(order)
        for position in order:
            event_step(state, events[position], penalty, rate)
        objectives.append(global_objective(state, events, penalty))
    return {'initial': initial, 'state': state, 'globalObjectives': objectives,
            'eventOrders': orders, 'epochs': epochs, 'rate': rate, 'penalty': penalty,
            'rollingLossUsedAsObjective': False}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    events = [(0, 0, 5.), (0, 1, 3.)]
    state = initialize(events, 1, 2)
    state['P'][:] = 0.
    state['Q'][:] = [[1., 0.], [0., 1.]]
    state['Y'][:] = [[1., 0.], [0., 1.]]
    before = copy.deepcopy(state)
    gradient = event_step(state, events[0], 0., .1)
    error = 2-1/math.sqrt(2)
    if not np.allclose(state['P'][0], [.1*error, 0.], rtol=0, atol=1e-14):
        raise AssertionError('changed old-buffer history step disagrees')
    # Independent scalar differentiation of each history coordinate at the old
    # event state. No optimizer or repeated training run enters this check.
    numerical = np.empty_like(before['Y'])
    epsilon = 1e-6
    for item in range(2):
        for coordinate in range(2):
            plus, minus = copy.deepcopy(before), copy.deepcopy(before)
            plus['Y'][item, coordinate] += epsilon
            minus['Y'][item, coordinate] -= epsilon
            numerical[item, coordinate] = (.5*(5-predict(plus, 0, 0))**2 - .5*(5-predict(minus, 0, 0))**2)/(2*epsilon)
    difference = float(np.max(np.abs(numerical-gradient['Y'])))
    if difference > 2e-8:
        raise AssertionError('changed local history gradient exceeds declared tolerance')
    canonical, _ = representation(before, 0)
    repeated, _ = representation(before, 0, [0, 0, 1])
    report = {'scope': 'Changed local step/finite difference/forward only, no fit',
              'before': before, 'gradient': gradient, 'after': state,
              'historyFiniteDifference': numerical, 'differenceInfinity': difference, 'epsilon': epsilon,
              'canonicalUniqueRepresentation': canonical,
              'occurrenceRepeatedRepresentation': repeated,
              'distinctHistoryRules': not np.allclose(canonical, repeated, rtol=0, atol=1e-14),
              'cost': 'local O(d*historySize); epoch O(d*sum_event historySize); full objective is evaluated on one saved state'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "oldHistoryContribution": [
    0.7071067811865475,
    0.7071067811865475
  ],
  "error": 1.2928932188134525,
  "historyGradients": [
    [
      -0.914213562373095,
      0.0
    ],
    [
      -0.914213562373095,
      0.0
    ]
  ],
  "after": {
    "P": [
      [
        0.12928932188134526,
        0.0
      ]
    ],
    "Q": [
      [
        1.0914213562373094,
        0.09142135623730951
      ],
      [
        0.0,
        1.0
      ]
    ],
    "Y": [
      [
        1.0914213562373094,
        0.0
      ],
      [
        0.09142135623730951,
        1.0
      ]
    ],
    "bu": [
      0.12928932188134526
    ],
    "bi": [
      0.12928932188134526,
      0.0
    ]
  },
  "historyFiniteDifferenceInfinity": 7.561162806979382e-11,
  "canonicalUniqueRepresentation": [
    0.7071067811865475,
    0.7071067811865475
  ],
  "occurrenceRepeatedRepresentation": [
    1.1547005383792517,
    0.5773502691896258
  ]
}
```

Each old history row receives the same first-coordinate derivative −.914214 in this state. The selected q changes both coordinates because it reads the old combined history. The finite-difference discrepancy is about 7.6e−11. Repeating one item in an occurrence history changes both the sum and its square-root divisor; it is a different representation from a unique set.


### Complete program: Solve constrained item columns by two routes

`constrained_item_weights` forms XᵀX+λI, solves for its inverse action and normalizes each off-diagonal column by its own diagonal. `excluded_column_solution` instead removes the target input column and solves ordinary ridge for that target. These routes agree on predictions while making the zero self-route explicit. `score_history` keeps binary history typed. Zero/duplicate columns and a singular λ=0 system are explicit; no hidden pseudoinverse changes the requested rule.

<!-- program:recommender-ease-contracts filename:recommender-ease-contracts.py -->

```python
"""Complete constrained item-ridge reconstruction and ordinary solve checks.

Run: python recommender-ease-contracts.py
X is a binary user-by-item matrix. No factor training or hidden ridge epsilon.
"""
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def binary_matrix(value):
    x = np.asarray(value, dtype=np.float64)
    if x.ndim != 2 or min(x.shape) < 1 or not np.isfinite(x).all():
        raise ValueError('X must be a nonempty finite user-by-item matrix')
    if not np.isin(x, [0., 1.]).all():
        raise ValueError('this EASE construction declares binary pair targets')
    return x


def constrained_item_weights(value, penalty):
    x = binary_matrix(value)
    if not math.isfinite(penalty) or penalty < 0:
        raise ValueError('penalty must be finite and nonnegative')
    items = x.shape[1]
    gram = x.T @ x + penalty*np.eye(items)
    eigenvalues = np.linalg.eigvalsh(gram)
    tolerance = 16 * np.finfo(np.float64).eps * max(1., float(np.linalg.norm(gram, 2))) * items
    if eigenvalues[0] <= tolerance:
        return {'available': False, 'reason': 'singular or numerically non-SPD full Gram',
                'G': gram, 'eigenvalues': eigenvalues, 'tolerance': tolerance}
    # All inverse column actions are required for full B. A single new-user
    # vector does not, by itself, justify forming an inverse in ordinary ridge.
    inverse_actions = np.linalg.solve(gram, np.eye(items))
    diagonal = np.diag(inverse_actions)
    if not (diagonal > 0).all():
        raise FloatingPointError('positive definite inverse lost positive diagonal')
    weights = -inverse_actions / diagonal[np.newaxis, :]
    np.fill_diagonal(weights, 0.)
    return {'available': True, 'G': gram, 'P': inverse_actions, 'B': weights,
            'predictions': x @ weights,
            'objective': float(np.sum((x-x@weights)**2)+penalty*np.sum(weights**2)),
            'inverseResidualInfinity': float(np.linalg.norm(gram@inverse_actions-np.eye(items), np.inf)),
            'eigenvalues': eigenvalues, 'tolerance': tolerance}


def excluded_column_solution(value, target, penalty):
    """Independent direct constrained solve: self coefficient never enters X."""
    x = binary_matrix(value)
    if not 0 <= target < x.shape[1] or penalty < 0 or not math.isfinite(penalty):
        raise ValueError('valid target and nonnegative finite penalty required')
    others = [item for item in range(x.shape[1]) if item != target]
    if not others:
        return {'available': True, 'column': np.zeros(1), 'others': [], 'residualInfinity': 0.}
    features = x[:, others]
    a = features.T@features + penalty*np.eye(len(others))
    b = features.T@x[:, target]
    if np.linalg.matrix_rank(a) < len(others):
        return {'available': False, 'reason': 'nonunique excluded-column problem', 'A': a, 'b': b}
    ordinary = scipy_solve(a, b, assume_a='pos')
    augmented_x = np.vstack((features, math.sqrt(penalty)*np.eye(len(others))))
    augmented_y = np.concatenate((x[:, target], np.zeros(len(others))))
    least_squares, _, rank, singular_values = np.linalg.lstsq(augmented_x, augmented_y, rcond=None)
    column = np.zeros(x.shape[1])
    column[others] = ordinary
    return {'available': True, 'others': others, 'A': a, 'b': b,
            'column': column, 'augmentedLeastSquares': least_squares,
            'augmentedRank': int(rank), 'augmentedSingularValues': singular_values,
            'solverDifferenceInfinity': float(np.max(np.abs(ordinary-least_squares))),
            'residualInfinity': float(np.linalg.norm(a@ordinary-b, np.inf))}


def score_history(history, weights):
    history = np.asarray(history, dtype=np.float64)
    weights = np.asarray(weights, dtype=np.float64)
    if history.ndim != 1 or weights.shape != (history.size, history.size):
        raise ValueError('history and actual item table shapes disagree')
    if not np.isfinite(history).all() or not np.isfinite(weights).all():
        raise ValueError('score operands must be finite')
    return history @ weights


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    x = np.array([[1., 1., 0.], [0., 1., 1.], [1., 0., 0.]])
    result = constrained_item_weights(x, 1.)
    if not result['available']:
        raise AssertionError('declared positive-penalty block is unavailable')
    columns = [excluded_column_solution(x, item, 1.) for item in range(x.shape[1])]
    independent = np.column_stack([row['column'] for row in columns])
    difference = float(np.max(np.abs(result['B']-independent)))
    if difference > 1e-13:
        raise AssertionError('constrained inverse actions and excluded-column solves disagree')
    expected = np.array([[0., 1/3, -1/8], [2/5, 0., 3/8], [-1/5, 1/2, 0.]])
    if not np.allclose(result['B'], expected, rtol=0, atol=1e-13):
        raise AssertionError('worked asymmetric weights disagree')
    zero = constrained_item_weights(np.zeros((2, 3)), 1.)
    singular = constrained_item_weights([[1., 1.], [0., 0.]], 0.)
    duplicate = constrained_item_weights([[1., 1.], [0., 0.]], 1.)
    report = {
        'X': x, 'penalty': 1., 'constrained': result,
        'independentColumns': columns, 'differenceInfinity': difference,
        'selectedHistory': x[0], 'selectedScores': score_history(x[0], result['B']),
        'asymmetryInfinity': float(np.max(np.abs(result['B']-result['B'].T))),
        'allZeroPositivePenalty': zero,
        'duplicateColumnPositivePenalty': duplicate,
        'zeroPenaltySingular': singular,
        'derivation': 'G B_j = G_j - (lambda+gamma_j)e_j; self 0 sets lambda+gamma_j=1/P_jj',
        'cost': 'Gram O(U*I^2), full factorization/actions O(I^3), dense B memory O(I^2)',
    }
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "selectedHistory": [
    1.0,
    1.0,
    0.0
  ],
  "selectedScores": [
    0.4000000000000001,
    0.3333333333333333,
    0.25
  ],
  "independentColumnDifferenceInfinity": 1.1102230246251565e-16,
  "asymmetryInfinity": 0.125,
  "zeroPenaltySingular": {
    "available": false,
    "reason": "singular or numerically non-SPD full Gram",
    "G": [
      [
        1.0,
        1.0
      ],
      [
        1.0,
        1.0
      ]
    ],
    "eigenvalues": [
      0.0,
      2.0
    ],
    "tolerance": 1.4210854715202004e-14
  }
}
```

The row scores 2/5, 1/3 and 1/4. The excluded-column solve agrees to about 1.1e−16, while B differs from its transpose by .125: a symmetric Gram does not require symmetric column-normalized prediction weights. The singular zero-penalty state supplies no unique inverse action.


## 8. Learn which of two items should come first

A rating objective asks for a numerical target; a confidence objective asks for
a weighted all-pair fit. **Bayesian Personalized Ranking**, or BPR, starts with
comparisons: for user u, a positively observed item i should score above an
unobserved comparison item j. The absence of j is an assumption used to build
training comparisons, not a discovered dislike. Its eligibility and the
sampling distribution matter as much as the scalar loss.

<!-- diagram:D34 -->

Compute the two scores and subtract. With p=(1,.5), qᵢ=(.5,1), qⱼ=(1,0),
both dots are 1, giving gap Δ=0. A sigmoid σ(Δ)=1/(1+exp(−Δ)) supplies the
model's pairwise ordering likelihood. Negative log likelihood is
−log σ(Δ)=log(1+exp(−Δ)). At gaps −2,0,2 this loss is approximately
2.126928,.693147,.126928. A larger positive gap incurs less loss; the pairwise
sigmoid is not a calibrated probability that an item will be purchased.

\[
\Delta=p_u^T(q_i-q_j),\qquad
\ell=\operatorname{logaddexp}(0,-\Delta)+
\tfrac\lambda2(\|p_u\|^2+\|q_i\|^2+\|q_j\|^2).
\]

`logaddexp` computes the logarithm of a sum of exponentials stably. Equivalently,
the first term is max(0,−Δ)+log(1+exp(−|Δ|)), whose exponential never receives
a large positive argument. Directly evaluating exp(−Δ) can overflow for a large
negative gap even when the loss itself is representable. This local penalty
uses the three participating vectors. If the score also has μ and a user bias,
those matching addends cancel between i and j. Item biases do not: their
difference must remain in the gap if that model includes them.

<!-- diagram:D35 -->

Let g=σ(−Δ). The loss derivative with respect to the gap is −g. Its three
parameter derivatives are −g(qᵢ−qⱼ)+λp, −gp+λqᵢ and +gp+λqⱼ. Thus the
positive item's data term moves toward old p, and the negative item's moves
away. For the worked Δ=0, g=.5. With λ=.1, η=.1, the simultaneous new vectors
are p′=(.965,.545), qᵢ′=(.545,1.015), qⱼ′=(.94,−.025). Their new gap is
.185625. Every derivative uses the old three vectors and old gap. A larger
step can raise the local regularized loss; zero p/q vectors can again leave the
pure dot data gradients stuck.

The complete retained `bpr` program checks the derivatives and repeats this
one selected comparison for six printed states. That is a useful local trace,
but it is not a complete recommender trainer over all users and items. A full
trainer must define which valid triples exist, how they are sampled, what
objective the sampling represents and how later lists will be assessed.

<!-- diagram:D36 -->

Take the separate positive-pair matrix [[1,0,1,0],[0,1,0,0],[1,1,0,0]].
U0 has positives I0/I2 and unobserved eligible items I1/I3, giving four triples.
U1 has positive I1 and three possible comparisons, giving three triples. U2
has positives I0/I1 and comparisons I2/I3, giving four. There are eleven valid
unique triples in all. Uniform sampling from these eleven gives user weights
4/11,3/11,4/11. Uniformly choosing an eligible user first gives weights 1/3
each, then divides their share among their valid comparisons. These optimize
differently weighted empirical populations.

The new complete scratch trainer enumerates admissible triples for this small
fixture, seeds its generator, performs the declared 200 updates, and records
the actual sampled IDs/counts and fixed-state objective. Its reported full
objective is the mean of the local regularized losses over the declared valid
triple population. Under uniform-triple sampling its stochastic data and local
penalty gradients correspond to that mean. Changing to uniform-user sampling
changes the expected population, including how often each participating
parameter receives a local penalty; do not relabel it the same once-entity
Gaussian-prior objective. Optional repeated positive occurrences define another
explicitly weighted source population rather than being silently deduplicated.

The optional `positive_occurrences` input makes the weighting concrete. Each
record has a unique occurrence ID plus user and positive-item IDs; two records
may name the same positive pair. The binary matrix still defines the complete
positive history, so hiding an observed item through eligibility cannot turn
it into an unobserved negative. `eligible_items` declares either a catalogue
vector or a per-user mask and applies to both compared items.

In the eleven-triple fixture, add a second occurrence of U0/I0 with its own ID.
It supplies two more routes, to I1 and I3. The population now has thirteen
occurrence–negative pairs and uniform-pair user masses 6/13, 3/13 and 4/13.
Uniform eligible-user sampling instead keeps each user at 1/3. If I3 is
ineligible for everyone, seven of those thirteen occurrence routes remain.
The source exposes both the numeric triple and its positive-occurrence ID;
the two equal numeric U0/I0 routes are not silently merged. These are
population calculations; no extra fitted outcome is attached to this variation.

A user who observed every eligible item has no admissible j and contributes no
valid triple. If none exists anywhere, the trainer is unavailable rather than
looping forever to sample an impossible negative. Enumerating all pairs costs
O(U I²) in the worst case and suits the small teaching fixture. A larger sampler
can choose from valid lists without enumerating every triple, but must expose
its conditioning weights and support. Popularity-weighted or hard-negative
sampling changes that support and objective; it is not automatically a better
approximation to uniform comparisons or to NDCG.

The ordinary implicit 0.7.3 BPR companion uses the same binary CSR but a different
sampler. It draws stored positive indices, so its negative-item distribution is
the global frequency [2,2,1,0]/5. I3 has zero negative support even though it is
an eligible comparison in the scratch population. A drawn item already known
to that user is skipped, without guaranteed replacement. Forty epochs on five
nonzeros attempt 200 updates, with fewer accepted updates when such skips occur.
The implementation ignores nonzero magnitudes and includes an additional
learned item-bias coordinate with the corresponding user coordinate fixed at 1.
Its callback's sampled training statistic is not held-out full-catalogue AUC.
These contracts explain why equal parameter names or an equal attempted-update
count do not promise matching fits. [Rendle et al., §§3–4](https://arxiv.org/pdf/1205.2618)
derive BPR; [the versioned package implementation](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/bpr.pyx)
defines this ordinary route. Evaluate the resulting list under its actual
eligibility boundary, not merely its training gap.

### Complete program: Open one sampled pair update

The stable softplus loss reads the user, positive and sampled item together. Finite differences verify derivative signs; the update keeps old values until all three new vectors are available. Repetition of this one pair demonstrates its local gap/loss change. The next program supplies the missing complete triple population and sampler.

<!-- program:bpr filename:bpr.py -->

```python
import numpy as np


def pair_loss(state, penalty):
    user, positive, negative = state.reshape(3, 2)
    gap = user @ (positive - negative)
    return float(np.logaddexp(0.0, -gap) + 0.5 * penalty * (state @ state))


def pair_gradient(state, penalty):
    user, positive, negative = state.reshape(3, 2)
    gap = user @ (positive - negative)
    signal = np.exp(-np.logaddexp(0.0, gap))
    return np.r_[
        -signal * (positive - negative) + penalty * user,
        -signal * user + penalty * positive,
        signal * user + penalty * negative,
    ]


state, penalty, rate = np.array([1.0, 0.5, 0.5, 1.0, 1.0, 0.0]), 0.1, 0.1
step = 1e-6
numeric = np.array(
    [
        (
            pair_loss(state + step * row, penalty)
            - pair_loss(state - step * row, penalty)
        )
        / (2 * step)
        for row in np.eye(6)
    ]
)
assert np.allclose(numeric, pair_gradient(state, penalty), atol=1e-8)
for iteration in range(6):
    user, positive, negative = state.reshape(3, 2)
    print(
        f"step={iteration}: gap={user@(positive-negative):.6f}, local loss={pair_loss(state, penalty):.6f}"
    )
    state -= rate * pair_gradient(state, penalty)
# This repeated pair illustrates its objective; a recommender samples many valid triples.
```

Recorded output for this exact original program and its original execution context:

```text
step=0: gap=0.000000, local loss=0.868147
step=1: gap=0.185625, local loss=0.776622
step=2: gap=0.348631, local loss=0.704560
step=3: gap=0.494534, local loss=0.646533
step=4: gap=0.626967, local loss=0.598992
step=5: gap=0.748388, local loss=0.559519
```

### Complete program: Train a complete declared pair population

`valid_triples` enumerates the unique-pair default. `occurrence_population` retains repeated positive record IDs and filters both items through the declared eligibility before forming comparisons. `sampler_distribution` distinguishes uniform triples from uniform eligible users or an explicitly counted occurrence population. `old_buffer_step` applies the stable local gradient; `train` uses the seeded samples and evaluates the complete declared objective. The ordinary BPR fit uses a global-frequency negative draw and a learned item-bias coordinate; its accepted/skipped attempt statistics and zero-frequency item support explain why this is a correspondence comparison rather than numerical equality.

<!-- program:recommender-bpr-training filename:recommender-bpr-training.py -->

```python
"""Complete small BPR sampler/trainer and ordinary sampler correspondence.

Run: python recommender-bpr-training.py
Requires NumPy, SciPy and implicit 0.7.3. The guarded main executes the one
declared 200-update scratch construction and one 40-epoch ordinary construction.
"""
import json
import math

import implicit
import numpy as np
from scipy.sparse import csr_matrix


def binary_matrix(value):
    matrix = np.asarray(value, dtype=np.float64)
    if matrix.ndim != 2 or min(matrix.shape) < 1 or not np.isfinite(matrix).all():
        raise ValueError('finite user-by-item binary matrix required')
    if not np.isin(matrix, [0., 1.]).all():
        raise ValueError('the default construction declares unique positive pairs')
    return matrix


def valid_triples(value):
    matrix = binary_matrix(value)
    return [(user, int(positive), int(negative))
            for user, row in enumerate(matrix)
            for positive in np.flatnonzero(row)
            for negative in np.flatnonzero(row == 0)]


def occurrence_population(value, positive_occurrences=None, eligible_items=None):
    """Retain record identities and declare the eligible comparison population.

    Repeated (user,item) records are permitted, but occurrence IDs are unique.
    Eligibility applies to both compared items. An unobserved negative must
    remain absent from the user's full binary positive history, even when an
    observed item is currently ineligible. This is an explicit population
    choice; it does not change the user's positive history to create negatives.
    """
    matrix = binary_matrix(value)
    if eligible_items is None:
        eligible = np.ones_like(matrix, dtype=bool)
    else:
        raw_eligible = np.asarray(eligible_items)
        if raw_eligible.shape == (matrix.shape[1],):
            raw_eligible = np.broadcast_to(raw_eligible, matrix.shape)
        if raw_eligible.shape != matrix.shape or not np.isin(raw_eligible, [0, 1]).all():
            raise ValueError('binary item eligibility vector or user-by-item mask required')
        eligible = raw_eligible.astype(bool)
    occurrences = ([{'id': f'positive-{user}-{item}', 'user': user, 'item': int(item)}
                    for user, row in enumerate(matrix) for item in np.flatnonzero(row)]
                   if positive_occurrences is None else list(positive_occurrences))
    seen_ids, triples, records, skipped = set(), [], [], []
    for occurrence in occurrences:
        if not isinstance(occurrence, dict) or set(occurrence) != {'id', 'user', 'item'}:
            raise ValueError('each positive occurrence needs exactly id/user/item')
        identity, user, item = occurrence['id'], occurrence['user'], occurrence['item']
        if not isinstance(identity, str) or not identity or identity in seen_ids:
            raise ValueError('positive occurrence IDs must be nonempty and unique')
        if not isinstance(user, int) or not isinstance(item, int) or not (
                0 <= user < matrix.shape[0] and 0 <= item < matrix.shape[1]) or matrix[user, item] != 1:
            raise ValueError('each occurrence must reference an actual positive pair')
        seen_ids.add(identity)
        if not eligible[user, item]:
            skipped.append({'id': identity, 'reason': 'positive item is outside declared eligibility'})
            continue
        negatives = np.flatnonzero(eligible[user] & (matrix[user] == 0))
        if not negatives.size:
            skipped.append({'id': identity, 'reason': 'no eligible unobserved negative'})
        for negative in negatives:
            triples.append((user, item, int(negative)))
            records.append({'positiveOccurrenceID': identity, 'user': user,
                            'positive': item, 'negative': int(negative)})
    return {'triples': triples, 'records': records, 'positiveOccurrences': occurrences,
            'skippedOccurrences': skipped, 'eligibleItems': eligible,
            'unit': 'positive occurrence times an eligible unobserved item'}


def sampler_distribution(triples, convention='uniform-triple'):
    if not triples:
        return {'available': False, 'reason': 'no user has both a positive and an admissible negative'}
    if convention not in ('uniform-triple', 'uniform-user'):
        raise ValueError('declare uniform-triple or uniform-user population')
    users = sorted({row[0] for row in triples})
    incidence = {user: sum(row[0] == user for row in triples) for user in users}
    probabilities = ([1/len(triples)]*len(triples) if convention == 'uniform-triple'
                     else [1/(len(users)*incidence[row[0]]) for row in triples])
    return {'available': True, 'convention': convention, 'eligibleUsers': users,
            'tripleIncidence': incidence, 'tripleProbabilities': probabilities,
            'userProbabilities': {user: sum(p for row, p in zip(triples, probabilities) if row[0] == user) for user in users}}


def stable_signal(gap):
    if not math.isfinite(gap):
        raise ValueError('finite score gap required')
    if gap >= 0:
        small = math.exp(-gap)
        return small/(1+small)
    return 1/(1+math.exp(gap))


def local_objective(p, positive, negative, penalty):
    p, positive, negative = [np.asarray(vector, dtype=np.float64) for vector in [p, positive, negative]]
    if p.ndim != 1 or p.shape != positive.shape or p.shape != negative.shape or not p.size:
        raise ValueError('three equal positive-width vectors required')
    if not all(np.isfinite(vector).all() for vector in [p, positive, negative]) or penalty < 0 or not math.isfinite(penalty):
        raise ValueError('finite vectors and nonnegative finite penalty required')
    gap = float(p@(positive-negative))
    norm = float(p@p+positive@positive+negative@negative)
    return float(np.logaddexp(0., -gap)+.5*penalty*norm)


def old_buffer_step(p, positive, negative, penalty, rate):
    old = [np.asarray(vector, dtype=np.float64).copy() for vector in [p, positive, negative]]
    before = local_objective(*old, penalty)
    if not math.isfinite(rate) or rate < 0:
        raise ValueError('finite nonnegative rate required')
    p, positive, negative = old
    gap = float(p@(positive-negative))
    signal = stable_signal(gap)
    gradients = [-signal*(positive-negative)+penalty*p,
                 -signal*p+penalty*positive, signal*p+penalty*negative]
    after = [vector-rate*gradient for vector, gradient in zip(old, gradients)]
    if not all(np.isfinite(vector).all() for vector in after):
        raise FloatingPointError('step produced an unavailable nonfinite state')
    return after, {'old': old, 'gap': gap, 'signal': signal, 'gradients': gradients,
                   'beforeLoss': before, 'afterLoss': local_objective(*after, penalty)}


def population_objective(p, q, triples, penalty, probabilities=None):
    if not triples:
        return None
    probabilities = [1/len(triples)]*len(triples) if probabilities is None else list(probabilities)
    if len(probabilities) != len(triples) or any(weight < 0 for weight in probabilities) or abs(sum(probabilities)-1) > 1e-12:
        raise ValueError('one nonnegative probability per triple summing to 1 required')
    return sum(weight*local_objective(p[u], q[i], q[j], penalty)
               for (u, i, j), weight in zip(triples, probabilities))


def train(value, dimensions=2, seed=29, rate=.05, penalty=.01, updates=200,
          convention='uniform-triple', positive_occurrences=None, eligible_items=None):
    matrix = binary_matrix(value)
    population = occurrence_population(matrix, positive_occurrences, eligible_items)
    triples = population['triples']
    distribution = sampler_distribution(triples, convention)
    if not distribution['available']:
        return {**distribution, 'population': population}
    if not isinstance(dimensions, int) or dimensions < 1 or not isinstance(updates, int) or updates < 0:
        raise ValueError('positive factor width/nonnegative integer update count required')
    rng = np.random.default_rng(seed)
    p = rng.normal(0., .1, (matrix.shape[0], dimensions))
    q = rng.normal(0., .1, (matrix.shape[1], dimensions))
    initial_p, initial_q = p.copy(), q.copy()
    weights = distribution['tripleProbabilities']
    objectives = [population_objective(p, q, triples, penalty, weights)]
    sample_indices, sample_counts = [], np.zeros(len(triples), dtype=int)
    for _ in range(updates):
        index = int(rng.choice(len(triples), p=weights))
        user, positive, negative = triples[index]
        after, _ = old_buffer_step(p[user], q[positive], q[negative], penalty, rate)
        p[user], q[positive], q[negative] = after
        sample_indices.append(index)
        sample_counts[index] += 1
        objectives.append(population_objective(p, q, triples, penalty, weights))
    return {'available': True, 'P': p, 'Q': q, 'initialP': initial_p, 'initialQ': initial_q,
            'seed': seed, 'normalSD': .1, 'updates': updates, 'rate': rate, 'penalty': penalty,
            'distribution': distribution, 'triples': triples, 'sampleIndices': sample_indices,
            'sampleCounts': sample_counts, 'populationObjectives': objectives,
            'population': population,
            'allScores': p@q.T,
            'finalGaps': [float(p[u]@(q[i]-q[j])) for u, i, j in triples],
            'objectiveUnit': 'mean of the named local regularized loss over this triple population; not once-entity global regularization'}


def ordinary_comparison(value):
    from implicit.cpu.bpr import BayesianPersonalizedRanking
    if implicit.__version__ != '0.7.3':
        raise RuntimeError('this constructed comparison locks implicit 0.7.3')
    matrix = binary_matrix(value)
    sparse = csr_matrix(matrix.astype(np.float32))
    callbacks = []

    def callback(epoch, elapsed, correct, skipped):
        attempts = sparse.nnz
        accepted = attempts-int(skipped)
        callbacks.append({'epoch': int(epoch), 'elapsedSeconds': float(elapsed),
                          'attempts': attempts, 'accepted': accepted, 'skipped': int(skipped),
                          'correctSampledComparisons': int(correct),
                          'sampledTrainingStatistic': int(correct)/accepted if accepted else None})

    model = BayesianPersonalizedRanking(factors=2, iterations=40, learning_rate=.05,
                                       regularization=.01, dtype=np.float64, num_threads=1,
                                       random_state=29, verify_negative_samples=True)
    model.fit(sparse, show_progress=False, callback=callback)
    frequencies = np.bincount(sparse.indices, minlength=matrix.shape[1])
    if model.user_factors.shape != (matrix.shape[0], 3) or model.item_factors.shape != (matrix.shape[1], 3):
        raise AssertionError('ordinary factor arrays must include the extra bias coordinate')
    if not np.all(model.user_factors[:, -1] == 1.):
        raise AssertionError('ordinary user bias coordinate must remain the fixed 1')
    return {'version': implicit.__version__, 'PIncludingFixed1': model.user_factors,
            'QIncludingItemBias': model.item_factors,
            'allScores': model.user_factors@model.item_factors.T,
            'positiveItemFrequencies': frequencies,
            'negativeItemProbabilities': frequencies/sparse.nnz,
            'callbacks': callbacks, 'totalAttempts': sum(row['attempts'] for row in callbacks),
            'totalAccepted': sum(row['accepted'] for row in callbacks),
            'totalSkipped': sum(row['skipped'] for row in callbacks),
            'limits': 'Global positive-index negative sampler, seen-negative skips, ignored input magnitudes and additional item bias differ from scratch full-support triples; no fitted-score equality is asserted.'}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    matrix = [[1, 0, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]
    triples = valid_triples(matrix)
    if len(triples) != 11 or len(set(triples)) != 11:
        raise AssertionError('declared unique-pair population must contain 11 triples')
    scratch = train(matrix)
    report = {'binaryPairs': matrix, 'scratchConstructedFits': 1, 'scratch': scratch,
              'uniformUserAlternativePopulation': sampler_distribution(triples, 'uniform-user'),
              'noAdmissibleTriple': sampler_distribution(valid_triples([[1, 1], [0, 0]])),
              'ordinaryConstructedFits': 1, 'ordinary': ordinary_comparison(matrix),
              'stableExtremeLosses': [local_objective([1.], [gap], [0.], 0.) for gap in [-1000., 0., 1000.]],
              'cost': 'small enumerator O(U*I^2); local update O(d); full diagnostic objective O(triples*d)',
              'evaluationLimit': 'These gaps/objectives are training diagnostics; no held-out NDCG or purchase probability is inferred.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "triples": [
    [
      0,
      0,
      1
    ],
    [
      0,
      0,
      3
    ],
    [
      0,
      2,
      1
    ],
    [
      0,
      2,
      3
    ],
    [
      1,
      1,
      0
    ],
    [
      1,
      1,
      2
    ],
    [
      1,
      1,
      3
    ],
    [
      2,
      0,
      2
    ],
    [
      2,
      0,
      3
    ],
    [
      2,
      1,
      2
    ],
    [
      2,
      1,
      3
    ]
  ],
  "sampleCounts": [
    14,
    14,
    27,
    21,
    12,
    22,
    27,
    18,
    14,
    12,
    19
  ],
  "firstPopulationObjective": 0.6943267592154573,
  "lastPopulationObjective": 0.6100870819939309,
  "finalGaps": [
    0.08420989404310025,
    0.07037677150510291,
    0.09602739144039685,
    0.08219426890239954,
    0.10128167594462627,
    0.2546769741460056,
    0.29305090680455376,
    0.17046676760342588,
    0.2582913442573955,
    0.2424793094149493,
    0.330303886068919
  ],
  "ordinaryNegativeItemProbabilities": [
    0.4,
    0.4,
    0.2,
    0.0
  ],
  "ordinaryTotalAttempts": 200,
  "ordinaryTotalAccepted": 77,
  "ordinaryTotalSkipped": 123,
  "stableExtremeLosses": [
    1000.0,
    0.6931471805599453,
    0.0
  ]
}
```

The scratch mean population objective moves from about .694327 to .610087 after 200 updates. All eleven final training gaps are positive in this run; that does not supply held-out list performance. The ordinary trainer accepts 77 of its 200 attempts and skips 123, and I3 has zero negative-draw support. Its extra learned item bias and sampler make its fit a different computation. The extreme losses remain finite even at gaps −1000 and +1000.


## 9. Evaluate the whole recommendation list

A score becomes a decision only after eligibility, ranking and a requested
number of slots are specified. A ranker cannot recover an item the candidate
generator omitted. Define which future positive events or reviewed grades count
as truth before selecting settings; an unobserved candidate is not necessarily
a verified irrelevant item.

<!-- diagram:D37 -->

Take the ranked unique item list [I2,I0,I4,I1,I3], binary relevant truth
{I0,I1}, and requested cutoff K=3. Its issued list is [I2,I0,I4]. Only I0 is a
hit, at rank 2. Filter hard ineligibility before top K, retaining item IDs
through each operation. A duplicate ID would not be another independent hit
or another slot's useful discovery, so reject duplicates and out-of-universe
IDs instead of correcting their counts afterward.

<!-- diagram:D38 -->

**Precision@K** is hits divided by requested slots: 1/3. **Recall@K** is hits
divided by eligible relevant truth: 1/2. **Reciprocal rank** uses the first hit's
one-based position: 1/2. **Average precision@K** adds precision at each hit
position and divides by min(K,R), where R is eligible relevant count. Here the
only hit contributes 1/2 and the denominator is 2, giving AP=.25. These are
declared cutoff/denominator conventions; some libraries use different AP or
no-relevance rules.

For graded truth gᵢ, **discounted cumulative gain** gives an item gain 2^{gᵢ}−1
and divides it by log₂(rank+1). The first slot has divisor 1, the second log₂3.
The worked binary list has DCG=1/log₂3. Its ideal eligible list puts both
relevant items first, with ideal gain 1+1/log₂3. **NDCG** is their ratio,
approximately .386853. The ideal belongs to the entire eligible truth, not
only the candidates retrieved by a faulty earlier stage.

If the issued list has fewer than K items, fixed-slot precision still divides
by K; **fill rate** is issued count/K. With no eligible relevant truth, recall,
AP, RR and NDCG are undefined under our convention. Precision and fill still
describe the issued slots. Do not convert an undefined relevance metric into
a fabricated zero observation. The complete retained `ranking` program handles
these cases, a graded example and a candidate subset with explicit unique-ID
checks and full expected output.

<!-- diagram:D39 -->

Now remove I0 before ranking while leaving truth {I0,I1}. Even a perfect
remaining ranker can retrieve at most one of the two relevant items. Its recall
ceiling is min(K, retrieved relevant count)/R=1/2 for K≥1. That ceiling is a
property of the declared candidate set and truth, not a guarantee of achieving
it. If no eligible truth exists, the ceiling is undefined. Including all known
positives and sampling only a few other candidates creates an easier, different
assessment distribution; the missing exposure/relevance of those sampled
“negatives” is not repaired by their label in a benchmark script.

### Compare requests and uncertainty using the right unit

<!-- diagram:D40 -->

Suppose four user requests have paired method-minus-baseline metric differences
[.2,−.1,.3,0]. Their mean difference is .1. If a bootstrap sample takes user
rows [U0,U0,U2,U3], the resampled mean is (.2+.2+.3+0)/4=.175. Repeat the
entire paired row, so both methods remain attached to that user's same truth
and request. Treating individual recommended items as independent evidence
would change the data unit and usually understate dependence.

Report metric support and aggregation separately. An average over requests with
eligible truth does not cover all requests; a catalogue-coverage count does
not become recall; RMSE on observed ratings does not rank a list. Novelty,
diversity and cost can matter, but require their own definitions and evidence.
The real-data report later uses a declared paired-user bootstrap on fixed
saved per-user outcomes, without refitting models. Its intervals remain
conditional on that train-selected cohort, period and workflow, and do not
erase temporal or intercustomer dependence. With no valid paired rows, no
mean difference or interval can be estimated.

Predict how changing a list, K, truth grade or candidate set changes each
denominator before computing. These definitions make ordinary library scores
and saved model states meaningful only when their input identities and output
conventions match the problem we actually asked.

### Complete program: Keep the candidate population and ideal denominator visible

Validate unique item IDs, filter eligibility and retain the declared truth before taking the first K results. Cumulative hit precision contributes to AP, and logarithmic discounts contribute to DCG. The ideal and candidate ceiling depend on eligible truth, not only the retrieved hits. Zero qualifying truth returns undefined relevance metrics while precision and fill remain defined for positive K.

<!-- program:ranking filename:ranking.py -->

```python
import math


def metrics(order, grades, cutoff, eligible=None):
    eligible = set(range(len(grades))) if eligible is None else set(eligible)
    if cutoff < 1 or len(set(order)) != len(order) or not set(order) <= eligible:
        raise ValueError("Use a positive cutoff and unique eligible items.")
    relevant = {item for item in eligible if grades[item] > 0}
    selected = order[:cutoff]
    hits, precision_sum, reciprocal = 0, 0.0, 0.0
    dcg = 0.0
    for rank, item in enumerate(selected, 1):
        dcg += (2 ** grades[item] - 1) / math.log2(rank + 1)
        if item in relevant:
            hits += 1
            precision_sum += hits / rank
            reciprocal = reciprocal or 1 / rank
    ideal = sum(
        (2**grade - 1) / math.log2(rank + 1)
        for rank, grade in enumerate(
            sorted((grades[item] for item in eligible), reverse=True)[:cutoff], 1
        )
    )
    return dict(
        precision=hits / cutoff,
        recall=hits / len(relevant) if relevant else None,
        ndcg=dcg / ideal if ideal else None,
        reciprocal_rank=reciprocal if relevant else None,
        average_precision=(
            precision_sum / min(cutoff, len(relevant)) if relevant else None
        ),
        fill_rate=len(selected) / cutoff,
        candidate_recall_ceiling=(
            min(cutoff, len(set(order) & relevant)) / len(relevant)
            if relevant
            else None
        ),
    )


for order, grades, cutoff in [
    ([2, 0, 4, 1, 3], [1, 1, 0, 0, 0], 3),
    ([2, 0, 4], [1, 1, 0, 0, 0], 3),
    ([0, 1], [0, 0, 0], 3),
    ([2, 0, 1], [2, 1, 3], 2),
]:
    result = metrics(order, grades, cutoff)
    print(
        "order",
        order,
        "K",
        cutoff,
        {
            key: round(value, 6) if value is not None else None
            for key, value in result.items()
        },
    )
```

Recorded output for this exact original program and its original execution context:

```text
order [2, 0, 4, 1, 3] K 3 {'precision': 0.333333, 'recall': 0.5, 'ndcg': 0.386853, 'reciprocal_rank': 0.5, 'average_precision': 0.25, 'fill_rate': 1.0, 'candidate_recall_ceiling': 1.0}
order [2, 0, 4] K 3 {'precision': 0.333333, 'recall': 0.5, 'ndcg': 0.386853, 'reciprocal_rank': 0.5, 'average_precision': 0.25, 'fill_rate': 1.0, 'candidate_recall_ceiling': 0.5}
order [0, 1] K 3 {'precision': 0.0, 'recall': None, 'ndcg': None, 'reciprocal_rank': None, 'average_precision': None, 'fill_rate': 0.666667, 'candidate_recall_ceiling': None}
order [2, 0, 1] K 2 {'precision': 1.0, 'recall': 0.666667, 'ndcg': 1.0, 'reciprocal_rank': 1.0, 'average_precision': 1.0, 'fill_rate': 1.0, 'candidate_recall_ceiling': 0.666667}
```

## 10. Use current libraries without changing the problem accidentally

An ordinary tool implements a model, not the meaning of your data. Name raw
identities, matrix axes, target units, penalty and query convention before a
fit. Retain a complete program's imports and dependencies rather than treating
the visible `fit` call as a self-contained algorithm.

<!-- diagram:D41 -->

Surprise accepts explicit-rating triplets (raw user ID, raw item ID, rating),
with a declared rating range. Its training set creates internal ID maps. The
string "0" is a raw identity, not automatically the same object as an internal
row index 0. Map the requested identity before selecting the saved p/q/bias
rows. For a known biased SVD pair, its raw score is μ+bᵤ+bᵢ+pᵤᵀqᵢ. A default
prediction may clip to the declared rating scale; use `clip=False` when
inspecting that raw formula, and state clipping when evaluating a clipped rule.

For an unknown user and known item, the ordinary biased route retains μ and
the known item bias but lacks a user bias/factor. Both unknown returns the
training mean. This is a fallback convention, not learned personalization for
an unseen identity. The retained `surpriseLibrary` program fits the original
explicit matrix under Surprise 1.1.5 and prints these actual raw-ID cases,
including both-unknown mean 3.1. Its local penalties and initialization are not
claimed identical to the earlier scratch trainer, and its full-matrix fitting
is API inspection rather than held-out performance.

The new SVD++ library companion additionally exposes actual fitted p/q/y
arrays, biases and identity maps. Its eight-pair fixture has mean 3 and a
history contribution; its forward must use that h rather than quietly applying
the old pure-SVD formula. Saved states and raw-ID queries belong to their named
model and fixture. The older program's recorded outputs remain observations of
that older fit, not numbers recomputed from the new history model.

<!-- diagram:D42 -->

For implicit ALS, the matrix is users×items. A CSR row has an `indptr` slice,
item-column `indices` and confidence `data` at those indices. These are storage
coordinates, not raw item names. Supply positive data already equal to 1+αcount
and package alpha 1 under our declared convention. An accidental transpose
swaps entity roles even if a small square fixture hides the shape mistake.
Filter already liked items according to the task and request, rather than
assuming an API's default filter is appropriate for repeat recommendations.

The final item update in a user-then-item training sweep changes Q after it
solved P. **Stored training P** therefore contains users solved against the
previous Q. For a current request, **recalculated user factors** solve the
known history against final Q. They are a separate inference object, not a new
training sweep and not a replacement for the stored training record.

See the difference in a constructed two-coordinate witness. Confidence is
[3,1,1], target [1,0,0], λ=1. Old item rows [(1,0),(1,0),(0,1)] give stored
p=(.6,0). Final rows [(0,1),(0,1),(1,0)] instead give request p=(0,.6).
Using stored p with final Q scores eligible I1/I2 as [0,.6]; solving against
final Q scores them [.6,0]. The ordering reverses. Both calculations are
well-defined, but they are different rules. A query must preserve the convention
used by its validation and later assessment.

The complete retained `implicitLibrary` program calls `recalculate_user`,
compares it with the declared dense normal equations and requests filtered
recommendations with recalculation enabled. Its recorded unseen scores are
I4:1.069473, I6:.255863, I2:.151264—again not probability values. Its shape is
five user rows by three factors and seven item rows by three factors. Later
Retail state has different identities/shapes and its own measured arrays.
The new real-data method consistently uses final-Q fixed-history recalculation
for all four validation fits, the chosen prefix refit, ordinary comparison and
saved request. The training P/Q/objective records remain separate.

The ordinary source version fixes these behaviors. [Surprise 1.1.5's matrix-factorization contracts](https://surprise.readthedocs.io/en/stable/matrix_factorization.html)
and [implicit 0.7.3's ALS implementation](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py)
support the routes explained here; a future package version may change details.
Save complete learned state, mappings, source/configuration and package version,
not a filename saying “MF” with no way to identify its actual rule.

### Complete program: Use the library’s explicit-rating rule deliberately

Raw triplets enter `Dataset` and become inner user/item IDs in its trainset. The configured SVD model learns a biased rating score using its own initialization and record penalties. `predict(..., clip=False)` exposes the raw model score; default clipping is a separate output rule. Unknown identities invoke the library’s declared fallback rather than a fabricated learned row.

<!-- program:surpriseLibrary filename:surpriseLibrary.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)

import pandas as pd
import surprise
from surprise import Dataset, Reader, SVD

records = [
    (str(user), str(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
frame = pd.DataFrame(records, columns=["user", "item", "rating"])
train = Dataset.load_from_df(frame, Reader(rating_scale=(1, 5))).build_full_trainset()
model = SVD(n_factors=2, n_epochs=160, lr_all=0.02, reg_all=0.1, random_state=7)
model.fit(train)
print("Surprise version:", surprise.__version__)
for item in (2, 4, 6):
    prediction = model.predict("0", str(item), clip=False)
    print(f"user 0, item {item}: {prediction.est:.6f}")
print(f"unknown user, known item 0: {model.predict('new', '0', clip=False).est:.6f}")
print(f"both unknown: {model.predict('new', 'new', clip=False).est:.6f}")
assert np.isclose(model.predict("new", "new", clip=False).est, train.global_mean)
print("This fits the full toy matrix for API inspection; it is not a test evaluation.")
```

Recorded output for this exact original program and its original execution context:

```text
Surprise version: 1.1.5
user 0, item 2: 4.381337
user 0, item 4: 2.511042
user 0, item 6: 3.705655
unknown user, known item 0: 3.240102
both unknown: 3.100000
This fits the full toy matrix for API inspection; it is not a test evaluation.
```

### Complete program: Compare a complete history trainer with SVD++

`load_core` loads the local dependency without running its main. The eight unique rating pairs are passed once through the scratch ten-epoch trainer and once through the configured Surprise SVDpp fit. `ordinary_forward` reconstructs the library’s score from its actual raw-to-inner IDs, biases, pu/qi and occurrence-list yj history. Unknown identities and a duplicate-only forward expose the boundary. Different initialization and penalties mean different fitted scores are expected; equal shapes alone are not parity.

<!-- program:recommender-history-library filename:recommender-history-library.py -->

```python
"""One new scratch/ordinary SVD++ construction, with full saved parameters.

Run: python recommender-history-library.py
Place recommender-history-core.py beside this file. Requires NumPy, pandas,
scikit-surprise 1.1.5. The imported core's guarded main does not execute.
"""
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import surprise
from surprise import Dataset, Reader, SVDpp


def load_core():
    path = Path(__file__).with_name('recommender-history-core.py')
    specification = importlib.util.spec_from_file_location('recommender_history_core', path)
    if specification is None or specification.loader is None:
        raise ImportError('cannot load the complete sibling history core')
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


def ordinary_forward(model, train, raw_user, raw_item):
    try:
        user = train.to_inner_uid(raw_user)
    except ValueError:
        user = None
    try:
        item = train.to_inner_iid(raw_item)
    except ValueError:
        item = None
    result = float(train.global_mean)
    if user is not None:
        result += float(model.bu[user])
    if item is not None:
        result += float(model.bi[item])
    occurrences = [pair[0] for pair in train.ur[user]] if user is not None else []
    history = (model.yj[occurrences].sum(axis=0)/math.sqrt(len(occurrences))
               if occurrences else np.zeros(model.n_factors))
    if user is not None and item is not None:
        result += float(model.qi[item] @ (model.pu[user]+history))
    prediction = model.predict(raw_user, raw_item, clip=False)
    return {'rawUser': raw_user, 'rawItem': raw_item, 'innerUser': user, 'innerItem': item,
            'historyOccurrences': occurrences, 'historyVector': history,
            'manual': result, 'ordinary': prediction.est,
            'absoluteDifference': abs(result-prediction.est), 'details': prediction.details}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    if surprise.__version__ != '1.1.5':
        raise RuntimeError('this complete example locks scikit-surprise 1.1.5')
    core = load_core()
    events = [(0, 0, 4.), (0, 1, 2.), (1, 1, 5.), (1, 2, 1.),
              (2, 0, 2.), (2, 2, 4.), (2, 3, 3.), (0, 2, 3.)]
    scratch = core.train(events, 3, 4, dimensions=2, seed=23, mean=3., rate=.03, penalty=.1, epochs=10)
    table = pd.DataFrame([(f'U{u}', f'I{i}', rating) for u, i, rating in events],
                         columns=['user', 'item', 'rating'])
    train = Dataset.load_from_df(table, Reader(rating_scale=(1, 5))).build_full_trainset()
    model = SVDpp(n_factors=2, n_epochs=10, lr_all=.03, reg_all=.1, random_state=23)
    model.fit(train)
    forwards = [ordinary_forward(model, train, f'U{u}', f'I{i}') for u in range(3) for i in range(4)]
    forwards += [ordinary_forward(model, train, 'new-user', 'I0'),
                 ordinary_forward(model, train, 'U0', 'new-item'),
                 ordinary_forward(model, train, 'new-user', 'new-item')]
    if max(row['absoluteDifference'] for row in forwards) > 1e-12:
        raise AssertionError('actual saved-array ordinary forward exceeds declared tolerance')
    user = train.to_inner_uid('U0')
    history = [pair[0] for pair in train.ur[user]]
    canonical_history = sorted(set(history))
    duplicate_history = history+[history[0]]
    unique_vector = model.yj[canonical_history].sum(axis=0)/math.sqrt(len(canonical_history))
    duplicate_vector = model.yj[duplicate_history].sum(axis=0)/math.sqrt(len(duplicate_history))
    report = {'sourceEventOrder': events, 'constructedFits': {'scratch': 1, 'ordinarySVDpp': 1},
              'scratch': scratch,
              'scratchAllScores': [[core.predict(scratch['state'], u, i) for i in range(4)] for u in range(3)],
              'ordinaryVersion': surprise.__version__, 'ordinaryGlobalMean': float(train.global_mean),
              'ordinaryP': model.pu, 'ordinaryQ': model.qi, 'ordinaryY': model.yj,
              'ordinaryUserBias': model.bu, 'ordinaryItemBias': model.bi,
              'userIDMap': {f'U{u}': train.to_inner_uid(f'U{u}') for u in range(3)},
              'itemIDMap': {f'I{i}': train.to_inner_iid(f'I{i}') for i in range(4)},
              'ordinaryForward': forwards,
              'duplicateOnlyForward': {'history': history, 'duplicateHistory': duplicate_history,
                                       'uniqueVector': unique_vector, 'occurrenceVector': duplicate_vector,
                                       'additionalFits': 0},
              'correspondenceLimit': 'Scratch uses canonical unique history and incidence-distributed once-entity penalty. Surprise uses trainset occurrence history, local regularization and another initializer; equal hyperparameter names do not imply equal fitted scores.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "scratchGlobalObjectives": [
    6.058689384016131,
    5.984756750115176,
    5.918637451961229,
    5.8602720605903915,
    5.814226863215741,
    5.773520135035808,
    5.738704127743214,
    5.707150421041626,
    5.6791152302352925,
    5.654655874192119,
    5.630210057105193
  ],
  "scratchU0Scores": [
    3.001117459952231,
    3.217397134690264,
    2.7844441706070873,
    3.003550131021897
  ],
  "ordinaryU0Scores": [
    2.9903677624800866,
    3.1806435739628696,
    2.8146667458180405,
    2.9889531159451708
  ],
  "maximumOrdinaryForwardDifference": 0.0,
  "unknownForwards": [
    {
      "rawUser": "new-user",
      "rawItem": "I0",
      "innerUser": null,
      "innerItem": 0,
      "historyOccurrences": [],
      "historyVector": [
        0.0,
        0.0
      ],
      "manual": 2.9846011431884887,
      "ordinary": 2.9846011431884887,
      "absoluteDifference": 0.0,
      "details": {
        "was_impossible": false
      }
    },
    {
      "rawUser": "U0",
      "rawItem": "new-item",
      "innerUser": 0,
      "innerItem": null,
      "historyOccurrences": [
        0,
        1,
        2
      ],
      "historyVector": [
        -0.128201911084635,
        -0.0239171509048234
      ],
      "manual": 2.994078056952768,
      "ordinary": 2.994078056952768,
      "absoluteDifference": 0.0,
      "details": {
        "was_impossible": false
      }
    },
    {
      "rawUser": "new-user",
      "rawItem": "new-item",
      "innerUser": null,
      "innerItem": null,
      "historyOccurrences": [],
      "historyVector": [
        0.0,
        0.0
      ],
      "manual": 3.0,
      "ordinary": 3.0,
      "absoluteDifference": 0.0,
      "details": {
        "was_impossible": false
      }
    }
  ],
  "duplicateOnlyForward": {
    "history": [
      0,
      1,
      2
    ],
    "duplicateHistory": [
      0,
      1,
      2,
      0
    ],
    "uniqueVector": [
      -0.128201911084635,
      -0.0239171509048234
    ],
    "occurrenceVector": [
      -0.136799902503695,
      -0.08278196578303731
    ],
    "additionalFits": 0
  }
}
```

The scratch full objective is about 6.058689 initially and 5.630210 after ten epochs. The ordinary and scratch score rows differ because their initial states and penalty accounting differ. Every reconstructed ordinary forward agrees exactly with its own package prediction, including unknown-user/item fallbacks. The repeated-history calculation changes the saved history vector without performing an additional fit.


### Complete program: Keep CSR confidence, filtering and recalculation separate

Construct user×item CSR with positive entries already containing confidence, and leave alpha=1 to avoid multiplication twice. Fitting owns a training P/Q; `recalculate_user` solves a fresh user against current Q. Filtering already-liked items is a candidate operation after scores exist. The complete output includes both the stored/recalculated distinction and an unbounded score.

<!-- program:implicitLibrary filename:implicitLibrary.py -->

```python
import numpy as np

counts = np.array(
    [
        [10, 3, 0, 1, 0, 15, 0],
        [8, 0, 5, 1, 2, 0, 4],
        [0, 6, 0, 0, 9, 12, 0],
        [1, 0, 0, 20, 7, 0, 3],
        [0, 1, 14, 8, 0, 0, 6],
    ],
    dtype=float,
)

import implicit
from scipy.sparse import csr_matrix
from implicit.cpu.als import AlternatingLeastSquares

alpha, penalty = 2.0, 0.2
confidence = csr_matrix(np.where(counts > 0, 1.0 + alpha * counts, 0.0))
model = AlternatingLeastSquares(
    factors=3,
    regularization=penalty,
    alpha=1.0,
    dtype=np.float64,
    use_cg=False,
    iterations=12,
    num_threads=1,
    random_state=11,
)
model.fit(confidence, show_progress=False)
print("implicit version:", implicit.__version__)
print("user factors, item factors:", model.user_factors.shape, model.item_factors.shape)
# The last item sweep changes Q. Recalculate this user against that final Q.
user = model.recalculate_user(0, confidence[0])
q = model.item_factors
c = 1.0 + alpha * counts[0]
target = (counts[0] > 0).astype(float)
direct = np.linalg.solve(
    q.T @ (c[:, None] * q) + penalty * np.eye(3), q.T @ (c * target)
)
assert np.allclose(user, direct, atol=1e-8)
ids, scores = model.recommend(
    0, confidence[0], N=3, recalculate_user=True, filter_already_liked_items=True
)
print(
    "unseen recommendations:",
    [(int(item), round(float(value), 6)) for item, value in zip(ids, scores)],
)
print(
    "recalculated user matches the declared dense confidence objective:",
    bool(np.allclose(user, direct, atol=1e-8)),
)
```

Recorded output for this exact original program and its original execution context:

```text
implicit version: 0.7.3
user factors, item factors: (5, 3) (7, 3)
unseen recommendations: [(4, 1.069473), (6, 0.255863), (2, 0.151264)]
recalculated user matches the declared dense confidence objective: True
```

## 11. Handle new items and connect scores to a serving system

An unseen item lacks a learned q row. An unseen user lacks a learned p row.
They are different missing objects. Item metadata can help infer a new q,
while a new user's score still needs permitted history, user features or an
explicit baseline. Copying an unrelated known user's vector does not solve
cold start.

<!-- diagram:D43 -->

In a separate synthetic metadata fixture, let X have one row per training item
and one column per known feature. The corresponding learned item factors form
Q. Ridge regression fits W so XW approximates Q: solve
(XᵀX+λI)W=XᵀQ, with shape feature-count×factor-count. A new item's feature
row x_new gives q_new=x_new W, then a known user can score pᵤᵀq_new. Every
matrix axis and ID mapping matters; a feature column cannot silently switch
meaning between training and serving.

The retained `coldItem` program compares this direct ridge solve with an
independent augmented least-squares construction, applies its actual new
feature row and checks joint-rotation score invariance. This is a declared
four-item/two-feature example, not measured recommendations for real recordings.
The new fixed-forward program opens a separate changed metadata construction.
Its changed three-item fixture uses feature rows (1,0), (0,1), (1,1)
and corresponding factor rows (1,0), (0,1), (2,1), with λ=.5. Multiplying
gives A=[[2.5,1],[1,2.5]] and b=XᵀQ=[[3,1],[2,2]]. Solve each column
against that same A to obtain W=[[22/21,2/21],[8/21,16/21]]. The new
feature row (1,.5) then selects matching products and sums to
q_new=(26/21,10/21). A known user p=(1,0) would score it 26/21. These
are declared metadata/factor rows, separate from the earlier rating matrix.

Unknown feature categories, no usable user evidence and singular λ=0 solves
need named outcomes. A linear projection is not a complete image/text feature
engine, and it cannot recover meaningful unseen attributes merely from an ID.

<!-- diagram:D44 -->

Follow actual item tokens through a request. First remove not-yet-released and
task-forbidden repeat items. Next choose a candidate subset, compute each
remaining named score, order by score with the declared ID tie rule, and fill
the requested slots. A category quota may then skip an already represented
category and take the next eligible token. That reranking changes a slate,
not the factor score or learned parameters. If there are too few eligible
items, report unfilled slots; do not manufacture successful recommendations.

Work the fixed five-item serving fixture at request time 20 with p=(1,0).
I0 is excluded by its known purchase at time 5; I2 is excluded by release
time 30. The remaining factor rows are I1=(2,0), I3=(1.5,0), I4=(.5,0),
so their dots give order I1,I3,I4. I1 and I3 are category A, while I4 is B.
Two slots with cap one per category issue I1,I4, skipping I3 for its category.
The recorded I4 purchase at time 25 is still future and does not exclude I4
from this time-20 list. The quota changes which IDs are issued; the scores
remain 2,1.5,.5 throughout.

For a maintenance application, available repair guides and equipment histories
define legal candidates. A clicked guide is not proof that a repair worked.
For a learning catalogue, an unmet prerequisite can exclude a high-scoring item.
For retail, discovery excludes prior purchases whereas replenishment may need
exactly those repeats. Each application needs its own collected outcome and
information boundary before a claim of benefit.

<!-- diagram:D45 -->

Retrieval also needs the score's geometry. With user p=(1,0), item A=(2,2)
has dot 2 and item B=(1.5,0) has dot 1.5, so the dot rule prefers A. Cosine
normalization instead gives A=1/√2 and B=1, preferring B. Replacing a dot index
with normalized cosine changes the rule. An item bias can be included in an
augmented dot [p,1]ᵀ[q,bᵢ], but normalizing those augmented vectors changes its
geometry again. A zero vector has no normalized direction; it cannot receive
a spurious directional arrow or finite cosine by division through zero.

<!-- diagram:D46 -->

A **two-tower** route encodes permitted user history/features and item
features separately into compatible vectors, then takes their dot. An
item-only vector can be cached under its item/encoder version. A joint ranker
that reads user context and item features together cannot generally precompute
that same full score as an item-only vector. Actual history tokens after the
request cutoff are excluded before the user encoder; a stale item vector from
another encoder version is a state fault, not a new valid recommendation.

The fixed encoder example declares feature rows I0=(1,0), I1=(0,1),
I2=(1,1). History has I0 occurrences at times 2 and 4 and an I2 occurrence
at 21. At request time 20 only the two I0 tokens enter the mean, giving
(1,0). Multiply by history weights [[.5,0],[0,1]] to get (.5,0); add
context [1] times [[.2,−.1]] to obtain user vector (.7,−.1). The separate
item weights [[1,.5],[0,1]] give cached vectors (1,.5), (0,1), (1,1.5).
Their dots with the user are .65,−.1,.55. This encoder-only fixture computes
three vectors; release/candidate gates separately decide which items may be
issued. Repeated history tokens are retained by this mean rule, unlike the
unique SVD++ set, and the future I2 token cannot affect the user vector.

Other extensions change how scores are built: row reconstruction can be
nonlinear, feature-pair models learn interactions, and sequence models use
ordered history. Their full training engines belong to their respective
lessons. The local program uses declared fixed linear encoder weights and
actual array shapes to expose this boundary; it does not claim to train a
neural recommender or an approximate-nearest-neighbor service. Approximate
retrieval must be assessed against a named exact baseline, candidate recall,
workload and hardware, rather than a universal speed claim.

<!-- diagram:D47 -->

A local **LightGCN** bridge instead uses the binary interaction graph. Take
edges U0–I0, U0–I1, U1–I1, with degrees [2,1,1,2] in node order
[U0,U1,I0,I1]. Initial scalar embeddings are [2,0,1,3]. Each next-layer node
adds old neighbor values weighted by 1/√(its degree × neighbor degree).
U0's first layer is 1/√2+3/2; U1's is 3/√2; I0's is √2; I1's is 1.
All four read the same old layer buffer. Their next U0 value is
√2/√2+1/2=3/2, not a sequential update using a just-changed neighbor.

Mix layers 0 through K equally, then take the selected user/item mixed-vector
dot. K=0 preserves the original vectors. An isolated node receives zero at
later layers while its layer 0 contribution still remains in the mixture; no
self loop is invented to keep it alive. Zero values have no directional heads.
This is fixed graph-forward arithmetic, not a new fitted graph experiment or
an assertion that arbitrary differently normalized self-loop operators have
the same polynomial. [LightGCN, §3](https://arxiv.org/pdf/2002.02126)
defines the aggregation and mixture. [Message Passing](https://ronak.sh/learn/topic/message-passing-graph-convolutions-gcn-gat-graphsage)
is optional further learning for full graph learning. The local calculation
remains complete without requiring that lesson first.

The edge propagation kernel visits E user–item edges at each of K layers,
doing O(K E d) coordinate work for width d. An edge-list implementation also
needs O(N+E) graph storage and O(Nd) current/next/mixture buffers, where N=U+I;
clearing or mixing these dense node buffers adds O(K N d) work.
The complete small-graph diagnostic below deliberately does more: it accepts
dense U×I input, discovers its edges in O(UI), allocates dense N×N adjacency
and normalized operator, and multiplies that operator by every old layer to
check the edge result. That verification adds O(N²) storage and O(K N² d)
work. It retains every layer, O((K+1)Nd), and every directed edge-product
record, O(K E d), then materializes all user–item scores in O(UI d) work
and O(UI) storage. Those retained outputs support tracing this tiny example;
they are not the storage plan for a large sparse production service. The full
recorded numerical trace uses this same arithmetic; its original `costs`
field described only the edge kernel, so include the dense diagnostic and
returned-state costs when scaling the complete program.

The deeper candidate/index/cache/version/slate/logging service belongs to
Recommendation System Design. Here we can already diagnose a missing item,
wrong metric, future token or stale array from the actual local objects. The
next optional section asks what a logged outcome can identify about a changed
decision policy.

### Complete program: Project available metadata into a known factor space

Form XᵀX+λI and XᵀQ from the declared paired feature/item rows, solve for W, then multiply the new metadata row by W. This maps an item port into the existing latent width; a known user can score it with a dot product. It does not invent evidence for a cold user. NumPy’s solve is compared with an augmented least-squares formulation.

<!-- program:coldItem filename:coldItem.py -->

```python
import numpy as np

# Synthetic training items: columns are two metadata features.
features = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [2.0, 1.0]])
item_factors = np.array([[0.8, 0.1], [0.1, 0.9], [0.9, 0.8], [1.7, 0.8]])
penalty = 0.2
mapping = np.linalg.solve(
    features.T @ features + penalty * np.eye(2), features.T @ item_factors
)
augmented = np.vstack((features, np.sqrt(penalty) * np.eye(2)))
targets = np.vstack((item_factors, np.zeros((2, 2))))
assert np.allclose(mapping, np.linalg.lstsq(augmented, targets, rcond=None)[0])
user, new_features = np.array([0.4, 0.7]), np.array([1.0, 0.5])
new_factor = new_features @ mapping
print("mapping:", np.round(mapping, 6).tolist())
print("new item factor:", np.round(new_factor, 6).tolist())
print("personalized dot score:", round(float(user @ new_factor), 6))
rotation = np.array([[0.0, -1.0], [1.0, 0.0]])
assert np.allclose(user @ new_factor, (user @ rotation) @ (new_factor @ rotation))
print("joint factor rotation preserves the score; factor axes are not unique.")
```

Recorded output for this exact original program and its original execution context:

```text
mapping: [[0.758303, 0.046125], [0.132841, 0.738007]]
new item factor: [0.824723, 0.415129]
personalized dot score: 0.62048
joint factor rotation preserves the score; factor axes are not unique.
```

### Complete program: Trace fixed metadata, serving and graph forwards

`metadata_projection` solves a declared feature-to-factor ridge map. `serving_slate` applies time, history and quota rules to named IDs. `metric_scores` contrasts dot and cosine, including zero norm; `two_tower_prefix` excludes future tokens before fixed encoding. `graph_forward` computes bipartite degree-adjusted layers and the layer-zero mixture, comparing node-loop and block-array routes. `state_identity` keeps names/version with rows. These are fixed forward and analytical solves, not a trained neural or graph recommender or an ANN service.

<!-- program:recommender-forward-boundaries filename:recommender-forward-boundaries.py -->

```python
"""Complete fixed-state metadata, serving, two-tower and graph forwards.

Run: python recommender-forward-boundaries.py
Requires NumPy/SciPy. No learned neural/graph fit, old main or ANN service runs.
"""
import hashlib
import json
import math

import numpy as np
from scipy.linalg import solve as scipy_solve


def finite(value, name, ndim):
    array = np.asarray(value, dtype=np.float64)
    if array.ndim != ndim or not np.isfinite(array).all():
        raise ValueError(f'{name} requires a finite {ndim}-dimensional array')
    return array


def metadata_projection(features, item_factors, new_features, penalty):
    x, q = finite(features, 'X', 2), finite(item_factors, 'Q', 2)
    new = finite(new_features, 'new features', 1)
    if x.shape[0] != q.shape[0] or x.shape[1] != new.size or min(x.shape) < 1 or q.shape[1] < 1:
        raise ValueError('X/Q/new-feature entity and feature dimensions disagree')
    if penalty < 0 or not math.isfinite(penalty):
        raise ValueError('penalty must be finite and nonnegative')
    a = x.T@x + penalty*np.eye(x.shape[1])
    b = x.T@q
    if np.linalg.matrix_rank(a) < a.shape[0]:
        return {'available': False, 'reason': 'nonunique metadata ridge map', 'A': a, 'b': b}
    w = scipy_solve(a, b, assume_a='pos')
    augmented_x = np.vstack((x, math.sqrt(penalty)*np.eye(x.shape[1])))
    augmented_q = np.vstack((q, np.zeros((x.shape[1], q.shape[1]))))
    independent, _, rank, _ = np.linalg.lstsq(augmented_x, augmented_q, rcond=None)
    return {'available': True, 'A': a, 'b': b, 'W': w, 'newQ': new@w,
            'augmentedRank': int(rank),
            'solverDifferenceInfinity': float(np.max(np.abs(w-independent)))}


def state_identity(item_ids, factors, version):
    factors = finite(factors, 'item factors', 2)
    if factors.shape[0] != len(item_ids) or len(set(item_ids)) != len(item_ids) or not version:
        raise ValueError('unique item IDs and declared encoder/state version required')
    payload = {'itemIDs': list(item_ids), 'Q': factors.tolist(), 'version': str(version)}
    encoded = json.dumps(payload, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def serving_slate(catalogue, factors, user, request_time, known_events, candidate_ids,
                  slots, category_cap, state_version, required_version):
    """Eligibility precedes scores. The quota scans that same stable score order."""
    q, p = finite(factors, 'Q', 2), finite(user, 'p', 1)
    ids = [row['id'] for row in catalogue]
    if q.shape != (len(ids), len(p)) or not p.size or len(ids) != len(set(ids)):
        raise ValueError('catalogue/Q/p mapping or dimensions disagree')
    if len(candidate_ids) != len(set(candidate_ids)) or not set(candidate_ids) <= set(ids):
        raise ValueError('candidate IDs must be unique known catalogue identities')
    if slots < 1 or category_cap < 1 or not math.isfinite(request_time):
        raise ValueError('positive slot/cap counts and finite request time required')
    for row in catalogue:
        if not math.isfinite(row['release']):
            raise ValueError('every item needs its actual finite release time')
    for event in known_events:
        if event['item'] not in ids or not math.isfinite(event['time']):
            raise ValueError('each history occurrence requires known ID and finite time')
    if state_version != required_version:
        return {'available': False, 'reason': 'stale item state/encoder version', 'scores': None}
    history = [event for event in known_events if event['time'] <= request_time]
    purchased = {event['item'] for event in history}
    candidates = set(candidate_ids)
    trace = []
    eligible = []
    for position, item in enumerate(catalogue):
        reasons = []
        if item['id'] not in candidates:
            reasons.append('outside candidate subset')
        if item['release'] > request_time:
            reasons.append('not released at request')
        if item['id'] in purchased:
            reasons.append('known past purchase excluded by discovery rule')
        entry = {'id': item['id'], 'row': position, 'category': item['category'],
                 'excludedBy': reasons, 'score': float(p@q[position]) if not reasons else None}
        trace.append(entry)
        if not reasons:
            eligible.append(entry)
    order = sorted(eligible, key=lambda row: (-row['score'], row['id']))
    category_counts = {}
    issued, quota_trace = [], []
    for row in order:
        kept = len(issued) < slots and category_counts.get(row['category'], 0) < category_cap
        quota_trace.append({'id': row['id'], 'kept': kept,
                            'reason': 'selected' if kept else ('all slots filled' if len(issued) >= slots else 'category cap')})
        if kept:
            issued.append(row['id'])
            category_counts[row['category']] = category_counts.get(row['category'], 0) + 1
    return {'available': True, 'stateID': state_identity(ids, q, state_version),
            'knownHistoryOccurrences': history, 'ignoredFutureOccurrences': len(known_events)-len(history),
            'filterTrace': trace, 'scoreOrder': [row['id'] for row in order],
            'quotaTrace': quota_trace, 'issued': issued, 'fill': len(issued)/slots}


def metric_scores(user, item_factors, item_bias=None):
    p, q = finite(user, 'p', 1), finite(item_factors, 'Q', 2)
    if q.shape[1] != p.size or not p.size:
        raise ValueError('factor widths disagree')
    biases = np.zeros(q.shape[0]) if item_bias is None else finite(item_bias, 'item bias', 1)
    if biases.shape != (q.shape[0],):
        raise ValueError('one bias per item required')
    norm_p, norm_q = np.linalg.norm(p), np.linalg.norm(q, axis=1)
    cosine = [float(p@row/(norm_p*norm)) if norm_p and norm else None for row, norm in zip(q, norm_q)]
    augmented = np.column_stack((q, biases)) @ np.concatenate((p, [1.]))
    return {'dot': q@p, 'cosine': cosine, 'biasedDot': q@p+biases, 'augmentedDot': augmented}


def two_tower_prefix(history, item_features, item_ids, request_time, item_weights,
                     user_weights, context, context_weights, encoder_version, cache_version):
    x, wi = finite(item_features, 'item features', 2), finite(item_weights, 'item encoder', 2)
    wu, wc = finite(user_weights, 'history encoder', 2), finite(context_weights, 'context encoder', 2)
    c = finite(context, 'current context', 1)
    if x.shape[0] != len(item_ids) or len(set(item_ids)) != len(item_ids):
        raise ValueError('unique feature-row item IDs required')
    if wi.shape[0] != x.shape[1] or wu.shape != wi.shape or wc.shape != (len(c), wi.shape[1]):
        raise ValueError('history/item/context encoder shapes disagree')
    if encoder_version != cache_version:
        return {'available': False, 'reason': 'cached item vector belongs to another encoder version'}
    mapping = {item: index for index, item in enumerate(item_ids)}
    if any(event['item'] not in mapping or not math.isfinite(event['time']) for event in history):
        raise ValueError('each occurrence needs a known item ID and finite time')
    prefix = [event for event in history if event['time'] <= request_time]
    # Occurrences are retained; this mean is a declared encoder input rule,
    # unlike the canonical unique SVD++ history or binary graph adjacency.
    pooled = np.mean([x[mapping[event['item']]] for event in prefix], axis=0) if prefix else np.zeros(x.shape[1])
    p = pooled@wu + c@wc
    cached_q = x@wi
    return {'available': True, 'prefix': prefix, 'pooledFeatures': pooled,
            'userVector': p, 'cachedItemVectors': cached_q, 'scores': cached_q@p,
            'encoderVersion': encoder_version,
            'shapes': {'X': list(x.shape), 'Wi': list(wi.shape), 'Wu': list(wu.shape), 'Wcontext': list(wc.shape)}}


def graph_forward(interactions, initial, depth):
    r, initial = finite(interactions, 'binary R', 2), finite(initial, 'E0', 2)
    if min(r.shape) < 1 or not np.isin(r, [0., 1.]).all():
        raise ValueError('binary user-by-item adjacency required')
    if initial.shape[0] != sum(r.shape) or initial.shape[1] < 1 or not isinstance(depth, int) or not 0 <= depth <= 3:
        raise ValueError('E0 node order [users,items], positive width and depth 0–3 required')
    users, items = r.shape
    adjacency = np.block([[np.zeros((users, users)), r], [r.T, np.zeros((items, items))]])
    degrees = adjacency.sum(axis=1)
    inverse_root = np.zeros_like(degrees)
    positive = degrees > 0
    inverse_root[positive] = 1/np.sqrt(degrees[positive])
    operator = inverse_root[:, None] * adjacency * inverse_root[None, :]
    edges = [(user, users+item) for user, item in zip(*np.nonzero(r))]
    layers, products = [initial.copy()], []
    for _ in range(depth):
        old = layers[-1]
        next_by_edges = np.zeros_like(old)
        row_products = []
        for user, item in edges:
            weight = 1/math.sqrt(degrees[user]*degrees[item])
            next_by_edges[user] += weight*old[item]
            next_by_edges[item] += weight*old[user]
            row_products.append({'userNode': user, 'itemNode': item, 'weight': weight,
                                 'toUser': weight*old[item], 'toItem': weight*old[user]})
        next_by_matrix = operator@old
        error = float(np.max(np.abs(next_by_matrix-next_by_edges)))
        if error > 1e-13:
            raise AssertionError('edge and block synchronous forwards disagree')
        layers.append(next_by_edges)
        products.append({'edgeProducts': row_products, 'matrixDifferenceInfinity': error})
    mixed = np.mean(layers, axis=0)
    return {'degrees': degrees, 'operator': operator, 'layers': layers,
            'products': products, 'mixture': mixed,
            'userItemScores': mixed[:users]@mixed[users:].T,
            'zeroDegreeNodes': np.flatnonzero(~positive)}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    catalogue = [{'id': 'I0', 'release': 0, 'category': 'A'},
                 {'id': 'I1', 'release': 10, 'category': 'A'},
                 {'id': 'I2', 'release': 30, 'category': 'B'},
                 {'id': 'I3', 'release': 0, 'category': 'A'},
                 {'id': 'I4', 'release': 0, 'category': 'B'}]
    factors = [[1., 0.], [2., 0.], [5., 0.], [1.5, 0.], [.5, 0.]]
    history = [{'item': 'I0', 'time': 5}, {'item': 'I4', 'time': 25}]
    args = (catalogue, factors, [1., 0.], 20, history, ['I0', 'I1', 'I2', 'I3', 'I4'], 2, 1)
    slate = serving_slate(*args, 'fixed-v1', 'fixed-v1')
    if slate['issued'] != ['I1', 'I4'] or slate['ignoredFutureOccurrences'] != 1:
        raise AssertionError('release/history/score/quota pipeline changed its actual selected IDs')
    features = [[1., 0.], [0., 1.], [1., 1.]]
    projection = metadata_projection(features, [[1., 0.], [0., 1.], [2., 1.]], [1., .5], .5)
    report = {
        'scope': 'Declared fixed analytical state; no neural/graph fit or approximate retrieval service',
        'metadata': projection, 'slate': slate,
        'staleState': serving_slate(*args, 'fixed-v0', 'fixed-v1'),
        'dotVersusCosine': metric_scores([1., 0.], [[2., 2.], [1.5, 0.], [0., 0.]], [.2, -.1, 0.]),
        'twoTower': two_tower_prefix(
            [{'item': 'I0', 'time': 2}, {'item': 'I0', 'time': 4}, {'item': 'I2', 'time': 21}],
            features, ['I0', 'I1', 'I2'], 20,
            [[1., .5], [0., 1.]], [[.5, 0.], [0., 1.]], [1.], [[.2, -.1]], 'encoder-v1', 'encoder-v1'),
        'graphDepths': [graph_forward([[1, 1], [0, 1]], [[2.], [0.], [1.], [3.]], depth) for depth in range(4)],
        'graphIsolated': graph_forward([[1, 0], [0, 0]], [[2.], [7.], [1.], [3.]], 2),
        'costs': 'edge kernel O(K*E*d), plus O(K*N*d) dense buffer work; this diagnostic also discovers edges from dense input O(U*I), allocates adjacency/operator O(N^2), verifies O(K*N^2*d), retains layers O((K+1)*N*d) and products O(K*E*d), and materializes scores O(U*I*d) work/O(U*I) storage; exact dot scoring O(I*d); quota scan O(I) after O(I log I) sorting; N=U+I',
    }
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "metadataNewQ": [
    1.2380952380952381,
    0.47619047619047616
  ],
  "metadataSolverDifferenceInfinity": 5.551115123125783e-16,
  "scoreOrder": [
    "I1",
    "I3",
    "I4"
  ],
  "issued": [
    "I1",
    "I4"
  ],
  "ignoredFutureOccurrences": 1,
  "dotVersusCosine": {
    "dot": [
      2.0,
      1.5,
      0.0
    ],
    "cosine": [
      0.7071067811865475,
      1.0,
      null
    ],
    "biasedDot": [
      2.2,
      1.4,
      0.0
    ],
    "augmentedDot": [
      2.2,
      1.4,
      0.0
    ]
  },
  "twoTower": {
    "available": true,
    "prefix": [
      {
        "item": "I0",
        "time": 2
      },
      {
        "item": "I0",
        "time": 4
      }
    ],
    "pooledFeatures": [
      1.0,
      0.0
    ],
    "userVector": [
      0.7,
      -0.1
    ],
    "cachedItemVectors": [
      [
        1.0,
        0.5
      ],
      [
        0.0,
        1.0
      ],
      [
        1.0,
        1.5
      ]
    ],
    "scores": [
      0.6499999999999999,
      -0.1,
      0.5499999999999999
    ],
    "encoderVersion": "encoder-v1",
    "shapes": {
      "X": [
        3,
        2
      ],
      "Wi": [
        2,
        2
      ],
      "Wu": [
        2,
        2
      ],
      "Wcontext": [
        1,
        2
      ]
    }
  },
  "graphFirstLayer": [
    [
      2.2071067811865475
    ],
    [
      2.1213203435596424
    ],
    [
      1.414213562373095
    ],
    [
      1.0
    ]
  ],
  "graphDepthTwoMixture": [
    [
      1.9023689270621826
    ],
    [
      0.9428090415820632
    ],
    [
      1.3249579113843053
    ],
    [
      2.201184463531091
    ]
  ],
  "isolatedDegrees": [
    1.0,
    0.0,
    1.0,
    0.0
  ],
  "isolatedMixture": [
    [
      1.6666666666666667
    ],
    [
      2.3333333333333335
    ],
    [
      1.3333333333333333
    ],
    [
      1.0
    ]
  ],
  "staleState": {
    "available": false,
    "reason": "stale item state/encoder version",
    "scores": null
  }
}
```

The quota selects I1 and I4 from the score order I1,I3,I4; it skips a category rather than changing scores. The later event is excluded before encoding. Dot and cosine prefer different nonzero items, and a zero item has undefined cosine. Graph layers use one old buffer, while isolated nodes retain their layer-zero share in the mixture. A stale identity/version invalidates the current result.


## 12. Optional: distinguish logged rewards from a new policy

A **logging policy** is the rule that chose which action was shown. A **target
policy** is another rule whose expected reward we want to assess. Observed
rewards average under the logging policy's exposures. A reward for an action
never shown does not enter that average, and unknown exposure cannot be repaired
by calling an unpurchased item a negative label.

<!-- diagram:D48 -->

Use a separate fully known two-action construction. Logging chooses A with
probability .8 and B with .2. Conditional reward-one probabilities are .4
for A and .8 for B. The four action/reward path masses are .32,.48,.16,.04.
Logging's expected reward is .8×.4+.2×.8=.48. A target policy choosing both
actions with .5 each instead has value .5×.4+.5×.8=.6.

An **inverse-propensity score**, or IPS, multiplies a logged reward by the
target/logging action-probability ratio. Here A's ratio is .5/.8=.625;
B's is .5/.2=2.5. In expectation the logging probability cancels:

\[
\mathbb E_{a\sim\pi_0,y\mid a}
\left[\frac{\pi(a)}{\pi_0(a)}y\right]
=\sum_a\pi(a)\mathbb E[y\mid a].
\]

This equality assumes the supplied positive logging probabilities correctly
describe assignment and the conditional reward relation remains the one being
assessed. If target mass is positive where logging mass is zero, the changed
policy is not identified from those logs. A branch with both masses zero adds
zero rather than an evaluated 0/0. The toy's reward chances were explicitly
given; knowing them in the construction is different from having learned an
unshown action's outcome from observational data.

<!-- diagram:D49 -->

The complete retained `policy` program enumerates all four paths with exact
fractions. The weighted second moment is .32×.625²+.16×2.5²=1.125; subtract
the squared mean .6² to get one-request variance .765. Under independent
requests, the mean's variance is .765/N. Dependence or a different request
population changes that interpretation.

A declared twenty-request realization has sixteen A actions and four B actions,
with six A rewards and three B rewards. Its ordinary average is 9/20=.45;
its IPS estimate is (.625×6+2.5×3)/20=9/16=.5625. Neither equals the known
expectation merely because it is correctly computed. Small propensities can
produce large weights and an estimate above the reward's usual range.
Clipping weights changes expectation. Self-normalized IPS divides the weighted
reward sum by the weight sum instead of N; it is a separate finite-sample
estimator with possible bias, not the same unbiased expectation identity.

### Deeper: missing entry risk is a different data unit

<!-- diagram:D50 -->

Suppose a 2×2 population of entries has fixed losses [[1,4],[2,3]], and known
observation probabilities [[1,.5],[.25,1]]. Let δ mark whether an entry is
observed. The target full-entry mean loss is 10/4=2.5. Weight each observed
entry loss by δ/observation probability and divide by the full population
size 4. Its expectation is 2.5 because each E[δ]/probability cancels to 1.
This is an entry-risk calculation, not a request-action reward tree; their
denominators and data units must stay named.

The first and last entries are always observed. The two optional entries give
four nonzero-probability masks with masses 3/8,3/8,1/8,1/8. Their naive observed
means are respectively 2,8/3,2,5/2, whose expectation is 37/16 rather than 5/2.
Their full-population IPS means are 1,3,3,5, whose expectation is 5/2. One
realized IPS value 5 exceeds even the largest individual loss 4; forcing it
back into that range would change the estimator.

The new exact-fraction program enumerates all sixteen masks, including the
zero-probability ones, and evaluates these expectations and finite normalized
alternatives. Positive target weight with zero observation probability is
unidentified. In a generic empty observed mask, naive observed mean is undefined
even though the full-population weighted sum with positive known propensities
can be zero. [Schnabel et al., §§3–4](https://proceedings.mlr.press/v48/schnabel16.pdf)
distinguish the population risk and observation mechanism.

Neither the earlier missing rating cells nor later Retail invoices supply
known action/exposure probabilities. No propensity fit, causal improvement or
stock availability is inferred from those absences. Randomized logs or justified
identification assumptions would be new evidence and a separately declared
task. We return to a more limited, directly observable question: how do complete
fixed workflows score their declared future outcomes?

### Complete program: Enumerate a request-action policy exactly

Each branch combines an action probability with a Bernoulli reward probability. `Fraction` keeps their mass and IPS moments exact. The target-to-logging ratio multiplies observed rewards; the second moment minus the squared expectation gives variance. Positive target mass with zero logging support is an identification failure, not a numerical divide-by-zero fix.

<!-- program:policy filename:policy.py -->

```python
from fractions import Fraction as F

logging, target, reward_chance = (
    [F(4, 5), F(1, 5)],
    [F(1, 2), F(1, 2)],
    [F(2, 5), F(4, 5)],
)
logged = sum(p * q for p, q in zip(logging, reward_chance))
value = sum(p * q for p, q in zip(target, reward_chance))
mean, second = F(0), F(0)
for action in range(2):
    for reward in (0, 1):
        mass = logging[action] * (
            reward_chance[action] if reward else 1 - reward_chance[action]
        )
        weighted = target[action] / logging[action] * reward
        mean += mass * weighted
        second += mass * weighted**2
        print(
            "action",
            action,
            "reward",
            reward,
            "mass",
            mass,
            "weighted reward",
            weighted,
        )
assert mean == value
print("logged mean:", logged, "target mean:", value, "IPS expectation:", mean)
print("one-request IPS variance:", second - mean**2)
# A finite realized sample is not the expectation: 16 A, 4 B; 6 A and 3 B clicks.
estimate = (target[0] / logging[0] * 6 + target[1] / logging[1] * 3) / 20
print("one declared 20-request sample: raw", F(9, 20), "IPS", estimate)
print(
    "If B has zero logging probability and positive target mass, its mean is not identified from those logs."
)
```

Recorded output for this exact original program and its original execution context:

```text
action 0 reward 0 mass 12/25 weighted reward 0
action 0 reward 1 mass 8/25 weighted reward 5/8
action 1 reward 0 mass 1/25 weighted reward 0
action 1 reward 1 mass 4/25 weighted reward 5/2
logged mean: 12/25 target mean: 3/5 IPS expectation: 3/5
one-request IPS variance: 153/200
one declared 20-request sample: raw 9/20 IPS 9/16
If B has zero logging probability and positive target mass, its mean is not identified from those logs.
```

### Complete program: Enumerate missing-entry risk without conflating data units

`observation_problem` declares losses, observation propensities and fixed target weights. `enumerate_independent_masks` visits all sixteen masks, including zero-probability ones, while `estimates` keeps naive, IPS and self-normalized denominators separate. Exact expectations explain which quantities are unbiased and which have finite-sample normalization bias. `policy_paths` retains the different request-action unit. A zero-supported target is unidentified; the computation does not estimate Retail exposure from absence.

<!-- program:recommender-propensity-risk filename:recommender-propensity-risk.py -->

```python
"""Exact entry-observation risk enumeration, distinct from action-policy IPS.

Run: python recommender-propensity-risk.py
Only Python's standard library is needed. Fractions remain exact throughout.
"""
from fractions import Fraction
from itertools import product
import json
import math


def exact(value):
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError('all supplied values must be finite')
        return Fraction(str(value))
    return Fraction(value)


def observation_problem(losses, propensities, target_weights=None):
    losses = [exact(value) for value in losses]
    propensities = [exact(value) for value in propensities]
    if not losses or len(losses) != len(propensities):
        raise ValueError('one observation probability is required for each entry')
    if any(value < 0 for value in losses):
        raise ValueError('this example declares nonnegative entry losses')
    if any(value < 0 or value > 1 for value in propensities):
        raise ValueError('observation probabilities must lie in [0,1]')
    weights = ([Fraction(1, len(losses))] * len(losses) if target_weights is None
               else [exact(value) for value in target_weights])
    if len(weights) != len(losses) or any(value < 0 for value in weights) or sum(weights) != 1:
        raise ValueError('target weights must be nonnegative and sum exactly to 1')
    return losses, propensities, weights


def estimates(mask, losses, propensities, weights):
    if len(mask) != len(losses) or any(value not in (0, 1) for value in mask):
        raise ValueError('mask must have one binary indicator per entry')
    unsupported = [index for index, (weight, probability) in enumerate(zip(weights, propensities))
                   if weight > 0 and probability == 0]
    count = sum(mask)
    naive = (sum(value * present for value, present in zip(losses, mask)) / count
             if count else None)
    if unsupported:
        return {'naiveObservedMean': naive, 'IPS': None, 'SNIPS': None,
                'unsupportedTargetEntries': unsupported}
    # A target 0/propensity 0 cell contributes 0; it never evaluates 0/0.
    weighted = [weight * present / probability if probability else Fraction(0)
                for present, probability, weight in zip(mask, propensities, weights)]
    ips = sum(weight * value for weight, value in zip(weighted, losses))
    denominator = sum(weighted)
    return {'naiveObservedMean': naive, 'IPS': ips,
            'SNIPS': ips / denominator if denominator else None,
            'SNIPSDenominator': denominator,
            'unsupportedTargetEntries': []}


def enumerate_independent_masks(losses, propensities, target_weights=None):
    """Independence is declared here, not inferred from the observed entries."""
    losses, propensities, weights = observation_problem(losses, propensities, target_weights)
    if len(losses) > 20:
        raise ValueError('exact 2^N enumeration is bounded to 20 teaching entries')
    rows = []
    for mask in product((0, 1), repeat=len(losses)):
        probability = math.prod(p if present else 1-p for present, p in zip(mask, propensities))
        rows.append({'mask': list(mask), 'probability': probability,
                     **estimates(mask, losses, propensities, weights)})
    if sum(row['probability'] for row in rows) != 1:
        raise AssertionError('full independent mask distribution must sum to 1')
    summary = {'knownConstructionTarget': sum(weight * loss for weight, loss in zip(weights, losses)),
               'entries': len(losses), 'enumeratedMasks': len(rows),
               'positiveProbabilityMasks': sum(row['probability'] > 0 for row in rows)}
    for name in ['naiveObservedMean', 'IPS', 'SNIPS']:
        defined = [row for row in rows if row['probability'] and row[name] is not None]
        defined_mass = sum(row['probability'] for row in defined)
        total = sum(row['probability'] * row[name] for row in defined)
        summary[name] = {
            'definedProbability': defined_mass,
            'unconditionalExpectation': total if defined_mass == 1 else None,
            'expectationConditionalOnDefined': total / defined_mass if defined_mass else None,
        }
    return {'losses': losses, 'propensities': propensities, 'targetWeights': weights,
            'summary': summary, 'masks': rows}


def policy_paths(logging, target, rewards):
    """Separate request-action unit; rewards are Bernoulli conditional chances."""
    logging, target, rewards = [[exact(value) for value in vector]
                                for vector in (logging, target, rewards)]
    if len(logging) != len(target) or len(logging) != len(rewards) or not logging:
        raise ValueError('one target/logging/reward value per action is required')
    if sum(logging) != 1 or sum(target) != 1:
        raise ValueError('each policy must sum exactly to 1')
    if any(value < 0 or value > 1 for vector in (logging, target, rewards) for value in vector):
        raise ValueError('policy/reward probabilities must lie in [0,1]')
    unsupported = [action for action, (p, t) in enumerate(zip(logging, target)) if t > 0 and p == 0]
    rows = []
    for action, y in product(range(len(logging)), (0, 1)):
        ratio = target[action] / logging[action] if logging[action] else (Fraction(0) if target[action] == 0 else None)
        rows.append({'action': action, 'reward': y,
                     'probability': logging[action] * (rewards[action] if y else 1-rewards[action]),
                     'ratio': ratio, 'weightedReward': ratio*y if ratio is not None else None})
    return {'unsupportedActions': unsupported, 'paths': rows,
            'knownConstructionTarget': sum(p*r for p, r in zip(target, rewards)),
            'loggedExpectation': sum(p*r for p, r in zip(logging, rewards)),
            'IPSExpectation': None if unsupported else sum(row['probability']*row['weightedReward'] for row in rows)}


def serialize(value):
    if isinstance(value, Fraction):
        return {'exact': str(value), 'decimal': float(value)}
    raise TypeError(type(value).__name__)


def main():
    risk = enumerate_independent_masks([1, 4, 2, 3], [1, '1/2', '1/4', 1])
    summary = risk['summary']
    if summary['IPS']['unconditionalExpectation'] != Fraction(5, 2):
        raise AssertionError('positive-support IPS expectation must equal the fixed full-grid mean')
    if summary['naiveObservedMean']['unconditionalExpectation'] != Fraction(37, 16):
        raise AssertionError('different observation population must retain its actual naive mean')
    if risk['masks'][-1]['IPS'] != 5:
        raise AssertionError('the all-observed realized IPS exceeds the individual loss range')
    report = {
        'entryRisk': risk,
        'emptyPossible': enumerate_independent_masks([1, 4], ['1/2', '1/4']),
        'unsupportedEntry': enumerate_independent_masks([1, 4], [1, 0]),
        'zeroTargetZeroObservation': enumerate_independent_masks([1, 4], [1, 0], [1, 0]),
        'separateKnownPolicy': policy_paths(['4/5', '1/5'], ['1/2', '1/2'], ['2/5', '4/5']),
        'unsupportedPolicy': policy_paths([1, 0], ['1/2', '1/2'], ['2/5', '4/5']),
        'limits': 'Supplied independent probabilities are known construction inputs. Retail absence provides neither exposure propensities nor causal identification.',
    }
    print(json.dumps(report, indent=2, default=serialize))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "entryRisk": {
    "knownConstructionTarget": {
      "exact": "5/2",
      "decimal": 2.5
    },
    "entries": 4,
    "enumeratedMasks": 16,
    "positiveProbabilityMasks": 4,
    "naiveObservedMean": {
      "definedProbability": {
        "exact": "1",
        "decimal": 1.0
      },
      "unconditionalExpectation": {
        "exact": "37/16",
        "decimal": 2.3125
      },
      "expectationConditionalOnDefined": {
        "exact": "37/16",
        "decimal": 2.3125
      }
    },
    "IPS": {
      "definedProbability": {
        "exact": "1",
        "decimal": 1.0
      },
      "unconditionalExpectation": {
        "exact": "5/2",
        "decimal": 2.5
      },
      "expectationConditionalOnDefined": {
        "exact": "5/2",
        "decimal": 2.5
      }
    },
    "SNIPS": {
      "definedProbability": {
        "exact": "1",
        "decimal": 1.0
      },
      "unconditionalExpectation": {
        "exact": "39/16",
        "decimal": 2.4375
      },
      "expectationConditionalOnDefined": {
        "exact": "39/16",
        "decimal": 2.4375
      }
    }
  },
  "emptyPossible": {
    "knownConstructionTarget": {
      "exact": "5/2",
      "decimal": 2.5
    },
    "entries": 2,
    "enumeratedMasks": 4,
    "positiveProbabilityMasks": 4,
    "naiveObservedMean": {
      "definedProbability": {
        "exact": "5/8",
        "decimal": 0.625
      },
      "unconditionalExpectation": null,
      "expectationConditionalOnDefined": {
        "exact": "19/10",
        "decimal": 1.9
      }
    },
    "IPS": {
      "definedProbability": {
        "exact": "1",
        "decimal": 1.0
      },
      "unconditionalExpectation": {
        "exact": "5/2",
        "decimal": 2.5
      },
      "expectationConditionalOnDefined": {
        "exact": "5/2",
        "decimal": 2.5
      }
    },
    "SNIPS": {
      "definedProbability": {
        "exact": "5/8",
        "decimal": 0.625
      },
      "unconditionalExpectation": null,
      "expectationConditionalOnDefined": {
        "exact": "2",
        "decimal": 2.0
      }
    }
  },
  "unsupportedEntry": {
    "knownConstructionTarget": {
      "exact": "5/2",
      "decimal": 2.5
    },
    "entries": 2,
    "enumeratedMasks": 4,
    "positiveProbabilityMasks": 1,
    "naiveObservedMean": {
      "definedProbability": {
        "exact": "1",
        "decimal": 1.0
      },
      "unconditionalExpectation": {
        "exact": "1",
        "decimal": 1.0
      },
      "expectationConditionalOnDefined": {
        "exact": "1",
        "decimal": 1.0
      }
    },
    "IPS": {
      "definedProbability": 0,
      "unconditionalExpectation": null,
      "expectationConditionalOnDefined": null
    },
    "SNIPS": {
      "definedProbability": 0,
      "unconditionalExpectation": null,
      "expectationConditionalOnDefined": null
    }
  },
  "policyTarget": {
    "exact": "3/5",
    "decimal": 0.6
  },
  "policyLoggedExpectation": {
    "exact": "12/25",
    "decimal": 0.48
  },
  "policyIPSExpectation": {
    "exact": "3/5",
    "decimal": 0.6
  }
}
```

Full-entry risk is 5/2. Naive observed averaging has expectation 37/16, IPS has 5/2, and self-normalization has 39/16 in the four-entry construction. In the two-entry case an observed mean exists with probability 5/8; its conditional mean is 19/10 and the conditional self-normalized mean is 2. IPS remains defined on the empty mask and has unconditional mean 5/2. Unsupported positive target mass remains unidentified. The separate policy reward unit has value .6 rather than the logger’s .48.


## 13. Complete a small experiment with an honest report

We have opened scores, updates, solves and lists. None of those local calculations
answers how a complete chosen method performs on later outcomes. An experiment
also needs a target, a permitted information set, a setting-choice rule, a baseline
and an assessment that did not choose the settings.

<!-- diagram:D51 -->

The original synthetic comparison turns the twenty observed ratings into events
at ticks 1–20, adds five validation ratings at 21–25 and six test ratings at 26–31.
All seven items are declared released at tick 0. The final test event belongs to
user 5, who has no earlier observations. This construction tests the implemented
workflow and its fallbacks; the integer ticks are invented information boundaries,
not a real-world collection history.

The complete `evaluation` program compares ranks 1,2,3 and penalties .05,.2 using
validation RMSE. It refits the chosen setting on the twenty-five permitted events,
computes the shrunk-item baseline from the same prefix and assesses both on the
six test events. It chooses rank 2, penalty .05, validation RMSE 1.337272. Test
RMSE is 1.111143 for the item baseline and 1.229386 for MF: the factor method loses.

| Test cohort | Events | Item baseline RMSE | MF RMSE |
| --- | ---: | ---: | ---: |
| All | 6 | 1.111143 | 1.229386 |
| Warm users | 5 | 1.176590 | 1.321735 |
| Cold users | 1 | .697143 | .577423 |

The isolated cold-user number has one event; it is not robust cold-start evidence.
After refitting, user 0's eligible unseen items are 4 and 6. Popularity orders [4,6],
while MF orders [6,4]. A rating-error comparison does not by itself grade this
unobserved list's relevance. The predeclared changed cutoff 18 keeps the same test
period but changes the initial split to 18/7/6. It selects rank 2, penalty .2,
validation RMSE 1.180979; MF test RMSE 1.128322 still exceeds baseline 1.111143.
Choosing a cutoff because its test result looks better would be another selection
using those outcomes, requiring a fresh final assessment.

### Ask a narrower question of actual invoice history

Can known customers' recorded purchases help rank previously unpurchased products
for the next month, within a catalogue chosen from December? This is discovery.
Replenishment would retain previously purchased products and need a different
target. Invoice quantity, price, an explicit rating and a recorded exposure are
different observations; we use unique invoice-time occurrences as counts.

<!-- diagram:D52 -->

[UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail) records
invoices from a UK non-store retailer between 1 December 2010 and 9 December 2011.
The dataset is attributed to Daqing Chen, DOI 10.24432/C5BW33, under CC BY 4.0.
The supplied four-file input bundle in §2 was derived from the original
workbook by the complete data program below; it is not an untraceable resample.
It is sufficient for the study, so workbook re-derivation is optional.
To reproduce the derivation instead, download the complete original ZIP from
the UCI dataset page's Download link and save it as `retail-original.zip`
beside `recommender-retail-data.py`. The required archive SHA256 is
`f5385cbb54bbebf7196389109c6b0621faab0c304e3702548165e71c84aede8b`;
it contains `Online Retail.xlsx`, whose SHA256 is
`43465a06f2ccf7c8b5bd2892bc7defb52f97487934fe93b16ae4c3936424676d`.
The program validates both identities before reading rows; an extracted workbook
alone is not its archive input. Use a fresh derivation directory:

```powershell
python recommender-retail-data.py --archive retail-original.zip --output retail-data-rederived
```

Then substitute `--data retail-data-rederived` in both §2 commands and choose
new readiness/output names. Do not merge it with the supplied input directory.
This alternative reconstructs the input bundle; it is not necessary to inspect
the recorded study. The source workbook's 541,909 rows pass these sequential,
disjoint filters: 135,080 lack a customer
ID; 8,905 have cancellation invoice strings; 0 remaining rows have nonpositive
quantity; 40 have nonpositive price; 1,838 have a nonproduct stock code. The
396,046 retained rows have five-digit stock codes with an optional letter suffix.
Removing cancellation invoices does not prove that a retained purchase was never
returned later.

An occurrence is one distinct (CustomerID, StockCode, InvoiceNo, InvoiceDate).
Repeated copies of that same four-field key collapse. A later invoice or timestamp
remains a new event and increases confidence. The three months contain 65,248
such filtered occurrences across all customers/products. We preserve the workbook's
source-naive calendar times; no time zone was supplied that would justify shifting
their boundaries.

December [2010-12-01,2011-01-01) chooses the 100 products with the largest occurrence
counts, ties by original stock-code lexical order. Among the 615 customers with at
least three distinct selected products, choose 200 by the SHA256 of their canonical
customer-ID strings, ties by ID. This deterministic train-only choice defines the
warm cohort. January and February do not choose the products or customers.
Local U/I IDs keep the matrices readable; they do not guarantee anonymity.

| Role | Catalogue occurrences | Catalogue pairs | Any catalogue purchaser | Requests with eligible discovery truth | Inside / outside discovery pairs |
| --- | ---: | ---: | ---: | ---: | ---: |
| December training | 1930 | 1725 | 200 | 200 | 1725 / 5181 |
| January validation | 533 | 497 | 72 | 68 | 317 / 1757 |
| February test | 410 | 384 | 60 | 48 | 171 / 1185 |

The first row is training coverage, not evaluation performance. Each of the 200
customers issues one hypothetical request at the month's start. Candidates are
the fixed catalogue minus that customer's previously purchased catalogue products.
Truth is a future positive product not present in that customer's entire earlier
filtered product history. Outside-catalogue discoveries are counted separately.
An item omitted by this chosen catalogue cannot be returned by these rules; that
observed purchase coverage is different from ANN recall or causal relevance.
No actual stock-availability log is present, so call the candidates *declared
fixed-catalogue eligibility*.

Sixty-eight January and forty-eight February requests have nonempty eligible
truth. The other requests do not establish that all their candidate items are
irrelevant. Their recall, RR, AP and NDCG are undefined and excluded with those
counts. Precision and fixed-slot fill retain all 200 requests. This avoids changing
the population silently when different denominators happen to favor a model.

### Choose on validation; hold one scorer fixed

<!-- diagram:D53 -->

The four factor settings are, in order, (rank 4,λ.1),(rank 4,λ1),(rank 8,λ.1),(rank 8,λ1).
All use target 1[count>0], confidence 1+2count and the same once-entity penalty.
Initialize training P at zero and Q from `default_rng(19).normal(0,.01,(100,rank))`.
Each setting receives ten complete user-then-item exact-solve sweeps on December.
Every full training objective uses the actual stored P/Q after its recorded sweep.
The final user array was solved before the tenth item update; it is retained as
training state, separately from the request vectors described in section 10.

Every validation score instead solves the customer's December history against
that setting's own final Q. A=QᵀQ+Σ positive(c−1)qqᵀ+λI, b=Σ positive cq;
solve Ap_query=b and score every item qᵀp_query. The absent-pair curvature remains
in QᵀQ. This is the same `retail-final-q-fixed-history-v1` request calculation
later used for test and saved queries, not an extra training sweep. Eligibility
is applied after all 100 scores have been computed; it does not change A.

The two baselines use exactly the same history and eligible catalogue. Popularity
adds occurrence counts over customers. Item cosine uses binary purchased-item
columns, their common full column norms and a sum of similarities over this
customer's unique purchased products; an empty history falls back to popularity.
These are binary implicit conventions, distinct from signed centered explicit
rating neighbors. Stable descending score then original stock-code lexical order
settles every list tie.

Select on January macro NDCG@10 over its 68 qualified requests. Lock both the best
ALS setting and the overall rule among all four settings and both baselines.
An exact metric tie prefers popularity, then item cosine, then lower factor rank
and stronger λ. This choice rule is declared before the numbers exist. Save all
six validation score arrays, masks, complete eligible orders, per-user metrics,
null masks, configurations and their final Q identities with that selection.

Only the chosen ALS configuration is refitted on December+January, once, with the
same initialization and ten sweeps. January adds 533 occurrences; the prefix has
2463 occurrences. Its distinct nonzero count is the actual matrix union, not
1725+497: the same pair can appear in both months. Recompute both baseline states
on this prefix without choosing any new settings. Before parsing February events,
lock the complete three score arrays/orders/masks, final Q, p_query array, counts,
confidences, IDs, selected setting and first lock. These two prospective locks
separate model choice and the final fixed predictions from their later truth.

The ordinary CPU `implicit 0.7.3` comparison is the sixth model fit. Its user×item
CSR stores 1+2n only for positive count cells; package alpha=1 avoids multiplying
confidence twice. It uses rank/λ from validation, ten iterations, float64 factors,
one thread, `use_cg=False`, `use_native=False`, and supplied exact initial P/Q.
The package converts confidence storage to float32; these small integer weights
are exactly representable. Its own final Q is scored by the same direct query
equations. Compare `recalculate_user` on that Q separately without replacing the
library's stored training users. The declared tolerances are absolute 1e−8 and
relative 1e−7; any differences or warnings are reported rather than erased by
another fit. This is a tool correspondence, not a fourth selected test method.

The complete `recommender-retail-study.py` makes the boundary visible in code.
`fit_scratch` saves each full objective and old/current buffer arrays;
`fixed_history_query` returns separate A,b,p_query and all scores;
`ranked_orders` retains full eligible ID lists;
`metrics` reports each named denominator and null cohort.
The main sequence writes the selection lock before its single prefix refit and
the prediction lock before its only February event import. It records every
matrix in typed NPZ and portable JSON. A new output directory is mandatory, even
after failure; another run is a new declared campaign rather than an invisible
retry. The companion data program provides the full filtering/cohort/ID recipe
and separate month files. Neither imports the original unguarded demonstrations.

### Read performance and uncertainty on their declared population

The test report includes the three prefix rules' precision@10, fill, recall, RR,
AP with denominator min(10,R), NDCG, complete per-customer results and all 48
qualified IDs. It preserves the overall validation winner even if the test
ordering reverses. It also retains all validation settings, including weak ones;
the three unchosen factor settings have no invented/refitted test outcomes.

### The recorded comparison

Here are the complete declared alternatives' recorded values. Recall, RR, AP
and NDCG average over the 68 January customers with qualifying discovery truth;
precision and fill average over all 200 requests. K is 10. These are fractions,
not percentages. Displayed values are rounded to six decimal places; the full
report keeps per-customer values, undefined masks and score/order arrays.

| Validation rule | NDCG | Recall | AP | RR | Precision | Fill |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Popularity | 0.172752 | 0.212643 | 0.093969 | 0.290412 | 0.029000 | 1.000000 |
| Binary item cosine | 0.148276 | 0.167517 | 0.089229 | 0.228402 | 0.026500 | 1.000000 |
| ALS rank 4, λ=0.1 | 0.187875 | 0.256901 | 0.105688 | 0.250444 | 0.033000 | 1.000000 |
| ALS rank 4, λ=1 | 0.185113 | 0.244646 | 0.104452 | 0.251062 | 0.033000 | 1.000000 |
| ALS rank 8, λ=0.1 | 0.162610 | 0.207506 | 0.091386 | 0.245577 | 0.028500 | 1.000000 |
| ALS rank 8, λ=1 | 0.162746 | 0.208119 | 0.091817 | 0.242291 | 0.028500 | 1.000000 |

Rank 4 with λ=.1 has the highest validation NDCG and is both the selected
overall rule and the best factor setting. Rank 8 did not improve this declared
criterion. The selected rank-4 model alone was refitted on the prefix; none of
the other three factor settings acquired test numbers through an extra fit.
The actual prefix contains 2,463 occurrences on 2,042 distinct user–item pairs,
so adding the two monthly nonzero counts would have overstated its pair count.

For February, relevance metrics use the 48 qualified customers, while precision
and fill still use all 200 requests. All three prefix rules are retained:

| Test rule | NDCG | Recall | AP | RR | Precision | Fill |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Popularity | 0.133250 | 0.151885 | 0.084224 | 0.197330 | 0.013500 | 1.000000 |
| Binary item cosine | 0.190692 | 0.265749 | 0.113978 | 0.267361 | 0.018000 | 1.000000 |
| ALS rank 4, λ=0.1 | 0.206214 | 0.289096 | 0.124745 | 0.261500 | 0.022000 | 1.000000 |

The selected rule's NDCG exceeds popularity here by 0.072964.
The paired-user 95% percentile interval is
[-0.005122, 0.155089], which includes zero.
The recall difference is 0.137211, with interval
[0.043980, 0.235890]. These intervals
condition on this workflow, selected warm cohort and month; they do not cover
every source of uncertainty or establish causal conversion lift. Item cosine
also overtakes popularity on this test criterion despite lower validation NDCG;
that observation does not retroactively change the locked winner.

Only 171 qualifying test discovery pairs fall in the fixed catalogue, while
1,185 discovered pairs lie outside it. A fill value of 1 means ten slots were
issued; it does not mean ten useful items, complete market coverage, or known
stock availability. The 152 requests without catalogue discovery truth remain
undefined for relevance metrics rather than being assigned false zero labels.

The easier sampled-candidate diagnostic increases the selected rule's NDCG to
0.446449.
It uses the same scores but retains all known positives and at most 20 other
eligible items. That different candidate distribution is why it must not be
substituted for full-catalogue performance or used to choose a setting.

The ordinary direct-solve implementation agrees within the predeclared
absolute 1e−8/relative 1e−7 tolerances. Maximum differences are about 5.77e−15
for training P, 1.61e−15 for Q, 1.50e−15 for direct query scores and 1.28e−15
for package recalculation on its own final Q. Stored training users remain
different from fresh request users. The last item block is stationary to about
1.31e−13, but the user block after that last item update has residual about .606:
ten sweeps are the declared budget, not a joint-convergence claim. The recorded
OpenBLAS warning reports 12 internal threads even though the model's explicit
thread setting is 1; this performance configuration warning was retained.


For the winner minus popularity and best ALS minus popularity, resample the same
qualified customer rows 1000 times with replacement, seed 71. Compute NDCG/recall
differences without refitting. The 2.5/97.5 percentiles are conditional intervals
for this workflow, warm cohort and month. Shared products, temporal dependence
and customer selection limit a broader interpretation. Identical predictions
give an exact zero difference distribution; no qualified cohort gives undefined
comparison rather than a made-up zero interval.

A separate diagnostic keeps every known eligible positive plus up to 20 other
eligible items per customer, seed 83. It uses the unchanged score arrays. Its
easier candidate distribution can change metrics and never chooses a method.
Those other items are not known dislikes merely because they were sampled.
Exact full-catalogue and diagnostic candidate IDs remain distinct records.

### Follow a saved request without retraining

<!-- diagram:D54 -->

Select a saved customer and inspect its prefix occurrences. Each selected item
contributes a target, a confidence and its fixed final item vector. The picture
adds the shared Gram, that history's outer-product corrections and λI, forms b,
solves p_query and exposes a selected candidate's coordinate products and sum.
The same all-item scores feed its stable eligible top-ten list. With no edits,
this route must reproduce the saved prefix prediction array; it is the calculation
that was assessed. If a baseline won validation, show that actual baseline forward
as the selected rule; the ALS inspector remains a measured comparison method.

Editing a count produces a hypothetical fixed-factor request, not a newly fitted
or measured Retail outcome. Its domain is every finite decimal from 0 to
max(20,maximum saved count), preserving every actual occurrence count. Copy the
row before editing; Q, λ, item identities and saved data stay fixed. An empty row
has b=0 and positive λ makes p_query=0, so all factors tie and original stock-code
lexical order becomes visible. Changing the eligible mask changes the list, not
the already formed full-catalogue score vector.

<!-- diagram:D55 -->

A complete saved bundle connects ordered user/item IDs, source/prefix identity,
count conversion, final Q, λ/rank, scorer version, both locks and the arrays' roles.
It keeps stored training P separate from request P_query. Swapping I0/I1 labels
without their factor rows or count columns can produce a numerically plausible
but incorrectly named score. A checksum can bind that wrong bundle too; it does
not establish the intended row mapping. Reject a mismatch against the declared
reference schema, or intentionally permute every corresponding object together.
Invalid factor width, stale prefix or changed scorer cannot leave an earlier
result displayed as a valid current forecast.

One chronological warm-customer comparison cannot establish universal superiority,
causal conversion lift, cold-item performance or repeat replenishment. The value
of this report is the observable question, actual stronger and weaker outcomes,
complete information lineage and visible limits. A larger or different task
needs its own labels, workflow and fresh assessment.

### Complete program: Read one complete synthetic selection and assessment

Construct the full timestamped invented data and split before tuning. Fit each declared rank/penalty on the prefix, select using validation, and refit the selected setting on the allowed expanded prefix before later test. The shrunk-item baseline obeys the same time boundary; warm/cold cohorts remain explicit. Both predeclared cutoffs and the factor method’s weaker test outcomes are retained.

<!-- program:evaluation filename:evaluation.py -->

```python
import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)


def fit_mf(records, users, items, rank=2, penalty=0.1, rate=0.02, epochs=160, seed=7):
    # This objective sums a regularized local term for every observed record.
    # A user/item with d records therefore has its penalty counted d times.
    rng = np.random.default_rng(seed)
    mean = float(np.mean([row[2] for row in records]))
    p, q = rng.normal(0, 0.1, (users, rank)), rng.normal(0, 0.1, (items, rank))
    bu, bi = np.zeros(users), np.zeros(items)
    seen_users, seen_items = {row[0] for row in records}, {row[1] for row in records}
    for user in set(range(users)) - seen_users:
        p[user] = 0.0
    for item in set(range(items)) - seen_items:
        q[item] = 0.0
    history = []
    for epoch in range(epochs):
        rolling_sse = 0.0
        for position in rng.permutation(len(records)):
            user, item, rating = records[position][:3]
            old_p, old_q = p[user].copy(), q[item].copy()
            old_bu, old_bi = bu[user], bi[item]
            error = rating - mean - old_bu - old_bi - old_p @ old_q
            rolling_sse += error**2
            p[user] += rate * (error * old_q - penalty * old_p)
            q[item] += rate * (error * old_p - penalty * old_q)
            bu[user] += rate * (error - penalty * old_bu)
            bi[item] += rate * (error - penalty * old_bi)
        fixed_errors, objective = [], 0.0
        for user, item, rating, *rest in records:
            error = rating - mean - bu[user] - bi[item] - p[user] @ q[item]
            fixed_errors.append(error**2)
            objective += 0.5 * (
                error**2
                + penalty
                * (
                    p[user] @ p[user]
                    + q[item] @ q[item]
                    + bu[user] ** 2
                    + bi[item] ** 2
                )
            )
        if not np.isfinite(objective):
            raise ArithmeticError("Training left the finite numerical range.")
        history.append(
            (
                np.sqrt(rolling_sse / len(records)),
                np.sqrt(np.mean(fixed_errors)),
                objective,
            )
        )
    return dict(
        mean=mean,
        p=p,
        q=q,
        bu=bu,
        bi=bi,
        seen_users=seen_users,
        seen_items=seen_items,
        history=history,
    )


def score(model, user, item):
    known_user = user in model["seen_users"]
    known_item = item in model["seen_items"]
    value = model["mean"]
    if known_user:
        value += model["bu"][user]
    if known_item:
        value += model["bi"][item]
    if known_user and known_item:
        value += model["p"][user] @ model["q"][item]
    return float(value)


# Integer time is an invented event order, not a benchmark timestamp.
base = [
    (int(user), int(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
validation = [(0, 2, 4.0), (1, 1, 2.0), (2, 0, 4.0), (3, 2, 2.0), (4, 4, 2.0)]
test = [(0, 6, 4.0), (1, 5, 3.0), (2, 3, 1.0), (3, 1, 2.0), (4, 0, 2.0), (5, 0, 4.0)]
events = [(*row, time) for time, row in enumerate(base + validation + test, 1)]


def evaluate(cutoff=20, test_start=26):
    train = [row for row in events if row[3] <= cutoff]
    valid = [row for row in events if cutoff < row[3] < test_start]
    held = [row for row in events if row[3] >= test_start]
    if not train or not valid or not held:
        raise ValueError("All three time partitions must be nonempty.")
    configurations = [(rank, penalty) for rank in (1, 2, 3) for penalty in (0.05, 0.2)]
    validation_scores = []
    for rank, penalty in configurations:
        fitted = fit_mf(train, 6, 7, rank=rank, penalty=penalty)
        rmse = np.sqrt(
            np.mean([(score(fitted, u, i) - r) ** 2 for u, i, r, t in valid])
        )
        validation_scores.append((float(rmse), rank, penalty))
    # Ties are resolved by rank, then penalty. Test ratings have not been inspected.
    best_rmse, rank, penalty = min(validation_scores)
    final_train = train + valid
    fitted = fit_mf(final_train, 6, 7, rank=rank, penalty=penalty)
    mean = np.mean([row[2] for row in final_train])

    def item_baseline(item):
        values = [r for u, i, r, t in final_train if i == item]
        return (sum(values) + 3 * mean) / (len(values) + 3)

    print(
        f"split sizes={len(train)}/{len(valid)}/{len(held)}; selected rank={rank}, penalty={penalty}, validation RMSE={best_rmse:.6f}"
    )
    for name, subset in (
        ("all", held),
        ("warm users", [row for row in held if row[0] in fitted["seen_users"]]),
        ("cold users", [row for row in held if row[0] not in fitted["seen_users"]]),
    ):
        if not subset:
            print(name, "n=0; RMSE undefined")
            continue
        baseline = np.sqrt(
            np.mean([(item_baseline(i) - r) ** 2 for u, i, r, t in subset])
        )
        mf = np.sqrt(np.mean([(score(fitted, u, i) - r) ** 2 for u, i, r, t in subset]))
        print(
            f"{name}: n={len(subset)}, shrunk item RMSE={baseline:.6f}, MF RMSE={mf:.6f}"
        )
    # Popularity ranking uses only pre-test events; no test feedback is folded back in.
    history = {(u, i) for u, i, r, t in final_train}
    popular = {i: sum(1 for u, j, r, t in final_train if j == i) for i in range(7)}
    eligible = [i for i in range(7) if (0, i) not in history]
    print("user 0 eligible unseen:", eligible)
    print("popularity order:", sorted(eligible, key=lambda i: (-popular[i], i)))
    print("MF order:", sorted(eligible, key=lambda i: (-score(fitted, 0, i), i)))
    print(
        "Release times are 0 for these seven items; changing that assumption requires request-time eligibility."
    )


evaluate()
print("Changed cutoff, same untouched test period:")
evaluate(cutoff=18)
```

Recorded output for this exact original program and its original execution context:

```text
split sizes=20/5/6; selected rank=2, penalty=0.05, validation RMSE=1.337272
all: n=6, shrunk item RMSE=1.111143, MF RMSE=1.229386
warm users: n=5, shrunk item RMSE=1.176590, MF RMSE=1.321735
cold users: n=1, shrunk item RMSE=0.697143, MF RMSE=0.577423
user 0 eligible unseen: [4, 6]
popularity order: [4, 6]
MF order: [6, 4]
Release times are 0 for these seven items; changing that assumption requires request-time eligibility.
Changed cutoff, same untouched test period:
split sizes=18/7/6; selected rank=2, penalty=0.2, validation RMSE=1.180979
all: n=6, shrunk item RMSE=1.111143, MF RMSE=1.128322
warm users: n=5, shrunk item RMSE=1.176590, MF RMSE=1.198989
cold users: n=1, shrunk item RMSE=0.697143, MF RMSE=0.671405
user 0 eligible unseen: [4, 6]
popularity order: [4, 6]
MF order: [6, 4]
Release times are 0 for these seven items; changing that assumption requires request-time eligibility.
```

### Complete program: Derive the complete offline invoice subset

`original_occurrences` verifies the official archive/member and applies ordered filters before deduplicating the four-key invoice/time occurrence. `select_cohort` uses December only to select fixed products/customers and lexical tie ranks. `prepare` writes separate calendar roles, the private original-ID map, attribution and digests into a new output directory. `load_period` validates one explicitly requested role at a time. Price/quantity are filters rather than confidence magnitude, and future purchases do not reselect the cohort.

<!-- program:recommender-retail-data filename:recommender-retail-data.py -->

```python
"""Prepare the declared offline Retail slice once from the official archive.

Run: python recommender-retail-data.py --archive retail-original.zip --output retail-data
Requires openpyxl. No fit. Each role has its own file so the study can postpone
parsing February events until after both prediction/selection locks.
"""
import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile


ARCHIVE_SHA256 = 'f5385cbb54bbebf7196389109c6b0621faab0c304e3702548165e71c84aede8b'
MEMBER_SHA256 = '43465a06f2ccf7c8b5bd2892bc7defb52f97487934fe93b16ae4c3936424676d'
BOUNDARIES = {'train': ('2010-12-01', '2011-01-01'),
              'validation': ('2011-01-01', '2011-02-01'),
              'test': ('2011-02-01', '2011-03-01')}
EXPECTED_FILTERS = {'allRows': 541909, 'excludedMissingCustomer': 135080,
                    'excludedCancellation': 8905, 'excludedNonpositiveQuantity': 0,
                    'excludedNonpositivePrice': 40, 'excludedNonproductCode': 1838,
                    'retainedProductRowsAllDates': 396046}
EXPECTED_ROLES = {
    'train': {'occurrences': 1930, 'pairs': 1725, 'purchaseUsers': 200, 'truthUsers': 200,
              'truthPairs': 1725, 'outsideTruthPairs': 5181},
    'validation': {'occurrences': 533, 'pairs': 497, 'purchaseUsers': 72, 'truthUsers': 68,
                   'truthPairs': 317, 'outsideTruthPairs': 1757},
    'test': {'occurrences': 410, 'pairs': 384, 'purchaseUsers': 60, 'truthUsers': 48,
             'truthPairs': 171, 'outsideTruthPairs': 1185},
}


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json_exclusive(path, value):
    with Path(path).open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write('\n')


def original_occurrences(archive_path):
    from openpyxl import load_workbook

    archive = Path(archive_path)
    if digest(archive) != ARCHIVE_SHA256:
        raise ValueError('official retained archive identity differs')
    with zipfile.ZipFile(archive) as zipped:
        names = [name for name in zipped.namelist() if name.lower().endswith('.xlsx')]
        if len(names) != 1:
            raise ValueError('one original workbook member is required')
        body = zipped.read(names[0])
    if hashlib.sha256(body).hexdigest() != MEMBER_SHA256:
        raise ValueError('official workbook member identity differs')
    book = load_workbook(io.BytesIO(body), read_only=True, data_only=True)
    counts = Counter({name: 0 for name in EXPECTED_FILTERS})
    events = set()
    try:
        rows = book.active.iter_rows(values_only=True)
        header = list(next(rows))
        expected_header = ['InvoiceNo', 'StockCode', 'Description', 'Quantity',
                           'InvoiceDate', 'UnitPrice', 'CustomerID', 'Country']
        if header != expected_header:
            raise ValueError('original workbook column schema differs')
        for invoice, item, _, quantity, date, price, customer, _ in rows:
            counts['allRows'] += 1
            if customer is None:
                counts['excludedMissingCustomer'] += 1
                continue
            if str(invoice).upper().startswith('C'):
                counts['excludedCancellation'] += 1
                continue
            if quantity is None or quantity <= 0:
                counts['excludedNonpositiveQuantity'] += 1
                continue
            if price is None or price <= 0:
                counts['excludedNonpositivePrice'] += 1
                continue
            stock = str(item)
            if not re.fullmatch(r'\d{5}[A-Za-z]?', stock):
                counts['excludedNonproductCode'] += 1
                continue
            counts['retainedProductRowsAllDates'] += 1
            if not isinstance(date, datetime) or date.tzinfo is not None:
                raise ValueError('original source-naive calendar datetime required')
            if int(customer) != customer:
                raise ValueError('CustomerID must have its canonical integer spelling')
            if datetime(2010, 12, 1) <= date < datetime(2011, 3, 1):
                events.add((str(int(customer)), stock, str(invoice), date.isoformat()))
    finally:
        book.close()
    if dict(counts) != EXPECTED_FILTERS or len(events) != 65248:
        raise ValueError('complete disjoint filters/occurrence count differ from the declared audit')
    return events, dict(counts), names[0]


def select_cohort(events):
    december = [row for row in events if row[3] < '2011-01-01']
    frequency = Counter(row[1] for row in december)
    catalogue = sorted(frequency, key=lambda stock: (-frequency[stock], stock))[:100]
    catalogue_set = set(catalogue)
    history = defaultdict(set)
    for customer, stock, _, _ in december:
        if stock in catalogue_set:
            history[customer].add(stock)
    eligible = [customer for customer, row in history.items() if len(row) >= 3]
    customers = sorted(eligible, key=lambda customer: (hashlib.sha256(customer.encode()).hexdigest(), customer))[:200]
    if len(catalogue) != 100 or len(eligible) != 615 or len(customers) != 200:
        raise ValueError('train-only catalogue/customer selection differs')
    return catalogue, customers


def prepare(archive_path, output_path):
    output = Path(output_path)
    output.mkdir(parents=True, exist_ok=False)
    write_json_exclusive(output/'preparation-start.json',
                         {'sourceSHA256': digest(__file__), 'archiveSHA256': digest(archive_path),
                          'fits': 0, 'purpose': 'New declared offline derivation; never overwrite after failure'})
    events, filters, member = original_occurrences(archive_path)
    catalogue, customers = select_cohort(events)
    selected = set(customers)
    selected_events = sorted((row for row in events if row[0] in selected),
                             key=lambda row: (row[3], row[0], row[1], row[2]))
    user_map = {raw: f'U{index:03d}' for index, raw in enumerate(customers)}
    item_map = {raw: f'I{index:03d}' for index, raw in enumerate(catalogue)}
    outside = sorted({row[1] for row in selected_events}-set(catalogue))
    item_map.update({raw: f'J{index:04d}' for index, raw in enumerate(outside)})
    lex_order = {raw: index for index, raw in enumerate(sorted(catalogue))}
    write_json_exclusive(output/'private-original-id-map.json',
                         {'userLocalToOriginal': {local: raw for raw, local in user_map.items()},
                          'itemLocalToOriginal': {local: raw for raw, local in item_map.items()},
                          'disposition': 'Private transformation evidence; local IDs do not imply anonymization'})
    past = defaultdict(set)
    roles = {}
    for role, (start, end) in BOUNDARIES.items():
        period = [row for row in selected_events if start <= row[3] < end]
        inside = [row for row in period if row[1] in set(catalogue)]
        truth, outside_truth = defaultdict(set), defaultdict(set)
        for customer, stock, _, _ in period:
            if stock not in past[customer]:
                (truth if stock in set(catalogue) else outside_truth)[customer].add(stock)
        counts = {'occurrences': len(inside), 'pairs': len({row[:2] for row in inside}),
                  'purchaseUsers': len({row[0] for row in inside}),
                  'truthUsers': sum(bool(truth[user]) for user in customers),
                  'truthPairs': sum(len(truth[user]) for user in customers),
                  'outsideTruthPairs': sum(len(outside_truth[user]) for user in customers)}
        if counts != EXPECTED_ROLES[role]:
            raise ValueError(f'{role} exact input/truth feasibility differs')
        target = output/f'retail-{role}.csv'
        with target.open('x', encoding='utf-8', newline='') as stream:
            writer = csv.writer(stream, lineterminator='\n')
            writer.writerow(['occurrenceID', 'userID', 'itemID', 'sourceNaiveTime', 'inCatalogue'])
            for index, (customer, stock, _, time) in enumerate(period):
                writer.writerow([f'{role}-{index:06d}', user_map[customer], item_map[stock], time, int(stock in set(catalogue))])
        roles[role] = {'file': target.name, 'sha256': digest(target), 'bytes': target.stat().st_size,
                       'rowsAllItems': len(period), 'counts': counts, 'calendar': [start, end]}
        for customer, stock, _, _ in period:
            past[customer].add(stock)
    manifest = {
        'schema': 'retail-offline-occurrences-v1', 'source': 'UCI Online Retail / Chen 2015',
        'sourceURL': 'https://archive.ics.uci.edu/dataset/352/online+retail',
        'DOI': '10.24432/C5BW33', 'license': 'CC BY 4.0', 'archiveSHA256': ARCHIVE_SHA256,
        'member': member, 'memberSHA256': MEMBER_SHA256, 'derivationSourceSHA256': digest(__file__),
        'filters': filters, 'uniqueThreeMonthSourceOccurrences': len(events),
        'occurrenceUnit': 'unique original(CustomerID,StockCode,InvoiceNo,InvoiceDate); later invoices/times remain repeated events',
        'users': [user_map[raw] for raw in customers], 'items': [item_map[raw] for raw in catalogue],
        'itemOriginalLexicalTieRanks': [lex_order[raw] for raw in catalogue],
        'customerOriginalIDHashes': [hashlib.sha256(raw.encode()).hexdigest() for raw in customers],
        'roles': roles, 'privateIDMapSHA256': digest(output/'private-original-id-map.json'),
        'selection': 'December 100 highest occurrence products/lexical tie; >=3 distinct catalogue products, first 200 canonical CustomerID SHA256/ID tie',
        'limits': ['Derivative subset, not full corpus or anonymity guarantee.',
                   'Counts are invoice-time occurrences, not quantity or price.',
                   'No known exposure, stock availability, dislike or causal conversion label.'],
    }
    write_json_exclusive(output/'retail-manifest.json', manifest)
    return manifest


def load_period(path, expected_sha256, users, catalogue, calendar):
    """No other period file is accessed. Used by the guarded study importer."""
    path = Path(path)
    if digest(path) != expected_sha256:
        raise ValueError('period CSV identity differs from its prepared manifest')
    known_users, known_items = set(users), set(catalogue)
    ids, result = set(), []
    with path.open(encoding='utf-8', newline='') as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != ['occurrenceID', 'userID', 'itemID', 'sourceNaiveTime', 'inCatalogue']:
            raise ValueError('offline occurrence schema differs')
        for row in reader:
            if row['occurrenceID'] in ids or row['userID'] not in known_users:
                raise ValueError('duplicate occurrence or unknown selected user ID')
            ids.add(row['occurrenceID'])
            if not calendar[0] <= row['sourceNaiveTime'] < calendar[1]:
                raise ValueError('event is outside its source-naive calendar role')
            if row['inCatalogue'] not in ('0', '1') or (row['itemID'] in known_items) != (row['inCatalogue'] == '1'):
                raise ValueError('local item identity and catalogue marker disagree')
            result.append(row)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    arguments = parser.parse_args()
    manifest = prepare(arguments.archive, arguments.output)
    print(json.dumps(manifest, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "schema": "retail-offline-occurrences-v1",
  "filters": {
    "allRows": 541909,
    "excludedMissingCustomer": 135080,
    "excludedCancellation": 8905,
    "excludedNonpositiveQuantity": 0,
    "excludedNonpositivePrice": 40,
    "excludedNonproductCode": 1838,
    "retainedProductRowsAllDates": 396046
  },
  "uniqueThreeMonthSourceOccurrences": 65248
}
```

These filter counts belong to the sequential recipe above; each excluded row is counted at its first failing stage. The three-month distinct occurrences are counted before selecting the fixed catalogue/customer cohort. Separate role files and their ordered ID arrays supply the study inputs. The complete manifest records attribution and file digests; the private original-ID map is not a learner download.


### Complete program: Run one locked selection/assessment campaign

`fit_scratch` alternates exact user then item systems for ten sweeps and saves full objectives and training buffers. `fixed_history_query` separately solves fresh users against each fit’s own final Q. `baselines`, `ranked_orders` and `metrics` preserve populations and the null denominator. `run` writes the validation selection lock before prefix refitting and the prediction lock before February labels, then assesses only the three already fixed rules. The sixth ordinary fit compares its own final-Q direct and library-recalculated forwards; it is not another test-selected candidate. `prepare_readiness` binds all local code/data/package/installed-ALS inputs without fitting, and `validate_readiness` rejects an identity change before the six-fit start guard.

<!-- program:recommender-retail-study filename:recommender-retail-study.py -->

```python
"""One predeclared six-fit Retail comparison with two prospective locks.

Run only after all preparation inputs are frozen:
python recommender-retail-study.py --data retail-data --readiness readiness.json --output retail-study
Requires NumPy, SciPy and implicit 0.7.3. Existing output directories are never
reused, including after a failed attempt. No original lesson main is invoked.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import platform
import sys
import warnings

import numpy as np
from scipy.sparse import csr_matrix


SCORER = 'retail-final-q-fixed-history-v1'
CONVERSION = 'positive-occurrence-c1-plus2n-v1'
CONFIGURATIONS = [(4, .1), (4, 1.), (8, .1), (8, 1.)]
ALPHA, SWEEPS, K = 2., 10, 10
COMPARISON_TOLERANCES = {'absolute': 1e-8, 'relative': 1e-7}


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    with Path(path).open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write('\n')


def now():
    return datetime.now(timezone.utc).isoformat()


def array_identity(array):
    array = np.ascontiguousarray(array)
    header = json.dumps({'shape': list(array.shape), 'dtype': array.dtype.str},
                        sort_keys=True, separators=(',', ':')).encode('utf-8')
    return {'shape': list(array.shape), 'dtype': array.dtype.str,
            'sha256': hashlib.sha256(header+b'\n'+array.tobytes()).hexdigest()}


def save_arrays(output, name, arrays):
    """Save full portable arrays and their exact typed-byte identities."""
    arrays = {key: np.ascontiguousarray(value) for key, value in arrays.items()}
    if any(not np.isfinite(value).all() for value in arrays.values()):
        raise FloatingPointError('a saved current array is nonfinite')
    archive = output/f'{name}.npz'
    with archive.open('xb') as stream:
        np.savez_compressed(stream, **arrays)
    portable = output/f'{name}.json'
    write_json(portable, {'arrays': {key: value.tolist() for key, value in arrays.items()},
                          'identities': {key: array_identity(value) for key, value in arrays.items()}})
    return {'npz': archive.name, 'npzSHA256': digest(archive),
            'portable': portable.name, 'portableSHA256': digest(portable),
            'arrays': {key: array_identity(value) for key, value in arrays.items()}}


def validate_counts(counts):
    counts = np.asarray(counts, dtype=np.float64)
    if counts.ndim != 2 or min(counts.shape) < 1 or not np.isfinite(counts).all() or (counts < 0).any():
        raise ValueError('a nonempty finite nonnegative rectangular count matrix is required')
    return counts


def fixed_history_query(counts, final_q, penalty):
    """Read-only inference on final Q, not another training sweep."""
    counts = validate_counts(counts)
    q = np.asarray(final_q, dtype=np.float64)
    if q.ndim != 2 or q.shape[0] != counts.shape[1] or q.shape[1] < 1 or not np.isfinite(q).all():
        raise ValueError('one finite final factor row per item is required')
    if not np.isfinite(penalty) or penalty <= 0:
        raise ValueError('the declared strictly positive once-entity penalty is required')
    base = q.T@q + penalty*np.eye(q.shape[1])
    factors = np.zeros((counts.shape[0], q.shape[1]))
    matrices, rights, residuals = [], [], []
    for user, row in enumerate(counts):
        active = row > 0
        qa = q[active]
        confidence = 1+ALPHA*row[active]
        matrix = base + qa.T@((confidence-1)[:, None]*qa)
        right = qa.T@confidence
        factor = np.linalg.solve(matrix, right)
        factors[user] = factor
        matrices.append(matrix)
        rights.append(right)
        residuals.append(np.max(np.abs(matrix@factor-right)))
    return {'queryP': factors, 'scores': factors@q.T,
            'queryA': np.asarray(matrices), 'queryB': np.asarray(rights),
            'queryResidualInfinity': np.asarray(residuals)}


def full_objective(counts, p, q, penalty):
    confidence, target = 1+ALPHA*counts, (counts > 0).astype(float)
    residual = p@q.T-target
    return float(np.sum(confidence*residual**2) + penalty*(np.sum(p**2)+np.sum(q**2)))


def block_solve(counts, other, penalty):
    """Dense independent equations retain every absent-pair baseline term."""
    factors, residuals = [], []
    for row in counts:
        confidence, target = 1+ALPHA*row, (row > 0).astype(float)
        matrix = other.T@(confidence[:, None]*other)+penalty*np.eye(other.shape[1])
        right = other.T@(confidence*target)
        factor = np.linalg.solve(matrix, right)
        factors.append(factor)
        residuals.append(np.max(np.abs(matrix@factor-right)))
    return np.asarray(factors), float(max(residuals, default=0.))


def stationarity(counts, p, q, penalty):
    weighted = (1+ALPHA*counts)*(p@q.T-(counts > 0))
    return {'userInfinity': float(np.max(np.abs(weighted@q+penalty*p))),
            'itemInfinity': float(np.max(np.abs(weighted.T@p+penalty*q)))}


def initialize(counts, rank):
    return np.zeros((counts.shape[0], rank)), np.random.default_rng(19).normal(0, .01, (counts.shape[1], rank))


def fit_scratch(counts, rank, penalty):
    counts = validate_counts(counts)
    p, q = initialize(counts, rank)
    initial_p, initial_q = p.copy(), q.copy()
    trace = [{'sweep': 0, 'objective': full_objective(counts, p, q, penalty),
              'postItemStationarity': stationarity(counts, p, q, penalty)}]
    snapshots_p, snapshots_q = [p.copy()], [q.copy()]
    for sweep in range(1, SWEEPS+1):
        p, user_residual = block_solve(counts, q, penalty)
        q, item_residual = block_solve(counts.T, p, penalty)
        trace.append({'sweep': sweep, 'objective': full_objective(counts, p, q, penalty),
                      'userResidualAtOwnSolve': user_residual, 'itemResidualAtOwnSolve': item_residual,
                      'postItemStationarity': stationarity(counts, p, q, penalty)})
        snapshots_p.append(p.copy())
        snapshots_q.append(q.copy())
    return {'P': p, 'Q': q, 'initialP': initial_p, 'initialQ': initial_q,
            'sweepP': np.asarray(snapshots_p), 'sweepQ': np.asarray(snapshots_q), 'trace': trace}


def positive_confidence_csr(counts):
    counts = validate_counts(counts)
    users, items = np.nonzero(counts)
    result = csr_matrix((1+ALPHA*counts[users, items], (users, items)), shape=counts.shape)
    result.sum_duplicates()
    result.eliminate_zeros()
    if (result.data == 0).any():
        raise AssertionError('absent cells must not be stored zeros')
    return result


def signed_confidence_csr(values):
    """The separate signed editor has exactly one value per item coordinate."""
    values = np.asarray(values, dtype=float)
    if values.ndim != 2 or min(values.shape) < 1 or not np.isfinite(values).all() or (np.abs(values) > 801).any():
        raise ValueError('finite unique rectangular signed entries in [-801,801] required')
    users, items = np.nonzero(values)
    result = csr_matrix((values[users, items], (users, items)), shape=values.shape)
    result.sum_duplicates()
    result.eliminate_zeros()
    if (result.data == 0).any():
        raise AssertionError('zero editor coordinates must be omitted')
    return result


def baselines(counts):
    binary = (counts > 0).astype(float)
    popularity = counts.sum(axis=0)
    norms = np.sqrt(binary.sum(axis=0))
    denominator = norms[:, None]*norms[None, :]
    similarity = np.divide(binary.T@binary, denominator, out=np.zeros_like(denominator), where=denominator > 0)
    cosine = binary@similarity
    cosine[np.sum(binary, axis=1) == 0] = popularity
    return {'popularity': np.tile(popularity, (len(counts), 1)), 'item-cosine': cosine,
            'popularityState': popularity, 'itemCosineState': similarity}


def ranked_orders(scores, eligible, tie_ranks):
    scores, eligible = np.asarray(scores), np.asarray(eligible, dtype=bool)
    ties = np.asarray(tie_ranks)
    if scores.shape != eligible.shape or ties.shape != (scores.shape[1],) or len(set(ties.tolist())) != len(ties) or not np.isfinite(scores).all():
        raise ValueError('aligned finite scores, eligibility and distinct original lexical tie ranks required')
    result = np.full(scores.shape, -1, dtype=int)
    for user, row in enumerate(scores):
        candidates = np.flatnonzero(eligible[user])
        order = candidates[np.lexsort((ties[candidates], -row[candidates]))]
        result[user, :len(order)] = order
    return result


def metrics(orders, truth, eligible, users, k=K):
    truth, eligible = np.asarray(truth, dtype=bool), np.asarray(eligible, dtype=bool)
    if truth.shape != eligible.shape or orders.shape != truth.shape or len(users) != len(truth) or k < 1:
        raise ValueError('aligned original-row truth/orders/eligibility and positive K required')
    if (truth & ~eligible).any():
        raise ValueError('discovery truth must belong to declared eligible catalogue')
    rows, recommended = [], set()
    for user, order in enumerate(orders):
        candidates = order[order >= 0]
        if len(set(candidates.tolist())) != len(candidates) or set(candidates.tolist()) != set(np.flatnonzero(eligible[user]).tolist()):
            raise ValueError('complete eligible order must contain each permitted ID exactly once')
        slate = candidates[:k]
        hits = truth[user, slate].astype(int)
        relevant = int(truth[user].sum())
        hit_count = int(hits.sum())
        recommended.update(slate.tolist())
        cumulative = np.cumsum(hits)
        discount = 1/np.log2(np.arange(2, len(hits)+2))
        ideal = float(np.sum(1/np.log2(np.arange(2, min(k, relevant)+2)))) if relevant else None
        first = np.flatnonzero(hits)
        rows.append({'userID': users[user], 'truthCount': relevant, 'issued': len(slate),
                     'hits': hit_count, 'precision': hit_count/k, 'fill': len(slate)/k,
                     'recall': hit_count/relevant if relevant else None,
                     'rr': 1/(int(first[0])+1) if relevant and len(first) else (0. if relevant else None),
                     'ap': float(np.sum(hits*cumulative/np.arange(1, len(hits)+1)))/min(k, relevant) if relevant else None,
                     'ndcg': float(hits@discount)/ideal if relevant else None})
    qualified = [row for row in rows if row['truthCount'] > 0]
    macro = {name: float(np.mean([row[name] for row in qualified])) if qualified else None
             for name in ['recall', 'rr', 'ap', 'ndcg']}
    macro.update({name: float(np.mean([row[name] for row in rows])) for name in ['precision', 'fill']})
    return {'K': k, 'allRequests': len(rows), 'qualifiedRequests': len(qualified),
            'undefinedRelevanceRequests': len(rows)-len(qualified),
            'qualifiedUserIDs': [row['userID'] for row in qualified], 'truthPairs': int(truth.sum()),
            'recommendedCatalogueIDs': sorted(recommended), 'catalogueCoverage': len(recommended)/truth.shape[1],
            'macro': macro, 'perUser': rows}


def count_period(events, users, items):
    user_index, item_index = {key: i for i, key in enumerate(users)}, {key: i for i, key in enumerate(items)}
    result = np.zeros((len(users), len(items)))
    for row in events:
        if row['inCatalogue'] == '1':
            result[user_index[row['userID']], item_index[row['itemID']]] += 1
    return result


def past_items(events, users):
    past = {user: set() for user in users}
    for row in events:
        past[row['userID']].add(row['itemID'])
    return past


def discovery_truth(events, prefix_events, users, items):
    past = past_items(prefix_events, users)
    user_index, item_index = {key: i for i, key in enumerate(users)}, {key: i for i, key in enumerate(items)}
    truth = np.zeros((len(users), len(items)), dtype=bool)
    outside = {user: set() for user in users}
    for row in events:
        user, item = row['userID'], row['itemID']
        if item not in past[user]:
            if item in item_index:
                truth[user_index[user], item_index[item]] = True
            else:
                outside[user].add(item)
    return truth, {user: sorted(values) for user, values in outside.items()}


def choose_rule(results):
    """Exact metric ties: popularity, cosine, lower rank, stronger lambda."""
    if any(value['macro']['ndcg'] is None for value in results.values()):
        raise ValueError('no validation-qualified cohort; setting selection is undefined')
    preference = {'popularity': (0, 0, 0), 'item-cosine': (1, 0, 0)}
    for rank, penalty in CONFIGURATIONS:
        preference[f'als-r{rank}-l{penalty:g}'] = (2, rank, -penalty)
    ordered = sorted(results, key=lambda name: (-results[name]['macro']['ndcg'], preference[name]))
    return ordered[0], next(name for name in ordered if name.startswith('als-'))


def bootstrap_difference(first, second, name):
    paired = [(a[name], b[name], a['userID']) for a, b in zip(first['perUser'], second['perUser']) if a[name] is not None]
    if any(a['userID'] != b['userID'] or (a[name] is None) != (b[name] is None)
           for a, b in zip(first['perUser'], second['perUser'])):
        raise ValueError('paired bootstrap requires identical user IDs and null masks')
    if not paired:
        return {'metric': name, 'defined': False, 'mean': None, 'interval': None, 'users': [], 'replicateMeans': []}
    differences = np.array([a-b for a, b, _ in paired])
    indices = np.random.default_rng(71).integers(0, len(differences), (1000, len(differences)))
    means = differences[indices].mean(axis=1)
    return {'metric': name, 'defined': True, 'mean': float(differences.mean()),
            'interval': np.percentile(means, [2.5, 97.5]).tolist(), 'seed': 71, 'replicates': 1000,
            'users': [user for _, _, user in paired], 'perUserDifferences': differences.tolist(),
            'replicateMeans': means.tolist(), 'condition': 'Fixed workflow and train-selected cohort/month; no refits'}


def sampled_eligibility(truth, eligible):
    rng, sampled = np.random.default_rng(83), np.zeros_like(eligible)
    for user in range(len(truth)):
        positive = np.flatnonzero(truth[user])
        other = np.flatnonzero(eligible[user] & ~truth[user])
        chosen = rng.choice(other, min(20, len(other)), replace=False)
        sampled[user, positive], sampled[user, chosen] = True, True
    return sampled


def import_data_module():
    path = Path(__file__).with_name('recommender-retail-data.py')
    spec = importlib.util.spec_from_file_location('new_retail_data', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_readiness(path, data_directory):
    readiness = json.loads(path.read_text(encoding='utf-8'))
    if readiness.get('status') != 'COMPLETE_CONTENT_EXECUTION_INPUTS_READY' or readiness.get('fits') != 6:
        raise ValueError('exact complete readiness record is required before any fit')
    if readiness.get('scorerId') != SCORER or readiness.get('scorerCodeSHA256') != digest(__file__):
        raise ValueError('current scorer bytes differ from declared readiness')
    if readiness.get('manifestSHA256') != digest(data_directory/'retail-manifest.json'):
        raise ValueError('prepared dataset differs from readiness')
    for row in readiness['sources']:
        source = Path(__file__).with_name(row['filename'])
        if digest(source) != row['sha256']:
            raise ValueError(f"declared source differs: {row['filename']}")
    for package, version in readiness['packages'].items():
        if importlib.metadata.version(package) != version:
            raise ValueError(f'ordinary environment differs: {package}')
    if importlib.metadata.version('implicit') != '0.7.3':
        raise ValueError('this ordinary route is specifically implicit 0.7.3')
    for row in readiness['installedPrimarySources']:
        source = Path(importlib.metadata.distribution(row['distribution']).locate_file(row['relativePath']))
        if digest(source) != row['sha256']:
            raise ValueError('installed ordinary implementation differs from readiness')
    return readiness


def prepare_readiness(data_directory, output_path):
    """Create a fresh local identity manifest without a fit or data rewrite.

    A copied historical manifest is evidence of its earlier machine. A new
    local run records its actual downloaded sources and installed package bytes.
    This command never reuses an existing manifest or model output directory.
    """
    sources = sorted(Path(__file__).parent.glob('recommender-*.py'))
    if len(sources) != 10:
        raise ValueError('all ten complete companion source files are required')
    packages = {name: importlib.metadata.version(name) for name in
                ['numpy', 'scipy', 'pandas', 'scikit-surprise', 'implicit', 'openpyxl']}
    if packages['implicit'] != '0.7.3' or packages['scikit-surprise'] != '1.1.5':
        raise ValueError('the taught ordinary route uses implicit 0.7.3 and Surprise 1.1.5')
    distribution = importlib.metadata.distribution('implicit')
    wanted = [file for file in distribution.files if str(file).replace('\\', '/').startswith('implicit/cpu/') and
              (str(file).endswith('als.py') or '/_als.' in str(file).replace('\\', '/'))]
    if not wanted:
        raise ValueError('installed primary ALS implementation files are unavailable')
    record = {'status': 'COMPLETE_CONTENT_EXECUTION_INPUTS_READY', 'at': now(), 'fits': 6,
              'scorerId': SCORER, 'scorerCodeSHA256': digest(__file__),
              'manifestSHA256': digest(data_directory/'retail-manifest.json'),
              'sources': [{'filename': source.name, 'sha256': digest(source)} for source in sources],
              'packages': packages,
              'installedPrimarySources': [{'distribution': 'implicit', 'relativePath': str(file),
                                          'sha256': digest(distribution.locate_file(file))} for file in wanted],
              'configuration': {'orderedSettings': CONFIGURATIONS, 'alpha': ALPHA, 'seed': 19,
                                'sweeps': SWEEPS, 'K': K, 'ordinaryTolerances': COMPARISON_TOLERANCES},
              'scope': 'Fresh local computational identity declaration; not historical execution or statistical acceptance'}
    write_json(output_path, record)
    return record


def fit_ordinary(counts, rank, penalty):
    from implicit.cpu.als import AlternatingLeastSquares
    initial_p, initial_q = initialize(counts, rank)
    model = AlternatingLeastSquares(factors=rank, regularization=penalty, alpha=1.,
                                   dtype=np.float64, use_cg=False, use_native=False,
                                   num_threads=1, iterations=SWEEPS, random_state=19)
    model.user_factors, model.item_factors = initial_p.copy(), initial_q.copy()
    trace, snapshots_p, snapshots_q = [], [], []
    def callback(epoch, elapsed, unused_package_loss):
        trace.append({'sweep': epoch+1, 'objective': full_objective(counts, model.user_factors, model.item_factors, penalty),
                      'postItemStationarity': stationarity(counts, model.user_factors, model.item_factors, penalty)})
        snapshots_p.append(model.user_factors.copy())
        snapshots_q.append(model.item_factors.copy())
    confidence = positive_confidence_csr(counts)
    captured = []
    with warnings.catch_warnings(record=True) as observed:
        warnings.simplefilter('always')
        model.fit(confidence, show_progress=False, callback=callback)
        captured = [str(warning.message) for warning in observed]
    direct = fixed_history_query(counts, model.item_factors, penalty)
    recalculated = model.recalculate_user(np.arange(len(counts)), confidence)
    package_scores = recalculated@model.item_factors.T
    if len(trace) != SWEEPS:
        raise AssertionError('ordinary model did not perform the ten declared updates')
    return {'P': model.user_factors.copy(), 'Q': model.item_factors.copy(),
            'initialP': initial_p, 'initialQ': initial_q, 'sweepP': np.asarray(snapshots_p),
            'sweepQ': np.asarray(snapshots_q), 'trace': trace, 'warnings': captured,
            **direct, 'packageQueryP': recalculated, 'packageQueryScores': package_scores,
            'recalculateDifferenceInfinity': float(np.max(np.abs(package_scores-direct['scores'])))}


def run(data, readiness_path, output):
    readiness = validate_readiness(readiness_path, data)
    output.mkdir(parents=True, exist_ok=False)
    started = {'at': now(), 'programSHA256': digest(__file__), 'readinessSHA256': digest(readiness_path),
               'scorerId': SCORER, 'conversionVersion': CONVERSION, 'fits': 6, 'K': K,
               'configurations': [{'rank': rank, 'lambda': penalty} for rank, penalty in CONFIGURATIONS],
               'seed': 19, 'sweeps': SWEEPS, 'ordinaryTolerance': COMPARISON_TOLERANCES,
               'environment': {'python': sys.version, 'executableSHA256': digest(sys.executable),
                               'platform': platform.platform(), 'packages': readiness['packages']},
               'testEventFileParsed': False}
    write_json(output/'campaign-start.json', started)
    manifest = json.loads((data/'retail-manifest.json').read_text(encoding='utf-8'))
    users, items, ties = manifest['users'], manifest['items'], manifest['itemOriginalLexicalTieRanks']
    if len(users) != 200 or len(items) != 100:
        raise ValueError('the declared fixed training-selected 200x100 cohort is required')
    write_json(output/'ordered-ids.json', {'users': users, 'items': items, 'itemOriginalLexicalTieRanks': ties,
                                         'manifestSHA256': digest(data/'retail-manifest.json')})
    importer = import_data_module()
    def period(role):
        row = manifest['roles'][role]
        return importer.load_period(data/row['file'], row['sha256'], users, items, row['calendar'])
    december = period('train')
    counts = count_period(december, users, items)
    if counts.sum() != 1930 or np.count_nonzero(counts) != 1725:
        raise ValueError('December occurrence/pair protocol differs')
    initial = {'counts': counts, 'confidence': 1+ALPHA*counts, 'target': (counts > 0).astype(int)}
    for rank in [4, 8]:
        p0, q0 = initialize(counts, rank)
        initial[f'initialP_rank{rank}'], initial[f'initialQ_rank{rank}'] = p0, q0
    before_fit = save_arrays(output, 'initial-training-inputs', initial)
    write_json(output/'fit-inputs-before-first-fit.json', {'at': now(), 'source': started,
                                                         'arrays': before_fit, 'orderedIDsSHA256': digest(output/'ordered-ids.json')})
    eligible = counts == 0
    validation_scores, validation_orders, validation_state, fits_done = {}, {}, {}, 0
    base = baselines(counts)
    for name in ['popularity', 'item-cosine']:
        validation_scores[name] = base[name]
        validation_orders[name] = ranked_orders(base[name], eligible, ties)
        validation_state[name] = save_arrays(output, f'validation-{name}',
                                            {'scores': base[name], 'eligibility': eligible, 'orders': validation_orders[name],
                                             'popularityState': base['popularityState'], 'itemCosineState': base['itemCosineState']})
    for rank, penalty in CONFIGURATIONS:
        name = f'als-r{rank}-l{penalty:g}'
        fitted = fit_scratch(counts, rank, penalty)
        fits_done += 1
        query = fixed_history_query(counts, fitted['Q'], penalty)
        order = ranked_orders(query['scores'], eligible, ties)
        validation_scores[name], validation_orders[name] = query['scores'], order
        arrays = {key: value for key, value in fitted.items() if isinstance(value, np.ndarray)}
        arrays.update(query)
        arrays.update({'counts': counts, 'confidence': 1+ALPHA*counts, 'target': (counts > 0).astype(int),
                       'eligibility': eligible, 'orders': order})
        validation_state[name] = save_arrays(output, f'validation-{name}', arrays)
        write_json(output/f'validation-{name}-training.json', {'rank': rank, 'lambda': penalty, 'trace': fitted['trace'],
                                                              'scorerId': SCORER, 'fitsDone': fits_done})
    january = period('validation')
    validation_truth, validation_outside = discovery_truth(january, december, users, items)
    if int(validation_truth.sum()) != 317 or int(np.sum(validation_truth.any(axis=1))) != 68 or sum(map(len, validation_outside.values())) != 1757:
        raise ValueError('January cohort/truth differs from declared feasibility audit')
    validation = {name: metrics(order, validation_truth, eligible, users) for name, order in validation_orders.items()}
    winner, best_als = choose_rule(validation)
    config = next((rank, penalty) for rank, penalty in CONFIGURATIONS if f'als-r{rank}-l{penalty:g}' == best_als)
    truth_record = save_arrays(output, 'validation-truth', {'truth': validation_truth})
    write_json(output/'validation-results.json', {'rules': validation, 'outsideCatalogueTruth': validation_outside,
                                                'truthArray': truth_record, 'all200Requests': True})
    selection_path = output/'selection-lock-before-prefix-and-test.json'
    write_json(selection_path, {'at': now(), 'scorerId': SCORER, 'scorerCodeSHA256': digest(__file__),
                               'conversionVersion': CONVERSION, 'alpha': ALPHA,
                               'countSHA256': array_identity(counts), 'orderedIDsSHA256': digest(output/'ordered-ids.json'),
                               'allSixValidationState': validation_state, 'validation': validation,
                               'bestALS': {'name': best_als, 'rank': config[0], 'lambda': config[1]},
                               'overallWinner': winner, 'tieRule': 'popularity,cosine,lowerRank,strongerLambda',
                               'fitsDone': fits_done, 'prefixRefitStarted': False, 'testEventFileParsed': False})
    january_counts = count_period(january, users, items)
    prefix = counts+january_counts
    if january_counts.sum() != 533 or np.count_nonzero(january_counts) != 497 or prefix.sum() != 2463:
        raise ValueError('prefix count conversion differs')
    prefix_inputs = save_arrays(output, 'prefix-inputs-before-refit',
                                {'counts': prefix, 'confidence': 1+ALPHA*prefix, 'target': (prefix > 0).astype(int),
                                 'initialP': initialize(prefix, config[0])[0], 'initialQ': initialize(prefix, config[0])[1]})
    write_json(output/'prefix-role-before-refit.json', {'selectionLockSHA256': digest(selection_path), 'arrays': prefix_inputs,
                                                      'occurrences': int(prefix.sum()), 'nonzeroPairs': int(np.count_nonzero(prefix)),
                                                      'FebruaryEventsParsed': False})
    fitted = fit_scratch(prefix, *config)
    fits_done += 1
    query = fixed_history_query(prefix, fitted['Q'], config[1])
    test_eligible = prefix == 0
    test_base = baselines(prefix)
    test_scores = {'popularity': test_base['popularity'], 'item-cosine': test_base['item-cosine'], best_als: query['scores']}
    test_orders = {name: ranked_orders(score, test_eligible, ties) for name, score in test_scores.items()}
    prefix_arrays = {key: value for key, value in fitted.items() if isinstance(value, np.ndarray)}
    prefix_arrays.update(query)
    prefix_arrays.update({'counts': prefix, 'confidence': 1+ALPHA*prefix, 'target': (prefix > 0).astype(int),
                          'eligibility': test_eligible, 'orders': test_orders[best_als],
                          'popularityScores': test_scores['popularity'], 'popularityOrders': test_orders['popularity'],
                          'itemCosineScores': test_scores['item-cosine'], 'itemCosineOrders': test_orders['item-cosine'],
                          'popularityState': test_base['popularityState'], 'itemCosineState': test_base['itemCosineState']})
    prefix_saved = save_arrays(output, 'locked-prefix-state', prefix_arrays)
    write_json(output/'prefix-training.json', {'config': {'rank': config[0], 'lambda': config[1]}, 'trace': fitted['trace']})
    prediction_path = output/'prediction-lock-before-test-truth.json'
    write_json(prediction_path, {'at': now(), 'selectionLockSHA256': digest(selection_path), 'scorerId': SCORER,
                                'scorerCodeSHA256': digest(__file__), 'conversionVersion': CONVERSION, 'alpha': ALPHA,
                                'orderedIDsSHA256': digest(output/'ordered-ids.json'), 'chosenConfig': {'rank': config[0], 'lambda': config[1]},
                                'savedArrays': prefix_saved, 'K': K, 'fitsDone': fits_done, 'testEventFileParsed': False})
    ordinary = fit_ordinary(prefix, *config)
    fits_done += 1
    ordinary_arrays = {key: value for key, value in ordinary.items() if isinstance(value, np.ndarray)}
    ordinary_saved = save_arrays(output, 'ordinary-prefix-state', ordinary_arrays)
    differences = {key: float(np.max(np.abs(ordinary[key]-fitted[key]))) for key in ['P', 'Q']}
    differences['queryScores'] = float(np.max(np.abs(ordinary['scores']-query['scores'])))
    differences['packageRecalculateScores'] = ordinary['recalculateDifferenceInfinity']
    agreement = {key: bool(np.allclose(ordinary[key], fitted[key], atol=COMPARISON_TOLERANCES['absolute'],
                                      rtol=COMPARISON_TOLERANCES['relative'])) for key in ['P', 'Q']}
    agreement['directQueryScores'] = bool(np.allclose(ordinary['scores'], query['scores'], **{'atol': 1e-8, 'rtol': 1e-7}))
    agreement['packageRecalculateScores'] = bool(np.allclose(ordinary['packageQueryScores'], ordinary['scores'], atol=1e-8, rtol=1e-7))
    write_json(output/'ordinary-correspondence.json', {'package': 'implicit 0.7.3', 'arrays': ordinary_saved,
                                                      'differencesInfinity': differences, 'tolerances': COMPARISON_TOLERANCES,
                                                      'agreement': agreement, 'trace': ordinary['trace'], 'warnings': ordinary['warnings'],
                                                      'fitsDone': fits_done, 'scoreConvention': SCORER,
                                                      'differencesAreRecordedNotRepairedByRefitting': True})
    # The only February label importer occurs after both immutable locks.
    february = period('test')
    test_truth, test_outside = discovery_truth(february, december+january, users, items)
    if int(test_truth.sum()) != 171 or int(np.sum(test_truth.any(axis=1))) != 48 or sum(map(len, test_outside.values())) != 1185:
        raise ValueError('February cohort/truth differs from declared feasibility audit')
    test_results = {name: metrics(order, test_truth, test_eligible, users) for name, order in test_orders.items()}
    truth_saved = save_arrays(output, 'test-truth-after-lock', {'truth': test_truth})
    comparison = {name: {metric: bootstrap_difference(test_results[name], test_results['popularity'], metric)
                         for metric in ['ndcg', 'recall']} for name in set([winner, best_als])}
    sampled = sampled_eligibility(test_truth, test_eligible)
    sampled_orders = {name: ranked_orders(score, sampled, ties) for name, score in test_scores.items()}
    sampled_metrics = {name: metrics(order, test_truth, sampled, users) for name, order in sampled_orders.items()}
    sampled_arrays = {'eligibility': sampled}
    sampled_arrays.update({f'{name}-orders': order for name, order in sampled_orders.items()})
    sampled_saved = save_arrays(output, 'sampled-candidate-diagnostic', sampled_arrays)
    report = {'question': 'Next-month previously unpurchased products inside the fixed December-selected catalogue/cohort',
              'scorerId': SCORER, 'manifestSHA256': digest(data/'retail-manifest.json'), 'fitsDone': fits_done,
              'validation': validation, 'bestALS': best_als, 'overallWinner': winner,
              'selectionLockSHA256': digest(selection_path), 'predictionLockSHA256': digest(prediction_path),
              'prefixCounts': {'occurrences': int(prefix.sum()), 'nonzeroPairs': int(np.count_nonzero(prefix))},
              'test': test_results, 'truthArray': truth_saved, 'outsideCatalogueTruth': test_outside,
              'pairedUserBootstrap': comparison, 'sampledCandidateDiagnostic': {'seed': 83, 'upToOtherItems': 20,
                                                                             'arrays': sampled_saved, 'metrics': sampled_metrics,
                                                                             'usedForSelection': False},
              'ordinaryAgreement': agreement, 'ordinaryDifferences': differences,
              'savedBrowser': {'state': prefix_saved, 'IDs': 'ordered-ids.json', 'lambda': config[1], 'alpha': ALPHA,
                              'countDomain': [0, max(20., float(prefix.max()))], 'winnerRule': winner,
                              'ALSInspectorRole': 'winner' if winner == best_als else 'measured comparison method'},
              'limits': ['One fixed calendar split and train-selected warm cohort.',
                         'Null relevance requests remain undefined; all 200 requests remain in precision/fill coverage.',
                         'Outside catalogue counts are observed purchase coverage, not ANN recall or causal relevance.',
                         'No known exposure, stock availability, dislike or propensity follows from missing purchases.',
                         'Paired intervals condition on this workflow/cohort/month and do not model temporal/customer dependence.']}
    if fits_done != 6:
        raise AssertionError('the declared model fit budget differs')
    write_json(output/'study-results.json', report)
    write_json(output/'campaign-complete.json', {'at': now(), 'startSHA256': digest(output/'campaign-start.json'),
                                               'reportSHA256': digest(output/'study-results.json'), 'fitsDone': fits_done,
                                               'selectionLockSHA256': digest(selection_path), 'predictionLockSHA256': digest(prediction_path)})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', required=True, type=Path)
    parser.add_argument('--readiness', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--prepare-readiness', type=Path,
                        help='Write a new exact local source/environment manifest, without fitting')
    arguments = parser.parse_args()
    if arguments.prepare_readiness:
        if arguments.readiness or arguments.output:
            parser.error('readiness preparation is a separate no-fit operation')
        report = prepare_readiness(arguments.data, arguments.prepare_readiness)
    else:
        if arguments.readiness is None or arguments.output is None:
            parser.error('a study run requires --readiness and a new --output directory')
        report = run(arguments.data, arguments.readiness, arguments.output)
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
```

Recorded output selection (the complete JSON output is in the common file index):

```json
{
  "question": "Next-month previously unpurchased products inside the fixed December-selected catalogue/cohort",
  "scorerId": "retail-final-q-fixed-history-v1",
  "fitsDone": 6,
  "overallWinner": "als-r4-l0.1",
  "bestALS": "als-r4-l0.1",
  "validationNDCG": {
    "popularity": 0.17275238361120773,
    "item-cosine": 0.1482762189929301,
    "als-r4-l0.1": 0.18787549523481256,
    "als-r4-l1": 0.18511265151301878,
    "als-r8-l0.1": 0.16260972341202068,
    "als-r8-l1": 0.16274644413638836
  },
  "testNDCG": {
    "popularity": 0.13325010201834894,
    "item-cosine": 0.19069171750019362,
    "als-r4-l0.1": 0.20621371932293833
  }
}
```

These are the selected setting and the complete declared rules, not an extra search over test outcomes. Read them with the population tables and paired intervals above. Full files retain score/order/null arrays, stored training buffers, separate final-Q request vectors and both prospective locks. The stored warning accompanies this execution; it is not removed by another fit.


## 14. Practice, explain and transfer the decision

Close the solutions for your first attempt. Before calculating, name the evidence
available to the request, the target, the denominator and the objective. A score
can be algebraically correct while answering the wrong question. The early
missing-versus-zero checkpoint remains useful: in [0, missing, 4], identify the
mask and explain why the observed mean is 2 rather than 4.

### A. Audit a past request

At time 20, a learner asks for recommendations. A candidate was released at 23,
similarities were computed from events through 30, and a validation setting was
chosen using events 21–25. Which parts may serve the time-20 request? Repair the
replay without using later information.

<details><summary>Get a hint</summary>

A valid configuration choice and a valid historical information set are separate
constraints. Put each availability time on the request's clock.

</details>
<details><summary>Show explained solution</summary>

The unreleased candidate is ineligible. Similarities through 30 include future
interactions. The setting chosen using events 21–25 was also unavailable at 20
unless a separate earlier experiment had already fixed it. Use configuration
decisions and fitted artifacts available by 20, and filter releases at or before
20. Alternatively move the request after validation, refit that allowed prefix
and assess on later untouched outcomes. That is a different experiment, so its
report must name the changed request and information boundary.

</details>

### B. Explain a signed neighbor prediction

A user's baseline is 3. Two usable neighbors have ratings 1 and 5, with signed
weights −.5 and .25. Calculate the centered prediction. What happens if both
neighbors fail the support rule?

<details><summary>Get a hint</summary>

Subtract the declared baseline before weighting; the denominator is the sum of
absolute weights, not their signed sum.

</details>
<details><summary>Show explained solution</summary>

The residuals are −2 and 2. Contributions are (−.5)(−2)=1 and .25×2=.5.
Their sum 1.5 divided by |−.5|+|.25|=.75 gives a residual prediction of 2.
Add the baseline to obtain 5. If neither neighbor is accepted, the denominator
is zero and the declared fallback is 3. A negative similarity reverses a
residual's direction; it is neither a negative purchase count nor the library's
positive-neighbor policy.

</details>

### C. Give a different rank-one completion

Only the two diagonal entries of a 2×2 matrix are observed, both equal to 1.
Construct another completion and prove its rank. Does similar validation
performance at ranks 2 and 4 prove an intrinsic population rank of 2?

<details><summary>Get a hint</summary>

Choose nonzero off-diagonal entries whose product is 1. Separate an algebraic
statement about this completed matrix from a finite experiment's evidence.

</details>
<details><summary>Show explained solution</summary>

The matrix [[1,3],[1/3,1]] has determinant 1−3×(1/3)=0 and is nonzero, so its
rank is one. Its second row is one-third of its first. It fits both observations
while choosing different missing values. Similar validation scores only say that
the particular trained settings were not distinguished on that evaluation.
Noise, sample size, optimization and regularization can obscure differences;
they do not identify the rank of an unobserved population matrix.

</details>

### D. Recompute a simultaneous gradient step

Use p=(.2,.4), q=(−.3,.5), user bias .05, item bias .1, rating 2, mean 3,
λ=.2 and η=.1 in the local gradient objective. Determine the error's sign and
all updated values. Explain which buffers a finite-difference comparison needs.

<details><summary>Get a hint</summary>

The old score is 3.29. Use its single old error for every gradient before
recomputing any score.

</details>
<details><summary>Show explained solution</summary>

The error r−s is −1.29. Loss gradients for (p₁,p₂,q₁,q₂,bᵤ,bᵢ) are
(−.347,.725,.198,.616,1.3,1.31). Subtracting η times these gradients gives
p′=(.2347,.3275), q′=(−.3198,.4384), bᵤ′=−.08 and bᵢ′=−.031.
The new score is about 2.957519; the declared local objective falls from .8873
to .504838. The complete changed loss, including its local penalty, is the
finite-difference target. Using p′ inside q's update would instead calculate
another operation and would not equal these simultaneous gradients. The
retained changed-program output demonstrates that comparison without requiring
another historical fit.

</details>

### E. Match the penalty to the equation

One user has four observed records. One objective includes λ‖p‖²/2 inside
each record; another includes it once per entity. Which normal-system diagonal
matches the first objective? What changes for a user with no records?

<details><summary>Get a hint</summary>

Collect all copies of this user's penalty before differentiating.

</details>
<details><summary>Show explained solution</summary>

Four copies contribute 4λ‖p‖²/2, so the normal system adds 4λI rather than λI.
With no records, this degree-weighted objective has no term involving p and
does not identify it uniquely. Selecting p=0 is then a convention. A positive
once-entity penalty still exists for an empty user and uniquely minimizes that
block at zero. Therefore matching a parameter named “regularization” is
insufficient; match the complete summed objective and its population.

</details>

### F. Solve a changed implicit block

Keep item vectors (1,0), (0,1), (1,1), but use counts (0,3,1), α=1 and λ=2.
Form targets, confidence, A and b; solve for p and calculate the block objective.
What happens if all counts become zero?

<details><summary>Get a hint</summary>

The first pair still contributes confidence 1 to curvature. Only positive-target
pairs enter the right-hand side.

</details>
<details><summary>Show explained solution</summary>

Targets are (0,1,1) and confidence is (1,4,2). The outer products plus 2I give
A=[[5,2],[2,8]], while b=(2,6). With determinant 36, solving yields
p=(1/9,13/18). Its scores are (1/9,13/18,5/6), approximately
(.111111,.722222,.833333). The full weighted squared residual plus penalty is
13/9, including the unobserved first pair. The augmented least-squares route
agrees with this normal system. With all counts zero, b=0 and positive λ gives
p=0; dropping every unobserved pair would describe a different objective.

</details>

### G. Diagnose a reversed pair

Use p=(1,.5), positive item qᵢ=(.5,1), sampled item qⱼ=(1.5,0), η=.1 and
λ=.1. Calculate the old gap and one updated gap. Must one update correct the
order or improve full-list NDCG?

<details><summary>Get a hint</summary>

Use g=σ(−Δ), and keep all three old vectors until every update is calculated.

</details>
<details><summary>Show explained solution</summary>

Old scores are 1 and 1.5, so Δ=−.5 and g≈.622459. The new vectors are
p′≈(.927754,.557246), qᵢ′≈(.557246,1.021123) and
qⱼ′≈(1.422754,−.031123). Their new gap is about −.216619. The local loss falls
from 1.211577 to 1.034794, yet the pair remains reversed. This is progress on
one regularized sampled comparison, not a complete order repair or a guarantee
about held-out full-list quality. The sampler and assessment populations still
matter.

</details>

#### Coding transfer: change the training population

Copy the complete BPR source into your local source directory, but do not run
its training main. Implement a wrapper `population_summary` that builds the
declared occurrence/eligibility population and computes its probability-weighted
local loss at fixed factors. Use binary history [[1,0,1,0],[0,1,0,0],[1,1,0,0]],
six occurrence records a=(U0,I0), b=(U0,I2), c=(U1,I1), d=(U2,I0), e=(U2,I1)
and f=(U0,I0), and eligible items [I0,I1,I2]. Record f is a separate positive
occurrence, not a new positive pair. Use p=[[1],[2],[3]], q=[[0],[1],[2],[100]],
λ=0; I3's large value must not enter any route. Modify the wrapper to support
both uniform routes and uniform eligible users. Do not change the full observed
history when filtering items.

Success means seven routes with occurrence IDs [a,b,c,c,d,e,f], user masses
[3/7,2/7,2/7] for uniform routes and [1/3,1/3,1/3] for uniform users, and
a weighted loss agreeing with direct scalar softplus on the seven gaps.
Deduplicating (U0,I0) is a bug: it silently changes the objective. An empty
eligible set must return unavailable, without a division by zero or a fit.
The complete solution file `practice-bpr-population.py` is a separate practice
download; it does not replace or run the reference trainer.

<details><summary>Get a coding hint</summary>

Use `occurrence_population` for legal routes, retaining its `records`, then
`sampler_distribution` for probabilities. Compute the loss from each actual
route and its probability, rather than averaging distinct tuple values.
For the independent scalar check, the negatives of the seven gaps are
[1,−1,−2,2,6,3,1]. Uniform users require a mean within each user's routes,
then a mean of the three user means.

</details>
<details><summary>Show coding solution</summary>

This wrapper changes actual input records and training-objective weights.
The reference helpers expose the same objective without invoking a trainer.
The assertions use a separate scalar softplus and verify occurrence IDs,
negative eligibility, both user masses and the null case. Keep the practice
file beside the reference file and run `python practice-bpr-population.py`,
or pass `--sources` with that directory.

<!-- practice-solution:G filename:practice-bpr-population.py -->

```python
"""Changed occurrence/eligibility objective; no sampling, updates or fit.

Keep this file beside recommender-bpr-training.py, or pass --sources DIRECTORY.
Run: python practice-bpr-population.py
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path


def load_bpr(directory):
    path = directory / 'recommender-bpr-training.py'
    spec = importlib.util.spec_from_file_location('practice_bpr_reference', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # Its guarded main is not called.
    return module


def population_summary(module, binary, occurrences, eligible, convention):
    population = module.occurrence_population(binary, occurrences, eligible)
    triples = population['triples']
    distribution = module.sampler_distribution(triples, convention)
    if not distribution['available']:
        return {'available': False, 'records': population['records']}
    # Fixed one-coordinate factors make this a population/objective calculation.
    # I3 has a large coordinate but is outside the declared eligible set.
    users, items = [[1.], [2.], [3.]], [[0.], [1.], [2.], [100.]]
    losses = [module.local_objective(users[u], items[i], items[j], 0.)
              for u, i, j in triples]
    weighted_loss = math.fsum(weight * loss for weight, loss in
                              zip(distribution['tripleProbabilities'], losses))
    return {'available': True, 'triples': triples, 'records': population['records'],
            'userMass': distribution['userProbabilities'],
            'probabilities': distribution['tripleProbabilities'], 'loss': weighted_loss}


def main(directory):
    module = load_bpr(directory)
    binary = [[1, 0, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]
    occurrences = [{'id': name, 'user': user, 'item': item} for name, user, item in
                   [('a', 0, 0), ('b', 0, 2), ('c', 1, 1),
                    ('d', 2, 0), ('e', 2, 1), ('f', 0, 0)]]
    eligible = [1, 1, 1, 0]
    triples = population_summary(module, binary, occurrences, eligible, 'uniform-triple')
    users = population_summary(module, binary, occurrences, eligible, 'uniform-user')
    expected = [(0, 0, 1), (0, 2, 1), (1, 1, 0), (1, 1, 2),
                (2, 0, 2), (2, 1, 2), (0, 0, 1)]
    assert triples['triples'] == expected
    assert [row['positiveOccurrenceID'] for row in triples['records']] == ['a', 'b', 'c', 'c', 'd', 'e', 'f']
    assert all(abs(triples['userMass'][u] - wanted) < 1e-14
               for u, wanted in enumerate([3/7, 2/7, 2/7]))
    assert all(abs(users['userMass'][u] - 1/3) < 1e-14 for u in range(3))
    assert all(binary[u][j] == 0 and eligible[i] and eligible[j] for u, i, j in expected)
    # Independent scalar softplus for each of the seven actual score gaps.
    softplus = lambda x: max(0., x) + math.log1p(math.exp(-abs(x)))
    losses = [softplus(x) for x in [1., -1., -2., 2., 6., 3., 1.]]
    assert abs(triples['loss'] - math.fsum(losses)/7) < 1e-14
    expected_user_loss = ((losses[0]+losses[1]+losses[6])/3 +
                          (losses[2]+losses[3])/2 + (losses[4]+losses[5])/2)/3
    assert abs(users['loss'] - expected_user_loss) < 1e-14
    empty = population_summary(module, binary, occurrences, [0, 0, 0, 0], 'uniform-triple')
    assert empty == {'available': False, 'records': []}
    print(json.dumps({'routes': expected, 'uniformTripleUserMass': triples['userMass'],
                      'uniformUserMass': users['userMass'], 'uniformTripleLoss': triples['loss'],
                      'uniformUserLoss': users['loss'], 'emptyAvailable': empty['available']}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, default=Path(__file__).resolve().parent)
    main(parser.parse_args().sources)
```

Recorded output from this changed-input practice, with fixed factors and no training fit:

```json
{
  "routes": [
    [
      0,
      0,
      1
    ],
    [
      0,
      2,
      1
    ],
    [
      1,
      1,
      0
    ],
    [
      1,
      1,
      2
    ],
    [
      2,
      0,
      2
    ],
    [
      2,
      1,
      2
    ],
    [
      0,
      0,
      1
    ]
  ],
  "uniformTripleUserMass": {
    "0": 0.42857142857142855,
    "1": 0.2857142857142857,
    "2": 0.2857142857142857
  },
  "uniformUserMass": {
    "0": 0.3333333333333333,
    "1": 0.3333333333333333,
    "2": 0.3333333333333333
  },
  "uniformTripleLoss": 2.0349577316217267,
  "uniformUserLoss": 2.2107959611945325,
  "emptyAvailable": false
}
```

The repeated U0/I0 route retains its own f identity. Under uniform users,
each of U0's three routes has weight 1/9; each U1/U2 route has weight 1/6.
Changing those weights changes the loss being optimized even before an update.
No held-out quality conclusion follows from a population calculation.

</details>

### H. Keep the evaluator's denominator fixed

With relevant items {0,1}, list [4,1,2,0,3] and K=2, calculate precision, recall,
reciprocal rank, AP and NDCG. Move item 1 to the first slot. If retrieval entirely
omits item 0, can reranking reach recall 1?

<details><summary>Get a hint</summary>

Use the lesson's AP denominator min(K,R). The ideal contains both eligible
relevant items even if the candidate generator misses one.

</details>
<details><summary>Show explained solution</summary>

Initially one of two returned items is relevant: precision=recall=.5. Its first
hit is at rank 2, so RR=.5. AP=(1/2)/2=.25. DCG=1/log₂3 and
IDCG=1+1/log₂3, giving NDCG≈.386853. With item 1 first, precision and recall
remain .5, RR=1, AP=.5 and NDCG≈.613147. If item 0 is absent from candidates,
only one of the two relevant items can be returned, giving a recall ceiling of
.5. Reducing R to the retrieved relevant set conceals that candidate failure.

</details>

### I. Explain a new item's limits

A metadata map gives a new item a factor vector. A new user has no history or
declared preferences. Can a dot product establish individual personalization?
Propose a defensible first list and an assessment.

<details><summary>Get a hint</summary>

Cold-item and cold-user problems are different missing inputs. Ask what evidence
supports the user port, not only whether the arrays have matching widths.

</details>
<details><summary>Show explained solution</summary>

The map supplies the item representation, not a justified user representation.
An arbitrary p does not establish this person's taste. One possible response is
an eligible popular list with subject diversity and optional lightweight
onboarding; a contextual baseline is another defensible choice if its inputs
are declared. Assess held-out new users and items using metadata available at
request time, report fallback coverage, and measure the intended useful outcome.
Several policies can be reasonable. Their evidence, permissions and outcome
criteria determine whether the proposal is sound.

</details>

### J. Change the logging mixture

Rewards occur with probabilities .4 for action A and .8 for B. Logging chooses
each action with probability .5; the target chooses A with .25 and B with .75.
Calculate raw and IPS expectations and the one-request IPS variance. Diagnose
logging B=0 when the target still gives B positive probability.

<details><summary>Get a hint</summary>

Reward weights are .5 for A and 1.5 for B. Enumerate action and reward before
subtracting the squared expectation from the second moment.

</details>
<details><summary>Show explained solution</summary>

Raw expectation is .5×.4+.5×.8=.6. The target/IPS expectation is
.25×.4+.75×.8=.7. The weighted second moment is
.5×.4×.5²+.5×.8×1.5²=.95, so variance=.95−.7²=.46. If B has no logging
support, the logs cannot identify its reward distribution under a target that
chooses B. Knowing B's toy reward probability from the question does not make
that quantity available in an actual A-only dataset.

</details>

### K. Interpret the changed experiment report

The retained complete experiment includes a predeclared cutoff-18 comparison
with test_start=26. Read its saved output. Report split sizes, selected settings,
baseline and factor errors and cold-user count. Then propose a fresh assessment
for a newly released item.

<details><summary>Get a hint</summary>

The comparison is already declared and printed. It is not a search through test
results for a favorable cutoff. Distinguish data used to select from data used
to assess.

</details>
<details><summary>Show explained solution</summary>

The split is 18/7/6. Validation selects rank 2 and penalty .2 with RMSE≈1.180979.
Test RMSE is about 1.111143 for the shrunk-item baseline and 1.128322 for factors.
There are five warm-user events and one cold-user event; the latter factor error
is about .671405. This tiny synthetic outcome supports neither population
superiority nor robust cold-start performance nor causal benefit. It preserves
the weaker factor result instead of disguising it.

For a new-item assessment, reserve items released after fitting and use only
metadata available before each request. Keep their later interactions out of
factor fitting and feature construction until the declared boundary permits
them. Compare an explicit content/hybrid fallback with an eligible
nonpersonalized/content baseline, report new-item coverage and the intended
outcome or ranking metric, and retain a later untouched period. Future rating
means are not legal initial metadata.

</details>

### L. Calculate the user-centered alternative

Use ratings [[5,1,missing],[4,2,3],[1,5,5]]. Predict U0's missing I2 rating using
full-training user means, cosine of user-mean-centered values on common items,
minimum common support 2 and all signed eligible neighbors. Compare a
positive-neighbor-only policy.

<details><summary>Get a hint</summary>

The first two items form both overlaps. Do not include the missing target in
U0's mean. Center similarities with the declared full-row means.

</details>
<details><summary>Show explained solution</summary>

Means are 3, 3 and 11/3. U0's overlap residuals are [2,−2]; U1's are [1,−1],
so their similarity is 1. U2's overlap residuals are [−8/3,4/3], giving
similarity −3/√10. Their I2 residuals are 0 and 5−11/3=4/3.
The prediction is therefore
3+[1×0+(−3/√10)×(4/3)]/[1+3/√10]
=3−4/(√10+3)≈2.350889. Positive-only selection retains U1 and gives 3.
Centering each pair by its overlap means changes the similarity definition;
silently switching to that Pearson convention is not evidence of parity.

</details>

### M. Distinguish score invariance from penalty invariance

Let p=q=(1,0) and A=diag(2,1). Use p′=Ap and q′=A⁻ᵀq. If the dot product
stays unchanged, must a positive once-entity L2 objective stay unchanged?

<details><summary>Get a hint</summary>

Calculate the two new vectors and their squared norms separately. Compare with
an orthogonal rotation.

</details>
<details><summary>Show explained solution</summary>

p′=(2,0) and q′=(.5,0) still have dot product 1. The squared-norm sum changes
from 1+1=2 to 4+.25=17/4. Thus unchanged predictions do not preserve a
positive isotropic L2 penalty under every invertible coordinate transformation.
An orthogonal rotation preserves both dot products and norms, leaving that
objective unchanged. Anonymous factor coordinates therefore lack a unique
semantic axis even though regularization limits some rescaling freedoms.

</details>

### N. Keep the history step simultaneous

Take p=(0,0), q=(1,0), two unique history vectors y₀=(1,0), y₁=(0,1), mean 3,
rating 5, η=.1 and λ=0. Hold the biases fixed at zero for this factor-only
calculation. Compute one simultaneous factor/history update and diagnose using
the new q inside y's update. What does a duplicated rating occurrence change?

<details><summary>Get a hint</summary>

h=(1,1)/√2 and e=2−1/√2. Every derivative reads the old h and old q.

</details>
<details><summary>Show explained solution</summary>

The old score is 3+1/√2. With e=2−1/√2,
p′=(.1e,0), q′=(1+.1e/√2,.1e/√2),
y₀′=(1+.1e/√2,0) and y₁′=(.1e/√2,1).
Using q′ in the two history updates adds artificial terms of order η² and
does not implement the gradient of the original old-buffer loss. In the
canonical scratch convention a duplicate rating occurrence repeats a loss term
but does not duplicate the unique history set or its √2 denominator. Counted
HKV confidence is another rule. Surprise's occurrence-list history can instead
repeat that item and normalize by the larger list length, so the scratch
deduplication must not be generalized to the library.

</details>

### O. Solve one constrained item-weight column

For X=[[1,1,0],[0,1,1],[1,0,0]] and λ=1, predict I2 with learned item weights
whose self-weight is zero. Solve the excluded-column ridge system and score
the row [1,1,0]. Why is setting only the final predicted value to zero a different
operation?

<details><summary>Get a hint</summary>

The remaining I0/I1 design has normal system A=[[3,1],[1,3]] and b=[0,1].
The constraint belongs to the coefficient column during fitting.

</details>
<details><summary>Show explained solution</summary>

The determinant is 8, giving weights −1/8 and 3/8 on I0 and I1 and zero on I2.
The row's score is −1/8+3/8=1/4. In the full inverse-Gram route,
P₂₂=8/13 and the off-diagonal ratios −P₀₂/P₂₂, −P₁₂/P₂₂ yield the same
coefficients. P is symmetric, but division by each column's own diagonal does
not generally make B symmetric. The zero self-coefficient prevents direct
copying of an observed input item; erasing a final prediction after fitting
does not impose that fitting constraint or repair the other coefficients.

</details>

### P. Separate entry risk from observed-entry averages

Use losses [1,4;2,3] and propensities [1,.5;.25,1]. Compute the expected
observed-entry mean and the fixed-four-entry IPS risk. Diagnose replacing a
positive-target cell's propensity with zero.

<details><summary>Get a hint</summary>

Losses 1 and 3 are always observed. Optional-cell states none, only loss 4,
only loss 2 and both have probabilities 3/8,3/8,1/8,1/8.

</details>
<details><summary>Show explained solution</summary>

Those four states have observed means 2,8/3,2,5/2. Their expectation is
(3/8)2+(3/8)(8/3)+(1/8)2+(1/8)(5/2)=37/16.
Using the fixed denominator 4 and inverse propensities instead gives state
risks 1,3,3,5, whose expectation is 5/2, the complete-grid mean.
An individual IPS value 5 can exceed the range of the original four losses;
unbiased expectation does not mean each sample equals truth. Positive target
weight with zero observation propensity is unidentified. An absent Retail
purchase does not provide a known exposure propensity, and this entry-risk
unit is different from the request-action policy tree in J.

</details>

### Q. Diagnose a saved item-ID fault

A saved Q has the expected width, but I0/I1 names are swapped without moving
their factor rows. A new checksum is calculated over the resulting bytes.
Does that prove the rule retains the intended item meanings? State a valid
repair and the empty-history boundary.

<details><summary>Get a hint</summary>

Trace one named item's dot product to its fitted row. Hash integrity and the
intended schema mapping answer different questions.

</details>
<details><summary>Show explained solution</summary>

Matching dimensions prove only that the multiplication can be formed. A fresh
checksum can faithfully identify a wrongly named state. Compare the complete
bundle with its expected source, reference IDs, row order and parameters.
Restore the original map, or deliberately permute the item IDs, Q rows and all
corresponding CSR columns together. A stale name-only permutation is invalid.
In the declared positive-λ HKV rule, an empty fixed history gives b=0 and p=0.
Biased-rating baselines and SVD++'s separate explicit p describe different
empty-history contexts and should not inherit that conclusion indiscriminately.

</details>

#### Coding transfer: repair and query a saved bundle

Implement `permute_bundle`, replacing the faulty repair that changes only
the ID list. Use a new fixed analytical bundle: IDs [I0,I1,I2],
Q=[[1,0],[0,1],[1,1]], one CSR history row [1,0,2], discovery eligibility
[false,true,false], λ=2 and α=2. A separate stored training-P sentinel
[[8,9]] must remain untouched; query P is recalculated from the fixed history
and final Q. This small fixture is not a fitted Retail state.

Change the item order to [I2,I0,I1]. Repair Q rows, CSR columns and eligibility
columns together, then call the existing `fixed_history_query` without a
training sweep. Compare results by item ID, rather than array position.
Your success criteria are query A=[[10,5],[5,8]], b=[8,5],
query p=[39/55,10/55], and named scores I0=39/55, I1=10/55,
I2=49/55 in both valid orderings. Only I1 is discovery-eligible.
The name-only repair must fail this named-score invariant; an empty history
must produce p=0 under positive λ. Inputs and stored training P must not mutate.
Also reject a proposed permutation with duplicate or missing positions.

<details><summary>Get a coding hint</summary>

Use a complete bijection of item positions. Apply it to Q's row axis but
to history/eligibility's column axis. Inference sums q qᵀ terms, so consistent
reordering preserves A and b. Do not use stored training P as query P.
Here observed confidences are 3 and 5; the unobserved I1 still contributes
its confidence-one Gram term. Solve the two scalar equations to check the
query before comparing any renamed score.

</details>
<details><summary>Show coding solution</summary>

The repaired bundle copies every item-owned axis while preserving the distinct
user-owned training row. The query helper's guarded study main is never called;
this runs only inference on the new fixed arrays. The intermediate equations
10p₀+5p₁=8 and 5p₀+8p₁=5 give p₀=39/55 and p₁=10/55.
After permutation, the history is [2,1,0] and the one eligible item still
has ID I1. Integrity alone cannot save a name-only reassignment: the numeric
scores would be attached to different semantic IDs. Keep the solution beside
`recommender-retail-study.py` and run `python practice-saved-item-map.py`,
or pass `--sources` with that directory.

<!-- practice-solution:Q filename:practice-saved-item-map.py -->

```python
"""Repair a tiny saved-state permutation and recalculate its fixed-Q query.

Keep beside recommender-retail-study.py, or pass --sources DIRECTORY.
No archive/data preparation, training sweep or study main runs.
"""
import argparse
import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.sparse import csr_matrix


def load_query(directory):
    path = directory / 'recommender-retail-study.py'
    spec = importlib.util.spec_from_file_location('practice_saved_query', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.fixed_history_query


def permute_bundle(bundle, order):
    order = list(order)
    if sorted(order) != list(range(len(bundle['ids']))):
        raise ValueError('a complete bijective item permutation is required')
    return {'ids': [bundle['ids'][i] for i in order],
            'Q': bundle['Q'][order].copy(),
            'history': bundle['history'][:, order].copy(),
            'eligible': bundle['eligible'][:, order].copy(),
            'trainingP': bundle['trainingP'].copy(), 'penalty': bundle['penalty']}


def named_query(query, bundle):
    result = query(bundle['history'].toarray(), bundle['Q'], bundle['penalty'])
    named = dict(zip(bundle['ids'], result['scores'][0].tolist()))
    eligible = {item: bool(flag) for item, flag in zip(bundle['ids'], bundle['eligible'][0])}
    order = sorted((item for item in named if eligible[item]), key=lambda item: (-named[item], item))
    return result, named, order


def main(directory):
    query = load_query(directory)
    # This is a new declared analytical fixture, not a fitted Retail state.
    original = {'ids': ['I0', 'I1', 'I2'], 'Q': np.array([[1., 0.], [0., 1.], [1., 1.]]),
                'history': csr_matrix([[1., 0., 2.]]), 'eligible': np.array([[False, True, False]]),
                'trainingP': np.array([[8., 9.]]), 'penalty': 2.}
    before = {key: value.copy() for key, value in original.items() if hasattr(value, 'copy')}
    reference, named, order = named_query(query, original)
    np.testing.assert_allclose(reference['queryA'][0], [[10., 5.], [5., 8.]], rtol=0, atol=1e-14)
    np.testing.assert_allclose(reference['queryB'][0], [8., 5.], rtol=0, atol=1e-14)
    np.testing.assert_allclose(reference['queryP'][0], [39/55, 10/55], rtol=0, atol=1e-14)
    expected = {'I0': 39/55, 'I1': 10/55, 'I2': 49/55}
    assert all(abs(named[item] - score) < 1e-14 for item, score in expected.items())
    assert order == ['I1']
    bad = dict(original, ids=['I2', 'I0', 'I1'])
    _, wrongly_named, _ = named_query(query, bad)
    assert any(abs(wrongly_named[item] - named[item]) > 1e-3 for item in named)
    repaired = permute_bundle(original, [2, 0, 1])
    after, same_named, same_order = named_query(query, repaired)
    np.testing.assert_allclose(after['queryP'], reference['queryP'], rtol=0, atol=1e-14)
    assert all(abs(same_named[item] - named[item]) < 1e-14 for item in named)
    assert same_order == order
    assert repaired['history'].toarray().tolist() == [[2., 1., 0.]]
    empty = query(np.zeros((1, 3)), repaired['Q'], 2.)
    assert np.array_equal(empty['queryP'], np.zeros((1, 2)))
    for key in ['Q', 'eligible', 'trainingP']:
        assert np.array_equal(original[key], before[key])
    assert (original['history'] != before['history']).nnz == 0
    assert not np.allclose(original['trainingP'], reference['queryP'], rtol=0, atol=1e-14)
    print(json.dumps({'queryA': reference['queryA'][0].tolist(), 'queryB': reference['queryB'][0].tolist(),
                      'queryP': reference['queryP'][0].tolist(), 'namedScores': named,
                      'nameOnlyFaultScores': wrongly_named, 'repairedNamedScores': same_named,
                      'eligibleOrder': same_order, 'emptyQueryP': empty['queryP'].tolist()}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, default=Path(__file__).resolve().parent)
    main(parser.parse_args().sources)
```

Recorded output from this changed-input practice, with fixed factors and no training fit:

```json
{
  "queryA": [
    [
      10.0,
      5.0
    ],
    [
      5.0,
      8.0
    ]
  ],
  "queryB": [
    8.0,
    5.0
  ],
  "queryP": [
    0.7090909090909091,
    0.18181818181818182
  ],
  "namedScores": {
    "I0": 0.7090909090909091,
    "I1": 0.18181818181818182,
    "I2": 0.8909090909090909
  },
  "nameOnlyFaultScores": {
    "I2": 0.7090909090909091,
    "I0": 0.18181818181818182,
    "I1": 0.8909090909090909
  },
  "repairedNamedScores": {
    "I2": 0.8909090909090909,
    "I0": 0.7090909090909091,
    "I1": 0.18181818181818182
  },
  "eligibleOrder": [
    "I1"
  ],
  "emptyQueryP": [
    [
      0.0,
      0.0
    ]
  ]
}
```

The assertions exercise named scores, the eligibility order, the CSR column
map, zero history and input immutability. A consistent permutation preserves
the rule; moving only labels produces a different named rule even if a newly
calculated checksum faithfully identifies those bytes.

</details>

### R. Report the real task without changing the winner

Suppose validation selects popularity. Only 48 of 200 test customers have
eligible discovery truth in the fixed catalogue, while many purchases lie
outside it. What may the report claim, and which rule must the saved consumer
serve? Propose one independent extension.

<details><summary>Get a hint</summary>

Locate both pretruth locks, the qualified-user denominator and the all-user
coverage denominator. Unknown exposure is still unknown after scoring.

</details>
<details><summary>Show explained solution</summary>

Serve the actual selected popularity rule. A best-ALS inspector remains a
comparison and must not be relabelled the winner. Report all baseline/factor
outcomes, macro metrics over the 48 qualified customers, coverage over all 200,
outside-catalogue truth and null metrics for users without qualifying truth.
Paired intervals are conditional on the declared task/cohort and do not remedy
unobserved exposure or catalogue omissions. Keep both selection locks, warnings
and fixed candidate filters; do not select a different cohort or rule after
seeing test outcomes. An extension could evaluate replenishment with a newly
declared repeat-item target and independent later period, or compare a larger
train-selected catalogue. It needs its own prospective protocol rather than
retroactive relabelling of this discovery assessment. Reproducible reports and
honest limits do not imply a required score improvement or a causal benefit.

</details>

### Readiness and the next topic

Explain how one named rating, count or history occurrence becomes a model term.
Calculate a changed update or solve without mixing old and new buffers. Diagnose
a wrong denominator, confidence encoding, saved ID map or unavailable historical
input. Then choose an assessment that can answer the actual decision question.
The solved tasks give concrete checks of these skills; they do not guarantee
every future recommendation problem is solved by the same finite method list.

The next topic is **Multi-Label & Multi-Output Learning**. It also asks for several
outputs for one input, but its reviewed targets, missingness and loss need their
own definition: a sortable item score table is not already a joint label
probability model. Follow the course's Next control in curriculum order. The
optional degree-adjusted graph branch connects to **Message Passing / Graph
Convolutions**, where the full aggregation and graph-learning machinery is
taught; the local recommendation forward remains understandable on its own.

### Further learning

These are alternate explanations and activities, rather than required links
for completing the core worked examples.

* **Leskovec, Rajaraman and Ullman — [Mining of Massive Datasets, chapter 9](http://infolab.stanford.edu/~ullman/mmds/ch9.pdf).** Freely available book chapter; begin after the evidence and neighborhood sections. Its utility matrices, co-rating/normalization, factor nonuniqueness and exercises offer a longer beginner-to-intermediate route. The historical Netflix setting explains motivations, not current universal performance.
* **Zhang et al. — Dive into Deep Learning, [overview](https://d2l.ai/chapter_recommender-systems/recsys-intro.html), [data](https://d2l.ai/chapter_recommender-systems/movielens.html), [matrix factors](https://d2l.ai/chapter_recommender-systems/mf.html) and [ranking](https://d2l.ai/chapter_recommender-systems/ranking.html).** Interactive book and code, intermediate after the local factor/gradient walkthrough. Selected version-1.0.3 sections were read. Its strictly positive rating-scale zero shortcut and data split differ from this lesson's explicit finite-zero mask and global train/choice/test replay; API and dataset-license requirements need separate attention.
* **Google Developers — [matrix-factorization lesson](https://developers.google.com/machine-learning/recommendation/collaborative/matrix).** Short introductory visual explanation of shared user/item representations. Compare its weighting discussion with the distinction between observed ratings and all-pair confidence here; it does not establish equality of every library objective.
* **Stanford CS246 — [public 2019 lecture archive](https://snap.stanford.edu/class/cs246-videos-2019/) and [recommendation slides](https://snap.stanford.edu/class/cs246-2025/WWW/slides/07-recsys1.pdf).** Recommender Systems I (January 29) and II (January 31) are a spoken companion for the intermediate neighborhood/factor material. The public listing and selected companion slides' co-rating/centering content were inspected; no full-video viewing is claimed. These are conceptual resources, not current package installation instructions.

### Technical references

The following sources support the declared equations, assumptions, implementation
conventions and data provenance.

* **Sarwar et al. — [Item-Based Collaborative Filtering Recommendation Algorithms](https://grouplens.org/site-content/uploads/Item-Based-WWW-2001.pdf), §§3.1–3.3.** Original cosine/Pearson/adjusted-cosine definitions, weighted prediction and precomputation. The selected co-rater formulas were read from rendered pages; signed residual prediction and positive-neighbor aggregation remain different policies.
* **Koren, Bell and Volinsky — [Matrix Factorization Techniques for Recommender Systems](https://gwern.net/doc/ai/tabular/2009-koren.pdf).** The original eight-page paper, hosted on a mirror, develops biased factors and implicit history. Its illustrative genre axes do not establish identifiable learned coordinates; its historical comparisons do not declare a universal winner.
* **Salakhutdinov and Mnih — [Probabilistic Matrix Factorization](https://papers.nips.cc/paper/2007/file/d7322ed717dedf1eb4e6e52a37ea7bcd-Paper.pdf), equations 1–5.** Gaussian masked likelihood and prior yield the variance-ratio once-entity MAP penalty. A MAP vector is a point estimate, not automatically a posterior uncertainty interval.
* **Hu, Koren and Volinsky — [Collaborative Filtering for Implicit Feedback Datasets](https://yifanhu.net/PUB/cf.pdf), §§3–5.** Confidence-weighted all-pair loss, cached Gram normal equations and inverse-system score contributions. Missing-pair confidence 1 supplies curvature; an exact signed score decomposition is not a causal explanation.
* **Rendle et al. — [BPR: Bayesian Personalized Ranking from Implicit Feedback](https://arxiv.org/pdf/1205.2618), §§3–4.** Preference triples, posterior objective, bootstrap sampling and factor derivatives. The original publication predates its arXiv upload; sampler populations determine the objective being approximated.
* **Steck — [Embarrassingly Shallow Autoencoders for Sparse Data](https://arxiv.org/pdf/1905.03375), §§3–3.4.** Constrained ridge, zero diagonal and inverse-Gram column normalization. The dense solve's item² storage and cubic work are material limitations.
* **Schnabel et al. — [Recommendations as Treatments](https://proceedings.mlr.press/v48/schnabel16.pdf), §§3.1–4.2.** Selection, propensity-weighted entry risk, support and variance. Entry-observation propensities and request-action logging probabilities require different units; this Retail dataset supplies neither exposure mechanism.
* **He et al. — [LightGCN](https://arxiv.org/pdf/2002.02126), §§3.1–3.3.** Bipartite degree-adjusted aggregation and layer mixtures support the bounded graph forward. The local calculations do not reproduce its complete graph-training experiments or assert present superiority.
* **implicit — [CPU ALS API](https://benfred.github.io/implicit/api/models/cpu/als.html), [CPU BPR API](https://benfred.github.io/implicit/api/models/cpu/bpr.html), [0.7.3 ALS source](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py), [BPR source](https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/bpr.pyx) and [release record](https://pypi.org/project/implicit/).** The versioned source determines positive stored confidence, signed target-zero entries, filtering/recalculation and the BPR sampler/item-bias implementation. API documentation's banner version and the actual executed package version are separate facts.
* **Surprise — [matrix-factorization API](https://surprise.readthedocs.io/en/stable/matrix_factorization.html), [KNN API](https://surprise.readthedocs.io/en/stable/knn_inspired.html), [similarities](https://surprise.readthedocs.io/en/stable/similarities.html), [1.1.5 source](https://github.com/NicolasHug/Surprise/tree/v1.1.5/surprise) and [release record](https://pypi.org/project/scikit-surprise/).** Named raw/inner IDs, pair-overlap Pearson centering, full-row mean prediction, positive neighbors and occurrence-list SVD++ history are the relevant contracts. Its initialization and record penalties need not match the scratch objective.
* **Chen — [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail), DOI 10.24432/C5BW33, CC BY 4.0.** Dataset provenance, fields, time range and redistribution license. The prepared subset credits the source and states transformations; invoices do not establish exposure or stock availability.
* **Covington, Adams and Sargin — [Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/).** The official 2016 abstract supports the historical separation of candidate generation and ranking. It is not a claim about today's entire deployed service.

