"""Stable clustering-feature summaries and a complete bounded-capacity CF tree."""
from dataclasses import dataclass, field
import numpy as np
from sklearn.cluster import Birch
from clustering_core import points_array, squared_to_center


@dataclass
class Summary:
    count: int
    mean: object
    scatter: float

    @classmethod
    def empty(cls):
        return cls(0, None, 0.0)

    @classmethod
    def point(cls, row):
        return cls(1, np.asarray(row, dtype=float).copy(), 0.0)

    def merge(self, other):
        if self.count == 0:
            return Summary(other.count, None if other.mean is None else other.mean.copy(), other.scatter)
        if other.count == 0:
            return Summary(self.count, self.mean.copy(), self.scatter)
        count = self.count + other.count
        delta = other.mean - self.mean
        with np.errstate(over="ignore", invalid="ignore"):
            mean = self.mean + (other.count / count) * delta
            scatter = (self.scatter + other.scatter
                       + (self.count / count) * other.count * float(delta @ delta))
        if not np.isfinite(mean).all() or not np.isfinite(scatter):
            raise ValueError("Summary is not representable; center and rescale the coordinates.")
        return Summary(count, mean, scatter)

    @property
    def radius(self):
        return np.sqrt(self.scatter / self.count) if self.count else 0.0

    def restricted_cost(self, center):
        if not self.count:
            return 0.0
        return self.scatter + self.count * float(squared_to_center(self.mean[None, :], center)[0])


@dataclass
class Entry:
    summary: Summary
    child: object = None


@dataclass
class Node:
    leaf: bool
    entries: list = field(default_factory=list)
    previous: object = None
    following: object = None

    def summary(self):
        result = Summary.empty()
        for entry in self.entries:
            result = result.merge(entry.summary)
        return result


class CFTree:
    def __init__(self, dimension, threshold=0.5, capacity=3):
        if not isinstance(dimension, int) or dimension < 1:
            raise ValueError("dimension must be a positive integer.")
        if not isinstance(capacity, int) or capacity < 2:
            raise ValueError("capacity must be an integer of at least two.")
        if not np.isfinite(threshold) or threshold < 0:
            raise ValueError("threshold must be finite and nonnegative.")
        self.dimension = dimension
        self.threshold = float(threshold)
        self.capacity = capacity
        self.root = Node(True)
        self.first_leaf = self.root

    def _nearest(self, node, mean):
        distances = [float(squared_to_center(entry.summary.mean[None, :], mean)[0])
                     for entry in node.entries]
        return int(np.argmin(distances))

    def _split(self, node):
        entries = node.entries
        # Farthest seeds: deterministic pair order resolves equal distances.
        pairs = [(float(squared_to_center(entries[i].summary.mean[None, :],
                                         entries[j].summary.mean)[0]), i, j)
                 for i in range(len(entries)) for j in range(i + 1, len(entries))]
        _, left_seed, right_seed = max(pairs, key=lambda item: (item[0], -item[1], -item[2]))
        left, right = [entries[left_seed]], [entries[right_seed]]
        for i, entry in enumerate(entries):
            if i in {left_seed, right_seed}:
                continue
            left_distance = squared_to_center(entry.summary.mean[None, :], entries[left_seed].summary.mean)[0]
            right_distance = squared_to_center(entry.summary.mean[None, :], entries[right_seed].summary.mean)[0]
            (left if left_distance <= right_distance else right).append(entry)
        node.entries = left
        sibling = Node(node.leaf, right)
        if node.leaf:
            sibling.previous = node
            sibling.following = node.following
            if node.following is not None:
                node.following.previous = sibling
            node.following = sibling
        return sibling

    def _insert(self, node, incoming):
        if not node.entries:
            node.entries.append(Entry(incoming))
        else:
            nearest = self._nearest(node, incoming.mean)
            entry = node.entries[nearest]
            if node.leaf:
                merged = entry.summary.merge(incoming)
                if merged.radius <= self.threshold:
                    entry.summary = merged
                else:
                    node.entries.append(Entry(incoming))
            else:
                sibling = self._insert(entry.child, incoming)
                entry.summary = entry.child.summary()
                if sibling is not None:
                    node.entries.append(Entry(sibling.summary(), sibling))
        return self._split(node) if len(node.entries) > self.capacity else None

    def insert(self, row):
        row = np.asarray(row, dtype=float)
        if row.shape != (self.dimension,) or not np.isfinite(row).all():
            raise ValueError("Supply one finite row in the tree's feature dimension.")
        sibling = self._insert(self.root, Summary.point(row))
        if sibling is not None:
            previous_root = self.root
            self.root = Node(False, [Entry(previous_root.summary(), previous_root),
                                     Entry(sibling.summary(), sibling)])
        return self

    def partial_fit(self, points):
        points = points_array(points)
        if points.shape[1] != self.dimension:
            raise ValueError("Input dimension differs from the tree.")
        for row in points:
            self.insert(row)
        return self

    def leaves(self):
        result = []
        node = self.first_leaf
        while node is not None:
            result.append(node)
            node = node.following
        return result

    def subclusters(self):
        return [entry.summary for leaf in self.leaves() for entry in leaf.entries]

    def state(self):
        # State exposes actual summary structure, not recoverable original rows.
        # IDs name paths in this snapshot; insertion may change these paths.
        paths = {}
        def describe(node, path="root"):
            paths[id(node)] = path
            return {"node_id": path, "leaf": node.leaf, "entries": [
                {"entry_id": path + "/" + str(i),
                 "count": entry.summary.count, "mean": entry.summary.mean.tolist(),
                 "scatter": entry.summary.scatter,
                 "child": None if node.leaf else describe(entry.child, path + "/" + str(i))}
                for i, entry in enumerate(node.entries)]}
        root = describe(self.root)
        return {"dimension": self.dimension, "threshold": self.threshold,
                "capacity": self.capacity, "root": root,
                "linked_leaf_ids": [paths[id(node)] for node in self.leaves()],
                "leaf_entry_counts": [len(node.entries) for node in self.leaves()]}


def main():
    stream = np.array([[0.0], [0.2], [2.0], [4.0], [6.0], [8.0], [10.0]])
    tree = CFTree(1, threshold=0.15, capacity=2)
    for row in stream:
        tree.insert(row)
        print("arrival / total / linked leaves:", row.tolist(), tree.root.summary().count,
              [len(node.entries) for node in tree.leaves()])
    print("complete summary tree:", tree.state())
    ordinary = Birch(threshold=0.15, branching_factor=2, n_clusters=None)
    for row in stream:
        ordinary.partial_fit(row[None, :])
    print("scratch subcluster centers:", [s.mean.tolist() for s in tree.subclusters()])
    print("ordinary subcluster centers:", ordinary.subcluster_centers_.tolist())
    summary = Summary.empty()
    members = np.array([[0.0], [0.2]])
    for row in members:
        summary = summary.merge(Summary.point(row))
    print("restricted cost / direct cost:", summary.restricted_cost([3.0]),
          float(squared_to_center(members, [3.0]).sum()))
    offset = np.array([1e12, 1e12 + 1, 1e12 + 2])
    stable = Summary.empty()
    for value in offset:
        stable = stable.merge(Summary.point([value]))
    print("offset raw / stable scatter:", float(offset @ offset - offset.sum() ** 2 / len(offset)),
          stable.scatter)


if __name__ == "__main__":
    main()
