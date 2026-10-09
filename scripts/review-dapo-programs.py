"""Different whole DAPO program review: source guards and new finite fixtures.

No language model, trainer, scientific stage, optimizer step or sampling is run.
"""
import ast
import hashlib
import itertools
import json
import math
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization"
PUBLIC = ROOT / "public/learn-code/dapo"
sys.path.insert(0, str(PUBLIC))

import torch
from transformers import AutoTokenizer
from dapo_math import advantages, objective, scalar_loss_and_slope, length_penalty, select_loss_mask, integer_answer
from dapo_collect import collect, complete_groups
from train_dapo import prompt_plan, checkpoint
from sft_data import load_source, encode_record
from report_dapo import run as read_reports


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    checks = []
    findings = []
    def check(value, name):
        assert value, name
        checks.append(name)
    packet_path = DOC / "program-inputs.json"
    check(sha(packet_path) == "a208ae746b6927164777724a89cdd2a1e63ab4f97fb9d67d2d03af5a90a18fbf", "original program packet identity")
    packet = json.loads(packet_path.read_text(encoding="utf-8"))
    for name, expected in packet["files"].items():
        check(sha(ROOT / name) == expected, "local source identity " + name)
    for name, expected in packet["installed_sources"].items():
        check(sha(Path(name)) == expected, "installed source identity " + name)
    for source in PUBLIC.glob("*.py"):
        ast.parse(source.read_text(encoding="utf-8"))
        check(True, "whole source syntax " + source.name)
    torch.set_num_threads(1)
    # New values; do not invoke the author's prespecified finite mains.
    for a, ratio, dual in itertools.product([-2.1, .45], [.33, .92, 1.14, 1.26, 1.33, 15.9], [None, 3.7]):
        value = torch.tensor([[math.log(ratio)]], dtype=torch.float64, requires_grad=True)
        loss, _ = objective(value, torch.zeros_like(value), torch.ones_like(value, dtype=torch.bool),
                            torch.tensor([a], dtype=torch.float64), dual_clip=dual)
        gradient, = torch.autograd.grad(loss, value)
        expected, slope = scalar_loss_and_slope(ratio, a, dual_clip=dual)
        check(abs(float(loss.detach()) - expected) < 2e-12, f"signed/dual loss {a}/{ratio}/{dual}")
        check(abs(float(gradient) - slope) < 2e-12, f"signed/dual logp derivative {a}/{ratio}/{dual}")
    value = torch.tensor([[0., float("nan")], [.1, float("inf")]], dtype=torch.float64, requires_grad=True)
    old = torch.tensor([[0., float("nan")], [0., float("inf")]], dtype=torch.float64)
    mask = torch.tensor([[1, 0], [1, 0]], dtype=torch.bool)
    loss, _ = objective(value, old, mask, torch.tensor([.5, -.2]))
    gradient, = torch.autograd.grad(loss, value)
    check(bool(torch.isfinite(loss)), "unselected invalid cells do not corrupt scalar")
    check(bool(torch.isfinite(gradient).all()) and bool((gradient[:, 1] == 0).all()), "unselected invalid cells have zero finite derivatives")
    for values in [[-2., 0., 1., 5.], [3., 3., 3., 3.]]:
        rewards = torch.tensor(values, dtype=torch.float64)
        actual, statistics = advantages(rewards)
        expected = (rewards - rewards.mean()) / (rewards.std(correction=1) + 1e-6)
        check(torch.allclose(actual, expected, atol=1e-13, rtol=0), "sample SD coefficients " + str(values))
        check(abs(float(actual.sum())) < 1e-12, "centered group sum " + str(values))
    lp = torch.tensor([[.08, -.03, .1], [-.06, .11, 0.]], dtype=torch.float64, requires_grad=True)
    mask = torch.tensor([[1, 1, 1], [1, 0, 0]], dtype=torch.bool)
    a = torch.tensor([.4, -.7], dtype=torch.float64)
    whole, _ = objective(lp, torch.zeros_like(lp), mask, a)
    parts = sum(objective(lp[i:i+1], torch.zeros_like(lp[i:i+1]), mask[i:i+1], a[i:i+1], normalizer=4)[0] for i in range(2))
    check(abs(float((whole - parts).detach())) < 1e-14, "shared denominator partitions conserve scalar")
    g1, = torch.autograd.grad(whole, lp, retain_graph=True)
    g2, = torch.autograd.grad(parts, lp)
    check(torch.equal(g1, g2), "shared denominator partitions conserve all derivatives")
    for length in [0, 5, 6, 8, 10, 12, 14]:
        check(length_penalty(length, 12, 6) == max(-1., min(0., (6 - length) / 6)), "changed length penalty " + str(length))
    masked = select_loss_mask(torch.ones((2, 3), dtype=torch.bool), [True, False], True)
    check(masked.tolist() == [[True]*3, [False]*3], "termination mask independent of reward values")
    for text, expected in [(r"\boxed{-003}", -3), (r"\boxed{3} \boxed{3.0}", None),
                           (r"\boxed{3} \boxed{+ 3}", None), (r"\boxed{2e1}", None), (r"\boxed{+8}", 8)]:
        check(integer_answer(text) == expected, "declared parser fixture " + text)
    def group(batch, index, bits):
        identity = f"b{batch}g{index}"
        return [{"uid": identity + f"r{i}", "group_uid": identity, "id": index,
                 "prompt_ids": [3, index, 4], "correct": bit, "completion_ids": [i, 0],
                 "old_logps": [-1., -.4]} for i, bit in enumerate(bits)]
    batches = [group(0, 0, [True]*4) + group(0, 1, [True, False, False, False]),
               group(1, 2, [False]*4) + group(1, 3, [True, True, False, False])]
    partial = collect(lambda index: batches[index], target_groups=3, max_batches=2)
    check(partial["status"] == "exhausted" and len(partial["selected"]) == 8, "partial quota is exhausted with original selected groups retained")
    check(len(partial["candidates"]) == 2 and len(partial["decisions"]) == 4, "all candidate work and decisions retained")
    for row in partial["selected"]:
        check(row is next(item for batch in batches for item in batch if item["uid"] == row["uid"]), "literal whole-record join " + row["uid"])
    try:
        complete_groups([batches[0][0]] * 4, 4)
    except ValueError:
        check(True, "duplicate response IDs rejected")
    else:
        raise AssertionError("duplicate accepted")
    source = load_source(PUBLIC / "data")
    rows = sorted(source["train"], key=lambda row: row["id"])[:16]
    test = sorted(source["test"], key=lambda row: row["id"])[:32]
    check([row["id"] for row in rows] == packet["train_ids"], "actual fixed train IDs")
    check([row["id"] for row in test] == packet["test_ids"], "actual fixed test IDs")
    tokenizer = AutoTokenizer.from_pretrained(ROOT / packet["model_path"], local_files_only=True)
    model_config = json.loads((ROOT / packet["model_path"] / "config.json").read_text(encoding="utf-8"))
    for row in rows + test:
        encoded = encode_record(row, tokenizer)
        check(encoded["ids"][:encoded["boundary"]] == encoded["prompt_ids"], "real tokenizer prefix " + row["split"] + str(row["id"]))
        check(encoded["ids"][-1] == tokenizer.eos_token_id and len(encoded["prompt_ids"]) + 8 <= model_config["max_position_embeddings"],
              "real EOS/context " + row["split"] + str(row["id"]))
    for seed in [73, 89, 101]:
        plan = prompt_plan(rows, seed)
        ids = [row["id"] for slot in plan for batch in slot for row in batch]
        check(len(ids) == 12 and len(set(ids)) == 12, "disjoint two-slot candidate schedule " + str(seed))
        check(plan == prompt_plan(rows, seed), "deterministic schedule " + str(seed))
    check(3 * (2*1 + 2*3) * 2 * 4 * 8 == packet["budget"]["scratch_max_new_training_tokens"], "prospective generation bound1536")
    check(3 * 2 * 2 * 2 == packet["budget"]["scratch_max_updates"], "prospective maximum24 updates")
    # Supplied tensor state only: inspect what the actual checkpoint retains.
    class SuppliedState:
        def state_dict(self):
            return {"weight": torch.tensor([.1])}
    class SuppliedOptimizer:
        def state_dict(self):
            return {"state": {}, "param_groups": [{"lr": .0001}]}
    with tempfile.TemporaryDirectory(prefix="dapo-review-") as temporary:
        path = Path(temporary) / "latest.pt"
        checkpoint(path, SuppliedState(), SuppliedOptimizer(), {"slot": 1, "iteration": 1, "updates": 1})
        state = torch.load(path, weights_only=False)
        check(state["position"]["iteration"] == 1, "actual checkpoint stores completed iteration")
        check(torch.equal(state["model"]["weight"], torch.tensor([.1])), "actual checkpoint stores supplied tensor exactly")
        findings.append({"finding": "R1 continuation state gap", "actual_checkpoint_keys": list(state),
                         "batch_old_scores_advantages": "absent; require separate slot JSON that is saved after this checkpoint"})
    for name, expected in packet["files"].items():
        check(sha(ROOT / name) == expected, "source remains frozen " + name)
    receipt = {"status": "passed complementary conditions; R1 finding recorded separately", "conditions": len(checks),
               "checks": checks, "retention_observation": findings, "models_constructed": 0, "trainers_constructed": 0,
               "model_forwards": 0, "generation": 0, "optimizer_steps": 0, "scientific_stage_entry_points": 0,
               "tokenizer": "actual frozen checkpoint tokenizer only",
               "program_packet_sha256": sha(packet_path), "source_sha256": sha(Path(__file__))}
    target = DOC / "program-review-checks.json"
    with target.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, indent=2)
        stream.write("\n")
    print({"status": receipt["status"], "conditions": len(checks), "models": 0, "fits": 0})


if __name__ == "__main__":
    main()
