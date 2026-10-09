"""Verify and freeze whole authored content without scientific replay."""
import ast
import hashlib
import json
import math
import re
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / "docs/teaching/llm-architecture-training/inference-engines-serving"
public = root / "public/learn/examples/inference-engines"
scratch = root / "scratch/inference-engines-research"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    return json.loads(path.read_text(encoding="utf8"))


lesson = (topic / "lesson.md").read_text(encoding="utf8")
sections = re.findall(r"^## (\d+)\. (.+)$", lesson, re.M)
figures = re.findall(r"<!-- (D\d\d):", lesson)
programs = re.findall(r"<!-- Program: (.+?) -->", lesson)
assert [int(n) for n, _ in sections] == list(range(1, 17))
assert figures == [f"D{n:02}" for n in range(1, 33)]
assert len(set(programs)) == 13
assert len(re.findall(r"^### \d+\.", lesson, re.M)) == 16
assert lesson.count("<summary>Hint</summary>") == lesson.count("<summary>Worked solution</summary>") == 16
assert (public / "README.md").read_bytes() == (topic / "learner-README.md").read_bytes()
for name in programs:
    assert (public / name).read_bytes() == (topic / "programs" / name).read_bytes()
    ast.parse((public / name).read_text())
proposal = load(topic / "program-inputs.json")
for name, expected in proposal["files"].items():
    assert sha(root / name) == expected, name
finite = load(scratch / "study/finite/result.json")
assert finite["status"] == "passed" and len(finite["cases"]) == 146
assert all(case["passed"] for case in finite["cases"])
practice = {"early_eos_cache": 5 + 2 - 1, "max_rows": 5 + 4 - 1,
            "pages_a": math.ceil(8 / 4), "pages_b": math.ceil(6 / 4),
            "slack": 4 * 4 - 14, "content_gap": (1.0 - .5) / 2,
            "combined_ms": 30 / 3 + 90 * 2 / 3,
            "combined_speedup": 120 / 70, "product": (120 / 100) * (120 / 90),
            "goodput": 3 / 3, "offered_fraction": 3 / 6, "completed_fraction": 3 / 4}
assert practice["early_eos_cache"] == 6 and practice["max_rows"] == 8
assert practice["pages_a"] + practice["pages_b"] == 4 and practice["slack"] == 2
assert practice["content_gap"] == .25 and practice["combined_ms"] == 70
assert math.isclose(practice["product"], 1.6)
manifest = load(root / "src/learn/data/lesson-manifest.json")
links = re.findall(r"/learn/path/full-curriculum/([^?\s)]+)\?module=large-language-models", lesson)
assert all(link in manifest for link in links), links
archive = public / "inference-engines-examples.zip"
members = [p for p in sorted(public.rglob("*")) if p.is_file() and p != archive]
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in members:
        bundle.write(path, path.relative_to(public).as_posix())
with zipfile.ZipFile(archive) as bundle:
    assert len(bundle.namelist()) == len(members)
    for path in members:
        assert bundle.read(path.relative_to(public).as_posix()) == path.read_bytes()
for href in re.findall(r"\]\((/learn/examples/inference-engines/[^)]+)\)", lesson):
    assert (root / "public" / href.lstrip("/")).is_file(), href
original = (topic / "original/inference-engines.jsx").read_text(encoding="utf8")
labels = re.findall(r"<H2>([^<]+)</H2>", original)
normalized = {"1. Why it exists": "1. Start with the problem", "2. Core intuition": "2. Build the intuition",
              "3. Mathematical foundation": "3. Make the idea precise"}
slug = lambda text: re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
metadata = {"title": "Inference Engines & Serving", "readTime": "75 min", "hasIntegratedGuide": True,
            "summary": "Trace requests through admission, execution, streaming and cleanup; build a finite engine and inspect a real pinned CPU route with honest metrics.",
            "prerequisiteIds": ["kv-cache-memory-management", "continuous-batching-pagedattention", "queueing-theory-for-llm-serving"],
            "legacyAliases": sorted(set(slug(label) for label in labels) | set(slug(normalized.get(label, label)) for label in labels)),
            "nextTopicId": "inference-system-architecture-end-to-end"}
(topic / "content-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
checks = {"passed": True, "scope": "Source/retained-data/ZIP checks only; no scientific replay",
          "sections": len(sections), "figures": len(figures), "full_programs": len(programs),
          "practice_tasks": 16, "original_proposal_guards": len(proposal["files"]),
          "finite_original_cases": len(finite["cases"]), "archive_members": len(members),
          "archive_sha256": sha(archive), "archive_bytes": archive.stat().st_size,
          "practice_recomputation": practice, "verified_routes": sorted(set(links)),
          "public_source_guards": {p.relative_to(public).as_posix(): sha(p) for p in members},
          "script_sha256": sha(Path(__file__))}
(topic / "content-author-checks.json").write_text(json.dumps(checks, indent=2) + "\n")
paths = set()
for path in topic.rglob("*"):
    if path.is_file() and path.name != "content-inputs.json" and "content-review-root" not in path.parts:
        paths.add(path)
paths.update(p for p in public.rglob("*") if p.is_file())
for prefix in [scratch / "study", scratch / "preflight"]:
    paths.update(p for p in prefix.rglob("*") if p.is_file() and p.suffix != ".gguf")
paths.add(scratch / "artifacts/acquisition.json")
paths.update(root / "scripts" / name for name in ["review-serving-programs.py", "check-serving-converter-environment.py",
            "probe-serving-converter-config.py", "prepare-serving-visual-contracts.py", "package-serving-content.py",
            "freeze-serving-content.py"])
source = Path(load(scratch / "artifacts/acquisition.json")["source_root"])
paths.update(source / name for name in ["src/llama-model-loader.cpp", "src/llama-sampler.cpp", "common/sampling.cpp",
            "conversion/gptneox.py", "conversion/base.py", "convert_hf_to_gguf.py",
            "requirements/requirements-convert_hf_to_gguf.txt", "requirements/requirements-convert_legacy_llama.txt"])
packet = {"status": "complete-content-ready-for-different-review; runtime-not-started",
          "author": "alignment_author; programs authored Root/training_author",
          "files": {p.relative_to(root).as_posix(): sha(p) for p in sorted(paths)}}
(topic / "content-inputs.json").write_text(json.dumps(packet, indent=2) + "\n")
print(json.dumps({"files": len(paths), "packet_sha256": sha(topic / "content-inputs.json"),
                  "manuscript_sha256": sha(topic / "lesson.md"), "archive_members": len(members)}))
