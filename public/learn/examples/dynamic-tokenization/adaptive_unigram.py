"""Probabilistic segmentation plus a small ADAT-inspired probe/prune study.

Run: python -X utf8 adaptive_unigram.py --data wikitext_excerpt.json
Install: python -m pip install torch
"""

import argparse
from collections import Counter
import json
import math
from pathlib import Path
import random

import torch
from torch import nn
from torch.nn import functional as functional


def logsumexp(values):
    values = list(values)
    if not values:
        return -math.inf
    maximum = max(values)
    if maximum == -math.inf:
        return maximum
    return maximum + math.log(sum(math.exp(value - maximum) for value in values))


class Unigram:
    def __init__(self, probabilities):
        if not probabilities or any(not piece or weight <= 0 or not math.isfinite(weight)
                                    for piece, weight in probabilities.items()):
            raise ValueError("Provide nonempty pieces with positive finite weights")
        total = sum(probabilities.values())
        self.probabilities = {piece: weight / total for piece, weight in probabilities.items()}
        self.logs = {piece: math.log(probability) for piece, probability in self.probabilities.items()}
        self.trie = {}
        for piece in self.probabilities:
            node = self.trie
            for byte in piece:
                node = node.setdefault(byte, {})
            node[None] = piece

    def lattice(self, text):
        data = text.encode("utf-8") if isinstance(text, str) else text
        edges = [[] for _ in range(len(data) + 1)]
        for start in range(len(data)):
            node = self.trie
            for end in range(start, len(data)):
                if data[end] not in node:
                    break
                node = node[data[end]]
                if None in node:
                    piece = node[None]
                    edges[start].append((end + 1, piece, self.logs[piece]))
        return edges

    def forward_backward(self, edges):
        length = len(edges) - 1
        forward = [-math.inf] * (length + 1)
        forward[0] = 0.0
        for start in range(length):
            for end, _, score in edges[start]:
                forward[end] = logsumexp([forward[end], forward[start] + score])
        backward = [-math.inf] * (length + 1)
        backward[length] = 0.0
        for start in range(length - 1, -1, -1):
            backward[start] = logsumexp(score + backward[end] for end, _, score in edges[start])
        return forward, backward

    def encode(self, text, minimum_count=False):
        edges = self.lattice(text)
        length = len(edges) - 1
        best = [-math.inf] * (length + 1)
        previous = [None] * (length + 1)
        best[0] = 0.0
        for start in range(length):
            for end, piece, log_probability in edges[start]:
                candidate = best[start] + (-1.0 if minimum_count else log_probability)
                if candidate > best[end]:
                    best[end] = candidate
                    previous[end] = (start, piece)
        if best[length] == -math.inf:
            raise ValueError("The vocabulary has no complete path for this input")
        pieces = []
        position = length
        while position:
            position, piece = previous[position]
            pieces.append(piece)
        return list(reversed(pieces))

    def sample(self, text, generator, alpha=1.0):
        # Raise each path's weight to alpha, then sample its exact posterior.
        edges = [[(end, piece, alpha * score) for end, piece, score in row]
                 for row in self.lattice(text)]
        _, backward = self.forward_backward(edges)
        if backward[0] == -math.inf:
            raise ValueError("The vocabulary has no complete path for this input")
        pieces = []
        position = 0
        while position < len(edges) - 1:
            options = edges[position]
            weights = [math.exp(score + backward[end] - backward[position])
                       for end, _, score in options]
            end, piece, _ = generator.choices(options, weights=weights, k=1)[0]
            pieces.append(piece)
            position = end
        return pieces

    def fit_em(self, texts, iterations=2, pseudocount=0.01):
        for _ in range(iterations):
            expected = Counter({piece: pseudocount for piece in self.probabilities})
            for text in texts:
                edges = self.lattice(text)
                forward, backward = self.forward_backward(edges)
                log_partition = forward[-1]
                for start, row in enumerate(edges):
                    for end, piece, score in row:
                        expected[piece] += math.exp(forward[start] + score + backward[end] - log_partition)
            self.__init__(expected)
        return self

    def corpus_nll(self, texts):
        return -sum(self.forward_backward(self.lattice(text))[0][-1] for text in texts)

    def removal_cost(self, texts, piece):
        # Hold the original weights fixed for this deletion diagnostic. Remove
        # paths using this piece; re-normalization/EM happens after selection.
        reduced_nll = 0.0
        for text in texts:
            edges = [[edge for edge in row if edge[1] != piece] for row in self.lattice(text)]
            reduced_nll -= self.forward_backward(edges)[0][-1]
        return reduced_nll - self.corpus_nll(texts)


def seed_vocabulary(texts, size=384, max_length=4):
    counts = Counter({bytes([byte]): 0.01 for byte in range(256)})
    for text in texts:
        data = text.encode("utf-8")
        for start in range(len(data)):
            for length in range(1, min(max_length, len(data) - start) + 1):
                counts[data[start:start + length]] += 1
    candidates = sorted((p for p in counts if len(p) > 1), key=lambda p: (-counts[p], p))
    selected = [bytes([byte]) for byte in range(256)] + candidates[:size - 256]
    return Unigram({piece: counts[piece] for piece in selected})


class Probe(nn.Module):
    def __init__(self, vocabulary_size, width=24):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, width)
        self.recurrent = nn.GRU(width, 32, batch_first=True)
        self.output = nn.Linear(32, vocabulary_size)

    def forward(self, ids):
        hidden, _ = self.recurrent(self.embedding(ids))
        return self.output(hidden)


def ids_for(text, tokenizer, ids, bos, eos, sample_generator=None):
    pieces = (tokenizer.encode(text) if sample_generator is None
              else tokenizer.sample(text, sample_generator, alpha=0.5))
    return [bos] + [ids[piece] for piece in pieces] + [eos]


def train_probe(tokenizer, training, epochs=8, seed=13):
    torch.manual_seed(seed)
    generator = random.Random(seed)
    pieces = sorted(tokenizer.probabilities)
    ids = {piece: index for index, piece in enumerate(pieces)}
    bos, eos = len(ids), len(ids) + 1
    probe = Probe(len(ids) + 2)
    optimizer = torch.optim.Adam(probe.parameters(), lr=0.01)
    epoch_losses = []
    for _ in range(epochs):
        windows = []
        for text in training:
            sequence = ids_for(text, tokenizer, ids, bos, eos, generator)
            for start in range(0, len(sequence) - 1, 32):
                windows.append(sequence[start:start + 33])
        generator.shuffle(windows)
        total_loss = 0.0
        total_targets = 0
        for start in range(0, len(windows), 32):
            batch = windows[start:start + 32]
            inputs = torch.full((len(batch), 32), bos, dtype=torch.long)
            targets = torch.full((len(batch), 32), -100, dtype=torch.long)
            for row, sequence in enumerate(batch):
                length = len(sequence) - 1
                inputs[row, :length] = torch.tensor(sequence[:-1])
                targets[row, :length] = torch.tensor(sequence[1:])
            logits = probe(inputs)
            loss = functional.cross_entropy(logits.reshape(-1, len(ids) + 2), targets.reshape(-1))
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            count = int((targets != -100).sum())
            total_loss += float(loss.detach()) * count
            total_targets += count
        epoch_losses.append(total_loss / total_targets)
    return probe.eval(), ids, bos, eos, epoch_losses


@torch.no_grad()
def observe(probe, tokenizer, ids, bos, eos, texts):
    loss_sums = Counter()
    occurrences = Counter()
    total_nll = 0.0
    total_tokens = 0
    for text in texts:
        sequence = ids_for(text, tokenizer, ids, bos, eos)
        # Evaluation keeps each complete short source row's prefix; training windows reset state.
        logits = probe(torch.tensor([sequence[:-1]]))
        targets = torch.tensor(sequence[1:])
        losses = functional.cross_entropy(logits[0], targets, reduction="none")
        total_nll += float(losses.sum())
        total_tokens += len(targets)
        reverse = {index: piece for piece, index in ids.items()}
        for target, loss in zip(targets.tolist(), losses.tolist()):
            if target in reverse:  # BOS/EOS are never vocabulary-pruning candidates.
                piece = reverse[target]
                loss_sums[piece] += loss
                occurrences[piece] += 1
    byte_count = sum(len(text.encode("utf-8")) for text in texts)
    return loss_sums, occurrences, {
        "bytes": byte_count, "targets_including_eos": total_tokens,
        "nll_nats": total_nll, "bits_per_byte": total_nll / (byte_count * math.log(2)),
        "token_perplexity": math.exp(total_nll / total_tokens),
    }


def piece_label(piece):
    return piece.decode("utf-8", errors="backslashreplace").replace(" ", "␠")


def run_adaptation(training, feedback, test, epochs=8):
    torch.set_num_threads(1)
    tokenizer = seed_vocabulary(training)
    momentum = {}
    rounds = []
    for round_index, next_size in enumerate([352, 320, 320]):
        tokenizer.fit_em(training)
        probe, ids, bos, eos, training_losses = train_probe(tokenizer, training, epochs, seed=13 + round_index)
        losses, counts, feedback_metrics = observe(probe, tokenizer, ids, bos, eos, feedback)
        _, _, test_metrics = observe(probe, tokenizer, ids, bos, eos, test)
        priorities = {}
        for piece in tokenizer.probabilities:
            count = counts[piece]
            current = count / math.log1p(losses[piece]) if count else None
            # Unobserved is explicitly separate, not "easy with zero loss".
            previous = momentum.get(piece, 0.0)
            priorities[piece] = 0.5 * previous + current if current is not None else None
            momentum[piece] = priorities[piece] if priorities[piece] is not None else previous
        removable = [piece for piece in tokenizer.probabilities if len(piece) > 1]
        ranked = sorted(removable, key=lambda p: (priorities[p] is not None,
                        priorities[p] if priorities[p] is not None else -math.inf, p))
        removed = ranked[:max(0, len(tokenizer.probabilities) - next_size)]
        diagnostic = sorted(removable, key=lambda p: (-counts[p], p))[:8]
        rounds.append({
            "round": round_index, "vocab_before": len(ids), "vocab_after": len(ids) - len(removed),
            "training_epoch_nats_per_target": training_losses,
            "feedback": feedback_metrics, "test": test_metrics,
            "removed": [piece_label(piece) for piece in removed],
            "candidates": [{"piece": piece_label(p), "count": counts[p], "loss_sum": losses[p],
                            "mean_loss": losses[p] / counts[p] if counts[p] else None,
                            "momentum_priority": priorities[p]} for p in diagnostic],
        })
        tokenizer = Unigram({piece: weight for piece, weight in tokenizer.probabilities.items()
                             if piece not in set(removed)})
    return rounds


def hand_lattice():
    probabilities = {b"a": 0.1, b"b": 0.1, b"ab": 0.4,
                     b"aba": 0.2, b"bab": 0.19, b"abab": 0.01}
    tokenizer = Unigram(probabilities)
    return {
        "probabilities": {piece_label(p): value for p, value in probabilities.items()},
        "best_path": [piece_label(p) for p in tokenizer.encode("abab")],
        "minimum_count_path": [piece_label(p) for p in tokenizer.encode("abab", minimum_count=True)],
        "marginal_probability": math.exp(tokenizer.forward_backward(tokenizer.lattice("abab"))[0][-1]),
        "one_step_removal_cost_nats": tokenizer.removal_cost(["abab"], b"ab"),
        "samples_seed13": [[piece_label(p) for p in tokenizer.sample("abab", random.Random(seed), 0.5)]
                           for seed in range(13, 18)],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("wikitext_excerpt.json"))
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--output", type=Path)
    arguments = parser.parse_args()
    data = json.loads(arguments.data.read_text(encoding="utf-8"))
    texts = [[row["text"] for row in data[split]] for split in ["train", "validation", "test"]]
    report = {"fixture": {"rows": list(map(len, texts)), "seed": 13, "epochs": arguments.epochs},
              "hand_lattice": hand_lattice(), "rounds": run_adaptation(*texts, epochs=arguments.epochs)}
    output = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if arguments.output:
        arguments.output.write_text(output, encoding="utf-8")
    print(output, end="")


if __name__ == "__main__":
    main()
