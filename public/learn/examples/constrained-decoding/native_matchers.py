"""Inspect real XGrammar 0.2.8 masks, EOS, fork and rollback on a raw vocabulary.

python native_matchers.py --output native-masks.json
Requires xgrammar and CPU Torch. No language model or hosted request is used.
"""

import argparse
import importlib.metadata
import json
from pathlib import Path
import torch
import xgrammar as xgr


def allowed(matcher, vocab_size):
    mask = xgr.allocate_token_bitmask(1, vocab_size)
    matcher.fill_next_token_bitmask(mask)
    scores = torch.zeros((1, vocab_size), dtype=torch.float32)
    xgr.apply_token_bitmask_inplace(scores, mask)
    return torch.isfinite(scores[0]).nonzero().flatten().tolist()


def inspect():
    vocabulary = [b"abc", b"42", b"7", b"3x", b"<EOS>"]
    info = xgr.TokenizerInfo(vocabulary, stop_token_ids=[4], vocab_size=8)
    compiler = xgr.GrammarCompiler(info, max_threads=1)
    compiled = compiler.compile_regex(r"[0-9]+(\.[0-9]+)?")
    matcher = xgr.GrammarMatcher(compiled)
    rows = []

    def record(action):
        rows.append(
            {
                "action": action,
                "allowed_ids": None if matcher.is_terminated() else allowed(matcher, 8),
                "completed": matcher.is_completed(),
                "terminated": matcher.is_terminated(),
            }
        )

    record("initial")
    assert allowed(matcher, 8) == [1, 2]
    assert matcher.accept_token(1)
    record("accepted token1: 42")
    assert allowed(matcher, 8) == [1, 2, 4]
    fork = matcher.fork()
    assert fork.accept_token(4) and fork.is_terminated()
    assert not matcher.is_terminated()
    record("other request fork accepts EOS; this state is unchanged")
    matcher.rollback(1)
    record("rollback one whole token")
    before = allowed(matcher, 8)
    assert not matcher.accept_token(3) and allowed(matcher, 8) == before
    record("invalid whole token3: 3x rejected without mutation")
    assert matcher.accept_token(2) and matcher.accept_token(4)
    record("7 then EOS")
    matcher.reset()
    record("reset")
    return {
        "xgrammar_version": importlib.metadata.version("xgrammar"),
        "vocabulary_hex": [b.hex() for b in vocabulary],
        "padded_output_width": 8,
        "rows": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output")
    args = parser.parse_args()
    result = inspect()
    text = json.dumps(result, indent=2) + "\n"
    if args.output:
        with Path(args.output).open("x", encoding="utf-8") as stream:
            stream.write(text)
    print(text)


if __name__ == "__main__":
    main()
