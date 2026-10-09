"""Fixed Flan-T5-small numerical-answer sampling, no training or judge.

python sample_hf.py --cache MODEL_CACHE --data data --output observations
The exact revision must already be cached. --allow-download permits acquiring it.
Creates a new directory, journals every output and never overwrites an old run.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.metadata
import json
import os
import platform
import time
import traceback

MODEL = "google/flan-t5-small"
REVISION = "0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"
SEEDS = (17, 29, 43)
SAMPLES = 8
CAP = 64


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prompt(question):
    return "Solve the problem. Give the final numeric answer after 'Answer:'.\n" + question + "\nAnswer:"


def generated_work(ids, start_id, eos_id):
    if not ids or ids[0] != start_id:
        raise ValueError("Expected the supplied T5 decoder-start position")
    emitted = ids[1:]
    if eos_id in emitted:
        end = emitted.index(eos_id) + 1
        return emitted[:end], "eos", emitted[end:]
    return emitted, "cap", []


def append_record(stream, row):
    stream.write(json.dumps(row, ensure_ascii=False) + "\n")
    stream.flush()
    os.fsync(stream.fileno())


def run(cache, data, output, allow_download=False):
    import torch
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, GenerationConfig
    output.mkdir(parents=True, exist_ok=False)
    source = json.loads((data / "source.json").read_text(encoding="utf8"))
    if digest(data / "selected.json") != source["selected_sha256"]:
        raise ValueError("Selected dataset does not match provenance")
    records = json.loads((data / "selected.json").read_text(encoding="utf8"))
    if len(records) != 12 or [r["source_row"] for r in records] != list(range(12)):
        raise ValueError("Protocol requires first12 original rows in order")
    protocol = {"model": MODEL, "revision": REVISION, "dtype": "float32", "device": "cpu",
                "threads": 2, "seeds": SEEDS, "samples_per_seed": SAMPLES, "cap": CAP,
                "temperature": .8, "top_p": .95, "top_k": 0, "batch_size": 1,
                "candidate_counts": [1, 4, 8], "data_sha256": digest(data / "selected.json"),
                "program_sha256": digest(Path(__file__)), "prompt_template": prompt("{question}"),
                "versions": {n: importlib.metadata.version(n) for n in
                             ("torch", "transformers", "tokenizers", "sentencepiece", "numpy")},
                "python": platform.python_version(), "platform": platform.platform(),
                "scope": "12 convenience rows, numerical-answer voting, no training/CoT reproduction"}
    (output / "protocol.json").write_text(json.dumps(protocol, indent=2), encoding="utf8")
    torch.set_num_threads(2)
    options = dict(revision=REVISION, cache_dir=cache, local_files_only=not allow_download)
    tokenizer = AutoTokenizer.from_pretrained(MODEL, **options)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, dtype=torch.float32, **options).eval()
    inputs = []
    for row in records:
        encoded = tokenizer(prompt(row["question"]), return_tensors="pt", truncation=False)
        if encoded.input_ids.shape[1] > 512:
            (output / "rejected-source.json").write_text(json.dumps({"id": row["id"],
                "length": encoded.input_ids.shape[1], "reason": "source exceeds512; no generation started"}))
            raise ValueError("Source overflow; preserve cohort and revise protocol explicitly")
        inputs.append(encoded)
    configs = {}
    for arm in ("greedy", "sample"):
        config = GenerationConfig.from_model_config(model.config)
        for key, value in dict(do_sample=arm == "sample", num_beams=1,
            num_return_sequences=1, max_new_tokens=CAP, min_new_tokens=0,
            temperature=.8 if arm == "sample" else 1.0,
            top_p=.95 if arm == "sample" else 1.0, top_k=0, min_p=None,
            typical_p=1.0, epsilon_cutoff=0.0, eta_cutoff=0.0,
            repetition_penalty=1.0, no_repeat_ngram_size=0).items():
            setattr(config, key, value)
        if hasattr(config, "top_h"):
            config.top_h = None
        config.validate()
        configs[arm] = config
    (output / "resolved-config.json").write_text(json.dumps({key: cfg.to_dict()
        for key, cfg in configs.items()}, indent=2), encoding="utf8")
    completed = 0
    with (output / "generations.jsonl").open("x", encoding="utf8") as journal:
        for q, (row, encoded) in enumerate(zip(records, inputs)):
            plans = [("greedy", None, 0)] + [("sample", seed, index)
                     for seed in SEEDS for index in range(SAMPLES)]
            for arm, seed, index in plans:
                actual_seed = 0 if seed is None else seed * 10000 + q * 100 + index
                torch.manual_seed(actual_seed)
                started = time.perf_counter()
                with torch.inference_mode():
                    sequence = model.generate(**encoded, generation_config=configs[arm])
                seconds = time.perf_counter() - started
                ids = sequence[0].tolist()
                work, stop, padding = generated_work(ids, model.config.decoder_start_token_id,
                                                     model.config.eos_token_id)
                result = {"question_id": row["id"], "arm": arm, "seed": seed, "sample": index,
                          "torch_seed": actual_seed, "input_ids": encoded.input_ids[0].tolist(),
                          "returned_ids": ids, "generated_ids": work, "post_eos_padding": padding,
                          "text": tokenizer.decode(work, skip_special_tokens=True),
                          "generated_tokens": len(work), "stop": stop, "cpu_seconds": seconds}
                append_record(journal, result)
                completed += 1
            print(f"completed question {q + 1}/12; outputs {completed}", flush=True)
    (output / "complete.json").write_text(json.dumps({"outputs": completed,
        "generations_sha256": digest(output / "generations.jsonl"),
        "model_config": model.config.to_dict()}, indent=2), encoding="utf8")
    return completed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--allow-download", action="store_true")
    args = parser.parse_args()
    existed_before = args.output.exists()
    try:
        print({"completed": run(args.cache, args.data, args.output, args.allow_download)})
    except Exception as error:
        # Record only in a directory created by this run, never alter an earlier run.
        if not existed_before and args.output.exists() and not isinstance(error, FileExistsError):
            (args.output / "failure.txt").write_text(traceback.format_exc(), encoding="utf8")
        raise
