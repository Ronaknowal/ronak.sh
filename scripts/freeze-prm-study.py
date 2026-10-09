"""Bind the prospective PRM protocol, code and selected data before fitting."""

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
OUTPUT = BASE / "study/prospective-inputs.json"


def main():
    if OUTPUT.exists() or (BASE / "study/results.json").exists():
        raise FileExistsError("Preserve the prospective freeze; do not replace it")
    paths = [BASE / "study-protocol.md", BASE / "design.md", BASE / "design-review.md",
             ROOT / "public/learn-code/process-reward-models/prm_records.py",
             ROOT / "public/learn-code/process-reward-models/prm_classifier.py",
             *sorted((BASE / "study/data").glob("*")),
             BASE / "research/primary/prm800k-phase2_train.jsonl.prefix",
             BASE / "research/primary/prm800k-phase2_test.jsonl.prefix",
             BASE / "research/primary/prm800k-LICENSE"]
    files = {str(p.relative_to(ROOT)).replace("\\", "/"):
             {"sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
              "bytes": p.stat().st_size} for p in paths}
    report = {"frozen_at": datetime.now(timezone.utc).isoformat(),
              "fitted_models_at_freeze": 0, "files": files,
              "scope": "One fixed160-update lexical classifier fit, no outcome gate"}
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
