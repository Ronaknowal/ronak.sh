"""Run the exact staged workflow once, then reuse only source-matched successes.

python -B run_all.py --cache MODEL_CACHE --output-dir observations --workdir work
Run in the downloaded directory after installing requirements.txt.
"""

import argparse
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys

from rlvr_data import ROOT, emit, file_digest

STAGES = {
    "verifier": {
        "program": "verifier_contracts.py",
        "files": ["verifier_contracts.py", "rlvr_data.py"],
        "packages": [],
    },
    "groups": {
        "program": "group_gradients.py",
        "files": ["group_gradients.py", "rlvr_data.py"],
        "packages": ["torch"],
    },
    "noise": {
        "program": "reward_noise.py",
        "files": ["reward_noise.py", "rlvr_data.py"],
        "packages": [],
    },
    "math-verify": {
        "program": "math_verify_bridge.py",
        "files": ["math_verify_bridge.py", "verifier_contracts.py", "rlvr_data.py"],
        "packages": ["torch", "math-verify", "sympy", "trl", "transformers"],
    },
    "tiny-study": {
        "program": "tiny_causal_rlvr.py",
        "files": [
            "tiny_causal_rlvr.py",
            "causal_backbone.py",
            "rlvr_data.py",
            "verifier_contracts.py",
            "scientific_journal.py",
            "records.json",
            "provenance.json",
            "protocol.json",
        ],
        "packages": ["torch", "numpy"],
    },
    "flan": {
        "program": "hf_eval_math.py",
        "files": [
            "hf_eval_math.py",
            "rlvr_data.py",
            "verifier_contracts.py",
            "records.json",
            "protocol.json",
        ],
        "packages": ["torch", "transformers", "tokenizers", "sentencepiece"],
    },
    "trl": {
        "program": "trl_bridge.py",
        "files": [
            "trl_bridge.py",
            "tiny_causal_rlvr.py",
            "causal_backbone.py",
            "rlvr_data.py",
            "verifier_contracts.py",
            "scientific_journal.py",
            "adamw_step_audit.py",
            "records.json",
            "protocol.json",
        ],
        "packages": [
            "torch",
            "transformers",
            "trl",
            "datasets",
            "tokenizers",
            "accelerate",
            "numpy",
        ],
    },
    "metrics": {
        "program": "evaluate_rollouts.py",
        "files": ["evaluate_rollouts.py", "rlvr_data.py"],
        "packages": [],
        "depends": ["tiny-study"],
    },
}

PACKAGE_SOURCES = {
    "torch": ["torch/optim/adamw.py"],
    "transformers": [
        "transformers/models/gpt2/modeling_gpt2.py",
        "transformers/generation/utils.py",
    ],
    "trl": [
        "trl/trainer/grpo_config.py",
        "trl/trainer/grpo_trainer.py",
        "trl/trainer/utils.py",
        "trl/rewards/accuracy_rewards.py",
    ],
    "math-verify": [
        "math_verify/parser.py",
        "math_verify/grader.py",
        "math_verify/utils.py",
    ],
}


def stage_inputs(name, output_dir, cache):
    stage = STAGES[name]
    inputs = {
        "files": {
            file: file_digest(ROOT / file)
            for file in stage["files"] + ["run_all.py", "requirements.txt"]
        },
        "packages": {
            package: importlib.metadata.version(package)
            for package in stage["packages"]
        },
        "package_sources": {},
        "python": sys.version,
        "dependencies": {},
    }
    for package in stage["packages"]:
        distribution = importlib.metadata.distribution(package)
        for relative in PACKAGE_SOURCES.get(package, []):
            inputs["package_sources"][relative] = file_digest(
                distribution.locate_file(relative)
            )
    for dependency in stage.get("depends", []):
        result = output_dir / (dependency + ".json")
        status = output_dir / (dependency + ".status.json")
        record = json.loads(status.read_text(encoding="utf-8"))
        expected_inputs = stage_inputs(dependency, output_dir, cache)
        if (
            record["status"] != "passed"
            or record["inputs"] != expected_inputs
            or record["output_sha256"] != file_digest(result)
        ):
            raise RuntimeError(
                "Dependency is not a current source-matched success: " + dependency
            )
        inputs["dependencies"][dependency] = {
            "result_sha256": file_digest(result),
            "status_sha256": file_digest(status),
        }
    if name == "flan":
        # Bind the complete actual cache revision used by local_files_only, not its absolute path.
        revision = "0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"
        snapshot = cache / "models--google--flan-t5-small" / "snapshots" / revision
        if not snapshot.is_dir():
            raise FileNotFoundError(snapshot)
        inputs["checkpoint_files"] = {
            str(path.relative_to(snapshot)).replace("\\", "/"): file_digest(path)
            for path in sorted(snapshot.rglob("*"))
            if path.is_file()
        }
    return inputs


def run_stage(name, args):
    stage = STAGES[name]
    result = args.output_dir / (name + ".json")
    status_path = args.output_dir / (name + ".status.json")
    inputs = stage_inputs(name, args.output_dir, args.cache)
    if status_path.exists():
        previous = json.loads(status_path.read_text(encoding="utf-8"))
        if (
            previous["status"] == "passed"
            and previous["inputs"] == inputs
            and result.exists()
            and previous["output_sha256"] == file_digest(result)
        ):
            print(
                {
                    "stage": name,
                    "status": "reused",
                    "output_sha256": previous["output_sha256"],
                }
            )
            return previous
        raise RuntimeError(
            "Existing stage differs or failed; preserve it and use a new output directory: "
            + name
        )
    command = [
        sys.executable,
        "-B",
        "-X",
        "utf8",
        str(ROOT / stage["program"]),
        "--output",
        str(result),
    ]
    if name == "tiny-study":
        command += ["--workdir", str(args.workdir / "tiny")]
    elif name == "trl":
        command += ["--workdir", str(args.workdir / "trl")]
    elif name == "flan":
        command += ["--cache", str(args.cache)]
    elif name == "metrics":
        command += ["--study", str(args.output_dir / "tiny-study.json")]
    emit(status_path, {"status": "running", "inputs": inputs, "command": command})
    completed = subprocess.run(
        command, cwd=ROOT, capture_output=True, text=True, encoding="utf-8"
    )
    stdout_path = args.output_dir / (name + ".stdout.txt")
    stderr_path = args.output_dir / (name + ".stderr.txt")
    stdout_path.write_text(completed.stdout, encoding="utf-8")
    stderr_path.write_text(completed.stderr, encoding="utf-8")
    status = {
        "status": (
            "passed" if completed.returncode == 0 and result.exists() else "failed"
        ),
        "inputs": inputs,
        "command": command,
        "exit_code": completed.returncode,
        "output_sha256": file_digest(result) if result.exists() else None,
        "stdout_sha256": file_digest(stdout_path),
        "stderr_sha256": file_digest(stderr_path),
    }
    emit(status_path, status)
    print(
        {"stage": name, "status": status["status"], "exit_code": completed.returncode}
    )
    if status["status"] != "passed":
        raise RuntimeError("Stage failed; see retained stdout/stderr: " + name)
    return status


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("observations"))
    parser.add_argument("--workdir", type=Path, default=Path("work"))
    parser.add_argument(
        "--stages", nargs="+", choices=list(STAGES), default=list(STAGES)
    )
    args = parser.parse_args()
    args.cache, args.output_dir, args.workdir = (
        args.cache.resolve(),
        args.output_dir.resolve(),
        args.workdir.resolve(),
    )
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.workdir.mkdir(parents=True, exist_ok=True)
    stages = {name: run_stage(name, args) for name in args.stages}
    emit(args.output_dir / "report.json", {"status": "passed", "stages": stages})


if __name__ == "__main__":
    main()
