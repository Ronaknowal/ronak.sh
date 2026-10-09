"""Snapshot and fork real occupied TinyLM K/V, without training or generation.

Run through prefix_study.py --stage tiny --output results --model model-cache.
Only the unchanged prerequisite classes are imported; their main routines do
not run. Copies buy branch isolation, not zero-copy physical page sharing.
"""

import torch

from cached_decoder import CachedDecoder
from tiny_causal_lm import TinyLM
from observations import parameter_digest


def snapshot(decoder):
    return {
        "length": decoder.length,
        "capacity": decoder.capacity,
        "layers": [
            (k[:, :, : decoder.length].clone(), v[:, :, : decoder.length].clone())
            for k, v in decoder.layers
        ],
    }


def fork(model, saved):
    decoder = CachedDecoder(model, batch=1, capacity=saved["capacity"])
    for (keys, values), (saved_keys, saved_values) in zip(decoder.layers, saved["layers"]):
        keys[:, :, : saved["length"]].copy_(saved_keys)
        values[:, :, : saved["length"]].copy_(saved_values)
    decoder.length = saved["length"]
    return decoder


def equal_prefix(decoder, saved):
    return decoder.length == saved["length"] and all(
        torch.equal(current[:, :, : saved["length"]], old)
        for pair, old_pair in zip(decoder.layers, saved["layers"])
        for current, old in zip(pair, old_pair)
    )


@torch.inference_mode()
def run(protocol, recorder):
    config = protocol["tiny"]
    torch.set_num_threads(protocol["threads"])
    torch.manual_seed(config["seed"])
    model = (
        TinyLM(
            config["vocabulary"],
            context=config["context"],
            width=config["width"],
            heads=config["heads"],
            layers=config["layers"],
        )
        .double()
        .eval()
    )
    before_weights = parameter_digest(model)
    calls = 0
    full = {}
    ids = {
        name: torch.tensor([values], dtype=torch.long) for name, values in config["prompts"].items()
    }
    for name, prompt in ids.items():
        full[name] = model(prompt)
        calls += 1
        recorder.emit(
            f"full-{name}", {"call": calls, "ids": prompt.tolist()}, {"logits": full[name]}
        )
    base = CachedDecoder(model, capacity=config["context"])
    prefix_length = config["prefix_length"]
    prefix_logits = base(ids["A"][:, :prefix_length])
    calls += 1
    saved = snapshot(base)
    recorder.emit(
        "prefix-A",
        {"call": calls, "length": base.length, "occupied_bytes": base.occupied_payload_bytes},
        {"logits": prefix_logits, "snapshot": saved},
    )
    rows = []
    for name in ("A", "B"):
        branch = fork(model, saved)
        actual = branch(ids[name][:, prefix_length:])
        calls += 1
        reference = full[name][:, prefix_length:]
        comparison = {
            "prompt": name,
            "call": calls,
            "max_absolute_error": float((actual - reference).abs().max()),
            "top1_equal": bool(torch.equal(actual.argmax(-1), reference.argmax(-1))),
            "base_unchanged": equal_prefix(base, saved),
            "branch_length": branch.length,
            "copied_prefix_bytes": base.occupied_payload_bytes,
            "branch_reserved_bytes": branch.reserved_payload_bytes,
        }
        recorder.emit(
            f"branch-{name}",
            comparison,
            {
                "actual_logits": actual,
                "reference_logits": reference,
                "branch": snapshot(branch),
                "base": snapshot(base),
            },
        )
        rows.append(comparison)
        torch.testing.assert_close(actual, reference, atol=config["atol"], rtol=config["rtol"])
        assert comparison["top1_equal"] and comparison["base_unchanged"]
    # C edits an upstream token. Refill its prefix; the A snapshot is invalid.
    changed = CachedDecoder(model, capacity=config["context"])
    changed_prefix = changed(ids["C"][:, :prefix_length])
    calls += 1
    recorder.emit(
        "prefix-C",
        {"call": calls, "ids": ids["C"][:, :prefix_length].tolist()},
        {"logits": changed_prefix, "cache": snapshot(changed)},
    )
    changed_tail = changed(ids["C"][:, prefix_length:])
    calls += 1
    c_reference = full["C"][:, prefix_length:]
    causal_equal = torch.equal(full["A"][:, :3], full["C"][:, :3])
    current_weights = parameter_digest(model)
    summary = {
        "calls": calls,
        "cases": rows,
        "changed_prefix_max_error": float((changed_tail - c_reference).abs().max()),
        "before_edit_rows_exact": causal_equal,
        "shared_prefix_full_logits_exact": bool(torch.equal(full["A"][:, :8], full["B"][:, :8])),
        "weight_hash_before": before_weights,
        "weight_hash_after": current_weights,
        "dtype": str(next(model.parameters()).dtype),
        "training": model.training,
    }
    recorder.emit(
        "changed-tail", summary, {"actual_logits": changed_tail, "reference_logits": c_reference}
    )
    torch.testing.assert_close(changed_tail, c_reference, atol=config["atol"], rtol=config["rtol"])
    assert calls == config["forward_calls"] == 8
    assert causal_equal and summary["shared_prefix_full_logits_exact"]
    assert current_weights == before_weights
    return summary
