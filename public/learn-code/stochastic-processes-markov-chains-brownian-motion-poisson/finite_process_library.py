"""Ordinary array/solver route for the lesson's finite process contracts.

Run: python finite_process_library.py
Requires NumPy and SciPy. Matrices below use rows as departure states.
Probability mass is a row vector; state-value functions are column vectors.
Use a general solve for I-Q, not a symmetric eigensolver or an explicit inverse.
Dense powers/solves/exponentials here are for small inspectable finite models.
"""
import math
import numpy as np
from scipy.linalg import expm, solve
from scipy.stats import poisson


def transition_matrix(values):
    if np.iscomplexobj(values):
        raise ValueError("Transition probabilities must be real.")
    matrix = np.asarray(values, dtype=float)
    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1] or not 1 <= len(matrix) <= 32:
        raise ValueError("A square finite transition matrix of order 1 through 32 is required.")
    if not np.isfinite(matrix).all() or np.any(matrix < 0):
        raise ValueError("Finite nonnegative probabilities are required.")
    if not np.allclose(matrix.sum(axis=1), 1, rtol=0, atol=1e-12):
        raise ValueError("Each departure row must sum to 1 within 1e-12.")
    return matrix


def first_hit_steps(values, targets):
    transition = transition_matrix(values)
    if not targets or any(isinstance(i, bool) or not isinstance(i, int)
                          or not 0 <= i < len(transition) for i in targets):
        raise ValueError("At least one valid integer target-state index is required.")
    target = set(targets)
    # Reverse reachability checks the finite target-absorption contract.
    # Every unknown must have a positive-probability path to some target.
    reaches = set(target)
    while True:
        enlarged = reaches | {i for i in range(len(transition))
                              if any(transition[i, j] > 0 for j in reaches)}
        if enlarged == reaches:
            break
        reaches = enlarged
    if len(reaches) != len(transition):
        raise ValueError("A closed class can avoid the target; no finite all-state duration solve.")
    unknown = [i for i in range(len(transition)) if i not in target]
    result = np.zeros(len(transition))
    if not unknown:
        return result, 0.0
    block = transition[np.ix_(unknown, unknown)]
    system = np.eye(len(unknown)) - block
    times = solve(system, np.ones(len(unknown)), assume_a="gen")
    residual = float(np.linalg.norm(system @ times - 1, ord=np.inf))
    if not np.isfinite(times).all() or np.any(times < -1e-10):
        raise ArithmeticError("Finite nonnegative first-hit durations were not recovered.")
    result[unknown] = times
    return result, residual


def uniformization(generator, time, last_term=40):
    if np.iscomplexobj(generator):
        raise ValueError("Generator rates must be real.")
    generator = np.asarray(generator, dtype=float)
    if generator.ndim != 2 or generator.shape[0] != generator.shape[1] or not 1 <= len(generator) <= 32:
        raise ValueError("A finite square generator of order 1 through 32 is required.")
    if not np.isfinite(generator).all():
        raise ValueError("A finite generator is required.")
    off = generator - np.diag(np.diag(generator))
    if np.any(off < 0) or np.any(np.diag(generator) > 0) or not np.allclose(generator.sum(axis=1), 0, rtol=0, atol=1e-12):
        raise ValueError("Nonnegative off-diagonal rates and zero generator row sums are required.")
    if not isinstance(time, (int, float)) or isinstance(time, bool) or not math.isfinite(time) or time < 0:
        raise ValueError("Finite nonnegative elapsed time is required.")
    if isinstance(last_term, bool) or not isinstance(last_term, int) or not 0 <= last_term <= 10000:
        raise ValueError("A finite integer series budget 0 through 10000 is required.")
    rate = float(-np.diag(generator).min())
    if rate == 0:
        return np.eye(len(generator)), 0.0
    mean = rate * time
    if not math.isfinite(mean) or mean > 100:
        raise ValueError("This direct Poisson recurrence is bounded to rate-times-time at most 100.")
    embedded = np.eye(len(generator)) + generator / rate
    power = np.eye(len(generator))
    weight = math.exp(-mean)
    total = weight * power
    for k in range(1, last_term + 1):
        power = power @ embedded
        weight *= mean / k
        total += weight * power
    # Missing probability is reported, never silently redistributed.
    return total, float(poisson.sf(last_term, mean))


if __name__ == "__main__":
    p = transition_matrix([[.8, .2], [.3, .7]])
    start = np.array([1., 0.])
    print("two-step weather law:", np.round(start @ np.linalg.matrix_power(p, 2), 12).tolist())
    fixed = solve(np.vstack([(p.T - np.eye(2))[0], np.ones(2)]), [0., 1.])
    print("weather invariant law:", np.round(fixed, 12).tolist())
    print("weather stationarity residual:", float(np.linalg.norm(fixed @ p - fixed)))
    reserve = np.zeros((6, 6))
    reserve[0, 0] = reserve[5, 5] = 1
    for i in range(1, 5):
        reserve[i, i-1] = reserve[i, i+1] = .5
    duration, residual = first_hit_steps(reserve, [0, 5])
    print("reserve first-hit steps:", np.round(duration, 12).tolist())
    print("first-hit equation residual:", residual)
    g = np.array([[-.5, .5], [2., -2.]])
    exact = expm(g)
    partial, omitted = uniformization(g, 1.)
    print("one-hour exact On-start law:", np.round(exact[0], 12).tolist())
    print("uniformization max discrepancy:", float(np.max(np.abs(partial - exact))))
    # The analytic tail bound omits floating-point roundoff; discrepancy can exceed it.
    print("unrenormalized omitted Poisson mass:", omitted)
    print("one-hour first-order Off row:", (np.eye(2) + g)[1].tolist())
