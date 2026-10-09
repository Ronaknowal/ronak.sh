"""Complete token-level DPO and chosen-only continuation on a small causal LM.

python -B scratch_dpo.py --output scratch-dpo-results.json
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


def frozen_copy(model):
    reference = copy.deepcopy(model).eval()
    for parameter in reference.parameters():
        parameter.requires_grad_(False)
        parameter.grad = None
    return reference


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
    generator = torch.Generator().manual_seed(941)
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


@torch.no_grad()
def evaluate(model, reference_scores, batch, comparisons, prompts, step):
    scores = model_scores(model, batch)
    loss, margins, losses = pair_loss(scores["sums"], reference_scores, len(comparisons))
    n = len(comparisons)
    pairs = [{"index": i, "chosen_logp": scores["sums"][i].item(),
              "rejected_logp": scores["sums"][n + i].item(),
              "reference_chosen_logp": reference_scores[i].item(),
              "reference_rejected_logp": reference_scores[n + i].item(),
              "chosen_targets": int(scores["counts"][i]),
              "rejected_targets": int(scores["counts"][n + i]),
              "margin": margins[i].item(), "loss": losses[i].item()}
             for i in range(n)]
    return {"step": step, "pair_loss": loss.item(), "pairs": pairs,
            "mean_relative_margin": margins.mean().item(),
            "pair_agreement_ties_half": ((margins > 0).float() + .5 * (margins == 0)).mean().item(),
            "generation": generate(model, prompts)}


def continuation(initial, reference, comparisons, prompts, method):
    model = copy.deepcopy(initial)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=0)
    batch = comparison_batch(comparisons)
    with torch.no_grad():
        reference_scores = model_scores(reference, batch)["sums"]
    chosen_batch = {key: value[:len(comparisons)] for key, value in batch.items()}
    history, checkpoints = [], []
    for step in range(41):
        if step % 10 == 0:
            checkpoints.append(evaluate(model, reference_scores, batch, comparisons, prompts, step))
        if step == 40:
            break
        model.train()
        if method == "DPO":
            scores = model_scores(model, batch)
            loss, _, _ = pair_loss(scores["sums"], reference_scores, len(comparisons))
        elif method == "chosen-only":
            scores = model_scores(model, chosen_batch)
            loss = -scores["sums"].sum() / scores["counts"].sum()
        else:
            raise ValueError("Unknown continuation")
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
        history.append({"update": step + 1, "training_loss": loss.item(),
                        "gradient_norm_before_clip": float(norm),
                        "policy_response_targets": int(scores["counts"].sum())})
    return {"method": method, "checkpoints": checkpoints, "history": history,
            "initial_weights": digest_model(initial), "final_weights": digest_model(model),
            "reference_weights_after": digest_model(reference),
            "forward_roles": "both policy responses; frozen reference sums reused" if method == "DPO"
            else "chosen policy responses only"}


def run():
    torch.set_num_threads(2)
    torch.manual_seed(41)
    prompts, demonstrations, comparisons = fixture()
    initial = TinyLM(len(TOKENS), context=16, width=32, heads=2, layers=2)
    warm_start = sft(initial, demonstrations)
    reference = frozen_copy(initial)
    reference_hash = digest_model(reference)
    reports = []
    for method in ("DPO", "chosen-only"):
        reports.append(continuation(initial, reference, comparisons, prompts, method))
        assert digest_model(reference) == reference_hash
    assert all(parameter.grad is None for parameter in reference.parameters())
    for report in reports:
        assert report["initial_weights"] == reference_hash
        assert report["final_weights"] != reference_hash
        assert all(pair["margin"] == 0 for pair in report["checkpoints"][0]["pairs"])
    return {"kind": "constructed training prompts; no held-out generalization claim",
            "tokens": TOKENS, "torch": torch.__version__, "seed": 41,
            "model_parameters": sum(parameter.numel() for parameter in initial.parameters()),
            "prompts": prompts, "demonstrations": demonstrations, "comparisons": comparisons,
            "sft": warm_start, "reference_weights": reference_hash, "methods": reports,
            "settings": {"beta": .2, "SFT_updates": 120, "continuation_updates": 40,
                         "pair_reduction": "mean of response-sum DPO losses",
                         "chosen_reduction": "mean over genuine chosen response targets",
                         "comparison": "matched updates, not compute or token budget"}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("scratch-dpo-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"reference_weights": result["reference_weights"],
                      "methods": [{"method": row["method"], "checkpoints": [
                          {"step": point["step"], "pair_loss": point["pair_loss"],
                           "criterion_count": point["generation"]["criterion_count"]}
                          for point in row["checkpoints"]]} for row in result["methods"]]}, indent=2))


if __name__ == "__main__":
    main()
