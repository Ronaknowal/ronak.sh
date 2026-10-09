"""Exact declared queue models and a labelled GI/G/1 mean approximation.

Run: python queue_formulas.py --arrival-rate .9 --service-rate 1 --percentile .99
Rates: requests/second. Durations: seconds. Finite K counts total residents.
Unstable infinite-capacity results return null plus a reason, not fake numbers.
This calculates mathematical models; it does not measure an inference engine.
"""
from __future__ import annotations

import argparse
import json
import math


def rates(arrival_rate: float, service_rate: float) -> None:
    if not math.isfinite(arrival_rate) or arrival_rate < 0:
        raise ValueError("Arrival rate must be finite and nonnegative.")
    if not math.isfinite(service_rate) or service_rate <= 0:
        raise ValueError("Service rate must be finite and positive.")
    if not math.isfinite(arrival_rate/service_rate):
        raise ValueError("Rate ratio exceeds floating-point representation; rescale the time unit.")


def mm1(arrival_rate: float, service_rate: float, percentile: float = .99,
        deadline: float = 1.0) -> dict:
    rates(arrival_rate, service_rate)
    if not math.isfinite(percentile) or not 0 <= percentile < 1:
        raise ValueError("Percentile probability must be in [0,1); p=1 has unbounded support.")
    if not math.isfinite(deadline) or deadline < 0:
        raise ValueError("Deadline must be finite nonnegative seconds.")
    rho = arrival_rate / service_rate
    if rho >= 1:
        return {"rho": rho, "stationary": False, "reason": "Infinite M/M/1 requires rho < 1."}
    slack = service_rate - arrival_rate
    queue_quantile = (math.log(rho / (1-percentile)) / slack
                      if rho > 0 and percentile > 1-rho else 0.0)
    return {
        "rho": rho, "stationary": True,
        "mean_response": 1/slack,
        "mean_wait": rho/slack,
        "mean_population": rho/(1-rho),
        "mean_queue": rho*rho/(1-rho),
        "wait_zero_mass": 1-rho,
        "percentile_probability": percentile,
        "response_quantile": -math.log1p(-percentile)/slack,
        "wait_quantile": queue_quantile,
        "deadline_seconds": deadline,
        "response_survival_at_deadline": math.exp(-slack*deadline),
        "wait_survival_at_deadline": rho*math.exp(-slack*deadline),
        "zero_arrival_note": "At lambda=0 duration values describe an isolated test job, not measured flow.",
        "assumptions": "Stationary FCFS, Poisson arrival, independent exponential service, fixed one server.",
    }


def pk(arrival_rate: float, mean_service: float, second_moment: float) -> dict:
    if not all(math.isfinite(x) for x in (arrival_rate, mean_service, second_moment)):
        raise ValueError("Parameters must be finite.")
    if arrival_rate < 0 or mean_service <= 0 or second_moment < mean_service**2-1e-12:
        raise ValueError("Need lambda>=0, E[S]>0 and E[S²]>=E[S]².")
    rho = arrival_rate*mean_service
    if rho >= 1:
        return {"rho": rho, "stationary": False, "reason": "M/G/1 requires rho < 1."}
    wait = arrival_rate*second_moment/(2*(1-rho))
    return {"rho": rho, "stationary": True, "mean_wait": wait,
            "mean_response": wait+mean_service,
            "service_cv_squared": second_moment/mean_service**2-1,
            "tail_quantile": None,
            "assumptions": "Poisson arrivals, independent FCFS service, finite second moment."}


def kingman(mean_service: float, rho: float, arrival_cv_squared: float,
            service_cv_squared: float) -> dict:
    values = [mean_service, rho, arrival_cv_squared, service_cv_squared]
    if not all(math.isfinite(value) for value in values):
        raise ValueError("Parameters must be finite.")
    if mean_service <= 0 or rho < 0 or min(arrival_cv_squared, service_cv_squared) < 0:
        raise ValueError("Mean service positive; load and squared CVs nonnegative.")
    if rho >= 1:
        return {"rho": rho, "approximate_mean_wait": None, "reason": "Need rho < 1."}
    return {"rho": rho, "approximate_mean_wait":
            (arrival_cv_squared+service_cv_squared)/2*rho/(1-rho)*mean_service,
            "assumptions": "GI/G/1 FCFS, independent renewal input/service, finite variances; heavy-traffic approximation.",
            "tail_quantile": None}


def erlang_c(arrival_rate: float, service_rate: float, servers: int,
             deadline: float = 1) -> dict:
    rates(arrival_rate, service_rate)
    if isinstance(servers, bool) or not isinstance(servers, int) or servers < 1:
        raise ValueError("Server count must be a positive integer.")
    if not math.isfinite(deadline) or deadline < 0:
        raise ValueError("Deadline must be finite nonnegative seconds.")
    offered_load = arrival_rate/service_rate
    rho = offered_load/servers
    if rho >= 1:
        return {"rho": rho, "stationary": False, "reason": "Pooled M/M/c requires rho < 1."}
    # Erlang B recurrence uses normalized probabilities rather than factorials.
    loss_probability = 1.0
    for count in range(1, servers+1):
        loss_probability = offered_load*loss_probability/(count+offered_load*loss_probability)
    probability_wait = loss_probability/(1-rho+rho*loss_probability)
    slack = servers*service_rate-arrival_rate
    mean_wait = probability_wait/slack
    return {"rho": rho, "stationary": True, "probability_wait": probability_wait,
            "mean_wait": mean_wait, "mean_response": mean_wait+1/service_rate,
            "wait_survival_at_deadline": probability_wait*math.exp(-slack*deadline),
            "assumptions": "One pooled FCFS queue, c independent identical exponential servers, Poisson arrival.",
            "response_tail_note": "Waiting survival is not total-response survival."}


def finite_mm1(arrival_rate: float, service_rate: float, capacity: int) -> dict:
    rates(arrival_rate, service_rate)
    if isinstance(capacity, bool) or not isinstance(capacity, int) or capacity < 1:
        raise ValueError("K is a positive integer total-system capacity.")
    rho = arrival_rate/service_rate
    if rho == 0:
        probabilities = [1.0]+[0.0]*capacity
    else:
        log_weights = [count*math.log(rho) for count in range(capacity+1)]
        largest = max(log_weights)
        weights = [math.exp(value-largest) for value in log_weights]
        probabilities = [weight/sum(weights) for weight in weights]
    blocked = probabilities[-1]
    # Equivalent stationary departure flow avoids 1-pK cancellation at high load.
    admitted = (arrival_rate*(1-blocked) if rho <= 1
                else service_rate*(1-probabilities[0]))
    population = sum(count*probability for count, probability in enumerate(probabilities))
    return {"offered_rho": rho, "capacity_total": capacity, "waiting_room": capacity-1,
            "probabilities": probabilities, "blocking_probability": blocked,
            "admitted_rate": admitted, "mean_population": population,
            "mean_admitted_response": population/admitted if admitted > 0 else None,
            "latency_bound": None,
            "note": "Finite population is stationary with loss even at offered rho>=1; exponential service is unbounded."}


def mm1_slo_capacity(service_rate: float, deadline: float, miss_probability: float) -> dict:
    rates(0, service_rate)
    if deadline <= 0 or not math.isfinite(deadline) or not 0 < miss_probability < 1:
        raise ValueError("Positive finite deadline and miss probability in (0,1) required.")
    maximum_arrival = service_rate+math.log(miss_probability)/deadline
    return {"maximum_arrival_rate": max(0, maximum_arrival) if maximum_arrival >= 0 else None,
            "isolated_service_meets_target": math.exp(-service_rate*deadline) <= miss_probability,
            "assumptions": "Exact stationary M/M/1 FCFS total-response tail only; not a deployment guarantee."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arrival-rate", type=float, default=.9)
    parser.add_argument("--service-rate", type=float, default=1)
    parser.add_argument("--percentile", type=float, default=.99)
    args = parser.parse_args()
    report = {"units": "seconds and requests/second",
              "mm1": mm1(args.arrival_rate, args.service_rate, args.percentile),
              "same_mean_pk": [pk(.8, 1, moment) for moment in [1, 2, 3.25]],
              "kingman_example": kingman(1, .8, 4, 1),
              "pooled_example": erlang_c(3, 2, 2),
              "finite_example": finite_mm1(1, 1, 3)}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
