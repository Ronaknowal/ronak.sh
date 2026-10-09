"""A transparent three-class PRM baseline, from signed features to fixed SGD.

python prm_classifier.py --data data --out study
NumPy is the only framework dependency. This lexical model is not a pretrained
reasoner. Its frozen feature contract loses order and allows hash collisions.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

import numpy as np

BUCKETS = 512
CLASSES = ("invalid", "neutral", "progress")
LEXEMES = re.compile(r"[^\W\d_]+|\d+(?:\.\d+)?|[^\s]", re.UNICODE)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def signed_features(text):
    tokens = LEXEMES.findall(text)
    vector = np.zeros(BUCKETS, dtype=np.float64)
    for token in tokens:
        hashed = hashlib.sha256(token.encode("utf8")).digest()
        bucket = int.from_bytes(hashed[:8], "big") % BUCKETS
        sign = -1.0 if hashed[8] & 1 else 1.0
        vector[bucket] += sign
    if tokens:
        vector /= np.sqrt(len(tokens))
    return vector


def features(example):
    # The target, source address, answer and verifier score are deliberately absent.
    prefix = "\n".join([example["question"], *example["prefix_steps"]])
    return np.concatenate([signed_features(prefix),
                           signed_features(example["current_step"])])


def softmax(logits):
    shifted = logits - np.max(logits, axis=-1, keepdims=True)
    exponentials = np.exp(shifted)
    return exponentials / np.sum(exponentials, axis=-1, keepdims=True)


def cross_entropy(logits, targets):
    maximum = logits.max(axis=1)
    return maximum + np.log(np.exp(logits - maximum[:, None]).sum(axis=1)) - logits[
        np.arange(len(targets)), targets]


def objective_gradient(x, y, weights, bias, l2=0.001):
    if len(y) == 0:
        raise ValueError("No eligible targets: mean loss is undefined")
    logits = x @ weights + bias
    probabilities = softmax(logits)
    delta = probabilities.copy()
    delta[np.arange(len(y)), y] -= 1
    delta /= len(y)
    loss = cross_entropy(logits, y).mean() + l2 * np.square(weights).sum() / 2
    return float(loss), x.T @ delta + l2 * weights, delta.sum(axis=0)


def metrics(probabilities, targets, logits=None):
    if len(targets) == 0:
        return {"examples": 0, "accuracy": None, "cross_entropy": None,
                "brier": None, "confusion": None, "class_counts": [0, 0, 0]}
    predictions = probabilities.argmax(axis=1)
    confusion = np.zeros((3, 3), dtype=int)
    np.add.at(confusion, (targets, predictions), 1)
    # Brier sums the three squared class errors for each example, then averages.
    one_hot = np.eye(3)[targets]
    ce = (cross_entropy(logits, targets).mean() if logits is not None else
          -np.log(probabilities[np.arange(len(targets)), targets]).mean())
    return {"examples": len(targets), "accuracy": float((predictions == targets).mean()),
            "cross_entropy": float(ce),
            "brier": float(np.square(probabilities - one_hot).sum(axis=1).mean()),
            "confusion": confusion.tolist(),
            "class_counts": np.bincount(targets, minlength=3).tolist()}


def load_splits(directory):
    examples, matrices = {}, {}
    for name in ("train", "validation", "test"):
        path = Path(directory) / f"{name}.jsonl"
        examples[name] = [json.loads(line) for line in path.read_text(encoding="utf8").splitlines()]
        if not examples[name]:
            raise ValueError(f"{name} has no examples under this protocol")
        matrices[name] = (np.stack([features(e) for e in examples[name]]),
                          np.array([e["class_id"] for e in examples[name]], dtype=int))
    return examples, matrices


def fit(directory, output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    if (output / "results.json").exists():
        raise FileExistsError("Study result exists; use its receipt rather than refitting")
    examples, matrices = load_splits(directory)
    rng = np.random.default_rng(23)
    weights = rng.normal(0, 0.01, (1024, 3))
    bias = np.zeros(3)
    initial_weights = weights.copy()
    train_x, train_y = matrices["train"]
    prior = (np.bincount(train_y, minlength=3) + 1) / (len(train_y) + 3)
    baseline = {name: metrics(np.tile(prior, (len(y), 1)), y)
                for name, (_, y) in matrices.items()}
    checkpoints = []
    for update in range(161):
        if update in (0, 20, 40, 80, 160):
            measured = {}
            for name, (x, y) in matrices.items():
                logits = x @ weights + bias
                measured[name] = metrics(softmax(logits), y, logits)
            checkpoints.append({"update": update, "metrics": measured})
        if update < 160:
            _, dw, db = objective_gradient(train_x, train_y, weights, bias)
            weights -= 0.1 * dw
            bias -= 0.1 * db

    predictions = {}
    for name, (x, y) in matrices.items():
        probabilities = softmax(x @ weights + bias)
        predictions[name] = [
            {"source": e["source"], "problem_id": e["problem_id"],
             "class_id": int(target), "prediction": int(p.argmax()),
             "probabilities": p.tolist()}
            for e, target, p in zip(examples[name], y, probabilities)]
    inspect = {}
    ordered_test = sorted(enumerate(predictions["test"]), key=lambda pair: (
        pair[1]["source"]["record"], pair[1]["source"]["step"],
        pair[1]["source"]["alternative"]))
    for kind, correct in (("correct", True), ("failure", False)):
        found = next(((i, p) for i, p in ordered_test if
                      (p["prediction"] == p["class_id"]) == correct), None)
        inspect[kind] = (None if found is None else
                         {"example": examples["test"][found[0]], "output": found[1]})
    model = {"classes": list(CLASSES), "buckets_per_half": BUCKETS,
             "lexeme_regex": LEXEMES.pattern, "hash": "SHA256",
             "bucket": "first 8 digest bytes big-endian modulo 512",
             "sign": "digest byte 8 low bit: zero +1, one -1",
             "normalization": "signed counts / sqrt(number of lexemes) per half",
             "weights": weights.tolist(), "bias": bias.tolist(),
             "initial_weights": initial_weights.tolist(), "initial_bias": [0, 0, 0],
             "inspection": inspect}
    (output / "model.json").write_text(json.dumps(model, indent=2) + "\n", encoding="utf8")
    (output / "predictions.json").write_text(json.dumps(predictions, indent=2) + "\n", encoding="utf8")
    report = {"seed": 23, "updates": 160, "learning_rate": 0.1, "l2": 0.001,
              "study_fits": 1, "numpy": np.__version__, "python": sys.version,
              "source_sha256": digest(__file__), "prior": prior.tolist(),
              "baseline": baseline, "checkpoints": checkpoints,
              "inputs": {name: digest(Path(directory) / f"{name}.jsonl")
                         for name in examples},
              "outputs": {name: digest(output / name)
                          for name in ("model.json", "predictions.json")}}
    (output / "results.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(fit(args.data, args.out), indent=2))


if __name__ == "__main__":
    main()
