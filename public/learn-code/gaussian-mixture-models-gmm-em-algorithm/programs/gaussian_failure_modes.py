"""Supplied-state collapse, exact scalar floor and stationary/empty diagnostics."""
import math
import numpy as np
from gaussian_mixture import GaussianMixtureState
from fractional_gaussian_update import scalar_step


def scalar_objective(variance, scatter, count):
    if variance <= 0 or scatter < 0 or count <= 0:
        raise ValueError("positive variance/count and nonnegative scatter required")
    return -0.5 * count * (math.log(variance) + scatter / variance)


def main():
    rows = np.array([-2, -1, 1, 2])[:, None]
    for sd in [1, .1, .01, .001]:
        state = GaussianMixtureState([.5, .5], [[-2], [0]], [[[sd * sd]], [[4]]])
        print("collapse SD/total likelihood", sd, float(state.score_samples(rows).sum()))
    scatter, floor, count = .02, .05, 2
    for name, variance in [("exact floor", max(scatter, floor)), ("additive", scatter + floor)]:
        print("variance policy", name, "variance", variance, "Q", scalar_objective(variance, scatter, count))
    same = GaussianMixtureState([.5, .5], [[0], [0]], [[[2.5]], [[2.5]]])
    result = scalar_step(rows[:, 0], same.predict_proba(rows), floor=.05)
    print("stationary responsibilities", same.predict_proba(rows).tolist())
    print("stationary new state", result[0].tolist(), result[1].tolist(), result[2].tolist())
    print("stationary total likelihood", float(same.score_samples(rows).sum()))
    try:
        scalar_step([0, 1], [[1, 0], [1, 0]])
    except ValueError as error:
        print("empty status", str(error))
    print("zero raw scatter floor", scalar_step([1, 1], [[1], [1]], floor=.05)[2].tolist())


if __name__ == "__main__":
    main()
