"""Normalized feature memory, stable sampled features and independent checks.

Run: python sparse-feature-memory.py
Optional retained-model check: python sparse-feature-memory.py --saved-models
Requires NumPy and PyTorch; performs no training, download or file writes.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import sys
import numpy as np


def vector(value, width, dtype, *, nonnegative=False):
    result = np.asarray(value, dtype=dtype)
    if result.shape != (width,) or not np.isfinite(result).all():
        raise ValueError(f"Expected a finite vector of width {width}.")
    if nonnegative and np.any(result < 0):
        raise ValueError("Feature coordinates must be nonnegative.")
    return result


def finite_state(matrix, normalizer):
    if not np.isfinite(matrix).all() or not np.isfinite(normalizer).all():
        raise FloatingPointError("Memory arithmetic exceeded the chosen dtype.")
    return matrix, normalizer


class FeatureMemory:
    """One sequence/head, O(m*d_v+m) state; vectorized O(m*d_v) write.

    The identity names the sequence and feature-map/checkpoint convention.
    The caller owns the correspondence between those names and actual data.
    Eviction requires a known included write: S/z cannot prove membership.
    """
    def __init__(self, features, value_width, *, dtype=np.float64,
                 identity=("sequence", "fixed-feature-map")):
        if features < 1 or value_width < 1:
            raise ValueError("State widths must be positive.")
        self.dtype = np.dtype(dtype)
        if self.dtype not in (np.dtype(np.float32), np.dtype(np.float64)):
            raise ValueError("Use float32 or float64.")
        self.features, self.value_width = features, value_width
        self.identity = tuple(identity)
        self.reset()

    def reset(self, identity=None):
        if identity is not None:
            self.identity = tuple(identity)
        self.matrix = np.zeros((self.features, self.value_width), dtype=self.dtype)
        self.normalizer = np.zeros(self.features, dtype=self.dtype)
        self.count = 0

    def _identity(self, identity):
        if identity is not None and tuple(identity) != self.identity:
            raise ValueError("Reset before changing sequence or feature-map identity.")

    def _stage(self, key, value, identity):
        self._identity(identity)
        key = vector(key, self.features, self.dtype, nonnegative=True)
        value = vector(value, self.value_width, self.dtype)
        return finite_state(self.matrix + np.outer(key, value), self.normalizer + key)

    def _read(self, query, matrix, normalizer):
        query = vector(query, self.features, self.dtype, nonnegative=True)
        denominator = query @ normalizer
        if not np.isfinite(denominator) or denominator <= 0:
            raise ValueError("Normalized read has no finite positive overlap.")
        output = query @ matrix / denominator
        if not np.isfinite(output).all():
            raise FloatingPointError("Read arithmetic exceeded the chosen dtype.")
        return output

    def append(self, key, value, *, identity=None):
        matrix, normalizer = self._stage(key, value, identity)
        self.matrix, self.normalizer = matrix, normalizer
        self.count += 1

    def read(self, query, *, identity=None):
        self._identity(identity)
        return self._read(query, self.matrix, self.normalizer)

    def append_and_read(self, query, key, value, *, identity=None):
        matrix, normalizer = self._stage(key, value, identity)
        output = self._read(query, matrix, normalizer)
        self.matrix, self.normalizer = matrix, normalizer
        self.count += 1
        return output

    def evict_known(self, key, value, *, identity=None):
        self._identity(identity)
        if self.count == 0:
            raise ValueError("Cannot evict from an empty state.")
        key = vector(key, self.features, self.dtype, nonnegative=True)
        value = vector(value, self.value_width, self.dtype)
        matrix, normalizer = finite_state(self.matrix - np.outer(key, value), self.normalizer - key)
        tolerance = 8 * np.finfo(self.dtype).eps * max(1., float(np.max(self.normalizer)))
        if np.any(normalizer < -tolerance):
            raise ValueError("The supplied write is inconsistent with this state.")
        normalizer = np.maximum(normalizer, 0)
        self.matrix, self.normalizer = matrix, normalizer
        self.count -= 1
        if self.count == 0:
            self.reset()

    def snapshot(self):
        # Copies isolate the cache from inspection. No writable view escapes.
        matrix, normalizer = self.matrix.copy(), self.normalizer.copy()
        matrix.setflags(write=False)
        normalizer.setflags(write=False)
        return matrix, normalizer, self.count, self.identity


class GaussianFeatureMemory(FeatureMemory):
    """Fixed sampled exponential features with a shared key-log scale.

    Inputs are already scaled by d_k**(-1/4). Every Gaussian row is fixed for
    this sequence. Query-local scale cancels only its read; changing the key
    scale rescales BOTH S and z before appending. Finite precision can still
    underflow disjoint coordinates: undefined overlap is rejected, not repaired.
    """
    def __init__(self, projection, value_width, *, dtype=np.float64,
                 identity=("sequence", "fixed-Gaussian-draw")):
        projection = np.array(projection, dtype=dtype, copy=True)
        if projection.ndim != 2 or min(projection.shape) < 1 or not np.isfinite(projection).all():
            raise ValueError("Expected a finite (samples, input-width) projection.")
        projection.setflags(write=False)
        self.projection = projection
        self.input_width = projection.shape[1]
        super().__init__(projection.shape[0], value_width, dtype=dtype, identity=identity)

    def reset(self, identity=None):
        super().reset(identity)
        self.key_log_scale = None

    def _logs(self, vector_input):
        vector_input = vector(vector_input, self.input_width, self.dtype)
        logs = self.projection @ vector_input - (vector_input @ vector_input) / 2
        if not np.isfinite(logs).all():
            raise FloatingPointError("Feature-log arithmetic exceeded the chosen dtype.")
        return logs

    def _gaussian_stage(self, key, value, identity):
        self._identity(identity)
        logs = self._logs(key)
        value = vector(value, self.value_width, self.dtype)
        scale = max(float(np.max(logs)), self.key_log_scale if self.key_log_scale is not None else -np.inf)
        factor = 0. if self.key_log_scale is None else np.exp(self.key_log_scale - scale)
        key_features = np.exp(logs - scale)
        matrix, normalizer = finite_state(self.matrix * factor + np.outer(key_features, value), self.normalizer * factor + key_features)
        return matrix, normalizer, scale

    def append(self, key, value, *, identity=None):
        matrix, normalizer, scale = self._gaussian_stage(key, value, identity)
        self.matrix, self.normalizer, self.key_log_scale = matrix, normalizer, scale
        self.count += 1

    def read(self, query, *, identity=None):
        self._identity(identity)
        logs = self._logs(query)
        return self._read(np.exp(logs - np.max(logs)), self.matrix, self.normalizer)

    def append_and_read(self, query, key, value, *, identity=None):
        matrix, normalizer, scale = self._gaussian_stage(key, value, identity)
        logs = self._logs(query)
        output = self._read(np.exp(logs - np.max(logs)), matrix, normalizer)
        self.matrix, self.normalizer, self.key_log_scale = matrix, normalizer, scale
        self.count += 1
        return output

    def evict_known(self, key, value, *, identity=None):
        self._identity(identity)
        if self.key_log_scale is None:
            raise ValueError("Cannot evict from an empty state.")
        logs = self._logs(key)
        features = np.exp(logs - self.key_log_scale)
        # Call the base subtraction with the actual currently scaled write.
        super().evict_known(features, value, identity=identity)

    def snapshot(self):
        return (*super().snapshot(), self.key_log_scale)


def pair_reference(queries, keys, values):
    """Independent causal pair-sum oracle; not the recurrent algorithm."""
    output = []
    for receiver, query in enumerate(queries):
        amounts = np.array([sum(q * k for q, k in zip(query, key)) for key in keys[:receiver + 1]])
        denominator = amounts.sum()
        if denominator <= 0:
            raise ValueError("Reference has no positive overlap.")
        output.append(np.array([sum(amount * value[column] for amount, value in zip(amounts, values[:receiver + 1])) / denominator
                                for column in range(values.shape[1])]))
    return np.array(output)


def causal_gradients(queries, keys, values, upstream):
    """Quotient derivatives and reverse credit through every earlier write."""
    length, features = queries.shape
    value_width = values.shape[1]
    states = np.cumsum(keys[:, :, None] * values[:, None, :], axis=0)
    normalizers = np.cumsum(keys, axis=0)
    query_gradients = np.zeros_like(queries)
    key_gradients = np.zeros_like(keys)
    value_gradients = np.zeros_like(values)
    future_matrix_credit = np.zeros((features, value_width), dtype=queries.dtype)
    future_normalizer_credit = np.zeros(features, dtype=queries.dtype)
    for receiver in range(length - 1, -1, -1):
        query, state, normalizer = queries[receiver], states[receiver], normalizers[receiver]
        denominator = query @ normalizer
        if denominator <= 0:
            raise ValueError("Derivative has no positive overlap.")
        output = query @ state / denominator
        numerator_credit = upstream[receiver] / denominator
        denominator_credit = -(upstream[receiver] @ output) / denominator
        query_gradients[receiver] = state @ numerator_credit + normalizer * denominator_credit
        future_matrix_credit += np.outer(query, numerator_credit)
        future_normalizer_credit += query * denominator_credit
        key_gradients[receiver] = future_matrix_credit @ values[receiver] + future_normalizer_credit
        value_gradients[receiver] = future_matrix_credit.T @ keys[receiver]
    return query_gradients, key_gradients, value_gradients


def gathered_window(queries, keys, values, window):
    """O(L*W*(d_k+d_v)) reference; never allocates an L-by-L score matrix."""
    if window < 1:
        raise ValueError("Window includes self and must be positive.")
    result = []
    for receiver, query in enumerate(queries):
        first = max(0, receiver - window + 1)
        scores = keys[first:receiver + 1] @ query / np.sqrt(keys.shape[1])
        mass = np.exp(scores - scores.max())
        result.append((mass / mass.sum()) @ values[first:receiver + 1])
    return np.array(result)


def unchanged(before, after):
    return all(np.array_equal(a, b) if isinstance(a, np.ndarray) else a == b for a, b in zip(before, after))


def smoke_checks():
    import torch
    import torch.nn.functional as functional
    torch.set_num_threads(1)
    rng = np.random.default_rng(23)
    q, k = rng.uniform(.2, 2, (2, 7, 3))
    v = rng.normal(size=(7, 2))
    upstream = rng.normal(size=(7, 2))
    report = {"python": sys.version.split()[0], "numpy": np.__version__, "torch": torch.__version__}
    for dtype, tolerance in [(np.float32, 3e-6), (np.float64, 2e-13)]:
        memory = FeatureMemory(3, 2, dtype=dtype)
        observed = []
        for start, stop in [(0, 2), (2, 5), (5, 7)]:
            for row in range(start, stop):
                observed.append(memory.append_and_read(q[row], k[row], v[row]))
        reference = pair_reference(q.astype(dtype), k.astype(dtype), v.astype(dtype))
        error = float(np.max(np.abs(np.array(observed) - reference)))
        assert error < tolerance
        report[f"{np.dtype(dtype).name}_chunk_stream_error"] = error
    memory = FeatureMemory(3, 2)
    memory.append([0, 0, 0], [9, -4])
    assert memory.count == 1 and not memory.matrix.any() and not memory.normalizer.any()
    before = memory.snapshot()
    invalid = [lambda: memory.read([0, 0, 0]), lambda: memory.append_and_read([0, 0, 0], [1, 2, 3], [1, 2]),
               lambda: memory.append([1, -1, 0], [1, 2]), lambda: memory.append([1, 2, 3], [1, np.nan]),
               lambda: memory.append([1, 2], [1, 2]), lambda: memory.append([1, 2, 3], [1, 2], identity=("another", "map"))]
    for attempt in invalid:
        try:
            attempt()
        except (ValueError, FloatingPointError):
            assert unchanged(before, memory.snapshot())
        else:
            raise AssertionError("Invalid operation was accepted.")
    report["atomic_invalid_operations"] = len(invalid)
    memory.reset()
    for key, value in zip(k, v):
        memory.append(key, value)
    memory.evict_known(k[0], v[0])
    amounts = k[1:] @ q[-1]
    report["known_eviction_error"] = float(np.max(np.abs(memory.read(q[-1]) - amounts @ v[1:] / amounts.sum())))
    assert report["known_eviction_error"] < 2e-12
    inspected = memory.snapshot()
    assert not inspected[0].flags.writeable and not inspected[1].flags.writeable
    sampled_projection = rng.normal(size=(16, 3))
    gaussian = GaussianFeatureMemory(sampled_projection, 2)
    sampled = [gaussian.append_and_read(query, key, value) for query, key, value in zip(q, k, v)]
    q_phi = np.exp(q @ sampled_projection.T - np.square(q).sum(axis=1, keepdims=True) / 2)
    k_phi = np.exp(k @ sampled_projection.T - np.square(k).sum(axis=1, keepdims=True) / 2)
    report["common_scale_pair_error"] = float(np.max(np.abs(np.array(sampled) - pair_reference(q_phi, k_phi, v))))
    assert report["common_scale_pair_error"] < 2e-12
    gaussian.evict_known(k[0], v[0])
    amounts = k_phi[1:] @ q_phi[-1]
    report["sampled_known_eviction_error"] = float(np.max(np.abs(gaussian.read(q[-1]) - amounts @ v[1:] / amounts.sum())))
    assert report["sampled_known_eviction_error"] < 2e-12
    changing_scale = GaussianFeatureMemory([[1, 0], [0, 1]], 1)
    changing_scale.append([0, 0], [1])
    first_scale = changing_scale.key_log_scale
    result = changing_scale.append_and_read([1, 0], [.5, 0], [3])
    assert changing_scale.key_log_scale > first_scale
    unscaled_query = np.exp(np.array([1., 0.]) - .5)
    unscaled_keys = np.array([[1., 1.], np.exp(np.array([.5, 0.]) - .125)])
    amounts = unscaled_keys @ unscaled_query
    expected = amounts @ np.array([[1.], [3.]]) / amounts.sum()
    report["forced_key_scale_change_error"] = float(np.max(np.abs(result - expected)))
    assert report["forced_key_scale_change_error"] < 2e-12
    before = gaussian.snapshot()
    try:
        gaussian.append_and_read([np.nan, 0, 0], [1, 2, 3], [1, 2])
    except ValueError:
        assert unchanged(before, gaussian.snapshot())
    else:
        raise AssertionError("Invalid query corrupted the Gaussian state.")
    gaussian.reset(identity=("new-sequence", "same-Gaussian-draw"))
    assert gaussian.count == 0 and gaussian.key_log_scale is None and not gaussian.matrix.any() and not gaussian.normalizer.any()
    manual = causal_gradients(q, k, v, upstream)
    tq, tk, tv = [torch.tensor(array, dtype=torch.float64, requires_grad=True) for array in (q, k, v)]
    states = torch.cumsum(tk.unsqueeze(-1) * tv.unsqueeze(-2), dim=0)
    normalizers = torch.cumsum(tk, dim=0)
    output = torch.einsum('lm,lmv->lv', tq, states) / (tq * normalizers).sum(dim=-1, keepdim=True)
    native = torch.autograd.grad((output * torch.tensor(upstream)).sum(), (tq, tk, tv))
    report["reverse_scan_autograd_error"] = max(float(np.max(np.abs(expected - actual.detach().numpy()))) for expected, actual in zip(manual, native))
    assert report["reverse_scan_autograd_error"] < 2e-12
    epsilon, finite_error = 1e-5, 0.
    for kind, base in enumerate((q, k, v)):
        for index in np.ndindex(base.shape):
            high, low = [array.copy() for array in (q, k, v)], [array.copy() for array in (q, k, v)]
            high[kind][index] += epsilon
            low[kind][index] -= epsilon
            expected = ((pair_reference(*high) * upstream).sum() - (pair_reference(*low) * upstream).sum()) / (2 * epsilon)
            finite_error = max(finite_error, abs(expected - manual[kind][index]))
    report["reverse_scan_finite_difference_error"] = finite_error
    assert finite_error < 2e-9
    queries, keys = rng.normal(size=(2, 7, 3))
    window = 3
    permission = torch.arange(7)[:, None] - torch.arange(7)[None, :]
    allowed = (permission >= 0) & (permission < window)
    native_window = functional.scaled_dot_product_attention(torch.tensor(queries)[None, None], torch.tensor(keys)[None, None], torch.tensor(v)[None, None], attn_mask=allowed)
    report["gathered_window_sdpa_error"] = float(np.max(np.abs(gathered_window(queries, keys, v, window) - native_window[0, 0].numpy())))
    assert report["gathered_window_sdpa_error"] < 2e-12
    return report


def saved_model_smoke():
    import torch
    root = Path(__file__).resolve().parent
    specification = importlib.util.spec_from_file_location('retained_attention_study', root / 'author-calculations.py')
    study = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(study)
    assets = json.loads((root / 'forecast-models.json').read_text(encoding='utf-8'))
    points, _, _, _ = study.load_records()
    report = {}
    with torch.no_grad():
        for mode in ('dense', 'window', 'kernel'):
            model = study.AttentionForecaster(mode)
            model.load_state_dict({name: torch.tensor(value) for name, value in assets[mode]['weights'].items()})
            model.eval()
            prefix = points[76:77, :27]
            actual = ((model(prefix)[0][0, -1] + 1) / 2).numpy()
            expected = np.asarray(assets[mode]['fresh_gated_example']['forecast'])
            error = float(np.max(np.abs(actual - expected)))
            assert error < 2e-6
            report[mode] = {"reload_error": error, "forecast": actual.tolist()}
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--saved-models', action='store_true')
    arguments = parser.parse_args()
    result = smoke_checks()
    if arguments.saved_models:
        result['saved_model_checks'] = saved_model_smoke()
    print(json.dumps(result, indent=2))
