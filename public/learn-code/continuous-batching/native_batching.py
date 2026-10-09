"""Pinned Transformers 5.19 CPU request manager; offline inference only.

Install the README environment and acquire the pinned model separately.
Run: python native_batching.py --model model-cache --budget 16
"""

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import time
import traceback

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from transformers.generation import ContinuousBatchingConfig, GenerationConfig

HERE = Path(__file__).resolve().parent


def verify_files(directory):
    source = json.loads((HERE / "model-source-report.json").read_text(encoding="utf8"))
    for row in source["files"]:
        path = Path(directory) / row["name"]
        if path.stat().st_size != row["bytes"]:
            raise ValueError(f"Wrong size: {row['name']}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != row["sha256"]:
            raise ValueError(f"Wrong pinned bytes: {row['name']}")
    return source


def load_model(directory):
    verify_files(directory)
    tokenizer = AutoTokenizer.from_pretrained(directory, local_files_only=True)
    model = (
        AutoModelForCausalLM.from_pretrained(
            directory, local_files_only=True, dtype=torch.float32, attn_implementation="sdpa"
        )
        .cpu()
        .eval()
    )
    return model, tokenizer


def batch_config(budget):
    if budget < 1:
        raise ValueError("The query-token budget must be positive.")
    return ContinuousBatchingConfig(
        page_size=8,
        num_blocks=128,
        max_batch_tokens=budget,
        max_requests_per_batch=3,
        max_blocks_per_request=0,
        allow_block_sharing=False,
        use_async_batching=False,
        use_cuda_graph=False,
        default_compile_level=0,
        auto_switch_to_flash=False,
        safety_margin=0.0,
    )


@torch.inference_mode()
def full_greedy(model, prompt, cap):
    if not prompt or cap < 1:
        raise ValueError("Use a nonempty prompt and positive output cap.")
    ids = torch.tensor([prompt], dtype=torch.long)
    generated = []
    for _ in range(cap):
        logits = model(ids, use_cache=False, logits_to_keep=1).logits
        token = int(logits[0, -1].argmax())
        generated.append(token)
        ids = torch.cat((ids, torch.tensor([[token]])), dim=1)
    return generated


def run_requests(model, requests, budget, cap=6, timeout=120):
    """Queue all explicit IDs before start; drain finite outputs; always clean up.

    Cancellation is intentionally absent from this finite campaign: 5.19 does
    not deliver a terminal output for a canceled pending request. The separate
    lifecycle preflight explains that contract. A missing result here is a
    timeout/error, not a successful empty response.
    """
    if not requests or len({row["id"] for row in requests}) != len(requests):
        raise ValueError("Supply nonempty requests with unique identities.")
    if any(not row["prompt"] for row in requests) or cap < 1:
        raise ValueError("Every request needs a prompt and positive output cap.")
    config = batch_config(budget)
    generation = GenerationConfig(
        max_new_tokens=cap, do_sample=False, eos_token_id=-1, pad_token_id=0
    )
    started = time.perf_counter()
    manager = model.init_continuous_batching(
        generation_config=generation, continuous_batching_config=config
    )
    outputs = {}
    report = {
        "budget": budget,
        "requested_config": asdict(config),
        "origin": started,
        "warmup": False,
        "outputs": outputs,
    }
    try:
        # Explicitly do not call manager.warmup(). Work starts after submission.
        for row in requests:
            returned = manager.add_request(
                row["prompt"], request_id=row["id"], max_new_tokens=cap, record_timestamps=True
            )
            if returned != row["id"]:
                raise RuntimeError(f"Request was not accepted: {row['id']}")
        manager.start()
        deadline = time.perf_counter() + timeout
        while len(outputs) < len(requests):
            if time.perf_counter() >= deadline:
                raise TimeoutError(f"Only received {len(outputs)}/{len(requests)} results.")
            result = manager.get_result(timeout=0.2)
            if result is None:
                fatal = manager.background_thread_status.fatal_error
                if fatal is not None:
                    raise RuntimeError(f"Manager failed: {fatal}")
                continue
            if result.request_id in outputs:
                raise RuntimeError("Duplicate terminal response.")
            row = asdict(result)
            row["status_name"] = result.status.name
            row["created_relative"] = row["created_time"] - started
            row["lifespan_relative"] = [
                t - started if t >= 0 else None for t in row["lifespan"]
            ]
            row["timestamps_relative"] = (
                None if row["timestamps"] is None else [t - started for t in row["timestamps"]]
            )
            outputs[result.request_id] = row
        report["resolved_config"] = asdict(manager.continuous_batching_config)
        report["warmup"] = manager.warmed_up
    except Exception:
        report["failure"] = traceback.format_exc()
    finally:
        manager.stop(
            block=True,
            timeout=10,
            keep_for_next_session=False,
            hard_stop=len(outputs) != len(requests),
        )
        if manager.is_running():
            # Preserve the failure rather than label live resources cleaned up.
            raise RuntimeError("Manager thread did not stop within the deadline.")
        manager.destroy()
        report["manager_elapsed_seconds"] = time.perf_counter() - started
        report["thread_stopped"] = not manager.is_running()
        report["processor_cleared"] = manager.batch_processor is None
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--budget", type=int, default=16)
    args = parser.parse_args()
    torch.set_num_threads(1)
    model, tokenizer = load_model(args.model)
    ids = tokenizer(
        (HERE / "alice-train.txt").read_text(encoding="utf8"), add_special_tokens=False
    ).input_ids
    requests = [{"id": f"alice-{length}", "prompt": ids[:length]} for length in [8, 12, 20]]
    print(json.dumps(run_requests(model, requests, args.budget), indent=2))
