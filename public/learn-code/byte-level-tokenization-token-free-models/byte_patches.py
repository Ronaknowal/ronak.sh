"""Inspect causal entropy boundaries and indexed pooling, not a BLT replica.

Install: python -m pip install numpy torch
Run: python byte_patches.py
"""
import json
import numpy as np
import torch


def next_byte_entropy(probabilities):
    probabilities = np.asarray(probabilities, dtype=np.float64)
    positive = probabilities > 0
    return -np.sum(probabilities[positive] * np.log2(probabilities[positive]))


def patch_ids(entropies, threshold):
    entropies = np.asarray(entropies, dtype=np.float64)
    starts = entropies > threshold
    starts[0] = True
    return np.cumsum(starts) - 1


def pool_patches(features, ids):
    """O(length * width) indexed accumulation; no length-by-patch matrix."""
    features = np.asarray(features, dtype=np.float64)
    sums = np.zeros((int(ids[-1]) + 1, features.shape[1]), dtype=np.float64)
    counts = np.bincount(ids)
    np.add.at(sums, ids, features)
    return sums / counts[:, None]


def torch_pool(features, ids):
    values = torch.as_tensor(features, dtype=torch.float64)
    indices = torch.as_tensor(ids, dtype=torch.long)
    sums = torch.zeros((int(indices[-1]) + 1, values.shape[1]), dtype=values.dtype)
    sums.index_add_(0, indices, values)
    return sums / torch.bincount(indices).unsqueeze(1)


def main():
    # Constructed distributions: the control is the causal predictor's uncertainty.
    distributions = [[0.5, 0.5], [0.99, 0.01], [0.99, 0.01], [0.5, 0.5],
                     [0.9, 0.1], [0.99, 0.01], [0.5, 0.5], [0.99, 0.01]]
    entropies = np.array([next_byte_entropy(p) for p in distributions])
    ids = patch_ids(entropies, threshold=0.5)
    # Constructed feature values isolate pooling arithmetic from an encoder.
    features = np.array([[i, (i + 1) ** 2] for i in range(len(ids))], dtype=np.float64)
    own = pool_patches(features, ids)
    library = torch_pool(features, ids).numpy()
    np.testing.assert_allclose(own, library, atol=1e-12, rtol=0)
    print(json.dumps({"entropy_bits": entropies.tolist(), "patch_ids": ids.tolist(),
                      "patch_lengths": np.bincount(ids).tolist(), "means": own.tolist(),
                      "library_max_error": float(np.max(np.abs(own-library)))}, indent=2))


if __name__ == "__main__":
    main()
