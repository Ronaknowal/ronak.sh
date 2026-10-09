"""Select numeric answers without receiving evaluation labels.

python selection.py
The parser intentionally accepts only one exact decimal/integer/fraction.
This is not a mathematical-expression evaluator or a proof checker.
"""
from collections import defaultdict
from dataclasses import dataclass, asdict
from fractions import Fraction
import json
import math
import re

NUMBER = r"[+-]?(?:\d{1,32}(?:\.\d{0,32})?|\.\d{1,32})"
PATTERN = re.compile(rf"({NUMBER})(?:\s*/\s*({NUMBER}))?\Z")


def canonical_answer(text):
    """Return a rational key, or None. Never guess a number inside prose."""
    if not isinstance(text, str) or len(text) > 4096:
        return None
    candidate = text.rsplit("Answer:", 1)[-1].strip()
    match = PATTERN.fullmatch(candidate)
    if match is None:
        return None
    try:
        value = Fraction(match[1])
        if match[2] is not None:
            value /= Fraction(match[2])
        return str(value)
    except (ValueError, ZeroDivisionError):
        return None


@dataclass(frozen=True)
class Candidate:
    identity: str
    text: str
    score: float = 1.0

    def __post_init__(self):
        if not math.isfinite(self.score) or self.score < 0:
            raise ValueError("Voting weights must be finite and nonnegative")


def select(candidates, method="vote"):
    """Stable input-order ties; invalid candidates cost work but do not vote.

    'best' chooses the largest individual score, 'vote' sums unit weights,
    'weighted' sums scores and 'mean' averages scores within an answer group.
    None is an explicit abstention, never an automatic correct answer.
    """
    if method not in {"best", "vote", "weighted", "mean"}:
        raise ValueError("Unknown selection method")
    if len({c.identity for c in candidates}) != len(candidates):
        raise ValueError("Candidate identities must be unique")
    valid = [(i, c, canonical_answer(c.text)) for i, c in enumerate(candidates)]
    valid = [row for row in valid if row[2] is not None]
    if not valid:
        return {"answer": None, "candidate": None, "groups": [], "valid": 0}
    groups = defaultdict(list)
    for index, candidate, answer in valid:
        groups[answer].append((index, candidate))
    table = []
    for answer, rows in groups.items():
        weight = len(rows) if method == "vote" else sum(c.score for _, c in rows)
        if method == "mean":
            weight /= len(rows)
        table.append({"answer": answer, "weight": weight, "count": len(rows),
                      "first": rows[0][0], "ids": [c.identity for _, c in rows]})
    if method == "best":
        _, candidate, answer = max(valid, key=lambda row: (row[1].score, -row[0]))
        chosen_id = candidate.identity
    else:
        winner = min(table, key=lambda row: (-row["weight"], row["first"]))
        answer = winner["answer"] if winner["weight"] > 0 else None
        chosen_id = winner["ids"][0] if answer is not None else None
    return {"answer": answer, "candidate": chosen_id, "groups": table,
            "valid": len(valid)}


def example():
    pool = [Candidate("A", "5.5", .7), Candidate("B", "11/2", .65),
            Candidate("C", "7.5", .9), Candidate("D", "2/11", .3),
            Candidate("E", "roughly five", .95)]
    return {"scope": "Constructed candidates and scores, not model outputs",
            "candidates": [asdict(c) for c in pool],
            "selections": {method: select(pool, method)
                           for method in ("best", "vote", "weighted", "mean")}}


if __name__ == "__main__":
    print(json.dumps(example(), indent=2))
