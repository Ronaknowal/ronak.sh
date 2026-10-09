"""Changed-input solution cases; import definitions without rerunning a study."""
import json
import numpy as np
from scipy.cluster.hierarchy import linkage
from clustering_core import assign_chunked
from clustering_single_mst import minimum_spanning_edges, edges_to_linkage, cut_edges
from clustering_nn_chain import member_distance, nn_chain
from clustering_diagnostics import point_silhouettes, gap_reference
from clustering_minibatch import BatchMeans
from clustering_cf_tree import Summary, CFTree
from clustering_ivf_routing import build_lists, search


def memory_assignment():
    points = np.array([[0.0], [1.0], [2.0], [3.0], [4.0]])
    labels, distances = assign_chunked(points, [[0.0], [2.0]], block_size=2)
    assert labels[1] == 0 and labels[3] == 1
    return {"labels": labels.tolist(), "squared_distances": distances.tolist(),
            "broadcast_bytes": 10000 * 20 * 10 * 8,
            "difference_bytes": 256 * 10 * 8,
            "best_distance_bytes": 256 * 8, "best_index_bytes": 256 * 8}


def refresh_bound(candidate=3.0):
    x, assigned, old_candidate = 2.0, 0.0, 6.0
    upper, old_lower = 2.0, 4.0
    movement = abs(candidate - old_candidate)
    lower = max(0.0, old_lower - movement)
    half_separation = abs(candidate - assigned) / 2
    skip = upper < lower or upper < half_separation
    exact = abs(x - candidate)
    assert lower <= exact
    winner = 1 if exact < abs(x - assigned) else 0
    return {"upper": upper, "lower": lower, "half_separation": half_separation,
            "skip": skip, "exact_candidate": exact, "winner": winner}


def changed_single_tree():
    points = np.array([[0.0], [2.0], [3.0], [9.0]])
    edges = minimum_spanning_edges(points)
    tree = edges_to_linkage(edges, len(points))
    ordinary = linkage(points, method="single", metric="euclidean")
    assert np.allclose(tree[:, 2], ordinary[:, 2])
    return {"edges": sorted(edges), "tree": tree.tolist(),
            "cuts": {str(t): cut_edges(edges, len(points), t).tolist() for t in [1, 2, 6]}}


def unequal_average():
    points = np.array([[-2.0], [2.0], [8.0], [0.0]])
    direct = member_distance(points, [0, 1, 2], [3], "average")
    updated = (2 * 2 + 1 * 8) / 3
    assert direct == updated == 4
    # A separate complete hierarchy exercises the actual NN-chain output IDs.
    tree = nn_chain([[0.0], [.2], [4.0], [8.0]], "average")
    assert all(max(row[:2]) < 4 + i for i, row in enumerate(tree))
    return {"member_contributions": [2, 2, 8], "correct_average": direct,
            "unweighted_wrong": (2 + 8) / 2, "valid_tree": tree.tolist()}


def diagnose_scores():
    points = np.array([[0.0], [1.0], [4.0], [6.0]])
    scores = point_silhouettes(points, [0, 1, 0, 1], block_size=2)
    stopped = False
    try:
        gap_reference(points, [1, 2], fitter=lambda rows, k, seed: 0.0)
    except ValueError:
        stopped = True
    assert stopped and np.isclose(scores[1], -.6)
    gaps, spread = [.1, .4, .43], [0, .05, .08]
    tests = [gaps[i] >= gaps[i + 1] - spread[i + 1] for i in range(2)]
    selected = next((i + 1 for i, passed in enumerate(tests) if passed), None)
    return {"point_silhouettes": scores.tolist(), "zero_log_stopped": stopped,
            "neighbor_tests": tests, "selected_k": selected}


def restore_history():
    history = BatchMeans([[3.0]], [2.0])
    envelope = {"algorithm": "cached-weighted-batch-mean-v1", "tie_policy": "lowest-index",
                "initial_centers": [[0.0]], "state": json.loads(history.to_json())}
    saved = json.dumps(envelope)
    loaded = json.loads(saved)
    if loaded["algorithm"] != "cached-weighted-batch-mean-v1" or loaded["tie_policy"] != "lowest-index":
        raise ValueError("Stored update or tie policy is unsupported.")
    restored = BatchMeans.from_json(json.dumps(loaded["state"]))
    restored.update([[9.0]])
    wrong = BatchMeans([[3.0]], [1.0])
    wrong.update([[9.0]])
    heavy = BatchMeans([[3.0]], [2.0])
    heavy.update([[9.0]], [4.0])
    cached = BatchMeans([[0.0], [10.0]], [1.0, 1.0])
    cached.update([[4.0], [6.0]])
    return {"saved": envelope, "restored_mean": restored.centers.tolist(),
            "wrong_mean": wrong.centers.tolist(), "heavy_mean": heavy.centers.tolist(),
            "cached_centers": cached.centers.tolist(), "cached_masses": cached.masses.tolist()}


def summary_limits():
    summary = Summary.point([0.0]).merge(Summary.point([2.0]))
    cost = summary.restricted_cost([4.0])
    offset = Summary.point([1e12 - 1]).merge(Summary.point([1e12 + 1]))
    tree = CFTree(1, threshold=1, capacity=2).partial_fit([[0.0], [2.0], [5.0], [9.0]])
    leaves = tree.leaves()
    assert sum(entry.summary.count for node in leaves for entry in node.entries) == 4
    assert all(len(node.entries) <= 2 for node in leaves)
    assert leaves[1].previous is leaves[0] and leaves[0].following is leaves[1]
    assert cost == 20 and offset.scatter == 2
    return {"whole_entry_cost": cost, "separate_point_resplit_cost": 0,
            "stable_offset_scatter": offset.scatter, "tree": tree.state()}


def routing_error():
    index = build_lists([[4.9], [6.0]], [[0.0], [10.0]], [0, 1])
    narrow, full = search(index, [5.1], 1), search(index, [5.1], 2)
    assert narrow["ids"] == [1] and full["ids"] == [0]
    return {"one_list": narrow, "all_lists": full,
            "lengths": [float(np.sqrt(narrow["squared_distances"][0])),
                        float(np.sqrt(full["squared_distances"][0]))]}
