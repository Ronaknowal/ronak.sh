"""Prospective three-recipe, three-seed frozen-base prompt study.

Commands:
  python soft_study.py freeze --model pythia-14m --data poems --work study
  python soft_study.py train --model pythia-14m --data poems --work study
  python soft_study.py evaluate --model pythia-14m --data poems --work study
Freeze only after all mechanism and native preflights. No downloads, no tuning.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import time

import torch
import peft
import transformers
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

from soft_peft import fresh_model, frozen_digest, tensor_digest
from soft_evaluate import RealLogits
from sft_data import LABELS, TEMPLATE, MODEL_REVISION, REVISION, collate, encode_record, load_source
from sft_evaluate import evaluate, response_nll, classification_metrics


SEEDS = (17, 29, 43)
METHODS = ("input", "encoder-mlp", "prefix-direct")
MODEL_SHA = "116a02532db461f91386a5b20f942ff2c8d4de7341e21b55caafc3d7b25f49a1"
PROGRAMS = ("soft_attention.py", "soft_decoder.py", "soft_encoders.py", "soft_token_head.py",
            "soft_peft.py", "soft_evaluate.py", "soft_study.py", "sft_data.py", "sft_evaluate.py", "tiny_causal_lm.py",
            "acquire_model.py", "model-source-report.json", "README.md")


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def contract(args):
    folder = Path(__file__).resolve().parent
    return {"programs": {name: sha(folder / name) for name in PROGRAMS},
            "data": {name: sha(args.data / f"{name}.tsv") for name in ("train", "dev", "test")},
            "model": {p.name: sha(p) for p in sorted(args.model.iterdir()) if p.is_file()},
            "versions": {name: importlib.metadata.version(name) for name in
                         ("torch", "numpy", "transformers", "peft", "tokenizers", "accelerate", "safetensors")}}


def batch_plan(seed, examples=843, steps=200, size=8):
    random = torch.Generator().manual_seed(seed)
    plan = []
    while len(plan) < steps:
        order = torch.randperm(examples, generator=random).tolist()
        plan.extend(order[start:start + size] for start in range(0, examples, size))
    return plan[:steps]


def freeze(args):
    args.work.mkdir(parents=True, exist_ok=False)
    if sha(args.model / "model.safetensors") != MODEL_SHA:
        raise ValueError("Base weights differ from the pinned Pythia checkpoint")
    rows = load_source(args.data)
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    encoded = {split: [encode_record(row, tokenizer) for row in values] for split, values in rows.items()}
    protocol = {"frozen_at": datetime.now(timezone.utc).isoformat(), "contract": contract(args),
                "model_revision": MODEL_REVISION, "data_revision": REVISION,
                "methods": METHODS, "seeds": SEEDS, "steps": 200, "virtual": 8,
                "batch_size": 8, "short_batch": "preserved", "plans": {str(s): batch_plan(s) for s in SEEDS},
                "precision": "FP32 CPU, two threads, eval-mode dropout off, autograd on",
                "optimizer": {"name": "AdamW", "lr": 0.03, "betas": [0.9, 0.999], "eps": 1e-8,
                              "weight_decay": 0, "clip_norm": 1, "schedule": "constant"},
                "initialization": {"input": "exact copied initial MLP output for its seed",
                                   "encoder-mlp": "native PEFT seeded initializer; no output rescaling",
                                   "prefix-direct": "explicit Normal(0,0.02^2) with its seed"},
                "parameter_counts": {"input": 1024, "encoder-mlp": 10432, "prefix-direct": 12288},
                "dev_steps": [0, 50, 100, 150, 200], "selection": "lowest pooled response NLL, earliest exact tie, including zero",
                "test_gate": "all nine terminal200 runs and selections sealed first",
                "evaluation": "pooled response NLL; full-vocabulary greedy8 with EOS; three whole-candidate sums including EOS",
                "display_ids": {"negative": [5, 6], "no impact": [0, 2], "positive": [1, 10]},
                "template": TEMPLATE, "labels": LABELS, "real_max_length": 64,
                "split_counts": {split: len(values) for split, values in encoded.items()},
                "max_encoded_length": max(len(row["ids"]) for values in encoded.values() for row in values),
                "failure": "retain and stop; exact checkpoint resume only, no outcome-driven recipe change",
                "scope": "three recipes; unequal trainable counts, initialization and architectural access"}
    write(args.work / "protocol.json", protocol)
    print(json.dumps({"protocol": str(args.work / "protocol.json"), "sha256": sha(args.work / "protocol.json")}), flush=True)


def checked(args):
    protocol = json.loads((args.work / "protocol.json").read_text(encoding="utf-8"))
    if contract(args) != protocol["contract"]:
        raise ValueError("Frozen program, environment, model or data changed")
    return protocol


def adapter_state(model):
    return {name: value.detach().clone() for name, value in model.named_parameters() if value.requires_grad}


def restore_adapter(model, saved):
    current = dict(model.named_parameters())
    with torch.no_grad():
        for name, value in saved.items():
            if name not in current or not current[name].requires_grad:
                raise ValueError("Adapter resume schema changed")
            current[name].copy_(value)


def initial_pair(args, seed, batch):
    directory = args.work / f"initial-{seed}"
    directory.mkdir(exist_ok=False)
    mlp = fresh_model(args.model, "encoder-mlp", seed)
    state = adapter_state(mlp)
    with torch.no_grad():
        materialized = mlp.get_prompt(batch_size=1)[0].detach().clone()
        expected = mlp(**batch, use_cache=False).logits.detach()
    flat = fresh_model(args.model, "input", seed)
    with torch.no_grad():
        flat.prompt_encoder["default"].embedding.weight.copy_(materialized)
        actual = flat(**batch, use_cache=False).logits
    torch.testing.assert_close(actual, expected, rtol=0, atol=0)
    torch.save({"mlp": state, "flat": materialized}, directory / "initial.pt")
    write(directory / "report.json", {"seed": seed, "prompt_norm": float(materialized.norm()),
          "prompt_digest": tensor_digest([("prompt", materialized)]),
          "initial_logits_digest": tensor_digest([("logits", expected)]),
          "flat_mlp_logits_exact": True, "state_sha256": sha(directory / "initial.pt")})


def train_one(args, protocol, method, seed, encoded):
    directory = args.work / f"{method}-{seed}"
    if (directory / "complete.json").exists():
        print(f"Conserve completed {method}-{seed}", flush=True)
        return
    directory.mkdir(exist_ok=True)
    model = fresh_model(args.model, method, seed)
    initial = torch.load(args.work / f"initial-{seed}/initial.pt", weights_only=True)
    if method == "input":
        with torch.no_grad():
            model.prompt_encoder["default"].embedding.weight.copy_(initial["flat"])
    elif method == "encoder-mlp":
        restore_adapter(model, initial["mlp"])
    else:
        with torch.no_grad():
            model.prompt_encoder["default"].embedding.weight.normal_(0, 0.02, generator=torch.Generator().manual_seed(seed))
    frozen = frozen_digest(model)
    parameters = [value for value in model.parameters() if value.requires_grad]
    count = sum(value.numel() for value in parameters)
    assert count == protocol["parameter_counts"][method]
    optimizer = torch.optim.AdamW(parameters, lr=0.03, betas=(0.9, 0.999), eps=1e-8, weight_decay=0)
    wrapped = RealLogits(model)
    resume = directory / "resume.pt"
    history, curve, best_loss, best_step, targets, start = [], [], float("inf"), None, 0, 0
    if resume.exists():
        saved = torch.load(resume, weights_only=False)
        restore_adapter(model, saved["adapter"])
        optimizer.load_state_dict(saved["optimizer"])
        history, curve = saved["history"], saved["curve"]
        best_loss, best_step, targets, start = saved["best_loss"], saved["best_step"], saved["targets"], saved["step"]
        torch.set_rng_state(saved["rng"])
    else:
        initial_nll = response_nll(wrapped, encoded["dev"])
        best_loss, best_step = initial_nll["nll"], 0
        history.append({"step": 0, "dev": initial_nll})
        with torch.no_grad():
            model.save_pretrained(directory / "selected", safe_serialization=True)
        torch.save({"adapter": adapter_state(model), "optimizer": optimizer.state_dict()}, directory / "selected-training.pt")
        write(directory / "initial.json", {"method": method, "seed": seed, "trainable": count,
              "adapter_norm": sum(float(value.detach().square().sum()) for value in parameters) ** 0.5,
              "frozen_base_digest": frozen, "dev": initial_nll})
    began = time.monotonic()
    for step in range(start + 1, 201):
        chosen = protocol["plans"][str(seed)][step - 1]
        batch = collate([encoded["train"][index] for index in chosen])
        optimizer.zero_grad(set_to_none=True)
        result = model(**batch, use_cache=False)
        if not bool(torch.isfinite(result.loss)):
            write(directory / "failure.json", {"step": step, "reason": "nonfinite loss; no recipe replacement"})
            raise FloatingPointError("Nonfinite scientific loss")
        result.loss.backward()
        torch.nn.utils.clip_grad_norm_(parameters, 1.0, error_if_nonfinite=True)
        optimizer.step()
        targets += int((batch["labels"][:, 1:] != -100).sum())
        curve.append({"step": step, "loss": float(result.loss.detach()), "source_ids": [encoded["train"][i]["id"] for i in chosen],
                      "targets": int((batch["labels"][:, 1:] != -100).sum())})
        if step % 50 == 0:
            dev = response_nll(wrapped, encoded["dev"])
            history.append({"step": step, "dev": dev})
            if dev["nll"] < best_loss:
                best_loss, best_step = dev["nll"], step
                with torch.no_grad():
                    model.save_pretrained(directory / "selected", safe_serialization=True)
                torch.save({"adapter": adapter_state(model), "optimizer": optimizer.state_dict()}, directory / "selected-training.pt")
            assert frozen_digest(model) == frozen
            torch.save({"adapter": adapter_state(model), "optimizer": optimizer.state_dict(), "step": step,
                        "history": history, "curve": curve, "best_loss": best_loss, "best_step": best_step,
                        "targets": targets, "rng": torch.get_rng_state()}, resume)
            print(json.dumps({"method": method, "seed": seed, "step": step, "dev": dev["nll"], "selected": best_step}), flush=True)
    assert all(value.grad is None for value in model.parameters() if not value.requires_grad)
    assert frozen_digest(model) == frozen
    write(directory / "complete.json", {"method": method, "seed": seed, "terminal_step": 200,
          "selected_step": best_step, "selected_dev_nll": best_loss, "history": history,
          "curve": curve, "targets": targets, "trainable": count, "frozen_base_exact": True,
          "frozen_base_digest": frozen, "elapsed_this_invocation_seconds": time.monotonic() - began,
          "selected_files": {p.name: sha(p) for p in sorted((directory / "selected").iterdir()) if p.is_file()},
          "selected_training_state_sha256": sha(directory / "selected-training.pt")})


def train(args):
    protocol = checked(args)
    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    rows = load_source(args.data)
    encoded = {split: [encode_record(row, tokenizer) for row in rows[split]] for split in ("train", "dev")}
    batch = collate(encoded["train"][:2])
    for seed in SEEDS:
        if not (args.work / f"initial-{seed}/report.json").exists():
            initial_pair(args, seed, batch)
    for method in METHODS:
        for seed in SEEDS:
            checked(args)
            train_one(args, protocol, method, seed, encoded)
    selections = {f"{method}-{seed}": sha(args.work / f"{method}-{seed}/complete.json") for method in METHODS for seed in SEEDS}
    seal = args.work / "selections-sealed.json"
    if not seal.exists():
        write(seal, {"sealed_at": datetime.now(timezone.utc).isoformat(), "protocol_sha256": sha(args.work / "protocol.json"),
                     "complete_run_hashes": selections, "test_evaluations_so_far": 0})


def preflight(args):
    """Check initialization and native response alignment without an update."""
    args.work.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    source = load_source(args.data)
    encoded = [encode_record(row, tokenizer) for row in source["train"][:2]]
    batch = collate(encoded)
    checks = []
    for seed in SEEDS:
        initial_pair(args, seed, batch)
        plan = batch_plan(seed)
        assert len(plan) == 200 and len(plan[105]) == 3
        assert len(set(sum(plan[:106], []))) == 843
        assert sum(map(len, plan)) == 1595
        checks.append({"seed": seed, "initial_pair_exact": True, "examples_over_200_steps": 1595,
                       "batch_plan_sha256": hashlib.sha256(json.dumps(plan).encode()).hexdigest()})
    from torch.nn import functional as F
    alignments = []
    for method in METHODS:
        model = fresh_model(args.model, method, 17)
        before = frozen_digest(model)
        with torch.no_grad():
            native = model(**batch, use_cache=False)
            real = RealLogits(model)(batch["input_ids"], batch["attention_mask"]).logits
            manual = F.cross_entropy(real[:, :-1].reshape(-1, real.shape[-1]), batch["labels"][:, 1:].reshape(-1))
        torch.testing.assert_close(native.loss, manual, rtol=1e-6, atol=1e-6)
        assert before == frozen_digest(model)
        assert batch["input_ids"].shape[1] + 8 <= model.base_model.config.max_position_embeddings
        alignments.append({"method": method, "native_response_loss": float(native.loss),
                           "manually_aligned_loss": float(manual), "real_logits_shape": list(real.shape)})
    write(args.work / "preflight.json", {"initialization": checks, "native_alignment": alignments,
                                        "optimizer_steps": 0, "scientific_evaluation": False})
    print(json.dumps({"preflight": str(args.work / "preflight.json"), "passed": True}))


def test(args):
    checked(args)
    torch.set_num_threads(2)
    seal = json.loads((args.work / "selections-sealed.json").read_text(encoding="utf-8"))
    for name, digest in seal["complete_run_hashes"].items():
        if sha(args.work / name / "complete.json") != digest:
            raise ValueError("A sealed selection changed")
    output = args.work / "evaluation.json"
    if output.exists():
        raise FileExistsError("Terminal evaluation is already complete; conserve it")
    rows = load_source(args.data)
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    results = {}
    for name in ["base"] + [f"{method}-{seed}" for method in METHODS for seed in SEEDS]:
        path = args.work / f"test-{name}.json"
        if path.exists():
            results[name] = json.loads(path.read_text(encoding="utf-8"))
            continue
        base = AutoModelForCausalLM.from_pretrained(args.model, local_files_only=True).float()
        model = base if name == "base" else PeftModel.from_pretrained(base, args.work / name / "selected")
        result = evaluate(RealLogits(model).eval(), tokenizer, rows["test"])
        write(path, result)
        results[name] = result
        print(json.dumps({"tested": name, "nll": result["response"]["nll"],
                          "free_accuracy": result["generation"]["accuracy"],
                          "candidate_accuracy": result["constrained"]["accuracy"]}), flush=True)
        del model, base
    majority = Counter(row["label"] for row in rows["train"]).most_common(1)[0][0]
    majority_rows = [{"gold": row["label"], "prediction": majority} for row in rows["test"]]
    write(output, {"protocol_sha256": sha(args.work / "protocol.json"), "seal_sha256": sha(args.work / "selections-sealed.json"),
                   "results": results, "majority": classification_metrics(majority_rows)})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["preflight", "freeze", "train", "evaluate"])
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--work", type=Path, required=True)
    args = parser.parse_args()
    {"preflight": preflight, "freeze": freeze, "train": train, "evaluate": test}[args.operation](args)


if __name__ == "__main__":
    main()
