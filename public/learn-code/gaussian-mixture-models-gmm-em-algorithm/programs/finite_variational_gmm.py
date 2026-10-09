"""Finite normal-Wishart/Dirichlet coordinate ascent with all ELBO constants."""
from dataclasses import dataclass
import numpy as np
from scipy.linalg import cho_solve
from scipy.special import digamma, gammaln, multigammaln
from gaussian_log_density import GaussianFactor, query_rows, symmetric_spd, symmetric_part
from gaussian_mixture import logsumexp_rows
from fractional_gaussian_update import allocated_rows


@dataclass(frozen=True)
class Prior:
    alpha: float
    beta: float
    mean: np.ndarray
    degrees: float
    inverse_scale: np.ndarray

    def validate(self):
        if np.asarray(self.mean).ndim != 1:
            raise ValueError("one-dimensional prior mean vector required")
        dimension = len(self.mean)
        if dimension < 1 or not np.isfinite(self.mean).all() or not np.isfinite([self.alpha, self.beta, self.degrees]).all():
            raise ValueError("finite prior parameters required")
        if self.alpha <= 0 or self.beta <= 0 or self.degrees <= dimension - 1:
            raise ValueError("proper Dirichlet/normal-Wishart prior required")
        matrix, factor = symmetric_spd(self.inverse_scale)
        if matrix.shape != (dimension, dimension):
            raise ValueError("prior scale dimension mismatch")


@dataclass(frozen=True)
class Factors:
    alpha: np.ndarray
    beta: np.ndarray
    means: np.ndarray
    degrees: np.ndarray
    inverse_scales: np.ndarray
    scales: np.ndarray


def fractional_statistics(rows, responsibilities):
    rows, r = allocated_rows(rows, responsibilities)
    counts = r.sum(axis=0)
    centers = np.zeros((len(counts), rows.shape[1]))
    scatter = np.zeros((len(counts), rows.shape[1], rows.shape[1]))
    origin = rows[0]
    for k, count in enumerate(counts):
        if count == 0:
            continue
        centers[k] = origin + r[:, k] @ (rows - origin) / count
        residual = rows - centers[k]
        scatter[k] = (r[:, k, None] * residual).T @ residual / count
    return counts, centers, scatter


def factor_update(counts, centers, scatter, prior):
    prior.validate()
    counts = np.asarray(counts, dtype=float)
    centers = np.asarray(centers, dtype=float)
    scatter = np.asarray(scatter, dtype=float)
    dimension = len(prior.mean)
    if counts.ndim != 1 or centers.shape != (len(counts), dimension) or scatter.shape != (len(counts), dimension, dimension):
        raise ValueError("compatible count/center/scatter shapes required")
    if np.any(counts < 0) or not all(np.isfinite(a).all() for a in [counts, centers, scatter]):
        raise ValueError("finite nonnegative counts and finite statistics required")
    for matrix in scatter:
        scale = max(1.0, float(np.max(np.abs(matrix))))
        if np.max(np.abs(matrix - matrix.T)) > 1e-12 * scale:
            raise ValueError("symmetric fractional scatter required")
        if np.linalg.eigvalsh(symmetric_part(matrix)).min() < -1e-12 * scale:
            raise ValueError("positive-semidefinite fractional scatter required")
    alpha = prior.alpha + counts
    beta = prior.beta + counts
    degrees = prior.degrees + counts
    means = prior.mean + (counts / beta)[:, None] * (centers - prior.mean)
    inverse_scales = []
    scales = []
    for k, count in enumerate(counts):
        offset = centers[k] - prior.mean
        updated = prior.inverse_scale + count * scatter[k] + (prior.beta * count / beta[k]) * np.outer(offset, offset)
        updated, lower = symmetric_spd(updated)
        inverse_scales.append(updated)
        scales.append(cho_solve((lower, True), np.eye(dimension)))
    return Factors(alpha, beta, means, degrees, np.array(inverse_scales), np.array(scales))


def expected_logs(factors):
    dimension = factors.means.shape[1]
    log_weights = digamma(factors.alpha) - digamma(factors.alpha.sum())
    determinants = []
    for k, scale in enumerate(factors.scales):
        logdet = np.linalg.slogdet(scale)[1]
        value = sum(digamma((factors.degrees[k] + 1 - i) / 2) for i in range(1, dimension + 1))
        determinants.append(value + dimension * np.log(2) + logdet)
    return log_weights, np.array(determinants)


def expected_log_density(rows, factors):
    rows = query_rows(rows, factors.means.shape[1])
    dimension = rows.shape[1]
    log_weights, log_precision = expected_logs(factors)
    terms = np.empty((len(rows), len(factors.alpha)))
    for k in range(len(factors.alpha)):
        lower = np.linalg.cholesky(factors.scales[k])
        transformed = (rows - factors.means[k]) @ lower
        quadratic = dimension / factors.beta[k] + factors.degrees[k] * np.sum(transformed * transformed, axis=1)
        terms[:, k] = .5 * (log_precision[k] - dimension * np.log(2 * np.pi) - quadratic)
    return terms


def assignments(rows, factors):
    logs = expected_log_density(rows, factors) + expected_logs(factors)[0]
    return np.exp(logs - logsumexp_rows(logs)[:, None])


def dirichlet_log_normalizer(alpha):
    return float(gammaln(np.sum(alpha)) - np.sum(gammaln(alpha)))


def wishart_log_normalizer(inverse_scale, degrees):
    dimension = len(inverse_scale)
    logdet_inverse = np.linalg.slogdet(inverse_scale)[1]
    return .5 * degrees * logdet_inverse - .5 * degrees * dimension * np.log(2) - multigammaln(degrees / 2, dimension)


def elbo_terms(rows, r, factors, prior):
    rows, r = allocated_rows(rows, r)
    dimension = rows.shape[1]
    log_weights, log_precision = expected_logs(factors)
    likelihood = float(np.sum(r * expected_log_density(rows, factors)))
    assignments_prior = float(r.sum(axis=0) @ log_weights)
    prior_alpha = np.full(len(factors.alpha), prior.alpha)
    weight_prior = dirichlet_log_normalizer(prior_alpha) + float((prior_alpha - 1) @ log_weights)
    weight_q = dirichlet_log_normalizer(factors.alpha) + float((factors.alpha - 1) @ log_weights)
    parameter_prior = 0.0
    parameter_q = 0.0
    for k in range(len(factors.alpha)):
        degrees = factors.degrees[k]
        scale = factors.scales[k]
        offset = factors.means[k] - prior.mean
        prior_quadratic = dimension / factors.beta[k] + degrees * (offset @ scale @ offset)
        normal_prior = .5 * (dimension * np.log(prior.beta) + log_precision[k] - dimension * np.log(2 * np.pi) - prior.beta * prior_quadratic)
        wishart_prior = wishart_log_normalizer(prior.inverse_scale, prior.degrees)
        wishart_prior += .5 * (prior.degrees - dimension - 1) * log_precision[k] - .5 * degrees * np.trace(prior.inverse_scale @ scale)
        parameter_prior += normal_prior + wishart_prior
        normal_q = .5 * (dimension * np.log(factors.beta[k]) + log_precision[k] - dimension * np.log(2 * np.pi) - dimension)
        wishart_q = wishart_log_normalizer(factors.inverse_scales[k], degrees)
        wishart_q += .5 * (degrees - dimension - 1) * log_precision[k] - .5 * degrees * dimension
        parameter_q += normal_q + wishart_q
    positive = r > 0
    assignment_q = float(np.sum(r[positive] * np.log(r[positive])))
    return {"expected_log_p_X": likelihood, "expected_log_p_Z": assignments_prior,
            "expected_log_p_pi": weight_prior, "expected_log_p_mu_precision": float(parameter_prior),
            "negative_expected_log_q_Z": -assignment_q, "negative_expected_log_q_pi": -weight_q,
            "negative_expected_log_q_mu_precision": -float(parameter_q)}


def predictive_log_terms(rows, factors):
    rows = query_rows(rows, factors.means.shape[1])
    dimension = rows.shape[1]
    terms = np.empty((len(rows), len(factors.alpha)))
    weights = factors.alpha / factors.alpha.sum()
    for k in range(len(weights)):
        df = factors.degrees[k] + 1 - dimension
        scale = factors.inverse_scales[k] * (1 + factors.beta[k]) / (df * factors.beta[k])
        prepared = GaussianFactor(factors.means[k], scale)
        quadratic = np.sum(prepared.coordinates(rows) ** 2, axis=1)
        normalizer = gammaln((df + dimension) / 2) - gammaln(df / 2)
        normalizer -= .5 * (dimension * np.log(df * np.pi) + prepared.log_determinant)
        terms[:, k] = np.log(weights[k]) + normalizer - .5 * (df + dimension) * np.log1p(quadratic / df)
    return terms


def predictive_moments(factors):
    dimension = factors.means.shape[1]
    degrees = factors.degrees + 1 - dimension
    if np.any(degrees <= 2):
        raise ValueError("finite predictive covariance requires every active df > 2")
    weights = factors.alpha / factors.alpha.sum()
    mean = weights @ factors.means
    covariance = np.zeros((dimension, dimension))
    for k, weight in enumerate(weights):
        component_cov = factors.inverse_scales[k] * (1 + factors.beta[k]) / ((degrees[k] - 2) * factors.beta[k])
        offset = factors.means[k] - mean
        covariance += weight * (component_cov + np.outer(offset, offset))
    return mean, covariance


class FiniteVIGMM:
    def __init__(self, prior, max_iter=100, tolerance=1e-8):
        prior.validate()
        if not isinstance(max_iter, int) or max_iter < 1 or not np.isfinite(tolerance) or tolerance < 0:
            raise ValueError("positive budget and finite nonnegative tolerance required")
        self.prior = prior
        self.max_iter = max_iter
        self.tolerance = tolerance

    def fit(self, rows, initial_responsibilities):
        rows, r = allocated_rows(rows, initial_responsibilities)
        if rows.shape[1] != len(self.prior.mean):
            raise ValueError("prior dimension mismatch")
        factors = factor_update(*fractional_statistics(rows, r), self.prior)
        self.trace = []
        terms = elbo_terms(rows, r, factors, self.prior)
        previous = sum(terms.values())
        self.trace.append({"iteration": 0, "ELBO": previous, "terms": terms})
        self.converged = False
        for iteration in range(1, self.max_iter + 1):
            r = assignments(rows, factors)
            factors = factor_update(*fractional_statistics(rows, r), self.prior)
            terms = elbo_terms(rows, r, factors, self.prior)
            current = sum(terms.values())
            if not np.isfinite(current):
                raise ArithmeticError("ELBO exceeds representable range")
            self.trace.append({"iteration": iteration, "ELBO": current, "gain": current - previous, "terms": terms})
            if current < previous - 1e-9 * max(1, abs(previous)):
                raise ArithmeticError("coordinate-ascent ELBO decreased")
            if abs(current - previous) <= self.tolerance * max(1, abs(previous)):
                self.converged = True
                break
            previous = current
        self.factors = factors
        self.responsibilities = r
        self.iterations = iteration
        return self

    def expected_log_score_samples(self, rows):
        logs = expected_log_density(rows, self.factors) + expected_logs(self.factors)[0]
        return logsumexp_rows(logs)

    def predict_proba(self, rows):
        return assignments(rows, self.factors)

    def predictive_score_samples(self, rows):
        return logsumexp_rows(predictive_log_terms(rows, self.factors))


def toy_prior():
    return Prior(1, 1, np.zeros(2), 3, np.eye(2))


def toy_responsibilities():
    return np.array([[1, 0]] * 3 + [[0, 1]] * 3, dtype=float)


def main():
    from gaussian_em import toy_rows
    prior = toy_prior()
    hand = factor_update([2], [[1, 0]], [np.diag([.5, .25])], prior)
    print("hand beta/mean/degrees", hand.beta.tolist(), hand.means.tolist(), hand.degrees.tolist())
    print("hand inverse scale/scale", hand.inverse_scales.tolist(), hand.scales.tolist())
    print("hand predictive moments", [a.tolist() for a in predictive_moments(hand)])
    first = factor_update(*fractional_statistics(toy_rows(), toy_responsibilities()), prior)
    print("toy first factors", first.alpha.tolist(), first.beta.tolist(), first.means.tolist(), first.degrees.tolist(), first.inverse_scales.tolist())
    print("toy first assignments", assignments([[0, 0], [.5, 0]], first).tolist())
    model = FiniteVIGMM(prior, max_iter=50, tolerance=1e-8).fit(toy_rows(), toy_responsibilities())
    print("toy VI convergence", model.converged, "iterations", model.iterations)
    print("toy VI trace", model.trace)
    print("toy VI final means", model.factors.means.tolist())
    print("expected-log scores", model.expected_log_score_samples([[0, 0], [.5, 0], [3, 1]]).tolist())
    print("integrated predictive scores", model.predictive_score_samples([[0, 0], [.5, 0], [3, 1]]).tolist())


if __name__ == "__main__":
    main()
