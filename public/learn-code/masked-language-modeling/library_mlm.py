"""Train the ordinary Transformers BERT/collator route, entirely offline.

Run: python library_mlm.py --output library-experiment.json
Requires torch, numpy and transformers; the three companion files stay beside it.
This constructs a SMALL RANDOM BERT, not pretrained bert-base weights.
"""
import argparse
import json
from pathlib import Path
import tempfile

import numpy as np
import torch
import torch.nn.functional as F
import transformers
from transformers import BertConfig, BertForMaskedLM, BertTokenizer, DataCollatorForLanguageModeling

from tiny_mlm import PAD, SPECIALS, prepare_data


def features_from(rows):
    return [{"input_ids": row.tolist(),
             "attention_mask": (row != PAD).long().tolist(),
             "special_tokens_mask": (row < len(SPECIALS)).long().tolist()}
            for row in rows]


@torch.no_grad()
def evaluate(model, batch):
    model.eval()
    count = int((batch["labels"] != -100).sum())
    if not count:
        return {"targets": 0, "loss": None, "accuracy": None}
    result = model(**batch)
    selected = batch["labels"] != -100
    manual = F.cross_entropy(result.logits[selected], batch["labels"][selected])
    return {"targets": count, "loss": result.loss.item(),
            "manual_loss_difference": abs(result.loss.item() - manual.item()),
            "accuracy": (result.logits.argmax(-1)[selected] == batch["labels"][selected]).float().mean().item()}


def run(steps=120):
    torch.set_num_threads(2)
    torch.manual_seed(17)
    train, test, vocabulary, data = prepare_data(Path(__file__).with_name("alice_excerpt.txt"))
    with tempfile.TemporaryDirectory() as directory:
        vocab_path = Path(directory) / "vocab.txt"
        vocab_path.write_text("\n".join(vocabulary) + "\n", encoding="utf-8")
        tokenizer = BertTokenizer(vocab=str(vocab_path), do_lower_case=True)
        # Input examples already contain IDs from this exact local vocabulary.
        assert len(tokenizer) == len(vocabulary)
        collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer, mlm=True, mlm_probability=0.15,
            mask_replace_prob=0.8, random_replace_prob=0.1, seed=17,
        )
        fixed_collator = DataCollatorForLanguageModeling(tokenizer, mlm=True, mlm_probability=0.15, seed=101)
        fixed_test = fixed_collator(features_from(test))
        config = BertConfig(vocab_size=len(vocabulary), hidden_size=48,
                            num_hidden_layers=2, num_attention_heads=4,
                            intermediate_size=192, max_position_embeddings=26,
                            hidden_dropout_prob=0, attention_probs_dropout_prob=0,
                            pad_token_id=PAD)
        model = BertForMaskedLM(config)
        optimizer = torch.optim.AdamW(model.parameters(), lr=0.002, weight_decay=0.01)
        before = evaluate(model, fixed_test)
        rng = np.random.default_rng(17)
        updates = 0
        for _ in range(steps):
            original = train[rng.integers(len(train), size=16)]
            batch = collator(features_from(original))
            if not (batch["labels"] != -100).any():
                continue
            # Use the original padding mask supplied by the collator, even if
            # random replacement happens to draw the PAD vocabulary ID.
            model.train()
            loss = model(**batch).loss
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1)
            optimizer.step()
            updates += 1
        after = evaluate(model, fixed_test)
        tied = model.get_input_embeddings().weight.data_ptr() == model.get_output_embeddings().weight.data_ptr()
        report = {"parameter_origin": "BertConfig: random initialization",
                  "steps": steps, "updates": updates, "data": data,
                  "versions": {"transformers": transformers.__version__, "torch": torch.__version__, "numpy": np.__version__},
                  "before": before, "after": after, "tied_embedding": tied,
                  "held_out_input_shape": list(fixed_test["input_ids"].shape),
                  "configuration": config.to_dict()}
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=120)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = json.dumps(run(args.steps), indent=2)
    if args.output:
        args.output.write_text(result + "\n", encoding="utf-8")
    print(result)
