"""Counting-entropy soft-marginal transport on strictly positive finite weights.
Dependencies: numpy==2.3.5, scipy==1.18.1.
"""
import numpy as np
from scipy.special import logsumexp, xlogy


def objective_terms(plan, a, b, cost, epsilon, tau):
    row, column = plan.sum(axis=1), plan.sum(axis=0)
    return np.array([
        np.sum(plan * cost),
        epsilon * np.sum(xlogy(plan, plan) - plan),
        tau * np.sum(row * (np.log(row) - np.log(a)) - row + a),
        tau * np.sum(column * (np.log(column) - np.log(b)) - column + b),
    ])


def solve(a, b, cost, epsilon, tau, max_steps=10000, tolerance=1e-12):
    a, b, cost = np.asarray(a, float), np.asarray(b, float), np.asarray(cost, float)
    if (a.ndim != 1 or b.ndim != 1 or not a.size or not b.size
            or cost.shape != (a.size, b.size)
            or not all(np.isfinite(v).all() for v in [a, b, cost])
            or np.any(a <= 0) or np.any(b <= 0)
            or not np.isfinite(epsilon + tau) or min(epsilon, tau) <= 0
            or max_steps < 1 or tolerance <= 0):
        raise ValueError("Require positive finite weights, epsilon, tau and valid settings")
    log_kernel = -cost / epsilon
    if not np.isfinite(log_kernel).all():
        raise ValueError("Cost divided by epsilon exceeds the floating-point range")
    exponent = tau / (tau + epsilon)
    log_u, log_v = np.zeros(a.size), np.zeros(b.size)
    residual = np.inf
    for iteration in range(1, max_steps + 1):
        log_u = exponent * (np.log(a) - logsumexp(log_kernel + log_v[None, :], axis=1))
        log_v = exponent * (np.log(b) - logsumexp(log_kernel + log_u[:, None], axis=0))
        log_plan = log_kernel + log_u[:, None] + log_v[None, :]
        log_row = logsumexp(log_plan, axis=1)
        log_column = logsumexp(log_plan, axis=0)
        gradient = (cost + epsilon * log_plan
                    + tau * (log_row - np.log(a))[:, None]
                    + tau * (log_column - np.log(b))[None, :])
        residual = float(np.max(np.abs(gradient)))
        if residual <= tolerance:
            break
    plan = np.exp(log_plan)
    if not np.isfinite(plan).all() or np.any(plan <= 0):
        raise FloatingPointError("Positive plan is not representable at this input scale")
    return plan, {"iterations": iteration, "stationarity": residual,
                  "converged": residual <= tolerance}


def main():
    cases = [([.2, .8], [.7, .3], [[0, 1], [2, 0]], .5, 2),
             ([1], [4], [[2]], 1, 2)]
    for a, b, cost, epsilon, tau in cases:
        a, b, cost = np.array(a), np.array(b), np.array(cost)
        plan, status = solve(a, b, cost, epsilon, tau)
        terms = objective_terms(plan, a, b, cost, epsilon, tau)
        print("plan", np.round(plan, 9).tolist())
        print("row/column", np.round(plan.sum(axis=1), 9).tolist(),
              np.round(plan.sum(axis=0), 9).tolist())
        print("steps/stationarity/converged", status["iterations"],
              f"{status['stationarity']:.3e}", status["converged"])
        print("linear/entropy/rowKL/columnKL", np.round(terms, 9).tolist())
        print("full objective", f"{terms.sum():.9f}")
    print("scalar exact", f"{np.exp((2 * np.log(4) - 2) / 5):.9f}")
    print("scalar without entropy", f"{2 * np.exp(-.5):.9f}")


if __name__ == "__main__":
    main()
