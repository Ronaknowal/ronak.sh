"""Invariant contributions, unit-mass patterns and explicit alignment ambiguity."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import linear_sum_assignment

from nmf_arrays import nonnegative_scalar, nonnegative_table, reconstruction, require_finite


def matching_factors(amounts, dictionary):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table(amounts, h.shape[0])
    return w, h


def component_index(value, count):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)):
        raise ValueError("Component index must be an integer")
    value = int(value)
    if value < 0 or value >= count:
        raise ValueError("Component index is outside this dictionary")
    return value


def normalize_patterns(amounts, dictionary):
    """Compensate W columns while normalizing positive H row sums; zero is unused."""
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        masses = h.sum(axis=1)
    require_finite(masses, "Pattern masses")
    usable = masses > 0
    normalized = np.zeros_like(h)
    normalized[usable] = h[usable] / masses[usable, None]
    with np.errstate(over='ignore', invalid='ignore'):
        compensated = w * masses
    require_finite(compensated, "Compensated amounts")
    return compensated, normalized, masses, usable


def contribution_totals(amounts, dictionary):
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        result = w * h.sum(axis=1)
    return require_finite(result, "Component contribution totals")


def row_contribution(amount_row, dictionary, component):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    with np.errstate(over='ignore', invalid='ignore'):
        result = w[0, c] * h[c]
    return require_finite(result, "Selected contribution")


def change_component_gain(amount_row, dictionary, component, gain):
    """Change only one saved amount; no fit or re-encoding occurs."""
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    gain = nonnegative_scalar(gain, "gain")
    with np.errstate(over='ignore', invalid='ignore'):
        w[0, c] *= gain
    require_finite(w, "Edited amounts")
    return reconstruction(w, h)[0]


@dataclass(frozen=True)
class Alignment:
    pairs: tuple
    cost: float
    unmatched_left: tuple
    unmatched_right: tuple
    unused_left: tuple
    unused_right: tuple
    ambiguity: str
    alternative_pairs: tuple


def align_patterns(left, right, *, audit_ambiguity=True, tolerance=1e-12, audit_limit=64):
    """Display correspondence of positive unit-mass rows, not source recovery.

    Core matching is one assignment. Optional bounded global-tie audit adds at
    most min(k_left,k_right) assignments by forbidding each selected edge.
    """
    a = nonnegative_table(left, require_rows=True)
    b = nonnegative_table(right, a.shape[1], require_rows=True)
    tolerance = nonnegative_scalar(tolerance, "tolerance")
    if not isinstance(audit_ambiguity, (bool, np.bool_)):
        raise ValueError("audit_ambiguity must be boolean")
    if isinstance(audit_limit, (bool, np.bool_)) or not isinstance(audit_limit, (int, np.integer)) or audit_limit < 1:
        raise ValueError("audit_limit must be a positive integer")
    with np.errstate(over='ignore', invalid='ignore'):
        ma, mb = a.sum(axis=1), b.sum(axis=1)
    require_finite(ma, "Left pattern masses")
    require_finite(mb, "Right pattern masses")
    ia, ib = np.flatnonzero(ma > 0), np.flatnonzero(mb > 0)
    unused_a, unused_b = tuple(np.flatnonzero(ma == 0).tolist()), tuple(np.flatnonzero(mb == 0).tolist())
    if len(ia) == 0 or len(ib) == 0:
        return Alignment((), 0.0, tuple(ia.tolist()), tuple(ib.tolist()), unused_a, unused_b,
                         'no-usable-pair', ())
    aa, bb = a[ia] / ma[ia, None], b[ib] / mb[ib, None]
    costs = np.empty((len(ia), len(ib)))
    for i, row in enumerate(aa):
        # Avoid a k_left*k_right*d difference tensor.
        costs[i] = np.sum((bb - row) ** 2, axis=1)
    require_finite(costs, "Alignment costs")
    rows, columns = linear_sum_assignment(costs)
    total = float(costs[rows, columns].sum())
    threshold = tolerance * max(1.0, abs(total))
    require_finite(threshold, "Alignment tolerance")
    pairs = tuple((int(ia[r]), int(ib[c])) for r, c in zip(rows, columns))
    status, alternative = 'not-audited', ()
    if audit_ambiguity and max(costs.shape) <= audit_limit:
        status = 'no-alternative-within-tolerance'
        for row, column in zip(rows, columns):
            forbidden = costs.copy()
            forbidden[row, column] = np.inf
            try:
                other_rows, other_columns = linear_sum_assignment(forbidden)
            except ValueError:  # This forbidden edge made a full-size matching infeasible.
                continue
            other_total = float(costs[other_rows, other_columns].sum())
            if other_total <= total + threshold:
                status = 'alternative-within-tolerance'
                alternative = tuple((int(ia[r]), int(ib[c])) for r, c in zip(other_rows, other_columns))
                break
    elif audit_ambiguity:
        status = 'not-audited-over-limit'
    return Alignment(pairs, total, tuple(sorted(set(ia.tolist()) - set(ia[rows].tolist()))),
                     tuple(sorted(set(ib.tolist()) - set(ib[columns].tolist()))),
                     unused_a, unused_b, status, alternative)


def main():
    h = np.array([[1.,0.,1.], [0.,1.,1.], [0.,0.,0.]])
    w = np.array([[2.,1.,7.], [1.,3.,2.]])
    compensated, normalized, masses, usable = normalize_patterns(w,h)
    print('masses',masses.tolist(),'usable',usable.tolist())
    print('normalized',normalized.tolist(),'compensated',compensated.tolist())
    print('reconstruction_preserved',np.allclose(reconstruction(w,h),reconstruction(compensated,normalized)))
    right = np.array([[0.,3.,3.], [2.,0.,2.], [0.,0.,0.]])
    print('permuted_rescaled_alignment',align_patterns(h,right))
    duplicate = np.array([[1.,0.], [1.,0.]])
    print('duplicate_ambiguity',align_patterns(duplicate,duplicate))
    print('contributions',contribution_totals(w,h).tolist())
    print('C0_removed',change_component_gain(w[0],h,0,0).tolist())


if __name__ == '__main__':
    main()
