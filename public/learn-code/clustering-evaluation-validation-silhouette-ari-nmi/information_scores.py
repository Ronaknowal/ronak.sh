"""Aligned hard partitions: visible bit arithmetic and fixed-margin adjustment."""
from collections import Counter
from math import exp, fsum, lgamma, log, log2, sqrt
import argparse


def record_map(records):
    result = {}
    for identity, label in records:
        if identity in result:
            raise ValueError(f"Duplicate ID: {identity!r}")
        hash(label)
        result[identity] = label
    if not result:
        raise ValueError("Use a nonempty comparison set.")
    return result


def aligned_contingency(reference_records, candidate_records):
    reference, candidate = record_map(reference_records), record_map(candidate_records)
    if reference.keys() != candidate.keys():
        raise ValueError("Partitions must contain exactly the same unique IDs.")
    ids = list(reference)
    cells = Counter((reference[i], candidate[i]) for i in ids)
    rows = Counter(reference.values())
    columns = Counter(candidate.values())
    return ids, cells, rows, columns


def entropy(counts):
    total = sum(counts)
    if total <= 0:
        raise ValueError("Entropy needs positive total count.")
    return -fsum((count / total) * log2(count / total)
                 for count in counts if count > 0)


def information(cells, rows, columns):
    n = sum(rows.values())
    hu, hv = entropy(rows.values()), entropy(columns.values())
    mi = fsum((count / n) * log2(n * count / (rows[a] * columns[b]))
              for (a, b), count in cells.items() if count > 0)
    remaining_u, remaining_v = hu - mi, hv - mi
    tolerance = 1e-12 * max(1.0, abs(hu), abs(hv), abs(mi))
    if min(remaining_u, remaining_v, mi) < -tolerance:
        raise ArithmeticError("Material negative information quantity.")
    return hu, hv, max(0.0, mi), max(0.0, remaining_u), max(0.0, remaining_v)


def normalized_information(hu, hv, mi, method="arithmetic"):
    if hu == 0 and hv == 0:
        return 1.0
    if hu == 0 or hv == 0:
        return 0.0
    denominators = {"arithmetic": (hu + hv) / 2, "geometric": sqrt(hu * hv),
                    "min": min(hu, hv), "max": max(hu, hv)}
    if method not in denominators:
        raise ValueError("Unknown normalization.")
    return mi / denominators[method]


def log_choose(n, r):
    if r < 0 or r > n:
        return float("-inf")
    return lgamma(n + 1) - lgamma(r + 1) - lgamma(n - r + 1)


def expected_information(rows, columns):
    n = sum(rows.values())
    contributions = []
    for row_size in rows.values():
        for column_size in columns.values():
            lower, upper = max(0, row_size + column_size - n), min(row_size, column_size)
            for overlap in range(max(1, lower), upper + 1):
                probability = exp(log_choose(row_size, overlap)
                                  + log_choose(n - row_size, column_size - overlap)
                                  - log_choose(n, column_size))
                contribution = (overlap / n) * log2(n * overlap / (row_size * column_size))
                contributions.append(probability * contribution)
    return fsum(contributions)


def adjusted_information(cells, rows, columns, hu, hv, mi):
    # One occupied cell per row and column means identical partition relations.
    if len(cells) == len(rows) == len(columns):
        return 1.0
    expected = expected_information(rows, columns)
    denominator = (hu + hv) / 2 - expected
    if abs(denominator) <= 1e-12 * max(1.0, abs(hu), abs(hv), abs(expected)):
        raise ArithmeticError("Near-zero AMI denominator for nonequivalent partitions.")
    return (mi - expected) / denominator


def encoded_labels(records):
    codes = {}
    result = []
    for _, label in records:
        if label not in codes:
            codes[label] = len(codes)
        result.append(codes[label])
    return result


def main(core_only=False):
    from sklearn.metrics import (mutual_info_score, normalized_mutual_info_score,
                                 adjusted_mutual_info_score)
    fixtures = {"refinement": [0, 0, 1, 1, 2, 2, 3, 3],
                "cross": [0, 0, 1, 1, 0, 0, 1, 1]}
    reference = list(zip("ABCDEFGH", [0, 0, 0, 0, 1, 1, 1, 1]))
    for name, labels in fixtures.items():
        candidate = list(zip("ABCDEFGH", labels))
        ids, cells, rows, columns = aligned_contingency(reference, candidate)
        hu, hv, mi, remaining_u, remaining_v = information(cells, rows, columns)
        u, v = encoded_labels(reference), encoded_labels(candidate)
        nmi = normalized_information(hu, hv, mi)
        print(name, "cells", dict(cells))
        print(f"bits HU={hu:.9f} HV={hv:.9f} I={mi:.9f} U|V={remaining_u:.9f} V|U={remaining_v:.9f}")
        print("NMI", {method: round(normalized_information(hu, hv, mi, method), 9)
                      for method in ("arithmetic", "geometric", "min", "max")})
        if not abs(mi - mutual_info_score(u, v) / log(2)) < 1e-10:
            raise AssertionError("MI bit/nat correspondence failed.")
        if not abs(nmi - normalized_mutual_info_score(u, v, average_method="arithmetic")) < 1e-10:
            raise AssertionError("NMI correspondence failed.")
        if not core_only:
            expected = expected_information(rows, columns)
            ami = adjusted_information(cells, rows, columns, hu, hv, mi)
            print(f"expected MI bits={expected:.12f} AMI={ami:.9f}")
            if not abs(ami - adjusted_mutual_info_score(u, v, average_method="arithmetic")) < 1e-10:
                raise AssertionError("AMI correspondence failed.")
    print("ordinary correspondence: passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--core", action="store_true", help="Entropy/NMI output only.")
    main(parser.parse_args().core)
