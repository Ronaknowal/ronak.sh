"""SimPO's scalar mechanism, a complete probability tree, and shared-mass drift.

python -B simpo_algebra.py --output algebra-results.json
Standard library only. Every value is a constructed mathematical example.
"""
import argparse
import json
import math
from pathlib import Path


def softplus(x):
    return max(x, 0.) + math.log1p(math.exp(-abs(x)))


def sigmoid(x):
    if x >= 0:
        return 1 / (1 + math.exp(-x))
    value = math.exp(x)
    return value / (1 + value)


def pair(gap, beta=2., gamma=.4):
    if beta <= 0 or gamma < 0:
        raise ValueError("beta must be positive and gamma nonnegative")
    z = beta * gap - gamma
    return {"gap": gap, "z": z, "loss": softplus(-z),
            "derivative": -beta * sigmoid(-z), "threshold": gamma / beta}


def probability_tree():
    # The terminating probability-one edge is scored, including on branch C.
    edges = {"A": [.4, 1.], "B1": [.3, .9, 1.],
             "B2": [.3, .1, 1.], "C": [.3, 1.]}
    leaves = []
    for name, transitions in edges.items():
        logp = sum(math.log(value) for value in transitions)
        leaves.append({"name": name, "transitions": transitions, "mass": math.prod(transitions),
                       "sum": logp, "targets": len(transitions), "mean": logp / len(transitions),
                       "geometric_mean": math.exp(logp / len(transitions))})
    return leaves


def probabilities(logits):
    largest = max(logits)
    values = [math.exp(x - largest) for x in logits]
    return [x / sum(values) for x in values]


def drift(coefficient=10., beta=1., gamma=.4, step=.1, chosen_weight=0.):
    # At theta=0 the derivative of log p_A - log p_B is exactly 2.
    preference_derivative = -2 * beta * sigmoid(gamma)
    chosen_nll_derivative = coefficient / 3 - 1
    derivative = preference_derivative + chosen_weight * chosen_nll_derivative
    theta = -step * derivative
    before = [1 / 3] * 3
    after = probabilities([theta, -theta, coefficient * theta])
    return {"coefficient": coefficient, "theta": theta, "before": before, "after": after,
            "gap_before": 0., "gap_after": 2 * theta,
            "preference_derivative": preference_derivative,
            "chosen_nll_derivative": chosen_nll_derivative, "total_derivative": derivative,
            "kl_after_to_before": sum(p * math.log(p / q) for p, q in zip(after, before))}


def repeated_labels(gap, q, beta, gamma):
    if not 0 <= q <= 1:
        raise ValueError("Label frequency must be in [0,1]")
    value = q * softplus(gamma - beta * gap) + (1 - q) * softplus(gamma + beta * gap)
    derivative = beta * ((1 - q) * sigmoid(gamma + beta * gap) - q * sigmoid(gamma - beta * gap))
    return value, derivative


def repeated_optimum(q, beta, gamma):
    if beta <= 0 or gamma < 0 or not 0 <= q <= 1:
        raise ValueError("Invalid objective domain")
    if q in (0., 1.):
        return None  # infimum at a signed infinite gap; no finite minimizer
    left, right = -1., 1.
    while repeated_labels(left, q, beta, gamma)[1] > 0:
        left *= 2
    while repeated_labels(right, q, beta, gamma)[1] < 0:
        right *= 2
    for _ in range(100):
        middle = (left + right) / 2
        if repeated_labels(middle, q, beta, gamma)[1] < 0:
            left = middle
        else:
            right = middle
    return (left + right) / 2


def smoothed(gap, q, beta, gamma):
    z = beta * gap - gamma
    return q * softplus(-z) + (1 - q) * softplus(z)


def run():
    checks = []
    leaves = probability_tree()
    assert math.isclose(sum(row["mass"] for row in leaves), 1)
    assert leaves[0]["sum"] > leaves[1]["sum"] and leaves[0]["mean"] < leaves[1]["mean"]
    assert all(row["transitions"][-1] == 1. for row in leaves)
    checks.extend(["complete leaf mass", "sum/mean rank reversal", "all forced EOS edges"])
    for beta in (.2, 1., 2., 4.):
        for gamma in (0., .4, 2.):
            for gap in (-3., 0., .3, 3.):
                actual = pair(gap, beta, gamma)
                eps = 1e-5
                difference = (pair(gap + eps, beta, gamma)["loss"] - pair(gap - eps, beta, gamma)["loss"]) / (2 * eps)
                assert abs(difference - actual["derivative"]) < 1e-8
                forward, reverse = sigmoid(beta * gap - gamma), sigmoid(-beta * gap - gamma)
                assert abs(forward + reverse - 1) < 1e-12 if gamma == 0 else forward + reverse < 1
                checks.append("pair derivative and oriented links")
            assert math.isclose(pair(gamma / beta, beta, gamma)["loss"], math.log(2))
            assert math.isclose(pair(gamma / beta, beta, gamma)["derivative"], -beta / 2)
            checks.append("threshold is not zero loss or zero derivative")
    for x in (-1000., 1000.):
        assert math.isfinite(softplus(x)) and 0 <= sigmoid(x) <= 1
        checks.append("stable extreme")
    witness = drift()
    assert witness["gap_after"] > 0 and all(witness["after"][i] < 1 / 3 for i in (0, 1))
    assert witness["kl_after_to_before"] > 0 and math.isclose(sum(witness["after"]), 1)
    checks.append("shared parameter improves gap while both compared masses fall")
    optimum = repeated_optimum(.75, 2, .5)
    smooth_optimum = (.5 + math.log(3)) / 2
    assert abs(repeated_labels(optimum, .75, 2, .5)[1]) < 1e-12
    assert abs(optimum - smooth_optimum) > .01
    for gap in (-2., 0., 1.):
        eps = 1e-5
        finite = (repeated_labels(gap + eps, .75, 2, .5)[0] - repeated_labels(gap - eps, .75, 2, .5)[0]) / (2 * eps)
        assert abs(finite - repeated_labels(gap, .75, 2, .5)[1]) < 1e-8
        assert math.isclose(repeated_labels(gap, .75, 2, 0)[0], smoothed(gap, .75, 2, 0))
        checks.append("repeated-label derivative; zero-margin coincidence")
    assert repeated_optimum(1., 2, .5) is None
    return {"kind": "constructed scalar examples; no training", "checks": checks, "tree": leaves,
            "default": pair(.3), "boundary": pair(.2), "drift": witness,
            "auxiliary": [drift(chosen_weight=value) for value in (0., .1, 1.)],
            "practice": {"margin": pair(.2, 3., .9), "drift": drift(6., 1., .2, .05),
                         "opposite_label_optimum": optimum, "smoothing_optimum": smooth_optimum}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("algebra-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": len(result["checks"]), "default": result["default"]}))
