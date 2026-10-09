"""An input prompt and a KV prefix, with a complete manual attention backward.

Run: python soft_attention.py --output attention.json
Requires NumPy and PyTorch. Fixed instructional values; no pretrained fit.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import torch


QUERY = np.array([0.6, -0.2], dtype=np.float64)
REAL = np.array([[0.4, 0.7], [-0.3, 0.5]], dtype=np.float64)
PROMPT = np.array([[0.2, -0.4], [0.5, 0.1]], dtype=np.float64)
WK = np.array([[0.8, -0.3], [0.2, 0.6]], dtype=np.float64)
WV = np.array([[0.7, 0.1], [-0.4, 0.9]], dtype=np.float64)
HEAD = np.array([[0.9, -0.5], [0.3, 0.8]], dtype=np.float64)


def softmax(values):
    shifted = values - np.max(values, axis=-1, keepdims=True)
    weights = np.exp(shifted)
    return weights / weights.sum(axis=-1, keepdims=True)


def forward_backward(prefix_key, prefix_value, target=1):
    """One fixed real query. Prefix rows have no query path in this fixture."""
    if prefix_key.shape != prefix_value.shape or prefix_key.shape[1] != 2:
        raise ValueError("Prefix K and V must both have shape (m,2)")
    keys = np.concatenate([prefix_key, REAL @ WK], axis=0)
    values = np.concatenate([prefix_value, REAL @ WV], axis=0)
    scores = QUERY @ keys.T / np.sqrt(2.0)
    attention = softmax(scores)
    output = attention @ values
    logits = output @ HEAD
    probabilities = softmax(logits)
    shifted = logits - logits.max()
    loss = -shifted[target] + np.log(np.exp(shifted).sum())

    d_logits = probabilities.copy()
    d_logits[target] -= 1.0
    d_output = d_logits @ HEAD.T
    d_values = attention[:, None] * d_output[None, :]
    d_attention = values @ d_output
    d_scores = attention * (d_attention - attention @ d_attention)
    d_keys = d_scores[:, None] * QUERY[None, :] / np.sqrt(2.0)
    count = len(prefix_key)
    return {
        "loss": float(loss), "keys": keys, "values": values,
        "scores": scores, "attention": attention, "output": output,
        "logits": logits, "probabilities": probabilities,
        "d_logits": d_logits, "d_output": d_output,
        "d_attention": d_attention, "d_scores": d_scores,
        "d_key": d_keys[:count], "d_value": d_values[:count],
    }


def input_prompt(prompt, target=1):
    result = forward_backward(prompt @ WK, prompt @ WV, target)
    result["d_prompt_key_path"] = result["d_key"] @ WK.T
    result["d_prompt_value_path"] = result["d_value"] @ WV.T
    result["d_prompt"] = result["d_prompt_key_path"] + result["d_prompt_value_path"]
    return result


def differences(function, value, epsilon=1e-6):
    result = np.empty_like(value)
    for index in np.ndindex(value.shape):
        plus, minus = value.copy(), value.copy()
        plus[index] += epsilon
        minus[index] -= epsilon
        result[index] = (function(plus) - function(minus)) / (2 * epsilon)
    return result


def torch_route(prompt=None, prefix_key=None, prefix_value=None, target=1):
    fixed = lambda value: torch.tensor(value, dtype=torch.float64)
    if prompt is not None:
        prefix_key = prompt @ fixed(WK)
        prefix_value = prompt @ fixed(WV)
    keys = torch.cat([prefix_key, fixed(REAL @ WK)])
    values = torch.cat([prefix_value, fixed(REAL @ WV)])
    attention = (fixed(QUERY) @ keys.T / np.sqrt(2.0)).softmax(-1)
    logits = attention @ values @ fixed(HEAD)
    loss = torch.nn.functional.cross_entropy(logits[None], torch.tensor([target]))
    return loss, logits


def verify():
    checks = []
    reports = []
    for target in (0, 1):
        manual = input_prompt(PROMPT, target)
        finite = differences(lambda p: input_prompt(p, target)["loss"], PROMPT)
        np.testing.assert_allclose(manual["d_prompt"], finite, atol=2e-10)
        parameter = torch.tensor(PROMPT, dtype=torch.float64, requires_grad=True)
        loss, logits = torch_route(prompt=parameter, target=target)
        loss.backward()
        np.testing.assert_allclose(parameter.grad.numpy(), manual["d_prompt"], atol=1e-14)
        np.testing.assert_allclose(logits.detach().numpy(), manual["logits"], atol=1e-14)
        np.testing.assert_allclose(float(loss.detach()), manual["loss"], atol=1e-14)
        key, value = PROMPT @ WK, PROMPT @ WV
        for field, current in (("d_key", key), ("d_value", value)):
            function = (lambda x: forward_backward(x, value, target)["loss"]) if field == "d_key" else (
                lambda x: forward_backward(key, x, target)["loss"])
            np.testing.assert_allclose(differences(function, current), manual[field], atol=2e-10)
        k = torch.tensor(key, dtype=torch.float64, requires_grad=True)
        v = torch.tensor(value, dtype=torch.float64, requires_grad=True)
        kv_loss, _ = torch_route(prefix_key=k, prefix_value=v, target=target)
        kv_loss.backward()
        np.testing.assert_allclose(k.grad.numpy(), manual["d_key"], atol=1e-14)
        np.testing.assert_allclose(v.grad.numpy(), manual["d_value"], atol=1e-14)
        updated = PROMPT - 0.2 * manual["d_prompt"]
        assert input_prompt(updated, target)["loss"] < manual["loss"]
        assert np.array_equal(PROMPT - 0 * manual["d_prompt"], PROMPT)
        reports.append({"target": target, "before": manual,
                        "updated_prompt": updated, "after_loss": input_prompt(updated, target)["loss"]})
        checks.append(f"target{target}: all12 prompt/K/V finite differences and Torch gradients; update/null")
    absent = forward_backward(np.empty((0, 2)), np.empty((0, 2)))
    zeros = forward_backward(np.zeros((2, 2)), np.zeros((2, 2)))
    assert not np.allclose(absent["output"], zeros["output"])
    assert np.allclose(zeros["output"], absent["output"] * zeros["attention"][2:].sum())
    return {"kind": "constructed float64 mechanism", "checks": checks,
            "fixture": {"query": QUERY, "real": REAL, "prompt": PROMPT, "WK": WK, "WV": WV, "head": HEAD},
            "input_cases": reports, "absent": absent, "zero_prefix": zeros}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = json.dumps(verify(), indent=2, default=lambda value: value.tolist())
    if args.output:
        args.output.write_text(result + "\n", encoding="utf-8")
    print(result)


if __name__ == "__main__":
    main()
