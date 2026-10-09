import math

import numpy as np
from scipy.optimize import minimize
from scipy.special import logsumexp, xlogy

from rd_scalar_helpers import solve as scalar_solve


def update(p, costs, weight, log_r):
    """One channel update; return its induced marginal and objective bounds."""
    scaled = weight * math.log(2) * costs
    log_z = logsumexp(log_r[None, :] - scaled, axis=1)
    log_q = log_r[None, :] - scaled - log_z[:, None]
    q = np.exp(log_q)
    log_marginal = logsumexp(np.log(p)[:, None] + log_q, axis=0)
    joint = p[:, None] * q
    present = joint > 0
    log_ratio = log_q - log_marginal[None, :]
    information = float(np.sum(joint[present] * log_ratio[present]) / math.log(2))
    distortion = float(np.sum(joint * costs))
    f = -float(p @ log_z)
    log_g = logsumexp(np.log(p)[:, None] - scaled - log_z[:, None], axis=0)
    lower = (f - float(np.max(log_g))) / math.log(2)
    upper = information + weight * distortion
    return q, log_marginal, np.array([distortion, information, lower, upper,
                                     max(0.0, upper - lower)])


def objective(flat_q, p, costs, weight):
    q = flat_q.reshape(costs.shape)
    r = p @ q
    # H(output) minus source-weighted H(output | source); xlogy(0,0)=0.
    information = float(np.sum(p[:, None] * xlogy(q, q)) - np.sum(xlogy(r, r)))
    return information / math.log(2) + weight * float(np.sum(p[:, None] * q * costs))


def main():
    values = np.array([0.0, 1.0, 3.0])
    p = np.array([0.7, 0.2, 0.1])
    costs = (values[:, None] - values[None, :]) ** 2
    initial = np.full(3, 1 / 3)
    weight = 1.0
    log_r = np.log(initial)
    q, marginal, first = update(p, costs, weight, log_r)
    scalar_first = scalar_solve(p.tolist(), costs.tolist(), weight, initial.tolist(),
                                maximum_steps=0)
    np.testing.assert_allclose(first, scalar_first, rtol=1e-12, atol=1e-12)
    print("shape p / costs / q", p.shape, costs.shape, q.shape)
    print("first channel", np.round(q, 9).tolist())
    print("first induced marginal", np.round(np.exp(marginal), 9).tolist())
    history = []
    for step in range(5001):
        q, next_log_r, result = update(p, costs, weight, log_r)
        history.append(float(result[3]))
        if result[4] <= 1e-10 or step == 5000:
            break
        log_r = next_log_r
    scalar = scalar_solve(p.tolist(), costs.tolist(), weight, initial.tolist(),
                          maximum_steps=5000, tolerance=1e-10)
    np.testing.assert_allclose(result, scalar, rtol=1e-8, atol=1e-10)
    np.testing.assert_allclose(q.sum(axis=1), 1, atol=1e-12)
    np.testing.assert_allclose(np.exp(next_log_r), p @ q, atol=1e-12)
    assert np.max(np.diff(history)) <= 1e-12
    print("completed marginal updates", step)
    print("D / I / lower / upper / gap", np.round(result, 12).tolist())

    # An independent general constrained solver on the same convex channel problem.
    constraint = {"type": "eq", "fun": lambda flat: flat.reshape(3, 3).sum(axis=1) - 1}
    solution = minimize(objective, np.full(9, 1 / 3), args=(p, costs, weight),
                        method="SLSQP", bounds=[(0.0, 1.0)] * 9,
                        constraints=[constraint], options={"ftol": 1e-12, "maxiter": 1000})
    residual = float(np.max(np.abs(constraint["fun"](solution.x))))
    assert solution.success and residual < 1e-9
    assert result[2] - 1e-8 <= solution.fun <= result[3] + 1e-8
    print("SLSQP success / iterations / row residual", bool(solution.success),
          int(solution.nit), round(residual, 12))
    print("SLSQP objective / BA objective", round(float(solution.fun), 12),
          round(float(result[3]), 12))
    print("SLSQP status", solution.message)


if __name__ == "__main__":
    main()
