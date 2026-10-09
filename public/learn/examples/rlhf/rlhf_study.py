"""Run and retain each declared experiment once, with source identities.

python rlhf_study.py --output results --workdir trainer-output
Install the dependencies used by the seven supplied programs first. Every stage
writes its own receipt; an existing result is conserved and hash-verified.
"""
import argparse
import hashlib
import importlib
import importlib.metadata
import json
from pathlib import Path
import platform
import time
import traceback
from preference_records import ROOT, audit, load_records

STAGES = {
    "pairwise": "pairwise_reward", "categorical": "policy_gradient", "credit": "token_credit",
    "token_ppo": "token_ppo", "transformers": "transformers_bridge", "reward_trainer": "reward_trainer",
}

# Include transitive local dependencies, not only the module containing run().
STAGE_SOURCES = {
    "pairwise": ("pairwise_reward.py", "preference_records.py"),
    "categorical": ("policy_gradient.py", "preference_records.py"),
    "credit": ("token_credit.py", "preference_records.py"),
    "token_ppo": (
        "token_ppo.py", "token_credit.py", "causal_backbone.py", "preference_records.py",
    ),
    "transformers": (
        "transformers_bridge.py", "token_ppo.py", "token_credit.py",
        "causal_backbone.py", "preference_records.py",
    ),
    "reward_trainer": ("reward_trainer.py", "preference_records.py"),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_retained_result(stage, destination, receipt, inputs):
    """Accept unchanged historical outputs only with their actual source/data."""
    previous = json.loads(receipt.read_text(encoding="utf-8"))
    if previous.get("stage") != stage or previous.get("status") != "passed":
        raise ValueError("The retained receipt does not describe a successful matching stage")
    if previous["result_sha256"] != sha(destination):
        raise ValueError("Retained output changed")
    previous_inputs = previous["inputs"]
    for filename in STAGE_SOURCES[stage]:
        previous_hash = previous_inputs["source_sha256"].get(filename)
        current_hash = inputs["source_sha256"].get(filename)
        if previous_hash is None or current_hash is None or previous_hash != current_hash:
            raise ValueError(f"Source changed or missing: {filename}; review before rerunning")
    previous_records = previous_inputs.get("records_sha256")
    current_records = inputs.get("records_sha256")
    if previous_records is None or current_records is None or previous_records != current_records:
        raise ValueError("Preference records changed; review before rerunning")
    return previous


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "results")
    parser.add_argument("--workdir", type=Path, default=Path("trainer-output"))
    parser.add_argument("--stage", choices=["all", *STAGES], default="all")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    sources = {path.name: sha(path) for path in sorted(ROOT.glob("*.py"))}
    inputs = {"source_sha256": sources, "records_sha256": sha(ROOT / "records.json"),
              "python": platform.python_version(), "data_audit": audit(load_records()),
              "packages": {}}
    for name in ("torch", "numpy", "scikit-learn", "transformers", "trl", "datasets", "accelerate", "tokenizers"):
        try:
            inputs["packages"][name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            inputs["packages"][name] = None
    stages = STAGES if args.stage == "all" else {args.stage: STAGES[args.stage]}
    for name, module_name in stages.items():
        destination = args.output / (name + ".json")
        receipt = args.output / (name + "-receipt.json")
        if destination.exists():
            verify_retained_result(name, destination, receipt, inputs)
            print(json.dumps({"stage": name, "status": "conserved existing result"}), flush=True)
            continue
        started = time.time()
        try:
            module = importlib.import_module(module_name)
            result = module.run(args.workdir) if name == "reward_trainer" else module.run()
            destination.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            metadata = {"stage": name, "status": "passed", "elapsed_seconds": time.time() - started,
                        "inputs": inputs, "result_sha256": sha(destination)}
            receipt.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({key: value for key, value in metadata.items() if key != "inputs"}), flush=True)
        except Exception:
            failure = args.output / (name + "-failure-" + str(time.time_ns()) + ".json")
            failure.write_text(json.dumps({"stage": name, "inputs": inputs, "error": traceback.format_exc()}, indent=2) + "\n", encoding="utf-8")
            raise


if __name__ == "__main__":
    main()
