"""Exact Poem Sentiment source, demonstration serialization and positional masks.

Run: python sft_data.py --data ./poems --model ./pythia-14m --download
Requires PyTorch and Transformers. --download fetches only the pinned TSVs.
Poem Sentiment: Sheng and Uthus (2020), Google Research, CC BY 4.0.
https://github.com/google-research-datasets/poem-sentiment
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import urllib.request
import torch


REVISION = "612e9a1f86799126c68f0c5d9c3f1fc28f88068f"
MODEL_REVISION = "cf967c0a9a04383db6f7b1108d86b2962634b4ac"
LABELS = ("negative", "no impact", "positive")
RAW_LABELS = {-1: "negative", 0: "no impact", 1: "positive"}
HASHES = {
    "train": "09503a850796736a8e63504ae2c8de983f57dceebc2342ea93a7f7ad06af56d0",
    "dev": "0770bd7b80e04c92da82e78f9f93ce35d38b334b4830fca2b9b4d7e174f152e5",
    "test": "a406d87b62a6b7c9615468a8b66e69c027fa8f2f03a4f8f6c79df26c260de620",
}
TEMPLATE = "Classify the verse sentiment as negative, no impact, or positive.\nVerse: {verse}\nAnswer:"
IGNORE = -100


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_source(directory, download=False):
    directory = Path(directory)
    if download:
        directory.mkdir(parents=True, exist_ok=True)
    splits = {}
    for split, digest in HASHES.items():
        path = directory / f"{split}.tsv"
        if not path.exists() and download:
            url = f"https://raw.githubusercontent.com/google-research-datasets/poem-sentiment/{REVISION}/data/{split}.tsv"
            with urllib.request.urlopen(url, timeout=60) as response:
                payload = response.read()
            if hashlib.sha256(payload).hexdigest() != digest:
                raise ValueError(f"Downloaded {split} differs from pinned source")
            path.write_bytes(payload)
        if sha256(path) != digest:
            raise ValueError(f"{path} differs from the pinned source")
        rows = []
        # TSV quotes are literal verse characters, not CSV quote delimiters.
        for line in path.read_text(encoding="utf-8").splitlines():
            fields = line.split("\t")
            if len(fields) != 3:
                raise ValueError(f"Expected three literal TSV fields: {line!r}")
            identity, verse, label_text = fields
            label = int(label_text)
            if label not in (-1, 0, 1, 2):
                raise ValueError("Unknown raw annotation label")
            if label == 2:
                continue
            rows.append({"id": int(identity), "verse": verse,
                         "raw_label": label, "label": RAW_LABELS[label], "split": split})
        if len({r["id"] for r in rows}) != len(rows):
            raise ValueError("Repeated source ID within split")
        splits[split] = rows
    if [len(splits[s]) for s in HASHES] != [843, 105, 104]:
        raise ValueError("Pinned post-exclusion split sizes changed")
    return splits


def prompt(verse):
    return TEMPLATE.format(verse=verse)


def encode_record(row, tokenizer, max_length=64, candidate=None):
    label = row["label"] if candidate is None else candidate
    if label not in LABELS or tokenizer.eos_token_id is None:
        raise ValueError("Require a declared label and actual tokenizer EOS")
    prefix = tokenizer.encode(prompt(row["verse"]), add_special_tokens=False)
    ids = tokenizer.encode(prompt(row["verse"]) + " " + label, add_special_tokens=False)
    if ids[:len(prefix)] != prefix:
        raise ValueError("Joint tokenization changed the prompt boundary; inspect spans")
    if not prefix or len(ids) <= len(prefix):
        raise ValueError("Require a prompt and at least one completion token")
    ids.append(tokenizer.eos_token_id)
    if len(ids) > max_length:
        raise ValueError(f"Record {row['id']} exceeds {max_length}; no silent truncation")
    return {**row, "ids": ids, "prompt_ids": prefix, "boundary": len(prefix),
            "eos_id": tokenizer.eos_token_id}


def collate(rows, policy="response", pad_id=0):
    """Right-pad using positions, even when padding stores the genuine EOS ID."""
    if not rows or policy not in ("response", "full"):
        raise ValueError("Require nonempty rows and response/full policy")
    length = max(len(row["ids"]) for row in rows)
    ids = torch.full((len(rows), length), pad_id, dtype=torch.long)
    valid = torch.zeros_like(ids)
    labels = torch.full_like(ids, IGNORE)
    for i, row in enumerate(rows):
        n, boundary = len(row["ids"]), row["boundary"]
        if not 0 < boundary < n:
            raise ValueError("Each row needs a nonempty context and response")
        ids[i, :n] = torch.tensor(row["ids"])
        valid[i, :n] = 1
        start = boundary if policy == "response" else 1
        labels[i, start:n] = ids[i, start:n]
    if not bool((labels[:, 1:] != IGNORE).any()):
        raise ValueError("No supervised shifted targets")
    return {"input_ids": ids, "attention_mask": valid, "labels": labels}


def assistant_labels(ids, spans, policy="all"):
    """Constructed span convention: [start,end) includes content and true EOS.

    Role prefixes and tool messages are context. Caller obtains actual spans
    from its tokenizer/template; these indices must not be guessed from strings.
    """
    if policy not in ("all", "last") or not spans:
        raise ValueError("Require assistant spans and all/last policy")
    labels = [IGNORE] * len(ids)
    for start, end in (spans if policy == "all" else spans[-1:]):
        if not 0 < start < end <= len(ids):
            raise ValueError("Invalid assistant span")
        labels[start:end] = ids[start:end]
    return labels


def audit(splits):
    seen, collisions = {}, []
    for split, rows in splits.items():
        for row in rows:
            normalized = " ".join(row["verse"].casefold().split())
            if normalized in seen:
                collisions.append([seen[normalized], [split, row["id"]]])
            seen[normalized] = [split, row["id"]]
    return {"counts": {s: dict(Counter(r["label"] for r in rows)) for s, rows in splits.items()},
            "normalized_exact_collisions": collisions,
            "limitation": "No poem identifiers; exact text checks cannot establish poem-level or semantic independence."}


def verify(splits, tokenizer):
    encoded = {s: [encode_record(r, tokenizer) for r in rows] for s, rows in splits.items()}
    lengths = [len(r["ids"]) for rows in encoded.values() for r in rows]
    rows = [{"ids": [6, 1, 2, 3, 4, 0], "boundary": 4},
            {"ids": [6, 1, 2, 3, 5, 4, 0], "boundary": 4}]
    batch = collate(rows)
    assert batch["labels"].tolist() == [[IGNORE]*4+[4, 0, IGNORE], [IGNORE]*4+[5, 4, 0]]
    assert batch["attention_mask"].tolist() == [[1]*6+[0], [1]*7]
    assert int((collate(rows, "full")["labels"] != IGNORE).sum()) == 11
    turns = list(range(12))
    assert assistant_labels(turns, [(3, 5), (9, 12)]) == [IGNORE]*3+[3, 4]+[IGNORE]*4+[9, 10, 11]
    assert assistant_labels(turns, [(3, 5), (9, 12)], "last") == [IGNORE]*9+[9, 10, 11]
    try:
        encode_record(splits["train"][0], tokenizer, max_length=1)
    except ValueError:
        pass
    else:
        raise AssertionError("Overlength record accepted")
    # A real byte-pair encoder with one merge disproves additive fragment counts.
    from tokenizers import Tokenizer
    from tokenizers.models import BPE
    boundary_tokenizer = Tokenizer(BPE(vocab={"a": 0, "b": 1, "ab": 2}, merges=[("a", "b")]))
    assert boundary_tokenizer.encode("ab").ids == [2]
    assert boundary_tokenizer.encode("a").ids + boundary_tokenizer.encode("b").ids == [0, 1]
    return {"checks": ["All real joint prompt prefixes", "EOS/PAD positional collision",
                       "Full versus response counts", "All/final assistant spans", "Overlength rejection",
                       "Actual BPE merge crossing fragment boundary"],
            "rows": len(lengths), "maximum_length": max(lengths), "eos": tokenizer.eos_token_id,
            "source": audit(splits), "fixture": {k: v.tolist() for k, v in batch.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    report = json.dumps(verify(load_source(args.data, args.download), tokenizer), indent=2)
    if args.output:
        args.output.write_text(report + "\n", encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
