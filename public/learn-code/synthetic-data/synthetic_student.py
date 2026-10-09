"""Train equal-target raw/copy/generated conditions on supplied paragraph data.
Run: python synthetic_student.py --candidates candidates.json --output study
Writes a new directory; the final step is fixed in advance, never test-selected.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import time
import numpy as np
import torch
from torch import nn
import torch.nn.functional as F
from synthetic_corpus import read_sources, select_candidates, WindowPool, diagnostics
from tiny_causal_lm import TinyLM, score

SEEDS = [17, 29, 43]
STEPS, BATCH, CONTEXT = 300, 16, 32


def grouped_score(model, records):
    rows = []
    for row in records:
        ids = torch.tensor(list(row["text"].encode("utf-8")), dtype=torch.long)
        rows.append({"id": row["id"], **score(model, ids)})
    total = sum(row["nll_sum"] for row in rows)
    count = sum(row["targets"] for row in rows)
    return {"paragraphs": rows, "nll_sum": total, "targets": count,
            "byte_nll": total / count, "byte_perplexity": math.exp(total / count)}


def state_hash(model):
    digest = hashlib.sha256()
    for name, value in model.state_dict().items():
        digest.update(name.encode()); digest.update(value.numpy().tobytes())
    return digest.hexdigest()


@torch.no_grad()
def inspector(model, records):
    """All 256 probabilities at fixed positions; no fitted browser model."""
    model.eval()
    rows = []
    for record in records:
        ids = list(record["text"].encode("utf-8"))
        for target in (1, 8, 32, 64):
            if target >= len(ids): continue
            context = ids[max(0, target - CONTEXT):target]
            logits = model(torch.tensor([context]))[0, -1]
            rows.append({"source_id": record["id"], "target_position": target,
                         "context": context, "target": ids[target],
                         "probabilities": logits.softmax(-1).tolist()})
    return rows


def fit(seed, arm, raw, generated, heldout, branch_draws, window_draws):
    torch.manual_seed(seed)
    model = TinyLM(256, context=CONTEXT, width=32, heads=2, layers=2)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.003, weight_decay=.01)
    history = [{"step": 0, **grouped_score(model, heldout)}]
    initial_hash = state_hash(model)
    generated_rows = 0
    start = time.perf_counter()
    for step in range(STEPS):
        samples = []
        for branch, uniform in zip(branch_draws[step], window_draws[step]):
            use_generated = arm == "generated" and branch < .5
            pool = generated if use_generated else raw
            samples.append(pool.sample(uniform))
            generated_rows += int(use_generated)
        windows = torch.from_numpy(np.stack(samples))
        model.train()
        logits = model(windows[:, :-1])
        loss = F.cross_entropy(logits.reshape(-1, 256), windows[:, 1:].reshape(-1))
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        if (step + 1) % 100 == 0:
            history.append({"step": step + 1, **grouped_score(model, heldout)})
    result = {"seed": seed, "arm": arm, "initial_weight_sha256": initial_hash,
              "final_weight_sha256": state_hash(model), "history": history,
              "training_targets": STEPS * BATCH * CONTEXT,
              "generated_targets": generated_rows * CONTEXT,
              "branch_one_windows": int((branch_draws < .5).sum()),
              "elapsed_seconds_including_evaluation": time.perf_counter() - start}
    return model, result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    sources = read_sources()["records"]
    candidates = json.loads(args.candidates.read_text(encoding="utf-8"))
    selected = select_candidates(candidates["records"], sources)
    train = [r for r in sources if r["split"] == "train"]
    heldout = [r for r in sources if r["split"] == "heldout"]
    raw, generated = WindowPool(train), WindowPool(selected["kept"])
    args.output.mkdir(exist_ok=False)
    torch.set_num_threads(2)
    torch.use_deterministic_algorithms(True)
    result = {"torch": torch.__version__, "numpy": np.__version__, "device": "CPU",
              "student": {"vocabulary": 256, "context": CONTEXT, "width": 32,
                          "heads": 2, "layers": 2, "dropout": 0, "parameters": 42624},
              "raw": diagnostics(train), "generated": diagnostics(selected["kept"]),
              "selection": selected["ledger"], "fits": [], "inspector": []}
    for seed in SEEDS:
        rng = np.random.default_rng(seed + 1000)
        branches, uniforms = rng.random((STEPS, BATCH)), rng.random((STEPS, BATCH))
        paired = []
        for arm in ("raw", "copy", "generated"):
            model, run = fit(seed, arm, raw, generated, heldout, branches, uniforms)
            result["fits"].append(run); paired.append(run)
            if seed == 17:
                torch.save(model.state_dict(), args.output / f"{arm}-seed17.pt")
                result["inspector"].append({"arm": arm, "seed": seed,
                                           "rows": inspector(model, heldout)})
            print(json.dumps({"seed": seed, "arm": arm,
                              "final_byte_nll": run["history"][-1]["byte_nll"]}), flush=True)
            with (args.output / "progress.json").open("w", encoding="utf-8") as stream:
                json.dump(result, stream, indent=2)
        if paired[0]["final_weight_sha256"] != paired[1]["final_weight_sha256"] or paired[0]["history"] != paired[1]["history"]:
            raise AssertionError("Raw/copy null diverged")
    result["copy_null_exact"] = True
    with (args.output / "study.json").open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2); stream.write("\n")


if __name__ == "__main__":
    main()
