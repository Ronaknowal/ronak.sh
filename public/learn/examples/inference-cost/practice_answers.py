"""Changed-input practice: exact accounting and independent integer choices."""
import argparse
from decimal import Decimal
import json
from pathlib import Path
from request_ledger import request_bill, retry_accounting, routed_tasks
from cache_accounting import prefix_requests, normalize_usage
from capacity_cost import reserved_charge, hardware_per_million, feasible_crossovers, failure_headroom_slots
from work_and_memory import kv_bytes, matrix_counts, capacity_requests, roofline_lower_bound
from allocation_solver import enumerate_allocations, solve_allocations


def answers(native_report=None):
    rates = json.loads(Path(__file__).with_name("price-snapshot.json").read_text(encoding="utf-8"))["api"]["per_million_tokens"]
    zero = dict(uncached_input=0, cache_creation_5m=0, cache_creation_1h=0, cache_read=0, output=0)
    results = []
    _, value = request_bill({**zero, "uncached_input": 1500, "output": 120}, {**rates, "uncached_input": "3", "output": "12"})
    results.append({"task": 1, "usd": str(value)})
    mixed = {"input_tokens": 80, "cache_read_input_tokens": 600,
             "cache_creation_input_tokens": 300,
             "cache_creation": {"ephemeral_5m_input_tokens": 200, "ephemeral_1h_input_tokens": 100},
             "output_tokens": 60}
    _, value = request_bill(normalize_usage(mixed), rates)
    results.append({"task": 2, "usd": str(value)})
    results.append({"task": 3, **prefix_requests([0, 60, 120], ["P"] * 3, 1200, 50, 100, 300, rates),
                    "no_cache_usd": ".01050"})
    results.append({"task": 4, **retry_accounting(".7", ".5", ".02")})
    results.append({"task": 5, **capacity_requests(24_000_000_000, 9_000_000_000, 2, 3_000_000_000, 750_000_000)})
    memory = kv_bytes(24, 4, 128, 2048, 3, 2)
    results.append({"task": 6, "bytes": memory, "MiB": memory / 2**20})
    results.append({"task": 7, **matrix_counts(3, 4, 5)})
    bound = roofline_lower_bound(.6e12, 30e9, 150e12, 2e12)
    results.append({"task": 8, **bound, "with_unoverlapped_stage_seconds": bound["overlap_lower_bound_seconds"] + .003})
    results.append({"task": 9, "metered_usd": str(reserved_charge(4, 12, "3.50")),
                    "reserved_usd": str(reserved_charge(4, 48, "3.50"))})
    results.append({"task": 10, **hardware_per_million(2, 1, "2", 80, ".4")})
    results.append({"task": 11, "stairs": feasible_crossovers(60000, "900", ".003", ".015", 3)})
    results.append({"task": 12, "slots": failure_headroom_slots(90000, 40000, 1)})
    results.append({"task": 13, "scratch": enumerate_allocations([5, 3], [3, 2], 8, 3)["optimum"],
                    "ordinary": solve_allocations([5, 3], [3, 2], 8, 3),
                    "infeasible": solve_allocations([5, 3], [3, 2], 10, 3)})
    # 90 easy tasks at quality 1 and 10 hard at .5: overall .95 hides class failure.
    easy, hard = Decimal(90), Decimal(10)
    results.append({"task": 14, "overall_quality": str((easy + hard * Decimal(".5")) / 100),
                    "hard_quality": ".5", "required_each_class": ".9", "cheap_route_eligible": False,
                    "cheap_usd": str(Decimal(100) * Decimal(".002")),
                    "hard_upgrade_conditional_quality": ".95", "upgraded_usd": str(easy * Decimal(".002") + hard * Decimal(".02")),
                    "upgraded_overall_quality": str((easy + hard * Decimal(".95")) / 100)})
    group_a, group_b = (Decimal(".01"), 10), (Decimal(".02"), 100)
    results.append({"task": 15, "ratio_of_sums_usd_per_token": str((group_a[0] + group_b[0]) / (group_a[1] + group_b[1])),
                    "mean_ratios_usd_per_token": str((group_a[0] / group_a[1] + group_b[0] / group_b[1]) / 2)})
    if native_report:
        actual = json.loads(native_report.read_text(encoding="utf-8"))
        selected = actual["requests"][1]["steps"][2]
        tensors = selected["cache"]["tensors"]
        exact = sum(row["elements"] * row["element_bytes"] for row in tensors)
        results.append({"task": 16, "request_id": selected["request_id"], "step": 2,
                        "query_positions": selected["query_positions"], "cache_positions": selected["cache_positions"],
                        "independent_cache_bytes": exact,
                        "matches_logical_bytes": exact == selected["cache"]["logical_bytes"]})
    else:
        results.append({"task": 16, "status": "requires retained native report", "program": "native_model_accounting.py"})
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--native-report", type=Path)
    args = parser.parse_args()
    for row in answers(args.native_report):
        print(json.dumps(row))


if __name__ == "__main__":
    main()
