"""First-common-join distances, then explicit Pearson operands."""
from math import sqrt
import numpy as np
from scipy.spatial.distance import pdist
from scipy.cluster.hierarchy import linkage, cophenet


def joined_distances(linkage_rows, n):
    z = np.asarray(linkage_rows, dtype=float)
    if not isinstance(n, int) or n < 2 or z.shape != (n - 1, 4) or not np.isfinite(z).all():
        raise ValueError("Use n-1 finite linkage rows [left,right,height,count].")
    active = {i: [i] for i in range(n)}
    joined = np.zeros((n, n))
    for row, (left, right, height, count) in enumerate(z):
        if left != int(left) or right != int(right) or height < 0:
            raise ValueError("Invalid node ID or negative join height.")
        left, right = int(left), int(right)
        if left == right or left not in active or right not in active:
            raise ValueError("Each merge must consume two currently active nodes.")
        first, second = active.pop(left), active.pop(right)
        if count != len(first) + len(second):
            raise ValueError("Linkage count disagrees with descendant IDs.")
        for i in first:
            for j in second:
                joined[i, j] = joined[j, i] = height
        active[n + row] = first + second
    return np.array([joined[i, j] for i in range(n) for j in range(i + 1, n)])


def pearson(first, second):
    a, b = np.asarray(first, dtype=float), np.asarray(second, dtype=float)
    if a.ndim != 1 or b.shape != a.shape or len(a) < 2 or not np.isfinite(a).all() or not np.isfinite(b).all():
        raise ValueError("Use two aligned finite vectors with at least two pairs.")
    a, b = a - a.mean(), b - b.mean()
    norm_product = float(np.linalg.norm(a) * np.linalg.norm(b))
    return float(a @ b) / norm_product if norm_product > 0 else None


if __name__ == "__main__":
    x = np.array([0, 1, 3.0])[:, None]
    original = pdist(x)
    z = linkage(original, method="single")
    joined = joined_distances(z, len(x))
    correlation = pearson(original, joined)
    ordinary_correlation, ordinary_joined = cophenet(z, original)
    print("Linkage", z.tolist())
    print("Original AB/AC/BC", original.tolist())
    print("First-join AB/AC/BC", joined.tolist())
    print("Correlation", correlation)
    assert np.allclose(joined, ordinary_joined)
    assert np.isclose(correlation, ordinary_correlation) and np.isclose(correlation, sqrt(3) / 2)
    print("Constant vector", pearson([1, 1, 1], [1, 2, 2]))
    print("ordinary condensed-distance correspondence: passed")
