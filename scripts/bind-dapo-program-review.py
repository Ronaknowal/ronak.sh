"""Bind the DIFFERENT whole DAPO review before author correction."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization"
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
original_path = DOC / "program-inputs.json"
original = json.loads(original_path.read_text(encoding="utf-8"))
paths = [ROOT / path for path in original["files"]]
for path, expected in original["files"].items():
    assert sha(ROOT / path) == expected, path
for path, expected in original["installed_sources"].items():
    assert sha(Path(path)) == expected, path
    paths.append(Path(path))
paths += [original_path, DOC / "program-review.md", DOC / "program-review-checks.json", Path(__file__),
          ROOT / "scripts/review-dapo-programs.py",
          ROOT / "scratch/rlhf-research/site-packages/trl/trainer/utils.py",
          ROOT / "scratch/rlhf-research/framework-site-packages/transformers/trainer.py",
          ROOT / "scratch/rlhf-research/framework-site-packages/transformers/trainer_callback.py"]
receipt = json.loads((DOC / "program-review-checks.json").read_text(encoding="utf-8"))
assert receipt["conditions"] == 262 and receipt["models_constructed"] == 0
packet = {"status": "withheld for one bounded R1 retention finding before DAPO execution",
          "reviewer": "multimodal_reviewer; different from root author",
          "original_program_packet_sha256": sha(original_path),
          "complementary_conditions": receipt["conditions"], "models_constructed": 0,
          "model_forwards": 0, "generation": 0, "optimizer_steps": 0,
          "scientific_stage_entry_points": 0,
          "budget": original["budget"],
          "inputs": [{"path": path.relative_to(ROOT).as_posix(), "sha256": sha(path), "bytes": path.stat().st_size}
                     for path in sorted(set(paths))]}
target = DOC / "program-review-inputs.json"
with target.open("x", encoding="utf-8") as stream:
    json.dump(packet, stream, indent=2)
    stream.write("\n")
print({"status": packet["status"], "bindings": len(packet["inputs"]), "sha256": sha(target),
       "complementary_conditions": receipt["conditions"]})
