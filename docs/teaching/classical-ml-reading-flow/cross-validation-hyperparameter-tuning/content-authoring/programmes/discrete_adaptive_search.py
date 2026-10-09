"""Finite categorical SMBO reference with every policy stated explicitly."""
from fractions import Fraction as F
from collections import Counter
from math import floor, isfinite
import json

SUPPORT = ("A", "B", "C")
STARTUP = ("A", "B", "C", "C")
EVALUATOR = {"A": F(1, 10), "B": F(1, 5), "C": F(2, 5)}


def validate_history(history):
    ids = []
    for row in history:
        if set(row) != {"id", "setting", "loss"}:
            raise ValueError("Each trial needs id, setting and loss.")
        if type(row["id"]) is not int or row["id"] < 0 or row["setting"] not in SUPPORT:
            raise ValueError("Need a nonnegative integer trial ID and a supported setting.")
        if not isfinite(row["loss"]) or row["loss"] < 0:
            raise ValueError("Loss must be finite and nonnegative.")
        ids.append(row["id"])
    if len(set(ids)) != len(ids):
        raise ValueError("Trial IDs must be unique and immutable.")


def proposal(history, gamma=F(1, 2), alpha=F(1)):
    validate_history(history)
    gamma, alpha = F(str(gamma)), F(str(alpha))
    if not F(1, 10) <= gamma <= F(9, 10) or not F(1, 4) <= alpha <= 2:
        raise ValueError("Need gamma in [.1,.9] and positive alpha in [.25,2].")
    n = len(history)
    uniform = [F(1, 3)] * 3
    if n < 4 or len({row["loss"] for row in history}) == 1:
        startup = n < 4
        return {"state": "startup" if startup else "uninformative uniform prior",
                "better_ids": [], "other_ids": [], "gamma": gamma, "pi": None, "alpha": alpha,
                "l": uniform, "g": uniform, "p": uniform, "acquisition": [F(1)] * 3,
                "proposal": STARTUP[n] if startup else SUPPORT[0]}
    ordered = sorted(history, key=lambda row: (row["loss"], row["id"]))
    m = max(1, min(n - 1, floor(gamma * n)))
    better, other = ordered[:m], ordered[m:]
    left, right = Counter(row["setting"] for row in better), Counter(row["setting"] for row in other)
    l = [(left[setting] + alpha) / (m + 3 * alpha) for setting in SUPPORT]
    g = [(right[setting] + alpha) / (n - m + 3 * alpha) for setting in SUPPORT]
    pi = F(m, n)
    p = [pi * a + (1 - pi) * b for a, b in zip(l, g)]
    acquisition = [a / b for a, b in zip(l, p)]
    chosen = max(range(3), key=lambda i: acquisition[i])
    return {"state": "fitted categorical history", "better_ids": [row["id"] for row in better],
            "other_ids": [row["id"] for row in other], "gamma": gamma, "pi": pi, "alpha": alpha,
            "better_counts": [left[setting] for setting in SUPPORT],
            "other_counts": [right[setting] for setting in SUPPORT],
            "l": l, "g": g, "p": p, "acquisition": acquisition, "proposal": SUPPORT[chosen]}


def accept(history, gamma=F(1, 2), alpha=F(1)):
    current = proposal(history, gamma, alpha)
    trial = {"id": max((row["id"] for row in history), default=-1) + 1,
             "setting": current["proposal"], "loss": EVALUATOR[current["proposal"]]}
    return [dict(row) for row in history] + [trial]


def expected_improvement(incumbent, losses, masses):
    if not isfinite(incumbent) or len(losses) != len(masses) or not losses:
        raise ValueError("Need a finite incumbent and aligned nonempty mass table.")
    if any(not isfinite(value) for value in losses + masses) or any(mass < 0 for mass in masses) or sum(masses) != 1:
        raise ValueError("Need finite losses and nonnegative masses summing to one.")
    return sum(mass * max(incumbent - loss, 0) for loss, mass in zip(losses, masses))


def default_history():
    return [{"id": i, "setting": setting, "loss": EVALUATOR[setting]} for i, setting in enumerate(STARTUP)]


def show(name, result):
    print(name, json.dumps(result, default=str))


def main():
    history = default_history()
    show("default", proposal(history))
    updated = accept(history)
    show("accepted history", updated)
    show("updated", proposal(updated))
    changed = [dict(row) for row in history]
    changed[0]["loss"] = F(1, 2)
    show("changed A", proposal(changed))
    show("changed appended", accept(changed)[-1])
    null = [dict(row) for row in history]
    null[1]["loss"] = F(1, 4)
    show("null B", proposal(null))
    show("gamma quarter", proposal(history, F(1, 4)))
    startup = []
    for _ in range(4):
        show("startup", proposal(startup))
        startup = accept(startup)
    show("all equal", proposal([{**row, "loss": F(1, 5)} for row in history]))
    for name, losses, masses in [("A", [F(18, 100)], [F(1)]),
                                 ("B", [F(5, 100), F(45, 100)], [F(1, 2)] * 2),
                                 ("B worse tail", [F(5, 100), F(9, 10)], [F(1, 2)] * 2)]:
        print("EI", name, str(expected_improvement(F(1, 5), losses, masses)),
              "mean", str(sum(a * b for a, b in zip(losses, masses))))
    # Separate static D37 supplied distributions; these are not fitted above.
    l, g = [F(2, 5), F(1, 5), F(2, 5)], [F(1, 10), F(2, 5), F(1, 2)]
    p = [F(1, 4) * a + F(3, 4) * b for a, b in zip(l, g)]
    show("static supplied fixture", {"l": l, "g": g, "p": p, "acquisition": [a / b for a, b in zip(l, p)]})


if __name__ == "__main__":
    main()
