"""Pinned encoder-decoder AI labels with complete options and both orders.

python -B judge_labels.py --cache /path/to/model-cache --output judge-results.json
Requires torch, transformers and sentencepiece. The first run may download Flan.
This full-option extension is not Lee et al.'s single-next-token protocol.
"""

import argparse
import importlib.metadata
from pathlib import Path

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from records_and_masks import digest_file, emit, load_records, ROOT


MODEL = "google/flan-t5-small"
REVISION = "0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"
RUBRIC = "Follow the user's instructions accurately and usefully; avoid unsupported claims."


def comparison_prompt(row, swapped=False):
    a, b = (row["rejected"], row["chosen"]) if swapped else (row["chosen"], row["rejected"])
    return (f"User request: {row['prompt']}\nCriterion: {RUBRIC}\n"
            f"Response 1: {a}\nResponse 2: {b}\n"
            "Which response better satisfies the criterion? Answer 1 or 2.")


def rating_prompt(row, response):
    return (f"User request: {row['prompt']}\nCriterion: {RUBRIC}\nResponse: {response}\n"
            "Rate this response from 1 (poor) to 10 (excellent). Answer with the rating number.")


def score_option(model, tokenizer, prompt, option):
    encoded = tokenizer(prompt, return_tensors="pt", truncation=False)
    if encoded["input_ids"].shape[1] > 512:
        raise ValueError("Complete prompt exceeds the fixed encoder budget")
    labels = tokenizer(option, return_tensors="pt", add_special_tokens=True)["input_ids"]
    with torch.inference_mode():
        logits = model(**encoded, labels=labels).logits
        selected = logits.log_softmax(-1).gather(-1, labels.unsqueeze(-1)).squeeze(-1)[0]
    ids = labels[0].tolist()
    assert ids[-1] == tokenizer.eos_token_id
    return {"option": option, "target_ids": ids, "tokens": tokenizer.convert_ids_to_tokens(ids),
            "token_logps": selected.tolist(), "sum_logp": selected.sum().item(), "EOS_included": True}


def distribution(model, tokenizer, prompt, options):
    scores = [score_option(model, tokenizer, prompt, option) for option in options]
    logs = torch.tensor([row["sum_logp"] for row in scores], dtype=torch.float64)
    probabilities = logs.softmax(-1)
    return {"compiled_prompt": prompt, "encoder_ids": tokenizer(prompt, add_special_tokens=True)["input_ids"],
            "options": scores, "conditional_probabilities": probabilities.tolist(),
            "normalizer_logsumexp": logs.logsumexp(0).item()}


def prepare_inputs(tokenizer):
    """Select by token budget only, before any judge outcome is observed."""
    rows = load_records()["train"]
    eligible, rejected = [], []
    for row in rows:
        counts = [len(tokenizer(comparison_prompt(row, swapped), add_special_tokens=True)["input_ids"])
                  for swapped in [False, True]]
        if max(counts) > 512:
            rejected.append({"id": row["id"], "encoder_counts": counts, "status": "overbudget"})
            continue
        eligible.append(row)
        if len(eligible) == 4:
            break
    if len(eligible) != 4:
        raise ValueError("The fixed four-pair eligibility contract is unavailable; do not substitute outcomes")
    comparison_inputs = []
    for row in eligible:
        passes = []
        for swapped in [False, True]:
            prompt = comparison_prompt(row, swapped)
            passes.append({"prompt": prompt, "encoder_ids": tokenizer(prompt, add_special_tokens=True)["input_ids"]})
        comparison_inputs.append({"id": row["id"], "passes": passes})
    rating_inputs = []
    for field in ["chosen", "rejected"]:
        prompt = rating_prompt(eligible[0], eligible[0][field])
        ids = tokenizer(prompt, add_special_tokens=True)["input_ids"]
        if len(ids) > 512:
            raise ValueError("Fixed first eligible pair's rating prompt exceeds budget")
        rating_inputs.append({"id": eligible[0]["id"], "response": field, "prompt": prompt, "encoder_ids": ids})
    plan = {"selected_ids": [row["id"] for row in eligible], "excluded_before_selection": rejected,
            "comparisons": comparison_inputs, "ratings": rating_inputs,
            "option_target_ids": {str(index): tokenizer(str(index), add_special_tokens=True)["input_ids"]
                                  for index in range(1, 11)}}
    return eligible, plan


def run(cache, local_only=False, plan_path=None):
    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, cache_dir=str(cache), local_files_only=local_only)
    eligible, plan = prepare_inputs(tokenizer)
    if plan_path is not None:
        import json
        assert json.loads(Path(plan_path).read_text(encoding="utf-8")) == plan, "Judge inputs changed since freeze"
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, revision=REVISION, cache_dir=str(cache), local_files_only=local_only)
    model.eval()
    comparisons = []
    for row in eligible:
        passes = [distribution(model, tokenizer, comparison_prompt(row, swapped), ["1", "2"])
                  for swapped in [False, True]]
        mapped = [passes[0]["conditional_probabilities"][0], passes[1]["conditional_probabilities"][1]]
        comparisons.append({"id": row["id"], "source_scores": [row["source_score_chosen"], row["source_score_rejected"]],
                            "passes": passes, "mapped_chosen": mapped,
                            "target_chosen": sum(mapped) / 2, "order_gap": abs(mapped[0] - mapped[1])})
        print(row["id"], "both orders complete", flush=True)
    first = eligible[0]
    ratings = []
    for field in ["chosen", "rejected"]:
        scored = distribution(model, tokenizer, rating_prompt(first, first[field]), [str(i) for i in range(1, 11)])
        expectation = sum(index * probability for index, probability in enumerate(scored["conditional_probabilities"], 1))
        ratings.append({"id": first["id"], "response": field, **scored,
                        "expected_rating": expectation, "mapped_reward": 2 * (expectation - 1) / 9 - 1})
    return {"kind": "Actual small pretrained judge diagnostics; no human evaluation or paper replication",
            "model": MODEL, "revision": REVISION, "rubric": RUBRIC, "records_sha256": digest_file(ROOT / "records.json"),
            "versions": {name: importlib.metadata.version(name) for name in ["torch", "transformers", "sentencepiece"]},
            "parameters": sum(value.numel() for value in model.parameters()), "device": "CPU", "eval": True,
            "selected_ids": plan["selected_ids"], "excluded_before_selection": plan["excluded_before_selection"],
            "comparisons": comparisons, "ratings": ratings,
            "interpretation": "Conditional option likelihood is neither calibrated human preference nor a source-score replacement."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=Path(".rlaif-model-cache"))
    parser.add_argument("--local-only", action="store_true")
    parser.add_argument("--plan", type=Path)
    parser.add_argument("--output", type=Path, default=Path("judge-results.json"))
    args = parser.parse_args()
    result = run(args.cache, args.local_only, args.plan)
    emit(args.output, result)
    print({"pairs": len(result["comparisons"]), "ratings": len(result["ratings"]), "output": str(args.output)})


if __name__ == "__main__":
    main()
