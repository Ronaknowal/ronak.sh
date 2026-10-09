"""Learn compressed conditional means, then recover a sparse approximation.

AY is a linear measurement, not a label probability. Ridge fits measurements;
scratch OMP and ordinary OrthogonalMatchingPursuit solve A v ~= z. A random
dictionary's seed and actual coherence are printed, not a claimed RIP proof.
"""

import warnings

import numpy as np
from sklearn.linear_model import OrthogonalMatchingPursuit, Ridge
from sklearn.preprocessing import StandardScaler


def dictionary(value):
    value = np.asarray(value, dtype=float)
    if value.ndim != 2 or not value.size or not np.isfinite(value).all():
        raise ValueError("Use a finite measurement-by-label matrix")
    norms = np.linalg.norm(value, axis=0)
    if not np.isfinite(norms).all() or np.any(norms <= 0):
        raise ValueError("Every label atom needs a finite nonzero norm")
    if not np.allclose(norms, 1.0, rtol=0, atol=1e-12):
        raise ValueError("The recovery dictionary must have normalized columns")
    return value


def random_dictionary(measurements, labels, seed=71, max_entries=2000000):
    if any(
        isinstance(v, bool) or not isinstance(v, int) or v < 1
        for v in (measurements, labels)
    ):
        raise ValueError("Use positive integer measurement and label dimensions")
    if (
        isinstance(max_entries, bool)
        or not isinstance(max_entries, int)
        or max_entries < 1
        or measurements * labels > max_entries
    ):
        raise ValueError("Dictionary materialization exceeds its declared entry budget")
    rng = np.random.default_rng(seed)
    value = rng.normal(size=(measurements, labels))
    norms = np.linalg.norm(value, axis=0)
    if np.any(norms == 0) or not np.isfinite(norms).all():
        raise ValueError("This declared draw has an unsupported zero/nonfinite atom")
    return dictionary(value / norms)


def coherence(a):
    a = dictionary(a)
    gram = np.abs(a.T @ a)
    np.fill_diagonal(gram, 0)
    return float(gram.max())


def omp(a, measurement, max_atoms=2, tolerance=1e-10):
    """Select by absolute correlation, solve on active atoms, update residual.

    Ties choose the smallest original label index. Already chosen atoms are
    excluded. A dependent new active system fails explicitly. A residual or
    correlation stopping condition is different from a sparsity-cap stop.
    """
    a = dictionary(a)
    measurement = np.asarray(measurement, dtype=float)
    if measurement.shape != (a.shape[0],) or not np.isfinite(measurement).all():
        raise ValueError("Use one finite measurement vector with the correct width")
    if (
        isinstance(max_atoms, bool)
        or not isinstance(max_atoms, int)
        or not 1 <= max_atoms <= min(a.shape)
        or not np.isfinite(tolerance)
        or tolerance <= 0
    ):
        raise ValueError("Use a supported atom count and positive residual tolerance")
    active = []
    coefficients = np.zeros(a.shape[1])
    residual = measurement.copy()
    trace = []
    status = "atom-cap"
    for step in range(max_atoms):
        norm = float(np.linalg.norm(residual))
        if not np.isfinite(norm):
            raise ValueError("Residual norm exceeds finite arithmetic")
        if norm <= tolerance:
            status = "residual-tolerance"
            break
        correlations = a.T @ residual
        if not np.isfinite(correlations).all():
            raise ValueError("Atom correlations exceed finite arithmetic")
        eligible = [j for j in range(a.shape[1]) if j not in active]
        chosen = min(eligible, key=lambda j: (-abs(correlations[j]), j))
        if abs(correlations[chosen]) <= tolerance:
            status = "no-correlated-atom"
            break
        next_active = active + [chosen]
        design = a[:, next_active]
        if np.linalg.matrix_rank(design) < len(next_active):
            raise ValueError("Chosen active atoms are numerically dependent")
        local = np.linalg.lstsq(design, measurement, rcond=None)[0]
        coefficients = np.zeros(a.shape[1])
        coefficients[next_active] = local
        successor = measurement - a @ coefficients
        if not np.isfinite(successor).all() or not np.isfinite(local).all():
            raise ValueError("Recovery exceeds finite arithmetic")
        trace.append(
            dict(
                step=step,
                correlations=correlations.tolist(),
                chosen=chosen,
                active=next_active.copy(),
                active_coefficients=local.tolist(),
                residual_before=residual.tolist(),
                residual_after=successor.tolist(),
            )
        )
        active, residual = next_active, successor
    if np.linalg.norm(residual) <= tolerance:
        status = "residual-tolerance"
    return dict(
        coefficients=coefficients,
        active=active,
        residual=residual,
        residual_norm=float(np.linalg.norm(residual)),
        trace=trace,
        status=status,
    )


def ordinary_omp(a, measurement, max_atoms=2):
    a = dictionary(a)
    measurement = np.asarray(measurement, dtype=float)
    if measurement.shape != (a.shape[0],) or not np.isfinite(measurement).all():
        raise ValueError("Match finite ordinary OMP measurement dimensions")
    if (
        isinstance(max_atoms, bool)
        or not isinstance(max_atoms, int)
        or not 1 <= max_atoms <= min(a.shape)
    ):
        raise ValueError("Use a supported ordinary atom budget")
    # A has m observations (measurements) and L candidate features (labels).
    with warnings.catch_warnings(record=True) as recorded:
        warnings.simplefilter("always")
        estimator = OrthogonalMatchingPursuit(
            fit_intercept=False, n_nonzero_coefs=max_atoms
        )
        estimator.fit(a, measurement)
    return dict(
        coefficients=estimator.coef_,
        warnings=[str(w.message) for w in recorded],
        residual=measurement - a @ estimator.coef_,
    )


def fit_compressed_regressor(x, y, a, alpha=0.01):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    a = dictionary(a)
    if (
        x.ndim != 2
        or not x.size
        or y.shape != (len(x), a.shape[1])
        or not np.isfinite(x).all()
        or not np.isin(y, (0, 1)).all()
        or not np.isfinite(alpha)
        or alpha < 0
    ):
        raise ValueError(
            "Align finite inputs, known binary labels and the declared dictionary"
        )
    compressed = y @ a.T
    scaler = StandardScaler().fit(x)
    estimator = Ridge(alpha=alpha, fit_intercept=True, solver="svd").fit(
        scaler.transform(x), compressed
    )
    return dict(
        dictionary=a,
        scaler=scaler,
        regressor=estimator,
        training_measurements=compressed,
        feature_width=x.shape[1],
        alpha=alpha,
    )


def predict_compressed(model, x, max_atoms=2, threshold=0.5):
    x = np.asarray(x, dtype=float)
    if (
        x.ndim != 2
        or x.shape[1] != model["feature_width"]
        or not np.isfinite(x).all()
        or not np.isfinite(threshold)
    ):
        raise ValueError(
            "Match finite query features and declare a finite decision threshold"
        )
    measurements = model["regressor"].predict(model["scaler"].transform(x))
    recoveries = [
        omp(model["dictionary"], measurement, max_atoms) for measurement in measurements
    ]
    restored = np.array([result["coefficients"] for result in recoveries])
    return dict(
        measurements=measurements,
        recoveries=recoveries,
        restored_scores=restored,
        prediction=(restored >= threshold).astype(int),
        threshold=threshold,
    )


def main():
    np.set_printoptions(precision=6, suppress=True)
    a = np.array([[1, 0, 1 / np.sqrt(2)], [0, 1, 1 / np.sqrt(2)]])
    reference = omp(a, [1.0, 0.0], max_atoms=1)
    ordinary = ordinary_omp(a, [1.0, 0.0], max_atoms=1)
    np.testing.assert_allclose(reference["coefficients"], [1, 0, 0])
    np.testing.assert_allclose(reference["coefficients"], ordinary["coefficients"])
    print("Unit-atom dictionary / reference measurement:", a.tolist(), [1, 0])
    print(
        "Every reference correlation/selection/active solve/residual:",
        reference["trace"],
    )
    print(
        "Ordinary OMP coefficients / actual warning messages:",
        ordinary["coefficients"].tolist(),
        ordinary["warnings"],
    )
    for z, atoms in [([0.6, 0.8], 1), ([0.6, 0.8], 2), ([-1.0, 0.2], 2)]:
        result = omp(a, z, atoms)
        other = ordinary_omp(a, z, atoms)
        print(
            "Changed measurement / atom budget / actual recovery/support/residual/status:",
            z,
            atoms,
            result["coefficients"].tolist(),
            result["active"],
            result["residual_norm"],
            result["status"],
        )
        print(
            "Changed ordinary coefficients/residual/warnings:",
            other["coefficients"].tolist(),
            other["residual"].tolist(),
            other["warnings"],
        )

    random_a = random_dictionary(3, 4, 71)
    print(
        "Declared Gaussian dictionary seed 71 / actual normalized atoms / coherence:",
        random_a.tolist(),
        coherence(random_a),
    )
    means = {
        "sparse mean": np.array([0.325, 0.2, 0, 0]),
        "uniform one-hot conditional mean": np.full(4, 0.25),
    }
    structured = np.column_stack((np.eye(3), np.ones(3) / np.sqrt(3)))
    for title, value in means.items():
        for name, matrix in [
            ("declared Gaussian draw", random_a),
            ("explicit four-atom contrast", structured),
        ]:
            z = matrix @ value
            result = omp(matrix, z, max_atoms=2)
            print(
                "Conditional-mean arithmetic:",
                title,
                name,
                "mean:",
                value.tolist(),
                "measurement:",
                z.tolist(),
                "estimate:",
                result["coefficients"].tolist(),
                "measurement residual:",
                result["residual_norm"],
                "original-mean squared error:",
                float(np.sum((result["coefficients"] - value) ** 2)),
            )
    dense = np.full(4, 0.25)
    dense_measurement = structured @ dense
    sparse_ambiguous = np.array([0.0, 0.0, 0.0, np.sqrt(3) * (1 + 1 / np.sqrt(3)) / 4])
    np.testing.assert_allclose(structured @ sparse_ambiguous, dense_measurement)
    print(
        "Dense mean and a sparse vector have identical measurements:",
        dense.tolist(),
        sparse_ambiguous.tolist(),
    )

    # Sixty known rows: twenty equally weighted outcomes at each x. The
    # conditional mean is (.1,.2,0,0), (.25,.2,0,0), (.4,.2,0,0).
    # The constructed conditional law is explicit, separate from real data.
    x = np.repeat([-1.0, 0.0, 1.0], 20)[:, None]
    y = np.zeros((60, 4), dtype=int)
    for group, count in enumerate((2, 5, 8)):
        y[group * 20 : group * 20 + count, 0] = 1
        y[group * 20 + 5 : group * 20 + 9, 1] = 1
    query = np.array([[0.5]])
    direct_mean = np.array([0.325, 0.2, 0, 0])
    print("Complete constructed X / known binary Y:", x.ravel().tolist(), y.tolist())
    for title, matrix in [
        ("explicit atom contrast", structured),
        ("declared Gaussian seed 71", random_a),
    ]:
        fitted = fit_compressed_regressor(x, y, matrix)
        result = predict_compressed(fitted, query, max_atoms=2, threshold=0.5)
        expected_measurement = matrix @ direct_mean
        print(
            "Fitted compression route / actual compressed training targets:",
            title,
            fitted["training_measurements"].tolist(),
        )
        print(
            "Actual train-only scaler / regression coefficients/intercepts:",
            fitted["scaler"].mean_.tolist(),
            fitted["scaler"].scale_.tolist(),
            fitted["regressor"].coef_.tolist(),
            fitted["regressor"].intercept_.tolist(),
        )
        print(
            "Query .5 expected conditional measurements / learned measurements / sparse mean estimate / .5 decisions:",
            expected_measurement.tolist(),
            result["measurements"].tolist(),
            result["restored_scores"].tolist(),
            result["prediction"].tolist(),
        )
        print("Query complete actual OMP trace:", result["recoveries"][0]["trace"])
        np.testing.assert_allclose(
            result["measurements"][0], expected_measurement, atol=2e-5
        )
        if title == "explicit atom contrast":
            np.testing.assert_allclose(
                result["restored_scores"][0], direct_mean, atol=2e-5
            )


if __name__ == "__main__":
    main()
