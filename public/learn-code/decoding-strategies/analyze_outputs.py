"""Analyze retained decoding outputs without a model or a new generation.

python analyze_outputs.py --count study-count --native study-native --output observations.json
Metrics concern each model's own tokenization; NLL is never compared across vocabularies.
"""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import numpy as np
from scratch_study import file_hash, save_record


def summarize(record, eos_id):
    ids = record["ids"]
    content = ids[:-1] if ids and ids[-1] == eos_id else ids
    bigrams = list(zip(content, content[1:]))
    distinct2 = len(set(bigrams)) / len(bigrams) if bigrams else None
    local_entropies = [step["entropy_q"] for step in record["steps"]
                       if step["entropy_q"] is not None]
    if len(record["steps"]) != len(ids):
        raise AssertionError("Token/step count mismatch")
    recovered = sum(step["log_p"] for step in record["steps"])
    if not np.isclose(recovered, record["log_p"], rtol=1e-6, atol=1e-5):
        raise AssertionError("Selected model log probability does not reconstruct")
    return {"run_id": record["run_id"], "model": record["model"],
            "prompt_id": record["prompt"]["id"], "method": record["method"]["name"],
            "seed": record["seed"], "generated_tokens": len(ids),
            "content_tokens": len(content), "stop_reason": record["stop_reason"],
            "mean_model_nll": -recovered / len(ids) if ids else None,
            "mean_local_entropy": float(np.mean(local_entropies)) if local_entropies else None,
            "mean_support": float(np.mean([s["support"] for s in record["steps"]])) if ids else None,
            "distinct_2": distinct2, "repeat_2": 1 - distinct2 if distinct2 is not None else None,
            "wall_seconds": record["wall_seconds"], "text": record["text"]}


def load_completed(directory, eos_id):
    directory = Path(directory)
    completion = json.loads((directory / "complete.json").read_text(encoding="utf-8"))
    records = []
    for filename, expected in completion["records"].items():
        path = directory / filename
        if file_hash(path) != expected:
            raise ValueError(f"Retained row changed: {filename}")
        records.append(summarize(json.loads(path.read_text(encoding="utf-8")), eos_id))
    return records


def run(count_path, native_path, output):
    rows = [*load_completed(count_path, eos_id=1), *load_completed(native_path, eos_id=0)]
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["model"], row["method"]].append(row)
    aggregates = []
    for (model, method), values in sorted(grouped.items()):
        row = {"model": model, "method": method, "n": len(values),
               "eos": sum(v["stop_reason"] == "eos" for v in values),
               "cap": sum(v["stop_reason"] == "cap" for v in values)}
        for key in ["generated_tokens", "mean_model_nll", "mean_local_entropy", "distinct_2"]:
            valid = [v[key] for v in values if v[key] is not None]
            row[key] = {"mean": float(np.mean(valid)) if valid else None,
                        "defined_count": len(valid)}
        aggregates.append(row)
    result = {"scope": "Fixed illustrative prefixes; no quality, correctness or general superiority inference",
              "rows": rows, "aggregates": aggregates,
              "inputs": {"count_complete": file_hash(Path(count_path) / "complete.json"),
                         "native_complete": file_hash(Path(native_path) / "complete.json")}}
    save_record(Path(output), result)
    return {"rows": len(rows), "groups": len(aggregates), "output": str(output)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=Path, required=True)
    parser.add_argument("--native", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("observations.json"))
    args = parser.parse_args()
    print(json.dumps(run(args.count, args.native, args.output), indent=2))


if __name__ == "__main__":
    main()
