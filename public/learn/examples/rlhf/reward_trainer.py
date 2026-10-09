"""Current TRL RewardTrainer on frozen real human comparisons, from config.

python reward_trainer.py --output reward-trainer-results.json --workdir trainer-output
Requires torch, transformers==5.19.0, trl==1.14.2, datasets and tokenizers.
All text and tokenizer training data come from local records.json; no downloads.
"""
import argparse
from collections import Counter
import copy
import json
from pathlib import Path
import statistics
import torch
import torch.nn.functional as F
from datasets import Dataset
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from tokenizers.pre_tokenizers import WhitespaceSplit
from transformers import GPT2Config, GPT2ForSequenceClassification, PreTrainedTokenizerFast
from trl import RewardConfig, RewardTrainer
from preference_records import ROOT, load_records


def make_tokenizer(records):
    counts = Counter(word for row in records for field in ("prompt", "chosen", "rejected") for word in row[field].split())
    vocabulary = {word: i for i, word in enumerate(["[PAD]", "[UNK]", "[BOS]", "[EOS]"])}
    for word, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:1024]:
        if word not in vocabulary:
            vocabulary[word] = len(vocabulary)
    backend = Tokenizer(WordLevel(vocabulary, unk_token="[UNK]"))
    backend.pre_tokenizer = WhitespaceSplit()
    return PreTrainedTokenizerFast(tokenizer_object=backend, pad_token="[PAD]", unk_token="[UNK]",
                                   bos_token="[BOS]", eos_token="[EOS]", model_max_length=256, padding_side="right")


def dataset(records):
    return Dataset.from_list([{key: row[key] for key in ("row_id", "prompt", "chosen", "rejected")} for row in records])


def run(workdir):
    torch.set_num_threads(2)
    torch.manual_seed(31)
    records = load_records()
    train = sorted([row for row in records if row["split"] == "train"], key=lambda row: row["row_id"])[:128]
    heldout = sorted([row for row in records if row["split"] == "heldout"], key=lambda row: row["row_id"])[:64]
    tokenizer = make_tokenizer(train)
    config = GPT2Config(vocab_size=len(tokenizer), n_positions=256, n_ctx=256, n_embd=32, n_layer=1,
                        n_head=2, num_labels=1, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                        pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id,
                        bos_token_id=tokenizer.bos_token_id)
    model = GPT2ForSequenceClassification(config)
    args = RewardConfig(output_dir=str(workdir), use_cpu=True, bf16=False, fp16=False,
                        per_device_train_batch_size=8, per_device_eval_batch_size=8,
                        max_steps=20, learning_rate=.001, weight_decay=0., lr_scheduler_type="constant",
                        gradient_checkpointing=False, center_rewards_coefficient=None, max_length=192,
                        report_to="none", save_strategy="no", logging_steps=5, disable_tqdm=True,
                        seed=31, data_seed=31, dataloader_num_workers=0)
    trainer = RewardTrainer(model=model, args=args, train_dataset=dataset(train),
                            eval_dataset=dataset(heldout), processing_class=tokenizer)
    prepared = trainer.train_dataset
    original = {row["row_id"]: row for row in train + heldout}
    for split in (trainer.train_dataset, trainer.eval_dataset):
        for row in split:
            source = original[row["row_id"]]
            for key in ("chosen", "rejected"):
                expected = tokenizer(source["prompt"] + source[key] + tokenizer.eos_token)["input_ids"]
                assert row[key + "_ids"] == expected, "Prompt must be concatenated once, then EOS"
                assert expected[-1] == tokenizer.eos_token_id
    batch = trainer.data_collator([prepared[i] for i in range(min(8, len(prepared)))])
    model.eval()
    twin = copy.deepcopy(model).eval()
    loss = trainer.compute_loss(model, {key: value.clone() for key, value in batch.items()})
    outputs = twin(**batch, use_cache=False).logits.squeeze(-1)
    a, b = outputs.chunk(2)
    manual = F.softplus(-(a - b)).mean()
    loss.backward()
    manual.backward()
    differences = [(p.grad - q.grad).abs().max().item() for p, q in zip(model.parameters(), twin.parameters()) if p.grad is not None]
    maximum = max(differences)
    assert abs(loss.item() - manual.item()) < 1e-7
    assert maximum < 1e-6
    model.zero_grad(set_to_none=True)
    # compute_loss queues diagnostic metrics even for a manual parity probe.
    # Flush that explicitly labelled probe before held-out evaluation collects.
    trainer.log({"parity_probe_only": 1.0})
    trainer.train()
    evaluation = trainer.evaluate()
    predictions = []
    model.eval()
    with torch.no_grad():
        for row in trainer.eval_dataset:
            batch = trainer.data_collator([row])
            scores = model(**batch, use_cache=False).logits.flatten()
            gap = scores[0] - scores[1]
            predictions.append({"row_id": row["row_id"], "chosen_score": scores[0].item(), "rejected_score": scores[1].item(),
                                "probability": gap.sigmoid().item(), "gap": gap.item(), "bce": F.softplus(-gap).item()})
    tokenizer.save_pretrained(str(workdir / "tokenizer"))
    return {"kind": "real released human comparisons; tiny from-config model; no semantic capability claim",
            "input_pairs": {"train": len(train), "heldout": len(heldout)},
            "retained_pairs": {"train": len(trainer.train_dataset), "heldout": len(trainer.eval_dataset)},
            "whole_pair_filtered": {"train": len(train) - len(trainer.train_dataset), "heldout": len(heldout) - len(trainer.eval_dataset)},
            "vocabulary": len(tokenizer), "parameters": sum(p.numel() for p in model.parameters()),
            "parity": {"trl_loss": loss.item(), "manual_loss": manual.item(), "max_gradient_difference": maximum},
            "heldout_metrics": {"pairs": len(predictions),
                                "accuracy_ties_half": statistics.mean((row["gap"] > 0) + .5 * (row["gap"] == 0) for row in predictions),
                                "bce_nats": statistics.mean(row["bce"] for row in predictions),
                                "brier": statistics.mean((1 - row["probability"]) ** 2 for row in predictions)},
            "evaluation": evaluation, "log_history": trainer.state.log_history, "predictions": predictions,
            "checks": ["prompt exactly once", "EOS preserved", "whole pair filtering", "chosen-first then rejected", "same-state loss/gradient"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "reward-trainer-results.json")
    parser.add_argument("--workdir", type=Path, default=Path("trainer-output"))
    args = parser.parse_args()
    result = run(args.workdir)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: result[key] for key in ("parity", "evaluation", "whole_pair_filtered")}, indent=2))


if __name__ == "__main__":
    main()
