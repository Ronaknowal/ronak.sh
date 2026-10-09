"""N7: fit assignment, polarity and scale on calibration; never on test truth."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import linear_sum_assignment
from centered_pca import real_table
from population_whitening import frozen


def correlation(truth, estimates):
    t, e = real_table(truth), real_table(estimates)
    if t.shape != e.shape or len(t) < 2:
        raise ValueError("Equal calibration rows/counts and at least two rows are required")
    tc, ec = t - t.mean(0), e - e.mean(0)
    tn, en = np.linalg.norm(tc, axis=0), np.linalg.norm(ec, axis=0)
    if not np.isfinite(tn).all() or not np.isfinite(en).all() or np.any(tn == 0) or np.any(en == 0):
        raise ValueError("Correlation is undefined for zero/nonfinite variance")
    result = (tc / tn).T @ (ec / en)
    if not np.isfinite(result).all():
        raise ValueError("Correlation overflowed")
    return np.clip(result, -1., 1.)


def assignment(scores):
    c = real_table(scores)
    if c.shape[0] != c.shape[1]:
        raise ValueError("Expected an equal-count square correlation table")
    costs = -np.abs(c)
    rows, columns = linear_sum_assignment(costs)
    optimum = -costs[rows, columns].sum()
    unique = True
    # A distinct matching must omit an edge from this matching. Forbid each
    # selected edge in turn; this optional uniqueness diagnosis uses k solves.
    if len(c) > 1:
        for row, column in zip(rows, columns):
            alternative = costs.copy()
            alternative[row, column] = np.inf
            rr, cc = linear_sum_assignment(alternative)
            if np.isclose(-alternative[rr, cc].sum(), optimum, rtol=1e-10, atol=1e-12):
                unique = False
    return columns, bool(unique), float(optimum)


@dataclass(frozen=True)
class Alignment:
    columns: tuple
    estimate_mean: np.ndarray
    truth_mean: np.ndarray
    scale: np.ndarray
    calibration_correlations: np.ndarray
    assignment_unique: bool

    @classmethod
    def fit(cls, truth, estimates):
        t, e = real_table(truth), real_table(estimates)
        c = correlation(t, e)
        columns, unique, _ = assignment(c)
        ordered = e[:, columns]
        tm, em = t.mean(0), ordered.mean(0)
        tc, ec = t - tm, ordered - em
        scale = np.sum(tc * ec, axis=0) / np.sum(ec * ec, axis=0)
        return cls(tuple(map(int, columns)), frozen(em), frozen(tm), frozen(scale), frozen(c), unique)

    def transform(self, estimates):
        e = real_table(estimates, len(self.columns))
        aligned = (e[:, self.columns] - self.estimate_mean) * self.scale + self.truth_mean
        if not np.isfinite(aligned).all():
            raise ValueError("Alignment overflowed")
        return aligned


def evaluate(truth, aligned):
    t, e = real_table(truth), real_table(aligned)
    c = correlation(t, e)
    mse = np.mean((t - e)**2, axis=0)
    if not np.isfinite(mse).all():
        raise ValueError("Squared error overflowed")
    return {"signed_correlation": np.diag(c).tolist(), "mse_source_units_squared": mse.tolist()}


def main():
    print("assignment_counterexample", assignment([[.9, .8], [.85, .1]]))
    print("tie_assignment", assignment([[.5, .5], [.5, .5]]))
    truth = np.array([[-1., -1.], [-1., 1.], [1., -1.], [1., 1.]])
    estimates = np.column_stack([-2*truth[:, 1] + 3, .5*truth[:, 0] - 4])
    mapping = Alignment.fit(truth, estimates)
    heldout = np.array([[2., 3.], [-4., 1.]])
    query = np.column_stack([-2*heldout[:, 1] + 3, .5*heldout[:, 0] - 4])
    print("columns", mapping.columns, "calibration_scales", mapping.scale,
          "unchanged_test_mapping", mapping.transform(query), "test", evaluate(heldout, mapping.transform(query)))
    try:
        correlation(truth, np.ones_like(truth))
    except ValueError as error:
        print("refused", str(error))


if __name__ == "__main__":
    main()
