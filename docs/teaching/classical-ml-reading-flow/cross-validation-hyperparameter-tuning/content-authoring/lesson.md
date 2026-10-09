# Cross-validation & Hyperparameter Tuning

Choosing a recipe is learning from data. This lesson follows each row through preparation, comparison, selection, assessment and refitting so that a score answers the question you intended. We begin with seven points whose predictions can be traced by hand, then read a complete offline Penguins experiment, derive uncertainty limits, and build small adaptive search/resource procedures.

**Before starting:** know features/targets and a held-out prediction, basic KNN distance/voting, arrays/indexing, means and variance. The preceding [Feature Scaling, Encoding & Imputation](/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml) explains fitted preparation; we reconstruct its boundary locally. The [KNN estimator section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#4-build-a-complete-neighbor-estimator) supplies the predictor background. The deeper branches introduce the probability conditioning and finite sums they use; no unseen Bayesian optimizer is required.

**You will be able to:** construct legal folds and trace one prediction; choose row/group/time boundaries from future use; implement training-only mixed preparation; assess a complete selector with protected outer data; reason about finite search mass and adaptive history; distinguish fitted-model/recipe error and covariance; audit resource, failures and final refit; write a reproducible report with an honest scope.

Use this single learning compass to navigate. For a working first pass, read §§1–6, §9 and the core practice/endings; return to the visible deeper branches in §§7–8 for inference and adaptive allocation. Full programs, outputs and explanations remain in reading order. [Setup and complete file index](setup-and-files.md) identifies dependencies, offline data, teaching/answer assets and the meaning of each retained stream.

1. [What exactly are we trying to estimate?](#1-what-exactly-are-we-trying-to-estimate)
2. [Build cross-validation one held-out prediction at a time](#2-build-cross-validation-one-held-out-prediction-at-a-time)
3. [Choose splits that match future use](#3-choose-splits-that-match-the-future-use)
4. [Selection can learn validation answers](#4-selection-can-learn-the-validation-answers)
5. [What does the search give a chance to win?](#5-search-the-settings-you-actually-mean-to-compare)
6. [Read a complete real experiment](#6-a-complete-nested-experiment-with-real-observations)
7. [Deeper: risk and uncertainty](#7-deeper-branch-what-cross-validation-uncertainty-does-and-does-not-mean)
8. [Deeper: adaptive search and paid resources](#8-deeper-branch-adaptive-search-and-spending-resources)
9. [Execute and report the whole procedure](#9-run-a-useful-comparison-within-an-honest-budget)
10. [Practise with changed inputs](#10-practice-identify-the-decision-before-computing-the-score)
11. [Readiness and what follows](#11-readiness-and-what-follows)


<a id="1-what-exactly-are-we-trying-to-estimate"></a>
## 1. What exactly are we trying to estimate?

The preceding [Feature Scaling, Encoding & Imputation lesson](/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml) asks how to turn measurements, categories and gaps into usable coordinates. We now ask how to choose a complete recipe using evidence, and how to assess that choice. A recipe includes preparation as well as prediction. We refresh the fitted-state boundary locally before using it in cross-validation.

Start with one actual Palmer Penguins row. Its recorded answer is useful for checking a prediction; the corresponding answer on a future case is what we would be trying to discover.

<!-- Drawing D01: visual-specifications.md#d01. -->

| Source position | Bill length | Bill depth | Flipper length | Body mass | Recorded sex | Recorded target |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 0 | 39.1 mm | 18.7 mm | 181 mm | 3750 g | male | Adelie |

The first five substantive columns are the selected inputs. The target species stays in a separate lane. Source position 0 is metadata for tracing this file, never a sixth feature. The future row’s target remains unknown until an outcome is available. We exclude island and year from these input coordinates too; that exclusion does not establish performance on a new island or future season. The real experiment later retains all 344 rows, including missing inputs.

How does a neighbour count enter that prediction? A supplied count changes which training labels can vote. A data-driven comparison adds another operation: it learns which count to use.

<!-- Drawing D02: visual-specifications.md#d02. -->

Follow the training-row bundle into fitted preparation: medians fill missing measurements; means and scales set the ruler; a saved categorical vocabulary supplies indicator columns. The prepared training rows and their species labels form the neighbour reference set. A configuration such as `k=3` tells this fitted object how many neighbours vote. Validation inputs enter through the frozen preparation, yielding predictions; validation targets meet those predictions only at the correct-count operation. That score returns to the configuration choice. After choosing, a **fresh refit** uses all permitted development rows. Assessment inputs then travel through that refitted object, and assessment targets meet its predictions at a separate score. There is no arrow from those protected targets back to preparation, neighbour count or the choice rule.

A **parameter** is learned inside a stated fit, such as a regression coefficient. A **hyperparameter** specifies how fitting or prediction operates: neighbour count, penalty strength, depth, preparation choice. This distinction belongs to the procedure, rather than to a number forever. The programmer can supply k; a search can instead learn k from validation outcomes. The resulting selection is learning too, even though it happens outside the estimator's `fit` method.

Which of these learned objects do we mean by “the model” when quoting a score? Keep three questions visible before introducing probability notation.

<!-- Drawing D03: visual-specifications.md#d03. -->

The first panel fixes one saved fitted state and asks about fresh observations. The second redraws a training table of a stated size, applies the same fixed recipe to each table, and then predicts fresh observations. The third redraws a training table, **reruns the comparison and refit**, and predicts fresh observations. A cloud of possible tables in the last two panels is illustrative, not a measured confidence band. The differences are what we hold fixed and what we repeat.

1. **Fitted-object error:** how does this particular fitted predictor work on the intended fresh cases?
2. **Recipe error at a training size:** how does a fixed learning recipe usually work when a new training sample of that size is supplied?
3. **Select-and-refit procedure error:** how does the complete comparison, choice and refit usually work?

Section 7 gives precise expectations for these questions. For now, a score needs a sentence naming its data and its use. “This inner mean chose the neighbour count” and “these protected outer rows assessed the whole choice” remain different sentences even when their digits happen to coincide.

For classification, **accuracy** is correct predictions divided by assessed observations. For regression, **mean squared error** averages squared residuals, `(target − prediction)²`; it has squared target units and lower is better. A residual is the difference between an observed answer and its prediction. Accuracy can conceal rare consequential failures; the later [metrics](/learn/path/full-curriculum/evaluation-metrics-precision-recall-f1-auc-roc-ap-r-mae?module=classical-ml) and [imbalanced-learning](/learn/path/full-curriculum/imbalanced-learning-smote-cost-sensitive-learning?module=classical-ml) lessons develop other objectives. We will define the small F1 calculation we need before using it here.

| Data role in this operation | Permitted influence |
| --- | --- |
| Training | Fit preparation and estimator state |
| Validation | Compare recipes, choose settings or stop fitting |
| Test / outer assessment | Score a complete procedure whose choices were made elsewhere |

Roles describe use at a particular stage. A row can train one fold and be held out in another. Within the operation that makes a prediction for it, its target must stay outside that operation's fitting and selection. A score used to choose is a **selection score**; a score from appropriately protected rows is an **assessment** under the stated protocol. They are reported separately. Calling a used validation set “test” later cannot undo its influence.

One protected split gives a concrete boundary. Can we give every development row a held-out turn while preserving that boundary? The next section builds the actual index lists, fitted states and predictions that answer this question.


<a id="2-build-cross-validation-one-held-out-prediction-at-a-time"></a>
## 2. Build cross-validation one held-out prediction at a time

### A fold is a role assignment

Rather than call a scoring helper first, lay out the rows it will assign. This constructed line has seven observations, with feature `x=0,…,6` and targets `0,0,0,1,1,1,1`. The IDs match their positions for this example; that convenient equality will stop being true inside a nested subset.

<!-- Drawing D04: visual-specifications.md#d04. -->

| Held fold | Held IDs | Training IDs | Fresh fitted state |
| --- | --- | --- | --- |
| 0 | 0,1,2 | 3,4,5,6 | fit 0 |
| 1 | 3,4 | 0,1,2,5,6 | fit 1 |
| 2 | 5,6 | 0,1,2,3,4 | fit 2 |

Each row gets exactly one held-out turn. Fold sizes 3,2,2 keep the remainder instead of silently discarding an observation. **K-fold cross-validation** partitions the supplied development rows into K nonoverlapping held sets; each fit uses the complement of its held set. A fresh copy includes every learned imputer, scaler, selector and estimator. Carrying a trained object from the previous fold would carry information from rows that may now be held out.

What exactly predicts row 0? Put the actual training sources on the same feature ruler.

<!-- Drawing D05: visual-specifications.md#d05. -->

In fold 0, training points sit at x=3,4,5,6, all labelled 1. Query x=0 connects to source ID 3, its nearest permitted point, and receives label 1. Its own target 0 enters only the correctness cell, which becomes false. Queries 1 and 2 also receive 1. In fold 1, query 3 connects to source 2 and is wrong; query 4 connects to source 5 and is correct. Fold 2 predicts both remaining cases correctly. Equal feature distances in this hand trace use smaller original source ID. [KNN's voting section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#3-turn-neighbors-into-a-prediction) supplies the estimator background; here the new operation controls which reference rows may exist for each query.

| Held IDs | Nearest source IDs | Predictions | Correct / assessed |
| --- | --- | --- | ---: |
| 0,1,2 | 3,3,3 | 1,1,1 | 0/3 |
| 3,4 | 2,5 | 0,1 | 1/2 |
| 5,6 | 4,4 | 1,1 | 2/2 |

The local row investigation keeps this fold plan fixed while you edit one row's feature or target. Its current neighbour, prediction and correctness are immediately visible. Editing a held row's target can change correctness without changing the model that predicted it. Editing a training feature can move a nearest-source edge. A separate adjacent splitter investigation varies K, shuffle and seed with the data fixed; it shows the complete held masks and all predictions after each valid edit. Reset restores the seven original rows and folds. A coincident-feature tie exposes the declared smaller-ID rule. Nonfinite observations or an empty/illegal fold produce a refusal instead of a stale current score. These are two local questions, without a learner answer gate. The ordered example also explains why blindly retaining class-sorted order can produce an unrepresentative random-row assessment; section 3 decides when exchangeability is justified.

### An average over folds is not always an average over rows

Which units should receive equal weight: three folds or seven observations? Follow the same correctness cells into both sums.

<!-- Drawing D06: visual-specifications.md#d06. -->

The three equal fold tiles contribute `0`, `1/2`, `1`, giving mean `1/2`. The seven equal row tiles contain three correct predictions, giving `3/7 ≈ 0.4285714`. A fold tile in the first calculation has weight 1/3 despite covering three rows; each row in the second has weight 1/7.

Write Vₖ for held IDs in fold k, f̂₋ₖ for the procedure fitted without them, and ℓᵢ=L(yᵢ,f̂₋ₖ(xᵢ)) for row i's held loss. For a loss additive over rows,

\[
\widehat R_{\mathrm{rows}}=\frac1n\sum_i\ell_i
=\sum_{k=1}^{K}\frac{|V_k|}{n}\widehat R_k,
\qquad \widehat R_k=\frac1{|V_k|}\sum_{i\in V_k}\ell_i.
\]

This is a rearrangement of the same sum, not an independence theorem. Equal fold sizes make this additive row-weighted summary equal to the unweighted fold mean. If person A supplies four correct visits and person B supplies one incorrect visit, row accuracy is 4/5, while equal-person accuracy is `(1+0)/2=1/2`. Decide from the intended reporting unit, rather than from the more appealing value.

Does equal fold size also settle a nonlinear metric? Start by drawing what F1 counts.

<!-- Drawing D08: visual-specifications.md#d08. -->

A true positive (TP) predicts 1 when the target is 1. A false negative (FN) predicts 0 for target 1; a false positive (FP) predicts 1 for target 0. A true negative (TN) predicts 0 for target 0. Define `F1=2TP/(2TP+FP+FN)`, with value 0 when the denominator is 0. The first two-row table has `(TP,FN,FP,TN)=(1,1,0,0)`, so F1=2/3. The second has `(0,0,1,1)`, so F1=0. Their mean is 1/3. Adding the counts first gives `(1,1,1,1)`, so pooled F1=1/2. Counts add; applying a ratio and then averaging need not commute. Pooled area under the ROC curve (AUC), a ranking summary based on positive/negative score pairs, also compares scores from different fitted models, creating cross-model pairs absent within each fold. Equal sizes alone do not make all metrics interchangeable.

### Keep every row in a complete splitter

The first full programme uses NumPy arrays to construct the exact three folds. `np.array_split` distributes the remainder; concatenating the other folds constructs permitted training positions. `x[validation,None] − x[train]` broadcasts a held-by-training distance matrix, and `argmin` chooses the first minimum in sorted training order. With q held and m training rows it allocates q×m distances; this is a transparent one-dimensional reference, rather than an optimized general neighbour engine. The output below is the exact retained displayed stdout from the original execution; its terminal process newline was not retained. We have preserved the source and output without running them again.

<!-- Programme P01; source programmes/cv_tiny.py; role retained. -->

Save as `cv_tiny.py`.

```python
import numpy as np

def kfold_indices(n, k, shuffle=False, seed=0):
    if not 2 <= k <= n:
        raise ValueError("Require 2 <= k <= n.")
    indices = np.arange(n)
    if shuffle:
        np.random.default_rng(seed).shuffle(indices)
    folds = np.array_split(indices, k)
    for held in range(k):
        train = np.sort(np.concatenate([folds[j] for j in range(k) if j != held]))
        yield train, folds[held]

x = np.arange(7)
y = np.array([0, 0, 0, 1, 1, 1, 1])
fold_scores = []
total_correct = 0
for train, validation in kfold_indices(len(x), 3):
    distances = np.abs(x[validation, None] - x[train])
    nearest = train[np.argmin(distances, axis=1)]
    prediction = y[nearest]
    correct = int(np.sum(prediction == y[validation]))
    fold_scores.append(correct / len(validation))
    total_correct += correct
    print(validation.tolist(), prediction.tolist(), correct, "/", len(validation))
print("fold mean", np.mean(fold_scores))
print("pooled", total_correct / len(x))
```

Exact retained displayed stdout; historical execution, without retained terminal process newline.

```text
[0, 1, 2] [1, 1, 1] 0 / 3
[3, 4] [0, 1] 1 / 2
[5, 6] [1, 1] 2 / 2
fold mean 0.5
pooled 0.42857142857142855
```


`shuffle=False` makes the constructed row order inspectable. A seeded permutation changes the plan reproducibly when shuffling is appropriate; it cannot decide whether time or subject dependencies may be ignored. The resulting 0.5 fold mean and 3/7 pooled accuracy are summaries of the stored row predictions, rather than interchangeable estimates by name alone.

### Fit preparation inside each training boundary

The first programme has no learned coordinate preparation. What must change when a recipe learns a median and ruler? Freeze one fitted state before passing held values through it.

<!-- Drawing D07: visual-specifications.md#d07. -->

Training numeric values are `[0,2,NA,4]`; held values are `[10,NA]`. The observed training median is 2. Filling training gives `[0,2,2,4]`, mean 2 and population variance `(4+0+0+4)/4=2`, hence scale √2. Frozen filling and scaling transforms the held values to `[(10−2)/√2,(2−2)/√2]=[4√2,0]`. Preserve the original missing masks beside the filled cells: a supplied 2 is not a newly measured 2. The adjacent investigation edits the training and held columns with roles and missing masks fixed. Held `10→100` changes its transformed value to `49√2` while the fitted state stays unchanged. Training `4→6` changes mean to 5/2 and variance to 19/4. Translating every observed training and held value by the same constant preserves their standardized coordinates. All-training-missing refuses this recipe's numeric fit.

For training-filled numeric column j, the scratch implementation stores

\[
m_j=\operatorname{median}(\text{observed training values}),\quad
\mu_j=\frac1m\sum_{i\in T}\widetilde x_{ij},\quad
s_j^2=\frac1m\sum_{i\in T}(\widetilde x_{ij}-\mu_j)^2.
\]

It uses divisor sⱼ when positive and 1 for a constant column. A held missing value receives mⱼ, then `(filled−μⱼ)/sⱼ`; none of these stored values is recomputed from held inputs. Categorical missing values receive a reserved `__missing__` marker, and each observed training category becomes one indicator column. An unknown held category maps to all zeros. A missing marker absent from training is also unknown to that fitted vocabulary. This is an explicit policy; it does not mean the unseen category resembles every known category biologically.

The complete next programme owns `fit_prepare`, `transform`, `fit_knn`, `predict` and `evaluate_folds`. `Preparation` contains immutable scalar/vocabulary tuples. `Neighbours` stores transformed features, filled numeric reference values, targets and separate source/copy identities. At prediction, the common numeric mean cancels from distances, so it subtracts filled values **before** dividing by the saved scale. This avoids creating unequal rounded distances from two separately centered integer-line points. Categorical indicator differences are then added. It sorts by squared distance, source ID, copy ordinal; uniform votes tie by declared class order. Its returned records expose neighbour IDs, distances, votes and predictions. Source/copy metadata never enters a coordinate.

<!-- Programme P04; source programmes/fold_fitted_pipeline.py; role new executed. -->

Save as `fold_fitted_pipeline.py`.

```python
"""Training-only mixed preparation and uniform KNN, with explicit row lineage.

NumPy implements arrays and arithmetic, not the fit/predict operation.  The
ordinary comparison in main uses exactly the same legal input and fold plan.
"""
from dataclasses import dataclass
from collections import Counter
import json
import numpy as np

MISSING_CATEGORY = "__missing__"


def numeric_table(values):
    table = np.asarray(values, dtype=float)
    if table.ndim != 2 or not table.shape[1] or np.isinf(table).any():
        raise ValueError("Expected a numeric matrix with finite observations or NaN.")
    return table


def category_table(values, rows):
    if values is None:
        return np.empty((rows, 0), dtype=object)
    table = np.asarray(values, dtype=object)
    if table.ndim != 2 or len(table) != rows:
        raise ValueError("Category rows must align with numeric rows.")
    clean = np.empty(table.shape, dtype=object)
    for index in np.ndindex(table.shape):
        value = table[index]
        missing = value is None or isinstance(value, (float, np.floating)) and np.isnan(value)
        if missing:
            clean[index] = MISSING_CATEGORY
        elif not isinstance(value, str) or value == MISSING_CATEGORY:
            raise ValueError("Observed categories must be strings other than the reserved missing marker.")
        else:
            clean[index] = value
    return clean


@dataclass(frozen=True)
class Preparation:
    medians: tuple
    means: tuple
    variances: tuple
    scales: tuple
    vocabularies: tuple


def fit_prepare(numeric, categories=None):
    table = numeric_table(numeric)
    if not len(table) or np.isnan(table).all(axis=0).any():
        raise ValueError("Need training rows and an observed value in each numeric column.")
    category = category_table(categories, len(table))
    median = np.nanmedian(table, axis=0)
    filled = np.where(np.isnan(table), median, table)
    mean = filled.mean(axis=0)
    variance = ((filled - mean) ** 2).mean(axis=0)
    scale = np.where(variance > 0, np.sqrt(variance), 1.0)
    vocabulary = tuple(tuple(sorted(set(category[:, j]))) for j in range(category.shape[1]))
    return Preparation(tuple(map(float, median)), tuple(map(float, mean)),
                       tuple(map(float, variance)), tuple(map(float, scale)), vocabulary)


def transform(state, numeric, categories=None):
    table = numeric_table(numeric)
    category = category_table(categories, len(table))
    if table.shape[1] != len(state.medians) or category.shape[1] != len(state.vocabularies):
        raise ValueError("The fitted numeric/category schema must stay fixed.")
    filled = np.where(np.isnan(table), state.medians, table)
    blocks = [(filled - state.means) / state.scales]
    for j, vocabulary in enumerate(state.vocabularies):
        # An unknown held category has no matching vocabulary column: all zeros.
        blocks.append((category[:, j, None] == np.asarray(vocabulary)[None, :]).astype(float))
    return np.concatenate(blocks, axis=1)


@dataclass(frozen=True)
class Neighbours:
    preparation: Preparation
    features: np.ndarray
    numeric_values: np.ndarray
    targets: tuple
    source_ids: tuple
    copy_ordinals: tuple
    classes: tuple
    k: int


def fit_knn(numeric, targets, source_ids, k=1, categories=None, copy_ordinals=None, classes=None):
    table = numeric_table(numeric)
    y, ids = tuple(targets), tuple(source_ids)
    copies = tuple(0 for _ in ids) if copy_ordinals is None else tuple(copy_ordinals)
    if len(table) != len(y) or len(ids) != len(y) or len(copies) != len(y):
        raise ValueError("Features, targets and occurrence metadata must align.")
    if any(not isinstance(value, (str, int, np.integer)) for value in y):
        raise ValueError("Classification targets must be observed integer or string labels.")
    if type(k) is not int or not 1 <= k <= len(y):
        raise ValueError("Require integer 1 <= k <= training occurrences.")
    if any(type(i) is not int or i < 0 for i in ids + copies) or len(set(zip(ids, copies))) != len(ids):
        raise ValueError("Each occurrence needs a unique nonnegative (source ID, copy ordinal).")
    labels = tuple(sorted(set(y))) if classes is None else tuple(classes)
    if not labels or len(set(labels)) != len(labels) or any(value not in labels for value in y):
        raise ValueError("The declared class vocabulary must contain every target.")
    state = fit_prepare(table, categories)
    filled = np.where(np.isnan(table), state.medians, table)
    return Neighbours(state, transform(state, table, categories), filled, y, ids, copies, labels, k)


def predict(model, numeric, categories=None):
    queries = transform(model.preparation, numeric, categories)
    filled = np.where(np.isnan(numeric_table(numeric)), model.preparation.medians, numeric_table(numeric))
    width = len(model.preparation.medians)
    records = []
    for index, query in enumerate(queries):
        # The shared mean cancels. Subtract before dividing, so integer-line
        # equal distances do not acquire unequal rounding from two centerings.
        delta = (model.numeric_values - filled[index]) / model.preparation.scales
        squared = np.sum(delta ** 2, axis=1)
        squared += np.sum((model.features[:, width:] - query[width:]) ** 2, axis=1)
        order = sorted(range(len(squared)), key=lambda j: (float(squared[j]), model.source_ids[j], model.copy_ordinals[j]))
        chosen = order[:model.k]
        votes = Counter(model.targets[j] for j in chosen)
        winner = max(model.classes, key=lambda label: votes[label])
        records.append({"prediction": winner,
                        "votes": [votes[label] for label in model.classes],
                        "fractions": [votes[label] / model.k for label in model.classes],
                        "neighbours": [(model.source_ids[j], model.copy_ordinals[j]) for j in chosen],
                        "squared_distances": [float(squared[j]) for j in chosen]})
    return records


def kfold_indices(n, k, shuffle=False, seed=0):
    if type(k) is not int or not 2 <= k <= n:
        raise ValueError("Require integer 2 <= folds <= rows.")
    indices = np.arange(n)
    if shuffle:
        np.random.default_rng(seed).shuffle(indices)
    folds = np.array_split(indices, k)
    for held in range(k):
        yield np.sort(np.concatenate([folds[j] for j in range(k) if j != held])), folds[held]


def validate_split(train, held, n):
    train, held = tuple(train), tuple(held)
    if not train or not held or any(not isinstance(i, (int, np.integer)) or not 0 <= i < n for i in train + held):
        raise ValueError("Need nonempty in-bounds integer train/held indices.")
    if len(set(train)) != len(train) or len(set(held)) != len(held) or set(train) & set(held):
        raise ValueError("Ordinary split positions must be distinct and disjoint.")


def evaluate_folds(numeric, targets, splits, k=1, categories=None, source_ids=None):
    table = numeric_table(numeric)
    y = np.asarray(targets)
    category_table(categories, len(table))
    # Pass original missing values to fit_prepare; do not treat its sentinel as observed input.
    original_category = None if categories is None else np.asarray(categories, dtype=object)
    ids = np.arange(len(table)) if source_ids is None else np.asarray(source_ids)
    if len(y) != len(table) or len(ids) != len(table) or len(set(ids.tolist())) != len(ids):
        raise ValueError("Ordinary evaluation needs aligned, distinct source IDs.")
    records = []
    for train, held in splits:
        validate_split(train, held, len(table))
        train, held = np.asarray(train), np.asarray(held)
        model = fit_knn(table[train], y[train].tolist(), ids[train].tolist(), k,
                        None if original_category is None else original_category[train])
        predictions = predict(model, table[held], None if original_category is None else original_category[held])
        correct = sum(row["prediction"] == target for row, target in zip(predictions, y[held]))
        records.append({"train_ids": ids[train].tolist(), "held_ids": ids[held].tolist(),
                        "state": model.preparation.__dict__, "predictions": predictions,
                        "correct": int(correct), "assessed": len(held)})
    if not records:
        raise ValueError("At least one split is required.")
    return {"folds": records,
            "fold_mean": float(np.mean([row["correct"] / row["assessed"] for row in records])),
            "pooled": sum(row["correct"] for row in records) / sum(row["assessed"] for row in records)}


def ordinary_pipeline(k=1, numeric_columns=1, category_columns=0):
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler, OneHotEncoder
    branches = [("numeric", Pipeline([("fill", SimpleImputer(strategy="median")),
                                      ("scale", StandardScaler())]), list(range(numeric_columns)))]
    if category_columns:
        branches.append(("category", Pipeline([
            ("fill", SimpleImputer(strategy="constant", fill_value=MISSING_CATEGORY)),
            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]),
            list(range(numeric_columns, numeric_columns + category_columns))))
    return Pipeline([("prepare", ColumnTransformer(branches)),
                     ("classify", KNeighborsClassifier(n_neighbors=k, weights="uniform", metric="euclidean", algorithm="brute"))])


def main():
    train = np.array([[0.], [2.], [np.nan], [4.]])
    held = np.array([[10.], [np.nan]])
    categories = np.array([["a"], ["b"], ["a"], [None]], dtype=object)
    query_categories = np.array([["a"], ["new"]], dtype=object)
    state = fit_prepare(train, categories)
    print("state", json.dumps(state.__dict__))
    print("held transform", transform(state, held, query_categories).round(10).tolist())
    tool = ordinary_pipeline(1, 1, 1)
    ordinary_train = np.concatenate([train.astype(object), np.where(categories == None, np.nan, categories)], axis=1)
    ordinary_held = np.concatenate([held.astype(object), query_categories], axis=1)
    tool.fit(ordinary_train, [0, 0, 1, 1])
    # Library sorts the same observed categories and uses population variance.
    print("ordinary transform", tool["prepare"].transform(ordinary_held).round(10).tolist())
    x = np.arange(7, dtype=float)[:, None]
    y = [0, 0, 0, 1, 1, 1, 1]
    result = evaluate_folds(x, y, list(kfold_indices(7, 3)))
    for row in result["folds"]:
        print("fold", row["train_ids"], row["held_ids"],
              [r["prediction"] for r in row["predictions"]], row["correct"], row["assessed"],
              "mean", row["state"]["means"], "variance", row["state"]["variances"])
    from sklearn.model_selection import cross_val_score
    scores = cross_val_score(ordinary_pipeline(), x, y, cv=list(kfold_indices(7, 3)), error_score="raise")
    print("fold mean", result["fold_mean"], "pooled", result["pooled"], "ordinary fold scores", scores.tolist())


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
state {"medians": [2.0], "means": [2.0], "variances": [2.0], "scales": [1.4142135623730951], "vocabularies": [["__missing__", "a", "b"]]}
held transform [[5.6568542495, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 0.0]]
ordinary transform [[5.6568542495, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 0.0]]
fold [3, 4, 5, 6] [0, 1, 2] [1, 1, 1] 0 3 mean (4.5,) variance (1.25,)
fold [0, 1, 2, 5, 6] [3, 4] [0, 1] 1 2 mean (2.8,) variance (5.36,)
fold [0, 1, 2, 3, 4] [5, 6] [1, 1] 2 2 mean (2.0,) variance (2.0,)
fold mean 0.5 pooled 0.42857142857142855 ordinary fold scores [0.0, 0.5, 1.0]

```


In `main`, the mixed training table combines the numeric fixture with categories `a,b,a,missing`. Its saved vocabulary is `__missing__,a,b`; the held rows are `a,new`. Both scratch and ordinary routes produce `[5.6568542495,0,1,0]` and `[0,0,0,0]` to the shown precision. `ColumnTransformer` assigns numeric/category branches, `SimpleImputer` learns the median, `StandardScaler` stores population moments, and `OneHotEncoder(handle_unknown='ignore')` fixes the vocabulary. `Pipeline` fits all those objects inside each fold. The seven-row comparison then reproduces all three prediction lists and the separate two aggregations. Library tie behavior need not equal this explicitly sorted source/copy convention on every tied input; compare matched nonambiguous inputs or report a convention difference.

This reference processes queries separately, costing O(q[m d+m log m]) for q queries, m training occurrences and d prepared coordinates when sorting every distance list. Fitted dense storage is O(m d); transformed query/output storage and returned audit records are additional. Sorting each numeric column for a median and categorical vocabulary costs up to O(m dₙ log m+m c log m), followed by dense indicator allocation O(m v), where dₙ is numeric width, c categorical width and v total vocabulary width. A large real system can delegate neighbour indexing and sparse encoding to maintained libraries; the local reference keeps each new fit/transform boundary inspectable. All-missing numeric training columns, changed schemas, duplicate ordinary source IDs, nonfinite observed numbers and k larger than training size are explicit refusals. Bootstrap copies later have their own occurrence adapter, rather than weakening ordinary distinct-index checks.

A correct fresh fit still cannot make an unsuitable split answer the desired future-use question. Next we decide which people, times and available labels may cross each boundary.


<a id="3-choose-splits-that-match-the-future-use"></a>
## 3. Choose splits that match the future use

### Independent examples and rare classes

The seven-row example establishes the mechanics. Its class-sorted order also changes what each training set contains. When observations can reasonably be treated as independent draws from a common population, shuffled K-fold is a useful baseline. **Exchangeability** means that permuting these observations does not change the joint sampling description relevant to our question. A temporal sequence or repeated records from one person can violate the assumption that an ordinary row permutation preserves the task.

What does stratification actually preserve? Count the rare-class rows before assigning them.

<!-- Drawing D09: visual-specifications.md#d09. -->

With twelve rows and three positives, three folds can each receive one positive. With two positives and five folds, at least three held sets must lack positives: two rows cannot occupy five disjoint sets. **Stratified K-fold** approximately preserves class proportions, helping avoid missing-class model or metric failures. It cannot create observations or independent subjects. Homogeneous folds can also hide rare-class allocation variability; stratification is an engineering allocation choice rather than a universal uncertainty correction. The [official CV guide](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators-with-stratification-based-on-class-labels) explains these limits.

Five or ten folds are common starting choices, with no universal optimum. Increasing K increases the training fraction and number of fits. Leave-one-out (LOO) takes K=n, holding one row per fit; its variance depends on the learning procedure and distribution, not only on overlapping training sets. Section 7 demonstrates a counterexample to that overlap shortcut. Leave-P-out holds every size-P subset, requiring `choose(n,P)` fits; at n=5,P=2 there are ten. Repeated K-fold changes partitions of the **same** dataset, exposing split sensitivity without collecting new people. Repeated random holdout, often called Monte Carlo cross-validation, can vary training fraction independently of repetition count; some rows receive multiple held turns and others none. These methods change the sampling plan, rather than forming a ladder of progressively stronger guarantees.

### New people and later records are different tasks

A patient ID is not an ordinary coordinate to shuffle away. First say whether the new prediction concerns a new person or another record from someone already known.

<!-- Drawing D10: visual-specifications.md#d10. -->

In the new-person panel, every observation from held subject A stays outside that fit; training receives B and C. In the known-person future panel, A's available earlier records may train a prediction for A's later record. The first panel tests unseen-subject transfer; the second tests future use with that person's history. Using history in the second is legitimate under its availability rule. Reporting its score as new-person evidence changes the question.

`GroupKFold` and `LeaveOneGroupOut` express subject-disjoint held boundaries. `StratifiedGroupKFold` additionally tries to distribute class proportions, but indivisible groups can make exact balance impossible. Inspect the actual class/group membership of each emitted fold, especially when a class exists in only one group. A named splitter cannot guarantee enough training examples for every estimator or metric.

### A feature timestamp is not a label-availability timestamp

For a future prediction, what information would actually exist at decision time? Draw both clocks.

<!-- Drawing D11: visual-specifications.md#d11. -->

The six constructed records have source IDs 0–5 and event times `[0,1,2,5,8,9]` days. Labels arrive three days after each event, at `[3,4,5,8,11,12]`. At decision time 5, require training events strictly earlier than 5 and labels available **at or before** 5. IDs 0,1,2 qualify. ID 3's event at 5 is the assessed event, not an earlier donor. Increase delay to four days: ID 2's label arrives at 6 and leaves the legal training set, while IDs 0,1 remain. Inclusive availability at the decision time is an explicit convention here. The protected target may arrive later: assessment waits for that outcome, while the prediction itself uses only information available at the decision.

An expanding window accumulates permitted history; a sliding window can discard older history. A gap can account for delayed labels, overlapping feature windows or operational delay. `TimeSeriesSplit(gap=...)` counts rows, not elapsed days, so an index gap of one has no fixed calendar duration on these irregular dates. Explicit date logic is needed for a clock embargo or outcome horizon. Any rolling feature must also respect permitted past information. Equal-duration test windows and comparable sampling assumptions matter when comparing fold scores across time. A timestamp column alone does not make every retrospective question a forecasting task; choose the boundary from the intended use. [Time-Series Validation & Forecasting Baselines](/learn/path/full-curriculum/time-series-validation-forecasting-baselines?module=classical-ml) develops the complete forecasting protocol.

What if a product must serve new people **and** a future period? Intersect the two rules on the actual records.

<!-- Drawing D12: visual-specifications.md#d12. -->

Assign subjects `[A,B,A,A,B,C]` to the six records above and hold subject A's event at day 5. Under delay 3, time alone permits IDs 0,1,2. Subject disjointness removes A's IDs 0 and 2, leaving only B's ID 1. The drawing retains each excluded row and its reasons, rather than shrinking the table to a mysterious final count. Such an intersection can be empty; then the declared fit is infeasible. Group-disjoint random folds can still use future records, and forward folds can still share people. Neither named plan automatically implements both restrictions.

Three small adjacent investigations make these differences actionable: one edits the subject records/held subject, one edits events, decision time and delay, and one traces their joint intersection. They update permitted IDs and rejection reasons immediately. Targets on already excluded rows cannot change an information mask. The joint view refuses an empty legal training set, and reset restores the six-record fixture. No task selector hides these different prediction questions behind one label.

### A score table is not automatically a one-prediction-per-row table

Count held turns before attaching the name “out of fold” to an array.

<!-- Drawing D13: visual-specifications.md#d13. -->

K-fold partitions give coverage count 1 for every row. Repeated partitions give more than one held turn; random repeated holdouts may give zero, one or several. A forward plan retains a warm-up prefix. Each split can still produce a meaningful score under its own assumptions; producing one aligned prediction for **every supplied row** requires an additional contract.

<!-- Drawing D14: visual-specifications.md#d14. -->

The explicit forward plan trains on IDs 0–3 to assess 4–5, then trains 0–5 to assess 6–7. Coverage is `[0,0,0,0,1,1,1,1]`. The first four predictions stay absent. A table showing `0` there would falsely turn no prediction into a class-0 prediction. Filling them from a model fitted on those same rows would falsely relabel in-sample predictions as held-out evidence.

`cross_val_score` evaluates supplied split pairs. `cross_val_predict` additionally requires an exactly-once held partition of its supplied rows, as its [API contract](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_predict.html) states. A manual partial forward table can legitimately keep only covered rows for a downstream operation, provided it subsets **features, targets and predictions by the same original IDs**. The [Ensemble lesson's forward stacking construction](/learn/path/full-curriculum/ensemble-methods-stacking?module=classical-ml#forward-group-oof) owns the complete meta-model; here we expose coverage and alignment. We reuse the recorded library limitation without executing its known failure again.

The local coverage investigation edits actual train/held index lists. It displays counts, prediction absence and the computed exactly-once diagnostic; it never repairs coverage by inventing predictions. Repeated held IDs, out-of-bounds indices or train/held overlap receive explicit feedback. A predefined benchmark partition can also be expressed as index lists or `PredefinedSplit`; respect the question it was designed to assess instead of reshuffling for a better score.

### Local positions need a return map

Once an outer split selects a subset, position 0 means the first row of that subset. Which original observation is it?

<!-- Drawing D15: visual-specifications.md#d15. -->

Outer training source IDs are `[1,3,5,7,9,11,13,15]`, occupying local positions 0–7. Inner held positions `[0,2,4,6]` map to original IDs `[1,5,9,13]`. Applying them directly to the full source table instead selects `[0,2,4,6]`, a different experiment that can even reach protected rows. Group IDs, targets and weights must be subset in the same order. The adjacent mapping investigation edits both rulers and immediately shows the correspondence; duplicate/out-of-range positions refuse.

The next whole programme builds source-group held splits, explicit event/arrival masks, coverage and aligned partial rows. `available_split` records every exclusion reason. `source_positions` applies the outer-to-inner map. `aligned_partial_oof` keeps absent rows absent and refuses repeated coverage for a single-column prediction table. The ordinary examples deliberately have different contracts: GroupKFold preserves groups; TimeSeriesSplit applies index order/gap; PredefinedSplit represents a supplied partition; RepeatedKFold gives each row two turns in its two-repeat example. Agreement is assessed on their actual invariants, not on identical index output from differently defined algorithms.

<!-- Programme P05; source programmes/split_information_contracts.py; role new executed. -->

Save as `split_information_contracts.py`.

```python
"""Construct, inspect and align explicit information boundaries."""
import json
from itertools import combinations
import numpy as np
from fold_fitted_pipeline import validate_split


def group_held_splits(groups):
    groups = tuple(groups)
    for group in sorted(set(groups)):
        train = [i for i, value in enumerate(groups) if value != group]
        held = [i for i, value in enumerate(groups) if value == group]
        validate_split(train, held, len(groups))
        yield train, held


def available_split(events, available, decision, held, groups=None, unseen=False):
    events, available = np.asarray(events, float), np.asarray(available, float)
    if events.ndim != 1 or events.shape != available.shape or not np.isfinite(events).all() or not np.isfinite(available).all():
        raise ValueError("Need aligned finite event and availability times.")
    if np.any(available < events) or not np.isfinite(decision):
        raise ValueError("Availability cannot precede its event; decision time must be finite.")
    held = tuple(held)
    if not held or len(set(held)) != len(held) or any(type(i) is not int or not 0 <= i < len(events) for i in held):
        raise ValueError("Held positions must be nonempty, distinct and in bounds.")
    if unseen and (groups is None or len(groups) != len(events)):
        raise ValueError("The unseen-subject boundary needs aligned group IDs.")
    held_groups = set(groups[i] for i in held) if unseen else set()
    reasons, train = {}, []
    for i in range(len(events)):
        why = []
        if i in held:
            why.append("held")
        if events[i] >= decision:
            why.append("event not strictly earlier")
        if available[i] > decision:
            why.append("label not arrived")
        if unseen and groups[i] in held_groups:
            why.append("held subject")
        reasons[i] = why
        if not why:
            train.append(i)
    validate_split(train, held, len(events))
    return {"train": train, "held": list(held), "reasons": reasons}


def source_positions(outer_source_ids, inner_positions):
    ids, positions = tuple(outer_source_ids), tuple(inner_positions)
    if len(set(ids)) != len(ids) or len(set(positions)) != len(positions):
        raise ValueError("Source IDs and inner positions must each be distinct.")
    if any(type(i) is not int or not 0 <= i < len(ids) for i in positions):
        raise ValueError("Inner position is outside the outer-training subset.")
    return [ids[i] for i in positions]


def coverage(n, splits):
    counts = [0] * n
    for train, held in splits:
        validate_split(train, held, n)
        for i in held:
            counts[i] += 1
    return counts


def aligned_partial_oof(features, targets, predictions, counts):
    n = len(features)
    if any(len(column) != n for column in [targets, predictions, counts]):
        raise ValueError("All source-aligned columns need the same number of rows.")
    if any(count > 1 or count < 0 for count in counts):
        raise ValueError("One aligned prediction per row cannot represent repeated held turns.")
    if any((count == 0) != (prediction is None) for count, prediction in zip(counts, predictions)):
        raise ValueError("Absent turns must stay absent; covered turns need their actual prediction.")
    ids = [i for i, count in enumerate(counts) if count == 1]
    return {"source_ids": ids, "features": [features[i] for i in ids],
            "targets": [targets[i] for i in ids], "predictions": [predictions[i] for i in ids]}


def main():
    events = [0, 1, 2, 5, 8, 9]
    groups = ["A", "B", "A", "A", "B", "C"]
    for delay in [3, 4]:
        available = [time + delay for time in events]
        print("time", delay, json.dumps(available_split(events, available, 5, [3])))
    print("joint", json.dumps(available_split(events, [time + 3 for time in events], 5, [3], groups, True)))
    print("group held", list(group_held_splits(groups)))
    outer = [1, 3, 5, 7, 9, 11, 13, 15]
    print("mapped", source_positions(outer, [0, 2, 4, 6]))
    forward = [([0, 1, 2, 3], [4, 5]), ([0, 1, 2, 3, 4, 5], [6, 7])]
    counts = coverage(8, forward)
    predictions = [None, None, None, None, 0, 1, 1, 1]
    print("coverage", counts, "full OOF", all(value == 1 for value in counts))
    print("aligned", aligned_partial_oof(list(range(8)), [0, 0, 0, 0, 0, 1, 1, 1], predictions, counts))
    from sklearn.model_selection import (GroupKFold, StratifiedGroupKFold, TimeSeriesSplit,
                                         PredefinedSplit, RepeatedKFold, LeavePOut)
    x = np.arange(12)[:, None]
    y = np.tile([0, 1], 6)
    subject = np.repeat(np.arange(6), 2)
    for name, splitter in [("GroupKFold", GroupKFold(3)),
                           ("StratifiedGroupKFold", StratifiedGroupKFold(3))]:
        folds = list(splitter.split(x, y, subject))
        print(name, [(train.tolist(), held.tolist()) for train, held in folds],
              "group disjoint", all(not set(subject[train]) & set(subject[held]) for train, held in folds))
    print("TimeSeriesSplit", [(a.tolist(), b.tolist()) for a, b in TimeSeriesSplit(2, test_size=2, gap=1).split(x)])
    print("PredefinedSplit", [(a.tolist(), b.tolist()) for a, b in PredefinedSplit([-1, -1, 0, 0, 1, 1]).split()])
    repeated = list(RepeatedKFold(n_splits=3, n_repeats=2, random_state=7).split(x))
    print("RepeatedKFold coverage", coverage(12, repeated))
    print("LeavePOut count", len(list(LeavePOut(2).split(np.arange(5)))), "combination count", len(list(combinations(range(5), 2))))


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
time 3 {"train": [0, 1, 2], "held": [3], "reasons": {"0": [], "1": [], "2": [], "3": ["held", "event not strictly earlier", "label not arrived"], "4": ["event not strictly earlier", "label not arrived"], "5": ["event not strictly earlier", "label not arrived"]}}
time 4 {"train": [0, 1], "held": [3], "reasons": {"0": [], "1": [], "2": ["label not arrived"], "3": ["held", "event not strictly earlier", "label not arrived"], "4": ["event not strictly earlier", "label not arrived"], "5": ["event not strictly earlier", "label not arrived"]}}
joint {"train": [1], "held": [3], "reasons": {"0": ["held subject"], "1": [], "2": ["held subject"], "3": ["held", "event not strictly earlier", "label not arrived", "held subject"], "4": ["event not strictly earlier", "label not arrived"], "5": ["event not strictly earlier", "label not arrived"]}}
group held [([1, 4, 5], [0, 2, 3]), ([0, 2, 3, 5], [1, 4]), ([0, 1, 2, 3, 4], [5])]
mapped [1, 5, 9, 13]
coverage [0, 0, 0, 0, 1, 1, 1, 1] full OOF False
aligned {'source_ids': [4, 5, 6, 7], 'features': [4, 5, 6, 7], 'targets': [0, 1, 1, 1], 'predictions': [0, 1, 1, 1]}
GroupKFold [([0, 1, 2, 3, 6, 7, 8, 9], [4, 5, 10, 11]), ([0, 1, 4, 5, 6, 7, 10, 11], [2, 3, 8, 9]), ([2, 3, 4, 5, 8, 9, 10, 11], [0, 1, 6, 7])] group disjoint True
StratifiedGroupKFold [([2, 3, 4, 5, 8, 9, 10, 11], [0, 1, 6, 7]), ([0, 1, 4, 5, 6, 7, 10, 11], [2, 3, 8, 9]), ([0, 1, 2, 3, 6, 7, 8, 9], [4, 5, 10, 11])] group disjoint True
TimeSeriesSplit [([0, 1, 2, 3, 4, 5, 6], [8, 9]), ([0, 1, 2, 3, 4, 5, 6, 7, 8], [10, 11])]
PredefinedSplit [([0, 1, 4, 5], [2, 3]), ([0, 1, 2, 3], [4, 5])]
RepeatedKFold coverage [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
LeavePOut count 10 combination count 10

```


The output's time-3, time-4 and joint permitted lists are `[0,1,2]`, `[0,1]` and `[1]`. Its aligned forward rows are IDs 4,5,6,7, with the same four feature, target and prediction entries. That particular prediction column is supplied illustrative alignment data, not a newly fitted forward model or an assessment score; the index editor recomputes coverage and alignment without pretending its old supplied values came from changed fits. Group-aware nested code later passes `groups[outer_train]` into its inner splitter and maps returned local positions through `outer_train`. Optional experimental metadata routing can express consumer requests, but a group splitter, weighted estimator and weighted scorer consume different metadata. Explicit subset propagation remains the core route; enabling routing alone does not establish a correct boundary. Consult the [current routing guide](https://scikit-learn.org/stable/metadata_routing.html) when using that version-sensitive extension.

Legal information masks answer which rows a model may learn from. Another kind of learning remains: repeatedly comparing recipes can learn the quirks of the score itself. We can isolate that mechanism without any uncertain real-world optimum.


<a id="4-selection-can-learn-the-validation-answers"></a>
## 4. Selection can learn the validation answers

### Four fair labels expose the mechanism

Suppose four validation labels are independent fair bits and features reveal none of them. Compare two fixed rules, all-zero and all-one. Enumerate every possible outcome before introducing an expectation.

<!-- Drawing D16: visual-specifications.md#d16. -->

Each of the sixteen four-bit rows has probability 1/16. The drawing shows both correct counts, the selected rule and the selected count. When labels are `[1,1,1,0]`, all-one scores 3/4 and wins. Its predictions on independent fresh fair labels still have expected accuracy 1/2. Choosing from observed validation labels changes which rule we report, but provides no information about independent future bits.

| Number of ones | Number of outcome patterns | Best correct count |
| --- | ---: | ---: |
| 0 or 4 | 2 | 4 |
| 1 or 3 | 8 | 3 |
| 2 | 6 | 2 |

Average the displayed selected scores: `(2×4+8×3+6×2)/(16×4)=11/16=0.6875`. The future expectation remains 0.5. If candidates include all sixteen prediction patterns, one matches every observed validation outcome perfectly, making selected score 1, still with fresh expectation 1/2. Adding a duplicate all-zero rule instead changes no maximum. Candidate dependence and flexibility matter; a raw trial count does not imply a fixed optimism penalty.

More formally, let Sⱼ be a candidate's observed validation accuracy. The comparison reports `maxⱼ Sⱼ`; expectation and maximization do not generally commute. For every j, `maxᵣ Sᵣ ≥ Sⱼ`, so `E[maxᵣ Sᵣ] ≥ maxⱼ E[Sⱼ]`. In this example the inequality is strict. This explains an average selection effect, not a promise that every selected score exceeds every later test score. The [Cawley–Talbot study](https://jmlr.org/papers/volume11/cawley10a/cawley10a.pdf) places criterion overfitting in broader model-selection settings.

The local investigation edits four validation labels and actual candidate bit patterns, with stable candidate-order ties. Current scores and winner appear immediately. A duplicate is a null; a newly matching pattern changes the observed maximum. The exact sixteen-case average stays separate from the current case and from analytically known fresh accuracy. No future labels enter the choice. The complete programme below enumerates the same outcomes using rational arithmetic. `selected_score` computes each count, then a stable maximum; `exact_mean` averages over all equally likely label rows; `fresh_accuracy` separately averages a fixed selected prediction against independent fresh labels.

<!-- Programme P06; source programmes/finite_selection_optimism.py; role new executed. -->

Save as `finite_selection_optimism.py`.

```python
"""Exact criterion learning with four fair labels; no model fitting."""
from itertools import product
from fractions import Fraction


def selected_score(labels, candidates):
    labels = tuple(labels)
    if not labels or any(value not in (0, 1) for value in labels) or not candidates:
        raise ValueError("Need nonempty binary labels and candidate predictions.")
    if any(len(row) != len(labels) or any(value not in (0, 1) for value in row) for row in candidates):
        raise ValueError("Each candidate must predict one binary label per case.")
    scores = [Fraction(sum(a == b for a, b in zip(labels, row)), len(labels)) for row in candidates]
    selected = max(range(len(scores)), key=lambda i: scores[i])
    return selected, scores[selected], scores


def exact_mean(candidates, n=4):
    return sum((selected_score(labels, candidates)[1] for labels in product([0, 1], repeat=n)), Fraction(0)) / 2**n


def fresh_accuracy(prediction):
    n = len(prediction)
    return sum((Fraction(sum(a == b for a, b in zip(prediction, fresh)), n)
                for fresh in product([0, 1], repeat=n)), Fraction(0)) / 2**n


def main():
    candidates = [(0,) * 4, (1,) * 4]
    for labels in product([0, 1], repeat=4):
        winner, score, scores = selected_score(labels, candidates)
        print("labels", labels, "scores", [str(s) for s in scores], "winner", winner,
              "selected", str(score), "fresh", str(fresh_accuracy(candidates[winner])))
    print("constant rules mean", str(exact_mean(candidates)))
    print("duplicate rule mean", str(exact_mean(candidates + [candidates[0]])))
    print("all patterns mean", str(exact_mean(list(product([0, 1], repeat=4)))))
    print("changed pattern", selected_score((0, 1, 0, 1), candidates + [(0, 1, 0, 1)])[:2])


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
labels (0, 0, 0, 0) scores ['1', '0'] winner 0 selected 1 fresh 1/2
labels (0, 0, 0, 1) scores ['3/4', '1/4'] winner 0 selected 3/4 fresh 1/2
labels (0, 0, 1, 0) scores ['3/4', '1/4'] winner 0 selected 3/4 fresh 1/2
labels (0, 0, 1, 1) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (0, 1, 0, 0) scores ['3/4', '1/4'] winner 0 selected 3/4 fresh 1/2
labels (0, 1, 0, 1) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (0, 1, 1, 0) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (0, 1, 1, 1) scores ['1/4', '3/4'] winner 1 selected 3/4 fresh 1/2
labels (1, 0, 0, 0) scores ['3/4', '1/4'] winner 0 selected 3/4 fresh 1/2
labels (1, 0, 0, 1) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (1, 0, 1, 0) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (1, 0, 1, 1) scores ['1/4', '3/4'] winner 1 selected 3/4 fresh 1/2
labels (1, 1, 0, 0) scores ['1/2', '1/2'] winner 0 selected 1/2 fresh 1/2
labels (1, 1, 0, 1) scores ['1/4', '3/4'] winner 1 selected 3/4 fresh 1/2
labels (1, 1, 1, 0) scores ['1/4', '3/4'] winner 1 selected 3/4 fresh 1/2
labels (1, 1, 1, 1) scores ['0', '1'] winner 1 selected 1 fresh 1/2
constant rules mean 11/16
duplicate rule mean 11/16
all patterns mean 1
changed pattern (2, Fraction(1, 1))

```


Its exact 11/16, duplicate 11/16 and saturated 1 are conditional on these defined candidate families and fair-bit model. The O(2ⁿ M n) enumeration deliberately supports the small proof example; a large search uses statistical assessment rather than enumerating every possible outcome. A grid helper can enumerate candidate configurations, but cannot by itself establish this probability argument.

### Protect the entire choice

Which object should an untouched score assess when the chosen recipe depends on data? Draw the whole select-and-refit operation inside the permitted region.

<!-- Drawing D17: visual-specifications.md#d17. -->

The reserved-test route keeps a test set outside all development decisions. Search, preparation choices and refit use development data; the chosen fitted object then predicts reserved inputs. The nested route repeats the complete choice inside each outer training set. Within one outer training bundle, inner held folds supply selection evidence; outside that bundle, the outer assessment targets have no path back into the choice. Threshold selection, feature selection and early stopping belong inside the selection enclosure whenever they adapt to outcomes.

For one outer fold: protect its assessment rows; construct inner split pairs on the outer training subset; fit each complete candidate freshly on each inner training set; compute its declared inner criterion; select by fixed tie order; **refit** the selected configuration on all outer training rows; predict the protected inputs once. Repeat with fresh state for each outer fold. The outer score assesses this select-and-fit procedure at the outer training size, under the split's sampling assumptions. It does not identify an oracle-best setting or exactly estimate the error of one all-data fitted object without further conditions.

What does that enclosure actually compute? Use the sixteen-row line, where every fit can be traced.

<!-- Drawing D18: visual-specifications.md#d18. -->

Features are x=0,…,15; targets are 0 below 8 and 1 from 8 upward. The first outer fold trains on odd original IDs `[1,3,5,7,9,11,13,15]` and assesses even IDs. Inner held sets alternate local positions in that outer training list. Candidates k=1 and k=3 each achieve pooled accuracy 7/8=0.875, so fixed order selects k=1. A fresh fit on all eight odd rows predicts `[0,0,0,0,0,1,1,1]` on even queries, yielding 7/8 protected accuracy. The inner scores and outer score happen to agree here, but arise from different fitted states and evidence.

Which edits may change which arrows? Follow one changed training label, then one changed protected label.

<!-- Drawing D19: visual-specifications.md#d19. -->

Changing source row 3's target from 0 to 1 changes this fold's inner scores to 0.5 and 0.625, selecting k=3. Its protected predictions remain the same list in this particular changed case, at 7/8. Changing source row 2's target instead leaves this fold's selected configuration, fit and predictions unchanged, while protected correctness falls to 6/8. Row 2 is held only **for this outer operation**; it can legitimately train the other outer fold. Do not claim global label invariance across all folds. The local investigation edits a selected row's x/y, displays all inner neighbour paths and the outer refit, and resets the full fixture. Fold inspection traces another operation without silently changing the experiment. Invalid splits or illegal k refuse before fitting.

### A configuration survives; an inner fitted state does not

Why not deploy the best inner-fold model directly? Its training set omits an inner held block. Draw its lifetime separately from the winner's configuration.

<!-- Drawing D20: visual-specifications.md#d20. -->

Every candidate/fold owns a fresh preparation and reference set. Those fitted states expire after their comparison; the selected **configuration** enters another fit on all outer training rows. After outer assessment, final deployment selection begins again on all development data, then refits there. Voting among outer winners or choosing the outer model with highest assessment would introduce a different undeclared procedure. The final search uses more rows and can reasonably select a different setting.

`nested_procedure_from_indices.py` reuses the **displayed** P04 primitives through a guarded import. Its new work is explicit orchestration: alternating inner positions, candidate score records, stable selection, fresh refit and protected prediction. It also returns the separate final all-development selection. The ordinary route wraps `GridSearchCV` inside an explicit outer loop; `cross_validate` can equivalently clone that composite search for the outer plan. Group-aware extension subsets `groups` first and maps local inner indices back to source IDs. Neither route moves preparation outside the candidate fit.

<!-- Programme P07; source programmes/nested_procedure_from_indices.py; role new executed. -->

Save as `nested_procedure_from_indices.py`.

```python
"""Every select/refit state in a small nested experiment, without hidden helpers."""
import json
import numpy as np
from fold_fitted_pipeline import evaluate_folds, fit_knn, predict, validate_split, ordinary_pipeline


def alternating_splits(n):
    for parity in [0, 1]:
        held = np.arange(parity, n, 2)
        train = np.arange(1 - parity, n, 2)
        validate_split(train, held, n)
        yield train, held


def select_refit(x, y, source_ids, candidates=(1, 3)):
    x, y, source_ids = np.asarray(x, float), np.asarray(y), np.asarray(source_ids)
    inner = list(alternating_splits(len(x)))
    results = [evaluate_folds(x, y, inner, k=k, source_ids=source_ids) for k in candidates]
    winner = max(range(len(candidates)), key=lambda i: results[i]["pooled"])
    model = fit_knn(x, y.tolist(), source_ids.tolist(), k=candidates[winner])
    return model, {"candidate_order": list(candidates), "scores": [row["pooled"] for row in results],
                   "selected_k": candidates[winner], "inner": results,
                   "refit_ids": source_ids.tolist(), "refit_state": model.preparation.__dict__}


def nested(x, y):
    x, y = np.asarray(x, float), np.asarray(y)
    records = []
    for train, held in alternating_splits(len(x)):
        model, record = select_refit(x[train], y[train], train)
        prediction = predict(model, x[held])
        record.update({"assessment_ids": held.tolist(), "assessment_predictions": prediction,
                       "correct": sum(row["prediction"] == int(target) for row, target in zip(prediction, y[held]))})
        records.append(record)
    final_model, final = select_refit(x, y, np.arange(len(x)))
    return records, final_model, final


def ordinary_outer(x, y):
    from sklearn.model_selection import GridSearchCV, cross_validate
    records = []
    for train, held in alternating_splits(len(x)):
        inner = list(alternating_splits(len(train)))
        search = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                              scoring="accuracy", cv=inner, error_score="raise", n_jobs=1)
        search.fit(x[train], y[train])
        records.append({"selected_k": search.best_params_["classify__n_neighbors"],
                        "scores": search.cv_results_["mean_test_score"].tolist(),
                        "predictions": search.predict(x[held]).tolist()})
    # The composite search itself is the estimator cloned by the outer helper.
    composite = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                             cv=list(alternating_splits(len(x) // 2)), scoring="accuracy",
                             error_score="raise", n_jobs=1)
    summary = cross_validate(composite, x, y, cv=list(alternating_splits(len(x))),
                             scoring="accuracy", return_estimator=True, return_indices=True,
                             error_score="raise", n_jobs=1)
    return records, summary["test_score"].tolist()


def main():
    x = np.arange(16, dtype=float)[:, None]
    y = np.array([0] * 8 + [1] * 8)
    for name, target in [("default", y), ("training row3", np.where(np.arange(16) == 3, 1, y)),
                         ("assessment row2", np.where(np.arange(16) == 2, 1, y))]:
        rows, model, final = nested(x, target)
        first = rows[0]
        print(name, "scores", first["scores"], "selected", first["selected_k"],
              "assessment", [row["prediction"] for row in first["assessment_predictions"]],
              "correct", first["correct"], "/", len(first["assessment_ids"]))
        print(name, "inner lineage", json.dumps(first["inner"]))
        print(name, "outer refit", first["refit_ids"], first["refit_state"],
              "final selection", final["selected_k"], final["scores"], "final refit", final["refit_ids"])
    ordinary, composite = ordinary_outer(x, y)
    print("ordinary explicit", json.dumps(ordinary), "composite assessment", composite)
    # Group-aware adaptation uses outer-subset groups, then maps local positions.
    from sklearn.model_selection import GroupKFold
    groups = np.repeat(np.arange(8), 2)
    train, held = next(GroupKFold(2).split(x, y, groups))
    inner = list(GroupKFold(2).split(x[train], y[train], groups[train]))
    print("group mapping", [(train[a].tolist(), train[b].tolist()) for a, b in inner],
          "outer held", held.tolist())


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
default scores [0.875, 0.875] selected 1 assessment [0, 0, 0, 0, 0, 1, 1, 1] correct 7 / 8
default inner lineage [{"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[7, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[11, 0]], "squared_distances": [0.19999999999999998]}], "correct": 3, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[5, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[9, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[13, 0]], "squared_distances": [0.19999999999999998]}], "correct": 4, "assessed": 4}], "fold_mean": 0.875, "pooled": 0.875}, {"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[7, 0], [11, 0], [3, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[11, 0], [15, 0], [7, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}], "correct": 3, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[1, 0], [5, 0], [9, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[5, 0], [9, 0], [1, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[9, 0], [13, 0], [5, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[13, 0], [9, 0], [5, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}], "correct": 4, "assessed": 4}], "fold_mean": 0.875, "pooled": 0.875}]
default outer refit [1, 3, 5, 7, 9, 11, 13, 15] {'medians': (8.0,), 'means': (8.0,), 'variances': (21.0,), 'scales': (4.58257569495584,), 'vocabularies': ()} final selection 1 [0.9375, 0.9375] final refit [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
training row3 scores [0.5, 0.625] selected 3 assessment [0, 0, 0, 0, 0, 1, 1, 1] correct 7 / 8
training row3 inner lineage [{"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[7, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[11, 0]], "squared_distances": [0.19999999999999998]}], "correct": 1, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[5, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[9, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[13, 0]], "squared_distances": [0.19999999999999998]}], "correct": 3, "assessed": 4}], "fold_mean": 0.5, "pooled": 0.5}, {"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[7, 0], [11, 0], [3, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[11, 0], [15, 0], [7, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}], "correct": 2, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[1, 0], [5, 0], [9, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[5, 0], [9, 0], [1, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[9, 0], [13, 0], [5, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[13, 0], [9, 0], [5, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}], "correct": 3, "assessed": 4}], "fold_mean": 0.625, "pooled": 0.625}]
training row3 outer refit [1, 3, 5, 7, 9, 11, 13, 15] {'medians': (8.0,), 'means': (8.0,), 'variances': (21.0,), 'scales': (4.58257569495584,), 'vocabularies': ()} final selection 3 [0.8125, 0.875] final refit [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
assessment row2 scores [0.875, 0.875] selected 1 assessment [0, 0, 0, 0, 0, 1, 1, 1] correct 6 / 8
assessment row2 inner lineage [{"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[3, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[7, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[11, 0]], "squared_distances": [0.19999999999999998]}], "correct": 3, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[5, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[9, 0]], "squared_distances": [0.19999999999999998]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[13, 0]], "squared_distances": [0.19999999999999998]}], "correct": 4, "assessed": 4}], "fold_mean": 0.875, "pooled": 0.875}, {"folds": [{"train_ids": [3, 7, 11, 15], "held_ids": [1, 5, 9, 13], "state": {"medians": [9.0], "means": [9.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[3, 0], [7, 0], [11, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[7, 0], [11, 0], [3, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[11, 0], [15, 0], [7, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}], "correct": 3, "assessed": 4}, {"train_ids": [1, 5, 9, 13], "held_ids": [3, 7, 11, 15], "state": {"medians": [7.0], "means": [7.0], "variances": [20.0], "scales": [4.47213595499958], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[1, 0], [5, 0], [9, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 0, "votes": [2, 1], "fractions": [0.6666666666666666, 0.3333333333333333], "neighbours": [[5, 0], [9, 0], [1, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[9, 0], [13, 0], [5, 0]], "squared_distances": [0.19999999999999998, 0.19999999999999998, 1.8]}, {"prediction": 1, "votes": [1, 2], "fractions": [0.3333333333333333, 0.6666666666666666], "neighbours": [[13, 0], [9, 0], [5, 0]], "squared_distances": [0.19999999999999998, 1.8, 5.000000000000001]}], "correct": 4, "assessed": 4}], "fold_mean": 0.875, "pooled": 0.875}]
assessment row2 outer refit [1, 3, 5, 7, 9, 11, 13, 15] {'medians': (8.0,), 'means': (8.0,), 'variances': (21.0,), 'scales': (4.58257569495584,), 'vocabularies': ()} final selection 3 [0.8125, 0.875] final refit [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
ordinary explicit [{"selected_k": 1, "scores": [0.875, 0.875], "predictions": [0, 0, 0, 0, 0, 1, 1, 1]}, {"selected_k": 1, "scores": [0.875, 0.875], "predictions": [0, 0, 0, 0, 1, 1, 1, 1]}] composite assessment [0.875, 1.0]
group mapping [([0, 1, 8, 9], [4, 5, 12, 13]), ([4, 5, 12, 13], [0, 1, 8, 9])] outer held [2, 3, 6, 7, 10, 11, 14, 15]

```


The full lineage output identifies every train/held source ID, fitted mean/variance, neighbour identity, vote and prediction. The source-ID tie convention reproduces the hand cases; the ordinary route agrees on the shown default selections and predictions. A numerical distance implementation can resolve extremely close floating-point distances differently, so parity is established for these inputs rather than asserted for all ties. The code's cost is the sum of all complete candidate/fold fits and predictions, plus outer/final refits; training sizes vary, and retaining the audit grows memory beyond the fitted objects themselves.

### Choosing an epoch is still choosing

The same enclosure applies when a training loop offers many intermediate states. Put an epoch marker on its actual validation trajectory.

<!-- Drawing D21: visual-specifications.md#d21. -->

The epoch trajectory is explicitly illustrative, not a measured neural experiment. Its validation-loss minimum chooses a stopping policy inside permitted training/selection data. If outer assessment loss moves that marker, outer evidence has become selection evidence. One repair reserves a stopping subset inside each inner training partition, leaving inner validation for candidate comparison. Another treats inner-validation-based stopping as part of the complete adaptive rule, then assesses that rule on protected outer rows. A separately reserved final test is another valid route when all such choices occur in development. The stopping subset's learned preparation must respect the same boundary. Renaming a consulted set cannot remove its influence.

Protected evaluation encloses a declared choice rule. We next make the candidate space itself inspectable, because a search distribution decides which recipes ever receive evidence.


<a id="5-search-the-settings-you-actually-mean-to-compare"></a>
<a id="search-spaces"></a>
## 5. What does the search give a chance to win?

The inner loop compares recipes. Before choosing a search algorithm, write down what one recipe contains. In our six-card example, a card names both the neighbour count and the scaling rule. A scaler is part of the candidate even though it does not appear in the final voting formula: it changes the distances that determine the neighbours.

<!-- Drawing D22: visual-specifications.md#d22. -->

Read the parameter tree from the complete pipeline down to its leaves. In the real program below, `classify__n_neighbors` reaches the `classify` step; `prepare__numeric__scale` reaches the numeric branch of the preparation step. The double underscore is a path through nested estimator objects, not a separate statistical operation. With k in {3,5,11} and scaling in {standard,robust}, the Cartesian product has 3×2=6 complete configurations. Every configuration receives a fresh fitted preparation and predictor in every inner fold. The sampling-only reference uses shorter card labels `k` and `scaler`; they identify recipes before being mapped to estimator paths.

A conditional space is a union of products. Suppose one branch is a linear support-vector model with two values of C, and another is an RBF model with two C values and two gamma values. There are 2+2×2=6 useful cards. Gamma controls the RBF kernel's distance scale; it has no role in the linear branch. Giving the linear branch meaningless gamma settings creates duplicate effective recipes and distorts a sampling distribution. A list of separate parameter dictionaries expresses the conditional structure directly.

### Spend trials on coordinates, not just combinations

Imagine a two-parameter recipe when only the horizontal parameter affects the loss. A three-by-three grid pays for nine fits but visits only three horizontal values. Nine independent continuous draws almost surely visit nine horizontal values. Project both point sets onto the horizontal ruler before comparing the full clouds.

<!-- Drawing D23: visual-specifications.md#d23. -->

The vertical stripes represent an **illustrative** loss that depends only on the horizontal coordinate. They are not measured performance. The grid's repeated horizontal positions coincide in the projection; the seeded random draws have nine distinct projected values. If both coordinates matter through a narrow interaction, this picture alone cannot establish which search will work better. Grid search remains useful for small meaningful discrete spaces and interpretable comparisons. Random search spends the budget across more values of potentially influential coordinates, provided its distribution assigns useful regions enough mass. Neither picture guarantees a better fitted model.

### A distribution is a scientific choice

For a parameter that acts multiplicatively, equal increments can be a poor default. A regularization parameter C might reasonably range from 0.001 to 1000: changing 0.001 to 0.01 and changing 100 to 1000 are both tenfold changes. Place equal lengths on a logarithmic ruler, then map them back to ordinary values.

<!-- Drawing D24: visual-specifications.md#d24. -->

Draw U uniformly between 0 and 1, set Z=log(a)+U[log(b)−log(a)], then set C=exp(Z), with 0<a<b. Since a short interval dC has logarithmic length dC/C, the density on the ordinary ruler is

\[
f_C(c)=\frac{1}{c\log(b/a)},\qquad a\le c\le b.
\]

For a=0.001 and b=1000, each of the six decades has probability 1/6. On a linear-uniform ruler, the last decade [100,1000] receives 900/999.999 of the mass, about 90%; the first [0.001,0.01] receives only 0.009/999.999. A log axis must carry its actual decade labels; equal drawn distances there do not mean equal differences in C. Zero, negative, equal or inverted endpoints refuse this distribution. A valid mathematical range also needs domain judgment: an enormous interval can waste nearly all trials on useless settings.

Conditional branch probabilities matter too. Choose one of two branches with probability 1/2, then uniformly choose within that branch. If they contain two and eight unique settings, an individual setting has mass 1/4 in the small branch and 1/16 in the large branch. This differs from uniform sampling over their ten-setting union. Declare whether the goal is equal branch opportunity or equal configuration opportunity; naming both “random search” hides that difference.

### What does a trial budget promise?

Mark the sampler’s acceptable region and count attempts separately from their scores.

<!-- Drawing D25: visual-specifications.md#d25. -->

Call a region acceptable before computing the probability: perhaps all recipes within a specified loss tolerance under the declared selection protocol. Let p be the sampling distribution's mass in that region. With T **independent draws with replacement**, the probability of missing every time is (1−p)^T, so

\[
\Pr(\text{at least one acceptable draw})=1-(1-p)^T.
\]

At T=60, p=0.05 gives 0.9539302010; p=0.01 gives 0.4528433576. These are probabilities of visiting a region, not classification accuracies, and do not guarantee identifying its best member from noisy scores. For desired hit probability q, take T≥log(1−q)/log(1−p), then round up. At p=0.02 and q=0.95 this requires 149 draws. If the trials are adaptive, dependent or without replacement, this independence calculation needs replacement by their actual law. Duplicating the same evaluated recipe is not a new independent opportunity to visit the region.

Numerically, evaluate the independent formula as `-expm1(T*log1p(-p))` for interior p, with explicit p=0 and p=1 endpoints. Directly subtracting a power very close to one can lose precision. This implementation detail preserves the same probability argument.

<!-- Drawing D26: visual-specifications.md#d26. -->

On six finite cards, two acceptable, three draws **without replacement**, there are binomial(6,3)=20 equally likely unordered triples and binomial(4,3)=4 all-unacceptable triples. The hit probability is 1−4/20=4/5. Independent replacement draws instead give 1−(4/6)^3=19/27≈0.703704. The adjacent finite investigation edits acceptable card membership, budget and seed; probabilities update from the current mass, while the actual sampled cards remain a separate random realization. Three draws might miss despite either positive probability. With zero draws or no acceptable cards the probability is zero; drawing all six without replacement hits whenever at least one is acceptable. Asking for more than six without replacement is a refusal, not a reason to silently change sampling mode.

`parameter_spaces_and_sampling.py` implements these objects before invoking ordinary sampling tools. `cartesian_grid` enumerates complete cards, `conditional_grid` preserves branch structure, `finite_hit` uses exact integer combinations, and `log_uniform` implements the inverse transform with finite positive endpoint checks. The two-dimensional arrays printed at the end are the actual seeded points used in D23, with their projections counted directly.

<!-- Programme P08; source programmes/parameter_spaces_and_sampling.py; role new executed. -->

Save as `parameter_spaces_and_sampling.py`.

```python
"""Candidate grammars, sampling modes and exact coverage probabilities."""
from itertools import product
from math import comb, exp, expm1, log, log1p, isfinite
from fractions import Fraction
import random


def cartesian_grid(parameters):
    names = sorted(parameters)
    if any(not parameters[name] for name in names):
        raise ValueError("Every supplied parameter needs a nonempty list.")
    return [dict(zip(names, values)) for values in product(*(parameters[name] for name in names))]


def conditional_grid(branches):
    return [candidate for branch in branches for candidate in cartesian_grid(branch)]


def independent_hit(mass, draws):
    if not 0 <= mass <= 1 or type(draws) is not int or draws < 0:
        raise ValueError("Need a probability and a nonnegative integer draw count.")
    if draws == 0 or mass == 0:
        return 0.0
    if mass == 1:
        return 1.0
    return -expm1(draws * log1p(-mass))


def finite_hit(size, acceptable, draws):
    if any(type(value) is not int for value in (size, acceptable, draws)) or not 0 <= acceptable <= size or not 0 <= draws <= size:
        raise ValueError("Need integer 0 <= acceptable <= size and 0 <= draws <= size.")
    misses = comb(size - acceptable, draws) if draws <= size - acceptable else 0
    return 1 - Fraction(misses, comb(size, draws))


def log_uniform(u, low, high):
    if not all(isfinite(value) for value in (u, low, high)) or not 0 <= u <= 1 or not 0 < low < high:
        raise ValueError("Need a unit coordinate and positive increasing endpoints.")
    return exp(log(low) + u * (log(high) - log(low)))


def main():
    grid = {"k": [3, 5, 11], "scaler": ["standard", "robust"]}
    branches = [{"kernel": ["linear"], "C": [1, 10]},
                {"kernel": ["rbf"], "C": [1, 10], "gamma": [.1, 1]}]
    print("six candidates", cartesian_grid(grid))
    print("conditional candidates", conditional_grid(branches))
    rng = random.Random(19)
    print("replacement draws", [rng.randrange(6) for _ in range(3)])
    print("without replacement draws", rng.sample(range(6), 3))
    print("finite hit", str(finite_hit(6, 2, 3)), "independent exact", str(1 - Fraction(4, 6)**3))
    print("independent60", independent_hit(.05, 60), independent_hit(.01, 60))
    print("decade boundaries", [round(log_uniform(i / 6, .001, 1000), 8) for i in range(7)])
    print("branch per-setting mass", [str(Fraction(1, 2) / size) for size in [2, 8]])
    grid2d = list(product([0., .5, 1.], repeat=2))
    samples = [(rng.random(), rng.random()) for _ in range(9)]
    print("grid2d", grid2d)
    print("random2d", [[round(value, 8) for value in row] for row in samples])
    print("distinct first coordinates", len(set(row[0] for row in grid2d)), len(set(row[0] for row in samples)))
    from sklearn.model_selection import ParameterGrid, ParameterSampler, RandomizedSearchCV
    from sklearn.neighbors import KNeighborsClassifier
    from scipy.stats import loguniform
    print("ordinary grid agrees", list(ParameterGrid(grid)) == cartesian_grid(grid))
    print("ordinary conditional agrees", list(ParameterGrid(branches)) == conditional_grid(branches))
    print("ordinary all-list sampler", list(ParameterSampler(grid, n_iter=3, random_state=19)))
    distribution = {"n_neighbors": [1, 3], "p": loguniform(1, 2)}
    print("ordinary distribution sampler", list(ParameterSampler(distribution, n_iter=3, random_state=19)))
    # Configuration only: candidate sampling does not require fitting data.
    search = RandomizedSearchCV(KNeighborsClassifier(), {"n_neighbors": [1, 3, 5]},
                                n_iter=2, cv=3, random_state=19, n_jobs=1, error_score="raise")
    print("search configured", search.n_iter, search.param_distributions, "fit performed", False)


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
six candidates [{'k': 3, 'scaler': 'standard'}, {'k': 3, 'scaler': 'robust'}, {'k': 5, 'scaler': 'standard'}, {'k': 5, 'scaler': 'robust'}, {'k': 11, 'scaler': 'standard'}, {'k': 11, 'scaler': 'robust'}]
conditional candidates [{'C': 1, 'kernel': 'linear'}, {'C': 10, 'kernel': 'linear'}, {'C': 1, 'gamma': 0.1, 'kernel': 'rbf'}, {'C': 1, 'gamma': 1, 'kernel': 'rbf'}, {'C': 10, 'gamma': 0.1, 'kernel': 'rbf'}, {'C': 10, 'gamma': 1, 'kernel': 'rbf'}]
replacement draws [5, 0, 4]
without replacement draws [0, 4, 1]
finite hit 4/5 independent exact 19/27
independent60 0.9539302010130479 0.45284335760923855
decade boundaries [0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]
branch per-setting mass ['1/4', '1/16']
grid2d [(0.0, 0.0), (0.0, 0.5), (0.0, 1.0), (0.5, 0.0), (0.5, 0.5), (0.5, 1.0), (1.0, 0.0), (1.0, 0.5), (1.0, 1.0)]
random2d [[0.39353466, 0.99681694], [0.28936495, 0.14825979], [0.26107857, 0.26043719], [0.32736701, 0.26791084], [0.10764394, 0.32549974], [0.31106507, 0.56924002], [0.20163093, 0.07078772], [0.20255203, 0.54244259], [0.38856181, 0.73347057]]
distinct first coordinates 3 9
ordinary grid agrees True
ordinary conditional agrees True
ordinary all-list sampler [{'scaler': 'robust', 'k': 3}, {'scaler': 'standard', 'k': 11}, {'scaler': 'robust', 'k': 5}]
ordinary distribution sampler [{'n_neighbors': 3, 'p': np.float64(1.347670895273232)}, {'n_neighbors': 1, 'p': np.float64(1.1866857765179515)}, {'n_neighbors': 1, 'p': np.float64(1.195718400353012)}]
search configured 2 {'n_neighbors': [1, 3, 5]} fit performed False

```


Read the sampled card IDs separately from the exact probabilities. Seed 19 produces the printed replacement and without-replacement lists, but a seed is not an extra guarantee. The ordinary comparisons use `ParameterGrid`, `ParameterSampler` and a configured `RandomizedSearchCV`; no estimator fit is needed to inspect what they propose. With only lists, `ParameterSampler` samples without replacement; introducing a distribution with `rvs` changes the route to replacement sampling. For a list of dictionaries, branch selection also affects per-setting mass. Check these documented semantics when constructing a space rather than transferring the finite-card formula to every API call. [ParameterSampler documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.ParameterSampler.html).

The code is a transparent finite reference. Its grid costs grow with the number of enumerated configurations; it cannot enumerate a continuous space. Exact Python combinations avoid integer overflow but are still unnecessary when a stable analytic form exists. Search quality also depends on metric noise and the choice rule. We now read a complete real selection record, keeping those ingredients visible instead of treating its largest number as the whole experiment.


<a id="6-a-complete-nested-experiment-with-real-observations"></a>
<a id="penguins"></a>
## 6. Read a complete experiment, from rows to final refit

The small examples made every dependency visible. Our real example retains all 344 Palmer Penguins records and asks how a six-configuration preparation-plus-KNN selection procedure predicts species under the declared shuffled, stratified row-sampling protocol. It does not establish performance on a new island or a future season. Those requests would change the information boundary, and the available island/year fields alone do not establish a feasible representative assessment for every such request.

One actual row is Adelie, Torgersen, bill length 39.1 mm, bill depth 18.7 mm, flipper length 181 mm, body mass 3750 g, male, year 2007. The predictor uses the four measurements and sex; species is the target. Island and year remain available for examining scope but are not model inputs in this programme. Each numeric column has two missing values; sex has eleven. The loader retains these rows. Dropping all incomplete rows would define a different population and experiment.

The complete ordinary route is `cv_penguins.py`. Read its three functions as data loading, construction of one unfitted recipe, and the entire assessment/deployment procedure. Numeric preparation fills with training medians and applies a candidate StandardScaler or RobustScaler; categorical preparation fills a missing marker and one-hot encodes observed training categories, ignoring unknown categories at transform time. KNN uses the resulting mixed feature space. Robust scaling uses training medians and interquartile ranges; choosing it is a recipe choice, not a declaration that every outlier has been removed.

### Follow the first outer fold

Start with the source-ID table, not the aggregate score.

<!-- Drawing D27: visual-specifications.md#d27. -->

The first outer operation permits 229 training rows and protects 115 assessment rows. Its first inner assessment has 77 rows, leaving 152 for fitting; the other two inner assessments have 76 rows each, leaving 153. The stored inner ID lists are already mapped to original source IDs. An inner local position is never used as though it named that original row.

Read across a single candidate row: k=11 with StandardScaler receives inner accuracies 0.9740259740, 1 and 0.9868421053. Their equal-fold mean is 0.9869560264. It exceeds the other five candidate means in this outer operation, so its **configuration** wins. Refit that recipe from scratch on all 229 permitted rows, then predict the 115 protected rows once. The saved result has 114 correct. The drawing lets a reader inspect actual source memberships and table cells; inspection does not fabricate a new fitted experiment or causal edit of this retained record.

For comparison, k=3 Standard has mean 0.9782410572 and k=3 Robust has 0.9826270221 in this operation. These are selection evidence from the inner folds. Their difference is not an independently assessed advantage of scaling rules. The candidates share observations and their comparisons are correlated. The outer result belongs to the selected procedure, including its candidate space, tie rule and fitted preparation.

### Read all assessment denominators

<!-- Drawing D28: visual-specifications.md#d28. -->

The three selected outer recipes are 11/Standard, 3/Standard and 3/Robust. Their correct counts are 114/115, 114/115 and 112/114. Summing counts yields 340/344=0.9883720930. Equal weighting of the three fold accuracies gives 0.9883549453. The difference is small here because fold sizes differ by only one; its mathematical cause is the same as the seven-row example. Report the aggregation rule even when the numerical difference is easy to miss.

The majority baseline is also fitted inside each outer training set. It gets 51, 51 and 50 protected rows correct, respectively. This makes the comparison specific: a trivial training-majority rule correctly predicts 152 of the same 344 assessed rows. It does not turn the KNN estimate into a guarantee, and a nontrivial baseline could be more informative for another task.

The second outer search has a three-way best-mean tie: 3/Standard, 3/Robust and 5/Robust all score 0.9825700615. The first enumerated candidate wins. In the third outer search, five candidates share 0.9870129870; the first of those is 3/Robust. A deterministic tie is part of the procedure. Reporting the winner alone as evidence that its scaler or k was uniquely superior would discard the saved comparison.

### Deployment selection begins again

<!-- Drawing D29: visual-specifications.md#d29. -->

For the final fitted object, run the same six-card selector on all 344 development rows. The best final inner mean is 0.9913043478, tied by 3/Standard and 3/Robust; enumeration selects 3/Standard, then refits it on all 344 rows. The k=5 means are 0.9884057971; k=11 means are 0.9854818205. The final selection score is not a fourth outer assessment. No protected future rows have appeared merely because the final object used more development data. Nor do the three outer winners vote on the final recipe: that would be a different rule.

The nested pipeline workload contains 3×(6×3+1)=57 fits for outer search/refit, plus 6×3+1=19 final selection/refit fits: 76 complete pipeline fits. Three majority-baseline fits bring the listed total to 79. Fit counts say neither elapsed time nor equal work per fit; the inner, outer and final objects train on different row counts.

<!-- Programme P02; source programmes/cv_penguins.py; role retained. -->

Save as `cv_penguins.py`.

```python
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler, StandardScaler

def load_data():
    data = pd.read_csv(Path(__file__).with_name("penguins.csv"))
    columns = [
        "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g", "sex",
    ]
    return data[columns], data["species"]

def make_model():
    numeric = [
        "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g",
    ]
    prepare = ColumnTransformer([
        ("numeric", Pipeline([
            ("impute", SimpleImputer(strategy="median", keep_empty_features=True)),
            ("scale", StandardScaler()),
        ]), numeric),
        ("category", Pipeline([
            ("impute", SimpleImputer(
                strategy="constant", fill_value="not_recorded",
                keep_empty_features=True,
            )),
            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]), ["sex"]),
    ])
    return Pipeline([
        ("prepare", prepare),
        ("classify", KNeighborsClassifier()),
    ])

def main():
    X, y = load_data()
    grid = {
        "prepare__numeric__scale": [StandardScaler(), RobustScaler()],
        "classify__n_neighbors": [3, 5, 11],
    }
    outer = StratifiedKFold(n_splits=3, shuffle=True, random_state=41)
    held_out_predictions = np.empty(len(y), dtype=object)
    fold_scores = []
    for fold, (train, test) in enumerate(outer.split(X, y), start=1):
        inner = StratifiedKFold(n_splits=3, shuffle=True, random_state=73)
        search = GridSearchCV(
            make_model(), grid, cv=inner, scoring="accuracy",
            n_jobs=1, error_score="raise",
        )
        search.fit(X.iloc[train], y.iloc[train])
        prediction = search.predict(X.iloc[test])
        held_out_predictions[test] = prediction
        correct = int(np.sum(prediction == y.iloc[test]))
        fold_scores.append(correct / len(test))
        baseline = DummyClassifier(strategy="most_frequent")
        baseline.fit(np.zeros((len(train), 1)), y.iloc[train])
        base_prediction = baseline.predict(np.zeros((len(test), 1)))
        base_correct = int(np.sum(base_prediction == y.iloc[test]))
        chosen_k = search.best_params_["classify__n_neighbors"]
        chosen_scaler = type(search.best_params_["prepare__numeric__scale"]).__name__
        print(fold, chosen_k, chosen_scaler, correct, "/", len(test),
              "baseline", base_correct)

    print("outer fold mean", f"{np.mean(fold_scores):.7f}")
    print("outer pooled", f"{np.mean(held_out_predictions == y):.7f}")
    final = GridSearchCV(
        make_model(), grid,
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=73),
        scoring="accuracy", n_jobs=1, error_score="raise",
    )
    final.fit(X, y)
    print("final settings", final.best_params_)
    print("final selection score", f"{final.best_score_:.7f}")

if __name__ == "__main__":
    main()
```

Exact retained displayed stdout; historical execution, without retained terminal process newline.

```text
1 11 StandardScaler 114 / 115 baseline 51
2 3 StandardScaler 114 / 115 baseline 51
3 3 RobustScaler 112 / 114 baseline 50
outer fold mean 0.9883549
outer pooled 0.9883721
final settings {'classify__n_neighbors': 3, 'prepare__numeric__scale': StandardScaler()}
final selection score 0.9913043
```


These are the exact retained source and displayed stdout from the original execution. The source's default outer seed is 41 and inner seed 73. All six candidates use k in {3,5,11}, standard then robust scaling in the saved enumeration. Three outer folds assess the complete six-card, three-inner-fold selector. We inspect its saved arrays in `nested-experiment.json`; none of these original fits has been repeated for this lesson.

### A result table is also a decision interface

The historical experiment uses one metric and a fixed first-best rule. In practice, a procedure may constrain cost or choose among several metrics. Make that rule explicit before protected evaluation. In a separate constructed table, candidates A/B/C have fold costs (9,11,10)/(2,3,4)/(1,1,1), so their mean costs are 10/3/1. Their three accuracy cells are A=(0.80,0.90,0.70), B=(0.85,0.80,0.90), C=(0.95,0.94,failed). The complete means are 0.80 and 0.85; a mean-cost cap of 5 permits B and refuses C because a required fold failed. B wins at index 1. Cap 2 leaves no eligible candidate. Raising the cap to 10 admits A but B still has the larger score. Changing A's cells to (0.90,0.95,0.85) makes A's mean 0.90 and selects A at that cap. Equal eligible scores use the first input candidate; cost is a feasibility rule, not a secondary ranking rule.

The local table investigation edits actual score, failure and cost cells, then displays eligibility and the reason for its decision. A failed cell remains failed; it is neither an accurate zero nor an invitation to average only successful folds. C’s supplied cost cells are known, but this selector withholds both audited means for an incomplete row; the output’s absent summaries are not zero cost or a successful score. The actual ordinary experiment below is a **different**, newly constructed 24-row classification task. It demonstrates the API and prints its own metrics; do not substitute its values into the abstract table or the Penguins record.

<!-- Programme P09; source programmes/search_results_and_refit.py; role new executed. -->

Save as `search_results_and_refit.py`.

```python
"""Predeclared eligibility, multiple metrics, actual failures and fresh refit."""
import numpy as np


def select_table(rows, cost_cap=5):
    if not np.isfinite(cost_cap) or cost_cap < 0:
        raise ValueError("Cost cap must be finite and nonnegative.")
    eligible = []
    audit = []
    for i, row in enumerate(rows):
        scores, costs = row["accuracy"], row["cost"]
        complete = len(scores) == len(costs) > 0 and all(value is not None and np.isfinite(value) for value in scores + costs)
        mean = float(np.mean(scores)) if complete else None
        mean_cost = float(np.mean(costs)) if complete else None
        legal = complete and all(value >= 0 for value in costs) and mean_cost <= cost_cap
        audit.append({"index": i, "candidate": row["candidate"], "mean_accuracy": mean,
                      "mean_cost": mean_cost, "eligible": bool(legal)})
        if legal:
            eligible.append(i)
    if not eligible:
        raise ValueError("No candidate has all finite fold scores and acceptable mean cost.")
    winner = max(eligible, key=lambda i: audit[i]["mean_accuracy"])
    return winner, audit


def constructed_table():
    return [{"candidate": "A", "accuracy": [.80, .90, .70], "cost": [9, 11, 10]},
            {"candidate": "B", "accuracy": [.85, .80, .90], "cost": [2, 3, 4]},
            {"candidate": "C", "accuracy": [.95, .94, None], "cost": [1, 1, 1]}]


def ordinary_refit(results):
    rows = []
    costs = {0: 1, 1: 9, 3: 3}
    for i, parameter in enumerate(results["params"]):
        k = parameter["classify__n_neighbors"]
        scores = [float(results[f"split{j}_test_accuracy"][i]) for j in range(3)]
        rows.append({"candidate": k, "accuracy": scores, "cost": [costs[k]] * 3})
    return select_table(rows, cost_cap=5)[0]


def main():
    table = constructed_table()
    for cap in [5, 2, 10]:
        try:
            print("constructed cap", cap, select_table(table, cap))
        except ValueError as error:
            print("constructed cap", cap, "refusal", str(error))
    table[0]["accuracy"] = [.90, .95, .85]
    print("changed A cap10", select_table(table, 10))
    from sklearn.model_selection import GridSearchCV, StratifiedKFold
    from fold_fitted_pipeline import ordinary_pipeline
    x = np.arange(24, dtype=float)[:, None]
    y = (x[:, 0] >= 12).astype(int)
    train, held = np.arange(0, 24, 2), np.arange(1, 24, 2)
    folds = list(StratifiedKFold(3, shuffle=True, random_state=7).split(x[train], y[train]))
    scoring = {"accuracy": "accuracy", "balanced": "balanced_accuracy"}
    # k=0 deliberately fails inside candidate fits. Keep all warning diagnostics.
    search = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3, 0]},
                          scoring=scoring, cv=folds, refit=ordinary_refit,
                          error_score=np.nan, n_jobs=1)
    search.fit(x[train], y[train])
    print("ordinary training IDs", train.tolist(), "protected IDs", held.tolist())
    for i, parameters in enumerate(search.cv_results_["params"]):
        print("ordinary candidate", parameters,
              "accuracy", [float(search.cv_results_[f"split{j}_test_accuracy"][i]) for j in range(3)],
              "balanced", [float(search.cv_results_[f"split{j}_test_balanced"][i]) for j in range(3)])
    print("best_index", search.best_index_, "best_params", search.best_params_,
          "best_score exists", hasattr(search, "best_score_"))
    chosen_accuracy = search.cv_results_["mean_test_accuracy"][search.best_index_]
    protected_accuracy = float(np.mean(search.predict(x[held]) == y[held]))
    print("selected accuracy", float(chosen_accuracy), "protected accuracy", protected_accuracy)
    print("refit numeric state", search.best_estimator_["prepare"].named_transformers_["numeric"]["scale"].mean_.tolist())
    print("attempted fits", 3 * 3 + 1, "failed candidate fits", 3)
    # Repair the candidate space, then require all remaining fits to succeed.
    repaired = GridSearchCV(ordinary_pipeline(), {"classify__n_neighbors": [1, 3]},
                            scoring=scoring, cv=folds, refit=ordinary_refit,
                            error_score="raise", n_jobs=1)
    repaired.fit(x[train], y[train])
    print("repaired index", repaired.best_index_, "selected accuracy",
          float(repaired.cv_results_["mean_test_accuracy"][repaired.best_index_]),
          "repair fits", 2 * 3 + 1)


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
constructed cap 5 (1, [{'index': 0, 'candidate': 'A', 'mean_accuracy': 0.8000000000000002, 'mean_cost': 10.0, 'eligible': False}, {'index': 1, 'candidate': 'B', 'mean_accuracy': 0.85, 'mean_cost': 3.0, 'eligible': True}, {'index': 2, 'candidate': 'C', 'mean_accuracy': None, 'mean_cost': None, 'eligible': False}])
constructed cap 2 refusal No candidate has all finite fold scores and acceptable mean cost.
constructed cap 10 (1, [{'index': 0, 'candidate': 'A', 'mean_accuracy': 0.8000000000000002, 'mean_cost': 10.0, 'eligible': True}, {'index': 1, 'candidate': 'B', 'mean_accuracy': 0.85, 'mean_cost': 3.0, 'eligible': True}, {'index': 2, 'candidate': 'C', 'mean_accuracy': None, 'mean_cost': None, 'eligible': False}])
changed A cap10 (0, [{'index': 0, 'candidate': 'A', 'mean_accuracy': 0.9, 'mean_cost': 10.0, 'eligible': True}, {'index': 1, 'candidate': 'B', 'mean_accuracy': 0.85, 'mean_cost': 3.0, 'eligible': True}, {'index': 2, 'candidate': 'C', 'mean_accuracy': None, 'mean_cost': None, 'eligible': False}])
ordinary training IDs [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] protected IDs [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]
ordinary candidate {'classify__n_neighbors': 1} accuracy [1.0, 1.0, 0.75] balanced [1.0, 1.0, 0.75]
ordinary candidate {'classify__n_neighbors': 3} accuracy [1.0, 1.0, 0.75] balanced [1.0, 1.0, 0.75]
ordinary candidate {'classify__n_neighbors': 0} accuracy [nan, nan, nan] balanced [nan, nan, nan]
best_index 1 best_params {'classify__n_neighbors': 3} best_score exists False
selected accuracy 0.9166666666666666 protected accuracy 1.0
refit numeric state [11.0]
attempted fits 10 failed candidate fits 3
repaired index 1 selected accuracy 0.9166666666666666 repair fits 7

```

Complete actual stderr diagnostics, including the deliberately failed candidate fits:

```text
C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\model_selection\_validation.py:493: FitFailedWarning: 
3 fits failed out of a total of 9.
The score on these train-test partitions for these parameters will be set to nan.
If these failures are not expected, you can try to debug them by setting error_score='raise'.

Below are more details about the failures:
--------------------------------------------------------------------------------
3 fits failed with the following error:
Traceback (most recent call last):
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\model_selection\_validation.py", line 855, in _fit_and_score
    estimator.fit(X_train, y_train, **fit_params)
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\base.py", line 1403, in wrapper
    return fit_method(estimator, *args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\pipeline.py", line 645, in fit
    self._final_estimator.fit(Xt, y, **last_step_params["fit"])
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\base.py", line 1393, in wrapper
    estimator._validate_params()
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\base.py", line 554, in _validate_params
    validate_parameter_constraints(
  File "C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\utils\_param_validation.py", line 98, in validate_parameter_constraints
    raise InvalidParameterError(
sklearn.utils._param_validation.InvalidParameterError: The 'n_neighbors' parameter of KNeighborsClassifier must be an int in the range [1, inf) or None. Got 0 instead.

  warnings.warn(some_fits_failed_message, FitFailedWarning)
C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\model_selection\_search.py:1237: UserWarning: One or more of the test scores are non-finite: [0.91666667 0.91666667        nan]
  warnings.warn(

```


`select_table` first checks complete finite evidence and feasibility, then applies the declared tie order. The ordinary route supplies a scoring dictionary and callable `refit` to `GridSearchCV`. That callable returns the chosen row index; `best_index_`, `best_params_` and `best_estimator_` exist, while `best_score_` does not. Read the named metric cells explicitly. The deliberately invalid k=0 candidate fails three fits, yielding NaNs and the complete captured diagnostics above. `error_score` controls candidate-fit failure handling; final refit can still raise. The repaired call removes that invalid candidate and uses `error_score='raise'`. These are actual observed behaviors in the stated environment, consistent with the [GridSearchCV documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html).

The constructed run makes ten attempted fits including the three failed fits and final refit; its repair makes seven. The protected score is computed from explicit protected predictions after the rule is fixed. Choosing a different cost cap, metric or feasibility rule after seeing that protected score would extend adaptation and require fresh assessment. A metric name also carries direction: search maximizes scores; negative MSE is larger when squared error is smaller. Undo its sign when reporting MSE in squared target units.

We have separated rows, configuration choice, fitted states and assessment. The next difficulty survives even when all those boundaries are correct: what random quantity does the reported error estimate, and how much uncertainty can the same data support?


<a id="7-deeper-branch-what-cross-validation-uncertainty-does-and-does-not-mean"></a>
<a id="risk-and-uncertainty"></a>
## 7. What error is random, and what can its variation tell us?

A correct information boundary prevents one source of optimism. It does not make every error estimate unbiased for every target, nor make fold scores independent. Begin by deciding which object stays fixed when we imagine repetition.

<!-- Drawing D30: visual-specifications.md#d30. -->

On the left, fix the actual training table D and the fitted predictor f_D. Draw a fresh future pair (X,Y), apply that fixed predictor and average its loss. This is the conditional error of this fitted object,

\[
\operatorname{Err}(D)=\mathbb E_{(X,Y)\text{ fresh}}[\ell(Y,f_D(X))\mid D].
\]

On the right, draw a new training table D of size n, rerun the whole declared fitting or selection recipe, and then draw a fresh pair. Averaging again gives the recipe's expected error, \(\operatorname{Err}_n=\mathbb E_D[\operatorname{Err}(D)]\). A particular fitted object can be better or worse than that recipe average. The second expectation cannot tell us which one happened without further information. If the recipe includes candidate selection, the function D→f_D includes that selection.

Cross-validation trains on fewer than n rows and shares training observations across operations. Its interpretation depends on both the target and assumptions about those observations. “Unbiased” without naming the target, training size and randomness is incomplete. A separately sampled test set assesses the particular fixed fitted object conditionally on its training data, provided test observations really follow the intended future law and have not influenced adaptation. Its own finite test uncertainty remains.

### Derive a training-size effect without leakage

<!-- Drawing D31: visual-specifications.md#d31. -->

Take independent targets Y=μ+ε with mean-zero noise of variance σ². There are no useful features. The recipe predicts the training sample mean \(\bar Y_m\). A fresh Y is independent of that sample mean. Expand its squared error:

\[
\mathbb E[(Y-\bar Y_m)^2]
=\mathbb E[(Y-\mu)^2]+\mathbb E[(\bar Y_m-\mu)^2]
=\sigma^2+\frac{\sigma^2}{m}.
\]

The cross-term vanishes because the two centered terms are independent with mean zero. In contrast, each training Y_i helped form \(\bar Y_m\). Since \(\operatorname{Cov}(Y_i,\bar Y_m)=\sigma^2/m\), its expected training squared error is

\[
\sigma^2+\frac{\sigma^2}{m}-2\frac{\sigma^2}{m}
=\sigma^2(1-1/m).
\]

Read the two analytic curves around the irreducible σ² line. At σ²=4 and m=8, training error averages 7/2 and fresh error 9/2. At n=12, they are 11/3 and 13/3. A valid assessment of the eight-row recipe can therefore be pessimistic for the twelve-row recipe by 9/2−13/3=1/6, even with no information leak. This is an exact property of the mean predictor, not a universal learning-curve shape. Other algorithms can have nonmonotone risk. LOO uses nearly n training rows; larger K can reduce this particular training-size discrepancy while changing computation and dependence. It cannot be chosen solely by repeating “more folds is more accurate.”

### The variance of a mean includes its covariances

<!-- Drawing D32: visual-specifications.md#d32. -->

Let Z_1,…,Z_K be random fold scores or centered fluctuations. Expand the square of their mean around its expectation:

\[
\operatorname{Var}\!\left(\frac1K\sum_k Z_k\right)
=\frac1{K^2}\sum_{j,k}\operatorname{Cov}(Z_j,Z_k).
\]

The diagonal terms are individual variances; the off-diagonal terms describe joint movement. Only under an appropriate zero-covariance assumption does this reduce to a sum of variances divided by K². A standard deviation across the K observed fold numbers does not identify all those covariances.

To see the missing part, construct independent fair signs S,E_1,…,E_K, each ±1, and set Z_k=aS+bE_k. S is a common shock; E_k belongs only to fold k. They have mean zero, so each variance is a²+b², each off-diagonal covariance is a², and

\[
\operatorname{Var}(\bar Z)=a^2+b^2/K.
\]

At a²=b²=1/2 and K=4, the matrix has diagonal 1 and every off-diagonal cell 1/2. The mean variance is 1/2+1/8=5/8. An independence calculation with the same individual variance would give 1/4. The common shock moves every fold together and disappears when subtracting the observed fold mean to compute an across-fold spread. It therefore cannot be recovered from that spread alone. These are centered mathematical shocks; negative values are not claims of negative classification loss.

The local investigation edits a, b and K and shows the actual covariance cells and common/individual contributions. Setting a=0 removes the common term; setting b=0 makes averaging unable to reduce variance. At a²=0.2,b²=0.8,K=5, the mean variance is 0.36 rather than the independence value 0.20. This is a model with declared dependence, not a method for estimating a² from the visual amount of training overlap.

### Overlap does not itself specify a covariance

Consider a recipe that always predicts class 0 and ignores all training data. Give it independent fair binary labels. Each LOO correctness indicator is 1 exactly when that held label is 0. The training sets overlap almost completely, yet their fitted predictions have no training dependency at all.

<!-- Drawing D33: visual-specifications.md#d33. -->

The mean LOO accuracy is the average of n independent Bernoulli(1/2) indicators: expectation 1/2 and variance 1/(4n). Increasing n decreases that variance in this example. “LOO always has high variance because its training sets overlap” cannot be a universal law. An algorithm that responds strongly to shared training rows can behave very differently. Bengio–Grandvalet's impossibility result concerns a universally unbiased variance estimator for the usual K-fold setting across the distributions in their theorem; it does not rule out useful inference under extra structural assumptions. [Original paper](https://jmlr.org/papers/volume5/grandvalet04a/grandvalet04a.pdf).

`risk_and_covariance_exact.py` puts the mean-predictor formulas, common-shock covariance and always-zero counterexample in one complete executable reference. Fractions retain the exact proof values; NumPy's population-normalized covariance is an arithmetic comparison. Enumeration is intentionally bounded to small finite examples. It trades scalability for inspectability rather than claiming that exhaustive signs are a practical uncertainty estimator.

<!-- Programme P10; source programmes/risk_and_covariance_exact.py; role new executed. -->

Save as `risk_and_covariance_exact.py`.

```python
"""Exact risk formulas and finite shared-shock/LOO distributions."""
from fractions import Fraction
from itertools import product
import numpy as np


def mean_predictor_risk(variance, size):
    if variance < 0 or type(size) is not int or size < 1:
        raise ValueError("Need nonnegative variance and positive integer training size.")
    return variance * (1 - Fraction(1, size)), variance * (1 + Fraction(1, size))


def sign_covariance(folds):
    if type(folds) is not int or not 1 <= folds <= 10:
        raise ValueError("This exhaustive demonstration supports 1 through 10 folds.")
    signs = list(product([-1, 1], repeat=folds + 1))
    # Z=(S+E)/sqrt(2). Store numerator to retain exact rational products.
    numerator = [[row[0] + row[j + 1] for j in range(folds)] for row in signs]
    covariance = [[sum(Fraction(row[j] * row[k], 2) for row in numerator) / len(signs)
                   for k in range(folds)] for j in range(folds)]
    average_variance = sum(sum(row) for row in covariance) / folds**2
    ordinary = np.cov(np.asarray(numerator).T / np.sqrt(2), bias=True)
    return covariance, average_variance, ordinary


def fixed_zero_loo(n):
    if type(n) is not int or not 1 <= n <= 12:
        raise ValueError("This exact fair-label enumeration supports 1 through 12 rows.")
    accuracies = [Fraction(sum(value == 0 for value in labels), n) for labels in product([0, 1], repeat=n)]
    mean = sum(accuracies) / len(accuracies)
    variance = sum((value - mean)**2 for value in accuracies) / len(accuracies)
    return mean, variance


def main():
    for size in [8, 12]:
        train, fresh = mean_predictor_risk(Fraction(4), size)
        print("mean predictor", size, "training", str(train), "new", str(fresh), "optimism", str(fresh - train))
    covariance, variance, ordinary = sign_covariance(4)
    print("covariance", [[str(value) for value in row] for row in covariance])
    print("mean variance", str(variance), "independent comparator", str(Fraction(1, 4)))
    print("ordinary population covariance", ordinary.round(10).tolist())
    print("changed common/individual", str(Fraction(1, 5) + Fraction(4, 5) / 5))
    for size in [2, 4, 8]:
        mean, variance = fixed_zero_loo(size)
        print("fixed zero LOO", size, "mean", str(mean), "variance", str(variance))


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
mean predictor 8 training 7/2 new 9/2 optimism 1
mean predictor 12 training 11/3 new 13/3 optimism 2/3
covariance [['1', '1/2', '1/2', '1/2'], ['1/2', '1', '1/2', '1/2'], ['1/2', '1/2', '1', '1/2'], ['1/2', '1/2', '1/2', '1']]
mean variance 5/8 independent comparator 1/4
ordinary population covariance [[1.0, 0.5, 0.5, 0.5], [0.5, 1.0, 0.5, 0.5], [0.5, 0.5, 1.0, 0.5], [0.5, 0.5, 0.5, 1.0]]
changed common/individual 9/25
fixed zero LOO 2 mean 1/2 variance 1/8
fixed zero LOO 4 mean 1/2 variance 1/16
fixed zero LOO 8 mean 1/2 variance 1/32

```


Repeated folds give more views of the same finite sample, not new independent people. Report their variability descriptively when appropriate; an interval for future error needs a justified inferential method and sampling model. The same distinction will matter when we manufacture new training tables by resampling.

### Bootstrap the statistic you actually mean

<!-- Drawing D34: visual-specifications.md#d34. -->

A bootstrap draw samples n positions with replacement from the n observed units. The result is a multiset: repeats count. For four source rows, [0,0,2,2] has occurrence positions 0,1,2,3 but source IDs 0,0,2,2. Its source multiplicities are [2,0,2,0]; only source IDs 0 and 2 appear, and IDs 1 and 3 are out of bag.

Follow the source-to-copy arrows. Two copies of a row contribute twice to the empirical fitted distribution, including medians, means and neighbour votes. They do not become two independently observed people. A given original row is absent with probability (1−1/n)^n; expected distinct count is n[1−(1−1/n)^n]. For n=4 this is 175/64≈2.734375. The familiar limiting distinct share 1−e⁻¹≈0.632 is an asymptotic expectation, not the number every draw must contain.

The bootstrap statistic must be named as a function T(D). Resampling a simple sample mean and resampling an adaptive select-and-refit rule are different computations. Holding the chosen candidate fixed omits selection variability and describes a different statistic. In either case, whether the resulting bootstrap law approximates the desired sampling law requires assumptions; non-smooth selection, dependent observations and changing data distributions can defeat a naive interpretation. We use the following tiny procedure to expose what rerunning **the whole statistic** actually does, without claiming a confidence interval.

The source table is x=[0,1,2,3], y=[0,0,1,1]. T(D*) is the fraction of class-1 votes at a fixed future query x=1.5 after a declared inner selector and fresh refit. It is not out-of-bag accuracy, resubstitution accuracy or the selected inner score. Three distinct quantities need three distinct labels.

To define the inner selector on a multiset, sort its distinct source IDs and alternate them into two held groups. All copies of a source travel together. For each candidate k=1 then k=2, freshly fit the numeric median and population standard deviation on each permitted inner training multiset, predict held occurrences, and pool correct counts over held occurrences. A candidate is eligible only if k does not exceed the training occurrence count in either fold. Tied scores select the first candidate. Then refit its preparation and KNN reference set on the entire resample and predict the fixed query. Distances tie by source ID then copy ordinal; class vote ties choose class 0. These conventions make the finite statistic reproducible.

For [0,0,2,2], holding source 0 leaves two source-2 copies for training and vice versa. Both eligible candidates score zero across those opposite-label held groups, so k=1 wins. The all-resample refit has mean 1 and population variance 1; the query becomes 0.5 and its nearest source is 2, class 1. Thus T=1. Its resubstitution accuracy is 1, a different value from the grouped inner score 0. Splitting occurrence positions alternately would put a copy of each source into training and validation, producing the misleading inner accuracy 1 for this duplicated-source fixture.

Change the draw to [0,1,2,3]. The grouped k=1 score is 3/4 and k=2 score 1/2, so k=1 wins again. The final mean is 1.5 and variance 1.25. Query 1.5 ties sources 1 and 2 at squared standardized distance 1/5; source-ID order selects 1, class 0, so T=0. Permuting the same multiset changes neither fitted values nor T. The local investigation exposes occurrences, source groups, both inner fits and the final query path while editing the actual source-ID list or equivalent multiplicities.

The draw [0,0,0,2] leaves only one training occurrence in one fold, making k=2 ineligible while k=1 remains defined. A draw containing only one distinct source cannot form the required two nonempty source-held folds: T is undefined for this declared recipe. Do not silently redraw it. Of the 4⁴=256 ordered four-draw samples, the four constant-source draws are undefined, mass 4/256=1/64. Report that mass before optionally describing the conditional law on the remaining 252. This recipe's exact finite enumeration has T=0 on 188 draws and T=1 on 64. Renormalizing without naming the conditioning would conceal a procedure failure.

If the sampling unit is a person with several records, sample whole persons and keep all their source rows/copies together at an inner person boundary. The group extension in the code illustrates that bookkeeping. It does not establish bootstrap validity for every clustered population. Unknown IDs, negative or noninteger multiplicities, misaligned sampling-unit identities and an empty draw refuse explicitly.

<!-- Programme P11; source programmes/bootstrap_the_whole_statistic.py; role new executed. -->

Save as `bootstrap_the_whole_statistic.py`.

```python
"""A stated source-grouped select/refit functional on a resampled multiset."""
from collections import Counter
from itertools import product
import json
import numpy as np
from fold_fitted_pipeline import fit_knn, predict

X = np.arange(4, dtype=float)[:, None]
Y = [0, 0, 1, 1]


def occurrences(sample):
    sample = tuple(sample)
    if not sample or any(type(i) is not int or not 0 <= i < len(X) for i in sample):
        raise ValueError("Need a nonempty list of original integer IDs 0 through 3.")
    copies, seen = [], Counter()
    for source in sample:
        copies.append(seen[source])
        seen[source] += 1
    return sample, tuple(copies)


def ids_from_counts(counts):
    if len(counts) != 4 or any(type(value) is not int or value < 0 for value in counts):
        raise ValueError("Need four nonnegative integer multiplicities.")
    return [source for source, count in enumerate(counts) for _ in range(count)]


def mean_statistic(values, sample):
    ids, _ = occurrences(sample)
    if len(values) != len(X) or not np.isfinite(values).all():
        raise ValueError("Need four finite source values.")
    return sum(values[source] for source in ids) / len(ids)


def whole_statistic(sample, units=None):
    ids, copies = occurrences(sample)
    unit = ids if units is None else tuple(units)
    if len(unit) != len(ids):
        raise ValueError("Unit identities must align with occurrence positions.")
    source_units = {}
    for source, identity in zip(ids, unit):
        if source in source_units and source_units[source] != identity:
            raise ValueError("Every copy of an original source must retain the same sampling unit.")
        source_units[source] = identity
    distinct = sorted(set(unit))
    weights = [ids.count(i) for i in range(4)]
    common = {"sample": list(ids), "copies": list(copies), "weights": weights,
              "out_of_bag": [i for i, count in enumerate(weights) if count == 0]}
    if len(distinct) < 2:
        return {**common, "defined": False, "reason": "fewer than two distinct sampling units", "T": None}
    held_units = [set(distinct[parity::2]) for parity in [0, 1]]
    splits = []
    for selected in held_units:
        held = [i for i, value in enumerate(unit) if value in selected]
        train = [i for i, value in enumerate(unit) if value not in selected]
        splits.append((train, held))
    candidates = []
    for k in [1, 2]:
        if any(k > len(train) for train, held in splits):
            candidates.append({"k": k, "eligible": False, "reason": "k exceeds a training-occurrence count"})
            continue
        folds = []
        for train, held in splits:
            model = fit_knn(X[[ids[i] for i in train]], [Y[ids[i]] for i in train],
                            [ids[i] for i in train], k=k, copy_ordinals=[copies[i] for i in train], classes=(0, 1))
            prediction = predict(model, X[[ids[i] for i in held]])
            correct = sum(row["prediction"] == Y[ids[i]] for i, row in zip(held, prediction))
            folds.append({"train_positions": train, "held_positions": held,
                          "train_source_ids": [ids[i] for i in train], "held_source_ids": [ids[i] for i in held],
                          "state": model.preparation.__dict__, "predictions": prediction,
                          "correct": correct, "assessed": len(held)})
        candidates.append({"k": k, "eligible": True, "folds": folds,
                           "pooled": sum(row["correct"] for row in folds) / len(ids)})
    eligible = [row for row in candidates if row["eligible"]]
    winner = max(eligible, key=lambda row: row["pooled"])
    model = fit_knn(X[list(ids)], [Y[i] for i in ids], list(ids), k=winner["k"],
                    copy_ordinals=copies, classes=(0, 1))
    query = predict(model, [[1.5]])[0]
    resub = predict(model, X[list(ids)])
    return {**common, "defined": True, "candidates": candidates, "selected_k": winner["k"],
            "final_state": model.preparation.__dict__, "query": query, "T": query["fractions"][1],
            "resubstitution_accuracy": sum(row["prediction"] == Y[i] for row, i in zip(resub, ids)) / len(ids)}


def group_occurrences(row_groups, drawn_groups):
    if len(row_groups) != 4 or not drawn_groups or any(group not in row_groups for group in drawn_groups):
        raise ValueError("Need known original group IDs and four aligned source-row memberships.")
    ids, units = [], []
    for group in drawn_groups:
        for source, source_group in enumerate(row_groups):
            if source_group == group:
                ids.append(source)
                units.append(group)
    return ids, units


def wrong_occurrence_split_accuracy(sample):
    ids, copies = occurrences(sample)
    correct = 0
    for parity in [0, 1]:
        held = list(range(parity, len(ids), 2))
        train = list(range(1 - parity, len(ids), 2))
        model = fit_knn(X[[ids[i] for i in train]], [Y[ids[i]] for i in train],
                        [ids[i] for i in train], copy_ordinals=[copies[i] for i in train], classes=(0, 1))
        prediction = predict(model, X[[ids[i] for i in held]])
        correct += sum(row["prediction"] == Y[ids[i]] for row, i in zip(prediction, held))
    return correct / len(ids)


def main():
    for name, ids in [("default", [0, 0, 2, 2]), ("changed", [0, 1, 2, 3]),
                      ("permuted", [2, 0, 2, 0]), ("ineligible k2", [0, 0, 0, 2]),
                      ("undefined", [0, 0, 0, 0])]:
        print(name, json.dumps(whole_statistic(ids)))
    values = [1., 3., 5., 7.]
    sample = [0, 0, 2, 2]
    print("mean statistic", mean_statistic(values, sample), "numpy", float(np.mean(np.asarray(values)[sample])))
    from sklearn.utils import resample
    drawn = resample(np.arange(4), replace=True, n_samples=4, random_state=19).tolist()
    print("ordinary resampled IDs", drawn, "multiplicities", [drawn.count(i) for i in range(4)])
    counts = Counter()
    for ids in product(range(4), repeat=4):
        result = whole_statistic(ids)
        counts["undefined" if not result["defined"] else str(result["T"])] += 1
    print("ordered sampling law", dict(counts), "total", sum(counts.values()),
          "undefined mass", counts["undefined"] / 256, "defined conditional denominator", 256 - counts["undefined"])
    print("wrong occurrence split", wrong_occurrence_split_accuracy(sample))
    group_ids, units = group_occurrences(["A", "A", "B", "B"], ["A", "B"])
    print("group unit", group_ids, units, json.dumps(whole_statistic(group_ids, units)))


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
default {"sample": [0, 0, 2, 2], "copies": [0, 1, 0, 1], "weights": [2, 0, 2, 0], "out_of_bag": [1, 3], "defined": true, "candidates": [{"k": 1, "eligible": true, "folds": [{"train_positions": [2, 3], "held_positions": [0, 1], "train_source_ids": [2, 2], "held_source_ids": [0, 0], "state": {"medians": [2.0], "means": [2.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 2}, {"train_positions": [0, 1], "held_positions": [2, 3], "train_source_ids": [0, 0], "held_source_ids": [2, 2], "state": {"medians": [0.0], "means": [0.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [4.0]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}, {"k": 2, "eligible": true, "folds": [{"train_positions": [2, 3], "held_positions": [0, 1], "train_source_ids": [2, 2], "held_source_ids": [0, 0], "state": {"medians": [2.0], "means": [2.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [2, 1]], "squared_distances": [4.0, 4.0]}, {"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [2, 1]], "squared_distances": [4.0, 4.0]}], "correct": 0, "assessed": 2}, {"train_positions": [0, 1], "held_positions": [2, 3], "train_source_ids": [0, 0], "held_source_ids": [2, 2], "state": {"medians": [0.0], "means": [0.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0], [0, 1]], "squared_distances": [4.0, 4.0]}, {"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0], [0, 1]], "squared_distances": [4.0, 4.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}], "selected_k": 1, "final_state": {"medians": [1.0], "means": [1.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "query": {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [0.25]}, "T": 1.0, "resubstitution_accuracy": 1.0}
changed {"sample": [0, 1, 2, 3], "copies": [0, 0, 0, 0], "weights": [1, 1, 1, 1], "out_of_bag": [], "defined": true, "candidates": [{"k": 1, "eligible": true, "folds": [{"train_positions": [1, 3], "held_positions": [0, 2], "train_source_ids": [1, 3], "held_source_ids": [0, 2], "state": {"medians": [2.0], "means": [2.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [1.0]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [1.0]}], "correct": 1, "assessed": 2}, {"train_positions": [0, 2], "held_positions": [1, 3], "train_source_ids": [0, 2], "held_source_ids": [1, 3], "state": {"medians": [1.0], "means": [1.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [1.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [1.0]}], "correct": 2, "assessed": 2}], "pooled": 0.75}, {"k": 2, "eligible": true, "folds": [{"train_positions": [1, 3], "held_positions": [0, 2], "train_source_ids": [1, 3], "held_source_ids": [0, 2], "state": {"medians": [2.0], "means": [2.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 1], "fractions": [0.5, 0.5], "neighbours": [[1, 0], [3, 0]], "squared_distances": [1.0, 9.0]}, {"prediction": 0, "votes": [1, 1], "fractions": [0.5, 0.5], "neighbours": [[1, 0], [3, 0]], "squared_distances": [1.0, 1.0]}], "correct": 1, "assessed": 2}, {"train_positions": [0, 2], "held_positions": [1, 3], "train_source_ids": [0, 2], "held_source_ids": [1, 3], "state": {"medians": [1.0], "means": [1.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 1], "fractions": [0.5, 0.5], "neighbours": [[0, 0], [2, 0]], "squared_distances": [1.0, 1.0]}, {"prediction": 0, "votes": [1, 1], "fractions": [0.5, 0.5], "neighbours": [[2, 0], [0, 0]], "squared_distances": [1.0, 9.0]}], "correct": 1, "assessed": 2}], "pooled": 0.5}], "selected_k": 1, "final_state": {"medians": [1.5], "means": [1.5], "variances": [1.25], "scales": [1.118033988749895], "vocabularies": []}, "query": {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [0.19999999999999998]}, "T": 0.0, "resubstitution_accuracy": 1.0}
permuted {"sample": [2, 0, 2, 0], "copies": [0, 0, 1, 1], "weights": [2, 0, 2, 0], "out_of_bag": [1, 3], "defined": true, "candidates": [{"k": 1, "eligible": true, "folds": [{"train_positions": [0, 2], "held_positions": [1, 3], "train_source_ids": [2, 2], "held_source_ids": [0, 0], "state": {"medians": [2.0], "means": [2.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 2}, {"train_positions": [1, 3], "held_positions": [0, 2], "train_source_ids": [0, 0], "held_source_ids": [2, 2], "state": {"medians": [0.0], "means": [0.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [4.0]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}, {"k": 2, "eligible": true, "folds": [{"train_positions": [0, 2], "held_positions": [1, 3], "train_source_ids": [2, 2], "held_source_ids": [0, 0], "state": {"medians": [2.0], "means": [2.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [2, 1]], "squared_distances": [4.0, 4.0]}, {"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [2, 1]], "squared_distances": [4.0, 4.0]}], "correct": 0, "assessed": 2}, {"train_positions": [1, 3], "held_positions": [0, 2], "train_source_ids": [0, 0], "held_source_ids": [2, 2], "state": {"medians": [0.0], "means": [0.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0], [0, 1]], "squared_distances": [4.0, 4.0]}, {"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0], [0, 1]], "squared_distances": [4.0, 4.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}], "selected_k": 1, "final_state": {"medians": [1.0], "means": [1.0], "variances": [1.0], "scales": [1.0], "vocabularies": []}, "query": {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [0.25]}, "T": 1.0, "resubstitution_accuracy": 1.0}
ineligible k2 {"sample": [0, 0, 0, 2], "copies": [0, 1, 2, 0], "weights": [3, 0, 1, 0], "out_of_bag": [1, 3], "defined": true, "candidates": [{"k": 1, "eligible": true, "folds": [{"train_positions": [3], "held_positions": [0, 1, 2], "train_source_ids": [2], "held_source_ids": [0, 0, 0], "state": {"medians": [2.0], "means": [2.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 3}, {"train_positions": [0, 1, 2], "held_positions": [3], "train_source_ids": [0, 0, 0], "held_source_ids": [2], "state": {"medians": [0.0], "means": [0.0], "variances": [0.0], "scales": [1.0], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[0, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 1}], "pooled": 0.0}, {"k": 2, "eligible": false, "reason": "k exceeds a training-occurrence count"}], "selected_k": 1, "final_state": {"medians": [0.0], "means": [0.5], "variances": [0.75], "scales": [0.8660254037844386], "vocabularies": []}, "query": {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [0.3333333333333334]}, "T": 1.0, "resubstitution_accuracy": 1.0}
undefined {"sample": [0, 0, 0, 0], "copies": [0, 1, 2, 3], "weights": [4, 0, 0, 0], "out_of_bag": [1, 2, 3], "defined": false, "reason": "fewer than two distinct sampling units", "T": null}
mean statistic 3.0 numpy 3.0
ordinary resampled IDs [1, 2, 1, 2] multiplicities [0, 2, 2, 0]
ordered sampling law {'undefined': 4, '0.0': 188, '1.0': 64} total 256 undefined mass 0.015625 defined conditional denominator 252
wrong occurrence split 1.0
group unit [0, 1, 2, 3] ['A', 'A', 'B', 'B'] {"sample": [0, 1, 2, 3], "copies": [0, 0, 0, 0], "weights": [1, 1, 1, 1], "out_of_bag": [], "defined": true, "candidates": [{"k": 1, "eligible": true, "folds": [{"train_positions": [2, 3], "held_positions": [0, 1], "train_source_ids": [2, 3], "held_source_ids": [0, 1], "state": {"medians": [2.5], "means": [2.5], "variances": [0.25], "scales": [0.5], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [16.0]}, {"prediction": 1, "votes": [0, 1], "fractions": [0.0, 1.0], "neighbours": [[2, 0]], "squared_distances": [4.0]}], "correct": 0, "assessed": 2}, {"train_positions": [0, 1], "held_positions": [2, 3], "train_source_ids": [0, 1], "held_source_ids": [2, 3], "state": {"medians": [0.5], "means": [0.5], "variances": [0.25], "scales": [0.5], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [4.0]}, {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [16.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}, {"k": 2, "eligible": true, "folds": [{"train_positions": [2, 3], "held_positions": [0, 1], "train_source_ids": [2, 3], "held_source_ids": [0, 1], "state": {"medians": [2.5], "means": [2.5], "variances": [0.25], "scales": [0.5], "vocabularies": []}, "predictions": [{"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [3, 0]], "squared_distances": [16.0, 36.0]}, {"prediction": 1, "votes": [0, 2], "fractions": [0.0, 1.0], "neighbours": [[2, 0], [3, 0]], "squared_distances": [4.0, 16.0]}], "correct": 0, "assessed": 2}, {"train_positions": [0, 1], "held_positions": [2, 3], "train_source_ids": [0, 1], "held_source_ids": [2, 3], "state": {"medians": [0.5], "means": [0.5], "variances": [0.25], "scales": [0.5], "vocabularies": []}, "predictions": [{"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0], [0, 0]], "squared_distances": [4.0, 16.0]}, {"prediction": 0, "votes": [2, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0], [0, 0]], "squared_distances": [16.0, 36.0]}], "correct": 0, "assessed": 2}], "pooled": 0.0}], "selected_k": 1, "final_state": {"medians": [1.5], "means": [1.5], "variances": [1.25], "scales": [1.118033988749895], "vocabularies": []}, "query": {"prediction": 0, "votes": [1, 0], "fractions": [1.0, 0.0], "neighbours": [[1, 0]], "squared_distances": [0.19999999999999998]}, "T": 0.0, "resubstitution_accuracy": 1.0}

```


The complete source imports the already displayed guarded P04 fitted primitive. Its local occurrence-aware adapter keeps multiplicities and group identities; it does not pass repeated IDs through the distinct-index fold validator. `whole_statistic` also refuses assigning different sampling units to copies of the same original source. Read it from eligibility through both inner operations to the final refit. The ordinary `sklearn.utils.resample` comparison checks index multiplicities, and NumPy checks the separate sample-mean statistic. Neither ordinary helper implements the whole adaptive statistic automatically. The short 256-draw enumeration is a new exact teaching computation, separate from every historical Penguins fit.

### A deeper identity for uncertainty about an error estimate

Nested tuning protects an adaptive choice. Bates–Hastie–Tibshirani also study a different use of nested resampling: estimating the mean squared error of an error estimate. 

<!-- Drawing D35: visual-specifications.md#d35. -->

Begin with a probability identity rather than equating the two meanings of “nested.” Let A be a training-only error estimate; let μ be the true conditional error of the fixed trained object; let \(\bar H\) average independent holdout losses. Conditional on training information, A and μ are fixed, \(\mathbb E[\bar H]=\mu\), and the centered holdout term has mean zero. Expand:

\[
\begin{aligned}
\mathbb E[(A-\bar H)^2\mid D]
&=(A-\mu)^2+\operatorname{Var}(\bar H\mid D),\\
\mathbb E[(A-\bar H)^2\mid D]-\operatorname{Var}(\bar H\mid D)
&=(A-\mu)^2.
\end{aligned}
\]

The cross-term is \(-2(A-\mu)\mathbb E[\bar H-\mu\mid D]=0\). With h conditionally independent identically distributed holdout losses of variance v, the variance term is v/h. Dependence requires its actual covariance sum instead.

Take A=1/4 and μ=1/2, with two independent fair zero-one holdout losses. Their mean is 0,1/2,1 with probabilities 1/4,1/2,1/4. The expected squared discrepancy from A is 3/16; holdout-mean variance is 1/8; subtract to obtain 1/16, exactly (1/4−1/2)². The larger discrepancy includes holdout noise, so subtracting it targets uncertainty in A rather than all variation in the comparison. For one observed holdout mean 0, however, (A−0)²−1/8=−1/16. A finite subtraction can be negative even when the target expectation is nonnegative. Clipping it and calling it a valid confidence interval would add an unjustified inference rule.

<!-- Programme P12; source programmes/holdout_mse_identity.py; role new executed. -->

Save as `holdout_mse_identity.py`.

```python
"""A finite conditional holdout identity, not an interval-estimation algorithm."""
from fractions import Fraction as F
from itertools import product
import numpy as np
from math import isfinite


def finite_expectation(values, masses):
    if len(values) != len(masses) or not values or any(not isfinite(value) for value in values + masses) or any(mass < 0 for mass in masses) or sum(masses) != 1:
        raise ValueError("Need aligned finite values and nonnegative exact masses summing to one.")
    return sum(value * mass for value, mass in zip(values, masses))


def holdout_identity(estimate, loss_values, masses, held_size):
    if type(held_size) is not int or not 1 <= held_size <= 8:
        raise ValueError("This exact product demonstration supports 1 through 8 held losses.")
    mean = finite_expectation(loss_values, masses)
    means, joint_masses = [], []
    for indices in product(range(len(loss_values)), repeat=held_size):
        means.append(sum(loss_values[i] for i in indices) / held_size)
        probability = F(1)
        for i in indices:
            probability *= masses[i]
        joint_masses.append(probability)
    discrepancy = finite_expectation([(estimate - value)**2 for value in means], joint_masses)
    holdout_variance = finite_expectation([(mean - value)**2 for value in means], joint_masses)
    return {"means": means, "masses": joint_masses, "true_error": mean,
            "discrepancy": discrepancy, "holdout_variance": holdout_variance,
            "difference": discrepancy - holdout_variance, "target_mse": (estimate - mean)**2}


def main():
    result = holdout_identity(F(1, 4), [F(0), F(1)], [F(1, 2), F(1, 2)], 2)
    print("holdout means", [str(value) for value in result["means"]])
    print("joint masses", [str(value) for value in result["masses"]])
    for key in ["true_error", "discrepancy", "holdout_variance", "difference", "target_mse"]:
        print(key, str(result[key]))
    print("individual subtraction at held mean0", str(F(1, 4)**2 - result["holdout_variance"]))
    values = np.array([float(value) for value in result["means"]])
    weights = np.array([float(value) for value in result["masses"]])
    print("ordinary weighted discrepancy", float(np.dot(weights, (.25 - values)**2)))
    # Perfectly dependent held losses instead have mean 0/1, not 0/.5/1.
    dependent_variance = finite_expectation([F(1, 4), F(1, 4)], [F(1, 2), F(1, 2)])
    print("dependent held variance", str(dependent_variance), "independent variance", str(result["holdout_variance"]))


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
holdout means ['0', '1/2', '1/2', '1']
joint masses ['1/4', '1/4', '1/4', '1/4']
true_error 1/2
discrepancy 3/16
holdout_variance 1/8
difference 1/16
target_mse 1/16
individual subtraction at held mean0 -1/16
ordinary weighted discrepancy 0.1875
dependent held variance 1/4 independent variance 1/8

```


`holdout_mse_identity.py` checks finite probability masses and expectations directly and compares NumPy weighted sums. Its perfect-dependence example has holdout-mean variance 1/4, exposing why the independence-based subtraction cannot simply be reused. This is the local identity, **not** the paper's full nested uncertainty estimator or interval algorithm.

The paper also distinguishes conditional fitted-model error from recipe-average error. Its particular conditional-independence theorem uses iid Gaussian homoskedastic ordinary least squares, squared loss and the stated linear-invariance setting; it is not a theorem that every CV estimate is independent of every fitted model's error. Read those assumptions with the result, and consult the full method before implementing its inference. The cited July 2022 version develops these risk definitions and the nested-MSE method; the resources identify that version and the later-version access limit. [Bates, Hastie and Tibshirani](https://arxiv.org/pdf/2104.00673).

Dependence and finite selection noise explain why evaluating more configurations cannot remove uncertainty automatically. We next let a search use its previous observations, while keeping every proposal, belief and paid resource distinct from fresh assessment evidence.


<a id="8-deeper-branch-adaptive-search-and-spending-resources"></a>
<a id="adaptive-search"></a>
## 8. Can earlier trials guide the next one?

Grid and independent random proposals do not use previous scores to choose the next setting. Sequential model-based optimization does: collect setting/score observations, fit a model of useful regions, choose another setting, evaluate it under the declared selection protocol, and update the history. This adaptation takes place **inside selection**. Reusing its best selection score as independent assessment would repeat the same problem from §4.

### Expected improvement values a useful tail

Suppose lower loss is better and the best observed loss is c=0.20. 

<!-- Drawing D36: visual-specifications.md#d36. -->

At a proposed setting x, a supplied predictive distribution assigns probabilities to possible losses Y. Its improvement is \((c-Y)_+=\max(c-Y,0)\); expected improvement is

\[
\operatorname{EI}(x)=\mathbb E[(c-Y)_+\mid x,\text{history}].
\]

Read the loss ruler with the incumbent at 0.20. Candidate A puts all mass at 0.18, giving mean 0.18 and improvement 0.02. Candidate B puts half its mass at 0.05 and half at 0.45, giving mean 0.25 but EI=(0.15+0)/2=0.075. EI prefers B even though its predicted mean is worse. It values the chance of a much better outcome and ignores the magnitude of already-worse outcomes. Moving B's bad branch from 0.45 to 0.90 raises its mean to 0.475 without changing EI. That is a property of this utility, not proof that bad outcomes have no practical cost.

The local investigation edits the incumbent and actual loss/mass cells, shades only positive improvement lengths and multiplies them by their masses. If all supported losses are at or above c, EI is zero. Probabilities must be finite, nonnegative and sum to one. These distributions are supplied beliefs for exact arithmetic; no Gaussian-process fit or uncertainty calibration has been demonstrated. Other acquisition rules balance exploration, constraints and costs differently.

### Reverse the conditioning to model useful settings

<!-- Drawing D37: visual-specifications.md#d37. -->

A conventional surrogate might model loss conditional on setting, p(y|x). The Tree-structured Parzen Estimator paper instead models settings conditional on whether their loss lies below a threshold y*: l(x)=p(x|y<y*) and g(x)=p(x|y≥y*). Let γ be the probability of the better region. The marginal setting density is p(x)=γl(x)+(1−γ)g(x). Here the paper's improvement threshold is y*, rather than necessarily the best observed c used in the preceding example. Its factorization treats p(x|y) as the same l(x) throughout y<y*. Bayes' rule then gives

\[
\begin{aligned}
\operatorname{EI}_{y^*}(x)
&=\int_{-\infty}^{y^*}(y^*-y)p(y\mid x)\,dy\\
&=\frac{l(x)}{p(x)}\int_{-\infty}^{y^*}(y^*-y)p(y)\,dy.
\end{aligned}
\]

For a finite positive integral, that last factor does not depend on x. Comparing settings therefore compares

\[
\frac{l(x)}{\gamma l(x)+(1-\gamma)g(x)}
=\left[\gamma+(1-\gamma)\frac{g(x)}{l(x)}\right]^{-1},
\]

where the ratio form requires l(x)>0. This is why favouring settings relatively common among better trials can guide proposals. The density model and threshold assumptions do the work; it is not a universal identity for arbitrary fitted surrogates. [Original TPE paper, §4](https://papers.nips.cc/paper_files/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf).

In the static three-setting worked table, **supplied** l masses are (0.4,0.2,0.4), g masses (0.1,0.4,0.5), and γ=1/4. Mixture masses are (7/40,7/20,19/40); l/p values are (16/7,4/7,16/19), so A wins. Each density and the mixture sums to one. The acquisition values need not sum to one and can exceed one: they are relative proposal utilities, not probabilities. This table is separate from the history-fitting investigation that follows. Its masses must never be described as fitted to that investigation's default trials.

### Build a finite adaptive search with every policy visible

Our complete scratch reference uses support A,B,C and a deterministic constructed evaluator with losses 1/10,1/5,2/5. Repeating a setting adds a trial to this history, but cannot create new independent noise evidence from that deterministic evaluator. This reference exposes reverse conditioning; it is not the original continuous Parzen-tree estimator or modern Optuna's full sampler.

Every history row carries a unique immutable nonnegative integer trial ID, supported setting and finite nonnegative loss. Editing a loss keeps its trial ID. Before four trials, use the explicit startup sequence A,B,C,C and show uniform prior masses rather than pretending to have fitted a better/other partition. The ordinary reset state contains those four evaluated rows: 0:A/0.1, 1:B/0.2, 2:C/0.4, 3:C/0.4.

After startup, if all observed losses are equal, keep an uninformative uniform prior: l=g=p=(1/3,1/3,1/3), acquisition=(1,1,1), first-support proposal A. Do not assign arbitrary “better” labels to tied equal evidence. Otherwise sort by (loss,trial ID), set

\[
m=\max(1,\min(n-1,\lfloor\gamma n\rfloor)),\qquad \pi=m/n,
\]

and take the first m rows as better, the rest as other. We intentionally use a fixed count and do not expand tied boundaries. Requested γ and realized π are distinct on a finite history. With positive smoothing α, setting j receives

\[
l_j=\frac{c_{Lj}+\alpha}{m+3\alpha},\quad
g_j=\frac{c_{Gj}+\alpha}{n-m+3\alpha},\quad
p_j=\pi l_j+(1-\pi)g_j,\quad a_j=l_j/p_j.
\]

Smoothing makes every supported mass positive. At γ=1/2,α=1, the default better IDs are 0,1 and other IDs 2,3. Their counts are (1,1,0) and (0,0,2), producing l=(2/5,2/5,1/5), g=(1/5,1/5,3/5), p=(3/10,3/10,2/5), acquisition=(4/3,4/3,1/2). First-support tie chooses A. The already-visible proposal can be accepted with Step: append trial 4:A/0.1, then recompute the whole history model. No answer entry or reveal gate is involved.

At n=5, m=2 and π=2/5. Better IDs are now 0,4; counts (2,0,0) and (0,1,2). The new l=(3/5,1/5,1/5), g=(1/6,1/3,1/2), mixture=(17/50,7/25,19/50), acquisition=(30/17,5/7,10/19). A wins again. A deterministic greedy proposal rule has no exploration guarantee; this outcome is part of its limitations.

An informative edit changes original trial 0's A loss to 1/2. Better IDs become 1,2, with 3,0 in other. Then l=(1/5,2/5,2/5), g=(2/5,1/5,2/5), mixture=(3/10,3/10,2/5), acquisition=(2/3,4/3,1). Proposal B is accepted with the evaluator's fixed 1/5 loss. Changing original B loss from 1/5 to 1/4 instead leaves the default partition, fitted masses and proposal unchanged. It is a genuine null edit for this thresholded reference, even though the numeric history changed.

At the original history with γ=1/4, m=1 and π=1/4: l=(1/2,1/4,1/4), g=(1/6,1/3,1/2), mixture=(1/4,5/16,7/16), acquisition=(2,4/5,4/7). The investigation edits history cells, γ in [0.1,0.9] and α in [0.25,2], shows the membership/count/mass chain and resets the exact four-row history. Invalid settings, duplicate IDs, nonfinite or negative history loss, and parameters outside those domains refuse with no appended trial. The program has the same explicit policies.

<!-- Programme P13; source programmes/discrete_adaptive_search.py; role new executed. -->

Save as `discrete_adaptive_search.py`.

```python
"""Finite categorical SMBO reference with every policy stated explicitly."""
from fractions import Fraction as F
from collections import Counter
from math import floor, isfinite
import json

SUPPORT = ("A", "B", "C")
STARTUP = ("A", "B", "C", "C")
EVALUATOR = {"A": F(1, 10), "B": F(1, 5), "C": F(2, 5)}


def validate_history(history):
    ids = []
    for row in history:
        if set(row) != {"id", "setting", "loss"}:
            raise ValueError("Each trial needs id, setting and loss.")
        if type(row["id"]) is not int or row["id"] < 0 or row["setting"] not in SUPPORT:
            raise ValueError("Need a nonnegative integer trial ID and a supported setting.")
        if not isfinite(row["loss"]) or row["loss"] < 0:
            raise ValueError("Loss must be finite and nonnegative.")
        ids.append(row["id"])
    if len(set(ids)) != len(ids):
        raise ValueError("Trial IDs must be unique and immutable.")


def proposal(history, gamma=F(1, 2), alpha=F(1)):
    validate_history(history)
    gamma, alpha = F(str(gamma)), F(str(alpha))
    if not F(1, 10) <= gamma <= F(9, 10) or not F(1, 4) <= alpha <= 2:
        raise ValueError("Need gamma in [.1,.9] and positive alpha in [.25,2].")
    n = len(history)
    uniform = [F(1, 3)] * 3
    if n < 4 or len({row["loss"] for row in history}) == 1:
        startup = n < 4
        return {"state": "startup" if startup else "uninformative uniform prior",
                "better_ids": [], "other_ids": [], "gamma": gamma, "pi": None, "alpha": alpha,
                "l": uniform, "g": uniform, "p": uniform, "acquisition": [F(1)] * 3,
                "proposal": STARTUP[n] if startup else SUPPORT[0]}
    ordered = sorted(history, key=lambda row: (row["loss"], row["id"]))
    m = max(1, min(n - 1, floor(gamma * n)))
    better, other = ordered[:m], ordered[m:]
    left, right = Counter(row["setting"] for row in better), Counter(row["setting"] for row in other)
    l = [(left[setting] + alpha) / (m + 3 * alpha) for setting in SUPPORT]
    g = [(right[setting] + alpha) / (n - m + 3 * alpha) for setting in SUPPORT]
    pi = F(m, n)
    p = [pi * a + (1 - pi) * b for a, b in zip(l, g)]
    acquisition = [a / b for a, b in zip(l, p)]
    chosen = max(range(3), key=lambda i: acquisition[i])
    return {"state": "fitted categorical history", "better_ids": [row["id"] for row in better],
            "other_ids": [row["id"] for row in other], "gamma": gamma, "pi": pi, "alpha": alpha,
            "better_counts": [left[setting] for setting in SUPPORT],
            "other_counts": [right[setting] for setting in SUPPORT],
            "l": l, "g": g, "p": p, "acquisition": acquisition, "proposal": SUPPORT[chosen]}


def accept(history, gamma=F(1, 2), alpha=F(1)):
    current = proposal(history, gamma, alpha)
    trial = {"id": max((row["id"] for row in history), default=-1) + 1,
             "setting": current["proposal"], "loss": EVALUATOR[current["proposal"]]}
    return [dict(row) for row in history] + [trial]


def expected_improvement(incumbent, losses, masses):
    if not isfinite(incumbent) or len(losses) != len(masses) or not losses:
        raise ValueError("Need a finite incumbent and aligned nonempty mass table.")
    if any(not isfinite(value) for value in losses + masses) or any(mass < 0 for mass in masses) or sum(masses) != 1:
        raise ValueError("Need finite losses and nonnegative masses summing to one.")
    return sum(mass * max(incumbent - loss, 0) for loss, mass in zip(losses, masses))


def default_history():
    return [{"id": i, "setting": setting, "loss": EVALUATOR[setting]} for i, setting in enumerate(STARTUP)]


def show(name, result):
    print(name, json.dumps(result, default=str))


def main():
    history = default_history()
    show("default", proposal(history))
    updated = accept(history)
    show("accepted history", updated)
    show("updated", proposal(updated))
    changed = [dict(row) for row in history]
    changed[0]["loss"] = F(1, 2)
    show("changed A", proposal(changed))
    show("changed appended", accept(changed)[-1])
    null = [dict(row) for row in history]
    null[1]["loss"] = F(1, 4)
    show("null B", proposal(null))
    show("gamma quarter", proposal(history, F(1, 4)))
    startup = []
    for _ in range(4):
        show("startup", proposal(startup))
        startup = accept(startup)
    show("all equal", proposal([{**row, "loss": F(1, 5)} for row in history]))
    for name, losses, masses in [("A", [F(18, 100)], [F(1)]),
                                 ("B", [F(5, 100), F(45, 100)], [F(1, 2)] * 2),
                                 ("B worse tail", [F(5, 100), F(9, 10)], [F(1, 2)] * 2)]:
        print("EI", name, str(expected_improvement(F(1, 5), losses, masses)),
              "mean", str(sum(a * b for a, b in zip(losses, masses))))
    # Separate static D37 supplied distributions; these are not fitted above.
    l, g = [F(2, 5), F(1, 5), F(2, 5)], [F(1, 10), F(2, 5), F(1, 2)]
    p = [F(1, 4) * a + F(3, 4) * b for a, b in zip(l, g)]
    show("static supplied fixture", {"l": l, "g": g, "p": p, "acquisition": [a / b for a, b in zip(l, p)]})


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
default {"state": "fitted categorical history", "better_ids": [0, 1], "other_ids": [2, 3], "gamma": "1/2", "pi": "1/2", "alpha": "1", "better_counts": [1, 1, 0], "other_counts": [0, 0, 2], "l": ["2/5", "2/5", "1/5"], "g": ["1/5", "1/5", "3/5"], "p": ["3/10", "3/10", "2/5"], "acquisition": ["4/3", "4/3", "1/2"], "proposal": "A"}
accepted history [{"id": 0, "setting": "A", "loss": "1/10"}, {"id": 1, "setting": "B", "loss": "1/5"}, {"id": 2, "setting": "C", "loss": "2/5"}, {"id": 3, "setting": "C", "loss": "2/5"}, {"id": 4, "setting": "A", "loss": "1/10"}]
updated {"state": "fitted categorical history", "better_ids": [0, 4], "other_ids": [1, 2, 3], "gamma": "1/2", "pi": "2/5", "alpha": "1", "better_counts": [2, 0, 0], "other_counts": [0, 1, 2], "l": ["3/5", "1/5", "1/5"], "g": ["1/6", "1/3", "1/2"], "p": ["17/50", "7/25", "19/50"], "acquisition": ["30/17", "5/7", "10/19"], "proposal": "A"}
changed A {"state": "fitted categorical history", "better_ids": [1, 2], "other_ids": [3, 0], "gamma": "1/2", "pi": "1/2", "alpha": "1", "better_counts": [0, 1, 1], "other_counts": [1, 0, 1], "l": ["1/5", "2/5", "2/5"], "g": ["2/5", "1/5", "2/5"], "p": ["3/10", "3/10", "2/5"], "acquisition": ["2/3", "4/3", "1"], "proposal": "B"}
changed appended {"id": 4, "setting": "B", "loss": "1/5"}
null B {"state": "fitted categorical history", "better_ids": [0, 1], "other_ids": [2, 3], "gamma": "1/2", "pi": "1/2", "alpha": "1", "better_counts": [1, 1, 0], "other_counts": [0, 0, 2], "l": ["2/5", "2/5", "1/5"], "g": ["1/5", "1/5", "3/5"], "p": ["3/10", "3/10", "2/5"], "acquisition": ["4/3", "4/3", "1/2"], "proposal": "A"}
gamma quarter {"state": "fitted categorical history", "better_ids": [0], "other_ids": [1, 2, 3], "gamma": "1/4", "pi": "1/4", "alpha": "1", "better_counts": [1, 0, 0], "other_counts": [0, 1, 2], "l": ["1/2", "1/4", "1/4"], "g": ["1/6", "1/3", "1/2"], "p": ["1/4", "5/16", "7/16"], "acquisition": ["2", "4/5", "4/7"], "proposal": "A"}
startup {"state": "startup", "better_ids": [], "other_ids": [], "gamma": "1/2", "pi": null, "alpha": "1", "l": ["1/3", "1/3", "1/3"], "g": ["1/3", "1/3", "1/3"], "p": ["1/3", "1/3", "1/3"], "acquisition": ["1", "1", "1"], "proposal": "A"}
startup {"state": "startup", "better_ids": [], "other_ids": [], "gamma": "1/2", "pi": null, "alpha": "1", "l": ["1/3", "1/3", "1/3"], "g": ["1/3", "1/3", "1/3"], "p": ["1/3", "1/3", "1/3"], "acquisition": ["1", "1", "1"], "proposal": "B"}
startup {"state": "startup", "better_ids": [], "other_ids": [], "gamma": "1/2", "pi": null, "alpha": "1", "l": ["1/3", "1/3", "1/3"], "g": ["1/3", "1/3", "1/3"], "p": ["1/3", "1/3", "1/3"], "acquisition": ["1", "1", "1"], "proposal": "C"}
startup {"state": "startup", "better_ids": [], "other_ids": [], "gamma": "1/2", "pi": null, "alpha": "1", "l": ["1/3", "1/3", "1/3"], "g": ["1/3", "1/3", "1/3"], "p": ["1/3", "1/3", "1/3"], "acquisition": ["1", "1", "1"], "proposal": "C"}
all equal {"state": "uninformative uniform prior", "better_ids": [], "other_ids": [], "gamma": "1/2", "pi": null, "alpha": "1", "l": ["1/3", "1/3", "1/3"], "g": ["1/3", "1/3", "1/3"], "p": ["1/3", "1/3", "1/3"], "acquisition": ["1", "1", "1"], "proposal": "A"}
EI A 1/50 mean 9/50
EI B 3/40 mean 1/4
EI B worse tail 3/40 mean 19/40
static supplied fixture {"l": ["2/5", "1/5", "2/5"], "g": ["1/10", "2/5", "1/2"], "p": ["7/40", "7/20", "19/40"], "acquisition": ["16/7", "4/7", "16/19"]}

```


`proposal` validates history, handles startup/equality, sorts once, counts categories and evaluates all three support utilities. `accept` copies the current rows and appends the declared evaluator result at the next ID. The exact rational tables avoid hiding tie or rounding choices. Its cost is O(n log n+q) for n history rows and q enumerated settings, with O(n+q) state; a real continuous density model has different costs and approximation choices. `expected_improvement` separately computes the supplied finite-loss example; it is not a fitted model for this categorical evaluator.

### Read the ordinary adaptive route without inventing its history

The retained `cv_optuna.py` imports the displayed `load_data` and `make_model` functions from `cv_penguins.py`. It searches odd k from 1 through 21, distance power p=1 or 2, and uniform or distance voting, with StandardScaler fixed. It maximizes the same three-fold selection accuracy, using a seeded TPESampler with ten startup trials and twenty total trials. Its startup is the library's random proposal policy, separate from our finite A/B/C reference's prescribed sequence.

<!-- Drawing D38: visual-specifications.md#d38. -->

Read the two retained lines literally: that historical sequence selected k=1,p=1,uniform at 0.9884057971. The earlier complete six-card search evaluated k=3,p=2,uniform with StandardScaler at 0.9913043478 under the same full-development inner folds; it lies within this Optuna space. Twenty trials therefore did not guarantee finding the best known in-space setting. The complete twenty-trial history and INFO stderr were not retained in these displayed strings, so we cannot reconstruct which trials occurred or attribute a particular proposal to fitted densities. Our new A/B/C traces cannot fill that historical absence. This is one execution, not a sampler ranking study.

The exact original script runs a study at top level; importing it executes the old experiment. Do not import it merely to inspect helpers. Its dependency `cv_penguins.py` has a guarded main and supplies the reusable functions. The saved original environment used Optuna 5.0.0. A seed in sequential execution helps reproduce a protocol; parallel completion order and changing library versions can change adaptive histories. [TPESampler documentation](https://optuna.readthedocs.io/en/stable/reference/samplers/generated/optuna.samplers.TPESampler.html).

<!-- Programme P03; source programmes/cv_optuna.py; role retained. -->

Save as `cv_optuna.py`.

```python
import optuna
from sklearn.model_selection import StratifiedKFold, cross_val_score
from cv_penguins import load_data, make_model

X, y = load_data()
splitter = StratifiedKFold(n_splits=3, shuffle=True, random_state=73)
splits = list(splitter.split(X, y))

def objective(trial):
    model = make_model()
    model.set_params(
        classify__n_neighbors=trial.suggest_int("neighbors", 1, 21, step=2),
        classify__p=trial.suggest_int("distance_power", 1, 2),
        classify__weights=trial.suggest_categorical("weights", ["uniform", "distance"]),
    )
    scores = cross_val_score(
        model, X, y, cv=splits, scoring="accuracy", n_jobs=1,
        error_score="raise",
    )
    return float(scores.mean())

study = optuna.create_study(
    direction="maximize",
    sampler=optuna.samplers.TPESampler(seed=29, n_startup_trials=10),
)
study.optimize(objective, n_trials=20, n_jobs=1)
print("selection score", study.best_value)
print("selected settings", study.best_params)
```

Exact retained displayed stdout; historical execution, without retained terminal process newline.

```text
selection score 0.9884057971014494
selected settings {'neighbors': 1, 'distance_power': 1, 'weights': 'uniform'}
```


### Spend a little resource before paying for every full fit

Adaptive proposals decide **where** to try. Successive halving decides **how much** resource to spend on each candidate before elimination. Resource might mean training rows, epochs or trees, but its relation to loss must be understood. More resource does not ensure that candidates preserve their ranking.

<!-- Drawing D39: visual-specifications.md#d39. -->

Start nine named candidates at resource 10. Pay for all nine loss observations, retain the best three by the declared tie order, pay for those at 30, retain one, then pay for it at 90. The actual paid cells in the supplied trajectory table are 9/3/1. Fresh fitting costs 9×10+3×30+1×90=270 nominal resource units; fitting all nine at 90 would cost 810. Eliminated future cells remain **unobserved**, not loss zero.

The two-candidate slow-starter example makes the risk visible. At resource 10, A/B losses are 0.30/0.40, so a factor-two elimination keeps A. A's later losses are 0.25 and 0.24; B's supplied later losses would be 0.20 and 0.10. Both improve, but B's ranking reverses too late. Those B cells belong to a separately labeled hindsight diagnostic and were unavailable to the actual elimination decision. The local investigation edits candidate-by-resource loss cells and recomputes only decisions supported by paid observations; a separate allocation view changes schedule quantities after the mechanism is understood.

If a real training state can resume exactly, the same nine/three/one schedule might pay 90+3×(30−10)+1×(90−30)=210 incremental resource units. A checkbox or a curve cannot establish that saved state exists. Our source includes an actual extendable running-mean object with saved sum/count, consuming 1, then 2, then 6 new observations to reach resources 1,3,9. It agrees with the fresh means. This demonstrates a sufficient-state continuation operation, not a claim that the supplied loss trajectories came from resumed optimizer fits. Fresh fitting is the default ledger for those trajectories. Nominal resource counts are not elapsed-time measurements.

### Hyperband runs several allocation tradeoffs

A single halving tournament commits to one initial population and resource. Hyperband starts several brackets, trading breadth against initial depth. 

<!-- Drawing D40: visual-specifications.md#d40. -->

For maximum resource R and factor η>1, the original schedule uses

\[
s_{\max}=\lfloor\log_\eta R\rfloor,\quad B=(s_{\max}+1)R,
\quad n_s=\left\lceil\frac{B}{R}\frac{\eta^s}{s+1}\right\rceil,
\quad r_s=R\eta^{-s}.
\]

Within bracket s, round i uses nominal count \(n_i=\lfloor n_s\eta^{-i}\rfloor\) and resource \(r_i=r_s\eta^i\), applying the paper's survivor rounding. These integer rules matter; do not replace them with an arbitrary ceiling scheduler and call it the identical algorithm.

For R=9,η=3, smax=2 and B=27. Bracket s=2 starts nine at one and uses (9,1),(3,3),(1,9), fresh cost 27. Bracket s=1 starts five at three and uses (5,3),(1,9), fresh cost 24. Bracket s=0 starts three at nine, cost 27. Total 78 differs from the nominal three-by-27=81 because of rounding. Conditional genuine-continuation costs would be 21,21,27, total 69. At R=27,η=3, starts are (27,1),(12,3),(6,9),(4,27); the complete code prints each round and totals 423 fresh versus 357 conditional continuation. The bracket budget is approximate after rounding. [Hyperband Algorithm 1](https://jmlr.org/papers/volume18/16-558/16-558.pdf).

<!-- Programme P14; source programmes/resource_tournaments.py; role new executed. -->

Save as `resource_tournaments.py`.

```python
"""Paid supplied losses, deterministic elimination and original Hyperband rounds."""
from math import ceil, floor, isfinite
from fractions import Fraction as F
from dataclasses import dataclass


def tournament(losses, budgets, factor=3):
    if type(factor) is not int or factor <= 1 or not budgets or any(type(r) is not int or r <= 0 for r in budgets):
        raise ValueError("Need an integer factor > 1 and positive integer resource levels.")
    if any(a >= b for a, b in zip(budgets, budgets[1:])) or not losses:
        raise ValueError("Resource levels must increase and candidates cannot be empty.")
    order = list(losses)
    ordinal = {name: i for i, name in enumerate(order)}
    alive, ledger = order[:], []
    for round_id, resource in enumerate(budgets):
        paid = []
        for candidate in alive:
            if resource not in losses[candidate] or not isfinite(losses[candidate][resource]):
                raise ValueError("Every paid candidate/resource observation must exist and be finite.")
            paid.append((candidate, losses[candidate][resource]))
        ranked = sorted(alive, key=lambda name: (losses[name][resource], ordinal[name]))
        keep = 1 if round_id == len(budgets) - 1 else ceil(len(alive) / factor)
        survivors = ranked[:keep]
        ledger.append({"resource": resource, "paid": paid, "survivors": survivors,
                       "fresh_cost": len(alive) * resource,
                       "continuation_cost_if_real": len(alive) * (resource - (budgets[round_id - 1] if round_id else 0))})
        alive = survivors
    return ledger


def hyperband_brackets(maximum=9, factor=3):
    if type(maximum) is not int or maximum < 1 or type(factor) is not int or factor <= 1:
        raise ValueError("Need positive integer maximum resource and integer factor > 1.")
    smax = 0
    while factor ** (smax + 1) <= maximum:
        smax += 1
    allowance = (smax + 1) * maximum
    brackets = []
    for s in range(smax, -1, -1):
        n = ceil(F(allowance, maximum) * F(factor**s, s + 1))
        start_resource = F(maximum, factor**s)
        rounds = [(floor(F(n, factor**i)), start_resource * factor**i) for i in range(s + 1)]
        fresh = sum(count * resource for count, resource in rounds)
        continued = sum(count * (resource - (rounds[i - 1][1] if i else 0))
                        for i, (count, resource) in enumerate(rounds))
        brackets.append({"s": s, "n": n, "r": start_resource, "rounds": rounds,
                         "fresh": fresh, "continuation_if_real": continued})
    return smax, allowance, brackets


@dataclass
class RunningMean:
    """An actual extendable sufficient state over a fixed ordered numeric stream."""
    total: float = 0.
    count: int = 0

    def extend(self, values, budget):
        if type(budget) is not int or not self.count <= budget <= len(values):
            raise ValueError("Extension budget must preserve the consumed prefix.")
        new = values[self.count:budget]
        if not all(isfinite(value) for value in new):
            raise ValueError("Observed stream values must be finite.")
        self.total += sum(new)
        self.count = budget
        return len(new), self.total / self.count if self.count else None


def main():
    budgets = [10, 30, 90]
    trajectories = {"A": [.30, .25, .24], "B": [.40, .20, .10], "C": [.35, .22, .18],
                    "D": [.45, .30, .25], "E": [.50, .40, .30], "F": [.55, .45, .35],
                    "G": [.60, .50, .40], "H": [.65, .55, .45], "I": [.70, .60, .50]}
    losses = {name: dict(zip(budgets, values)) for name, values in trajectories.items()}
    ledger = tournament(losses, budgets)
    for row in ledger:
        print("paid round", row)
    print("fresh total", sum(row["fresh_cost"] for row in ledger), "continuation if real",
          sum(row["continuation_cost_if_real"] for row in ledger), "all full", len(losses) * budgets[-1])
    pair = tournament({name: losses[name] for name in ["A", "B"]}, budgets, factor=2)
    print("slow starter paid ledger", pair)
    print("separate supplied hindsight", {name: losses[name][90] for name in ["A", "B"]})
    for maximum in [9, 27]:
        smax, allowance, brackets = hyperband_brackets(maximum)
        print("Hyperband", maximum, "smax", smax, "B", allowance)
        for row in brackets:
            print("bracket", row)
        print("bracket totals", sum(row["fresh"] for row in brackets),
              sum(row["continuation_if_real"] for row in brackets))
    state = RunningMean()
    values = [1., 3., 2., 6., 4., 2., 5., 1., 3.]
    for budget in [1, 3, 9]:
        increment, mean = state.extend(values, budget)
        print("actual mean extension", budget, "new observations", increment, "total", state.total,
              "mean", mean, "fresh mean", sum(values[:budget]) / budget)


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
paid round {'resource': 10, 'paid': [('A', 0.3), ('B', 0.4), ('C', 0.35), ('D', 0.45), ('E', 0.5), ('F', 0.55), ('G', 0.6), ('H', 0.65), ('I', 0.7)], 'survivors': ['A', 'C', 'B'], 'fresh_cost': 90, 'continuation_cost_if_real': 90}
paid round {'resource': 30, 'paid': [('A', 0.25), ('C', 0.22), ('B', 0.2)], 'survivors': ['B'], 'fresh_cost': 90, 'continuation_cost_if_real': 60}
paid round {'resource': 90, 'paid': [('B', 0.1)], 'survivors': ['B'], 'fresh_cost': 90, 'continuation_cost_if_real': 60}
fresh total 270 continuation if real 210 all full 810
slow starter paid ledger [{'resource': 10, 'paid': [('A', 0.3), ('B', 0.4)], 'survivors': ['A'], 'fresh_cost': 20, 'continuation_cost_if_real': 20}, {'resource': 30, 'paid': [('A', 0.25)], 'survivors': ['A'], 'fresh_cost': 30, 'continuation_cost_if_real': 20}, {'resource': 90, 'paid': [('A', 0.24)], 'survivors': ['A'], 'fresh_cost': 90, 'continuation_cost_if_real': 60}]
separate supplied hindsight {'A': 0.24, 'B': 0.1}
Hyperband 9 smax 2 B 27
bracket {'s': 2, 'n': 9, 'r': Fraction(1, 1), 'rounds': [(9, Fraction(1, 1)), (3, Fraction(3, 1)), (1, Fraction(9, 1))], 'fresh': Fraction(27, 1), 'continuation_if_real': Fraction(21, 1)}
bracket {'s': 1, 'n': 5, 'r': Fraction(3, 1), 'rounds': [(5, Fraction(3, 1)), (1, Fraction(9, 1))], 'fresh': Fraction(24, 1), 'continuation_if_real': Fraction(21, 1)}
bracket {'s': 0, 'n': 3, 'r': Fraction(9, 1), 'rounds': [(3, Fraction(9, 1))], 'fresh': Fraction(27, 1), 'continuation_if_real': Fraction(27, 1)}
bracket totals 78 69
Hyperband 27 smax 3 B 108
bracket {'s': 3, 'n': 27, 'r': Fraction(1, 1), 'rounds': [(27, Fraction(1, 1)), (9, Fraction(3, 1)), (3, Fraction(9, 1)), (1, Fraction(27, 1))], 'fresh': Fraction(108, 1), 'continuation_if_real': Fraction(81, 1)}
bracket {'s': 2, 'n': 12, 'r': Fraction(3, 1), 'rounds': [(12, Fraction(3, 1)), (4, Fraction(9, 1)), (1, Fraction(27, 1))], 'fresh': Fraction(99, 1), 'continuation_if_real': Fraction(78, 1)}
bracket {'s': 1, 'n': 6, 'r': Fraction(9, 1), 'rounds': [(6, Fraction(9, 1)), (2, Fraction(27, 1))], 'fresh': Fraction(108, 1), 'continuation_if_real': Fraction(90, 1)}
bracket {'s': 0, 'n': 4, 'r': Fraction(27, 1), 'rounds': [(4, Fraction(27, 1))], 'fresh': Fraction(108, 1), 'continuation_if_real': Fraction(108, 1)}
bracket totals 423 357
actual mean extension 1 new observations 1 total 1.0 mean 1.0 fresh mean 1.0
actual mean extension 3 new observations 2 total 6.0 mean 2.0 fresh mean 2.0
actual mean extension 9 new observations 6 total 27.0 mean 3.0 fresh mean 3.0

```


`tournament` owns paid loss lookups, rank ties, survivor identities and both cost interpretations; `hyperband_brackets` owns the separate original bracket arithmetic. The running-mean state owns a real extension operation. Invalid factors, nonincreasing resources or missing required paid cells refuse. An initial candidate-to-ordinal dictionary gives constant-time tie-key lookup; sorting each round costs O(n_i log n_i), after the initial O(n) identity map. Real evaluator training usually dominates. The finite schedule does not implement asynchronous halving, an infinite-horizon optimizer or a general-purpose Hyperband library.

### Audit an ordinary halving execution

`ordinary_halving_audit.py` supplies a newly constructed 90-row, four-feature binary classification task with balanced classes and fixed generation/fold/estimator seeds. It searches nine random-forest depth/leaf recipes with `n_estimators` as resource. That resource is absent from the searched grid. The experimental import enables `HalvingGridSearchCV`; the script prints all result rows rather than assuming the schedule matched a hand picture.

<!-- Programme P15; source programmes/ordinary_halving_audit.py; role new executed. -->

Save as `ordinary_halving_audit.py`.

```python
"""One new constructed ordinary halving run; resource count is not wall time."""
from sklearn.experimental import enable_halving_search_cv  # noqa: F401
from sklearn.model_selection import HalvingGridSearchCV, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification


def main():
    x, y = make_classification(n_samples=90, n_features=4, n_informative=3,
                               n_redundant=0, n_clusters_per_class=1, flip_y=0,
                               class_sep=1, random_state=19)
    folds = list(StratifiedKFold(3, shuffle=True, random_state=7).split(x, y))
    estimator = RandomForestClassifier(random_state=11, n_jobs=1)
    # Tree count is the resource, so it is absent from the candidate grid.
    grid = {"max_depth": [1, 2, 3], "min_samples_leaf": [1, 2, 4]}
    search = HalvingGridSearchCV(estimator, grid, resource="n_estimators",
                                 min_resources=1, max_resources=9, factor=3,
                                 cv=folds, scoring="accuracy", random_state=13,
                                 n_jobs=1, error_score="raise", refit=True,
                                 return_train_score=False)
    search.fit(x, y)
    print("constructed data shape", x.shape, "class counts", [(int(label), int(sum(y == label))) for label in [0, 1]])
    print("fold sizes", [(len(train), len(held)) for train, held in folds])
    print("n_candidates", search.n_candidates_, "n_resources", search.n_resources_)
    for i, params in enumerate(search.cv_results_["params"]):
        print("result", i, "iteration", int(search.cv_results_["iter"][i]),
              "resource", int(search.cv_results_["n_resources"][i]), "params", params,
              "fold scores", [float(search.cv_results_[f"split{j}_test_score"][i]) for j in range(3)],
              "mean selection accuracy", float(search.cv_results_["mean_test_score"][i]))
    print("selected", search.best_index_, search.best_params_, "selection accuracy", search.best_score_)
    print("maximum reached", max(search.n_resources_) == search.max_resources,
          "final trees", search.best_estimator_.n_estimators)
    print("candidate fold fits", sum(search.n_candidates_) * len(folds), "final refits", 1,
          "fresh tree units", sum(n * r * len(folds) for n, r in zip(search.n_candidates_, search.n_resources_)) + search.best_estimator_.n_estimators)
    print("warm_start", search.best_estimator_.warm_start, "timing measured", False)


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
constructed data shape (90, 4) class counts [(0, 45), (1, 45)]
fold sizes [(60, 30), (60, 30), (60, 30)]
n_candidates [9, 3, 1] n_resources [1, 3, 9]
result 0 iteration 0 resource 1 params {'max_depth': 1, 'min_samples_leaf': 1, 'n_estimators': 1} fold scores [0.5, 0.43333333333333335, 0.5333333333333333] mean selection accuracy 0.48888888888888893
result 1 iteration 0 resource 1 params {'max_depth': 1, 'min_samples_leaf': 2, 'n_estimators': 1} fold scores [0.5, 0.43333333333333335, 0.5333333333333333] mean selection accuracy 0.48888888888888893
result 2 iteration 0 resource 1 params {'max_depth': 1, 'min_samples_leaf': 4, 'n_estimators': 1} fold scores [0.5, 0.43333333333333335, 0.5333333333333333] mean selection accuracy 0.48888888888888893
result 3 iteration 0 resource 1 params {'max_depth': 2, 'min_samples_leaf': 1, 'n_estimators': 1} fold scores [0.8666666666666667, 0.9, 1.0] mean selection accuracy 0.9222222222222222
result 4 iteration 0 resource 1 params {'max_depth': 2, 'min_samples_leaf': 2, 'n_estimators': 1} fold scores [0.8666666666666667, 0.9, 1.0] mean selection accuracy 0.9222222222222222
result 5 iteration 0 resource 1 params {'max_depth': 2, 'min_samples_leaf': 4, 'n_estimators': 1} fold scores [0.8666666666666667, 0.9, 1.0] mean selection accuracy 0.9222222222222222
result 6 iteration 0 resource 1 params {'max_depth': 3, 'min_samples_leaf': 1, 'n_estimators': 1} fold scores [0.9666666666666667, 0.8333333333333334, 1.0] mean selection accuracy 0.9333333333333332
result 7 iteration 0 resource 1 params {'max_depth': 3, 'min_samples_leaf': 2, 'n_estimators': 1} fold scores [0.9666666666666667, 0.8666666666666667, 0.9333333333333333] mean selection accuracy 0.9222222222222222
result 8 iteration 0 resource 1 params {'max_depth': 3, 'min_samples_leaf': 4, 'n_estimators': 1} fold scores [0.9666666666666667, 0.9, 1.0] mean selection accuracy 0.9555555555555556
result 9 iteration 1 resource 3 params {'max_depth': 3, 'min_samples_leaf': 2, 'n_estimators': 3} fold scores [0.9666666666666667, 0.9333333333333333, 0.9333333333333333] mean selection accuracy 0.9444444444444443
result 10 iteration 1 resource 3 params {'max_depth': 3, 'min_samples_leaf': 1, 'n_estimators': 3} fold scores [0.9333333333333333, 0.9333333333333333, 0.9333333333333333] mean selection accuracy 0.9333333333333332
result 11 iteration 1 resource 3 params {'max_depth': 3, 'min_samples_leaf': 4, 'n_estimators': 3} fold scores [0.9666666666666667, 0.8666666666666667, 1.0] mean selection accuracy 0.9444444444444445
result 12 iteration 2 resource 9 params {'max_depth': 3, 'min_samples_leaf': 4, 'n_estimators': 9} fold scores [0.9666666666666667, 0.9, 0.9] mean selection accuracy 0.9222222222222222
selected 12 {'max_depth': 3, 'min_samples_leaf': 4, 'n_estimators': 9} selection accuracy 0.9222222222222222
maximum reached True final trees 9
candidate fold fits 39 final refits 1 fresh tree units 90
warm_start False timing measured False

```


The observed schedule has candidate counts 9,3,1 at tree resources 1,3,9. Its selected depth-3/min-leaf-4 recipe reaches nine trees; its selection accuracy is 0.9222222222. That is selection evidence on this constructed task, without an outer generalization assessment. The 13 candidate-resource rows each have three folds: 39 fits plus final refit. Fresh tree accounting is 3×(9×1+3×3+1×9)+9=90 tree units, with `warm_start=False`. The code does not claim previous fitted forests were resumed. Other legal settings can stop below a requested maximum resource; inspect actual attributes rather than assuming the maximum was reached. [HalvingGridSearchCV documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.HalvingGridSearchCV.html).

Search distribution, adaptive history, resource schedule, stopping and refit are all parts of a procedure. The final section before practice turns that procedure into a reproducible record with an explicit computation budget and an honest scope.


<a id="9-run-a-useful-comparison-within-an-honest-budget"></a>
<a id="execution-and-reporting"></a>
## 9. How do we execute and report the whole procedure?

A reproducible result contains more than a winner and a seed. Another reader must be able to recover the information boundary, the candidate and decision rules, the fitted-object lifetimes, and the exact meaning of each reported number. Begin with a job ledger whose leaves are actual fits.

<!-- Drawing D41: visual-specifications.md#d41. -->

For O outer folds, M candidates and I inner folds, ordinary nested tuning uses O×(MI+1) complete pipeline fits: MI comparisons and one selected refit per outer fold. Separate final selection/refit adds MI+1. If a majority baseline is fitted in each outer operation, add O baseline fits. Our original O=3,M=6,I=3 gives 57+19+3=79. A changed M=8,I=4,O=5 gives 165+33+5=203, before any early-stopping subset, failed retries or additional search. This expression assumes every candidate is evaluated in every inner fold; halving needs its actual rung ledger instead.

The local fit-count investigation changes M,I,O and displays every term immediately. Training sizes remain separate labels; a final all-data refit is not the same amount of work as one smaller inner fit. Empty candidate sets and invalid fold counts refuse. Failed candidate fits consume work even when their scores are unusable, as the new P09 diagnostics showed. The count does not measure elapsed time.

### Parallelism spends memory as well as cores

Independent candidate/fold jobs can run concurrently, but concurrency does not alter which observations they may use. For a concrete **declared planning model**, suppose six independent ready jobs each require two memory units, one coordinator requires one, and capacity is seven. At most floor((7−1)/2)=3 jobs fit concurrently even if six workers are requested. With one worker there are six waves, with two there are three, with three there are two. These are waves of equal-duration hypothetical jobs, not measured wall-clock speedups; unequal job durations, copying, scoring, communication and memory overhead alter an actual schedule. The adjacent schedule investigation changes worker count while this job/memory model stays fixed and labels blocked jobs explicitly.

Choose one level of parallelism intentionally. Outer workers that each launch many inner workers can oversubscribe cores and multiply data copies. `n_jobs`, `pre_dispatch` and numerical-library thread limits control different sources of concurrency. Our new examples use serial estimator jobs and bounded thread settings so their pedagogical execution is easy to attribute. These settings are not an optimum for every machine. For a large job, measure actual memory and time under a representative workload before setting capacity.

Caching can reuse a deterministic transformation only when its inputs, training rows, parameters and fit-relevant metadata are identical and legally available. Two candidate recipes sharing preprocessing on the **same inner training partition** may benefit. A scaler fitted on all rows cannot be called a cache for a smaller fold; its state used forbidden observations. Caching also has serialization/storage costs. Preserve the statistical dependency before optimizing the job graph.

### Read each result column by its role

An ordinary search's `split0_test_accuracy` is accuracy on the first **inner selection-held** split. The API's word `test` does not turn it into a protected outer assessment. `mean_test_accuracy` averages those split scores under the tool's convention; it is not automatically pooled row accuracy or a deployment guarantee. `rank_test_accuracy` ranks that declared metric. A separate balanced-accuracy column does not become the objective unless the rule says so. Timing columns, if actually captured, measure particular fit/score operations; our retained fit-count ledgers do not invent them.

P09 demonstrates callable refit and a failed candidate. Read the selected row's named accuracy cells because callable refit has no `best_score_`. Its cost numbers are a supplied eligibility model, not measured times. P15 prints candidate counts and resources at every iteration because ordinary halving's actual schedule can differ from a hand schedule. Never merge the constructed tasks' observed scores with the original Penguins record or use one experiment's evidence to certify another's implementation.

### A compact report that can be reconstructed

For the retained Penguins experiment, an acceptable report reads:

> We assess species classification for the declared shuffled, stratified row-sampling task on 344 offline Palmer Penguins records. Inputs are bill length/depth, flipper length, body mass and sex. Missing measurements remain and are imputed inside each training-only pipeline. Outer StratifiedKFold uses three folds, shuffle and seed 41; inner selection uses three folds, shuffle and seed 73. The six candidates combine k=3/5/11 with standard/robust numeric scaling, using Euclidean uniform KNN and first-enumerated score ties. Three outer assessment results are 114/115,114/115,112/114, pooled 340/344=0.9883720930 and equal-fold mean 0.9883549453. Training-majority baselines get 51/115,51/115,50/114. Separate final all-development selection ties 3/Standard and 3/Robust at 0.9913043478, selects 3/Standard by enumeration and refits on all 344. The final selection score is not fresh assessment. The recorded workload is 76 pipeline fits plus three baselines; time was not measured. Exact source, data, source-ID arrays, displayed streams and historical environment are supplied. This protocol does not establish new-island or future-season performance.

For a fresh study, also state acquisition and exclusion rules, the independent sampling unit, metric units/aggregation, all adaptive choices, seed/RNG roles, feature schema, target definitions, library versions, failure handling, stopping/resource rules, baseline definitions and protected-data policy. Retain enough split IDs and aligned predictions to reconstruct the reported count. A seed cannot reconstruct a changed dataset order or a different library algorithm by itself.

The [setup and file index](setup-and-files.md) distinguishes exact historical strings from new raw process streams, current CRLF data from historical normalized data, and teaching sources from optional answer assets. This distinction is useful to a learner trying to run a file: an unretained trial history cannot be downloaded, and an answer source should not be mistaken for a required helper.

An experiment is ready for interpretation when those ingredients identify one procedure and the evidence matches its scope. Practice now changes the inputs and asks you to rebuild the reasoning, rather than recalling which method produced the largest familiar number.


<a id="10-practice-identify-the-decision-before-computing-the-score"></a>
<a id="practice"></a>
## 10. Practice: identify the decision before computing the score

For each task, name the permitted information and the quantity being computed before doing arithmetic. A successful answer should explain why a tempting alternative computes a different quantity. Hints and solutions are optional reading; the preceding investigations show their current outputs immediately and require no submitted prediction.

<!-- Exact retained task T01; complete original JSX in retained-practice-source.jsx. -->

### 1. Unequal folds

Three folds assess 4, 3 and 3 rows and get 3, 1 and 2 correct. Find the unweighted mean fold accuracy and the pooled accuracy. Which gives each row equal weight?

<details><summary>Get a hint</summary>

Average the three fractions for one answer; add correct counts before dividing for the other.

</details>

<details><summary>Show the explained solution</summary>

The fold mean is $(3/4+1/3+2/3)/3=7/12\approx.5833$. Pooled accuracy is 6/10 = .6 and gives each row equal weight. Equal weighting of folds is a different declared summary.

</details>


<!-- Exact retained task T02; complete original JSX in retained-practice-source.jsx. -->

### 2. A remainder is still a learner's data

A splitter uses fold_size = n // k and slices exactly that many rows for each of k validation folds. What happens at n = 11, k = 3? How does the provided splitter repair it?

<details><summary>Show the explained solution</summary>

Only nine rows receive a validation turn; two are omitted. Depending on how training indices are constructed, those omitted rows may be permanently in training or dropped altogether. `np.array_split` creates folds 4, 4 and 3 so every row belongs to one validation fold and the remaining folds form its training set.

</details>


<!-- Exact retained task T03; complete original JSX in retained-practice-source.jsx. -->

### 3. New patient or known patient?

A wearable model will predict tomorrow's measurements for people who already provided a week of history. A second product must work on entirely new wearers. Describe an assessment boundary for each. What extra question arises if the second product also launches in a future season?

<details><summary>Show the explained solution</summary>

The first task can use each person’s available earlier history but must respect prediction time and target availability. The second needs held-out people. A future season introduces a time-distribution boundary as well, so a custom group-and-time assessment may be needed. A random visit split does not by itself establish either claimed setting.

</details>


<!-- Exact retained task T04; complete original JSX in retained-practice-source.jsx. -->

### 4. An impossible out-of-fold array

A forward plan trains on rows 0–3 and assesses 4–5, then trains 0–5 and assesses 6–7. Why can it be used for fold scoring but not passed directly to cross_val_predict on all eight rows? What should a manual prediction table contain at rows 0–3?

<details><summary>Show the explained solution</summary>

Rows 0–3 never appear in a held-out set, so the required exactly-once partition is missing. A manual table should retain their predictions as absent, not fit on them and label in-sample outputs out-of-fold. Score the valid held-out rows, or train a stacking stage only where legitimate predictions exist.

</details>


<!-- Exact retained task T05; complete original JSX in retained-practice-source.jsx. -->

### 5. A new candidate pattern

Validation labels are [0,1,0,1]. Initially the candidates predict all zeros or all ones. Add a candidate predicting [0,1,0,1]. Under the independent fair-label model, what changes in best validation accuracy and expected future accuracy? What if you add only another all-zero candidate?

<details><summary>Show the explained solution</summary>

The best validation score rises from .5 to 1. Every fixed prediction remains independent of future fair labels, so expected future accuracy remains .5. A duplicate all-zero candidate changes neither the original best validation score nor future accuracy. Candidate diversity, and how selection uses the labels, are what matter. Both cases are saved setups in the selection investigation above.

</details>


<!-- Exact retained task T06; complete original JSX in retained-practice-source.jsx. -->

### 6. Which rows selected the epoch?

An outer-fold model chooses its number of epochs using outer assessment loss, then reports accuracy on that same outer fold. Identify the violated boundary and give two repairs.

<details><summary>Show the explained solution</summary>

The assessed rows selected a training setting. Move stopping into the outer training data, either using a stopping subset inside each inner training partition or treating inner-validation-based stopping as part of the complete rule assessed by protected outer rows. Another valid design uses development data for all such choices and a genuinely separate final test set. Renaming the used assessment set does not restore independence.

</details>


<!-- Exact retained task T07; complete original JSX in retained-practice-source.jsx. -->

### 7. Probability mass is not score distance — deeper

A satisfactory parameter region has probability .02 under your sampler. How many independent draws give at least a 95% chance of hitting it? Would this guarantee a score within 2% of the global optimum?

<details><summary>Get a hint</summary>

Solve $(1-.02)^T\le.05$ and round upward.

</details>

<details><summary>Show the explained solution</summary>

$T\ge\log(.05)/\log(.98)\approx148.28$, so 149 draws suffice under the assumed independent sampling model. The 2% is sampling mass, not score proximity. The satisfactory region itself must be defined and its assumed mass justified for a practical guarantee.

</details>


<!-- Exact retained task T08; complete original JSX in retained-practice-source.jsx. -->

### 8. An unchanged acquisition value — deeper

The incumbent loss is .30. Candidate C has equal predicted probabilities of losses .10 and .50. Find EI. If only the worse outcome changes from .50 to .90, does EI change? Does expected loss change?

<details><summary>Show the explained solution</summary>

EI is $.5(.30-.10)=.10$. The worse outcome contributes zero improvement in both cases, so EI remains .10. Expected loss changes from .30 to .50. This does not prove the surrogate is calibrated; it distinguishes the summaries of its stated distribution.

</details>


<!-- Exact retained task T09; complete original JSX in retained-practice-source.jsx. -->

### 9. Account for the whole schedule — deeper

A halving plan starts 27 candidates with budgets 5, 15, 45 and 135 and retains one third after each stage. Find the nominal from-scratch resource cost, and compare it with giving every candidate 135. If each stage instead resumes genuine saved state, what is the incremental resource cost?

<details><summary>Show the explained solution</summary>

Candidate counts 27, 9, 3 and 1 each consume 135 nominal units per stage, totalling 540, versus 3,645 for all candidates at 135. Resuming costs $27\cdot5+9\cdot10+3\cdot30+1\cdot90=405$. Multiply appropriate evaluations by fold count and account separately for scoring and refits. Real time need not be linear in this resource.

</details>


<!-- Exact retained task T10; complete original JSX in retained-practice-source.jsx. -->

### 10. A fixed rule tests an overlap story — deeper

A classifier always predicts class 0 and ignores training. Labels on n observations are independent fair bits. What is the variance of its leave-one-out accuracy? Why does this contradict equating loss correlation with training overlap?

<details><summary>Show the explained solution</summary>

The correctness indicators are independent Bernoulli(.5), so their average has variance $(.5)(.5)/n=1/(4n)$. The leave-one-out training sets overlap heavily, but those sets do not influence this rule’s predictions. Thus overlap alone does not determine loss correlation or imply variance stays near 1/4.

</details>



The first ten tasks check the original fold, boundary, selection, acquisition and resource arguments. The following tasks change a fitted state, sampling law or decision rule. Tasks 11–18 reinforce the working procedure; tasks 19–22 deepen uncertainty and resource allocation; task 23 asks for a complete transfer report. Each includes a concrete success criterion.

### 11. Keep the fitted state on its own side (N1)

Training numeric values are [0,2,missing,4]; held values are [10,missing]. Use training-median filling followed by population standardization. Find the fitted median, mean, variance and held coordinates. Then change only held 10 to 100. What may change, and what must remain fixed?

<details><summary>Get a hint</summary>

List the source IDs permitted to fit first. Fill the training gap before computing the mean and variance. A transform consumes saved state; it does not fit again.

</details>

<details><summary>Show the explained solution</summary>

Observed training values [0,2,4] have median 2. Filled training [0,2,2,4] has mean 2 and population variance (4+0+0+4)/4=2, so the divisor is √2. Held coordinates are [(10−2)/√2,(2−2)/√2]=[4√2,0]. Changing 10 to 100 changes the first coordinate to 98/√2=49√2; median 2, mean 2, variance 2 and the second coordinate stay fixed. Fitting on all six values would let held observations change every training coordinate and answer a different, leaky question. Success: provide the four state/coordinate values and identify the operation allowed to respond to the edit.

</details>

### 12. Pool counts before a nonlinear metric (N2)

Two equally sized held folds have confusion counts (TP,FN,FP,TN)=(1,1,0,0) and (0,0,1,1). With F1=2TP/(2TP+FP+FN), defining a zero denominator as zero, compare mean fold F1 and pooled F1. Does equal fold size make them equal?

<details><summary>Get a hint</summary>

Compute the ratio in each fold, then separately add the four count columns before taking the ratio.

</details>

<details><summary>Show the explained solution</summary>

The folds give 2/(2+0+1)=2/3 and 0/(0+1+0)=0, hence mean 1/3. Pooled counts (1,1,1,1) give 2/(2+1+1)=1/2. Neither calculation has a zero denominator here, but stating the convention matters for other inputs. Accuracy's equal-size averaging identity relies on additive correct counts with the same row denominator; this nonlinear ratio has another denominator. Success: state both fractions and explain why equal row counts do not make nonlinear aggregation commute.

</details>

### 13. Which unit gets one vote in the report? (N3)

Person A has four records, all predicted correctly. Person B has one record, predicted incorrectly. Compute row-weighted accuracy and equal-person accuracy. Which should you choose for a product intended to serve a uniformly selected new person?

<details><summary>Get a hint</summary>

Compute each person's record accuracy, then average people. Choose the reporting unit from the future request rather than from the larger score.

</details>

<details><summary>Show the explained solution</summary>

Row accuracy is 4/5=0.8. Person accuracies are 1 and 0, whose equal-person average is 1/2. For a uniformly selected person and this stated within-person summary, the second matches the requested weighting. An operational request that instead samples individual events could justify the first. New-person **splitting** is also needed; changing aggregation cannot repair a boundary that trained on the assessed person's history. Success: give both values and connect split unit and reporting weight to two distinct decisions.

</details>

### 14. Draw both event time and availability time (N4)

Source event times are [0,1,2,5,8,9]. At decision time 5, permit only strictly earlier events whose labels have arrived. Which source IDs train when each label arrives at event time+3? What changes at delay 4? Why is “drop one preceding row” insufficient here?

<details><summary>Get a hint</summary>

For each candidate row test both event<5 and event+delay≤5.

</details>

<details><summary>Show the explained solution</summary>

Delay 3 gives label times [3,4,5,8,11,12], so IDs 0,1,2 train. Delay 4 gives [4,5,6,9,12,13], so only 0,1 train. ID 2 is earlier but its label is unavailable under the changed delay. Irregular spacing makes a row count different from a calendar embargo; dropping an arbitrary preceding position neither defines the horizon nor checks arrival. If a new-person constraint also applies, intersect this mask with permitted subjects and refuse an empty training set. Success: show the two inequalities and exact ID sets.

</details>

### 15. Map local positions back to source identities (N5)

Outer training source IDs are [1,3,5,7,9,11,13,15]. An inner held splitter returns local positions [0,2,4,6]. Name the actual held source IDs and describe how to subset targets and groups. What if an inner position is 8?

<details><summary>Get a hint</summary>

The splitter indexes the eight-row outer subset, not the original sixteen-row table.

</details>

<details><summary>Show the explained solution</summary>

Indexing the outer list gives [1,5,9,13]. Features, targets and group metadata must all use these same original IDs, or first be identically subset to the outer list and then use the same local positions. Treating [0,2,4,6] as original IDs chooses other rows and can cross the outer boundary. Position 8 is outside local positions 0…7 and must refuse before fit. Success: provide the changed array, consistent metadata mapping and the bounds diagnosis.

</details>

### 16. Change the sampling law (N6)

Six unique recipe cards contain two acceptable cards. Find the probability of at least one acceptable recipe in three draws, first uniformly without replacement, then independently with replacement. Explain whether a particular missed draw contradicts either probability.

<details><summary>Get a hint</summary>

Without replacement count the all-unacceptable triples. With replacement multiply the three miss probabilities.

</details>

<details><summary>Show the explained solution</summary>

Without replacement gives 1−binomial(4,3)/binomial(6,3)=1−4/20=4/5. With replacement gives 1−(4/6)³=19/27. The draw lists are realizations; both laws assign positive probability to a miss. Using the independent formula for the without-replacement tool changes the experiment. Success: supply both exact fractions and distinguish probability from the observed sampled cards.

</details>

### 17. A branch prior is not a uniform union (N7)

Choose one of two conditional branches with equal probability. The first has two unique settings; the second has eight. Then choose uniformly inside the chosen branch. What is the mass of one setting in each branch? Compare uniform choice from all ten settings.

<details><summary>Get a hint</summary>

Multiply a branch probability by its conditional within-branch probability.

</details>

<details><summary>Show the explained solution</summary>

Masses are (1/2)(1/2)=1/4 and (1/2)(1/8)=1/16. Uniform union sampling would give every setting 1/10, hence branch masses 1/5 and 4/5. Neither distribution is intrinsically correct; they express different intended opportunities. Counting ten configurations and declaring equal mass ignores the sampling operation. Success: give all four masses and state what the branch-first sampler favours.

</details>

### 18. Select a row with failure and feasibility (N8)

Use the complete §6 table: A accuracy [0.80,0.90,0.70], cost [9,11,10]; B accuracy [0.85,0.80,0.90], cost [2,3,4]; C accuracy [0.95,0.94,failed], cost [1,1,1]. Require every fold to succeed and mean cost≤cap, then maximize mean accuracy with first-input ties. Find the decision at caps 5,2,10. At cap 10 change A's scores to [0.90,0.95,0.85]. What changes? How would you report a callable-refit search's selected score?

<details><summary>Get a hint</summary>

Filter complete feasible rows before ranking. A failed cell is neither a passing zero nor permission to omit a difficult fold.

</details>

<details><summary>Show the explained solution</summary>

A's mean accuracy/cost is 0.80/10; B's is 0.85/3. C is incomplete. Cap 5 chooses B, input index 1. Cap 2 refuses because no complete row is feasible. Cap 10 still chooses B. After the edit, A's mean is 0.90 at cost 10, so index 0 wins. For callable refit, read the selected index's explicitly named metric cells; `best_score_` is absent. Changing the objective after protected evaluation would create another adaptive rule. Success: give each decision and reason, preserve C's failure, and name the metric used in the report.

</details>

### 19. Keep the common shock in the mean (N9)

Let five centered scores be Z_k=aS+bE_k with independent fair signs, a²=1/5 and b²=4/5. Find each score's variance, each off-diagonal covariance and the mean's variance. Compare the falsely independent calculation.

<details><summary>Get a hint</summary>

The shared S survives averaging. Alternatively sum all 25 covariance cells.

</details>

<details><summary>Show the explained solution</summary>

Individual variance is 1; every off-diagonal covariance is 1/5. Mean variance is 1/5+(4/5)/5=9/25=0.36. Independence would give 1/5=0.20. The covariance sum confirms (5×1+20×1/5)/25=9/25. Training overlap alone does not identify a²; it was specified in this generative example. Success: connect the shared term to both the equation and the matrix calculation.

</details>

### 20. Subtract the noise of the comparison (N10)

Condition on training data with A=1/4 and true fitted-model error μ=1/2. Two independent fair binary holdout losses produce a mean H. Find E[(A−H)²], Var(H) and their difference. For the single outcome H=0, can the same subtraction be negative?

<details><summary>Get a hint</summary>

Enumerate H=0,1/2,1 with masses 1/4,1/2,1/4. The conditional cross-term vanishes because E[H−μ]=0.

</details>

<details><summary>Show the explained solution</summary>

Discrepancy is (1/4)(1/16)+(1/2)(1/16)+(1/4)(9/16)=3/16. Variance is (1/4)(1/4)+(1/2)0+(1/4)(1/4)=1/8. Difference 1/16 equals (A−μ)². At H=0, the observed subtraction is 1/16−1/8=−1/16. Nonnegative expected MSE does not force every finite subtraction to be nonnegative. Dependence would change Var(H), and a training-adaptive holdout would invalidate the conditional argument. Success: show the complete mass calculation and explain why this is not a universal confidence-interval algorithm.

</details>

### 21. Repeat the full bootstrap functional (N11)

For §7's x=[0,1,2,3], y=[0,0,1,1] and draw [0,0,2,2], diagnose an inner split that alternates occurrence positions and reports accuracy 1. What does the prescribed source-grouped selector score instead? Compute T for changed draw [0,1,2,3] at query 1.5. Explain what omitting all single-source draws does to the four-draw sampling law, and why bootstrapping a fixed previously selected candidate is another statistic.

<details><summary>Get a hint</summary>

Copies of one source must travel together. T is the final query's class-1 vote fraction after complete selection/refit, not inner or resubstitution accuracy.

</details>

<details><summary>Show the explained solution</summary>

Occurrence alternation puts one source-0 and one source-2 copy on both sides, letting validation reuse exact duplicated sources; accuracy 1 describes that wrong boundary. Source-grouped held folds train only on the opposite source/class, so both eligible candidates have pooled accuracy 0. First candidate k=1 wins, then all-resample refit yields T=1. On [0,1,2,3], k=1 gets 1/2 and 2/2 correct, pooled 3/4; k=2 gets 1/2 and 1/2, pooled 1/2. Refit k=1 with mean 1.5 and variance 1.25. Query 1.5 ties source 1/class0 and source 2/class1; source-ID tie gives T=0.

Of 256 equally likely ordered draws, the four constant-source draws cannot form two source-held folds. Undefined mass is 1/64. Omitting and renormalizing them describes a conditional law on 252 defined draws, which must be named; silently redrawing changes the recipe. Resample independent units appropriate to the scientific request, preserving all copies within each internal unit boundary. A group-unit bootstrap must sample complete groups. Freezing the previously selected candidate fails to repeat selection; it describes resampled refits of that fixed configuration rather than variation in the choice. Success: distinguish the three accuracies/statistics, give changed T and its tie path, and retain undefined probability explicitly.

</details>

### 22. Build every Hyperband bracket (N12)

Use original Hyperband integer rules at R=9,η=3. Derive smax and B, all bracket starts and evaluated rounds, fresh work, and conditional continuation work. Explain why a single nine-to-three-to-one tournament is not the whole algorithm.

<details><summary>Get a hint</summary>

Use ceilings for initial n and floors for round counts. Each bracket draws its own candidate pool. Continuation pays only increments if real saved state supports them.

</details>

<details><summary>Show the explained solution</summary>

smax=floor(log₃9)=2 and B=27. Bracket s=2 starts (9,1), then (3,3),(1,9), fresh 27 and conditional continuation 9+6+6=21. Bracket s=1 starts (5,3), then (1,9), fresh 15+9=24 and conditional continuation 15+6=21. Bracket s=0 evaluates (3,9), cost 27 under either interpretation. Totals are 78 and 69, with rounding preventing exactly equal bracket costs. One halving run lacks the other breadth/depth choices. A promised resume without retained sufficient state cannot claim 69. Success: list all paid rounds and both ledgers with their assumptions.

</details>

### 23. Transfer the report to a new deployment request (N13)

You have the familiar retained Penguins record. The product request changes to “classify birds on a new island next season.” Write a reproducible report of what the current record establishes and propose what additional data/protocol would be needed. Include source/metric units, baseline, ties, final refit and protected information. Do not invent a new score.

<details><summary>Get a hint</summary>

Retain 340/344 as the result of its actual row protocol. Ask whether island, season, availability and independent units in the supplied data can support the new request before selecting a splitter.

</details>

<details><summary>Show one acceptable reasoned answer</summary>

The retained 344-row experiment uses four measurements and sex, training-only imputation/scaling/encoding, three shuffled stratified outer folds (seed41), three inner folds (seed73), six k/scaler recipes and first-enumerated ties. It reports 340/344 pooled row accuracy and fold mean 0.9883549453, versus 152/344 for fitted majority baselines. Outer winners differ and include ties; final all-development reselection ties 3/Standard and 3/Robust at 0.9913043478, chooses the former and refits. That final number is selection evidence. Source, arrays, data roles and historical versions identify the result; no time or interval is inferred.

New-island next-season performance remains unestablished. We need representative island/season observations and a scientifically appropriate independent unit, with features available at prediction time and training labels available before fitting; protected outcomes can be collected later for assessment. A custom intersection can hold out islands and advance time if the resulting train/assessment sets, class coverage and number of independent units are feasible. The current island/year columns do not themselves guarantee that design or population coverage. If feasibility fails, collect suitable data rather than present random-row CV as certification. Fix all preparation, selection, stopping, metric/aggregation and failure rules in development, then assess on protected evidence matching the request. Success: preserve the old result's scope and provide an actionable data/boundary proposal without a fabricated deployment score. Other answers are acceptable if they justify the unit and information law equally clearly.

</details>

`practice_answers.py` is an optional answer asset, separate from the fifteen teaching programs. It calls the already displayed guarded helpers to reproduce the changed numerical tasks, uses exact fractions where appropriate and prints a short example report for the open task. It does not rerun the historical experiments or turn a capstone report into a measured generalization claim. Its input bounds and model assumptions are those of the referenced helpers.

<!-- Programme A01; source programmes/practice_answers.py; role new executed. -->

Save as `practice_answers.py`.

```python
"""Optional worked numerical answers to the thirteen added transfer tasks.

Imports only displayed, guarded new helpers. Does not run the old experiments.
"""
from fractions import Fraction as F
from math import comb
import json
import numpy as np
from fold_fitted_pipeline import fit_prepare, transform
from split_information_contracts import source_positions
from search_results_and_refit import constructed_table, select_table
from bootstrap_the_whole_statistic import whole_statistic, wrong_occurrence_split_accuracy
from resource_tournaments import hyperband_brackets


def f1(tp, fn, fp, tn):
    denominator = 2 * tp + fp + fn
    return F(2 * tp, denominator) if denominator else F(0)


def answers():
    state = fit_prepare([[0], [2], [None], [4]])
    first = transform(state, [[10], [None]])[:, 0]
    changed = transform(state, [[100], [None]])[:, 0]
    result = {"N1": {"median": state.medians, "mean": state.means, "variance": state.variances,
                     "held": first.tolist(), "changed_held": changed.tolist(),
                     "state_unchanged_by_transform": state == fit_prepare([[0], [2], [None], [4]])}}
    confusion = [(1, 1, 0, 0), (0, 0, 1, 1)]
    result["N2"] = {"fold_F1": [str(f1(*row)) for row in confusion],
                    "mean": str(sum(f1(*row) for row in confusion) / 2),
                    "pooled": str(f1(*(sum(row[i] for row in confusion) for i in range(4))))}
    result["N3"] = {"row_accuracy": str(F(4, 5)), "person_accuracy": str((F(4, 4) + F(0, 1)) / 2)}
    events = [0, 1, 2, 5, 8, 9]
    result["N4"] = {str(delay): [i for i, event in enumerate(events) if event < 5 and event + delay <= 5]
                    for delay in [3, 4]}
    result["N5"] = {"source_IDs": source_positions([1, 3, 5, 7, 9, 11, 13, 15], [0, 2, 4, 6])}
    result["N6"] = {"without_replacement": str(1 - F(comb(4, 3), comb(6, 3))),
                    "independent_replacement": str(1 - F(4, 6)**3)}
    result["N7"] = {"small_branch_per_setting": str(F(1, 2) / 2), "large_branch_per_setting": str(F(1, 2) / 8)}
    table = constructed_table()
    choices = {}
    for cap in [5, 2, 10]:
        try:
            choices[str(cap)] = select_table(table, cap)
        except ValueError as error:
            choices[str(cap)] = {"refusal": str(error)}
    table[0]["accuracy"] = [.90, .95, .85]
    choices["changed_A_cap10"] = select_table(table, 10)
    result["N8"] = choices
    result["N9"] = {"mean_variance": str(F(1, 5) + F(4, 5) / 5), "independent": str(F(1, 5))}
    masses, held_means = [F(1, 4), F(1, 2), F(1, 4)], [F(0), F(1, 2), F(1)]
    discrepancy = sum(p * (F(1, 4) - h)**2 for p, h in zip(masses, held_means))
    holdout_variance = sum(p * (h - F(1, 2))**2 for p, h in zip(masses, held_means))
    result["N10"] = {"discrepancy": str(discrepancy), "held_variance": str(holdout_variance),
                     "MSE": str(discrepancy - holdout_variance), "single_outcome_subtraction": str(F(1, 16) - F(1, 8))}
    initial, changed_boot = whole_statistic([0, 0, 2, 2]), whole_statistic([0, 1, 2, 3])
    result["N11"] = {"default_grouped_accuracy": initial["candidates"][0]["pooled"],
                     "wrong_occurrence_accuracy": wrong_occurrence_split_accuracy([0, 0, 2, 2]),
                     "default_T": initial["T"], "changed_T": changed_boot["T"],
                     "changed_k1_correct": [row["correct"] for row in changed_boot["candidates"][0]["folds"]],
                     "undefined_mass": str(F(4, 4**4)), "conditional_defined_denominator": 252}
    smax, allowance, brackets = hyperband_brackets(9, 3)
    result["N12"] = {"smax": smax, "B": allowance, "brackets": brackets,
                     "fresh_total": str(sum(row["fresh"] for row in brackets)),
                     "continuation_total_if_real": str(sum(row["continuation_if_real"] for row in brackets))}
    result["N13"] = {"preserved_row_protocol": "340/344 pooled; separate final selection/refit; new-island/next-season unestablished",
                     "required_new_evidence": "Feasible representative island/time units, label availability and a predeclared protected assessment"}
    # Independent hand values guard the answers; no unchanged historical fit runs.
    assert np.allclose(first, [4 * np.sqrt(2), 0]) and np.allclose(changed, [49 * np.sqrt(2), 0])
    assert result["N2"]["mean"] == "1/3" and result["N2"]["pooled"] == "1/2"
    assert result["N5"]["source_IDs"] == [1, 5, 9, 13]
    assert result["N6"] == {"without_replacement": "4/5", "independent_replacement": "19/27"}
    assert discrepancy == F(3, 16) and holdout_variance == F(1, 8)
    assert initial["T"] == 1 and changed_boot["T"] == 0
    assert result["N12"]["fresh_total"] == "78" and result["N12"]["continuation_total_if_real"] == "69"
    return result


def main():
    for task, answer in answers().items():
        print(task, json.dumps(answer, default=str))


if __name__ == "__main__":
    main()

```

Complete actual stdout from this new constructed programme's recorded execution.

```text
N1 {"median": [2.0], "mean": [2.0], "variance": [2.0], "held": [5.65685424949238, 0.0], "changed_held": [69.29646455628165, 0.0], "state_unchanged_by_transform": true}
N2 {"fold_F1": ["2/3", "0"], "mean": "1/3", "pooled": "1/2"}
N3 {"row_accuracy": "4/5", "person_accuracy": "1/2"}
N4 {"3": [0, 1, 2], "4": [0, 1]}
N5 {"source_IDs": [1, 5, 9, 13]}
N6 {"without_replacement": "4/5", "independent_replacement": "19/27"}
N7 {"small_branch_per_setting": "1/4", "large_branch_per_setting": "1/16"}
N8 {"5": [1, [{"index": 0, "candidate": "A", "mean_accuracy": 0.8000000000000002, "mean_cost": 10.0, "eligible": false}, {"index": 1, "candidate": "B", "mean_accuracy": 0.85, "mean_cost": 3.0, "eligible": true}, {"index": 2, "candidate": "C", "mean_accuracy": null, "mean_cost": null, "eligible": false}]], "2": {"refusal": "No candidate has all finite fold scores and acceptable mean cost."}, "10": [1, [{"index": 0, "candidate": "A", "mean_accuracy": 0.8000000000000002, "mean_cost": 10.0, "eligible": true}, {"index": 1, "candidate": "B", "mean_accuracy": 0.85, "mean_cost": 3.0, "eligible": true}, {"index": 2, "candidate": "C", "mean_accuracy": null, "mean_cost": null, "eligible": false}]], "changed_A_cap10": [0, [{"index": 0, "candidate": "A", "mean_accuracy": 0.9, "mean_cost": 10.0, "eligible": true}, {"index": 1, "candidate": "B", "mean_accuracy": 0.85, "mean_cost": 3.0, "eligible": true}, {"index": 2, "candidate": "C", "mean_accuracy": null, "mean_cost": null, "eligible": false}]]}
N9 {"mean_variance": "9/25", "independent": "1/5"}
N10 {"discrepancy": "3/16", "held_variance": "1/8", "MSE": "1/16", "single_outcome_subtraction": "-1/16"}
N11 {"default_grouped_accuracy": 0.0, "wrong_occurrence_accuracy": 1.0, "default_T": 1.0, "changed_T": 0.0, "changed_k1_correct": [1, 2], "undefined_mass": "1/64", "conditional_defined_denominator": 252}
N12 {"smax": 2, "B": 27, "brackets": [{"s": 2, "n": 9, "r": "1", "rounds": [[9, "1"], [3, "3"], [1, "9"]], "fresh": "27", "continuation_if_real": "21"}, {"s": 1, "n": 5, "r": "3", "rounds": [[5, "3"], [1, "9"]], "fresh": "24", "continuation_if_real": "21"}, {"s": 0, "n": 3, "r": "9", "rounds": [[3, "9"]], "fresh": "27", "continuation_if_real": "27"}], "fresh_total": "78", "continuation_total_if_real": "69"}
N13 {"preserved_row_protocol": "340/344 pooled; separate final selection/refit; new-island/next-season unestablished", "required_new_evidence": "Feasible representative island/time units, label availability and a predeclared protected assessment"}

```



<a id="11-readiness-and-what-follows"></a>
## 11. Readiness and what follows

You are ready to carry this procedure forward when you can take an unfamiliar request and name the prediction time, independent unit, permitted training information, selection rule, protected assessment and final refit before choosing a splitter. Test that readiness by tracing one actual held row through the fitted preparation and by explaining which part changes when a training label, protected label or search rule changes. A large familiar score is less useful than a report whose denominator and scope another reader can reconstruct.

For the working route, complete tasks 1–6 and 11–18, then write task 23's report. For the deeper route, derive one covariance sum and one bootstrap query, distinguish nested tuning from uncertainty estimation, and account for every paid Hyperband round in tasks 7–10 and 19–22. Success means reasoned transfer, not memorizing the recorded Penguins winner. Optional hints and solved examples are there to support a second attempt with changed inputs.

The next [Evaluation Metrics lesson](/learn/path/full-curriculum/evaluation-metrics-precision-recall-f1-auc-roc-ap-r-mae?module=classical-ml) asks what consequences a score summarizes and how thresholds, classes and ranking change its meaning. Bring the protected information boundary with you: selecting a threshold or metric from assessment outcomes is still adaptation. [Regularization](/learn/path/full-curriculum/regularization-l1-l2-elastic-net-dropout?module=classical-ml) connects model complexity and analytic/coding criteria such as AIC, BIC and MDL. Those criteria use different assumptions and targets from held-out resampling; they are not interchangeable score names. That lesson also distinguishes a normalized statistical penalty from an estimator’s native parameter: a change in fold training size can change their conversion, so the complete recipe must state its convention. [AutoML & NAS](/learn/path/full-curriculum/automl-neural-architecture-search-nas?module=classical-ml) extends recipe spaces and resource allocation to larger automated procedures. ASHA and BOHB are further scheduler/search directions, not algorithms implemented by this lesson's finite reference.

### Further learning

Choose another explanation for a particular hurdle; none is required to fill a missing step here.

- [ISLP authors: Cross-Validation and the Bootstrap, Python lab](https://islp.readthedocs.io/en/latest/labs/Ch05-resample-lab.html). A worked notebook for the fit/score/resample loop. After §2, trace its training/validation inputs; after §7, compare its bootstrap statistic with ours. Basic regression/Python helps. The notebook's data and printed results are its examples, separate from our offline experiment.
- [ISL authors: Statistical Learning lectures](https://www.youtube.com/playlist?list=PLoROMvodv4rOzrYsAxzQyHb8n_RWNuS1e). Companion video explanations of resampling and model assessment. Use alongside §§2/7 when hearing the argument helps. The official course page identifies the collection; no individual-video timestamp or viewing-based endorsement is implied.
- [ISLP authors: Python lab videos](https://www.youtube.com/playlist?list=PLoROMvodv4rNHU1-iPeDRH-J0cL-CrIda). A video companion to the written labs. Open the written chapter-level notebook above for a direct resampling activity; the playlist is broader and access can vary. Individual video contents were not independently reviewed for this lesson.
- [Scikit-learn: Nested versus non-nested cross-validation](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html). A complete ordinary-code example after §4. Locate the search inside the outer fit and explain which score selected a recipe. Its repeated Iris observations are separate from our exact finite proof and retained Penguins record; its splitter is an example rather than a deployment-independent prescription.
- [Scikit-learn: Successive Halving Iterations](https://scikit-learn.org/stable/auto_examples/model_selection/plot_successive_halving_iterations.html). After §8, connect surviving candidates to resource rungs and inspect the actual result attributes. This is an optional worked activity using an experimental API, not a local execution or speed ranking.

### Technical references

These support particular definitions, algorithms or API contracts. The source-reading record distinguishes complete inspected material from mapped chapters or restricted access.

- [Scikit-learn cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html) and [search guide](https://scikit-learn.org/stable/modules/grid_search.html): fit/score boundaries, splitter families, composite estimators, candidate spaces and result interpretation. [cross_val_predict](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_predict.html) specifies exactly-once prediction coverage. [Metadata routing](https://scikit-learn.org/stable/metadata_routing.html) is an optional version-sensitive route; the local programs primarily propagate explicit indices.
- [GridSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html), [ParameterSampler](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.ParameterSampler.html), [HalvingGridSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.HalvingGridSearchCV.html) and [Optuna TPESampler](https://optuna.readthedocs.io/en/stable/reference/samplers/generated/optuna.samplers.TPESampler.html): the callable-refit/failure, replacement, experimental-resource and startup behaviors used in the complete code routes. Installed versions and historical stream roles are in the setup index.
- [Cawley and Talbot, 2010](https://jmlr.org/papers/volume11/cawley10a/cawley10a.pdf): overfitting a finite model-selection criterion and assessing the complete adaptive procedure. Our four-bit proof gives the local exact arithmetic; their paper supplies broader statistical context.
- [Bengio and Grandvalet, 2004](https://jmlr.org/papers/volume5/grandvalet04a/grandvalet04a.pdf): the restricted theorem setting behind the absence of a universally unbiased K-fold variance estimator. This is compatible with inference under additional assumptions.
- [Bates, Hastie and Tibshirani](https://arxiv.org/pdf/2104.00673): fitted-model versus recipe error and the holdout-MSE/nested uncertainty development. The inspected 43-page July 2022 version covers the stated risk and identity sections; a newer HTML version was inaccessible. The local program implements the finite identity, not their full interval algorithm.
- [Bergstra and Bengio, 2012](https://jmlr.org/papers/volume13/bergstra12a/bergstra12a.pdf): random search and effective-coordinate coverage at a trial budget. [Bergstra and colleagues, 2011](https://papers.nips.cc/paper_files/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf): TPE reverse conditioning/EI. [Li and colleagues, Hyperband](https://jmlr.org/papers/volume18/16-558/16-558.pdf): the bracket allocation rules. Their algorithms, our discrete reference and current ordinary APIs have separately stated scopes.
- [ISLP authors' resources](https://www.statlearning.com/resources-python) and [The Elements of Statistical Learning authors' page](https://hastie.su.domains/ElemStatLearn/main.html): canonical treatment and chapter/reference navigation. The complete ISLP resampling lab was inspected; full textbook PDF access was unavailable for the fresh research pass, so no complete newly read ESL chapter is claimed.
- [Palmer Penguins creators](https://allisonhorst.github.io/palmerpenguins/): data context, original collection/citation and CC0 licensing. The supplied offline CSV and original provenance are retained; its source-role note explains current CRLF bytes versus the historical LF byte statement.

The useful habit is to keep the observation, choice and claim connected. A legal split makes that connection possible; the full report makes it inspectable.
