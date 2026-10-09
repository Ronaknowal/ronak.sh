"""Independently recompute the changed-input practice cases without fitting."""

import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
checks = []
results = {}


def check(condition, description):
    assert condition, description
    checks.append(description)


def close(actual, expected, description, tolerance=1e-8):
    check(math.isclose(actual, expected, rel_tol=0, abs_tol=tolerance), description)


def sigmoid(value):
    return 1 / (1 + math.exp(-value))


def derivative(function, value):
    step = 1e-5
    return (function(value + step) - function(value - step)) / (2 * step)


mapped = [.65, 1 - .20]
results["1"] = {"target": sum(mapped) / 2, "gap": abs(mapped[0] - mapped[1])}
close(results["1"]["target"], .725, "P1 mapped identity target")
close(results["1"]["gap"], .15, "P1 mapped order gap")

q, p = .6, .25
gap = math.log(p / (1 - p))
soft = lambda g: -q * math.log(sigmoid(g)) - (1 - q) * math.log1p(-sigmoid(g))
weighted = lambda g: -q * math.log(sigmoid(g))
results["2"] = {"soft_loss": soft(gap), "hard_weighted_loss": weighted(gap),
                "soft_derivative": derivative(soft, gap), "hard_derivative": derivative(weighted, gap),
                "optimal_gap": math.log(q / (1 - q))}
close(soft(gap), .9468494456526467, "P2 both BCE terms")
close(derivative(soft, gap), -.35, "P2 finite-difference soft derivative")
close(derivative(weighted, gap), -.45, "P2 finite-difference weighted derivative")
close(sigmoid(results["2"]["optimal_gap"]), q, "P2 finite probability optimum")

matrix = [[.1, .3, .4, .2], [.6, .1, .1, .2], [.2, .5, .2, .1], [.25] * 4]
targets = [3, 0, 1, 2]
values = [row[target] for row, target in zip(matrix, targets)]
results["3"] = {"values": values, "sum": sum(math.log(x) for x in values),
                "cartesian_entries": len(matrix) * len(targets), "mask": [1, 1, 1, 1, 0]}
check(values == [.2, .6, .5, .25], "P3 exact aligned four selected values")
close(results["3"]["sum"], math.log(.015), "P3 own sum")
check(sum(results["3"]["mask"]) == 4 and results["3"]["mask"][3] == 1, "P3 genuine shared-ID EOS preserved")

tau = .25
h = (-3 - -4) - (-4 - -4.5)
c = 1 / (2 * tau)
results["4"] = {"h": h, "target": c, "loss": (h - c) ** 2,
                "derivative": derivative(lambda v: (v - c) ** 2, h), "scaled_h": tau * h,
                "published_derivative": derivative(lambda v: tau * (v - c) ** 2, h)}
close(h, .5, "P4 four-score subtraction")
close(results["4"]["loss"], 2.25, "P4 unprefactored square")
close(results["4"]["derivative"], -3, "P4 raw-coordinate derivative")
close(results["4"]["published_derivative"], -.75, "P4 published prefactor")

q = 3 / 5
h = c * (2 * q - 1)
expected = lambda v: q * (v - c) ** 2 + (1 - q) * (v + c) ** 2
results["5"] = {"h": h, "minimum": expected(h), "derivative_at_optimum": derivative(expected, h)}
close(h, .4, "P5 noisy target")
close(expected(h), 3.84, "P5 unavoidable residual")
close(derivative(expected, h), 0, "P5 actual stationary point")

policies = [[.3, .1, .6], [.6, .2, .2]]
for policy in policies:
    close(sum(policy), 1, "P6 normalized policy")
    close(math.log(policy[0] / policy[1]), math.log(3), "P6 identical observed margin")
results["6"] = {"policies": policies, "observed_loss": 0, "unobserved_mass": [.6, .2]}

cyclic = [[.5, 1, 0], [0, .5, 1], [1, 0, .5]]
means = [sum(row) / 3 for row in cyclic]
raw = [math.exp(mean / .7) / 3 for mean in means]
policy = [value / sum(raw) for value in raw]
results["7"] = {"means": means, "policy": policy}
check(means == [.5] * 3, "P7 cyclic uniform expected preferences")
check(all(math.isclose(value, 1 / 3) for value in policy), "P7 normalized identity optimum")

products = [.4 ** 3, .5 ** 2]
geometric = [math.exp(3 * math.log(.4) / 3), math.exp(2 * math.log(.5) / 2)]
margin = math.log(geometric[0] / (1 - geometric[0])) - math.log(geometric[1] / (1 - geometric[1]))
results["8"] = {"products": products, "geometric": geometric, "margin": margin,
                "probability": sigmoid(margin), "loss": math.log1p(math.exp(-margin))}
close(sigmoid(margin), .4, "P8 numeric odds comparison")
close(results["8"]["loss"], -math.log(.4), "P8 complete contrast loss")

def combined(theta, weight):
    return -math.log(sigmoid(theta)) + weight * math.log1p(math.exp(2 * theta))

results["9"] = {str(weight): {"gradient": derivative(lambda t: combined(t, weight), 0),
                             "step": -.05 * derivative(lambda t: combined(t, weight), 0)}
                for weight in [.2, .5, .8]}
for weight, desired in [(.2, -.3), (.5, 0), (.8, .3)]:
    close(results["9"][str(weight)]["gradient"], desired, "P9 shared-weight finite derivative")

rating = .2 * 2 + .3 * 6 + .5 * 9
results["10"] = {"expected_rating": rating, "mapped_reward": 2 * (rating - 1) / 9 - 1}
close(rating, 6.7, "P10 expectation")
close(results["10"]["mapped_reward"], 4 / 15, "P10 signed reward")

prompt = [[-2, -6], [-2]]
response = [[-1, -3], [-5]]
full = [a + b for a, b in zip(prompt, response)]
results["11"] = {"full_nll": -sum(map(sum, full)) / sum(map(len, full)),
                 "response_token_nll": -sum(map(sum, response)) / sum(map(len, response)),
                 "response_equal_nll": sum(-sum(row) / len(row) for row in response) / 2}
close(results["11"]["full_nll"], 19 / 6, "P11 exact full numerator and denominator")
close(results["11"]["response_token_nll"], 3, "P11 response token denominator")
close(results["11"]["response_equal_nll"], 3.5, "P11 equal response denominator")

results["12"] = {"existing_reports_comparable": False, "solution": "paired records, common score unit, fixed terminal rule; independent generation evaluation for quality"}
results["13"] = {"known_complete_pairs": 2, "planned_pairs": 3, "known_passes": 5,
                 "planned_passes": 6, "targets": [.5, .5, None], "known_gaps": [1, 1]}
check(results["13"]["targets"][-1] is None, "P13 no fabricated aggregate from missing pass")
results["14"] = {"new_fit_performed": False, "solution": "prospective named mask/reduction variant, same-state native gradient/update agreement, all outcomes and proxy limits"}

manuscript = (TOPIC / "lesson.md").read_bytes()
output = {"status": "passed", "scientific_reexecution": False, "passed": len(checks),
          "manuscript_sha256": hashlib.sha256(manuscript).hexdigest(),
          "checks": checks, "changed_inputs": results}
(TOPIC / "practice-checks.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in output.items() if k not in ["checks", "changed_inputs"]}, indent=2))
