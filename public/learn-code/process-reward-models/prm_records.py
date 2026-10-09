"""Extract known-valid-prefix local labels from pinned PRM800K records.

python prm_records.py --train phase2_train.jsonl --test phase2_test.jsonl --out data
Inputs may be the retained complete-record prefixes or full upstream files.
Only source addresses and grouping use IDs; no label or answer becomes a feature.
"""

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def extract(path, source_split):
    """Every sibling uses the same prefix; only the chosen branch extends it."""
    raw = Path(path).read_bytes()
    groups = defaultdict(list)
    counts = Counter()
    for record_index, line in enumerate(raw.splitlines()):
        row = json.loads(line)
        counts["raw_records"] += 1
        if row.get("is_quality_control_question"):
            counts["reject_quality_control_record"] += 1
            continue
        if row.get("is_initial_screening_question"):
            counts["reject_initial_screen_record"] += 1
            continue
        if row["label"]["finish_reason"] not in ("solution", "found_error"):
            counts["reject_finish_record"] += 1
            continue
        question = row["question"]["problem"]
        problem_id = sha256(question.encode("utf8"))
        prefix = []
        valid_prefix = True
        for step_index, step in enumerate(row["label"]["steps"]):
            for alternative_index, completion in enumerate(step["completions"]):
                counts["considered_alternatives"] += 1
                rating = completion.get("rating")
                if not valid_prefix:
                    counts["reject_unknown_or_invalid_prefix"] += 1
                    continue
                if completion.get("flagged"):
                    counts["reject_flagged_target"] += 1
                    continue
                if rating not in (-1, 0, 1):
                    counts["reject_unknown_target"] += 1
                    continue
                groups[problem_id].append({
                    "problem_id": problem_id,
                    "question": question,
                    "prefix_steps": prefix.copy(),
                    "current_step": completion["text"],
                    "upstream_rating": rating,
                    "class_id": rating + 1,
                    "source": {
                        "split": source_split,
                        "record": record_index,
                        "step": step_index,
                        "alternative": alternative_index,
                    },
                })
                counts["eligible_before_dedup"] += 1

            # Never append the whole alternatives list. Missing continuation
            # cannot be filled from pre_generated_steps or a ground-truth answer.
            chosen_index = step.get("chosen_completion")
            if chosen_index is not None:
                if not 0 <= chosen_index < len(step["completions"]):
                    raise ValueError("Chosen completion index outside sibling list")
                chosen = step["completions"][chosen_index]
            else:
                chosen = step.get("human_completion")
            if not isinstance(chosen, dict):
                counts["missing_chosen_continuation"] += 1
                valid_prefix = False
            elif chosen.get("flagged") or chosen.get("rating") not in (0, 1):
                counts["invalid_or_unknown_chosen_continuation"] += 1
                valid_prefix = False
            else:
                prefix.append(chosen["text"])

    capped = {}
    for problem_id, examples in groups.items():
        seen = set()
        unique = []
        for example in examples:
            key = (example["question"], tuple(example["prefix_steps"]),
                   example["current_step"], example["upstream_rating"])
            if key in seen:
                counts["reject_duplicate_tuple"] += 1
                continue
            seen.add(key)
            unique.append(example)
        counts["reject_problem_cap"] += max(0, len(unique) - 12)
        capped[problem_id] = unique[:12]
    return capped, {"path": str(path), "sha256": sha256(raw),
                    "bytes": len(raw), "counts": dict(sorted(counts.items())),
                    "eligible_problems": len(capped)}


def select(train_path, test_path):
    train_groups, train_info = extract(train_path, "upstream_train")
    test_groups, test_info = extract(test_path, "upstream_test")
    if set(train_groups) & set(test_groups):
        raise ValueError("Problem leakage across upstream splits")
    train_ids = sorted(train_groups)
    identities = {"train": train_ids[:96], "validation": train_ids[96:128],
                  "test": sorted(test_groups)[:48]}
    splits = {}
    summary = {}
    for name, ids in identities.items():
        source = test_groups if name == "test" else train_groups
        splits[name] = [example for problem in ids for example in source[problem]]
        summary[name] = {"problems": len(ids), "examples": len(splits[name]),
                         "class_counts": dict(sorted(Counter(
                             e["class_id"] for e in splits[name]).items())),
                         "problem_ids": ids}
    return splits, {"sources": {"train": train_info, "test": test_info},
                    "selected": summary,
                    "source_sha256": sha256(Path(__file__).read_bytes()),
                    "fitted_models": 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", required=True)
    parser.add_argument("--test", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    splits, report = select(args.train, args.test)
    args.out.mkdir(parents=True, exist_ok=True)
    report["selected_files"] = {}
    for name, examples in splits.items():
        data = "".join(json.dumps(e, ensure_ascii=False) + "\n" for e in examples)
        path = args.out / f"{name}.jsonl"
        path.write_text(data, encoding="utf8", newline="\n")
        report["selected_files"][name] = {"sha256": sha256(path.read_bytes()),
                                          "bytes": path.stat().st_size}
    (args.out / "extraction.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
