"""Published effective-data/parameter formula with an explicit feasible budget.
Run: python data_constrained.py
NumPy/SciPy; uses scaling_allocation.py in the same directory.
"""
import json
import math
from scipy.optimize import minimize_scalar
from scaling_allocation import golden_minimum

# Authors' datablations README values, not estimates from our seven-point curve.
A, B, E = (math.exp(value) for value in [6.255414, 7.3049974, .6254804])
ALPHA = BETA = .3526596
DATA_REUSE = 15.387756
PARAMETER_REUSE = 5.309743
G = (ALPHA * A / (BETA * B)) ** (1 / (ALPHA + BETA))


def parameters_for_unique_tokens(unique):
    return (unique * G) ** (BETA / ALPHA) * G


def effective_amount(base, total, reuse_scale):
    if base <= 0 or total < base or reuse_scale <= 0:
        raise ValueError("Positive base/reuse scale and total >= base required")
    repetitions = total / base - 1
    return base + base * reuse_scale * (-math.expm1(-repetitions / reuse_scale))


def constrained_loss(parameters, tokens, unique):
    if parameters <= 0 or unique <= 0 or tokens < unique:
        raise ValueError("Positive parameters/unique tokens and tokens >= unique required")
    base_parameters = min(parameters_for_unique_tokens(unique), parameters)
    effective_n = effective_amount(base_parameters, parameters, PARAMETER_REUSE)
    effective_d = effective_amount(unique, tokens, DATA_REUSE)
    return {"loss": E + A / effective_n ** ALPHA + B / effective_d ** BETA,
            "effective_parameters": effective_n, "effective_tokens": effective_d,
            "extra_passes": tokens / unique - 1}


def allocate(compute, unique, minimum_parameters=1e6):
    # D >= U implies N <= C/(6U). Stay inside that domain during every evaluation.
    maximum_parameters = compute / (6 * unique)
    if minimum_parameters >= maximum_parameters:
        raise ValueError("Budget cannot fit the declared minimum model and unique tokens")
    bounds = (math.log(minimum_parameters), math.log(maximum_parameters) - 1e-12)
    objective = lambda log_n: constrained_loss(math.exp(log_n), compute / (6 * math.exp(log_n)), unique)["loss"]
    scratch = golden_minimum(objective, *bounds)
    ordinary = minimize_scalar(objective, bounds=bounds, method="bounded", options={"xatol": 1e-10})
    if not ordinary.success:
        raise RuntimeError(ordinary.message)
    assert math.isclose(objective(scratch), ordinary.fun, rel_tol=1e-8)
    n = math.exp(scratch)
    return {"parameters": n, "tokens": compute / (6 * n), "loss": objective(scratch),
            "scipy_parameters": math.exp(ordinary.x)}


if __name__ == "__main__":
    examples = [constrained_loss(6.34e9, 242e9, 25e9), constrained_loss(8.67e9, 178e9, 25e9)]
    assert math.isclose(examples[0]["loss"], 2.2256440893870146, rel_tol=1e-8)
    assert math.isclose(effective_amount(4, 4, DATA_REUSE), 4)
    print(json.dumps({"published_examples": examples, "fixed_unique_allocation": allocate(6 * 6.34e9 * 242e9, 25e9),
                     "effective_data_at_passes": [{"passes": passes, "unique": 4,
                         "seen": 4 * passes, "effective": effective_amount(4, 4 * passes, DATA_REUSE)}
                         for passes in [1, 2, 4, 10, 100]],
                     "effective_data_limit_for_U4": 4 * (1 + DATA_REUSE)}, indent=2))
