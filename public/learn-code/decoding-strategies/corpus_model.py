"""Fit a fully visible word-bigram count model to the licensed Alice excerpt.

python corpus_model.py --data data --output counts.json
This is count estimation with additive smoothing, not neural model training.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import numpy as np

TRAIN_SHA = "93a207cd30b9e898896ede017e83dd1dd61056a24edbdafc8a5a81d2113514ed"
EVAL_SHA = "80b2a646a8645f3913838ccca8289c824159ed5db2c5ab427ed0600d640878db"


def read_data(directory):
    paths = [Path(directory) / name for name in ["alice-train.txt", "alice-heldout.txt"]]
    for path, expected in zip(paths, [TRAIN_SHA, EVAL_SHA]):
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Data hash mismatch: {path.name}")
    return [path.read_text(encoding="utf-8") for path in paths]


def tokenize(text):
    return re.findall(r"\w+|[^\w\s]", text.casefold(), flags=re.UNICODE)


def evaluation_prompts(text):
    rows = []
    for index, line in enumerate(text.splitlines()):
        if not line.strip() or all(char in "* \t" for char in line):
            continue
        rows.append({"id": f"heldout-line-{index}", "source": line,
                     "source_sha256": hashlib.sha256(line.encode("utf-8")).hexdigest(),
                     "prompt": " ".join(line.split()[:12])})
    if len(rows) != 4:
        raise ValueError("Expected the four prespecified substantive held-out lines")
    return rows


class CountModel:
    def __init__(self, vocabulary, counts, alpha=.1):
        self.vocabulary = vocabulary
        self.ids = {word: index for index, word in enumerate(vocabulary)}
        self.counts = {key: {int(i): int(n) for i, n in row.items()}
                       for key, row in counts.items()}
        self.alpha = alpha
        self.eos_id = self.ids["<EOS>"]

    @classmethod
    def fit(cls, text, alpha=.1):
        paragraphs = [tokenize(line) for line in text.splitlines() if line.strip()]
        vocabulary = ["<UNK>", "<EOS>", *sorted({word for row in paragraphs for word in row})]
        ids = {word: index for index, word in enumerate(vocabulary)}
        counts = defaultdict(Counter)
        for paragraph in paragraphs:
            context = "BOS"
            for word in [*paragraph, "<EOS>"]:
                token = ids[word]
                counts[context][token] += 1
                context = str(token)
        return cls(vocabulary, dict(counts), alpha)

    def encode(self, text):
        return [self.ids.get(word, 0) for word in tokenize(text)]

    def logits(self, prefix):
        context = str(prefix[-1]) if prefix else "BOS"
        values = np.full(len(self.vocabulary), self.alpha, dtype=np.float64)
        for token, count in self.counts.get(context, {}).items():
            values[token] += count
        # The normalizer is unnecessary in logits; softmax(log counts) supplies it.
        return np.log(values)

    def decode(self, tokens):
        return " ".join(self.vocabulary[token] for token in tokens if token != self.eos_id)

    def save(self, path):
        Path(path).write_text(json.dumps({"vocabulary": self.vocabulary,
                                         "counts": self.counts, "alpha": self.alpha},
                                        indent=2) + "\n", encoding="utf-8")

    @classmethod
    def load(cls, path):
        return cls(**json.loads(Path(path).read_text(encoding="utf-8")))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--output", type=Path, default=Path("counts.json"))
    args = parser.parse_args()
    train, evaluation = read_data(args.data)
    model = CountModel.fit(train)
    model.save(args.output)
    print(json.dumps({"vocabulary": len(model.vocabulary),
                      "contexts": len(model.counts),
                      "transitions": sum(sum(row.values()) for row in model.counts.values()),
                      "evaluation_prompts": evaluation_prompts(evaluation)}, indent=2))


if __name__ == "__main__":
    main()
