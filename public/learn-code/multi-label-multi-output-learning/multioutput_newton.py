"""Damped Newton fitting of mean binary log loss plus L2 on slopes.

NumPy owns array operations and the linear solve; the objective, derivatives,
line search, stopping rule and prediction calculation are written here.
"""
import numpy as np
from sklearn.linear_model import LogisticRegression


def sigmoid(scores):
    scores = np.asarray(scores, dtype=float)
    result = np.empty_like(scores)
    positive = scores >= 0
    result[positive] = 1 / (1 + np.exp(-scores[positive]))
    exponential = np.exp(scores[~positive])
    result[~positive] = exponential / (1 + exponential)
    return result


def objective(design, labels, weights, strength):
    scores = design @ weights
    probabilities = sigmoid(scores)
    penalty_diagonal = np.r_[0., np.full(design.shape[1] - 1, strength)]
    loss = np.mean(np.logaddexp(0, (1 - 2 * labels) * scores))
    loss += .5 * np.dot(penalty_diagonal * weights, weights)
    gradient = design.T @ (probabilities - labels) / len(labels)
    gradient += penalty_diagonal * weights
    row_curvature = probabilities * (1 - probabilities)
    hessian = design.T @ (row_curvature[:, None] * design) / len(labels)
    hessian += np.diag(penalty_diagonal)
    return loss, gradient, hessian


def fit_newton(design, labels, strength=.1, tolerance=1e-10, max_steps=50):
    """Require finite dense inputs, both labels and positive slope penalty.

    Returns only after the infinity norm of the gradient meets tolerance.
    Dense Hessian construction costs O(n*d²), solve O(d³), storage O(d²).
    This small dense reference does not handle huge sparse feature spaces.
    """
    design = np.asarray(design, dtype=float)
    labels = np.asarray(labels, dtype=float)
    if design.ndim != 2 or design.shape[0] == 0 or design.shape[1] < 1:
        raise ValueError("Expected a nonempty design matrix.")
    if labels.shape != (len(design),) or not np.isfinite(design).all():
        raise ValueError("Expected finite rows and one binary label per row.")
    if not np.array_equal(np.unique(labels), [0., 1.]):
        raise ValueError("This reference requires both binary labels.")
    if not np.all(design[:, 0] == 1) or not np.isfinite(strength) or strength <= 0:
        raise ValueError("Use a leading intercept column and positive strength.")
    if not np.isfinite(tolerance) or tolerance <= 0 or max_steps < 1:
        raise ValueError("Use positive tolerance and iteration limit.")
    weights = np.zeros(design.shape[1])
    for step in range(max_steps + 1):
        loss, gradient, hessian = objective(design, labels, weights, strength)
        if np.linalg.norm(gradient, np.inf) <= tolerance:
            return weights, step
        if step == max_steps:
            break
        direction = np.linalg.solve(hessian, gradient)
        rate = 1.
        for _ in range(30):
            candidate = weights - rate * direction
            candidate_loss = objective(design, labels, candidate, strength)[0]
            if candidate_loss <= loss - 1e-4 * rate * np.dot(gradient, direction):
                weights = candidate
                break
            rate *= .5
        else:
            raise RuntimeError("Line search did not find a decreasing step.")
    raise RuntimeError("Gradient tolerance not reached within the iteration limit.")


if __name__ == "__main__":
    x = np.array([-2., -1., -1., 0., 0., 1., 1., 2.])
    y = np.array([0., 0., 1., 0., 1., 0., 1., 1.])
    design = np.column_stack([np.ones(len(x)), x])
    weights, steps = fit_newton(design, y)
    reference = LogisticRegression(C=1/(len(y)*.1), l1_ratio=0,
                                   solver="lbfgs", max_iter=2000, tol=1e-12)
    reference.fit(x[:, None], y)
    library_weights = np.r_[reference.intercept_, reference.coef_[0]]
    np.testing.assert_allclose(weights, library_weights, atol=2e-7)
    print("Newton coefficients:", np.round(weights, 6).tolist())
    print("Newton steps:", steps)
    print(f"penalized objective={objective(design,y,weights,.1)[0]:.6f}")
    print(f"maximum library coefficient difference={np.max(np.abs(weights-library_weights)):.3e}")
