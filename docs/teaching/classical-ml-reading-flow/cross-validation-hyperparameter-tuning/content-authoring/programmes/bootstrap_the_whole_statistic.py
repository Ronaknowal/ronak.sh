"""A stated source-grouped select/refit functional on a resampled multiset."""
from collections import Counter
from itertools import product
import json
import numpy as np
from fold_fitted_pipeline import fit_knn, predict

X = np.arange(4, dtype=float)[:, None]
Y = [0, 0, 1, 1]


def occurrences(sample):
    sample = tuple(sample)
    if not sample or any(type(i) is not int or not 0 <= i < len(X) for i in sample):
        raise ValueError("Need a nonempty list of original integer IDs 0 through 3.")
    copies, seen = [], Counter()
    for source in sample:
        copies.append(seen[source])
        seen[source] += 1
    return sample, tuple(copies)


def ids_from_counts(counts):
    if len(counts) != 4 or any(type(value) is not int or value < 0 for value in counts):
        raise ValueError("Need four nonnegative integer multiplicities.")
    return [source for source, count in enumerate(counts) for _ in range(count)]


def mean_statistic(values, sample):
    ids, _ = occurrences(sample)
    if len(values) != len(X) or not np.isfinite(values).all():
        raise ValueError("Need four finite source values.")
    return sum(values[source] for source in ids) / len(ids)


def whole_statistic(sample, units=None):
    ids, copies = occurrences(sample)
    unit = ids if units is None else tuple(units)
    if len(unit) != len(ids):
        raise ValueError("Unit identities must align with occurrence positions.")
    source_units = {}
    for source, identity in zip(ids, unit):
        if source in source_units and source_units[source] != identity:
            raise ValueError("Every copy of an original source must retain the same sampling unit.")
        source_units[source] = identity
    distinct = sorted(set(unit))
    weights = [ids.count(i) for i in range(4)]
    common = {"sample": list(ids), "copies": list(copies), "weights": weights,
              "out_of_bag": [i for i, count in enumerate(weights) if count == 0]}
    if len(distinct) < 2:
        return {**common, "defined": False, "reason": "fewer than two distinct sampling units", "T": None}
    held_units = [set(distinct[parity::2]) for parity in [0, 1]]
    splits = []
    for selected in held_units:
        held = [i for i, value in enumerate(unit) if value in selected]
        train = [i for i, value in enumerate(unit) if value not in selected]
        splits.append((train, held))
    candidates = []
    for k in [1, 2]:
        if any(k > len(train) for train, held in splits):
            candidates.append({"k": k, "eligible": False, "reason": "k exceeds a training-occurrence count"})
            continue
        folds = []
        for train, held in splits:
            model = fit_knn(X[[ids[i] for i in train]], [Y[ids[i]] for i in train],
                            [ids[i] for i in train], k=k, copy_ordinals=[copies[i] for i in train], classes=(0, 1))
            prediction = predict(model, X[[ids[i] for i in held]])
            correct = sum(row["prediction"] == Y[ids[i]] for i, row in zip(held, prediction))
            folds.append({"train_positions": train, "held_positions": held,
                          "train_source_ids": [ids[i] for i in train], "held_source_ids": [ids[i] for i in held],
                          "state": model.preparation.__dict__, "predictions": prediction,
                          "correct": correct, "assessed": len(held)})
        candidates.append({"k": k, "eligible": True, "folds": folds,
                           "pooled": sum(row["correct"] for row in folds) / len(ids)})
    eligible = [row for row in candidates if row["eligible"]]
    winner = max(eligible, key=lambda row: row["pooled"])
    model = fit_knn(X[list(ids)], [Y[i] for i in ids], list(ids), k=winner["k"],
                    copy_ordinals=copies, classes=(0, 1))
    query = predict(model, [[1.5]])[0]
    resub = predict(model, X[list(ids)])
    return {**common, "defined": True, "candidates": candidates, "selected_k": winner["k"],
            "final_state": model.preparation.__dict__, "query": query, "T": query["fractions"][1],
            "resubstitution_accuracy": sum(row["prediction"] == Y[i] for row, i in zip(resub, ids)) / len(ids)}


def group_occurrences(row_groups, drawn_groups):
    if len(row_groups) != 4 or not drawn_groups or any(group not in row_groups for group in drawn_groups):
        raise ValueError("Need known original group IDs and four aligned source-row memberships.")
    ids, units = [], []
    for group in drawn_groups:
        for source, source_group in enumerate(row_groups):
            if source_group == group:
                ids.append(source)
                units.append(group)
    return ids, units


def wrong_occurrence_split_accuracy(sample):
    ids, copies = occurrences(sample)
    correct = 0
    for parity in [0, 1]:
        held = list(range(parity, len(ids), 2))
        train = list(range(1 - parity, len(ids), 2))
        model = fit_knn(X[[ids[i] for i in train]], [Y[ids[i]] for i in train],
                        [ids[i] for i in train], copy_ordinals=[copies[i] for i in train], classes=(0, 1))
        prediction = predict(model, X[[ids[i] for i in held]])
        correct += sum(row["prediction"] == Y[ids[i]] for row, i in zip(prediction, held))
    return correct / len(ids)


def main():
    for name, ids in [("default", [0, 0, 2, 2]), ("changed", [0, 1, 2, 3]),
                      ("permuted", [2, 0, 2, 0]), ("ineligible k2", [0, 0, 0, 2]),
                      ("undefined", [0, 0, 0, 0])]:
        print(name, json.dumps(whole_statistic(ids)))
    values = [1., 3., 5., 7.]
    sample = [0, 0, 2, 2]
    print("mean statistic", mean_statistic(values, sample), "numpy", float(np.mean(np.asarray(values)[sample])))
    from sklearn.utils import resample
    drawn = resample(np.arange(4), replace=True, n_samples=4, random_state=19).tolist()
    print("ordinary resampled IDs", drawn, "multiplicities", [drawn.count(i) for i in range(4)])
    counts = Counter()
    for ids in product(range(4), repeat=4):
        result = whole_statistic(ids)
        counts["undefined" if not result["defined"] else str(result["T"])] += 1
    print("ordered sampling law", dict(counts), "total", sum(counts.values()),
          "undefined mass", counts["undefined"] / 256, "defined conditional denominator", 256 - counts["undefined"])
    print("wrong occurrence split", wrong_occurrence_split_accuracy(sample))
    group_ids, units = group_occurrences(["A", "A", "B", "B"], ["A", "B"])
    print("group unit", group_ids, units, json.dumps(whole_statistic(group_ids, units)))


if __name__ == "__main__":
    main()
