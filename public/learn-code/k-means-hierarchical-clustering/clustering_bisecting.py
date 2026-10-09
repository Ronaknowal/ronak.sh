"""Recursive two-center splits, explicit leaf policy and complete routed state."""
import json
import numpy as np
from sklearn.cluster import BisectingKMeans
from clustering_core import points_array, assign_chunked, squared_to_center, same_partition
from clustering_chunked_lloyd import lloyd


def bisect(points, k, policy="sse", seed=7):
    points = points_array(points)
    if not isinstance(k, int) or not 1 <= k <= len(points):
        raise ValueError("k must be an integer from one to n.")
    if policy not in {"sse", "count"}:
        raise ValueError("Choose sse or count as the next-leaf policy.")
    next_id = 0

    def leaf(indices):
        nonlocal next_id
        center = points[indices].mean(axis=0)
        cost = float(squared_to_center(points[indices], center).sum())
        result = {"id": next_id, "center": center.tolist(), "count": len(indices),
                  "cost": cost, "children": None}
        next_id += 1
        return result

    root = leaf(np.arange(len(points)))
    leaves = [(root, np.arange(len(points)))]
    unsplittable = set()
    trace = []
    while len(leaves) < k:
        available = [(node, indices) for node, indices in leaves if node["id"] not in unsplittable]
        if not available:
            break
        node, indices = max(available, key=lambda item: (
            item[0]["cost"] if policy == "sse" else item[0]["count"], -item[0]["id"]))
        rows = points[indices]
        distances = squared_to_center(rows, rows[0])
        farthest = int(np.argmax(distances))
        if distances[farthest] == 0:
            unsplittable.add(node["id"])
            continue
        # Starts are actual first/farthest members. Each local fit is the complete
        # previously explained Lloyd implementation with a fixed update budget.
        result = lloyd(rows, initial=np.array([rows[0], rows[farthest]]), seed=seed)
        groups = [indices[result["labels"] == group] for group in range(2)]
        if any(len(group) == 0 for group in groups):
            unsplittable.add(node["id"])
            continue
        children = [leaf(group) for group in groups]
        node["split_centers"] = result["centers"].tolist()
        node["children"] = children
        trace.append({"split_id": node["id"], "members": indices.tolist(),
                      "starts": [rows[0].tolist(), rows[farthest].tolist()],
                      "local_updates": result["updates"], "local_fixed_point": result["fixed_point"]})
        leaves = [(old, members) for old, members in leaves if old is not node]
        leaves.extend(zip(children, groups))
    labels = np.empty(len(points), dtype=int)
    for label, (node, indices) in enumerate(sorted(leaves, key=lambda item: item[0]["id"])):
        node["label"] = label
        labels[indices] = label
    return {"schema": 1, "dimension": points.shape[1], "requested_k": k,
            "actual_k": len(leaves), "policy": policy, "seed": seed,
            "root": root, "labels": labels.tolist(), "trace": trace}


def predict(state, queries):
    queries = points_array(queries)
    if state.get("schema") != 1 or queries.shape[1] != state["dimension"]:
        raise ValueError("Query dimension or stored schema is incompatible.")
    labels, paths = [], []
    for row in queries:
        node = state["root"]
        path = [node["id"]]
        while node["children"] is not None:
            route = int(assign_chunked(row[None, :], node["split_centers"])[0][0])
            node = node["children"][route]
            path.append(node["id"])
        labels.append(node["label"])
        paths.append(path)
    return np.array(labels), paths


def main():
    points = np.array([[0.0], [0.2], [4.0], [4.2], [10.0], [10.2]])
    state = bisect(points, 3)
    print("split trace:", state["trace"])
    print("scratch labels:", state["labels"])
    ordinary = BisectingKMeans(n_clusters=3, n_init=1, random_state=7,
                              bisecting_strategy="biggest_inertia").fit(points)
    print("ordinary labels:", ordinary.labels_.tolist())
    print("same partition:", same_partition(state["labels"], ordinary.labels_))
    serialized = json.dumps(state)
    reloaded = json.loads(serialized)
    queries = [[0.1], [4.1], [10.1]]
    labels, paths = predict(reloaded, queries)
    print("routed query labels / paths:", labels.tolist(), paths)
    print("ordinary query labels:", ordinary.predict(queries).tolist())
    print("count-policy trace:", bisect(points, 3, policy="count")["trace"])
    print("duplicate requested / actual leaves:", 3, bisect([[1.0], [1.0], [1.0]], 3)["actual_k"])


if __name__ == "__main__":
    main()
