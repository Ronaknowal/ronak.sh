"""Audit the retained, complete PRM800K prefix records; no model fitting."""

import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inspect(split):
    path = BASE / "research/primary" / f"prm800k-phase2_{split}.jsonl.prefix"
    raw = path.read_bytes()
    rows = [json.loads(line) for line in raw.splitlines()]
    counts = collections.Counter()
    problems = set()
    examples = []
    for index, row in enumerate(rows):
        counts["records"] += 1
        problems.add(row["question"]["problem"])
        counts["finish:" + row["label"]["finish_reason"]] += 1
        for flag in ("is_quality_control_question", "is_initial_screening_question"):
            counts[flag] += bool(row.get(flag))
        previous = []
        for step_index, step in enumerate(row["label"]["steps"]):
            counts["annotated_steps"] += 1
            counts["branch_steps"] += len(step["completions"]) > 1
            for completion in step["completions"]:
                counts["completion_rating:" + str(completion["rating"])] += 1
                counts["completion_flag:" + str(completion["flagged"])] += 1
                if completion["rating"] in (-1, 0, 1) and not completion["flagged"]:
                    counts["unflagged_labeled_completions"] += 1
            selected = step["chosen_completion"]
            if selected is None:
                counts["no_chosen_completion"] += 1
                if step["human_completion"]:
                    previous.append(step["human_completion"]["text"])
                    counts["human_chosen_steps"] += 1
                elif step_index != len(row["label"]["steps"]) - 1:
                    counts["missing_prefix_continuation"] += 1
            else:
                assert 0 <= selected < len(step["completions"])
                previous.append(step["completions"][selected]["text"])
                counts["selected_rating:" + str(step["completions"][selected]["rating"])] += 1
        if len(examples) < 3:
            examples.append({"record_index": index, "problem_sha256": digest(row["question"]["problem"].encode()), "finish_reason": row["label"]["finish_reason"], "label_steps": len(row["label"]["steps"]), "generated_steps": len(row["question"]["pre_generated_steps"])})
    return {"source": str(path.relative_to(ROOT)).replace("\\", "/"), "sha256": digest(raw), "counts": dict(sorted(counts.items())), "unique_problems": len(problems), "examples": examples}, problems


def main():
    train, train_problems = inspect("train")
    test, test_problems = inspect("test")
    output = {"scope": "Complete newline-terminated records in two retained 2 MiB HTTP ranges; convenience prefixes, not entire upstream splits.", "upstream_commit": "7ecc794703b2877f63226f2477a49b34f9b25163", "train": train, "test": test, "problem_overlap": len(train_problems & test_problems), "script_sha256": digest(Path(__file__).read_bytes()), "fitted_models": 0}
    destination = BASE / "research/record-audit.json"
    destination.write_text(json.dumps(output, indent=2) + "\n", encoding="utf8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
