"""Offline descriptive process check on all recorded coal-explosion dates.

Run: python coal_process_diagnostics.py --csv coal.csv
Requires NumPy and SciPy. Calendar bins [year, year+1) use the explicitly
chosen window [1851,1963), not inferred true surveillance boundaries.
The early-window rate stays fixed when predicting the later window.
These comparisons do not establish reporting completeness, independence,
causal safety effects or adequacy of a homogeneous Poisson model.
"""
import argparse
import csv
import json
from pathlib import Path

import numpy as np
from scipy.stats import poisson


def load_dates(filename):
    with Path(filename).open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows or "date" not in rows[0]:
        raise ValueError("A nonempty CSV with a date column is required.")
    dates = np.asarray([float(row["date"]) for row in rows], dtype=float)
    if not np.isfinite(dates).all() or np.any(np.diff(dates) < 0):
        raise ValueError("Finite dates in their recorded chronological order are required.")
    return dates


def diagnose(dates, split_year=1907):
    dates = np.asarray(dates, dtype=float)
    if dates.ndim != 1 or not len(dates) or not np.isfinite(dates).all():
        raise ValueError("A finite nonempty one-dimensional date sequence is required.")
    if np.any(np.diff(dates) < 0):
        raise ValueError("Retain chronological order and every duplicate date.")
    if np.any((dates < 1851) | (dates >= 1963)):
        raise ValueError("Every date must be inside the chosen [1851,1963) window.")
    if isinstance(split_year, bool) or not isinstance(split_year, (int, np.integer)):
        raise ValueError("The fixed split year must be an integer.")
    if not 1851 < split_year < 1963:
        raise ValueError("Both temporal windows need positive exposure.")
    # Histogram keeps both records when the recorded dates are identical.
    boundaries = np.arange(1851, 1964)
    counts, _ = np.histogram(dates, bins=boundaries)
    cut = split_year - 1851
    training, held_out = counts[:cut], counts[cut:]
    training_rate = float(training.sum() / len(training))
    mean = float(counts.mean())
    sample_variance = float(counts.var(ddof=1))
    expected_later = training_rate * len(held_out)
    return {
        "record_count": int(len(dates)),
        "chosen_window": [1851, 1963],
        "annual_counts": counts.tolist(),
        "annual_mean": mean,
        "annual_sample_variance": sample_variance,
        "variance_to_mean": sample_variance / mean,
        "duplicate_adjacent_row_ids": [[int(i + 1), int(i + 2)]
                                       for i in np.flatnonzero(np.diff(dates) == 0)],
        "split_year": int(split_year),
        "training": {"events": int(training.sum()), "years": len(training),
                     "fitted_events_per_year": training_rate},
        "held_out": {"events": int(held_out.sum()), "years": len(held_out),
                     "observed_events_per_year": float(held_out.mean()),
                     "predicted_events_using_fixed_training_rate": expected_later,
                     "observed_empty_years": int(np.count_nonzero(held_out == 0)),
                     "predicted_empty_years": float(len(held_out) * poisson.pmf(0, training_rate))},
        # sf(3) is P(N >= 4) for an integer-valued one-year Poisson count.
        "fixed_fit_one_year_probabilities": {
            "no_event": float(poisson.pmf(0, training_rate)),
            "at_least_four": float(poisson.sf(3, training_rate))},
        "descriptive_only": True,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--split-year", type=int, default=1907)
    args = parser.parse_args()
    print(json.dumps(diagnose(load_dates(args.csv), args.split_year), indent=2, allow_nan=False))
