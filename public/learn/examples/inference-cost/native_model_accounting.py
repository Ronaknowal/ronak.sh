"""Twelve fixed CPU forwards; inspect actual tensor storage and Linear work."""
import argparse
import hashlib
import json
from math import prod
from pathlib import Path
import traceback


def file_hash(path):
    with Path(path).open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256")
    return digest.hexdigest()


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def storage_rows(named_tensors):
    """Record logical elements separately from deduplicated backing storage."""
    seen = set()
    rows = []
    for name, tensor in named_tensors:
        storage = tensor.untyped_storage()
        identity = (str(tensor.device), storage.data_ptr(), storage.nbytes())
        unique = identity not in seen
        seen.add(identity)
        rows.append({"name": name, "shape": list(tensor.shape), "dtype": str(tensor.dtype),
                     "elements": tensor.numel(), "element_bytes": tensor.element_size(),
                     "logical_bytes": tensor.numel() * tensor.element_size(),
                     "backing_bytes": storage.nbytes(), "first_storage_occurrence": unique})
    return {"tensors": rows,
            "logical_bytes": sum(row["logical_bytes"] for row in rows),
            "unique_storage_bytes": sum(row["backing_bytes"] for row in rows if row["first_storage_occurrence"])}


def cache_rows(cache):
    tensors = []
    for index, layer in enumerate(cache.layers):
        tensors.extend(((f"layer{index}.K", layer.keys), (f"layer{index}.V", layer.values)))
    return storage_rows(tensors)


def parameter_digest(model):
    digest = hashlib.sha256()
    for name, tensor in model.named_parameters():
        digest.update(name.encode("utf-8"))
        digest.update(str(tuple(tensor.shape)).encode("ascii"))
        digest.update(tensor.detach().contiguous().numpy().tobytes())
    return digest.hexdigest()


def run(model_path, prompt_path, output):
    """Fresh output directory prevents an accidental replay over prior observations."""
    if output.exists():
        raise FileExistsError(output)
    prompts = json.loads(prompt_path.read_text(encoding="utf-8"))
    for name, expected in prompts["model_files"].items():
        if file_hash(model_path / name) != expected:
            raise ValueError(f"Checkpoint identity mismatch: {name}")
    if len(prompts["requests"]) != 4 or any(not 1 <= len(row["input_ids"]) <= 16 for row in prompts["requests"]):
        raise ValueError("The frozen contract is four nonempty prompts, at most 16 IDs")
    output.mkdir(parents=True)
    stage = "imports"
    calls = []
    try:
        import torch
        import transformers
        from transformers import AutoModelForCausalLM, AutoTokenizer
        torch.set_num_threads(2)
        torch.manual_seed(37)
        tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        stage = "load"
        model = AutoModelForCausalLM.from_pretrained(
            model_path, local_files_only=True, dtype=torch.float32, attn_implementation="eager")
        model.eval()
        footprint = storage_rows([*model.named_parameters(remove_duplicate=False),
                                  *model.named_buffers(remove_duplicate=False)])
        parameters = storage_rows(model.named_parameters(remove_duplicate=False))
        weights_before = parameter_digest(model)
        report = {"model": prompts["model"], "revision": prompts["revision"],
                  "versions": {"torch": torch.__version__, "transformers": transformers.__version__},
                  "config": model.config.to_dict(), "dtype": "torch.float32", "threads": 2,
                  "parameters": parameters, "resident_tensors": footprint,
                  "weights_before": weights_before, "requests": []}
        write_json(output / "loaded.json", report)
        linear_operations = []

        def hook(name):
            def record(module, inputs, result):
                positions = prod(inputs[0].shape[:-1])
                linear_operations.append({"name": name, "input_shape": list(inputs[0].shape),
                                          "output_shape": list(result.shape),
                                          "nominal_flops": 2 * positions * module.in_features * module.out_features})
            return record

        handles = [module.register_forward_hook(hook(name)) for name, module in model.named_modules()
                   if isinstance(module, torch.nn.Linear)]
        try:
            with torch.no_grad():
                for request_index, prompt in enumerate(prompts["requests"]):
                    ids = torch.tensor([prompt["input_ids"]], dtype=torch.long)
                    cache = None
                    emitted = []
                    stages = []
                    for step in range(3):
                        stage = f"request-{request_index}-forward-{step}"
                        query = ids if step == 0 else torch.tensor([[emitted[step - 1]]], dtype=torch.long)
                        total_positions = ids.shape[1] + step
                        mask = torch.ones((1, total_positions), dtype=torch.long)
                        linear_operations.clear()
                        result = model(input_ids=query, attention_mask=mask, past_key_values=cache,
                                       use_cache=True, logits_to_keep=0, return_dict=True)
                        cache = result.past_key_values
                        selected = int(result.logits[0, -1].argmax()) if step < 2 else None
                        if selected is not None:
                            emitted.append(selected)
                        cache_info = cache_rows(cache)
                        row = {"request_id": prompt["request_id"], "step": step,
                               "query_ids": query[0].tolist(), "query_positions": query.shape[1],
                               "cache_positions": cache.get_seq_length(), "selected_output_id": selected,
                               "cache": cache_info, "logits": storage_rows([("logits", result.logits)]),
                               "linear_operations": list(linear_operations),
                               "partial_linear_flops": sum(item["nominal_flops"] for item in linear_operations),
                               "sample_first_K": cache.layers[0].keys[0, 0, 0, :8].tolist(),
                               "sample_first_V": cache.layers[0].values[0, 0, 0, :8].tolist()}
                        calls.append(row)
                        stages.append(row)
                        # Save the actual forward before validating its interpretation.
                        write_json(output / f"request-{request_index}-step-{step}.json", row)
                        write_json(output / "progress.json", {"stage": stage, "completed_forwards": len(calls)})
                        predicted_bytes = (2 * model.config.num_hidden_layers * model.config.num_attention_heads
                                           * total_positions * model.config.hidden_size // model.config.num_attention_heads * 4)
                        assert cache_info["logical_bytes"] == predicted_bytes
                        assert cache.get_seq_length() == total_positions
                    report["requests"].append({**prompt, "emitted_ids": emitted,
                                               "emitted_text": tokenizer.decode(emitted), "steps": stages})
                    write_json(output / "report.json", report)
            report.update(completed_forwards=len(calls), emitted_tokens=sum(len(row["emitted_ids"]) for row in report["requests"]),
                          weights_after=parameter_digest(model), status="completed")
            write_json(output / "report.json", report)
            assert report["completed_forwards"] == 12 and report["emitted_tokens"] == 8
            assert report["weights_before"] == report["weights_after"]
            print(json.dumps({"status": report["status"], "forwards": len(calls),
                              "emitted_tokens": report["emitted_tokens"],
                              "resident_tensor_bytes": footprint["unique_storage_bytes"]}))
        finally:
            for handle in handles:
                handle.remove()
    except BaseException as error:
        write_json(output / "failure.json", {"stage": stage, "completed_forwards": len(calls),
                                               "type": type(error).__name__, "error": str(error),
                                               "traceback": traceback.format_exc()})
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--prompts", type=Path, default=Path(__file__).with_name("native-prompts.json"))
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    run(args.model, args.prompts, args.output)


if __name__ == "__main__":
    main()
