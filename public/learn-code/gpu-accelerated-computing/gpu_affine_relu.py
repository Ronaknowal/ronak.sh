"""Inspect a grid-stride kernel on CPU; optionally compile/check/time it on CUDA.

CPU:  python gpu_affine_relu.py
CUDA: python gpu_affine_relu.py --cuda --size 1000000 --repeats 20
Install a CuPy package compatible with your CUDA installation for --cuda.
This finite float32, contiguous-vector example is not a general tensor kernel.
"""
from __future__ import annotations

import argparse
import json
import statistics
import time

import numpy as np


CUDA_SOURCE = r'''
extern "C" __global__
void affine_relu(const float* x, float* out, float a, float b,
                 unsigned long long n) {
    const unsigned long long first =
        (unsigned long long) blockIdx.x * blockDim.x + threadIdx.x;
    const unsigned long long stride =
        (unsigned long long) gridDim.x * blockDim.x;
    for (unsigned long long i = first; i < n; i += stride) {
        out[i] = fmaxf(0.0f, a * x[i] + b);
    }
}
'''


def launch_ownership(size: int, blocks: int, threads: int) -> list[list[int]]:
    """Audit the mathematical indexing, not GPU scheduling or CUDA execution."""
    if (not all(isinstance(value, int) for value in (size, blocks, threads))
            or size < 0 or blocks < 1 or threads < 1):
        raise ValueError("Require size >= 0 and positive launch dimensions")
    stride = blocks * threads
    return [list(range(first, size, stride)) for first in range(stride)]


def cpu_grid_stride(x: np.ndarray, a: float, b: float,
                    blocks: int, threads: int) -> np.ndarray:
    if x.ndim != 1 or x.dtype != np.float32 or not x.flags.c_contiguous:
        raise ValueError("x must be a contiguous float32 vector")
    if (not np.isfinite(x).all() or not np.isfinite([a, b]).all()
            or max(abs(a), abs(b)) > float(np.finfo(np.float32).max)):
        raise ValueError("This example requires finite inputs")
    out = np.empty_like(x)
    a, b = np.float32(a), np.float32(b)
    for indices in launch_ownership(x.size, blocks, threads):
        for index in indices:
            out[index] = max(np.float32(0), a * x[index] + b)
    return out


def cpu_checks() -> dict:
    cases = 0
    for size in (0, 1, 3, 7, 19, 31, 32, 33, 257):
        x = np.linspace(-3, 3, size, dtype=np.float32)
        reference = np.maximum(np.float32(0), np.float32(1.25) * x - np.float32(.3))
        for blocks, threads in ((1, 1), (2, 4), (3, 8), (2, 32)):
            ownership = launch_ownership(size, blocks, threads)
            visits = [index for indices in ownership for index in indices]
            assert sorted(visits) == list(range(size)), "missing/duplicate writer"
            np.testing.assert_array_equal(cpu_grid_stride(x, 1.25, -.3, blocks, threads), reference)
            cases += 1
    return {"index_and_numpy_cases": cases, "cuda_executed": False,
            "example_n19_blocks2_threads4": launch_ownership(19, 2, 4)}


def summarize(samples: list[float]) -> dict:
    return {"median_ms": statistics.median(samples),
            "min_ms": min(samples), "max_ms": max(samples)}


def cuda_checks(size: int, repeats: int) -> dict:
    # Import only when CUDA was explicitly requested. Missing runtime/hardware
    # raises an error; it is not silently converted into a passing CPU result.
    import cupy as cp

    if size < 1 or repeats < 1:
        raise ValueError("CUDA timing needs positive size and repeats")
    if cp.cuda.runtime.getDeviceCount() < 1:
        raise RuntimeError("No CUDA device is available")
    kernel = cp.RawKernel(CUDA_SOURCE, "affine_relu", options=("--std=c++17",))
    a, b = np.float32(1.25), np.float32(-.3)

    def launch(x, out):
        threads = 256
        blocks = min(256, (x.size + threads - 1) // threads)
        kernel((blocks,), (threads,), (x, out, a, b, np.uint64(x.size)))

    # Validate partial blocks and grid-stride reuse before timing a workload.
    for count in (1, 19, 255, 256, 257, 65537):
        host = np.linspace(-3, 3, count, dtype=np.float32)
        device = cp.asarray(host)
        output = cp.empty_like(device)
        launch(device, output)
        ordinary = cp.maximum(a * device + b, cp.float32(0))
        expected = np.maximum(a * host + b, np.float32(0))
        np.testing.assert_allclose(cp.asnumpy(output), expected, atol=2e-6, rtol=2e-6)
        cp.testing.assert_allclose(output, ordinary, atol=2e-6, rtol=2e-6)

    host = np.linspace(-3, 3, size, dtype=np.float32)
    device = cp.asarray(host)
    output = cp.empty_like(device)
    for _ in range(5):
        launch(device, output)
        cp.maximum(a * device + b, cp.float32(0))
    cp.cuda.get_current_stream().synchronize()

    def event_samples(operation):
        values = []
        start, end = cp.cuda.Event(), cp.cuda.Event()
        for _ in range(repeats):
            start.record()
            operation()
            end.record()
            end.synchronize()
            values.append(float(cp.cuda.get_elapsed_time(start, end)))
        return summarize(values)

    resident = event_samples(lambda: launch(device, output))
    ordinary = event_samples(lambda: cp.maximum(a * device + b, cp.float32(0)))
    # A separate end-to-end boundary includes H2D, output allocation, launch,
    # D2H, and the Python/driver work inside the synchronized wall interval.
    wall_samples = []
    for _ in range(repeats):
        cp.cuda.get_current_stream().synchronize()
        start = time.perf_counter()
        incoming = cp.asarray(host)
        outgoing = cp.empty_like(incoming)
        launch(incoming, outgoing)
        restored = cp.asnumpy(outgoing)  # blocking default: host result ready
        cp.cuda.get_current_stream().synchronize()
        wall_samples.append(1000 * (time.perf_counter() - start))
        np.testing.assert_allclose(restored, np.maximum(a * host + b, 0),
                                   atol=2e-6, rtol=2e-6)
    properties = cp.cuda.runtime.getDeviceProperties(cp.cuda.Device().id)
    name = properties["name"]
    return {"cuda_executed": True, "cupy": cp.__version__,
            "device": name.decode() if isinstance(name, bytes) else name,
            "cuda_runtime": cp.cuda.runtime.runtimeGetVersion(),
            "size": size, "dtype": "float32", "warmup": 5, "repeats": repeats,
            "native_parity_sizes": [1, 19, 255, 256, 257, 65537],
            "resident_raw_kernel_events": resident,
            "resident_array_expression_events": ordinary,
            "allocation_copy_kernel_copy_wall": summarize(wall_samples),
            "limits": "One device/stream, finite contiguous vectors. Warm allocator/context. No throughput generalization."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cuda", action="store_true")
    parser.add_argument("--size", type=int, default=1_000_000)
    parser.add_argument("--repeats", type=int, default=20)
    args = parser.parse_args()
    report = {"numpy": np.__version__, "cpu": cpu_checks()}
    report["cuda"] = cuda_checks(args.size, args.repeats) if args.cuda else {
        "executed": False, "reason": "Run --cuda on a configured CUDA device for native parity and timing"}
    print(json.dumps(report, indent=2))
