"""Depthwise spatial filtering followed by pointwise channel mixing, in NumPy.

Run: python separable-convolution.py (requires NumPy).
Arrays use float64 and NCHW order: batch, channel, height, width.
D[c, r, i, j] is spatial filter r for input channel c; P[o, c, r]
mixes the filtered channels into output o. This implements cross-correlation,
the operation PyTorch calls convolution: spatial kernels are not reversed.
The pointwise stage has output bias b[o]; the depthwise stage has no bias.
"""

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view


def _inputs(x, D, P, b, stride, dilation, padding):
    """Check the public shape contract; geometry is scalar and symmetric."""
    x, D, P, b = [np.asarray(a, dtype=np.float64) for a in (x, D, P, b)]
    if x.ndim != 4 or D.ndim != 4 or P.ndim != 3 or b.ndim != 1:
        raise ValueError("Expected x[N,C,H,W], D[C,m,kh,kw], P[O,C,m], b[O].")
    if any(size < 1 for a in (x, D, P, b) for size in a.shape):
        raise ValueError("Array dimensions must be nonzero.")
    if D.shape[0] != x.shape[1] or P.shape[1:] != D.shape[:2] or b.size != P.shape[0]:
        raise ValueError("Input channels, multiplier and output channels must agree.")
    for value, minimum in ((stride, 1), (dilation, 1), (padding, 0)):
        if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value < minimum:
            raise ValueError("Stride/dilation must be positive integers; padding nonnegative.")
    if not all(np.isfinite(a).all() for a in (x, D, P, b)):
        raise ValueError("Inputs and parameters must be finite.")
    return x, D, P, b


def forward(x, D, P, b, *, stride=1, dilation=1, padding=0):
    """Return output and saved forward state for backward.

    The padded input is allocated once; windows are a read-only strided view,
    not a copied im2col matrix. Parameter snapshots keep backward tied to this
    forward pass even if the caller later changes its parameter arrays.
    """
    x, D, P, b = _inputs(x, D, P, b, stride, dilation, padding)
    kh, kw = D.shape[-2:]
    eh, ew = dilation * (kh - 1) + 1, dilation * (kw - 1) + 1
    padded = np.pad(x, ((0, 0), (0, 0), (padding, padding), (padding, padding)))
    if eh > padded.shape[2] or ew > padded.shape[3]:
        raise ValueError("Effective spatial kernel must fit the padded input.")
    windows = sliding_window_view(padded, (eh, ew), axis=(2, 3))
    patches = windows[:, :, ::stride, ::stride, ::dilation, ::dilation]
    # Each channel has m spatial filters. Direct contraction avoids a packed im2col copy.
    filtered = np.einsum("nchwij,cmij->ncmhw", patches, D, optimize=False)
    # A 1x1 filter mixes channels at each location; it never moves across space.
    y = np.einsum("ncmhw,ocm->nohw", filtered, P, optimize=True)
    y += b[None, :, None, None]
    cache = (patches, filtered, D.copy(), P.copy(), x.shape, padded.shape, stride, dilation, padding)
    return y, cache


def backward(gradient, cache):
    """Propagate dL/dy; return dL/dx, dL/dD, dL/dP and dL/db.

    Each window contributes to its input positions. Overlapping contributions
    must be added, not assigned. The kernel loops below scatter complete batches
    at once; different positions within one kernel slice never overlap.
    """
    patches, filtered, D, P, shape, padded_shape, stride, dilation, padding = cache
    gradient = np.asarray(gradient, dtype=np.float64)
    n, _, _, h, w = filtered.shape
    if gradient.shape != (n, P.shape[0], h, w) or not np.isfinite(gradient).all():
        raise ValueError("Gradient must be finite and match the forward output shape.")
    db = gradient.sum(axis=(0, 2, 3))
    dP = np.einsum("nohw,ncmhw->ocm", gradient, filtered, optimize=True)
    dfiltered = np.einsum("nohw,ocm->ncmhw", gradient, P, optimize=True)
    dD = np.einsum("ncmhw,nchwij->cmij", dfiltered, patches, optimize=False)
    dx_padded = np.zeros(padded_shape, dtype=np.float64)
    for i in range(D.shape[2]):
        for j in range(D.shape[3]):
            contribution = np.einsum("ncmhw,cm->nchw", dfiltered, D[:, :, i, j], optimize=False)
            rows = slice(i * dilation, i * dilation + stride * h, stride)
            cols = slice(j * dilation, j * dilation + stride * w, stride)
            dx_padded[:, :, rows, cols] += contribution
    dx = dx_padded[:, :, padding:padding + shape[2], padding:padding + shape[3]]
    return dx, dD, dP, db


def main():
    """A hand-checkable first-output half-squared-error update."""
    x = np.array([[[[1., 2., 3.]], [[2., 0., 1.]]]])
    D = np.array([[[[1., -1.]]], [[[0.5, 1.]]]])
    P = np.array([[[2.], [-1.]]])
    b = np.zeros(1)
    target, rate = 1., 0.01
    y, cache = forward(x, D, P, b)
    gradient = np.zeros_like(y)
    gradient[0, 0, 0, 0] = y[0, 0, 0, 0] - target
    dx, dD, dP, db = backward(gradient, cache)
    # Compute every derivative first, then update from the same old parameters.
    next_D, next_P, next_b = D - rate * dD, P - rate * dP, b - rate * db
    fixed_bias, _ = forward(x, next_D, next_P, b)
    trained_bias, _ = forward(x, next_D, next_P, next_b)
    print("filtered:", cache[1].reshape(2, 2).tolist())
    print("output:", y.ravel().tolist())
    print("first-output loss:", 0.5 * (y[0, 0, 0, 0] - target) ** 2)
    print("dD:", dD.ravel().tolist(), "dP:", dP.ravel().tolist(), "db:", db.tolist())
    print("dx:", dx.reshape(2, 3).tolist())
    print("updated first output, fixed bias:", round(float(fixed_bias[0, 0, 0, 0]), 6))
    print("updated first output, trained bias:", round(float(trained_bias[0, 0, 0, 0]), 6))


if __name__ == "__main__":
    main()
