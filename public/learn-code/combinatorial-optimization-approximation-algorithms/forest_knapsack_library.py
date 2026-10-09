"""Maintained forest and whole-item knapsack routes with explicit contracts.

Requires NetworkX, NumPy and SciPy. Synthetic fixtures only. A maximum
spanning forest is a mandatory base of each original connected component;
an unrestricted forest may omit every nonpositive edge instead. The MILP
route uses binary item variables, negated values for minimization, explicit
capacity/bounds, optimal-status checks and a separately rechecked incumbent.
Returned solver bounds are numerical certificates, not an FPTAS theorem.
"""
import math
import networkx as nx
import numpy as np
from scipy.optimize import Bounds, LinearConstraint, milp


def forest_route(node_count, edges, mandatory_base=False):
    if type(node_count) is not int or node_count < 1:
        raise ValueError('declare at least one vertex')
    if type(mandatory_base) is not bool:
        raise ValueError('mandatory_base must be a Boolean')
    graph = nx.Graph()
    graph.add_nodes_from(range(node_count))
    for index, (a, b, weight) in enumerate(edges):
        if (type(a) is not int or type(b) is not int or
                not 0 <= a < node_count or not 0 <= b < node_count or
                type(weight) is not int):
            raise ValueError('integer endpoints and weights required')
        if graph.has_edge(a, b):
            raise ValueError('this route accepts a simple undirected graph')
        graph.add_edge(a, b, weight=weight, original_index=index)
    candidates = graph.copy()
    if not mandatory_base:
        candidates.remove_edges_from([(a, b) for a, b, data in graph.edges(data=True)
                                      if data['weight'] <= 0])
    chosen = nx.maximum_spanning_tree(candidates, algorithm='kruskal')
    assert set(chosen) == set(graph)
    assert nx.is_forest(chosen)
    if mandatory_base:
        assert chosen.number_of_edges() == node_count - nx.number_connected_components(graph)
    indices = sorted(data['original_index'] for _, _, data in chosen.edges(data=True))
    value = sum(edges[index][2] for index in indices)
    return value, indices


def knapsack_route(items, capacity):
    # These explicit integer bounds keep the displayed numerical formulation
    # within ordinary double precision; arbitrary binary-encoded integers need
    # an implementation-specific numerical analysis rather than this assertion.
    if type(capacity) is not int or not 0 <= capacity <= 1_000_000:
        raise ValueError('integer capacity in [0, 1000000] required')
    if len(items) > 10_000:
        raise ValueError('at most 10000 items in this numerical wrapper')
    for weight, value in items:
        if (type(weight) is not int or type(value) is not int or
                not 1 <= weight <= 1_000_000 or not 0 <= value <= 1_000_000):
            raise ValueError('positive integer weights and nonnegative values, at most 1000000')
    kept = [(index, weight, value) for index, (weight, value) in enumerate(items)
            if weight <= capacity]
    if not kept:
        return {'selected': [], 'value': 0, 'upper_bound': 0.0,
                'relative_gap': 0.0, 'status': 'empty feasible item set'}
    weights = np.array([weight for _, weight, _ in kept], dtype=float)
    values = np.array([value for _, _, value in kept], dtype=float)
    # HiGHS minimizes, so maximizing value becomes minimizing -value.
    result = milp(c=-values, integrality=np.ones(len(kept)),
                  bounds=Bounds(np.zeros(len(kept)), np.ones(len(kept))),
                  constraints=LinearConstraint(weights[None, :], -np.inf, capacity),
                  options={'mip_rel_gap': 0.0})
    if result.status != 0 or result.x is None:
        raise RuntimeError('the run did not certify the stated optimum: ' + result.message)
    rounded = np.rint(result.x)
    assert np.all(np.abs(result.x - rounded) <= 1e-7)
    assert np.all((rounded == 0) | (rounded == 1))
    selected = [original for (original, _, _), decision in zip(kept, rounded) if decision]
    total_weight = sum(items[index][0] for index in selected)
    value = sum(items[index][1] for index in selected)
    assert total_weight <= capacity
    assert math.isclose(-result.fun, value, rel_tol=0, abs_tol=1e-7)
    upper = -float(result.mip_dual_bound)
    assert math.isfinite(upper) and value <= upper + 1e-7
    assert upper - value <= 1e-7
    return {'selected': selected, 'value': value, 'upper_bound': upper,
            'relative_gap': float(result.mip_gap), 'status': int(result.status)}


if __name__ == '__main__':
    edges = [(0, 1, 6), (1, 2, 5), (0, 2, 4),
             (2, 3, 3), (1, 3, 2), (0, 3, 1)]
    print('ordinary maximum forest value/indices:', forest_route(4, edges))
    for required in [False, True]:
        print('negative edge mandatory base:', required,
              'value/indices:', forest_route(2, [(0, 1, -3)], required))
    items = [(2, 14), (3, 18), (4, 22), (5, 25), (7, 31)]
    print('binary knapsack numerical certificate:', knapsack_route(items, 10))
    print('no feasible item:', knapsack_route(items, 0))
