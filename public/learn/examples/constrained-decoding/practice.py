"""Fresh worked examples for all fourteen practice tasks; no model calls."""

import json
from fractions import Fraction as F
from automata import compile_regular, sequence, optional, literal, decimal_dfa
from token_index import TokenIndex
from nested_parser import NestedMatcher
from conditioning import compare
from costs import amortization


def main():
    answers = []
    answers.append(
        {
            "task": 1,
            "first_failures": [
                "schema: missing field",
                "source: wrong measurement",
                "syntax: unquoted string",
            ],
        }
    )
    dfa = decimal_dfa()
    answers.append(
        {
            "task": 2,
            "prefixes": [
                {
                    "text": s,
                    "viable": dfa.advance(0, s.encode()) != -1,
                    "accepting": dfa.accepts(s.encode()),
                }
                for s in ["8", "8.", ".8", "8.0"]
            ],
        }
    )
    index = TokenIndex(dfa, [b"23", b"2x", b".", None])
    allowed = index.next_tokens(dfa.advance(0, b"5."))
    assert sorted(allowed) == [0]
    answers.append({"task": 3, "allowed_ids": sorted(allowed)})
    answers.append({"task": 4, "q": ["0", "3/4", "0", "1/4"], "removed_mass": "3/5"})
    answers.append(
        {"task": 5, "topk_first": {"1": "1"}, "grammar_first": {"1": "3/4", "3": "1/4"}}
    )
    optional_dfa = compile_regular(sequence(optional(literal("a")), literal("b")))
    accepted = [
        s for s in ["", "a", "b", "ab", "aab"] if optional_dfa.accepts(s.encode())
    ]
    assert accepted == ["b", "ab"]
    answers.append({"task": 6, "accepted": accepted})
    words = [b"do", b"dog", b"dot", b"cat"]
    distinct_prefixes = {word[:n] for word in words for n in range(1, len(word) + 1)}
    assert sum(map(len, words)) == 11 and len(distinct_prefixes) == 7
    answers.append({"task": 7, "naive_bytes": 11, "trie_edges": 7})
    pound = compile_regular(literal("£"))
    assert pound.advance(pound.advance(0, b"\xc2"), b"\xa3") in pound.accepting
    assert pound.advance(0, b"\xa3\xc2") == -1
    answers.append(
        {"task": 8, "valid_split_hex": ["c2", "a3"], "invalid_reversed": True}
    )
    nested, depths = NestedMatcher(), []
    for byte in b"[[4],5]":
        assert nested.accept(bytes([byte]))
        depths.append(len(nested.frames()))
    assert depths == [1, 2, 2, 1, 1, 1, 0] and nested.complete
    answers.append({"task": 9, "depths": depths})
    origin = NestedMatcher()
    assert origin.accept(b"[6,")
    left, right = origin.fork(), origin.fork()
    assert left.accept(b"[1]") and right.accept(b"2")
    assert left.fork().accept(b"]") and right.fork().accept(b"]")
    left.rollback()
    assert (
        left.snapshot() == origin.snapshot() and right.snapshot() != origin.snapshot()
    )
    answers.append(
        {
            "task": 10,
            "both_can_close": True,
            "rollback_restores_whole_token_boundary": True,
        }
    )
    distribution = compare(["3/10", "7/10"], ["4/5", "1/5"])
    assert distribution["global"] == (F(12, 19), F(7, 19))
    answers.append({"task": 11, **distribution})
    answers.append(
        {
            "task": 12,
            "cap_complete": "validate independently; no EOS observed",
            "cap_incomplete": "do not treat as a complete record",
        }
    )
    answers.append(
        {
            "task": 13,
            "exact_requested": str(F(6, 10)),
            "completed_only": str(F(6, 8)),
            "errors": 2,
        }
    )
    cost = amortization(3, compile_ms=15, base_ms=30, mask_ms=2, failure=0.2)
    assert abs(cost["strictly_faster_after_requests"] - 30 / 11) < 1e-12
    assert cost["constrained_ms"] < cost["retry_ms"]
    assert (
        amortization(3, compile_ms=15, base_ms=30, mask_ms=2, failure=0)[
            "strictly_faster_after_requests"
        ]
        is None
    )
    answers.append({"task": 14, "first_integer": 3, **cost})
    print(json.dumps(answers, indent=2, default=str))


if __name__ == "__main__":
    main()
