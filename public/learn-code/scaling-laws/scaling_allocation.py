"""A complete dense-compute allocation example. NumPy/SciPy; no model training.
Run: python scaling_allocation.py
N and D are literal parameter/token counts; C is approximate training FLOPs.
"""
import json
import math
from scipy.optimize import minimize_scalar

# Constructed coefficients, not a fit to a modern model family.
TOY = {"E": 1.0, "A": 10000.0, "B": 20000.0, "alpha": .5, "beta": .5}


def loss(parameters, tokens, law=TOY):
    if parameters <= 0 or tokens <= 0:
        raise ValueError("Positive parameter and token counts required")
    return law["E"] + law["A"] * parameters ** -law["alpha"] + law["B"] * tokens ** -law["beta"]


def analytic_allocation(compute, law=TOY):
    a, b = law["alpha"], law["beta"]
    if compute <= 0 or min(a, b, law["A"], law["B"]) <= 0:
        raise ValueError("Positive compute, exponents and contributions required")
    log_n = (math.log(a * law["A"] / (b * law["B"])) + b * math.log(compute / 6)) / (a + b)
    n = math.exp(log_n)
    return n, compute / (6 * n)


def golden_minimum(function, lower, upper, tolerance=1e-10):
    """Bounded one-dimensional minimization of a unimodal objective."""
    ratio = (math.sqrt(5) - 1) / 2
    left = upper - ratio * (upper - lower)
    right = lower + ratio * (upper - lower)
    f_left, f_right = function(left), function(right)
    for _ in range(300):
        if upper - lower <= tolerance:
            break
        if f_left < f_right:
            upper, right, f_right = right, left, f_left
            left = upper - ratio * (upper - lower)
            f_left = function(left)
        else:
            lower, left, f_left = left, right, f_right
            right = lower + ratio * (upper - lower)
            f_right = function(right)
    midpoint = (lower + upper) / 2
    # Include bounds when the permitted interval truncates the unconstrained optimum.
    return min([lower, midpoint, upper], key=function)


def budget_hours(compute, devices, peak_flops_per_second, utilization):
    if compute < 0 or devices <= 0 or peak_flops_per_second <= 0 or not 0 < utilization <= 1:
        raise ValueError("Nonnegative compute, positive capacity and utilization in (0,1] required")
    return compute / (devices * peak_flops_per_second * utilization) / 3600


def main():
    compute = 6e18
    n, d = analytic_allocation(compute)
    objective = lambda log_n: loss(math.exp(log_n), compute / (6 * math.exp(log_n)))
    bounds = (math.log(1e6), math.log(1e11))
    scratch_n = math.exp(golden_minimum(objective, *bounds))
    ordinary = minimize_scalar(objective, bounds=bounds, method="bounded", options={"xatol": 1e-10})
    library_n = math.exp(ordinary.x)
    assert ordinary.success and math.isclose(scratch_n, n, rel_tol=1e-6)
    assert math.isclose(library_n, n, rel_tol=1e-6)
    weighted_n = TOY["alpha"] * TOY["A"] * n ** -TOY["alpha"]
    weighted_d = TOY["beta"] * TOY["B"] * d ** -TOY["beta"]
    assert math.isclose(weighted_n, weighted_d)
    doubled = analytic_allocation(2 * compute)
    print(json.dumps({"coefficient_origin": "constructed", "law": TOY, "compute_flops": compute,
        "analytic_parameters": n, "analytic_tokens": d, "tokens_per_parameter": d / n,
        "minimum_loss": loss(n, d), "weighted_contributions": [weighted_n, weighted_d],
        "scratch_parameters": scratch_n, "scipy_parameters": library_n,
        "double_compute_size_factors": [doubled[0] / n, doubled[1] / d],
        "planning_assumptions": {"devices": 8, "peak_flops_per_second_each": 1e14, "utilization": .4},
        "planning_hours": budget_hours(compute, 8, 1e14, .4)}, indent=2))


if __name__ == "__main__":
    main()
