"""Stage only this lesson's exact source data and inspected dependencies."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"


def main():
    sources = {
        "causal_backbone.py": ROOT / "public/learn/examples/dpo/causal_backbone.py",
        "response_scores.py": ROOT / "public/learn/examples/dpo/response_scores.py",
        "records.json": TOPIC / "research/dataset/selected-data.json",
        "selection.json": TOPIC / "research/dataset/selection.json",
        "UltraFeedback-LICENSE.txt": TOPIC / "research/dataset/UltraFeedback-LICENSE.txt",
        "study-protocol.md": TOPIC / "study-protocol.md",
    }
    records = []
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name, source in sources.items():
        data = source.read_bytes()
        target = PUBLIC / name
        if target.exists():
            assert target.read_bytes() == data, f"Existing asset differs: {name}"
        else:
            target.write_bytes(data)
        records.append({"target": name, "source": source.relative_to(ROOT).as_posix(),
                        "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
    provenance = {
        "kind": "Verbatim inspected dependencies and exact retained data; no fitting",
        "files": records,
        "backbone": "Unmodified TinyLM causal classes, initially taught in Causal Language Modeling and reused in DPO.",
        "scoring": "Unmodified shifted-gather/attention/completion-mask primitives from DPO.",
        "data": "HuggingFaceH4/ultrafeedback_binarized, MIT. Rows API bytes retained; original scores are AI labels.",
        "dataset_revision_for_card_and_processing": "3949bf5f8c17c394422ccfab0c31ea9c20bdeb85",
        "row_commit_limit": "The API response does not independently establish parquet-commit equality.",
    }
    target = PUBLIC / "provenance.json"
    if target.exists():
        assert json.loads(target.read_text(encoding="utf-8")) == provenance
    else:
        target.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"staged": len(records), "fits": 0}))


if __name__ == "__main__":
    main()
