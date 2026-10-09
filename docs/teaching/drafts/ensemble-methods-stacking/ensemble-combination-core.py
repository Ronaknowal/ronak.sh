"""Named-class combination and a fitted square-loss combiner.

Run: python ensemble-combination-core.py
Dependencies: NumPy, SciPy. Importing this file performs no fit.
The optimizer is an array implementation; SLSQP/nnls are separate references.
"""
import numpy as np
from scipy.optimize import minimize, nnls


def finite_array(value, name, ndim):
    array = np.asarray(value, dtype=float)
    if array.ndim != ndim or not array.size or not np.isfinite(array).all():
        raise ValueError(f"{name} must be a nonempty finite {ndim}-D array")
    return array


def normalized_weights(weights):
    weights = finite_array(weights, "weights", 1)
    if np.any(weights < 0) or not np.any(weights > 0):
        raise ValueError("weights must be nonnegative with positive total")
    # Scaling first preserves an all-tiny positive input and avoids a large sum.
    scaled = weights / weights.max()
    return scaled / scaled.sum()


def align_probabilities(probabilities, fitted_classes, output_classes):
    p = finite_array(probabilities, "probabilities", 2)
    fitted_classes, output_classes = list(fitted_classes), list(output_classes)
    if len(set(fitted_classes)) != len(fitted_classes) or len(set(output_classes)) != len(output_classes):
        raise ValueError("class names must be unique")
    if p.shape[1] != len(fitted_classes) or not set(fitted_classes) <= set(output_classes):
        raise ValueError("probability columns must have an explicit supported class schema")
    if np.any(p < 0) or np.any(p > 1) or not np.allclose(p.sum(axis=1), 1, atol=1e-12, rtol=0):
        raise ValueError("each probability row must be nonnegative and sum to one")
    aligned = np.zeros((len(p), len(output_classes)))
    for column, identity in enumerate(fitted_classes):
        aligned[:, output_classes.index(identity)] = p[:, column]
    return aligned


def convex_mean(predictions, weights):
    p = finite_array(predictions, "prediction matrix", 2)
    w = normalized_weights(weights)
    if p.shape[1] != len(w):
        raise ValueError("one weight is required per member column")
    return p @ w


def weighted_ballot(member_probabilities, weights):
    """Shape (rows, members, classes); first named class wins a tie."""
    p = finite_array(member_probabilities, "member probabilities", 3)
    w = normalized_weights(weights)
    if p.shape[1] != len(w) or np.any(p < 0) or np.any(p > 1):
        raise ValueError("invalid member probabilities or weights")
    if not np.allclose(p.sum(axis=2), 1, atol=1e-12, rtol=0):
        raise ValueError("each member probability row must sum to one")
    votes = np.argmax(p, axis=2)
    mass = np.zeros((p.shape[0], p.shape[2]))
    for member, weight in enumerate(w):
        mass[np.arange(len(p)), votes[:, member]] += weight
    return np.argmax(mass, axis=1), mass


def two_member_optimum(residual_a, residual_b):
    """Minimize mean((w*a+(1-w)*b)**2), retaining the flat case."""
    a = finite_array(residual_a, "residual A", 1)
    b = finite_array(residual_b, "residual B", 1)
    if a.shape != b.shape:
        raise ValueError("residual vectors must refer to the same rows")
    scale = max(np.max(np.abs(a)), np.max(np.abs(b)))
    if scale == 0 or np.array_equal(a, b):
        return {"unconstrained": None, "convex": None, "all_weights_optimal": True}
    a, b = a / scale, b / scale
    delta = a - b
    denominator = delta @ delta
    if denominator == 0:
        raise ArithmeticError("residual differences are below numerical resolution")
    raw = float(-(b @ delta) / denominator)
    return {"unconstrained": raw, "convex": float(np.clip(raw, 0, 1)), "all_weights_optimal": False}


def simplex_projection(vector):
    """Euclidean projection onto w>=0, sum(w)=1; not clipping/normalizing."""
    v = finite_array(vector, "projection vector", 1)
    # Subtracting the maximum leaves the projection unchanged and limits sums.
    centered = v - v.max()
    ordered = np.sort(centered)[::-1]
    thresholds = (np.cumsum(ordered) - 1) / np.arange(1, len(v) + 1)
    active = np.flatnonzero(ordered > thresholds)
    tau = thresholds[active[-1]]
    return np.maximum(centered - tau, 0)


def square_problem(predictions, targets, strength):
    p = finite_array(predictions, "prediction matrix", 2)
    y = finite_array(targets, "targets", 1)
    if len(y) != len(p) or not np.isfinite(strength) or strength < 0:
        raise ValueError("targets must match rows and strength must be finite/nonnegative")
    return p, y, float(strength)


def square_objective(weights, predictions, targets, strength):
    residual = predictions @ weights - targets
    return float(residual @ residual / (2 * len(targets)) + strength * (weights @ weights) / 2)


def square_gradient(weights, predictions, targets, strength):
    return predictions.T @ (predictions @ weights - targets) / len(targets) + strength * weights


def fit_square_combiner(predictions, targets, strength=0., constraint="simplex", tolerance=1e-10, max_steps=100000):
    p, y, strength = square_problem(predictions, targets, strength)
    if constraint not in {"simplex", "nonnegative", "unrestricted"}:
        raise ValueError("constraint must be simplex, nonnegative or unrestricted")
    if tolerance <= 0 or max_steps < 1:
        raise ValueError("positive tolerance and step limit are required")
    hessian = p.T @ p / len(y) + strength * np.eye(p.shape[1])
    project = simplex_projection if constraint == "simplex" else (
        lambda v: np.maximum(v, 0)) if constraint == "nonnegative" else (lambda v: v.copy())
    weights = np.full(p.shape[1], 1 / p.shape[1]) if constraint == "simplex" else np.zeros(p.shape[1])
    lipschitz = float(np.linalg.eigvalsh(hessian)[-1])
    if not np.isfinite(lipschitz):
        raise ArithmeticError("square Hessian exceeds the numerical range")
    step = 1 / lipschitz if lipschitz > 0 else 1.
    for iteration in range(max_steps + 1):
        gradient = square_gradient(weights, p, y, strength)
        next_weights = project(weights - step * gradient)
        mapping = (weights - next_weights) / step
        mapping_norm = float(np.max(np.abs(mapping)))
        feasibility = max(0., float(-weights.min())) if constraint != "unrestricted" else 0.
        if constraint == "simplex":
            feasibility = max(feasibility, abs(float(weights.sum()) - 1))
        if mapping_norm <= tolerance and feasibility <= tolerance:
            # Null directions preserving the equality expose possible nonunique weights.
            directions = np.eye(p.shape[1]) if constraint != "simplex" else np.eye(p.shape[1])[:, :-1] - np.eye(p.shape[1])[:, [-1]]
            unique_unconstrained = strength > 0 or directions.shape[1] == 0 or np.linalg.matrix_rank(p @ directions) == directions.shape[1]
            return {"weights": weights, "predictions": p @ weights, "objective": square_objective(weights, p, y, strength),
                    "gradient": gradient, "hessian": hessian, "gradient_mapping_inf": mapping_norm,
                    "feasibility": feasibility, "steps": iteration,
                    "uniqueness": "strict on feasible affine space" if unique_unconstrained else "not guaranteed; active constraints may still identify weights"}
        weights = next_weights
    raise RuntimeError(f"projected fit did not converge in {max_steps} steps; mapping={mapping_norm:.6g}, feasibility={feasibility:.6g}")


def scipy_reference(predictions, targets, strength, constraint):
    p, y, strength = square_problem(predictions, targets, strength)
    count = p.shape[1]
    if constraint == "nonnegative":
        augmented = np.vstack((p / np.sqrt(len(y)), np.sqrt(strength) * np.eye(count)))
        right = np.r_[y / np.sqrt(len(y)), np.zeros(count)]
        weights, _ = nnls(augmented, right)
        return weights
    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1, "jac": lambda w: np.ones(count)}] if constraint == "simplex" else []
    result = minimize(square_objective, np.full(count, 1 / count), args=(p, y, strength),
                      jac=square_gradient, method="SLSQP", bounds=[(0, None)] * count if constraint == "simplex" else None,
                      constraints=constraints, options={"ftol": 1e-13, "maxiter": 10000})
    if not result.success:
        raise RuntimeError(f"ordinary reference failed: {result.message}")
    return result.x


def main():
    np.set_printoptions(precision=9, suppress=True)
    print("named alignment", align_probabilities([[.1, .6, .3]], ["silver", "amber", "blue"], ["amber", "blue", "silver"]))
    print("forecast", convex_mean([[7, 9]], [.25, .75]))
    p = np.array([[[.49, .51], [.49, .51], [.99, .01]]])
    print("hard class/mass", weighted_ballot(p, [1, 1, 1]))
    print("soft probabilities", np.einsum("rbc,b->rc", p, normalized_weights([1, 1, 1])))
    print("two-member optimum", two_member_optimum([-3, -1, 2, 2], [1, 1, -1, -3]))
    print("flat optimum", two_member_optimum([1, 2], [1, 2]))
    print("simplex projection", simplex_projection([.8, .3, -.1]))
    p, y, strength = np.array([[1, 2, 4], [3, 2, 1], [2, 5, 0]]), np.array([2, 1, 3]), .2
    for constraint in ["simplex", "nonnegative", "unrestricted"]:
        result = fit_square_combiner(p, y, strength, constraint)
        reference = scipy_reference(p, y, strength, constraint)
        print(constraint, "weights", result["weights"], "sum", result["weights"].sum())
        print("predictions", result["predictions"], "objective", result["objective"])
        print("gradient", result["gradient"], "Hessian", result["hessian"].tolist())
        print("mapping/feasibility/steps", result["gradient_mapping_inf"], result["feasibility"], result["steps"])
        print("ordinary weights", reference, "prediction max difference", np.max(np.abs(p @ reference - result["predictions"])))
        print("uniqueness", result["uniqueness"])
    duplicate = fit_square_combiner([[1, 1], [2, 2]], [1, 2])
    print("duplicate columns", duplicate["weights"], duplicate["predictions"], duplicate["uniqueness"])


if __name__ == "__main__":
    main()
