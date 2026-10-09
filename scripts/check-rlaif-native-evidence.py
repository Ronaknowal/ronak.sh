"""Source-bound interpretation and no-fit conservation of the completed study."""

import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
EVIDENCE = TOPIC / "native-evidence"
checks = []


def load(name):
    return json.loads((EVIDENCE / name).read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(condition, name):
    assert condition, name
    checks.append(name)


def close(left, right, tolerance=1e-8):
    return math.isclose(left, right, rel_tol=0, abs_tol=tolerance)


freeze = load("prospective-freeze.json")
freeze_hash = digest(EVIDENCE / "prospective-freeze.json")
for name, expected in freeze["files"].items():
    path = EVIDENCE / name if name in ["prepared-inputs.json", "judge-prepared.json"] else PUBLIC / name
    check(digest(path) == expected["sha256"] and path.stat().st_size == expected["bytes"], name + " prospective source conserved")
stages = ["records", "losses", "finite", "feedback", "loop", "judge", "training", "native"]
for stage in stages:
    receipt = load(stage + "-receipt.json")
    check(receipt["status"] == "passed" and receipt["exit_code"] == 0, stage + " actual successful execution")
    check(receipt["inputs"]["prospective_freeze_sha256"] == freeze_hash, stage + " prospective identity")
    check(receipt["result_sha256"] == digest(EVIDENCE / (stage + "-results.json")), stage + " exact result bytes")
    for dependency, binding in receipt["dependencies"].items():
        check(binding["receipt_sha256"] == digest(EVIDENCE / (dependency + "-receipt.json")), stage + " dependency receipt")
        check(binding["result_sha256"] == digest(EVIDENCE / (dependency + "-results.json")), stage + " dependency result")

judge = load("judge-results.json")
judge_plan = load("judge-prepared.json")
check(judge["selected_ids"] == judge_plan["selected_ids"], "judge membership selected before inference")
for pair, prepared in zip(judge["comparisons"], judge_plan["comparisons"]):
    for scored, inputs in zip(pair["passes"], prepared["passes"]):
        check(scored["compiled_prompt"] == inputs["prompt"] and scored["encoder_ids"] == inputs["encoder_ids"], pair["id"] + " actual full prompt")
        logs = [option["sum_logp"] for option in scored["options"]]
        maximum = max(logs)
        weights = [math.exp(value - maximum) for value in logs]
        probabilities = [value / sum(weights) for value in weights]
        for option, expected in zip(scored["options"], ["1", "2"]):
            check(option["target_ids"] == judge_plan["option_target_ids"][expected], pair["id"] + " actual target IDs")
            check(close(sum(option["token_logps"]), option["sum_logp"], 1e-6), pair["id"] + " complete option sum")
        check(all(close(a, b) for a, b in zip(probabilities, scored["conditional_probabilities"])), pair["id"] + " conditional normalization")
    mapped = [pair["passes"][0]["conditional_probabilities"][0], pair["passes"][1]["conditional_probabilities"][1]]
    check(pair["mapped_chosen"] == mapped and close(sum(mapped) / 2, pair["target_chosen"]), pair["id"] + " mapped identity averaging")
    check(close(abs(mapped[0] - mapped[1]), pair["order_gap"]), pair["id"] + " order gap")
for rating in judge["ratings"]:
    probabilities = rating["conditional_probabilities"]
    expected = sum(index * value for index, value in enumerate(probabilities, 1))
    check(close(sum(probabilities), 1) and close(expected, rating["expected_rating"]), rating["response"] + " expected rating")
    check(close(2 * (expected - 1) / 9 - 1, rating["mapped_reward"]), rating["response"] + " mapped direct reward")

feedback = load("feedback-results.json")
check(len(feedback["history"]) == 65 and feedback["history"][-1]["step"] == 64, "one fixed64 reward-gap fit")
loop = load("loop-results.json")
check(loop["feedback_sha256"] == digest(EVIDENCE / "feedback-results.json"), "policy loop reuses exact fitted reward")
for route, history in loop["histories"].items():
    check(len(history) == 65 and all(row["step"] == index for index, row in enumerate(history)), route + " fixed64 steps")
    check(all(close(sum(row["probabilities"]), 1) for row in history), route + " normalized policies")

native = load("native-results.json")
for method in native["results"]:
    check(method["optimizer_updates"] == 1, method["method"] + " exact one native update")
    check(method["loss_difference"] < 3e-6 and method["max_gradient_difference"] < 3e-5,
          method["method"] + " same-state loss/all-gradients")
    check(method["max_one_update_parameter_difference"] < 3e-6, method["method"] + " actual SGD parity")

plan = load("prepared-inputs.json")
training = load("training-results.json")
check(training["fits"] == 15 and [row["seed"] for row in training["seeds"]] == [17, 29, 43], "all15 fixed fits/all3seeds")
summary = []
for seed in training["seeds"]:
    number = str(seed["seed"])
    check(len(seed["warm_updates"]) == 64, number + " warm64 updates")
    for method, result in seed["methods"].items():
        check(result["start_state_sha256"] == seed["warm_state_sha256"], number + method + " common warm state")
        check(len(result["updates"]) == 80, number + method + " terminal80 updates")
        for update, indices in zip(result["updates"], plan["schedules"][number]["continuation"]):
            check(update["ids"] == [plan["ids"]["train"][index] for index in indices], number + method + " conserved scheduled batch")
        check([point["step"] for point in result["checkpoints"]] == list(range(0, 81, 8)), number + method + " all declared checkpoints")
        for point in result["checkpoints"]:
            for split in ["train", "heldout"]:
                measured = point[split]
                rows = measured["records"]
                check([row["id"] for row in rows] == plan["ids"][split], number + method + " full " + split + " membership")
                total = sum(-row["chosen_sum"] for row in rows)
                count = sum(row["chosen_count"] for row in rows)
                check(close(total / count, measured["token_weighted_chosen_NLL"]), number + method + " declared token denominator")
                check(close(math.exp(total / count), measured["word_punctuation_EOS_PPL"]), number + method + " PPL exponent")
                for row in rows:
                    expected = ((row["chosen_sum"] - row["reference_chosen_sum"]) / row["chosen_count"]
                                - (row["rejected_sum"] - row["reference_rejected_sum"]) / row["rejected_count"])
                    check(close(expected, row["relative_mean_margin"], 2e-6), row["id"] + " own response-count gain")
                    check(close(row["chosen_sum"] / row["chosen_count"], row["chosen_mean"], 2e-6), row["id"] + " response mean")
        before, after = result["checkpoints"][0]["heldout"], result["checkpoints"][-1]["heldout"]
        summary.append({"seed": seed["seed"], "method": method,
                        "initial_chosen_NLL": before["token_weighted_chosen_NLL"],
                        "final_chosen_NLL": after["token_weighted_chosen_NLL"],
                        "final_PPL": after["word_punctuation_EOS_PPL"],
                        "final_mean_rank": after["ranks"]["mean_rank"],
                        "final_sum_rank": after["ranks"]["sum_rank"],
                        "final_relative_mean_rank": after["ranks"]["relative_mean_rank"],
                        "final_objective_mean": result["checkpoints"][-1]["train"]["objective_mean"],
                        "wall_seconds": result["wall_seconds"], "work": result["work"],
                        "heldout_chosen_unknowns": sum(row["chosen_unknowns"] for row in after["records"]),
                        "heldout_chosen_targets": after["chosen_targets"]})

result = {"status": "passed", "checks": len(checks), "conditions": checks,
          "scope": "Source/result conservation and complementary JSON arithmetic only; no inference or fitting replayed",
          "prospective_freeze_sha256": freeze_hash, "training_summary": summary,
          "judge_summary": [{key: row[key] for key in ["id", "mapped_chosen", "target_chosen", "order_gap"]}
                            for row in judge["comparisons"]],
          "ratings_summary": [{key: row[key] for key in ["response", "expected_rating", "mapped_reward"]}
                              for row in judge["ratings"]],
          "inputs": {path.relative_to(ROOT).as_posix(): digest(path) for path in
                     list(EVIDENCE.glob("*.json")) + [Path(__file__)]}}
target = TOPIC / "native-evidence-checks.json"
assert not target.exists(), "Preserve previous check; use a named successor for new scope"
target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": "passed", "checks": len(checks), "training_summary": summary}, indent=2))
