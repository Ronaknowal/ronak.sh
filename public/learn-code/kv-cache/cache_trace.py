"""Trace one projected attention head and compare its result with PyTorch.

Run: python cache_trace.py
Requires NumPy and PyTorch. No model, dataset download or training.
"""
import json
import math
import numpy as np
import torch
from torch.nn.functional import scaled_dot_product_attention
from grouped_attention_cache import ProjectedKVCache


def trace():
    # Each constructed hidden row is [qx, qy, kx, ky, vx, vy]. These are
    # deliberately chosen coordinates, not word embeddings from a trained model.
    hidden = np.array([
        [0, 0, 1, 0, 2, 0],
        [0, 0, 0, 1, 0, 2],
        [math.sqrt(2) * math.log(2), 0, 1, 1, 1, 1],
        [math.sqrt(2) * math.log(2), 0, -1, 0, -1, 1],
    ], dtype=np.float64)
    selectors = [np.eye(6)[:, begin:begin + 2] for begin in (0, 2, 4)]
    query, keys, values = [(hidden @ matrix)[None, None] for matrix in selectors]
    cache = ProjectedKVCache(1, 1, 6, 2, 2)
    cache.append(keys[:, :, :3], values[:, :, :3], np.arange(3))
    before, before_weights = cache.read(query[:, :, 2:3], np.array([2]))
    np.testing.assert_allclose(before.ravel(), [6 / 5, 4 / 5])
    cache.append(keys[:, :, 3:], values[:, :, 3:], np.array([3]))
    after, after_weights = cache.read(query[:, :, 3:], np.array([3]))
    np.testing.assert_allclose(after.ravel(), [1, 9 / 11])

    q, k, v = [torch.from_numpy(a.copy()) for a in (query[:, :, 3:], keys, values)]
    allowed = torch.arange(4)[None, :] <= torch.tensor([[3]])
    native = scaled_dot_product_attention(q, k, v, attn_mask=allowed, dropout_p=0)
    wrong = scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0)
    np.testing.assert_allclose(native.numpy(), after)
    np.testing.assert_allclose(wrong.numpy().ravel(), [2, 0])
    return {
        "hidden_rows": hidden.tolist(),
        "projection_matrices": [matrix.tolist() for matrix in selectors],
        "before_weights": before_weights.ravel().tolist(),
        "before_output": before.ravel().tolist(),
        "after_weights": after_weights.ravel().tolist(),
        "after_output": after.ravel().tolist(),
        "allowed": allowed.tolist(),
        "sdpa_output": native.numpy().ravel().tolist(),
        "wrong_upper_left_output": wrong.numpy().ravel().tolist(),
        "occupied_payload_bytes": cache.occupied_payload_bytes,
        "reserved_payload_bytes": cache.reserved_payload_bytes,
    }


if __name__ == "__main__":
    print(json.dumps(trace(), indent=2))
