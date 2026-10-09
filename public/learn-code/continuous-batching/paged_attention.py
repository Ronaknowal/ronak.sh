"""Globally normalized attention over addressed K/V pages, with stable registers.

Run: python paged_attention.py
Requires NumPy and Torch for the independent ordinary SDPA comparison. This is
a correctness implementation, not a fused GPU PagedAttention kernel.
"""

import json
import math
import numpy as np
from shared_pool import SharedPool


def online_reduce(blocks, width):
    maximum, mass = -math.inf, 0.0
    accumulator = np.zeros(width, dtype=np.float64)
    trace = []
    for scores, values in blocks:
        scores, values = np.asarray(scores), np.asarray(values)
        if not len(scores):
            trace.append({"skipped_masked_page": True})
            continue
        next_maximum = max(maximum, float(scores.max()))
        old_scale = 0.0 if mass == 0 else math.exp(maximum - next_maximum)
        weights = np.exp(scores - next_maximum)
        accumulator = old_scale * accumulator + weights @ values
        mass = old_scale * mass + float(weights.sum())
        maximum = next_maximum
        trace.append(
            {
                "maximum": maximum,
                "old_scale": old_scale,
                "mass": mass,
                "accumulator": accumulator.tolist(),
            }
        )
    if mass == 0:
        return {"valid": False, "output": None, "trace": trace}
    return {"valid": True, "output": (accumulator / mass).tolist(), "trace": trace}


def attend(query, pool, identity, allowed=None, layer=0, head=0):
    query = np.asarray(query, dtype=np.float64)
    length = pool.lengths[identity]
    width = pool.keys.shape[-1]
    if query.shape != (width,) or not np.isfinite(query).all():
        raise ValueError("One finite query of the pool head width is required.")
    allowed = (
        np.ones(length, dtype=bool) if allowed is None else np.asarray(allowed, dtype=bool)
    )
    if allowed.shape != (length,):
        raise ValueError("Permission mask must cover exactly the valid logical history.")
    blocks, addresses = [], []
    for logical, physical in enumerate(pool.tables[identity]):
        begin = logical * pool.page_size
        valid_count = min(pool.page_size, length - begin)
        keep = allowed[begin : begin + valid_count]
        keys = pool.keys[layer, head, physical, :valid_count][keep]
        values = pool.values[layer, head, physical, :valid_count][keep]
        blocks.append((keys @ query / math.sqrt(width), values))
        addresses.append(
            {
                "logical_page": logical,
                "physical_page": physical,
                "valid_tail": valid_count,
                "permitted": int(keep.sum()),
            }
        )
    result = online_reduce(blocks, width)
    result["addresses"] = addresses
    return result


def dense_reference(query, keys, values, allowed):
    selected = np.flatnonzero(allowed)
    if not len(selected):
        return None
    scores = keys[selected] @ query / math.sqrt(keys.shape[-1])
    exponentials = np.exp(scores - scores.max())
    return exponentials @ values[selected] / exponentials.sum()


def verify():
    import torch
    import torch.nn.functional as F

    torch.set_num_threads(1)
    pool = SharedPool(5, 2, layers=1, heads=1, width=1)
    pool.create("A")
    keys = np.log([1, 2, 3, 4]).reshape(1, 1, 4, 1)
    values = np.array([2, 0, 4, 1.0]).reshape(1, 1, 4, 1)
    pool.append("A", keys, values)
    example = attend([1.0], pool, "A")
    assert np.allclose(example["output"], [1.8])
    wrong = 0.5 * ((1 * 2 + 2 * 0) / 3 + (3 * 4 + 4 * 1) / 7)
    assert np.isclose(wrong, 31 / 21) and not np.isclose(wrong, 1.8)
    cases = []
    for query in [np.array([1.0]), np.array([1000.0]), np.array([-1000.0])]:
        for allowed in [
            np.ones(4, dtype=bool),
            np.array([0, 0, 1, 1], dtype=bool),
            np.array([1, 0, 0, 1], dtype=bool),
            np.zeros(4, dtype=bool),
        ]:
            actual = attend(query, pool, "A", allowed)
            dense = dense_reference(query, keys[0, 0], values[0, 0], allowed)
            if dense is None:
                assert not actual["valid"] and actual["output"] is None
            else:
                ordinary = F.scaled_dot_product_attention(
                    torch.tensor(query)[None, None, None, :],
                    torch.tensor(keys),
                    torch.tensor(values),
                    attn_mask=torch.tensor(allowed)[None, None, None, :],
                    dropout_p=0.0,
                    is_causal=False,
                )
                np.testing.assert_allclose(actual["output"], dense, rtol=1e-12, atol=1e-12)
                np.testing.assert_allclose(
                    actual["output"], ordinary.numpy().reshape(-1), rtol=1e-12, atol=1e-12
                )
            cases.append({"query": query.tolist(), "mask": allowed.tolist(), "result": actual})
    # Relocate physical pages while keeping the logical order unchanged.
    previous = pool.snapshot()
    pool.keys[:, :, [4, 2]] = pool.keys[:, :, [0, 1]].copy()
    pool.values[:, :, [4, 2]] = pool.values[:, :, [0, 1]].copy()
    pool.tables["A"] = [4, 2]
    pool.refs[:] = 0
    pool.refs[[4, 2]] = 1
    from collections import deque

    pool.free = deque([0, 1, 3])
    pool.check_invariants()
    moved = attend([1.0], pool, "A")
    np.testing.assert_allclose(moved["output"], example["output"])
    # A masked-only first page must not evaluate infinity minus infinity.
    masked = attend([1.0], pool, "A", [False, False, True, True])
    assert masked["trace"][0] == {"skipped_masked_page": True}
    assert np.isfinite(masked["output"]).all()
    return {
        "example": example,
        "wrong_page_average": wrong,
        "cases": cases,
        "before_relocation": previous,
        "relocated": moved,
        "masked_first_page": masked,
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
