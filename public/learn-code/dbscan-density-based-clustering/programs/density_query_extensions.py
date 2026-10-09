"""Explicit weighted, sparse, halo and frozen-reference neighbourhood contracts."""
from collections import deque
from dataclasses import dataclass
import math
from density_neighbourhoods import Neighbourhoods, positive_count, radius, haversine_radians
from dbscan_on_demand import DensityPartition, dbscan
from disjoint_set import DisjointSet


def weighted_dbscan(provider, eps, minimum, weights):
    eps, minimum = radius(eps), positive_count(minimum)
    n = len(provider.ids)
    weights = tuple(float(w) for w in weights)
    if len(weights) != n or any(not math.isfinite(w) for w in weights):
        raise ValueError("supply one finite weight per observation")
    labels, visited, queued, cores, calls = [-2] * n, [False] * n, [False] * n, [False] * n, [0] * n
    group = 0

    def query(row):
        calls[row] += 1
        roster = provider.neighbours(row, eps)
        total = math.fsum(weights[j] for j, _ in roster)
        cores[row] = total >= minimum
        return roster

    for seed in range(n):
        if visited[seed]:
            continue
        visited[seed] = True
        roster = query(seed)
        if not cores[seed]:
            labels[seed] = -1
            continue
        labels[seed] = group
        pending = deque()

        def enqueue(neighbours):
            for row, _ in neighbours:
                if not queued[row]:
                    queued[row] = True
                    pending.append(row)

        enqueue(roster)
        roster = None
        while pending:
            row = pending.popleft()
            if not visited[row]:
                visited[row] = True
                roster = query(row)
                if cores[row]:
                    enqueue(roster)
                roster = None
            if labels[row] in (-2, -1):
                labels[row] = group
        group += 1
    return DensityPartition(tuple(provider.ids), tuple(labels), tuple(cores), tuple(calls), ())


@dataclass(frozen=True)
class SparseNeighbourhoods:
    ids: tuple
    adjacency: tuple

    @classmethod
    def from_csr(cls, matrix, ids):
        from scipy.sparse import isspmatrix_csr
        if not isspmatrix_csr(matrix) or not matrix.has_canonical_format:
            raise ValueError("supply canonical CSR with unique sorted column entries")
        ids = tuple(ids)
        n = len(ids)
        if any(type(i) not in (int, str) for i in ids) or len(set(ids)) != n:
            raise ValueError("graph IDs must be unique integers/strings, never bool")
        if matrix.shape != (n, n) or n == 0:
            raise ValueError("sparse distance graph must be nonempty and square")
        copied = matrix.copy()
        edges = {}
        for row in range(n):
            for slot in range(copied.indptr[row], copied.indptr[row + 1]):
                column, value = int(copied.indices[slot]), float(copied.data[slot])
                if not math.isfinite(value) or value < 0:
                    raise ValueError("stored lengths must be finite and nonnegative")
                edges[row, column] = value
        if any(edges.get((row, row)) != 0 for row in range(n)):
            raise ValueError("each self edge must be explicitly stored with distance zero")
        if any(edges.get((j, i)) != value for (i, j), value in edges.items()):
            raise ValueError("stored edges must be exactly symmetric")
        row_entries = [[] for _ in range(n)]
        for (row, column), value in edges.items():
            row_entries[row].append((column, value))
        # Canonical CSR was traversed in sorted column order; preserve explicit zeros.
        adjacency = tuple(tuple(entries) for entries in row_entries)
        return cls(ids, adjacency)

    def neighbours(self, row, eps):
        if type(row) is not int or not 0 <= row < len(self.ids):
            raise ValueError("graph row outside input positions")
        eps = radius(eps)
        return [(column, value) for column, value in self.adjacency[row] if value <= eps]


def frozen_core_query(provider, partition, row, eps):
    eps = radius(eps)
    if partition.ids != provider.ids or len(partition.labels) != len(provider.ids):
        raise ValueError("reference partition must align with the provider IDs")
    if len(partition.core) != len(provider.ids) or any(type(c) is not bool for c in partition.core):
        raise ValueError("supply one reference core flag per row")
    if any(type(label) is not int or label < -1 for label in partition.labels):
        raise ValueError("reference labels must be nominal nonnegative integers or noise -1")
    if any(core and label == -1 for core, label in zip(partition.core, partition.labels)):
        raise ValueError("a reference core cannot have a noise label")
    query = Neighbourhoods((tuple(row),), ("query",), provider.metric).rows[0]
    if len(query) != len(provider.rows[0]):
        raise ValueError("query and reference feature widths differ")
    eligible = []
    for position, reference in enumerate(provider.rows):
        if not partition.core[position]:
            continue
        distance = (math.dist(query, reference) if provider.metric == "euclidean"
                    else haversine_radians(query, reference))
        if distance <= eps:
            eligible.append(position)
    groups = tuple(sorted({partition.labels[position] for position in eligible}))
    status = "none" if not groups else "one_component" if len(groups) == 1 else "ambiguous"
    return {"status": status, "components": groups,
            "eligible_core_ids": tuple(provider.ids[position] for position in eligible)}


def halo_core_components(provider, eps, minimum, owners):
    """A transparent exact global reconciliation, not a distributed speed benchmark."""
    eps, minimum = radius(eps), positive_count(minimum)
    n, owners = len(provider.ids), tuple(owners)
    if len(owners) != n or any(type(owner) not in (int, str) for owner in owners):
        raise ValueError("one integer/string partition owner per observation")
    halos, core = {owner: set() for owner in owners}, [False] * n
    for row, owner in enumerate(owners):
        roster = provider.neighbours(row, eps)  # Global exact halo, including self.
        halos[owner].update(j for j, _ in roster)
        core[row] = len(roster) >= minimum
    dsu = DisjointSet(n)
    for row in range(n):
        if core[row]:
            for other, _ in provider.neighbours(row, eps):
                if core[other]:
                    dsu.union(row, other)
    groups = {}
    for row in range(n):
        if core[row]:
            groups.setdefault(dsu.find(row), []).append(row)
    components = sorted(groups.values(), key=lambda rows: min(rows))
    component_for_row = {row: group for group, rows in enumerate(components) for row in rows}
    border_candidates = {}
    for row in range(n):
        if not core[row]:
            candidates = {component_for_row[j] for j, _ in provider.neighbours(row, eps) if core[j]}
            border_candidates[provider.ids[row]] = tuple(sorted(candidates))
    return {"core": tuple(core),
            "components": tuple(tuple(provider.ids[i] for i in rows) for rows in components),
            "halos": {owner: tuple(provider.ids[i] for i in sorted(rows)) for owner, rows in halos.items()},
            "border_candidates": border_candidates}


def main():
    import numpy as np
    from scipy.sparse import csr_matrix
    from sklearn.cluster import DBSCAN
    expanded = Neighbourhoods(((0,), (0,), (0,), (.5,), (4,)), tuple("abcde"))
    compact = Neighbourhoods(((0,), (.5,), (4,)), ("zero", "half", "four"))
    result = weighted_dbscan(compact, .6, 3, (3, 1, 1))
    original = dbscan(expanded, .6, 3)
    assert tuple(result.labels[i] for i in (0, 0, 0, 1, 2)) == original.labels
    ordinary = DBSCAN(eps=.6, min_samples=3).fit(np.asarray(compact.rows), sample_weight=[3, 1, 1])
    np.testing.assert_array_equal(result.labels, ordinary.labels_)
    print("duplicate-expanded labels", list(original.labels), "weighted representatives", list(result.labels))
    inhibited = Neighbourhoods(((0,), (.5,), (1,)), tuple("pqr"))
    negative = weighted_dbscan(inhibited, .6, 2, (1, -1, 1))
    ordinary = DBSCAN(eps=.6, min_samples=2).fit(np.asarray(inhibited.rows), sample_weight=[1, -1, 1])
    np.testing.assert_array_equal(negative.labels, ordinary.labels_)
    print("negative-weight cores", list(negative.core), "labels", list(negative.labels))
    matrix = csr_matrix((np.zeros(5), ([0, 1, 2, 0, 1], [0, 1, 2, 1, 0])), shape=(3, 3))
    sparse = SparseNeighbourhoods.from_csr(matrix, tuple("ABC"))
    sparse_result = weighted_dbscan(sparse, .1, 2, (1, 1, 1))
    ordinary = DBSCAN(eps=.1, min_samples=2, metric="precomputed").fit(matrix)
    np.testing.assert_array_equal(sparse_result.labels, ordinary.labels_)
    print("stored-zero sparse rosters", [[sparse.ids[j] for j, _ in sparse.neighbours(i, .1)] for i in range(3)],
          "labels", list(sparse_result.labels))
    reference = Neighbourhoods(((-2,), (-1.5,), (-1,), (1,), (1.5,), (2,)), tuple("ABCDEF"))
    partition = dbscan(reference, 1, 3)
    before = (reference.rows, partition)
    for x in (-5, -1.5, 0):
        print("frozen query", x, frozen_core_query(reference, partition, (x,), 1))
    assert before == (reference.rows, partition)
    halos = halo_core_components(reference, 1, 3, ("west", "west", "east", "west", "east", "east"))
    assert halos["components"] == (("A", "B", "C"), ("D", "E", "F"))
    print("reconciled core components", list(halos["components"]), "halos", halos["halos"])


if __name__ == "__main__":
    main()
