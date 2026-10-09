"""Separate regression columns, genuinely shared partitions/support/covariance.

NumPy solve/lstsq own linear algebra. sklearn supplies ordinary OLS, Ridge,
RegressorChain and MultiTaskLasso routes. All fits use new constructed rows.
The four-row split and proximal examples are arithmetic, not held-out claims.
"""

import numpy as np
from sklearn.linear_model import LinearRegression, MultiTaskLasso, Ridge
from sklearn.multioutput import MultiOutputRegressor, RegressorChain
from sklearn.metrics import mean_squared_error, root_mean_squared_error
from sklearn.tree import DecisionTreeRegressor


def numeric_rows(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    if (
        x.ndim != 2
        or not x.size
        or y.ndim != 2
        or y.shape[0] != len(x)
        or not y.shape[1]
        or not np.isfinite(x).all()
        or not np.isfinite(y).all()
    ):
        raise ValueError("Use aligned finite input and numerical output matrices")
    return x, y


def centered_rows(x, y):
    x, y = numeric_rows(x, y)
    mean_x, mean_y = x.mean(axis=0), y.mean(axis=0)
    if not np.isfinite(mean_x).all() or not np.isfinite(mean_y).all():
        raise ValueError("Centering exceeds finite arithmetic")
    return x - mean_x, y - mean_y, mean_x, mean_y


def fit_ridge_matrix(x, y, strength=0.0):
    xc, yc, mx, my = centered_rows(x, y)
    if not np.isfinite(strength) or strength < 0:
        raise ValueError("Use a finite nonnegative Ridge sum-loss penalty")
    rank = int(np.linalg.matrix_rank(xc))
    if strength == 0:
        weights = np.linalg.lstsq(xc, yc, rcond=None)[0]
        unique = rank == xc.shape[1]
    else:
        weights = np.linalg.solve(xc.T @ xc + strength * np.eye(xc.shape[1]), xc.T @ yc)
        unique = True
    intercept = my - mx @ weights
    if not np.isfinite(weights).all() or not np.isfinite(intercept).all():
        raise ValueError("Regression solve exceeds finite arithmetic")
    return dict(
        weights=weights,
        intercept=intercept,
        feature_width=xc.shape[1],
        centered_rank=rank,
        unique_feature_solution=unique,
        strength=strength,
    )


def predict_linear(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Use finite queries with the fitted feature width")
    return x @ model["weights"] + model["intercept"]


def fit_true_label_linear_chain(x, y, order, strengths):
    x, y = numeric_rows(x, y)
    order = tuple(order)
    strengths = np.asarray(strengths, dtype=float)
    if (
        len(order) != y.shape[1]
        or any(
            isinstance(j, bool) or not isinstance(j, (int, np.integer)) for j in order
        )
        or sorted(order) != list(range(y.shape[1]))
        or strengths.shape != (len(order),)
        or not np.isfinite(strengths).all()
        or np.any(strengths < 0)
    ):
        raise ValueError(
            "Use a full output permutation and one declared penalty per stage"
        )
    models = []
    for position, column in enumerate(order):
        features = np.column_stack((x, y[:, order[:position]]))
        fitted = fit_ridge_matrix(features, y[:, [column]], strengths[position])
        models.append(fitted)
    return dict(
        stages=models, order=order, feature_width=x.shape[1], strengths=strengths
    )


def serve_linear_chain(model, x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or x.shape[1] != model["feature_width"] or not np.isfinite(x).all():
        raise ValueError("Match finite chain input dimensions")
    ordered = np.zeros((len(x), len(model["stages"])))
    for position, stage in enumerate(model["stages"]):
        features = np.column_stack((x, ordered[:, :position]))
        ordered[:, position] = predict_linear(stage, features).ravel()
    restored = np.empty_like(ordered)
    restored[:, model["order"]] = ordered
    return restored


def effective_chain_coefficients(model):
    """Substitute served predecessors, including the unpenalized intercept."""
    d = model["feature_width"]
    q = len(model["stages"])
    effective = np.zeros((d, q))
    intercept = np.zeros(q)
    for position, stage in enumerate(model["stages"]):
        raw = stage["weights"][:, 0]
        effective[:, position] = raw[:d] + effective[:, :position] @ raw[d:]
        intercept[position] = stage["intercept"][0] + intercept[:position] @ raw[d:]
    restored = np.empty_like(effective)
    restored[:, model["order"]] = effective
    restored_intercept = np.empty_like(intercept)
    restored_intercept[list(model["order"])] = intercept
    return restored, restored_intercept


def stump_candidates(x, y):
    """Every midpoint cut, vector mean leaves and per-output training SSE."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    if (
        x.ndim != 1
        or y.ndim != 2
        or len(x) != len(y)
        or not len(x)
        or not np.isfinite(x).all()
        or not np.isfinite(y).all()
    ):
        raise ValueError("Use finite scalar coordinates and vector targets")
    values = np.unique(x)
    if len(values) < 2:
        raise ValueError("A split needs at least two distinct coordinates")
    candidates = []
    for lower, upper in zip(values[:-1], values[1:]):
        threshold = lower + (upper - lower) / 2
        left = x <= threshold
        mean_left = y[left].mean(axis=0)
        mean_right = y[~left].mean(axis=0)
        prediction = np.where(left[:, None], mean_left, mean_right)
        sse = ((y - prediction) ** 2).sum(axis=0)
        if not all(np.isfinite(value).all() for value in (mean_left, mean_right, sse)):
            raise ValueError("Leaf mean or squared error exceeds finite arithmetic")
        candidates.append(
            dict(
                threshold=float(threshold),
                left_rows=np.flatnonzero(left).tolist(),
                left_mean=mean_left,
                right_mean=mean_right,
                sse=sse,
                total_sse=float(sse.sum()),
                prediction=prediction,
            )
        )
    return candidates


def row_prox(z, threshold):
    z = np.asarray(z, dtype=float)
    if (
        z.ndim != 2
        or not np.isfinite(z).all()
        or not np.isfinite(threshold)
        or threshold < 0
    ):
        raise ValueError("Use finite feature rows and nonnegative proximal threshold")
    norms = np.linalg.norm(z, axis=1)
    if not np.isfinite(norms).all():
        raise ValueError("Row norm exceeds finite arithmetic")
    factors = np.zeros(len(z))
    positive = norms > 0
    factors[positive] = np.maximum(0, 1 - threshold / norms[positive])
    return z * factors[:, None]


def group_objective(x, y, weights, alpha):
    residual = x @ weights - y
    loss = float(
        np.sum(residual**2) / (2 * len(x))
        + alpha * np.linalg.norm(weights, axis=1).sum()
    )
    gradient = x.T @ residual / len(x)
    if not np.isfinite(loss) or not np.isfinite(gradient).all():
        raise ValueError("Group objective or gradient exceeds finite arithmetic")
    return loss, gradient


def group_prox_step(x, y, weights, alpha, step):
    x, y = numeric_rows(x, y)
    weights = np.asarray(weights, dtype=float)
    if (
        weights.shape != (x.shape[1], y.shape[1])
        or not np.isfinite(weights).all()
        or not np.isfinite(alpha)
        or alpha < 0
        or not np.isfinite(step)
        or step <= 0
    ):
        raise ValueError(
            "Align finite weights, nonnegative group penalty and positive step"
        )
    loss, gradient = group_objective(x, y, weights, alpha)
    z = weights - step * gradient
    successor = row_prox(z, step * alpha)
    return dict(
        loss=loss,
        gradient=gradient,
        z=z,
        weights=successor,
        stationarity=float(np.max(abs(successor - weights)) / step),
    )


def fit_group_regression(x, y, alpha=0.08, tolerance=1e-8, max_steps=30000):
    xc, yc, mx, my = centered_rows(x, y)
    if (
        not np.isfinite(alpha)
        or alpha < 0
        or not np.isfinite(tolerance)
        or tolerance <= 0
        or isinstance(max_steps, bool)
        or not isinstance(max_steps, int)
        or max_steps < 1
    ):
        raise ValueError("Use supported penalty, tolerance and iteration budget")
    lipschitz = float(np.linalg.norm(xc, 2) ** 2 / len(xc))
    step = 1 / lipschitz if lipschitz > 0 else 1.0
    weights = np.zeros((xc.shape[1], yc.shape[1]))
    trace = []
    converged = False
    for iteration in range(max_steps + 1):
        update = group_prox_step(xc, yc, weights, alpha, step)
        trace.append(
            dict(
                iteration=iteration,
                loss=update["loss"],
                stationarity=update["stationarity"],
            )
        )
        if update["stationarity"] <= tolerance:
            converged = True
            break
        if iteration == max_steps:
            break
        weights = update["weights"]
    return dict(
        weights=weights,
        intercept=my - mx @ weights,
        feature_width=xc.shape[1],
        alpha=alpha,
        step=step,
        trace=trace,
        converged=converged,
        status="stationary" if converged else "iteration-cap",
    )


def covariance_matrix(value, name):
    value = np.asarray(value, dtype=float)
    if (
        value.ndim != 2
        or not value.size
        or value.shape[0] != value.shape[1]
        or not np.isfinite(value).all()
        or not np.allclose(value, value.T, rtol=0, atol=1e-12)
        or np.linalg.eigvalsh(value).min() < -1e-12
    ):
        raise ValueError(
            f"{name} must be symmetric positive semidefinite within arithmetic tolerance"
        )
    return value


def output_kernel(input_covariance, output_covariance):
    k = covariance_matrix(input_covariance, "Input K")
    b = covariance_matrix(output_covariance, "Output B")
    result = np.kron(k, b)  # point-major: x0/A, x0/B, x1/A, x1/B
    if not np.isfinite(result).all():
        raise ValueError("Joint covariance exceeds finite arithmetic")
    return result


def condition_one(covariance, index, value):
    covariance = covariance_matrix(covariance, "Joint covariance")
    if (
        isinstance(index, bool)
        or not isinstance(index, int)
        or not 0 <= index < len(covariance)
        or not np.isfinite(value)
        or covariance[index, index] <= 0
    ):
        raise ValueError(
            "A noiseless observation needs a positive finite marginal variance"
        )
    column = covariance[:, index]
    variance = covariance[index, index]
    mean = column * value / variance
    conditional = covariance - np.outer(column, column) / variance
    if not np.isfinite(mean).all() or not np.isfinite(conditional).all():
        raise ValueError("Conditional moments exceed finite arithmetic")
    return dict(mean=mean, covariance=conditional, variance=np.diag(conditional))


def main():
    np.set_printoptions(precision=6, suppress=True)
    rng = np.random.default_rng(53)
    base = rng.normal(size=(24, 3))
    x = np.column_stack((base[:, 0], 0.8 * base[:, 0] + 0.2 * base[:, 1], base[:, 2]))
    y = (
        x @ np.array([[1, -2], [0.5, 0.3], [-0.4, 1.0]])
        + np.array([2.0, -1.0])
        + rng.normal(scale=0.1, size=(24, 2))
    )
    query = np.array([[0.3, 0.4, -0.2], [-0.5, -0.3, 0.7]])
    print("Constructed correlated X / original-unit Y:", x.tolist(), y.tolist())
    ols = fit_ridge_matrix(x, y)
    ordinary_ols = LinearRegression().fit(x, y)
    np.testing.assert_allclose(ols["weights"], ordinary_ols.coef_.T, atol=1e-10)
    print(
        "OLS feature-by-output weights / intercept / centered rank:",
        ols["weights"].tolist(),
        ols["intercept"].tolist(),
        ols["centered_rank"],
    )
    strength = 0.7
    ridge = fit_ridge_matrix(x, y, strength)
    ordinary = Ridge(alpha=strength, solver="svd").fit(x, y)
    separate = MultiOutputRegressor(Ridge(alpha=strength, solver="svd")).fit(x, y)
    np.testing.assert_allclose(
        predict_linear(ridge, query), ordinary.predict(query), atol=1e-10
    )
    np.testing.assert_allclose(
        predict_linear(ridge, query), separate.predict(query), atol=1e-10
    )
    chain = fit_true_label_linear_chain(x, y, (1, 0), [strength, strength])
    effective, intercept = effective_chain_coefficients(chain)
    np.testing.assert_allclose(effective, ridge["weights"], atol=1e-10)
    np.testing.assert_allclose(intercept, ridge["intercept"], atol=1e-10)
    library_chain = RegressorChain(
        estimator=Ridge(alpha=strength, solver="svd"), order=[1, 0]
    ).fit(x, y)
    np.testing.assert_allclose(
        serve_linear_chain(chain, query), library_chain.predict(query), atol=1e-10
    )
    print(
        "Matching-penalty chain effective W / independent W / query predictions:",
        effective.tolist(),
        ridge["weights"].tolist(),
        serve_linear_chain(chain, query).tolist(),
    )
    mismatched = fit_true_label_linear_chain(x, y, (1, 0), [0.7, 4.0])
    changed_effective, _ = effective_chain_coefficients(mismatched)
    same_target_penalty = fit_ridge_matrix(x, y[:, [0]], 4.0)
    difference = float(
        np.max(abs(changed_effective[:, 0] - same_target_penalty["weights"][:, 0]))
    )
    assert difference > 1e-5
    print(
        "Different predecessor penalty breaks target-matched cancellation; maximum coefficient difference:",
        difference,
    )
    deficient = fit_ridge_matrix(np.column_stack((x[:, 0], x[:, 0])), y)
    assert not deficient["unique_feature_solution"]
    print(
        "Rank-deficient OLS status / rank:",
        deficient["unique_feature_solution"],
        deficient["centered_rank"],
    )
    target_scale = y.std(axis=0)
    normalized = (y - y.mean(axis=0)) / target_scale
    normalized_model = fit_ridge_matrix(x, normalized, strength)
    restored = predict_linear(normalized_model, query) * target_scale + y.mean(axis=0)
    np.testing.assert_allclose(restored, predict_linear(ridge, query), atol=1e-10)
    print(
        "Separable positive target scaling restored to original units:",
        restored.tolist(),
    )
    error = np.array([[1.0, 3.0], [-1.0, -3.0]])
    roots_then_mean = root_mean_squared_error(np.zeros_like(error), error)
    mean_then_root = np.sqrt(mean_squared_error(np.zeros_like(error), error))
    np.testing.assert_allclose([roots_then_mean, mean_then_root], [2, np.sqrt(5)])
    print(
        "Per-output MSE / roots then mean / mean then root:",
        [1, 9],
        roots_then_mean,
        mean_then_root,
    )

    sx = np.arange(4, dtype=float)
    sy = np.column_stack(([0, 0, 2, 2], [0, 100, 100, 100]))
    for divisor in (1.0, 10.0, 100.0):
        scaled_y = sy / np.array([1.0, divisor])
        candidates = stump_candidates(sx, scaled_y)
        best = min(candidates, key=lambda row: row["total_sse"])
        tree = DecisionTreeRegressor(max_depth=1, random_state=17).fit(
            sx[:, None], scaled_y
        )
        np.testing.assert_allclose(tree.tree_.threshold[0], best["threshold"])
        np.testing.assert_allclose(tree.predict(sx[:, None]), best["prediction"])
        print(
            "Energy divisor / every actual cut, vector means and output SSE:",
            divisor,
            [
                dict(
                    threshold=row["threshold"],
                    left_mean=row["left_mean"].tolist(),
                    right_mean=row["right_mean"].tolist(),
                    sse=row["sse"].tolist(),
                )
                for row in candidates
            ],
        )
        print("Shared selected threshold:", best["threshold"])
    individual_trees = MultiOutputRegressor(
        DecisionTreeRegressor(max_depth=1, random_state=17)
    ).fit(sx[:, None], sy)
    np.testing.assert_allclose(individual_trees.predict(sx[:, None]), sy)
    print(
        "Separate temperature/energy thresholds and zero training residual:",
        [float(tree.tree_.threshold[0]) for tree in individual_trees.estimators_],
    )
    print("Whole-row shrink z 3/4, threshold2:", row_prox([[3, 4]], 2).tolist())
    np.testing.assert_allclose(row_prox([[3, 4]], 2), [[1.8, 2.4]])
    hand = np.array([[1, 0], [1, 1], [0, 1]], dtype=float)
    step = group_prox_step(hand, hand, np.zeros((2, 2)), 0.2, 0.5)
    np.testing.assert_allclose(
        step["gradient"], -np.array([[2 / 3, 1 / 3], [1 / 3, 2 / 3]])
    )
    print(
        "General-design first gradient / Z / shrunk W:",
        step["gradient"].tolist(),
        step["z"].tolist(),
        step["weights"].tolist(),
    )
    group = fit_group_regression(x, y)
    if not group["converged"]:
        raise RuntimeError("Declared group fixture did not converge")
    ordinary_group = MultiTaskLasso(
        alpha=0.08, fit_intercept=True, selection="cyclic", tol=1e-11, max_iter=20000
    ).fit(x, y)
    np.testing.assert_allclose(
        group["weights"], ordinary_group.coef_.T, rtol=0, atol=3e-6
    )
    np.testing.assert_allclose(
        group["intercept"], ordinary_group.intercept_, rtol=0, atol=3e-6
    )
    print(
        "Full converged group weights/intercept/iterations/final objective/residual:",
        group["weights"].tolist(),
        group["intercept"].tolist(),
        len(group["trace"]) - 1,
        group["trace"][-1],
    )
    print(
        "Ordinary group coefficient max difference / dual gap:",
        float(np.max(abs(group["weights"] - ordinary_group.coef_.T))),
        float(ordinary_group.dual_gap_),
    )
    assert all(
        b["loss"] <= a["loss"] + 1e-12
        for a, b in zip(group["trace"], group["trace"][1:])
    )
    print(
        "Proximal trace beginning/end, complete trace returned by fit:",
        group["trace"][:3] + group["trace"][-3:],
    )

    k = np.array([[1, 0.8], [0.8, 1]])
    for rho in (0.5, -0.5):
        b = np.array([[1, rho], [rho, 1.0]])
        joint = output_kernel(k, b)
        conditional = condition_one(joint, 0, 1.0)
        np.testing.assert_allclose(
            [conditional["mean"][3], conditional["variance"][3]],
            [0.8 * rho, 1 - (0.8 * rho) ** 2],
        )
        print("Point-major K / B / K tensor B:", k.tolist(), b.tolist(), joint.tolist())
        print(
            "Observe x0,A=1; x1,B conditional mean/variance:",
            conditional["mean"][3],
            conditional["variance"][3],
        )


if __name__ == "__main__":
    main()
