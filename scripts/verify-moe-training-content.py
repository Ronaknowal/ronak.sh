"""Complementary content arithmetic, finite differences and frozen-study audit.

No fitting. Existing Torch comparisons and recorded scientific outputs are reused.
"""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

import numpy as np
from scipy.stats import binom

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / "public/learn-code/moe-training"
RECORD = ROOT / "docs/teaching/llm-architecture-training/moe-training-expert-load-balancing"
sys.path.insert(0, str(CODE))
from moe_mechanisms import (
    backward, balance, binomial_capacity, forward, gate_backward,
    initial_parameters, routes, softmax, topk, z_loss,
)
from moe_language_study import PROTOCOL, evaluate, examples, train_gradient


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    checks = []

    def check(name, actual, expected, tolerance=1e-10):
        np.testing.assert_allclose(actual, expected, atol=tolerance, rtol=tolerance)
        checks.append({"name": name, "max_error": float(np.max(np.abs(np.asarray(actual) - expected)))})

    # Independently differentiate a scalar objective, including partially rejected
    # denominators. All arrays use strict, checked selection/capacity identities.
    rng = np.random.default_rng(79)
    parameters = initial_parameters(rng, experts=3, width=2, hidden=2)
    x = rng.normal(size=(4, 2))
    direction = rng.normal(size=x.shape)
    epsilon = 1e-6
    for kind in ["softmax", "full", "sigmoid"]:
        y, cache = forward(x, parameters, 2, kind, capacity=1)
        dx, gradients, _ = backward(direction, parameters, cache, .07, .004)

        def objective(values, inputs):
            output, state = forward(inputs, values, 2, kind, capacity=1)
            assert np.array_equal(state["ids"], cache["ids"])
            assert np.array_equal(state["accepted"], cache["accepted"])
            auxiliary = balance(state["logits"], state["ids"], kind)[0]
            z = z_loss(state["logits"])[0]
            return (output * direction).sum() + .07 * auxiliary + .004 * z

        for name, value in list(parameters.items()) + [("input", x)]:
            numerical = np.zeros_like(value)
            for index in np.ndindex(value.shape):
                original = value[index]
                value[index] = original + epsilon
                plus = objective(parameters, x)
                value[index] = original - epsilon
                minus = objective(parameters, x)
                value[index] = original
                numerical[index] = (plus - minus) / (2 * epsilon)
            check(kind + " capacity finite-difference " + name,
                  numerical, dx if name == "input" else gradients[name], 2e-8)

    scores, ids, gates = routes(np.log([[4., 2., 1.]]), 2)
    state = {"scores": scores, "ids": ids, "gates": gates, "kind": "softmax"}
    check("partial selected-but-rejected credit", gate_backward(state, np.array([[0., 3.]])), [[-2/3, 2/3, 0]])
    check("fully rejected task credit", gate_backward(state, np.zeros((1, 2))), [[0, 0, 0]])
    check("equal returned vectors task null", gate_backward(state, np.array([[7., 7.]])), [[0, 0, 0]])
    check("SwiGLU identity fixture", np.array([1., 2.]) ** 2 / (1 + np.exp(-np.array([1., 2.]))),
          [.7310585786300049, 3.5231883119115297])
    rows = np.log([[.6, .3, .1], [.5, .4, .1], [.2, .7, .1], [.1, .2, .7]])
    check("worked balance scalar", balance(rows, topk(rows, 1))[0], 1.0125)
    for last, expected in [([.001, .999], .88275), ([.1, .9], .9075)]:
        rows = np.log([[.51, .49]] * 3 + [last])
        check("counterexample " + str(expected), balance(rows, topk(rows, 1))[0], expected)
    for capacity in [128, 144, 151]:
        result = binomial_capacity(512, 8, 2, capacity)
        check("binomial event " + str(capacity), result["overflow_probability"], binom.sf(capacity, 512, .25))
        n = np.arange(513)
        loss = np.sum(np.maximum(n - capacity, 0) * binom.pmf(n, 512, .25)) / 128
        check("binomial lost fraction " + str(capacity), result["expected_rejected_fraction"], loss)
    for threshold, expected in [(.05, 144), (.01, 151)]:
        capacity = next(c for c in range(513) if binom.sf(c, 512, .25) < threshold)
        check("minimal capacity " + str(threshold), capacity, expected)
    logits = np.log([[.99, .01]])
    check("z concentrated null", z_loss(logits)[0], 0)
    check("z shifted", z_loss(logits + 2)[0], 4)
    check("z shift probabilities", softmax(logits + 2), softmax(logits))
    check("empty group mean", balance(np.zeros((2, 3)), np.array([[0], [1]]), valid=[False, False])[0], 0)

    # Practice arithmetic independently formed from the stated arrays.
    returned = np.array([[1., 2.], [4., 0.]])
    check("practice A normalized", np.array([.6, .4]) @ returned, [2.2, 1.2])
    check("practice A full", np.array([.5, 1/3]) @ returned, [11/6, 1])
    check("practice E gradient", 2*np.array([.8, .2])*(np.array([1., 0.]) - .8), [.32, -.32])
    check("practice I stored", 6*3*24*12, 5184)
    check("practice I active", 2*3*24*12, 1728)
    check("practice I router", 24*16, 384)
    check("practice J allocated", ((np.array([3, 2, 1, 2]) + 1)//2)*2, [4, 2, 2, 2])

    study = json.loads((RECORD / "research/study/study.json").read_text(encoding="utf8"))
    assert study["protocol"] == PROTOCOL
    assert len(study["runs"]) == 12
    for name, expected in study["sources"].items():
        assert digest(CODE / name) == expected, name
    schedules = {}
    for run in study["runs"]:
        schedules.setdefault(run["seed"], set()).add(run["schedule_sha256"])
        assert len(run["history"]) == 5
        assert run["training_target_presentations"] == 25600
        for checkpoint in run["history"]:
            value = checkpoint["heldout"]
            check(f"NLL denominator {run['seed']} {run['policy']} {checkpoint['step']}",
                  value["nll_sum"] / value["targets"], value["nll"])
            k = 1 if run["policy"] == "dense" else 2
            assert sum(value["counts"]) == k * value["targets"]
            check("gate mass", sum(value["gate_mass"]), value["targets"])
    assert all(len(value) == 1 for value in schedules.values())
    saved = json.loads((RECORD / "research/study/model.json").read_text(encoding="utf8"))
    model = {key: np.array(value) for key, value in saved["parameters"].items()}
    bias = np.array(saved["bias"])
    contexts, targets, locations = examples(CODE / "alice-heldout.txt")
    assert contexts.tolist() == saved["heldout_contexts"]
    assert targets.tolist() == saved["heldout_targets"]
    assert locations == saved["heldout_locations"]
    # A read-only reload, not a fit; no saved output is overwritten.
    check("frozen saved model reload", evaluate(model, contexts, targets, bias)["nll"], saved["reference"]["nll"])
    for name, actual in [("embedding", 2056), ("head", 8192), ("head_bias", 256)]:
        check("parameter count " + name, model[name].size, actual)

    # Full-model gradient spot checks protect embedding repetition, residual and
    # head loss reductions without replaying any training campaign.
    small_x, small_y = contexts[:5], targets[:5]
    _, gradients, _, _ = train_gradient(model, small_x, small_y, bias, .05)

    def full_objective():
        task, _, _, terms = train_gradient(model, small_x, small_y, bias, .05)
        return task + .05 * terms["balance"]

    for name, array in model.items():
        indices = [tuple(0 for _ in array.shape), np.unravel_index(np.argmax(np.abs(gradients[name])), array.shape)]
        for index in indices:
            original = array[index]
            array[index] = original + epsilon
            plus = full_objective()
            array[index] = original - epsilon
            minus = full_objective()
            array[index] = original
            check("full-model gradient " + name + str(index), (plus-minus)/(2*epsilon), gradients[name][index], 2e-7)

    report = {
        "mode": "read-only frozen study audit, no fitting",
        "checks": checks,
        "check_count": len(checks),
        "study_sha256": digest(RECORD / "research/study/study.json"),
        "saved_model_sha256": digest(RECORD / "research/study/model.json"),
        "sources": {path.name: digest(path) for path in CODE.glob("*.py")},
        "manuscript_sha256": digest(RECORD / "lesson.md"),
        "reused_torch_parity_sha256": digest(RECORD / "research/torch-parity.json"),
        "transformers_native_sha256": digest(RECORD / "research/transformers-native/report.json"),
        "systems_native_sha256": digest(RECORD / "research/systems-native.json"),
    }
    target = RECORD / "content-verification.json"
    if target.exists():
        raise FileExistsError("Preserve the existing content receipt before a changed verification")
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"checks": len(checks), "report": str(target)}))


if __name__ == "__main__":
    main()
