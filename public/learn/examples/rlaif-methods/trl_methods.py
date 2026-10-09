"""Current TRL IPO/ORPO contracts on the same configured GPT-2 and real pairs.

python -B trl_methods.py --output trl-results.json --workdir trainer-output
Requires the pinned requirements.txt stack. No checkpoint is downloaded.
Each native trainer performs exactly one SGD update, matched to explicit code.
"""

import argparse
import copy
import importlib.metadata
from pathlib import Path

import torch
import torch.nn.functional as F
from datasets import Dataset
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from tokenizers.pre_tokenizers import WhitespaceSplit
from transformers import GPT2Config, GPT2LMHeadModel, PreTrainedTokenizerFast
from trl import DPOConfig, DPOTrainer
from trl.experimental.orpo import ORPOConfig, ORPOTrainer

from preference_losses import ipo_loss, orpo_loss
from records_and_masks import digest_model, emit, prepare, rows_batch, tokens
from response_scores import response_scores


def tokenizer_for(vocabulary):
    backend = Tokenizer(WordLevel(vocabulary, unk_token="[UNK]"))
    backend.pre_tokenizer = WhitespaceSplit()
    return PreTrainedTokenizerFast(tokenizer_object=backend, pad_token="[PAD]", unk_token="[UNK]",
                                   bos_token="[BOS]", eos_token="[EOS]", model_max_length=196,
                                   padding_side="right")


def trainer_dataset(rows):
    # Make the lexical representation explicit, keeping original strings in records.json.
    return Dataset.from_list([{
        "id": row["id"], "prompt": "[BOS] " + " ".join(tokens(row["prompt"])) + " [SEP] ",
        "chosen": " ".join(tokens(row["chosen"])), "rejected": " ".join(tokens(row["rejected"])),
    } for row in rows])


def native_scoring(model, batch):
    logits = model(input_ids=batch["input_ids"], attention_mask=batch["attention_mask"], use_cache=False).logits
    return logits, response_scores(logits, **batch)


def manual_loss(model, reference, batch, method):
    logits, policy = native_scoring(model, batch)
    pairs = len(batch["input_ids"]) // 2
    if method == "IPO":
        with torch.no_grad():
            _, ref = native_scoring(reference, batch)
        loss, margin, _ = ipo_loss(policy["sums"], ref["sums"], policy["counts"], pairs, tau=.5)
        details = {"margin": margin.tolist(), "target": 1., "counts": policy["counts"].tolist()}
    else:
        means = policy["sums"] / policy["counts"]
        # Current ORPO imitates ALL visible chosen targets, including prompt tokens.
        labels = batch["input_ids"][:pairs, 1:]
        visible = batch["attention_mask"][:pairs, 1:] & batch["attention_mask"][:pairs, :-1]
        full_prompt_nll = F.cross_entropy(logits[:pairs, :-1][visible], labels[visible])
        loss, margin, contrast = orpo_loss(means[:pairs], means[pairs:], .1, chosen_nll=full_prompt_nll)
        details = {"odds_margin": margin.tolist(), "response_means": means.tolist(),
                   "contrast": contrast.tolist(), "full_prompt_chosen_nll": full_prompt_nll.item(),
                   "response_only_equal_response_nll": (-means[:pairs]).mean().item(),
                   "full_prompt_target_count": int(visible.sum()),
                   "response_target_count": int(policy["counts"][:pairs].sum())}
    return loss, details


def verify_batch(trainer, rows, vocabulary, method):
    expected = rows_batch(rows, vocabulary)
    features = [trainer.train_dataset[index] for index in range(len(rows))]
    batch = trainer.data_collator(features)
    if method == "IPO":
        for field in ["input_ids", "attention_mask", "completion_mask"]:
            assert torch.equal(batch[field], expected[field]), field
    else:
        # ORPO's split collator includes prompt-masked chosen/rejected labels.
        for name, offset in [("chosen", 0), ("rejected", len(rows))]:
            ids, attention, labels = batch[name + "_input_ids"], batch[name + "_attention_mask"], batch[name + "_labels"]
            for index, row in enumerate(rows):
                length = len(row["prompt_ids"]) + len(row[name + "_ids"])
                assert ids[index, :length].tolist() == expected["input_ids"][index + offset, :length].tolist()
                assert attention[index, :length].bool().all()
                prefix_length = len(row["prompt_ids"])
                assert (labels[index, :prefix_length] == -100).all()
                assert labels[index, prefix_length:length].tolist() == row[name + "_ids"]
                assert (labels[index, length:] == -100).all()
    return batch, expected


def one_contract(initial, reference, dataset, rows, vocabulary, tokenizer, method, workdir):
    model = copy.deepcopy(initial).eval()
    twin = copy.deepcopy(initial).eval()
    optimizer = torch.optim.SGD(model.parameters(), lr=.01)
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda step: 1.)
    common = dict(output_dir=str(workdir / method), use_cpu=True, bf16=False, fp16=False,
                  per_device_train_batch_size=2, gradient_accumulation_steps=1, max_steps=1,
                  learning_rate=.01, lr_scheduler_type="constant", weight_decay=0., max_grad_norm=0.,
                  report_to="none", save_strategy="no", disable_tqdm=True, dataloader_num_workers=0,
                  seed=17, data_seed=17, gradient_checkpointing=False, remove_unused_columns=False)
    if method == "IPO":
        args = DPOConfig(**common, beta=.5, loss_type=["ipo"], max_length=196,
                         precompute_ref_log_probs=False, sync_ref_model=False)
        trainer = DPOTrainer(model=model, ref_model=copy.deepcopy(reference), args=args,
                             train_dataset=dataset, processing_class=tokenizer, optimizers=(optimizer, scheduler))
    else:
        args = ORPOConfig(**common, beta=.1, max_length=196)
        trainer = ORPOTrainer(model=model, args=args, train_dataset=dataset,
                              processing_class=tokenizer, optimizers=(optimizer, scheduler))
    native_batch, explicit_batch = verify_batch(trainer, rows, vocabulary, method)
    model.zero_grad(set_to_none=True)
    twin.zero_grad(set_to_none=True)
    native = trainer.compute_loss(model, {key: value.clone() if isinstance(value, torch.Tensor) else value
                                         for key, value in native_batch.items()})
    manual, details = manual_loss(twin, reference, explicit_batch, method)
    native.backward()
    manual.backward()
    differences = []
    for (name, left), (other_name, right) in zip(model.named_parameters(), twin.named_parameters()):
        assert name == other_name and (left.grad is None) == (right.grad is None)
        if left.grad is not None:
            differences.append((left.grad - right.grad).abs().max().item())
    gradient_difference = max(differences)
    assert abs(native.item() - manual.item()) < 3e-6
    assert gradient_difference < 3e-5
    torch.optim.SGD(twin.parameters(), lr=.01).step()
    model.zero_grad(set_to_none=True)
    trainer.train()
    state_difference = max((left - right).abs().max().item()
                           for left, right in zip(model.parameters(), twin.parameters()))
    assert trainer.state.global_step == 1 and state_difference < 3e-6
    return {"method": method, "native_loss": native.item(), "explicit_loss": manual.item(),
            "loss_difference": abs(native.item() - manual.item()), "max_gradient_difference": gradient_difference,
            "max_one_update_parameter_difference": state_difference, "optimizer_updates": 1,
            "start_state_sha256": digest_model(initial), "final_native_state_sha256": digest_model(model),
            "details": details, "native_batch": {key: value.tolist() for key, value in native_batch.items()
                                                   if isinstance(value, torch.Tensor)},
            "native_log_history": trainer.state.log_history}


def run(workdir):
    torch.set_num_threads(2)
    torch.manual_seed(17)
    records, vocabulary = prepare()
    rows = records["train"][:2]
    tokenizer = tokenizer_for(vocabulary)
    config = GPT2Config(vocab_size=len(vocabulary), n_positions=196, n_ctx=196, n_embd=24,
                        n_layer=1, n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                        bos_token_id=vocabulary["[BOS]"], eos_token_id=vocabulary["[EOS]"],
                        pad_token_id=vocabulary["[PAD]"])
    initial = GPT2LMHeadModel(config).eval()
    reference = copy.deepcopy(initial).eval().requires_grad_(False)
    reference_hash = digest_model(reference)
    dataset = trainer_dataset(rows)
    results = [one_contract(initial, reference, dataset, rows, vocabulary, tokenizer, method, workdir)
               for method in ["IPO", "ORPO"]]
    assert digest_model(reference) == reference_hash and all(value.grad is None for value in reference.parameters())
    return {"kind": "Two native API/loss/gradient/SGD contracts, not assistant training quality",
            "versions": {name: importlib.metadata.version(name) for name in
                         ["torch", "transformers", "trl", "datasets", "tokenizers", "accelerate", "numpy"]},
            "ids": [row["id"] for row in rows], "vocabulary_size": len(vocabulary),
            "tokenizer_json": tokenizer.backend_tokenizer.to_str(), "GPT2_config": config.to_dict(),
            "reference_state_sha256": reference_hash, "results": results,
            "scope": "Same GPT-2 config/weights/batch for native-explicit parity; TinyLM is a separate architecture."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=Path, default=Path("trainer-output"))
    parser.add_argument("--output", type=Path, default=Path("trl-results.json"))
    args = parser.parse_args()
    result = run(args.workdir)
    emit(args.output, result)
    print([{key: row[key] for key in ["method", "loss_difference", "max_gradient_difference", "max_one_update_parameter_difference"]}
           for row in result["results"]])


if __name__ == "__main__":
    main()
