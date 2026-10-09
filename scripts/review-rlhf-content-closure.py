"""Bounded same-reviewer closure; no scientific run() or optimizer calls."""
import ast
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback"
PUBLIC = ROOT / "public/learn/examples/rlhf"
SUCCESSOR = BASE / "content-successor"
PREVIOUS = SUCCESSOR / "predecessor"
checks = []


def check(condition, name):
    if not condition:
        raise AssertionError(name)
    checks.append(name)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


manifest = json.loads((SUCCESSOR / "inputs.json").read_text(encoding="utf-8"))
check(sha(SUCCESSOR / "inputs.json") == "ce16c6e8cce4bd9aad8f497ce1f451dc9ecaf3bf06abeb79b65efa3804e97e78", "exact final successor manifest")
for item in manifest["files"]:
    check(sha(ROOT / item["path"]) == item["sha256"], "successor input bound: " + item["path"])
original_manifest = json.loads((PREVIOUS / "content-inputs.json").read_text(encoding="utf-8"))
changes = []
for item in original_manifest["files"]:
    check(sha(PREVIOUS / item["path"]) == item["sha256"], "exact preserved predecessor: " + item["path"])
    if sha(ROOT / item["path"]) != item["sha256"]:
        changes.append(item["path"])
check(len(changes) == 5 and {Path(path).name for path in changes} == {
    "manuscript.jsx", "rlhf_study.py", "README.md", "download-manifest.json", "rlhf-programs.zip"
}, "exactly five bounded changes and 49 conserved original inputs")

old_source = (PREVIOUS / BASE.relative_to(ROOT) / "manuscript.jsx").read_text(encoding="utf-8")
new_source = (BASE / "manuscript.jsx").read_text(encoding="utf-8")
formulas = lambda source: sorted(re.findall(r"<MathBlock>(.*?)</MathBlock>", source, flags=re.S))
check(formulas(old_source) == formulas(new_source), "all exact mathematical payloads conserved")
for name in ("ReferenceTerms", "TiltedPolicy", "ScoreFunction", "TokenPath", "AdvantageTrace", "ClippedSurrogate"):
    drawing = new_source.index("<" + name + " />")
    walk = new_source.index("<Prose>", drawing)
    notation = new_source.index("<MathBlock>", drawing)
    check(drawing < walk < notation, name + " drawing and walk before notation")
for identity in re.findall(r'<Anchor id="([^"]+)"', old_source):
    check('<Anchor id="' + identity + '"' in new_source, "fragment preserved: " + identity)

with zipfile.ZipFile(PUBLIC / "rlhf-programs.zip") as archive:
    check(len(archive.namelist()) == 16, "complete archive contains 16 entries")
    for name in archive.namelist():
        check(archive.read(name) == (PUBLIC / name).read_bytes(), "exact archive entry: " + name)
for item in json.loads((PUBLIC / "download-manifest.json").read_text(encoding="utf-8"))["files"]:
    check(sha(PUBLIC / item["path"]) == item["sha256"], "download manifest source hash: " + item["path"])

sys.path.insert(0, str(PUBLIC))
spec = importlib.util.spec_from_file_location("independent_rlhf_driver", PUBLIC / "rlhf_study.py")
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)
inputs = {"source_sha256": {path.name: sha(path) for path in PUBLIC.glob("*.py")},
          "records_sha256": sha(PUBLIC / "records.json")}
scratch = ROOT / "scratch/rlhf-review"
scratch.mkdir(parents=True, exist_ok=True)
fixture = Path(tempfile.mkdtemp(prefix="guard-independent-", dir=scratch))

for stage in driver.STAGES:
    destination = fixture / (stage + ".json")
    destination.write_text('{"review_fixture":true}\n', encoding="utf-8")
    receipt_path = fixture / (stage + "-receipt.json")
    original = {"stage": stage, "status": "passed", "result_sha256": sha(destination), "inputs": copy.deepcopy(inputs)}
    receipt_path.write_text(json.dumps(original), encoding="utf-8")
    driver.verify_retained_result(stage, destination, receipt_path, inputs)
    check(True, "guard accepts exact fixture: " + stage)
    mutations = [("records", lambda d: d["inputs"].update(records_sha256="wrong")),
                 ("failed status", lambda d: d.update(status="failed")),
                 ("other stage", lambda d: d.update(stage="wrong")),
                 ("output", lambda d: d.update(result_sha256="wrong"))]
    for dependency in driver.STAGE_SOURCES[stage]:
        mutations.append(("dependency " + dependency, lambda d, dep=dependency: d["inputs"]["source_sha256"].update({dep: "wrong"})))
        mutations.append(("missing " + dependency, lambda d, dep=dependency: d["inputs"]["source_sha256"].pop(dep)))
    for name, mutate in mutations:
        changed = copy.deepcopy(original)
        mutate(changed)
        receipt_path.write_text(json.dumps(changed), encoding="utf-8")
        try:
            driver.verify_retained_result(stage, destination, receipt_path, inputs)
        except ValueError:
            check(True, "guard rejects " + name + ": " + stage)
        else:
            check(False, "guard rejects " + name + ": " + stage)

# Genuine CLI reuse with a source/data matching receipt. No run() import needed.
cli_fixture = fixture / "cli"
cli_fixture.mkdir()
destination = cli_fixture / "token_ppo.json"
destination.write_text('{"review_fixture":true}\n', encoding="utf-8")
receipt = {"stage": "token_ppo", "status": "passed", "result_sha256": sha(destination), "inputs": inputs}
(cli_fixture / "token_ppo-receipt.json").write_text(json.dumps(receipt), encoding="utf-8")
outcome = subprocess.run([sys.executable, "-B", str(PUBLIC / "rlhf_study.py"), "--stage", "token_ppo", "--output", str(cli_fixture)],
                         capture_output=True, text=True, encoding="utf-8", timeout=30)
check(outcome.returncode == 0 and "conserved existing result" in outcome.stdout, "actual CLI conserves without importing/fitting a stage")
receipt["inputs"] = copy.deepcopy(inputs)
receipt["inputs"]["source_sha256"]["causal_backbone.py"] = "changed dependency"
(cli_fixture / "token_ppo-receipt.json").write_text(json.dumps(receipt), encoding="utf-8")
outcome = subprocess.run([sys.executable, "-B", str(PUBLIC / "rlhf_study.py"), "--stage", "token_ppo", "--output", str(cli_fixture)],
                         capture_output=True, text=True, encoding="utf-8", timeout=30)
check(outcome.returncode != 0 and "causal_backbone.py" in outcome.stderr, "actual CLI fails closed on changed helper before a fit")

result = {"status": "passed", "reviewer": "multimodal_reviewer", "fits_replayed": 0,
          "count": len(checks), "checks": checks, "source_sha256": sha(Path(__file__)),
          "successor_inputs_sha256": sha(SUCCESSOR / "inputs.json"), "changed": changes,
          "fixture_path": str(fixture.relative_to(ROOT)),
          "scope": "Exact123 successor bindings, preserved54 predecessors, five-file change boundary, exact formulas/fragment/order closure, all current archive bytes, changed/null guard fixtures and actual CLI reuse/rejection. Original4458 numerical conditions and native fits reused."}
(BASE / "content-independent-closure.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: result[key] for key in ("status", "count", "fits_replayed", "source_sha256", "successor_inputs_sha256")}, indent=2))
