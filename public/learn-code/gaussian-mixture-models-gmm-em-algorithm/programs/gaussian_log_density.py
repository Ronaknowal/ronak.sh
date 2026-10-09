"""Prepare one SPD covariance, then evaluate batched Gaussian log densities."""
import numpy as np
from scipy.linalg import solve_triangular


def symmetric_part(matrix):
    """Average finite paired entries, preserving ordinary-case rounding."""
    with np.errstate(over="ignore"):
        average = (matrix + matrix.T) * 0.5
    overflow = ~np.isfinite(average)
    average[overflow] = matrix[overflow] * 0.5 + matrix.T[overflow] * 0.5
    return average


def symmetric_spd(matrix):
    matrix = np.asarray(matrix, dtype=np.float64)
    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1] or matrix.shape[0] == 0:
        raise ValueError("nonempty square covariance required")
    if not np.isfinite(matrix).all():
        raise ValueError("finite covariance required")
    scale = max(1.0, float(np.max(np.abs(matrix))))
    if np.max(np.abs(matrix - matrix.T)) > 1e-12 * scale:
        raise ValueError("asymmetric covariance")
    matrix = symmetric_part(matrix)
    try:
        factor = np.linalg.cholesky(matrix)
    except np.linalg.LinAlgError as error:
        raise ValueError("covariance must be positive definite") from error
    return matrix, factor


def query_rows(values, dimension):
    values = np.asarray(values, dtype=np.float64)
    if values.ndim == 1:
        values = values.reshape(1, -1)
    if values.ndim != 2 or values.shape[1] != dimension or not np.isfinite(values).all():
        raise ValueError("finite q-by-d query rows required")
    return values


class GaussianFactor:
    def __init__(self, mean, covariance):
        self.mean = np.asarray(mean, dtype=np.float64).copy()
        self.covariance, self.lower = symmetric_spd(covariance)
        if self.mean.shape != (self.lower.shape[0],) or not np.isfinite(self.mean).all():
            raise ValueError("finite d-vector mean required")
        self.dimension = len(self.mean)
        self.log_determinant = 2 * np.log(np.diag(self.lower)).sum()
        self.normalizer = self.dimension * np.log(2 * np.pi) + self.log_determinant

    def coordinates(self, values):
        rows = query_rows(values, self.dimension)
        return solve_triangular(self.lower, (rows - self.mean).T, lower=True).T

    def with_mean(self, mean):
        mean = np.asarray(mean, dtype=float)
        if mean.shape != self.mean.shape or not np.isfinite(mean).all():
            raise ValueError("finite compatible replacement mean required")
        updated = object.__new__(GaussianFactor)
        updated.mean = mean.copy()
        updated.covariance = self.covariance
        updated.lower = self.lower
        updated.dimension = self.dimension
        updated.log_determinant = self.log_determinant
        updated.normalizer = self.normalizer
        return updated

    def log_density(self, values):
        whitened = self.coordinates(values)
        answer = -0.5 * (self.normalizer + np.sum(whitened * whitened, axis=1))
        if not np.isfinite(answer).all():
            raise ArithmeticError("Gaussian log density exceeds representable range")
        return answer


def main():
    from scipy.stats import multivariate_normal
    matrix = np.array([[1, .75], [.75, 1]])
    rows = np.array([[1, 1], [1, -1], [0, 0]])
    factor = GaussianFactor([0, 0], matrix)
    print("lower factor", factor.lower.tolist())
    print("whitened coordinates", factor.coordinates(rows).tolist())
    print("log determinant", float(factor.log_determinant))
    print("scratch log densities", factor.log_density(rows).tolist())
    print("SciPy log densities", multivariate_normal.logpdf(rows, mean=[0, 0], cov=matrix).tolist())
    for name, invalid in [("singular", [[1, 1], [1, 1]]), ("asymmetric", [[1, .8], [.2, 1]])]:
        try:
            GaussianFactor([0, 0], invalid)
        except ValueError:
            print(name, "rejected")


if __name__ == "__main__":
    main()
