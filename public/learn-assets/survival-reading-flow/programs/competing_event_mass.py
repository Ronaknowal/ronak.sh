"""First-event Aalen–Johansen mass, independent right-censored subjects.

All subjects enter at zero; status 0 means observation ended, 1..K name causes.
Events at a tied endpoint precede censor removal. No fits run on import.
"""

from bisect import bisect_right
from dataclasses import dataclass
from itertools import groupby
from math import exp, expm1, fsum, isfinite
from numbers import Integral, Real


def observation_rows(times, status, n_causes):
    """Validate the small public contract, then sort endpoints once."""
    times, status = tuple(times), tuple(status)
    if not times or len(times) != len(status):
        raise ValueError("Supply equal nonempty endpoint and cause sequences.")
    if isinstance(n_causes, bool) or not isinstance(n_causes, Integral) or n_causes < 1:
        raise ValueError("Supply the positive number of named causes.")
    rows = []
    for time, cause in zip(times, status):
        if isinstance(time, bool) or not isinstance(time, Real):
            raise ValueError("Endpoints must be real durations.")
        time = float(time)
        if not isfinite(time) or time < 0:
            raise ValueError("Endpoints must be finite and nonnegative.")
        if isinstance(cause, bool) or not isinstance(cause, Integral) or not 0 <= cause <= n_causes:
            raise ValueError("Use integer 0 for censoring and 1..K for causes.")
        rows.append((time, int(cause)))
    return sorted(rows, key=lambda row: row[0])


@dataclass(frozen=True)
class CompetingPoint:
    time: float
    at_risk: int
    failures: tuple[int, ...]
    censored: int
    before_survival: float
    increments: tuple[float, ...]
    survival: float
    incidence: tuple[float, ...]


@dataclass(frozen=True)
class CompetingCurve:
    points: tuple[CompetingPoint, ...]
    n_causes: int
    times: tuple[float, ...]

    def probability(self, time):
        """Return (event-free, cause1, ..., causeK) on observed support."""
        time = float(time)
        if not isfinite(time) or not 0 <= time <= self.times[-1]:
            raise ValueError("Query inside the observed follow-up range.")
        index = bisect_right(self.times, time) - 1
        if index < 0:
            return (1.0,) + (0.0,) * self.n_causes
        point = self.points[index]
        return (point.survival,) + point.incidence


def aalen_johansen(times, status, n_causes):
    """O(n log n + g K) time; O(n + g K) retained state for g endpoints."""
    rows = observation_rows(times, status, n_causes)
    risk, survival = len(rows), 1.0
    incidence = [0.0] * n_causes
    points = []
    for time, tied in groupby(rows, key=lambda row: row[0]):
        counts = [0] * n_causes
        censored = 0
        for _, cause in tied:
            if cause == 0:
                censored += 1
            else:
                counts[cause - 1] += 1
        before = survival
        increments = tuple(before * count / risk for count in counts)
        # Every cause receives mass from the SAME pre-event survival value.
        incidence = [old + added for old, added in zip(incidence, increments)]
        deaths = sum(counts)
        survival = before * ((risk - deaths) / risk)
        points.append(CompetingPoint(
            time, risk, tuple(counts), censored, before, increments,
            survival, tuple(incidence),
        ))
        risk -= deaths + censored
    points = tuple(points)
    return CompetingCurve(points, n_causes, tuple(point.time for point in points))


def constant_first_event(rates, horizon):
    """Constant nonnegative cause rates: (event-free, cause1, ..., causeK)."""
    rates = tuple(float(rate) for rate in rates)
    horizon = float(horizon)
    if not rates or not all(isfinite(rate) and rate >= 0 for rate in rates):
        raise ValueError("Supply finite nonnegative cause rates.")
    if not isfinite(horizon) or horizon < 0:
        raise ValueError("Supply a finite nonnegative horizon.")
    try:
        total = fsum(rates)
    except OverflowError as error:
        raise ValueError("The total rate must be representable.") from error
    if not isfinite(total):
        raise ValueError("The total rate must be representable.")
    if total == 0:
        return (1.0,) + (0.0,) * len(rates)
    area = total * horizon
    lost = -expm1(-area)
    return (exp(-area),) + tuple((rate / total) * lost for rate in rates)
