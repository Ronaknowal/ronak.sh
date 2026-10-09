"""Ordinary current TRL CPOTrainer in explicit plain SimPO mode on frozen released human comparisons.

python -B trl_simpo.py --prepare-only --selection selection.json
python -B trl_simpo.py --selection selection.json --output trl-simpo-results.json
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
from trl.experimental.cpo import CPOConfig, CPOTrainer
from pair_records import load_records
from response_scores import boundary, pack, pair_loss, response_scores
from scratch_simpo import digest_model


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
                prompt_a, chosen = boundary(encode, row["prompt"], row["chosen"], tokenizer.eos_token_id, 191)
                prompt_b, rejected = boundary(encode, row["prompt"], row["rejected"], tokenizer.eos_token_id, 191)
                if prompt_a != prompt_b:
                    raise ValueError("Pair prompt tokens differ")
            except ValueError as error:
                filtered[split].append({"row_id": row["row_id"], "reason": str(error)})
                continue
            retained[split].append({**row, "prompt_ids": [tokenizer.bos_token_id] + prompt_a, "chosen_ids": chosen,
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
                "boundary_merge_fixture": merge_example, "native_convention": "BOS prompt + response EOS; total <=192"}
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


@torch.no_grad()
def generate(model, rows, tokenizer):
    model.eval()
    generator = torch.Generator().manual_seed(953)
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


def verify_preparation(trainer, rows, tokenizer):
    by_id = {row["row_id"]: row for group in rows.values() for row in group}
    checked = 0
    for split, native in (("train", trainer.train_dataset), ("heldout", trainer.eval_dataset)):
        assert len(native) == len(rows[split]), "Unexpected additional native filtering"
        for actual in native:
            expected = by_id[actual["row_id"]]
            assert actual["prompt_input_ids"] == expected["prompt_ids"]
            for role in ("chosen", "rejected"):
                complete = expected["prompt_ids"] + expected[role + "_ids"]
                labels = [-100] * len(expected["prompt_ids"]) + expected[role + "_ids"]
                assert actual[role + "_input_ids"] == complete
                assert actual[role + "_labels"] == labels
                assert actual[role + "_attention_mask"] == [1] * len(complete)
                assert labels[-1] == tokenizer.eos_token_id
                checked += 1
    batch = trainer.data_collator([trainer.train_dataset[i] for i in range(min(8, len(rows["train"])) )])
    joined = trainer.concatenated_inputs(batch, padding_value=tokenizer.pad_token_id, device=torch.device("cpu"))
    expected = rows_batch(rows["train"][:8], tokenizer)
    assert torch.equal(joined["concatenated_input_ids"], expected["input_ids"])
    assert torch.equal(joined["concatenated_attention_mask"].bool(), expected["attention_mask"])
    labels = expected["input_ids"].masked_fill(~expected["completion_mask"], -100)
    assert torch.equal(joined["concatenated_labels"], labels)
    return batch, expected, checked


def parity(trainer, model, batch, expected):
    model.eval()
    twin = copy.deepcopy(model).eval()
    model.zero_grad(set_to_none=True)
    twin.zero_grad(set_to_none=True)
    # This API returns the scalar and a metrics dictionary; no guessed tuple fields.
    native, metrics = trainer.get_batch_loss_metrics(model, batch, train_eval="eval")
    scores = native_scores(twin, expected)
    manual, gaps, losses = pair_loss(scores["sums"], scores["counts"], len(expected["input_ids"]) // 2)
    native.backward()
    manual.backward()
    differences = []
    for (name, left), (other_name, right) in zip(model.named_parameters(), twin.named_parameters()):
        assert name == other_name and (left.grad is None) == (right.grad is None)
        if left.grad is not None:
            assert torch.isfinite(left.grad).all() and torch.isfinite(right.grad).all()
            differences.append({"name": name, "max_difference": (left.grad - right.grad).abs().max().item()})
    maximum = max(row["max_difference"] for row in differences)
    assert abs(native.item() - manual.item()) <= 2e-6
    assert maximum <= 2e-5
    model.zero_grad(set_to_none=True)
    return {"native_loss": native.item(), "manual_loss": manual.item(),
            "max_gradient_difference": maximum, "all_parameter_gradients": differences,
            "native_metrics": metrics, "sums": scores["sums"].tolist(),
            "counts": scores["counts"].tolist(), "gaps": gaps.tolist(), "losses": losses.tolist(),
            "selected_token_logps": scores["tokens"].tolist(), "valid": scores["valid"].tolist(),
            "independent_batch": {key: value.tolist() for key, value in expected.items()},
            "native_batch": {key: value.tolist() for key, value in batch.items() if isinstance(value, torch.Tensor)}}


@torch.no_grad()
def assess(model, rows, tokenizer):
    model.eval()
    predictions = []
    for start in range(0, len(rows), 8):
        group = rows[start:start + 8]
        scores = native_scores(model, rows_batch(group, tokenizer))
        means = scores["sums"] / scores["counts"]
        _, gaps, losses = pair_loss(scores["sums"], scores["counts"], len(group))
        for i, row in enumerate(group):
            j = i + len(group)
            predictions.append({"row_id": row["row_id"], "chosen_sum": scores["sums"][i].item(),
                                "rejected_sum": scores["sums"][j].item(),
                                "chosen_mean": means[i].item(), "rejected_mean": means[j].item(),
                                "chosen_length": int(scores["counts"][i]), "rejected_length": int(scores["counts"][j]),
                                "mean_gap": gaps[i].item(), "loss": losses[i].item()})
    return {"predictions": predictions, "metrics": {
        "pairs": len(predictions), "surrogate": statistics.mean(row["loss"] for row in predictions),
        "agreement_strict": statistics.mean(row["mean_gap"] > 0 for row in predictions),
        "agreement_ties_half": statistics.mean((row["mean_gap"] > 0) + .5 * (row["mean_gap"] == 0) for row in predictions),
        "desired_gap_fraction": statistics.mean(row["mean_gap"] >= .2 for row in predictions),
        "mean_gap": statistics.mean(row["mean_gap"] for row in predictions)}}


def run(selection_path, workdir, preflight=False):
    torch.set_num_threads(2)
    torch.manual_seed(53)
    tokenizer, rows, manifest = prepare()
    if json.loads(selection_path.read_text(encoding="utf-8")) != manifest:
        raise ValueError("Preparation differs from the saved prospective membership")
    workdir.mkdir(parents=True, exist_ok=True)
    if not preflight and any(workdir.glob("*-model")):
        raise ValueError("Preserve prior model artifacts; choose a new work directory")
    config = GPT2Config(vocab_size=len(tokenizer), n_positions=256, n_ctx=256, n_embd=32, n_layer=1,
                        n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                        pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id,
                        bos_token_id=tokenizer.bos_token_id)
    model = GPT2LMHeadModel(config)
    args = CPOConfig(output_dir=str(workdir), use_cpu=True, bf16=False, fp16=False,
                     per_device_train_batch_size=8, per_device_eval_batch_size=8,
                     max_steps=40, learning_rate=.001, weight_decay=0., lr_scheduler_type="constant",
                     max_grad_norm=1., beta=2., simpo_gamma=.4, loss_type="simpo",
                     cpo_alpha=0., alpha=0., label_smoothing=0., disable_dropout=True,
                     gradient_checkpointing=False, max_length=192, report_to="none",
                     save_strategy="no", logging_steps=10, disable_tqdm=True,
                     seed=53, data_seed=53, dataloader_num_workers=0)
    sft = [] if preflight else warm_start(model, rows["train"], tokenizer)
    initial_hash = digest_model(model)
    trainer = CPOTrainer(model=model, args=args, train_dataset=dataset(rows["train"]),
                         eval_dataset=dataset(rows["heldout"]), processing_class=tokenizer)
    batch, expected, checked = verify_preparation(trainer, rows, tokenizer)
    parity_report = parity(trainer, model, batch, expected)
    assert digest_model(model) == initial_hash
    if preflight:
        return {"kind": "no-fit native preparation and all-gradient preflight", "optimizer_updates": 0,
                "parity": parity_report, "prepared_response_rows_checked": checked,
                "pairs": {key: len(value) for key, value in rows.items()}, "initial_weights": initial_hash}
    model.save_pretrained(workdir / "initial-model")
    tokenizer.save_pretrained(workdir / "tokenizer")
    before = assess(model, rows["heldout"], tokenizer)
    before_generations = generate(model, rows["heldout"], tokenizer)
    trainer.train()
    after = assess(model, rows["heldout"], tokenizer)
    after_generations = generate(model, rows["heldout"], tokenizer)
    model.save_pretrained(workdir / "final-model")
    restored = GPT2LMHeadModel.from_pretrained(workdir / "final-model").eval()
    assert digest_model(restored) == digest_model(model)
    assert assess(restored, rows["heldout"], tokenizer) == after
    changes = [{"row_id": b["row_id"], **{key + "_change": a[key] - b[key]
                for key in ("chosen_sum", "rejected_sum", "chosen_mean", "rejected_mean")}}
               for b, a in zip(before["predictions"], after["predictions"])]
    return {"kind": "released comparisons; tiny from-config causal model; native API and measurement study",
            "selection_sha256": hashlib.sha256(selection_path.read_bytes()).hexdigest(),
            "pairs": {key: len(value) for key, value in rows.items()}, "filtered": manifest["filtered"],
            "vocabulary_size": len(tokenizer), "parameters": sum(p.numel() for p in model.parameters()),
            "sft": sft, "parity": parity_report, "prepared_response_rows_checked": checked,
            "before": before, "after": after, "absolute_changes": changes,
            "before_generations": before_generations, "after_generations": after_generations,
            "initial_weights": initial_hash, "final_weights": digest_model(model),
            "native_log_history": trainer.state.log_history,
            "checks": ["exact supplied families", "native BOS and EOS", "whole-pair context rejection",
                       "native versus independent loss and all parameter gradients", "save/reload exact held-out scores"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--selection", type=Path, default=Path("selection.json"))
    parser.add_argument("--workdir", type=Path, default=Path("simpo-trainer-output"))
    parser.add_argument("--output", type=Path, default=Path("trl-simpo-results.json"))
    args = parser.parse_args()
    if args.prepare_only:
        if args.selection.exists():
            raise ValueError("Preserve the existing preparation manifest")
        _, rows, manifest = prepare()
        args.selection.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"retained": {key: len(value) for key, value in rows.items()}, "filtered": manifest["filtered"]}))
    else:
        if args.output.exists():
            raise ValueError("Refusing to overwrite prior scientific output")
        result = run(args.selection, args.workdir, args.preflight_only)
        args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"native_loss": result["parity"]["native_loss"],
                          "gradient_difference": result["parity"]["max_gradient_difference"],
                          "before": result.get("before", {}).get("metrics"),
                          "after": result.get("after", {}).get("metrics")}, indent=2))


