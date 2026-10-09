"""Decide d-separation by ancestral restriction, moralization and reachability.

Python 3.12; standard library only. This tests a declared DAG. It does not learn
a causal graph from data or establish that its causal assumptions are true.
"""
from collections import deque
from itertools import combinations


def separation_trace(nodes, edges, left, right, given=()):
    """Return the separation decision and every graph used to compute it.

    All labels are distinct strings. Query sets must be nonempty at their two
    endpoints and pairwise disjoint. The conditioning set may be empty.
    Moralization can add quadratically many edges; unlike enumerating every
    simple path, this method does not have an exponential path-count cost.
    """
    labels = list(nodes)
    if not labels or any(not isinstance(v, str) or not v for v in labels):
        raise ValueError('Use nonempty string node labels.')
    vertices = set(labels)
    if len(vertices) != len(labels):
        raise ValueError('Node labels must be distinct.')
    arcs = []
    for edge in edges:
        if not isinstance(edge, (tuple, list)) or len(edge) != 2:
            raise ValueError('Each directed edge needs two node labels.')
        a, b = edge
        if a not in vertices or b not in vertices or a == b:
            raise ValueError('Each edge must join two different declared nodes.')
        arcs.append((a, b))
    if len(set(arcs)) != len(arcs):
        raise ValueError('Do not repeat directed edges.')
    x, y, z = set(left), set(right), set(given)
    if not x or not y or (x | y | z) - vertices:
        raise ValueError('Query endpoints must exist and be nonempty.')
    if x & y or x & z or y & z:
        raise ValueError('The three query sets must be disjoint.')
    parents = {v: set() for v in vertices}
    children = {v: set() for v in vertices}
    for a, b in arcs:
        parents[b].add(a)
        children[a].add(b)
    pending = {v: len(parents[v]) for v in vertices}
    queue = deque(sorted(v for v in vertices if pending[v] == 0))
    order = []
    while queue:
        v = queue.popleft()
        order.append(v)
        for child in sorted(children[v]):
            pending[child] -= 1
            if pending[child] == 0:
                queue.append(child)
    if len(order) != len(vertices):
        raise ValueError('The graph must be acyclic.')

    ancestors = x | y | z
    queue = deque(sorted(ancestors))
    while queue:
        v = queue.popleft()
        for parent in sorted(parents[v] - ancestors):
            ancestors.add(parent)
            queue.append(parent)
    # Restrict first. Moralizing a collider outside this ancestral set would
    # create a false connection between its parents.
    retained = [(a, b) for a, b in arcs if a in ancestors and b in ancestors]
    undirected = {tuple(sorted((a, b))) for a, b in retained}
    joins = set()
    for child in sorted(ancestors):
        for a, b in combinations(sorted(parents[child] & ancestors), 2):
            edge = (a, b)
            if edge not in undirected:
                joins.add(edge)
            undirected.add(edge)
    surviving = {edge for edge in undirected if not (set(edge) & z)}
    neighbors = {v: set() for v in ancestors - z}
    for a, b in surviving:
        neighbors[a].add(b)
        neighbors[b].add(a)
    reached = set(x)
    queue = deque(sorted(x))
    while queue:
        v = queue.popleft()
        for nxt in sorted(neighbors[v] - reached):
            reached.add(nxt)
            queue.append(nxt)
    return {
        'separated': not bool(reached & y),
        'ancestors': sorted(ancestors),
        'retained_arrows': sorted(retained),
        'added_parent_links': sorted(joins),
        'moral_edges': sorted(undirected),
        'surviving_edges': sorted(surviving),
        'reachable_from_left': sorted(reached),
    }


def main():
    nodes = ['X', 'C', 'Y', 'D']
    edges = [('X', 'C'), ('Y', 'C'), ('C', 'D')]
    for given in [[], ['C'], ['D']]:
        trace = separation_trace(nodes, edges, ['X'], ['Y'], given)
        print('given', given, 'separated', trace['separated'])
        print('ancestors', trace['ancestors'])
        print('parent links', trace['added_parent_links'])
        print('remaining edges', trace['surviving_edges'])


if __name__ == '__main__':
    main()
