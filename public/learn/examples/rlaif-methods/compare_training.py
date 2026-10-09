"""Fixed small real-data comparison of four declared preference objectives.

python -B compare_training.py --plan prepared-inputs.json --output training-results.json --states states
Requires torch and numpy. Fifteen fits: three SFT starts, four continuations each.
Terminal update and all seeds are fixed prospectively; no model selection occurs.
"""

import argparse
import copy
import json
import math
from pathlib import Path
import time

import torch
import torch.nn.functional as F

from causal_backbone import TinyLM
from preference_losses import ipo_loss, orpo_loss
from records_and_masks import digest_model, emit, model_scores, prepare, rows_batch


SEEDS = [17, 29, 43]
METHODS = ["SFT", "DPO", "IPO", "ORPO"]


def schedule(seed, steps, size, batch_size=6):
    generator = torch.Generator().manual_seed(seed)
    sequence = []
    while len(sequence) < steps * batch_size:
        sequence.extend(torch.randperm(size, generator=generator).tolist())
    return [sequence[start:start + batch_size] for start in range(0, steps * batch_size, batch_size)]


def prepared_inputs():
    records, vocabulary = prepare()
    return {
        "vocabulary": vocabulary,
        "ids": {split: [row["id"] for row in rows] for split, rows in records.items()},
        "tokens": {split: [{"id": row["id"], "prompt_ids": row["prompt_ids"],
                            "chosen_ids": row["chosen_ids"], "rejected_ids": row["rejected_ids"]}
                           for row in rows] for split, rows in records.items()},
        "schedules": {str(seed): {"warm": schedule(seed, 64, 24),
                                   "continuation": schedule(seed + 1000, 80, 24)} for seed in SEEDS},
        "architecture": {"context": 196, "width": 24, "heads": 2, "layers": 1},
        "optimizer": {"kind": "AdamW", "learning_rate": .001, "betas": [.9, .999],
                      "epsilon": 1e-8, "weight_decay": 0, "gradient_clip_norm": 1.},
        "coefficients": {"DPO_beta": .2, "IPO_tau": .5, "ORPO_lambda": .1},
    }


def objective(method, policy, reference, pairs):
    sums, counts = policy["sums"], policy["counts"]
    means = sums / counts
    if method == "SFT":
        losses = -means[:pairs]
        return losses.mean(), losses
    if method == "DPO":
        gains = sums - reference.detach()
        margin = gains[:pairs] - gains[pairs:]
        losses = F.softplus(-.2 * margin)
        return losses.mean(), losses
    if method == "IPO":
        loss, _, losses = ipo_loss(sums, reference, counts, pairs, tau=.5)
        return loss, losses
    if method == "ORPO":
        loss, _, contrast = orpo_loss(means[:pairs], means[pairs:], weight=.1)
        return loss, -means[:pairs] + .1 * contrast
    raise ValueError("Unknown objective " + method)


def count_forward(work, role, batch):
    work[role + "_batches"] += 1
    work[role + "_sequences"] += len(batch["input_ids"])
    work[role + "_visible_positions"] += int(batch["attention_mask"].sum())
    work[role + "_padded_positions"] += batch["input_ids"].numel()
    work[role + "_response_targets"] += int(batch["completion_mask"].sum())


def empty_work():
    return {role + suffix: 0 for role in ["policy_train", "policy_eval", "reference"]
            for suffix in ["_batches", "_sequences", "_visible_positions", "_padded_positions", "_response_targets"]}


@torch.no_grad()
def reference_cache(reference, records, vocabulary, work):
    answer = {}
    for rows in records.values():
        for start in range(0, len(rows), 6):
            group = rows[start:start + 6]
            batch = rows_batch(group, vocabulary)
            count_forward(work, "reference", batch)
            scores = model_scores(reference, batch)
            for index, row in enumerate(group):
                answer[row["id"]] = [scores["sums"][index].item(), scores["sums"][index + len(group)].item()]
    return answer


def cached_vector(rows, cache):
    return torch.tensor([cache[row["id"]][0] for row in rows] + [cache[row["id"]][1] for row in rows],
                        dtype=torch.float32)


@torch.no_grad()
def assess(model, rows, vocabulary, cache, method, work):
    model.eval()
    outputs = []
    total_nll, total_targets = 0., 0
    for start in range(0, len(rows), 6):
        group = rows[start:start + 6]
        batch = rows_batch(group, vocabulary)
        count_forward(work, "policy_eval", batch)
        scores = model_scores(model, batch)
        sums, counts = scores["sums"], scores["counts"]
        means = sums / counts
        reference = cached_vector(group, cache)
        if cache:
            _, losses = objective(method, scores, reference, len(group))
        else:
            losses = -means[:len(group)]
        for index, row in enumerate(group):
            other = index + len(group)
            chosen_count, rejected_count = int(counts[index]), int(counts[other])
            chosen_sum, rejected_sum = sums[index].item(), sums[other].item()
            chosen_mean, rejected_mean = means[index].item(), means[other].item()
            gain_sum = (sums[index] - reference[index] - sums[other] + reference[other]).item()
            gain_mean = ((sums[index] - reference[index]) / counts[index]
                         - (sums[other] - reference[other]) / counts[other]).item()
            outputs.append({"id": row["id"], "chosen_count": chosen_count, "rejected_count": rejected_count,
                            "chosen_sum": chosen_sum, "rejected_sum": rejected_sum,
                            "chosen_mean": chosen_mean, "rejected_mean": rejected_mean,
                            "reference_chosen_sum": reference[index].item(),
                            "reference_rejected_sum": reference[other].item(),
                            "relative_sum_margin": gain_sum, "relative_mean_margin": gain_mean,
                            "sum_rank": int(chosen_sum > rejected_sum) - int(chosen_sum < rejected_sum),
                            "mean_rank": int(chosen_mean > rejected_mean) - int(chosen_mean < rejected_mean),
                            "relative_sum_rank": int(gain_sum > 0) - int(gain_sum < 0),
                            "relative_mean_rank": int(gain_mean > 0) - int(gain_mean < 0),
                            "chosen_unknowns": row["chosen_unknowns"], "rejected_unknowns": row["rejected_unknowns"],
                            "objective_loss": losses[index].item()})
            total_nll -= chosen_sum
            total_targets += chosen_count
    token_nll = total_nll / total_targets
    ranks = {}
    for name in ["sum_rank", "mean_rank", "relative_sum_rank", "relative_mean_rank"]:
        values = [row[name] for row in outputs]
        ranks[name] = {"positive": values.count(1), "ties": values.count(0), "negative": values.count(-1),
                       "positive_fraction": values.count(1) / len(values)}
    return {"records": outputs, "pairs": len(outputs), "chosen_targets": total_targets,
            "chosen_total_NLL": total_nll, "token_weighted_chosen_NLL": token_nll,
            "word_punctuation_EOS_PPL": math.exp(token_nll),
            "equal_response_chosen_NLL": sum(-row["chosen_mean"] for row in outputs) / len(outputs),
            "objective_mean": sum(row["objective_loss"] for row in outputs) / len(outputs), "ranks": ranks}


def optimizer_for(model):
    return torch.optim.AdamW(model.parameters(), lr=.001, betas=(.9, .999), eps=1e-8, weight_decay=0)


def warm_start(model, rows, vocabulary, batches, work):
    optimizer = optimizer_for(model)
    history = []
    for step, indices in enumerate(batches):
        group = [rows[index] for index in indices]
        batch = rows_batch(group, vocabulary, both=False)
        count_forward(work, "policy_train", batch)
        scores = model_scores(model, batch)
        loss = -(scores["sums"] / scores["counts"]).mean()
        assert torch.isfinite(loss)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
        history.append({"update": step + 1, "ids": [row["id"] for row in group],
                        "loss": loss.item(), "pre_clip_gradient_norm": norm.item()})
    return history


def continuation(model, records, vocabulary, cache, method, batches, work):
    optimizer = optimizer_for(model)
    updates, checkpoints = [], []
    for step in range(81):
        if step % 8 == 0:
            snapshot = {"step": step, "state_sha256": digest_model(model)}
            for split in ["train", "heldout"]:
                snapshot[split] = assess(model, records[split], vocabulary, cache, method, work)
            checkpoints.append(snapshot)
        if step == 80:
            break
        model.train()
        group = [records["train"][index] for index in batches[step]]
        batch = rows_batch(group, vocabulary, both=method != "SFT")
        count_forward(work, "policy_train", batch)
        scores = model_scores(model, batch)
        reference = cached_vector(group, cache) if method != "SFT" else torch.empty(0)
        loss, _ = objective(method, scores, reference, len(group))
        assert torch.isfinite(loss), (method, step)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
        updates.append({"update": step + 1, "ids": [row["id"] for row in group], "loss": loss.item(),
                        "pre_clip_gradient_norm": norm.item()})
    return {"updates": updates, "checkpoints": checkpoints}


def run(plan_path, state_folder):
    torch.set_num_threads(2)
    records, vocabulary = prepare()
    expected = prepared_inputs()
    plan = json.loads(Path(plan_path).read_text(encoding="utf-8"))
    assert plan == expected, "Prospective representation/schedule no longer matches"
    state_folder.mkdir(parents=True, exist_ok=True)
    seeds = []
    started = time.perf_counter()
    for seed in SEEDS:
        torch.manual_seed(seed)
        model = TinyLM(len(vocabulary), context=196, width=24, heads=2, layers=1)
        initial_hash = digest_model(model)
        torch.save(model.state_dict(), state_folder / f"seed-{seed}-initial.pt")
        work = empty_work()
        warm = warm_start(model, records["train"], vocabulary, plan["schedules"][str(seed)]["warm"], work)
        warm_hash = digest_model(model)
        torch.save(model.state_dict(), state_folder / f"seed-{seed}-warm.pt")
        reference = copy.deepcopy(model).eval().requires_grad_(False)
        cache = reference_cache(reference, records, vocabulary, work)
        methods = {}
        for method in METHODS:
            current = copy.deepcopy(model)
            assert digest_model(current) == warm_hash
            method_started = time.perf_counter()
            method_work = empty_work()
            result = continuation(current, records, vocabulary, cache, method,
                                  plan["schedules"][str(seed)]["continuation"], method_work)
            state_path = state_folder / f"seed-{seed}-{method}.pt"
            torch.save(current.state_dict(), state_path)
            restored = TinyLM(len(vocabulary), context=196, width=24, heads=2, layers=1)
            restored.load_state_dict(torch.load(state_path, weights_only=True))
            assert digest_model(restored) == digest_model(current)
            methods[method] = {**result, "work": method_work, "wall_seconds": time.perf_counter() - method_started,
                               "start_state_sha256": warm_hash, "final_state_sha256": digest_model(current)}
            print(f"seed {seed}, {method}, fixed update 80 complete", flush=True)
        assert digest_model(reference) == warm_hash and all(value.grad is None for value in reference.parameters())
        seeds.append({"seed": seed, "initial_state_sha256": initial_hash, "warm_state_sha256": warm_hash,
                      "warm_updates": warm, "warm_and_cache_work": work, "reference_cache": cache, "methods": methods})
    return {"kind": "Actual small released AI-labelled pair study; no human quality evaluation",
            "seeds": seeds, "fits": 15, "architecture": plan["architecture"], "vocabulary_size": len(vocabulary),
            "wall_seconds": time.perf_counter() - started,
            "ORPO_variant": "Warm-started response-only imitation; not from-base paper or prompt-inclusive TRL NLL",
            "evaluation_units": "Word/punctuation/EOS token-weighted NLL; rank agreement against original AI labels",
            "terminal_rule": "All seeds, update 80; no heldout selection"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", type=Path, default=Path("prepared-inputs.json"))
    parser.add_argument("--states", type=Path, default=Path("states"))
    parser.add_argument("--output", type=Path, default=Path("training-results.json"))
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()
    if args.prepare_only:
        emit(args.plan, prepared_inputs())
        print({"prepared": str(args.plan), "fits": 0})
    else:
        result = run(args.plan, args.states)
        emit(args.output, result)
        print({"fits": result["fits"], "seeds": SEEDS, "output": str(args.output)})


if __name__ == "__main__":
    main()
