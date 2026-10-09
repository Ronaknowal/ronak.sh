"""Complementary analytic/source checks for the design. No inference or fits."""
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
checks = []


def check(condition, name):
    assert condition, name
    checks.append(name)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def close(a, b):
    return math.isclose(a, b, rel_tol=1e-12, abs_tol=1e-12)


sigmoid = lambda x: 1 / (1 + math.exp(-x))
softplus = lambda x: max(x, 0) + math.log1p(math.exp(-abs(x)))
data = json.loads((TOPIC / "research/dataset/selected-data.json").read_text(encoding="utf-8"))
seen = set()
for split, size in (("train_prefs", 24), ("test_prefs", 12)):
    rows = data[split]
    check(len(rows) == size, f"{split}: frozen size")
    indices = [entry["row_idx"] for entry in rows]
    check(indices == sorted(indices), f"{split}: source order")
    for entry in rows:
        row = entry["row"]
        chosen, rejected = row["chosen"], row["rejected"]
        check(chosen[:-1] == rejected[:-1], f"{split}:{entry['row_idx']}: common context")
        check(chosen[-1]["role"] == rejected[-1]["role"] == "assistant",
              f"{split}:{entry['row_idx']}: actual response roles")
        check(row["prompt_id"] not in seen, f"{split}:{entry['row_idx']}: no duplicate prompt")
        seen.add(row["prompt_id"])
        counts = [len(re.findall(r"\w+|[^\w\s]", text)) for text in
                  [row["prompt"], chosen[-1]["content"], rejected[-1]["content"]]]
        check(counts == entry["lengths"] and counts[0] <= 64 and max(counts[1:]) <= 128,
              f"{split}:{entry['row_idx']}: full length contract")
        check(row["score_chosen"] > row["score_rejected"], f"{split}:{entry['row_idx']}: strict source labels")
check(digest(TOPIC / "research/dataset/selected-data.json") ==
      "e0b29d9055b9308473826238ca5f01272d0add6563057af0377ead35f5a44877", "exact selected data")
check(digest(TOPIC / "original/rlaif-ipo-orpo.jsx") ==
      "f8d71378557c157edd8ff5c434cbac06910702e446028f31545fb67750b1bbfa", "protected complete original")
check(digest(ROOT / "src/learn/data/topics/rlaif-ipo-orpo.jsx") ==
      digest(TOPIC / "original/rlaif-ipo-orpo.jsx"), "published original conserved")

fixtures = json.loads((TOPIC / "research/design-fixtures.json").read_text(encoding="utf-8"))
check(close(fixtures["order_target"], .7), "mapped order target")
check(close(fixtures["soft_BCE_at_half"], math.log(2)), "full soft BCE")
check(close(fixtures["winner_weighted_at_half"], .8 * math.log(2)), "weighted winner differs")
check(close(fixtures["direct_rating_reward"], 2 * (8.1 - 1) / 9 - 1), "single rating map")
for point in fixtures["ipo_points"]:
    h = point["h"]
    check(close(point["loss"], (h - 1) ** 2), f"IPO loss at {h}")
    check(close(point["gradient"], 2 * (h - 1)), f"IPO derivative at {h}")
    check(close(point["published_tau_scaled_gradient"], h - 1), f"published scaling at {h}")
    check(-.5 <= point["dpo_gradient"] < 0, f"bounded DPO margin derivative at {h}")
check(close(fixtures["noisy_IPO_optimum"], .4), "noisy IPO optimum")
check(close(fixtures["noisy_IPO_minimum"], .84), "irreducible contradictory loss")
check(close(fixtures["two_action_DPO_pA"], .784), "two action normalized DPO policy")
for row in fixtures["support_family"]:
    a, b, c = row["policy"]
    check(close(sum([a, b, c]), 1) and close(math.log(a / b), 1), "support family same margin")
check(close(sum(fixtures["identity_policy_tau_point1"]), 1), "identity tilt normalized")
check(max(range(4), key=fixtures["row_averages"].__getitem__) == 3, "published identity row winner")
check(close(fixtures["ORPO"]["loss"], softplus(-fixtures["ORPO"]["margin"])), "ORPO correct loss sign")
check(close(fixtures["ORPO"]["chosen_mean_log_derivative"], -1), "ORPO chosen derivative")
check(fixtures["ORPO"]["rejected_mean_log_derivative"] > 0, "ORPO rejected derivative")

matrix = [[.1, .2, .6, .1], [.1, .7, .1, .1], [.1, .2, .2, .5]]
targets = [2, 1, 3]
aligned = sum(math.log(row[token]) for row, token in zip(matrix, targets))
cartesian = sum(math.log(row[token]) for row in matrix for token in targets)
check(close(aligned, math.log(.21)), "new explicit three target gather")
check(not close(aligned, cartesian), "Cartesian sum is different")
coupling = []
for xa, xb, weight in [(1, 3, .1), (1, 3, .5), (1, 3, 1), (1, -1, .1)]:
    loss = lambda theta: softplus(-theta * xa) + weight * softplus(theta * (xb - xa))
    exact = -.5 * xa + weight * .5 * (xb - xa)
    step = 1e-6
    numerical = (loss(step) - loss(-step)) / (2 * step)
    check(math.isclose(exact, numerical, abs_tol=1e-9), f"shared weight {xa}/{xb}/lambda{weight}")
    coupling.append({"xA": xa, "xB": xb, "lambda": weight, "gradient": exact,
                     "theta_after_lr_point01": -.01 * exact})
practice = {"mapped_target": (.65 + 1 - .2) / 2, "order_gap": abs(.65 - .8),
            "BCE_q_point6_p_point25": -.6 * math.log(.25) - .4 * math.log(.75),
            "logit_gradient": .25 - .6, "IPO_loss": (.5 - 2) ** 2,
            "IPO_gradient": 2 * (.5 - 2), "noisy_optimum": 2 * (2 * .6 - 1),
            "noisy_minimum": 4 * 4 * .6 * .4, "rating_expected": .2 * 2 + .3 * 6 + .5 * 9,
            "rating_reward": 2 * (6.7 - 1) / 9 - 1}
check(close(practice["mapped_target"], .725), "practice mapping new inputs")
check(close(practice["noisy_minimum"], 3.84), "practice noisy square")
check(close(practice["rating_reward"], .2666666666666666), "practice direct reward")
design = (TOPIC / "design.md").read_text(encoding="utf-8")
for index in range(1, 36):
    check(f"**D{index:02d} / section" in design, f"individual drawing D{index:02d}")
result = {"status": "passed", "checks": len(checks), "conditions": checks,
          "scope": "Dataset/source guards and analytic design calculations only; zero fits/inference/runtime.",
          "new_gather": {"matrix": matrix, "targets": targets, "aligned_log_sum": aligned,
                         "cartesian_log_sum": cartesian}, "shared_weight": coupling, "practice": practice,
          "inputs": {str(path.relative_to(ROOT)).replace('\\', '/'): digest(path) for path in
                     [TOPIC / "design.md", TOPIC / "assessment.md", TOPIC / "claim-ledger.md",
                      TOPIC / "study-protocol.md", TOPIC / "research/design-fixtures.json",
                      TOPIC / "research/dataset/selected-data.json", Path(__file__)]}}
(TOPIC / "design-checks.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": result["status"], "checks": len(checks), "fits": 0}))
