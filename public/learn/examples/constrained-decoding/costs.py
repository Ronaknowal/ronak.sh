"""Explicit arithmetic scenarios; these are not measured serving latencies.

python costs.py
Compile cost is paid once. Baseline independent retries have expected work
B/(1-f) per accepted request. This excludes queues and factual-error retries.
"""

import json
import math


def amortization(requests, compile_ms=12, base_ms=20, mask_ms=1, failure=0.1):
    if requests < 0 or min(compile_ms, base_ms, mask_ms) < 0 or not 0 <= failure < 1:
        raise ValueError("Costs/count must be nonnegative; failure in [0,1)")
    saving = base_ms / (1 - failure) - (base_ms + mask_ms)
    return {
        "retry_ms": requests * base_ms / (1 - failure),
        "constrained_ms": compile_ms + requests * (base_ms + mask_ms),
        "strictly_faster_after_requests": compile_ms / saving if saving > 0 else None,
    }


def overlap(model_ms, mask_ms, transfer_ms):
    if min(model_ms, mask_ms, transfer_ms) < 0:
        raise ValueError("Durations cannot be negative")
    return {
        "serial_ms": model_ms + mask_ms + transfer_ms,
        "overlapped_ms": max(model_ms, mask_ms) + transfer_ms,
        "assumption": "Mask work and next model work can run independently; transfer synchronizes them.",
    }


def mask_storage(vocabulary, listed_ids, index_bytes=4):
    if (
        not 0 <= listed_ids <= vocabulary
        or type(vocabulary) is not int
        or type(listed_ids) is not int
    ):
        raise ValueError("Integer vocabulary and list counts required")
    return {
        "packed_bits_bytes": 4 * math.ceil(vocabulary / 32),
        "sparse_ids_bytes": listed_ids * index_bytes,
        "excludes": "container metadata, next-state payloads and runtime work",
    }


def main():
    print(
        json.dumps(
            {
                "amortization": [
                    {"requests": r, **amortization(r)} for r in [1, 9, 10, 30]
                ],
                "no_failure": amortization(30, failure=0),
                "overlap": overlap(8, 3, 1),
                "mask_storage": mask_storage(50304, 100),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
