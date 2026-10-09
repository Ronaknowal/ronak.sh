"""Cached cyclic coordinate descent and immutable fitted NMF snapshots."""

from dataclasses import dataclass
import numpy as np

from nmf_arrays import (
    factor_shapes, feature_ids, frobenius_metrics, nonnegative_scalar, nonnegative_table,
    positive_integer, projected_gradient, read_only, reconstruction,
    require_finite, stable_norm,
)


def coordinate_block(x, w, h, sweeps=1, *, l1=0.0, l2=0.0):
    """Validated float64 arrays; change writable w in place, holding h fixed."""
    sweeps = positive_integer(sweeps, "sweeps")
    l1, l2 = nonnegative_scalar(l1, "l1"), nonnegative_scalar(l2, "l2")
    if any(not isinstance(a, np.ndarray) or a.dtype != np.float64 for a in (x, w, h)):
        raise ValueError("The in-place block requires float64 NumPy arrays")
    if not w.flags.writeable:
        raise ValueError("The updated factor must be writable")
    require_finite(x, "Observation")
    if (x < 0).any():
        raise ValueError("Observations must be nonnegative")
    factor_shapes(x, w, h)
    gram, cross = block_cache(x, h)
    return coordinate_sweeps(w, gram, cross, sweeps, l1, l2)


def block_cache(x, h):
    with np.errstate(over="ignore", invalid="ignore"):
        gram, cross = h @ h.T, x @ h.T
    require_finite(gram, "Gram product")
    require_finite(cross, "Cross product")
    return gram, cross


def coordinate_sweeps(w, gram, cross, sweeps, l1=0.0, l2=0.0):
    """Internal validated-cache kernel; each component sees fresh earlier columns."""
    for _ in range(sweeps):
        for c in range(gram.shape[0]):
            curvature = float(gram[c, c] + l2)
            require_finite(curvature, "Coordinate curvature")
            if curvature == 0:
                if np.any(cross[:, c] != 0) or np.any(gram[:, c] != 0):
                    raise ValueError("A flat coordinate has inconsistent cross products")
                w[:, c] = 0.0
                continue
            with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
                slope = w @ gram[:, c] - cross[:, c] + l1 + l2 * w[:, c]
                proposal = w[:, c] - slope / curvature
            require_finite(slope, "Coordinate slope")
            require_finite(proposal, "Coordinate update")
            w[:, c] = np.maximum(0.0, proposal)
    return w


def block_stationarity(x, w, h):
    gram, cross = block_cache(x, h)
    return cached_stationarity(w, gram, cross)


def cached_stationarity(w, gram, cross):
    with np.errstate(over="ignore", invalid="ignore"):
        gradient = w @ gram - cross
    return stable_norm(projected_gradient(w, gradient))


def joint_stationarity(x, w, h):
    with np.errstate(over="ignore"):
        result = np.hypot(block_stationarity(x, w, h), block_stationarity(x.T, h.T, w.T))
    return float(require_finite(result, "Joint stationarity"))


def stopping_threshold(tol, baseline):
    with np.errstate(over="ignore"):
        result = tol * np.float64(baseline)
    return float(require_finite(result, "Stopping threshold"))


def encode_coordinates(x, h, *, max_iter=1000, tol=1e-7, sweeps=1, initial=None):
    """Fixed-dictionary NNLS by the same cyclic operation used during fitting."""
    h = nonnegative_table(h, require_rows=True)
    x = nonnegative_table(x, h.shape[1])
    max_iter, sweeps = positive_integer(max_iter, "max_iter"), positive_integer(sweeps, "sweeps")
    tol = nonnegative_scalar(tol, "tol")
    shape = (x.shape[0], h.shape[0])
    w = np.zeros(shape) if initial is None else nonnegative_table(initial, h.shape[0])
    if w.shape != shape:
        raise ValueError("Initial amounts must have one row per query")
    if x.shape[0] == 0:
        return w, {"status": "empty-query", "iterations": 0, "projected_gradient": 0.0}
    gram, cross = block_cache(x, h)  # Fixed dictionary: retain this cache for every sweep.
    baseline = cached_stationarity(w, gram, cross)
    threshold = stopping_threshold(tol, baseline)
    current, iterations = baseline, 0
    for iterations in range(1, max_iter + 1):
        if current <= threshold:
            iterations -= 1
            break
        coordinate_sweeps(w, gram, cross, sweeps)
        current = cached_stationarity(w, gram, cross)
    status = "stationary-tolerance" if current <= threshold else "iteration-cap"
    return w, {"status": status, "iterations": iterations, "projected_gradient": current}


@dataclass(frozen=True)
class CoordinateState:
    h: np.ndarray
    features: tuple
    max_iter: int
    tol: float
    sweeps: int
    diagnostics: tuple
    status: str


class CoordinateNMF:
    def __init__(self, n_components, *, max_iter=1000, tol=1e-7, sweeps=1, random_state=0, block_rows=256):
        self.n_components = n_components
        self.max_iter, self.tol, self.sweeps = max_iter, tol, sweeps
        self.random_state, self.block_rows = random_state, block_rows
        self._state = None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit the dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().h.copy()

    @property
    def diagnostics_(self):
        return self._fitted().diagnostics

    @property
    def status_(self):
        return self._fitted().status

    def fit_transform(self, values, *, features=None, initial_w=None, initial_h=None):
        x = nonnegative_table(values, require_rows=True)
        k = positive_integer(self.n_components, "n_components")
        cap = positive_integer(self.max_iter, "max_iter")
        sweeps = positive_integer(self.sweeps, "sweeps")
        block_rows = positive_integer(self.block_rows, "block_rows")
        tol, names = nonnegative_scalar(self.tol, "tol"), feature_ids(features, x.shape[1])
        rng = np.random.default_rng(self.random_state)
        w = rng.uniform(0.1, 1.0, (x.shape[0], k)) if initial_w is None else nonnegative_table(initial_w, k)
        h = rng.uniform(0.1, 1.0, (k, x.shape[1])) if initial_h is None else nonnegative_table(initial_h, x.shape[1])
        if w.shape != (x.shape[0], k) or h.shape != (k, x.shape[1]):
            raise ValueError("Initial factors must match the fitting rows, rank and features")
        baseline = joint_stationarity(x, w, h)
        threshold = stopping_threshold(tol, baseline)
        loss = frobenius_metrics(x, w, h, block_rows).half_square
        history = [(0, loss, baseline)]
        current = baseline
        for iteration in range(1, cap + 1):
            if current <= threshold:
                break
            coordinate_block(x, w, h, sweeps)
            coordinate_block(x.T, h.T, w.T, sweeps)  # h uses the NEW w.
            current = joint_stationarity(x, w, h)
            loss = frobenius_metrics(x, w, h, block_rows).half_square
            history.append((iteration, loss, current))
        status = "stationary-tolerance" if current <= threshold else "iteration-cap"
        candidate = CoordinateState(read_only(h), names, cap, tol, sweeps, tuple(history), status)
        self._state = candidate  # The only publication point; failures above preserve old state.
        return w.copy()

    def transform(self, values, *, features=None, return_diagnostics=False):
        state = self._fitted()
        if features is not None and feature_ids(features, state.h.shape[1]) != state.features:
            raise ValueError("Query feature IDs/order differ from the fitted dictionary")
        w, diagnostic = encode_coordinates(values, state.h, max_iter=state.max_iter, tol=state.tol, sweeps=state.sweeps)
        return (w, diagnostic) if return_diagnostics else w

    def inverse_transform(self, values):
        state = self._fitted()
        w = nonnegative_table(values, state.h.shape[0])
        return reconstruction(w, state.h)


def main():
    from sklearn.decomposition import NMF

    np.set_printoptions(precision=8, suppress=True)
    x = np.array([[2, 1, 3], [1, 3, 4], [0, 2, 2]], dtype=float)
    h0, w0 = np.array([[1, 0, 1], [0, 1, 1]], dtype=float), np.ones((3, 2))
    w1, h1 = w0.copy(), h0.copy()
    coordinate_block(x, w1, h1)
    coordinate_block(x.T, h1.T, w1.T)
    print("one_sweep_w", w1)
    print("one_sweep_h", h1)
    print("one_sweep_half_loss", frobenius_metrics(x, w1, h1).half_square)
    scratch = CoordinateNMF(2, max_iter=2000, tol=1e-7)
    w = scratch.fit_transform(x, initial_w=w0, initial_h=h0)
    print("scratch_status", scratch.status_, "last_diagnostic", scratch.diagnostics_[-1])
    print("scratch_reconstruction", scratch.inverse_transform(w))
    ordinary = NMF(n_components=2, init="custom", solver="cd", beta_loss="frobenius",
                   alpha_W=0, alpha_H=0, shuffle=False, tol=1e-7, max_iter=2000, random_state=0)
    ordinary_w = ordinary.fit_transform(x, W=w0.copy(), H=h0.copy())
    ordinary_loss = frobenius_metrics(x, ordinary_w, ordinary.components_).half_square
    print("ordinary_half_loss", ordinary_loss, "ordinary_residual_norm", ordinary.reconstruction_err_)
    print("empty_query_shape", scratch.transform(np.empty((0, 3))).shape)


if __name__ == "__main__":
    main()
