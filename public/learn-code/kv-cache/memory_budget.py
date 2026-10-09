"""Count tensor payload separately from padding, block slack and metadata.

Run: python memory_budget.py
Requires NumPy. All budgets are constructed inputs, not device measurements.
"""
import json
import math
import numpy as np


def bytes_per_token(layers, element_bytes):
    """layers contains (owned KV heads, key width, value width) per layer."""
    if element_bytes <= 0 or any(min(layer) < 1 for layer in layers):
        raise ValueError("Widths, owned heads and element bytes must be positive")
    return sum(heads * (key_width + value_width) * element_bytes
               for heads, key_width, value_width in layers)


def allocation(lengths, layers, element_bytes=2, capacity=None, block_size=4):
    if not lengths or any(length < 0 for length in lengths) or block_size < 1:
        raise ValueError("Need nonnegative lengths and a positive block size")
    capacity = max(lengths) if capacity is None else capacity
    if capacity < max(lengths):
        raise ValueError("Static capacity cannot be smaller than an occupied length")
    one = bytes_per_token(layers, element_bytes)
    live = sum(lengths)
    static = len(lengths) * capacity
    blocks = sum(math.ceil(length / block_size) for length in lengths)
    paged = blocks * block_size
    return {"bytes_per_token": one, "live_slots": live, "static_slots": static,
            "paged_slots": paged, "physical_blocks": blocks,
            "live_bytes": live * one, "static_bytes": static * one,
            "paged_bytes": paged * one, "paged_slack_bytes": (paged-live) * one,
            "units": "tensor payload bytes; block table and allocator metadata excluded"}


def per_device(layers, head_ownership, element_bytes, total_tokens):
    """head_ownership[device][layer] is an explicit integer head count.

    Counts can sum to more than the original KV heads when deployment replicates
    a shared head. There is deliberately no automatic division by GPU count.
    """
    if total_tokens < 0 or any(len(row) != len(layers) for row in head_ownership):
        raise ValueError("Need nonnegative tokens and one ownership count per layer")
    rows = []
    for counts in head_ownership:
        if any(count < 0 or count > original[0] for count, original in zip(counts, layers)):
            raise ValueError("Invalid owned head count")
        one = sum(count * (layer[1] + layer[2]) * element_bytes
                  for count, layer in zip(counts, layers))
        rows.append(one * total_tokens)
    return rows


def request_capacity(device_budget, weights, workspace, reserve, per_request_cache):
    if min(device_budget, weights, workspace, reserve) < 0 or per_request_cache <= 0:
        raise ValueError("Nonnegative budgets and a positive request cache are required")
    available = device_budget - weights - workspace - reserve
    return {"available_cache_bytes": available,
            "requests": max(0, available) // per_request_cache,
            "over_budget": available < 0}


def examples():
    # Small arrays verify the dimensional formula against an actual allocation.
    layers = [(2, 3, 5), (1, 4, 6)]
    arrays = [np.empty((2, heads, 7, width), dtype=np.float32)
              for heads, dk, dv in layers for width in (dk, dv)]
    actual = sum(a.nbytes for a in arrays)
    assert actual == bytes_per_token(layers, 4) * 2 * 7
    paper_shape = [(8, 128, 128)] * 80
    global_bytes = bytes_per_token(paper_shape, 2) * 8192
    two_devices = per_device(paper_shape, [[4]*80, [4]*80], 2, 8192)
    assert sum(two_devices) == global_bytes
    mqa = [(1, 128, 128)] * 80
    replicated = per_device(mqa, [[1]*80, [1]*80], 2, 8192)
    practice = allocation([5, 9], [(2, 8, 8)] * 4, 2, block_size=4)
    assert practice["live_bytes"] == 3584 and practice["paged_bytes"] == 5120
    return {"array_payload_bytes": actual,
            "ragged_example": allocation([3, 5, 8], [(2, 8, 8)] * 4),
            "practice": practice, "global_bytes": global_bytes,
            "global_decimal_GB": global_bytes / 10**9, "global_GiB": global_bytes / 2**30,
            "two_device_shards": two_devices, "mqa_replicated_each_device": replicated,
            "constructed_budget": request_capacity(24*2**30, 14*2**30, 2*2**30, 2**30, global_bytes)}


if __name__ == "__main__":
    print(json.dumps(examples(), indent=2))
