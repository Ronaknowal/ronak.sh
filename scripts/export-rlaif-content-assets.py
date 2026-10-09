"""Export completed immutable observations and a deterministic public bundle."""

import hashlib
import json
from pathlib import Path
import zipfile


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
EVIDENCE = TOPIC / "native-evidence"
OBSERVATIONS = PUBLIC / "observations"
OBSERVATIONS.mkdir(exist_ok=True)
STAGES = ["records", "losses", "finite", "feedback", "loop", "judge", "training", "native"]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


bindings = []
for stage in STAGES:
    source = EVIDENCE / (stage + "-results.json")
    receipt_path = EVIDENCE / (stage + "-receipt.json")
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    assert receipt["status"] == "passed" and receipt["result_sha256"] == digest(source)
    destination = OBSERVATIONS / source.name
    destination.write_bytes(source.read_bytes())
    assert digest(destination) == digest(source)
    bindings.append({"stage": stage, "result_sha256": digest(source),
                     "receipt_sha256": digest(receipt_path), "bytes": source.stat().st_size})

freeze_path = EVIDENCE / "prospective-freeze.json"
binding = {
    "kind": "retained actual observations; no execution or fitting during export",
    "prospective_freeze_sha256": digest(freeze_path),
    "stages": bindings,
    "limits": "Proxy labels, small lexical model, fixed study; no generations or human study.",
}
(OBSERVATIONS / "execution-binding.json").write_text(
    json.dumps(binding, indent=2) + "\n", encoding="utf-8")

descriptions = {
    "records_and_masks.py": "Full released records, lexical vocabulary and aligned target masks",
    "judge_labels.py": "Actual pinned Flan complete-option inference and mapped order/rating scores",
    "feedback_learning.py": "Soft-label reward-head fit and gradient audit",
    "rlaif_loop.py": "Two finite-action REINFORCE traces using detached rewards and fixed reference",
    "preference_losses.py": "IPO/ORPO loss, derivative, stability and shared-weight calculations",
    "finite_preferences.py": "Published matrix, noisy-label optimum and missing-support calculation",
    "compare_training.py": "All fifteen declared small language-model fits and paired evaluation",
    "trl_methods.py": "Actual native IPO/ORPO batch, loss, all-gradient and one-update contracts",
    "run_all.py": "Prospective preparation and transitive source/result-bound execution or reuse",
    "causal_backbone.py": "Verbatim inspected causal-model dependency, attribution in provenance",
    "response_scores.py": "Verbatim inspected response-score dependency",
    "records.json": "Complete original selected source rows, not substituted examples",
    "selection.json": "Deterministic selection and exclusion audit",
    "provenance.json": "Source/data/dependency identities and reuse limits",
    "UltraFeedback-LICENSE.txt": "Exact upstream MIT attribution and license",
    "requirements.txt": "Pinned execution dependencies",
    "study-protocol.md": "Prospectively declared budgets, masks, schedules and interpretation limits",
    "README.md": "Local setup and complete reproduction commands",
}
lines = ["# RLAIF, IPO and ORPO file index", "",
         "Download the [complete directory](rlaif-methods-programs.zip), then read the "
         "[setup README](README.md). All nine main programs are complete. Their shared "
         "dependencies and original data must stay alongside them.", "",
         "| File | Purpose |", "| --- | --- |"]
for name, description in descriptions.items():
    assert (PUBLIC / name).is_file()
    lines.append(f"| [{name}]({name}) | {description} |")
lines += ["", "## Retained actual observations", "",
          "These files preserve the executed results exactly. The browser reads these "
          "observations; it does not fit a model. All three training seeds and terminal "
          "outcomes remain present. Weight files, environments, inference caches and "
          "generated trainer directories are excluded from this public bundle.", "",
          "| Observation | Evidence |", "| --- | --- |"]
for stage in STAGES:
    name = stage + "-results.json"
    lines.append(f"| [{name}](observations/{name}) | Actual {stage} stage output |")
lines += ["| [execution-binding.json](observations/execution-binding.json) | "
          "Prospective freeze and source receipt/result hashes |", "",
          "[download-manifest.json](download-manifest.json) gives payload hashes and byte "
          "lengths. Archive HTTP retrieval and a browser's native download event are "
          "separate delivery checks; individual files remain directly accessible.", ""]
(PUBLIC / "FILES.md").write_text("\n".join(lines), encoding="utf-8")

paths = sorted([PUBLIC / name for name in descriptions] +
               [PUBLIC / "FILES.md"] + list(OBSERVATIONS.glob("*.json")))
assert all(path.resolve().is_relative_to(PUBLIC.resolve()) for path in paths)
manifest = {
    "kind": "complete code, data, attribution, protocol and actual observations",
    "files": [{"path": path.relative_to(PUBLIC).as_posix(), "sha256": digest(path),
               "bytes": path.stat().st_size} for path in paths],
    "excluded": ["model weights", "environment", "inference model cache", "trainer output directories"],
}
manifest_path = PUBLIC / "download-manifest.json"
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
paths.append(manifest_path)
archive = PUBLIC / "rlaif-methods-programs.zip"
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in paths:
        info = zipfile.ZipInfo(path.relative_to(PUBLIC).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        bundle.writestr(info, path.read_bytes())
with zipfile.ZipFile(archive) as bundle:
    assert len(bundle.namelist()) == len(paths)
    for path in paths:
        assert bundle.read(path.relative_to(PUBLIC).as_posix()) == path.read_bytes()
result = {
    "status": "passed", "scientific_reexecution": False, "files": len(paths),
    "archive": {"path": archive.relative_to(ROOT).as_posix(), "sha256": digest(archive),
                "bytes": archive.stat().st_size},
    "manifest_sha256": digest(manifest_path), "exported_stages": bindings,
}
(TOPIC / "content-assets.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in result.items() if k != "exported_stages"}, indent=2))
