"""Reverse KM censor-survival steps, with genuine failures removed before censors.

Static first-event records only: no delayed entry, strata or case weights.
Sorting costs O(n log n), grouping O(n), output state O(n). Queries cost O(q log n).
The curve has declared support through the last observed training time.
"""

from dataclasses import dataclass

import numpy as np

from survival_metric_inputs import observations


@dataclass(frozen=True)
class CensorSurvival:
    times: np.ndarray
    probabilities: np.ndarray

    def __call__(self, values):
        values = np.asarray(values, dtype=float)
        if not np.isfinite(values).all() or (values < 0).any() or (values > self.times[-1]).any():
            raise ValueError("Queries must be within nonnegative training follow-up support.")
        index = np.searchsorted(self.times, values, side="right")-1
        return np.where(index >= 0, self.probabilities[np.maximum(index, 0)], 1.)


def estimate_censoring(times, events):
    t, d = observations(times, events)
    order = np.argsort(t, kind="stable")
    ordered_times, ordered_events = t[order], d[order]
    starts = np.r_[0, np.flatnonzero(np.diff(ordered_times))+1]
    ends = np.r_[starts[1:], len(t)]
    unique_times = ordered_times[starts].copy()
    probabilities = np.empty(len(starts))
    survival = 1.
    for slot, (start, end) in enumerate(zip(starts, ends)):
        failures = int(ordered_events[start:end].sum())
        censors = int(end-start-failures)
        censor_risk = len(t)-int(start)-failures
        if censors:
            survival *= 1-censors/censor_risk
        probabilities[slot] = survival
    unique_times.setflags(write=False)
    probabilities.setflags(write=False)
    return CensorSurvival(unique_times, probabilities)
