"""Run each frozen study stage once and conserve only verified prior outputs.

python -B trl_dpo.py --prepare-only --selection selection.json
python -B dpo_study.py --freeze
python -B dpo_study.py --output-dir dpo-observations
Requires the environment in requirements.txt. Preparation must precede fitting.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent
INPUT_NAMES = ["pair_records.py", "dpo_algebra.py", "response_scores.py", "scratch_dpo.py",
               "reference_cache.py", "trl_dpo.py", "dpo_study.py", "causal_backbone.py",
               "records.json", "selection.json", "study-protocol.md", "requirements.txt",
               "backbone-provenance.json", "HH-LICENSE.txt"]
PACKAGES = ("torch", "transformers", "trl", "datasets", "tokenizers", "numpy", "accelerate")
STAGES = {"algebra": "dpo_algebra.py", "response": "response_scores.py",
          "cache": "reference_cache.py", "scratch": "scratch_dpo.py", "native": "trl_dpo.py"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def current_inputs():
    return {"files": {name: sha(ROOT / name) for name in INPUT_NAMES},
            "packages": {name: importlib.metadata.version(name) for name in PACKAGES}}


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def verify_retained(stage, receipt, output, inputs):
    if receipt.get("stage") != stage or receipt.get("status") != "passed":
        raise ValueError("A failed, incomplete or different stage cannot be conserved")
    if receipt.get("inputs") != inputs:
        raise ValueError("Scientific sources, data, protocol or environment changed")
    if not output.is_file() or receipt.get("output_sha256") != sha(output):
        raise ValueError("Retained result bytes differ or are missing")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=Path("dpo-observations"))
    parser.add_argument("--stage", choices=list(STAGES))
    args = parser.parse_args()
    inputs = current_inputs()
    freeze_path = ROOT / "study-protocol-freeze.json"
    if args.freeze:
        if freeze_path.exists():
            raise ValueError("A freeze already exists; preserve it and use an explicit new study for changed science")
        save(freeze_path, {"frozen_at": datetime.now(timezone.utc).isoformat(), "inputs": inputs,
                           "meaning": "Prospective source/data/budget freeze; no completed result implied"})
        print("Prospective study inputs frozen")
        return
    frozen = json.loads(freeze_path.read_text(encoding="utf-8"))
    if frozen["inputs"] != inputs:
        raise ValueError("Inputs differ from the prospective freeze; no stage has run")
    destination = args.output_dir.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    for stage, filename in STAGES.items():
        if args.stage and stage != args.stage:
            continue
        output = destination / (stage + "-results.json")
        receipt_path = destination / (stage + "-receipt.json")
        log = destination / (stage + ".log")
        if receipt_path.exists():
            verify_retained(stage, json.loads(receipt_path.read_text(encoding="utf-8")), output, inputs)
            print("Conserved verified result:", stage)
            continue
        if output.exists() or log.exists():
            raise ValueError("Unbound prior outputs exist; preserve them and choose a new output directory")
        command = [sys.executable, "-B", "-X", "utf8", str(ROOT / filename), "--output", str(output)]
        if stage == "native":
            command += ["--selection", str(ROOT / "selection.json"), "--workdir", str(destination / "native-work")]
        receipt = {"stage": stage, "status": "running", "inputs": inputs, "command": command,
                   "started_at": datetime.now(timezone.utc).isoformat(), "protocol_freeze_sha256": sha(freeze_path)}
        save(receipt_path, receipt)
        environment = dict(os.environ)
        environment["PYTHONPATH"] = os.pathsep.join(str(value) for value in sys.path if value)
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        started = time.perf_counter()
        with log.open("w", encoding="utf-8") as stream:
            process = subprocess.run(command, cwd=destination, env=environment, stdout=stream,
                                     stderr=subprocess.STDOUT, text=True, check=False)
        receipt.update({"exit_code": process.returncode, "elapsed_seconds": time.perf_counter() - started,
                        "log_sha256": sha(log), "status": "passed" if process.returncode == 0 and output.exists() else "failed"})
        if output.exists():
            receipt["output_sha256"] = sha(output)
        save(receipt_path, receipt)
        print(stage, receipt["status"], flush=True)
        if receipt["status"] != "passed":
            raise RuntimeError("Stage failed; its receipt and log are retained: " + stage)


if __name__ == "__main__":
    main()
