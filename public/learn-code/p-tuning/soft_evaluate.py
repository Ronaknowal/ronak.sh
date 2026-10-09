"""Align PEFT real-token logits before reusing the exact SFT evaluator.

Run: python soft_evaluate.py --verify --output alignment.json
Or: python soft_evaluate.py --model pythia-14m --adapter adapter --data poems
                            --split test --output evaluation.json
The scientific study controls when test evaluation is allowed.
"""
import argparse
import json
from pathlib import Path
from types import SimpleNamespace

import torch
from torch import nn

from sft_evaluate import evaluate, response_nll
from sft_data import load_source


class RealLogits(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
        config = getattr(model, "active_peft_config", None)
        self.virtual = 0 if config is None or str(config.peft_type).endswith("PREFIX_TUNING") else config.num_virtual_tokens

    def forward(self, input_ids, attention_mask, use_cache=False):
        if use_cache:
            raise ValueError("This wrapper is the full-recomputation evaluation route")
        result = self.model(input_ids=input_ids, attention_mask=attention_mask, use_cache=False)
        logits = result.logits
        expected = input_ids.shape[1] + self.virtual
        if logits.shape[1] != expected:
            raise ValueError(f"Expected {expected} output rows, received {logits.shape[1]}")
        return SimpleNamespace(logits=logits[:, self.virtual:])


def verify():
    class Fixture(nn.Module):
        def __init__(self, virtual):
            super().__init__()
            self.active_peft_config = SimpleNamespace(peft_type="PROMPT_TUNING", num_virtual_tokens=virtual)
            self.virtual = virtual

        def forward(self, input_ids, attention_mask, use_cache=False):
            batch, length = input_ids.shape
            real = torch.zeros(batch, length, 7, dtype=torch.float64)
            real.scatter_(2, ((input_ids + 1) % 7)[..., None], 2.0)
            # Deliberately very different virtual logits expose wrong alignment.
            prefix = torch.full((batch, self.virtual, 7), -1000.0, dtype=torch.float64)
            return SimpleNamespace(logits=torch.cat([prefix, real], dim=1))

    rows = [{"id": "short", "ids": [1, 2, 3, 0], "boundary": 2, "eos_id": 0},
            {"id": "long", "ids": [1, 2, 3, 4, 5, 0], "boundary": 2, "eos_id": 0}]
    baseline = response_nll(RealLogits(Fixture(0)), rows, 2, True)
    for count in (1, 3, 8):
        actual = response_nll(RealLogits(Fixture(count)), rows, 2, True)
        assert actual == baseline
        assert actual == response_nll(RealLogits(Fixture(count)), rows, 1, True)
    return {"virtual_counts": [0, 1, 3, 8], "real_target_count": 6,
            "response_nll": baseline, "alignment_and_batch_pooling_exact": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--model", type=Path)
    parser.add_argument("--adapter", type=Path)
    parser.add_argument("--data", type=Path)
    parser.add_argument("--split", choices=["dev", "test"], default="test")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.verify:
        result = verify()
    else:
        if args.model is None or args.data is None:
            parser.error("--model and --data are required")
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
        torch.set_num_threads(2)
        model = AutoModelForCausalLM.from_pretrained(args.model, local_files_only=True).float()
        if args.adapter is not None:
            model = PeftModel.from_pretrained(model, args.adapter)
        tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
        result = evaluate(RealLogits(model), tokenizer, load_source(args.data)[args.split])
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output)}))


if __name__ == "__main__":
    main()
