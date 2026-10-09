"""Logical memory and nominal arithmetic, with an independent NumPy matmul."""
import json
from math import prod


def kv_bytes(layers, kv_heads, head_width, positions, requests, element_bytes):
    dimensions = (layers, 2, kv_heads, positions, requests, head_width, element_bytes)
    if any(not isinstance(value, int) or value < 0 for value in dimensions):
        raise ValueError("Dimensions must be nonnegative integers")
    return prod(dimensions)


def capacity_requests(device_bytes, parameters, weight_bytes, workspace_bytes,
                      kv_per_request):
    remaining = device_bytes - parameters * weight_bytes - workspace_bytes
    if remaining < 0:
        return {"weights_fit": False, "max_requests": 0, "remaining_bytes": remaining}
    if kv_per_request <= 0:
        raise ValueError("A positive per-request KV allocation is required")
    return {"weights_fit": True, "max_requests": remaining // kv_per_request,
            "remaining_bytes": remaining}


def matrix_counts(batch, inputs, outputs, element_bytes=2):
    """2 FLOPs per multiply-add; ideal each-input/weight/read and output/write once."""
    operations = 2 * batch * inputs * outputs
    bytes_moved = (batch * inputs + inputs * outputs + batch * outputs) * element_bytes
    return {"nominal_flops": operations, "compulsory_bytes": bytes_moved,
            "arithmetic_intensity": operations / bytes_moved if bytes_moved else None}


def matmul_scratch(x, weight):
    """Output is X @ W.T. Exposes each dot product without a matmul API."""
    if not x or not weight:
        return []
    width = len(weight[0])
    if any(len(row) != width for row in [*x, *weight]):
        raise ValueError("Inconsistent input width")
    return [[sum(value * coefficient for value, coefficient in zip(row, target))
             for target in weight] for row in x]


def roofline_lower_bound(operations, bytes_moved, math_per_second, bytes_per_second):
    if min(math_per_second, bytes_per_second) <= 0 or min(operations, bytes_moved) < 0:
        raise ValueError("Nonnegative work and positive resource rates are required")
    math_seconds = operations / math_per_second
    traffic_seconds = bytes_moved / bytes_per_second
    return {"math_seconds": math_seconds, "traffic_seconds": traffic_seconds,
            "overlap_lower_bound_seconds": max(math_seconds, traffic_seconds)}


def main():
    import numpy as np
    x = [[1, 2, 3], [2, 0, -1]]
    weight = [[1, 0, 2], [0, 1, 1], [1, -1, 0], [2, 2, 1]]
    scratch = matmul_scratch(x, weight)
    ordinary = np.asarray(x) @ np.asarray(weight).T
    np.testing.assert_array_equal(scratch, ordinary)
    print(json.dumps({"X": x, "W": weight, "Y": scratch,
                      "counts": matrix_counts(2, 3, 4)}))
    cache = kv_bytes(32, 8, 128, 4096, 4, 2)
    print(json.dumps({"kv_bytes": cache, "kv_GiB": cache / 2**30,
                      "capacity": capacity_requests(24_000_000_000, 7_000_000_000,
                                                    2, 2_000_000_000, cache // 4)}))
    print(json.dumps(roofline_lower_bound(400e9, 20e9, 100e12, 1e12)))
    print(json.dumps(roofline_lower_bound(3.2e12, 22e9, 100e12, 1e12)))


if __name__ == "__main__":
    main()
