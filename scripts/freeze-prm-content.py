"""Freeze this author's whole PRM content packet, without central promotion."""

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
PUBLIC = ROOT / "public/learn-code/process-reward-models"


def main():
    destination = BASE / "content-inputs.json"
    if destination.exists():
        raise FileExistsError("Preserve this freeze and use an additive successor")
    paths = [p for p in BASE.rglob("*") if p.is_file()]
    paths.extend(p for p in PUBLIC.rglob("*") if p.is_file())
    if any("__pycache__" in path.parts for path in paths):
        raise ValueError("Do not publish Python cache files")
    paths.extend(ROOT / "scripts" / name for name in (
        "audit-prm-original.mjs", "research-prm-records.py", "freeze-prm-study.py",
        "package-prm-content.py", "verify-prm-content.py", "freeze-prm-content.py"))
    paths.extend(ROOT / path for path in (
        "skills/lesson-authoring/SKILL.md", "skills/lesson-authoring/references/teaching.md",
        "skills/lesson-authoring/references/visuals-and-labs.md",
        "skills/lesson-authoring/references/examples-and-code.md",
        "skills/lesson-authoring/references/practice-and-resources.md",
        "skills/lesson-authoring/references/review.md",
        "docs/teaching/llm-architecture-training/visual-vocabulary.md",
        "public/learn-code/causal-language-modeling/tiny_causal_lm.py"))
    files = {str(path.relative_to(ROOT)).replace("\\", "/"):
             hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(set(paths))}
    report = {"author": "multimodal_reviewer", "frozen_at": datetime.now(timezone.utc).isoformat(),
              "topic_id": "process-reward-models-prm-vs-outcome-reward-models-orm",
              "scope": "Complete content/program/spec packet for different review; runtime not started",
              "sections": 13, "structures_required": 29, "solutions": 14,
              "complete_programs": 7, "scientific_fits_executed": 1,
              "pretrained_inference_executed": False, "files": files}
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"inputs": len(files), "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                      "manuscript_sha256": hashlib.sha256((BASE / "lesson.md").read_bytes()).hexdigest()}, indent=2))


if __name__ == "__main__":
    main()
