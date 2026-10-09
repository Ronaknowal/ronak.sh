"""Once-only, ordered stages for the bounded prefix-caching demonstration.

Stage order: finite, tiny, native, allocator. Outputs are never overwritten.
Each neural/allocator operation records operands/results before assertions;
failures leave both the journal and a failed result. No automatic retry exists.
"""

import argparse
import importlib
import json
from pathlib import Path
import traceback

from observations import Recorder, sha256

HERE = Path(__file__).resolve().parent
STAGES = ["finite", "tiny", "native", "allocator"]


def validate_sources():
    manifest = json.loads((HERE / "source-manifest.json").read_text(encoding="utf8"))
    for row in manifest["files"]:
        path = HERE / row["path"]
        if path.stat().st_size != row["bytes"] or sha256(path) != row["sha256"]:
            raise ValueError(f"Source changed: {row['path']}")
    return sha256(HERE / "source-manifest.json")


def finite(recorder):
    modules = [
        "prefix_identity",
        "prefix_work",
        "prefix_store",
        "prefix_workload",
        "radix_prefix",
        "prefix_routing",
        "prefix_cost",
        "practice",
    ]
    results = {}
    for name in modules:
        recorder.emit(
            "finite-start", {"module": name, "source_sha256": sha256(HERE / f"{name}.py")}
        )
        value = importlib.import_module(name).verify()
        recorder.emit("finite-complete", {"module": name, "result": value})
        results[name] = value
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", required=True, choices=STAGES)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--model", type=Path)
    args = parser.parse_args()
    if args.stage == "native" and args.model is None:
        parser.error("The native stage needs --model pointing to the verified local checkpoint.")
    manifest_hash = validate_sources()
    protocol = json.loads((HERE / "study-protocol.json").read_text(encoding="utf8"))
    for previous in STAGES[: STAGES.index(args.stage)]:
        previous_result = args.output / previous / "result.json"
        if not previous_result.is_file():
            raise ValueError(f"Complete {previous} first.")
        previous_data = json.loads(previous_result.read_text(encoding="utf8"))
        if previous_data["status"] != "passed" or previous_data["source_manifest"] != manifest_hash:
            raise ValueError(f"Previous stage {previous} failed or used different sources.")
    recorder = Recorder(args.output / args.stage)
    result = {
        "stage": args.stage,
        "status": "running",
        "source_manifest": manifest_hash,
        "protocol_sha256": sha256(HERE / "study-protocol.json"),
    }
    recorder.emit("stage-start", result)
    try:
        if args.stage == "finite":
            result["observations"] = finite(recorder)
        elif args.stage == "tiny":
            from prefix_decoder import run

            result["observations"] = run(protocol, recorder)
        elif args.stage == "native":
            from native_prefix import run

            result["observations"] = run(protocol, args.model, recorder)
        else:
            from native_prefix_allocator import run

            result["observations"] = run(protocol, recorder)
        result["status"] = "passed"
    except BaseException:
        result["status"] = "failed"
        result["failure"] = traceback.format_exc()
        recorder.emit("failure", {"traceback": result["failure"]})
        raise
    finally:
        recorder.result(result)
    print(
        json.dumps(
            {"stage": args.stage, "status": result["status"], "path": str(recorder.directory)},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
