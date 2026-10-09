"""Directional split/merge diagnostics on explicitly aligned object records."""
from itertools import permutations
from math import comb, sqrt
import numpy as np
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import homogeneity_completeness_v_measure, fowlkes_mallows_score
from information_scores import aligned_contingency, information, encoded_labels


def tiny_matching_oracle(weights):
    # Padding makes unmatched assignments explicit. Factorial: toy matrices only.
    size = max(weights.shape)
    if size > 8:
        raise ValueError("Permutation oracle is limited to at most eight bins.")
    padded = np.zeros((size, size), dtype=int)
    padded[:weights.shape[0], :weights.shape[1]] = weights
    return max(sum(int(padded[row, column]) for row, column in enumerate(order))
               for order in permutations(range(size)))


def partition_diagnostics(reference, candidate):
    ids, cells, rows, columns = aligned_contingency(reference, candidate)
    n = len(ids)
    row_names, column_names = list(rows), list(columns)
    matrix = np.array([[cells.get((a, b), 0) for b in column_names] for a in row_names])
    hu, hv, mi, remaining_u, remaining_v = information(cells, rows, columns)
    homogeneity = 1.0 if hu == 0 else 1 - remaining_u / hu
    completeness = 1.0 if hv == 0 else 1 - remaining_v / hv
    v_measure = 2 * homogeneity * completeness / (homogeneity + completeness) if homogeneity + completeness > 0 else 0.0
    tp = sum(comb(count, 2) for count in cells.values())
    together_u, together_v = sum(comb(count, 2) for count in rows.values()), sum(comb(count, 2) for count in columns.values())
    fp, fn = together_v - tp, together_u - tp
    tn = comb(n, 2) - tp - fp - fn
    precision = tp / together_v if together_v else None
    recall = tp / together_u if together_u else None
    # sklearn FM returns zero when either partition has no together pair.
    fm = tp / sqrt(together_u * together_v) if together_u and together_v else 0.0
    matched_rows, matched_columns = linear_sum_assignment(matrix, maximize=True)
    matched = int(matrix[matched_rows, matched_columns].sum())
    return {"cells": matrix.tolist(), "row_names": row_names, "column_names": column_names,
            "TP": tp, "FP": fp, "FN": fn, "TN": tn,
            "pair_precision": precision, "pair_recall": recall, "FM": fm,
            "purity": float(matrix.max(axis=0).sum() / n),
            "homogeneity": homogeneity, "completeness": completeness, "V": v_measure,
            "matched": matched, "unmatched_errors": n - matched, "matched_accuracy": matched / n,
            "VI_bits": remaining_u + remaining_v}


if __name__ == "__main__":
    u = [0, 0, 0, 0, 1, 1, 1, 1]
    reference = list(zip("ABCDEFGH", u))
    for name, v in [("R refinement", [0, 0, 1, 1, 2, 2, 3, 3]),
                    ("S swap", [0, 0, 0, 1, 0, 1, 1, 1]),
                    ("singleton", list(range(8)))]:
        candidate = list(zip("ABCDEFGH", v))
        result = partition_diagnostics(reference, candidate)
        print(name, "U", u, "V", v)
        print(result)
        ordinary = homogeneity_completeness_v_measure(u, v)
        assert np.allclose([result["homogeneity"], result["completeness"], result["V"]], ordinary)
        assert np.isclose(result["FM"], fowlkes_mallows_score(u, v))
        assert result["matched"] == tiny_matching_oracle(np.asarray(result["cells"]))
    print("ordinary diagnostics and tiny exact matching correspondence: passed")
