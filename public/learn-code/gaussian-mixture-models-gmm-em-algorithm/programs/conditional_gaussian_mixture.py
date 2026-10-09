"""Prepare a coordinate partition, condition components, then update source weights."""
import numpy as np
from scipy.linalg import cho_solve
from gaussian_log_density import GaussianFactor, query_rows, symmetric_spd
from gaussian_mixture import GaussianMixtureState, logsumexp_rows


class EmptyConditional:
    """The distribution on the sole empty vector has unit mass/log density zero."""
    def __init__(self, weights):
        self.weights = weights
        self.dimension = 0

    def score_samples(self, rows):
        rows = query_rows(rows, 0)
        return np.zeros(len(rows))

    def moments(self):
        return np.empty(0), np.empty((0, 0))


class ConditionalPlan:
    def __init__(self, model, observed, remaining=None):
        self.model = model
        self.observed = list(observed)
        self.remaining = [i for i in range(model.dimension) if i not in self.observed] if remaining is None else list(remaining)
        all_indices = self.observed + self.remaining
        if any(not isinstance(i, (int, np.integer)) for i in all_indices) or sorted(all_indices) != list(range(model.dimension)):
            raise ValueError("unique coordinate indices must partition all dimensions")
        self.blocks = []
        for k in range(model.components):
            covariance = model.covariance_matrix(k)
            if not self.observed:
                continue
            uu = covariance[np.ix_(self.observed, self.observed)]
            marginal = GaussianFactor(model.means[k, self.observed], uu)
            vu = covariance[np.ix_(self.remaining, self.observed)]
            gain = cho_solve((marginal.lower, True), vu.T).T
            conditional = covariance[np.ix_(self.remaining, self.remaining)] - gain @ vu.T
            if self.remaining:
                conditional, factor = symmetric_spd(conditional)
            self.blocks.append((marginal, gain, conditional))
        if self.observed and self.remaining:
            self.prepared_conditional = GaussianMixtureState(model.weights, model.means[:, self.remaining],
                                                            [block[2] for block in self.blocks])

    def condition(self, observed_values):
        observed_values = np.asarray(observed_values, dtype=float)
        if observed_values.shape != (len(self.observed),) or not np.isfinite(observed_values).all():
            raise ValueError("one finite observed-coordinate vector required")
        if not self.observed:
            return self.model
        logs = np.array([[self.model.log_weights[k] + block[0].log_density([observed_values])[0]
                          for k, block in enumerate(self.blocks)]])
        weights = np.exp(logs - logsumexp_rows(logs)[:, None])[0]
        if not self.remaining:
            return EmptyConditional(weights)
        means = []
        for k, (marginal, gain, covariance) in enumerate(self.blocks):
            means.append(self.model.means[k, self.remaining] + gain @ (observed_values - marginal.mean))
        return self.prepared_conditional.recenter_full(weights, means)


def main():
    model = GaussianMixtureState([.5, .5], [[0, 0], [2, 4]], [[[1, .5], [.5, 1]]] * 2)
    plan = ConditionalPlan(model, [0])
    for u in [1, 0]:
        result = plan.condition([u])
        mean, covariance = result.moments()
        print("conditional", u, "weights", result.weights.tolist(), "means", result.means.tolist(), "covariance", result.covariances.tolist())
        print("conditional total moments", mean.tolist(), covariance.tolist())
        v = 2
        marginal_logs = np.array([[model.log_weights[k] + block[0].log_density([[u]])[0] for k, block in enumerate(plan.blocks)]])
        direct = model.score_samples([[u, v]])[0] - logsumexp_rows(marginal_logs)[0]
        print("conditional/direct log density", float(result.score_samples([[v]])[0]), float(direct))
    changed = GaussianMixtureState([1], [[0, 0]], [[[4, 2], [2, 2]]])
    conditional = ConditionalPlan(changed, [0]).condition([2])
    print("changed conditional mean/variance", conditional.means.tolist(), conditional.covariances.tolist())
    print("empty observed identity", ConditionalPlan(model, []).condition([]) is model)
    print("empty remaining log density", ConditionalPlan(model, [0, 1]).condition([1, 2]).score_samples([[]]).tolist())


if __name__ == "__main__":
    main()
