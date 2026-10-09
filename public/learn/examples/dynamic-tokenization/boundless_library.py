"""Train/save/load the actual official BoundlessBPE implementation.

Clone https://github.com/kensho-technologies/boundlessbpe and check out
9c7ef2ebff09dfc000ce2c0cf5f7d32eaeb6ec86. Install regex==2026.9.29.
Run: python -X utf8 boundless_library.py --library-path PATH_TO_CLONE
"""

import argparse
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--library-path", type=Path, required=True)
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("wikitext_excerpt.json"))
    parser.add_argument("--vocab-size", type=int, default=320)
    parser.add_argument("--tau", type=float, default=1.1)
    arguments = parser.parse_args()
    sys.path.insert(0, str(arguments.library_path.resolve()))
    from boundlessbpe import FasterHalfDirectRegexTokenizer, FasterRegexInference
    from boundlessbpe.regexconstants import ULTIMATE_PATTERN

    data = json.loads(arguments.data.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        source = root / "train.jsonl"
        source.write_text("".join(json.dumps({"text": row["text"]}) + "\n"
                                 for row in data["train"]), encoding="utf-8")
        tokenizer = FasterHalfDirectRegexTokenizer(arguments.tau, pattern=ULTIMATE_PATTERN)
        start = time.perf_counter()
        # Keep this library's progress printing separate from lesson results.
        with contextlib.redirect_stdout(io.StringIO()):
            tokenizer.train(str(source), str(root / "study"), len(data["train"]),
                            arguments.vocab_size, recalc=1000, blowup=True, verbose=False)
            tokenizer.save(str(root / "study"))
            inference = FasterRegexInference()
            inference.load(str(root / "study.model"))
        elapsed = time.perf_counter() - start
        encoded = [inference.encode_ordinary(row["text"]) for row in data["test"]]
        assert all(inference.decode(ids) == row["text"] for ids, row in zip(encoded, data["test"]))
        test_bytes = sum(len(row["text"].encode("utf-8")) for row in data["test"])
        test_tokens = sum(map(len, encoded))
        examples = []
        for text in ["Tip of the hat", "Tip 123 hat", "है café", ""]:
            ids = inference.encode_ordinary(text)
            assert inference.decode(ids) == text
            examples.append({"text": text, "ids": ids,
                             "pieces_hex": [inference.inv_vocab[index].hex() for index in ids]})
        # Compare exact immutable official rules with our explicit replay.
        from boundless_reference import BoundlessTokenizer, Rule
        reference = BoundlessTokenizer(pattern=ULTIMATE_PATTERN)
        events = [(rank, "regular", pair) for pair, rank in inference.merges.items()]
        events += [(rank, "super", pair) for pair, rank in inference.supermerges.items()]
        events += [(rank, "delete", (token,)) for token, rank in inference.deletions.items()]
        reference.rules = [Rule(rank, kind, parts) for rank, kind, parts in sorted(events)]
        reference.ids = inference.vocab
        comparison_texts = [row["text"] for row in data["test"]] + [row["text"] for row in examples]
        assert all(reference.encode(text) == inference.encode_ordinary(text) for text in comparison_texts)
        # Inspect dictionary retention in the snapshot rather than assuming deletions shrink it.
        deleted_retained = [token.hex() for token in inference.deletions if token in inference.vocab]
        report = {
            "official_revision": "9c7ef2ebff09dfc000ce2c0cf5f7d32eaeb6ec86",
            "tau": arguments.tau, "vocab_size": len(inference.vocab),
            "regular_merges": len(inference.merges), "supermerges": len(inference.supermerges),
            "deletions": len(inference.deletions), "deleted_tokens_still_in_dictionary": deleted_retained,
            "train_save_load_seconds": elapsed,
            "test_bytes": test_bytes, "test_tokens": test_tokens,
            "bytes_per_token": test_bytes / test_tokens,
            "exact_reference_replay_inputs": len(comparison_texts), "examples": examples,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
