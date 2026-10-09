"""Pure array operations shared by the clustering teaching programs.

Importing this module performs no fit, file operation or demonstration. Distances
use direct coordinate differences, not a cancellation-prone norm/dot expansion.
"""
import numpy as np


def points_array(values):
    """Return a finite, nonempty row-by-feature float64 matrix."""
    points = np.asarray(values, dtype=np.float64)
    if points.ndim != 2 or 0 in points.shape or not np.isfinite(points).all():
        raise ValueError("Use a nonempty finite row-by-feature matrix.")
    return points


def weights_array(values, n):
    weights = np.ones(n) if values is None else np.asarray(values, dtype=float)
    if weights.shape != (n,) or not np.isfinite(weights).all() or (weights < 0).any():
        raise ValueError("Supply one finite nonnegative weight per row.")
    mass = weights.sum()
    if not np.isfinite(mass) or mass <= 0:
        raise ValueError("Total row mass must be positive and representable.")
    return weights


def squared_to_center(points, center):
    """One B-by-d difference workspace, reduced to B squared lengths."""
    with np.errstate(over="raise", invalid="raise"):
        try:
            differences = points - center
            np.square(differences, out=differences)
            return differences.sum(axis=1)
        except FloatingPointError as error:
            raise ValueError("Squared distances exceed float64 range; rescale coordinates.") from error


def assign_chunked(points, centers, block_size=256):
    """Nearest labels and squared lengths; exact ties keep the lower center ID.

    Process B rows and one center at a time. No n-by-k distance matrix is stored.
    Persistent outputs are n labels and n minima. Temporary array size is O(Bd+B).
    """
    points = points_array(points)
    centers = points_array(centers)
    if points.shape[1] != centers.shape[1]:
        raise ValueError("Rows and centers must have the same feature dimension.")
    if not isinstance(block_size, (int, np.integer)) or block_size <= 0:
        raise ValueError("block_size must be a positive integer.")
    labels = np.empty(len(points), dtype=np.int64)
    distances = np.empty(len(points), dtype=float)
    for start in range(0, len(points), block_size):
        stop = min(start + block_size, len(points))
        block = points[start:stop]
        best = squared_to_center(block, centers[0])
        chosen = np.zeros(len(block), dtype=np.int64)
        for center_id in range(1, len(centers)):
            candidate = squared_to_center(block, centers[center_id])
            improve = candidate < best
            best[improve] = candidate[improve]
            chosen[improve] = center_id
        labels[start:stop] = chosen
        distances[start:stop] = best
    return labels, distances


def weighted_centers(points, labels, weights, previous, block_size=256):
    """Blockwise shifted means; zero-mass groups retain the previous center.

    An anchor row avoids summing large absolute coordinates. Dividing each
    contribution by total group mass avoids a potentially overflowing sum w*x.
    """
    result = previous.copy()
    masses = np.zeros(len(previous))
    anchors = previous.copy()
    initialized = np.zeros(len(previous), dtype=bool)
    offsets = np.zeros_like(previous)
    for start in range(0, len(points), block_size):
        stop = min(start + block_size, len(points))
        local_labels = labels[start:stop]
        local_weights = weights[start:stop]
        masses += np.bincount(local_labels, weights=local_weights, minlength=len(previous))
        for group in np.unique(local_labels):
            members = (local_labels == group) & (local_weights > 0)
            if members.any() and not initialized[group]:
                anchors[group] = points[start:stop][members][0]
                initialized[group] = True
    for start in range(0, len(points), block_size):
        stop = min(start + block_size, len(points))
        for group in np.unique(labels[start:stop]):
            members = (labels[start:stop] == group) & (weights[start:stop] > 0)
            if not members.any():
                continue
            with np.errstate(over="raise", invalid="raise"):
                try:
                    contribution = points[start:stop][members] - anchors[group]
                    contribution *= (weights[start:stop][members] / masses[group])[:, None]
                    offsets[group] += contribution.sum(axis=0)
                except FloatingPointError as error:
                    raise ValueError("Weighted mean exceeds float64 range; rescale input.") from error
    occupied = masses > 0
    result[occupied] = anchors[occupied] + offsets[occupied]
    if not np.isfinite(result).all():
        raise ValueError("Weighted center is not representable; rescale input.")
    return result, masses


def weighted_objective(weights, distances):
    with np.errstate(over="raise", invalid="raise"):
        try:
            return float(np.dot(weights, distances))
        except FloatingPointError as error:
            raise ValueError("Weighted objective exceeds float64 range.") from error


def weighted_d2(points, weights, k, seed):
    """Vanilla mass-weighted first draw and mass-times-D² later draws.

    A zero potential means all positive-mass rows are already represented. To
    return exactly k centers, append the lowest unused row ID, even a zero-mass
    row; this is a declared shape fallback, not a probability draw.
    """
    if not isinstance(k, (int, np.integer)) or not 1 <= k <= len(points):
        raise ValueError("k must be an integer between one and the row count.")
    rng = np.random.default_rng(seed)
    first = int(rng.choice(len(points), p=weights / weights.sum()))
    chosen = [first]
    _, nearest = assign_chunked(points, points[[first]])
    while len(chosen) < k:
        potential = weights * nearest
        total = potential.sum()
        if not np.isfinite(total):
            raise ValueError("Seeding potential exceeds float64 range.")
        if total == 0:
            row_id = next(i for i in range(len(points)) if i not in chosen)
        else:
            row_id = int(rng.choice(len(points), p=potential / total))
        chosen.append(row_id)
        _, candidate = assign_chunked(points, points[[row_id]])
        nearest = np.minimum(nearest, candidate)
    return points[chosen].copy(), chosen


def mean_squared_error(points, centers, weights=None, block_size=256):
    points = points_array(points)
    weights = weights_array(weights, len(points))
    _, lengths = assign_chunked(points, centers, block_size)
    return weighted_objective(weights, lengths) / weights.sum()


def same_partition(left, right):
    """Compare same-row equivalence classes without requiring equal numeric IDs."""
    left = np.asarray(left)
    right = np.asarray(right)
    if left.ndim != 1 or right.shape != left.shape:
        raise ValueError("Use corresponding label vectors of equal length.")
    forward, backward = {}, {}
    for a, b in zip(left.tolist(), right.tolist()):
        if a in forward and forward[a] != b:
            return False
        if b in backward and backward[b] != a:
            return False
        forward[a], backward[b] = b, a
    return True
