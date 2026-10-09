"""Prospective preparation, once-run stages and exact conservative reuse.

python -B run_all.py --prepare --output-dir runs --cache model-cache
python -B run_all.py --output-dir runs --cache model-cache --stage all
Install requirements.txt first. Preparation performs no inference or fitting.
"""

import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys

from records_and_masks import digest_file, emit, ROOT


PACKAGES = ["torch", "transformers", "trl", "datasets", "tokenizers", "numpy", "accelerate", "sentencepiece"]
COMMON = ["records_and_masks.py", "response_scores.py", "records.json", "selection.json", "provenance.json",
          "requirements.txt", "study-protocol.md"]
STAGES = {
    "records": {"program": "records_and_masks.py", "dependencies": [], "sources": []},
    "losses": {"program": "preference_losses.py", "dependencies": [], "sources": []},
    "finite": {"program": "finite_preferences.py", "dependencies": [], "sources": []},
    "feedback": {"program": "feedback_learning.py", "dependencies": [], "sources": []},
    "loop": {"program": "rlaif_loop.py", "dependencies": ["feedback"], "sources": []},
    "judge": {"program": "judge_labels.py", "dependencies": [], "sources": ["judge-prepared.json"]},
    "training": {"program": "compare_training.py", "dependencies": ["records"],
                 "sources": ["causal_backbone.py", "preference_losses.py", "prepared-inputs.json"]},
    "native": {"program": "trl_methods.py", "dependencies": ["records", "losses"],
               "sources": ["preference_losses.py"]},
}


def versions():
    return {name: importlib.metadata.version(name) for name in PACKAGES}


def write_once(path, value):
    """A prospective input cannot be silently replaced by a changed preparation."""
    if path.exists():
        assert json.loads(path.read_text(encoding="utf-8")) == value, f"Existing preparation changed: {path}"
    else:
        emit(path, value)


def source_binding(name, output_dir):
    path = output_dir / name if name in ["prepared-inputs.json", "judge-prepared.json"] else ROOT / name
    return {"sha256": digest_file(path), "bytes": path.stat().st_size}


def model_bindings(cache):
    from judge_labels import REVISION
    snapshot = cache / "models--google--flan-t5-small" / "snapshots" / REVISION
    if not snapshot.is_dir():
        raise ValueError("Pinned Flan snapshot is missing; download it during preparation, before outcomes")
    files = {path.relative_to(snapshot).as_posix(): {"sha256": digest_file(path), "bytes": path.stat().st_size}
             for path in sorted(snapshot.rglob("*")) if path.is_file()}
    if not any(name.endswith(".safetensors") or name.endswith("pytorch_model.bin") for name in files):
        raise ValueError("Pinned model weight file is missing from the prepared snapshot")
    return {"model": "google/flan-t5-small", "revision": REVISION, "files": files}


def prepare(output_dir, cache, local_only):
    from compare_training import prepared_inputs
    from judge_labels import MODEL, REVISION, prepare_inputs
    from huggingface_hub import snapshot_download
    from transformers import AutoTokenizer
    output_dir.mkdir(parents=True, exist_ok=True)
    freeze_path = output_dir / "prospective-freeze.json"
    if freeze_path.exists():
        raise ValueError("Prospective freeze exists; preserve it and use a named amendment directory for corrections")
    write_once(output_dir / "prepared-inputs.json", prepared_inputs())
    # This obtains exact model/tokenizer bytes; no forward pass or inference occurs.
    snapshot_download(MODEL, revision=REVISION, cache_dir=str(cache), local_files_only=local_only,
                      allow_patterns=["config.json", "generation_config.json", "model.safetensors", "pytorch_model.bin",
                                      "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "spiece.model"])
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, cache_dir=str(cache), local_files_only=True)
    _, judge_plan = prepare_inputs(tokenizer)
    write_once(output_dir / "judge-prepared.json", judge_plan)
    sources = {path.name for path in ROOT.glob("*.py")}
    sources.update(COMMON + ["README.md", "UltraFeedback-LICENSE.txt", "prepared-inputs.json", "judge-prepared.json"])
    freeze = {"kind": "Prospective exact input freeze; no outcomes observed",
              "frozen_at": datetime.now(timezone.utc).isoformat(), "versions": versions(),
              "files": {name: source_binding(name, output_dir) for name in sorted(sources)},
              "model": model_bindings(cache), "fit_budget": {"real_data": 15, "finite_traces": 3, "native_updates": 2},
              "judge_budget": {"pairs_both_orders": 4, "single_responses_rated": 2},
              "terminal_rule": "Fixed steps and all three seeds; preserve negative outcomes"}
    emit(freeze_path, freeze)
    print({"freeze": str(freeze_path), "sha256": digest_file(freeze_path), "fits": 0, "inference": 0})


def validate_freeze(output_dir, cache):
    path = output_dir / "prospective-freeze.json"
    freeze = json.loads(path.read_text(encoding="utf-8"))
    assert versions() == freeze["versions"], "Native dependency versions changed"
    for name, expected in freeze["files"].items():
        assert source_binding(name, output_dir) == expected, "Prospective input changed: " + name
    assert model_bindings(cache) == freeze["model"], "Pinned judge weights/tokenizer changed"
    return freeze, digest_file(path)


def stage_inputs(name, output_dir, freeze, freeze_sha):
    stage = STAGES[name]
    files = COMMON + [stage["program"], "run_all.py"] + stage["sources"]
    return {"sources": {filename: freeze["files"][filename] for filename in sorted(set(files))},
            "versions": freeze["versions"], "prospective_freeze_sha256": freeze_sha,
            "model": freeze["model"] if name == "judge" else None}


def checked_receipt(name, output_dir, inputs, dependencies):
    path = output_dir / f"{name}-receipt.json"
    if not path.exists():
        return None
    receipt = json.loads(path.read_text(encoding="utf-8"))
    assert receipt["status"] == "passed", "Retained failed stage requires a declared correction: " + name
    assert receipt["inputs"] == inputs and receipt["dependencies"] == dependencies, "Stale stage input: " + name
    result_path = output_dir / f"{name}-results.json"
    assert digest_file(result_path) == receipt["result_sha256"], "Result bytes changed: " + name
    return receipt


def run_stage(name, output_dir, cache, freeze, freeze_sha):
    dependencies = {}
    for dependency in STAGES[name]["dependencies"]:
        receipt = run_stage(dependency, output_dir, cache, freeze, freeze_sha)
        dependencies[dependency] = {"receipt_sha256": digest_file(output_dir / f"{dependency}-receipt.json"),
                                    "result_sha256": receipt["result_sha256"]}
    inputs = stage_inputs(name, output_dir, freeze, freeze_sha)
    existing = checked_receipt(name, output_dir, inputs, dependencies)
    if existing is not None:
        print(name, "reused exact passed result", flush=True)
        return existing
    program = ROOT / STAGES[name]["program"]
    result_path = output_dir / f"{name}-results.json"
    command = [sys.executable, "-B", "-X", "utf8", str(program), "--output", str(result_path)]
    if name == "loop":
        command += ["--feedback", str(output_dir / "feedback-results.json")]
    elif name == "judge":
        command += ["--cache", str(cache), "--local-only", "--plan", str(output_dir / "judge-prepared.json")]
    elif name == "training":
        command += ["--plan", str(output_dir / "prepared-inputs.json"), "--states", str(output_dir / "states")]
    elif name == "native":
        command += ["--workdir", str(output_dir / "native-trainer")]
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    # Preserve the explicitly selected package runtime in the child process.
    environment["PYTHONPATH"] = os.pathsep.join(str(Path(path).resolve()) for path in sys.path if path)
    completed = subprocess.run(command, cwd=ROOT, env=environment, capture_output=True, text=True, encoding="utf-8")
    receipt = {"stage": name, "status": "passed" if completed.returncode == 0 else "failed",
               "inputs": inputs, "dependencies": dependencies, "command": command,
               "exit_code": completed.returncode, "stdout": completed.stdout, "stderr": completed.stderr,
               "result_sha256": digest_file(result_path) if result_path.exists() else None}
    emit(output_dir / f"{name}-receipt.json", receipt)
    print(completed.stdout, end="", flush=True)
    if completed.returncode != 0:
        raise RuntimeError(f"Stage {name} failed; its receipt is preserved for diagnosis")
    return receipt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=Path("runs"))
    parser.add_argument("--cache", type=Path, default=Path("model-cache"))
    parser.add_argument("--local-only", action="store_true")
    parser.add_argument("--stage", choices=["all"] + list(STAGES), default="all")
    args = parser.parse_args()
    output_dir, cache = args.output_dir.resolve(), args.cache.resolve()
    if args.prepare:
        prepare(output_dir, cache, args.local_only)
        return
    freeze, freeze_sha = validate_freeze(output_dir, cache)
    requested = list(STAGES) if args.stage == "all" else [args.stage]
    for name in requested:
        run_stage(name, output_dir, cache, freeze, freeze_sha)
    validate_freeze(output_dir, cache)
    print({"completed": requested, "prospective_freeze_sha256": freeze_sha})


if __name__ == "__main__":
    main()
