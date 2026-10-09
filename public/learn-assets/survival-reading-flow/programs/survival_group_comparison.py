"""Two-group, right-censor log-rank calculations with explicit risk-set steps.

Independent subjects start at zero. The inherited endpoint validator and
failure-before-censor convention come from survival_estimators. Sorting is
O(n log n); merging endpoint groups and retaining steps is O(n). No work occurs
on import. A zero variance gives an unavailable test, not evidence of equality.
"""

from dataclasses import dataclass
from heapq import merge
from itertools import groupby
from math import erfc, fsum, isfinite, sqrt
from numbers import Real

from survival_estimators import prepare_groups


@dataclass(frozen=True)
class LogrankStep:
    time: float
    risk1: int
    risk0: int
    failures1: int
    failures0: int
    expected1: float
    variance1: float
    pooled_survival_before: float
    weight: float
    contribution: float
    variance_contribution: float


@dataclass(frozen=True)
class LogrankResult:
    score: float
    variance: float
    statistic: float | None
    asymptotic_p: float | None
    status: str
    steps: tuple[LogrankStep, ...]


def _weight_rule(weighting, p, q):
    allowed = {"logrank", "wilcoxon", "tarone-ware", "fleming-harrington"}
    if weighting not in allowed:
        raise ValueError("Choose a supported, prespecified weighting.")
    for exponent in (p, q):
        if isinstance(exponent, bool) or not isinstance(exponent, Real):
            raise ValueError("Fleming-Harrington exponents must be real.")
        if not isfinite(float(exponent)) or exponent < 0:
            raise ValueError("Fleming-Harrington exponents must be finite and nonnegative.")
    if weighting != "fleming-harrington" and (p != 0 or q != 0):
        raise ValueError("p and q apply only to Fleming-Harrington weighting.")

    def weight(at_risk, survival_before):
        if weighting == "logrank":
            return 1.0
        if weighting == "wilcoxon":
            return float(at_risk)
        if weighting == "tarone-ware":
            return sqrt(at_risk)
        # Exponent zero means factor one, including the initial 0**0 factor.
        return survival_before ** float(p) * (1.0 - survival_before) ** float(q)

    return weight


def logrank_two_group(times1, events1, times0, events0, *, weighting="logrank", p=0, q=0):
    """Return conditional tied-event steps and an asymptotic chi-square test.

The finite-population variance models a tied batch as sampling failing identities
without replacement. Recorded-time rounding and dependent censoring need their
own assessment; this calculation cannot identify those observation mechanisms.
"""
    weight = _weight_rule(weighting, p, q)
    groups1 = prepare_groups(times1, events1)
    groups0 = prepare_groups(times0, events0)
    risk1, risk0 = groups1[0].at_risk, groups0[0].at_risk
    endpoints1 = ((g.time, 1, g.failures, g.censored) for g in groups1)
    endpoints0 = ((g.time, 0, g.failures, g.censored) for g in groups0)
    survival = 1.0
    steps = []
    for time, endpoints in groupby(merge(endpoints0, endpoints1), key=lambda row: row[0]):
        failures = [0, 0]
        censored = [0, 0]
        for _, group, deaths, removals in endpoints:
            failures[group] = deaths
            censored[group] = removals
        total = risk1 + risk0
        deaths = failures[1] + failures[0]
        if deaths:
            fraction1 = risk1 / total
            expected1 = deaths * fraction1
            # This factored form avoids forming products of four large counts.
            variance1 = (
                deaths * fraction1 * (1.0 - fraction1) * ((total - deaths) / (total - 1))
                if total > 1 else 0.0
            )
            current_weight = weight(total, survival)
            steps.append(LogrankStep(
                time, risk1, risk0, failures[1], failures[0], expected1,
                variance1, survival, current_weight,
                current_weight * (failures[1] - expected1),
                current_weight * current_weight * variance1,
            ))
            survival *= 1.0 - deaths / total
        # Both tied failures and censors participated in the preceding risk set.
        risk1 -= failures[1] + censored[1]
        risk0 -= failures[0] + censored[0]
    score = fsum(step.contribution for step in steps)
    variance = fsum(step.variance_contribution for step in steps)
    if variance == 0.0:
        return LogrankResult(score, variance, None, None, "no-comparison-information", tuple(steps))
    statistic = (score / sqrt(variance)) ** 2
    probability = erfc(sqrt(statistic / 2.0))
    return LogrankResult(score, variance, statistic, probability, "asymptotic-test", tuple(steps))
