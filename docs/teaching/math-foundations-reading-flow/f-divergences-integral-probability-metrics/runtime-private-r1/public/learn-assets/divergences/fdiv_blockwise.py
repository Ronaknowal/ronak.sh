import math

import numpy as np
from scipy.spatial.distance import cdist


def kernel_sum(x, y, sigma, block_size=256, exclude_diagonal=False):
    """Accumulate positive block sums; diagonal exclusion is for the same sample."""
    def blocks():
        for i in range(0, len(x), block_size):
            for j in range(0, len(y), block_size):
                # Direct differences avoid cancellation in ||x||²+||y||²-2x.y.
                kernel = np.exp(-cdist(x[i:i+block_size], y[j:j+block_size], "sqeuclidean") / (2*sigma*sigma))
                if exclude_diagonal and i == j:
                    np.fill_diagonal(kernel, 0.)
                yield float(kernel.sum())
    return math.fsum(blocks())


def mmd2(x, y, sigma=1., block_size=256, unbiased=False):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if (x.ndim != 2 or y.ndim != 2 or x.shape[1] != y.shape[1]
            or min(len(x), len(y)) < (2 if unbiased else 1)
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not np.isfinite(sigma) or sigma <= 0
            or not isinstance(block_size, int) or block_size < 1):
        raise ValueError("Finite row samples with matching features, positive bandwidth and block size required")
    n, m = len(x), len(y)
    xx = kernel_sum(x, x, sigma, block_size, unbiased)
    yy = kernel_sum(y, y, sigma, block_size, unbiased)
    xy = kernel_sum(x, y, sigma, block_size)
    return xx / (n*(n-1) if unbiased else n*n) + yy / (m*(m-1) if unbiased else m*m) - 2*xy/(n*m)
