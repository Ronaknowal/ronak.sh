"""Causal response scores with separate visibility and supervision masks.

python -B response_scores.py --output response-scores-results.json
Requires torch. No fitting, downloading or model-specific tokenizer assumptions.
"""
import argparse
import json
from pathlib import Path
import torch
import torch.nn.functional as F


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


def pair_loss(policy, reference, pair_count, beta=.2):
    """Rows are all chosen responses followed by all rejected responses."""
    if beta <= 0 or pair_count <= 0 or len(policy) != 2 * pair_count or policy.shape != reference.shape:
        raise ValueError("Need positive beta and matched chosen/rejected score vectors")
    gain = policy - reference.detach()
    margin = gain[:pair_count] - gain[pair_count:]
    losses = F.softplus(-beta * margin)
    return losses.mean(), margin, losses


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
    policy = torch.tensor([-2., -3., -4., -4.], dtype=torch.float64, requires_grad=True)
    reference = torch.tensor([-2.5, -3.5, -3., -4.], dtype=torch.float64, requires_grad=True)
    loss, margins, losses = pair_loss(policy, reference, 2)
    loss.backward()
    expected = .2 * torch.sigmoid(-.2 * margins) / 2
    assert torch.allclose(policy.grad[:2], -expected)
    assert torch.allclose(policy.grad[2:], expected)
    assert reference.grad is None
    checks.append("mean-pair coordinate gradients and reference stop-gradient")
    return {"kind": "constructed causal mask and reduction checks", "checks": checks,
            "batch": {key: value.tolist() for key, value in batch.items()},
            "token_logps": scores["tokens"].tolist(), "response_sums": scores["sums"].tolist(),
            "valid": scores["valid"].tolist(), "pair_margins": margins.tolist(),
            "pair_losses": losses.tolist(), "loss": loss.item()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("response-scores-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": len(result["checks"]), "response_sums": result["response_sums"]}))


if __name__ == "__main__":
    main()
