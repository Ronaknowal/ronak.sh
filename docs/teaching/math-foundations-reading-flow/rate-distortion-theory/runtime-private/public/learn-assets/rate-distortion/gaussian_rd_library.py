import math

import numpy as np
from scipy.optimize import brentq

from rd_scalar_helpers import allocate


def root_allocation(variances, budget):
    """Capped root on a unit-scaled variance axis for ordinary positive budgets."""
    v = np.asarray(variances, dtype=float)
    if v.ndim != 1 or v.size == 0 or not np.all(np.isfinite(v)) or np.any(v < 0):
        raise ValueError("Expected a nonempty vector of finite nonnegative variances.")
    if not math.isfinite(budget) or budget < 0:
        raise ValueError("Expected a finite nonnegative total budget.")
    total = math.fsum(v.tolist())
    if not math.isfinite(total):
        raise ValueError("Rescale to a finite total variance.")
    if budget == 0 or budget >= total:
        errors, rates = allocate(v.tolist(), budget)
        return np.array(errors), np.array(rates)
    scale = float(np.max(v))
    target = budget / scale
    if target < 1e-8:
        # An absolute root tolerance can consume a tiny budget; keep the exact
        # active-set algebra used by the scratch route instead.
        errors, rates = allocate(v.tolist(), budget)
        return np.array(errors), np.array(rates)
    scaled = v / scale
    theta = brentq(lambda t: float(np.minimum(scaled, t).sum()) - target,
                   0.0, 1.0, xtol=1e-14, rtol=1e-14)
    errors = scale * np.minimum(scaled, theta)
    rates = np.zeros_like(v)
    active = (errors > 0) & (errors < v)
    rates[active] = 0.5 * (np.log2(v[active]) - np.log2(errors[active]))
    rates[(errors == 0) & (v > 0)] = math.inf
    return errors, rates


def main():
    for variances, budget in [([9.0, 1.0], 3.0), ([4.0, 1.0], 1.5),
                              ([9.0, 0.0, 1.0], 3.0), ([9.0, 1.0], 1e-300)]:
        errors, rates = root_allocation(variances, budget)
        scratch_errors, scratch_rates = allocate(variances, budget)
        np.testing.assert_allclose(errors, scratch_errors, rtol=1e-12, atol=0)
        np.testing.assert_allclose(rates, scratch_rates, rtol=1e-12, atol=1e-12)
        print("variances / budget", variances, budget)
        print("errors / total bits", errors.tolist(), round(float(rates.sum()), 9))

    covariance = np.array([[5.0, 4.0], [4.0, 5.0]])
    eigenvalues, basis = np.linalg.eigh(covariance)  # Ascending values; columns are vectors.
    errors, rates = root_allocation(eigenvalues, 3.0)
    error_covariance = basis @ np.diag(errors) @ basis.T
    np.testing.assert_allclose(basis.T @ basis, np.eye(2), atol=1e-12)
    np.testing.assert_allclose(covariance @ basis, basis * eigenvalues, atol=1e-12)
    np.testing.assert_allclose(error_covariance, [[1.5, 0.5], [0.5, 1.5]], atol=1e-12)
    np.testing.assert_allclose(np.trace(error_covariance), 3, atol=1e-12)
    print("ascending eigenvalues / errors", eigenvalues.tolist(), errors.tolist())
    print("error covariance", np.round(error_covariance, 9).tolist())
    print("trace / total bits", round(float(np.trace(error_covariance)), 9),
          round(float(rates.sum()), 9))


if __name__ == "__main__":
    main()
