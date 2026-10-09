"""Distinguish total work, idealized makespan and an amortization identity.

python budgeting.py
Times are supplied scheduling examples, never measured GPU latencies.
"""
import heapq
import json
import math


def schedule(durations, workers):
    if not isinstance(workers, int) or workers < 1:
        raise ValueError("Positive integer worker count required")
    if any(not math.isfinite(x) or x < 0 for x in durations):
        raise ValueError("Durations must be finite and nonnegative")
    free = [(0.0, worker) for worker in range(workers)]
    rows = []
    for identity, duration in enumerate(durations):
        start, worker = heapq.heappop(free)
        end = start + duration
        rows.append({"job": identity, "worker": worker, "start": start, "end": end})
        heapq.heappush(free, (end, worker))
    return {"rows": rows, "total_work": sum(durations),
            "makespan": max((row["end"] for row in rows), default=0)}


def hybrid(breadth, depth, tokens_per_call, prompt_tokens):
    if any(not isinstance(x, int) or x < 1 for x in (breadth, depth, tokens_per_call)):
        raise ValueError("Positive integer dimensions required")
    if not isinstance(prompt_tokens, int) or prompt_tokens < 0:
        raise ValueError("Nonnegative prompt length required")
    # Each serial revision receives every previous response. No cache saving assumed.
    prefills = [prompt_tokens + level * tokens_per_call for level in range(depth)]
    return {"calls": breadth * depth, "generated_tokens": breadth * depth * tokens_per_call,
            "prompt_tokens_processed": breadth * sum(prefills),
            "critical_path_calls": depth, "per_chain_prefills": prefills}


def exchange(training, inference, multiplier):
    if not all(math.isfinite(x) for x in (training, inference, multiplier)):
        raise ValueError("Finite inputs required")
    if training < 0 or inference <= 0 or multiplier < 1:
        raise ValueError("Need X>=0,Y>0,M>=1")
    return (multiplier * (training + inference) - training) / inference


if __name__ == "__main__":
    print(json.dumps({"serial": schedule([2, 2, 2], 1),
                     "parallel": schedule([2, 2, 2], 3),
                     "hybrid": hybrid(2, 3, 10, 20),
                     "exchange_low_volume": exchange(100, 10, 2),
                     "exchange_high_volume": exchange(100, 100, 2)}, indent=2))
