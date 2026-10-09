"""Compose learned maps with the exact sibling ring-attention-reference.py.

One sequence: X[L, input_channels], maps[input_channels, heads*width].
Float64 CPU teaching composition, no bias, dropout, GPU fusion or transport.
Download BOTH files into the same directory. Requires NumPy and PyTorch.
The executable checks all map/input derivatives; it never trains a model.
"""
from dataclasses import dataclass
import importlib.util
import json
from pathlib import Path
import numpy as np
import torch
from torch.nn import functional as F

_spec = importlib.util.spec_from_file_location(
    "ring_reference", Path(__file__).with_name("ring-attention-reference.py"))
if _spec is None or _spec.loader is None:
    raise ImportError("The sibling ring-attention-reference.py is required")
reference = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(reference)


@dataclass(frozen=True)
class Maps:
    query: np.ndarray
    key: np.ndarray
    value: np.ndarray


def project_and_read(x, maps, heads, owners, allowed, direction=1):
    """Validate the complete contract before numerical work; return saved VJP state."""
    if not isinstance(heads, int) or heads < 1:
        raise ValueError("heads must be a positive integer")
    arrays = [x, maps.query, maps.key, maps.value]
    if any(not isinstance(a, np.ndarray) or a.ndim != 2 or
           a.dtype != np.float64 or not np.isfinite(a).all() for a in arrays):
        raise ValueError("X and maps must be finite float64 matrices")
    length, channels = x.shape
    if length < 1 or channels < 1 or any(w.shape[0] != channels for w in arrays[1:]):
        raise ValueError("Maps must accept X's nonempty input channel axis")
    if maps.query.shape != maps.key.shape:
        raise ValueError("Query and key maps must have the same shape")
    if any(w.shape[1] < heads or w.shape[1] % heads for w in arrays[1:]):
        raise ValueError("Each projected width must split into nonempty equal heads")
    if (not isinstance(allowed, np.ndarray) or allowed.dtype != np.bool_ or
            allowed.shape != (length, length)):
        raise ValueError("allowed must be a GLOBAL boolean [L,L] matrix")
    # The imported exact reference validates nonempty exact ownership/direction.
    query, key, value = [
        (x @ w).reshape(length, heads, w.shape[1] // heads).transpose(1, 0, 2)
        for w in arrays[1:]]
    output, lse, _ = reference.ring_attention(
        query, key, value, owners, allowed, direction)
    return output, (query, key, value, output, lse)


def projected_vjp(x, maps, owners, allowed, saved, upstream):
    """Vector-Jacobian product for SUM upstream*output; no loss averaging hidden."""
    query, key, value, output, lse = saved
    if (not isinstance(upstream, np.ndarray) or upstream.shape != output.shape or
            upstream.dtype != np.float64 or not np.isfinite(upstream).all()):
        raise ValueError("upstream must be finite float64 with output's exact shape")
    dq, dk, dv = reference.blockwise_backward(
        query, key, value, owners, allowed, output, lse, upstream)
    flat = [g.transpose(1, 0, 2).reshape(x.shape[0], -1) for g in (dq, dk, dv)]
    dw = Maps(*(x.T @ g for g in flat))
    dx_parts = [g @ w.T for g, w in zip(flat, (maps.query, maps.key, maps.value))]
    dx = np.add.reduce(dx_parts)
    # Shared-map replicas need the SUM of disjoint position-owner contributions.
    partials = [Maps(*(x[ids].T @ g[ids] for g in flat)) for ids in owners]
    for name in ("query", "key", "value"):
        np.testing.assert_allclose(
            np.add.reduce([getattr(p, name) for p in partials]),
            getattr(dw, name), rtol=1e-12, atol=1e-12)
    return dx, dw, partials


def torch_route(x, maps, heads, allowed, upstream):
    tx = torch.tensor(x, requires_grad=True)
    weights = [torch.tensor(w, requires_grad=True) for w in
               (maps.query, maps.key, maps.value)]
    q, k, v = [(tx @ w).reshape(len(x), heads, -1).transpose(0, 1)
               for w in weights]
    output = F.scaled_dot_product_attention(
        q, k, v, attn_mask=torch.tensor(allowed), dropout_p=0.0,
        is_causal=False)
    (output * torch.tensor(upstream)).sum().backward()
    return (output.detach().numpy(), tx.grad.numpy(),
            Maps(*(w.grad.numpy() for w in weights)))


def run_checks():
    rng = np.random.default_rng(361)
    x = rng.normal(size=(7, 4))
    maps = Maps(rng.normal(size=(4, 6)), rng.normal(size=(4, 6)),
                rng.normal(size=(4, 4)))
    docs = np.array([0, 0, 0, 1, 1, 1, 1])
    causal = np.arange(7)[None, :] <= np.arange(7)[:, None]
    packed = causal & (docs[:, None] == docs[None, :])
    packed[5] = False  # The explicit zero-output convention for an empty row.
    upstream = rng.normal(size=(2, 7, 2))
    owners = list(np.array_split(np.arange(7), 3))
    maximum_native = 0.0
    for mask in (packed, np.ones((7, 7), dtype=bool), np.zeros((7, 7), dtype=bool)):
        native, native_dx, native_dw = torch_route(x, maps, 2, mask, upstream)
        for partition in (owners, [np.arange(7)], list(np.array_split(np.arange(7), 7))):
            for direction in (-1, 1):
                output, saved = project_and_read(x, maps, 2, partition, mask, direction)
                dx, dw, _ = projected_vjp(x, maps, partition, mask, saved, upstream)
                for actual, expected in [(output, native), (dx, native_dx)] + [
                        (getattr(dw, name), getattr(native_dw, name))
                        for name in ("query", "key", "value")]:
                    np.testing.assert_allclose(actual, expected, rtol=2e-11, atol=2e-11)
                    maximum_native = max(maximum_native, float(np.max(np.abs(actual-expected))))
    output, saved = project_and_read(x, maps, 2, owners, packed)
    dx, dw, partials = projected_vjp(x, maps, owners, packed, saved, upstream)
    epsilon = 1e-6
    maximum_finite_difference = 0.0
    def objective():
        return float(np.sum(project_and_read(x, maps, 2, owners, packed)[0] * upstream))
    for array, gradient in [(x, dx)] + [
            (getattr(maps, name), getattr(dw, name)) for name in ("query", "key", "value")]:
        for index in np.ndindex(array.shape):
            original = array[index]
            try:
                array[index] = original + epsilon
                plus = objective()
                array[index] = original - epsilon
                minus = objective()
            finally:
                array[index] = original
            numerical = (plus-minus)/(2*epsilon)
            np.testing.assert_allclose(gradient[index], numerical, rtol=2e-5, atol=2e-8)
            maximum_finite_difference = max(
                maximum_finite_difference, float(abs(gradient[index]-numerical)))
    # Arbitrary physical permutation preserves outputs and derivatives by global ID.
    shuffled = [np.array([6, 0, 4]), np.array([1, 5]), np.array([3, 2])]
    moved, moved_saved = project_and_read(x, maps, 2, shuffled, packed, -1)
    moved_dx, moved_dw, _ = projected_vjp(x, maps, shuffled, packed, moved_saved, upstream)
    np.testing.assert_allclose(moved, output, rtol=1e-12, atol=1e-12)
    np.testing.assert_allclose(moved_dx, dx, rtol=1e-12, atol=1e-12)
    for name in ("query", "key", "value"):
        np.testing.assert_allclose(getattr(moved_dw, name), getattr(dw, name), rtol=1e-12, atol=1e-12)
    zeros = np.zeros_like(upstream)
    zero_dx, zero_dw, _ = projected_vjp(x, maps, owners, packed, saved, zeros)
    assert np.count_nonzero(zero_dx) == 0
    assert all(np.count_nonzero(getattr(zero_dw, name)) == 0 for name in ("query", "key", "value"))
    # The mean of CP replica partials is smaller than their required global sum.
    mean_partial = np.mean([p.query for p in partials], axis=0)
    np.testing.assert_allclose(mean_partial * len(owners), dw.query, rtol=1e-12, atol=1e-12)
    invalid_cases = [lambda: project_and_read(x, maps, 0, owners, packed),
                     lambda: project_and_read(x, maps, 2, [np.array([0, 1])], packed),
                     lambda: project_and_read(x, maps, 2, owners, packed.astype(float)),
                     lambda: projected_vjp(x, maps, owners, packed, saved, upstream[:, :-1])]
    for invalid in invalid_cases:
        try:
            invalid()
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid contract did not fail")
    return {"passed": True, "numpy": np.__version__, "torch": torch.__version__,
            "native_cases": 18, "all_input_and_parameter_finite_differences": 92,
            "maximum_native_difference": maximum_native,
            "maximum_finite_difference_error": maximum_finite_difference,
            "ownership_permutation": "passed", "zero_upstream": "passed",
            "invalid_contracts": len(invalid_cases),
            "scope": "CPU float64 composition; no distributed transport, fit or GPU claim"}


if __name__ == "__main__":
    print(json.dumps(run_checks(), indent=2))
