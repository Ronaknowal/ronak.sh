"""Complete/average/Ward nearest-neighbor chains and valid sorted tree IDs."""
import warnings
import numpy as np
from scipy.cluster.hierarchy import linkage, ClusterWarning
from scipy.spatial.distance import pdist, squareform
from clustering_core import points_array, squared_to_center


def member_distance(points, left, right, method="average"):
    """Direct member definition for an inspectable pair, before cached updates.

    This computes |A|*|B| lengths; the complete hierarchy below uses its
    O(n²) stored matrix and reducible recurrence instead of repeating this.
    """
    points = points_array(points)
    left, right = np.asarray(left), np.asarray(right)
    for members in [left, right]:
        if (members.ndim != 1 or not len(members)
                or not np.issubdtype(members.dtype, np.integer)
                or (members < 0).any() or (members >= len(points)).any()
                or len(np.unique(members)) != len(members)):
            raise ValueError("Use nonempty groups of distinct valid row indices.")
    if np.intersect1d(left, right).size:
        raise ValueError("Active groups must have disjoint members.")
    if method not in {"single", "complete", "average"}:
        raise ValueError("Use single, complete or average for this cross-member definition.")
    lengths = np.concatenate([np.sqrt(squared_to_center(points[right], points[i])) for i in left])
    return float(lengths.min() if method == "single" else lengths.max()
                 if method == "complete" else lengths.mean())


def input_routes(points):
    """Expose the three different ordinary linkage input interpretations."""
    points = points_array(points)
    if len(points) < 2:
        raise ValueError("At least two rows are needed for an ordinary linkage call.")
    condensed = pdist(points, metric="euclidean")
    square = squareform(condensed)
    coordinate_tree = linkage(points, method="single", metric="euclidean")
    condensed_tree = linkage(squareform(square), method="single")
    with warnings.catch_warnings(record=True) as observed:
        warnings.simplefilter("always", ClusterWarning)
        square_as_rows = linkage(square, method="single", metric="euclidean")
    return {"coordinates": points.tolist(), "square_distances": square.tolist(),
            "condensed_distances": condensed.tolist(),
            "coordinate_tree": coordinate_tree.tolist(),
            "condensed_tree": condensed_tree.tolist(),
            "square_as_observations_tree": square_as_rows.tolist(),
            "square_as_observations_warnings": [str(item.message) for item in observed]}


def nn_chain(points, method="average"):
    """O(n²) matrix/chain work after O(n²d) coordinate distances.

    This route is for reducible complete, count-weighted average and Euclidean
    Ward. It deliberately does not apply this recurrence to centroid/median.
    In an exact nearest tie, prefer the preceding chain member, then lower ID.
    """
    points = points_array(points)
    if method not in {"complete", "average", "ward"}:
        raise ValueError("Use complete, average or Euclidean Ward.")
    n = len(points)
    distances = np.full((2 * n - 1, 2 * n - 1), np.inf)
    for i in range(n):
        for j in range(i):
            squared = squared_to_center(points[j:j + 1], points[i])[0]
            value = squared if method == "ward" else np.sqrt(squared)
            distances[i, j] = distances[j, i] = value
    np.fill_diagonal(distances, np.inf)
    sizes = np.zeros(2 * n - 1, dtype=int)
    sizes[:n] = 1
    active = set(range(n))
    chain = []
    discovered = []
    while len(active) > 1:
        if not chain:
            chain.append(min(active))
        left = chain[-1]
        minimum = min(distances[left, j] for j in active if j != left)
        tied = [j for j in active if j != left and distances[left, j] == minimum]
        right = chain[-2] if len(chain) > 1 and chain[-2] in tied else min(tied)
        if len(chain) < 2 or right != chain[-2]:
            chain.append(right)
            continue
        new_id = n + len(discovered)
        merge_value = distances[left, right]
        height = np.sqrt(merge_value) if method == "ward" else merge_value
        new_size = sizes[left] + sizes[right]
        discovered.append((left, right, float(height), int(new_size)))
        for other in active - {left, right}:
            a = distances[left, other]
            b = distances[right, other]
            if method == "complete":
                value = max(a, b)
            elif method == "average":
                value = (sizes[left] * a + sizes[right] * b) / new_size
            else:
                total = new_size + sizes[other]
                value = ((sizes[left] + sizes[other]) * a
                         + (sizes[right] + sizes[other]) * b
                         - sizes[other] * merge_value) / total
                margin = 64 * np.finfo(float).eps * max(1.0, a, b, merge_value)
                if value < -margin:
                    raise ValueError("Ward recurrence is materially negative.")
                value = max(0.0, value)
            distances[new_id, other] = distances[other, new_id] = value
        sizes[new_id] = new_size
        active.difference_update({left, right})
        active.add(new_id)
        chain = chain[:-2]
    # A chain can discover a distant reciprocal pair before an independent closer
    # pair. Stable height sorting and explicit old->new node mapping repair IDs.
    order = sorted(range(n - 1), key=lambda i: discovered[i][2])
    renamed = {i: i for i in range(n)}
    rows = []
    for old_position in order:
        left, right, height, size = discovered[old_position]
        if left not in renamed or right not in renamed:
            raise ArithmeticError("A child follows its parent; linkage is not monotone.")
        rows.append([*sorted([renamed[left], renamed[right]]), height, size])
        renamed[n + old_position] = n + len(rows) - 1
    return np.asarray(rows, dtype=float).reshape(-1, 4)


def main():
    points = np.array([[0.0], [0.4], [2.0], [5.0], [5.7]])
    for method in ["complete", "average", "ward"]:
        scratch = nn_chain(points, method)
        ordinary = linkage(points, method=method, metric="euclidean")
        print("method:", method)
        print("scratch children / heights / counts:", scratch.tolist())
        print("ordinary heights:", ordinary[:, 2].tolist())
    tied = nn_chain([[0.0], [1.0], [2.0], [3.0]], "average")
    print("tied average tree:", tied.tolist())


if __name__ == "__main__":
    main()
