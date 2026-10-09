"""Dimension-scaled elastic penalties and streamed weighted NMF coordinates."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, nonnegative_scalar,
    nonnegative_table, positive_integer, projected_gradient, read_only,
    reconstruction, require_finite, stable_norm,
)
from nmf_coordinate import block_cache, coordinate_block, coordinate_sweeps, stopping_threshold


@dataclass(frozen=True)
class Penalties:
    w_l1: float
    w_l2: float
    h_l1: float
    h_l2: float


def penalty_coefficients(alpha_w, alpha_h, l1_ratio, n, d):
    aw, ah = nonnegative_scalar(alpha_w, "alpha_w"), nonnegative_scalar(alpha_h, "alpha_h")
    r = nonnegative_scalar(l1_ratio, "l1_ratio")
    if r > 1:
        raise ValueError("l1_ratio must lie between zero and one")
    n, d = positive_integer(n, "n"), positive_integer(d, "d")
    with np.errstate(over="ignore", invalid="ignore"):
        values = np.array([aw * d * r, aw * d * (1-r), ah * n * r, ah * n * (1-r)])
    require_finite(values, "Dimension-scaled penalties")
    return Penalties(*map(float, values))


def observation_weights(values, shape):
    if values is None:
        return None
    weights = nonnegative_table(values, shape[1])
    if weights.shape != shape:
        raise ValueError("Observation weights must match every data cell")
    return weights


def local_weighted_cache(row, h, weights):
    """One row only: no cache array with shape n*k*k is constructed."""
    included = weights > 0
    roots = np.sqrt(weights[included])
    with np.errstate(over="ignore", invalid="ignore"):
        design = h[:, included] * roots
        target = row[included] * roots
        gram, cross = design @ design.T, design @ target
    require_finite(gram, "Weighted local Gram")
    require_finite(cross, "Weighted local cross product")
    return gram, cross


def weighted_coordinate_block(x, w, h, weights, sweeps, l1=0.0, l2=0.0):
    """Validated arrays: update rows in place with a fresh local cache per row."""
    if weights is None:
        return coordinate_block(x, w, h, sweeps, l1=l1, l2=l2)
    for i in range(x.shape[0]):
        if not np.any(weights[i] > 0):
            w[i] = 0.0  # Explicit minimum-norm convention for an unsupported row.
            continue
        gram, cross = local_weighted_cache(x[i], h, weights[i])
        coordinate_sweeps(w[i:i+1], gram, cross[None, :], sweeps, l1, l2)
    return w


def penalized_block_gradient(w, gram, cross, l1, l2):
    with np.errstate(over="ignore", invalid="ignore"):
        gradient = w @ gram - cross + l1 + l2 * w
    return require_finite(gradient, "Penalized block gradient")


def block_stationarity(x, w, h, weights, l1=0.0, l2=0.0):
    if weights is None:
        gram, cross = block_cache(x, h)
        return stable_norm(projected_gradient(w, penalized_block_gradient(w, gram, cross, l1, l2)))
    total = 0.0
    for i in range(x.shape[0]):
        gram, cross = local_weighted_cache(x[i], h, weights[i])
        gradient = penalized_block_gradient(w[i:i+1], gram, cross[None, :], l1, l2)
        total = np.hypot(total, stable_norm(projected_gradient(w[i:i+1], gradient)))
    return float(require_finite(total, "Weighted block stationarity"))


def joint_stationarity(x, w, h, weights, penalties):
    left = block_stationarity(x, w, h, weights, penalties.w_l1, penalties.w_l2)
    transposed = None if weights is None else weights.T
    right = block_stationarity(x.T, h.T, w.T, transposed, penalties.h_l1, penalties.h_l2)
    return float(require_finite(np.hypot(left, right), "Joint penalized stationarity"))


def factor_penalty(factor, l1, l2):
    with np.errstate(over="ignore", invalid="ignore"):
        linear = l1 * np.sum(factor) if l1 > 0 else 0.0
        square = .5 * l2 * np.sum(factor * factor) if l2 > 0 else 0.0
        total = linear + square
    return float(require_finite(total, "Factor penalty"))


def objective_terms(x, w, h, penalties, weights=None, block_rows=256):
    data = (frobenius_metrics(x, w, h, block_rows).half_square if weights is None
            else masked_data_cost(x, w, h, weights))
    wp = factor_penalty(w, penalties.w_l1, penalties.w_l2)
    hp = factor_penalty(h, penalties.h_l1, penalties.h_l2)
    total = float(require_finite(data + wp + hp, "Total objective"))
    return {"data": data, "w_penalty": wp, "h_penalty": hp, "total": total}


def masked_data_cost(x, w, h, weights):
    """Already validated arrays: accumulate only included cells, without mask copies."""
    total = 0.0
    for i in range(x.shape[0]):
        included = weights[i] > 0
        if not np.any(included):
            continue
        residual = x[i, included] - reconstruction(w[i:i+1], h[:, included])[0]
        with np.errstate(over="ignore", invalid="ignore"):
            scaled = residual * np.sqrt(weights[i, included])
            total += float(np.sum(scaled * scaled)) / 2
        require_finite(total, "Included weighted squared error")
    return total


def weighted_quality(x, w, h, weights):
    """Weighted MSE has denominator sum(weights); all-missing quality is undefined."""
    weights = observation_weights(weights, x.shape)
    if weights is None:
        raise ValueError("Supply explicit weights for weighted quality")
    with np.errstate(over="ignore"):
        denominator = float(np.sum(weights))
    require_finite(denominator, "Total observation weight")
    if denominator == 0:
        return None
    return float(require_finite(2 * masked_data_cost(x, w, h, weights) / denominator, "Weighted MSE"))


def encode_weighted(values, dictionary, *, weights=None, l1=0.0, l2=0.0,
                    max_iter=1000, tol=1e-7, sweeps=1, initial=None):
    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    mask = observation_weights(weights, x.shape)
    l1, l2 = nonnegative_scalar(l1, "l1"), nonnegative_scalar(l2, "l2")
    cap, sweeps = positive_integer(max_iter, "max_iter"), positive_integer(sweeps, "sweeps")
    tol = nonnegative_scalar(tol, "tol")
    shape = (x.shape[0], h.shape[0])
    w = np.zeros(shape) if initial is None else nonnegative_table(initial, h.shape[0])
    if w.shape != shape:
        raise ValueError("Initial amounts must match query rows and dictionary components")
    if x.shape[0] == 0:
        return w, {"status": "empty-query", "iterations": 0, "projected_gradient": 0.0}
    if mask is not None:
        w[~np.any(mask > 0, axis=1)] = 0.0
    iterations, current, complete = 0, 0.0, True
    # Unweighted rows share one Gram/cross cache; weighted rows retain one cache
    # for all their inner sweeps, then release it before moving to the next row.
    groups = [(w, *block_cache(x, h))] if mask is None else (
        (w[i:i+1], *local_weighted_cache(x[i], h, mask[i])) for i in range(x.shape[0])
    )
    for amounts, gram, cross in groups:
        cross = cross[None, :] if cross.ndim == 1 else cross
        gradient = penalized_block_gradient(amounts, gram, cross, l1, l2)
        row_norm = stable_norm(projected_gradient(amounts, gradient))
        threshold, count = stopping_threshold(tol, row_norm), 0
        for _ in range(cap):
            if row_norm <= threshold:
                break
            coordinate_sweeps(amounts, gram, cross, sweeps, l1, l2)
            count += 1
            gradient = penalized_block_gradient(amounts, gram, cross, l1, l2)
            row_norm = stable_norm(projected_gradient(amounts, gradient))
        complete = complete and row_norm <= threshold
        iterations, current = max(iterations, count), float(np.hypot(current, row_norm))
    require_finite(current, "Query stationarity")
    status = "stationary-tolerance" if complete else "iteration-cap"
    return w, {"status": status, "iterations": iterations, "projected_gradient": current}


def weighted_nnls_reference(values, dictionary, weights, *, l2=0.0, max_iter=1000):
    """Public NNLS reference for fixed H and optional L2; no fictitious L1 API."""
    from scipy.optimize import nnls

    h = nonnegative_table(dictionary, require_rows=True)
    x = nonnegative_table(values, h.shape[1])
    mask = observation_weights(weights, x.shape)
    if mask is None:
        raise ValueError("Supply explicit observation weights")
    l2, cap = nonnegative_scalar(l2, "l2"), positive_integer(max_iter, "max_iter")
    w = np.zeros((x.shape[0], h.shape[0]))
    for i in range(x.shape[0]):
        included = mask[i] > 0
        if not np.any(included):
            continue
        roots = np.sqrt(mask[i, included])
        with np.errstate(over="ignore", invalid="ignore"):
            design, target = h[:, included].T * roots[:, None], x[i, included] * roots
        require_finite(design, "NNLS weighted design")
        require_finite(target, "NNLS weighted target")
        if l2 > 0:
            design = np.vstack((design, np.sqrt(l2) * np.eye(h.shape[0])))
            target = np.concatenate((target, np.zeros(h.shape[0])))
        w[i], _ = nnls(design, target, maxiter=cap)
    return require_finite(w, "NNLS amounts")


@dataclass(frozen=True)
class WeightedState:
    h: np.ndarray
    features: tuple
    penalties: Penalties
    observed_columns: tuple
    max_iter: int
    tol: float
    sweeps: int
    diagnostics: tuple
    status: str


class PenalizedMaskedNMF:
    def __init__(self, n_components, *, alpha_w=0.0, alpha_h=0.0, l1_ratio=0.0,
                 max_iter=1000, tol=1e-7, sweeps=1, random_state=0, block_rows=256):
        self.n_components, self.alpha_w, self.alpha_h = n_components, alpha_w, alpha_h
        self.l1_ratio, self.max_iter, self.tol, self.sweeps = l1_ratio, max_iter, tol, sweeps
        self.random_state, self.block_rows, self._state = random_state, block_rows, None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit a dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().h.copy()

    @property
    def diagnostics_(self):
        return self._fitted().diagnostics

    @property
    def observed_columns_(self):
        return self._fitted().observed_columns

    @property
    def status_(self):
        return self._fitted().status

    def fit_transform(self, values, *, weights=None, features=None, initial_w=None, initial_h=None):
        x = nonnegative_table(values, require_rows=True)
        mask = observation_weights(weights, x.shape)
        k = positive_integer(self.n_components, "n_components")
        cap, sweeps = positive_integer(self.max_iter, "max_iter"), positive_integer(self.sweeps, "sweeps")
        block_rows, tol = positive_integer(self.block_rows, "block_rows"), nonnegative_scalar(self.tol, "tol")
        names = feature_ids(features, x.shape[1])
        penalties = penalty_coefficients(self.alpha_w, self.alpha_h, self.l1_ratio, *x.shape)
        rng = np.random.default_rng(self.random_state)
        w = rng.uniform(.1, 1., (x.shape[0], k)) if initial_w is None else nonnegative_table(initial_w, k)
        h = rng.uniform(.1, 1., (k, x.shape[1])) if initial_h is None else nonnegative_table(initial_h, x.shape[1])
        factor_shapes(x, w, h)
        if w.shape[1] != k:
            raise ValueError("Initial factors must match n_components")
        observed = np.ones(x.shape[1], dtype=bool) if mask is None else np.any(mask > 0, axis=0)
        if mask is not None:
            w[~np.any(mask > 0, axis=1)] = 0.0
            h[:, ~observed] = 0.0
        current = joint_stationarity(x, w, h, mask, penalties)
        threshold = stopping_threshold(tol, current)
        terms = objective_terms(x, w, h, penalties, mask, block_rows)
        history = [(0, terms['data'], terms['w_penalty'], terms['h_penalty'], terms['total'], current)]
        for iteration in range(1, cap + 1):
            if current <= threshold:
                break
            weighted_coordinate_block(x, w, h, mask, sweeps, penalties.w_l1, penalties.w_l2)
            weighted_coordinate_block(x.T, h.T, w.T, None if mask is None else mask.T,
                                      sweeps, penalties.h_l1, penalties.h_l2)
            current = joint_stationarity(x, w, h, mask, penalties)
            terms = objective_terms(x, w, h, penalties, mask, block_rows)
            history.append((iteration, terms['data'], terms['w_penalty'], terms['h_penalty'], terms['total'], current))
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        candidate = WeightedState(read_only(h), names, penalties, tuple(map(bool, observed)),
                                  cap, tol, sweeps, tuple(history), status)
        self._state = candidate  # Only publication point: failed candidate preserves old state.
        return w.copy()

    def transform(self, values, *, weights=None, features=None, initial=None, return_diagnostics=False):
        state = self._fitted()
        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:
            raise ValueError("Query feature order differs from the fitted dictionary")
        result = encode_weighted(values, state.h, weights=weights, l1=state.penalties.w_l1,
                                 l2=state.penalties.w_l2, max_iter=state.max_iter,
                                 tol=state.tol, sweeps=state.sweeps, initial=initial)
        return result if return_diagnostics else result[0]

    def inverse_transform(self, values):
        state = self._fitted()
        return reconstruction(nonnegative_table(values, state.h.shape[0]), state.h)


def main():
    from sklearn.decomposition import NMF

    x = np.array([[2., 1., 3.], [1., 3., 4.], [.5, 2., 2.5]])
    w0, h0 = np.ones((3, 2)), np.array([[1., 0., 1.], [0., 1., 1.]])
    scratch = PenalizedMaskedNMF(2, alpha_w=.03, alpha_h=.04, l1_ratio=.4, max_iter=500, tol=1e-8)
    w = scratch.fit_transform(x, initial_w=w0, initial_h=h0)
    penalties = penalty_coefficients(.03, .04, .4, *x.shape)
    print("penalized_scratch", scratch.status_, scratch.diagnostics_[-1])
    ordinary = NMF(n_components=2, init='custom', solver='cd', beta_loss='frobenius',
                   alpha_W=.03, alpha_H=.04, l1_ratio=.4, max_iter=500, tol=1e-8,
                   shuffle=False, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
    print("penalized_ordinary_terms", objective_terms(x, ordinary_w, ordinary.components_, penalties))
    weights = np.array([[1., 1., 0.], [1., .5, 1.], [0., 0., 0.]])
    masked = PenalizedMaskedNMF(2, alpha_w=.01, alpha_h=.02, l1_ratio=0, max_iter=500, tol=1e-8)
    masked_w = masked.fit_transform(x, weights=weights, initial_w=w0, initial_h=h0)
    print("masked_fit", masked.status_, masked.diagnostics_[-1], "unsupported_row", masked_w[2].tolist())
    query, query_weights = x[:1], np.array([[1., 0., .25]])
    amounts, diagnostic = encode_weighted(query, h0, weights=query_weights, l2=.2, tol=1e-10)
    reference = weighted_nnls_reference(query, h0, query_weights, l2=.2)
    print("weighted_l2_amounts", amounts.tolist(), "nnls", reference.tolist(), diagnostic)
    print("missing_quality", weighted_quality(x[2:3], masked_w[2:3], masked.components_, weights[2:3]))
    old_h = masked.components_
    masked.n_components = 1
    try:
        masked.fit_transform([[-1., 0., 1.]])
    except ValueError as error:
        print("rejected_fit", type(error).__name__, "old_dictionary_equal", np.array_equal(old_h, masked.components_))
    print("empty_query_shape", masked.transform(np.empty((0, 3))).shape)


if __name__ == '__main__':
    main()
