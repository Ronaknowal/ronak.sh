"""Independent finite checks for the complete orchestration examples.

python verify_finite.py --output finite-checks.json
No pretrained calls, training or scientific-result replay.
"""
from pathlib import Path
from fractions import Fraction
from itertools import combinations
import argparse
import json
import math
from selection import Candidate, canonical_answer, select
from probability import opportunity, binary_majority, plurality, pass_at_k
from decision_risk import minimum_risk
from allocation import TABLE, allocate, exhaustive
from budgeting import schedule, hybrid, exchange
from budget_controller import control
from sample_hf import generated_work


def verify():
    checks = []
    def check(condition, label):
        if not condition:
            raise AssertionError(label)
        checks.append(label)
    for value in (".25", "1/4", "2/8", "Answer: 1/4"):
        check(canonical_answer(value) == "1/4", "exact numeric equivalence " + value)
    for value in ("1/0", "roughly .25", "NaN", "1e9000", "1/2 or 3", ""):
        check(canonical_answer(value) is None, "invalid preserved " + value)
    pool = [Candidate("A", "3", .55), Candidate("B", "4", .9), Candidate("C", "3", .55)]
    check(select(pool, "best")["answer"] == "4", "best individual")
    check(select(pool, "weighted")["answer"] == "3", "sum weights")
    check(select(pool, "mean")["answer"] == "4", "mean differs from sum")
    check(select(pool[:2])["answer"] == "3", "first occurrence tie")
    check(select([])["answer"] is None, "empty abstention")
    check(select([Candidate("A", "3", 0)], "weighted")["answer"] is None, "zero mass abstention")
    check(abs(opportunity(.3, 4) - .7599) < 1e-12, "opportunity complement")
    check(abs(binary_majority(.55, 3) - .57475) < 1e-12, "binary binomial")
    for p in (0, .3, 1):
        check(abs(opportunity(p, 1) - p) < 1e-12, "one candidate")
    wins = plurality([.4, .35, .25], 7)
    check(abs(sum(wins) - 1) < 1e-12 and abs(wins[0] - .465212) < 1e-12, "plurality enumeration")
    for n in range(1, 9):
        for correct in range(n + 1):
            for k in range(1, n + 1):
                sets = list(combinations(range(n), k))
                exact = sum(any(i < correct for i in subset) for subset in sets) / len(sets)
                check(abs(exact - pass_at_k(n, correct, k)) < 1e-12, f"subset estimator {n}/{correct}/{k}")
    absolute = minimum_risk([0, 2, 10], [0, 2, 10], [.4, .35, .25], lambda a, y: abs(a - y))
    check(absolute["action"] == 2 and absolute["risks"] == [3.2, 2.8, 6.8], "MBR explicit matrix")
    for budget in range(7):
        for overhead in range(budget + 1):
            dp, brute = allocate(TABLE, budget, overhead), exhaustive(TABLE, budget, overhead)
            check(Fraction(dp["exact_gain"]) == brute[0] and tuple(dp["choices"]) == brute[1], "DP versus complete enumeration")
    check(allocate(TABLE, 3, 1)["choices"] == [0, 2], "exact rational tie")
    check(allocate(TABLE, 0)["expected_correct"] == .6, "zero budget baseline")
    check(allocate(TABLE, 0, 1) is None, "overhead infeasible")
    check(schedule([2, 2, 2], 3)["makespan"] == 2, "parallel critical path")
    check(schedule([2, 2, 2], 1)["makespan"] == 6, "serial critical path")
    check(hybrid(2, 3, 10, 20)["prompt_tokens_processed"] == 180, "revision prefill ledger")
    check(exchange(100, 10, 2) == 12 and exchange(100, 100, 2) == 3, "amortization equality")
    for cap in range(6):
        for context in range(2, 9):
            row = control([["a", "b"], ["c", "d"]], ["Answer:", "5.5"], cap, context)
            check(row["charged_context"] <= context and row["final_complete"], "controller reserve")
    emitted, stop, padding = generated_work([0, 3, 0, 1, 0, 0], 0, 1)
    check(emitted == [3, 0, 1] and stop == "eos" and padding == [0, 0], "T5 start versus emitted PAD versus padding")
    check(generated_work([0, 7, 8], 0, 1) == ([7, 8], "cap", []), "missing EOS cap")
    return {"passed": len(checks), "checks": checks, "scope": "finite constructed contracts only"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = verify()
    with args.output.open("x", encoding="utf8") as handle:
        json.dump(result, handle, indent=2)
    print({"passed": result["passed"]})
