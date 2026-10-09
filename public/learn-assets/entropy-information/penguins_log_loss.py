import csv
import math
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from scipy.stats import entropy


def fitted_distribution(counts, labels, alpha):
    denominator = sum(counts.values()) + alpha * len(labels)
    return {label: (counts[label] + alpha) / denominator for label in labels}


def main():
    with Path(__file__).with_name("penguins.csv").open(newline="", encoding="utf-8") as file:
        records = list(csv.DictReader(file))
    labels = ("Adelie", "Chinstrap", "Gentoo")
    islands = ("Biscoe", "Dream", "Torgersen")
    if any(row["species"] not in labels or row["island"] not in islands
           or row["year"] not in {"2007", "2008", "2009"} for row in records):
        raise ValueError("Unexpected or missing selected fields.")
    train = [row for row in records if row["year"] in {"2007", "2008"}]
    test = [row for row in records if row["year"] == "2009"]
    global_counts = Counter(row["species"] for row in train)
    island_counts = defaultdict(Counter)
    for row in train:
        island_counts[row["island"]][row["species"]] += 1
    alpha = 1.0
    global_q = fitted_distribution(global_counts, labels, alpha)
    conditional_q = {island: fitted_distribution(island_counts[island], labels, alpha)
                     for island in islands}
    print("train/test rows", len(train), len(test))
    print("training species counts", [global_counts[label] for label in labels])
    for island in islands:
        print("training island counts", island,
              [island_counts[island][label] for label in labels])

    models = {"global": lambda row: global_q,
              "island": lambda row: conditional_q[row["island"]]}
    for name, prediction in models.items():
        losses = [-math.log2(prediction(row)[row["species"]]) for row in test]
        correct = sum(max(labels, key=lambda label: prediction(row)[label]) == row["species"]
                      for row in test)
        mean_loss = math.fsum(losses) / len(test)
        print("test model / CE bits / accuracy / perplexity", name,
              round(mean_loss, 9), round(correct / len(test), 9), round(2**mean_loss, 9))

    weighted_h = weighted_kl = weighted_ce = 0.0
    for island in islands:
        rows = [row for row in test if row["island"] == island]
        counts = Counter(row["species"] for row in rows)
        p = np.array([counts[label] / len(rows) for label in labels])
        q = np.array([conditional_q[island][label] for label in labels])
        h = float(entropy(p, base=2))
        kl = float(entropy(p, q, base=2))
        ce = -math.fsum(float(a) * math.log2(float(b)) for a, b in zip(p, q) if a > 0)
        assert math.isclose(h + kl, ce, abs_tol=1e-12)
        weight = len(rows) / len(test)
        weighted_h += weight * h
        weighted_kl += weight * kl
        weighted_ce += weight * ce
        print("test island / counts / H CE KL bits", island,
              [counts[label] for label in labels], [round(x, 9) for x in (h, ce, kl)])
    row_loss = math.fsum(-math.log2(conditional_q[row["island"]][row["species"]])
                         for row in test) / len(test)
    assert math.isclose(weighted_ce, row_loss, abs_tol=1e-12)
    print("test weighted H CE KL bits", [round(x, 9) for x in
                                          (weighted_h, weighted_ce, weighted_kl)])


if __name__ == "__main__":
    main()
