"""Two-pass centered block EM, with explicitly supplied starting state."""
from dataclasses import dataclass
import numpy as np
from gaussian_mixture import GaussianMixtureState
from gaussian_log_density import query_rows
from fractional_gaussian_update import restrict_scatter


def block_update(values, old_state, block_size=128, regularization=1e-6, empty_fraction=1e-12):
    values = query_rows(values, old_state.dimension)
    n, dimension = values.shape
    if n < old_state.components or not isinstance(block_size, int) or block_size < 1:
        raise ValueError("n >= K and positive integer block size required")
    if not np.isfinite(empty_fraction) or empty_fraction < 0:
        raise ValueError("nonnegative finite empty fraction required")
    components = old_state.components
    counts = np.zeros(components)
    means = np.zeros((components, dimension))
    # First pass: merge weighted local centers; keep old_state frozen.
    for start in range(0, n, block_size):
        rows = values[start:start + block_size]
        r = old_state.predict_proba(rows)
        origin = rows[0]
        for k in range(components):
            mass = r[:, k].sum()
            if mass == 0:
                continue
            center = origin + r[:, k] @ (rows - origin) / mass
            total = counts[k] + mass
            means[k] += (mass / total) * (center - means[k])
            counts[k] = total
    empty = np.flatnonzero(counts <= empty_fraction * n)
    if len(empty):
        raise ValueError("numerically empty component IDs " + str(empty.tolist()))
    family = old_state.family
    if family in ("full", "tied"):
        scatter = np.zeros((components, dimension, dimension))
    elif family == "diag":
        scatter = np.zeros((components, dimension))
    else:
        scatter = np.zeros(components)
    # Second pass: same old responsibilities, newly determined centers.
    for start in range(0, n, block_size):
        rows = values[start:start + block_size]
        r = old_state.predict_proba(rows)
        for k in range(components):
            residual = rows - means[k]
            weighted = r[:, k, None] * residual
            if family in ("full", "tied"):
                scatter[k] += weighted.T @ residual
            elif family == "diag":
                scatter[k] += np.sum(weighted * residual, axis=0)
            else:
                scatter[k] += np.sum(weighted * residual)
    covariance = restrict_scatter(scatter, counts, dimension, family, regularization)
    return GaussianMixtureState(counts / n, means, covariance, family)


@dataclass(frozen=True)
class IterationRecord:
    iteration: int
    mean_log_likelihood: float
    total_log_likelihood: float
    signed_gain: float
    decrease: bool


class DenseEM:
    def __init__(self, regularization=1e-6, tolerance=1e-6, max_iter=100, block_size=128):
        if not np.isfinite(regularization) or regularization < 0 or not np.isfinite(tolerance) or tolerance < 0:
            raise ValueError("nonnegative finite regularization/tolerance required")
        if not isinstance(max_iter, int) or max_iter < 1 or not isinstance(block_size, int) or block_size < 1:
            raise ValueError("positive integer budgets required")
        self.regularization = regularization
        self.tolerance = tolerance
        self.max_iter = max_iter
        self.block_size = block_size

    def fit(self, values, initial_state):
        values = query_rows(values, initial_state.dimension)
        if len(values) < initial_state.components or np.any(initial_state.weights <= 0):
            raise ValueError("n >= K and positive active starting weights required")
        self.state = initial_state
        score = self.state.score(values)
        self.trace = [IterationRecord(0, score, len(values) * score, 0, False)]
        self.converged = False
        for iteration in range(1, self.max_iter + 1):
            updated = block_update(values, self.state, self.block_size, self.regularization)
            new_score = updated.score(values)
            gain = new_score - score
            decrease = gain < -1e-10 * max(1, abs(score))
            self.trace.append(IterationRecord(iteration, new_score, len(values) * new_score, gain, decrease))
            self.state = updated
            if abs(gain) <= self.tolerance * max(1, abs(score)):
                self.converged = True
                break
            score = new_score
        self.iterations = iteration
        return self

    def score_samples(self, values):
        return self.state.score_samples(values)

    def score(self, values):
        return self.state.score(values)

    def predict_proba(self, values):
        return self.state.predict_proba(values)

    def predict(self, values):
        return self.state.predict(values)


def toy_state(family="full"):
    if family == "full":
        covariance = np.array([np.eye(2), np.eye(2)])
    elif family == "tied":
        covariance = np.eye(2)
    elif family == "diag":
        covariance = np.ones((2, 2))
    else:
        covariance = np.ones(2)
    return GaussianMixtureState([.5, .5], [[-1, 0], [1, 0]], covariance, family)


def toy_rows():
    return np.array([[-2, -1], [-2, 1], [-1, 0], [1, 0], [2, -1], [2, 1]], dtype=float)


def main():
    rows = toy_rows()
    for family in ["full", "tied", "diag", "spherical"]:
        state = block_update(rows, toy_state(family), block_size=2, regularization=.05)
        print("one-cycle family", family, "means", state.means.tolist(), "covariances", state.covariances.tolist())
    fit = DenseEM(regularization=.05, tolerance=1e-8, max_iter=50, block_size=2).fit(rows, toy_state())
    print("full toy convergence", fit.converged, "iterations", fit.iterations)
    print("full toy weights", fit.state.weights.tolist())
    print("full toy means", fit.state.means.tolist())
    print("full toy covariance", fit.state.covariances.tolist())
    print("full toy current mean score", fit.score(rows))
    print("full toy trace", [record.__dict__ for record in fit.trace])


if __name__ == "__main__":
    main()
