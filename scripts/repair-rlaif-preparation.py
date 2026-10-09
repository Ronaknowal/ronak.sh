"""Preserve the first preparation's two sources, then fix a current API argument."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
DEST = TOPIC / "program-preparation-api-diagnostic"
DEST.mkdir(parents=True, exist_ok=True)
records = []
for relative in ["public/learn/examples/rlaif-methods/trl_methods.py", "scripts/check-rlaif-program-preparation.py"]:
    source = ROOT / relative
    before = source.read_bytes()
    text = before.decode("utf-8")
    assert text.count(", max_prompt_length=66") == 1, relative
    preserved = DEST / source.name
    assert not preserved.exists(), "Preserve existing diagnostic"
    preserved.write_bytes(before)
    after = text.replace(", max_prompt_length=66", "").encode("utf-8")
    source.write_bytes(after)
    records.append({"path": relative, "before_sha256": hashlib.sha256(before).hexdigest(),
                    "after_sha256": hashlib.sha256(after).hexdigest()})
result = {"scope": "No-fit configuration preparation; no scientific input freeze or fit had begun",
          "failure": "TypeError: ORPOConfig.__init__() got an unexpected keyword argument 'max_prompt_length'",
          "correction": "Remove the legacy argument. Pinned decoder ORPO only takes max_length; full pairs already fit its196-token budget.",
          "primary_source": "research/primary/trl-v1.14.2-orpo-config.py",
          "installed_source_read": "scratch/rlhf-research/site-packages/trl/experimental/orpo/orpo_config.py",
          "files": records, "fits": 0, "teacher_inference": 0}
(DEST / "receipt.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"corrected": len(records), "fits": 0}))
