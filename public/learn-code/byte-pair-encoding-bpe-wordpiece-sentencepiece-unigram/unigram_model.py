"""Exact log-space Unigram inference, EM and bounded vocabulary pruning.

Standard library, Python 3.10+. Inputs are pre-separated words; this file does
not implement SentencePiece normalization, byte fallback or its optimized trainer.
"""

from collections import Counter
from math import exp, inf, isfinite, log, log1p
from random import Random


def logadd(a, b):
    if a == -inf:
        return b
    if b == -inf:
        return a
    high, low = max(a, b), min(a, b)
    return high + log1p(exp(low - high))


class Unigram:
    def __init__(self, probabilities):
        if not probabilities or any(not t or not isfinite(p) or p <= 0 for t, p in probabilities.items()):
            raise ValueError("Tokens must be nonempty and weights finite and positive")
        total = sum(probabilities.values())
        self.logp = {t: log(p / total) for t, p in probabilities.items()}
        self._build_trie()

    @classmethod
    def from_log_weights(cls, weights):
        model = cls.__new__(cls)
        normalizer = -inf
        for value in weights.values():
            normalizer = logadd(normalizer, value)
        model.logp = {t: value - normalizer for t, value in weights.items()}
        model._build_trie()
        return model

    def _build_trie(self):
        self.trie = {}
        for token in sorted(self.logp):
            node = self.trie
            for char in token:
                node = node.setdefault(char, {})
            node[None] = token

    def lattice(self, word):
        edges = [[] for _ in word]
        for start in range(len(word)):
            node = self.trie
            for end in range(start, len(word)):
                if word[end] not in node:
                    break
                node = node[word[end]]
                if None in node:
                    token = node[None]
                    edges[start].append((end + 1, token, self.logp[token]))
        return edges

    def forward_backward(self, word, excluded=None, log_counts=False):
        edges = self.lattice(word)
        n = len(word)
        forward = [-inf] * (n + 1)
        backward = [-inf] * (n + 1)
        forward[0] = backward[n] = 0.0
        for start in range(n):
            for end, token, score in edges[start]:
                if token != excluded:
                    forward[end] = logadd(forward[end], forward[start] + score)
        for start in range(n - 1, -1, -1):
            for end, token, score in edges[start]:
                if token != excluded:
                    backward[start] = logadd(backward[start], score + backward[end])
        if forward[n] == -inf:
            raise ValueError(f"No segmentation for {word!r}")
        expected = {}
        for start in range(n):
            for end, token, score in edges[start]:
                if token != excluded:
                    posterior = forward[start] + score + backward[end] - forward[n]
                    expected[token] = logadd(expected.get(token, -inf), posterior)
        return forward[n], expected if log_counts else {t: exp(p) for t, p in expected.items()}

    def encode_word(self, word):
        edges = self.lattice(word)
        best = [-inf] * (len(word) + 1)
        back = [None] * (len(word) + 1)
        best[0] = 0.0
        for start, outgoing in enumerate(edges):
            for end, token, score in outgoing:
                candidate = best[start] + score
                if candidate > best[end]:
                    best[end], back[end] = candidate, (start, token)
        if best[-1] == -inf:
            raise ValueError(f"No segmentation for {word!r}")
        tokens, end = [], len(word)
        while end:
            end, token = back[end]
            tokens.append(token)
        return list(reversed(tokens))

    def sample(self, word, seed=0):
        edges = self.lattice(word)
        backward = [-inf] * (len(word) + 1)
        backward[-1] = 0.0
        for start in range(len(word) - 1, -1, -1):
            for end, _, score in edges[start]:
                backward[start] = logadd(backward[start], score + backward[end])
        if backward[0] == -inf:
            raise ValueError(f"No segmentation for {word!r}")
        rng, tokens, start = Random(seed), [], 0
        while start < len(word):
            choices = edges[start]
            weights = [exp(score + backward[end] - backward[start]) for end, _, score in choices]
            end, token, _ = rng.choices(choices, weights=weights)[0]
            tokens.append(token)
            start = end
        return tokens


def em_step(model, word_counts):
    expected = {}
    likelihood = 0.0
    for word, frequency in word_counts.items():
        score, counts = model.forward_backward(word, log_counts=True)
        likelihood += frequency * score
        for token, count in counts.items():
            expected[token] = logadd(expected.get(token, -inf), log(frequency) + count)
    # On the supported seeded corpus every retained token occurs in some word.
    return Unigram.from_log_weights(expected), likelihood


def train_unigram(word_counts, target_size, max_piece_length=6, em_rounds=4):
    """Exact EM, then low marginal-mass-loss pruning; bounded small-corpus route.

    Character tokens are protected. Removal scores hold the old token weights
    fixed (mass lost from the lattice), then refit after removing a small batch.
    This explicit objective is not a reproduction of SentencePiece's trainer.
    """
    if not word_counts or any(not w or not isfinite(f) or f <= 0 for w, f in word_counts.items()):
        raise ValueError("Expected words with positive finite frequencies")
    chars = {c for word in word_counts for c in word}
    if not isinstance(target_size, int) or target_size < len(chars):
        raise ValueError("Target must hold the complete observed alphabet")
    seed = Counter()
    for word, frequency in word_counts.items():
        for start in range(len(word)):
            for end in range(start + 1, min(len(word), start + max_piece_length) + 1):
                seed[word[start:end]] += frequency
    model = Unigram(seed)
    history = []
    while True:
        for _ in range(em_rounds):
            model, likelihood = em_step(model, word_counts)
            history.append({"size": len(model.logp), "log_likelihood": likelihood})
        if len(model.logp) <= target_size:
            return model, history
        baseline = {w: model.forward_backward(w)[0] for w in word_counts}
        scores = {}
        for token in model.logp.keys() - chars:
            scores[token] = sum(f * (baseline[w] - model.forward_backward(w, excluded=token)[0])
                                for w, f in word_counts.items() if token in w)
        remove = min(len(model.logp) - target_size, max(1, len(scores) // 5))
        dropped = set(sorted(scores, key=lambda t: (scores[t], t))[:remove])
        model = Unigram.from_log_weights({t: p for t, p in model.logp.items() if t not in dropped})


if __name__ == "__main__":
    model = Unigram({"a": 0.2, "b": 0.2, "ab": 0.6})
    mass, counts = model.forward_backward("ab")
    print("segmentation_mass", round(exp(mass), 6))
    print("expected_counts", {t: round(p, 6) for t, p in sorted(counts.items())})
    print("best", model.encode_word("ab"))
    learned, history = train_unigram({"low": 5, "lower": 2, "newest": 6, "widest": 3}, 15)
    print("learned_size", len(learned.logp))
    print("lowest", learned.encode_word("lowest"))
