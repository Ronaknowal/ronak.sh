"""Ordinary Transformers 5.19 cache use on the pinned local Pythia checkpoint.

Run: python native_cache.py --model model-cache
Install the versions in README first. Acquisition is a separate explicit command.
This program performs inference only and never downloads missing files.
"""
import argparse
import hashlib
import json
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, DynamicCache, StaticCache

HERE = Path(__file__).resolve().parent


def verify_model_files(directory):
    report = json.loads((HERE / "model-source-report.json").read_text(encoding="utf-8"))
    for item in report["files"]:
        path = Path(directory) / item["name"]
        if path.stat().st_size != item["bytes"] or hashlib.sha256(path.read_bytes()).hexdigest() != item["sha256"]:
            raise ValueError(f"Pinned model identity mismatch: {item['name']}")
    return report


def load_model(directory):
    verify_model_files(directory)
    tokenizer = AutoTokenizer.from_pretrained(directory, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        directory, local_files_only=True, dtype=torch.float32, attn_implementation="eager"
    ).cpu().eval()
    return model, tokenizer


def make_cache(model, kind, capacity):
    if kind == "full":
        return None
    if kind == "dynamic":
        return DynamicCache(config=model.config)
    if kind == "static":
        return StaticCache(config=model.config, max_cache_len=capacity)
    raise ValueError("kind must be full, dynamic or static")


@torch.inference_mode()
def forward(model, ids, begin=0, cache=None, attention_mask=None, position_ids=None, last_only=True):
    """ids contains only new rows for a cache, or the whole prefix without one."""
    end = begin + ids.shape[1]
    if attention_mask is None:
        attention_mask = torch.ones(ids.shape[0], end, dtype=torch.long, device=ids.device)
    if position_ids is None:
        position_ids = torch.arange(begin, end, device=ids.device)[None, :]
    return model(
        ids, attention_mask=attention_mask, position_ids=position_ids,
        past_key_values=cache, use_cache=cache is not None,
        logits_to_keep=1 if last_only else 0,
    ).logits


def cache_payload(cache):
    """Tensor payload only: excludes Python objects, allocator/RSS and model weights."""
    if cache is None:
        return {"occupied_bytes": 0, "backing_bytes": 0, "layers": []}
    layers = []
    length = int(cache.get_seq_length())
    for layer in cache.layers:
        k, v = layer.keys, layer.values
        backing = k.numel() * k.element_size() + v.numel() * v.element_size()
        occupied = (k[:, :, :length].numel() * k.element_size()
                    + v[:, :, :length].numel() * v.element_size())
        layers.append({"keys": list(k.shape), "values": list(v.shape),
                       "occupied_bytes": occupied, "backing_bytes": backing})
    return {"length": length, "occupied_bytes": sum(x["occupied_bytes"] for x in layers),
            "backing_bytes": sum(x["backing_bytes"] for x in layers), "layers": layers}


def compare_logits(actual, reference, atol=2e-4, rtol=2e-4):
    """Keep a failed numerical tolerance visible instead of redefining success."""
    error = (actual-reference).abs()
    close = torch.isclose(actual, reference, atol=atol, rtol=rtol)
    return {"max_absolute_error": float(error.max()),
            "max_relative_error": float((error/reference.abs().clamp(min=1e-12)).max()),
            "compared_elements": actual.numel(), "mismatched_elements": int((~close).sum()),
            "tolerance_passed": bool(close.all()),
            "top1_matches": bool(torch.equal(actual.argmax(-1), reference.argmax(-1))),
            "atol": atol, "rtol": rtol}


@torch.inference_mode()
def verify_native(model, ids, atol=2e-4, rtol=2e-4):
    """Finite chunk, reset, static-tail and left-padding contracts; no timing here."""
    ids = ids[:, :12]
    full = forward(model, ids, last_only=False)
    records = []
    for kind in ("dynamic", "static"):
        cache = make_cache(model, kind, 16)
        pieces, begin = [], 0
        for end in (4, 7, 12):
            pieces.append(forward(model, ids[:, begin:end], begin, cache, last_only=False))
            assert int(cache.get_seq_length()) == end
            if kind == "static" and end == 7:
                for layer in cache.layers:
                    layer.keys[:, :, end:] = 123
                    layer.values[:, :, end:] = -77
            begin = end
        joined = torch.cat(pieces, dim=1)
        comparison = compare_logits(joined, full, atol, rtol)
        payload = cache_payload(cache)
        cache.reset()
        assert int(cache.get_seq_length()) == 0
        repeated = forward(model, ids[:, :4], cache=cache, last_only=False)
        records.append({"kind": kind, "chunks": [4, 3, 5],
                        "comparison": comparison, "payload": payload,
                        "reset_comparison": compare_logits(repeated, full[:, :4], atol, rtol)})

    # Two left-pad rows occupy slots but are invalid keys. Explicit real-token
    # positions restart at zero; compare only non-padding outputs.
    padded = torch.cat([torch.zeros(1, 2, dtype=torch.long), ids], dim=1)
    mask = torch.cat([torch.zeros(1, 2, dtype=torch.long), torch.ones_like(ids)], dim=1)
    positions = (mask.cumsum(-1) - 1).clamp(min=0)
    padding_records = []
    for kind in ("dynamic", "static"):
        cache = make_cache(model, kind, 16)
        prefix = forward(model, padded[:, :8], cache=cache, attention_mask=mask[:, :8],
                         position_ids=positions[:, :8], last_only=False)
        suffix = forward(model, padded[:, 8:], 8, cache, attention_mask=mask,
                         position_ids=positions[:, 8:], last_only=False)
        real = torch.cat([prefix, suffix], dim=1)[:, 2:]
        padding_records.append({"kind": kind, "comparison": compare_logits(real, full, atol, rtol),
                                "physical_length": int(cache.get_seq_length()), "real_tokens": 12})
    return {"chunk_cases": records, "left_padding_cases": padding_records,
            "static_unused_slots_poisoned": True, "reset_length_zero": True, "atol": atol, "rtol": rtol}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    args = parser.parse_args()
    torch.set_num_threads(2)
    model, tokenizer = load_model(args.model)
    text = (HERE / "alice-train.txt").read_text(encoding="utf-8")
    ids = tokenizer(text, add_special_tokens=False, return_tensors="pt").input_ids[:, :12]
    print(json.dumps({"ids": ids.tolist(), "results": verify_native(model, ids)}, indent=2))
