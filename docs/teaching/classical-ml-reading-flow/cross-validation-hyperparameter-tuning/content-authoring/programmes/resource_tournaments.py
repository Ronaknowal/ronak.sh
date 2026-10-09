"""Paid supplied losses, deterministic elimination and original Hyperband rounds."""
from math import ceil, floor, isfinite
from fractions import Fraction as F
from dataclasses import dataclass


def tournament(losses, budgets, factor=3):
    if type(factor) is not int or factor <= 1 or not budgets or any(type(r) is not int or r <= 0 for r in budgets):
        raise ValueError("Need an integer factor > 1 and positive integer resource levels.")
    if any(a >= b for a, b in zip(budgets, budgets[1:])) or not losses:
        raise ValueError("Resource levels must increase and candidates cannot be empty.")
    order = list(losses)
    ordinal = {name: i for i, name in enumerate(order)}
    alive, ledger = order[:], []
    for round_id, resource in enumerate(budgets):
        paid = []
        for candidate in alive:
            if resource not in losses[candidate] or not isfinite(losses[candidate][resource]):
                raise ValueError("Every paid candidate/resource observation must exist and be finite.")
            paid.append((candidate, losses[candidate][resource]))
        ranked = sorted(alive, key=lambda name: (losses[name][resource], ordinal[name]))
        keep = 1 if round_id == len(budgets) - 1 else ceil(len(alive) / factor)
        survivors = ranked[:keep]
        ledger.append({"resource": resource, "paid": paid, "survivors": survivors,
                       "fresh_cost": len(alive) * resource,
                       "continuation_cost_if_real": len(alive) * (resource - (budgets[round_id - 1] if round_id else 0))})
        alive = survivors
    return ledger


def hyperband_brackets(maximum=9, factor=3):
    if type(maximum) is not int or maximum < 1 or type(factor) is not int or factor <= 1:
        raise ValueError("Need positive integer maximum resource and integer factor > 1.")
    smax = 0
    while factor ** (smax + 1) <= maximum:
        smax += 1
    allowance = (smax + 1) * maximum
    brackets = []
    for s in range(smax, -1, -1):
        n = ceil(F(allowance, maximum) * F(factor**s, s + 1))
        start_resource = F(maximum, factor**s)
        rounds = [(floor(F(n, factor**i)), start_resource * factor**i) for i in range(s + 1)]
        fresh = sum(count * resource for count, resource in rounds)
        continued = sum(count * (resource - (rounds[i - 1][1] if i else 0))
                        for i, (count, resource) in enumerate(rounds))
        brackets.append({"s": s, "n": n, "r": start_resource, "rounds": rounds,
                         "fresh": fresh, "continuation_if_real": continued})
    return smax, allowance, brackets


@dataclass
class RunningMean:
    """An actual extendable sufficient state over a fixed ordered numeric stream."""
    total: float = 0.
    count: int = 0

    def extend(self, values, budget):
        if type(budget) is not int or not self.count <= budget <= len(values):
            raise ValueError("Extension budget must preserve the consumed prefix.")
        new = values[self.count:budget]
        if not all(isfinite(value) for value in new):
            raise ValueError("Observed stream values must be finite.")
        self.total += sum(new)
        self.count = budget
        return len(new), self.total / self.count if self.count else None


def main():
    budgets = [10, 30, 90]
    trajectories = {"A": [.30, .25, .24], "B": [.40, .20, .10], "C": [.35, .22, .18],
                    "D": [.45, .30, .25], "E": [.50, .40, .30], "F": [.55, .45, .35],
                    "G": [.60, .50, .40], "H": [.65, .55, .45], "I": [.70, .60, .50]}
    losses = {name: dict(zip(budgets, values)) for name, values in trajectories.items()}
    ledger = tournament(losses, budgets)
    for row in ledger:
        print("paid round", row)
    print("fresh total", sum(row["fresh_cost"] for row in ledger), "continuation if real",
          sum(row["continuation_cost_if_real"] for row in ledger), "all full", len(losses) * budgets[-1])
    pair = tournament({name: losses[name] for name in ["A", "B"]}, budgets, factor=2)
    print("slow starter paid ledger", pair)
    print("separate supplied hindsight", {name: losses[name][90] for name in ["A", "B"]})
    for maximum in [9, 27]:
        smax, allowance, brackets = hyperband_brackets(maximum)
        print("Hyperband", maximum, "smax", smax, "B", allowance)
        for row in brackets:
            print("bracket", row)
        print("bracket totals", sum(row["fresh"] for row in brackets),
              sum(row["continuation_if_real"] for row in brackets))
    state = RunningMean()
    values = [1., 3., 2., 6., 4., 2., 5., 1., 3.]
    for budget in [1, 3, 9]:
        increment, mean = state.extend(values, budget)
        print("actual mean extension", budget, "new observations", increment, "total", state.total,
              "mean", mean, "fresh mean", sum(values[:budget]) / budget)


if __name__ == "__main__":
    main()
