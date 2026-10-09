"""Maintained Brownian-grid and conditional-bridge calculations.

Run: python brownian_bridge_library.py
Requires NumPy and SciPy. One fixed finite Gaussian stream supplies every
coarse grid; refining means grouping that same fine stream, not comparing
unrelated paths. These polygonal observations are not a continuous path proof.
Conditional bridge formulas require strictly positive constant scale and known
endpoints; constant drift cancels from this conditional law. At fractions 0/1,
the known endpoint is a point mass. Zero scale is admitted only by shared_grid
as an unconditional deterministic zero-increment construction. It is not
conditioning a deterministic drift process on arbitrary unequal endpoints.
"""
import math
import numpy as np
from scipy.stats import norm


def conditional_bridge(left, right, duration, fraction, sigma):
    values = [left, right, duration, fraction, sigma]
    if any(isinstance(v, bool) or not isinstance(v, (int, float))
           or not math.isfinite(v) for v in values):
        raise ValueError("Finite real bridge inputs are required.")
    if not .01 <= duration <= 100 or not (fraction in (0, 1) or .001 <= fraction <= .999) or not .001 <= sigma <= 10:
        raise ValueError("Use duration 0.01..100, fraction 0/1 or 0.001..0.999, positive scale 0.001..10.")
    if abs(left) > 100 or abs(right) > 100:
        raise ValueError("This displayed route uses endpoint values within [-100,100].")
    mean = (1-fraction)*left + fraction*right
    variance = sigma*sigma*duration*fraction*(1-fraction)
    # A known endpoint is a point mass; do not evaluate a zero-variance density.
    interval = [mean, mean] if variance == 0 else norm.ppf(
        [.025, .975], loc=mean, scale=math.sqrt(variance)).tolist()
    return mean, variance, interval


def bridge_crossing(left, right, duration, sigma, barrier):
    conditional_bridge(left, right, duration, .5, sigma)
    if isinstance(barrier, bool) or not isinstance(barrier, (int, float)) or not math.isfinite(barrier) or abs(barrier)>100:
        raise ValueError("A finite barrier within [-100,100] is required.")
    if max(left, right) >= barrier:
        return 1.0
    # Evaluate the exact constant-scale formula in finite arithmetic. Extremely
    # small positive probabilities can underflow; use the negative exponent
    # itself as the log-probability when that distinction matters.
    return math.exp(-2*(barrier-left)*(barrier-right)/(sigma*sigma*duration))


def shared_grid(seed=17, fine_steps=256, duration=1., sigma=1.):
    if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise ValueError("A nonnegative integer seed is required.")
    if isinstance(fine_steps, bool) or not isinstance(fine_steps, int) or not 1 <= fine_steps <= 4096:
        raise ValueError("Use an integer fine grid 1..4096.")
    # This unconditional zero-drift grid can have zero noise. Its domain is
    # independent of the strictly positive-scale conditional bridge domain.
    if any(isinstance(v, bool) or not isinstance(v, (int, float))
           or not math.isfinite(v) for v in [duration, sigma]):
        raise ValueError("Finite real grid duration and scale are required.")
    if not .01 <= duration <= 100 or not (sigma == 0 or .001 <= sigma <= 10):
        raise ValueError("Use grid duration 0.01..100 and scale 0 or 0.001..10.")
    # Generator.normal scale is standard deviation sigma*sqrt(h), not variance.
    rng = np.random.default_rng(seed)
    increments = rng.normal(0., sigma*math.sqrt(duration/fine_steps), fine_steps)
    path = np.concatenate(([0.], np.cumsum(increments)))
    return increments, path


if __name__ == "__main__":
    increments, path = shared_grid()
    print("common fine-grid endpoint:", round(float(path[-1]), 8))
    for blocks in [4, 16, 64, 256]:
        coarse = increments.reshape(blocks, -1).sum(axis=1)
        print("blocks / common endpoint / squared increments:", blocks,
              round(float(coarse.sum()), 8), round(float(coarse @ coarse), 8))
    left, right, duration, fraction, sigma = .2, -.1, .5, .25, .8
    mean, variance, interval = conditional_bridge(left, right, duration, fraction, sigma)
    print("conditional bridge mean / variance:", round(mean, 8), round(variance, 8))
    print("pointwise95% bridge interval:", np.round(interval, 8).tolist())
    print("hidden-between-endpoints crossing chance:", round(bridge_crossing(left, right, duration, sigma, .7), 8))
    print("known endpoint point mass:", conditional_bridge(left, right, duration, 0., sigma))
