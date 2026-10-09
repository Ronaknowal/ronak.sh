"""Count actual retained outputs and distinguish pass@K from answer voting.

python -B evaluate_rollouts.py --study observations/tiny-study.json --output observations/metrics.json
Standard library only; it reads complete study outputs without fitting a model.
"""

import argparse
from collections import Counter
import json
import math
from pathlib import Path

from rlvr_data import emit


def pass_at_k(n, c, k):
    if not 0 <= c <= n or not 1 <= k <= n:
        return None
    return 1.0 if n - c < k else 1 - math.comb(n - c, k) / math.comb(n, k)


def sample_metrics(samples):
    available = [
        sample for sample in samples if sample["verdict"]["accepted"] is not None
    ]
    if not available:
        return {
            "samples": len(samples),
            "scorable": 0,
            "answer_pass_fraction": None,
            "format_fraction": None,
            "mean_length": None,
            "answer_counts": {},
            "plurality": None,
            "plurality_tied": None,
            "pass_at_4_estimator": None,
        }
    answers = Counter(
        sample["verdict"]["parsed"]
        for sample in available
        if sample["verdict"]["parsed"] is not None
    )
    ordered = sorted(answers.items(), key=lambda item: (-item[1], item[0]))
    tied = len(ordered) > 1 and ordered[0][1] == ordered[1][1]
    passed = sum(sample["verdict"]["accepted"] for sample in available)
    return {
        "samples": len(samples),
        "scorable": len(available),
        "answer_pass_count": passed,
        "answer_pass_fraction": passed / len(available),
        "format_fraction": sum(
            sample["verdict"]["parsed"] is not None for sample in available
        )
        / len(available),
        "mean_length": sum(sample["length"] for sample in available) / len(available),
        "ended_EOS_fraction": sum(sample["ended_with_EOS"] for sample in available)
        / len(available),
        "answer_counts": dict(answers),
        "plurality": None if not ordered or tied else ordered[0][0],
        "plurality_tied": tied if ordered else None,
        "pass_at_4_estimator": pass_at_k(len(available), passed, 4),
    }


def summarize(study):
    runs = []
    group_size = study["protocol"]["study"]["group_size"]
    for run in study["runs"]:
        evaluations = []
        for checkpoint in run["evaluations"]:
            records = [
                {"record_id": row["record_id"], **sample_metrics(row["samples"])}
                for row in checkpoint["records"]
            ]
            scorable = sum(row["scorable"] for row in records)
            passes = sum(row.get("answer_pass_count", 0) for row in records)
            estimates = [
                row["pass_at_4_estimator"]
                for row in records
                if row["pass_at_4_estimator"] is not None
            ]
            evaluations.append(
                {
                    "step": checkpoint["step"],
                    "state_sha256": checkpoint["state_sha256"],
                    "records": records,
                    "sample_count": sum(row["samples"] for row in records),
                    "scorable_count": scorable,
                    "pass_count": passes,
                    "answer_pass_fraction": passes / scorable if scorable else None,
                    "pass_at_4_record_denominator": len(estimates),
                    "mean_record_pass_at_4_estimator": (
                        sum(estimates) / len(estimates) if estimates else None
                    ),
                }
            )
        history = []
        for step in run["steps"]:
            groups = [
                step["samples"][begin : begin + group_size]
                for begin in range(0, len(step["samples"]), group_size)
            ]
            mixed = sum(
                0 < sum(sample["verdict"]["accepted"] for sample in group) < len(group)
                for group in groups
            )
            history.append(
                {
                    "step": step["step"],
                    **sample_metrics(step["samples"]),
                    "mixed_groups": mixed,
                    "group_count": len(groups),
                    "mixed_group_fraction": mixed / len(groups),
                    "updates": step["update"]["updates"],
                    "optimizer_updates_total": step["optimizer_updates_total"],
                    "sampled_k3_response_mean": [
                        epoch["sampled_k3_response_mean"]
                        for epoch in step["update"].get("epochs", [])
                    ],
                }
            )
        runs.append(
            {
                "seed": run["seed"],
                "arm": run["arm"],
                "history": history,
                "evaluations": evaluations,
                "work": {
                    "scheduled_rollouts": len(run["steps"]),
                    "prompt_groups": 2 * len(run["steps"]),
                    "training_responses": sum(
                        len(step["samples"]) for step in run["steps"]
                    ),
                    "training_generated_tokens": sum(
                        step["generated_tokens"] for step in run["steps"]
                    ),
                    "optimizer_updates": run["optimizer_updates"],
                    "skipped_rollouts": sum(
                        step["update"]["updates"] == 0 for step in run["steps"]
                    ),
                    "evaluation_responses": sum(
                        check["sample_count"] for check in evaluations
                    ),
                },
            }
        )
    return {
        "runs": runs,
        "warm": [
            {
                "seed": run["seed"],
                "updates": len(run["history"]),
                "response_target_count": sum(
                    step["targets"] for step in run["history"]
                ),
            }
            for run in study["warm_runs"]
        ],
        "transfer_fixture": {"n": 10, "c": 3, "k": 3, "pass_at_k": pass_at_k(10, 3, 3)},
        "eight_sample_fixture": {
            "n": 8,
            "c": 2,
            "k": 4,
            "pass_at_k": pass_at_k(8, 2, 4),
        },
        "unknown_boundary": {"n": 3, "c": 1, "k": 4, "pass_at_k": pass_at_k(3, 1, 4)},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--study", type=Path, default=Path("observations/tiny-study.json")
    )
    parser.add_argument(
        "--output", type=Path, default=Path("observations/metrics.json")
    )
    args = parser.parse_args()
    result = summarize(json.loads(args.study.read_text(encoding="utf-8")))
    emit(args.output, result)
    print(
        {
            "runs": len(result["runs"]),
            "scheduled_rollouts": sum(
                run["work"]["scheduled_rollouts"] for run in result["runs"]
            ),
            "optimizer_updates": sum(
                run["work"]["optimizer_updates"] for run in result["runs"]
            ),
        }
    )


if __name__ == "__main__":
    main()
