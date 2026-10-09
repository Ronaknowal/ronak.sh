"""Verify numerical contracts without replaying unchanged model fits/generation."""
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scratch/constitutional-ai/ml-packages"))
import numpy as np
import torch
import torch.nn.functional as F

PUBLIC = ROOT / "public/learn/examples/constitutional-ai"
EVIDENCE = ROOT / "docs/teaching/llm-architecture-training/constitutional-ai-cai/native-evidence"
checks = []


def load_program(name):
    spec = importlib.util.spec_from_file_location(name, PUBLIC / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def check(name, condition):
    checks.append({"name": name, "passed": bool(condition)})
    if not condition:
        raise AssertionError(name)


def close(name, actual, expected, tolerance=1e-9):
    check(name, np.allclose(actual, expected, atol=tolerance, rtol=tolerance))


def rejects(name, function):
    try:
        function()
    except ValueError:
        check(name, True)
    else:
        check(name, False)


records = load_program("constitutional_records")
labels = load_program("preference_labels")
reward = load_program("preference_model")
policy = load_program("policy_learning")
audit = load_program("audit_cai_data")

rejects("empty criterion", lambda: records.Principle("P", "scope", "", "alternative").instruction())
rejects("missing original prompt", lambda: records.critique_prompt("", "draft", records.Principle("P", "scope", "criterion", "alternative")))
check("zero rounds has no SFT targets", records.sft_records([]) == [])
for value in [0.0, .2, .5, .9, 1.0]:
    close(f"soft identity {value}", labels.transform_label(value), value)
    close(f"clamp {value}", labels.transform_label(value, "clamped"), np.clip(value, .4, .6))
    close(f"complementary order {value}", labels.mapped_order_average(value, 1-value)["mean_for_r1"], value)
check("missing pass stays unknown", labels.mapped_order_average(.7, None)["mean_for_r1"] is None)
rejects("reversed clamp", lambda: labels.transform_label(.5, "clamped", .8, .2))
close("extreme conditional logits", labels.option_probability(-10000, -10001), 1/(1+math.exp(-1)))
empty = labels.calibration([])
check("empty calibration metrics unknown", empty["brier"] is None and all(r["mean_q"] is None for r in empty["bins"]))
close("Brier from known rows", labels.calibration([{"q": .1, "label": 0}, {"q": .9, "label": 1}])["brier"], .01)
close("majority exact independent enumeration", labels.majority_error(.2), .104)
close("shared error unchanged", labels.majority_error(.2, True), .2)
close("GAC product", labels.group_aware_consensus([.9,.2]), .18)
check("unknown group probability", labels.group_aware_consensus([.9,None]) is None)

rng = np.random.default_rng(37)
for index in range(24):
    a, b = rng.normal(size=(2, 5, 3))
    weights = rng.normal(size=3)
    targets = rng.uniform(size=5)
    loss, gradient, probability = reward.preference_loss(weights, a, b, targets)
    torch_weights = torch.tensor(weights, dtype=torch.float64, requires_grad=True)
    torch_logits = torch.tensor(a-b, dtype=torch.float64) @ torch_weights
    torch_loss = F.binary_cross_entropy_with_logits(torch_logits, torch.tensor(targets, dtype=torch.float64))
    torch_loss.backward()
    close(f"reward loss {index}", loss, float(torch_loss.detach()))
    close(f"reward gradient {index}", gradient, torch_weights.grad.numpy())
    close(f"reward finite difference {index}", gradient, reward.finite_difference(weights, a, b, targets), 1e-6)
    logits = rng.normal(size=3)
    reference = policy.distribution(rng.normal(size=3))
    rewards = rng.normal(size=3)
    beta = rng.uniform(.1, 2)
    objective, analytic, probabilities = policy.kl_gradient(logits, reference, rewards, beta)
    torch_logits = torch.tensor(logits, dtype=torch.float64, requires_grad=True)
    torch_ref = torch.tensor(reference, dtype=torch.float64)
    torch_p = torch_logits.softmax(0)
    torch_log_ratio = torch_logits.log_softmax(0)-torch_ref.log()
    torch_objective = (torch_p*(torch.tensor(rewards)-beta*torch_log_ratio)).sum()
    torch_gradient, = torch.autograd.grad(torch_objective, torch_logits, retain_graph=True)
    close(f"policy objective {index}", objective, float(torch_objective.detach()))
    close(f"policy gradient {index}", analytic, torch_gradient.detach().numpy())
    loss, analytic, _ = policy.dpo_loss(logits, reference, 2, 0, beta, float(targets[0]))
    margin = beta*(torch_log_ratio[2]-torch_log_ratio[0])
    torch_loss = F.softplus(margin)-float(targets[0])*margin
    torch_gradient, = torch.autograd.grad(torch_loss, torch_logits)
    close(f"DPO loss {index}", loss, float(torch_loss.detach()))
    close(f"DPO gradient {index}", analytic, torch_gradient.detach().numpy())

rejects("positive policy mass outside reference support", lambda: policy.kl_objective([.3,.3,.4], [.5,.5,0], [0,0,1], 1))
close("excluded support optimum", policy.optimum([.75,.25,0], [0,0,1], 1), [.75,.25,0])
close("equal reward null", policy.optimum([.6,.2,.2], [2,2,2], 1), [.6,.2,.2])
close("beta zero tie limit", policy.optimum([.6,.2,.2], [1,0,1], 0), [.75,0,.25])
close("identical pair zero gradient", policy.dpo_loss([0,1,2], [.3,.3,.4], 1,1)[1], [0,0,0])
check("extreme SFT remains finite", math.isfinite(policy.sft_loss([10000,-10000], [0,1])[0]))
check("extreme DPO remains finite", math.isfinite(policy.dpo_loss([10000,-10000], [.5,.5], 1,0)[0]))

data = json.loads((PUBLIC / "cai_records.json").read_text(encoding="utf-8"))
result = audit.audit(data["rows"])
check("real duplicate indices", result["duplicate_indices"] == [40,77,78,80,82])
close("real subset duplicate fraction", result["duplicate_fraction"], .5)
check("empty data fraction unknown", audit.audit([])["duplicate_fraction"] is None)
critic = json.loads((EVIDENCE / "critic_outputs.json").read_text(encoding="utf-8"))
check("actual model parameter count", critic["parameters"] == 76961152)
for record in critic["records"]:
    for index, judge_pass in enumerate(record["judge_passes"]):
        for letter in ("a", "b"):
            option = judge_pass["option_"+letter]
            close(f"actual {record['id']} order{index} option{letter} token sum",
                  option["sequence_logprob"], sum(option["token_logprobs"]), 1e-6)
            check(f"actual {record['id']} option{letter} EOS", option["eos_included"] and option["token_ids"][-1] == 1)
        close(f"actual {record['id']} order{index} normalization", judge_pass["conditional_probability_a"],
              labels.option_probability(judge_pass["option_a"]["sequence_logprob"], judge_pass["option_b"]["sequence_logprob"]))
    close(f"actual {record['id']} identity mapping", record["revision_probability_mean"],
          ((1-record["judge_passes"][0]["conditional_probability_a"])+record["judge_passes"][1]["conditional_probability_a"])/2)

report = {"status": "passed", "checks": checks, "check_count": len(checks),
          "scope": "independent arithmetic/autograd contracts plus retained actual token/provenance outputs; no model fit/generation replay",
          "programs": [{"path": str(p.relative_to(ROOT)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                       for p in sorted(PUBLIC.glob("*.py"))],
          "inputs": [{"path": str(p.relative_to(ROOT)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                     for p in [PUBLIC / "cai_records.json", EVIDENCE / "critic_outputs.json"]]}
(EVIDENCE / "program-contract-checks.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({"status": "passed", "checks": len(checks)}, indent=2))
