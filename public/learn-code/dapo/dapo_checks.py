"""Finite DAPO calculations and complementary tensor/ordinary-library checks.

python dapo_checks.py --output finite.json
No language model, sampling campaign or optimization is run by this program.
"""

import argparse
import itertools
import math
from pathlib import Path
import torch
from trl.rewards import get_soft_overlong_punishment
from dapo_math import (
    advantages,
    length_penalty,
    objective,
    scalar_loss_and_slope,
    mixed_probability,
    integer_answer,
    select_loss_mask,
)
from dapo_collect import collect
from train_dapo import save


def fixture_batches():
    patterns = [
        [[True] * 4, [False] * 4],
        [[True, False, True, False], [True] * 4],
        [[False, True, False, True], [True, False, False, False]],
    ]
    result = []
    for batch, groups in enumerate(patterns):
        rows = []
        for group, correct in enumerate(groups):
            uid = f"p{batch*2+group}"
            for index, value in enumerate(correct):
                rows.append(
                    {
                        "id": batch * 2 + group,
                        "uid": f"{uid}:{index}",
                        "group_uid": uid,
                        "prompt_ids": [10, batch * 2 + group, 11],
                        "completion_ids": [20 + index, 0],
                        "old_logps": [-1.0 - index, -0.1],
                        "correct": value,
                    }
                )
        result.append(rows)
    return result


def run():
    checks = 0

    def check(value):
        nonlocal checks
        assert value
        checks += 1

    gradients = []
    for a in [-1.3, 0.7]:
        for r in [0.4, 0.85, 1.05, 1.24, 1.5, 12.0]:
            for dual in [None, 10.0]:
                lp = torch.tensor([[math.log(r)]], dtype=torch.float64, requires_grad=True)
                loss, detail = objective(
                    lp,
                    torch.zeros_like(lp),
                    torch.ones_like(lp, dtype=torch.bool),
                    torch.tensor([a], dtype=torch.float64),
                    dual_clip=dual,
                )
                loss.backward()
                expected, slope = scalar_loss_and_slope(r, a, dual_clip=dual)
                check(abs(float(loss.detach()) - expected) < 1e-12)
                check(abs(float(lp.grad) - slope) < 1e-12)
                h = 1e-6
                plus = scalar_loss_and_slope(r * math.exp(h), a, dual_clip=dual)[0]
                minus = scalar_loss_and_slope(r * math.exp(-h), a, dual_clip=dual)[0]
                check(abs((plus - minus) / (2 * h) - slope) < 1e-7)
                gradients.append(
                    {
                        "advantage": a,
                        "ratio": r,
                        "dual_clip": dual,
                        "loss": expected,
                        "logp_derivative": slope,
                    }
                )
    groups = []
    for values in [[-1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1], [-1, -1, -1, -1]]:
        a, stats = advantages(torch.tensor(values, dtype=torch.float64))
        check(abs(float(a.sum())) < 1e-12)
        groups.append({"rewards": values, "advantages": a, "statistics": stats})
    fixture = fixture_batches()
    filled = collect(lambda i: fixture[i])
    check(filled["status"] == "filled")
    check([r["group_uid"] for r in filled["selected"]] == ["p2"] * 4 + ["p4"] * 4)
    reordered = collect(lambda i: list(reversed(fixture[i])))
    check(reordered["status"] == "filled")
    for row in filled["selected"]:
        original = next(r for batch in fixture for r in batch if r["uid"] == row["uid"])
        check(row == original)
    exhausted = collect(
        lambda i: (
            fixture[0]
            if i == 0
            else [
                dict(r, uid="next:" + r["uid"], group_uid="next:" + r["group_uid"])
                for r in fixture[0]
            ]
        ),
        max_batches=2,
    )
    check(exhausted["status"] == "exhausted" and not exhausted["selected"])
    # Reordering within a candidate batch can alter the first eligible quota
    # choice; identity invariance means every selected row stays correctly joined.
    for row in reordered["selected"]:
        check(row == next(r for batch in fixture for r in batch if r["uid"] == row["uid"]))
    length_rows = []
    native = get_soft_overlong_punishment(max_completion_len=20, soft_punish_cache=4)
    for n in [0, 15, 16, 17, 18, 19, 20, 21]:
        direct = length_penalty(n, 20, 4)
        actual = native([list(range(n))])[0]
        check(direct == actual)
        length_rows.append({"length": n, "scratch": direct, "native": actual})
    terms = torch.tensor(
        [[1.0, 1.0, 0.0, 0.0, 0.0, 0.0], [3.0, 3.0, 3.0, 3.0, 3.0, 3.0]], dtype=torch.float64
    )
    mask = torch.tensor([[1, 1, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1]], dtype=torch.bool)
    pooled = float(terms[mask].mean())
    response = float((terms.sum(-1) / mask.sum(-1)).mean())
    check(pooled == 2.5 and response == 2.0)
    shared = sum(float(terms[i][mask[i]].sum()) / int(mask.sum()) for i in range(2))
    wrong = sum(float(terms[i][mask[i]].mean()) for i in range(2)) / 2
    check(shared == pooled and wrong != pooled)
    termination = select_loss_mask(mask, [True, False], True)
    check(termination.sum().item() == 2)
    zero = torch.zeros((2, 6), dtype=torch.float64, requires_grad=True)
    try:
        objective(zero, zero.detach(), torch.zeros_like(mask), torch.tensor([1.0, -1.0]))
    except ValueError:
        checks += 1
    else:
        raise AssertionError("All-masked objective silently accepted")
    probability_rows = []
    for p in [0.0, 0.1, 0.5, 0.9, 1.0]:
        for g in [2, 4, 8]:
            enumerated = sum(
                p ** sum(bits) * (1 - p) ** (g - sum(bits))
                for bits in itertools.product([0, 1], repeat=g)
                if 0 < sum(bits) < g
            )
            expected = mixed_probability(p, g)
            check(abs(enumerated - expected) < 1e-12)
            probability_rows.append(
                {
                    "p": p,
                    "G": g,
                    "mixed_probability": expected,
                    "ideal_candidates_for_two": 2 / expected if expected else None,
                }
            )
    parser = []
    for text, wanted in [
        (r"\boxed{12}", 12),
        (r"\boxed{  +12 }", 12),
        (r"\boxed{12} then \boxed{13}", 13),
        (r"\boxed{12} then \boxed{", None),
        (r"\boxed{6+6}", None),
        (r"\boxed{\frac{24}{2}}", None),
        ("12", None),
        (r"wrong reasoning; \boxed{12}", 12),
        (r"\boxed{\boxed{12}}", 12),
    ]:
        value = integer_answer(text)
        check(value == wanted)
        parser.append({"text": text, "parsed": value})
    circle = {
        "center": [11, 8],
        "radius_squared": 11**2 + 8**2 - 113,
        "derived_min_x": 11 - math.sqrt(72),
        "source_claim": 11 - 2 * math.sqrt(6),
        "derived_coefficients": [11, 6, 2],
        "source_coefficients": [11, 2, 6],
    }
    check(
        circle["radius_squared"] == 72
        and sum(circle["derived_coefficients"]) == sum(circle["source_coefficients"]) == 19
    )
    return {
        "checks": checks,
        "gradient_cases": gradients,
        "groups": groups,
        "collector": filled,
        "exhausted": exhausted,
        "lengths": length_rows,
        "reduction": {
            "terms": terms,
            "mask": mask,
            "pooled": pooled,
            "response": response,
            "shared_denominator": shared,
            "microbatch_mean": wrong,
        },
        "probabilities": probability_rows,
        "parser": parser,
        "source_audit_circle": circle,
        "boundary": "Finite constructed mechanisms and ordinary length-reward helper; no learned-model outcomes.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError(args.output)
    result = run()
    save(args.output, result)
    print({"passed": True, "checks": result["checks"]})
