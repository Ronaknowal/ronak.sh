"""Bounded offline two-way bottleneck diagnostics on the supplied carrier.

Run: python recorded_spectral_diagnostics.py --data PATH_TO_KARATE_JSON
NumPy owns the dense symmetric eigensolve; this program owns assembly,
degree-coordinate conversion, every distinct-gap cut, and comparisons.
"""
import argparse
import json
from pathlib import Path

import numpy as np


def assemble(record, context_weights):
    nodes = record["nodeOrder"]
    index = {node: i for i, node in enumerate(nodes)}
    adjacency = np.zeros((len(nodes), len(nodes)))
    for left, right, weight in record["weightedEdges"]:
        i, j = index[left], index[right]
        adjacency[i, j] = adjacency[j, i] = weight if context_weights else 1.0
    degree = adjacency.sum(axis=1)
    if np.any(degree <= 0):
        raise ValueError("Separate isolates before the positive-volume sweep.")
    laplacian = np.diag(degree) - adjacency
    inverse_root = 1 / np.sqrt(degree)
    normalized = inverse_root[:, None] * laplacian * inverse_root[None, :]
    return adjacency, degree, normalized


def cut(adjacency, degree, members):
    mask = np.zeros(len(degree), dtype=bool)
    mask[members] = True
    crossing = adjacency[np.ix_(mask, ~mask)].sum()
    left_volume = degree[mask].sum()
    right_volume = degree[~mask].sum()
    return {
        "members": np.flatnonzero(mask).tolist(),
        "crossing": float(crossing),
        "volumes": [float(left_volume), float(right_volume)],
        "conductance": float(crossing / min(left_volume, right_volume)),
        "ncut": float(crossing * (1 / left_volume + 1 / right_volume)),
    }


def prefix_sweep(adjacency, degree, coordinates):
    order = np.argsort(coordinates, kind="stable")
    candidates = []
    selected_mask = np.zeros(len(degree), dtype=bool)
    crossing = volume = 0.0
    total_volume = float(degree.sum())
    for count in range(1, len(order)):
        node = order[count - 1]
        # Joining S changes an internal-neighbor edge from crossing to internal;
        # every other incident edge changes from outside to crossing.
        crossing += degree[node] - 2 * adjacency[node, selected_mask].sum()
        volume += degree[node]
        selected_mask[node] = True
        lower, upper = coordinates[order[count - 1:count + 1]]
        if upper - lower <= 1e-9:
            continue
        other_volume = total_volume - volume
        candidate = {
            "members": np.flatnonzero(selected_mask).tolist(),
            "crossing": float(crossing),
            "volumes": [float(volume), float(other_volume)],
            "conductance": float(crossing / min(volume, other_volume)),
            "ncut": float(crossing * (1 / volume + 1 / other_volume)),
        }
        candidate["threshold"] = float((lower + upper) / 2)
        candidates.append(candidate)
    return order, candidates


def diagnostics(record, context_weights):
    adjacency, degree, normalized = assemble(record, context_weights)
    values, basis = np.linalg.eigh(normalized)
    # Fix only a global sign for readable node-order tables, not a tied basis.
    vector = basis[:, 1]
    if vector[np.flatnonzero(np.abs(vector) > 1e-12)[0]] < 0:
        vector = -vector
    coordinates = vector / np.sqrt(degree)
    order, candidates = prefix_sweep(adjacency, degree, coordinates)
    best = min(candidates, key=lambda item: item["conductance"])
    selected = basis[:, :2]
    residual = normalized @ selected - selected * values[:2]
    result = {
        "affinity": "context" if context_weights else "equal",
        "nodes": len(degree),
        "edges": int(np.count_nonzero(adjacency) // 2),
        "degree_sum": float(degree.sum()),
        "first_values": values[:4].tolist(),
        "boundary_gap": float(values[2] - values[1]),
        "residual_norm": float(np.linalg.norm(residual)),
        "orthogonality_error": float(np.linalg.norm(selected.T @ selected - np.eye(2))),
        "weighted_mean": float(degree @ coordinates),
        "weighted_norm": float(np.sum(degree * coordinates**2)),
        "coordinate_order": order.tolist(),
        "coordinate_values": coordinates[order].tolist(),
        "candidate_count": len(candidates),
        "best": best,
        # A deliberately specified baseline, not a historical faction label.
        "node_zero_baseline": cut(adjacency, degree, [record["nodeOrder"].index(0)]),
    }
    return result, selected @ selected.T, adjacency, degree


def compare(record):
    equal, equal_projector, adjacency_equal, degree_equal = diagnostics(record, False)
    context, context_projector, adjacency_context, degree_context = diagnostics(record, True)
    return {
        "equal": equal,
        "context": context,
        "low_subspace_projector_difference": float(np.linalg.norm(equal_projector - context_projector)),
        "equal_selected_set_under_context": cut(adjacency_context, degree_context, equal["best"]["members"]),
        "context_selected_set_under_equal": cut(adjacency_equal, degree_equal, context["best"]["members"]),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, type=Path)
    args = parser.parse_args()
    record = json.loads(args.data.read_text(encoding="utf-8"))
    print(json.dumps(compare(record), indent=2))
