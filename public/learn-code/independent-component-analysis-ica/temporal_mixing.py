"""N11: an analytic lag mechanism and a separate new empirical single-lag route."""
import numpy as np
from centered_pca import real_table
from population_whitening import PopulationWhitening
from align_and_evaluate import Alignment, evaluate


def ar1(seed, coefficient, length=4000, burn=1000):
    if not np.isfinite(coefficient) or abs(coefficient) >= 1:
        raise ValueError("A stationary AR(1) needs |coefficient|<1")
    innovations = np.random.default_rng(seed).normal(0., np.sqrt(1-coefficient**2), length+burn)
    values = np.empty(len(innovations))
    previous = 0.
    for i, innovation in enumerate(innovations):
        previous = coefficient*previous + innovation
        values[i] = previous
    return values[burn:]


def symmetric_lag_covariance(z, lag):
    table = real_table(z)
    if isinstance(lag, bool) or not isinstance(lag, (int, np.integer)) or not 1 <= lag < len(table):
        raise ValueError("Expected a positive lag below the training row count")
    centered = table-table.mean(0)  # One training mean; do not center each paired subset.
    cov = centered[lag:].T @ centered[:-lag] / (len(table)-lag)
    if not np.isfinite(cov).all():
        raise ValueError("Lag product overflowed")
    return (cov+cov.T)/2


def joint_offdiagonal_objective(covariances, angle):
    theta = np.deg2rad(angle)
    rotation = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
    transformed = [rotation.T @ real_table(c, 2) @ rotation for c in covariances]
    return float(sum(np.sum((c-np.diag(np.diag(c)))**2) for c in transformed))


def filter_same(values):
    x = real_table(values)
    return (x[1:]+x[:-1])/2  # Identical support trim for every column.


def delayed(values, lag):
    x = np.asarray(values, float)
    if x.ndim != 1 or not np.isfinite(x).all() or isinstance(lag, bool) or not isinstance(lag, (int, np.integer)) or lag < 0:
        raise ValueError("Expected finite vector and nonnegative integer delay")
    out = np.zeros_like(x)
    if lag == 0:
        out[:] = x
    elif lag < len(x):
        out[lag:] = x[:-lag]
    return out


def main():
    q = np.array([[1., -1.], [1., 1.]])/np.sqrt(2)
    analytic = [q @ np.diag([.8, .2]) @ q.T, q @ np.diag([.64, .04]) @ q.T]
    print("analytic_mixed_lags", analytic, "tie", .4*np.eye(2))
    print("two_lag_equal_weight_objective", [(a, joint_offdiagonal_objective(analytic, a)) for a in [0., 30., 45., 60., 90.]])
    s = np.column_stack([ar1(31, .8), ar1(37, .2)])
    a = np.array([[1., .5], [-.25, 2.]])
    x = s@a.T+[3., -2.]
    white = PopulationWhitening.fit(x[:2400], 2)
    lag = symmetric_lag_covariance(white.transform(x[:2400]), 1)
    eig, directions = np.linalg.eigh(lag)
    gap = eig[-1]-eig[0]
    print("empirical_training_lag", lag, "eigenvalues", eig, "gap", gap)
    if gap <= 100*np.finfo(float).eps*max(1., np.linalg.norm(lag, 2)):
        print("unresolved_equal_lag_spectrum")
    else:
        estimates = white.transform(x)@directions
        mapping = Alignment.fit(s[2400:3200], estimates[2400:3200])
        print("single_lag_calibration_columns", mapping.columns,
              "test", evaluate(s[3200:], mapping.transform(estimates[3200:])))
    print("common_filter_commutes", np.allclose(filter_same(s@a.T), filter_same(s)@a.T))
    impulses = np.zeros((6, 2)); impulses[0, 0]=1.; impulses[1, 1]=1.
    for delay in [1, 0, 2]:
        first = impulses[:, 0]+.5*delayed(impulses[:, 1], delay)
        second = impulses[:, 1]-.25*delayed(impulses[:, 0], 2)
        print("delay_x1_only", delay, "x1", first, "x2_persistent_delay_two", second)
    print("underdetermined_equal_observations", np.array([[1., 0., 1.], [0., 1., 1.]])@np.array([1., 1., 0.]),
          np.array([[1., 0., 1.], [0., 1., 1.]])@np.array([0., 0., 1.]))
    baseline = np.array([0., -.5, 0., -.5])
    condition_vectors = np.array([[1., -.5, 0., -.5], [0., -.5, 1., -.5], [0., -1., 0., -.5], [0., -.5, 0., -1.]])
    differences = condition_vectors-baseline
    print("auxiliary_natural_parameter_differences", differences, "rank", np.linalg.matrix_rank(differences))


if __name__ == "__main__":
    main()
