"""Author content checks on immutable PRM inputs and retained results; no fits."""

import ast
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import zipfile

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
PUBLIC = ROOT / "public/learn-code/process-reward-models"
sys.path.insert(0, str(PUBLIC))
from prm_classifier import features, load_splits, metrics, objective_gradient, signed_features, softmax
from prm_records import extract


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    checks = []

    def check(name, condition):
        checks.append({"name": name, "passed": bool(condition)})
        if not condition:
            raise AssertionError(name)

    freeze = json.loads((BASE / "study/prospective-inputs.json").read_text())
    for relative, item in freeze["files"].items():
        check(f"prospective identity {relative}", digest(ROOT / relative) == item["sha256"])
    check("published original conserved", digest(ROOT / "src/learn/data/topics/prm-vs-orm.jsx") ==
          "89043f5f944045aab5b288afc3754cd61b90394ab3e3064763a81e1d51a84dc1")
    programs = sorted(PUBLIC.glob("prm_*.py"))
    check("seven complete program mains", len(programs) == 7)
    for path in programs:
        tree = ast.parse(path.read_text(encoding="utf8"))
        check(f"actual main {path.name}", any(isinstance(node, ast.FunctionDef) and
                                                node.name == "main" for node in tree.body))
    lesson = (BASE / "lesson.md").read_text(encoding="utf8")
    check("all thirteen complete sections", sum(line.startswith("## ") for line in lesson.splitlines()) == 13)
    check("all fourteen worked solutions", lesson.count("**Solution.**") == 14)
    for index in range(1, 30):
        check(f"mechanism placement D{index:02}", f"<!-- D{index:02} " in lesson)
    for path in programs:
        check(f"complete visible program placement {path.name}", f"<!-- PROGRAM {path.name}:" in lesson)

    examples, matrices = load_splits(BASE / "study/data")
    identity_sets = {name: {e["problem_id"] for e in rows} for name, rows in examples.items()}
    check("split problem counts", [len(identity_sets[n]) for n in examples] == [96, 32, 48])
    check("split example counts", [len(examples[n]) for n in examples] == [918, 290, 524])
    check("train/test disjoint", not identity_sets["train"] & identity_sets["test"])
    check("validation/test disjoint", not identity_sets["validation"] & identity_sets["test"])
    check("train/validation disjoint", not identity_sets["train"] & identity_sets["validation"])
    model = json.loads((BASE / "study/model.json").read_text())
    results = json.loads((BASE / "study/results.json").read_text())
    predictions = json.loads((BASE / "study/predictions.json").read_text())
    check("one fixed declared fit", results["study_fits"] == 1 and results["updates"] == 160)
    weights, bias = np.array(model["weights"]), np.array(model["bias"])
    check("head shapes", weights.shape == (1024, 3) and bias.shape == (3,))
    sources = {name: [json.loads(line) for line in (BASE / "research/primary" /
               f"prm800k-phase2_{name}.jsonl.prefix").read_text().splitlines()]
               for name in ("train", "test")}
    for split, rows in examples.items():
        x, y = matrices[split]
        logits = x @ weights + bias
        probabilities = softmax(logits)
        check(f"all retained {split} probabilities", np.allclose(probabilities,
              [p["probabilities"] for p in predictions[split]], atol=1e-14, rtol=1e-14))
        measured = metrics(probabilities, y, logits)
        expected_metrics = results["checkpoints"][-1]["metrics"][split]
        check(f"all retained {split} final counts", all(measured[key] == expected_metrics[key]
              for key in ("examples", "confusion", "class_counts")))
        check(f"all retained {split} final metrics", all(np.isclose(measured[key], expected_metrics[key],
              atol=1e-12, rtol=1e-12) for key in ("accuracy", "cross_entropy", "brier")))
        for index, example in enumerate(rows):
            address = example["source"]
            source = sources["test" if split == "test" else "train"][address["record"]]
            steps = source["label"]["steps"]
            original = steps[address["step"]]["completions"][address["alternative"]]
            expected_prefix = [step["completions"][step["chosen_completion"]]["text"]
                               for step in steps[:address["step"]]]
            check(f"{split} example{index} exact chosen-prefix source", example["prefix_steps"] == expected_prefix)
            check(f"{split} example{index} target source", example["current_step"] == original["text"] and
                  example["upstream_rating"] == original["rating"] and example["class_id"] == original["rating"] + 1)
            check(f"{split} example{index} actual grouping identity", example["problem_id"] ==
                  hashlib.sha256(example["question"].encode()).hexdigest())

    # A changed data fixture exposes the branch bug a source-shaped test misses.
    fixture = {"question": {"problem": "Fixture"}, "label": {"finish_reason": "found_error", "steps": [
        {"completions": [{"text": "chosen", "rating": 1}, {"text": "sibling", "rating": -1}], "chosen_completion": 0},
        {"completions": [{"text": "next", "rating": 0}], "chosen_completion": None},
        {"completions": [{"text": "after missing", "rating": 1}], "chosen_completion": 0}]}}
    scratch = ROOT / "scratch/process-reward-models"
    if not scratch.resolve().is_relative_to(ROOT.resolve()):
        raise ValueError("Fixture workspace escaped repository")
    scratch.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=scratch, prefix="extract-contract-") as directory:
        check("fixture cleanup target inside own workspace", Path(directory).resolve().is_relative_to(scratch.resolve()))
        path = Path(directory) / "fixture.jsonl"
        path.write_text(json.dumps(fixture) + "\n")
        grouped, info = extract(path, "fixture")
        rows = next(iter(grouped.values()))
        check("sibling prefix before selected extension", rows[0]["prefix_steps"] == rows[1]["prefix_steps"] == [])
        check("only chosen branch extends", rows[2]["prefix_steps"] == ["chosen"])
        check("missing continuation blocks later inclusion", len(rows) == 3 and
              info["counts"]["reject_unknown_or_invalid_prefix"] == 1)
    check("order loss explicit", np.array_equal(signed_features("x + 3"), signed_features("3 + x")))
    altered = dict(examples["test"][0], class_id=0, problem_id="changed", upstream_rating=-1)
    check("labels and IDs never enter features", np.array_equal(features(altered), features(examples["test"][0])))
    initial = np.array(model["initial_weights"])
    x, y = matrices["train"]
    small_x, small_y = x[:11], y[:11]
    _, dw, _ = objective_gradient(small_x, small_y, initial, np.zeros(3))
    row, column, epsilon = 3, 1, 1e-6
    plus, minus = initial.copy(), initial.copy()
    plus[row, column] += epsilon
    minus[row, column] -= epsilon
    finite = (objective_gradient(small_x, small_y, plus, np.zeros(3))[0] -
              objective_gradient(small_x, small_y, minus, np.zeros(3))[0]) / (2 * epsilon)
    check("changed-batch analytic gradient", np.isclose(finite, dw[row, column], atol=1e-9))
    check("actual weak result retained", results["checkpoints"][-1]["metrics"]["test"]["cross_entropy"] >
          results["baseline"]["test"]["cross_entropy"])
    check("actual neutral failure retained", results["checkpoints"][-1]["metrics"]["test"]["confusion"][1][1] == 0)
    for kind, correct in (("correct", True), ("failure", False)):
        inspection = model["inspection"][kind]
        check(f"true {kind} inspection", (inspection["output"]["class_id"] == inspection["output"]["prediction"]) == correct)
    manifest = json.loads((PUBLIC / "download-manifest.json").read_text())
    with zipfile.ZipFile(PUBLIC / "prm-programs-data.zip") as bundle:
        for relative, item in manifest["files"].items():
            path = PUBLIC / relative
            check(f"archive exact {relative}", bundle.read(relative) == path.read_bytes() and digest(path) == item["sha256"])
    inputs = [BASE / "lesson.md", BASE / "visual-specifications.md", *programs,
              BASE / "study/prospective-inputs.json", BASE / "study/results.json",
              BASE / "study/model.json", BASE / "study/predictions.json",
              *sorted((BASE / "study/data").glob("*")), PUBLIC / "prm-programs-data.zip"]
    output = {"checks": checks, "passed": len(checks), "scientific_fits": 0,
              "inputs": {str(path.relative_to(ROOT)).replace("\\", "/"): digest(path) for path in inputs},
              "script_sha256": digest(__file__), "scope": "Author source/data/probability/changed-contract review; no browser acceptance"}
    destination = BASE / "content-author-checks-final.json"
    destination.write_text(json.dumps(output, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"passed": len(checks), "scientific_fits": 0, "report": str(destination)}, indent=2))


if __name__ == "__main__":
    main()
