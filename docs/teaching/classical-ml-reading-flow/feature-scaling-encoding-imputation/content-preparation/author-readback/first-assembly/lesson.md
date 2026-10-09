# Feature Scaling, Encoding & Imputation

A model reads coordinates. A field notebook records measurements, categories and gaps. Turning one into the other is part of the modeling decision: a ruler changes which penguin looks nearest, a category representation changes which differences count, and a fill supplies a number we did not observe.

We will follow one practical question: can a penguin's measurements help distinguish its species? The real observations anchor the question; small, explicitly constructed tables make each mechanism possible to calculate. We will build preparation functions, recognize their stored state in ordinary library objects, and inspect one preserved real experiment. No method is a universal winner.

Start with sections 1–6, then core practice in section 10 and readiness in section 11. Sections 7–9 are visible deeper branches: nonlinear coordinates and bases; high-cardinality categories; conditional completion and uncertainty. They use the same step-by-step approach and can be read in a second sitting. You need rows and columns, Python arrays, averages and the idea of predicting a label. We introduce new notation where it enters. Complete files, exact outputs and setup are supplied; code is part of the explanation, available without a disclosure. Hints and solutions alone use disclosures.

<a id="1-three-different-questions-hiding-inside-preprocessing"></a>
## 1. Three different questions hiding inside “preprocessing”

The first held-out case in the retained experiment is zero-based source row 309. “309” means its position in this file, not a biological identifier and not a feature used by our model. Look across its measurement cells, then across to the separate answer column.

<!-- Drawing D01: visual-specifications.md#d01; actual objects and quantitative companion specified in full. -->

| Source position | Bill length | Bill depth | Flipper length | Body mass | Recorded sex | Target species |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 309 | 51.0 mm | 18.8 mm | 203.0 mm | 4100 g | male | Chinstrap |

An observation is one row. A feature is a selected input available when a prediction must be made. The target is the answer used for training or later assessment, species here. Availability matters as much as numerical format: a field recorded after species identification might reveal the answer rather than help predict it. Our experiment excludes source position, island, year and species from its input.

Write the feature table as X with n rows and d columns. Thus X has shape n×d; a row xᵢ holds one case's inputs, and column j follows one feature across cases. The target vector y has n entries and stays separate. Before encoding, X can contain different kinds of values. A numerical estimator ultimately needs the representation its interface promises; being stored in a table does not make every column a quantitative measurement.

Now make an independent copy of row 309 and erase only its mass. Follow the same row positions into the prepared coordinates.

<!-- Drawing D02: visual-specifications.md#d02; actual objects and quantitative companion specified in full. -->

The altered copy is `[51,18.8,203,NA,male]`. Sex is still observed. For numeric cells define Mᵢⱼ=1 when the **input is missing**, and 0 when observed. This convention is the opposite of an observation indicator R used in many statistical texts: R=1−M. We will keep the original M after filling. A filled mass coordinate is an estimate carrying a missing marker, not an observed 4000 g. Unknown sex, when a present string was absent from the fitted vocabulary, is a separate input-policy case; it is not another biological state we found in the file.

Scaling asks which numeric differences should have comparable influence. Encoding asks which relationships a category should express. Imputation asks which usable input to supply for an absent measurement. Converting grams to kilograms, making an indicator for `male`, and replacing a missing mass are three different operations. Combining them does not remove their separate assumptions.

The preceding [NMF lesson](/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml) uses rows as observations and requires nonnegative X for its additive reconstruction. Centering can create negative coordinates, so a useful preparation for a distance model can violate that domain. Begin with the downstream operation's meaning and input contract, rather than choosing a familiar preprocessing recipe.

<a id="2-scaling-changes-the-meaning-of-nearby"></a>
## 2. Scaling changes the meaning of “nearby”

### Make the ruler explicit

Switch now to three **constructed** two-feature cases: Q=(40,4000), A=(41,4100), B=(43,4001), in millimeters and grams. These are arithmetic fixtures, not additional penguin observations. The KNN prerequisite's [actual distance section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice) derives Euclidean, Manhattan and maximum-coordinate distances; its complete `units-cosine` example shows why units and directions matter. Here we change the coordinate map before using that distance.

Look first at the differences from Q, which are much easier to compare than absolute masses.

<!-- Drawing D03: visual-specifications.md#d03; actual objects and quantitative companion specified in full. -->

A differs by (1,100); B by (3,1). Raw squared Euclidean distance gives 1²+100²=10001 for A and 3²+1²=10 for B. The rule chooses B. The arithmetic silently gave a 100 g difference much more numerical influence than a few millimeters.

Decide instead that 1 mm and 100 g should each count as one comparison unit. Draw each divided difference as a triangle leg and its squared contribution beside it.

<!-- Drawing D04: visual-specifications.md#d04; actual objects and quantitative companion specified in full. -->

With divisors a=1, b=100, A has squared distance 1²+1²=2, while B has 3²+.01²=9.0001. A is now nearest. Nothing about the physical measurements changed. Dividing feature j by sⱼ gives

\[
d_s^2(x,z)=\sum_j((x_j-z_j)/s_j)^2
           =\sum_j (x_j-z_j)^2/s_j^2,\qquad s_j>0.
\]

The squared-distance weight is 1/sⱼ². A shared center cancels: `(x−c)−(z−c)=x−z`. Doubling **both** divisors divides both sums by four, giving .5 and 2.250025; ranking is unchanged. Changing just one divisor changes relative influence. L1 and maximum-coordinate distance use their own contribution rules; dividing coordinates still changes their geometry, but the L2 circles here are not pictures of L1 diamonds.

<!-- Investigation L1: visual-specifications.md#l1; immediate current result and direct-entity controls specified in full. -->

Begin with A nearer at 2 versus 9.0001. Change the mass divisor toward 1 and watch the mass leg and squared contribution grow until B is nearer. The immediately visible result explains which contribution changed. Common rescaling is a useful null for the ranking. Choose a divisor because of feature meaning or development evidence, rather than because standardization is fashionable.

<!-- Investigation L2: visual-specifications.md#l2; immediate current result and direct-entity controls specified in full. -->

Keep divisors 1 and 100, then change A's mass to 4400. Its difference becomes (1,400), giving 1+16=17; B stays at 9.0001 and wins. Coincide A with Q and its distance becomes zero. Editing Q must update both candidates. Geometry and arithmetic remain the same state; an axis viewport cannot clamp a computed length or circle radius. The predecessor finite two-dimensional radius formula did not establish a reachable clipping defect: its bound is √2/1.35×104≈108.95 pixels, below the 124-pixel cap. The successor specification nevertheless guarantees complete uncapped-radius geometry over its declared domain.

### Fit a ruler on training observations

If domain knowledge does not supply divisors, summarize typical training variation. For a numerical column, fit mean μ=(Σxᵢ)/n and population standard deviation s=√[Σ(xᵢ−μ)²/n], then transform a later x into z=(x−μ)/s. Dividing by n matches the transformation convention in StandardScaler; this is not an unbiased sample-variance calculation. A nonconstant training column gets mean zero and variance one. Its ordering and distribution shape are otherwise unchanged: a skewed distribution remains skewed, and no regression-error assumption has been proved.

See which observations determine three different rulers on the constructed training column `[1,2,3,4,100]`.

<!-- Drawing D05: visual-specifications.md#d05; actual objects and quantitative companion specified in full. -->

The mean is 22, the population scale is about 39.012818, the minimum/range are 1/99, and the median/IQR are 3/2 under linear percentiles (Q25=2, Q75=4). Standard scaling uses `(x−22)/39.012818`; min–max uses `(x−1)/99`; robust uses `(x−3)/2`. Max-absolute scaling uses x/100 and preserves measured zeros.

| Value | Standard | Min–max | Robust | Max-absolute |
| --- | ---: | ---: | ---: | ---: |
| 1 | −.5383 | 0 | −1 | .01 |
| 2 | −.5127 | .0101 | −.5 | .02 |
| 3 | −.4870 | .0202 | 0 | .03 |
| 4 | −.4614 | .0303 | .5 | .04 |
| 100 | 1.9993 | 1 | 48.5 | 1 |
| Later 150 | 3.2810 | 1.5051 | 73.5 | 1.5 |

The full extent keeps 100 and later 150 visible; the magnified view makes the separation among 1–4 perceptible. Robust scaling has not deleted or clipped the outlier. It uses central spread, making 100 a large coordinate. Min–max places **training** endpoints at 0 and 1. Later values can exceed them. Clipping would be another operation that discards how far beyond the fitted range a value lies.

<!-- Investigation L3: visual-specifications.md#l3; immediate current result and direct-entity controls specified in full. -->

Change the last training value from 100 to 1000. Mean, standard deviation and range change. The central quartiles here remain 2 and 4, so robust scaling's saved center/scale remain 3/2. Change only the query and none of these fitted summaries should move. “Robust” refers to this rule's resistance to particular changes in the fit, not proof that outliers never matter downstream.

What if training variation is zero? Trace the replacement divisor separately from the later coordinate.

<!-- Drawing D06: visual-specifications.md#d06; actual objects and quantitative companion specified in full. -->

For `[7,7,7]`, center=7 and measured spread=0. Our explicit policy stores divisor 1 with a zero-spread flag. Training values and later 7 become zero; later 9 becomes 2. “Constant during fit” does not mean “force every future input to zero.” An all-missing training column is different: there is no center or spread supported by observations. Refuse it or choose a declared keep/drop policy; do not infer a median of zero.

### Preserve direction only when size is dispensable

Column scaling learns one ruler per feature. Row normalization uses each case's own size. Look at two vectors on one ray and the single point they become on the unit circle.

<!-- Drawing D07: visual-specifications.md#d07; actual objects and quantitative companion specified in full. -->

The lengths of [3,4] and [6,8] are 5 and 10. Both become [.6,.8] after L2 normalization. Direction survives; amplitude disappears. This can suit document composition or a spectral shape comparison. It can harm a task in which total count, energy or body size is informative. For nonzero vectors, expanding their normalized squared Euclidean difference gives `2−2 cosine_similarity`; that is why the prerequisite compares direction this way. The zero vector has no direction; our policy leaves it zero and does not call that a meaningful angle. L1 divides by the sum of absolute coordinates; max normalization divides by the largest absolute coordinate. These are row operations, not column standardization.

Storage and penalties introduce further reasons to inspect the map. Watch actual zeros change when a sparse matrix is centered, then compare two coefficient vectors making the same prediction.

<!-- Drawing D08: visual-specifications.md#d08; actual objects and quantitative companion specified in full. -->

The matrix `[[0,0,3],[1,0,0],[0,2,0]]` has three nonzero cells. Subtracting column means [1/3,2/3,1] makes all nine cells nonzero. A sparse container cannot make those new values free. Scale-only StandardScaler(with_mean=False) and MaxAbsScaler can preserve zero support; they serve a different centering contract.

For x=[1,100], w=[1,.01], the prediction x·w=2. Divide the second coordinate by 100 and multiply its coefficient by 100: x′=[1,1], w′=[1,1] still predict 2. But squared coefficient penalties are 1.0001 and 2. Equal predictions do not give equal regularized objectives. Feature units therefore determine which coefficient changes a fixed penalty discourages. We derive this two-coordinate example here; the later regularization lesson owns systematic selection and optimization.

Ideal threshold trees depend on order: a strictly increasing map with a corresponding threshold preserves a split's membership. This explains their lesser sensitivity to unit scaling. Finite precision, histogram boundaries, clipping and merged values qualify implementation behavior. Polynomial construction or row normalization changes more than one column's strictly increasing coordinate map, so this observation does not establish invariance to arbitrary preparation.

The complete program below owns fitted summaries, schema checks, transformation and inverses, plus stateless row normalization. Read `Ruler` as saved state. Frozen arrays prevent accidental edits; transformation validates both feature names and width. NaNs are skipped during fit and preserved at transform so a separate imputation policy can handle them. Infinity is refused. Our exact-zero spread policy is intentionally simpler than sklearn's numerical near-constant heuristics.

**fitted_rulers.py — actual new checked process.**

```python
"""Four fitted column rulers and three stateless row normalizations.

NaN is skipped during fit and preserved during transform; infinity is refused.
The exact-zero spread rule is deliberately simpler than sklearn near-constant
detection. Named columns must have the same order during later transformation.
"""
from dataclasses import dataclass
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.preprocessing import (StandardScaler, MinMaxScaler, RobustScaler,
                                   MaxAbsScaler, Normalizer)


def matrix(X, width=None):
    X = np.asarray(X, dtype=float)
    if X.ndim != 2 or 0 in X.shape or np.isinf(X).any():
        raise ValueError('nonempty rows × features; finite numbers or NaN')
    if width is not None and X.shape[1] != width:
        raise ValueError('changed feature count')
    return X


def frozen(a):
    a = np.asarray(a).copy()
    a.flags.writeable = False
    return a


@dataclass(frozen=True)
class Ruler:
    kind: str
    names: tuple
    center: np.ndarray
    scale: np.ndarray
    zero_spread: np.ndarray


def fit_ruler(X, names, kind='standard'):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('one distinct feature name per column')
    if np.isnan(X).all(axis=0).any():
        raise ValueError('no observed fitting value in a column')
    with np.errstate(over='raise', invalid='raise'):
        if kind == 'standard':
            center, scale = np.nanmean(X, axis=0), np.nanstd(X, axis=0)
        elif kind == 'minmax':
            center = np.nanmin(X, axis=0)
            scale = np.nanmax(X, axis=0) - center
        elif kind == 'robust':
            q1, center, q3 = np.nanpercentile(X, [25, 50, 75], axis=0,
                                             method='linear')
            scale = q3 - q1
        elif kind == 'maxabs':
            center, scale = np.zeros(X.shape[1]), np.nanmax(abs(X), axis=0)
        else:
            raise ValueError('unknown ruler')
    zero = scale == 0
    if not np.isfinite(center).all() or not np.isfinite(scale).all():
        raise ValueError('nonfinite fitted arithmetic; rescale input')
    return Ruler(kind, names, frozen(center), frozen(np.where(zero, 1., scale)),
                 frozen(zero))


def transform(state, X, names, inverse=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names:
        raise ValueError('feature names/order differ from fit')
    with np.errstate(over='raise', invalid='raise', divide='raise'):
        return X * state.scale + state.center if inverse else (X-state.center)/state.scale


def normalize_rows(X, norm='l2'):
    X = matrix(X)
    if not np.isfinite(X).all():
        raise ValueError('row normalization here requires finite input')
    # Divide first by the largest magnitude to avoid overflow in the norm.
    largest = abs(X).max(axis=1, keepdims=True)
    scaled = X / np.where(largest == 0, 1., largest)
    if norm == 'l1':
        divisor = abs(scaled).sum(axis=1, keepdims=True)
    elif norm == 'l2':
        divisor = np.sqrt((scaled*scaled).sum(axis=1, keepdims=True))
    elif norm == 'max':
        divisor = abs(scaled).max(axis=1, keepdims=True)
    else:
        raise ValueError('norm must be l1, l2 or max')
    return scaled / np.where(divisor == 0, 1., divisor)


if __name__ == '__main__':
    X = np.array([[1.], [2.], [3.], [4.], [100.]])
    for kind, estimator in [('standard', StandardScaler()),
                            ('minmax', MinMaxScaler(clip=False)),
                            ('robust', RobustScaler(quantile_range=(25, 75))),
                            ('maxabs', MaxAbsScaler())]:
        state = fit_ruler(X, ['amount'], kind)
        query = np.array([[150.], [np.nan]])
        actual = transform(state, query, ['amount'])
        expected = estimator.fit(X).transform(query)
        np.testing.assert_allclose(actual, expected, equal_nan=True, atol=1e-12)
        np.testing.assert_allclose(transform(state, actual, ['amount'], True), query,
                                   equal_nan=True, atol=1e-12)
        print(kind, 'center/scale', state.center.tolist(), state.scale.tolist(),
              'later150', round(actual[0, 0], 6))
    constant = fit_ruler([[7.], [7.], [7.]], ['constant'])
    print('constant later7/9:', transform(constant, [[7.], [9.]], ['constant']).ravel().tolist())
    for norm in ['l1', 'l2', 'max']:
        rows = np.array([[3., 4.], [6., 8.], [0., 0.]])
        result = normalize_rows(rows, norm)
        np.testing.assert_allclose(result, Normalizer(norm=norm).transform(rows))
        print('row', norm, np.round(result, 6).tolist())
    sparse = csr_matrix([[0., 0., 3.], [1., 0., 0.], [0., 2., 0.]])
    result = StandardScaler(with_mean=False).fit_transform(sparse)
    print('sparse scale-only nnz:', sparse.nnz, result.nnz)
    dense_centered = sparse.toarray() - sparse.toarray().mean(axis=0)
    print('centered dense nnz:', int(np.count_nonzero(dense_centered)))
    q, a, b = np.array([40., 4000.]), np.array([41., 4100.]), np.array([43., 4001.])
    baseline = np.array([np.sum(((p-q)/[1, 100])**2) for p in [a, b]])
    shifted = np.array([np.sum((((p+7)-(q+7))/[1, 100])**2) for p in [a, b]])
    doubled = np.array([np.sum(((p-q)/[2, 200])**2) for p in [a, b]])
    np.testing.assert_allclose(baseline, shifted)
    np.testing.assert_allclose(baseline/4, doubled)
    print('metric baseline/doubled:', baseline.tolist(), doubled.tolist())
    for bad in [lambda: fit_ruler([[np.nan]], ['x']),
                lambda: transform(constant, [[9]], ['wrong']),
                lambda: fit_ruler([[np.inf]], ['x'])]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', str(exc))
```

Whole recorded stdout (exact captured new stdout bytes):

```text
standard center/scale [22.0] [39.01281840626232] later150 3.280973
minmax center/scale [1.0] [99.0] later150 1.505051
robust center/scale [3.0] [2.0] later150 73.5
maxabs center/scale [0.0] [100.0] later150 1.5
constant later7/9: [0.0, 2.0]
row l1 [[0.428571, 0.571429], [0.428571, 0.571429], [0.0, 0.0]]
row l2 [[0.6, 0.8], [0.6, 0.8], [0.0, 0.0]]
row max [[0.75, 1.0], [0.75, 1.0], [0.0, 0.0]]
sparse scale-only nnz: 3 3
centered dense nnz: 9
metric baseline/doubled: [2.0, 9.0001] [0.5, 2.250025]
refused: no observed fitting value in a column
refused: feature names/order differ from fit
refused: nonempty rows × features; finite numbers or NaN
```


Each estimator is fitted to the same column before its query is transformed. The comparisons check state-dependent coordinates and inverse consistency, not every possible floating-point input. The row routine divides first by the largest magnitude to avoid squaring enormous raw values. It changes no fitting state. Reductions/transformation take O(nd) work; percentile fitting may sort, costing O(dn log n). Dense output occupies its actual row×column width. Sparse scaling retains sparse storage; our dense scratch functions do not promise sparse centering.

<a id="3-encoding-categories-means-choosing-relationships"></a>
## 3. Encoding categories means choosing relationships

### Membership is different from order

A label is not necessarily a quantity. Use a constructed vocabulary `red`, `green`, `blue`; these are category names, not instructions to paint the page green. Giving them codes 0,1,2 lets a distance model treat the middle code as between the others. A name alone does not justify that relation. Look at their membership coordinates instead.

<!-- Drawing D09: visual-specifications.md#d09; actual objects and quantitative companion specified in full. -->

The full one-hot rows are red=[1,0,0], green=[0,1,0], blue=[0,0,1]. Each has exactly one active category coordinate. Any two distinct categories differ in two cells and have distance √2. The three-coordinate geometry is symmetric; a two-dimensional schematic is only a projection, and the literal vectors establish the true distances. Different one-hot blocks and numeric features still need relative weighting. Encoding does not discover their importance.

Now remove the red coordinate and examine both distances and the intercept relation.

<!-- Drawing D10: visual-specifications.md#d10; actual objects and quantitative companion specified in full. -->

Red becomes [0,0], green [1,0], blue [0,1]. Red is distance 1 from either, while green and blue remain √2 apart. Dropping a reference is useful for some parameterizations, but it changes a distance model's geometry. For a full linear design with an intercept, the three indicator columns sum to the all-ones intercept column. Coefficients are therefore not uniquely identified without a constraint. A suitable least-squares solver can still fit predictions; “all solvers require dropping one column” is false. A penalty also depends on the parameterization, just as units affected the previous coefficient example.

### Unknown, missing and rare need explicit policies

A missing category was not recorded. An unknown category is present now but absent from the fitted vocabulary. A rare category is known with little training support. See how the fitted frequency table, not the query batch, determines the output positions.

<!-- Drawing D11: visual-specifications.md#d11; actual objects and quantitative companion specified in full. -->

In the constructed policy program, train on a×4, b×1 and one missing label. With threshold 2, b enters a fitted `@rare` bucket, missing keeps its own `@missing` coordinate, and a remains frequent. These `@` names are reserved internal markers: real labels starting with `@` are refused so no measured category silently collides with absence. A present `new` label either errors, becomes all zeros, or uses the rare bucket **if one exists**, according to the selected unknown policy. Missing is not automatically unknown if it had a fitted coordinate.

<!-- Investigation L4: visual-specifications.md#l4; immediate current result and direct-entity controls specified in full. -->

Inspect the full output vector and column names while editing the query label, unknown policy and rare threshold. A threshold can remove the rare bucket; `infrequent_if_exist` then has no fitted bucket to use and falls back to all zeros in this custom contract. An unchanged frequent a is a null case. Raising a threshold refits the training policy; changing only the query does not.

OneHotEncoder exposes categories_, output names, drop and unknown/rare policy. Its native frequency grouping can put a missing marker into the infrequent bucket. That differs from our policy keeping missing separate. The program first compares an explicitly pregrouped, same-column library route, then prints the native route's distinct names. This qualification is more useful than asserting universal parity because two examples happen to have the same width. Sparse output stores active coordinates without allocating a dense n×v matrix.

Order can be real without equal gaps being real. Put small, medium and large on their supplied code axis.

<!-- Drawing D12: visual-specifications.md#d12; actual objects and quantitative companion specified in full. -->

Codes 0,1,2 express an order and, for linear/distance arithmetic, equal adjacent gaps. Clinical grades or sizes may justify the order without equal spacing. An ordinal threshold can split contiguous parts of the order; arbitrary nominal subsets need another representation or estimator. Renaming nominal codes can alter distance while renaming full one-hot columns preserves its geometry.

The complete program fits deterministic counts/vocabulary, creates dense or sparse membership rows, and separately maps a supplied ordinal order. It returns output names alongside the matrix. Unknown and missing ordinal codes are distinct negative values outside the ordered range; a model still needs to interpret them appropriately. Native categorical estimators can offer another route—check the actual estimator's category and missing interfaces rather than feeding arbitrary codes to every tree implementation.

**category_policies.py — actual new checked process.**

```python
"""One field: train-only counts, explicit rare/missing/unknown policy.

Real strings starting with '@' are rejected to avoid reserved-marker collisions.
Missing stays a separate category even when rare; this is a declared policy.
"""
from collections import Counter
from dataclasses import dataclass
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder


def labels(values):
    result = []
    for value in values:
        if value is None:
            result.append('@missing')
        elif not isinstance(value, str) or value.startswith('@'):
            raise ValueError('use strings without reserved @ prefix, or None')
        else:
            result.append(value)
    return result


@dataclass(frozen=True)
class Categories:
    counts: tuple
    rare: frozenset
    vocabulary: tuple
    drop: object


def fit_categories(values, min_count=1, drop=None):
    values = labels(values)
    if not values or not isinstance(min_count, int) or isinstance(min_count, bool) or min_count < 1:
        raise ValueError('nonempty training labels; positive integer min_count')
    counts = Counter(values)
    rare = frozenset(x for x, n in counts.items() if n < min_count and x != '@missing')
    vocabulary = tuple(sorted((set(counts)-rare) | ({'@rare'} if rare else set())))
    if drop is not None and drop not in vocabulary:
        raise ValueError('drop must name a fitted output category')
    return Categories(tuple(sorted(counts.items())), rare, vocabulary, drop)


def encode(state, values, unknown='error', sparse=False):
    if unknown not in ['error', 'ignore', 'infrequent_if_exist']:
        raise ValueError('unknown policy')
    names = tuple(x for x in state.vocabulary if x != state.drop)
    positions = {name: j for j, name in enumerate(names)}
    row_ids, col_ids = [], []
    values = labels(values)
    for i, value in enumerate(values):
        value = '@rare' if value in state.rare else value
        if value not in state.vocabulary:
            if unknown == 'error':
                raise ValueError('unseen category: '+value)
            value = '@rare' if unknown == 'infrequent_if_exist' and '@rare' in state.vocabulary else None
        if value in positions:
            row_ids.append(i)
            col_ids.append(positions[value])
    result = csr_matrix((np.ones(len(row_ids)), (row_ids, col_ids)),
                        shape=(len(values), len(names)))
    return (result if sparse else result.toarray()), names


def ordinal(values, order, unknown=-1, missing=-2):
    order = labels(order)
    if '@missing' in order or len(set(order)) != len(order):
        raise ValueError('distinct observed ordered categories')
    if unknown in range(len(order)) or missing in range(len(order)) or unknown == missing:
        raise ValueError('unknown/missing codes must be distinct from ordered codes')
    lookup = {value: j for j, value in enumerate(order)}
    return np.array([missing if x == '@missing' else lookup.get(x, unknown)
                     for x in labels(values)])


if __name__ == '__main__':
    train = ['a', 'a', 'a', 'a', 'b', None]
    state = fit_categories(train, 2)
    actual, names = encode(state, ['b', 'new', None, 'a'], 'infrequent_if_exist')
    print('counts:', state.counts, 'columns:', names)
    print('b/new/missing/a:', actual.tolist())
    assert fit_categories(list(reversed(train)), 2) == state
    # Compare the same already-grouped policy, with an explicit column order.
    grouped_train = ['@rare' if x in state.rare else x for x in labels(train)]
    grouped_query = ['@rare', '@rare', '@missing', 'a']
    library = OneHotEncoder(categories=[list(state.vocabulary)], sparse_output=False,
                            handle_unknown='ignore').fit(np.array(grouped_train)[:, None])
    np.testing.assert_array_equal(actual, library.transform(np.array(grouped_query)[:, None]))
    # Native sklearn rare handling is a separate policy (it can group missing).
    native = OneHotEncoder(min_frequency=2, handle_unknown='infrequent_if_exist',
                           sparse_output=True).fit(np.array(labels(train))[:, None])
    print('native rare names:', native.get_feature_names_out().tolist())
    print('native missing/new:', native.transform([['@missing'], ['new']]).toarray().tolist())
    bare = fit_categories(['a', 'a'])
    print('no rare bucket, unseen:', encode(bare, ['new'], 'infrequent_if_exist')[0].tolist())
    print('ordinal:', ordinal(['small', 'large', 'new', None], ['small', 'medium', 'large']).tolist())
    ordinary = OrdinalEncoder(categories=[['small', 'medium', 'large', np.nan]],
                              handle_unknown='use_encoded_value', unknown_value=-1,
                              encoded_missing_value=-2).fit(np.array([['small'], ['medium'], ['large'], [np.nan]], object))
    print('ordinary ordinal:', ordinary.transform(np.array([['small'], ['large'], ['new'], [np.nan]], object)).ravel().tolist())
    full, _ = encode(fit_categories(['red', 'green', 'blue']), ['red', 'green', 'blue'])
    dropped, _ = encode(fit_categories(['red', 'green', 'blue'], drop='red'), ['red', 'green', 'blue'])
    print('full red distances:', np.linalg.norm(full[1:]-full[0], axis=1).tolist())
    print('drop red distances:', np.linalg.norm(dropped[1:]-dropped[0], axis=1).tolist())
    try:
        fit_categories(['@missing'])
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
counts: (('@missing', 1), ('a', 4), ('b', 1)) columns: ('@missing', '@rare', 'a')
b/new/missing/a: [[0.0, 1.0, 0.0], [0.0, 1.0, 0.0], [1.0, 0.0, 0.0], [0.0, 0.0, 1.0]]
native rare names: ['x0_a', 'x0_infrequent_sklearn']
native missing/new: [[0.0, 1.0], [0.0, 1.0]]
no rare bucket, unseen: [[0.0]]
ordinal: [0, 2, -1, -2]
ordinary ordinal: [0.0, 2.0, -1.0, -2.0]
full red distances: [1.4142135623730951, 1.4142135623730951]
drop red distances: [1.0, 1.0]
refused: use strings without reserved @ prefix, or None
```


Counting costs O(n), with O(v log v) sorting for reproducible vocabulary order. One sparse one-hot field needs at most one active entry per row; dense output still has n×v cells. Rare grouping discards individual identities deliberately. Unknown all-zero encoding is not neutral: it is distance 1 from a full known one-hot row, closer than the √2 between two known categories. With a dropped reference it can coincide with the reference. Monitoring unseen valid labels remains an application decision even when transformation does not raise.

<a id="4-a-missing-value-is-a-question-not-a-zero"></a>
## 4. A missing value is a question, not a zero

### A transparent fill preserves its recording history

Switch to the constructed measurements `[10,20,NA,NA]`. Draw the observed order statistics, filled cells and original missing mask side by side.

<!-- Drawing D13: visual-specifications.md#d13; actual objects and quantitative companion specified in full. -->

The median of the observed 10 and 20 is 15. Replacing the two missing cells gives [10,20,15,15], with M=[0,0,1,1]. It is a usable numerical input, but its spread is reduced: population squared deviations from 15 average to 12.5, versus 25 among the two observed values. Neither figure estimates the true full-data variance without assumptions. Both [10,20,10,20] and [10,20,50,60] agree with the observations; their full means are 15 and 35. Filling did not decide which unseen world occurred.

An actual measured 15 and a filled 15 have the same numeric coordinate. Appending M lets a predictor distinguish their recording histories. This can help when measurement is selective. If collection policy changes, the indicator relationship can change too. A measured zero remains observed; we represent absence with NaN, not every zero.

### What caused the gap?

Now compare three **specified generators** for missing mass while holding a small station/weight table visible. Their probability rules are assumptions about the recording process, not diagnoses inferred from the mask.

<!-- Drawing D14: visual-specifications.md#d14; actual objects and quantitative companion specified in full. -->

MCAR means missingness is independent of the data values under the stated model. An independent coin erasing mass with probability .2 is an example. MAR permits dependence on observed information: station a erases with probability .1 and station b with probability .6, with no remaining weight dependence within a station. Rates can be unequal and still satisfy that conditional assumption. MNAR permits remaining dependence on the unseen value, such as a scale failing above an unrecorded weight threshold even after conditioning on other observed information. Remember M=1 means missing here; statistical texts often state these conditions using R=1 observed instead.

The same observed pattern may be compatible with different mechanisms. Observed cells generally cannot rule out all MNAR alternatives. MAR alone is also not a universal inferential validity certificate: the imputation/analysis model and relevant ignorability conditions matter. A descriptive co-missingness plot shows which gaps occur together, not why. Structural “not applicable” may need a distinct state rather than an estimated measurement. Complete-case deletion can alter which population is represented and reduce precision; there is no universal percentage below which deletion is safe. Indicators can improve prediction without identifying unseen values or fixing MNAR.

The simple-fill program saves observed counts and a median, mean or declared constant for each named feature. Transform returns both completed values and the original mask. All-missing training columns are rejected by default; an explicit constant policy retains width. `SimpleImputer(keep_empty_features=True)` is an ordinary route with its own empty-column semantics. We compare supported observed-column median behavior, rather than pretending every constant policy is identical.

**masked_simple_imputation.py — actual new checked process.**

```python
"""Fill only original missing cells; keep all-feature recording indicators.

Includes the complete P1 indicator and robust-ruler successor. P1 itself is
retained unchanged and is not imported/executed by this new programme.
"""
from dataclasses import dataclass
import numpy as np
from sklearn.impute import SimpleImputer, MissingIndicator
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from fitted_rulers import matrix, frozen, fit_ruler, transform


@dataclass(frozen=True)
class FillState:
    names: tuple
    counts: np.ndarray
    values: np.ndarray
    strategy: str


def fit_fill(X, names, strategy='median', constant=0., empty='reject'):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('one distinct name per feature')
    if strategy not in ['mean', 'median', 'constant'] or empty not in ['reject', 'constant']:
        raise ValueError('unknown strategy or empty policy')
    if not np.isfinite(constant):
        raise ValueError('finite constant required')
    counts = (~np.isnan(X)).sum(axis=0)
    if np.any(counts == 0) and empty == 'reject':
        raise ValueError('entire training column missing')
    values = np.full(X.shape[1], float(constant))
    for j in np.flatnonzero(counts):
        observed = X[~np.isnan(X[:, j]), j]
        values[j] = np.mean(observed) if strategy == 'mean' else (
            np.median(observed) if strategy == 'median' else constant)
    if not np.isfinite(values).all():
        raise ValueError('fitted fill overflow')
    return FillState(names, frozen(counts), frozen(values), strategy)


def fill(state, X, names, indicators=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names:
        raise ValueError('changed name/order')
    missing = np.isnan(X)
    result = np.where(missing, state.values, X)
    return (np.column_stack([result, missing.astype(float)]) if indicators else result), missing


def mixed_labels(categories):
    from category_policies import labels
    labels(categories)
    if 'not_recorded' in categories:
        raise ValueError('not_recorded is reserved, matching retained P1')
    return np.array(['not_recorded' if x is None else x for x in categories])


def fit_mixed(numeric, categories, robust=False):
    # Reserved marker is checked, not silently merged with a real label.
    numeric = matrix(numeric)
    category = mixed_labels(categories)
    if len(category) != len(numeric):
        raise ValueError('one category per numeric row')
    names = tuple('x'+str(j) for j in range(numeric.shape[1]))
    imputer = fit_fill(numeric, names)
    completed, _ = fill(imputer, numeric, names)
    ruler = fit_ruler(completed, names, 'robust' if robust else 'standard')
    return imputer, ruler, frozen(np.unique(category))


def mixed_transform(state, numeric, categories):
    imputer, ruler, vocabulary = state
    category = mixed_labels(categories)
    completed, mask = fill(imputer, numeric, imputer.names)
    if len(category) != len(completed):
        raise ValueError('one category per row')
    scaled = transform(ruler, completed, ruler.names)
    onehot = (category[:, None] == vocabulary).astype(float)
    return np.column_stack([scaled, onehot, mask.astype(float)])


if __name__ == '__main__':
    X = np.array([[10., 0.], [20., 2.], [np.nan, 4.], [np.nan, 6.]])
    state = fit_fill(X, ['length', 'other'])
    result, mask = fill(state, [[np.nan, 0.], [15., np.nan]], state.names, True)
    ordinary = SimpleImputer(strategy='median', keep_empty_features=True).fit(X)
    q = np.array([[np.nan, 0.], [15., np.nan]])
    expected = np.column_stack([ordinary.transform(q), MissingIndicator(features='all', error_on_new=False).fit(X).transform(q)])
    np.testing.assert_array_equal(result, expected)
    print('fill plus all indicators:', result.tolist())
    print('original mask:', mask.astype(int).tolist())
    missing_only = SimpleImputer(strategy='median', add_indicator=True).fit(X)
    print('fit-missing-only width:', missing_only.transform(q).shape[1], 'all width:', result.shape[1])
    train = np.array([[10., 100., 7.], [20., np.nan, 7.], [30., 300., 7.], [np.nan, 500., 7.]])
    cats = ['b', 'a', None, 'a']
    q = np.array([[15., 500., np.nan]])
    standard_state = fit_mixed(train, cats)
    print('standard indicator extension:', np.round(mixed_transform(standard_state, q, ['b']), 6).tolist())
    robust_state = fit_mixed(train, cats, robust=True)
    got = mixed_transform(robust_state, q, ['b'])
    imp = SimpleImputer(strategy='median').fit(train)
    rob = RobustScaler(quantile_range=(25, 75)).fit(imp.transform(train))
    enc = OneHotEncoder(categories=[robust_state[2].tolist()], sparse_output=False).fit(np.array(['b', 'a', 'not_recorded', 'a'])[:, None])
    expected = np.column_stack([rob.transform(imp.transform(q)), enc.transform([['b']]), np.isnan(q)])
    np.testing.assert_allclose(got, expected)
    print('robust indicator extension:', got.tolist())
    empty = fit_fill([[np.nan, 0.], [np.nan, 1.]], ['empty', 'measured'], empty='constant', constant=-1)
    print('empty kept constant:', fill(empty, [[np.nan, 0]], empty.names)[0].tolist())
    try:
        fit_fill([[np.nan]], ['empty'])
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
fill plus all indicators: [[15.0, 0.0, 1.0, 0.0], [15.0, 3.0, 0.0, 1.0]]
original mask: [[1, 0], [0, 1]]
fit-missing-only width: 3 all width: 4
standard indicator extension: [[-0.707107, 1.414214, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]]
robust indicator extension: [[-1.0, 2.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]]
empty kept constant: [[-1.0, 0.0]]
refused: entire training column missing
```


`fit_mixed` is also the complete supported successor for the indicator/robust modification introduced later with the retained P1. It does not import or run P1's top-level example. Its three stages fit fills, fit a standard or robust numeric ruler on the filled training matrix, then save category order. `mixed_transform` appends the original mask **after** the numeric and category coordinates. MissingIndicator(features='all', error_on_new=False) supplies the same fixed-width indicator branch. SimpleImputer(add_indicator=True) instead includes only columns missing during fitting; a newly missing column can therefore lack its own indicator. The printed widths make that difference concrete.

### Borrow only from rows that can donate this target

For local conditional information, compare the constructed query Q=[2,12,NA] with three donors. Look first at which coordinates can be compared.

<!-- Drawing D15: visual-specifications.md#d15; actual objects and quantitative companion specified in full. -->

| Row | a | b | c |
| --- | ---: | ---: | ---: |
| Q | 2 | 12 | NA |
| D1 | 1 | 10 | 100 |
| D2 | 3 | NA | 300 |
| D3 | NA | 14 | 500 |

Q and D1 overlap on a,b; Q and D2 only a; Q and D3 only b. The target c is missing in Q, so none of the donors' c values enter a Q-to-donor distance. Having a defined distance and observing the requested target are separate requirements.

Draw the overlap counts and adjusted squared differences before ranking lengths.

<!-- Drawing D16: visual-specifications.md#d16; actual objects and quantitative companion specified in full. -->

For total width d and q jointly observed coordinates, the nan-aware squared distance is `(d/q) Σshared Δ²`. Here d=3. D1 gives (3/2)(1+4)=7.5; D2 gives 3(1)=3; D3 gives 3(4)=12. The distances are their square roots, not 7.5,3,12 drawn as Euclidean lengths. No overlap means an undefined distance, not zero. The factor extrapolates the average squared discrepancy across the full width; weak or selective overlap can make this a poor similarity estimate.

Now connect only the selected target cells to the estimate.

<!-- Drawing D17: visual-specifications.md#d17; actual objects and quantitative companion specified in full. -->

With k=2 and uniform weights, D2 and D1 supply (300+100)/2=200. Remove D2's c and it cannot donate c even though its observed a still permits a comparison; D1 and D3 now give 300. Separately, change D1's c to 140 with all original cells otherwise restored: selection stays D2,D1 and the answer becomes 220. Changing unused D3 c can be a null. If no target-eligible donor has any overlap, the fallback uses the training target's observed mean, 300 here. If the entire training target column is absent, no donor evidence supports an estimate; our default refuses it, while an explicit constant policy remains a modeling choice.

<!-- Investigation L5: visual-specifications.md#l5; immediate current result and direct-entity controls specified in full. -->

Select and edit one actual Q/donor input cell, including marking it absent, and vary k. Eligibility, overlap, distances, selected c cells and result update together. Start at 200; inspect the 300 and 220 contrasts and the no-overlap fallback. Stable source-index ties are our custom policy. sklearn need not select the same tied subset; compare untied cases or aggregates invariant to the tie.

For multiple missing query features, compute distances from the **original** query once. Filling c must not silently make c available when selecting donors for another target. This differs from iterative conditional completion, which deliberately uses current filled predictors and will receive its own algorithm. Read the full target-specific selection loop below.

**nan_aware_donors.py — actual new checked process.**

```python
"""Target-eligible donors; distances always use the original query row."""
from dataclasses import dataclass
import numpy as np
from sklearn.impute import KNNImputer
from sklearn.metrics.pairwise import nan_euclidean_distances
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Donors:
    X: np.ndarray
    means: np.ndarray
    counts: np.ndarray


def fit_donors(X, empty='reject', constant=0.):
    X = matrix(X)
    counts = (~np.isnan(X)).sum(axis=0)
    if empty not in ['reject', 'constant'] or not np.isfinite(constant):
        raise ValueError('declare reject or finite constant empty policy')
    if (counts == 0).any() and empty == 'reject':
        raise ValueError('all-target-missing column has no donor evidence')
    means = np.full(X.shape[1], float(constant))
    for j in np.flatnonzero(counts):
        means[j] = X[~np.isnan(X[:, j]), j].mean()
    if not np.isfinite(means).all():
        raise ValueError('mean overflow')
    return Donors(frozen(X), frozen(means), frozen(counts))


def distances(state, query):
    # q differs by donor. The factor d/q uses the original total width d.
    common = ~np.isnan(state.X) & ~np.isnan(query)[None, :]
    count = common.sum(axis=1)
    with np.errstate(over='raise', invalid='raise'):
        delta = np.where(common, state.X-query, 0.)
        squares = (delta*delta).sum(axis=1)
        result = np.sqrt(squares*state.X.shape[1]/np.where(count, count, 1))
    result[count == 0] = np.nan
    return result


def complete(state, X, k=2, weights='uniform'):
    X = matrix(X, state.X.shape[1])
    if not isinstance(k, int) or isinstance(k, bool) or k < 1 or weights not in ['uniform', 'distance']:
        raise ValueError('positive integer k and uniform/distance weights')
    result = X.copy()
    traces = []
    for i, query in enumerate(X):
        dist = distances(state, query)  # once per row, reused for each target
        for j in np.flatnonzero(np.isnan(query)):
            eligible = np.flatnonzero(~np.isnan(state.X[:, j]) & np.isfinite(dist))
            chosen = eligible[np.argsort(dist[eligible], kind='stable')[:k]]
            if len(chosen) == 0:
                result[i, j] = state.means[j]
                reason = 'observed target mean' if state.counts[j] else 'declared empty constant'
            else:
                d = dist[chosen]
                if weights == 'uniform':
                    w = np.ones(len(chosen))
                elif np.any(d == 0):
                    w = (d == 0).astype(float)
                else:
                    w = d.min()/d
                result[i, j] = (w/w.sum()) @ state.X[chosen, j]
                reason = 'selected target-observed donors'
            traces.append({'row': i, 'target': int(j), 'donors': chosen.tolist(),
                           'distance': dist.tolist(), 'reason': reason,
                           'value': float(result[i, j])})
    if not np.isfinite(result).all():
        raise ValueError('completion produced nonfinite value')
    return result, traces


if __name__ == '__main__':
    X = np.array([[1., 10., 100.], [3., np.nan, 300.], [np.nan, 14., 500.]])
    query = [[2., 12., np.nan]]
    state = fit_donors(X)
    print('squared distances:', (distances(state, np.array(query[0]))**2).tolist())
    np.testing.assert_allclose(distances(state, np.array(query[0])), nan_euclidean_distances(query, X)[0])
    for name, donors in [('baseline', X), ('remove D2 target', np.array([[1, 10, 100], [3, np.nan, np.nan], [np.nan, 14, 500]], float)),
                          ('D1 target140', np.array([[1, 10, 140], [3, np.nan, 300], [np.nan, 14, 500]], float))]:
        got, trace = complete(fit_donors(donors), query)
        expected = KNNImputer(n_neighbors=2, weights='uniform', keep_empty_features=True).fit(donors).transform(query)
        np.testing.assert_allclose(got, expected)
        print(name, got.tolist(), 'donors', trace[0]['donors'])
    print('no overlap fallback:', complete(state, [[np.nan, np.nan, np.nan]])[0].tolist())
    multi = np.array([[0., 10., 100.], [2., 20., 200.], [4., 40., 400.]])
    got, trace = complete(fit_donors(multi), [[1., np.nan, np.nan]], k=2)
    print('two missing targets:', got.tolist(), 'donor sets:', [t['donors'] for t in trace])
    assert [t['donors'] for t in trace] == [[0, 1], [0, 1]]
    # A target-specific missing donor exposes why completed coordinates must
    # not feed back into later distances in this algorithm.
    trap = fit_donors([[0., 0., np.nan], [2., 100., 100.], [3., 0., 200.]])
    original, trace = complete(trap, [[1., np.nan, np.nan]], k=1)
    fed_back, _ = complete(trap, [[1., original[0, 1], np.nan]], k=1)
    assert original[0, 2] == 100. and fed_back[0, 2] == 200.
    print('original query versus forbidden feedback:', original.tolist(), fed_back.tolist())
    print('exact zero distance weighted:', complete(fit_donors([[0., 10.], [0., 20.], [1., 100.]]), [[0., np.nan]], k=3, weights='distance')[0].tolist())
    np.testing.assert_array_equal(state.X, X)
    try:
        fit_donors([[1., np.nan]])
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
squared distances: [7.5, 2.9999999999999996, 11.999999999999998]
baseline [[2.0, 12.0, 200.0]] donors [1, 0]
remove D2 target [[2.0, 12.0, 300.0]] donors [0, 2]
D1 target140 [[2.0, 12.0, 220.0]] donors [1, 0]
no overlap fallback: [[2.0, 12.0, 300.0]]
two missing targets: [[1.0, 15.0, 150.0]] donor sets: [[0, 1], [0, 1]]
original query versus forbidden feedback: [[1.0, 0.0, 100.0]] [[1.0, 0.0, 200.0]]
exact zero distance weighted: [[0.0, 15.0]]
refused: all-target-missing column has no donor evidence
```


The state keeps copies of training donors, observed means and counts. For each query, the shared mask creates one distance vector. For each missing target, it filters eligible target-observed rows, stably orders them and chooses up to k defined distances. Uniform means and normalized inverse-distance weights are separate choices; when exact-zero donors occur, distance weighting shares mass among exact matches, avoiding division by zero. Observed query cells remain unchanged. Distance work is O(qnd) for q query rows; full donor sorting costs O(n log n) per missing target in this transparent reference. Reusing the distance vector saves repeated coordinate arithmetic, but does not make a wide incomplete table free.

Iterative completion can use broader feature relationships. For a first conceptual turn, if complete cases follow mass=100×length, observed length 3 can suggest missing mass 300. That is a fitted conditional estimate, not a measurement. When another row lacks length, a later model may use currently filled mass. Section 9 builds and saves this sequence rather than leaving the mechanism inside an unexplained estimator.

<a id="5-learn-the-preparation-rule-without-looking-ahead"></a>
## 5. Learn the preparation rule without looking ahead

### Fit and transform have different information

Fit learns state: medians, centers, scales, vocabulary or parameters. Transform applies that state to new inputs. A query must not redefine its own ruler. If training endpoints are 1 and 100, later 150 maps to 149/99; fitting again on the later batch changes the question.

Switch to P1's **four-row constructed example with three numeric features**, not the penguin experiment's four. Follow each training column into its saved arrays.

<!-- Drawing D18: visual-specifications.md#d18; actual objects and quantitative companion specified in full. -->

The training numeric rows are [10,100,7], [20,NA,7], [30,300,7], [NA,500,7]. Medians are [20,300,7]. After filling, means are [20,300,7] and population scales [√50,√20000,1], with 1 replacing the third column's zero spread. Categories b,a,missing,a give sorted columns a,b,not_recorded. These arrays, not the later batch, determine subsequent coordinates.

Join the actual numeric and categorical cells in their invariant order.

<!-- Drawing D19: visual-specifications.md#d19; actual objects and quantitative companion specified in full. -->

P1 outputs three numeric plus three one-hot coordinates: width **6**. The later real penguin pipeline has four numeric plus three one-hot coordinates: width **7**. This switch is explicit. The target remains separate in both. In a Pipeline, steps in one branch run sequentially; ColumnTransformer runs designated column branches and concatenates their outputs in the declared order. Output names are part of the schema, not decoration.

The retained complete P1 below constructs the state with NumPy, then fits SimpleImputer, StandardScaler and OneHotEncoder on the same inputs to compare supported behavior. Its exact source and recorded stdout are preserved from the historical execution; this content revision did not replay its main. The scratch policy rejects all-missing training numeric columns and reserves `not_recorded` for absence. That is a bounded teaching policy, not general equivalence to every library configuration.

**fitted_preparation.py — historical retained native receipt.**

```python
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def inputs(numeric, categories):
    numeric = np.asarray(numeric, dtype=float)
    if numeric.ndim != 2 or 0 in numeric.shape or np.isinf(numeric).any():
        raise ValueError("Use a nonempty numeric matrix: finite values or NaN.")
    if len(categories) != len(numeric) or any(
        value is not None and not isinstance(value, str) for value in categories
    ):
        raise ValueError("Use one string or None category per row.")
    if "not_recorded" in categories:
        raise ValueError("not_recorded is reserved; use None for a missing category.")
    category = np.array(["not_recorded" if value is None else value
                         for value in categories])
    return numeric, category

def fit_preparation(numeric, categories):
    numeric, category = inputs(numeric, categories)
    if np.isnan(numeric).all(axis=0).any():
        raise ValueError("This teaching fit requires an observation in every column.")
    with np.errstate(over="raise", invalid="raise"):
        median = np.nanmedian(numeric, axis=0)
        filled = np.where(np.isnan(numeric), median, numeric)
        scale = filled.std(axis=0, ddof=0)
        mean = filled.mean(axis=0)
    return {"median": median, "mean": mean,
            "scale": np.where(scale == 0, 1.0, scale),
            "categories": np.unique(category)}

def transform_preparation(state, numeric, categories):
    numeric, category = inputs(numeric, categories)
    if numeric.shape[1] != len(state["median"]):
        raise ValueError("Keep the fitted numeric feature schema.")
    filled = np.where(np.isnan(numeric), state["median"], numeric)
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        scaled = (filled - state["mean"]) / state["scale"]
    indicators = (category[:, None] == state["categories"]).astype(float)
    return np.column_stack([scaled, indicators])

train = np.array([[10., 100., 7.], [20., np.nan, 7.],
                  [30., 300., 7.], [np.nan, 500., 7.]])
train_categories = ["b", "a", None, "a"]
query = np.array([[25., np.nan, 9.], [np.nan, 700., 7.]])
query_categories = ["new", None]
state = fit_preparation(train, train_categories)
snapshot = {key: value.copy() for key, value in state.items()}
manual = transform_preparation(state, query, query_categories)

imputer = SimpleImputer(strategy="median").fit(train)
scaler = StandardScaler().fit(imputer.transform(train))
encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
encoder.fit(inputs(train, train_categories)[1][:, None])
library = np.column_stack([
    scaler.transform(imputer.transform(query)),
    encoder.transform(inputs(query, query_categories)[1][:, None]),
])
np.testing.assert_allclose(manual, library, rtol=0, atol=1e-12)
np.testing.assert_allclose(state["median"], imputer.statistics_)
np.testing.assert_allclose(state["mean"], scaler.mean_)
np.testing.assert_allclose(state["scale"], scaler.scale_)
np.testing.assert_array_equal(state["categories"], encoder.categories_[0])

changed = query.copy()
changed[1, 1] = 1000.
edited = transform_preparation(state, changed, query_categories)
assert all(np.array_equal(state[key], before) for key, before in snapshot.items())
assert np.array_equal(edited[0], manual[0])
print("category columns:", state["categories"].tolist())
print("medians:", state["median"].tolist())
print("new rows:", np.round(manual, 6).tolist())
print("library parity:", np.allclose(manual, library, rtol=0, atol=1e-12))
print("edited second coordinate:", round(edited[1, 1], 6))
```

Whole recorded stdout (exact historical stdout literal):

```text
category columns: ['a', 'b', 'not_recorded']
medians: [20.0, 300.0, 7.0]
new rows: [[0.707107, 0.0, 2.0, 0.0, 0.0, 0.0], [0.0, 2.828427, 0.0, 0.0, 0.0, 1.0]]
library parity: True
edited second coordinate: 4.949747
```


`inputs` checks row/column form and one category per row. `np.where` fills only NaNs, broadcasting the three saved medians across rows. Means/scales broadcast the same way at transform. Comparing each category against vocabulary positions creates one-hot membership; `column_stack` places the numeric block before it. The first query [25,NA,9],unknown becomes approximately [.707107,0,2,0,0,0]. Missing numeric feature two is filled with its fitted median and becomes zero here. Constant-training feature three later 9 becomes 2. The unknown category gets zeros; a missing category instead uses not_recorded. The second query's edited measurement 1000 changes its coordinate to about 4.949747 while state and the other row stay fixed.

Keep a boundary around the rows allowed to fit those arrays; the query has no backward path.

<!-- Drawing D20: visual-specifications.md#d20; actual objects and quantitative companion specified in full. -->

Split before learning preparation. Unsupervised summaries can leak held-out feature distribution even without labels. Fit the preprocessing and predictor using training rows; transform the held-out inputs and compare predictions with held-out outcomes afterward. In a validation fold, that boundary is repeated with a fresh fitting state for the fold's training rows. This local explanation needs only a held-out subset; the next lesson owns complete selection, inner/outer assessment and refit procedures.

<!-- Investigation L6: visual-specifications.md#l6; immediate current result and direct-entity controls specified in full. -->

Edit one numeric query cell with the P1 state pinned. Its output coordinate changes or uses the stored median; every fitted array remains unchanged. Change third-feature 7 to 9 and see 2. Reset restores the query, selection and current output together. A no-refit invariant is something to inspect, not a badge automatically earned by using a Pipeline.

The complete P4 mixed successor supplies the previously requested indicator and robust extension. For [15,500,NA],b, standard numeric coordinates are [−1/√2,√2,0], category block [0,1,0], original mask [0,0,1]. Its nine-coordinate result is approximately [−.707107,1.414214,0,0,1,0,0,0,1]. Robust state uses the filled training medians and linear IQR, with constant spread replaced by 1. The source and ordinary comparisons are already fully shown in section 4; practice changes its input rather than asking you to invent hidden helpers.

Pipeline packages the boundary but does not repair a target-revealing feature, related subjects split on both sides, or a transformer manually fitted on all rows beforehand. TargetEncoder also has a deliberate training exception: fit_transform creates cross-fitted codes, whereas fit then transform creates full-fit codes. Section 8 teaches why the two representations differ.

<a id="6-a-complete-experiment-on-real-penguin-measurements"></a>
## 6. A complete experiment on real penguin measurements

Return now to the real Palmer Penguins file. It contains 344 observations; the supplied four measurements each have two missing rows, and recorded sex has eleven. Bill length/depth and flipper length are millimeters, mass grams. We select these four measurements plus sex and predict Adelie, Chinstrap or Gentoo. The data were collected for ecological research; this classification exercise does not establish performance for every future population or collection protocol.

Inspect the preserved partition and correct counts on a common zero-based axis.

<!-- Drawing D21: visual-specifications.md#d21; actual objects and quantitative companion specified in full. -->

The retained stratified seed-20 split has 258 training and 86 assessment rows. Each classifier uses five neighbors, identical categorical preparation and the same indices. The only comparison choice is the numerical ruler after median fill. The training majority baseline gets 38/86 correct. Raw numeric coordinates get 67, standard 84, min–max 85, robust 85. An extra correct case does not identify a generally superior scaler. Repeatedly choosing from this held-out result makes it development evidence rather than fresh assessment; the next lesson formalizes a better selection protocol.

This exact full program and stdout are retained from the September 21 native receipt (NumPy 2.3.5, pandas 3.0.1, scikit-learn 1.9.1, Python 3.12 route). They have **not** been rerun for this content revision. Keep penguins.csv beside the file. The exact historical LF execution-input identity and current CRLF download identity are both explained below.

**penguins_prepare.py — historical retained native receipt.**

```python
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    MinMaxScaler, OneHotEncoder, RobustScaler, StandardScaler,
)

data = pd.read_csv(Path(__file__).with_name("penguins.csv"))
numeric = [
    "bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g",
]
categorical = ["sex"]
X = data[numeric + categorical]
y = data["species"]
train, test = train_test_split(
    np.arange(len(data)), test_size=0.25, random_state=20, stratify=y,
)

def make_model(scaler):
    numeric_steps = Pipeline([
        ("impute", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("scale", scaler),
    ])
    category_steps = Pipeline([
        ("impute", SimpleImputer(
            strategy="constant", fill_value="not_recorded",
            keep_empty_features=True,
        )),
        ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    prepare = ColumnTransformer([
        ("numeric", numeric_steps, numeric),
        ("category", category_steps, categorical),
    ])
    return Pipeline([
        ("prepare", prepare),
        ("classify", KNeighborsClassifier(n_neighbors=5)),
    ])

baseline = DummyClassifier(strategy="most_frequent")
baseline.fit(np.zeros((len(train), 1)), y.iloc[train])
baseline_prediction = baseline.predict(np.zeros((len(test), 1)))
print("majority", int(np.sum(baseline_prediction == y.iloc[test])), "/", len(test))

models = {}
for name, scaler in [
    ("raw", "passthrough"),
    ("standard", StandardScaler()),
    ("minmax", MinMaxScaler()),
    ("robust", RobustScaler()),
]:
    model = make_model(scaler)
    model.fit(X.iloc[train], y.iloc[train])
    prediction = model.predict(X.iloc[test])
    correct = int(np.sum(prediction == y.iloc[test]))
    print(name, correct, "/", len(test), f"{correct / len(test):.4f}")
    models[name] = model

prepare = models["standard"].named_steps["prepare"]
print(prepare.get_feature_names_out())
print(np.round(prepare.transform(X.iloc[test[:1]]), 4))
```

Whole recorded stdout (exact historical stdout literal):

```text
majority 38 / 86
raw 67 / 86 0.7791
standard 84 / 86 0.9767
minmax 85 / 86 0.9884
robust 85 / 86 0.9884
['numeric__bill_length_mm' 'numeric__bill_depth_mm'
 'numeric__flipper_length_mm' 'numeric__body_mass_g'
 'category__sex_female' 'category__sex_male' 'category__sex_not_recorded']
[[ 1.3091  0.8773  0.1645 -0.1128  0.      1.      0.    ]]
```


`train_test_split` returns source positions, stratifying by species. Numeric and categorical names select X; y is separate. `make_model` constructs new fitted objects for each comparison. Numeric Pipeline fills and then scales; categorical Pipeline inserts a reserved marker and then one-hot encodes. ColumnTransformer joins their outputs. The outer Pipeline applies fitted preparation before KNeighborsClassifier. `fit(X.iloc[train], y.iloc[train])` is the only fitting route. `predict(X.iloc[test])` applies saved state. “passthrough” leaves numeric units unchanged but retains median fill. DummyClassifier learns the training majority; it does not read the held-out class counts to choose its answer.

Follow the actual source row 309 through frozen statistics into all seven coordinates.

<!-- Drawing D22: visual-specifications.md#d22; actual objects and quantitative companion specified in full. -->

The numeric medians are [45,17.3,197,4000]. Training means after fill are approximately [43.9306,17.0992,200.6589,4190.9884]; scales [5.4000,1.9387,14.2307,806.6876]. Row 309's observed [51,18.8,203,4100] becomes approximately [1.3091,.8773,.1645,−.1128]. The ordered categorical block is female,male,not_recorded, giving [0,1,0]. A negative mass coordinate means below the training mean, not negative physical mass.

<!-- Investigation L7: visual-specifications.md#l7; immediate current result and direct-entity controls specified in full. -->

Inspect a retained row or alter an independent copy, with fitted state fixed. Erasing row 309's mass supplies median 4000 and computes `(4000−4190.988372093023)/806.6875829303058≈−.2368`; other coordinates stay unchanged. Editing sex affects the category block. A present unknown string maps all-zero under the saved policy; missing uses not_recorded. These are input inspection operations, not newly trained predictions or updated accuracy. All 86 retained transformed rows and predictions remain available in the data attachment.

Now align source positions, split order and retained outcomes before interpreting the result's provenance.

<!-- Drawing D23: visual-specifications.md#d23; actual objects and quantitative companion specified in full. -->

There are two exact byte identities for one parsed observation table. The actual current downloadable file has CRLF line endings and 15586 bytes. The historical execution input has LF line endings and 15241 bytes. Replacing every CRLF with LF in the current bytes gives the exact historical SHA-256, not merely a similar-looking table. The setup/source-role index prints both full hashes. Generated predecessor provenance still advertises the LF identity; that literal is historical metadata and does not describe the current download's raw bytes. None of this asserts a new fit against the current byte file. The 344 parsed rows preserve order/values/missing cells, and the 86 transformed rows equal the retained calculated JSON without numerical replay.

Standard scaling misclassified two rows and raw coordinates nineteen on this split. Examine actual errors, feature availability and geometry before inventing a species story. The recording process and population matter more than a tidy score. This is a controlled application showing that representation changes an estimator's evidence; it is not a leaderboard or proof that prediction-oriented fills recover scientific truth.


<a id="7-deeper-branch-change-the-shape-not-only-the-ruler"></a>
## 7. Deeper branch: change the shape, not only the ruler

### Equal ratios, power families and fitted parameters

An affine map `(x−a)/b` changes every gap by the same factor. Sometimes equal ratios should have equal influence instead. On the constructed values 1,10,100, follow equal tenfold steps into equal log differences.

<!-- Drawing D24: visual-specifications.md#d24; actual objects and quantitative companion specified in full. -->

Natural logs give 0, ln10 and ln100=2ln10. Each tenfold change adds ln10≈2.302585. This is useful when a multiplicative concentration change is the meaningful comparison. It does not justify logging an arbitrary signed measurement. log x requires x>0; log1p x means log(1+x), with a different domain x>−1 and a different offset.

Box–Cox supplies a family: for x>0, `gλ(x)=(x^λ−1)/λ` when λ≠0 and log x when λ=0. Why this log limit? Write x^λ=exp(λlog x); `(exp(t)−1)/t→1` as t→0. Multiplying by log x gives the result. At λ=1, Box–Cox gives x−1, an identity **up to an offset**, whereas the signed Yeo–Johnson family gives exactly x. The book's geometric-mean-normalized Box–Cox convention is another stated scaling; our ordinary sklearn route uses the unnormalized formula here.

For Yeo–Johnson, see the positive and negative pieces and the active branch before doing arithmetic.

<!-- Drawing D25: visual-specifications.md#d25; actual objects and quantitative companion specified in full. -->

For x≥0, let v=1+x. Use `(v^λ−1)/λ`, or log v at λ=0. For x<0, let u=1−x>1. Use `−(u^(2−λ)−1)/(2−λ)`, or −log u at λ=2. The reflected negative branch joins at zero and uses exponent 2−λ. Thus x=−3 gives −7.5 at λ=0, −3 at λ=1, and −ln4≈−1.386294 at λ=2. Positive 3 at λ=1 gives 3 as well. “Negative inputs use a square root” misses the parameter dependence entirely.

<!-- Investigation L8: visual-specifications.md#l8; immediate current result and direct-entity controls specified in full. -->

Begin at Yeo–Johnson x=−3, λ=2 with the logarithmic negative branch visible. Change x and λ to see the expression and coordinate move together. Box–Cox nonpositive x is a domain refusal, not a point to clamp into the plot. Near λ=0 or 2, `expm1` computes exp(t)−1 accurately without subtracting nearly equal floating-point numbers. `log1p` similarly computes log(1+t). Manually selecting λ is an exploration; it must not be labeled a learned parameter.

Fitting λ is a separate operation. Suppose a transformed scalar feature is approximated by a normal distribution with its mean and variance estimated at each λ. The normal log density, maximized over mean/variance, contributes `−n log(vλ)/2` up to constants, where vλ is the transformed **population** variance. But transformed densities must be measured in the original x units. The derivative g′ supplies a change-of-variables Jacobian; summing log|g′(xᵢ)| adds another term. Without it, shrinking all transformed numbers can falsely look like a better fit just by changing units.

Inspect both terms over a finite constructed training column and mark the selected λ on the computed curve.

<!-- Drawing D26: visual-specifications.md#d26; actual objects and quantitative companion specified in full. -->

For positive Box–Cox data,

\[
\ell(\lambda)=-\frac n2\log v_\lambda+(\lambda-1)\sum_i\log x_i.
\]

For Yeo–Johnson, replace the sum of logs by `Σ sign(xᵢ) log(1+|xᵢ|)` in the Jacobian term. Positive branch derivative is (1+x)^(λ−1); negative branch derivative is (1−x)^(1−λ), giving that sign. Zero variance is degenerate: it is not an infinitely successful normalizing fit. Fit only on training observations, save λ, then optionally fit a separate affine standardization on those transformed training values.

The complete program implements forward/inverse families, objective terms and a bounded scalar search. SciPy's optimizer is a declared numerical primitive; it does not implement the owned transform or likelihood for us. Candidate endpoints are explicitly compared. State records name, bounds, selected λ, objective, evaluation count and whether the selection is interior, boundary or capped. A bounded local search is not a universal global optimum theorem. A boundary result is information that the specified search range mattered.

**fitted_power_maps.py — actual new checked process.**

```python
"""Stable scalar power families, inverses and bounded likelihood fitting."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import minimize_scalar
from sklearn.preprocessing import PowerTransformer


def checked(values):
    x = np.asarray(values, float)
    if x.size == 0 or not np.isfinite(x).all():
        raise ValueError('nonempty finite values required')
    return x


def quotient(log_v, power):
    return log_v if power == 0 else np.expm1(power*log_v)/power


def inverse_quotient(z, power):
    if power == 0:
        return z
    if np.any(1+power*z <= 0):
        raise ValueError('value outside inverse power domain')
    return np.log1p(power*z)/power


def forward(x, lam, method='yeo-johnson'):
    x = checked(x)
    if not np.isfinite(lam) or method not in ['box-cox', 'yeo-johnson']:
        raise ValueError('finite lambda and known family required')
    try:
        with np.errstate(over='raise', invalid='raise', divide='raise'):
            if method == 'box-cox':
                if np.any(x <= 0):
                    raise ValueError('Box-Cox requires strictly positive inputs')
                y = quotient(np.log(x), lam)
            else:
                y = np.empty_like(x)
                positive = x >= 0
                y[positive] = quotient(np.log1p(x[positive]), lam)
                y[~positive] = -quotient(np.log1p(-x[~positive]), 2-lam)
    except FloatingPointError as exc:
        raise ValueError('power arithmetic overflow/domain failure') from exc
    if not np.isfinite(y).all():
        raise ValueError('nonfinite power result')
    return y


def inverse(y, lam, method='yeo-johnson'):
    y = checked(y)
    if not np.isfinite(lam) or method not in ['box-cox', 'yeo-johnson']:
        raise ValueError('finite lambda and known family required')
    try:
        with np.errstate(over='raise', invalid='raise', divide='raise'):
            if method == 'box-cox':
                x = np.exp(inverse_quotient(y, lam))
            else:
                x = np.empty_like(y)
                positive = y >= 0
                x[positive] = np.expm1(inverse_quotient(y[positive], lam))
                x[~positive] = -np.expm1(inverse_quotient(-y[~positive], 2-lam))
    except FloatingPointError as exc:
        raise ValueError('inverse arithmetic overflow/domain failure') from exc
    if not np.isfinite(x).all():
        raise ValueError('nonfinite inverse')
    return x


def likelihood(x, lam, method):
    x = checked(x).ravel()
    y = forward(x, lam, method)
    with np.errstate(over='raise', invalid='raise'):
        variance = y.var(ddof=0)
        jacobian = (lam-1)*np.sum(np.log(x) if method == 'box-cox' else np.sign(x)*np.log1p(abs(x)))
    if not np.isfinite(variance) or variance <= 0:
        raise ValueError('degenerate transformed variance')
    return float(-len(x)*np.log(variance)/2), float(jacobian)


@dataclass(frozen=True)
class PowerState:
    method: str
    name: str
    lam: float
    center: float
    scale: float
    objective: float
    bounds: tuple
    status: str
    evaluations: int


def fit_power(x, name='amount', method='yeo-johnson', bounds=(-3., 3.), standardize=False):
    x = checked(x).ravel()
    if len(x) < 2 or np.ptp(x) == 0:
        raise ValueError('at least two nonconstant observed fitting values')
    if len(bounds) != 2 or not np.isfinite(bounds).all() or bounds[0] >= bounds[1]:
        raise ValueError('finite increasing search bounds')
    # Validate the data domain separately from optimizer-candidate failure.
    forward(x, 1., method)
    def objective(lam):
        try:
            return -sum(likelihood(x, lam, method))
        except (ValueError, FloatingPointError):
            return np.inf
    fit = minimize_scalar(objective, bounds=bounds, method='bounded',
                          options={'maxiter': 200, 'xatol': 1e-8})
    candidates = [(objective(float(lam)), float(lam)) for lam in [fit.x, *bounds]]
    value, lam = min(candidates)
    if not np.isfinite(value):
        raise ValueError('no finite objective in search')
    y = forward(x, lam, method)
    center, scale = (float(y.mean()), float(y.std())) if standardize else (0., 1.)
    status = 'boundary' if lam in bounds else ('interior' if fit.success else 'iteration cap')
    return PowerState(method, name, lam, center, scale, -value, tuple(bounds), status, fit.nfev+3)


def apply(state, x, name='amount', undo=False):
    if name != state.name:
        raise ValueError('feature name changed')
    return inverse(checked(x)*state.scale+state.center, state.lam, state.method) if undo else (
        forward(x, state.lam, state.method)-state.center)/state.scale


if __name__ == '__main__':
    for method, x in [('box-cox', np.array([1., 2., 4., 10., 30.])),
                       ('yeo-johnson', np.array([-3., -1., 0., 2., 8.]))]:
        for lam in [0., 1e-9, 1., 2.-1e-9, 2.]:
            y = forward(x, lam, method)
            np.testing.assert_allclose(inverse(y, lam, method), x, atol=1e-10)
            # The public estimator fits lambda; inspect same-lambda values via
            # SciPy's public family functions rather than changing learned state.
            from scipy.special import boxcox
            from scipy.stats import yeojohnson
            primitive = boxcox if method == 'box-cox' else yeojohnson
            np.testing.assert_allclose(y, primitive(x, lam), rtol=1e-9, atol=1e-9)
        state = fit_power(x, method=method)
        ordinary = PowerTransformer(method=method, standardize=False).fit(x[:, None])
        same_lambda = forward(x, float(ordinary.lambdas_[0]), method)
        np.testing.assert_allclose(same_lambda, ordinary.transform(x[:, None])[:, 0], atol=1e-10)
        print(method, 'bounded lambda/status:', round(state.lam, 6), state.status,
              'terms:', np.round(likelihood(x, state.lam, method), 6).tolist())
        print('ordinary lambda/objective:', round(float(ordinary.lambdas_[0]), 6),
              round(sum(likelihood(x, float(ordinary.lambdas_[0]), method)), 6))
        print('later:', np.round(apply(state, [3., 12.]), 6).tolist())
    print('YJ -3 at lambda0/1/2:', [float(forward([-3.], l)[0]) for l in [0., 1., 2.]])
    for bad in [lambda: forward([0.], 0., 'box-cox'), lambda: fit_power([7., 7.]),
                lambda: inverse([-2.], 1., 'box-cox'), lambda: forward([1e300], 5., 'box-cox')]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
box-cox bounded lambda/status: -0.146859 interior terms: [0.304636, -8.926257]
ordinary lambda/objective: -0.146859 -8.621621
later: [1.014567, 2.081967]
yeo-johnson bounded lambda/status: 0.59621 interior terms: [-5.354712, -0.491169]
ordinary lambda/objective: 0.59621 -5.845881
later: [2.15588, 6.062805]
YJ -3 at lambda0/1/2: [-7.499999999999999, -3.0, -1.3862943611198906]
refused: Box-Cox requires strictly positive inputs
refused: at least two nonconstant observed fitting values
refused: value outside inverse power domain
refused: power arithmetic overflow/domain failure
```


Read the inverse algebra alongside the code. For a nonzero positive power, y=(v^p−1)/p implies `log v=log1p(py)/p`, requiring 1+py>0. In the zero-power limit log v=y. Undo the Yeo–Johnson sign/shift after recovering v or u. Box–Cox uses exp rather than expm1 because its original variable is v itself; Yeo–Johnson removes the added 1. The saved center/scale are undone before the family inverse.

The bounded Box–Cox fixture [1,2,4,10,30] selects about −.146859; the signed fixture [−3,−1,0,2,8] selects about .596210. These are small constructed fits, not ecology experiments. Same-λ comparison against the ordinary family and PowerTransformer verifies formulas, while attained likelihood and actual learned λ expose differences between bounded and library search. Do not assume every dataset's optima match. PowerTransformer standardizes by default; this code requests standardize=False for a clear family comparison. Work is O(n) per scalar objective evaluation, plus the search's evaluations. Domains, overflows and unsupported constant fits are refused. Better marginal shape does not guarantee jointly Gaussian features, correct regression residuals or better prediction.

### A fitted quantile map is not a new-batch rank

An illustrative rank map for sorted [1,2,3,4,100] uses `(rank−1)/4`, giving 0,.25,.5,.75,1. It forgets the large final numerical gap. That old illustration explains rank; it is not the exact fitted QuantileTransformer algorithm, particularly with ties and unseen values.

Switch to fitted value landmarks [1,2,2,4,100] and probabilities [0,.25,.5,.75,1]. Follow interpolation from a later value to its probability and, optionally, to a normal quantile.

<!-- Drawing D27: visual-specifications.md#d27; actual objects and quantitative companion specified in full. -->

At a repeated landmark 2, ascending interpolation picks one edge of the tie interval and descending interpolation the other. Averaging gives (.25+.5)/2=.375. At 3, the interval from the last 2 at .5 to 4 at .75 gives .625. Below the fitted extent maps to 0, above to 1. Changing a later batch cannot recompute these landmarks; 3 alone and 3 beside 10000 must get the same coordinate.

Uniform output uses u directly. Normal output uses Φ⁻¹(u), the number below which a standard normal distribution places probability u. At u=.375 and .625, coordinates are about −.318639 and .318639. Since Φ⁻¹(0/1) is infinite, our explicitly declared finite clipping epsilon is 10⁻⁷; endpoints are about ±5.199338. This is a coordinate convention, not evidence for a normal scientific data-generating process.

<!-- Investigation L9: visual-specifications.md#l9; immediate current result and direct-entity controls specified in full. -->

Change only the query, keeping landmarks visible. A query 1000 saturates at the upper endpoint. Many large values therefore merge. A duplicate 2 always receives the same tie result. Query edits never refit. Normal output changes numerical spacing again but preserves the declared ordering away from merged points.

The complete program saves column names, reference probabilities and fitted landmarks, skips NaNs during fit and preserves them in transformation. It implements both interpolation directions and the inverse's limited return to fitted value space. Exact inversion is impossible after saturation or merged ties. Its custom constant-column convention is 0 below c, .5 at c, 1 above c. Actual sklearn 1.9.1 maps the constant c itself to 0 in the checked uniform case, so the two policies are printed separately. Its normal endpoint source also uses 10⁻⁷ minus spacing(1) and a boundary tolerance; we compare supported interior values, not claim bit-level endpoint identity.

**fitted_quantile_maps.py — actual new checked process.**

```python
"""Fitted landmarks, bidirectional tie interpolation and explicit endpoints."""
from dataclasses import dataclass
import numpy as np
from scipy.special import ndtri, ndtr
from sklearn.preprocessing import QuantileTransformer
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Quantiles:
    names: tuple
    landmarks: np.ndarray
    references: np.ndarray


def fit_quantiles(X, names, n_landmarks=5):
    X = matrix(X)
    names = tuple(names)
    if len(names) != X.shape[1] or len(set(names)) != len(names):
        raise ValueError('distinct names matching width')
    if not isinstance(n_landmarks, int) or isinstance(n_landmarks, bool) or n_landmarks < 2:
        raise ValueError('at least two requested landmarks')
    if np.isnan(X).all(axis=0).any():
        raise ValueError('no observed value for quantile fit')
    references = np.linspace(0., 1., min(n_landmarks, len(X)))
    landmarks = np.nanquantile(X, references, axis=0, method='linear')
    return Quantiles(names, frozen(landmarks), frozen(references))


def apply(state, X, names, output='uniform', epsilon=1e-7, inverse=False):
    X = matrix(X, len(state.names))
    if tuple(names) != state.names or output not in ['uniform', 'normal'] or not 0 < epsilon < .5:
        raise ValueError('same schema, uniform/normal output and 0<epsilon<.5')
    result = X.copy()
    for j in range(X.shape[1]):
        finite = ~np.isnan(X[:, j])
        values = X[finite, j]
        q = state.landmarks[:, j]
        p = state.references
        if inverse:
            u = ndtr(values) if output == 'normal' else values
            result[finite, j] = np.interp(u, p, q)
            continue
        if q[0] == q[-1]:
            u = np.where(values < q[0], 0., np.where(values > q[0], 1., .5))
        else:
            u = .5*(np.interp(values, q, p)-np.interp(-values, -q[::-1], -p[::-1]))
            u[values <= q[0]] = 0.
            u[values >= q[-1]] = 1.
        result[finite, j] = ndtri(np.clip(u, epsilon, 1-epsilon)) if output == 'normal' else u
    return result


if __name__ == '__main__':
    X = np.array([[1.], [2.], [2.], [4.], [100.]])
    state = fit_quantiles(X, ['amount'])
    query = np.array([[0.], [1.], [2.], [3.], [1000.], [np.nan]])
    print('landmarks:', state.landmarks.ravel().tolist(), 'probabilities:', state.references.tolist())
    for distribution in ['uniform', 'normal']:
        got = apply(state, query, ['amount'], distribution)
        ordinary = QuantileTransformer(n_quantiles=5, subsample=None,
                                       output_distribution=distribution, random_state=20).fit(X)
        expected = ordinary.transform(query)
        # Interior comparisons are shared; custom normal clipping differs in
        # last digits from sklearn's 1e-7 minus spacing(1) endpoint convention.
        np.testing.assert_allclose(got[2:4], expected[2:4], atol=1e-12)
        print(distribution, np.round(got.ravel(), 6).tolist())
        print('ordinary:', np.round(expected.ravel(), 6).tolist())
    constant = fit_quantiles([[7.], [7.], [7.]], ['constant'], 3)
    print('custom constant:', apply(constant, [[6.], [7.], [8.]], ['constant']).ravel().tolist())
    ordinary = QuantileTransformer(n_quantiles=3, subsample=None).fit([[7.], [7.], [7.]])
    print('ordinary constant:', ordinary.transform([[6.], [7.], [8.]]).ravel().tolist())
    print('saturated inverse:', apply(state, [[1.]], ['amount'], inverse=True).ravel().tolist())
    assert apply(state, [[3.]], ['amount'])[0, 0] == apply(state, [[3.], [10000.]], ['amount'])[0, 0]
    assert state.landmarks[0, 0] == 1.
```

Whole recorded stdout (exact captured new stdout bytes):

```text
landmarks: [1.0, 2.0, 2.0, 4.0, 100.0] probabilities: [0.0, 0.25, 0.5, 0.75, 1.0]
uniform [0.0, 0.0, 0.375, 0.625, 1.0, nan]
ordinary: [0.0, 0.0, 0.375, 0.625, 1.0, nan]
normal [-5.199338, -5.199338, -0.318639, 0.318639, 5.199338, nan]
ordinary: [-5.199338, -5.199338, -0.318639, 0.318639, 5.199338, nan]
custom constant: [0.0, 0.5, 1.0]
ordinary constant: [0.0, 0.0, 1.0]
saturated inverse: [100.0]
```


QuantileTransformer(n_quantiles=5, subsample=None, random_state=20) makes the ordinary landmark choice explicit. Subsampling can change fitted landmarks, so it must be part of a reproducibility statement. Sorting costs O(dn log n), and interpolation about O(qd log k) for q queries and k landmarks. This nonlinear marginal map can alter correlations and remove useful magnitude. A pleasant histogram is not a sufficient selection criterion.

### Add boundaries and interactions deliberately

Bins replace a measurement by an interval. Look at actual training points and the fitted edges before inspecting the one-hot interval coordinate.

<!-- Drawing D28: visual-specifications.md#d28; actual objects and quantitative companion specified in full. -->

Uniform four-bin edges for [1,2,2,4,100] are [1,25.75,50.5,75.25,100]. Linear-quantile requested edges are [1,2,2,4,100]; merging duplicate edges leaves [1,2,4,100], only three effective bins. Equal requested counts do not guarantee equal populations when ties cannot be split by a value boundary. Our membership uses right insertion at an interior edge: x=2 enters the interval beginning at 2. Outside the fitted range stays in the first/last bin. A coordinate for a bin is not a continuous value within it; distinctions are intentionally lost.

K-means bins add a fitted-center mechanism. Assign each value to its nearest supplied center, update each nonempty cluster to its mean, repeat to a cap/tolerance, sort distinct final centers and form midpoint boundaries. The full local one-dimensional Lloyd loop declares earlier-center ties and retains an empty center. Invalid outer partitions from exceptional retained empty centers are refused. With [0,1,2,8,9,10] and initial centers [0,10], the first update gives [1,9], the next is unchanged, and the midpoint edge is 5. KMeans with an explicit (k,1) center array, n_init=1 and algorithm='lloyd' is the controlled comparator. KBinsDiscretizer(strategy='kmeans') is a separate route; it accepts neither init nor n_init and owns its own initialization. Stopping and empty-cluster rules can differ, so this supported match is not universal parity.

Polynomial features retain numbers and add products. Trace each exponent column from the constructed row (a,b)=(2,3).

<!-- Drawing D29: visual-specifications.md#d29; actual objects and quantitative companion specified in full. -->

Degree two with bias gives [1,a,b,a²,ab,b²]=[1,2,3,4,6,9]. The exponent rows are (0,0),(1,0),(0,1),(2,0),(1,1),(0,2). A coefficient multiplying ab makes one variable's influence depend on the other. A model is still linear **in its coefficients**, though nonlinear in original measurements. Interaction-only omits a²/b² and keeps [1,2,3,6]. Adding a bias feature beside a model intercept duplicates a constant column. With d variables, total-degree-p features including bias number C(d+p,p); width and conditioning can grow quickly. The complete implementation bounds degree/width before allocation and refuses overflowing products.

The following program separately owns fitted bins, Lloyd updates, monomial generation and the stateless cycle function used shortly. Keeping functions separate makes their different state contracts visible. Ordinary KBinsDiscretizer specifies quantile_method='linear' and subsample=None, avoiding the version 1.9 default percentile change. PolynomialFeatures exposes powers_ so output order is checked directly.

**bins_polynomials_cycles.py — actual new checked process.**

```python
"""Fitted bin edges, complete 1D Lloyd loop, monomials and cyclic pairs."""
from itertools import combinations_with_replacement, combinations
import math
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import KBinsDiscretizer, PolynomialFeatures, FunctionTransformer


def finite_vector(x):
    x = np.asarray(x, float)
    if x.ndim != 1 or not len(x) or not np.isfinite(x).all():
        raise ValueError('nonempty finite vector required')
    return x


def fit_bins(x, n_bins=3, strategy='uniform'):
    x = finite_vector(x)
    if not isinstance(n_bins, int) or isinstance(n_bins, bool) or n_bins < 2:
        raise ValueError('integer n_bins >= 2')
    if np.ptp(x) == 0:
        return np.array([x[0], x[0]])  # one effective constant bin
    if strategy == 'uniform':
        return np.linspace(x.min(), x.max(), n_bins+1)
    if strategy == 'quantile':
        return np.unique(np.quantile(x, np.linspace(0, 1, n_bins+1), method='linear'))
    raise ValueError('uniform or quantile strategy')


def membership(x, edges):
    x, edges = finite_vector(x), finite_vector(edges)
    if len(edges) < 2 or np.any(np.diff(edges) < 0):
        raise ValueError('ordered edges required')
    return np.searchsorted(edges[1:-1], x, side='right')


def lloyd_bins(x, centres, max_iter=50, tol=1e-10):
    x, centres = finite_vector(x), finite_vector(centres).copy()
    if np.any(np.diff(centres) <= 0) or not isinstance(max_iter, int) or max_iter < 1 or tol < 0 or not np.isfinite(tol):
        raise ValueError('distinct ordered centres, positive cap and finite tolerance')
    trace = []
    status = 'iteration cap'
    for turn in range(max_iter):
        # argmin selects the earlier supplied centre at an exact tie.
        assignment = np.argmin(abs(x[:, None]-centres), axis=1)
        updated = np.array([x[assignment == j].mean() if np.any(assignment == j) else centres[j]
                            for j in range(len(centres))])
        trace.append({'assignment': assignment.tolist(), 'centres': updated.tolist()})
        change = float(abs(updated-centres).max())
        centres = updated
        if change <= tol:
            status = 'absolute centre tolerance'
            break
    centres = np.unique(np.sort(centres))
    edges = np.r_[x.min(), (centres[:-1]+centres[1:])/2, x.max()]
    # Empty retained centres can lie outside the observation extent. Refuse an
    # invalid bin partition rather than silently relabel such an exceptional fit.
    if np.any(np.diff(edges) < 0):
        raise ValueError('empty-centre configuration produces invalid outer edges')
    return {'centres': centres, 'edges': edges, 'trace': trace, 'status': status}


def monomials(X, degree=2, interaction_only=False, include_bias=True, max_features=10000):
    X = np.asarray(X, float)
    if X.ndim != 2 or 0 in X.shape or not np.isfinite(X).all():
        raise ValueError('finite nonempty feature matrix')
    if not isinstance(degree, int) or isinstance(degree, bool) or degree < 0 or degree > 20:
        raise ValueError('bounded integer degree 0..20')
    d = X.shape[1]
    count = sum(math.comb(d, k) if interaction_only else math.comb(d+k-1, k)
                for k in range(0 if include_bias else 1, degree+1)
                if not interaction_only or k <= d)
    if count > max_features or count == 0:
        raise ValueError('output width outside allowed nonempty allocation')
    powers = []
    choose = combinations if interaction_only else combinations_with_replacement
    for k in range(0 if include_bias else 1, degree+1):
        for indices in choose(range(d), k):
            powers.append(np.bincount(indices, minlength=d))
    powers = np.array(powers, int)
    with np.errstate(over='raise', invalid='raise'):
        result = np.column_stack([np.prod(X**p, axis=1) for p in powers])
    return result, powers


def cycle(x, period=360.):
    x = finite_vector(x)
    if not np.isfinite(period) or period <= 0:
        raise ValueError('positive finite period')
    radians = 2*np.pi*np.remainder(x, period)/period
    return np.column_stack([np.cos(radians), np.sin(radians)])


if __name__ == '__main__':
    x = np.array([1., 2., 2., 4., 100.])
    for strategy in ['uniform', 'quantile']:
        edges = fit_bins(x, 4, strategy)
        q = np.array([-20., edges[1], 1000.])
        got = membership(q, edges)
        lib = KBinsDiscretizer(n_bins=4, strategy=strategy, encode='ordinal',
                              quantile_method='linear', subsample=None).fit(x[:, None])
        np.testing.assert_array_equal(got, lib.transform(q[:, None]).ravel())
        print(strategy, 'edges:', edges.tolist(), 'effective:', len(edges)-1, 'query:', got.tolist())
    data = np.array([0., 1., 2., 8., 9., 10.])
    fit = lloyd_bins(data, [0., 10.])
    lib = KMeans(n_clusters=2, init=np.array([[0.], [10.]]), n_init=1,
                 algorithm='lloyd', max_iter=50, tol=1e-10).fit(data[:, None])
    np.testing.assert_allclose(fit['centres'], np.sort(lib.cluster_centers_.ravel()))
    print('Lloyd:', fit['centres'].tolist(), fit['edges'].tolist(), fit['status'], fit['trace'])
    native = KBinsDiscretizer(n_bins=2, strategy='kmeans', encode='ordinal', subsample=None).fit(data[:, None])
    print('separate KBins kmeans edges:', native.bin_edges_[0].tolist())
    for interaction in [False, True]:
        got, powers = monomials([[2., 3.]], interaction_only=interaction)
        lib = PolynomialFeatures(degree=2, include_bias=True, interaction_only=interaction).fit([[2., 3.]])
        np.testing.assert_array_equal(powers, lib.powers_)
        np.testing.assert_array_equal(got, lib.transform([[2., 3.]]))
        print('polynomial interaction_only', interaction, got.tolist(), 'powers:', powers.tolist())
    angles = np.array([350., 10., 30., 150., 0., 360.])
    got = cycle(angles)
    ordinary = FunctionTransformer(lambda X: cycle(X[:, 0], 360.), validate=True)
    np.testing.assert_allclose(got, ordinary.transform(angles[:, None]))
    print('cycle coordinates:', np.round(got, 6).tolist(), 'seam chord:', round(np.linalg.norm(got[0]-got[1]), 6))
    np.testing.assert_allclose(got[-2], got[-1], atol=1e-14)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
uniform edges: [1.0, 25.75, 50.5, 75.25, 100.0] effective: 4 query: [0, 1, 3]
quantile edges: [1.0, 2.0, 4.0, 100.0] effective: 3 query: [0, 1, 2]
Lloyd: [1.0, 9.0] [0.0, 5.0, 10.0] absolute centre tolerance [{'assignment': [0, 0, 0, 1, 1, 1], 'centres': [1.0, 9.0]}, {'assignment': [0, 0, 0, 1, 1, 1], 'centres': [1.0, 9.0]}]
separate KBins kmeans edges: [0.0, 5.0, 10.0]
polynomial interaction_only False [[1.0, 2.0, 3.0, 4.0, 6.0, 9.0]] powers: [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2]]
polynomial interaction_only True [[1.0, 2.0, 3.0, 6.0]] powers: [[0, 0], [1, 0], [0, 1], [1, 1]]
cycle coordinates: [[0.984808, -0.173648], [0.984808, 0.173648], [0.866025, 0.5], [-0.866025, 0.5], [1.0, 0.0], [1.0, 0.0]] seam chord: 0.347296
```

Separate actual stderr diagnostic:

```text
C:\Personal Projects and files\Portfolio\Portfolio\scratch\lesson-tools\Lib\site-packages\sklearn\preprocessing\_discretization.py:385: UserWarning: Bins whose width are too small (i.e., <= 1e-8) in feature 0 are removed. Consider decreasing the number of bins.
  warnings.warn(
```


Inspect the retained warning about quantile bins too narrow to keep; it is the ordinary route documenting the merged-edge condition, not a failed calculation. Bin fitting uses O(n) reductions or sorting for quantiles; membership searches edges. Each Lloyd iteration compares n×k distances then reduces clusters, bounded by the recorded cap. Monomial evaluation costs proportional to output cells and exponent work; its combinatorial width is a modeling and storage choice. Capacity settings need training-only selection, not after-the-fact tuning on assessment outcomes.

### Draw the local basis before fitting a curve

A spline basis supplies local overlapping functions. Coefficients combine them into a curve; choosing the basis does not itself estimate those coefficients. Start with degree-zero interval indicators, then watch adjacent pieces combine at degree one.

<!-- Drawing D30: visual-specifications.md#d30; actual objects and quantitative companion specified in full. -->

For full nondecreasing knots t₀,…,tₖ, define Bᵢ,0(x)=1 on [tᵢ,tᵢ₊₁), 0 otherwise. A higher-degree basis is

\[
B_{i,p}(x)=\frac{x-t_i}{t_{i+p}-t_i}B_{i,p-1}(x)
 +\frac{t_{i+p+1}-x}{t_{i+p+1}-t_{i+1}}B_{i+1,p-1}(x).
\]

A zero-width denominator contributes zero. This recurrence blends neighboring supported pieces; outside a piece's knot support its contribution is zero. Degree one makes triangles, degree two smoother pieces. For degree one and extended knots [−1,0,1,2,3], the supported base interval is [0,2]. At x=.5, the row is [.5,.5,0]; at x=2, [0,0,1]. Given coefficients [2,4,1], the first prediction is .5×2+.5×4=3 and the endpoint prediction 1. Nonnegative basis rows sum to one inside the supported interval, so a constant coefficient vector produces a constant function. Only nearby bases are active: this gives the design matrix its banded pattern and lets a coefficient change affect a local part of the curve.

The base knots [0,1,2] differ from the extended full knot vector. Our saved state extends each end by degree times the adjacent spacing, matching the inspected ordinary nonperiodic convention. A right endpoint uses its interior limiting value; the linear extrapolation derivative there is the **left** derivative. For degree one, using the outside derivative would choose the wrong piece at a knot. Constant extrapolation uses the nearest boundary basis row; error policy refuses outside values; linear policy continues with that interior derivative. Beyond the fitted interval, linearly extrapolated basis entries can be negative, so interior nonnegativity should not be advertised there.

**local_spline_basis.py — actual new checked process.**

```python
"""Cox-de Boor recurrence with explicit extended knots and saved boundaries."""
from dataclasses import dataclass
import numpy as np
from scipy.interpolate import BSpline
from sklearn.preprocessing import SplineTransformer
from fitted_rulers import frozen


def recurrence(x, knots, degree):
    x = np.asarray(x, float).reshape(-1)
    t = np.asarray(knots, float)
    if t.ndim != 1 or not np.isfinite(t).all() or np.any(np.diff(t) < 0):
        raise ValueError('finite nondecreasing full knots')
    if not isinstance(degree, int) or degree < 0 or len(t) < 2*degree+2 or not np.isfinite(x).all():
        raise ValueError('valid degree, sufficient knots, finite queries')
    basis = ((x[:, None] >= t[:-1]) & (x[:, None] < t[1:])).astype(float)
    # Closed supported right endpoint: evaluate the left limit there. This is
    # needed only when that boundary is the last full knot (degree zero).
    right = t[-degree-1]
    if degree == 0:
        basis[x == right, -1] = 1.
    for p in range(1, degree+1):
        next_basis = np.zeros((len(x), len(t)-p-1))
        for i in range(next_basis.shape[1]):
            left_width = t[i+p]-t[i]
            right_width = t[i+p+1]-t[i+1]
            if left_width != 0:
                next_basis[:, i] += (x-t[i])/left_width*basis[:, i]
            if right_width != 0:
                next_basis[:, i] += (t[i+p+1]-x)/right_width*basis[:, i+1]
        basis = next_basis
    return basis


@dataclass(frozen=True)
class Splines:
    base: np.ndarray
    full: np.ndarray
    degree: int
    extrapolation: str


def fit_splines(training, n_knots=3, degree=1, base=None, extrapolation='constant'):
    x = np.asarray(training, float).reshape(-1)
    if not len(x) or not np.isfinite(x).all() or not isinstance(degree, int) or degree < 0 or degree > 5:
        raise ValueError('finite training values and bounded degree 0..5')
    if extrapolation not in ['constant', 'error', 'linear'] or (degree == 0 and extrapolation == 'linear'):
        raise ValueError('constant/error; linear requires positive degree')
    if base is None:
        if not isinstance(n_knots, int) or n_knots < 2 or np.ptp(x) == 0:
            raise ValueError('nonconstant fit and at least two base knots')
        base = np.linspace(x.min(), x.max(), n_knots)
    base = np.asarray(base, float)
    if base.ndim != 1 or len(base) < 2 or not np.isfinite(base).all() or np.any(np.diff(base) <= 0):
        raise ValueError('strictly increasing finite base knots')
    full = np.r_[base[0]-(base[1]-base[0])*np.arange(degree, 0, -1), base,
                 base[-1]+(base[-1]-base[-2])*np.arange(1, degree+1)]
    return Splines(frozen(base), frozen(full), degree, extrapolation)


def derivative_at(state, x):
    p, t = state.degree, state.full
    # At the right base boundary use the interior (left) derivative; degree1
    # has a derivative jump at that knot and a right interval is another piece.
    inside = np.nextafter(x, -np.inf) if x == state.base[-1] else x
    lower = recurrence([inside], t, p-1)[0]
    values = np.zeros(len(t)-p-1)
    for i in range(len(values)):
        if t[i+p] != t[i]:
            values[i] += p*lower[i]/(t[i+p]-t[i])
        if t[i+p+1] != t[i+1]:
            values[i] -= p*lower[i+1]/(t[i+p+1]-t[i+1])
    return values


def design(state, x):
    x = np.asarray(x, float).reshape(-1)
    if not np.isfinite(x).all():
        raise ValueError('missing/nonfinite input is not a spline zero')
    lo, hi = state.base[[0, -1]]
    outside = (x < lo) | (x > hi)
    if outside.any() and state.extrapolation == 'error':
        raise ValueError('outside fitted base interval')
    clipped = np.clip(x, lo, hi)
    result = recurrence(clipped, state.full, state.degree)
    if state.extrapolation == 'linear':
        for end, mask in [(lo, x < lo), (hi, x > hi)]:
            result[mask] += (x[mask]-end)[:, None]*derivative_at(state, end)
    return result


if __name__ == '__main__':
    for degree in [0, 1, 2]:
        for policy in ['constant', 'error']+(['linear'] if degree else []):
            state = fit_splines([0., 1., 2.], degree=degree, base=[0., 1., 2.], extrapolation=policy)
            query = np.array([0., .5, 1., 2.]) if policy == 'error' else np.array([-.5, 0., .5, 1., 2., 2.5])
            got = design(state, query)
            ordinary = SplineTransformer(knots=np.array([[0.], [1.], [2.]]), degree=degree,
                                         include_bias=True, extrapolation=policy, handle_missing='error').fit([[0.], [1.], [2.]])
            interior = (query >= 0) & (query <= 2)
            # sklearn 1.9.1 degree-zero constant extrapolation raises a shape
            # error outside its base interval. Preserve that observed failure in
            # the author receipt; compare its supported interior only here.
            compared = interior if degree == 0 else np.ones(len(query), bool)
            np.testing.assert_allclose(got[compared], ordinary.transform(query[compared, None]), atol=1e-12)
            scipy_basis = BSpline(state.full, np.eye(len(state.full)-degree-1), degree)(query[interior])
            np.testing.assert_allclose(got[interior], scipy_basis, atol=1e-12)
            np.testing.assert_allclose(got.sum(axis=1), 1., atol=1e-12)
            print('degree/policy', degree, policy, 'full knots:', state.full.tolist(),
                  'rows:', np.round(got, 6).tolist())
    state = fit_splines([0., 1., 2.], degree=1)
    row = design(state, [.5, 2.])
    print('given coefficient sum:', (row @ np.array([2., 4., 1.])).tolist())
    try:
        design(fit_splines([0., 2.], extrapolation='error'), [3.])
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
degree/policy 0 constant full knots: [0.0, 1.0, 2.0] rows: [[1.0, 0.0], [1.0, 0.0], [1.0, 0.0], [0.0, 1.0], [0.0, 1.0], [0.0, 1.0]]
degree/policy 0 error full knots: [0.0, 1.0, 2.0] rows: [[1.0, 0.0], [1.0, 0.0], [0.0, 1.0], [0.0, 1.0]]
degree/policy 1 constant full knots: [-1.0, 0.0, 1.0, 2.0, 3.0] rows: [[1.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]]
degree/policy 1 error full knots: [-1.0, 0.0, 1.0, 2.0, 3.0] rows: [[1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
degree/policy 1 linear full knots: [-1.0, 0.0, 1.0, 2.0, 3.0] rows: [[1.5, -0.5, 0.0], [1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [0.0, -0.5, 1.5]]
degree/policy 2 constant full knots: [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0] rows: [[0.5, 0.5, 0.0, 0.0], [0.5, 0.5, 0.0, 0.0], [0.125, 0.75, 0.125, 0.0], [0.0, 0.5, 0.5, 0.0], [0.0, 0.0, 0.5, 0.5], [0.0, 0.0, 0.5, 0.5]]
degree/policy 2 error full knots: [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0] rows: [[0.5, 0.5, 0.0, 0.0], [0.125, 0.75, 0.125, 0.0], [0.0, 0.5, 0.5, 0.0], [0.0, 0.0, 0.5, 0.5]]
degree/policy 2 linear full knots: [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0] rows: [[1.0, 0.0, 0.0, 0.0], [0.5, 0.5, 0.0, 0.0], [0.125, 0.75, 0.125, 0.0], [0.0, 0.5, 0.5, 0.0], [0.0, 0.0, 0.5, 0.5], [0.0, -0.0, 0.0, 1.0]]
given coefficient sum: [3.0, 1.0]
refused: outside fitted base interval
```


The program implements the complete recurrence, knot fitting/extension, basis design, derivative and saved extrapolation policy. NumPy provides arrays; SciPy BSpline independently compares supported rows; SplineTransformer supplies the ordinary preprocessing route with explicit knots, include_bias=True and handle_missing='error'. sklearn 1.9.1 raised a shape error for degree-zero constant extrapolation outside its interval in the first author check. The final comparison therefore checks degree-zero **interior** values, custom constant outside values separately, and degree-one/two outside policies. The failed source/streams remain in author evidence. A later repair fixed the custom right-boundary derivative before the final checked source. These are scoped findings, not a reason to assert all library splines are unreliable.

Natural cubic splines impose a different boundary constraint; they are not the same as this B-spline feature API. Full basis rows already sum to one, so another intercept can create rank dependence. Dropping a basis column is a parameterization choice. The transparent recurrence uses O(qpK) work and O(qK) workspace for q values, degree p and K intermediate bases; optimized routines exploit local support. It intentionally delegates no owned recurrence to the ordinary estimator. Missing input is refused rather than equated with the all-zero feature vector.

### Close a genuine cycle's seam

A direction wraps after a full turn; elapsed duration does not. Draw both coordinates of the unit circle so the seam has a geometric meaning.

<!-- Drawing D31: visual-specifications.md#d31; actual objects and quantitative companion specified in full. -->

For period P, encode t as [cos(2πt/P),sin(2πt/P)]. NumPy expects radians; P=360 converts degrees. Angles 350° and 10° become approximately [.984808,−.173648] and [.984808,.173648], chord distance 2sin10°≈.347296. The raw 340-degree difference was a coordinate seam. Zero and 360 coincide by design. Sine alone merges 30° and 150° at .5; cosine distinguishes +.866025 from −.866025. P10 provides the full function and FunctionTransformer comparison.

<!-- Investigation L10: visual-specifications.md#l10; immediate current result and direct-entity controls specified in full. -->

Move either angle and inspect both projections and chord. Try 1/359, opposite points, and the sine-only collision. Equal physical axis scales keep a circle circular. The map deliberately forgets completed cycles: that suits time of day or direction if the task is periodic, but it is wrong for elapsed hours when days of duration matter. Preserve a noncyclic magnitude coordinate when it carries required information.

<a id="8-deeper-branch-high-cardinality-categories-and-target-information"></a>
## 8. Deeper branch: high-cardinality categories and target information

### Shrink noisy category estimates

One-hot width may grow large for many products or devices. A target encoding replaces a category by an estimate of its target behavior. For category c with n_c permitted donor targets and sum s_c, prior mean μ and smoothing α≥0, use `t_c=(s_c+αμ)/(n_c+α)` when n_c>0. For no donors use μ, including α=0; this explicit fallback avoids 0/0.

Draw the actual target cells contributing to the category average, then their weights on a scalar segment toward the prior.

<!-- Drawing D32: visual-specifications.md#d32; actual objects and quantitative companion specified in full. -->

For one positive target, μ=.5 and α=2, t=(1+1)/3=2/3. Write it as `(n/(n+α)) category_mean + (α/(n+α)) μ`. The singleton receives weight 1/3; a category with 100 positives receives 100/102 and a result 101/102≈.990196. More support reduces the pull to the prior. At α=0 a supported category uses its own donor mean; large α approaches μ.

<!-- Investigation L11a: visual-specifications.md#l11a; immediate current result and direct-entity controls specified in full. -->

Change α while inspecting a singleton or the 100-row support fixture. Start at 2/3. The target counts and both weights remain visible. An absent category uses the prior. Shrinkage addresses unstable estimates, but it does **not** prevent a training row's answer from entering its own feature. These are different problems.

### Remove the row's fold from every target path

Without separation, an unsmoothed singleton encodes its own target exactly. Even with smoothing, its answer enters the numerator and often the prior. A downstream model can then learn an answer-containing input it will not have for a genuinely new row.

Switch to the retained constructed six rows. Follow all target-to-prior edges, not only the matching-category edge.

<!-- Drawing D33: visual-specifications.md#d33; actual objects and quantitative companion specified in full. -->

| Row | Category | Target | Fold | OOF value, α=2 |
| --- | --- | ---: | ---: | ---: |
| 0 | A | 1 | 0 | 5/9 |
| 1 | A | 1 | 1 | 7/9 |
| 2 | B | 0 | 0 | 2/9 |
| 3 | B | 0 | 1 | 4/9 |
| 4 | C | 1 | 0 | 2/9 |
| 5 | C | 0 | 1 | 7/9 |

For held fold 0, donors are rows 1,3,5 with targets [1,0,0], giving μ=1/3. Row 0's A numerator uses target 1 from row 1 and 2μ=2/3; divide by 1+2 to get 5/9. For fold 1, donors 0,2,4 give μ=2/3, hence row 1 gets 7/9. All donor targets enter the prior, even categories that do not match. Computing a global μ before splitting would leave a leakage path around the category exclusion.

Change row 0's own target 1→0. Fold-0 encodings stay unchanged. Fold-1 values become [2/9,2/9,5/9]; B changed even though no B target changed, through μ. The exact retained historical program below computes this default α=2 example and its recorded stdout. It remains unchanged and was not replayed here. Its minimal callable is not a robust arbitrary-input API: α=0 with no matching-category donors can divide by zero, and empty donor sets are not validated. The new P9 below is the separately named supported successor.

**cross_fit.py — historical retained native receipt.**

```python
import numpy as np

def cross_fit(categories, target, folds, smoothing=2.0):
    encoded = np.empty(len(target), dtype=float)
    for held_fold in np.unique(folds):
        donors = folds != held_fold
        prior = target[donors].mean()
        for row in np.flatnonzero(~donors):
            matching = donors & (categories == categories[row])
            encoded[row] = (
                target[matching].sum() + smoothing * prior
            ) / (matching.sum() + smoothing)
    return encoded

categories = np.array(["A", "A", "B", "B", "C", "C"])
target = np.array([1., 1., 0., 0., 1., 0.])
folds = np.array([0, 1, 0, 1, 0, 1])
print(np.round(cross_fit(categories, target, folds), 6))
changed = target.copy()
changed[0] = 0.
print(np.round(cross_fit(categories, changed, folds), 6))
```

Whole recorded stdout (exact historical stdout literal):

```text
[0.555556 0.777778 0.222222 0.444444 0.222222 0.777778]
[0.555556 0.222222 0.222222 0.222222 0.222222 0.555556]
```


`donors = folds != held_fold` creates the permitted set. The prior is recomputed inside that loop; the inner category mask narrows those same donors. Reusing a target mean from all rows would change the dependency, even if many values looked similar on a small example. The printed null for row 0 tests exclusion, not absence of all statistical dependence between training features and other rows' targets.

<!-- Investigation L11b: visual-specifications.md#l11b; immediate current result and direct-entity controls specified in full. -->

Edit one category/target/fold cell and choose an inspected row with α fixed at 2. Begin at row 0=5/9. Flip row 3's target: row 0 becomes 7/9 via the prior while row 3's own encoding remains 4/9. Flip the inspected row's own target and inspect its null. The dependency arrows, donor IDs, numerator, prior and full output array must stay synchronized. Emptying a donor fold is an error, not a displayed NaN mislabeled as a valid encoding.

### Training and inference are intentionally different

OOF means out-of-fold: each training row's feature uses a permitted other-row fit. For a later external row, use a map fitted on the **whole outer training set**, because those targets are then available. Draw the two states and their row coverage side by side.

<!-- Drawing D34: visual-specifications.md#d34; actual objects and quantitative companion specified in full. -->

With α=2 and the whole six-row training prior .5, full-fit A codes are .75, B .25, C .5; without smoothing (α=0), A=1, B=0, C=.5. These are different from the OOF values by design. The downstream model trains on OOF features, then sees full-fit encodings for later inference. The outer assessment targets enter neither state. TargetEncoder.fit_transform implements internal cross-fitting; fit(...).transform(...) does not produce those training OOF values. Explicit target_type='continuous' prevents integer-valued regression targets being inferred as multiclass; actual multiclass encoding expands columns for classes and is a separate shape contract.

The robust successor accepts explicit index pairs, validates nonempty disjoint donors, forbids repeated validation coverage and reports row coverage. It rebuilds sums **and priors** within every split. Group validation checks no group ID appears on both sides. Past-only validation requires max donor time < min held time. This is a local information contract; it does not select a scientifically appropriate outer split automatically.

**fitted_target_encoding.py — actual new checked process.**

```python
"""Full-fit inference state, full-coverage OOF and past-only aligned subsets."""
from dataclasses import dataclass
import numpy as np
from sklearn.preprocessing import TargetEncoder
from sklearn.model_selection import GroupKFold, TimeSeriesSplit
from category_policies import labels


def data(categories, target):
    c = np.array(labels(categories))
    y = np.asarray(target, float)
    if y.ndim != 1 or len(y) != len(c) or not len(y) or not np.isfinite(y).all():
        raise ValueError('nonempty labels and one finite target per row')
    return c, y


@dataclass(frozen=True)
class TargetState:
    aggregates: tuple
    prior: float
    alpha: float


def fit_target(categories, target, alpha=2.):
    c, y = data(categories, target)
    if not np.isfinite(alpha) or alpha < 0:
        raise ValueError('nonnegative finite smoothing')
    # labels() reserves @; internal labels must not pass through it again.
    aggregates = tuple((value, int(np.sum(c == value)), float(y[c == value].sum()))
                       for value in np.unique(c))
    return TargetState(aggregates, float(y.mean()), float(alpha))


def transform_target(state, categories):
    lookup = {c: (n, total) for c, n, total in state.aggregates}
    result = []
    for c in labels(categories):
        n, total = lookup.get(c, (0, 0.))
        result.append(state.prior if n == 0 else (total+state.alpha*state.prior)/(n+state.alpha))
    return np.array(result)


def index_array(values, n):
    result = np.asarray(values)
    if result.ndim != 1 or result.dtype.kind not in 'iu' or len(np.unique(result)) != len(result):
        raise ValueError('distinct integer row indices')
    if np.any(result < 0) or np.any(result >= n):
        raise ValueError('index outside data')
    return result.astype(int)


def cross_encode(categories, target, splits, alpha=2., groups=None, times=None,
                 require_full=True):
    # Keep raw values so reserved internal missing markers are never revalidated
    # as real labels when selecting donor subsets.
    c = list(categories)
    _, y = data(c, target)
    n = len(y)
    groups = None if groups is None else np.asarray(groups)
    times = None if times is None else np.asarray(times, float)
    if groups is not None and groups.shape != (n,):
        raise ValueError('one group per row')
    if times is not None and (times.shape != (n,) or not np.isfinite(times).all()):
        raise ValueError('one finite time per row')
    output = np.full(n, np.nan)
    coverage = np.zeros(n, int)
    trace = []
    for train, valid in splits:
        train, valid = index_array(train, n), index_array(valid, n)
        if len(train) == 0 or len(valid) == 0 or np.intersect1d(train, valid).size:
            raise ValueError('nonempty disjoint fitting/validation sets')
        if groups is not None and np.intersect1d(groups[train], groups[valid]).size:
            raise ValueError('same group appears on both sides')
        if times is not None and np.max(times[train]) >= np.min(times[valid]):
            raise ValueError('chronological donors must be strictly earlier')
        if np.any(coverage[valid]):
            raise ValueError('validation row occurs more than once')
        state = fit_target([c[i] for i in train], y[train], alpha)
        output[valid] = transform_target(state, [c[i] for i in valid])
        coverage[valid] += 1
        trace.append({'train': train.tolist(), 'valid': valid.tolist(), 'prior': state.prior})
    if require_full and np.any(coverage != 1):
        raise ValueError('full OOF contract requires each row exactly once')
    retained = np.flatnonzero(coverage == 1)
    return {'encoded': output[retained], 'rows': retained, 'target': y[retained],
            'coverage': coverage, 'trace': trace,
            'inference_state': fit_target(c, y, alpha)}


if __name__ == '__main__':
    c = ['A', 'A', 'B', 'B', 'C', 'C']
    y = np.array([1., 1., 0., 0., 1., 0.])
    folds = np.array([0, 1, 0, 1, 0, 1])
    splits = [(np.flatnonzero(folds != f), np.flatnonzero(folds == f)) for f in [0, 1]]
    result = cross_encode(c, y, splits)
    ordinary = TargetEncoder(target_type='continuous', smooth=2., cv=splits)
    library = ordinary.fit_transform(np.array(c)[:, None], y).ravel()
    np.testing.assert_allclose(result['encoded'], library)
    print('OOF:', np.round(result['encoded'], 6).tolist())
    print('full-fit:', np.round(transform_target(result['inference_state'], c), 6).tolist())
    changed = y.copy()
    changed[0] = 0.
    edited = cross_encode(c, changed, splits)['encoded']
    assert edited[0] == result['encoded'][0]
    print('own target edit:', np.round(edited, 6).tolist())
    print('alpha0 unseen:', transform_target(fit_target(['a'], [1.], 0), ['new', None]).tolist())
    groups = np.repeat([0, 1, 2], 2)
    grouped = list(GroupKFold(n_splits=3).split(np.zeros((6, 1)), y, groups))
    print('group OOF:', np.round(cross_encode(c, y, grouped, groups=groups)['encoded'], 6).tolist())
    chronological = list(TimeSeriesSplit(n_splits=2, test_size=2).split(np.zeros((6, 1))))
    past = cross_encode(c, y, chronological, times=np.arange(6), require_full=False)
    print('time retained rows/targets:', past['rows'].tolist(), past['target'].tolist())
    print('time encodings:', np.round(past['encoded'], 6).tolist(), 'coverage:', past['coverage'].tolist())
    manual = []
    for train, valid in chronological:
        enc = TargetEncoder(target_type='continuous', smooth=2.)
        enc.fit(np.array(c)[train, None], y[train])
        manual.extend(enc.transform(np.array(c)[valid, None]).ravel())
    np.testing.assert_allclose(past['encoded'], manual)
    for bad in [lambda: cross_encode(c, y, chronological),
                lambda: cross_encode(c, y, splits+splits),
                lambda: cross_encode(c, y, splits, groups=groups),
                lambda: fit_target([], [], 0.)]:
        try:
            bad()
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
OOF: [0.555556, 0.777778, 0.222222, 0.444444, 0.222222, 0.777778]
full-fit: [0.75, 0.75, 0.25, 0.25, 0.5, 0.5]
own target edit: [0.555556, 0.222222, 0.222222, 0.222222, 0.222222, 0.555556]
alpha0 unseen: [1.0, 1.0]
group OOF: [0.25, 0.25, 0.75, 0.75, 0.5, 0.5]
time retained rows/targets: [2, 3, 4, 5] [0.0, 0.0, 1.0, 0.0]
time encodings: [1.0, 1.0, 0.5, 0.5] coverage: [0, 0, 1, 1, 1, 1]
refused: full OOF contract requires each row exactly once
refused: validation row occurs more than once
refused: same group appears on both sides
refused: nonempty labels and one finite target per row
```


The ordinary same-fold comparison uses TargetEncoder(smooth=2, target_type='continuous', cv=splits). sklearn 1.9.1 requires every training row in validation exactly once for that internal cv API. Ordinary expanding TimeSeriesSplit leaves the earliest warm-up observations unvalidated; passing it as though it were a full-coverage drop-in is invalid. The chronological path here instead fits an ordinary encoder manually in each past-only window, transforms that window's future rows, and returns only the aligned retained row indices, features **and targets**. For this six-row example, rows [2,3,4,5] remain, targets [0,0,1,0], codes [1,1,.5,.5]; coverage [0,0,1,1,1,1] exposes the warm-up gap. There is no encoded placeholder trained on future targets.

Groups and time answer different dependence questions. Group-disjoint random folds can use later times; past-only windows can include repeated subjects. If the application needs both restrictions, each permitted donor pair must satisfy both, possibly reducing support substantially. A time/group rule cannot be inferred from a category string alone. This reference builds explicit maps in O(Kn) aggregation work for K folds; an optimized subtraction implementation must preserve all donor restrictions, including priors. Full-fit inference state is immutable. Reserved string markers remain validated, missing is one category, and unseen values use the fitted prior even at α=0.

### A fixed-width sparse map trades state for collisions

Hashing avoids fitting a vocabulary: a deterministic map assigns a token to a bucket and optionally a sign, then sums signed counts. Inspect every contribution for a deliberately constructed map, separate from the ordinary library's mapping.

<!-- Drawing D35: visual-specifications.md#d35; actual objects and quantitative companion specified in full. -->

Let apple→(bucket0,+1), pear→(bucket0,−1), banana→(bucket1,+1). Counts apple3,pear1,banana2 give bucket0=3−1=2 and bucket1=2. This is sparse linear accumulation, not merely setting a binary membership flag. Opposite signs can cancel.

Now pass two different bags through that same map.

<!-- Drawing D36: visual-specifications.md#d36; actual objects and quantitative companion specified in full. -->

Bag {apple:3,pear:1,banana:2} and bag {apple:2,banana:2} both give [2,2]. The original vocabulary/counts cannot be recovered from this representation alone. Increasing width changes collision pressure and model size; it does not remove the need to inspect what information the task can tolerate losing. Random signed maps have inner-product expectation results under their stated assumptions. A single small map does not prove that theorem, and signs do not eliminate every collision.

<!-- Investigation L12: visual-specifications.md#l12; immediate current result and direct-entity controls specified in full. -->

Edit one token count or its constructed bucket/sign, keeping signed contributions and sparse bucket sums visible. Begin with the [2,2] collision; give apple and pear equal counts to see cancellation. Editing a zero-count token's map has no effect. A supplied-map unknown token is an explicit missing mapping error. The ordinary FeatureHasher panel uses separately observed mappings; it must not pretend this hand-designed apple/pear map is MurmurHash3.

**signed_feature_hashing.py — actual new checked process.**

```python
"""Sparse signed accumulation; constructed and real hash maps kept distinct."""
import hashlib
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.feature_extraction import FeatureHasher


def deterministic_map(token, width):
    # An explicitly named SHA-256 adapter, not sklearn's MurmurHash3.
    raw = hashlib.sha256(token.encode('utf-8')).digest()
    return int.from_bytes(raw[:8], 'big') % width, (1 if raw[8] % 2 == 0 else -1)


def signed_hash(bags, width, supplied=None):
    if not isinstance(width, int) or isinstance(width, bool) or width < 1:
        raise ValueError('positive integer width')
    row_ids, col_ids, values, detail = [], [], [], []
    for i, bag in enumerate(bags):
        sums = {}
        for token, count in bag.items():
            if not isinstance(token, str) or not np.isfinite(count):
                raise ValueError('string names and finite counts')
            if supplied is not None and token not in supplied:
                raise ValueError('supplied map lacks token '+token)
            bucket, sign = supplied[token] if supplied is not None else deterministic_map(token, width)
            if not isinstance(bucket, int) or isinstance(bucket, bool) or not 0 <= bucket < width or sign not in [-1, 1]:
                raise ValueError('integer bucket in range and sign +/-1')
            sums[bucket] = sums.get(bucket, 0.)+sign*count
            detail.append((i, token, bucket, sign, float(count), float(sign*count)))
        for bucket, value in sorted(sums.items()):
            if not np.isfinite(value):
                raise ValueError('bucket accumulation overflow')
            if value != 0:
                row_ids.append(i)
                col_ids.append(bucket)
                values.append(value)
    return csr_matrix((values, (row_ids, col_ids)), shape=(len(bags), width)), detail


if __name__ == '__main__':
    mapping = {'apple': (0, 1), 'pear': (0, -1), 'banana': (1, 1)}
    bags = [{'apple': 3, 'pear': 1, 'banana': 2}, {'apple': 2, 'banana': 2}]
    got, detail = signed_hash(bags, 2, mapping)
    print('constructed contributions:', detail)
    print('constructed collision:', got.toarray().tolist())
    np.testing.assert_array_equal(got.toarray(), [[2., 2.], [2., 2.]])
    print('cancellation nnz:', signed_hash([{'apple': 1, 'pear': 1}], 2, mapping)[0].nnz)
    print('SHA adapter:', signed_hash(bags, 4)[0].toarray().tolist())
    ordinary = FeatureHasher(n_features=4, input_type='dict', alternate_sign=True)
    actual = ordinary.transform(bags)
    print('ordinary FeatureHasher:', actual.toarray().tolist())
    print('ordinary token map:', {token: ordinary.transform([{token: 1}]).toarray().ravel().tolist() for token in mapping})
    np.testing.assert_array_equal(actual.toarray(), ordinary.transform(bags).toarray())
    try:
        signed_hash([{'unknown': 1}], 2, mapping)
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
constructed contributions: [(0, 'apple', 0, 1, 3.0, 3.0), (0, 'pear', 0, -1, 1.0, -1.0), (0, 'banana', 1, 1, 2.0, 2.0), (1, 'apple', 0, 1, 2.0, 2.0), (1, 'banana', 1, 1, 2.0, 2.0)]
constructed collision: [[2.0, 2.0], [2.0, 2.0]]
cancellation nnz: 0
SHA adapter: [[-1.0, 1.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]]
ordinary FeatureHasher: [[3.0, -2.0, 0.0, -1.0], [2.0, -2.0, 0.0, 0.0]]
ordinary token map: {'apple': [1.0, 0.0, 0.0, 0.0], 'pear': [0.0, 0.0, 0.0, -1.0], 'banana': [0.0, -1.0, 0.0, 0.0]}
refused: supplied map lacks token unknown
```


The scratch accumulator stores only touched nonzero buckets and refuses nonfinite counts, invalid signs or out-of-range buckets. Its arbitrary-string adapter explicitly uses SHA-256 bytes; the ordinary FeatureHasher uses its own mapping, whose actual single-token sparse vectors are printed. There is no fitted target information or learned vocabulary in either hashing operation. Work is O(number of input nonzeros), with sorting of touched buckets for deterministic output ordering in this reference. Output width still determines the downstream parameter/storage requirement. No speed benchmark is inferred from sparse code.

<a id="9-deeper-branch-completing-data-versus-representing-uncertainty"></a>
## 9. Deeper branch: completing data versus representing uncertainty

### Fit conditional relationships one column at a time

The earlier length-to-mass example described one turn. Now build the complete cycle on a constructed incomplete two-column table. Keep the original mask beside its initialized copy.

<!-- Drawing D37: visual-specifications.md#d37; actual objects and quantitative companion specified in full. -->

Use rows [1,2], [2,4], [3,NA], [NA,8], [5,10]. Column medians initialize missing entries to 3 and 6, giving [3,6] for row 2 and [3,8] for row 3. Observed cells remain measurements; initialized cells retain their missing marker. Select column a as the first conditional target. Only rows 0,1,2,4 observed a; their b predictors include the current estimated 6 in row 2. The absence of a target, not the presence of complete predictors, decides which rows may fit this conditional regression.

Draw the actual design, target, coefficients and product for this turn before advancing to b.

<!-- Drawing D38: visual-specifications.md#d38; actual objects and quantitative companion specified in full. -->

For a from b, the first predictor column is [2,4,6,10], targets [1,2,3,5]. Fit `Σ(y−intercept−Aβ)²+α||β||²` with α=1 and an unpenalized intercept. Center A and y, append √α times the identity below centered A and zeros below centered y, then solve least squares. This augmented system minimizes the same ridge objective without explicitly forming an inverse. Restore intercept=ymean−Amean·β. The coefficient is about .4861111111 and intercept .0763888889, so missing row-3 a at b=8 becomes 3.9652777778.

Now fit b using its observed-target rows 0,1,3,4. Their a predictor values are [1,2,3.9652777778,5], including the **newly updated** a. The coefficient is about 1.8232290981 and intercept .5461393472, so missing row-2 b at a=3 becomes 6.0158266415. Feeding stale initialized a=3 into this second regression would fit a different model. Conditional cycling deliberately reuses current estimates, unlike P5's original-query distance rule.

After a sweep, repeat the ordered column loop. Stop at a declared tolerance or cap. Our tolerance compares the maximum row sum of absolute changes with tol times the largest absolute observed input, matching the configured ordinary criterion. A cap is not convergence. The three-sweep fixture ends at a cap with last change about .00013875; the ordinary warning is printed rather than suppressed as success.

Draw the ordered fitted models that a new row will actually use.

<!-- Drawing D39: visual-specifications.md#d39; actual objects and quantitative companion specified in full. -->

Save each conditional model's target index, other-feature indices, coefficient and intercept **in order for every turn**. A later row starts from the training medians, keeps its own original missing mask, then applies that saved sequence only to its missing cells. It does not fit regressions on the query. Observed values are preserved even if a conditional predictor would suggest another number. Repeated deterministic transformation gives the same result. A row with all inputs missing is numerically transformable under the saved model but supported only by its assumptions and initial training summaries; do not call it rich new evidence.

<!-- Investigation L13: visual-specifications.md#l13; immediate current result and direct-entity controls specified in full. -->

Inspect the initialized state and the first turn immediately. Change one missing input cell and step through the recomputed bounded trace. Keep observed-target row sets, current predictors and updated cells visible. The sweep inspector changes the viewed algorithm state, not permission to reveal an answer. A new-row panel applies the saved sequence without a backwards fitting edge. Unsupported all-missing training columns refuse a conditional fit.

**conditional_iterative_completion.py — actual new checked process.**

```python
"""Deterministic conditional ridge cycles and saved inference sequence.

The intercept is unpenalized. Solve an augmented least-squares system rather
than forming an inverse of X.T@X. Observed input cells never change.
"""
from dataclasses import dataclass
import warnings
import numpy as np
from sklearn.experimental import enable_iterative_imputer  # noqa: F401
from sklearn.impute import IterativeImputer
from sklearn.linear_model import Ridge
from fitted_rulers import matrix, frozen


@dataclass(frozen=True)
class Conditional:
    target: int
    others: np.ndarray
    coefficient: np.ndarray
    intercept: float


@dataclass(frozen=True)
class Iteration:
    medians: np.ndarray
    sequence: tuple
    sweeps: int
    change: float
    status: str


def ridge_fit(A, y, alpha):
    mean, ymean = A.mean(axis=0), y.mean()
    centered = A-mean
    if alpha > 0:
        augmented = np.vstack([centered, np.sqrt(alpha)*np.eye(A.shape[1])])
        rhs = np.r_[y-ymean, np.zeros(A.shape[1])]
    else:
        augmented, rhs = centered, y-ymean
    coefficient = np.linalg.lstsq(augmented, rhs, rcond=None)[0]
    return coefficient, float(ymean-mean@coefficient)


def fit_completion(X, alpha=1., max_iter=3, tol=1e-10):
    X = matrix(X)
    if X.shape[1] < 2 or np.isnan(X).all(axis=0).any():
        raise ValueError('at least two columns, each with an observed target')
    if not np.isfinite(alpha) or alpha < 0 or not isinstance(max_iter, int) or max_iter < 1 or not np.isfinite(tol) or tol < 0:
        raise ValueError('nonnegative alpha/tol and positive sweep cap')
    mask = np.isnan(X)
    medians = np.nanmedian(X, axis=0)
    current = np.where(mask, medians, X)
    threshold = tol*float(abs(X[~mask]).max())
    sequence, trace = [], []
    status = 'iteration cap'
    for sweep in range(max_iter):
        previous = current.copy()
        for j in range(X.shape[1]):
            others = np.array([k for k in range(X.shape[1]) if k != j])
            observed = ~mask[:, j]
            A, y = current[observed][:, others], X[observed, j]
            coefficient, intercept = ridge_fit(A, y, alpha)
            model = Conditional(j, frozen(others), frozen(coefficient), intercept)
            current[mask[:, j], j] = current[mask[:, j]][:, others]@coefficient+intercept
            sequence.append(model)
            trace.append({'sweep': sweep+1, 'target': j,
                          'observed_rows': np.flatnonzero(observed).tolist(),
                          'design': A.tolist(), 'target_values': y.tolist(),
                          'coefficient': coefficient.tolist(), 'intercept': intercept,
                          'completed': current.copy().tolist()})
        if not np.isfinite(current).all():
            raise ValueError('conditional completion overflow')
        # np.linalg.norm(matrix, ord=inf) is max ROW SUM, matching this
        # configured sklearn stopping criterion, not max individual cell.
        change = float(np.linalg.norm(current-previous, ord=np.inf))
        if change < threshold:
            status = 'relative observed-scale tolerance'
            break
    np.testing.assert_array_equal(current[~mask], X[~mask])
    return Iteration(frozen(medians), tuple(sequence), sweep+1, change, status), current, trace


def transform_completion(state, X):
    X = matrix(X, len(state.medians))
    mask = np.isnan(X)
    result = np.where(mask, state.medians, X)
    for model in state.sequence:
        rows = mask[:, model.target]
        result[rows, model.target] = result[rows][:, model.others]@model.coefficient+model.intercept
    if not np.isfinite(result).all():
        raise ValueError('query completion overflow')
    np.testing.assert_array_equal(result[~mask], X[~mask])
    return result


if __name__ == '__main__':
    X = np.array([[1., 2.], [2., 4.], [3., np.nan], [np.nan, 8.], [5., 10.]])
    state, result, trace = fit_completion(X, alpha=1., max_iter=3, tol=1e-10)
    with warnings.catch_warnings(record=True) as notices:
        ordinary = IterativeImputer(estimator=Ridge(alpha=1., fit_intercept=True, solver='svd'),
                                    initial_strategy='median', imputation_order='roman',
                                    skip_complete=False, sample_posterior=False,
                                    max_iter=3, tol=1e-10, random_state=20)
        expected = ordinary.fit_transform(X)
    np.testing.assert_allclose(result, expected, atol=1e-10)
    print('training status:', state.sweeps, state.status, 'last change:', round(state.change, 8))
    for turn in trace:
        print('turn:', turn)
    query = np.array([[3., np.nan], [np.nan, 6.], [np.nan, np.nan]])
    got = transform_completion(state, query)
    np.testing.assert_allclose(got, ordinary.transform(query), atol=1e-10)
    print('new rows:', np.round(got, 6).tolist())
    print('ordinary notices:', [str(w.message) for w in notices])
    np.testing.assert_array_equal(transform_completion(state, query), got)
    try:
        fit_completion([[1., np.nan], [2., np.nan]])
    except ValueError as exc:
        print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
training status: 3 iteration cap last change: 0.00013875
turn: {'sweep': 1, 'target': 0, 'observed_rows': [0, 1, 2, 4], 'design': [[2.0], [4.0], [6.0], [10.0]], 'target_values': [1.0, 2.0, 3.0, 5.0], 'coefficient': [0.486111111111111], 'intercept': 0.07638888888888973, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.0], [3.9652777777777777, 8.0], [5.0, 10.0]]}
turn: {'sweep': 1, 'target': 1, 'observed_rows': [0, 1, 3, 4], 'design': [[1.0], [2.0], [3.9652777777777777], [5.0]], 'target_values': [2.0, 4.0, 8.0, 10.0], 'coefficient': [1.8232290980799584], 'intercept': 0.5461393472365135, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.015826641476389], [3.9652777777777777, 8.0], [5.0, 10.0]]}
turn: {'sweep': 2, 'target': 0, 'observed_rows': [0, 1, 2, 4], 'design': [[2.0], [4.0], [6.015826641476389], [10.0]], 'target_values': [1.0, 2.0, 3.0, 5.0], 'coefficient': [0.4860048204031846], 'intercept': 0.07505053177040555, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.015826641476389], [3.9630890949958824, 8.0], [5.0, 10.0]]}
turn: {'sweep': 2, 'target': 1, 'observed_rows': [0, 1, 3, 4], 'design': [[1.0], [2.0], [3.9630890949958824], [5.0]], 'target_values': [2.0, 4.0, 8.0, 10.0], 'coefficient': [1.8235392587170434], 'intercept': 0.5462093449363152, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.016827121087445], [3.9630890949958824, 8.0], [5.0, 10.0]]}
turn: {'sweep': 3, 'target': 0, 'observed_rows': [0, 1, 2, 4], 'design': [[2.0], [4.0], [6.016827121087445], [10.0]], 'target_values': [1.0, 2.0, 3.0, 5.0], 'coefficient': [0.48599793404779523], 'intercept': 0.0749668762160085, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.016827121087445], [3.9629503485983704, 8.0], [5.0, 10.0]]}
turn: {'sweep': 3, 'target': 1, 'observed_rows': [0, 1, 3, 4], 'design': [[1.0], [2.0], [3.9629503485983704], [5.0]], 'target_values': [2.0, 4.0, 8.0, 10.0], 'coefficient': [1.8235588883535456], 'intercept': 0.5462138902203231, 'completed': [[1.0, 2.0], [2.0, 4.0], [3.0, 6.01689055528096], [3.9629503485983704, 8.0], [5.0, 10.0]]}
new rows: [[3.0, 6.016891], [2.990954, 6.0], [2.99259, 6.003378]]
ordinary notices: ['[IterativeImputer] Early stopping criterion not reached.']
refused: at least two columns, each with an observed target
```


This program uses NumPy's least-squares primitive for the linear solve, while owning mask, observed-target selection, ridge design, ordered updates, saved sequence and inference. The ordinary route explicitly enables experimental IterativeImputer, selects Ridge(alpha=1, solver='svd'), roman column order, median initialization, skip_complete=False and no posterior sampling. Supported fixture values and later rows match within stated tolerance. Full source/stream retains every turn's matrices and coefficients. General estimator heuristics or order choices can produce different sequences; there is no claim to clone every IterativeImputer configuration.

For S sweeps, d targets and n rows, work is S times the sum of conditional regression costs; with dense least squares on d−1 predictors this can be substantial. State stores every fitted model used at inference. Shared numerical primitives avoid teaching an unneeded matrix inversion engine. Misspecified relationships, poor conditioning, unconverged cycles or collection shifts can give poor fills. Deterministic iteration gives a single completed table, not proper multiple imputation.

### Several completions must become several analyses

Prediction preparation asks for usable inputs. Scientific inference asks how unknown values affect an estimate and its uncertainty. Treating a single completed table as observed can hide uncertainty from missing data. Multiple imputation creates several plausible completions under an explicit model, analyzes each, then pools **analysis estimates**, not raw table cells.

Look at actual completed matrices sharing observed cells and carrying different hatched missing entries. Follow each table into its own estimate Qₗ and estimated variance Uₗ.

<!-- Drawing D40: visual-specifications.md#d40; actual objects and quantitative companion specified in full. -->

The order matters even without probability theory. If one unseen value could be completed as 0 or 2 and analysis squares it, analyzing first gives 0 and 4, average 2. Averaging the input first gives 1, whose square is 1. Pooling tables erased a nonlinear effect and all disagreement. The small given completion matrices in this drawing illustrate order; arbitrary plausible-looking tables are not thereby proper stochastic imputations.

For m≥2 scalar analyses, define Qbar=mean(Qₗ), Ubar=mean(Uₗ), B=Σ(Qₗ−Qbar)²/(m−1). The total variance rule is

\[
T=\bar U+(1+1/m)B=\bar U+B+B/m,
\qquad SE=\sqrt T.
\]

Uₗ is a **variance**, in squared estimate units, not a standard error. B uses sample denominator m−1 because the finite set of completions estimates between-completion variability. The B/m term reflects finite-m simulation variation. Show these contributions on a squared-unit scale, keeping the standard-error length separate.

<!-- Drawing D41: visual-specifications.md#d41; actual objects and quantitative companion specified in full. -->

For Q=[9,10,11] and U=[4,4,4], Qbar=10, Ubar=4, B=(1+0+1)/2=1, simulation=1/3 and T=16/3. SE≈2.309401, larger than √4=2. Identical Q gives B=0 while within-analysis uncertainty can remain. More completions reduce the finite-m term but cannot fix an inappropriate model.

<!-- Investigation L14a: visual-specifications.md#l14a; immediate current result and direct-entity controls specified in full. -->

Edit one estimate or variance and see all components immediately. Changing a Q affects the mean and between component; changing a U affects within variance. Negative variance and m=1 are refusals. The given tables/analyses are instructional objects, not evidence that an arbitrary completion sampler satisfies inferential assumptions. A standard error alone does not specify a universally valid confidence interval: degrees of freedom and the complete-data/imputation model matter.

**pool_scalar_analyses.py — actual new checked process.**

```python
"""Pool scalar ANALYSES: U contains variances, not standard errors."""
import numpy as np


def pool_scalar(estimates, variances):
    Q, U = np.asarray(estimates, float), np.asarray(variances, float)
    if Q.ndim != 1 or U.shape != Q.shape or len(Q) < 2:
        raise ValueError('at least two paired scalar estimates/variances')
    if not np.isfinite(Q).all() or not np.isfinite(U).all() or np.any(U < 0):
        raise ValueError('finite estimates and nonnegative variances')
    with np.errstate(over='raise', invalid='raise'):
        mean, within, between = Q.mean(), U.mean(), Q.var(ddof=1)
        simulation = between/len(Q)
        total = within+between+simulation
    if not np.isfinite(total):
        raise ValueError('variance arithmetic overflow')
    return dict(m=len(Q), estimate=float(mean), within=float(within),
                between=float(between), simulation=float(simulation),
                total=float(total), standard_error=float(np.sqrt(total)))


if __name__ == '__main__':
    for Q, U in [([9., 10., 11.], [4., 4., 4.]),
                  ([8., 10., 10., 12.], [1., 1., 1., 1.]),
                  ([10., 10.], [4., 4.]), ([0., 0.], [0., 0.])]:
        print(pool_scalar(Q, U))
    assert np.isclose(pool_scalar([9, 10, 11], [4, 4, 4])['total'], 16/3)
    assert np.isclose(pool_scalar([8, 10, 10, 12], [1]*4)['total'], 13/3)
    print('analyse squares first:', np.mean(np.array([0., 2.])**2),
          'square averaged input:', np.mean([0., 2.])**2)
    for Q, U in [([1.], [1.]), ([1., 2.], [1., -1.])]:
        try:
            pool_scalar(Q, U)
            raise AssertionError('expected refusal')
        except ValueError as exc:
            print('refused:', exc)
```

Whole recorded stdout (exact captured new stdout bytes):

```text
{'m': 3, 'estimate': 10.0, 'within': 4.0, 'between': 1.0, 'simulation': 0.3333333333333333, 'total': 5.333333333333333, 'standard_error': 2.309401076758503}
{'m': 4, 'estimate': 10.0, 'within': 1.0, 'between': 2.6666666666666665, 'simulation': 0.6666666666666666, 'total': 4.333333333333333, 'standard_error': 2.0816659994661326}
{'m': 2, 'estimate': 10.0, 'within': 4.0, 'between': 0.0, 'simulation': 0.0, 'total': 4.0, 'standard_error': 2.0}
{'m': 2, 'estimate': 0.0, 'within': 0.0, 'between': 0.0, 'simulation': 0.0, 'total': 0.0, 'standard_error': 0.0}
analyse squares first: 2.0 square averaged input: 1.0
refused: at least two paired scalar estimates/variances
refused: finite estimates and nonnegative variances
```


The full O(m) scalar routine checks paired finite vectors and nonnegative U, computes every labeled term, and refuses invalid inputs. It does not silently use 1.96 for all intervals. Proper imputations and valid compatible complete-data analysis are conditions for using pooling inferentially, not consequences of applying this arithmetic. A predictive accuracy improvement supplies no evidence for those conditions.

### A bounded stochastic model with declared assumptions

To see what “stochastic completion” actually samples, use one scalar column [8,10,NA,12,NA]. This is constructed data under a marginal normal model with an ignorability/MCAR teaching assumption. There are no unimplemented MAR covariates. Let unknown mean μ and variance σ² have a proper normal–inverse-gamma prior: σ²∼inverse-gamma(α₀, scale β₀), and μ|σ²∼Normal(μ₀,σ²/κ₀), with positive κ₀,α₀,β₀.

Conditioning on n observed values updates

\[
\kappa_n=\kappa_0+n,\quad
\mu_n=(\kappa_0\mu_0+n\bar x)/\kappa_n,\quad
\alpha_n=\alpha_0+n/2,
\]
\[
\beta_n=\beta_0+\tfrac12\sum(x_i-\bar x)^2
 +\frac{\kappa_0n(\bar x-\mu_0)^2}{2\kappa_n}.
\]

These terms follow by completing the square in the normal likelihood times prior. Observed variation contributes the squared-deviation term; disagreement between the prior mean and observed mean adds the last term. Mean precision combines κ₀ with n. Given μ₀=0,κ₀=1,α₀=2,β₀=2 and observed [8,10,12], n=3, xbar=10, squared deviations sum 8. Thus κn=4, μn=7.5, αn=3.5, βn=2+4+37.5=43.5. The visibly influential prior is intentional and should be examined, not hidden behind “proper.”

For each completion, draw σ² from the posterior inverse gamma, draw μ conditionally using σ²/κn, then draw each missing value conditionally using σ². Draws of μ/σ² represent parameter uncertainty; conditional missing draws represent remaining value uncertainty. Keep all observed cells exactly fixed. Analyze each completed mean Q and complete-data variance-of-mean U=s²/N before pooling. The normal sample variance uses N−1; N is total completed row count, distinct from the n observed values used for the posterior.

**normal_completion_and_sensitivity.py — actual new checked process.**

```python
"""Bounded scalar normal/MCAR model; posterior draws and assumed delta shifts.

This is an explicit marginal model with no MAR covariates. It neither identifies
MNAR nor establishes frequentist coverage of arbitrary pooled intervals.
"""
import numpy as np
from scipy.stats import invgamma, normal_inverse_gamma
from pool_scalar_analyses import pool_scalar


def posterior(values, mu0=0., kappa0=1., alpha0=2., beta0=2., prior_only=False):
    x = np.asarray(values, float)
    if x.ndim != 1 or len(x) < 2 or np.isinf(x).any():
        raise ValueError('one scalar column, at least two total rows, finite or NaN')
    parameters = np.array([mu0, kappa0, alpha0, beta0], float)
    if not np.isfinite(parameters).all() or min(kappa0, alpha0, beta0) <= 0:
        raise ValueError('finite mu0; kappa0, alpha0, beta0 positive')
    observed = x[~np.isnan(x)]
    n = len(observed)
    if n == 0:
        if not prior_only:
            raise ValueError('no observed values; explicit prior-only opt-in required')
        return float(mu0), float(kappa0), float(alpha0), float(beta0)
    mean = observed.mean()
    kappa = kappa0+n
    mu = (kappa0*mu0+n*mean)/kappa
    alpha = alpha0+n/2
    beta = beta0+np.sum((observed-mean)**2)/2+kappa0*n*(mean-mu0)**2/(2*kappa)
    if not np.isfinite([mu, kappa, alpha, beta]).all():
        raise ValueError('posterior arithmetic overflow')
    return float(mu), float(kappa), float(alpha), float(beta)


def complete_normal(values, m=5, seed=20, delta=0., ordinary_joint=False, **prior):
    x = np.asarray(values, float)
    if not isinstance(m, int) or isinstance(m, bool) or m < 2 or m > 10000 or not np.isfinite(delta):
        raise ValueError('bounded integer m >= 2 and finite assumed delta')
    mu_n, kappa_n, alpha_n, beta_n = posterior(x, **prior)
    rng = np.random.default_rng(seed)
    mask = np.isnan(x)
    tables, estimates, variances, parameters = [], [], [], []
    for _ in range(m):
        if ordinary_joint:
            mu, variance = normal_inverse_gamma(mu_n, kappa_n, alpha_n, beta_n).rvs(random_state=rng)
        else:
            variance = invgamma.rvs(alpha_n, scale=beta_n, random_state=rng)
            mu = rng.normal(mu_n, np.sqrt(variance/kappa_n))
        completed = x.copy()
        completed[mask] = rng.normal(mu, np.sqrt(variance), size=mask.sum())+delta
        np.testing.assert_array_equal(completed[~mask], x[~mask])
        estimates.append(float(completed.mean()))
        variances.append(float(completed.var(ddof=1)/len(completed)))
        parameters.append((float(mu), float(variance)))
        tables.append(completed)
    return dict(posterior=(mu_n, kappa_n, alpha_n, beta_n),
                tables=np.array(tables), draws=parameters,
                Q=estimates, U=variances, pooled=pool_scalar(estimates, variances))


if __name__ == '__main__':
    x = np.array([8., 10., np.nan, 12., np.nan])
    baseline = complete_normal(x)
    print('posterior mu/kappa/alpha/beta:', baseline['posterior'])
    print('completed tables:', np.round(baseline['tables'], 6).tolist())
    print('analysis Q:', np.round(baseline['Q'], 6).tolist(), 'U:', np.round(baseline['U'], 6).tolist())
    print('pooled:', baseline['pooled'])
    other = complete_normal(x, seed=21, m=3)
    print('changed seed/m estimates:', np.round(other['Q'], 6).tolist())
    joint = complete_normal(x, ordinary_joint=True)
    print('ordinary joint posterior:', joint['posterior'], 'estimates:', np.round(joint['Q'], 6).tolist())
    assert joint['posterior'] == baseline['posterior']
    for delta in [-2., 0., 2.]:
        shifted = complete_normal(x, delta=delta)
        np.testing.assert_allclose(shifted['tables'][:, ~np.isnan(x)], baseline['tables'][:, ~np.isnan(x)])
        np.testing.assert_allclose(shifted['tables'][:, np.isnan(x)], baseline['tables'][:, np.isnan(x)]+delta)
        print('assumed delta/pooled mean:', delta, round(shifted['pooled']['estimate'], 6))
    no_missing = complete_normal([8., 10., 12.], delta=100.)
    assert no_missing['pooled']['between'] == 0.
    print('no-missing null:', no_missing['pooled'])
    print('prior-only posterior:', posterior([np.nan, np.nan], prior_only=True))
```

Whole recorded stdout (exact captured new stdout bytes):

```text
posterior mu/kappa/alpha/beta: (7.5, 4.0, 3.5, 43.5)
completed tables: [[8.0, 10.0, 13.844877, 12.0, 10.417592], [8.0, 10.0, 3.469308, 12.0, 3.517166], [8.0, 10.0, 9.252957, 12.0, 10.045356], [8.0, 10.0, 1.868145, 12.0, 3.030686], [8.0, 10.0, 5.3306, 12.0, 6.384847]]
analysis Q: [10.852494, 7.397295, 9.859663, 6.979766, 8.343089] U: [0.966187, 2.940335, 0.423083, 3.854467, 1.457293]
pooled: {'m': 5, 'estimate': 8.686461347735442, 'within': 1.9282729593925112, 'between': 2.6901900890776607, 'simulation': 0.5380380178155322, 'total': 5.1565010662857045, 'standard_error': 2.2707930478768215}
changed seed/m estimates: [10.317975, 6.811258, 11.693476]
ordinary joint posterior: (7.5, 4.0, 3.5, 43.5) estimates: [10.852494, 7.397295, 9.859663, 6.979766, 8.343089]
assumed delta/pooled mean: -2.0 7.886461
assumed delta/pooled mean: 0.0 8.686461
assumed delta/pooled mean: 2.0 9.486461
no-missing null: {'m': 5, 'estimate': 10.0, 'within': 1.3333333333333333, 'between': 0.0, 'simulation': 0.0, 'total': 1.3333333333333333, 'standard_error': 1.1547005383792515}
prior-only posterior: (0.0, 1.0, 2.0, 2.0)
```


The program publishes posterior parameters, all five seed-20 completed tables, per-completion Q/U and pooled components. Different seed/m values show a changed realization without a large simulation campaign. The ordinary SciPy normal_inverse_gamma route receives (μn,κn,αn,βn); identical posterior parameters and conditional identities are the relevant bridge. Its actual draws happen to agree for this environment/seed, but cross-generator random sample equality is not the contract. A no-observation case needs explicit prior-only opt-in, and at least two total rows are needed for the stated complete-data variance calculation.

A proper prior makes this model a defined posterior; it does not prove frequentist coverage of every pooled interval or justify the model for real penguin gaps. Unbounded normal draws can be unsuitable for physical nonnegative quantities. Choose a scientific model respecting the estimand and support, inspect diagnostics and assess sensitivity rather than patching negative draws into false observations.

<!-- Investigation L14b: visual-specifications.md#l14b; immediate current result and direct-entity controls specified in full. -->

Now assume the missing values differ by an additive δ from this baseline completion model. Change δ while all random baseline draws and observed cells stay fixed. With two of five values missing, each completed mean moves by (2/5)δ. Seed-20 pooled means are about 7.886461,8.686461,9.486461 for δ=−2,0,2. If no values are missing, δ has no effect. This sensitivity parameter is **assumed**, not identified from observed data; the curve shows which conclusion depends on that assumption. It does not diagnose actual MNAR.

The ordinary R route below demonstrates a complete mice→with→pool workflow and scalar pooling call. It is a separately optional tool example, with source authored but R execution **not claimed** in this Python environment. The tiny constructed regression is instructional, not a coverage experiment; actual analysis must inspect logged events, trace behavior, model compatibility, degrees of freedom and support. Including an outcome in a scientific imputation model differs from giving unavailable deployment targets to a predictive pipeline.

**multiple_imputation_mice.R — not executed.**

```r
# Optional ordinary R route; source authored, execution NOT claimed.
# Install once: install.packages('mice'); run: Rscript multiple_imputation_mice.R
library(mice)

# A small constructed regression task. These are not penguin observations.
example <- data.frame(
  outcome = c(3, 5, 7, 9, 11, 13, 15, 17),
  amount = c(1, 2, NA, 4, 5, NA, 7, 8),
  station = factor(c('a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'))
)
# Conditional normal imputation is chosen explicitly for the continuous amount.
# This tiny exact-looking fixture is instructional, not a coverage experiment.
methods <- make.method(example)
methods[] <- ''
methods['amount'] <- 'norm'
predictors <- make.predictorMatrix(example)
predictors[,] <- 0
predictors['amount', c('outcome', 'station')] <- 1
completed <- mice(example, m = 5, maxit = 5, method = methods,
                  predictorMatrix = predictors, seed = 20, printFlag = FALSE)
analyses <- with(completed, lm(outcome ~ amount + station))
pooled <- pool(analyses)
print(summary(pooled))
print(pool.scalar(Q = c(9, 10, 11), U = c(4, 4, 4), n = 100, k = 1))
# Inspect completed$loggedEvents and trace plots in a real analysis. Model
# compatibility, ignorability, degrees of freedom and small-sample instability
# require judgment; pool() does not certify them. Outcome use here belongs to a
# scientific imputation/analysis model. It is not permission to give deployment
# targets to a predictive preprocessing pipeline.
```

R output is not supplied because execution is not claimed.


The Python completion work is O(mN), plus each analysis, for m completions and N total rows. Saving all tables costs O(mN); streaming analyses can reduce storage if preserving complete tables is unnecessary for the teaching or audit. More sophisticated conditional/multilevel models, survey weights and a full causal identification theory belong to later specialist work. The local lesson remains: unknown values require explicit assumptions, analysis comes before pooling, and uncertainty/sensitivity are different from deterministic input preparation.


<a id="10-practice-explain-the-representation-before-choosing-the-function"></a>
## 10. Practice: explain the representation before choosing the function

Attempt the question before opening its hint or solution. T2–T6 and T8 preserve original core practices 1–6; T10,T9,T24 preserve original deeper practices 7,8,9. T7 preserves the original indicator implementation extension with a complete supported successor. The mapping makes old practice identities explicit while the appended tasks exercise new inputs. A solution explains the tempting wrong route as well as the calculation.

### T1. Follow a missing measurement without erasing another fact

Take an independent copy of source row 309, set mass to missing and sex to female. List features, target, numeric mask and the information allowed to fill the gap. Does absence in one cell make sex unknown?

<details><summary>Hint</summary>Keep one mask bit per numeric input, separate from the target and categorical policy.</details>
<details><summary>Solution</summary>The features are [51,18.8,203,NA,female], the target remains Chinstrap in the held-out record, and numeric M=[0,0,0,1]. Sex is observed, giving the fitted female coordinate; it is neither missing nor an unseen string. The frozen training median 4000 fills mass before its saved center/scale apply. Held-out species and later input distribution may not refit those statistics. The filled coordinate is an estimate with mask1. Treating the whole row as “missing” would discard observed information; treating species as an input would reveal the answer.</details>

<a id="t2"></a>
<!-- T2: exact original practice 1 retained below. -->
### 1. A changed ruler

Query `[0,0]` has candidates A `[2,60]` and B `[5,10]`. Which is nearest under raw squared distance? Which is nearest with divisors `[1,30]`?

<details><summary>Hint</summary>Calculate one contribution per feature; the divisor belongs inside the square.</details>
<details><summary>Solution</summary>Raw distances squared are 3,604 and 125, so B wins. Scaled distances squared are $4+4=8$ and $25+1/9=25.111\ldots$, so A wins. The input observations are unchanged; relative feature weighting changed.</details>

<a id="t3"></a>
<!-- T3: exact original practice 2 retained below. -->
### 2. Fit once, transform later

A training column is `[2,4,6]`. Find its mean, population-style standard deviation, standardized value for a new 8, and min–max value for that 8. Should adding 8 to the later batch change the saved training statistics?

<details><summary>Hint</summary>The training squared deviations are 4, 0, and 4.</details>
<details><summary>Solution</summary>The mean is 4 and standard deviation $\sqrt{8/3}$. The standardized new value is $4/\sqrt{8/3}=\sqrt6\approx2.4495$. Min–max gives $(8-2)/(6-2)=1.5$. Transformation reuses the fitted statistics; refitting on later inputs would create a different map.</details>

<a id="t4"></a>
<!-- T4: exact original practice 3 retained below. -->
### 3. What did normalization discard?

A spectrum `[2,1,2]` and another `[6,3,6]` are L2-normalized. What are the results? Would this be appropriate if total emitted energy is the prediction signal?

<details><summary>Solution</summary>The lengths are 3 and 9, so both map to `[2/3,1/3,2/3]`. Relative shape remains, but the threefold intensity difference disappears. If total energy matters, preserve a magnitude feature or choose another representation rather than discarding it blindly.</details>

<a id="t5"></a>
<!-- T5: exact original practice 4 retained below. -->
### 4. A category that did not exist during fitting

A full one-hot vocabulary has `small`, `medium`, and `large`, and an unknown value uses an all-zero block. Compare unknown-to-small distance with small-to-medium distance. What application decision is hidden behind accepting the unknown value?

<details><summary>Solution</summary>The distances are 1 and $\sqrt2$. Ignoring unknown categories creates a representation with a specific geometry; it is not neutral. The application must decide whether a new value is valid, should trigger a review or fallback, or belongs in a deliberately learned other-category group.</details>

<a id="t6"></a>
<!-- T6: exact original practice 5 retained below. -->
### 5. Changed donors

In the imputation table, change D2's `c` to missing. With two neighbors, what value replaces the query's missing `c`? What if D1's `c` changes from 100 to 140 while the other original cells remain unchanged?

<details><summary>Hint</summary>First decide who can donate the target feature, then use the distances on the query's observed coordinates.</details>
<details><summary>Solution</summary>With D2 ineligible, D1 and D3 supply $(100+500)/2=300$. In the separate second change, the original selected donors D2 and D1 remain nearest, so the estimate becomes $(300+140)/2=220$. Changing a value in the query's missing target column does not itself enter these overlap distances.</details>

### T7. Keep every original coordinate before adding recording history

Extend the retained P1 mechanism with one indicator for every numeric input column. Transform [15,500,NaN] with category b, checking the first six coordinates, three indicators and unchanged fitted state. Then implement a **distinct** robust-ruler successor keeping the same fill/vocabulary. The full callable implementations are in masked_simple_imputation.py, with the complete changed-input answer function in practice_solutions.py.

<details><summary>Hint</summary>Save np.isnan(input) before filling. Fit the robust ruler on the already-filled training matrix, not on the query.</details>
<details><summary>Solution</summary>The filled row is [15,500,7]. Standard numeric coordinates are [(15−20)/√50,(500−300)/√20000,0]=[−1/√2,√2,0]. The retained category order a,b,not_recorded gives [0,1,0]; original missing indicators [0,0,1] are appended. The result has width9 and approximately [−.707107,1.414214,0,0,1,0,0,0,1]. The filled training first column [10,20,30,20] has median20 and linear IQR5; second [100,300,300,500] median300 and IQR100; constant third uses divisor1. Robust query coordinates are [−1,2,0], giving [−1,2,0,0,1,0,0,0,1]. Snapshot fills, centers, scales and vocabulary before transform; exact comparison afterward verifies no mutation. Recovering the mask from completed values is wrong because an observed7 and filled7 coincide. Fitting only missing-at-training indicators misses the new third-column absence; all-feature indicators retain its bit.</details>

<a id="t8"></a>
<!-- T8: exact original practice 6 retained below. -->
### 6. Explain a transformed real record

For the fitted standard penguin pipeline, keep the first held-out record unchanged except set its body mass to missing. Predict that output coordinate. Does this mean the animal's true mass was 4,000 g?

<details><summary>Hint</summary>First apply the saved median, then the saved mean and scale.</details>
<details><summary>Solution</summary>The coordinate becomes $(4000-4190.9883721)/806.6875829\approx-0.2368$. This is a numerical estimate passed to the model. It is not a recovered observation. Other coordinate values and the fitted statistics remain unchanged.</details>

<a id="t9"></a>
<!-- T9: exact original practice 8 retained below. -->
### 8. Identity is a useful transform check — deeper

Use the Yeo–Johnson formula at $\lambda=1$ on 3 and −3. Why is a generic claim that “negative inputs use a square root” wrong?

<details><summary>Solution</summary>For 3, $((3+1)^1-1)/1=3$. For −3, $-((1+3)^1-1)/1=-3$. Both branches depend on $\lambda$; the negative exponent is $2-\lambda$, with a logarithmic limit at $\lambda=2$, not a fixed square root.</details>

For an additional changed branch in T9, evaluate x=−3 at λ=2 and λ=0.

<details><summary>Hint</summary>The negative exponent is 2−λ; identify its zero-power limit before calculating.</details>
<details><summary>Solution</summary>At λ2 the branch is −log(1−x)=−ln4. At λ0 its exponent is2, so −(4²−1)/2=−7.5. The λ1 identity preserved above and these two changed cases show why a generic square-root explanation fails.</details>

<a id="t10"></a>
<!-- T10: exact original practice 7 retained below. -->
### 7. Which part of target encoding changed? — deeper

In the six-row example, change row 3's target from 0 to 1. Calculate row 0's new encoding. Does row 3's own cross-fitted encoding change?

<details><summary>Solution</summary>Row 0's donors are rows 1, 3, and 5, now with prior $2/3$. Its A donor is still positive, so its value becomes $7/9$. Row 3 belongs to held-out fold 1, whose donor targets are unchanged, so its own value remains $4/9$. The first change passes through the prior; the null demonstrates excluding one's own target.</details>

### T11. Distinguish a byte identity from an experiment

The current CSV is a 15586-byte CRLF file, while the historical receipt binds a 15241-byte LF input. What checks justify saying they contain the same observations? May we call the old experiment a fresh run against the current download?

<details><summary>Hint</summary>Check an exact normalization relation and parsed row order; an equal data table is not a new process execution.</details>
<details><summary>Solution</summary>Replacing CRLF by LF yields the historical exact SHA-256 and size; parsing both gives all344 identical rows, columns and NA cells in order. The newline count explains the345-byte size difference. This establishes a source relation. It does not execute the program, refit models or refresh versions. Bind both raw identities, label the current download separately from the historical executed input, and reuse the retained output with its original date/environment. The setup metadata supplies full hashes rather than relying on abbreviated names.</details>

### T12. Equal predictions, different penalties and storage

Compare x=[1,100], w=[1,.01] with x′=[1,1], w′=[1,1]. Compute predictions and squared coefficient norms. Center `[[0,0,3],[1,0,0],[0,2,0]]` and count nonzeros.

<details><summary>Hint</summary>Multiply coefficients by the same divisor used on each coordinate; sparse zero support is about actual entries.</details>
<details><summary>Solution</summary>Both dot products are2. The coefficient norms squared are1+.0001=1.0001 and1+1=2. A fixed ridge penalty therefore changes even with equal predictions. Matrix column means are [1/3,2/3,1]; centered rows [−1/3,−2/3,2], [2/3,−2/3,−1], [−1/3,4/3,−1] all contain three nonzeros, so support grows3→9. Scale-only sparse transformation can preserve original zeros; representing nonzero centered values as zeros would alter the data, not optimize storage.</details>

### T13. Let training counts own the rare policy

Fit a×4,b×1,missing×1 with rare threshold2, keeping missing separate. Transform b,new,missing,a under infrequent-if-present. What happens with only a×4 during fit? Try a real label `@missing`.

<details><summary>Hint</summary>Inspect the vocabulary, not just the vector width.</details>
<details><summary>Solution</summary>Counts are a4,b1,@missing1. Fitted rare set={b}; columns sorted as @missing,@rare,a. Rows are b=[0,1,0],new=[0,1,0],missing=[1,0,0],a=[0,0,1]. With only a4 no rare bucket exists; new becomes [0] under the declared fallback. The literal @missing as a measured category is refused by the reserved-prefix rule, preventing a collision with absence. sklearn's native min_frequency may group the missing marker because it is infrequent; use explicitly pregrouped categories for our same-policy comparison. Query labels never change the fitted counts or width.</details>

### T14. Expose forbidden query feedback

For k=1, donors are [0,0,NA], [2,100,100], [3,0,200], query [1,NA,NA]. Fill both missing targets using original-query distances. Then deliberately feed the first fill back into the distance for the second target. Explain the difference and the tie convention.

<details><summary>Hint</summary>For the first target all donors have b, while for c the first donor is ineligible. Original overlap uses only a.</details>
<details><summary>Solution</summary>Original squared distances are3,3,12. Custom source-order tie picks donor0 for b, giving0. For c, donor0 lacks c and is excluded; donor1 is nearest, giving100. Correct output is [1,0,100]. If completed b=0 is illegally treated as observed before choosing c, donor1 adjusted squared distance is(3/2)(1+10000)=15001.5, donor2 is(3/2)(4+0)=6; it gives200. The wrong algorithm outputs [1,0,200]. P5 and the answer file compute both and assert the contrast. This does not say conditional iteration is wrong: section9 deliberately specifies current-estimate predictors under another model. It says two algorithms cannot be silently mixed. With an all-target-missing training column our default rejects; no tie convention can invent evidence.</details>

### T15. Feature-only leakage is still a fitting dependency

A held-out row changes the fitted quantile landmarks or determines whether a category passes the rare threshold. No targets were used. Is this safe assessment? Contrast an externally specified schema.

<details><summary>Hint</summary>Ask whether the map uses information available before the assessment row arrives.</details>
<details><summary>Solution</summary>The assessment feature distribution influenced a fitted rule. That can make the representation adapted to the examples judging it. Split first and refit landmarks/count thresholds inside each permitted training set. A category schema declared independently beforehand is different from vocabulary estimated from all assessment-inclusive rows. Pipeline helps only when it receives training-only input at fit. It cannot repair subject/time leakage, post-outcome features or manual pre-fitting outside it.</details>

### T16. Report the real result without a winner claim

Write a deployment-facing paragraph interpreting 38,67,84,85,85 correct out of86 under the retained controls. Name one next decision and one limitation; do not run a new campaign.

<details><summary>Hint</summary>Identify the shared split, k and category policy before differences.</details>
<details><summary>Solution</summary>An acceptable report says: “On the preserved seed20 stratified split of344 Palmer Penguins rows, five-neighbor models shared258 training/86 assessment indices and category fill/one-hot policy. Raw numeric inputs got67 correct, standard84, min–max85 and robust85, against training-majority38. Scaling changed this model's useful geometry on this collection; one extra correct case does not establish a generally best scaler. We would compare proposed preprocessing inside training-only development splits and reserve separate assessment, matching future population/group/time availability. Deployment also needs schema, unknown-category and new-missingness monitoring.” Omitting the baseline, changing the objective after seeing scores or calling85vs84 proof of superiority fails the report's purpose.</details>

### T17. Invert a stable power map, then refuse an invalid input

Evaluate Box–Cox(4,λ=10⁻⁹), invert log4 at λ0, and try Box–Cox(0,λ0). What may a selected bound in a fitted λ search mean?

<details><summary>Hint</summary>Use expm1(λlog4)/λ and the exact logarithmic branch.</details>
<details><summary>Solution</summary>The first value approaches ln4≈1.3862943611, with tiny finite-λ correction, rather than zero from cancellation. Inverting y=ln4 at λ0 gives exp(y)=4. Zero violates Box–Cox's strictly positive domain, so the program raises ValueError; patching it to epsilon changes the map and dataset. A best tested boundary can indicate the search range restricted the fit; it is reported with bounds/status, not described as a global optimum. The full answer function calls the stable implementation and its inverse; same-λ ordinary comparison tests formulas separately from optimizer choices.</details>

### T18. Query landmarks and bin edges without refitting

For fitted [1,2,2,4,100] landmarks/probabilities, transform later3 and1000 uniformly. Fit four requested linear-quantile bins and assign x=2. Can an inverse recover1000?

<details><summary>Hint</summary>Distinguish averaging tie endpoints from interpolating after the last duplicate; exact bin edges use right insertion.</details>
<details><summary>Solution</summary>The tie2 maps(.25+.5)/2=.375. Later3 is halfway from last2 at.5 to4 at.75, giving.625. Later1000 saturates at1. The inverse of1 returns fitted endpoint100, losing the original1000. Quantile edges [1,2,2,4,100] merge to [1,2,4,100], three effective bins;2 enters bin index1, beginning at2. A later batch containing1000 cannot refit those edges or references. Ties can prevent equal bin populations; preserving the requested count in a label would misdescribe the actual representation.</details>

### T19. Inspect a product, a local basis and a cyclic ambiguity

Construct degree-two features for(2,3), calculate degree-one B-splines at.5 for full knots[−1,0,1,2,3], and compare angle30°/150° using one versus two trigonometric coordinates.

<details><summary>Hint</summary>List exponent pairs; at.5 only two neighboring triangles are active.</details>
<details><summary>Solution</summary>Exponent pairs(0,0),(1,0),(0,1),(2,0),(1,1),(0,2) give[1,2,3,4,6,9]. At.5, recurrence weights produce B0=.5,B1=.5,B2=0, row sum1. Coefficients[2,4,1] give3. Both angles have sine.5, but cosine is±√3/2, so [cos,sin] distinguishes them. Neither product width nor a period should be chosen from held-out outcomes. A supplied bias plus model intercept needs a parameterization decision; a duration without periodic meaning should not wrap.</details>

### T20. Separate unsmoothed full-fit and OOF codes

Use the six-row A/A/B/B/C/C table, α0 and the same alternating folds. Compute full-fit/OOF arrays, then encode an absent category from a nonempty donor set. Why did the retained short example need a successor?

<details><summary>Hint</summary>Each held fold has exactly one donor from each category in this particular fixture; the general no-match case is separate.</details>
<details><summary>Solution</summary>Full-fit codes are[1,1,0,0,.5,.5]. OOF codes are[1,1,0,0,0,1]: each C row sees the other C target. An absent category uses the donor prior even with α0; for fitting only a→1 it returns1, avoiding0/0. The retained α2 short calculation is valid for its demonstrated fixture but lacks empty/no-match validation. P9 validates those boundaries and keeps the original source/output unchanged. Smoothing and exclusion are separate: α0 does not itself decide which targets are permitted.</details>

### T21. Keep groups and time constraints explicit

There are two rows per person and monthly arrivals. An expanding two-window split validates rows2–3 from donors0–1, then4–5 from donors0–3. Which rows have training features, and can that splitter directly satisfy TargetEncoder1.9's full OOF cv contract?

<details><summary>Hint</summary>Write the coverage vector before choosing an API. Then inspect person overlap separately.</details>
<details><summary>Solution</summary>Coverage is[0,0,1,1,1,1]; only rows[2,3,4,5] have chronological OOF features, and targets must be selected by exactly those indices. Warm-up rows0–1 are not filled using future targets. TargetEncoder's internal cv requires each validation index once, so this expanding splitter violates its full-row coverage contract. Fit/transform manually per window and return the aligned subset, as P9 does. Also require max donor time&lt;min held time; if the two rows per person straddle a boundary, exclude that person's donor row too or choose a group/time design matching the question. Random group folds alone need not be chronological. Repeated validation or shared group IDs are refused by the supported checks.</details>

### T22. Break one constructed collision without claiming a theorem

The apple+/pear− bucket0 and banana+ bucket1 map sends bags(3,1,2) and(2,0,2) to[2,2]. Change the second bag's apple count to3. What changes? Does this show signed hashing is unbiased?

<details><summary>Hint</summary>Recompute bucket sums; expectation is over a specified random-map family.</details>
<details><summary>Solution</summary>The first remains[3−1,2]=[2,2]; the second becomes[3−0,2]=[3,2], separating them. Changing bucket assignment could also separate particular bags but can create another collision elsewhere. This one deterministic map does not establish an expectation theorem or remove irreversibility. The program's actual FeatureHasher token map differs from our constructed map and is printed separately. A sign changes a contribution, not its declared bucket.</details>

### T23. Complete one conditional sweep and save its route

Use the two-column table from section9, α1, a-then-b order and one-sweep cap. Work the fitting row sets, coefficients and missing updates. Transform later[3,NA] with the saved sequence. Does the cap certify convergence?

<details><summary>Hint</summary>Initialize medians[3,6]; after fitting a use its updated value in the b design.</details>
<details><summary>Solution</summary>For a, observed rows0,1,2,4 give b=[2,4,6,10],y=[1,2,3,5], β≈.4861111111, intercept≈.0763888889. Missing row3 a becomes3.9652777778. For b, observed rows0,1,3,4 now use a=[1,2,3.9652777778,5],y=[2,4,8,10]; β≈1.8232290981, intercept≈.5461393472. Row2 b becomes6.0158266415. Save both ordered models. Later[3,NA] preserves observed3 and applies the b model to give6.0158266415; it does not refit. One sweep ends at a cap, not a convergence guarantee. All observed cells must compare exactly unchanged. The answer program prints this complete table and query, with the full mechanism source already visible.</details>

<a id="t24"></a>
<!-- T24: exact original practice 9 retained below. -->
### 9. Pool estimates, not completed tables — deeper

Four completed-data analyses yield estimates `[8,10,10,12]`, each with variance 1. Find the pooled estimate and total variance using the stated rule.

<details><summary>Solution</summary>The average is 10. Squared deviations sum to 8, so $B=8/3$. Then $T=1+(1+1/4)(8/3)=13/3\approx4.3333$. Its standard error is $\sqrt{13/3}\approx2.0817$. Between-completion disagreement contributes substantial uncertainty; validity still depends on how the completions and analyses were constructed.</details>

For T24, also compare “analyze 0/2 by squaring then average” with “average0/2 then square.”

<details><summary>Hint</summary>Nonlinear analysis and averaging need not commute.</details>
<details><summary>Solution</summary>The analysis-first mean is(0²+2²)/2=2, while the square of mean input is1²=1. This is why the completed-data analyses, and their variance estimates, enter pooling. B=8/3 and T=13/3 from the retained task are variances in squared-estimate units; standard error is√(13/3). Validity still depends on the imputation/analysis models.</details>

### T25. Separate stochastic variation from an assumed sensitivity shift

Use P16's[8,10,NA,12,NA], seed20,m5. Compare seed21,m3, then δ=−2,0,2 with baseline draws fixed. State exactly which cells may change and what conclusion the sensitivity curve supports.

<details><summary>Hint</summary>Two of five values are missing; posterior parameter draws and δ have different roles.</details>
<details><summary>Solution</summary>Observed8,10,12 stay exact in every table. Changing seed/m changes simulated μ,σ² and missing draws, hence realized Q/U; it is not new sampling evidence about model accuracy. With the same seed/m, δ changes only the two missing entries, moving every completed mean by2δ/5. The seed20 pooled mean is about8.686461; δ−2 gives7.886461, δ2 gives9.486461. δ0 recovers baseline exactly, and no missing cells makes every δ a null. This is an explicit assumed departure from the marginal normal/MCAR teaching model, not an identified MNAR estimate. A proper prior or more completions does not prove universal pooled interval coverage. The full answer code prints the actual realizations and the setup records their environment.</details>

### T26. Build a representation for a new sensor task

The input has amount in declared physical units, direction in degrees, ordered grade low/medium/high, nominal device IDs and deployment gaps. All are available before the target. Use training amounts[10,20,NA,40], angles[350,10,30,150], grades[low,high,medium,low], IDs[a,a,b,missing]. Transform later amounts[30,NA], angles[359,1], grades[medium,new], IDs[c,missing]. Implement and compare one justified pipeline without turning this into a tuning campaign.

<details><summary>Hint</summary>Choose a fit-owned amount fill/ruler, period-owned circle, supplied grade order and fitted rare policy. Keep the target outside the preparation function.</details>
<details><summary>Solution</summary>An acceptable complete implementation is sensor_solution() in the answer file. Median amount20 fills training to[10,20,20,40]; its saved mean/scale standardize later30 and filled20. A stateless period360 circle supplies cosine/sine, preserving the359/1 seam. Domain-supplied grade order maps medium1 and unknown−1; monitor that unknown policy rather than pretending it is a valid lower grade. Device threshold2 yields @missing,@rare,a columns; c maps to the existing rare bucket, missing stays separate. Append one original amount-missing indicator. The output is2×8 with ordered names amount,cos_direction,sin_direction,grade,@missing,@rare,a,amount_missing. The ordinary ColumnTransformer uses the same explicitly pregrouped device policy, numeric Pipeline, FunctionTransformer and OrdinalEncoder, then appends the mask; a numerical assertion compares rows. Amount magnitude is preserved by an invertible affine map rather than row-normalized away. Direction wraps because its domain is cyclic; elapsed duration would need a separate coordinate. A rubric checks feature availability, units/period, fit/transform state, target separation, schema, unknown/missing distinctions, output comparison and deployment monitoring. Another pipeline can be acceptable if its different information choices are justified and tested.</details>

The entire answer asset below contains the indicator successor check, changed donor counterexample, nonlinear/basis/encoding/pooling examples and complete sensor implementation. It imports the new supported teaching modules in this same downloaded directory; it never imports the three old top-level mains. It is listed separately as a **solution** file so an exercise download does not reveal answers inadvertently.

**practice_solutions.py — actual new checked process.**

```python
"""Complete changed-input solutions; imports only the new supported modules.

These are answer assets, listed separately from the teaching-program index.
The original three retained programmes are never imported or replayed here.
"""
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder, FunctionTransformer
from fitted_rulers import fit_ruler, transform
from category_policies import fit_categories, encode, ordinal
from masked_simple_imputation import fit_mixed, mixed_transform, fit_fill, fill
from nan_aware_donors import fit_donors, complete
from fitted_power_maps import forward, inverse
from fitted_quantile_maps import fit_quantiles, apply
from bins_polynomials_cycles import fit_bins, membership, monomials, cycle
from local_spline_basis import fit_splines, design
from fitted_target_encoding import fit_target, transform_target, cross_encode
from signed_feature_hashing import signed_hash
from conditional_iterative_completion import fit_completion, transform_completion
from pool_scalar_analyses import pool_scalar
from normal_completion_and_sensitivity import complete_normal


def indicator_solution():
    train = np.array([[10., 100., 7.], [20., np.nan, 7.], [30., 300., 7.], [np.nan, 500., 7.]])
    categories = ['b', 'a', None, 'a']
    state = fit_mixed(train, categories)
    before = (state[0].values.copy(), state[1].center.copy(), state[1].scale.copy(), state[2].copy())
    standard = mixed_transform(state, [[15., 500., np.nan]], ['b'])
    np.testing.assert_allclose(standard, [[-1/np.sqrt(2), np.sqrt(2), 0, 0, 1, 0, 0, 0, 1]])
    after = (state[0].values, state[1].center, state[1].scale, state[2])
    assert all(np.array_equal(a, b) for a, b in zip(before, after))
    robust = mixed_transform(fit_mixed(train, categories, robust=True), [[15., 500., np.nan]], ['b'])
    return standard, robust


def sensor_solution():
    # Amount is a magnitude in declared units; direction is cyclic degrees.
    # Grade order is domain-supplied. Device ID is nominal. All are available
    # before the prediction; y is deliberately absent from preparation.
    amount = np.array([[10.], [20.], [np.nan], [40.]])
    angle = np.array([350., 10., 30., 150.])
    grade = ['low', 'high', 'medium', 'low']
    device = ['a', 'a', 'b', None]
    q_amount, q_angle = np.array([[30.], [np.nan]]), np.array([359., 1.])
    q_grade, q_device = ['medium', 'new'], ['c', None]
    imputer = fit_fill(amount, ['amount'])
    completed, _ = fill(imputer, amount, ['amount'])
    ruler = fit_ruler(completed, ['amount'])
    category = fit_categories(device, min_count=2)
    filled, mask = fill(imputer, q_amount, ['amount'])
    onehot, names = encode(category, q_device, unknown='infrequent_if_exist')
    scratch = np.column_stack([transform(ruler, filled, ['amount']), cycle(q_angle),
                               ordinal(q_grade, ['low', 'medium', 'high']), onehot, mask])
    # Group using the same explicit fitted custom policy before ordinary
    # one-hot encoding; sklearn native rare grouping differs for missing.
    prepared_device = ['a', 'a', '@rare', '@missing']
    query_device = ['@rare', '@missing']
    X = np.column_stack([amount, angle, grade, prepared_device]).astype(object)
    Q = np.column_stack([q_amount, q_angle, q_grade, query_device]).astype(object)
    library = ColumnTransformer([
        ('amount', Pipeline([('fill', SimpleImputer(strategy='median')),
                             ('scale', StandardScaler())]), [0]),
        ('direction', FunctionTransformer(lambda X: cycle(np.asarray(X[:, 0], float)), validate=False), [1]),
        ('grade', OrdinalEncoder(categories=[['low', 'medium', 'high']],
                                 handle_unknown='use_encoded_value', unknown_value=-1), [2]),
        ('device', OneHotEncoder(categories=[list(category.vocabulary)],
                                 handle_unknown='ignore', sparse_output=False), [3]),
    ]).fit(X)
    ordinary = np.column_stack([library.transform(Q), np.isnan(q_amount)])
    np.testing.assert_allclose(scratch, ordinary, atol=1e-12)
    assert scratch.shape == (2, 8)
    return scratch, ('amount', 'cos_direction', 'sin_direction', 'grade', *names, 'amount_missing')


if __name__ == '__main__':
    print('T7 standard/robust:', [np.round(x, 6).tolist() for x in indicator_solution()])
    print('T12 equal predictions:', np.dot([1., 100.], [1., .01]), np.dot([1., 1.], [1., 1.]))
    trap = fit_donors([[0., 0., np.nan], [2., 100., 100.], [3., 0., 200.]])
    original, trace = complete(trap, [[1., np.nan, np.nan]], k=1)
    forbidden, _ = complete(trap, [[1., original[0, 1], np.nan]], k=1)
    print('T14 original/feedback:', original.tolist(), forbidden.tolist(), trace)
    print('T17 near-zero/inverse:', forward([4.], 1e-9, 'box-cox').tolist(), inverse([np.log(4.)], 0., 'box-cox').tolist())
    state = fit_quantiles([[1.], [2.], [2.], [4.], [100.]], ['x'])
    print('T18 quantile/bin:', apply(state, [[3.], [1000.]], ['x']).ravel().tolist(), membership([2.], fit_bins([1., 2., 2., 4., 100.], 4, 'quantile')).tolist())
    print('T19 products/basis/cycle:', monomials([[2., 3.]])[0].tolist(), design(fit_splines([0., 1., 2.]), [.5]).tolist(), np.round(cycle([30., 150.]), 6).tolist())
    c, y = ['A', 'A', 'B', 'B', 'C', 'C'], np.array([1., 1., 0., 0., 1., 0.])
    splits = [(np.array([1, 3, 5]), np.array([0, 2, 4])), (np.array([0, 2, 4]), np.array([1, 3, 5]))]
    print('T20 alpha0 full/OOF:', transform_target(fit_target(c, y, 0.), c).tolist(), cross_encode(c, y, splits, alpha=0.)['encoded'].tolist())
    mapping = {'apple': (0, 1), 'pear': (0, -1), 'banana': (1, 1)}
    print('T22 collision changed count:', signed_hash([{'apple': 3, 'pear': 1, 'banana': 2}, {'apple': 3, 'banana': 2}], 2, mapping)[0].toarray().tolist())
    fitted, completed, trace = fit_completion([[1., 2.], [2., 4.], [3., np.nan], [np.nan, 8.], [5., 10.]], max_iter=1)
    print('T23 one sweep/new:', np.round(completed, 6).tolist(), np.round(transform_completion(fitted, [[3., np.nan]]), 6).tolist())
    print('T24 pooled:', pool_scalar([8., 10., 10., 12.], [1.]*4))
    for delta in [-2., 0., 2.]:
        print('T25 delta:', delta, complete_normal([8., 10., np.nan, 12., np.nan], delta=delta)['pooled']['estimate'])
    matrix, names = sensor_solution()
    print('T26 columns:', names, 'rows:', np.round(matrix, 6).tolist())
```

Whole recorded stdout (exact captured new stdout bytes):

```text
T7 standard/robust: [[[-0.707107, 1.414214, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]], [[-1.0, 2.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]]]
T12 equal predictions: 2.0 2.0
T14 original/feedback: [[1.0, 0.0, 100.0]] [[1.0, 0.0, 200.0]] [{'row': 0, 'target': 1, 'donors': [0], 'distance': [1.7320508075688772, 1.7320508075688772, 3.4641016151377544], 'reason': 'selected target-observed donors', 'value': 0.0}, {'row': 0, 'target': 2, 'donors': [1], 'distance': [1.7320508075688772, 1.7320508075688772, 3.4641016151377544], 'reason': 'selected target-observed donors', 'value': 100.0}]
T17 near-zero/inverse: [1.3862943620807966] [4.0]
T18 quantile/bin: [0.625, 1.0] [1]
T19 products/basis/cycle: [[1.0, 2.0, 3.0, 4.0, 6.0, 9.0]] [[0.5, 0.5, 0.0]] [[0.866025, 0.5], [-0.866025, 0.5]]
T20 alpha0 full/OOF: [1.0, 1.0, 0.0, 0.0, 0.5, 0.5] [1.0, 1.0, 0.0, 0.0, 0.0, 1.0]
T22 collision changed count: [[2.0, 2.0], [3.0, 2.0]]
T23 one sweep/new: [[1.0, 2.0], [2.0, 4.0], [3.0, 6.015827], [3.965278, 8.0], [5.0, 10.0]] [[3.0, 6.015827]]
T24 pooled: {'m': 4, 'estimate': 10.0, 'within': 1.0, 'between': 2.6666666666666665, 'simulation': 0.6666666666666666, 'total': 4.333333333333333, 'standard_error': 2.0816659994661326}
T25 delta: -2.0 7.886461347735443
T25 delta: 0.0 8.686461347735442
T25 delta: 2.0 9.486461347735442
T26 columns: ('amount', 'cos_direction', 'sin_direction', 'grade', '@missing', '@rare', 'a', 'amount_missing') rows: [[0.688247, 0.999848, -0.017452, 1.0, 0.0, 1.0, 0.0, 0.0], [-0.229416, 0.999848, 0.017452, -1.0, 1.0, 0.0, 0.0, 1.0]]
```



<a id="11-readiness-and-the-next-connection"></a>
## 11. Readiness and the next connection

You are ready for the next core topic when you can take a new row, identify which inputs are observed/missing/unknown, apply a fitted fill/ruler/vocabulary without changing its state, and explain how the chosen representation changes the model's comparisons. Trace row309 or a genuinely changed practice row through all output names. A count of completed sections or a model score is not a mastery test.

The deeper route adds different checks: derive a power branch and inverse; interpolate a later value using saved landmarks; build a bin/product/local basis/cyclic pair; exclude a held row's targets from both numerator and prior; distinguish full-fit inference from OOF training; preserve original observations during conditional cycling; and analyze before pooling under explicit assumptions. If one of those remains unclear, return to its actual small table or trace rather than learning another API name.

Next, [Cross-Validation & Hyperparameter Tuning](/learn/path/full-curriculum/cross-validation-hyperparameter-tuning?module=classical-ml) asks which observations may select a preparation/model and which may assess the selected procedure. Here we held one experiment fixed to inspect representations. There, each fold fits fresh preparation inside its training boundary, and selection/refit/outer assessment have separate roles. Later regularization develops the units/penalty connection, while feature selection asks which inputs should remain. Neither is a hidden prerequisite for the local mechanisms just taught.

### Further learning

These offer another explanation or a broader worked context; the lesson's core remains self-contained. The selected research readings were consumed during the accepted design stage and reused for the same claim scope here. No video was watched and no remote figure pixels were personally reviewed; a book/API link is not a claim of having read every page. The research record distinguishes substantive sections, metadata-only attribution and failed access.

- [Inria's scikit-learn course: numerical preprocessing](https://inria.github.io/scikit-learn-mooc/python_scripts/02_numerical_pipeline_scaling.html) is a practical notebook-style second account of training summaries, saved state and Pipeline. Use it after section5 and follow which table is passed to fit. Selected substantive text/code was read; unseen exercises and image pixels were not certified.
- Kuhn and Johnson's [categorical predictors](https://feat.engineering/05-Encoding_Categorical_Predictors.html), [numeric predictors](https://feat.engineering/06-Engineering_Numeric_Predictors.html) and [missing data](https://feat.engineering/08-Handling_Missing_Data.html) chapters add predictive feature-engineering context. The selected chapter5 encoding sections, chapter6 individual/basis sections and chapter8 introduction through the KNN discussion were read. Compare its normalized Box–Cox and natural-cubic conventions with ours; do not import its informal missing-percentage advice as a rule. This is a broader book route after the corresponding local section, not required first-pass homework.
- Van Buuren's [multiple imputation in a nutshell](https://stefvanbuuren.name/fimd/sec-nutshell.html) and [why and when MI works](https://stefvanbuuren.name/fimd/sec-whyandwhen.html) deepen section9's impute→analyze→pool sequence and the conditions behind its variance terms. Selected substantive procedures/conditions were read, not every later chapter. Use this specialist route before treating arbitrary completions as scientifically valid analyses.
- The official [TargetEncoder cross-fitting example](https://scikit-learn.org/stable/auto_examples/preprocessing/plot_target_encoder_cross_val.html) offers a code-and-results alternative for near-unique-category overfitting. Its selected source/example context is inherited from the baseline research; its experiment is not our new benchmark. Follow where fit_transform differs from transform and how the model receives its training features.

### Technical references and attribution

Use a reference to verify a specific contract you can already explain. APIs below are version-sensitive; the checked Python environment is scikit-learn1.9.1/SciPy1.18.1, while the accepted research read the official1.9.1/SciPy1.18.0 documentation. Content-time local source checks inspected quantile tie/endpoint logic, spline extensions and iterative stopping, and the four official TargetEncoder/QuantileTransformer/SplineTransformer/normal-inverse-gamma pages were freshly read for their relevant parameters.

- [Preprocessing guide](https://scikit-learn.org/stable/modules/preprocessing.html): primary formulas and ordinary numeric/category/basis alternatives. [StandardScaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html), [OneHotEncoder](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html) and [OrdinalEncoder](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OrdinalEncoder.html) own their fitted-state and policy interfaces. Our scratch all-missing/near-constant/marker choices are explicitly bounded.
- [Imputation guide](https://scikit-learn.org/stable/modules/impute.html), [KNNImputer](https://scikit-learn.org/stable/modules/generated/sklearn.impute.KNNImputer.html) and [IterativeImputer](https://scikit-learn.org/stable/modules/generated/sklearn.impute.IterativeImputer.html): target-specific donors/fallbacks, indicator/empty-column choices and experimental conditional completion. An API's NaN support is not a universal missingness assumption.
- [PowerTransformer](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PowerTransformer.html) and [QuantileTransformer](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.QuantileTransformer.html): fitted parameter/landmark state and standardization/endpoint conventions. Box and Cox's [1964 original paper](https://doi.org/10.1111/j.2517-6161.1964.tb00553.x) and Yeo and Johnson's [2000 paper](https://academic.oup.com/biomet/article-abstract/87/4/954/232908) receive primary attribution; metadata/abstract access did not establish a full scanned/paywalled-body reading. Accessible official formulas and the compared canonical book support the local teaching.
- [KBinsDiscretizer](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.KBinsDiscretizer.html), [KMeans](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html), [PolynomialFeatures](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PolynomialFeatures.html) and [SplineTransformer](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.SplineTransformer.html): explicit percentile method, supplied-centers ownership, exponent order and extended knots. KMeans owns supplied init/n_init; KBins does not. B-spline and natural-cubic boundary conditions are distinct.
- [TargetEncoder](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.TargetEncoder.html): primary reference for the training/inference distinction, target-type shape, smoothing and exactly-once cv coverage. Past-only warm-up needs a manually aligned subset rather than an invalid full-coverage claim.
- [Weinberger and colleagues' feature-hashing paper](https://arxiv.org/pdf/0902.2206v5): original signed-projection assumptions and inner-product analysis. Selected body sections2–3 and lemma text were read in the inherited research; our constructed collision is not its empirical evaluation or theorem verification.
- [mice analysis/pooling](https://amices.org/mice/reference/pool.html) and [pool.scalar](https://amices.org/mice/reference/pool.scalar.html): ordinary specialist analysis-estimate extraction, variance and degrees-of-freedom route. The optional R source has no claimed run. [SciPy normal_inverse_gamma](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.normal_inverse_gamma.html) supplies the ordinary joint distribution primitive, introduced1.15; the posterior updates are derived locally. Rubin's [1976 primary abstract/record](https://dash.harvard.edu/entities/publication/73120378-8764-6bd4-e053-0100007fdf3b) supplies historical missing-data attribution without an unseen whole-paper claim.
- [Palmer Penguins project and variables](https://allisonhorst.github.io/palmerpenguins/reference/penguins.html), by Allison Horst, Alison Hill and Kristen Gorman using Palmer Station observations collected by Gorman and colleagues: data context and CC0 availability. Our CSV preserves all observations and NA cells; the predictive task and fixed-split comparison are this lesson's controlled exercise, not a claim about all ecological populations.

### Setup and actual files

The full README, pinned direct dependencies and source-role metadata accompany the download directory. Use Python3.12 and install requirements once; keep imported helper files together. The optional R route has its separate installation/run instructions and unexecuted status. Every teaching program is shown whole with its actual retained or new output. The answer asset has a separate role. Copy and Download must use the shared controls and the exact shown file contents; a count of files cannot certify that agreement.

```shell
python -m venv .venv
# Activate .venv for your platform, then:
python -m pip install -r requirements.txt
python fitted_rulers.py
```

| Actual file | Purpose | Bytes |
| --- | --- | ---: |
| [fitted_preparation.py](programs/fitted_preparation.py) | exact retained whole historical programme; no replay | 3634 |
| [fitted_preparation.stdout.txt](programs/fitted_preparation.stdout.txt) | exact historical stdout literal | 213 |
| [fitted_rulers.py](programs/fitted_rulers.py) | complete new constructed teaching programme | 5853 |
| [fitted_rulers.stdout.txt](programs/fitted_rulers.stdout.txt) | exact captured new stdout bytes | 664 |
| [category_policies.py](programs/category_policies.py) | complete new constructed teaching programme | 5466 |
| [category_policies.stdout.txt](programs/category_policies.stdout.txt) | exact captured new stdout bytes | 521 |
| [masked_simple_imputation.py](programs/masked_simple_imputation.py) | complete new constructed teaching programme | 5330 |
| [masked_simple_imputation.stdout.txt](programs/masked_simple_imputation.stdout.txt) | exact captured new stdout bytes | 392 |
| [nan_aware_donors.py](programs/nan_aware_donors.py) | complete new constructed teaching programme | 5144 |
| [nan_aware_donors.stdout.txt](programs/nan_aware_donors.stdout.txt) | exact captured new stdout bytes | 514 |
| [penguins_prepare.py](programs/penguins_prepare.py) | exact retained whole historical programme; no replay | 2296 |
| [penguins_prepare.stdout.txt](programs/penguins_prepare.stdout.txt) | exact historical stdout literal | 343 |
| [fitted_power_maps.py](programs/fitted_power_maps.py) | complete new constructed teaching programme | 6558 |
| [fitted_power_maps.stdout.txt](programs/fitted_power_maps.stdout.txt) | exact captured new stdout bytes | 592 |
| [fitted_quantile_maps.py](programs/fitted_quantile_maps.py) | complete new constructed teaching programme | 3612 |
| [fitted_quantile_maps.stdout.txt](programs/fitted_quantile_maps.stdout.txt) | exact captured new stdout bytes | 408 |
| [fitted_target_encoding.py](programs/fitted_target_encoding.py) | complete new constructed teaching programme | 6049 |
| [fitted_target_encoding.stdout.txt](programs/fitted_target_encoding.stdout.txt) | exact captured new stdout bytes | 601 |
| [bins_polynomials_cycles.py](programs/bins_polynomials_cycles.py) | complete new constructed teaching programme | 6190 |
| [bins_polynomials_cycles.stdout.txt](programs/bins_polynomials_cycles.stdout.txt) | exact captured new stdout bytes | 746 |
| [bins_polynomials_cycles.stderr.txt](programs/bins_polynomials_cycles.stderr.txt) | exact actual diagnostic, separate from stdout | 281 |
| [local_spline_basis.py](programs/local_spline_basis.py) | complete new constructed teaching programme | 5699 |
| [local_spline_basis.stdout.txt](programs/local_spline_basis.stdout.txt) | exact captured new stdout bytes | 1410 |
| [cross_fit.py](programs/cross_fit.py) | exact retained whole historical programme; no replay | 789 |
| [cross_fit.stdout.txt](programs/cross_fit.stdout.txt) | exact historical stdout literal | 111 |
| [signed_feature_hashing.py](programs/signed_feature_hashing.py) | complete new constructed teaching programme | 2938 |
| [signed_feature_hashing.stdout.txt](programs/signed_feature_hashing.stdout.txt) | exact captured new stdout bytes | 545 |
| [conditional_iterative_completion.py](programs/conditional_iterative_completion.py) | complete new constructed teaching programme | 5111 |
| [conditional_iterative_completion.stdout.txt](programs/conditional_iterative_completion.stdout.txt) | exact captured new stdout bytes | 2240 |
| [pool_scalar_analyses.py](programs/pool_scalar_analyses.py) | complete new constructed teaching programme | 1709 |
| [pool_scalar_analyses.stdout.txt](programs/pool_scalar_analyses.stdout.txt) | exact captured new stdout bytes | 726 |
| [normal_completion_and_sensitivity.py](programs/normal_completion_and_sensitivity.py) | complete new constructed teaching programme | 4181 |
| [normal_completion_and_sensitivity.stdout.txt](programs/normal_completion_and_sensitivity.stdout.txt) | exact captured new stdout bytes | 1117 |
| [multiple_imputation_mice.R](programs/multiple_imputation_mice.R) | complete optional ordinary R source; unexecuted | 1442 |
| [practice_solutions.py](programs/practice_solutions.py) | complete changed-task answer asset | 6513 |
| [practice_solutions.stdout.txt](programs/practice_solutions.stdout.txt) | exact captured new stdout bytes | 1552 |
| [penguins.csv](programs/penguins.csv) | retained actual CRLF data; CC0 | 15586 |
| [calculated-inputs.json](programs/calculated-inputs.json) | retained full split/fit/prediction/transformed-row inputs | 43077 |
| [scaling-native.json](programs/scaling-native.json) | retained historical native receipt | 2506 |
| [source-roles.json](programs/source-roles.json) | exact source/stream/data roles | 16412 |
| [README.md](programs/README.md) | complete setup, run and Copy/Download contract | 4381 |
| [requirements.txt](programs/requirements.txt) | actual tested direct dependency pins | 61 |

Current CSV SHA-256: `79995be0ba7a6df1e9309e399a23438c0854f959d29950885dafb94ab881be68`; historical LF execution-input SHA-256: `f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93`. Exact newline normalization relates the two; it is not a new numerical run.

The source-role record binds exact current-download and historical-executed CSV identities, three retained source/stdout pairs, new successful sources/streams, failed attempts and explicit unexecuted R status. Programs are complete offline assets; fixtures in them are declared constructed examples. Real-data numerical evidence remains historical with its original split, inputs and versions. Full runtime drawings, keyboard/pointer/narrow viewing, independent runtime review and publication belong to a later phase; the current content packet specifies their actual objects and behavior without claiming those surfaces were rendered.
