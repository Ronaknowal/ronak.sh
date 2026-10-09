"""A small, explicit BoundlessBPE mechanism over nested UTF-8 byte groups.

Run: python -X utf8 boundless_reference.py --data wikitext_excerpt.json
Install: python -m pip install regex==2026.9.29
"""

import argparse
from collections import Counter
from dataclasses import dataclass
import json
from pathlib import Path

import regex

# Leading spaces belong to their word; digits and punctuation remain separate.
# This compact pattern is a teaching configuration, not the paper's full regex.
PRETOKEN_PATTERN = r" ?(?:\p{L}\p{M}*)+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+"
WORD_PATTERN = regex.compile(r"^(?=.*\p{L})(?:\p{L}\p{M}*|[ _'\u2019])+$")


def visible(piece):
    return piece.decode("utf-8", errors="backslashreplace").replace(" ", "␠")


def initial_groups(text, pattern=PRETOKEN_PATTERN):
    return [[bytes([byte]) for byte in chunk.encode("utf-8")]
            for chunk in regex.findall(pattern, text)]


def word_like(piece):
    try:
        return WORD_PATTERN.fullmatch(piece.decode("utf-8")) is not None
    except UnicodeDecodeError:
        return False


def merge_pair(tokens, pair):
    """Replace non-overlapping occurrences from left to right."""
    result = []
    index = 0
    while index < len(tokens):
        if index + 1 < len(tokens) and tuple(tokens[index:index + 2]) == pair:
            result.append(pair[0] + pair[1])
            index += 2
        else:
            result.append(tokens[index])
            index += 1
    return result


def pair_counts(tokens):
    counts = Counter()
    previous_selected = {}
    for position, pair in enumerate(zip(tokens, tokens[1:])):
        if pair[0] == pair[1] and previous_selected.get(pair) == position - 1:
            continue
        counts[pair] += 1
        previous_selected[pair] = position
    return counts


@dataclass(frozen=True)
class Rule:
    rank: int
    kind: str
    parts: tuple
    count: int = 0


def apply_rule(groups, rule):
    if rule.kind == "regular":
        return [merge_pair(tokens, rule.parts) for tokens in groups]
    if rule.kind == "delete":
        removed = rule.parts[0]
        return [[part for token in tokens
                 for part in ([bytes([b]) for b in token] if token == removed else [token])]
                for tokens in groups]
    result = []
    index = 0
    while index < len(groups):
        if (index + 1 < len(groups)
                and len(groups[index]) == len(groups[index + 1]) == 1
                and (groups[index][0], groups[index + 1][0]) == rule.parts):
            result.append([rule.parts[0] + rule.parts[1]])
            index += 2
        else:
            result.append(groups[index][:])
            index += 1
    return result


class BoundlessTokenizer:
    """Explicit corpus-state trainer; fixed-rule encoder.

    Training recomputes counts for each iteration so the mechanism is visible.
    The official trainer maintains indexed counts and separate word/superword
    states. This small joint-state trainer is not a benchmark replication.
    """

    def __init__(self, tau=0.9, allow_super=True, pattern=PRETOKEN_PATTERN):
        self.tau = tau
        self.allow_super = allow_super
        self.pattern = pattern
        self.rules = []
        self.vocabulary = {bytes([byte]) for byte in range(256)}

    def train(self, texts, vocab_size=320, max_operations=2000):
        documents = [initial_groups(text, self.pattern) for text in texts]
        while len(self.vocabulary) < vocab_size and len(self.rules) < max_operations:
            regular = Counter()
            super_pairs = Counter()
            singles = Counter()
            for groups in documents:
                for tokens in groups:
                    singles.update(tokens)
                    regular.update(pair_counts(tokens))
                if self.allow_super:
                    for left, right in zip(groups, groups[1:]):
                        if (len(left) == len(right) == 1
                                and word_like(left[0]) and word_like(right[0])):
                            super_pairs[(left[0], right[0])] += 1
            candidates = []
            for kind, counts in [("regular", regular), ("super", super_pairs)]:
                for pair, count in counts.items():
                    if pair[0] + pair[1] not in self.vocabulary:
                        # Count first, supermerge on a cross-kind tie, then bytes.
                        candidates.append((-count, 0 if kind == "super" else 1, pair, kind))
            if not candidates:
                break
            negative_count, _, pair, kind = min(candidates)
            count = -negative_count
            rule = Rule(len(self.rules), kind, pair, count)
            self.rules.append(rule)
            documents = [apply_rule(groups, rule) for groups in documents]
            self.vocabulary.add(pair[0] + pair[1])
            if kind == "regular":
                for token in dict.fromkeys(pair):
                    # Paper says "exceeds"; this reference uses strict >.
                    ios = count / singles[token]
                    if len(token) > 1 and ios > self.tau:
                        deletion = Rule(len(self.rules), "delete", (token,), count)
                        self.rules.append(deletion)
                        documents = [apply_rule(groups, deletion) for groups in documents]
                        self.vocabulary.discard(token)
        self.ids = {token: index for index, token in enumerate(sorted(self.vocabulary))}
        return self

    def encode_groups(self, text, trace=False):
        groups = initial_groups(text, self.pattern)
        history = [{"rank": -1, "kind": "bytes", "groups": groups}]
        # Ranks only increase. Earlier merges cannot run again after a deletion.
        for rule in self.rules:
            updated = apply_rule(groups, rule)
            if updated != groups:
                groups = updated
                history.append({"rank": rule.rank, "kind": rule.kind, "groups": groups})
        return (groups, history) if trace else groups

    def encode(self, text):
        return [self.ids[token] for group in self.encode_groups(text) for token in group]

    def decode(self, ids):
        reverse = {index: token for token, index in self.ids.items()}
        return b"".join(reverse[index] for index in ids).decode("utf-8")


def hand_trace():
    # Constructed saved rules illustrate the two boundary levels exactly.
    rules = [
        ("regular", (b" ", b"t")), ("regular", (b"h", b"e")),
        ("regular", (b" t", b"he")), ("regular", (b" ", b"o")),
        ("regular", (b" o", b"f")), ("super", (b" of", b" the")),
        ("regular", (b"T", b"i")), ("regular", (b"Ti", b"p")),
        ("regular", (b" ", b"h")), ("regular", (b" h", b"a")),
        ("regular", (b" ha", b"t")),
    ]
    tokenizer = BoundlessTokenizer()
    tokenizer.rules = [Rule(rank, kind, parts) for rank, (kind, parts) in enumerate(rules)]
    groups, history = tokenizer.encode_groups("Tip of the hat", trace=True)
    return {
        "text": "Tip of the hat",
        "pieces": [visible(token) for group in groups for token in group],
        "trace": [{"rank": row["rank"], "kind": row["kind"],
                   "groups": [[visible(token) for token in group] for group in row["groups"]]}
                  for row in history],
    }


def deletion_trace():
    tokenizer = BoundlessTokenizer()
    tokenizer.rules = [Rule(0, "regular", (b"a", b"b")),
                       Rule(1, "delete", (b"ab",)),
                       Rule(2, "regular", (b"b", b"c"))]
    groups, history = tokenizer.encode_groups("ab", trace=True)
    assert groups == [[b"a", b"b"]]
    assert [step["rank"] for step in history] == [-1, 0, 1]
    return {"text": "ab", "final_pieces": ["a", "b"],
            "applied_ranks": [-1, 0, 1], "earlier_merge_reapplied": False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("wikitext_excerpt.json"))
    parser.add_argument("--vocab-size", type=int, default=320)
    parser.add_argument("--tau", type=float, default=0.9)
    arguments = parser.parse_args()
    data = json.loads(arguments.data.read_text(encoding="utf-8"))
    training = [record["text"] for record in data["train"]]
    held_out = [record["text"] for record in data["test"]]
    report = {"hand_trace": hand_trace(), "deletion_trace": deletion_trace(),
              "vocab_budget": arguments.vocab_size, "configurations": []}
    for allow_super in [False, True]:
        tokenizer = BoundlessTokenizer(arguments.tau, allow_super).train(training, arguments.vocab_size)
        encoded = [tokenizer.encode(text) for text in held_out]
        assert all(tokenizer.decode(ids) == text for ids, text in zip(encoded, held_out))
        byte_count = sum(len(text.encode("utf-8")) for text in held_out)
        token_count = sum(map(len, encoded))
        report["configurations"].append({
            "supermerges_allowed": allow_super, "vocab_size": len(tokenizer.ids),
            "operations": len(tokenizer.rules),
            "supermerges": sum(rule.kind == "super" for rule in tokenizer.rules),
            "deletions": sum(rule.kind == "delete" for rule in tokenizer.rules),
            "test_bytes": byte_count, "test_tokens": token_count,
            "bytes_per_token": byte_count / token_count,
        })
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
