"""Offline vertex-cover certificates on an actual recorded tie network.

Requires NumPy, SciPy and NetworkX. Pass the canonical Graph Fundamentals
JSON path. The 34 vertices/78 ties are recorded; unit vertex costs are a
constructed teaching objective. Interaction-context weights and post-split
club labels are not used as costs or causal targets. The optimum solves
this declared combinatorial question, not a recommendation about people.
Keep the canonical dataset's NetworkX BSD carrier/provenance beside it.
"""
import hashlib
import json
import math
import sys
from pathlib import Path
import numpy as np
import networkx as nx
from scipy.optimize import Bounds, LinearConstraint, linprog, milp


EXPECTED_SHA = 'bc56f788f03b5dc920e49827f7112549c699a63c63ff094da3269bd0e125109b'
TOLERANCE = 1e-8


def load_recorded_graph(path):
    payload = Path(path).read_bytes()
    if hashlib.sha256(payload).hexdigest() != EXPECTED_SHA:
        raise ValueError('use the exact canonical Graph Fundamentals JSON')
    record = json.loads(payload)
    nodes = record['nodeOrder']
    edges = record['weightedEdges']
    if nodes != list(range(34)) or len(edges) != 78:
        raise ValueError('unexpected canonical graph dimensions')
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    for a, b, interaction_contexts in edges:
        graph.add_edge(a, b, contexts=interaction_contexts)
    if graph.number_of_edges() != len(edges) or nx.number_of_selfloops(graph):
        raise ValueError('expected distinct loop-free undirected ties')
    # Unit decision costs are constructed, not a measured member attribute.
    nx.set_node_attributes(graph, 1, 'decision_cost')
    return graph


def checked_cover(graph, selected):
    selected = set(selected)
    if not selected.issubset(graph):
        raise ValueError('selection contains an unknown vertex')
    if any(a not in selected and b not in selected for a, b in graph.edges):
        raise ValueError('returned selection leaves a tie uncovered')
    return selected


def solve_cover(graph, node_order=None):
    nodes = list(graph) if node_order is None else list(node_order)
    if len(nodes) != len(graph) or set(nodes) != set(graph):
        raise ValueError('node order must contain every vertex exactly once')
    index = {node: i for i, node in enumerate(nodes)}
    edges = list(graph.edges)
    incidence = np.zeros((len(edges), len(nodes)))
    for i, (a, b) in enumerate(edges):
        incidence[i, index[a]] = incidence[i, index[b]] = 1
    costs = np.array([graph.nodes[node]['decision_cost'] for node in nodes], dtype=float)
    if not np.all(np.isfinite(costs)) or np.any(costs < 0):
        raise ValueError('finite nonnegative constructed vertex costs required')
    # Every row x_a+x_b>=1 covers one actual tie.
    relaxation = linprog(costs, A_ub=-incidence, b_ub=-np.ones(len(edges)),
                         bounds=(0, 1), method='highs')
    # A distinct dual solve exposes nonnegative per-edge loads under budgets.
    dual = linprog(-np.ones(len(edges)), A_ub=incidence.T, b_ub=costs,
                   bounds=(0, None), method='highs')
    if not relaxation.success or not dual.success:
        raise RuntimeError('LP certificate unavailable: inspect solver status')
    if (np.min(incidence @ relaxation.x) < 1-TOLERANCE
            or np.min(relaxation.x) < -TOLERANCE
            or np.max(relaxation.x) > 1+TOLERANCE
            or np.min(dual.x) < -TOLERANCE
            or np.any(incidence.T @ dual.x > costs+TOLERANCE)):
        raise RuntimeError('numerical LP certificate fails its actual inequalities')
    lower = float(sum(dual.x))
    if not math.isclose(lower, relaxation.fun, abs_tol=TOLERANCE):
        raise RuntimeError('primal and dual objectives disagree')
    rounded = checked_cover(graph, [node for node, x in zip(nodes, relaxation.x)
                                    if x >= .5-TOLERANCE])
    local_ratio = checked_cover(graph, nx.approximation.min_weighted_vertex_cover(
        graph, weight='decision_cost'))
    exact = milp(costs, integrality=np.ones(len(nodes)), bounds=Bounds(0, 1),
                 constraints=LinearConstraint(incidence, 1, np.inf),
                 options={'mip_rel_gap': 0})
    # A stopped solver is not silently presented as an optimum.
    if exact.status != 0 or not exact.success or exact.x is None:
        raise RuntimeError(f'MILP optimum unavailable: status={exact.status}, {exact.message}')
    if np.max(np.abs(exact.x-np.rint(exact.x))) > TOLERANCE:
        raise RuntimeError('MILP result fails numerical integrality')
    optimum = checked_cover(graph, [node for node, x in zip(nodes, exact.x) if x > .5])
    value = lambda selected: sum(graph.nodes[node]['decision_cost'] for node in selected)
    if not math.isclose(value(optimum), exact.fun, abs_tol=TOLERANCE):
        raise RuntimeError('rounded MILP objective disagrees with selected vertices')
    if not lower <= value(optimum)+TOLERANCE <= value(rounded)+2*TOLERANCE:
        raise RuntimeError('lower/optimum/feasible objectives have wrong directions')
    if value(rounded) > 2*lower+TOLERANCE:
        raise RuntimeError('LP rounding fails its claimed numerical factor bound')
    return {'nodes': nodes, 'edges': edges, 'fractional': relaxation.x.tolist(),
            'edge_loads': dual.x.tolist(), 'lower': lower, 'rounded': sorted(rounded),
            'local_ratio': sorted(local_ratio), 'optimal': sorted(optimum),
            'optimal_cost': value(optimum), 'rounded_cost': value(rounded),
            'local_ratio_cost': value(local_ratio), 'solver_status': int(exact.status),
            'mip_gap': float(exact.mip_gap), 'mip_dual_bound': float(exact.mip_dual_bound)}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('usage: python karate_cover_library.py karate-networkx-3.6.1.json')
    graph = load_recorded_graph(sys.argv[1])
    result = solve_cover(graph)
    print(f'recorded support: {len(graph)} vertices, {graph.number_of_edges()} ties')
    print('constructed vertex costs: all one; interaction weights unused')
    print(f'LP primal/dual value: {result["lower"]:.6f}')
    print(f'rounded cover cost: {result["rounded_cost"]}; nodes: {result["rounded"]}')
    print(f'local-ratio cover cost: {result["local_ratio_cost"]}; nodes: {result["local_ratio"]}')
    print(f'MILP status: {result["solver_status"]}; certified optimum: {result["optimal_cost"]}')
    print(f'MILP lower bound: {result["mip_dual_bound"]:.6f}; reported relative gap: {result["mip_gap"]:.6f}')
    print(f'certificate: {result["lower"]:.6f} <= OPT <= {result["rounded_cost"]} <= {2*result["lower"]:.6f}')
