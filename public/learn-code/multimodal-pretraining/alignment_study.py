"""Complete offline alignment experiment on real UCI optical digit measurements.

Captions are authored from class labels, so this is known-class learning.
Run: python alignment_study.py --output scratch-study.json
Requires NumPy, PyTorch, scikit-learn. No checkpoint or dataset download.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import sklearn
from sklearn.datasets import load_digits
import torch
from torch import nn
import torch.nn.functional as F

NAMES = "zero one two three four five six seven eight nine".split()
CAPTIONS = ["digit " + name for name in NAMES]
CHECKPOINTS = {0, 50, 100, 200, 300, 400}


def dataset():
    """Group before splitting; preserve original IDs and integer measurements."""
    raw, labels = load_digits(return_X_y=True)
    pixels = raw.astype(np.uint8)
    groups = {}
    for index, row in enumerate(pixels):
        digest = hashlib.sha256(row.tobytes()).hexdigest()
        groups.setdefault(digest, []).append(index)
    representatives = []
    for indices in groups.values():
        if len(set(labels[indices])) != 1:
            raise ValueError("conflicting class labels within an exact-image group")
        representatives.append(indices[0])
    rng = np.random.default_rng(17)
    splits = {name: [] for name in ("fit", "development", "assessment")}
    for digit in range(10):
        selected = [i for i in representatives if labels[i] == digit][:100]
        if len(selected) != 100:
            raise ValueError("the fixed study requires 100 unique images per class")
        selected = rng.permutation(selected).tolist()
        for name, lo, hi in (("fit", 0, 60), ("development", 60, 80),
                             ("assessment", 80, 100)):
            splits[name].extend(selected[lo:hi])
    return pixels, labels, splits


class AlignmentModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.image = nn.Sequential(nn.Linear(64, 64), nn.Tanh(), nn.Linear(64, 32))
        # ID0 = "digit"; IDs1..10 = English names. No unseen-word inference.
        self.words = nn.Embedding(11, 32)
        self.logit_scale = nn.Parameter(torch.tensor(math.log(2.)))

    def image_features(self, pixels):
        return F.normalize(self.image(pixels), dim=-1, eps=1e-12)

    def text_features(self):
        tokens = torch.stack([torch.zeros(10, dtype=torch.long), torch.arange(1, 11)], 1)
        return F.normalize(self.words(tokens).mean(1), dim=-1, eps=1e-12)

    def forward(self, pixels):
        return self.logit_scale.exp() * self.image_features(pixels) @ self.text_features().T


def paired_ce(scores):
    targets = torch.arange(len(scores))
    return (F.cross_entropy(scores, targets) + F.cross_entropy(scores.T, targets)) / 2


def rankings(scores, labels):
    """Rows are held-out images, columns are ten class captions."""
    predicted = scores.argmax(1)
    gallery = np.argsort(-scores, axis=0, kind="stable")
    relevance = labels[gallery] == np.arange(10)[None, :]
    return {
        "correct": int((predicted == labels).sum()), "count": int(len(labels)),
        "accuracy": float((predicted == labels).mean()),
        "predictions": predicted.tolist(), "scores": scores.tolist(),
        "precision_at_5_by_caption": relevance[:5].mean(0).tolist(),
        "first_relevant_rank_by_caption": (relevance.argmax(0) + 1).tolist(),
        "top5_gallery_rows_by_caption": gallery[:5].T.tolist(),
    }


def evaluate(score_function, pixels, labels, splits):
    result = {}
    for name in ("development", "assessment"):
        ids = np.array(splits[name])
        scores = score_function(pixels[ids] / 16.)
        result[name] = rankings(scores, labels[ids])
        result[name]["source_ids"] = ids.tolist()
    return result


def controls(score_function, pixels, labels, ids):
    ids = np.asarray(ids)
    shuffled = np.random.default_rng(71).permutation(len(ids))
    x = pixels[ids].astype(np.float32) / 16.
    blank = np.zeros_like(x)
    edited = x[:1].copy()
    edited[0, 36] = 1. if edited[0, 36] < .5 else 0.
    return {
        "blank": rankings(score_function(blank), labels[ids]),
        "shuffled": rankings(score_function(x[shuffled]), labels[ids]),
        "shuffle_order": shuffled.tolist(),
        "same_class_after_shuffle": int((labels[ids[shuffled]] == labels[ids]).sum()),
        "edited": {"source_id": int(ids[0]), "pixel_index":36,
                   "before": float(x[0, 36]), "after":float(edited[0, 36]),
                   "original_scores": score_function(x[:1])[0].tolist(),
                   "edited_scores": score_function(edited)[0].tolist()},
    }


def baseline(pixels, labels, splits):
    fit = np.array(splits["fit"])
    test = np.array(splits["assessment"])
    centers = np.stack([pixels[fit[labels[fit] == c]].mean(0) for c in range(10)])
    distances = ((pixels[test, None, :] - centers[None, :, :]) ** 2).sum(-1)
    predicted = distances.argmin(1)
    return {"nearest_centroid_correct":int((predicted == labels[test]).sum()),
            "assessment_count":len(test), "balanced_chance_accuracy":.1}


def save_report(path, report, pixels, labels, splits):
    report["data"] = {
        "source":"UCI Optical Recognition of Handwritten Digits / sklearn load_digits",
        "captions":CAPTIONS, "labels":labels.tolist(), "splits":splits,
        "pixel_sha256":hashlib.sha256(pixels.tobytes()).hexdigest(),
        "source_rows":len(pixels),
    }
    report["environment"] = {"torch":torch.__version__, "numpy":np.__version__,
                             "sklearn":sklearn.__version__}
    report["source_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    Path(path).write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=400)
    parser.add_argument("--output", default="scratch-study.json")
    args = parser.parse_args()
    torch.set_num_threads(1)
    torch.manual_seed(17)
    rng = np.random.default_rng(23)
    pixels, labels, splits = dataset()
    model = AlignmentModel()
    optimizer = torch.optim.AdamW(model.parameters(), lr=.003, weight_decay=.01)
    fit_by_class = [np.array([i for i in splits["fit"] if labels[i] == c]) for c in range(10)]
    logs = []

    def score_function(x):
        with torch.no_grad():
            return model(torch.tensor(x, dtype=torch.float32)).numpy()

    for step in range(args.steps + 1):
        if step in CHECKPOINTS or step == args.steps:
            evaluation = evaluate(score_function, pixels, labels, splits)
            # Same fixed ten fit examples at each checkpoint; not the sampled batch.
            fixed = [group[0] for group in fit_by_class]
            with torch.no_grad():
                fixed_loss = float(paired_ce(model(torch.tensor(pixels[fixed] / 16., dtype=torch.float32))))
            logs.append({"step":step, "fixed_fit_loss":fixed_loss,
                         "development_accuracy":evaluation["development"]["accuracy"],
                         "assessment_accuracy":evaluation["assessment"]["accuracy"]})
        if step == args.steps:
            break
        selected = [rng.choice(group) for group in fit_by_class]
        x = torch.tensor(pixels[selected] / 16., dtype=torch.float32)
        optimizer.zero_grad()
        loss = paired_ce(model(x))
        loss.backward()
        optimizer.step()
        with torch.no_grad():
            model.logit_scale.clamp_(0., math.log(100.))
    final = evaluate(score_function, pixels, labels, splits)
    report = {"model":"scratch MLP + mean word vectors", "seed":17, "sampler_seed":23,
              "steps":args.steps, "learning_rate":.003, "logs":logs, "final":final,
              "controls":controls(score_function, pixels, labels, splits["assessment"]),
              "baseline":baseline(pixels, labels, splits),
              "weights":{k:v.detach().tolist() for k,v in model.state_dict().items()},
              "caption_vectors":model.text_features().detach().tolist(),
              "assessment_pixels":pixels[splits["assessment"]].tolist()}
    save_report(args.output, report, pixels, labels, splits)
    print(json.dumps({"output":args.output, "checkpoints":logs,
                      "final_correct":final["assessment"]["correct"],
                      "count":final["assessment"]["count"], "baseline":report["baseline"]}, indent=2))


if __name__ == "__main__":
    main()
