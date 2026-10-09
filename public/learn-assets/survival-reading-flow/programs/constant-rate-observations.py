"""Constant-rate observation totals and a matched scalar optimizer example.

The pump rate uses closed-form arithmetic. The SciPy optimizer receives a
separate four-subject fixture with two failures over fifteen exposure units.
"""

from dataclasses import asdict
import json
from math import exp, log

from scipy.optimize import minimize_scalar
from scipy.stats import expon

from exponential_observations import observation_totals, fit_exponential, log_rate_terms


def main():
    times = [2, 3, 4, 4, 6, 7, 8, 9]
    events = [True, False, True, False, True, False, True, False]
    totals = observation_totals(times, events)
    fit = fit_exponential(totals)
    terms = log_rate_terms(fit.log_rate, totals)
    print("pump closed-form fit:", json.dumps(asdict(fit)))
    print("pump log-rate terms at fit:", json.dumps(asdict(terms)))
    density = exp(fit.log_rate - fit.rate * 4)
    tail = exp(-fit.rate * 4)
    ordinary = expon(scale=1 / fit.rate)
    print("day4 different contributions:", json.dumps({
        "event_density_per_day": density,
        "right_censor_tail": tail,
        "scipy_density": float(ordinary.pdf(4)),
        "scipy_tail": float(ordinary.sf(4)),
    }))
    print("model extrapolation at10:", json.dumps({
        "survival": exp(-fit.rate * 10),
        "scipy_survival": float(ordinary.sf(10)),
    }))
    extended = times.copy()
    extended[-1] += 4
    print("four extra running days:", json.dumps(asdict(
        fit_exponential(observation_totals(extended, events))
    )))
    hours = observation_totals((24 * t for t in times), events)
    print("same observations in hours:", json.dumps(asdict(fit_exponential(hours))))
    for label, observed, failed in (
        ("all censored", [1, 2, 4], [False, False, False]),
        ("zero-time events", [0, 0], [True, True]),
        ("zero-time censors", [0, 0], [False, False]),
    ):
        result = fit_exponential(observation_totals(observed, failed))
        print(label + ":", json.dumps(asdict(result)))

    # The optimizer receives this four-subject fixture.
    fresh = observation_totals([1, 3, 5, 6], [True, False, True, False])
    expected = fit_exponential(fresh)
    result = minimize_scalar(
        lambda eta: -log_rate_terms(eta, fresh).log_likelihood,
        bounds=(log(0.01), log(1.0)), method="bounded",
        options={"xatol": 1e-12},
    )
    print("new four-subject SciPy witness:", json.dumps({
        "expected_rate": expected.rate,
        "rate": exp(result.x),
        "log_rate": float(result.x),
        "success": bool(result.success),
        "message": str(result.message),
        "evaluations": int(result.nfev),
        "gradient": log_rate_terms(result.x, fresh).score,
    }))


if __name__ == "__main__":
    main()
