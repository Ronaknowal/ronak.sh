"""Continuous model windows and a grouped Nelson–Aalen calculation.

No work occurs on import. Times/scale share units; rates use inverse time.
These are supplied laws, not a fit to the pump observations. A finite positive
increment must be representable; overflow/underflow is reported, not clipped.
"""

from bisect import bisect_left, bisect_right
from dataclasses import dataclass
from math import exp, expm1, isfinite, log1p
from numbers import Real

from survival_estimators import KaplanMeier


def _nonnegative(value, name):
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(name + " must be a real number.")
    value = float(value)
    if not isfinite(value) or value < 0:
        raise ValueError(name + " must be finite and nonnegative.")
    return value


@dataclass(frozen=True)
class ModelWindow:
    integrated_rate: float
    log_survival: float
    survival: float
    failure_probability: float


def _window(increment):
    if not isfinite(increment):
        raise OverflowError("Integrated rate exceeds this floating-point model domain.")
    return ModelWindow(increment, -increment, exp(-increment), -expm1(-increment))


def constant_rate_window(rate, width):
    """Exact interval probabilities, including the analytical rate/width zero."""
    rate = _nonnegative(rate, "rate")
    width = _nonnegative(width, "width")
    increment = rate * width
    if rate > 0 and width > 0 and increment == 0:
        raise OverflowError("Positive integrated rate is below float resolution.")
    return _window(increment)


def conditional_weibull(shape, scale, age, width):
    """Conditional future probabilities, avoiding subtraction of two survivals.

    For age>0 the increment is H(age)*expm1(shape*log1p(width/age)),
    so nearby ages do not subtract two nearly equal powers. This scalar core
    requires representable powers/increments; it is not an arbitrary-precision
    implementation. Zero-width is exact, even with a singular origin rate.
    """
    shape = _nonnegative(shape, "shape")
    scale = _nonnegative(scale, "scale")
    age = _nonnegative(age, "age")
    width = _nonnegative(width, "width")
    if shape == 0 or scale == 0:
        raise ValueError("Weibull shape and scale must be strictly positive.")
    if not isfinite(age + width):
        raise OverflowError("The future age is not representable.")
    if width == 0:
        return _window(0.0)
    if age == 0:
        increment = (width / scale) ** shape
    else:
        base = (age / scale) ** shape
        increment = base * expm1(shape * log1p(width / age))
    if increment == 0:
        raise OverflowError("Positive integrated rate is below float resolution.")
    return _window(increment)


def weibull_rate(shape, scale, age):
    """An origin singularity is mathematical, not a finite plotted point."""
    shape = _nonnegative(shape, "shape")
    scale = _nonnegative(scale, "scale")
    age = _nonnegative(age, "age")
    if shape == 0 or scale == 0:
        raise ValueError("Weibull shape and scale must be strictly positive.")
    if age == 0:
        if shape < 1:
            return float("inf")
        if shape > 1:
            return 0.0
        result = 1 / scale
    else:
        relative_age = age / scale
        if not isfinite(relative_age) or relative_age == 0:
            raise OverflowError("Relative age exceeds this floating-point model domain.")
        result = (shape / scale) * relative_age ** (shape - 1)
    if not isfinite(result) or result == 0:
        raise OverflowError("Finite-age rate exceeds this floating-point model domain.")
    return result


@dataclass(frozen=True)
class NelsonAalen:
    times: tuple[float, ...]
    increments: tuple[float, ...]
    cumulative: tuple[float, ...]
    followup_end: float

    def value(self, time, side="right"):
        time = _nonnegative(time, "time")
        if time > self.followup_end:
            raise ValueError("Query is outside recorded follow-up support.")
        if side not in ("right", "left"):
            raise ValueError("Choose right/post-event or left/pre-event.")
        lookup = bisect_right if side == "right" else bisect_left
        index = lookup(self.times, time) - 1
        return 0.0 if index < 0 else self.cumulative[index]


def nelson_aalen(estimate: KaplanMeier):
    """Reuse the prepared risk groups; O(g) time/state, no second record sort.

    The input is the estimate produced by the local grouped core. No smoothed
    tie convention, entry/history, weights or instantaneous-rate fit is hidden.
    A small compensated sum retains rounding lost by preceding additions.
    """
    if not isinstance(estimate, KaplanMeier):
        raise TypeError("Supply the grouped local KaplanMeier response estimate.")
    total = correction = 0.0
    increments = []
    cumulative = []
    for point in estimate.points:
        group = point.group
        increment = group.failures / group.at_risk
        corrected = increment - correction
        updated = total + corrected
        correction = (updated - total) - corrected
        total = updated
        increments.append(increment)
        cumulative.append(total)
    return NelsonAalen(
        estimate.times, tuple(increments), tuple(cumulative), estimate.followup_end
    )
