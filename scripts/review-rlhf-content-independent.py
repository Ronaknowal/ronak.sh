"""Different review: retained-result reconstruction and changed-state probes.

No training loop, native study run(), or optimizer step is invoked.
"""
import ast
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import sys

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback"
PUBLIC = ROOT / "public/learn/examples/rlhf"
sys.path.insert(0, str(PUBLIC))
import preference_records as records_program
import pairwise_reward as pairwise
import token_credit as credit

checks = []


def check(condition, name):
    if not bool(condition):
        raise AssertionError(name)
    checks.append(name)


def close(actual, expected, name, atol=1e-10):
    check(np.allclose(actual, expected, atol=atol, rtol=0), name)


def read(name):
    return json.loads((BASE / "study" / (name + ".json")).read_text(encoding="utf-8"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


manifest = json.loads((BASE / "content-inputs.json").read_text(encoding="utf-8"))
bindings = []
for item in manifest["files"]:
    path = ROOT / item["path"]
    actual = sha(path)
    bindings.append({"path": item["path"], "expected": item["sha256"], "actual": actual})
    check(actual == item["sha256"], "input bound: " + item["path"])

for path in sorted(PUBLIC.glob("*.py")):
    ast.parse(path.read_text(encoding="utf-8"))
    check(True, "complete Python parse: " + path.name)

record_file = json.loads((PUBLIC / "records.json").read_text(encoding="utf-8"))
records = record_file["records"]
check(len(records) == 492, "all 492 actual released comparisons retained")
check(records_program.audit(records) == record_file["audit"], "reconstructed split/count audit")
for row in records:
    extracted, reason = records_program.extract(
        {"chosen": row["original_chosen"], "rejected": row["original_rejected"]}, row["row_id"]
    )
    check(reason == "eligible" and extracted == row, "original text, role, family, split: " + str(row["row_id"]))

observed = read("pairwise")
training = [row for row in records if row["split"] == "train"]
heldout = [row for row in records if row["split"] == "heldout"]
check(pairwise.vocabulary(training) == observed["vocabulary"], "vocabulary uses training responses only")
weights = np.array(observed["weights"])
by_id = {row["row_id"]: row for row in records}
for predicted in observed["predictions"]:
    row = by_id[predicted["row_id"]]
    chosen = pairwise.features(row["prompt"], row["chosen"], observed["vocabulary"]) @ weights
    rejected = pairwise.features(row["prompt"], row["rejected"], observed["vocabulary"]) @ weights
    close([chosen, rejected, chosen - rejected],
          [predicted["chosen_score"], predicted["rejected_score"], predicted["gap"]],
          "reconstructed reward scores: " + str(row["row_id"]))
    close(pairwise.sigmoid(chosen - rejected), predicted["chosen_probability"],
          "reconstructed preference probability: " + str(row["row_id"]))
for split in ("train", "heldout"):
    gaps = np.array([row["gap"] for row in observed["predictions"] if row["split"] == split])
    for key, value in pairwise.metrics(gaps).items():
        close(value, observed[split][key], "retained pairwise " + split + " " + key)
oriented = [(row["chosen_probability"], 1) for row in observed["predictions"] if row["split"] == "heldout"]
oriented += [(1 - p, 0) for p, _ in oriented.copy()]
check(len(oriented) == 326, "both orientations of 163 dependent pairs")
for bucket in observed["probability_bins"]:
    values = [(p, y) for p, y in oriented if bucket["lower"] <= p < bucket["upper"] or bucket["upper"] > .999 and p == 1]
    check(len(values) == bucket["oriented_count"], "bin membership " + str(bucket["lower"]))
    if values:
        close(np.mean([p for p, _ in values]), bucket["mean_probability"], "bin probability " + str(bucket["lower"]))
        close(np.mean([y for _, y in values]), bucket["label_fraction"], "bin label fraction " + str(bucket["lower"]))

ppo = read("token_ppo")
tokens = ppo["tokens"]


def verify_summary(summary, label):
    rows = summary["outputs"]
    for i, row in enumerate(rows):
        response = row["response_ids"]
        check(" ".join(tokens[j] for j in response) == row["response"], label + " decode " + str(i))
        check(len(response) == row["length"] and 1 <= len(response) <= 8, label + " action length " + str(i))
        check((response[-1] == 2) == row["eos"], label + " EOS role " + str(i))
        check(any(j in (0, 1) for j in response) == row["malformed"], label + " malformed role " + str(i))
        prompt = row["prompt"].split()
        country = 5 if prompt[-1] == "France" else 6
        capital = 7 if country == 5 else 8
        expected = [capital, 2] if prompt[1] == "one" else [capital, 9, 10, 11, country, 12, 2]
        check(int(response == expected) == row["criterion"], label + " exact criterion " + str(i))
    close(sum(row["proxy"] for row in rows) / len(rows), summary["proxy_mean"], label + " proxy mean", 1e-6)
    close(sum(row["criterion"] for row in rows) / len(rows), summary["criterion_fraction"], label + " criterion rate")
    close(sum(row["length"] for row in rows) / len(rows), summary["mean_length"], label + " mean length")
    check(sum(row["eos"] for row in rows) == summary["eos_count"], label + " EOS count")
    check(sum(row["malformed"] for row in rows) == summary["malformed_count"], label + " malformed count")


check(len(ppo["evaluations"]) == 5 and len(ppo["history"]) == 20, "complete frozen evaluation and training-round traces")
for evaluation in ppo["evaluations"]:
    verify_summary(evaluation, "evaluation " + str(evaluation["round"]))
for round_record in ppo["history"]:
    verify_summary(round_record["collection"], "collection " + str(round_record["round"]))
    updates = round_record["updates"]
    check(len(updates) == 16, "four epochs by four minibatches round " + str(round_record["round"]))
    check(Counter(row["epoch"] for row in updates) == Counter({0: 4, 1: 4, 2: 4, 3: 4}),
          "epoch coverage round " + str(round_record["round"]))
    # Float32 forwards with different batch sizes round rare log probabilities
    # differently. Inspect the full recorded bounds, not a bitwise ratio claim.
    check(abs(updates[0]["ratio_min"] - 1) < 3e-6 and abs(updates[0]["ratio_max"] - 1) < 3e-6,
          "same-policy first minibatch ratio round " + str(round_record["round"]))

trace = ppo["first_rollout"]
valid = np.array(trace["valid"], dtype=bool)
old = np.array(trace["old_logp"])
ref = np.array(trace["reference_logp"])
reward = np.array(trace["rewards"])
values = np.array(trace["old_values"])
advantages = np.array(trace["advantages"])
for b, mask in enumerate(valid):
    n = int(mask.sum())
    check(mask.tolist() == [True] * n + [False] * (len(mask) - n), "right-padded action validity " + str(b))
    check(n == trace["action_lengths"][b] == trace["lengths"][b] - trace["prompt_lengths"][b], "action role count " + str(b))
    shaped = -.1 * (old[b] - ref[b]) * mask
    shaped[n - 1] += trace["reward_score"][b]
    close(shaped, reward[b], "exact shaped terminal rewards " + str(b), 7e-7)
    delta = [reward[b, t] + (values[b, t + 1] if t + 1 < n else 0) - values[b, t] for t in range(n)]
    expected = [sum(.95 ** (j - t) * delta[j] for j in range(t, n)) for t in range(n)]
    close(expected, advantages[b, :n], "expanded retained GAE " + str(b), 3e-6)
    close(np.where(mask, advantages[b] + values[b], 0), trace["targets"][b], "raw critic target " + str(b), 3e-6)
normalized = (advantages[valid] - advantages[valid].mean()) / np.sqrt(advantages[valid].var() + 1e-8)
close(normalized, np.array(trace["normalized_advantages"])[valid], "global valid-only rollout normalization", 3e-6)

reward_result = read("reward_trainer")
report = read("reward_trainer-report")
predictions = reward_result["predictions"]
check(len(predictions) == 64, "all actual TRL heldout predictions retained")
for prediction in predictions:
    close(prediction["chosen_score"] - prediction["rejected_score"], prediction["gap"], "TRL score difference " + str(prediction["row_id"]), 3e-8)
    close(pairwise.sigmoid(prediction["gap"]), prediction["probability"], "TRL preference probability " + str(prediction["row_id"]), 1e-7)
    close(np.logaddexp(0, -prediction["gap"]), prediction["bce"], "TRL pair loss " + str(prediction["row_id"]), 1e-7)
gaps = np.array([row["gap"] for row in predictions])
metric = pairwise.metrics(gaps)
for key in ("pairs", "accuracy_ties_half", "bce_nats", "brier"):
    close(metric[key], report["heldout_metrics"][key], "report-only direct heldout " + key,
          1e-7 if key in ("bce_nats", "brier") else 1e-12)
close(np.mean([row["bce"] for row in predictions]), report["heldout_metrics"]["bce_nats"],
      "exact summary of retained float32 pair losses")
close(np.mean([(1 - row["probability"]) ** 2 for row in predictions]), report["heldout_metrics"]["brier"],
      "exact summary of retained float32 probabilities")
check(report["predecessor_sha256"] == sha(BASE / "study/reward_trainer.json"), "report predecessor bound")


class StripReporting(ast.NodeTransformer):
    def visit_Import(self, node):
        return None if [item.name for item in node.names] == ["statistics"] else node

    def visit_Expr(self, node):
        if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == "log":
            return None
        return self.generic_visit(node)

    def visit_Dict(self, node):
        retained = [(key, value) for key, value in zip(node.keys, node.values)
                    if not isinstance(key, ast.Constant) or key.value != "heldout_metrics"]
        node.keys = [key for key, _ in retained]
        node.values = [value for _, value in retained]
        return self.generic_visit(node)


def science_ast(path):
    return ast.dump(StripReporting().visit(ast.parse(path.read_text(encoding="utf-8"))), include_attributes=False)


check(science_ast(PUBLIC / "reward_trainer.py") == science_ast(BASE / "study/executed-reward_trainer.py"),
      "reporting successor conserves every non-reporting AST node")

# Changed numeric states, not another invocation of the frozen study programs.
torch.set_num_threads(2)
for z, r, reference, beta in (([.3, -.7, 1.1], [2., -1., .5], [.2, .3, .5], .4),
                              ([-2., .4, .1], [-1., 3., 0.], [.6, .2, .2], 1.2)):
    logits = torch.tensor(z, dtype=torch.float64, requires_grad=True)
    p = logits.softmax(-1)
    rewards = torch.tensor(r, dtype=torch.float64)
    q = torch.tensor(reference, dtype=torch.float64)
    objective = (p * rewards).sum() - beta * (p * (p.log() - q.log())).sum()
    derivative = torch.autograd.grad(objective, logits)[0]
    adjusted = rewards - beta * (p.detach().log() - q.log())
    expected = p.detach() * (adjusted - (p.detach() * adjusted).sum())
    close(derivative.numpy(), expected.numpy(), "changed exact KL objective gradient " + str(beta))
    score = torch.eye(3, dtype=torch.float64) - p.detach()[None, :]
    estimates = score * rewards[:, None]
    centered = score * (rewards - 5)[:, None]
    close((p.detach()[:, None] * estimates).sum(0).numpy(),
          (p.detach()[:, None] * centered).sum(0).numpy(), "changed action-independent baseline expectation " + str(beta))

for advantage in (-3., 3.):
    for ratio in (.5, .9, 1.3):
        x = torch.tensor(ratio, dtype=torch.float64, requires_grad=True)
        surrogate = torch.minimum(x * advantage, x.clamp(.8, 1.2) * advantage)
        slope = torch.autograd.grad(surrogate, x)[0].item()
        expected_slope = 0 if advantage > 0 and ratio > 1.2 or advantage < 0 and ratio < .8 else advantage
        close(slope, expected_slope, "changed signed clipping slope " + str((advantage, ratio)))

mask = torch.tensor([[True, True, True, False], [True, True, False, False], [False] * 4])
r = torch.tensor([[.3, -.2, .8, 1e5], [-.1, .7, -2e4, 3e4], [1e4] * 4], dtype=torch.float64)
v = torch.tensor([[.2, .4, -.3, 1e5], [.5, .1, 8e4, -9e4], [-1e5] * 4], dtype=torch.float64)
bootstrap = torch.tensor([.6, -.4, .9], dtype=torch.float64)
for boot in (None, bootstrap):
    actual, targets = credit.gae(r, v, mask, gamma=.9, lam=.4, bootstrap=boot)
    for b, n in ((0, 3), (1, 2)):
        residuals = [r[b, t].item() + .9 * (v[b, t + 1].item() if t + 1 < n else 0 if boot is None else boot[b].item()) - v[b, t].item() for t in range(n)]
        expected = [sum(.36 ** (j - t) * residuals[j] for j in range(t, n)) for t in range(n)]
        close(actual[b, :n].numpy(), expected, "changed GAE expanded " + str((boot is None, b)))
        close(targets[b, :n].numpy(), np.array(expected) + v[b, :n].numpy(), "changed raw critic targets " + str((boot is None, b)))
    check(not actual[~mask].any(), "changed GAE padding and empty no-op " + str(boot is None))
    edited = actual.clone()
    edited[~mask] = 1e8
    check(torch.equal(credit.normalize_valid(actual, mask), credit.normalize_valid(edited, mask)), "changed normalize excludes padding " + str(boot is None))

ids = torch.tensor([[1, 3, 0, 2, 0], [1, 4, 5, 2, 2]])
valid = credit.action_mask(torch.tensor([2, 3]), torch.tensor([4, 5]), 5)
check(valid.tolist() == [[False, True, True, False], [False, False, True, True]], "changed roles score sampled PAD and EOS but omit padding")
torch.manual_seed(888)
logits = torch.randn(2, 5, 13, dtype=torch.float64, requires_grad=True)
labels = ids[:, 1:].clone()
labels[~valid] = -100
gathered = -credit.shifted_scores(logits, ids)[valid].mean()
native = torch.nn.functional.cross_entropy(logits[:, :-1].reshape(-1, 13), labels.reshape(-1), ignore_index=-100)
close(gathered.item(), native.item(), "changed single-shift role-mask CE")
g1 = torch.autograd.grad(gathered, logits, retain_graph=True)[0]
g2 = torch.autograd.grad(native, logits)[0]
close(g1.numpy(), g2.numpy(), "changed single-shift gradient parity")
check(not g1[:, -1].any() and not g1[:, :-1][~valid].any(), "no gradient reaches future or invalid positions")

result = {"status": "passed", "reviewer": "multimodal_reviewer", "fits_replayed": 0,
          "count": len(checks), "checks": checks, "bindings": bindings,
          "source_sha256": sha(Path(__file__)),
          "content_inputs_sha256": sha(BASE / "content-inputs.json"),
          "scope": "Whole current bindings/program parse; all retained real pair predictions, all token collection/evaluation strings and first-rollout arithmetic; reporting AST equivalence; changed native KL/baseline/PPO/mask/GAE probes. Frozen fits and native library trainer closure reused."}
(BASE / "content-independent-probes.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: result[key] for key in ("status", "count", "fits_replayed", "source_sha256", "content_inputs_sha256")}, indent=2))
