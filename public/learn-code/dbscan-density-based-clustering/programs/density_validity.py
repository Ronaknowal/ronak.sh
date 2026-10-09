"""DBCV anatomy without a pair matrix; strict and named convention adapters.

The adapters implement the described distance/noise/fallback conventions with
this file's deterministic Prim tree. They do not promise identical upstream
MST tie serialization or every upstream degenerate numerical result.
"""
from dataclasses import dataclass
import math
from density_neighbourhoods import Neighbourhoods
from mutual_reachability_tree import Edge, prim_tree


@dataclass(frozen=True)
class ClusterValidity:
    label: object
    rows: tuple
    cores: tuple
    tree_edges: tuple
    degrees: tuple
    internal_rows: tuple
    sparseness: float
    separation: float
    separation_pair: tuple
    score: float
    weight: float
    contribution: float


@dataclass(frozen=True)
class ValidityReport:
    status: str
    convention: str
    score: object
    conditional_score: object
    coverage: float
    clusters: tuple
    detail: str


def validate_labels(labels, n, noise=-1):
    labels = tuple(labels)
    if len(labels) != n:
        raise ValueError("supply one label per input row")
    if any(type(label) not in (int, str) for label in labels):
        raise ValueError("labels must be integers or strings, never bool")
    if any(type(label) is int and label < 0 and label != noise for label in labels):
        raise ValueError("unsupported negative label/status")
    return labels


def all_points_cores(rows, distance, dimension, omit_zero=False):
    cores = []
    for row in rows:
        values = tuple(distance(row, other) for other in rows if other != row)
        positives = tuple(value for value in values if value > 0)
        if not omit_zero and len(positives) != len(values):
            raise ArithmeticError("DUPLICATE_POINTS")
        if not positives:
            if omit_zero:
                cores.append(0.0)
                continue
            raise ArithmeticError("NO_POSITIVE_DISTANCES")
        smallest = min(positives)
        scaled_sum = math.fsum((smallest / value) ** dimension for value in positives)
        value = smallest * math.exp((math.log(len(rows) - 1) - math.log(scaled_sum)) / dimension)
        if not math.isfinite(value):
            raise ArithmeticError("NONFINITE_ALL_POINTS_CORE")
        cores.append(value)
    return tuple(cores)


def _report(provider, labels, convention):
    if provider.metric != "euclidean":
        raise ValueError("this DBCV route declares finite Euclidean ambient geometry")
    n, dimension = len(provider.rows), len(provider.rows[0])
    noise = 0 if convention == "matlab" else -1
    labels = validate_labels(labels, n, noise)
    groups = {}
    for row, label in enumerate(labels):
        if label != noise:
            groups.setdefault(label, []).append(row)
    if convention == "matlab":
        groups = {label: rows for label, rows in groups.items() if len(rows) > 1}
    assigned = sum(map(len, groups.values()))
    coverage = assigned / n

    def diagnostic(status, detail, score=None):
        return ValidityReport(status, convention, score, None, coverage, (), detail)

    if not groups:
        return diagnostic("ALL_NOISE", "No assigned group supports a separation score.",
                          0.0 if convention != "strict" else None)
    if len(groups) == 1:
        return diagnostic("ONE_GROUP", "No other cluster defines density separation.",
                          0.0 if convention == "matlab" else None)
    if any(len(rows) == 1 for rows in groups.values()):
        return diagnostic("SINGLETON_CLUSTER", "An all-points core has denominator size-1.")
    if convention == "strict" and any(len(rows) == 2 for rows in groups.values()):
        return diagnostic("TWO_ROW_CLUSTER", "A two-row MST has no internal vertex.")

    def distance(i, j):
        try:
            value = provider.distance(i, j)
        except ValueError as error:
            raise ArithmeticError("NONFINITE_DISTANCE") from error
        if convention == "matlab":
            value *= value  # Prototype uses squared Euclidean lengths with ambient d.
        if not math.isfinite(value):
            raise ArithmeticError("NONFINITE_DISTANCE_POWER")
        return value

    try:
        if convention == "strict":
            for i in range(n):
                for j in range(i + 1, n):
                    if distance(i, j) == 0:
                        raise ArithmeticError("DUPLICATE_POINTS")
        anatomy = []
        for label, rows in groups.items():
            rows = tuple(rows)
            cores = all_points_cores(rows, distance, dimension, convention != "strict")
            edges, _ = prim_tree(len(rows), lambda i, j: max(cores[i], cores[j],
                                                            distance(rows[i], rows[j])))
            degrees = [0] * len(rows)
            for edge in edges:
                degrees[edge.left] += 1
                degrees[edge.right] += 1
            internal = tuple(i for i, degree in enumerate(degrees) if degree > 1)
            internal_edges = tuple(edge for edge in edges
                                   if degrees[edge.left] > 1 and degrees[edge.right] > 1)
            if convention == "strict" and (len(internal) < 2 or not internal_edges):
                return diagnostic("INSUFFICIENT_INTERNAL_VERTICES",
                                  "Strict DSC requires an internal edge, without fallback.")
            if not internal:
                internal = tuple(range(len(rows))) if convention == "matlab" else (0,)
            used_edges = internal_edges or edges  # Named compatibility fallback only.
            sparseness = max(edge.weight for edge in used_edges)
            anatomy.append({"label": label, "rows": rows, "cores": cores,
                            "edges": edges, "degrees": tuple(degrees),
                            "internal": internal, "sparseness": sparseness,
                            "separation": math.inf, "pair": ()})
        for left in range(len(anatomy)):
            for right in range(left + 1, len(anatomy)):
                a, b = anatomy[left], anatomy[right]
                separation, chosen_pair = math.inf, ()
                for i in a["internal"]:
                    for j in b["internal"]:
                        row_a, row_b = a["rows"][i], b["rows"][j]
                        candidate = max(a["cores"][i], b["cores"][j], distance(row_a, row_b))
                        if candidate < separation:
                            separation, chosen_pair = candidate, (row_a, row_b)
                if separation < a["separation"]:
                    a["separation"], a["pair"] = separation, chosen_pair
                if separation < b["separation"]:
                    b["separation"], b["pair"] = separation, chosen_pair[::-1]
        clusters = []
        for a in anatomy:
            denominator = max(a["sparseness"], a["separation"])
            if denominator == 0 or not math.isfinite(denominator):
                return diagnostic("UNDEFINED_SCORE_DENOMINATOR", "No finite positive score denominator.")
            score = (a["separation"] - a["sparseness"]) / denominator
            weight = len(a["rows"]) / n
            global_edges = tuple(Edge(e.weight, a["rows"][e.left], a["rows"][e.right])
                                 for e in a["edges"])
            clusters.append(ClusterValidity(a["label"], a["rows"], a["cores"], global_edges,
                a["degrees"], tuple(a["rows"][i] for i in a["internal"]),
                a["sparseness"], a["separation"], a["pair"], score, weight, score * weight))
        total = math.fsum(cluster.contribution for cluster in clusters)
        return ValidityReport("OK", convention, total, total / coverage,
                              coverage, tuple(clusters), "Original input n supplies every global weight.")
    except OverflowError:
        return diagnostic("NONFINITE_SCORE_ARITHMETIC", "Core/score arithmetic exceeds finite range.")
    except ArithmeticError as error:
        return diagnostic(str(error), "Geometry/arithmetic is outside the declared finite score domain.")


def density_validity(provider, labels):
    return _report(provider, labels, "strict")


def matlab_convention_report(provider, labels):
    """Noise0; drop singleton groups; squared distances; all-vertex tiny fallback.

    Selected policy adapter, not a bitwise replay of the MATLAB prototype.
    """
    return _report(provider, labels, "matlab")


def contrib_convention_report(provider, labels):
    """Noise-1; Euclidean distances; omitted zeros; first-vertex tiny fallback.

    Unsupported singleton/one-group calculations return a named diagnostic,
    rather than pretending this adapter reproduced upstream NaN/exception paths.
    """
    return _report(provider, labels, "contrib")


def ordinary_contrib_validity(provider, labels):
    """Actual optional library call; not executed by this teaching main."""
    if provider.metric != "euclidean":
        raise ValueError("ordinary DBCV comparison requires the declared Euclidean geometry")
    import numpy as np
    from importlib.metadata import version
    from hdbscan.validity import validity_index
    labels = validate_labels(labels, len(provider.rows))
    mapping = {label: i for i, label in enumerate(dict.fromkeys(l for l in labels if l != -1))}
    encoded = np.asarray([-1 if label == -1 else mapping[label] for label in labels], dtype=int)
    value, per_group = validity_index(np.asarray(provider.rows), encoded,
                                     metric="euclidean", per_cluster_scores=True)
    return {"library": "hdbscan", "version": version("hdbscan"), "label_mapping": mapping,
            "score": float(value), "per_group": per_group.tolist()}


def main():
    labels, ids = ("left",) * 4 + ("right",) * 4 + (-1,), tuple("ABCDEFGHJ")
    left = ((0, 0), (1, 0), (3, 1), (6, 1))
    for offset, expected in ((12, .6216883291276989),
                             (6, .366408996578), (2, -.041275994057)):
        right = ((offset, 4), (offset + 2, 4), (offset + 5, 6), (offset + 9, 6))
        provider = Neighbourhoods(left + right + ((8, 8),), ids)
        result = density_validity(provider, labels)
        assert result.status == "OK" and math.isclose(result.score, expected, abs_tol=1e-10)
        assert [c.internal_rows for c in result.clusters] == [(1, 2), (5, 6)]
        print("offset", offset, "coverage", result.coverage,
              "global", result.score, "conditional", result.conditional_score)
        for cluster in result.clusters:
            print(cluster.label, "internal", [ids[row] for row in cluster.internal_rows],
                  "DSC", cluster.sparseness, "DSPC", cluster.separation,
                  "pair", [ids[row] for row in cluster.separation_pair], "score", cluster.score)
    # These are diagnostic and convention examples, not a fitted clustering.
    small = Neighbourhoods(((0, 0), (1, 0), (4, 0), (5, 0)), tuple("abcd"))
    tiny_labels = (0, 0, 1, 1)
    print("strict two-row status", density_validity(small, tiny_labels).status)
    print("contrib tiny policy", contrib_convention_report(small, tiny_labels).score)
    print("MATLAB tiny policy", matlab_convention_report(small, (1, 1, 2, 2)).score)
    print("one-group status", density_validity(small, (0, 0, 0, 0)).status)
    print("all-noise status", density_validity(small, (-1, -1, -1, -1)).status)


if __name__ == "__main__":
    main()
