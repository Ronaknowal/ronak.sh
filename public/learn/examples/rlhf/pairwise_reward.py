"""A complete pairwise linear reward fit and same-state gradient comparison.

python pairwise_reward.py --output pairwise-results.json
Requires numpy, torch and scikit-learn. Uses local records.json; no downloads.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from preference_records import ROOT, load_records


def words(text):
    return re.findall(r"\b\w+\b", text.casefold())


def vocabulary(records, limit=1024):
    counts = Counter(token for row in records for key in ("chosen", "rejected") for token in words(row[key]))
    return [word for word, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:limit]]


def features(prompt, response, vocab):
    tokens = words(response)
    counts = Counter(tokens)
    n = max(1, len(tokens))
    prompt_set = set(words(prompt))
    return np.array([counts[word] / n for word in vocab] +
                    [len(response.split()) / 45, sum(word in prompt_set for word in tokens) / n, 1.0], dtype=np.float64)


def matrices(records, vocab):
    chosen = np.stack([features(row["prompt"], row["chosen"], vocab) for row in records])
    rejected = np.stack([features(row["prompt"], row["rejected"], vocab) for row in records])
    return chosen, rejected


def sigmoid(x):
    return np.exp(-np.logaddexp(0, -np.asarray(x)))


def fit(differences, steps=400, rate=.5, penalty=.01):
    weights = np.zeros(differences.shape[1])
    trace = []
    for step in range(steps + 1):
        gaps = differences @ weights
        regularized = weights.copy()
        regularized[-1] = 0  # The common constant cannot affect pair differences.
        loss = np.logaddexp(0, -gaps).mean() + .5 * penalty * (regularized @ regularized)
        if step % 100 == 0 or step == steps:
            trace.append({"step": step, "objective": float(loss)})
        if step < steps:
            gradient = differences.T @ (sigmoid(gaps) - 1) / len(gaps) + penalty * regularized
            weights -= rate * gradient
    return weights, trace


def metrics(gaps):
    p = sigmoid(gaps)
    return {"pairs": len(p), "accuracy_ties_half": float(np.mean((gaps > 0) + .5 * (gaps == 0))),
            "bce_nats": float(np.logaddexp(0, -gaps).mean()),
            "brier": float(np.mean((1 - p) ** 2)), "mean_gap": float(np.mean(gaps))}


def gradient_check():
    delta = np.array([2., -2.])
    weights = np.array([.1, .2])
    analytic = (sigmoid(delta @ weights) - 1) * delta
    variable = torch.tensor(weights, requires_grad=True, dtype=torch.float64)
    loss = torch.nn.functional.softplus(-(variable * torch.tensor(delta)).sum())
    loss.backward()
    epsilon = 1e-6
    finite = np.array([(np.logaddexp(0, -(weights + epsilon * np.eye(2)[j]) @ delta) -
                        np.logaddexp(0, -(weights - epsilon * np.eye(2)[j]) @ delta)) / (2 * epsilon) for j in range(2)])
    assert np.allclose(analytic, variable.grad.numpy(), atol=1e-12)
    assert np.allclose(analytic, finite, atol=1e-8)
    return {"gap": float(delta @ weights), "analytic": analytic.tolist(),
            "torch": variable.grad.tolist(), "finite_difference": finite.tolist(),
            "next_weights": (weights - .1 * analytic).tolist()}


def run(records=None):
    records = load_records() if records is None else records
    train = [row for row in records if row["split"] == "train"]
    heldout = [row for row in records if row["split"] == "heldout"]
    vocab = vocabulary(train)
    train_a, train_b = matrices(train, vocab)
    eval_a, eval_b = matrices(heldout, vocab)
    difference = train_a - train_b
    weights, history = fit(difference)
    length_weights, length_history = fit(difference[:, -3:][:, [0, 2]])
    # Adding both signed rows produces ordinary binary logistic data. sklearn's
    # 1/(C*n) penalty matches lambda for its mean-loss convention; it optimizes
    # longer than our fixed-budget fit, so this is objective correspondence.
    signed = np.concatenate((difference, -difference))
    targets = np.concatenate((np.ones(len(difference)), np.zeros(len(difference))))
    library = LogisticRegression(C=1 / (.01 * len(signed)), fit_intercept=False, solver="lbfgs", max_iter=1000, tol=1e-10)
    library.fit(signed, targets)
    predictions = []
    for rows, a, b in ((train, train_a, train_b), (heldout, eval_a, eval_b)):
        for row, av, bv in zip(rows, a, b):
            gap = float((av - bv) @ weights)
            predictions.append({"row_id": row["row_id"], "split": row["split"],
                                "chosen_score": float(av @ weights), "rejected_score": float(bv @ weights),
                                "gap": gap, "chosen_probability": float(sigmoid(gap)),
                                "length_gap": len(row["chosen"].split()) - len(row["rejected"].split())})
    held = [row for row in predictions if row["split"] == "heldout"]
    bins, strata = [], []
    # Present each pair in both orientations. Binning only chosen-first rows
    # would make every observed label 1 by construction, not calibration.
    oriented = [(row["chosen_probability"], 1.) for row in held]
    oriented += [(1 - row["chosen_probability"], 0.) for row in held]
    for lo, hi in zip(np.arange(0, 1, .2), np.arange(.2, 1.01, .2)):
        values = [(p, label) for p, label in oriented if lo <= p < hi or hi > .999 and p == 1]
        bins.append({"lower": float(lo), "upper": float(hi), "oriented_count": len(values),
                     "mean_probability": float(np.mean([p for p, _ in values])) if values else None,
                     "label_fraction": float(np.mean([label for _, label in values])) if values else None})
    for name, predicate in (("chosen_shorter", lambda x: x < 0), ("same_length", lambda x: x == 0), ("chosen_longer", lambda x: x > 0)):
        gaps = np.array([row["gap"] for row in held if predicate(row["length_gap"])])
        strata.append({"name": name, **(metrics(gaps) if len(gaps) else {"pairs": 0})})
    return {"kind": "real released human-comparison prediction; no policy/human evaluation",
            "vocabulary": vocab, "weights": weights.tolist(), "gradient_check": gradient_check(),
            "train": metrics(difference @ weights), "heldout": metrics((eval_a - eval_b) @ weights),
            "length_baseline": {"train": metrics(difference[:, -3:][:, [0, 2]] @ length_weights),
                                "heldout": metrics((eval_a - eval_b)[:, -3:][:, [0, 2]] @ length_weights), "history": length_history},
            "sklearn_heldout": metrics((eval_a - eval_b) @ library.coef_[0]),
            "sklearn_weight_max_difference": float(np.max(np.abs(weights - library.coef_[0]))),
            "history": history, "probability_bins": bins, "length_strata": strata, "predictions": predictions}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "pairwise-results.json")
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: result[key] for key in ("train", "heldout", "length_baseline", "gradient_check")}, indent=2))


if __name__ == "__main__":
    main()
