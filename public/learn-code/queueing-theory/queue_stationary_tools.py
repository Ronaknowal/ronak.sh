"""Erlang mixtures and finite generators with ordinary SciPy tools.

Run: python queue_stationary_tools.py finite_process_library.py
Download the second file from the earlier Stochastic Processes lesson.
Requires NumPy and SciPy. No previous programme main is run by this import.
Rates are per second, time is seconds, generator rows are departure states.
Mixtures cost O(budget squared) by the explicit sums below; dense finite
solve/expm costs O((capacity+1) cubed). The reused uniformization adds one
dense matrix product per retained term and reports omitted probability.
"""
import importlib.util
import math
import sys
from pathlib import Path

import numpy as np
from scipy.linalg import expm, solve
from scipy.stats import gamma


def load_process_library(path):
    spec = importlib.util.spec_from_file_location("finite_process_library", Path(path))
    if spec is None or spec.loader is None:
        raise ValueError("Provide the earlier finite_process_library.py source")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def erlang_survival(shape, rate_times_time):
    if type(shape) is not int or not 1 <= shape <= 201:
        raise ValueError("Use integer shape 1 through 201")
    if not math.isfinite(rate_times_time) or not 0 <= rate_times_time <= 80:
        raise ValueError("Use rate times time in [0,80]")
    term = total = 1.0
    for j in range(1, shape):
        term *= rate_times_time / j
        total += term
    return math.exp(-rate_times_time) * total


def queue_tail_mixtures(arrival, service, time, budget=80):
    if not all(math.isfinite(x) for x in [arrival, service, time]):
        raise ValueError("Use finite rates and time")
    if not .1 <= service <= 20 or not .1 <= arrival/service <= .95 or not 0 <= time <= 4:
        raise ValueError("Need service .1–20/s, load .1–.95 and time 0–4s")
    if type(budget) is not int or not 1 <= budget <= 200:
        raise ValueError("Use an integer mixture budget 1 through 200")
    rho = arrival/service
    weight = 1-rho
    scratch_wait = scratch_total = library_wait = library_total = 0.0
    for n in range(budget+1):
        scratch_total += weight * erlang_survival(n+1, service*time)
        library_total += weight * float(gamma.sf(time, a=n+1, scale=1/service))
        if n:
            scratch_wait += weight * erlang_survival(n, service*time)
            library_wait += weight * float(gamma.sf(time, a=n, scale=1/service))
        weight *= rho
    # Remaining geometric mass bounds either omitted nonnegative survival.
    omitted = rho**(budget+1)
    closed_wait = rho*math.exp(-(service-arrival)*time)
    closed_total = math.exp(-(service-arrival)*time)
    for scratch, library, exact in [(scratch_wait, library_wait, closed_wait),
                                    (scratch_total, library_total, closed_total)]:
        if abs(scratch-library) > 2e-12 or not -2e-12 <= exact-library <= omitted+2e-12:
            raise ArithmeticError("Mixture check exceeded its tail and roundoff allowances")
    return scratch_wait, library_wait, scratch_total, library_total, omitted, 1-rho


def finite_generator(arrival, service, capacity):
    if type(capacity) is not int or not 1 <= capacity <= 20:
        raise ValueError("Capacity includes service; use 1 through 20 slots")
    if not all(math.isfinite(x) and .1 <= x <= 20 for x in [arrival, service]):
        raise ValueError("Use rates .1 through 20 per second")
    generator = np.zeros((capacity+1, capacity+1))
    for n in range(capacity+1):
        if n < capacity:
            generator[n, n+1] = arrival
        if n > 0:
            generator[n, n-1] = service
        generator[n, n] = -generator[n].sum()
    return generator


def finite_stationary(arrival, service, capacity):
    generator = finite_generator(arrival, service, capacity)
    system = generator.T.copy()
    system[-1] = 1
    target = np.zeros(capacity+1)
    target[-1] = 1
    stationary = solve(system, target, assume_a="gen")
    residual = float(np.linalg.norm(stationary @ generator, ord=np.inf))
    if (not np.isfinite(stationary).all() or stationary.min() < -1e-12
            or abs(stationary.sum()-1) > 1e-12 or residual > 1e-10):
        raise ArithmeticError("A normalized finite stationary probability law was not recovered")
    admitted = arrival*float(stationary[:-1].sum())
    mean_number = float(np.arange(capacity+1) @ stationary)
    return generator, stationary, residual, admitted, mean_number/admitted


def main(process_source):
    previous = load_process_library(process_source)
    for time in [0., 1., 4.]:
        result = queue_tail_mixtures(.9, 1., time, 80)
        print("time / scratch wait / SciPy wait / scratch total / SciPy total:",
              time, *(round(x, 9) for x in result[:4]))
        print("omitted mixture mass / zero-wait atom:", result[4], result[5])
    for arrival in [8., 10., 12.]:
        generator, pi, residual, admitted, total = finite_stationary(arrival, 10., 3)
        exact_transition = expm(generator)
        partial, omitted = previous.uniformization(generator, 1., last_term=80)
        discrepancy = float(np.max(np.abs(partial-exact_transition)))
        np.testing.assert_allclose(pi @ exact_transition, pi, rtol=0, atol=2e-12)
        assert discrepancy <= omitted+2e-12
        print("offered / invariant law:", arrival, np.round(pi, 9).tolist())
        print("equation residual / admitted rate / total seconds:", residual,
              round(admitted, 9), round(total, 9))
        print("empty-start one-second law:", np.round(exact_transition[0], 9).tolist())
        print("uniformization discrepancy / unrenormalized missing mass:", discrepancy, omitted)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python queue_stationary_tools.py finite_process_library.py")
    main(sys.argv[1])
