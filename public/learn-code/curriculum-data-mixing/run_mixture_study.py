"""Run the lesson's locked small real-text mixture experiment on CPU.

Requires NumPy/SciPy. Keep all topic Python files and literary-domains.json here.
python run_mixture_study.py --output my-study.json
No output is overwritten. The default protocol is intentionally small and fixed.
"""
import argparse
import hashlib
import json
import platform
import time
from pathlib import Path
import numpy as np
import scipy
from byte_mixture import ROOT, load_pairs, train_fixed, optimize_doremi, score
from fit_mixture_response import simplex_grid, fit_domains
from mixing_math import normalize


def run():
    start = time.perf_counter()
    domains = load_pairs()
    sizes = [len(d["train"]) for d in domains]
    available = normalize(sizes)
    equal = np.ones(len(domains)) / len(domains)
    mixtures = simplex_grid(4)
    observations = []
    for i, mixture in enumerate(mixtures):
        _, result = train_fixed(domains, mixture, seed=17)
        observations.append(result["tuning_nll"])
        print(f"Response observation {i + 1}/{len(mixtures)} complete", flush=True)
    fit = fit_domains(mixtures, observations)
    # Selection is now complete. Final test is first accessed below.
    results, proxy_records = [], []
    for seed in (17, 29, 43):
        reference, reference_run = train_fixed(domains, available, seed=seed)
        learned, proxy = optimize_doremi(domains, reference, seed=seed)
        proxy_records.append({"seed": seed, "reference": reference_run, "proxy": proxy})
        choices = [("availability", available), ("equal", equal),
                   ("doremi", learned), ("response-fit", fit["selected"])]
        for name, shares in choices:
            weights, result = train_fixed(domains, shares, seed=seed)
            result["arm"] = name
            result["test_nll"] = score(weights, domains, split="test")
            result["test_macro_nll"] = float(np.mean(result["test_nll"]))
            results.append(result)
            print(f"Seed {seed}: {name} complete", flush=True)
    summaries = []
    for arm in ("availability", "equal", "doremi", "response-fit"):
        values = [r["test_macro_nll"] for r in results if r["arm"] == arm]
        summaries.append({"arm": arm, "mean": float(np.mean(values)),
                          "min": min(values), "max": max(values), "seeds": len(values)})
    files = sorted(ROOT.glob("*.py")) + [ROOT / "literary-domains.json"]
    return {"schema": 1, "kind": "measured CPU byte-bigram study; no scale transfer claim",
            "environment": {"python": platform.python_version(), "numpy": np.__version__,
                            "scipy": scipy.__version__},
            "sources": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
            "protocol": {"vocabulary": 256, "parameters": 65536, "initial_logits": "all zero",
                         "steps": 120, "batch": 768, "sgd_lr": 8.0,
                         "seeds": [17, 29, 43], "test_aggregation": "equal mean of domain NLLs",
                         "selection": "12 tuning-loss mixture fits;3held-out mixture coordinates; final test unused in fitting",
                         "proxy_overhead_per_seed_targets": 2 * 120 * 768,
                         "response_search_targets": 15 * 120 * 768},
            "domains": [{"id": d["id"], "title": d["title"],
                         "target_counts": {s: len(d[s]) for s in ("train", "tune", "test")}}
                        for d in domains],
            "response_observations": {"mixtures": mixtures.tolist(), "tuning_nll": observations},
            "fit": fit, "proxy_runs": proxy_records, "main_runs": results,
            "summary": summaries, "wall_seconds": time.perf_counter() - start}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Choose a fresh output filename")
    result = run()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"summary": result["summary"], "selected": result["fit"]["selected"],
                      "wall_seconds": result["wall_seconds"]}, indent=2))


if __name__ == "__main__":
    main()
