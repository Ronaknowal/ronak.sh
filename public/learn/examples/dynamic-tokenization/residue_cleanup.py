"""Occurrence trees, residue statistics, splitting and ranked re-merging.

Install: python -m pip install regex==2026.9.29 tokenizers==0.22.2
Run: python -X utf8 residue_cleanup.py --data wikitext_excerpt.json
The corpus experiment is small and uses declared thresholds, not paper defaults.
"""

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
import heapq
import json
import math
from pathlib import Path

from boundless_reference import BoundlessTokenizer, initial_groups, visible


@dataclass(frozen=True)
class Tree:
    piece: bytes
    left: object = None
    right: object = None


def ranked_merge(nodes, rules, excluded=frozenset(), joined_ranks=None):
    """Heap + linked live blocks. Preserve the actual parents of each occurrence.

    Explicit BPE matches a learned pair. A rank-only dictionary instead assigns
    a rank to the joined bytes; that variant can produce different parents.
    Stale heap entries are rejected using each live block's version.
    """
    count = len(nodes)
    if not count:
        return []
    nodes = list(nodes)
    following = list(range(1, count)) + [-1]
    previous = [-1] + list(range(count - 1))
    live = [True] * count
    version = [0] * count
    heap = []

    def offer(left):
        if left < 0 or not live[left]:
            return
        right = following[left]
        if right < 0:
            return
        pair = (nodes[left].piece, nodes[right].piece)
        joined = pair[0] + pair[1]
        rank = joined_ranks.get(joined) if joined_ranks is not None else rules.get(pair)
        if rank is not None and joined not in excluded:
            heapq.heappush(heap, (rank, left, right, version[left], version[right]))

    for position in range(count):
        offer(position)
    while heap:
        _, left, right, old_left, old_right = heapq.heappop(heap)
        if (not live[left] or not live[right] or following[left] != right
                or version[left] != old_left or version[right] != old_right):
            continue
        nodes[left] = Tree(nodes[left].piece + nodes[right].piece, nodes[left], nodes[right])
        version[left] += 1
        live[right] = False
        following[left] = following[right]
        if following[right] >= 0:
            previous[following[right]] = left
        offer(previous[left])
        offer(left)
    result = []
    position = 0
    while position >= 0:
        result.append(nodes[position])
        position = following[position]
    return result


def encode(text, rules):
    # Ordinary BPE cannot cross the pretoken boundaries in this study.
    return [ranked_merge([Tree(piece) for piece in group], rules)
            for group in initial_groups(text)]


def descendants(node):
    if node.left is not None:
        yield node.left.piece
        yield from descendants(node.left)
        yield node.right.piece
        yield from descendants(node.right)


def statistics(documents):
    final, consumed = Counter(), Counter()
    left_neighbors, right_neighbors = defaultdict(Counter), defaultdict(Counter)
    for groups in documents:
        roots = [node for group in groups for node in group]
        final.update(node.piece for node in roots)
        for node in roots:
            consumed.update(descendants(node))
        # Neighbors are final emitted pieces, never intermediate tree nodes.
        # BOS/EOS are explicit context categories, not vocabulary candidates.
        for position, node in enumerate(roots):
            left_neighbors[node.piece][roots[position - 1].piece if position else b"<BOS>"] += 1
            right_neighbors[node.piece][roots[position + 1].piece if position + 1 < len(roots) else b"<EOS>"] += 1
    return final, consumed, left_neighbors, right_neighbors


def entropy(counts):
    total = sum(counts.values())
    if not total:
        return None
    return -sum((count / total) * math.log2(count / total) for count in counts.values())


def decisions(vocabulary, documents, ratio_limit, entropy_limit):
    final, consumed, left, right = statistics(documents)
    records, excluded = [], set()
    for piece in sorted(vocabulary):
        first, second = final[piece], consumed[piece]
        ratio = first / (first + second) if first + second else None
        left_h, right_h = entropy(left[piece]), entropy(right[piece])
        diversity = min(left_h, right_h) if left_h is not None and right_h is not None else None
        remove = (len(piece) > 1 and ratio is not None and diversity is not None
                  and ratio <= ratio_limit and diversity <= entropy_limit)
        if remove:
            excluded.add(piece)
        if len(piece) > 1:
            records.append({"piece": visible(piece), "final_count": first, "descendant_count": second,
                            "ratio": ratio, "left_entropy_bits": left_h,
                            "right_entropy_bits": right_h, "minimum_entropy_bits": diversity,
                            "excluded": remove})
    return excluded, records


def split(node, excluded):
    if node.piece not in excluded:
        return [node]
    if node.left is None:
        raise ValueError("Base bytes cannot be excluded")
    return split(node.left, excluded) + split(node.right, excluded)


def cleanup(groups, excluded, rules):
    split_groups = [[child for root in group for child in split(root, excluded)] for group in groups]
    remerged = [ranked_merge(group, rules, excluded) for group in split_groups]
    return split_groups, remerged


def pieces(groups):
    return [visible(node.piece) for group in groups for node in group]


def corruption_fixture():
    pairs = [(b"c", b"o"), (b"co", b"r"), (b"r", b"u"), (b"p", b"t"),
             (b"pt", b"i"), (b"pti", b"o"), (b"ptio", b"n"),
             (b"ru", b"ption"), (b"ruption", b"s"),
             (b"cor", b"ru"), (b"corru", b"ption")]
    rules = {pair: rank for rank, pair in enumerate(pairs)}
    original = encode("corruptions", rules)
    split_groups, remerged = cleanup(original, {b"ruption", b"ruptions"}, rules)
    assert pieces(original) == ["cor", "ruptions"]
    assert pieces(split_groups) == ["cor", "ru", "ption", "s"]
    assert pieces(remerged) == ["corruption", "s"]
    from tokenizers import Tokenizer, models
    vocabulary = {piece: index for index, piece in enumerate(sorted(
        set("corruptions") | {a.decode() + b.decode() for a, b in pairs}))}
    library = Tokenizer(models.BPE(vocab=vocabulary,
                                  merges=[(a.decode(), b.decode()) for a, b in pairs]))
    assert library.encode("corruptions").tokens == pieces(original)
    return {"text": "corruptions", "excluded": ["ruption", "ruptions"],
            "original": pieces(original), "split_only": pieces(split_groups),
            "remerged": pieces(remerged), "hf_baseline_exact": True,
            "rules": [{"rank": rank, "left": a.decode(), "right": b.decode(),
                       "joined": (a + b).decode()} for rank, (a, b) in enumerate(pairs)]}


def rank_only_fixture():
    explicit = {(b"b", b"c"): 0, (b"a", b"b"): 1, (b"ab", b"c"): 3}
    joined = {a + b: rank for (a, b), rank in explicit.items()}
    raw = [Tree(bytes([byte])) for byte in b"abc"]
    strict = ranked_merge(raw, explicit)
    rank_only = ranked_merge(raw, {}, joined_ranks=joined)
    assert [node.piece for node in strict] == [b"a", b"bc"]
    assert rank_only[0].left.piece == b"a" and rank_only[0].right.piece == b"bc"
    return {"strict_pair_output": [visible(node.piece) for node in strict],
            "rank_only_output": [visible(node.piece) for node in rank_only],
            "recorded_parents": ["a", "bc"], "other_possible_parents": ["ab", "c"]}


def residue_fixture():
    pairs = [(b"i", b"n"), (b"in", b"c"), (b"inc", b"l"),
             (b"incl", b"u"), (b"inclu", b"d"), (b"includ", b"e"),
             (b"include", b"s"), (b"includ", b"in"), (b"includin", b"g")]
    rules = {pair: rank for rank, pair in enumerate(pairs)}
    # Deliberately constructed byte strings isolate ancestry and context counts.
    texts = ["xinclude"] * 12 + ["xincludes"] * 8 + ["xincluding"] * 10
    texts += ["xinclud?", "yinclud?"]
    documents = [encode(text, rules) for text in texts]
    vocabulary = {bytes([byte]) for byte in range(256)} | {a + b for a, b in pairs}
    excluded, records = decisions(vocabulary, documents, .2, 1.5)
    record = next(row for row in records if row["piece"] == "includ")
    assert record["final_count"] == 2 and record["descendant_count"] == 30
    assert record["left_entropy_bits"] == 1 and record["right_entropy_bits"] == 0
    assert b"includ" in excluded
    kept_root = encode("xincludes", rules)
    split_groups, _ = cleanup(kept_root, {b"includ"}, rules)
    assert pieces(split_groups) == pieces(kept_root)  # Its emitted parent survives.
    return {"constructed_strings": True, "includ": record,
            "descendant_final_words": {"include": 12, "includes": 8, "including": 10},
            "kept_parent_unchanged": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("wikitext_excerpt.json"))
    parser.add_argument("--ratio", type=float, default=0.2)
    parser.add_argument("--entropy-bits", type=float, default=1.5)
    parser.add_argument("--vocab-size", type=int, default=512)
    arguments = parser.parse_args()
    data = json.loads(arguments.data.read_text(encoding="utf-8"))
    tokenizer = BoundlessTokenizer(tau=1.1, allow_super=False).train(
        [row["text"] for row in data["train"]], arguments.vocab_size)
    rules = {rule.parts: rule.rank for rule in tokenizer.rules if rule.kind == "regular"}
    documents = [encode(row["text"], rules) for row in data["train"]]
    excluded, records = decisions(tokenizer.vocabulary, documents, arguments.ratio, arguments.entropy_bits)
    counts = [0, 0, 0]
    for row in data["test"]:
        original = encode(row["text"], rules)
        split_groups, remerged = cleanup(original, excluded, rules)
        for index, groups in enumerate([original, split_groups, remerged]):
            counts[index] += sum(map(len, groups))
            assert b"".join(node.piece for group in groups for node in group) == row["text"].encode("utf-8")
        assert all(node.piece not in excluded for group in remerged for node in group)
    print(json.dumps({"thresholds": {"ratio": arguments.ratio, "entropy_bits": arguments.entropy_bits},
                      "vocab_before": len(tokenizer.vocabulary), "excluded_count": len(excluded),
                      "test_original_split_remerged_tokens": counts,
                      "corruption_fixture": corruption_fixture(), "rank_only_fixture": rank_only_fixture(),
                      "residue_fixture": residue_fixture(),
                      "statistics": records}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
