"""What does the source backbone give a new task? A validation-only inspection.

Keep this file beside transfer-experiments.py and digits-400.csv. It reuses that
program's Backbone, Classifier, fit and score functions and its seeds, so the
source backbones are the same ones the main experiment adapts. Target test rows
are never read. Run with Python 3.12, torch 2.14 and NumPy 2.3.5:

    python feature-inspection.py
"""
import copy
import importlib.util
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn

directory = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("transfer_experiments",
                                              directory / "transfer-experiments.py")
tx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tx)

data = np.genfromtxt(directory / "digits-400.csv", delimiter=",", names=True, dtype=np.int64)
pixels = torch.tensor(np.column_stack([data[f"pixel_{i}"] for i in range(64)]),
                      dtype=torch.float32) / 16
digits = torch.tensor(data["digit"], dtype=torch.long)
groups = {int(d): np.flatnonzero(data["digit"] == d) for d in range(10)}
rows = {
    "source_train": np.concatenate([groups[d][:30] for d in range(5)]),
    "source_holdout": np.concatenate([groups[d][30:] for d in range(5)]),
    "target_train": np.concatenate([groups[d][:8] for d in range(5, 10)]),
    "target_validation": np.concatenate([groups[d][8:20] for d in range(5, 10)]),
}


def subset(name):
    labels = digits[rows[name]] - (5 if name.startswith("target") else 0)
    return pixels[rows[name]], labels


def nearest_centroid(train_x, train_y, test_x):
    # One mean vector per target digit; each validation row takes the closest mean
    # by ordinary (Euclidean) distance.
    centroids = torch.stack([train_x[train_y == k].mean(0) for k in range(5)])
    return torch.cdist(test_x, centroids).argmin(1)


def nearest_centroid_correct(train_x, train_y, test_x, test_y):
    return int((nearest_centroid(train_x, train_y, test_x) == test_y).sum())


def confusion(predicted, true):
    # Row = true new digit 5-9, column = digit whose mean was nearest.
    return {str(k + 5): [int(((true == k) & (predicted == j)).sum()) for j in range(5)]
            for k in range(5)}


def probe_correct(backbone, head, seed):
    # Same protocol as the main experiment's probe: frozen backbone, new head,
    # 300 full-batch Adam updates at rate 0.01.
    torch.manual_seed(200 + seed)
    model = tx.Classifier(copy.deepcopy(backbone).requires_grad_(False), copy.deepcopy(head))
    optimizer = torch.optim.Adam(model.head.parameters(), lr=.01)
    trace = tx.fit(model, *subset("target_train"), optimizer, steps=300,
                   validation=subset("target_validation"))
    return trace[-1]["validation"]


report = {"versions": {"torch": torch.__version__, "numpy": np.__version__}, "seeds": []}
for seed in (1, 2, 3):
    torch.manual_seed(seed)
    random_backbone = tx.Backbone()
    source = tx.Classifier(copy.deepcopy(random_backbone), nn.Linear(16, 5))
    tx.fit(source, *subset("source_train"), torch.optim.Adam(source.parameters(), lr=.01), steps=400)
    torch.manual_seed(100 + seed)
    target_head = nn.Linear(16, 5)
    train_x, train_y = subset("target_train")
    valid_x, valid_y = subset("target_validation")
    with torch.no_grad():
        views = {"raw_pixels": (train_x, valid_x),
                 "random_backbone": (random_backbone(train_x), random_backbone(valid_x)),
                 "learned_backbone": (source.backbone(train_x), source.backbone(valid_x))}
    record = {"seed": seed,
              "source_holdout": tx.score(source, *subset("source_holdout")),
              "nearest_centroid_correct_of_60": {name: nearest_centroid_correct(a, train_y, b, valid_y)
                                                 for name, (a, b) in views.items()},
              "probe_validation": {"random_backbone": probe_correct(random_backbone, target_head, seed),
                                   "learned_backbone": probe_correct(source.backbone, target_head, seed)}}
    # Nearest-mean confusion on the 16 features, and the same test after the lower layer only.
    record["nearest_centroid_confusion"] = {
        name: confusion(nearest_centroid(views[name][0], train_y, views[name][1]), valid_y)
        for name in ("random_backbone", "learned_backbone")}
    with torch.no_grad():
        lower = {"random_lower_layer": random_backbone.lower, "learned_lower_layer": source.backbone.lower}
        record["lower_layer_nearest_centroid_correct_of_60"] = {
            name: nearest_centroid_correct(torch.tanh(layer(train_x)), train_y,
                                           torch.tanh(layer(valid_x)), valid_y)
            for name, layer in lower.items()}
    with torch.no_grad():
        old_labels = source.head(views["learned_backbone"][1]).argmax(1)
    # Which old digit (0-4) does the unchanged source model call each new digit?
    record["source_head_votes"] = {str(k + 5): [int(((valid_y == k) & (old_labels == j)).sum())
                                                for j in range(5)] for k in range(5)}
    # Share of the 16 x 60 validation feature values within 0.05 of tanh's limits.
    record["saturated_share"] = {name: round(float((b.abs() > .95).float().mean()), 4)
                                 for name, (_, b) in views.items() if name != "raw_pixels"}
    if seed == 1:
        # Sixteen learned feature values for the first target training row of each digit.
        first = [int(np.flatnonzero(train_y.numpy() == k)[0]) for k in range(5)]
        with torch.no_grad():
            learned = source.backbone(train_x[first])
            untrained = random_backbone(train_x[first])
            called = source.head(learned).argmax(1)
        record["specimens"] = [{"source_id": int(data["source_id"][rows["target_train"][i]]),
                                "digit": int(train_y[i]) + 5,
                                "source_head_says": int(called[j]),
                                "learned_features": [round(v, 4) for v in learned[j].tolist()],
                                "random_features": [round(v, 4) for v in untrained[j].tolist()]}
                               for j, i in enumerate(first)]
    report["seeds"].append(record)
    print(seed, record["source_holdout"], record["nearest_centroid_correct_of_60"],
          {k: (round(v["ce"], 6), v["correct"]) for k, v in record["probe_validation"].items()})

(directory / "feature-inspection.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
