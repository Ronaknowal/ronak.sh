"""Audit ten retained real generated CAI records without treating chosen as truth.

Run: python audit_cai_data.py --data cai_records.json
Download cai_records.json and DATA-LICENSE.txt beside this program. Standard library
only by default. --tokenizer-cache adds actual pinned T5 token counts (not scoring).
"""
import argparse
import hashlib
import json
from pathlib import Path

AUTHOR_NOTES = {
    1: "Revision adds irrelevant safe/legal language to a dinosaur-sounds question.",
    9: "Revision changes from a self-description request to general relativity.",
    40: "Exact stripped draft/revision duplicate.",
    60: "Changes detail in an answer about the time arrow; no external correctness judgment supplied.",
    66: "Small wording change in teen online-safety advice; no external improvement judgment supplied.",
    77: "Exact stripped draft/revision duplicate.",
    78: "Exact stripped draft/revision duplicate.",
    80: "Exact stripped draft/revision duplicate.",
    82: "Duplicate blanket refusal includes a legal assertion that this lesson does not endorse.",
    96: "Generated context includes an irrelevant reminder about general relativity.",
}


def audit(records, tokenizer=None):
    rows = []
    for item in records:
        identity = item["row_idx"]
        row = item["row"]
        for name in ("init_prompt", "init_response", "critic_response", "revision_response"):
            if not isinstance(row.get(name), str):
                raise ValueError(f"Row {identity} missing string field {name}.")
        draft = row["init_response"]
        revision = row["revision_response"]
        result = {"row_idx": identity, "prompt": row["init_prompt"],
                  "raw_duplicate": draft == revision,
                  "stripped_duplicate": draft.strip() == revision.strip(),
                  "draft_characters": len(draft), "revision_characters": len(revision),
                  "draft_sha256": hashlib.sha256(draft.encode("utf-8")).hexdigest(),
                  "revision_sha256": hashlib.sha256(revision.encode("utf-8")).hexdigest(),
                  "manual_note": AUTHOR_NOTES.get(identity),
                  "manual_note_source": "lesson author's qualitative reading, not automatic scoring"}
        if tokenizer is not None:
            result["token_counts_with_eos"] = {
                field: len(tokenizer(row[field], add_special_tokens=True)["input_ids"])
                for field in ("init_prompt", "init_response", "critic_response", "revision_response")}
        rows.append(result)
    duplicates = [row["row_idx"] for row in rows if row["stripped_duplicate"]]
    return {"rows": rows, "count": len(rows), "duplicate_indices": duplicates,
            "duplicate_count": len(duplicates),
            "duplicate_fraction": len(duplicates) / len(rows) if rows else None,
            "scope": "convenience subset; no independent quality labels or population-rate inference"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(Path(__file__).with_name("cai_records.json")))
    parser.add_argument("--tokenizer-cache")
    arguments = parser.parse_args()
    path = Path(arguments.data)
    raw = path.read_bytes()
    data = json.loads(raw)
    tokenizer = None
    if arguments.tokenizer_cache:
        from transformers import AutoTokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            "google/flan-t5-small", revision="0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab",
            cache_dir=arguments.tokenizer_cache, local_files_only=True)
    result = audit(data["rows"], tokenizer)
    result["data_sha256"] = hashlib.sha256(raw).hexdigest()
    result["provenance"] = data["provenance"]
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
