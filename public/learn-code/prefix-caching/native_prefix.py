"""Ten direct Pythia forward calls using copied DynamicCache prefixes.

No generate(), training, timing, warmup or remote model acquisition. The cache
stores K/V, not logits; the copied prefixes are computational reuse without
physical storage sharing. See prefix_study.py for the once-only stage driver.
"""

import copy
import torch
import transformers
from transformers import DynamicCache

from native_cache import load_model, forward, cache_payload, compare_logits
from observations import parameter_digest


def tensors(cache):
    return [(layer.keys.clone(), layer.values.clone()) for layer in cache.layers]


def unchanged(cache, saved, length):
    return int(cache.get_seq_length()) == length and all(
        torch.equal(current, old)
        for layer, pair in zip(cache.layers, saved)
        for current, old in zip((layer.keys, layer.values), pair)
    )


@torch.inference_mode()
def run(protocol, model_path, recorder):
    config = protocol["native"]
    torch.set_num_threads(protocol["threads"])
    model, tokenizer = load_model(model_path)
    model = model.double().eval()
    weights_before = parameter_digest(model)
    calls, rows = 0, []
    for prefix_ids in config["prefixes"]:
        prefix = torch.tensor([prefix_ids], dtype=torch.long)
        length = prefix.shape[1]
        cache = DynamicCache(config=model.config)
        prefix_logits = forward(model, prefix, cache=cache, last_only=False)
        calls += 1
        saved = tensors(cache)
        payload = cache_payload(cache)
        recorder.emit(
            f"prefix-{length}",
            {"call": calls, "ids": prefix_ids, "cache": payload},
            {"logits": prefix_logits, "cache": saved},
        )
        for tail_index, tail_ids in enumerate(config["tails"]):
            tail = torch.tensor([tail_ids], dtype=torch.long)
            complete = torch.cat((prefix, tail), dim=1)
            reference = forward(model, complete, last_only=False)[:, length:]
            calls += 1
            recorder.emit(
                f"reference-{length}-{tail_index}",
                {"call": calls, "ids": complete.tolist()},
                {"tail_logits": reference},
            )
            branch = copy.deepcopy(cache)
            independent_storage = all(
                old.data_ptr() != new.data_ptr()
                for old_layer, new_layer in zip(cache.layers, branch.layers)
                for old, new in zip(
                    (old_layer.keys, old_layer.values), (new_layer.keys, new_layer.values)
                )
            )
            actual = forward(model, tail, begin=length, cache=branch, last_only=False)
            calls += 1
            comparison = compare_logits(actual, reference, config["atol"], config["rtol"])
            row = {
                "prefix_length": length,
                "tail_index": tail_index,
                "call": calls,
                "prefix_ids": prefix_ids,
                "tail_ids": tail_ids,
                "comparison": comparison,
                "base_unchanged": unchanged(cache, saved, length),
                "independent_branch_storage": independent_storage,
                "copied_prefix_bytes": payload["occupied_bytes"],
                "branch": cache_payload(branch),
            }
            recorder.emit(
                f"branch-{length}-{tail_index}",
                row,
                {
                    "actual_logits": actual,
                    "reference_logits": reference,
                    "branch_cache": tensors(branch),
                    "base_cache": tensors(cache),
                },
            )
            rows.append(row)
            assert comparison["tolerance_passed"] and comparison["top1_matches"]
            assert row["base_unchanged"] and independent_storage
            assert row["branch"]["length"] == length + len(tail_ids)
    weights_after = parameter_digest(model)
    summary = {
        "calls": calls,
        "cases": rows,
        "weights_before": weights_before,
        "weights_after": weights_after,
        "torch": torch.__version__,
        "transformers": transformers.__version__,
        "dtype": str(next(model.parameters()).dtype),
        "attention": model.config._attn_implementation,
        "tokenizer_class": type(tokenizer).__name__,
        "claim": "Finite suffix-logit compatibility; no generation, speed or model-quality claim.",
    }
    recorder.emit("summary", summary)
    assert calls == config["forward_calls"] == 10 and weights_before == weights_after
    return summary
