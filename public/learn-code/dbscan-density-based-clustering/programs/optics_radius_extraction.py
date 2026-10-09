"""Extract one supported radius from an OPTICS graph, without recomputing it."""
import math
from density_neighbourhoods import Neighbourhoods, radius
from optics_ordering import Ordering


def validate_graph(graph):
    n = len(graph.ordering)
    if n == 0 or any(type(i) is not int for i in graph.ordering):
        raise ValueError("ordering must contain integer input positions")
    if sorted(graph.ordering) != list(range(n)):
        raise ValueError("ordering must be a permutation of all input positions")
    if any(len(values) != n for values in (graph.core_distances,
                                          graph.reachability, graph.predecessor)):
        raise ValueError("graph arrays must have one entry per input row")
    for values in (graph.core_distances, graph.reachability):
        if any(isinstance(x, bool) or not isinstance(x, (int, float))
               or math.isnan(x) or x < 0 for x in values):
            raise ValueError("graph distances must be nonnegative, possibly infinite")
    if any(type(p) is not int or not -1 <= p < n for p in graph.predecessor):
        raise ValueError("predecessors must be input positions or -1")


def radius_labels(graph, eps):
    validate_graph(graph)
    eps = radius(eps)
    if eps > graph.max_eps:
        raise ValueError("extraction radius exceeds the graph's construction cap")
    labels, group = [-1] * len(graph.ordering), -1
    for row in graph.ordering:
        far = graph.reachability[row] > eps
        if far and graph.core_distances[row] <= eps:
            group += 1
        if not far or graph.core_distances[row] <= eps:
            labels[row] = group
    return tuple(labels)


def main():
    import numpy as np
    from sklearn.cluster import cluster_optics_dbscan
    from dbscan_on_demand import dbscan
    # A supplied graph for the newly explained earlier-border witness.
    # Calling the extractor below does not fit OPTICS or the historical trail.
    graph = Ordering((0, 1, 2, 3), (3.0, 2.0, 1.0, 2.0),
                     (math.inf, 3.0, 2.0, 1.0), (-1, 0, 1, 2),
                     math.inf, 3, ())
    scratch = radius_labels(graph, 2)
    ordinary = cluster_optics_dbscan(
        reachability=np.asarray(graph.reachability),
        core_distances=np.asarray(graph.core_distances),
        ordering=np.asarray(graph.ordering), eps=2)
    np.testing.assert_array_equal(scratch, ordinary)
    provider = Neighbourhoods(((0,), (2,), (3,), (4,)), ("a", "b", "c", "d"))
    direct = dbscan(provider, 2, 3)
    assert scratch == (-1, 0, 0, 0) and direct.labels == (0, 0, 0, 0)
    print("extracted radius 2", list(scratch))
    print("direct DBSCAN radius 2", list(direct.labels))
    print("first row core radius", graph.core_distances[0],
          "earlier reachability", graph.reachability[0])
    capped = Ordering(graph.ordering, graph.core_distances, graph.reachability,
                      graph.predecessor, 1.0, graph.minimum, ())
    try:
        radius_labels(capped, 2)
    except ValueError as error:
        print("unsupported cut", str(error))
    else:
        raise AssertionError("unsupported cuts must be refused")


if __name__ == "__main__":
    main()
