"""Freeze a finite experiment before running it once; retain each completed arm.

python native_study.py prepare --model model-cache --record protocol.json
python native_study.py run --model model-cache --record protocol.json --output results.json
The model is loaded only by run. Existing output files are never replaced.
"""

import argparse
import hashlib
import json
from pathlib import Path
import platform
import time
import traceback

import torch
import transformers
from transformers import AutoTokenizer
from native_batching import (
    HERE,
    batch_config,
    full_greedy,
    load_model,
    run_requests,
    verify_files,
)
from dataclasses import asdict


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, data):
    with path.open("x", encoding="utf8") as stream:
        json.dump(data, stream, indent=2)
        stream.write("\n")


def prepare(model_directory, record):
    if record.exists():
        raise FileExistsError(record)
    source = verify_files(model_directory)
    tokenizer = AutoTokenizer.from_pretrained(model_directory, local_files_only=True)
    ids = tokenizer(
        (HERE / "alice-train.txt").read_text(encoding="utf8"), add_special_tokens=False
    ).input_ids
    files = [
        "native_batching.py",
        "native_study.py",
        "alice-train.txt",
        "alice-provenance.json",
        "model-source-report.json",
    ]
    protocol = {
        "purpose": "Finite keyed batching correctness and actual lifecycle, not a speed ranking or quality study.",
        "model": source,
        "versions": {"torch": torch.__version__, "transformers": transformers.__version__},
        "files": [{"name": name, "sha256": digest(HERE / name)} for name in files],
        "requests": [
            {"id": f"alice-{length}", "prompt": ids[:length]}
            for length in [8, 12, 20, 32, 48, 64]
        ],
        "cap": 6,
        "budgets": [16, 32, 64],
        "dtype": "float32",
        "device": "cpu",
        "attention": "sdpa",
        "threads": 1,
        "warmup": False,
        "seed": 113,
        "configs": [asdict(batch_config(budget)) for budget in [16, 32, 64]],
        "emission_budget": {"full_references": 36, "three_batch_arms": 108, "total": 144},
        "thread_amendment": "Prospective design used two Torch threads; this protocol uses one for the shared host. No model campaign preceded this amendment.",
        "order": "Six separate full-prefix references in listed order, then manager budgets16,32,64 once each.",
        "metrics": "Every keyed token mismatch/first divergence, observed terminal status/timestamps, single inclusive manager elapsed time. No logits or confidence-interval claim.",
        "failure_rule": "Retain completed per-reference/per-arm journal rows and traceback. No automatic retries or missing-result imputation.",
    }
    write_new(record, protocol)
    return {"protocol": str(record), "sha256": digest(record), "model_loaded": False}


def run(model_directory, record, output):
    journal = output.with_suffix(".jsonl")
    if output.exists() or journal.exists():
        raise FileExistsError(
            "Inspect existing results/journal; do not replay completed work."
        )
    protocol = json.loads(record.read_text(encoding="utf8"))
    for row in protocol["files"]:
        assert digest(HERE / row["name"]) == row["sha256"], row["name"]
    assert protocol["versions"] == {
        "torch": torch.__version__,
        "transformers": transformers.__version__,
    }
    torch.set_num_threads(protocol["threads"])
    torch.manual_seed(protocol["seed"])
    report = {
        "protocol_sha256": digest(record),
        "hardware": {"platform": platform.platform(), "processor": platform.processor()},
        "references": {},
        "arms": [],
        "passed_execution": False,
    }

    def append(row):
        with journal.open("a", encoding="utf8") as stream:
            stream.write(json.dumps(row) + "\n")
            stream.flush()

    # Establish the one-run marker before loading a model.
    with journal.open("x", encoding="utf8") as stream:
        stream.write(json.dumps({"begin": True, "protocol_sha256": digest(record)}) + "\n")
    try:
        model, _ = load_model(model_directory)
        for request in protocol["requests"]:
            tokens = full_greedy(model, request["prompt"], protocol["cap"])
            report["references"][request["id"]] = tokens
            append({"reference": request["id"], "tokens": tokens})
        for budget in protocol["budgets"]:
            arm = run_requests(model, protocol["requests"], budget, protocol["cap"])
            comparisons = {}
            for request in protocol["requests"]:
                expected = report["references"][request["id"]]
                row = arm["outputs"].get(request["id"])
                actual = None if row is None else row["generated_tokens"]
                matches = actual == expected
                first = (
                    None
                    if matches
                    else next(
                        (
                            i
                            for i in range(max(len(expected), len(actual or [])))
                            if i >= len(expected)
                            or i >= len(actual or [])
                            or expected[i] != actual[i]
                        ),
                        None,
                    )
                )
                comparisons[request["id"]] = {
                    "expected": expected,
                    "actual": actual,
                    "matches": matches,
                    "first_divergence": first,
                    "finished": row is not None and row["status_name"] == "FINISHED",
                }
            arm["comparisons"] = comparisons
            report["arms"].append(arm)
            append({"arm": arm})
            if "failure" in arm:
                raise RuntimeError(
                    "Native arm failed; partial outputs retained in the journal."
                )
        report["passed_execution"] = True
        report["all_ids_match"] = all(
            c["matches"] for arm in report["arms"] for c in arm["comparisons"].values()
        )
        report["all_finished"] = all(
            c["finished"] for arm in report["arms"] for c in arm["comparisons"].values()
        )
    except Exception:
        report["failure"] = traceback.format_exc()
    finally:
        write_new(output, report)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "run"])
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--record", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.action == "run" and args.output is None:
        parser.error("--output is required for run")
    result = (
        prepare(args.model, args.record)
        if args.action == "prepare"
        else run(args.model, args.record, args.output)
    )
    print(json.dumps(result, indent=2))
    if result.get("passed_execution") is False:
        raise SystemExit(1)
