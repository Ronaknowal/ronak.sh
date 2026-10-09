import numpy as np
from scipy.cluster.hierarchy import linkage, cut_tree, fcluster
from sklearn.metrics import adjusted_rand_score

toy = np.array([[1.0, 0.0], [1.5, 0.5], [3.0, 2.0], [3.5, 2.0], [7.0, 5.0], [7.5, 5.5]])


def ward_merges(points):
    # Agglomerate by the smallest increase in within-cluster squared error.
    points = np.asarray(points, dtype=float)
    if points.ndim != 2 or 0 in points.shape or not np.isfinite(points).all():
        raise ValueError("Use a nonempty finite numeric row-by-feature matrix.")
    clusters = {
        i: (1, row.copy(), [i]) for i, row in enumerate(points)
    }  # size, mean, rows
    rows, costs = [], []
    for new_id in range(len(points), 2 * len(points) - 1):
        candidates = []
        active = sorted(clusters)
        for position, left in enumerate(active):
            for right in active[position + 1 :]:
                na, ma, _ = clusters[left]
                nb, mb, _ = clusters[right]
                delta = na * nb / (na + nb) * float(((ma - mb) ** 2).sum())
                candidates.append((delta, left, right))
        delta, left, right = min(candidates)  # the lowest ID pair breaks an exact tie
        na, ma, members_a = clusters.pop(left)
        nb, mb, members_b = clusters.pop(right)
        clusters[new_id] = (
            na + nb,
            (na * ma + nb * mb) / (na + nb),
            members_a + members_b,
        )
        rows.append(
            [left, right, np.sqrt(2 * delta), na + nb]
        )  # SciPy's height convention
        costs.append(delta)
    return np.array(rows), np.array(costs)


def count_cut(tree, k):
    # Apply exactly the first n − k merges.
    n = len(tree) + 1
    active = {index: [index] for index in range(n)}
    for step, row in enumerate(tree[: n - k]):
        left, right = map(int, row[:2])
        active[n + step] = active.pop(left) + active.pop(right)
    labels = np.empty(n, dtype=int)
    for label, members in enumerate(active.values()):
        labels[members] = label
    return labels


ours, delta = ward_merges(toy)
reference = linkage(toy, method="ward", metric="euclidean")
print("left right delta_SSE scipy_height size")
for own, cost, other in zip(ours, delta, reference):
    print(int(own[0]), int(own[1]), f"{cost:.6f}", f"{other[2]:.6f}", int(own[3]))
print("all heights obey h² = 2Δ:", bool(np.allclose(reference[:, 2] ** 2, 2 * delta)))
print(
    "sum of merge costs / one-cluster SSE:",
    round(float(delta.sum()), 6),
    round(float(np.sum((toy - toy.mean(axis=0)) ** 2)), 6),
)
for k in [2, 3, 4]:
    direct = count_cut(ours, k)
    scipy_labels = cut_tree(reference, n_clusters=[k]).ravel()
    print(
        "count cut",
        k,
        "agrees with SciPy cut_tree (ARI):",
        round(adjusted_rand_score(direct, scipy_labels), 6),
    )
equal_height = reference[1, 2]
below = fcluster(reference, np.nextafter(equal_height, -np.inf), criterion="distance")
through = fcluster(reference, equal_height, criterion="distance")
max_four = fcluster(reference, 4, criterion="maxclust")
print(
    "clusters from a height cut just below / at the tied height:",
    len(np.unique(below)),
    len(np.unique(through)),
)
print("fcluster maxclust=4 returns at most 4; actual:", len(np.unique(max_four)))