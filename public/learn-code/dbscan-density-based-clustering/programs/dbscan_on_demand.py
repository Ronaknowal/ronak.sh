"""One-query-per-row DBSCAN; scratch state is separate from provider storage."""
from collections import deque
from dataclasses import dataclass
from density_neighbourhoods import Neighbourhoods, positive_count, radius


@dataclass(frozen=True)
class DensityPartition:
    ids: tuple
    labels: tuple
    core: tuple
    query_counts: tuple
    trace: tuple


def dbscan(provider, eps, minimum, seed_order=None, record_trace=False):
    eps = radius(eps)
    minimum = positive_count(minimum)
    n = len(provider.rows)
    order = list(range(n)) if seed_order is None else list(seed_order)
    if any(type(i) is not int for i in order) or sorted(order) != list(range(n)):
        raise ValueError("seed order must be a permutation of all row positions")
    if record_trace and n > 64:
        raise ValueError("teaching trace is restricted to at most 64 rows")
    unvisited, noise = -2, -1
    labels = [unvisited] * n
    visited, enqueued, core = [False] * n, [False] * n, [False] * n
    query_counts = [0] * n
    trace = []

    def query(i):
        query_counts[i] += 1
        roster = provider.neighbours(i, eps)
        core[i] = len(roster) >= minimum
        if record_trace:
            trace.append(("query", provider.ids[i], tuple(provider.ids[j] for j, _ in roster), core[i]))
        return roster

    group = 0
    for seed in order:
        if visited[seed]:
            continue
        visited[seed] = True
        neighbours = query(seed)
        if not core[seed]:
            labels[seed] = noise
            continue
        labels[seed] = group
        queue = deque()

        def enqueue(roster):
            for j, _ in roster:
                if not enqueued[j]:
                    enqueued[j] = True  # Mark now; duplicate pending slots cannot grow.
                    queue.append(j)

        enqueue(neighbours)
        neighbours = None  # No retained all-row neighbour cache.
        while queue:
            row = queue.popleft()
            if not visited[row]:
                visited[row] = True
                neighbours = query(row)
                if core[row]:
                    enqueue(neighbours)
                neighbours = None
            # Noise records a failed seed test, not a permanent rejection.
            if labels[row] in (unvisited, noise):
                was_noise = labels[row] == noise
                labels[row] = group
                if record_trace:
                    trace.append(("noise_to_border" if was_noise else "attach", provider.ids[row], group))
        group += 1
    return DensityPartition(provider.ids, tuple(labels), tuple(core), tuple(query_counts), tuple(trace))


def core_components(partition):
    """Nominal cluster numbers are discarded; comparison uses stable row sets."""
    groups = {}
    for row_id, label, is_core in zip(partition.ids, partition.labels, partition.core):
        if is_core:
            groups.setdefault(label, set()).add(row_id)
    return {frozenset(rows) for rows in groups.values()}


def main():
    from sklearn.cluster import DBSCAN
    # A new five-row instructional input, not a rerun of the retained Iris study.
    provider = Neighbourhoods(((0, 0), (0.5, 0), (1, 0), (1, 0), (3, 0)),
                             ("A", "B", "C", "D", "E"))
    result = dbscan(provider, 0.5, 3, record_trace=True)
    ordinary = DBSCAN(eps=0.5, min_samples=3, metric="euclidean", algorithm="brute").fit(provider.rows)
    ordinary_core = set(map(int, ordinary.core_sample_indices_))
    reference = DensityPartition(provider.ids, tuple(map(int, ordinary.labels_)),
                                 tuple(i in ordinary_core for i in range(len(provider.rows))), (), ())
    assert core_components(result) == core_components(reference)
    assert result.core == reference.core
    assert result.labels == reference.labels  # This input has no ambiguous shared border.
    assert result.query_counts == (1,) * len(provider.rows)
    print("IDs", result.ids)
    print("scratch labels", result.labels)
    print("core", result.core)
    print("queries per row", result.query_counts)
    print("ordinary labels", reference.labels)
    for operation in result.trace:
        print(operation)


if __name__ == "__main__":
    main()
