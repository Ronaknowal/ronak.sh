"""One finite weighted linear-regression update, manually and with PyTorch.

Run: python -B manual-gradient-accumulation.py
Requires NumPy and PyTorch. Does not fit, download, or write any files.
An optional bias is an explicitly supplied constant feature column in X.
"""
import numpy as np
import torch


def real_array(value, name, ndim, *, copy=False):
    raw = np.asarray(value)
    if raw.dtype.kind not in "fiu" or raw.ndim != ndim:
        raise ValueError(f"{name} must be a real {ndim}-dimensional numeric array")
    result = np.array(raw, dtype=np.float64, copy=True) if copy else np.asarray(raw, dtype=np.float64)
    # Bounded validation workspace, including noncontiguous supplied arrays.
    for block in np.nditer(result, flags=["external_loop", "buffered", "zerosize_ok"],
                           op_flags=["readonly"], buffersize=4096):
        if not np.isfinite(block).all():
            raise ValueError(f"{name} must be finite")
    return result


def group_inputs(X, y, mass, w, partitions):
    X, y = real_array(X, "X", 2), real_array(y, "y", 1)
    mass, w = real_array(mass, "mass", 1), real_array(w, "w", 1)
    n, features = X.shape
    if not n or not features or y.shape != (n,) or mass.shape != (n,) or w.shape != (features,):
        raise ValueError("X rows, y, mass and parameter dimensions must agree and be nonempty")
    if (mass < 0).any():
        raise ValueError("Supplied row masses must be nonnegative")
    groups = []
    for group in partitions:
        indices = np.asarray(group)
        if indices.ndim != 1 or not len(indices) or indices.dtype.kind not in "iu":
            raise ValueError("Each physical chunk must contain a nonempty integer index vector")
        if (indices < 0).any() or (indices >= n).any():
            raise ValueError("A physical index lies outside the effective group")
        groups.append(indices.astype(np.int64, copy=True))
    joined = np.concatenate(groups) if groups else np.empty(0, dtype=np.int64)
    if len(joined) != n or not np.array_equal(np.sort(joined), np.arange(n)):
        raise ValueError("Partitions must cover every effective-group row exactly once")
    with np.errstate(over="raise", invalid="raise"):
        D = float(mass.sum())
    if not np.isfinite(D) or D <= 0:
        raise ValueError("A weighted mean needs positive finite total mass")
    return X, y, mass, w, groups, D


def accumulate(X, y, mass, w, partitions, *, known_mass=True):
    """Numeric loop: O(features) persistent slots plus one chunk's workspace.

    Coverage validation uses O(rows) indices; the optional teaching trace returned
    here retains O(chunks * features + rows) entries in addition to those slots.

    Either add each numerator/D or add raw numerators and divide once at boundary.
    No caller array is mutated, including on validation or arithmetic failure.
    """
    X, y, mass, w, groups, D = group_inputs(X, y, mass, w, partitions)
    G = np.zeros_like(w)                     # survives every physical chunk
    loss_numerator = 0.0
    collected_mass = 0.0
    trace = []
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        for indices in groups:
            local_mass = mass[indices]
            positive = local_mass > 0
            # Zero-mass rows supply no objective term; do not evaluate an unused
            # overflowing prediction and then multiply that infinity by zero.
            active = indices[positive]
            features = X[active]
            residual = features @ w - y[active]
            raw_credit = (residual * mass[active]) @ features
            local_loss = float(np.dot(mass[active], 0.5 * residual ** 2))
            contribution = raw_credit / D if known_mass else raw_credit
            G += contribution
            local_D = float(local_mass.sum())
            collected_mass += local_D
            loss_numerator += local_loss
            trace.append({"indices": indices.tolist(), "raw_credit": raw_credit.copy(),
                          "mass": local_D, "G": G.copy()})
        if not known_mass:
            G /= collected_mass
        loss = loss_numerator / D
    if not np.isfinite(G).all() or not np.isfinite(loss):
        raise ValueError("Accumulated result is not finite")
    return {"gradient": G, "loss": loss, "mass": D, "trace": trace}


def momentum_step(w, gradient, old_buffer, *, rate=0.1, momentum=0.9):
    """PyTorch SGD subset: no decay, dampening, or Nesterov; returns new arrays.

    None means no supplied gradient: skip this parameter, preserving its memory.
    A zero vector is a supplied gradient: existing momentum may still move w.
    """
    w = real_array(w, "w", 1, copy=True)
    buffer = None if old_buffer is None else real_array(old_buffer, "old_buffer", 1, copy=True)
    if buffer is not None and buffer.shape != w.shape:
        raise ValueError("Momentum shape must match w")
    if isinstance(rate, (bool, complex)) or isinstance(momentum, (bool, complex)):
        raise ValueError("Rate and momentum must be real numbers")
    if not np.isfinite(rate) or rate < 0 or not np.isfinite(momentum) or not 0 <= momentum < 1:
        raise ValueError("Use finite rate >= 0 and 0 <= momentum < 1")
    if gradient is None:
        return w, buffer
    gradient = real_array(gradient, "gradient", 1)
    if gradient.shape != w.shape:
        raise ValueError("Gradient shape must match w")
    with np.errstate(over="raise", invalid="raise"):
        new_buffer = gradient.copy() if buffer is None else momentum * buffer + gradient
        new_w = w - rate * new_buffer
    if not np.isfinite(new_w).all() or not np.isfinite(new_buffer).all():
        raise ValueError("Updated state is not finite")
    return new_w, new_buffer if momentum else None


def pytorch_update(X, y, mass, w, partitions, old_buffer=None, *, rate=0.1, momentum=0.9):
    X, y, mass, w, groups, D = group_inputs(X, y, mass, w, partitions)
    old = None if old_buffer is None else real_array(old_buffer, "old_buffer", 1)
    if old is not None and old.shape != w.shape:
        raise ValueError("Momentum shape must match w")
    # Check the same finite-state contract before invoking the library optimizer.
    manual = accumulate(X, y, mass, w, groups)
    momentum_step(w, manual["gradient"], old, rate=rate, momentum=momentum)
    parameter = torch.nn.Parameter(torch.tensor(w, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=rate, momentum=momentum)
    if old is not None and momentum:
        optimizer.state[parameter]["momentum_buffer"] = torch.tensor(old, dtype=torch.float64)
    optimizer.zero_grad(set_to_none=True)
    for indices in groups:
        active = indices[mass[indices] > 0]
        features = torch.tensor(X[active], dtype=torch.float64)
        targets = torch.tensor(y[active], dtype=torch.float64)
        weights = torch.tensor(mass[active], dtype=torch.float64)
        residual = features @ parameter - targets
        ((weights * 0.5 * residual.square()).sum() / D).backward()
    gradient = parameter.grad.detach().numpy().copy()
    optimizer.step()
    new_buffer = optimizer.state[parameter].get("momentum_buffer")
    return gradient, parameter.detach().numpy().copy(), None if new_buffer is None else new_buffer.numpy().copy()


def main():
    cases = [
        ("worked scalar", [[1.], [2.], [3.]], [2., 0., 1.], [1., 1., 1.], [0.], None, [[0, 1], [2]]),
        ("off-quarter scalar", [[1.1], [-.3], [.125]], [.2, .7, -.4], [1., 1., 1.], [0.], None, [[0], [1, 2]]),
        ("off-quarter weighted", [[1.1], [-.3], [.125]], [.2, .7, -.4], [.3, .1, .7], [0.], None, [[0, 1], [2]]),
        ("fresh vector + explicit bias", [[2., -1., 1.], [-.5, 3., 1.], [1., .25, 1.], [4., 2., 1.]],
         [1., -2., .5, 3.], [1., 0., .5, 2.], [.2, -.1, .3], [.4, -.2, .1], [[1], [0, 2], [3]]),
    ]
    for name, X, y, mass, w, old, groups in cases:
        current = accumulate(X, y, mass, w, groups)
        late = accumulate(X, y, mass, w, groups, known_mass=False)
        reordered = accumulate(X, y, mass, w, [list(reversed(range(len(y))))])
        expected_w, expected_v = momentum_step(w, current["gradient"], old)
        gradient, new_w, new_v = pytorch_update(X, y, mass, w, groups, old)
        np.testing.assert_allclose(current["gradient"], late["gradient"], rtol=1e-12, atol=1e-12)
        np.testing.assert_allclose(current["gradient"], reordered["gradient"], rtol=1e-12, atol=1e-12)
        np.testing.assert_allclose(gradient, current["gradient"], rtol=1e-12, atol=1e-12)
        np.testing.assert_allclose(new_w, expected_w, rtol=1e-12, atol=1e-12)
        np.testing.assert_allclose(new_v, expected_v, rtol=1e-12, atol=1e-12)
        print(name, "mass", current["mass"], "gradient", current["gradient"], "new w", new_w)
    w, old = np.array([.2, -.3]), np.array([1., -2.])
    none_w, none_v = momentum_step(w, None, old)
    zero_w, zero_v = momentum_step(w, np.zeros(2), old)
    np.testing.assert_array_equal(none_w, w)
    np.testing.assert_array_equal(none_v, old)
    np.testing.assert_allclose(zero_w, w - .1 * .9 * old)
    print("None leaves w", none_w, "zero gradient moves w", zero_w)
    X = np.array([[1.], [2.], [3.]])
    saved = X.copy()
    bad_groups = [[[0], [1]], [[0, 1], [1, 2]], [[0, 1], [3]], [[0.5], [1, 2]]]
    failures = 0
    for groups in bad_groups:
        try:
            accumulate(X, [2., 0., 1.], [1., 1., 1.], [0.], groups)
        except (ValueError, FloatingPointError):
            failures += 1
    for mass in [[0., 0., 0.], [-1., 1., 1.], [np.inf, 1., 1.]]:
        try:
            accumulate(X, [2., 0., 1.], mass, [0.], [[0, 1, 2]])
        except (ValueError, FloatingPointError):
            failures += 1
    try:
        accumulate([[1e308]], [0.], [1.], [1e308], [[0]])
    except (ValueError, FloatingPointError):
        failures += 1
    assert failures == 8
    np.testing.assert_array_equal(X, saved)
    np.testing.assert_array_equal(w, [.2, -.3])
    np.testing.assert_array_equal(old, [1., -2.])
    print("rejected invalid or overflowing groups", failures, "caller arrays preserved")


if __name__ == "__main__":
    main()
