"""Symmetric mutual reachability and maintained-key Prim without a pair matrix."""
from dataclasses import dataclass
import math
from density_neighbourhoods import Neighbourhoods, positive_count, radius
from disjoint_set import DisjointSet


@dataclass(frozen=True)
class Edge:
    weight: float
    left: int
    right: int


def prim_tree(n, weight, keep_trace=False):
    if type(n) is not int or n < 0:
        raise ValueError("vertex count must be a nonnegative integer")
    if keep_trace and n > 64:
        raise ValueError("full teaching traces are limited to 64 vertices")
    if n == 0:
        return (), ()
    included, best, parent = [False] * n, [math.inf] * n, [-1] * n
    best[0] = 0.0
    edges, trace = [], []
    for _ in range(n):
        row = min((i for i in range(n) if not included[i]), key=lambda i: (best[i], i))
        if not math.isfinite(best[row]):
            raise ValueError("the supplied finite graph is disconnected")
        included[row] = True
        if parent[row] != -1:
            edges.append(Edge(best[row], parent[row], row))
        if keep_trace:
            trace.append(("admit", row, tuple(included), tuple(best), tuple(parent)))
        for candidate in range(n):
            if included[candidate]:
                continue
            value = float(weight(row, candidate))
            if not math.isfinite(value) or value < 0:
                raise ValueError("edge oracle must return finite nonnegative lengths")
            improved = value < best[candidate]
            tied_parent = value == best[candidate] and row < parent[candidate]
            if improved or tied_parent:
                best[candidate], parent[candidate] = value, row
                if keep_trace:
                    trace.append(("update", candidate, tuple(included), tuple(best), tuple(parent)))
    return tuple(edges), tuple(trace)


def mutual_reachability_tree(provider, minimum, keep_trace=False):
    minimum = positive_count(minimum)
    n = len(provider.rows)
    if minimum > n:
        raise ValueError("finite mutual reachability requires minimum <= row count")
    cores = tuple(provider.selected_core_radius(i, minimum) for i in range(n))
    edges, trace = prim_tree(n, lambda i, j: max(cores[i], cores[j], provider.distance(i, j)),
                             keep_trace)
    return cores, edges, trace


def threshold_components(n, edges, cut):
    cut = radius(cut, allow_infinity=True)
    dsu = DisjointSet(n)
    for edge in edges:
        if edge.weight <= cut:
            dsu.union(edge.left, edge.right)
    return tuple(tuple(group) for group in dsu.groups())


def main():
    import numpy as np
    from scipy.sparse.csgraph import minimum_spanning_tree
    provider = Neighbourhoods(((0,), (1,), (4,), (5,)), ("v0", "v1", "v2", "v3"))
    cores, edges, _ = mutual_reachability_tree(provider, 2)
    print("self-inclusive cores", list(cores))
    print("maintained Prim edges", [(provider.ids[e.left], provider.ids[e.right], e.weight)
                                    for e in edges])
    # A small explicitly materialized matrix is only the ordinary comparison.
    matrix = np.asarray([[0 if i == j else max(cores[i], cores[j], provider.distance(i, j))
                          for j in range(4)] for i in range(4)])
    ordinary = minimum_spanning_tree(matrix)
    assert sum(edge.weight for edge in edges) == float(ordinary.sum()) == 5.0
    for cut in (1.0, 3.0):
        components = threshold_components(4, edges, cut)
        complete_edges = [Edge(float(matrix[i, j]), i, j)
                          for i in range(4) for j in range(i + 1, 4)]
        assert components == threshold_components(4, complete_edges, cut)
        print("cut", cut, "components", [[provider.ids[i] for i in group] for group in components])
    assert prim_tree(1, lambda i, j: 0)[0] == ()
    print("one-vertex tree", list(prim_tree(1, lambda i, j: 0)[0]))


if __name__ == "__main__":
    main()
