"""Ordinary current TRL DPOTrainer on frozen released human comparisons.

python -B trl_dpo.py --prepare-only --selection selection.json
python -B trl_dpo.py --selection selection.json --output trl-dpo-results.json
Requires torch, transformers==5.19.0, trl==1.14.2, datasets and tokenizers.
All models start from configuration; all text comes from local records.json.
"""
import argparse
from collections import Counter
import copy
import hashlib
import json
from pathlib import Path
import statistics
import torch
from datasets import Dataset
from tokenizers import Tokenizer
from tokenizers.models import BPE, WordLevel
from tokenizers.pre_tokenizers import WhitespaceSplit
from transformers import GPT2Config, GPT2LMHeadModel, PreTrainedTokenizerFast
from trl import DPOConfig, DPOTrainer
from pair_records import load_records
from response_scores import boundary, pack, pair_loss, response_scores
from scratch_dpo import digest_model, frozen_copy


def tokenizer_for(train):
    counts = Counter(word for row in train for field in ("prompt", "chosen", "rejected")
                     for word in row[field].split())
    vocabulary = {word: i for i, word in enumerate(["[PAD]", "[UNK]", "[BOS]", "[EOS]"])}
    for word, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:1024]:
        if word not in vocabulary:
            vocabulary[word] = len(vocabulary)
    backend = Tokenizer(WordLevel(vocabulary, unk_token="[UNK]"))
    backend.pre_tokenizer = WhitespaceSplit()
    return PreTrainedTokenizerFast(tokenizer_object=backend, pad_token="[PAD]", unk_token="[UNK]",
                                   bos_token="[BOS]", eos_token="[EOS]", model_max_length=256,
                                   padding_side="right")


def prepare():
    records = load_records()
    selected = {split: sorted([row for row in records if row["split"] == split],
                             key=lambda row: row["row_id"])[:limit]
                for split, limit in (("train", 128), ("heldout", 64))}
    tokenizer = tokenizer_for(selected["train"])
    encode = lambda text: tokenizer(text, add_special_tokens=False)["input_ids"]
    retained, filtered = {}, {}
    for split, rows in selected.items():
        retained[split], filtered[split] = [], []
        for row in rows:
            try:
                prompt_a, chosen = boundary(encode, row["prompt"], row["chosen"], tokenizer.eos_token_id, 192)
                prompt_b, rejected = boundary(encode, row["prompt"], row["rejected"], tokenizer.eos_token_id, 192)
                if prompt_a != prompt_b:
                    raise ValueError("Pair prompt tokens differ")
            except ValueError as error:
                filtered[split].append({"row_id": row["row_id"], "reason": str(error)})
                continue
            retained[split].append({**row, "prompt_ids": prompt_a, "chosen_ids": chosen,
                                    "rejected_ids": rejected})
        if not retained[split]:
            raise ValueError("No retained pairs in " + split)
    # A real BPE tokenizer, separate from the study data, demonstrates a merge.
    merge = Tokenizer(BPE(vocab={"a": 0, "b": 1, "ab": 2, "[UNK]": 3},
                          merges=[("a", "b")], unk_token="[UNK]"))
    merge_example = {"prompt": merge.encode("a").ids, "full": merge.encode("ab").ids}
    assert merge_example == {"prompt": [0], "full": [2]}
    manifest = {"records_sha256": hashlib.sha256((Path(__file__).parent / "records.json").read_bytes()).hexdigest(),
                "selected": {split: [row["row_id"] for row in rows] for split, rows in selected.items()},
                "retained": {split: [{key: row[key] for key in ("row_id", "family_id", "pair_digest",
                                                               "prompt_ids", "chosen_ids", "rejected_ids")}
                                      for row in rows] for split, rows in retained.items()},
                "filtered": filtered, "vocabulary": tokenizer.get_vocab(),
                "tokenizer_json": tokenizer.backend_tokenizer.to_str(),
                "boundary_merge_fixture": merge_example}
    return tokenizer, retained, manifest


def native_scores(model, batch):
    outputs = model(input_ids=batch["input_ids"], attention_mask=batch["attention_mask"], use_cache=False)
    return response_scores(outputs.logits, **batch)


def rows_batch(rows, tokenizer, both=True):
    prompts = [row["prompt_ids"] for row in rows]
    responses = [row["chosen_ids"] for row in rows]
    if both:
        prompts = prompts * 2
        responses += [row["rejected_ids"] for row in rows]
    return pack(prompts, responses, tokenizer.pad_token_id, 192)


def warm_start(model, rows, tokenizer):
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=0)
    history = []
    # Flatten successive complete passes, then take consecutive groups of eight.
    sequence = (rows * (40 * 8 // len(rows) + 2))[:40 * 8]
    for step in range(41):
        if step % 10 == 0:
            with torch.no_grad():
                total, targets = 0., 0
                for start in range(0, len(rows), 8):
                    scores = native_scores(model, rows_batch(rows[start:start + 8], tokenizer, False))
                    total -= scores["sums"].sum().item()
                    targets += int(scores["counts"].sum())
                history.append({"step": step, "full_train_response_nll": total / targets, "targets": targets})
        if step == 40:
            break
        batch = rows_batch(sequence[step * 8:(step + 1) * 8], tokenizer, False)
        scores = native_scores(model, batch)
        loss = -scores["sums"].sum() / scores["counts"].sum()
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
    return history


def dataset(rows):
    # Let the trainer tokenize the actual text; do not bypass its normal route.
    return Dataset.from_list([{key: row[key] for key in ("row_id", "prompt", "chosen", "rejected")}
                              for row in rows])


def verify_preparation(trainer, rows, tokenizer):
    by_id = {row["row_id"]: row for group in rows.values() for row in group}
    for split, native in (("train", trainer.train_dataset), ("heldout", trainer.eval_dataset)):
        assert len(native) == len(rows[split]), "Unexpected additional filtering"
        for actual in native:
            expected = by_id[actual["row_id"]]
            for field in ("prompt_ids", "chosen_ids", "rejected_ids"):
                assert actual[field] == expected[field], (actual["row_id"], field)
    actual = trainer.data_collator([trainer.train_dataset[i] for i in range(min(8, len(rows["train"])))])
    expected = rows_batch(rows["train"][:8], tokenizer)
    for field in expected:
        assert torch.equal(actual[field], expected[field]), field
    return actual


def parity(trainer, model, reference, batch):
    model.eval()
    twin = copy.deepcopy(model).eval()
    model.zero_grad(set_to_none=True)
    twin.zero_grad(set_to_none=True)
    native = trainer.compute_loss(model, {key: value.clone() for key, value in batch.items()})
    policy = native_scores(twin, batch)
    with torch.no_grad():
        ref = native_scores(reference, batch)
    manual, margins, losses = pair_loss(policy["sums"], ref["sums"], len(batch["input_ids"]) // 2)
    native.backward()
    manual.backward()
    differences = []
    for (name, left), (_, right) in zip(model.named_parameters(), twin.named_parameters()):
        assert (left.grad is None) == (right.grad is None), name
        if left.grad is not None:
            differences.append((left.grad - right.grad).abs().max().item())
    maximum = max(differences)
    assert abs(native.item() - manual.item()) <= 2e-6
    assert maximum <= 2e-5
    model.zero_grad(set_to_none=True)
    trainer.log({"parity_probe_only": 1.0})
    return {"native_loss": native.item(), "manual_loss": manual.item(),
            "absolute_loss_difference": abs(native.item() - manual.item()),
            "max_gradient_difference": maximum, "policy_sums": policy["sums"].tolist(),
            "reference_sums": ref["sums"].tolist(), "margins": margins.tolist(),
            "losses": losses.tolist(), "batch": {key: value.tolist() for key, value in batch.items()}}


@torch.no_grad()
def assess(model, reference, rows, tokenizer):
    model.eval()
    predictions = []
    for start in range(0, len(rows), 8):
        group = rows[start:start + 8]
        batch = rows_batch(group, tokenizer)
        policy, ref = native_scores(model, batch), native_scores(reference, batch)
        _, margins, losses = pair_loss(policy["sums"], ref["sums"], len(group))
        probabilities = (.2 * margins).sigmoid()
        for i, row in enumerate(group):
            j = i + len(group)
            predictions.append({"row_id": row["row_id"], "chosen_logp": policy["sums"][i].item(),
                                "rejected_logp": policy["sums"][j].item(),
                                "reference_chosen_logp": ref["sums"][i].item(),
                                "reference_rejected_logp": ref["sums"][j].item(),
                                "chosen_length": int(policy["counts"][i]),
                                "rejected_length": int(policy["counts"][j]),
                                "margin": margins[i].item(), "probability": probabilities[i].item(),
                                "loss": losses[i].item()})
    return {"predictions": predictions, "metrics": {
        "pairs": len(predictions), "bce": statistics.mean(row["loss"] for row in predictions),
        "brier": statistics.mean((1 - row["probability"]) ** 2 for row in predictions),
        "agreement_ties_half": statistics.mean((row["margin"] > 0) + .5 * (row["margin"] == 0)
                                                for row in predictions),
        "mean_chosen_change": statistics.mean(row["chosen_logp"] - row["reference_chosen_logp"] for row in predictions),
        "mean_rejected_change": statistics.mean(row["rejected_logp"] - row["reference_rejected_logp"] for row in predictions),
        "mean_chosen_length": statistics.mean(row["chosen_length"] for row in predictions),
        "mean_rejected_length": statistics.mean(row["rejected_length"] for row in predictions)}}


@torch.no_grad()
def generate(model, rows, tokenizer):
    model.eval()
    generator = torch.Generator().manual_seed(943)
    results = []
    for row in rows[:4]:
        for sample in range(2):
            ids = list(row["prompt_ids"])
            for _ in range(24):
                inputs = torch.tensor([ids])
                logits = model(input_ids=inputs, attention_mask=torch.ones_like(inputs), use_cache=False).logits[0, -1]
                token = int(torch.multinomial(logits.softmax(-1), 1, generator=generator))
                ids.append(token)
                if token == tokenizer.eos_token_id:
                    break
            response = ids[len(row["prompt_ids"]):]
            results.append({"row_id": row["row_id"], "sample": sample, "prompt": row["prompt"],
                            "response_ids": response, "response": tokenizer.decode(response, skip_special_tokens=False),
                            "length": len(response), "stop": "EOS" if response[-1] == tokenizer.eos_token_id else "horizon",
                            "malformed": any(token in (tokenizer.pad_token_id, tokenizer.bos_token_id) for token in response)})
    return results


def run(selection_path, workdir, preflight=False):
    torch.set_num_threads(2)
    torch.manual_seed(43)
    tokenizer, rows, manifest = prepare()
    if json.loads(selection_path.read_text(encoding="utf-8")) != manifest:
        raise ValueError("Selection differs from the saved prospective membership")
    config = GPT2Config(vocab_size=len(tokenizer), n_positions=256, n_ctx=256, n_embd=32, n_layer=1,
                        n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                        pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id,
                        bos_token_id=tokenizer.bos_token_id)
    model = GPT2LMHeadModel(config)
    args = DPOConfig(output_dir=str(workdir), use_cpu=True, bf16=False, fp16=False,
                     per_device_train_batch_size=8, per_device_eval_batch_size=8,
                     max_steps=40, learning_rate=.001, weight_decay=0., lr_scheduler_type="constant",
                     max_grad_norm=1., beta=.2, loss_type="sigmoid", label_smoothing=0.,
                     gradient_checkpointing=False, max_length=192, truncation_mode="keep_start",
                     precompute_ref_log_probs=False, sync_ref_model=False, report_to="none",
                     save_strategy="no", logging_steps=10, disable_tqdm=True,
                     seed=43, data_seed=43, dataloader_num_workers=0)
    sft = [] if preflight else warm_start(model, rows["train"], tokenizer)
    reference = frozen_copy(model)
    reference_hash = digest_model(reference)
    trainer = DPOTrainer(model=model, ref_model=reference, args=args,
                         train_dataset=dataset(rows["train"]), eval_dataset=dataset(rows["heldout"]),
                         processing_class=tokenizer)
    batch = verify_preparation(trainer, rows, tokenizer)
    parity_report = parity(trainer, model, reference, batch)
    if preflight:
        return {"kind": "no-fit native preparation and same-state gradient preflight",
                "optimizer_updates": 0, "parity": parity_report,
                "pairs": {key: len(value) for key, value in rows.items()},
                "reference_weights": reference_hash}
    initial = assess(model, reference, rows["heldout"], tokenizer)
    assert all(row["margin"] == 0 for row in initial["predictions"])
    baseline_generations = generate(model, rows["heldout"], tokenizer)
    trainer.train()
    final = assess(model, reference, rows["heldout"], tokenizer)
    final_generations = generate(model, rows["heldout"], tokenizer)
    assert digest_model(reference) == reference_hash
    assert all(parameter.grad is None for parameter in reference.parameters())
    tokenizer.save_pretrained(str(workdir / "tokenizer"))
    return {"kind": "released human comparisons; tiny from-config causal model; mechanism/API study",
            "selection_sha256": hashlib.sha256(selection_path.read_bytes()).hexdigest(),
            "pairs": {key: len(value) for key, value in rows.items()}, "filtered": manifest["filtered"],
            "vocabulary_size": len(tokenizer), "parameters": sum(p.numel() for p in model.parameters()),
            "sft": sft, "parity": parity_report, "before": initial, "after": final,
            "baseline_generations": baseline_generations, "final_generations": final_generations,
            "reference_weights": reference_hash, "final_weights": digest_model(model),
            "native_log_history": trainer.state.log_history,
            "checks": ["exact selected family membership", "prompt concatenated once", "EOS appended once",
                       "whole-pair context filter", "chosen-first batch", "same-state loss and gradients",
                       "initial relative margins zero", "frozen reference unchanged"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--selection", type=Path, default=Path("selection.json"))
    parser.add_argument("--workdir", type=Path, default=Path("dpo-trainer-output"))
    parser.add_argument("--output", type=Path, default=Path("trl-dpo-results.json"))
    args = parser.parse_args()
    if args.prepare_only:
        _, rows, manifest = prepare()
        args.selection.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"retained": {key: len(value) for key, value in rows.items()},
                          "filtered": manifest["filtered"]}, indent=2))
        return
    result = run(args.selection, args.workdir, args.preflight_only)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"parity": {key: result["parity"][key] for key in (
        "native_loss", "manual_loss", "max_gradient_difference")},
        "before": result.get("before", {}).get("metrics"),
        "after": result.get("after", {}).get("metrics")}, indent=2))


if __name__ == "__main__":
    main()
