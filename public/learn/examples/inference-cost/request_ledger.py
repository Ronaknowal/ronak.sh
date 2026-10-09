"""Exact, disjoint token accounting for explicitly priced request records."""
import argparse
from decimal import Decimal
import json
from pathlib import Path

CATEGORIES = (
    "uncached_input", "cache_creation_5m", "cache_creation_1h",
    "cache_read", "output",
)
MILLION = Decimal("1000000")


def request_bill(counts, rates):
    """Counts are nonnegative integers; rates are USD per million tokens."""
    contributions = {}
    for category in CATEGORIES:
        count = counts[category]
        rate = Decimal(str(rates[category]))
        if not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise ValueError(f"Invalid token count: {category}")
        if not rate.is_finite() or rate < 0:
            raise ValueError(f"Invalid rate: {category}")
        contributions[category] = Decimal(count) * rate / MILLION
    return contributions, sum(contributions.values(), Decimal(0))


def read_ledger(path, rates):
    """Stream JSONL attempts; memory is one record plus five totals."""
    total = Decimal(0)
    counts = dict.fromkeys(CATEGORIES, 0)
    with Path(path).open(encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, 1):
            if not line.strip():
                continue
            row = json.loads(line)
            parts, amount = request_bill(row["counts"], rates)
            for category in CATEGORIES:
                counts[category] += row["counts"][category]
            total += amount
            yield {"request_id": row["request_id"], "line": line_number,
                   "usd": str(amount),
                   "contributions_usd": {key: str(value) for key, value in parts.items()}}
    yield {"total_usd": str(total), "counts": counts}


def retry_accounting(first_success, retry_conditional_success, attempt_cost):
    """One retry after failure; conditional probability is supplied, not inferred."""
    first, retry, cost = map(Decimal, map(str, (
        first_success, retry_conditional_success, attempt_cost)))
    if not 0 <= first <= 1 or not 0 <= retry <= 1 or cost < 0:
        raise ValueError("Invalid probability or cost")
    expected_cost = cost * (2 - first)
    success = first + (1 - first) * retry
    return {"expected_usd_per_task": str(expected_cost),
            "success_probability": str(success),
            "usd_per_success": str(expected_cost / success) if success else None}


def routed_tasks(tasks, fast_success, flag_correct, flag_wrong, strong_success,
                 fast_cost, strong_cost):
    """The stronger success probability is conditional on the flagged set."""
    n, q, fp, tp, strong, cheap, costly = map(Decimal, map(str, (
        tasks, fast_success, flag_correct, flag_wrong, strong_success,
        fast_cost, strong_cost)))
    if n < 0 or min(cheap, costly) < 0 or any(not 0 <= p <= 1 for p in (q, fp, tp, strong)):
        raise ValueError("Invalid routing input")
    correct = n * q
    wrong = n * (1 - q)
    flagged = correct * fp + wrong * tp
    retained_correct = correct * (1 - fp)
    successes = retained_correct + flagged * strong
    cost = n * cheap + flagged * costly
    return {"flagged_tasks": str(flagged), "retained_correct": str(retained_correct),
            "successes": str(successes), "usd": str(cost),
            "quality": str(successes / n) if n else None,
            "usd_per_success": str(cost / successes) if successes else None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--usage", type=Path, default=Path(__file__).with_name("usage.jsonl"))
    parser.add_argument("--prices", type=Path, default=Path(__file__).with_name("price-snapshot.json"))
    args = parser.parse_args()
    prices = json.loads(args.prices.read_text(encoding="utf-8"))
    rates = prices["api"]["per_million_tokens"]
    for row in read_ledger(args.usage, rates):
        print(json.dumps(row))
    print(json.dumps(retry_accounting("0.8", "0.8", "0.01")))
    print(json.dumps(routed_tasks(100, ".82", ".1", ".8", ".95", ".002", ".02")))


if __name__ == "__main__":
    main()
