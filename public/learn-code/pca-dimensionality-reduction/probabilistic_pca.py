"""N8: isotropic-noise ML spectral PPCA, posterior solves and log density."""

from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class ProbabilisticPCA:
    mean: np.ndarray
    weights: np.ndarray
    noise_variance: float
    ml_eigenvalues: np.ndarray
    posterior_cholesky: np.ndarray
    posterior_covariance: np.ndarray

    @classmethod
    def fit(cls, values, k):
        x = np.asarray(values, dtype=float)
        if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] < 1 or not np.isfinite(x).all():
            raise ValueError("Use a finite n-by-d table with n>=2")
        n, d = x.shape
        if (
            isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k < d
        ):
            raise ValueError("Use integer 0<=k<d")
        mean = x.mean(axis=0)
        _, singular_values, vh = np.linalg.svd(x - mean, full_matrices=False)
        eigenvalues = np.zeros(d)
        eigenvalues[: singular_values.size] = singular_values**2 / n
        noise = float(np.mean(eigenvalues[k:]))
        if not np.isfinite(noise) or noise <= 0:
            raise ValueError(
                "This nonsingular PPCA route requires positive noise variance"
            )
        if k and (k > vh.shape[0] or np.any(eigenvalues[:k] <= noise)):
            raise ValueError("Requested signal eigenvalues must exceed the noise level")
        directions = vh[:k].copy()
        for direction in directions:
            if direction[np.argmax(np.abs(direction))] < 0:
                direction *= -1
        weights = directions.T * np.sqrt(eigenvalues[:k] - noise)
        m = weights.T @ weights + noise * np.eye(k)
        cholesky = np.linalg.cholesky(m)
        # The covariance belongs to fitted state, not to an individual query.
        identity = np.eye(k)
        covariance = noise * np.linalg.solve(
            cholesky.T, np.linalg.solve(cholesky, identity)
        )
        for array in (mean, weights, eigenvalues, cholesky, covariance):
            array.setflags(write=False)
        return cls(mean, weights, noise, eigenvalues, cholesky, covariance)

    def posterior(self, values):
        rows = np.asarray(values, dtype=float)
        if (
            rows.ndim != 2
            or rows.shape[1] != self.mean.size
            or not np.isfinite(rows).all()
        ):
            raise ValueError("Use finite query rows in the fitted feature order")
        a = rows - self.mean
        rhs = a @ self.weights
        intermediate = np.linalg.solve(self.posterior_cholesky, rhs.T)
        latent_mean = np.linalg.solve(self.posterior_cholesky.T, intermediate).T
        return latent_mean, self.posterior_covariance

    def decode(self, latent_mean):
        t = np.asarray(latent_mean, dtype=float)
        if (
            t.ndim != 2
            or t.shape[1] != self.weights.shape[1]
            or not np.isfinite(t).all()
        ):
            raise ValueError("Use finite query-by-latent-count coordinates")
        return t @ self.weights.T + self.mean

    def log_density(self, values):
        rows = np.asarray(values, dtype=float)
        latent_mean, _ = self.posterior(rows)
        residual = rows - self.decode(latent_mean)
        quadratic = np.sum(residual**2, axis=1) / self.noise_variance + np.sum(
            latent_mean**2, axis=1
        )
        d, k = self.weights.shape
        logdet = (d - k) * np.log(self.noise_variance) + 2 * np.log(
            np.diag(self.posterior_cholesky)
        ).sum()
        return -0.5 * (d * np.log(2 * np.pi) + logdet + quadratic)


def main():
    from sklearn.decomposition import FactorAnalysis, PCA

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    state = ProbabilisticPCA.fit(x, 1)
    ordinary_pca = PCA(n_components=2, svd_solver="full").fit(x)
    print("ml_eigenvalues", state.ml_eigenvalues)
    print(
        "ordinary_sample_to_ml_eigenvalues",
        ordinary_pca.explained_variance_ * (len(x) - 1) / len(x),
    )
    print("noise_variance", state.noise_variance)
    print("weights_covariance", state.weights @ state.weights.T)
    queries = np.array([[6, 4], [3, 2]], dtype=float)
    latent_mean, posterior_covariance = state.posterior(queries)
    print("latent_posterior_means", latent_mean)
    print("latent_posterior_covariance", posterior_covariance)
    print("posterior_decoded", state.decode(latent_mean))
    print("query_log_density", state.log_density(queries))
    covariance = state.weights @ state.weights.T + state.noise_variance * np.eye(2)
    full_cholesky = np.linalg.cholesky(covariance)
    whitened = np.linalg.solve(full_cholesky, (queries - state.mean).T)
    reference = -0.5 * (
        2 * np.log(2 * np.pi)
        + 2 * np.log(np.diag(full_cholesky)).sum()
        + np.sum(whitened**2, axis=0)
    )
    print(
        "full_covariance_log_density_equal",
        np.allclose(state.log_density(queries), reference),
    )
    ordinary_fa = FactorAnalysis(
        n_components=1, svd_method="lapack", tol=1e-7, max_iter=1000
    ).fit(x)
    print("factor_analysis_diagonal_noise", ordinary_fa.noise_variance_)
    print("factor_analysis_covariance", ordinary_fa.get_covariance())
    wide = ProbabilisticPCA.fit([[1, 0, 0, 0], [-1, 0, 0, 0]], 0)
    print(
        "n_less_than_d_zero_padded_ml_spectrum",
        wide.ml_eigenvalues,
        wide.noise_variance,
    )


if __name__ == "__main__":
    main()
