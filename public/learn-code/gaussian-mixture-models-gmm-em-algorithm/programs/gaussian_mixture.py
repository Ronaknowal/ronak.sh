"""Supplied-state mixture inference, moments and categorical-first sampling."""
import numpy as np
from scipy.linalg import solve_triangular
from gaussian_log_density import GaussianFactor, query_rows, symmetric_spd


def logsumexp_rows(log_terms):
    log_terms = np.asarray(log_terms, dtype=np.float64)
    if log_terms.ndim != 2 or np.isnan(log_terms).any() or np.isposinf(log_terms).any():
        raise ValueError("finite or negative-infinite log terms required")
    largest = np.max(log_terms, axis=1)
    if not np.isfinite(largest).all():
        raise ArithmeticError("no representable supported term in a row")
    return largest + np.log(np.exp(log_terms - largest[:, None]).sum(axis=1))


class GaussianMixtureState:
    def __init__(self, weights, means, covariances, family="full"):
        self.weights = np.asarray(weights, dtype=np.float64).copy()
        self.means = np.asarray(means, dtype=np.float64).copy()
        if self.means.ndim != 2 or not np.isfinite(self.means).all():
            raise ValueError("finite K-by-d means required")
        self.components, self.dimension = self.means.shape
        if self.components < 1 or self.dimension < 1 or self.weights.shape != (self.components,):
            raise ValueError("nonempty compatible component arrays required")
        if not np.isfinite(self.weights).all() or np.any(self.weights < 0) or not np.isclose(self.weights.sum(), 1, rtol=0, atol=1e-12):
            raise ValueError("nonnegative unit-sum weights required")
        self.log_weights = np.full(self.components, -np.inf)
        positive = self.weights > 0
        self.log_weights[positive] = np.log(self.weights[positive])
        self.family = family
        covariances = np.asarray(covariances, dtype=np.float64)
        if family == "full":
            if covariances.shape != (self.components, self.dimension, self.dimension):
                raise ValueError("full covariance shape K-by-d-by-d required")
            self.factors = [GaussianFactor(mean, cov) for mean, cov in zip(self.means, covariances)]
            self.covariances = np.array([factor.covariance for factor in self.factors])
        elif family == "tied":
            if covariances.shape != (self.dimension, self.dimension):
                raise ValueError("tied covariance shape d-by-d required")
            self.covariances, self.lower = symmetric_spd(covariances)
            self.origin = self.means[0].copy()
            self.whitened_means = solve_triangular(self.lower, (self.means - self.origin).T, lower=True).T
            self.normalizer = self.dimension * np.log(2 * np.pi) + 2 * np.log(np.diag(self.lower)).sum()
        elif family in ("diag", "spherical"):
            expected = (self.components, self.dimension) if family == "diag" else (self.components,)
            if covariances.shape != expected or not np.isfinite(covariances).all() or np.any(covariances <= 0):
                raise ValueError("positive finite coordinate/scalar variances required")
            self.covariances = covariances.copy()
        else:
            raise ValueError("unknown covariance family")

    def log_joint(self, values):
        rows = query_rows(values, self.dimension)
        terms = np.empty((len(rows), self.components))
        if self.family == "tied":
            white = solve_triangular(self.lower, (rows - self.origin).T, lower=True).T
        for k in range(self.components):
            if self.family == "full":
                log_density = self.factors[k].log_density(rows)
            elif self.family == "tied":
                residual = white - self.whitened_means[k]
                log_density = -0.5 * (self.normalizer + np.sum(residual * residual, axis=1))
            else:
                variance = self.covariances[k]
                standardized = (rows - self.means[k]) / np.sqrt(variance)
                logdet = np.log(variance).sum() if self.family == "diag" else self.dimension * np.log(variance)
                log_density = -0.5 * (self.dimension * np.log(2 * np.pi) + logdet + np.sum(standardized * standardized, axis=1))
            terms[:, k] = self.log_weights[k] + log_density
        if np.isnan(terms).any() or np.isposinf(terms).any():
            raise ArithmeticError("mixture terms exceed representable range")
        return terms

    def score_samples(self, values):
        return logsumexp_rows(self.log_joint(values))

    def score(self, values):
        scores = self.score_samples(values)
        if len(scores) == 0:
            raise ValueError("score needs at least one row")
        with np.errstate(over="ignore", invalid="ignore"):
            mean = float(scores.mean())
        if not np.isfinite(mean):
            scale = float(np.max(np.abs(scores)))
            mean = float((scores / scale).mean() * scale)
        if not np.isfinite(mean):
            raise ArithmeticError("mean log density exceeds representable range")
        return mean

    def predict_proba(self, values):
        terms = self.log_joint(values)
        return np.exp(terms - logsumexp_rows(terms)[:, None])

    def predict(self, values):
        terms = self.log_joint(values)
        if not np.isfinite(np.max(terms, axis=1)).all():
            raise ArithmeticError("no representable supported term in a row")
        return np.argmax(terms, axis=1)

    def covariance_matrix(self, k):
        if self.family == "full":
            return self.covariances[k]
        if self.family == "tied":
            return self.covariances
        if self.family == "diag":
            return np.diag(self.covariances[k])
        return np.eye(self.dimension) * self.covariances[k]

    def recenter_full(self, weights, means):
        if self.family != "full":
            raise ValueError("prepared full covariance required")
        weights = np.asarray(weights, dtype=float)
        means = np.asarray(means, dtype=float)
        if means.shape != self.means.shape or not np.isfinite(means).all():
            raise ValueError("finite compatible replacement means required")
        if weights.shape != self.weights.shape or not np.isfinite(weights).all() or np.any(weights < 0) or not np.isclose(weights.sum(), 1, rtol=0, atol=1e-12):
            raise ValueError("compatible normalized replacement weights required")
        updated = object.__new__(GaussianMixtureState)
        updated.weights = weights.copy()
        updated.means = means.copy()
        updated.components = self.components
        updated.dimension = self.dimension
        updated.family = "full"
        updated.covariances = self.covariances
        updated.factors = [factor.with_mean(mean) for factor, mean in zip(self.factors, means)]
        updated.log_weights = np.full(self.components, -np.inf)
        positive = weights > 0
        updated.log_weights[positive] = np.log(weights[positive])
        return updated

    def moments(self):
        mean = self.weights @ self.means
        covariance = np.zeros((self.dimension, self.dimension))
        for k, weight in enumerate(self.weights):
            offset = self.means[k] - mean
            covariance += weight * (self.covariance_matrix(k) + np.outer(offset, offset))
        return mean, covariance

    def sample(self, count, seed=16):
        if not isinstance(count, int) or count < 0:
            raise ValueError("nonnegative integer sample count required")
        rng = np.random.default_rng(seed)
        ids = rng.choice(self.components, size=count, p=self.weights)
        rows = np.empty((count, self.dimension))
        for k in range(self.components):
            selected = ids == k
            lower = np.linalg.cholesky(self.covariance_matrix(k))
            rows[selected] = self.means[k] + rng.standard_normal((selected.sum(), self.dimension)) @ lower.T
        return rows, ids


def main():
    state = GaussianMixtureState([.5, .5], [[-2], [2]], [[[1]], [[1]]])
    rows = [[0], [2], [8]]
    print("query log densities", state.score_samples(rows).tolist())
    print("query responsibilities", state.predict_proba(rows).tolist())
    print("query component IDs", state.predict(rows).tolist())
    mean, cov = state.moments()
    print("mixture moments", mean.tolist(), cov.tolist())
    print("independent-average variance", .5)
    for weights, covariance in [([0, 1], [[[1]], [[1]]]), ([.25, .75], [[[4]], [[1]]])]:
        changed = GaussianMixtureState(weights, [[-2], [2]], covariance)
        print("changed posterior at zero", changed.predict_proba([[0]]).tolist())
    rows, ids = state.sample(4)
    print("generated component IDs", ids.tolist())
    print("generated rows", rows.tolist())


if __name__ == "__main__":
    main()
