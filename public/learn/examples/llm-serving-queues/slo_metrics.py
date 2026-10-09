"""Count SLO membership and merge cumulative histogram counts before quantiles.

Run: python slo_metrics.py
Optional: python slo_metrics.py --prometheus metrics.txt
The built-in request and vLLM-style metric records are constructed examples.
They are not a captured production endpoint or measured GPU performance.
Raw sample quantiles use linear/type7 interpolation; bucket estimates differ.
"""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

from trace_replay import quantile


METRIC = "vllm:e2e_request_latency_seconds_bucket"
LABEL_PATTERN = re.compile(r'(\w+)="((?:\\.|[^"\\])*)"')
SAMPLE_PATTERN = re.compile(r'^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+([^\s]+)(?:\s+\S+)?$')
DEFAULT_REQUESTS = [
    {"id": "A", "arrival": 0, "status": "completed", "outputs": [.2, .4], "finish": .4},
    {"id": "B", "arrival": .1, "status": "completed", "outputs": [.3], "finish": .3},
    {"id": "C", "arrival": .2, "status": "rejected", "outputs": [], "finish": None},
    {"id": "D", "arrival": .3, "status": "canceled", "outputs": [], "finish": .6},
    {"id": "E", "arrival": .4, "status": "completed", "outputs": [1.5, 2], "finish": 2},
]


def summarize_requests(records: list[dict], left: float, right: float,
                       ttft_target: float = .5, e2e_target: float = 1,
                       gap_target: float = .3) -> dict:
    if not all(math.isfinite(value) for value in (left, right, ttft_target, e2e_target, gap_target)):
        raise ValueError("Finite window and targets required.")
    if left < 0 or right <= left or min(ttft_target, e2e_target, gap_target) < 0:
        raise ValueError("Positive window and nonnegative targets required.")
    members = []
    for row in records:
        if not math.isfinite(row["arrival"]) or row["arrival"] < 0:
            raise ValueError("Arrival must be finite nonnegative seconds.")
        if not left <= row["arrival"] < right:
            continue
        outputs = row.get("outputs", [])
        if any(not math.isfinite(value) for value in outputs):
            raise ValueError("Output clock readings must be finite.")
        if any(a > b for a, b in zip([row["arrival"], *outputs], outputs)):
            raise ValueError("Output clock readings must be chronological.")
        finish = row.get("finish")
        if finish is not None and (not math.isfinite(finish) or finish < row["arrival"]
                                   or (outputs and finish < outputs[-1])):
            raise ValueError("Finish must be finite and cannot precede arrival/output.")
        completed_in_window = row["status"] == "completed" and finish is not None and finish <= right
        ttft = outputs[0]-row["arrival"] if outputs and outputs[0] <= right else None
        gaps = [b-a for a, b in zip(outputs, outputs[1:]) if b <= right]
        e2e = finish-row["arrival"] if completed_in_window else None
        # A one-output response has no gap violations, but its ITL statistic is undefined.
        passes = (completed_in_window and ttft is not None and ttft <= ttft_target
                  and e2e <= e2e_target and all(gap <= gap_target for gap in gaps))
        members.append({"id": row["id"], "status": row["status"], "ttft": ttft,
                        "e2e": e2e, "gaps": gaps, "mean_tpot": sum(gaps)/len(gaps) if gaps else None,
                        "completed_in_window": completed_in_window, "meets_all_targets": passes})
    offered = len(members)
    accepted = sum(row["status"] not in {"rejected", "not-arrived"} for row in members)
    completed = sum(row["completed_in_window"] for row in members)
    good = sum(row["meets_all_targets"] for row in members)
    elapsed = right-left
    return {"arrival_cohort_window": [left, right], "records": members,
            "offered": offered, "accepted": accepted, "completed_by_window_end": completed,
            "offered_rate": offered/elapsed, "accepted_rate": accepted/elapsed,
            "cohort_completion_rate": completed/elapsed, "goodput": good/elapsed,
            "good_fraction_of_offered": good/offered if offered else None,
            "good_fraction_of_accepted": good/accepted if accepted else None,
            "note": "Arrival cohort, includes loss/cancel/censor. Not a completion-window stationary estimator."}


def cumulative_buckets(values: list[float], edges: list[float]) -> list[float]:
    if any(not math.isfinite(value) or value < 0 for value in values):
        raise ValueError("Latency values finite nonnegative seconds required.")
    if any(a >= b for a, b in zip(edges, edges[1:])) or not edges or edges[-1] != math.inf:
        raise ValueError("Increasing edges including final +Inf required.")
    return [sum(value <= edge for value in values) for edge in edges]


def bucket_quantile(edges: list[float], counts: list[float], probability: float) -> dict:
    if len(edges) != len(counts) or not edges or edges[-1] != math.inf:
        raise ValueError("Aligned cumulative counts and +Inf edge required.")
    if any(a >= b for a, b in zip(edges, edges[1:])) or any(a > b for a, b in zip(counts, counts[1:])):
        raise ValueError("Edges increasing and counts nondecreasing required.")
    if not 0 <= probability <= 1 or any(not math.isfinite(count) or count < 0 for count in counts):
        raise ValueError("Probability in[0,1] and finite nonnegative counts required.")
    if counts[-1] == 0:
        return {"estimate": None, "reason": "No observations."}
    rank = probability*counts[-1]
    lower_edge, lower_count = 0.0, 0.0
    for edge, count in zip(edges, counts):
        if count >= rank and count > lower_count:
            if math.isinf(edge):
                return {"estimate": None, "lower_bound": lower_edge,
                        "reason": "Target lies in unbounded upper bucket; no finite interpolation."}
            fraction = (rank-lower_count)/(count-lower_count)
            return {"estimate": lower_edge+fraction*(edge-lower_edge),
                    "bucket": [lower_edge, edge], "assumption": "Uniform position inside chosen bucket."}
        lower_edge, lower_count = edge, count
    return {"estimate": None, "reason": "Quantile unresolved."}


def parse_histogram(text: str, metric: str = METRIC) -> dict:
    """Read numeric classic histogram samples, grouping all labels except le.

    Counts must be from the same interval (or monotonic counter differences);
    this parser does not turn arbitrary cumulative snapshots into rates.
    """
    replicas = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        match = SAMPLE_PATTERN.match(line)
        if not match or match.group(1) != metric:
            continue
        labels = {key: json.loads('"'+value+'"') for key, value in LABEL_PATTERN.findall(match.group(2) or "")}
        if "le" not in labels:
            raise ValueError("Histogram sample lacks le bound.")
        bound = float(labels.pop("le"))
        value = float(match.group(3))
        identity = tuple(sorted(labels.items()))
        if bound in replicas.setdefault(identity, {}):
            raise ValueError("Duplicate label-set/bound sample.")
        replicas[identity][bound] = value
    if not replicas:
        raise ValueError("No matching histogram buckets found.")
    reference_edges = sorted(next(iter(replicas.values())))
    if any(sorted(buckets) != reference_edges for buckets in replicas.values()):
        raise ValueError("Histogram bucket boundaries differ; cannot directly merge.")
    for buckets in replicas.values():
        bucket_quantile(reference_edges, [buckets[edge] for edge in reference_edges], .99)
    merged = [sum(buckets[edge] for buckets in replicas.values()) for edge in reference_edges]
    bucket_quantile(reference_edges, merged, .99)
    return {"metric": metric, "replica_count": len(replicas),
            "edges": reference_edges, "merged_counts": merged}


def built_in_histogram() -> tuple[str, list[float]]:
    replicas = {"one": [.2, .4, 2], "two": [.3, .5, 4]}
    edges = [.5, 1, 3, 5, math.inf]
    lines = ["# Constructed metric fixture, not a captured vLLM endpoint."]
    for replica, values in replicas.items():
        for edge, count in zip(edges, cumulative_buckets(values, edges)):
            label = "+Inf" if math.isinf(edge) else str(edge)
            lines.append(f'{METRIC}{{replica="{replica}",le="{label}"}} {count}')
    return "\n".join(lines), [value for values in replicas.values() for value in values]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prometheus", type=Path)
    args = parser.parse_args()
    fixture, raw_values = built_in_histogram()
    text = args.prometheus.read_text(encoding="utf-8") if args.prometheus else fixture
    parsed = parse_histogram(text)
    report = {"slo_cohort": summarize_requests(DEFAULT_REQUESTS, 0, 2),
              "histogram": {"edges": ["+Inf" if math.isinf(edge) else edge for edge in parsed["edges"]],
                            "merged_counts": parsed["merged_counts"], "replicas": parsed["replica_count"]},
              "bucket_p99": bucket_quantile(parsed["edges"], parsed["merged_counts"], .99),
              "exact_raw_p99": quantile(raw_values, .99) if not args.prometheus else None,
              "built_in_data_constructed": not bool(args.prometheus)}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
