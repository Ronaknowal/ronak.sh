"""Complementary subword checks: independent recount/list/lattice oracles.

Use the native tokenizers package; no networks, browser or learner assets written.
Run from repo root with python -B scripts/verify-subword-tokenization.py.
"""

from collections import Counter
from itertools import product
import json
from math import exp, isclose, log
from pathlib import Path
from random import Random
import sys

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram"
sys.path.insert(0, str(ASSETS))
from subword_tokenizers import apply_bpe, train_bpe, WordPiece
from unigram_model import Unigram, em_step, train_unigram
from tokenizers import models


def recount_train(counts, budget):
    words = {w: list(w) + ["</w>"] for w in counts}
    merges = []
    for _ in range(budget):
        pairs = Counter()
        for word, symbols in words.items():
            for a, b in zip(symbols, symbols[1:]):
                pairs[a, b] += counts[word]
        if not pairs:
            break
        chosen = min(pairs, key=lambda pair: (-pairs[pair], pair))
        merges.append(chosen)
        for word, symbols in words.items():
            output, i = [], 0
            while i < len(symbols):
                if tuple(symbols[i:i + 2]) == chosen:
                    output.append("".join(chosen))
                    i += 2
                else:
                    output.append(symbols[i])
                    i += 1
            words[word] = output
    return merges


def list_encode(symbols, merges):
    symbols = list(symbols)
    rank = {pair: i for i, pair in enumerate(merges)}
    while True:
        candidates = [(rank[pair], i) for i, pair in enumerate(zip(symbols, symbols[1:])) if pair in rank]
        if not candidates:
            return symbols
        _, i = min(candidates)
        symbols[i:i + 2] = [symbols[i] + symbols[i + 1]]


def paths(word, probabilities):
    if not word:
        return [(1.0, [])]
    result = []
    for token, probability in probabilities.items():
        if word.startswith(token):
            for suffix_weight, suffix in paths(word[len(token):], probabilities):
                result.append((probability * suffix_weight, [token] + suffix))
    return result


checks = Counter()
rng = Random(731)
binary_words = ["".join(chars) for size in range(1, 6) for chars in product("ab", repeat=size)]
records = []
for case in range(45):
    counts = {word: rng.randint(1, 8) / 4 for word in rng.sample(binary_words, 8)}
    budget = case % 17
    expected = recount_train(counts, budget)
    model = train_bpe(counts, budget)
    assert model.merges == expected
    checks["incremental_training_vs_full_recount"] += 1
    for word in binary_words:
        assert model.encode_word(word) == list_encode(list(word) + ["</w>"], expected)
        checks["rank_heap_vs_list_oracle"] += 1
    records.append({"counts": counts, "budget": budget, "merges": model.merges,
                    "queries": {word: model.encode_word(word) for word in ["aaa", "abab", "bbaba"]}})

for counts in [{"aaaa": 2}, {"é🙂": 1, "🙂é": 1, "aé": 1}, {"\ue000a": 1, "😀a": 1}]:
    model = train_bpe(counts, 8)
    assert model.merges == recount_train(counts, 8)
    checks["overlap_and_unicode_ties"] += 1
    records.append({"counts": counts, "budget": 8, "merges": model.merges,
                    "queries": {word: model.encode_word(word) for word in counts}})

vocabularies = [
    ["[UNK]", "a", "ab", "##bc"],
    ["[UNK]", "a", "b", "ab", "##a", "##b", "##ab", "##ba"],
    ["[UNK]", "a", "ab", "##b", "##bc", "##c"],
]
for vocabulary in vocabularies:
    native = models.WordPiece({t: i for i, t in enumerate(vocabulary)}, unk_token="[UNK]", max_input_chars_per_word=100)
    scratch = WordPiece(vocabulary)
    for word in binary_words + ["abc", "abz", "a" * 101, "", "🙂"]:
        assert scratch.encode_word(word) == [token.value for token in native.tokenize(word)]
        checks["wordpiece_native_inference"] += 1

for case in range(12):
    raw = {t: rng.uniform(.1, 1) for t in ["a", "b", "ab", "ba", "aa", "aba"]}
    total = sum(raw.values())
    probabilities = {t: p / total for t, p in raw.items()}
    model = Unigram(probabilities)
    native = models.Unigram([(t, log(p)) for t, p in probabilities.items()])
    for word in binary_words:
        exhaustive = paths(word, probabilities)
        mass = sum(weight for weight, _ in exhaustive)
        log_mass, actual_counts = model.forward_backward(word)
        assert isclose(exp(log_mass), mass, rel_tol=1e-12, abs_tol=1e-15)
        counts = Counter()
        for weight, segmentation in exhaustive:
            counts.update({t: count * weight / mass for t, count in Counter(segmentation).items()})
        for token in raw:
            assert isclose(actual_counts.get(token, 0), counts[token], rel_tol=1e-11, abs_tol=1e-12)
        best_weight = max(weight for weight, _ in exhaustive)
        scratch_pieces = model.encode_word(word)
        native_pieces = [t.value for t in native.tokenize(word)]
        for pieces in [scratch_pieces, native_pieces]:
            assert "".join(pieces) == word
            assert isclose(sum(log(probabilities[t]) for t in pieces), log(best_weight), abs_tol=1e-11)
        checks["unigram_exhaustive_mass_counts_viterbi_native"] += 1
    updated, old_likelihood = em_step(model, {"abab": 4, "aab": 2, "ba": 1})
    new_likelihood = sum(f * updated.forward_backward(w)[0] for w, f in {"abab": 4, "aab": 2, "ba": 1}.items())
    assert new_likelihood >= old_likelihood - 1e-10
    checks["exact_em_monotonicity"] += 1

rare = Unigram({"a": 1e-200, "b": 1})
log_mass, log_counts = rare.forward_backward("a" * 100, log_counts=True)
assert isclose(log_mass, 100 * log(1e-200), rel_tol=1e-12)
assert isclose(exp(log_counts["a"]), 100, rel_tol=1e-10)
checks["log_space_underflow_case"] += 1
example = Unigram({"a": .4, "b": .4, "ab": .2})
updated, _ = em_step(example, {"ab": 1})
assert isclose(exp(updated.logp["ab"]), 5 / 13)
assert isclose(exp(updated.logp["a"]), 4 / 13)
checks["changed_practice_exact_fraction"] += 1
initial = Unigram({"a": .2, "b": .2, "ab": .6})
samples = [initial.sample("ab", seed=seed) for seed in range(2000)]
whole = sum(result == ["ab"] for result in samples)
assert abs(whole / len(samples) - .9375) < .025
checks["seeded_posterior_sampling"] += 1
learned, history = train_unigram({"low": 5, "lower": 2, "newest": 6, "widest": 3}, 15)
assert len(learned.logp) == 15
assert set("lownewestrid").issubset(learned.logp)
checks["pruning_budget_and_alphabet"] += 1

print(json.dumps({"checks": dict(checks), "sampling": {"draws": 2000, "whole_piece": whole},
                  "browser_parity_cases": records}, indent=2, ensure_ascii=False))
