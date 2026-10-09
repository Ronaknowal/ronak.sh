"""One source-bound CPU cache comparison: prepare first, then run once.

python cache_study.py prepare --model model-cache --record protocol.json
python cache_study.py run --model model-cache --record protocol.json --output results.json

Preparing verifies files and tokenizes; it executes no model forward. Running
refuses an existing output or changed protocol inputs. All timing observations,
including slow cached cases, are retained. No fitting or quality evaluation.
"""
import argparse
import hashlib
import json
import platform
import statistics
import time
from pathlib import Path
import torch
import transformers
from transformers import AutoTokenizer
from native_cache import (HERE, verify_model_files, load_model, make_cache,
                          forward, cache_payload, verify_native, compare_logits)

ARMS = ("full", "dynamic", "static")


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_new(path, record):
    with Path(path).open("x", encoding="utf-8") as stream:
        json.dump(record, stream, indent=2, allow_nan=False)
        stream.write("\n")


def prepare(model_directory, record_path):
    source = verify_model_files(model_directory)
    tokenizer = AutoTokenizer.from_pretrained(model_directory, local_files_only=True)
    text = (HERE / "alice-train.txt").read_text(encoding="utf-8")
    ids = tokenizer(text, add_special_tokens=False).input_ids[:104]
    if len(ids) != 104:
        raise ValueError("Expected at least 104 workload tokens")
    files = ["cache_study.py", "native_cache.py", "alice-train.txt",
             "alice-provenance.json", "model-source-report.json"]
    record = {
        "purpose": "CPU inference correctness/work/storage, not model quality or GPU performance",
        "model": source["model"], "revision": source["revision"], "model_files": source["files"],
        "inputs": [{"name": name, "sha256": digest(HERE / name)} for name in files],
        "token_ids": ids, "tokens": tokenizer.convert_ids_to_tokens(ids),
        "prompt_lengths": [8, 32, 96], "output_steps": 8, "arms": list(ARMS),
        "repeats": 5, "warmups": 1, "order": "prompt ascending; cyclic arm rotation per repeat",
        "threads": 2, "dtype": "float32", "attention": "eager", "device": "cpu",
        "logits_to_keep": 1, "atol": 2e-4, "rtol": 2e-4,
        "timing": "cache construction + prefill + seven teacher-forced steps; no disk/tokenization/printing",
        "greedy": "exactly eight selected IDs; EOS does not stop the diagnostic",
        "numerical_reporting": "Tolerance unchanged; record every pass/fail count. The retained first FP32 attempt failed before timing; same-weight FP64 diagnosis is separate.",
        "versions": {"python": platform.python_version(), "torch": torch.__version__,
                     "transformers": transformers.__version__},
    }
    save_new(record_path, record)
    return record


@torch.inference_mode()
def replay(model, ids, prompt_length, kind, greedy=False):
    """Return eight last-row logits after processing P, P+1, ..., P+7 IDs."""
    cache = make_cache(model, kind, prompt_length + 8)
    history = ids[:, :prompt_length].clone()
    records, selected = [], []
    for step in range(8):
        if kind == "full":
            logits = forward(model, history)
        else:
            chunk = history if step == 0 else history[:, -1:]
            begin = 0 if step == 0 else history.shape[1] - 1
            logits = forward(model, chunk, begin, cache)
        records.append(logits)
        next_id = logits[:, -1].argmax(-1, keepdim=True)
        selected.append(int(next_id.item()))
        if step < 7:
            fed = next_id if greedy else ids[:, prompt_length + step:prompt_length + step + 1]
            history = torch.cat([history, fed], dim=1)
    return torch.cat(records, dim=1), selected, cache_payload(cache)


@torch.inference_mode()
def time_replay(model, ids, prompt_length, kind):
    # No tensor-to-Python statistics inside the timed boundary. CPU forward is
    # synchronous; GPU experiments would require a different timer boundary.
    start = time.perf_counter_ns()
    cache = make_cache(model, kind, prompt_length + 8)
    constructed = time.perf_counter_ns()
    forward(model, ids[:, :prompt_length], cache=cache)
    prefilled = time.perf_counter_ns()
    steps = []
    previous = prefilled
    for step in range(7):
        end = prompt_length + step + 1
        if kind == "full":
            forward(model, ids[:, :end])
        else:
            forward(model, ids[:, end-1:end], end-1, cache)
        current = time.perf_counter_ns()
        steps.append(current-previous)
        previous = current
    return {"end_to_end_ns": previous-start, "construction_ns": constructed-start,
            "prefill_ns": prefilled-constructed, "decode_ns": steps}


def run(model_directory, record_path, output_path):
    if Path(output_path).exists():
        raise FileExistsError("Keep the existing result; choose a new path for a separate study")
    protocol = json.loads(Path(record_path).read_text(encoding="utf-8"))
    for item in protocol["inputs"]:
        if digest(HERE / item["name"]) != item["sha256"]:
            raise ValueError(f"Protocol input changed: {item['name']}")
    actual_versions = {"python": platform.python_version(), "torch": torch.__version__,
                       "transformers": transformers.__version__}
    if actual_versions != protocol["versions"]:
        raise ValueError("Protocol runtime versions changed")
    torch.set_num_threads(protocol["threads"])
    model, tokenizer = load_model(model_directory)
    ids = torch.tensor([protocol["token_ids"]], dtype=torch.long)
    result = {"protocol_sha256": digest(record_path), "protocol": protocol,
              "cpu": platform.processor(), "parameter_bytes": sum(p.numel()*p.element_size() for p in model.parameters()),
              "native_contracts": verify_native(model, ids), "cases": [], "timings": []}
    atol, rtol = protocol["atol"], protocol["rtol"]
    for length in protocol["prompt_lengths"]:
        reference, reference_ids, _ = replay(model, ids, length, "full")
        greedy_reference, greedy_ids, _ = replay(model, ids, length, "full", greedy=True)
        for arm in ARMS:
            values, top_ids, payload = (reference, reference_ids, cache_payload(None)) if arm == "full" else replay(model, ids, length, arm)
            comparison = compare_logits(values, reference, atol, rtol)
            generated, generated_ids, _ = (greedy_reference, greedy_ids, None) if arm == "full" else replay(model, ids, length, arm, greedy=True)
            top_two = generated.topk(2, dim=-1).values
            # Save disagreements rather than silently treating a floating tie
            # as a matching generation. Logit tolerance is a separate contract.
            result["cases"].append({"prompt_length": length, "arm": arm,
                "maximum_absolute_error": float((values-reference).abs().max()),
                "maximum_relative_error": float(((values-reference).abs()/reference.abs().clamp(min=1e-12)).max()),
                "numerical_comparison": comparison,
                "teacher_forced_top1": top_ids, "top1_matches_full": top_ids == reference_ids,
                "greedy_ids": generated_ids, "greedy_matches_full": generated_ids == greedy_ids,
                "greedy_text": tokenizer.decode(generated_ids),
                "greedy_top2_margins": (top_two[..., 0]-top_two[..., 1]).ravel().tolist(), "payload": payload})
        for arm in ARMS:
            time_replay(model, ids, length, arm)
        for repeat in range(protocol["repeats"]):
            order = ARMS[repeat % 3:] + ARMS[:repeat % 3]
            for arm in order:
                observation = time_replay(model, ids, length, arm)
                result["timings"].append({"prompt_length": length, "arm": arm, "repeat": repeat,
                                           "order": list(order), **observation})
    result["summary"] = []
    for length in protocol["prompt_lengths"]:
        full_median = statistics.median(x["end_to_end_ns"] for x in result["timings"] if x["prompt_length"] == length and x["arm"] == "full")
        for arm in ARMS:
            rows = [x["end_to_end_ns"] for x in result["timings"] if x["prompt_length"] == length and x["arm"] == arm]
            median = statistics.median(rows)
            result["summary"].append({"prompt_length": length, "arm": arm, "median_ms": median/1e6,
                "min_ms": min(rows)/1e6, "max_ms": max(rows)/1e6, "full_over_arm_median": full_median/median})
    save_new(output_path, result)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "run"])
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--record", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.action == "prepare":
        record = prepare(args.model, args.record)
        print(json.dumps({"prepared": str(args.record), "sha256": digest(args.record), "tokens": len(record["token_ids"])}))
    else:
        if args.output is None:
            parser.error("run requires --output")
        result = run(args.model, args.record, args.output)
        print(json.dumps(result["summary"], indent=2))
