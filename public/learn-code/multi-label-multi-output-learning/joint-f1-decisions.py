"""Complete-law actions, GFM instance-F1 decisions and a small joint model.

Exact action arithmetic and fixed-feature joint Newton fitting are written
here. NumPy reductions and independent enumeration check decisions; SciPy
minimize is the ordinary optimizer. sklearn supplies F1 evaluation, not GFM.
The minimal 0/1 unary/pair basis has its own isotropic L2 prior. It is not
the original CML paper's redundant-indicator Gaussian prior; CMLF would also
modulate the pair coefficient with x, which this declared model does not.
"""

from itertools import product

import numpy as np
from scipy.optimize import minimize
from scipy.special import logsumexp
from sklearn.metrics import f1_score


def binary_vectors(labels, max_states=4096):
    if (
        isinstance(labels, bool)
        or not isinstance(labels, int)
        or labels < 1
        or isinstance(max_states, bool)
        or not isinstance(max_states, int)
        or max_states < 1
    ):
        raise ValueError("Use positive integer label count and state budget")
    if labels > max_states.bit_length() - 1:
        raise ValueError("Complete vectors exceed the declared state budget")
    return np.array(list(product((0, 1), repeat=labels)), dtype=int)


def complete_law(leaves, probabilities, max_states=4096):
    leaves = np.asarray(leaves)
    probabilities = np.asarray(probabilities, dtype=float)
    if leaves.ndim != 2 or not leaves.size or not np.isin(leaves, (0, 1)).all():
        raise ValueError("Use complete original-order binary vectors")
    expected = binary_vectors(leaves.shape[1], max_states)
    if leaves.shape != expected.shape:
        raise ValueError("Include every vector, even when its mass is zero")
    keys = leaves @ (1 << np.arange(leaves.shape[1] - 1, -1, -1))
    order = np.argsort(keys)
    if not np.array_equal(leaves[order], expected):
        raise ValueError("Vectors must be distinct and complete")
    if (
        probabilities.shape != (len(leaves),)
        or not np.isfinite(probabilities).all()
        or np.any(probabilities < 0)
        or not np.isclose(probabilities.sum(), 1.0, rtol=0, atol=1e-12)
    ):
        raise ValueError("Use nonnegative finite masses summing to one")
    return expected, probabilities[order]


def instance_f1(truth, action, empty_payoff=1):
    truth, action = np.asarray(truth), np.asarray(action)
    if (
        truth.ndim != 1
        or not len(truth)
        or action.shape != truth.shape
        or not np.isin(truth, (0, 1)).all()
        or not np.isin(action, (0, 1)).all()
        or empty_payoff not in (0, 1)
    ):
        raise ValueError("Use known aligned bit vectors and empty payoff 0 or 1")
    denominator = int(truth.sum() + action.sum())
    return 2 * int(truth @ action) / denominator if denominator else float(empty_payoff)


def all_action_risks(
    leaves,
    probabilities,
    empty_payoff=1,
    max_operations=4000000,
    tie_order="lexicographic",
):
    leaves, p = complete_law(leaves, probabilities)
    if empty_payoff not in (0, 1):
        raise ValueError("Use empty/empty F1 payoff 0 or 1")
    if tie_order not in ("lexicographic", "reverse-lexicographic"):
        raise ValueError("Choose an explicit original-schema tie order")
    if (
        isinstance(max_operations, bool)
        or not isinstance(max_operations, int)
        or max_operations < 1
        or len(leaves) ** 2 * leaves.shape[1] > max_operations
    ):
        raise ValueError("Exhaustive action oracle exceeds its operation budget")
    records = []
    for action in leaves:
        hamming = float(p @ np.mean(leaves != action, axis=1))
        subset = float(p @ np.any(leaves != action, axis=1))
        denominator = leaves.sum(axis=1) + action.sum()
        reward = np.full(len(leaves), float(empty_payoff))
        valid = denominator > 0
        reward[valid] = 2 * (leaves[valid] @ action) / denominator[valid]
        records.append(
            dict(
                action=action.tolist(),
                hamming=hamming,
                subset=subset,
                f1=float(p @ reward),
                f1_risk=float(1 - p @ reward),
            )
        )
    # Equal FLOATING computed risks use the named tie order. Arithmetic near
    # ties should be interpreted with the reported full risk table, not as
    # evidence of a meaningful decision margin.
    ordered = records if tie_order == "lexicographic" else records[::-1]
    choices = {
        name: min(ordered, key=lambda row: row[name])["action"]
        for name in ("hamming", "subset", "f1_risk")
    }
    return records, choices


def gfm(leaves, probabilities, empty_payoff=1, tie_order="lexicographic"):
    """P(Y_j=1, |Y|=s) determines the gains for every predicted size k.

    At a tied gain, prefer a later output index so the bit vector is
    lexicographically smallest. Compare all sizes, including k=0 separately.
    This is instance-F1 expected reward, not dataset-level micro-F1.
    """
    leaves, p = complete_law(leaves, probabilities)
    if empty_payoff not in (0, 1):
        raise ValueError("Use empty/empty payoff 0 or 1")
    if tie_order not in ("lexicographic", "reverse-lexicographic"):
        raise ValueError("Choose an explicit original-schema tie order")
    labels = leaves.shape[1]
    sizes = leaves.sum(axis=1)
    parameters = np.zeros((labels, labels + 1))
    for size in range(1, labels + 1):
        keep = sizes == size
        parameters[:, size] = p[keep] @ leaves[keep] if keep.any() else 0.0
    return gfm_from_parameters(
        parameters, float(p[sizes == 0].sum()), empty_payoff, tie_order
    )


def gfm_from_parameters(
    parameters,
    empty_mass,
    empty_payoff=1,
    tie_order="lexicographic",
    max_operations=10000000,
):
    """Moment route: no complete joint enumeration is required at this stage.

    Estimating consistent moments is a separate learning problem. Check their
    cardinality masses and label bounds; do not silently repair an invalid
    estimate. The dense Delta construction costs O(L^3), sorting O(L^2 log L).
    """
    parameters = np.asarray(parameters, dtype=float)
    if (
        parameters.ndim != 2
        or parameters.shape[0] < 1
        or parameters.shape[1] != parameters.shape[0] + 1
        or not np.isfinite(parameters).all()
        or np.any(parameters < 0)
        or np.any(parameters[:, 0] != 0)
        or not np.isfinite(empty_mass)
        or not 0 <= empty_mass <= 1
        or empty_payoff not in (0, 1)
        or tie_order not in ("lexicographic", "reverse-lexicographic")
    ):
        raise ValueError(
            "Use consistent finite cardinality moments and declared empty/tie rules"
        )
    labels = parameters.shape[0]
    if (
        isinstance(max_operations, bool)
        or not isinstance(max_operations, int)
        or max_operations < 1
        or labels**3 > max_operations
    ):
        raise ValueError("GFM moment arithmetic exceeds its declared operation budget")
    size_mass = parameters[:, 1:].sum(axis=0) / np.arange(1, labels + 1)
    if not np.isclose(empty_mass + size_mass.sum(), 1.0, rtol=0, atol=1e-12) or np.any(
        parameters[:, 1:] > size_mass[None, :] + 1e-12
    ):
        raise ValueError("Cardinality moments violate total mass or per-label support")
    choices = []
    deltas = np.zeros((labels, labels))
    for k in range(1, labels + 1):
        delta = 2 * np.sum(parameters[:, 1:] / (np.arange(1, labels + 1) + k), axis=1)
        deltas[:, k - 1] = delta
        chosen = sorted(
            range(labels),
            key=lambda j: (-delta[j], -j if tie_order == "lexicographic" else j),
        )[:k]
        action = np.zeros(labels, dtype=int)
        action[chosen] = 1
        choices.append(
            dict(k=k, action=action.tolist(), utility=float(delta[chosen].sum()))
        )
    empty = float(empty_mass * empty_payoff)
    choices.append(dict(k=0, action=[0] * labels, utility=empty))
    choices.sort(
        key=lambda row: tuple(row["action"]),
        reverse=tie_order == "reverse-lexicographic",
    )
    best = max(choices, key=lambda row: row["utility"])
    return dict(
        parameters=parameters,
        delta=deltas,
        by_size=choices,
        prediction=np.array(best["action"]),
        expected_f1=best["utility"],
    )


def constrained_map(leaves, probabilities, feasible):
    leaves, p = complete_law(leaves, probabilities)
    allowed = np.asarray(feasible(leaves))
    if allowed.shape != (len(leaves),) or allowed.dtype != bool or not allowed.any():
        raise ValueError("Feasibility must admit at least one complete vector")
    indices = np.flatnonzero(allowed)
    best = indices[np.argmax(p[indices])]
    retained_mass = float(p[allowed].sum())
    # Decision restriction can have zero probability under a misspecified law.
    # Conditioning such a law is unsupported, although an arbitrary tie action
    # is still possible. Keep this failure visible instead of dividing by zero.
    if retained_mass <= 0:
        raise ValueError("The law assigns no positive mass to feasible vectors")
    conditioned = np.where(allowed, p / retained_mass, 0)
    return dict(
        prediction=leaves[best],
        feasible=allowed,
        retained_mass=retained_mass,
        conditioned_probabilities=conditioned,
    )


def joint_features(x):
    """Unary intercept/input effects and an input-independent pair effect."""
    x = np.asarray(x, dtype=float)
    if x.ndim != 1 or not len(x) or not np.isfinite(x).all():
        raise ValueError("Use a nonempty finite scalar-input vector")
    leaves = binary_vectors(2)
    a = np.tile(leaves[:, 0], (len(x), 1))
    b = np.tile(leaves[:, 1], (len(x), 1))
    features = np.stack((a, a * x[:, None], b, b * x[:, None], a * b), axis=2)
    if not np.isfinite(features).all():
        raise ValueError("Feature construction exceeds finite arithmetic")
    return leaves, features


def log_linear_objective(x, y, weights, strength=0.2):
    leaves, features = joint_features(x)
    y = np.asarray(y)
    weights = np.asarray(weights, dtype=float)
    if (
        y.shape != (len(features), 2)
        or not np.isin(y, (0, 1)).all()
        or weights.shape != (5,)
        or not np.isfinite(weights).all()
        or not np.isfinite(strength)
        or strength <= 0
    ):
        raise ValueError(
            "Align known two-bit rows, five finite parameters and positive L2"
        )
    logits = features @ weights
    if not np.isfinite(logits).all():
        raise ValueError("Model logits exceed finite arithmetic")
    # Scratch stable log normalizer: subtract each row maximum before exp.
    maxima = logits.max(axis=1)
    shifted = np.exp(logits - maxima[:, None])
    normalizer = maxima + np.log(shifted.sum(axis=1))
    probabilities = shifted / shifted.sum(axis=1)[:, None]
    codes = (2 * y[:, 0] + y[:, 1]).astype(int)
    observed = features[np.arange(len(y)), codes]
    expected = np.einsum("ns,nsp->np", probabilities, features)
    loss = float(
        np.mean(normalizer - logits[np.arange(len(y)), codes])
        + strength * (weights @ weights) / 2
    )
    gradient = (expected - observed).mean(axis=0) + strength * weights
    second = np.einsum("ns,nsp,nsq->npq", probabilities, features, features)
    covariance = second - np.einsum("np,nq->npq", expected, expected)
    hessian = covariance.mean(axis=0) + strength * np.eye(len(weights))
    return loss, gradient, hessian, probabilities


def fit_log_linear(x, y, strength=0.2, tolerance=1e-9, max_steps=100):
    if (
        not np.isfinite(tolerance)
        or tolerance <= 0
        or isinstance(max_steps, bool)
        or not isinstance(max_steps, int)
        or max_steps < 1
    ):
        raise ValueError("Use positive finite tolerance and an integer iteration cap")
    weights = np.zeros(5)
    trace = []
    for iteration in range(max_steps):
        loss, gradient, hessian, probabilities = log_linear_objective(
            x, y, weights, strength
        )
        trace.append(
            dict(
                iteration=iteration,
                loss=loss,
                gradient_max=float(np.max(abs(gradient))),
            )
        )
        if np.max(abs(gradient)) <= tolerance:
            return dict(
                weights=weights,
                probabilities=probabilities,
                trace=trace,
                strength=strength,
            )
        direction = np.linalg.solve(hessian, gradient)
        scale = 1.0
        for _ in range(40):
            candidate = weights - scale * direction
            new_loss = log_linear_objective(x, y, candidate, strength)[0]
            if new_loss <= loss - 1e-4 * scale * (gradient @ direction):
                weights = candidate
                break
            scale *= 0.5
        else:
            raise RuntimeError("Joint-model backtracking found no supported step")
    raise RuntimeError("Joint-model fit reached its cap before stationarity")


def predict_log_linear(model, x):
    leaves, features = joint_features(x)
    logits = features @ model["weights"]
    if not np.isfinite(logits).all():
        raise ValueError("Served logits exceed finite arithmetic")
    probabilities = np.exp(logits - logsumexp(logits, axis=1)[:, None])
    return dict(
        leaves=leaves,
        probabilities=probabilities,
        marginals=probabilities @ leaves,
        map_prediction=leaves[np.argmax(probabilities, axis=1)],
    )


def main():
    np.set_printoptions(precision=6, suppress=True)
    leaves = binary_vectors(2)
    for counts in ([6, 5, 1, 8], [18, 1, 0, 1]):
        p = np.array(counts, dtype=float) / sum(counts)
        records, choices = all_action_risks(leaves, p)
        chosen = gfm(leaves, p)
        np.testing.assert_array_equal(chosen["prediction"], choices["f1_risk"])
        print(
            "Two-output law counts / every action risk / named choices:",
            counts,
            records,
            choices,
        )
        print(
            "GFM parameters / Delta / every k candidate:",
            chosen["parameters"].tolist(),
            chosen["delta"].tolist(),
            chosen["by_size"],
        )
    # A separate four-label law, rather than treating a two-bit coincidence
    # as evidence that marginal thresholds always solve F1.
    leaves4 = binary_vectors(4)
    counts4 = np.array([7, 1, 0, 2, 3, 1, 2, 0, 1, 3, 0, 1, 1, 0, 2, 4], dtype=float)
    p4 = counts4 / counts4.sum()
    for empty_payoff in (0, 1):
        records, choices = all_action_risks(leaves4, p4, empty_payoff)
        chosen = gfm(leaves4, p4, empty_payoff)
        np.testing.assert_array_equal(chosen["prediction"], choices["f1_risk"])
        expected = sum(
            mass * f1_score(truth, chosen["prediction"], zero_division=empty_payoff)
            for mass, truth in zip(p4, leaves4)
        )
        np.testing.assert_allclose(chosen["expected_f1"], expected)
        print(
            "Four-label masses / empty payoff / all action risks:",
            p4.tolist(),
            empty_payoff,
            records,
        )
        print(
            "Four-label GFM complete k table / selected action / expected F1:",
            chosen["by_size"],
            chosen["prediction"].tolist(),
            chosen["expected_f1"],
        )

    leaves3 = binary_vectors(3)
    masses = np.array([0.2, 0.15, 0.05, 0.3, 0.1, 0.05, 0.1, 0.05])
    constraint = constrained_map(
        leaves3, masses, lambda rows: (rows[:, 2] == 0) | (rows[:, 0] == 1)
    )
    unconstrained = leaves3[np.argmax(masses)]
    repaired = unconstrained.copy()
    repaired[0] = max(repaired[0], repaired[2])
    np.testing.assert_array_equal(unconstrained, [0, 1, 1])
    np.testing.assert_array_equal(repaired, [1, 1, 1])
    np.testing.assert_array_equal(constraint["prediction"], [0, 0, 0])
    print(
        "C implies A: feasible mask / retained mass / conditioned law:",
        constraint["feasible"].tolist(),
        constraint["retained_mass"],
        constraint["conditioned_probabilities"].tolist(),
    )
    print(
        "Unconstrained MAP / deterministic implication repair / feasible MAP:",
        unconstrained.tolist(),
        repaired.tolist(),
        constraint["prediction"].tolist(),
    )

    count_rows = np.array([[6, 1, 2, 7], [2, 5, 1, 8]])
    inputs = []
    targets = []
    for x, counts in zip((-1.0, 1.0), count_rows):
        for leaf, count in zip(leaves, counts):
            inputs += [x] * int(count)
            targets += [leaf.tolist()] * int(count)
    x = np.array(inputs)
    y = np.array(targets)
    changed = np.array([0.2, -0.1, 0.3, 0.15, -0.2])
    loss, gradient, hessian, _ = log_linear_objective(x, y, changed)
    numerical = np.zeros(5)
    for j in range(5):
        plus = changed.copy()
        minus = changed.copy()
        plus[j] += 1e-6
        minus[j] -= 1e-6
        numerical[j] = (
            log_linear_objective(x, y, plus)[0] - log_linear_objective(x, y, minus)[0]
        ) / 2e-6
    np.testing.assert_allclose(gradient, numerical, atol=1e-9)
    assert np.linalg.eigvalsh(hessian).min() >= 0.2 - 1e-12
    fitted = fit_log_linear(x, y)
    ordinary = minimize(
        lambda w: log_linear_objective(x, y, w)[0],
        np.zeros(5),
        jac=lambda w: log_linear_objective(x, y, w)[1],
        method="BFGS",
        options=dict(gtol=1e-10, maxiter=1000),
    )
    ordinary_gradient = log_linear_objective(x, y, ordinary.x)[1]
    np.testing.assert_allclose(fitted["weights"], ordinary.x, atol=3e-7)
    assert np.max(abs(ordinary_gradient)) < 1e-7
    prediction = predict_log_linear(fitted, [-1.0, 0.0, 1.0])
    print(
        "Joint fit declared input/count rows / feature basis:",
        count_rows.tolist(),
        ["yA", "x*yA", "yB", "x*yB", "yA*yB"],
    )
    print(
        "Changed objective / gradient maximum error / Hessian minimum eigenvalue:",
        loss,
        float(np.max(abs(gradient - numerical))),
        float(np.linalg.eigvalsh(hessian).min()),
    )
    print(
        "Scratch fitted weights / full convergence trace:",
        fitted["weights"].tolist(),
        fitted["trace"],
    )
    print(
        "Ordinary optimizer status / message / weights / gradient maximum:",
        ordinary.success,
        str(ordinary.message),
        ordinary.x.tolist(),
        float(np.max(abs(ordinary_gradient))),
    )
    print(
        "Actual query x -1/0/1 complete laws / MAP / marginals:",
        prediction["probabilities"].tolist(),
        prediction["map_prediction"].tolist(),
        prediction["marginals"].tolist(),
    )


if __name__ == "__main__":
    main()
