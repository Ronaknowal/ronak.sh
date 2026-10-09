"""Freeze a deterministic, bounded real-data candidate before any fit."""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/research/dataset"
repository = "HuggingFaceH4/ultrafeedback_binarized"
tokens = lambda text: re.findall(r"\w+|[^\w\s]", text)
seen = set()
selected = {}
audit = {}
retrieval = []
for split, target in (("train_prefs", 24), ("test_prefs", 12)):
    accepted = []
    rejected = []
    for offset in range(0, 500, 100):
        name = f"{split}-first100.json" if offset == 0 else f"{split}-offset{offset}.json"
        path = DEST / name
        if path.exists():
            body = path.read_bytes()
        else:
            url = f"https://datasets-server.huggingface.co/rows?dataset={repository}&config=default&split={split}&offset={offset}&length=100"
            with urlopen(Request(url, headers={"User-Agent": "lesson-research/1"}), timeout=90) as response:
                body = response.read()
                retrieval.append({"file": name, "url": url, "headers": dict(response.headers),
                                  "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body)})
            path.write_bytes(body)
        for item in json.loads(body)["rows"]:
            row = item["row"]
            a, b = row["chosen"][-1]["content"], row["rejected"][-1]["content"]
            lengths = [len(tokens(row["prompt"])), len(tokens(a)), len(tokens(b))]
            reason = None
            if row["prompt_id"] in seen:
                reason = "duplicate_prompt"
            elif lengths[0] > 64 or max(lengths[1:]) > 128:
                reason = "length_budget"
            elif not a.strip() or not b.strip() or a == b:
                reason = "empty_or_identical"
            elif row["score_chosen"] <= row["score_rejected"]:
                reason = "tied_or_inverted_source_scores"
            if reason:
                rejected.append({"row_idx": item["row_idx"], "reason": reason, "lengths": lengths})
            elif len(accepted) < target:
                seen.add(row["prompt_id"])
                accepted.append({"row_idx": item["row_idx"], "row": row, "lengths": lengths})
        if len(accepted) == target:
            break
    assert len(accepted) == target, (split, len(accepted))
    selected[split] = accepted
    audit[split] = {"last_offset_received": offset, "selected_indices": [x["row_idx"] for x in accepted],
                    "rejected": rejected, "selected": len(accepted)}
(DEST / "selection.json").write_text(json.dumps({"retrievedAt": datetime.now(timezone.utc).isoformat(),
    "rule": "Ascending API source row index; unique prompts across splits, prompt <=64 regex tokens, each response <=128, nonempty distinct responses, strictly higher source chosen score. First24train/12test. No scoring, fitting, tuning, or replacement after outcomes.",
    "token_pattern": r"\w+|[^\w\s]", "audit": audit, "additional_retrieval": retrieval,
    "scope": "Small length-selected GPT-4-labelled data, not a representative sample or an independent quality oracle. Raw API rows and full selected original text are retained."}, indent=2) + "\n", encoding="utf-8")
(DEST / "selected-data.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({split: {"selected": entry["selected"], "last_offset": entry["last_offset_received"],
                         "indices": entry["selected_indices"]} for split, entry in audit.items()}))
