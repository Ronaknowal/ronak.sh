"""Source-bound native checks for JAX, TensorFlow/Keras and tracking lessons.

Run with the documented isolated CPU environment. --topic selects the affected
native program group. Each result records current canonical source hashes.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TRACKING = "experiment-tracking-tools-weights-biases-mlflow-neptune"


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def store_contracts():
    source = ROOT / "public/learn-code" / TRACKING / "portable_run_store.py"
    spec = importlib.util.spec_from_file_location("portable_run_store", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with tempfile.TemporaryDirectory(dir=ROOT / "scratch") as folder:
        root = Path(folder)
        store = module.RunStore(root)
        identifier = store.begin({"rate": .1}, "fixture")
        assert store.begin({"rate": .1}, identifier) == identifier
        def rejects(operation):
            try:
                operation()
            except ValueError:
                return
            raise AssertionError("Expected rejection")
        rejects(lambda: store.begin({"rate": .2}, identifier))
        store.metric(identifier, "loss", 1, .25)
        store.metric(identifier, "loss", 1, .25)
        rejects(lambda: store.metric(identifier, "loss", 1, .2))
        rejects(lambda: store.metric(identifier, "loss", -1, .2))
        rejects(lambda: store.metric(identifier, "loss", 2, float("nan")))
        assert store.history(identifier, "loss") == [(1, .25)]
        store.close()
        store = module.RunStore(root)
        assert store.begin({"rate": .1}, identifier) == identifier
        checkpoint = root / "checkpoint.json"
        checkpoint.write_text('{"w":0.5}', encoding="utf-8")
        identity = store.artifact(identifier, "checkpoint", checkpoint)
        checkpoint.write_text('{"w":99}', encoding="utf-8")
        assert (store.objects / identity).read_text() == '{"w":0.5}'
        rejects(lambda: store.artifact(identifier, "checkpoint", checkpoint))
        manifest = store.export(identifier, root / "export.json")
        assert manifest["artifacts"]["checkpoint"] == identity
        store.finish(identifier)
        rejects(lambda: store.metric(identifier, "loss", 2, .1))
        rejects(lambda: store.begin({"rate": .1}, identifier))
        (store.objects / identity).write_bytes(b"corrupt")
        rejects(lambda: store.export(identifier, root / "bad.json"))
        store.close()
    return {"config_immutability": True, "retry_idempotency": True,
            "conflict_rejection": True, "nonfinite_negative_rejection": True,
            "reopen_running_run": True, "terminal_write_rejection": True,
            "captured_bytes_survive_original_overwrite": True, "corrupt_export_rejection": True}


def execute(topic, filenames):
    folder = ROOT / "public/learn-code" / topic
    results = {}
    environment = dict(os.environ, TF_CPP_MIN_LOG_LEVEL="3", MLFLOW_DISABLE_AGENT_HINT="1",
                       PYTHONDONTWRITEBYTECODE="1")
    for filename in filenames:
        command = [sys.executable, str(folder / filename)]
        if filename == "tracking_library_bridge.py":
            command.append(str(ROOT / "scratch/framework-tracking-verification"))
        completed = subprocess.run(command, cwd=ROOT, env=environment, capture_output=True, text=True, timeout=180)
        if completed.returncode:
            raise RuntimeError(f"{filename}:\n{completed.stdout}\n{completed.stderr}")
        start = completed.stdout.find("{\n")
        results[filename] = json.loads(completed.stdout[start:])
    if topic == TRACKING:
        results["store_contracts"] = store_contracts()
    record = {"scope": topic, "kind": "author-native-verification", "python": sys.version,
              "platform": sys.platform, "executed": results,
              "source_files": {str(path.relative_to(ROOT)).replace('\\', '/'): file_hash(path)
                               for path in sorted(folder.glob("*.py"))},
              "limits": "CPU/local execution. No browser, independent review, accelerator benchmark or remote service validation."}
    destination = ROOT / "docs/teaching/core-frameworks" / topic / "native-evidence.json"
    destination.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(f"{topic}: {len(filenames)} native programs passed; {destination.relative_to(ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", choices=["jax", "tensorflow-keras", TRACKING], required=True)
    selected = parser.parse_args().topic
    programs = {"jax": ["jax_functional_training.py", "jax_transform_diagnostics.py"],
                "tensorflow-keras": ["tensorflow_keras_training.py", "tensorflow_tape_diagnostics.py", "keras_custom_fit.py"],
                TRACKING: ["tracking_library_bridge.py"]}
    execute(selected, programs[selected])
