"""Freeze exact human comparison strings; no model sees selection or splitting.

python preference_records.py --source helpful-base-data.jsonl.gz --output records.json
Without --source, audit the supplied offline records.json. Standard library only.
"""
import argparse
from collections import Counter, defaultdict
import gzip
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE_SHA = "518a5bf288456fc9f3b7c980c54116fba0c52f274d3f4d344675d83e4058f6f4"


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalized(text):
    return " ".join(text.casefold().split())


def extract(row, index):
    """Keep the last Assistant marker in the shared prompt, not the response."""
    marker = "\n\nAssistant:"
    left, right = row["chosen"], row["rejected"]
    if marker not in left or marker not in right:
        return None, "missing_final_assistant"
    p1, a = left.rsplit(marker, 1)
    p2, b = right.rsplit(marker, 1)
    if p1 != p2:
        return None, "different_prefix"
    prompt = p1 + marker
    if not a.strip() or not b.strip() or a == b:
        return None, "empty_or_equal_response"
    if not (5 <= len(a.split()) <= 45 and 5 <= len(b.split()) <= 45):
        return None, "response_word_limit"
    if len(prompt.split()) > 65:
        return None, "prompt_word_limit"
    first_turn = prompt.split(marker, 1)[0]
    family = digest(normalized(first_turn))
    partition = "heldout" if int(digest("rlhf-study-31|" + family)[:8], 16) % 5 == 0 else "train"
    return {
        "row_id": index, "prompt": prompt, "chosen": a, "rejected": b,
        "original_chosen": left, "original_rejected": right,
        "family_id": family, "prompt_id": digest(normalized(prompt)), "split": partition,
        "pair_digest": digest(left + "\0" + right),
    }, "eligible"


def audit(records):
    families = {split: {r["family_id"] for r in records if r["split"] == split} for split in ("train", "heldout")}
    prompts = {split: {r["prompt_id"] for r in records if r["split"] == split} for split in families}
    assert not families["train"] & families["heldout"]
    assert not prompts["train"] & prompts["heldout"]
    assert len({r["row_id"] for r in records}) == len(records)
    for record in records:
        assert record["prompt"] + record["chosen"] == record["original_chosen"]
        assert record["prompt"] + record["rejected"] == record["original_rejected"]
        assert digest(record["original_chosen"] + "\0" + record["original_rejected"]) == record["pair_digest"]
    return {"pairs": dict(Counter(r["split"] for r in records)),
            "families": {key: len(value) for key, value in families.items()},
            "family_overlap": 0, "prompt_overlap": 0}


def freeze(source):
    raw = source.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SOURCE_SHA, "Unexpected source bytes"
    counts, groups = Counter(), defaultdict(list)
    with gzip.open(source, "rt", encoding="utf-8") as stream:
        for index, line in enumerate(stream):
            record, reason = extract(json.loads(line), index)
            counts[reason] += 1
            if record is not None:
                groups[(record["split"], record["family_id"])].append(record)
    result = []
    for split, maximum in (("train", 256), ("heldout", 128)):
        keys = sorted(key for key in groups if key[0] == split)[:maximum]
        for key in keys:
            result.extend(sorted(groups[key], key=lambda row: row["row_id"])[:2])
    result.sort(key=lambda row: (row["split"], row["row_id"]))
    return {"source": "Anthropic/hh-rlhf helpful-base/train.jsonl.gz",
            "source_sha256": SOURCE_SHA, "selection_counts": dict(counts),
            "selection_rule": "study-protocol.md; first-turn families; seed31; at most2 pairs/family",
            "audit": audit(result), "records": result}


def load_records(path=ROOT / "records.json"):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    audit(data["records"])
    return data["records"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "records.json")
    args = parser.parse_args()
    if args.source:
        data = freeze(args.source)
        args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({key: value for key, value in data.items() if key != "records"}, indent=2))
    else:
        print(json.dumps(audit(load_records(args.output)), indent=2))


if __name__ == "__main__":
    main()
