"""Ordinary Transformers generation, inspectable native probes and fixed study.

python native_generation.py --model /path/to/pythia-14m --output study-native --stage probes
python native_generation.py --model /path/to/pythia-14m --output study-native --stage study

Requires the pinned requirements, sibling programs and data/. No parameter updates.
The probes and 84 study generations are distinct, source-bound execution stages.
"""

import argparse
import json
from pathlib import Path
import sys
import time
import numpy as np
from corpus_model import evaluation_prompts, read_data
from filters import pipeline, top_k, nucleus, min_p, typical, epsilon, eta
from history_and_stops import stop_overlap, repetition, no_repeat
from sampling import entropy, probabilities
from scratch_study import (METHODS, SEEDS, LIMIT, file_hash, input_identity,
                           open_run, save_record, read_record, begin_operation)

REVISION = "cf967c0a9a04383db6f7b1108d86b2962634b4ac"
WEIGHTS_SHA256 = "116a02532db461f91386a5b20f942ff2c8d4de7341e21b55caafc3d7b25f49a1"


def native_operator_checks(output):
    """Constructed score rows only: no tokenizer, model, fit or generation."""
    import torch
    import transformers
    from transformers.generation.logits_process import (
        TemperatureLogitsWarper, TopKLogitsWarper, TopPLogitsWarper,
        MinPLogitsWarper, TypicalLogitsWarper, EpsilonLogitsWarper,
        EtaLogitsWarper, RepetitionPenaltyLogitsProcessor, NoRepeatNGramLogitsProcessor,
    )
    rows = []
    history = [0, 1, 0]
    ids = torch.tensor([history])
    for p in [[.5, .25, .125, .0625, .0625], [.4, .3, .2, .1], [.25] * 4]:
        scores = np.log(p)
        cases = [
            ("temperature", scores / .7, TemperatureLogitsWarper(.7)),
            ("top_k", top_k(scores, 2), TopKLogitsWarper(2)),
            ("top_p", nucleus(scores, .81), TopPLogitsWarper(.81)),
            ("min_p", min_p(scores, .3), MinPLogitsWarper(.3)),
            ("typical", typical(scores, .6), TypicalLogitsWarper(.6)),
            ("epsilon", epsilon(scores, .17), EpsilonLogitsWarper(.17)),
            ("eta", eta(scores, .17), EtaLogitsWarper(.17, device="cpu")),
            ("repetition", repetition(scores, history, 1.2), RepetitionPenaltyLogitsProcessor(1.2)),
            ("no_repeat", no_repeat(scores, history, 2), NoRepeatNGramLogitsProcessor(2)),
        ]
        for name, manual, operator in cases:
            native = operator(ids, torch.tensor([scores], dtype=torch.float64))[0].numpy()
            mask_equal = np.array_equal(np.isfinite(manual), np.isfinite(native))
            error = float(np.max(np.abs(probabilities(manual) - probabilities(native))))
            if not mask_equal or error > 1e-12:
                raise AssertionError(f"Constructed operator mismatch: {name}/{p}")
            rows.append({"operator": name, "p": p, "keep": np.isfinite(native).tolist(),
                         "q": probabilities(native).tolist(), "max_probability_error": error})
    signed = np.array([2., 1., -1.])
    actual = RepetitionPenaltyLogitsProcessor(1.2)(
        torch.tensor([[0, 0, 2]]), torch.tensor([signed]))[0].numpy()
    np.testing.assert_allclose(actual, repetition(signed, [0, 0, 2], 1.2))
    report = {"status": "pass", "kind": "constructed operators; zero model calls",
              "transformers": transformers.__version__, "torch": torch.__version__,
              "source": input_identity(Path(__file__).parent / "data"),
              "rows": rows, "signed_repetition": actual.tolist()}
    save_record(output, report)
    return {"status": "pass", "cases": len(rows) + 1, "path": str(output)}


def saved_probe(output, name, operation):
    """Persist each completed probe before later comparisons can fail."""
    path = output / f"probe-{name}.json"
    if path.exists():
        return read_record(path)
    begin_operation(path)
    value = operation()
    save_record(path, value)
    return value


def configuration(method, tokenizer, limit=LIMIT, alpha=0.0):
    from transformers import GenerationConfig
    sampling = not (method.get("greedy") or method.get("beam"))
    settings = dict(
        do_sample=sampling, num_beams=method.get("beam", 1),
        max_new_tokens=limit, min_new_tokens=0, min_length=0,
        use_cache=True, repetition_penalty=1.0, no_repeat_ngram_size=0,
        bad_words_ids=None, suppress_tokens=None, begin_suppress_tokens=None,
        forced_bos_token_id=None, forced_eos_token_id=None,
        eos_token_id=tokenizer.eos_token_id, pad_token_id=tokenizer.eos_token_id,
        bos_token_id=tokenizer.bos_token_id, renormalize_logits=True,
        return_dict_in_generate=True, output_scores=True, output_logits=True,
    )
    if sampling:
        settings.update(temperature=method.get("temperature", 1.0),
                        top_k=method.get("k", 0), top_p=method.get("mass", 1.0),
                        min_p=method.get("relative"), top_h=None,
                        typical_p=1.0, epsilon_cutoff=0.0, eta_cutoff=0.0)
    if method.get("beam"):
        settings.update(early_stopping="never", length_penalty=alpha)
    return GenerationConfig(**settings)


def retain_generation(model, tokenizer, inputs, method, seed, limit=LIMIT, alpha=0.0):
    import torch
    config = configuration(method, tokenizer, limit, alpha)
    if seed is not None:
        torch.manual_seed(seed)
    started = time.perf_counter()
    with torch.inference_mode():
        output = model.generate(**inputs, generation_config=config)
    elapsed = time.perf_counter() - started
    prompt_length = inputs["input_ids"].shape[1]
    generated = output.sequences[0, prompt_length:].tolist()
    reason = "cap"
    if tokenizer.eos_token_id in generated:
        generated = generated[:generated.index(tokenizer.eos_token_id) + 1]
        reason = "eos"
    beam_indices = getattr(output, "beam_indices", None)
    selected_raw = model.compute_transition_scores(
        output.sequences, output.logits, beam_indices, normalize_logits=True)[0]
    selected_processed = model.compute_transition_scores(
        output.sequences, output.scores, beam_indices, normalize_logits=False)[0]
    steps = []
    for position, token in enumerate(generated):
        parent = int(beam_indices[0, position]) if beam_indices is not None else 0
        if parent < 0:
            raise AssertionError("Generated token has no retained beam ancestry")
        logits = output.logits[position][parent].double()
        processed = output.scores[position][parent].double()
        p = logits.softmax(-1)
        q = processed.softmax(-1)
        top = torch.argsort(q, descending=True, stable=True)[:8].tolist()
        is_beam = bool(method.get("beam"))
        is_greedy = bool(method.get("greedy"))
        local_log_q = None if is_beam else (0.0 if is_greedy else float(q[token].log()))
        # Beam is a sequence search, not local categorical sampling.
        shown_q = None if is_beam else q
        if is_greedy:
            shown_q = torch.zeros_like(q)
            shown_q[token] = 1
        steps.append({
            "position": position, "parent_beam": parent, "selected_id": token,
            "log_p": float(selected_raw[position]), "log_q": local_log_q,
            "processed_transition_score": float(selected_processed[position]),
            "model_entropy": entropy(p.numpy()),
            "entropy_q": None if is_beam else (0.0 if is_greedy else entropy(q.numpy())),
            "support": 1 if is_greedy else int(processed.isfinite().sum()),
            "top": [{"id": i, "token": tokenizer.decode([i]), "p": float(p[i]),
                     "q": None if shown_q is None else float(shown_q[i])} for i in top],
        })
    sequence_score = float(output.sequences_scores[0]) if method.get("beam") else None
    reconstructed = sum(row["processed_transition_score"] for row in steps) / len(steps) ** alpha
    if sequence_score is not None and not np.isclose(sequence_score, reconstructed, rtol=3e-5, atol=3e-5):
        raise AssertionError("Beam transition/length reconstruction disagrees")
    return {"ids": generated, "text": tokenizer.decode(generated, skip_special_tokens=True),
            "stop_reason": reason, "steps": steps, "wall_seconds": elapsed,
            "log_p": sum(row["log_p"] for row in steps),
            "log_q": None if method.get("beam") else sum(row["log_q"] for row in steps),
            "sequence_score": sequence_score, "reconstructed_sequence_score": reconstructed,
            "resolved_generation_config": config.to_dict()}


def native_probes(model, tokenizer, prompts, output):
    import torch
    from transformers import AutoModelForCausalLM
    from transformers.generation.logits_process import (
        TemperatureLogitsWarper, TopKLogitsWarper, TopPLogitsWarper, MinPLogitsWarper,
    )
    from transformers.generation.stopping_criteria import StopStringCriteria
    destination = output / "probes.json"
    if destination.exists():
        read_record(destination)
        return {"conserved": True, "sha256": file_hash(destination)}
    first_rows = []
    for prompt in prompts:
        inputs = tokenizer(prompt["prompt"], return_tensors="pt", add_special_tokens=False)
        def first_step():
            with torch.inference_mode():
                scores = model(**inputs).logits[:, -1].double()
            return {"logits": scores[0].tolist()}
        raw = saved_probe(output, f"first-{prompt['id']}", first_step)
        logits = torch.tensor([raw["logits"]], dtype=torch.float64)
        checks = []
        for method in METHODS[3:]:
            native = logits.clone()
            temperature = method.get("temperature", 1.0)
            if temperature != 1:
                native = TemperatureLogitsWarper(temperature)(inputs["input_ids"], native)
            if method.get("k"):
                native = TopKLogitsWarper(method["k"])(inputs["input_ids"], native)
            if method.get("mass"):
                native = TopPLogitsWarper(method["mass"])(inputs["input_ids"], native)
            if method.get("relative") is not None:
                native = MinPLogitsWarper(method["relative"])(inputs["input_ids"], native)
            settings = {k: method[k] for k in ["temperature", "k", "mass", "relative"] if k in method}
            scratch = pipeline(logits[0].numpy(), **settings)
            mask_equal = np.array_equal(np.isfinite(scratch), native[0].isfinite().numpy())
            scratch_q = np.exp(scratch - np.max(scratch))
            scratch_q /= scratch_q.sum()
            max_error = float(np.max(np.abs(scratch_q - native.softmax(-1)[0].numpy())))
            if not mask_equal or max_error > 1e-10:
                raise AssertionError(f"First-step operator discrepancy: {prompt['id']}/{method['name']}")
            checks.append({"method": method["name"], "mask_equal": mask_equal,
                           "max_probability_error": max_error,
                           "kept_ids": native[0].isfinite().nonzero().flatten().tolist()})
        # Four full real score rows support later inspection without another forward.
        first_rows.append({"prompt": prompt, "input_ids": inputs["input_ids"][0].tolist(),
                           "logits": logits[0].tolist(), "checks": checks})
    first = tokenizer(prompts[0]["prompt"], return_tensors="pt", add_special_tokens=False)
    def manual_greedy():
        manual_ids = first["input_ids"].clone()
        chosen = []
        for _ in range(8):
            with torch.inference_mode():
                next_id = model(input_ids=manual_ids, attention_mask=torch.ones_like(manual_ids)).logits[:, -1].argmax(-1)
            token = int(next_id[0])
            chosen.append(token)
            manual_ids = torch.cat([manual_ids, next_id[:, None]], dim=1)
            if token == tokenizer.eos_token_id:
                break
        return {"ids": chosen}
    manual = saved_probe(output, "manual-greedy", manual_greedy)["ids"]
    greedy = saved_probe(output, "native-greedy", lambda: retain_generation(
        model, tokenizer, first, {"greedy": True}, None, limit=8))
    if greedy["ids"] != manual:
        raise AssertionError("Manual full-prefix and native cached greedy differ")
    repeat_a = saved_probe(output, "repeat-a", lambda: retain_generation(
        model, tokenizer, first, {"temperature": 1.0}, 101, limit=8))
    repeat_b = saved_probe(output, "repeat-b", lambda: retain_generation(
        model, tokenizer, first, {"temperature": 1.0}, 101, limit=8))
    if repeat_a["ids"] != repeat_b["ids"]:
        raise AssertionError("Same-stack same-seed sampling differed")
    beam = saved_probe(output, "beam", lambda: retain_generation(
        model, tokenizer, first, {"beam": 3}, None, limit=8, alpha=1))
    reload_path = output / "reload-model"
    model.save_pretrained(reload_path)
    tokenizer.save_pretrained(reload_path)
    reloaded = AutoModelForCausalLM.from_pretrained(reload_path, local_files_only=True,
                                                  dtype=torch.float32, trust_remote_code=False).eval()
    for name, tensor in model.state_dict().items():
        if not torch.equal(tensor, reloaded.state_dict()[name]):
            raise AssertionError(f"Reload changed weights: {name}")
    reload_result = saved_probe(output, "reload", lambda: retain_generation(
        reloaded, tokenizer, first, {"greedy": True}, None, limit=8))
    if reload_result["ids"] != greedy["ids"]:
        raise AssertionError("Reload generation differed")
    stops = []
    criterion = StopStringCriteria(tokenizer, ["stop"])
    for text in ["stopped", "stop at", "lastopper", "safe"]:
        ids = tokenizer.encode(text, add_special_tokens=False)
        before = tokenizer.decode(ids[:-1])
        after = tokenizer.decode(ids)
        expected = stop_overlap(before, after, ["stop"]) is not None
        actual = bool(criterion(torch.tensor([ids]), None)[0])
        if actual != expected:
            raise AssertionError("Native token-boundary stop interpretation differed")
        stops.append({"text": text, "ids": ids, "before_final_token": before,
                      "decoded": after, "stop": actual})
    save_record(destination, {"status": "pass", "first_steps": first_rows,
                              "manual_greedy_ids": manual, "greedy": greedy,
                              "repeat_a": repeat_a, "repeat_b": repeat_b,
                              "beam": beam, "reload": reload_result, "stops": stops})
    return {"status": "pass", "sha256": file_hash(destination)}


def run(args):
    import torch
    import transformers
    from transformers import AutoModelForCausalLM, AutoTokenizer
    if transformers.__version__ != "5.19.0":
        raise ValueError("This executable example pins Transformers5.19.0")
    if args.stage == "operators":
        args.output.mkdir(parents=True, exist_ok=True)
        return native_operator_checks(args.output / "operators.json")
    if args.model is None:
        raise ValueError("Model stages require --model with the pinned local checkpoint")
    if file_hash(args.model / "model.safetensors") != WEIGHTS_SHA256:
        raise ValueError("Checkpoint weights differ from the pinned upstream revision")
    torch.set_num_threads(2)
    torch.manual_seed(17)
    _, evaluation = read_data(args.data)
    prompts = evaluation_prompts(evaluation)
    model_files = [p for p in args.model.iterdir()
                   if p.is_file() and p.suffix in [".json", ".safetensors", ".bin", ".txt"]]
    identity = {**input_identity(args.data), "model_revision": REVISION,
                "model_files": {p.name: file_hash(p) for p in sorted(model_files)},
                "transformers": transformers.__version__, "torch": torch.__version__,
                "dtype": "float32", "threads": 2, "prompts": prompts}
    output = open_run(args.output, identity)
    if args.stage == "probes" and (output / "probes.json").exists():
        read_record(output / "probes.json")
        return {"conserved": True, "sha256": file_hash(output / "probes.json")}
    if args.stage == "study" and not (output / "probes.json").exists():
        raise ValueError("Finish the declared native probes before the study")
    if args.stage == "study":
        read_record(output / "probes.json")
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(args.model, local_files_only=True,
                                               dtype=torch.float32, trust_remote_code=False).eval()
    if args.stage == "probes":
        return native_probes(model, tokenizer, prompts, output)
    for prompt in prompts:
        inputs = tokenizer(prompt["prompt"], return_tensors="pt", add_special_tokens=False)
        if inputs["input_ids"].shape[1] + LIMIT > model.config.max_position_embeddings:
            raise ValueError("Prompt plus continuation exceeds context; no truncation permitted")
        for method in METHODS:
            seeds = [None] if method.get("greedy") or method.get("beam") else SEEDS
            for seed in seeds:
                run_id = f"{prompt['id']}-{method['name']}-{seed}"
                path = output / f"{run_id}.json"
                if path.exists():
                    read_record(path)
                    continue
                begin_operation(path)
                result = retain_generation(model, tokenizer, inputs, method, seed)
                result.update({"run_id": run_id, "model": "pythia-14m",
                               "prompt": prompt, "prompt_ids": inputs["input_ids"][0].tolist(),
                               "method": method, "seed": seed})
                save_record(path, result)
    records = sorted(output.glob("heldout-line-*.json"))
    if len(records) != 84:
        raise AssertionError("Incomplete fixed native matrix")
    save_record(output / "complete.json", {"records": {p.name: file_hash(p) for p in records},
                                          "outputs": 84, "probes_sha256": file_hash(output / "probes.json")})
    return {"outputs": 84, "path": str(output)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, help="Optional isolated installed-package directory")
    parser.add_argument("--model", type=Path)
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--output", type=Path, default=Path("study-native"))
    parser.add_argument("--stage", choices=["operators", "probes", "study"], required=True)
    args = parser.parse_args()
    if args.site:
        sys.path.insert(0, str(args.site.resolve()))
    print(json.dumps(run(args), indent=2))


if __name__ == "__main__":
    main()
