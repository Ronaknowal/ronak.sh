"""Grouped right-censor Kaplan–Meier core; no work occurs on import.

Times are finite nonnegative durations, with independent subjects followed from
zero. Python bool or integer 0/1 flags distinguish failure from right censoring.
Tied failures have priority over censor removal. Entry/history is a separate
algorithm. Probability queries and restricted areas refuse extrapolation.
"""

from bisect import bisect_left, bisect_right
from dataclasses import dataclass
from itertools import groupby
from math import exp, isfinite, log, log1p, sqrt
from numbers import Integral, Real
from statistics import NormalDist
import sys


@dataclass(frozen=True)
class RiskGroup:
    time: float
    at_risk: int
    failures: int
    censored: int


def prepare_groups(times, events):
    """Sort once, then account for all tied endpoints together: O(n log n)."""
    times, events = tuple(times), tuple(events)
    if not times or len(times) != len(events):
        raise ValueError("Supply equal, nonempty time and event sequences.")
    rows = []
    for time, event in zip(times, events):
        if isinstance(time, bool) or not isinstance(time, Real):
            raise ValueError("Each time must be a real duration.")
        time = float(time)
        if not isfinite(time) or time < 0:
            raise ValueError("Durations must be finite and nonnegative.")
        if not isinstance(event, (bool, Integral)) or event not in (0, 1):
            raise ValueError("Event flags must be Python bool or integer 0/1.")
        rows.append((time, bool(event)))
    rows.sort(key=lambda row: row[0])
    at_risk = len(rows)
    groups = []
    for time, tied in groupby(rows, key=lambda row: row[0]):
        failures = censored = 0
        for _, event in tied:
            failures += int(event)
            censored += int(not event)
        groups.append(RiskGroup(time, at_risk, failures, censored))
        at_risk -= failures + censored
    return tuple(groups)


@dataclass(frozen=True)
class CurvePoint:
    group: RiskGroup
    survival: float
    log_survival: float
    greenwood: float | None
    area_before: float


@dataclass(frozen=True)
class PointwiseInterval:
    lower: float | None
    upper: float | None
    alpha: float
    status: str


@dataclass(frozen=True)
class KaplanMeier:
    points: tuple[CurvePoint, ...]
    times: tuple[float, ...]
    followup_end: float

    def _supported(self, time):
        if isinstance(time, bool) or not isinstance(time, Real):
            raise ValueError("A query must be a real duration.")
        time = float(time)
        if not isfinite(time) or not 0 <= time <= self.followup_end:
            raise ValueError("Query is outside recorded follow-up support.")
        return time

    def _index(self, time, side):
        if side not in ("right", "left"):
            raise ValueError("Choose right/post-event or left/pre-event.")
        lookup = bisect_right if side == "right" else bisect_left
        return lookup(self.times, time) - 1

    def value(self, time, side="right"):
        """O(log g) lookup, preserving endpoint priority and support."""
        time = self._supported(time)
        index = self._index(time, side)
        return 1.0 if index < 0 else self.points[index].survival

    def restricted_mean(self, horizon):
        """Prefix rectangle area, then one partial segment: O(log g)."""
        horizon = self._supported(horizon)
        index = self._index(horizon, "right")
        if index < 0:
            return horizon
        point = self.points[index]
        return point.area_before + (horizon - point.group.time) * point.survival

    def median(self):
        """First observed crossing; None means not reached, not infinity."""
        return next((p.group.time for p in self.points if p.log_survival <= log(0.5)), None)

    def log_log_interval(self, time, alpha=0.05, side="right"):
        """Approximate pointwise Greenwood interval, with explicit boundaries."""
        time = self._supported(time)
        if isinstance(alpha, bool) or not isinstance(alpha, Real):
            raise ValueError("alpha must be a real excluded probability.")
        alpha = float(alpha)
        if not isfinite(alpha) or not 0 < alpha < 1:
            raise ValueError("alpha must lie strictly between zero and one.")
        tail = 1.0 - alpha / 2.0
        if not 0 < tail < 1:
            raise ValueError("alpha is too small for a representable normal quantile.")
        index = self._index(time, side)
        log_survival = 0.0 if index < 0 else self.points[index].log_survival
        greenwood = 0.0 if index < 0 else self.points[index].greenwood
        if log_survival == 0.0 or log_survival == -float("inf"):
            return PointwiseInterval(None, None, alpha, "interior transform unavailable at S=1 or S=0")
        coordinate = log(-log_survival)
        standard_error = sqrt(greenwood) / (-log_survival)
        width = NormalDist().inv_cdf(tail) * standard_error

        def inverse(value):
            # A larger inner exponential would underflow the outer one anyway.
            if value > log(sys.float_info.max):
                return 0.0
            return exp(-exp(value))

        return PointwiseInterval(inverse(coordinate + width), inverse(coordinate - width), alpha, "approximate pointwise")


def kaplan_meier(times, events):
    """Grouped product-limit estimate; O(n log n) setup, O(g) retained state."""
    groups = prepare_groups(times, events)
    log_survival = greenwood = area = previous_time = 0.0
    previous_survival = 1.0
    points = []
    for group in groups:
        area += (group.time - previous_time) * previous_survival
        n, d = group.at_risk, group.failures
        if d == n:
            log_survival = -float("inf")
            greenwood = None
        elif d:
            log_survival += log1p(-d / n)
            greenwood += d / (n * (n - d))
        survival = exp(log_survival)
        points.append(CurvePoint(group, survival, log_survival, greenwood, area))
        previous_time, previous_survival = group.time, survival
    return KaplanMeier(tuple(points), tuple(g.time for g in groups), groups[-1].time)
