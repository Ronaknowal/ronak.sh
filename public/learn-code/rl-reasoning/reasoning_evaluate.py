"""Prompt-wise success and selection metrics, without factorial overflow.
Run: python reasoning_evaluate.py
"""
import json
import math
import random
from collections import Counter


def pass_at_k(n, correct, k):
    if not all(isinstance(x, int) for x in (n, correct, k)) or not 0 <= correct <= n or not 1 <= k <= n:
        raise ValueError("Need integer 0 <= correct <= n and 1 <= k <= n")
    if correct == 0:
        return 0.
    if n - correct < k:
        return 1.
    # Product of the conditional probabilities of drawing a failure each time.
    log_failure = math.fsum(math.log1p(-correct / (n - i)) for i in range(k))
    return -math.expm1(log_failure)


def majority(answers):
    """Invalid answers (None) cast no vote; ties use first occurrence."""
    counts = Counter(answer for answer in answers if answer is not None)
    return max(counts, key=counts.get) if counts else None


def summarize(rows, k):
    """Each row contains a question's truth and complete recorded attempts."""
    outcomes = []
    for row in rows:
        attempts = row["attempts"]
        correctness = [bool(item["correct"]) for item in attempts]
        outcomes.append({"id": row["id"], "n": len(attempts), "correct": sum(correctness),
                         "pass1": sum(correctness) / len(attempts),
                         "passk": pass_at_k(len(attempts), sum(correctness), k),
                         "observed_oracle": any(correctness),
                         "majority": majority([item["answer"] if item.get("terminated", True) else None
                                               for item in attempts]) == row["truth"],
                         "tokens": sum(item["tokens"] for item in attempts)})
    return {"questions": outcomes,
            "mean": {name: math.fsum(row[name] for row in outcomes) / len(outcomes)
                     for name in ("pass1", "passk", "observed_oracle", "majority", "tokens")}}


def paired_bootstrap(left, right, repetitions=2000, seed=31):
    """Resample matched prompt differences, not individual correlated tokens."""
    if len(left) != len(right) or not left:
        raise ValueError("Need nonempty equally sized prompt score lists")
    differences = [b - a for a, b in zip(left, right)]
    rng = random.Random(seed)
    means = sorted(math.fsum(rng.choices(differences, k=len(differences))) / len(differences)
                   for _ in range(repetitions))
    return {"difference": math.fsum(differences) / len(differences),
            "percentile95": [means[int(.025 * repetitions)], means[int(.975 * repetitions)]]}


def budget_prefix(attempts, budget):
    """Replay sequential generation with a hard emitted-token budget.

    A partial last attempt consumes the remaining budget but casts no vote.
    Its final length is used only to replay where an online generator stops;
    the policy never skips an expensive attempt using future information.
    """
    if not isinstance(budget, int) or budget < 0:
        raise ValueError('Need a nonnegative integer emitted-token budget')
    used, kept = 0, []
    for attempt in attempts:
        if used + attempt["tokens"] > budget:
            return {"attempts": kept, "tokens": budget,
                    "partial_tokens": budget - used, "unfinished_attempt": True}
        kept.append(attempt)
        used += attempt["tokens"]
        if used == budget:
            break
    return {"attempts": kept, "tokens": used, "partial_tokens": 0, "unfinished_attempt": False}


def main():
    print(json.dumps({"n8_c2": {str(k): pass_at_k(8, 2, k) for k in (1, 2, 4, 8)},
                      "constructed_curves": [{"k": k,
                       "base": sum(-math.expm1(k * math.log1p(-p)) for p in (.2, .2)) / 2,
                       "changed": sum(1. if p == 1 else -math.expm1(k * math.log1p(-p))
                                      for p in (.8, .01)) / 2} for k in (1, 2, 4, 8, 16, 32, 64)]}, indent=2))


if __name__ == "__main__":
    main()
