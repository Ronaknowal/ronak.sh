"""Run the fixed 84-output count-model decoding study once, preserving every row.

python scratch_study.py --output study-count
Source/data guards reject incompatible reuse. No model is fitted on evaluation text.
"""

import argparse
import hashlib
import json
from pathlib import Path
import time
from beam_search import beam_search
from corpus_model import CountModel, evaluation_prompts, read_data
from filters import pipeline
from sampling import decode, entropy, probabilities, log_probabilities

METHODS = [
    {"name": "greedy", "greedy": True},
    {"name": "beam2", "beam": 2},
    {"name": "beam4", "beam": 4},
    {"name": "temperature07", "temperature": .7},
    {"name": "temperature10", "temperature": 1.0},
    {"name": "temperature13", "temperature": 1.3},
    {"name": "top_k20", "k": 20},
    {"name": "top_p09", "mass": .9},
    {"name": "min_p005", "relative": .05},
]
SEEDS = [17, 29, 43]
LIMIT = 32


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def input_identity(directory):
    here = Path(__file__).parent
    return {"programs": {p.name: file_hash(p) for p in sorted(here.glob("*.py"))},
            "data": {p.name: file_hash(p) for p in sorted(Path(directory).glob("*")) if p.is_file()},
            "methods": METHODS, "seeds": SEEDS, "limit": LIMIT}


def open_run(output, identity):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    manifest = output / "inputs.json"
    if manifest.exists():
        if json.loads(manifest.read_text(encoding="utf-8")) != identity:
            raise ValueError("Existing run belongs to different source/data/configuration")
    else:
        manifest.write_text(json.dumps(identity, indent=2) + "\n", encoding="utf-8")
    return output


def save_record(path, record):
    temporary = path.with_suffix(".pending.json")
    temporary.write_text(json.dumps(record, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(path)
    seal(path)


def seal(path):
    """Bind a completed record immediately, including interrupted-run reuse."""
    path.with_suffix(path.suffix + ".sha256").write_text(file_hash(path) + "\n", encoding="ascii")


def read_record(path):
    expected = path.with_suffix(path.suffix + ".sha256").read_text(encoding="ascii").strip()
    if file_hash(path) != expected:
        raise ValueError(f"Completed record changed: {path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def begin_operation(path):
    """An unfinished operation needs a reviewed continuation, never silent replay."""
    marker = path.with_suffix(path.suffix + ".started")
    with marker.open("x", encoding="utf-8") as handle:
        handle.write("Operation started; preserve any failure before continuation.\n")


def trace_beam(model, prompt, selected):
    prefix, trace = prompt.copy(), []
    for position, token in enumerate(selected["ids"]):
        logits = model.logits(prefix)
        log_p = log_probabilities(logits)
        p = probabilities(logits)
        trace.append({"position": position, "prefix_ids": prefix.copy(),
                      "selected_id": token, "log_p": float(log_p[token]),
                      "log_q": None, "entropy_q": None,
                      "model_entropy": entropy(p), "support": len(p)})
        prefix.append(token)
    return trace


def run(output, data):
    train, evaluation = read_data(data)
    identity = input_identity(data)
    output = open_run(output, identity)
    count_path = output / "counts.json"
    if count_path.exists():
        read_record(count_path)
        model = CountModel.load(count_path)
    else:
        begin_operation(count_path)
        model = CountModel.fit(train, alpha=.1)
        model.save(count_path)
        seal(count_path)
    # Reload exactly the saved count parameters; do not fit a second model.
    reloaded = CountModel.load(count_path)
    for prompt in evaluation_prompts(evaluation):
        prompt_ids = model.encode(prompt["prompt"])
        if not (model.logits(prompt_ids) == reloaded.logits(prompt_ids)).all():
            raise AssertionError("Count-model reload changed predictions")
        for method in METHODS:
            seeds = [None] if method.get("greedy") or method.get("beam") else SEEDS
            for seed in seeds:
                run_id = f"{prompt['id']}-{method['name']}-{seed}"
                path = output / f"{run_id}.json"
                if path.exists():
                    read_record(path)
                    continue  # Completed generations are conserved, never replayed.
                begin_operation(path)
                started = time.perf_counter()
                if method.get("beam"):
                    search = beam_search(model.logits, prompt_ids, method["beam"],
                                         LIMIT, model.eos_id, alpha=0)
                    selected = search["selected"]
                    steps = trace_beam(model, prompt_ids, selected)
                    result = {"ids": selected["ids"], "log_p": selected["log_p"],
                              "log_q": None, "steps": steps,
                              "stop_reason": search["selected_status"], "beam": search}
                else:
                    settings = {k: method[k] for k in ["temperature", "k", "mass", "relative"] if k in method}
                    result = decode(model.logits, prompt_ids,
                                    lambda logits, _: pipeline(logits, **settings),
                                    LIMIT, model.eos_id, seed=seed, greedy=method.get("greedy", False))
                result.update({"run_id": run_id, "model": "smoothed_word_bigram",
                               "prompt": prompt, "prompt_ids": prompt_ids,
                               "method": method, "seed": seed,
                               "text": model.decode(result["ids"]),
                               "wall_seconds": time.perf_counter() - started})
                save_record(path, result)
    records = [p for p in output.glob("heldout-line-*.json")]
    if len(records) != 84:
        raise AssertionError("Incomplete fixed run matrix")
    save_record(output / "complete.json", {"records": {p.name: file_hash(p) for p in sorted(records)},
                                          "counts_sha256": file_hash(count_path), "outputs": 84})
    return {"outputs": 84, "vocabulary": len(model.vocabulary), "path": str(output)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--output", type=Path, default=Path("study-count"))
    args = parser.parse_args()
    print(json.dumps(run(args.output, args.data), indent=2))


if __name__ == "__main__":
    main()
