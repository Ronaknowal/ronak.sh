"""On-demand Prim MST, single-linkage reconstruction and component cuts."""
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from clustering_core import points_array, squared_to_center, same_partition


def minimum_spanning_edges(points):
    """Dense geometry costs O(n²d) work, with O(n) auxiliary state."""
    points = points_array(points)
    n = len(points)
    visited = np.zeros(n, dtype=bool)
    best = np.full(n, np.inf)
    parent = np.full(n, -1, dtype=int)
    best[0] = 0
    edges = []
    for _ in range(n):
        # Lexicographic (length, vertex ID) gives a reproducible tied frontier.
        vertex = min((i for i in range(n) if not visited[i]), key=lambda i: (best[i], i))
        visited[vertex] = True
        if parent[vertex] != -1:
            edges.append((float(best[vertex]), int(parent[vertex]), vertex))
        for neighbor in range(n):
            if visited[neighbor]:
                continue
            distance = float(np.sqrt(squared_to_center(points[neighbor:neighbor + 1], points[vertex])[0]))
            if distance < best[neighbor] or (
                distance == best[neighbor] and vertex < parent[neighbor]
            ):
                best[neighbor] = distance
                parent[neighbor] = vertex
    return edges


def edges_to_linkage(edges, n):
    parent = list(range(n))
    node_id = list(range(n))
    sizes = [1] * n

    def root(vertex):
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    rows = []
    for distance, left, right in sorted(edges):
        a, b = root(left), root(right)
        if a == b:
            continue
        children = sorted([node_id[a], node_id[b]])
        size = sizes[a] + sizes[b]
        rows.append([*children, distance, size])
        parent[b] = a
        sizes[a] = size
        node_id[a] = n + len(rows) - 1
    if len(rows) != n - 1:
        raise ValueError("Edges must connect all n observations.")
    return np.asarray(rows, dtype=float).reshape(-1, 4)


def cut_edges(edges, n, threshold):
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("Use a finite nonnegative inclusive threshold.")
    parent = list(range(n))

    def root(vertex):
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    for length, left, right in edges:
        if length <= threshold:
            parent[root(right)] = root(left)
    roots = [root(i) for i in range(n)]
    names = {value: i for i, value in enumerate(sorted(set(roots)))}
    return np.array([names[r] for r in roots])


def main():
    points = np.array([[0.0], [1.0], [2.0], [6.0]])
    edges = minimum_spanning_edges(points)
    tree = edges_to_linkage(edges, len(points))
    ordinary = linkage(points, method="single", metric="euclidean")
    print("MST edges:", edges)
    print("single linkage rows:", tree.tolist())
    print("ordinary heights:", ordinary[:, 2].tolist())
    for threshold in [0.0, 1.0, 4.0]:
        labels = cut_edges(edges, len(points), threshold)
        reference = fcluster(ordinary, threshold, criterion="distance")
        print("threshold / labels / equivalent:", threshold, labels.tolist(),
              same_partition(labels, reference))
    duplicate = minimum_spanning_edges([[3.0], [3.0], [3.0]])
    print("duplicate zero-height tree:", edges_to_linkage(duplicate, 3).tolist())
    print("singleton tree:", edges_to_linkage(minimum_spanning_edges([[0.0]]), 1).tolist())


if __name__ == "__main__":
    main()
