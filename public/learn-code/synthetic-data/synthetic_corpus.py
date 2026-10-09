"""Build source-owned records, preserve exclusions and index byte windows.
Run: python synthetic_corpus.py --output corpus.json
"""
import argparse
import bisect
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import numpy as np

ROOT = Path(__file__).resolve().parent


def normalize(text):
    return " ".join(unicodedata.normalize("NFKC", text).split())


def text_hash(text):
    return hashlib.sha256(normalize(text).encode("utf-8")).hexdigest()


def read_sources(folder=ROOT):
    records, excluded = [], []
    for split in ("train", "heldout"):
        for index, text in enumerate((folder / f"alice-{split}.txt").read_text(encoding="utf-8").splitlines()):
            row = {"id": f"{split}-{index:02d}", "split": split, "text": text,
                   "normalized_sha256": text_hash(text)}
            if not text.strip() or re.fullmatch(r"[\s*]+", text):
                excluded.append({**row, "reason": "whitespace or decorative asterism"})
            else:
                records.append(row)
    return {"records": records, "excluded": excluded}


def select_candidates(candidates, sources):
    by_id = {row["id"]: row for row in sources}
    seen, kept, ledger = {}, [], []
    for row in candidates:
        parent = by_id[row["source_id"]]
        if parent["split"] != "train":
            raise ValueError("Generated training data must have training-only parents")
        text = normalize(row["text"])
        key = text_hash(text)
        reasons = []
        if len(text.encode("utf-8")) < 33: reasons.append("fewer than 33 UTF-8 bytes")
        if key == parent["normalized_sha256"]: reasons.append("exact normalized source copy")
        if key in seen: reasons.append(f"duplicate candidate {seen[key]}")
        # Deterministic first occurrence; all originals and reasons remain visible.
        seen.setdefault(key, row["id"])
        accepted = not reasons
        ledger.append({"id": row["id"], "source_id": row["source_id"],
                       "accepted": accepted, "reasons": reasons, "sha256": key,
                       "bytes": len(text.encode("utf-8"))})
        if accepted:
            kept.append({"id": row["id"], "source_id": row["source_id"],
                         "split": "train", "text": text})
    return {"kept": kept, "ledger": ledger}


class WindowPool:
    """Index all within-record C+1 byte windows without materializing them."""
    def __init__(self, records, context=32):
        self.records, self.context = records, context
        self.arrays = [np.frombuffer(row["text"].encode("utf-8"), dtype=np.uint8) for row in records]
        self.counts = [max(0, len(data) - context) for data in self.arrays]
        self.ends = np.cumsum(self.counts).tolist()
        self.total = self.ends[-1] if self.ends else 0
        if not self.total:
            raise ValueError("No eligible within-record windows")

    def locate(self, index):
        if not 0 <= index < self.total: raise IndexError(index)
        record = bisect.bisect_right(self.ends, index)
        start = index - (self.ends[record - 1] if record else 0)
        return record, start

    def sample(self, uniform):
        record, start = self.locate(min(self.total - 1, int(uniform * self.total)))
        return self.arrays[record][start:start + self.context + 1].astype(np.int64)


def diagnostics(records):
    sizes = [len(row["text"].encode("utf-8")) for row in records]
    families = {}
    for row in records:
        family = row.get("source_id", row["id"])
        families[family] = families.get(family, 0) + 1
    n = len(records)
    return {"records": n, "utf8_bytes": sum(sizes), "record_bytes": sizes,
            "unique_normalized": len({text_hash(row["text"]) for row in records}),
            "families": families,
            "effective_families_document_weighted": n * n / sum(v*v for v in families.values()) if n else 0}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = read_sources()
    result["diagnostics"] = {split: diagnostics([r for r in result["records"] if r["split"] == split])
                             for split in ("train", "heldout")}
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        with args.output.open("x", encoding="utf-8") as stream: stream.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
