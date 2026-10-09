"""DPO's exact calculations, from four log probabilities to shared parameters.

python -B dpo_algebra.py --output algebra-results.json
Standard library only. All examples are constructed, not measured human outcomes.
"""
import argparse
import json
import math
from pathlib import Path


def sigmoid(value):
    if value >= 0:
        return 1.0 / (1.0 + math.exp(-value))
    exponential = math.exp(value)
    return exponential / (1.0 + exponential)


def softplus(value):
    return max(value, 0.0) + math.log1p(math.exp(-abs(value)))


def logsumexp(values):
    maximum = max(values)
    return maximum + math.log(sum(math.exp(value - maximum) for value in values))


def distribution(values):
    if not values or any(not math.isfinite(value) or value < 0 for value in values):
        raise ValueError("Probabilities must be finite, nonnegative and nonempty")
    if not math.isclose(sum(values), 1.0, abs_tol=1e-12):
        raise ValueError("Probabilities must sum to one")


def dpo(policy_chosen, policy_rejected, reference_chosen, reference_rejected, beta):
    if beta <= 0 or not math.isfinite(beta):
        raise ValueError("DPO beta must be positive and finite")
    scores = (policy_chosen, policy_rejected, reference_chosen, reference_rejected)
    if any(not math.isfinite(value) or value > 0 for value in scores):
        raise ValueError("Supply finite log probabilities, each at most zero")
    for first, second in ((policy_chosen, policy_rejected), (reference_chosen, reference_rejected)):
        if math.exp(first) + math.exp(second) > 1.0 + 1e-12:
            raise ValueError("The two distinct completions cannot have total probability above one")
    chosen_gain = policy_chosen - reference_chosen
    rejected_gain = policy_rejected - reference_rejected
    margin = chosen_gain - rejected_gain
    logit = beta * margin
    weight = beta * sigmoid(-logit)
    return {
        "chosen_gain": chosen_gain,
        "rejected_gain": rejected_gain,
        "relative_margin": margin,
        "logit": logit,
        "preference_probability": sigmoid(logit),
        "loss": softplus(-logit),
        "partial_policy_chosen": -weight,
        "partial_policy_rejected": weight,
    }


def tilted(reference, rewards, beta):
    distribution(reference)
    if len(reference) != len(rewards) or beta <= 0:
        raise ValueError("Match reward/reference shapes and use beta > 0")
    if not math.isfinite(beta) or any(not math.isfinite(value) for value in rewards):
        raise ValueError("Use finite beta and rewards")
    active = [i for i, probability in enumerate(reference) if probability > 0]
    logits = [math.log(reference[i]) + rewards[i] / beta for i in active]
    normalizer = logsumexp(logits)
    policy = [0.0] * len(reference)
    for index, value in zip(active, logits):
        policy[index] = math.exp(value - normalizer)
    return {"policy": policy, "log_normalizer": normalizer}


def kl(policy, reference):
    distribution(policy)
    distribution(reference)
    if len(policy) != len(reference):
        raise ValueError("Distribution shapes differ")
    if any(p > 0 and q == 0 for p, q in zip(policy, reference)):
        return math.inf
    return sum(p * math.log(p / q) for p, q in zip(policy, reference) if p > 0)


def objective(policy, reference, rewards, beta):
    if len(policy) != len(rewards):
        raise ValueError("Reward shape differs")
    return sum(p * reward for p, reward in zip(policy, rewards)) - beta * kl(policy, reference)


def shared_step(coefficients=(1.0, -1.0, 10.0), theta=0.0, beta=1.0, rate=.1):
    """A deliberately tied parameter; these are not three independent logits."""
    def policy(value):
        logits = [coefficient * value for coefficient in coefficients]
        normalizer = logsumexp(logits)
        return [math.exp(logit - normalizer) for logit in logits]

    before = policy(theta)
    reference = [1 / 3] * 3
    before_loss = dpo(math.log(before[0]), math.log(before[1]),
                      math.log(reference[0]), math.log(reference[1]), beta)
    derivative = before_loss["partial_policy_chosen"] * (coefficients[0] - coefficients[1])
    next_theta = theta - rate * derivative
    after = policy(next_theta)
    after_loss = dpo(math.log(after[0]), math.log(after[1]),
                     math.log(reference[0]), math.log(reference[1]), beta)
    return {"coefficients": coefficients, "theta": theta, "next_theta": next_theta,
            "gradient": derivative, "before": before, "after": after,
            "before_loss": before_loss, "after_loss": after_loss}


def label_loss(logit, chosen_fraction):
    if not 0 <= chosen_fraction <= 1:
        raise ValueError("A label fraction must be in [0, 1]")
    return chosen_fraction * softplus(-logit) + (1 - chosen_fraction) * softplus(logit)


def label_optimum(wins, losses):
    if wins < 0 or losses < 0 or wins + losses == 0:
        raise ValueError("Need nonnegative counts and at least one label")
    if wins == 0 or losses == 0:
        return {"fraction": wins / (wins + losses), "finite_logit": None,
                "limit": "negative infinity" if wins == 0 else "positive infinity"}
    return {"fraction": wins / (wins + losses), "finite_logit": math.log(wins / losses)}


def finite_difference(function, value, step=1e-5):
    return (function(value + step) - function(value - step)) / (2 * step)


def run():
    checks = []

    def near(name, actual, expected, tolerance=1e-9):
        assert abs(actual - expected) <= tolerance, (name, actual, expected)
        checks.append(name)

    example = dpo(-2, -4, -3, -3.5, .4)
    near("relative margin", example["relative_margin"], 1.5)
    near("logit", example["logit"], .6)
    for position in (0, 1):
        scores = [-2.0, -4.0, -3.0, -3.5]
        def loss(value):
            modified = scores.copy()
            modified[position] = value
            return dpo(*modified, .4)["loss"]
        field = "partial_policy_chosen" if position == 0 else "partial_policy_rejected"
        near("finite-difference " + field, finite_difference(loss, scores[position]), example[field])
    for margin in (-1000.0, 0.0, 1000.0):
        value = softplus(-margin)
        assert math.isfinite(value)
        checks.append("stable loss at logit " + str(margin))
    null = dpo(-2, -3, -2, -3, .4)
    near("reference null", null["loss"], math.log(2))
    reference, rewards, beta = [.5, .3, .2], [1., 0., -1.], 1.
    optimum = tilted(reference, rewards, beta)
    shifted = tilted(reference, [reward + 3 for reward in rewards], beta)
    scaled = tilted(reference, [reward * 2 for reward in rewards], beta * 2)
    for i, value in enumerate(optimum["policy"]):
        near("reward shift " + str(i), shifted["policy"][i], value)
        near("reward/beta scale " + str(i), scaled["policy"][i], value)
    candidate = [.2, .5, .3]
    near("exact objective identity", objective(candidate, reference, rewards, beta),
         beta * optimum["log_normalizer"] - beta * kl(candidate, optimum["policy"]))
    unsupported = tilted([.6, .4, 0], rewards, beta)
    near("zero reference support stays zero", unsupported["policy"][2], 0)
    assert math.isinf(kl([.2, .3, .5], [.6, .4, 0]))
    checks.append("positive policy on absent reference support has infinite KL")
    shared = shared_step()
    assert shared["after"][0] < shared["before"][0]
    assert shared["after"][1] < shared["before"][1]
    assert shared["after_loss"]["relative_margin"] > shared["before_loss"]["relative_margin"]
    checks.append("shared parameter improves relative margin while both masses fall")
    unchanged = shared_step(rate=0)
    assert unchanged["before"] == unchanged["after"]
    checks.append("zero step is a true null")
    repeated = label_optimum(8, 2)
    near("repeated-label optimum slope", finite_difference(lambda z: label_loss(z, .8), repeated["finite_logit"]), 0)
    near("tie labels", label_optimum(5, 5)["finite_logit"], 0)
    assert label_optimum(10, 0)["finite_logit"] is None
    checks.append("deterministic labels have no finite optimum")
    length = {"chosen_gain": .9, "rejected_gain": 1.2, "chosen_length": 3, "rejected_length": 6,
              "sum_margin": .9 - 1.2, "mean_margin": .9 / 3 - 1.2 / 6}
    near("sum margin", length["sum_margin"], -.3)
    near("mean margin", length["mean_margin"], .1)
    recovered = [beta * math.log(p / q) + beta * optimum["log_normalizer"]
                 for p, q in zip(optimum["policy"], reference)]
    near("same-prompt normalizer cancels", recovered[0] - recovered[1], rewards[0] - rewards[1])
    another = tilted(reference, [2., 0., -1.], beta)
    raw_cross_prompt = beta * math.log(optimum["policy"][0] / reference[0]) - beta * math.log(another["policy"][1] / reference[1])
    near("different-prompt constants must be retained", raw_cross_prompt + beta * (
        optimum["log_normalizer"] - another["log_normalizer"]), 1.)
    near("conservative labels have finite optimum", finite_difference(lambda z: label_loss(z, .9), math.log(9)), 0)
    ipo_beta = .4
    ipo_target = 1 / (2 * ipo_beta)
    near("IPO squared log-ratio target", (ipo_target - 1 / (2 * ipo_beta)) ** 2, 0)
    return {"kind": "constructed exact mechanisms", "four_scores": example,
            "tilted": optimum, "shared_parameter": shared, "repeated_labels": repeated,
            "length_reduction": length, "different_prompt_raw_gap": raw_cross_prompt,
            "ipo": {"beta": ipo_beta, "target": ipo_target}, "checks": checks}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("algebra-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": len(result["checks"]), "four_scores": result["four_scores"]}, indent=2))


if __name__ == "__main__":
    main()
