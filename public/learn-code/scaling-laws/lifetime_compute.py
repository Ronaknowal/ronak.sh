"""Compare training and lifetime compute at the SAME target fitted loss.
Run: python lifetime_compute.py
Requires SciPy; keep scaling_allocation.py beside this file.
"""
import json
import math
from scipy.optimize import minimize_scalar
from scaling_allocation import TOY, loss, golden_minimum, analytic_allocation


def tokens_for_loss(parameters, target, law=TOY):
    gap = target - law["E"] - law["A"] * parameters ** -law["alpha"]
    if gap <= 0:
        raise ValueError("No finite token budget reaches the target at this model size")
    return (law["B"] / gap) ** (1 / law["beta"])


def choose_model(target, inference_tokens, maximum_parameters=1e12, law=TOY):
    if target <= law["E"] or inference_tokens < 0:
        raise ValueError("Target must exceed floor and inference demand must be nonnegative")
    minimum = (law["A"] / (target - law["E"])) ** (1 / law["alpha"])
    if maximum_parameters <= minimum:
        raise ValueError("No feasible model inside the declared parameter bound")
    bounds = (math.log(minimum) + 1e-8, math.log(maximum_parameters))
    def cost(log_n):
        n = math.exp(log_n)
        d = tokens_for_loss(n, target, law)
        return 6 * n * d + 2 * n * inference_tokens
    chosen = golden_minimum(cost, *bounds)
    library = minimize_scalar(cost, method="bounded", bounds=bounds, options={"xatol": 1e-10})
    if not library.success:
        raise RuntimeError(library.message)
    assert math.isclose(cost(chosen), library.fun, rel_tol=1e-8)
    n = math.exp(chosen)
    d = tokens_for_loss(n, target, law)
    return {"target_loss": target, "inference_tokens": inference_tokens, "parameters": n, "training_tokens": d,
            "training_flops": 6 * n * d, "inference_flops": 2 * n * inference_tokens,
            "lifetime_flops": cost(chosen), "achieved_fitted_loss": loss(n, d, law),
            "scipy_parameters": math.exp(library.x)}


if __name__ == "__main__":
    results = [choose_model(2, demand) for demand in [0, 1e10, 1e12]]
    training = results[0]
    n, _ = analytic_allocation(training["training_flops"])
    assert math.isclose(n, training["parameters"], rel_tol=1e-6)
    assert all(math.isclose(result["achieved_fitted_loss"], 2) for result in results)
    print(json.dumps({"coefficient_origin": "constructed", "demand_fixed_externally": True, "results": results}, indent=2))
