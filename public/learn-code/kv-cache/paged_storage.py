"""Finite block-pool reference: logical positions map to physical blocks.

Run: python paged_storage.py
NumPy gather materializes contiguous records for comparison. This is not a
PagedAttention GPU kernel, request scheduler or shared-prefix COW implementation.
"""
import json
import numpy as np


class PagedStorage:
    def __init__(self, blocks=3, block_size=4, width=2):
        if min(blocks, block_size, width) < 1:
            raise ValueError("Pool dimensions must be positive")
        self.block_size = block_size
        self.data = np.empty((blocks, block_size, width), dtype=np.float64)
        self.free_blocks = list(reversed(range(blocks)))
        self.tables = {}
        self.lengths = {}

    def append(self, request, rows):
        rows = np.asarray(rows, dtype=self.data.dtype)
        if rows.ndim != 2 or rows.shape[1] != self.data.shape[2] or len(rows) == 0:
            raise ValueError("Append a nonempty matrix with the pool record width")
        old_length = self.lengths.get(request, 0)
        old_table = self.tables.get(request, [])
        new_length = old_length + len(rows)
        needed = (new_length + self.block_size-1) // self.block_size - len(old_table)
        # Validate capacity before any pop, table mutation or payload write.
        if needed > len(self.free_blocks):
            raise MemoryError("Insufficient physical blocks; existing state is unchanged")
        table = old_table + [self.free_blocks.pop() for _ in range(needed)]
        positions = np.arange(old_length, new_length)
        physical = np.asarray(table)[positions // self.block_size]
        offsets = positions % self.block_size
        self.data[physical, offsets] = rows
        self.tables[request] = table
        self.lengths[request] = new_length

    def address(self, request, position):
        if not 0 <= position < self.lengths[request]:
            raise IndexError("Position is outside the occupied sequence")
        logical_block, offset = divmod(position, self.block_size)
        return self.tables[request][logical_block], offset

    def gather(self, request):
        positions = np.arange(self.lengths[request])
        physical = np.asarray(self.tables[request])[positions // self.block_size]
        return self.data[physical, positions % self.block_size].copy()

    def release(self, request):
        # Released bytes remain stale but cannot be read through a live table.
        self.free_blocks.extend(self.tables.pop(request))
        del self.lengths[request]


def demonstrate():
    pool = PagedStorage()
    a = np.arange(16).reshape(8, 2)
    b = np.arange(8).reshape(4, 2) + 100
    pool.append("A", a[:5])
    pool.append("B", b)
    pool.append("A", a[5:])
    np.testing.assert_array_equal(pool.gather("A"), a)
    np.testing.assert_array_equal(pool.gather("B"), b)
    before = {key: value.copy() for key, value in pool.tables.items()}
    payload_before = pool.data.copy()
    try:
        pool.append("A", [[16, 17]])
    except MemoryError:
        pass
    else:
        raise AssertionError("Full pool should refuse the next block")
    assert before == pool.tables and pool.lengths["A"] == 8
    np.testing.assert_array_equal(pool.data, payload_before)
    pool.release("B")
    pool.append("A", [[16, 17]])
    assert pool.address("A", 8) == (2, 0)
    np.testing.assert_array_equal(pool.gather("A"), np.arange(18).reshape(9, 2))
    return {"tables_before_release": before, "tables_after_reuse": pool.tables,
            "position_8_address": list(pool.address("A", 8)),
            "A_records": pool.gather("A").tolist(), "allocation_failure_atomic": True,
            "occupied_records": 9, "reserved_records": 12, "pool_payload_bytes": pool.data.nbytes}


if __name__ == "__main__":
    print(json.dumps(demonstrate(), indent=2))
