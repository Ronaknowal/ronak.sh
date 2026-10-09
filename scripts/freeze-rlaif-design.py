"""Bind the complete RLAIF design proposal without running inference or fits."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
OUTPUT = TOPIC / "design-inputs.json"


def binding(path):
    data = path.read_bytes()
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def main():
    paths = {path for path in TOPIC.rglob("*") if path.is_file() and path != OUTPUT}
    inspected = [
        "scripts/research-rlaif-data.py",
        "scripts/research-rlaif-selection.py",
        "scripts/check-rlaif-design.py",
        "scripts/freeze-rlaif-design.py",
        "src/learn/data/topics/rlaif-ipo-orpo.jsx",
        "src/learn/data/topics/dpo.jsx",
        "src/learn/data/topics/rlhf.jsx",
        "src/learn/data/topics/constitutional-ai.jsx",
        "src/learn/components/content/Headings.jsx",
        "public/learn/examples/dpo/causal_backbone.py",
        "public/learn/examples/dpo/response_scores.py",
        "public/learn/examples/rlhf/policy_gradient.py",
        "public/learn/examples/constitutional-ai/transformers_critic.py",
        "skills/lesson-authoring/SKILL.md",
        "docs/teaching/llm-architecture-training/visual-vocabulary.md",
        "docs/engineering/LEARNING-CODE-STANDARD.md",
        "docs/engineering/LEARNING-WORKSPACE.md",
    ]
    paths.update(ROOT / path for path in inspected)
    paths.update((ROOT / "skills/lesson-authoring/references").glob("*.md"))
    published = ROOT / "src/learn/data/topics/rlaif-ipo-orpo.jsx"
    preserved = TOPIC / "original/rlaif-ipo-orpo.jsx"
    assert published.read_bytes() == preserved.read_bytes(), "Published original changed"
    checks = json.loads((TOPIC / "design-checks.json").read_text(encoding="utf-8"))
    assert checks["status"] == "passed" and checks["checks"] == 261
    for relative, expected in checks["inputs"].items():
        assert binding(ROOT / relative)["sha256"] == expected, relative
    files = [binding(path) for path in sorted(paths)]
    record = {
        "status": "whole-design-ready-for-different-review",
        "author": "multimodal_reviewer",
        "topic_id": "rlaif-ipo-orpo-emerging-alignment-methods",
        "runtime_started": False,
        "new_study_fits_started": False,
        "new_judge_inference_started": False,
        "structures": 35,
        "planned_complete_programs": 9,
        "planned_independent_practice_tasks": 14,
        "analytic_checks": checks["checks"],
        "published_original_conserved": True,
        "scope": "Complete design and prospective study only; original diagnostic execution is preserved separately.",
        "files": files,
    }
    OUTPUT.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": record["status"], "bindings": len(files),
                      "sha256": binding(OUTPUT)["sha256"]}))


if __name__ == "__main__":
    main()
