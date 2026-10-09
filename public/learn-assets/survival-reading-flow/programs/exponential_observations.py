"""Constant-rate first-event likelihood from exact/right-censored records.

Independent subjects start at zero; durations and rate share declared units.
This is the right-censor core, not entry/interval/history likelihood. No work
occurs on import. Zero, flat and unbounded cases are explicit fit statuses.
"""

from dataclasses import dataclass
from itertools import zip_longest
from math import exp, fsum, isfinite, log
from numbers import Integral, Real


@dataclass(frozen=True)
class ExposureTotals:
    subjects: int
    failures: int
    exposure: float


def observation_totals(times, events):
    """One pass over durations/flags, without materializing the observation rows."""
    subjects = 0
    failures = 0
    missing = object()

    def durations():
        nonlocal subjects, failures
        for time, event in zip_longest(times, events, fillvalue=missing):
            if time is missing or event is missing:
                raise ValueError("Time and event sequences must have equal length.")
            if isinstance(time, bool) or not isinstance(time, Real):
                raise ValueError("Each time must be a real duration.")
            time = float(time)
            if not isfinite(time) or time < 0:
                raise ValueError("Durations must be finite and nonnegative.")
            if not isinstance(event, (bool, Integral)) or event not in (0, 1):
                raise ValueError("Event flags must be Python bool or integer 0/1.")
            subjects += 1
            failures += int(event)
            yield time

    exposure = fsum(durations())
    if subjects == 0:
        raise ValueError("Supply at least one observed subject.")
    if not isfinite(exposure):
        raise OverflowError("Total exposure is not representable.")
    return ExposureTotals(subjects, failures, exposure)


@dataclass(frozen=True)
class LogRateTerms:
    log_likelihood: float
    score: float
    information: float


def log_rate_terms(log_rate, totals):
    """ell=D*eta-exp(eta)*E; eta score and observed information.

    The input totals come from observation_totals. Form rate*exposure on the
    log scale, avoiding a separately overflowing rate with tiny exposure.
    Finite positive expected exposure must remain representable.
    """
    if not isinstance(totals, ExposureTotals):
        raise TypeError("Supply validated ExposureTotals.")
    if isinstance(log_rate, bool) or not isinstance(log_rate, Real):
        raise ValueError("Log rate must be a real scalar.")
    log_rate = float(log_rate)
    if not isfinite(log_rate):
        raise ValueError("Log rate must be finite.")
    expected = 0.0
    if totals.exposure > 0:
        expected = exp(log_rate + log(totals.exposure))
        if expected == 0 or not isfinite(expected):
            raise OverflowError("Positive rate times exposure is not representable.")
    likelihood = totals.failures * log_rate - expected
    if not isfinite(likelihood):
        raise OverflowError("Log likelihood is not representable.")
    return LogRateTerms(likelihood, totals.failures - expected, expected)


@dataclass(frozen=True)
class ExponentialFit:
    status: str
    rate: float | None
    log_rate: float | None
    log_likelihood: float | None
    information_log_rate: float | None
    totals: ExposureTotals


def fit_exponential(totals):
    """Closed-form maximum; never ask a positive-rate optimizer to find zero."""
    if not isinstance(totals, ExposureTotals):
        raise TypeError("Supply validated ExposureTotals.")
    d = totals.failures
    exposure = totals.exposure
    if exposure == 0:
        if d == 0:
            return ExponentialFit("flat-likelihood", None, None, 0.0, None, totals)
        return ExponentialFit("unbounded-likelihood", None, None, None, None, totals)
    if d == 0:
        # This is the zero-rate boundary of an extended no-event law; a
        # strictly positive-rate model has a supremum as rate approaches zero.
        return ExponentialFit("zero-boundary", 0.0, None, 0.0, None, totals)
    rate = d / exposure
    if rate == 0 or not isfinite(rate):
        raise OverflowError("The positive fitted rate is not representable.")
    eta = log(d) - log(exposure)
    likelihood = d * eta - d
    if not isfinite(likelihood):
        raise OverflowError("The fitted likelihood is not representable.")
    return ExponentialFit("finite-interior", rate, eta, likelihood, float(d), totals)
