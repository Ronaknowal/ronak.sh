"""Bind the complete staged content, programs and conserved scientific evidence."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
DESTINATION = TOPIC / "content-inputs.json"
if DESTINATION.exists():
    raise ValueError("Retain the existing content packet; use a named successor for corrections")

scripts = ["check-rlaif-design.py", "freeze-rlaif-design.py", "prepare-rlaif-assets.py",
           "check-rlaif-program-preparation.py", "repair-rlaif-preparation.py",
           "check-rlaif-native-evidence.py", "export-rlaif-content-assets.py",
           "check-rlaif-practice.py", "check-rlaif-content.py", "freeze-rlaif-content.py"]
paths = [path for path in TOPIC.rglob("*") if path.is_file()]
paths += [path for path in PUBLIC.rglob("*") if path.is_file()]
paths += [ROOT / "scripts" / name for name in scripts]
paths += [ROOT / "scratch/rlaif-ipo-orpo/run_program.py",
          ROOT / "src/learn/data/topics/rlaif-ipo-orpo.jsx",
          ROOT / "docs/teaching/llm-architecture-training/visual-vocabulary.md"]
for path in paths:
    assert path.is_file() and path.resolve().is_relative_to(ROOT.resolve()), path

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manuscript = TOPIC / "lesson.md"
packet = {
    "kind": "complete staged content; different whole review required before runtime",
    "topic_id": "rlaif-ipo-orpo-emerging-alignment-methods",
    "manuscript": {"path": manuscript.relative_to(ROOT).as_posix(),
                   "sha256": digest(manuscript), "bytes": manuscript.stat().st_size},
    "scientific_freeze_sha256": digest(TOPIC / "native-evidence/prospective-freeze.json"),
    "phase": {"author_content": "ready", "different_content_review": "pending",
              "implementation": "not started", "published_source": "protected original"},
    "inputs": {path.relative_to(ROOT).as_posix(): {"sha256": digest(path), "bytes": path.stat().st_size}
               for path in sorted(set(paths))},
}
DESTINATION.write_text(json.dumps(packet, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"packet": DESTINATION.relative_to(ROOT).as_posix(), "sha256": digest(DESTINATION),
                  "files": len(packet["inputs"]), "manuscript": packet["manuscript"],
                  "phase": packet["phase"]}, indent=2))
