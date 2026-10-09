"""OPTICS with one indexed pending slot per observation.

Run: python optics_ordering.py
Tie rule: minimum (reachability, input position); equal proposals keep predecessor.
"""
from dataclasses import dataclass
import math
from density_neighbourhoods import Neighbourhoods, positive_count, radius


class IndexedHeap:
    def __init__(self, size, trace=None):
        self.slots = []
        self.position = [-1] * size
        self.key = [math.inf] * size
        self.predecessor = [-1] * size
        self.trace = trace

    def record(self, operation, committed=True):
        if self.trace is not None:
            self.trace.append((operation, committed, tuple(self.slots),
                               tuple(self.position), tuple(self.key),
                               tuple(self.predecessor)))

    def less(self, a, b):
        return (self.key[self.slots[a]], self.slots[a]) < (
            self.key[self.slots[b]], self.slots[b])

    def swap(self, a, b, committed=False):
        self.slots[a], self.slots[b] = self.slots[b], self.slots[a]
        self.position[self.slots[a]] = a
        self.position[self.slots[b]] = b
        self.record("swap", committed)

    def improve(self, row, value, predecessor):
        if not math.isfinite(value) or value < 0:
            raise ValueError("a pending reachability must be finite and nonnegative")
        if not value < self.key[row]:
            self.record("unchanged")
            return False
        self.key[row], self.predecessor[row] = value, predecessor
        slot = self.position[row]
        if slot == -1:
            slot = len(self.slots)
            self.slots.append(row)
            self.position[row] = slot
        self.record("write key and predecessor", False)
        while slot:
            parent = (slot - 1) // 2
            if not self.less(slot, parent):
                break
            self.swap(slot, parent)
            slot = parent
        self.record("improvement complete")
        return True

    def pop(self):
        if not self.slots:
            raise IndexError("empty indexed heap")
        row = self.slots[0]
        last = self.slots.pop()
        self.position[row] = -1
        if self.slots:
            self.slots[0] = last
            self.position[last] = 0
            self.record("remove minimum and move last", False)
            slot = 0
            while 2 * slot + 1 < len(self.slots):
                child = 2 * slot + 1
                if child + 1 < len(self.slots) and self.less(child + 1, child):
                    child += 1
                if not self.less(child, slot):
                    break
                self.swap(slot, child)
                slot = child
        self.record("extraction complete")
        return row

    def __bool__(self):
        return bool(self.slots)


@dataclass(frozen=True)
class Ordering:
    ordering: tuple
    core_distances: tuple
    reachability: tuple
    predecessor: tuple
    max_eps: float
    minimum: int
    trace: tuple


def optics(provider, minimum, max_eps=math.inf, keep_trace=False):
    minimum = positive_count(minimum)
    max_eps = radius(max_eps, allow_infinity=True)
    n = len(provider.rows)
    if not 2 <= minimum <= n:
        raise ValueError("this OPTICS route requires 2 <= minimum <= row count")
    if keep_trace and n > 64:
        raise ValueError("full teaching traces are limited to 64 observations")
    trace = [] if keep_trace else None
    heap = IndexedHeap(n, trace)
    core = tuple(provider.selected_core_radius(i, minimum, max_eps) for i in range(n))
    processed, ordering = [False] * n, []

    def process(row):
        processed[row] = True
        ordering.append(row)
        if math.isinf(core[row]):
            return
        for candidate, distance in provider.neighbours(row, max_eps):
            if not processed[candidate]:
                heap.improve(candidate, max(core[row], distance), row)

    for start in range(n):
        if processed[start]:
            continue
        process(start)  # An unreached component starts with infinite reachability.
        while heap:
            row = heap.pop()
            if processed[row]:
                raise AssertionError("indexed pending rows must be unprocessed")
            process(row)
    return Ordering(tuple(ordering), core, tuple(heap.key),
                    tuple(heap.predecessor), max_eps, minimum, tuple(trace or ()))


def assert_heap(heap):
    assert len(heap.slots) == len(set(heap.slots))
    assert all(heap.position[row] == slot for slot, row in enumerate(heap.slots))
    assert all(heap.position[row] == -1 for row in range(len(heap.position))
               if row not in heap.slots)
    assert all(not heap.less(slot, (slot - 1) // 2)
               for slot in range(1, len(heap.slots)))


def main():
    from sklearn.cluster import OPTICS
    import numpy as np
    # Supplied heap witness: positions Q=0, R=1, S=2, T=3, P=4, A=5.
    heap = IndexedHeap(6)
    for row, key in ((1, 1), (2, 1.5), (0, 2), (3, 3)):
        heap.improve(row, key, 5)
    assert heap.slots == [1, 2, 0, 3]
    assert_heap(heap)
    assert not heap.improve(0, 2.5, 4)
    assert heap.predecessor[0] == 5
    heap.improve(0, 0.5, 4)
    assert_heap(heap)
    assert heap.slots == [0, 2, 1, 3]
    print("improved slots", ["QRSTPA"[row] for row in heap.slots],
          "Q predecessor", "QRSTPA"[heap.predecessor[0]])
    assert heap.pop() == 0
    assert_heap(heap)
    print("after Q extraction", ["QRSTPA"[row] for row in heap.slots])
    # New four-row example; this is not a replay of the retained ten-row study.
    provider = Neighbourhoods(((0,), (1,), (4,), (5,)), ("v0", "v1", "v2", "v3"))
    for cap in (math.inf, 1.0):
        result = optics(provider, 2, cap)
        ordinary = OPTICS(min_samples=2, max_eps=cap, cluster_method="dbscan",
                          eps=1, algorithm="brute").fit(np.asarray(provider.rows))
        np.testing.assert_array_equal(result.ordering, ordinary.ordering_)
        np.testing.assert_allclose(result.core_distances, ordinary.core_distances_)
        np.testing.assert_allclose(result.reachability, ordinary.reachability_)
        np.testing.assert_array_equal(result.predecessor, ordinary.predecessor_)
        print("cap", cap, "order", [provider.ids[i] for i in result.ordering],
              "reachability", list(result.reachability),
              "predecessor", list(result.predecessor))


if __name__ == "__main__":
    main()
