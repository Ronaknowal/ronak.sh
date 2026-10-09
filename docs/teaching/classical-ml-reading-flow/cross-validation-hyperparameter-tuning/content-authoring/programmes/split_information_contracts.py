"""Construct, inspect and align explicit information boundaries."""
import json
from itertools import combinations
import numpy as np
from fold_fitted_pipeline import validate_split


def group_held_splits(groups):
    groups = tuple(groups)
    for group in sorted(set(groups)):
        train = [i for i, value in enumerate(groups) if value != group]
        held = [i for i, value in enumerate(groups) if value == group]
        validate_split(train, held, len(groups))
        yield train, held


def available_split(events, available, decision, held, groups=None, unseen=False):
    events, available = np.asarray(events, float), np.asarray(available, float)
    if events.ndim != 1 or events.shape != available.shape or not np.isfinite(events).all() or not np.isfinite(available).all():
        raise ValueError("Need aligned finite event and availability times.")
    if np.any(available < events) or not np.isfinite(decision):
        raise ValueError("Availability cannot precede its event; decision time must be finite.")
    held = tuple(held)
    if not held or len(set(held)) != len(held) or any(type(i) is not int or not 0 <= i < len(events) for i in held):
        raise ValueError("Held positions must be nonempty, distinct and in bounds.")
    if unseen and (groups is None or len(groups) != len(events)):
        raise ValueError("The unseen-subject boundary needs aligned group IDs.")
    held_groups = set(groups[i] for i in held) if unseen else set()
    reasons, train = {}, []
    for i in range(len(events)):
        why = []
        if i in held:
            why.append("held")
        if events[i] >= decision:
            why.append("event not strictly earlier")
        if available[i] > decision:
            why.append("label not arrived")
        if unseen and groups[i] in held_groups:
            why.append("held subject")
        reasons[i] = why
        if not why:
            train.append(i)
    validate_split(train, held, len(events))
    return {"train": train, "held": list(held), "reasons": reasons}


def source_positions(outer_source_ids, inner_positions):
    ids, positions = tuple(outer_source_ids), tuple(inner_positions)
    if len(set(ids)) != len(ids) or len(set(positions)) != len(positions):
        raise ValueError("Source IDs and inner positions must each be distinct.")
    if any(type(i) is not int or not 0 <= i < len(ids) for i in positions):
        raise ValueError("Inner position is outside the outer-training subset.")
    return [ids[i] for i in positions]


def coverage(n, splits):
    counts = [0] * n
    for train, held in splits:
        validate_split(train, held, n)
        for i in held:
            counts[i] += 1
    return counts


def aligned_partial_oof(features, targets, predictions, counts):
    n = len(features)
    if any(len(column) != n for column in [targets, predictions, counts]):
        raise ValueError("All source-aligned columns need the same number of rows.")
    if any(count > 1 or count < 0 for count in counts):
        raise ValueError("One aligned prediction per row cannot represent repeated held turns.")
    if any((count == 0) != (prediction is None) for count, prediction in zip(counts, predictions)):
        raise ValueError("Absent turns must stay absent; covered turns need their actual prediction.")
    ids = [i for i, count in enumerate(counts) if count == 1]
    return {"source_ids": ids, "features": [features[i] for i in ids],
            "targets": [targets[i] for i in ids], "predictions": [predictions[i] for i in ids]}


def main():
    events = [0, 1, 2, 5, 8, 9]
    groups = ["A", "B", "A", "A", "B", "C"]
    for delay in [3, 4]:
        available = [time + delay for time in events]
        print("time", delay, json.dumps(available_split(events, available, 5, [3])))
    print("joint", json.dumps(available_split(events, [time + 3 for time in events], 5, [3], groups, True)))
    print("group held", list(group_held_splits(groups)))
    outer = [1, 3, 5, 7, 9, 11, 13, 15]
    print("mapped", source_positions(outer, [0, 2, 4, 6]))
    forward = [([0, 1, 2, 3], [4, 5]), ([0, 1, 2, 3, 4, 5], [6, 7])]
    counts = coverage(8, forward)
    predictions = [None, None, None, None, 0, 1, 1, 1]
    print("coverage", counts, "full OOF", all(value == 1 for value in counts))
    print("aligned", aligned_partial_oof(list(range(8)), [0, 0, 0, 0, 0, 1, 1, 1], predictions, counts))
    from sklearn.model_selection import (GroupKFold, StratifiedGroupKFold, TimeSeriesSplit,
                                         PredefinedSplit, RepeatedKFold, LeavePOut)
    x = np.arange(12)[:, None]
    y = np.tile([0, 1], 6)
    subject = np.repeat(np.arange(6), 2)
    for name, splitter in [("GroupKFold", GroupKFold(3)),
                           ("StratifiedGroupKFold", StratifiedGroupKFold(3))]:
        folds = list(splitter.split(x, y, subject))
        print(name, [(train.tolist(), held.tolist()) for train, held in folds],
              "group disjoint", all(not set(subject[train]) & set(subject[held]) for train, held in folds))
    print("TimeSeriesSplit", [(a.tolist(), b.tolist()) for a, b in TimeSeriesSplit(2, test_size=2, gap=1).split(x)])
    print("PredefinedSplit", [(a.tolist(), b.tolist()) for a, b in PredefinedSplit([-1, -1, 0, 0, 1, 1]).split()])
    repeated = list(RepeatedKFold(n_splits=3, n_repeats=2, random_state=7).split(x))
    print("RepeatedKFold coverage", coverage(12, repeated))
    print("LeavePOut count", len(list(LeavePOut(2).split(np.arange(5)))), "combination count", len(list(combinations(range(5), 2))))


if __name__ == "__main__":
    main()
