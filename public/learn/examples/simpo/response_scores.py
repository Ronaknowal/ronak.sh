"""Causal response scores with separate visibility and supervision masks.

python -B response_scores.py --output response-scores-results.json
Requires torch. No fitting, downloading or model-specific tokenizer assumptions.
"""
import argparse
import json
from pathlib import Path
import torch
import torch.nn.functional as F
from causal_backbone import TinyLM


def pack(prompts, responses, pad_id=0, maximum=None):
    if len(prompts) != len(responses) or not prompts:
        raise ValueError("Need matched nonempty prompt/response lists")
    if any(not prompt or not response for prompt, response in zip(prompts, responses)):
        raise ValueError("Every row needs context and at least one response target")
    lengths = [len(prompt) + len(response) for prompt, response in zip(prompts, responses)]
    width = max(lengths)
    if maximum is not None and width > maximum:
        raise ValueError("A whole sequence exceeds context; reject its pair before packing")
    ids = torch.full((len(prompts), width), pad_id, dtype=torch.long)
    attention = torch.zeros_like(ids, dtype=torch.bool)
    completion = torch.zeros_like(ids, dtype=torch.bool)
    for i, (prompt, response) in enumerate(zip(prompts, responses)):
        sequence = prompt + response
        ids[i, :len(sequence)] = torch.tensor(sequence)
        attention[i, :len(sequence)] = True
        completion[i, len(prompt):len(sequence)] = True
    return {"input_ids": ids, "attention_mask": attention, "completion_mask": completion}


def response_scores(logits, input_ids, attention_mask, completion_mask):
    """Logit at t predicts token t+1. Shift masks once, with the targets."""
    if logits.shape[:2] != input_ids.shape or input_ids.shape != attention_mask.shape:
        raise ValueError("Logits, IDs and attention positions must agree")
    if completion_mask.shape != input_ids.shape:
        raise ValueError("Completion mask positions must match IDs")
    attention = attention_mask.bool()
    completion = completion_mask.bool()
    if torch.any(completion & ~attention):
        raise ValueError("A supervised target cannot be padding")
    if torch.any(completion[:, 0]):
        raise ValueError("The first token has no preceding predictor")
    valid = completion[:, 1:] & attention[:, 1:] & attention[:, :-1]
    counts = valid.sum(-1)
    if torch.any(counts == 0):
        raise ValueError("Each response needs at least one causally scored target")
    selected = logits[:, :-1].log_softmax(-1).gather(-1, input_ids[:, 1:, None]).squeeze(-1)
    return {"tokens": selected, "valid": valid, "counts": counts,
            "sums": selected.masked_fill(~valid, 0).sum(-1)}


def pair_loss(sums, counts, pair_count, beta=2., gamma=.4, reduction="mean", chosen_weight=0.):
    """Rows: all chosen, then all rejected; pair mean plus optional chosen token NLL."""
    if beta <= 0 or gamma < 0 or chosen_weight < 0 or pair_count <= 0:
        raise ValueError("Need positive beta/pair count and nonnegative gamma/NLL weight")
    if sums.ndim != 1 or sums.shape != counts.shape or len(sums) != 2 * pair_count:
        raise ValueError("Need equally shaped chosen-first sum and count vectors")
    if torch.any(counts <= 0):
        raise ValueError("Every response needs at least one genuine target")
    if reduction not in ("mean", "sum"):
        raise ValueError("Reduction must be mean or sum")
    scores = sums / counts if reduction == "mean" else sums
    gaps = scores[:pair_count] - scores[pair_count:]
    losses = F.softplus(gamma - beta * gaps)
    chosen_nll = -sums[:pair_count].sum() / counts[:pair_count].sum()
    return losses.mean() + chosen_weight * chosen_nll, gaps, losses


def boundary(encode, prompt, response, eos_id, maximum):
    """Reject an unstable string boundary, rather than invent target ownership."""
    prefix = encode(prompt)
    full = encode(prompt + response)
    if not prefix or full[:len(prefix)] != prefix:
        raise ValueError("Prompt tokenization changes at the response boundary")
    suffix = full[len(prefix):]
    if not suffix:
        raise ValueError("The response has no content tokens")
    if eos_id in suffix:
        raise ValueError("This plain-text route reserves EOS for the appended stop token")
    suffix = suffix + [eos_id]
    if len(prefix) + len(suffix) > maximum:
        raise ValueError("Whole pair member exceeds the context budget")
    return prefix, suffix


def run():
    torch.manual_seed(17)
    prompts, responses = [[1, 3, 5], [1]], [[7, 2], [8, 9, 2]]
    batch = pack(prompts, responses, pad_id=2)
    logits = torch.randn(2, 5, 13, dtype=torch.float64, requires_grad=True)
    scores = response_scores(logits, **batch)
    checks = []
    assert scores["counts"].tolist() == [2, 3]
    checks.append("all genuine response targets including EOS")
    for i, (prompt, response) in enumerate(zip(prompts, responses)):
        manual = sum(logits[i, len(prompt) + j - 1].log_softmax(-1)[token]
                     for j, token in enumerate(response))
        assert torch.allclose(manual, scores["sums"][i], atol=1e-12)
        single = pack([prompt], [response], pad_id=2)
        actual = response_scores(logits[i:i + 1, :single["input_ids"].shape[1]], **single)
        assert torch.allclose(actual["sums"][0], manual, atol=1e-12)
    checks.extend(["explicit first-response predictor", "single and batched sums agree"])
    extended = {key: F.pad(value, (0, 3), value=2 if key == "input_ids" else 0)
                for key, value in batch.items()}
    extra_logits = torch.cat((logits, torch.randn(2, 3, 13, dtype=torch.float64)), dim=1)
    padded = response_scores(extra_logits, **extended)
    assert torch.allclose(padded["sums"], scores["sums"], atol=1e-12, rtol=0)
    checks.append("added padding leaves genuine EOS scores intact when PAD equals EOS")
    (-scores["sums"].mean()).backward()
    assert torch.all(logits.grad[:, -1] == 0)
    for i in range(2):
        assert torch.all(logits.grad[i, :-1][~scores["valid"][i]] == 0)
    checks.append("unselected predictor coordinates have zero direct loss derivative")
    failures = [lambda: pack([[1]], [[]]), lambda: pack([[1, 2]], [[3]], maximum=2),
                lambda: response_scores(logits.detach(), batch["input_ids"], batch["attention_mask"],
                                        torch.zeros_like(batch["completion_mask"]))]
    for operation in failures:
        try:
            operation()
        except ValueError:
            checks.append("invalid or missing target rejected")
        else:
            raise AssertionError("Invalid input accepted")
    # This tiny explicit tokenizer joins 'a'+'b' into a single vocabulary item.
    encode = lambda text: {"a": [3], "ab": [4]}[text]
    try:
        boundary(encode, "a", "b", 2, 8)
    except ValueError:
        checks.append("merged boundary rejected")
    else:
        raise AssertionError("Unstable boundary accepted")
    sums = torch.tensor([-2., -3., -4., -4.], dtype=torch.float64, requires_grad=True)
    counts = torch.tensor([2, 3, 4, 2])
    loss, margins, losses = pair_loss(sums, counts, 2)
    loss.backward()
    expected = 2 * torch.sigmoid(.4 - 2 * margins) / 2
    assert torch.allclose(sums.grad[:2], -expected / counts[:2])
    assert torch.allclose(sums.grad[2:], expected / counts[2:])
    checks.append("mean-pair and mean-target coordinate gradients")
    permutation = torch.tensor([1, 0])
    reordered = {key: value[permutation] for key, value in batch.items()}
    again = response_scores(logits.detach()[permutation], **reordered)
    assert torch.equal(again["counts"], scores["counts"][permutation])
    assert torch.equal(again["sums"], scores["sums"][permutation])
    checks.append("row reordering changes only output order")
    # A real contextual decoder connects ignored prompt targets to response loss.
    torch.manual_seed(17)
    decoder = TinyLM(13, context=16, width=32, heads=2, layers=2).double().eval()
    context_batch = pack([[1, 3, 5]], [[7, 2]], pad_id=2)
    context_logits = decoder(context_batch["input_ids"])
    context_scores = response_scores(context_logits, **context_batch)
    first_target_nll = -context_scores["tokens"][0, 2]
    decoder.zero_grad(set_to_none=True)
    first_target_nll.backward()
    # Inspect the actual named embedding parameter, without assuming its module name.
    embeddings = [(name, parameter) for name, parameter in decoder.named_parameters()
                  if parameter.shape == (13, 32)]
    embedding_name, embedding = next((name, value) for name, value in embeddings if "token" in name)
    prompt_norms = {str(token): embedding.grad[token].norm().item() for token in (1, 3, 5)}
    assert all(value > 0 for value in prompt_norms.values())
    prefix_logits = decoder(torch.tensor([[1, 3, 5]]))
    assert torch.allclose(prefix_logits[0, 2], context_logits[0, 2], atol=1e-12, rtol=0)
    checks.extend(["prompt embeddings receive response-loss gradients", "first target predictor cannot see future tokens"])
    return {"kind": "constructed causal mask and reduction checks", "checks": checks,
            "batch": {key: value.tolist() for key, value in batch.items()},
            "token_logps": scores["tokens"].tolist(), "response_sums": scores["sums"].tolist(),
            "valid": scores["valid"].tolist(), "pair_margins": margins.tolist(),
            "pair_losses": losses.tolist(), "loss": loss.item(),
            "shared_context": {"embedding_parameter": embedding_name, "prompt_embedding_gradient_norms": prompt_norms,
                               "first_target_nll": first_target_nll.item(),
                               "first_target": 7, "predictor_position": 2, "target_position": 3}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("response-scores-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": len(result["checks"]), "response_sums": result["response_sums"]}))


if __name__ == "__main__":
    main()
