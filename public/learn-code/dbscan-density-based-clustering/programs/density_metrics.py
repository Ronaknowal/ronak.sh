"""General stable-ID alignment, pair counts and declared silhouette populations."""
from collections import Counter
from dataclasses import dataclass
import math
from silhouette_chunked import focal_silhouettes


@dataclass(frozen=True)
class Universe:
    ids: tuple
    rows: tuple

    def __post_init__(self):
        ids, rows = tuple(self.ids), tuple(tuple(float(x) for x in row) for row in self.rows)
        if len(ids) != len(rows) or any(type(i) not in (str, int) for i in ids):
            raise ValueError("one string/integer ID per feature row, never bool")
        if len(set(ids)) != len(ids):
            raise ValueError("duplicate observation ID")
        if rows and (not rows[0] or any(len(row) != len(rows[0]) for row in rows)):
            raise ValueError("features must form a rectangular nonzero-width table")
        if any(not math.isfinite(x) for row in rows for x in row):
            raise ValueError("features must be finite")
        object.__setattr__(self, "ids", ids)
        object.__setattr__(self, "rows", rows)


def label_map(universe, mapping):
    copied = dict(mapping)
    known = set(universe.ids)
    if any(type(i) not in (str, int) or i not in known for i in copied):
        raise ValueError("label map contains an undeclared observation ID")
    if any(type(label) not in (str, int) for label in copied.values()):
        raise ValueError("labels must be string/integer, never bool or NaN")
    if any(type(label) is int and label < -1 for label in copied.values()):
        raise ValueError("unsupported negative label/status; only -1 is noise")
    return copied


def choose_two(n):
    return n * (n - 1) // 2


def pair_agreement(first, second):
    first, second = tuple(first), tuple(second)
    if len(first) != len(second):
        raise ValueError("aligned label arrays must have equal length")
    if any(type(label) not in (str, int) or (type(label) is int and label < -1)
           for label in first + second):
        raise ValueError("unsupported nominal label")
    n = len(first)
    cells, row_counts, column_counts = Counter(zip(first, second)), Counter(first), Counter(second)
    total = choose_two(n)
    same_both = sum(choose_two(count) for count in cells.values())
    same_first = sum(choose_two(count) for count in row_counts.values())
    same_second = sum(choose_two(count) for count in column_counts.values())
    agreements = total - same_first - same_second + 2 * same_both
    if not 0 <= agreements <= total:
        raise ArithmeticError("inconsistent pair counts")
    denominator = total * (same_first + same_second) - 2 * same_first * same_second
    if n < 2:
        ari, ri, status = 1.0, 1.0, "insufficient_comparison"
    elif denominator == 0:
        if same_first == same_second == total:
            status = "both_all_one_group"
        elif same_first == same_second == 0:
            status = "both_all_singletons"
        else:
            raise ArithmeticError("unexpected zero adjusted-Rand denominator")
        ari, ri = 1.0, 1.0
    else:
        ari = 2 * (total * same_both - same_first * same_second) / denominator
        ri, status = agreements / total, "OK"
    return {"n": n, "pairs": total, "same_both": same_both,
            "same_first": same_first, "same_second": same_second,
            "agreements": agreements, "ari": ari, "ri": ri, "status": status}


def aligned_pair_report(universe, first, second, policy="noise_as_group"):
    if policy not in ("noise_as_group", "assigned_common"):
        raise ValueError("unknown pair population policy")
    first, second = label_map(universe, first), label_map(universe, second)
    common = tuple(i for i in universe.ids if i in first and i in second)
    retained = tuple(i for i in common if policy == "noise_as_group"
                     or (first[i] != -1 and second[i] != -1))
    counts = pair_agreement([first[i] for i in retained], [second[i] for i in retained])
    if len(retained) < 2:
        counts = {**counts, "scalar_convention": 1.0, "ari": None, "ri": None}
    return {**counts, "policy": policy, "universe_n": len(universe.ids),
            "first_available": len(first), "second_available": len(second),
            "common_ids": common, "compared_ids": retained,
            "coverage": len(retained) / len(universe.ids) if universe.ids else 0.0}


def silhouette_report(universe, mapping, policy="assigned_only", focal_ids=None, chunk_size=2):
    if policy not in ("noise_as_group", "assigned_only"):
        raise ValueError("unknown silhouette population policy")
    mapping = label_map(universe, mapping)
    retained = tuple(i for i in universe.ids if i in mapping
                     and (policy == "noise_as_group" or mapping[i] != -1))
    focal = retained if focal_ids is None else tuple(focal_ids)
    if any(type(i) not in (str, int) for i in focal) or len(set(focal)) != len(focal):
        raise ValueError("focal IDs must be unique string/integer IDs")
    if not set(focal) <= set(retained):
        raise ValueError("every focal ID must belong to the retained silhouette population")
    report = {"policy": policy, "universe_n": len(universe.ids), "available_n": len(mapping),
              "retained_ids": retained, "focal_ids": focal,
              "retention": len(retained) / len(universe.ids) if universe.ids else 0.0,
              "focal_coverage": len(focal) / len(retained) if retained else 0.0}
    k = len({mapping[i] for i in retained})
    if not 2 <= k < len(retained):
        return {**report, "status": "undefined_silhouette", "mean": None, "values": ()}
    original_position = {i: position for position, i in enumerate(universe.ids)}
    retained_position = {i: position for position, i in enumerate(retained)}
    values = focal_silhouettes([universe.rows[original_position[i]] for i in retained],
                              [mapping[i] for i in retained],
                              [retained_position[i] for i in focal], chunk_size)
    return {**report, "status": "OK", "values": tuple(map(float, values)),
            "mean": math.fsum(values) / len(values) if len(values) else None}


def main():
    from sklearn.metrics import adjusted_rand_score, rand_score, silhouette_samples
    import numpy as np
    universe = Universe(tuple("ABCDEFG"), tuple((x,) for x in (0, 1, 2, 7, 8, 9, 20)))
    first = dict(zip(universe.ids, ("L", "L", "L", "R", "R", "R", -1)))
    second = dict(reversed(list(zip(universe.ids, ("a", "a", "b", "b", "b", "b", -1)))))
    for policy in ("noise_as_group", "assigned_common"):
        report = aligned_pair_report(universe, first, second, policy)
        ids = report["compared_ids"]
        a, b = [first[i] for i in ids], [second[i] for i in ids]
        # Encoding avoids mixing string labels and integer noise in the library.
        encode = lambda values: [list(dict.fromkeys(values)).index(v) for v in values]
        assert math.isclose(report["ari"], adjusted_rand_score(encode(a), encode(b)))
        assert math.isclose(report["ri"], rand_score(encode(a), encode(b)))
        print(policy, "IDs", list(ids), "ARI", report["ari"], "RI", report["ri"],
              "coverage", report["coverage"])
    silhouette = silhouette_report(universe, first, focal_ids=("A", "D"))
    x = np.asarray(universe.rows[:6])
    ordinary = silhouette_samples(x, [0, 0, 0, 1, 1, 1])
    np.testing.assert_allclose(silhouette["values"], ordinary[[0, 3]])
    print("assigned focal IDs", list(silhouette["focal_ids"]),
          "scores", list(silhouette["values"]), "retention", silhouette["retention"],
          "focal coverage", silhouette["focal_coverage"])
    none = aligned_pair_report(universe, {"A": -1}, {"A": -1}, "assigned_common")
    assert none["ari"] is None and none["status"] == "insufficient_comparison"
    print("empty assigned comparison", none["status"], "ARI", none["ari"])
    assert pair_agreement([0, 1], ["a", "b"])["status"] == "both_all_singletons"


if __name__ == "__main__":
    main()
