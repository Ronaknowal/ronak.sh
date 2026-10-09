"""Inspect a real licensed arrival/token trace, then simulate a declared proxy.

Run: python trace_replay.py --stretch 1 --alpha .0002 --beta .003
CSV is the first512 Azure conversation rows, unchanged observed fields plus row id.
alpha=seconds/input-token, beta=seconds/output-token are fictional coefficients.
Every queue latency below is modelled, never a measured Azure/GPU observation.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from datetime import datetime
from pathlib import Path
from statistics import fmean, pvariance

from queue_trace import Request, fcfs, measure


def quantile(values: list[float], probability: float) -> float | None:
    """Linear sample quantile (type7), distinct from histogram interpolation."""
    if not 0 <= probability <= 1:
        raise ValueError("Quantile probability must be between zero and one.")
    if not values:
        return None
    ordered = sorted(values)
    position = (len(ordered)-1)*probability
    low, high = math.floor(position), math.ceil(position)
    return ordered[low]+(ordered[high]-ordered[low])*(position-low)


def load_trace(path: Path) -> tuple[list[dict], dict]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        original = list(csv.DictReader(handle))
    if not original:
        raise ValueError("Trace is empty.")
    rows = []
    first = datetime.fromisoformat(original[0]["TIMESTAMP"])
    previous = -math.inf
    for item in original:
        timestamp = datetime.fromisoformat(item["TIMESTAMP"])
        relative = (timestamp-first).total_seconds()
        prompt, output = int(item["ContextTokens"]), int(item["GeneratedTokens"])
        if relative < previous or min(prompt, output) < 0:
            raise ValueError("Chronological times and nonnegative token counts required.")
        rows.append({"source_row": int(item["source_row"]),
                     "raw_timestamp": item["TIMESTAMP"], "relative_seconds": relative,
                     "context_tokens": prompt, "generated_tokens": output})
        previous = relative
    return rows, {"file_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                  "rows": len(rows), "first_raw_timestamp": original[0]["TIMESTAMP"],
                  "last_raw_timestamp": original[-1]["TIMESTAMP"],
                  "time_precision": "Raw strings preserved. Python datetime truncates fractional digits beyond microseconds."}


def diagnostics(rows: list[dict], bin_seconds: float = 1) -> dict:
    if not math.isfinite(bin_seconds) or bin_seconds <= 0:
        raise ValueError("Bin width must be finite positive seconds.")
    times = [row["relative_seconds"] for row in rows]
    gaps = [b-a for a, b in zip(times, times[1:])]
    count_bins = [0]*(math.floor(times[-1]/bin_seconds)+1)
    for time in times:
        count_bins[math.floor(time/bin_seconds)] += 1
    mean_gap = fmean(gaps) if gaps else None
    cv_squared = pvariance(gaps)/mean_gap**2 if mean_gap and len(gaps) > 1 else None
    prompts = [row["context_tokens"] for row in rows]
    outputs = [row["generated_tokens"] for row in rows]
    mean_count = fmean(count_bins)
    return {"elapsed_seconds": times[-1], "gap_count": len(gaps), "mean_gap": mean_gap,
            "observed_gap_cv_squared": cv_squared, "bin_seconds": bin_seconds,
            "bin_counts": count_bins,
            "count_dispersion": pvariance(count_bins)/mean_count if mean_count else None,
            "edge_bin_note": "Last bin can be partial; this finite count diagnostic does not prove Poisson input.",
            "prompt_tokens": {"mean": fmean(prompts), "p50": quantile(prompts, .5), "p99": quantile(prompts, .99)},
            "output_tokens": {"mean": fmean(outputs), "p50": quantile(outputs, .5), "p99": quantile(outputs, .99)},
            "observed_latency": None}


def replay(rows: list[dict], stretch: float = 1, alpha: float = .0002,
           beta: float = .003) -> dict:
    if not all(math.isfinite(value) for value in (stretch, alpha, beta)):
        raise ValueError("Finite coefficients required.")
    if stretch <= 0 or min(alpha, beta) < 0 or alpha+beta == 0:
        raise ValueError("Stretch positive; nonnegative nonzero cost coefficients required.")
    requests = [Request(f"Azure-row-{row['source_row']}", row["relative_seconds"]*stretch,
                        row["context_tokens"]*alpha+row["generated_tokens"]*beta) for row in rows]
    records = fcfs(requests)
    horizon = max(row["departure"] for row in records)
    observation_cutoff = rows[-1]["relative_seconds"]*stretch
    waits = [row["wait"] for row in records]
    residences = [row["residence"] for row in records]
    return {"scope": "Simulated FCFS proxy, not measured serving performance.",
            "stretch": stretch, "alpha_seconds_per_input_token": alpha,
            "beta_seconds_per_output_token": beta, "records": records,
            "mean_wait": fmean(waits), "wait_p99": quantile(waits, .99),
            "mean_response": fmean(residences), "response_p99": quantile(residences, .99),
            "drained_measurement": measure(records, 0, horizon) if horizon > 0 else None,
            "arrival_window_measurement": measure(records, 0, observation_cutoff) if observation_cutoff > 0 else None,
            "coefficients_measured": False}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=Path(__file__).with_name("azure-conversation-512.csv"))
    parser.add_argument("--stretch", type=float, default=1)
    parser.add_argument("--alpha", type=float, default=.0002)
    parser.add_argument("--beta", type=float, default=.003)
    parser.add_argument("--bin-seconds", type=float, default=1)
    args = parser.parse_args()
    rows, source = load_trace(args.csv)
    report = {"source": source, "observed": diagnostics(rows, args.bin_seconds),
              "modelled": replay(rows, args.stretch, args.alpha, args.beta)}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
