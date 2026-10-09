# PCA & Dimensionality Reduction

Can we replace a record's many measurements with a few coordinates, while keeping enough information for our purpose? Principal component analysis, or PCA, gives a precise answer for one purpose: retain as much squared variation as possible, or equivalently lose as little squared reconstruction distance as possible, under a chosen measurement scale. We will first build that answer with four records, then use real Wine measurements to decide what to scale, retain and diagnose.

You need arrays, addition, multiplication and a squared distance. We refresh the geometry before using matrix notation. [Eigenvalues & Eigenvectors, section 5](/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations#5-find-a-direction-that-retains-variation) and [Matrix Decompositions, section 5](/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations#5-svd-follow-independent-stretches) offer a second route to the direction calculations. The local explanation supplies the observation-to-coordinate-to-reconstruction workflow.

## 1. Can we keep fewer numbers without losing the pattern?

Begin with one instrument record: which measurements must remain paired when we turn records into coordinates?

<!-- visual:D01 -->

Each instrument record has two measurements. Record A contains `(1,1)`, B `(2,0)`, C `(4,4)` and D `(5,3)`. The row labels connect each physical record to one row of the table; the column labels connect the first and second measurements to their corresponding entries. A **feature** is one measured attribute. An **observation** is a record with values for those features. Here there are four observations and two features: `n=4`, `d=2`. Reducing the number of features does not reduce the number of observations.

<!-- visual:D02 -->

A's first measurement puts it at the horizontal tick 1; its second measurement puts it at vertical tick 1. The other three rows become points in exactly the same way. The paired values matter: sorting each column independently would destroy which measurements belonged together. These are constructed measurements for tracing the method, rather than evidence of an empirical cluster.

Two stored numbers locate a point exactly. Imagine laying one ruler through the cloud and storing just a reading along that ruler for each record. This could save space, but points beside the ruler would need an approximation when we recover them.

<!-- visual:D03 -->

The four reading slots are empty because we have not yet calculated the readings. Someone receiving those slots would also need the shared ruler's direction and its reference location. The recovered scatter beside them is a storage preview, not a calculated result. Keeping only one reading cannot retain every original coordinate. Which ruler and reference should we choose? We first put the reference in the middle, then calculate what each ruler would retain.

## 2. Rotate the ruler, then keep its readings

The storage preview needs a shared reference; placing it at the four-record mean lets the ruler describe spread rather than the cloud's location.

<!-- visual:D04 -->

The average first measurement is `(1+2+4+5)/4=3`; the average second is `(1+0+4+3)/4=2`. The marked reference location is therefore `(3,2)`, the **mean**. We denote this vector by `μ`. A's displacement from it is `(1−3,1−2)=(−2,−1)`. Applying the same subtraction to each record gives:

| Record | Original measurements | Centered displacement |
|---|---|---|
| A | (1,1) | (−2,−1) |
| B | (2,0) | (−1,−2) |
| C | (4,4) | (1,2) |
| D | (5,3) | (2,1) |

The centered columns each sum to zero. Moving the origin removes the common location while preserving distances between records. A line constrained to the original origin would answer a different question: it could spend its direction explaining where the whole cloud sits, rather than its variation around the middle.

<!-- visual:D05 -->

Use a ruler tilted 45° toward the upper right. Its unit direction has coefficients `(1/√2,1/√2)`; call it `v₁`. A unit direction has squared length 1, so a reading along it uses the same distance scale as the measurement axes. Multiply A's horizontal displacement by the first coefficient and its vertical displacement by the second, then add:

\[
z_A=(-2)(1/\sqrt2)+(-1)(1/\sqrt2)=-3/\sqrt2.
\]

This multiply-and-add is a **dot product**. The negative sign says A lies behind the reference along this oriented ruler. Its reading, or **score**, is one scalar. It is different from the two-coordinate point where A meets the ruler. Changing the ruler's orientation to its opposite would reverse the score's sign too.

<!-- visual:D06 -->

To return from a score, move `z_A` units along the unit direction. The centered recovered vector is `z_Av₁=(−1.5,−1.5)`. Restore the mean to get `(1.5,.5)`. The remaining displacement from that recovered point to the original A is `(−.5,.5)`. This **residual** is perpendicular to the ruler: its dot product with the direction is `−.5/√2+.5/√2=0`. That cancellation distinguishes an orthogonal projection from an arbitrary guess on a line.

The same operations fill the preview's four reading slots and recovered rows:

| Record | Score on v₁ | Recovered measurements | Residual |
|---|---|---|---|
| A | −3/√2 | (1.5,.5) | (−.5,.5) |
| B | −3/√2 | (1.5,.5) | (.5,−.5) |
| C | 3/√2 | (4.5,3.5) | (−.5,.5) |
| D | 3/√2 | (4.5,3.5) | (.5,−.5) |

A and B share the same score despite having different original measurements. The stored coordinate cannot tell which of those two points produced it. The approximation makes that lost distinction concrete.

For a centered point `a=x−μ` and a unit direction `v`, the two operations are now familiar:

\[
z=a\cdot v,\qquad \hat x=\mu+zv,\qquad r=x-\hat x.
\]

<!-- visual:D07 -->

Rotate the ruler while keeping these four records fixed. At 45° the squared readings sum to 18 and the squared residuals sum to 2. A horizontal ruler keeps 10 and loses 10; the perpendicular 135° ruler keeps 2 and loses 18. Every angle divides the same centered total 20. The live angle changes all readings and perpendicular feet together; Reset returns 45°. The useful direction is the one that retains the largest sum of squared readings. We will explain why that also minimizes loss in the next section.

<!-- visual:D08 -->

Now ask a different question: what if a measurement changes? Select a record and edit its two measurements. Its label and hue stay attached to its row and marker as the miniature four-record mean and leading ruler are recalculated. This investigation refits only this constructed fixture; it is separate from rotating a fixed ruler. If every row becomes identical, all centered values are zero: there is no nonzero spread or preferred direction, and a variance fraction has no denominator. Reset restores the original rows and selection.

<!-- visual:D09 -->

The perpendicular direction `v₂=(1,−1)/√2` supplies a second reading. Together these two orthonormal directions form a rotated coordinate system. Keeping both readings recovers every point; keeping just the first discards the second; keeping none returns the shared mean. The kept count is `k`. The dropped coordinate track remains visible so we can see exactly which multiplication is omitted. Storage needs both per-record readings and the shared retained directions and mean.

## 3. Why maximum spread and minimum loss give the same answer

The ruler retained 18 and lost 2; the perpendicular foot lets us account for both pieces of the same squared distance.

<!-- visual:D10 -->

A's centered displacement has squared length `(-2)²+(-1)²=5`. Its projection has squared length `(-1.5)²+(-1.5)²=4.5`; its residual has squared length `(-.5)²+.5²=.5`. The perpendicular triangle and its area squares show `5=4.5+.5`. The numbers label square **areas**: the residual square's side is `√.5`, rather than `.5`. Repeating the calculation for the four records gives `20=18+2`.

The same right-triangle identity holds for every fixed unit ruler. If `a=zv+r`, with `v·r=0`, expanding the square gives

\[
\|a\|^2=z^2\|v\|^2+2z(v\cdot r)+\|r\|^2=z^2+\|r\|^2.
\]

Summing over a fixed centered table makes the left side constant. Increasing retained squared length must decrease residual squared length by exactly the same amount. This equivalence assumes the same rows and the same feature weighting on both sides. Changing the measurement scale changes the total and the optimization question.

<!-- visual:D11 -->

The first scores have mean 0 and squared sum 18. Dividing by `n−1=3` gives sample variance 6. The second scores have squared sum 2 and sample variance `2/3`. A population-style denominator `n=4` instead gives 4.5 and .5. Both conventions produce the same directions and the same variance fractions `18/20=.9` and `2/20=.1`; their variance units differ by the common factor.

Reconstruction errors have another set of denominators. The sum of squared residuals, **SSE**, is 2; average squared distance per observation is `2/4=.5`; mean squared error per measurement entry is `2/(4·2)=.25`. Always name the denominator. A plot labelled only “error” conceals which quantity it shows.

<!-- visual:D12 -->

We can organize the feature cross-products in a **covariance matrix**. A's centered x and y contribute `(-2)(-1)=2`; B contributes 2, C contributes 2 and D contributes 2, giving the sum `2+2+2+2=8`. Each diagonal sum of feature squares is 10. Divide each sum by 3:

\[
C=\frac1{n-1}A^TA=\frac13\begin{bmatrix}10&8\\8&10\end{bmatrix}.
\]

Here `A` names the centered row table; `T` turns rows into columns for multiplication. `C` is a 2×2 relation between features, rather than a 4×4 relation between records. Its off-diagonal entry arises from matching the same record across the two columns.

<!-- visual:D13 -->

Multiplying `C` by the diagonal unit ruler gives two outputs `(10+8)/(3√2)=6/√2`. Thus `Cv₁=6v₁`: the action stretches this direction by 6. A direction preserved by the matrix action is an **eigenvector**; the stretch is its **eigenvalue**. Taking another dot product gives `v₁ᵀCv₁=6`, exactly the sample variance of the scores. The horizontal candidate gives `10/3`, so finding an eigenvector is useful only if we choose the largest appropriate eigenvalue. The full optimum proof follows in section 10.1.

<!-- visual:D14 -->

The diagonal covariance entries sum to `20/3`. This sum, called the **trace**, is total sample variance. Keeping 6 leaves `20/3−6=2/3`; multiplying by 3 restores discarded SSE 2. The geometric triangles, the score square sums and covariance bookkeeping are three descriptions of the same retained-versus-lost quantity. None measures all information relevant to every task.

## 4. Fit once, project, and reconstruct in Python

The dot-product and return operations now define a reusable fitted object: which values may a later query read, and which must it leave fixed?

<!-- visual:D15 -->

Training calculates the mean and directions. A later query uses those already-fitted values; it does not move the mean or become another training row. Store direction vectors as the rows of a `k×d` array `D`. With observations in rows, the fitted operations are

\[
A=X-\mu,\quad Z=AD^T,\quad \hat X=ZD+\mu.
\]

For one query with two measurements and one retained direction, the ports are `1×2 → 1×1 → 1×2`. The transpose puts the direction's two coefficients into the column that the query row multiplies. `Z` stores scores, while `D` stores the shared decoder; they have different meanings despite both being numerical arrays.

<!-- visual:D16 -->

The later measurement `(6,4)` becomes `(3,2)` after subtracting the fitted mean. Its reading is `3/√2+2/√2=5/√2`. Return along the same ruler to `(2.5,2.5)`, then restore the mean to `(5.5,4.5)`. The residual is `(.5,−.5)`, squared length .5. Editing the query changes that arithmetic but leaves the fitted mean and direction fixed. A query at the mean has reading 0; a query outside the training range is projected without silently clipping it.

<!-- visual:D17 -->

We have calculated what a direction does. **Singular value decomposition**, SVD, is a maintained numerical primitive that finds orthogonal directions and their dataset energy without first forming covariance. It writes the centered table as `A=U S Vᵀ`. `V` contains feature directions in columns, so the Python return `Vh=Vᵀ` contains them in rows. `S` contains nonnegative singular values; `U` contains normalized observation patterns. In this fixture `s₁=√18`, `u₁=(-.5,-.5,.5,.5)`, and multiplying `s₁u₁` recovers the four first scores. The second singular value is `√2`.

The concise original example below centers, decomposes, selects the first direction and decodes. It is followed by a reusable version that exposes fitted state and query operations. Its output is retained from the original execution; it is not a newly measured Wine or Gaussian result.

<!-- complete-program:original-programs/svd.py -->

`svd.py` — complete program.

```python
import numpy as np

X = np.array([[1., 1.], [2., 0.], [4., 4.], [5., 3.]])
mean = X.mean(axis=0)
centered = X - mean
_, singular_values, directions = np.linalg.svd(centered, full_matrices=False)

k = 1
kept_directions = directions[:k]       # shape: (k, d)
scores = centered @ kept_directions.T # shape: (n, k)
reconstructed = scores @ kept_directions + mean
variances = singular_values**2 / (len(X) - 1)

print(np.round(variances, 4))
print(np.round(variances / variances.sum(), 4))
print(np.round(reconstructed, 4))
print(round(np.mean((X - reconstructed)**2), 4))
```

Retained historical output:

```text
[6.     0.6667]
[0.9 0.1]
[[1.5 0.5]
 [1.5 0.5]
 [4.5 3.5]
 [4.5 3.5]]
0.25
```

`centered=X−mean` establishes the same displacements we traced. `Vh[:k]` keeps direction rows; `centered @ directions.T` makes scores; `scores @ directions + mean` restores points. The printed variances 6 and `2/3` use `n−1`; the entryMSE is .25. An SVD routine supplies factorization, rather than hiding the PCA assembly inside a fitted PCA estimator.

The complete reusable program below copies the input, stores the mean/directions/variances, reports a numerical rank and exposes transform/inverse methods. Direction rows contain only the retained `k` axes; its singular-value, variance and fraction diagnostics describe the whole computed thin spectrum. The numerical floor `eps·max(n,d)·smax` is a floating-point rank diagnostic, not a scientific signal threshold. Its scores use the original projected-distance metric throughout; section 10.3 adds a separate complete adapter after explaining how and why that metric changes. Constant centered energy reports an undefined variance-share value rather than dividing by zero; `k=0` returns the mean.

<!-- complete-program:centered_pca.py -->

`centered_pca.py` — complete program.

```python
"""Centered PCA assembly using a maintained dense SVD primitive, N1."""

from dataclasses import dataclass
import numpy as np


def real_table(values, features=None):
    raw = np.asarray(values)
    if raw.ndim != 2 or np.iscomplexobj(raw) or not np.issubdtype(raw.dtype, np.number):
        raise ValueError("Expected a real numerical row-by-feature table")
    table = np.array(raw, dtype=np.float64, copy=True)
    if not np.isfinite(table).all() or table.shape[1] == 0:
        raise ValueError("Expected finite values and at least one feature")
    if features is not None and table.shape[1] != features:
        raise ValueError("Query feature count differs from the fitted table")
    return table


@dataclass(frozen=True)
class CenteredPCA:
    mean: np.ndarray
    directions: np.ndarray
    singular_values: np.ndarray
    variances: np.ndarray
    total_energy: float
    numerical_rank: int
    rank_threshold: float
    n: int

    @classmethod
    def fit(cls, values, k):
        x = real_table(values)
        n, d = x.shape
        if (
            n < 2
            or isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k <= min(n, d)
        ):
            raise ValueError("Need n>=2 and integer 0<=k<=min(n,d)")
        mean = x.mean(axis=0)
        centered = x - mean
        if not np.isfinite(centered).all():
            raise ValueError("Centering overflowed; rescale the input")
        _, singular_values, vh = np.linalg.svd(centered, full_matrices=False)
        variances = singular_values**2 / (n - 1)
        energy = float(np.sum(centered * centered))
        if not np.isfinite(variances).all() or not np.isfinite(energy):
            raise ValueError("Squared energy overflowed; rescale the input")
        threshold = np.finfo(float).eps * max(n, d) * singular_values[0]
        rank = int(np.count_nonzero(singular_values > threshold))
        directions = vh[:k].copy()
        # Orient signs only for readable output; reconstructing is sign-invariant.
        for direction in directions:
            pivot = np.argmax(np.abs(direction))
            if direction[pivot] < 0:
                direction *= -1
        for array in (mean, directions, singular_values, variances):
            array.setflags(write=False)
        return cls(
            mean,
            directions,
            singular_values,
            variances,
            energy,
            rank,
            threshold,
            n,
        )

    @property
    def variance_ratios(self):
        if self.total_energy == 0:
            return None
        return self.singular_values**2 / self.total_energy

    def transform(self, values):
        x = real_table(values, self.mean.size)
        scores = (x - self.mean) @ self.directions.T
        if not np.isfinite(scores).all():
            raise ValueError("Projection overflowed; rescale the query")
        return scores

    def inverse_transform(self, values):
        scores = (
            real_table(values, self.directions.shape[0])
            if self.directions.shape[0]
            else np.asarray(values, dtype=float)
        )
        if (
            scores.ndim != 2
            or scores.shape[1] != self.directions.shape[0]
            or not np.isfinite(scores).all()
        ):
            raise ValueError("Expected finite q-by-k scores, including q-by-0 when k=0")
        recovered = scores @ self.directions + self.mean
        if not np.isfinite(recovered).all():
            raise ValueError("Decoding overflowed; rescale the scores")
        return recovered

    def projector(self):
        return self.directions.T @ self.directions


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    fitted = CenteredPCA.fit(x, 1)
    scores = fitted.transform(x)
    recovered = fitted.inverse_transform(scores)
    print("mean", fitted.mean)
    print("directions", fitted.directions)
    print("variances", fitted.variances)
    print("variance_ratios", fitted.variance_ratios)
    print("scores", scores)
    print("reconstructed", recovered)
    print("entry_mse", np.mean((x - recovered) ** 2))
    queries = np.array([[6, 4], [8, 4], [3, 2]], dtype=float)
    print("queries_reconstructed", fitted.inverse_transform(fitted.transform(queries)))
    ordinary = PCA(n_components=1, svd_solver="full").fit(x)
    print(
        "library_reconstruction_equal",
        np.allclose(recovered, ordinary.inverse_transform(ordinary.transform(x))),
    )
    full = CenteredPCA.fit(x, 2)
    print("k2_roundtrip", np.allclose(full.inverse_transform(full.transform(x)), x))
    mean_only = CenteredPCA.fit(x, 0)
    print("k0_scores_shape", mean_only.transform(x).shape)
    print("k0_reconstructed", mean_only.inverse_transform(mean_only.transform(x)))
    constant = CenteredPCA.fit(np.full((4, 2), 3.0), 0)
    print("constant_rank_and_ratios", constant.numerical_rank, constant.variance_ratios)


if __name__ == "__main__":
    main()
```

Selected recorded reference output; same operations as the recorded calculation:

```text
mean [3. 2.]
directions [[0.707107 0.707107]]
variances [6.       0.666667]
variance_ratios [0.9 0.1]
scores [[-2.12132]
 [-2.12132]
 [ 2.12132]
 [ 2.12132]]
reconstructed [[1.5 0.5]
 [1.5 0.5]
 [4.5 3.5]
 [4.5 3.5]]
entry_mse 0.25
queries_reconstructed [[5.5 4.5]
 [6.5 5.5]
 [3.  2. ]]
library_reconstruction_equal True
k2_roundtrip True
k0_scores_shape (4, 0)
k0_reconstructed [[3. 2.]
 [3. 2.]
 [3. 2.]
 [3. 2.]]
constant_rank_and_ratios 0 None
```

The new constructed main uses our four rows and fixed later queries. It prints .25 for entryMSE, `(5.5,4.5)` for the first query, and a full two-coordinate round trip. Its library comparison fixes `PCA(n_components=1, svd_solver="full")` on the same constructed rows, then compares recovered values. Signed vectors can differ without changing the recovered table, because reversing a direction also reverses its score. At a tied boundary even the kept projector can differ; compare the applicable invariant rather than raw factor entries.

The original library continuation is preserved separately. It expects `np` and `X` from the original `svd.py`, so run that exact predecessor in the same namespace before the continuation, for example `exec(Path("svd.py").read_text(), namespace)` followed by the same operation for `library.py`, after importing `Path` from `pathlib` and creating `namespace={}`. This complete continuation recipe is for the four constructed rows. The reusable new program above is independently runnable without this historical namespace.

<!-- complete-program:original-programs/library.py -->

`library.py` — complete program.

```python
# Continue the NumPy program above: X, mean and directions are already defined.
from sklearn.decomposition import PCA

pca = PCA(n_components=1, svd_solver="full")
scores = pca.fit_transform(X)
reconstructed = pca.inverse_transform(scores)

new_observation = np.array([[6., 4.]])
new_scores = pca.transform(new_observation)
new_reconstruction = pca.inverse_transform(new_scores)

print(pca.components_.shape, scores.shape)
print(np.round(new_reconstruction, 4))
```

Retained historical output:

```text
(1, 2) (4, 1)
[[5.5 4.5]]
```

The ordinary estimator's `mean_` matches `mean`; `components_` matches direction rows; `transform` subtracts the fitted mean and makes scores; `inverse_transform` returns along those rows and restores the mean. It centers but does not standardize the features. Fit this dense route costs roughly `O(nd·min(n,d))`; fitted state needs the `kd` directions and `d` mean entries plus diagnostic values. Projecting or decoding `q` queries costs `O(qdk)`. Choosing a faster approximate or batch method will change the computational contract, which we examine later. First we must decide which measurement differences deserve equal weight.

## 5. Scaling changes which differences matter

The fitted direction depends on squared distances. The same physical measurement expressed in a different unit changes its numerical difference, and squaring magnifies that change.

<!-- visual:D18 -->

Take four rectangle corners `(−2,−1),(−2,1),(2,−1),(2,1)`, centered at 0. Their x-coordinate squares sum to 16; their y-coordinate squares sum to 4. If we express y in units giving readings `m·y`, the second sum becomes `4m²`. The underlying four records have not acquired a new physical relationship; we have changed how expensive their errors are in the numerical metric. A positive feature weight `w` can be implemented by multiplying its coordinate by `√w`, since `(√w·r)²=w·r²`.

<!-- visual:D19 -->

Both lanes show the same records at the current unit multiplier. At `m=1`, raw PCA chooses the horizontal axis and retains `16/(16+4)=.8`. At `m=2` both sums are 16: any unit ruler is an equally good first direction. At `m=10`, the vertical axis retains `400/416=25/26`. In the standardized lane, dividing by the fitted population-style scales `2` and `m` always produces the square `(±1,±1)`. Its two coordinate energies are 4 and 4 for every positive multiplier, so there is no unique first direction and every one-coordinate optimum retains half the energy. Neither lane hides this tie behind a preferred diagonal arrow.

The live multiplier changes both lanes immediately; Reset returns 1. Exact equality at 2 is a mathematical tie. The numerical adapter reports a tie when its eigenvalue gap is at most `1e−12` times the larger absolute eigenvalue. This declared finite-arithmetic decision is different from asserting that two physical variances are exactly equal. Standardization changes the objective; it does not reveal a uniquely correct metric for every purpose.

<!-- visual:D20 -->

Fit a mean and scale to each training column. Subtract its mean, square the centered values, average with denominator `n`, and take the square root. The standardized value is `(x−μ)/s`. To restore an approximate measurement, multiply by the same stored scale and add the same stored mean. A constant training feature has zero centered spread; this route stores effective scale 1 so its training standardized values remain 0. A later query can differ from that constant: scale 1 preserves its difference rather than silently deleting the feature.

`PopulationScaler` below follows those operations. It rejects missing values in its scratch route; the separately complete ordinary pipeline imputes training means, then fits scaler/PCA on that same training table. Its future query uses those stored imputation/scaling values. Mean imputation encodes a missingness decision; it does not establish that missingness is harmless. Constant or nearly constant column policies can differ in a library's numerical safeguards, so the matched ordinary comparisons here use the stated finite moderate-scale fixtures. Zero metric weights would delete a feature and prevent this inverse scaling; negative weights do not define the squared-distance metric.

<!-- complete-program:pca_metrics.py -->

`pca_metrics.py` — complete program.

```python
"""N3: training-only scaling and the metric that PCA sees."""

from dataclasses import dataclass
import numpy as np

from centered_pca import CenteredPCA, real_table


@dataclass(frozen=True)
class PopulationScaler:
    mean: np.ndarray
    scale: np.ndarray
    constant: np.ndarray

    @classmethod
    def fit(cls, values):
        x = real_table(values)
        if x.shape[0] == 0:
            raise ValueError("At least one training row is required")
        mean = x.mean(axis=0)
        centered = x - mean
        # Center first: E[X**2] - E[X]**2 loses small spreads at large offsets.
        variance = np.mean(centered**2, axis=0)
        if not np.isfinite(mean).all() or not np.isfinite(variance).all():
            raise ValueError("Scaling overflowed; rescale the measurements")
        constant = variance == 0
        scale = np.sqrt(variance)
        scale[constant] = 1.0
        for array in (mean, scale, constant):
            array.setflags(write=False)
        return cls(mean, scale, constant)

    def transform(self, values):
        x = real_table(values, self.mean.size)
        result = (x - self.mean) / self.scale
        if not np.isfinite(result).all():
            raise ValueError("Scaling the query overflowed")
        return result

    def inverse_transform(self, values):
        z = real_table(values, self.mean.size)
        result = z * self.scale + self.mean
        if not np.isfinite(result).all():
            raise ValueError("Restoring original units overflowed")
        return result


def metric_coordinates(values, weights):
    x = real_table(values)
    w = np.asarray(weights, dtype=float)
    if w.shape != (x.shape[1],) or not np.isfinite(w).all() or np.any(w <= 0):
        raise ValueError("Use one finite positive weight per retained feature")
    result = x * np.sqrt(w)
    if not np.isfinite(result).all():
        raise ValueError("Weighted coordinates overflowed")
    return result


def restore_metric(coordinates, weights):
    # Reuse the same contract, including the positive-weight requirement.
    x = real_table(coordinates)
    metric_coordinates(np.zeros_like(x), weights)
    return x / np.sqrt(np.asarray(weights, dtype=float))


def axis_status(energies):
    gap = abs(float(energies[0] - energies[1]))
    if gap <= 1e-12 * max(abs(float(energies[0])), abs(float(energies[1]))):
        return "tied"
    return "horizontal" if energies[0] > energies[1] else "vertical"


def main():
    from sklearn.decomposition import PCA
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler

    np.set_printoptions(precision=6, suppress=True)
    rectangle = np.array([[-2, -1], [-2, 1], [2, -1], [2, 1]], dtype=float)
    for multiplier in (1.0, 2.0, 10.0):
        raw = rectangle * [1.0, multiplier]
        scaler = PopulationScaler.fit(raw)
        standardized = scaler.transform(raw)
        raw_energy = np.sum(raw**2, axis=0)
        scaled_energy = np.sum(standardized**2, axis=0)
        print("multiplier", multiplier)
        print(
            "raw_energy_axis_share",
            raw_energy,
            axis_status(raw_energy),
            raw_energy.max() / raw_energy.sum(),
        )
        print(
            "standardized_energy_axis_share",
            scaled_energy,
            axis_status(scaled_energy),
            scaled_energy.max() / scaled_energy.sum(),
        )
        ordinary_scaler = StandardScaler().fit(raw)
        print(
            "scaler_library_equal",
            np.allclose(standardized, ordinary_scaler.transform(raw)),
        )
        scratch = CenteredPCA.fit(standardized, 1)
        ordinary = PCA(n_components=1, svd_solver="full").fit(standardized)
        # This square is tied: compare optimal loss, not arbitrary chosen axes.
        scratch_loss = np.sum(
            (standardized - scratch.inverse_transform(scratch.transform(standardized)))
            ** 2
        )
        ordinary_loss = np.sum(
            (
                standardized
                - ordinary.inverse_transform(ordinary.transform(standardized))
            )
            ** 2
        )
        print("tied_optimal_losses", scratch_loss, ordinary_loss)
    print(
        "population_sample_variance",
        np.var(rectangle, axis=0, ddof=0),
        np.var(rectangle, axis=0, ddof=1),
    )
    constant_table = np.column_stack((rectangle[:, 0], np.full(4, 7.0)))
    scaler = PopulationScaler.fit(constant_table)
    query = np.array([[3.0, 9.0]])
    print("constant_scale_and_mask", scaler.scale, scaler.constant)
    print(
        "query_scaled_and_restored",
        scaler.transform(query),
        scaler.inverse_transform(scaler.transform(query)),
    )
    residual = np.array([[1.0, -2.0]])
    weights = np.array([0.5, 3.0])
    print(
        "weighted_loss_two_routes",
        np.sum(metric_coordinates(residual, weights) ** 2),
        np.sum(weights * residual**2),
    )
    missing_training = np.array([[1.0, 2.0], [2.0, np.nan], [4.0, 6.0], [5.0, 8.0]])
    pipeline = make_pipeline(
        SimpleImputer(strategy="mean"),
        StandardScaler(),
        PCA(n_components=1, svd_solver="full"),
    )
    pipeline.fit(missing_training)
    missing_query = np.array([[3.0, np.nan]])
    print(
        "imputer_training_statistics", pipeline.named_steps["simpleimputer"].statistics_
    )
    print("missing_query_score", pipeline.transform(missing_query))


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
multiplier 1.0
raw_energy_axis_share [16.  4.] horizontal 0.8
standardized_energy_axis_share [4. 4.] tied 0.5
scaler_library_equal True
tied_optimal_losses 4.0 4.0
multiplier 2.0
raw_energy_axis_share [16. 16.] tied 0.5
standardized_energy_axis_share [4. 4.] tied 0.5
scaler_library_equal True
tied_optimal_losses 4.0 4.0
multiplier 10.0
raw_energy_axis_share [ 16. 400.] vertical 0.9615384615384616
standardized_energy_axis_share [4. 4.] tied 0.5
scaler_library_equal True
tied_optimal_losses 4.0 4.0
population_sample_variance [4. 1.] [5.333333 1.333333]
constant_scale_and_mask [2. 1.] [False  True]
query_scaled_and_restored [[1.5 2. ]] [[3. 9.]]
weighted_loss_two_routes 12.499999999999998 12.5
imputer_training_statistics [3.       5.333333]
missing_query_score [[-0.]]
```

The main prints both raw and standardized representations for `m=1,2,10`, rather than making the learner select which one to see. Its equal-loss comparison in the standardized square is deliberate: library and scratch may choose different equally good one-dimensional rulers. Scaling costs `O(nd)` to fit,`O(qd)` per query table and `O(d)` stored state. Computing variance from centered sums avoids the cancellation in `E[X²]−E[X]²`, though enormous squared values can still overflow and need rescaling.

<!-- visual:D21 -->

Real measurements bring a consequential scale choice. The supplied Wine table contains 178 wines,13 chemical features and three cultivar codes. A row is one wine; the first includes alcohol 14.23, malic acid 1.71 and proline 1065. Cultivar is a separate category annotation, with counts 59,71 and 48; it is not a fourteenth numerical PCA feature. The offline CSV is the scikit-learn mirror of UCI Wine, DOI 10.24432/C5PC7J, licensed CC BY 4.0. Its CSV and saved labels use codes 1–3; the ordinary `load_wine` API uses 0–2. The supplied feature order is fixed. Do not infer missing measurement units or treat cultivar codes as distances.

<!-- visual:D22 -->

The two saved descriptive fits use all 178 observations. Raw PC1 retains `.9980912304918974` of raw squared variation, largely reflecting the scale of proline. After fitted standardization, the first three fractions are `.36198848099926323`,`.1920749025700898` and `.11123630536249964`. Both thirteen-bar spectra stay visible on the same 0–1 fraction scale, but each fraction divides its own metric's total. Subtracting the first fractions would not measure destroyed information. This is a description of the supplied collection, rather than a prediction-performance evaluation.

The complete original ordinary calculation and its measured output are retained below. The interactive views and the later saved-state reader reuse its state instead of executing this scientific fit again.

<!-- complete-program:original-programs/wineScaling.py -->

`wineScaling.py` — complete program.

```python
import numpy as np
from sklearn.datasets import load_wine
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

wine = load_wine()  # included with scikit-learn; no dataset download
X, cultivar = wine.data, wine.target

raw_pca = PCA(svd_solver="full").fit(X)
scaler = StandardScaler().fit(X)
standardized = scaler.transform(X)
scaled_pca = PCA(svd_solver="full").fit(standardized)
scores = scaled_pca.transform(standardized)

print(X.shape, np.bincount(cultivar))
print(np.round(raw_pca.explained_variance_ratio_[:2], 4))
print(np.round(scaled_pca.explained_variance_ratio_[:3], 4))
print(round(scaled_pca.explained_variance_ratio_[:2].sum(), 4))
```

Retained historical output:

```text
(178, 13) [59 71 48]
[0.9981 0.0017]
[0.362  0.1921 0.1112]
0.5541
```

<!-- visual:D23 -->

The coordinate map derives scores by applying the saved full-collection mean, scales and basis. Changing the displayed component pair or selected record changes which stored-direction products we inspect; it never retrains. Cultivar shapes annotate the resulting coordinates without entering their calculation. A visibly separated cultivar could be interesting, but this unsupervised picture alone establishes neither a classifier's generalization nor a causal chemical explanation.

## 6. Choose the number of components for a stated purpose

Scaling defines what variation costs. The kept count defines how much of that particular cost we accept. A visualization, a storage budget and prediction are distinct purposes; a single percentage cannot settle all three.

<!-- visual:D24 -->

For the descriptive standardized collection, adding the first two fractions gives `.554063383569353`; adding through eight gives about `.9201754432`, and through ten about `.9616971684`. Individual bars show each increment; the cumulative curve shows their running sum. They are summaries of the same full-collection fit. An elbow can invite inspection, but it does not supply an objective or an independent test.

<!-- visual:D25 -->

For measurement compression, the preserved experiment used 133 training rows and 45 validation rows from a stratified seed 42 split. Only training measurements fit the scaler and PCA basis. Cultivar categories helped form the split, then their lane ends; they do not enter the PCA table. Both portions use the training transform. Validation errors help choose a count, so these 45 rows are development evidence rather than an untouched final test. Even unsupervised preprocessing can leak later-data information if its mean or directions are fitted on validation values.

<!-- visual:D26 -->

The declared budget is: keep the fewest coordinates whose validation standardized squared error is at most 10% of always returning the training mean. The saved baseline entryMSE is `1.0962540507211542`. Seven coordinates leave ratio `.12651211126461792`, failing the budget; eight leave `.095954618483061`, passing it. The first qualifying count is therefore 8. Moving the budget to 6% makes nine fail at `.0723539212176816` and ten pass at `.052066326095135236`.

The ratio curve uses exact saved aggregate values, including its tiny positive `k=13` value `1.7244521487195374e−30`. It may round visually to 0, but budget 0 has no qualifying count when compared with these actual values. The default chosen count and an independently selected inspection count are labelled separately. Each additional orthogonal component removes a nonnegative residual term for every row, so simply minimizing reconstruction error would keep every dimension. Compression needs the stated constraint, penalty or storage purpose.

The complete original budget program below records the scientific preparation and all fourteen measured loss ratios. Its original output remains unchanged. Use the saved-state reader for a changed query or budget without repeating the fit.

<!-- complete-program:original-programs/budget.py -->

`budget.py` — complete program.

```python
import numpy as np
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

wine = load_wine()
train, validation = train_test_split(
    np.arange(len(wine.data)), test_size=0.25,
    random_state=42, stratify=wine.target
)
scaler = StandardScaler().fit(wine.data[train])
A = scaler.transform(wine.data[train])
B = scaler.transform(wine.data[validation])
pca = PCA(svd_solver="full").fit(A)

baseline_mse = np.mean((B - pca.mean_)**2)
ratios = []
for k in range(14):
    directions = pca.components_[:k]
    scores = (B - pca.mean_) @ directions.T
    reconstruction = scores @ directions + pca.mean_
    ratios.append(np.mean((B - reconstruction)**2) / baseline_mse)

print(len(train), len(validation))
print(round(baseline_mse, 4))
for k in [0, 2, 7, 8, 10, 13]:
    print(k, round(ratios[k], 4))
print(next(k for k, ratio in enumerate(ratios) if ratio <= 0.10))
```

Retained historical output:

```text
133 45
1.0963
0 1.0
2 0.4281
7 0.1265
8 0.096
10 0.0521
13 0.0
8
```

<!-- visual:D27 -->

Average loss can conceal an important per-feature error. Validation position 0 corresponds to original row index 35. The live row/count/feature controls trace its training-standardized values through the retained basis and show original, reconstructed and residual columns. These are newly derived algebraic values under the saved projection convention, not a replacement measured loss curve. The stored model uses mathematical zero for the PCA mean after standardization; the original estimator's tiny floating-point internal mean was not saved. This distinction matters when comparing nearly zero residuals.

<!-- visual:D28 -->

For alcohol in row 35 at `k=8`, the original 13.48 becomes standardized `.6405566571722935`. The fixed-basis reconstruction is `.6465902044864659`; multiply by training scale `.7988822184243305`, then add training mean `12.968270676691725`, giving `13.484820093663314`. The raw residual is about `−.00482009366331404`, equal to the standardized residual times the feature scale. A squared alcohol error cannot be directly compared numerically with a squared proline error in different units.

The preserved `originalUnits.py` continues `budget.py` and needs its `pca`, validation standardized table `B` and `scaler`. Running the two in the same explicit namespace supplies that state; this is the historical scientific recipe, not required for using the saved query reader. Its recorded stdout prints shape `(45,13)` only. The detailed row values above are separately derived and are not attributed to that stdout.

<!-- complete-program:original-programs/originalUnits.py -->

`originalUnits.py` — complete program.

```python
# Continue the training/validation program above.
k = 8
directions = pca.components_[:k]
scores = (B - pca.mean_) @ directions.T
reconstruction = scores @ directions + pca.mean_
original_units = scaler.inverse_transform(reconstruction)

print(original_units.shape)
```

Retained historical output:

```text
(45, 13)
```

The complete saved reader requires its sibling `pca_saved_state.json` and `wine.csv`; supply both with the program. It checks that CSV rows/labels match the saved state, selects a fitted branch explicitly, multiplies queries by its immutable directions, and reverses scaling. No estimator or fitting operation occurs. Its default full-collection query is row 0; the changed query adds .5 to alcohol and subtracts 100 from proline. Its validation example instead uses the training 133 branch. Those branch names stay in the output so their fitting boundaries cannot silently merge.

<!-- complete-program:saved_pca_queries.py -->

`saved_pca_queries.py` — complete program.

```python
"""N4: legal algebraic queries of saved Wine compression state; no fitting."""

import json
from pathlib import Path
import numpy as np


def load_state(directory=None):
    folder = Path(directory) if directory is not None else Path(__file__).parent
    state = json.loads((folder / "pca_saved_state.json").read_text(encoding="utf-8"))
    csv = np.loadtxt(folder / "wine.csv", delimiter=",", skiprows=1)
    rows = np.asarray(state["wineRows"], dtype=float)
    if csv.shape != (178, 14) or not np.array_equal(csv[:, 1:], rows):
        raise ValueError("Wine CSV measurements differ from the saved state")
    if not np.array_equal(csv[:, 0], state["wineCultivar"]):
        raise ValueError("Wine cultivar mapping differs from the saved state")
    return state


def branch_arrays(branch, k):
    mean = np.asarray(branch["mean"], dtype=float)
    scale = np.asarray(branch["scale"], dtype=float)
    directions = np.asarray(branch["components"], dtype=float)
    if (
        isinstance(k, bool)
        or not isinstance(k, (int, np.integer))
        or not 0 <= k <= directions.shape[0]
    ):
        raise ValueError("Choose an integer kept count within the saved basis")
    if (
        not np.isfinite(mean).all()
        or not np.isfinite(scale).all()
        or np.any(scale <= 0)
    ):
        raise ValueError("Saved means/scales must be finite, with positive scales")
    return mean, scale, directions[:k]


def project_query(values, branch, k):
    mean, scale, directions = branch_arrays(branch, k)
    rows = np.asarray(values, dtype=float)
    if rows.ndim != 2 or rows.shape[1] != mean.size or not np.isfinite(rows).all():
        raise ValueError("Use finite query rows in the saved feature order")
    standardized = (rows - mean) / scale
    # The saved projection convention uses zero post-standardization PCA mean.
    scores = standardized @ directions.T
    return standardized, scores


def decode(scores, branch, k):
    _, _, directions = branch_arrays(branch, k)
    z = np.asarray(scores, dtype=float)
    if z.ndim != 2 or z.shape[1] != k or not np.isfinite(z).all():
        raise ValueError("Scores must be a finite query-by-kept-count table")
    return z @ directions


def inverse_scale(standardized, branch):
    mean, scale, _ = branch_arrays(branch, 0)
    rows = np.asarray(standardized, dtype=float)
    if rows.ndim != 2 or rows.shape[1] != mean.size or not np.isfinite(rows).all():
        raise ValueError("Use finite standardized rows in the saved feature order")
    return rows * scale + mean


def budget_crossing(loss_ratios, budget):
    if not np.isfinite(budget) or budget < 0:
        raise ValueError("Budget must be finite and nonnegative")
    return next((k for k, value in enumerate(loss_ratios) if value <= budget), None)


def main():
    np.set_printoptions(precision=6, suppress=True)
    state = load_state()
    rows = np.asarray(state["wineRows"], dtype=float)
    full = state["wineFullFit"]
    split = state["wineSplit"]
    default_query = rows[[0]].copy()
    changed_query = default_query.copy()
    changed_query[0, 0] += 0.5
    changed_query[0, -1] -= 100.0
    for name, query in (("default", default_query), ("changed", changed_query)):
        standardized, scores = project_query(query, full, 2)
        rebuilt = inverse_scale(decode(scores, full, 2), full)
        print(name + "_full_collection_scores", scores)
        print(name + "_full_collection_reconstruction", rebuilt)
        print(
            name + "_standardized_query_loss",
            np.sum((standardized - decode(scores, full, 2)) ** 2),
        )
    selected_row = split["validation"][0]
    _, scores = project_query(rows[[selected_row]], split, 8)
    print("validation_position0_row_index", selected_row)
    print(
        "training_state_k8_reconstruction",
        inverse_scale(decode(scores, split, 8), split),
    )
    for budget in (0.1, 0.06, 0.0):
        print(
            "saved_budget_crossing",
            budget,
            budget_crossing(split["lossRatios"], budget),
        )
    for k, ratio in enumerate(split["lossRatios"]):
        print("saved_validation_loss", k, ratio, ratio * split["baselineMse"])



if __name__ == "__main__":
    main()
```

Selected recorded reference output; same operations as the recorded calculation:

```text
default_full_collection_scores [[3.316751 1.443463]]
default_full_collection_reconstruction [[  13.953318    1.792106    2.489469   16.80066   112.608967    3.170633
     3.421664    0.244127    2.21661     6.147184    1.08989     3.326907
  1210.957378]]
default_standardized_query_loss 2.9189372153670763
changed_full_collection_scores [[3.314577 1.625978]]
changed_full_collection_reconstruction [[  14.024526    1.838433    2.505252   16.795955  113.383454    3.177506
     3.420138    0.24486     2.220315    6.371252    1.078127    3.305072
  1231.675671]]
changed_standardized_query_loss 4.086713755758694
validation_position0_row_index 35
training_state_k8_reconstruction [[ 13.48482    1.85121    2.457132  19.969206  98.387224   2.793185
    2.91351    0.241893   1.910278   4.873775   1.063056   3.239362
  896.526702]]
saved_budget_crossing 0.1 8
saved_budget_crossing 0.06 10
saved_budget_crossing 0.0 None
saved_validation_loss 0 1.0 1.0962540507211542
saved_validation_loss 1 0.6083063923199177 0.6668583466602813
saved_validation_loss 2 0.4280959138928524 0.4693018797022139
saved_validation_loss 3 0.3126930492121252 0.34279102183114146
saved_validation_loss 4 0.25895662726305274 0.2838822515982096
saved_validation_loss 5 0.20900686392835918 0.22912462120998886
saved_validation_loss 6 0.1704853751896662 0.18689528314038734
saved_validation_loss 7 0.12651211126461792 0.13868941443912275
saved_validation_loss 8 0.095954618483061 0.10519063919745855
saved_validation_loss 9 0.0723539212176816 0.07931827922044271
saved_validation_loss 10 0.052066326095135236 0.057077920887960536
saved_validation_loss 11 0.028298544018290513 0.031022393509561864
saved_validation_loss 12 0.012782898637789558 0.014013304411634727
saved_validation_loss 13 1.7244521487195374e-30 1.890437653308591e-30
```

`project_query` returns standardized values and scores; `decode` reconstructs standardized measurements; `inverse_scale` restores the original columns. `budget_crossing` scans the recorded curve rather than computing a fresh evaluation. Query arithmetic costs `O(qdk)`. The measured arrays are evidence; these matrix products are derived uses of that evidence.

<!-- visual:D29 -->

Storage includes the decoder. With `n=100,d=20,k=10`, the original table holds 2000 scalars. Scores require 1000, directions 200 and the mean 20: `1000+200+20=1220` scalars in total, or 61% stored. Scaling would add 20 more scales. Metadata, dtype, format and quantization remain separate costs. A new count can reduce coordinate work without saving stored bytes when the shared decoder dominates; at `k=d` this format is larger than the original table. The live integer controls count those actual objects without suggesting that any `n,d,k` triple is a permissible scientific fit.

## 7. Read components, scores and plots without mixing them up

The stored basis and a wine's coordinates live in different arrays; distinguish their owners before reading a component plot.

<!-- visual:D30 -->

A component **coefficient** belongs to a feature-direction pair: the first ruler's x coefficient is `1/√2`. A **score** belongs to a record-direction pair: A's score is `−3/√2`, because it combines both of A's centered measurements with their respective coefficients. Thirteen feature bars in a Wine direction describe that axis; they are not thirteen wines' coordinates. Feature identities and colours stay attached to their names when bars are reordered.

<!-- visual:D31 -->

Correlation introduces a different normalization. Use the centered fitting-sample feature x and its score z. Let `d_x` be that feature's direction coefficient, `λ` the score's sample variance, and `s_x` the feature's sample standard deviation. On this fitted eigenaxis, `Cov(x,z)=d_x·λ`. Divide by the two standard deviations to obtain

\[
\operatorname{Corr}(x,z)=\frac{d_x\sqrt\lambda}{s_x}.
\]

In the four-row example `d_x=1/√2`, `λ=6`, and `s_x=√(10/3)`, giving `√.9≈.948683`. This differs from the direction coefficient `.707107`. Both occupy a signed [-1,1] range but answer different questions. A constant feature or zero-variance score has undefined correlation. Texts sometimes call either quantity a “loading”; use the explicit coefficient or correlation label and inspect the convention.

The complete correlation reader below centers the derived fitting scores and features, forms their cross-products and divides by their lengths. It marks zero denominators unavailable. Its Wine PC1 alcohol coefficient is about `.144329`, while the derived fitting-collection correlation is about `.313093`. These are properties of this representation and collection, not causal effects. Download `saved_pca_correlations.py` together with `saved_pca_queries.py`, `pca_saved_state.json` and `wine.csv`; importing the query helpers does not run their demonstration. The numerator is a feature–score cross-product, and the denominator is the product of their centered lengths, exactly the normalization just traced.

<!-- complete-program:saved_pca_correlations.py -->

`saved_pca_correlations.py` — complete program.

```python
"""Complete fitted-feature correlation calculation after its normalization in §7."""

import numpy as np
from saved_pca_queries import load_state, branch_arrays


def coefficient_correlations(rows, branch, component):
    mean, scale, directions = branch_arrays(branch, component + 1)
    standardized = (np.asarray(rows, dtype=float) - mean) / scale
    score = standardized @ directions[component]
    feature_centered = standardized - standardized.mean(axis=0)
    score_centered = score - score.mean()
    numerator = feature_centered.T @ score_centered
    denominator = np.sqrt(
        np.sum(feature_centered**2, axis=0) * np.sum(score_centered**2)
    )
    correlations = np.full(mean.shape, np.nan)
    np.divide(numerator, denominator, out=correlations, where=denominator > 0)
    # These are derived fitting-collection correlations, not new measured trials.
    return directions[component].copy(), correlations


def main():
    np.set_printoptions(precision=6, suppress=True)
    state = load_state()
    rows = np.asarray(state["wineRows"], dtype=float)
    coefficients, correlations = coefficient_correlations(rows, state["wineFullFit"], 0)
    print("pc1_coefficients", coefficients)
    print("pc1_derived_fitting_correlations", correlations)


if __name__ == "__main__":
    main()
```

Selected recorded reference output; same operations as the recorded calculation:

```text
pc1_coefficients [ 0.144329 -0.245188 -0.002051 -0.23932   0.141992  0.394661  0.422934
 -0.298533  0.313429 -0.088617  0.296715  0.376167  0.286752]
pc1_derived_fitting_correlations [ 0.313093 -0.531885 -0.004449 -0.519157  0.308023  0.856137  0.91747
 -0.647607  0.679922 -0.192236  0.643662  0.816019  0.622051]
```

The complete main reports the coefficient and derived fitting correlation for every feature in the same fixed order. Its values are the corresponding lines retained from the earlier saved-state calculation, separated here to follow their explanation; they are not a new Wine fit.

<!-- visual:D32 -->

A biplot overlays observation coordinates and feature vectors using a declared split of singular-value scaling. Here use both modes of our fixed four-record table: the observation factors have four rows, the feature factors two rows, and each has two component columns. This full two-mode example reconstructs the centered table exactly; its omitted-mode residual is zero. If `A≈U_k S_k V_kᵀ`, the two factors `U_k S_k^γ` and `V_k S_k^(1−γ)` still multiply to that approximation. At `γ=1`, the observation coordinates are ordinary scores; at 0 or .5 their scale changes. An arrow is not automatically a correlation or in the same units as every nearby score coordinate. Reversing a component must reverse both corresponding factors; the reconstructed table and squared loss remain unchanged. Nearby points can still differ strongly in discarded coordinates, so a low-dimensional visual distance needs its omission qualification.

## 8. Connect PCA to clustering and prediction

A high retained fraction measures reconstruction under our chosen scale; test what happens when the dropped coordinate supplies a prediction's label.

<!-- visual:D33 -->

Consider points `(±10,±1)` with their label determined by y's sign. The horizontal first axis retains `100/101≈99.01%` of squared variation, yet at each horizontal reading the two opposite labels collide. No deterministic classifier using that one score can distinguish the two records. The small-variance vertical coordinate supplies the label distinction. When horizontal spread becomes 1 the spectrum ties: the variance criterion does not prefer either single axis. Predictive usefulness must be evaluated on the task, rather than inferred from a retained percentage.

<!-- visual:D34 -->

An orthogonal change of **all** coordinates preserves squared distances. For the difference from A to B,`(−1,1)` has squared length 2. The first coordinate difference is 0; the second is `−√2`, contributing 2. Keeping both preserves the original 2, while discarding the second collapses the pair. More generally the full sum of squared rotated coordinates equals the original squared length; truncating removes nonnegative contributions. A fixed full rotation also preserves k-means within-cluster squared error, whereas truncation can change its objective. Reducing feature count can reduce work per distance, but a stored dense pairwise-distance array still has `n²` entries.

<!-- visual:D35 -->

The preserved prediction comparison used five stratified shuffle 42 folds. Each fold fits scaler, optional PCA and logistic regression on its training portion, then evaluates its held-out portion. The no-PCA baseline uses the same folds. Saved means are approximately `.9833` for no PCA,`.9552` for two components and `.9776` for eight. The complete code/output below retains all five outcomes for each setting, including the worse two-component result. These development folds are not independent replicate samples or an untouched final test; no confidence interval is invented.

<!-- complete-program:original-programs/pipeline.py -->

`pipeline.py` — complete program.

```python
import numpy as np
from sklearn.datasets import load_wine
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score

wine = load_wine()
folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
for k in [None, 2, 8]:
    reduction = "passthrough" if k is None else PCA(
        n_components=k, svd_solver="full"
    )
    pipeline = make_pipeline(
        StandardScaler(), reduction, LogisticRegression(max_iter=2000)
    )
    accuracy = cross_val_score(
        pipeline, wine.data, wine.target,
        cv=folds, scoring="accuracy", n_jobs=1
    )
    print(k, np.round(accuracy, 4), round(accuracy.mean(), 4))
```

Retained historical output:

```text
None [0.9722 0.9722 0.9722 1.     1.    ] 0.9833
2 [0.9444 0.9722 0.9167 0.9714 0.9714] 0.9552
8 [0.9722 0.9722 0.9722 0.9714 1.    ] 0.9776
```

The pipeline supplies an unfitted sequence to cross-validation, so preprocessing learns anew within the permitted fold. Computing one whole-data scaler or PCA before the split would violate this boundary even without labels. The recorded output is a reference for interpreting a matched comparison. The later `saved_pca_outcomes.py` reader in section 10.4 reports it alongside the finite-sample spectrum after both mechanisms have been explained, without running cross-validation. For your own modeling change, the complete pipeline above is runnable; keep preprocessing inside each fold and follow the new-experiment recipe in `PCA-SETUP.md`. A justified new predictive claim would need its own forward protocol and evidence. For the present study, PCA is a method to assess, not a method that must be made to win.

## 9. Practice: calculate, diagnose and transfer

Try a changed calculation before its hint or solution. Original1–Original6 follow the core route; Original7 follows section 10.1 and Original8 follows section 10.4. The numbered new tasks are additional variants.

### Original1. Change the data, keep the method

Use (1,0), (3,2), (5,4). Calculate the mean, a first principal direction, all three scores, the sample variance of those scores and the one-component reconstruction SSE. Then add (8,4) as a new observation, using the original fitted transform. What is its reconstruction and squared error?

<details><summary>Hint</summary>

The original three points are exactly on a line of slope one. The new point is not on that line. Keep the original mean when transforming it.

</details>

<details><summary>Retained solution</summary>

The mean is (3, 2). Choose v₁ = (1, 1)/√2. Centered rows are (−2, −2), (0, 0), (2, 2) and scores are −2√2, 0, 2√2. Sample variance is (8 + 0 + 8)/2 = 8. Their one-component reconstruction SSE is zero.


      The new centered point is (5, 2). Its score is 7/√2; reconstructing gives (3, 2) + (3.5, 3.5) = (6.5, 5.5). Residual (1.5, −1.5) has squared length 4.5. Exact training reconstruction did not imply exact reconstruction of every possible new point.

</details>

### Original2. Change the direction instead of memorizing a percentage

In the four-point example from section 2, keep the second direction (1, −1)/√2 instead of the first. Find A's score and reconstruction. What are the total SSE, per-entry MSE and retained variance fraction?

<details><summary>Hint</summary>

The two components divide total centered squared length 20 into 18 and 2. Swapping which is retained swaps the loss.

</details>

<details><summary>Retained solution</summary>

A’s score is −1/√2. Its reconstruction is (3, 2) + (−0.5, 0.5) = (2.5, 2.5). The total SSE is 18; per-entry MSE is 18/8 = 2.25; retained variance is 10%. A’s individual squared error is 4.5. This checks whether you can trace the inverse mapping, not just recite “keep the largest component.”

</details>

### Original3. Repair a misleading scaling conclusion

A report says: “The raw Wine first component retains 99.8%; the standardized first component retains only 36.2%. Standardization destroyed 63.6% of the information.” Explain the error and write a better one-sentence conclusion.

<details><summary>Hint</summary>

Ask what squared error each percentage uses as its denominator.

</details>

<details><summary>Retained solution</summary>

The representations use different feature weightings, so their percentages do not measure the same error objective. Neither percentage measures all useful information. One acceptable conclusion is: “Raw PCA is dominated by large-magnitude measurements, whereas standardized PCA spreads retained relative variation across more components; choose the weighting from the intended task.” A strong answer also identifies which original feature dominates, proline, rather than merely saying “scaling matters.”

</details>

### Original4. Run a new compression budget

Use section 6's `saved_pca_queries.py` to inspect the recorded reference curve at budget .06. To carry out a new compression experiment, run a copy of `budget.py` with its final threshold changed to .06; keep seed42, the stratified 75%/25% split and training-only scaler/basis for the first comparison. Record your own ratios and result. Changing the split seed is a separate experiment; declare that seed before fitting and report its new count rather than replacing the reference result.

Run a copy of `budget.py` from section 6 in your experiment directory. Change the allowed validation error fraction from 0.10 to 0.06. Predict the smallest acceptable count before reading the result. Report the count, the two errors bracketing the budget, the coordinate system and whether you have measured final test performance.

<details><summary>Hint</summary>

You need both the last count that fails and the first count that passes. Reuse the training transform; do not fit a fresh validation PCA.

</details>

<details><summary>Retained solution</summary>

Nine components leave about 0.072354 of the training-mean baseline error; ten leave about 0.052066. The smallest acceptable count is <strong>10</strong>. Errors use training-standardized measurements on the 45 validation rows. These are model-selection results, not an untouched final test result. A different split can give a different count. The budget lab above reproduces these two ratios exactly when you set 0.06.

</details>

### Original5. Diagnose a pipeline leak

A colleague computes StandardScaler().fit_transform(X) on the entire dataset, applies PCA once, and then uses cross-validation to select a classifier. Explain what must move inside the folds. Separately, why is the descriptive full-collection analysis in section 5 not claiming that kind of generalization evidence?

<details><summary>New hint</summary>

Separate which rows supply fitted state from which rows evaluate it.

</details>

<details><summary>Retained solution</summary>

Both the fitted scaler and fitted PCA must be learned using each fold’s training portion, along with the classifier. Pass the complete unfitted pipeline into cross-validation. Section 5 describes the observations supplied to the transform; it does not estimate predictive performance on unseen observations. The use of the data and the claim made about the output determine the evaluation obligation.

</details>

### Original6. Audit a storage promise

You have n = 100 rows and d = 20 features. You keep k = 10 PCA scores per row. Count stored scalar values if you retain the score matrix, component directions and mean, with no feature scaling and the same scalar precision throughout. Does this halve storage? At what number of rows does this choice first save storage?

<details><summary>Hint</summary>

The decoder also takes space. Compare nk + dk + d with nd.

</details>

<details><summary>Retained solution</summary>

Original: 100 × 20 = 2000 scalars. Compressed representation plus decoder: 100 × 10 + 20 × 10 + 20 = 1220, or 61% of the original, so 39% saved, not 50%. Savings require 10n + 220 < 20n, hence n > 22; the first integer is 23. For 22 rows the counts tie. Metadata, storage format and quantization are outside this scalar-count calculation.

</details>

### Original7. Separate uncorrelated from independent

Read section 10.1's dependence example first.

Give U the values −1, 0, 1 with equal probability and define W = U². Show that U and W have zero covariance but are not independent. Why does this matter when describing PCA scores?

<details><summary>New hint</summary>

Compare the conditional probability at W=0 with its marginal.

</details>

<details><summary>Retained solution</summary>

E[U] = 0 and E[UW] = E[U³] = 0, so their covariance is zero. But W = 0 tells us U = 0, while W = 1 tells us |U| = 1; they are dependent. PCA diagonalizes the fitted sample covariance of its scores. It does not generally produce statistically independent variables. The later ICA topic studies a different objective.

</details>

### Original8. Why does a noise-only scree plot have a leading component?

Read section 10.4 first. Its recorded seed23 spectrum is a reference result. For this task, run your own 40×20 independent-standard-normal sample, then change the seed to24 with shape and method fixed. Save both spectra and first-two fractions. Compare them with the fixed population share .10; the sample-dependent leading directions are fitted separately for each draw.

Run the short `gaussian.py` example in section 10.4. Before executing it, decide whether the first two sample components must retain exactly 10% of variation. Explain the result without inventing a hidden two-dimensional cause. Change the seed and repeat; state what you would need before giving an empirical component a scientific name.

<details><summary>New hint</summary>

The fitted directions can capitalize on sample variation; the population reference is a different object.

</details>

<details><summary>Retained solution</summary>

The population covariance is the 20-dimensional identity, so every fixed two-dimensional orthonormal projection captures 10% of population variance. PCA chooses its directions after inspecting a finite sample. The chosen directions capitalize on that sample’s uneven spread. For seed 23 the first two retain about 24.59% of the sample variation. Another seed changes the number.


      A good interpretation distinguishes the fitted sample result from population structure, and proposes evidence tied to the intended claim: repeated data, stability of the retained subspace, a suitable null or noise model, known measurement factors or held-out task performance. Naming the tallest component is not that evidence.

</details>

### Independent mini-project

Using the supplied Wine data, write a short analysis that answers <strong>one</strong> purpose: exploratory visualization, measurement compression, or prediction. State the unit of observation, which rows fit the transform, the scale choice, the baseline and the success criterion before reporting results. Include one changed setting and an observation-level diagnosis, not only a global score.


    For compression, a complete submission contains the reproducible split, selected count, error against the mean baseline, a per-feature or per-row residual inspection, retained decoder information and a statement about what the validation result supports. The 6% variation above provides an exact numerical checkpoint; explaining why it leads to ten components is part of the task.


    For prediction, use `pipeline.py` in section 8 as a starting point, then change one justified modeling choice. Report the fold results for both PCA and the no-PCA baseline, not just whichever mean is higher. The point is to make and evaluate a decision, not to force PCA to win.

Begin with the supplied reference results and one changed query, then carry out one new experiment appropriate to your chosen purpose. For visualization, fit a new full-collection representation after declaring raw or standardized measurements; keep cultivar separate from PCA and avoid unseen-performance claims. For compression, use the seed42 training/validation recipe and declare the .06 budget before selecting a count; inspect a residual in original units. For prediction, keep the five seed42 stratified folds and accuracy metric, compare no-PCA/k2/k8 on matched folds, and declare one additional setting such as logistic `C=.5` before computing any outcomes. Fit every scaler, PCA and classifier inside each training fold. Report all per-fold values and means, including worse results; these folds are development evidence, not a final untouched test. Record package versions, input source and setting. Your new run is separate from the published reference. Section 10.10 connects these decisions and `PCA-SETUP.md` supplies the runnable recipes.

### Changed tasks: calculate and diagnose

These are additional tasks, with changed values or assumptions. The deeper tasks state which later branch to read first. Keep the hint and solution separate from the prompt so you can attempt an independent calculation.

### P1. Another three-row table

For `(0,0),(2,2),(4,4)`, identify `n,d`, calculate the mean, choose a first direction, calculate all scores and recover the rows from one coordinate.

<details><summary>Hint</summary>

Average each column. Subtract that same average from every row before using the diagonal unit direction.

</details>
<details><summary>Solution</summary>

There are three observations and two features. The mean is `(2,2)`. Centered rows are `(−2,−2),(0,0),(2,2)`. Choose `v=(1,1)/√2`; scores are `−2√2,0,2√2`. Multiplying each score by v and restoring the mean gives the three original rows, so trainSSE 0. This exact reconstruction depends on these collinear training rows; it does not assert that every future row lies on their line.

</details>

### P2. Follow a centered query

Project centered query `(2,−1)` on `(1,1)/√2`. Calculate its score, foot, residual and squared loss; verify perpendicularity.

<details><summary>Hint</summary>

First sum the two coordinate products, then multiply that scalar by the two direction coefficients.

</details>
<details><summary>Solution</summary>

The score is `(2−1)/√2=1/√2`. The foot is `(.5,.5)`, leaving residual `(1.5,−1.5)`. Its squared length is `2·1.5²=4.5`; its dot product with the direction is 0. The query's total squared length 5 divides into retained .5 and lost 4.5. No mean needs restoring because the supplied query was already centered.

</details>

### P3. Reverse an axis carefully

Reverse a direction and all its scores. Does the decoded table change? What if you reverse only the direction?

<details><summary>Hint</summary>

Inspect the product `zv`, rather than the two signs independently.

</details>
<details><summary>Solution</summary>

`(−z)(−v)=zv`, so paired reversal leaves every reconstruction and loss unchanged. Reversing v alone gives `−zv`, reversing the retained displacement relative to the mean. Sign conventions help consistent display; changing just one side changes the decoder's operation.

</details>

### P4. Name the denominator

A centered table with `n=5,d=3` has total energy 30 and retained energy 24. Find SSE, average squared error per row, entryMSE and discarded sample variance.

<details><summary>Hint</summary>

Find the lost energy first. Divide by n, nd or n−1 only after naming the quantity.

</details>
<details><summary>Solution</summary>

Lost SSE is `30−24=6`. Per-row error is `6/5=1.2`; entryMSE is `6/15=.4`; discarded sample variance is `6/4=1.5`. The retained energy fraction is `.8`, which describes this fixed squared-error objective rather than all useful information.

</details>

### P5. Use the original fit for a new raw query

With the four-record fitted mean `(3,2)` and first direction `(1,1)/√2`, reconstruct raw query `(7,1)` and calculate its squared error.

<details><summary>Hint</summary>

The query is not a fifth training row. Subtract the stored mean and keep its direction fixed.

</details>
<details><summary>Solution</summary>

Centered query is `(4,−1)`, giving score `3/√2`. Its centered foot is `(1.5,1.5)`, so recovered raw point is `(4.5,3.5)`. Residual `(2.5,−2.5)` has squared length 12.5. Refitting the mean with this query would answer a different question.

</details>

### P6. A different unit-change tie

Use rectangle corners `(±3,±1)` and multiply y by 3. What is the raw one-coordinate direction status? What does fitted standardization produce?

<details><summary>Hint</summary>

Compare the two raw energy sums before looking for an eigenvector.

</details>
<details><summary>Solution</summary>

Raw energies are `4·3²=36` and `4·3²=36`, so the raw optimum ties: every unit one-dimensional ruler retains half the energy. Standardization divides both columns by 3, producing `(±1,±1)` with equal energies 4. Its one-coordinate optimum also ties. Neither calculation identifies one scientifically preferred diagonal; its weighting must come from the intended task.

</details>

### P7. A constant feature — rank detail after section 10.2

A table has one varying feature and one feature that is 7 in every training row. Trace centering and scaling of the constant feature. What happens to total-energy fractions if both features are constant?

<details><summary>Hint</summary>

Distinguish a zero centered column from a missing value or a later query value.

</details>
<details><summary>Solution</summary>

Its mean is 7 and centered training entries are 0. Population variance is 0, so the effective scaler stores 1 and keeps those standardized entries 0. The centered table has rank 1 if the other feature genuinely varies. If all features are constant, total centered energy is 0 and a retained-energy fraction is undefined. Mean-only training reconstruction can be exact despite there being no identified nonzero signal axis. A later constant-feature query differing from 7 has a nonzero standardized difference; it does not retrain the scale.

</details>

### P8. Read the actual saved budget

Without fitting, choose the fewest retained coordinates for a 6% validation loss budget and give the bracketing saved values.

<details><summary>Hint</summary>

Scan the saved ratios from `k=0`; use actual values rather than rounded labels.

</details>
<details><summary>Solution</summary>

At `k=9` the ratio `.0723539212176816` exceeds .06; at `k=10` `.052066326095135236` is below it. The first passing count is 10. These are validation standardized reconstruction errors divided by the training-mean baseline error. This selection does not establish performance on an untouched final test.

</details>

### P9. Restore the original units

A feature's saved mean is 100 and scale 20. Its reconstructed standardized value is 1.5, while the original query measurement is 140. Find the raw reconstructed value and both raw and standardized squared residuals.

<details><summary>Hint</summary>

Undo division, then undo subtraction. Standardize the original with the same fitted values.

</details>
<details><summary>Solution</summary>

The reconstructed raw value is `1.5·20+100=130`. Raw residual is 10 and raw squared error 100. The original standardized value is 2, giving residual .5 and squared error .25. Their units and weighting differ; the two errors should not be placed in one unlabelled numeric comparison.

</details>

### P10. Storage with a scale vector

For `n=20,d=10,k=2`, count original and represented float64 values including scores, directions, mean and scales. Exclude format metadata but state that exclusion. This changes the original storage exercise's assumptions.

<details><summary>Hint</summary>

Count each shared decoder object once, not once per observation.

</details>
<details><summary>Solution</summary>

Original count is `nd=200`, or 1600 bytes. Scores 40, directions 20, mean 10 and scales 10 total 80, or 640 bytes. This saves 60% under the declared scalar format. It excludes record IDs, headers and other serialization metadata; a practical stored file can differ.

</details>

### P11. Coefficient versus correlation

A direction coefficient is .5, its score sample variance is 4 and the feature sample variance is 9. Calculate the fitting-sample correlation. What if the feature is constant?

<details><summary>Hint</summary>

The correlation includes both variance normalizations; it is not the coefficient itself.

</details>
<details><summary>Solution</summary>

Correlation is `.5·√4/√9=1/3`. The coefficient .5 remains the direction's coordinate. For a constant feature the correlation denominator is 0, so correlation is undefined rather than 0 or 1. This formula uses the eigenaxis covariance relation on the fitting sample.

</details>

### P12. Keep the label, keep the boundary

For `(±10,±1)` with labels from y's sign, explain what PC1 discards and propose a proper no-PCA/PCA predictive comparison. Where should a scaler be fitted?

<details><summary>Hint</summary>

Find the two records sharing each retained horizontal score. Distinguish fitting from evaluation.

</details>
<details><summary>Solution</summary>

PC1 retains `100/101` but maps opposite-label rows to each same horizontal coordinate. No classifier on that coordinate alone can recover both labels. Compare pipelines on a predeclared predictive metric using matched splits; scaler, PCA and classifier all fit inside each training fold. A no-PCA baseline must be retained. Existing development outcomes do not establish that one representation wins universally or provide an untouched test result.

</details>

### P13. Cut through a tied spectrum — after sections 10.1–10.2

Centered scatter has eigenvalues `9,4,4,0`. Give singular values, rank, discarded SSE at `k=2` and `k=3`, and which retained projector is uniquely identified.

<details><summary>Hint</summary>

Inspect the gap at the retained boundary, rather than the signs of individual eigenvectors.

</details>
<details><summary>Solution</summary>

Singular values are `3,2,2,0`; exact rank 3. At `k=2` the discarded SSE is 4, but one chosen dimension inside the tied 4/4 space is not uniquely preferred. At `k=3` discarded SSE 0 and the full positive-spectrum projector is unique because the boundary gap is 4 versus 0. Individual axes inside the tied two-dimensional space still need not be unique.

</details>

### P14. Whiten and return — after section 10.3

For a fitted score with sample variance 4 and `n=5`, whiten score 2, restore it, and state the fitting whitened sample and population variances.

<details><summary>Hint</summary>

Use the same retained √variance in both directions; the denominator changes only the reported variance convention.

</details>
<details><summary>Solution</summary>

Whitened coordinate is `2/√4=1`; inverse whitening gives 2. Fitting sample variance becomes 1, while population-style variance is `(5−1)/5=.8`. A numerically zero retained singular direction cannot be whitened in our local contract. This scaling does not generally produce independent coordinates.

</details>

### P15. Posterior versus orthogonal foot — after sections 10.3–10.4

For PPCA loading magnitude 2, isotropic noise variance .5 and query coordinate `z=3` along the signal axis, compute M, latent posterior mean, its variance and the decoded coordinate. Contrast the saved Gaussian first-two share with its population reference.

<details><summary>Hint</summary>

The latent coordinate is obtained by a solve, not the orthogonal dot product alone.

</details>
<details><summary>Solution</summary>

`M=4+.5=4.5`; RHS is `2·3=6`. Latent posterior mean is `6/4.5=4/3`, variance `.5/4.5=1/9`, and decoded coordinate is `2·4/3=8/3`, compared with the orthogonal PCA foot 3. Shrink factor is 8/9. The stored 40×20 isotropic Gaussian sample has fitted first-two share `.24591458952369985`; its population fixed-two-dimensional reference is .10. Finite fitted spread is not proof of a true two-factor population, and the task requires no new draw.

</details>

### P16. Two zero-spread batches — after section 10.6

Two two-row batches are constant at −2 and +2 on one feature. Calculate their merged mean and scatter, including the correction row. What approximation can lose history?

<details><summary>Hint</summary>

The batches have no within-batch spread, but their means differ.

</details>
<details><summary>Solution</summary>

Combined mean is 0. The correction row is `√(2·2/4)(−2−2)=−4`; its square contributes 16 while both within-batch scatters contribute 0. Combined sample variance is `16/3`. Separately centering the batches and omitting the correction would falsely give 0. Retaining only k modes between updates can discard past directions; future batches cannot generally recover that missing scatter, so order can matter.

</details>

### P17. Center a future kernel row — after section 10.7

For training inputs `−1,0,1` with square kernel, derive query 2's score. Which means are stored, and why do query −2 and 2 collide?

<details><summary>Hint</summary>

Use query row `[4,0,4]`, its own row mean 8/3, training column means `[2/3,0,2/3]` and training grand mean 4/9.

</details>
<details><summary>Solution</summary>

The centered kernel row is `[10/9,−20/9,10/9]`. The normalized eigenvector is `(1,−2,1)/√6` and eigenvalue 2/3, so dividing by √eigenvalue makes the coefficient column `(1,−2,1)/2`. Its dot product with that row is `10/3`, equal to `2²−2/3`. Query−2 has the same squared feature and score. No exact original-input inverse can distinguish them; replacing stored training means with query-batch means would change the fitted transform.

</details>

### P18. Changed objectives need changed operators — after sections 10.8–10.9

For atoms `(1,0)` and `(1,1)/√2`, serve query `(1,1)` at ridge 0. Explain why a one-pixel E11 matrix can defeat unique low-rank/sparse separation. On grid weights `(.5,1.5,1)`, compute weighted error for residual `(1,0,1)`.

<details><summary>Hint</summary>

Solve using the atom Gram matrix; classify E11 by both rank and support; apply the weights before summing squares.

</details>
<details><summary>Solution</summary>

The atom Gram is `[[1,1/√2],[1/√2,1]]` and RHS is `(1,√2)`. Solving gives coefficients `(0,√2)`, which decode exactly to `(1,1)`. Naive independent dot products `(1,√2)` decode to `(2,1)` because the atoms are not orthogonal. E11 is both rank 1 and one-entry sparse, so the decomposition alone is not identifiable without additional assumptions. The weighted squared error is `.5·1²+1.5·0²+1·1²=1.5`, compared with unweighted 2. These are three different mathematical questions; the PCA dot-product decoder is not a universal solver for them.

</details>

## 10. Deeper branches

The core route has given us an encoder, decoder and a purpose. These branches answer the next limitations: why that subspace is optimal, what degeneracies mean, how a probabilistic interpretation differs, and how to change the computation or objective deliberately. Keep the concrete four-record calculation in view as the notation expands.

### 10.1 Where the optimum comes from

The diagonal ruler won on four records; express another ruler in the same orthogonal axes to see why its variance cannot exceed that winner.

<!-- visual:D36 -->

The covariance ellipse has axes `v₁,v₂` with sample variances 6 and `2/3`. Write an arbitrary unit ruler as `v=a₁v₁+a₂v₂`. Orthogonality gives `a₁²+a₂²=1`; its score variance is `6a₁²+(2/3)a₂²`. This weighted average cannot exceed 6. It reaches 6 by putting all weight on the first axis. The general symmetric PSD covariance has orthonormal eigenvectors `u_j` and nonnegative eigenvalues `λ_j`; substituting `v=Σa_ju_j` gives `vᵀCv=Σλ_ja_j²` under `Σa_j²=1`. The largest eigenvalue is therefore the maximum. A constrained derivative of `vᵀCv−η(vᵀv−1)` gives `Cv=ηv`, but stationary eigenvectors also include minima; sorting their eigenvalues is essential.

<!-- visual:D37 -->

SVD expresses `A=Σ_j s_ju_jv_jᵀ` as a sum of rank-one outer-product tables. For the four records, the first table contains all decoded centered rows; the second contains their remaining residuals. Their squared Frobenius lengths are 18 and 2. Keeping the first drops the second, so SSE 2. The **squared Frobenius norm** sums squared entries; a different **spectral norm** asks for the largest length amplification of a unit vector. The same retained factorization has spectral residual `√2`, not 2.

To connect covariance and SVD, substitute `A=USVᵀ` into `AᵀA/(n−1)`. Since `UᵀU=I`,

\[
C=V\frac{S^2}{n-1}V^T,\qquad Z=AV_k=U_kS_k.
\]

Thus eigenvalues are `s_j²/(n−1)` and directions are feature columns of V. For an orthogonal rank-k projector P, retained scatter is `tr(PAᵀA)`. In its eigenbasis, the weights `v_jᵀPv_j` lie in [0,1] and sum to k. The maximum puts that weight on the k largest squared singular values, leaving `Σ_{j>k}s_j²`. This establishes the best centered k-subspace for the stated squared reconstruction loss. Allowing a general rank-k approximation does not improve on this SVD tail: its row subspace has dimension at most k, and projecting A into that subspace is already the least-squares choice for it. For spectral loss, any rank-k candidate has a null vector in the span of the first k+1 right singular directions, giving residual at least `s_{k+1}`; truncation attains that bound.

The original covariance calculation below continues the original `svd.py` namespace, requiring `np`, `X`, `centered`, `mean`, `singular_values` and `reconstructed`. Execute the exact predecessor first when using this four-row continuation. It is a useful algebraic comparison, while the general reusable PCA program delegates direct SVD to a maintained primitive.

<!-- complete-program:original-programs/eigen.py -->

`eigen.py` — complete program.

```python
# Continue the four-point NumPy example in section 4.
covariance = centered.T @ centered / (len(X) - 1)
eigenvalues, eigenvectors = np.linalg.eigh(covariance)
leading = eigenvectors[:, -1:]
eigen_reconstruction = (centered @ leading) @ leading.T + mean

print(np.round(eigenvalues[::-1], 4))
print(np.allclose(eigen_reconstruction, reconstructed))
print(round(float(np.sum(singular_values[1:]**2)), 4))
```

Retained historical output:

```text
[6.     0.6667]
True
2.0
```

<!-- visual:D37a -->

Orthogonality also makes the fitting scores uncorrelated: their column means are 0, and `ZᵀZ/(n−1)=diag(λ_j)`. The four-record cross-products of the first and second scores are `(+3/2,−3/2,−3/2,+3/2)`, which sum 0. The diagonal square sums 18 and 2 give the corresponding sample variances. This is a statement about the fitted sample covariance, not every future sample or statistical independence.

For a separate equally weighted distribution, let `U` be −1,0,1 and `W=U²`. Its three joint records are `(−1,1),(0,0),(1,1)`, each mass 1/3. We get `E[U]=0`, `E[W]=2/3`, `E[UW]=0`, hence covariance 0. But `P(U=0|W=0)=1`, whereas `P(U=0)=1/3`. Equivalently the joint middle mass 1/3 differs from the product `(1/3)(1/3)=1/9`. The two coordinates are dependent despite diagonal covariance. Additional assumptions, such as joint Gaussianity, can make zero covariance imply independence; PCA alone does not provide them. Original 7 tests this distinction; ICA later asks a different question.

### 10.2 Rank, ties and stable computation

That optimum can identify a subspace without identifying every axis: compare collinear, constant and tied tables before trusting a direction label.

<!-- visual:D38 -->

Compare the four fixed cases before changing a control. The original table has singular values `√18,√2` and rank 2. Its leading projector is uniquely `[[.5,.5],[.5,.5]]` because 18 exceeds 2. Collinear rows `(−2,−2),(−1,−1),(1,1),(2,2)` have spectrum `√20,0`, rank 1 and exact one-coordinate training reconstruction. Their future query `(1,−1)` still has squared projection loss 2. Constant rows all `(3,2)` have centered rank 0 and exact mean-only training reconstruction, but no preferred nonzero axis or variance-share denominator. Finally the square `(±1,±1)` has singular values 2,2: every one-dimensional ruler loses 4, but different rulers reconstruct different points.

Centered rows sum to zero, so they are linearly dependent and rank cannot exceed `min(n−1,d)`. Rank counts nonzero independent directions, not a scientifically important feature count. Exact zero in these fixtures is distinct from a reported floating-point numerical threshold. At a boundary tie, a chosen k-subspace need not be unique. Retaining the whole tied space gives a unique projector even though its individual basis axes can rotate. In the constant case the identifiable range is the zero space; an arbitrary completed positive-dimensional axis can affect future queries without representing fitted signal.

<!-- visual:D38a -->

Use only the fixed square for the angle/kept-count investigation. At `k=0`, every angle gives projector 0 and loss 8; at `k=1`, the projector `vvᵀ` and feet change while loss stays 4; at `k=2`, every rotated orthonormal basis gives projector I and loss 0. The angle remains operable for all counts: what becomes invariant is the retained operator, not the basis description. Reset restores 0° and `k=1`. Distinguish a deterministic software basis convention from an identified preferred direction.

<!-- visual:D39 -->

If A has singular values 1 and `10⁻⁸`, its covariance-scale squared values include `10⁻¹⁶`. Forming `AᵀA` squares the nonzero condition number and can make small directions harder to resolve numerically. This example does not assert that every such value disappears on every machine. Direct SVD avoids deliberately squaring the problem; a relative rank floor reports its numerical decision separately from physical importance.

The exact two-column prerequisite uses Jacobi rotations. Its working column squares are `α=Σb₀²`, `β=Σb₁²`, with cross-product `γ=Σb₀b₁`. It stops when `|γ|≤tolerance·√α·√β`, which bounds the normalized column dot product. This is an **orthogonality tolerance**, not a singular-value cutoff. Columns `(1,0)` and `(10⁻¹³,0)` have normalized dot 1 and are not orthogonal at tolerance `10⁻¹²`; columns `(1,0)` and `(0,10⁻¹³)` have dot 0 regardless of the second column's tiny length. Numerical rank has its own comparison against `eps·max(n,2)·smax`. A covariance eigenvalue tie uses a third relative eigenvalue-gap policy.

The helper returns four values: U columns, two singular values, V columns and rotation count. The local adapter centers, checks finite moderate-scale intermediates and transposes V columns into direction rows. It preserves the prerequisite's finite rotation budget and exhausted-budget error. The helper completes exactly zero columns by its literal-zero rules; a different minimum-norm solve in that file has an absolute singular cutoff and is not called by this PCA adapter. Keep these policies separate when reusing a full dependency file.

<!-- complete-program:pca_two_columns.py -->

`pca_two_columns.py` — complete program.

```python
"""Scalar two-column projection and exact prerequisite SVD reuse, N2."""

from math import atan2, cos, fsum, hypot, isfinite, sin, sqrt
import numpy as np
from matrix_decomposition_scratch import two_column_svd


def scalar_pca(rows, tie_tolerance=1e-12):
    points = [tuple(map(float, row)) for row in rows]
    if len(points) < 2 or any(
        len(row) != 2 or not all(map(isfinite, row)) for row in points
    ):
        raise ValueError("Expected at least two finite two-coordinate rows")
    if not isfinite(tie_tolerance) or tie_tolerance < 0:
        raise ValueError("Tie tolerance must be finite and nonnegative")
    n = len(points)
    mean = tuple(fsum(row[j] for row in points) / n for j in range(2))
    centered = [(x - mean[0], y - mean[1]) for x, y in points]
    xx = fsum(x * x for x, _ in centered) / (n - 1)
    xy = fsum(x * y for x, y in centered) / (n - 1)
    yy = fsum(y * y for _, y in centered) / (n - 1)
    if not all(map(isfinite, (xx, xy, yy))):
        raise ValueError("Covariance arithmetic overflowed; use a smaller scale")
    gap = hypot(xx - yy, 2 * xy)
    eigenvalues = ((xx + yy + gap) / 2, (xx + yy - gap) / 2)
    zero = xx + yy == 0
    tied = not zero and gap <= tie_tolerance * max(map(abs, eigenvalues))
    # At a tie, this is explicitly one representative, not a preferred axis.
    angle = 0.0 if zero or tied else atan2(2 * xy, xx - yy) / 2
    directions = ((cos(angle), sin(angle)), (-sin(angle), cos(angle)))
    scores = [tuple(x * a + y * b for a, b in directions) for x, y in centered]
    return {
        "mean": mean,
        "centered": centered,
        "covariance": ((xx, xy), (xy, yy)),
        "variances": eigenvalues,
        "directions": directions,
        "scores": scores,
        "status": "zero_energy" if zero else "tied" if tied else "unique_leading_axis",
    }


def reused_svd_pca(rows, orthogonality_tolerance=1e-12, max_rotations=8):
    x = np.asarray(rows, dtype=float)
    if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] != 2 or not np.isfinite(x).all():
        raise ValueError("Expected finite n-by-2 input, n>=2")
    if not isfinite(orthogonality_tolerance) or orthogonality_tolerance < 0:
        raise ValueError("Orthogonality tolerance must be finite and nonnegative")
    if (
        isinstance(max_rotations, bool)
        or not isinstance(max_rotations, int)
        or max_rotations <= 0
    ):
        raise ValueError("Rotation budget must be a positive integer")
    mean = x.mean(axis=0)
    centered = x - mean
    scatter = centered.T @ centered
    if not np.isfinite(centered).all() or not np.isfinite(scatter).all():
        raise ValueError("Helper supports finite representable centered dot sums")
    u, singular, v, rotations = two_column_svd(
        centered.tolist(), orthogonality_tolerance, max_rotations
    )
    u, singular, v = np.array(u), np.array(singular), np.array(v)
    if not all(np.isfinite(array).all() for array in (u, singular, v)):
        raise ValueError("Nonfinite factorization result")
    rank_threshold = np.finfo(float).eps * max(x.shape) * singular[0]
    return {
        "mean": mean,
        "directions": v.T,
        "singular_values": singular,
        "scores": centered @ v,
        "rotations": rotations,
        "rank_threshold": rank_threshold,
        "numerical_rank": int(np.count_nonzero(singular > rank_threshold)),
        "factor_residual": np.linalg.norm(centered - (u * singular) @ v.T),
    }


def square_projection(angle_degrees, kept):
    if (
        not isfinite(angle_degrees)
        or not 0 <= angle_degrees <= 180
        or kept not in (0, 1, 2)
    ):
        raise ValueError("Angle must be in[0,180]; kept count in{0,1,2}")
    angle = angle_degrees * np.pi / 180
    directions = np.array([[cos(angle), sin(angle)], [-sin(angle), cos(angle)]])[:kept]
    square = np.array([[-1, -1], [-1, 1], [1, -1], [1, 1]], dtype=float)
    scores = square @ directions.T
    recovered = scores @ directions
    return (
        directions.T @ directions,
        recovered,
        float(np.sum((square - recovered) ** 2)),
    )


def dependence_moments():
    records = [(-1, 1), (0, 0), (1, 1)]
    eu = fsum(u for u, _ in records) / 3
    ew = fsum(w for _, w in records) / 3
    covariance = fsum(u * w for u, w in records) / 3 - eu * ew
    conditional = sum(u == 0 and w == 0 for u, w in records) / sum(
        w == 0 for _, w in records
    )
    return eu, ew, covariance, conditional, 1 / 3, 1 / 9


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    fixtures = {
        "original": [[1, 1], [2, 0], [4, 4], [5, 3]],
        "collinear": [[-2, -2], [-1, -1], [1, 1], [2, 2]],
        "constant": [[3, 2]] * 4,
        "square": [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    }
    for name, rows in fixtures.items():
        scalar = scalar_pca(rows)
        reused = reused_svd_pca(rows)
        print(
            name,
            "status",
            scalar["status"],
            "singular",
            reused["singular_values"],
            "rank",
            reused["numerical_rank"],
        )
        print(name, "factor_residual", reused["factor_residual"])
        if scalar["status"] == "unique_leading_axis":
            direction = np.array(scalar["directions"][0])
            ordinary = PCA(n_components=1, svd_solver="full").fit(rows).components_[0]
            print(
                name,
                "leading_projector_equal",
                np.allclose(
                    np.outer(direction, direction), np.outer(ordinary, ordinary)
                ),
            )
    for angle in (0, 45, 90):
        for kept in (0, 1, 2):
            projector, recovered, loss = square_projection(angle, kept)
            print(
                "square", angle, kept, "loss", round(loss, 12), "projector", projector
            )
    print("dependence_EU_EW_cov_cond_marg_product", dependence_moments())


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
original status unique_leading_axis singular [4.242641 1.414214] rank 2
original factor_residual 4.965068306494546e-16
original leading_projector_equal True
collinear status unique_leading_axis singular [4.472136 0.      ] rank 1
collinear factor_residual 9.930136612989092e-16
collinear leading_projector_equal True
constant status zero_energy singular [0. 0.] rank 0
constant factor_residual 0.0
square status tied singular [2. 2.] rank 2
square factor_residual 0.0
square 0 0 loss 8.0 projector [[0. 0.]
 [0. 0.]]
square 0 1 loss 4.0 projector [[1. 0.]
 [0. 0.]]
square 0 2 loss 0.0 projector [[1. 0.]
 [0. 1.]]
square 45 0 loss 8.0 projector [[0. 0.]
 [0. 0.]]
square 45 1 loss 4.0 projector [[0.5 0.5]
 [0.5 0.5]]
square 45 2 loss 0.0 projector [[1. 0.]
 [0. 1.]]
square 90 0 loss 8.0 projector [[0. 0.]
 [0. 0.]]
square 90 1 loss 4.0 projector [[0. 0.]
 [0. 1.]]
square 90 2 loss 0.0 projector [[1. 0.]
 [0. 1.]]
dependence_EU_EW_cov_cond_marg_product (0.0, 0.6666666666666666, 0.0, 1.0, 0.3333333333333333, 0.1111111111111111)
```

This program prints the four fixed rank cases before its separate square-angle/count results. It uses scalar centered sums and a 2×2 leading-axis formula for hand tracing, plus the actual sibling `matrix_decomposition_scratch.py` import. Download both files together and run `python pca_two_columns.py`; the dependency's guarded demonstration main is not invoked by the import. This moderate-scale O(n) route exposes directions and ties; the maintained general SVD route remains appropriate for arbitrary feature counts.

Small perturbations also matter when a leading eigengap is small. The symmetric matrix `[[1+g,.01],[.01,1]]` has leading-axis rotation `.5·atan2(.02,g)`: about `.5729°` at `g=1` versus `43.5688°` at `g=.001`. The adjoining fixed ellipses show that sensitivity relative to the zero-off-diagonal case. They are exact finite covariance comparisons, not an estimated uncertainty band.

### 10.3 Whitening and a probabilistic interpretation

Keeping a subspace fixed still leaves a choice of score units; compare the same retained coordinates before and after dividing by their fitted spread.

<!-- visual:D40 -->

Keep unwhitened and whitened score lanes visible together. Our first four scores have magnitude `3/√2` and sample variance 6. Dividing by `√6` gives magnitude `√.75`; their sample variance becomes 1 and population-style variance .75. At `k=2`, divide each coordinate by its own fitted square-root variance. Smaller-variance coordinates receive larger relative scaling. Inverse whitening multiplies by those same factors before decoding, so the retained raw reconstruction stays unchanged.

This is standardizing the retained coordinate metric, not producing independent variables. Our scratch route rejects whitening a numerically zero retained direction, while current sklearn applies its own near-zero safeguard. Positive-rank comparisons match the declared domain; degenerate behavior is not silently claimed identical. P14 traces both inverse scaling and denominator conventions. The adapter below retains the already-fitted `CenteredPCA` from section 4 and stores one positive square-root variance per kept direction. `from_fitted` checks the established numerical-rank floor before taking those reciprocals; `transform` divides each score, and `inverse_transform` multiplies it back before using the core decoder. The ordinary equivalent is `PCA(n_components=2, whiten=True, svd_solver="full")` on the same four rows; its positive-rank sample-variance convention matches these two reported lanes. Its near-zero safeguard remains a different contract. Supply sibling `centered_pca.py` when running this complete program.

<!-- complete-program:pca_whitening.py -->

`pca_whitening.py` — complete program.

```python
"""Complete positive-rank whitening adapter after its mechanism in §10.3."""

from dataclasses import dataclass
import numpy as np
from centered_pca import CenteredPCA, real_table


@dataclass(frozen=True)
class WhitenedPCA:
    base: CenteredPCA
    factors: np.ndarray

    @classmethod
    def from_fitted(cls, base):
        k = base.directions.shape[0]
        if np.any(base.singular_values[:k] <= base.rank_threshold):
            raise ValueError("Whitening a numerically zero retained direction is undefined")
        factors = np.sqrt(base.variances[:k]).copy()
        if not np.isfinite(factors).all() or np.any(factors <= 0):
            raise ValueError("Whitening needs finite positive retained variance")
        factors.setflags(write=False)
        return cls(base, factors)

    @classmethod
    def fit(cls, values, k):
        return cls.from_fitted(CenteredPCA.fit(values, k))

    def transform(self, values):
        scores = self.base.transform(values) / self.factors
        if not np.isfinite(scores).all():
            raise ValueError("Whitening overflowed; rescale the query")
        return scores

    def inverse_transform(self, values):
        k = self.base.directions.shape[0]
        scores = real_table(values, k) if k else np.asarray(values, dtype=float)
        if scores.ndim != 2 or scores.shape[1] != k or not np.isfinite(scores).all():
            raise ValueError("Expected finite query-by-kept-count whitened coordinates")
        return self.base.inverse_transform(scores * self.factors)


def main():
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    white = WhitenedPCA.fit(x, 2)
    print("whitened_sample_variance", np.var(white.transform(x), axis=0, ddof=1))
    print("whitened_population_variance", np.var(white.transform(x), axis=0, ddof=0))


if __name__ == "__main__":
    main()
```

Selected recorded reference output; same operations as the recorded calculation:

```text
whitened_sample_variance [1. 1.]
whitened_population_variance [0.75 0.75]
```

The two printed variance lines come from the recorded four-row calculation with these same factors and denominators. With no kept coordinates, the adapter returns an empty score table and decodes the mean; a zero-variance kept direction instead cannot supply a reciprocal scale. The adapter stores `O(k)` additional factors and adds `O(qk)` divisions or multiplications for q query rows, on top of the core encoder/decoder cost.

<!-- visual:D41 -->

A probabilistic model asks another question: what observed vector could be produced by a latent coordinate plus noise? Let latent `t∼N(0,1)` feed loading `W=2v₁`, add the mean, and then add isotropic Gaussian noise with variance .5 on every observed coordinate. The covariance is

\[
WW^T+.5I=\begin{bmatrix}2.5&2\\2&2.5\end{bmatrix},
\]

with eigenvalues 4.5 and .5. The latent coordinate, a particular noise vector and an observed point are different objects. The ellipse shows the model's covariance; no random sample is needed to understand it.

For an n-row fit, Gaussian maximum likelihood uses covariance `AᵀA/n`, not the sample denominator `n−1`. For k<d, the spectral ML solution keeps the leading eigenvectors, averages the discarded **d−k** eigenvalues to estimate `σ²`, and uses loading columns `v_j√(λ_j−σ²)`. Pad missing spectral zeros when n<d; averaging only the thin stored spectrum would use the wrong discarded count. An orthogonal rotation of latent columns describes the same observed covariance; the local implementation fixes that convention. This nonsingular route requires positive noise variance and positive retained signal above noise. A zero-noise state needs a different singular-distribution treatment rather than evaluating an ordinary density.

<!-- visual:D42 -->

Conditioning on a query does not return the orthogonal PCA score directly. Combine the latent prior squared norm with the observed residual squared norm:

\[
\|t\|^2+\|a-Wt\|^2/\sigma^2.
\]

Completing the square gives `M=WᵀW+σ²I`, posterior mean solving `Mm=Wᵀa`, and posterior covariance `σ²M⁻¹`. Here `M=4.5` and RHS `2z`, so the decoded posterior mean is `(8/9)zv₁`, closer to the fitted mean than the orthogonal foot `zv₁`. For query `(6,4)`, `z=5/√2` gives latent mean about 1.571348 and raw posterior decode `(5.222222,4.222222)`, versus PCA's `(5.5,4.5)`. Posterior variance is 1/9; it is not reconstruction error.

The complete program uses Cholesky solves, rather than an explicit matrix inverse. Posterior covariance depends only on fitted W and noise, so it is computed once and stored with that fitted state; each later query solves only for its own mean. Its log density evaluates the stable quadratic `||a−Wm||²/σ²+||m||²`; its determinant is obtained from the small factored M. A full observed-covariance Cholesky on the tiny fixture independently matches the density. Ordinary PCA's sample eigenvalues are multiplied by `(n−1)/n` before the ML spectral comparison. Ordinary FactorAnalysis is also shown, but its diagonal noise model is more general than PPCA's isotropic one, so its iterative estimate is not declared an identical optimizer.

<!-- complete-program:probabilistic_pca.py -->

`probabilistic_pca.py` — complete program.

```python
"""N8: isotropic-noise ML spectral PPCA, posterior solves and log density."""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class ProbabilisticPCA:
    mean: np.ndarray
    weights: np.ndarray
    noise_variance: float
    ml_eigenvalues: np.ndarray
    posterior_cholesky: np.ndarray
    posterior_covariance: np.ndarray

    @classmethod
    def fit(cls, values, k):
        x = np.asarray(values, dtype=float)
        if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] < 1 or not np.isfinite(x).all():
            raise ValueError("Use a finite n-by-d table with n>=2")
        n, d = x.shape
        if (
            isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k < d
        ):
            raise ValueError("Use integer 0<=k<d")
        mean = x.mean(axis=0)
        _, singular_values, vh = np.linalg.svd(x - mean, full_matrices=False)
        eigenvalues = np.zeros(d)
        eigenvalues[: singular_values.size] = singular_values**2 / n
        noise = float(np.mean(eigenvalues[k:]))
        if not np.isfinite(noise) or noise <= 0:
            raise ValueError(
                "This nonsingular PPCA route requires positive noise variance"
            )
        if k and (k > vh.shape[0] or np.any(eigenvalues[:k] <= noise)):
            raise ValueError("Requested signal eigenvalues must exceed the noise level")
        directions = vh[:k].copy()
        for direction in directions:
            if direction[np.argmax(np.abs(direction))] < 0:
                direction *= -1
        weights = directions.T * np.sqrt(eigenvalues[:k] - noise)
        m = weights.T @ weights + noise * np.eye(k)
        cholesky = np.linalg.cholesky(m)
        # The covariance belongs to fitted state, not to an individual query.
        identity = np.eye(k)
        covariance = noise * np.linalg.solve(
            cholesky.T, np.linalg.solve(cholesky, identity)
        )
        for array in (mean, weights, eigenvalues, cholesky, covariance):
            array.setflags(write=False)
        return cls(mean, weights, noise, eigenvalues, cholesky, covariance)

    def posterior(self, values):
        rows = np.asarray(values, dtype=float)
        if (
            rows.ndim != 2
            or rows.shape[1] != self.mean.size
            or not np.isfinite(rows).all()
        ):
            raise ValueError("Use finite query rows in the fitted feature order")
        a = rows - self.mean
        rhs = a @ self.weights
        intermediate = np.linalg.solve(self.posterior_cholesky, rhs.T)
        latent_mean = np.linalg.solve(self.posterior_cholesky.T, intermediate).T
        return latent_mean, self.posterior_covariance

    def decode(self, latent_mean):
        t = np.asarray(latent_mean, dtype=float)
        if (
            t.ndim != 2
            or t.shape[1] != self.weights.shape[1]
            or not np.isfinite(t).all()
        ):
            raise ValueError("Use finite query-by-latent-count coordinates")
        return t @ self.weights.T + self.mean

    def log_density(self, values):
        rows = np.asarray(values, dtype=float)
        latent_mean, _ = self.posterior(rows)
        residual = rows - self.decode(latent_mean)
        quadratic = np.sum(residual**2, axis=1) / self.noise_variance + np.sum(
            latent_mean**2, axis=1
        )
        d, k = self.weights.shape
        logdet = (d - k) * np.log(self.noise_variance) + 2 * np.log(
            np.diag(self.posterior_cholesky)
        ).sum()
        return -0.5 * (d * np.log(2 * np.pi) + logdet + quadratic)


def main():
    from sklearn.decomposition import FactorAnalysis, PCA

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    state = ProbabilisticPCA.fit(x, 1)
    ordinary_pca = PCA(n_components=2, svd_solver="full").fit(x)
    print("ml_eigenvalues", state.ml_eigenvalues)
    print(
        "ordinary_sample_to_ml_eigenvalues",
        ordinary_pca.explained_variance_ * (len(x) - 1) / len(x),
    )
    print("noise_variance", state.noise_variance)
    print("weights_covariance", state.weights @ state.weights.T)
    queries = np.array([[6, 4], [3, 2]], dtype=float)
    latent_mean, posterior_covariance = state.posterior(queries)
    print("latent_posterior_means", latent_mean)
    print("latent_posterior_covariance", posterior_covariance)
    print("posterior_decoded", state.decode(latent_mean))
    print("query_log_density", state.log_density(queries))
    covariance = state.weights @ state.weights.T + state.noise_variance * np.eye(2)
    full_cholesky = np.linalg.cholesky(covariance)
    whitened = np.linalg.solve(full_cholesky, (queries - state.mean).T)
    reference = -0.5 * (
        2 * np.log(2 * np.pi)
        + 2 * np.log(np.diag(full_cholesky)).sum()
        + np.sum(whitened**2, axis=0)
    )
    print(
        "full_covariance_log_density_equal",
        np.allclose(state.log_density(queries), reference),
    )
    ordinary_fa = FactorAnalysis(
        n_components=1, svd_method="lapack", tol=1e-7, max_iter=1000
    ).fit(x)
    print("factor_analysis_diagonal_noise", ordinary_fa.noise_variance_)
    print("factor_analysis_covariance", ordinary_fa.get_covariance())
    wide = ProbabilisticPCA.fit([[1, 0, 0, 0], [-1, 0, 0, 0]], 0)
    print(
        "n_less_than_d_zero_padded_ml_spectrum",
        wide.ml_eigenvalues,
        wide.noise_variance,
    )


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
ml_eigenvalues [4.5 0.5]
ordinary_sample_to_ml_eigenvalues [4.5 0.5]
noise_variance 0.5000000000000001
weights_covariance [[2. 2.]
 [2. 2.]]
latent_posterior_means [[1.571348]
 [0.      ]]
latent_posterior_covariance [[0.111111]]
posterior_decoded [[5.222222 4.222222]
 [3.       2.      ]]
query_log_density [-4.132231 -2.243342]
full_covariance_log_density_equal True
factor_analysis_diagonal_noise [0.500061 0.500061]
factor_analysis_covariance [[2.500031 1.999969]
 [1.999969 2.500031]]
n_less_than_d_zero_padded_ml_spectrum [1. 0. 0. 0.] 0.25000000000000006
```

The main's fitted ML spectrum is 4.5/.5 and posterior density checks use two fixed queries. Its FactorAnalysis noise is approximately `.500061` on this constructed symmetric example; its small convergence error is not relabelled exact. Density/solve cost after fitting is `O(dk+k²)` per query when the small factorization is reused. P15 changes the retained query coordinate to 3 to test whether you can distinguish latent posterior mean, decoded coordinate and orthogonal foot.

### 10.4 Samples, stability and denoising

A model covariance and a fitted sample spectrum are different objects; an isotropic noise sample tests whether tall empirical bars alone identify structure.

<!-- visual:D43 -->

The saved Gaussian experiment used 40 observations and 20 independent standard-normal features, seed 23. Its fitted first two directions retain `.24591458952369985` of sample variation; an isotropic population's fixed two-dimensional orthonormal projection retains `2/20=.10`. The 20 saved bars and uniform population reference are different objects. PCA selected its axes after seeing finite sample variation, so the tallest fitted bars are not themselves proof of two underlying scientific factors.

The original full Gaussian code/output below gives a recorded reference example. Its original raw sample array was not retained; the saved spectrum supplies the reference comparison without implying that raw rows are available. Original8 asks you to generate a new seed23 sample, then a separate seed24 sample, with shape40×20 and standard-normal distribution fixed. Your new fitted spectra are new results; neither must match the reference decimals across environments. Naming a component still needs evidence appropriate to the claim: stability/repeated data, a suitable null/noise model, known measurement relationships or held-out task performance.

<!-- complete-program:original-programs/gaussian.py -->

`gaussian.py` — complete program.

```python
import numpy as np
from sklearn.decomposition import PCA

rng = np.random.default_rng(23)
noise = rng.normal(size=(40, 20))
pca = PCA(svd_solver="full").fit(noise)
print(round(pca.explained_variance_ratio_[:2].sum(), 4))
```

Retained historical output:

```text
0.2459
```

The complete read-only companion below supplies the already-recorded sample fraction and all earlier predictive fold outcomes. It imports only the checked state loader from the section6 compression reader. Both its sample-versus-population distinction and its fold/no-PCA comparison have now been taught; it prints stored values without sampling, fitting or evaluating new records. Download it with `saved_pca_queries.py`, `pca_saved_state.json` and `wine.csv`.

<!-- complete-program:saved_pca_outcomes.py -->

`saved_pca_outcomes.py` — complete program.

```python
"""Read recorded finite-sample and fold outcomes after §§8 and10.4."""

from saved_pca_queries import load_state


def main():
    state = load_state()
    print(
        "gaussian_saved_first_two_population_share",
        sum(state["gaussianSpectrum"]["ratios"][:2]),
        2 / 20,
    )
    for key, value in state["prediction"]["results"].items():
        print("saved_prediction", key, value)


if __name__ == "__main__":
    main()
```

Selected recorded reference output; same operations as the recorded calculation:

```text
gaussian_saved_first_two_population_share 0.24591458952369985 0.1
saved_prediction None [0.9722222222222222, 0.9722222222222222, 0.9722222222222222, 1.0, 1.0]
saved_prediction 2 [0.9444444444444444, 0.9722222222222222, 0.9166666666666666, 0.9714285714285714, 0.9714285714285714]
saved_prediction 8 [0.9722222222222222, 0.9722222222222222, 0.9722222222222222, 0.9714285714285714, 1.0]
```

The displayed lines are retained unchanged from the corresponding earlier saved-state report. They describe the published reference calculations. They are separate from the new learner draws requested in Original8.

The separate live noise calculation uses clean point `(2,2)` and the fixed diagonal ruler, with both noise orientations always visible. Perpendicular noise `(a,−a)` is discarded: the decoded point remains `(2,2)`, clean-target squared error 0, while residual to the noisy input is `2a²`. Parallel noise `(a,a)` survives: decode equals the noisy point, clean-target error `2a²` and input residual 0. At `a=0` both lanes coincide and both errors are 0. Thus an attractive low reconstruction loss against the noisy input need not mean better recovery of a clean target. This algebra describes the fixed projector; it is separate from the saved Gaussian fit and supplies no operational denoising guarantee.

### 10.5 Pixels, alarms and time

Coordinates need not be chemical measurements: map the same encoder and decoder to named pixel locations before using reconstruction as an application.

<!-- visual:D44 -->

A small image is a record whose features are pixel intensities. The three 3×3 grids show a mean image of .5 everywhere, a unit pattern with first-row entries `(1,−1,0)/√2`, and another with that pattern in the last row. Flattening uses row-major order, preserving each pixel's named location. The two patterns are orthonormal. Adding weights a and b produces `mean+aB₁+bB₂`; keeping only the first drops the last-row pattern. At `a=.3,b=−.2` and `k=1` its omitted squared pixel energy is `.04`. The controls' [-.5,.5] bounds keep every intensity in [0,1], so no hidden clipping changes the arithmetic.

<!-- visual:D45 -->

The same projection supplies two diagnostic quantities. Point P `(3,3)` has retained score squared 18 and essentially zero perpendicular residual; Q `(3,−3)` has score 0 and residual squared 18. A residual-only rule can miss an unusual position along a retained axis; a coordinate-size rule asks a different question. The drawing exposes both triangles and metrics. No fitted alert threshold or sensor-calibration claim accompanies this constructed example.

<!-- visual:D46 -->

PCA also forgets row order. Chronological records `(0,0),(1,1),(2,−1),(3,0)` and the permutation 0,2,1,3 have identical centered covariance. Their connecting time paths differ: the sum of squared successive steps is 9 versus 15. Observation identities follow the records through the permutation, while time positions change. A covariance representation cannot recover the missing time sequence; a temporal model needs that additional structure.

<!-- complete-program:pca_applications.py -->

`pca_applications.py` — complete program.

```python
"""N9: constructed pixels, two anomaly coordinates, time order and noise targets."""

import json
from pathlib import Path
import numpy as np


def pixel_patterns():
    mean = np.full((3, 3), 0.5)
    first = np.zeros((3, 3))
    second = np.zeros((3, 3))
    first[0, :2] = [1 / np.sqrt(2), -1 / np.sqrt(2)]
    second[2, :2] = [1 / np.sqrt(2), -1 / np.sqrt(2)]
    return mean, first, second


def decode_pixels(a, b, k):
    if k not in (1, 2) or not np.isfinite([a, b]).all() or max(abs(a), abs(b)) > 0.5:
        raise ValueError("Use weights in [-.5,.5] and kept count1 or2")
    mean, first, second = pixel_patterns()
    target = mean + a * first + b * second
    retained = mean + a * first + (b * second if k == 2 else 0)
    return target, retained, float(np.sum((target - retained) ** 2))


def score_and_residual(point):
    x = np.asarray(point, dtype=float)
    if x.shape != (2,) or not np.isfinite(x).all():
        raise ValueError("Use one finite two-coordinate point")
    direction = np.ones(2) / np.sqrt(2)
    score = float(x @ direction)
    foot = score * direction
    return score**2, float(np.sum((x - foot) ** 2)), foot


def noise_targets(magnitude, perpendicular=True):
    if not np.isfinite(magnitude) or magnitude < 0:
        raise ValueError("Use a finite nonnegative noise magnitude")
    clean = np.array([2.0, 2.0])
    noise = magnitude * np.array([1.0, -1.0 if perpendicular else 1.0])
    noisy = clean + noise
    _, _, decoded = score_and_residual(noisy)
    return (
        noisy,
        decoded,
        float(np.sum((clean - decoded) ** 2)),
        float(np.sum((noisy - decoded) ** 2)),
    )


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    mean, first, second = pixel_patterns()
    # Row-major flattening preserves each pixel's named location.
    images = np.array(
        [
            (mean + a * first + b * second).reshape(-1)
            for a, b in ((-0.4, -0.2), (-0.4, 0.2), (0.4, -0.2), (0.4, 0.2))
        ]
    )
    fitted = PCA(n_components=1, svd_solver="full").fit(images)
    target, retained, loss = decode_pixels(0.3, -0.2, 1)
    ordinary = fitted.inverse_transform(
        fitted.transform(target.reshape(1, -1))
    ).reshape(3, 3)
    print("pixel_target", target)
    print("pixel_retained_and_loss", retained, loss)
    print("pixel_ordinary_decoder_equal", np.allclose(retained, ordinary))
    print("pixel_full_kept_loss", decode_pixels(0.3, -0.2, 2)[2])
    for name, point in (("P", [3, 3]), ("Q", [3, -3])):
        print("alarm_score2_residual2_foot", name, score_and_residual(point))
    for perpendicular in (True, False):
        print(
            "noise_perpendicular_noisy_decoded_cleanloss_inputloss",
            perpendicular,
            noise_targets(1, perpendicular),
        )
    chronological = np.array([[0, 0], [1, 1], [2, -1], [3, 0]], dtype=float)
    permutation = [0, 2, 1, 3]
    reordered = chronological[permutation]
    print("chronological_and_permuted_rows", chronological, reordered)
    print(
        "covariance_permutation_equal",
        np.allclose(np.cov(chronological.T), np.cov(reordered.T)),
    )
    print(
        "path_squared_steps",
        np.sum(np.diff(chronological, axis=0) ** 2),
        np.sum(np.diff(reordered, axis=0) ** 2),
    )
    saved = json.loads(
        (Path(__file__).parent / "pca_saved_state.json").read_text(encoding="utf-8")
    )
    print(
        "saved_gaussian_first_two_and_population",
        sum(saved["gaussianSpectrum"]["ratios"][:2]),
        0.1,
    )


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
pixel_target [[0.712132 0.287868 0.5     ]
 [0.5      0.5      0.5     ]
 [0.358579 0.641421 0.5     ]]
pixel_retained_and_loss [[0.712132 0.287868 0.5     ]
 [0.5      0.5      0.5     ]
 [0.5      0.5      0.5     ]] 0.03999999999999998
pixel_ordinary_decoder_equal True
pixel_full_kept_loss 0.0
alarm_score2_residual2_foot P (17.999999999999996, 3.944304526105059e-31, array([3., 3.]))
alarm_score2_residual2_foot Q (0.0, 18.0, array([0., 0.]))
noise_perpendicular_noisy_decoded_cleanloss_inputloss True (array([3., 1.]), array([2., 2.]), 3.944304526105059e-31, 2.0)
noise_perpendicular_noisy_decoded_cleanloss_inputloss False (array([3., 3.]), array([3., 3.]), 1.9999999999999982, 3.944304526105059e-31)
chronological_and_permuted_rows [[ 0.  0.]
 [ 1.  1.]
 [ 2. -1.]
 [ 3.  0.]] [[ 0.  0.]
 [ 2. -1.]
 [ 1.  1.]
 [ 3.  0.]]
covariance_permutation_equal True
path_squared_steps 9.0 15.0
saved_gaussian_first_two_and_population 0.24591458952369985 0.1
```

The main gives the complete pixel decoder, both anomaly quantities, both noise-target errors, time-permutation check and read-only saved Gaussian reference. Its ordinary PCA comparison fits only the explicitly constructed four small image arrays; it neither downloads faces nor measures a real sensor task. The computed tiny residuals near `10⁻³¹` are floating-point roundoff around exact geometric zero. Changing an application purpose requires its own diagnostic and evidence rather than transplanting the same unlabelled score.

### 10.6 Randomized and incremental computation

The direct-SVD route stores a dense centered table; a small sampled range can reduce factorization work when only a few directions are needed.

<!-- visual:D47 -->

A dense million-row,5000-feature float64 table occupies 40GB decimal before factorization workspace. This is an arithmetic storage estimate, not a measured runtime. If we want only a few directions, a range finder first compresses the large row dimension. For `n=1000,d=100,k=10` and oversampling `p=5`, draw a 100×15 probe Ω, multiply `Y=AΩ`, and take reduced QR to obtain orthonormal Q with 1000 rows and 15 columns. The smaller table `B=QᵀA` is 15×100. Its SVD supplies feature directions, while multiplying Q by B's left singular vectors produces approximate left patterns in the original 1000-row space.

This approximation succeeds when Q captures the important range of A. Oversampling adds directions beyond the requested k. Neither an arbitrary short probe nor the same requested count guarantees exact parity with full SVD. Measure reconstruction residual and orthogonality on the actual inputs instead of inventing a speedup.

<!-- visual:D48 -->

Power iteration emphasizes large singular directions but can also destroy small numerical components. The live miniature fixes the centered table and probe, then shows QR after `AΩ`, QR after `AᵀQ`, and QR after multiplying back by A for each repetition. Changing q changes these actual stages; changing oversampling changes their port widths. Forming `(AAᵀ)^qAΩ` without normalization is a different numerical procedure. A zero-table inset has no positive signal direction, rather than dividing a zero range by its norm.

<!-- complete-program:randomized_pca.py -->

`randomized_pca.py` — complete program.

```python
"""N5: normalized randomized range finding on a centered table."""

import numpy as np


def randomized_pca(values, k, oversampling=2, powers=1, seed=7):
    x = np.asarray(values, dtype=float)
    if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] < 1 or not np.isfinite(x).all():
        raise ValueError("Use a finite n-by-d table, n>=2 and d>=1")
    n, d = x.shape
    for name, value in (("k", k), ("oversampling", oversampling), ("powers", powers)):
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, np.integer))
            or value < 0
        ):
            raise ValueError(name + " must be a nonnegative integer")
    if k > min(n, d):
        raise ValueError("Kept count exceeds the thin-factor size")
    mean = x.mean(axis=0)
    a = x - mean
    if not np.isfinite(a).all():
        raise ValueError("Centering overflowed")
    if k == 0 or not np.any(a):
        return {
            "mean": mean,
            "directions": np.empty((0, d)),
            "singular_values": np.empty(0),
            "requested_k": k,
            "effective_k": 0,
            "range_rank": 0,
            "relative_residual": 0.0 if not np.any(a) else 1.0,
            "orthogonality_error": 0.0,
            "passes": 0,
        }
    ell = min(k + oversampling, min(n, d))
    omega = np.random.default_rng(seed).standard_normal((d, ell))
    q, _ = np.linalg.qr(a @ omega, mode="reduced")
    for _ in range(powers):
        # Normalize each multiplication, rather than forming (A A.T)**powers.
        qz, _ = np.linalg.qr(a.T @ q, mode="reduced")
        q, _ = np.linalg.qr(a @ qz, mode="reduced")
    b = q.T @ a
    u_small, singular_values, vh = np.linalg.svd(b, full_matrices=False)
    floor = np.finfo(float).eps * max(n, d) * singular_values[0]
    rank = int(np.count_nonzero(singular_values > floor))
    kept = min(k, rank)
    directions = vh[:kept].copy()
    recovered = (a @ directions.T) @ directions
    norm = np.linalg.norm(a)
    return {
        "mean": mean,
        "directions": directions,
        "singular_values": singular_values[:kept],
        "approximate_left_vectors": q @ u_small[:, :kept],
        "requested_k": k,
        "effective_k": kept,
        "range_rank": rank,
        "relative_residual": float(np.linalg.norm(a - recovered) / norm),
        "orthogonality_error": float(
            np.linalg.norm(directions @ directions.T - np.eye(kept))
        ),
        "passes": 2 * powers + 2,
    }


def transform(values, state):
    rows = np.asarray(values, dtype=float)
    if (
        rows.ndim != 2
        or rows.shape[1] != state["mean"].size
        or not np.isfinite(rows).all()
    ):
        raise ValueError("Query rows must retain the fitted feature count")
    return (rows - state["mean"]) @ state["directions"].T


def inverse_transform(scores, state):
    z = np.asarray(scores, dtype=float)
    if z.ndim != 2 or z.shape[1] != state["effective_k"] or not np.isfinite(z).all():
        raise ValueError("Query scores must have the effective kept count")
    return z @ state["directions"] + state["mean"]


def main():
    from sklearn.decomposition import PCA
    from sklearn.utils.extmath import randomized_svd

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1, 0], [2, 0, 1], [4, 4, -1], [5, 3, 0], [3, 2, 2]], dtype=float)
    centered = x - x.mean(axis=0)
    exact = PCA(n_components=1, svd_solver="full").fit(x)
    for powers in (0, 2):
        state = randomized_pca(x, 1, oversampling=2, powers=powers, seed=7)
        _, _, vh = randomized_svd(
            centered,
            n_components=1,
            n_oversamples=2,
            n_iter=powers,
            power_iteration_normalizer="QR",
            random_state=7,
        )
        projector = state["directions"].T @ state["directions"]
        print(
            "powers_passes_effective_k", powers, state["passes"], state["effective_k"]
        )
        print(
            "residual_orthogonality",
            state["relative_residual"],
            state["orthogonality_error"],
        )
        print(
            "full_range_exact_projector_equal",
            np.allclose(projector, exact.components_.T @ exact.components_),
        )
        print("ordinary_randomized_projector_equal", np.allclose(projector, vh.T @ vh))
    limited = randomized_pca(x, 1, oversampling=0, powers=0, seed=7)
    print("limited_range_relative_residual", limited["relative_residual"])
    print(
        "exact_relative_residual",
        np.linalg.norm(
            centered - exact.inverse_transform(exact.transform(x)) + exact.mean_
        )
        / np.linalg.norm(centered),
    )
    collinear = randomized_pca([[0, 0], [1, 1], [2, 2]], 2)
    print(
        "collinear_requested_effective",
        collinear["requested_k"],
        collinear["effective_k"],
    )
    zero = randomized_pca(np.ones((3, 2)), 2)
    print(
        "constant_effective_and_query",
        zero["effective_k"],
        inverse_transform(transform([[2, 4]], zero), zero),
    )
    empty = randomized_pca(x, 0)
    print("k0_score_shape", transform(x, empty).shape)


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
powers_passes_effective_k 0 2 1
residual_orthogonality 0.484348696621605 2.220446049250313e-16
full_range_exact_projector_equal True
ordinary_randomized_projector_equal True
powers_passes_effective_k 2 6 1
residual_orthogonality 0.484348696621605 4.440892098500626e-16
full_range_exact_projector_equal True
ordinary_randomized_projector_equal True
limited_range_relative_residual 0.5130432638260607
exact_relative_residual 0.484348696621605
collinear_requested_effective 2 1
constant_effective_and_query 0 [[1. 1.]]
k0_score_shape (5, 0)
```

The complete main separately uses a disclosed seeded constructed probe. With all three feature directions captured, its one-coordinate projector matches exact PCA, residual about `.484349`; a restricted one-column probe at `q=0` leaves about `.513043`. These are tiny fixture diagnostics, not large-data performance measurements. The implementation returns an effective kept rank when a requested component has no numerical energy, stores the fitted mean, and exposes query/decoder operations. Its QR stages cost passes through A: roughly `O((2q+2)ndℓ+(q+1)(n+d)ℓ²+dℓ²)` with range-factor workspace `O((n+d)ℓ)` beyond the centered table, where `ℓ=min(k+p,min(n,d))`. Oversampling and power iterations are useful choices with real costs. The complete teaching function additionally materializes the centered table and its reconstruction/residual diagnostic, using `O(nd)` extra storage. Its fitted transform computes exact dot products with the approximate retained directions; `Q` times the small left factors is an approximate factorization, not a replacement for those query dot products. The ordinary `randomized_svd` route fixes the normalizer to QR; its random signs are compared through projectors and residuals, not raw direction labels.

<!-- visual:D49 -->

Row batches introduce a different obstacle: separately centering each batch erases shifts between their means. Two rows at `(−1,0)` and two at `(1,0)` each have zero within-batch scatter, yet their merged scatter is `diag(4,0)`. The missing term is the outer product of the difference between means, multiplied by `nb/(n+b)`. It can be represented as one extra row `√(nb/(n+b))(μ−ν)`, here `(−2,0)`.

For an old n-row state and new b-row batch B with mean ν, stack the old factor `diag(s)D`, the new centered rows `B−ν`, and that correction row. The cross-product of the stack is the sum of the two represented within-group scatters plus the between-mean correction. Take its SVD, keep k directions, and update the combined mean by `μ+b/(n+b)(ν−μ)`. Accumulate each original feature's centered scatter independently so the variance-share denominator does not omit previously discarded energy.

<!-- complete-program:incremental_pca.py -->

`incremental_pca.py` — complete program.

```python
"""N6: mean-corrected dense row batches with separately retained total scatter."""

from dataclasses import dataclass, field
import numpy as np


@dataclass
class IncrementalCenteredPCA:
    k: int
    n: int = 0
    mean: np.ndarray | None = None
    singular_values: np.ndarray = field(default_factory=lambda: np.empty(0))
    directions: np.ndarray | None = None
    feature_scatter: np.ndarray | None = None

    def partial_fit(self, values):
        batch = np.array(values, dtype=float, copy=True)
        if (
            batch.ndim != 2
            or batch.shape[0] == 0
            or batch.shape[1] == 0
            or not np.isfinite(batch).all()
        ):
            raise ValueError("Use a nonempty finite dense row batch")
        b, d = batch.shape
        if (
            isinstance(self.k, bool)
            or not isinstance(self.k, (int, np.integer))
            or not 0 <= self.k <= d
        ):
            raise ValueError("Use an integer kept count between zero and d")
        if self.n == 0 and b < max(2, self.k):
            raise ValueError("The first batch needs at least max(2,k) rows")
        if self.n and d != self.mean.size:
            raise ValueError("Feature count changed between batches")
        batch_mean = batch.mean(axis=0)
        centered = batch - batch_mean
        batch_scatter = np.sum(centered**2, axis=0)
        if self.n == 0:
            stack = centered
            next_mean = batch_mean
            next_scatter = batch_scatter
        else:
            difference = self.mean - batch_mean
            weight = self.n * b / (self.n + b)
            correction = np.sqrt(weight) * difference
            old_factor = self.singular_values[:, None] * self.directions
            stack = np.vstack((old_factor, centered, correction))
            next_mean = self.mean + b / (self.n + b) * (batch_mean - self.mean)
            next_scatter = self.feature_scatter + batch_scatter + weight * difference**2
        if not np.isfinite(stack).all() or not np.isfinite(next_scatter).all():
            raise ValueError("Scatter update overflowed; rescale the measurements")
        _, singular_values, vh = np.linalg.svd(stack, full_matrices=False)
        self.singular_values = singular_values[: self.k].copy()
        self.directions = vh[: self.k].copy()
        self.mean = next_mean
        self.feature_scatter = next_scatter
        self.n += b
        return self

    @property
    def variances(self):
        if self.n < 2:
            raise ValueError("No fitted sample variance")
        return self.singular_values**2 / (self.n - 1)

    @property
    def variance_ratios(self):
        total = np.sum(self.feature_scatter) if self.n else 0.0
        return None if total == 0 else self.singular_values**2 / total

    def transform(self, values):
        if self.n == 0:
            raise ValueError("Fit a training batch first")
        rows = np.asarray(values, dtype=float)
        if (
            rows.ndim != 2
            or rows.shape[1] != self.mean.size
            or not np.isfinite(rows).all()
        ):
            raise ValueError("Use finite query rows in the fitted feature order")
        return (rows - self.mean) @ self.directions.T

    def inverse_transform(self, scores):
        if self.n == 0:
            raise ValueError("Fit a training batch first")
        z = np.asarray(scores, dtype=float)
        if z.ndim != 2 or z.shape[1] != self.k or not np.isfinite(z).all():
            raise ValueError("Use a finite query-by-k score table")
        return z @ self.directions + self.mean


def main():
    from sklearn.decomposition import IncrementalPCA, PCA

    np.set_printoptions(precision=6, suppress=True)
    opposite = IncrementalCenteredPCA(1)
    opposite.partial_fit([[-2], [-2]]).partial_fit([[2], [2]])
    print(
        "opposite_means_mean_singular_variance",
        opposite.mean,
        opposite.singular_values,
        opposite.variances,
    )
    x = np.array([[0, 0], [2, 0], [0, 2], [1, 1]], dtype=float)
    scratch = IncrementalCenteredPCA(2).partial_fit(x[:3]).partial_fit(x[3:])
    ordinary = IncrementalPCA(n_components=2)
    ordinary.partial_fit(x[:3])
    ordinary.partial_fit(x[3:])
    exact = PCA(n_components=2, svd_solver="full").fit(x)
    print("smaller_tail_rows", x[3:].shape[0])
    print(
        "full_history_variance_equal",
        np.allclose(scratch.variances, exact.explained_variance_),
    )
    print(
        "ordinary_mean_variance_equal",
        np.allclose(scratch.mean, ordinary.mean_),
        np.allclose(scratch.variances, ordinary.explained_variance_),
    )
    print(
        "full_history_roundtrip",
        np.allclose(scratch.inverse_transform(scratch.transform(x)), x),
    )
    horizontal = np.array([[-np.sqrt(6), 0], [np.sqrt(6), 0]])
    vertical = np.array([[0, -2], [0, 2]], dtype=float)
    all_rows = np.vstack((horizontal, vertical, vertical))
    for name, batches in (
        ("horizontal_first", (horizontal, vertical, vertical)),
        ("vertical_first", (vertical, vertical, horizontal)),
    ):
        state = IncrementalCenteredPCA(1)
        library = IncrementalPCA(n_components=1)
        for batch in batches:
            state.partial_fit(batch)
            library.partial_fit(batch)
        print(name + "_projector", state.directions.T @ state.directions)
        print(
            name + "_retained_total_energy",
            state.singular_values**2,
            np.sum(state.feature_scatter),
        )
        print(
            name + "_global_loss",
            np.sum(
                (all_rows - state.inverse_transform(state.transform(all_rows))) ** 2
            ),
        )
        print(
            name + "_ordinary_projector_equal",
            np.allclose(
                state.directions.T @ state.directions,
                library.components_.T @ library.components_,
            ),
        )


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
opposite_means_mean_singular_variance [0.] [4.] [5.333333]
smaller_tail_rows 1
full_history_variance_equal True
ordinary_mean_variance_equal True True
full_history_roundtrip True
horizontal_first_projector [[1. 0.]
 [0. 0.]]
horizontal_first_retained_total_energy [12.] 28.0
horizontal_first_global_loss 16.0
horizontal_first_ordinary_projector_equal True
vertical_first_projector [[0. 0.]
 [0. 1.]]
vertical_first_retained_total_energy [16.] 28.0
vertical_first_global_loss 11.999999999999998
vertical_first_ordinary_projector_equal True
```

The first batch needs enough rows for its retained factors; this route requires at least `max(2,k)`. Later dense batches can contain fewer than k rows, as the actual ordinary comparison's one-row tail shows. Full retained scatter agrees with exact batch covariance, but truncating after an update loses history. In the main, horizontal scatter 12 arriving before two vertical scatter 8 batches keeps the horizontal axis and leaves global loss 16. The reverse order accumulates vertical scatter 16, retains that axis and leaves loss 12. Both inspect the same total 28. This is a constructed order counterexample, not a failure of the correction identity.

The local implementation has no forgetting factor and uses a fixed feature metric. If scaling is needed, compute it in a permitted first pass and freeze it before the PCA pass; changing online scales changes historical coordinates and requires another algorithm. One update factors about `b+k+1` working rows, costing `O((b+k+1)d·min(b+k+1,d))`; memory is bounded by those working rows and state, rather than all past records. Ordinary `IncrementalPCA.partial_fit` follows this dense-batch route; its separate `fit` batching and sparse densification behavior must not be confused with manual sparse partial fitting.

### 10.7 Kernel PCA

Batch and random-range methods keep the linear feature space; a kernel instead changes the features whose centered variation is optimized.

<!-- visual:D50 -->

The one-dimensional inputs `−1,0,1` become squared features `1,0,1`. Subtract their mean 2/3 to obtain `(1/3,−2/3,1/3)`. In this feature space the end inputs coincide. Their dot-product table, the **kernel**, is `K_ij=x_i²x_j²`. Training row/column means are `(2/3,0,2/3)`, grand mean 4/9. Centering selected corner cell gives `1−2/3−2/3+4/9=1/9`. Double centering produces `HKH=aaᵀ`, where `H=I−11ᵀ/n`. The nonzero eigenvalue is 2/3 with eigenvector `(1,−2,1)/√6`; fitted scores are `Q√κ=(1,−2,1)/3`, up to an orientation sign.

The kernel supplies feature dot products without explicitly constructing every feature coordinate. Its Gram matrix must be symmetric positive semidefinite. A materially negative eigenvalue signals a different or invalid kernel contract; only justified small negative roundoff is clipped/ignored. Positive eigendirections are normalized by `√κ`, rather than mistaken for the feature-space PCA variance itself. Local numerical rank uses its stated relative spectral floor.

<!-- visual:D51 -->

A later query 2 supplies kernel row `[4,0,4]` and query mean 8/3. Subtract the stored training column means and its own row mean, then add training grand mean 4/9. The result is `[10/9,−20/9,10/9]`. Multiplying by `Q/√κ=(1,−2,1)/2` gives `10/3`. In general this fixture's score is `x²−2/3`. Query−2 has the same score: the original input cannot be uniquely recovered from it. A second query must still use the same training means; centering the query batch as if it were a new fit changes the transform.

<!-- complete-program:kernel_pca.py -->

`kernel_pca.py` — complete program.

```python
"""N7: PSD kernel PCA with training-owned centering for future queries."""

from dataclasses import dataclass
import numpy as np


def kernel_table(x, y, kind, gamma=1.0, degree=2, offset=0.0):
    if kind == "linear":
        return x @ y.T
    if kind == "polynomial":
        return (gamma * (x @ y.T) + offset) ** degree
    if kind == "rbf":
        # Accumulate over features: no n-by-n-by-d temporary and no
        # subtraction of two almost equal squared norms.
        distance = np.zeros((x.shape[0], y.shape[0]))
        for feature in range(x.shape[1]):
            difference = x[:, feature, None] - y[None, :, feature]
            distance += difference**2
        return np.exp(-gamma * distance)
    raise ValueError("Choose linear, polynomial or rbf kernel")


@dataclass(frozen=True)
class KernelPCAState:
    training: np.ndarray
    column_mean: np.ndarray
    grand_mean: float
    eigenvalues: np.ndarray
    eigenvectors: np.ndarray
    kind: str
    gamma: float
    degree: int
    offset: float

    @classmethod
    def fit(cls, values, k, kind="linear", gamma=1.0, degree=2, offset=0.0):
        x = np.array(values, dtype=float, copy=True)
        if x.ndim != 2 or x.shape[0] < 2 or not np.isfinite(x).all():
            raise ValueError("Use a finite training table with at least two rows")
        n = x.shape[0]
        if (
            isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k <= n
        ):
            raise ValueError("Use integer 0<=k<=n")
        if (
            not np.isfinite(gamma)
            or gamma <= 0
            or not np.isfinite(offset)
            or offset < 0
        ):
            raise ValueError(
                "Positive finite gamma and nonnegative finite offset are required"
            )
        if (
            isinstance(degree, bool)
            or not isinstance(degree, (int, np.integer))
            or degree < 1
        ):
            raise ValueError("Polynomial degree must be a positive integer")
        gram = (
            x
            if kind == "precomputed"
            else kernel_table(x, x, kind, gamma, degree, offset)
        )
        if (
            gram.shape != (n, n)
            or not np.isfinite(gram).all()
            or not np.allclose(gram, gram.T, rtol=1e-12, atol=1e-14)
        ):
            raise ValueError("Training Gram table must be finite, square and symmetric")
        gram = (gram + gram.T) / 2
        # Validate the original Gram, not only the centered one.
        original_eigenvalues = np.linalg.eigvalsh(gram)
        original_floor = (
            np.finfo(float).eps * n * float(np.max(np.abs(original_eigenvalues)))
        )
        if original_eigenvalues.min() < -original_floor:
            raise ValueError("Training Gram table is materially indefinite")
        column_mean = gram.mean(axis=0)
        grand_mean = float(column_mean.mean())
        centered = gram - column_mean[None, :] - column_mean[:, None] + grand_mean
        centered = (centered + centered.T) / 2
        eigenvalues, eigenvectors = np.linalg.eigh(centered)
        order = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[order]
        eigenvectors = eigenvectors[:, order]
        floor = np.finfo(float).eps * n * max(float(eigenvalues[0]), original_floor)
        if eigenvalues.min() < -original_floor:
            raise ValueError("Centered Gram table is materially indefinite")
        kept = min(k, int(np.count_nonzero(eigenvalues > floor)))
        eigenvalues = eigenvalues[:kept].copy()
        eigenvectors = eigenvectors[:, :kept].copy()
        for j in range(kept):
            nonzero = np.flatnonzero(np.abs(eigenvectors[:, j]) > 1e-12)
            if nonzero.size and eigenvectors[nonzero[0], j] < 0:
                eigenvectors[:, j] *= -1
        for array in (x, column_mean, eigenvalues, eigenvectors):
            array.setflags(write=False)
        return cls(
            x,
            column_mean,
            grand_mean,
            eigenvalues,
            eigenvectors,
            kind,
            gamma,
            degree,
            offset,
        )

    @property
    def training_scores(self):
        return self.eigenvectors * np.sqrt(self.eigenvalues)

    def transform(self, values):
        rows = np.asarray(values, dtype=float)
        columns = (
            self.training.shape[0]
            if self.kind == "precomputed"
            else self.training.shape[1]
        )
        if rows.ndim != 2 or rows.shape[1] != columns or not np.isfinite(rows).all():
            raise ValueError(
                "Query table has the wrong finite feature/Gram-row contract"
            )
        gram = (
            rows
            if self.kind == "precomputed"
            else kernel_table(
                rows, self.training, self.kind, self.gamma, self.degree, self.offset
            )
        )
        # Each query owns its row mean; every query reuses the training column means.
        centered = (
            gram - self.column_mean + self.grand_mean - gram.mean(axis=1, keepdims=True)
        )
        return centered @ (self.eigenvectors / np.sqrt(self.eigenvalues))


def main():
    from sklearn.decomposition import KernelPCA, PCA

    np.set_printoptions(precision=6, suppress=True)
    training = np.array([[-1.0], [0.0], [1.0]])
    state = KernelPCAState.fit(
        training, 1, kind="polynomial", degree=2, offset=0, gamma=1
    )
    queries = np.array([[-2.0], [0.0], [1.0], [2.0]])
    print("square_lift_training_scores", state.training_scores)
    print("stored_column_and_grand_means", state.column_mean, state.grand_mean)
    print("square_lift_query_scores", state.transform(queries))
    ordinary = KernelPCA(
        n_components=1,
        kernel="poly",
        degree=2,
        gamma=1,
        coef0=0,
        eigen_solver="dense",
        remove_zero_eig=True,
        fit_inverse_transform=False,
    )
    library_scores = ordinary.fit_transform(training)
    print(
        "ordinary_training_score_gram_equal",
        np.allclose(
            state.training_scores @ state.training_scores.T,
            library_scores @ library_scores.T,
        ),
    )
    sign = np.sign(state.training_scores[0, 0] * library_scores[0, 0])
    print(
        "ordinary_query_equal_up_to_same_sign",
        np.allclose(state.transform(queries), ordinary.transform(queries) * sign),
    )
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    linear = KernelPCAState.fit(x, 2)
    pca = PCA(n_components=2, svd_solver="full").fit(x)
    scores = pca.transform(x)
    print(
        "linear_kernel_pca_score_gram_equal",
        np.allclose(
            linear.training_scores @ linear.training_scores.T, scores @ scores.T
        ),
    )
    repeated = KernelPCAState.fit([[1], [1], [1]], 1)
    print(
        "repeated_input_score_shapes",
        repeated.training_scores.shape,
        repeated.transform([[2], [3]]).shape,
    )
    gram = training**2 @ (training**2).T
    precomputed = KernelPCAState.fit(gram, 1, kind="precomputed")
    print(
        "precomputed_external_query", precomputed.transform(np.array([[4.0, 0.0, 4.0]]))
    )


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
square_lift_training_scores [[ 0.333333]
 [-0.666667]
 [ 0.333333]]
stored_column_and_grand_means [0.666667 0.       0.666667] 0.4444444444444444
square_lift_query_scores [[ 3.333333]
 [-0.666667]
 [ 0.333333]
 [ 3.333333]]
ordinary_training_score_gram_equal True
ordinary_query_equal_up_to_same_sign True
linear_kernel_pca_score_gram_equal True
repeated_input_score_shapes (3, 0) (2, 0)
precomputed_external_query [[3.333333]]
```

The complete scratch route stores kernel parameters, training rows and their means, then exposes forward query scores. Precomputed training input is n×n; future input is q×n, with each column corresponding to the original training row. Repeated training inputs produce no positive centered eigenspace and empty scores. The RBF route accumulates squared feature differences into a two-dimensional distance table, avoiding an n×n×d temporary. Dense fit costs `O(n²d+n³)` and memory `O(n²+nd)`; queries cost `O(qnd+qnk)` for a retained k basis.

Ordinary `KernelPCA` uses the dense eigensolver and removes zero eigendirections on these fixtures. Forward scores are compared with the same sign convention; linear-kernel score Gram matrices match ordinary centered PCA. `fit_inverse_transform=False` is explicit: a separately fitted ridge preimage can supply an approximate input reconstruction, but it is another model with regularization and error, not PCA's exact original-space decoder. This lesson's complete computational outcome is the forward train/query transform and its limits; it does not claim to provide that optional preimage fitter.

### 10.8 Sparse, robust and finite-grid variants

Orthogonal dense directions are convenient for decoding, but a purpose may call for a small set of contributing features or resistance to corrupted entries. Those changes require a new objective and sometimes a new serving operator.

<!-- visual:D52 -->

The atoms `(1,0)` and `(1,1)/√2` are not orthogonal: their dot product is `1/√2`. For query `(1,1)`, naive dot products `(1,√2)` decode to `(2,1)`. The correct ridge 0 coefficients solve the atom Gram system and give `(0,√2)`, decoding to the query. With serving ridge `ρ>0` the Gram adds `ρI`; dependent atoms at `ρ=0` instead need a minimum-norm solve because multiple coefficient vectors can decode identically. The fitted sparsity penalty and serving ridge are different controls and meanings.

Our complete modest-dimensional sparse dictionary route starts with centered A and solves

\[
\min_{Z,D}\ \tfrac12\|A-ZD\|_F^2+\alpha\|D\|_1,
\quad\text{subject to }\|Z_{:j}\|_2\le1.
\]

The constraint prevents unboundedly growing scores while shrinking atom coefficients to evade their penalty. A projected gradient step updates Z and projects each score column onto its unit ball. An entrywise soft-threshold step updates D. Their respective gradient Lipschitz values are `||DDᵀ||₂` and `||ZᵀZ||₂`; the code uses bounded backtracking on the actual objective and explicit zero-curvature cases.

The drawn one-step inset uses `A=[[1,1],[-1,-1]]`, score column `(1,−1)/√2`, atom `(1/√2,0)` and `α=.1`. Its unit-gradient atom trial is `(√2,√2)`, then thresholding gives `(√2−.1,√2−.1)`. The objective falls from about 1.320710678 to .272842712. This is a trace of one update, not an assertion that it has fitted the global optimum. The complete iterative program reports both objective change and a projected/proximal stationarity diagnostic, or a maximum-iteration status. This objective is nonconvex in both factors jointly; a stationary solution is not necessarily globally best.

Ordinary sklearn `SparsePCA` uses a related dictionary formulation and normalizes returned atoms. Its ridge transform therefore uses a distinct scale/state from our constrained Z/D factors; compare sparse supports, decode behavior and objective conventions rather than declaring identical signed axes. Zou–Hastie–Tibshirani's regression SPCA is another formulation involving a PCA-guided elastic-net regression criterion, not a synonym for this dictionary objective.

<!-- visual:D53 -->

Robust **principal component pursuit**, PCP, instead decomposes an observed matrix `M=L+S`, seeking a low-rank part and a sparse-entry part. The drawn 3×3 example has L all ones and one sparse entry 3 at its top-left, so M's top-left is 4. Its convex objective is `||L||_*+λ||S||₁`, where nuclear norm sums singular values and entrywise L1 sums absolute entries. A single-pixel E11 matrix is both rank 1 and sparse; decomposition is not generally identifiable merely because the penalties can be computed. Recovery results need conditions such as incoherent low-rank factors and suitably distributed sparse support, not just an “outlier” label.

Both threshold lanes use the same fixed illustrative operand `B=[[2,1],[1,2]]`. Entrywise soft threshold `sign(b)max(|b|−τ,0)` at `τ=1` gives I. Singular-value threshold first identifies eigen/singular values 3,1 with vectors `(1,1)/√2,(1,−1)/√2`, shrinks them to 2,0 and rebuilds a matrix of ones. One rebuilt corner is `2·(1/√2)²+0·(1/√2)²=1`. At `τ=2` the entrywise output is 0 while the singular output is .5 everywhere; at 0 both return B and at 3 both return 0. The common threshold is the live control, with both outputs permanently visible.

The full solver uses distinct updated operands. With scaled dual U and positive fixed ADMM penalty μ,

\[
L_{new}=\operatorname{SVT}_{1/\mu}(M-S+U),\quad
S_{new}=\operatorname{soft}_{\lambda/\mu}(M-L_{new}+U),\quad
U_{new}=U+M-L_{new}-S_{new}.
\]

The second threshold consumes the **new** L. Its sparse threshold need not equal the singular threshold, and neither operand is necessarily the illustrative B. Primal residual measures `M−L−S`; dual residual measures scaled change in the sparse block. The program checks separate absolute-plus-relative stopping limits, reports nonconvergence if exhausted and returns exact zeros for a zero matrix.

<!-- complete-program:pca_structured_variants.py -->

`pca_structured_variants.py` — complete program.

```python
"""N10: bounded sparse dictionary descent and fixed-penalty robust PCP ADMM."""

import numpy as np


def finite_matrix(values):
    matrix = np.asarray(values, dtype=float)
    if matrix.ndim != 2 or min(matrix.shape) < 1 or not np.isfinite(matrix).all():
        raise ValueError("Use a finite nonempty matrix")
    return matrix


def soft_threshold(values, threshold):
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("Threshold must be finite and nonnegative")
    matrix = np.asarray(values, dtype=float)
    return np.sign(matrix) * np.maximum(np.abs(matrix) - threshold, 0.0)


def singular_threshold(values, threshold):
    matrix = finite_matrix(values)
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("Threshold must be finite and nonnegative")
    u, singular_values, vh = np.linalg.svd(matrix, full_matrices=False)
    return (u * np.maximum(singular_values - threshold, 0.0)) @ vh


def project_columns(scores):
    norms = np.linalg.norm(scores, axis=0)
    return scores / np.maximum(1.0, norms)


def dictionary_objective(a, scores, atoms, alpha):
    return 0.5 * np.sum((a - scores @ atoms) ** 2) + alpha * np.abs(atoms).sum()


def sparse_dictionary(values, k, alpha=0.1, max_iterations=2000, tolerance=1e-7):
    a = finite_matrix(values)
    if (
        isinstance(k, bool)
        or not isinstance(k, (int, np.integer))
        or not 1 <= k <= min(a.shape)
    ):
        raise ValueError("Use integer 1<=k<=min(n,d)")
    if not np.isfinite(alpha) or alpha < 0 or max_iterations < 1 or tolerance <= 0:
        raise ValueError("Use nonnegative alpha, positive iterations and tolerance")
    u, singular_values, vh = np.linalg.svd(a, full_matrices=False)
    scores = u[:, :k].copy()
    atoms = singular_values[:k, None] * vh[:k]
    objective = float(dictionary_objective(a, scores, atoms, alpha))
    history = []
    status = "max_iterations"
    for iteration in range(1, max_iterations + 1):
        old_objective = objective
        curvature = float(np.linalg.norm(atoms @ atoms.T, 2))
        if curvature == 0:
            scores = np.zeros_like(scores)
        else:
            gradient = (scores @ atoms - a) @ atoms.T
            step = 1 / curvature
            for _ in range(60):
                trial = project_columns(scores - step * gradient)
                if dictionary_objective(
                    a, trial, atoms, alpha
                ) <= old_objective + 1e-14 * max(1.0, old_objective):
                    scores = trial
                    break
                step *= 0.5
            else:
                raise ArithmeticError("Score-step backtracking failed")
        intermediate_objective = float(dictionary_objective(a, scores, atoms, alpha))
        curvature = float(np.linalg.norm(scores.T @ scores, 2))
        if curvature == 0:
            atoms = np.zeros_like(atoms)
        else:
            gradient = scores.T @ (scores @ atoms - a)
            step = 1 / curvature
            for _ in range(60):
                trial = soft_threshold(atoms - step * gradient, step * alpha)
                if dictionary_objective(
                    a, scores, trial, alpha
                ) <= intermediate_objective + 1e-14 * max(1.0, intermediate_objective):
                    atoms = trial
                    break
                step *= 0.5
            else:
                raise ArithmeticError("Atom-step backtracking failed")
        objective = float(dictionary_objective(a, scores, atoms, alpha))
        residual = scores @ atoms - a
        score_mapping = scores - project_columns(scores - residual @ atoms.T)
        atom_mapping = atoms - soft_threshold(atoms - scores.T @ residual, alpha)
        stationarity = float(
            np.hypot(np.linalg.norm(score_mapping), np.linalg.norm(atom_mapping))
        )
        history.append((iteration, objective, stationarity))
        relative_change = abs(old_objective - objective) / max(1.0, abs(old_objective))
        if relative_change <= tolerance and stationarity <= tolerance * max(
            1.0, np.linalg.norm(a)
        ):
            status = "stationary"
            break
    return {
        "scores": scores,
        "atoms": atoms,
        "objective": objective,
        "history": history,
        "status": status,
    }


def score_atoms(values, atoms, ridge=0.0):
    rows = finite_matrix(values)
    d = finite_matrix(atoms)
    if rows.shape[1] != d.shape[1] or not np.isfinite(ridge) or ridge < 0:
        raise ValueError("Use matching features and nonnegative finite ridge")
    if ridge == 0:
        # Minimum-norm coefficients even when the atoms are dependent.
        return np.linalg.lstsq(d.T, rows.T, rcond=None)[0].T
    gram = d @ d.T + ridge * np.eye(d.shape[0])
    cholesky = np.linalg.cholesky(gram)
    return np.linalg.solve(cholesky.T, np.linalg.solve(cholesky, d @ rows.T)).T


def robust_pcp(
    values,
    sparse_penalty=None,
    penalty=1.0,
    max_iterations=3000,
    absolute_tolerance=1e-7,
    relative_tolerance=1e-6,
):
    matrix = finite_matrix(values)
    lam = 1 / np.sqrt(max(matrix.shape)) if sparse_penalty is None else sparse_penalty
    if not np.isfinite(lam) or lam < 0 or not np.isfinite(penalty) or penalty <= 0:
        raise ValueError("Use nonnegative sparse penalty and positive ADMM penalty")
    if max_iterations < 1 or absolute_tolerance <= 0 or relative_tolerance <= 0:
        raise ValueError("Use positive iteration and tolerance settings")
    low = np.zeros_like(matrix)
    sparse = np.zeros_like(matrix)
    dual = np.zeros_like(matrix)
    if not np.any(matrix):
        return {
            "low": low,
            "sparse": sparse,
            "status": "zero_matrix",
            "history": [],
            "objective": 0.0,
        }
    history = []
    status = "max_iterations"
    root_size = np.sqrt(matrix.size)
    for iteration in range(1, max_iterations + 1):
        old_sparse = sparse.copy()
        low = singular_threshold(matrix - sparse + dual, 1 / penalty)
        sparse = soft_threshold(matrix - low + dual, lam / penalty)
        residual = matrix - low - sparse
        dual = dual + residual
        primal_norm = float(np.linalg.norm(residual))
        dual_norm = float(penalty * np.linalg.norm(sparse - old_sparse))
        primal_limit = root_size * absolute_tolerance + relative_tolerance * max(
            np.linalg.norm(low), np.linalg.norm(sparse), np.linalg.norm(matrix)
        )
        dual_limit = (
            root_size * absolute_tolerance
            + relative_tolerance * penalty * np.linalg.norm(dual)
        )
        history.append((iteration, primal_norm, dual_norm, primal_limit, dual_limit))
        if primal_norm <= primal_limit and dual_norm <= dual_limit:
            status = "converged"
            break
    objective = float(
        np.linalg.svd(low, compute_uv=False).sum() + lam * np.abs(sparse).sum()
    )
    return {
        "low": low,
        "sparse": sparse,
        "status": status,
        "history": history,
        "objective": objective,
    }


def optional_convex_pcp(matrix, sparse_penalty):
    try:
        import cvxpy as cp
    except ImportError:
        return {"status": "optional_package_unavailable"}
    low = cp.Variable(matrix.shape)
    sparse = cp.Variable(matrix.shape)
    problem = cp.Problem(
        cp.Minimize(cp.normNuc(low) + sparse_penalty * cp.norm1(sparse)),
        [low + sparse == matrix],
    )
    problem.solve()
    return {
        "status": problem.status,
        "objective": problem.value,
        "low": low.value,
        "sparse": sparse.value,
    }


def main():
    from sklearn.decomposition import SparsePCA

    np.set_printoptions(precision=6, suppress=True)
    operand = np.array([[2, 1], [1, 2]], dtype=float)
    for threshold in (0, 1, 2, 3):
        print(
            "shared_operand_threshold",
            threshold,
            "entrywise",
            soft_threshold(operand, threshold),
            "singular",
            singular_threshold(operand, threshold),
        )
    atoms = np.array([[1, 0], [1 / np.sqrt(2), 1 / np.sqrt(2)]])
    for ridge in (0.0, 0.1):
        print("nonorthogonal_atom_scores", ridge, score_atoms([[1, 1]], atoms, ridge))
    a = np.array([[2, 1, 0], [-2, -1, 0], [1, 0, 1], [-1, 0, -1]], dtype=float)
    fitted = sparse_dictionary(a, 2, alpha=0.2)
    print(
        "dictionary_status_objective_iterations",
        fitted["status"],
        fitted["objective"],
        len(fitted["history"]),
    )
    print("dictionary_atoms", fitted["atoms"])
    print("dictionary_score_column_norms", np.linalg.norm(fitted["scores"], axis=0))
    ordinary = SparsePCA(
        n_components=2,
        alpha=0.2,
        ridge_alpha=0.01,
        method="cd",
        random_state=0,
        max_iter=2000,
        tol=1e-7,
    ).fit(a)
    print("ordinary_sparse_atoms", ordinary.components_)
    print("ordinary_ridge_query_scores", ordinary.transform([[1, 1, 0]]))
    matrix = np.ones((3, 3))
    matrix[0, 0] += 3
    result = robust_pcp(matrix)
    print(
        "pcp_status_objective_iterations",
        result["status"],
        result["objective"],
        len(result["history"]),
    )
    print("pcp_low", result["low"])
    print("pcp_sparse", result["sparse"])
    print("pcp_last_primal_dual_limits", result["history"][-1])
    ambiguous = np.array([[1.0, 0], [0, 0]])
    print(
        "E11_nuclear_l1",
        np.linalg.svd(ambiguous, compute_uv=False).sum(),
        np.abs(ambiguous).sum(),
    )
    print("zero_pcp_status", robust_pcp(np.zeros((2, 2)))["status"])
    optional = optional_convex_pcp(matrix, 1 / np.sqrt(3))
    print(
        "optional_convex_status_objective",
        optional["status"],
        optional.get("objective"),
    )


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
shared_operand_threshold 0 entrywise [[2. 1.]
 [1. 2.]] singular [[2. 1.]
 [1. 2.]]
shared_operand_threshold 1 entrywise [[1. 0.]
 [0. 1.]] singular [[1. 1.]
 [1. 1.]]
shared_operand_threshold 2 entrywise [[0. 0.]
 [0. 0.]] singular [[0.5 0.5]
 [0.5 0.5]]
shared_operand_threshold 3 entrywise [[0. 0.]
 [0. 0.]] singular [[0. 0.]
 [0. 0.]]
nonorthogonal_atom_scores 0.0 [[-0.        1.414214]]
nonorthogonal_atom_scores 0.1 [[0.140845 1.19511 ]]
dictionary_status_objective_iterations stationary 1.2502195841050028 107
dictionary_atoms [[-2.960041 -1.201734 -0.      ]
 [ 0.       -0.313033  1.21219 ]]
dictionary_score_column_norms [1. 1.]
ordinary_sparse_atoms [[ 0.926553  0.376164  0.      ]
 [ 0.       -0.250112  0.968217]]
ordinary_ridge_query_scores [ 1.277839 -0.128603]
pcp_status_objective_iterations converged 4.732050737962252 38
pcp_low [[0.999996 0.999998 0.999998]
 [0.999998 1.000001 1.000001]
 [0.999998 1.000001 1.000001]]
pcp_sparse [[3.000004 0.       0.      ]
 [0.       0.       0.      ]
 [0.       0.       0.      ]]
pcp_last_primal_dual_limits (38, 3.4487213449447624e-06, 3.048083341283814e-07, np.float64(5.198979485566356e-06), np.float64(1.3648827778794971e-06))
E11_nuclear_l1 1.0 1.0
zero_pcp_status zero_matrix
optional_convex_status_objective optimal 4.732114031813975
```

The constructed PCP run reports converged in 38 iterations, objective about 4.732050738, with both stopping bounds met; its factors approximate the declared ones/spike state within the displayed tolerances. Optional CVXPY solves the same convex objective and reports its solver status, rather than standing in for the from-scratch loop. It was available for the recorded tiny comparison, with objective about 4.732114032. A future environment without it can still run the NumPy scratch route. This tiny consistency check is neither universal identifiability nor a large-video benchmark. Each dense SVT dominates an iteration at roughly `O(nd·min(n,d))`; massive datasets need a different scale-appropriate implementation.

<!-- visual:D54 -->

For functions sampled on an unequal grid, the numerical metric should reflect its question. At times `(0,1,3)`, trapezoidal quadrature weights are `(.5,1.5,1)`. Residual `(1,0,1)` has weighted squared error 1.5 versus unweighted 2. Multiplying each sampled coordinate by `√w` lets ordinary centered PCA optimize this finite weighted metric; inverse scaling restores sampled values. A zero weight deletes a coordinate and prevents recovering it by division, so our invertible route requires positive weights. These are finite-grid functions, not a complete estimator for irregular sparse functional observations or biological timing.

### 10.9 Choose a representation, not a favourite name

The sparse and robust branches changed the objective; compare other representation choices by what they preserve rather than by their names.

<!-- visual:D55 -->

The alternatives change what the representation preserves. Feature selection keeps a named original column. Random projection uses a sampled linear map for a distance-approximation question rather than fitted maximum variance. Uncentered TruncatedSVD on `(10,−1),(10,1)` chooses the large x offset; centered PCA chooses the varying y axis. Centering sparse data generally densifies it, so sparse uncentered SVD is a computationally useful different objective, rather than a transparent substitute.

The original four-row centered fixture also distinguishes PCA from response regression. PCA's diagonal line has slope 1 and perpendicular SSE 2. Ordinary least squares designates y as response and minimizes vertical errors: slope `8/10=.8`, vertical SSE 3.6. These totals measure different error geometries and cannot be ranked as if they were the same loss. A circle-to-one-coordinate projection has collisions, illustrating why a nonlinear manifold picture may need a different representation.

<!-- complete-program:pca_representation_choices.py -->

`pca_representation_choices.py` — complete program.

```python
"""N11: explicit finite-grid metric and alternative representation objectives."""

import numpy as np

from centered_pca import CenteredPCA


def weighted_grid_pca(curves, weights, k):
    rows = np.asarray(curves, dtype=float)
    w = np.asarray(weights, dtype=float)
    if (
        rows.ndim != 2
        or w.shape != (rows.shape[1],)
        or not np.isfinite(w).all()
        or np.any(w <= 0)
    ):
        raise ValueError("Use one finite positive quadrature weight per grid position")
    root_weights = np.sqrt(w)
    state = CenteredPCA.fit(rows * root_weights, k)
    scores = state.transform(rows * root_weights)
    recovered = state.inverse_transform(scores) / root_weights
    return state, scores, recovered


def main():
    from scipy.sparse import csr_matrix
    from sklearn.decomposition import PCA, TruncatedSVD
    from sklearn.linear_model import LinearRegression
    from sklearn.random_projection import GaussianRandomProjection

    np.set_printoptions(precision=6, suppress=True)
    grid = np.array([0.0, 1.0, 3.0])
    weights = np.array([0.5, 1.5, 1.0])
    curves = np.array([[0, 0, 0], [1, 1, 2], [-1, 2, 1], [2, -1, 0]], dtype=float)
    state, scores, recovered = weighted_grid_pca(curves, weights, 1)
    ordinary = PCA(n_components=1, svd_solver="full").fit(curves * np.sqrt(weights))
    library_recovered = ordinary.inverse_transform(
        ordinary.transform(curves * np.sqrt(weights))
    ) / np.sqrt(weights)
    print("grid_and_weights", grid, weights)
    print("weighted_library_decoder_equal", np.allclose(recovered, library_recovered))
    print("weighted_reconstruction_loss", np.sum(weights * (curves - recovered) ** 2))
    residual = np.array([1.0, 0.0, 1.0])
    print(
        "unweighted_weighted_changed_error",
        np.sum(residual**2),
        np.sum(weights * residual**2),
    )
    paired = np.array([[-2, -1], [-1, -2], [1, 2], [2, 1]], dtype=float)
    pca = CenteredPCA.fit(paired, 1)
    ols = LinearRegression().fit(paired[:, :1], paired[:, 1])
    print(
        "pca_ols_line_slopes", pca.directions[0, 1] / pca.directions[0, 0], ols.coef_[0]
    )
    print(
        "pca_perpendicular_loss",
        np.sum((paired - pca.inverse_transform(pca.transform(paired))) ** 2),
    )
    print("ols_vertical_loss", np.sum((paired[:, 1] - ols.predict(paired[:, :1])) ** 2))
    offset = np.array([[10.0, -1], [10.0, 1]])
    centered = PCA(n_components=1, svd_solver="full").fit(offset)
    uncentered = TruncatedSVD(
        n_components=1, algorithm="randomized", random_state=0
    ).fit(csr_matrix(offset))
    print("centered_uncentered_axes", centered.components_, uncentered.components_)
    print("uncentered_mean_was_not_removed", offset.mean(axis=0))
    random_rows = np.array([[1.0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 1]])
    ordinary_projection = GaussianRandomProjection(n_components=2, random_state=17).fit(
        random_rows
    )
    scratch_weights = np.random.RandomState(17).normal(0, 1 / np.sqrt(2), size=(2, 4))
    transformed = random_rows @ scratch_weights.T
    print(
        "random_projection_same_draw_equal",
        np.allclose(transformed, ordinary_projection.transform(random_rows)),
    )
    print(
        "original_projected_pair_distances",
        np.linalg.norm(random_rows[0] - random_rows[1]),
        np.linalg.norm(transformed[0] - transformed[1]),
    )
    print("selected_original_feature", random_rows[:, 0])


if __name__ == "__main__":
    main()
```

Recorded new instructional output:

```text
grid_and_weights [0. 1. 3.] [0.5 1.5 1. ]
weighted_library_decoder_equal True
weighted_reconstruction_loss 2.368359067995901
unweighted_weighted_changed_error 2.0 1.5
pca_ols_line_slopes 0.9999999999999999 0.8
pca_perpendicular_loss 2.0
ols_vertical_loss 3.6000000000000005
centered_uncentered_axes [[0. 1.]] [[1. 0.]]
uncentered_mean_was_not_removed [10.  0.]
random_projection_same_draw_equal True
original_projected_pair_distances 1.4142135623730951 1.6220776484531783
selected_original_feature [1. 0. 0.]
```

This complete program supplies the weighted-grid scratch/library decoder, PCA/OLS comparison, explicit sparse uncentered route and a matched sampled random-projection matrix. For the latter it uses the same declared seed and normal draw as `GaussianRandomProjection`, then prints one original and projected pair distance. The single pair is a diagnostic of that finite map, not a universal Johnson–Lindenstrauss guarantee. A distance guarantee needs its dimension/probability assumptions and a specified finite set.

| Purpose | Mechanism and useful output | Limit and next route |
|---|---|---|
| Keep interpretable original attributes | Select named feature columns | May discard interactions; justify the chosen attributes using the task |
| Approximate distances cheaply | Random linear coordinates | Stochastic finite-set guarantees have assumptions; not maximum variance or an exact decoder |
| Minimize centered reconstruction loss | PCA with a stated metric | Linear and unsupervised; inspect omitted task information |
| Preserve sparse input without centering | TruncatedSVD | Retains offsets; different objective from centered PCA |
| Explore nonlinear neighbourhoods | t-SNE/UMAP neighbourhood procedures | Not PCA variance fractions, causal clusters or exact inverse; [Manifold Learning](/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml) develops these objectives |
| Seek independent latent coordinates | ICA with extra distribution assumptions | Decorrelation alone was disproved by D37a; [ICA](/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml) owns its optimizer |
| Express nonnegative additive parts | NMF constrained factors | Different nonnegative domain/objective; [NMF](/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml) owns the full route |
| Learn nonlinear reconstruction | Encoder/decoder parameters | Optimization, data and generalization assumptions differ; the full autoencoder fitting route is a separate extension, not an existing local prerequisite or computational promise of this lesson |

UMAP can transform later observations through its trained procedure; that operation is not the same fixed linear multiplication as PCA. A nonlinear map also does not automatically make visual clusters causal or preserve a global quantitative distance. The full optimizers in these other lessons are separate computational outcomes, not hidden missing components of the PCA pipeline.

### 10.10 A complete reproducible decision

Return to Wine and name the observation unit: one wine with 13 chemical measurements. State the purpose before choosing the representation. For a descriptive collection map, use the full 178-row state and report its metric and external cultivar annotation without an unseen-performance claim. For compression, use the saved 133-row training state, retained mean/scales/basis and the 45-row validation curve. At budget .10 choose 8; at .06 choose 10. Inspect row 35's reconstruction and a legal changed query, identifying which errors are standardized and which are restored physical measurements. Record storage including the decoder, and distinguish selection evidence from final evaluation.

For prediction, report every saved no-PCA/`k=2`/`k=8` fold outcome and the exact pipeline boundary, rather than selecting only the highest-looking result. A new modeling choice needs a forward protocol: permitted training/validation/test roles, preprocessing learned within those roles, candidate budget and decision rule before outcomes, retained state and honest failures. Declare those choices before your new run, then compute and label its outcomes separately from the existing folds. The supplied saved-state readers support offline reference inspection, while the complete ordinary recipes let you carry out the independent mini-project; its new outcome does not overwrite the reference study. The independent mini-project asks you to communicate this whole decision, not merely print a component count.

## 11. What you should now be able to do

Explain what belongs to a record, feature, direction, score and decoder; trace one signed score and recovered point; connect perpendicular error with retained variance under a fixed metric. Apply a training-only centered transform and its ordinary library counterpart, project a future row, reverse scaling, choose a stated budget and inspect the omitted error. Diagnose an undefined zero-energy fraction, a tied axis, a misleading loading label, a label-discarding high-variance coordinate and a pipeline leak.

For deeper work, justify the direct-SVD numerical choice, a normalized approximate range, a batch mean correction, training-owned kernel centering or PPCA posterior solve. State why sparse atoms need a Gram solve and why low-rank/sparse penalties cannot identify every decomposition. Choose the objective and evidence before choosing a method name.

Continue to [K-Means & Hierarchical Clustering](/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml) for distance-based grouping or [Manifold Learning](/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml) for nonlinear neighbourhood questions. The [ordinary FactorAnalysis documentation](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FactorAnalysis.html) extends the local latent-model comparison to feature-specific noise; there is no separately published local Factor Analysis lesson in the current catalogue. These routes answer different limitations; a complete PCA calculation is useful preparation rather than a claim of mastery over them.

## Further learning

- [Shlens, A Tutorial on Principal Component Analysis](https://arxiv.org/abs/1404.1100) builds the geometric and SVD views together. Revisit its measurement organization and factorization after tracing this lesson's four records.
- [MIT 18.650 PCA lecture notes](https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/d85e1a9d113142ade8ce5e4f5ef0b4e8_MIT18_650F16_PCA.pdf) give a statistics-oriented explanation of covariance, sample versus population and high-dimensional limits.
- [Jolliffe & Cadima's PCA review](https://doi.org/10.1098/rsta.2015.0202) surveys the method and variants. Use it to connect familiar core geometry with the deeper branches, rather than substituting terminology for their mechanisms.
- [The official Wine scaling example](https://scikit-learn.org/stable/auto_examples/preprocessing/plot_scaling_importance.html) is another applied way to see that feature scaling changes PCA. Its experiment is separate from this lesson's recorded reference results.

## Technical references

- [Pearson 1901](https://doi.org/10.1080/14786440109462720) develops best-fitting lines/planes through perpendicular-distance geometry; the local PCA/OLS contrast uses that distinction.
- [Schölkopf, Smola & Müller kernel PCA technical report](https://www.aoml.noaa.gov/ftp/pub/phod/thacker/SSAmanifoldPapers/SchoelkopfSmolaMueller1996.pdf), section 2 and centering appendix, supplies feature-space eigenvector normalization and the kernel route.
- [Tipping & Bishop, Mixtures of Probabilistic Principal Component Analysers](https://www.miketipping.com/papers/met-mppca.pdf), sections 2–3, contains the single-model latent Gaussian derivation used here; the title is not the separate JRSS PPCA paper.
- [Halko, Martinsson & Tropp](https://arxiv.org/abs/0909.4061), algorithms 4.1/4.4/5.1, explains random ranges, normalized power iteration and compressed factorization.
- [Ross, Lim, Lin & Yang](https://www.cs.toronto.edu/~dross/ivt/RossLimLinYang_ijcv.pdf), section 3.1, develops the mean-corrected incremental update; its tracking benchmarks are not this lesson's evidence.
- [Zou, Hastie & Tibshirani](https://web.stanford.edu/~hastie/Papers/spc_jcgs.pdf), section 3, gives regression sparse PCA, whose formulation is distinguished from our dictionary route.
- [Candès, Li, Ma & Wright](https://arxiv.org/abs/0912.3599), identifiability conditions and algorithmic discussion, provides PCP's low-rank/sparse problem and recovery assumptions.
- Official [NumPy SVD](https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html), [PCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html), [IncrementalPCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.IncrementalPCA.html), [KernelPCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.KernelPCA.html), [SparsePCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.SparsePCA.html), [FactorAnalysis](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FactorAnalysis.html) and [StandardScaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html) document the ordinary contracts. New instructional outputs here use NumPy 2.3.5 and scikit-learn 1.9.1; the historical execution keeps its own environment and date.
- The [data-leakage guide](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) explains why even unsupervised fitted preprocessing belongs inside training boundaries. [UCI Wine](https://archive.ics.uci.edu/dataset/109/wine) supplies the dataset provenance and licence.

For offline use, `PCA-SETUP.md` lists each complete local import/data group and the historical continuation recipes. The saved-state entry runs with its sibling JSON and Wine CSV; the tiny two-column route needs the complete matrix-decomposition helper. Source files, exact recorded stdout and data remain available together in the common file index. Copy/Download supplies the complete named file, while the visible code here explains its operations.

<!-- common-file-index:complete-programs-dependencies-data -->
