"""Token-granularity compressed prefix tree with pinning and leaf LRU.

Each edge stands for a contiguous K/V range. Payloads are token identities here.
This pedagogical reference scans leaves O(nodes); it is not a GPU allocator.
"""

from dataclasses import dataclass, field
import json

from prefix_identity import token_ids


def common_length(a, b):
    length = 0
    for x, y in zip(a, b):
        if x != y:
            break
        length += 1
    return length


@dataclass(eq=False)
class Node:
    number: int
    edge: tuple
    parent: object = None
    children: dict = field(default_factory=dict)
    pins: int = 0
    touched: int = 0


class RadixPrefix:
    def __init__(self):
        self.root = Node(0, ())
        self.next_number = 1
        self.clock = 0
        self.active = {}

    def _node(self, edge, parent):
        result = Node(self.next_number, tuple(edge), parent)
        self.next_number += 1
        return result

    def _touch(self, node):
        self.clock += 1
        node.touched = self.clock

    def insert(self, ids):
        """A split inherits descendant pins; active handles retain node identity."""
        remaining = token_ids(ids)
        node = self.root
        while remaining:
            child = node.children.get(remaining[0])
            if child is None:
                child = self._node(remaining, node)
                node.children[remaining[0]] = child
                self._touch(child)
                return child
            length = common_length(child.edge, remaining)
            if length < len(child.edge):
                middle = self._node(child.edge[:length], node)
                middle.pins = child.pins
                middle.touched = child.touched
                node.children[middle.edge[0]] = middle
                child.edge = child.edge[length:]
                child.parent = middle
                middle.children[child.edge[0]] = child
                child = middle
            self._touch(child)
            remaining = remaining[length:]
            node = child
        return node

    def match(self, ids):
        remaining = token_ids(ids)
        node = self.root
        matched, segments = 0, []
        while remaining and remaining[0] in node.children:
            child = node.children[remaining[0]]
            length = common_length(child.edge, remaining)
            matched += length
            segments.append({"node": child.number, "matched_in_edge": length})
            if length < len(child.edge):
                break
            remaining = remaining[length:]
            node = child
        return {"matched_tokens": matched, "segments": segments}

    def pin(self, request, ids):
        if request in self.active:
            raise ValueError("Request already pinned.")
        endpoint = self.insert(ids)
        self.active[request] = endpoint
        node = endpoint
        while node is not self.root:
            node.pins += 1
            self._touch(node)
            node = node.parent

    def unpin(self, request):
        if request not in self.active:
            raise ValueError("Request is not pinned.")
        node = self.active.pop(request)
        while node is not self.root:
            node.pins -= 1
            self._touch(node)
            node = node.parent

    def nodes(self):
        pending = [self.root]
        while pending:
            node = pending.pop()
            yield node
            pending.extend(reversed(list(node.children.values())))

    def evict_leaf(self):
        candidates = [
            n for n in self.nodes() if n is not self.root and not n.children and n.pins == 0
        ]
        if not candidates:
            return None
        victim = min(candidates, key=lambda n: (n.touched, n.number))
        del victim.parent.children[victim.edge[0]]
        return {"node": victim.number, "removed_tokens": list(victim.edge)}

    def snapshot(self):
        return [
            {
                "node": n.number,
                "parent": None if n.parent is None else n.parent.number,
                "edge": list(n.edge),
                "pins": n.pins,
                "touched": n.touched,
                "children": [c.number for c in n.children.values()],
            }
            for n in self.nodes()
        ]

    def invariant(self):
        expected = {n: 0 for n in self.nodes()}
        for endpoint in self.active.values():
            node = endpoint
            while node is not self.root:
                expected[node] += 1
                node = node.parent
        for node, count in expected.items():
            assert node.pins == count
            for first, child in node.children.items():
                assert child.parent is node and child.edge and child.edge[0] == first
        return True


def order_work(prompts):
    """A cache retaining only the previous path, capacity >= longest path.

    Requests are known offline; no decode growth, arrival waits or other work.
    DFS visits every distinct token edge once under these assumptions.
    """
    previous, rows = (), []
    for ids in prompts:
        ids = token_ids(ids)
        shared = common_length(previous, ids)
        rows.append({"ids": list(ids), "reused": shared, "new": len(ids) - shared})
        previous = ids
    distinct = {tuple(ids[:end]) for ids in prompts for end in range(1, len(ids) + 1)}
    return {
        "rows": rows,
        "new_queries": sum(r["new"] for r in rows),
        "distinct_edge_lower_bound": len(distinct),
        "capacity_tokens": max(map(len, prompts), default=0),
    }


def verify():
    tree = RadixPrefix()
    tree.pin("A", [1, 2, 3, 4, 5])
    before = tree.snapshot()
    tree.insert([1, 2, 3, 9])
    tree.insert([1, 2, 8])
    tree.invariant()
    split = tree.snapshot()
    assert tree.match([1, 2, 3, 4, 7])["matched_tokens"] == 4
    assert tree.match([])["matched_tokens"] == 0
    removed = []
    while (victim := tree.evict_leaf()) is not None:
        removed.append(victim)
        tree.invariant()
    assert tree.match([1, 2, 3, 4, 5])["matched_tokens"] == 5
    protected = tree.snapshot()
    tree.unpin("A")
    while tree.evict_leaf() is not None:
        tree.invariant()
    assert len(tree.snapshot()) == 1
    a = list(range(1, 11))
    b = list(range(1, 9)) + [11, 12]
    c = [1, 2, 3, 4, 20, 21, 22, 23, 24, 25]
    dfs, interleaved = order_work([a, b, c]), order_work([a, c, b])
    assert dfs["new_queries"] == dfs["distinct_edge_lower_bound"] == 18
    assert interleaved["new_queries"] == 22
    return {
        "before": before,
        "split": split,
        "evictions": removed,
        "protected": protected,
        "after_unpin": tree.snapshot(),
        "dfs": dfs,
        "interleaved": interleaved,
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
