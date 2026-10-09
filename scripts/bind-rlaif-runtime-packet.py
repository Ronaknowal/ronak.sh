"""Bind the completed author runtime; conservation checks only, no training."""
from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"


def binding(file):
    content = file.read_bytes()
    return {"sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content)}


accepted = json.loads((TOPIC / "content-successor/inputs.json").read_text())
checks = []
for name, expected in accepted["inputs"].items():
    actual = binding(ROOT / name)
    assert actual["sha256"] == expected["sha256"], name
    checks.append({"path": name, "passed": True})

receipts = [
    "browser-presentation-final/report.json",
    "browser-states-final/report.json",
    "browser-keyboard-final/report.json",
    "browser-delivery-final/report.json",
    "runtime-copy-closure/report.json",
    "runtime-table-closure/report.json",
    "runtime-final-label-closure/report.json",
    "runtime-model-checks.json",
]
for name in receipts:
    report = json.loads((TOPIC / name).read_text())
    assert report["passed"], name
    assert all(c["passed"] for c in report.get("checks", [])), name

model_receipt = json.loads((TOPIC / "runtime-model-checks.json").read_text())
for item in model_receipt["sourceFiles"]:
    if item["path"] in {
        "src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx",
        "src/learn/components/lesson-labs/rlaif-methods-flow.css",
    }:
        continue
    assert binding(ROOT / item["path"])["sha256"] == item["sha256"], item["path"]

figure_names = [
    "FeedbackObjectiveAxes", "FullComparisonRecord", "CompiledJudgePrompt",
    "ConditionalOptionMass", "MappedOrderWires", "LabelValidityRows",
    "SoftTargetTransforms", "RewardHeadWiring", "SoftBCELossGradient",
    "DistilledDirectRoutes", "RatingDistributionMap", "FinitePolicyScoreVectors",
    "SnapshotTimeline", "AlignedGatherMatrix", "SumMeanTokenScores",
    "CausalTargetMask", "RelativeGainCoordinates", "IPOAndDPOCoordinates",
    "ContradictoryPreferenceCounts", "FourActionPreferenceMatrix",
    "PreferenceTransformTilt", "MissingSupportSimplex", "GeometricTokenPool",
    "OddsContrast", "SharedWeightGradients", "TinyCausalArchitecture",
    "SharedWarmStartFork", "TrainerTargetMasks", "NativeExplicitBridge",
    "RealFeedbackPair", "ActualTrainingTrajectories", "PairedHeldoutOutcomes",
    "MetricLineage", "CountedModelWork", "ControlledComparisonMatrix",
]
paint_index = {"scope": "Personally read retained actual paints. Predecessor images are explicitly composed with bounded successors; not relabelled as current executions.", "figures": []}
for number, export in enumerate(figure_names, 1):
    id_ = f"D{number:02}"
    profiles = {}
    for profile in ("desktop", "phone", "enlarged"):
        directory = "runtime-final-label-closure" if number == 11 else "runtime-copy-closure" if number == 16 else "browser-presentation-final"
        filename = f"{profile}-{id_}-default.png" if number == 11 else f"{profile}-{id_}.png"
        file = TOPIC / directory / "screenshots" / filename
        assert file.exists(), file
        profiles[profile] = {"path": str(file.relative_to(ROOT)).replace("\\", "/"), **binding(file)}
    paint_index["figures"].append({"id": id_, "export": export, "default_paints": profiles})
paint_index["supplements"] = receipts[1:7]
paint_index["reading_aids"] = ["runtime-paint-reading/index.json", "runtime-final-paint-reading/index.json"]
(TOPIC / "runtime-paint-index.json").write_text(json.dumps(paint_index, indent=2) + "\n", encoding="utf-8")

guard = {"passed": True, "fits": 0, "inference": 0, "accepted_content_guards": len(checks), "checks": checks,
         "model_reuse": "All model receipt inputs outside the expressly amended component/CSS remain exact.",
         "passed_receipts": receipts}
(TOPIC / "runtime-author-checks.json").write_text(json.dumps(guard, indent=2) + "\n", encoding="utf-8")

files = set(file for file in TOPIC.rglob("*") if file.is_file())
files.update(file for file in (ROOT / "public/learn/examples/rlaif-methods").rglob("*") if file.is_file())
files.update(ROOT / file for file in [
    "src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx",
    "src/learn/components/lesson-labs/rlaif-methods-flow.css",
    "src/learn/data/rlaif-methods-models.js",
    "src/learn/data/topics/rlaif-ipo-orpo.jsx",
    "src/learn/components/content/RemoteCodeBlock.jsx",
    "src/learn/components/content/LessonCodeDownloads.jsx",
    "src/learn/components/content/Math.jsx",
    "src/learn/components/lesson-labs/lesson-flow.css",
    "skills/lesson-authoring/SKILL.md",
    "docs/teaching/llm-architecture-training/visual-vocabulary.md",
])
files.update(ROOT / file for file in [
    "scripts/render-rlaif-lesson.mjs", "scripts/format-rlaif-runtime.mjs",
    "scripts/verify-rlaif-models.mjs", "scripts/verify-rlaif-browser.cjs",
    "scripts/verify-rlaif-interactions.cjs", "scripts/verify-rlaif-delivery.cjs",
    "scripts/verify-rlaif-scroll.cjs", "scripts/verify-rlaif-copy-closure.cjs",
    "scripts/verify-rlaif-table-closure.cjs", "scripts/verify-rlaif-final-label-closure.cjs",
    "scripts/assemble-rlaif-paint-reading.py", "scripts/bind-rlaif-runtime-packet.py",
])
files.discard(TOPIC / "runtime-inputs.json")
assert not any("__pycache__" in file.parts for file in (ROOT / "public/learn/examples/rlaif-methods").rglob("*"))
packet = {"status": "Author ready for different whole runtime review; not independent acceptance or publication.",
          "at": datetime.now(timezone.utc).isoformat(), "scientific_fits_rerun": 0,
          "inputs": {str(file.relative_to(ROOT)).replace("\\", "/"): binding(file) for file in sorted(files)}}
(TOPIC / "runtime-inputs.json").write_text(json.dumps(packet, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"passed": True, "inputs": len(packet["inputs"]), "packet": binding(TOPIC / "runtime-inputs.json")}))
