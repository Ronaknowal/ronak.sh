"""Full released AI-preference records and causally aligned response targets.

python -B records_and_masks.py --output records-results.json
Requires torch. This program audits representations; it does not fit a model.
The unmodified prerequisite response_scores.py supplies shifted gather/masks.
"""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

import torch
import torch.nn.functional as F

from response_scores import pack, response_scores


ROOT = Path(__file__).resolve().parent
SPECIAL = ["[PAD]", "[BOS]", "[EOS]", "[SEP]", "[UNK]"]
TOKEN_PATTERN = r"\w+|[^\w\s]"


def tokens(text):
    """Explicit word/punctuation representation, without truncating the string."""
    return re.findall(TOKEN_PATTERN, text)


def digest_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def emit(path, result):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def digest_model(model):
    digest = hashlib.sha256()
    for name, value in model.state_dict().items():
        digest.update(name.encode("utf-8"))
        digest.update(str(tuple(value.shape)).encode("ascii"))
        digest.update(value.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def load_records():
    source = json.loads((ROOT / "records.json").read_text(encoding="utf-8"))
    answer = {}
    prompts_seen = set()
    for source_split, split in [("train_prefs", "train"), ("test_prefs", "heldout")]:
        answer[split] = []
        for item in source[source_split]:
            row = item["row"]
            assert row["chosen"][:-1] == row["rejected"][:-1]
            assert row["chosen"][-1]["role"] == row["rejected"][-1]["role"] == "assistant"
            prompt = row["prompt"]
            chosen = row["chosen"][-1]["content"]
            rejected = row["rejected"][-1]["content"]
            assert prompt not in prompts_seen
            prompts_seen.add(prompt)
            assert 0 < len(tokens(prompt)) <= 64
            assert 0 < len(tokens(chosen)) <= 128 and 0 < len(tokens(rejected)) <= 128
            assert chosen != rejected and row["score_chosen"] > row["score_rejected"]
            answer[split].append({
                "id": f"{source_split}:{item['row_idx']}",
                "source_split": source_split,
                "source_row_index": item["row_idx"],
                "prompt": prompt,
                "chosen": chosen,
                "rejected": rejected,
                "source_score_chosen": row["score_chosen"],
                "source_score_rejected": row["score_rejected"],
                "original": row,
            })
    assert len(answer["train"]) == 24 and len(answer["heldout"]) == 12
    return answer


def vocabulary_for(train):
    counts = Counter(token for row in train for field in ("prompt", "chosen", "rejected")
                     for token in tokens(row[field]))
    vocabulary = {token: index for index, token in enumerate(SPECIAL)}
    for token in sorted(counts):
        if token not in vocabulary:
            vocabulary[token] = len(vocabulary)
    return vocabulary


def encode(text, vocabulary):
    return [vocabulary.get(token, vocabulary["[UNK]"]) for token in tokens(text)]


def prepare():
    records = load_records()
    vocabulary = vocabulary_for(records["train"])
    for rows in records.values():
        for row in rows:
            row["prompt_ids"] = [vocabulary["[BOS]"]] + encode(row["prompt"], vocabulary) + [vocabulary["[SEP]"]]
            for field in ("chosen", "rejected"):
                row[field + "_ids"] = encode(row[field], vocabulary) + [vocabulary["[EOS]"]]
                row[field + "_unknowns"] = row[field + "_ids"].count(vocabulary["[UNK]"])
                assert len(row["prompt_ids"]) + len(row[field + "_ids"]) <= 195
    return records, vocabulary


def rows_batch(rows, vocabulary, both=True):
    prompts = [row["prompt_ids"] for row in rows]
    responses = [row["chosen_ids"] for row in rows]
    if both:
        prompts = prompts * 2
        responses += [row["rejected_ids"] for row in rows]
    return pack(prompts, responses, vocabulary["[PAD]"], maximum=196)


def model_scores(model, batch):
    return response_scores(model(batch["input_ids"]), **batch)


def run():
    records, vocabulary = prepare()
    # One vocabulary column per target: time positions are aligned, not crossed.
    probabilities = torch.tensor([[.1, .2, .6, .1], [.1, .7, .1, .1], [.1, .2, .2, .5]], dtype=torch.float64)
    targets = torch.tensor([2, 1, 3])
    selected = probabilities.log().gather(-1, targets[:, None]).squeeze(-1)
    cartesian = probabilities.log()[:, targets]
    assert torch.allclose(selected.sum(), torch.tensor(.21, dtype=torch.float64).log())
    assert selected.shape == (3,) and cartesian.shape == (3, 3)
    # PAD shares an ID with EOS here; position masks still preserve genuine EOS.
    batch = pack([[1, 3], [1]], [[2], [3, 2]], pad_id=2)
    logits = torch.tensor([[[.1, .2, .3, .4]] * 3] * 2, dtype=torch.float64, requires_grad=True)
    scored = response_scores(logits, **batch)
    assert scored["counts"].tolist() == [1, 2]
    for index in range(2):
        valid = scored["valid"][index]
        manual = F.cross_entropy(logits[index, :-1][valid], batch["input_ids"][index, 1:][valid], reduction="sum")
        assert torch.allclose(manual, -scored["sums"][index])
    (-scored["sums"].mean()).backward()
    assert torch.all(logits.grad[:, :-1][~scored["valid"]] == 0)
    return {
        "kind": "Released source labels and constructed causal score audit; no fitting",
        "records_sha256": digest_file(ROOT / "records.json"),
        "vocabulary": vocabulary,
        "rows": {split: [{key: value for key, value in row.items() if key != "original"}
                         for row in rows] for split, rows in records.items()},
        "gather": {"probabilities": probabilities.tolist(), "targets": targets.tolist(),
                   "aligned": selected.tolist(), "sum": selected.sum().item(),
                   "cartesian_shape": list(cartesian.shape), "cartesian_sum": cartesian.sum().item()},
        "eos_padding": {"batch": {key: value.tolist() for key, value in batch.items()},
                        "counts": scored["counts"].tolist(), "sums": scored["sums"].tolist()},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("records-results.json"))
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print(json.dumps({"train": 24, "heldout": 12, "vocabulary": len(result["vocabulary"]),
                      "aligned_sum": result["gather"]["sum"]}))


if __name__ == "__main__":
    main()
