"""Real K/V pages with valid lengths, reference counts and atomic copy-on-write.

Run: python shared_pool.py
This single-threaded educational allocator implements transactions, not a GPU
kernel or a concurrent memory manager. Keys/values use [layer, head, page,
offset, coordinate]. A trusted fork requires an equivalent cache computation.
"""

from collections import Counter, deque
import hashlib
import itertools
import json
import math

import numpy as np


class SharedPool:
    def __init__(self, pages, page_size, layers=2, heads=2, width=2):
        dimensions = [pages, page_size, layers, heads, width]
        if any(not isinstance(n, int) or n < 1 for n in dimensions):
            raise ValueError("All dimensions must be positive integers.")
        self.page_size = page_size
        self.keys = np.zeros((layers, heads, pages, page_size, width), dtype=np.float64)
        self.values = np.zeros_like(self.keys)
        self.free = deque(range(pages))
        self.refs = np.zeros(pages, dtype=np.int64)
        self.tables, self.lengths = {}, {}

    def create(self, identity):
        if identity in self.tables:
            raise ValueError("Duplicate live request ID.")
        self.tables[identity], self.lengths[identity] = [], 0

    def fork(self, parent, child, prefix):
        if parent not in self.tables:
            raise KeyError(parent)
        if child in self.tables:
            raise ValueError("Duplicate live request ID.")
        if not isinstance(prefix, int) or not 0 <= prefix <= self.lengths[parent]:
            raise ValueError("Fork prefix must be within the computed parent history.")
        count = math.ceil(prefix / self.page_size)
        table = self.tables[parent][:count]
        # One reference per table entry, including a partially valid shared tail.
        for physical in table:
            self.refs[physical] += 1
        self.tables[child], self.lengths[child] = table, prefix

    def address(self, identity, position):
        if identity not in self.tables:
            raise KeyError(identity)
        if not isinstance(position, int) or not 0 <= position < self.lengths[identity]:
            raise IndexError("Position is not valid, even if its page is allocated.")
        block, offset = divmod(position, self.page_size)
        return self.tables[identity][block], offset

    def dense(self, identity):
        length = self.lengths[identity]
        shape = (self.keys.shape[0], self.keys.shape[1], length, self.keys.shape[-1])
        keys, values = np.empty(shape), np.empty(shape)
        for position in range(length):
            physical, offset = self.address(identity, position)
            keys[:, :, position] = self.keys[:, :, physical, offset]
            values[:, :, position] = self.values[:, :, physical, offset]
        return keys, values

    def append(self, identity, keys, values):
        if identity not in self.tables:
            raise KeyError(identity)
        keys, values = np.asarray(keys, dtype=np.float64), np.asarray(values, dtype=np.float64)
        if keys.ndim != 4 or keys.shape != values.shape:
            raise ValueError("Matching [layer,head,new-token,coordinate] arrays required.")
        if (keys.shape[0], keys.shape[1], keys.shape[3]) != (
            self.keys.shape[0],
            self.keys.shape[1],
            self.keys.shape[4],
        ):
            raise ValueError("Chunk dimensions disagree with the pool.")
        if not np.isfinite(keys).all() or not np.isfinite(values).all():
            raise ValueError("This fixture requires finite K/V coordinates.")
        count = keys.shape[2]
        if count == 0:
            return {"new_pages": [], "copied_valid_rows": 0, "length": self.lengths[identity]}
        old_length = self.lengths[identity]
        end = old_length + count
        old_table = self.tables[identity]
        target = old_table.copy()
        tail_valid = old_length % self.page_size
        copy_tail = bool(tail_valid and self.refs[old_table[-1]] > 1)
        new_blocks = math.ceil(end / self.page_size) - len(old_table)
        required = new_blocks + int(copy_tail)
        if len(self.free) < required:
            raise MemoryError(f"Need {required} free pages; only {len(self.free)} available.")
        reserved = list(itertools.islice(self.free, required))
        cursor, replaced = 0, None
        if copy_tail:
            replaced = old_table[-1]
            target[-1] = reserved[cursor]
            cursor += 1
        target.extend(reserved[cursor:])
        # Stage all affected pages before changing the published pool metadata.
        staged = {}
        first_block = old_length // self.page_size
        for logical in range(first_block, len(target)):
            shape = (
                self.keys.shape[0],
                self.keys.shape[1],
                self.page_size,
                self.keys.shape[-1],
            )
            staged[logical] = (np.zeros(shape), np.zeros(shape))
            if logical < len(old_table):
                keep = min(self.page_size, old_length - logical * self.page_size)
                staged[logical][0][:, :, :keep] = self.keys[:, :, old_table[logical], :keep]
                staged[logical][1][:, :, :keep] = self.values[:, :, old_table[logical], :keep]
        for row in range(count):
            logical, offset = divmod(old_length + row, self.page_size)
            staged[logical][0][:, :, offset] = keys[:, :, row]
            staged[logical][1][:, :, offset] = values[:, :, row]
        # All ordinary validation/capacity failures happen before this commit.
        for logical, (new_keys, new_values) in staged.items():
            self.keys[:, :, target[logical]] = new_keys
            self.values[:, :, target[logical]] = new_values
        for physical in reserved:
            assert self.free.popleft() == physical
            self.refs[physical] = 1
        if replaced is not None:
            self.refs[replaced] -= 1
        self.tables[identity], self.lengths[identity] = target, end
        return {
            "new_pages": reserved,
            "copied_valid_rows": tail_valid if copy_tail else 0,
            "length": end,
        }

    def release(self, identity):
        if identity not in self.tables:
            raise KeyError("Unknown or already released request.")
        for physical in self.tables.pop(identity):
            self.refs[physical] -= 1
            if self.refs[physical] == 0:
                self.free.append(physical)
        del self.lengths[identity]

    def snapshot(self):
        return {
            "tables": {key: value.copy() for key, value in self.tables.items()},
            "lengths": dict(self.lengths),
            "refs": self.refs.tolist(),
            "free": list(self.free),
            "keys_sha256": hashlib.sha256(self.keys.tobytes()).hexdigest(),
            "values_sha256": hashlib.sha256(self.values.tobytes()).hexdigest(),
        }

    def check_invariants(self):
        counts = Counter(page for table in self.tables.values() for page in table)
        assert self.refs.tolist() == [counts[i] for i in range(len(self.refs))]
        assert len(set(self.free)) == len(self.free)
        assert set(self.free) == {i for i, value in enumerate(self.refs) if value == 0}
        assert set(self.tables) == set(self.lengths)
        for identity, table in self.tables.items():
            assert len(table) == math.ceil(self.lengths[identity] / self.page_size)
            assert len(set(table)) == len(table)


def fixture(length, offset=0):
    keys = np.arange(2 * 2 * length * 2, dtype=np.float64).reshape(2, 2, length, 2) + offset
    return keys, -keys - 0.5


def verify():
    cases = []
    for parent_length, prefix in [(5, 4), (6, 6), (5, 0), (7, 5), (8, 8)]:
        for order in [("parent", "child"), ("child", "parent")]:
            pool = SharedPool(8, 3 if parent_length < 7 else 4)
            pool.create("parent")
            original = fixture(parent_length)
            pool.append("parent", *original)
            pool.fork("parent", "child", prefix)
            old = pool.dense("child")
            for actual, expected in zip(old, original):
                np.testing.assert_array_equal(actual, expected[:, :, :prefix])
            added = fixture(3, 200)
            delta = pool.append("child", *added)
            for actual, expected in zip(pool.dense("parent"), original):
                np.testing.assert_array_equal(actual, expected)
            for actual, before, suffix in zip(pool.dense("child"), old, added):
                np.testing.assert_array_equal(actual, np.concatenate((before, suffix), axis=2))
            pool.check_invariants()
            cases.append(
                {
                    "parent_length": parent_length,
                    "prefix": prefix,
                    "page": pool.page_size,
                    "append": delta,
                    "state": pool.snapshot(),
                    "release_order": order,
                }
            )
            for identity in order:
                pool.release(identity)
                pool.check_invariants()
            assert len(pool.free) == 8
            pool.create("new")
            pool.append("new", *fixture(2, 900))
            np.testing.assert_array_equal(pool.dense("new")[0], fixture(2, 900)[0])
            pool.check_invariants()
    pool = SharedPool(2, 3)
    pool.create("parent")
    pool.append("parent", *fixture(5))
    pool.fork("parent", "child", 4)
    before = pool.snapshot()
    try:
        pool.append("child", *fixture(1, 100))
        raise AssertionError("Expected atomic COW allocation failure.")
    except MemoryError:
        assert pool.snapshot() == before
    pool.release("child")
    pool.append("parent", *fixture(1, 100))
    pool.check_invariants()
    try:
        pool.address("parent", 6)
        raise AssertionError("Allocated tail must not become a valid token.")
    except IndexError:
        pass
    return {
        "cases": cases,
        "atomic_oom": before,
        "after_release_and_private_append": pool.snapshot(),
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
