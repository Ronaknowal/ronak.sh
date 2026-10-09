"""Project retained PRM evidence; execute only finite UCT fixtures, never fit."""
import hashlib
import json
from pathlib import Path
import sys
import string

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn-code/process-reward-models"
DOCS = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
sys.path.insert(0, str(PUBLIC))
from prm_search import uct


def read(path):
    return json.loads(path.read_text(encoding="utf8"))


def main():
    branches = []
    for split, record, requested_step in (("train", 0, -1), ("test", 156, 5)):
        rows = [json.loads(line) for line in (PUBLIC / f"sources/phase2_{split}.jsonl.prefix").read_text(encoding="utf8").splitlines()]
        row = rows[record]
        steps = row["label"]["steps"]
        step_index = requested_step if requested_step >= 0 else len(steps) - 1
        prefix = []
        for step in steps[:step_index]:
            selected = step.get("chosen_completion")
            chosen = step["completions"][selected] if selected is not None else step.get("human_completion")
            if chosen is None:
                break
            prefix.append(chosen["text"])
        branches.append({"split": split, "record": record, "step": step_index, "question": row["question"]["problem"],
                         "prefix": prefix, "annotation": steps[step_index]})
    examples = {}
    for split in ("train", "validation", "test"):
        all_rows = [json.loads(line) for line in (PUBLIC / f"data/{split}.jsonl").read_text(encoding="utf8").splitlines()]
        examples[split] = all_rows[:12]
    seen = {}
    collision = None
    for a in string.ascii_lowercase:
        for b in string.ascii_lowercase:
            word = a + b
            digest = hashlib.sha256(word.encode()).digest()
            key = (int.from_bytes(digest[:8], "big") % 512, -1 if digest[8] & 1 else 1)
            if key in seen:
                collision = {"words": [seen[key], word], "bucket": key[0], "sign": key[1]}
                break
            seen[key] = word
        if collision:
            break
    report = {"scope": "Retained human records and fixed-study projection; UCT finite fixtures only. No fitting.",
              "branches": branches, "examples": examples, "collision": collision,
              "extraction": read(PUBLIC / "data/extraction.json"),
              "study": read(PUBLIC / "study/results.json"),
              "search": read(DOCS / "native/search-vote-closure.json"),
              "rewards": read(DOCS / "native/rewards-readable.json"),
              "contracts": read(DOCS / "native/contracts-contextual.json"),
              "transformers": read(DOCS / "native/transformers-bos.json"),
              "uct": [uct(count) for count in range(17)]}
    destination = ROOT / "public/learn-data/process-reward-models/observations.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    inputs = [PUBLIC / "prm_search.py", PUBLIC / "prm_contracts.py", PUBLIC / "sources/phase2_train.jsonl.prefix", PUBLIC / "sources/phase2_test.jsonl.prefix",
              PUBLIC / "study/results.json", PUBLIC / "data/extraction.json", *[PUBLIC / f"data/{split}.jsonl" for split in examples],
              *[DOCS / f"native/{name}.json" for name in ("search-vote-closure", "rewards-readable", "contracts-contextual", "transformers-bos")]]
    receipt = {"fits": 0, "uct_executions": 17, "output": str(destination.relative_to(ROOT)),
               "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
               "inputs": [{"path": str(path.relative_to(ROOT)), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in inputs]}
    (DOCS / "runtime-projection.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
