"""Euclidean projection onto nonnegative allocations with a total budget.

Minimize 0.5*sum((w_i-target_i)**2) subject to w_i >= 0 and sum(w) <= budget.
Inputs: a nonempty sequence of finite real coordinates and finite budget >= 0.
Output: weights, the shared threshold, branch and the complete sorted prefix trace.
The sorting route uses O(n log n) comparisons and O(n) storage; it is not the
expected-linear selection algorithm in Duchi et al. (2008), section 5.
Floating arithmetic is intended for well-scaled data. Feasibility and the
supporting-plane gap are reported separately rather than hidden by rounding.
"""

from math import fsum, isfinite


def finite_real(value, name):
    if isinstance(value, bool):
        raise ValueError(f"{name} must be a finite real number")
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError(f"{name} must be a finite real number") from error
    if not isfinite(result):
        raise ValueError(f"{name} must be a finite real number")
    return result


def project_budget(target, budget):
    """Return the unique projection and its explained sorted-prefix trace."""
    values = [finite_real(value, "coordinate") for value in target]
    if not values:
        raise ValueError("target must contain at least one coordinate")
    budget = finite_real(budget, "budget")
    if budget < 0:
        raise ValueError("budget must be nonnegative")
    if budget == 0:
        return {"weights": [0.0] * len(values), "threshold": max(0.0, max(values)),
                "branch": "zero budget", "prefixes": []}
    clipped = [max(value, 0.0) for value in values]
    if fsum(clipped) <= budget:
        return {"weights": clipped, "threshold": 0.0,
                "branch": "budget inactive", "prefixes": []}
    ordered = sorted(values, reverse=True)
    prefix = 0.0
    threshold = None
    rows = []
    for count, value in enumerate(ordered, start=1):
        prefix = fsum((prefix, value))
        trial = (prefix - budget) / count
        positive_last = value > trial
        rows.append((count, value, prefix, trial, positive_last))
        if positive_last:
            threshold = trial
    assert threshold is not None
    weights = [max(value - threshold, 0.0) for value in values]
    return {"weights": weights, "threshold": threshold,
            "branch": "budget active", "prefixes": rows}


def certificate(target, weights, budget):
    """Return objective, supporting lower bound, gap and constraint violation.

    Both coordinate lists must be nonempty, equally long and finite; budget
    must be finite and nonnegative. A lower bound uses 0 and budget*e_i.
    Feasibility is reported even if the supplied candidate is outside the set.
    """
    target = [finite_real(value, "coordinate") for value in target]
    weights = [finite_real(value, "weight") for value in weights]
    budget = finite_real(budget, "budget")
    if not target or len(target) != len(weights):
        raise ValueError("target and weights must have the same positive length")
    if budget < 0:
        raise ValueError("budget must be nonnegative")
    gradient = [weight - value for weight, value in zip(weights, target)]
    objective = 0.5 * fsum(value * value for value in gradient)
    linear_at_candidate = fsum(g * w for g, w in zip(gradient, weights))
    linear_minimum = min(0.0, budget * min(gradient))
    lower_bound = objective + linear_minimum - linear_at_candidate
    feasibility = max(0.0, -min(weights), fsum(weights) - budget)
    return objective, lower_bound, objective - lower_bound, feasibility


def main():
    target = [4.0, 3.0, -2.0]
    for budget in [0.0, 1.0, 4.0, 10.0]:
        result = project_budget(target, budget)
        print("budget:", budget, "branch:", result["branch"])
        print("weights:", result["weights"], "threshold:", result["threshold"])
        print("objective/lower/gap/feasibility:", list(certificate(target, result["weights"], budget)))
        if budget == 4:
            print("count/value/prefix/trial/positive:")
            for row in result["prefixes"]:
                print(row)


if __name__ == "__main__":
    main()
