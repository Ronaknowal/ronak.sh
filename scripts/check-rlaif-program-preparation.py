"""Check complete program syntax, exact reuse, representation and dependencies.

No model is fitted, no teacher forward pass is performed, and no stage result
is represented as an executed scientific observation by this preparation audit.
"""

import ast
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
sys.path.insert(0, str(PUBLIC))
checks = []


def check(condition, name):
    assert condition, name
    checks.append(name)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


programs = ["records_and_masks.py", "judge_labels.py", "feedback_learning.py", "rlaif_loop.py",
            "preference_losses.py", "finite_preferences.py", "compare_training.py", "trl_methods.py", "run_all.py"]
for name in programs + ["causal_backbone.py", "response_scores.py"]:
    tree = ast.parse((PUBLIC / name).read_text(encoding="utf-8"))
    check(bool(tree.body), name + " complete syntax")
    if name in programs:
        check(any(isinstance(node, ast.FunctionDef) and node.name == "main" for node in tree.body), name + " executable main")

for name in ["causal_backbone.py", "response_scores.py"]:
    check((PUBLIC / name).read_bytes() == (ROOT / "public/learn/examples/dpo" / name).read_bytes(), name + " verbatim inspected dependency")
check((PUBLIC / "records.json").read_bytes() == (TOPIC / "research/dataset/selected-data.json").read_bytes(), "full selected source rows exact")
check((PUBLIC / "study-protocol.md").read_bytes() == (TOPIC / "study-protocol.md").read_bytes(), "prospective protocol exact")

from compare_training import prepared_inputs
from records_and_masks import prepare, rows_batch
from judge_labels import MODEL, REVISION
from trl_methods import tokenizer_for, trainer_dataset
from trl import DPOConfig
from trl.experimental.orpo import ORPOConfig

records, vocabulary = prepare()
plan = prepared_inputs()
check(len(records["train"]) == 24 and len(records["heldout"]) == 12, "24/12 real pair representation")
for split, rows in records.items():
    for row in rows:
        check(len(row["prompt_ids"]) + max(len(row["chosen_ids"]), len(row["rejected_ids"])) <= 195,
              row["id"] + " no truncation")
for seed in ["17", "29", "43"]:
    for kind, length in [("warm", 64), ("continuation", 80)]:
        check(len(plan["schedules"][seed][kind]) == length, seed + ": " + kind + " declared updates")
        check(all(len(batch) == 6 and all(0 <= index < 24 for index in batch)
                  for batch in plan["schedules"][seed][kind]), seed + ": " + kind + " actual batch indices")
tokenizer = tokenizer_for(vocabulary)
dataset = trainer_dataset(records["train"][:2])
for native, row in zip(dataset, records["train"]):
    check(tokenizer(native["prompt"], add_special_tokens=False)["input_ids"] == row["prompt_ids"], row["id"] + " library prompt IDs")
    for field in ["chosen", "rejected"]:
        actual = tokenizer(native[field], add_special_tokens=False)["input_ids"] + [tokenizer.eos_token_id]
        check(actual == row[field + "_ids"], row["id"] + " library " + field + " IDs")
args = DPOConfig(output_dir=str(ROOT / "scratch/rlaif-ipo-orpo/config-check"), use_cpu=True, bf16=False,
                 loss_type=["ipo"], beta=.5, report_to="none")
check(args.loss_type == ["ipo"], "current IPO configuration list contract")
args = ORPOConfig(output_dir=str(ROOT / "scratch/rlaif-ipo-orpo/config-check"), use_cpu=True, bf16=False,
                 beta=.1, report_to="none", max_length=196)
check(args.beta == .1, "current experimental ORPO configuration contract")
packages = {name: importlib.metadata.version(name) for name in
            ["torch", "transformers", "trl", "datasets", "tokenizers", "numpy", "accelerate", "sentencepiece"]}
required = {line.split("==")[0]: line.split("==")[1] for line in (PUBLIC / "requirements.txt").read_text().splitlines() if line}
for name, version in required.items():
    check(packages[name].split("+")[0] == version, name + " pinned version available")
result = {"status": "passed", "checks": len(checks), "conditions": checks, "versions": packages,
          "model_planned": {"id": MODEL, "revision": REVISION}, "fits": 0, "teacher_inference": 0,
          "scope": "Whole syntax, exact reuse, representation, tokenizer and configuration preparation only",
          "programs": {name: digest(PUBLIC / name) for name in programs},
          "inputs": {path.relative_to(ROOT).as_posix(): digest(path) for path in
                     [Path(__file__), TOPIC / "study-protocol.md", PUBLIC / "records.json", PUBLIC / "requirements.txt"]}}
(TOPIC / "program-preparation-checks.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": result["status"], "checks": len(checks), "versions": packages, "fits": 0}))
