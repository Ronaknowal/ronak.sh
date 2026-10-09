"""Exact empirical duration moments with the ordinary NumPy array route.

Run: python contact_duration_moments.py bank-contact-durations.csv
Requires NumPy. The attributed CSV contains published UCI source-row IDs and
last-contact seconds. It contains no queue arrival/start/departure timestamps.
Time-weighted inspection treats these durations as an explicitly hypothetical
iid service law; it does not estimate actual bank queue occupancy or waiting.
CSV parsing/moments cost O(n); selecting the longest tenth costs O(n log n).
"""
import csv
import math
import sys
from fractions import Fraction as F
from pathlib import Path

import numpy as np


def read_durations(path):
    with Path(path).open(encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != ["source_row", "duration_seconds"]:
            raise ValueError("Use the attributed duration-only CSV schema")
        rows = list(reader)
    if not 1 <= len(rows) <= 100000:
        raise ValueError("Use 1 through 100000 duration records")
    values = []
    for index, row in enumerate(rows, 1):
        if row["source_row"] != str(index):
            raise ValueError("Source rows must retain consecutive published IDs")
        seconds = int(row["duration_seconds"])
        if row["duration_seconds"] != str(seconds) or not 1 <= seconds <= 86400:
            raise ValueError("Use integer durations of 1 through 86400 seconds")
        values.append(seconds)
    return values


def validate_values(values):
    if not 1 <= len(values) <= 100000 or any(type(x) is not int or not 1 <= x <= 86400 for x in values):
        raise ValueError("Use positive bounded integer durations")


def empirical_moments(values):
    validate_values(values)
    mean = F(sum(values), len(values))
    second = F(sum(x*x for x in values), len(values))
    variance = second - mean*mean
    busy_residual = second / (2*mean)
    longest_count = math.ceil(len(values) / 10)
    longest_share = F(sum(sorted(values, reverse=True)[:longest_count]), sum(values))
    return mean, second, variance, busy_residual, longest_count, longest_share


def duration_bins(values):
    validate_values(values)
    limits = [60, 120, 300, 600, 86400]
    grouped = []
    low = 0
    for high in limits:
        selected = [x for x in values if low < x <= high]
        grouped.append((low, high, len(selected), F(len(selected), len(values)),
                        F(sum(selected), sum(values))))
        low = high
    return grouped


def main(path):
    values = read_durations(path)
    mean, second, variance, residual, longest_count, longest_share = empirical_moments(values)
    array = np.asarray(values, dtype=np.float64)
    library = [array.mean(), np.mean(array*array), array.var(),
               np.dot(array, array)/(2*array.sum())]
    exact = [mean, second, variance, residual]
    np.testing.assert_allclose(library, [float(x) for x in exact], rtol=1e-12, atol=1e-10)
    bins = duration_bins(values)
    assert sum(row[2] for row in bins) == len(values)
    assert sum(row[3] for row in bins) == sum(row[4] for row in bins) == 1
    # An illustrative arrival rate is chosen, not fitted from these records.
    hypothetical_rate = F(1, 2) / mean
    hypothetical_wait = hypothetical_rate * second / (2*(1-hypothetical_rate*mean))
    print("records / duration range (seconds):", len(values), min(values), max(values))
    print("exact mean / second / variance:", *(str(x) for x in exact[:3]))
    print("NumPy mean / second / variance:", *(round(float(x), 6) for x in library[:3]))
    print("hypothetical busy inspection residual (seconds):", round(float(residual), 6))
    print("longest selected count / count share / duration share:", longest_count,
          round(longest_count/len(values), 6), round(float(longest_share), 6))
    print("duration bins: lower-exclusive / upper-inclusive / count / count share / time share")
    for low, high, count, mass, time_share in bins:
        print(low, high, count, round(float(mass), 6), round(float(time_share), 6))
    print("hypothetical arrival rate (per second) / load / mean wait (seconds):",
          round(float(hypothetical_rate), 9), .5, round(float(hypothetical_wait), 6))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python contact_duration_moments.py bank-contact-durations.csv")
    main(sys.argv[1])
