"""Equal-event hierarchy, linear-record condensation and nonoverlapping EOM.

Supported finite core: n>=2, minimum size>=2, a positive finite weighted tree.
Root is excluded; parent wins an exact EOM tie. No infinite-lambda arithmetic.
"""
from dataclasses import dataclass
import itertools
import math
from disjoint_set import DisjointSet
from mutual_reachability_tree import Edge


@dataclass(frozen=True)
class MergeNode:
    children: tuple
    distance: float
    count: int


@dataclass(frozen=True)
class MergeTree:
    row_count: int
    nodes: tuple
    root: int


def build_hierarchy(n, edges):
    if type(n) is not int or n < 2:
        raise ValueError("hierarchy requires at least two integer-indexed rows")
    edges = tuple(edges)
    if len(edges) != n - 1:
        raise ValueError("supply exactly n-1 tree edges")
    for edge in edges:
        if any(type(v) is not int or not 0 <= v < n for v in (edge.left, edge.right)):
            raise ValueError("edge endpoints must be input positions")
        if not math.isfinite(edge.weight) or edge.weight <= 0:
            raise ValueError("UNSUPPORTED_NONPOSITIVE_OR_NONFINITE_MERGE_LENGTH")
    nodes = [MergeNode((), 0.0, 1) for _ in range(n)]
    dsu, node_for_root = DisjointSet(n), {i: i for i in range(n)}
    sorted_edges = sorted(edges, key=lambda e: (e.weight, e.left, e.right))
    for length, batch_iterator in itertools.groupby(sorted_edges, key=lambda e: e.weight):
        batch = tuple(batch_iterator)
        old_roots = {dsu.find(v) for edge in batch for v in (edge.left, edge.right)}
        previous = {root: node_for_root[root] for root in old_roots}
        for edge in batch:
            if not dsu.union(edge.left, edge.right):
                raise ValueError("tree contains a cycle or duplicate edge")
        merged = {}
        for root, node in previous.items():
            merged.setdefault(dsu.find(root), []).append(node)
        for root, child_nodes in sorted(merged.items()):
            children = tuple(sorted(child_nodes))
            nodes.append(MergeNode(children, float(length),
                                   sum(nodes[child].count for child in children)))
            node_for_root[root] = len(nodes) - 1
    if dsu.count != 1:
        raise ValueError("tree is disconnected")
    return MergeTree(n, tuple(nodes), node_for_root[dsu.find(0)])


@dataclass(frozen=True)
class CondensedEdge:
    parent: int
    kind: str
    child: int
    level: float
    count: int


@dataclass(frozen=True)
class Branch:
    parent: int
    birth: float
    stability: float
    maximum_exit: float


@dataclass(frozen=True)
class DensityHierarchy:
    tree: MergeTree
    branches: tuple
    records: tuple
    selected: tuple
    labels: tuple
    strengths: tuple
    outlier_scores: tuple


def condense(tree, minimum_size, method="eom"):
    n = tree.row_count
    if type(minimum_size) is not int or not 2 <= minimum_size <= n:
        raise ValueError("minimum cluster size must be an integer between 2 and n")
    if method not in ("eom", "leaf"):
        raise ValueError("selection method must be eom or leaf")
    work = [{"parent": -1, "birth": 0.0, "stability": 0.0, "maximum": 0.0}]
    records = []

    def emit(branch, kind, child, level, count):
        records.append(CondensedEdge(branch, kind, child, level, count))
        work[branch]["stability"] += count * (level - work[branch]["birth"])
        work[branch]["maximum"] = max(work[branch]["maximum"], level)

    def depart_subtree(node, branch, level):
        pending = [node]
        while pending:
            current = pending.pop()
            children = tree.nodes[current].children
            if children:
                pending.extend(reversed(children))
            else:
                emit(branch, "point", current, level, 1)

    pending = [(tree.root, 0)]
    while pending:
        node, branch = pending.pop()
        current = tree.nodes[node]
        level = 1.0 / current.distance
        if not math.isfinite(level):
            raise ValueError("UNSUPPORTED_NONFINITE_LAMBDA")
        qualifying = [child for child in current.children
                      if tree.nodes[child].count >= minimum_size]
        if len(qualifying) >= 2:
            new_tasks = []
            for child in current.children:
                count = tree.nodes[child].count
                if count < minimum_size:
                    depart_subtree(child, branch, level)
                else:
                    child_branch = len(work)
                    work.append({"parent": branch, "birth": level,
                                 "stability": 0.0, "maximum": 0.0})
                    emit(branch, "branch", child_branch, level, count)
                    new_tasks.append((child, child_branch))
            pending.extend(reversed(new_tasks))
        elif len(qualifying) == 1:
            survivor = qualifying[0]
            for child in current.children:
                if child != survivor:
                    depart_subtree(child, branch, level)
            pending.append((survivor, branch))  # Same identity; birth does not reset.
        else:
            depart_subtree(node, branch, level)
    if any(not math.isfinite(b["stability"]) for b in work):
        raise ValueError("UNSUPPORTED_NONFINITE_STABILITY")
    branches = tuple(Branch(b["parent"], b["birth"], b["stability"], b["maximum"])
                     for b in work)
    outgoing = [[] for _ in branches]
    children = [[] for _ in branches]
    for record in records:
        outgoing[record.parent].append(record)
        if record.kind == "branch":
            children[record.parent].append(record.child)
    best, choose_parent = [0.0] * len(branches), [False] * len(branches)
    for branch in reversed(range(len(branches))):
        descendant_total = math.fsum(best[child] for child in children[branch])
        choose_parent[branch] = (not children[branch] if method == "leaf"
                                 else branches[branch].stability >= descendant_total)
        best[branch] = (branches[branch].stability if choose_parent[branch]
                        else descendant_total)
    selected, pending = [], [0]
    while pending:
        branch = pending.pop()
        if branch != 0 and choose_parent[branch]:
            selected.append(branch)
        else:
            pending.extend(reversed(children[branch]))
    selected = tuple(sorted(selected))
    label_for_branch = {branch: label for label, branch in enumerate(selected)}
    labels, strengths = [-1] * n, [0.0] * n
    # Once a selected branch is left, carry its departure level to all descendants.
    pending = [(0, -1, None)]
    for_branch_maximum = [branch.maximum_exit for branch in branches]
    for branch in reversed(range(len(branches))):
        for child in children[branch]:
            for_branch_maximum[branch] = max(for_branch_maximum[branch],
                                            for_branch_maximum[child])
    outliers = [0.0] * n
    while pending:
        branch, owner, owner_departure = pending.pop()
        if branch in label_for_branch:
            owner, owner_departure = branch, None
        for record in outgoing[branch]:
            if record.kind == "branch":
                departure = record.level if owner != -1 and owner_departure is None else owner_departure
                pending.append((record.child, owner, departure))
            else:
                row = record.child
                reference = for_branch_maximum[branch]
                outliers[row] = max(0.0, min(1.0, (reference - record.level) / reference))
                if owner != -1:
                    departure = record.level if owner_departure is None else owner_departure
                    maximum = branches[owner].maximum_exit
                    labels[row] = label_for_branch[owner]
                    strengths[row] = min(departure, maximum) / maximum
    return DensityHierarchy(tree, branches, tuple(records), selected, tuple(labels),
                            tuple(strengths), tuple(outliers))


def tree_from_chain(weights):
    return build_hierarchy(len(weights) + 1,
                           [Edge(weight, i, i + 1) for i, weight in enumerate(weights)])


def main():
    cases = [
        ("shrink size3", [1/8, 1, 1/8, 1/3, 1/6, 1/6], 3, 0),
        ("shrink size2", [1/8, 1, 1/8, 1/3, 1/6, 1/6], 2, 33),
        ("split size3", [1/2, 1/2, 1, 1/3, 1/6, 1/6], 3, 20),
        ("N size2", [1/2, 1/4, 1, 1/3, 1/6, 1/6], 2, 24),
    ]
    for name, weights, size, expected in cases:
        result = condense(tree_from_chain(weights), size)
        score = math.fsum(result.branches[b].stability for b in result.selected)
        assert math.isclose(score, expected, rel_tol=0, abs_tol=1e-12)
        groups = [[row for row, label in enumerate(result.labels) if label == group]
                  for group in range(len(result.selected))]
        print(name, "areas", [round(b.stability, 12) for b in result.branches],
              "selected rows", groups, "total", score)
        assert all(0 <= value <= 1 for value in result.strengths + result.outlier_scores)
    for departure, expected in ((4, 15), (5, 15), (6, 21)):
        weights = [1/2, 1/2, 1, 1/departure, 1/departure, 1/3,
                   1/departure, 1/departure]
        result = condense(tree_from_chain(weights), 3)
        score = math.fsum(result.branches[b].stability for b in result.selected)
        assert math.isclose(score, expected, rel_tol=0, abs_tol=1e-12)
        groups = [[row for row, label in enumerate(result.labels) if label == group]
                  for group in range(len(result.selected))]
        print("child departure", departure, "selected rows", groups, "total", score)
    print("split strengths", list(condense(tree_from_chain(cases[2][1]), 3).strengths))
    print("split GLOSH-style scores", list(condense(tree_from_chain(cases[2][1]), 3).outlier_scores))
    try:
        tree_from_chain([0.0])
    except ValueError as error:
        print("zero-length status", str(error))
    else:
        raise AssertionError("zero-length merge must not enter infinite-lambda arithmetic")


if __name__ == "__main__":
    main()
