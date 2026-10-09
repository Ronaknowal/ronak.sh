"""Five actual PEFT routes: update, frozen base, cache and materialized reload.

Run: python soft_peft.py --model ./pythia-14m --data ./poems --output ./native-check
Use the pinned versions and acquisition instructions in README.md. Each route
gets a fresh base and one declared diagnostic update, not a quality experiment.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

import torch
import peft
import transformers
from peft import (PeftModel, PrefixTuningConfig, PromptEncoderConfig,
                  PromptTuningConfig, get_peft_model)
from transformers import AutoModelForCausalLM, AutoTokenizer

from sft_data import collate, encode_record, load_source


METHODS = ("input", "encoder-mlp", "encoder-lstm", "prefix-direct", "prefix-projected")


def configuration(method, virtual=8):
    common = {"task_type": "CAUSAL_LM", "num_virtual_tokens": virtual}
    if method == "input":
        return PromptTuningConfig(**common)
    if method in {"encoder-mlp", "encoder-lstm"}:
        kind = "MLP" if method == "encoder-mlp" else "LSTM"
        return PromptEncoderConfig(**common, encoder_reparameterization_type=kind,
                                   encoder_hidden_size=32)
    if method in {"prefix-direct", "prefix-projected"}:
        return PrefixTuningConfig(**common, prefix_projection=method == "prefix-projected",
                                  encoder_hidden_size=32)
    raise ValueError(f"Unknown method: {method}")


def fresh_model(path, method, seed=17):
    torch.manual_seed(seed)
    base = AutoModelForCausalLM.from_pretrained(path, local_files_only=True).float()
    model = get_peft_model(base, configuration(method))
    model.eval()
    return model


def tensor_digest(named_tensors):
    digest = hashlib.sha256()
    for name, value in sorted(named_tensors):
        value = value.detach().cpu().contiguous()
        digest.update(name.encode("utf-8"))
        digest.update(str((tuple(value.shape), value.dtype)).encode("utf-8"))
        digest.update(value.view(torch.uint8).numpy().tobytes())
    return digest.hexdigest()


def frozen_digest(model):
    return tensor_digest((name, value) for name, value in model.named_parameters() if not value.requires_grad)


@torch.no_grad()
def cache_check(model, prompt_ids, eos_id, steps=3):
    """Compare ordinary native cached generation to complete fresh recomputation.

    EOS stopping is disabled for this fixed-length parity fixture. The scientific
    evaluator separately uses actual EOS stopping and explicit emitted lengths.
    """
    ids = torch.tensor([prompt_ids])
    native = model.generate(input_ids=ids, attention_mask=torch.ones_like(ids),
                            do_sample=False, max_new_tokens=steps, eos_token_id=None,
                            pad_token_id=eos_id, use_cache=True,
                            return_dict_in_generate=True, output_scores=True)
    current = ids.clone()
    errors, emitted = [], []
    for native_logits in native.scores:
        reference = model(input_ids=current, attention_mask=torch.ones_like(current),
                          use_cache=False).logits[:, -1]
        error = float((reference - native_logits).abs().max())
        # FP32 full-sequence and one-row cached GEMMs have different roundoff.
        # A separate float64 mechanism check below distinguishes that drift
        # from a misplaced prefix; generation scores may still be cast to FP32.
        tolerance = 2e-6 if next(model.parameters()).dtype == torch.float64 else 0.003
        torch.testing.assert_close(reference, native_logits.to(reference.dtype),
                                   atol=tolerance, rtol=tolerance)
        token = reference.argmax(-1, keepdim=True)
        assert torch.equal(token[:, 0], native_logits.argmax(-1))
        emitted.append(int(token[0, 0]))
        errors.append(error)
        current = torch.cat([current, token], dim=1)
    assert len(emitted) == steps
    assert native.sequences[0, -steps:].tolist() == emitted
    cache = native.past_key_values
    length = int(cache.get_seq_length())
    virtual = model.active_peft_config.num_virtual_tokens
    assert length == len(prompt_ids) + virtual + steps - 1
    shapes = [list(layer.keys.shape) for layer in cache.layers]
    return {"emitted_ids": emitted, "per_step_max_logit_errors": errors,
            "prompt_real_positions": len(prompt_ids), "virtual_positions": virtual,
            "cache_final_length": length, "layer_key_shapes": shapes,
            "expected_length": len(prompt_ids) + virtual + steps - 1,
            "eos_stopping": "disabled only for fixed-length cache parity"}


def run(model_path, data_path, output, methods=METHODS):
    output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    records = load_source(data_path)["train"][:2]
    encoded = [encode_record(row, tokenizer) for row in records]
    batch = collate(encoded)
    reports = []
    for method in methods:
        model = fresh_model(model_path, method)
        before = frozen_digest(model)
        trainable = [(name, value) for name, value in model.named_parameters() if value.requires_grad]
        optimizer = torch.optim.SGD([value for _, value in trainable], lr=0.001)
        result = model(**batch, use_cache=False)
        result.loss.backward()
        assert all(value.grad is not None and torch.isfinite(value.grad).all() for _, value in trainable)
        assert all(value.grad is None for value in model.parameters() if not value.requires_grad)
        optimizer.step()
        assert before == frozen_digest(model)
        model.eval()
        with torch.no_grad():
            logits = model(**batch, use_cache=False).logits
        cache = cache_check(model, encoded[0]["prompt_ids"], tokenizer.eos_token_id)
        precise = copy.deepcopy(model).double()
        precise_cache = cache_check(precise, encoded[0]["prompt_ids"], tokenizer.eos_token_id)
        del precise
        directory = output / method
        # Export in the same evaluation/no-grad mode as the inference reference.
        # CPU LSTM kernels can round differently when building an autograd graph.
        with torch.no_grad():
            model.save_pretrained(directory, safe_serialization=True)
        base = AutoModelForCausalLM.from_pretrained(model_path, local_files_only=True).float()
        reloaded = PeftModel.from_pretrained(base, directory).eval()
        with torch.no_grad():
            reload_logits = reloaded(**batch, use_cache=False).logits
            single = {name: value[:1] for name, value in batch.items()}
            single_original = model(**single, use_cache=False).logits
            single_reload = reloaded(**single, use_cache=False).logits
            materialized = model.get_prompt_embedding_to_save("default")
            saved_prompt = reloaded.prompt_encoder["default"].embedding.weight
        # Native export materializes one prompt. A projected prefix computed as
        # a batch of two may differ in FP32 GEMM rounding from that one-row export.
        # Establish exact stored state and matched one-record behavior separately.
        torch.testing.assert_close(saved_prompt, materialized, atol=0, rtol=0)
        torch.testing.assert_close(single_reload, single_original, atol=2e-5, rtol=2e-5)
        row = {"method": method, "trainable_count": sum(value.numel() for _, value in trainable),
               "trainable_shapes": {name: list(value.shape) for name, value in trainable},
               "diagnostic_optimizer_steps": 1, "before_loss": float(result.loss.detach()),
               "logits_shape": list(logits.shape), "frozen_base_digest": before,
               "frozen_base_exact": True, "cache": cache, "float64_cache": precise_cache,
               "reload_max_logit_error": float((reload_logits - logits).abs().max()),
               "single_record_reload_max_error": float((single_reload - single_original).abs().max()),
               "saved_materialized_tensor_exact": True,
               "saved_files": {path.name: {"bytes": path.stat().st_size,
                   "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
                   for path in sorted(directory.iterdir()) if path.is_file()},
               "materialization_limit": "Inference artifact; original encoder and optimizer resume state are not saved here."}
        reports.append(row)
        (output / f"{method}-report.json").write_text(json.dumps(row, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"method": method, "count": row["trainable_count"], "cache": cache}), flush=True)
        del model, reloaded, base, optimizer, trainable
    return {"versions": {"torch": torch.__version__, "transformers": transformers.__version__, "peft": peft.__version__},
            "kind": "native diagnostic routes; no held-out quality measurement", "methods": reports}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--methods", nargs="+", choices=METHODS, default=METHODS)
    args = parser.parse_args()
    result = run(args.model, args.data, args.output, args.methods)
    (args.output / "report.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
