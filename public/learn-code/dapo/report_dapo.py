"""Read every prespecified result; no model loading, selection or fitting.

python report_dapo.py --runs ./runs --output observations.json
Expected directories: response-baseline-73/89/101,dapo-components-73/89/101,native.
"""

import argparse
import hashlib
import json
from pathlib import Path


def run(folder):
    summaries = []
    files = {}
    for arm in ["response-baseline", "dapo-components"]:
        for seed in [73, 89, 101]:
            path = folder / f"{arm}-{seed}" / "report.json"
            if not path.exists():
                # A stopped scientific guard is an observed outcome, not a
                # missing seed to discard or an invitation to train it again.
                run_directory = path.parent
                status_path = folder / f"{arm}-{seed}.status.json"
                initial_path = run_directory / "initial.json"
                events_path = run_directory / "events.jsonl"
                initial = json.loads(initial_path.read_text(encoding="utf-8"))
                events = [
                    json.loads(line)
                    for line in events_path.read_text(encoding="utf-8").splitlines()
                ]
                assert initial["configuration"]["arm"] == arm
                assert initial["configuration"]["seed"] == seed
                for source in [initial_path, events_path] + (
                    [status_path] if status_path.exists() else []
                ):
                    files[str(source.relative_to(folder))] = hashlib.sha256(
                        source.read_bytes()
                    ).hexdigest()
                completed_slots = [
                    event["observation"] for event in events if event["kind"] == "slot-completed"
                ]
                candidates = [
                    event["observation"]
                    for event in events
                    if event["kind"] == "candidate-generated"
                ]
                completed_updates = [
                    event["observation"]
                    for event in events
                    if event["kind"] == "optimizer-update-completed"
                ]
                observed_slots = {}
                for event in events:
                    if event["kind"] == "old-rescore-operands":
                        record = event["observation"]["record"]
                        observed_slots[record["slot"]] = record
                    elif event["kind"] == "slot-completed":
                        record = event["observation"]
                        observed_slots[record["slot"]] = record
                score_checks = [
                    event["observation"]
                    for event in events
                    if event["kind"] == "old-score-comparison"
                ]
                failures = [
                    event["observation"] for event in events if event["kind"] == "stage-failed"
                ]
                assert failures, "Failure must have a durable scientific event"
                status = (
                    json.loads(status_path.read_text(encoding="utf-8"))
                    if status_path.exists()
                    else {
                        "status": "failed",
                        "exception": failures[-1]["exception"],
                        "message": failures[-1]["message"],
                    }
                )
                assert status["status"] == "failed", "Unfinished run is not a failed result"
                summaries.append(
                    {
                        "arm": arm,
                        "seed": seed,
                        "status": "failed",
                        "optimizer_updates": len(completed_updates),
                        "completed_slots": completed_slots,
                        "observed_slots": list(observed_slots.values()),
                        "generated_groups": sum(len(batch["rows"]) // 4 for batch in candidates),
                        "generated_tokens": sum(
                            len(row["completion_ids"])
                            for batch in candidates
                            for row in batch["rows"]
                        ),
                        "selected_tokens": sum(
                            record["selected_tokens"] for record in observed_slots.values()
                        ),
                        "optimizer_token_positions": sum(
                            event["record"]["selected_tokens"] for event in completed_updates
                        ),
                        "before": initial["before"],
                        "after": None,
                        "failure": status,
                        "scientific_failure": failures[-1],
                        "old_score_checks": score_checks,
                        "interpretation": "No terminal evaluation or complete-run comparison: original guard stopped this prescribed seed; prior updates and generated work remain counted.",
                    }
                )
                continue
            data = json.loads(path.read_text(encoding="utf-8"))
            assert data["configuration"]["arm"] == arm and data["configuration"]["seed"] == seed
            assert data["reload_exact"]
            files[str(path.relative_to(folder))] = hashlib.sha256(path.read_bytes()).hexdigest()
            summaries.append(
                {
                    "arm": arm,
                    "seed": seed,
                    "status": "passed",
                    "optimizer_updates": data["optimizer_updates"],
                    "filled_slots": sum(s["status"] == "filled" for s in data["slots"]),
                    "exhausted_slots": sum(s["status"] == "exhausted" for s in data["slots"]),
                    "generated_groups": sum(
                        len(b) // 4 for s in data["slots"] for b in s["candidates"]
                    ),
                    "generated_tokens": sum(s["generated_tokens"] for s in data["slots"]),
                    "selected_tokens": sum(s["selected_tokens"] for s in data["slots"]),
                    "updated_tokens_once_per_slot": sum(
                        s["selected_tokens"] for s in data["slots"] if s["status"] == "filled"
                    ),
                    "before": data["before"],
                    "optimizer_token_positions": sum(
                        s["selected_tokens"] * len(s["updates"]) for s in data["slots"]
                    ),
                    "after": data["after"],
                    "timing": data["timing"],
                    "parameter_change": data["parameter_change"],
                    "slots": data["slots"],
                }
            )
    native_path = folder / "native" / "report.json"
    native = json.loads(native_path.read_text(encoding="utf-8"))
    assert native["optimizer_updates"] == 2 and native["reload_exact"]
    files["native/report.json"] = hashlib.sha256(native_path.read_bytes()).hexdigest()
    return {
        "source_reports": files,
        "runs": summaries,
        "native": native,
        "paper_cumulative": {
            "benchmark": "AIME2024 avg@32",
            "base": "Qwen2.5-32B",
            "labels": [
                "naive GRPO",
                "+overlong filtering",
                "+Clip-Higher",
                "+soft overlong punishment",
                "+token-level loss",
                "+dynamic sampling",
            ],
            "scores": [30, 36, 38, 41, 42, 50],
            "comparison": {"name": "DeepSeek-R1-Zero-Qwen-32B", "score": 47},
            "source": "DAPO NeurIPS2025 camera-ready Table1; progressive changes, not independent effects",
        },
        "limits": [
            "All six prescribed scratch arms/seeds retained, including any stopped scientific guards; no best-run selection or retry.",
            "Failed runs have no terminal metric; incomplete observations do not support a paired six-run superiority claim.",
            "Short-label task with reused32-record evaluation cohort, not mathematical reasoning.",
            "Native objective has no dynamic refill and different group epsilon.",
            "Local elapsed totals are affected by shared-host load; no paper-scale speed claim.",
        ],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runs", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = run(args.runs)
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2)
        handle.write("\n")
    print(
        {
            "scratch_runs": len(result["runs"]),
            "native_updates": result["native"]["optimizer_updates"],
        }
    )
