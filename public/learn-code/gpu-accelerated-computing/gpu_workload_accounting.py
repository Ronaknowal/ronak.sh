"""A declared traffic/launch accounting model, never a measured GPU benchmark."""
import json
import math


def account(elements=1_000_000, stages=5, resident=True, fused=True,
            host_gb_s=16.0, device_gb_s=400.0, launch_us=10.0):
    if (not isinstance(elements, int) or not isinstance(stages, int)
            or not all(math.isfinite(value) for value in (host_gb_s, device_gb_s, launch_us))
            or elements < 1 or stages < 1 or host_gb_s <= 0
            or device_gb_s <= 0 or launch_us < 0):
        raise ValueError("Positive workload/bandwidth and nonnegative launch cost required")
    vector_bytes = 4 * elements
    transfers = 2 if resident else 2 * stages
    kernels = stages if fused else 3 * stages
    host_bytes = transfers * vector_bytes
    device_bytes = 2 * kernels * vector_bytes
    terms = {"host_transfer_us": host_bytes / (host_gb_s * 1000),
             "device_traffic_us": device_bytes / (device_gb_s * 1000),
             "launch_us": kernels * launch_us}
    return {"host_bytes": host_bytes, "device_bytes": device_bytes,
            "kernel_count": kernels, **terms, "model_total_us": sum(terms.values())}


if __name__ == "__main__":
    results = {f"resident={resident},fused={fused}": account(resident=resident, fused=fused)
               for resident in (False, True) for fused in (False, True)}
    assert account()["host_bytes"] == 8_000_000
    assert account()["device_bytes"] == 40_000_000
    assert account(resident=False, fused=False)["host_bytes"] == 40_000_000
    print(json.dumps({"model": "Sequential additive costs; decimal GB/s; no measured timings",
                      "excluded": "Compute, caches, overlap, allocator, context, compilation, contention",
                      "cases": results}, indent=2))
