import argparse
import csv
from fractions import Fraction
import hashlib
import io
import math
from pathlib import Path
import numpy as np
from scipy.stats import norm

CANONICAL_SHA256 = "3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6"


def load_pairs(filename):
    raw = filename.read_bytes()
    if hashlib.sha256(raw).hexdigest() != CANONICAL_SHA256:
        raise ValueError("CSV identity does not match the complete paired source")
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8")))
    if reader.fieldnames != ["id", "drug1_extra_hours", "drug2_extra_hours"]:
        raise ValueError("CSV columns do not match the paired source")
    rows = [(int(row["id"]), Fraction(row["drug1_extra_hours"]), Fraction(row["drug2_extra_hours"])) for row in reader]
    if [row[0] for row in rows] != list(range(1, 11)):
        raise ValueError("Expected every ordered paired ID from 1 through 10")
    return rows


def summary(values):
    n = len(values)
    if n == 0:
        return 0, Fraction(0), Fraction(0)
    mean = sum(values) / n
    return n, mean, sum((x - mean) ** 2 for x in values)


def merge(left, right):
    na, ma, m2a = left
    nb, mb, m2b = right
    if na == 0:
        return right
    if nb == 0:
        return left
    delta = mb - ma
    n = na + nb
    return n, ma + delta * Fraction(nb, n), m2a + m2b + delta ** 2 * Fraction(na * nb, n)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("sleep-pairs.csv"))
    args = parser.parse_args()
    rows = load_pairs(args.data)
    differences = [b - a for _, a, b in rows]
    whole = summary(differences)
    n, mean, m2 = whole
    total = sum(differences)
    squares = sum(x * x for x in differences)
    assert (n, total, squares, mean, m2) == (10, Fraction(79, 5), Fraction(1929, 50), Fraction(79, 50), Fraction(1702, 125))
    print("id drug1_hours drug2_hours difference_hours")
    for (identity, a, b), difference in zip(rows, differences):
        print(identity, a, b, difference)
    print("n sum Q mean M2 mle_variance unbiased_variance")
    print(n, total, squares, mean, m2, m2 / n, m2 / (n - 1))
    print("split n_left mean_left M2_left n_right mean_right M2_right merged_n merged_mean merged_M2")
    for split in range(n + 1):
        left = summary(differences[:split])
        right = summary(differences[split:])
        combined = merge(left, right)
        assert combined == whole
        print(split, *left, *right, *combined)
    floats = np.array([float(x) for x in differences])
    assert math.isclose(float(np.mean(floats)), float(mean), rel_tol=0, abs_tol=2e-14)
    assert math.isclose(float(np.sum((floats - np.mean(floats)) ** 2)), float(m2), rel_tol=0, abs_tol=2e-14)
    direct = float(np.sum(norm.logpdf(floats, loc=1.5, scale=math.sqrt(2))))
    from_summary = -n / 2 * math.log(4 * math.pi) - float(m2 + n * (mean - Fraction(3, 2)) ** 2) / 4
    assert math.isclose(direct, from_summary, rel_tol=0, abs_tol=2e-13)
    comparison = direct - float(np.sum(norm.logpdf(floats, loc=0, scale=math.sqrt(2))))
    assert math.isclose(comparison, float(Fraction(249, 40)), rel_tol=0, abs_tol=2e-13)
    print("mu variance loglikelihood_direct loglikelihood_summary delta_vs_mu_zero")
    print(1.5, 2, *(f"{x:.15g}" for x in (direct, from_summary, comparison)))


if __name__ == "__main__":
    main()
