"""Vectorized grouped attention, compact projected cache and native comparison.

Run: python grouped-attention-cache.py
Dependencies: NumPy and PyTorch. No training, downloads or output files.

Q [batch, query_heads, query_rows, key_width]
K [batch, kv_heads, stored_rows, key_width]
V [batch, kv_heads, stored_rows, value_width]

The reference uses contiguous, equally sized query groups. It materializes the
dense score/probability workspace, but never repeats K/V into query-head arrays.
This is a readable CPU reference, not a fused GPU kernel. The cache stores
already-projected keys, already rotated if the model uses rotary positions,
and unrotated projected values. It is an inference buffer, not an autograd state.
"""
from dataclasses import dataclass
import math

import numpy as np
import torch
from torch.nn import functional as F


def positive_integer(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value < 1:
        raise ValueError(f"{name} must be a positive integer.")
    return int(value)


def positions_array(positions, batch, rows, name):
    """Accept one common ID row or a separate ID row for each request."""
    ids = np.asarray(positions)
    if ids.dtype.kind not in "iu":
        raise ValueError(f"{name} must contain integer logical IDs.")
    if ids.shape == (rows,):
        ids = np.broadcast_to(ids, (batch, rows))
    if ids.shape != (batch, rows):
        raise ValueError(f"{name} must have shape [{rows}] or [{batch}, {rows}].")
    # This also rejects unsigned IDs that cannot be represented in the buffer.
    if np.any(ids > np.iinfo(np.int64).max):
        raise ValueError("Logical IDs must fit signed int64 storage.")
    return ids.astype(np.int64, copy=False)


def causal_permissions(query_positions, key_positions, key_valid=None):
    """[B,T,S]: key ID <= query ID, optionally excluding invalid keys."""
    allowed = key_positions[:, None, :] <= query_positions[:, :, None]
    if key_valid is not None:
        valid = np.asarray(key_valid)
        if valid.dtype != np.bool_ or valid.shape != key_positions.shape:
            raise ValueError("key_valid must be boolean [batch, stored_rows].")
        allowed &= valid[:, None, :]
    return allowed


def grouped_attention(query, keys, values, query_positions, key_positions,
                      key_valid=None):
    """Return outputs [B,Hq,T,dv] and probabilities [B,Hq,T,S].

    Nonempty finite floating arrays must have the same dtype. All-masked rows
    raise: a normalized probability distribution over an empty set is undefined.
    Each request may have arbitrary integer IDs; physical slot order need not be
    sorted. Padding exclusion and causality are separate inputs.
    """
    q, k, v = (np.asarray(array) for array in (query, keys, values))
    if any(array.ndim != 4 for array in (q, k, v)):
        raise ValueError("Q, K and V must be four-dimensional arrays.")
    if any(array.dtype.kind != "f" for array in (q, k, v)) or not (q.dtype == k.dtype == v.dtype):
        raise ValueError("Q, K and V must share a floating dtype.")
    if any(min(array.shape) == 0 or not np.isfinite(array).all() for array in (q, k, v)):
        raise ValueError("Q, K and V must be nonempty and finite.")
    batch, query_heads, query_rows, key_width = q.shape
    kv_heads, stored_rows = k.shape[1:3]
    if k.shape[:3] != v.shape[:3] or k.shape[0] != batch or k.shape[-1] != key_width:
        raise ValueError("Batch, K/V heads/rows and Q/K widths must agree.")
    if query_heads % kv_heads:
        raise ValueError("query_heads must be divisible by kv_heads.")
    query_ids = positions_array(query_positions, batch, query_rows, "query_positions")
    key_ids = positions_array(key_positions, batch, stored_rows, "key_positions")
    allowed = causal_permissions(query_ids, key_ids, key_valid)
    if not allowed.any(axis=-1).all():
        raise ValueError("A query has no legal key.")

    # Float16 storage is evaluated with float32 arithmetic in this reference.
    calculation_dtype = np.result_type(q.dtype, np.float32)
    q, k, v = (array.astype(calculation_dtype, copy=False) for array in (q, k, v))
    readers_per_group = query_heads // kv_heads
    grouped_q = q.reshape(batch, kv_heads, readers_per_group, query_rows, key_width)
    # The singleton reader axis broadcasts the unique K/V arrays, not copies.
    # Stable softmax cannot repair dot-product overflow that happened earlier.
    with np.errstate(over="raise", invalid="raise"):
        scores = grouped_q @ k[:, :, None].swapaxes(-1, -2)
        scores /= math.sqrt(key_width)
    scores = np.where(allowed[:, None, None], scores, -np.inf)
    weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
    weights /= weights.sum(axis=-1, keepdims=True)
    outputs = weights @ v[:, :, None]
    return (outputs.reshape(batch, query_heads, query_rows, v.shape[-1]),
            weights.reshape(batch, query_heads, query_rows, stored_rows))


@dataclass(frozen=True)
class CacheShape:
    batch: int
    kv_heads: int
    capacity: int
    key_width: int
    value_width: int


class ProjectedKVCache:
    """Bounded compact inference storage for one layer under one fixed model.

    Inputs to append must already follow that model's projection/rotary contract.
    When model weights, past source inputs or position rules change, reset and
    recompute the affected states. This class cannot infer those dependencies.
    """
    def __init__(self, batch, kv_heads, capacity, key_width, value_width,
                 dtype=np.float64):
        self.shape = CacheShape(*(positive_integer(value, name) for value, name in
            zip((batch, kv_heads, capacity, key_width, value_width),
                ("batch", "kv_heads", "capacity", "key_width", "value_width"))))
        self.dtype = np.dtype(dtype)
        if self.dtype.kind != "f":
            raise ValueError("Cache storage must use a floating dtype.")
        s = self.shape
        self._keys = np.empty((s.batch, s.kv_heads, s.capacity, s.key_width), self.dtype)
        self._values = np.empty((s.batch, s.kv_heads, s.capacity, s.value_width), self.dtype)
        self._positions = np.empty((s.batch, s.capacity), dtype=np.int64)
        self._valid = np.empty((s.batch, s.capacity), dtype=np.bool_)
        self.length = 0

    @property
    def occupied_payload_bytes(self):
        s = self.shape
        return s.batch * s.kv_heads * self.length * (s.key_width + s.value_width) * self.dtype.itemsize

    @property
    def reserved_payload_bytes(self):
        return self._keys.nbytes + self._values.nbytes

    def reset(self):
        # Unoccupied storage is never exposed or read; resetting need not zero it.
        self.length = 0

    def append(self, keys, values, logical_positions, key_valid=None):
        k, v = np.asarray(keys), np.asarray(values)
        s = self.shape
        if k.ndim != 4 or v.ndim != 4 or k.shape[2] != v.shape[2]:
            raise ValueError("Append requires matching four-dimensional K/V chunks.")
        rows = k.shape[2]
        if rows < 1 or k.shape != (s.batch, s.kv_heads, rows, s.key_width) or v.shape != (s.batch, s.kv_heads, rows, s.value_width):
            raise ValueError("Chunk batch/head/width dimensions must match this cache.")
        if k.dtype != self.dtype or v.dtype != self.dtype or not np.isfinite(k).all() or not np.isfinite(v).all():
            raise ValueError("Chunk arrays must be finite and match the cache dtype.")
        if self.length + rows > s.capacity:
            raise ValueError("Append exceeds reserved capacity; occupied state is unchanged.")
        ids = positions_array(logical_positions, s.batch, rows, "logical_positions")
        valid = np.ones((s.batch, rows), dtype=np.bool_) if key_valid is None else np.asarray(key_valid)
        if valid.dtype != np.bool_ or valid.shape != (s.batch, rows):
            raise ValueError("key_valid must be boolean [batch, new_rows].")
        # All checks happen before any write or occupied-length change.
        begin, end = self.length, self.length + rows
        self._keys[:, :, begin:end] = k
        self._values[:, :, begin:end] = v
        self._positions[:, begin:end] = ids
        self._valid[:, begin:end] = valid
        self.length = end

    def active(self):
        """Read-only occupied views; reserve space never becomes a legal record."""
        views = (self._keys[:, :, :self.length], self._values[:, :, :self.length],
                 self._positions[:, :self.length], self._valid[:, :self.length])
        for view in views:
            view.flags.writeable = False
        return views

    def read(self, query, query_positions):
        k, v, ids, valid = self.active()
        return grouped_attention(query, k, v, query_positions, ids, valid)


def torch_grouped_reference(q, k, v, allowed):
    """Same grouped algebra with autograd; allowed [B,T,S] is boolean."""
    batch, heads, query_rows, width = q.shape
    groups, stored_rows = k.shape[1:3]
    readers = heads // groups
    grouped_q = q.reshape(batch, groups, readers, query_rows, width)
    scores = (grouped_q @ k[:, :, None].transpose(-1, -2)) / math.sqrt(width)
    weights = scores.masked_fill(~allowed[:, None, None], -torch.inf).softmax(-1)
    return (weights @ v[:, :, None]).reshape(batch, heads, query_rows, v.shape[-1])


def main():
    rng = np.random.default_rng(73)
    # Unequal key/value widths, batched IDs, non-square query/history lengths.
    # These constructed vectors isolate grouping/cache behavior without RoPE;
    # the complete forecasting program separately exercises actual rotated keys.
    q = rng.normal(size=(2, 6, 2, 3))
    k = rng.normal(size=(2, 2, 5, 3))
    v = rng.normal(size=(2, 2, 5, 4))
    query_ids = np.array([[13, 14], [103, 104]], dtype=np.int64)
    key_ids = np.array([[10, 11, 12, 13, 14], [100, 101, 102, 103, 104]], dtype=np.int64)
    valid = np.array([[True, True, False, True, True], [True, True, True, False, True]])
    expected, weights = grouped_attention(q, k, v, query_ids, key_ids, valid)
    allowed = causal_permissions(query_ids, key_ids, valid)
    assert np.allclose(weights.sum(-1), 1)
    assert np.array_equal(weights * ~allowed[:, None], np.zeros_like(weights))
    upstream = torch.tensor(rng.normal(size=expected.shape), dtype=torch.float64)
    native_inputs = [torch.tensor(array, dtype=torch.float64, requires_grad=True) for array in (q, k, v)]
    reference_inputs = [array.detach().clone().requires_grad_() for array in native_inputs]
    torch_allowed = torch.tensor(allowed, dtype=torch.bool)
    native = F.scaled_dot_product_attention(*native_inputs,
        attn_mask=torch_allowed[:, None], dropout_p=0.0, enable_gqa=True)
    reference = torch_grouped_reference(*reference_inputs, torch_allowed)
    torch.testing.assert_close(native, reference, atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(native.detach().numpy(), expected, atol=1e-12, rtol=1e-12)
    (native * upstream).sum().backward()
    (reference * upstream).sum().backward()
    for native_array, reference_array in zip(native_inputs, reference_inputs):
        torch.testing.assert_close(native_array.grad, reference_array.grad, atol=1e-12, rtol=1e-12)
    max_gradient_error = max(float((a.grad - b.grad).abs().max())
                             for a, b in zip(native_inputs, reference_inputs))

    # Explicitly repeated K/V are a semantics oracle with extra transient storage.
    repeated_k = native_inputs[1].detach().repeat_interleave(3, dim=1)
    repeated_v = native_inputs[2].detach().repeat_interleave(3, dim=1)
    expanded = F.scaled_dot_product_attention(native_inputs[0].detach(), repeated_k, repeated_v,
        attn_mask=torch_allowed[:, None], dropout_p=0.0)
    torch.testing.assert_close(expanded, native, atol=1e-12, rtol=1e-12)
    assert repeated_k.untyped_storage().data_ptr() != native_inputs[1].untyped_storage().data_ptr()

    # Append in two chunks; the same logical-ID read must reproduce the full call.
    cache = ProjectedKVCache(2, 2, 7, 3, 4)
    cache.append(k[:, :, :3], v[:, :, :3], key_ids[:, :3], valid[:, :3])
    cache.append(k[:, :, 3:], v[:, :, 3:], key_ids[:, 3:], valid[:, 3:])
    cached, _ = cache.read(q, query_ids)
    np.testing.assert_allclose(cached, expected, atol=1e-12, rtol=1e-12)
    assert cache.occupied_payload_bytes == 1120 and cache.reserved_payload_bytes == 1568
    saved = [array.copy() for array in cache.active()]
    # Failed writes cannot change old records, masks, IDs or occupied length.
    for bad_keys, bad_values, bad_ids in (
        (k[:, :, :3], v[:, :, :3], key_ids[:, :3]),  # exceeds remaining capacity
        (k[:, :, :1].astype(np.float32), v[:, :, :1], key_ids[:, :1]),
        (k[:, :, :1], v[:, :, :1], np.array([[1.5], [2.5]])),
    ):
        try:
            cache.append(bad_keys, bad_values, bad_ids)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid append unexpectedly succeeded.")
        assert cache.length == 5
        for current, previous in zip(cache.active(), saved):
            np.testing.assert_array_equal(current, previous)

    # Moving complete records with their IDs and validity preserves attention.
    order = np.array([4, 1, 3, 0, 2])
    permuted, _ = grouped_attention(q, k[:, :, order], v[:, :, order], query_ids,
                                    key_ids[:, order], valid[:, order])
    np.testing.assert_allclose(permuted, expected, atol=1e-12, rtol=1e-12)
    try:
        grouped_attention(q, k, v, query_ids, key_ids, np.zeros_like(valid))
    except ValueError:
        pass
    else:
        raise AssertionError("Empty probability domain must be reported.")
    # The executed CPU SDPA operator chooses zero output for an all-false mask.
    zeros = F.scaled_dot_product_attention(*(array.detach() for array in native_inputs),
        attn_mask=torch.zeros_like(torch_allowed[:, None]), dropout_p=0.0, enable_gqa=True)
    assert torch.equal(zeros, torch.zeros_like(zeros))
    cache.reset()
    assert cache.length == 0 and cache.occupied_payload_bytes == 0

    print("PyTorch:", torch.__version__, "NumPy:", np.__version__)
    print("Native/reference/NumPy/expanded/cache/permutation comparisons passed.")
    print("Maximum native/reference Q/K/V gradient difference:", max_gradient_error)
    print("Compact K/V payload: 1120 occupied bytes; 1568 reserved bytes.")
    print("All invalid appends preserved state; all-masked policies and reset passed.")
    print("Executed on CPU. Fused GPU dispatch and latency are not measured.")


if __name__ == "__main__":
    main()
