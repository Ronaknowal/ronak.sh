"""Word-level BPE and WordPiece mechanisms; Python 3.10+, standard library.

Words are already separated; no Unicode normalization is performed. BPE uses a
reserved </w> marker. WordPiece uses ## only on continuation vocabulary entries.
Run: python subword_tokenizers.py
"""

from collections import Counter, defaultdict
from dataclasses import dataclass
from heapq import heapify, heappop, heappush
from math import isfinite


def _word_counts(counts):
    if not counts or any(not w or "</w>" in w or w.startswith("##") or
                         not isfinite(f) or f <= 0 for w, f in counts.items()):
        raise ValueError("Supply nonempty words, positive finite weights and no reserved markers")
    return dict(sorted(counts.items()))


def _pairs(symbols):
    return Counter(zip(symbols, symbols[1:]))


def _replace_pair(symbols, pair, joined):
    result = []
    i = 0
    while i < len(symbols):
        if i + 1 < len(symbols) and (symbols[i], symbols[i + 1]) == pair:
            result.append(joined)
            i += 2
        else:
            result.append(symbols[i])
            i += 1
    return result


def apply_bpe(symbols, merges):
    """Rank-priority BPE over strings, with leftmost overlap ties.

    Neighbor links avoid repeatedly copying the remaining word. Stale heap
    entries are discarded using node versions. String concatenation still has
    a cost proportional to the created token's length.
    """
    symbols = list(symbols)
    n = len(symbols)
    if n < 2:
        return symbols
    ranks = {tuple(pair): rank for rank, pair in enumerate(merges)}
    previous = list(range(-1, n - 1))
    following = list(range(1, n)) + [-1]
    versions = [0] * n
    alive = [True] * n
    heap = []

    def offer(left):
        right = following[left] if left >= 0 else -1
        if right >= 0:
            rank = ranks.get((symbols[left], symbols[right]))
            if rank is not None:
                heappush(heap, (rank, left, right, versions[left], versions[right]))

    for left in range(n - 1):
        offer(left)
    while heap:
        _, left, right, left_version, right_version = heappop(heap)
        if (not alive[left] or not alive[right] or following[left] != right or
                versions[left] != left_version or versions[right] != right_version):
            continue
        symbols[left] += symbols[right]
        versions[left] += 1
        alive[right] = False
        following[left] = following[right]
        if following[right] >= 0:
            previous[following[right]] = left
        offer(previous[left])
        offer(left)
    return [symbol for index, symbol in enumerate(symbols) if alive[index]]


@dataclass
class BPEModel:
    alphabet: set
    merges: list
    end_marker: str | None = "</w>"

    @property
    def vocabulary(self):
        return self.alphabet | {a + b for a, b in self.merges}

    def encode_word(self, word):
        if self.end_marker and self.end_marker in word:
            raise ValueError("Reserved end marker in input")
        unseen = set(word) - self.alphabet
        if unseen:
            raise ValueError(f"Unseen characters: {sorted(unseen)}")
        return apply_bpe(list(word) + ([self.end_marker] if self.end_marker else []), self.merges)

    def encode(self, text):
        return [token for word in text.split() for token in self.encode_word(word)]

    def decode(self, tokens):
        if self.end_marker is None:
            return "".join(tokens)
        return "".join(tokens).replace(self.end_marker, " ").rstrip(" ")


def train_bpe(word_counts, num_merges, end_marker="</w>"):
    """Incremental pair-count training. Equal counts use lexicographic pair order.

    Index each pair's affected words. After a merge, recount only those words;
    lazy heap records avoid rescanning every candidate to find the next maximum.
    Supports positive real weights as well as integer corpus counts.
    """
    counts = _word_counts(word_counts)
    if not isinstance(num_merges, int) or num_merges < 0:
        raise ValueError("num_merges must be a nonnegative integer")
    words = {word: list(word) + ([end_marker] if end_marker else []) for word in counts}
    totals = Counter()
    owners = defaultdict(set)
    for word, symbols in words.items():
        for pair, count in _pairs(symbols).items():
            totals[pair] += counts[word] * count
            owners[pair].add(word)
    heap = [(-count, pair) for pair, count in totals.items()]
    heapify(heap)
    merges = []
    for _ in range(num_merges):
        while heap:
            negative_count, pair = heappop(heap)
            if owners[pair] and negative_count == -totals[pair]:
                break
        else:
            break
        touched = set()
        for word in sorted(owners[pair].copy()):
            before = _pairs(words[word])
            words[word] = _replace_pair(words[word], pair, "".join(pair))
            after = _pairs(words[word])
            for changed_pair in before.keys() | after.keys():
                totals[changed_pair] += counts[word] * (after[changed_pair] - before[changed_pair])
                if after[changed_pair]:
                    owners[changed_pair].add(word)
                else:
                    owners[changed_pair].discard(word)
                touched.add(changed_pair)
        merges.append(pair)
        for changed_pair in touched:
            if owners[changed_pair]:
                heappush(heap, (-totals[changed_pair], changed_pair))
    alphabet = {c for word in counts for c in word} | ({end_marker} if end_marker else set())
    return BPEModel(alphabet, merges, end_marker)


def train_wordpiece_proxy(word_counts, num_merges):
    """A documented count-ratio teaching reconstruction, not Google's trainer.

    Symbol marginals change after a merge, so this compact trainer recomputes
    all scores. Hugging Face's WordPiece trainer need not use this objective.
    """
    counts = _word_counts(word_counts)
    words = {w: [c if i == 0 else "##" + c for i, c in enumerate(w)] for w in counts}
    vocabulary = {t for symbols in words.values() for t in symbols} | {"[UNK]"}
    for _ in range(num_merges):
        marginals, pairs = Counter(), Counter()
        for word, symbols in words.items():
            marginals.update({t: n * counts[word] for t, n in Counter(symbols).items()})
            pairs.update({p: n * counts[word] for p, n in _pairs(symbols).items()})
        if not pairs:
            break
        pair = min(pairs, key=lambda p: (-pairs[p] / (marginals[p[0]] * marginals[p[1]]), p))
        joined = pair[0] + pair[1].removeprefix("##")
        words = {w: _replace_pair(s, pair, joined) for w, s in words.items()}
        vocabulary.add(joined)
    return vocabulary


class WordPiece:
    """Two prefix tries: word starts and continuations; whole-word UNK fallback."""

    def __init__(self, vocabulary, max_chars=100):
        self.roots = [{}, {}]
        self.max_chars = max_chars
        for token in sorted(vocabulary):
            if token == "[UNK]":
                continue
            continued = token.startswith("##")
            node = self.roots[int(continued)]
            for char in token[2:] if continued else token:
                node = node.setdefault(char, {})
            node[None] = token

    def encode_word(self, word):
        if len(word) > self.max_chars:
            return ["[UNK]"]
        result, start = [], 0
        while start < len(word):
            node = self.roots[int(start > 0)]
            end, match = start, None
            while end < len(word) and word[end] in node:
                node = node[word[end]]
                end += 1
                if None in node:
                    match = (end, node[None])
            if match is None:
                return ["[UNK]"]
            start, token = match
            result.append(token)
        return result


if __name__ == "__main__":
    corpus = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
    bpe = train_bpe(corpus, 10)
    print("merges", bpe.merges)
    print("lowest", bpe.encode_word("lowest"))
    print("round_trip", bpe.decode(bpe.encode("lower  newest")))
    wp = WordPiece({"[UNK]", "a", "ab", "##b", "##bc", "##c"})
    print("wordpiece_abc", wp.encode_word("abc"))
    print("wordpiece_abz", wp.encode_word("abz"))
