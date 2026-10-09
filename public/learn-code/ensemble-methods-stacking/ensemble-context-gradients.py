"""A context changes a member's coefficient through explicit product features.

Run: python ensemble-context-gradients.py
Dependencies: NumPy, SciPy, scikit-learn. This is a new constructed example.
The historical eight-row example is preserved separately, without replay.
"""
import numpy as np
from scipy.optimize import approx_fprime
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures


def product_design(inputs):
    x = np.asarray(inputs, dtype=float)
    if x.ndim != 2 or x.shape[1] != 3 or not len(x) or not np.isfinite(x).all():
        raise ValueError("inputs must be finite rows of [prediction A, prediction B, context z]")
    a, b, z = x.T
    return np.column_stack((np.ones(len(x)), (1 - z) * a, z * b))


def objective(theta, design, targets, strength):
    residual = design @ theta - targets
    return float(residual @ residual / (2 * len(targets)) + strength * (theta[1:] @ theta[1:]) / 2)


def gradient(theta, design, targets, strength):
    return design.T @ (design @ theta - targets) / len(targets) + np.r_[0., strength * theta[1:]]


def fit_context(inputs, targets, strength=.1):
    design = product_design(inputs)
    y = np.asarray(targets, dtype=float)
    if y.shape != (len(design),) or not np.isfinite(y).all() or not np.isfinite(strength) or strength < 0:
        raise ValueError("targets must match rows; strength must be finite and nonnegative")
    penalty = np.diag([0., strength, strength])
    hessian = design.T @ design / len(y) + penalty
    # lstsq retains a minimum-norm solution when the unregularized system is singular.
    theta = np.linalg.lstsq(hessian, design.T @ y / len(y), rcond=None)[0]
    return {"theta": theta, "feature_order": ["intercept", "(1-z)*prediction A", "z*prediction B"],
            "rank": int(np.linalg.matrix_rank(design)), "hessian_rank": int(np.linalg.matrix_rank(hessian)),
            "objective": objective(theta, design, y, strength), "gradient": gradient(theta, design, y, strength),
            "strength": float(strength)}


def predict_context(state, inputs):
    if state["feature_order"] != ["intercept", "(1-z)*prediction A", "z*prediction B"]:
        raise ValueError("stale context feature order")
    return product_design(inputs) @ state["theta"]


def ordinary_product_columns(inputs):
    polynomial = PolynomialFeatures(degree=2, include_bias=False)
    expanded = polynomial.fit_transform(inputs)
    names = list(polynomial.get_feature_names_out(["a", "b", "z"]))
    # Select exactly a-a*z and b*z: the other quadratic columns are not fitted.
    return np.column_stack((expanded[:, names.index("a")] - expanded[:, names.index("a z")], expanded[:, names.index("b z")]))


def main():
    np.set_printoptions(precision=9, suppress=True)
    i = np.arange(12)
    a, b, z = (i % 4) / 3, ((2 * i + 1) % 5) / 4, (i // 4) / 2
    inputs = np.column_stack((a, b, z))
    y = .1 + .7 * (1 - z) * a + 1.3 * z * b
    fit_ids = np.array([0, 1, 2, 4, 5, 6, 8, 9, 10])
    held_ids = np.array([3, 7, 11])
    state = fit_context(inputs[fit_ids], y[fit_ids])
    design = product_design(inputs[fit_ids])
    ordinary = Ridge(alpha=len(fit_ids) * .1, fit_intercept=True, solver="svd").fit(ordinary_product_columns(inputs[fit_ids]), y[fit_ids])
    numerical = approx_fprime(state["theta"], lambda theta: objective(theta, design, y[fit_ids], .1), 1e-6)
    print("fit IDs", fit_ids, "held IDs", held_ids)
    print("features", state["feature_order"])
    print("design", design.tolist())
    print("rank/Hessian rank", state["rank"], state["hessian_rank"])
    print("coefficients", state["theta"], "objective", state["objective"])
    print("analytic gradient", state["gradient"], "finite-difference", numerical)
    print("ordinary coefficients", np.r_[ordinary.intercept_, ordinary.coef_])
    print("held forecasts", predict_context(state, inputs[held_ids]), "targets", y[held_ids])
    queries = np.array([[.2, .8, 0], [.2, .8, 1], [.2, .8, .25]])
    print("changed queries", queries.tolist(), "forecasts", predict_context(state, queries))
    print("ordinary forecast max difference", np.max(np.abs(ordinary.predict(ordinary_product_columns(queries)) - predict_context(state, queries))))


if __name__ == "__main__":
    main()
