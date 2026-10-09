"""Four reference-free continuations of one complete causal language model.

python -B scratch_simpo.py --output scratch-simpo-results.json
Requires torch and the supplied backbone/scoring helpers. Constructed data only.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import torch
from torch import nn
from causal_backbone import TinyLM
from response_scores import pack, pair_loss, response_scores

TOKENS = ["PAD", "BOS", "EOS", "one", "sentence", "France", "Italy", "Paris", "Rome",
          "is", "capital", "of", "period"]
PAD, BOS, EOS = 0, 1, 2
INDEX = {word: index for index, word in enumerate(TOKENS)}


def fixture():
    prompts, demonstrations, comparisons = [], [], []
    for instruction in ("one", "sentence"):
        for country, capital, wrong in (("France", "Paris", "Rome"), ("Italy", "Rome", "Paris")):
            prompt = [BOS, INDEX[instruction], INDEX[country]]
            short = [INDEX[capital], EOS]
            long = [INDEX[capital], INDEX["is"], INDEX["capital"], INDEX["of"],
                    INDEX[country], INDEX["period"], EOS]
            good = short if instruction == "one" else long
            alternative = long if instruction == "one" else short
            wrong_capital = [INDEX[wrong], *good[1:]]
            prompts.append(prompt)
            demonstrations.extend([(prompt, short), (prompt, long)])
            comparisons.extend([(prompt, good, alternative), (prompt, good, wrong_capital)])
    return prompts, demonstrations, comparisons


def digest_model(model):
    digest = hashlib.sha256()
    for name, tensor in model.state_dict().items():
        digest.update(name.encode())
        digest.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def model_scores(model, batch):
    return response_scores(model(batch["input_ids"]), **batch)


def comparison_batch(comparisons):
    prompts = [row[0] for row in comparisons] * 2
    responses = [row[1] for row in comparisons] + [row[2] for row in comparisons]
    return pack(prompts, responses, PAD, maximum=16)


def sft(model, demonstrations):
    batch = pack([row[0] for row in demonstrations], [row[1] for row in demonstrations], PAD, 16)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.003, weight_decay=0)
    history = []
    for step in range(121):
        scores = model_scores(model, batch)
        loss = -scores["sums"].sum() / scores["counts"].sum()
        if step % 30 == 0:
            history.append({"step": step, "nll": loss.item(), "targets": int(scores["counts"].sum())})
        if step < 120:
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.)
            optimizer.step()
    return history


def criterion(prompt, response):
    country = TOKENS[prompt[2]]
    capital = INDEX["Paris" if country == "France" else "Rome"]
    expected = ([capital, EOS] if prompt[1] == INDEX["one"] else
                [capital, INDEX["is"], INDEX["capital"], INDEX["of"], prompt[2], INDEX["period"], EOS])
    return response == expected


@torch.no_grad()
def generate(model, prompts):
    model.eval()
    generator = torch.Generator().manual_seed(947)
    outputs = []
    for prompt in prompts:
        for sample in range(8):
            sequence = list(prompt)
            for _ in range(8):
                logits = model(torch.tensor([sequence]))[0, -1]
                token = int(torch.multinomial(logits.softmax(-1), 1, generator=generator))
                sequence.append(token)
                if token == EOS:
                    break
            response = sequence[len(prompt):]
            outputs.append({"prompt_ids": prompt, "response_ids": response,
                            "prompt": " ".join(TOKENS[token] for token in prompt),
                            "response": " ".join(TOKENS[token] for token in response),
                            "sample": sample, "criterion": criterion(prompt, response),
                            "stop": "EOS" if response[-1] == EOS else "horizon",
                            "malformed": any(token in (PAD, BOS) for token in response),
                            "length": len(response)})
    return {"outputs": outputs, "criterion_count": sum(row["criterion"] for row in outputs),
            "eos_count": sum(row["stop"] == "EOS" for row in outputs),
            "malformed_count": sum(row["malformed"] for row in outputs),
            "mean_length": sum(row["length"] for row in outputs) / len(outputs)}


CONDITIONS = [
    {"name": "mean-margin", "reduction": "mean", "gamma": .4, "chosen_weight": 0.},
    {"name": "mean-zero", "reduction": "mean", "gamma": 0., "chosen_weight": 0.},
    {"name": "sum-margin", "reduction": "sum", "gamma": .4, "chosen_weight": 0.},
    {"name": "mean-margin-nll", "reduction": "mean", "gamma": .4, "chosen_weight": .1},
]


@torch.no_grad()
def evaluate(model, batch, prompts, step, condition, initial_sums):
    model.eval()
    scores = model_scores(model, batch)
    count = len(scores["sums"]) // 2
    objective = {key: condition[key] for key in ("reduction", "gamma", "chosen_weight")}
    loss, objective_gaps, losses = pair_loss(scores["sums"], scores["counts"], count, **objective)
    means = scores["sums"] / scores["counts"]
    mean_gaps = means[:count] - means[count:]
    pairs = [{"index": i, "chosen_sum": scores["sums"][i].item(),
              "rejected_sum": scores["sums"][count + i].item(),
              "chosen_mean": means[i].item(), "rejected_mean": means[count + i].item(),
              "chosen_targets": int(scores["counts"][i]), "rejected_targets": int(scores["counts"][count + i]),
              "mean_gap": mean_gaps[i].item(), "objective_gap": objective_gaps[i].item(),
              "objective_pair_loss": losses[i].item(),
              "chosen_sum_change": (scores["sums"][i] - initial_sums[i]).item(),
              "rejected_sum_change": (scores["sums"][count + i] - initial_sums[count + i]).item()}
             for i in range(count)]
    return {"step": step, "objective": loss.item(), "pairs": pairs,
            "mean_gap": mean_gaps.mean().item(),
            "agreement_ties_half": ((mean_gaps > 0).float() + .5 * (mean_gaps == 0)).mean().item(),
            "generation": generate(model, prompts)}


def continuation(initial, comparisons, prompts, condition, workdir):
    model = copy.deepcopy(initial)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=0)
    batch = comparison_batch(comparisons)
    with torch.no_grad():
        initial_sums = model_scores(initial, batch)["sums"]
    objective = {key: condition[key] for key in ("reduction", "gamma", "chosen_weight")}
    history, checkpoints = [], []
    for step in range(41):
        if step % 10 == 0:
            checkpoints.append(evaluate(model, batch, prompts, step, condition, initial_sums))
        if step == 40:
            break
        model.train()
        scores = model_scores(model, batch)
        loss, _, _ = pair_loss(scores["sums"], scores["counts"], len(comparisons), **objective)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
        history.append({"update": step + 1, "training_loss": loss.item(),
                        "gradient_norm_before_clip": float(norm),
                        "response_targets": int(scores["counts"].sum())})
    torch.save(model.state_dict(), workdir / (condition["name"] + "-final.pt"))
    return {"condition": condition, "initial_weights": digest_model(initial),
            "final_weights": digest_model(model), "history": history, "checkpoints": checkpoints}


def run(workdir):
    torch.set_num_threads(2)
    torch.manual_seed(47)
    workdir.mkdir(parents=True, exist_ok=True)
    if any(workdir.glob("*.pt")):
        raise ValueError("Preserve prior weights; choose a fresh work directory")
    prompts, demonstrations, comparisons = fixture()
    initial = TinyLM(len(TOKENS), context=16, width=32, heads=2, layers=2)
    random_digest = digest_model(initial)
    warm_start = sft(initial, demonstrations)
    initial.eval()
    shared_digest = digest_model(initial)
    torch.save(initial.state_dict(), workdir / "shared-sft-initial.pt")
    reports = [continuation(initial, comparisons, prompts, condition, workdir) for condition in CONDITIONS]
    assert all(report["initial_weights"] == shared_digest for report in reports)
    assert digest_model(initial) == shared_digest
    baseline_pairs = reports[0]["checkpoints"][0]["pairs"]
    for report in reports:
        for actual, expected in zip(report["checkpoints"][0]["pairs"], baseline_pairs):
            assert actual["chosen_sum"] == expected["chosen_sum"]
            assert actual["rejected_sum"] == expected["rejected_sum"]
        assert report["checkpoints"][0]["generation"] == reports[0]["checkpoints"][0]["generation"]
    return {"kind": "constructed training prompts; controlled objective ablations; one seed",
            "torch": torch.__version__, "seed": 47, "tokens": TOKENS,
            "model_parameters": sum(p.numel() for p in initial.parameters()),
            "prompts": prompts, "demonstrations": demonstrations, "comparisons": comparisons,
            "random_weights": random_digest, "shared_sft_weights": shared_digest,
            "sft": warm_start, "methods": reports,
            "settings": {"beta": 2., "sft_updates": 120, "continuation_updates": 40,
                         "comparison": "matched updates and records, not tuned fairness or identical compute",
                         "generation_seed": 947, "path_change": "finite supplied-path log-score differences, not KL"}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("scratch-simpo-results.json"))
    parser.add_argument("--workdir", type=Path, default=Path("scratch-simpo-weights"))
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Refusing to overwrite prior scientific results")
    result = run(args.workdir)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"shared_sft_weights": result["shared_sft_weights"], "methods": [
        {"condition": method["condition"], "checkpoints": [
            {"step": point["step"], "objective": point["objective"],
             "criterion_count": point["generation"]["criterion_count"]}
            for point in method["checkpoints"]]} for method in result["methods"]]}, indent=2))


