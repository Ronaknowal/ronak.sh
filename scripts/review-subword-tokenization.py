"""Independent review fixtures for the subword lesson; no network or model download."""

from datetime import datetime, timezone
import hashlib
from math import exp, isclose, log
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
TOPIC = "byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram"
ASSETS = ROOT / "public/learn-code" / TOPIC
DOCS = ROOT / "docs/teaching/tokenization" / TOPIC
sys.path.insert(0, str(ASSETS))

from subword_tokenizers import apply_bpe, train_bpe, WordPiece
from unigram_model import Unigram, em_step
from tokenizers import models


def main():
    # Ranked neighbor updates differ from greedy longest-prefix segmentation.
    ranked = apply_bpe(list("abca"), [("b", "c"), ("a", "b"), ("bc", "a")])
    assert ranked == ["a", "bca"]
    overlap = train_bpe({"aaaaa": 3}, 1)
    assert overlap.merges == [("a", "a")]
    assert overlap.encode_word("aaaaa") == ["aa", "aa", "a", "</w>"]
    # Five letters give four overlapping pairs but only two replacements.
    assert 3 * 4 == 12 and 3 * (6 - len(overlap.encode_word("aaaaa"))) == 6

    vocabulary = ["[UNK]", "ca", "##fé", "a", "ab", "##bc"]
    scratch = WordPiece(vocabulary)
    native = models.WordPiece({token: i for i, token in enumerate(vocabulary)}, unk_token="[UNK]")
    expected = {"café": ["ca", "##fé"], "cafe\u0301": ["[UNK]"], "abc": ["[UNK]"]}
    for word, pieces in expected.items():
        assert scratch.encode_word(word) == pieces
        assert [token.value for token in native.tokenize(word)] == pieces

    # Independent rational enumeration of a new three-path example.
    # a|a|b has 1/64, aa|b and a|ab each have 4/64: total 9/64.
    model = Unigram({"a": .25, "b": .25, "aa": .25, "ab": .25})
    mass, counts = model.forward_backward("aab")
    assert isclose(exp(mass), 9 / 64)
    numerators = {"a": 6, "b": 5, "aa": 4, "ab": 4}
    for token, numerator in numerators.items():
        assert isclose(counts[token], numerator / 9)
    updated, _ = em_step(model, {"aab": 1})
    for token, numerator in numerators.items():
        assert isclose(exp(updated.logp[token]), numerator / 19)
    pieces = model.encode_word("aab")
    assert isclose(sum(model.logp[token] for token in pieces), log(1 / 16))
    removed_mass, _ = model.forward_backward("aab", excluded="aa")
    assert isclose(exp(removed_mass), 5 / 64)

    files = [
        ROOT / "src/learn/data/topics/tokenization.jsx",
        ROOT / "src/learn/data/subword-tokenization-models.js",
        ROOT / "src/learn/components/lesson-labs/SubwordTokenizationLabs.jsx",
        ROOT / "src/learn/components/lesson-labs/subword-tokenization-lessons.css",
        ROOT / "src/learn/data/curriculum/blueprints" / f"{TOPIC}.js",
        DOCS / "design.md",
        DOCS / "native-output.json",
        DOCS / "author-numerical.json",
        Path(__file__),
    ] + sorted(path for path in ASSETS.iterdir() if path.is_file())
    receipt = {
        "topic": TOPIC,
        "reviewer": "independent multilingual-vocabulary agent; not the subword author",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "status": "passed",
        "checks": {
            "ranked_neighbor_result": ranked,
            "overlap_pair_occurrences": 12,
            "overlap_actual_replacements": 6,
            "wordpiece_native_unicode_and_greedy_counterexamples": expected,
            "three_path_mass": exp(mass),
            "three_path_expected_counts": counts,
            "em_updated_probabilities": {token: exp(value) for token, value in updated.logp.items()},
            "pruned_fixed_weight_mass": exp(removed_mass),
        },
        "limits": "Independent source/pedagogy review plus changed mathematical and native fixtures. Browser screenshots, copy/download behavior and full build are root integration evidence, not claimed here.",
        "sources": {
            path.relative_to(ROOT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in files
        },
    }
    destination = DOCS / "independent-review.json"
    destination.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"status": "passed", "receipt": destination.relative_to(ROOT).as_posix()}))


if __name__ == "__main__":
    main()
