"""Ordinary maintained solvers for the lesson's already explained contracts.

Requires NumPy, SciPy and NetworkX. These fixtures are synthetic. Dense
assignment uses Jonker-Volgenant rather than the scratch residual solver.
Integer-demand network simplex allows missing arcs/required flow. A
weighted bipartite cut is exact; general vertex cover needs another route.
Christofides uses a complete nonnegative symmetric metric graph and an
ordinary general matcher, not the tiny exhaustive matching oracle.
"""
from itertools import permutations, product
import math
import numpy as np
import networkx as nx
from scipy.optimize import linear_sum_assignment


def assignment_routes(costs, required):
    if not costs or not costs[0]:
        raise ValueError('nonempty rectangular matrix required')
    rows, cols = len(costs), len(costs[0])
    if any(len(row) != cols for row in costs):
        raise ValueError('rectangular matrix required')
    if type(required) is not int or not 0 <= required <= min(rows, cols):
        raise ValueError('required assignment cardinality outside dimensions')
    if any(value is not None and type(value) is not int for row in costs for value in row):
        raise ValueError('integer costs or None for missing arcs required')
    graph = nx.DiGraph()
    graph.add_node('source', demand=-required)
    graph.add_node('sink', demand=required)
    for i in range(rows):
        graph.add_edge('source', ('worker', i), capacity=1, weight=0)
    for j in range(cols):
        graph.add_edge(('job', j), 'sink', capacity=1, weight=0)
    for i, row in enumerate(costs):
        for j, value in enumerate(row):
            if value is not None:
                graph.add_edge(('worker', i), ('job', j), capacity=1, weight=value)
    value, flow = nx.network_simplex(graph)
    chosen = [(i, j) for i in range(rows) for j in range(cols)
              if flow.get(('worker', i), {}).get(('job', j), 0)]
    assert len(chosen) == required
    assert len({i for i, _ in chosen}) == len({j for _, j in chosen}) == required
    assert sum(costs[i][j] for i, j in chosen) == value
    return value, chosen


def weighted_bipartite_cover(left_costs, right_costs, edges):
    # M exceeds the cost of buying all vertices, so an optimum cut cannot
    # cross a left-to-right coverage arc instead of covering its edge.
    if any(type(c) is not int or c < 0 for c in left_costs+right_costs):
        raise ValueError('nonnegative integer vertex costs required')
    graph = nx.DiGraph()
    graph.add_nodes_from(['source','sink'])
    for i, cost in enumerate(left_costs):
        graph.add_edge('source', ('left',i), capacity=cost)
    for j, cost in enumerate(right_costs):
        graph.add_edge(('right',j), 'sink', capacity=cost)
    large = 1+sum(left_costs)+sum(right_costs)
    for i,j in edges:
        if not 0 <= i < len(left_costs) or not 0 <= j < len(right_costs):
            raise ValueError('unknown bipartite endpoint')
        graph.add_edge(('left',i),('right',j),capacity=large)
    value, (source_side, sink_side) = nx.minimum_cut(graph,'source','sink')
    left=[i for i in range(len(left_costs)) if ('left',i) in sink_side]
    right=[j for j in range(len(right_costs)) if ('right',j) in source_side]
    assert all(i in left or j in right for i,j in edges)
    assert sum(left_costs[i] for i in left)+sum(right_costs[j] for j in right)==value
    return value,left,right


def metric_route(points):
    # This diagnostic also enumerates the exact optimum: keep that scope small.
    # Integer coordinates make Manhattan distances and all sums exact.
    if (not 3 <= len(points) <= 9
            or any(len(point) != 2
                   or any(type(x) is not int or abs(x) > 1_000_000 for x in point)
                   for point in points)):
        raise ValueError('3–9 points with two integer coordinates in [-1000000,1000000] required')
    graph=nx.complete_graph(len(points))
    for a,b in graph.edges:
        graph[a][b]['weight']=sum(abs(x-y) for x,y in zip(points[a],points[b]))
    if any(type(d['weight']) is not int or not 0 <= d['weight'] <= 4_000_000
           or not math.isfinite(d['weight']) for _, _, d in graph.edges(data=True)):
        raise ValueError('derived Manhattan distance outside exact finite domain')
    distance=lambda a,b:0 if a==b else graph[a][b]['weight']
    for a,b,c in product(graph,repeat=3):
        assert distance(a,c)<=distance(a,b)+distance(b,c)
    tree=nx.minimum_spanning_tree(graph)
    odd=[v for v in tree if tree.degree(v)%2]
    matching=nx.min_weight_matching(graph.subgraph(odd))
    assert len(matching)*2==len(odd)
    # The union retains parallel copies, including an existing tree edge.
    repaired=nx.MultiGraph(tree)
    repaired.add_edges_from((a,b,{'weight':distance(a,b)}) for a,b in matching)
    assert nx.is_eulerian(repaired)
    walk=list(nx.eulerian_circuit(repaired,source=0))
    assert len(walk)==repaired.number_of_edges()
    tour=nx.approximation.christofides(graph,tree=tree)
    assert tour[0]==tour[-1] and len(tour)==len(graph)+1
    assert set(tour[:-1])==set(graph)
    cost=sum(distance(a,b) for a,b in zip(tour,tour[1:]))
    # Tiny enumeration checks this five-point fixture, not library complexity.
    exact=min(sum(distance(a,b) for a,b in zip(route,route[1:]))
              for order in permutations(range(1,len(graph)))
              for route in [(0,)+order+(0,)])
    tree_cost = sum(d['weight'] for _, _, d in tree.edges(data=True))
    matching_cost = sum(distance(a,b) for a,b in matching)
    quantities = (tree_cost, matching_cost, cost, exact)
    if any(type(value) is not int or not 0 <= value <= 36_000_000
           or not math.isfinite(value) for value in quantities):
        raise ValueError('derived certificate must have exact finite nonnegative totals')
    if exact == 0:
        assert cost == 0  # All-coincident points: no quotient with denominator zero.
    elif not math.isfinite(cost / exact):
        raise ValueError('positive-optimum comparison ratio must be finite')
    assert 2*cost<=3*exact  # Exact integer certificate, without division.
    return quantities


if __name__=='__main__':
    costs=[[1,2,8],[2,9,8],[8,8,1]]
    row,col=linear_sum_assignment(np.array(costs))
    pairs=list(zip(row.tolist(),col.tolist()))
    print('dense full assignment:',pairs,'cost:',sum(costs[i][j] for i,j in pairs))
    for cardinality in [1,2,3]:
        cost,pairs=assignment_routes(costs,cardinality)
        print('required flow:',cardinality,'cost:',cost,'pairs:',pairs)
    for cardinality in [1,2]:
        cost,pairs=assignment_routes([[-4,2],[0,None]],cardinality)
        print('signed/missing size:',cardinality,'cost:',cost,'pairs:',pairs)
    try:
        assignment_routes([[None,2],[None,1]],2)
    except nx.NetworkXUnfeasible:
        print('missing-edge full assignment: infeasible')
    print('weighted bipartite cover cost/left/right:',weighted_bipartite_cover([1,4],[2,3],[(0,0),(0,1),(1,1)]))
    print('metric MST/matching/tour/tiny optimum:',metric_route([(0,0),(2,0),(2,2),(0,2),(1,1)]))
