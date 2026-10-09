"""Preserve the MoE baseline and recount its retained evidence; never fit models."""
from pathlib import Path
import csv
import hashlib
import json
import math
import shutil

ROOT = Path(__file__).resolve().parents[1]
ID = "mixture-of-experts-transformers-moe"
RECORD = ROOT / "docs/teaching/deep-learning-beginner" / ID
BACKUP = ROOT / "docs/teaching/deep-learning-beginner/original/moe-before-reading-flow"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")


def baseline_paths():
    paths = [ROOT / "src/learn/data/topics" / f"{ID}.jsx"]
    paths.extend(ROOT / "src/learn/components/lesson-labs" / name for name in (
        "MoeLabs.jsx", "MoeFigures.jsx", "moe-labs.css"))
    paths.extend(ROOT / "src/learn/data" / name for name in ("moe-models.js", "moe-examples.json"))
    for directory in (
        ROOT / "docs/teaching/drafts" / ID,
        ROOT / "docs/teaching/deep-learning-completion" / ID,
        ROOT / "public/learn-code" / ID,
        ROOT / "public/learn-assets" / ID,
    ):
        paths.extend(p for p in directory.iterdir() if p.is_file())
    paths.extend(ROOT / "scripts" / name for name in (
        "prepare-moe-assets.py", "moe_experiments.py", "render-moe-lesson.mjs",
        "verify-moe-models.mjs", "check-moe-static-render.mjs", "review-moe-models.mjs",
        "review-moe-forward.py"))
    return sorted(set(paths))


def freeze_baseline():
    manifest_path = BACKUP / "sources.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for row in manifest["sources"]:
            assert digest(ROOT / row["path"]) == row["sha256"], row["path"]
            assert digest(ROOT / row["copy"]) == row["sha256"], row["copy"]
        return manifest
    rows = []
    for path in baseline_paths():
        relative = path.relative_to(ROOT)
        destination = BACKUP / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        assert not destination.exists(), destination
        shutil.copyfile(path, destination)
        rows.append({"path": relative.as_posix(), "copy": destination.relative_to(ROOT).as_posix(),
                     "sha256": digest(path), "bytes": path.stat().st_size})
    manifest = {"topic": ID, "scope": "Immutable pre-edit baseline; author preservation, not lesson acceptance",
                "sources": rows}
    save_json(manifest_path, manifest)
    return manifest


def close(actual, expected, tolerance=1e-12):
    assert math.isclose(actual, expected, abs_tol=tolerance, rel_tol=tolerance), (actual, expected)


def run():
    manifest = freeze_baseline()
    historical = json.loads((ROOT / "docs/teaching/deep-learning-completion" / ID /
                             "independent-checks.json").read_text(encoding="utf-8"))
    hashes = historical.get("sourceHashes", historical.get("hashes", {}))
    if not hashes:
        hashes = next(v for v in historical.values() if isinstance(v, dict) and
                      any(str(k).endswith(".py") for k in v))
    matches, differences = [], []
    for name, expected in hashes.items():
        path = ROOT / name
        if path.is_file():
            (matches if digest(path) == expected else differences).append(name)
    scientific = [row for row in manifest["sources"] if (
        row["path"].startswith("public/learn-") or
        row["path"] in ("src/learn/data/moe-models.js", "src/learn/data/moe-examples.json") or
        row["path"].startswith(f"docs/teaching/drafts/{ID}/") and
        Path(row["path"]).name in ("moe_study.py", "moe_calculations.py", "fitted-models.json",
                                   "study-results.json", "calculated-inputs.json", "optical-digits.csv"))]
    for row in scientific:
        assert row["path"] in matches, ("Scientific historical raw binding missing", row["path"])
    study = json.loads((ROOT / "docs/teaching/drafts" / ID / "study-results.json").read_text())
    examples = json.loads((ROOT / "src/learn/data/moe-examples.json").read_text())
    runs = study["runs"]
    assert len(runs) == 12
    assert examples["study"] == runs
    history_points = 0
    correct_rows = 0
    for run in runs:
        assert len(run["curve"]) == 13
        history_points += len(run["curve"])
        selected = min(run["curve"], key=lambda p: p["validation_ce_after"])
        assert run["selected_step"] == selected["step"]
        close(run["measurements"]["validation"]["cross_entropy"], selected["validation_ce_after"])
        assert run["parameters"] == (3162 if run["condition"] == "dense" else 4762)
        for role, measurement in run["measurements"].items():
            confusion = measurement["confusion"]
            expected_count = {"fit": 500, "validation": 150, "assessment": 300,
                              "assessment_lower_half_zero": 300}[role]
            assert sum(map(sum, confusion)) == measurement["count"] == expected_count
            assert sum(confusion[i][i] for i in range(10)) == measurement["correct"]
            correct_rows += 1
            if run["condition"] != "dense":
                assert sum(measurement["route_counts"]) == expected_count * 16 * 2
                class_counts = measurement["class_route_counts"]
                assert [sum(row[e] for row in class_counts) for e in range(4)] == measurement["route_counts"]
                for c in range(10):
                    assert sum(class_counts[c]) == sum(confusion[c]) * 16 * 2
    with (ROOT / "docs/teaching/drafts" / ID / "optical-digits.csv").open(newline="") as stream:
        data = list(csv.DictReader(stream))
    assert len(data) == 950
    assert {role: sum(row["role"] == role for row in data) for role in
            ("fit", "validation", "assessment")} == {"fit": 500, "validation": 150, "assessment": 300}
    # Independent design arithmetic; no runtime helper or writer imports.
    checks = {}
    checks["selected_mixture"] = [4 / 3, 1]
    checks["retained_full_mixture"] = [8 / 7, 6 / 7]
    close((2 / 3) * (2 - 7 / 3), -2 / 9)
    close(2 * (.75 * .38275 + .25 * .61725), .88275)
    close(3 * 64 * 128 * 8, 196608)
    close(3 * 64 * 128 * 2, 49152)
    close(2 * 32 * 2 * 64 * 2, 16384)
    close(.25 * 2 + .75 * -1, -.25)
    close(.25 * 1 + .75 * 3, 2.5)
    close((5 / 8) * (5 - 19 / 8), 105 / 64)
    close((3 / 8) * (-2 - 19 / 8), -105 / 64)
    checks["noisy_load_probability"] = .5 * (1 + math.erf(-1 / math.sqrt(2)))
    close(checks["noisy_load_probability"], .15865525393145707)
    # X=I2, Phi=log([[3,1],[1,3]]); one slot/expert, experts I and 2I.
    dispatch = [[.75, .25], [.25, .75]]
    slots = [[.75, .25], [.25, .75]]
    slot_outputs = [slots[0], [2 * v for v in slots[1]]]
    soft_outputs = [[sum(dispatch[t][e] * slot_outputs[e][j] for e in range(2))
                     for j in range(2)] for t in range(2)]
    assert soft_outputs == [[.6875, .5625], [.5625, 1.1875]]
    checks["soft_slots"] = {"input": [[1, 0], [0, 1]], "dispatch_and_combine": dispatch,
                            "slot_outputs": slot_outputs, "output": soft_outputs}
    assert 2 + 2.9 > 3 + 0
    checks["balanced_assignment"] = {"greedy": [0, 0], "best_balanced": [1, 0], "total": 4.9}
    result = {"topic": ID, "status": "PASS", "authorEvidence": True,
              "limits": "Read-only baseline/recounts/constructed arithmetic; no fits/native model replay/browser or independent review",
              "baselineManifest": {"path": (BACKUP / "sources.json").relative_to(ROOT).as_posix(),
                                   "sha256": digest(BACKUP / "sources.json")},
              "baselineCopies": len(manifest["sources"]), "scientificRawMatches": len(scientific),
              "historicalRawMatches": matches, "historicalPresentationDifferences": differences,
              "retainedRuns": 12, "historyPoints": history_points, "confusionRecounts": correct_rows,
              "dataRows": 950, "designArithmetic": checks}
    save_json(RECORD / "reading-flow-baseline.json", result)
    print(json.dumps({k: result[k] for k in ("status", "baselineCopies", "scientificRawMatches",
                                           "retainedRuns", "historyPoints", "confusionRecounts")}, indent=2))


if __name__ == "__main__":
    run()
